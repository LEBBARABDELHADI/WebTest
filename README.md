# WebTest

- `react-blocks/` : application React Blocs (GitHub Pages).
  Outils DevOps › « 🛡️ Terraform · TFLint » : validation Terraform avant `plan`, entièrement dans l'application (moteur `react-blocks/src/lib/tfpv/moteur`).
  Outils DevOps › « 🧮 Query Generator » : requêtes jq et JMESPath générées depuis un JSON (par l'exemple, par description FR/EN ou en mode guidé), exécutées par les vrais moteurs dans le navigateur et vérifiées — voir [react-blocks/src/lib/querygen/README.md](react-blocks/src/lib/querygen/README.md).
  Même outil, mode « 🔤 Texte → Regex » : une regex générée depuis une description FR/EN ou des exemples, vérifiée par exécution, expliquée, réécrite pour PCRE / Python / POSIX ERE / Go, et testable sur un texte — voir [react-blocks/src/lib/regexgen/README.md](react-blocks/src/lib/regexgen/README.md).
  Outils DevOps › « 🔑 Règle IAM » : politiques IAM AWS (identité, ressource, approbation, plafond, SCP) décrites en FR/EN, construites visuellement ou collées en JSON, validées avec les données IAM d'AWS, simulées (tests générés + requête libre) et exportées en Terraform / CloudFormation / AWS CLI — voir [react-blocks/src/lib/iam/README.md](react-blocks/src/lib/iam/README.md).
  Accueil › « Learning Jenkins » : formation Jenkins en anglais (13 modules + Lab 0), avec de vraies captures d'un Jenkins 2.580.2 LTS lancé en local, des TP corrigés, des quiz et des checklists — voir [react-blocks/src/lib/jenkins/README.md](react-blocks/src/lib/jenkins/README.md).
- `terraform-preplan-validator/` : base de connaissances et données de référence de cet outil, et moteur CLI facultatif pour la CI — voir son [README](terraform-preplan-validator/README.md).
