// Plan de requête : représentation intermédiaire indépendante des langages.
// jq et JMESPath sont générés séparément à partir du plan (chacun avec ses
// propres règles), puis exécutés par les vrais moteurs. L'évaluateur ci-dessous
// calcule le résultat voulu par le plan : il sert à la recherche (synthèse) et
// à vérifier que les deux requêtes donnent bien ce résultat.
//
// Types de plan :
//   collection : { source, filtre?, tri?, tranche?, premier?, projection?, ignorerNull?, unique?, agrégat?, groupe?, flux? }
//   valeur     : { chemin }                  valeur à un chemin (liste si itération)
//   valeurs    : { chemins }                 plusieurs occurrences d'une clé
//   objet      : { champs: [{ nom, chemin }] } objet construit depuis la racine
//   clés       : { chemin }                  clés d'un objet
//   longueur   : { chemin }                  taille d'un tableau, objet ou chaîne
// Projection : { type: 'champ', chemin } | { type: 'tag', tag } | { type: 'objet', champs: [{ nom, valeur }] }
//              | { type: 'liste', éléments } | { type: 'élément' }
// Condition  : { type: 'cmp', champ, op, valeur } | { type: 'contient'|'commence'|'finit', champ, valeur }
//              | { type: 'existe'|'absent', champ } | { type: 'dans', champ, valeurs } | { type: 'et'|'ou', conds } | { type: 'non', cond }
// Un « champ » est { chemin } ou { tag: { clé, chemin, kClé, kValeur } }.
import { ITER, aperçu, comparerJq, contientIteration, cléValeur, égal, lire, lireTous, texteChemin, typeJson } from './chemins.js'

// Éléments atteints par le chemin source (branches absentes ignorées).
export function élémentsSource(racine, source) {
  const sortie = []
  const aller = (v, i) => {
    if (i === source.length) { sortie.push(v); return }
    const s = source[i]
    if (s === ITER) { if (Array.isArray(v)) for (const e of v) aller(e, i + 1); return }
    if (v === null || v === undefined) return
    const x = typeof s === 'number' ? (Array.isArray(v) ? v[s < 0 ? v.length + s : s] : undefined) : (typeJson(v) === 'object' ? v[s] : undefined)
    if (x === undefined) return
    aller(x, i + 1)
  }
  aller(racine, 0)
  return sortie
}

// Valeur d'un champ d'élément. Chemin avec itération : liste des valeurs non nulles.
export function valeurDe(e, champ) {
  if (champ.tag) {
    const tags = lire(e, champ.tag.chemin)
    if (!Array.isArray(tags)) return null
    const t = tags.find(x => x && typeof x === 'object' && x[champ.tag.kClé] === champ.tag.clé)
    return t ? (t[champ.tag.kValeur] ?? null) : null
  }
  const c = champ.chemin
  if (!c.length) return e
  if (contientIteration(c)) return lireTous(e, c).filter(x => x !== undefined && x !== null)
  const v = lire(e, c)
  return v === undefined ? null : v
}

const ordonnable = (a, b) => (typeof a === 'number' && typeof b === 'number') || (typeof a === 'string' && typeof b === 'string')

export function tester(e, cond) {
  switch (cond.type) {
    case 'et': return cond.conds.every(c => tester(e, c))
    case 'ou': return cond.conds.some(c => tester(e, c))
    case 'non': return !tester(e, cond.cond)
    default: break
  }
  const multi = !cond.champ.tag && contientIteration(cond.champ.chemin)
  const valeurs = multi ? valeurDe(e, cond.champ) : [valeurDe(e, cond.champ)]
  return valeurs.some(a => testerValeur(a, cond))
}

