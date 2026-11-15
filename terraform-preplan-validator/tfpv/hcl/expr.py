"""Expression parser and *partial* evaluator.

Only what is knowable before ``terraform plan`` is evaluated: literals,
``var.*`` (defaults, tfvars), ``local.*``, attributes literally written on
other resources of the same module, and a few pure functions (cidrsubnet,
jsonencode, format, ...). Anything else evaluates to ``UNKNOWN`` and rules
that depend on it are reported as "not evaluable statically" instead of
guessing. This is what keeps the AWS validator free of false positives.
"""
from __future__ import annotations

import ipaddress
import json
import math
from dataclasses import dataclass
from typing import Any, Protocol

from .lexer import LexError, Token, _Cursor, tokenize


class _Unknown:
    _inst = None

    def __new__(cls):
        if cls._inst is None:
            cls._inst = super().__new__(cls)
        return cls._inst

    def __repr__(self) -> str:
        return "(unknown)"

    def __bool__(self) -> bool:
        return False


UNKNOWN = _Unknown()


@dataclass(frozen=True)
class ResourceRef:
    """A reference to another resource's computed attribute (e.g. aws_vpc.main.id)."""
    address: str
    attr: str


@dataclass(frozen=True)
class JsonDoc:
    """Result of jsonencode(...): keeps the structure (with unknown leaves)."""
    value: Any


def is_known(v: Any) -> bool:
    if v is UNKNOWN or isinstance(v, (ResourceRef,)):
        return False
    if isinstance(v, JsonDoc):
        return is_known(v.value)
    if isinstance(v, list):
        return all(is_known(x) for x in v)
    if isinstance(v, dict):
        return all(is_known(x) for x in v.values())
    return True


# ----------------------------------------------------------------------------
# AST
# ----------------------------------------------------------------------------
@dataclass
class Lit:
    value: Any


@dataclass
class Tmpl:
    parts: list  # str | node ; None marks an unsupported directive


@dataclass
class Ref:
    root: str
    path: list  # list[("attr", name) | ("index", node) | ("splat",)]


@dataclass
class Call:
    name: str
    args: list
    expand: bool = False


@dataclass
class ListX:
    items: list


@dataclass
class ObjX:
    items: list  # list[(key_node, value_node)]


@dataclass
class Cond:
    cond: Any
    a: Any
    b: Any


@dataclass
class Bin:
    op: str
    left: Any
    right: Any


@dataclass
class Un:
    op: str
    operand: Any


@dataclass
class Post:
    base: Any
    path: list


class Opaque:  # for-expressions and other constructs we do not evaluate
    pass


class ExprError(Exception):
    pass


_PREC = [("||",), ("&&",), ("==", "!="), ("<", ">", "<=", ">="), ("+", "-"), ("*", "/", "%")]


