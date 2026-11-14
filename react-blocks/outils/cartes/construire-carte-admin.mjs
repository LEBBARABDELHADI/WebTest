// Construit la carte administrative de la page 21 (13 régions, 96 départements
// de métropole) : chemins SVG projetés, centres, préfectures de région.
// Données : france-geojson (IGN Admin Express, Licence ouverte), à télécharger :
//   https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson
//   https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson
//   node outils/cartes/construire-carte-admin.mjs <regions.geojson> <departements.geojson>
// Positions des préfectures : outils/cartes/prefectures.json (geo.api.gouv.fr).
//     →  src/lib/livret2026/cinema/carteAdmin.js
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { geoConicConformal, geoPath, geoCentroid, geoContains } from 'd3-geo'

const [fRégions, fDépartements] = process.argv.slice(2)
if (!fRégions || !fDépartements) { console.error('usage : node construire-carte-admin.mjs <regions.geojson> <departements.geojson>'); process.exit(1) }
const régions = JSON.parse(readFileSync(fRégions)).features
const départements = JSON.parse(readFileSync(fDépartements)).features

// Préfectures de département, telles que sur la carte de la page 21.
const PRÉFECTURES = {
  '01': 'Bourg-en-Bresse', '02': 'Laon', '03': 'Moulins', '04': 'Digne-les-Bains', '05': 'Gap', '06': 'Nice', '07': 'Privas', '08': 'Charleville-Mézières', '09': 'Foix', '10': 'Troyes',
  '11': 'Carcassonne', '12': 'Rodez', '13': 'Marseille', '14': 'Caen', '15': 'Aurillac', '16': 'Angoulême', '17': 'La Rochelle', '18': 'Bourges', '19': 'Tulle', '2A': 'Ajaccio', '2B': 'Bastia',
  '21': 'Dijon', '22': 'Saint-Brieuc', '23': 'Guéret', '24': 'Périgueux', '25': 'Besançon', '26': 'Valence', '27': 'Évreux', '28': 'Chartres', '29': 'Quimper', '30': 'Nîmes',
  '31': 'Toulouse', '32': 'Auch', '33': 'Bordeaux', '34': 'Montpellier', '35': 'Rennes', '36': 'Châteauroux', '37': 'Tours', '38': 'Grenoble', '39': 'Lons-le-Saunier', '40': 'Mont-de-Marsan',
  '41': 'Blois', '42': 'Saint-Étienne', '43': 'Le Puy-en-Velay', '44': 'Nantes', '45': 'Orléans', '46': 'Cahors', '47': 'Agen', '48': 'Mende', '49': 'Angers', '50': 'Saint-Lô',
  '51': 'Châlons-en-Champagne', '52': 'Chaumont', '53': 'Laval', '54': 'Nancy', '55': 'Bar-le-Duc', '56': 'Vannes', '57': 'Metz', '58': 'Nevers', '59': 'Lille', '60': 'Beauvais',
  '61': 'Alençon', '62': 'Arras', '63': 'Clermont-Ferrand', '64': 'Pau', '65': 'Tarbes', '66': 'Perpignan', '67': 'Strasbourg', '68': 'Colmar', '69': 'Lyon', '70': 'Vesoul',
  '71': 'Mâcon', '72': 'Le Mans', '73': 'Chambéry', '74': 'Annecy', '75': 'Paris', '76': 'Rouen', '77': 'Melun', '78': 'Versailles', '79': 'Niort', '80': 'Amiens',
  '81': 'Albi', '82': 'Montauban', '83': 'Toulon', '84': 'Avignon', '85': 'La Roche-sur-Yon', '86': 'Poitiers', '87': 'Limoges', '88': 'Épinal', '89': 'Auxerre', '90': 'Belfort',
  '91': 'Évry', '92': 'Nanterre', '93': 'Bobigny', '94': 'Créteil', '95': 'Cergy',
}
// Préfectures de région (carré sur la carte), avec leur position [longitude, latitude].
const PRÉFECTURES_RÉGION = {
  11: ['Paris', [2.35, 48.86]], 32: ['Lille', [3.06, 50.63]], 28: ['Rouen', [1.1, 49.44]], 44: ['Strasbourg', [7.75, 48.57]], 53: ['Rennes', [-1.68, 48.11]],
  52: ['Nantes', [-1.55, 47.22]], 24: ['Orléans', [1.91, 47.9]], 27: ['Dijon', [5.04, 47.32]], 84: ['Lyon', [4.84, 45.76]], 75: ['Bordeaux', [-0.58, 44.84]],
  76: ['Toulouse', [1.44, 43.6]], 93: ['Marseille', [5.37, 43.3]], 94: ['Ajaccio', [8.74, 41.93]],
}

