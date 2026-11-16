// Générateur JMESPath : écrit une requête JMESPath à partir du plan, avec les
// idiomes de JMESPath (projections, filtres [?…], fonctions, aplatissement []).
// JMESPath standard n'a ni regroupement ni dédoublonnage : ces demandes sont
// soit réécrites valeur par valeur (en le signalant), soit déclarées impossibles.
import { ITER, champJmes, cheminJmes, comparerJq, contientIteration, égal, identifiantSimple, littéralJmes, texteChemin } from './chemins.js'
import { contexteDonnées, sousÉléments } from './donnees.js'
import { texteChamp, texteClé, valeurDe } from './plan.js'

const ajouterNote = (notes, n) => notes.add(n)
const cléHash = nom => (identifiantSimple(nom) ? nom : JSON.stringify(nom))

// Expression d'un champ relatif à l'élément courant.
function accès(champ, ctx, notes) {
  if (champ.tag) return `${cheminJmes(champ.tag.chemin)}[?${champJmes(champ.tag.kClé)}==${littéralJmes(champ.tag.clé)}].${champJmes(champ.tag.kValeur)} | [0]`
  if (!champ.chemin.length) return '@'
  if (contientIteration(champ.chemin)) {
    const prof = ctx.profil(champ)
    const t = cheminJmes(champ.chemin)
    if (prof.sansTableau) { ajouterNote(notes, `« || \`[]\` » : ${texteChemin(champ.chemin.slice(0, champ.chemin.indexOf(ITER)))} manque dans certains éléments (JMESPath donnerait null).`); return `${t} || \`[]\`` }
    return t
  }
  return cheminJmes(champ.chemin)
}

const entreParenthèses = e => (/\|/.test(e) ? `(${e})` : e)

function conditionJ(c, ctx, notes, parent = null) {
  switch (c.type) {
    case 'et': return c.conds.map(x => conditionJ(x, ctx, notes, 'et')).join(' && ')
    case 'ou': {
      const t = c.conds.map(x => conditionJ(x, ctx, notes, 'ou')).join(' || ')
      return parent === 'et' || parent === 'non' ? `(${t})` : t
    }
    case 'non': return `!(${conditionJ(c.cond, ctx, notes, 'non')})`
    default: break
  }
  if (!c.champ.tag && contientIteration(c.champ.chemin)) {
    // Au moins un élément du tableau imbriqué vérifie la condition.
    const ch = c.champ.chemin
    const dernier = ch.lastIndexOf(ITER)
    const sous = ctx.pour(sousÉléments(ctx.éléments, ch.slice(0, dernier + 1)))
    const reste = { ...c, champ: { chemin: ch.slice(dernier + 1) } }
    return `${cheminJmes(ch.slice(0, dernier))}[?${conditionJ(reste, sous, notes)}]`
  }
  if (c.champ.tag && c.type === 'cmp' && c.op === '==') {
    const t = c.champ.tag
    return `${cheminJmes(t.chemin)}[?${champJmes(t.kClé)}==${littéralJmes(t.clé)} && ${champJmes(t.kValeur)}==${littéralJmes(c.valeur)}]`
  }
  const f = entreParenthèses(accès(c.champ, ctx, notes))
  const prof = ctx.profil(c.champ, ctx.éléments)
  const chaîne = (fn, v) => {
    const sûr = prof.nuls > 0
    if (sûr) ajouterNote(notes, `« || '' » : ${texteChamp(c.champ)} est parfois absent (${fn} refuse null).`)
    return `${fn}(${sûr ? `${f} || ''` : f}, ${littéralJmes(v)})`
  }
  switch (c.type) {
    case 'cmp': {
      if (c.op === '==' && c.valeur === true && prof.types.size && [...prof.types].every(t => t === 'boolean')) return f
      if (c.op !== '==' && c.op !== '!=' && typeof c.valeur === 'string') ajouterNote(notes, 'Comparaison de chaînes avec < ou > : acceptée par jmespath.js (ici), refusée par l\'AWS CLI (jmespath Python) qui ne compare que des nombres.')
      return `${f}${c.op}${littéralJmes(c.valeur)}`
    }
    case 'contient': return chaîne('contains', c.valeur)
    case 'commence': return chaîne('starts_with', c.valeur)
    case 'finit': return chaîne('ends_with', c.valeur)
    case 'existe': return `${f}!=\`null\``
    case 'absent': return `${f}==\`null\``
    case 'dans': {
      const t = c.valeurs.map(v => `${f}==${littéralJmes(v)}`).join(' || ')
      return c.valeurs.length > 1 && (parent === 'et' || parent === 'non') ? `(${t})` : t
    }
    default: throw new Error(`condition ${c.type}`)
  }
}

