// Interprétation locale d'une description (français ou anglais), sans IA
// externe : repère des formats connus (catalogue), des quantités, des classes de
// caractères, des textes littéraux et des conditions (commence par, finit par,
// contient, ne contient pas), puis produit une spécification que assemblage.js
// transforme en regex. Ce qui n'est pas compris est signalé, jamais inventé.
import { ANY, alt, cls, esc, lit, nc, plage, q } from './ast.js'
import { ACCENTS, ALNUM, BLANC, CHIFFRES, HEXA, LETTRES, MAJUSCULES, MINUSCULES, MOT, égalPlages, fusionner, union } from './classes.js'
import { arbreEntité, entité, entitéÀ } from './catalogue.js'
import { estFormat, formatVersArbre } from './formats.js'
import { découper, détecterLangue, expressionÀ, texteDesJetons, valeurNombre } from './jetons.js'

// ---- Classes de caractères -------------------------------------------------------

const VOYELLES = [[65, 65], [69, 69], [73, 73], [79, 79], [85, 85], [89, 89], [97, 97], [101, 101], [105, 105], [111, 111], [117, 117], [121, 121]]
const CONSONNES = [[66, 68], [70, 72], [74, 78], [80, 84], [86, 90], [98, 100], [102, 104], [106, 110], [112, 116], [118, 122]]
// Symboles ASCII : ! à /, : à @, [ à `, { à ~
const SYMBOLES_ASCII = [[33, 47], [58, 64], [91, 96], [123, 126]]

// plages : dans l'ordre d'écriture conventionnel (A-Za-z0-9).
const CLASSES = {
  chiffre: { p: CHIFFRES, nom: 'chiffre' },
  lettre: { p: [[65, 90], [97, 122]], nom: 'lettre' },
  majuscule: { p: MAJUSCULES, nom: 'lettre majuscule' },
  minuscule: { p: MINUSCULES, nom: 'lettre minuscule' },
  alphanumerique: { p: [[65, 90], [97, 122], [48, 57]], nom: 'caractère alphanumérique' },
  hexadecimal: { p: HEXA, nom: 'chiffre hexadécimal' },
  voyelle: { p: VOYELLES, nom: 'voyelle' },
  consonne: { p: CONSONNES, nom: 'consonne' },
  accent: { p: [[65, 90], [97, 122], ...ACCENTS], nom: 'lettre (accents compris)' },
  special: { p: union(ALNUM, BLANC), neg: true, nom: 'caractère spécial', nœud: () => cls([plage('A', 'Z'), plage('a', 'z'), plage('0', '9'), { esc: 's' }], true) },
  espace: { p: [[32, 32]], nom: 'espace' },
  blanc: { p: BLANC, nom: 'espace blanc' },
  tab: { p: [[9, 9]], nom: 'tabulation' },
  ponctuation: { p: [[33, 33], [44, 44], [46, 46], [58, 59], [63, 63]], nom: 'ponctuation' },
  mot: { p: MOT, nom: 'caractère de mot' },
}

const MOTS_CLASSE = {
  chiffre: 'chiffre', digit: 'chiffre', numerique: 'chiffre', numeric: 'chiffre',
  lettre: 'lettre', letter: 'lettre', alphabetique: 'lettre', alphabetic: 'lettre', alpha: 'lettre',
  majuscule: 'majuscule', uppercase: 'majuscule', capitale: 'majuscule', capital: 'majuscule',
  minuscule: 'minuscule', lowercase: 'minuscule',
  alphanumerique: 'alphanumerique', alphanumeric: 'alphanumerique', alnum: 'alphanumerique',
  hexadecimal: 'hexadecimal', hexadecimale: 'hexadecimal', hex: 'hexadecimal', hexa: 'hexadecimal',
  voyelle: 'voyelle', vowel: 'voyelle', consonne: 'consonne', consonant: 'consonne',
  accentuee: 'accent', accentue: 'accent', accent: 'accent', accented: 'accent',
  special: 'special', speciale: 'special', symbole: 'special', symbol: 'special',
  espace: 'espace', space: 'espace', blanc: 'blanc', whitespace: 'blanc',
  tabulation: 'tab', tab: 'tab', ponctuation: 'ponctuation', punctuation: 'ponctuation',
  mot: 'mot', word: 'mot',
}

const CARACTÈRE = new Set(['caractere', 'character', 'char', 'symbole', 'symbol'])
const AUCUN_FILTRE = new Set(['quelconque', 'any', 'imprimable', 'printable'])

// ---- Symboles (un caractère précis) -----------------------------------------------

const SYMBOLES_MULTI = {
  'tiret bas': '_', 'point virgule': ';', 'barre oblique': '/', 'barre verticale': '|', 'signe plus': '+', 'signe moins': '-',
  'point d exclamation': '!', 'point d interrogation': '?', 'retour a la ligne': '\n', 'saut de ligne': '\n', 'trait d union': '-',
  'deux points': ':', 'et commercial': '&', 'parenthese ouvrante': '(', 'parenthese fermante': ')', 'crochet ouvrant': '[', 'crochet fermant': ']',
  'accolade ouvrante': '{', 'accolade fermante': '}', 'barre oblique inverse': '\\', 'guillemet double': '"', 'guillemet simple': "'",
  'new line': '\n', 'line break': '\n', 'open parenthesis': '(', 'close parenthesis': ')',
}
const SYMBOLES = {
  tiret: '-', hyphen: '-', dash: '-', underscore: '_', point: '.', dot: '.', period: '.', virgule: ',', comma: ',', semicolon: ';',
  'deux-points': ':', colon: ':', slash: '/', antislash: '\\', backslash: '\\', arobase: '@', at: '@', dollar: '$', euro: '€',
  pourcent: '%', percent: '%', diese: '#', croisillon: '#', hash: '#', plus: '+', etoile: '*', asterisque: '*', star: '*', asterisk: '*',
  esperluette: '&', ampersand: '&', egal: '=', equals: '=', exclamation: '!', apostrophe: "'", guillemet: '"', quote: '"', tilde: '~', pipe: '|',
}

