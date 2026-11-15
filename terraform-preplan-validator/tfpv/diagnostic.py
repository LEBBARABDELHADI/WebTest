"""Diagnostic Engine: centralises and normalises results of all engines.

* canonical rule + explanation (via the Recommendation Engine);
* resource address and precise line (attribute line for Checkov results);
* redaction of values and snippets;
* de-duplication across engines, and removal of tfpv fallbacks when the
  authoritative Terraform check actually ran;
* suppressions (inline `# tfpv:ignore RULE -- reason`, .tfpv.toml);
* final status, never PASSED when a required check did not run.
"""
from __future__ import annotations

import hashlib
import json
import re
from typing import Any

from .hcl.expr import plain
from .models import (CheckRun, Finding, RawFinding, ScanOptions, SEVERITY_RANK, STATUS_FAILED, STATUS_INCOMPLETE, STATUS_PASSED,
                     STATUS_WARNINGS, severity_at_least)
from .recommend import advise
from .redact import MASK, Redactor
from .scanner import Project

IGNORE_RE = re.compile(r"#\s*tfpv:ignore(?:[=:\s]+(?P<rules>[A-Za-z0-9_,\s]*?))?\s*(?:--\s*(?P<reason>.*))?$")
EXECUTED = ("passed", "failed")


def _finding_id(rule_id: str, file: str | None, line: int | None, resource: str | None, extra: str) -> str:
    h = hashlib.sha1(f"{rule_id}|{file}|{line}|{resource}|{extra}".encode()).hexdigest()
    return h[:10]


def _refine_line(project: Project, raw: RawFinding) -> int | None:
    """Checkov reports the whole resource block; point at the evaluated attribute."""
    keys = (raw.extra or {}).get("evaluated_keys") or []
    if raw.engine != "checkov" or not keys or not raw.file or not raw.line:
        return raw.line
    hf = project.parsed.get(raw.file)
    block = hf.block_at(raw.line) if hf else None
    if block is None:
        return raw.line
    first = str(keys[0]).split("/")
    name = first[0]
    if name in block.attributes:
        return block.attributes[name].line
    children = block.children(name)
    if children:
        idx = 0
        if len(first) > 1 and first[1].startswith("["):
            try:
                idx = int(first[1].strip("[]"))
            except ValueError:
                idx = 0
        child = children[min(idx, len(children) - 1)]
        if len(first) > 2 and first[2] in child.attributes:
            return child.attributes[first[2]].line
        return child.line
    return raw.line


def _snippet(project: Project, file: str | None, line: int | None, redactor: Redactor, radius: int = 3) -> dict[str, Any] | None:
    if not file or not line:
        return None
    text = project.file_text(file)
    if text is None:
        return None
    lines = text.splitlines()
    if line > len(lines) + 1:
        return None
    start = max(1, line - radius)
    end = min(len(lines), line + radius)
    out = []
    for i in range(start, end + 1):
        s = lines[i - 1]
        out.append(redactor.text(s[:300] + ("…" if len(s) > 300 else "")))
    return {"start_line": start, "highlight": line, "lines": out}


def _suppression(project: Project, f: Finding) -> str | None:
    if not f.file or not f.line:
        return None
    text = project.file_text(f.file)
    if not text:
        return None
    lines = text.splitlines()
    for ln in (f.line, f.line - 1):
        if 1 <= ln <= len(lines):
            m = IGNORE_RE.search(lines[ln - 1])
            if m:
                rules = {r.strip() for r in re.split(r"[,\s]+", m.group("rules") or "") if r.strip()}
                if not rules or f.rule_id in rules or any(r in rules for r in f.engine_rules):
                    return (m.group("reason") or "inline tfpv:ignore").strip()
    return None


def normalize(raw: RawFinding, project: Project, options: ScanOptions, redactor: Redactor) -> Finding:
    adv = advise(raw, options)
    line = _refine_line(project, raw)
    resource = raw.resource or project.locate(raw.file, line)
    value = plain(raw.value)
    if (raw.extra or {}).get("sensitive"):
        value = MASK
        redactor.count += 1
    value = redactor.value(raw.attribute, value)
    message = redactor.text(raw.message)
    fid = _finding_id(adv.rule_id, raw.file, line, resource, raw.engine_rule)
    return Finding(
        id=fid, rule_id=adv.rule_id, title=redactor.text(adv.title), severity=adv.severity, category=adv.category, blocking=adv.blocking,
        fails_at=adv.fails_at, file=raw.file, line=line, resource=resource, attribute=raw.attribute, value=value,
        description=redactor.text(adv.description), cause=adv.cause, recommendation=adv.recommendation, fix=adv.fix,
        references=adv.references, engines=[raw.engine], engine_rules=[raw.engine_rule], message=message, tier=adv.tier,
        confidence=adv.confidence, end_line=raw.end_line if raw.engine != "checkov" else None, column=raw.column,
        snippet=_snippet(project, raw.file, line, redactor))


