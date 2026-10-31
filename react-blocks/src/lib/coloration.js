// Coloration syntaxique légère (sans bibliothèque) : découpe un code en
// morceaux typés (commentaire, chaîne, mot-clé…) selon le langage. Sert à
// l'affichage des blocs de code et à l'export PDF.

export const COULEURS_CODE = {
  texte: '#e2e8f0',
  commentaire: '#7a869e',
  chaîne: '#a5d6a7',
  nombre: '#f9a66c',
  motClé: '#c792ea',
  fonction: '#82aaff',
  balise: '#f07178',
  attribut: '#ffcb6b',
  clé: '#89ddff',
  variable: '#f78c6c',
  option: '#89ddff',
  annotation: '#ffcb6b',
}

const MOTS = {
  js: 'break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await null undefined true false interface type enum implements public private protected readonly static as',
  python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield self',
  java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws transient try void volatile while null true false var String using namespace override virtual async await get set',
  bash: 'if then else elif fi for while do done case esac function in return local export source echo cd sudo mvn npm npx git cat grep ls mkdir rm cp mv chmod curl docker java node python pip kubectl helm terraform systemctl journalctl find ps kill df du free ss tail head awk sed tar ssh scp openssl',
  sql: 'select from where insert into values update set delete create table drop alter add join left right inner outer full on group by order having limit offset as and or not null is in like distinct count sum avg max min primary key foreign references index view union all exists between case when then else end asc desc default',
  php: 'abstract and array as break case catch class clone const continue declare default do echo else elseif empty extends final finally fn for foreach function global if implements include instanceof interface isset list namespace new or print private protected public require return static switch throw trait try unset use var while null true false',
}

function famille(langage) {
  const l = (langage || '').toLowerCase()
  if (['javascript', 'typescript', 'js', 'ts', 'hcl', 'terraform', 'tf', 'groovy', 'jenkinsfile'].includes(l)) return 'js'
  if (l === 'python') return 'python'
  if (l === 'java' || l === 'c#') return 'java'
  if (['bash', 'sh', 'shell', 'zsh', 'console', 'dockerfile', 'docker', 'kubectl', 'git'].includes(l)) return 'bash'
  if (l === 'sql') return 'sql'
  if (l === 'php') return 'php'
  if (l === 'html' || l === 'xml') return 'balisage'
  if (l === 'css') return 'css'
  if (l === 'json') return 'json'
  if (l === 'yaml' || l === 'yml' || l === 'k8s' || l === 'helm') return 'yaml'
  return 'générique'
}

