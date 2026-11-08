// Expérience narrative cinématographique — PROTOTYPE, page 10 uniquement.
// « Les fondations » : les principes de la République (article 1er de la
// Constitution), la Constitution et la hiérarchie des normes, la République
// indivisible, la République laïque.
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 10 (et de la page 78 pour l'article 10 de la DDHC). Les
// personnages, les lieux et les dialogues sont fictifs ; ils n'énoncent que
// ce que dit la page.

const p10 = 'Livret du citoyen, page 10'

export const PERSONNAGES = {
  lina: { nom: 'Lina', rôle: 'prépare son entretien de naturalisation', couleur: '#f59eb5', peau: '#c98e64', yeux: '#5a3b22', cheveux: { style: 'longs', couleur: '#2b1a12' }, tenue: { style: 'veste', couleur: '#f2b134' }, barrette: '#f472b6', voix: { genre: 'f', pitch: 1.08, rate: 1.03 } },
  arnaud: { nom: 'M. Arnaud', rôle: 'ancien professeur, bénévole à la médiathèque', couleur: '#b9a3ff', peau: '#f1c9a5', yeux: '#4a6b8a', cheveux: { style: 'courts', couleur: '#c9c9cf' }, tenue: { style: 'gilet', couleur: '#6b4f8a' }, lunettes: true, moustache: true, voix: { genre: 'm', pitch: 0.9, rate: 0.9 } },
  ines: { nom: 'Inès', rôle: 'amie de Lina, vit à La Réunion', couleur: '#5eead4', peau: '#8d5a3b', yeux: '#3b2416', cheveux: { style: 'boucles', couleur: '#1a0f0a' }, tenue: { style: 'tshirt', couleur: '#22c3a6' }, voix: { genre: 'f', pitch: 1.16, rate: 1.06 } },
  narrateur: { nom: 'Narration', voix: { genre: 'm', pitch: 0.98, rate: 0.94 } },
}

export const COURT_MÉTRAGE = {
  page: 10,
  titre: 'Les fondations',
  sousTitre: 'Les principes de la République',
  avertissement: 'Personnages et situations fictifs. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'rue-soir', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', particules: 'feuilles',
      caméra: { de: { x: -4, z: 1.02 }, à: { x: 3, z: 1.16 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Paris, un soir d\'automne. Lina prépare son entretien de naturalisation.' },
        { qui: 'narrateur', texte: 'Elle a rendez-vous à la médiathèque avec M. Arnaud, un ancien professeur devenu bénévole.', son: 'pas' },
      ],
    },
    {
      id: 'article1', titre: 'L\'article 1er', décor: 'mediatheque', visuel: 'quatre-mots', ambiance: 'salle', musique: 'chaleureux', transition: 'lumiere', lumière: 'rgba(255,206,140,.7)',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 24, regard: 'droite' }, { id: 'lina', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Monsieur Arnaud… Mon entretien approche, et je ne sais pas par où commencer.', émotion: 'inquiet' },
        { qui: 'arnaud', texte: 'Par les fondations, Lina. Tout part d\'un texte : la Constitution du 4 octobre 1958.', émotion: 'sourire', geste: 'explique' },
        { qui: 'arnaud', texte: 'Son article 1er définit les principes de la République. Écoute bien.', émotion: 'tendre', son: 'page' },
        { officiel: { texte: 'Les principes de la République sont définis à l\'article 1er de la Constitution du 4 octobre 1958 qui précise que « La France est une République indivisible, laïque, démocratique et sociale ».', source: p10 }, étape: 1, son: 'carillon' },
        { qui: 'lina', texte: 'Indivisible, laïque, démocratique et sociale… Quatre mots, comme quatre piliers.', émotion: 'surprise', étape: 1 },
        { qui: 'arnaud', texte: 'Ce soir, on bâtit les deux premiers : indivisible et laïque.', émotion: 'sourire', étape: 1 },
      ],
    },
    {
      id: 'plan', titre: 'Un acte fondateur', décor: 'plan', visuel: 'plan', ambiance: 'salle', musique: 'réflexion', transition: 'volet',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      temps: [
        { qui: 'arnaud', texte: 'Imagine les plans d\'une maison : avant de construire, on fixe les règles de base.', étape: 1, son: 'crayon' },
        { officiel: { texte: 'La Constitution est un acte fondateur d\'un État. C\'est un ensemble de règles fondamentales qui définissent comment le pays est organisé et dirigé.', source: p10 }, étape: 2 },
        { qui: 'lina', texte: 'Donc la Constitution, c\'est le plan de base : comment le pays est organisé, et comment il est dirigé.', étape: 2 },
      ],
    },
    {
      id: 'hierarchie', titre: 'La hiérarchie des normes', décor: 'hierarchie', visuel: 'pyramide', ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.25 }, à: { x: 0, z: 1.0 } }, focus: 'fond',
      temps: [
        { qui: 'arnaud', texte: 'Dans un État de droit, les règles sont rangées. En bas, toutes les lois…', étape: 1, son: 'bloc' },
        { qui: 'arnaud', texte: '… et tout en haut, la Constitution.', étape: 2, son: 'carillon' },
        { officiel: { texte: 'Dans un État de droit, la Constitution se situe tout en haut de la hiérarchie des normes, c\'est-à-dire qu\'elle est au-dessus de toutes les lois.', source: p10 }, étape: 2 },
        { qui: 'lina', texte: 'Au-dessus de toutes les lois… C\'est ça, la hiérarchie des normes.', étape: 2 },
      ],
    },
    {
      id: 'pouvoirs', titre: 'Droits et pouvoirs', décor: 'pouvoirs', visuel: 'pouvoirs', ambiance: 'souffle', musique: 'élévation', transition: 'fondu',
      caméra: { de: { x: 0, z: 1.18 }, à: { x: 0, z: 1.0 } }, focus: 'fond',
      temps: [
        { qui: 'arnaud', texte: 'En France, la Constitution fixe les droits et libertés des citoyens.', étape: 1 },
        { qui: 'arnaud', texte: 'Elle explique comment les pouvoirs sont partagés : le gouvernement, le Parlement et les tribunaux…', étape: 2, son: 'bloc' },
        { qui: 'arnaud', texte: '… et elle encadre leur fonctionnement.', étape: 3, son: 'carillon' },
        { officiel: { texte: 'En France, elle fixe les droits et libertés des citoyens, explique comment les pouvoirs (le gouvernement, le Parlement et les tribunaux) sont partagés et encadre leur fonctionnement.', source: p10 }, étape: 3 },
      ],
    },
    {
      id: 'chapitre-a', titre: 'A. Indivisible', décor: 'carton', visuel: 'carton', carton: { lettre: 'A', titre: 'Une République indivisible', sous: 'Premier pilier' }, ambiance: 'souffle', musique: 'élévation', transition: 'lumiere',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Premier pilier : une République indivisible.', son: 'whoosh' }],
    },
    {
      id: 'journal', titre: 'Personne ne décide à la place de tous', décor: 'mediatheque', visuel: 'journal', ambiance: 'salle', musique: 'tension', transition: 'flou', lumière: 'rgba(255,206,140,.6)',
      caméra: { de: { x: 3, z: 1.06 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 22, regard: 'droite' }, { id: 'lina', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Regardez ce titre ! Un groupe veut décider à la place de tout le quartier.', émotion: 'fâché', étape: 1, son: 'page' },
        { qui: 'arnaud', texte: 'Il n\'en a pas le droit. Aucun individu ou groupe ne peut décider à la place de l\'ensemble des Français.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { qui: 'arnaud', texte: 'Les décisions sont prises par les représentants élus par le peuple… ou par le peuple lui-même, lors de référendums.', émotion: 'sourire', étape: 2 },
        { officiel: { texte: 'Aucun individu ou groupe ne peut décider à la place de l\'ensemble des Français. Les décisions sont prises par les représentants élus par le peuple ou par le peuple lui-même lors de référendums.', source: p10 }, étape: 2 },
      ],
    },
    {
      id: 'unite', titre: 'Métropole et outre-mer', décor: 'visio', visuel: 'fil', étiquettes: [['Lina · Paris', 3], ['Inès · La Réunion', 53]], ambiance: 'visio', musique: 'chaleureux', transition: 'volet',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'narrateur', texte: 'Plus tard, Lina appelle son amie Inès, qui vit à La Réunion.', son: 'appel' },
        { qui: 'ines', texte: 'Ici, il fait déjà grand soleil ! Alors, ta révision ?', émotion: 'joie' },
        { qui: 'lina', texte: 'On a parlé de l\'unité de la République. Toi à La Réunion, moi à Paris…', émotion: 'sourire' },
        { qui: 'ines', texte: '… mêmes lois, mêmes droits et mêmes devoirs. En métropole comme en outre-mer !', émotion: 'fier', étape: 1, son: 'carillon' },
        { officiel: { texte: 'Cela signifie que tous les Français, partout dans le pays, métropole et outre-mer, sont soumis aux mêmes lois et ont les mêmes droits et devoirs. C\'est ce qu\'on appelle l\'unité de la République.', source: p10 }, étape: 1 },
        { qui: 'ines', texte: 'Et une seule langue officielle pour tout le pays : le français.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'De plus, la France a une seule langue officielle qui est le français.', source: p10 }, étape: 1 },
      ],
    },
    {
      id: 'chapitre-b', titre: 'B. Laïque', décor: 'carton', visuel: 'carton', carton: { lettre: 'B', titre: 'Une République laïque', sous: 'Deuxième pilier', calendrier: true }, ambiance: 'souffle', musique: 'réflexion', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'narrateur', texte: 'Deuxième pilier : une République laïque.', son: 'whoosh' },
        { officiel: { texte: 'La laïcité est un principe essentiel de la République, de valeur constitutionnelle et est officiellement célébrée en France le 9 décembre.', source: p10 }, étape: 1, son: 'page' },
      ],
    },
    {
      id: 'conscience', titre: 'La liberté de conscience', décor: 'mediatheque-nuit', visuel: 'lanternes', ambiance: 'salle', musique: 'tendre', transition: 'fondu', lumière: 'rgba(255,196,120,.75)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 20, regard: 'droite', échelle: 0.86 }, { id: 'lina', x: 80, regard: 'gauche', échelle: 0.86 }],
      temps: [
        { qui: 'lina', texte: 'La laïcité, c\'est être contre les religions ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Non. Elle garantit la liberté de conscience pour tous.', émotion: 'tendre', geste: 'cœur' },
        { qui: 'arnaud', texte: 'Chacun est libre d\'avoir une religion…', étape: 1, son: 'lanterne' },
        { qui: 'arnaud', texte: '… de ne pas en avoir…', étape: 2, son: 'lanterne' },
        { qui: 'arnaud', texte: '… d\'en changer : c\'est le droit de se convertir…', étape: 3, son: 'lanterne' },
        { qui: 'arnaud', texte: '… ou de ne plus en avoir.', étape: 4, son: 'lanterne' },
        { officiel: { texte: 'La laïcité garantit la liberté de conscience pour tous, c\'est-à-dire que chaque personne est libre d\'avoir ou de ne pas avoir de religion, d\'en changer (droit de se convertir) ou de ne plus en avoir.', source: p10 }, étape: 5 },
        { qui: 'lina', texte: 'Et quelqu\'un qui ne croit en aucune religion, on dit quoi ?', émotion: 'réflexion', étape: 5 },
        { qui: 'arnaud', texte: 'On dit qu\'il est athée. Et quelqu\'un qui est sceptique vis-à-vis de la religion est agnostique.', émotion: 'sourire', étape: 5 },
        { officiel: { texte: 'Une personne est dite « athée » lorsqu\'elle ne croit en aucune religion et « agnostique » lorsqu\'elle est sceptique vis-à-vis de la religion.', source: `${p10} (encadré)` }, étape: 5 },
      ],
    },
    {
      id: 'article10', titre: 'Manifester ses croyances', décor: 'parchemin', visuel: 'parchemin', ambiance: 'bougie', musique: 'réflexion', transition: 'flou',
      caméra: { de: { x: 0, z: 1.16 }, à: { x: 0, z: 1.02 } }, focus: 'fond',
      temps: [
        { qui: 'arnaud', texte: 'La laïcité garantit aussi la liberté de manifester ses croyances ou convictions, et de pratiquer sa religion…' },
        { qui: 'arnaud', texte: '… dans les limites du respect de l\'ordre public, comme le dit l\'article 10 de la Déclaration de 1789.', étape: 1, son: 'plume' },
        { officiel: { texte: '« Nul ne doit être inquiété pour ses opinions, même religieuses, pourvu que leur manifestation ne trouble pas l\'ordre public établi par la Loi. »', source: 'Déclaration des droits de l\'homme et du citoyen de 1789, article 10 — Livret du citoyen, page 78' }, étape: 1 },
        { officiel: { texte: 'Elle garantit la liberté de manifester ses croyances ou convictions et de pratiquer sa religion dans les limites du respect de l\'ordre public comme cela est mentionné dans l\'article 10 de la Déclaration des droits de l\'homme et du citoyen de 1789 (DDHC – voir à la fin du livret).', source: p10 }, étape: 1 },
      ],
    },
    {
      id: 'cultes', titre: 'Les cultes et l\'État', décor: 'cultes', ambiance: 'soir', musique: 'tendre', transition: 'lumiere',
      caméra: { de: { x: -3, z: 1.1 }, à: { x: 3, z: 1.0 } }, focus: 'fond',
      temps: [
        { qui: 'narrateur', texte: 'Le soir tombe sur la ville. Chacun peut pratiquer son culte.', étape: 1 },
        { qui: 'arnaud', texte: 'La laïcité garantit le libre exercice des cultes et le respect de toutes les croyances.', étape: 1 },
        { qui: 'arnaud', texte: 'Et elle impose la neutralité de l\'État.', étape: 2, son: 'carillon' },
        { officiel: { texte: 'La laïcité garantit le libre exercice des cultes et le respect de toutes les croyances. Elle impose la neutralité de l\'État.', source: p10 }, étape: 2 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'rue-nuit', ambiance: 'nuit', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(200,220,255,.6)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 64, regard: 'gauche' }, { id: 'arnaud', x: 26, regard: 'droite', échelle: 0.9 }],
      temps: [
        { qui: 'lina', texte: 'Indivisible… laïque… Les fondations, je les ai.', émotion: 'fier' },
        { qui: 'arnaud', texte: 'La prochaine fois, on verra comment la laïcité s\'applique au quotidien.', émotion: 'sourire', geste: 'explique' },
        { officiel: { texte: 'Afin de mieux comprendre ce concept important de laïcité, vous trouverez ci-après des précisions sur ses modalités d\'application dans différents domaines.', source: p10 } },
        { qui: 'narrateur', texte: 'À suivre : la laïcité au quotidien, page 11.' },
      ],
    },
  ],
  // Quiz final : uniquement des notions de la page 10.
  quiz: [
    { q: 'Selon l\'article 1er de la Constitution du 4 octobre 1958, la France est une République…', r: 'indivisible, laïque, démocratique et sociale', f: ['fédérale, laïque et démocratique', 'indivisible, religieuse et sociale'], scène: 'article1' },
    { q: 'Dans un État de droit, où se situe la Constitution ?', r: 'Tout en haut de la hiérarchie des normes, au-dessus de toutes les lois', f: ['Au même niveau que les lois', 'En dessous des lois votées par le Parlement'], scène: 'hierarchie' },
    { q: 'Entre quels pouvoirs la Constitution explique-t-elle le partage ?', r: 'Le gouvernement, le Parlement et les tribunaux', f: ['Les régions, les départements et les communes', 'Les associations et les partis politiques'], scène: 'pouvoirs' },
    { q: 'Qui prend les décisions dans une République indivisible ?', r: 'Les représentants élus par le peuple, ou le peuple lui-même lors de référendums', f: ['Un groupe de citoyens, s\'il est majoritaire dans sa ville', 'Chaque région, selon ses propres lois'], scène: 'journal' },
    { q: 'En métropole et en outre-mer, les Français…', r: 'sont soumis aux mêmes lois et ont les mêmes droits et devoirs', f: ['ont des lois différentes selon le territoire', 'ont les mêmes droits mais pas les mêmes devoirs'], scène: 'unite' },
    { q: 'Quelle est la langue officielle de la France ?', r: 'Le français, seule langue officielle', f: ['Le français et l\'anglais', 'Chaque région choisit la sienne'], scène: 'unite', o: 1 },
    { q: 'À quelle date la laïcité est-elle officiellement célébrée en France ?', r: 'Le 9 décembre', f: ['Le 14 juillet', 'Le 4 octobre'], scène: 'chapitre-b' },
    { q: 'La liberté de conscience, c\'est…', r: 'être libre d\'avoir ou non une religion, d\'en changer ou de ne plus en avoir', f: ['l\'obligation de n\'avoir aucune religion', 'le devoir de pratiquer la religion de l\'État'], scène: 'conscience' },
    { q: 'Une personne « agnostique » est une personne…', r: 'sceptique vis-à-vis de la religion', f: ['qui ne croit en aucune religion', 'qui pratique plusieurs religions'], scène: 'conscience', o: 1 },
    { q: 'La liberté de manifester ses croyances s\'exerce…', r: 'dans les limites du respect de l\'ordre public (article 10 de la DDHC)', f: ['sans aucune limite', 'uniquement dans un lieu de culte'], scène: 'article10', o: 1 },
  ],
}

