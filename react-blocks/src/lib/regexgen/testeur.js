// Test d'un motif sur un texte : correspondances (position, ligne, colonne,
// groupes) et verdict par ligne. Le moteur est celui de JavaScript (ECMAScript).
// L'exécution se fait dans un Web Worker avec délai : un motif à backtracking
// catastrophique ne peut pas bloquer la page.
import { analyserRegex, ErreurRegex } from './parse.js'

export const LIMITE_TEXTE = 1_000_000

export function nettoyerDrapeaux(flags = '') {
  return [...new Set(String(flags))].filter(f => 'gimsuy'.includes(f)).join('')
}

export function compiler(pattern, flags = '') {
  const f = nettoyerDrapeaux(flags)
  try {
    return { ok: true, re: new RegExp(pattern, f), drapeaux: f }
  } catch (e) {
    // Message français et position, si l'analyseur les connaît.
    try { analyserRegex(pattern, f) } catch (e2) {
      if (e2 instanceof ErreurRegex) return { ok: false, erreur: { message: e2.message, position: e2.position } }
    }
    return { ok: false, erreur: { message: e.message.replace(/^Invalid regular expression: /, 'Motif invalide : '), position: 0 } }
  }
}

export function tester({ pattern, flags = '', texte = '', parLigne = false, max = 500 }) {
  if (!pattern) return { ok: false, vide: true, erreur: { message: 'Le motif est vide.', position: 0 } }
  if (texte.length > LIMITE_TEXTE) return { ok: false, erreur: { message: `Texte trop long (${texte.length} caractères, maximum ${LIMITE_TEXTE}).`, position: 0 } }
  const c = compiler(pattern, flags)
  if (!c.ok) return c
  const drapeaux = c.drapeaux.includes('g') ? c.drapeaux : `${c.drapeaux}g`
  const re = new RegExp(pattern, drapeaux)
  let numérotation = []
  try { numérotation = analyserRegex(pattern, c.drapeaux).groupes } catch { /* groupes numérotés seulement */ }
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()

  // Lignes (positions dans le texte entier).
  const lignes = []
  let début = 0
  for (const l of texte.split('\n')) {
    const brut = l.endsWith('\r') ? l.slice(0, -1) : l
    lignes.push({ n: lignes.length + 1, début, fin: début + brut.length, texte: brut, nb: 0, ok: false })
    début += l.length + 1
  }
  const ligneDe = pos => {
    let a = 0, b = lignes.length - 1
    while (a < b) { const m = (a + b + 1) >> 1; if (lignes[m].début <= pos) a = m; else b = m - 1 }
    return lignes[a]
  }

  const correspondances = []
  let tronqué = false
  const enregistrer = (m, décalage) => {
    const debut = décalage + m.index
    const l = ligneDe(debut)
    correspondances.push({
      debut,
      fin: debut + m[0].length,
      texte: m[0],
      ligne: l.n,
      colonne: debut - l.début + 1,
      groupes: m.slice(1).map((valeur, k) => ({ num: k + 1, nom: numérotation.find(g => g.num === k + 1)?.nom ?? null, valeur: valeur ?? null })),
    })
    l.nb++
    l.ok = true
  }
  const exécuter = (chaîne, décalage) => {
    re.lastIndex = 0
    let m
    while ((m = re.exec(chaîne)) !== null) {
      if (correspondances.length >= max) { tronqué = true; return }
      enregistrer(m, décalage)
      if (m[0] === '') re.lastIndex++
    }
  }
  if (parLigne) {
    for (const l of lignes) { exécuter(l.texte, l.début); if (tronqué) break }
  } else exécuter(texte, 0)
  const durée = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0
  return {
    ok: true,
    correspondances,
    total: correspondances.length,
    tronqué,
    lignes: lignes.length > 2000 ? lignes.slice(0, 2000) : lignes,
    nbLignes: lignes.length,
    nbLignesCorrespondantes: lignes.filter(l => l.ok).length,
    drapeaux: c.drapeaux,
    texteTesté: texte,
    parLigne,
    durée,
  }
}
