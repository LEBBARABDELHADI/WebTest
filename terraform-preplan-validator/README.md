# Terraform Pre-Plan Validator (tfpv)

Valide une configuration Terraform **avant** `terraform plan` : erreurs de syntaxe, ressources et valeurs AWS invalides, variables manquantes ou mal typées, références inexistantes, incohérences réseau (CIDR, sous-réseaux, groupes de sécurité), stockage (EBS, RDS), IAM, et risques de sécurité. Chaque constat est expliqué : règle, fichier, ligne, ressource, valeur, cause probable, gravité, correction et documentation.

* tfpv **orchestre les vrais outils** (`terraform fmt/init/validate`, TFLint avec les rulesets terraform et AWS, Checkov) et ajoute ce qu'ils ne vérifient pas. Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
* Il **ne lance jamais** `terraform plan` ni `apply`, et **ne modifie aucun fichier** : `init` tourne sur une copie temporaire.
* Il **n'annonce jamais un succès** si un contrôle n'a pas pu tourner. Le statut est alors `INCOMPLETE`.
* Les secrets sont masqués dans les rapports et les journaux.
* Les contrôles purement statiques ne demandent **aucun identifiant AWS**.

Dans React Blocs, c'est le bouton **🛡️ Terraform · TFLint** de la page *Outils DevOps*.

## Installation

Prérequis : Python ≥ 3.11 et, dans le `PATH` :

| Outil | Rôle | Installation |
|---|---|---|
| `terraform` (≥ 1.6) | fmt, init, validate | <https://developer.hashicorp.com/terraform/install> |
| `tflint` (≥ 0.50) | linting terraform + AWS | <https://github.com/terraform-linters/tflint> ; le ruleset AWS est téléchargé par `tflint --init` (tfpv le lance sauf avec `--offline`) |
| `checkov` | sécurité | `pipx install checkov` (dans son propre environnement) |
| `aws` (facultatif) | contrôles via l'API AWS (`--aws-checks`) | AWS CLI v2 |

```bash
pip install ./terraform-preplan-validator      # ou : pipx install ./terraform-preplan-validator
tfpv doctor                                    # moteurs détectés et versions
```

tfpv n'a **aucune dépendance Python** : il n'utilise que la bibliothèque standard.

## Utilisation

```bash
tfpv scan infra/                               # rapport texte, code de sortie 0/1/2
tfpv scan infra/ -f json -f html -f junit -o reports/
tfpv scan infra/ --var-file env/prod.tfvars --fail-on MEDIUM
tfpv scan infra/ --offline                     # sans réseau : pas d'init/validate → INCOMPLETE
tfpv scan infra/ --aws-checks --aws-profile lecture   # + AMI, type d'instance offert, version RDS
tfpv scan infra/ --watch                       # relance à chaque modification
tfpv rules                                     # catalogue des règles (docs/RULES.md)
```

| Code de sortie | Statut |
|---|---|
| 0 | `PASSED` ou `PASSED_WITH_WARNINGS` |
| 1 | `FAILED` : au moins un constat bloquant, ou de gravité ≥ `--fail-on` (HIGH par défaut) |
| 2 | `INCOMPLETE` : un contrôle requis n'a pas tourné. Avec `--allow-incomplete`, le code devient 0 mais le statut reste `INCOMPLETE` |
| 3 | erreur d'utilisation ou de configuration |

### Configuration `.tfpv.toml` (facultative, à la racine du projet)

```toml
fail_on = "HIGH"
var_files = ["env/prod.tfvars"]
[ignore]
rules = ["S3_OPTIONAL_HARDENING", "CKV2_AWS_62"]   # règle tfpv ou identifiant du moteur
[severity]
VPC_FLOW_LOGS = "MEDIUM"
[tflint]
config = "auto"            # auto (.tflint.hcl du projet s'il existe) | project | tfpv | chemin
aws_ruleset_version = "0.50.0"
[checkov]
skip_checks = ["CKV_AWS_144"]
```

Pour ignorer un constat dans le code :

* tfpv : `# tfpv:ignore NET_SUBNET_OVERLAP -- raison`, sur la ligne ou la ligne précédente ;
* TFLint : `# tflint-ignore: règle` ;
* Checkov : `#checkov:skip=ID:raison`, dans le bloc.

Les constats ignorés restent listés dans le rapport, avec leur raison.

## Bouton « 🛡️ Terraform · TFLint » (React Blocs)

```bash
tfpv serve --root ~/infra
```

La commande affiche un **jeton** et un **lien** qui ouvre la page déjà connectée. Le jeton est placé dans le fragment `#` de l'adresse, qui n'est jamais envoyé à un serveur ; la page le retire de l'adresse puis le garde uniquement pour l'onglet.