// Contrôle de fidélité : chaque notion de la page 10 et la scène qui la montre.
export const COUVERTURE = [
  ['Article 1er de la Constitution du 4 octobre 1958 : indivisible, laïque, démocratique et sociale', 'article1'],
  ['La Constitution, acte fondateur : règles fondamentales, organisation et direction du pays', 'plan'],
  ['État de droit : la Constitution en haut de la hiérarchie des normes, au-dessus de toutes les lois', 'hierarchie'],
  ['Droits et libertés des citoyens ; partage des pouvoirs (gouvernement, Parlement, tribunaux) et encadrement', 'pouvoirs'],
  ['Indivisible : aucun individu ou groupe ne décide à la place de tous ; représentants élus ou référendum', 'journal'],
  ['Unité de la République : mêmes lois, droits et devoirs, en métropole et en outre-mer', 'unite'],
  ['Une seule langue officielle : le français', 'unite'],
  ['Laïcité : principe essentiel, de valeur constitutionnelle, célébré le 9 décembre', 'chapitre-b'],
  ['Liberté de conscience : avoir, ne pas avoir, changer (se convertir), ne plus avoir de religion', 'conscience'],
  ['Encadré : athée, agnostique', 'conscience'],
  ['Manifester ses croyances dans les limites de l\'ordre public (article 10 de la DDHC)', 'article10'],
  ['Libre exercice des cultes, respect de toutes les croyances, neutralité de l\'État', 'cultes'],
  ['Annonce : précisions sur l\'application de la laïcité (pages suivantes)', 'final'],
]
