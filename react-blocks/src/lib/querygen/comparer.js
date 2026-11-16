// Comparaison du résultat obtenu avec le résultat attendu : exacte, sans tenir
// compte de l'ordre des tableaux, ou partielle (l'attendu est un extrait).
// Produit la liste des différences, chemin par chemin.
import { aperçu, cléValeur, égal, typeJson } from './chemins.js'

export const MODES = {
  exact: 'Exacte',
  sansOrdre: 'Ordre indifférent',
  partiel: 'Partielle (extrait)',
}

const TYPES_FR = { null: 'null', boolean: 'booléen', number: 'nombre', string: 'texte', array: 'tableau', object: 'objet' }
const sousChemin = (chemin, k) => (typeof k === 'number' ? `${chemin}[${k}]` : /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? `${chemin}.${k}` : `${chemin}[${JSON.stringify(k)}]`)

// a est-il inclus dans b (mode partiel) ?
export function inclus(a, b) {
  const ta = typeJson(a), tb = typeJson(b)
  if (ta !== tb) return false
  if (ta === 'object') return Object.keys(a).every(k => Object.prototype.hasOwnProperty.call(b, k) && inclus(a[k], b[k]))
  if (ta === 'array') {
    const pris = new Set()
    return a.every(x => { const i = b.findIndex((y, j) => !pris.has(j) && inclus(x, y)); if (i < 0) return false; pris.add(i); return true })
  }
  return égal(a, b)
}

// Égalité sans tenir compte de l'ordre (à tous les niveaux).
export function égalSansOrdre(a, b) {
  const ta = typeJson(a), tb = typeJson(b)
  if (ta !== tb) return false
  if (ta === 'array') {
    if (a.length !== b.length) return false
    const clé = x => cléValeur(normaliserOrdre(x))
    const compte = new Map()
    for (const x of a) compte.set(clé(x), (compte.get(clé(x)) || 0) + 1)
    for (const y of b) { const k = clé(y); const n = compte.get(k); if (!n) return false; compte.set(k, n - 1) }
    return true
  }
  if (ta === 'object') return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.prototype.hasOwnProperty.call(b, k) && égalSansOrdre(a[k], b[k]))
  return égal(a, b)
}

function normaliserOrdre(v) {
  const t = typeJson(v)
  if (t === 'array') return v.map(normaliserOrdre).sort((x, y) => (cléValeur(x) < cléValeur(y) ? -1 : 1))
  if (t === 'object') return Object.fromEntries(Object.keys(v).map(k => [k, normaliserOrdre(v[k])]))
  return v
}

export function correspond(obtenu, attendu, mode) {
  if (mode === 'partiel') return inclus(attendu, obtenu)
  if (mode === 'sansOrdre') return égalSansOrdre(obtenu, attendu)
  return égal(obtenu, attendu)
}

