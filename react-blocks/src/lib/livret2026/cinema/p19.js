// Expérience narrative cinématographique — PROTOTYPE, page 19 uniquement.
// « Du village à la région » : II. Organisation territoriale de la République
// (décentralisation, collectivités territoriales, préfets), A. les communes,
// B. les départements, C. les régions.
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 19, phrase par phrase. Personnages, lieux et dialogues sont
// fictifs ; ils n'énoncent que ce que dit la page (le collège et le lycée sont
// des illustrations, sans nom réel).
import { VOIX_P19 } from './voixP19.js'
import { PERSONNAGES as P11 } from './p11.js'

const p19 = 'Livret du citoyen, page 19'

export const PERSONNAGES = P11

export const COURT_MÉTRAGE = {
  page: 19,
  titre: 'Du village à la région',
  sousTitre: 'Communes, départements, régions',
  avertissement: 'Personnages et situations fictifs ; le collège et le lycée sont des illustrations. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P19,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'place-mairie', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', particules: 'feuilles',
      caméra: { de: { x: 3, z: 1.16 }, à: { x: -2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Lundi matin, devant l\'hôtel de ville.' },
        { qui: 'narrateur', texte: 'Lina vient déposer un document. M. Arnaud l\'accompagne.', son: 'pas' },
      ],
    },
    {
      id: 'carton-ii', titre: 'II. Organisation territoriale', décor: 'carton', visuel: 'carton', carton: { lettre: 'II', titre: 'Organisation territoriale de la République', sous: 'Partie 2 · Système institutionnel et politique' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Deuxième chapitre : l\'organisation territoriale de la République.', son: 'whoosh' }],
    },
    {
      id: 'decentralisation', titre: 'La décentralisation', décor: 'place-mairie', visuel: 'decentralisation', ambiance: 'rue', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'C\'est la mairie qui décide de tout ici ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'En France, dans le cadre de la décentralisation, l\'État transfère des compétences et des moyens à d\'autres autorités.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { qui: 'lina', texte: 'Quelles autorités ?', émotion: 'réflexion', étape: 1 },
        { qui: 'arnaud', texte: 'On les appelle les collectivités territoriales. Il en existe plusieurs niveaux : les communes, les départements, les régions et les collectivités d\'outre-mer.', émotion: 'sourire', étape: 2, son: 'bloc' },
        { officiel: { texte: 'En France, dans le cadre de la décentralisation, l\'État transfère des compétences et des moyens à d\'autres autorités, appelées collectivités territoriales. Il en existe plusieurs niveaux : les communes, les départements, les régions et les collectivités d\'outre-mer.', source: p19 }, étape: 2 },
      ],
    },
    {
      id: 'prefets', titre: 'Les préfets', décor: 'place-mairie', visuel: 'prefets', ambiance: 'rue', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Et l\'État, il est encore présent dans ces territoires ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Oui : il y est représenté par les préfets de région et de département.', émotion: 'sourire', étape: 1 },
        { qui: 'arnaud', texte: 'Ou, dans certaines collectivités d\'outre-mer, par les hauts commissaires.', émotion: 'neutre', étape: 2 },
        { officiel: { texte: 'Dans ces territoires, l\'État est représenté par les préfets de région et de département (ou par les hauts commissaires dans certaines collectivités d\'outre-mer).', source: p19 }, étape: 2 },
      ],
    },
    {
      id: 'carton-a', titre: 'A. Les communes', décor: 'carton', visuel: 'carton', carton: { lettre: 'A', titre: 'Les communes', sous: 'Organisation territoriale de la République' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Premier niveau : les communes.', son: 'whoosh' }],
    },
    {
      id: 'communes', titre: 'Le maire et le conseil municipal', décor: 'guichet-mairie', visuel: 'communes-19', ambiance: 'salle', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'agente', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'À l\'accueil, Mme Roux les reçoit.', son: 'carillon' },
        { qui: 'agente', texte: 'La France compte 34 875 communes au 1er janvier 2025.', émotion: 'sourire', étape: 1, son: 'bloc' },
        { officiel: { texte: 'La France compte 34 875 communes au 1er janvier 2025.', source: p19 }, étape: 1 },
        { qui: 'lina', texte: 'Et qui gère une commune ?', émotion: 'réflexion', étape: 1 },
        { qui: 'agente', texte: 'Un maire et un conseil municipal, élu pour six ans.', émotion: 'neutre', étape: 2 },
        { qui: 'agente', texte: 'Aux élections municipales, les citoyens français et les ressortissants de l\'Union européenne peuvent voter, et se présenter comme candidats.', étape: 3 },
        { officiel: { texte: 'Chaque commune est gérée par un maire et un conseil municipal élu pour six ans. Les élections municipales permettent aux citoyens français et aux ressortissants de l\'Union européenne de voter et de se présenter comme candidats.', source: p19 }, étape: 3 },
      ],
    },
    {
      id: 'missions-communes', titre: 'Les missions des communes', décor: 'guichet-mairie', visuel: 'missions-communes', ambiance: 'salle', musique: 'chaleureux', transition: 'fondu', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'agente', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'agente', texte: 'Les communes sont responsables notamment des écoles primaires publiques, maternelles et élémentaires.', émotion: 'sourire', étape: 1 },
        { qui: 'agente', texte: 'Mais aussi des activités sportives et culturelles, et de l\'entretien des routes communales.', étape: 2 },
        { qui: 'lina', texte: 'Et ce guichet, « état civil » ?', émotion: 'réflexion', étape: 2 },
        { qui: 'agente', texte: 'Les communes tiennent les registres de l\'état civil : elles enregistrent les naissances, les mariages, les décès.', émotion: 'neutre', geste: 'explique', étape: 3, son: 'page' },
        { officiel: { texte: 'Les communes sont responsables notamment des écoles primaires publiques (maternelles et élémentaires), des activités sportives et culturelles, de l\'entretien des routes communales. Elles tiennent les registres de l\'état civil, c\'est-à-dire qu\'elles enregistrent les naissances, les mariages, les décès.', source: p19 }, étape: 3 },
      ],
    },
    {
      id: 'intercommunalites', titre: 'Les intercommunalités', décor: 'place-mairie', visuel: 'intercommunalites', ambiance: 'rue', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -3, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'Enfin, les communes sont regroupées en intercommunalités : des communautés de communes, des métropoles…', émotion: 'neutre', geste: 'montre', étape: 1 },
        { qui: 'arnaud', texte: 'Elles gèrent des services publics : l\'eau, l\'assainissement, les déchets, les transports urbains…', émotion: 'sourire', étape: 2, son: 'goutte' },
        { officiel: { texte: 'Enfin, les communes sont regroupées en intercommunalités (communautés de communes, métropoles…), qui gèrent des services publics : eau, assainissement, déchets, transports urbains…', source: p19 }, étape: 2 },
      ],
    },
    {
      id: 'carton-b', titre: 'B. Les départements', décor: 'carton', visuel: 'carton', carton: { lettre: 'B', titre: 'Les départements', sous: 'Organisation territoriale de la République' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Deuxième niveau : les départements.', son: 'whoosh' }],
    },
    {
      id: 'departements', titre: 'Le conseil départemental', décor: 'college', visuel: 'missions-departements', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: 2, z: 1.1 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Sur le chemin du retour, ils passent devant un collège.', son: 'pas' },
        { qui: 'arnaud', texte: 'Les départements sont administrés par les conseils départementaux.', émotion: 'neutre', étape: 1 },
        { qui: 'arnaud', texte: 'Ils sont notamment responsables des collèges publics, de l\'action sociale, de l\'entretien des routes départementales…', émotion: 'sourire', geste: 'montre', étape: 2 },
        { qui: 'arnaud', texte: '… de la protection de l\'enfance, et de l\'aide aux personnes âgées.', émotion: 'tendre', étape: 3 },
        { officiel: { texte: 'Ils sont administrés par les conseils départementaux. Ils sont notamment responsables des collèges publics, de l\'action sociale, de l\'entretien des routes départementales, de la protection de l\'enfance et de l\'aide aux personnes âgées.', source: p19 }, étape: 3 },
      ],
    },
    {
      id: 'cent-un', titre: '101 départements', décor: 'college', visuel: 'departements-101', ambiance: 'rue', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Combien y a-t-il de départements ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: '101 : 96 en métropole et 5 en outre-mer.', émotion: 'sourire', étape: 1, son: 'bloc' },
        { qui: 'arnaud', texte: 'Le plus récent est Mayotte, créé en 2011.', émotion: 'neutre', étape: 2 },
        { officiel: { texte: 'La France compte 101 départements, dont 96 en métropole et 5 en outre-mer. Le département le plus récent est Mayotte, créé en 2011.', source: p19 }, étape: 2 },
      ],
    },
    {
      id: 'carton-c', titre: 'C. Les régions', décor: 'carton', visuel: 'carton', carton: { lettre: 'C', titre: 'Les régions', sous: 'Organisation territoriale de la République' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Troisième niveau : les régions.', son: 'whoosh' }],
    },
    {
      id: 'regions', titre: '18 régions', décor: 'lycee', visuel: 'regions-18', ambiance: 'rue', musique: 'élévation', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Plus loin, un bus s\'arrête devant un lycée.', son: 'voiture' },
        { qui: 'arnaud', texte: 'La France compte 13 régions métropolitaines, administrées par les conseils régionaux, et 5 régions en outre-mer.', émotion: 'neutre', étape: 1 },
        { qui: 'lina', texte: 'Soit 18 régions en tout.', émotion: 'fier', étape: 2, son: 'bloc' },
        { officiel: { texte: 'La France compte 13 régions métropolitaines administrées par les conseils régionaux et 5 régions en outre-mer, soit 18 régions en tout.', source: p19 }, étape: 2 },
      ],
    },
    {
      id: 'missions-regions', titre: 'Les missions des régions', décor: 'lycee', visuel: 'missions-regions', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'Les régions sont chargées notamment des transports publics, du développement économique, de la formation professionnelle…', émotion: 'sourire', geste: 'montre', étape: 1 },
        { qui: 'arnaud', texte: '… et de la construction et de l\'entretien des lycées publics.', émotion: 'neutre', étape: 2 },
        { officiel: { texte: 'Elles sont chargées notamment des transports publics, du développement économique, de la formation professionnelle et de la construction et l\'entretien des lycées publics.', source: p19 }, étape: 2 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'place-mairie-soir', visuel: 'recap-19', ambiance: 'soir', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,200,150,.65)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'L\'école primaire pour la commune, le collège pour le département, le lycée pour la région.', émotion: 'joie', étape: 1 },
        { qui: 'arnaud', texte: 'Exactement. Et chaque niveau a ses autres missions.', émotion: 'fier', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : l\'outre-mer, page 20.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Dans le cadre de la décentralisation, que fait l\'État ?', r: 'Il transfère des compétences et des moyens aux collectivités territoriales', f: ['Il supprime les communes', 'Il gouverne seul chaque commune'], scène: 'decentralisation' },
    { q: 'Quels sont les niveaux de collectivités territoriales ?', r: 'Les communes, les départements, les régions et les collectivités d\'outre-mer', f: ['Le Parlement, le Sénat et le Gouvernement', 'Les écoles, les collèges et les lycées'], scène: 'decentralisation' },
    { q: 'Qui représente l\'État dans les territoires ?', r: 'Les préfets de région et de département (ou les hauts commissaires dans certaines collectivités d\'outre-mer)', f: ['Les maires', 'Les conseillers régionaux'], scène: 'prefets' },
    { q: 'Combien la France compte-t-elle de communes au 1er janvier 2025 ?', r: '34 875', f: ['101', '3 487'], scène: 'communes' },
    { q: 'Qui gère une commune ?', r: 'Un maire et un conseil municipal élu pour six ans', f: ['Un préfet nommé pour cinq ans', 'Le conseil régional'], scène: 'communes', o: 1 },
    { q: 'Qui peut voter et se présenter aux élections municipales ?', r: 'Les citoyens français et les ressortissants de l\'Union européenne', f: ['Seulement les citoyens français', 'Tous les habitants, de toute nationalité'], scène: 'communes', o: 1 },
    { q: 'Que fait la commune avec les registres de l\'état civil ?', r: 'Elle enregistre les naissances, les mariages, les décès', f: ['Elle enregistre les lois', 'Elle enregistre les votes du Parlement'], scène: 'missions-communes' },
    { q: 'Qui est responsable des écoles primaires publiques ?', r: 'Les communes', f: ['Les départements', 'Les régions'], scène: 'missions-communes' },
    { q: 'Que gèrent les intercommunalités ?', r: 'Des services publics : eau, assainissement, déchets, transports urbains…', f: ['Les collèges et les lycées', 'L\'élection du Président'], scène: 'intercommunalites' },
    { q: 'Qui est responsable des collèges publics ?', r: 'Les départements', f: ['Les communes', 'Les régions'], scène: 'departements' },
    { q: 'Combien la France compte-t-elle de départements ?', r: '101, dont 96 en métropole et 5 en outre-mer', f: ['13, dont 5 en outre-mer', '96, tous en métropole'], scène: 'cent-un' },
    { q: 'Quel est le département le plus récent ?', r: 'Mayotte, créé en 2011', f: ['La Réunion, créée en 2011', 'La Guyane, créée en 1958'], scène: 'cent-un' },
    { q: 'Combien la France compte-t-elle de régions ?', r: '18 : 13 en métropole et 5 en outre-mer', f: ['101 : 96 en métropole et 5 en outre-mer', '13, toutes en métropole'], scène: 'regions' },
    { q: 'Qui est chargé de la construction et de l\'entretien des lycées publics ?', r: 'Les régions', f: ['Les communes', 'Les départements'], scène: 'missions-regions' },
  ],
}

// Contrôle de fidélité : chaque notion de la page 19 et la scène qui la montre.
export const COUVERTURE = [
  ['Décentralisation : collectivités territoriales, leurs niveaux', 'decentralisation'],
  ['Préfets de région et de département ; hauts commissaires', 'prefets'],
  ['34 875 communes ; maire et conseil municipal élu pour six ans ; élections municipales', 'communes'],
  ['Missions des communes ; état civil', 'missions-communes'],
  ['Intercommunalités et services publics', 'intercommunalites'],
  ['Conseils départementaux et missions des départements', 'departements'],
  ['101 départements (96 + 5) ; Mayotte, 2011', 'cent-un'],
  ['13 + 5 = 18 régions ; conseils régionaux', 'regions'],
  ['Missions des régions', 'missions-regions'],
]
