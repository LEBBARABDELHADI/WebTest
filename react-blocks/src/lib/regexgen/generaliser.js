// Généralisation d'exemples : à partir de quelques chaînes, retrouve un format
// connu du catalogue (en les exécutant toutes) ou construit un motif par champs
// (chiffres, lettres, séparateurs, longueurs observées).
import { ANY, alt, cls, esc, lit, nc, plage, q, seq } from './ast.js'
import { CATALOGUE, arbreEntité } from './catalogue.js'
import { émettre } from './ast.js'

// Chaînes de sondage : plus un format en accepte, plus il est général.
const SONDES = ['a', 'abc', 'hello world', '12', '1234567', '2024-01-01', 'a-b', 'foo.bar', 'x@y.zz', '192.168.1.1', '#fff', 'AB', 'ab12', '12ab', 'A1', '/etc', 'v1.2.3', '1.5', '-3', '+33', 'GET', 'a_b', 'a b', '00', '0', '9999', '12:30', 'FR76', 'i-0a1b2c3d', 'eu-west-3', '10.0.0.0/16']

const estChiffre = c => c >= '0' && c <= '9'
const estMajuscule = c => /\p{Lu}/u.test(c)
const estMinuscule = c => /\p{Ll}/u.test(c)
const estAlphanum = c => estChiffre(c) || /\p{L}/u.test(c)
const ASCII_LETTRE = /[A-Za-z]/

function classeChamp(valeurs) {
  const tous = valeurs.join('')
  const D = [...tous].some(estChiffre)
  const U = [...tous].some(c => estMajuscule(c) && ASCII_LETTRE.test(c))
  const L = [...tous].some(c => estMinuscule(c) && ASCII_LETTRE.test(c))
  const accents = [...tous].some(c => /\p{L}/u.test(c) && !ASCII_LETTRE.test(c))
  const items = []
  if (U) items.push(plage('A', 'Z'))
  if (L) items.push(plage('a', 'z'))
  if (accents) items.push({ lo: 0xc0, hi: 0xd6 }, { lo: 0xd8, hi: 0xf6 }, { lo: 0xf8, hi: 0xff })
  if (D) items.push(plage('0', '9'))
  if (D && !U && !L && !accents) return { nœud: esc('d'), nom: 'chiffres' }
  const nom = D ? (U || L ? 'lettres et chiffres' : 'chiffres') : U && L ? 'lettres' : U ? 'majuscules' : L ? 'minuscules' : 'caractères'
  return { nœud: cls(items), nom }
}

// Découpe « AB-1234 » en champs alphanumériques et séparateurs.
function découpe(s) {
  const champs = []
  const seps = []
  let cur = ''
  for (const c of s) {
    if (estAlphanum(c)) cur += c
    else { champs.push(cur); seps.push(c); cur = '' }
  }
  champs.push(cur)
  return { champs, seps }
}

function structure(exemples) {
  const parts = exemples.map(découpe)
  const nChamps = parts[0].champs.length
  const xs = []
  const détails = []
  for (let i = 0; i < nChamps; i++) {
    const valeurs = parts.map(p => p.champs[i])
    const longueurs = valeurs.map(v => [...v].length)
    const min = Math.min(...longueurs), max = Math.max(...longueurs)
    const constante = exemples.length >= 2 && valeurs.every(v => v === valeurs[0]) && valeurs[0] !== ''
    if (constante) { xs.push(lit(valeurs[0])); détails.push({ texte: `champ ${i + 1} : toujours « ${valeurs[0]} » → ${valeurs[0]}`, littéral: true }); }
    else if (max === 0) { /* champ vide partout */ }
    else {
      const { nœud, nom } = classeChamp(valeurs)
      const n = min === max ? q(nœud, min, min) : q(nœud, min, max)
      xs.push(min === 1 && max === 1 ? nœud : n)
      détails.push({ texte: `champ ${i + 1} : ${min === max ? min : `${min} à ${max}`} ${nom} → ${émettre(min === 1 && max === 1 ? nœud : n, 'js').pattern}` })
    }
    if (i < nChamps - 1) xs.push(lit(parts[0].seps[i]))
  }
  return { ast: seq(...xs), détails }
}

// Généralise une liste d'exemples : { candidats: [{ ast, titre, hypothèses, entité? }] }
export function généraliserExemples(exemples, { groupes = false } = {}) {
  const ex = [...new Set(exemples.map(s => s.trim()).filter(Boolean))]
  if (!ex.length) return { candidats: [] }
  const candidats = []
  // 1. Formats du catalogue qui reconnaissent TOUS les exemples (exécutés pour de bon).
  const reconnus = []
  for (const e of CATALOGUE) {
    if (!(e.src || e.format) || e.ancré || e.sansExemples) continue
    const re = new RegExp(`^(?:${émettre(arbreEntité(e.id), 'js').pattern})$`)
    if (ex.every(s => re.test(s))) reconnus.push({ e, accepte: SONDES.filter(s => re.test(s)).length })
  }
  reconnus.sort((a, b) => a.accepte - b.accepte)
  for (const { e } of reconnus.slice(0, 2)) {
    candidats.push({ ast: arbreEntité(e.id, { groupes }), titre: `Format reconnu : ${e.titre}`, entité: e.id, hypothèses: [`Les ${ex.length} exemple(s) correspondent au format « ${e.titre} » du catalogue (vérifié par exécution).`, ...(e.notes ?? [])] })
  }
  // 2. Généralisation champ par champ.
  const groupesSeps = new Map()
  for (const s of ex) {
    const clé = découpe(s).seps.join('\u0000')
    if (!groupesSeps.has(clé)) groupesSeps.set(clé, [])
    groupesSeps.get(clé).push(s)
  }
  const hypothèses = []
  if (ex.length === 1) hypothèses.push('Un seul exemple : les longueurs sont celles de l\'exemple. Ajoutez-en d\'autres pour les assouplir.')
  else hypothèses.push(`Généralisé à partir de ${ex.length} exemples : chiffres → \\d, lettres → classe, longueurs observées → quantificateurs, séparateurs identiques → littéraux.`)
  let ast, titre
  if (groupesSeps.size === 1) {
    const r = structure(ex)
    ast = r.ast
    titre = `Motif déduit de ${ex.length} exemple${ex.length > 1 ? 's' : ''}`
    hypothèses.push(...r.détails.map(d => d.texte))
  } else if (groupesSeps.size <= 3) {
    const branches = [...groupesSeps.values()].map(liste => structure(liste))
    ast = nc(alt(...branches.map(b => b.ast)))
    titre = `Motif déduit de ${ex.length} exemples (${branches.length} structures)`
    hypothèses.push(`Les exemples ont ${branches.length} structures différentes (séparateurs différents) : une alternative par structure.`)
  } else {
    const espaces = ex.some(s => /\s/.test(s))
    ast = q(espaces ? ANY : esc('S'), 1, Infinity)
    titre = 'Motif large (les exemples n\'ont pas de structure commune)'
    hypothèses.push('Les exemples n\'ont pas de structure commune : motif large « n\'importe quel texte non vide ». Donnez des exemples plus homogènes ou une description.')
  }
  candidats.push({ ast, titre, entité: null, hypothèses })
  return { candidats }
}
