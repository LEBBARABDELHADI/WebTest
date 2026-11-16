# Mode « Texte → Regex » du Query Generator

React Blocs › *Outils DevOps* › **🧮 Query Generator** › onglet **🔤 Texte → Regex**.
Lien direct : `#/outils/pro?outil=query&mode=regex`.

Vous décrivez en texte (français ou anglais) ce qu'il faut reconnaître, ou vous donnez quelques exemples. L'outil :
- génère une **regex**, localement ;
- l'**exécute** pour la vérifier ;
- l'explique ;
- l'écrit pour d'autres outils ;
- vous laisse la **tester en bas de l'écran**, sur votre propre texte.

Rien n'est envoyé : tout se passe dans le navigateur, dans un Web Worker.

## Utilisation

**1 · Décrivez ce qu'il faut reconnaître**, avec des mots ou avec des exemples :

| Vous écrivez | Vous obtenez |
|---|---|
| `adresse e-mail valide` | `^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$` |
| `3 lettres majuscules suivies d'un tiret puis 4 chiffres` | `^[A-Z]{3}-\d{4}$` |
| `mot de passe d'au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial` | `^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$` |
| `lignes contenant ERROR mais pas DEBUG` | `^(?=.*ERROR)(?!.*DEBUG).*$` (drapeaux `gm`) |
| `date au format jj/mm/aaaa` | `^(?:0[1-9]|[12]\d|3[01])/(?:0[1-9]|1[0-2])/\d{4}$` |
| `extraire les adresses IP d'un log` | IPv4 bornée à 0-255, avec `\b` et le drapeau `g` |
| `comme AB-1234, XY-9876` | `^[A-Z]{2}-\d{4}$` (déduit des exemples) |
| `starts with a capital letter followed by lowercase letters` | `^[A-Z][a-z]+$` |

Options :
- **Cible** : valider une chaîne entière (`^…$`), trouver dans un texte (limites de mot, drapeau `g`) ou sélectionner des lignes (drapeau `m`). Par défaut, elle est choisie d'après les mots de la description et indiquée dans les hypothèses.
- **Insensible à la casse** : drapeau `i`.
- **Groupes de capture** : groupes nommés quand le format les connaît (`utilisateur`/`domaine`, `jour`/`mois`/`annee`…).
- **Exemples qui doivent correspondre** : ils sont exécutés sur la regex. Un exemple non reconnu est signalé, et une correction déduite des exemples est proposée.

**2 · Regex** :
- Le motif est **modifiable**, avec coloration, et les drapeaux se basculent d'un clic.
- **💡 Expliquer** détaille chaque élément en français, à partir du motif *actuel*, y compris s'il est modifié à la main.
- Les erreurs de syntaxe sont données en français avec leur position.
- Les constructions à risque sont signalées : quantificateurs imbriqués (`(a+)+`), alternatives qui se chevauchent (`(a|ab)*`).
- Le panneau **Autres langages et outils** réécrit la regex pour JavaScript, PCRE (`grep -P`), Python, POSIX ERE (`grep -E`, `sed -E`) et Go/RE2 (avec un exemple de validation de variable Terraform). Ce qu'un dialecte ne sait pas exprimer est expliqué (lookahead en RE2 ou ERE, `\p{…}` en Python…), jamais écrit de travers.

**3 · Tester la regex** (en bas) :
- Collez un texte : les correspondances sont **surlignées**, avec ligne, colonne et groupes.
- « Chaque ligne séparément » donne un verdict par ligne ; « Texte entier » cherche dans l'ensemble.
- **💡 Insérer des exemples** remplit la zone avec des chaînes valides et invalides.

## Auto-vérification : ce qui est exécuté

Chaque regex générée est exécutée par le moteur JavaScript du navigateur, et le résultat de chaque contrôle est affiché :
- le motif est accepté par le moteur ;
- les **exemples valides** et **invalides** du format (catalogue) sont acceptés et refusés comme prévu ;
- pour une recherche dans un texte, chaque exemple valide est **retrouvé exactement** dans une phrase ;
- les **exemples générés depuis le motif** sont tous reconnus ;
- pour les motifs à assertions `(?=…)`, des exemples sont construits d'après les conditions. Le motif doit être satisfaisable, et le contrôle est « non concluant » (jamais vert) si la construction échoue ;
- **sélectivité** : les variantes abîmées d'un exemple sont refusées ;
- vos exemples fournis.

