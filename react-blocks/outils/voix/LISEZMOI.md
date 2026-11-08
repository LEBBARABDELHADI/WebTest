# Voix des courts-métrages (pages pilotes 6, 7 et 10)

Génère un fichier MP3 par réplique avec **edge-tts** (voix « Natural » de
Microsoft), une voix et un jeu par personnage, puis le manifeste
`src/lib/livret2026/cinema/voixP{page}.js`.

```bash
python3 -m venv .venv && .venv/bin/pip install edge-tts
node extraire.mjs 6               # lignes-p6.json depuis le scénario p6.js
.venv/bin/python generer.py 6     # MP3 dans public/livret2026/voix/p6/
# derrière un proxy TLS : CA_PROXY=/chemin/ca.crt .venv/bin/python generer.py 6
```

Sans numéro de page, les deux scripts traitent la page 10. Les MP3 déjà
présents sont gardés : relancer `generer.py` ne refait que ceux qui manquent
(utile quand le service répond « No audio was received »).

Distribution : Lina = Vivienne, Inès = Denise, M. Arnaud = Henri,
narration = Rémy, l'agent immobilier (page 6) = Fabrice, Hugo le recruteur
(page 7) = Gérard, Mme Diallo la directrice (page 7) = Ariane. Vitesse et hauteur
réglées par personnage et par émotion (tableaux CASTING et ÉMOTIONS dans
`generer.py`).