// Position des préfectures de département : prefectures.json (geo.api.gouv.fr,
// centre de la commune, récupéré une fois).
const POSITIONS = JSON.parse(readFileSync(fileURLToPath(new URL('./prefectures.json', import.meta.url))))

const L = 1000, H = 1000
const projection = geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitExtent([[20, 20], [L - 20, H - 20]], { type: 'FeatureCollection', features: régions })
const chemin = geoPath(projection).digits(1)
const arrondi = ([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]

const sortie = {
  l: L, h: H,
  régions: régions.map(r => {
    const [nom, ll] = PRÉFECTURES_RÉGION[Number(r.properties.code)] || []
    if (!nom) throw new Error(`Préfecture de région inconnue : ${r.properties.code} ${r.properties.nom}`)
    const [[x0, y0], [x1, y1]] = chemin.bounds(r)
    return { code: r.properties.code, nom: r.properties.nom, d: chemin(r), xy: arrondi(projection(geoCentroid(r))), cadre: [x0, y0, x1, y1].map(v => Math.round(v)), préfecture: nom, préfectureXy: arrondi(projection(ll)) }
  }),
  départements: départements.map(d => {
    const c = geoCentroid(d)
    const r = régions.find(x => geoContains(x, c))
    if (!r) throw new Error(`Région introuvable pour ${d.properties.code} ${d.properties.nom}`)
    if (!PRÉFECTURES[d.properties.code]) throw new Error(`Préfecture inconnue : ${d.properties.code}`)
    const pos = POSITIONS[d.properties.code]
    if (!pos) throw new Error(`Position de préfecture manquante : ${d.properties.code}`)
    return { code: d.properties.code, nom: d.properties.nom, région: r.properties.code, d: chemin(d), xy: arrondi(projection(c)), préfecture: PRÉFECTURES[d.properties.code], préfectureXy: arrondi(projection(pos.ll)) }
  }),
}

const cible = fileURLToPath(new URL('../../src/lib/livret2026/cinema/carteAdmin.js', import.meta.url))
writeFileSync(cible, `// Carte administrative de la page 21 : 13 régions et 96 départements de métropole,
// préfectures. Contours : france-geojson (IGN Admin Express, Licence ouverte),
// précalculés par outils/cartes/construire-carte-admin.mjs. Ne pas modifier à la main.
export const CARTE_ADMIN = ${JSON.stringify(sortie)}
`)
// Petit module sans géométrie, pour le scénario et les visuels.
const tri = (a, b) => a.code.localeCompare(b.code)
const noms = sortie.régions.map(r => ({ code: r.code, nom: r.nom, préfecture: r.préfecture, départements: sortie.départements.filter(d => d.région === r.code).sort(tri).map(d => [d.code, d.nom, d.préfecture]) }))
writeFileSync(fileURLToPath(new URL('../../src/lib/livret2026/cinema/regionsAdmin.js', import.meta.url)), `// Régions, préfectures de région et départements (numéro, nom, préfecture) de la
// carte administrative de la page 21. Produit par outils/cartes/construire-carte-admin.mjs.
export const RÉGIONS_ADMIN = ${JSON.stringify(noms, null, 1)}
`)
const parRégion = Object.fromEntries(sortie.régions.map(r => [r.code, sortie.départements.filter(d => d.région === r.code).length]))
console.log(sortie.régions.length, 'régions,', sortie.départements.length, 'départements ·', Math.round(JSON.stringify(sortie).length / 1024), 'Ko')
console.log(sortie.régions.map(r => `${r.nom} (${r.préfecture}) : ${parRégion[r.code]}`).join('\n'))
