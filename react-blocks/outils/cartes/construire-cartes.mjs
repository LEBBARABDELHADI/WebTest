// Construit les cartes de l'« Immersion » (frontières actuelles, Natural
// Earth via world-atlas) : chemins SVG des pays, positions des lieux, tracés
// des fleuves, précalculés pour trois vues (France, Europe, monde).
//   node outils/cartes/construire-cartes.mjs  →  src/lib/livret2026/immersion/cartes.js
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'
import { geoConicConformal, geoNaturalEarth1, geoPath, geoBounds } from 'd3-geo'
import { LIEUX, FLEUVES, MASSIFS, MERS, VOISINS } from '../../src/lib/livret2026/immersion/lieux.js'

const ici = p => fileURLToPath(new URL(p, import.meta.url))
const pays = res => feature(JSON.parse(readFileSync(ici(`../../node_modules/world-atlas/countries-${res}.json`))), 'countries').features
// Coins et milieux des bords (un MultiPoint évite les pièges d'orientation des polygones sphériques).
const cadre = ([o, s, e, n]) => ({ type: 'MultiPoint', coordinates: [[o, s], [e, s], [e, n], [o, n], [(o + e) / 2, s], [(o + e) / 2, n], [o, (s + n) / 2], [e, (s + n) / 2]] })
const touche = ([o, s, e, n], f) => { const [[a, b], [c, d]] = geoBounds(f); const lon = c < a ? true : c >= o - 2 && a <= e + 2; return lon && d >= s - 2 && b <= n + 2 }
const arrondi = v => Math.round(v * 10) / 10

// Courbe lissée (Catmull-Rom → Bézier) à travers les points projetés.
function lisse(pts) {
  if (pts.length < 2) return ''
  let d = `M${arrondi(pts[0][0])},${arrondi(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1.map(arrondi)},${c2.map(arrondi)},${p2.map(arrondi)}`
  }
  return d
}

const VUES = {
  france: { l: 1000, h: 1000, res: '50m', proj: () => geoConicConformal().parallels([44, 49]).rotate([-2.6, 0]), cadre: [-5.4, 41.2, 10.0, 51.5], fleuves: true },
  europe: { l: 1000, h: 760, res: '110m', proj: () => geoConicConformal().parallels([38, 58]).rotate([-13, 0]), cadre: [-12.5, 33.5, 43, 63] },
  monde: { l: 1000, h: 520, res: '110m', proj: () => geoNaturalEarth1(), cadre: null },
}

const sortie = {}
for (const [nom, v] of Object.entries(VUES)) {
  const proj = v.proj()
  if (v.cadre) proj.fitExtent([[12, 12], [v.l - 12, v.h - 12]], cadre(v.cadre))
  else proj.fitExtent([[6, 6], [v.l - 6, v.h - 6]], { type: 'Sphere' })
  proj.clipExtent([[0, 0], [v.l, v.h]])
  const chemin = geoPath(proj).digits(1)
  const terres = pays(v.res).filter(f => !v.cadre || touche(v.cadre, f)).map(f => [f.properties.name, chemin(f)]).filter(([, d]) => d && d.length > 4)
  const dedans = ([x, y]) => x >= -20 && y >= -20 && x <= v.l + 20 && y <= v.h + 20
  const place = ll => { const p = proj(ll); return p && dedans(p) ? p.map(arrondi) : undefined }
  const lieux = {}
  for (const [id, l] of Object.entries(LIEUX)) { const p = place(l.ll); if (p) lieux[id] = p }
  const r = { l: v.l, h: v.h, terres, lieux }
  if (v.fleuves) {
    r.fleuves = Object.fromEntries(FLEUVES.map(f => [f.id, { d: lisse(f.cours.map(ll => proj(ll))), source: place(f.cours[0]), embouchure: place(f.cours.at(-1)), étiquette: place(f.étiquette) }]))
    r.massifs = Object.fromEntries(MASSIFS.map(m => [m.id, place(m.ll)]))
    r.mers = Object.fromEntries(MERS.map(m => [m.id, place(m.ll)]))
    r.voisins = Object.fromEntries(VOISINS.map(m => [m.nom, place(m.ll)]))
  }
  if (nom === 'monde') r.sphère = geoPath(proj).digits(1)({ type: 'Sphere' })
  sortie[nom] = r
}

const texte = `// Cartes de l'« Immersion » : frontières actuelles (Natural Earth, via
// world-atlas), précalculées par outils/cartes/construire-cartes.mjs.
// Fichier produit par un script : ne pas modifier à la main.
export const CARTES = ${JSON.stringify(sortie)}
`
writeFileSync(ici('../../src/lib/livret2026/immersion/cartes.js'), texte)
for (const [n, v] of Object.entries(sortie)) console.log(n, v.terres.length, 'pays,', Object.keys(v.lieux).length, 'lieux')
console.log(Math.round(texte.length / 1024), 'Ko')
