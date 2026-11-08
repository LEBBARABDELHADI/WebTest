// Expérience narrative cinématographique — PROTOTYPE, page 13 uniquement.
// « Au bureau, en classe » : c) la laïcité sur le lieu de travail (agents
// publics, salariés du privé, fête religieuse, règlement intérieur), d) la
// laïcité dans les établissements scolaires publics.
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 13 (seule correction : la coquille « opinons », écrite
// « opinions »). Personnages, lieux et dialogues sont fictifs ; ils n'énoncent
// que ce que dit la page. Aucune religion réelle n'est mise en scène.
import { VOIX_P13 } from './voixP13.js'
import { PERSONNAGES as P7 } from './p7.js'
import { PERSONNAGES as P8 } from './p8.js'
import { PERSONNAGES as P11 } from './p11.js'

const p13 = 'Livret du citoyen, page 13'

export const PERSONNAGES = {
  ...P7, ...P8, ...P11,
  recruteur: { ...P7.recruteur, rôle: 'salarié de l\'entreprise, personnage fictif' },
  directrice: { ...P7.directrice, rôle: 'directrice de l\'entreprise, personnage fictif' },
  enseignante: { nom: 'Mme Petit', rôle: 'professeure des écoles, personnage fictif', couleur: '#a78bfa', peau: '#c98e64', yeux: '#2a1a10', cheveux: { style: 'longs', couleur: '#3a2418' }, tenue: { style: 'gilet', couleur: '#0f766e' }, voix: { genre: 'f', pitch: 1.05, rate: 1.0 } },
}

export const COURT_MÉTRAGE = {
  page: 13,
  titre: 'Au bureau, en classe',
  sousTitre: 'La laïcité au travail et à l\'école',
  avertissement: 'Personnages et situations fictifs. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P13,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'place-mairie', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', particules: 'feuilles',
      caméra: { de: { x: 3, z: 1.16 }, à: { x: -2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Lundi, huit heures. Les uns partent au travail, les autres à l\'école.' },
        { qui: 'narrateur', texte: 'Lina commence son nouveau poste dans l\'entreprise de Mme Diallo.', son: 'pas' },
      ],
    },
    {
      id: 'chapitre-c', titre: 'c) Sur le lieu de travail', décor: 'carton', visuel: 'carton', carton: { lettre: 'c', titre: 'La laïcité sur le lieu de travail', sous: 'Public ou privé ?' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Premier lieu : le travail.', son: 'whoosh' }],
    },
    {
      id: 'public-prive', titre: 'Public ou privé', décor: 'place-mairie', visuel: 'public-prive', ambiance: 'rue', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 22, regard: 'droite' }, { id: 'arnaud', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Mme Roux travaille à la mairie, et moi dans une entreprise. C\'est la même règle pour nous deux ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Non. La laïcité ne s\'applique pas de la même manière aux agents publics et aux salariés des entreprises privées.', émotion: 'sourire', geste: 'explique', étape: 1 },
        { officiel: { texte: 'La laïcité ne s\'applique pas de la même manière aux personnes qui travaillent dans les services publics (les fonctionnaires et agents publics) et à celles qui travaillent dans les entreprises privées (les salariés).', source: p13 }, étape: 1 },
      ],
    },
    {
      id: 'agent-public', titre: 'Une agente publique', décor: 'guichet-mairie', visuel: 'agent-public', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'agente', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'À la mairie, Mme Roux commence sa journée.', son: 'carillon' },
        { qui: 'arnaud', texte: 'Bonjour, madame Roux. Au travail, vous pouvez montrer votre religion ?', émotion: 'sourire' },
        { qui: 'agente', texte: 'Non. Je suis agente publique : pour garantir la neutralité de l\'État, je ne montre ni ma religion ni mes opinions.', émotion: 'neutre', étape: 1 },
        { qui: 'agente', texte: 'Pas de signe religieux, et pas de pratique religieuse au travail.', étape: 1 },
        { officiel: { texte: 'Pour garantir la neutralité de l\'État, les agents publics ne peuvent pas montrer leur religion ou leurs opinions au travail. Ils ne peuvent pas porter de signes religieux ou pratiquer leur religion au travail.', source: p13 }, étape: 1 },
      ],
    },
    {
      id: 'entreprise', titre: 'Dans une entreprise privée', décor: 'bureau', visuel: 'salaries', ambiance: 'salle', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'directrice', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Dans l\'entreprise de Mme Diallo, c\'est le premier jour de Lina.', son: 'pas' },
        { qui: 'directrice', texte: 'Bienvenue, Lina ! Une question avant de commencer ?', émotion: 'sourire' },
        { qui: 'lina', texte: 'Oui : ici, un salarié peut porter un signe religieux ?', émotion: 'réflexion' },
        { qui: 'directrice', texte: 'Oui. Les salariés du privé ont le droit d\'exprimer leurs opinions religieuses, y compris par une tenue ou un signe.', émotion: 'sourire', étape: 1 },
        { qui: 'directrice', texte: 'Sauf si cela perturbe le bon fonctionnement de l\'entreprise, ou pour des raisons de sécurité.', émotion: 'neutre', geste: 'explique', étape: 2 },
        { officiel: { texte: 'Les salariés des entreprises privées ont le droit d\'exprimer leurs opinions religieuses, y compris en portant des tenues ou des signes religieux, sauf si cela perturbe le bon fonctionnement de l\'entreprise ou pour des raisons de sécurité.', source: p13 }, étape: 2 },
      ],
    },
    {
      id: 'reglement', titre: 'Le règlement intérieur', décor: 'atelier', visuel: 'reglement', ambiance: 'salle', musique: 'tension', transition: 'flou', lumière: 'rgba(255,230,190,.6)',
      caméra: { de: { x: 2, z: 1.1 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'directrice', x: 22, regard: 'droite' }, { id: 'lina', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Mme Diallo lui fait visiter l\'atelier.', son: 'bloc' },
        { qui: 'directrice', texte: 'Le règlement intérieur peut fixer des limites, si elles sont justifiées par la nature des tâches.', émotion: 'neutre', étape: 1 },
        { qui: 'lina', texte: 'Par exemple, ici, pour la sécurité ?', émotion: 'réflexion', étape: 1 },
        { officiel: { texte: 'L\'employeur peut ainsi imposer, dans le cadre du règlement intérieur, des limites à la liberté de manifester son appartenance religieuse si celles-ci sont justifiées par la nature des tâches confiées au salarié.', source: p13 }, étape: 1 },
      ],
    },
    {
      id: 'absence', titre: 'Une fête religieuse', décor: 'bureau', visuel: 'absence', ambiance: 'salle', musique: 'chaleureux', transition: 'fondu', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'recruteur', x: 16, regard: 'droite', échelle: 0.8 }, { id: 'lina', x: 50, regard: 'droite', échelle: 0.76 }, { id: 'directrice', x: 84, regard: 'gauche', échelle: 0.8 }],
      temps: [
        { qui: 'recruteur', texte: 'Madame Diallo, je voudrais une autorisation d\'absence pour une fête religieuse.', émotion: 'réflexion' },
        { qui: 'directrice', texte: 'Vous avez le droit de la demander, Hugo. Je regarde le planning.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Un salarié ou un agent public peut solliciter une autorisation d\'absence de son employeur pour une fête religieuse.', source: `${p13} (encadré)` }, étape: 1 },
        { qui: 'lina', texte: 'Et l\'employeur peut refuser ?', émotion: 'réflexion', étape: 2 },
        { qui: 'directrice', texte: 'Oui, si ce n\'est pas discriminatoire. Par exemple, à cause du règlement intérieur ou des nécessités de service.', émotion: 'neutre', étape: 2 },
        { officiel: { texte: 'L\'employeur peut refuser l\'autorisation à condition que cela ne soit pas discriminatoire. La décision pourra notamment être motivée par le règlement intérieur ou des nécessités de service.', source: `${p13} (encadré)` }, étape: 2 },
        { qui: 'directrice', texte: 'Ce jour-là, c\'est possible : c\'est d\'accord.', émotion: 'joie', étape: 2 },
      ],
    },
    {
      id: 'chapitre-d', titre: 'd) À l\'école publique', décor: 'carton', visuel: 'carton', carton: { lettre: 'd', titre: 'La laïcité à l\'école publique', sous: 'Les établissements scolaires publics' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Deuxième lieu : l\'école.', son: 'whoosh' }],
    },
    {
      id: 'ecole', titre: 'Une école neutre', décor: 'salle-classe', visuel: 'ecole-neutre', ambiance: 'salle', musique: 'chaleureux', transition: 'lumiere', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 26, regard: 'droite', échelle: 0.72 }, { id: 'enseignante', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Au même moment, à l\'école de Zoé, la petite-fille de M. Arnaud.', son: 'carillon' },
        { qui: 'zoe', texte: 'Maîtresse, à l\'école, on a le droit de penser ce qu\'on veut ?', émotion: 'réflexion' },
        { qui: 'enseignante', texte: 'Oui, Zoé. L\'école publique est neutre : elle vous permet de penser librement et de vous construire vos propres opinions.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Les établissements scolaires publics et les personnels de l\'Éducation nationale sont neutres vis-à-vis des religions. L\'application du principe de laïcité à l\'école vise à garantir la liberté de conscience des élèves, en leur permettant de penser librement, de se construire eux-mêmes leurs opinions, à l\'abri des pressions et des influences.', source: p13 }, étape: 1 },
      ],
    },
    {
      id: 'charte', titre: 'La Charte de la laïcité à l\'École', décor: 'salle-classe', visuel: 'charte', ambiance: 'salle', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,230,180,.6)',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'enseignante', x: 24, regard: 'droite' }, { id: 'zoe', x: 76, regard: 'gauche', échelle: 0.72 }],
      temps: [
        { qui: 'enseignante', texte: 'Toutes les règles de la laïcité à l\'école sont réunies dans la Charte de la laïcité à l\'École.', étape: 1, son: 'page' },
        { officiel: { texte: 'L\'ensemble des règles permettant de garantir l\'application de la laïcité dans les écoles est listé dans la Charte de la laïcité à l\'École.', source: p13 }, étape: 1 },
        { qui: 'zoe', texte: 'Elle est pour qui ?', émotion: 'réflexion', étape: 2 },
        { qui: 'enseignante', texte: 'Pour tout le monde : les professeurs, les animateurs, les élèves, et aussi les parents.', émotion: 'sourire', étape: 2 },
        { officiel: { texte: 'Elle s\'adresse à l\'ensemble des personnels de l\'établissement (professeurs, animateurs périscolaires…), aux élèves ainsi qu\'aux parents d\'élèves.', source: p13 }, étape: 2 },
      ],
    },
    {
      id: 'signes', titre: 'La loi du 15 mars 2004', décor: 'salle-classe', visuel: 'loi-2004', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,230,180,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 26, regard: 'droite', échelle: 0.72 }, { id: 'enseignante', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'zoe', texte: 'Et un signe religieux, on peut le porter en classe ?', émotion: 'réflexion' },
        { qui: 'enseignante', texte: 'Depuis la loi du 15 mars 2004, pas un signe ou un vêtement qui montre sa religion de manière ostensible : qu\'on voit immédiatement.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { qui: 'enseignante', texte: 'Les signes discrets, eux, sont autorisés.', émotion: 'sourire', étape: 2 },
        { officiel: { texte: 'Parmi ces règles, comme le prévoit la loi du 15 mars 2004, il est interdit de porter un signe ou un vêtement qui montre sa religion de manière ostensible, c\'est-à-dire que l\'on peut voir immédiatement. Les signes discrets sont autorisés.', source: p13 }, étape: 2 },
      ],
    },
    {
      id: 'programme', titre: 'Le programme pour tous', décor: 'place-mairie-soir', visuel: 'programme', ambiance: 'soir', musique: 'tendre', transition: 'lumiere', lumière: 'rgba(255,200,150,.6)',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 26, regard: 'droite', échelle: 0.72 }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'À la sortie de l\'école, M. Arnaud attend Zoé.', son: 'pas' },
        { qui: 'zoe', texte: 'Papi, aujourd\'hui on a eu sciences et sport. Toute la classe participe !', émotion: 'joie' },
        { qui: 'arnaud', texte: 'C\'est la règle : on ne peut pas refuser, à cause de sa religion, une règle de l\'école ou un enseignement du programme.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Il n\'est également pas possible de refuser, en raison de sa religion, une règle de fonctionnement ou un enseignement du programme scolaire.', source: p13 }, étape: 1 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'place-mairie-soir', visuel: 'travail-ecole', ambiance: 'soir', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,200,150,.65)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 16, regard: 'droite', échelle: 0.8 }, { id: 'zoe', x: 46, regard: 'droite', échelle: 0.66 }, { id: 'lina', x: 80, regard: 'gauche', échelle: 0.86 }],
      temps: [
        { qui: 'lina', texte: 'Les agents publics restent neutres, les salariés du privé sont libres dans certaines limites…', émotion: 'joie', étape: 1 },
        { qui: 'zoe', texte: '… et à l\'école, il y a la Charte de la laïcité !', émotion: 'fier', étape: 1 },
        { qui: 'arnaud', texte: 'Bravo, toutes les deux.', émotion: 'fier', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : une République démocratique et sociale, page 14.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'La laïcité s\'applique-t-elle de la même manière aux agents publics et aux salariés du privé ?', r: 'Non, elle ne s\'applique pas de la même manière', f: ['Oui, exactement de la même manière', 'Elle ne s\'applique qu\'aux salariés du privé'], scène: 'public-prive' },
    { q: 'Au travail, un agent public peut-il porter un signe religieux ?', r: 'Non : pour garantir la neutralité de l\'État, il ne peut pas montrer sa religion', f: ['Oui, s\'il est discret', 'Oui, avec l\'accord de ses collègues'], scène: 'agent-public' },
    { q: 'Les salariés des entreprises privées peuvent-ils exprimer leurs opinions religieuses ?', r: 'Oui, y compris par des tenues ou des signes, sauf si cela perturbe le bon fonctionnement de l\'entreprise ou pour des raisons de sécurité', f: ['Non, jamais au travail', 'Oui, sans aucune limite'], scène: 'entreprise' },
    { q: 'Dans quel cadre l\'employeur peut-il imposer des limites à la liberté de manifester son appartenance religieuse ?', r: 'Dans le cadre du règlement intérieur, si elles sont justifiées par la nature des tâches', f: ['Selon ses préférences personnelles', 'Selon la religion du salarié'], scène: 'reglement' },
    { q: 'Un salarié ou un agent public peut-il demander une autorisation d\'absence pour une fête religieuse ?', r: 'Oui, il peut la solliciter auprès de son employeur', f: ['Non, c\'est interdit', 'Oui, et l\'employeur doit toujours accepter'], scène: 'absence' },
    { q: 'L\'employeur peut-il refuser cette autorisation d\'absence ?', r: 'Oui, à condition que ce ne soit pas discriminatoire (règlement intérieur, nécessités de service…)', f: ['Non, jamais', 'Oui, pour n\'importe quelle raison'], scène: 'absence', o: 1 },
    { q: 'À quoi vise l\'application de la laïcité à l\'école ?', r: 'À garantir la liberté de conscience des élèves, à l\'abri des pressions et des influences', f: ['À enseigner une religion commune', 'À interdire de parler de religion'], scène: 'ecole' },
    { q: 'Où sont listées les règles de la laïcité à l\'école ?', r: 'Dans la Charte de la laïcité à l\'École', f: ['Dans le Code de la route', 'Dans le règlement de la mairie'], scène: 'charte' },
    { q: 'À qui s\'adresse la Charte de la laïcité à l\'École ?', r: 'Aux personnels de l\'établissement, aux élèves et aux parents d\'élèves', f: ['Seulement aux professeurs', 'Seulement aux élèves'], scène: 'charte', o: 1 },
    { q: 'Que prévoit la loi du 15 mars 2004 à l\'école publique ?', r: 'L\'interdiction de porter un signe ou un vêtement qui montre sa religion de manière ostensible', f: ['L\'interdiction de tout signe, même discret', 'L\'obligation de porter un uniforme'], scène: 'signes' },
    { q: 'À l\'école publique, les signes religieux discrets sont…', r: 'autorisés', f: ['interdits', 'autorisés seulement le vendredi'], scène: 'signes' },
    { q: 'Peut-on refuser un enseignement du programme scolaire en raison de sa religion ?', r: 'Non, ce n\'est pas possible', f: ['Oui, sur simple demande', 'Oui, avec un mot des parents'], scène: 'programme' },
  ],
}

// Contrôle de fidélité : chaque notion de la page 13 et la scène qui la montre.
export const COUVERTURE = [
  ['La laïcité ne s\'applique pas de la même manière aux agents publics et aux salariés du privé', 'public-prive'],
  ['Agents publics : ni religion ni opinions montrées, ni signes, ni pratique au travail', 'agent-public'],
  ['Salariés du privé : droit d\'exprimer leurs opinions religieuses (tenues, signes), sauf fonctionnement ou sécurité', 'entreprise'],
  ['Règlement intérieur : limites justifiées par la nature des tâches', 'reglement'],
  ['Encadré : absence pour une fête religieuse ; refus possible s\'il n\'est pas discriminatoire', 'absence'],
  ['École publique neutre ; liberté de conscience des élèves', 'ecole'],
  ['Charte de la laïcité à l\'École ; pour les personnels, les élèves et les parents', 'charte'],
  ['Loi du 15 mars 2004 : signes ostensibles interdits, signes discrets autorisés', 'signes'],
  ['Pas de refus d\'une règle ou d\'un enseignement au nom de sa religion', 'programme'],
]
