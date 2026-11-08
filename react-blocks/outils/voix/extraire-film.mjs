// Liste les répliques d'un épisode 🍿 Film (lib/livret2026/films/pN.js), dans
// l'ordre exact où le lecteur les dit (mêmes « temps » que Film.jsx).
//   node extraire-film.mjs 7   → lignes-film7.json, puis : python generer.py film7
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const ici = fileURLToPath(new URL('.', import.meta.url))
const page = process.argv[2]
const { tempsDu } = await import(new URL('../../src/lib/livret2026/filmTemps.js', import.meta.url))
const { FILM } = await import(new URL(`../../src/lib/livret2026/films/p${page}.js`, import.meta.url))
const lignes = []
FILM.plans.forEach((plan, p) => tempsDu(plan).forEach((t, b) => {
  if (t.texte) lignes.push({ clé: `${p}:${b}`, qui: t.qui, texte: t.texte, émotion: t.émotion || null, officiel: !!t.citation })
}))
const inconnus = [...new Set(lignes.map(l => l.qui))].filter(q => !FILM.personnages[q])
if (inconnus.length) throw new Error(`Personnages inconnus : ${inconnus.join(', ')}`)
writeFileSync(`${ici}lignes-film${page}.json`, JSON.stringify(lignes, null, 1))
console.log(lignes.length, 'répliques ·', FILM.plans.length, 'plans')
