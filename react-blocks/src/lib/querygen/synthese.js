// Synthèse par l'exemple : à partir du JSON d'entrée et du résultat attendu,
// cherche les plans (collection, filtre, projection, tri, limite, agrégat,
// regroupement) qui reproduisent exactement cet attendu. Chaque plan retenu a
// été évalué ; les requêtes jq et JMESPath seront ensuite exécutées pour de vrai.
import { aperçu, cléValeur, compact, comparerJq, contientIteration, dernierNom, égal, lire, texteChemin, typeJson } from './chemins.js'
import { correspond } from './comparer.js'
import { complexité, projeter, tester, texteClé, valeurDe, évaluer } from './plan.js'

const MAX_ÉLÉMENTS = 60000
const MOTS_ÉTAT = /^(state|status|phase|etat|statut|condition|health|enabled|active|actif|ready|lifecycle)/

// ---- Ressemblance entre une clé attendue et un champ ------------------------

const SYNONYMES = {
  id: ['id', 'identifiant', 'uid', 'identifier', 'ident'],
  name: ['name', 'nom', 'libelle', 'title', 'titre'],
  type: ['type', 'kind', 'sorte'],
  size: ['size', 'taille', 'capacity', 'capacite'],
  state: ['state', 'status', 'etat', 'statut', 'phase'],
  ip: ['ip', 'ipaddress', 'address', 'adresse'],
  email: ['email', 'mail', 'courriel'],
  zone: ['zone', 'availabilityzone', 'az'],
  namespace: ['namespace', 'ns'],
  date: ['date', 'time', 'timestamp', 'created', 'creation', 'createtime', 'launchtime'],
}
const canonique = mot => {
  const m = compact(mot)
  for (const [c, liste] of Object.entries(SYNONYMES)) if (liste.includes(m)) return c
  return m
}

export function ressemblance(clé, champ) {
  const k = compact(clé)
  const nom = compact(champ.tag ? champ.tag.clé : dernierNom(champ.chemin))
  if (!k || !nom) return 0
  if (k === nom) return 1
  const ck = canonique(clé), cn = canonique(nom)
  if (ck === cn) return 0.85
  if (nom.endsWith(k) || nom.endsWith(ck)) return 0.8
  if (nom.startsWith(k)) return 0.6
  if ((SYNONYMES[ck] || []).some(s => nom.endsWith(s))) return 0.7
  if (k.includes(nom) && nom.length >= 3) return 0.5
  const complet = compact(champ.texte || '')
  if (complet.includes(k) && k.length >= 2) return 0.4
  return 0
}

function indexValeurs(éléments, champ) {
  const valeurs = éléments.map(e => valeurDe(e, champ))
  const clés = valeurs.map(v => cléValeur(v))
  return { valeurs, clés, ensemble: new Set(clés) }
}

// ---- Recherche de filtres -------------------------------------------------

const rondeur = n => {
  if (!Number.isFinite(n)) return 0
  if (n === 0) return 3
  let r = 0, x = Math.abs(n)
  if (Number.isInteger(x)) { while (x % 10 === 0 && r < 6) { x /= 10; r++ } return r + 1 }
  return 0
}

function scorePrédicat(c, champ, info, indices) {
  let s = { cmp: c.op === '==' ? 1 : c.op === '!=' ? 1.6 : 1.8, dans: 1.4 + 0.3 * (c.valeurs?.length || 0), existe: 1.7, absent: 1.8, commence: 2.2, finit: 2.3, contient: 2.4 }[c.type] ?? 2
  if ((c.type === 'cmp' && c.op === '==') || c.type === 'dans') if (info.distincts >= info.n * 0.9 && info.n > 2) s += 2 // identifiant(s) écrit(s) en dur
  if (champ.tag) s += 0.3
  if (!champ.tag) s += champ.chemin.length * 0.05
  const segments = champ.tag ? [champ.tag.clé] : champ.chemin.filter(x => typeof x === 'string')
  if (segments.some(x => MOTS_ÉTAT.test(compact(x)))) s -= 0.3
  if (c.type === 'cmp' && c.op === '==') s += typeof c.valeur === 'string' ? -0.15 : typeof c.valeur === 'number' ? 0.1 : 0
  if (indices?.champs?.some(t => ressemblance(t, champ) >= 0.8)) s -= 0.8
  if (indices?.valeurs && c.valeur !== undefined && indices.valeurs.some(v => compact(v) === compact(String(c.valeur)))) s -= 1.2
  if (indices?.valeurs && c.valeurs && c.valeurs.some(x => indices.valeurs.some(v => compact(v) === compact(String(x))))) s -= 1
  return s
}