function valeurJ(p, ctx, notes) {
  switch (p.type) {
    case 'élément': return '@'
    case 'champ': return accès({ chemin: p.chemin }, ctx, notes)
    case 'tag': return accès({ tag: p.tag }, ctx, notes)
    case 'objet': return `{${p.champs.map(c => `${cléHash(c.nom)}: ${valeurJ(c.valeur, ctx, notes)}`).join(', ')}}`
    case 'liste': return `[${p.éléments.map(x => valeurJ(x, ctx, notes)).join(', ')}]`
    default: throw new Error(`projection ${p.type}`)
  }
}

// Formes de base d'une collection : L = liste plate des éléments retenus ;
// proj(P) = projection de P sur ces éléments (liste plate).
function formes(plan, ctx, notes, filtreSupplémentaire = null) {
  const niveaux = plan.source.filter(s => s === ITER).length
  const base = cheminJmes(plan.source.slice(0, -1))
  const conds = [plan.filtre && conditionJ(plan.filtre, ctx, notes, filtreSupplémentaire ? 'et' : null), filtreSupplémentaire].filter(Boolean)
  const filtre = conds.length ? conds.join(' && ') : null
  const plat = niveaux === 1 ? (filtre ? `${base}[?${filtre}]` : base || '@') : filtre ? `${base}[?${filtre}][]` : `${base}[]`
  const projetable = niveaux === 1 ? (filtre ? `${base}[?${filtre}]` : base ? `${base}[]` : '[*]') : plat
  return {
    niveaux,
    plat,
    // Projection directe (forme AWS CLI) : Reservations[].Instances[?…].{…}[]
    projection(expr) {
      if (niveaux > 1 && filtre) return `${base}[?${filtre}].${expr}[]`
      return `${projetable}.${expr}`
    },
    // Liste plate des valeurs d'un champ (nulls écartés par JMESPath).
    valeurs(champ) {
      const e = champ.tag ? `${cheminJmes(champ.tag.chemin)}[?${champJmes(champ.tag.kClé)}==${littéralJmes(champ.tag.clé)}].${champJmes(champ.tag.kValeur)}[]` : cheminJmes(champ.chemin)
      return `${projetable}.${e}`
    },
  }
}

// Valeurs d'une étiquette, aplaties (éléments sans l'étiquette écartés).
const valeursTag = t => `${cheminJmes(t.chemin)}[?${champJmes(t.kClé)}==${littéralJmes(t.clé)}].${champJmes(t.kValeur)}[]`

// Projection sur une liste déjà calculée (résultat de fonction, tranche…).
// apresProjection : la liste est déjà une projection (tranche) : « .P » suffit.
const suffixeProjection = (expr, ctx, notes, p, { ignorerNull = false, aprèsProjection = false } = {}) => {
  if (!p || p.type === 'élément') return expr
  const lien = aprèsProjection ? '.' : '[].'
  if (p.type === 'tag') return ignorerNull ? `${expr}${lien}${valeursTag(p.tag)}` : `map(&${valeurJ(p, ctx, notes)}, ${expr})`
  if (p.type === 'champ' && contientIteration(p.chemin)) return `map(&${valeurJ(p, ctx, notes)}, ${expr})`
  return `${expr}${lien}${valeurJ(p, ctx, notes)}`
}