class _Parser:
    def __init__(self, toks: list[Token]):
        self.toks = [t for t in toks if t.kind != "nl"]
        if not self.toks or self.toks[-1].kind != "eof":
            self.toks.append(Token("eof", "", 0, 0, 0))
        self.i = 0

    def peek(self, k: int = 0) -> Token:
        return self.toks[min(self.i + k, len(self.toks) - 1)]

    def next(self) -> Token:
        t = self.toks[self.i]
        self.i += 1
        return t

    def accept(self, value: str) -> bool:
        t = self.peek()
        if t.kind == "op" and t.value == value:
            self.i += 1
            return True
        return False

    def expect(self, value: str) -> None:
        if not self.accept(value):
            raise ExprError(f"expected {value!r}, got {self.peek().value!r}")

    def parse(self):
        node = self.expr()
        if self.peek().kind != "eof":
            raise ExprError(f"unexpected {self.peek().value!r}")
        return node

    def expr(self):
        c = self.binary(0)
        if self.accept("?"):
            a = self.expr()
            self.expect(":")
            b = self.expr()
            return Cond(c, a, b)
        return c

    def binary(self, level: int):
        if level == len(_PREC):
            return self.unary()
        left = self.binary(level + 1)
        while True:
            t = self.peek()
            if t.kind == "op" and t.value in _PREC[level]:
                self.i += 1
                left = Bin(t.value, left, self.binary(level + 1))
            else:
                return left

    def unary(self):
        t = self.peek()
        if t.kind == "op" and t.value in ("!", "-"):
            self.i += 1
            return Un(t.value, self.unary())
        return self.postfix(self.primary())

    def traversal(self) -> list:
        path = []
        while True:
            t = self.peek()
            if t.kind == "op" and t.value == ".":
                n = self.peek(1)
                if n.kind == "op" and n.value == "*":
                    self.i += 2
                    path.append(("splat",))
                elif n.kind in ("ident", "number"):
                    self.i += 2
                    path.append(("attr", n.value) if n.kind == "ident" else ("index", Lit(int(float(n.value)))))
                else:
                    raise ExprError("bad attribute access")
            elif t.kind == "op" and t.value == "[":
                if self.peek(1).kind == "op" and self.peek(1).value == "*" and self.peek(2).value == "]":
                    self.i += 3
                    path.append(("splat",))
                else:
                    self.i += 1
                    idx = self.expr()
                    self.expect("]")
                    path.append(("index", idx))
            else:
                return path

    def postfix(self, node):
        path = self.traversal()
        if not path:
            return node
        if isinstance(node, Ref):
            node.path.extend(path)
            return node
        return Post(node, path)

    def primary(self):
        t = self.next()
        if t.kind == "number":
            v = float(t.value)
            return Lit(int(v) if v.is_integer() and "." not in t.value and "e" not in t.value.lower() else v)
        if t.kind == "string":
            return parse_template(t.value, heredoc=False)
        if t.kind == "heredoc":
            body = _dedent(t.value) if t.strip else t.value
            return parse_template(body, heredoc=True)
        if t.kind == "ident":
            if t.value == "true":
                return Lit(True)
            if t.value == "false":
                return Lit(False)
            if t.value == "null":
                return Lit(None)
            nxt = self.peek()
            if nxt.kind == "op" and nxt.value == "::":  # provider::name::fn(...)
                name = t.value
                while self.accept("::"):
                    name += "::" + self.next().value
                nxt = self.peek()
            else:
                name = t.value
            if nxt.kind == "op" and nxt.value == "(":
                self.i += 1
                args, expand = [], False
                while not self.accept(")"):
                    args.append(self.expr())
                    if self.accept("..."):
                        expand = True
                    if not self.accept(","):
                        self.expect(")")
                        break
                return Call(name, args, expand)
            return Ref(name, [])
        if t.kind == "op" and t.value == "(":
            e = self.expr()
            self.expect(")")
            return e
        if t.kind == "op" and t.value == "[":
            if self.peek().kind == "ident" and self.peek().value == "for":
                self._skip_to("]")
                return Opaque()
            items = []
            while not self.accept("]"):
                items.append(self.expr())
                if not self.accept(","):
                    self.expect("]")
                    break
            return ListX(items)
        if t.kind == "op" and t.value == "{":
            if self.peek().kind == "ident" and self.peek().value == "for":
                self._skip_to("}")
                return Opaque()
            items = []
            while not self.accept("}"):
                k = self.expr()
                if not (self.accept("=") or self.accept(":")):
                    raise ExprError("expected = in object")
                v = self.expr()
                items.append((k, v))
                self.accept(",")
            return ObjX(items)
        raise ExprError(f"unexpected token {t.value!r}")

    def _skip_to(self, closing: str) -> None:
        depth = 1
        while True:
            t = self.next()
            if t.kind == "eof":
                raise ExprError("unterminated for expression")
            if t.kind == "op" and t.value in "([{":
                depth += 1
            elif t.kind == "op" and t.value in ")]}":
                depth -= 1
                if depth == 0:
                    if t.value != closing:
                        raise ExprError("mismatched brackets")
                    return


