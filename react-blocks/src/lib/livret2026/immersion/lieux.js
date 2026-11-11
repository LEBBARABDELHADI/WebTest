// Lieux, fleuves, montagnes et mers de l'« Immersion » : uniquement ceux que
// cite le Livret du citoyen 2026. Coordonnées [longitude, latitude] pour
// placer chaque nom au bon endroit sur la carte ; les textes (« info ») sont
// ceux du livret, avec la page.
//
// Les cartes (frontières actuelles, Natural Earth) sont précalculées par
// outils/cartes/construire-cartes.mjs → cartes.js. Relancer ce script après
// toute modification de ce fichier.

export const LIEUX = {
  // Villes de France
  paris: { nom: 'Paris', ll: [2.35, 48.86], type: 'capitale' },
  reims: { nom: 'Reims', ll: [4.03, 49.26] },
  versailles: { nom: 'Versailles', ll: [2.13, 48.8] },
  vichy: { nom: 'Vichy', ll: [3.43, 46.13] },
  nantes: { nom: 'Nantes', ll: [-1.55, 47.22] },
  montpellier: { nom: 'Montpellier', ll: [3.88, 43.61] },
  lyon: { nom: 'Lyon', ll: [4.84, 45.76] },
  marseille: { nom: 'Marseille', ll: [5.37, 43.3] },
  toulouse: { nom: 'Toulouse', ll: [1.44, 43.6] },
  bordeaux: { nom: 'Bordeaux', ll: [-0.58, 44.84] },
  lille: { nom: 'Lille', ll: [3.06, 50.63] },
  strasbourg: { nom: 'Strasbourg', ll: [7.75, 48.58] },
  nice: { nom: 'Nice', ll: [7.27, 43.7] },
  avignon: { nom: 'Avignon', ll: [4.81, 43.95] },
  'mont-saint-michel': { nom: 'Mont-Saint-Michel', ll: [-1.51, 48.64] },
  lascaux: { nom: 'Lascaux (Dordogne)', ll: [1.17, 45.05] },
  'le-havre': { nom: 'Le Havre', ll: [0.11, 49.49], type: 'port' },
  dunkerque: { nom: 'Dunkerque', ll: [2.38, 51.03], type: 'port' },
  fos: { nom: 'Marseille-Fos', ll: [4.94, 43.43], type: 'port' },
  'saint-nazaire': { nom: 'Nantes-Saint-Nazaire', ll: [-2.21, 47.27], type: 'port' },
  // Régions et repères
  normandie: { nom: 'Normandie', ll: [-0.4, 49.25], type: 'région' },
  champagne: { nom: 'Champagne', ll: [4.15, 48.95], type: 'région' },
  alsace: { nom: 'Alsace', ll: [7.45, 48.3], type: 'région' },
  moselle: { nom: 'Moselle', ll: [6.6, 49.0], type: 'région' },
  angleterre: { nom: 'Angleterre', ll: [-1.2, 51.15], type: 'pays' },
  bbc: { nom: 'Radio britannique (BBC)', ll: [-0.7, 51.3], type: 'repère' },
  'mont-blanc': { nom: 'Mont-Blanc (4 810 m)', ll: [6.86, 45.83], type: 'sommet' },
  // Europe
  waterloo: { nom: 'Waterloo', ll: [4.41, 50.68], type: 'bataille' },
  bruxelles: { nom: 'Bruxelles', ll: [4.35, 50.85] },
  francfort: { nom: 'Francfort', ll: [8.68, 50.11] },
  maastricht: { nom: 'Maastricht', ll: [5.69, 50.85] },
  rome: { nom: 'Rome', ll: [12.5, 41.9] },
  'empire-allemand': { nom: 'Empire allemand', ll: [11.5, 51.6], type: 'empire' },
  'autriche-hongrie': { nom: 'Empire austro-hongrois', ll: [17.5, 47.6], type: 'empire' },
  'empire-ottoman': { nom: 'Empire ottoman', ll: [33.5, 39.4], type: 'empire' },
  'grande-bretagne': { nom: 'Grande-Bretagne', ll: [-2.2, 53.4], type: 'pays' },
  'italie-ue': { nom: 'Italie', ll: [12.6, 42.9], type: 'pays' },
  'etats-unis-europe': { nom: '← États-Unis', ll: [-9.5, 46.2], type: 'pays' },
  urss: { nom: 'Russie / URSS', ll: [37.5, 56.2], type: 'pays' },
  'allemagne-nazie': { nom: 'Allemagne nazie', ll: [10.6, 51.2], type: 'empire' },
  prusse: { nom: 'Prusse', ll: [13.4, 52.7], type: 'pays' },
  'guerres-europe': { nom: 'Guerres en Europe', ll: [16.5, 50.2], type: 'repère' },
  // Monde
  afrique: { nom: 'Afrique', ll: [17, 8], type: 'continent' },
  antilles: { nom: 'Antilles', ll: [-62, 16.5], type: 'outre-mer' },
  reunion: { nom: 'La Réunion', ll: [55.5, -21.1], type: 'outre-mer' },
  guyane: { nom: 'Guyane', ll: [-53.1, 4.0], type: 'outre-mer' },
  mayotte: { nom: 'Mayotte', ll: [45.15, -12.8], type: 'outre-mer' },
  // Les 12 territoires d'outre-mer de la page 20 (noms du livret).
  guadeloupe: { nom: 'Guadeloupe', ll: [-61.55, 16.25], type: 'outre-mer' },
  martinique: { nom: 'Martinique', ll: [-61.02, 14.64], type: 'outre-mer' },
  'saint-martin': { nom: 'Saint-Martin', ll: [-63.05, 18.07], type: 'outre-mer' },
  'saint-barthelemy': { nom: 'Saint-Barthélemy', ll: [-62.83, 17.9], type: 'outre-mer' },
  'nouvelle-caledonie': { nom: 'Nouvelle-Calédonie', ll: [165.6, -21.3], type: 'outre-mer' },
  polynesie: { nom: 'Polynésie française', ll: [-149.4, -17.6], type: 'outre-mer' },
  'saint-pierre-et-miquelon': { nom: 'Saint-Pierre-et-Miquelon', ll: [-56.3, 46.9], type: 'outre-mer' },
  taaf: { nom: 'Terres australes et antarctiques françaises', ll: [69.3, -49.3], type: 'outre-mer' },
  'wallis-et-futuna': { nom: 'Wallis-et-Futuna', ll: [-176.2, -13.3], type: 'outre-mer' },
  'afrique-ouest': { nom: "Afrique de l'Ouest", ll: [-4, 12.5], type: 'région' },
  'afrique-equatoriale': { nom: 'Afrique équatoriale', ll: [17, 1], type: 'région' },
  algerie: { nom: 'Algérie', ll: [2.8, 28.2], type: 'pays' },
  maroc: { nom: 'Maroc', ll: [-6.4, 31.8], type: 'pays' },
  tunisie: { nom: 'Tunisie', ll: [9.6, 34.2], type: 'pays' },
  madagascar: { nom: 'Madagascar', ll: [46.8, -19.2], type: 'pays' },
  indochine: { nom: 'Indochine', ll: [105.5, 15.5], type: 'région' },
  'france-monde': { nom: 'France', ll: [2.4, 46.6], type: 'pays' },
  'etats-unis': { nom: 'États-Unis', ll: [-99, 39], type: 'pays' },
}

