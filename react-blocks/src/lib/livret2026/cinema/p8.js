// Expérience narrative cinématographique — PROTOTYPE, page 8 uniquement.
// « Un 14 Juillet » : D. Les symboles de la France — la fête nationale,
// l'hymne, la langue officielle, Marianne, le drapeau tricolore, le coq.
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 8. Personnages, lieux et dialogues sont fictifs ; ils n'énoncent
// que ce que dit la page.
import { VOIX_P8 } from './voixP8.js'
import { PERSONNAGES as CASTING } from './p10.js'

const p8 = 'Livret du citoyen, page 8'

export const PERSONNAGES = {
  ...CASTING,
  zoe: { nom: 'Zoé', rôle: 'petite-fille de M. Arnaud, personnage fictif', couleur: '#f87171', peau: '#f1c9a5', yeux: '#4a6b8a', cheveux: { style: 'longs', couleur: '#b9772e' }, tenue: { style: 'tshirt', couleur: '#3b82f6' }, barrette: '#ef4444', voix: { genre: 'f', pitch: 1.3, rate: 1.06 } },
}

export const COURT_MÉTRAGE = {
  page: 8,
  titre: 'Un 14 Juillet',
  sousTitre: 'Les symboles de la France',
  avertissement: 'Personnages et situations fictifs. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P8,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'place-14-juillet', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', particules: 'poussiere',
      caméra: { de: { x: 3, z: 1.16 }, à: { x: -2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Le 14 juillet, au petit matin. La place de la mairie s\'habille de bleu, de blanc et de rouge.' },
        { qui: 'narrateur', texte: 'M. Arnaud a invité Lina à passer la fête nationale avec lui et sa petite-fille, Zoé.', son: 'pas' },
      ],
    },
    {
      id: 'chapitre-d', titre: 'D. Les symboles', décor: 'carton', visuel: 'carton', carton: { lettre: 'D', titre: 'Les symboles de la France', sous: 'La devise et les symboles de la République' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ officiel: { texte: 'Les symboles de la France sont les suivants :', source: p8 }, son: 'whoosh' }],
    },
    {
      id: 'pourquoi', titre: 'Pourquoi le 14 juillet ?', décor: 'place-14-juillet', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Pourquoi la fête nationale tombe-t-elle le 14 juillet ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Pour deux événements. Ferme les yeux… Nous sommes à Paris, en 1789.', émotion: 'tendre', son: 'whoosh' },
      ],
    },
    {
      id: 'bastille', titre: '1789, 1790', décor: 'bastille', visuel: 'frise-14', ambiance: 'souffle', musique: 'tension', transition: 'flou',
      caméra: { de: { x: -3, z: 1.14 }, à: { x: 2, z: 1.0 } }, focus: 'fond',
      temps: [
        { qui: 'narrateur', texte: 'Le 14 juillet 1789, le peuple de Paris prend la Bastille, une prison royale.', étape: 1, son: 'bloc' },
        { qui: 'narrateur', texte: 'C\'est le début de la Révolution française.', étape: 1 },
        { qui: 'narrateur', texte: 'Un an plus tard, le 14 juillet 1790, on célèbre la Fête de la Fédération.', étape: 2, son: 'carillon' },
        { officiel: { texte: 'Le 14 juillet 1789, le peuple de Paris a pris la Bastille (une prison royale), ce qui marque le début de la Révolution française. Un an plus tard, le 14 juillet 1790, est célébrée la Fête de la Fédération.', source: p8 }, étape: 2 },
      ],
    },
    {
      id: 'fete-nationale', titre: 'La fête nationale', décor: 'place-14-juillet', visuel: 'frise-14', ambiance: 'rue', musique: 'chaleureux', transition: 'lumiere', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 22, regard: 'droite', échelle: 0.9 }, { id: 'arnaud', x: 78, regard: 'gauche', échelle: 0.9 }],
      temps: [
        { qui: 'arnaud', texte: 'Depuis 1880, le 14 juillet est notre fête nationale. Elle commémore ces deux événements.', émotion: 'sourire', étape: 3 },
        { qui: 'lina', texte: 'La prise de la Bastille et la Fête de la Fédération !', émotion: 'joie', étape: 3 },
        { officiel: { texte: 'Depuis 1880, le 14 juillet est consacré comme jour de fête nationale pour commémorer ces deux événements.', source: p8 }, étape: 3 },
      ],
    },
    {
      id: 'hymne', titre: 'L\'hymne national', décor: 'place-14-juillet', visuel: 'marseillaise', ambiance: 'rue', transition: 'fondu', lumière: 'rgba(255,230,180,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 26, regard: 'droite', échelle: 0.72 }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { pause: 8800, son: 'marseillaise', légende: '🎶 Devant la mairie, les enfants de l\'école jouent La Marseillaise…', étape: 1 },
        { qui: 'zoe', texte: 'C\'est La Marseillaise ! Rouget de Lisle l\'a écrite en 1792.', émotion: 'fier', étape: 1 },
        { qui: 'lina', texte: 'Et tu l\'apprends en classe ?', émotion: 'sourire', étape: 1 },
        { qui: 'zoe', texte: 'Oui ! On l\'étudie à l\'école primaire.', émotion: 'joie', étape: 2 },
        { officiel: { texte: 'En 1792, l\'hymne national français, La Marseillaise, a été écrit par Rouget de Lisle (paroles ci-après). Elle est étudiée par les enfants à l\'école primaire.', source: p8 }, étape: 2 },
      ],
    },
    {
      id: 'langue', titre: 'La langue officielle', décor: 'salle-mairie', visuel: 'langue', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,214,160,.65)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 20, regard: 'droite', échelle: 0.9 }, { id: 'lina', x: 80, regard: 'gauche', échelle: 0.9 }],
      temps: [
        { qui: 'narrateur', texte: 'Dans la mairie, une exposition sur les symboles est ouverte pour la fête.', son: 'pas' },
        { qui: 'lina', texte: 'Les panneaux, les formulaires… tout est écrit en français.', émotion: 'sourire' },
        { qui: 'arnaud', texte: 'Bien sûr : le français est la langue officielle de la République.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'La langue officielle de la République est le français.', source: p8 }, étape: 1 },
      ],
    },
    {
      id: 'marianne', titre: 'Marianne', décor: 'salle-mairie', visuel: 'marianne', ambiance: 'salle', musique: 'réflexion', transition: 'lumiere', lumière: 'rgba(255,214,160,.65)',
      caméra: { de: { x: 0, z: 1.1 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 18, regard: 'droite', échelle: 0.84 }, { id: 'arnaud', x: 82, regard: 'gauche', échelle: 0.84 }],
      temps: [
        { qui: 'lina', texte: 'Et cette statue, avec ce bonnet ?', émotion: 'surprise' },
        { qui: 'arnaud', texte: 'C\'est Marianne. Son bonnet phrygien est le symbole de la liberté.', émotion: 'sourire', geste: 'montre', étape: 1, son: 'carillon' },
        { officiel: { texte: 'Marianne, une femme portant un bonnet phrygien (symbole de la liberté), est devenue le symbole de la République.', source: p8 }, étape: 1 },
        { qui: 'arnaud', texte: 'On la voit sur les documents de l\'administration. Et sa statue, dans toutes les mairies, rappelle la Révolution française.', étape: 2 },
        { officiel: { texte: 'Elle apparaît sur les documents de l\'administration française. Sa statue, placée dans toutes les mairies, rappelle la Révolution française.', source: p8 }, étape: 2 },
      ],
    },
    {
      id: 'drapeau', titre: 'Le drapeau tricolore', décor: 'place-14-juillet', visuel: 'drapeau', ambiance: 'rue', musique: 'élévation', transition: 'volet', lumière: 'rgba(255,236,190,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 22, regard: 'droite' }, { id: 'arnaud', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Midi. Sur la façade de la mairie, le drapeau flotte au vent.' },
        { qui: 'lina', texte: 'Bleu, blanc, rouge… Le drapeau date aussi de la Révolution ?', émotion: 'réflexion', étape: 1 },
        { qui: 'arnaud', texte: 'Oui. Il est devenu le drapeau officiel en 1794. Sauf pendant la Restauration, de 1814 à 1830.', émotion: 'neutre', geste: 'explique', étape: 2 },
        { officiel: { texte: 'Le drapeau tricolore (bleu, blanc, rouge) a aussi été créé pendant la Révolution. Il est devenu le drapeau officiel de la France en 1794, sauf lors de la période de la Restauration (1814-1830 – détaillé dans la partie « histoire, géographie et culture »).', source: p8 }, étape: 2 },
      ],
    },
    {
      id: 'coq', titre: 'Le coq', décor: 'place-14-juillet', visuel: 'coq', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 24, regard: 'droite', échelle: 0.72 }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'zoe', texte: 'Papi, et le coq ? C\'est un symbole aussi ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Oui. Il représente la fierté, le courage et la vigilance.', émotion: 'sourire', étape: 1 },
        { qui: 'arnaud', texte: 'Il n\'a pas de statut officiel selon la Constitution, mais il est utilisé depuis l\'Antiquité.', étape: 2 },
        { officiel: { texte: 'Le coq représente la fierté, le courage et la vigilance. Bien qu\'il n\'ait pas de statut officiel selon la Constitution, il est utilisé depuis l\'antiquité et est largement reconnu comme un symbole national.', source: p8 }, étape: 2 },
        { qui: 'zoe', texte: 'Cocorico !', émotion: 'joie', étape: 2 },
      ],
    },
    {
      id: 'partout', titre: 'Partout dans l\'administration', décor: 'visio', visuel: 'partout', étiquettes: [['Lina · Paris', 3], ['Inès · La Réunion', 53]], ambiance: 'visio', musique: 'tendre', transition: 'lumiere',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'narrateur', texte: 'En fin d\'après-midi, Lina appelle Inès depuis son ordinateur.', son: 'appel' },
        { qui: 'lina', texte: 'Regarde, sur le site de l\'administration : Marianne, le drapeau… Les symboles sont là aussi !', émotion: 'surprise', étape: 1 },
        { qui: 'ines', texte: 'Tu les retrouveras sur tous les sites et les documents de l\'administration.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'On retrouve les symboles sur l\'ensemble des sites internet et documents de l\'administration.', source: p8 }, étape: 1 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'place-14-juillet-soir', visuel: 'six-symboles', ambiance: 'soir', musique: 'final', transition: 'fondu', lumière: 'rgba(255,200,150,.65)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite', échelle: 0.9 }, { id: 'lina', x: 74, regard: 'gauche' }],
      temps: [
        { pause: 3400, son: 'artifice', légende: '🎆 Le soir, le feu d\'artifice illumine la place.' },
        { qui: 'lina', texte: 'La fête nationale, La Marseillaise, le français, Marianne, le drapeau, le coq…', émotion: 'joie', étape: 1 },
        { qui: 'arnaud', texte: 'Les symboles de la France. Maintenant, tu les connais tous.', émotion: 'fier', étape: 1, son: 'artifice' },
        { qui: 'narrateur', texte: 'À suivre : La Marseillaise et ses paroles, page 9.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Que s\'est-il passé le 14 juillet 1789 ?', r: 'Le peuple de Paris a pris la Bastille, une prison royale', f: ['Le roi a signé la Constitution de 1958', 'La première élection présidentielle a eu lieu'], scène: 'bastille' },
    { q: 'Que marque la prise de la Bastille ?', r: 'Le début de la Révolution française', f: ['La fin de la Première Guerre mondiale', 'La naissance de l\'Union européenne'], scène: 'bastille' },
    { q: 'Quel événement est célébré le 14 juillet 1790 ?', r: 'La Fête de la Fédération', f: ['Le couronnement d\'un roi', 'La fête du Travail'], scène: 'bastille' },
    { q: 'Depuis quand le 14 juillet est-il le jour de la fête nationale ?', r: 'Depuis 1880', f: ['Depuis 1789', 'Depuis 1958'], scène: 'fete-nationale' },
    { q: 'Qui a écrit La Marseillaise, et en quelle année ?', r: 'Rouget de Lisle, en 1792', f: ['Victor Hugo, en 1830', 'Napoléon, en 1804'], scène: 'hymne' },
    { q: 'Qui étudie La Marseillaise ?', r: 'Les enfants, à l\'école primaire', f: ['Seulement les militaires', 'Seulement les élus'], scène: 'hymne' },
    { q: 'Quelle est la langue officielle de la République ?', r: 'Le français', f: ['Le français et l\'anglais', 'Il n\'y a pas de langue officielle'], scène: 'langue' },
    { q: 'Que symbolise le bonnet phrygien de Marianne ?', r: 'La liberté', f: ['La royauté', 'La richesse'], scène: 'marianne' },
    { q: 'Où trouve-t-on la statue de Marianne ?', r: 'Dans toutes les mairies', f: ['Seulement au musée du Louvre', 'Seulement dans les écoles'], scène: 'marianne', o: 1 },
    { q: 'Depuis quand le drapeau tricolore est-il le drapeau officiel de la France ?', r: 'Depuis 1794, sauf pendant la Restauration (1814-1830)', f: ['Depuis 1958, sans exception', 'Depuis 1880, avec la fête nationale'], scène: 'drapeau' },
    { q: 'Que représente le coq ?', r: 'La fierté, le courage et la vigilance', f: ['La paix, la richesse et la chance', 'La vitesse et la force'], scène: 'coq' },
    { q: 'Le coq a-t-il un statut officiel selon la Constitution ?', r: 'Non, mais il est largement reconnu comme un symbole national', f: ['Oui, il est cité à l\'article 1er', 'Oui, depuis 1880'], scène: 'coq' },
    { q: 'Où retrouve-t-on les symboles de la France ?', r: 'Sur l\'ensemble des sites internet et documents de l\'administration', f: ['Uniquement sur les monuments historiques', 'Uniquement le 14 juillet'], scène: 'partout' },
  ],
}

// Contrôle de fidélité : chaque notion de la page 8 et la scène qui la montre.
export const COUVERTURE = [
  ['« Les symboles de la France sont les suivants : »', 'chapitre-d'],
  ['14 juillet 1789 : prise de la Bastille (prison royale), début de la Révolution', 'bastille'],
  ['14 juillet 1790 : Fête de la Fédération', 'bastille'],
  ['Depuis 1880 : le 14 juillet, fête nationale, commémore ces deux événements', 'fete-nationale'],
  ['La Marseillaise : écrite en 1792 par Rouget de Lisle, étudiée à l\'école primaire', 'hymne'],
  ['La langue officielle de la République est le français', 'langue'],
  ['Marianne au bonnet phrygien (liberté), symbole de la République', 'marianne'],
  ['Marianne sur les documents de l\'administration ; sa statue dans toutes les mairies', 'marianne'],
  ['Drapeau tricolore : créé pendant la Révolution, officiel en 1794, sauf Restauration (1814-1830)', 'drapeau'],
  ['Le coq : fierté, courage, vigilance ; pas de statut officiel, symbole national reconnu', 'coq'],
  ['Les symboles sur les sites internet et documents de l\'administration', 'partout'],
]
