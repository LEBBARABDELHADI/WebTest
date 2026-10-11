// Contenu de départ de chaque outil. Les vraies données ne sont plus livrées
// avec le site : elles sont lues dans le dépôt privé (voir githubSync.js).
const COLONNES = [
  { id: 'c1', titre: "Aujourd'hui", couleur: '#fbbf24' },
  { id: 'c2', titre: 'Cette semaine', couleur: '#4ade80' },
  { id: 'c3', titre: 'Plus tard', couleur: '#a78bfa' },
  { id: 'c4', titre: 'Terminé', couleur: '#7fb069' },
]

const VIDES = {
  taches: { colonnes: COLONNES, étiquettes: [], cartes: [], timeline: [] },
  notes: { notes: [] },
  memoriser: { paquets: [], cartes: [] },
  graph: { graphes: [] },
  habitudes: { habitudes: [], coches: {} },
}

const ESPACES = ['perso', 'pro', 'idrissi-perso', 'idrissi-pro']

// { perso: {...}, pro: {...}, … } : une copie vide par espace.
export function videsParEspace(outil) {
  return Object.fromEntries(ESPACES.map(e => [e, structuredClone(VIDES[outil])]))
}
