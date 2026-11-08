// Expérience narrative cinématographique — PROTOTYPE, page 7 uniquement.
// « Le troisième mot » : l'État contre la haine (fin de B. Égalité), la
// décision d'un employeur, C. Fraternité et ses formes de solidarité.
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 7. Personnages, lieux et dialogues sont fictifs ; ils n'énoncent
// que ce que dit la page.
import { VOIX_P7 } from './voixP7.js'
import { PERSONNAGES as CASTING } from './p10.js'

const p7 = 'Livret du citoyen, page 7'

export const PERSONNAGES = {
  ...CASTING,
  recruteur: { nom: 'Hugo', rôle: 'recruteur, personnage fictif', couleur: '#60a5fa', peau: '#f4d7bc', yeux: '#3b5b7a', cheveux: { style: 'courts', couleur: '#7a4a24' }, tenue: { style: 'veste', couleur: '#334155' }, voix: { genre: 'm', pitch: 1.0, rate: 1.04 } },
  directrice: { nom: 'Mme Diallo', rôle: 'directrice, personnage fictif', couleur: '#fb923c', peau: '#6b4226', yeux: '#2a1a10', cheveux: { style: 'boucles', couleur: '#140c08' }, tenue: { style: 'veste', couleur: '#7c2d12' }, lunettes: true, voix: { genre: 'f', pitch: 0.98, rate: 0.98 } },
}