function lireSymbole(J, k) {
  const t = J[k]
  if (!t || t.cité) return null
  let meilleur = null
  for (const [mots, car] of Object.entries(SYMBOLES_MULTI)) {
    const m = mots.split(' ')
    if (m.length > (meilleur?.n ?? 1) && m.every((x, a) => J[k + a] && !J[k + a].cité && (J[k + a].norm === x || (a === m.length - 1 && J[k + a].sing === x)))) meilleur = { car, n: m.length, pluriel: J[k + m.length - 1].norm !== J[k + m.length - 1].sing && mots !== 'deux points' }
  }
  if (meilleur) return meilleur
  const car = SYMBOLES[t.norm] ?? SYMBOLES[t.sing]
  return car === undefined ? null : { car, n: 1, pluriel: t.norm !== t.sing && t.norm !== 'deux-points' }
}

// ---- Quantités ------------------------------------------------------------------

const PLUS = new Set(['plus', 'more'])
const ARTICLES = new Set(['un', 'une', 'a', 'an', 'one'])
const OPTIONNEL = new Set(['eventuellement', 'eventuel', 'eventuelle', 'optionnellement', 'optionnel', 'optionnelle', 'facultatif', 'facultative', 'optional', 'optionally', 'possiblement', 'maybe'])

// Quantité écrite avant l'objet : { min, max, n, strict?, article? } ou null.
export function lireQuantité(J, k) {
  const t = J[k]
  if (!t || t.cité || t.ponct) return null
  const nb = a => valeurNombre(J[a])
  let n
  if ((n = expressionÀ(J, k, ['exactement', 'exactly', 'precisement', 'precisement']))) { const v = nb(k + n); if (v !== null) return { min: v, max: v, n: n + 1, strict: true } }
  if ((n = expressionÀ(J, k, ['entre', 'between']))) {
    const a = nb(k + n), s = J[k + n + 1], b = nb(k + n + 2)
    if (a !== null && s && ['et', 'and', 'a', 'to'].includes(s.norm) && b !== null) return { min: a, max: b, n: n + 3, strict: true }
  }
  if ((n = expressionÀ(J, k, ['de', 'd', 'from']))) {
    const a = nb(k + n), s = J[k + n + 1], b = nb(k + n + 2)
    if (a !== null && s && ['a', 'to'].includes(s.norm) && b !== null) return { min: a, max: b, n: n + 3, strict: true }
  }
  if (valeurNombre(t) !== null && /^\d+$/.test(t.norm)) {
    const s = J[k + 1], b = nb(k + 2)
    if (s && ['a', 'to'].includes(s.norm) && b !== null) return { min: nb(k), max: b, n: 3, strict: true }
    if (s && ['ou', 'or'].includes(s.norm) && J[k + 2] && PLUS.has(J[k + 2].norm)) return { min: nb(k), max: Infinity, n: 3 }
  }
  const plage = /^(\d+)[-–](\d+)$/.exec(t.norm)
  if (plage) return { min: Number(plage[1]), max: Number(plage[2]), n: 1, strict: true }
  if ((n = expressionÀ(J, k, ['au moins', 'at least', 'minimum', 'min', 'pas moins de', 'no less than', 'a partir de']))) {
    const v = nb(k + n)
    const auMoins = ['au moins', 'at least'].includes(J.slice(k, k + n).map(x => x.norm).join(' '))
    if (v !== null) return { min: v, max: Infinity, n: n + 1, auMoins }
    if (J[k + n] && ARTICLES.has(J[k + n].norm)) return { min: 1, max: Infinity, n: n + 1, auMoins }
  }
  if ((n = expressionÀ(J, k, ['au plus', 'at most', 'maximum', 'max', 'jusqu a', 'jusqua', 'jusqu', 'up to', 'pas plus de', 'no more than', 'au maximum']))) {
    const v = nb(k + n)
    if (v !== null) return { min: 1, max: v, n: n + 1, strict: true }
  }
  if ((n = expressionÀ(J, k, ['moins de', 'fewer than', 'less than']))) { const v = nb(k + n); if (v !== null) return { min: 1, max: Math.max(1, v - 1), n: n + 1, strict: true } }
  if ((n = expressionÀ(J, k, ['plus de', 'more than', 'over']))) { const v = nb(k + n); if (v !== null) return { min: v + 1, max: Infinity, n: n + 1 } }
  if ((n = expressionÀ(J, k, ['un ou plusieurs', 'une ou plusieurs', 'one or more', 'au moins un', 'au moins une', 'at least one', 'plusieurs', 'several', 'quelques', 'some', 'many']))) return { min: 1, max: Infinity, n }
  if ((n = expressionÀ(J, k, ['zero ou plusieurs', 'zero ou plus', 'zero or more', 'aucun ou plusieurs', 'un nombre quelconque de', 'any number of', 'n importe quel nombre de']))) return { min: 0, max: Infinity, n }
  if (valeurNombre(t) !== null && /^\d+$/.test(t.norm)) {
    const v = nb(k)
    const s = J[k + 1]
    if (s && s.ponct && s.norm === '+') return { min: v, max: Infinity, n: 2 }
    return { min: v, max: v, n: 1, nombre: true }
  }
  if (valeurNombre(t) !== null && t.norm in { deux: 1, trois: 1, quatre: 1, cinq: 1, six: 1, sept: 1, huit: 1, neuf: 1, dix: 1, two: 1, three: 1, four: 1, five: 1, seven: 1, eight: 1, nine: 1, ten: 1 }) {
    const v = nb(k)
    return { min: v, max: v, n: 1, nombre: true }
  }
  if (ARTICLES.has(t.norm) && !((t.norm === 'a' || t.norm === 'an') && t.brut !== t.brut.toLowerCase().replace(/^./, c => c) && false) && !(t.norm === 'a' && t.brut === 'à')) {
    const s = J[k + 1]
    if (s && ['seul', 'seule', 'single'].includes(s.norm)) return { min: 1, max: 1, n: 2, strict: true }
    return { min: 1, max: 1, n: 1, article: true }
  }
  return null
}

