"""AWS validator — external checks (opt-in, read-only, need AWS credentials).

Verifies what cannot be known from files: does the AMI exist in the region,
is the instance type offered in the region, does the RDS engine version exist.
Uses the AWS CLI (an existing tool) with a fixed allowlist of read-only
calls. Never called unless --aws-checks is given.
"""
from __future__ import annotations

import json
from typing import Any, Protocol

from ...models import RawFinding, TIER_AWS
from ...runner import Runner

READ_ONLY_CALLS = {
    ("sts", "get-caller-identity"),
    ("ec2", "describe-images"),
    ("ec2", "describe-instance-type-offerings"),
    ("rds", "describe-db-engine-versions"),
}


class AwsApi(Protocol):
    def identity(self) -> str | None: ...
    def ami_exists(self, region: str, ami: str) -> bool | None: ...
    def instance_type_offered(self, region: str, instance_type: str) -> bool | None: ...
    def rds_engine_version_exists(self, region: str, engine: str, version: str) -> bool | None: ...


class AwsCliApi:
    """AwsApi implementation on top of the AWS CLI (aws ... --output json)."""

    def __init__(self, runner: Runner, binary: str, profile: str | None = None, timeout: int = 60):
        self.runner = runner
        self.binary = binary
        self.profile = profile
        self.timeout = timeout
        self.errors: list[str] = []

    def _call(self, service: str, op: str, region: str | None, *args: str) -> tuple[int, Any, str]:
        if (service, op) not in READ_ONLY_CALLS:
            raise ValueError(f"AWS call not allowed: {service} {op}")
        cmd = [self.binary, service, op, "--output", "json", *args]
        if region:
            cmd += ["--region", region]
        if self.profile:
            cmd += ["--profile", self.profile]
        res = self.runner.run(cmd, timeout=self.timeout)
        data = None
        if res.stdout.strip():
            try:
                data = json.loads(res.stdout)
            except ValueError:
                data = None
        return res.returncode, data, res.stderr.strip()

    def identity(self) -> str | None:
        rc, data, err = self._call("sts", "get-caller-identity", None)
        if rc != 0 or not isinstance(data, dict):
            self.errors.append(err.splitlines()[-1] if err else f"exit code {rc}")
            return None
        return str(data.get("Account", ""))

    def ami_exists(self, region: str, ami: str) -> bool | None:
        rc, data, err = self._call("ec2", "describe-images", region, "--image-ids", ami)
        if rc == 0 and isinstance(data, dict):
            return bool(data.get("Images"))
        if "InvalidAMIID.NotFound" in err or "InvalidAMIID.Unavailable" in err or "InvalidAMIID.Malformed" in err:
            return False
        self.errors.append(err.splitlines()[-1] if err else f"exit code {rc}")
        return None

    def instance_type_offered(self, region: str, instance_type: str) -> bool | None:
        rc, data, err = self._call("ec2", "describe-instance-type-offerings", region, "--location-type", "region",
                                   "--filters", f"Name=instance-type,Values={instance_type}")
        if rc == 0 and isinstance(data, dict):
            return bool(data.get("InstanceTypeOfferings"))
        self.errors.append(err.splitlines()[-1] if err else f"exit code {rc}")
        return None

    def rds_engine_version_exists(self, region: str, engine: str, version: str) -> bool | None:
        rc, data, err = self._call("rds", "describe-db-engine-versions", region, "--engine", engine, "--engine-version", version)
        if rc == 0 and isinstance(data, dict):
            return bool(data.get("DBEngineVersions"))
        if "InvalidParameterCombination" in err or "InvalidParameterValue" in err:
            return False
        self.errors.append(err.splitlines()[-1] if err else f"exit code {rc}")
        return None


def run(api: AwsApi, candidates: dict[str, list[dict[str, Any]]], regions: dict[str | None, str | None]) -> tuple[list[RawFinding], int, int, list[str]]:
    """Return (findings, passed, not_evaluated, notes)."""
    findings: list[RawFinding] = []
    passed = not_evaluated = 0
    notes: list[str] = []
    cache: dict[tuple, bool | None] = {}

    def region_of(c: dict[str, Any]) -> str | None:
        return regions.get(c.get("provider")) or regions.get(None)

    def ask(kind: str, *key: str) -> bool | None:
        k = (kind, *key)
        if k not in cache:
            if kind == "ami":
                cache[k] = api.ami_exists(*key)
            elif kind == "it":
                cache[k] = api.instance_type_offered(*key)
            else:
                cache[k] = api.rds_engine_version_exists(*key)
        return cache[k]

    for c in candidates.get("ami", []):
        region = region_of(c)
        ok = ask("ami", region, c["ami"]) if region else None
        if ok is None:
            not_evaluated += 1
        elif ok:
            passed += 1
        else:
            findings.append(RawFinding(engine="aws", engine_rule="ec2_describe_images", rule_id="EC2_AMI_NOT_FOUND", tier=TIER_AWS,
                                       message=f'AMI {c["ami"]} was not found in {region} (DescribeImages).', file=c["file"], line=c["line"],
                                       resource=c["address"], attribute="ami", value=c["ami"]))
    for c in candidates.get("instance_type", []):
        region = region_of(c)
        ok = ask("it", region, c["instance_type"]) if region else None
        if ok is None:
            not_evaluated += 1
        elif ok:
            passed += 1
        else:
            findings.append(RawFinding(engine="aws", engine_rule="ec2_describe_instance_type_offerings", rule_id="EC2_INSTANCE_TYPE_NOT_OFFERED", tier=TIER_AWS,
                                       message=f'Instance type {c["instance_type"]} is not offered in {region} (DescribeInstanceTypeOfferings).',
                                       file=c["file"], line=c["line"], resource=c["address"], attribute="instance_type", value=c["instance_type"]))
    for c in candidates.get("rds_engine", []):
        region = region_of(c)
        ok = ask("rds", region, c["engine"], c["version"]) if region else None
        if ok is None:
            not_evaluated += 1
        elif ok:
            passed += 1
        else:
            findings.append(RawFinding(engine="aws", engine_rule="rds_describe_db_engine_versions", rule_id="RDS_ENGINE_VERSION_NOT_FOUND", tier=TIER_AWS,
                                       message=f'{c["engine"]} {c["version"]} is not available in {region} (DescribeDBEngineVersions).',
                                       file=c["file"], line=c["line"], resource=c["address"], attribute="engine_version", value=c["version"]))
    if any(r is None for r in [regions.get(None)]) and any(candidates.values()):
        notes.append("AWS region unknown for the default provider: set region in the provider block, AWS_REGION, or --aws-region.")
    return findings, passed, not_evaluated, notes