const CHAÎNES = String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`
const NOMBRE = String.raw`\b\d+(?:\.\d+)?\b`
const mots = liste => String.raw`\b(?:${liste.split(' ').join('|')})\b`

// Motifs dans l'ordre de priorité : [type, source].
function motifs(f) {
  const fonction = ['fonction', String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`]
  switch (f) {
    case 'js': return [['commentaire', String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`], ['chaîne', `${CHAÎNES}|\`[\\s\\S]*?\``], ['annotation', String.raw`@\w+`], ['nombre', NOMBRE], ['motClé', mots(MOTS.js)], fonction]
    case 'python': return [['commentaire', '#[^\\n]*'], ['chaîne', `"""[\\s\\S]*?"""|'''[\\s\\S]*?'''|${CHAÎNES}`], ['annotation', String.raw`@\w+`], ['nombre', NOMBRE], ['motClé', mots(MOTS.python)], fonction]
    case 'java': return [['commentaire', String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`], ['chaîne', CHAÎNES], ['annotation', String.raw`@\w+`], ['nombre', NOMBRE], ['motClé', mots(MOTS.java)], fonction]
    case 'php': return [['commentaire', String.raw`\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/`], ['chaîne', CHAÎNES], ['variable', String.raw`\$\w+`], ['nombre', NOMBRE], ['motClé', mots(MOTS.php)], fonction]
    case 'bash': return [['commentaire', '(?:^|(?<=\\s))#[^\\n]*'], ['chaîne', CHAÎNES], ['variable', String.raw`\$\{?\w+\}?`], ['option', String.raw`(?<=\s)--?[\w-]+`], ['nombre', NOMBRE], ['motClé', mots(MOTS.bash)]]
    case 'sql': return [['commentaire', String.raw`--[^\n]*|\/\*[\s\S]*?\*\/`], ['chaîne', CHAÎNES], ['nombre', NOMBRE], ['motClé', mots(MOTS.sql)], fonction]
    case 'balisage': return [['commentaire', '<!--[\\s\\S]*?-->'], ['chaîne', CHAÎNES], ['balise', String.raw`<\/?[A-Za-z][\w:.-]*|\/?>`], ['attribut', String.raw`\b[\w:-]+(?==)`]]
    case 'css': return [['commentaire', String.raw`\/\*[\s\S]*?\*\/`], ['chaîne', CHAÎNES], ['clé', String.raw`[\w-]+(?=\s*:)`], ['nombre', String.raw`#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|em|rem|%|s|ms|vh|vw)?\b`], ['balise', String.raw`[.#]?[A-Za-z][\w-]*(?=[^{}\n]*\{)`]]
    case 'json': return [['clé', String.raw`"(?:\\.|[^"\\\n])*"(?=\s*:)`], ['chaîne', CHAÎNES], ['nombre', String.raw`-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`], ['motClé', String.raw`\b(?:true|false|null)\b`]]
    case 'yaml': return [['commentaire', '#[^\\n]*'], ['clé', String.raw`^[ \t-]*[\w.\-/]+(?=\s*:)`], ['chaîne', CHAÎNES], ['nombre', NOMBRE], ['motClé', String.raw`\b(?:true|false|null|yes|no)\b`]]
    default: return [['commentaire', String.raw`\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/`], ['chaîne', CHAÎNES], ['nombre', NOMBRE], fonction]
  }
}

const cache = new Map()
function expression(f) {
  if (!cache.has(f)) {
    const liste = motifs(f)
    const source = liste.map(([, m]) => `(${m})`).join('|')
    cache.set(f, { regex: new RegExp(source, `gm${f === 'sql' ? 'i' : ''}`), types: liste.map(([t]) => t) })
  }
  return cache.get(f)
}

// Code → lignes de morceaux [{ texte, type }].
export function colorerCode(code, langage) {
  const { regex, types } = expression(famille(langage))
  const morceaux = []
  let dernier = 0
  regex.lastIndex = 0
  let m
  while ((m = regex.exec(code)) !== null) {
    if (m[0] === '') { regex.lastIndex += 1; continue }
    if (m.index > dernier) morceaux.push({ texte: code.slice(dernier, m.index), type: 'texte' })
    const groupe = m.slice(1).findIndex(g => g !== undefined)
    morceaux.push({ texte: m[0], type: types[groupe] || 'texte' })
    dernier = m.index + m[0].length
  }
  if (dernier < code.length) morceaux.push({ texte: code.slice(dernier), type: 'texte' })
  // Découpe par ligne (un commentaire /* */ peut en couvrir plusieurs).
  const lignes = [[]]
  morceaux.forEach(({ texte, type }) => {
    texte.split('\n').forEach((partie, i) => {
      if (i > 0) lignes.push([])
      if (partie) lignes[lignes.length - 1].push({ texte: partie, type })
    })
  })
  return lignes
}

const échapper = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Version HTML (export PDF).
export function codeEnHTML(code, langage) {
  return colorerCode(code, langage).map(ligne => ligne.map(({ texte, type }) => (
    type === 'texte' ? échapper(texte) : `<span style="color:${COULEURS_CODE[type]}${type === 'commentaire' ? ';font-style:italic' : ''}">${échapper(texte)}</span>`
  )).join('')).join('\n')
}
