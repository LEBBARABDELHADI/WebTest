from tfpv import diagnostic
from tfpv.models import CheckRun, RawFinding, ScanOptions
from tfpv.redact import Redactor
from tfpv.scanner import load_project


def chk(cid, status="passed", findings=(), required=True, partial=False, passed=1):
    c = CheckRun(cid, cid, "x", "static", required=required, status=status, findings=list(findings), passed_count=passed, partial=partial)
    return c


def consolidate(root, checks, **opts):
    notes = []
    active, suppressed = diagnostic.consolidate(checks, load_project(root), ScanOptions(**opts), Redactor(), notes)
    return active, suppressed, notes


MAIN = 'resource "aws_instance" "web" {\n  ami           = "ami-12345678"\n  instance_type = "t3.invalid" # tfpv:ignore AWS_INVALID_INSTANCE_TYPE -- new type, checked manually\n}\n'


def test_incomplete_is_never_passed(make_project):
    root = make_project({"main.tf": 'variable "x" {\n  type = string\n  default = "a"\n}\n'})
    checks = [chk("terraform_fmt"), chk("tflint", status="skipped"), chk("aws_external", status="skipped", required=False)]
    findings, _, _ = consolidate(root, checks)
    status, reason, summary = diagnostic.compute_status(findings, checks, ScanOptions())
    assert status == "INCOMPLETE" and "tflint" in reason and summary["not_run"] == 1
    checks[1].status = "passed"
    assert diagnostic.compute_status(findings, checks, ScanOptions())[0] == "PASSED"
    checks.append(chk("checkov", partial=True))
    assert diagnostic.compute_status(findings, checks, ScanOptions())[0] == "INCOMPLETE"


def test_failed_warnings_and_threshold(make_project):
    root = make_project({"main.tf": MAIN.replace(" # tfpv:ignore AWS_INVALID_INSTANCE_TYPE -- new type, checked manually", "")})
    raw = RawFinding(engine="tflint", engine_rule="aws_instance_invalid_type", message='"t3.invalid" is an invalid value as instance_type',
                     file="main.tf", line=3, value="t3.invalid", attribute="instance_type", engine_severity="error")
    low = RawFinding(engine="tflint", engine_rule="terraform_unused_declarations", message="unused", file="main.tf", line=1, engine_severity="warning")
    checks = [chk("tflint", "failed", [raw, low])]
    findings, _, _ = consolidate(root, checks)
    f = next(x for x in findings if x.rule_id == "AWS_INVALID_INSTANCE_TYPE")
    assert (f.severity, f.blocking, f.resource, f.value, f.fails_at) == ("HIGH", True, "aws_instance.web", "t3.invalid", "apply")
    assert f.snippet["highlight"] == 3
    status, _, summary = diagnostic.compute_status(findings, checks, ScanOptions())
    assert status == "FAILED" and summary["failed"] == 1 and summary["warnings"] == 1
    only_low = [x for x in findings if x.rule_id != "AWS_INVALID_INSTANCE_TYPE"]
    assert diagnostic.compute_status(only_low, checks, ScanOptions())[0] == "PASSED_WITH_WARNINGS"
    assert diagnostic.compute_status(only_low, checks, ScanOptions(fail_on="LOW"))[0] == "FAILED"


def test_inline_and_config_suppressions(make_project):
    root = make_project({"main.tf": MAIN})
    raw = RawFinding(engine="tflint", engine_rule="aws_instance_invalid_type", message="x", file="main.tf", line=3, engine_severity="error")
    other = RawFinding(engine="checkov", engine_rule="CKV_AWS_79", message="IMDS", file="main.tf", line=1, resource="aws_instance.web")
    active, suppressed, _ = consolidate(root, [chk("tflint", "failed", [raw]), chk("checkov", "failed", [other])], ignore_rules=("CKV_AWS_79",))
    assert active == []
    reasons = sorted(f.suppression_reason for f in suppressed)
    assert reasons == ["ignored in .tfpv.toml / --ignore", "new type, checked manually"]


def test_fallbacks_are_dropped_when_terraform_ran(make_project):
    root = make_project({"main.tf": 'resource "aws_route_table" "rt" {\n  vpc_id = aws_vpc.mian.id\n}\n'})
    ours = RawFinding(engine="scanner", engine_rule="undeclared_reference", rule_id="TF_UNDECLARED_REFERENCE", message="x", file="main.tf",
                      line=2, fallback_for="terraform_validate")
    tf = RawFinding(engine="terraform", engine_rule="validate:Reference to undeclared resource", rule_id="TF_UNDECLARED_REFERENCE",
                    message="Reference to undeclared resource", file="main.tf", line=2, engine_severity="error")
    active, _, _ = consolidate(root, [chk("scanner", "failed", [ours]), chk("terraform_validate", "failed", [tf])])
    assert [f.engines for f in active] == [["terraform"]]
    active, _, _ = consolidate(root, [chk("scanner", "failed", [ours]), chk("terraform_validate", "skipped")])
    assert [(f.engines, f.confidence) for f in active] == [(["scanner"], "medium")]


def test_parser_limitation_becomes_a_note(make_project):
    root = make_project({"main.tf": 'resource "a" "b" {\n  x = 1\n}\n'})
    ours = RawFinding(engine="scanner", engine_rule="hcl_parse", rule_id="TF_SYNTAX_ERROR", message="x", file="main.tf", line=2, fallback_for="terraform_fmt")
    active, _, notes = consolidate(root, [chk("scanner", "failed", [ours]), chk("terraform_fmt", "passed")])
    assert active == [] and "parser could not read main.tf" in notes[0]


def test_checkov_findings_merge_per_resource(make_project):
    root = make_project({"iam.tf": 'resource "aws_iam_policy" "p" {\n  name   = "x"\n  policy = "{}"\n}\n'})
    raws = [RawFinding(engine="checkov", engine_rule=cid, message=cid, file="iam.tf", line=1, resource="aws_iam_policy.p",
                       extra={"evaluated_keys": keys}) for cid, keys in (("CKV_AWS_286", ["policy/Statement"]), ("CKV_AWS_287", []), ("CKV_AWS_288", []))]
    active, _, _ = consolidate(root, [chk("checkov", "failed", raws)])
    assert len(active) == 1
    assert active[0].rule_id == "IAM_EXCESSIVE_PERMISSIONS" and active[0].engine_rules == ["CKV_AWS_286", "CKV_AWS_287", "CKV_AWS_288"]
    assert active[0].line == 3  # the policy attribute, not the block start


def test_severity_override_and_unknown_checkov_check(make_project):
    root = make_project({"main.tf": 'resource "aws_vpc" "v" {\n  cidr_block = "10.0.0.0/16"\n}\n'})
    raws = [RawFinding(engine="checkov", engine_rule="CKV2_AWS_11", message="flow logs", file="main.tf", line=1, resource="aws_vpc.v"),
            RawFinding(engine="checkov", engine_rule="CKV_AWS_9999", message="Ensure the thing is not publicly exposed", file="main.tf", line=1, resource="aws_vpc.v")]
    active, _, _ = consolidate(root, [chk("checkov", "failed", raws)], severity_overrides={"VPC_FLOW_LOGS": "MEDIUM"})
    by_rule = {f.rule_id: f for f in active}
    assert by_rule["VPC_FLOW_LOGS"].severity == "MEDIUM"
    assert by_rule["CKV_AWS_9999"].severity == "HIGH" and by_rule["CKV_AWS_9999"].title.startswith("Ensure the thing")
