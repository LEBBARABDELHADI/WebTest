// Expérience narrative cinématographique — PROTOTYPE, page 15 uniquement.
// « La carte du voyage » : le sommaire de la partie 2, Système institutionnel
// et politique (I. Démocratie et État de droit, II. Organisation territoriale
// de la République, III. L'Union européenne et ses institutions).
//
// Règle de fidélité : la page 15 est un sommaire. Les cartes « officiel »
// reprennent ses intitulés et ses numéros de page mot pour mot (les points de
// conduite sont remplacés par « – page N », les capitales par des minuscules).
// Le film n'explique pas le contenu des chapitres : il le présente, comme la page.
// Personnages, lieux et dialogues sont fictifs.
import { VOIX_P15 } from './voixP15.js'
import { PERSONNAGES as P10 } from './p10.js'

const p15 = 'Livret du citoyen, page 15 (sommaire)'

export const PERSONNAGES = P10

export const COURT_MÉTRAGE = {
  page: 15,
  titre: 'La carte du voyage',
  sousTitre: 'Partie 2 : système institutionnel et politique',
  avertissement: 'Personnages et situations fictifs. Les cartes « 📜 Livret » reprennent le sommaire officiel, mot pour mot.',
  voix: VOIX_P15,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'mediatheque', ambiance: 'salle', musique: 'chaleureux', transition: 'fondu', particules: 'poussiere',
      caméra: { de: { x: -3, z: 1.16 }, à: { x: 2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Un soir, à la médiathèque.' },
        { qui: 'narrateur', texte: 'Lina a terminé la première partie du livret. M. Arnaud ouvre la deuxième.', son: 'page' },
      ],
    },
    {
      id: 'partie-2', titre: 'La partie 2', décor: 'mediatheque', visuel: 'partie-2', ambiance: 'salle', musique: 'élévation', transition: 'lumiere', lumière: 'rgba(255,206,140,.65)',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 22, regard: 'droite' }, { id: 'arnaud', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'Deuxième partie : le système institutionnel et politique.', émotion: 'sourire', étape: 1, son: 'page' },
        { officiel: { texte: 'Partie 2 - Système institutionnel et politique', source: p15 }, étape: 1 },
        { qui: 'lina', texte: 'C\'est long ! Par où commencer ?', émotion: 'surprise', étape: 1 },
        { qui: 'arnaud', texte: 'Par le sommaire. Regarde : il y a trois chapitres.', émotion: 'sourire', geste: 'montre', étape: 2 },
      ],
    },
    {
      id: 'carton-1', titre: 'I. Démocratie et État de droit', décor: 'carton', visuel: 'carton', carton: { lettre: 'I', titre: 'Démocratie et État de droit', sous: 'Page 16' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Premier chapitre : démocratie et État de droit.', son: 'whoosh' }],
    },
    {
      id: 'chap-1', titre: 'Les institutions et le vote', décor: 'mediatheque', visuel: 'chapitre-1', ambiance: 'salle', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,206,140,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 22, regard: 'droite' }, { id: 'lina', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'Ce chapitre commence par les principales institutions de l\'État, à la page 16.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { qui: 'arnaud', texte: 'Puis vient le droit de vote, à la page 17.', étape: 2, son: 'bloc' },
        { officiel: { texte: 'I. Démocratie et État de droit – page 16\nA. Les principales institutions de l\'État – page 16\nB. Le droit de vote – page 17', source: p15 }, étape: 2 },
        { qui: 'lina', texte: 'Les institutions, puis le vote : je note.', émotion: 'sourire', étape: 2, son: 'crayon' },
      ],
    },
    {
      id: 'carton-2', titre: 'II. Organisation territoriale', décor: 'carton', visuel: 'carton', carton: { lettre: 'II', titre: 'Organisation territoriale de la République', sous: 'Page 19' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Deuxième chapitre : l\'organisation territoriale de la République.', son: 'whoosh' }],
    },
    {
      id: 'chap-2', titre: 'Communes, départements, régions, outre-mer', décor: 'visio', visuel: 'chapitre-2', ambiance: 'visio', musique: 'chaleureux', transition: 'volet',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'narrateur', texte: 'Lina appelle son amie Inès, qui vit à La Réunion.', son: 'appel' },
        { qui: 'lina', texte: 'Inès ! Le deuxième chapitre parle de l\'organisation territoriale de la République.', émotion: 'joie', étape: 1 },
        { qui: 'ines', texte: 'Les communes, les départements, les régions… Tout ça à la page 19 ?', émotion: 'réflexion', étape: 2 },
        { qui: 'lina', texte: 'Oui. Et l\'outre-mer est à la page 20 : ça te concerne !', émotion: 'sourire', étape: 3 },
        { officiel: { texte: 'II. Organisation territoriale de la République – page 19\nA. Les communes – page 19\nB. Les départements – page 19\nC. Les régions – page 19\nD. L\'outre-mer – page 20', source: p15 }, étape: 3 },
        { qui: 'ines', texte: 'Alors on la lira ensemble !', émotion: 'joie', étape: 3 },
      ],
    },
    {
      id: 'carton-3', titre: 'III. L\'Union européenne', décor: 'carton', visuel: 'carton', carton: { lettre: 'III', titre: 'L\'Union européenne et ses institutions', sous: 'Page 22' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Troisième chapitre : l\'Union européenne et ses institutions.', son: 'whoosh' }],
    },
    {
      id: 'chap-3', titre: 'Les pays membres et les étapes clés', décor: 'mediatheque', visuel: 'chapitre-3', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,206,140,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 22, regard: 'droite' }, { id: 'arnaud', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'À la page 22 : les pays membres de l\'Union européenne, et leur date d\'entrée, ou de sortie, dans l\'Union.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { qui: 'arnaud', texte: 'À la page 23 : les étapes clés de la construction européenne.', étape: 2, son: 'bloc' },
        { officiel: { texte: 'III. L\'Union européenne et ses institutions – page 22\nA. Les pays membres de l\'Union européenne et leur date d\'entrée (ou de sortie) dans l\'Union – page 22\nB. Les étapes clés de la construction européenne – page 23', source: p15 }, étape: 2 },
        { qui: 'lina', texte: 'Entrée ou sortie : il faudra être attentive aux dates.', émotion: 'réflexion', étape: 2 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'mediatheque-nuit', visuel: 'carte-partie-2', ambiance: 'salle', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,196,120,.7)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Démocratie et État de droit, organisation territoriale, Union européenne : trois chapitres.', émotion: 'fier', étape: 1 },
        { qui: 'arnaud', texte: 'De la page 16 à la page 23. Tu as la carte du voyage.', émotion: 'sourire', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : démocratie et État de droit, page 16.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Quel est le titre de la partie 2 du livret ?', r: 'Système institutionnel et politique', f: ['Principes et valeurs de la République', 'Histoire, géographie et culture'], scène: 'partie-2' },
    { q: 'Combien de chapitres compte le sommaire de la partie 2 ?', r: 'Trois', f: ['Deux', 'Cinq'], scène: 'partie-2' },
    { q: 'Quel est le premier chapitre de la partie 2 ?', r: 'Démocratie et État de droit', f: ['L\'Union européenne et ses institutions', 'Organisation territoriale de la République'], scène: 'chap-1' },
    { q: 'Dans quel chapitre se trouve « Le droit de vote » ?', r: 'I. Démocratie et État de droit, page 17', f: ['II. Organisation territoriale de la République, page 19', 'III. L\'Union européenne et ses institutions, page 22'], scène: 'chap-1' },
    { q: 'Que présente le chapitre « Organisation territoriale de la République » ?', r: 'Les communes, les départements, les régions et l\'outre-mer', f: ['Les pays membres de l\'Union européenne', 'Les principales institutions de l\'État'], scène: 'chap-2' },
    { q: 'À quelle page du livret se trouve l\'outre-mer ?', r: 'Page 20', f: ['Page 16', 'Page 23'], scène: 'chap-2' },
    { q: 'Que présente la page 22 sur les pays membres de l\'Union européenne ?', r: 'Leur date d\'entrée (ou de sortie) dans l\'Union', f: ['Leur capitale', 'Leur langue officielle'], scène: 'chap-3' },
    { q: 'Où trouve-t-on les étapes clés de la construction européenne ?', r: 'Page 23', f: ['Page 17', 'Page 19'], scène: 'chap-3' },
  ],
}

// Contrôle de fidélité : chaque entrée du sommaire et la scène qui la montre.
export const COUVERTURE = [
  ['Partie 2 - Système institutionnel et politique', 'partie-2'],
  ['I. Démocratie et État de droit (16) : A. institutions de l\'État (16), B. droit de vote (17)', 'chap-1'],
  ['II. Organisation territoriale (19) : communes, départements, régions (19), outre-mer (20)', 'chap-2'],
  ['III. Union européenne (22) : pays membres et dates d\'entrée ou de sortie (22), étapes clés (23)', 'chap-3'],
]
