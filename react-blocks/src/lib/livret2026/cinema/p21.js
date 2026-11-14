// Expérience narrative cinématographique — PROTOTYPE, page 21 uniquement.
// « Le jeu de la grande carte » : la carte administrative de la France
// (légende, 13 régions de métropole et leur préfecture, départements avec leur
// numéro et leur préfecture, territoires d'outre-mer et leur numéro).
//
// Règle de fidélité : la page 21 est une carte. Les cartes « officiel »
// reprennent ses étiquettes (noms des régions tels qu'écrits sur la carte, en
// minuscules ; ■ préfecture de région, • préfecture de département) et sa
// légende mot pour mot. Contours : IGN Admin Express (Licence ouverte).
// Personnages et dialogues sont fictifs.
import { VOIX_P21 } from './voixP21.js'
import { PERSONNAGES as P8 } from './p8.js'
import { RÉGIONS_ADMIN } from './regionsAdmin.js'
import { TOUR_RÉGIONS } from './etiquettesRegions.js'

const p21 = 'Livret du citoyen, page 21 (carte administrative)'

export const PERSONNAGES = P8

const TOUR = TOUR_RÉGIONS

const scèneRégion = ([code, étiquette, oral], k) => {
  const r = RÉGIONS_ADMIN.find(x => x.code === code)
  const qui = k % 2 ? 'lina' : 'zoe'
  return {
    id: `r-${code}`, titre: étiquette, décor: `admin-${code}`, visuel: `region-21-${code}`, ambiance: 'souffle', musique: k % 3 === 2 ? 'élévation' : 'chaleureux', transition: k % 2 ? 'fondu' : 'volet', focus: 'fond',
    temps: [
      { qui, texte: `${oral} !`, émotion: 'joie', son: 'bloc' },
      { qui: qui === 'zoe' ? 'lina' : 'arnaud', texte: `Sa préfecture de région : ${r.préfecture}.`, émotion: 'sourire', étape: 1 },
      { officiel: { texte: `${étiquette} ■ ${r.préfecture}\n${r.départements.map(([n, nom, préf]) => `${nom} ${n} • ${préf}`).join(' · ')}`, source: p21 }, étape: 2 },
    ],
  }
}