// ---- Ensembles de caractères (classes, symboles, « tout sauf … ») ------------------

const estPluriel = j => !!j && !j.cité && j.norm !== j.sing

// Union ordonnée : on garde l'ordre d'écriture (A-Za-z0-9), sans trier ni fusionner.
function unionOrdonnée(ensembles) {
  const plages = []
  for (const p of ensembles) for (const [a, b] of p) if (!plages.some(([x, y]) => x <= a && b <= y)) plages.push([a, b])
  return plages
}

function nœudEnsemblePlages(plages, neg = false) {
  const f = fusionner(plages)
  if (!neg && f.length === 1 && f[0][0] === f[0][1]) return lit(String.fromCodePoint(f[0][0]))
  if (égalPlages(f, CHIFFRES)) return esc(neg ? 'D' : 'd')
  if (égalPlages(f, MOT)) return esc(neg ? 'W' : 'w')
  if (égalPlages(f, BLANC)) return esc(neg ? 'S' : 's')
  return cls(plages.map(([lo, hi]) => ({ lo, hi })), neg)
}

// Lit un ensemble : « chiffres et lettres », « tiret », « tout sauf espaces »…
// Renvoie { nœud, n, pluriel, nom, symbole? } ou null.
function lireEnsemble(J, k) {
  const items = []
  let a = k
  let pluriel = false
  const noms = []
  const lireItem = pos => {
    const t = J[pos]
    if (!t || t.cité || t.ponct) return null
    // « tout / n'importe quel caractère »
    if (['tout', 'toute', 'tous', 'toutes', 'any', 'anything', 'everything'].includes(t.norm) || expressionÀ(J, pos, ['n importe quel', 'n importe quelle', 'n importe quoi'])) {
      const nImporte = expressionÀ(J, pos, ['n importe quel', 'n importe quelle', 'n importe quoi'])
      let n = nImporte || 1
      let a2 = pos + n
      while (J[a2] && !J[a2].cité && ['les', 'the', 'des'].includes(J[a2].norm)) a2++
      const avecCar = !!J[a2] && CARACTÈRE.has(J[a2].sing)
      const avecSauf = !!expressionÀ(J, a2, ['sauf', 'except', 'excepte', 'hors', 'autre que', 'autres que', 'other than', 'apart from', 'but not'])
      // « toutes les adresses » : simple déterminant ; « tout sauf des espaces », « any character » : n'importe quoi.
      if (!nImporte && !['anything', 'everything'].includes(t.norm) && !avecCar && !avecSauf) return null
      if (avecCar) n = a2 + 1 - pos
      return { tout: true, n, pluriel: true }
    }
    if (CARACTÈRE.has(t.sing)) {
      const s = J[pos + 1]
      if (s && !s.cité && (MOTS_CLASSE[s.norm] || MOTS_CLASSE[s.sing]) && !['espace', 'blanc'].includes(MOTS_CLASSE[s.sing] ?? '')) {
        const id = MOTS_CLASSE[s.norm] ?? MOTS_CLASSE[s.sing]
        return { id, n: 2, pluriel: estPluriel(t) }
      }
      if (s && s.norm === 'de' && J[pos + 2] && MOTS_CLASSE[J[pos + 2].sing]) return { id: MOTS_CLASSE[J[pos + 2].sing], n: 3, pluriel: estPluriel(t) }
      if (s && AUCUN_FILTRE.has(s.norm)) return { tout: true, n: 2, pluriel: estPluriel(t) }
      if (t.sing === 'symbole' || t.sing === 'symbol') return { id: 'special', n: 1, pluriel: estPluriel(t) }
      return { tout: true, n: 1, pluriel: estPluriel(t) }
    }
    const id = MOTS_CLASSE[t.norm] ?? MOTS_CLASSE[t.sing]
    if (id) {
      let n = 1
      // « alphanumeric characters », « uppercase letters » : le nom commun qui suit est absorbé.
      if (J[pos + 1] && !J[pos + 1].cité && CARACTÈRE.has(J[pos + 1].sing) && id !== 'espace' && id !== 'blanc') n = 2
      return { id, n, pluriel: estPluriel(J[pos + n - 1]) || estPluriel(t) }
    }
    const s = lireSymbole(J, pos)
    if (s) return { symbole: s.car, n: s.n, pluriel: s.pluriel }
    return null
  }
  // « sauf » après un « tout »
  let première = lireItem(a)
  if (!première) return null
  for (;;) {
    const it = première
    if (it.tout) {
      a += it.n
      const m = expressionÀ(J, a, ['sauf', 'except', 'excepte', 'hors', 'autre que', 'autres que', 'other than', 'apart from', 'but not'])
      if (m) {
        a += m
        const exclus = []
        while (J[a] && !J[a].cité && ['des', 'les', 'de', 'du', 'the', 'any', 'un', 'une', 'a'].includes(J[a].norm)) a++
        let b = lireItem(a)
        while (b && !b.tout) {
          exclus.push(b)
          a += b.n
          const s = J[a]
          const prochain = s && (['et', 'ou', 'and', 'or'].includes(s.norm) || (s.ponct && s.norm === ',')) ? lireItem(a + 1) : null
          if (prochain) { a += 1; b = prochain } else b = null
        }
        if (!exclus.length) return { nœud: ANY, n: a - k, pluriel: true, nom: 'n\'importe quel caractère', tout: true }
        const plages = unionOrdonnée(exclus.map(e => (e.symbole !== undefined ? [[e.symbole.codePointAt(0), e.symbole.codePointAt(0)]] : CLASSES[e.id].p)))
        return { nœud: nœudEnsemblePlages(plages, true), n: a - k, pluriel: true, nom: `tout sauf ${exclus.map(e => e.symbole ?? CLASSES[e.id].nom).join(', ')}` }
      }
      noms.push('tout caractère')
      return { nœud: ANY, n: a - k, pluriel: true, nom: 'n\'importe quel caractère', tout: true }
    }
    // raffinements : « lettres majuscules », « chiffres hexadécimaux »
    const précédent = items.at(-1)
    if (précédent && !précédent.symbole && ((précédent.id === 'lettre' && ['majuscule', 'minuscule', 'accent'].includes(it.id)) || (précédent.id === 'chiffre' && it.id === 'hexadecimal'))) items[items.length - 1] = it
    else if (précédent && !précédent.symbole && ['majuscule', 'minuscule', 'accent'].includes(précédent.id) && it.id === 'lettre' && !items.sépare) { /* « capital letter » : déjà précisé */ }
    else items.push(it)
    a += it.n
    pluriel ||= it.pluriel
    // séparateur suivi d'un autre élément SANS quantité propre
    const s = J[a]
    if (s && expressionÀ(J, a, ['ou plus', 'or more', 'ou moins', 'or less', 'et plus', 'and more'])) break
    if (s && (['et', 'ou', 'and', 'or'].includes(s.norm) || (s.ponct && [',', '/'].includes(s.norm)))) {
      if (lireQuantité(J, a + 1)) break
      // « des lettres et des chiffres » : le déterminant partitif n'ouvre pas une nouvelle pièce.
      let d = a + 1
      while (J[d] && !J[d].cité && ['des', 'de', 'du', 'les', 'the', 'some'].includes(J[d].norm)) d++
      const suivant = lireItem(d)
      if (suivant && !suivant.tout) { première = suivant; a = d; continue }
    }
    // élément collé (sans séparateur) : « lettres majuscules »
    const collé = lireItem(a)
    if (collé && !collé.tout && !collé.symbole && ((items.at(-1).id === 'lettre' && ['majuscule', 'minuscule', 'accent'].includes(collé.id)) || (items.at(-1).id === 'chiffre' && collé.id === 'hexadecimal') || (['majuscule', 'minuscule', 'accent'].includes(items.at(-1).id) && collé.id === 'lettre'))) { première = collé; continue }
    break
  }
  // un seul symbole : caractère littéral
  if (items.length === 1 && items[0].symbole !== undefined) {
    return { nœud: lit(items[0].symbole), n: a - k, pluriel, nom: `« ${items[0].symbole} »`, symbole: true }
  }
  const classes = items.map(it => (it.symbole !== undefined ? { p: [[it.symbole.codePointAt(0), it.symbole.codePointAt(0)]], nom: `« ${it.symbole} »` } : CLASSES[it.id]))
  noms.push(...classes.map(c => c.nom))
  if (classes.length === 1 && classes[0].neg) return { nœud: classes[0].nœud ? classes[0].nœud() : nœudEnsemblePlages(classes[0].p, true), n: a - k, pluriel, nom: classes[0].nom }
  const plages = unionOrdonnée(classes.map(c => (c.neg ? SYMBOLES_ASCII : c.p)))
  return { nœud: nœudEnsemblePlages(plages), n: a - k, pluriel, nom: noms.join(', '), classeId: items.length === 1 ? items[0].id : null }
}