// Différences détaillées (au plus max).
function différences(o, a, mode, chemin, sortie, max) {
  if (sortie.length >= max) return
  const to = typeJson(o), ta = typeJson(a)
  if (o === undefined) { sortie.push({ chemin, type: 'manquant', attendu: a, message: `${chemin || 'racine'} : absent du résultat (attendu ${aperçu(a)})` }); return }
  if (to !== ta) { sortie.push({ chemin, type: 'type', attendu: a, obtenu: o, message: `${chemin || 'racine'} : ${TYPES_FR[ta]} attendu, ${TYPES_FR[to]} obtenu (${aperçu(o)})` }); return }
  if (ta === 'object') {
    for (const k of Object.keys(a)) {
      if (!Object.prototype.hasOwnProperty.call(o, k)) sortie.push({ chemin: sousChemin(chemin, k), type: 'manquant', attendu: a[k], message: `${sousChemin(chemin, k)} : clé absente du résultat (attendu ${aperçu(a[k])})` })
      else différences(o[k], a[k], mode, sousChemin(chemin, k), sortie, max)
      if (sortie.length >= max) return
    }
    if (mode !== 'partiel') for (const k of Object.keys(o)) if (!Object.prototype.hasOwnProperty.call(a, k)) sortie.push({ chemin: sousChemin(chemin, k), type: 'enTrop', obtenu: o[k], message: `${sousChemin(chemin, k)} : clé en trop (${aperçu(o[k])})` })
    return
  }
  if (ta === 'array') {
    if (mode === 'exact') {
      if (égalSansOrdre(o, a)) { sortie.push({ chemin, type: 'ordre', message: `${chemin || 'racine'} : mêmes éléments, mais dans un ordre différent` }); return }
      if (o.length !== a.length) sortie.push({ chemin, type: 'longueur', attendu: a.length, obtenu: o.length, message: `${chemin || 'racine'} : ${o.length} élément(s) obtenu(s), ${a.length} attendu(s)` })
      for (let i = 0; i < Math.max(o.length, a.length) && sortie.length < max; i++) {
        if (i >= o.length) sortie.push({ chemin: sousChemin(chemin, i), type: 'manquant', attendu: a[i], message: `${sousChemin(chemin, i)} : élément manquant (attendu ${aperçu(a[i])})` })
        else if (i >= a.length) sortie.push({ chemin: sousChemin(chemin, i), type: 'enTrop', obtenu: o[i], message: `${sousChemin(chemin, i)} : élément en trop (${aperçu(o[i])})` })
        else if (!égal(o[i], a[i])) différences(o[i], a[i], mode, sousChemin(chemin, i), sortie, max)
      }
      return
    }
    // Sans ordre / partiel : appariement des éléments.
    const test = mode === 'partiel' ? (x, y) => inclus(x, y) : (x, y) => égalSansOrdre(y, x)
    const pris = new Set()
    const manquants = []
    a.forEach((x, i) => { const j = o.findIndex((y, k) => !pris.has(k) && test(x, y)); if (j < 0) manquants.push(i); else pris.add(j) })
    const enTrop = o.map((_, k) => k).filter(k => !pris.has(k))
    for (const i of manquants) {
      if (sortie.length >= max) return
      // Élément proche (mêmes clés) : différences champ par champ.
      const proche = enTrop.find(k => typeJson(o[k]) === 'object' && typeJson(a[i]) === 'object' && Object.keys(a[i]).some(c => égal(o[k][c], a[i][c])))
      if (proche !== undefined && mode !== 'partiel') { différences(o[proche], a[i], mode, sousChemin(chemin, i), sortie, max); enTrop.splice(enTrop.indexOf(proche), 1) } else sortie.push({ chemin: sousChemin(chemin, i), type: 'manquant', attendu: a[i], message: `${sousChemin(chemin, i)} : ${aperçu(a[i])} attendu, introuvable dans le résultat` })
    }
    if (mode !== 'partiel') for (const k of enTrop) { if (sortie.length >= max) return; sortie.push({ chemin: sousChemin(chemin, k), type: 'enTrop', obtenu: o[k], message: `${sousChemin(chemin, k)} : élément en trop (${aperçu(o[k])})` }) }
    return
  }
  if (!égal(o, a)) sortie.push({ chemin, type: 'valeur', attendu: a, obtenu: o, message: `${chemin || 'racine'} : ${aperçu(a)} attendu, ${aperçu(o)} obtenu` })
}

// Comparaison complète. obtenu peut être { flux: [...] } (jq a produit
// plusieurs documents) ; attendu peut être { flux: [...] }.
export function comparer(obtenu, attendu, mode = 'exact', max = 25) {
  const fluxO = obtenu && obtenu.__flux, fluxA = attendu && attendu.__flux
  const vo = fluxO ? obtenu.valeurs : obtenu, va = fluxA ? attendu.valeurs : attendu
  const remarques = []
  if (fluxO && !fluxA) remarques.push(`La requête produit ${vo.length} résultats séparés (flux) au lieu d'un seul document : entourez-la de [ … ] pour obtenir un tableau.`)
  if (fluxA && !fluxO && Array.isArray(vo)) remarques.push('Le résultat attendu est un flux de documents ; la requête renvoie un tableau.')
  if (fluxO !== fluxA && !(fluxA && Array.isArray(vo) && correspond(vo, va, mode))) {
    return { égal: false, différences: [], remarques, résumé: remarques[0] || 'Forme différente' }
  }
  const ok = correspond(vo, va, mode)
  if (ok) return { égal: true, différences: [], remarques, résumé: mode === 'partiel' ? 'Le résultat contient l\'extrait attendu.' : mode === 'sansOrdre' ? 'Résultat identique (ordre ignoré).' : 'Résultat identique à l\'attendu.' }
  const diffs = []
  différences(vo, va, mode, '', diffs, max)
  return { égal: false, différences: diffs, remarques, résumé: `${diffs.length}${diffs.length >= max ? '+' : ''} différence(s)` }
}

// Valeur logique d'une exécution jq : un document, ou un flux de plusieurs.
export function valeurDesSorties(sorties, attenduFlux = false) {
  if (attenduFlux) return { __flux: true, valeurs: sorties }
  if (sorties.length === 1) return sorties[0]
  return { __flux: true, valeurs: sorties }
}
