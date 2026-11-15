"""Tokenizer for HCL2 / Terraform native syntax.

The tokenizer only needs to be good enough to recover the *structure* of a
configuration (blocks, attributes, expressions) with exact line numbers.
Terraform itself remains the authority on syntax: when this lexer cannot read
a file, tfpv reports a coverage gap, not a syntax error (unless Terraform is
unavailable to confirm it).
"""
from __future__ import annotations

import re
from dataclasses import dataclass

IDENT_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_-]*")
NUMBER_RE = re.compile(r"\d+(?:\.\d+)?(?:[eE][+-]?\d+)?")
HEREDOC_RE = re.compile(r"<<(-?)([A-Za-z_][A-Za-z0-9_-]*)[ \t]*\r?\n")
OPS3 = ("...",)
OPS2 = ("==", "!=", "<=", ">=", "&&", "||", "=>", "::")
OPS1 = "{}[]()=,.:?!+-*/%<>"


class LexError(Exception):
    def __init__(self, message: str, line: int, col: int):
        super().__init__(f"{message} (line {line}, column {col})")
        self.message = message
        self.line = line
        self.col = col


@dataclass(slots=True)
class Token:
    kind: str  # ident | number | string | heredoc | op | nl | eof
    value: str  # string: raw inner text; heredoc: body; others: source text
    line: int
    col: int
    end_line: int
    strip: bool = False  # heredoc declared with <<- (indented)


class _Cursor:
    __slots__ = ("text", "n")

    def __init__(self, text: str):
        self.text = text
        self.n = len(text)

    def skip_string(self, j: int) -> int:
        """j points at an opening quote; returns the index after the closing quote."""
        text, n = self.text, self.n
        j += 1
        while j < n:
            ch = text[j]
            if ch == "\\":
                j += 2
                continue
            if ch in "$%" and text.startswith(ch * 2 + "{", j):  # $${ / %%{ : literal
                j += 3
                continue
            if ch in "$%" and text.startswith(ch + "{", j):
                j = self.skip_template(j + 2)
                continue
            if ch == '"':
                return j + 1
            if ch == "\n":
                raise LexError("unterminated string", *_pos(text, j))
            j += 1
        raise LexError("unterminated string", *_pos(text, j))

    def skip_template(self, j: int) -> int:
        """j points just after "${" or "%{"; returns the index after the matching "}"."""
        text, n = self.text, self.n
        depth = 1
        while j < n:
            ch = text[j]
            if ch == '"':
                j = self.skip_string(j)
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return j + 1
            j += 1
        raise LexError("unterminated template interpolation", *_pos(text, j))


def _pos(text: str, idx: int) -> tuple[int, int]:
    line = text.count("\n", 0, idx) + 1
    last_nl = text.rfind("\n", 0, idx)
    return line, idx - last_nl


def tokenize(text: str) -> list[Token]:
    """Split HCL source into tokens. Comments are dropped; newlines are kept
    because they terminate attributes in HCL."""
    toks: list[Token] = []
    cur = _Cursor(text)
    n = len(text)
    i = 0
    line = 1
    line_start = 0

    def add(kind: str, value: str, start: int, end: int, strip: bool = False) -> None:
        nonlocal line, line_start
        start_line, col = line, start - line_start + 1
        nls = text.count("\n", start, end)
        if nls:
            line += nls
            line_start = text.rfind("\n", start, end) + 1
        toks.append(Token(kind, value, start_line, col, line, strip))

    while i < n:
        c = text[i]
        if c == "\n":
            toks.append(Token("nl", "\n", line, i - line_start + 1, line))
            i += 1
            line += 1
            line_start = i
            continue
        if c in " \t\r﻿":
            i += 1
            continue
        if c == "#" or text.startswith("//", i):
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            if j < 0:
                raise LexError("unterminated comment", line, i - line_start + 1)
            nls = text.count("\n", i, j)
            if nls:
                line += nls
                line_start = text.rfind("\n", i, j) + 1
            i = j + 2
            continue
        if c == '"':
            j = cur.skip_string(i)
            add("string", text[i + 1 : j - 1], i, j)
            i = j
            continue
        if c == "<" and text.startswith("<<", i):
            m = HEREDOC_RE.match(text, i)
            if m:
                marker = m.group(2)
                body_start = m.end()
                end_re = re.compile(r"^[ \t]*" + re.escape(marker) + r"[ \t]*\r?$", re.M)
                em = end_re.search(text, body_start)
                if not em:
                    raise LexError(f"unterminated heredoc {marker}", line, i - line_start + 1)
                body = text[body_start : em.start()]
                add("heredoc", body, i, em.end(), strip=bool(m.group(1)))
                i = em.end()
                continue
        if c.isdigit():
            m = NUMBER_RE.match(text, i)
            add("number", m.group(0), i, m.end())
            i = m.end()
            continue
        if c.isalpha() or c == "_":
            m = IDENT_RE.match(text, i)
            add("ident", m.group(0), i, m.end())
            i = m.end()
            continue
        for op in OPS3 + OPS2:
            if text.startswith(op, i):
                add("op", op, i, i + len(op))
                i += len(op)
                break
        else:
            if c in OPS1:
                add("op", c, i, i + 1)
                i += 1
            else:
                raise LexError(f"unexpected character {c!r}", line, i - line_start + 1)
    toks.append(Token("eof", "", line, i - line_start + 1, line))
    return toks