// ---- Pièces : quantité + (entité | littéral | ensemble) -----------------------------

const CONNECTEURS = ['suivi', 'suivie', 'suivis', 'suivies', 'puis', 'ensuite', 'followed', 'then', 'et', 'ou', 'and', 'or', 'avec', 'with', 'sans', 'without', 'qui', 'que', 'which', 'that']
const NOMS_COMMUNS = new Set(['nombre', 'number', 'entier', 'integer', 'decimal', 'reel', 'float', 'numero', 'code', 'mot'])
const CUES_TEXTE = new Set(['mot', 'mots', 'texte', 'chaine', 'word', 'words', 'text', 'string', 'terme', 'term'])

function lireLittéral(J, p) {
  const premier = J[p]
  const mots = [premier.brut]
  let a = p + 1
  for (;;) {
    const s = J[a]
    if (s && (['ou', 'or'].includes(s.norm) || (s.ponct && s.norm === ',')) && J[a + 1]?.cité) { mots.push(J[a + 1].brut); a += 2 } else break
  }
  const nœud = mots.length === 1 ? lit(mots[0]) : nc(alt(...mots.map(m => lit(m))))
  return { nœud, n: a - p, nom: mots.map(m => `« ${m} »`).join(' ou '), littéral: true }
}

// Texte brut utilisable comme littéral : il contient autre chose que des minuscules.
const ressembleLittéral = j => !!j && !j.cité && !j.ponct && /[^a-zà-ÿ]/.test(j.brut)
// Signes de ponctuation qui valent pour eux-mêmes dans une description : # @ $ % & * + = ~ | / \ _ - < > ^
const SIGNES = new Set('#@$%&*+=~|/\\_-<>^'.split(''))

const motCléContrainte = (J, k) => !!(expressionÀ(J, k, DÉBUT) || expressionÀ(J, k, FIN) || expressionÀ(J, k, CONTIENT) || expressionÀ(J, k, SANS))