Une fois connectée, la page permet de :
* choisir un **dossier** (ses fichiers sont envoyés uniquement à `127.0.0.1`) ou un **chemin** sous `--root` ;
* lancer le **Scan** et suivre la progression étape par étape ;
* lire les résultats par fichier, filtrer par gravité ou sur les seuls bloquants, voir le code concerné (ligne surlignée) et les recommandations ;
* **exporter** en JSON ou HTML, et **relancer** après correction.

Sur téléphone, ou sans moteur, la page **ouvre un rapport JSON** produit en CI. Un exemple réel est intégré.

Sécurité de l'API : écoute sur 127.0.0.1 uniquement, jeton obligatoire, liste d'origines (`--allow-origin` pour en ajouter), contrôle de l'en-tête `Host`, chemins limités à `--root`. Depuis le site publié sur GitHub Pages, le navigateur peut demander l'autorisation d'accéder au « réseau local » ; Safari peut bloquer. Dans ce cas, utiliser l'application en local (`npm run preview`) ou l'import de rapport.

## CI/CD

**Exemples à adapter** : ils n'ont pas été exécutés dans un vrai pipeline. Les commandes `tfpv` qu'ils contiennent sont celles testées localement.

GitLab CI :

```yaml
terraform-preplan:
  image: python:3.12-slim
  variables:
    TFLINT_PLUGIN_DIR: "$CI_PROJECT_DIR/.tflint.d/plugins"   # mis en cache ci-dessous
  before_script:
    - apt-get update && apt-get install -y --no-install-recommends curl unzip git
    - curl -fsSLo tf.zip https://releases.hashicorp.com/terraform/1.17.2/terraform_1.17.2_linux_amd64.zip && unzip tf.zip -d /usr/local/bin
    - curl -fsSL https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash
    - pip install pipx && pipx install checkov && export PATH="$HOME/.local/bin:$PATH"
    - pip install ./terraform-preplan-validator
  script:
    - tfpv scan infra/ -f text -f json -f html -f junit -o reports/
  artifacts:
    when: always
    paths: [reports/]
    reports:
      junit: reports/tfpv-report.xml
  cache:
    paths: [.tflint.d/plugins]
```

`tflint --init` télécharge le ruleset AWS depuis GitHub : en CI, définir `GITHUB_TOKEN` évite la limite de débit de l'API GitHub.

GitHub Actions :

```yaml
- uses: hashicorp/setup-terraform@v3
- uses: terraform-linters/setup-tflint@v4
- run: pipx install checkov && pip install ./terraform-preplan-validator
- run: tfpv scan infra/ -f text -f junit -o reports/
- uses: actions/upload-artifact@v4
  if: always()
  with: { name: tfpv-report, path: reports/ }
```

## Rapport

Rapports réels générés sur les fixtures : [`docs/examples/`](docs/examples/) (texte, JSON, HTML, JUnit).

Extrait, pour l'exemple de la demande (`instance_type = "t3.invalid"`) :

```
[HIGH] AWS_INVALID_INSTANCE_TYPE  (blocking: fails at apply)

File: main.tf
Line: 3
Resource: aws_instance.example
Current value: t3.invalid
Detected by: tflint (aws_instance_invalid_type)

Description:
The specified EC2 instance type is not recognized. ("t3.invalid" is an invalid value as instance_type)

Recommendation:
Verify that the instance type exists in the selected AWS region and is supported by the selected architecture and AMI: ...
```

Le résumé compte :
* les contrôles **réussis** que les moteurs publient : étapes Terraform, fichiers formatés, contrôles Checkov réussis, évaluations du validateur AWS. TFLint ne publie que ses échecs : un ruleset sans constat compte pour 1 ;
* les **échecs** : constats bloquants ou de gravité ≥ seuil ;
* les **avertissements** : les autres constats ;
* les contrôles **non exécutés** ;
* les évaluations **non évaluables** statiquement.

## Tests

```bash
pip install pytest
pytest tests/unit                  # 58 tests, sans aucun outil externe (sorties réelles capturées)
pytest -m integration              # 8 tests avec terraform, tflint (+ ruleset AWS) et checkov installés
```

Testé avec :
* Terraform 1.17.2, provider AWS 6.73.0 ;
* TFLint 0.66.0, ruleset terraform 0.17.0 et ruleset AWS 0.50.0 ;
* Checkov 3.4.5 ;
* Python 3.11, sous Linux.

L'écran React a été testé sur téléphone (375 px) et PC (1366 px) avec Playwright et un vrai moteur `tfpv serve`.

**Non testé** : OpenTofu (`--tf-bin tofu`), appels réels à l'API AWS (seulement avec un faux AWS CLI), *deep check* TFLint, Windows et macOS.
