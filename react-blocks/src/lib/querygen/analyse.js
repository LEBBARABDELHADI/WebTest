// Analyse de la structure d'un document JSON : collections (tableaux, y
// compris imbriqués comme Reservations[].Instances[]), champs de leurs
// éléments avec statistiques (présence, null, types, valeurs), étiquettes AWS
// (Tags Key/Value), occurrences de chaque clé.
import { ITER, cléValeur, contientIteration, dernierNom, lire, lireTous, texteChemin, typeJson } from './chemins.js'

const MAX_NŒUDS = 400000
const MAX_CHAMPS = 400
const MAX_DISTINCTS = 300
const PROFONDEUR_CHAMPS = 7

const cléChemin = c => JSON.stringify(c)

// Champs (chemins relatifs) des éléments d'une collection.
function cheminsDesÉléments(éléments, limite = 3000) {
  const vus = new Map()
  const ajouter = (chemin, feuille) => {
    const k = cléChemin(chemin)
    if (!vus.has(k)) vus.set(k, { chemin, feuille })
    else if (feuille) vus.get(k).feuille = true
  }
  const visiter = (v, chemin, prof) => {
    if (vus.size > MAX_CHAMPS) return
    const t = typeJson(v)
    if (t === 'object') {
      if (chemin.length) ajouter(chemin, false)
      if (prof >= PROFONDEUR_CHAMPS) return
      for (const k of Object.keys(v)) visiter(v[k], [...chemin, k], prof + 1)
    } else if (t === 'array') {
      if (chemin.length) ajouter(chemin, false)
      if (prof >= PROFONDEUR_CHAMPS || !chemin.length) return
      for (const e of v.slice(0, 50)) visiter(e, [...chemin, ITER], prof + 1)
    } else if (chemin.length) ajouter(chemin, true)
  }
  for (const e of éléments.slice(0, limite)) visiter(e, [], 0)
  return [...vus.values()]
}

// Statistiques d'un champ sur les éléments.
function statistiques(éléments, chemin, valeurDe) {
  const types = {}
  const valeurs = new Map()
  let présents = 0, nuls = 0, absents = 0
  const multi = contientIteration(chemin)
  for (const e of éléments) {
    const v = valeurDe(e)
    if (v === undefined) { absents++; continue }
    if (v === null) { nuls++; continue }
    présents++
    const feuilles = multi && Array.isArray(v) ? v : [v]
    for (const f of feuilles) {
      const t = typeJson(f)
      types[t] = (types[t] || 0) + 1
      if (t !== 'object' && t !== 'array' && valeurs.size < MAX_DISTINCTS) {
        const k = cléValeur(f)
        const x = valeurs.get(k)
        if (x) x.n++
        else valeurs.set(k, { valeur: f, n: 1 })
      }
    }
  }
  return { présents, nuls, absents, types, valeurs, distincts: valeurs.size, multi }
}

// Valeur d'un champ pour un élément : chemin simple, chemin avec itération
// (liste), ou étiquette AWS.
export function valeurChamp(élément, champ) {
  if (champ.tag) {
    const tags = lire(élément, champ.tag.chemin)
    if (!Array.isArray(tags)) return undefined
    const t = tags.find(x => x && typeof x === 'object' && x[champ.tag.kClé] === champ.tag.clé)
    return t ? t[champ.tag.kValeur] : undefined
  }
  if (!champ.chemin.length) return élément
  if (contientIteration(champ.chemin)) {
    const premier = champ.chemin.indexOf(ITER)
    const base = lire(élément, champ.chemin.slice(0, premier))
    if (base === undefined) return undefined
    if (base === null) return null
    return lireTous(élément, champ.chemin).filter(x => x !== undefined && x !== null)
  }
  return lire(élément, champ.chemin)
}

// Étiquettes : tableau d'objets {Key, Value} (AWS) ou {key, value}.
function étiquettes(éléments, champs) {
  const sortie = []
  for (const c of champs) {
    if (c.feuille || contientIteration(c.chemin)) continue
    const nom = dernierNom(c.chemin)
    if (!/^tags?$/i.test(nom)) continue
    const clés = new Map()
    let kClé = null, kValeur = null
    for (const e of éléments.slice(0, 5000)) {
      const tags = lire(e, c.chemin)
      if (!Array.isArray(tags)) continue
      for (const t of tags) {
        if (!t || typeof t !== 'object') continue
        const kc = 'Key' in t ? 'Key' : 'key' in t ? 'key' : null
        const kv = 'Value' in t ? 'Value' : 'value' in t ? 'value' : null
        if (!kc || !kv) continue
        kClé = kc; kValeur = kv
        if (typeof t[kc] === 'string' && clés.size < 60) clés.set(t[kc], true)
      }
    }
    if (kClé) for (const clé of clés.keys()) sortie.push({ clé, chemin: c.chemin, kClé, kValeur })
  }
  return sortie
}

function décrireChamp(champ) {
  if (champ.tag) return `${texteChemin(champ.tag.chemin)}[${champ.tag.kClé}=${champ.tag.clé}].${champ.tag.kValeur}`
  return champ.chemin.length ? texteChemin(champ.chemin) : '(élément)'
}

