// Ensembles de caractères : plages de points de code [début, fin], union,
// complément, reconnaissance des classes abrégées (\d, \w, \s) et noms lisibles.
// Utilisé par les générateurs, l'explication et le générateur d'exemples.

export const MAX_CP = 0x10ffff

export const CHIFFRES = [[48, 57]]
export const MAJUSCULES = [[65, 90]]
export const MINUSCULES = [[97, 122]]
export const LETTRES = [[65, 90], [97, 122]]
export const ALNUM = [[48, 57], [65, 90], [97, 122]]
export const MOT = [[48, 57], [65, 90], [95, 95], [97, 122]]
export const HEXA = [[48, 57], [65, 70], [97, 102]]
// \s de JavaScript : blancs ASCII, espace insécable et espaces Unicode usuels.
export const BLANC = [[9, 13], [32, 32], [160, 160], [0x1680, 0x1680], [0x2000, 0x200a], [0x2028, 0x2029], [0x202f, 0x202f], [0x205f, 0x205f], [0x3000, 0x3000], [0xfeff, 0xfeff]]
export const ACCENTS = [[0xc0, 0xd6], [0xd8, 0xf6], [0xf8, 0xff]]

export const cp = c => c.codePointAt(0)
export const car = n => String.fromCodePoint(n)

// Fusionne et trie des plages.
export function fusionner(plages) {
  const tri = plages.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]).sort((x, y) => x[0] - y[0] || x[1] - y[1])
  const sortie = []
  for (const [a, b] of tri) {
    const dernier = sortie.at(-1)
    if (dernier && a <= dernier[1] + 1) dernier[1] = Math.max(dernier[1], b)
    else sortie.push([a, b])
  }
  return sortie
}

export const union = (...ensembles) => fusionner(ensembles.flat())

export function complément(plages) {
  const f = fusionner(plages)
  const sortie = []
  let début = 0
  for (const [a, b] of f) {
    if (a > début) sortie.push([début, a - 1])
    début = b + 1
  }
  if (début <= MAX_CP) sortie.push([début, MAX_CP])
  return sortie
}

export function contient(plages, n) {
  return plages.some(([a, b]) => n >= a && n <= b)
}

export function égalPlages(a, b) {
  const x = fusionner(a), y = fusionner(b)
  return x.length === y.length && x.every(([p, q], i) => p === y[i][0] && q === y[i][1])
}

export const ESC_PLAGES = { d: CHIFFRES, w: MOT, s: BLANC }

// Plages d'un élément de classe ({lo,hi} ou {esc}) ; les formes niées (\D \W \S) sont complémentées.
export function plagesItem(item) {
  if (item.esc) {
    const base = ESC_PLAGES[item.esc.toLowerCase()]
    return item.esc === item.esc.toLowerCase() ? base : complément(base)
  }
  return [[item.lo, item.hi]]
}

// Plages d'un nœud classe ({t:'cls'}) ou raccourci ({t:'esc'}), négation comprise.
export function plagesNœud(nœud) {
  if (nœud.t === 'esc') return plagesItem({ esc: nœud.c })
  const positives = fusionner(nœud.items.flatMap(plagesItem))
  return nœud.neg ? complément(positives) : positives
}

// Nom lisible d'un ensemble, ou null.
const NOMS = [
  [CHIFFRES, 'chiffres (0-9)'], [MAJUSCULES, 'lettres majuscules (A-Z)'], [MINUSCULES, 'lettres minuscules (a-z)'], [LETTRES, 'lettres (A-Z, a-z)'],
  [ALNUM, 'lettres et chiffres (A-Z, a-z, 0-9)'], [MOT, 'caractères de mot (lettres, chiffres, _)'], [HEXA, 'chiffres hexadécimaux (0-9, A-F, a-f)'],
]
export function nomEnsemble(plages) {
  const f = fusionner(plages)
  return NOMS.find(([p]) => égalPlages(p, f))?.[1] ?? null
}

// Caractère affichable (pour les messages).
export function affichable(n) {
  if (n === 9) return '\\t'
  if (n === 10) return '\\n'
  if (n === 13) return '\\r'
  if (n === 32) return 'espace'
  if (n < 32 || n === 127) return `\\x${n.toString(16).padStart(2, '0')}`
  return car(n)
}

export function décrirePlages(plages) {
  return fusionner(plages).map(([a, b]) => (a === b ? `« ${affichable(a)} »` : `de « ${affichable(a)} » à « ${affichable(b)} »`)).join(', ')
}