function testerValeur(a, cond) {
  switch (cond.type) {
    case 'cmp': {
      if (cond.op === '==') return égal(a, cond.valeur)
      if (cond.op === '!=') return !égal(a, cond.valeur)
      if (!ordonnable(a, cond.valeur)) return false
      if (cond.op === '<') return a < cond.valeur
      if (cond.op === '<=') return a <= cond.valeur
      if (cond.op === '>') return a > cond.valeur
      return a >= cond.valeur
    }
    case 'contient': return typeof a === 'string' && a.includes(cond.valeur)
    case 'commence': return typeof a === 'string' && a.startsWith(cond.valeur)
    case 'finit': return typeof a === 'string' && a.endsWith(cond.valeur)
    case 'existe': return a !== null && a !== undefined
    case 'absent': return a === null || a === undefined
    case 'dans': return cond.valeurs.some(x => égal(a, x))
    default: throw new Error(`Condition inconnue : ${cond.type}`)
  }
}

export function projeter(e, p) {
  switch (p.type) {
    case 'élément': return e
    case 'champ': return valeurDe(e, { chemin: p.chemin })
    case 'tag': return valeurDe(e, { tag: p.tag })
    case 'objet': return Object.fromEntries(p.champs.map(c => [c.nom, projeter(e, c.valeur)]))
    case 'liste': return p.éléments.map(x => projeter(e, x))
    default: throw new Error(`Projection inconnue : ${p.type}`)
  }
}

const trier = (liste, clé) => liste.map((e, i) => ({ e, i, k: clé(e) })).sort((a, b) => comparerJq(a.k, b.k) || a.i - b.i).map(x => x.e)

function uniques(liste) {
  const vus = new Set()
  return trier(liste, x => x).filter(x => { const k = cléValeur(x); if (vus.has(k)) return false; vus.add(k); return true })
}

function agréger(liste, a) {
  if (a.op === 'nombre') return liste.length
  if (a.op === 'minPar' || a.op === 'maxPar') {
    const avec = liste.filter(e => valeurDe(e, a.champ) !== null)
    if (!avec.length) return null
    let meilleur = avec[0]
    for (const e of avec.slice(1)) {
      const c = comparerJq(valeurDe(e, a.champ), valeurDe(meilleur, a.champ))
      if (a.op === 'minPar' ? c < 0 : c > 0) meilleur = e
    }
    return meilleur
  }
  const valeurs = liste.map(e => valeurDe(e, a.champ)).filter(v => v !== null && v !== undefined)
  if (a.op === 'somme') return valeurs.filter(v => typeof v === 'number').reduce((s, v) => s + v, 0)
  if (a.op === 'moyenne') { const n = valeurs.filter(v => typeof v === 'number'); return n.length ? n.reduce((s, v) => s + v, 0) / n.length : null }
  if (a.op === 'min' || a.op === 'max') {
    if (!valeurs.length) return null
    return valeurs.reduce((m, v) => (a.op === 'min' ? (comparerJq(v, m) < 0 ? v : m) : (comparerJq(v, m) > 0 ? v : m)))
  }
  if (a.op === 'joindre') return valeurs.map(String).join(a.séparateur ?? ', ')
  throw new Error(`Agrégat inconnu : ${a.op}`)
}

function mesurer(groupe, m) {
  if (m.op === 'nombre') return groupe.length
  if (m.op === 'liste') return groupe.map(e => projeter(e, m.projection)).filter(v => !(m.ignorerNull && v === null))
  return agréger(groupe, m)
}

export const texteClé = k => (typeof k === 'string' ? k : k === null || k === undefined ? 'null' : JSON.stringify(k))

function grouper(liste, g) {
  const groupes = []
  for (const e of trier(liste, x => valeurDe(x, g.champ))) {
    const k = valeurDe(e, g.champ)
    const dernier = groupes.at(-1)
    if (dernier && égal(dernier.clé, k)) dernier.éléments.push(e)
    else groupes.push({ clé: k, éléments: [e] })
  }
  if (g.forme === 'objet') return Object.fromEntries(groupes.map(x => [texteClé(x.clé), mesurer(x.éléments, g.mesure)]))
  return groupes.map(x => ({ [g.nomClé || 'key']: x.clé, [g.nomMesure || 'count']: mesurer(x.éléments, g.mesure) }))
}

