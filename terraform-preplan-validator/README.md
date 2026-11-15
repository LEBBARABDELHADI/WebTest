# Terraform Pre-Plan Validator (tfpv)

Valide une configuration Terraform **avant** `terraform plan`. Il détecte :
- les erreurs de syntaxe ;
- les ressources et valeurs AWS invalides ;
- les variables manquantes ou mal typées ;
- les références inexistantes ;
- les incohérences réseau (CIDR, sous-réseaux, groupes de sécurité), de stockage (EBS, RDS) et d'IAM ;
- les risques de sécurité.

Chaque constat est expliqué : règle, fichier, ligne, ressource, valeur, cause probable, gravité, correction et documentation.

Deux moteurs partagent la même base de connaissances (115 règles) et le même format de rapport :

| | Où | Pour qui |
|---|---|---|
| **Moteur intégré** (`react-blocks/src/lib/tfpv/moteur`) | Dans React Blocs, bouton **🛡️ Terraform · TFLint** de la page *Outils DevOps* | **Utilisation normale** : rien à installer, aucun fichier envoyé, téléphone et PC |
| Moteur CLI (ce dossier, Python) | Pipeline CI/CD | Facultatif : exécute les vrais binaires `terraform`, `tflint` et `checkov` |

## Utiliser l'outil dans React Blocs (rien à installer)

Ouvre *Outils DevOps* › 🧰 Boîte à outils › **🛡️ Terraform · TFLint**.

**1 · Projet Terraform**, au choix :
- **📁 Dossier ou fichiers** :
  - choisis un dossier ou des fichiers `.tf` / `.tfvars`, une archive `.zip`, ou dépose-les dans la zone ;
  - sur Chrome et Edge pour ordinateur, un dossier ouvert avec « Choisir un dossier » est **relu à chaque relance** ;
  - `.terraform`, `.git` et les fichiers d'état sont ignorés.
- **✍️ Coller du code** : un `main.tf` (et, si besoin, un `terraform.tfvars`). C'est pratique sur téléphone.
- **🧪 Essayer un exemple** : un projet volontairement fautif.
- **📄 Ouvrir un rapport** : relire un rapport JSON exporté.

**2 · Réglages** :
- seuil d'échec ;
- fichiers de variables utilisés au plan (équivalent de `-var-file`) ;
- variables fournies par la CI (`TF_VAR_…`), pour ne pas les signaler comme manquantes.

**3 · ▶ Analyser.** Une barre de progression suit les étapes. Les résultats s'affichent fichier par fichier :
- filtres de gravité et « bloquants seulement » ;
- code concerné, ligne surlignée ;
- explication, cause probable, correction, correctif à copier et documentation.

Corrige, puis **🔁 Relancer**. Exports possibles : **JSON**, **HTML** (autonome) et **texte** (format du rapport demandé).

**Ce que vérifie le moteur intégré**, à partir des **références des vrais outils**, embarquées dans l'application :

| Contrôle | Référence | Comparaison avec l'outil réel (fichiers `tests/fixtures`) |
|---|---|---|
| Schéma des providers : type de ressource inconnu, argument inattendu ou manquant, attribut calculé renseigné, bloc inattendu ou trop nombreux, type de valeur, attribut référencé inexistant | Schéma officiel de `hashicorp/aws` **6.73.0** (`terraform providers schema -json`) + random, null, tls, local, archive, time, http, external, cloudinit | `schema_errors` : les **7** erreurs de `terraform validate` 1.17.2, aux mêmes lignes, **+2** qu'il ne remonte qu'au passage suivant (vérifié) |
| Valeurs AWS : 1 364 règles générées depuis l'API AWS, types d'instance et classes RDS, moteurs, runtimes Lambda obsolètes, cibles de routes, noms de buckets | Données de **tflint-ruleset-aws 0.50.0** | `tflint_rules` : les **9** constats de TFLint 0.66.0 |
| Variables (valeur absente, type des `.tfvars`), références, modules, providers, doublons, sorties sensibles | Règles tfpv | Erreurs que `terraform plan` remonte (vérifié en laboratoire), non vues par `validate` |
| Cohérence AWS : CIDR, sous-réseau hors VPC ou chevauchement, ports, EBS, RDS, principaux IAM, AMI | Règles tfpv | Échecs à l'apply, non vus par `validate`, TFLint ni Checkov |
| Sécurité : S3 public ou non chiffré, ports ouverts à Internet, IAM `*`, RDS, EBS, IMDSv2, CloudTrail, EKS, secrets en clair… | Sélection de politiques **équivalentes à Checkov** (ID `CKV_*` conservés ; `#checkov:skip` respecté) | `valid_basic` validé comme avec Checkov 3.4.5 ; `invalid_aws` : les problèmes majeurs vus par Checkov (IAM administrateur, SSH ouvert, S3 sans blocage public, RDS et EBS non chiffrés, IMDSv1) sont retrouvés, pas toutes ses règles de bonnes pratiques |
| Formatage | Approximation prudente de `terraform fmt -check` | `unformatted.tf` détecté |

