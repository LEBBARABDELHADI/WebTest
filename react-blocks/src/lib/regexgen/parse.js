// Lecture d'une expression régulière JavaScript (syntaxe ECMAScript) : produit
// l'arbre de ast.js avec la position de chaque nœud dans le texte, et des
// erreurs en français avec leur position. Sert à expliquer, convertir et
// générer des exemples pour un motif écrit ou modifié à la main.
import { cp } from './classes.js'

export class ErreurRegex extends Error {
  constructor(message, position = 0) {
    super(message)
    this.name = 'ErreurRegex'
    this.position = position
  }
}

const ACCOLADES = /^\{(\d+)(?:(,)(\d*))?\}/

// Nombre de groupes capturants (pour distinguer \1 d'un échappement).
function compterCapturantes(src) {
  let n = 0, dansClasse = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === '\\') { i++; continue }
    if (dansClasse) { if (c === ']') dansClasse = false; continue }
    if (c === '[') { dansClasse = true; continue }
    if (c === '(') {
      if (src[i + 1] !== '?') n++
      else if (src[i + 2] === '<' && src[i + 3] !== '=' && src[i + 3] !== '!') n++
    }
  }
  return n
}

export function analyserRegex(src, flags = '') {
  const unicode = /[uv]/.test(flags)
  const n = src.length
  const totalCapturantes = compterCapturantes(src)
  const groupes = []
  const noms = new Set()
  let i = 0
  let compteur = 0

  const échec = (message, position = i) => { throw new ErreurRegex(message, position) }

  // Caractère après « \ » (hors classes abrégées) : renvoie un point de code, ou null si ce n'est pas un caractère.
  function codeÉchappé(e) {
    switch (e) {
      case 'n': return 10
      case 'r': return 13
      case 't': return 9
      case 'f': return 12
      case 'v': return 11
      case '0': return 0
      case 'x': {
        const m = /^[0-9a-fA-F]{2}/.exec(src.slice(i))
        if (m) { i += 2; return parseInt(m[0], 16) }
        if (unicode) échec('Séquence \\x incomplète : deux chiffres hexadécimaux attendus (\\xHH).', i - 2)
        return cp('x')
      }
      case 'u': {
        let m = /^\{([0-9a-fA-F]+)\}/.exec(src.slice(i))
        if (m && unicode) { i += m[0].length; return parseInt(m[1], 16) }
        m = /^[0-9a-fA-F]{4}/.exec(src.slice(i))
        if (m) { i += 4; return parseInt(m[0], 16) }
        if (unicode) échec('Séquence \\u incomplète : quatre chiffres hexadécimaux attendus (\\uHHHH).', i - 2)
        return cp('u')
      }
      case 'c': {
        const m = /^[A-Za-z]/.exec(src.slice(i))
        if (m) { i += 1; return m[0].toUpperCase().charCodeAt(0) % 32 }
        return cp('c')
      }
      default: return cp(e)
    }
  }

  function disjonction(prof) {
    const début = i
    const xs = [séquence(prof)]
    while (src[i] === '|') { i++; xs.push(séquence(prof)) }
    return xs.length === 1 ? xs[0] : { t: 'alt', xs, pos: [début, i] }
  }

  function séquence(prof) {
    const début = i
    const xs = []
    while (i < n && src[i] !== '|') {
      if (src[i] === ')') {
        if (prof === 0) échec('Parenthèse fermante « ) » sans parenthèse ouvrante.', i)
        break
      }
      xs.push(quantifié(prof))
    }
    return xs.length === 1 ? xs[0] : { t: 'seq', xs, pos: [début, i] }
  }

  function quantifié(prof) {
    const début = i
    let atome = atome1(prof)
    const c = src[i]
    let min = null, max = null
    if (c === '*') { min = 0; max = Infinity; i++ } else if (c === '+') { min = 1; max = Infinity; i++ } else if (c === '?') { min = 0; max = 1; i++ } else if (c === '{') {
      const m = ACCOLADES.exec(src.slice(i))
      if (m) {
        min = Number(m[1])
        max = m[2] ? (m[3] === '' ? Infinity : Number(m[3])) : min
        if (max < min) échec(`Quantificateur {${m[1]},${m[3]}} invalide : le minimum dépasse le maximum.`, i)
        i += m[0].length
      }
    }
    if (min === null) return atome
    if (atome.t === 'bol' || atome.t === 'eol' || atome.t === 'wb' || atome.t === 'nwb') échec('Un quantificateur ne peut pas suivre une ancre (^, $, \\b).', début)
    let lazy = false
    if (src[i] === '?') { lazy = true; i++ }
    atome = { t: 'q', min, max, lazy, x: atome, pos: [début, i] }
    const s = src[i]
    if (s === '*' || s === '+' || s === '?' || (s === '{' && ACCOLADES.test(src.slice(i)))) échec('Deux quantificateurs à la suite : le second n\'a rien à répéter (les quantificateurs possessifs, comme a++, n\'existent pas en JavaScript).', i)
    return atome
  }

  function atome1(prof) {
    const début = i
    const c = src[i]
    if (c === '(') return groupe(prof)
    if (c === '[') return classe()
    if (c === '\\') return échappement()
    if (c === '.') { i++; return { t: 'any', pos: [début, i] } }
    if (c === '^') { i++; return { t: 'bol', pos: [début, i] } }
    if (c === '$') { i++; return { t: 'eol', pos: [début, i] } }
    if (c === '*' || c === '+' || c === '?') échec(`Le quantificateur « ${c} » n'a rien à répéter : placez-le après un caractère, un groupe ou une classe.`, i)
    if (c === '{' && ACCOLADES.test(src.slice(i))) échec('Le quantificateur « {…} » n\'a rien à répéter.', i)
    if (unicode && (c === '{' || c === '}' || c === ']')) échec(`« ${c} » isolé : échappez-le (\\${c}).`, i)
    const point = src.codePointAt(i)
    i += point > 0xffff ? 2 : 1
    return { t: 'lit', v: String.fromCodePoint(point), pos: [début, i] }
  }

  function groupe(prof) {
    const début = i
    i++
    let kind = 'cap', nom = null, assertion = null
    if (src[i] === '?') {
      const reste = src.slice(i)
      let m
      if (reste.startsWith('?:')) { kind = 'non'; i += 2 } else if (reste.startsWith('?=')) { assertion = { ahead: true, neg: false }; i += 2 } else if (reste.startsWith('?!')) { assertion = { ahead: true, neg: true }; i += 2 } else if (reste.startsWith('?<=')) { assertion = { ahead: false, neg: false }; i += 3 } else if (reste.startsWith('?<!')) { assertion = { ahead: false, neg: true }; i += 3 } else if ((m = /^\?<([A-Za-z_$][\w$]*)>/.exec(reste))) { kind = 'named'; nom = m[1]; i += m[0].length } else if (reste.startsWith('?P<')) échec('« (?P<nom>…) » est la syntaxe de Python/PCRE : en JavaScript, écrivez (?<nom>…).', début)
      else if (/^\?[imsx-]+[:)]/.test(reste)) échec('Les drapeaux en ligne comme (?i) ne sont pas supportés en JavaScript : utilisez les drapeaux du motif (ex. /…/i).', début)
      else échec('Groupe invalide après « (? » : attendu (?: (?= (?! (?<= (?<! ou (?<nom>.', début)
    }
    let num = null
    if (kind === 'cap' || kind === 'named') {
      num = ++compteur
      if (nom) {
        if (noms.has(nom)) échec(`Nom de groupe « ${nom} » utilisé deux fois.`, début)
        noms.add(nom)
      }
      groupes.push({ num, nom })
    }
    const x = disjonction(prof + 1)
    if (src[i] !== ')') échec('Parenthèse ouvrante « ( » jamais fermée : il manque « ) ».', début)
    i++
    return assertion ? { t: 'look', ahead: assertion.ahead, neg: assertion.neg, x, pos: [début, i] } : { t: 'grp', kind, name: nom, num, x, pos: [début, i] }
  }

  function élémentClasse() {
    const c = src[i]
    if (c === '\\') {
      const e = src[i + 1]
      if (e === undefined) échec('Séquence d\'échappement incomplète : « \\ » en fin de motif.', i)
      i += 2
      if ('dDwWsS'.includes(e)) return { esc: e }
      if (e === 'b') return { cp: 8 }
      return { cp: codeÉchappé(e) }
    }
    const point = src.codePointAt(i)
    i += point > 0xffff ? 2 : 1
    return { cp: point }
  }

  function classe() {
    const début = i
    i++
    let neg = false
    if (src[i] === '^') { neg = true; i++ }
    const items = []
    let fermée = false
    while (i < n) {
      if (src[i] === ']') { i++; fermée = true; break }
      const a = élémentClasse()
      if (src[i] === '-' && src[i + 1] !== undefined && src[i + 1] !== ']') {
        const tiret = i
        i++
        const b = élémentClasse()
        if (a.esc || b.esc) {
          if (unicode) échec('Plage invalide dans une classe : une classe abrégée (\\d, \\w…) ne peut pas être une borne.', tiret)
          items.push(a.esc ? { esc: a.esc } : { lo: a.cp, hi: a.cp }, { lo: 45, hi: 45 }, b.esc ? { esc: b.esc } : { lo: b.cp, hi: b.cp })
        } else {
          if (a.cp > b.cp) échec(`Plage invalide dans une classe : « ${String.fromCodePoint(a.cp)}-${String.fromCodePoint(b.cp)} » (le début vient après la fin).`, tiret - 1)
          items.push({ lo: a.cp, hi: b.cp })
        }
      } else items.push(a.esc ? { esc: a.esc } : { lo: a.cp, hi: a.cp })
    }
    if (!fermée) échec('Crochet « [ » jamais fermé : il manque « ] ».', début)
    return { t: 'cls', neg, items, pos: [début, i] }
  }

  function échappement() {
    const début = i
    const e = src[i + 1]
    if (e === undefined) échec('Séquence d\'échappement incomplète : « \\ » en fin de motif.', i)
    i += 2
    if ('dDwWsS'.includes(e)) return { t: 'esc', c: e, pos: [début, i] }
    if (e === 'b') return { t: 'wb', pos: [début, i] }
    if (e === 'B') return { t: 'nwb', pos: [début, i] }
    if (e >= '1' && e <= '9') {
      let num = e
      let j = i
      while (/\d/.test(src[j] ?? '') && Number(num + src[j]) <= totalCapturantes) { num += src[j]; j++ }
      if (Number(num) <= totalCapturantes) { i = j; return { t: 'ref', n: Number(num), pos: [début, i] } }
      if (unicode) échec(`Référence arrière \\${e} vers un groupe qui n'existe pas (le motif a ${totalCapturantes} groupe(s) capturant(s)).`, début)
      return { t: 'lit', v: e, raw: `\\${e}`, pos: [début, i] }
    }
    if (e === 'k' && src[i] === '<') {
      const m = /^<([A-Za-z_$][\w$]*)>/.exec(src.slice(i))
      if (!m) échec('Référence « \\k<nom> » mal formée.', début)
      i += m[0].length
      return { t: 'nref', name: m[1], pos: [début, i] }
    }
    if ((e === 'p' || e === 'P') && unicode) {
      const m = /^\{([^}]+)\}/.exec(src.slice(i))
      if (!m) échec('Propriété Unicode mal formée : écrivez \\p{Lettre}, \\p{L}, \\p{Script=Latin}…', début)
      i += m[0].length
      return { t: 'uni', neg: e === 'P', prop: m[1], pos: [début, i] }
    }
    const point = codeÉchappé(e)
    return { t: 'lit', v: String.fromCodePoint(point), raw: src.slice(début, i), pos: [début, i] }
  }

  const ast = disjonction(0)
  if (i < n) échec('Parenthèse fermante « ) » sans parenthèse ouvrante.', i)
  const noeud = ast.pos ? ast : { ...ast, pos: [0, n] }
  // Contrôle final par le moteur lui-même (ce que l'analyseur ne détecterait pas).
  try {
    new RegExp(src, flags)
  } catch (e) {
    throw new ErreurRegex(`Le moteur JavaScript refuse ce motif : ${e.message.replace(/^Invalid regular expression: \/.*\/[a-z]*: /, '')}`, 0)
  }
  return { ast: noeud, groupes, nGroupes: compteur }
}

// Texte d'un nœud dans le motif d'origine.
export const extrait = (src, nœud) => (nœud.pos ? src.slice(nœud.pos[0], nœud.pos[1]) : '')
