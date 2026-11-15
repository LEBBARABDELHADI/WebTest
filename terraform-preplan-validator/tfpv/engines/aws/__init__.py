"""AWS Validator: static coherence rules (always) + external checks (opt-in)."""
from __future__ import annotations

import os

from ...hcl.expr import literal
from ...models import CheckRun, TIER_AWS, TIER_STATIC
from ...scanner import ModuleInstance
from ..base import EngineContext, timed
from . import external, static


def regions(ctx: EngineContext, insts: list[ModuleInstance]) -> dict[str | None, str | None]:
    """Region per provider alias (None = default aws provider) from the root module."""
    out: dict[str | None, str | None] = {}
    root = next((i for i in insts if i.prefix == "" and i.module.dir == "."), None)
    if root is not None:
        for block, _rel in root.module.providers:
            if not block.labels or block.labels[0] != "aws":
                continue
            alias_attr = block.attributes.get("alias")
            alias = literal(alias_attr.tokens) if alias_attr else None
            reg = root.scope.eval_attr(block.attributes.get("region")) if "region" in block.attributes else None
            out[alias if isinstance(alias, str) else None] = reg if isinstance(reg, str) else None
    default = ctx.options.aws_region or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")
    if not out.get(None):
        out[None] = ctx.options.aws_region or default
    return out


def run_static(ctx: EngineContext, insts: list[ModuleInstance]) -> CheckRun:
    check = CheckRun("aws_static", "tfpv AWS validator (static)", "tfpv", TIER_STATIC)

    def body() -> None:
        if "aws_static" in ctx.options.skip:
            check.status, check.reason = "skipped", "disabled with --skip"
            return
        tally = static.run(ctx.project, insts)
        check.findings.extend(tally.findings)
        check.passed_count = tally.passed
        check.not_evaluated = tally.not_evaluated
        ctx.shared["aws_candidates"] = tally.external
        if tally.not_evaluated:
            check.reason = f"{tally.not_evaluated} evaluation(s) depend on values known only at apply time"

    return timed(check, body)


def run_external(ctx: EngineContext, insts: list[ModuleInstance], api: external.AwsApi | None = None) -> CheckRun:
    check = CheckRun("aws_external", "AWS API checks (AMI, instance type offering, RDS engine version)", "aws", TIER_AWS,
                     required=ctx.options.aws_checks)

    def body() -> None:
        if not ctx.options.aws_checks:
            check.status, check.reason = "skipped", "opt-in: use --aws-checks (needs AWS credentials, read-only calls)"
            return
        if ctx.options.offline:
            check.status, check.reason = "skipped", "offline mode"
            return
        client = api
        if client is None:
            aws_bin = ctx.tool_path("aws")
            if not aws_bin:
                check.status, check.reason = "error", "--aws-checks requested but the AWS CLI was not found (use --aws-bin)"
                return
            client = external.AwsCliApi(ctx.runner, aws_bin, ctx.options.aws_profile)
        account = client.identity()
        if account is None:
            errs = getattr(client, "errors", [])
            check.status, check.reason = "error", f"no usable AWS credentials ({errs[-1] if errs else 'sts get-caller-identity failed'})"
            return
        cands = ctx.shared.get("aws_candidates") or {}
        findings, passed, not_eval, notes = external.run(client, cands, regions(ctx, insts))
        check.findings.extend(findings)
        check.passed_count = passed
        check.not_evaluated = not_eval
        ctx.notes.extend(notes)
        if not_eval:
            errs = getattr(client, "errors", [])
            check.reason = f"{not_eval} check(s) could not be completed" + (f" (last error: {errs[-1]})" if errs else "")

    return timed(check, body)
