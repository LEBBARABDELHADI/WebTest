"""Builds the reference data embedded in React Blocs' in-browser engine.

The browser cannot run terraform, TFLint or Checkov; the in-app engine reuses
their *reference data* instead:

* provider schemas, exactly what `terraform validate` checks against
  (`terraform providers schema -json`), compacted;
* the TFLint AWS ruleset data (generated enum/pattern/length rules, instance
  and DB classes, deprecated Lambda runtimes...) read from its source;
* tfpv's knowledge base (explanations, severities, mappings).

Usage (from the repository root):

    terraform providers schema -json > aws-schema.json      # in a dir with hashicorp/aws
    terraform providers schema -json > other-schemas.json   # random, null, tls, ...
    python3 terraform-preplan-validator/outils/donnees_navigateur.py \\
        --aws-schema aws-schema.json --aws-version 6.73.0 \\
        --other-schemas other-schemas.json \\
        --tflint-aws ~/go/pkg/mod/github.com/terraform-linters/tflint-ruleset-aws@v0.50.0
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(HERE.parent))

from tfpv import knowledge  # noqa: E402

PUBLIC = REPO / "react-blocks" / "public" / "tfpv"
SRC = REPO / "react-blocks" / "src" / "lib" / "tfpv" / "donnees"


# ---------------------------------------------------------------- schemas
def _type(t):
    if isinstance(t, str):
        return {"string": "s", "number": "n", "bool": "b", "dynamic": "d"}.get(t, "d")
    kind, inner = t[0], t[1]
    if kind in ("list", "set", "map"):
        return [kind[0], _type(inner)]
    if kind == "object":
        return ["o", {k: _type(v) for k, v in inner.items()}]
    if kind == "tuple":
        return ["t", [_type(x) for x in inner]]
    return "d"


def _block(b: dict) -> dict:
    out: dict = {}
    attrs = {}
    for name, a in (b.get("attributes") or {}).items():
        if a.get("required"):
            flag = "r"
        elif a.get("optional") and a.get("computed"):
            flag = "oc"
        elif a.get("optional"):
            flag = "o"
        else:
            flag = "c"
        entry = [flag, _type(a.get("type", "dynamic")) if "type" in a else "d"]
        extra = (1 if a.get("deprecated") else 0) | (2 if a.get("sensitive") else 0)
        if extra:
            entry.append(extra)
        attrs[name] = entry
    if attrs:
        out["a"] = attrs
    blocks = {}
    for name, bt in (b.get("block_types") or {}).items():
        x = {"m": bt["nesting_mode"][0]}
        if bt.get("min_items"):
            x["n"] = bt["min_items"]
        if bt.get("max_items"):
            x["x"] = bt["max_items"]
        x.update(_block(bt.get("block", {})))
        blocks[name] = x
    if blocks:
        out["b"] = blocks
    if b.get("deprecated"):
        out["d"] = 1
    return out


def compact_schemas(path: Path, versions: dict[str, str]) -> dict:
    data = json.loads(path.read_text())
    out = {}
    for addr, ps in data["provider_schemas"].items():
        name = addr.rsplit("/", 1)[-1]
        out[name] = {
            "source": addr.split("registry.terraform.io/")[-1],
            "version": versions.get(name),
            "r": {k: _block(v["block"]) for k, v in (ps.get("resource_schemas") or {}).items()},
            "d": {k: _block(v["block"]) for k, v in (ps.get("data_source_schemas") or {}).items()},
        }
    return out


# ---------------------------------------------------------------- TFLint AWS
_GO_STR = re.compile(r'"((?:[^"\\]|\\.)*)"')


def _go_regex_to_js(p: str) -> tuple[str, str]:
    flags = "u"
    for m in re.findall(r"\(\?([a-z]+)\)", p):  # Go inline flags such as ^(?s).+$
        flags += "".join(c for c in m if c in "ims" and c not in flags)
    p = re.sub(r"\(\?[a-z]+\)", "", p)
    p = re.sub(r"\\x\{([0-9A-Fa-f]+)\}", lambda mm: "\\u{" + mm.group(1) + "}", p)
    p = p.replace("\\A", "^").replace("\\z", "$")
    p = re.sub(r"\\p([A-Z])", r"\\p{\1}", p)
    return p, flags


def tflint_generated(models: Path) -> list[dict]:
    rules = []
    for f in sorted(models.glob("*.go")):
        if f.name.endswith("_test.go"):
            continue
        text = f.read_text()
        name = re.search(r'func \(r \*\w+\) Name\(\) string \{\s*return "([^"]+)"', text)
        rtype = re.search(r'resourceType:\s+"([^"]+)"', text)
        attr = re.search(r'attributeName:\s+"([^"]+)"', text)
        if not (name and rtype and attr):
            continue
        sev = re.search(r"return tflint\.(ERROR|WARNING|NOTICE)", text)
        rule = {"n": name.group(1), "r": rtype.group(1), "a": attr.group(1), "s": (sev.group(1) if sev else "ERROR").lower()}
        enum = re.search(r"enum: \[\]string\{(.*?)\n\t\t\},", text, re.S)
        if enum:
            rule["e"] = [bytes(x, "utf-8").decode("unicode_escape") for x in _GO_STR.findall(enum.group(1))]
        mx = re.search(r"\bmax:\s+(\d+),", text)
        mn = re.search(r"\bmin:\s+(\d+),", text)
        pat = re.search(r"regexp\.MustCompile\(`([^`]*)`\)", text)
        if mx:
            rule["mx"] = int(mx.group(1))
        if mn:
            rule["mn"] = int(mn.group(1))
        if pat:
            rule["p"], rule["f"] = _go_regex_to_js(pat.group(1))
        rules.append(rule)
    return rules


def tflint_data(src: Path) -> dict:
    rules_dir = src / "rules"
    db = json.loads((rules_dir / "db_instance_types" / "instance_classes.json").read_text())
    cache = json.loads((rules_dir / "elasticache_node_types" / "node_types.json").read_text())
    lam = json.loads((rules_dir / "lambda_deprecated_runtime" / "deprecated_runtimes.json").read_text())
    prev = (rules_dir / "aws_instance_previous_type.go").read_text()
    families = re.findall(r'"([a-z0-9]+)":\s+true', prev.split("previousInstanceTypes: map[string]bool{", 1)[1].split("},", 1)[0])
    eng = (rules_dir / "aws_db_instance_invalid_engine.go").read_text()
    engines = re.findall(r'"([a-z0-9-]+)":\s+true', eng.split("engines: map[string]bool{", 1)[1].split("},", 1)[0])
    targets = re.findall(r'\{Name: "([a-z_]+)"\}', (rules_dir / "aws_route_targets.go").read_text())
    cache_prev = set()
    cp = rules_dir / "aws_elasticache_cluster_previous_type.go"
    if cp.exists():
        t = cp.read_text()
        if "map[string]bool{" in t:
            cache_prev = set(re.findall(r'"([a-z0-9.]+)":\s+true', t.split("map[string]bool{", 1)[1].split("},", 1)[0]))
    version = re.search(r"tflint-ruleset-aws@v([0-9.]+)", str(src))
    return {
        "version": version.group(1) if version else None,
        "generated": tflint_generated(rules_dir / "models"),
        "instance_previous_families": families,
        "db_instance_classes": db.get("instance_classes", []),
        "db_previous_classes": db.get("previous_generation_classes", []),
        "elasticache_node_types": cache.get("node_types", []),
        "elasticache_previous_families": sorted(cache_prev),
        "lambda_runtimes": lam.get("runtimes", {}),
        "lambda_updated_at": lam.get("updated_at"),
        "db_engines": engines,
        "route_targets": targets,
    }


# ---------------------------------------------------------------- knowledge
def knowledge_export() -> dict:
    return {
        "rules": {r.id: {"title": r.title, "severity": r.severity, "category": r.category, "blocking": r.blocking, "fails_at": r.fails_at,
                         "description": r.description, "cause": r.cause, "recommendation": r.recommendation, "fix": r.fix,
                         "references": list(r.references), "confidence": r.confidence, "tier": r.tier}
                  for r in knowledge.catalog()},
        "tflint_map": knowledge.TFLINT_MAP,
        "checkov_map": knowledge.CHECKOV_MAP,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--aws-schema", required=True, type=Path)
    ap.add_argument("--aws-version", required=True)
    ap.add_argument("--other-schemas", type=Path)
    ap.add_argument("--other-versions", default="random=3.9.1,null=3.3.2,tls=4.4.2,local=2.9.1,archive=2.8.1,time=0.14.2,http=3.6.3,external=2.4.2,cloudinit=2.4.1")
    ap.add_argument("--tflint-aws", required=True, type=Path)
    a = ap.parse_args()
    PUBLIC.mkdir(parents=True, exist_ok=True)
    SRC.mkdir(parents=True, exist_ok=True)
    aws = compact_schemas(a.aws_schema, {"aws": a.aws_version})
    (PUBLIC / "schema-aws.json").write_text(json.dumps(aws["aws"], separators=(",", ":")))
    if a.other_schemas:
        versions = dict(kv.split("=") for kv in a.other_versions.split(","))
        (PUBLIC / "schema-autres.json").write_text(json.dumps(compact_schemas(a.other_schemas, versions), separators=(",", ":")))
    tfl = tflint_data(a.tflint_aws)
    (PUBLIC / "tflint-aws.json").write_text(json.dumps(tfl, separators=(",", ":")))
    (SRC / "connaissances.js").write_text(
        "// Base de connaissances tfpv (règles, gravités, explications). Généré par\n"
        "// terraform-preplan-validator/outils/donnees_navigateur.py — ne pas modifier à la main.\n"
        "export default " + json.dumps(knowledge_export(), ensure_ascii=False, separators=(",", ":")) + "\n")
    old = SRC / "connaissances.json"
    if old.exists():
        old.unlink()
    manifest = {"aws": a.aws_version, "tflint_aws": tfl["version"], "tflint_rules": len(tfl["generated"]),
                "aws_resources": len(aws["aws"]["r"]), "aws_data_sources": len(aws["aws"]["d"]), "knowledge_rules": len(knowledge.RULES)}
    (SRC / "manifeste.js").write_text("// Versions des données embarquées (généré).\nexport default " + json.dumps(manifest, indent=1) + "\n")
    if (SRC / "manifeste.json").exists():
        (SRC / "manifeste.json").unlink()
    print(json.dumps(manifest, indent=1))
    for p in sorted(PUBLIC.iterdir()):
        print(f"{p.name}: {p.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