// Résultat voulu par le plan.
export function évaluer(plan, racine) {
  switch (plan.type) {
    case 'valeur': {
      if (!contientIteration(plan.chemin)) { const v = lire(racine, plan.chemin); return v === undefined ? null : v }
      return lireTous(racine, plan.chemin).filter(v => v !== undefined && v !== null)
    }
    case 'valeurs': return plan.chemins.map(c => lire(racine, c) ?? null)
    case 'objet': return Object.fromEntries(plan.champs.map(c => [c.nom, lire(racine, c.chemin) ?? null]))
    case 'clés': { const o = lire(racine, plan.chemin); return typeJson(o) === 'object' ? Object.keys(o) : null }
    case 'longueur': { const o = lire(racine, plan.chemin); const t = typeJson(o); return t === 'array' || t === 'string' ? o.length : t === 'object' ? Object.keys(o).length : t === 'null' ? 0 : null }
    case 'collection': break
    default: throw new Error(`Plan inconnu : ${plan.type}`)
  }
  let liste = élémentsSource(racine, plan.source)
  if (plan.filtre) liste = liste.filter(e => tester(e, plan.filtre))
  if (plan.groupe) return grouper(liste, plan.groupe)
  if (plan.tri) { liste = trier(liste, e => valeurDe(e, plan.tri.champ)); if (plan.tri.desc) liste.reverse() }
  if (plan.tranche) liste = liste.slice(plan.tranche.début ?? 0, plan.tranche.fin ?? undefined)
  if (plan.agrégat) {
    const r = agréger(liste, plan.agrégat)
    return (plan.agrégat.op === 'minPar' || plan.agrégat.op === 'maxPar') && plan.projection && r !== null ? projeter(r, plan.projection) : r
  }
  if (plan.premier) { const e = liste[0]; return e === undefined ? null : plan.projection ? projeter(e, plan.projection) : e }
  if (plan.projection) liste = liste.map(e => projeter(e, plan.projection))
  if (plan.ignorerNull) liste = liste.filter(v => v !== null)
  if (plan.unique) liste = uniques(liste)
  return liste
}

// ---- Description en français ------------------------------------------------

export const texteChamp = c => (c.tag ? `étiquette ${c.tag.clé}` : texteChemin(c.chemin))
const OPS = { '==': '=', '!=': '≠', '<': '<', '<=': '≤', '>': '>', '>=': '≥' }

export function texteCondition(c) {
  switch (c.type) {
    case 'et': return c.conds.map(x => (x.type === 'ou' ? `(${texteCondition(x)})` : texteCondition(x))).join(' et ')
    case 'ou': return c.conds.map(texteCondition).join(' ou ')
    case 'non': return `non (${texteCondition(c.cond)})`
    case 'cmp': return `${texteChamp(c.champ)} ${OPS[c.op]} ${aperçu(c.valeur)}`
    case 'contient': return `${texteChamp(c.champ)} contient ${aperçu(c.valeur)}`
    case 'commence': return `${texteChamp(c.champ)} commence par ${aperçu(c.valeur)}`
    case 'finit': return `${texteChamp(c.champ)} finit par ${aperçu(c.valeur)}`
    case 'existe': return `${texteChamp(c.champ)} renseigné`
    case 'absent': return `${texteChamp(c.champ)} absent ou null`
    case 'dans': return `${texteChamp(c.champ)} ∈ {${c.valeurs.map(v => aperçu(v)).join(', ')}}`
    default: return c.type
  }
}

export function texteProjection(p) {
  switch (p.type) {
    case 'élément': return 'éléments complets'
    case 'champ': return texteChemin(p.chemin)
    case 'tag': return `étiquette ${p.tag.clé}`
    case 'objet': return `{ ${p.champs.map(c => `${c.nom} ← ${texteProjection(c.valeur)}`).join(', ')} }`
    case 'liste': return `[ ${p.éléments.map(texteProjection).join(', ')} ]`
    default: return p.type
  }
}

const AGRÉGATS = { nombre: 'nombre d\'éléments', somme: 'somme', moyenne: 'moyenne', min: 'minimum', max: 'maximum', minPar: 'élément au minimum de', maxPar: 'élément au maximum de', joindre: 'texte joint' }

