// Expérience narrative cinématographique — PROTOTYPE, page 11 uniquement.
// « La laïcité au quotidien » : 1. La neutralité de l'État, 2. Le prosélytisme,
// 3. Le blasphème (suite des principes de la République).
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 11. Personnages, lieux et dialogues sont fictifs ; ils n'énoncent
// que ce que dit la page. Aucune religion réelle n'est mise en scène.
import { VOIX_P11 } from './voixP11.js'
import { PERSONNAGES as CASTING } from './p10.js'

const p11 = 'Livret du citoyen, page 11'

export const PERSONNAGES = {
  ...CASTING,
  agente: { nom: 'Mme Roux', rôle: 'agente d\'accueil de la mairie, personnage fictif', couleur: '#34d399', peau: '#e8b896', yeux: '#3b2a1a', cheveux: { style: 'courts', couleur: '#7a3b1e' }, tenue: { style: 'veste', couleur: '#1e3a8a' }, lunettes: true, voix: { genre: 'f', pitch: 1.0, rate: 1.0 } },
  paul: { nom: 'Paul', rôle: 'membre d\'une association religieuse, personnage fictif', couleur: '#fbbf24', peau: '#c98e64', yeux: '#2a1a10', cheveux: { style: 'courts', couleur: '#1a120c' }, tenue: { style: 'tshirt', couleur: '#0f766e' }, voix: { genre: 'm', pitch: 0.98, rate: 1.02 } },
}

