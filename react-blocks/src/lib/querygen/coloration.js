// Coloration des éditeurs du Query Generator : JSON (jetons du lecteur JSON),
// jq et JMESPath (lecture légère, tolérante aux requêtes en cours d'écriture).
import { colorerJson } from './json.js'

export const PALETTES = {
  sombre: { clé: '#89ddff', chaîne: '#a5d6a7', nombre: '#f9a66c', littéral: '#c792ea', ouvrant: '#8a94ad', fermant: '#8a94ad', virgule: '#8a94ad', deuxpoints: '#8a94ad', erreur: '#ff6b6b', champ: '#82aaff', fonction: '#c792ea', mot: '#ffcb6b', op: '#89ddff', variable: '#f78c6c', ponct: '#8a94ad', commentaire: '#7a869e' },
  clair: { clé: '#0b5cad', chaîne: '#1d7a34', nombre: '#b1500a', littéral: '#7a3db0', ouvrant: '#7c7160', fermant: '#7c7160', virgule: '#7c7160', deuxpoints: '#7c7160', erreur: '#c8362a', champ: '#0b5cad', fonction: '#7a3db0', mot: '#8f5f00', op: '#0b5cad', variable: '#b1500a', ponct: '#7c7160', commentaire: '#8b8170' },
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

export const COLORATIONS = { json: colorerJson, jq: colorerJq, jmespath: colorerJmes }
