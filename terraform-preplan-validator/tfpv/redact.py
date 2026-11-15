"""Secret redaction for reports and logs.

Applied to every string that leaves the tool (report fields, snippets, engine
messages, log records). Two mechanisms:

* patterns: well-known secret formats (AWS keys, private keys, tokens) and
  `password = "..."`-style assignments;
* known values: values of variables declared ``sensitive = true`` and of
  secret-looking arguments found in the configuration and tfvars.
"""
from __future__ import annotations

import logging
import re
from typing import Any

MASK = "***REDACTED***"

SECRET_NAME_RE = re.compile(
    r"(pass(word|wd|phrase)?|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|credential|auth|signing[_-]?key|session[_-]?key)",
    re.I,
)
_PATTERNS = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?(-----END [A-Z ]*PRIVATE KEY-----|$)", re.S),
    re.compile(r"\b(AKIA|ASIA|AGPA|AIDA|AROA|ANPA|ANVA|AIPA)[A-Z0-9]{16}\b"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{40,}\b"),
    re.compile(r"\bglpat-[A-Za-z0-9_-]{16,}\b"),
    re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}\b"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
]
# name = "value" / name: "value" / "name": "value" where the name looks secret
_ASSIGN_RE = re.compile(
    r"""(?P<key>["']?[A-Za-z0-9_.-]*(?:pass(?:word|wd|phrase)?|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|credentials?)[A-Za-z0-9_.-]*["']?\s*[:=]\s*)(?P<q>["'])(?P<val>[^"'\n]{1,})(?P=q)""",
    re.I,
)


def is_secret_name(name: str | None) -> bool:
    return bool(name) and bool(SECRET_NAME_RE.search(name))


class Redactor:
    def __init__(self) -> None:
        self.values: set[str] = set()
        self.count = 0

    def add_value(self, value: Any) -> None:
        if isinstance(value, str) and len(value) >= 4 and value not in ("true", "false", "null"):
            self.values.add(value)

    def text(self, s: Any) -> Any:
        if not isinstance(s, str) or not s:
            return s
        out = s
        for v in sorted(self.values, key=len, reverse=True):
            if v in out:
                self.count += out.count(v)
                out = out.replace(v, MASK)
        for p in _PATTERNS:
            out, n = p.subn(MASK, out)
            self.count += n

        def repl(m: re.Match) -> str:
            if m.group("val") == MASK or m.group("val").startswith("${") or m.group("val").startswith("var.") or m.group("val").startswith("***"):
                return m.group(0)
            self.count += 1
            return f"{m.group('key')}{m.group('q')}{MASK}{m.group('q')}"

        out = _ASSIGN_RE.sub(repl, out)
        return out

    def value(self, attribute: str | None, value: Any) -> Any:
        """Mask a finding's value when the attribute name looks secret."""
        if value is None:
            return None
        if is_secret_name(attribute):
            self.count += 1
            return MASK
        if isinstance(value, str):
            return self.text(value)
        if isinstance(value, list):
            return [self.value(None, v) for v in value]
        if isinstance(value, dict):
            return {k: self.value(k, v) for k, v in value.items()}
        return value

    def deep(self, obj: Any) -> Any:
        """Redact every string in a JSON-like structure."""
        if isinstance(obj, str):
            return self.text(obj)
        if isinstance(obj, list):
            return [self.deep(x) for x in obj]
        if isinstance(obj, dict):
            return {k: self.deep(v) for k, v in obj.items()}
        return obj


class RedactingFilter(logging.Filter):
    """Logging filter: never let a secret reach the log output."""

    def __init__(self, redactor: Redactor):
        super().__init__()
        self.redactor = redactor

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
        except Exception:  # noqa: BLE001 - malformed log call: keep the raw message
            msg = str(record.msg)
        record.msg = self.redactor.text(msg)
        record.args = None
        return True
