// Liste les répliques d'un épisode 🍿 Film, dans l'ordre exact où le lecteur
// les dit (mêmes « temps » que Film.jsx). Épisode écrit à la main
// (films/pN.js) ou construit à partir du contenu de la page (films/auto.js).
//   node extraire-film.mjs 7          → lignes-film7.json, puis : python generer.py film7
//   node extraire-film.mjs auto       → toutes les pages de contenu sans épisode écrit
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const ici = fileURLToPath(new URL('.', import.meta.url))
const src = p => new URL(`../../src/lib/livret2026/${p}`, import.meta.url)
const { tempsDu } = await import(src('filmTemps.js'))
const { construireFilm } = await import(src('films/auto.js'))
const parties = await Promise.all(['partie1', 'partie2', 'partie3', 'partie4a', 'partie4b', 'partie5', 'annexes'].map(f => import(src(`${f}.js`))))
const CONTENU = parties.flatMap(m => m.PARTIE?.pages || []).filter(p => p.type === 'contenu').sort((a, b) => a.page - b.page)
const écrit = n => existsSync(fileURLToPath(src(`films/p${n}.js`)))

async function extraire(n) {
  const FILM = écrit(n)
    ? (await import(src(`films/p${n}.js`))).FILM
    : construireFilm(CONTENU.find(p => p.page === n), { suivante: CONTENU.find(p => p.page > n)?.page || null })
  const lignes = []
  FILM.plans.forEach((plan, p) => tempsDu(plan).forEach((t, b) => {
    if (!t.texte) return
    const pp = FILM.personnages[t.qui]
    if (!pp) throw new Error(`Page ${n} : personnage inconnu ${t.qui}`)
    lignes.push({ clé: `${p}:${b}`, qui: t.qui, texte: t.texte, émotion: t.émotion || null, officiel: !!t.citation, genre: pp.genre || null, rang: pp.rang ?? null })
  }))
  writeFileSync(`${ici}lignes-film${n}.json`, JSON.stringify(lignes, null, 1))
  return lignes.length
}

const arg = process.argv[2]
const pages = arg === 'auto' ? CONTENU.map(p => p.page).filter(n => !écrit(n)) : [Number(arg)]
let total = 0
for (const n of pages) total += await extraire(n)
console.log(pages.length, 'épisode(s) ·', total, 'répliques', arg === 'auto' ? `· pages ${pages.join(' ')}` : '')
