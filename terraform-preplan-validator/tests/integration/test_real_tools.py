"""End-to-end tests with the real engines (terraform/tofu, tflint + AWS ruleset,
checkov). Skipped automatically when the tools are not installed.

    pytest -m integration
"""
import hashlib
import json
import os
import shutil
from pathlib import Path

import pytest

from conftest import FIXTURES
from tfpv import report as reporting
from tfpv.models import ScanOptions
from tfpv.pipeline import scan

pytestmark = pytest.mark.integration

TOOLS = [shutil.which("terraform") or shutil.which("tofu"), shutil.which("tflint"), shutil.which("checkov")]
plugin_dir = Path(os.environ.get("TFLINT_PLUGIN_DIR", Path.home() / ".tflint.d" / "plugins"))
HAS_AWS_PLUGIN = any(plugin_dir.rglob("tflint-ruleset-aws*")) if plugin_dir.exists() else False
if not all(TOOLS) or not HAS_AWS_PLUGIN:
    pytest.skip("terraform/tofu, tflint (+ AWS ruleset) and checkov are required", allow_module_level=True)


def tree_hash(root: Path) -> str:
    h = hashlib.sha256()
    for p in sorted(root.rglob("*")):
        h.update(str(p.relative_to(root)).encode())
        if p.is_file():
            h.update(p.read_bytes())
    return h.hexdigest()


# AWS's documented example credentials, assembled at run time so that no
# credential-looking literal is stored in the repository.
FAKE_ACCESS_KEY = "AKIA" + "IOSFODNN7" + "EXAMPLE"
FAKE_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/" + "bPxRfiCY" + "EXAMPLEKEY"


@pytest.fixture(scope="module")
def reports(tmp_path_factory):
    out = {}
    for name in ("invalid_aws", "valid_basic", "syntax_error", "module_missing", "modules_local", "secrets", "user_example"):
        dest = tmp_path_factory.mktemp(name) / name
        shutil.copytree(FIXTURES / name, dest)
        if name == "secrets":
            main = dest / "main.tf"
            main.write_text(main.read_text().replace("__FAKE_ACCESS_KEY__", FAKE_ACCESS_KEY).replace("__FAKE_SECRET_KEY__", FAKE_SECRET_KEY))
        before = tree_hash(dest)
        rep = scan(dest, ScanOptions())
        out[name] = (rep, before, tree_hash(dest))
    return out


def rules(rep):
    return {(f["rule_id"], f["file"], f["line"]) for f in rep.findings}


def test_project_files_are_never_modified(reports):
    for name, (_, before, after) in reports.items():
        assert before == after, f"{name} was modified by the scan"


def test_invalid_aws(reports):
    rep = reports["invalid_aws"][0]
    assert rep.status == "FAILED" and rep.exit_code == 1
    assert all(c["status"] != "error" for c in rep.checks)
    expected = {
        ("AWS_INVALID_INSTANCE_TYPE", "main.tf", 3),          # TFLint AWS ruleset
        ("TF_UNDECLARED_REFERENCE", "network.tf", 47),        # terraform validate
        ("TF_FORMAT", "unformatted.tf", 1),                   # terraform fmt -check
        ("SG_SSH_OPEN_TO_INTERNET", "network.tf", 25),        # Checkov
        ("TF_VARIABLE_TYPE_MISMATCH", "terraform.tfvars", 1), # tfpv scanner (plan-time error)
        ("TF_MISSING_VARIABLE_VALUE", "variables.tf", 20),
        ("EBS_IOPS_NOT_SUPPORTED", "storage.tf", 9),          # tfpv AWS validator (plan-time error)
        ("NET_SUBNET_OUTSIDE_VPC", "network.tf", 17),
        ("NET_SUBNET_OVERLAP", "network.tf", 12),
        ("RDS_MULTI_AZ_WITH_AZ", "storage.tf", 22),
        ("IAM_INVALID_PRINCIPAL", "iam.tf", 15),
        ("EC2_AMI_ID_MALFORMED", "main.tf", 13),
    }
    missing = expected - rules(rep)
    assert not missing, missing
    assert "Sup3rS3cretPassw0rd" not in json.dumps(rep.to_dict())


def test_valid_basic_passes(reports):
    rep = reports["valid_basic"][0]
    assert rep.status == "PASSED", (rep.status_reason, rep.findings)
    required = [c for c in rep.checks if c["required"]]
    assert all(c["status"] == "passed" for c in required)
    assert rep.summary["suppressed"] == 1  # inline #checkov:skip with a reason


def test_syntax_error(reports):
    rep = reports["syntax_error"][0]
    assert ("TF_SYNTAX_ERROR", "main.tf", 7) in rules(rep)
    f = next(f for f in rep.findings if f["rule_id"] == "TF_SYNTAX_ERROR")
    assert f["severity"] == "CRITICAL" and f["engines"] == ["terraform"]
    assert next(c for c in rep.checks if c["id"] == "terraform_validate")["status"] == "skipped"


def test_missing_local_module(reports):
    rep = reports["module_missing"][0]
    f = next(f for f in rep.findings if f["rule_id"] == "TF_MODULE_INSTALL")
    assert (f["file"], f["line"], f["resource"]) == ("main.tf", 5, "module.ghost")


def test_cross_module_evaluation(reports):
    rep = reports["modules_local"][0]
    by_rule = {f["rule_id"]: f for f in rep.findings}
    assert by_rule["NET_SUBNET_OUTSIDE_VPC"]["resource"] == "module.network.aws_subnet.b"
    assert by_rule["IAM_INVALID_PRINCIPAL"]["value"] == "12345678901"
    assert by_rule["TF_MISSING_REQUIRED_ARGUMENT"]["resource"] == "module.app"


def test_secrets_never_leak(reports):
    rep = reports["secrets"][0]
    rendered = "".join(reporting.render(rep, fmt) for fmt in reporting.FORMATS)
    for secret in (FAKE_ACCESS_KEY, FAKE_SECRET_KEY, "Tr0ub4dor&3-horse-battery"):
        assert secret not in rendered
    assert any(f["rule_id"] == "PROVIDER_HARDCODED_CREDENTIALS" for f in rep.findings)


def test_user_example_report_format(reports):
    rep = reports["user_example"][0]
    f = next(f for f in rep.findings if f["rule_id"] == "AWS_INVALID_INSTANCE_TYPE")
    assert (f["file"], f["line"], f["resource"], f["value"]) == ("main.tf", 3, "aws_instance.example", "t3.invalid")
    text = reporting.render(rep, "text")
    assert "Verify that the instance type exists in the selected AWS region" in text
