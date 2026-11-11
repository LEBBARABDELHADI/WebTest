// Expérience narrative cinématographique — PROTOTYPE, page 17 uniquement.
// « Le jour du vote » : fin de A (la justice, le Conseil constitutionnel) et
// B. le droit de vote (suffrage universel, 1848, 1944, 1945, conditions pour
// voter, privation des droits civiques, vote personnel et secret, isoloir,
// pièce d'identité, panneaux d'affichage électoral).
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 17, phrase par phrase. Personnages, lieux et dialogues sont
// fictifs ; ils n'énoncent que ce que dit la page. Aucun candidat ni parti
// réel n'est montré (panneaux vides).
import { VOIX_P17 } from './voixP17.js'
import { PERSONNAGES as P10 } from './p10.js'

const p17 = 'Livret du citoyen, page 17'

export const PERSONNAGES = P10

export const COURT_MÉTRAGE = {
  page: 17,
  titre: 'Le jour du vote',
  sousTitre: 'La justice, le Conseil constitutionnel, le droit de vote',
  avertissement: 'Personnages et situations fictifs : aucun candidat ni parti réel. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P17,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'mediatheque', ambiance: 'salle', musique: 'chaleureux', transition: 'fondu', particules: 'poussiere',
      caméra: { de: { x: -3, z: 1.16 }, à: { x: 2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Jeudi soir, à la médiathèque.' },
        { qui: 'narrateur', texte: 'Lina tourne la page : la page 17. M. Arnaud s\'assoit à côté d\'elle.', son: 'page' },
      ],
    },
    {
      id: 'justice', titre: 'La justice', décor: 'mediatheque', visuel: 'justice', ambiance: 'salle', musique: 'réflexion', transition: 'lumiere', lumière: 'rgba(255,206,140,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Qui rend la justice, en France ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'La justice est rendue par les juges.', émotion: 'neutre', étape: 1, son: 'bloc' },
        { qui: 'arnaud', texte: 'Elle règle les litiges entre les particuliers ou les entreprises, et entre les citoyens et l\'administration.', geste: 'explique', étape: 2 },
        { qui: 'lina', texte: 'Et quand quelqu\'un ne respecte pas les règles ?', émotion: 'réflexion', étape: 2 },
        { qui: 'arnaud', texte: 'Elle sanctionne les infractions aux règles de droit, par des peines prévues par la loi : par exemple, l\'emprisonnement ou l\'amende.', émotion: 'neutre', étape: 3 },
        { officiel: { texte: 'La justice est rendue par les juges. Elle règle les litiges entre les particuliers ou les entreprises, et entre les citoyens et l\'administration. Elle sanctionne les infractions aux règles de droit par des peines prévues par la loi (exemples : emprisonnement, amende…).', source: p17 }, étape: 3 },
      ],
    },
    {
      id: 'conseil', titre: 'Le Conseil constitutionnel', décor: 'mediatheque', visuel: 'conseil-constitutionnel', ambiance: 'salle', musique: 'élévation', transition: 'fondu', lumière: 'rgba(255,206,140,.65)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'Il existe aussi une institution spécifique : le Conseil constitutionnel.', émotion: 'sourire', étape: 1, son: 'page' },
        { qui: 'arnaud', texte: 'Il est chargé de veiller à la conformité des lois avec la Constitution.', geste: 'explique', étape: 1 },
        { qui: 'lina', texte: 'Et il contrôle aussi la régularité des élections nationales, c\'est écrit ici.', émotion: 'sourire', étape: 2 },
        { officiel: { texte: 'Une institution spécifique, le Conseil constitutionnel, est chargé de veiller à la conformité des lois avec la Constitution. Il contrôle aussi la régularité des élections nationales.', source: p17 }, étape: 2 },
      ],
    },
    {
      id: 'carton-b', titre: 'B. Le droit de vote', décor: 'carton', visuel: 'carton', carton: { lettre: 'B', titre: 'Le droit de vote', sous: 'Démocratie et État de droit' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Deuxième partie du chapitre : le droit de vote.', son: 'whoosh' }],
    },
    {
      id: 'droit-vote', titre: 'Un suffrage universel', décor: 'mediatheque', visuel: 'droit-vote', ambiance: 'salle', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,206,140,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'Le droit de vote est le droit reconnu aux citoyens d\'exprimer leur volonté à l\'occasion d\'une élection.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Le droit de vote est le droit reconnu aux citoyens d\'exprimer leur volonté à l\'occasion d\'une élection.', source: p17 }, étape: 1 },
        { qui: 'lina', texte: 'Et en France, le suffrage est universel : l\'ensemble des citoyens vote.', émotion: 'fier', étape: 2 },
        { officiel: { texte: 'En France, le suffrage est universel, c\'est-à-dire que l\'ensemble des citoyens vote.', source: p17 }, étape: 2 },
      ],
    },
    {
      id: 'histoire', titre: '1848, 1944, 1945', décor: 'mediatheque-nuit', visuel: 'frise-vote', ambiance: 'salle', musique: 'tendre', transition: 'lumiere', lumière: 'rgba(255,196,120,.7)',
      caméra: { de: { x: 0, z: 1.12 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Ça a toujours été le cas ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Le premier vote au suffrage universel a eu lieu en 1848. Mais il ne concernait que les hommes en âge de voter.', émotion: 'neutre', étape: 1, son: 'plume' },
        { qui: 'lina', texte: 'Et les femmes ?', émotion: 'surprise', étape: 1 },
        { qui: 'arnaud', texte: 'Les femmes françaises n\'ont obtenu le droit de vote qu\'en avril 1944.', émotion: 'tendre', étape: 2, son: 'bloc' },
        { qui: 'arnaud', texte: 'Elles ont voté pour la première fois un an plus tard, en avril 1945.', émotion: 'sourire', étape: 3, son: 'bloc' },
        { officiel: { texte: 'Le premier vote au suffrage universel a eu lieu en 1848 mais ne concernait que les hommes en âge de voter. Les femmes françaises n\'ont obtenu le droit de vote qu\'en avril 1944 et ont voté pour la première fois un an plus tard, en avril 1945.', source: p17 }, étape: 3 },
      ],
    },
    {
      id: 'conditions', titre: 'Pour voter, il faut…', décor: 'mediatheque', visuel: 'conditions', ambiance: 'salle', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,206,140,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Et à ce jour, pour voter, que faut-il ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Avoir la nationalité française. Ou être ressortissant d\'un État membre de l\'Union européenne, pour les élections municipales ou les élections du Parlement européen.', émotion: 'neutre', geste: 'explique', étape: 1, son: 'crayon' },
        { qui: 'arnaud', texte: 'Être majeur : avoir au moins 18 ans.', étape: 2, son: 'crayon' },
        { officiel: { texte: 'À ce jour pour voter, il faut :\nAvoir la nationalité française (ou être ressortissant d\'un État membre de l\'Union européenne pour les élections municipales ou les élections du Parlement européen),\nÊtre majeur (avoir au moins 18 ans),', source: p17 }, étape: 2 },
      ],
    },
    {
      id: 'conditions-2', titre: 'Inscrit sur les listes', décor: 'mediatheque', visuel: 'conditions', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,206,140,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'Il faut aussi ne pas avoir été privé de ses droits civiques.', émotion: 'neutre', étape: 3, son: 'crayon' },
        { qui: 'arnaud', texte: 'Et être inscrit sur les listes électorales : sur internet, ou à la mairie de son lieu de résidence.', geste: 'explique', étape: 4, son: 'crayon' },
        { officiel: { texte: 'Ne pas avoir été privé de ses droits civiques,\nÊtre inscrit sur les listes électorales (possibilité de s\'inscrire sur internet ou à la mairie de son lieu de résidence).', source: p17 }, étape: 4 },
        { qui: 'lina', texte: 'Et s\'il manque une condition ?', émotion: 'réflexion', étape: 4 },
        { qui: 'arnaud', texte: 'Alors la personne ne pourra pas voter.', émotion: 'neutre', étape: 5 },
        { officiel: { texte: 'Si l\'une de ces conditions n\'est pas remplie, la personne ne pourra pas voter.', source: p17 }, étape: 5 },
      ],
    },
    {
      id: 'privation', titre: 'La privation des droits civiques', décor: 'mediatheque', visuel: 'privation', ambiance: 'salle', musique: 'tension', transition: 'flou', lumière: 'rgba(255,206,140,.55)',
      caméra: { de: { x: 0, z: 1.1 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Être privé de ses droits civiques, qu\'est-ce que ça veut dire ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'C\'est une sanction pour des infractions graves.', émotion: 'neutre', étape: 1, son: 'bloc' },
        { qui: 'arnaud', texte: 'Elle retire à une personne certains de ses droits fondamentaux, comme le droit de vote, ou celui de se présenter à une élection.', geste: 'explique', étape: 2 },
        { officiel: { texte: 'La privation des droits civiques est une sanction pour des infractions graves, qui consiste à retirer à une personne certains de ses droits fondamentaux, tels que le droit de vote ou de se présenter à une élection.', source: `${p17} (encadré)` }, étape: 2 },
      ],
    },
    {
      id: 'bureau', titre: 'Un vote personnel et secret', décor: 'bureau-vote', visuel: 'vote-secret', ambiance: 'salle', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,236,200,.6)',
      caméra: { de: { x: 2, z: 1.1 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Dimanche, Lina accompagne M. Arnaud au bureau de vote.', son: 'pas' },
        { qui: 'arnaud', texte: 'Le vote est personnel et secret.', émotion: 'sourire', étape: 1 },
        { qui: 'arnaud', texte: 'Je passe par l\'isoloir, je mets mon bulletin dans une enveloppe, puis je la dépose dans l\'urne.', geste: 'explique', étape: 2, son: 'bloc' },
        { officiel: { texte: 'Le vote est personnel et secret. Il se déroule dans un bureau de vote, en passant par un isoloir afin de mettre son bulletin de vote dans une enveloppe, qui est ensuite déposée dans une urne.', source: p17 }, étape: 2 },
      ],
    },
    {
      id: 'isoloir', titre: 'Seul dans l\'isoloir', décor: 'bureau-vote', visuel: 'isoloir', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,236,200,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Je peux venir avec vous dans l\'isoloir ?', émotion: 'surprise' },
        { qui: 'arnaud', texte: 'Non. Il est interdit d\'entrer à plusieurs dans un isoloir.', émotion: 'neutre', étape: 1, son: 'bloc' },
        { qui: 'arnaud', texte: 'Il est aussi interdit de communiquer avec une personne située dans un autre isoloir.', étape: 2, son: 'bloc' },
        { officiel: { texte: 'Il est interdit d\'entrer à plusieurs dans un isoloir ainsi que de communiquer avec une personne située dans un autre isoloir.', source: p17 }, étape: 2 },
      ],
    },
    {
      id: 'identite', titre: 'La pièce d\'identité', décor: 'bureau-vote', visuel: 'piece-identite', ambiance: 'salle', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,236,200,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'En arrivant, vous avez montré un document. Lequel ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Les Français ou les ressortissants de l\'Union européenne doivent présenter une pièce d\'identité.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Pour voter, quel document dois-je présenter à mon arrivée en bureau de vote ?\nLes Français ou les ressortissants de l\'Union européenne doivent présenter une pièce d\'identité (plus d\'informations sur le site : https://www.service-public.gouv.fr/particuliers/vosdroits/F1361).', source: `${p17} (encadré)` }, étape: 1 },
        { qui: 'arnaud', texte: 'Elle n\'est pas obligatoire dans les communes de moins de 1 000 habitants.', étape: 2 },
        { qui: 'arnaud', texte: 'Mais, en cas de doute, le président du bureau de vote peut demander de prouver son identité par tout moyen.', émotion: 'neutre', étape: 3 },
        { officiel: { texte: 'La pièce d\'identité n\'est pas obligatoire dans les communes de moins de 1 000 habitants. Mais, en cas de doute, le président du bureau de vote peut vous demander de prouver votre identité par tout moyen.', source: `${p17} (encadré)` }, étape: 3 },
      ],
    },
    {
      id: 'panneaux', titre: 'Les panneaux d\'affichage', décor: 'ecole-vote', visuel: 'panneaux', ambiance: 'rue', musique: 'chaleureux', transition: 'lumiere', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.1 }, à: { x: 3, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'En sortant, ils passent devant les panneaux d\'affichage.', son: 'pas' },
        { qui: 'arnaud', texte: 'Lors des élections, les candidats disposent, dans chaque commune, de panneaux d\'affichage électoral.', émotion: 'neutre', geste: 'montre', étape: 1 },
        { qui: 'arnaud', texte: 'On y trouve leur présentation, afin d\'informer les citoyens.', étape: 2 },
        { qui: 'lina', texte: 'Et on n\'a pas le droit de les abîmer ?', émotion: 'réflexion', étape: 2 },
        { qui: 'arnaud', texte: 'Non : aucune dégradation n\'est tolérée sur ces panneaux.', émotion: 'neutre', étape: 3 },
        { officiel: { texte: 'Lors des élections, les candidats disposent, dans chaque commune, de panneaux d\'affichage électoral, où figure leur présentation afin d\'informer les citoyens. Aucune dégradation n\'est tolérée sur ces panneaux.', source: p17 }, étape: 3 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'place-mairie-soir', visuel: 'recap-17', ambiance: 'soir', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,200,150,.65)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Les juges rendent la justice, le Conseil constitutionnel veille sur les lois et les élections nationales…', émotion: 'joie', étape: 1 },
        { qui: 'lina', texte: '… et le vote est personnel et secret, depuis l\'isoloir jusqu\'à l\'urne.', émotion: 'fier', étape: 1 },
        { qui: 'arnaud', texte: 'Parfait. Tu es prête pour la suite.', émotion: 'fier', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : les principales élections en France, page 18.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Qui rend la justice ?', r: 'Les juges', f: ['Les maires', 'Les députés'], scène: 'justice' },
    { q: 'Comment la justice sanctionne-t-elle les infractions aux règles de droit ?', r: 'Par des peines prévues par la loi (emprisonnement, amende…)', f: ['Par des peines choisies librement par chacun', 'Par un vote des citoyens'], scène: 'justice' },
    { q: 'De quoi le Conseil constitutionnel est-il chargé ?', r: 'De veiller à la conformité des lois avec la Constitution', f: ['De régler les litiges entre particuliers', 'De voter les lois'], scène: 'conseil' },
    { q: 'Que contrôle aussi le Conseil constitutionnel ?', r: 'La régularité des élections nationales', f: ['Les panneaux d\'affichage électoral', 'Les dépenses des communes'], scène: 'conseil' },
    { q: 'Qu\'est-ce que le droit de vote ?', r: 'Le droit reconnu aux citoyens d\'exprimer leur volonté à l\'occasion d\'une élection', f: ['L\'obligation de se présenter à une élection', 'Le droit de choisir les juges'], scène: 'droit-vote' },
    { q: 'En quelle année a eu lieu le premier vote au suffrage universel ?', r: 'En 1848, mais seulement pour les hommes en âge de voter', f: ['En 1789, pour tous les citoyens', 'En 1944, pour tous les citoyens'], scène: 'histoire' },
    { q: 'Quand les femmes françaises ont-elles obtenu le droit de vote ?', r: 'En avril 1944 ; elles ont voté pour la première fois en avril 1945', f: ['En 1848', 'En 1958'], scène: 'histoire' },
    { q: 'Un ressortissant d\'un État membre de l\'Union européenne peut voter…', r: 'aux élections municipales et aux élections du Parlement européen', f: ['à toutes les élections', 'à aucune élection'], scène: 'conditions' },
    { q: 'Qu\'est-ce que la privation des droits civiques ?', r: 'Une sanction pour des infractions graves, qui retire certains droits fondamentaux, comme le droit de vote', f: ['Une démarche volontaire pour ne plus voter', 'Une règle pour les moins de 18 ans'], scène: 'privation' },
    { q: 'Comment est le vote ?', r: 'Personnel et secret', f: ['Public, à main levée', 'Collectif, en famille'], scène: 'bureau' },
    { q: 'Dans l\'isoloir…', r: 'il est interdit d\'entrer à plusieurs et de communiquer avec une personne d\'un autre isoloir', f: ['on peut entrer en famille', 'on peut demander conseil à son voisin d\'isoloir'], scène: 'isoloir' },
    { q: 'La pièce d\'identité est-elle obligatoire pour voter ?', r: 'Oui, sauf dans les communes de moins de 1 000 habitants (mais une preuve d\'identité peut être demandée en cas de doute)', f: ['Non, jamais', 'Oui, partout et sans exception'], scène: 'identite', o: 1 },
    { q: 'Les panneaux d\'affichage électoral…', r: 'présentent les candidats, et aucune dégradation n\'y est tolérée', f: ['sont réservés aux maires', 'peuvent être recouverts par chacun'], scène: 'panneaux' },
  ],
}

// Contrôle de fidélité : chaque notion de la page 17 et la scène qui la montre.
export const COUVERTURE = [
  ['La justice : les juges, les litiges, les peines prévues par la loi', 'justice'],
  ['Le Conseil constitutionnel : conformité des lois avec la Constitution, régularité des élections nationales', 'conseil'],
  ['Le droit de vote ; le suffrage universel', 'droit-vote'],
  ['1848 (hommes) ; avril 1944 (droit de vote des femmes) ; avril 1945 (premier vote)', 'histoire'],
  ['Conditions : nationalité (ou UE pour municipales et européennes), 18 ans', 'conditions'],
  ['Conditions : droits civiques, listes électorales ; sinon, pas de vote', 'conditions-2'],
  ['Encadré : la privation des droits civiques', 'privation'],
  ['Vote personnel et secret : bureau de vote, isoloir, enveloppe, urne', 'bureau'],
  ['Interdits de l\'isoloir', 'isoloir'],
  ['Encadré : pièce d\'identité ; communes de moins de 1 000 habitants', 'identite'],
  ['Panneaux d\'affichage électoral ; aucune dégradation', 'panneaux'],
]
