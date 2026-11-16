// Chemins dans un document JSON et utilitaires partagés par le moteur du
// Query Generator.
//
// Un chemin est un tableau de segments : une chaîne = clé d'objet, un nombre =
// position dans un tableau, null = « chaque élément du tableau » (itération).
// Exemple : ['Reservations', null, 'Instances', null, 'State', 'Name'].

export const ITER = null

export const typeJson = v => (v === null || v === undefined ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v)

export const contientIteration = chemin => chemin.some(s => s === ITER)

// Valeur à un chemin sans itération (undefined si absente).
export function lire(valeur, chemin) {
  let v = valeur
  for (const s of chemin) {
    if (v === null || v === undefined) return undefined
    if (typeof s === 'number') v = Array.isArray(v) ? v[s < 0 ? v.length + s : s] : undefined
    else if (typeof s === 'string') v = typeJson(v) === 'object' ? v[s] : undefined
    else return undefined
  }
  return v
}

// Toutes les valeurs atteintes par un chemin (avec itérations). Les branches
// absentes sont ignorées ; une feuille absente vaut undefined.
export function lireTous(valeur, chemin, départ = 0, sortie = []) {
  let v = valeur
  for (let i = départ; i < chemin.length; i++) {
    const s = chemin[i]
    if (s === ITER) {
      if (Array.isArray(v)) for (const e of v) lireTous(e, chemin, i + 1, sortie)
      return sortie
    }
    if (v === null || v === undefined) { sortie.push(undefined); return sortie }
    if (typeof s === 'number') v = Array.isArray(v) ? v[s < 0 ? v.length + s : s] : undefined
    else v = typeJson(v) === 'object' ? v[s] : undefined
  }
  sortie.push(v)
  return sortie
}

// Égalité JSON (ordre des clés indifférent, 1 == 1.0).
export function égal(a, b) {
  if (a === b) return true
  const ta = typeJson(a), tb = typeJson(b)
  if (ta !== tb) return false
  if (ta === 'array') return a.length === b.length && a.every((x, i) => égal(x, b[i]))
  if (ta === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b)
    return ka.length === kb.length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && égal(a[k], b[k]))
  }
  return ta === 'null'
}

// Ordre total de jq : null < false < true < nombres < chaînes < tableaux < objets.
const RANG = { null: 0, boolean: 1, number: 2, string: 3, array: 4, object: 5 }
export function comparerJq(a, b) {
  const ta = typeJson(a), tb = typeJson(b)
  if (ta !== tb) return RANG[ta] - RANG[tb]
  if (ta === 'null') return 0
  if (ta === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0)
  if (ta === 'number') return a < b ? -1 : a > b ? 1 : 0
  if (ta === 'string') return a < b ? -1 : a > b ? 1 : 0
  if (ta === 'array') {
    for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = comparerJq(a[i], b[i]); if (c) return c }
    return a.length - b.length
  }
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort()
  const ck = comparerJq(ka, kb)
  if (ck) return ck
  for (const k of ka) { const c = comparerJq(a[k], b[k]); if (c) return c }
  return 0
}

// Clé stable d'une valeur JSON (pour des ensembles et des index).
export function cléValeur(v) {
  const t = typeJson(v)
  if (t === 'array') return `[${v.map(cléValeur).join(',')}]`
  if (t === 'object') return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${cléValeur(v[k])}`).join(',')}}`
  return t === 'null' ? 'null' : JSON.stringify(v)
}

// ---- Affichage et syntaxe des langages ----------------------------------

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/
const MOTS_JQ = new Set(['and', 'or', 'not', 'if', 'then', 'elif', 'else', 'end', 'as', 'def', 'reduce', 'foreach', 'try', 'catch', 'label', 'import', 'include', '__loc__'])

export const identifiantSimple = nom => IDENT.test(nom)

// Accès à un champ en jq : .nom ou ."nom-composé" (compatible jq 1.6+).
export const champJq = nom => (IDENT.test(nom) && !MOTS_JQ.has(nom) ? `.${nom}` : `.${JSON.stringify(nom)}`)
// Clé dans une construction d'objet jq : {nom: …} ou {"nom-composé": …}.
export const cléObjetJq = nom => (IDENT.test(nom) && !MOTS_JQ.has(nom) ? nom : JSON.stringify(nom))
export const littéralJq = v => JSON.stringify(v)

export const champJmes = nom => (IDENT.test(nom) ? nom : JSON.stringify(nom))
export function littéralJmes(v) {
  if (typeof v === 'string') return v.includes('\\') ? `\`${JSON.stringify(v).replace(/`/g, '\\`')}\`` : `'${v.replace(/'/g, "\\'")}'`
  return `\`${JSON.stringify(v)}\``
}

// Chemin en jq. optionnels : positions des itérations à écrire « []? »
// (tableau parfois absent dans les données).
export function cheminJq(chemin, { optionnels } = {}) {
  let t = ''
  chemin.forEach((s, i) => {
    const point = t ? '' : '.'
    if (s === ITER) t += point + (optionnels?.has(i) ? '[]?' : '[]')
    else if (typeof s === 'number') t += `${point}[${s}]`
    else t += champJq(s)
  })
  return t || '.'
}

// Chemin en JMESPath (sans « @ » initial ; vide = élément courant).
export function cheminJmes(chemin) {
  let t = ''
  for (const s of chemin) {
    if (s === ITER) t += '[]'
    else if (typeof s === 'number') t += `[${s}]`
    else t += (t ? '.' : '') + champJmes(s)
  }
  return t
}

// Chemin lisible (affichage) : Reservations[].Instances[].State.Name
export function texteChemin(chemin) {
  const t = cheminJmes(chemin)
  return t || '(racine)'
}

export const dernierNom = chemin => {
  for (let i = chemin.length - 1; i >= 0; i--) if (typeof chemin[i] === 'string') return chemin[i]
  return ''
}

// Texte court d'une valeur pour les messages.
export function aperçu(v, max = 60) {
  let t
  try { t = JSON.stringify(v) } catch { t = String(v) }
  if (t === undefined) t = 'absent'
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

// Normalisation pour comparer des mots : minuscules, sans accents.
export const normaliser = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const compact = t => normaliser(t).replace(/[^a-z0-9]/g, '')
