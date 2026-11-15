# Terraform Pre-Plan Validator — analyse et architecture

## 1. Analyse critique de la demande

| Point de la demande | Difficulté / risque | Décision |
|---|---|---|
| « Bouton » dans React Blocs, upload, Scan | L'application est un site statique (GitHub Pages) utilisé aussi sur téléphone. Terraform, TFLint et Checkov sont des binaires natifs : ils ne peuvent pas tourner dans un navigateur (TFLint charge ses rulesets par gRPC/sous-processus, Checkov est un paquet Python lourd). Réimplémenter leurs règles en JavaScript contredirait « ne pas réinventer » et donnerait une fausse assurance. | **Moteur local** (`tfpv`, CLI + API HTTP sur 127.0.0.1) qui exécute les vrais outils ; **le bouton est un client** de ce moteur. Sans moteur (téléphone), la page **ouvre un rapport JSON** produit en CI. |
| `terraform init -backend=false` | `init` écrit `.terraform/` et `.terraform.lock.hcl` **dans le projet** : contraire à « ne jamais modifier les fichiers ». Il a aussi besoin du registre (réseau) ou d'un miroir. | `init`/`validate` tournent sur une **copie fantôme** temporaire (modules locaux `../` inclus, fichiers d'état exclus), avec `TF_DATA_DIR` temporaire et un cache de providers partagé. Un test d'intégration vérifie, par empreinte SHA-256, que le dossier scanné reste identique. |
| `terraform fmt` | Sans `-check`, il réécrit les fichiers. | L'exécuteur **refuse** `fmt` sans `-check`, ainsi que `plan`, `apply`, `destroy`, `import`, `state` (liste blanche testée). |
| Redondances | `validate` et le ruleset `terraform` de TFLint se recouvrent en partie ; un « AWS Validator » maison risquait de dupliquer TFLint (types d'instance, runtimes obsolètes) et Checkov (chiffrement, exposition publique, IAM `*`, ports ouverts). | Le validateur AWS de tfpv ne couvre **que ce qu'aucun moteur ne vérifie** (cohérence entre attributs et entre ressources). Les doublons entre moteurs sont **fusionnés** par le moteur de diagnostic. |
| Détection « avant plan » | Mesuré en laboratoire (voir §7) : `validate`, TFLint et Checkov **ne voient pas** plusieurs erreurs qui font échouer `plan` (tfvars mal typé, variable requise sans valeur, `iops` sur un volume `st1`/`gp2`, `io1` sans `iops`, `throughput` hors `gp3`) ni d'autres qui échouent à l'`apply` (sous-réseau hors de la VPC, sous-réseaux qui se chevauchent, AMI mal formée, principal IAM invalide, combinaisons RDS interdites). | Ce sont précisément les règles du **scanner** et du **validateur AWS** de tfpv : c'est la valeur ajoutée par rapport à un simple enrobage de TFLint. |
| Gravité Checkov | Checkov OSS renvoie `severity: null` sans clé Prisma Cloud. | Gravités attribuées par la **base de connaissances** tfpv, surchargeables (`.tfpv.toml`). |
| Faux positifs | Une valeur calculée (`count`, `for`, données externes, sorties de modules) ne peut pas être évaluée sans `plan`. | Évaluateur **partiel** : tout ce qui n'est pas connu vaut « inconnu » et la règle est comptée **« non évaluable »**, jamais en échec. Les replis hors ligne du scanner (références non déclarées, syntaxe, entrées de module) **disparaissent automatiquement** quand Terraform a tourné, car Terraform fait autorité. |
| « Ne jamais annoncer une validation réussie » | Un outil absent, `init` sans réseau, ou un fichier que Checkov ne lit pas rendraient un « OK » mensonger. | Statut **INCOMPLETE** (code de sortie 2) dès qu'un contrôle requis n'a pas tourné, même s'il a été désactivé volontairement. `--allow-incomplete` change seulement le code de sortie, jamais le statut. |
| Vérifications « nécessitant AWS » | Existence d'une AMI, offre d'un type d'instance dans la région, version de moteur RDS : impossible à savoir hors ligne. | Niveau **`aws`**, **sur demande** (`--aws-checks`), via l'AWS CLI avec une liste blanche d'appels en lecture seule ; ou le *deep check* de TFLint (`--tflint-deep-check`). |
| Langage | Checkov est en Python ; un parseur HCL Python (`python-hcl2`) entre en conflit de nom de module avec celui embarqué par Checkov (`bc-python-hcl2`). | Moteur en **Python ≥ 3.11 sans aucune dépendance** (bibliothèque standard) ; tfpv a son propre lecteur HCL minimal (structure, lignes exactes, évaluation partielle). Checkov s'installe à part (pipx). |
| Docker / SARIF | Image non testable ici (téléchargements GitHub bloqués dans l'environnement de travail) ; SARIF non demandé. | **Pas livrés** plutôt que livrés non testés. JUnit (rapports de tests GitLab/GitHub) est fourni et testé. |

## 2. Architecture cible

```
                    React Blocs (GitHub Pages, téléphone et PC)
                    Outils DevOps › « 🛡️ Terraform · TFLint »
                      │ HTTP 127.0.0.1 + jeton        │ import d'un rapport JSON (CI)
                      ▼                               ▼
  tfpv serve ──► Pipeline ◄── tfpv scan (CLI, CI/CD)
                    │
   1-2 Terraform Scanner (fichiers, modules, providers, variables, ressources, inventaire)
                    │
   3-5 en parallèle ├─► Terraform natif : fmt -check │ init -backend=false → validate (copie fantôme)
                    ├─► TFLint Engine : ruleset terraform (recommended) + ruleset AWS épinglé
                    └─► AWS Validator (statique + API AWS sur demande) │ Security Scanner : Checkov
                    │
    6   Diagnostic Engine : normalisation, adresse et ligne exactes, dédoublonnage, replis, suppressions, statut
    7   Recommendation Engine : règle canonique, cause probable, gravité, correction, documentation
    8   Reporting Engine : texte · JSON · HTML autonome · JUnit
```

Composants demandés → modules :

| Composant | Module |
|---|---|
| Terraform Scanner | `tfpv/scanner.py`, `tfpv/hcl/` |
| TFLint Engine | `tfpv/engines/tflint.py` |
| AWS Validator | `tfpv/engines/aws/static.py`, `tfpv/engines/aws/external.py` |
| Security Scanner | `tfpv/engines/checkov.py` |
| Contrôles Terraform natifs | `tfpv/engines/native.py`, `tfpv/workspace.py` |
| Diagnostic Engine | `tfpv/diagnostic.py` |
| Recommendation Engine | `tfpv/recommend.py`, `tfpv/knowledge.py` |
| Reporting Engine | `tfpv/report/` |
| Orchestration, CLI, API | `tfpv/pipeline.py`, `tfpv/cli.py`, `tfpv/server.py` |
| Sécurité d'exécution | `tfpv/runner.py` (liste blanche), `tfpv/redact.py` (secrets) |

## 3. Arborescence

```
terraform-preplan-validator/
├── pyproject.toml            # paquet « terraform-preplan-validator », commande « tfpv », zéro dépendance
├── README.md                 # installation, utilisation, CI/CD, limites
├── docs/ARCHITECTURE.md · docs/RULES.md · docs/examples/ (rapports réels : txt, json, html, xml)
├── tfpv/
│   ├── cli.py · pipeline.py · server.py · config.py · logs.py
│   ├── models.py             # contrats entre composants
│   ├── scanner.py · workspace.py · runner.py · tools.py · redact.py
│   ├── knowledge.py · recommend.py · diagnostic.py
│   ├── hcl/ (lexer.py, parser.py, expr.py, types.py)
│   ├── engines/ (base.py, native.py, tflint.py, checkov.py, aws/{static,external}.py)
│   └── report/ (text.py, html.py, junit.py)
└── tests/
    ├── fixtures/ (valid_basic, invalid_aws, syntax_error, module_missing, modules_local, secrets, user_example, captured/)
    ├── unit/ (58 tests : lecteur HCL, scanner, règles AWS, adaptateurs de moteurs, diagnostic, sécurité, CLI, API, AWS CLI factice)
    └── integration/ (8 tests avec les vrais terraform, tflint + AWS, checkov)

react-blocks/src/components/devops/TerraformPrePlan.jsx   # le bouton / l'écran
react-blocks/src/lib/tfpv/client.js                        # client du moteur, filtres, export HTML
```

## 4. Interfaces entre composants (`tfpv/models.py`)

* **`EngineContext`** (entrée de chaque moteur) : racine, `Project` analysé, `ScanOptions`, `Runner`, outils détectés, dossier temporaire, données partagées.
* **Moteur** : `run(ctx) -> CheckRun` (ou un tuple de `CheckRun`). Un moteur ne lève jamais d'exception vers le pipeline : une erreur devient `status="error"` avec une raison.
* **`CheckRun`** : `id`, `name`, `engine`, `tier` (`static` · `providers` · `aws`), `required`, `status` (`passed` · `failed` · `skipped` · `error`), `reason`, `passed_count`, `not_evaluated`, `partial`, `findings: list[RawFinding]`.
* **`RawFinding`** (sortie brute d'un moteur) : `engine`, `engine_rule`, `message`, `file`, `line`, `resource`, `attribute`, `value`, `engine_severity`, `rule_id` facultatif, `fallback_for` (contrôle Terraform qui remplace ce constat quand il a tourné), `extra`.
* **`Finding`** (normalisé, dans le rapport) : identifiant stable, `rule_id`, `title`, `severity` (CRITICAL/HIGH/MEDIUM/LOW), `category`, `blocking`, `fails_at` (init/validate/plan/apply), `file`, `line`, `resource`, `attribute`, `value` (masquée si secrète), `description`, `cause`, `recommendation`, `fix`, `references`, `engines`, `engine_rules`, `message`, `tier`, `confidence`, `snippet`.
* **`Report`** (`schema_version` 1.0) : `status`, `status_reason`, `summary`, `environment`, `checks`, `inventory`, `findings`, `suppressed`, `notes`, `redaction`. C'est le **contrat** entre la CLI, l'API et l'application React.
* **Progression** : événements `{step, index, total, label, state, percent}` pour les 7 étapes.
* **API locale** : `GET /api/health` · `POST /api/scans` `{source: {type: "path"|"files", ...}, options}` · `GET /api/scans/<id>` · `POST /api/scans/<id>/rerun` · `GET /api/scans/<id>/report.html`.

## 5. Workflow

1. Dossier fourni (chemin, dossier envoyé par la page, ou CI) → 2. détection des `.tf`/`.tfvars` (hors `.terraform`, `.git`, états) → 3. analyse des modules, providers, variables, ressources (inventaire) → 4. `fmt -check`, `init -backend=false`, `validate` → 5. TFLint → 6. validateur AWS et Checkov (4 à 6 en parallèle) → 7. centralisation → 8. rapport → 9. corrections proposées dans chaque constat → 10. relance : bouton « Relancer après correction », `POST /rerun`, ou `tfpv scan --watch`. **`plan` et `apply` ne sont jamais lancés** (liste blanche de l'exécuteur, testée).

## 6. Niveaux de contrôle

| Contrôle | Niveau | Besoin |
|---|---|---|
| Scanner tfpv, `terraform fmt -check`, Checkov, validateur AWS statique, TFLint (règles hors *deep check*) | `static` | fichiers seulement (le ruleset AWS de TFLint s'installe une fois avec `tflint --init`) |
| `terraform init -backend=false`, `terraform validate` | `providers` | registre Terraform ou miroir de providers (`--offline` les saute → INCOMPLETE) |
| Contrôles API AWS (`--aws-checks`), *deep check* TFLint | `aws` | identifiants AWS, appels en lecture seule ; facultatif |

## 7. Ce qui a été mesuré (laboratoire, terraform 1.17.2, provider AWS 6.73.0)

Un `terraform plan` de laboratoire, avec de faux identifiants, a servi **uniquement** à vérifier la classification ; l'outil ne lance jamais `plan`.

* **Échec au plan**, non vu par `validate`, TFLint ni Checkov : `No value for required variable`, `Invalid value for input variable` (tfvars), `'iops' must not be set when 'type' is 'st1'`, idem pour `gp2`, `'iops' must be set when 'type' is 'io1'`, `'throughput' must not be set when 'type' is 'gp2'`.
* **Plan réussi** (14 ressources) malgré : `t3.invalid` (vu par TFLint seulement), sous-réseau hors VPC, sous-réseaux qui se chevauchent, ports inversés, protocole `-1` avec des ports, AMI `ami-xyz`, principal `ec2.amazon.com`, `max_allocated_storage < allocated_storage`, `multi_az` + `availability_zone`, `iops` avec `gp2` en RDS. Ces erreurs sont classées « échec à l'apply » d'après la documentation des API AWS ; **non vérifié contre un vrai compte AWS** (pas d'identifiants dans l'environnement de travail).

## 8. Extensibilité

* **Azure / GCP** : activer `tflint-ruleset-azurerm` / `tflint-ruleset-google` dans la configuration TFLint, ajouter les correspondances Checkov dans `knowledge.py`, et un module `engines/azure/` sur le modèle de `engines/aws/static.py` (les règles reçoivent les instances de modules déjà évaluées).
* **Nouvelle règle** : une entrée `_r(...)` dans `knowledge.py` (texte, gravité, blocage) + une méthode dans `_Rules` + un test.
* **Nouveau moteur** : une fonction `run(ctx) -> CheckRun` et son ajout dans `pipeline.py`.

## 9. Sécurité

Exécuteur à liste blanche (jamais de shell), copie fantôme, masquage des secrets (variables `sensitive`, arguments `password`/`secret`/`token`…, clés AWS, clés privées, jetons GitHub/GitLab/Slack, JWT) dans les rapports **et** les journaux, Checkov en `--compact --skip-download` (aucun extrait de code ni appel réseau de sa part). API locale : écoute sur 127.0.0.1, jeton aléatoire comparé en temps constant, liste d'origines, contrôle de l'en-tête `Host` (anti DNS-rebinding), en-tête *Private Network Access*, chemins limités à `--root`, envois limités (25 Mo, 3 000 fichiers, noms nettoyés), effacés après l'analyse.

## 10. Risques résiduels

* Le lecteur HCL de tfpv n'évalue ni les expressions `for`, ni les blocs `dynamic`, ni les ressources avec `count`/`for_each` : ces cas sont comptés « non évaluables » (pas de faux positif, mais pas de détection non plus).
* La liste des types d'instance de TFLint dépend de la version du ruleset AWS (épinglée à 0.50.0) : un type très récent peut être signalé à tort. La recommandation donne la commande AWS pour le vérifier, et `--aws-checks` le confirme.
* Depuis la page publiée sur GitHub Pages, l'accès à `http://127.0.0.1` dépend du navigateur : Chrome peut demander l'autorisation « réseau local », et Safari peut bloquer. Testé ici depuis l'aperçu local (`http://localhost:4173`). En cas de blocage : `npm run preview` en local, ou import du rapport JSON.
* Non testés ici : OpenTofu, appels réels à l'API AWS (testés avec un faux AWS CLI), *deep check* TFLint, Windows et macOS.
