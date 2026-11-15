"""Self-contained HTML report (no external resource, works offline)."""
from __future__ import annotations

import json
from html import escape

from ..models import Report

SEV_COLOR = {"CRITICAL": "#b91c1c", "HIGH": "#dc2626", "MEDIUM": "#d97706", "LOW": "#2563eb"}
STATUS_COLOR = {"PASSED": "#15803d", "PASSED_WITH_WARNINGS": "#ca8a04", "FAILED": "#dc2626", "INCOMPLETE": "#7c3aed", "ERROR": "#6b7280"}
CSS = """
:root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--code:#f1f5f9;--hl:#fef3c7}
@media (prefers-color-scheme:dark){:root{--bg:#0b1120;--card:#111827;--text:#e5e7eb;--muted:#9ca3af;--border:#1f2937;--code:#0f172a;--hl:#3f3416}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:980px;margin:0 auto;padding:20px 16px 60px}h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:26px 0 10px}
.muted{color:var(--muted)}.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;margin:10px 0}
.status{display:inline-block;padding:6px 12px;border-radius:999px;color:#fff;font-weight:800;letter-spacing:.03em}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}.kpi{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px}
.kpi b{display:block;font-size:24px}.sev{display:inline-block;min-width:76px;text-align:center;padding:2px 8px;border-radius:6px;color:#fff;font-weight:800;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:6px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}
.tag{display:inline-block;padding:1px 7px;border-radius:6px;border:1px solid var(--border);font-size:12px;margin-right:4px}
details{background:var(--card);border:1px solid var(--border);border-radius:12px;margin:8px 0;padding:10px 12px}summary{cursor:pointer;font-weight:700}
pre{background:var(--code);border-radius:8px;padding:8px 10px;overflow-x:auto;font-size:13px;margin:6px 0}pre .hl{background:var(--hl);display:block}
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.filters label{border:1px solid var(--border);border-radius:999px;padding:4px 10px;background:var(--card);cursor:pointer}
input[type=search]{padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);min-width:200px}
a{color:#2563eb;word-break:break-all}.file{margin-top:18px;font-family:ui-monospace,Menlo,monospace;font-weight:700}
"""
JS = """
const boxes=[...document.querySelectorAll('input[data-sev]')],q=document.getElementById('q');
function apply(){const on=new Set(boxes.filter(b=>b.checked).map(b=>b.dataset.sev)),t=(q.value||'').toLowerCase();
document.querySelectorAll('details.finding').forEach(d=>{d.style.display=on.has(d.dataset.sev)&&(!t||d.textContent.toLowerCase().includes(t))?'':'none'});
document.querySelectorAll('.file').forEach(h=>{let n=h.nextElementSibling,vis=false;while(n&&n.classList.contains('finding')){if(n.style.display!=='none')vis=true;n=n.nextElementSibling}h.style.display=vis?'':'none'})}
boxes.forEach(b=>b.addEventListener('change',apply));q.addEventListener('input',apply);
"""


def _snippet(sn: dict | None) -> str:
    if not sn:
        return ""
    rows = []
    for i, line in enumerate(sn["lines"]):
        n = sn["start_line"] + i
        cls = ' class="hl"' if n == sn["highlight"] else ""
        rows.append(f"<span{cls}>{n:>4} | {escape(line)}</span>")
    return "<pre>" + "\n".join(rows) + "</pre>"


