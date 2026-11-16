// Moteur du Query Generator : analyse, génération, exécution réelle (jq 1.8 en
// WebAssembly, jmespath.js), vérification et corrections. Tout est local.
//
// Statuts d'une requête :
//   vérifiée    exécutée, résultat identique au résultat attendu fourni
//   conforme    exécutée, résultat identique à l'interprétation (pas d'attendu fourni)
//   différente  exécutée, mais le résultat diffère
//   erreur      l'exécution a échoué (syntaxe ou exécution)
//   impossible  non exprimable dans ce langage (raison donnée)
// Une requête n'est jamais « vérifiée » sans exécution réussie.
import { analyserStructure, résuméStructure } from './analyse.js'
import { aperçu, égal } from './chemins.js'
import { comparer, valeurDesSorties } from './comparer.js'
import { exécuterJmes, exécuterJq } from './executer.js'
import { expliquerJmes, expliquerJq } from './expliquer.js'
import { générerJmes } from './genJmes.js'
import { générerJq, jqPremièreClé, jqRechercheClé } from './genJq.js'
import { analyserJson, formaterJson, lireAttendu } from './json.js'
import { interpréter } from './langue.js'
import { décrirePlan, évaluer } from './plan.js'
import { synthétiser } from './synthese.js'

const LIMITE_AFFICHAGE = 400000

// Texte affiché d'un résultat (nombres exacts de jq conservés).
function texteRésultat(langage, r) {
  if (!r.ok) return ''
  if (langage === 'jq') {
    const morceaux = r.textes.map(t => formaterJson(t) ?? t)
    return morceaux.join('\n')
  }
  return JSON.stringify(r.valeur, null, 2) ?? 'null'
}

function tronquer(t) {
  return t.length > LIMITE_AFFICHAGE ? { texte: `${t.slice(0, LIMITE_AFFICHAGE)}\n… (résultat tronqué à l'affichage)`, tronqué: true } : { texte: t, tronqué: false }
}

export { lireAttendu }

