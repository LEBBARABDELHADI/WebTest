"""Terraform native checks: fmt -check, init -backend=false, validate.

* fmt runs on the project files in place (read-only with -check);
* init and validate run in a shadow workspace (never in the user's tree);
* init needs the provider registry (or a mirror): tier "providers";
* validate needs providers: it is skipped (not passed!) when init failed.
"""
from __future__ import annotations

import json
import logging
import re

from .. import knowledge
from ..models import CheckRun, TIER_PROVIDERS, TIER_STATIC
from ..workspace import ShadowWorkspace, WorkspaceError
from .base import EngineContext, finding_from_diag, parse_text_diagnostics, timed

log = logging.getLogger("tfpv.native")


def _scanner_covers(summary: str) -> bool:
    # tfpv's scanner reports undeclared tfvars values with file and line.
    return summary.startswith("Value for undeclared variable")


def run_fmt(ctx: EngineContext) -> CheckRun:
    check = CheckRun("terraform_fmt", "terraform fmt -check", "terraform", TIER_STATIC)
    tf = ctx.tool_path("terraform")

    def body() -> None:
        if "terraform_fmt" in ctx.options.skip:
            check.status, check.reason = "skipped", "disabled with --skip"
            return
        if not tf:
            check.status, check.reason = "skipped", "terraform/tofu not found in PATH (use --tf-bin)"
            return
        files = ctx.project.files.tf + ctx.project.files.tfvars
        if not files:
            check.status, check.reason = "skipped", "no .tf/.tfvars file"
            return
        check.command = f"{tf} fmt -check -list=true -no-color <{len(files)} files>"
        res = ctx.runner.run([tf, "fmt", "-check", "-list=true", "-no-color", *files], cwd=ctx.root, timeout=ctx.options.timeout_s)
        if res.timed_out or res.not_found:
            check.status, check.reason = "error", res.stderr.strip()[-300:]
            return
        diags = parse_text_diagnostics(res.stderr)
        errors = [d for d in diags if d["severity"] == "error"]
        for d in errors:
            check.findings.append(finding_from_diag("terraform", "fmt", d, "TF_SYNTAX_ERROR", TIER_STATIC))
        ctx.shared["fmt_syntax_files"] = {d["file"] for d in errors if d.get("file")}
        if res.returncode == 3 or (res.returncode == 0 and res.stdout.strip()):
            for rel in [l.strip() for l in res.stdout.splitlines() if l.strip()]:
                f = finding_from_diag("terraform", "fmt", {"summary": "File is not in canonical format", "file": rel, "line": 1}, "TF_FORMAT", TIER_STATIC)
                check.findings.append(f)
        elif res.returncode not in (0, 2, 3):
            check.status, check.reason = "error", (res.stderr.strip() or f"exit code {res.returncode}")[-300:]
            return
        if res.returncode == 2 and not errors:
            check.status, check.reason = "error", (res.stderr.strip() or "terraform fmt failed")[-300:]
        check.passed_count = len(files) - len({f.file for f in check.findings})

    return timed(check, body)


def _parse_init_json(stdout: str) -> list[dict]:
    diags = []
    for line in stdout.splitlines():
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if obj.get("type") == "diagnostic" and isinstance(obj.get("diagnostic"), dict):
            diags.append(_flatten(obj["diagnostic"]))
    return diags


_AT_RE = re.compile(r"\bat ([^\s:\"]+\.tf(?:\.json)?):(\d+)")
_INIT_PREAMBLE = "Terraform encountered problems during initialisation"


def _flatten(d: dict) -> dict:
    rng = d.get("range") or {}
    start = rng.get("start") or {}
    end = rng.get("end") or {}
    out = {"severity": d.get("severity"), "summary": " ".join((d.get("summary") or "").split()), "detail": d.get("detail"),
           "file": rng.get("filename"), "line": start.get("line"), "column": start.get("column"), "end_line": end.get("line"),
           "context": (d.get("snippet") or {}).get("context")}
    if not out["file"]:
        m = _AT_RE.search(d.get("detail") or "")  # e.g. 'module "x" at main.tf:5'
        if m:
            out["file"], out["line"] = m.group(1), int(m.group(2))
    return out


def _drop_preamble(diags: list[dict]) -> list[dict]:
    """init adds a location-less "problems during initialisation" error before
    the real ones; it is context, not a finding."""
    real = [d for d in diags if not d["summary"].startswith(_INIT_PREAMBLE)]
    return real if any(d.get("severity") == "error" for d in real) else diags


