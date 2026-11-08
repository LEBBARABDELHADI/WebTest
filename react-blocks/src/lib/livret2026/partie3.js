// Livret du citoyen (édition mai 2026), pages 24 à 36 : Partie 3 — Droits et devoirs des citoyens.
export const PARTIE = {
  pages: [
    // ─────────────────────────────── p. 24 ───────────────────────────────
    {
      page: 24,
      partie: 3,
      section: 'Partie 3 - Droits et devoirs des citoyens',
      titre: 'Sommaire de la partie 3',
      emoji: '📑',
      type: 'garde',
      résumé: 'Sommaire de la partie 3 : I. Les droits fondamentaux (liberté individuelle, dignité, sûreté et justice, droits politiques, environnement) et II. Les obligations et devoirs des citoyens.',
      scènes: [],
      questions: [],
    },

    // ─────────────────────────────── p. 25 ───────────────────────────────
    {
      page: 25,
      partie: 3,
      section: 'I. Les droits fondamentaux',
      titre: 'Être citoyen : droits et textes',
      emoji: '🪪',
      type: 'contenu',
      résumé: 'Être citoyen, c\'est avoir la nationalité d\'un État, avec des droits et des devoirs. Certains sont réservés aux Français (vote, défense nationale, jury d\'assises), mais la loi s\'applique à tous. Les droits fondamentaux sont garantis par la Constitution, la DDHC de 1789, le préambule de 1946, la Charte de l\'environnement de 2004 et des textes internationaux comme la CEDH.',
      scènes: [
        {
          type: 'titre',
          emoji: '🪪',
          titre: 'Être citoyen',
          texte: 'Être citoyen d\'un État, c\'est avoir la nationalité de cet État. C\'est aussi avoir des droits et des devoirs.',
          narration: 'Être citoyen d\'un État, c\'est avoir sa nationalité, et donc des droits et des devoirs. Ils garantissent un équilibre entre les libertés individuelles et le bien commun.',
        },
        {
          type: 'balance',
          titre: 'Qui est concerné ?',
          gauche: { titre: 'Seulement les citoyens français', items: ['Le droit de vote', 'La participation à la défense nationale', 'La participation au jury d\'assises'] },
          droite: { titre: 'Toutes les personnes résidant en France', items: ['La plupart des droits et des devoirs', 'La loi et les règlements', 'Quels que soient leur nationalité ou leur statut'] },
          narration: 'Certains droits et devoirs sont réservés aux citoyens français. Mais la plupart s\'appliquent à toutes les personnes qui résident en France, quels que soient leur nationalité ou leur statut.',
        },
        {
          type: 'duo',
          titre: 'Deux grands codes',
          gauche: { emoji: '📘', titre: 'Le Code civil', texte: 'Il définit les règles essentielles entre les personnes. Il a été promulgué en 1804 par Napoléon Bonaparte.' },
          droite: { emoji: '🚨', titre: 'Le Code pénal', texte: 'Il définit les infractions et précise les peines qui les sanctionnent.' },
          narration: 'La loi et les règlements s\'appliquent à tous. Deux exemples : le Code civil et le Code pénal.',
        },
        {
          type: 'zoom',
          titre: 'Qui garantit les droits fondamentaux ?',
          centre: { emoji: '🛡️', texte: 'Les droits fondamentaux' },
          autour: [
            ['📜', 'La Constitution de la Ve République (notamment son préambule)'],
            ['🗽', 'La Déclaration des droits de l\'homme et du citoyen de 1789'],
            ['📄', 'Le préambule de la Constitution de 1946'],
            ['🌿', 'La Charte de l\'environnement de 2004'],
            ['🌍', 'Les textes internationaux ratifiés, comme la Convention européenne des droits de l\'homme (CEDH)'],
          ],
        },
        {
          type: 'points',
          titre: 'Où se renseigner sur les lois ?',
          points: [
            ['💻', 'www.legifrance.gouv.fr : toutes les lois, souvent regroupées en codes.'],
            ['🏛️', 'www.vie-publique.fr : les principales règles et le fonctionnement des institutions.'],
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Le droit de vote est réservé aux citoyens français.', true, 'Oui, comme la participation à la défense nationale et au jury d\'assises.'],
            ['La loi et les règlements ne s\'appliquent qu\'aux Français.', false, 'La loi et les règlements s\'appliquent à tous.'],
            ['Le Code civil a été promulgué en 1804 par Napoléon Bonaparte.', true, 'Il définit les règles essentielles applicables entre les personnes.'],
          ],
        },
      ],
      questions: [
        { q: 'Que signifie être citoyen d\'un État ?', r: 'Avoir la nationalité de cet État, et donc avoir des droits et des devoirs.' },
        { q: 'Citez des droits et devoirs réservés aux citoyens français.', r: 'Le droit de vote, la participation à la défense nationale et au jury d\'assises.' },
        { q: 'Qui a promulgué le Code civil, et en quelle année ?', r: 'Napoléon Bonaparte, en 1804.' },
        { q: 'Quels textes garantissent les droits fondamentaux en France ?', r: 'La Constitution de 1958, la DDHC de 1789, le préambule de 1946, la Charte de l\'environnement de 2004 et des textes internationaux (CEDH).' },
      ],
    },

    // ─────────────────────────────── p. 26 ───────────────────────────────
    {
      page: 26,
      partie: 3,
      section: 'I. Les droits fondamentaux — A. Les droits liés à la liberté individuelle',
      titre: 'Choix, pensée et expression',
      emoji: '🗽',
      type: 'contenu',
      résumé: 'La liberté de choix consiste à pouvoir faire tout ce qui ne nuit pas à autrui (article 4 de la DDHC). La liberté de pensée est totale : chacun peut croire ou ne pas croire (article 10). La liberté d\'expression a des limites : pas d\'appel à la violence, pas d\'insulte ni de menace, pas de propos discriminatoires, pas de haine sur les réseaux sociaux.',
      scènes: [
        {
          type: 'citation',
          texte: '« La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui. »',
          source: 'Article 4 de la Déclaration des droits de l\'homme et du citoyen de 1789, cité par le préambule de la Constitution de 1958',
          narration: 'La liberté de choix permet de décider de son mode de vie, de ses relations et de ses projets, dans les limites de la loi. L\'article 4 de la Déclaration de 1789 dit : la liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui.',
        },
        {
          type: 'devinette',
          question: 'Quel tableau célèbre illustre la liberté dans le livret, et qui l\'a peint ?',
          réponse: '« La Liberté guidant le peuple », peint par Eugène Delacroix en 1830.',
          indice: 'Une femme brandit le drapeau tricolore au-dessus de la foule.',
        },
        {
          type: 'citation',
          texte: '« Nul ne doit être inquiété pour ses opinions, même religieuses, pourvu que leur manifestation ne trouble pas l\'ordre public établi par la loi. »',
          source: 'Article 10 de la Déclaration des droits de l\'homme et du citoyen de 1789',
          narration: 'La liberté de pensée est un droit fondamental. Le préambule de la Constitution renvoie à l\'article 10 de la Déclaration de 1789.',
        },
        {
          type: 'zoom',
          titre: 'Liberté de pensée, de conscience et de religion',
          centre: { emoji: '🧠', texte: 'Penser et croire librement' },
          autour: [
            ['💭', 'Croire, réfléchir et douter sans contrainte : la liberté de pensée est totale'],
            ['🙏', 'Choisir sa religion et la pratiquer librement'],
            ['🚫', 'Ou ne pas croire et ne pas avoir de religion'],
            ['⛓️', 'Les personnes emprisonnées gardent la liberté de culte'],
            ['🗳️', 'Adhérer à un parti politique, sans condition'],
          ],
        },
        {
          type: 'duo',
          titre: 'La liberté d\'expression et ses limites',
          gauche: { emoji: '🗣️', titre: 'Permis', texte: 'Chacun est libre d\'exprimer ses idées et ses opinions, y compris sur les réseaux sociaux.' },
          droite: { emoji: '⛔', titre: 'Interdit', texte: 'Appeler à la violence, insulter ou menacer, diffuser des propos discriminatoires, publier des contenus qui incitent à la haine ou à la violence.' },
          narration: 'La liberté d\'expression s\'exerce dans les limites fixées par la loi. L\'État peut la limiter, notamment pour éviter la diffusion de propos discriminatoires.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['La liberté de pensée est totale.', true, 'Chacun peut croire, réfléchir et douter sans contrainte.'],
            ['En France, il faut avoir une religion.', false, 'On peut croire en un ou plusieurs dieux, mais aussi ne pas croire et ne pas avoir de religion.'],
            ['Sur les réseaux sociaux, les contenus qui incitent à la haine sont autorisés.', false, 'La liberté d\'expression y est protégée par la loi, mais ces contenus sont interdits.'],
          ],
        },
      ],
      questions: [
        { q: 'Que dit l\'article 4 de la DDHC sur la liberté ?', r: '« La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui. »' },
        { q: 'Une personne en prison garde-t-elle la liberté de culte ?', r: 'Oui, les personnes emprisonnées conservent la liberté de culte pendant leur détention.' },
        { q: 'Quelles sont les limites de la liberté d\'expression ?', r: 'Pas d\'appel à la violence, pas d\'insulte ni de menace, pas de propos discriminatoires ni de contenus incitant à la haine.' },
        { q: 'Qui a peint « La Liberté guidant le peuple », et quand ?', r: 'Eugène Delacroix, en 1830.' },
      ],
    },

    // ─────────────────────────────── p. 27 ───────────────────────────────
    {
      page: 27,
      partie: 3,
      section: 'I. Les droits fondamentaux — A. Les droits liés à la liberté individuelle (suite)',
      titre: 'Liberté de la presse et de circuler',
      emoji: '📰',
      type: 'contenu',
      résumé: 'La presse est libre (article 11 de la DDHC), mais elle ne peut pas diffamer, inciter à des crimes ou délits, ni contester des crimes contre l\'humanité. On circule librement en France, dans l\'Union européenne et dans l\'espace Schengen (23 États de l\'UE et 4 associés), avec des exceptions : prisonniers, visas pour les non-Européens, état d\'urgence.',
      scènes: [
        {
          type: 'citation',
          texte: '« La libre communication des pensées et des opinions »',
          source: 'Article 11 de la Déclaration des droits de l\'homme et du citoyen',
          narration: 'Selon l\'article 11 de la Déclaration, la libre communication des pensées et des opinions est un principe fondamental. C\'est pourquoi la presse est libre en France.',
        },
        {
          type: 'duo',
          titre: 'La presse : libre mais encadrée',
          gauche: { emoji: '📰', titre: 'Les journalistes peuvent', texte: 'Informer librement sur la France et le monde, donner leur opinion, parler des institutions, des personnalités ou des croyances religieuses.' },
          droite: { emoji: '⚖️', titre: 'Ils ne peuvent pas', texte: 'Publier des propos diffamatoires, inciter à commettre des crimes ou des délits, contester des crimes contre l\'humanité. Sinon : poursuites judiciaires.' },
        },
        {
          type: 'points',
          titre: 'A-t-on le droit de tout dire ? Non : il est interdit de diffuser…',
          points: [
            ['🤬', 'des injures'],
            ['🗞️', 'des propos diffamatoires'],
            ['🔥', 'des provocations à la haine'],
            ['☠️', 'l\'apologie de crimes contre l\'humanité'],
          ],
          narration: 'La liberté d\'expression est un droit fondamental, mais elle a des limites, pour respecter les droits des autres.',
        },
        {
          type: 'chiffres',
          titre: 'L\'espace Schengen',
          chiffres: [
            [23, '', 'États membres de l\'Union européenne'],
            [4, '', 'États associés : Norvège, Islande, Suisse, Liechtenstein'],
          ],
          narration: 'Tout citoyen est libre de circuler en France et dans l\'Union européenne. L\'espace Schengen est une zone de libre circulation des personnes, sans contrôle aux frontières intérieures.',
        },
        {
          type: 'zoom',
          titre: 'La liberté d\'aller et venir : règles et exceptions',
          centre: { emoji: '🚶', texte: 'Liberté de circulation' },
          autour: [
            ['🧒', 'Mineur qui voyage sans ses parents : autorisation de sortie du territoire'],
            ['⛓️', 'Prisonniers : privés de cette liberté le temps de leur peine'],
            ['🛂', 'Étrangers non européens : conditions d\'entrée posées par les États, avec les visas'],
            ['🪪', 'Étranger hors UE : titre de séjour obligatoire à l\'expiration du visa'],
            ['🚨', 'Crise exceptionnelle et temporaire (état d\'urgence) : l\'État peut la restreindre'],
          ],
          narration: 'Les citoyens peuvent entrer et sortir librement du territoire, et leurs déplacements en France ne font en principe l\'objet d\'aucun contrôle. Mais il existe des exceptions.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Les journalistes peuvent parler des croyances religieuses.', true, 'Ils peuvent informer et donner leur opinion, y compris sur les institutions, les personnalités ou les croyances religieuses.'],
            ['Faire l\'apologie de crimes contre l\'humanité est permis au nom de la liberté d\'expression.', false, 'C\'est interdit, comme les injures, les propos diffamatoires et les provocations à la haine.'],
            ['En cas d\'état d\'urgence, l\'État peut restreindre la liberté d\'aller et venir.', true, 'C\'est une exception prévue en cas de « crise exceptionnelle et temporaire ».'],
          ],
        },
      ],
      questions: [
        { q: 'Quel article de la DDHC fonde la liberté de la presse ?', r: 'L\'article 11, sur la « libre communication des pensées et des opinions ».' },
        { q: 'Que ne peuvent pas publier les journalistes ?', r: 'Des propos diffamatoires, des incitations à commettre des crimes ou des délits, ou la contestation de crimes contre l\'humanité.' },
        { q: 'Combien d\'États compte l\'espace Schengen ?', r: '23 États membres de l\'Union européenne et 4 États associés : Norvège, Islande, Suisse, Liechtenstein.' },
        { q: 'Un mineur peut-il quitter la France sans ses parents ?', r: 'Oui, mais il doit obtenir une autorisation de sortie du territoire.' },
      ],
    },

    // ─────────────────────────────── p. 28 ───────────────────────────────
    {
      page: 28,
      partie: 3,
      section: 'I. Les droits fondamentaux — B. Les droits liés à la dignité',
      titre: 'Vie privée et dignité humaine',
      emoji: '🔒',
      type: 'contenu',
      résumé: 'La vie privée est garantie par la Constitution : secret médical, intimité, droit à l\'image. En cas d\'atteinte, on peut porter plainte à la police ou à la gendarmerie. La dignité humaine (préambule de 1946) interdit de traiter une personne comme un objet ou un moyen ; la Charte des droits fondamentaux de l\'UE cite 5 droits essentiels.',
      scènes: [
        {
          type: 'zoom',
          titre: 'Le droit au respect de la vie privée',
          centre: { emoji: '🔒', texte: 'La vie privée, garantie par la Constitution' },
          autour: [
            ['🩺', 'Le secret professionnel et médical'],
            ['💞', 'L\'intimité : relations amoureuses, préférences sexuelles'],
            ['📸', 'Le droit à l\'image'],
            ['🎧', 'Des limites à la surveillance et aux enquêtes (écoutes téléphoniques)'],
            ['💻', 'Des règles contre les risques des outils numériques'],
            ['👨‍⚖️', 'Le juge judiciaire veille au respect de ce droit'],
          ],
          narration: 'Un médecin ne peut pas révéler le dossier médical d\'une personne sans son consentement. Les relations amoureuses ou les préférences sexuelles d\'une personne ne peuvent pas être dévoilées à son insu.',
        },
        {
          type: 'scène',
          titre: 'La vidéo de trop',
          décor: '🏡🌳',
          acteurs: [
            { emoji: '🧑', nom: 'Hugo', dit: 'J\'ai filmé la voisine dans son jardin, je vais poster la vidéo !' },
            { emoji: '👩', nom: 'Inès', dit: 'Stop ! Il est interdit de filmer une personne sans son autorisation dans un lieu privé.' },
            { emoji: '👵', nom: 'La voisine', dit: 'Si ma vie privée n\'est pas respectée, je peux porter plainte auprès de la police ou de la gendarmerie.' },
          ],
          narration: 'Le droit à la vie privée et le droit à l\'image sont distincts mais étroitement liés. Filmer sans autorisation est aussi interdit dans un lieu public où la personne peut supposer qu\'elle ne sera pas observée ou écoutée.',
        },
        {
          type: 'titre',
          emoji: '🤝',
          titre: 'La dignité de la personne humaine',
          texte: 'Une personne ne doit jamais être traitée comme un objet ou un moyen. Ce principe est inscrit dans le préambule de la Constitution de 1946.',
        },
        {
          type: 'points',
          titre: 'Charte des droits fondamentaux de l\'UE : 5 droits essentiels',
          points: [
            ['👤', 'La dignité humaine'],
            ['❤️', 'Le droit à la vie'],
            ['🧍', 'Le droit à l\'intégrité de la personne (protection du corps et de l\'esprit)'],
            ['🚫', 'L\'interdiction de la torture et des traitements inhumains ou dégradants'],
            ['⛓️', 'L\'interdiction de l\'esclavage et du travail forcé'],
          ],
        },
        {
          type: 'devinette',
          question: 'Une personne travaille pour une entreprise, mais elle n\'est pas payée. Qu\'en dit le livret ?',
          réponse: 'C\'est une situation d\'atteinte à la dignité.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['On peut filmer une personne chez elle sans son autorisation.', false, 'C\'est interdit dans un lieu privé, et aussi dans un lieu public où elle peut supposer ne pas être observée.'],
            ['Le juge judiciaire veille au respect du droit à la vie privée.', true, 'Et la victime d\'une atteinte peut porter plainte auprès de la police ou de la gendarmerie.'],
            ['Faire travailler une personne sans la payer est une atteinte à la dignité.', true, 'Une personne employée par une entreprise et non rémunérée est dans une situation d\'atteinte à la dignité.'],
          ],
        },
      ],
      questions: [
        { q: 'Un médecin peut-il révéler votre dossier médical ?', r: 'Non, pas sans votre consentement : c\'est le secret professionnel et médical.' },
        { q: 'Que faire si votre droit à la vie privée est violé ?', r: 'Déposer une plainte auprès des forces de sécurité intérieure : police nationale ou gendarmerie nationale.' },
        { q: 'Que signifie le droit à la dignité humaine ?', r: 'Une personne ne doit jamais être traitée comme un objet ou un moyen (préambule de la Constitution de 1946).' },
        { q: 'Citez les 5 droits essentiels de la Charte des droits fondamentaux de l\'UE.', r: 'Dignité humaine, droit à la vie, intégrité de la personne, interdiction de la torture, interdiction de l\'esclavage et du travail forcé.' },
      ],
    },

    // ─────────────────────────────── p. 29 ───────────────────────────────
    {
      page: 29,
      partie: 3,
      section: 'I. Les droits fondamentaux — B. La dignité (suite) et C. La sûreté et la justice',
      titre: 'Son corps et le droit à la sûreté',
      emoji: '🫀',
      type: 'contenu',
      résumé: 'Chacun dispose de son corps : contraception, IVG garantie par la Constitution depuis le 8 mars 2024 (même pour une mineure), PMA pour toutes les femmes (loi du 2 août 2021) ; la GPA est un délit. Le droit à la sûreté protège contre les arrestations arbitraires : en garde à vue, on peut garder le silence, avoir un avocat et prévenir un proche.',
      scènes: [
        {
          type: 'titre',
          emoji: '🫀',
          titre: 'Le droit à disposer de son corps',
          texte: 'Chacun fait ses propres choix concernant son corps, notamment médicaux, dans le respect de son intégrité et de sa dignité.',
          narration: 'Toute atteinte, comme le viol, la mutilation, la stérilisation forcée ou l\'excision, est interdite. C\'est une violation de ce droit, sanctionnée par le juge.',
        },
        {
          type: 'frise',
          titre: 'Deux dates à retenir',
          étapes: [
            ['2 août 2021', 'Loi bioéthique : la PMA est autorisée pour toutes les femmes', '👶'],
            ['8 mars 2024', 'La liberté de recourir à l\'IVG est garantie par la Constitution', '📜'],
          ],
          narration: 'La procréation médicalement assistée aide les couples hétérosexuels, les couples lesbiens et les femmes seules à concevoir un enfant. L\'IVG, c\'est l\'interruption volontaire de grossesse.',
        },
        {
          type: 'duo',
          titre: 'Ce que la loi garantit… et ses limites',
          gauche: { emoji: '💊', titre: 'Garanti', texte: 'La contraception, y compris pour les mineurs. L\'IVG, même pour une mineure, dans les conditions fixées par la loi. Le droit de refuser un traitement ou un acte médical.' },
          droite: { emoji: '⚠️', titre: 'Limites', texte: 'La gestation pour autrui (GPA), où une autre femme porte un enfant pour un couple, n\'est pas autorisée : c\'est un délit. La vaccination est obligatoire pour les enfants.' },
        },
        {
          type: 'points',
          titre: 'Police et gendarmerie',
          points: [
            ['🛡️', 'Maintien de l\'ordre et sécurité publique'],
            ['🔎', 'Enquêtes judiciaires'],
            ['🆘', 'Prévention et assistance'],
            ['👨‍⚖️', 'Sous le contrôle du juge : pouvoir d\'arrêter, de détenir, d\'interroger et de fouiller'],
          ],
          narration: 'Le droit à la sûreté protège contre toute arrestation, détention ou sanction arbitraire. Personne ne peut être arrêté ou enfermé sans raison légale, ou sans que les procédures prévues par la loi soient respectées.',
        },
        {
          type: 'scène',
          titre: 'En garde à vue',
          décor: '🚓🏢',
          acteurs: [
            { emoji: '👮', nom: 'La policière', dit: 'Vous êtes placé en garde à vue. Je vous informe des motifs et de vos droits.' },
            { emoji: '🧔', nom: 'Samir', dit: 'Quels sont mes droits ?' },
            { emoji: '👮', nom: 'La policière', dit: 'Vous avez le droit de garder le silence, d\'être assisté par un avocat et de prévenir un proche.' },
            { emoji: '👩‍⚖️', nom: 'L\'avocate', dit: 'Et n\'oubliez pas : toute privation de liberté est contrôlée par un juge.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['La vaccination est obligatoire pour les enfants.', true, 'En revanche, toute personne est libre de refuser un traitement ou un acte médical.'],
            ['Une mineure ne peut pas avoir recours à l\'IVG.', false, 'Une femme enceinte, même mineure, peut demander une IVG dans les conditions fixées par la loi.'],
            ['La police peut arrêter quelqu\'un sans aucun contrôle.', false, 'Elle agit sous le contrôle du juge : toute privation de liberté est contrôlée par un juge.'],
          ],
        },
      ],
      questions: [
        { q: 'Depuis quand l\'IVG est-elle garantie par la Constitution ?', r: 'Depuis le 8 mars 2024.' },
        { q: 'Qui peut bénéficier de la PMA depuis la loi du 2 août 2021 ?', r: 'Toutes les femmes : les couples hétérosexuels, les couples lesbiens et les femmes seules.' },
        { q: 'La GPA est-elle autorisée en France ?', r: 'Non. La gestation pour autrui n\'est pas autorisée : c\'est un délit.' },
        { q: 'Quels droits a une personne en garde à vue ?', r: 'Être informée des motifs et de ses droits : garder le silence, être assistée par un avocat et prévenir un proche.' },
      ],
    },

    // ─────────────────────────────── p. 30 ───────────────────────────────
    {
      page: 30,
      partie: 3,
      section: 'I. Les droits fondamentaux — C. La justice (suite) et D. Les droits politiques',
      titre: 'Justice et droits politiques',
      emoji: '⚖️',
      type: 'contenu',
      résumé: 'Chacun a droit à un procès équitable, à un avocat et à la présomption d\'innocence. L\'aide juridictionnelle, le Défenseur des droits (créé en 2011) et les maisons de justice et du droit facilitent l\'accès à la justice. Voter, être candidat et se réunir pacifiquement sont des droits politiques ; la liberté de réunion peut être restreinte sous le contrôle du juge.',
      scènes: [
        {
          type: 'zoom',
          titre: 'Le droit à un procès équitable',
          centre: { emoji: '⚖️', texte: 'Faire valoir ses droits devant les tribunaux' },
          autour: [
            ['👨‍⚖️', 'Des juges indépendants et impartiaux'],
            ['🗣️', 'Être entendu et se défendre'],
            ['👩‍💼', 'Être assisté par un avocat'],
            ['🟰', 'Être traité de manière égale'],
            ['😇', 'Présomption d\'innocence tant qu\'il n\'y a pas de condamnation définitive'],
            ['📏', 'Des peines prévues par la loi et proportionnées aux faits'],
          ],
          narration: 'Ces principes assurent une justice équitable, transparente et respectueuse des droits fondamentaux.',
        },
        {
          type: 'points',
          titre: 'Trois aides pour accéder à la justice',
          points: [
            ['💶', 'L\'aide juridictionnelle : une aide financière de l\'État pour avoir un avocat lors d\'un procès, quand on a peu de moyens'],
            ['🛡️', 'Le Défenseur des droits : litige avec une administration, discrimination, atteinte aux droits'],
            ['🏛️', 'Les maisons de justice et du droit : conseils et permanences gratuites, avec des associations (coordination : CDAD)'],
          ],
        },
        {
          type: 'devinette',
          question: 'Quelle autorité administrative indépendante, créée en 2011, défend notamment les droits des usagers des services publics ?',
          réponse: 'Le Défenseur des droits. On peut être reçu par un délégué dans des structures locales.',
        },
        {
          type: 'duo',
          titre: 'Les droits politiques',
          gauche: { emoji: '🗳️', titre: 'Voter et être candidat', texte: 'Le droit de vote et le droit de se porter candidat aux élections sont les fondements de la démocratie représentative.' },
          droite: { emoji: '🧑‍🤝‍🧑', titre: 'Se réunir', texte: 'Chacun peut se rassembler pacifiquement pour exprimer des opinions, débattre ou défendre des intérêts communs.' },
        },
        {
          type: 'flux',
          titre: 'Quand la liberté de réunion peut être limitée',
          étapes: [
            ['🧑‍🤝‍🧑', 'Une réunion pacifique : une liberté importante pour la démocratie'],
            ['⚠️', 'Un risque de trouble à l\'ordre public : violences, émeutes…'],
            ['🏛️', 'L\'autorité administrative (maire, préfet…) peut la restreindre'],
            ['👨‍⚖️', 'Toujours sous le contrôle du juge'],
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Une personne poursuivie est présumée coupable jusqu\'à son procès.', false, 'Elle est présumée innocente tant qu\'aucune condamnation définitive n\'a été prononcée.'],
            ['Les maisons de justice et du droit proposent des permanences gratuites.', true, 'Grâce à des associations spécialisées, sous la coordination des conseils départementaux d\'accès au droit (CDAD).'],
            ['Le maire ou le préfet peut restreindre la liberté de réunion sans aucun contrôle.', false, 'Il peut la restreindre en cas de risque de trouble à l\'ordre public, mais sous le contrôle du juge.'],
          ],
        },
      ],
      questions: [
        { q: 'Qu\'est-ce que la présomption d\'innocence ?', r: 'Une personne est présumée innocente tant qu\'aucune condamnation définitive n\'a été prononcée.' },
        { q: 'Qu\'est-ce que l\'aide juridictionnelle ?', r: 'Une aide financière de l\'État pour les personnes ayant peu de moyens qui ont besoin d\'un avocat lors d\'un procès.' },
        { q: 'Quand le Défenseur des droits intervient-il ?', r: 'En cas de litige avec une administration, de discrimination ou d\'atteinte aux droits. Il a été créé en 2011.' },
        { q: 'Qui peut restreindre la liberté de réunion, et quand ?', r: 'L\'autorité administrative (maire, préfet…), en cas de risque de trouble à l\'ordre public, sous le contrôle du juge.' },
      ],
    },

    // ─────────────────────────────── p. 31 ───────────────────────────────
    {
      page: 31,
      partie: 3,
      section: 'I. Les droits fondamentaux — D. Les droits politiques (suite) et E. Les droits environnementaux',
      titre: 'Manifester, s\'associer, environnement',
      emoji: '📣',
      type: 'contenu',
      résumé: 'Manifester est une liberté fondamentale, mais une manifestation doit être déclarée à l\'administration (parcours, organisateurs). La loi du 1er juillet 1901 permet de créer ou de rejoindre une association, qui doit respecter les principes républicains. La Charte de l\'environnement de 2004 garantit le droit à un environnement équilibré et respectueux de la santé.',
      scènes: [
        {
          type: 'flux',
          titre: 'Organiser une manifestation',
          étapes: [
            ['📣', 'Manifester : une liberté fondamentale reconnue dans la DDHC'],
            ['📝', 'Déclarer la manifestation auprès de l\'administration'],
            ['🗺️', 'Préciser le parcours'],
            ['🧑‍💼', 'Identifier les organisateurs'],
            ['🕊️', 'Objectif : éviter les troubles à l\'ordre public'],
          ],
          narration: 'Manifester fait partie des moyens d\'expression collective traditionnels dans la vie politique et sociale française. La manifestation est inscrite dans le droit français.',
        },
        {
          type: 'scène',
          titre: 'Créer une association',
          décor: '🏘️☕',
          acteurs: [
            { emoji: '👩', nom: 'Aïcha', dit: 'Avec des voisins, on veut créer une association pour le quartier. On a le droit ?' },
            { emoji: '👨', nom: 'Paul', dit: 'Oui ! La loi du 1er juillet 1901 reconnaît le droit de créer ou de rejoindre une association.' },
            { emoji: '👩', nom: 'Aïcha', dit: 'Et il y a des règles ?' },
            { emoji: '👨', nom: 'Paul', dit: 'Respecter les lois de la République. Une association qui ne respecte pas les principes républicains peut être dissoute par l\'État.' },
          ],
        },
        {
          type: 'titre',
          emoji: '🌿',
          titre: 'Le droit à un environnement sain',
          texte: 'Chacun a le droit de vivre dans un environnement équilibré et respectueux de la santé.',
          narration: 'Ce droit est reconnu par la Charte de l\'environnement de 2004, intégrée dans la Constitution de 1958.',
        },
        {
          type: 'frise',
          titre: 'Deux textes à retenir',
          étapes: [
            ['1er juillet 1901', 'Loi sur la liberté d\'association', '🤝'],
            ['2004', 'Charte de l\'environnement, intégrée dans la Constitution de 1958', '🌱'],
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Une manifestation doit être déclarée auprès de l\'administration.', true, 'Cette déclaration préalable précise le parcours et identifie les organisateurs.'],
            ['Une association peut agir contre les principes républicains sans risque.', false, 'Une association qui ne respecte pas les principes républicains peut être dissoute par l\'État.'],
            ['La Charte de l\'environnement de 2004 est intégrée dans la Constitution de 1958.', true, 'Elle reconnaît le droit de vivre dans un environnement équilibré et respectueux de la santé.'],
          ],
        },
      ],
      questions: [
        { q: 'Que faut-il faire avant d\'organiser une manifestation ?', r: 'La déclarer auprès de l\'administration, en précisant le parcours et en identifiant les organisateurs.' },
        { q: 'Quelle loi reconnaît la liberté d\'association ?', r: 'La loi du 1er juillet 1901.' },
        { q: 'Une association peut-elle être dissoute ?', r: 'Oui, par l\'État, si elle ne respecte pas les principes républicains.' },
        { q: 'Quel texte reconnaît le droit à un environnement sain ?', r: 'La Charte de l\'environnement de 2004, intégrée dans la Constitution de 1958.' },
      ],
    },

    // ─────────────────────────────── p. 32 ───────────────────────────────
    {
      page: 32,
      partie: 3,
      section: 'II. Les obligations et devoirs des citoyens — A. Respecter les lois et les institutions',
      titre: 'Respecter la loi : les infractions',
      emoji: '🚦',
      type: 'contenu',
      résumé: 'Les droits s\'accompagnent de devoirs. Toute personne vivant en France doit respecter les lois. Les infractions sont classées en trois catégories : contraventions (amende, pas de prison, tribunal de police), délits (amende de 3 750 € ou plus et jusqu\'à 10 ans de prison, tribunal correctionnel) et crimes.',
      scènes: [
        {
          type: 'titre',
          emoji: '📜',
          titre: 'Des droits… et des devoirs',
          texte: 'Les devoirs garantissent la cohésion sociale, le respect des lois et le bon fonctionnement de la démocratie.',
          narration: 'Les principaux devoirs découlent de la Constitution, des lois et des principes républicains. Toute personne vivant en France doit respecter les lois en vigueur, qui garantissent l\'ordre public et la sécurité de tous.',
        },
        {
          type: 'flux',
          titre: 'Trois catégories d\'infractions, selon leur gravité',
          étapes: [
            ['🟡', 'Les contraventions : les moins graves'],
            ['🟠', 'Les délits : les infractions intermédiaires'],
            ['🔴', 'Les crimes : les plus graves'],
          ],
          narration: 'Le juge judiciaire veille à la bonne application des lois. Il peut prononcer les sanctions prévues par la loi si elle n\'est pas respectée.',
        },
        {
          type: 'duo',
          titre: 'Contravention ou délit ?',
          gauche: { emoji: '🚗', titre: 'Contravention', texte: 'Excès de vitesse, tapage nocturne… Pas de prison, mais une amende que l\'on est obligé de payer. Jugée par le tribunal de police.' },
          droite: { emoji: '🚔', titre: 'Délit', texte: 'Vol, fraude fiscale, abus de biens sociaux, harcèlement moral, agression sexuelle, homicide involontaire… Jugé par le tribunal correctionnel.' },
        },
        {
          type: 'chiffres',
          titre: 'Les peines pour un délit',
          chiffres: [
            [3750, ' €', 'amende égale ou supérieure à 3 750 euros'],
            [10, ' ans', 'd\'emprisonnement au maximum'],
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Un excès de vitesse est une contravention.', true, 'Comme le tapage nocturne : une amende obligatoire, mais pas de prison.'],
            ['Le vol est une contravention.', false, 'C\'est un délit, jugé par le tribunal correctionnel.'],
            ['Seuls les Français doivent respecter les lois.', false, 'Toute personne vivant en France a l\'obligation de respecter les lois en vigueur.'],
          ],
        },
      ],
      questions: [
        { q: 'Quelles sont les trois catégories d\'infractions ?', r: 'Les contraventions (les moins graves), les délits (intermédiaires) et les crimes (les plus graves).' },
        { q: 'Une contravention peut-elle mener en prison ?', r: 'Non. Elle est sanctionnée par une amende obligatoire et jugée par le tribunal de police.' },
        { q: 'Quelle peine pour un délit, et quel tribunal le juge ?', r: 'Une amende de 3 750 € ou plus et jusqu\'à 10 ans de prison. Le tribunal correctionnel juge les délits.' },
        { q: 'Qui veille à la bonne application des lois ?', r: 'Le juge judiciaire, qui peut prononcer les sanctions prévues par la loi.' },
      ],
    },

    // ─────────────────────────────── p. 33 ───────────────────────────────
    {
      page: 33,
      partie: 3,
      section: 'II. Les obligations et devoirs des citoyens — A. Respecter les lois et les institutions (suite)',
      titre: 'Crimes et respect des institutions',
      emoji: '🏛️',
      type: 'contenu',
      résumé: 'Les crimes (braquage, viol, assassinat, meurtre, terrorisme…) sont punis jusqu\'à la perpétuité et jugés par la cour d\'assises ou la cour criminelle. Il faut respecter les agents publics, les élus locaux et les juges : l\'outrage, le refus d\'obéir à un policier ou à un gendarme et l\'outrage au drapeau ou à l\'hymne sont punis. Les décisions de justice s\'imposent à tous.',
      scènes: [
        {
          type: 'titre',
          emoji: '🔴',
          titre: 'Les crimes',
          texte: 'Ce sont les infractions les plus graves : braquage, viol, assassinat, meurtre, terrorisme…',
          narration: 'Les crimes sont sanctionnés par une peine de réclusion criminelle pouvant aller jusqu\'à la perpétuité, c\'est-à-dire la prison à vie.',
        },
        {
          type: 'points',
          titre: 'Qui juge quoi ?',
          points: [
            ['🟡', 'Contravention → tribunal de police'],
            ['🟠', 'Délit → tribunal correctionnel'],
            ['🔴', 'Crime → cour d\'assises ou cour criminelle'],
          ],
        },
        {
          type: 'devinette',
          question: 'Une personne condamnée pour viol peut-elle perdre le droit de voter ?',
          réponse: 'Oui. Certaines condamnations graves entraînent la privation des droits civiques et politiques : pendant plusieurs années, la personne ne peut plus voter ni se présenter aux élections.',
        },
        {
          type: 'zoom',
          titre: 'Le respect des institutions',
          centre: { emoji: '🏛️', texte: 'L\'autorité de l\'État, des collectivités territoriales et de la justice' },
          autour: [
            ['🤝', 'Respecter les agents publics, les élus locaux et les juges dans leurs fonctions'],
            ['⚠️', 'Sanctions aggravées en cas d\'atteinte aux forces de l\'ordre, aux juges ou aux enseignants'],
            ['🗯️', 'L\'outrage est sanctionné (article 433-5 du Code pénal)'],
            ['🚫', 'Refuser d\'obéir à un policier ou à un gendarme : un délit'],
            ['🇫🇷', 'L\'outrage au drapeau tricolore ou à l\'hymne national est puni'],
            ['⚖️', 'Les décisions de justice s\'imposent à tous : c\'est l\'État de droit'],
          ],
        },
        {
          type: 'scène',
          titre: 'Le contrôle',
          décor: '🚦🚓',
          acteurs: [
            { emoji: '👮‍♂️', nom: 'Le policier', dit: 'Bonjour, contrôle de police. Arrêtez-vous, s\'il vous plaît.' },
            { emoji: '😠', nom: 'Le conducteur', dit: 'Je suis pressé, je ne m\'arrête pas ! Et vous, vous êtes un…' },
            { emoji: '👩', nom: 'La passagère', dit: 'Arrête ! Refuser d\'obéir à un policier est un délit. Et l\'outrage envers lui est puni plus sévèrement.' },
          ],
          narration: 'Des peines renforcées sont prévues quand l\'outrage vise une personne dépositaire de l\'autorité publique, comme un policier, un magistrat ou un élu.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Le terrorisme est un crime.', true, 'Comme le braquage, le viol, l\'assassinat ou le meurtre.'],
            ['Outrager le drapeau tricolore ou l\'hymne national n\'est pas puni.', false, 'Le Code pénal sanctionne l\'outrage au drapeau tricolore ou à l\'hymne national, notamment lors d\'une manifestation publique.'],
            ['Les décisions de justice doivent être respectées par tous.', true, 'C\'est le principe de l\'État de droit.'],
          ],
        },
      ],
      questions: [
        { q: 'Qui juge les crimes ?', r: 'La cour d\'assises ou la cour criminelle.' },
        { q: 'Quelle est la peine maximale pour un crime ?', r: 'La réclusion criminelle à perpétuité, c\'est-à-dire la prison à vie.' },
        { q: 'Refuser d\'obéir à un policier, est-ce grave ?', r: 'Oui, c\'est un délit qui expose à une sanction pénale.' },
        { q: 'Que sanctionne l\'article 433-5 du Code pénal ?', r: 'L\'outrage envers une personne chargée d\'une mission de service public ; peines renforcées pour un policier, un magistrat ou un élu.' },
      ],
    },

    // ─────────────────────────────── p. 34 ───────────────────────────────
    {
      page: 34,
      partie: 3,
      section: 'II. Les obligations et devoirs des citoyens — B. Valeurs, C. Vie démocratique, D. Charges publiques',
      titre: 'Valeurs, vote et impôts',
      emoji: '🗳️',
      type: 'contenu',
      résumé: 'Être Français, c\'est partager la liberté, l\'égalité et la fraternité. Voter n\'est pas obligatoire, mais c\'est un devoir civique, et les résultats s\'imposent à tous. Tous les résidents financent les services publics (article 13 de la DDHC) : chaque année, on déclare l\'intégralité de ses revenus et on paie ses impôts.',
      scènes: [
        {
          type: 'titre',
          emoji: '🇫🇷',
          titre: 'Partager les valeurs de la République',
          texte: 'Être Français implique de partager les valeurs de liberté, d\'égalité et de fraternité, et de s\'engager à les respecter dans la vie quotidienne et en société.',
        },
        {
          type: 'duo',
          titre: 'Le vote',
          gauche: { emoji: '🗳️', titre: 'Pas obligatoire', texte: 'En France, le vote n\'est pas obligatoire, contrairement à certains pays.' },
          droite: { emoji: '🙋', titre: 'Mais un devoir civique', texte: 'Voter est un devoir civique important : il assure la légitimité des représentants élus.' },
        },
        {
          type: 'scène',
          titre: 'Le soir de l\'élection',
          décor: '📺🛋️',
          acteurs: [
            { emoji: '😤', nom: 'Marc', dit: 'Mon candidat a perdu. Je refuse ce résultat !' },
            { emoji: '👩', nom: 'Sofia', dit: 'Les résultats électoraux s\'imposent à tout citoyen, quelles que soient ses opinions politiques.' },
            { emoji: '😌', nom: 'Marc', dit: 'D\'accord… C\'est un principe essentiel de la démocratie et de l\'État de droit.' },
          ],
        },
        {
          type: 'citation',
          texte: '« Pour l\'entretien de la force publique et pour les dépenses d\'administration, une contribution commune est indispensable. »',
          source: 'Article 13 de la Déclaration des droits de l\'homme et du citoyen de 1789',
          narration: 'Financer les services publics est un devoir constitutionnel : tous les habitants doivent y contribuer, selon leurs moyens.',
        },
        {
          type: 'flux',
          titre: 'Les impôts, chaque année',
          étapes: [
            ['🧑', 'Toute personne majeure résidant en France, plus rattachée au foyer fiscal de ses parents…'],
            ['📝', '…déclare l\'intégralité de ses revenus…'],
            ['💶', '…et paie ses impôts…'],
            ['🚌', '…pour financer les transports, les équipements collectifs, l\'éducation, la santé et la sécurité.'],
          ],
          narration: 'Tous les résidents, et pas uniquement les Français, participent au financement des services publics. Attention : une fausse déclaration à l\'administration peut être sanctionnée.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Le vote est obligatoire en France.', false, 'Il n\'est pas obligatoire, mais c\'est un devoir civique important.'],
            ['Les résultats d\'une élection s\'imposent aussi à ceux qui ont voté pour le perdant.', true, 'Ils s\'imposent à tout citoyen, quelles que soient ses opinions politiques.'],
            ['Une fausse déclaration à l\'administration peut être sanctionnée.', true, 'Il faut déclarer l\'intégralité de ses revenus.'],
          ],
        },
      ],
      questions: [
        { q: 'Le vote est-il obligatoire en France ?', r: 'Non, mais c\'est un devoir civique important : il assure la légitimité des représentants élus.' },
        { q: 'Que dit l\'article 13 de la DDHC ?', r: '« Pour l\'entretien de la force publique et pour les dépenses d\'administration, une contribution commune est indispensable. »' },
        { q: 'Qui doit déclarer ses revenus chaque année ?', r: 'Toute personne majeure résidant en France qui n\'est plus rattachée au foyer fiscal de ses parents.' },
        { q: 'Les étrangers résidant en France doivent-ils payer des impôts ?', r: 'Oui : tous les résidents, et pas uniquement les Français, financent les services publics.' },
      ],
    },

    // ─────────────────────────────── p. 35 ───────────────────────────────
    {
      page: 35,
      partie: 3,
      section: 'II. Les obligations et devoirs des citoyens — E. Défendre la patrie et F. Protéger l\'environnement',
      titre: 'Défense et environnement',
      emoji: '🎖️',
      type: 'contenu',
      résumé: 'La défense repose d\'abord sur une armée de métier et la dissuasion nucléaire. Le service militaire n\'est plus obligatoire depuis 1997 ; dès 16 ans, on se fait recenser à la mairie pour la JDC. Un service militaire volontaire de 8 mois existe depuis le 1er janvier 2026. Chacun doit aussi protéger l\'environnement (Charte de 2004, article 2).',
      scènes: [
        {
          type: 'zoom',
          titre: 'Défendre la patrie et la sécurité nationale',
          centre: { emoji: '🛡️', texte: 'La défense nationale' },
          autour: [
            ['🎖️', 'En premier lieu, une armée de métier'],
            ['☢️', 'Une stratégie de dissuasion nucléaire'],
            ['📅', 'La Journée Défense et Citoyenneté (JDC) pour les jeunes'],
            ['🤝', 'Des réserves : militaire, police, citoyenne, sanitaire…'],
            ['🚨', 'En cas de crise ou de guerre, tout citoyen peut être appelé'],
            ['🇺🇳', 'Au Liban, la France s\'engage dans la FINUL (Nations unies)'],
          ],
        },
        {
          type: 'frise',
          titre: 'Du service obligatoire au service volontaire',
          étapes: [
            ['1997', 'Fin du service militaire obligatoire en France', '🪖'],
            ['1er janvier 2026', 'Mise en place du service militaire volontaire (SMV) de 8 mois', '🎖️'],
          ],
          narration: 'Aujourd\'hui, les jeunes participent à la JDC. Elle les sensibilise à leurs responsabilités en matière de sécurité nationale et leur fait découvrir les missions des forces armées, en temps de paix et en temps de guerre.',
        },
        {
          type: 'chiffres',
          titre: 'Les chiffres à retenir',
          chiffres: [
            [16, ' ans', 'recensement à la mairie pour la JDC'],
            [8, ' mois', 'durée du service militaire volontaire'],
            [25, ' ans', 'âge maximum pour le SMV (de 18 à 25 ans)'],
          ],
          narration: 'Le SMV s\'adresse aux jeunes de 18 à 25 ans, français ou étrangers, exclus du marché de l\'emploi. Il leur apporte une formation et affirme les valeurs de la République, pour renforcer la cohésion nationale et créer une culture de l\'engagement.',
        },
        {
          type: 'citation',
          texte: '« Toute personne a le devoir de prendre part à la préservation et à l\'amélioration de l\'environnement. »',
          source: 'Article 2 de la Charte de l\'environnement (2004)',
          narration: 'Depuis 2004, la Charte de l\'environnement impose à chacun de contribuer à la protection de l\'environnement.',
        },
        {
          type: 'duo',
          titre: 'L\'environnement et les valeurs républicaines',
          gauche: { emoji: '🟰', titre: 'Égalité', texte: 'Pour que chacun ait accès à un environnement sain.' },
          droite: { emoji: '🤝', titre: 'Fraternité', texte: 'Pour les générations futures et le bien commun.' },
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['La défense nationale repose en premier lieu sur une armée de métier et la dissuasion nucléaire.', true, 'C\'est ce que dit le livret ; des réserves permettent aussi aux volontaires de s\'engager.'],
            ['Le service militaire volontaire est réservé aux jeunes Français.', false, 'Il s\'adresse aux jeunes de 18 à 25 ans, français ou étrangers, exclus du marché de l\'emploi.'],
            ['Protéger l\'environnement est un devoir pour chacun.', true, 'Depuis 2004, la Charte de l\'environnement impose à chacun de contribuer à sa protection.'],
          ],
        },
      ],
      questions: [
        { q: 'Depuis quand le service militaire n\'est-il plus obligatoire ?', r: 'Depuis 1997.' },
        { q: 'À quel âge faut-il se faire recenser, et pourquoi ?', r: 'Dès 16 ans, à la mairie, pour participer à la Journée Défense et Citoyenneté (JDC).' },
        { q: 'Qu\'est-ce que le SMV ?', r: 'Un service militaire volontaire de 8 mois, mis en place le 1er janvier 2026, pour les jeunes de 18 à 25 ans exclus du marché de l\'emploi.' },
        { q: 'Que dit l\'article 2 de la Charte de l\'environnement ?', r: '« Toute personne a le devoir de prendre part à la préservation et à l\'amélioration de l\'environnement. »' },
      ],
    },

    // ─────────────────────────────── p. 36 ───────────────────────────────
    {
      page: 36,
      partie: 3,
      section: 'II. Les obligations et devoirs des citoyens — G. Éducation et H. Entraide',
      titre: 'Éducation et solidarité',
      emoji: '🤲',
      type: 'contenu',
      résumé: 'La scolarité est obligatoire de 3 à 16 ans. Les parents, premiers acteurs de l\'éducation, transmettent les valeurs de la République ; les parents étrangers s\'y engagent (article 20 de la loi CIAI du 26 janvier 2024). Porter secours à une personne en danger est un devoir : la non-assistance à personne en danger est un délit.',
      scènes: [
        {
          type: 'chiffres',
          titre: 'La scolarité obligatoire',
          chiffres: [
            [3, ' ans', 'début de la scolarité obligatoire'],
            [16, ' ans', 'fin de la scolarité obligatoire'],
          ],
          narration: 'Les parents doivent scolariser leur enfant à partir de la rentrée scolaire de l\'année civile de ses 3 ans. Sinon, ils s\'exposent à des poursuites judiciaires.',
        },
        {
          type: 'zoom',
          titre: 'Transmettre les valeurs de la République',
          centre: { emoji: '👨‍👩‍👧', texte: 'Les parents, premiers acteurs de l\'éducation' },
          autour: [
            ['🗽', 'La liberté'],
            ['🟰', 'L\'égalité'],
            ['🤝', 'La fraternité'],
            ['⚖️', 'Le principe de laïcité'],
            ['🏫', 'À l\'école, mais aussi en famille, dans la vie de tous les jours'],
          ],
        },
        {
          type: 'points',
          titre: 'Parents étrangers : un engagement (article 20 de la loi CIAI du 26 janvier 2024)',
          points: [
            ['📚', 'Assurer à leur enfant une éducation respectueuse des valeurs et des principes de la République'],
            ['🧭', 'L\'accompagner dans sa démarche d\'intégration'],
            ['🗣️', 'Notamment par l\'acquisition de la langue française'],
          ],
        },
        {
          type: 'titre',
          emoji: '🤲',
          titre: 'Entraide et solidarité',
          texte: 'Le devoir d\'aider les autres repose sur la valeur républicaine de fraternité.',
          narration: 'Au-delà des obligations légales, l\'entraide, par des initiatives individuelles ou dans la vie associative, améliore le vivre ensemble en renforçant les liens sociaux.',
        },
        {
          type: 'scène',
          titre: 'Témoin d\'un accident',
          décor: '🛣️🛵',
          acteurs: [
            { emoji: '👩', nom: 'Nadia', dit: 'Un scooter vient de chuter, le conducteur ne bouge plus !' },
            { emoji: '🧑', nom: 'Tom', dit: 'Ce n\'est pas notre problème, on y va…' },
            { emoji: '👩', nom: 'Nadia', dit: 'Si ! C\'est le devoir d\'assistance à personne en danger. Je préviens les secours.' },
            { emoji: '🧑', nom: 'Tom', dit: 'Tu as raison : la non-assistance à personne en danger est un délit.' },
          ],
          narration: 'Chacun doit porter secours à autrui, dans la mesure où il peut le faire sans mettre sa propre vie en péril.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Transmettre les valeurs républicaines, c\'est seulement le rôle de l\'école.', false, 'Cela doit aussi se faire par l\'éducation familiale : les parents sont les premiers acteurs de l\'éducation.'],
            ['Il faut porter secours même en mettant sa propre vie en péril.', false, 'On doit porter secours dans la mesure où on peut le faire sans mettre sa propre vie en péril.'],
            ['Des parents qui ne scolarisent pas leur enfant s\'exposent à des poursuites judiciaires.', true, 'La scolarité est obligatoire de 3 à 16 ans.'],
          ],
        },
      ],
      questions: [
        { q: 'De quel âge à quel âge la scolarité est-elle obligatoire ?', r: 'De 3 à 16 ans.' },
        { q: 'Qui sont les premiers acteurs de l\'éducation des enfants ?', r: 'Les parents : ils transmettent les valeurs de la République dans la vie de tous les jours.' },
        { q: 'À quoi s\'engagent les parents étrangers (loi CIAI du 26 janvier 2024) ?', r: 'À donner à leur enfant une éducation respectueuse des valeurs de la République et à l\'accompagner dans son intégration, notamment par le français.' },
        { q: 'Témoin d\'un accident grave, doit-on prévenir les secours ?', r: 'Oui, c\'est le devoir d\'assistance à personne en danger. S\'y soustraire est un délit.' },
      ],
    },
  ],

  leçons: [
    { id: 'p3-citoyen-libertes', titre: 'Être citoyen : textes et libertés', emoji: '🗽', pages: [25, 26, 27] },
    { id: 'p3-dignite-surete', titre: 'Vie privée, dignité, corps et sûreté', emoji: '🔒', pages: [28, 29] },
    { id: 'p3-justice-politique', titre: 'Justice, droits politiques et environnement', emoji: '⚖️', pages: [30, 31] },
    { id: 'p3-lois-institutions', titre: 'Respecter les lois et les institutions', emoji: '🚔', pages: [32, 33] },
    { id: 'p3-devoirs', titre: 'Voter, payer l\'impôt, défendre, transmettre', emoji: '🤝', pages: [34, 35, 36] },
  ],

  maison: [
    {
      id: 'p3-etagere-codes', pièce: 'bureau', emoji: '📚', objet: 'L\'étagère des codes',
      fait: 'Le Code civil (règles entre les personnes) a été promulgué en 1804 par Napoléon Bonaparte. Le Code pénal définit les infractions et les peines.',
      image: 'Sur l\'étagère, le gros Code civil porte le bicorne de Napoléon et une bougie « 1804 » ; à côté, le Code pénal utilise des menottes comme marque-page.',
      page: 25,
    },
    {
      id: 'p3-fauteuil', pièce: 'bureau', emoji: '🪑', objet: 'Le fauteuil pivotant',
      fait: 'Article 4 de la DDHC : « La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui. »',
      image: 'Ton fauteuil tourne librement dans tous les sens… mais il freine net juste avant d\'écraser le pied de ton voisin.',
      page: 26,
    },
    {
      id: 'p3-journal', pièce: 'bureau', emoji: '📰', objet: 'Le journal posé sur le bureau',
      fait: 'La presse est libre (article 11 de la DDHC), mais elle ne peut pas diffamer, inciter à des crimes ou délits, ni contester des crimes contre l\'humanité.',
      image: 'Le journal parle tout seul et donne son avis sur tout… mais dès qu\'il veut salir quelqu\'un avec un mensonge, un petit juge sort de la page et le referme d\'un coup.',
      page: 27,
    },
    {
      id: 'p3-carte-europe', pièce: 'bureau', emoji: '🗺️', objet: 'La carte d\'Europe au mur',
      fait: 'L\'espace Schengen, sans contrôle aux frontières intérieures, compte 23 États de l\'UE et 4 associés : Norvège, Islande, Suisse, Liechtenstein.',
      image: '27 punaises sur la carte : 23 bleues pour l\'Union européenne, et 4 rouges qui chantent en chœur « Norvège, Islande, Suisse, Liechtenstein ! »',
      page: 27,
    },
    {
      id: 'p3-classeur', pièce: 'bureau', emoji: '🗄️', objet: 'Le classeur fermé à clé',
      fait: 'La vie privée est garantie par la Constitution : secret médical, intimité, droit à l\'image. En cas de violation, on peut porter plainte à la police ou à la gendarmerie.',
      image: 'Le classeur contient ton dossier médical et tes photos ; si quelqu\'un essaie de l\'ouvrir sans ta permission, une sirène de police se met à hurler.',
      page: 28,
    },
    {
      id: 'p3-calendrier', pièce: 'bureau', emoji: '📅', objet: 'Le calendrier mural',
      fait: 'Depuis le 8 mars 2024, la liberté de recourir à l\'IVG est garantie par la Constitution. La loi bioéthique du 2 août 2021 autorise la PMA pour toutes les femmes.',
      image: 'Sur le calendrier, le 8 mars 2024 est entouré en rouge avec une mini-Constitution collée dessus ; le 2 août 2021, un petit berceau est dessiné.',
      page: 29,
    },
    {
      id: 'p3-lampe', pièce: 'bureau', emoji: '💡', objet: 'La lampe de bureau',
      fait: 'En garde à vue, la personne est informée des motifs et de ses droits : garder le silence, être assistée par un avocat, prévenir un proche.',
      image: 'La lampe est braquée sur toi comme dans un film policier, mais trois post-it sont collés dessus : « Silence », « Avocat », « Appeler un proche ».',
      page: 29,
    },
    {
      id: 'p3-telephone', pièce: 'bureau', emoji: '☎️', objet: 'Le téléphone du bureau',
      fait: 'Le Défenseur des droits, créé en 2011, intervient en cas de litige avec une administration, de discrimination ou d\'atteinte aux droits.',
      image: 'Le téléphone n\'a qu\'une touche géante « 2011 » : tu appuies, et un défenseur en cape répond « Discrimination ? Problème avec l\'administration ? J\'arrive ! »',
      page: 30,
    },
    {
      id: 'p3-tiroirs', pièce: 'bureau', emoji: '🗃️', objet: 'Les trois tiroirs du bureau',
      fait: 'Contravention → tribunal de police (amende, pas de prison). Délit → tribunal correctionnel (jusqu\'à 10 ans). Crime → cour d\'assises ou cour criminelle (jusqu\'à la perpétuité).',
      image: 'Le petit tiroir du haut crache une amende, celui du milieu claque comme une porte de cellule, et le grand tiroir du bas est si profond qu\'on y reste à vie.',
      page: 32,
    },
    {
      id: 'p3-calculatrice', pièce: 'bureau', emoji: '🧮', objet: 'La calculatrice',
      fait: 'Chaque année, toute personne majeure résidant en France et plus rattachée au foyer fiscal de ses parents déclare l\'intégralité de ses revenus et paie ses impôts.',
      image: 'La calculatrice refuse de s\'éteindre tant que tu n\'as pas tapé TOUS tes revenus ; si tu en caches un, elle clignote « FAUSSE DÉCLARATION ! »',
      page: 34,
    },
    {
      id: 'p3-tampon', pièce: 'bureau', emoji: '🪖', objet: 'Le tampon en forme de casque',
      fait: 'Dès 16 ans, on se fait recenser à la mairie pour la Journée Défense et Citoyenneté (JDC). Depuis le 1er janvier 2026, il existe un service militaire volontaire de 8 mois.',
      image: 'Le tampon a la forme d\'un casque militaire : il imprime « 16 ans – mairie – JDC » sur ta main, puis un énorme « 8 » pour les 8 mois du service volontaire.',
      page: 35,
    },
    {
      id: 'p3-trousse', pièce: 'bureau', emoji: '🩹', objet: 'La trousse de secours',
      fait: 'Chacun doit porter secours à une personne en danger, s\'il peut le faire sans mettre sa vie en péril. La non-assistance à personne en danger est un délit.',
      image: 'Accrochée au mur, la trousse de secours s\'ouvre dès que quelqu\'un crie à l\'aide ; si tu passes sans rien faire, elle te colle une étiquette « DÉLIT » dans le dos.',
      page: 36,
    },
  ],

  frise: [
    { année: 1789, date: '1789', titre: 'Déclaration des droits de l\'homme et du citoyen', détail: 'Elle garantit les droits fondamentaux. Son article 4 : la liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui.', emoji: '🗽', période: 'Révolution', page: 25 },
    { année: 1804, date: '1804', titre: 'Promulgation du Code civil', détail: 'Napoléon Bonaparte promulgue le Code civil, qui définit les règles essentielles applicables entre les personnes.', emoji: '📘', période: 'Époque napoléonienne', page: 25 },
    { année: 1901, date: '1er juillet 1901', titre: 'Loi sur la liberté d\'association', détail: 'Elle reconnaît le droit de créer ou de rejoindre une association.', emoji: '🤝', période: 'IIIe République', page: 31 },
    { année: 1946, date: '1946', titre: 'Préambule de la Constitution de 1946', détail: 'Il garantit des droits fondamentaux, dont le principe de dignité de la personne humaine.', emoji: '📄', période: 'IVe République', page: 28 },
    { année: 1958, date: '1958', titre: 'Constitution de la Ve République', détail: 'Son préambule protège les droits fondamentaux, notamment en citant la Déclaration de 1789.', emoji: '📜', période: 'Ve République', page: 25 },
    { année: 1997, date: '1997', titre: 'Fin du service militaire obligatoire', détail: 'Le service militaire n\'est plus obligatoire ; les jeunes citoyens participent à la Journée Défense et Citoyenneté (JDC).', emoji: '🪖', période: 'Ve République', page: 35 },
    { année: 2004, date: '2004', titre: 'Charte de l\'environnement', détail: 'Intégrée dans la Constitution, elle reconnaît le droit à un environnement sain et impose à chacun de protéger l\'environnement.', emoji: '🌿', période: 'Ve République', page: 31 },
    { année: 2011, date: '2011', titre: 'Création du Défenseur des droits', détail: 'Autorité administrative indépendante, il intervient en cas de litige avec une administration, de discrimination ou d\'atteinte aux droits.', emoji: '🛡️', période: 'Ve République', page: 30 },
    { année: 2021, date: '2 août 2021', titre: 'Loi bioéthique', détail: 'Elle autorise la procréation médicalement assistée (PMA) pour toutes les femmes : couples hétérosexuels, couples lesbiens, femmes seules.', emoji: '👶', période: 'Ve République', page: 29 },
    { année: 2024, date: '26 janvier 2024', titre: 'Loi CIAI', détail: 'Son article 20 engage les parents étrangers à donner à leur enfant une éducation respectueuse des valeurs de la République et à l\'accompagner dans son intégration.', emoji: '📚', période: 'Ve République', page: 36 },
    { année: 2024, date: '8 mars 2024', titre: 'L\'IVG garantie par la Constitution', détail: 'La liberté de recourir à l\'interruption volontaire de grossesse est désormais garantie par la Constitution.', emoji: '📜', période: 'Ve République', page: 29 },
    { année: 2026, date: '1er janvier 2026', titre: 'Service militaire volontaire (SMV)', détail: 'Un service de 8 mois pour les jeunes de 18 à 25 ans, français ou étrangers, exclus du marché de l\'emploi.', emoji: '🎖️', période: 'Ve République', page: 35 },
  ],

  situations: [
    {
      id: 'p3-s1', thème: 'Liberté d\'expression', emoji: '📱',
      contexte: 'Ton cousin veut publier sur un réseau social un message qui appelle à la violence contre un groupe de personnes. Il te dit : « En France, la liberté d\'expression, c\'est sans limite ! »',
      question: 'A-t-il raison ?',
      choix: [
        { texte: 'Non : la liberté d\'expression s\'exerce dans les limites de la loi, et les contenus qui incitent à la haine ou à la violence sont interdits.', bon: true, explication: 'Aucun appel à la violence n\'est autorisé, y compris sur les réseaux sociaux, où la liberté d\'expression est protégée mais encadrée par la loi.' },
        { texte: 'Oui : sur les réseaux sociaux, la loi ne s\'applique pas.', bon: false, explication: 'Faux : la liberté d\'expression sur les réseaux sociaux est protégée par la loi, mais les contenus qui incitent à la haine ou à la violence y sont interdits.' },
        { texte: 'Oui : l\'État n\'a jamais le droit de limiter la liberté d\'expression.', bon: false, explication: 'Faux : l\'État peut limiter la liberté d\'expression, notamment pour éviter la diffusion de propos discriminatoires.' },
      ],
      page: 26,
    },
    {
      id: 'p3-s2', thème: 'Discrimination et accès au droit', emoji: '🛡️',
      contexte: 'Au guichet d\'un service public, Amina pense être victime de discrimination. Elle a peu de moyens et ne sait pas à qui s\'adresser.',
      question: 'Que peut-elle faire ?',
      choix: [
        { texte: 'S\'adresser au Défenseur des droits : il intervient en cas de discrimination ou de litige avec une administration.', bon: true, explication: 'Le Défenseur des droits, autorité indépendante créée en 2011, défend notamment les droits des usagers des services publics. On peut être reçu par un délégué dans des structures locales.' },
        { texte: 'Rien : on ne peut pas contester ce que fait une administration.', bon: false, explication: 'Faux : toute personne peut faire valoir ses droits, et le Défenseur des droits intervient justement en cas de litige avec une administration.' },
        { texte: 'Payer elle-même un avocat, car il n\'existe aucune aide.', bon: false, explication: 'Faux : l\'aide juridictionnelle aide les personnes ayant peu de moyens à avoir un avocat lors d\'un procès, et les maisons de justice et du droit offrent des permanences gratuites.' },
      ],
      page: 30,
    },
    {
      id: 'p3-s3', thème: 'Disposer de son corps', emoji: '🩺',
      contexte: 'Léa, 17 ans, est enceinte et souhaite interrompre sa grossesse. Une amie lui dit qu\'elle n\'a pas le droit, parce qu\'elle est mineure.',
      question: 'Que dit le livret ?',
      choix: [
        { texte: 'Une femme enceinte, même mineure, peut demander une IVG dans les conditions fixées par la loi.', bon: true, explication: 'Depuis le 8 mars 2024, la liberté de recourir à l\'IVG est garantie par la Constitution, et le livret précise qu\'elle concerne aussi les mineures.' },
        { texte: 'Son amie a raison : l\'IVG est réservée aux femmes majeures.', bon: false, explication: 'Faux : le livret indique qu\'une femme enceinte, même mineure, peut demander l\'arrêt de sa grossesse par une IVG.' },
        { texte: 'L\'IVG n\'est pas autorisée en France.', bon: false, explication: 'Faux : la liberté de recourir à l\'IVG est garantie par la Constitution depuis le 8 mars 2024.' },
      ],
      page: 29,
    },
    {
      id: 'p3-s4', thème: 'Impôts', emoji: '🧾',
      contexte: 'Youssef, 26 ans, est étranger et vit en France. Il n\'est plus rattaché au foyer fiscal de ses parents. En plus de son salaire, il a gagné de l\'argent avec un petit travail. Il hésite à tout déclarer.',
      question: 'Que doit-il faire ?',
      choix: [
        { texte: 'Déclarer l\'intégralité de ses revenus et payer ses impôts : c\'est obligatoire chaque année.', bon: true, explication: 'C\'est une obligation pour toute personne majeure résidant en France qui n\'est plus rattachée au foyer fiscal de ses parents. Une fausse déclaration peut être sanctionnée.' },
        { texte: 'Ne rien déclarer : les impôts ne concernent que les Français.', bon: false, explication: 'Faux : tous les résidents, et pas uniquement les Français, doivent participer au financement des services publics.' },
        { texte: 'Déclarer seulement son salaire principal.', bon: false, explication: 'Faux : il faut déclarer l\'intégralité de ses revenus. Une fausse déclaration à l\'administration peut être sanctionnée.' },
      ],
      page: 34,
    },
    {
      id: 'p3-s5', thème: 'Respect des institutions', emoji: '👮',
      contexte: 'Lors d\'un contrôle dans la rue, un policier demande à Kevin de s\'arrêter. Kevin est pressé et très énervé.',
      question: 'Quelle est la bonne attitude ?',
      choix: [
        { texte: 'Obéir et rester respectueux envers le policier.', bon: true, explication: 'Il faut respecter les agents publics dans leurs fonctions. Refuser d\'obéir à un ordre d\'un policier ou d\'un gendarme est un délit.' },
        { texte: 'L\'insulter : ce ne sont que des mots, ce n\'est pas grave.', bon: false, explication: 'Faux : l\'article 433-5 du Code pénal sanctionne l\'outrage, avec des peines renforcées envers un policier, dépositaire de l\'autorité publique.' },
        { texte: 'Partir : la liberté d\'aller et venir le protège.', bon: false, explication: 'Faux : le refus d\'obéir à un ordre d\'un policier est un délit qui expose à une sanction pénale.' },
      ],
      page: 33,
    },
    {
      id: 'p3-s6', thème: 'Défense nationale', emoji: '🎖️',
      contexte: 'Ta fille, française, vient d\'avoir 16 ans. Un voisin te dit : « Le service militaire n\'est plus obligatoire, elle n\'a aucune démarche à faire. »',
      question: 'Que lui réponds-tu ?',
      choix: [
        { texte: 'Elle doit se faire recenser à la mairie pour participer à la Journée Défense et Citoyenneté (JDC).', bon: true, explication: 'Dès l\'âge de 16 ans, les Françaises et les Français doivent se faire recenser à la mairie pour participer à la JDC.' },
        { texte: 'Le voisin a raison : depuis 1997, il n\'y a plus rien à faire.', bon: false, explication: 'Faux : le service militaire n\'est plus obligatoire depuis 1997, mais les jeunes citoyens participent à la JDC, après s\'être fait recenser.' },
        { texte: 'Elle doit obligatoirement faire 8 mois de service militaire.', bon: false, explication: 'Faux : le service de 8 mois mis en place le 1er janvier 2026 est volontaire ; il s\'adresse aux jeunes de 18 à 25 ans exclus du marché de l\'emploi.' },
      ],
      page: 35,
    },
  ],
}
