// Livret du citoyen, page par page (pages 3 à 25) : pour chaque page, quelques
// diapositives animées qui reprennent son contenu, puis un « Vrai ou faux ? ».
// Mêmes types de diapositives que le cours (titre, points, frise, duo,
// chiffres, question, schéma, personnes, carte, article, devise), plus
// « nuage » (mots-clés) et « vraiFaux ».

const vf = (texte, vrai, explication) => [texte, vrai, explication]

export const PAGES_LIVRET = [
  {
    page: 3, titre: 'Avant-propos', emoji: '📖',
    diapos: [
      { type: 'titre', emoji: '🤝', titre: 'Rejoindre la communauté nationale', texte: 'Demander la nationalité, c\'est montrer sa volonté de rejoindre la communauté nationale, de respecter ses valeurs et de l\'enrichir.' },
      { type: 'points', titre: 'Ce que demande le Code civil (article 21-24)', points: [
        ['🧭', 'Prouver son assimilation : ce n\'est pas être tous semblables, mais adhérer aux principes et aux valeurs de la République.'],
        ['🗣️', 'Connaître suffisamment la langue française.'],
        ['📚', 'Connaître l\'histoire, la culture et la société françaises.'],
        ['⚖️', 'Connaître les droits et devoirs liés à la nationalité.'],
      ] },
      { type: 'nuage', titre: 'Ce que l\'entretien apprécie', mots: ['adhésion aux valeurs', 'motivation', 'connaissance de la France', 'sens de la démarche', 'langue française'] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('S\'assimiler, c\'est devenir tous semblables.', false, 'Non : c\'est adhérer aux principes et aux valeurs de la République.'),
        vf('Un entretien évalue l\'adhésion aux valeurs et la motivation.', true, 'Oui, ainsi que la connaissance des fondements de la société française.'),
      ] },
    ],
  },
  {
    page: 4, titre: 'La France, une démocratie', emoji: '🗳️',
    diapos: [
      { type: 'titre', emoji: '🗳️', titre: 'La France est une démocratie', texte: 'Les dirigeants sont élus au suffrage universel : tous les citoyens, hommes et femmes, votent.' },
      { type: 'points', titre: 'Les symboles nés de la Révolution', points: [
        ['🏰', '14 juillet 1789 : prise de la Bastille → fête nationale'],
        ['🎶', 'La Marseillaise, hymne national'],
        ['👩', 'Marianne, symbole de la République, dans toutes les mairies'],
        ['🇫🇷', 'Le drapeau bleu, blanc, rouge'],
        ['🗣️', 'Le français, langue de la République'],
      ] },
      { type: 'devise' },
      { type: 'question', titre: 'A-t-on le droit de tout dire publiquement ?', réponse: 'La liberté d\'expression est un droit fondamental, mais limité pour respecter les autres : injures, propos diffamatoires, provocations à la haine et apologie de crimes contre l\'humanité sont interdits.' },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('Seuls les hommes ont le droit de vote.', false, 'Faux : tous les citoyens, hommes et femmes, votent.'),
        vf('Liberté de pensée, de croyance, de s\'exprimer et de se réunir sont garanties.', true, 'Ce sont les libertés fondamentales.'),
        vf('La fête nationale rappelle la prise de la Bastille.', true, 'Le 14 juillet 1789.'),
      ] },
    ],
  },
  {
    page: 5, titre: 'L\'égalité', emoji: '⚖️',
    diapos: [
      { type: 'frise', titre: 'La République s\'installe', étapes: [['1789', 'Déclaration des droits de l\'homme et du citoyen', '📜'], ['1875', 'La République est installée de façon stable', '🏛️'], ['1880', 'Liberté de la presse ; école primaire obligatoire, gratuite et laïque', '🏫']] },
      { type: 'nuage', titre: 'Mêmes droits, mêmes devoirs, quels que soient…', mots: ['le sexe', 'l\'origine', 'la religion', 'les opinions', 'l\'orientation sexuelle'] },
      { type: 'question', titre: 'Peut-on refuser la nationalité à quelqu\'un qui ne respecte pas l\'égalité femme-homme ?', réponse: 'Oui, même s\'il est marié avec un(e) Français(e). L\'égalité femme-homme est une valeur essentielle, évaluée à l\'entretien.' },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('La loi accorde les mêmes droits aux femmes et aux hommes.', true, 'C\'est le principe d\'égalité.'),
        vf('La Déclaration des droits de l\'homme date de 1905.', false, 'Elle date de 1789, pendant la Révolution.'),
      ] },
    ],
  },
  {
    page: 6, titre: 'La fraternité', emoji: '🤲',
    diapos: [
      { type: 'titre', emoji: '🤲', titre: 'Vivre ensemble', texte: 'La France est fondée sur la volonté de vivre ensemble. Elle se traduit par la solidarité entre les citoyens.' },
      { type: 'chiffres', titre: 'La solidarité', chiffres: [[1945, '', 'création de la sécurité sociale, financée par les entreprises et ceux qui travaillent']] },
      { type: 'duo', titre: 'Contre les discriminations', gauche: { emoji: '🚫', titre: 'Discriminer', texte: 'Défavoriser une personne ou un groupe par rapport aux autres. Le racisme est un délit.' }, droite: { emoji: '💼', titre: 'Au travail', texte: 'Embauche et promotion doivent reposer sur des raisons professionnelles, pas sur l\'origine, la religion ou le sexe.' } },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('Le racisme est un délit.', true, 'La France condamne les discriminations.'),
        vf('Un employeur peut refuser un candidat à cause de sa religion.', false, 'C\'est une discrimination interdite.'),
      ] },
    ],
  },
  {
    page: 7, titre: 'La laïcité, droits et devoirs', emoji: '🕊️',
    diapos: [
      { type: 'duo', titre: 'La laïcité, c\'est…', gauche: { emoji: '🏛️', titre: 'Un État neutre', texte: 'Il n\'aide aucune religion ; la religion relève de la vie privée.' }, droite: { emoji: '🕊️', titre: 'La liberté religieuse', texte: 'Libre de croire ou de ne pas croire, et de choisir sa religion.' } },
      { type: 'frise', titre: 'Deux lois', étapes: [['1905', 'Séparation des Églises et de l\'État', '⛪'], ['2004', 'Pas de signes religieux ostensibles à l\'école publique', '🏫']] },
      { type: 'points', titre: 'Respecter les lois', points: [['📘', 'Code civil : règles entre les personnes'], ['⚖️', 'Code pénal : délits et peines'], ['🌐', 'legifrance.gouv.fr et vie-publique.fr pour s\'informer']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('Les agents publics peuvent montrer leur religion au travail.', false, 'Non, ils doivent rester neutres.'),
        vf('L\'école publique est neutre face aux religions.', true, 'Elle forme tous les citoyens.'),
      ] },
    ],
  },
  {
    page: 8, titre: 'Quelques droits et devoirs', emoji: '📜',
    diapos: [
      { type: 'points', titre: 'Les citoyens…', points: [
        ['💶', 'financent les services publics : impôts selon leurs moyens, cotisations ; déclarer ses revenus est obligatoire'],
        ['🏢', 'ont accès à égalité aux emplois publics, selon leurs qualités et compétences'],
        ['🎖️', 'contribuent à la défense nationale : recensement à 16 ans, Journée défense et citoyenneté'],
      ] },
      { type: 'chiffres', titre: 'La Première Guerre mondiale', chiffres: [[8, ' millions', 'de mobilisés'], [650000, '', 'soldats venus de l\'empire colonial (Maghreb, Afrique subsaharienne)']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('On se fait recenser à la mairie à 16 ans.', true, 'Pour la Journée défense et citoyenneté.'),
        vf('Payer ses impôts est facultatif.', false, 'C\'est un devoir, selon ses moyens.'),
      ] },
    ],
  },
  {
    page: 9, titre: 'Une organisation démocratique', emoji: '🏛️',
    diapos: [
      { type: 'nuage', titre: 'Démocratie et État de droit', mots: ['par le peuple', 'pour le peuple', 'pouvoir soumis à la loi', 'lois égales pour tous', 'justice indépendante', 'partis libres'] },
      { type: 'duo', titre: 'La Constitution de la Ve République (1958)', gauche: { emoji: '📕', titre: 'Un texte', texte: 'La Constitution définit l\'organisation de l\'État.' }, droite: { emoji: '⚖️', titre: 'Séparation des pouvoirs', texte: 'Exécutif, législatif et judiciaire ne sont pas exercés par la même autorité.' } },
      { type: 'points', titre: 'Les principaux responsables', points: [['🇫🇷', 'Président : élu au suffrage universel pour 5 ans, il nomme le Gouvernement'], ['🏛️', 'Parlement (Assemblée nationale + Sénat) : vote les lois, contrôle le Gouvernement'], ['🧑‍⚖️', 'Justice : rendue par les magistrats']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('Le Président est élu pour 7 ans.', false, 'Pour 5 ans.'),
        vf('Les députés sont élus tous les 5 ans.', true, 'Aux élections législatives.'),
      ] },
    ],
  },
  {
    page: 10, titre: 'Qui élit qui ?', emoji: '🗳️',
    diapos: [
      { type: 'schéma' },
      { type: 'chiffres', titre: 'Les mandats', chiffres: [[5, ' ans', 'Président'], [6, ' ans', 'élus locaux (régions, départements, communes)'], [18, ' ans', 'âge pour voter']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('Les sénateurs sont élus directement par tous les citoyens.', false, 'Ils sont élus par les élus locaux.'),
        vf('Le Président nomme le Premier ministre.', true, 'Le Gouvernement conduit la politique de la nation.'),
      ] },
    ],
  },
  {
    page: 11, titre: 'Commune, département, région', emoji: '🏘️',
    diapos: [
      { type: 'points', titre: 'Les collectivités et leurs missions', points: [['🏘️', 'Commune : maire et conseil municipal ; écoles maternelles et primaires, rues, état civil'], ['🗺️', 'Département (101) : collèges, protection de l\'enfance, personnes âgées'], ['🧭', 'Région : transports, formation professionnelle, lycées']] },
      { type: 'nuage', titre: 'Départements et régions d\'outre-mer', mots: ['Guadeloupe', 'Guyane', 'Martinique', 'Mayotte', 'La Réunion'] },
      { type: 'question', titre: 'Qui représente l\'État dans les départements et les régions ?', réponse: 'Les préfets, en métropole comme en outre-mer.' },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [
        vf('La mairie enregistre les naissances, mariages et décès.', true, 'C\'est l\'état civil.'),
        vf('La région s\'occupe des écoles primaires.', false, 'Ce sont les communes ; la région s\'occupe des lycées.'),
      ] },
    ],
  },
  {
    page: 12, titre: 'Préhistoire et Antiquité', emoji: '🦬',
    diapos: [
      { type: 'titre', emoji: '📜', titre: 'Quelques repères historiques', texte: 'Les valeurs de la société française trouvent leur origine dans son histoire.' },
      { type: 'frise', titre: 'Les origines', étapes: [['-18 000', 'Grotte de Lascaux, célèbre pour ses peintures', '🦬'], ['-50', 'Les Romains s\'installent : mode de vie et culture latine', '🏛️']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('Lascaux est connue pour ses peintures préhistoriques.', true, 'Une des plus importantes grottes de France.'), vf('Les Romains arrivent vers l\'an 1500.', false, 'Vers 50 avant J.-C.')] },
    ],
  },
  {
    page: 13, titre: 'Le Moyen Âge', emoji: '👑',
    diapos: [
      { type: 'personnes', titre: 'Trois figures', personnes: [['👑', 'Clovis (466-511)', 'Unifie les royaumes francs, adopte le christianisme'], ['⚔️', 'Jeanne d\'Arc (1412-1431)', 'Guerre de Cent Ans contre l\'Angleterre ; incarne le courage'], ['📜', 'Henri IV (1553-1610)', 'Édit de Nantes (1598) : liberté de culte des protestants, paix religieuse']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('Jeanne d\'Arc a combattu pendant la guerre de Cent Ans.', true, 'Contre l\'Angleterre.'), vf('L\'édit de Nantes interdit le protestantisme.', false, 'Il accorde la liberté de culte aux protestants.')] },
    ],
  },
  {
    page: 14, titre: 'Époque moderne et Révolution', emoji: '🏰',
    diapos: [
      { type: 'personnes', titre: 'XVIIe et XVIIIe siècles', personnes: [['🏰', 'Louis XIV (1643-1715)', 'Monarchie absolue, État centralisé, Versailles'], ['🎭', 'Molière (1622-1673)', 'Auteur de théâtre : L\'Avare'], ['💡', 'Les Lumières', 'Rousseau, Voltaire, Diderot : tolérance et liberté de pensée']] },
      { type: 'frise', titre: 'La Révolution française', étapes: [['1789', 'Le peuple se révolte ; Déclaration des droits', '🗽'], ['1790', '14 juillet : fête de la Fédération, unité de la nation', '🎉'], ['1792', 'Première République', '🇫🇷']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('Louis XIV concentre tous les pouvoirs.', true, 'C\'est la monarchie absolue.'), vf('La Première République est proclamée en 1792.', true, 'Trois ans après 1789.')] },
    ],
  },
  {
    page: 15, titre: 'Le XIXe siècle', emoji: '🎖️',
    diapos: [
      { type: 'personnes', titre: 'Deux figures', personnes: [['🎖️', 'Napoléon Ier (1769-1821)', 'Dirige la France près de 15 ans ; le Code civil'], ['✒️', 'Victor Hugo (1802-1885)', 'Contre les inégalités et la peine de mort ; Les Misérables']] },
      { type: 'frise', titre: 'Les grandes étapes', étapes: [['1830', 'Début d\'un vaste empire colonial', '🌍'], ['1848', 'Abolition de l\'esclavage', '⛓️'], ['1875', 'IIIe République', '🏛️'], ['1880', 'Jules Ferry : école publique, gratuite, obligatoire, laïque', '🏫']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('L\'esclavage est aboli en 1848.', true, ''), vf('Napoléon a écrit Les Misérables.', false, 'C\'est Victor Hugo ; Napoléon a laissé le Code civil.')] },
    ],
  },
  {
    page: 16, titre: 'Les deux guerres mondiales', emoji: '🪖',
    diapos: [
      { type: 'frise', titre: '1914-1945', étapes: [['1914-1918', 'Première Guerre mondiale, plus de 9 millions de morts ; 11 novembre', '🪖'], ['1939-1945', 'Seconde Guerre mondiale, plus de 50 millions de morts ; 8 mai', '✈️'], ['1940-1944', 'Régime de Vichy (Pétain) : collaboration, déportation des Juifs', '⚠️'], ['6 juin 1944', 'Débarquement en Normandie', '🚢']] },
      { type: 'personnes', titre: 'Le chef de la Résistance', personnes: [['🎗️', 'Charles de Gaulle (1890-1970)', 'Chef de la France libre, artisan de la libération, fondateur de la Ve République (1958)']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('Le 8 mai rappelle la fin de la Seconde Guerre mondiale.', true, 'En 1945.'), vf('Le régime de Vichy a résisté à l\'Allemagne nazie.', false, 'Il a collaboré.')] },
    ],
  },
  {
    page: 17, titre: 'De 1950 à 1981', emoji: '✊',
    diapos: [
      { type: 'frise', titre: 'Une France qui change', étapes: [['1950-1962', 'Décolonisation (Indochine, Algérie)', '🕊️'], ['1957', 'Traité de Rome : la Communauté européenne', '🇪🇺'], ['1968', 'Mai 68 : étudiants puis salariés', '✊'], ['1974', 'Majorité à 18 ans', '🎂'], ['1975', 'Loi sur l\'IVG (Simone Veil)', '⚕️'], ['1981', 'Abolition de la peine de mort', '⚖️']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('La majorité est fixée à 18 ans depuis 1974.', true, ''), vf('La peine de mort est abolie en 1958.', false, 'En 1981.')] },
    ],
  },
  {
    page: 18, titre: 'La France est riche…', emoji: '🌍',
    diapos: [
      { type: 'personnes', titre: 'Ils ont choisi la France', personnes: [['✍️', 'Guillaume Apollinaire', 'Poète : Alcools, Calligrammes'], ['🎤', 'Joséphine Baker', 'Chanteuse et danseuse, engagée dans la Résistance'], ['📖', 'Andrée Chedid', 'Femme de lettres, née au Caire'], ['🎨', 'Marc Chagall', 'Peintre : plafond de l\'Opéra de Paris'], ['⚛️', 'Georges Charpak', 'Physicien, prix Nobel 1992'], ['🔬', 'Marie Curie', 'Physicienne née en Pologne, au Panthéon'], ['🎶', 'Dalida', 'Chanteuse : Bambino, Laissez-moi danser'], ['🏛️', 'Léon Gambetta', 'Un des pères de la IIIe République']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('Marie Curie repose au Panthéon.', true, ''), vf('Joséphine Baker s\'est illustrée dans la Résistance.', true, 'Pendant la Seconde Guerre mondiale.')] },
    ],
  },
  {
    page: 19, titre: '… de nombreux apports étrangers', emoji: '🌐',
    diapos: [
      { type: 'personnes', titre: 'D\'autres Français naturalisés', personnes: [['📰', 'Françoise Giroud', 'Cofondatrice de L\'Express, deux fois secrétaire d\'État'], ['📚', 'Romain Gary', 'Deux fois prix Goncourt'], ['🖋️', 'Joseph Kessel', 'Académie française (1962)'], ['🎨', 'Vassily Kandinsky', 'Fondateur de l\'art abstrait'], ['🏃', 'Alain Mimoun', 'Marathon des JO de 1956'], ['🎸', 'Georges Moustaki', 'Grand nom de la chanson'], ['🌋', 'Haroun Tazieff', 'Volcanologue'], ['📺', 'Léon Zitrone', 'Journaliste (Intervilles, Tour de France)']] },
      { type: 'question', titre: 'Et les talents issus de l\'immigration ?', réponse: 'Beaucoup d\'autres Français issus de l\'immigration ont du talent, comme Michel Platini, Zinedine Zidane, Jamel Debbouze, Gad Elmaleh ou Marie NDiaye.' },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('Romain Gary a eu deux fois le prix Goncourt.', true, 'Dont une sous le nom d\'Émile Ajar.'), vf('Kandinsky était chanteur.', false, 'Peintre, un des fondateurs de l\'art abstrait.')] },
    ],
  },
  {
    page: 20, titre: 'La France en Europe et dans le monde', emoji: '🇪🇺',
    diapos: [
      { type: 'frise', titre: 'La construction européenne', étapes: [['1957', 'Membre fondateur de la Communauté économique européenne', '🤝'], ['1992', 'Création de l\'Union européenne ; citoyenneté européenne', '🇪🇺'], ['2000', 'Charte des droits fondamentaux', '📜']] },
      { type: 'points', titre: 'Citoyen européen', points: [['🗳️', 'Vote au Parlement européen tous les 5 ans'], ['🧳', 'Libre de circuler, travailler, étudier, s\'installer dans l\'UE'], ['🏘️', 'Vote aux élections locales du pays où il vit']] },
      { type: 'titre', emoji: '🌐', titre: 'Une grande puissance', texte: 'Membre permanent du Conseil de sécurité de l\'ONU, à l\'initiative d\'un quart des résolutions votées depuis 2002.' },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('L\'Union européenne compte aujourd\'hui 28 pays.', false, '28 en 2015 (date du livret) ; 27 depuis le départ du Royaume-Uni en 2020.'), vf('La France est membre permanent du Conseil de sécurité.', true, 'À l\'ONU.')] },
    ],
  },
  {
    page: 21, titre: 'Langue et économie', emoji: '🗼',
    diapos: [
      { type: 'chiffres', titre: 'La langue française', chiffres: [[200, ' millions', 'de francophones'], [70, ' pays', 'où l\'on parle français']] },
      { type: 'points', titre: 'L\'économie', points: [['🏭', 'Une centaine de grands groupes de plus de 10 000 salariés'], ['✈️', 'Secteurs d\'excellence : aéronautique (Airbus A380), luxe'], ['🗼', 'Première destination touristique du monde ; la tour Eiffel (1889)']] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('La France est la première destination touristique du monde.', true, 'Le tourisme est essentiel à l\'économie.'), vf('La tour Eiffel date de 1789.', false, 'Exposition universelle de 1889.')] },
    ],
  },
  {
    page: 22, titre: 'Quelques caractéristiques', emoji: '🏔️',
    diapos: [
      { type: 'chiffres', titre: 'La France (2014)', chiffres: [[66, ' millions', 'd\'habitants'], [675000, ' km²', 'métropole et outre-mer'], [17, '', 'agglomérations de plus de 500 000 habitants']] },
      { type: 'carte', titre: 'Les 10 plus grandes villes', villes: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Lille', 'Bordeaux', 'Nice', 'Nantes', 'Strasbourg', 'Rennes'] },
      { type: 'nuage', titre: 'Les grands fleuves', mots: ['la Loire (le plus long)', 'la Seine', 'la Garonne', 'le Rhône', 'le Rhin'] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('Le Mont-Saint-Michel est classé au patrimoine mondial de l\'UNESCO.', true, 'Un îlot rocheux en Normandie.'), vf('La Seine est le plus long fleuve français.', false, 'C\'est la Loire.')] },
    ],
  },
  {
    page: 23, titre: 'Le territoire français', emoji: '🗺️',
    diapos: [
      { type: 'carte', titre: 'Quelques préfectures de région', villes: ['Paris', 'Lille', 'Rennes', 'Bordeaux', 'Lyon', 'Marseille', 'Strasbourg'] },
      { type: 'nuage', titre: 'L\'outre-mer sur la carte', mots: ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte', 'Saint-Pierre-et-Miquelon', 'Polynésie française', 'Nouvelle-Calédonie'] },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('La Guyane est en outre-mer.', true, 'En Amérique du Sud.'), vf('La Corse est un département d\'outre-mer.', false, 'Elle est en métropole.')] },
    ],
  },
  {
    page: 24, titre: 'Déclaration de 1789 (art. 1 à 8)', emoji: '🗽',
    diapos: [
      { type: 'article', numéro: '1', texte: 'Les hommes naissent et demeurent libres et égaux en droits.' },
      { type: 'article', numéro: '2', texte: 'Liberté, propriété, sûreté et résistance à l\'oppression sont des droits naturels.' },
      { type: 'article', numéro: '4', texte: 'La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui.' },
      { type: 'article', numéro: '6', texte: 'La loi est l\'expression de la volonté générale ; elle est la même pour tous.' },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('La loi doit être la même pour tous.', true, 'Article 6.'), vf('La liberté permet de faire tout ce qu\'on veut.', false, 'Seulement ce qui ne nuit pas à autrui (article 4).')] },
    ],
  },
  {
    page: 25, titre: 'Déclaration de 1789 (art. 9 à 17)', emoji: '📜',
    diapos: [
      { type: 'article', numéro: '9', texte: 'Tout homme est présumé innocent jusqu\'à ce qu\'il ait été déclaré coupable.' },
      { type: 'article', numéro: '10', texte: 'Nul ne doit être inquiété pour ses opinions, même religieuses.' },
      { type: 'article', numéro: '11', texte: 'Tout citoyen peut parler, écrire, imprimer librement.' },
      { type: 'article', numéro: '16', texte: 'Sans garantie des droits ni séparation des pouvoirs, il n\'y a pas de Constitution.' },
      { type: 'vraiFaux', titre: 'Vrai ou faux ?', affirmations: [vf('On est présumé coupable jusqu\'au jugement.', false, 'Présumé innocent (article 9).'), vf('La séparation des pouvoirs est essentielle à une Constitution.', true, 'Article 16.')] },
    ],
  },
]
