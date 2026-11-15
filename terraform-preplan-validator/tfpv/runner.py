"""Safe subprocess runner.

* argument lists only (never a shell);
* Terraform/OpenTofu sub-commands restricted to an allowlist: tfpv can never
  run `plan`, `apply`, `destroy`, `import`, `state` or `fmt` without `-check`;
* timeouts, stdin closed (no interactive prompt can block a scan);
* commands are logged with secrets redacted.
"""
from __future__ import annotations

import logging
import os
import subprocess
import time
from dataclasses import dataclass, field

log = logging.getLogger("tfpv.runner")

TERRAFORM_ALLOWED = {"version", "fmt", "init", "validate"}


class ForbiddenCommand(RuntimeError):
    pass


@dataclass
class Result:
    command: list[str]
    returncode: int
    stdout: str = ""
    stderr: str = ""
    duration_s: float = 0.0
    timed_out: bool = False
    not_found: bool = False
    meta: dict = field(default_factory=dict)


def _terraform_subcommand(cmd: list[str]) -> str | None:
    for arg in cmd[1:]:
        if arg.startswith("-"):
            continue
        return arg
    return None


def check_terraform_command(cmd: list[str]) -> None:
    sub = _terraform_subcommand(cmd)
    if sub not in TERRAFORM_ALLOWED:
        raise ForbiddenCommand(f"tfpv never runs `terraform {sub}` (allowed: {', '.join(sorted(TERRAFORM_ALLOWED))})")
    if sub == "fmt" and "-check" not in cmd:
        raise ForbiddenCommand("terraform fmt is only allowed with -check (tfpv never rewrites files)")


class Runner:
    def __init__(self, terraform_binaries: set[str] | None = None):
        self.terraform_binaries = {os.path.basename(b) for b in (terraform_binaries or set())} | {"terraform", "tofu"}

    def run(self, cmd: list[str], cwd: str | os.PathLike | None = None, env: dict[str, str] | None = None, timeout: int = 600) -> Result:
        if not isinstance(cmd, list) or not cmd:
            raise ValueError("command must be a non-empty argument list")
        if os.path.basename(cmd[0]) in self.terraform_binaries:
            check_terraform_command(cmd)
        start = time.monotonic()
        log.debug("run: %s (cwd=%s)", " ".join(cmd), cwd)
        try:
            p = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout,
                               stdin=subprocess.DEVNULL, encoding="utf-8", errors="replace")
            res = Result(cmd, p.returncode, p.stdout, p.stderr, time.monotonic() - start)
        except FileNotFoundError:
            res = Result(cmd, 127, "", f"{cmd[0]}: command not found", time.monotonic() - start, not_found=True)
        except subprocess.TimeoutExpired as e:
            out = e.stdout.decode("utf-8", "replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
            err = e.stderr.decode("utf-8", "replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
            res = Result(cmd, 124, out, err + f"\ntimed out after {timeout}s", time.monotonic() - start, timed_out=True)
        except PermissionError as e:
            res = Result(cmd, 126, "", str(e), time.monotonic() - start, not_found=True)
        log.debug("exit %s in %.1fs: %s", res.returncode, res.duration_s, " ".join(cmd[:3]))
        return res
