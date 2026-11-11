// Expérience narrative cinématographique — PROTOTYPE, page 20 uniquement.
// « Un tour du monde en outre-mer » : D. L'outre-mer (12 territoires, 5 à la
// fois départements et régions, 7 collectivités d'outre-mer à statut
// particulier, les Antilles françaises).
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 20 ; dans les deux listes, les puces sont remplacées par des
// virgules. Les cartes géographiques montrent les frontières actuelles, pour
// se repérer. Personnages et dialogues sont fictifs.
import { VOIX_P20 } from './voixP20.js'
import { PERSONNAGES as P10 } from './p10.js'

const p20 = 'Livret du citoyen, page 20'

export const PERSONNAGES = P10

export const COURT_MÉTRAGE = {
  page: 20,
  titre: 'Un tour du monde en outre-mer',
  sousTitre: 'Les 12 territoires d\'outre-mer',
  avertissement: 'Personnages et situations fictifs ; cartes aux frontières actuelles, pour se repérer. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P20,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'visio', ambiance: 'visio', musique: 'chaleureux', transition: 'fondu',
      caméra: { de: { x: 0, z: 1.1 }, à: { x: 0, z: 1.0 } }, titreFilm: true,
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'narrateur', texte: 'Dimanche soir, Lina appelle son amie Inès, à La Réunion.', son: 'appel' },
        { qui: 'ines', texte: 'Tu es à la page 20 ? C\'est ma page : l\'outre-mer !', émotion: 'joie' },
        { qui: 'lina', texte: 'Oui ! Tu me fais faire le tour ?', émotion: 'sourire' },
      ],
    },
    {
      id: 'carton-d', titre: 'D. L\'outre-mer', décor: 'carton', visuel: 'carton', carton: { lettre: 'D', titre: 'L\'outre-mer', sous: 'Organisation territoriale de la République' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Dernière partie du chapitre : l\'outre-mer.', son: 'whoosh' }],
    },
    {
      id: 'douze', titre: '12 territoires', décor: 'outremer-monde', visuel: 'douze-territoires', ambiance: 'souffle', musique: 'élévation', transition: 'lumiere', focus: 'fond',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'lina', texte: 'Combien y a-t-il de territoires d\'outre-mer ?', émotion: 'réflexion' },
        { qui: 'ines', texte: 'La France en compte 12, situés en dehors de la France métropolitaine.', émotion: 'sourire', étape: 1, son: 'bloc' },
        { officiel: { texte: 'La France compte 12 territoires d\'outre-mer (situés en dehors de la France métropolitaine).', source: p20 }, étape: 1 },
      ],
    },
    {
      id: 'drom', titre: 'Départements et régions', décor: 'outremer-drom', visuel: 'cinq-drom', ambiance: 'souffle', musique: 'chaleureux', transition: 'fondu', focus: 'fond',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'ines', texte: 'Cinq sont à la fois des départements et des régions.', émotion: 'neutre', étape: 1 },
        { qui: 'ines', texte: 'La Guadeloupe, la Martinique, Mayotte, la Guyane… et La Réunion, chez moi !', émotion: 'joie', étape: 2, son: 'carillon' },
        { officiel: { texte: '5 sont à la fois des départements et des régions : Guadeloupe, Martinique, Mayotte, Guyane, La Réunion', source: p20 }, étape: 2 },
      ],
    },
    {
      id: 'souvenir', titre: 'Un souvenir de la page 19', décor: 'visio', ambiance: 'visio', musique: 'chaleureux', transition: 'volet',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'ines', texte: 'Tu te souviens de la page 19 ?', émotion: 'sourire' },
        { qui: 'lina', texte: 'Oui : 5 départements et 5 régions en outre-mer. Ce sont ces cinq territoires !', émotion: 'fier' },
        { qui: 'ines', texte: 'Bravo !', émotion: 'joie', son: 'carillon' },
      ],
    },
    {
      id: 'com', titre: 'Les collectivités à statut particulier', décor: 'outremer-com', visuel: 'sept-com', ambiance: 'souffle', musique: 'réflexion', transition: 'lumiere', focus: 'fond',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'lina', texte: 'Et les sept autres territoires ?', émotion: 'réflexion' },
        { qui: 'ines', texte: 'Ce sont des collectivités d\'outre-mer à statut particulier.', émotion: 'neutre', étape: 1 },
        { qui: 'ines', texte: 'La Nouvelle-Calédonie, la Polynésie française, Saint-Martin, Saint-Barthélemy, Saint-Pierre-et-Miquelon, les Terres australes et antarctiques françaises, et Wallis-et-Futuna.', émotion: 'sourire', étape: 2 },
        { officiel: { texte: '7 sont des collectivités d\'outre-mer à statut particulier : Nouvelle-Calédonie, Polynésie française, Saint-Martin, Saint-Barthélemy, Saint-Pierre-et-Miquelon, Terres australes et antarctiques françaises, Wallis-et-Futuna', source: p20 }, étape: 2 },
      ],
    },
    {
      id: 'antilles', titre: 'Les Antilles françaises', décor: 'antilles', visuel: 'antilles-fr', ambiance: 'souffle', musique: 'tendre', transition: 'fondu', focus: 'fond',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'lina', texte: 'Et les Antilles françaises, alors ?', émotion: 'réflexion' },
        { qui: 'ines', texte: 'Ce sont des îles : la Martinique, la Guadeloupe, Saint-Martin et Saint-Barthélemy.', émotion: 'sourire', étape: 1, son: 'goutte' },
        { officiel: { texte: 'La Martinique, La Guadeloupe, Saint-Martin et Saint-Barthélemy sont des îles qui constituent les Antilles françaises.', source: `${p20} (encadré)` }, étape: 1 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'visio', visuel: 'recap-20', ambiance: 'visio', musique: 'final', transition: 'fondu', particules: 'poussiere',
      caméra: { de: { x: 0, z: 1.1 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'lina', texte: '12 territoires : 5 départements et régions, et 7 collectivités à statut particulier.', émotion: 'fier', étape: 1 },
        { qui: 'ines', texte: 'Parfait ! La prochaine fois, je te montre La Réunion pour de vrai.', émotion: 'joie', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : la carte administrative, page 21.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Combien la France compte-t-elle de territoires d\'outre-mer ?', r: '12', f: ['5', '18'], scène: 'douze' },
    { q: 'Où sont situés les territoires d\'outre-mer ?', r: 'En dehors de la France métropolitaine', f: ['En Corse', 'Dans les Alpes'], scène: 'douze' },
    { q: 'Combien de territoires d\'outre-mer sont à la fois des départements et des régions ?', r: '5', f: ['7', '12'], scène: 'drom' },
    { q: 'Lequel est à la fois un département et une région ?', r: 'La Réunion', f: ['La Nouvelle-Calédonie', 'Saint-Pierre-et-Miquelon'], scène: 'drom' },
    { q: 'Mayotte est…', r: 'à la fois un département et une région', f: ['une collectivité d\'outre-mer à statut particulier', 'une île des Antilles françaises'], scène: 'drom' },
    { q: 'Combien de territoires sont des collectivités d\'outre-mer à statut particulier ?', r: '7', f: ['5', '3'], scène: 'com' },
    { q: 'Laquelle est une collectivité d\'outre-mer à statut particulier ?', r: 'La Polynésie française', f: ['La Guyane', 'La Martinique'], scène: 'com' },
    { q: 'Quelles îles constituent les Antilles françaises ?', r: 'La Martinique, la Guadeloupe, Saint-Martin et Saint-Barthélemy', f: ['La Réunion et Mayotte', 'La Nouvelle-Calédonie et Wallis-et-Futuna'], scène: 'antilles' },
  ],
}

// Contrôle de fidélité : chaque notion de la page 20 et la scène qui la montre.
export const COUVERTURE = [
  ['12 territoires d\'outre-mer, situés en dehors de la France métropolitaine', 'douze'],
  ['5 sont à la fois des départements et des régions', 'drom'],
  ['7 sont des collectivités d\'outre-mer à statut particulier', 'com'],
  ['Encadré : les Antilles françaises', 'antilles'],
]