function lireBase(ctx, p, { brut }) {
  const { J } = ctx
  const t = J[p]
  if (!t) return null
  if (t.cité) return lireLittéral(J, p)
  // « le mot X », « le texte X », « the word X »
  if (CUES_TEXTE.has(t.norm) && J[p + 1] && (J[p + 1].cité || (!J[p + 1].ponct && !BRUIT.has(J[p + 1].norm) && !MOTS_CLASSE[J[p + 1].sing] && !SYMBOLES[J[p + 1].norm] && !lireQuantité(J, p + 1) && !entitéÀ(J, p + 1) && !CONNECTEURS.includes(J[p + 1].norm) && !motCléContrainte(J, p + 1)))) {
    const l = J[p + 1].cité ? lireLittéral(J, p + 1) : { nœud: lit(J[p + 1].brut), n: 1, nom: `« ${J[p + 1].brut} »`, littéral: true }
    return { ...l, n: l.n + 1 }
  }
  let e = entitéÀ(J, p)
  const DATES = ['date', 'date_iso', 'date_fr', 'date_us', 'date_heure_iso', 'heure']
  if (e && ctx.formats.size && DATES.includes(e.id)) e = null
  if (e && NOMS_COMMUNS.has(J[p].norm) && lireQuantité(J, p + e.n)) e = null
  if (e) {
    const def = entité(e.id)
    if (def.variantes) return { variantes: def.variantes, def, n: e.n, entité: e.id, nom: def.titre, pluriel: estPluriel(J[p + e.n - 1]) }
    return { nœud: ctx.groupes ? arbreEntité(e.id, { groupes: true }) : arbreEntité(e.id), n: e.n, entité: e.id, nom: def.titre, pluriel: estPluriel(J[p + e.n - 1]), enveloppe: true }
  }
  if (ctx.formats.has(p)) {
    const f = ctx.formats.get(p)
    const r = formatVersArbre(f.format, { groupes: ctx.groupes })
    return { nœud: r.ast, n: f.n, nom: `format ${f.format}`, enveloppe: true, format: f.format }
  }
  const ens = lireEnsemble(J, p)
  if (ens) return ens
  if (t.ponct && (SIGNES.has(t.brut) || t.brut === '.') && brut) {
    // signe collé à un mot (« .fr », « @example.com », « #tag ») : un seul texte littéral
    let texte = t.brut
    let n = 1
    let fin = t.fin
    while (J[p + n] && J[p + n].ponct && !J[p + n].cité && J[p + n].debut === fin && (SIGNES.has(J[p + n].brut) || ['.', '!', '?', ':'].includes(J[p + n].brut))) { texte += J[p + n].brut; fin = J[p + n].fin; n++ }
    const s = J[p + n]
    if (s && !s.ponct && !s.cité && s.debut === fin) { texte += s.brut; n++ }
    if (n > 1 || t.brut !== '.') return { nœud: lit(texte), n, nom: `« ${texte} »`, littéral: true, symbole: true }
  }
  // Dans une condition (commence par, contient…), tout mot inconnu est un texte littéral ; dans une suite, seulement s'il ressemble à une valeur.
  if (brut === 'opérande' && !t.ponct && !BRUIT.has(t.norm) && !/^\d+$/.test(t.norm) && !CONNECTEURS.includes(t.norm) && !motCléContrainte(J, p)) return { nœud: lit(t.brut), n: 1, nom: `« ${t.brut} »`, littéral: true, brut: true }
  if (brut && ressembleLittéral(t)) return { nœud: lit(t.brut), n: 1, nom: `« ${t.brut} »`, littéral: true, brut: true }
  return null
}

const POSTFIXES_MIN = ['minimum', 'min', 'ou plus', 'or more', 'at least', 'au moins']
const POSTFIXES_MAX = ['maximum', 'max', 'au plus', 'au maximum', 'at most']

// Une pièce : { k, n, texte, nœud, base, quant, générique, entité, variantes, nom } ou null.
export function lirePièce(ctx, k, { brut = false } = {}) {
  const { J } = ctx
  let p = k
  let optionnel = false
  while (J[p] && !J[p].cité && OPTIONNEL.has(J[p].norm)) { optionnel = true; p++ }
  const q0 = lireQuantité(J, p)
  let après = p + (q0 ? q0.n : 0)
  if (q0 && J[après] && !J[après].cité && ['de', 'd', 'of'].includes(J[après].norm)) après++
  let base = lireBase(ctx, après, { brut })
  // « des chiffres », « de lettres » : article partitif sans nombre
  if (!base && !q0 && J[p] && !J[p].cité && ['des', 'de', 'du', 'd', 'les', 'some'].includes(J[p].norm)) {
    const b2 = lireBase(ctx, p + 1, { brut })
    if (b2 && !b2.littéral) { base = b2; après = p + 1 }
  }
  if (!base) return null
  let fin = après + base.n
  let min = 1, max = 1, explicite = false
  if (q0) { ({ min, max } = q0); explicite = !q0.article } else if ((base.pluriel && !base.littéral && !base.entité && !base.format && !base.variantes) || base.classeId === 'mot') { max = Infinity }
  // « 8 caractères minimum », « 3 chiffres ou plus », « 20 caractères maximum »
  const mm = expressionÀ(J, fin, POSTFIXES_MIN)
  const mx = expressionÀ(J, fin, POSTFIXES_MAX)
  if (q0?.nombre && mm) { max = Infinity; fin += mm }
  else if (q0?.nombre && mx) { min = 1; fin += mx }
  if (J[fin] && !J[fin].cité && OPTIONNEL.has(J[fin].norm)) { optionnel = true; fin++ }
  const générique = base.tout === true && base.nœud === ANY && (q0 !== null)
  const pièce = {
    k, n: fin - k, texte: texteDesJetons(J.slice(k, fin)),
    base: base.nœud, quant: { min, max, explicite, article: !!q0?.article, strict: !!q0?.strict, auMoins: !!q0?.auMoins },
    générique, entité: base.entité ?? null, variantes: base.variantes ?? null, def: base.def ?? null, nom: base.nom, littéral: !!base.littéral, enveloppe: !!base.enveloppe, classeId: base.classeId ?? null, format: base.format ?? null,
    optionnel,
  }
  return pièce
}

