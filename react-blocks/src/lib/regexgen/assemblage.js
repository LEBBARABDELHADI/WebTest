// Assemblage : transforme la spécification d'une description (pièces et
// contraintes lues par langue.js) en arbre de regex, selon la cible :
//   valider  la chaîne entière (^…$)
//   lignes   chaque ligne du texte (^…$ avec le drapeau m)
//   trouver  des occurrences dans un texte (limites de mot, drapeau g)
import { ANY, BOL, EOL, WB, alt, cls, esc, grp, look, lit, nc, q, seq, star, émettre } from './ast.js'
import { arbreEntité, entité } from './catalogue.js'
import { nœudPièce } from './langue.js'

const CIBLES = {
  valider: 'valider la chaîne entière (^…$)',
  lignes: 'sélectionner des lignes (^…$ avec le drapeau m)',
  trouver: 'trouver des occurrences dans un texte (limites de mot, drapeau g)',
}
export const NOMS_CIBLES = CIBLES

const motif = n => émettre(n, 'js').pattern

// ---- Bords de mot ---------------------------------------------------------------------------

// Le nœud peut-il commencer (côté 'début') ou finir (côté 'fin') par un caractère de mot ?
function bordMot(n, côté) {
  switch (n.t) {
    case 'lit': { const c = côté === 'début' ? [...n.v][0] : [...n.v].at(-1); return /\w/.test(c) }
    case 'esc': return n.c === 'd' || n.c === 'w'
    case 'cls': return !n.neg && n.items.every(i => (i.esc ? i.esc === 'd' || i.esc === 'w' : (i.lo >= 48 && i.hi <= 57) || (i.lo >= 65 && i.hi <= 90) || (i.lo >= 97 && i.hi <= 122) || i.lo === 95))
    case 'grp': return bordMot(n.x, côté)
    case 'q': return n.min >= 1 && bordMot(n.x, côté)
    case 'seq': {
      // Les assertions (lookahead / lookbehind) ne consomment rien : on regarde l'élément voisin.
      const xs = n.xs.filter(x => x.t !== 'look')
      return xs.length > 0 && bordMot(côté === 'début' ? xs[0] : xs.at(-1), côté)
    }
    case 'alt': return n.xs.every(x => bordMot(x, côté))
    default: return false
  }
}

const avecBords = corps => seq(bordMot(corps, 'début') ? WB : null, corps, bordMot(corps, 'fin') ? WB : null)

// ---- Contraintes en assertions --------------------------------------------------------------------

const nœudOpérande = o => (o.alternatives ? o.base : o.base)

// « contient » : au moins une occurrence (classe : selon la quantité demandée).
function contientNœud(o) {
  if (!o.littéral && !o.entité && !o.format && !o.alternatives) {
    const min = o.quant.article ? 1 : o.quant.min
    const max = o.quant.strict && o.quant.max !== Infinity ? o.quant.max : Infinity
    const unité = seq(star(ANY), o.base)
    const positif = min <= 1 ? look(unité) : look(q(nc(unité), min, Infinity))
    if (max === Infinity) return [positif]
    return [positif, look(q(nc(unité), max + 1, Infinity), { neg: true })]
  }
  return [look(seq(star(ANY), nœudOpérande(o)))]
}

// ---- Construction -----------------------------------------------------------------------------------

function corpsDesPièces(pièces, spec) {
  return pièces.map(p => {
    const n = nœudPièce(p)
    return spec.groupes && !p.littéral && !p.entité && !p.format ? grp(n) : n
  })
}

// Décrit en une ligne une pièce ou un opérande.
const ligne = (texte, n) => ({ texte: `« ${texte} » → ${motif(n)}` })