// Prédicats sur un champ : ceux qui sélectionnent exactement S (exacts) et
// ceux qui gardent tout S (cohérents, pour les conjonctions).
function prédicatsChamp(éléments, champ, dansS, indices, champsProjetés) {
  const n = éléments.length
  const multi = !champ.tag && contientIteration(champ.chemin)
  const vals = éléments.map(e => valeurDe(e, champ))
  const exacts = [], cohérents = []
  const distincts = new Set(vals.map(v => cléValeur(v))).size
  const info = { distincts, n }
  const pénalitéProj = champsProjetés?.some(p => JSON.stringify(p) === JSON.stringify(champ)) ? 0.5 : 0
  const ajouter = (cond, exact) => {
    const sc = scorePrédicat(cond, champ, info, indices) + pénalitéProj
    ;(exact ? exacts : cohérents).push({ cond, score: sc })
  }
  const S = [], H = []
  for (let i = 0; i < n; i++) (dansS[i] ? S : H).push(i)
  if (!S.length) return { exacts, cohérents }

  if (multi) {
    // Au moins une valeur de la liste égale x.
    const candidats = new Map()
    for (const x of vals[S[0]] || []) if (typeJson(x) !== 'object' && typeJson(x) !== 'array') candidats.set(cléValeur(x), x)
    for (const x of candidats.values()) {
      const contient = i => (vals[i] || []).some(y => égal(y, x))
      if (S.every(contient)) {
        const cond = { type: 'cmp', champ, op: '==', valeur: x }
        if (!H.some(contient)) ajouter(cond, true)
        else ajouter(cond, false)
      }
    }
    return { exacts, cohérents }
  }

  const scal = v => v === null || ['string', 'number', 'boolean'].includes(typeJson(v))
  if (!vals.every(scal)) return { exacts, cohérents }
  const cléS = new Set(S.map(i => cléValeur(vals[i])))
  const cléH = new Set(H.map(i => cléValeur(vals[i])))

  // Égalité
  if (cléS.size === 1) {
    const x = vals[S[0]]
    const cond = x === null ? { type: 'absent', champ } : { type: 'cmp', champ, op: '==', valeur: x }
    ajouter(cond, !cléH.has(cléValeur(x)))
  }
  // Différence
  for (const k of cléH) {
    if (cléS.has(k)) continue
    const y = JSON.parse(k)
    const cond = y === null ? { type: 'existe', champ } : { type: 'cmp', champ, op: '!=', valeur: y }
    ajouter(cond, cléH.size === 1)
  }
  // Appartenance
  if (cléS.size >= 2 && cléS.size <= 4 && ![...cléS].some(k => cléH.has(k)) && ![...cléS].includes('null')) {
    const valeurs = [...cléS].map(k => JSON.parse(k))
    ajouter({ type: 'dans', champ, valeurs }, true)
  }
  // Seuils numériques
  const nS = S.map(i => vals[i]), nH = H.map(i => vals[i])
  if (nS.every(v => typeof v === 'number')) {
    const minS = Math.min(...nS), maxS = Math.max(...nS)
    const nombresH = nH.filter(v => typeof v === 'number')
    const autresH = nH.filter(v => typeof v !== 'number' && v !== null)
    if (!autresH.length && nombresH.length) {
      const maxH = Math.max(...nombresH), minH = Math.min(...nombresH)
      const choisir = (opStrict, tStrict, opLarge, tLarge) => (rondeur(tLarge) > rondeur(tStrict) ? { op: opLarge, t: tLarge } : { op: opStrict, t: tStrict })
      const plusGrandsExcl = nombresH.filter(v => v < minS)
      if (plusGrandsExcl.length) {
        const t = Math.max(...plusGrandsExcl)
        const { op, t: seuil } = choisir('>', t, '>=', minS)
        ajouter({ type: 'cmp', champ, op, valeur: seuil }, maxH < minS)
      }
      const plusPetitsExcl = nombresH.filter(v => v > maxS)
      if (plusPetitsExcl.length) {
        const t = Math.min(...plusPetitsExcl)
        const { op, t: seuil } = choisir('<', t, '<=', maxS)
        ajouter({ type: 'cmp', champ, op, valeur: seuil }, minH > maxS)
      }
    }
  }
  // Chaînes : préfixe, suffixe, mot contenu
  if (nS.every(v => typeof v === 'string')) {
    const prefixe = nS.reduce((p, v) => { let i = 0; while (i < p.length && p[i] === v[i]) i++; return p.slice(0, i) })
    const suffixe = nS.reduce((p, v) => { let i = 0; while (i < p.length && p[p.length - 1 - i] === v[v.length - 1 - i]) i++; return p.slice(p.length - i) })
    if (prefixe.length >= 2 && cléS.size > 1) ajouter({ type: 'commence', champ, valeur: prefixe }, !nH.some(v => typeof v === 'string' && v.startsWith(prefixe)))
    if (suffixe.length >= 2 && cléS.size > 1 && suffixe !== prefixe) ajouter({ type: 'finit', champ, valeur: suffixe }, !nH.some(v => typeof v === 'string' && v.endsWith(suffixe)))
    const mots = nS.map(v => new Set(v.split(/[^A-Za-z0-9À-ÿ]+/).filter(m => m.length >= 2)))
    const communs = [...mots[0]].filter(m => mots.every(s => s.has(m)))
    for (const m of communs.slice(0, 3)) if (m !== prefixe && cléS.size > 1) ajouter({ type: 'contient', champ, valeur: m }, !nH.some(v => typeof v === 'string' && v.includes(m)))
  }
  return { exacts, cohérents }
}

