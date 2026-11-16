// Explication pas à pas d'une requête jq ou JMESPath, y compris une requête
// modifiée à la main. JMESPath : jetons du vrai analyseur (jmespath.js) ;
// jq : lecteur de jetons léger (la validité est vérifiée par jq lui-même).
import { tokeniserJmes, compilerJmes } from './executer.js'

// ---- JMESPath ------------------------------------------------------------------

const FONCTIONS_JMES = {
  abs: 'valeur absolue', avg: 'moyenne des nombres', ceil: 'arrondi supérieur', contains: 'vrai si la chaîne (ou le tableau) contient la valeur', ends_with: 'vrai si la chaîne finit par…',
  floor: 'arrondi inférieur', join: 'joint les chaînes avec le séparateur', keys: 'clés de l\'objet', length: 'nombre d\'éléments (ou longueur de la chaîne)', map: 'applique l\'expression à chaque élément (null conservés)',
  max: 'plus grande valeur', max_by: 'élément dont la clé est la plus grande (clé numérique)', merge: 'fusionne des objets', min: 'plus petite valeur', min_by: 'élément dont la clé est la plus petite (clé numérique)',
  not_null: 'premier argument non null', reverse: 'inverse l\'ordre', sort: 'trie les valeurs', sort_by: 'trie les éléments selon la clé', starts_with: 'vrai si la chaîne commence par…',
  sum: 'somme des nombres', to_array: 'met la valeur dans un tableau', to_number: 'convertit en nombre', to_string: 'convertit en texte (JSON)', type: 'type de la valeur', values: 'valeurs de l\'objet',
}
const CMP_JMES = { EQ: 'vaut', NE: 'est différent de', GT: '>', GTE: '≥', LT: '<', LTE: '≤' }

function texteJetonsJmes(jetons) {
  return jetons.map(t => {
    if (t.type === 'Literal') return typeof t.value === 'string' ? `"${t.value}"` : JSON.stringify(t.value)
    if (t.type === 'QuotedIdentifier') return JSON.stringify(t.value)
    if (CMP_JMES[t.type]) return ` ${CMP_JMES[t.type]} `
    if (t.type === 'And') return ' et '
    if (t.type === 'Or') return ' ou '
    if (t.type === 'Not') return 'non '
    if (t.type === 'Current') return 'l\'élément'
    if (t.type === 'Comma') return ', '
    if (t.type === 'Expref') return '&'
    return String(t.value)
  }).join('').replace(/\s+/g, ' ').trim()
}

// Découpe au niveau 0 (hors crochets, accolades, parenthèses).
function découperJmes(jetons, type) {
  const parties = [[]]
  let n = 0
  for (const t of jetons) {
    if (['Lbracket', 'Filter', 'Lbrace', 'Lparen'].includes(t.type)) n++
    if (['Rbracket', 'Rbrace', 'Rparen'].includes(t.type)) n--
    if (n === 0 && t.type === type) parties.push([])
    else parties.at(-1).push(t)
  }
  return parties
}

function fermant(jetons, i) {
  let n = 0
  for (let k = i; k < jetons.length; k++) {
    if (['Lbracket', 'Filter', 'Lbrace', 'Lparen'].includes(jetons[k].type)) n++
    if (['Rbracket', 'Rbrace', 'Rparen'].includes(jetons[k].type)) { n--; if (n === 0) return k }
  }
  return jetons.length - 1
}