export const COURT_MÉTRAGE = {
  page: 11,
  titre: 'La laïcité au quotidien',
  sousTitre: 'Neutralité de l\'État, prosélytisme, blasphème',
  avertissement: 'Personnages et situations fictifs. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P11,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'place-mairie', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', particules: 'feuilles',
      caméra: { de: { x: 3, z: 1.16 }, à: { x: -2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Lundi matin. Lina accompagne M. Arnaud à la mairie, pour une démarche.' },
        { qui: 'narrateur', texte: 'En chemin, ils reprennent leur leçon sur la laïcité.', son: 'pas' },
      ],
    },
    {
      id: 'chapitre-1', titre: '1. La neutralité de l\'État', décor: 'carton', visuel: 'carton', carton: { lettre: '1', titre: 'La neutralité de l\'État', sous: 'Les principes de la République (suite)' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Premier point : la neutralité de l\'État.', son: 'whoosh' }],
    },
    {
      id: 'separation', titre: 'La loi de 1905', décor: 'place-mairie', visuel: 'separation', ambiance: 'rue', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 22, regard: 'droite' }, { id: 'arnaud', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'La laïcité, concrètement, qu\'est-ce que ça change pour l\'État ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'L\'État et les organisations religieuses sont séparés. C\'est la loi de 1905 sur la séparation des Églises et de l\'État.', émotion: 'sourire', geste: 'explique', étape: 1, son: 'page' },
        { qui: 'lina', texte: 'Et la loi est la même pour tout le monde, quelle que soit sa religion ?', émotion: 'réflexion', étape: 2 },
        { officiel: { texte: 'Le principe de laïcité implique que l\'État et les organisations religieuses sont séparés (loi de 1905 sur la séparation des Églises et de l\'État). Il impose également que la loi est la même pour tout le monde, quelles que soient sa religion ou ses convictions.', source: p11 }, étape: 2 },
      ],
    },
    {
      id: 'regles', titre: 'Ce que l\'État ne fait pas', décor: 'place-mairie', visuel: 'regles-etat', ambiance: 'rue', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,230,180,.6)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 20, regard: 'droite', échelle: 0.88 }, { id: 'lina', x: 80, regard: 'gauche', échelle: 0.88 }],
      temps: [
        { qui: 'arnaud', texte: 'Par conséquent, l\'État ne soutient aucune organisation religieuse.', étape: 1, son: 'bloc' },
        { qui: 'arnaud', texte: 'Il les considère toutes de la même manière, et il n\'est pas impliqué dans leur fonctionnement interne.', étape: 2 },
        { officiel: { texte: 'Par conséquent, l\'État ne soutient aucune organisation religieuse, les considère toutes de la même manière et n\'est pas impliqué dans leur fonctionnement interne.', source: p11 }, étape: 2 },
        { qui: 'lina', texte: 'Donc l\'État ne finance pas la construction d\'un édifice religieux ?', émotion: 'réflexion', étape: 3 },
        { qui: 'arnaud', texte: 'Non. Et il ne paie pas non plus de personnel religieux.', émotion: 'neutre', étape: 3, son: 'bloc' },
        { officiel: { texte: 'L\'État n\'a, par exemple, pas le droit de financer la construction d\'un édifice religieux, ni de payer un personnel religieux.', source: p11 }, étape: 3 },
      ],
    },
    {
      id: 'alsace', titre: 'L\'exception de l\'Alsace et de la Moselle', décor: 'plan', visuel: 'carte-alsace', ambiance: 'souffle', musique: 'réflexion', transition: 'lumiere', focus: 'fond',
      caméra: { de: { x: 0, z: 1.1 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'arnaud', texte: 'Il y a cependant quelques exceptions.', étape: 1 },
        { qui: 'arnaud', texte: 'En Alsace et en Moselle, en raison de l\'Histoire, l\'État a des accords spéciaux avec certaines religions.', étape: 2, son: 'carillon' },
        { officiel: { texte: 'Cependant, il y a quelques exceptions, comme en Alsace et en Moselle, où l\'État, en raison de l\'Histoire, a des accords spéciaux avec certaines religions.', source: p11 }, étape: 2 },
      ],
    },
    {
      id: 'patrimoine', titre: 'Un monument classé', décor: 'monument', visuel: 'patrimoine', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,220,170,.7)', particules: 'poussiere',
      caméra: { de: { x: -2, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 18, regard: 'droite', échelle: 0.84 }, { id: 'arnaud', x: 82, regard: 'gauche', échelle: 0.84 }],
      temps: [
        { qui: 'lina', texte: 'Et ce vieux monument religieux en travaux ? L\'État n\'a pas le droit de l\'aider ?', émotion: 'surprise' },
        { qui: 'arnaud', texte: 'Si : il est classé au patrimoine. L\'État a la possibilité de financer sa restauration.', émotion: 'sourire', geste: 'montre', étape: 1, son: 'carillon' },
        { officiel: { texte: 'L\'État a la possibilité de financer la restauration d\'un monument religieux classé au patrimoine.', source: `${p11} (encadré)` }, étape: 1 },
        { qui: 'lina', texte: 'Construire, non. Restaurer un monument classé, oui.', émotion: 'joie', étape: 2 },
      ],
    },
    {
      id: 'guichet', titre: 'Au guichet de la mairie', décor: 'guichet-mairie', visuel: 'neutres', ambiance: 'salle', musique: 'chaleureux', transition: 'fondu', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 14, regard: 'droite', échelle: 0.74 }, { id: 'lina', x: 44, regard: 'droite', échelle: 0.8 }, { id: 'agente', x: 82, regard: 'gauche', échelle: 0.8 }],
      temps: [
        { qui: 'narrateur', texte: 'À la mairie, chacun attend son tour au guichet.', son: 'carillon' },
        { qui: 'agente', texte: 'Numéro 42 ! Bonjour, que puis-je faire pour vous ?', émotion: 'sourire' },
        { qui: 'lina', texte: 'Ici, tout le monde est servi pareil, quelle que soit sa religion ?', émotion: 'réflexion', étape: 1 },
        { qui: 'agente', texte: 'Bien sûr. L\'État, les collectivités territoriales et les services publics sont neutres vis-à-vis des religions.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'L\'État, les collectivités territoriales et les services publics sont neutres vis-à-vis des religions.', source: p11 }, étape: 1 },
        { qui: 'arnaud', texte: 'Chacun est traité de la même manière par l\'administration : c\'est la neutralité de l\'État.', étape: 2 },
        { officiel: { texte: 'La République française garantit à tous les citoyens d\'être traités de la même manière par l\'administration et les services publics, quelles que soient leur religion ou leurs convictions. C\'est ce que l\'on appelle la neutralité de l\'État.', source: p11 }, étape: 2 },
      ],
    },
    {
      id: 'chapitre-2', titre: '2. Le prosélytisme', décor: 'carton', visuel: 'carton', carton: { lettre: '2', titre: 'Le prosélytisme', sous: 'Convaincre, sans forcer' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Deuxième point : le prosélytisme.', son: 'whoosh' }],
    },
    {
      id: 'tracts', titre: 'Des tracts dans la rue', décor: 'place-mairie', visuel: 'proselytisme', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,236,190,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'paul', x: 18, regard: 'droite', échelle: 0.8 }, { id: 'lina', x: 54, regard: 'gauche', échelle: 0.8 }, { id: 'arnaud', x: 86, regard: 'gauche', échelle: 0.74 }],
      temps: [
        { qui: 'narrateur', texte: 'En sortant, devant la mairie, un homme distribue des tracts sur sa religion.', son: 'pas' },
        { qui: 'paul', texte: 'Bonjour ! Vous voulez découvrir ma religion ? Je vous laisse un tract.', émotion: 'sourire', geste: 'montre' },
        { qui: 'lina', texte: 'Merci, je le lirai… mais ce n\'est pas pour moi.', émotion: 'réflexion' },
        { qui: 'paul', texte: 'Pas de souci, bonne journée !', émotion: 'joie' },
        { qui: 'arnaud', texte: 'Ça, c\'est du prosélytisme : vouloir convaincre quelqu\'un d\'adopter sa religion ou ses idées religieuses.', étape: 1 },
        { officiel: { texte: 'Le prosélytisme religieux est le fait de vouloir convaincre quelqu\'un d\'adopter sa religion ou ses idées religieuses.', source: p11 }, étape: 1 },
        { qui: 'lina', texte: 'Et il a le droit de faire ça dans la rue ?', émotion: 'réflexion', étape: 2 },
        { qui: 'arnaud', texte: 'Oui, tant que cela ne trouble pas l\'ordre public.', émotion: 'sourire', étape: 2 },
        { officiel: { texte: 'Il est possible de distribuer des tracts sur une religion dans la rue, tant que cela ne trouble pas l\'ordre public.', source: `${p11} (encadré)` }, étape: 2 },
      ],
    },
    {
      id: 'pression', titre: 'Sans violence, sans menace, sans pression', décor: 'place-mairie', visuel: 'sans-pression', ambiance: 'rue', musique: 'tension', transition: 'flou', lumière: 'rgba(230,235,255,.6)',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 22, regard: 'droite' }, { id: 'lina', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Et s\'il avait insisté ? S\'il m\'avait menacée ?', émotion: 'inquiet' },
        { qui: 'arnaud', texte: 'Là, non. C\'est autorisé seulement sans forcer quelqu\'un à croire contre son gré : ni violence, ni menace, ni pression.', émotion: 'neutre', geste: 'explique', étape: 1, son: 'bloc' },
        { officiel: { texte: 'En France, cela est autorisé, à condition de ne pas forcer quelqu\'un à croire en une religion contre son gré, en utilisant la violence, la menace ou la pression.', source: p11 }, étape: 1 },
      ],
    },
    {
      id: 'service-public', titre: 'Pas dans un service public', décor: 'guichet-mairie', visuel: 'interdit-sp', ambiance: 'salle', musique: 'tension', transition: 'fondu', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'paul', x: 18, regard: 'droite', échelle: 0.8 }, { id: 'arnaud', x: 50, regard: 'droite', échelle: 0.74 }, { id: 'agente', x: 84, regard: 'gauche', échelle: 0.8 }],
      temps: [
        { qui: 'narrateur', texte: 'Un peu plus tard, l\'homme entre dans la mairie avec ses tracts.', son: 'pas' },
        { qui: 'agente', texte: 'Monsieur, pas ici : dans un service public, le prosélytisme est interdit.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { qui: 'paul', texte: 'Ah, pardon. Je ressors.', émotion: 'inquiet', étape: 1 },
        { qui: 'arnaud', texte: 'C\'est l\'application du principe de neutralité de l\'État.', étape: 1 },
        { officiel: { texte: 'Il est par ailleurs interdit de faire du prosélytisme dans les services publics, en application du principe de neutralité de l\'État.', source: p11 }, étape: 1 },
      ],
    },
    {
      id: 'chapitre-3', titre: '3. Le blasphème', décor: 'carton', visuel: 'carton', carton: { lettre: '3', titre: 'Le blasphème', sous: 'Critiquer, se moquer, caricaturer' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Troisième point : le blasphème.', son: 'whoosh' }],
    },
    {
      id: 'caricature', titre: 'Une caricature dans le journal', décor: 'mediatheque', visuel: 'blaspheme', ambiance: 'salle', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,206,140,.65)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 18, regard: 'droite', échelle: 0.84 }, { id: 'lina', x: 82, regard: 'gauche', échelle: 0.84 }],
      temps: [
        { qui: 'narrateur', texte: 'L\'après-midi, à la médiathèque, Lina feuillette un journal satirique.', son: 'page' },
        { qui: 'lina', texte: 'Ce dessin se moque d\'une religion ! C\'est permis ?', émotion: 'surprise' },
        { qui: 'arnaud', texte: 'Un mot d\'abord : le blasphème. C\'est une parole ou un discours qui insulte la divinité, la religion, ou ce qui est considéré comme respectable ou sacré.', étape: 1 },
        { officiel: { texte: 'Le blasphème est une parole ou un discours qui insulte la divinité, la religion ou ce qui est considéré comme respectable ou sacré.', source: p11 }, étape: 1 },
        { qui: 'arnaud', texte: 'En France, ce n\'est pas un délit. Chacun peut critiquer une religion ou s\'en moquer, y compris à travers la caricature.', émotion: 'sourire', étape: 2, son: 'bloc' },
        { officiel: { texte: 'En France, ce n\'est pas un délit. Chacun a le droit de critiquer ou de se moquer d\'une religion, et de s\'exprimer librement, y compris à travers la caricature.', source: p11 }, étape: 2 },
      ],
    },
    {
      id: 'expression', titre: 'La liberté d\'expression', décor: 'visio', visuel: 'expression', étiquettes: [['Lina · Paris', 3], ['Inès · La Réunion', 53]], ambiance: 'visio', musique: 'tendre', transition: 'lumiere',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'narrateur', texte: 'Le soir, Lina raconte sa journée à Inès.', son: 'appel' },
        { qui: 'ines', texte: 'Donc personne ne peut être puni pour avoir critiqué une religion ?', émotion: 'réflexion', étape: 1 },
        { qui: 'lina', texte: 'Non. Chacun peut exprimer son avis : c\'est la liberté d\'expression.', émotion: 'fier', étape: 1 },
        { officiel: { texte: 'Personne ne peut être puni pour avoir critiqué une religion ou insulté une divinité et chacun peut donc exprimer son avis. C\'est la liberté d\'expression.', source: p11 }, étape: 1 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'place-mairie-soir', visuel: 'trois-points', ambiance: 'soir', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,200,150,.65)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 26, regard: 'droite', échelle: 0.9 }, { id: 'lina', x: 70, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Un État neutre, le prosélytisme sans pression, et la liberté de critiquer.', émotion: 'joie', étape: 1 },
        { qui: 'arnaud', texte: 'Tu as tout compris.', émotion: 'fier', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : la laïcité selon les lieux, page 12.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Quelle loi sépare l\'État et les organisations religieuses ?', r: 'La loi de 1905 sur la séparation des Églises et de l\'État', f: ['La loi de 1789 sur les cultes', 'La Constitution de 1946'], scène: 'separation' },
    { q: 'Le principe de laïcité impose que la loi…', r: 'est la même pour tout le monde, quelles que soient sa religion ou ses convictions', f: ['change selon la religion de chacun', 'est fixée par les organisations religieuses'], scène: 'separation' },
    { q: 'L\'État peut-il soutenir une organisation religieuse ?', r: 'Non : il n\'en soutient aucune et les considère toutes de la même manière', f: ['Oui, celle qui compte le plus de membres', 'Oui, s\'il le décide par un vote local'], scène: 'regles' },
    { q: 'L\'État a-t-il le droit de financer la construction d\'un édifice religieux ?', r: 'Non, ni de payer un personnel religieux', f: ['Oui, dans toutes les villes', 'Oui, si l\'édifice est neuf'], scène: 'regles', o: 1 },
    { q: 'Où l\'État a-t-il, en raison de l\'Histoire, des accords spéciaux avec certaines religions ?', r: 'En Alsace et en Moselle', f: ['En Bretagne et en Normandie', 'Dans toutes les régions d\'outre-mer'], scène: 'alsace' },
    { q: 'Que peut financer l\'État ?', r: 'La restauration d\'un monument religieux classé au patrimoine', f: ['Le salaire d\'un personnel religieux', 'La construction d\'un nouvel édifice religieux'], scène: 'patrimoine' },
    { q: 'Qui est neutre vis-à-vis des religions ?', r: 'L\'État, les collectivités territoriales et les services publics', f: ['Seulement les écoles privées', 'Seulement les associations'], scène: 'guichet' },
    { q: 'Qu\'appelle-t-on la neutralité de l\'État ?', r: 'La garantie d\'être traité de la même manière par l\'administration et les services publics, quelles que soient sa religion ou ses convictions', f: ['L\'obligation pour chacun de ne pas avoir de religion', 'L\'interdiction de parler de religion en public'], scène: 'guichet', o: 1 },
    { q: 'Qu\'est-ce que le prosélytisme religieux ?', r: 'Vouloir convaincre quelqu\'un d\'adopter sa religion ou ses idées religieuses', f: ['Critiquer une religion', 'Changer de religion'], scène: 'tracts' },
    { q: 'En France, le prosélytisme est autorisé à condition…', r: 'de ne pas forcer quelqu\'un à croire contre son gré, par la violence, la menace ou la pression', f: ['d\'avoir une autorisation de la mairie', 'de ne parler qu\'à des adultes'], scène: 'pression' },
    { q: 'Où le prosélytisme est-il interdit ?', r: 'Dans les services publics, en application du principe de neutralité de l\'État', f: ['Dans la rue', 'Dans les journaux'], scène: 'service-public' },
    { q: 'Peut-on distribuer des tracts sur une religion dans la rue ?', r: 'Oui, tant que cela ne trouble pas l\'ordre public', f: ['Non, jamais', 'Oui, même dans les services publics'], scène: 'tracts', o: 1 },
    { q: 'En France, le blasphème est-il un délit ?', r: 'Non : chacun peut critiquer ou se moquer d\'une religion, y compris par la caricature', f: ['Oui, il est puni par la loi', 'Oui, sauf dans les journaux'], scène: 'caricature', o: 1 },
  ],
}