// Analyse complète. racine : valeur JSON déjà lue.
export function analyserStructure(racine) {
  let nœuds = 0
  let tronqué = false
  const tableaux = new Map()     // chemin abstrait → { chemin, éléments }
  const clés = new Map()         // nom de clé → Map(chemin abstrait → { chemin, n })
  const objetsRacine = []        // chemins sans itération vers des objets (hors racine)

  const visiter = (v, chemin) => {
    if (++nœuds > MAX_NŒUDS) { tronqué = true; return }
    const t = typeJson(v)
    if (t === 'array') {
      const k = cléChemin(chemin)
      let info = tableaux.get(k)
      if (!info) { info = { chemin: [...chemin, ITER], éléments: [] }; tableaux.set(k, info) }
      for (const e of v) info.éléments.push(e)
      for (const e of v) { visiter(e, [...chemin, ITER]); if (tronqué) return }
    } else if (t === 'object') {
      if (chemin.length && !contientIteration(chemin)) objetsRacine.push(chemin)
      for (const k of Object.keys(v)) {
        const ck = [...chemin, k]
        let m = clés.get(k)
        if (!m) { m = new Map(); clés.set(k, m) }
        const kk = cléChemin(ck)
        const o = m.get(kk)
        if (o) o.n++
        else m.set(kk, { chemin: ck, n: 1 })
        visiter(v[k], ck)
        if (tronqué) return
      }
    }
  }
  visiter(racine, [])

  const collections = []
  for (const info of tableaux.values()) {
    const éléments = info.éléments
    if (!éléments.length) {
      collections.push({ id: texteChemin(info.chemin), chemin: info.chemin, éléments, nombre: 0, typeÉléments: 'vide', champs: [], optionnels: optionnelsSource(racine, info.chemin) })
      continue
    }
    const objets = éléments.filter(e => typeJson(e) === 'object').length
    const typeÉléments = objets === éléments.length ? 'objet' : objets === 0 && éléments.every(e => typeJson(e) !== 'array') ? 'scalaire' : 'mixte'
    let champs = []
    if (typeÉléments === 'scalaire') {
      champs = [{ chemin: [], feuille: true }]
    } else if (typeÉléments !== 'vide') {
      champs = cheminsDesÉléments(éléments)
      for (const tag of étiquettes(éléments, champs)) champs.push({ chemin: tag.chemin, tag, feuille: true })
    }
    for (const c of champs) {
      Object.assign(c, statistiques(éléments, c.chemin, e => valeurChamp(e, c)))
      c.texte = décrireChamp(c)
      c.nom = c.tag ? c.tag.clé : dernierNom(c.chemin)
      c.optionnels = c.tag ? new Set() : optionnelsRelatifs(éléments, c.chemin)
    }
    collections.push({
      id: texteChemin(info.chemin),
      chemin: info.chemin,
      éléments,
      nombre: éléments.length,
      typeÉléments,
      champs,
      optionnels: optionnelsSource(racine, info.chemin),
      alias: aliasCollection(éléments),
    })
  }
  // Ordre : collections d'objets d'abord, puis les plus proches de la racine, puis les plus grandes.
  const poids = c => (c.typeÉléments === 'objet' ? 0 : c.typeÉléments === 'scalaire' ? 1 : 2)
  collections.sort((a, b) => poids(a) - poids(b) || a.chemin.filter(s => s === ITER).length - b.chemin.filter(s => s === ITER).length || b.nombre - a.nombre)

  // Clés : chemins abstraits où chaque clé apparaît.
  const indexClés = new Map()
  for (const [nom, m] of clés) indexClés.set(nom, [...m.values()])

  return {
    typeRacine: typeJson(racine),
    collections,
    clés: indexClés,
    objetsRacine: objetsRacine.slice(0, 2000),
    tronqué,
    nœuds,
  }
}

// Positions des itérations de la source où le tableau manque parfois (jq : « []? »).
function optionnelsSource(racine, chemin) {
  const sortie = new Set()
  chemin.forEach((s, i) => {
    if (s !== ITER) return
    const parents = lireTous(racine, chemin.slice(0, i))
    if (parents.some(p => !Array.isArray(p))) sortie.add(i)
  })
  return sortie
}

function optionnelsRelatifs(éléments, chemin) {
  const sortie = new Set()
  chemin.forEach((s, i) => {
    if (s !== ITER) return
    for (const e of éléments) {
      const parents = lireTous(e, chemin.slice(0, i))
      if (parents.some(p => !Array.isArray(p))) { sortie.add(i); break }
    }
  })
  return sortie
}

// Noms alternatifs d'une collection : valeur dominante de « kind » (Kubernetes).
function aliasCollection(éléments) {
  const kinds = new Map()
  for (const e of éléments.slice(0, 500)) {
    const k = e && typeof e === 'object' ? e.kind : undefined
    if (typeof k === 'string') kinds.set(k, (kinds.get(k) || 0) + 1)
  }
  const sortie = []
  for (const [k, n] of kinds) if (n >= éléments.slice(0, 500).length * 0.6) sortie.push(k)
  return sortie
}

// Résumé pour l'interface (sérialisable : envoyé par le Web Worker).
export function résuméStructure(a) {
  return {
    typeRacine: a.typeRacine,
    tronqué: a.tronqué,
    collections: a.collections.slice(0, 40).map(c => ({
      id: c.id,
      chemin: c.chemin,
      nombre: c.nombre,
      typeÉléments: c.typeÉléments,
      champs: c.champs.filter(ch => ch.feuille || ch.tag).slice(0, 120).map(ch => ({
        texte: ch.texte,
        nom: ch.nom,
        chemin: ch.chemin,
        tag: ch.tag || null,
        présents: ch.présents,
        nuls: ch.nuls + ch.absents,
        types: Object.keys(ch.types),
        exemples: [...ch.valeurs.values()].slice(0, 12).map(x => x.valeur),
        distincts: ch.distincts,
        multi: ch.multi,
      })),
    })),
    clés: [...a.clés.keys()].slice(0, 400),
  }
}
