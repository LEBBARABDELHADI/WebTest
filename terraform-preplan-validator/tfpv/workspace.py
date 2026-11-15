"""Shadow workspace for `terraform init` / `terraform validate`.

`terraform init` writes `.terraform/` and `.terraform.lock.hcl` in the working
directory. tfpv must never modify the user's project, so init/validate run on
a temporary copy (including local modules referenced with ../ paths), with
TF_DATA_DIR in the temporary directory and a shared provider plugin cache.
State files are never copied.
"""
from __future__ import annotations

import os
import re
import shutil
import tempfile
from pathlib import Path

from .scanner import SKIP_DIRS

MAX_COPY_BYTES = 200 * 1024 * 1024
_SOURCE_RE = re.compile(r'^\s*source\s*=\s*"(\.{1,2}/[^"]+)"', re.M)


class WorkspaceError(RuntimeError):
    pass


def _local_module_dirs(start: Path, limit: int = 200) -> set[Path]:
    """Directories reachable through local module sources (./ and ../), recursively."""
    seen: set[Path] = set()
    todo = [start.resolve()]
    while todo and len(seen) < limit:
        d = todo.pop()
        if d in seen or not d.is_dir():
            continue
        seen.add(d)
        for f in d.glob("*.tf"):
            try:
                text = f.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for src in _SOURCE_RE.findall(text):
                src = src.split("//")[0] if "//" in src[3:] else src
                todo.append((d / src).resolve())
    return seen


def _ignore(directory: str, names: list[str]) -> set[str]:
    return {n for n in names if n in SKIP_DIRS or n.startswith(".terraform") and n != ".terraform.lock.hcl" or ".tfstate" in n}


class ShadowWorkspace:
    def __init__(self, root: Path, plugin_cache: Path | None = None):
        self.root = root.resolve()
        self.tmp = Path(tempfile.mkdtemp(prefix="tfpv-"))
        dirs = _local_module_dirs(self.root)
        base = Path(os.path.commonpath([str(d) for d in dirs | {self.root}]))
        if len(base.parts) < 2:
            raise WorkspaceError("local modules point outside any reasonable project root")
        size = 0
        for d in dirs | {self.root}:
            for p in d.rglob("*"):
                if p.is_file() and not any(part in SKIP_DIRS for part in p.parts):
                    size += p.stat().st_size
                    if size > MAX_COPY_BYTES:
                        self.cleanup()
                        raise WorkspaceError(f"project larger than {MAX_COPY_BYTES // (1024 * 1024)} MB: shadow copy refused")
        self.copy_base = self.tmp / "src"
        if base == self.root:
            shutil.copytree(self.root, self.copy_base, ignore=_ignore, symlinks=False)
        else:
            # Copy only the root module and the module directories it uses.
            for d in sorted(dirs | {self.root}):
                rel = d.relative_to(base)
                dest = self.copy_base / rel
                dest.mkdir(parents=True, exist_ok=True)
                for p in d.iterdir():
                    if p.is_file() and ".tfstate" not in p.name:
                        shutil.copy2(p, dest / p.name)
                    elif p.is_dir() and p.name not in SKIP_DIRS and not p.name.startswith(".terraform") and (p.resolve() not in dirs):
                        shutil.copytree(p, dest / p.name, ignore=_ignore, symlinks=False, dirs_exist_ok=True)
        self.workdir = self.copy_base / self.root.relative_to(base)
        self.data_dir = self.tmp / "tfdata"
        self.data_dir.mkdir()
        self.plugin_cache = plugin_cache or Path(os.environ.get("TFPV_PLUGIN_CACHE", Path.home() / ".cache" / "tfpv" / "plugin-cache"))
        try:
            self.plugin_cache.mkdir(parents=True, exist_ok=True)
        except OSError:
            self.plugin_cache = self.tmp / "plugin-cache"
            self.plugin_cache.mkdir()

    def env(self) -> dict[str, str]:
        env = dict(os.environ)
        env.update({
            "TF_DATA_DIR": str(self.data_dir),
            "TF_PLUGIN_CACHE_DIR": str(self.plugin_cache),
            "TF_IN_AUTOMATION": "1",
            "TF_INPUT": "0",
            "CHECKPOINT_DISABLE": "1",
        })
        env.pop("TF_WORKSPACE", None)
        return env

    def cleanup(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def __enter__(self) -> "ShadowWorkspace":
        return self

    def __exit__(self, *exc) -> None:
        self.cleanup()
