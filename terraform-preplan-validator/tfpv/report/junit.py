"""JUnit XML: one test suite per check; failing findings are failures,
checks that did not run are skipped (GitLab/GitHub/Jenkins test reports)."""
from __future__ import annotations

from xml.sax.saxutils import escape, quoteattr

from ..models import Report, severity_at_least


def render(report: Report) -> str:
    suites = []
    total = failures = skipped = 0
    for c in report.checks:
        cases = []
        if c["status"] in ("skipped", "error"):
            cases.append(f'    <testcase classname={quoteattr("tfpv." + c["id"])} name={quoteattr(c["name"])}><skipped message={quoteattr(c.get("reason") or c["status"])}/></testcase>')
            skipped += 1
        else:
            cases.append(f'    <testcase classname={quoteattr("tfpv." + c["id"])} name={quoteattr(c["name"] + " executed")}/>')
        total += 1
        suites.append((c["id"], cases))
    fcases = []
    for f in report.findings:
        name = f'[{f["severity"]}] {f["rule_id"]} {f.get("resource") or ""} ({f.get("file") or "-"}:{f.get("line") or "-"})'
        body = escape(f'{f["description"]}\n\nRecommendation: {f["recommendation"]}\nEngine message: {f["message"]}')
        failing = f["blocking"] or severity_at_least(f["severity"], report.fail_on)
        total += 1
        if failing:
            failures += 1
            fcases.append(f'    <testcase classname={quoteattr(f.get("file") or "project")} name={quoteattr(name)}><failure type={quoteattr(f["severity"])} message={quoteattr(f["title"])}>{body}</failure></testcase>')
        else:
            fcases.append(f'    <testcase classname={quoteattr(f.get("file") or "project")} name={quoteattr(name)}><system-out>{body}</system-out></testcase>')
    suites.append(("findings", fcases))
    xml = [f'<?xml version="1.0" encoding="UTF-8"?>',
           f'<testsuites name="tfpv" tests="{total}" failures="{failures}" skipped="{skipped}">']
    for name, cases in suites:
        f_count = sum(1 for c in cases if "<failure" in c)
        s_count = sum(1 for c in cases if "<skipped" in c)
        xml.append(f'  <testsuite name={quoteattr(name)} tests="{len(cases)}" failures="{f_count}" skipped="{s_count}">')
        xml.extend(cases)
        xml.append("  </testsuite>")
    xml.append("</testsuites>")
    return "\n".join(xml) + "\n"
