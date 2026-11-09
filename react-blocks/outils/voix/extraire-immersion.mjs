// Liste les répliques de l'« Immersion dans le Livret du citoyen 2026 »
// (bande-annonce, grande frise, 15 épisodes, volet géographique), dans l'ordre
// du lecteur, avec le texte tel qu'il sera dit.
//   node extraire-immersion.mjs   → lignes-immersion.json, puis : python generer.py immersion
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const ici = fileURLToPath(new URL('.', import.meta.url))
const { toutesLesLignes, parlé } = await import(new URL('../../src/lib/livret2026/immersion/scenario.js', import.meta.url))

const lignes = toutesLesLignes().map(l => ({ clé: l.clé, qui: l.voix, texte: parlé(l.texte), émotion: null, officiel: false }))
writeFileSync(`${ici}lignes-immersion.json`, JSON.stringify(lignes, null, 1))
const par = lignes.reduce((a, l) => ({ ...a, [l.qui]: (a[l.qui] || 0) + 1 }), {})
console.log(lignes.length, 'répliques ·', Object.entries(par).map(([k, v]) => `${k} ${v}`).join(' · '), '·', lignes.reduce((s, l) => s + l.texte.length, 0), 'caractères')