function sélectionne(éléments, cond, dansS) {
  for (let i = 0; i < éléments.length; i++) if (tester(éléments[i], cond) !== !!dansS[i]) return false
  return true
}

// Filtres qui sélectionnent exactement S. Renvoie des conditions classées.
export function chercherFiltres(éléments, champs, dansS, { indices, champsProjetés, max = 6 } = {}) {
  const exacts = [], cohérents = []
  for (const champ of champs) {
    const r = prédicatsChamp(éléments, champ, dansS, indices, champsProjetés)
    exacts.push(...r.exacts)
    cohérents.push(...r.cohérents, ...r.exacts.filter(x => x.cond.type !== 'dans'))
  }
  exacts.sort((a, b) => a.score - b.score)
  const sortie = exacts.slice(0, max).map(x => ({ cond: x.cond, score: x.score }))
  // Une bonne condition unique suffit ; sinon, on cherche aussi une conjonction.
  if (sortie.length && sortie[0].score <= 2.2) return sortie
  const conj = conjonction(éléments, dansS, cohérents)
  return [...sortie, ...conj].sort((a, b) => a.score - b.score).slice(0, max)
}

function conjonction(éléments, dansS, cohérents) {
  // Conjonction gloutonne (au plus 3 conditions).
  const H = []
  for (let i = 0; i < éléments.length; i++) if (!dansS[i]) H.push(i)
  let reste = new Set(H)
  const choisis = []
  const exclus = cohérents.map(x => ({ ...x, exclut: new Set(H.filter(i => !tester(éléments[i], x.cond))) }))
  while (reste.size && choisis.length < 3) {
    let meilleur = null, gain = 0
    for (const x of exclus) {
      let g = 0
      for (const i of x.exclut) if (reste.has(i)) g++
      if (g > gain || (g === gain && g > 0 && meilleur && x.score < meilleur.score)) { meilleur = x; gain = g }
    }
    if (!meilleur || !gain) break
    choisis.push(meilleur)
    reste = new Set([...reste].filter(i => !meilleur.exclut.has(i)))
  }
  if (!reste.size && choisis.length) {
    const cond = { type: 'et', conds: choisis.map(x => x.cond) }
    if (sélectionne(éléments, cond, dansS)) return [{ cond, score: choisis.reduce((s, x) => s + x.score, 0) + 0.5 }]
  }
  return []
}

// Conditions vraies pour tout S dont les premiers éléments retenus sont S.
function filtresPréfixe(éléments, champs, S, { indices, champsProjetés }) {
  const dansS = masque(éléments.length, S)
  const sortie = []
  for (const champ of champs) {
    const r = prédicatsChamp(éléments, champ, dansS, indices, champsProjetés)
    for (const x of [...r.exacts, ...r.cohérents]) {
      const retenus = []
      for (let i = 0; i < éléments.length && retenus.length < S.length; i++) if (tester(éléments[i], x.cond)) retenus.push(i)
      if (retenus.length === S.length && retenus.every((v, i) => v === S[i])) sortie.push(x)
    }
  }
  return sortie.sort((a, b) => a.score - b.score).slice(0, 3)
}

// ---- Correspondance d'une liste projetée avec l'attendu --------------------

// Indices de E dans P en respectant l'ordre (sous-suite), ou null.
function sousSuite(P, E, égalité = égal) {
  const S = []
  let j = 0
  for (let i = 0; i < P.length && j < E.length; i++) if (égalité(P[i], E[j])) { S.push(i); j++ }
  return j === E.length ? S : null
}

// Appariement sans ordre (multiensemble).
function appariement(P, E, égalité = égal) {
  const pris = new Set()
  for (const x of E) {
    const i = P.findIndex((y, k) => !pris.has(k) && égalité(y, x))
    if (i < 0) return null
    pris.add(i)
  }
  return [...pris].sort((a, b) => a - b)
}

const masque = (n, S) => { const m = new Array(n).fill(false); for (const i of S) m[i] = true; return m }

function ordreTri(éléments, champ, desc) {
  const clés = éléments.map(e => valeurDe(e, champ))
  const ordre = clés.map((k, i) => i).sort((a, b) => comparerJq(clés[a], clés[b]) || a - b)
  if (desc) ordre.reverse()
  return ordre
}