def run_init_validate(ctx: EngineContext) -> tuple[CheckRun, CheckRun]:
    init = CheckRun("terraform_init", "terraform init -backend=false", "terraform", TIER_PROVIDERS)
    validate = CheckRun("terraform_validate", "terraform validate", "terraform", TIER_PROVIDERS)
    tf = ctx.tool_path("terraform")
    ws: list[ShadowWorkspace] = []

    def init_body() -> None:
        if "terraform_init" in ctx.options.skip:
            init.status, init.reason = "skipped", "disabled with --skip"
            return
        if ctx.options.offline:
            init.status, init.reason = "skipped", "offline mode: provider/module download not allowed"
            return
        if not tf:
            init.status, init.reason = "skipped", "terraform/tofu not found in PATH (use --tf-bin)"
            return
        if ctx.project.root_module is None:
            init.status, init.reason = "skipped", "no root module (.tf files) at the scanned path"
            return
        try:
            ws.append(ShadowWorkspace(ctx.root))
        except (WorkspaceError, OSError) as e:
            init.status, init.reason = "error", f"cannot prepare the shadow workspace: {e}"
            return
        w = ws[0]
        init.command = f"{tf} init -backend=false -input=false -no-color -json (shadow copy)"
        res = ctx.runner.run([tf, "init", "-backend=false", "-input=false", "-no-color", "-json"], cwd=w.workdir, env=w.env(), timeout=ctx.options.timeout_s)
        diags = _parse_init_json(res.stdout)
        if res.returncode != 0 and not diags and ("flag provided but not defined: -json" in res.stderr or "Usage: " in res.stderr):
            res = ctx.runner.run([tf, "init", "-backend=false", "-input=false", "-no-color"], cwd=w.workdir, env=w.env(), timeout=ctx.options.timeout_s)
            diags = parse_text_diagnostics(res.stderr + "\n" + res.stdout)
        if res.timed_out:
            init.status, init.reason = "error", f"timed out after {ctx.options.timeout_s}s"
            return
        for d in _drop_preamble(diags):
            if _scanner_covers(d["summary"]):
                continue
            rid = knowledge.map_terraform(d["summary"], d.get("severity") or "error", "terraform_init")
            init.findings.append(finding_from_diag("terraform", "init", d, rid, TIER_PROVIDERS))
        if res.returncode != 0:
            init.status = "failed"
            if not any(f.engine_severity == "error" for f in init.findings):
                tail = (res.stderr.strip() or res.stdout.strip())[-300:]
                init.findings.append(finding_from_diag("terraform", "init", {"summary": "terraform init failed", "detail": tail, "severity": "error"}, "TF_INIT_ERROR", TIER_PROVIDERS))
        ctx.shared["init_ok"] = res.returncode == 0
        init.passed_count = 1 if res.returncode == 0 else 0

    def validate_body() -> None:
        if "terraform_validate" in ctx.options.skip:
            validate.status, validate.reason = "skipped", "disabled with --skip"
            return
        if not ws or not ctx.shared.get("init_ok"):
            validate.status = "skipped"
            validate.reason = "terraform init did not succeed: provider schemas unavailable" if init.status not in ("skipped",) else f"needs terraform init ({init.reason})"
            return
        w = ws[0]
        validate.command = f"{tf} validate -json -no-color (shadow copy)"
        res = ctx.runner.run([tf, "validate", "-json", "-no-color"], cwd=w.workdir, env=w.env(), timeout=ctx.options.timeout_s)
        try:
            data = json.loads(res.stdout)
        except ValueError:
            validate.status, validate.reason = "error", (res.stderr.strip() or "invalid JSON from terraform validate")[-300:]
            return
        for d in data.get("diagnostics") or []:
            fd = _flatten(d)
            if _scanner_covers(fd["summary"]):
                continue
            rid = knowledge.map_terraform(fd["summary"], fd.get("severity") or "error", "terraform_validate")
            validate.findings.append(finding_from_diag("terraform", "validate", fd, rid, TIER_PROVIDERS))
        validate.passed_count = 1 if data.get("valid") else 0
        validate.status = "passed" if data.get("valid") and not validate.findings else "failed" if validate.findings else "passed"

    try:
        timed(init, init_body)
        timed(validate, validate_body)
    finally:
        for w in ws:
            w.cleanup()
    return init, validate