export function créerMoteur(jq) {
  let cache = { texte: null }

  function préparer(texteEntrée) {
    if (cache.texte === texteEntrée && cache.valeur !== undefined) return cache
    const a = analyserJson(texteEntrée)
    if (!a.ok) return { erreur: a.erreur, multiple: a.multiple }
    cache = { texte: texteEntrée, valeur: a.valeur, analyse: analyserStructure(a.valeur) }
    return cache
  }

  function exécuter(langage, requête, prép, flux) {
    if (langage === 'jq') {
      const r = exécuterJq(jq, prép.texte, requête)
      if (!r.ok) return { ok: false, erreur: r.erreur, durée: r.durée }
      const { texte, tronqué } = tronquer(texteRésultat('jq', r))
      return { ok: true, valeur: valeurDesSorties(r.sorties, flux), nbSorties: r.sorties.length, texte, tronqué, durée: r.durée, avertissement: r.avertissement }
    }
    const r = exécuterJmes(prép.valeur, requête)
    if (!r.ok) return { ok: false, erreur: r.erreur, durée: r.durée }
    const { texte, tronqué } = tronquer(texteRésultat('jmespath', r))
    return { ok: true, valeur: r.valeur, texte, tronqué, durée: r.durée }
  }

  // Exécute et compare à la référence (attendu de l'utilisateur ou interprétation).
  function exécuterEtVérifier(langage, requête, prép, { référence, typeRéférence, comparaison = 'exact', flux = false }) {
    const r = exécuter(langage, requête, prép, flux)
    if (!r.ok) return { langage, requête, statut: 'erreur', erreur: r.erreur, durée: r.durée }
    const sortie = { langage, requête, statut: 'exécutée', texte: r.texte, tronqué: r.tronqué, valeur: r.valeur, durée: r.durée, avertissement: r.avertissement, nbSorties: r.nbSorties }
    if (référence !== undefined) {
      const c = comparer(r.valeur, référence, typeRéférence === 'attendu' ? comparaison : 'exact')
      sortie.comparaison = c
      sortie.statut = c.égal ? (typeRéférence === 'attendu' ? 'vérifiée' : 'conforme') : 'différente'
    }
    return sortie
  }

  function analyser(texteEntrée) {
    const p = préparer(texteEntrée)
    if (p.erreur) return { ok: false, erreur: p.erreur, multiple: p.multiple }
    return { ok: true, structure: résuméStructure(p.analyse) }
  }

  // Candidat : plan → requêtes jq et JMESPath générées séparément, exécutées.
  function candidat(plan, prép, { attendu, comparaison, hypothèses = [], recherche = null }) {
    const résultatPlan = évaluer(plan, prép.valeur)
    const flux = !!plan.flux || !!(attendu && attendu.__flux)
    const refJq = attendu !== undefined ? attendu : plan.flux ? { __flux: true, valeurs: résultatPlan } : résultatPlan
    const refJmes = attendu !== undefined ? attendu : résultatPlan
    const typeRéférence = attendu !== undefined ? 'attendu' : 'plan'
    const gj = générerJq(plan, prép.valeur)
    const gm = générerJmes(plan, prép.valeur)
    const exJq = gj.impossible ? { langage: 'jq', statut: 'impossible', raison: gj.impossible } : { ...exécuterEtVérifier('jq', gj.requête, prép, { référence: refJq, typeRéférence, comparaison, flux }), notes: gj.notes }
    const exJm = gm.impossible ? { langage: 'jmespath', statut: 'impossible', raison: gm.impossible, notes: gm.notes } : { ...exécuterEtVérifier('jmespath', gm.requête, prép, { référence: refJmes, typeRéférence, comparaison }), notes: gm.notes, dépendDesDonnées: gm.dépendDesDonnées }
    // Variante récursive jq pour une clé cherchée par son nom.
    const alternatives = []
    if (recherche && (plan.type === 'valeur' || plan.type === 'valeurs')) {
      const q = plan.type === 'valeurs' ? jqRechercheClé(recherche) : jqPremièreClé(recherche)
      const ex = exécuterEtVérifier('jq', q, prép, { référence: refJq, typeRéférence, comparaison })
      if (ex.statut === 'vérifiée' || ex.statut === 'conforme') alternatives.push({ ...ex, note: 'Recherche récursive (..) : trouve la clé même si la structure change. JMESPath n\'a pas d\'équivalent de .. : il faut le chemin exact.' })
    }
    // Contrôle croisé : jq et JMESPath donnent-ils le même résultat ?
    let concordance = null
    if (exJq.texte !== undefined && exJm.texte !== undefined) {
      const vj = exJq.valeur && exJq.valeur.__flux ? exJq.valeur.valeurs : exJq.valeur
      concordance = égal(vj, exJm.valeur)
    }
    for (const e of [exJq, exJm]) delete e.valeur
    return { plan, étapes: décrirePlan(plan), hypothèses, jq: exJq, jmespath: exJm, alternatives, concordance, résultatPlan: aperçu(résultatPlan, 300), flux }
  }

  function générer({ texteEntrée, mode, texteAttendu, comparaison = 'exact', description, plan }) {
    const prép = préparer(texteEntrée)
    if (prép.erreur) return { ok: false, erreur: `JSON d'entrée invalide : ${prép.erreur.message} (ligne ${prép.erreur.ligne}, colonne ${prép.erreur.colonne}).` }
    const messages = []
    if (prép.analyse.tronqué) messages.push({ niveau: 'attention', texte: 'Document très volumineux : l\'analyse de structure a été limitée aux premiers nœuds ; l\'exécution porte sur tout le document.' })

    if (mode === 'exemple') {
      const a = lireAttendu(texteAttendu)
      if (!a.ok) return { ok: false, erreur: a.vide ? 'Indiquez le résultat attendu (JSON), ou passez en mode Description.' : `Résultat attendu invalide : ${a.erreur.message}${a.erreur.ligne ? ` (ligne ${a.erreur.ligne}, colonne ${a.erreur.colonne})` : ''}.` }
      if (a.brut) messages.push({ niveau: 'info', texte: 'Résultat attendu lu comme du texte brut (une valeur par ligne), comme la sortie de jq -r ou de --output text.' })
      const s = synthétiser(prép.valeur, prép.analyse, a.valeur, { mode: comparaison })
      if (!s.candidats.length) return { ok: true, mode, candidats: [], raisons: s.raisons, ambigu: !!s.ambigu, messages, brut: a.brut }
      const candidats = s.candidats.slice(0, 3).map(c => candidat(c.plan, prép, { attendu: a.valeur, comparaison, hypothèses: c.hypothèses }))
      if (s.ambigu) messages.push({ niveau: 'attention', texte: `Plusieurs interprétations reproduisent cet attendu (${s.candidats.length}). La plus simple est proposée ; les autres sont listées : ajoutez des éléments à l'exemple pour lever l'ambiguïté.` })
      return { ok: true, mode, candidats, raisons: s.raisons, ambigu: s.ambigu, messages, brut: a.brut, autres: s.candidats.length - candidats.length }
    }

    if (mode === 'description') {
      if (!description || !description.trim()) return { ok: false, erreur: 'Décrivez le résultat voulu (en français ou en anglais).' }
      const r = interpréter(description, prép.valeur, prép.analyse)
      if (!r.plans.length) return { ok: true, mode, langue: r.langue, candidats: [], raisons: r.raisons.length ? r.raisons : ['Je n\'ai pas pu rattacher cette description aux données. Essayez le mode guidé, ou citez un champ du JSON.'], messages, hypothèses: r.hypothèses }
      for (const raison of r.raisons) messages.push({ niveau: 'attention', texte: raison })
      const candidats = r.plans.slice(0, 4).map(p => candidat(p.plan, prép, { hypothèses: p.hypothèses, recherche: r.recherche }))
      return { ok: true, mode, langue: r.langue, candidats, raisons: [], messages, hypothèses: r.hypothèses }
    }

    if (mode === 'guidé') {
      if (!plan) return { ok: false, erreur: 'Choisissez au moins une collection.' }
      let c
      try { c = candidat(plan, prép, { hypothèses: ['Requête construite à partir de vos choix.'] }) } catch (e) { return { ok: false, erreur: `Choix incomplets : ${e.message}` } }
      return { ok: true, mode, candidats: [c], raisons: [], messages }
    }
    return { ok: false, erreur: `Mode inconnu : ${mode}` }
  }

  // Corrections proposées quand le résultat diffère de l'attendu : chacune
  // est exécutée, seules celles qui reproduisent l'attendu sont proposées.
  function corrections(langage, requête, résultat, attendu, prép, comparaison) {
    const pistes = []
    const essais = []
    const o = résultat.valeur
    const fluxO = o && o.__flux, fluxA = attendu && attendu.__flux
    const vo = fluxO ? o.valeurs : o, va = fluxA ? attendu.valeurs : attendu
    if (langage === 'jq') {
      if (fluxO && !fluxA) essais.push({ requête: `[${requête}]`, texte: 'Entourer la requête de [ … ] pour réunir les résultats dans un tableau.' })
      if (!fluxO && fluxA && Array.isArray(vo)) essais.push({ requête: `${requête} | .[]`, texte: 'Émettre les éléments un par un (| .[]).' })
      if (Array.isArray(vo) && vo.length === 1) essais.push({ requête: `${requête} | .[0]`, texte: 'Prendre le seul élément du tableau (.[0]).' })
      if (Array.isArray(va) && !Array.isArray(vo) && !fluxO) essais.push({ requête: `[${requête}]`, texte: 'Mettre le résultat dans un tableau.' })
      if (Array.isArray(vo) && vo.every(Array.isArray)) essais.push({ requête: `${requête} | flatten(1)`, texte: 'Aplatir un niveau de tableaux (flatten(1)).' })
      if (Array.isArray(vo) && vo.includes(null)) essais.push({ requête: `${requête} | map(values)`, texte: 'Écarter les valeurs null (map(values)).' })
    } else {
      if (Array.isArray(vo) && vo.length === 1) essais.push({ requête: `${requête} | [0]`, texte: 'Prendre le seul élément du tableau (| [0]).' })
      if (Array.isArray(va) && !Array.isArray(vo)) essais.push({ requête: `[${requête}]`, texte: 'Mettre le résultat dans une liste ([ … ]).' })
      if (Array.isArray(vo) && vo.every(Array.isArray)) essais.push({ requête: `${requête}[]`, texte: 'Aplatir les listes imbriquées ([]).' })
    }
    // Clés renommées : mêmes valeurs sous un autre nom.
    const lignesO = Array.isArray(vo) ? vo : [vo], lignesA = Array.isArray(va) ? va : [va]
    if (lignesO.length === lignesA.length && lignesO.every(x => x && typeof x === 'object' && !Array.isArray(x)) && lignesA.every(x => x && typeof x === 'object' && !Array.isArray(x))) {
      const ko = Object.keys(lignesO[0] || {}), ka = Object.keys(lignesA[0] || {})
      let texte = requête
      for (const a of ka.filter(k => !ko.includes(k))) {
        const source = ko.find(k => !ka.includes(k) && lignesO.every((l, i) => égal(l[k], lignesA[i][a])))
        if (!source) continue
        pistes.push(`La clé « ${source} » contient les valeurs attendues sous « ${a} » : renommez-la.`)
        const avant = new RegExp(`([{,]\\s*)${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*[:,}])`)
        texte = texte.replace(avant, (_, x, y) => (y.trim() === ':' ? `${x}${a}${y}` : `${x}${a}: ${langage === 'jq' ? `.${source}` : source}${y}`))
      }
      if (texte !== requête) essais.push({ requête: texte, texte: 'Renommer les clés du résultat.' })
    }
    // Ordre seul différent.
    const c = comparer(o, attendu, comparaison)
    if (c.différences.some(d => d.type === 'ordre')) pistes.push('Mêmes éléments dans un autre ordre : triez (sort_by) ou choisissez la comparaison « Ordre indifférent ».')
    // Valeurs attendues présentes ailleurs dans le JSON.
    for (const d of c.différences.filter(x => x.type === 'valeur').slice(0, 3)) pistes.push(`${d.chemin || 'résultat'} : ${aperçu(d.attendu)} attendu — vérifiez le champ utilisé.`)
    // Synthèse complète à partir de l'attendu.
    const s = synthétiser(prép.valeur, prép.analyse, attendu, { mode: comparaison })
    for (const cand of s.candidats.slice(0, 2)) {
      const g = langage === 'jq' ? générerJq(cand.plan, prép.valeur) : générerJmes(cand.plan, prép.valeur)
      if (g.requête && g.requête !== requête) essais.push({ requête: g.requête, texte: `Requête régénérée depuis l'attendu : ${décrirePlan(cand.plan).join(' · ')}.` })
    }
    const vérifiées = []
    const vues = new Set()
    for (const e of essais) {
      if (vues.has(e.requête)) continue
      vues.add(e.requête)
      const ex = exécuterEtVérifier(langage, e.requête, prép, { référence: attendu, typeRéférence: 'attendu', comparaison, flux: !!fluxA })
      if (ex.statut === 'vérifiée') vérifiées.push({ requête: e.requête, texte: e.texte })
      if (vérifiées.length >= 3) break
    }
    if (!vérifiées.length && !pistes.length && s.raisons.length) pistes.push(...s.raisons)
    return { vérifiées, pistes }
  }

  // Exécution d'une requête (éventuellement modifiée à la main).
  function exécuterRequête({ langage, requête, texteEntrée, texteAttendu, comparaison = 'exact', plan }) {
    const prép = préparer(texteEntrée)
    if (prép.erreur) return { ok: false, erreur: `JSON d'entrée invalide : ${prép.erreur.message}` }
    let attendu, typeRéférence
    if (texteAttendu && texteAttendu.trim()) {
      const a = lireAttendu(texteAttendu)
      if (a.ok) { attendu = a.valeur; typeRéférence = 'attendu' }
    } else if (plan) {
      const r = évaluer(plan, prép.valeur)
      attendu = plan.flux && langage === 'jq' ? { __flux: true, valeurs: r } : r
      typeRéférence = 'plan'
    }
    const flux = !!(attendu && attendu.__flux)
    const ex = exécuterEtVérifier(langage, requête, prép, { référence: attendu, typeRéférence, comparaison, flux })
    if (ex.statut === 'différente' && typeRéférence === 'attendu') {
      const r = exécuter(langage, requête, prép, flux)
      ex.corrections = corrections(langage, requête, r, attendu, prép, comparaison)
    }
    if (ex.statut === 'erreur' && typeRéférence === 'attendu') {
      const s = synthétiser(prép.valeur, prép.analyse, attendu, { mode: comparaison })
      const g = s.candidats[0] && (langage === 'jq' ? générerJq(s.candidats[0].plan, prép.valeur) : générerJmes(s.candidats[0].plan, prép.valeur))
      if (g?.requête) {
        const v = exécuterEtVérifier(langage, g.requête, prép, { référence: attendu, typeRéférence: 'attendu', comparaison, flux })
        ex.corrections = { vérifiées: v.statut === 'vérifiée' ? [{ requête: g.requête, texte: 'Requête régénérée depuis l\'attendu.' }] : [], pistes: [] }
      }
    }
    delete ex.valeur
    return { ok: true, exécution: ex }
  }

  function expliquer({ langage, requête }) {
    return langage === 'jq' ? expliquerJq(requête) : expliquerJmes(requête)
  }

  return { analyser, générer, exécuterRequête, expliquer, version: { jq: jq.version, jmespath: '0.16.0' } }
}
