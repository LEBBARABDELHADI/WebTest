"""Detection engines. Each engine takes an EngineContext and returns CheckRun(s):

* native  — terraform fmt -check / init -backend=false / validate
* tflint  — TFLint, terraform + AWS rulesets
* checkov — Checkov security scan
* aws     — tfpv AWS validator (static coherence + opt-in AWS API checks)
"""