// Variantes de plan (filtre, tri, tranche, unique, ignorerNull) qui
// transforment la liste P (projection de chaque élément) en E.
function variantesListe({ éléments, P, E, mode, champs, indices, champsProjetés, scalaire }) {
  const sortie = []
  const n = éléments.length
  if (mode === 'partiel') {
    if (correspond(P, E, 'partiel')) sortie.push({})
    return sortie
  }
  const eq = mode === 'sansOrdre' ? (a, b) => correspond(a, b, 'sansOrdre') : égal
  if (P.length === E.length && (mode === 'sansOrdre' ? correspond(P, E, 'sansOrdre') : égal(P, E))) { sortie.push({}); return sortie }
  if (scalaire) {
    const sansNull = P.filter(v => v !== null)
    if (sansNull.length !== P.length && correspond(sansNull, E, mode === 'sansOrdre' ? 'sansOrdre' : 'exact')) sortie.push({ ignorerNull: true })
    const distincts = []
    for (const v of [...P].sort(comparerJq)) if (!distincts.some(x => égal(x, v))) distincts.push(v)
    if (distincts.length !== P.length && égal(distincts, E)) sortie.push({ unique: true })
    const dn = distincts.filter(v => v !== null)
    if (dn.length !== distincts.length && égal(dn, E)) sortie.push({ unique: true, ignorerNull: true })
  }
  // Sous-suite dans l'ordre d'origine : filtre et/ou tranche.
  const S = mode === 'sansOrdre' ? appariement(P, E, eq) : sousSuite(P, E, eq)
  if (S) {
    const dansS = masque(n, S)
    for (const f of chercherFiltres(éléments, champs, dansS, { indices, champsProjetés, max: 4 })) sortie.push({ filtre: f.cond, scoreFiltre: f.score })
    if (S.every((x, i) => x === i)) sortie.push({ tranche: { début: 0, fin: S.length } })
    else if (mode !== 'sansOrdre' && !sortie.some(v => v.filtre)) {
      // Filtre, puis les m premiers éléments retenus.
      for (const f of filtresPréfixe(éléments, champs, S, { indices, champsProjetés })) sortie.push({ filtre: f.cond, tranche: { début: 0, fin: S.length }, scoreFiltre: f.score + 0.3 })
    }
  }
  // Tri (éventuellement filtre et/ou tranche).
  if (mode === 'exact' && !sortie.length) {
    for (const champ of champs) {
      if (!champ.tag && contientIteration(champ.chemin)) continue
      const types = new Set(éléments.slice(0, 500).map(e => typeJson(valeurDe(e, champ))))
      if (types.has('object') || types.has('array')) continue
      for (const desc of [false, true]) {
        const ordre = ordreTri(éléments, champ, desc)
        const Ptrié = ordre.map(i => P[i])
        const S2 = sousSuite(Ptrié, E, eq)
        if (!S2) continue
        const tri = { champ, desc }
        if (S2.length === n) { sortie.push({ tri, scoreFiltre: 0 }); continue }
        if (S2.every((x, i) => x === i)) sortie.push({ tri, tranche: { début: 0, fin: S2.length }, scoreFiltre: 0.4 })
        const dansS = masque(n, S2.map(k => ordre[k]))
        for (const f of chercherFiltres(éléments, champs, dansS, { indices, champsProjetés, max: 2 })) sortie.push({ tri, filtre: f.cond, scoreFiltre: f.score })
      }
      if (sortie.length >= 8) break
    }
  }
  return sortie
}

// ---- Projection : clés attendues → champs ---------------------------------

// Feuilles d'une ligne attendue : chemin de clés → valeur.
function feuilles(ligne, chemin = [], sortie = []) {
  for (const [k, v] of Object.entries(ligne)) {
    if (typeJson(v) === 'object' && Object.keys(v).length) {
      sortie.push({ chemin: [...chemin, k], valeur: v, objet: true })
      feuilles(v, [...chemin, k], sortie)
    } else sortie.push({ chemin: [...chemin, k], valeur: v })
  }
  return sortie
}

function construireProjection(affectations) {
  // affectations : [{ chemin (clés de sortie), champ }]
  const racine = { type: 'objet', champs: [] }
  for (const a of affectations) {
    let nœud = racine
    a.chemin.forEach((k, i) => {
      const dernier = i === a.chemin.length - 1
      let c = nœud.champs.find(x => x.nom === k)
      if (dernier) {
        const valeur = a.champ.tag ? { type: 'tag', tag: a.champ.tag } : { type: 'champ', chemin: a.champ.chemin }
        if (!c) nœud.champs.push({ nom: k, valeur })
        else c.valeur = valeur
      } else {
        if (!c) { c = { nom: k, valeur: { type: 'objet', champs: [] } }; nœud.champs.push(c) }
        nœud = c.valeur
      }
    })
  }
  return racine
}

const estPréfixe = (c, p) => p.length > c.length && c.every((k, i) => p[i] === k)

