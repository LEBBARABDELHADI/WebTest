# Query Generator : JSON → jq et JMESPath

L'outil se trouve dans React Blocs › *Outils DevOps* › 🧰 Boîte à outils › **🧮 Query Generator**. Lien direct : `#/outils/pro?outil=query`.

Il fait trois choses :
- il **génère** une requête jq et une requête JMESPath à partir d'un JSON et du résultat voulu ;
- il les **exécute** avec les vrais moteurs : jq 1.8.2 compilé en WebAssembly, et jmespath.js, l'implémentation de référence ;
- il **vérifie** le résultat.

Tout se passe dans le navigateur : le JSON n'est envoyé nulle part.

## Utilisation

**1 · JSON d'entrée**
- Collez un JSON, importez un fichier ou déposez-le dans la zone (25 Mo au plus), ou choisissez un exemple : EC2, pods kubectl, volumes EBS, utilisateurs, objets imbriqués.
- La syntaxe est colorée.
- La validation indique la ligne, la colonne et la cause probable : virgule en trop, apostrophes, clé sans guillemets, commentaire, `True`/`None`… Le bouton « Aller à l'erreur » place le curseur dessus.
- **Formater** et **Compacter** conservent l'écriture exacte des nombres (par exemple `12345678901234567890` ou `1.000`).
- Plusieurs documents à la suite (JSON Lines) : « Réunir dans un tableau » fait l'équivalent de `jq -s`.
- « Structure détectée » liste les collections, y compris imbriquées (`Reservations[].Instances[]`), avec leurs champs et des exemples de valeurs.

**2 · Résultat attendu** : trois façons de dire ce que vous voulez.

