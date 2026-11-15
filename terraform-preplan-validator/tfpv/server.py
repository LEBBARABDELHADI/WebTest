"""Local HTTP API used by the React Blocs « Terraform · TFLint » page.

Security model (the API runs tools on the user's machine):
* binds 127.0.0.1 only;
* random access token (or --token), required on every /api call
  (Authorization: Bearer ...), compared in constant time;
* Origin allowlist (the React Blocs site + local dev servers), CORS and
  Private Network Access preflight answered only for allowed origins;
* Host header must be localhost/127.0.0.1 (DNS-rebinding protection);
* path scans limited to directories under --root; uploads limited in size
  and number of files, written to a private temporary directory, deleted
  after the scan; file names sanitised (no absolute path, no "..").

Endpoints:
  GET  /api/health                  tool availability (doctor)
  POST /api/scans                   {"source": {...}, "options": {...}} -> {"id": ...}
  GET  /api/scans/<id>              job state, progress, report when done
  POST /api/scans/<id>/rerun        re-run a path scan (after corrections)
  GET  /api/scans/<id>/report.html  HTML report
"""
from __future__ import annotations

import hmac
import json
import logging
import secrets
import shutil
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import quote, urlsplit

from . import __version__, report as reporting, tools
from .config import CHECK_IDS
from .models import SEVERITIES, ScanOptions
from .pipeline import STEPS, ScanError, error_report, scan
from .runner import Runner

log = logging.getLogger("tfpv.server")

DEFAULT_ORIGINS = {
    "https://lebbarabdelhadi.github.io",
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:4173", "http://127.0.0.1:4173",
}
MAX_BODY = 25 * 1024 * 1024
MAX_FILES = 3000
MAX_FILE = 5 * 1024 * 1024
TEXT_SUFFIXES = (".tf", ".tf.json", ".tfvars", ".tfvars.json", ".hcl", ".tftpl", ".tpl", ".json", ".yaml", ".yml", ".sh", ".ps1",
                 ".txt", ".toml", ".cfg", ".conf", ".pem", ".pub", ".py", ".md")
MAX_JOBS = 20


@dataclass
class Job:
    id: str
    source: dict[str, Any]
    options: dict[str, Any]
    state: str = "queued"
    created: float = field(default_factory=time.time)
    progress: dict[str, Any] = field(default_factory=dict)
    steps: list[dict[str, Any]] = field(default_factory=lambda: [{"id": s, "label": l, "state": "pending"} for s, l in STEPS])
    report: dict[str, Any] | None = None
    error: str | None = None

    def public(self) -> dict[str, Any]:
        return {"id": self.id, "state": self.state, "source": {k: v for k, v in self.source.items() if k != "files"},
                "options": self.options, "progress": self.progress, "steps": self.steps, "error": self.error,
                "report": self.report, "created": self.created}


class App:
    def __init__(self, root: Path, token: str, origins: set[str], port: int, bins: dict[str, str | None]):
        self.root = root.resolve()
        self.token = token
        self.origins = origins
        self.port = port
        self.bins = bins
        self.jobs: dict[str, Job] = {}
        self.lock = threading.Lock()
        self.pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="tfpv-scan")
        self._health: tuple[float, dict[str, Any]] | None = None

    def health(self) -> dict[str, Any]:
        """Tool versions, cached 5 minutes (`checkov --version` alone takes seconds)."""
        with self.lock:
            cached = self._health
        if cached and time.time() - cached[0] < 300:
            return cached[1]
        b = self.bins
        info = tools.doctor(Runner(), b.get("tf"), b.get("tflint"), b.get("checkov"), b.get("aws"))
        info["root"] = str(self.root)
        info["steps"] = [{"id": s, "label": l} for s, l in STEPS]
        with self.lock:
            self._health = (time.time(), info)
        return info

    # -- jobs ------------------------------------------------------------------
    def submit(self, source: dict[str, Any], options: dict[str, Any]) -> Job:
        job = Job(id=uuid.uuid4().hex[:12], source=source, options=options)
        with self.lock:
            self.jobs[job.id] = job
            for old in sorted(self.jobs.values(), key=lambda j: j.created)[:-MAX_JOBS]:
                self.jobs.pop(old.id, None)
        self.pool.submit(self._run, job)
        return job

    def _run(self, job: Job) -> None:
        job.state = "running"
        tmp: Path | None = None
        try:
            if job.source["type"] == "files":
                tmp = Path(tempfile.mkdtemp(prefix="tfpv-upload-"))
                target = write_upload(tmp, job.source["files"])
                display = f"upload:{job.source.get('label') or target.name}"
            else:
                target = Path(job.source["path"])
                display = str(target)
            opts = scan_options(job.options, self.bins)

            def progress(ev: dict[str, Any]) -> None:
                job.progress = ev
                for s in job.steps:
                    if s["id"] == ev["step"]:
                        s["state"] = ev["state"]

            rep = scan(target, opts, progress=progress, display_path=display)
            job.report = rep.to_dict()
            job.state = "done"
        except (ScanError, ValueError) as e:
            job.report = error_report(job.source.get("label") or "project", str(e)).to_dict()
            job.error, job.state = str(e), "error"
        except Exception as e:  # noqa: BLE001
            log.exception("scan %s failed", job.id)
            job.error, job.state = f"internal error: {type(e).__name__}", "error"
        finally:
            if job.source["type"] == "files":
                job.source["files"] = []  # free memory; uploaded content is never kept
            if tmp is not None:
                shutil.rmtree(tmp, ignore_errors=True)


