"""Lit sur l'entrée standard une liste de politiques JSON, renvoie les constats de Parliament
(https://github.com/duo-labs/parliament, BSD-3) : [[{issue, severity, title, detail, location}, …], …].
Outil de contrôle des tests uniquement : jamais embarqué dans l'application."""
import json
import sys

from parliament import analyze_policy_string

politiques = json.load(sys.stdin)
sortie = []
for p in politiques:
    analyse = analyze_policy_string(json.dumps(p))
    sortie.append([
        {'issue': f.issue, 'severity': f.severity, 'title': f.title, 'detail': str(f.detail)[:300], 'location': str(f.location)[:160]}
        for f in analyse.findings
    ])
print(json.dumps(sortie))
