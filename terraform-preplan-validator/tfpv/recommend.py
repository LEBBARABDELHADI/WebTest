"""Recommendation Engine: turns a raw engine result into an explained,
actionable finding (title, description, probable cause, severity, fix,
documentation) using the knowledge base."""
from __future__ import annotations

from dataclasses import dataclass

from . import knowledge
from .models import RawFinding, ScanOptions

GENERIC = {"SECURITY_GENERIC", "TF_LINT", "AWS_INVALID_ATTRIBUTE_VALUE", "TF_VALIDATE_ERROR", "TF_VALIDATE_WARNING", "TF_INIT_ERROR"}
ENGINE_SEVERITY = {"error": "HIGH", "warning": "MEDIUM", "notice": "LOW", "info": "LOW"}


@dataclass
class Advice:
    rule_id: str
    title: str
    severity: str
    category: str
    blocking: bool
    fails_at: str
    description: str
    cause: str
    recommendation: str
    fix: str | None
    references: list[str]
    confidence: str
    tier: str


def canonical_rule(raw: RawFinding, options: ScanOptions) -> tuple[str, str | None]:
    """(canonical KB rule, severity hint from the mapping)."""
    if raw.rule_id:
        return raw.rule_id, None
    if raw.engine == "tflint":
        return knowledge.map_tflint(raw.engine_rule, raw.engine_severity, options.tflint_deep_check), None
    if raw.engine == "checkov":
        return knowledge.map_checkov(raw.engine_rule, raw.message)
    if raw.engine == "terraform":
        return knowledge.map_terraform(raw.message, raw.engine_severity or "error", raw.engine_rule.split(":")[0]), None
    return "SECURITY_GENERIC", None


def advise(raw: RawFinding, options: ScanOptions) -> Advice:
    kb_id, sev_hint = canonical_rule(raw, options)
    kb = knowledge.RULES.get(kb_id) or knowledge.RULES["SECURITY_GENERIC"]
    rule_id = kb.id
    title = kb.title
    description = kb.description
    references = list(kb.references)
    severity = kb.severity
    blocking = kb.blocking
    fails_at = kb.fails_at

    if kb.id in GENERIC:
        if raw.engine == "checkov":
            rule_id, title, description = raw.engine_rule, raw.message, raw.message
        elif raw.engine == "tflint":
            title = f"{kb.title}: {raw.engine_rule}"
            description = f"{kb.description} TFLint: {raw.message}"
        elif raw.engine == "terraform":
            title = raw.message or kb.title
        if raw.engine_severity and raw.engine in ("tflint", "terraform"):
            severity = ENGINE_SEVERITY.get(raw.engine_severity.lower(), severity)
    if sev_hint:
        severity = sev_hint
    if raw.engine == "terraform":
        if raw.detail:
            description = f"{description} Terraform says: {raw.detail}"
        if (raw.engine_severity or "").lower() == "warning":
            blocking, fails_at = False, "none"
            if knowledge.RULES.get(kb.id) and kb.severity in ("CRITICAL", "HIGH"):
                severity = "LOW"
    if raw.engine == "tflint" and kb.id == "AWS_INVALID_INSTANCE_TYPE":
        description = f"{kb.description} ({raw.message})"
    if raw.link and raw.link not in references:
        references.insert(0, raw.link)
    if raw.engine == "tflint" and not raw.link:
        link = knowledge.tflint_link(raw.engine_rule, None, options.tflint_aws_version)
        if link and link not in references:
            references.insert(0, link)
    if raw.engine == "checkov" and not raw.link:
        references.append(knowledge.CHECKOV_INDEX)

    extra = raw.extra or {}
    severity = extra.get("severity", severity)
    fails_at = extra.get("fails_at", fails_at)
    confidence = extra.get("confidence", kb.confidence)
    for key in (rule_id, kb.id, raw.engine_rule):
        if key in options.severity_overrides:
            severity = options.severity_overrides[key]
            break
    return Advice(rule_id=rule_id, title=title, severity=severity, category=kb.category, blocking=blocking, fails_at=fails_at,
                  description=description, cause=kb.cause, recommendation=kb.recommendation, fix=kb.fix,
                  references=list(dict.fromkeys(references)), confidence=confidence, tier=raw.tier if raw.tier != "static" else kb.tier)