def sanitize(rel: str) -> PurePosixPath:
    p = PurePosixPath(rel.replace("\\", "/"))
    if p.is_absolute() or not p.parts or any(part in ("..", "") or part.startswith("~") for part in p.parts) or ":" in p.parts[0]:
        raise ValueError(f"invalid file name: {rel!r}")
    return p


def write_upload(tmp: Path, files: list[dict[str, Any]]) -> Path:
    if not files:
        raise ValueError("no file received")
    if len(files) > MAX_FILES:
        raise ValueError(f"too many files ({len(files)} > {MAX_FILES})")
    paths = []
    for f in files:
        p = sanitize(str(f.get("path") or ""))
        content = f.get("content")
        if not isinstance(content, str):
            raise ValueError(f"{p}: content must be text")
        if len(content.encode("utf-8")) > MAX_FILE:
            raise ValueError(f"{p}: file too large")
        if not (p.name.endswith(TEXT_SUFFIXES) or p.name in (".terraform.lock.hcl", ".tflint.hcl", ".tfpv.toml")):
            continue
        dest = tmp / Path(*p.parts)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8")
        paths.append(p)
    if not any(p.name.endswith((".tf", ".tf.json")) for p in paths):
        raise ValueError("no .tf file in the upload")
    firsts = {p.parts[0] for p in paths}
    if len(firsts) == 1 and all(len(p.parts) > 1 for p in paths):
        return tmp / next(iter(firsts))  # the folder the user selected
    return tmp


def scan_options(o: dict[str, Any], bins: dict[str, str | None]) -> ScanOptions:
    fail_on = str(o.get("fail_on") or "HIGH").upper()
    if fail_on not in SEVERITIES:
        raise ValueError("fail_on must be CRITICAL, HIGH, MEDIUM or LOW")
    skip = tuple(s for s in o.get("skip") or () if s in CHECK_IDS)
    return ScanOptions(fail_on=fail_on, offline=bool(o.get("offline")), skip=skip, aws_checks=bool(o.get("aws_checks")),
                       tflint_deep_check=bool(o.get("tflint_deep_check")), project_name=(str(o["project_name"])[:80] if o.get("project_name") else None),
                       aws_region=str(o["aws_region"])[:30] if o.get("aws_region") else None,
                       tf_bin=bins.get("tf"), tflint_bin=bins.get("tflint"), checkov_bin=bins.get("checkov"), aws_bin=bins.get("aws"))