def consolidate(checks: list[CheckRun], project: Project, options: ScanOptions, redactor: Redactor, notes: list[str]) -> tuple[list[Finding], list[Finding]]:
    """Return (active findings, suppressed findings)."""
    status = {c.id: c.status for c in checks}
    fmt_syntax_files = {f.file for c in checks if c.id == "terraform_fmt" for f in c.findings if f.rule_id == "TF_SYNTAX_ERROR"}
    raws: list[RawFinding] = []
    for c in checks:
        for raw in c.findings:
            fb = raw.fallback_for
            if fb and status.get(fb) in EXECUTED:
                if raw.rule_id == "TF_SYNTAX_ERROR" and raw.file not in fmt_syntax_files:
                    notes.append(f"tfpv's own parser could not read {raw.file} although Terraform accepts it: static AWS checks may be incomplete for this file.")
                continue
            if fb:
                raw.extra = {**(raw.extra or {}), "confidence": "medium"}
            raws.append(raw)

    merged: dict[tuple, Finding] = {}
    order: list[tuple] = []
    for raw in raws:
        f = normalize(raw, project, options, redactor)
        if raw.engine == "checkov" and f.resource:
            # Several Checkov policies often describe the same concern on the same
            # resource (e.g. 4 IAM "excessive permissions" checks): one finding.
            key = ("checkov", f.rule_id, f.file, f.resource)
        else:
            key = (f.rule_id, f.file, f.line, json.dumps(f.value, sort_keys=True, default=str) if f.rule_id.startswith(("NET_", "IAM_")) else "")
        if key in merged:
            m = merged[key]
            hf = project.parsed.get(m.file or "")
            block = hf.block_at(m.line) if hf and m.line else None
            if block is not None and m.line == block.line and f.line and f.line != block.line:
                m.line, m.snippet = f.line, f.snippet  # keep the most precise location
            for e in f.engines:
                if e not in m.engines:
                    m.engines.append(e)
            for r in f.engine_rules:
                if r not in m.engine_rules:
                    m.engine_rules.append(r)
            if SEVERITY_RANK[f.severity] > SEVERITY_RANK[m.severity]:
                m.severity = f.severity
            continue
        merged[key] = f
        order.append(key)

    # A location-less duplicate of a located finding (same rule, same engine) adds nothing.
    located = {(merged[k].rule_id, tuple(merged[k].engines)) for k in order if merged[k].file}
    order = [k for k in order if merged[k].file or (merged[k].rule_id, tuple(merged[k].engines)) not in located]

    ignore = set(options.ignore_rules)
    active, suppressed = [], []
    for key in order:
        f = merged[key]
        reason = _suppression(project, f)
        if reason is None and (f.rule_id in ignore or any(r in ignore for r in f.engine_rules)):
            reason = "ignored in .tfpv.toml / --ignore"
        if reason:
            f.suppressed, f.suppression_reason = True, redactor.text(reason)
            suppressed.append(f)
        else:
            active.append(f)
    active.sort(key=lambda f: (-SEVERITY_RANK[f.severity], not f.blocking, f.file or "~", f.line or 0, f.rule_id))
    return active, suppressed


def compute_status(findings: list[Finding], checks: list[CheckRun], options: ScanOptions) -> tuple[str, str, dict[str, Any]]:
    failing = [f for f in findings if f.blocking or severity_at_least(f.severity, options.fail_on)]
    warnings = [f for f in findings if f not in failing]
    not_run = [c for c in checks if c.required and c.status in ("skipped", "error")]
    partial = [c for c in checks if c.required and c.partial and c.status in EXECUTED]
    passed = sum(c.passed_count for c in checks if c.status in EXECUTED)
    by_sev = {s: sum(1 for f in findings if f.severity == s) for s in ("CRITICAL", "HIGH", "MEDIUM", "LOW")}
    by_cat: dict[str, int] = {}
    for f in findings:
        by_cat[f.category] = by_cat.get(f.category, 0) + 1
    summary = {
        "total_checks": passed + len(failing) + len(warnings),
        "passed": passed,
        "failed": len(failing),
        "warnings": len(warnings),
        "blocking": sum(1 for f in findings if f.blocking),
        "not_run": len(not_run),
        "not_evaluated": sum(c.not_evaluated for c in checks),
        "by_severity": by_sev,
        "by_category": dict(sorted(by_cat.items())),
        "files_with_findings": len({f.file for f in findings if f.file}),
    }
    gaps = [f"{c.id} ({c.reason})" for c in not_run] + [f"{c.id} partial ({c.reason})" for c in partial]
    if failing:
        reason = f"{len(failing)} finding(s) blocking or at/above {options.fail_on}"
        if gaps:
            reason += f"; also not fully validated: {', '.join(c.id for c in not_run + partial)}"
        return STATUS_FAILED, reason, summary
    if gaps:
        return STATUS_INCOMPLETE, "Configuration NOT validated: " + "; ".join(gaps), summary
    if warnings:
        return STATUS_WARNINGS, f"No blocking finding; {len(warnings)} warning(s) below {options.fail_on}", summary
    return STATUS_PASSED, "All checks executed; no finding", summary