// Construit l'arbre pour une cible donnée. Renvoie { ast, étapes, notes, flags, cible }.
function construire(spec, piècesBrutes, cible) {
  const étapes = []
  const notes = []
  const flags = new Set()
  // « commence par X suivi de Y » : X est la première pièce de la suite.
  const enTête = spec.contraintes.filter(c => c.séquence).flatMap(c => c.opérandes.map(o => ({ ...o, k: c.k, tête: true })))
  const contraintes = spec.contraintes.filter(c => !c.séquence)
  let pièces = [...enTête, ...piècesBrutes]
  // « au moins une majuscule et un chiffre » (sans « suivi de / puis ») : des conditions qui se cumulent,
  // pas une suite : chaque classe devient une assertion, la chaîne est quelconque.
  const classes = pièces.filter(p => !p.générique && !p.entité && !p.format && !p.littéral && !p.tête)
  const suite = spec.J.some(t => !t.cité && ['suivi', 'suivie', 'suivis', 'suivies', 'puis', 'ensuite', 'followed', 'then'].includes(t.norm))
  const cumul = classes.length >= 2 && classes.length === pièces.filter(p => !p.générique).length && classes.some(p => p.quant.auMoins) && !suite
  const cumulées = cumul ? classes : []
  if (cumul) pièces = pièces.filter(p => !classes.includes(p))
  let génériques = pièces.filter(p => p.générique)
  let corps = pièces.filter(p => !p.générique)
  // « lettres et chiffres de 3 à 10 caractères » : la longueur s'applique à l'unique pièce.
  if (génériques.length === 1 && corps.length === 1 && !corps[0].entité && !corps[0].format && corps[0].quant.max === Infinity && corps[0].quant.min <= 1) {
    const g = génériques[0]
    corps = [{ ...corps[0], quant: { ...corps[0].quant, min: g.quant.min, max: g.quant.max }, texte: `${corps[0].texte} ${g.texte}` }]
    génériques = []
  }

  // Entrée du catalogue qui porte ses propres ancres : utilisée telle quelle.
  const ancrée = corps.length === 1 && corps[0].def?.ancré ? corps[0].def : corps.length === 1 && corps[0].entité && entité(corps[0].entité).ancré ? entité(corps[0].entité) : null
  if (ancrée) {
    for (const f of ancrée.flags ?? '') flags.add(f)
    if (spec.options.casse) flags.add('i')
    étapes.push({ texte: `« ${corps[0].texte} » → ${ancrée.titre} : ${motif(corps[0].base)}` })
    return { ast: corps[0].base, étapes, notes: ancrée.notes ?? [], flags, cible: ancrée.cibleParDéfaut ?? cible, ancrée: true, corps }
  }

  const nœuds = corpsDesPièces(corps, spec)
  corps.forEach((p, i) => étapes.push(ligne(p.texte, nœuds[i])))
  for (const p of corps) if (p.entité) notes.push(...(entité(p.entité).notes ?? []))
  const body = nœuds.length ? seq(...nœuds) : null
  if (cible === 'trouver') for (const p of corps) if (p.entité && entité(p.entité).peuDistinctif) notes.push(`« ${entité(p.entité).titre} » est un format trop général pour du texte libre (il correspond à presque n'importe quel mot) : ajoutez du contexte autour (ex. « image: … ») ou validez des chaînes isolées.`)
  const longueur = génériques.at(-1)?.quant
  génériques.forEach(g => étapes.push({ texte: `« ${g.texte} » → ${corps.length || contraintes.length ? 'longueur totale' : 'caractères quelconques'} : ${motif(q(ANY, g.quant.min, g.quant.max))}` }))

  const par = { contient: [], sans: [], début: [], fin: [] }
  for (const c of contraintes) for (const o of c.opérandes) par[c.type].push({ ...o, brutTexte: c.texte })
  for (const o of cumulées) par.contient.push({ ...o, brutTexte: o.texte })

  if (cible === 'trouver') {
    let b = body
    if (par.contient.length && !b) {
      // « contenant X » dans un texte : on cherche X.
      const o = par.contient[0]
      b = nœudOpérande(o)
      étapes.push(ligne(o.texte, b))
      if (par.contient.length > 1) notes.push('Plusieurs « contient » : seul le premier est cherché ; utilisez la cible « lignes » pour combiner des conditions.')
    } else if (par.contient.length || par.sans.length) {
      notes.push('Les conditions « contient » et « sans » portent sur une chaîne ou une ligne entière : elles sont ignorées pour une recherche dans un texte (choisissez la cible « lignes »).')
    }
    const début = par.début[0], fin = par.fin[0]
    if (début || fin) {
      const mot = q(nc(lit('')), 0, 0)
      void mot
      const w = { t: 'esc', c: 'w' }
      if (!b) {
        const parties = [début ? nœudOpérande(début) : null, début && fin ? q(w, 0, Infinity) : q(w, 0, Infinity), fin ? nœudOpérande(fin) : null].filter(Boolean)
        b = début && !fin ? seq(WB, nœudOpérande(début), q(w, 0, Infinity), WB) : !début && fin ? seq(WB, q(w, 0, Infinity), nœudOpérande(fin), WB) : seq(WB, ...parties, WB)
        if (début) étapes.push(ligne(début.brutTexte, nœudOpérande(début)))
        if (fin) étapes.push(ligne(fin.brutTexte, nœudOpérande(fin)))
        notes.push('Dans un texte, « commence par / finit par » s\'applique à des mots entiers.')
        return { ast: b, étapes, notes, flags, cible, corps }
      }
      if (début) { b = seq(look(nœudOpérande(début)), b); étapes.push(ligne(début.brutTexte, look(nœudOpérande(début)))) }
      if (fin) { b = seq(b, look(nœudOpérande(fin), { ahead: false })); étapes.push(ligne(fin.brutTexte, look(nœudOpérande(fin), { ahead: false }))) }
    }
    if (!b) return { erreur: 'Rien à chercher : précisez un format, un texte entre guillemets ou une suite d\'éléments.' }
    if (spec.options.motEntier) b = seq(WB, b, WB)
    else b = avecBords(b)
    flags.add('g')
    if (spec.options.casse) flags.add('i')
    return { ast: b, étapes, notes, flags, cible, corps }
  }

  // valider / lignes : toute la chaîne (ou toute la ligne)
  const seulementUne = !body && !longueur && par.sans.length === 0 && (par.contient.length + par.début.length + par.fin.length) >= 1
  let ast
  const simple = seulementUne && (
    (par.contient.length === 1 && !par.début.length && !par.fin.length && contientNœud(par.contient[0]).length === 1 && (par.contient[0].littéral || par.contient[0].entité || par.contient[0].format || par.contient[0].alternatives || par.contient[0].quant.min <= 1)) ||
    (par.début.length <= 1 && par.fin.length <= 1 && !par.contient.length))
  if (simple) {
    if (par.contient.length) { const o = par.contient[0]; ast = seq(BOL, star(ANY), nœudOpérande(o), star(ANY), EOL); étapes.push(ligne(o.brutTexte, seq(star(ANY), nœudOpérande(o), star(ANY)))) } else {
      const d = par.début[0], f = par.fin[0]
      ast = seq(BOL, d ? nœudOpérande(d) : null, star(ANY), f ? nœudOpérande(f) : null, EOL)
      if (d) étapes.push(ligne(d.brutTexte, nœudOpérande(d)))
      if (f) étapes.push(ligne(f.brutTexte, nœudOpérande(f)))
    }
  } else {
    const tests = []
    for (const o of par.contient) { const t = contientNœud(o); tests.push(...t); étapes.push({ texte: `« ${o.brutTexte} » → ${t.map(motif).join('')}` }) }
    for (const o of par.sans) { const t = look(seq(star(ANY), nœudOpérande(o)), { neg: true }); tests.push(t); étapes.push({ texte: `« ${o.brutTexte} » → ${motif(t)}` }) }
    for (const o of par.début) { const t = look(nœudOpérande(o)); tests.push(t); étapes.push({ texte: `« ${o.brutTexte} » → ${motif(t)}` }) }
    for (const o of par.fin) { const t = look(seq(star(ANY), nœudOpérande(o), EOL)); tests.push(t); étapes.push({ texte: `« ${o.brutTexte} » → ${motif(t)}` }) }
    let b = body
    if (longueur && body) {
      const t = look(q(ANY, longueur.min, longueur.max === Infinity ? Infinity : longueur.max).t ? seq(q(ANY, longueur.min, longueur.max), EOL) : null)
      tests.push(t)
    } else if (longueur) b = q(ANY, longueur.min, longueur.max)
    ast = seq(BOL, ...tests, b ?? star(ANY), EOL)
  }
  flags.add(cible === 'lignes' ? 'm' : '')
  flags.delete('')
  if (cible === 'lignes') flags.add('g')
  if (spec.options.multiligne) flags.add('m')
  if (spec.options.casse) flags.add('i')
  return { ast, étapes, notes, flags, cible, corps }
}

