// Arbre d'une expression régulière et émission pour plusieurs dialectes.
//
// Un motif est décrit une fois (arbre), puis écrit pour chaque dialecte avec ses
// propres règles : classes abrégées, groupes nommés, assertions, drapeaux.
// Ce qu'un dialecte ne sait pas exprimer est signalé (impossible) ou avertit
// (approximation), jamais silencieusement déformé.
//
// Nœuds : lit {v} · esc {c: d D w W s S} · cls {neg, items:[{lo,hi}|{esc}]} · any
//         seq {xs} · alt {xs} · grp {kind: cap|non|named, name, x} · q {min,max,lazy,x}
//         bol eol wb nwb · look {ahead, neg, x} · ref {n} · nref {name} · uni {neg, prop}
import { MAX_CP, MOT, CHIFFRES, BLANC, car, cp, égalPlages, fusionner } from './classes.js'

export const DIALECTES = {
  js: { nom: 'JavaScript', court: 'JavaScript' },
  pcre: { nom: 'PCRE (grep -P, PHP, Nginx)', court: 'PCRE' },
  python: { nom: 'Python (re)', court: 'Python' },
  ere: { nom: 'POSIX ERE (grep -E, sed -E)', court: 'POSIX ERE' },
  go: { nom: 'Go / RE2 (Terraform, Prometheus)', court: 'Go / RE2' },
}

// ---- Constructeurs ---------------------------------------------------------

export const lit = v => ({ t: 'lit', v })
export const esc = c => ({ t: 'esc', c })
export const ANY = { t: 'any' }
export const BOL = { t: 'bol' }
export const EOL = { t: 'eol' }
export const WB = { t: 'wb' }
export const NWB = { t: 'nwb' }
export const cls = (items, neg = false) => ({ t: 'cls', neg, items })
export const plage = (a, b = a) => ({ lo: cp(a), hi: cp(b) })
export const alt = (...xs) => ({ t: 'alt', xs: xs.flat() })
export const q = (x, min = 0, max = Infinity, lazy = false) => ({ t: 'q', min, max, lazy, x })
export const opt = x => q(x, 0, 1)
export const plus = x => q(x, 1, Infinity)
export const star = x => q(x, 0, Infinity)
export const grp = (x, name = null) => (name ? { t: 'grp', kind: 'named', name, x } : { t: 'grp', kind: 'cap', x })
export const nc = x => ({ t: 'grp', kind: 'non', x })
export const look = (x, { ahead = true, neg = false } = {}) => ({ t: 'look', ahead, neg, x })

// Séquence : aplatit les séquences imbriquées, fusionne les littéraux voisins.
export function seq(...xs) {
  const plat = []
  for (const x of xs.flat()) {
    if (!x) continue
    if (x.t === 'seq') plat.push(...x.xs)
    else plat.push(x)
  }
  const fusion = []
  for (const x of plat) {
    const d = fusion.at(-1)
    if (d && d.t === 'lit' && x.t === 'lit' && !d.raw && !x.raw) fusion[fusion.length - 1] = lit(d.v + x.v)
    else fusion.push(x)
  }
  return fusion.length === 1 ? fusion[0] : { t: 'seq', xs: fusion }
}

// Nœud pour un ensemble de plages : raccourci (\d, \w, \s) si l'ensemble correspond.
export function nœudEnsemble(plages, neg = false) {
  const f = fusionner(plages)
  if (égalPlages(f, CHIFFRES)) return esc(neg ? 'D' : 'd')
  if (égalPlages(f, MOT)) return esc(neg ? 'W' : 'w')
  if (égalPlages(f, BLANC)) return esc(neg ? 'S' : 's')
  return cls(f.map(([lo, hi]) => ({ lo, hi })), neg)
}

// ---- Parcours --------------------------------------------------------------

export function enfants(n) {
  if (n.t === 'seq' || n.t === 'alt') return n.xs
  if (n.t === 'grp' || n.t === 'q' || n.t === 'look') return [n.x]
  return []
}

export function parcourir(n, f) {
  f(n)
  for (const c of enfants(n)) parcourir(c, f)
}