function projectionsCandidates(collection, éléments, lignes, indices) {
  const champs = collection.champs
  const index = new Map(champs.map(c => [c, indexValeurs(éléments, c)]))
  // Union des feuilles attendues (ordre de la première ligne).
  const toutes = []
  const vues = new Set()
  for (const l of lignes) for (const f of feuilles(l)) { const k = JSON.stringify(f.chemin); if (!vues.has(k)) { vues.add(k); toutes.push(f) } }
  // Champs dont les valeurs contiennent toutes les valeurs attendues de la feuille.
  const candidatsDe = f => {
    const valeurs = lignes.map(l => lire(l, f.chemin)).filter(v => v !== undefined)
    const liste = []
    for (const c of champs) {
      if (!valeurs.every(v => index.get(c).ensemble.has(cléValeur(v)))) continue
      const bonus = indices?.champs?.some(t => ressemblance(t, c) >= 0.8) ? 0.3 : 0
      liste.push({ champ: c, score: ressemblance(dernierNom(f.chemin), c) - (c.tag ? 0.05 : c.chemin.length * 0.02) + bonus })
    }
    return liste.sort((x, y) => y.score - x.score)
  }
  const retenues = []
  const couverts = []
  for (const f of [...toutes].sort((x, y) => x.chemin.length - y.chemin.length)) {
    if (couverts.some(c => estPréfixe(c, f.chemin))) continue
    const liste = candidatsDe(f)
    if (f.objet) { if (liste.length) { retenues.push({ feuille: f, candidats: liste }); couverts.push(f.chemin) } continue }
    if (!liste.length) return { échec: { clé: f.chemin.join('.'), valeur: lire(lignes.find(l => lire(l, f.chemin) !== undefined), f.chemin) } }
    retenues.push({ feuille: f, candidats: liste })
  }
  retenues.sort((x, y) => toutes.indexOf(x.feuille) - toutes.indexOf(y.feuille))
  // Combinaisons : le meilleur candidat partout, puis variantes une feuille à la fois.
  const combinaisons = [retenues.map(x => x.candidats[0])]
  for (let i = 0; i < retenues.length && combinaisons.length < 24; i++) {
    for (const alt of retenues[i].candidats.slice(1, 4)) {
      const c = retenues.map(x => x.candidats[0])
      c[i] = alt
      combinaisons.push(c)
    }
  }
  return { projections: combinaisons.map(comb => construireProjection(comb.map((c, i) => ({ chemin: retenues[i].feuille.chemin, champ: c.champ })))) }
}

// ---- Synthèse --------------------------------------------------------------

function cibleDe(attendu) {
  return attendu && attendu.__flux ? { valeur: attendu.valeurs, flux: true } : { valeur: attendu, flux: false }
}

// Champs utilisés par une projection (y compris imbriquée).
function champsDeProjection(p, sortie = []) {
  if (!p) return sortie
  if (p.type === 'champ') sortie.push({ chemin: p.chemin })
  else if (p.type === 'tag') sortie.push({ tag: p.tag })
  else if (p.type === 'objet') p.champs.forEach(c => champsDeProjection(c.valeur, sortie))
  else if (p.type === 'liste') p.éléments.forEach(x => champsDeProjection(x, sortie))
  return sortie
}

const champsSimples = collection => collection.champs.filter(c => c.feuille && (c.tag || !contientIteration(c.chemin)))
const champsFiltres = collection => collection.champs.filter(c => (c.feuille || c.tag) && c.distincts > 0).slice(0, 250)

function ajouterCandidat(liste, plan, racine, cible, mode, hypothèses, bonus = 0) {
  let r
  try { r = évaluer(plan, racine) } catch { return }
  if (!correspond(r, cible, mode)) return
  const clé = JSON.stringify(plan)
  if (liste.some(c => c.clé === clé)) return
  liste.push({ plan, clé, score: complexité(plan) - bonus, hypothèses })
}

const valeursFeuilles = (v, sortie = []) => {
  const t = typeJson(v)
  if (t === 'array') v.forEach(x => valeursFeuilles(x, sortie))
  else if (t === 'object') Object.values(v).forEach(x => valeursFeuilles(x, sortie))
  else sortie.push(v)
  return sortie
}

// Valeurs de l'attendu introuvables dans l'entrée (explication d'un échec).
function valeursInconnues(racine, cible) {
  const connues = new Set(valeursFeuilles(racine).map(cléValeur))
  for (const k of Object.keys(indexClésTout(racine))) connues.add(JSON.stringify(k))
  return [...new Set(valeursFeuilles(cible).filter(v => v !== null && !connues.has(cléValeur(v))).map(v => aperçu(v)))].slice(0, 5)
}
function indexClésTout(v, sortie = {}) {
  const t = typeJson(v)
  if (t === 'array') v.forEach(x => indexClésTout(x, sortie))
  else if (t === 'object') for (const [k, x] of Object.entries(v)) { sortie[k] = true; indexClésTout(x, sortie) }
  return sortie
}