// Contrôle de fidélité : chaque notion de la page 11 et la scène qui la montre.
export const COUVERTURE = [
  ['Laïcité : séparation de l\'État et des organisations religieuses (loi de 1905) ; la même loi pour tous', 'separation'],
  ['L\'État ne soutient aucune organisation religieuse, les considère toutes de la même manière, n\'intervient pas dans leur fonctionnement', 'regles'],
  ['Pas de financement de la construction d\'un édifice religieux ni de personnel religieux', 'regles'],
  ['Exceptions : Alsace et Moselle, accords spéciaux en raison de l\'Histoire', 'alsace'],
  ['Encadré : financement possible de la restauration d\'un monument religieux classé', 'patrimoine'],
  ['État, collectivités territoriales et services publics neutres vis-à-vis des religions', 'guichet'],
  ['Neutralité de l\'État : traitement identique par l\'administration et les services publics', 'guichet'],
  ['Prosélytisme religieux : vouloir convaincre d\'adopter sa religion ou ses idées religieuses', 'tracts'],
  ['Encadré : tracts dans la rue possibles sans trouble à l\'ordre public', 'tracts'],
  ['Autorisé sans forcer (violence, menace, pression)', 'pression'],
  ['Interdit dans les services publics (neutralité de l\'État)', 'service-public'],
  ['Blasphème : définition ; pas un délit ; critique, moquerie, caricature', 'caricature'],
  ['Personne ne peut être puni pour avoir critiqué une religion : liberté d\'expression', 'expression'],
]
