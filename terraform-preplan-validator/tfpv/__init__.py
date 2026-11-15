"""Terraform Pre-Plan Validator (tfpv).

Orchestrates terraform fmt/init/validate, TFLint (terraform + AWS rulesets),
Checkov and tfpv's own AWS coherence checks, then explains every finding.
Never runs `terraform plan` or `apply`, never modifies Terraform files.
"""
__version__ = "1.0.0"