function étapesJmes(jetons, expr, niveau, sortie) {
  const code = (a, b) => expr.slice(jetons[a].start, jetons[b].fin).trim()
  const pipes = découperJmes(jetons, 'Pipe')
  if (pipes.length > 1) {
    pipes.forEach((p, i) => {
      if (i > 0) sortie.push({ code: '|', texte: 'Pipe : la suite s\'applique au résultat entier (la projection précédente s\'arrête).', niveau })
      étapesJmes(p, expr, niveau, sortie)
    })
    return
  }
  let i = 0
  let enProjection = false
  while (i < jetons.length) {
    const t = jetons[i]
    if (t.type === 'Dot') { i++; continue }
    if ((t.type === 'UnquotedIdentifier') && jetons[i + 1]?.type === 'Lparen') {
      const f = fermant(jetons, i + 1)
      const args = découperJmes(jetons.slice(i + 2, f), 'Comma').filter(a => a.length)
      sortie.push({ code: code(i, f), texte: `${t.value}() : ${FONCTIONS_JMES[t.value] || 'fonction JMESPath'}.`, niveau })
      args.forEach((a, k) => {
        if (a[0]?.type === 'Expref') { sortie.push({ code: texteBrut(a.slice(1), expr), texte: `Argument ${k + 1} : clé évaluée pour chaque élément (&${texteBrut(a.slice(1), expr)}).`, niveau: niveau + 1 }); return }
        const sous = []
        étapesJmes(a, expr, niveau + 2, sous)
        if (sous.length === 1) sortie.push({ ...sous[0], texte: `Argument ${k + 1} : ${sous[0].texte[0].toLowerCase()}${sous[0].texte.slice(1)}`, niveau: niveau + 1 })
        else { sortie.push({ code: texteBrut(a, expr), texte: `Argument ${k + 1} :`, niveau: niveau + 1 }); sortie.push(...sous) }
      })
      i = f + 1
      continue
    }
    if (t.type === 'UnquotedIdentifier' || t.type === 'QuotedIdentifier') {
      // Champs consécutifs : a.b.c
      let j = i
      while (jetons[j + 1]?.type === 'Dot' && ['UnquotedIdentifier', 'QuotedIdentifier'].includes(jetons[j + 2]?.type) && jetons[j + 3]?.type !== 'Lparen') j += 2
      const nom = code(i, j)
      sortie.push({ code: nom, texte: enProjection ? `Pour chaque élément : le champ ${nom}.` : `Prend le champ ${nom}.`, niveau })
      i = j + 1
      continue
    }
    if (t.type === 'Flatten') { sortie.push({ code: '[]', texte: 'Aplatit : parcourt chaque élément du tableau (les sous-tableaux sont fusionnés en une seule liste).', niveau }); enProjection = true; i++; continue }
    if (t.type === 'Filter') {
      const f = fermant(jetons, i)
      const cond = jetons.slice(i + 1, f)
      const seul = cond.every(x => ['UnquotedIdentifier', 'QuotedIdentifier', 'Dot'].includes(x.type))
      sortie.push({ code: code(i, f), texte: `Filtre : garde les éléments où ${texteJetonsJmes(cond)}${seul ? ' est vrai (ni null, ni false, ni vide)' : ''}.`, niveau })
      enProjection = true
      i = f + 1
      continue
    }
    if (t.type === 'Lbracket') {
      const f = fermant(jetons, i)
      const dedans = jetons.slice(i + 1, f)
      if (dedans.length === 1 && dedans[0].type === 'Number') sortie.push({ code: code(i, f), texte: dedans[0].value < 0 ? `Élément n° ${-dedans[0].value} en partant de la fin.` : `Élément à la position ${dedans[0].value} (la première vaut 0).`, niveau })
      else if (dedans.length === 1 && dedans[0].type === 'Star') { sortie.push({ code: '[*]', texte: 'Pour chaque élément du tableau (projection).', niveau }); enProjection = true } else if (dedans.some(x => x.type === 'Colon')) { sortie.push({ code: code(i, f), texte: `Tranche du tableau ${code(i, f)} (début:fin, fin exclue).`, niveau }); enProjection = true } else {
        sortie.push({ code: code(i, f), texte: 'Construit une liste avec les valeurs :', niveau })
        for (const p of découperJmes(dedans, 'Comma')) if (p.length) étapesJmes(p, expr, niveau + 1, sortie)
      }
      i = f + 1
      continue
    }
    if (t.type === 'Lbrace') {
      const f = fermant(jetons, i)
      const paires = découperJmes(jetons.slice(i + 1, f), 'Comma').filter(p => p.length)
      sortie.push({ code: code(i, f), texte: `${enProjection ? 'Pour chaque élément, construit' : 'Construit'} un objet : ${paires.map(p => `${p[0].value} ← ${texteBrut(p.slice(2), expr)}`).join(', ')}.`, niveau })
      i = f + 1
      continue
    }
    if (t.type === 'Star') { sortie.push({ code: '*', texte: 'Toutes les valeurs de l\'objet (projection).', niveau }); enProjection = true; i++; continue }
    if (t.type === 'Current') { sortie.push({ code: '@', texte: 'L\'élément courant.', niveau }); i++; continue }
    if (t.type === 'Literal') { sortie.push({ code: code(i, i), texte: `Valeur littérale ${JSON.stringify(t.value)}.`, niveau }); i++; continue }
    if (['Or', 'And', 'Not', 'EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE'].includes(t.type)) {
      sortie.push({ code: texteBrut(jetons.slice(i), expr), texte: `Teste : ${texteJetonsJmes(jetons.slice(i))}.`, niveau })
      return
    }
    sortie.push({ code: code(i, i), texte: `Jeton ${t.type}.`, niveau })
    i++
  }
}