// ---- Cible ---------------------------------------------------------------------------------------------

function résoudreCible(spec, demandée) {
  if (demandée && demandée !== 'auto') return { cible: demandée, raison: 'choisie' }
  const { cues } = spec.options
  const entités = spec.pièces.filter(p => p.entité)
  const défaut = entités.map(p => (p.def ?? entité(p.entité))?.cibleParDéfaut).find(Boolean)
  if (cues.lignes) return { cible: 'lignes', raison: 'le mot « ligne » apparaît dans la description' }
  if (cues.valider && !cues.trouver) return { cible: 'valider', raison: 'la description demande de valider / vérifier un format' }
  if (cues.trouver) return { cible: 'trouver', raison: 'la description demande de trouver / extraire dans un texte' }
  if (défaut) return { cible: défaut, raison: 'cible habituelle pour ce format' }
  if (spec.pièces.length && spec.pièces.every(p => p.littéral) && !spec.contraintes.length) return { cible: 'trouver', raison: 'un simple texte à repérer : on le cherche dans un document (choisissez « valider » pour exiger qu\'il soit tout le texte)' }
  if (!spec.pièces.length && spec.contraintes.length) return { cible: 'lignes', raison: 'seules des conditions (contient, commence par…) sont données : on sélectionne des lignes' }
  const pluriel = entités.length === 1 && spec.pièces.length === 1 && spec.J[entités[0].k + entités[0].n - 1]?.norm !== spec.J[entités[0].k + entités[0].n - 1]?.sing
  if (pluriel) return { cible: 'trouver', raison: 'le format est au pluriel : on cherche toutes ses occurrences' }
  return { cible: 'valider', raison: 'par défaut, on valide une chaîne entière' }
}

