"""Orchestration of the validation workflow.

1 discover files · 2 analyse modules/providers/variables/resources ·
3 Terraform native checks · 4 TFLint · 5 AWS validator + Checkov (3-5 run in
parallel) · 6 centralise · 7 recommendations and report.
`terraform plan` / `apply` are never executed (enforced by the Runner).
"""
from __future__ import annotations

import logging
import os
import platform
import shutil
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from . import __version__, diagnostic, tools
from .engines import checkov as checkov_engine
from .engines import native, tflint as tflint_engine
from .engines import aws as aws_engine
from .engines.base import EngineContext, timed
from .models import CheckRun, Report, STATUS_ERROR, ScanOptions, TIER_STATIC
from .redact import Redactor
from .runner import Runner
from .scanner import check_project, instances, inventory, load_project, root_var_values, sensitive_values

log = logging.getLogger("tfpv.pipeline")

STEPS = [
    ("discover", "Detecting .tf and .tfvars files"),
    ("analyze", "Analysing modules, providers, variables and resources"),
    ("native", "Terraform checks (fmt, init -backend=false, validate)"),
    ("tflint", "TFLint (terraform + AWS rulesets)"),
    ("aws_security", "AWS validator and Checkov security scan"),
    ("centralize", "Centralising and de-duplicating results"),
    ("report", "Building recommendations and the report"),
]
Progress = Callable[[dict[str, Any]], None]


class ScanError(Exception):
    pass


def _emit(progress: Progress | None, step: str, state: str, **kw: Any) -> None:
    if progress is None:
        return
    idx = [s for s, _ in STEPS].index(step)
    try:
        progress({"step": step, "index": idx + 1, "total": len(STEPS), "label": STEPS[idx][1], "state": state,
                  "percent": round(100 * (idx + (1 if state == "done" else 0.5)) / len(STEPS)), **kw})
    except Exception:  # noqa: BLE001 - a progress consumer must never break a scan
        log.debug("progress callback failed", exc_info=True)