function texteBrut(jetons, expr) {
  if (!jetons.length) return ''
  return expr.slice(jetons[0].start, jetons.at(-1).fin).trim() || texteJetonsJmes(jetons)
}

export function expliquerJmes(expr) {
  const c = compilerJmes(expr)
  if (!c.ok) return { ok: false, erreur: c.erreur.message, étapes: [] }
  let jetons
  try { jetons = tokeniserJmes(expr) } catch (e) { return { ok: false, erreur: e.message, étapes: [] } }
  // Fin de chaque jeton : début du suivant (espaces retirés).
  jetons.forEach((t, i) => { t.fin = i + 1 < jetons.length ? jetons[i + 1].start : expr.length; while (t.fin > t.start + 1 && /\s/.test(expr[t.fin - 1])) t.fin-- })
  const étapes = []
  étapesJmes(jetons, expr, 0, étapes)
  return { ok: true, étapes }
}

// ---- jq ----------------------------------------------------------------------------

const FONCTIONS_JQ = {
  length: 'nombre d\'éléments (longueur d\'une chaîne, nombre de clés d\'un objet)', keys: 'clés de l\'objet, triées', keys_unsorted: 'clés de l\'objet, dans leur ordre', values: 'écarte les valeurs null',
  add: 'additionne les éléments (ou concatène chaînes et tableaux) ; null sur un tableau vide', unique: 'valeurs distinctes, triées', unique_by: 'un élément par valeur de la clé', sort: 'trie les valeurs', sort_by: 'trie les éléments selon la clé',
  group_by: 'regroupe les éléments ayant la même clé (groupes triés)', min: 'plus petite valeur', max: 'plus grande valeur', min_by: 'élément dont la clé est la plus petite', max_by: 'élément dont la clé est la plus grande (le dernier en cas d\'égalité)',
  reverse: 'inverse l\'ordre', from_entries: 'transforme une liste {key, value} (ou Key/Value) en objet', to_entries: 'transforme un objet en liste {key, value}', with_entries: 'transforme chaque paire clé/valeur',
  join: 'joint les éléments avec le séparateur', split: 'découpe la chaîne', tostring: 'convertit en texte', tonumber: 'convertit en nombre', ascii_downcase: 'en minuscules', ascii_upcase: 'en majuscules',
  test: 'vrai si l\'expression régulière correspond', match: 'détails de la correspondance d\'une regex', capture: 'groupes nommés d\'une regex', sub: 'remplace la première occurrence', gsub: 'remplace toutes les occurrences',
  contains: 'vrai si la valeur est contenue (sous-chaîne pour du texte)', startswith: 'vrai si la chaîne commence par…', endswith: 'vrai si la chaîne finit par…', has: 'vrai si la clé existe', in: 'vrai si la clé existe dans l\'objet donné',
  any: 'vrai si au moins un élément vérifie la condition', all: 'vrai si tous les éléments vérifient la condition', flatten: 'aplatit les tableaux imbriqués', first: 'premier résultat', last: 'dernier résultat', limit: 'au plus n résultats',
  range: 'suite de nombres', empty: 'aucun résultat', error: 'lève une erreur', not: 'négation logique', type: 'type de la valeur', objects: 'ne garde que les objets', arrays: 'ne garde que les tableaux', strings: 'ne garde que les chaînes',
  numbers: 'ne garde que les nombres', booleans: 'ne garde que les booléens', nulls: 'ne garde que null', iterables: 'ne garde que tableaux et objets', scalars: 'ne garde que les valeurs simples', paths: 'chemins de toutes les valeurs',
  leaf_paths: 'chemins des feuilles', getpath: 'valeur à un chemin', setpath: 'modifie la valeur à un chemin', del: 'supprime des clés', delpaths: 'supprime des chemins', to_number: 'convertit en nombre', tojson: 'texte JSON de la valeur', fromjson: 'lit un texte JSON',
  select: 'garde l\'entrée si la condition est vraie', map: 'applique l\'expression à chaque élément', map_values: 'applique l\'expression à chaque valeur', recurse: 'parcourt récursivement', env: 'variables d\'environnement', now: 'heure actuelle (secondes)',
  todate: 'secondes → date ISO 8601', fromdate: 'date ISO 8601 → secondes', fromdateiso8601: 'date ISO 8601 → secondes', strftime: 'formate une date', strptime: 'lit une date', mktime: 'date décomposée → secondes', gmtime: 'secondes → date décomposée',
  ltrimstr: 'retire un préfixe', rtrimstr: 'retire un suffixe', trim: 'retire les espaces autour', ltrim: 'retire les espaces à gauche', rtrim: 'retire les espaces à droite', splits: 'découpe selon une regex', ascii: 'caractère ASCII',
  explode: 'chaîne → codes des caractères', implode: 'codes → chaîne', indices: 'positions de la valeur', index: 'première position', rindex: 'dernière position', inside: 'vrai si contenu dans', walk: 'applique récursivement', transpose: 'transpose une matrice',
  until: 'répète jusqu\'à la condition', while: 'répète tant que la condition est vraie', repeat: 'répète indéfiniment', input: 'lit l\'entrée suivante', inputs: 'lit toutes les entrées suivantes', debug: 'affiche la valeur sur stderr', pick: 'garde seulement les chemins donnés',
  abs: 'valeur absolue', floor: 'arrondi inférieur', ceil: 'arrondi supérieur', round: 'arrondi', sqrt: 'racine carrée', tostream: 'valeur → flux de [chemin, feuille]', fromstream: 'flux → valeur', toarray: 'met la valeur dans un tableau', splits_: '',
  ascii_: '', infinite: 'l\'infini', nan: 'NaN', isnan: 'vrai si NaN', combinations: 'combinaisons', input_filename: 'nom du fichier lu', halt: 'arrête jq', halt_error: 'arrête jq avec une erreur', getpath_: '',
}
const FORMATS_JQ = { '@csv': 'ligne CSV', '@tsv': 'ligne TSV', '@json': 'texte JSON', '@text': 'texte', '@base64': 'encodage Base64', '@base64d': 'décodage Base64', '@uri': 'encodage URL', '@sh': 'chaîne protégée pour le shell', '@html': 'échappement HTML', '@base32': 'encodage Base32' }
const MOTS_JQ = new Set(['if', 'then', 'elif', 'else', 'end', 'as', 'def', 'reduce', 'foreach', 'try', 'catch', 'label', 'import', 'include', 'and', 'or', 'not', '__loc__'])

