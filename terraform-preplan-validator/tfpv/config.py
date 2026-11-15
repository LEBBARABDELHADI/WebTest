"""Project configuration (.tfpv.toml) merged with command-line options.

Example .tfpv.toml:

    fail_on = "HIGH"
    skip = ["checkov"]                      # check ids
    var_files = ["env/prod.tfvars"]
    [ignore]
    rules = ["S3_OPTIONAL_HARDENING", "CKV2_AWS_62"]
    [severity]
    VPC_FLOW_LOGS = "MEDIUM"
    [tflint]
    config = "auto"                         # auto | project | tfpv | <path>
    aws_ruleset_version = "0.50.0"
    deep_check = false
    [checkov]
    skip_checks = ["CKV_AWS_144"]
"""
from __future__ import annotations

import tomllib
from dataclasses import replace
from pathlib import Path
from typing import Any

from .models import SEVERITIES, ScanOptions

CHECK_IDS = ("scanner", "terraform_fmt", "terraform_init", "terraform_validate", "tflint", "checkov", "aws_static", "aws_external")


class ConfigError(ValueError):
    pass


def load_toml(path: Path) -> dict[str, Any]:
    try:
        with path.open("rb") as fh:
            return tomllib.load(fh)
    except tomllib.TOMLDecodeError as e:
        raise ConfigError(f"{path}: {e}") from e


def apply_file(options: ScanOptions, data: dict[str, Any], base: Path) -> ScanOptions:
    """Values from the file are defaults: explicit CLI options win (the CLI
    passes only what the user typed in `explicit`)."""
    fail_on = str(data.get("fail_on", options.fail_on)).upper()
    if fail_on not in SEVERITIES:
        raise ConfigError(f"fail_on must be one of {', '.join(SEVERITIES)}")
    skip = tuple(dict.fromkeys(tuple(options.skip) + tuple(data.get("skip", ()))))
    bad = [s for s in skip if s not in CHECK_IDS]
    if bad:
        raise ConfigError(f"unknown check id(s) in skip: {', '.join(bad)} (valid: {', '.join(CHECK_IDS)})")
    var_files = tuple(options.var_files) + tuple(str((base / v).resolve()) for v in data.get("var_files", ()))
    ignore = data.get("ignore") or {}
    sev = {k: str(v).upper() for k, v in (data.get("severity") or {}).items()}
    if any(v not in SEVERITIES for v in sev.values()):
        raise ConfigError("severity overrides must be CRITICAL, HIGH, MEDIUM or LOW")
    tfl = data.get("tflint") or {}
    ck = data.get("checkov") or {}
    return replace(
        options, fail_on=fail_on, skip=skip, var_files=var_files,
        ignore_rules=tuple(options.ignore_rules) + tuple(ignore.get("rules", ())),
        severity_overrides={**sev, **options.severity_overrides},
        tflint_config=options.tflint_config if options.tflint_config != "auto" else str(tfl.get("config", "auto")),
        tflint_aws_version=str(tfl.get("aws_ruleset_version", options.tflint_aws_version)),
        tflint_deep_check=options.tflint_deep_check or bool(tfl.get("deep_check", False)),
        checkov_skip=tuple(options.checkov_skip) + tuple(ck.get("skip_checks", ())),
    )


def load(options: ScanOptions, root: Path) -> ScanOptions:
    path = Path(options.config_path) if options.config_path else root / ".tfpv.toml"
    if not path.exists():
        if options.config_path:
            raise ConfigError(f"config file not found: {path}")
        return options
    return apply_file(options, load_toml(path), path.parent)
