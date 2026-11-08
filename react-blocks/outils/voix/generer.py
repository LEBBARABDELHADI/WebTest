# Génère les voix avec edge-tts (voix « Natural » de Microsoft) : une voix et
# un jeu par personnage, ajustés selon l'émotion.
#   python generer.py 6       → court-métrage « expérience cinéma » de la page 6
#   python generer.py film7   → épisode 🍿 Film de la page 7
import asyncio, json, os, re, subprocess, sys
import certifi
# Derrière un proxy TLS (ex. session cloud) : CA_PROXY=/chemin/ca.crt pour que
# la vérification TLS reste active avec le certificat du proxy.
if os.environ.get('CA_PROXY'):
    certifi.where = lambda: os.environ['CA_PROXY']
import edge_tts

ICI = os.path.dirname(os.path.abspath(__file__))
ARG = sys.argv[1] if len(sys.argv) > 1 else '10'
FILM = ARG.startswith('film')
PAGE = ARG[4:] if FILM else ARG
if FILM:  # épisodes 🍿 Film (lib/livret2026/films)
    DOSSIER, LIGNES, NOM = f'film{PAGE}', f'lignes-film{PAGE}.json', f'VOIX_FILM{PAGE}'
    MANIFESTE = os.path.join(ICI, f'../../src/lib/livret2026/films/voixFilm{PAGE}.js')
    QUOI = f"l'épisode 🍿 Film de la page {PAGE}"
else:     # expérience cinéma (lib/livret2026/cinema)
    DOSSIER, LIGNES, NOM = f'p{PAGE}', f'lignes-p{PAGE}.json', f'VOIX_P{PAGE}'
    MANIFESTE = os.path.join(ICI, f'../../src/lib/livret2026/cinema/voixP{PAGE}.js')
    QUOI = f'le court-métrage de la page {PAGE}'
SORTIE = os.path.join(ICI, f'../../public/livret2026/voix/{DOSSIER}')
CASTING = {
    'lina': ('fr-FR-VivienneMultilingualNeural', 2, 3),
    'ines': ('fr-FR-DeniseNeural', 6, 9),
    'arnaud': ('fr-FR-HenriNeural', -10, -6),
    'narrateur': ('fr-FR-RemyMultilingualNeural', -6, -2),
    'agent': ('fr-CH-FabriceNeural', 4, -3),
    'recruteur': ('fr-BE-GerardNeural', 3, 0),
    'directrice': ('fr-CH-ArianeNeural', -3, -2),
    'zoe': ('fr-FR-EloiseNeural', 4, 2),
    'agente': ('fr-BE-CharlineNeural', 0, 0),
    'paul': ('fr-BE-GerardNeural', 2, 1),
    # Série 🍿 Film (personnages emoji de films/casting.js)
    'odette': ('fr-CH-ArianeNeural', -12, -12),
    'samir': ('fr-BE-GerardNeural', 6, 3),
    'yanis': ('fr-FR-EloiseNeural', 8, -10),
    'diallo': ('fr-FR-DeniseNeural', -2, -3),
    'thomas': ('fr-CH-FabriceNeural', 4, -3),
}
# Personnages propres à une page (épisodes construits automatiquement) : une
# voix selon le genre et le rang du personnage dans l'épisode.
VOIX_GENRE = {
    'f': [('fr-BE-CharlineNeural', 0, 0), ('fr-FR-DeniseNeural', 4, 3), ('fr-CH-ArianeNeural', 2, 4)],
    'm': [('fr-CH-FabriceNeural', 0, 0), ('fr-FR-HenriNeural', 2, 2), ('fr-BE-GerardNeural', -3, -4)],
    'enfant': [('fr-FR-EloiseNeural', 6, 0), ('fr-FR-EloiseNeural', 9, -9)],
    'âgée': [('fr-CH-ArianeNeural', -12, -12), ('fr-FR-DeniseNeural', -12, -10)],
    'âgé': [('fr-FR-HenriNeural', -12, -10), ('fr-BE-GerardNeural', -10, -12)],
}
ÉMOTIONS = {'joie': (4, 4), 'fier': (2, 3), 'sourire': (1, 2), 'surprise': (3, 7), 'inquiet': (-5, -1), 'réflexion': (-7, 0), 'fâché': (3, -2), 'tendre': (-7, 1), 'neutre': (0, 0),
           'gêne': (-4, -2), 'idée': (2, 4), 'colère': (4, -4), 'amour': (-5, 2), 'peur': (5, 6)}

def dire(texte):
    t = texte.replace('M. Arnaud', 'Monsieur Arnaud').replace('1er', 'premier').replace(' – ', ', ').replace('(DDHC, voir', '(D.D.H.C., voir')
    t = t.replace('(DDHC', '(D.D.H.C.')
    t = re.sub(r'(\d{4})-(\d{4})', r'\1 à \2', t)  # « 1814-1830 » : « 1814 à 1830 »
    # Chiffres romains ordinaux : « Ire République » → « 1re », « XVIe siècle » → « 16e ».
    rom = {'I': 1, 'V': 5, 'X': 10}
    def arabe(m):
        v = [rom[c] for c in m.group(1)]
        return str(sum(-x if i + 1 < len(v) and x < v[i + 1] else x for i, x in enumerate(v))) + m.group(2)
    t = re.sub(r'\b([IVX]+)(re|er|e)\b', arabe, t)
    return re.sub(r'\s+', ' ', t).strip()

async def main():
    os.makedirs(SORTIE, exist_ok=True)
    lignes = json.load(open(os.path.join(ICI, LIGNES)))
    manifeste = {}
    for l in lignes:
        g = VOIX_GENRE.get(l.get('genre') or '')
        voix, r, p = CASTING[l['qui']] if l['qui'] in CASTING else g[(l.get('rang') or 0) % len(g)]
        er, ep = ÉMOTIONS.get(l.get('émotion') or 'neutre', (0, 0))
        if l.get('officiel'): r -= 6
        if l['texte'].rstrip().endswith('?'): ep += 3
        nom = l['clé'].replace(':', '-') + '.mp3'
        chemin = os.path.join(SORTIE, nom)
        déjà = os.path.exists(chemin) and os.path.getsize(chemin) > 2000
        for essai in range(0 if déjà else 7):
            try:
                await edge_tts.Communicate(dire(l['texte']), voix, rate=f'{r + er:+d}%', pitch=f'{p + ep:+d}Hz').save(chemin)
                break
            except Exception as e:
                print('  nouvel essai', nom, e); await asyncio.sleep(3 + essai * 4)
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', chemin], capture_output=True, text=True).stdout or 0)
        manifeste[l['clé']] = {'f': nom, 'd': round(d, 2), 'voix': voix.split('-')[2].replace('MultilingualNeural', '').replace('Neural', '')}
        print(f"{l['clé']:<16} {manifeste[l['clé']]['voix']:<9} {d:5.1f}s")
        await asyncio.sleep(0.3)
    with open(MANIFESTE, 'w') as f:
        f.write(f'// Voix générées pour {QUOI} (edge-tts, voix « Natural »\n// de Microsoft) : fichier, durée (s), voix. Produit par un script, ne pas modifier à la main.\n')
        f.write(f'export const {NOM} = ' + json.dumps({'base': f'livret2026/voix/{DOSSIER}/', 'lignes': manifeste}, ensure_ascii=False, indent=1) + '\n')
    print('total', round(sum(v['d'] for v in manifeste.values()), 1), 's')
asyncio.run(main())