// Étapes lisibles d'un plan.
export function décrirePlan(plan) {
  const étapes = []
  if (plan.type === 'valeur') étapes.push(`Valeur de ${texteChemin(plan.chemin)}`)
  else if (plan.type === 'valeurs') étapes.push(`Valeurs de ${plan.chemins.map(texteChemin).join(', ')}`)
  else if (plan.type === 'objet') étapes.push(`Objet { ${plan.champs.map(c => `${c.nom} ← ${texteChemin(c.chemin)}`).join(', ')} }`)
  else if (plan.type === 'clés') étapes.push(`Clés de ${texteChemin(plan.chemin)}`)
  else if (plan.type === 'longueur') étapes.push(`Taille de ${texteChemin(plan.chemin)}`)
  else {
    étapes.push(`Parcourir ${texteChemin(plan.source)}`)
    if (plan.filtre) étapes.push(`Garder : ${texteCondition(plan.filtre)}`)
    if (plan.groupe) {
      const m = plan.groupe.mesure
      étapes.push(`Regrouper par ${texteChamp(plan.groupe.champ)} → ${m.op === 'nombre' ? 'nombre' : m.op === 'liste' ? `liste de ${texteProjection(m.projection)}` : `${AGRÉGATS[m.op]} de ${texteChamp(m.champ)}`} (${plan.groupe.forme === 'objet' ? 'objet' : 'liste'})`)
    }
    if (plan.tri) étapes.push(`Trier par ${texteChamp(plan.tri.champ)}${plan.tri.desc ? ' (décroissant)' : ''}`)
    if (plan.tranche) étapes.push(plan.tranche.début ? `Éléments ${plan.tranche.début + 1} à ${plan.tranche.fin ?? 'la fin'}` : `Les ${plan.tranche.fin} premiers`)
    if (plan.premier) étapes.push('Premier élément')
    if (plan.agrégat) étapes.push(`${AGRÉGATS[plan.agrégat.op][0].toUpperCase()}${AGRÉGATS[plan.agrégat.op].slice(1)}${plan.agrégat.champ ? ` ${texteChamp(plan.agrégat.champ)}` : ''}`)
    if (plan.projection && plan.projection.type !== 'élément') étapes.push(`Projeter : ${texteProjection(plan.projection)}`)
    if (plan.ignorerNull) étapes.push('Ignorer les valeurs null')
    if (plan.unique) étapes.push('Valeurs distinctes (triées)')
  }
  return étapes
}

// Complexité (pour préférer le plan le plus simple).
export function complexité(plan) {
  const cond = c => (!c ? 0 : c.type === 'et' || c.type === 'ou' ? c.conds.reduce((s, x) => s + cond(x), 0) + 0.5 : c.type === 'non' ? 1 + cond(c.cond) : c.type === 'dans' ? 1 + c.valeurs.length * 0.5 : c.type === 'cmp' && (c.op === '==' || c.op === '!=') ? 1 : 1.4)
  const proj = p => (!p ? 0 : p.type === 'objet' ? p.champs.reduce((s, c) => s + 0.4 + proj(c.valeur), 0) : p.type === 'liste' ? p.éléments.reduce((s, x) => s + 0.4 + proj(x), 0) : p.type === 'tag' ? 1 : p.type === 'élément' ? 0 : 0.3 + p.chemin.length * 0.05)
  if (plan.type !== 'collection') return 0.5 + (plan.chemin?.length ?? 0) * 0.05 + (plan.chemins?.length ?? 0) * 0.6 + (plan.champs?.length ?? 0) * 0.5
  return 1 + cond(plan.filtre) + proj(plan.projection) + (plan.tri ? 1.2 : 0) + (plan.tranche ? 0.8 : 0) + (plan.premier ? 0.6 : 0) + (plan.unique ? 0.8 : 0) + (plan.agrégat ? 0.6 : 0) + (plan.groupe ? 2 : 0) + (plan.ignorerNull ? 0.3 : 0) + plan.source.length * 0.03
}
