# Génère les voix du court-métrage (page 10) avec edge-tts (voix « Natural »
# de Microsoft) : une voix et un jeu par personnage, ajustés selon l'émotion.
import asyncio, json, os, re, subprocess, sys
import certifi
# Derrière un proxy TLS (ex. session cloud) : CA_PROXY=/chemin/ca.crt pour que
# la vérification TLS reste active avec le certificat du proxy.
if os.environ.get('CA_PROXY'):
    certifi.where = lambda: os.environ['CA_PROXY']
import edge_tts

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, '../../public/livret2026/voix/p10')
MANIFESTE = os.path.join(ICI, '../../src/lib/livret2026/cinema/voixP10.js')
CASTING = {
    'lina': ('fr-FR-VivienneMultilingualNeural', 2, 3),
    'ines': ('fr-FR-DeniseNeural', 6, 9),
    'arnaud': ('fr-FR-HenriNeural', -10, -6),
    'narrateur': ('fr-FR-RemyMultilingualNeural', -6, -2),
}
ÉMOTIONS = {'joie': (4, 4), 'fier': (2, 3), 'sourire': (1, 2), 'surprise': (3, 7), 'inquiet': (-5, -1), 'réflexion': (-7, 0), 'fâché': (3, -2), 'tendre': (-7, 1), 'neutre': (0, 0)}

def dire(texte):
    t = texte.replace('M. Arnaud', 'Monsieur Arnaud').replace('1er', 'premier').replace(' – ', ', ').replace('(DDHC, voir', '(D.D.H.C., voir')
    t = t.replace('(DDHC', '(D.D.H.C.')
    return re.sub(r'\s+', ' ', t).strip()

async def main():
    os.makedirs(SORTIE, exist_ok=True)
    lignes = json.load(open(os.path.join(ICI, 'lignes-p10.json')))
    manifeste = {}
    for l in lignes:
        voix, r, p = CASTING[l['qui']]
        er, ep = ÉMOTIONS.get(l.get('émotion') or 'neutre', (0, 0))
        if l.get('officiel'): r -= 6
        if l['texte'].rstrip().endswith('?'): ep += 3
        nom = l['clé'].replace(':', '-') + '.mp3'
        chemin = os.path.join(SORTIE, nom)
        for essai in range(3):
            try:
                await edge_tts.Communicate(dire(l['texte']), voix, rate=f'{r + er:+d}%', pitch=f'{p + ep:+d}Hz').save(chemin)
                break
            except Exception as e:
                print('  nouvel essai', nom, e); await asyncio.sleep(2 + essai * 3)
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', chemin], capture_output=True, text=True).stdout or 0)
        manifeste[l['clé']] = {'f': nom, 'd': round(d, 2), 'voix': voix.split('-')[2].replace('MultilingualNeural', '').replace('Neural', '')}
        print(f"{l['clé']:<16} {manifeste[l['clé']]['voix']:<9} {d:5.1f}s")
        await asyncio.sleep(0.3)
    with open(MANIFESTE, 'w') as f:
        f.write('// Voix générées pour le court-métrage de la page 10 (edge-tts, voix « Natural »\n// de Microsoft) : fichier, durée (s), voix. Produit par un script, ne pas modifier à la main.\n')
        f.write('export const VOIX_P10 = ' + json.dumps({'base': 'livret2026/voix/p10/', 'lignes': manifeste}, ensure_ascii=False, indent=1) + '\n')
    print('total', round(sum(v['d'] for v in manifeste.values()), 1), 's')
asyncio.run(main())