// Drapeaux dont le motif a besoin (u pour \p{…} et les caractères hors BMP).
export function drapeauxNécessaires(ast) {
  const sortie = new Set()
  parcourir(ast, n => {
    if (n.t === 'uni') sortie.add('u')
    if (n.t === 'lit' && [...n.v].some(c => cp(c) > 0xffff)) sortie.add('u')
    if (n.t === 'cls' && n.items.some(i => (i.lo ?? 0) > 0xffff || (i.hi ?? 0) > 0xffff)) sortie.add('u')
  })
  return sortie
}

// Largeur fixe d'un nœud (en caractères), ou null.
export function largeurFixe(n) {
  switch (n.t) {
    case 'lit': return [...n.v].length
    case 'esc': case 'cls': case 'any': case 'uni': return 1
    case 'seq': { let s = 0; for (const x of n.xs) { const w = largeurFixe(x); if (w === null) return null; s += w } return s }
    case 'alt': { const w = n.xs.map(largeurFixe); return w.every(x => x !== null && x === w[0]) ? w[0] : null }
    case 'q': { if (n.min !== n.max) return null; const w = largeurFixe(n.x); return w === null ? null : w * n.min }
    case 'grp': return largeurFixe(n.x)
    case 'bol': case 'eol': case 'wb': case 'nwb': case 'look': return 0
    default: return null
  }
}

// ---- Émission --------------------------------------------------------------

const META = new Set('\\^$.|?*+()[]{}')
const CONTRÔLES = { 9: 't', 10: 'n', 11: 'v', 12: 'f', 13: 'r' }

function contrôle(n, ctx) {
  if (ctx.d === 'ere') { ctx.imp ||= 'Les caractères de contrôle (tabulation, saut de ligne…) ne s\'écrivent pas dans une ERE : dans le shell, utilisez $\'\\t\' ou une classe [[:space:]].'; return '' }
  return CONTRÔLES[n] ? `\\${CONTRÔLES[n]}` : `\\x${n.toString(16).padStart(2, '0')}`
}

function carHorsClasse(n, ctx) {
  const c = car(n)
  if (META.has(c)) return `\\${c}`
  if (n < 32 || n === 127) return contrôle(n, ctx)
  return c
}

function carDansClasse(n, ctx) {
  const c = car(n)
  if (c === '\\' || c === ']' || c === '[' || c === '^' || c === '-') return `\\${c}`
  if (n < 32 || n === 127) return contrôle(n, ctx)
  return c
}

// Classe POSIX (crochets) : pas d'échappement avec « \ » ; « ] » en tête, « - » en fin, « ^ » jamais en tête.
function classeERE(n, ctx) {
  let nomsPosix = []
  const plages = []
  for (const it of n.items) {
    if (it.esc) {
      if (it.esc === 'd') plages.push([48, 57])
      else if (it.esc === 'w') { nomsPosix.push('[:alnum:]'); plages.push([95, 95]) } else if (it.esc === 's') nomsPosix.push('[:space:]')
      else { ctx.imp ||= `La classe abrégée \\${it.esc} dans des crochets n'existe pas en ERE.`; return '' }
    } else plages.push([it.lo, it.hi])
  }
  nomsPosix = [...new Set(nomsPosix)]
  // « ] », « - » et « ^ » ont un rôle dans les crochets POSIX : on les retire des plages
  // (même au milieu d'une plage) et on les place à l'endroit où ils sont littéraux.
  let crochetFermant = false, tiret = false, accent = false
  const sansSpéciaux = []
  for (const [a, b] of fusionner(plages)) {
    let morceaux = [[a, b]]
    for (const spécial of [93, 45, 94]) {
      const suite = []
      for (const [x, y] of morceaux) {
        if (spécial < x || spécial > y) { suite.push([x, y]); continue }
        if (spécial === 93) crochetFermant = true
        else if (spécial === 45) tiret = true
        else accent = true
        if (x < spécial) suite.push([x, spécial - 1])
        if (spécial < y) suite.push([spécial + 1, y])
      }
      morceaux = suite
    }
    sansSpéciaux.push(...morceaux)
  }
  const parties = []
  for (const [a, b] of sansSpéciaux) {
    if (a < 32 || b < 32) { contrôle(a < 32 ? a : b, ctx); continue }
    parties.push(a === b ? car(a) : b === a + 1 ? `${car(a)}${car(b)}` : `${car(a)}-${car(b)}`)
  }
  if (accent) parties.push('^')
  const corps = (crochetFermant ? ']' : '') + parties.join('') + nomsPosix.join('') + (tiret ? '-' : '')
  // « ^ » seul en tête serait pris pour une négation.
  const sûr = !n.neg && corps.startsWith('^') ? `${corps.slice(1)}^` : corps
  return `[${n.neg ? '^' : ''}${sûr}]`
}

