"""Plain-text report (format requested in the specification)."""
from __future__ import annotations

import json

from ..models import Report

FINAL = {
    "FAILED": "FAILED - Terraform configuration requires corrections.",
    "INCOMPLETE": "INCOMPLETE - Some required checks could not run: the configuration is NOT validated.",
    "PASSED_WITH_WARNINGS": "PASSED WITH WARNINGS - No blocking issue; review the warnings.",
    "PASSED": "PASSED - All checks executed and no issue was found.",
    "ERROR": "ERROR - The validation could not be performed.",
}


def _value(v) -> str:
    if v is None:
        return ""
    if isinstance(v, (dict, list)):
        return json.dumps(v, ensure_ascii=False)
    return str(v)


def render(report: Report, include_warnings: bool = True) -> str:
    s = report.summary
    out = ["Terraform Pre-Plan Validation Report", "", f"Project: {report.project.get('name')}", f"Status: {report.status}"]
    out += [f"Reason: {report.status_reason}", "", "Summary:", "",
            f"* Total checks: {s['total_checks']}", f"* Passed: {s['passed']}", f"* Failed: {s['failed']}", f"* Warnings: {s['warnings']}"]
    if s.get("not_run"):
        out.append(f"* Not run: {s['not_run']}")
    if s.get("not_evaluated"):
        out.append(f"* Not evaluable statically: {s['not_evaluated']}")
    if report.suppressed:
        out.append(f"* Suppressed: {len(report.suppressed)}")
    out += ["", "Checks:", ""]
    for c in report.checks:
        extra = f" — {c['reason']}" if c.get("reason") else ""
        out.append(f"* [{c['status'].upper():7}] {c['name']} ({c['tier']}){extra}")
    out += ["", "Findings:" if report.findings else "Findings: none", ""]
    for f in report.findings:
        if not include_warnings and not f["blocking"] and f["severity"] in ("LOW",):
            continue
        out.append(f"[{f['severity']}] {f['rule_id']}" + ("  (blocking: fails at " + f["fails_at"] + ")" if f["blocking"] else ""))
        out.append("")
        if f.get("file"):
            out.append(f"File: {f['file']}")
        if f.get("line"):
            out.append(f"Line: {f['line']}")
        if f.get("resource"):
            out.append(f"Resource: {f['resource']}")
        if f.get("value") not in (None, ""):
            out.append(f"Current value: {_value(f['value'])}")
        out.append(f"Detected by: {', '.join(f['engines'])} ({', '.join(f['engine_rules'])})")
        out += ["", "Description:", f["description"], "", "Probable cause:", f["cause"], "", "Recommendation:", f["recommendation"]]
        if f.get("fix"):
            out += ["", "Suggested fix:", *[f"    {l}" for l in f["fix"].splitlines()]]
        if f.get("references"):
            out += ["", f"Reference: {f['references'][0]}"]
        out += ["", "-" * 72, ""]
    if report.notes:
        out += ["Notes:", *[f"* {n}" for n in report.notes], ""]
    out += ["Final result:", FINAL.get(report.status, report.status), ""]
    return "\n".join(out)
