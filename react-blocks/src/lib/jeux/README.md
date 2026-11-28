# Super Plombier — jeu de plateforme rétro (onglet Jeux)

Jeu 2D original (aucun asset, personnage, musique ou niveau d'un jeu existant) : écran logique **256×144 px**, tuiles de **16 px**, rendu pixel-perfect à échelle entière, 3 niveaux, sauvegarde locale.

## Architecture (`src/lib/jeux/`)

| Fichier | Rôle |
|---|---|
| `config.js` | **Toutes** les valeurs réglables : physique (`PHYS`), hitbox, ennemis (`ENNEMIS`), caméra, dimensions de la vue. |
| `moteur.js` | Moteur pur à pas fixe 1/60 s (aucun DOM, testable sous Node) : mouvement, saut variable, coyote time, saut mémorisé, collisions par axe, blocs, objets, plateformes mobiles, ennemis, points de passage, séquence d'arrivée, étoiles. |
| `niveaux.js` | Les 3 niveaux, construits par code avec des helpers (`m.tuyau`, `m.montée`, `m.PM`, `m.E`…). |
| `camera.js` | Caméra pure : zone morte, avance dans le sens du déplacement, verticale stable en saut. |
| `entrees.js` | Clavier + tactile + manette (API Gamepad : connexion/déconnexion, boutons maintenus/relâchés, perte de focus). |
| `sprites.js` | Atlas pixel-art original dessiné pixel par pixel (3 thèmes), police bitmap 5×7, `validerSprites()`. |
| `rendu.js` | Parallaxe à plusieurs plans, tuiles, entités animées, HUD, transitions en iris pixel-perfect. |
| `effets.js` | Particules, textes flottants, secousse (pools préalloués, aucune allocation par image). |
| `audio.js` | Synthèse 8 bits originale (musiques par niveau, bruitages, jingles), volumes séparés et persistants. |

Composants : `src/components/jeux/Plateforme.jsx` (boucle, entrées, écrans), `src/pages/Jeux.jsx` (menu, progression, succès, sauvegarde).

## Ajouter du contenu

- **Niveau** : ajouter une fonction dans `niveaux.js` (grille 12 lignes, sol aux lignes 10-11, `m.mat()` pour l'arrivée) puis une entrée dans `NIVEAUX`. Garder les plateformes flottantes à ≥ 32 px au-dessus du sol (le grand héros fait 24 px).
- **Ennemi** : déclarer ses dimensions dans `ENNEMIS` (`config.js`), son comportement dans `majEnnemi` (`moteur.js`) et ses sprites (`xxx_marche`, `xxx_ecrase`) dans `sprites.js`.
- **Objet** : une tuile (`niveaux.js` / `moteur.js` pour l'effet) + un sprite.
- **Sons personnalisés** : voir `public/jeux/sons/LISEZMOI.txt` (liste dans `sons.json`).

## Sauvegarde

Clé `react-blocs-jeux` (version 2) : parties, meilleur score, succès, et par niveau `étoiles`, `meilleur`, `temps`, `crit` (critères déjà obtenus), `secrets`. Une sauvegarde d'une version précédente est lue telle quelle ; une sauvegarde illisible n'est jamais écrasée (copie dans `react-blocs-jeux.sauvegarde`). Préférences : `react-blocs-jeux-muet`, `-vol-musique`, `-vol-effets`, `-grand`.

## Tests

`npm run test:jeux` — 23 tests du moteur (physique, coyote, saut mémorisé, collisions, blocs cachés, ennemis, plateformes mobiles, points de passage, arrivée, étoiles, déterminisme, caméra, structure des niveaux).

En mode développement (`npm run dev`) l'état du jeu est exposé sur `window.__jeu` pour les tests automatisés ; cette exposition n'existe pas dans le build de production.
