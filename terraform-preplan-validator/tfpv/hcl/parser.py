"""Structural parser: turns tokens into blocks and attributes with line ranges.

Expressions are not interpreted here; each attribute keeps its token list so
that :mod:`tfpv.hcl.expr` can evaluate it later, only when a rule needs it.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .lexer import LexError, Token, tokenize


class ParseError(Exception):
    def __init__(self, message: str, line: int, col: int = 1):
        super().__init__(f"{message} (line {line})")
        self.message = message
        self.line = line
        self.col = col


@dataclass
class Attribute:
    name: str
    line: int
    end_line: int
    tokens: list[Token]


@dataclass
class Block:
    type: str
    labels: list[str]
    line: int
    end_line: int = 0
    attributes: dict[str, Attribute] = field(default_factory=dict)
    blocks: list["Block"] = field(default_factory=list)

    def children(self, block_type: str) -> list["Block"]:
        return [b for b in self.blocks if b.type == block_type]

    def address(self) -> str:
        if self.type in ("resource",) and len(self.labels) == 2:
            return f"{self.labels[0]}.{self.labels[1]}"
        if self.type == "data" and len(self.labels) == 2:
            return f"data.{self.labels[0]}.{self.labels[1]}"
        if self.type == "module" and self.labels:
            return f"module.{self.labels[0]}"
        if self.type == "variable" and self.labels:
            return f"var.{self.labels[0]}"
        return " ".join([self.type, *self.labels])


@dataclass
class HclFile:
    path: str  # relative, posix
    text: str
    blocks: list[Block] = field(default_factory=list)
    attributes: dict[str, Attribute] = field(default_factory=dict)  # top level (tfvars)
    error: ParseError | None = None

    @property
    def lines(self) -> list[str]:
        return self.text.splitlines()

    def block_at(self, line: int) -> Block | None:
        """Top-level block that contains the given line."""
        for b in self.blocks:
            if b.line <= line <= b.end_line:
                return b
        return None


def _is(tok: Token, value: str) -> bool:
    return tok.kind == "op" and tok.value == value


def _skip_expression(toks: list[Token], i: int) -> int:
    """Return the index of the token that ends the expression starting at i:
    a newline at nesting depth 0, a closing brace of the enclosing block, or EOF."""
    depth = 0
    while True:
        t = toks[i]
        if t.kind == "eof":
            return i
        if t.kind == "nl" and depth == 0:
            return i
        if t.kind == "op":
            if t.value in "([{":
                depth += 1
            elif t.value in ")]}":
                if depth == 0:
                    return i
                depth -= 1
        i += 1


def _parse_body(toks: list[Token], i: int, owner: Block | None, top: list[Block]) -> int:
    attrs = owner.attributes if owner else None
    while True:
        t = toks[i]
        if t.kind == "nl":
            i += 1
            continue
        if t.kind == "eof":
            if owner is not None:
                raise ParseError(f'unclosed block "{owner.type}" opened at line {owner.line}', t.line)
            return i
        if _is(t, "}"):
            if owner is None:
                raise ParseError("unexpected closing brace", t.line, t.col)
            owner.end_line = t.line
            return i + 1
        if t.kind != "ident":
            raise ParseError(f"unexpected token {t.value!r}: expected an argument or a block", t.line, t.col)
        nxt = toks[i + 1]
        if _is(nxt, "="):
            end = _skip_expression(toks, i + 2)
            expr = [x for x in toks[i + 2 : end] if x.kind != "nl"]
            if not expr:
                raise ParseError(f'missing value for argument "{t.value}"', t.line, t.col)
            attr = Attribute(t.value, t.line, expr[-1].end_line, expr)
            if attrs is None:
                raise ParseError("argument outside of a block", t.line, t.col)
            attrs[t.value] = attr
            i = end
            continue
        j = i + 1
        labels: list[str] = []
        while toks[j].kind in ("string", "ident"):
            labels.append(toks[j].value)
            j += 1
        if not _is(toks[j], "{"):
            raise ParseError(f'expected "=" or "{{" after "{t.value}"', toks[j].line, toks[j].col)
        block = Block(t.value, labels, t.line)
        (top if owner is None else owner.blocks).append(block)
        i = _parse_body(toks, j + 1, block, top)


def parse_text(text: str, path: str = "<memory>", tfvars: bool = False) -> HclFile:
    """Parse HCL text. Never raises: errors are stored on the returned HclFile."""
    hf = HclFile(path=path, text=text)
    try:
        toks = tokenize(text)
    except LexError as e:
        hf.error = ParseError(e.message, e.line, e.col)
        return hf
    if tfvars:
        root = Block("__tfvars__", [], 1)
        try:
            i = 0
            while toks[i].kind != "eof":
                t = toks[i]
                if t.kind == "nl":
                    i += 1
                    continue
                if t.kind != "ident" or not _is(toks[i + 1], "="):
                    raise ParseError(f"unexpected token {t.value!r} in variable definitions file", t.line, t.col)
                end = _skip_expression(toks, i + 2)
                expr = [x for x in toks[i + 2 : end] if x.kind != "nl"]
                root.attributes[t.value] = Attribute(t.value, t.line, expr[-1].end_line if expr else t.line, expr)
                i = end
                if toks[i].kind == "op":  # stray closing bracket
                    raise ParseError(f"unexpected {toks[i].value!r}", toks[i].line, toks[i].col)
        except ParseError as e:
            hf.error = e
        hf.attributes = root.attributes
        return hf
    top: list[Block] = []
    try:
        _parse_body(toks, 0, None, top)
    except ParseError as e:
        hf.error = e
    hf.blocks = top
    return hf


def parse_file(path: Path, rel: str) -> HclFile:
    text = path.read_text(encoding="utf-8", errors="replace")
    return parse_text(text, rel, tfvars=rel.endswith(".tfvars"))