// Nœud d'une pièce (quantificateur appliqué).
export function nœudPièce(pièce) {
  const { min, max } = pièce.quant
  let b = pièce.base
  if (pièce.enveloppe && (min !== 1 || max !== 1)) b = nc(b)
  let n = min === 1 && max === 1 ? b : q(b, min, max)
  if (pièce.optionnel) n = min === 1 && max === 1 ? q(b, 0, 1) : q(b, 0, max)
  return n
}

// ---- Contraintes ------------------------------------------------------------------------

const DÉBUT = ['commence par', 'commencant par', 'commencent par', 'debute par', 'debutant par', 'debutent par', 'qui commence par', 'starts with', 'start with', 'starting with', 'begins with', 'beginning with', 'prefixe par', 'prefixed by', 'prefixee par', 'prefixes par', 'precede de', 'preceded by']
const FIN = ['finit par', 'finissant par', 'finissent par', 'se termine par', 'se terminant par', 'se terminent par', 'terminant par', 'termine par', 'ends with', 'ending with', 'end with', 'suffixe par', 'suffixed by', 'finishes with', 'terminee par', 'terminees par']
const CONTIENT = ['contient', 'contenant', 'contiennent', 'comportant', 'comporte', 'incluant', 'inclut', 'contains', 'containing', 'including', 'includes', 'with', 'having', 'has', 'avec', 'possedant', 'ayant']
const SANS = ['ne contient pas', 'ne contenant pas', 'ne contiennent pas', 'sans', 'does not contain', 'doesn t contain', 'not containing', 'not contain', 'without', 'excluding', 'except', 'mais pas', 'but not', 'sauf', 'pas de', 'aucun', 'aucune', 'ne comporte pas', 'ne doit pas contenir', 'must not contain', 'should not contain']

function lireOpérande(ctx, a) {
  const J = ctx.J
  // déterminants qui précèdent un nom : le, la, les, l'
  let p = a
  while (J[p] && !J[p].cité && ['le', 'la', 'les', 'l', 'the'].includes(J[p].norm)) p++
  const pièce = lirePièce(ctx, p, { brut: 'opérande' })
  if (!pièce) return null
  return { ...pièce, n: pièce.n + (p - a) }
}

function lireOpérandes(ctx, p) {
  const J = ctx.J
  const liste = []
  let a = p
  for (;;) {
    const o = lireOpérande(ctx, a)
    if (!o) break
    liste.push(o)
    a += o.n
    const s = J[a]
    if (!s) break
    if (['et', 'and', 'ni'].includes(s.norm) || (s.ponct && [',', ';'].includes(s.norm))) {
      const suite = lireOpérande(ctx, a + 1)
      if (suite) { a += 1; continue }
    } else if (['ou', 'or'].includes(s.norm)) {
      const suite = lireOpérande(ctx, a + 1)
      if (suite && liste.at(-1).littéral && suite.littéral) {
        const d = liste.at(-1)
        const mots = [...(d.alternatives ?? [d.base]), suite.base]
        liste[liste.length - 1] = { ...d, alternatives: mots, base: nc(alt(...mots)), n: d.n + 1 + suite.n, texte: `${d.texte} ou ${suite.texte}`, nom: `${d.nom} ou ${suite.nom}` }
        a += 1 + suite.n
        continue
      }
    }
    break
  }
  return { liste, n: a - p }
}

export function lireContrainte(ctx, k) {
  const { J } = ctx
  let n, type
  if ((n = expressionÀ(J, k, SANS))) type = 'sans'
  else if ((n = expressionÀ(J, k, DÉBUT))) type = 'début'
  else if ((n = expressionÀ(J, k, FIN))) type = 'fin'
  else if ((n = expressionÀ(J, k, CONTIENT))) type = 'contient'
  else return null
  // « avec groupes nommés » est une option, pas une contrainte (consommée avant).
  const ops = lireOpérandes(ctx, k + n)
  if (!ops.liste.length) return null
  return { type, opérandes: ops.liste, n: n + ops.n, texte: texteDesJetons(J.slice(k, k + n + ops.n)) }
}

// ---- Options et cible ---------------------------------------------------------------------

const CASSE = ['insensible a la casse', 'insensible a la casse', 'sans tenir compte de la casse', 'sans casse', 'ignorer la casse', 'ignore la casse', 'ignorant la casse', 'case insensitive', 'case-insensitive', 'ignore case', 'ignoring case', 'regardless of case', 'any case', 'peu importe la casse', 'majuscules ou minuscules indifferemment']
const MULTI = ['multiligne', 'multi ligne', 'multiline', 'multi line', 'multi-line', 'sur plusieurs lignes', 'ligne par ligne', 'line by line']
const GROUPES = ['groupes nommes', 'groupe nomme', 'named groups', 'named group', 'avec groupes', 'avec des groupes', 'with groups', 'groupes de capture', 'capture groups', 'capturer', 'captures', 'capture', 'capturant', 'extraire chaque', 'chaque partie', 'each part']
const MOT_ENTIER = ['mot entier', 'mots entiers', 'whole word', 'whole words', 'mot complet', 'mots complets', 'exact word', 'as a whole word']
const MOTS_LIGNES = new Set(['ligne', 'lignes', 'line', 'lines'])
const MOTS_VALIDER = new Set(['valider', 'valide', 'validation', 'verifier', 'verifie', 'verification', 'conforme', 'validate', 'valid', 'check', 'doit', 'doivent', 'must', 'entierement', 'exactement', 'uniquement', 'only', 'entire', 'entirely', 'whole', 'champ', 'field', 'saisie', 'input', 'formulaire', 'form', 'format'])
const MOTS_TROUVER = new Set(['trouver', 'trouve', 'trouvez', 'extraire', 'extrais', 'extraction', 'repere', 'reperer', 'chercher', 'cherche', 'rechercher', 'recherche', 'find', 'extract', 'search', 'match', 'matches', 'scan', 'detecter', 'detect', 'capturer', 'recuperer', 'tous', 'toutes', 'all', 'chaque', 'each', 'occurrences', 'occurrence'])
const EXP_TROUVER = ['dans un texte', 'dans du texte', 'dans le texte', 'dans un document', 'dans un fichier', 'dans un log', 'dans les logs', 'in a text', 'in text', 'in the text', 'in a document', 'in a file', 'inside a text', 'within a text']

