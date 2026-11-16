// Générateur jq : écrit une requête jq à partir du plan, avec les idiomes de
// jq (select, map, group_by, from_entries…). Compatible jq 1.6 et suivants.
// Les protections (« []? », « values », « // 0 »…) ne sont ajoutées que si le
// JSON fourni en a besoin ; chaque ajout est expliqué dans les notes.
import { ITER, champJq, cheminJq, cléObjetJq, contientIteration, identifiantSimple, littéralJq, texteChemin } from './chemins.js'
import { contexteDonnées, sousÉléments } from './donnees.js'
import { texteChamp } from './plan.js'

// Accès à un champ (chemin relatif sans itération, ou étiquette) depuis base.
function accès(champ, ctx, notes, base = '') {
  if (champ.tag) {
    const t = champ.tag
    const prof = ctx.profil({ tag: t })
    const tags = `${base}${cheminJq(t.chemin)}`
    if (prof.sansTableau) notes.add(`« // [] » : certains éléments n'ont pas de ${texteChemin(t.chemin)}.`)
    return `(${tags}${prof.sansTableau ? ' // []' : ''} | from_entries)${champJq(t.clé)}`
  }
  if (!champ.chemin.length) return base || '.'
  return `${base}${cheminJq(champ.chemin)}`
}

// Une valeur d'objet jq doit être un « terme » : sinon, parenthèses.
function besoinParenthèses(e) {
  let n = 0
  const t = e.replace(/"(?:[^"\\]|\\.)*"/g, '""')
  for (const ch of t) {
    if ('([{'.includes(ch)) n++
    else if (')]}'.includes(ch)) n--
    else if (n === 0 && (ch === ' ' || ch === '|' || ch === ',')) return true
  }
  return false
}

// Valeur projetée (dans un objet ou seule).
function valeurJq(p, ctx, notes) {
  switch (p.type) {
    case 'élément': return '.'
    case 'tag': return accès({ tag: p.tag }, ctx, notes)
    case 'champ': {
      if (!contientIteration(p.chemin)) return accès({ chemin: p.chemin }, ctx, notes)
      const opt = ctx.optionnelsRelatifs(p.chemin)
      const prof = ctx.profil({ chemin: p.chemin })
      if (opt.size) notes.add(`« []? » : ${texteChemin(p.chemin.slice(0, [...opt][0]))} manque dans certains éléments.`)
      const valeurs = prof.nuls ? ' | values' : ''
      if (valeurs) notes.add('« values » écarte les valeurs null de la liste.')
      return `[${cheminJq(p.chemin, { optionnels: opt })}${valeurs}]`
    }
    case 'objet': return `{${p.champs.map(c => pairJq(c, ctx, notes)).join(', ')}}`
    case 'liste': return `[${p.éléments.map(x => valeurJq(x, ctx, notes)).join(', ')}]`
    default: throw new Error(`projection ${p.type}`)
  }
}

function pairJq(c, ctx, notes) {
  const v = c.valeur
  if (v.type === 'champ' && v.chemin.length === 1 && v.chemin[0] === c.nom && identifiantSimple(c.nom) && cléObjetJq(c.nom) === c.nom) return c.nom
  const expr = valeurJq(v, ctx, notes)
  return `${cléObjetJq(c.nom)}: ${besoinParenthèses(expr) ? `(${expr})` : expr}`
}