def scan(target: str | Path, options: ScanOptions | None = None, progress: Progress | None = None,
         runner: Runner | None = None, aws_api: Any = None, display_path: str | None = None) -> Report:
    options = options or ScanOptions()
    started = time.monotonic()
    root = Path(target).expanduser().resolve()
    if not root.is_dir():
        raise ScanError(f"not a directory: {target}")
    runner = runner or Runner({options.tf_bin} if options.tf_bin else None)
    redactor = Redactor()
    for v in options.vars.values():
        redactor.add_value(v)
    tmp = Path(tempfile.mkdtemp(prefix="tfpv-run-"))
    try:
        _emit(progress, "discover", "running")
        project = load_project(root, options.var_files)
        if not project.files.tf and not project.files.tf_json:
            raise ScanError(f"no Terraform file (.tf) found in {target}")
        _emit(progress, "discover", "done", files=len(project.files.tf) + len(project.files.tfvars))

        _emit(progress, "analyze", "running")
        values, sources = root_var_values(project, options.vars, dict(os.environ))
        for v in sensitive_values(project, values):
            redactor.add_value(v)
        insts = instances(project, values)
        scanner_check = CheckRun("scanner", "tfpv Terraform scanner (variables, modules, references)", "tfpv", TIER_STATIC)

        def scan_body() -> None:
            findings, passed = check_project(project, values, sources, dict(os.environ))
            scanner_check.findings.extend(findings)
            scanner_check.passed_count = passed

        timed(scanner_check, scan_body)
        if project.root_module is None:
            candidates = sorted({m for m in project.modules})[:10]
            scanner_check.reason = f"no .tf file at the scanned path; module directories found: {', '.join(candidates)}"
        _emit(progress, "analyze", "done", resources=sum(len(m.resources) for m in project.modules.values()))

        tool_map = {
            "terraform": tools.terraform(runner, options.tf_bin),
            "tflint": tools.tflint(runner, options.tflint_bin),
            "checkov": tools.checkov(runner, options.checkov_bin),
            "aws": tools.aws_cli(runner, options.aws_bin) if options.aws_checks else tools.Tool("aws", None),
        }
        ctx = EngineContext(root=root, project=project, options=options, runner=runner, tools=tool_map, tmp=tmp)

        def native_chain() -> list[CheckRun]:
            _emit(progress, "native", "running")
            fmt = native.run_fmt(ctx)
            init, validate = native.run_init_validate(ctx)
            _emit(progress, "native", "done")
            return [fmt, init, validate]

        def tflint_job() -> list[CheckRun]:
            _emit(progress, "tflint", "running")
            res = list(tflint_engine.run(ctx))
            _emit(progress, "tflint", "done")
            return res

        def aws_security() -> list[CheckRun]:
            _emit(progress, "aws_security", "running")
            static_check = aws_engine.run_static(ctx, insts)
            external_check = aws_engine.run_external(ctx, insts, aws_api)
            ck = checkov_engine.run(ctx)
            _emit(progress, "aws_security", "done")
            return [static_check, external_check, ck]

        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = [pool.submit(native_chain), pool.submit(tflint_job), pool.submit(aws_security)]
            results = [f.result() for f in futures]
        checks = [scanner_check, *results[0], *results[1], *results[2]]
        order = ["scanner", "terraform_fmt", "terraform_init", "terraform_validate", "tflint", "tflint_aws", "checkov", "aws_static", "aws_external"]
        checks.sort(key=lambda c: order.index(c.id) if c.id in order else 99)

        _emit(progress, "centralize", "running")
        notes = list(ctx.notes)
        findings, suppressed = diagnostic.consolidate(checks, project, options, redactor, notes)
        status, reason, summary = diagnostic.compute_status(findings, checks, options)
        summary["suppressed"] = len(suppressed) + int(ctx.shared.get("checkov_suppressed") or 0)
        _emit(progress, "centralize", "done", findings=len(findings))

        _emit(progress, "report", "running")
        tfl = tool_map["tflint"]
        if tfl.available and ctx.shared.get("tflint_config") == "tfpv" and (tmp / "tflint.hcl").exists():
            tfl = tools.tflint(runner, options.tflint_bin, str(tmp / "tflint.hcl"), str(root))
        environment = {
            "tfpv": __version__,
            "terraform": f"{tool_map['terraform'].detail} {tool_map['terraform'].version}" if tool_map["terraform"].available else None,
            "tflint": f"{tfl.version} ({tfl.detail})" if tfl.available and tfl.detail else (tfl.version if tfl.available else None),
            "tflint_config": ctx.shared.get("tflint_config"),
            "checkov": tool_map["checkov"].version,
            "aws_cli": tool_map["aws"].version,
            "python": sys.version.split()[0],
            "os": f"{platform.system()} {platform.machine()}",
        }
        for c in checks:
            if c.engine == "terraform":
                c.version = tool_map["terraform"].version
            elif c.engine == "tflint":
                c.version = tfl.version
            elif c.engine == "checkov":
                c.version = c.version or tool_map["checkov"].version
        report = Report(
            schema_version="1.0",
            tool={"name": "terraform-preplan-validator", "version": __version__},
            project={"name": options.project_name or root.name, "path": display_path or str(root),
                     "var_files": [Path(v).name for v in options.var_files]},
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            duration_s=round(time.monotonic() - started, 2),
            status=status, status_reason=reason, fail_on=options.fail_on, summary=summary, environment=environment,
            checks=[redactor.deep(c.summary()) for c in checks],
            inventory=inventory(project, sources),
            findings=[f.to_dict() for f in findings],
            suppressed=[f.to_dict() for f in suppressed],
            redaction={"applied": True, "masked_values": 0}, notes=notes,
        )
        # Safety net: redact every string of the final report.
        report.findings = redactor.deep(report.findings)
        report.suppressed = redactor.deep(report.suppressed)
        report.notes = redactor.deep(report.notes)
        report.redaction["masked_values"] = redactor.count
        _emit(progress, "report", "done", status=status)
        return report
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def error_report(target: str, message: str, options: ScanOptions | None = None) -> Report:
    options = options or ScanOptions()
    return Report(schema_version="1.0", tool={"name": "terraform-preplan-validator", "version": __version__},
                  project={"name": options.project_name or Path(target).name, "path": target}, generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                  duration_s=0.0, status=STATUS_ERROR, status_reason=message, fail_on=options.fail_on,
                  summary={"total_checks": 0, "passed": 0, "failed": 0, "warnings": 0, "blocking": 0, "not_run": 0, "not_evaluated": 0,
                           "by_severity": {}, "by_category": {}, "files_with_findings": 0, "suppressed": 0},
                  environment={"tfpv": __version__}, checks=[], inventory={}, findings=[], suppressed=[], redaction={"applied": True, "masked_values": 0},
                  notes=[message])
