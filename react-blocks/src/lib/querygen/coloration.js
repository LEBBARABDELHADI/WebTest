// Coloration des éditeurs du Query Generator : JSON (jetons du lecteur JSON),
// jq et JMESPath (lecture légère, tolérante aux requêtes en cours d'écriture).
import { colorerJson } from './json.js'

export const PALETTES = {
  sombre: { regexEchap: '#f78c6c', regexClasse: '#a5d6a7', regexGroupe: '#c792ea', regexQuant: '#f9a66c', regexAncre: '#ff6b6b', regexAlt: '#89ddff', regexPoint: '#ffcb6b', match1: 'rgba(240,168,57,.42)', match2: 'rgba(91,141,201,.5)', clé: '#89ddff', chaîne: '#a5d6a7', nombre: '#f9a66c', littéral: '#c792ea', ouvrant: '#8a94ad', fermant: '#8a94ad', virgule: '#8a94ad', deuxpoints: '#8a94ad', erreur: '#ff6b6b', champ: '#82aaff', fonction: '#c792ea', mot: '#ffcb6b', op: '#89ddff', variable: '#f78c6c', ponct: '#8a94ad', commentaire: '#7a869e' },
  clair: { regexEchap: '#b1500a', regexClasse: '#1d7a34', regexGroupe: '#7a3db0', regexQuant: '#b1500a', regexAncre: '#c8362a', regexAlt: '#0b5cad', regexPoint: '#8f5f00', match1: 'rgba(201,116,10,.3)', match2: 'rgba(11,92,173,.28)', clé: '#0b5cad', chaîne: '#1d7a34', nombre: '#b1500a', littéral: '#7a3db0', ouvrant: '#7c7160', fermant: '#7c7160', virgule: '#7c7160', deuxpoints: '#7c7160', erreur: '#c8362a', champ: '#0b5cad', fonction: '#7a3db0', mot: '#8f5f00', op: '#0b5cad', variable: '#b1500a', ponct: '#7c7160', commentaire: '#8b8170' },
}

const MOTS_JQ = new Set(['and', 'or', 'not', 'if', 'then', 'elif', 'else', 'end', 'as', 'def', 'reduce', 'foreach', 'try', 'catch', 'label', 'import', 'include', 'true', 'false', 'null'])
const RE_JQ = /("(?:[^"\\]|\\.)*"?)|(#[^\n]*)|(\.\.|\.(?:[A-Za-z_][A-Za-z0-9_]*|"(?:[^"\\]|\\.)*"?)?)|(\$[A-Za-z_][A-Za-z0-9_]*|\$__loc__)|(@[A-Za-z0-9]+)|(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)|(\?\/\/|\|=|\/\/=?|==|!=|<=|>=|[|,+\-*/%=<>?])|([()[\]{}:;])|(\s+)|(.)/gy
const RE_JMES = /('(?:[^'\\]|\\.)*'?)|(`(?:[^`\\]|\\.)*`?)|("(?:[^"\\]|\\.)*"?)|(-?\d+)|([A-Za-z_][A-Za-z0-9_]*)|(==|!=|<=|>=|&&|\|\||[<>!|&@*])|([()[\]{}.,:?])|(\s+)|(.)/gy

function scanner(texte, re, classer) {
  const sortie = []
  re.lastIndex = 0
  let m
  while (re.lastIndex < texte.length && (m = re.exec(texte))) {
    const t = classer(m, texte, re.lastIndex)
    const dernier = sortie.at(-1)
    if (dernier && dernier.t === t) dernier.texte += m[0]
    else sortie.push({ t, texte: m[0] })
  }
  return sortie
}

export function colorerJq(texte) {
  return scanner(texte, RE_JQ, (m, src, fin) => {
    if (m[1]) return 'chaîne'
    if (m[2]) return 'commentaire'
    if (m[3]) return 'champ'
    if (m[4]) return 'variable'
    if (m[5]) return 'fonction'
    if (m[6]) return 'nombre'
    if (m[7]) {
      if (MOTS_JQ.has(m[7])) return m[7] === 'true' || m[7] === 'false' || m[7] === 'null' ? 'littéral' : 'mot'
      return /^\s*:/.test(src.slice(fin)) ? 'clé' : 'fonction'
    }
    if (m[8]) return 'op'
    if (m[9]) return 'ponct'
    return 'texte'
  })
}

export function colorerJmes(texte) {
  return scanner(texte, RE_JMES, (m, src, fin) => {
    if (m[1]) return 'chaîne'
    if (m[2]) return 'littéral'
    if (m[3]) return 'champ'
    if (m[4]) return 'nombre'
    if (m[5]) return /^\s*\(/.test(src.slice(fin)) ? 'fonction' : /^\s*:/.test(src.slice(fin)) ? 'clé' : 'champ'
    if (m[6]) return 'op'
    if (m[7]) return 'ponct'
    return 'texte'
  })
}

// Regex (syntaxe JavaScript) : échappements, classes, groupes, quantificateurs, ancres, alternatives.
const RE_REGEX = /(\\(?:[bB]|k<[^>]*>|[pP]\{[^}]*\}|u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S]))|(\[\^?(?:\\[\s\S]|[^\]\\])*\]?)|(\(\?(?:<[=!]|[:=!]|<[A-Za-z_$][\w$]*>)|[()])|([*+?]\??|\{\d+(?:,\d*)?\}\??)|([\^$])|(\|)|(\.)|([\s\S])/gy

export function colorerRegex(texte) {
  return scanner(texte, RE_REGEX, m => {
    if (m[1]) return /^\\[bB]$/.test(m[1]) ? 'regexAncre' : 'regexEchap'
    if (m[2]) return 'regexClasse'
    if (m[3]) return 'regexGroupe'
    if (m[4]) return 'regexQuant'
    if (m[5]) return 'regexAncre'
    if (m[6]) return 'regexAlt'
    if (m[7]) return 'regexPoint'
    return 'texte'
  })
}

// Surlignage des correspondances d'un test : segments alternés match1 / match2.
export function colorerCorrespondances(texte, correspondances) {
  const segments = []
  let position = 0
  let alternance = 0
  for (const c of correspondances) {
    if (c.fin <= c.debut || c.debut < position) continue
    if (c.debut > position) segments.push({ t: 'texte', texte: texte.slice(position, c.debut) })
    segments.push({ t: alternance++ % 2 ? 'match2' : 'match1', texte: texte.slice(c.debut, c.fin) })
    position = c.fin
  }
  if (position < texte.length) segments.push({ t: 'texte', texte: texte.slice(position) })
  return segments.length ? segments : [{ t: 'texte', texte }]
}

export const COLORATIONS = { json: colorerJson, jq: colorerJq, jmespath: colorerJmes, regex: colorerRegex }