// Les cinq fleuves cités page 51 (tracé du cours, de la source à l'embouchure).
export const FLEUVES = [
  {
    id: 'loire', nom: 'La Loire', couleur: '#38bdf8', étiquette: [0.9, 47.62],
    info: 'Plus long fleuve français, connu notamment pour ses paysages naturels et ses châteaux.',
    villes: [], p: 51,
    cours: [[4.22, 44.84], [3.88, 45.1], [4.1, 45.7], [4.07, 46.04], [3.7, 46.55], [3.16, 46.99], [2.95, 47.42], [2.5, 47.68], [1.9, 47.9], [1.33, 47.59], [0.69, 47.39], [0.08, 47.25], [-0.55, 47.38], [-1.1, 47.33], [-1.55, 47.21], [-2.15, 47.27]],
  },
  {
    id: 'seine', nom: 'La Seine', couleur: '#60a5fa', étiquette: [1.45, 49.32],
    info: 'Elle traverse Paris, capitale de la France.',
    villes: ['paris'], p: 51,
    cours: [[4.72, 47.48], [4.58, 47.85], [4.08, 48.3], [3.5, 48.48], [2.95, 48.38], [2.66, 48.54], [2.4, 48.78], [2.35, 48.86], [2.2, 48.9], [1.72, 48.99], [1.4, 49.1], [1.1, 49.44], [0.75, 49.4], [0.25, 49.46]],
  },
  {
    id: 'garonne', nom: 'La Garonne', couleur: '#22d3ee', étiquette: [0.2, 44.3],
    info: "Elle traverse Toulouse (chef-lieu de l'Occitanie) et Bordeaux (chef-lieu de la Nouvelle-Aquitaine).",
    villes: ['toulouse', 'bordeaux'], p: 51,
    cours: [[0.75, 42.75], [0.72, 43.1], [1.1, 43.25], [1.44, 43.6], [1.1, 44.05], [0.62, 44.2], [0.15, 44.4], [-0.3, 44.62], [-0.57, 44.84], [-0.75, 45.15], [-1.05, 45.58]],
  },
  {
    id: 'rhone', nom: 'Le Rhône', couleur: '#818cf8', étiquette: [5.25, 44.6],
    info: 'Il traverse Lyon (chef-lieu de la région Auvergne-Rhône-Alpes).',
    villes: ['lyon'], p: 51,
    cours: [[8.38, 46.57], [7.6, 46.3], [6.9, 46.4], [6.6, 46.45], [6.15, 46.2], [5.8, 46.1], [5.6, 45.85], [5.05, 45.8], [4.84, 45.76], [4.82, 45.3], [4.89, 44.93], [4.7, 44.4], [4.81, 43.95], [4.63, 43.68], [4.8, 43.4]],
  },
  {
    id: 'rhin', nom: 'Le Rhin', couleur: '#a78bfa', étiquette: [8.15, 48.15],
    info: "Il délimite partiellement la frontière entre la France et l'Allemagne.",
    villes: ['strasbourg'], p: 51,
    cours: [[8.7, 46.62], [9.5, 47.2], [9.4, 47.6], [8.6, 47.65], [7.59, 47.56], [7.55, 47.9], [7.7, 48.4], [7.8, 48.58], [8.2, 48.97], [8.45, 49.5], [8.27, 50.0], [7.6, 50.35], [7.0, 50.95], [6.7, 51.4], [6.1, 51.85], [5.0, 51.9], [4.1, 51.95]],
  },
]