class Handler(BaseHTTPRequestHandler):
    server_version = f"tfpv/{__version__}"
    app: App  # set on the subclass created in make_server()

    def log_message(self, fmt: str, *args: Any) -> None:  # route to our (redacting) logger
        log.info("%s %s", self.address_string(), fmt % args)

    # -- helpers ---------------------------------------------------------------
    def _origin_ok(self) -> str | None:
        origin = self.headers.get("Origin")
        return origin if origin and origin in self.app.origins else None

    def _host_ok(self) -> bool:
        host = (self.headers.get("Host") or "").lower()
        return host in {f"127.0.0.1:{self.app.port}", f"localhost:{self.app.port}", f"[::1]:{self.app.port}"}

    def _send(self, code: int, payload: Any, ctype: str = "application/json; charset=utf-8") -> None:
        body = payload if isinstance(payload, bytes) else (payload.encode("utf-8") if isinstance(payload, str) else json.dumps(payload).encode("utf-8"))
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        origin = self._origin_ok()
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def _guard(self) -> bool:
        if not self._host_ok():
            self._send(403, {"error": "forbidden host"})
            return False
        if self.headers.get("Origin") and not self._origin_ok():
            self._send(403, {"error": "origin not allowed (start tfpv serve with --allow-origin)"})
            return False
        auth = self.headers.get("Authorization") or ""
        given = auth[7:] if auth.lower().startswith("bearer ") else ""
        if not given or not hmac.compare_digest(given.encode(), self.app.token.encode()):
            self._send(401, {"error": "invalid or missing token"})
            return False
        return True

    def _json_body(self) -> Any:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        if length > MAX_BODY:
            raise ValueError(f"request too large (> {MAX_BODY // (1024 * 1024)} MB)")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    # -- verbs -----------------------------------------------------------------
    def do_OPTIONS(self) -> None:  # noqa: N802
        origin = self._origin_ok()
        if not origin or not self._host_ok():
            self.send_response(403)
            self.end_headers()
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if not self._guard():
            return
        if path == "/api/health":
            return self._send(200, self.app.health())
        parts = path.strip("/").split("/")
        if len(parts) >= 3 and parts[:2] == ["api", "scans"]:
            job = self.app.jobs.get(parts[2])
            if job is None:
                return self._send(404, {"error": "unknown scan"})
            if len(parts) == 3:
                return self._send(200, job.public())
            if parts[3:] == ["report.html"] and job.report:
                from .models import Report
                return self._send(200, reporting.render(Report(**job.report), "html"), "text/html; charset=utf-8")
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if not self._guard():
            return
        try:
            body = self._json_body()
        except (ValueError, UnicodeDecodeError) as e:
            return self._send(400, {"error": str(e)})
        try:
            if path == "/api/scans":
                source = body.get("source") or {}
                options = body.get("options") or {}
                scan_options(options, self.app.bins)  # validate early
                if source.get("type") == "path":
                    p = Path(str(source.get("path") or "")).expanduser()
                    p = (p if p.is_absolute() else self.app.root / p).resolve()
                    if p != self.app.root and self.app.root not in p.parents:
                        return self._send(403, {"error": f"path outside the allowed root ({self.app.root})"})
                    if not p.is_dir():
                        return self._send(400, {"error": f"not a directory: {p}"})
                    job = self.app.submit({"type": "path", "path": str(p), "label": p.name}, options)
                elif source.get("type") == "files":
                    files = source.get("files")
                    if not isinstance(files, list):
                        return self._send(400, {"error": "files must be a list"})
                    for f in files:
                        sanitize(str(f.get("path") or ""))
                    job = self.app.submit({"type": "files", "files": files, "label": str(source.get("label") or "upload")[:80]}, options)
                else:
                    return self._send(400, {"error": "source.type must be 'path' or 'files'"})
                return self._send(202, {"id": job.id})
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[:2] == ["api", "scans"] and parts[3] == "rerun":
                old = self.app.jobs.get(parts[2])
                if old is None:
                    return self._send(404, {"error": "unknown scan"})
                if old.source["type"] != "path":
                    return self._send(409, {"error": "uploaded projects must be sent again (select the folder again)"})
                job = self.app.submit({k: v for k, v in old.source.items()}, old.options)
                return self._send(202, {"id": job.id})
        except ValueError as e:
            return self._send(400, {"error": str(e)})
        self._send(404, {"error": "not found"})


def make_server(app: App) -> ThreadingHTTPServer:
    handler = type("TfpvHandler", (Handler,), {"app": app})
    srv = ThreadingHTTPServer(("127.0.0.1", app.port), handler)
    srv.daemon_threads = True
    return srv


def serve(a: Any) -> int:
    token = a.token or secrets.token_urlsafe(24)
    origins = DEFAULT_ORIGINS | set(a.allow_origin or [])
    bins = {"tf": a.tf_bin, "tflint": a.tflint_bin, "checkov": a.checkov_bin, "aws": a.aws_bin}
    app = App(Path(a.root), token, origins, a.port, bins)
    try:
        srv = make_server(app)
    except OSError as e:
        print(f"tfpv serve: cannot listen on 127.0.0.1:{a.port}: {e}")
        return 3
    engine = f"http://127.0.0.1:{a.port}"
    link = f"{a.app_url.rstrip('/')}/#/outils/pro?outil=tfpv&moteur={quote(engine, safe='')}&jeton={quote(token, safe='')}"
    print(f"tfpv {__version__} — local API on {engine}")
    print(f"Scans by path allowed under: {app.root}")
    print(f"Access token: {token}")
    print(f"Open React Blocs (token in the URL fragment, never sent to a server):\n  {link}")
    print("Ctrl+C to stop.")
    threading.Thread(target=app.health, daemon=True).start()  # warm the tool-version cache
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
        app.pool.shutdown(wait=False, cancel_futures=True)
    return 0