function détecterOptions(ctx) {
  const { J } = ctx
  const options = { casse: false, multiligne: false, groupes: false, motEntier: false, cues: { lignes: false, valider: false, trouver: false } }
  const consommer = (k, n) => { for (let a = 0; a < n; a++) ctx.utilisés.add(k + a) }
  for (let k = 0; k < J.length; k++) {
    let n
    if ((n = expressionÀ(J, k, CASSE))) { options.casse = true; consommer(k, n); continue }
    if ((n = expressionÀ(J, k, MULTI))) { options.multiligne = true; consommer(k, n); continue }
    if ((n = expressionÀ(J, k, MOT_ENTIER))) { options.motEntier = true; consommer(k, n); continue }
    if ((n = expressionÀ(J, k, GROUPES))) { options.groupes = true; consommer(k, n); if (J[k - 1] && ['avec', 'with'].includes(J[k - 1].norm)) ctx.utilisés.add(k - 1); continue }
  }
  // Indices de cible : les mots déjà consommés (symbole « retour à la ligne »…) sont ignorés.
  const symboles = new Set()
  for (let k = 0; k < J.length; k++) { const s = lireSymbole(J, k); if (s && s.n > 1) for (let a = 0; a < s.n; a++) symboles.add(k + a) }
  for (let k = 0; k < J.length; k++) {
    if (ctx.utilisés.has(k) && !J[k].cité) continue
    const t = J[k]
    if (t.cité || symboles.has(k)) continue
    if (MOTS_LIGNES.has(t.norm) || MOTS_LIGNES.has(t.sing)) options.cues.lignes = true
    if (MOTS_VALIDER.has(t.norm)) options.cues.valider = true
    if (MOTS_TROUVER.has(t.norm) || t.norm === 'mots' || t.norm === 'words') options.cues.trouver = true
    if (expressionÀ(J, k, EXP_TROUVER)) options.cues.trouver = true
  }
  return options
}

// ---- Exemples dans la description ----------------------------------------------------------