def _dedent(body: str) -> str:
    lines = body.split("\n")
    indents = [len(l) - len(l.lstrip(" \t")) for l in lines if l.strip()]
    cut = min(indents) if indents else 0
    return "\n".join(l[cut:] for l in lines)


_ESC = {"n": "\n", "r": "\r", "t": "\t", '"': '"', "\\": "\\"}


def parse_template(raw: str, heredoc: bool) -> Any:
    parts: list = []
    buf: list[str] = []
    cur = _Cursor(raw)
    i, n = 0, len(raw)
    while i < n:
        ch = raw[i]
        if ch == "\\" and not heredoc and i + 1 < n:
            nx = raw[i + 1]
            if nx in _ESC:
                buf.append(_ESC[nx])
                i += 2
                continue
            if nx in "uU":
                width = 4 if nx == "u" else 8
                try:
                    buf.append(chr(int(raw[i + 2 : i + 2 + width], 16)))
                    i += 2 + width
                    continue
                except ValueError:
                    pass
            buf.append(ch)
            i += 1
            continue
        if ch in "$%" and raw.startswith(ch * 2 + "{", i):
            buf.append(ch + "{")
            i += 3
            continue
        if ch in "$%" and raw.startswith(ch + "{", i):
            try:
                end = cur.skip_template(i + 2)
            except LexError:
                return Opaque()
            if buf:
                parts.append("".join(buf))
                buf = []
            if ch == "%":
                parts.append(None)  # directive (%{ if }/%{ for }): not evaluated
            else:
                inner = raw[i + 2 : end - 1].strip()
                inner = inner.removeprefix("~").removesuffix("~").strip()
                try:
                    parts.append(_Parser(tokenize(inner)).parse())
                except (ExprError, LexError):
                    parts.append(Opaque())
            i = end
            continue
        buf.append(ch)
        i += 1
    if buf:
        parts.append("".join(buf))
    if not parts:
        return Lit("")
    if len(parts) == 1 and isinstance(parts[0], str):
        return Lit(parts[0])
    return Tmpl(parts)


def parse_tokens(toks: list[Token]):
    """Parse an attribute's tokens into an AST; returns Opaque() when unsupported."""
    try:
        return _Parser(list(toks)).parse()
    except (ExprError, LexError, ValueError, IndexError, RecursionError):
        return Opaque()


# ----------------------------------------------------------------------------
# Evaluation
# ----------------------------------------------------------------------------
class Scope(Protocol):
    def var(self, name: str) -> Any: ...
    def local(self, name: str) -> Any: ...
    def resource(self, rtype: str, name: str, path: list, data: bool) -> Any: ...


_SPECIAL_ROOTS = {"count", "each", "self", "path", "terraform", "module"}


def _traverse(value: Any, path: list, ev: "Evaluator") -> Any:
    for step in path:
        if value is UNKNOWN or isinstance(value, ResourceRef):
            return UNKNOWN
        if step[0] == "splat":
            return UNKNOWN
        if step[0] == "attr":
            if isinstance(value, dict) and step[1] in value:
                value = value[step[1]]
            else:
                return UNKNOWN
        else:
            idx = ev.eval(step[1])
            if isinstance(value, list) and isinstance(idx, (int, float)) and not isinstance(idx, bool):
                k = int(idx)
                value = value[k] if 0 <= k < len(value) else UNKNOWN
            elif isinstance(value, dict) and isinstance(idx, str):
                value = value.get(idx, UNKNOWN)
            else:
                return UNKNOWN
    return value


def _tostr(v: Any) -> Any:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(int(v)) if isinstance(v, float) and v.is_integer() else str(v)
    if isinstance(v, str):
        return v
    return UNKNOWN


def _tonum(v: Any) -> Any:
    if isinstance(v, bool):
        return UNKNOWN
    if isinstance(v, (int, float)):
        return v
    if isinstance(v, str):
        try:
            f = float(v)
            return int(f) if f.is_integer() and "." not in v else f
        except ValueError:
            return UNKNOWN
    return UNKNOWN


