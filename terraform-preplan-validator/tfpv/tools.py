"""Tool discovery and versions (used by `tfpv doctor`, the server health
endpoint and the report environment section)."""
from __future__ import annotations

import json
import os
import re
import shutil
import sys
from dataclasses import asdict, dataclass

from .runner import Runner


@dataclass
class Tool:
    name: str
    path: str | None
    version: str | None = None
    detail: str | None = None

    @property
    def available(self) -> bool:
        return self.path is not None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["available"] = self.available
        return d


def which(explicit: str | None, *names: str) -> str | None:
    if explicit:
        if os.path.sep in explicit or explicit.startswith("."):
            return explicit if os.path.isfile(explicit) and os.access(explicit, os.X_OK) else None
        return shutil.which(explicit)
    for n in names:
        p = shutil.which(n)
        if p:
            return p
    return None


def terraform(runner: Runner, explicit: str | None = None) -> Tool:
    path = which(explicit, "terraform", "tofu")
    t = Tool("terraform", path)
    if path:
        res = runner.run([path, "version", "-json"], timeout=60)
        try:
            t.version = json.loads(res.stdout).get("terraform_version")
        except ValueError:
            m = re.search(r"v(\d+\.\d+\.\d+)", res.stdout)
            t.version = m.group(1) if m else None
        t.detail = "OpenTofu" if os.path.basename(path).startswith("tofu") else "Terraform"
    return t


def tflint(runner: Runner, explicit: str | None = None, config: str | None = None, cwd: str | None = None) -> Tool:
    path = which(explicit, "tflint")
    t = Tool("tflint", path)
    if path:
        cmd = [path, "--version"] + ([f"--config={config}"] if config else [])
        res = runner.run(cmd, cwd=cwd, timeout=60)
        m = re.search(r"TFLint version (\S+)", res.stdout)
        t.version = m.group(1) if m else None
        rulesets = dict(re.findall(r"\+ ruleset\.(\S+) \((\S+)\)", res.stdout))
        t.detail = ", ".join(f"{k} {v}" for k, v in sorted(rulesets.items())) or None
    return t


def checkov(runner: Runner, explicit: str | None = None) -> Tool:
    path = which(explicit, "checkov")
    t = Tool("checkov", path)
    if path:
        res = runner.run([path, "--version"], timeout=120)
        m = re.search(r"(\d+\.\d+\.\d+)", res.stdout)
        t.version = m.group(1) if m else None
    return t


def aws_cli(runner: Runner, explicit: str | None = None) -> Tool:
    path = which(explicit, "aws")
    t = Tool("aws", path)
    if path:
        res = runner.run([path, "--version"], timeout=60)
        m = re.search(r"aws-cli/(\S+)", res.stdout + res.stderr)
        t.version = m.group(1) if m else None
    return t


def doctor(runner: Runner, tf_bin: str | None = None, tflint_bin: str | None = None, checkov_bin: str | None = None, aws_bin: str | None = None) -> dict:
    tools = [terraform(runner, tf_bin), tflint(runner, tflint_bin), checkov(runner, checkov_bin), aws_cli(runner, aws_bin)]
    from . import __version__
    return {
        "tfpv": __version__,
        "python": sys.version.split()[0],
        "platform": sys.platform,
        "tools": {t.name: t.to_dict() for t in tools},
        "capabilities": {
            "static": True,
            "terraform_fmt": tools[0].available,
            "terraform_init_validate": tools[0].available,
            "tflint": tools[1].available,
            "checkov": tools[2].available,
            "aws_external": tools[3].available,
        },
    }
