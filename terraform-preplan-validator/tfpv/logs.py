"""Logging setup: stderr (and optional file), secrets redacted in every record."""
from __future__ import annotations

import logging

from .redact import RedactingFilter, Redactor

_redactor = Redactor()


def setup(level: str = "WARNING", log_file: str | None = None) -> Redactor:
    root = logging.getLogger("tfpv")
    root.handlers.clear()
    root.setLevel(getattr(logging, level.upper(), logging.WARNING))
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s", "%H:%M:%S")
    handlers: list[logging.Handler] = [logging.StreamHandler()]
    if log_file:
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))
    for h in handlers:
        h.setFormatter(fmt)
        h.addFilter(RedactingFilter(_redactor))
        root.addHandler(h)
    root.propagate = False
    return _redactor
