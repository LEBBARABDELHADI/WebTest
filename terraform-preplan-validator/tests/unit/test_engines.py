"""Engine adapters fed with real outputs captured from terraform 1.17.2,
TFLint 0.66.0 + AWS ruleset 0.50.0 and Checkov 3.4.5 (tests/fixtures/captured)."""
import shutil
from pathlib import Path

import pytest

from conftest import FIXTURES, FakeRunner
from tfpv.engines import checkov, native, tflint
from tfpv.engines.base import EngineContext, parse_text_diagnostics
from tfpv.models import ScanOptions
from tfpv.runner import Result
from tfpv.scanner import load_project
from tfpv.tools import Tool


def ctx_for(root: Path, runner, tmp: Path, **opts) -> EngineContext:
    tools = {n: Tool(n, f"/usr/bin/{n}") for n in ("terraform", "tflint", "checkov")}
    return EngineContext(root=root, project=load_project(root), options=ScanOptions(**opts), runner=runner, tools=tools, tmp=tmp)


@pytest.fixture
def invalid(tmp_path):
    dest = tmp_path / "invalid_aws"
    shutil.copytree(FIXTURES / "invalid_aws", dest)
    return dest


def test_tflint_adapter(invalid, tmp_path, captured):
    runner = FakeRunner({"--format=json": (2, captured("tflint.json"), ""), "--init": (0, "", "")})
    check, aws = tflint.run(ctx_for(invalid, runner, tmp_path))
    assert aws.status == "failed" and check.status == "failed"
    f = aws.findings[0]
    assert (f.engine_rule, f.file, f.line, f.value, f.attribute) == ("aws_instance_invalid_type", "main.tf", 3, "t3.invalid", "instance_type")
    assert check.findings[0].engine_rule == "terraform_unused_declarations"
    assert (tmp_path / "tflint.hcl").read_text().count('plugin "aws"') == 1


def test_tflint_project_config_without_aws_is_not_a_pass(invalid, tmp_path):
    (invalid / ".tflint.hcl").write_text('plugin "terraform" {\n  enabled = true\n}\n')
    runner = FakeRunner({"--format=json": (0, '{"issues":[],"errors":[]}', ""), "--init": (0, "", "")})
    check, aws = tflint.run(ctx_for(invalid, runner, tmp_path))
    assert check.status == "passed"
    assert aws.status == "skipped" and "not enabled" in aws.reason


def test_tflint_missing_plugin_is_an_error(invalid, tmp_path):
    out = '{"issues":[],"errors":[{"message":"Plugin `aws` not found. Did you run `tflint --init`?","severity":"error"}]}'
    runner = FakeRunner({"--format=json": (1, out, ""), "--init": (1, "", "network unreachable")})
    check, aws = tflint.run(ctx_for(invalid, runner, tmp_path))
    assert check.status == "error" and aws.status == "error"


def test_checkov_adapter(invalid, tmp_path, captured):
    runner = FakeRunner({"checkov": (0, captured("checkov.json"), "")})
    check = checkov.run(ctx_for(invalid, runner, tmp_path))
    ids = {f.engine_rule for f in check.findings}
    assert {"CKV_AWS_24", "CKV_AWS_62", "CKV2_AWS_6"} <= ids
    assert check.passed_count == 32
    ssh = next(f for f in check.findings if f.engine_rule == "CKV_AWS_24")
    assert (ssh.file, ssh.resource, ssh.line) == ("network.tf", "aws_security_group.web", 20)
    assert "--skip-download" in runner.calls[0] and "--compact" in runner.calls[0]


def test_checkov_parse_errors_make_the_check_partial(invalid, tmp_path):
    out = '{"check_type": "terraform", "results": {"failed_checks": []}, "summary": {"passed": 0, "failed": 0, "skipped": 0, "parsing_errors": 1, "resource_count": 0, "checkov_version": "3.4.5"}}'
    check = checkov.run(ctx_for(invalid, FakeRunner({"checkov": (0, out, "")}), tmp_path))
    assert check.partial and "could not be parsed" in check.reason


def test_native_adapters(invalid, tmp_path, captured):
    runner = FakeRunner({
        " fmt ": (3, "unformatted.tf\n", ""),
        " init ": (0, captured("init.jsonl"), ""),
        " validate ": (1, captured("validate.json"), ""),
    })
    ctx = ctx_for(invalid, runner, tmp_path)
    fmt = native.run_fmt(ctx)
    assert fmt.status == "failed" and fmt.findings[0].file == "unformatted.tf"
    init, validate = native.run_init_validate(ctx)
    assert init.status == "passed"  # the "undeclared variable" warning is reported by the scanner instead
    assert validate.status == "failed"
    f = validate.findings[0]
    assert (f.rule_id, f.file, f.line, f.resource) == ("TF_UNDECLARED_REFERENCE", "network.tf", 47, "aws_route_table.rt")
    init_call = next(c for c in runner.calls if "init" in c)
    assert "-backend=false" in init_call and "-input=false" in init_call
    assert not (invalid / ".terraform.lock.hcl").exists() and not (invalid / ".terraform").exists()


def test_validate_is_skipped_not_passed_when_init_fails(invalid, tmp_path):
    runner = FakeRunner({" init ": (1, '{"type":"diagnostic","diagnostic":{"severity":"error","summary":"Failed to query available provider packages","detail":"registry unreachable"}}\n', "")})
    init, validate = native.run_init_validate(ctx_for(invalid, runner, tmp_path))
    assert init.status == "failed" and init.findings[0].rule_id == "TF_PROVIDER_RESOLUTION"
    assert validate.status == "skipped"


def test_offline_skips_network_steps(invalid, tmp_path):
    runner = FakeRunner({})
    init, validate = native.run_init_validate(ctx_for(invalid, runner, tmp_path, offline=True))
    assert init.status == validate.status == "skipped" and runner.calls == []


def test_text_diagnostics_parser(captured):
    diags = parse_text_diagnostics(captured("fmt_syntax.txt"))
    assert [(d["summary"], d["file"], d["line"]) for d in diags] == [("Invalid expression", "broken.tf", 2), ("Invalid multi-line string", "broken.tf", 6)]
    assert diags[0]["context"] == 'resource "aws_instance" "x"'


def test_missing_tools_are_skipped_with_a_reason(invalid, tmp_path):
    ctx = ctx_for(invalid, FakeRunner({}), tmp_path)
    ctx.tools = {n: Tool(n, None) for n in ("terraform", "tflint", "checkov")}
    assert native.run_fmt(ctx).status == "skipped"
    assert all(c.status == "skipped" for c in tflint.run(ctx))
    assert checkov.run(ctx).status == "skipped"
    _ = Result  # imported for type reference in FakeRunner
