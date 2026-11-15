"""Command-line interface.

    tfpv scan [DIR]        validate a Terraform root module (never plan/apply)
    tfpv doctor            show which engines are available
    tfpv rules             print the rule catalogue

The React Blocs « Terraform · TFLint » page does not need this CLI: it runs its
own in-browser engine (react-blocks/src/lib/tfpv/moteur). This CLI runs the real
engines (terraform, TFLint, Checkov) and is meant for CI pipelines.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

from . import __version__, config, knowledge, logs, report as reporting, tools
from .models import EXIT_CODES, SEVERITIES, STATUS_INCOMPLETE, ScanOptions
from .pipeline import ScanError, error_report, scan
from .runner import Runner

log = logging.getLogger("tfpv.cli")


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="tfpv", description="Terraform Pre-Plan Validator — catch errors before terraform plan.")
    p.add_argument("--version", action="version", version=f"tfpv {__version__}")
    p.add_argument("--log-level", default=os.environ.get("TFPV_LOG_LEVEL", "WARNING"), help="DEBUG, INFO, WARNING (default), ERROR")
    p.add_argument("--log-file", help="also write logs to this file (secrets are redacted)")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("scan", help="validate a Terraform directory")
    s.add_argument("path", nargs="?", default=".", help="root module directory (default: .)")
    s.add_argument("-f", "--format", action="append", choices=reporting.FORMATS, help="output format(s); repeatable (default: text)")
    s.add_argument("-o", "--output-dir", help="write reports to this directory (stdout: text only)")
    s.add_argument("--report-name", default="tfpv-report", help="base file name of written reports")
    s.add_argument("--fail-on", choices=SEVERITIES, help="lowest severity that fails the validation (default HIGH)")
    s.add_argument("--var-file", action="append", default=[], help="tfvars file(s) used at plan time (repeatable)")
    s.add_argument("--var", action="append", default=[], metavar="NAME=VALUE", help="variable value used at plan time (never printed)")
    s.add_argument("--skip", action="append", default=[], choices=config.CHECK_IDS, help="skip a check (the result becomes INCOMPLETE)")
    s.add_argument("--ignore", action="append", default=[], metavar="RULE", help="ignore a rule id (tfpv or engine id)")
    s.add_argument("--offline", action="store_true", help="no network: skip terraform init/validate and tflint --init")
    s.add_argument("--aws-checks", action="store_true", help="opt-in read-only AWS API checks (AMI, instance type offering, RDS version)")
    s.add_argument("--aws-profile")
    s.add_argument("--aws-region")
    s.add_argument("--tflint-deep-check", action="store_true", help="enable TFLint AWS deep checking (needs AWS credentials)")
    s.add_argument("--tflint-config", default="auto", help="auto (default) | project | tfpv | path to a .tflint.hcl")
    s.add_argument("--tflint-aws-version", help="TFLint AWS ruleset version for the tfpv config (default 0.50.0)")
    s.add_argument("--tf-bin", help="terraform or tofu binary")
    s.add_argument("--tflint-bin")
    s.add_argument("--checkov-bin")
    s.add_argument("--aws-bin")
    s.add_argument("--config", help="path to a .tfpv.toml (default: <path>/.tfpv.toml)")
    s.add_argument("--project-name")
    s.add_argument("--timeout", type=int, default=600, help="timeout per external command, seconds")
    s.add_argument("--allow-incomplete", action="store_true", help="exit 0 when the result is INCOMPLETE (status stays INCOMPLETE)")
    s.add_argument("--watch", action="store_true", help="re-run the validation whenever a .tf/.tfvars file changes")
    s.add_argument("--quiet", action="store_true", help="print only the final status line")

    d = sub.add_parser("doctor", help="show available engines and versions")
    d.add_argument("--json", action="store_true")
    d.add_argument("--tf-bin")
    d.add_argument("--tflint-bin")
    d.add_argument("--checkov-bin")
    d.add_argument("--aws-bin")

    r = sub.add_parser("rules", help="print the rule catalogue")
    r.add_argument("--format", choices=("text", "json", "markdown"), default="text")

    return p


def _options(a: argparse.Namespace) -> ScanOptions:
    vars_ = {}
    for item in a.var:
        if "=" not in item:
            raise config.ConfigError(f"--var expects NAME=VALUE, got {item!r}")
        k, v = item.split("=", 1)
        vars_[k.strip()] = v
    opts = ScanOptions(
        fail_on=a.fail_on or "HIGH", offline=a.offline, skip=tuple(a.skip),
        var_files=tuple(str(Path(v).resolve()) for v in a.var_file), vars=vars_,
        tf_bin=a.tf_bin, tflint_bin=a.tflint_bin, checkov_bin=a.checkov_bin, aws_bin=a.aws_bin,
        tflint_config=a.tflint_config, tflint_deep_check=a.tflint_deep_check, aws_checks=a.aws_checks,
        aws_profile=a.aws_profile, aws_region=a.aws_region, project_name=a.project_name, timeout_s=a.timeout,
        allow_incomplete=a.allow_incomplete, config_path=a.config, ignore_rules=tuple(a.ignore),
    )
    if a.tflint_aws_version:
        opts.tflint_aws_version = a.tflint_aws_version
    opts = config.load(opts, Path(a.path).resolve())
    if a.fail_on:
        opts.fail_on = a.fail_on
    return opts


def _snapshot(root: Path) -> dict[str, float]:
    out = {}
    for p in root.rglob("*"):
        if p.suffix in (".tf", ".tfvars") and ".terraform" not in p.parts:
            try:
                out[str(p)] = p.stat().st_mtime
            except OSError:
                pass
    return out


def cmd_scan(a: argparse.Namespace) -> int:
    try:
        opts = _options(a)
    except config.ConfigError as e:
        print(f"tfpv: configuration error: {e}", file=sys.stderr)
        return 3
    formats = a.format or ["text"]

    def once() -> int:
        def progress(ev: dict) -> None:
            if not a.quiet and ev["state"] == "running" and sys.stderr.isatty():
                print(f"[{ev['index']}/{ev['total']}] {ev['label']}…", file=sys.stderr)
        try:
            rep = scan(a.path, opts, progress=progress)
        except ScanError as e:
            rep = error_report(a.path, str(e), opts)
        if a.output_dir:
            paths = reporting.write_all(rep, formats, Path(a.output_dir), a.report_name)
            if not a.quiet:
                print(reporting.render(rep, "text") if "text" in formats else "", end="")
                for p in paths:
                    print(f"report written: {p}", file=sys.stderr)
        elif not a.quiet:
            for fmt in formats:
                print(reporting.render(rep, fmt), end="")
        if a.quiet:
            print(f"{rep.status}: {rep.status_reason}")
        code = EXIT_CODES.get(rep.status, 3)
        if rep.status == STATUS_INCOMPLETE and opts.allow_incomplete:
            code = 0
        return code

    code = once()
    if not a.watch:
        return code
    root = Path(a.path).resolve()
    print("watching for changes (Ctrl+C to stop)…", file=sys.stderr)
    snap = _snapshot(root)
    try:
        while True:
            time.sleep(1.5)
            cur = _snapshot(root)
            if cur != snap:
                snap = cur
                print("\nchange detected: re-running the validation…\n", file=sys.stderr)
                code = once()
    except KeyboardInterrupt:
        return code


def cmd_doctor(a: argparse.Namespace) -> int:
    info = tools.doctor(Runner(), a.tf_bin, a.tflint_bin, a.checkov_bin, a.aws_bin)
    if a.json:
        print(json.dumps(info, indent=2))
        return 0
    print(f"tfpv {info['tfpv']} · Python {info['python']} · {info['platform']}")
    for name, t in info["tools"].items():
        mark = "OK " if t["available"] else "-- "
        print(f"  {mark}{name:<10} {t.get('version') or '':<10} {t.get('path') or 'not found'}{('  [' + t['detail'] + ']') if t.get('detail') else ''}")
    missing = [n for n, t in info["tools"].items() if not t["available"] and n != "aws"]
    if missing:
        print(f"\nMissing: {', '.join(missing)} — the related checks will be reported as NOT RUN and scans will be INCOMPLETE.")
    return 0


def cmd_rules(a: argparse.Namespace) -> int:
    rules = knowledge.catalog()
    if a.format == "json":
        print(json.dumps([r.__dict__ for r in rules], indent=2))
    elif a.format == "markdown":
        print("| Rule | Severity | Category | Blocking (fails at) | Title |\n|---|---|---|---|---|")
        for r in rules:
            print(f"| `{r.id}` | {r.severity} | {r.category} | {'yes (' + r.fails_at + ')' if r.blocking else 'no'} | {r.title} |")
    else:
        for r in rules:
            print(f"{r.id:<34} {r.severity:<8} {r.category:<18} {r.title}")
    return 0


def main(argv: list[str] | None = None) -> int:
    a = _parser().parse_args(argv)
    logs.setup(a.log_level, a.log_file)
    if a.command == "scan":
        return cmd_scan(a)
    if a.command == "doctor":
        return cmd_doctor(a)
    if a.command == "rules":
        return cmd_rules(a)
    return 3


if __name__ == "__main__":
    raise SystemExit(main())