export const COURT_MÉTRAGE = {
  page: 21,
  titre: 'Le jeu de la grande carte',
  sousTitre: 'La carte administrative de la France',
  avertissement: 'Personnages et situations fictifs. Les cartes « 📜 Livret » reprennent les étiquettes et la légende de la carte officielle.',
  voix: VOIX_P21,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'mediatheque', ambiance: 'salle', musique: 'chaleureux', transition: 'fondu', particules: 'poussiere',
      caméra: { de: { x: -3, z: 1.16 }, à: { x: 2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Mercredi, à la médiathèque, une grande carte de France est accrochée au mur.' },
        { qui: 'narrateur', texte: 'Zoé lance un jeu : retrouver chaque région, sa préfecture et ses départements.', son: 'page' },
      ],
    },
    {
      id: 'legende', titre: 'La légende', décor: 'admin-france', visuel: 'legende-21', ambiance: 'souffle', musique: 'élévation', transition: 'lumiere', focus: 'fond',
      temps: [
        { qui: 'arnaud', texte: 'Voici la carte administrative de la France.', émotion: 'sourire', étape: 1 },
        { qui: 'arnaud', texte: 'Un carré marque une préfecture de région. Un point, une préfecture de département. Et chaque département a son numéro.', émotion: 'neutre', étape: 2 },
        { officiel: { texte: 'Carte administrative de la France :\n■ Préfecture de région\n• Préfecture de département', source: p21 }, étape: 2 },
        { qui: 'zoe', texte: 'En métropole, je compte 13 régions. On commence le tour !', émotion: 'joie', étape: 3 },
      ],
    },
    ...TOUR.map(scèneRégion),
    {
      id: 'outremer-drom', titre: 'L\'outre-mer : 971 à 976', décor: 'outremer-codes-drom', visuel: 'outremer-21-drom', ambiance: 'souffle', musique: 'chaleureux', transition: 'lumiere', focus: 'fond',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'lina', texte: 'Et l\'outre-mer, sur la carte ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Chaque territoire a son encadré et son numéro.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Guadeloupe 971 ■ Basse-Terre · Martinique 972 ■ Fort-de-France · Guyane 973 ■ Cayenne · La Réunion 974 ■ Saint-Denis · Mayotte 976 ■ Mamoudzou', source: p21 }, étape: 2 },
      ],
    },
    {
      id: 'outremer-com', titre: 'L\'outre-mer : 975 à 988', décor: 'outremer-codes-com', visuel: 'outremer-21-com', ambiance: 'souffle', musique: 'réflexion', transition: 'fondu', focus: 'fond',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      temps: [
        { officiel: { texte: 'Saint-Pierre et Miquelon 975 · Saint-Barthélemy 977 · Saint-Martin 978 · Terres Australes et Antarctiques Françaises (984) · Wallis-et-Futuna 986 · Polynésie française 987 · Nouvelle-Calédonie 988', source: p21 }, étape: 1 },
        { qui: 'zoe', texte: 'Ces encadrés-là ne sont pas colorés !', émotion: 'surprise', étape: 1 },
        { qui: 'arnaud', texte: 'Sur la carte, les départements non colorés, hors Île-de-France, sont les collectivités d\'outre-mer à statut particulier.', émotion: 'neutre', étape: 2 },
        { officiel: { texte: 'Les départements non colorés ci-dessus (hors Île-De-France) sont les collectivités d\'outre-mer à statut particulier.', source: p21 }, étape: 2 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'mediatheque-nuit', visuel: 'recap-21', ambiance: 'salle', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,196,120,.7)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 16, regard: 'droite', échelle: 0.8 }, { id: 'zoe', x: 46, regard: 'droite', échelle: 0.66 }, { id: 'lina', x: 80, regard: 'gauche', échelle: 0.86 }],
      temps: [
        { qui: 'zoe', texte: '13 régions, et toutes leurs préfectures : j\'ai gagné !', émotion: 'fier', étape: 1 },
        { qui: 'lina', texte: 'Et l\'outre-mer, de 971 à 988.', émotion: 'sourire', étape: 1 },
        { qui: 'arnaud', texte: 'Bravo à toutes les deux.', émotion: 'fier', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : l\'Union européenne et ses institutions, page 22.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Sur la carte administrative, que marque un carré ?', r: 'Une préfecture de région', f: ['Une préfecture de département', 'Une commune de plus de 1 000 habitants'], scène: 'legende' },
    { q: 'Combien de régions la carte montre-t-elle en France métropolitaine ?', r: '13', f: ['18', '101'], scène: 'legende' },
    { q: 'Quelle est la préfecture de la région Bretagne ?', r: 'Rennes', f: ['Quimper', 'Nantes'], scène: 'r-53' },
    { q: 'Quelle est la préfecture de la région Provence-Alpes-Côte d\'Azur ?', r: 'Marseille', f: ['Nice', 'Toulon'], scène: 'r-93' },
    { q: 'Quelle est la préfecture de la région Grand Est ?', r: 'Strasbourg', f: ['Metz', 'Nancy'], scène: 'r-44' },
    { q: 'Quelle est la préfecture de la région Occitanie ?', r: 'Toulouse', f: ['Montpellier', 'Perpignan'], scène: 'r-76' },
    { q: 'Quelle est la préfecture de la région Corse ?', r: 'Ajaccio', f: ['Bastia', 'Nice'], scène: 'r-94' },
    { q: 'Quelle est la préfecture de la région Normandie ?', r: 'Rouen', f: ['Caen', 'Évreux'], scène: 'r-28' },
    { q: 'Quelle est la préfecture de la région Hauts-de-France ?', r: 'Lille', f: ['Amiens', 'Arras'], scène: 'r-32' },
    { q: 'Quel numéro porte le département de Paris ?', r: '75', f: ['13', '69'], scène: 'r-11' },
    { q: 'Quel numéro porte La Réunion sur la carte ?', r: '974', f: ['971', '976'], scène: 'outremer-drom' },
    { q: 'Sur la carte, les départements non colorés (hors Île-de-France) sont…', r: 'les collectivités d\'outre-mer à statut particulier', f: ['les régions de métropole', 'les départements les plus peuplés'], scène: 'outremer-com', o: 1 },
  ],
}

// Contrôle de fidélité : chaque élément de la carte et la scène qui le montre.
export const COUVERTURE = [
  ['Légende : préfecture de région, préfecture de département', 'legende'],
  ...TOUR.map(([c, é]) => [`${é} : préfecture de région et départements`, `r-${c}`]),
  ['Outre-mer : 971, 972, 973, 974, 976 et leur préfecture', 'outremer-drom'],
  ['Outre-mer : 975, 977, 978, 984, 986, 987, 988 ; départements non colorés', 'outremer-com'],
]
