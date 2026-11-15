"""Shared context handed to every engine (the engines' common interface)."""
from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from ..models import CheckRun, RawFinding, ScanOptions
from ..runner import Runner
from ..scanner import Project

log = logging.getLogger("tfpv.engines")


@dataclass
class EngineContext:
    root: Path
    project: Project
    options: ScanOptions
    runner: Runner
    tools: dict[str, Any]  # name -> tools.Tool
    tmp: Path
    shared: dict[str, Any] = field(default_factory=dict)  # data passed between engines
    notes: list[str] = field(default_factory=list)

    def tool_path(self, name: str) -> str | None:
        t = self.tools.get(name)
        return t.path if t is not None else None


def timed(check: CheckRun, fn: Callable[[], None]) -> CheckRun:
    start = time.monotonic()
    try:
        fn()
    except Exception as e:  # noqa: BLE001 - an engine crash must not abort the scan
        log.exception("check %s crashed", check.id)
        check.status = "error"
        check.reason = f"internal error: {type(e).__name__}: {e}"
    check.duration_s = round(time.monotonic() - start, 2)
    if check.status == "pending":
        check.status = "failed" if check.findings else "passed"
    return check


_DIAG_START = re.compile(r"^(Error|Warning): (.*)$")
_DIAG_ON = re.compile(r"^\s+on (.+?) line (\d+)(?:, in (.+?))?:\s*$")
_SNIPPET = re.compile(r"^\s+\d+:")


def parse_text_diagnostics(text: str) -> list[dict[str, Any]]:
    """Parse Terraform's human-readable diagnostics (used for `fmt` and as a
    fallback when -json is not supported, e.g. older OpenTofu releases)."""
    diags: list[dict[str, Any]] = []
    cur: dict[str, Any] | None = None
    for raw in text.splitlines():
        line = raw.replace("\x1b[0m", "").rstrip()
        line = re.sub(r"^│ ?", "", line)
        m = _DIAG_START.match(line.strip("╷╵ "))
        if m:
            cur = {"severity": m.group(1).lower(), "summary": m.group(2).strip(), "detail": [], "file": None, "line": None, "context": None}
            diags.append(cur)
            continue
        if cur is None:
            continue
        m = _DIAG_ON.match(line)
        if m and cur["file"] is None:
            cur["file"], cur["line"], cur["context"] = m.group(1), int(m.group(2)), m.group(3)
            continue
        if _SNIPPET.match(line):
            continue
        cur["detail"].append(line.strip())
    for d in diags:
        d["detail"] = " ".join(x for x in d["detail"] if x).strip()
    return diags


_CONTEXT = re.compile(r'^(resource|data|module|variable|output|provider) "([^"]+)"(?: "([^"]+)")?')


def address_from_context(context: str | None) -> str | None:
    """'resource "aws_instance" "web"' -> 'aws_instance.web' (Terraform snippet context)."""
    m = _CONTEXT.match(context or "")
    if not m:
        return None
    kind, a, b = m.groups()
    return {"resource": f"{a}.{b}" if b else None, "data": f"data.{a}.{b}" if b else None, "module": f"module.{a}",
            "variable": f"var.{a}", "output": f"output.{a}", "provider": f"provider.{a}"}[kind]


def finding_from_diag(engine: str, step: str, d: dict[str, Any], rule_id: str, tier: str) -> RawFinding:
    return RawFinding(engine=engine, engine_rule=f"{step}:{d.get('summary')}", rule_id=rule_id, message=d.get("summary") or "",
                      detail=d.get("detail") or None, file=d.get("file"), line=d.get("line"), end_line=d.get("end_line"),
                      column=d.get("column"), engine_severity=d.get("severity"), tier=tier, resource=address_from_context(d.get("context")))
