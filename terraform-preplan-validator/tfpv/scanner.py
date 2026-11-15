"""Terraform Scanner: discovers files, builds the module model and inventory,
and runs the checks that no engine covers before ``terraform plan``:

* required variables without any value (plan fails with -input=false);
* tfvars values that do not match the declared type (validate ignores values);
* local module paths that do not exist;
* offline fallbacks (undeclared references, missing module inputs, syntax)
  that are dropped automatically when ``terraform validate``/``fmt`` ran,
  because Terraform is the authority for those.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Any, Iterable

from .hcl.expr import UNKNOWN, Evaluator, Ref, ResourceRef, _traverse, literal, parse_tokens, references
from .hcl.parser import Attribute, Block, HclFile, parse_file
from .hcl.types import UNKNOWN_TYPE, check_value, parse_type
from .models import RawFinding

SKIP_DIRS = {".terraform", ".git", "node_modules", ".terragrunt-cache", "__pycache__", ".venv", "venv", ".idea", ".vscode", ".tfpv"}
COMMON_PROVIDERS = {"aws", "azurerm", "azuread", "google", "kubernetes", "helm", "random", "null", "tls", "local", "archive",
                    "time", "http", "external", "template", "cloudinit", "tfe", "github", "gitlab", "datadog", "vault", "consul"}
META_ARGS = {"source", "version", "count", "for_each", "providers", "depends_on"}
MAX_FILE_BYTES = 5 * 1024 * 1024


# ----------------------------------------------------------------------------
# Discovery
# ----------------------------------------------------------------------------
@dataclass
class ProjectFiles:
    root: Path
    tf: list[str] = field(default_factory=list)
    tf_json: list[str] = field(default_factory=list)
    tfvars: list[str] = field(default_factory=list)
    lock_file: bool = False
    tflint_config: str | None = None
    skipped_large: list[str] = field(default_factory=list)


def discover(root: Path) -> ProjectFiles:
    pf = ProjectFiles(root=root)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".terraform"))
        rel_dir = Path(dirpath).relative_to(root)
        for name in sorted(filenames):
            rel = PurePosixPath(rel_dir.as_posix(), name).as_posix().removeprefix("./")
            full = Path(dirpath, name)
            if name.endswith((".tf", ".tfvars", ".tf.json", ".tfvars.json")):
                try:
                    if full.stat().st_size > MAX_FILE_BYTES:
                        pf.skipped_large.append(rel)
                        continue
                except OSError:
                    continue
            if name.endswith(".tf"):
                pf.tf.append(rel)
            elif name.endswith(".tf.json"):
                pf.tf_json.append(rel)
            elif name.endswith((".tfvars", ".tfvars.json")):
                pf.tfvars.append(rel)
            elif name == ".terraform.lock.hcl" and rel_dir == Path("."):
                pf.lock_file = True
            elif name == ".tflint.hcl" and rel_dir == Path("."):
                pf.tflint_config = rel
    return pf


# ----------------------------------------------------------------------------
# Module model
# ----------------------------------------------------------------------------
@dataclass
class Module:
    dir: str
    files: dict[str, HclFile] = field(default_factory=dict)
    variables: dict[str, tuple[Block, str]] = field(default_factory=dict)
    locals: dict[str, tuple[Attribute, str]] = field(default_factory=dict)
    resources: dict[str, tuple[Block, str]] = field(default_factory=dict)
    data: dict[str, tuple[Block, str]] = field(default_factory=dict)
    module_calls: dict[str, tuple[Block, str]] = field(default_factory=dict)
    providers: list[tuple[Block, str]] = field(default_factory=list)
    outputs: dict[str, tuple[Block, str]] = field(default_factory=dict)
    terraform_blocks: list[tuple[Block, str]] = field(default_factory=list)
    other_blocks: list[tuple[Block, str]] = field(default_factory=list)
    json_files: list[str] = field(default_factory=list)  # .tf.json: inventory only

    def provider_names(self) -> set[str]:
        names = set(COMMON_PROVIDERS)
        for b, _ in self.providers:
            if b.labels:
                names.add(b.labels[0])
        for b, _ in self.terraform_blocks:
            for rp in b.children("required_providers"):
                names.update(rp.attributes)
        return names


def _add_block(mod: Module, b: Block, rel: str) -> None:
    t = b.type
    if t == "variable" and b.labels:
        mod.variables[b.labels[0]] = (b, rel)
    elif t == "locals":
        for name, a in b.attributes.items():
            mod.locals[name] = (a, rel)
    elif t == "resource" and len(b.labels) == 2:
        mod.resources[f"{b.labels[0]}.{b.labels[1]}"] = (b, rel)
    elif t == "data" and len(b.labels) == 2:
        mod.data[f"{b.labels[0]}.{b.labels[1]}"] = (b, rel)
    elif t == "module" and b.labels:
        mod.module_calls[b.labels[0]] = (b, rel)
    elif t == "provider":
        mod.providers.append((b, rel))
    elif t == "output" and b.labels:
        mod.outputs[b.labels[0]] = (b, rel)
    elif t == "terraform":
        mod.terraform_blocks.append((b, rel))
    else:
        mod.other_blocks.append((b, rel))


@dataclass
class Project:
    root: Path
    files: ProjectFiles
    modules: dict[str, Module]
    parsed: dict[str, HclFile]  # every parsed .tf / .tfvars, by relative path
    tfvars: dict[str, dict[str, tuple[Any, int]]]  # file -> var -> (value, line)
    auto_var_files: list[str]
    extra_var_files: list[str]

    @property
    def root_module(self) -> Module | None:
        return self.modules.get(".")

    def file_text(self, rel: str) -> str | None:
        hf = self.parsed.get(rel)
        if hf is not None:
            return hf.text
        try:
            p = (self.root / rel).resolve()
            p.relative_to(self.root.resolve())
            return p.read_text(encoding="utf-8", errors="replace")
        except (OSError, ValueError):
            return None

    def locate(self, rel: str | None, line: int | None) -> str | None:
        """Address of the top-level block containing (file, line)."""
        if not rel or not line:
            return None
        hf = self.parsed.get(rel)
        if hf is None:
            return None
        b = hf.block_at(line)
        if b is None or b.type not in ("resource", "data", "module", "variable", "output", "provider", "locals"):
            return None
        return b.address() if b.type != "locals" else "locals"


def _json_tf_inventory(text: str) -> dict[str, list[str]]:
    try:
        d = json.loads(text)
    except ValueError:
        return {}
    out: dict[str, list[str]] = {}
    for kind in ("resource", "data"):
        for rtype, items in (d.get(kind) or {}).items() if isinstance(d.get(kind), dict) else []:
            if isinstance(items, dict):
                out.setdefault(kind, []).extend(f"{rtype}.{n}" for n in items)
    return out


def load_project(root: Path, var_files: Iterable[str] = ()) -> Project:
    pf = discover(root)
    modules: dict[str, Module] = {}
    parsed: dict[str, HclFile] = {}
    for rel in pf.tf:
        hf = parse_file(root / rel, rel)
        parsed[rel] = hf
        d = PurePosixPath(rel).parent.as_posix()
        mod = modules.setdefault(d, Module(dir=d))
        mod.files[rel] = hf
        for b in hf.blocks:
            _add_block(mod, b, rel)
    for rel in pf.tf_json:
        d = PurePosixPath(rel).parent.as_posix()
        modules.setdefault(d, Module(dir=d)).json_files.append(rel)
    tfvars: dict[str, dict[str, tuple[Any, int]]] = {}
    for rel in pf.tfvars:
        tfvars[rel] = _read_tfvars(root / rel, rel, parsed)
    auto = [r for r in pf.tfvars if PurePosixPath(r).parent.as_posix() == "." and (
        PurePosixPath(r).name in ("terraform.tfvars", "terraform.tfvars.json") or r.endswith((".auto.tfvars", ".auto.tfvars.json")))]
    auto.sort(key=lambda r: (0 if PurePosixPath(r).name.startswith("terraform.tfvars") else 1, PurePosixPath(r).name.endswith(".json"), r))
    extra = []
    for vf in var_files:
        p = Path(vf)
        p = p if p.is_absolute() else (root / p)
        try:
            rel = p.resolve().relative_to(root.resolve()).as_posix()
        except ValueError:
            rel = p.as_posix()
        if rel not in tfvars and p.exists():
            tfvars[rel] = _read_tfvars(p, rel, parsed)
        extra.append(rel)
    return Project(root=root, files=pf, modules=modules, parsed=parsed, tfvars=tfvars, auto_var_files=auto, extra_var_files=extra)


def _read_tfvars(path: Path, rel: str, parsed: dict[str, HclFile]) -> dict[str, tuple[Any, int]]:
    if rel.endswith(".json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}
        return {k: (v, 1) for k, v in data.items()} if isinstance(data, dict) else {}
    hf = parse_file(path, rel)
    parsed[rel] = hf
    if hf.error:
        return {}
    return {name: (literal(a.tokens), a.line) for name, a in hf.attributes.items()}


# ----------------------------------------------------------------------------
# Evaluation scopes (one per module instance)
# ----------------------------------------------------------------------------
class ModuleScope:
    def __init__(self, module: Module, var_values: dict[str, Any], prefix: str = ""):
        self.module = module
        self.var_values = var_values
        self.prefix = prefix
        self._locals: dict[str, Any] = {}
        self._busy: set[str] = set()

    def evaluator(self) -> Evaluator:
        return Evaluator(self)

    def eval_attr(self, attr: Attribute | None) -> Any:
        if attr is None:
            return None
        return self.evaluator().eval(parse_tokens(attr.tokens))

    def var(self, name: str) -> Any:
        return self.var_values.get(name, UNKNOWN)

    def local(self, name: str) -> Any:
        if name in self._locals:
            return self._locals[name]
        if name in self._busy or name not in self.module.locals:
            return UNKNOWN
        self._busy.add(name)
        try:
            v = self.eval_attr(self.module.locals[name][0])
        finally:
            self._busy.discard(name)
        self._locals[name] = v
        return v

    def resource(self, rtype: str, name: str, path: list, data: bool) -> Any:
        key = f"{rtype}.{name}"
        table = self.module.data if data else self.module.resources
        if key not in table or not path or path[0][0] != "attr":
            return UNKNOWN
        block = table[key][0]
        if "count" in block.attributes or "for_each" in block.attributes:
            return UNKNOWN
        attr = path[0][1]
        address = f"{self.prefix}{'data.' if data else ''}{key}"
        if attr in block.attributes and attr not in ("id", "arn"):
            busy = f"{address}.{attr}"
            if busy in self._busy:
                return UNKNOWN
            self._busy.add(busy)
            try:
                v = self.eval_attr(block.attributes[attr])
            finally:
                self._busy.discard(busy)
            return _traverse(v, path[1:], self.evaluator())
        if len(path) == 1:
            return ResourceRef(address, attr)
        return UNKNOWN


@dataclass
class ModuleInstance:
    module: Module
    scope: ModuleScope
    prefix: str  # "" for root, "module.net." for children
    caller: str | None = None


def _var_default(block: Block) -> Any:
    a = block.attributes.get("default")
    return literal(a.tokens) if a else UNKNOWN


def root_var_values(project: Project, cli_vars: dict[str, str], env: dict[str, str]) -> tuple[dict[str, Any], dict[str, str]]:
    """Return (values, sources) for the root module variables. Values coming from
    the environment are not read (UNKNOWN): only their presence matters."""
    mod = project.root_module
    values: dict[str, Any] = {}
    sources: dict[str, str] = {}
    if mod is None:
        return values, sources
    for name, (block, _) in mod.variables.items():
        if "default" in block.attributes:
            values[name] = _var_default(block)
            sources[name] = "default"
        if f"TF_VAR_{name}" in env:
            values[name] = UNKNOWN
            sources[name] = "environment"
    for rel in project.auto_var_files + project.extra_var_files:
        for name, (v, _line) in project.tfvars.get(rel, {}).items():
            if name in mod.variables:
                values[name] = v
                sources[name] = rel
    for name, raw in cli_vars.items():
        if name in mod.variables:
            values[name] = raw
            sources[name] = "--var"
    return values, sources


def instances(project: Project, root_values: dict[str, Any], max_depth: int = 6) -> list[ModuleInstance]:
    """Root instance + one instance per local module call (recursively). Modules
    never called are evaluated standalone with their defaults."""
    out: list[ModuleInstance] = []
    called: set[str] = set()
    root = project.root_module

    def visit(mod: Module, values: dict[str, Any], prefix: str, caller: str | None, depth: int) -> None:
        scope = ModuleScope(mod, values, prefix)
        out.append(ModuleInstance(mod, scope, prefix, caller))
        if depth >= max_depth:
            return
        for name, (block, _rel) in mod.module_calls.items():
            src = literal(block.attributes["source"].tokens) if "source" in block.attributes else None
            if not isinstance(src, str) or not src.startswith(("./", "../")):
                continue
            child_dir = (PurePosixPath(mod.dir) / src).as_posix()
            child_dir = os.path.normpath(child_dir).replace("\\", "/")
            child = project.modules.get(child_dir)
            if child is None:
                continue
            called.add(child_dir)
            child_values: dict[str, Any] = {}
            for vname, (vblock, _) in child.variables.items():
                if vname in block.attributes:
                    child_values[vname] = scope.eval_attr(block.attributes[vname])
                elif "default" in vblock.attributes:
                    child_values[vname] = _var_default(vblock)
            if "count" in block.attributes or "for_each" in block.attributes:
                child_values = {k: UNKNOWN for k in child_values}
            visit(child, child_values, f"{prefix}module.{name}.", f"{prefix}module.{name}", depth + 1)

    if root is not None:
        visit(root, root_values, "", None, 0)
    for d, mod in sorted(project.modules.items()):
        if d == "." or d in called:
            continue
        if any(i.module is mod for i in out):
            continue
        vals = {n: _var_default(b) if "default" in b.attributes else UNKNOWN for n, (b, _) in mod.variables.items()}
        out.append(ModuleInstance(mod, ModuleScope(mod, vals, ""), "", None))
    return out


# ----------------------------------------------------------------------------
# Scanner checks
# ----------------------------------------------------------------------------
def _ref_line(hf: HclFile | None, attr: Attribute, needle: str) -> int:
    if hf is None:
        return attr.line
    lines = hf.text.splitlines()
    for ln in range(attr.line, min(attr.end_line, len(lines)) + 1):
        if needle in lines[ln - 1]:
            return ln
    return attr.line


def _walk_attrs(block: Block) -> Iterable[tuple[Attribute, set[str]]]:
    """Yield (attribute, local iterator names) for a block and its nested blocks."""
    def rec(b: Block, iters: set[str]):
        for a in b.attributes.values():
            yield a, iters
        for c in b.blocks:
            extra = set(iters)
            if c.type == "dynamic" and c.labels:
                extra.add(c.labels[0])
                it = c.attributes.get("iterator")
                if it:
                    v = literal(it.tokens)
                    if isinstance(v, str):
                        extra.add(v)
                    elif it.tokens and it.tokens[0].kind == "ident":
                        extra.add(it.tokens[0].value)
            yield from rec(c, extra)
    yield from rec(block, set())


def check_project(project: Project, root_values: dict[str, Any], sources: dict[str, str], env: dict[str, str]) -> tuple[list[RawFinding], int]:
    """Return (findings, number of passed checks)."""
    findings: list[RawFinding] = []
    passed = 0

    # Syntax (fallback: superseded by terraform fmt/validate when they ran)
    for rel, hf in sorted(project.parsed.items()):
        if hf.error:
            findings.append(RawFinding(
                engine="scanner", engine_rule="hcl_parse", rule_id="TF_SYNTAX_ERROR", message=f"Cannot parse {rel}: {hf.error.message}",
                file=rel, line=hf.error.line, fallback_for="terraform_fmt"))
        else:
            passed += 1

    root = project.root_module
    if root is not None:
        # Required variables without value
        defined_elsewhere: dict[str, list[str]] = {}
        for rel, vals in project.tfvars.items():
            if rel in project.auto_var_files or rel in project.extra_var_files:
                continue
            for name in vals:
                defined_elsewhere.setdefault(name, []).append(rel)
        for name, (block, rel) in sorted(root.variables.items()):
            if name in sources:
                passed += 1
                continue
            hint = ""
            if name in defined_elsewhere:
                hint = f" A value exists in {', '.join(defined_elsewhere[name])}, which Terraform does not load automatically: pass it with -var-file (and to tfpv with --var-file)."
            findings.append(RawFinding(
                engine="scanner", engine_rule="required_variable", rule_id="TF_MISSING_VARIABLE_VALUE",
                message=f'Variable "{name}" has no default and no value is provided (tfvars, --var-file, --var, TF_VAR_{name}).{hint}',
                file=rel, line=block.line, resource=f"var.{name}", attribute=name))
        # tfvars type checks (every tfvars file of the root, auto-loaded or not)
        root_dirs = {"."} | {d for d in project.modules if d != "."}
        for rel, vals in sorted(project.tfvars.items()):
            parent = PurePosixPath(rel).parent.as_posix()
            if parent != "." and parent in root_dirs:
                continue  # tfvars inside a module directory belong to that module
            for name, (value, line) in vals.items():
                if name not in root.variables:
                    if rel in project.auto_var_files or rel in project.extra_var_files:
                        findings.append(RawFinding(
                            engine="scanner", engine_rule="undeclared_variable_value", rule_id="TF_UNDECLARED_VARIABLE_VALUE",
                            message=f'"{rel}" sets "{name}", which is not declared by the root module.', file=rel, line=line, attribute=name))
                    continue
                vblock, vrel = root.variables[name]
                tattr = vblock.attributes.get("type")
                ttype = parse_type(parse_tokens(tattr.tokens)) if tattr else UNKNOWN_TYPE
                reason = check_value(value, ttype)
                if reason:
                    findings.append(RawFinding(
                        engine="scanner", engine_rule="variable_type", rule_id="TF_VARIABLE_TYPE_MISMATCH",
                        message=f'Invalid value for variable "{name}" in {rel}: {reason} (declared type: {ttype}, in {vrel}:{vblock.line}).',
                        file=rel, line=line, resource=f"var.{name}", attribute=name, value=value,
                        extra={"sensitive": _is_sensitive(vblock)}))
                else:
                    passed += 1

    # Module calls: local paths and required inputs
    for d, mod in sorted(project.modules.items()):
        for name, (block, rel) in sorted(mod.module_calls.items()):
            src_attr = block.attributes.get("source")
            src = literal(src_attr.tokens) if src_attr else None
            if not isinstance(src, str) or not src.startswith(("./", "../")):
                continue
            child_dir = os.path.normpath((PurePosixPath(d) / src).as_posix()).replace("\\", "/")
            target = (project.root / child_dir)
            has_tf = target.is_dir() and any(p.suffix == ".tf" or p.name.endswith(".tf.json") for p in target.iterdir())
            if not has_tf:
                findings.append(RawFinding(
                    engine="scanner", engine_rule="local_module_path", rule_id="TF_LOCAL_MODULE_NOT_FOUND",
                    message=f'Module "{name}": source "{src}" does not point to a directory containing .tf files.',
                    file=rel, line=src_attr.line, resource=f"module.{name}", attribute="source", value=src, fallback_for="terraform_init"))
                continue
            passed += 1
            child = project.modules.get(child_dir)
            if child is None:
                continue
            for vname, (vblock, _) in sorted(child.variables.items()):
                if "default" in vblock.attributes or vname in block.attributes:
                    continue
                findings.append(RawFinding(
                    engine="scanner", engine_rule="module_input", rule_id="TF_MODULE_MISSING_ARGUMENT",
                    message=f'Module "{name}" ({src}) requires input "{vname}", which is not set.',
                    file=rel, line=block.line, resource=f"module.{name}", attribute=vname, fallback_for="terraform_validate"))

    # Undeclared references (fallback for terraform validate)
    for d, mod in sorted(project.modules.items()):
        provs = mod.provider_names()
        tables: list[tuple[str, Iterable[tuple[Block, str]]]] = [
            ("resource", mod.resources.values()), ("data", mod.data.values()), ("module", mod.module_calls.values()),
            ("output", mod.outputs.values()), ("provider", mod.providers)]
        seen: set[tuple[str, int, str]] = set()
        for _kind, items in tables:  # noqa: B007
            for block, rel in items:
                hf = mod.files.get(rel)
                for attr, iters in _walk_attrs(block):
                    if attr.name in ("ignore_changes",):
                        continue
                    for ref in references(parse_tokens(attr.tokens)):
                        problem = _undeclared(ref, mod, provs, iters)
                        if not problem:
                            continue
                        line = _ref_line(hf, attr, problem[1])
                        key = (rel, line, problem[1])
                        if key in seen:
                            continue
                        seen.add(key)
                        findings.append(RawFinding(
                            engine="scanner", engine_rule="undeclared_reference", rule_id="TF_UNDECLARED_REFERENCE",
                            message=problem[0], file=rel, line=line, resource=block.address(), attribute=attr.name,
                            value=problem[1], fallback_for="terraform_validate"))
        for attr, rel in mod.locals.values():
            for ref in references(parse_tokens(attr.tokens)):
                problem = _undeclared(ref, mod, provs, set())
                if problem:
                    findings.append(RawFinding(
                        engine="scanner", engine_rule="undeclared_reference", rule_id="TF_UNDECLARED_REFERENCE",
                        message=problem[0], file=rel, line=_ref_line(mod.files.get(rel), attr, problem[1]),
                        resource="locals", attribute=attr.name, value=problem[1], fallback_for="terraform_validate"))
    return findings, passed


def _is_sensitive(block: Block) -> bool:
    a = block.attributes.get("sensitive")
    return bool(a and literal(a.tokens) is True)


def _undeclared(ref: Ref, mod: Module, provs: set[str], iters: set[str]) -> tuple[str, str] | None:
    root, path = ref.root, ref.path
    first = path[0][1] if path and path[0][0] == "attr" else None
    if root in iters or first is None:
        return None
    if root == "var":
        if first not in mod.variables:
            return (f'Reference to undeclared input variable "var.{first}".', f"var.{first}")
        return None
    if root == "local":
        if first not in mod.locals:
            return (f'Reference to undeclared local value "local.{first}".', f"local.{first}")
        return None
    if root == "module":
        if first not in mod.module_calls:
            return (f'Reference to undeclared module "module.{first}".', f"module.{first}")
        return None
    if root == "data":
        second = path[1][1] if len(path) > 1 and path[1][0] == "attr" else None
        if second and f"{first}.{second}" not in mod.data:
            return (f'Reference to undeclared data source "data.{first}.{second}".', f"data.{first}.{second}")
        return None
    if "_" in root and root.split("_", 1)[0] in provs and root not in iters:
        if f"{root}.{first}" not in mod.resources:
            return (f'Reference to undeclared resource "{root}.{first}".', f"{root}.{first}")
    return None


# ----------------------------------------------------------------------------
# Inventory (part of the report; never contains variable values)
# ----------------------------------------------------------------------------
def inventory(project: Project, sources: dict[str, str]) -> dict[str, Any]:
    by_type: dict[str, int] = {}
    providers: dict[str, dict[str, Any]] = {}
    modules = []
    required_version = None
    backend = None
    for d, mod in sorted(project.modules.items()):
        for key in mod.resources:
            t = key.split(".")[0]
            by_type[t] = by_type.get(t, 0) + 1
        for rel in mod.json_files:
            for kind, items in _json_tf_inventory(project.file_text(rel) or "").items():
                if kind == "resource":
                    for key in items:
                        t = key.split(".")[0]
                        by_type[t] = by_type.get(t, 0) + 1
        calls = []
        for name, (b, _) in sorted(mod.module_calls.items()):
            src = literal(b.attributes["source"].tokens) if "source" in b.attributes else None
            ver = literal(b.attributes["version"].tokens) if "version" in b.attributes else None
            calls.append({"name": name, "source": src if isinstance(src, str) else None, "version": ver if isinstance(ver, str) else None})
        for b, _ in mod.terraform_blocks:
            if d == ".":
                rv = b.attributes.get("required_version")
                if rv:
                    v = literal(rv.tokens)
                    required_version = v if isinstance(v, str) else required_version
                for be in b.children("backend"):
                    backend = be.labels[0] if be.labels else backend
                if b.children("cloud"):
                    backend = "cloud"
            for rp in b.children("required_providers"):
                for pname, a in rp.attributes.items():
                    v = literal(a.tokens)
                    entry = providers.setdefault(pname, {"name": pname, "source": None, "versions": []})
                    if isinstance(v, dict):
                        entry["source"] = entry["source"] or v.get("source")
                        if isinstance(v.get("version"), str) and v["version"] not in entry["versions"]:
                            entry["versions"].append(v["version"])
                    elif isinstance(v, str) and v not in entry["versions"]:
                        entry["versions"].append(v)
        modules.append({
            "dir": d, "files": len(mod.files) + len(mod.json_files), "resources": len(mod.resources), "data_sources": len(mod.data),
            "variables": len(mod.variables), "outputs": len(mod.outputs), "module_calls": calls})
    variables = []
    root = project.root_module
    if root is not None:
        for name, (b, rel) in sorted(root.variables.items()):
            tattr = b.attributes.get("type")
            variables.append({
                "name": name, "type": str(parse_type(parse_tokens(tattr.tokens))) if tattr else None,
                "required": "default" not in b.attributes, "sensitive": _is_sensitive(b), "value_source": sources.get(name),
                "file": rel, "line": b.line})
    return {
        "files": {"tf": len(project.files.tf), "tf_json": len(project.files.tf_json), "tfvars": len(project.files.tfvars),
                  "lock_file": project.files.lock_file, "skipped_too_large": project.files.skipped_large},
        "auto_loaded_var_files": project.auto_var_files, "extra_var_files": project.extra_var_files,
        "required_version": required_version, "backend": backend,
        "providers": sorted(providers.values(), key=lambda p: p["name"]),
        "modules": modules, "resources_by_type": dict(sorted(by_type.items())), "variables": variables,
    }


def sensitive_values(project: Project, root_values: dict[str, Any]) -> list[str]:
    """Literal values that must never appear in reports: sensitive variables and
    secret-looking arguments."""
    from .redact import is_secret_name
    out: list[str] = []
    root = project.root_module
    if root is not None:
        for name, (b, _) in root.variables.items():
            if _is_sensitive(b) or is_secret_name(name):
                v = root_values.get(name)
                if isinstance(v, str):
                    out.append(v)
                for vals in project.tfvars.values():
                    if name in vals and isinstance(vals[name][0], str):
                        out.append(vals[name][0])
    for mod in project.modules.values():
        for block, _ in list(mod.resources.values()) + list(mod.data.values()) + mod.providers:
            for attr, _it in _walk_attrs(block):
                if is_secret_name(attr.name):
                    v = literal(attr.tokens)
                    if isinstance(v, str):
                        out.append(v)
    return out