// Jetons jq : { t, v } avec t ∈ chaîne, nombre, ident, champ, var, format, op, (, ), [, ], {, }, :, ;
export function jetonsJq(texte) {
  const jetons = []
  let i = 0
  const n = texte.length
  while (i < n) {
    const c = texte[i]
    if (/\s/.test(c)) { i++; continue }
    if (c === '#') { while (i < n && texte[i] !== '\n') i++; continue }
    const d = i
    if (c === '"') {
      i++
      let prof = 0
      while (i < n) {
        if (texte[i] === '\\' && texte[i + 1] === '(') { prof++; i += 2; continue }
        if (prof && texte[i] === ')') { prof--; i++; continue }
        if (texte[i] === '\\') { i += 2; continue }
        if (texte[i] === '"' && !prof) break
        i++
      }
      i++
      jetons.push({ t: 'chaîne', v: texte.slice(d, i), d })
      continue
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(texte[i + 1] || ''))) {
      const m = /^\d*\.?\d+([eE][+-]?\d+)?/.exec(texte.slice(i))
      i += m[0].length
      jetons.push({ t: 'nombre', v: m[0], d })
      continue
    }
    if (c === '.') {
      if (texte[i + 1] === '.') { i += 2; jetons.push({ t: 'récursif', v: '..', d }); continue }
      if (texte[i + 1] === '"') {
        i += 2
        while (i < n && texte[i] !== '"') i += texte[i] === '\\' ? 2 : 1
        i++
        jetons.push({ t: 'champ', v: texte.slice(d, i), d })
        continue
      }
      const m = /^\.[A-Za-z_][A-Za-z0-9_]*/.exec(texte.slice(i))
      if (m) { i += m[0].length; jetons.push({ t: 'champ', v: m[0], d }); continue }
      i++
      jetons.push({ t: 'point', v: '.', d })
      continue
    }
    if (c === '$') {
      const m = /^\$[A-Za-z_][A-Za-z0-9_]*/.exec(texte.slice(i))
      i += m ? m[0].length : 1
      jetons.push({ t: 'var', v: m ? m[0] : '$', d })
      continue
    }
    if (c === '@') {
      const m = /^@[A-Za-z0-9]+/.exec(texte.slice(i))
      i += m ? m[0].length : 1
      jetons.push({ t: 'format', v: m ? m[0] : '@', d })
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*(::[A-Za-z_][A-Za-z0-9_]*)*/.exec(texte.slice(i))
      i += m[0].length
      jetons.push({ t: MOTS_JQ.has(m[0]) ? 'mot' : 'ident', v: m[0], d })
      continue
    }
    const op = ['?//', '//=', '|=', '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '//', '|', ',', '+', '-', '*', '/', '%', '=', '<', '>', '?'].find(o => texte.startsWith(o, i))
    if (op) { i += op.length; jetons.push({ t: 'op', v: op, d }); continue }
    i++
    jetons.push({ t: c, v: c, d })
  }
  return jetons
}

