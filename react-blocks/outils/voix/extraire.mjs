import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const ici = fileURLToPath(new URL('.', import.meta.url))
const { COURT_MÉTRAGE: F } = await import(new URL('../../src/lib/livret2026/cinema/p10.js', import.meta.url))
const lignes = []
F.scènes.forEach(sc => sc.temps.forEach((t, k) => {
  if (t.texte) lignes.push({ clé: `${sc.id}:${k}`, qui: t.qui, texte: t.texte, émotion: t.émotion || null })
  else if (t.officiel) lignes.push({ clé: `${sc.id}:${k}`, qui: 'narrateur', texte: t.officiel.texte, officiel: true })
}))
writeFileSync(`${ici}lignes-p10.json`, JSON.stringify(lignes, null, 1))
console.log(lignes.length, 'lignes ·', lignes.filter(l => l.officiel).length, 'cartes officielles')