// Montagnes (page 51).
export const MASSIFS = [
  { id: 'alpes', nom: 'Les Alpes', ll: [6.75, 44.55], info: "Elles séparent notamment la France de l'Italie et sont réputées pour leurs stations de ski. Le Mont-Blanc (4 810 m) est la plus haute montagne de France et d'Europe.", p: 51 },
  { id: 'pyrenees', nom: 'Les Pyrénées', ll: [0.4, 42.82], info: "Elles se situent entre la France et l'Espagne.", p: 51 },
  { id: 'massif-central', nom: 'Le Massif central', ll: [2.9, 45.35], info: "Avec le Jura et les Vosges, l'un des autres massifs cités par le livret.", p: 51 },
  { id: 'jura', nom: 'Le Jura', ll: [5.95, 46.75], info: "Avec le Massif central et les Vosges, l'un des autres massifs cités par le livret.", p: 51 },
  { id: 'vosges', nom: 'Les Vosges', ll: [6.95, 48.1], info: "Avec le Massif central et le Jura, l'un des autres massifs cités par le livret.", p: 51 },
]

// Mers et océan (page 49).
export const MERS = [
  { id: 'manche', nom: 'La Manche', ll: [-2.3, 50.05], info: "Entre la France et l'Angleterre.", p: 49 },
  { id: 'mer-du-nord', nom: 'La mer du Nord', ll: [2.7, 51.6], info: 'Au nord.', p: 49 },
  { id: 'atlantique', nom: "L'océan Atlantique", ll: [-4.6, 45.6], info: "À l'ouest.", p: 49 },
  { id: 'mediterranee', nom: 'La mer Méditerranée', ll: [5.4, 42.35], info: 'Au sud.', p: 49 },
]

// Les 8 pays qui partagent une frontière terrestre avec la France métropolitaine (page 49).
export const VOISINS = [
  { nom: 'Allemagne', en: 'Germany', ll: [8.9, 49.9] },
  { nom: 'Andorre', en: 'Andorra', ll: [1.55, 42.55] },
  { nom: 'Belgique', en: 'Belgium', ll: [4.7, 50.55] },
  { nom: 'Espagne', en: 'Spain', ll: [-2.6, 42.05] },
  { nom: 'Italie', en: 'Italy', ll: [8.6, 44.65] },
  { nom: 'Luxembourg', en: 'Luxembourg', ll: [6.1, 49.78] },
  { nom: 'Monaco', en: 'Monaco', ll: [7.42, 43.74] },
  { nom: 'Suisse', en: 'Switzerland', ll: [7.9, 46.85] },
]

// Les plus grandes villes au 1er janvier 2025 (page 49) et les plus grands ports (page 50).
export const GRANDES_VILLES = ['paris', 'lyon', 'lille', 'marseille', 'toulouse', 'bordeaux', 'nantes', 'nice', 'strasbourg']
export const PORTS = ['le-havre', 'fos', 'dunkerque', 'saint-nazaire']
