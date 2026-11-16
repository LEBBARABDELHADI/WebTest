# WebTest

- `react-blocks/` : application React Blocs (GitHub Pages).
  Outils DevOps › « 🛡️ Terraform · TFLint » : validation Terraform avant `plan`, entièrement dans l'application (moteur `react-blocks/src/lib/tfpv/moteur`).
  Outils DevOps › « 🧮 Query Generator » : requêtes jq et JMESPath générées depuis un JSON (par l'exemple, par description FR/EN ou en mode guidé), exécutées par les vrais moteurs dans le navigateur et vérifiées — voir [react-blocks/src/lib/querygen/README.md](react-blocks/src/lib/querygen/README.md).
  Même outil, mode « 🔤 Texte → Regex » : une regex générée depuis une description FR/EN ou des exemples, vérifiée par exécution, expliquée, réécrite pour PCRE / Python / POSIX ERE / Go, et testable sur un texte — voir [react-blocks/src/lib/regexgen/README.md](react-blocks/src/lib/regexgen/README.md).
- `terraform-preplan-validator/` : base de connaissances et données de référence de cet outil, et moteur CLI facultatif pour la CI — voir son [README](terraform-preplan-validator/README.md).