function classe(n, ctx) {
  if (ctx.d === 'ere') return classeERE(n, ctx)
  if (!n.neg && n.items.length === 1 && n.items[0].esc) return `\\${n.items[0].esc}`
  let s = n.neg ? '[^' : '['
  // Un tiret isolé est écrit en dernier, sans échappement : [A-Za-z0-9._%+-].
  const tiret = n.items.length > 1 && n.items.some(it => !it.esc && it.lo === 45 && it.hi === 45)
  for (const it of n.items) {
    if (tiret && !it.esc && it.lo === 45 && it.hi === 45) continue
    if (it.esc) s += `\\${it.esc}`
    else if (it.lo === it.hi) s += carDansClasse(it.lo, ctx)
    else if (it.hi === it.lo + 1) s += carDansClasse(it.lo, ctx) + carDansClasse(it.hi, ctx) // [12] plutôt que [1-2]
    else s += `${carDansClasse(it.lo, ctx)}-${carDansClasse(it.hi, ctx)}`
  }
  return `${s}${tiret ? '-' : ''}]`
}

const ESC_ERE = { d: '[0-9]', D: '[^0-9]', w: '[[:alnum:]_]', W: '[^[:alnum:]_]', s: '[[:space:]]', S: '[^[:space:]]' }

function quantificateur(min, max, lazy, ctx) {
  let s
  if (min === 0 && max === Infinity) s = '*'
  else if (min === 1 && max === Infinity) s = '+'
  else if (min === 0 && max === 1) s = '?'
  else if (min === max) s = min === 1 ? '' : `{${min}}`
  else if (max === Infinity) s = `{${min},}`
  else s = `{${min},${max}}`
  if (lazy && s) {
    if (ctx.d === 'ere') ctx.avert.add('Quantificateur paresseux (?) non supporté en ERE : la version gloutonne est utilisée (même décision oui/non, extraction parfois plus longue).')
    else s += '?'
  }
  return s
}

const enGroupeSansCapture = (s, ctx) => (ctx.d === 'ere' ? `(${s})` : `(?:${s})`)

