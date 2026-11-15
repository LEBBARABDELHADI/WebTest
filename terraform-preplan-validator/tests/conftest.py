import json
import shutil
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures"
CAPTURED = FIXTURES / "captured"
sys.path.insert(0, str(ROOT))

from tfpv.runner import Result  # noqa: E402


@pytest.fixture
def make_project(tmp_path):
    """Create a Terraform project from {relative path: content}."""
    def _make(files: dict[str, str]) -> Path:
        for rel, content in files.items():
            p = tmp_path / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content)
        return tmp_path
    return _make


class FakeRunner:
    """Returns recorded outputs instead of running the tools."""

    def __init__(self, responses: dict[str, Result | tuple[int, str, str]]):
        self.responses = responses
        self.calls: list[list[str]] = []

    def run(self, cmd, cwd=None, env=None, timeout=600):
        self.calls.append(list(cmd))
        joined = " ".join(cmd)
        for key, resp in self.responses.items():
            if key in joined:
                if isinstance(resp, Result):
                    return resp
                rc, out, err = resp
                return Result(list(cmd), rc, out, err)
        return Result(list(cmd), 127, "", "not found", not_found=True)


@pytest.fixture
def captured():
    def _read(name: str) -> str:
        return (CAPTURED / name).read_text()
    return _read


def copy_fixture(name: str, dest: Path) -> Path:
    target = dest / name
    shutil.copytree(FIXTURES / name, target)
    return target


def load_json(p: Path):
    return json.loads(p.read_text())