// Condition sur un élément.
function conditionJq(c, ctx, notes, imbriqué = false) {
  switch (c.type) {
    case 'et': {
      const t = c.conds.map(x => conditionJq(x, ctx, notes, true)).join(' and ')
      return imbriqué ? `(${t})` : t
    }
    case 'ou': {
      const t = c.conds.map(x => conditionJq(x, ctx, notes, true)).join(' or ')
      return imbriqué ? `(${t})` : t
    }
    case 'non': return `(${conditionJq(c.cond, ctx, notes)} | not)`
    default: break
  }
  if (!c.champ.tag && contientIteration(c.champ.chemin)) {
    // Au moins une valeur de la liste vérifie la condition : any(liste; test).
    const ch = c.champ.chemin
    const dernier = ch.lastIndexOf(ITER)
    const opt = ctx.optionnelsRelatifs(ch, ctx.éléments)
    const générateur = cheminJq(ch.slice(0, dernier + 1), { optionnels: opt })
    const reste = { ...c, champ: { chemin: ch.slice(dernier + 1) } }
    const sous = ctx.pour(sousÉléments(ctx.éléments, ch.slice(0, dernier + 1)))
    return `any(${générateur}; ${sansParenthèsesExtérieures(conditionJq(reste, sous, notes))})`
  }
  const f = accès(c.champ, ctx, notes)
  const prof = ctx.profil(c.champ, ctx.éléments)
  const chaîne = (fn, v) => {
    const sûr = prof.nuls || [...prof.types].some(t => t !== 'string')
    if (sûr) notes.add(`« // "" » : ${texteChamp(c.champ)} n'est pas toujours une chaîne.`)
    return `(${f}${sûr ? ' // ""' : ''} | ${fn}(${littéralJq(v)}))`
  }
  switch (c.type) {
    case 'cmp': {
      if (c.op === '==' && c.valeur === true && [...prof.types].every(t => t === 'boolean')) return f
      if (c.op === '==' || c.op === '!=') return `${f} ${c.op} ${littéralJq(c.valeur)}`
      // Ordre : jq compare aussi null et les types mélangés (null < nombre).
      const typeAttendu = typeof c.valeur
      const autres = [...prof.types].some(t => t !== typeAttendu)
      const nulsGênants = prof.nuls && (c.op === '<' || c.op === '<=')
      const cmp = `${f} ${c.op} ${littéralJq(c.valeur)}`
      if (autres) { notes.add(`Test du type : ${texteChamp(c.champ)} contient d'autres types que ${typeAttendu === 'number' ? 'des nombres' : 'des chaînes'}.`); return `(${f} | type) == "${typeAttendu}" and ${cmp}` }
      if (nulsGênants) { notes.add(`« != null » : en jq, null est inférieur à tout nombre ; les éléments sans ${texteChamp(c.champ)} sont écartés.`); return `${f} != null and ${cmp}` }
      return cmp
    }
    case 'contient': return chaîne('contains', c.valeur)
    case 'commence': return chaîne('startswith', c.valeur)
    case 'finit': return chaîne('endswith', c.valeur)
    case 'existe': return `${f} != null`
    case 'absent': return `${f} == null`
    case 'dans': {
      const t = c.valeurs.map(v => `${f} == ${littéralJq(v)}`).join(' or ')
      return imbriqué || c.valeurs.length > 1 ? `(${t})` : t
    }
    default: throw new Error(`condition ${c.type}`)
  }
}

const sansParenthèsesExtérieures = t => (t.startsWith('(') && t.endsWith(')') && équilibré(t.slice(1, -1)) ? t.slice(1, -1) : t)
function équilibré(t) {
  let n = 0
  for (const ch of t.replace(/"(?:[^"\\]|\\.)*"/g, '""')) { if (ch === '(') n++; else if (ch === ')') { n--; if (n < 0) return false } }
  return n === 0
}

// Flux des éléments : source + select.
function fluxÉléments(plan, ctx, notes) {
  const opt = ctx.optionnelsSource
  if (opt.size) notes.add('« []? » : le tableau est absent à certains endroits du JSON.')
  let e = cheminJq(plan.source, { optionnels: opt })
  if (plan.filtre) e += ` | select(${sansParenthèsesExtérieures(conditionJq(plan.filtre, ctx, notes))})`
  return e
}

// Ajoute une projection au flux (forme courte si possible : .a[].b).
function avecProjection(flux, p, ctx, notes, filtre) {
  if (!p || p.type === 'élément') return flux
  if (p.type === 'champ' && !contientIteration(p.chemin) && !filtre) return `${flux}${cheminJq(p.chemin)}`
  return `${flux} | ${valeurJq(p, ctx, notes)}`
}

// Enchaîne des étapes jq ; « . » en tête est omis.
const enchaîner = étapes => étapes.filter((x, i) => !(x === '.' && i === 0 && étapes.length > 1)).join(' | ')

