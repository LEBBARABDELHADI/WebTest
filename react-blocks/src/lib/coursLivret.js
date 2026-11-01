// Cours animé du « Livret du citoyen » (ministère de l'Intérieur, édition
// mars 2015). Chaque chapitre : diapositives animées → révision (mots à
// retrouver entre [[ ]]) → questions ouvertes (mots-clés en **gras**) → QCM.
// Les chiffres qui ont changé depuis 2015 sont signalés (« Aujourd'hui… »).

// QCM : [question, bonne réponse, [3 fausses], explication]
const q = (question, bonne, fausses, explication = '') => ({ question, bonne, fausses, explication })
// Question ouverte : [question, réponse modèle avec mots-clés en gras]
const o = (question, réponse) => ({ question, réponse })

export const CHAPITRES = [
  {
    id: 'republique', emoji: '🇫🇷', titre: 'La République française', pages: '4-5',
    diapos: [
      { type: 'titre', emoji: '🗳️', titre: 'La France est une démocratie', texte: 'Les dirigeants de l\'État sont élus au suffrage universel : tous les citoyens, hommes et femmes, ont le droit de vote.' },
      { type: 'points', titre: 'Les symboles de la République', points: [
        ['🏰', '14 juillet 1789 : le peuple de Paris prend la Bastille, prison royale. C\'est la fête nationale.'],
        ['🎶', 'La Marseillaise, l\'hymne national, est composée à cette époque.'],
        ['👩', 'Marianne est le symbole de la République. Sa statue est dans toutes les mairies.'],
        ['🇫🇷', 'Le drapeau bleu, blanc, rouge date aussi de la Révolution.'],
        ['🗣️', 'La langue de la République est le français.'],
      ] },
      { type: 'devise' },
      { type: 'frise', titre: 'Une conquête de l\'histoire', étapes: [['1789', 'Prise de la Bastille', '🏰'], ['1875', 'La République s\'installe de façon stable', '🏛️'], ['1880', 'Liberté de la presse, école obligatoire, gratuite et laïque', '🏫']] },
    ],
    révision: [
      'La fête nationale est le [[14 juillet]].',
      'L\'hymne national est [[La Marseillaise]].',
      '[[Marianne]] est le symbole de la République.',
      'La devise est [[Liberté, Égalité, Fraternité]].',
      'Le drapeau est [[bleu, blanc, rouge]].',
      'La langue de la République est le [[français]].',
    ],
    ouvertes: [
      o('Quels sont les symboles de la République ?', 'Le **drapeau** bleu, blanc, rouge, l\'hymne **La Marseillaise**, **Marianne**, la **devise** et la fête nationale du **14 juillet**.'),
      o('Que s\'est-il passé le 14 juillet 1789 ?', 'Le peuple de Paris a pris la **Bastille**, une prison royale. C\'est devenu la **fête nationale**.'),
      o('Pourquoi la France est-elle une démocratie ?', 'Les dirigeants sont **élus** au **suffrage universel** : tous les citoyens, **hommes et femmes**, votent.'),
    ],
    qcm: [
      q('Quelle est la date de la fête nationale ?', 'Le 14 juillet', ['Le 1er mai', 'Le 11 novembre', 'Le 8 mai'], 'Elle rappelle la prise de la Bastille, le 14 juillet 1789.'),
      q('Qui est le symbole de la République ?', 'Marianne', ['Jeanne d\'Arc', 'Napoléon', 'Charlemagne'], 'Sa statue se trouve dans toutes les mairies.'),
      q('Quel est l\'hymne national ?', 'La Marseillaise', ['Le Chant des partisans', 'L\'Internationale', 'Le Temps des cerises']),
      q('Quelle est la devise de la République ?', 'Liberté, Égalité, Fraternité', ['Travail, Famille, Patrie', 'Unité, Progrès, Justice', 'Paix, Liberté, Solidarité']),
      q('Depuis quand la République est-elle installée de façon stable ?', '1875', ['1789', '1905', '1958']),
    ],
  },
  {
    id: 'valeurs', emoji: '🤝', titre: 'Liberté, égalité, fraternité', pages: '4-6',
    diapos: [
      { type: 'points', titre: '🕊️ La liberté', points: [
        ['💭', 'Liberté de pensée'], ['🙏', 'Liberté de croyance'], ['🗣️', 'Liberté de s\'exprimer'], ['👥', 'Liberté de se réunir'],
      ] },
      { type: 'question', titre: 'Peut-on tout dire publiquement ?', réponse: 'Non. La liberté d\'expression est un droit fondamental, mais elle a des limites pour respecter les droits des autres : injures, propos diffamatoires, provocation à la haine et apologie de crimes contre l\'humanité sont interdits.' },
      { type: 'points', titre: '⚖️ L\'égalité', points: [
        ['👫', 'Mêmes droits et mêmes devoirs pour tous, quels que soient le sexe, l\'origine, la religion, les opinions ou l\'orientation sexuelle.'],
        ['📜', 'La Déclaration des droits de l\'homme et du citoyen (1789) assure la liberté et l\'égalité.'],
        ['♀️♂️', 'La loi accorde les mêmes droits aux femmes et aux hommes.'],
      ] },
      { type: 'question', titre: 'Peut-on refuser la nationalité à une personne qui ne respecte pas l\'égalité femme-homme ?', réponse: 'Oui, même si elle est mariée avec un(e) Français(e). L\'égalité femme-homme est une valeur essentielle ; l\'adhésion à ces valeurs est évaluée pendant l\'entretien.' },
      { type: 'points', titre: '🤲 La fraternité', points: [
        ['🫂', 'La volonté de vivre ensemble se traduit par la solidarité.'],
        ['🏥', 'Depuis 1945, la sécurité sociale, financée par les entreprises et ceux qui travaillent, en est l\'application.'],
        ['🚫', 'La France condamne les discriminations. Le racisme est un délit.'],
        ['💼', 'Un employeur ne peut pas refuser d\'embaucher quelqu\'un à cause de ses origines, de sa religion ou de son sexe.'],
      ] },
    ],
    révision: [
      'Les libertés : de [[pensée]], de [[croyance]], de s\'exprimer, de se [[réunir]].',
      'La liberté d\'expression a des [[limites]] : injures, diffamation, provocation à la haine sont interdites.',
      'La loi accorde les [[mêmes droits]] aux femmes et aux hommes.',
      'La [[sécurité sociale]] existe depuis [[1945]].',
      'Le [[racisme]] est un délit.',
    ],
    ouvertes: [
      o('Peut-on tout dire publiquement en France ?', 'Non : la **liberté d\'expression** a des **limites**. Les **injures**, la **diffamation** et la **provocation à la haine** sont interdites.'),
      o('Que signifie l\'égalité ?', 'Tous les citoyens ont les **mêmes droits** et les **mêmes devoirs**, quels que soient leur **sexe**, leur **origine** ou leur **religion**.'),
      o('Comment la fraternité se traduit-elle concrètement ?', 'Par la **solidarité** entre citoyens, par exemple la **sécurité sociale** depuis **1945**, et par le refus des **discriminations**.'),
    ],
    qcm: [
      q('Le racisme est-il puni en France ?', 'Oui, c\'est un délit', ['Non, c\'est une opinion', 'Seulement au travail', 'Seulement sur Internet'], 'La France condamne toutes les discriminations.'),
      q('Depuis quand existe la sécurité sociale ?', '1945', ['1905', '1958', '1981'], 'Elle est financée par les entreprises et ceux qui travaillent.'),
      q('Un employeur peut-il refuser un candidat à cause de sa religion ?', 'Non, c\'est une discrimination', ['Oui, s\'il le justifie', 'Oui, dans une petite entreprise', 'Oui, si le candidat est étranger'], 'Les décisions doivent reposer sur des raisons professionnelles.'),
      q('Laquelle de ces paroles est interdite ?', 'Provoquer à la haine', ['Critiquer le gouvernement', 'Défendre une opinion politique', 'Exprimer sa religion'], 'La liberté d\'expression s\'arrête là où commencent les droits des autres.'),
      q('Quel texte de 1789 assure la liberté et l\'égalité ?', 'La Déclaration des droits de l\'homme et du citoyen', ['Le Code civil', 'La Constitution de 1958', 'L\'édit de Nantes']),
    ],
  },
  {
    id: 'laicite', emoji: '⚖️', titre: 'La laïcité', pages: '7',
    diapos: [
      { type: 'duo', titre: 'La laïcité signifie deux choses', gauche: { emoji: '🏛️', titre: 'L\'État est neutre', texte: 'Il n\'aide aucune religion. La religion relève de la vie privée.' }, droite: { emoji: '🕊️', titre: 'La liberté religieuse', texte: 'Chacun est libre de croire ou de ne pas croire, et d\'adopter la religion qu\'il souhaite.' } },
      { type: 'frise', titre: 'Deux lois à retenir', étapes: [['1905', 'Loi de séparation des Églises et de l\'État', '⛪'], ['2004', 'Loi du 15 mars : pas de signes religieux ostensibles à l\'école publique', '🏫']] },
      { type: 'question', titre: 'Pourquoi pas de signes religieux trop visibles à l\'école ?', réponse: 'L\'école publique forme tous les citoyens : elle doit être neutre face aux religions. Pour les mêmes raisons, les agents publics ne doivent pas montrer leur appartenance à une religion.' },
    ],
    révision: [
      'La laïcité est un principe [[fondamental]] de la République.',
      'L\'État est [[neutre]] envers les religions.',
      'Chacun est libre de [[croire ou de ne pas croire]].',
      'La loi de [[1905]] sépare les Églises et l\'État.',
      'La loi du 15 mars [[2004]] interdit les signes religieux ostensibles à l\'école.',
      'Les [[agents publics]] ne doivent pas montrer leur religion.',
    ],
    ouvertes: [
      o('Qu\'est-ce que la laïcité ?', 'L\'**État** est **neutre** envers les religions et garantit la **liberté religieuse** : chacun est libre de **croire** ou de ne pas croire.'),
      o('Quelle loi a séparé les Églises et l\'État ?', 'La loi de **1905**.'),
      o('Un agent de mairie peut-il porter un signe religieux au guichet ?', 'Non : les **agents publics** doivent rester **neutres**. Les usagers, eux, sont libres.'),
    ],
    qcm: [
      q('En quelle année les Églises et l\'État ont-ils été séparés ?', '1905', ['1789', '1945', '2004']),
      q('L\'État aide-t-il une religion ?', 'Non, il est neutre', ['Oui, la religion catholique', 'Oui, toutes les religions', 'Seulement les plus anciennes']),
      q('Qui doit rester neutre face aux religions ?', 'Les agents publics', ['Tous les habitants', 'Les commerçants', 'Les touristes'], 'Les usagers des services publics restent libres.'),
      q('Que dit la loi de 2004 ?', 'Pas de signes religieux ostensibles à l\'école publique', ['La religion est interdite', 'Chaque religion a ses écoles', 'Les prières sont obligatoires']),
      q('La laïcité garantit…', 'La liberté de croire ou de ne pas croire', ['L\'interdiction des religions', 'Une religion officielle', 'L\'obligation de croire']),
    ],
  },
  {
    id: 'droits', emoji: '📜', titre: 'Droits et devoirs du citoyen', pages: '7-8',
    diapos: [
      { type: 'points', titre: 'Respecter les lois', points: [
        ['📘', 'Le Code civil fixe les règles entre les personnes.'],
        ['⚖️', 'Le Code pénal définit les délits et leurs peines.'],
        ['🌐', 'Les lois sont sur legifrance.gouv.fr ; les règles et les institutions expliquées sur vie-publique.fr.'],
      ] },
      { type: 'points', titre: 'Quelques droits et devoirs', points: [
        ['💶', 'Financer les services publics : payer ses impôts selon ses moyens, déclarer ses revenus (obligatoire), cotiser pour la protection sociale.'],
        ['🏢', 'Tous les citoyens ont accès, à égalité, aux emplois publics, selon leurs qualités et compétences.'],
        ['🎖️', 'Défense nationale : à 16 ans, se faire recenser à la mairie pour la Journée défense et citoyenneté.'],
      ] },
      { type: 'chiffres', titre: 'Les chiffres à retenir', chiffres: [[16, ' ans', 'recensement à la mairie'], [18, ' ans', 'âge de la majorité et du vote']] },
    ],
    révision: [
      'Le [[Code pénal]] définit les délits et les peines.',
      'Déclarer ses revenus et payer ses [[impôts]] est obligatoire.',
      'On paie l\'impôt selon ses [[moyens]].',
      'L\'accès aux [[emplois publics]] est égal pour tous les citoyens.',
      'À [[16 ans]], on se fait recenser à la [[mairie]].',
      'Le recensement prépare la [[Journée défense et citoyenneté]].',
    ],
    ouvertes: [
      o('Citez des devoirs du citoyen.', 'Respecter les **lois**, payer ses **impôts**, déclarer ses **revenus**, participer à la **défense** (recensement).'),
      o('Comment est-on choisi pour un emploi public ?', 'Selon ses **qualités** et ses **compétences** : l\'accès est **égal** pour tous les citoyens.'),
      o('Que doit faire un jeune Français à 16 ans ?', 'Se faire **recenser** à la **mairie** pour la **Journée défense et citoyenneté**.'),
    ],
    qcm: [
      q('Où trouver le texte des lois ?', 'legifrance.gouv.fr', ['Au commissariat', 'Dans la presse uniquement', 'À la banque']),
      q('Déclarer ses revenus est…', 'Obligatoire', ['Facultatif', 'Réservé aux salariés', 'Réservé aux entreprises']),
      q('À quel âge se fait-on recenser ?', '16 ans', ['14 ans', '18 ans', '21 ans']),
      q('Comment paie-t-on l\'impôt ?', 'À la hauteur de ses moyens', ['Tous la même somme', 'Seulement si on le souhaite', 'Seulement les propriétaires']),
      q('Quel code définit les délits et les peines ?', 'Le Code pénal', ['Le Code civil', 'Le Code de la route', 'Le Code du travail']),
    ],
  },
  {
    id: 'institutions', emoji: '🏛️', titre: 'Les institutions', pages: '9-10',
    diapos: [
      { type: 'points', titre: 'Une démocratie et un État de droit', points: [
        ['👥', 'Le gouvernement du peuple, par le peuple et pour le peuple.'],
        ['📕', 'La Constitution de la Ve République, adoptée en 1958, organise l\'État.'],
        ['⚖️', 'Séparation des pouvoirs : exécutif, législatif et judiciaire.'],
        ['🧑‍⚖️', 'La justice est indépendante. Les partis politiques sont libres.'],
      ] },
      { type: 'schéma' },
      { type: 'chiffres', titre: 'Les mandats', chiffres: [[5, ' ans', 'Président de la République'], [5, ' ans', 'députés'], [1958, '', 'Constitution de la Ve République']] },
    ],
    révision: [
      'La Constitution actuelle est celle de la [[Ve République]], adoptée en [[1958]].',
      'Les trois pouvoirs : [[exécutif]], [[législatif]] et [[judiciaire]].',
      'Le Président est élu pour [[5 ans]] au suffrage universel.',
      'Le Président nomme le [[Gouvernement]], dirigé par le [[Premier ministre]].',
      'Le Parlement, c\'est l\'[[Assemblée nationale]] et le [[Sénat]].',
      'Le Parlement [[vote les lois]] et contrôle le Gouvernement.',
    ],
    ouvertes: [
      o('Qu\'est-ce que la séparation des pouvoirs ?', 'Les pouvoirs **exécutif**, **législatif** et **judiciaire** ne sont pas exercés par la même autorité.'),
      o('Quel est le rôle du Parlement ?', 'Il **vote les lois** et **contrôle** le **Gouvernement**. Il est composé de l\'**Assemblée nationale** et du **Sénat**.'),
      o('Comment le Président est-il élu, et pour combien de temps ?', 'Au **suffrage universel** direct, pour **5 ans**.'),
    ],
    qcm: [
      q('Pour combien de temps le Président est-il élu ?', '5 ans', ['4 ans', '6 ans', '7 ans'], 'Le mandat est de 5 ans depuis 2002.'),
      q('Qui nomme le Premier ministre ?', 'Le Président de la République', ['Le Sénat', 'Les députés', 'Les maires']),
      q('Qui vote les lois ?', 'Le Parlement', ['Le Président', 'Les préfets', 'Les juges']),
      q('De quoi est composé le Parlement ?', 'Assemblée nationale et Sénat', ['Gouvernement et Sénat', 'Président et députés', 'Conseil constitutionnel et Sénat']),
      q('En quelle année la Constitution de la Ve République a-t-elle été adoptée ?', '1958', ['1945', '1875', '1789']),
    ],
  },
  {
    id: 'collectivites', emoji: '🏘️', titre: 'Commune, département, région', pages: '10-11',
    diapos: [
      { type: 'points', titre: 'Trois collectivités locales', points: [
        ['🏘️', 'La commune : un maire et un conseil municipal. Écoles maternelles et primaires, sport, culture, rues, état civil (naissances, mariages, décès).'],
        ['🗺️', 'Le département (101) : un conseil départemental. Collèges, protection de l\'enfance, aide aux personnes âgées.'],
        ['🧭', 'La région : un conseil régional. Transports, formation professionnelle, lycées.'],
      ] },
      { type: 'chiffres', titre: 'À retenir', chiffres: [[101, '', 'départements'], [6, ' ans', 'mandat des élus locaux'], [5, '', 'départements et régions d\'outre-mer']] },
      { type: 'points', titre: 'L\'outre-mer', points: [
        ['🏝️', 'Guadeloupe, Guyane, Martinique, Mayotte et La Réunion.'],
        ['🌺', 'Des collectivités d\'outre-mer, comme la Polynésie française, ont un statut particulier.'],
        ['🎩', 'Le préfet représente l\'État dans les départements et les régions.'],
      ] },
    ],
    note: 'Le livret (2015) indique 36 000 communes ; il y en a aujourd\'hui environ 35 000 après des fusions.',
    révision: [
      'La commune est dirigée par un [[maire]] et un [[conseil municipal]].',
      'La mairie tient l\'[[état civil]] : naissances, mariages, décès.',
      'La France compte [[101]] départements.',
      'Le département s\'occupe des [[collèges]] ; la région des [[lycées]].',
      'Les élus locaux sont élus pour [[6 ans]].',
      'L\'État est représenté par le [[préfet]].',
    ],
    ouvertes: [
      o('De quoi s\'occupe la commune ?', 'Des **écoles** maternelles et primaires, des activités **sportives et culturelles**, des **rues** et de l\'**état civil**.'),
      o('Citez les départements et régions d\'outre-mer.', '**Guadeloupe**, **Guyane**, **Martinique**, **Mayotte** et **La Réunion**.'),
      o('Qui représente l\'État dans le département ?', 'Le **préfet**.'),
    ],
    qcm: [
      q('Qui dirige la commune ?', 'Le maire et le conseil municipal', ['Le préfet', 'Le député', 'Le Premier ministre']),
      q('Combien de départements compte la France ?', '101', ['95', '13', '36']),
      q('Qui s\'occupe des lycées ?', 'La région', ['La commune', 'Le département', 'L\'Europe']),
      q('Lequel est un département d\'outre-mer ?', 'La Réunion', ['La Corse', 'La Bretagne', 'Monaco']),
      q('Pour combien de temps les conseillers municipaux sont-ils élus ?', '6 ans', ['4 ans', '5 ans', '7 ans']),
    ],
  },
  {
    id: 'histoire', emoji: '📜', titre: 'Repères historiques', pages: '12-17',
    diapos: [
      { type: 'frise', titre: 'Des origines à la monarchie', étapes: [['-18 000', 'Grotte de Lascaux : peintures préhistoriques', '🦬'], ['-50', 'Installation des Romains : culture latine', '🏛️'], ['Ve s.', 'Clovis (466-511) unifie les Francs, adopte le christianisme', '👑'], ['XVe s.', 'Jeanne d\'Arc (1412-1431), guerre de Cent Ans', '⚔️'], ['1598', 'Henri IV : édit de Nantes, liberté religieuse des protestants', '📜']] },
      { type: 'frise', titre: 'De Louis XIV à la Révolution', étapes: [['1643-1715', 'Louis XIV : monarchie absolue, Versailles', '🏰'], ['XVIIe s.', 'Molière, auteur de théâtre (L\'Avare)', '🎭'], ['XVIIIe s.', 'Les Lumières : Rousseau, Voltaire, Diderot', '💡'], ['1789', 'Révolution, Déclaration des droits de l\'homme', '🗽'], ['1792', 'Première République', '🇫🇷']] },
      { type: 'frise', titre: 'Le XIXe siècle', étapes: [['1804', 'Napoléon Ier : le Code civil', '🎖️'], ['1830', 'Début d\'un vaste empire colonial', '🌍'], ['1848', 'Abolition de l\'esclavage', '⛓️'], ['1875', 'IIIe République', '🏛️'], ['1880', 'Jules Ferry : école publique, gratuite, obligatoire et laïque', '🏫']] },
      { type: 'frise', titre: 'Le XXe siècle', étapes: [['1914-1918', 'Première Guerre mondiale (11 novembre)', '🪖'], ['1939-1945', 'Seconde Guerre mondiale (8 mai) ; Vichy collabore', '✈️'], ['1944', 'Débarquement (6 juin), de Gaulle libère la France', '🎗️'], ['1957', 'Traité de Rome', '🇪🇺'], ['1958', 'Ve République (de Gaulle)', '📕']] },
      { type: 'frise', titre: 'Vers la France d\'aujourd\'hui', étapes: [['1950-1962', 'Décolonisation (Indochine, Algérie)', '🕊️'], ['1968', 'Mai 68', '✊'], ['1974', 'Majorité à 18 ans', '🎂'], ['1975', 'Loi sur l\'IVG (Simone Veil)', '⚕️'], ['1981', 'Abolition de la peine de mort', '⚖️']] },
    ],
    révision: [
      'La grotte de [[Lascaux]] est célèbre pour ses peintures préhistoriques.',
      '[[Clovis]] unifie les royaumes francs et adopte le christianisme.',
      'Par l\'édit de Nantes ([[1598]]), [[Henri IV]] accorde la liberté de culte aux protestants.',
      '[[Napoléon]] Ier nous a laissé le [[Code civil]].',
      'L\'esclavage est aboli en [[1848]].',
      'La majorité passe à 18 ans en [[1974]] ; la peine de mort est abolie en [[1981]].',
    ],
    ouvertes: [
      o('Qui était Jeanne d\'Arc ?', 'Une jeune **paysanne** qui a conduit les troupes françaises pendant la **guerre de Cent Ans** contre l\'**Angleterre**. Elle incarne le **courage**.'),
      o('Que s\'est-il passé en 1789 ?', 'La **Révolution** : le peuple se révolte contre la **monarchie absolue**, et la **Déclaration des droits de l\'homme** est adoptée.'),
      o('Qui était Charles de Gaulle ?', 'Le chef de la **Résistance**, artisan de la **libération** de la France, à l\'origine de la **Ve République** en **1958**.'),
    ],
    qcm: [
      q('Qui a promulgué l\'édit de Nantes ?', 'Henri IV', ['Louis XIV', 'Napoléon', 'Clovis'], 'En 1598 : liberté de culte pour les protestants.'),
      q('En quelle année l\'esclavage a-t-il été aboli ?', '1848', ['1789', '1905', '1945']),
      q('Que commémore le 11 novembre ?', 'La fin de la Première Guerre mondiale', ['La prise de la Bastille', 'La fin de la Seconde Guerre mondiale', 'La naissance de la République']),
      q('Qui a préparé la loi sur l\'IVG en 1975 ?', 'Simone Veil', ['Marie Curie', 'Joséphine Baker', 'Françoise Giroud']),
      q('Quand la peine de mort a-t-elle été abolie ?', '1981', ['1958', '1968', '2002']),
    ],
  },
  {
    id: 'apports', emoji: '🌍', titre: 'Une France riche d\'apports étrangers', pages: '18-19',
    diapos: [
      { type: 'titre', emoji: '🌍', titre: 'La France est riche…', texte: 'De nombreuses personnes sont venues vivre en France et ont choisi la nationalité française. Elles ont contribué au rayonnement du pays.' },
      { type: 'personnes', titre: 'Quelques Français naturalisés', personnes: [
        ['🔬', 'Marie Curie', 'Physicienne née en Pologne, inhumée au Panthéon'],
        ['🎤', 'Joséphine Baker', 'Chanteuse d\'origine américaine, engagée dans la Résistance'],
        ['🎨', 'Marc Chagall', 'Peintre d\'origine russe : le plafond de l\'Opéra de Paris'],
        ['⚛️', 'Georges Charpak', 'Physicien d\'origine polonaise, prix Nobel 1992'],
        ['📚', 'Romain Gary', 'Écrivain d\'origine russe, deux fois prix Goncourt'],
        ['🏃', 'Alain Mimoun', 'Athlète d\'origine algérienne, marathon des JO de 1956'],
        ['🌋', 'Haroun Tazieff', 'Né à Varsovie, père de la volcanologie moderne'],
        ['🏛️', 'Léon Gambetta', 'Petit-fils d\'un commerçant italien, un des pères de la IIIe République'],
      ] },
    ],
    révision: [
      '[[Marie Curie]], née en Pologne, repose au Panthéon.',
      '[[Joséphine Baker]] s\'est illustrée dans la Résistance.',
      '[[Marc Chagall]] a décoré le plafond de l\'Opéra de Paris.',
      '[[Romain Gary]] a reçu deux fois le prix Goncourt.',
      '[[Alain Mimoun]] a gagné le marathon des Jeux olympiques de 1956.',
    ],
    ouvertes: [
      o('Citez des personnalités qui ont choisi la nationalité française.', 'Par exemple **Marie Curie**, **Joséphine Baker**, **Marc Chagall** ou **Romain Gary**.'),
      o('Pourquoi dit-on que la France est riche d\'apports étrangers ?', 'Beaucoup de personnes venues d\'**ailleurs** ont choisi la **nationalité française** et ont contribué au **rayonnement** du pays.'),
      o('Qui était Joséphine Baker ?', 'Une **chanteuse** et danseuse d\'origine **américaine**, engagée dans la **Résistance**.'),
    ],
    qcm: [
      q('Dans quel pays est née Marie Curie ?', 'En Pologne', ['En Russie', 'En Suisse', 'En Italie']),
      q('Qui a décoré le plafond de l\'Opéra de Paris ?', 'Marc Chagall', ['Vassily Kandinsky', 'Victor Hugo', 'Molière']),
      q('Quel écrivain a reçu deux fois le prix Goncourt ?', 'Romain Gary', ['Joseph Kessel', 'Victor Hugo', 'Guillaume Apollinaire']),
      q('Qui a gagné le marathon des Jeux olympiques de 1956 ?', 'Alain Mimoun', ['Georges Charpak', 'Léon Zitrone', 'Haroun Tazieff']),
      q('Dans quoi Joséphine Baker s\'est-elle illustrée pendant la guerre ?', 'La Résistance', ['La diplomatie', 'La médecine', 'Le sport']),
    ],
  },
  {
    id: 'monde', emoji: '🇪🇺', titre: 'La France en Europe et dans le monde', pages: '20-21',
    diapos: [
      { type: 'frise', titre: 'Les citoyens français sont citoyens européens', étapes: [['1957', 'Membre fondateur de la Communauté économique européenne', '🤝'], ['1992', 'Création de l\'Union européenne', '🇪🇺'], ['2000', 'Charte des droits fondamentaux', '📜'], ['2002', 'L\'euro en pièces et billets', '💶']] },
      { type: 'points', titre: 'Être citoyen européen', points: [
        ['🗳️', 'Voter aux élections du Parlement européen, tous les 5 ans.'],
        ['🧳', 'Circuler, travailler, étudier et s\'installer librement dans l\'UE.'],
        ['🏘️', 'Voter aux élections locales du pays européen où l\'on vit.'],
      ] },
      { type: 'points', titre: 'La France dans le monde', points: [
        ['🌐', 'Membre permanent du Conseil de sécurité de l\'ONU.'],
        ['🗣️', 'Le français est parlé par 200 millions de personnes dans 70 pays.'],
        ['✈️', 'Secteurs d\'excellence : aéronautique (Airbus), luxe.'],
        ['🗼', 'Première destination touristique du monde (tour Eiffel, 1889).'],
      ] },
    ],
    note: 'Le livret (2015) parle de 28 États dans l\'UE : ils sont 27 depuis le départ du Royaume-Uni en 2020.',
    révision: [
      'La France est membre [[fondateur]] de la Communauté européenne, en [[1957]].',
      'L\'[[Union européenne]] est créée en [[1992]].',
      'Les Européens élisent le [[Parlement européen]] tous les [[5 ans]].',
      'La monnaie commune est l\'[[euro]].',
      'La France est membre permanent du [[Conseil de sécurité]] de l\'ONU.',
      'Le français est parlé par [[200 millions]] de personnes.',
    ],
    ouvertes: [
      o('Quels droits a un citoyen européen ?', 'Voter au **Parlement européen**, **circuler**, **travailler** et **s\'installer** librement, voter aux **élections locales** du pays où il vit.'),
      o('Quelle est la place de la France à l\'ONU ?', 'Elle est **membre permanent** du **Conseil de sécurité**.'),
      o('Pourquoi la France est-elle un pionnier de l\'Europe ?', 'Elle est **membre fondateur** de la Communauté économique européenne en **1957** (**traité de Rome**).'),
    ],
    qcm: [
      q('En quelle année l\'Union européenne a-t-elle été créée ?', '1992', ['1957', '2002', '1945']),
      q('Tous les combien élit-on le Parlement européen ?', 'Tous les 5 ans', ['Tous les 4 ans', 'Tous les 6 ans', 'Tous les 7 ans']),
      q('Où la France est-elle membre permanent ?', 'Au Conseil de sécurité de l\'ONU', ['À l\'OTAN uniquement', 'Au G7 uniquement', 'Au Conseil de l\'Europe']),
      q('Combien de personnes parlent français dans le monde ?', 'Environ 200 millions', ['20 millions', '2 milliards', '66 millions']),
      q('Quand la tour Eiffel a-t-elle été construite ?', 'Pour l\'Exposition universelle de 1889', ['En 1789', 'En 1958', 'En 1900']),
    ],
  },
  {
    id: 'territoire', emoji: '🗺️', titre: 'Le territoire français', pages: '22-23',
    diapos: [
      { type: 'chiffres', titre: 'La France en chiffres', chiffres: [[66, ' millions', 'd\'habitants (2014)'], [675000, ' km²', 'métropole et outre-mer'], [17, '', 'agglomérations de plus de 500 000 habitants']] },
      { type: 'carte', titre: 'Les 10 plus grandes agglomérations', villes: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Lille', 'Bordeaux', 'Nice', 'Nantes', 'Strasbourg', 'Rennes'] },
      { type: 'points', titre: 'Quelques sites remarquables', points: [
        ['🏔️', 'Le Mont-Blanc, dans les Alpes : plus haute montagne d\'Europe occidentale.'],
        ['⛪', 'Le Mont-Saint-Michel, en Normandie, classé par l\'UNESCO.'],
        ['🌊', 'Les grands fleuves : Loire, Seine, Garonne, Rhône, Rhin. La Loire est le plus long.'],
      ] },
    ],
    note: 'Aujourd\'hui la France compte environ 68 millions d\'habitants. Le livret donne 4 810 m pour le Mont-Blanc ; les mesures récentes indiquent environ 4 806 m.',
    révision: [
      'La plus haute montagne est le [[Mont-Blanc]], dans les [[Alpes]].',
      'Le [[Mont-Saint-Michel]] est en Normandie.',
      'Le plus long fleuve est la [[Loire]].',
      'Les grands fleuves : Loire, [[Seine]], Garonne, [[Rhône]], Rhin.',
      'Les trois plus grandes villes : Paris, [[Lyon]], [[Marseille]].',
    ],
    ouvertes: [
      o('Citez les grands fleuves français.', 'La **Loire**, la **Seine**, la **Garonne**, le **Rhône** et le **Rhin**.'),
      o('Citez trois sites remarquables.', 'Le **Mont-Blanc**, le **Mont-Saint-Michel**, la **tour Eiffel** ou les châteaux de la **Loire**.'),
      o('Quelles sont les plus grandes villes de France ?', '**Paris**, **Lyon**, **Marseille**, puis Toulouse, Lille, Bordeaux…'),
    ],
    qcm: [
      q('Quel est le plus long fleuve de France ?', 'La Loire', ['La Seine', 'Le Rhône', 'La Garonne']),
      q('Où se trouve le Mont-Saint-Michel ?', 'En Normandie', ['En Bretagne', 'Dans les Alpes', 'En Provence']),
      q('Dans quelle chaîne de montagnes est le Mont-Blanc ?', 'Les Alpes', ['Les Pyrénées', 'Le Jura', 'Le Massif central']),
      q('Quelle est la deuxième agglomération de France ?', 'Lyon', ['Marseille', 'Lille', 'Bordeaux']),
      q('Lequel n\'est PAS un fleuve français ?', 'Le Danube', ['La Seine', 'La Garonne', 'Le Rhin']),
    ],
  },
  {
    id: 'ddhc', emoji: '🗽', titre: 'La Déclaration des droits de 1789', pages: '24-25',
    diapos: [
      { type: 'article', numéro: '1', texte: 'Les hommes naissent et demeurent libres et égaux en droits.' },
      { type: 'article', numéro: '2', texte: 'Les droits naturels de l\'homme : la liberté, la propriété, la sûreté et la résistance à l\'oppression.' },
      { type: 'article', numéro: '4', texte: 'La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui.' },
      { type: 'article', numéro: '9', texte: 'Tout homme est présumé innocent jusqu\'à ce qu\'il ait été déclaré coupable.' },
      { type: 'article', numéro: '10', texte: 'Nul ne doit être inquiété pour ses opinions, même religieuses, si elles ne troublent pas l\'ordre public.' },
      { type: 'article', numéro: '11', texte: 'Tout citoyen peut parler, écrire, imprimer librement, sauf abus prévus par la loi.' },
      { type: 'article', numéro: '13', texte: 'La contribution commune (l\'impôt) est répartie entre tous les citoyens selon leurs moyens.' },
    ],
    révision: [
      'Article 1 : les hommes naissent et demeurent [[libres et égaux]] en droits.',
      'Article 2 : la liberté, la [[propriété]], la [[sûreté]] et la résistance à l\'[[oppression]].',
      'Article 4 : la liberté, c\'est faire tout ce qui ne [[nuit pas à autrui]].',
      'Article 9 : tout homme est [[présumé innocent]].',
      'Article 13 : l\'impôt est réparti selon les [[moyens]] de chacun.',
    ],
    ouvertes: [
      o('Que dit l\'article 1er de la Déclaration de 1789 ?', 'Les hommes naissent et demeurent **libres** et **égaux** en **droits**.'),
      o('Quelle est la définition de la liberté (article 4) ?', 'Pouvoir faire tout ce qui ne **nuit** pas à **autrui**.'),
      o('Que signifie la présomption d\'innocence ?', 'Une personne est **innocente** tant qu\'elle n\'a pas été déclarée **coupable** par la **justice**.'),
    ],
    qcm: [
      q('Selon l\'article 1er, les hommes naissent…', 'Libres et égaux en droits', ['Riches et puissants', 'Soumis à la loi du roi', 'Tous citoyens européens']),
      q('Lequel n\'est PAS un droit naturel de l\'article 2 ?', 'Le droit au travail', ['La liberté', 'La propriété', 'La sûreté']),
      q('La liberté, c\'est…', 'Faire tout ce qui ne nuit pas à autrui', ['Faire tout ce qu\'on veut', 'Obéir au plus fort', 'Ne jamais payer d\'impôts']),
      q('Selon l\'article 9, tout homme est…', 'Présumé innocent', ['Présumé coupable', 'Toujours arrêté', 'Jugé sans avocat']),
      q('En quelle année la Déclaration a-t-elle été adoptée ?', '1789', ['1792', '1848', '1958']),
    ],
  },
]

export const SOURCE_LIVRET = 'Livret du citoyen, ministère de l\'Intérieur (édition mars 2015)'