// ---- Variantes d'entité (date, téléphone…) --------------------------------------------------------------------

function développerVariantes(spec) {
  // Entrée du catalogue avec alternatives (semver → semver avec « v »)
  const j = spec.pièces.findIndex(p => p.entité && entité(p.entité).alternatives)
  if (j >= 0 && !spec.pièces.some(p => p.variantes)) {
    const p = spec.pièces[j]
    return [p.entité, ...entité(p.entité).alternatives].map(id => {
      const def = entité(id)
      return spec.pièces.map((x, k) => (k === j ? { ...x, base: arbreEntité(id, { groupes: spec.groupes }), entité: id, def, nom: def.titre } : x))
    })
  }
  const i = spec.pièces.findIndex(p => p.variantes)
  if (i < 0) return [spec.pièces]
  const p = spec.pièces[i]
  const ordre = spec.langue === 'en' && p.def.variantesEn ? p.def.variantesEn : p.variantes
  return ordre.map(id => {
    const def = entité(id)
    const base = arbreEntité(id, { groupes: spec.groupes })
    const pièces = spec.pièces.map((x, k) => (k === i ? { ...x, base, entité: id, def, nom: def.titre, variantes: null, enveloppe: true } : x))
    return pièces
  })
}

// Candidats pour une spécification : [{ ast, flags, cible, titre, étapes, hypothèses, entité }]
function avecDécimales(spec) {
  if (spec.décimales === null || spec.décimales === undefined) return spec
  const n = spec.décimales
  const base = n === 0 ? seq(q(esc('d'), 1, Infinity)) : seq(q(cls([{ lo: 43, hi: 43 }, { lo: 45, hi: 45 }]), 0, 1), plus1(esc('d')), cls([{ lo: 46, hi: 46 }, { lo: 44, hi: 44 }]), q(esc('d'), n, n))
  const pièce = { k: 0, n: 0, texte: `nombre à ${n} décimale${n > 1 ? 's' : ''}`, base, quant: { min: 1, max: 1, explicite: false }, générique: false, entité: null, nom: `nombre à ${n} décimale${n > 1 ? 's' : ''}`, littéral: false, enveloppe: true }
  const i = spec.pièces.findIndex(p => p.entité === 'decimal' || p.entité === 'entier')
  const pièces = i >= 0 ? spec.pièces.map((p, k) => (k === i ? { ...pièce, k: p.k, n: p.n, texte: p.texte + ` à ${n} décimales` } : p)) : [pièce, ...spec.pièces]
  return { ...spec, pièces }
}
const plus1 = x => q(x, 1, Infinity)