const OUVRANTS = { '(': ')', '[': ']', '{': '}' }
function finGroupe(jetons, i) {
  let n = 0
  for (let k = i; k < jetons.length; k++) {
    const t = jetons[k].t
    if (t in OUVRANTS || (t === 'mot' && ['if', 'try', 'reduce', 'foreach', 'def'].includes(jetons[k].v) && false)) n++
    if ([')', ']', '}'].includes(t)) { n--; if (n === 0) return k }
  }
  return jetons.length - 1
}

// Découpe au niveau 0 sur un opérateur (|, ;, ,), en tenant compte de if…end.
function découperJq(jetons, sép) {
  const parties = [[]]
  let n = 0, blocs = 0
  for (const j of jetons) {
    if (j.t in OUVRANTS) n++
    if ([')', ']', '}'].includes(j.t)) n--
    if (j.t === 'mot' && j.v === 'if') blocs++
    if (j.t === 'mot' && j.v === 'end') blocs--
    if (n === 0 && blocs === 0 && ((j.t === 'op' && j.v === sép) || j.t === sép)) parties.push([])
    else parties.at(-1).push(j)
  }
  return parties.filter(p => p.length)
}

// Un jeton vérifie-t-il le prédicat au niveau 0 (hors parenthèses, crochets, accolades) ?
function auNiveau0(jetons, prédicat) {
  let n = 0
  for (const j of jetons) {
    if (j.t in OUVRANTS) n++
    else if ([')', ']', '}'].includes(j.t)) n--
    else if (n === 0 && prédicat(j)) return true
  }
  return false
}

const texteJq = (jetons, src) => (jetons.length ? src.slice(jetons[0].d, jetons.at(-1).d + jetons.at(-1).v.length) : '')

function condition(jetons, src) {
  return texteJq(jetons, src)
    .replace(/\s==\s/g, ' vaut ').replace(/\s!=\s/g, ' est différent de ').replace(/\s>=\s/g, ' ≥ ').replace(/\s<=\s/g, ' ≤ ')
    .replace(/\band\b/g, 'et').replace(/\bor\b/g, 'ou').replace(/\|\s*not\b/g, '(négation)')
}

