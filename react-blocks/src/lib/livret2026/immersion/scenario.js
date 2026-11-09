// Scénario de l'« Immersion » : la suite des plans que le lecteur montre et
// les répliques qu'il dit, dans l'ordre. Fonctions pures, partagées par
// l'application (components/livret/immersion) et par l'outil des voix
// (outils/voix/extraire-immersion.mjs) : chaque réplique a une clé stable.
//
// Trois voix : « annonce » (bande-annonce, intertitres), « narrateur » (récit),
// « narratrice » (portraits et dates à retenir).
import { ÉPISODES, BANDE_ANNONCE, GÉO, PÉRIODES } from './histoire.js'
import { FLEUVES, MASSIFS, GRANDES_VILLES, PORTS } from './lieux.js'

// Texte dit à voix haute : sans renvoi de page, dates lisibles.
export const parlé = t => String(t)
  .replace(/\s*\((?:p\.|page)\s*\d+[^)]*\)/g, '')
  .replace(/av\. J\.-C\./g, 'avant Jésus-Christ')
  .replace(/(\d) – (\d)/g, '$1 à $2')
  .replace(/\b([IVX]+e) – ([IVX]+e)\b/g, 'du $1 au $2')
  .replace(/ · /g, ', ')
  .replace(/[←→★]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const ligne = (clé, texte, voix = 'narrateur', extra = {}) => ({ clé, texte, voix, ...extra })
export const numéroÉpisode = id => ÉPISODES.findIndex(e => e.id === id) + 1

// ---------- Bande-annonce + grande frise (l'ouverture) ----------
export function plansOuverture() {
  const plans = BANDE_ANNONCE.map((s, i) => ({
    id: `ba:${i}`, type: i === BANDE_ANNONCE.length - 1 ? 'ba-titre' : 'ba', année: s.année, couleur: s.couleur, p: s.p,
    carte: { pays: ['France'], ...s.carte }, musique: i === BANDE_ANNONCE.length - 1 ? 'final' : 'tension', son: 'bloc',
    lignes: [ligne(`ba:${i}`, s.texte, 'annonce', { p: s.p })],
  }))
  plans.push(planFrise())
  return plans
}

// La grande frise du livret (p. 38), dite période par période.
export function planFrise() {
  const périodes = PÉRIODES.filter(p => p.début != null)
  return {
    id: 'frise', type: 'frise', couleur: '#ffd166', p: 38, musique: 'élévation', son: 'page',
    carte: null,
    lignes: [
      ligne('frise:0', 'La grande frise du livret : les principales périodes de l’histoire de France.', 'narratrice', { p: 38, période: null }),
      ...périodes.map((p, i) => ligne(`frise:${i + 1}`, `${p.début} : ${p.nom.replace(/^(Le |La |L’)/, m => m.toLowerCase())}.`, 'narratrice', { p: 38, période: PÉRIODES.indexOf(p) })),
    ],
  }
}

// ---------- Un épisode ----------
export function plansÉpisode(ep) {
  const n = numéroÉpisode(ep.id)
  const c = { pays: ['France'], ...ep.carte }
  const plans = []
  plans.push({
    id: `${ep.id}:g`, type: 'générique', n, titre: ep.titre, période: ep.période, étapes: ep.étapes, couleur: ep.couleur, carte: c, musique: ep.musique, son: 'bloc', p: ep.pages[0],
    lignes: [ligne(`${ep.id}:g`, `Épisode ${n}. ${ep.titre}. ${ep.période}.`, 'annonce', { p: ep.pages[0] })],
  })
  if (ep.horsLivret) plans.push({ id: `${ep.id}:h`, type: 'horsLivret', couleur: ep.couleur, carte: c, p: 38, lignes: [ligne(`${ep.id}:h`, ep.horsLivret, 'narrateur', { p: 38 })] })
  if (ep.décor.length) {
    plans.push({
      id: `${ep.id}:c`, type: 'contexte', couleur: ep.couleur, carte: c, son: 'feuillette',
      lignes: ep.décor.map(([t, p], i) => ligne(`${ep.id}:c:${i}`, t, 'narrateur', { p })),
    })
  }
  ep.personnages.forEach((pp, i) => plans.push({
    id: `${ep.id}:p:${i}`, type: 'personnage', personnage: pp, couleur: ep.couleur, carte: c, son: 'lanterne', p: pp.p,
    lignes: [ligne(`${ep.id}:p:${i}`, `${pp.nom}${pp.dates ? `, ${pp.dates}` : ''}. ${pp.rôle}`, 'narratrice', { p: pp.p })],
  }))
  ep.événements.forEach((e, i) => {
    const k = `${ep.id}:e${i}`
    plans.push({
      id: k, type: 'événement', événement: e, couleur: ep.couleur, son: 'whoosh', p: e.p,
      carte: e.carte ? { pays: ['France'], ...e.carte } : { ...c, lieux: e.lieux || c.lieux, actifs: e.lieux || [] },
      lignes: [
        ligne(`${k}:0`, `${e.date}. ${e.titre}.`, 'annonce', { rôle: 'titre', p: e.p }),
        e.cause && ligne(`${k}:c`, `Pourquoi ? ${e.cause}`, 'narrateur', { rôle: 'cause', p: e.p }),
        ligne(`${k}:d`, e.déroulement, 'narrateur', { rôle: 'déroulement', p: e.p }),
        e.conséquence && ligne(`${k}:q`, `Conséquence : ${e.conséquence}`, 'narrateur', { rôle: 'conséquence', p: e.p }),
      ].filter(Boolean),
    })
  })
  const essentiels = ep.frise.map((f, i) => [f, i]).filter(([f]) => f.essentiel)
  plans.push({
    id: `${ep.id}:d`, type: 'dates', frise: ep.frise, couleur: ep.couleur, carte: c, son: 'page',
    lignes: [ligne(`${ep.id}:d`, 'Les dates indispensables.', 'narratrice', { index: -1 }), ...essentiels.map(([f, i], j) => ligne(`${ep.id}:d:${j}`, `${f.date} : ${f.texte}.`, 'narratrice', { index: i }))],
  })
  plans.push({ id: `${ep.id}:t`, type: 'transition', texte: ep.transition, couleur: ep.couleur, carte: c, lignes: [ligne(`${ep.id}:t`, ep.transition, 'narrateur')] })
  return plans
}

// ---------- Le volet géographique (pages 49 à 51) ----------
const POURQUOI_CARTES = [
  { couches: ['massifs'], fleuves: ['rhin'], pays: ['France', 'Italy', 'Spain', 'Germany'] },
  { couches: ['mers'], lieux: PORTS },
  { lieux: ['nantes', ...PORTS.filter(p => p !== 'saint-nazaire')], actifs: ['nantes'] },
  { fleuves: ['rhone'], lieux: ['avignon', 'lyon'], actifs: ['avignon'] },
  { couches: ['mers'], lieux: ['normandie', 'paris'], flèches: [['normandie', 'paris']], actifs: ['normandie'] },
]
export function plansGéo() {
  const [situation, voisins, côtes, fleuves] = GÉO.intro
  const plans = [
    { id: 'geo:titre', type: 'géo-titre', couleur: '#0ea5e9', musique: 'élévation', son: 'bloc', p: 49, carte: { vue: 'europe', pays: ['France'] }, lignes: [ligne('geo:titre', 'Le volet géographique. Où est la France, et pourquoi sa géographie compte.', 'annonce', { p: 49 })] },
    { id: 'geo:situation', type: 'géo', titre: 'À l’ouest de l’Europe', couleur: '#0ea5e9', p: 49, carte: { vue: 'europe', pays: ['France'] }, lignes: [ligne('geo:situation', situation[0], 'narrateur', { p: situation[1] })] },
    { id: 'geo:voisins', type: 'géo', titre: '8 pays voisins', couleur: '#0ea5e9', p: 49, carte: { vue: 'france', pays: ['France', 'Germany', 'Andorra', 'Belgium', 'Spain', 'Italy', 'Luxembourg', 'Monaco', 'Switzerland'], couches: ['voisins'] }, lignes: [ligne('geo:voisins', voisins[0], 'narrateur', { p: voisins[1] })] },
    { id: 'geo:cotes', type: 'géo', titre: '5 500 km de côtes', couleur: '#0ea5e9', p: 49, carte: { vue: 'france', pays: ['France'], couches: ['mers'] }, lignes: [ligne('geo:cotes', côtes[0], 'narrateur', { p: côtes[1] })] },
    { id: 'geo:villes', type: 'géo', titre: 'Les plus grandes villes', couleur: '#0ea5e9', p: 49, carte: { vue: 'france', pays: ['France'], lieux: GRANDES_VILLES }, lignes: [
      ligne('geo:villes:0', 'Au 1er janvier 2025, les plus grandes villes de France sont Paris, Lyon, Lille, Marseille, Toulouse, Bordeaux, Nantes, Nice et Strasbourg.', 'narrateur', { p: 49 }),
      ligne('geo:villes:1', 'Ces neuf villes ont une dimension internationale.', 'narrateur', { p: 49 }),
    ] },
    { id: 'geo:fleuves', type: 'géo', titre: 'Cinq grands fleuves', couleur: '#0ea5e9', p: 51, carte: { vue: 'france', pays: ['France'], fleuves: FLEUVES.map(f => f.id) }, lignes: [ligne('geo:fleuves', fleuves[0], 'narrateur', { p: fleuves[1] })] },
    ...FLEUVES.map(f => ({
      id: `geo:f:${f.id}`, type: 'fleuve', fleuve: f, titre: f.nom, couleur: f.couleur, p: f.p, son: 'goutte',
      carte: { vue: 'france', pays: ['France'], fleuves: [f.id], trace: f.id, lieux: f.villes, actifs: f.villes },
      lignes: [ligne(`geo:f:${f.id}:0`, `${f.nom}.`, 'annonce', { p: f.p }), ligne(`geo:f:${f.id}:1`, f.info, 'narrateur', { p: f.p })],
    })),
    { id: 'geo:massifs', type: 'géo', titre: 'Les montagnes', couleur: '#a3e635', p: 51, carte: { vue: 'france', pays: ['France'], couches: ['massifs'], lieux: ['mont-blanc'] }, lignes: [
      ligne('geo:massifs:0', `${MASSIFS[0].nom}. ${MASSIFS[0].info}`, 'narrateur', { p: 51, massif: MASSIFS[0].id }),
      ligne('geo:massifs:1', `${MASSIFS[1].nom}. ${MASSIFS[1].info}`, 'narrateur', { p: 51, massif: MASSIFS[1].id }),
      ligne('geo:massifs:2', 'Le Massif central, le Jura et les Vosges sont d’autres massifs.', 'narrateur', { p: 51, massif: 'autres' }),
    ] },
    { id: 'geo:ports', type: 'géo', titre: 'Les grands ports', couleur: '#0ea5e9', p: 50, carte: { vue: 'france', pays: ['France'], couches: ['mers'], lieux: PORTS }, lignes: [
      ligne('geo:ports:0', 'Les plus grands ports maritimes commerciaux français sont Le Havre, Marseille-Fos, Dunkerque et Nantes-Saint-Nazaire.', 'narrateur', { p: 50 }),
      ligne('geo:ports:1', 'Plus de 90 % du commerce international de marchandises se fait par bateau.', 'narrateur', { p: 50 }),
    ] },
    ...GÉO.pourquoi.map((c, i) => ({
      id: `geo:pq:${i}`, type: 'pourquoi', titre: c.titre, texte: c.texte, couleur: '#f59e0b', p: c.p, son: 'lanterne',
      carte: { vue: 'france', pays: ['France'], ...POURQUOI_CARTES[i] },
      lignes: [ligne(`geo:pq:${i}:0`, `Pourquoi c’est important : ${c.titre.toLowerCase()}.`, 'annonce', { p: c.p }), ligne(`geo:pq:${i}:1`, c.texte, 'narrateur', { p: c.p })],
    })),
  ]
  return plans
}

// Toutes les répliques, pour la génération des voix.
export function toutesLesLignes() {
  const plans = [...plansOuverture(), ...ÉPISODES.flatMap(plansÉpisode), ...plansGéo()]
  const lignes = plans.flatMap(p => p.lignes)
  const vues = new Set()
  for (const l of lignes) { if (vues.has(l.clé)) throw new Error(`Clé en double : ${l.clé}`); vues.add(l.clé) }
  return lignes
}