def _cidrsubnet(prefix: Any, newbits: Any, netnum: Any) -> Any:
    if not isinstance(prefix, str) or _tonum(newbits) is UNKNOWN or _tonum(netnum) is UNKNOWN:
        return UNKNOWN
    try:
        net = ipaddress.ip_network(prefix, strict=False)
        nb, num = int(_tonum(newbits)), int(_tonum(netnum))
        new_prefix = net.prefixlen + nb
        if nb < 0 or new_prefix > net.max_prefixlen or num < 0 or num >= 2**nb:
            return UNKNOWN  # terraform would raise; validate reports it
        size = 2 ** (net.max_prefixlen - new_prefix)
        addr = int(net.network_address) + num * size
        return str(ipaddress.ip_network((addr, new_prefix)))
    except ValueError:
        return UNKNOWN


def _cidrhost(prefix: Any, hostnum: Any) -> Any:
    if not isinstance(prefix, str) or _tonum(hostnum) is UNKNOWN:
        return UNKNOWN
    try:
        net = ipaddress.ip_network(prefix, strict=False)
        h = int(_tonum(hostnum))
        addr = (int(net.broadcast_address) + 1 + h) if h < 0 else int(net.network_address) + h
        return str(ipaddress.ip_address(addr))
    except ValueError:
        return UNKNOWN


def _format(fmt: Any, *args: Any) -> Any:
    if not isinstance(fmt, str) or not all(is_known(a) for a in args):
        return UNKNOWN
    out, k, i = [], 0, 0
    while i < len(fmt):
        if fmt[i] == "%" and i + 1 < len(fmt):
            spec = fmt[i + 1]
            if spec == "%":
                out.append("%")
            elif spec in "sdvq":
                if k >= len(args):
                    return UNKNOWN
                s = _tostr(args[k]) if spec != "q" else json.dumps(args[k])
                if s is UNKNOWN:
                    return UNKNOWN
                out.append(s)
                k += 1
            else:
                return UNKNOWN
            i += 2
            continue
        out.append(fmt[i])
        i += 1
    return "".join(out)


def _json_plain(v: Any) -> Any:
    if v is UNKNOWN:
        return None
    if isinstance(v, ResourceRef):
        return f"${{{v.address}.{v.attr}}}"
    if isinstance(v, JsonDoc):
        return _json_plain(v.value)
    if isinstance(v, list):
        return [_json_plain(x) for x in v]
    if isinstance(v, dict):
        return {k: _json_plain(x) for k, x in v.items()}
    return v