Une regex « vérifiée » reconnaît ses exemples ; cela ne prouve pas qu'elle couvre tous vos cas, d'où la zone de test.

## Architecture

```
GenerateurRegex.jsx ──(postMessage, délai 3 s)──► worker.js ► api.js
ZoneTest · PanneauDialectes · EditeurCode (coloration regex, surlignage)

moteur.js     générerRegex · analyserMotif  (construction d'un candidat, vérification, variantes de dialectes)
├─ langue.js        description FR/EN : classes, symboles, quantités, conditions, options ; « mot X », « .fr », « // » collés
├─ assemblage.js    cibles valider / trouver / lignes ; conditions → assertions ; bords de mot ; alternatives de formats
├─ catalogue.js     61 formats (regex + variante à groupes nommés + exemples valides/invalides) ; formats.js : jj/mm/aaaa…
├─ generaliser.js   exemples → format du catalogue (exécuté) ou motif champ par champ
├─ ast.js           arbre d'une regex + émission par dialecte (js, pcre, python, ere, go)
├─ parse.js         lecture d'une regex JavaScript → arbre, erreurs en français avec position
├─ explication.js   explication pas à pas, constructions à risque ; exemples.js : chaînes générées et abîmées
└─ testeur.js       test sur un texte : correspondances, lignes, colonnes, groupes
```

Le **même arbre** est écrit pour chaque dialecte ; les dialectes ne sont pas des traductions de texte les uns des autres.

## Ce qui a été vérifié

- `npm run test:regexgen` : **18 tests** du moteur.
  - Lecture et réécriture des motifs, comparées sur 60 000 chaînes.
  - Erreurs, explications, testeur.
  - Les **61 formats** du catalogue, sur leurs exemples valides et invalides, en texte entier et en recherche.
  - Environ **70 descriptions** françaises et anglaises, chacune exécutée.
  - Exemples, options, cas limites.
- Comparaison avec les **vrais moteurs** (grep -E, grep -P, Python `re`, Go `regexp`/RE2) : **362 comparaisons**, toutes identiques au verdict de JavaScript.
  - Les 61 formats réécrits pour 4 dialectes.
  - Les motifs issus de 19 descriptions.
  - Les motifs écrits à la main.
  - Ce banc a déjà trouvé un vrai défaut, corrigé : des classes POSIX élargies par erreur (`+--.`).
  - Les tests sont ignorés, et non inventés, si un outil est absent de la machine.
- Playwright, sur téléphone (375 px) et PC (1366 px) :
  - génération, test avec surlignage, motif modifié, motif invalide ;
  - dialectes et copie de code, exemples fournis, options ;
  - **motif à backtracking catastrophique interrompu au bout de 3 s**, avec reprise ;
  - bascule JSON ↔ Regex ;
  - aucune requête réseau hors du site, pas de débordement horizontal.

## Limites connues

- **Ce n'est pas un modèle de langage.** Les descriptions sont interprétées par des règles locales. Une description floue ou absente de ce vocabulaire n'est pas devinée : l'outil l'explique et propose des exemples de formulations.
  - Dans « nom de variable en majuscules avec underscores », le nom de format et les adjectifs peuvent se redoubler.
  - Pour « les nombres entiers négatifs ou positifs », les mots non utilisés sont listés.
- **Formats du catalogue** : formats courants, pas les spécifications complètes.
  - L'e-mail n'est pas la RFC 5322.
  - Les dates ne connaissent pas les mois de 30 jours ni les années bissextiles.
  - Les clés de contrôle (IBAN, SIRET) ne sont pas vérifiées.
  - Les formats trop généraux pour du texte libre (nom Kubernetes, port, slug…) le signalent.
- **Le test utilise le moteur JavaScript.** Les autres dialectes sont écrits à partir du même arbre : comparés aux vrais outils pendant le développement, mais non exécutés dans le navigateur.
  - Les points de détail diffèrent parfois entre moteurs (`\d` Unicode de Python, `\b` de POSIX).
  - Les classes `[a-z]` de grep dépendent de la locale.
- **Backtracking** : un motif lent est interrompu au bout de 3 s ; il n'est pas corrigé automatiquement, seulement signalé.
- **IA externe : non configurée.** Même règle que le mode JSON : aucune clé d'API dans la page, aucun envoi sans votre accord.