**Ce qu'il ne peut pas vérifier**, sans exécuter Terraform ni accéder à AWS :
- les valeurs connues seulement à l'apply ;
- l'existence réelle des AMI ou ressources dans le compte ;
- les validations internes du provider non décrites dans le schéma ;
- le contenu des **modules distants** (registre, Git) ;
- les politiques Checkov hors de la sélection.

Si le projet contient un module distant, ou un provider dont le schéma n'est pas embarqué, le statut est **INCOMPLETE** : jamais « validé ».

Statuts :

| Statut | Signification |
|---|---|
| ✅ PASSED | Tous les contrôles de l'outil ont tourné, sans constat |
| 🟡 PASSED_WITH_WARNINGS | Rien de bloquant ; des avertissements sont à revoir |
| ⛔ FAILED | Au moins un constat bloquant, ou de gravité ≥ seuil |
| 🟣 INCOMPLETE | Une partie du projet n'a pas pu être analysée |

Pour ignorer un constat, ajoute un commentaire **avec une raison** :
- tfpv : `# tfpv:ignore RÈGLE -- raison`, sur la ligne ou la ligne précédente ;
- TFLint : `# tflint-ignore: règle` ;
- Checkov : `#checkov:skip=CKV_…:raison`.

### Mettre à jour les données de référence

```bash
# dans un dossier avec hashicorp/aws (et un autre avec les petits providers)
terraform init -backend=false && terraform providers schema -json > aws-schema.json
python3 terraform-preplan-validator/outils/donnees_navigateur.py \
  --aws-schema aws-schema.json --aws-version <version> --other-schemas autres-schema.json \
  --tflint-aws ~/go/pkg/mod/github.com/terraform-linters/tflint-ruleset-aws@v<version>
cd react-blocks && npm run test:tfpv
```

Le script écrit :
- `react-blocks/public/tfpv/` : schémas et règles TFLint, chargés à la demande ;
- `react-blocks/src/lib/tfpv/donnees/` : base de connaissances et versions.

## Moteur CLI pour la CI (facultatif)

Ce dossier contient aussi un moteur en Python, sans dépendance. Il lance les **vrais** outils :
- `terraform fmt -check`, `init -backend=false` (sur une copie temporaire) et `validate` ;
- TFLint avec les rulesets terraform et AWS ;
- Checkov.

Il y ajoute les mêmes contrôles tfpv. Il ne lance jamais `plan` ni `apply` et ne modifie aucun fichier.

```bash
pip install ./terraform-preplan-validator      # Python ≥ 3.11 ; terraform, tflint, checkov dans le PATH
tfpv doctor
tfpv scan infra/ -f text -f json -f html -f junit -o reports/
```

| Code de sortie | Statut |
|---|---|
| 0 | `PASSED` ou `PASSED_WITH_WARNINGS` |
| 1 | `FAILED` |
| 2 | `INCOMPLETE` (un contrôle requis n'a pas tourné) |
| 3 | erreur d'utilisation |

Options utiles :
- `--var-file`, `--fail-on`, `--offline` ;
- `--aws-checks` : AMI, type d'instance et version RDS via l'AWS CLI, en lecture seule ;
- `--watch`, `--skip`, `--ignore` ;
- fichier de configuration `.tfpv.toml` (`fail_on`, `var_files`, `[ignore] rules`, `[severity]`, `[tflint]`, `[checkov] skip_checks`).

Exemple GitLab CI, à adapter : il n'a pas été exécuté dans un vrai pipeline.

```yaml
terraform-preplan:
  image: python:3.12-slim
  variables:
    TFLINT_PLUGIN_DIR: "$CI_PROJECT_DIR/.tflint.d/plugins"
  before_script:
    - apt-get update && apt-get install -y --no-install-recommends curl unzip git
    - curl -fsSLo tf.zip https://releases.hashicorp.com/terraform/1.17.2/terraform_1.17.2_linux_amd64.zip && unzip tf.zip -d /usr/local/bin
    - curl -fsSL https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash
    - pip install pipx && pipx install checkov && export PATH="$HOME/.local/bin:$PATH"
    - pip install ./terraform-preplan-validator
  script:
    - tfpv scan infra/ -f text -f json -f junit -o reports/
  artifacts:
    when: always
    paths: [reports/]
    reports:
      junit: reports/tfpv-report.xml
```

Un rapport JSON produit en CI peut être rouvert dans l'outil (📄 Ouvrir un rapport). Exemples de rapports réels : [`docs/examples/`](docs/examples/). Architecture et choix techniques : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Catalogue des règles : [`docs/RULES.md`](docs/RULES.md).

## Tests

```bash
cd react-blocks && npm run test:tfpv      # moteur intégré : 12 tests, attentes calées sur les vrais outils
pytest tests/unit                          # moteur CLI : 56 tests, sans outil externe
pytest -m integration                      # 8 tests avec terraform, tflint (+ AWS) et checkov installés
```

L'écran a été testé avec Playwright sur téléphone (375 px) et PC (1366 px) :
- l'exemple, le code collé puis corrigé, une archive `.zip`, un dossier ;
- la relecture d'un dossier à la relance ;
- les exports ;
- aucune requête en dehors du site de l'application.
