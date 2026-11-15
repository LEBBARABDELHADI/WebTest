"""Security Scanner: Checkov (terraform framework), offline (--skip-download).

Checkov OSS does not return severities without a Prisma Cloud API key; the
Diagnostic Engine assigns them from the knowledge base.
"""
from __future__ import annotations

import json
import logging
import os

from ..models import CheckRun, RawFinding, TIER_STATIC
from .base import EngineContext, timed

log = logging.getLogger("tfpv.checkov")


def _results(data) -> tuple[list[dict], dict]:
    """Checkov prints a dict for one framework, a list for several, and a
    summary-only dict when nothing was scanned."""
    failed: list[dict] = []
    summary = {"passed": 0, "failed": 0, "skipped": 0, "parsing_errors": 0, "resource_count": 0}
    for block in data if isinstance(data, list) else [data]:
        if not isinstance(block, dict):
            continue
        res = block.get("results") or {}
        failed.extend(res.get("failed_checks") or [])
        s = block.get("summary") or (block if "passed" in block else {})
        for k in summary:
            summary[k] += int(s.get(k) or 0)
        if s.get("checkov_version"):
            summary["checkov_version"] = s["checkov_version"]
    return failed, summary


def run(ctx: EngineContext) -> CheckRun:
    check = CheckRun("checkov", "Checkov (security)", "checkov", TIER_STATIC)
    checkov = ctx.tool_path("checkov")

    def body() -> None:
        if "checkov" in ctx.options.skip:
            check.status, check.reason = "skipped", "disabled with --skip"
            return
        if not checkov:
            check.status, check.reason = "skipped", "checkov not found in PATH (use --checkov-bin)"
            return
        cmd = [checkov, "-d", str(ctx.root), "--framework", "terraform", "-o", "json", "--compact", "--quiet", "--skip-download", "--soft-fail"]
        for vf in ctx.options.var_files:
            cmd += ["--var-file", vf]
        if ctx.options.checkov_skip:
            cmd += ["--skip-check", ",".join(ctx.options.checkov_skip)]
        check.command = " ".join(cmd)
        env = dict(os.environ)
        env.setdefault("LOG_LEVEL", "ERROR")
        res = ctx.runner.run(cmd, cwd=ctx.root, env=env, timeout=ctx.options.timeout_s)
        try:
            data = json.loads(res.stdout)
        except ValueError:
            check.status, check.reason = "error", (res.stderr.strip() or res.stdout.strip() or f"exit code {res.returncode}")[-300:]
            return
        failed, summary = _results(data)
        check.version = summary.get("checkov_version")
        check.passed_count = summary["passed"]
        for c in failed:
            rng = c.get("file_line_range") or [None, None]
            f = RawFinding(engine="checkov", engine_rule=c.get("check_id", "CKV"), message=c.get("check_name", ""),
                           file=(c.get("file_path") or "").lstrip("/") or None, line=rng[0], end_line=rng[1] if len(rng) > 1 else None,
                           resource=c.get("resource"), link=c.get("guideline") or None, engine_severity=c.get("severity"),
                           extra={"evaluated_keys": ((c.get("check_result") or {}).get("evaluated_keys") or [])[:5]})
            check.findings.append(f)
        if summary["parsing_errors"]:
            check.partial = True
            check.reason = f"{summary['parsing_errors']} file(s) could not be parsed by Checkov and were not analysed"
        ctx.shared["checkov_suppressed"] = summary["skipped"]

    return timed(check, body)