export const COURT_MÉTRAGE = {
  page: 7,
  titre: 'Le troisième mot',
  sousTitre: 'Contre la haine, la fraternité',
  avertissement: 'Personnages et situations fictifs. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P7,
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'mur-quartier', ambiance: 'rue', musique: 'tension', transition: 'fondu', particules: 'feuilles',
      caméra: { de: { x: -3, z: 1.16 }, à: { x: 2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Dimanche matin, dans le quartier de Lina.' },
        { qui: 'narrateur', texte: 'Pendant la nuit, quelqu\'un a couvert le mur de l\'école de mots de haine.', son: 'pas' },
      ],
    },
    {
      id: 'haine', titre: 'Des mots de haine', décor: 'mur-quartier', ambiance: 'rue', musique: 'tension', transition: 'flou', lumière: 'rgba(220,230,255,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Qui peut écrire ça ? Ces insultes visent des gens pour leur sexe, leur origine, leur religion…', émotion: 'fâché' },
        { qui: 'arnaud', texte: 'Ce n\'est pas une opinion, Lina. C\'est de la haine. Et la République ne la laisse pas faire.', émotion: 'neutre', geste: 'explique' },
        { qui: 'lina', texte: 'La semaine dernière, on a vu que les discriminations sont punies par la loi.', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Et l\'État va plus loin : il lutte activement contre plusieurs formes de haine.', émotion: 'tendre' },
      ],
    },
    {
      id: 'chapitre-haine', titre: 'Contre la haine', décor: 'carton', visuel: 'carton', carton: { lettre: 'B', titre: 'Contre la haine', sous: 'L\'égalité (suite)' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ officiel: { texte: 'À ce titre, l\'État lutte activement contre :', source: p7 }, son: 'whoosh' }],
    },
    {
      id: 'sexisme', titre: 'Le sexisme, le racisme', décor: 'mur-quartier', visuel: 'haines', ambiance: 'rue', musique: 'réflexion', transition: 'volet', lumière: 'rgba(230,235,255,.6)',
      caméra: { de: { x: -2, z: 1.06 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 20, regard: 'droite', échelle: 0.86 }, { id: 'lina', x: 80, regard: 'gauche', échelle: 0.86 }],
      temps: [
        { qui: 'arnaud', texte: 'D\'abord, le sexisme : rabaisser une personne à cause de son sexe.', émotion: 'neutre', étape: 1, son: 'bloc' },
        { officiel: { texte: 'Le sexisme : traitement dénigrant envers une autre personne en raison de son sexe ;', source: p7 }, étape: 1 },
        { qui: 'lina', texte: 'Et le racisme ?', émotion: 'réflexion', étape: 2 },
        { qui: 'arnaud', texte: 'C\'est discriminer une personne pour son origine, ou son appartenance ethnique ou raciale.', étape: 2, son: 'bloc' },
        { officiel: { texte: 'Le racisme : discrimination fondée sur l\'origine ou l\'appartenance ethnique ou raciale d\'une personne ;', source: p7 }, étape: 2 },
      ],
    },
    {
      id: 'antisemitisme', titre: 'Antisémitisme, religion, anti-LGBT+', décor: 'mediatheque', visuel: 'haines', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,206,140,.65)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 18, regard: 'droite', échelle: 0.84 }, { id: 'lina', x: 82, regard: 'gauche', échelle: 0.84 }],
      temps: [
        { qui: 'lina', texte: 'Et l\'antisémitisme, c\'est aussi du racisme ?', émotion: 'réflexion', étape: 3 },
        { qui: 'arnaud', texte: 'Oui : une forme spécifique de racisme et de haine contre les Juifs, nourrie de préjugés et de stéréotypes.', étape: 3, son: 'bloc' },
        { officiel: { texte: 'L\'antisémitisme : forme spécifique de racisme et de haine dirigée contre les Juifs, fondée sur des préjugés, des stéréotypes et des discriminations ;', source: p7 }, étape: 3 },
        { qui: 'arnaud', texte: 'Il y a aussi la discrimination sur critère religieux : à cause de la religion qu\'on suppose à quelqu\'un.', étape: 4, son: 'bloc' },
        { officiel: { texte: 'La discrimination sur critère religieux : discrimination fondée sur la religion supposée de la personne ;', source: p7 }, étape: 4 },
        { qui: 'arnaud', texte: 'Et enfin, la haine anti-LGBT+ : être hostile à des personnes à cause de leur orientation sexuelle.', étape: 5, son: 'bloc' },
        { officiel: { texte: 'La haine et la discrimination anti-LGBT+ : attitudes hostiles à l\'égard des personnes en raison de leur orientation sexuelle.', source: p7 }, étape: 5 },
      ],
    },
    {
      id: 'embauche', titre: 'La bonne raison', décor: 'bureau', visuel: 'pro-perso', ambiance: 'salle', musique: 'tension', transition: 'fondu', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'recruteur', x: 24, regard: 'droite' }, { id: 'directrice', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Lundi, dans une entreprise. Lina a passé un entretien pour un poste de comptable.', son: 'pas' },
        { qui: 'recruteur', texte: 'Sa candidature est la meilleure… mais je préfère engager le fils d\'un ami.', émotion: 'réflexion' },
        { qui: 'directrice', texte: 'Non. On décide sur des raisons professionnelles, comme les compétences. Pas sur des raisons personnelles.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { officiel: { texte: 'Toute décision d\'un employeur (embauche, promotion…) doit être fondée sur des raisons professionnelles et non personnelles.', source: p7 }, étape: 1 },
        { qui: 'directrice', texte: 'Et c\'est pareil pour une promotion.', émotion: 'sourire', étape: 2 },
        { qui: 'recruteur', texte: 'Compris. Alors c\'est Lina qui a le poste.', émotion: 'sourire', étape: 2 },
      ],
    },
    {
      id: 'chapitre-c', titre: 'C. Fraternité', décor: 'carton', visuel: 'carton', carton: { lettre: 'C', titre: 'La fraternité', sous: 'Troisième mot de la devise' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Troisième mot : la fraternité.', son: 'whoosh' }],
    },
    {
      id: 'fraternite', titre: 'Le mur repeint', décor: 'mur-quartier', visuel: 'mains', ambiance: 'rue', musique: 'chaleureux', transition: 'lumiere', lumière: 'rgba(255,220,170,.7)', particules: 'poussiere',
      caméra: { de: { x: -2, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 18, regard: 'droite', échelle: 0.82 }, { id: 'arnaud', x: 82, regard: 'gauche', échelle: 0.82 }],
      temps: [
        { qui: 'narrateur', texte: 'Le même après-midi, les voisins sont venus repeindre le mur. Ensemble.', étape: 1, son: 'pas' },
        { qui: 'lina', texte: 'Il y a des gens de partout ! Je ne connaissais presque personne.', émotion: 'joie', étape: 1 },
        { qui: 'arnaud', texte: 'La France est fondée sur cette volonté de vivre ensemble. C\'est la fraternité.', émotion: 'sourire', étape: 2 },
        { officiel: { texte: 'La France est fondée sur la volonté des citoyens de vivre ensemble. Cette volonté se traduit par la fraternité entre tous.', source: p7 }, étape: 2 },
        { qui: 'lina', texte: 'Voir en l\'autre un semblable, même s\'il est différent.', émotion: 'tendre', étape: 3 },
        { qui: 'arnaud', texte: 'Exactement. Une fraternité civique : elle ne repose ni sur l\'origine, ni sur la religion.', émotion: 'fier', étape: 3 },
        { officiel: { texte: 'Cette fraternité repose sur la capacité à voir en l\'autre un semblable malgré les différences. La fraternité républicaine est donc civique et non basée sur l\'origine ou la religion.', source: p7 }, étape: 3 },
      ],
    },
    {
      id: 'solidarite', titre: 'La fraternité implique la solidarité', décor: 'mediatheque', visuel: 'formes', ambiance: 'salle', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,206,140,.65)',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 18, regard: 'droite', échelle: 0.86 }, { id: 'lina', x: 82, regard: 'gauche', échelle: 0.86 }],
      temps: [
        { qui: 'lina', texte: 'Et concrètement, la fraternité, ça change quoi ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Elle implique la solidarité entre nous. Une solidarité collective, et une solidarité entre les générations.', émotion: 'sourire', étape: 1, son: 'carillon' },
        { officiel: { texte: 'La fraternité implique une solidarité entre les individus qui se décline sous différentes formes :', source: p7 }, étape: 1 },
      ],
    },
    {
      id: 'collective', titre: 'La solidarité collective', décor: 'place-mairie', visuel: 'collective', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 22, regard: 'droite' }, { id: 'lina', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Quand je me suis cassé le poignet, la Sécurité sociale m\'a remboursée.', émotion: 'sourire' },
        { qui: 'arnaud', texte: 'C\'est la solidarité collective : la Nation protège chacun.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Le principe de solidarité signifie que la Nation assure aux individus une protection, par exemple, la Sécurité sociale.', source: p7 }, étape: 1 },
        { qui: 'arnaud', texte: 'Tes impôts aussi : ils financent les services publics, pour tout le monde.', geste: 'montre', étape: 2 },
        { officiel: { texte: 'Remplir ses obligations fiscales est un acte solidaire qui permet de financer les services publics au bénéfice de tous.', source: p7 }, étape: 2 },
        { qui: 'lina', texte: 'Et défendre le pays ?', émotion: 'réflexion', étape: 3 },
        { qui: 'arnaud', texte: 'Chaque citoyen français doit participer à la défense de la Nation, en cas de nécessité.', émotion: 'neutre', étape: 3 },
        { officiel: { texte: 'Le principe de solidarité exige aussi que chaque citoyen français doive participer à la défense de la Nation en cas de nécessité.', source: p7 }, étape: 3 },
      ],
    },
    {
      id: 'generations', titre: 'Entre les générations', décor: 'visio', visuel: 'generations', étiquettes: [['Lina · Paris', 3], ['Inès · La Réunion', 53]], ambiance: 'visio', musique: 'tendre', transition: 'lumiere',
      caméra: { de: { x: 0, z: 1.06 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'lina', x: 25, regard: 'droite', échelle: 0.92 }, { id: 'ines', x: 75, regard: 'gauche', échelle: 0.92 }],
      temps: [
        { qui: 'narrateur', texte: 'Le soir, Lina appelle Inès.', son: 'appel' },
        { qui: 'ines', texte: 'Moi, je travaille. Avec mes cotisations, je participe aux retraites, comme celle de ma grand-mère.', émotion: 'fier', étape: 1 },
        { qui: 'lina', texte: 'Les générations se soutiennent les unes les autres.', émotion: 'tendre', étape: 2 },
        { officiel: { texte: 'Le principe de solidarité se traduit par le soutien entre différentes générations. Par exemple, en cotisant, chaque salarié contribue aux versements des retraites.', source: p7 }, étape: 2 },
      ],
    },
    {
      id: 'inegalites', titre: 'Moins d\'inégalités', décor: 'carton', visuel: 'inegalites', ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.1 }, à: { x: 0, z: 1.0 } },
      temps: [
        { qui: 'narrateur', texte: 'Protéger, financer, se soutenir…', étape: 1 },
        { officiel: { texte: 'La fraternité contribue donc à la réduction des inégalités, notamment sociales.', source: p7 }, étape: 2, son: 'carillon' },
      ],
    },
    {
      id: 'collecte', titre: 'La collecte du quartier', décor: 'place-collecte', visuel: 'collecte', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,236,190,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 20, regard: 'droite', échelle: 0.9 }, { id: 'arnaud', x: 80, regard: 'gauche', échelle: 0.9 }],
      temps: [
        { qui: 'narrateur', texte: 'Le samedi suivant, l\'association du quartier organise une collecte pour une association humanitaire.', son: 'pas' },
        { qui: 'lina', texte: 'Je m\'inscris ! Je tiendrai le stand avec les voisins.', émotion: 'joie' },
        { qui: 'arnaud', texte: 'Tu fais vivre la solidarité et la fraternité. C\'est de la participation citoyenne.', émotion: 'fier', étape: 1 },
        { officiel: { texte: 'L\'organisation de collectes au profit d\'associations humanitaires ou l\'engagement dans une association de quartier constituent d\'autres exemples de participation citoyenne mettant en œuvre le principe républicain de solidarité et de fraternité.', source: p7 }, étape: 1 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'place-mairie-soir', visuel: 'trois-mots', ambiance: 'soir', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,200,150,.65)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 26, regard: 'droite', échelle: 0.9 }, { id: 'lina', x: 70, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Liberté, égalité, fraternité. Cette fois, je connais les trois mots.', émotion: 'joie', étape: 1 },
        { qui: 'arnaud', texte: 'Et la prochaine fois : les symboles de la France.', émotion: 'sourire', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : les symboles de la France, page 8.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Qu\'est-ce que le sexisme ?', r: 'Un traitement dénigrant envers une autre personne en raison de son sexe', f: ['Le choix d\'un métier selon ses goûts', 'Une opinion politique comme une autre'], scène: 'sexisme' },
    { q: 'Le racisme est une discrimination fondée sur…', r: 'l\'origine ou l\'appartenance ethnique ou raciale d\'une personne', f: ['le niveau de diplôme d\'une personne', 'le lieu de travail d\'une personne'], scène: 'sexisme', o: 1 },
    { q: 'L\'antisémitisme est…', r: 'une forme spécifique de racisme et de haine dirigée contre les Juifs', f: ['la critique d\'un parti politique', 'une règle de la laïcité'], scène: 'antisemitisme' },
    { q: 'La discrimination sur critère religieux est fondée sur…', r: 'la religion supposée de la personne', f: ['le casier judiciaire de la personne', 'l\'âge de la personne'], scène: 'antisemitisme', o: 1 },
    { q: 'La haine et la discrimination anti-LGBT+ visent des personnes en raison de…', r: 'leur orientation sexuelle', f: ['leur nationalité', 'leur profession'], scène: 'antisemitisme', o: 2 },
    { q: 'Sur quoi doit être fondée toute décision d\'un employeur (embauche, promotion…) ?', r: 'Sur des raisons professionnelles et non personnelles', f: ['Sur ses préférences personnelles', 'Sur les recommandations de ses amis'], scène: 'embauche' },
    { q: 'Sur quoi la France est-elle fondée, selon le livret ?', r: 'Sur la volonté des citoyens de vivre ensemble', f: ['Sur une religion commune', 'Sur une même origine'], scène: 'fraternite' },
    { q: 'La fraternité républicaine est…', r: 'civique, et non basée sur l\'origine ou la religion', f: ['réservée aux membres d\'une même famille', 'fondée sur une religion d\'État'], scène: 'fraternite', o: 1 },
    { q: 'Lesquels sont des exemples de solidarité collective ?', r: 'La Sécurité sociale, les impôts qui financent les services publics, la défense de la Nation', f: ['Un abonnement privé, un cadeau, un héritage', 'Les soldes, les jeux, les vacances'], scène: 'collective' },
    { q: 'En cotisant, chaque salarié contribue…', r: 'aux versements des retraites', f: ['au salaire de son employeur', 'aux seuls impôts locaux'], scène: 'generations' },
    { q: 'À quoi la fraternité contribue-t-elle ?', r: 'À la réduction des inégalités, notamment sociales', f: ['À l\'augmentation des prix', 'À la fin de toutes les lois'], scène: 'inegalites' },
    { q: 'Organiser une collecte pour une association humanitaire, c\'est…', r: 'un exemple de participation citoyenne mettant en œuvre la solidarité et la fraternité', f: ['une activité interdite sans diplôme', 'une obligation fiscale'], scène: 'collecte' },
  ],
}

