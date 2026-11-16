// Profil des données vues par un plan : les générateurs s'en servent pour
// n'ajouter une protection (null, tableau absent, type mixte) que lorsque le
// JSON en a réellement besoin, afin de garder la requête la plus simple.
import { ITER, contientIteration, lire, lireTous, typeJson } from './chemins.js'
import { projeter, tester, valeurDe, élémentsSource } from './plan.js'

function contexte(racine, éléments, filtrés, optionnelsSource) {
  return {
    racine,
    éléments,
    filtrés,
    optionnelsSource,
    // Même contexte pour d'autres éléments (ex. les conteneurs d'un pod).
    pour(liste) { return contexte(racine, liste, liste, new Set()) },
    // Profil d'un champ sur une liste d'éléments.
    profil(champ, liste = filtrés) {
      const types = new Set()
      let nuls = 0, sansTableau = 0
      const valeurs = []
      for (const e of liste) {
        if (!champ.tag && contientIteration(champ.chemin)) {
          const premier = champ.chemin.indexOf(ITER)
          if (!Array.isArray(lire(e, champ.chemin.slice(0, premier)))) sansTableau++
          for (const v of lireTous(e, champ.chemin)) { if (v === undefined || v === null) nuls++; else types.add(typeJson(v)) }
          continue
        }
        if (champ.tag && !Array.isArray(lire(e, champ.tag.chemin))) sansTableau++
        const v = valeurDe(e, champ)
        valeurs.push(v)
        if (v === null || v === undefined) nuls++
        else types.add(typeJson(v))
      }
      return { types, nuls, sansTableau, valeurs, n: liste.length }
    },
    // Des valeurs projetées sont-elles null ?
    projectionsNulles(p, liste = filtrés) { return liste.some(e => projeter(e, p) === null) },
    // Positions d'itération d'un chemin relatif où un tableau manque parfois.
    optionnelsRelatifs(chemin, liste = filtrés) {
      const sortie = new Set()
      chemin.forEach((s, i) => {
        if (s !== ITER) return
        if (liste.some(e => lireTous(e, chemin.slice(0, i)).some(p => !Array.isArray(p)))) sortie.add(i)
      })
      return sortie
    },
  }
}

export function contexteDonnées(plan, racine) {
  const collection = plan.type === 'collection'
  const éléments = collection ? élémentsSource(racine, plan.source) : []
  const filtrés = collection && plan.filtre ? éléments.filter(e => tester(e, plan.filtre)) : éléments
  const optionnelsSource = new Set()
  if (collection) {
    plan.source.forEach((s, i) => {
      if (s !== ITER) return
      if (lireTous(racine, plan.source.slice(0, i)).some(p => !Array.isArray(p))) optionnelsSource.add(i)
    })
  }
  return contexte(racine, éléments, filtrés, optionnelsSource)
}

// Éléments d'un tableau imbriqué (pour les conditions « au moins un … »).
export function sousÉléments(liste, chemin) {
  const sortie = []
  for (const e of liste) for (const x of lireTous(e, chemin)) if (x !== undefined) sortie.push(x)
  return sortie
}
