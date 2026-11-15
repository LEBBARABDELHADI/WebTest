"""Reporting Engine: JSON (machine contract), text (console/CI log), HTML
(self-contained, offline) and JUnit XML (CI test reports)."""
from __future__ import annotations

import json
from pathlib import Path

from ..models import Report
from . import html, junit, text

FORMATS = ("text", "json", "html", "junit")
EXTENSIONS = {"text": "txt", "json": "json", "html": "html", "junit": "xml"}


def render(report: Report, fmt: str) -> str:
    if fmt == "json":
        return json.dumps(report.to_dict(), indent=2, ensure_ascii=False, default=str) + "\n"
    if fmt == "text":
        return text.render(report)
    if fmt == "html":
        return html.render(report)
    if fmt == "junit":
        return junit.render(report)
    raise ValueError(f"unknown format {fmt!r} (choose from {', '.join(FORMATS)})")


def write_all(report: Report, formats: list[str], out_dir: Path, base_name: str = "tfpv-report") -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for fmt in formats:
        p = out_dir / f"{base_name}.{EXTENSIONS[fmt]}"
        p.write_text(render(report, fmt), encoding="utf-8")
        paths.append(p)
    return paths