def _finding(f: dict) -> str:
    value = f.get("value")
    value = json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else value
    meta = []
    if f.get("resource"):
        meta.append(f"<b>Resource</b> <code>{escape(f['resource'])}</code>")
    if f.get("line"):
        meta.append(f"<b>Line</b> {f['line']}")
    if value not in (None, ""):
        meta.append(f"<b>Current value</b> <code>{escape(str(value))}</code>")
    tags = [f'<span class="tag">{escape(f["category"])}</span>', f'<span class="tag">{escape(f["tier"])}</span>']
    if f["blocking"]:
        tags.append(f'<span class="tag" style="border-color:#dc2626;color:#dc2626">blocking · fails at {escape(f["fails_at"])}</span>')
    if f.get("confidence") != "high":
        tags.append('<span class="tag">confidence: medium</span>')
    refs = "".join(f'<li><a href="{escape(r)}" rel="noopener">{escape(r)}</a></li>' for r in f.get("references") or [])
    fix = f"<p><b>Suggested fix</b></p><pre>{escape(f['fix'])}</pre>" if f.get("fix") else ""
    return f"""<details class="finding" data-sev="{f['severity']}"><summary><span class="sev" style="background:{SEV_COLOR[f['severity']]}">{f['severity']}</span> {escape(f['rule_id'])} — {escape(f['title'])}</summary>
<p>{' · '.join(meta)}</p><p>{''.join(tags)}<span class="tag">{escape(', '.join(f['engines']))}: {escape(', '.join(f['engine_rules']))}</span></p>
{_snippet(f.get('snippet'))}<p><b>Description</b><br>{escape(f['description'])}</p><p><b>Probable cause</b><br>{escape(f['cause'])}</p>
<p><b>Recommendation</b><br>{escape(f['recommendation'])}</p>{fix}<p class="muted"><b>Engine message</b> {escape(f['message'])}</p><ul>{refs}</ul></details>"""


def render(report: Report) -> str:
    s = report.summary
    color = STATUS_COLOR.get(report.status, "#6b7280")
    kpis = [("Total checks", s["total_checks"]), ("Passed", s["passed"]), ("Failed", s["failed"]), ("Warnings", s["warnings"]),
            ("Blocking", s["blocking"]), ("Not run", s["not_run"])]
    checks = "".join(
        f"<tr><td>{escape(c['name'])}</td><td><span class='tag'>{escape(c['tier'])}</span></td><td><b>{escape(c['status'])}</b></td>"
        f"<td>{c['findings']}</td><td class='muted'>{escape(c.get('reason') or '')}</td></tr>" for c in report.checks)
    groups: dict[str, list[dict]] = {}
    for f in report.findings:
        groups.setdefault(f.get("file") or "(project)", []).append(f)
    body = "".join(f'<div class="file">📄 {escape(name)}</div>' + "".join(_finding(f) for f in items) for name, items in groups.items())
    sev_filters = "".join(
        f'<label><input type="checkbox" data-sev="{sv}" checked> <span class="sev" style="background:{SEV_COLOR[sv]}">{sv}</span> {s["by_severity"].get(sv, 0)}</label>'
        for sv in ("CRITICAL", "HIGH", "MEDIUM", "LOW"))
    notes = "".join(f"<li>{escape(n)}</li>" for n in report.notes)
    env = " · ".join(f"{escape(k)} {escape(str(v))}" for k, v in report.environment.items() if v)
    suppressed = "".join(f"<li><code>{escape(f['rule_id'])}</code> {escape(f.get('file') or '')}:{f.get('line') or ''} — {escape(f.get('suppression_reason') or '')}</li>" for f in report.suppressed)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Terraform Pre-Plan Report</title><style>{CSS}</style></head><body><main>
<h1>Terraform Pre-Plan Validation Report</h1><p class="muted">Project <b>{escape(str(report.project.get('name')))}</b> · {escape(report.generated_at)} · {report.duration_s}s</p>
<div class="card"><span class="status" style="background:{color}">{escape(report.status)}</span> <span>{escape(report.status_reason)}</span></div>
<div class="grid">{''.join(f'<div class="kpi"><span class="muted">{k}</span><b>{v}</b></div>' for k, v in kpis)}</div>
<h2>Checks</h2><div class="card" style="overflow-x:auto"><table><tr><th>Check</th><th>Tier</th><th>Status</th><th>Findings</th><th>Notes</th></tr>{checks}</table></div>
<h2>Findings ({len(report.findings)})</h2><div class="filters">{sev_filters}<input id="q" type="search" placeholder="Filter (rule, file, resource)…"></div>
{body or '<p class="muted">No finding.</p>'}
{f'<h2>Suppressed ({len(report.suppressed)})</h2><ul>{suppressed}</ul>' if suppressed else ''}
{f'<h2>Notes</h2><ul>{notes}</ul>' if notes else ''}
<p class="muted" style="margin-top:30px">{env}<br>Generated by tfpv — never runs terraform plan/apply; secrets are redacted.</p>
</main><script>{JS}</script></body></html>
"""