function é(n, ctx, parent = null) {
  const d = ctx.d
  switch (n.t) {
    case 'lit': return [...n.v].map(c => carHorsClasse(cp(c), ctx)).join('')
    case 'esc': return d === 'ere' ? ESC_ERE[n.c] : `\\${n.c}`
    case 'any': return '.'
    case 'cls': return classe(n, ctx)
    case 'bol': return '^'
    case 'eol': return '$'
    case 'wb': case 'nwb': {
      if (d === 'ere') ctx.avert.add('\\b est une extension GNU (grep, sed) : absente de POSIX strict (BSD/macOS).')
      return n.t === 'wb' ? '\\b' : '\\B'
    }
    case 'seq': return n.xs.map(x => é(x, ctx, 'seq')).join('')
    case 'alt': {
      const s = n.xs.map(x => é(x, ctx, null)).join('|')
      return parent === 'seq' || parent === 'q' ? enGroupeSansCapture(s, ctx) : s
    }
    case 'q': {
      const x = n.x
      const simple = x.t === 'esc' || x.t === 'cls' || x.t === 'any' || x.t === 'grp' || x.t === 'uni' || x.t === 'ref' || x.t === 'nref' || (x.t === 'lit' && [...x.v].length === 1)
      const corps = é(x, ctx, 'q')
      // Une alternative est déjà entourée de parenthèses par l'appel ci-dessus (parent « q »).
      const sortie = simple || x.t === 'alt' ? corps : enGroupeSansCapture(corps, ctx)
      return sortie + quantificateur(n.min, n.max, n.lazy, ctx)
    }
    case 'grp': {
      const s = é(n.x, ctx, null)
      if (n.kind === 'non') return enGroupeSansCapture(s, ctx)
      if (n.kind === 'cap') return `(${s})`
      if (d === 'ere') { ctx.avert.add('Groupes nommés non supportés en ERE : ils deviennent des groupes numérotés.'); return `(${s})` }
      return d === 'python' || d === 'go' ? `(?P<${n.name}>${s})` : `(?<${n.name}>${s})`
    }
    case 'look': {
      if (d === 'ere' || d === 'go') { ctx.imp ||= `${d === 'go' ? 'RE2 (Go)' : 'POSIX ERE'} n'a pas d'assertions avant/arrière (lookahead/lookbehind) : reformulez avec un groupe de capture, ou utilisez PCRE/Python/JavaScript.`; return '' }
      if (!n.ahead) {
        const w = largeurFixe(n.x)
        if (w === null && (d === 'python' || d === 'pcre')) ctx.avert.add(`${d === 'python' ? 'Python' : 'PCRE'} exige un lookbehind de largeur fixe : ce motif a une largeur variable et sera refusé.`)
      }
      return `(?${n.ahead ? '' : '<'}${n.neg ? '!' : '='}${é(n.x, ctx, null)})`
    }
    case 'ref': {
      if (d === 'go') { ctx.imp ||= 'RE2 (Go) ne supporte pas les références arrière (\\1).'; return '' }
      if (d === 'ere') ctx.avert.add('Les références arrière (\\1) sont une extension GNU en ERE.')
      return `\\${n.n}`
    }
    case 'nref': {
      if (d === 'go') { ctx.imp ||= 'RE2 (Go) ne supporte pas les références arrière.'; return '' }
      if (d === 'ere') { ctx.imp ||= 'Références arrière nommées impossibles en ERE.'; return '' }
      return d === 'python' ? `(?P=${n.name})` : `\\k<${n.name}>`
    }
    case 'uni': {
      if (d === 'ere') { ctx.imp ||= 'Les propriétés Unicode (\\p{…}) n\'existent pas en ERE.'; return '' }
      if (d === 'python') { ctx.imp ||= 'Le module re de Python ne supporte pas \\p{…} (il faut le module tiers « regex »).'; return '' }
      return `\\${n.neg ? 'P' : 'p'}{${n.prop}}`
    }
    default: throw new Error(`Nœud inconnu : ${n.t}`)
  }
}

// Écrit un arbre pour un dialecte : { pattern, avertissements, impossible }.
export function émettre(ast, dialecte = 'js') {
  const ctx = { d: dialecte, avert: new Set(), imp: null }
  const pattern = é(ast, ctx, null)
  return { pattern: ctx.imp ? '' : pattern, avertissements: [...ctx.avert], impossible: ctx.imp }
}

// Drapeaux : écriture propre à chaque dialecte.
export function traduireDrapeaux(flags, dialecte) {
  const s = new Set(flags)
  const i = s.has('i'), m = s.has('m'), dot = s.has('s')
  const avertissements = []
  const r = { js: [...s].join(''), préfixe: '', python: [], grep: [], avertissements }
  const inline = `${i ? 'i' : ''}${m ? 'm' : ''}${dot ? 's' : ''}`
  if (dialecte === 'pcre' || dialecte === 'go') r.préfixe = inline ? `(?${inline})` : ''
  if (dialecte === 'python') r.python = [i && 're.IGNORECASE', m && 're.MULTILINE', dot && 're.DOTALL'].filter(Boolean)
  if (dialecte === 'ere') {
    if (i) r.grep.push('-i')
    if (dot) avertissements.push('Le drapeau s (le point inclut le saut de ligne) n\'a pas d\'équivalent en ERE : grep et sed travaillent ligne par ligne.')
  }
  if (dialecte === 'pcre' && m) avertissements.push('grep -P travaille ligne par ligne : le drapeau m ne change rien, sauf avec grep -z.')
  return r
}

// Écriture « /motif/drapeaux » de JavaScript (la barre oblique est échappée).
export function littéralJs(pattern, flags = '') {
  let sortie = ''
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    if (c === '\\') { sortie += c + (pattern[i + 1] ?? ''); i++; continue }
    sortie += c === '/' ? '\\/' : c
  }
  return `/${sortie}/${flags}`
}

export { MAX_CP }