FUNCTIONS = {
    "cidrsubnet": _cidrsubnet,
    "cidrhost": _cidrhost,
    "format": _format,
    "lower": lambda s: s.lower() if isinstance(s, str) else UNKNOWN,
    "upper": lambda s: s.upper() if isinstance(s, str) else UNKNOWN,
    "trimspace": lambda s: s.strip() if isinstance(s, str) else UNKNOWN,
    "tostring": lambda v: _tostr(v) if v is not None else None,
    "tonumber": _tonum,
    "tobool": lambda v: v if isinstance(v, bool) else ({"true": True, "false": False}.get(v, UNKNOWN) if isinstance(v, str) else UNKNOWN),
    "tolist": lambda v: v if isinstance(v, list) else UNKNOWN,
    "toset": lambda v: v if isinstance(v, list) else UNKNOWN,
    "tomap": lambda v: v if isinstance(v, dict) else UNKNOWN,
    "length": lambda v: len(v) if isinstance(v, (list, dict, str)) and is_known(v) else UNKNOWN,
    "join": lambda sep, lst: sep.join(lst) if isinstance(sep, str) and isinstance(lst, list) and all(isinstance(x, str) for x in lst) else UNKNOWN,
    "concat": lambda *ls: [x for l in ls for x in l] if all(isinstance(l, list) for l in ls) else UNKNOWN,
    "merge": lambda *ms: {k: v for m in ms for k, v in m.items()} if all(isinstance(m, dict) for m in ms) else UNKNOWN,
    "lookup": lambda m, k, *d: (m.get(k, d[0] if d else UNKNOWN) if isinstance(m, dict) and isinstance(k, str) else UNKNOWN),
    "element": lambda l, i: (l[int(i) % len(l)] if isinstance(l, list) and l and isinstance(i, (int, float)) and not isinstance(i, bool) else UNKNOWN),
    "coalesce": lambda *xs: next((x for x in xs if x not in (None, "")), UNKNOWN) if all(x is not UNKNOWN for x in xs) else UNKNOWN,
    "min": lambda *xs: min(xs) if xs and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in xs) else UNKNOWN,
    "max": lambda *xs: max(xs) if xs and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in xs) else UNKNOWN,
    "abs": lambda x: abs(x) if isinstance(x, (int, float)) and not isinstance(x, bool) else UNKNOWN,
    "floor": lambda x: math.floor(x) if isinstance(x, (int, float)) and not isinstance(x, bool) else UNKNOWN,
    "ceil": lambda x: math.ceil(x) if isinstance(x, (int, float)) and not isinstance(x, bool) else UNKNOWN,
    "split": lambda sep, s: s.split(sep) if isinstance(sep, str) and isinstance(s, str) and sep else UNKNOWN,
    "replace": lambda s, a, b: s.replace(a, b) if all(isinstance(x, str) for x in (s, a, b)) and not (a.startswith("/") and a.endswith("/")) else UNKNOWN,
    "jsondecode": lambda s: _safe_json(s),
}


def _safe_json(s: Any) -> Any:
    if not isinstance(s, str):
        return UNKNOWN
    try:
        return json.loads(s)
    except ValueError:
        return UNKNOWN


class Evaluator:
    """Evaluate an AST against a Scope. Never raises."""

    def __init__(self, scope: Scope, depth: int = 0):
        self.scope = scope
        self.depth = depth

    def eval(self, node: Any) -> Any:
        if self.depth > 40:
            return UNKNOWN
        self.depth += 1
        try:
            return self._eval(node)
        except (TypeError, ValueError, ZeroDivisionError, KeyError, IndexError, AttributeError, RecursionError, OverflowError):
            return UNKNOWN
        finally:
            self.depth -= 1

    def _eval(self, node: Any) -> Any:
        if isinstance(node, Lit):
            return node.value
        if isinstance(node, Tmpl):
            out = []
            for p in node.parts:
                if isinstance(p, str):
                    out.append(p)
                    continue
                if p is None or isinstance(p, Opaque):
                    return UNKNOWN
                v = _tostr(self.eval(p))
                if v is UNKNOWN:
                    return UNKNOWN
                out.append(v)
            return "".join(out)
        if isinstance(node, Ref):
            return self._ref(node)
        if isinstance(node, ListX):
            return [self.eval(x) for x in node.items]
        if isinstance(node, ObjX):
            out = {}
            for k, v in node.items:
                # A bare identifier key is a literal name (HCL object syntax).
                key = k.root if isinstance(k, Ref) and not k.path else self.eval(k)
                if not isinstance(key, str):
                    key = _tostr(key)
                    if key is UNKNOWN:
                        return UNKNOWN
                out[key] = self.eval(v)
            return out
        if isinstance(node, Call):
            fn = node.name
            if fn == "jsonencode" and len(node.args) == 1:
                return JsonDoc(self.eval(node.args[0]))
            impl = FUNCTIONS.get(fn)
            if impl is None or node.expand:
                return UNKNOWN
            args = [self.eval(a) for a in node.args]
            if fn not in ("coalesce", "concat", "merge", "length") and any(a is UNKNOWN for a in args):
                return UNKNOWN
            return impl(*args)
        if isinstance(node, Cond):
            c = self.eval(node.cond)
            if c is True:
                return self.eval(node.a)
            if c is False:
                return self.eval(node.b)
            return UNKNOWN
        if isinstance(node, Un):
            v = self.eval(node.operand)
            if node.op == "!" and isinstance(v, bool):
                return not v
            if node.op == "-" and isinstance(v, (int, float)) and not isinstance(v, bool):
                return -v
            return UNKNOWN
        if isinstance(node, Bin):
            return self._bin(node)
        if isinstance(node, Post):
            return _traverse(self.eval(node.base), node.path, self)
        return UNKNOWN

    def _bin(self, node: Bin) -> Any:
        a, b = self.eval(node.left), self.eval(node.right)
        op = node.op
        if op in ("&&", "||"):
            if isinstance(a, bool) and isinstance(b, bool):
                return (a and b) if op == "&&" else (a or b)
            return UNKNOWN
        if not (is_known(a) and is_known(b)):
            return UNKNOWN
        if op == "==":
            return a == b
        if op == "!=":
            return a != b
        na, nb = _tonum(a), _tonum(b)
        if na is UNKNOWN or nb is UNKNOWN:
            return UNKNOWN
        if op == "+":
            return na + nb
        if op == "-":
            return na - nb
        if op == "*":
            return na * nb
        if op == "/":
            return na / nb
        if op == "%":
            return na % nb
        if op == "<":
            return na < nb
        if op == ">":
            return na > nb
        if op == "<=":
            return na <= nb
        if op == ">=":
            return na >= nb
        return UNKNOWN

    def _ref(self, node: Ref) -> Any:
        root, path = node.root, node.path
        if root == "var":
            if not path or path[0][0] != "attr":
                return UNKNOWN
            return _traverse(self.scope.var(path[0][1]), path[1:], self)
        if root == "local":
            if not path or path[0][0] != "attr":
                return UNKNOWN
            return _traverse(self.scope.local(path[0][1]), path[1:], self)
        if root == "data":
            if len(path) < 2 or path[0][0] != "attr" or path[1][0] != "attr":
                return UNKNOWN
            return self.scope.resource(path[0][1], path[1][1], path[2:], True)
        if root in _SPECIAL_ROOTS:
            return UNKNOWN
        if "_" in root and path and path[0][0] == "attr":
            return self.scope.resource(root, path[0][1], path[1:], False)
        return UNKNOWN


