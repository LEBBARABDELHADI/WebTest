from tfpv.hcl.expr import UNKNOWN, Evaluator, JsonDoc, ResourceRef, literal, parse_tokens, references
from tfpv.hcl.parser import parse_text
from tfpv.hcl.types import check_value, parse_type


class Scope:
    def __init__(self, v=None, loc=None):
        self.v, self.loc = v or {}, loc or {}

    def var(self, n):
        return self.v.get(n, UNKNOWN)

    def local(self, n):
        return self.loc.get(n, UNKNOWN)

    def resource(self, t, n, path, data):
        return ResourceRef(f"{t}.{n}", path[0][1]) if path else UNKNOWN


def ev(expr, **vars_):
    hf = parse_text(f'resource "x" "y" {{\n  a = {expr}\n}}\n')
    assert hf.error is None, hf.error
    return Evaluator(Scope(vars_)).eval(parse_tokens(hf.blocks[0].attributes["a"].tokens))


def test_blocks_lines_and_nested_blocks():
    hf = parse_text('resource "aws_security_group" "web" {\n  name = "x"\n\n  ingress {\n    from_port = 22\n  }\n}\n')
    b = hf.blocks[0]
    assert (b.type, b.labels, b.line, b.end_line) == ("resource", ["aws_security_group", "web"], 1, 7)
    assert b.attributes["name"].line == 2
    assert b.children("ingress")[0].attributes["from_port"].line == 5


def test_strings_heredocs_comments_and_one_line_blocks():
    src = '/* c\n */ locals { a = "x-${lookup(var.m, "k}")}" }  # c\nresource "a" "b" {\n  p = <<-EOT\n    {"k": "}"}\n  EOT\n  q = 1 // c\n}\n'
    hf = parse_text(src)
    assert hf.error is None
    assert [b.type for b in hf.blocks] == ["locals", "resource"]
    assert hf.blocks[1].attributes["q"].line == 7


def test_syntax_errors_are_reported_not_raised():
    assert parse_text('resource "a" "b" {\n  s = \n}\n').error.line == 2
    assert "unclosed" in parse_text('resource "a" "b" {\n  s = 1\n').error.message
    assert parse_text('a = "unterminated\n', tfvars=True).error is not None


def test_evaluator_known_values():
    assert ev("cidrsubnet(var.c, 8, 1)", c="10.0.0.0/16") == "10.0.1.0/24"
    assert ev('"my-${var.env}-x"', env="prod") == "my-prod-x"
    assert ev('var.n > 2 ? "big" : "small"', n=3) == "big"
    assert ev('format("%s-%d", "a", 3)') == "a-3"
    assert ev("aws_vpc.main.id") == ResourceRef("aws_vpc.main", "id")
    assert ev('"a\\"b$${x}"') == 'a"b${x}'
    doc = ev('jsonencode({ Version = "2012-10-17", Statement = [{ Principal = { Service = "ec2.amazonaws.com" } }] })')
    assert isinstance(doc, JsonDoc) and doc.value["Statement"][0]["Principal"]["Service"] == "ec2.amazonaws.com"


def test_evaluator_returns_unknown_instead_of_guessing():
    assert ev("var.missing") is UNKNOWN
    assert ev("[for s in var.l : s.id]", l=[1]) is UNKNOWN  # for-expressions are not evaluated
    assert ev("aws_subnet.x[*].id") is UNKNOWN
    assert ev("count.index") is UNKNOWN
    assert ev("cidrsubnet(var.c, 8, 1)") is UNKNOWN
    assert ev("unknown_function(1)") is UNKNOWN


def test_references_skip_object_keys():
    hf = parse_text('resource "x" "y" {\n  a = { Name = var.n, (local.k) = aws_vpc.main.id }\n}\n')
    refs = references(parse_tokens(hf.blocks[0].attributes["a"].tokens))
    assert sorted(r.root for r in refs) == ["aws_vpc", "local", "var"]


def test_tfvars_literals():
    hf = parse_text('a = "x"\nb = 3\nc = ["1", 2]\nd = { k = "v" }\ne = true\n', tfvars=True)
    vals = {k: literal(a.tokens) for k, a in hf.attributes.items()}
    assert vals == {"a": "x", "b": 3, "c": ["1", 2], "d": {"k": "v"}, "e": True}


def _type(src):
    hf = parse_text(f'variable "v" {{\n  type = {src}\n}}\n')
    return parse_type(parse_tokens(hf.blocks[0].attributes["type"].tokens))


def test_type_checks_follow_terraform_conversions():
    assert check_value("three", _type("number"))
    assert check_value("3", _type("number")) is None
    assert check_value(5, _type("string")) is None
    assert check_value("yes", _type("bool"))
    assert check_value(["a", 1], _type("list(number)"))
    assert check_value({"a": "x"}, _type("object({ a = string, b = optional(number, 1) })")) is None
    assert 'attribute "b" is required' in check_value({"a": "x"}, _type("object({ a = string, b = number })"))
    assert check_value({"z": 1}, _type("any")) is None
    assert check_value(UNKNOWN, _type("number")) is None
