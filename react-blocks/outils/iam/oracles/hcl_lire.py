"""Lit du Terraform (HCL2) sur l'entrée standard et renvoie son arbre en JSON (python-hcl2) : chaînes et
étiquettes dépouillées de leurs guillemets, marqueurs internes retirés.
Outil de contrôle des tests uniquement."""
import json
import sys

import hcl2


def nettoyer(v):
    if isinstance(v, dict):
        return {nettoyer_texte(k): nettoyer(x) for k, x in v.items() if k != '__is_block__'}
    if isinstance(v, list):
        return [nettoyer(x) for x in v]
    if isinstance(v, str):
        return nettoyer_texte(v)
    return v


def nettoyer_texte(s):
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        try:
            return json.loads(s)
        except ValueError:
            return s[1:-1]
    return s


print(json.dumps(nettoyer(hcl2.loads(sys.stdin.read()))))