export function assembler(specBrute, { cible: demandée = 'auto' } = {}) {
  const spec = avecDécimales(specBrute)
  const { cible, raison } = résoudreCible(spec, demandée)
  const candidats = []
  const raisons = []
  for (const pièces of développerVariantes(spec)) {
    let cibleFinale = cible
    const r0 = construire(spec, pièces, cibleFinale)
    if (r0.erreur) { raisons.push(r0.erreur); continue }
    const r = r0
    cibleFinale = r.cible
    const entités = pièces.filter(p => p.entité)
    const unique = pièces.length === 1 && entités.length === 1
    const corpsTitre = r.corps ?? pièces.filter(p => !p.générique)
    const quantTitre = p => (p.quant.min === 1 && p.quant.max === 1 ? '' : ` (${p.quant.max === Infinity ? `${p.quant.min}+` : p.quant.min === p.quant.max ? p.quant.min : `${p.quant.min}-${p.quant.max}`})`)
    const titre = unique ? entité(entités[0].entité).titre
      : corpsTitre.length ? `Séquence : ${corpsTitre.map(p => `${p.nom}${quantTitre(p)}`).join(' + ')}`
        : spec.contraintes.length ? `Chaîne vérifiant : ${spec.contraintes.map(c => c.texte).join(' ; ')}` : 'Caractères quelconques'
    const hypothèses = [
      `Cible : ${CIBLES[cibleFinale]} — ${r.ancrée ? 'formulation propre à ce format' : raison}.`,
      ...r.étapes.map(e => e.texte),
      ...(r.notes ?? []),
    ]
    if (spec.options.casse) hypothèses.push('Insensible à la casse : drapeau i.')
    if (spec.groupes) hypothèses.push('Groupes de capture demandés : les éléments reconnus sont capturés (groupes nommés quand le format les connaît).')
    if (spec.inconnus.length) hypothèses.push(`Mots non utilisés : ${spec.inconnus.map(k => spec.J[k].brut).join(', ')}.`)
    candidats.push({ ast: r.ast, flags: ['g', 'i', 'm', 's', 'u', 'y'].filter(f => r.flags.has(f)).join(''), cible: cibleFinale, titre, étapes: r.étapes, hypothèses, entité: unique ? entités[0].entité : null, notes: r.notes ?? [] })
  }
  return { candidats, raisons, cible, raisonCible: raison }
}

export { alt }