const MARQUEURS_EXEMPLES = ['par exemple', 'exemples', 'exemple', 'ex', 'e.g', 'eg', 'comme', 'tel que', 'telle que', 'tels que', 'telles que', 'such as', 'like', 'for example', 'for instance', 'examples', 'example', 'du genre', 'genre', 'sample', 'samples', 'echantillon', 'echantillons']
const ressembleExemple = j => !!j && !j.ponct && (j.cité || /[\d@._\-/:#+%€$]/.test(j.brut) || /^[A-Z]{2,}$/.test(j.brut))

function extraireExemples(ctx) {
  const { J } = ctx
  for (let k = 0; k < J.length; k++) {
    const n = expressionÀ(J, k, MARQUEURS_EXEMPLES)
    if (!n || J[k].cité) continue
    let a = k + n
    if (J[a] && J[a].ponct && [':', '='].includes(J[a].norm)) a++
    const exemples = []
    let b = a
    while (b < J.length) {
      const t = J[b]
      if (t.ponct && [',', ';', ':'].includes(t.norm)) { b++; continue }
      if (!t.ponct && ['et', 'ou', 'and', 'or'].includes(t.norm) && !t.cité) { b++; continue }
      if (!ressembleExemple(t)) break
      exemples.push(t.brut)
      b++
    }
    if (exemples.length) {
      for (let x = k; x < b; x++) ctx.utilisés.add(x)
      return exemples
    }
  }
  return []
}

// ---- Bruit (mots sans effet sur le motif) ------------------------------------------------------

const BRUIT = new Set(`le la les l un une des du de d au aux et ou avec pour sur dans en est sont a ont qui que qu dont par ce cet cette ces il y je j me moi m ne pas ni son sa ses leur leurs
suivi suivie suivis suivies puis ensuite apres ainsi alors donc
regex regexp expression reguliere regulieres motif pattern generer genere generez cree creer ecris ecrire donne donner donnez fais faire besoin souhaite souhaiterais veux voudrais aimerais avoir obtenir
trouver trouve trouvez extraire extrais chercher cherche rechercher recherche detecter valider valide validation verifier verifie verification repere reperer capturer recuperer
chaine texte champ saisie ligne lignes mot mots format type genre sorte forme valeur valeurs element elements partie parties
the a an and or with for in on is are that which by followed then of to from as this these those be it its must should need want would like please generate create write give make
find extract search match matches detect validate check string text field input line lines word words value values part parts
svp stp merci bien aussi seulement uniquement juste exactement entierement toute tout toutes tous chaque each every all only just also
doit doivent etre peut peuvent`.split(/\s+/))

const BRUIT_TECH = new Set(['aws', 'ec2', 'ebs', 's3', 'k8s', 'kubernetes', 'docker', 'linux', 'unix', 'windows', 'terraform'])
const PHRASES_BRUIT = ['mot de passe', 'nom d utilisateur', 'chaine de caracteres', 'string of characters', 'suite de', 'sequence de', 'une suite de', 'une sequence de', 'a sequence of', 'a string of', 'compose de', 'composee de', 'composes de', 'composees de', 'constitue de', 'constituee de', 'forme de', 'formee de', 'made of', 'made up of', 'consisting of', 'composed of', 'qui correspond a', 'qui correspondent a', 'correspondant a', 'that matches', 'matching']

// ---- Balayage ----------------------------------------------------------------------------------

function balayer(ctx, { brut }) {
  const { J } = ctx
  const pièces = []
  const contraintes = []
  const inconnus = []
  const utilisés = new Set(ctx.utilisés)
  const ctxLocal = { ...ctx, utilisés }
  let k = 0
  while (k < J.length) {
    if (utilisés.has(k)) { k++; continue }
    // Un format nommé (« mot de passe fort ») l'emporte sur une expression de remplissage (« mot de passe »).
    const m = entitéÀ(J, k) ? 0 : expressionÀ(J, k, PHRASES_BRUIT)
    if (m) { k += m; continue }
    const c = lireContrainte(ctxLocal, k)
    if (c) {
      // « commence par X suivi de Y » : X ouvre la suite (il est consommé), ce n'est pas une simple condition.
      const suite = J[k + c.n]
      const séquence = c.type === 'début' && !!suite && !suite.cité && ['suivi', 'suivie', 'suivis', 'suivies', 'puis', 'ensuite', 'followed', 'then'].includes(suite.norm)
      contraintes.push({ ...c, k, séquence })
      k += c.n
      continue
    }
    let p = lirePièce(ctxLocal, k, { brut })
    if (p) {
      // « X ou Y » entre deux formats / textes : une alternative.
      for (;;) {
        const lien = J[k + p.n]
        if (!lien || lien.cité || !['ou', 'or'].includes(lien.norm) || utilisés.has(k + p.n)) break
        const suite = lirePièce(ctxLocal, k + p.n + 1, { brut })
        if (!suite || p.classeId || suite.classeId || p.variantes || suite.variantes || p.quant.max !== 1 || suite.quant.max !== 1) break
        p = { ...p, base: nc(alt(p.base, suite.base)), n: p.n + 1 + suite.n, texte: `${p.texte} ou ${suite.texte}`, nom: `${p.nom} ou ${suite.nom}`, entité: null, def: null, format: null, littéral: p.littéral && suite.littéral, enveloppe: true }
      }
      pièces.push(p)
      k += p.n
      continue
    }
    const t = J[k]
    if (!t.cité && (BRUIT.has(t.norm) || BRUIT_TECH.has(t.norm) || t.ponct)) { k++; continue }
    inconnus.push(k)
    k++
  }
  // « un mot de 5 à 8 lettres » : « mot » n'est qu'un conteneur de la pièce qui suit.
  const utiles = pièces.filter((p, i) => !(p.classeId === 'mot' && !p.quant.explicite && pièces[i + 1] && !pièces[i + 1].littéral && !pièces[i + 1].entité && pièces[i + 1].quant.explicite))
  return { pièces: utiles, contraintes, inconnus }
}

// Spécification d'une description : { langue, options, pièces, contraintes, exemples, inconnus }.
export function analyserDescription(description, { groupes = null, casse = null } = {}) {
  const J = découper(description)
  const ctx = { J, langue: détecterLangue(J), utilisés: new Set(), groupes: false, formats: new Map() }
  if (!J.length) return { vide: true, langue: ctx.langue, J }
  // Formats de date/heure (« jj/mm/aaaa », « yyyy-mm-dd hh:mm ») : jetons consécutifs.
  for (let k = 0; k < J.length; k++) {
    if (J[k].cité || J[k].ponct || !estFormat(J[k].brut)) continue
    let fin = k + 1
    let texte = J[k].brut
    while (J[fin] && !J[fin].cité && !J[fin].ponct && estFormat(`${texte} ${J[fin].brut}`)) { texte += ` ${J[fin].brut}`; fin++ }
    ctx.formats.set(k, { format: texte, n: fin - k })
    k = fin - 1
  }
  const exemples = extraireExemples(ctx)
  const options = détecterOptions(ctx)
  // « à 2 décimales », « with 3 decimals » : nombre exact de chiffres après la virgule.
  let décimales = null
  for (let k = 0; k < J.length; k++) {
    const v = valeurNombre(J[k])
    const m = J[k + 1] && !J[k + 1].cité && ['decimale', 'decimal', 'decimals', 'decimale', 'chiffre apres la virgule'].includes(J[k + 1].sing) ? 1 : expressionÀ(J, k + 1, ['decimal places', 'decimal place', 'chiffres apres la virgule', 'digits after the decimal point', 'digits after the dot']) || 0
    if (v !== null && m) { décimales = v; for (let a = 0; a < 1 + m; a++) ctx.utilisés.add(k + a); if (J[k - 1] && ['a', 'avec', 'with', 'to', 'de', 'of'].includes(J[k - 1].norm) && !J[k - 1].cité) ctx.utilisés.add(k - 1); break }
  }
  if (casse !== null) options.casse = casse
  ctx.groupes = groupes !== null ? groupes : options.groupes
  let balayage = balayer(ctx, { brut: false })
  const littérauxPossibles = balayage.inconnus.filter(k => ressembleLittéral(J[k]))
  if ((balayage.pièces.length || balayage.contraintes.length) && littérauxPossibles.length) balayage = balayer(ctx, { brut: true })
  return { langue: ctx.langue, options, exemples, J, ctx, ...balayage, groupes: ctx.groupes, décimales }
}

export { SYMBOLES_ASCII, CLASSES, ressembleExemple }
export { LETTRES }
