// Progression dans le Livret 2026 : plan calé sur la date d'examen, leçons
// faites, pages vues, maîtrise page par page, cartes Mémoriser.
// Fichier livret-<espace>.json :
// { plan: { examen, début, calendrier: [[leçonId, date, titre, emoji]] },
//   leçons: { id: { faite, bonnes, total, oral } }, pages: { n: { animée } },
//   maison: { objetId: date }, situations: { id: { bon, date } }, frise: { meilleur },
//   immersion: { ouverture, libre, épisodes: { id: { vu, compris, quiz, meilleur, validé } }, géo, examen } }
import { useMemo } from 'react'
import { useDonnéesSynchronisées } from '../synchro'
import { décaler, dateDe, aujourdhuiLocal } from '../habitudes'
import { modifierOutil } from '../donneesFoyer'
import { LEÇONS, PAGE, PAGES_CONTENU, PAQUET_ID, PAQUET_NOM, cartesDePage, leçonDePage } from './index'

const objet = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : {})
export function compléterLivret(o) {
  const d = objet(o)
  return { ...d, plan: d.plan && typeof d.plan === 'object' ? d.plan : null, leçons: objet(d.leçons), pages: objet(d.pages), maison: objet(d.maison), situations: objet(d.situations), frise: objet(d.frise), immersion: objet(d.immersion) }
}
export function useLivret(espace) {
  const config = useMemo(() => ({ id: espace, stockage: `react-blocs-livret-${espace}`, chemin: `react-blocks/src/data/livret-${espace}.json`, données: {} }), [espace])
  return useDonnéesSynchronisées(config, compléterLivret)
}

const jours = (a, b) => Math.round((dateDe(b) - dateDe(a)) / 86400000)

// A. Plan : toutes les leçons réparties jusqu'à l'examen, en gardant les
// derniers jours pour les révisions et les examens blancs.
export function créerPlan(examen, début = aujourdhuiLocal()) {
  const n = LEÇONS.length
  const total = examen ? Math.max(1, jours(début, examen)) : n
  const réserve = !examen ? 0 : total >= 35 ? 14 : total >= 14 ? 7 : 0
  const étude = Math.max(1, total - réserve)
  const calendrier = LEÇONS.map((l, i) => [l.id, décaler(début, examen ? Math.floor((i * étude) / n) : i), l.titre, l.emoji])
  return { examen: examen || null, début, calendrier, réserve, parJour: Math.max(1, Math.ceil(n / étude)) }
}

export function étatPlan(data, auj = aujourdhuiLocal()) {
  const plan = data.plan
  if (!plan?.calendrier?.length) return null
  const restantes = plan.calendrier.filter(([id]) => !data.leçons[id]?.faite)
  const duJour = restantes.filter(([, date]) => date <= auj)
  const faites = plan.calendrier.length - restantes.length
  return {
    prochaine: restantes[0] || null,
    duJour,
    enRetard: duJour.filter(([, date]) => date < auj).length,
    faites, total: plan.calendrier.length,
    joursAvant: plan.examen ? jours(auj, plan.examen) : null,
    phaseRévision: !!plan.examen && !restantes.length,
  }
}

// E. Maîtrise d'une page : 0 pas vue · 1 vue · 2 apprise (rappel réussi) · 3 maîtrisée (cartes ≥ niveau 3).
export function niveauPage(n, data, cartesMémo = []) {
  const p = PAGE.get(n)
  if (!p || p.type !== 'contenu') return null
  const parId = new Map(cartesMémo.map(c => [c.id, c]))
  const cartes = cartesDePage(p).map(c => parId.get(c.id)).filter(Boolean)
  if (cartes.length && cartes.length === (p.questions || []).length && cartes.every(c => (c.niveau || 0) >= 3)) return 3
  const l = leçonDePage(n)
  const r = l && data.leçons[l.id]
  if ((r?.faite && (!r.total || r.bonnes / r.total >= 0.5)) || cartes.some(c => (c.niveau || 0) >= 1)) return 2
  if (r?.faite || data.pages[n]?.animée) return 1
  return 0
}
export function bilanMaîtrise(data, cartesMémo = []) {
  const niveaux = PAGES_CONTENU.map(p => niveauPage(p.page, data, cartesMémo))
  const compte = [0, 1, 2, 3].map(k => niveaux.filter(x => x === k).length)
  return { compte, total: niveaux.length, taux: niveaux.length ? niveaux.reduce((t, x) => t + x, 0) / (3 * niveaux.length) : 0 }
}

// C. Cartes des pages d'une leçon dans Mémoriser (paquet dédié, sans doublon).
export async function ajouterCartesLivret(espace, pages, actuel) {
  const cartes = pages.flatMap(n => (PAGE.get(n) ? cartesDePage(PAGE.get(n)) : []))
  const auj = new Date().toISOString().slice(0, 10)
  let ajoutées = 0
  const r = await modifierOutil('memoriser', espace, d => {
    const paquets = d.paquets || []
    const avecPaquet = paquets.some(p => p.id === PAQUET_ID) ? paquets : [...paquets, { id: PAQUET_ID, nom: PAQUET_NOM, couleur: '#2563eb' }]
    const déjà = new Set((d.cartes || []).map(c => c.id))
    const neuves = cartes.filter(c => !déjà.has(c.id)).map(c => ({ id: c.id, paquetId: PAQUET_ID, recto: c.recto, verso: c.verso, niveau: 0, prochaineRevision: auj }))
    ajoutées = neuves.length
    return { ...d, paquets: avecPaquet, cartes: [...(d.cartes || []), ...neuves] }
  }, actuel)
  return { ...r, ajoutées, total: cartes.length }
}