function cheminLisible(jetons, src) {
  const morceaux = []
  for (let k = 0; k < jetons.length; k++) {
    const j = jetons[k]
    if (j.t === 'champ') morceaux.push(`le champ ${j.v.slice(1)}`)
    else if (j.t === '[') {
      const f = finGroupe(jetons, k)
      const dedans = texteJq(jetons.slice(k + 1, f), src)
      const opt = jetons[f + 1]?.v === '?'
      if (!dedans) morceaux.push(`chaque élément${opt ? ' (sans erreur si absent)' : ''}`)
      else if (/^-?\d+$/.test(dedans)) morceaux.push(Number(dedans) < 0 ? `l'élément n° ${-Number(dedans)} depuis la fin` : `l'élément à la position ${dedans}`)
      else if (dedans.includes(':')) morceaux.push(`la tranche [${dedans}]`)
      else morceaux.push(`la clé ${dedans}`)
      k = f + (opt ? 1 : 0)
    } else if (j.t === 'point') morceaux.push('l\'entrée')
    else if (j.t === 'récursif') morceaux.push('toutes les valeurs, récursivement')
    else if (j.v === '?') morceaux.push('(sans erreur)')
  }
  return morceaux.join(', puis ')
}

const estChemin = jetons => jetons.length && jetons.every((j, k) => ['champ', 'point', 'récursif', 'nombre', ':'].includes(j.t) || j.t === '[' || j.t === ']' || (j.t === 'op' && j.v === '?') || (j.t === 'op' && j.v === '-' && jetons[k - 1]?.t === '['))