// Chemins concrets (avec positions) où la valeur cible apparaît.
function cheminsDeValeur(racine, cible, max = 20) {
  const sortie = []
  const aller = (v, chemin) => {
    if (sortie.length >= max) return
    if (égal(v, cible)) { sortie.push(chemin); return }
    const t = typeJson(v)
    if (t === 'array') v.forEach((x, i) => aller(x, [...chemin, i]))
    else if (t === 'object') for (const [k, x] of Object.entries(v)) aller(x, [...chemin, k])
  }
  aller(racine, [])
  return sortie
}

export function synthétiser(racine, analyse, attendu, { mode = 'exact', indices = null } = {}) {
  const { valeur: cible, flux } = cibleDe(attendu)
  const candidats = []
  const raisons = []
  const t = typeJson(cible)
  const collections = analyse.collections.filter(c => c.nombre > 0).slice(0, 40)

  // Valeur trouvée telle quelle dans le JSON.
  if (!flux) {
    const chemins = cheminsDeValeur(racine, cible)
    for (const ch of chemins) {
      if (!ch.length) continue
      const positions = ch.filter(s => typeof s === 'number').length
      // Petit nombre trouvé tel quel : souvent une coïncidence (un comptage est plus probable).
      const coïncidence = typeof cible === 'number' && Number.isInteger(cible) && Math.abs(cible) <= 100 ? 0.8 : 0
      ajouterCandidat(candidats, { type: 'valeur', chemin: ch }, racine, cible, mode, positions ? [`Valeur prise à une position fixe (${texteChemin(ch)}) : elle change si l'ordre des éléments change.`] : [], -positions * 1.5 - coïncidence)
    }
  }

  if (t === 'array' && cible.length === 0) {
    raisons.push('Le résultat attendu est un tableau vide : beaucoup de filtres donnent un tableau vide, il est impossible de deviner lequel. Ajoutez une description (mode Description) ou un exemple non vide.')
    return { candidats: [], raisons, ambigu: true }
  }

  if (t === 'array') {
    const scalaires = cible.every(v => ['string', 'number', 'boolean', 'null'].includes(typeJson(v)))
    const objets = cible.every(v => typeJson(v) === 'object')
    const tuples = cible.every(v => typeJson(v) === 'array')
    for (const col of collections) {
      const éléments = col.éléments.slice(0, MAX_ÉLÉMENTS)
      const champs = champsFiltres(col)
      const base = { type: 'collection', source: col.chemin }
      if (flux) base.flux = true
      const essayer = (projection, P, champsProjetés, scalaire) => {
        for (const v of variantesListe({ éléments, P, E: cible, mode, champs, indices, champsProjetés, scalaire })) {
          const plan = { ...base, ...(projection ? { projection } : {}), ...v }
          delete plan.scoreFiltre
          const hyp = []
          if (v.filtre && v.scoreFiltre > 2.5) hyp.push('Filtre sur une valeur très spécifique (identifiant) : il ne sélectionnera que ces éléments-là.')
          if (v.tranche && !v.tri) hyp.push(`Les ${v.tranche.fin} premier(s) élément(s) dans l'ordre du JSON.`)
          // Coût : qualité du filtre, et une limite « N premiers » rarement voulue sans le dire.
          const pénalité = 0.6 * (v.scoreFiltre ?? 0) + (v.tranche && !v.tri ? (indices?.limite ? 0 : 1.2) : 0)
          ajouterCandidat(candidats, plan, racine, cible, mode, hyp, -pénalité)
        }
      }
      if (scalaires) {
        if (col.typeÉléments === 'scalaire') essayer(null, éléments, [], true)
        for (const champ of champsSimples(col)) {
          if (!champ.chemin.length && !champ.tag) continue
          const P = éléments.map(e => valeurDe(e, champ))
          const proj = champ.tag ? { type: 'tag', tag: champ.tag } : { type: 'champ', chemin: champ.chemin }
          if (!cible.some(x => P.some(y => égal(x, y)))) continue
          essayer(proj, P, [champ], true)
        }
      } else if (objets && col.typeÉléments === 'objet') {
        // Éléments complets ?
        if (cible.every(l => éléments.some(e => égal(e, l)))) essayer(null, éléments, [], false)
        // Regroupement en liste [{clé, nombre}].
        candidatsGroupesListe(candidats, racine, col, éléments, cible, mode, base)
        const r = projectionsCandidates(col, éléments, cible, indices)
        if (r.échec) { if (col.chemin.filter(x => x === null).length === 1) raisons.push(`${col.id} : aucune donnée ne correspond à la clé « ${r.échec.clé} » (valeur ${aperçu(r.échec.valeur)}).`); continue }
        for (const projection of r.projections) {
          const P = éléments.map(e => projeter(e, projection))
          essayer(projection, P, champsDeProjection(projection), false)
          if (candidats.length > 12) break
        }
      } else if (tuples && col.typeÉléments === 'objet') {
        const lignes = cible.map(l => Object.fromEntries(l.map((v, i) => [`_${i}`, v])))
        const r = projectionsCandidates(col, éléments, lignes, indices)
        if (r.échec) continue
        for (const p of r.projections.slice(0, 6)) {
          const projection = { type: 'liste', éléments: p.champs.map(c => c.valeur) }
          essayer(projection, éléments.map(e => projeter(e, projection)), [], false)
        }
      }
      if (candidats.length > 20) break
    }
    // Clés d'un objet.
    if (cible.every(v => typeof v === 'string')) {
      for (const ch of [[], ...analyse.objetsRacine]) {
        const o = lire(racine, ch)
        if (typeJson(o) === 'object' && égal(Object.keys(o), cible)) ajouterCandidat(candidats, { type: 'clés', chemin: ch }, racine, cible, mode, [])
      }
    }
  }

  if (t === 'object' && !flux) {
    for (const col of collections) {
      const éléments = col.éléments.slice(0, MAX_ÉLÉMENTS)
      candidatsGroupesObjet(candidats, racine, col, éléments, cible, mode)
      // Un élément précis (éventuellement projeté).
      if (col.typeÉléments === 'objet') {
        const r = projectionsCandidates(col, éléments, [cible], indices)
        const projections = r.projections || []
        if (éléments.some(e => égal(e, cible))) projections.unshift(null)
        for (const projection of projections.slice(0, 6)) {
          const P = éléments.map(e => (projection ? projeter(e, projection) : e))
          const S = P.map((p, i) => (égal(p, cible) ? i : -1)).filter(i => i >= 0)
          if (!S.length) continue
          const base = { type: 'collection', source: col.chemin, premier: true, ...(projection ? { projection } : {}) }
          if (S[0] === 0) ajouterCandidat(candidats, base, racine, cible, mode, ['Premier élément de la liste.'], -0.5)
          const filtres = chercherFiltres(éléments, champsFiltres(col), masque(éléments.length, [S[0]]), { indices, max: 3 })
          for (const f of filtres) ajouterCandidat(candidats, { ...base, filtre: f.cond }, racine, cible, mode, [])
        }
      }
    }
    // Objet construit depuis la racine : chaque valeur trouvée à un chemin sans position.
    const entrées = Object.entries(cible)
    if (entrées.length) {
      const champs = []
      for (const [k, v] of entrées) {
        const chemins = cheminsDeValeur(racine, v, 10).filter(c => c.every(s => typeof s === 'string'))
        if (!chemins.length) { champs.length = 0; break }
        chemins.sort((a, b) => ressemblance(k, { chemin: b }) - ressemblance(k, { chemin: a }) || a.length - b.length)
        champs.push({ nom: k, chemin: chemins[0] })
      }
      if (champs.length === entrées.length) ajouterCandidat(candidats, { type: 'objet', champs }, racine, cible, mode, [])
    }
  }

  if (['number', 'string', 'boolean'].includes(t) && !flux) candidatsScalaires(candidats, racine, collections, cible, mode, indices)

  candidats.sort((a, b) => a.score - b.score)
  if (!candidats.length) {
    const inconnues = valeursInconnues(racine, cible)
    if (inconnues.length) raisons.push(`Valeur(s) de l'attendu absente(s) du JSON d'entrée : ${inconnues.join(', ')}. Une requête ne peut que sélectionner, transformer ou calculer à partir des données : s'il s'agit d'un calcul (comptage, somme…), décrivez-le en mode Description ; sinon, vérifiez l'attendu (faute de frappe ?).`)
    else raisons.push('Aucune combinaison simple (collection, filtre, projection, tri, limite, agrégat, regroupement) ne reproduit exactement cet attendu.')
  }
  const ambigu = candidats.length > 1 && candidats[1].score - candidats[0].score < 0.25 && !égal(candidats[0].plan, candidats[1].plan)
  return { candidats: candidats.slice(0, 8), raisons, ambigu }
}

