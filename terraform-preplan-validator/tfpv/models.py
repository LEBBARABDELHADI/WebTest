"""Data model shared by all components (the contract between them)."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

SEVERITIES = ("CRITICAL", "HIGH", "MEDIUM", "LOW")
SEVERITY_RANK = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}

# Where a check needs to reach to run.
TIER_STATIC = "static"  # local files only, no init, no network
TIER_PROVIDERS = "providers"  # needs `terraform init` (registry / mirror access)
TIER_AWS = "aws"  # needs AWS credentials (read-only API calls)

# Check run statuses.
PASSED, FAILED, SKIPPED, ERROR = "passed", "failed", "skipped", "error"

# Report statuses.
STATUS_PASSED = "PASSED"
STATUS_WARNINGS = "PASSED_WITH_WARNINGS"
STATUS_FAILED = "FAILED"
STATUS_INCOMPLETE = "INCOMPLETE"
STATUS_ERROR = "ERROR"

EXIT_CODES = {STATUS_PASSED: 0, STATUS_WARNINGS: 0, STATUS_FAILED: 1, STATUS_INCOMPLETE: 2, STATUS_ERROR: 3}


@dataclass
class RawFinding:
    """What an engine reports, before normalisation by the Diagnostic Engine."""
    engine: str  # terraform | tflint | checkov | scanner | aws
    engine_rule: str  # rule name in the engine (aws_instance_invalid_type, CKV_AWS_24, ...)
    message: str
    file: str | None = None  # relative to the project root, posix
    line: int | None = None
    end_line: int | None = None
    column: int | None = None
    resource: str | None = None
    attribute: str | None = None
    value: Any = None
    engine_severity: str | None = None
    rule_id: str | None = None  # canonical tfpv rule when the engine already knows it
    tier: str = TIER_STATIC
    detail: str | None = None
    link: str | None = None
    fallback_for: str | None = None  # check id that supersedes this finding when it ran
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class Finding:
    """Normalised finding, as it appears in reports."""
    id: str
    rule_id: str
    title: str
    severity: str
    category: str
    blocking: bool
    fails_at: str  # init | validate | plan | apply | none
    file: str | None
    line: int | None
    resource: str | None
    attribute: str | None
    value: Any
    description: str
    cause: str
    recommendation: str
    fix: str | None
    references: list[str]
    engines: list[str]
    engine_rules: list[str]
    message: str
    tier: str
    confidence: str  # high | medium
    end_line: int | None = None
    column: int | None = None
    snippet: dict[str, Any] | None = None
    suppressed: bool = False
    suppression_reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class CheckRun:
    """One executed (or not executed) check: an engine step."""
    id: str
    name: str
    engine: str
    tier: str
    required: bool = True
    status: str = "pending"  # passed | failed | skipped | error
    reason: str = ""
    duration_s: float = 0.0
    passed_count: int = 0  # sub-checks that passed (when the engine reports them)
    not_evaluated: int = 0  # sub-checks that could not be evaluated statically
    partial: bool = False  # ran, but did not cover everything (e.g. files it could not parse)
    command: str | None = None
    version: str | None = None
    findings: list[RawFinding] = field(default_factory=list)

    def summary(self) -> dict[str, Any]:
        d = {k: v for k, v in asdict(self).items() if k != "findings"}
        d["findings"] = len(self.findings)
        return d


@dataclass
class ScanOptions:
    fail_on: str = "HIGH"
    offline: bool = False  # never touch the network: skip init/validate and tflint --init
    skip: tuple[str, ...] = ()  # check ids to skip: terraform_fmt, terraform_init, ...
    var_files: tuple[str, ...] = ()
    vars: dict[str, str] = field(default_factory=dict)  # -var name=value (values never reported)
    tf_bin: str | None = None
    tflint_bin: str | None = None
    checkov_bin: str | None = None
    aws_bin: str | None = None
    tflint_config: str = "auto"  # auto | project | tfpv | <path>
    tflint_deep_check: bool = False
    tflint_aws_version: str = "0.50.0"
    aws_checks: bool = False  # opt-in external checks through the AWS CLI
    aws_profile: str | None = None
    aws_region: str | None = None
    project_name: str | None = None
    timeout_s: int = 600
    allow_incomplete: bool = False
    config_path: str | None = None
    ignore_rules: tuple[str, ...] = ()
    severity_overrides: dict[str, str] = field(default_factory=dict)
    checkov_skip: tuple[str, ...] = ()


@dataclass
class Report:
    schema_version: str
    tool: dict[str, Any]
    project: dict[str, Any]
    generated_at: str
    duration_s: float
    status: str
    status_reason: str
    fail_on: str
    summary: dict[str, Any]
    environment: dict[str, Any]
    checks: list[dict[str, Any]]
    inventory: dict[str, Any]
    findings: list[dict[str, Any]]
    suppressed: list[dict[str, Any]]
    redaction: dict[str, Any]
    notes: list[str]

    @property
    def exit_code(self) -> int:
        return EXIT_CODES.get(self.status, 3)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def severity_at_least(sev: str, threshold: str) -> bool:
    return SEVERITY_RANK.get(sev, 0) >= SEVERITY_RANK.get(threshold, 99)