function étapesJq(jetons, src, niveau, sortie) {
  const pipes = découperJq(jetons, '|')
  if (pipes.length > 1) {
    pipes.forEach((p, i) => {
      // « E as $x | … »
      étapesJq(p, src, niveau, sortie)
      if (i < pipes.length - 1 && niveau === 0) sortie.at(-1).texte += ''
    })
    return
  }
  const virgules = découperJq(jetons, ',')
  if (virgules.length > 1) {
    sortie.push({ code: texteJq(jetons, src), texte: `Produit ${virgules.length} résultats à la suite :`, niveau })
    for (const v of virgules) étapesJq(v, src, niveau + 1, sortie)
    return
  }
  const code = texteJq(jetons, src)
  const j0 = jetons[0]
  if (!j0) return
  // E as $x
  const as = jetons.findIndex(j => j.t === 'mot' && j.v === 'as')
  if (as > 0 && j0.v !== 'reduce' && j0.v !== 'foreach') {
    sortie.push({ code, texte: `Mémorise ${texteJq(jetons.slice(0, as), src)} dans ${texteJq(jetons.slice(as + 1), src)} pour la suite.`, niveau })
    return
  }
  if (estChemin(jetons)) { sortie.push({ code, texte: `Prend ${cheminLisible(jetons, src)}.`, niveau }); return }
  // Chemin suivi d'autres opérateurs : alternative, comparaison…
  const alt = découperJq(jetons, '//')
  void 0
  if (alt.length > 1) { sortie.push({ code, texte: `${texteJq(alt[0], src)}, ou à défaut (null ou false) ${alt.slice(1).map(a => texteJq(a, src)).join(' puis ')}.`, niveau }); return }
  if (auNiveau0(jetons, j => (j.t === 'op' && ['==', '!=', '<', '<=', '>', '>='].includes(j.v)) || (j.t === 'mot' && (j.v === 'and' || j.v === 'or')))) {
    sortie.push({ code, texte: `Teste : ${condition(jetons, src)}.`, niveau })
    return
  }
  if (j0.t === '[' && finGroupe(jetons, 0) === jetons.length - 1) {
    sortie.push({ code, texte: 'Rassemble dans un tableau tous les résultats de :', niveau })
    étapesJq(jetons.slice(1, -1), src, niveau + 1, sortie)
    return
  }
  if (j0.t === '[' && finGroupe(jetons, 0) < jetons.length - 1) {
    const f = finGroupe(jetons, 0)
    sortie.push({ code, texte: `Rassemble dans un tableau, puis prend ${cheminLisible(jetons.slice(f + 1), src)} :`, niveau })
    étapesJq(jetons.slice(1, f), src, niveau + 1, sortie)
    return
  }
  if (j0.t === '(' && finGroupe(jetons, 0) === jetons.length - 1) { étapesJq(jetons.slice(1, -1), src, niveau, sortie); return }
  if (j0.t === '(' && finGroupe(jetons, 0) < jetons.length - 1) {
    const f = finGroupe(jetons, 0)
    sortie.push({ code, texte: `Calcule ${texteJq(jetons.slice(1, f), src)}, puis prend ${cheminLisible(jetons.slice(f + 1), src)}.`, niveau })
    étapesJq(jetons.slice(1, f), src, niveau + 1, sortie)
    return
  }
  if (j0.t === '{') {
    const f = finGroupe(jetons, 0)
    const paires = découperJq(jetons.slice(1, f), ',')
    const textes = paires.map(p => {
      const deux = p.findIndex(x => x.t === ':')
      if (deux < 0) return `${texteJq(p, src)} ← .${texteJq(p, src).replace(/^\$/, '')}`
      return `${texteJq(p.slice(0, deux), src)} ← ${texteJq(p.slice(deux + 1), src)}`
    })
    sortie.push({ code, texte: `Construit un objet : ${textes.join(', ')}.`, niveau })
    return
  }
  if (j0.t === 'ident') {
    const nom = j0.v
    if (jetons[1]?.t === '(') {
      const f = finGroupe(jetons, 1)
      const args = découperJq(jetons.slice(2, f), ';')
      if (nom === 'select') { sortie.push({ code, texte: `Garde l'élément si : ${condition(args[0] || [], src)}.`, niveau }); return }
      if (nom === 'map') { sortie.push({ code, texte: 'Pour chaque élément du tableau :', niveau }); étapesJq(args[0] || [], src, niveau + 1, sortie); return }
      if (['any', 'all'].includes(nom) && args.length === 2) { sortie.push({ code, texte: `${nom === 'any' ? 'Vrai si au moins une' : 'Vrai si toutes les'} valeur(s) de ${texteJq(args[0], src)} vérifie(nt) : ${condition(args[1], src)}.`, niveau }); return }
      sortie.push({ code, texte: `${nom}(${args.map(a => texteJq(a, src)).join('; ')}) : ${FONCTIONS_JQ[nom] || 'fonction jq'}.`, niveau })
      return
    }
    if (jetons.length === 1) { sortie.push({ code, texte: `${nom} : ${FONCTIONS_JQ[nom] || 'fonction ou filtre jq'}.`, niveau }); return }
  }
  if (j0.t === 'format') { sortie.push({ code, texte: `${j0.v} : ${FORMATS_JQ[j0.v] || 'format jq'}.`, niveau }); return }
  if (j0.t === 'mot' && j0.v === 'if') { sortie.push({ code, texte: 'Condition : si … alors … sinon … (if / then / else / end).', niveau }); return }
  if (j0.t === 'mot' && (j0.v === 'reduce' || j0.v === 'foreach')) { sortie.push({ code, texte: `${j0.v} : parcourt les valeurs en accumulant un résultat.`, niveau }); return }
  if (j0.t === 'mot' && j0.v === 'try') { sortie.push({ code, texte: 'try : ignore (ou rattrape) les erreurs de l\'expression.', niveau }); return }
  if (j0.t === 'mot' && j0.v === 'def') { sortie.push({ code, texte: 'Définit une fonction jq réutilisable.', niveau }); return }
  if (j0.t === 'chaîne' && jetons.length === 1) { sortie.push({ code, texte: j0.v.includes('\\(') ? 'Texte construit avec des valeurs insérées (interpolation \\(…)).' : `Texte littéral ${j0.v}.`, niveau }); return }
  if (j0.t === 'nombre' && jetons.length === 1) { sortie.push({ code, texte: `Nombre ${j0.v}.`, niveau }); return }
  if (auNiveau0(jetons, j => j.t === 'op' && ['+', '-', '*', '/', '%'].includes(j.v))) { sortie.push({ code, texte: `Calcule ${code}.`, niveau }); return }
  sortie.push({ code, texte: 'Expression jq.', niveau })
}

export function expliquerJq(requête) {
  if (!requête || !requête.trim()) return { ok: false, erreur: 'Requête vide.', étapes: [] }
  let jetons
  try { jetons = jetonsJq(requête) } catch (e) { return { ok: false, erreur: e.message, étapes: [] } }
  const étapes = []
  try { étapesJq(jetons, requête, 0, étapes) } catch (e) { return { ok: false, erreur: `Explication impossible : ${e.message}`, étapes } }
  return { ok: true, étapes }
}