function candidatsScalaires(candidats, racine, collections, cible, mode, indices) {
  for (const col of collections) {
    const source = col.chemin
    // Sous-collection (Volumes[].Attachments[]) : un comptage y est moins probable.
    const imbriquée = collections.some(c => c !== col && c.chemin.length < col.chemin.length && c.chemin.every((x, i) => x === col.chemin[i])) ? 1 : 0
    if (typeof cible === 'number') {
      ajouterCandidat(candidats, { type: 'collection', source, agrégat: { op: 'nombre' } }, racine, cible, mode, [], -imbriquée)
      // Comptage filtré : valeurs dont l'effectif vaut la cible.
      for (const champ of champsFiltres(col)) {
        if (!champ.tag && contientIteration(champ.chemin)) continue
        for (const { valeur, n } of champ.valeurs.values()) {
          if (n !== cible) continue
          const cond = { type: 'cmp', champ: champ.tag ? { tag: champ.tag } : { chemin: champ.chemin }, op: '==', valeur }
          const segments = champ.tag ? [champ.tag.clé] : champ.chemin.filter(x => typeof x === 'string')
          const bonus = (indices?.valeurs?.some(v => compact(v) === compact(String(valeur))) ? 1.5 : 0) + (segments.some(x => MOTS_ÉTAT.test(compact(x))) ? 0.3 : 0) + (typeof valeur === 'string' ? 0.15 : 0) - (champ.distincts >= col.nombre * 0.9 ? 2 : 0) - imbriquée
          ajouterCandidat(candidats, { type: 'collection', source, filtre: cond, agrégat: { op: 'nombre' } }, racine, cible, mode, [], bonus)
        }
        if (champ.types.number && !champ.multi) {
          const c = champ.tag ? { tag: champ.tag } : { chemin: champ.chemin }
          for (const op of ['somme', 'max', 'min', 'moyenne']) ajouterCandidat(candidats, { type: 'collection', source, agrégat: { op, champ: c } }, racine, cible, mode, [], indices?.opération === op ? 1 : 0)
        }
      }
    }
    if (typeof cible === 'string' && /[,;|\n ]/.test(cible)) {
      for (const champ of champsSimples(col)) {
        if (!champ.types.string) continue
        for (const séparateur of [', ', ',', ' ', '\n', ';', ' | ', '; ']) {
          if (!cible.includes(séparateur.trim() || séparateur)) continue
          ajouterCandidat(candidats, { type: 'collection', source, agrégat: { op: 'joindre', champ: champ.tag ? { tag: champ.tag } : { chemin: champ.chemin }, séparateur } }, racine, cible, mode, [])
        }
      }
    }
  }
}

