# Terraform Pre-Plan Validator — analyse et architecture

## 1. Décision : l'outil s'utilise dans l'application, pas sur l'ordinateur

Première version : le bouton de React Blocs pilotait un moteur local (`tfpv serve`) qui lançait les binaires `terraform`, `tflint` et `checkov`. Il fallait installer Python et ces outils sur le poste.

**Demande ensuite** : l'outil doit être exploitable **uniquement dans l'application**. L'architecture a été revue en conséquence.

| Contrainte | Conséquence | Choix |
|---|---|---|
| Un navigateur ne peut pas exécuter `terraform`, `tflint` ni `checkov` : binaires natifs, plugins en sous-processus gRPC, Python avec extensions natives | Ces binaires ne peuvent pas être « appelés » depuis la page | On embarque leurs **données de référence officielles** : schéma du provider AWS (ce que `validate` utilise), données du ruleset AWS de TFLint, et une sélection de politiques équivalentes à Checkov |
| « Ne pas réinventer » | Une réécriture libre de leurs règles donnerait une fausse assurance | Les règles de schéma et TFLint sont **pilotées par leurs données**, et vérifiées contre les vrais outils sur les mêmes fichiers (§4) |
| Aucun fichier ne doit quitter l'appareil (code d'infrastructure, peut-être confidentiel) | Pas de serveur d'analyse distant | Le moteur tourne dans un **Web Worker** ; seules les données de référence publiques sont téléchargées, depuis le site de l'application |
| Téléphone et PC | Pas de sélection de dossier sur certains mobiles | Plusieurs sources : dossier, fichiers, archive `.zip`, **code collé**, exemple, rapport |
| « Jamais validé si un contrôle n'a pas pu tourner » | Les modules distants et les providers sans schéma embarqué ne sont pas analysables | Statut **INCOMPLETE** avec la raison exacte ; un « Périmètre » liste ce qui est et n'est pas vérifié |

`tfpv serve` a été **retiré**. Le moteur Python reste disponible pour la CI, avec les vrais binaires. Les deux moteurs partagent la base de connaissances (`tfpv/knowledge.py`, exportée en JavaScript) et le format de rapport.

## 2. Moteur intégré à l'application

```
React Blocs › Outils DevOps › 🛡️ Terraform · TFLint   (TerraformPrePlan.jsx)
   │  lecture : dossier (File System Access, relisible) · fichiers · .zip (DecompressionStream) · code collé
   ▼
Web Worker (moteur/worker.js)  ← données publiques chargées une fois : public/tfpv/schema-aws.json (5,8 Mo, 304 Ko compressé),
   │                              schema-autres.json, tflint-aws.json
   ├─ projet.js     Terraform Scanner : fichiers, modules racines et locaux, variables (.tfvars, -var-file, TF_VAR_), inventaire,
   │                syntaxe, valeurs et types des variables, références, modules, providers, doublons, sorties sensibles
   ├─ schema.js     équivalent terraform validate : schéma officiel des providers
   ├─ tflintAws.js  règles AWS de TFLint pilotées par les données du ruleset (enum, motifs, longueurs, listes)
   ├─ coherence.js  validateur AWS tfpv : CIDR, sous-réseaux, ports, EBS, RDS, IAM, AMI
   ├─ securite.js   politiques équivalentes à Checkov (ID CKV_* conservés)
   ├─ format.js     approximation prudente de terraform fmt -check
   └─ diagnostic.js Diagnostic + Recommendation Engine : règle canonique, explication, gravité, ressource, ligne, extrait masqué,
                    dédoublonnage, suppressions (tfpv:ignore, tflint-ignore, checkov:skip), statut
   ▼
Rapport (schema_version 1.0) → écran (filtres, code, corrections) · exports JSON / HTML / texte
```

Les fondations (`hcl.js`, `expr.js`, `types.js`) sont un lecteur HCL2 et un évaluateur **partiel**. Ils calculent ce qui est connu avant `plan` :
- littéraux, `var.*`, `local.*` ;
- attributs d'autres ressources ;
- `cidrsubnet`, `jsonencode`, `format`…

Le reste vaut « inconnu ». Les règles qui en dépendent sont comptées « non évaluables », jamais en échec : c'est ce qui évite les faux positifs.

## 3. Moteur CLI (CI)

`tfpv scan` (Python, sans dépendance) exécute :
- `terraform fmt -check`, `init -backend=false` et `validate`, sur une copie temporaire : le projet n'est jamais modifié ;
- TFLint, avec les rulesets terraform et AWS épinglés ;
- Checkov, en `--skip-download --compact`.

Il ajoute les mêmes contrôles tfpv. L'exécuteur applique une liste blanche : `plan`, `apply`, `destroy` et `fmt` sans `-check` sont refusés.