function générerCollection(plan, ctx, notes, info) {
  const F = formes(plan, ctx, notes)
  const p = plan.projection

  if (plan.unique) return { impossible: 'JMESPath standard n\'a pas de fonction pour supprimer les doublons (pas d\'équivalent de unique) : utilisez jq, ou dédoublonnez après coup (ex. sort -u).' }

  if (plan.groupe) {
    const g = plan.groupe
    const valeurs = []
    for (const e of ctx.filtrés) { const v = valeurDe(e, g.champ); if (!valeurs.some(x => égal(x, v))) valeurs.push(v) }
    valeurs.sort(comparerJq)
    if (valeurs.length > 25) return { impossible: `JMESPath standard ne sait pas regrouper (pas de group_by) ; il faudrait écrire les ${valeurs.length} groupes un par un. Utilisez jq.` }
    if (valeurs.some(v => v !== null && typeof v === 'object')) return { impossible: 'Regroupement sur une valeur objet ou tableau : impossible en JMESPath standard.' }
    info.dépendDesDonnées = true
    ajouterNote(notes, `JMESPath n'a pas de group_by : la requête liste les ${valeurs.length} valeur(s) présentes dans ce JSON (${valeurs.map(texteClé).slice(0, 6).join(', ')}${valeurs.length > 6 ? '…' : ''}). Une nouvelle valeur ne serait pas comptée.`)
    const fc = entreParenthèses(accès(g.champ, ctx, notes))
    const morceaux = valeurs.map(v => {
      const cond = g.champ.tag && v !== null
        ? `${cheminJmes(g.champ.tag.chemin)}[?${champJmes(g.champ.tag.kClé)}==${littéralJmes(g.champ.tag.clé)} && ${champJmes(g.champ.tag.kValeur)}==${littéralJmes(v)}]`
        : `${fc}==${littéralJmes(v)}`
      const G = formes(plan, ctx, notes, cond)
      const m = g.mesure
      let expr
      if (m.op === 'nombre') expr = `length(${G.plat})`
      else if (m.op === 'liste') expr = m.projection.type === 'élément' ? G.plat : G.projection(valeurJ(m.projection, ctx, notes))
      else if (m.op === 'somme') expr = `sum(${G.valeurs(m.champ)})`
      else if (m.op === 'moyenne') expr = `avg(${G.valeurs(m.champ)})`
      else expr = `${m.op}(${G.valeurs(m.champ)})`
      return { v, expr }
    })
    if (g.forme === 'objet') return { requête: `{${morceaux.map(x => `${cléHash(texteClé(x.v))}: ${x.expr}`).join(', ')}}` }
    return { requête: `[${morceaux.map(x => `{${cléHash(g.nomClé || 'key')}: ${littéralJmes(x.v)}, ${cléHash(g.nomMesure || 'count')}: ${x.expr}}`).join(', ')}]` }
  }

  const a = plan.agrégat
  if (a) {
    if (a.op === 'nombre') return { requête: `length(${F.plat})` }
    const prof = ctx.profil(a.champ)
    if (a.op === 'minPar' || a.op === 'maxPar') {
      const fc = entreParenthèses(accès(a.champ, ctx, notes))
      const G = prof.nuls ? formes(plan, ctx, notes, `${fc}!=\`null\``) : F
      if (prof.nuls) ajouterNote(notes, `${a.op === 'minPar' ? 'min_by' : 'max_by'} refuse null : les éléments sans ${texteChamp(a.champ)} sont écartés.`)
      let choix = `${a.op === 'minPar' ? 'min_by' : 'max_by'}(${G.plat}, &${accès(a.champ, ctx, notes)})`
      if ([...prof.types].includes('string')) {
        // min_by / max_by de JMESPath n'acceptent que des nombres : tri puis premier / dernier.
        ajouterNote(notes, `${a.op === 'minPar' ? 'min_by' : 'max_by'} n'accepte que des nombres en JMESPath : tri (sort_by) puis ${a.op === 'minPar' ? 'premier' : 'dernier'} élément.`)
        const valeurs = prof.valeurs.filter(v => v !== null && v !== undefined)
        const max = valeurs.reduce((m, v) => (v > m ? v : m), valeurs[0])
        const exæquo = a.op === 'maxPar' && valeurs.filter(v => v === max).length > 1
        const tri = `sort_by(${G.plat}, &${accès(a.champ, ctx, notes)})`
        choix = a.op === 'minPar' ? `${tri}[0]` : exæquo ? `reverse(sort_by(reverse(${G.plat}), &${accès(a.champ, ctx, notes)}))[0]` : `${tri}[-1]`
      }
      if (p && p.type !== 'élément') return { requête: `${choix}.${valeurJ(p, ctx, notes)}` }
      return { requête: choix }
    }
    const typesInvalides = [...prof.types].filter(t => t !== 'number' && !(t === 'string' && (a.op === 'min' || a.op === 'max' || a.op === 'joindre')))
    if (typesInvalides.length && a.op !== 'joindre') return { impossible: `${a.op}() de JMESPath n'accepte que des nombres${a.op === 'min' || a.op === 'max' ? ' ou des chaînes' : ''} ; ${texteChamp(a.champ)} contient aussi : ${typesInvalides.join(', ')}.` }
    if (a.op === 'joindre') {
      if ([...prof.types].some(t => t !== 'string')) return { impossible: `join() de JMESPath n'accepte que des chaînes ; ${texteChamp(a.champ)} contient d'autres types.` }
      return { requête: `join(${littéralJmes(a.séparateur ?? ', ')}, ${F.valeurs(a.champ)})` }
    }
    const fn = { somme: 'sum', moyenne: 'avg', min: 'min', max: 'max' }[a.op]
    return { requête: `${fn}(${F.valeurs(a.champ)})` }
  }

  const tri = plan.tri
  if (tri || plan.tranche || plan.premier) {
    let expr
    if (tri) {
      const prof = ctx.profil(tri.champ)
      const types = [...prof.types]
      if (prof.nuls || types.length > 1 || (types[0] && types[0] !== 'number' && types[0] !== 'string')) {
        return { impossible: `sort_by de JMESPath exige des clés toutes numériques ou toutes textuelles ; ici ${texteChamp(tri.champ)} ${prof.nuls ? `manque pour ${prof.nuls} élément(s)` : `mélange ${types.join(' et ')}`}. jq sait trier ces valeurs.` }
      }
      expr = `sort_by(${F.plat}, &${accès(tri.champ, ctx, notes)})`
      if (tri.desc) expr = `reverse(${expr})`
      if (plan.tranche) expr += `[${plan.tranche.début || ''}:${plan.tranche.fin ?? ''}]`
      if (plan.premier) expr += '[0]'
    } else {
      expr = F.plat
      const fonction = /^\w+\(/.test(expr)
      const simple = !plan.filtre && F.niveaux === 1 && expr !== '@'
      if (plan.tranche) expr = simple || fonction ? `${expr}[${plan.tranche.début || ''}:${plan.tranche.fin ?? ''}]` : `${expr} | [${plan.tranche.début || ''}:${plan.tranche.fin ?? ''}]`
      if (plan.premier) expr = simple ? `${expr}[0]` : `${expr} | [0]`
    }
    if (plan.premier) return { requête: p && p.type !== 'élément' ? `${expr}.${valeurJ(p, ctx, notes)}` : expr }
    if (p && p.type !== 'élément') {
      const nuls = !plan.ignorerNull && (p.type === 'champ' || p.type === 'tag') && ctx.projectionsNulles(p)
      if (nuls) { ajouterNote(notes, 'map(&…) conserve les valeurs null (une projection JMESPath les supprimerait).'); return { requête: `map(&${valeurJ(p, ctx, notes)}, ${expr})` } }
      return { requête: suffixeProjection(expr, ctx, notes, p, { ignorerNull: plan.ignorerNull, aprèsProjection: /\[\d*:\d*\]$/.test(expr) }) }
    }
    return { requête: expr }
  }

  if (!p || p.type === 'élément') return { requête: F.plat }
  if (p.type === 'champ' || p.type === 'tag') {
    const nuls = ctx.projectionsNulles(p)
    if (nuls && !plan.ignorerNull) {
      ajouterNote(notes, 'map(&…) conserve les valeurs null (une projection JMESPath les supprimerait).')
      return { requête: `map(&${valeurJ(p, ctx, notes)}, ${F.plat})` }
    }
    if (p.type === 'tag') return { requête: F.valeurs({ tag: p.tag }) }
    if (contientIteration(p.chemin)) return { requête: suffixeProjection(F.plat, ctx, notes, p) }

    if (nuls) ajouterNote(notes, 'La projection JMESPath ignore d\'elle-même les valeurs null.')
  }
  return { requête: F.projection(valeurJ(p, ctx, notes)) }
}

// Point d'entrée : { requête, notes, dépendDesDonnées } ou { impossible, notes }.
export function générerJmes(plan, racine) {
  const ctx = contexteDonnées(plan, racine)
  const notes = new Set()
  const info = { dépendDesDonnées: false }
  let r
  switch (plan.type) {
    case 'valeur': r = { requête: plan.chemin.length ? cheminJmes(plan.chemin) : '@' }; break
    case 'valeurs': r = { requête: `[${plan.chemins.map(c => cheminJmes(c) || '@').join(', ')}]` }; break
    case 'objet': r = { requête: `{${plan.champs.map(c => `${cléHash(c.nom)}: ${cheminJmes(c.chemin) || '@'}`).join(', ')}}` }; break
    case 'clés': r = { requête: `keys(${cheminJmes(plan.chemin) || '@'})` }; break
    case 'longueur': r = { requête: `length(${cheminJmes(plan.chemin) || '@'})` }; break
    case 'collection': r = générerCollection(plan, ctx, notes, info); break
    default: r = { impossible: `Plan non pris en charge : ${plan.type}` }
  }
  if (plan.flux) notes.add('JMESPath renvoie toujours un seul document : la liste des valeurs (jq peut les émettre une par une).')
  return { ...r, notes: [...notes], dépendDesDonnées: info.dépendDesDonnées }
}