// .[0] suivi d'un chemin simple : .[0].Id
function aprèsIndex(étapes, valeur) {
  if (/^\.[A-Za-z_"]/.test(valeur) && !besoinParenthèses(valeur) && étapes.at(-1) === '.[0]') étapes[étapes.length - 1] = `.[0]${valeur}`
  else étapes.push(valeur)
}

function générerCollection(plan, ctx, notes) {
  const flux = fluxÉléments(plan, ctx, notes)
  const simple = !plan.filtre && plan.source.filter(s => s === ITER).length === 1 && plan.source.at(-1) === ITER && !ctx.optionnelsSource.size
  // Tableau des éléments retenus : .Volumes (forme courte) ou [ … | select(…) ].
  const tableau = simple ? cheminJq(plan.source.slice(0, -1)) : `[${flux}]`

  if (plan.groupe) {
    const g = plan.groupe
    const clé = accès(g.champ, ctx, notes, '.[0]')
    const typesClé = ctx.profil(g.champ).types
    const cléTexte = g.forme === 'objet' && ([...typesClé].some(t => t !== 'string') || ctx.profil(g.champ).nuls) ? `(${clé} | tostring)` : clé
    if (cléTexte !== clé) notes.add('« tostring » : les clés d\'un objet doivent être des chaînes.')
    const m = g.mesure
    let mesure
    if (m.op === 'nombre') mesure = 'length'
    else if (m.op === 'liste') mesure = `map(${valeurJq(m.projection, ctx, notes)}${m.ignorerNull ? ' | values' : ''})`
    else {
      const f = accès(m.champ, ctx, notes)
      mesure = m.op === 'somme' ? `map(${f}) | add` : m.op === 'moyenne' ? `map(${f} | values) | add / length` : `map(${f} | values) | ${m.op}`
    }
    const clé2 = besoinParenthèses(cléTexte) ? `(${cléTexte})` : cléTexte
    const mes = besoinParenthèses(mesure) ? `(${mesure})` : mesure
    const étapes = [tableau, `group_by(${accès(g.champ, ctx, notes)})`]
    if (g.forme === 'objet') étapes.push(`map({key: ${clé2}, value: ${mes}})`, 'from_entries')
    else étapes.push(`map({${cléObjetJq(g.nomClé || 'key')}: ${clé2}, ${cléObjetJq(g.nomMesure || 'count')}: ${mes}})`)
    return enchaîner(étapes)
  }

  const a = plan.agrégat
  if (a) {
    if (a.op === 'nombre') return enchaîner([tableau, 'length'])
    const f = accès(a.champ, ctx, notes)
    const prof = ctx.profil(a.champ)
    const valeurs = prof.nuls && a.op !== 'somme' ? ' | values' : ''
    if (valeurs) notes.add(`« values » : ${prof.nuls} élément(s) sans ${texteChamp(a.champ)} sont ignorés.`)
    const liste = `[${flux} | ${f}${valeurs}]`
    if (a.op === 'somme') {
      const vide = !ctx.filtrés.length
      if (vide) notes.add('« // 0 » : add renvoie null sur une liste vide.')
      return `${liste} | add${vide ? ' // 0' : ''}`
    }
    if (a.op === 'moyenne') {
      if (!prof.valeurs.some(v => typeof v === 'number')) { notes.add('Liste vide : la division par zéro est évitée.'); return `${liste} | if length > 0 then add / length else null end` }
      return `${liste} | add / length`
    }
    if (a.op === 'min' || a.op === 'max') return `${liste} | ${a.op}`
    if (a.op === 'joindre') return `${liste} | join(${littéralJq(a.séparateur ?? ', ')})`
    // minPar / maxPar : max_by de jq renvoie le dernier ex æquo, le plan veut le premier.
    const avecValeur = prof.nuls ? `[${flux} | select(${f} != null)]` : tableau
    if (prof.nuls) notes.add(`Les éléments sans ${texteChamp(a.champ)} sont écartés (jq classe null avant les nombres).`)
    const valeursNonNulles = prof.valeurs.filter(v => v !== null && v !== undefined)
    const étapes = [avecValeur, `${a.op === 'minPar' ? 'min_by' : 'max_by'}(${f})`]
    if (a.op === 'maxPar' && valeursNonNulles.length) {
      const max = valeursNonNulles.reduce((m, v) => (v > m ? v : m))
      if (valeursNonNulles.filter(v => v === max).length > 1) {
        notes.add('Ex æquo : max_by renverrait le dernier ; la requête garde le premier.')
        étapes.splice(1, 1, `(map(${f}) | max) as $max`, `map(select(${f} == $max))`, '.[0]')
      }
    }
    if (plan.projection && plan.projection.type !== 'élément') aprèsIndex(étapes, valeurJq(plan.projection, ctx, notes))
    return enchaîner(étapes)
  }

  const p = plan.projection
  const tri = plan.tri
  const nulsÀÉcarter = plan.ignorerNull && p && ctx.projectionsNulles(p)
  if (nulsÀÉcarter) notes.add('« values » écarte les valeurs null.')
  if (plan.premier && !tri) return `[${avecProjection(flux, p, ctx, notes, plan.filtre)}][0]`
  if (tri || plan.tranche || plan.premier) {
    // Trier sur la clé projetée si elle figure dans le résultat, sinon avant la projection.
    const étapes = []
    const projetée = tri && p?.type === 'objet' && p.champs.find(c => c.valeur.type === 'champ' && !tri.champ.tag && JSON.stringify(c.valeur.chemin) === JSON.stringify(tri.champ.chemin))
    const triValeurs = tri && p?.type === 'champ' && !tri.champ.tag && JSON.stringify(p.chemin) === JSON.stringify(tri.champ.chemin) && !contientIteration(p.chemin)
    const tranche = plan.tranche && `.[${plan.tranche.début || ''}:${plan.tranche.fin ?? ''}]`
    if (projetée || triValeurs) {
      étapes.push(`[${avecProjection(flux, p, ctx, notes, plan.filtre)}${nulsÀÉcarter ? ' | values' : ''}]`, triValeurs ? 'sort' : `sort_by(${champJq(projetée.nom)})`)
      if (tri.desc) étapes.push('reverse')
      if (tranche) étapes.push(tranche)
      if (plan.premier) étapes.push('.[0]')
    } else {
      étapes.push(tableau)
      if (tri) { étapes.push(`sort_by(${accès(tri.champ, ctx, notes)})`); if (tri.desc) étapes.push('reverse') }
      if (tranche) étapes.push(tranche)
      const v = p && p.type !== 'élément' ? valeurJq(p, ctx, notes) : null
      if (plan.premier) { étapes.push('.[0]'); if (v) aprèsIndex(étapes, v) } else if (v) étapes.push(`map(${v}${nulsÀÉcarter ? ' | values' : ''})`)
    }
    if (plan.unique) étapes.push('unique')
    return enchaîner(étapes)
  }
  let corps = avecProjection(flux, p, ctx, notes, plan.filtre)
  if (nulsÀÉcarter) corps += ' | values'
  if (plan.flux) return corps
  return plan.unique ? `[${corps}] | unique` : `[${corps}]`
}

// Point d'entrée : { requête, notes } ou { impossible }.
export function générerJq(plan, racine) {
  const ctx = contexteDonnées(plan, racine)
  const notes = new Set()
  let requête
  switch (plan.type) {
    case 'valeur': {
      if (!contientIteration(plan.chemin)) { requête = cheminJq(plan.chemin); break }
      const opt = new Set()
      plan.chemin.forEach((s, i) => { if (s === ITER && ctxValeurOptionnelle(racine, plan.chemin, i)) opt.add(i) })
      const brut = valeursBrutes(racine, plan.chemin)
      const nuls = brut.some(v => v === null || v === undefined)
      if (nuls) notes.add('« values » écarte les occurrences sans valeur.')
      requête = `[${cheminJq(plan.chemin, { optionnels: opt })}${nuls ? ' | values' : ''}]`
      break
    }
    case 'valeurs': requête = `[${plan.chemins.map(c => cheminJq(c)).join(', ')}]`; break
    case 'objet': requête = `{${plan.champs.map(c => `${cléObjetJq(c.nom)}: ${cheminJq(c.chemin)}`).join(', ')}}`; break
    case 'clés': requête = plan.chemin.length ? `${cheminJq(plan.chemin)} | keys_unsorted` : 'keys_unsorted'; break
    case 'longueur': requête = `${cheminJq(plan.chemin)} | length`; break
    case 'collection': requête = générerCollection(plan, ctx, notes); break
    default: return { impossible: `Plan non pris en charge : ${plan.type}` }
  }
  return { requête, notes: [...notes] }
}

function valeursBrutes(racine, chemin) {
  const sortie = []
  const aller = (v, i) => {
    if (i === chemin.length) { sortie.push(v); return }
    const s = chemin[i]
    if (s === ITER) { if (Array.isArray(v)) for (const e of v) aller(e, i + 1); return }
    if (v === null || v === undefined || typeof v !== 'object') { sortie.push(undefined); return }
    aller(typeof s === 'number' ? v[s] : v[s], i + 1)
  }
  aller(racine, 0)
  return sortie
}

function ctxValeurOptionnelle(racine, chemin, i) {
  const parents = valeursBrutes(racine, chemin.slice(0, i))
  return parents.some(p => !Array.isArray(p))
}

// Variantes récursives pour « la valeur de la clé X » où qu'elle soit.
export function jqRechercheClé(nom) {
  return `[.. | objects | select(has(${littéralJq(nom)})) | ${champJq(nom)}]`
}
export function jqPremièreClé(nom) {
  return `first(.. | objects | select(has(${littéralJq(nom)})) | ${champJq(nom)})`
}