Il produit des rapports texte, JSON, HTML et JUnit, avec les codes de sortie 0, 1, 2 et 3. Un rapport JSON de CI peut être rouvert dans l'outil.

## 4. Vérification contre les vrais outils

Fichiers dans `tests/fixtures`. Outils : terraform 1.17.2 avec le provider AWS 6.73.0, TFLint 0.66.0 avec le ruleset AWS 0.50.0, Checkov 3.4.5.

* **`schema_errors`** : `terraform validate` signale 7 erreurs. Le moteur intégré trouve les 7, **aux mêmes lignes et avec les mêmes messages**, suggestions comprises (« Did you mean "aws_instance"? »). Il en trouve 2 de plus : `arn` non configurable et attribut référencé inexistant. `validate` ne les remonte qu'au passage suivant, ce qui a été vérifié.
* **`tflint_rules`** : les 9 constats de TFLint sont trouvés (type EBS, moteur et classe RDS, instance de génération précédente, runtime Lambda obsolète, nom de bucket, route sans cible, longueur de nom IAM).
* **`invalid_aws`** : on retrouve :
  - les constats de `validate` (référence non déclarée), de TFLint (`t3.invalid`) et de `fmt` ;
  - les problèmes majeurs vus par Checkov ;
  - les erreurs que seul tfpv voit avant `plan`.

  Un `plan` de laboratoire, avec de faux identifiants et uniquement pour la vérification, a confirmé quelles erreurs échouent au plan : variable sans valeur, `.tfvars` mal typé, `iops` sur `st1`/`gp2`, `io1` sans `iops`, `throughput` hors `gp3`. Les autres passent le plan et échoueraient à l'apply, d'après la documentation AWS.
* **`valid_basic`** : validé par terraform (fmt, validate), TFLint et Checkov comme par le moteur intégré, avec le même `#checkov:skip`.
* **`modules_local`**, **`syntax_error`**, **`module_missing`**, **`secrets`** : mêmes constats principaux ; aucun secret dans les rapports.

Tests : `npm run test:tfpv` (12 tests du moteur intégré) ; `pytest tests/unit` (56) et `pytest -m integration` (8) pour le moteur CLI.

## 5. Interfaces

* **Constat brut** : `{engine, engineRule, ruleId?, message, file, line, resource, attribute, value, engineSeverity, tier, extra}`.
* **Constat normalisé** (rapport) : `{id, rule_id, title, severity, category, blocking, fails_at, file, line, resource, attribute, value, description, cause, recommendation, fix, references, engines, engine_rules, message, tier, confidence, snippet}`.
* **Contrôle** : `{id, name, engine, required, status (passed|failed|skipped|error), reason, passed_count, not_evaluated, partial, findings}`.
* **Rapport** : `{schema_version, tool, project, status, status_reason, summary, environment, checks, inventory, findings, suppressed, notes, redaction, scope}`. Le format est le même pour les deux moteurs.
* **Progression** : `{step, index, total, label, state, percent}`, envoyée par le Web Worker.

## 6. Sécurité et vie privée

* Le moteur intégré ne fait **aucune requête** avec les fichiers de l'utilisateur ; c'est vérifié par un test Playwright qui surveille toutes les requêtes.
* Les secrets sont masqués dans les rapports : valeurs des variables `sensitive`, arguments `password`/`secret`/`token`…, clés AWS, clés privées, jetons GitHub, GitLab et Slack, JWT.
* Les fichiers de plus de 5 Mo, `.terraform`, `.git` et les fichiers d'état sont ignorés.

## 7. Extensibilité

* **Nouveau provider** (Azure, GCP…) : ajouter son schéma à `outils/donnees_navigateur.py` (`--other-schemas`). La validation de schéma s'applique aussitôt. Les règles propres au provider s'ajoutent sur le modèle de `coherence.js` et `securite.js`.
* **Nouvelle règle** : une entrée dans `tfpv/knowledge.py` (texte, gravité, blocage), la régénération des données, la règle dans le module concerné, et un test.

## 8. Limites connues

* Non évaluable sans `plan` : expressions `for`, blocs `dynamic`, ressources avec `count`/`for_each`, valeurs calculées à l'apply. Ces cas ne produisent pas de faux positif, mais pas de détection non plus.
* Modules distants (registre, Git) non téléchargés : statut INCOMPLETE.
* Le formatage est une approximation de `terraform fmt` (indentation, `=` et alignement, tabulations, espaces). La sortie exacte de `fmt` n'est pas reproduite.
* Le moteur ne couvre pas toutes les politiques Checkov : seulement une sélection centrée sur les risques majeurs.
* Mise à jour des références : schéma AWS 6.73.0 et ruleset TFLint 0.50.0 ; les régénérer avec `outils/donnees_navigateur.py`.