// Contrôle de fidélité : chaque notion de la page 7 et la scène qui la montre.
export const COUVERTURE = [
  ['« À ce titre, l\'État lutte activement contre : »', 'chapitre-haine'],
  ['Le sexisme : traitement dénigrant en raison du sexe', 'sexisme'],
  ['Le racisme : discrimination fondée sur l\'origine ou l\'appartenance ethnique ou raciale', 'sexisme'],
  ['L\'antisémitisme : racisme et haine contre les Juifs (préjugés, stéréotypes, discriminations)', 'antisemitisme'],
  ['La discrimination sur critère religieux : religion supposée', 'antisemitisme'],
  ['La haine et la discrimination anti-LGBT+ : orientation sexuelle', 'antisemitisme'],
  ['Décision d\'un employeur : raisons professionnelles et non personnelles', 'embauche'],
  ['La France fondée sur la volonté de vivre ensemble ; fraternité entre tous', 'fraternite'],
  ['Voir en l\'autre un semblable ; fraternité civique, ni origine ni religion', 'fraternite'],
  ['La fraternité implique une solidarité sous différentes formes', 'solidarite'],
  ['Solidarité collective : Sécurité sociale, obligations fiscales, défense de la Nation', 'collective'],
  ['Solidarité intergénérationnelle : cotisations et retraites', 'generations'],
  ['Réduction des inégalités, notamment sociales', 'inegalites'],
  ['Collectes humanitaires, association de quartier : participation citoyenne', 'collecte'],
]
