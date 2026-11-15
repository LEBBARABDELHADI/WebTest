"""CLI exit codes and opt-in AWS checks (fake AWS CLI)."""
import json
import os
import stat

import pytest

from conftest import FIXTURES
from tfpv import cli
from tfpv.engines.aws import external
from tfpv.runner import Runner

SKIP_ENGINES = ["--skip", "terraform_fmt", "--skip", "terraform_init", "--skip", "terraform_validate", "--skip", "tflint", "--skip", "checkov"]


def test_cli_incomplete_when_engines_do_not_run(capsys):
    code = cli.main(["scan", str(FIXTURES / "valid_basic"), "-f", "json", *SKIP_ENGINES])
    out = json.loads(capsys.readouterr().out)
    assert code == 2 and out["status"] == "INCOMPLETE" and out["summary"]["not_run"] == 6  # 5 skipped + the TFLint AWS ruleset
    assert cli.main(["scan", str(FIXTURES / "valid_basic"), "--quiet", "--allow-incomplete", *SKIP_ENGINES]) == 0
    assert "INCOMPLETE" in capsys.readouterr().out  # the status itself never becomes PASSED


def test_cli_static_findings_fail(capsys):
    code = cli.main(["scan", str(FIXTURES / "invalid_aws"), "-f", "json", *SKIP_ENGINES])
    out = json.loads(capsys.readouterr().out)
    rules = {f["rule_id"] for f in out["findings"]}
    assert code == 1 and out["status"] == "FAILED"
    assert {"TF_MISSING_VARIABLE_VALUE", "TF_VARIABLE_TYPE_MISMATCH", "NET_SUBNET_OUTSIDE_VPC", "EBS_IOPS_NOT_SUPPORTED",
            "RDS_MULTI_AZ_WITH_AZ", "IAM_INVALID_PRINCIPAL", "EC2_AMI_ID_MALFORMED"} <= rules
    assert "Sup3rS3cretPassw0rd" not in json.dumps(out)


def test_cli_config_file_and_errors(tmp_path, capsys):
    (tmp_path / "main.tf").write_text('variable "x" {\n  type    = string\n  default = "a"\n}\n')
    (tmp_path / ".tfpv.toml").write_text('fail_on = "LOW"\nskip = ["checkov"]\n[ignore]\nrules = ["X"]\n')
    code = cli.main(["scan", str(tmp_path), "-f", "json", *SKIP_ENGINES])
    out = json.loads(capsys.readouterr().out)
    assert out["fail_on"] == "LOW" and code == 2
    (tmp_path / ".tfpv.toml").write_text('skip = ["nope"]\n')
    assert cli.main(["scan", str(tmp_path)]) == 3
    assert cli.main(["scan", str(tmp_path / "missing")]) == 3


def _fake_aws(tmp_path):
    script = tmp_path / "aws"
    script.write_text("""#!/usr/bin/env python3
import json, sys
a = sys.argv[1:]
if a[:2] == ["sts", "get-caller-identity"]:
    print(json.dumps({"Account": "123456789012"}))
elif a[:2] == ["ec2", "describe-images"]:
    ami = a[a.index("--image-ids") + 1]
    if ami == "ami-0123456789abcdef0":
        print(json.dumps({"Images": [{"ImageId": ami}]}))
    else:
        sys.stderr.write("An error occurred (InvalidAMIID.NotFound) when calling the DescribeImages operation\\n"); sys.exit(254)
elif a[:2] == ["ec2", "describe-instance-type-offerings"]:
    t = [x for x in a if x.startswith("Name=instance-type")][0].split("=")[-1]
    print(json.dumps({"InstanceTypeOfferings": [] if t == "u-24tb1.metal" else [{"InstanceType": t}]}))
elif a[:2] == ["rds", "describe-db-engine-versions"]:
    v = a[a.index("--engine-version") + 1]
    print(json.dumps({"DBEngineVersions": [{"EngineVersion": v}] if v.startswith("16") else []}))
else:
    sys.exit(2)
""")
    script.chmod(script.stat().st_mode | stat.S_IEXEC)
    return str(script)


def test_external_checks_with_fake_aws_cli(tmp_path):
    api = external.AwsCliApi(Runner(), _fake_aws(tmp_path))
    assert api.identity() == "123456789012"
    cands = {"ami": [{"ami": "ami-0123456789abcdef0", "address": "a", "file": "m.tf", "line": 1}, {"ami": "ami-0000000000000000f", "address": "b", "file": "m.tf", "line": 2}],
             "instance_type": [{"instance_type": "u-24tb1.metal", "address": "c", "file": "m.tf", "line": 3}],
             "rds_engine": [{"engine": "postgres", "version": "9.1", "address": "d", "file": "m.tf", "line": 4}]}
    findings, passed, not_eval, _ = external.run(api, cands, {None: "eu-west-3"})
    assert sorted(f.rule_id for f in findings) == ["EC2_AMI_NOT_FOUND", "EC2_INSTANCE_TYPE_NOT_OFFERED", "RDS_ENGINE_VERSION_NOT_FOUND"]
    assert passed == 1 and not_eval == 0
    with pytest.raises(ValueError):
        api._call("ec2", "terminate-instances", "eu-west-3")


def test_external_checks_without_region_are_not_evaluated(tmp_path):
    api = external.AwsCliApi(Runner(), _fake_aws(tmp_path))
    findings, passed, not_eval, notes = external.run(api, {"ami": [{"ami": "ami-12345678", "address": "a", "file": "m.tf", "line": 1}]}, {None: None})
    assert findings == [] and not_eval == 1 and notes


def test_cli_aws_checks_end_to_end(tmp_path, capsys):
    env_backup = dict(os.environ)
    try:
        os.environ.pop("AWS_REGION", None)
        (tmp_path / "p").mkdir()
        (tmp_path / "p" / "main.tf").write_text('provider "aws" {\n  region = "eu-west-3"\n}\nresource "aws_instance" "x" {\n  ami           = "ami-0000000000000000f"\n  instance_type = "t3.micro"\n}\n')
        code = cli.main(["scan", str(tmp_path / "p"), "-f", "json", "--aws-checks", "--aws-bin", _fake_aws(tmp_path), *SKIP_ENGINES])
        out = json.loads(capsys.readouterr().out)
        ext = next(c for c in out["checks"] if c["id"] == "aws_external")
        assert ext["status"] == "failed" and code == 1
        assert any(f["rule_id"] == "EC2_AMI_NOT_FOUND" and f["tier"] == "aws" for f in out["findings"])
    finally:
        os.environ.clear()
        os.environ.update(env_backup)