| Mode | Principe |
|---|---|
| 📝 Description | En français ou en anglais : « Retourner les instances EC2 en état running avec leur ID et leur type », « Count running instances by instance type », « Je souhaite avoir la valeur de la clé champs ». Chaque rapprochement avec le JSON est affiché comme **hypothèse**. |
| 🧾 JSON attendu | Un exemple du résultat. La synthèse cherche la requête **la plus simple** qui le reproduit **exactement**. Elle combine collection, filtre (jusqu'à 3 conditions), projection éventuellement imbriquée, tri, limite, agrégat et regroupement. Comparaison : exacte, sans tenir compte de l'ordre, ou partielle (l'attendu est un extrait). Le texte brut est accepté : une valeur par ligne, comme `jq -r` ou `--output text`. |
| 🧭 Mode guidé | Sans aucune IA : collection, opération, filtres, champs (renommables), tri et limite, choisis parmi ce que contient le JSON. Les requêtes se mettent à jour à chaque choix. |

**3 · Requêtes générées**
- L'**interprétation** retenue (étapes et hypothèses) est affichée.
- Si plusieurs interprétations reproduisent l'attendu, elles sont toutes listées, avec un avertissement d'ambiguïté.
- Pour **jq** et **JMESPath**, chacun a son éditeur, modifiable, et son statut. Boutons disponibles :
  - 📋 Copier ;
  - ▶ Exécuter ;
  - 💡 Expliquer, étape par étape, y compris une requête modifiée à la main ;
  - ⌨️ Commande : `jq '…' fichier.json`, `aws … --query '…'` ou `jp -f fichier.json '…'`, déjà protégée pour le shell.
- Le résultat s'affiche coloré.
- Si le résultat diffère de l'attendu, l'outil affiche :
  - la **liste des différences**, chemin par chemin : élément manquant ou en trop, valeur, type, ordre ;
  - des **corrections proposées**. Chacune a été exécutée et reproduit l'attendu avant d'être montrée ; « Appliquer » la remplace dans l'éditeur.
- Le **contrôle croisé** vérifie que jq et JMESPath, générés et exécutés séparément, donnent le même résultat.

Statuts d'une requête :

| Statut | Signification |
|---|---|
| ✅ Vérifiée | Exécutée ; résultat identique au résultat attendu fourni |
| ✅ Exécutée | Exécutée ; résultat conforme à l'interprétation (pas d'attendu fourni) |
| ⚠️ Résultat différent | Exécutée ; le résultat diffère (différences et corrections affichées) |
| ❌ Erreur | Syntaxe ou exécution en échec ; message de jq ou de JMESPath |
| 🚫 Non exprimable | Impossible dans ce langage ; la raison est donnée |
| ⏳ Modifiée | Requête modifiée et pas encore exécutée |

Une requête n'est **jamais** affichée comme vérifiée sans avoir été exécutée avec succès.

Une requête jq sans fin (`repeat(1)`…) est arrêtée au bout de 15 s : le Web Worker est relancé et la page reste utilisable.

## Architecture

```
QueryGenerator.jsx ──(postMessage)──► worker.js : jq-wasm (jq 1.8.2, WebAssembly) + jmespath.js
                                          │
moteur.js ── analyse.js     structure : collections (y compris imbriquées), champs, types, null, valeurs, étiquettes AWS Key/Value
          ├─ synthese.js    par l'exemple : projection (clés → champs), filtres exacts, conjonctions, seuils, tri, limite, agrégats, regroupements
          ├─ langue.js      description FR/EN : collection, valeurs (et traductions : disponible → available…), comparaisons, texte,
          │                 existence, négation, booléens, tri, limite, agrégats, « par X », « valeur de la clé X »
          ├─ plan.js        représentation intermédiaire + évaluateur (résultat voulu)
          ├─ genJq.js       générateur jq      ┐ indépendants : chacun suit les idiomes et les pièges de son langage,
          ├─ genJmes.js     générateur JMESPath┘ et n'ajoute une protection (values, []?, map(&…), || '') que si le JSON l'exige
          ├─ executer.js    exécution réelle ; comparer.js (exacte / sans ordre / partielle, différences) ; expliquer.js
          └─ json.js        validation localisée, mise en forme fidèle, coloration
```

Le plan est le pivot. Les requêtes jq et JMESPath en sont générées **séparément**, pas traduites l'une de l'autre. Exemples d'écarts entre les deux langages :
- JMESPath écarte les `null` d'une projection, jq les garde ;
- `max_by` de JMESPath n'accepte que des nombres ;
- JMESPath n'a ni `group_by` ni `unique`.

Le moteur est le même dans les tests Node et dans le navigateur.

## Ce qui a été vérifié

- `npm run test:querygen` : 20 tests, exécutés par le vrai jq et le vrai JMESPath.
  - L'exemple EC2 du cahier des charges donne mot pour mot les deux requêtes attendues, par l'exemple comme par description FR ou EN.
  - Exemples métier : pods `Running` avec nom, namespace et IP, nombre de volumes EBS disponibles, « valeur de la clé champs ».
  - Cas de structure et de données : objets imbriqués, tableaux multiples, filtres multiples, champs absents ou null, résultats vides et agrégations.
  - Projections imbriquées, attendu ≠ obtenu avec correction, erreurs de syntaxe, comparaisons sans ordre et partielle, sortie brute, mode guidé, explications.
- Playwright, sur téléphone (375 px) et PC (1366 px), soit 64 contrôles :
  - génération, exécution, vérification et correction appliquée ;
  - erreur JMESPath, mode guidé, JSON invalide, import ;
  - boucle infinie arrêtée ;
  - copie, débordement horizontal ;
  - **aucune requête réseau en dehors du site**.

- Gros document : un JSON de 7,3 Mo (12 000 instances EC2) a été mesuré sous Node.
  - Analyse : 0,3 s.
  - Génération par description, exécution comprise : 0,4 s.
  - Génération par l'exemple, avec 3 000 lignes attendues : 1,5 s.
  - La requête retrouvée est la même que sur le petit exemple.

## Limites connues

- **Interprétation des descriptions** : ce sont des règles locales, pas un modèle de langage. Elles rapprochent les mots des noms et des valeurs du JSON.
  - Une demande ambiguë produit plusieurs interprétations, ou une explication.
  - Un champ demandé qui n'existe pas produit un refus motivé, pas une requête inventée.
- **Synthèse par l'exemple** :
  - Elle porte sur une collection à la fois. Les champs du parent (par exemple `OwnerId` d'une réservation dans chaque instance) ne sont pas couverts.
  - Elle combine au plus 3 conditions et ne calcule pas de nouvelles valeurs.
  - Un exemple vide, ou trop court pour départager, est signalé.
- **JMESPath standard (et l'AWS CLI)** :
  - Pas de regroupement : la requête énumère les valeurs présentes dans ce JSON, et c'est signalé.
  - Pas de dédoublonnage : déclaré impossible.
  - `<` et `>` sur des chaînes fonctionnent dans jmespath.js, mais pas dans le jmespath Python de l'AWS CLI : c'est signalé.
- **jq** : requêtes écrites avec des idiomes de jq ≥ 1.6, exécutées et vérifiées avec jq 1.8.2.
- **IA externe : non configurée.**
  - Une clé d'API n'est jamais placée dans la page.
  - Brancher un modèle externe demanderait un backend sécurisé qui garde la clé, et le consentement explicite de l'utilisateur avant tout envoi du JSON.
  - Le mode local et le mode guidé fonctionnent sans elle.
