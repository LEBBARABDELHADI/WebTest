"""Terraform type constraints (variable "x" { type = ... }) and value checks.

Used to catch tfvars values that ``terraform plan`` would reject with
"Invalid value for input variable" — ``terraform validate`` does not check
variable values at all.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .expr import Call, ListX, ObjX, Opaque, Ref, UNKNOWN, is_known


@dataclass
class TType:
    kind: str  # string | number | bool | any | list | set | map | tuple | object | unknown
    elem: "TType | None" = None
    attrs: dict[str, tuple["TType", bool]] = field(default_factory=dict)  # name -> (type, optional)
    items: list["TType"] = field(default_factory=list)

    def __str__(self) -> str:
        if self.kind in ("list", "set", "map"):
            return f"{self.kind}({self.elem})"
        if self.kind == "object":
            inner = ", ".join(f"{k}={'optional(' + str(t) + ')' if o else t}" for k, (t, o) in self.attrs.items())
            return f"object({{{inner}}})"
        if self.kind == "tuple":
            return f"tuple([{', '.join(map(str, self.items))}])"
        return self.kind


ANY = TType("any")
UNKNOWN_TYPE = TType("unknown")


def parse_type(node: Any) -> TType:
    """Turn a parsed `type = ...` expression into a TType (unknown if unsupported)."""
    if isinstance(node, Ref) and not node.path:
        if node.root in ("string", "number", "bool", "any"):
            return TType(node.root)
        return UNKNOWN_TYPE
    if isinstance(node, Call):
        if node.name in ("list", "set", "map") and len(node.args) == 1:
            return TType(node.name, elem=parse_type(node.args[0]))
        if node.name == "tuple" and len(node.args) == 1 and isinstance(node.args[0], ListX):
            return TType("tuple", items=[parse_type(x) for x in node.args[0].items])
        if node.name == "object" and len(node.args) == 1 and isinstance(node.args[0], ObjX):
            attrs = {}
            for k, v in node.args[0].items:
                if not (isinstance(k, Ref) and not k.path):
                    return UNKNOWN_TYPE
                optional = isinstance(v, Call) and v.name == "optional"
                attrs[k.root] = (parse_type(v.args[0]) if optional and v.args else parse_type(v), optional)
            return TType("object", attrs=attrs)
    if isinstance(node, Opaque):
        return UNKNOWN_TYPE
    return UNKNOWN_TYPE


def _describe(v: Any) -> str:
    if isinstance(v, bool):
        return "bool"
    if isinstance(v, (int, float)):
        return "number"
    if isinstance(v, str):
        return "string"
    if isinstance(v, list):
        return "list/tuple"
    if isinstance(v, dict):
        return "object/map"
    return "null"


def check_value(value: Any, t: TType, path: str = "") -> str | None:
    """Return None when Terraform can convert `value` to type `t`, else a reason.
    Unknown values or types are accepted (no false positives)."""
    where = f" at {path}" if path else ""
    if value is None or value is UNKNOWN or t.kind in ("any", "unknown") or not is_known(value):
        return None
    k = t.kind
    if k == "string":
        if isinstance(value, (str, int, float, bool)):
            return None
        return f"string required{where}, got {_describe(value)}"
    if k == "number":
        if isinstance(value, bool):
            return f"number required{where}, got bool"
        if isinstance(value, (int, float)):
            return None
        if isinstance(value, str):
            try:
                float(value)
                return None
            except ValueError:
                return f"a number is required{where}, got string {value!r}"
        return f"number required{where}, got {_describe(value)}"
    if k == "bool":
        if isinstance(value, bool) or (isinstance(value, str) and value in ("true", "false")):
            return None
        return f"bool required{where}, got {_describe(value)}"
    if k in ("list", "set"):
        if not isinstance(value, list):
            return f"{t} required{where}, got {_describe(value)}"
        for i, x in enumerate(value):
            r = check_value(x, t.elem or ANY, f"{path}[{i}]")
            if r:
                return r
        return None
    if k == "tuple":
        if not isinstance(value, list):
            return f"{t} required{where}, got {_describe(value)}"
        if len(value) != len(t.items):
            return f"tuple of {len(t.items)} elements required{where}, got {len(value)}"
        for i, (x, it) in enumerate(zip(value, t.items)):
            r = check_value(x, it, f"{path}[{i}]")
            if r:
                return r
        return None
    if k == "map":
        if not isinstance(value, dict):
            return f"{t} required{where}, got {_describe(value)}"
        for key, x in value.items():
            r = check_value(x, t.elem or ANY, f"{path}[{key!r}]")
            if r:
                return r
        return None
    if k == "object":
        if not isinstance(value, dict):
            return f"object required{where}, got {_describe(value)}"
        for name, (at, optional) in t.attrs.items():
            if name not in value:
                if not optional:
                    return f'attribute "{name}" is required{where}'
                continue
            r = check_value(value[name], at, f"{path}.{name}" if path else name)
            if r:
                return r
        return None
    return None