// Regroupement { valeur: mesure } : clés = valeurs distinctes d'un champ.
function candidatsGroupesObjet(candidats, racine, col, éléments, cible, mode) {
  const clés = Object.keys(cible)
  if (!clés.length) return
  const valeurs = Object.values(cible)
  for (const champ of champsFiltres(col)) {
    if (!champ.tag && contientIteration(champ.chemin)) continue
    const distincts = new Set(éléments.map(e => texteClé(valeurDe(e, champ))))
    if (distincts.size !== clés.length || !clés.every(k => distincts.has(k))) continue
    const c = champ.tag ? { tag: champ.tag } : { chemin: champ.chemin }
    const base = { type: 'collection', source: col.chemin }
    if (valeurs.every(v => typeof v === 'number')) {
      ajouterCandidat(candidats, { ...base, groupe: { champ: c, mesure: { op: 'nombre' }, forme: 'objet' } }, racine, cible, mode, [])
      for (const m of champsSimples(col).filter(x => x.types.number && !x.multi)) {
        const cm = m.tag ? { tag: m.tag } : { chemin: m.chemin }
        for (const op of ['somme', 'max', 'min', 'moyenne']) ajouterCandidat(candidats, { ...base, groupe: { champ: c, mesure: { op, champ: cm }, forme: 'objet' } }, racine, cible, mode, [])
      }
    } else if (valeurs.every(v => Array.isArray(v))) {
      for (const m of champsSimples(col)) {
        const projection = m.tag ? { type: 'tag', tag: m.tag } : { type: 'champ', chemin: m.chemin }
        ajouterCandidat(candidats, { ...base, groupe: { champ: c, mesure: { op: 'liste', projection }, forme: 'objet' } }, racine, cible, mode, [])
      }
    }
  }
}

// Regroupement en liste : [{ état: "x", nombre: 3 }, …]
function candidatsGroupesListe(candidats, racine, col, éléments, cible, mode, base) {
  if (!cible.length || !cible.every(l => Object.keys(l).length === 2)) return
  const [k1, k2] = Object.keys(cible[0])
  if (!cible.every(l => k1 in l && k2 in l)) return
  for (const [kc, km] of [[k1, k2], [k2, k1]]) {
    const valsClé = cible.map(l => l[kc])
    if (!cible.every(l => typeof l[km] === 'number')) continue
    for (const champ of champsFiltres(col)) {
      if (!champ.tag && contientIteration(champ.chemin)) continue
      const distincts = new Set(éléments.map(e => cléValeur(valeurDe(e, champ))))
      if (distincts.size !== valsClé.length || !valsClé.every(v => distincts.has(cléValeur(v)))) continue
      const c = champ.tag ? { tag: champ.tag } : { chemin: champ.chemin }
      ajouterCandidat(candidats, { ...base, groupe: { champ: c, mesure: { op: 'nombre' }, forme: 'liste', nomClé: kc, nomMesure: km } }, racine, cible, mode, [])
      for (const m of champsSimples(col).filter(x => x.types.number && !x.multi)) {
        const cm = m.tag ? { tag: m.tag } : { chemin: m.chemin }
        ajouterCandidat(candidats, { ...base, groupe: { champ: c, mesure: { op: 'somme', champ: cm }, forme: 'liste', nomClé: kc, nomMesure: km } }, racine, cible, mode, [])
      }
    }
  }
}

