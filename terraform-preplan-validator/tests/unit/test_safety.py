"""Safety guarantees: never plan/apply, never rewrite files, never leak secrets."""
import json
import logging
import xml.etree.ElementTree as ET

import pytest

from tfpv import report as reporting
from tfpv.models import Report
from tfpv.redact import MASK, RedactingFilter, Redactor
from tfpv.runner import ForbiddenCommand, Runner


@pytest.mark.parametrize("cmd", [
    ["terraform", "plan"], ["terraform", "apply", "-auto-approve"], ["tofu", "destroy"], ["terraform", "-chdir=x", "apply"],
    ["terraform", "fmt", "-recursive"], ["terraform", "state", "rm", "x"], ["terraform", "import", "a", "b"], ["/opt/bin/terraform", "plan"],
])
def test_forbidden_terraform_commands(cmd):
    with pytest.raises(ForbiddenCommand):
        Runner().run(cmd)


def test_custom_binary_name_is_also_guarded():
    with pytest.raises(ForbiddenCommand):
        Runner({"/usr/local/bin/terraform-1.9"}).run(["/usr/local/bin/terraform-1.9", "apply"])


def test_allowed_commands_and_missing_binary():
    res = Runner().run(["terraform-does-not-exist-xyz", "version"])
    assert res.not_found and res.returncode == 127


# Fake credentials assembled at run time (no secret-looking literal in the repository).
FAKE_KEY = "AKIA" + "IOSFODNN7" + "EXAMPLE"
FAKE_GITLAB = "gl" + "pat-" + "abcdefghij" * 2
PEM = "-----BEGIN RSA " + "PRIVATE KEY-----\nMIIE\n-----END RSA " + "PRIVATE KEY-----"


def test_redaction_patterns_and_values():
    r = Redactor()
    r.add_value("Tr0ub4dor&3")
    text = f'access_key = "{FAKE_KEY}" password = "hunter2hunter2" token: "abc" pw Tr0ub4dor&3 {PEM} {FAKE_GITLAB}'
    out = r.text(text)
    for secret in (FAKE_KEY, "hunter2hunter2", "Tr0ub4dor&3", "MIIE", FAKE_GITLAB):
        assert secret not in out
    assert 'password = "${var.db_password}"' == r.text('password = "${var.db_password}"')
    assert r.value("db_password", "x") == MASK


def test_logs_are_redacted(caplog):
    r = Redactor()
    r.add_value("s3cr3t-value")
    logger = logging.getLogger("tfpv.test")
    logger.addFilter(RedactingFilter(r))
    with caplog.at_level(logging.INFO, logger="tfpv.test"):
        logger.info("running with %s", "s3cr3t-value")
    assert "s3cr3t-value" not in caplog.text and MASK in caplog.text


def _report(findings):
    return Report(schema_version="1.0", tool={"name": "tfpv", "version": "1"}, project={"name": "p<script>", "path": "/p"}, generated_at="now",
                  duration_s=1.0, status="FAILED", status_reason="r", fail_on="HIGH",
                  summary={"total_checks": 2, "passed": 1, "failed": 1, "warnings": 0, "blocking": 1, "not_run": 0, "not_evaluated": 0,
                           "by_severity": {"HIGH": 1}, "by_category": {}, "files_with_findings": 1},
                  environment={"tfpv": "1"}, checks=[{"id": "tflint", "name": "TFLint", "tier": "static", "status": "failed", "reason": "", "findings": 1},
                                                    {"id": "checkov", "name": "Checkov", "tier": "static", "status": "skipped", "reason": "not installed", "findings": 0}],
                  inventory={}, findings=findings, suppressed=[], redaction={"applied": True, "masked_values": 0}, notes=[])


FINDING = {"id": "1", "rule_id": "AWS_INVALID_INSTANCE_TYPE", "title": "Invalid <b>type</b>", "severity": "HIGH", "category": "AWS_VALIDITY",
           "blocking": True, "fails_at": "apply", "file": "main.tf", "line": 3, "resource": "aws_instance.web", "attribute": "instance_type",
           "value": "<img src=x onerror=alert(1)>", "description": "d", "cause": "c", "recommendation": "r", "fix": None,
           "references": ["https://example.com"], "engines": ["tflint"], "engine_rules": ["aws_instance_invalid_type"],
           "message": "<script>alert(1)</script>", "tier": "static", "confidence": "high",
           "snippet": {"start_line": 2, "highlight": 3, "lines": ["a", "<script>"]}}


def test_reports_escape_and_parse():
    rep = _report([FINDING])
    html = reporting.render(rep, "html")
    assert "<script>alert(1)</script>" not in html and "&lt;script&gt;" in html and "<img src=x" not in html
    root = ET.fromstring(reporting.render(rep, "junit"))
    assert root.get("failures") == "1" and root.get("skipped") == "1"
    text = reporting.render(rep, "text")
    for part in ("Terraform Pre-Plan Validation Report", "Status: FAILED", "* Total checks: 2", "[HIGH] AWS_INVALID_INSTANCE_TYPE",
                 "File: main.tf", "Line: 3", "Resource: aws_instance.web", "Recommendation:", "Final result:",
                 "FAILED - Terraform configuration requires corrections."):
        assert part in text
    assert json.loads(reporting.render(rep, "json"))["findings"][0]["rule_id"] == "AWS_INVALID_INSTANCE_TYPE"
