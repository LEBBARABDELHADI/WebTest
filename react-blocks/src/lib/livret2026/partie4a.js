// Livret du citoyen (édition mai 2026), pages 37 à 48 : Partie 4 « Histoire, géographie et culture », I. Principales périodes et personnages.
export const PARTIE = {
  pages: [
    // ─────────────────────────────── p. 37 ───────────────────────────────
    {
      page: 37,
      partie: 4,
      section: 'Partie 4 – Histoire, géographie et culture',
      titre: 'Sommaire de la partie 4',
      emoji: '🗺️',
      type: 'garde',
      résumé: 'Sommaire de la partie 4 : I. Principales périodes et personnages ; II. Territoire et géographie ; III. La culture et le patrimoine.',
      scènes: [],
      questions: [],
    },

    // ─────────────────────────────── p. 38 ───────────────────────────────
    {
      page: 38,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'La grande frise des régimes',
      emoji: '🧭',
      type: 'contenu',
      résumé: 'Le fonctionnement et les valeurs de la société française viennent de son histoire. Une grande frise montre les périodes, du Moyen Âge (476) à la Cinquième République (1958), avec quatre repères : DDHC, Code civil, Sécurité sociale, Constitution.',
      scènes: [
        { type: 'titre', emoji: '⏳', titre: 'Notre histoire, nos valeurs', texte: 'Le fonctionnement et les valeurs de la société française trouvent leurs origines dans son histoire. Le livret présente quelques étapes majeures et des événements de la mémoire nationale.' },
        { type: 'frise', titre: 'Du Moyen Âge au Premier Empire', étapes: [
          ['476', 'Le Moyen Âge', '🏰'],
          ['1492', 'L\'Ancien Régime', '👑'],
          ['1789', 'La Révolution française, puis la monarchie constitutionnelle', '🗽'],
          ['1792', 'La Première République', '🇫🇷'],
          ['1804', 'Le Premier Empire', '🦅'],
        ] },
        { type: 'frise', titre: 'Rois, empereurs et républiques', étapes: [
          ['1814', 'La Restauration', '⚜️'],
          ['1830', 'La Monarchie de Juillet', '👑'],
          ['1848', 'La Deuxième République', '🗳️'],
          ['1852', 'Le Second Empire', '🦅'],
          ['1870', 'La Troisième République', '🏛️'],
        ] },
        { type: 'flux', titre: 'De la guerre à la République d\'aujourd\'hui', étapes: [
          ['⛓️', '1940 : le régime de Vichy'],
          ['🤝', '1944 : le GRPF, Gouvernement provisoire de la République française'],
          ['🏛️', '1946 : la Quatrième République'],
          ['📕', '1958 : la Cinquième République'],
        ] },
        { type: 'zoom', titre: 'Quatre repères sur la frise', centre: { emoji: '🧭', texte: 'Quatre grands textes et créations' }, autour: [
          ['📜', 'La DDHC, au temps de la Révolution (1789)'],
          ['⚖️', 'Le Code civil, à l\'époque de Napoléon (1804)'],
          ['🏥', 'La Sécurité sociale, au temps du GRPF (1944-1946)'],
          ['📕', 'La Constitution de la Cinquième République (1958)'],
        ] },
        { type: 'vraiFaux', affirmations: [
          ['La Cinquième République commence en 1958.', true, 'Oui : la frise la fait commencer en 1958, avec sa Constitution.'],
          ['Le Second Empire vient avant la Deuxième République.', false, 'Non : d\'abord la Deuxième République (1848), puis le Second Empire (1852).'],
          ['Le régime de Vichy va de 1940 à 1944.', true, 'Oui. Il est suivi par le GRPF (1944-1946), puis la Quatrième République (1946).'],
        ] },
      ],
      questions: [
        { q: 'Selon la frise du livret, en quelle année commence la Cinquième République ?', r: 'En 1958.' },
        { q: 'Que signifie le sigle GRPF ?', r: 'Gouvernement provisoire de la République française (1944-1946).' },
        { q: 'Quel régime suit la Deuxième République en 1852 ?', r: 'Le Second Empire (1852-1870).' },
        { q: 'Selon la frise du livret, en quelle année commence le Moyen Âge ?', r: 'En 476.' },
      ],
    },

    // ─────────────────────────────── p. 39 ───────────────────────────────
    {
      page: 39,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'Moyen Âge et Ancien Régime',
      emoji: '👑',
      type: 'contenu',
      résumé: 'Au Moyen Âge, Clovis unifie des royaumes francs et Jeanne d\'Arc devient une héroïne nationale. Sous l\'Ancien Régime (1492-1789), le roi a tous les pouvoirs : Henri IV promulgue l\'édit de Nantes (1598), Louis XIV fait construire Versailles. Molière écrit ses comédies et les Lumières défendent la tolérance.',
      scènes: [
        { type: 'scène', titre: 'Le Moyen Âge (Ve au XVe siècle)', décor: '🏰🌾', acteurs: [
          { emoji: '👑', nom: 'Clovis', dit: 'J\'ai vécu de 466 à 511. J\'unifie plusieurs royaumes de peuples francs : une étape importante pour l\'unité du territoire français. J\'adopte aussi la religion chrétienne.' },
          { emoji: '⚔️', nom: 'Jeanne d\'Arc', dit: 'Moi, je suis une jeune paysanne (1412-1431). Pendant la guerre de Cent Ans contre l\'Angleterre, je conduis les troupes françaises à la libération d\'une partie du territoire.' },
          { emoji: '🧒', nom: 'Un élève', dit: 'Vous êtes devenue une héroïne nationale, symbole du patriotisme et du courage !' },
        ] },
        { type: 'zoom', titre: 'L\'Ancien Régime (1492-1789)', centre: { emoji: '👑', texte: 'La monarchie absolue' }, autour: [
          ['🤴', 'Le roi concentre tous les pouvoirs'],
          ['⛪', 'Les rois sont couronnés à la cathédrale de Reims'],
          ['🏛️', 'Un État puissant et centralisé se met en place'],
        ] },
        { type: 'duo', titre: 'Deux rois célèbres', gauche: { emoji: '📜', titre: 'Henri IV (1553-1610)', texte: 'En 1598, il promulgue l\'édit de Nantes. Ce décret met fin aux guerres de religion entre catholiques et protestants.' }, droite: { emoji: '☀️', titre: 'Louis XIV, le « Roi-Soleil »', texte: 'Il règne de 1643 à 1715. Il fait construire le château de Versailles, joyau de l\'architecture classique, près de Paris.' } },
        { type: 'carte', titre: 'Les lieux des rois', lieux: [
          ['Reims : la cathédrale où les rois sont couronnés', 49.25, 4.03, '⛪'],
          ['Versailles : le château de Louis XIV', 48.80, 2.12, '🏰'],
        ] },
        { type: 'points', titre: 'Le théâtre et les Lumières', points: [
          ['🎭', 'Molière, auteur de théâtre (dramaturge) et comédien du XVIIe siècle, sous Louis XIV : « L\'Avare », « Le Bourgeois gentilhomme »'],
          ['💡', 'Les philosophes des Lumières : Rousseau, Voltaire, Diderot, Montesquieu, Condorcet, d\'Alembert…'],
          ['🕊️', 'Ils combattent pour la tolérance, la liberté de pensée et le refus de l\'arbitraire'],
          ['🇫🇷', 'Leur pensée influence les idéaux de la Révolution : liberté, égalité, fraternité'],
          ['⛓️', 'Montesquieu dénonce l\'esclavage'],
        ] },
        { type: 'vraiFaux', affirmations: [
          ['Henri IV promulgue l\'édit de Nantes en 1598.', true, 'Ce décret met fin aux guerres de religion entre catholiques et protestants.'],
          ['Sous l\'Ancien Régime, les rois sont couronnés à Paris.', false, 'Ils sont couronnés à la cathédrale de Reims.'],
          ['Montesquieu dénonce l\'esclavage.', true, 'C\'est un philosophe des Lumières, comme Rousseau, Voltaire ou Diderot.'],
        ] },
      ],
      questions: [
        { q: 'Quel roi promulgue l\'édit de Nantes en 1598, et à quoi sert-il ?', r: 'Henri IV. L\'édit met fin aux guerres de religion entre catholiques et protestants.' },
        { q: 'Qui est Jeanne d\'Arc ?', r: 'Une jeune paysanne (1412-1431) qui conduit les troupes françaises pendant la guerre de Cent Ans. Une héroïne nationale.' },
        { q: 'Qui est le « Roi-Soleil » ?', r: 'Louis XIV, roi de 1643 à 1715, qui fait construire le château de Versailles.' },
        { q: 'Citez trois philosophes des Lumières.', r: 'Par exemple Rousseau, Voltaire et Diderot (aussi Montesquieu, Condorcet, d\'Alembert).' },
      ],
    },

    // ─────────────────────────────── p. 40 ───────────────────────────────
    {
      page: 40,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'La Révolution et la Ire République',
      emoji: '🗽',
      type: 'contenu',
      résumé: 'Le 14 juillet 1789, la prise de la Bastille ouvre la Révolution, qui adopte la DDHC. Monarchie constitutionnelle en 1791 ; Louis XVI est renversé le 10 août 1792 et guillotiné en 1793. La Première République (1792-1804) connaît la Terreur, dirigée par Robespierre. Bonaparte prend le pouvoir en 1799.',
      scènes: [
        { type: 'titre', emoji: '🏰', titre: '14 juillet 1789 : la prise de la Bastille', texte: 'Les Parisiens s\'emparent de la Bastille, prison royale et symbole du pouvoir monarchique arbitraire. C\'est le début de la Révolution française et la fin de la monarchie absolue.' },
        { type: 'scène', titre: 'Naissance des valeurs républicaines', décor: '📜🕯️', acteurs: [
          { emoji: '🎖️', nom: 'La Fayette', dit: 'En 1789, la Révolution adopte la Déclaration des droits de l\'homme et du citoyen. Moi, le marquis de La Fayette, j\'ai contribué à son écriture.' },
          { emoji: '🙋', nom: 'Une candidate', dit: 'La Révolution française est donc à l\'origine de nos valeurs républicaines !' },
        ] },
        { type: 'frise', titre: 'La chute du roi Louis XVI', étapes: [
          ['1789', 'Début de la Révolution : fin de la monarchie absolue', '🏰'],
          ['1791', 'Monarchie constitutionnelle : les pouvoirs du roi sont limités', '⚖️'],
          ['10 août 1792', 'Après sa tentative de fuite vers l\'étranger, Louis XVI est renversé, puis jugé', '👑'],
          ['1793', 'Louis XVI est guillotiné sur la place de la Concorde', '⚰️'],
        ] },
        { type: 'points', titre: 'La Première République (1792-1804)', points: [
          ['🇫🇷', 'Elle débute en 1792, à la fin de la monarchie constitutionnelle : elle est l\'héritière de la Révolution'],
          ['⚔️', 'Menaces : des révoltes à l\'intérieur du pays et des guerres avec d\'autres pays'],
          ['🗡️', 'La Terreur : les ennemis de la Révolution sont surveillés, les suspects de trahison guillotinés'],
          ['🧑‍⚖️', 'Maximilien Robespierre défend l\'égalité et la République, mais il dirige aussi la Terreur'],
          ['🎖️', '1799 : Napoléon Bonaparte prend le pouvoir ; en 1804, il met fin à la Ire République'],
        ] },
        { type: 'vraiFaux', affirmations: [
          ['La prise de la Bastille a lieu le 14 juillet 1789.', true, 'Elle marque le début de la Révolution française.'],
          ['Louis XVI est guillotiné sur la place de la Bastille.', false, 'Il est guillotiné sur la place de la Concorde, en 1793.'],
          ['Robespierre dirige la Terreur.', true, 'Il défend l\'égalité et la République, mais dirige aussi la Terreur.'],
        ] },
      ],
      questions: [
        { q: 'Que se passe-t-il le 14 juillet 1789 ?', r: 'Les Parisiens prennent la Bastille, prison royale symbole du pouvoir arbitraire : c\'est le début de la Révolution.' },
        { q: 'Qui a contribué à écrire la Déclaration des droits de l\'homme et du citoyen de 1789 ?', r: 'Le marquis de La Fayette.' },
        { q: 'Que devient Louis XVI en 1792 et en 1793 ?', r: 'Il est renversé le 10 août 1792, puis jugé et guillotiné sur la place de la Concorde en 1793.' },
        { q: 'Qu\'est-ce que la Terreur ?', r: 'Un régime de la Ire République : les ennemis de la Révolution sont surveillés et les suspects de trahison guillotinés.' },
      ],
    },

    // ─────────────────────────────── p. 41 ───────────────────────────────
    {
      page: 41,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'Napoléon, puis le retour des rois',
      emoji: '🦅',
      type: 'contenu',
      résumé: 'Napoléon devient empereur en 1804 : Code civil, Banque de France, préfets. Il rétablit l\'esclavage (1802), abolit la traite des Noirs (1815) et abdique après Waterloo (1815). Puis la monarchie revient : la Restauration (Louis XVIII, Charles X), et la Monarchie de Juillet (Louis-Philippe) de 1830 à 1848.',
      scènes: [
        { type: 'scène', titre: 'Napoléon raconte', décor: '🦅🏛️', acteurs: [
          { emoji: '🎖️', nom: 'Napoléon', dit: 'Je deviens empereur en 1804 et je gouverne la France pendant environ 15 ans. Je mène de nombreuses guerres en Europe pour étendre mon empire.' },
          { emoji: '🧐', nom: 'Une historienne', dit: 'Vous centralisez le pouvoir et contrôlez la presse et les opposants. Mais vos réformes structurent l\'État français tel qu\'on le connaît aujourd\'hui.' },
          { emoji: '🎖️', nom: 'Napoléon', dit: 'Affaibli par mes défaites militaires, j\'abdique définitivement en 1815, après la bataille de Waterloo.' },
        ] },
        { type: 'zoom', titre: 'Ce que Napoléon laisse à l\'État', centre: { emoji: '🏛️', texte: 'Des réformes qui structurent l\'État' }, autour: [
          ['⚖️', 'Le Code civil'],
          ['🏦', 'La Banque de France'],
          ['🗂️', 'La création des préfets'],
        ] },
        { type: 'duo', titre: 'Napoléon et l\'esclavage', gauche: { emoji: '⛓️', titre: '1802', texte: 'Napoléon rétablit l\'esclavage.' }, droite: { emoji: '🚢', titre: '1815', texte: 'Napoléon abolit la traite des Noirs.' } },
        { type: 'frise', titre: 'Le retour des rois (1815-1848)', étapes: [
          ['1815', 'La Restauration : retour du roi Louis XVIII', '⚜️'],
          ['1824', 'Charles X succède à Louis XVIII', '👑'],
          ['1830', 'Révolte à Paris : la Monarchie de Juillet commence avec le roi Louis-Philippe', '✊'],
          ['1848', 'Une autre révolution met fin à ce régime', '🔥'],
        ] },
        { type: 'balance', titre: 'Deux monarchies, entre libertés et limites', gauche: { titre: 'La Restauration', items: [
          'Charte constitutionnelle : liberté de la presse, élection du Parlement',
          'Mais mesures conservatrices : rôle de l\'Église renforcé, opposants surveillés',
        ] }, droite: { titre: 'La Monarchie de Juillet', items: [
          'Plus de pouvoirs pour le Parlement, plus de libertés (presse)',
          'Mais pouvoir appuyé sur la bourgeoisie : vote réservé aux plus riches',
        ] } },
        { type: 'vraiFaux', affirmations: [
          ['Napoléon est à l\'origine du Code civil.', true, 'Il crée aussi la Banque de France et les préfets.'],
          ['Sous la Monarchie de Juillet, tout le monde peut voter.', false, 'Le droit de vote reste limité aux plus riches, ce qui provoque des tensions.'],
          ['Napoléon abdique définitivement en 1815, après Waterloo.', true, 'Le Premier Empire prend fin et la monarchie est restaurée.'],
        ] },
      ],
      questions: [
        { q: 'Citez trois créations de Napoléon qui structurent l\'État.', r: 'Le Code civil, la Banque de France et les préfets.' },
        { q: 'Quand et après quelle bataille Napoléon abdique-t-il définitivement ?', r: 'En 1815, après la bataille de Waterloo.' },
        { q: 'Quel roi arrive au pouvoir avec la Monarchie de Juillet en 1830 ?', r: 'Le roi Louis-Philippe.' },
        { q: 'Que fait Napoléon au sujet de l\'esclavage en 1802, puis en 1815 ?', r: 'Il rétablit l\'esclavage en 1802, puis il abolit la traite des Noirs en 1815.' },
      ],
    },

    // ─────────────────────────────── p. 42 ───────────────────────────────
    {
      page: 42,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'Fin de l\'esclavage, Second Empire',
      emoji: '🕊️',
      type: 'contenu',
      résumé: 'La Deuxième République (1848-1852) abolit l\'esclavage en 1848 : Victor Schoelcher rédige le décret. La loi Taubira (2001) reconnaît la traite et l\'esclavage comme un crime contre l\'humanité. Victor Hugo combat les inégalités et la peine de mort. Napoléon III fonde le Second Empire (1852-1870).',
      scènes: [
        { type: 'titre', emoji: '🗳️', titre: 'La Deuxième République (1848-1852)', texte: 'Elle débute après deux monarchies : la Restauration (1815-1830) et la Monarchie de Juillet (1830-1848). Elle est marquée par l\'abolition de l\'esclavage, en 1848.' },
        { type: 'scène', titre: '1848 : la fin de l\'esclavage', décor: '📜🌴', acteurs: [
          { emoji: '✍️', nom: 'Schoelcher', dit: 'Je suis Victor Schoelcher, sous-secrétaire d\'État chargé des colonies. En 1848, je rédige le décret qui met fin à l\'esclavage.' },
          { emoji: '👩‍🏫', nom: 'Une enseignante', dit: 'Aujourd\'hui, la France reconnaît la traite et l\'esclavage comme un crime contre l\'humanité : c\'est la loi Taubira de 2001.' },
          { emoji: '🧒', nom: 'Un élève', dit: 'Et chaque 10 mai, on commémore la journée nationale des mémoires de la traite, de l\'esclavage et de leurs abolitions.' },
        ] },
        { type: 'points', titre: 'L\'esclavage colonial', points: [
          ['🚢', 'À partir du XVIIe siècle : traite transatlantique et esclavage colonial dans les territoires d\'outre-mer'],
          ['🌍', '1,2 million d\'Africains déportés de force vers les Antilles (Saint-Domingue, Martinique, Guadeloupe), La Réunion et la Guyane'],
          ['🌾', 'Ils travaillent surtout dans les plantations (canne à sucre, café…), dans des conditions extrêmement difficiles'],
          ['⚓', 'Nantes est le principal port français de la traite transatlantique'],
          ['🗓️', 'L\'esclavage y est pratiqué jusqu\'en 1848'],
        ] },
        { type: 'devinette', question: 'Quel grand écrivain (1802-1885) a écrit « Les Misérables » et « Notre-Dame de Paris » ?', réponse: 'Victor Hugo, l\'un des plus grands écrivains français. Il s\'est engagé contre les inégalités sociales et la peine de mort.', indice: 'Il porte le même prénom que Schoelcher.' },
        { type: 'flux', titre: 'Le Second Empire (1852-1870)', étapes: [
          ['🗳️', 'Louis-Napoléon Bonaparte, neveu de Napoléon Ier, est élu président de la République'],
          ['⚡', 'Décembre 1851 : il organise un coup d\'État'],
          ['👑', '1852 : il devient empereur sous le nom de Napoléon III'],
          ['🗝️', 'Années 1860 : plus de libertés, Parlement plus fort ; l\'économie se modernise, la France s\'ouvre à l\'Europe'],
          ['⚔️', '1870 : défaite contre la Prusse, fin du Second Empire'],
        ] },
        { type: 'vraiFaux', affirmations: [
          ['L\'esclavage est aboli en 1848, sous la Deuxième République.', true, 'Le décret est rédigé par Victor Schoelcher.'],
          ['Napoléon III est le fils de Napoléon Ier.', false, 'Louis-Napoléon Bonaparte (Napoléon III) est son neveu.'],
          ['Le Second Empire prend fin en 1870, après la défaite contre la Prusse.', true, 'Commence alors la Troisième République.'],
        ] },
      ],
      questions: [
        { q: 'Qui rédige le décret qui abolit l\'esclavage en 1848 ?', r: 'Victor Schoelcher, sous-secrétaire d\'État chargé des colonies.' },
        { q: 'Que reconnaît la loi Taubira de 2001 ?', r: 'La traite et l\'esclavage comme un crime contre l\'humanité.' },
        { q: 'Que commémore-t-on chaque 10 mai ?', r: 'La journée nationale des mémoires de la traite, de l\'esclavage et de leurs abolitions.' },
        { q: 'Comment Louis-Napoléon Bonaparte devient-il Napoléon III ?', r: 'Élu président, il fait un coup d\'État en décembre 1851 et devient empereur en 1852.' },
      ],
    },

    // ─────────────────────────────── p. 43 ───────────────────────────────
    {
      page: 43,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'IIIe République et guerres mondiales',
      emoji: '🏫',
      type: 'contenu',
      résumé: 'La IIIe République (1870-1940) installe durablement la République : école de Jules Ferry (1881-1882) et grandes lois de liberté (1881, 1884, 1901, 1905). La Première Guerre mondiale (1914-1918) finit par l\'armistice du 11 novembre 1918. La Seconde (1939-1945), déclenchée par Hitler, fait plus de 50 millions de morts.',
      scènes: [
        { type: 'frise', titre: 'La IIIe République installe la République', étapes: [
          ['1881', 'École publique gratuite, grâce à Jules Ferry, ministre de l\'Instruction publique', '🏫'],
          ['29 juillet 1881', 'Loi sur la liberté de la presse', '📰'],
          ['1882', 'École laïque et obligatoire (lois de Jules Ferry)', '✏️'],
          ['21 mars 1884', 'Loi autorisant la création des syndicats', '🤝'],
          ['1er juillet 1901', 'Loi sur la liberté d\'association', '👥'],
          ['9 décembre 1905', 'Loi de séparation des Églises et de l\'État (loi sur la laïcité)', '⛪'],
        ] },
        { type: 'points', titre: 'La Première Guerre mondiale (1914-1918)', points: [
          ['🪖', 'Aussi appelée « la Grande Guerre » : d\'abord les puissances européennes, dont la France, puis plusieurs continents'],
          ['🤝', 'La France, dirigée par Georges Clemenceau, président du Conseil, et ses alliés (Grande-Bretagne, Italie, États-Unis)…'],
          ['⚔️', '… contre l\'empire allemand et ses alliés (empire austro-hongrois et empire ottoman)'],
          ['🕊️', 'Juillet 1914 - 11 novembre 1918 : l\'armistice. Le 11 novembre est un jour férié : on commémore l\'Armistice, la victoire, la paix et tous les morts pour la France'],
          ['📜', 'Le traité de Versailles (28 juin 1919) met fin à la guerre et prévoit la Société des Nations, qui inspire plus tard l\'ONU'],
        ] },
        { type: 'zoom', titre: 'Une Europe bouleversée', centre: { emoji: '🌍', texte: 'L\'Europe sort durablement affaiblie' }, autour: [
          ['🗺️', 'De nombreuses frontières modifiées'],
          ['🏳️', 'De nouveaux pays, issus de la disparition des anciens empires'],
          ['🚩', 'La révolution bolchévique en Russie, qui devient l\'URSS'],
          ['🇺🇸', 'La montée en puissance des États-Unis d\'Amérique'],
        ] },
        { type: 'chiffres', titre: 'Le poids des deux guerres', narration: 'La Première Guerre mondiale fait 10 millions de morts, dont 1,45 million pour la France. Selon les historiens, la Seconde Guerre mondiale fait plus de 50 millions de morts, en majorité des civils.', chiffres: [
          [10, ' millions', 'de morts pendant la Première Guerre mondiale'],
          [1450000, '', 'morts pour la France en 1914-1918'],
          [50, ' millions', 'et plus : les morts de la Seconde Guerre mondiale, en majorité des civils'],
        ] },
        { type: 'flux', titre: 'La Seconde Guerre mondiale (1939-1945)', étapes: [
          ['⚠️', '1939 : la guerre est déclenchée par Adolf Hitler, dictateur nazi au pouvoir en Allemagne'],
          ['🪖', '1940 : il envahit la France, d\'abord occupée en partie'],
          ['⛓️', '1942 : la France est occupée totalement'],
          ['🕯️', 'Les nazis persécutent les opposants politiques et exterminent des millions de Juifs (la Shoah), des milliers de Tsiganes, d\'homosexuels et d\'handicapés'],
        ] },
        { type: 'vraiFaux', affirmations: [
          ['La loi de séparation des Églises et de l\'État date du 9 décembre 1905.', true, 'C\'est la loi sur la laïcité, une des grandes lois de la IIIe République.'],
          ['Le 11 novembre commémore la fin de la Seconde Guerre mondiale.', false, 'Il commémore l\'armistice de 1918 (Première Guerre mondiale). La fin de la Seconde est commémorée le 8 mai.'],
          ['La Société des Nations a inspiré plus tard l\'ONU.', true, 'Elle est prévue par le traité de Versailles du 28 juin 1919.'],
        ] },
      ],
      questions: [
        { q: 'Grâce à quelles lois l\'école publique devient-elle gratuite (1881), puis laïque et obligatoire (1882) ?', r: 'Les lois de Jules Ferry, ministre de l\'Instruction publique.' },
        { q: 'Quelle loi date du 9 décembre 1905 ?', r: 'La loi de séparation des Églises et de l\'État (loi sur la laïcité).' },
        { q: 'Que commémore le 11 novembre ?', r: 'L\'armistice du 11 novembre 1918, la victoire et la paix ; on rend hommage à tous les morts pour la France.' },
        { q: 'Qui déclenche la Seconde Guerre mondiale ?', r: 'Adolf Hitler, dictateur nazi au pouvoir en Allemagne. La guerre dure de 1939 à 1945.' },
      ],
    },

    // ─────────────────────────────── p. 44 ───────────────────────────────
    {
      page: 44,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'Vichy, Résistance et Libération',
      emoji: '✊',
      type: 'contenu',
      résumé: 'Après la défaite, Pétain installe le régime de Vichy (1940-1944), qui collabore avec l\'Allemagne nazie. De Gaulle lance la Résistance le 18 juin 1940 ; Jean Moulin l\'unifie. Débarquement le 6 juin 1944, Paris libérée le 25 août 1944, capitulation allemande le 8 mai 1945. Puis la IVe République (1946-1958), instable.',
      scènes: [
        { type: 'duo', titre: 'Deux chemins en 1940', gauche: { emoji: '⛓️', titre: 'Le régime de Vichy (1940-1944)', texte: 'Le maréchal Pétain met en place un régime autoritaire non démocratique, dont la capitale est Vichy. Il collabore avec l\'Allemagne nazie et porte une part de responsabilité dans la déportation des Juifs.' }, droite: { emoji: '✊', titre: 'La Résistance', texte: 'Une partie de la population refuse la collaboration et résiste à l\'occupation. La Résistance s\'unifie sous la direction de Jean Moulin.' } },
        { type: 'scène', titre: 'L\'appel du 18 juin 1940', décor: '📻🌙', acteurs: [
          { emoji: '🎙️', nom: 'De Gaulle', dit: 'Le 18 juin 1940, je lance mon appel sur la radio britannique, la BBC. C\'est le début de la Résistance.' },
          { emoji: '🕵️', nom: 'Jean Moulin', dit: 'Le général de Gaulle, chef de la France libre, m\'a missionné pour unifier la Résistance. Je serai arrêté et torturé à mort par les nazis.' },
          { emoji: '🎙️', nom: 'De Gaulle', dit: 'À la Libération, je dirige la France : je suis à la tête du gouvernement jusqu\'au 20 janvier 1946.' },
        ] },
        { type: 'carte', titre: 'Les lieux de la guerre et de la Libération', lieux: [
          ['Vichy : capitale du régime de Pétain (1940-1944)', 46.13, 3.43, '⛓️'],
          ['Normandie : débarquement des Alliés, 6 juin 1944', 49.34, -0.70, '🚢'],
          ['Paris : libérée le 25 août 1944', 48.86, 2.35, '🗼'],
        ] },
        { type: 'frise', titre: 'La fin de la Seconde Guerre mondiale', étapes: [
          ['6 juin 1944', 'Débarquement des Alliés en Normandie, appuyés par la Résistance française', '🚢'],
          ['25 août 1944', 'La ville de Paris est libérée', '🗼'],
          ['8 mai 1945', 'L\'Allemagne capitule. Le 8 mai est un jour férié qui commémore la fin de la guerre', '🕊️'],
          ['20 janvier 1946', 'De Gaulle quitte la tête du gouvernement', '🏛️'],
        ] },
        { type: 'zoom', titre: 'La Quatrième République (1946-1958)', centre: { emoji: '🏛️', texte: 'Un Parlement plus fort que l\'exécutif' }, autour: [
          ['📜', 'Le pouvoir législatif (Parlement) compte plus que l\'exécutif (président du Conseil)'],
          ['⚖️', 'Un déséquilibre entre les pouvoirs'],
          ['🔀', 'Pas de majorité au Parlement'],
          ['🌀', 'Des gouvernements instables : le régime s\'effondre en 1958'],
        ] },
        { type: 'vraiFaux', affirmations: [
          ['L\'appel du général de Gaulle date du 18 juin 1940.', true, 'Lancé sur la BBC, il marque le début de la Résistance.'],
          ['Le régime de Vichy était une démocratie.', false, 'C\'était un régime autoritaire non démocratique, qui collaborait avec l\'Allemagne nazie.'],
          ['Paris est libérée le 25 août 1944.', true, 'Après le débarquement des Alliés en Normandie, le 6 juin 1944.'],
        ] },
      ],
      questions: [
        { q: 'Qui met en place le régime de Vichy, et que fait ce régime ?', r: 'Le maréchal Pétain. Ce régime autoritaire collabore avec l\'Allemagne nazie.' },
        { q: 'Que se passe-t-il le 18 juin 1940 ?', r: 'Le général de Gaulle lance un appel sur la radio britannique (BBC) : c\'est le début de la Résistance.' },
        { q: 'Qui unifie la Résistance ?', r: 'Jean Moulin, missionné par le général de Gaulle, chef de la France libre.' },
        { q: 'Que commémore le 8 mai ?', r: 'La fin de la Seconde Guerre mondiale : l\'Allemagne capitule face aux Alliés le 8 mai 1945.' },
      ],
    },

    // ─────────────────────────────── p. 45 ───────────────────────────────
    {
      page: 45,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'Ve République, décolonisation, Mai 68',
      emoji: '📕',
      type: 'contenu',
      résumé: 'Appelé à l\'été 1958, de Gaulle fait rédiger une Constitution adoptée par référendum le 28 septembre 1958 et promulguée le 4 octobre 1958 : un exécutif fort. Les colonies obtiennent surtout leur indépendance dans les années 1950 et 1960, après deux guerres (Indochine, Algérie). Mai 1968 apporte des avancées sociales.',
      scènes: [
        { type: 'flux', titre: 'La naissance de la Ve République', étapes: [
          ['🌀', 'Crise politique : guerre d\'Algérie et gouvernements instables de la IVe République'],
          ['📞', 'Été 1958 : de Gaulle est appelé comme président du Conseil pour rédiger une nouvelle Constitution'],
          ['🗳️', '28 septembre 1958 : la Constitution est adoptée par référendum'],
          ['📕', '4 octobre 1958 : elle est promulguée'],
          ['👤', 'De Gaulle devient le premier Président de la Ve République'],
        ] },
        { type: 'zoom', titre: 'Ce que change la Constitution de 1958', centre: { emoji: '💪', texte: 'Un pouvoir exécutif fort' }, autour: [
          ['👤', 'Un président doté de pouvoirs importants'],
          ['🛡️', 'L\'Assemblée nationale peut moins facilement renverser le Gouvernement'],
          ['🔁', 'Le but : la continuité et la stabilité du Gouvernement'],
          ['🇫🇷', 'C\'est encore aujourd\'hui le régime politique de la France'],
        ] },
        { type: 'points', titre: 'La décolonisation française', points: [
          ['🌍', 'Entre le XVIIe et le XIXe siècle, la France conquiert un vaste empire colonial, qu\'elle contrôle politiquement, administrativement et économiquement'],
          ['🗺️', 'En Afrique (Afrique de l\'Ouest, Afrique équatoriale, Algérie, Madagascar, Maroc, Tunisie…) et en Asie (Indochine…)'],
          ['🎖️', 'Pendant la Seconde Guerre mondiale, de nombreux soldats des colonies meurent pour défendre la France'],
          ['✊', 'Après la guerre, des mouvements nationalistes réclament l\'indépendance'],
          ['🤝', 'La plupart des colonies l\'obtiennent dans les années 1950 et 1960, par des processus négociés'],
        ] },
        { type: 'frise', titre: 'Deux conflits meurtriers', étapes: [
          ['1946-1954', 'Indochine : un conflit, puis l\'indépendance', '🌏'],
          ['1954-1962', 'Algérie : un conflit, puis l\'indépendance', '🌍'],
        ] },
        { type: 'scène', titre: 'Mai 1968', décor: '✊📢', acteurs: [
          { emoji: '🧑‍🎓', nom: 'Une étudiante', dit: 'Nous réclamons de meilleures conditions d\'études et davantage de libertés !' },
          { emoji: '👷', nom: 'Un ouvrier', dit: 'Avec les syndicats, nous contestons la rigidité du système politique et social. Nos grèves sont parmi les plus importantes du XXe siècle.' },
          { emoji: '📰', nom: 'Le journal', dit: 'Le mouvement se conclut par des avancées sociales importantes, comme l\'augmentation du salaire minimum. La société se transforme.' },
        ] },
        { type: 'vraiFaux', affirmations: [
          ['La Constitution de la Ve République est promulguée le 4 octobre 1958.', true, 'Elle a été adoptée par référendum le 28 septembre 1958.'],
          ['La guerre d\'Algérie dure de 1946 à 1954.', false, 'Ce sont les dates de l\'Indochine. L\'Algérie : 1954-1962.'],
          ['Mai 1968 commence par un mouvement d\'étudiants.', true, 'Il est ensuite amplifié par les salariés et les syndicats d\'ouvriers.'],
        ] },
      ],
      questions: [
        { q: 'Quand la Constitution de la Ve République est-elle adoptée, puis promulguée ?', r: 'Adoptée par référendum le 28 septembre 1958, promulguée le 4 octobre 1958.' },
        { q: 'Qui est le premier Président de la Ve République ?', r: 'Le général Charles de Gaulle.' },
        { q: 'Quels deux conflits meurtriers marquent la décolonisation ?', r: 'L\'Indochine (1946-1954) et l\'Algérie (1954-1962).' },
        { q: 'Qu\'obtient le mouvement de mai 1968 ?', r: 'Des avancées sociales importantes, comme l\'augmentation du salaire minimum, et une transformation de la société.' },
      ],
    },

    // ─────────────────────────────── p. 46 ───────────────────────────────
    {
      page: 46,
      partie: 4,
      section: 'I. Principales périodes et personnages — A. Les principales périodes',
      titre: 'Quatre grandes avancées des droits',
      emoji: '⚖️',
      type: 'contenu',
      résumé: 'Sous la Ve République : la majorité passe à 18 ans (1974, Valéry Giscard d\'Estaing), l\'avortement est dépénalisé (loi Veil, 17 janvier 1975), la peine de mort est abolie (1981, Robert Badinter) et le mariage pour tous est voté (17 mai 2013, Christiane Taubira).',
      scènes: [
        { type: 'frise', titre: 'Quatre lois qui changent la vie', étapes: [
          ['1974', 'La majorité passe de 21 à 18 ans (Valéry Giscard d\'Estaing)', '🎂'],
          ['17 janvier 1975', 'Loi Veil : l\'avortement est dépénalisé', '⚕️'],
          ['1981', 'Abolition de la peine de mort (Robert Badinter)', '⚖️'],
          ['17 mai 2013', 'Mariage pour tous (Christiane Taubira)', '💍'],
        ] },
        { type: 'chiffres', titre: 'L\'âge pour voter, avant et après 1974', narration: 'Avant 1974, il fallait 21 ans pour exercer les droits civiques, comme le vote. Le président Valéry Giscard d\'Estaing abaisse cet âge à 18 ans.', chiffres: [
          [21, ' ans', 'âge minimum pour exercer les droits civiques, comme le vote, avant 1974'],
          [18, ' ans', 'nouvel âge minimum à partir de 1974'],
        ] },
        { type: 'scène', titre: 'La loi Veil (1975)', décor: '🏥⚖️', acteurs: [
          { emoji: '👩‍💼', nom: 'Simone Veil', dit: 'Ministre de la Santé, j\'ai présenté et soutenu la loi du 17 janvier 1975. L\'avortement est « dépénalisé » : il n\'est plus condamnable par la loi.' },
          { emoji: '👩', nom: 'Une citoyenne', dit: 'Après la loi Neuwirth de 1967, qui autorise la pilule, c\'est une avancée pour le droit des femmes à disposer librement de leur corps.' },
          { emoji: '👩‍⚕️', nom: 'Une médecin', dit: 'Les femmes peuvent maîtriser leur fécondité, et avorter dans des conditions encadrées par la loi et sécurisées médicalement.' },
        ] },
        { type: 'titre', emoji: '⚖️', titre: '1981 : la peine de mort est abolie', texte: 'Robert Badinter, ministre de la Justice de François Mitterrand, a soutenu cette abolition totale. C\'est aujourd\'hui un pilier des valeurs républicaines et un symbole fort du respect de la dignité humaine.' },
        { type: 'devinette', question: 'Dans quelle ville est célébré le premier mariage homosexuel en France, le 29 mai 2013 ?', réponse: 'À la mairie de Montpellier. La loi du 17 mai 2013 permet aux couples homosexuels de se marier et d\'adopter des enfants ; elle a été soutenue par Christiane Taubira, ministre de la Justice sous François Hollande.' },
        { type: 'vraiFaux', affirmations: [
          ['Depuis 1981, la peine de mort est interdite par la loi en France.', true, 'Robert Badinter a soutenu cette abolition totale.'],
          ['La loi Veil de 1975 autorise la pilule contraceptive.', false, 'La pilule est autorisée par la loi Neuwirth de 1967. La loi Veil dépénalise l\'avortement.'],
          ['La loi de 2013 permet aussi aux couples homosexuels d\'adopter des enfants.', true, 'Elle leur permet de se marier et d\'adopter.'],
        ] },
      ],
      questions: [
        { q: 'Quel président abaisse la majorité à 18 ans en 1974 ?', r: 'Valéry Giscard d\'Estaing, juste après son élection en 1974. L\'âge minimum était de 21 ans.' },
        { q: 'Que permet la loi Veil du 17 janvier 1975 ?', r: 'Elle dépénalise l\'avortement : il n\'est plus condamnable par la loi. Simone Veil était ministre de la Santé.' },
        { q: 'Qui a soutenu l\'abolition de la peine de mort en 1981 ?', r: 'Robert Badinter, ministre de la Justice de François Mitterrand.' },
        { q: 'Quand est votée la loi sur le mariage pour tous, et qui l\'a soutenue ?', r: 'Le 17 mai 2013 ; elle a été soutenue par Christiane Taubira, ministre de la Justice.' },
      ],
    },

    // ─────────────────────────────── p. 47 ───────────────────────────────
    {
      page: 47,
      partie: 4,
      section: 'I. Principales périodes et personnages — B. Les principaux personnages historiques',
      titre: 'Les présidents de la Ve République',
      emoji: '🎖️',
      type: 'contenu',
      résumé: 'Huit présidents depuis 1959 : de Gaulle, Pompidou, Giscard d\'Estaing, Mitterrand (réélu en 1988), Chirac (réélu en 2002), Sarkozy, Hollande et Macron (réélu en 2022). Pompidou est le seul mort pendant son mandat : dans ce cas, le président du Sénat remplace le Président jusqu\'à l\'élection.',
      scènes: [
        { type: 'frise', titre: 'De 1959 à 1981', étapes: [
          ['1959', 'Charles de Gaulle', '1️⃣'],
          ['1969', 'Georges Pompidou', '2️⃣'],
          ['1974', 'Valéry Giscard d\'Estaing', '3️⃣'],
          ['1981', 'François Mitterrand (réélu en 1988)', '4️⃣'],
        ] },
        { type: 'flux', titre: 'De 1995 à aujourd\'hui', étapes: [
          ['5️⃣', '1995 : Jacques Chirac (réélu en 2002)'],
          ['6️⃣', '2007 : Nicolas Sarkozy'],
          ['7️⃣', '2012 : François Hollande'],
          ['8️⃣', '2017 : Emmanuel Macron (réélu en 2022)'],
        ] },
        { type: 'chiffres', titre: 'Les présidents en chiffres', chiffres: [
          [8, '', 'présidents de la Ve République depuis 1959'],
          [3, '', 'présidents réélus : Mitterrand, Chirac et Macron'],
          [1, '', 'seul président mort pendant son mandat : Georges Pompidou'],
        ] },
        { type: 'scène', titre: 'Et si le Président meurt ?', décor: '🏛️📜', acteurs: [
          { emoji: '🙋', nom: 'Le candidat', dit: 'Un président de la Ve République est-il déjà mort pendant son mandat ?' },
          { emoji: '👩‍💼', nom: 'L\'agente', dit: 'Oui, un seul : Georges Pompidou, président à partir de 1969.' },
          { emoji: '🙋', nom: 'Le candidat', dit: 'Et qui le remplace dans cette situation ?' },
          { emoji: '👩‍💼', nom: 'L\'agente', dit: 'Le président du Sénat, jusqu\'à la fin de l\'élection présidentielle organisée en urgence.' },
        ] },
        { type: 'devinette', question: 'Quel président est élu en 2017, puis réélu en 2022 ?', réponse: 'Emmanuel Macron, le huitième président de la Ve République.' },
        { type: 'vraiFaux', affirmations: [
          ['Charles de Gaulle est le premier président de la Ve République.', true, 'Il est président à partir de 1959.'],
          ['François Hollande succède directement à Jacques Chirac.', false, 'Après Jacques Chirac vient Nicolas Sarkozy (2007), puis François Hollande (2012).'],
          ['François Mitterrand, élu en 1981, a été réélu en 1988.', true, 'Jacques Chirac (2002) et Emmanuel Macron (2022) ont aussi été réélus.'],
        ] },
      ],
      questions: [
        { q: 'Citez dans l\'ordre les présidents de la Ve République.', r: 'De Gaulle, Pompidou, Giscard d\'Estaing, Mitterrand, Chirac, Sarkozy, Hollande, Macron.' },
        { q: 'Quel est le seul président de la Ve République mort pendant son mandat ?', r: 'Georges Pompidou (président à partir de 1969).' },
        { q: 'Qui remplace le Président de la République s\'il meurt pendant son mandat ?', r: 'Le président du Sénat, jusqu\'à la fin de l\'élection présidentielle organisée en urgence.' },
        { q: 'Quels présidents de la Ve République ont été réélus ?', r: 'François Mitterrand (1988), Jacques Chirac (2002) et Emmanuel Macron (2022).' },
      ],
    },

    // ─────────────────────────────── p. 48 ───────────────────────────────
    {
      page: 48,
      partie: 4,
      section: 'I. Principales périodes et personnages — B. Les principaux personnages historiques',
      titre: 'Des naturalisés célèbres',
      emoji: '🌟',
      type: 'contenu',
      résumé: 'Beaucoup de personnes venues vivre en France ont choisi de devenir françaises : elles sont une richesse pour la communauté nationale. Le livret cite 17 personnalités naturalisées qui ont fait rayonner la France (culture, économie, science, politique, sport), comme Marie Curie, Joséphine Baker ou Romain Gary.',
      scènes: [
        { type: 'titre', emoji: '🌍', titre: 'Venus d\'ailleurs, devenus Français', texte: 'Au fil de son histoire, de nombreuses personnes sont venues vivre en France et beaucoup ont choisi de devenir françaises. Par leur talent, elles ont contribué au rayonnement de la France.' },
        { type: 'zoom', titre: 'Sciences, presse et politique', centre: { emoji: '🔬', texte: 'Ils ont fait avancer la France' }, autour: [
          ['⚗️', 'Marie Curie (née en Pologne) : radioactivité, Nobel de physique 1903, de chimie 1911 ; inhumée au Panthéon'],
          ['🔭', 'Georges Charpak (origine polonaise) : imagerie biomédicale, détection des particules, Nobel de physique 1992'],
          ['🌋', 'Haroun Tazieff (né à Varsovie) : père de la volcanologie contemporaine'],
          ['🏛️', 'Léon Gambetta (petit-fils d\'un commerçant italien) : aide la France à se relever après la défaite de 1870 ; un des pères de la IIIe République'],
          ['📰', 'Françoise Giroud (origine suisse) : co-fondatrice de « L\'Express », deux fois Secrétaire d\'État'],
        ] },
        { type: 'points', titre: 'Les arts et les lettres', points: [
          ['🎨', 'Peintres d\'origine russe : Vassily Kandinsky, un fondateur de l\'art abstrait ; Marc Chagall, plafond de l\'Opéra Garnier'],
          ['✒️', 'Guillaume Apollinaire (« Alcools », « Calligramme ») ; Andrée Chedid, née au Caire, poétesse'],
          ['📚', 'Marguerite Yourcenar, née à Bruxelles : « Mémoires d\'Hadrien », première femme élue à l\'Académie française'],
          ['🏆', 'Romain Gary : seul écrivain à recevoir deux fois le Goncourt (1956 ; 1975 sous le nom d\'Émile Ajar)'],
          ['🎭', 'Maria Casarès, née à La Corogne : « Les enfants du paradis », « Orphée »'],
        ] },
        { type: 'scène', titre: 'Sur scène et en chansons', décor: '🎤🎶', acteurs: [
          { emoji: '💃🏾', nom: 'Joséphine Baker', dit: 'D\'origine américaine, je suis la première chanteuse, danseuse et meneuse de revue noire reconnue. Pendant la Seconde Guerre mondiale, j\'agis dans la Résistance.' },
          { emoji: '🎤', nom: 'Dalida', dit: 'Je suis d\'origine égyptienne. Mes succès ? « Bambino », « Il venait d\'avoir 18 ans », « Laissez-moi danser »…' },
          { emoji: '🎶', nom: 'Miriam Makeba', dit: 'Engagée contre l\'apartheid, je suis la première chanteuse sud-africaine à obtenir un Grammy Award.' },
          { emoji: '🎸', nom: 'Moustaki', dit: 'Moi, Georges Moustaki, d\'origine italo-grecque, je deviens dans les années 1960 un des grands noms de la chanson française.' },
        ] },
        { type: 'devinette', question: 'Quel cycliste, né en Italie, remporte en 1903 le premier Tour de France de l\'histoire ?', réponse: 'Maurice-François Garin (1871-1957), une figure légendaire du cyclisme mondial.' },
        { type: 'vraiFaux', affirmations: [
          ['Marie Curie a reçu deux prix Nobel.', true, 'Physique en 1903 (avec Pierre Curie et Henri Becquerel), puis chimie en 1911 pour l\'isolement du radium.'],
          ['Marguerite Yourcenar est la première femme élue à l\'Académie française.', true, 'Née à Bruxelles, elle est célèbre pour « Mémoires d\'Hadrien ».'],
          ['Romain Gary n\'a reçu le prix Goncourt qu\'une seule fois.', false, 'Deux fois : en 1956 pour « Les Racines du ciel », en 1975 pour « La Vie devant soi » sous le nom d\'Émile Ajar.'],
        ] },
      ],
      questions: [
        { q: 'Pour quoi Marie Curie reçoit-elle le prix Nobel de physique en 1903 ?', r: 'Pour la découverte de la radioactivité. Elle reçoit aussi le Nobel de chimie en 1911 (isolement du radium).' },
        { q: 'Qui remporte le premier Tour de France, en 1903 ?', r: 'Maurice-François Garin, cycliste professionnel né en Italie.' },
        { q: 'Qui est la première femme élue à l\'Académie française ?', r: 'Marguerite Yourcenar, écrivaine née à Bruxelles, auteure de « Mémoires d\'Hadrien ».' },
        { q: 'Quelle artiste naturalisée s\'est illustrée dans la Résistance ?', r: 'Joséphine Baker, d\'origine américaine, chanteuse, danseuse et meneuse de revue.' },
      ],
    },
  ],

  leçons: [
    { id: 'p4a-periodes', titre: 'Les grandes périodes, du Moyen Âge aux rois', emoji: '👑', pages: [38, 39] },
    { id: 'p4a-revolution', titre: 'Révolution, Première République et Empire', emoji: '🗽', pages: [40, 41] },
    { id: 'p4a-xixe', titre: 'De l\'abolition de l\'esclavage aux guerres mondiales', emoji: '🏫', pages: [42, 43] },
    { id: 'p4a-liberation', titre: 'Résistance, Libération et Ve République', emoji: '✊', pages: [44, 45] },
    { id: 'p4a-droits', titre: 'Grandes lois et présidents de la Ve République', emoji: '⚖️', pages: [46, 47] },
    { id: 'p4a-naturalises', titre: 'Des naturalisés qui font rayonner la France', emoji: '🌟', pages: [48] },
  ],

  maison: [
    { id: 'p4a-marque-page', pièce: 'bibliothèque', emoji: '🔖', objet: 'Le marque-page serpent', fait: 'La frise du livret : Moyen Âge (476), Ancien Régime (1492), Révolution (1789), Ire République (1792), Premier Empire (1804)… jusqu\'à la Ve République (1958).', image: 'Un long marque-page en forme de serpent ondule entre les livres. Sur ses écailles brillent 476, 1492, 1789, 1792, 1804… et sa tête porte une couronne marquée « 1958 ».', page: 38 },
    { id: 'p4a-chandelier', pièce: 'bibliothèque', emoji: '🕯️', objet: 'Le chandelier à deux bougies', fait: 'En 1598, Henri IV promulgue l\'édit de Nantes, qui met fin aux guerres de religion entre catholiques et protestants.', image: 'Sur le chandelier, une bougie catholique et une bougie protestante se soufflent dessus. Henri IV arrive avec un parchemin « Nantes 1598 » : les deux flammes se calment et brillent côte à côte.', page: 39 },
    { id: 'p4a-cle', pièce: 'bibliothèque', emoji: '🗝️', objet: 'La grosse clé du tiroir', fait: 'Le 14 juillet 1789, les Parisiens prennent la Bastille, prison royale symbole du pouvoir arbitraire : c\'est le début de la Révolution française.', image: 'Le tiroir de la bibliothèque est une petite forteresse grise. Des Parisiens miniatures l\'ouvrent avec une énorme clé en criant « 14 juillet ! », et en sortent la Déclaration des droits de l\'homme.', page: 40 },
    { id: 'p4a-serre-livres', pièce: 'bibliothèque', emoji: '📚', objet: 'Les serre-livres en bicorne', fait: 'Napoléon, empereur en 1804, crée le Code civil, la Banque de France et les préfets, qui structurent encore l\'État.', image: 'Deux serre-livres en forme de chapeau de Napoléon tiennent trois gros livres : « Code civil », « Banque de France », « Préfets ». Si tu les retires, toute l\'étagère de l\'État s\'écroule.', page: 41 },
    { id: 'p4a-coupe-papier', pièce: 'bibliothèque', emoji: '🗡️', objet: 'Le coupe-papier', fait: 'L\'esclavage est aboli en 1848 : Victor Schoelcher rédige le décret. Chaque 10 mai, on commémore les mémoires de la traite, de l\'esclavage et de leurs abolitions.', image: 'Avec le coupe-papier gravé « 1848 », Victor Schoelcher tranche d\'un coup une lourde chaîne enroulée autour des livres. Le calendrier à côté s\'ouvre tout seul au 10 mai.', page: 42 },
    { id: 'p4a-pupitre', pièce: 'bibliothèque', emoji: '✏️', objet: 'Le vieux pupitre d\'écolier', fait: 'Grâce aux lois de Jules Ferry, l\'école publique devient gratuite en 1881, puis laïque et obligatoire en 1882.', image: 'Chaque fois que tu soulèves le couvercle du pupitre, Jules Ferry en sort comme un diable à ressort et récite : « Gratuite en 81, laïque et obligatoire en 82 ! »', page: 43 },
    { id: 'p4a-horloge', pièce: 'bibliothèque', emoji: '🕰️', objet: 'L\'horloge de la cheminée', fait: 'Le 11 novembre 1918, l\'armistice met fin à la Première Guerre mondiale (1914-1918). Le 11 novembre est un jour férié.', image: 'L\'horloge sonne onze coups, le onzième jour du onzième mois. À chaque coup, un petit soldat pose son fusil et une colombe s\'envole.', page: 43 },
    { id: 'p4a-radio', pièce: 'bibliothèque', emoji: '📻', objet: 'Le vieux poste de radio', fait: 'Le 18 juin 1940, le général de Gaulle lance son appel sur la radio britannique (BBC) : c\'est le début de la Résistance.', image: 'Le poste de radio de l\'étagère s\'allume tout seul et grésille : « Ici la radio britannique, la BBC, 18 juin 1940 ». Les livres se redressent un par un pour résister.', page: 44 },
    { id: 'p4a-lutrin', pièce: 'bibliothèque', emoji: '📕', objet: 'Le lutrin et son grand livre', fait: 'La Constitution de la Ve République est adoptée par référendum le 28 septembre 1958 et promulguée le 4 octobre 1958.', image: 'Sur le lutrin, un énorme livre « Constitution 1958 » reste fermé. Le 28 septembre, tout le monde vote pour l\'ouvrir ; le 4 octobre, il s\'ouvre en grand avec un bruit de tonnerre.', page: 45 },
    { id: 'p4a-echelle', pièce: 'bibliothèque', emoji: '🪜', objet: 'L\'échelle de bibliothèque', fait: 'Quatre avancées : majorité à 18 ans (1974), loi Veil sur l\'avortement (1975), abolition de la peine de mort (1981), mariage pour tous (2013).', image: 'Tu montes l\'échelle à quatre barreaux : un gâteau à 18 bougies (1974), la loi Veil (1975), une guillotine cassée en deux (1981), puis deux alliances qui brillent tout en haut (2013).', page: 46 },
    { id: 'p4a-portraits', pièce: 'bibliothèque', emoji: '🖼️', objet: 'La galerie de portraits', fait: 'Présidents de la Ve République : de Gaulle (1959), Pompidou (1969), Giscard d\'Estaing (1974), Mitterrand (1981), Chirac (1995), Sarkozy (2007), Hollande (2012), Macron (2017).', image: 'Au-dessus des rayonnages, huit portraits se passent un stylo de cadre en cadre en criant leur année. Seul le cadre de Pompidou reste un instant gardé par le président du Sénat.', page: 47 },
    { id: 'p4a-loupe', pièce: 'bibliothèque', emoji: '🔍', objet: 'La loupe qui brille', fait: 'Marie Curie, née en Pologne, découvre la radioactivité : prix Nobel de physique (1903), puis de chimie (1911). Elle est inhumée au Panthéon.', image: 'La loupe posée sur la table brille d\'une lumière verte radioactive. Quand tu regardes à travers, tu vois deux médailles Nobel : « 1903 » et « 1911 ».', page: 48 },
  ],

  frise: [
    { année: 476, date: '476', titre: 'Début du Moyen Âge', détail: 'Sur la frise du livret, le Moyen Âge commence en 476. Il s\'étend du Ve au XVe siècle, jusqu\'au début de l\'Ancien Régime en 1492.', emoji: '🏰', période: 'Moyen Âge', page: 38 },
    { année: 511, date: '466-511', titre: 'Clovis unifie des royaumes francs', détail: 'Clovis (466-511) unifie plusieurs royaumes habités par des peuples francs : une étape importante dans la construction de l\'unité du territoire. Il adopte la religion chrétienne.', emoji: '👑', période: 'Moyen Âge', page: 39 },
    { année: 1431, date: '1412-1431', titre: 'Jeanne d\'Arc, héroïne de la guerre de Cent Ans', détail: 'Jeune paysanne, elle conduit les troupes françaises à la libération d\'une partie du territoire pendant la guerre de Cent Ans contre l\'Angleterre. Héroïne nationale, symbole du patriotisme et du courage.', emoji: '⚔️', période: 'Moyen Âge', page: 39 },
    { année: 1492, date: '1492', titre: 'Début de l\'Ancien Régime', détail: 'L\'Ancien Régime (1492-1789) est marqué par la monarchie absolue : le roi concentre tous les pouvoirs. Les rois sont couronnés à Reims. Un État puissant et centralisé se met en place.', emoji: '🤴', période: 'Ancien Régime', page: 39 },
    { année: 1598, date: '1598', titre: 'Henri IV promulgue l\'édit de Nantes', détail: 'Henri IV (1553-1610), roi de France, promulgue ce décret qui met fin aux guerres de religion entre catholiques et protestants.', emoji: '📜', période: 'Ancien Régime', page: 39 },
    { année: 1643, date: '1643-1715', titre: 'Louis XIV, le Roi-Soleil, au temps de Molière', détail: 'Louis XIV règne de 1643 à 1715 et fait construire le château de Versailles, près de Paris. Sous son règne vit Molière, auteur de « L\'Avare » et du « Bourgeois gentilhomme ».', emoji: '☀️', période: 'Ancien Régime', page: 39 },
    { année: 1789, date: '14 juillet 1789', titre: 'Prise de la Bastille', détail: 'Les Parisiens s\'emparent de la Bastille, prison royale symbole du pouvoir monarchique arbitraire. C\'est le début de la Révolution française et la fin de la monarchie absolue.', emoji: '🏰', période: 'Révolution française', page: 40 },
    { année: 1789, date: '1789', titre: 'Déclaration des droits de l\'homme et du citoyen (La Fayette)', détail: 'La Révolution adopte la DDHC, à l\'origine de nos valeurs républicaines. Le marquis de La Fayette a notamment contribué à son écriture.', emoji: '📜', période: 'Révolution française', page: 40 },
    { année: 1791, date: '1791', titre: 'Monarchie constitutionnelle, puis chute de Louis XVI', détail: 'Les pouvoirs de Louis XVI sont limités. Sa fuite manquée et les tensions sociales dressent le peuple contre lui : renversé le 10 août 1792, il est guillotiné place de la Concorde en 1793.', emoji: '⚖️', période: 'Révolution française', page: 40 },
    { année: 1792, date: '1792', titre: 'Première République, puis la Terreur de Robespierre', détail: 'Héritière de la Révolution, la Ire République fait face à des révoltes et à des guerres. Le gouvernement met en place la Terreur : les suspects de trahison sont guillotinés. Robespierre la dirige.', emoji: '🇫🇷', période: 'Première République', page: 40 },
    { année: 1802, date: '1802', titre: 'Napoléon rétablit l\'esclavage', détail: 'En 1802, Napoléon rétablit l\'esclavage. Il abolit ensuite la traite des Noirs, en 1815.', emoji: '⛓️', période: 'Première République', page: 41 },
    { année: 1804, date: '1804', titre: 'Napoléon Bonaparte, empereur : le Premier Empire', détail: 'Au pouvoir depuis 1799, Napoléon met fin à la Ire République et devient empereur. Il crée le Code civil, la Banque de France et les préfets, qui structurent l\'État.', emoji: '🦅', période: 'Premier Empire', page: 41 },
    { année: 1815, date: '1815', titre: 'Waterloo : Napoléon abdique, Louis XVIII revient', détail: 'Affaibli par ses défaites, Napoléon abdique après Waterloo. La Restauration commence avec Louis XVIII, qui garde la Charte constitutionnelle. Charles X lui succède en 1824.', emoji: '⚜️', période: 'Restauration et Monarchie de Juillet', page: 41 },
    { année: 1830, date: '1830', titre: 'Monarchie de Juillet : le roi Louis-Philippe', détail: 'Les Parisiens se révoltent contre les limites aux libertés. Louis-Philippe arrive au pouvoir : plus de pouvoirs au Parlement, plus de libertés, mais le vote reste réservé aux plus riches.', emoji: '👑', période: 'Restauration et Monarchie de Juillet', page: 41 },
    { année: 1848, date: '1848', titre: 'Deuxième République et abolition de l\'esclavage (Schoelcher)', détail: 'Une révolution met fin à la Monarchie de Juillet. La Deuxième République abolit l\'esclavage : Victor Schoelcher, sous-secrétaire d\'État chargé des colonies, rédige le décret.', emoji: '🕊️', période: 'Deuxième République', page: 42 },
    { année: 1852, date: '1852', titre: 'Napoléon III et le Second Empire', détail: 'Élu président, Louis-Napoléon Bonaparte, neveu de Napoléon Ier, fait un coup d\'État en décembre 1851 et devient empereur. Régime autoritaire, puis plus libéral dans les années 1860.', emoji: '🦅', période: 'Second Empire', page: 42 },
    { année: 1870, date: '1870', titre: 'Défaite face à la Prusse, naissance de la IIIe République (Gambetta)', détail: 'Le Second Empire prend fin après la défaite contre la Prusse. La IIIe République (1870-1940) installe durablement la République. Léon Gambetta aide la France à se relever : il est un de ses pères.', emoji: '🏛️', période: 'Troisième République', page: 43 },
    { année: 1881, date: '1881-1882', titre: 'Jules Ferry : l\'école publique ; liberté de la presse', détail: 'Grâce à Jules Ferry, ministre de l\'Instruction publique, l\'école publique devient gratuite (1881), puis laïque et obligatoire (1882). La loi du 29 juillet 1881 garantit la liberté de la presse.', emoji: '🏫', période: 'Troisième République', page: 43 },
    { année: 1884, date: '21 mars 1884', titre: 'Loi autorisant les syndicats', détail: 'Une des grandes lois garantissant les libertés, adoptées sous la IIIe République : elle autorise la création des syndicats.', emoji: '🤝', période: 'Troisième République', page: 43 },
    { année: 1901, date: '1er juillet 1901', titre: 'Loi sur la liberté d\'association', détail: 'Autre grande loi de liberté de la IIIe République.', emoji: '👥', période: 'Troisième République', page: 43 },
    { année: 1903, date: '1903', titre: 'Marie Curie, prix Nobel de physique', détail: 'Née en Pologne, naturalisée, elle reçoit le Nobel de physique pour la découverte de la radioactivité, partagé avec Pierre Curie et Henri Becquerel, puis le Nobel de chimie en 1911.', emoji: '⚗️', période: 'Troisième République', page: 48 },
    { année: 1905, date: '9 décembre 1905', titre: 'Séparation des Églises et de l\'État', détail: 'C\'est la loi sur la laïcité, une des grandes lois de liberté adoptées sous la IIIe République.', emoji: '⛪', période: 'Troisième République', page: 43 },
    { année: 1914, date: 'Juillet 1914', titre: 'Début de la Première Guerre mondiale', détail: '« La Grande Guerre » implique d\'abord les puissances européennes, dont la France, puis plusieurs continents. Elle fait 10 millions de morts, dont 1,45 million pour la France.', emoji: '🪖', période: 'Troisième République', page: 43 },
    { année: 1918, date: '11 novembre 1918', titre: 'Armistice : victoire de la France (Clemenceau)', détail: 'Victoire de la France, dirigée par Georges Clemenceau, et de ses alliés. Le 11 novembre est un jour férié. Le traité de Versailles (28 juin 1919) met fin à la guerre et prévoit la Société des Nations.', emoji: '🕊️', période: 'Troisième République', page: 43 },
    { année: 1939, date: '1939', titre: 'Début de la Seconde Guerre mondiale (Hitler)', détail: 'La guerre (1939-1945) est déclenchée par Adolf Hitler, dictateur nazi. Les nazis exterminent des millions de Juifs (la Shoah). Elle fait plus de 50 millions de morts, en majorité des civils.', emoji: '⚠️', période: 'Troisième République', page: 43 },
    { année: 1940, date: '1940', titre: 'Défaite et régime de Vichy du maréchal Pétain', détail: 'La France est envahie et occupée en partie, puis totalement dès 1942. Pétain installe à Vichy un régime autoritaire qui collabore avec les nazis et a une part de responsabilité dans la déportation des Juifs.', emoji: '⛓️', période: 'Régime de Vichy', page: 44 },
    { année: 1940, date: '18 juin 1940', titre: 'L\'appel du général de Gaulle', détail: 'Sur la radio britannique (BBC), Charles de Gaulle, chef de la France libre, lance son appel : c\'est le début de la Résistance, qui s\'unifie ensuite sous la direction de Jean Moulin.', emoji: '📻', période: 'Régime de Vichy', page: 44 },
    { année: 1944, date: '6 juin 1944', titre: 'Débarquement des Alliés en Normandie', détail: 'Appuyés par la Résistance française, les Alliés débarquent : la libération de la France commence. Paris est libérée le 25 août 1944.', emoji: '🚢', période: 'Gouvernement provisoire (GRPF)', page: 44 },
    { année: 1944, date: '1944-1946', titre: 'Le Gouvernement provisoire de la République française (GRPF)', détail: 'À la Libération, de Gaulle dirige le gouvernement jusqu\'au 20 janvier 1946. Sur la frise du livret, la Sécurité sociale est placée à cette période.', emoji: '🏥', période: 'Gouvernement provisoire (GRPF)', page: 38 },
    { année: 1945, date: '8 mai 1945', titre: 'Capitulation de l\'Allemagne', détail: 'L\'Allemagne capitule face aux Alliés. Le 8 mai est un jour férié qui commémore la fin de la Seconde Guerre mondiale.', emoji: '🕊️', période: 'Gouvernement provisoire (GRPF)', page: 44 },
    { année: 1946, date: '1946', titre: 'La Quatrième République', détail: 'Sa Constitution donne plus de poids au Parlement (pouvoir législatif) qu\'au président du Conseil (exécutif). Sans majorité, les gouvernements sont instables ; le régime s\'effondre en 1958.', emoji: '🏛️', période: 'Quatrième République', page: 44 },
    { année: 1946, date: '1946-1954', titre: 'Le conflit d\'Indochine', détail: 'Un des deux conflits meurtriers de la décolonisation. L\'Indochine obtient son indépendance à l\'issue de ce conflit.', emoji: '🌏', période: 'Quatrième République', page: 45 },
    { année: 1954, date: '1954-1962', titre: 'Le conflit d\'Algérie', détail: 'L\'autre conflit meurtrier de la décolonisation ; l\'Algérie obtient son indépendance à son issue. La crise politique liée à cette guerre ramène de Gaulle au pouvoir en 1958.', emoji: '🌍', période: 'Quatrième République', page: 45 },
    { année: 1958, date: '28 septembre et 4 octobre 1958', titre: 'Constitution de la Ve République (de Gaulle)', détail: 'Appelé à l\'été 1958, de Gaulle fait rédiger une Constitution : adoptée par référendum le 28 septembre, promulguée le 4 octobre. Un exécutif fort ; de Gaulle est le premier Président.', emoji: '📕', période: 'Cinquième République', page: 45 },
    { année: 1968, date: 'Mai 1968', titre: 'Mai 68', détail: 'Les étudiants, puis les salariés et les syndicats d\'ouvriers, lancent des grèves et des manifestations parmi les plus importantes du XXe siècle. Avancées sociales, dont la hausse du salaire minimum.', emoji: '✊', période: 'Cinquième République', page: 45 },
    { année: 1969, date: '1969', titre: 'Georges Pompidou, président', détail: 'Deuxième président de la Ve République, et le seul mort pendant son mandat. Dans ce cas, le président du Sénat remplace le Président jusqu\'à l\'élection organisée en urgence.', emoji: '🎖️', période: 'Cinquième République', page: 47 },
    { année: 1974, date: '1974', titre: 'Valéry Giscard d\'Estaing : la majorité à 18 ans', détail: 'Élu président en 1974, il abaisse de 21 à 18 ans l\'âge minimum pour exercer les droits civiques, comme le vote. C\'est une de ses premières décisions.', emoji: '🎂', période: 'Cinquième République', page: 46 },
    { année: 1975, date: '17 janvier 1975', titre: 'Loi Veil : l\'avortement dépénalisé (Simone Veil)', détail: 'Présentée par Simone Veil, ministre de la Santé, dans la continuité de la loi Neuwirth de 1967 (la pilule). Les femmes peuvent maîtriser leur fécondité et avorter dans un cadre légal et médicalement sûr.', emoji: '⚕️', période: 'Cinquième République', page: 46 },
    { année: 1981, date: '1981', titre: 'François Mitterrand président ; abolition de la peine de mort (Badinter)', détail: 'Élu en 1981 et réélu en 1988, Mitterrand a pour ministre de la Justice Robert Badinter, qui soutient l\'abolition totale de la peine de mort : un pilier des valeurs républicaines.', emoji: '⚖️', période: 'Cinquième République', page: 46 },
    { année: 1995, date: '1995', titre: 'Jacques Chirac, président', détail: 'Cinquième président de la Ve République, élu en 1995 et réélu en 2002.', emoji: '🎖️', période: 'Cinquième République', page: 47 },
    { année: 2001, date: '2001', titre: 'Loi Taubira : la traite et l\'esclavage, crime contre l\'humanité', détail: 'La France reconnaît la traite et l\'esclavage comme un crime contre l\'humanité. Chaque 10 mai : journée nationale des mémoires de la traite, de l\'esclavage et de leurs abolitions.', emoji: '🕯️', période: 'Cinquième République', page: 42 },
    { année: 2007, date: '2007', titre: 'Nicolas Sarkozy, président', détail: 'Sixième président de la Ve République, élu en 2007.', emoji: '🎖️', période: 'Cinquième République', page: 47 },
    { année: 2012, date: '2012', titre: 'François Hollande, président', détail: 'Septième président de la Ve République. Sous sa présidence est votée la loi sur le mariage pour tous (2013).', emoji: '🎖️', période: 'Cinquième République', page: 47 },
    { année: 2013, date: '17 mai 2013', titre: 'Le mariage pour tous (Christiane Taubira)', détail: 'La loi permet aux couples homosexuels de se marier et d\'adopter des enfants. Soutenue par Christiane Taubira, ministre de la Justice. Premier mariage à la mairie de Montpellier le 29 mai 2013.', emoji: '💍', période: 'Cinquième République', page: 46 },
    { année: 2017, date: '2017', titre: 'Emmanuel Macron, président', détail: 'Huitième président de la Ve République, élu en 2017 et réélu en 2022.', emoji: '🎖️', période: 'Cinquième République', page: 47 },
  ],

  situations: [
    { id: 'p4a-s1', thème: 'Jours fériés', emoji: '🕊️', contexte: 'Ton fils te demande pourquoi il n\'y a pas école le 11 novembre.', question: 'Que lui réponds-tu ?', choix: [
      { texte: 'C\'est un jour férié : on commémore l\'armistice de 1918, la victoire, la paix et tous les morts pour la France.', bon: true, explication: 'L\'armistice du 11 novembre 1918 met fin à la Première Guerre mondiale (1914-1918).' },
      { texte: 'On fête la fin de la Seconde Guerre mondiale.', bon: false, explication: 'La fin de la Seconde Guerre mondiale est commémorée le 8 mai (capitulation de l\'Allemagne, 8 mai 1945).' },
      { texte: 'On fête la prise de la Bastille.', bon: false, explication: 'La prise de la Bastille a eu lieu le 14 juillet 1789, au début de la Révolution.' },
    ], page: 43 },
    { id: 'p4a-s2', thème: 'Entretien de naturalisation', emoji: '📻', contexte: 'À l\'entretien, l\'agent de préfecture te demande : « Que s\'est-il passé le 18 juin 1940 ? »', question: 'Quelle est la bonne réponse ?', choix: [
      { texte: 'Le général de Gaulle a lancé un appel sur la BBC : c\'est le début de la Résistance.', bon: true, explication: 'Son appel sur la radio britannique marque le début de la Résistance, ensuite unifiée par Jean Moulin.' },
      { texte: 'Les Alliés ont débarqué en Normandie.', bon: false, explication: 'Le débarquement en Normandie a lieu le 6 juin 1944.' },
      { texte: 'Le maréchal Pétain a libéré Paris.', bon: false, explication: 'Pétain dirige le régime de Vichy, qui collabore avec l\'Allemagne nazie. Paris est libérée le 25 août 1944.' },
    ], page: 44 },
    { id: 'p4a-s3', thème: 'Mémoire de l\'esclavage', emoji: '⛓️', contexte: 'Le 10 mai, ta collègue voit une cérémonie devant la mairie et te demande ce qu\'on commémore.', question: 'Que lui expliques-tu ?', choix: [
      { texte: 'La journée nationale des mémoires de la traite, de l\'esclavage et de leurs abolitions.', bon: true, explication: 'La loi Taubira (2001) reconnaît la traite et l\'esclavage comme un crime contre l\'humanité. L\'esclavage a été aboli en 1848.' },
      { texte: 'L\'armistice de la Première Guerre mondiale.', bon: false, explication: 'L\'armistice est commémoré le 11 novembre.' },
      { texte: 'L\'abolition de la peine de mort.', bon: false, explication: 'La peine de mort a été abolie en 1981, avec Robert Badinter. Le 10 mai concerne la mémoire de l\'esclavage.' },
    ], page: 42 },
    { id: 'p4a-s4', thème: 'École et laïcité', emoji: '🏫', contexte: 'Un voisin affirme que l\'école publique a toujours été payante et facultative en France.', question: 'Que lui réponds-tu ?', choix: [
      { texte: 'Non : grâce aux lois de Jules Ferry, l\'école publique est gratuite depuis 1881, laïque et obligatoire depuis 1882.', bon: true, explication: 'Ces lois de la IIIe République ont été voulues par Jules Ferry, alors ministre de l\'Instruction publique.' },
      { texte: 'Il a raison : l\'école publique est payante.', bon: false, explication: 'Depuis 1881, l\'école publique est gratuite.' },
      { texte: 'L\'école est devenue obligatoire en mai 1968.', bon: false, explication: 'Elle est obligatoire depuis 1882. Mai 1968 est un grand mouvement social.' },
    ], page: 43 },
    { id: 'p4a-s5', thème: 'Droits de l\'homme', emoji: '⚖️', contexte: 'Ton cousin, arrivé depuis peu, pense qu\'en France un tribunal peut encore condamner à mort l\'auteur d\'un crime très grave.', question: 'Que lui expliques-tu ?', choix: [
      { texte: 'C\'est impossible : depuis 1981, la peine de mort est interdite par la loi.', bon: true, explication: 'Robert Badinter, ministre de la Justice de François Mitterrand, a soutenu cette abolition totale, symbole du respect de la dignité humaine.' },
      { texte: 'C\'est possible, mais seulement pour les crimes les plus graves.', bon: false, explication: 'L\'abolition est totale : la peine de mort est interdite dans tous les cas.' },
      { texte: 'Seul le Président de la République peut décider d\'une condamnation à mort.', bon: false, explication: 'Personne ne le peut : la peine de mort est abolie depuis 1981.' },
    ], page: 46 },
    { id: 'p4a-s6', thème: 'Entretien de naturalisation', emoji: '🎖️', contexte: 'L\'agent de préfecture te demande qui a été le premier Président de la Ve République.', question: 'Que réponds-tu ?', choix: [
      { texte: 'Charles de Gaulle.', bon: true, explication: 'Président à partir de 1959, il est à l\'origine de nos institutions actuelles.' },
      { texte: 'Georges Pompidou.', bon: false, explication: 'Pompidou est le deuxième (1969). C\'est le seul président mort pendant son mandat.' },
      { texte: 'François Mitterrand.', bon: false, explication: 'Mitterrand est élu en 1981, réélu en 1988. Il est le quatrième président.' },
    ], page: 47 },
  ],
}