class EmptyScope:
    def var(self, name: str) -> Any:
        return UNKNOWN

    def local(self, name: str) -> Any:
        return UNKNOWN

    def resource(self, rtype: str, name: str, path: list, data: bool) -> Any:
        return UNKNOWN


def literal(tokens: list[Token]) -> Any:
    """Evaluate tokens with no variables (tfvars files, constant attributes)."""
    return Evaluator(EmptyScope()).eval(parse_tokens(tokens))


def references(node: Any) -> list[Ref]:
    """All references (var.x, local.y, aws_vpc.main...) found in an AST."""
    out: list[Ref] = []

    def walk(n: Any) -> None:
        if isinstance(n, Ref):
            out.append(n)
            for step in n.path:
                if step[0] == "index":
                    walk(step[1])
        elif isinstance(n, Tmpl):
            for p in n.parts:
                if not isinstance(p, str) and p is not None:
                    walk(p)
        elif isinstance(n, (ListX,)):
            for x in n.items:
                walk(x)
        elif isinstance(n, ObjX):
            for k, v in n.items:
                if not (isinstance(k, Ref) and not k.path):
                    walk(k)
                walk(v)
        elif isinstance(n, Call):
            for a in n.args:
                walk(a)
        elif isinstance(n, Cond):
            walk(n.cond), walk(n.a), walk(n.b)
        elif isinstance(n, Bin):
            walk(n.left), walk(n.right)
        elif isinstance(n, Un):
            walk(n.operand)
        elif isinstance(n, Post):
            walk(n.base)
            for step in n.path:
                if step[0] == "index":
                    walk(step[1])

    walk(node)
    return out


def plain(value: Any) -> Any:
    """JSON-friendly representation of an evaluated value (unknown → None)."""
    return _json_plain(value)
