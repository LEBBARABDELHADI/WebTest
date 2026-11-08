# Voix du court-métrage (page 10)

Génère un fichier MP3 par réplique avec **edge-tts** (voix « Natural » de
Microsoft), une voix et un jeu par personnage, puis le manifeste
`src/lib/livret2026/cinema/voixP10.js`.

```bash
python3 -m venv .venv && .venv/bin/pip install edge-tts
node extraire.mjs                 # lignes-p10.json depuis le scénario
.venv/bin/python generer.py       # MP3 dans public/livret2026/voix/p10/
# derrière un proxy TLS : CA_PROXY=/chemin/ca.crt .venv/bin/python generer.py
```

Distribution : Lina = Vivienne, Inès = Denise, M. Arnaud = Henri,
narration = Rémy. Vitesse et hauteur réglées par personnage et par émotion
(tableaux CASTING et ÉMOTIONS dans `generer.py`).
