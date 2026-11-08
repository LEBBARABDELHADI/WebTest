// Livret du citoyen (édition mai 2026), pages 77 à 83 : Annexes (DDHC de 1789, Charte des droits et devoirs du citoyen français, ressources).
export const PARTIE = {
  pages: [
    // ─────────────────────────────── p. 77 : sommaire des annexes
    {
      page: 77,
      partie: 6,
      section: 'Annexes',
      titre: 'Sommaire des annexes',
      emoji: '🗂️',
      type: 'garde',
      résumé: 'Les annexes réunissent la Déclaration des droits de l\'homme et du citoyen de 1789 (p. 78), la Charte des droits et devoirs du citoyen français (p. 79) et des ressources (p. 81).',
      scènes: [],
      questions: [],
    },

    // ─────────────────────────────── p. 78 : la DDHC de 1789
    {
      page: 78,
      partie: 6,
      section: 'I. La Déclaration des droits de l\'homme et du citoyen de 1789',
      titre: 'La DDHC en 17 articles',
      emoji: '📜',
      type: 'contenu',
      résumé: 'Le texte complet de la Déclaration de 1789 : les hommes naissent libres et égaux en droits, la liberté s\'arrête là où l\'on nuit à autrui, la Loi est la même pour tous, chacun est présumé innocent, les opinions sont libres, la contribution commune est répartie selon les moyens de chacun et la propriété est protégée.',
      scènes: [
        {
          type: 'citation',
          narration: 'La Déclaration des droits de l\'homme et du citoyen date de 1789. Elle compte 17 articles. Voici le premier, le plus célèbre.',
          texte: 'Les hommes naissent et demeurent libres et égaux en droits. Les distinctions sociales ne peuvent être fondées que sur l\'utilité commune.',
          source: 'Déclaration des droits de l\'homme et du citoyen de 1789, article 1er',
        },
        {
          type: 'devinette',
          narration: 'L\'article 2 dit que le but de toute association politique est de conserver les droits naturels et imprescriptibles de l\'Homme. Lesquels ?',
          question: 'Selon l\'article 2, quels sont les droits naturels et imprescriptibles de l\'Homme ?',
          indice: 'Il y en a quatre. Le premier est aussi le premier mot de la devise.',
          réponse: 'La liberté, la propriété, la sûreté et la résistance à l\'oppression.',
        },
        {
          type: 'citation',
          narration: 'L\'article 4 définit la liberté. Elle a des bornes, et seule la Loi peut les fixer.',
          texte: 'La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui : ainsi, l\'exercice des droits naturels de chaque homme n\'a de bornes que celles qui assurent aux autres Membres de la Société la jouissance de ces mêmes droits. Ces bornes ne peuvent être déterminées que par la Loi.',
          source: 'Déclaration des droits de l\'homme et du citoyen de 1789, article 4',
        },
        {
          type: 'points',
          titre: 'La Nation, la Loi et la justice (art. 3 à 9)',
          narration: 'Les articles 3 à 9 disent d\'où vient le pouvoir, ce que peut faire la Loi, et comment elle protège chacun face à la justice.',
          points: [
            ['👑', 'Art. 3 : le principe de toute Souveraineté réside essentiellement dans la Nation.'],
            ['🚦', 'Art. 5 : tout ce qui n\'est pas défendu par la Loi ne peut être empêché, et nul ne peut être contraint à faire ce qu\'elle n\'ordonne pas.'],
            ['🗳️', 'Art. 6 : la Loi est l\'expression de la volonté générale. Elle doit être la même pour tous, soit qu\'elle protège, soit qu\'elle punisse.'],
            ['⚖️', 'Art. 7 et 8 : nul ne peut être accusé, arrêté, détenu ou puni que dans les cas prévus par une Loi établie avant le délit.'],
            ['🤝', 'Art. 9 : tout homme est présumé innocent jusqu\'à ce qu\'il ait été déclaré coupable.'],
          ],
        },
        {
          type: 'zoom',
          titre: 'Penser, contribuer, contrôler (art. 10 à 17)',
          narration: 'Les derniers articles protègent les opinions, organisent l\'impôt et le contrôle de l\'administration, et définissent ce qu\'est une Constitution.',
          centre: { emoji: '🛡️', texte: 'Les garanties des droits' },
          autour: [
            ['🙏', 'Art. 10 : nul ne doit être inquiété pour ses opinions, même religieuses, si leur manifestation ne trouble pas l\'ordre public.'],
            ['📰', 'Art. 11 : tout citoyen peut parler, écrire, imprimer librement, sauf abus dans les cas prévus par la Loi.'],
            ['💰', 'Art. 12 et 13 : une force publique pour l\'avantage de tous, payée par une contribution commune répartie selon les facultés de chacun.'],
            ['🔍', 'Art. 14 et 15 : les citoyens peuvent consentir librement la contribution publique et en suivre l\'emploi ; la Société peut demander compte à tout agent public.'],
            ['🏛️', 'Art. 16 : sans garantie des droits ni séparation des pouvoirs, une Société n\'a point de Constitution.'],
            ['🏠', 'Art. 17 : la propriété est un droit inviolable et sacré ; on n\'en est privé que pour une nécessité publique, contre une juste et préalable indemnité.'],
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Selon la DDHC, la Loi doit être la même pour tous.', true, 'Article 6 : elle doit être la même pour tous, soit qu\'elle protège, soit qu\'elle punisse.'],
            ['Selon la DDHC, une personne arrêtée est présumée coupable.', false, 'Article 9 : tout homme est présumé innocent jusqu\'à ce qu\'il ait été déclaré coupable.'],
            ['Les emplois publics sont réservés à certaines familles.', false, 'Article 6 : tous les citoyens sont également admissibles aux emplois publics, selon leur capacité, leurs vertus et leurs talents.'],
          ],
        },
      ],
      questions: [
        { q: 'Que dit l\'article 1er de la DDHC ?', r: 'Les hommes naissent et demeurent libres et égaux en droits. Les distinctions sociales ne peuvent être fondées que sur l\'utilité commune.' },
        { q: 'Quels sont les droits naturels et imprescriptibles de l\'Homme (article 2) ?', r: 'La liberté, la propriété, la sûreté et la résistance à l\'oppression.' },
        { q: 'Que dit l\'article 4 de la DDHC sur la liberté ?', r: 'La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui. Ses bornes ne peuvent être déterminées que par la Loi.' },
        { q: 'Que dit l\'article 6 de la DDHC sur la Loi ?', r: 'La Loi est l\'expression de la volonté générale. Elle doit être la même pour tous, soit qu\'elle protège, soit qu\'elle punisse.' },
      ],
    },

    // ─────────────────────────────── p. 79 : Charte (1) principes, valeurs et symboles
    {
      page: 79,
      partie: 6,
      section: 'II. La Charte des droits et devoirs du citoyen français',
      titre: 'Principes, valeurs et symboles',
      emoji: '🇫🇷',
      type: 'contenu',
      résumé: 'Prévue par l\'article 21-24 du code civil, la Charte rappelle les principes et valeurs de la République. Le peuple français se reconnaît dans la Déclaration du 26 août 1789. La Charte cite les symboles et définit la République : indivisible, laïque, démocratique et sociale (Constitution du 4 octobre 1958).',
      scènes: [
        {
          type: 'titre',
          emoji: '📜',
          titre: 'La Charte des droits et devoirs du citoyen français',
          texte: 'En application de l\'article 21-24 du code civil, elle rappelle les principes et valeurs essentiels de la République et énonce les droits et devoirs du citoyen.',
          narration: 'Ces droits et devoirs résultent de la Constitution ou de la loi. Le peuple français se reconnaît dans la Déclaration des droits de l\'homme et du citoyen du 26 août 1789 et dans les principes démocratiques hérités de son histoire.',
        },
        {
          type: 'zoom',
          titre: 'Le peuple français respecte les symboles républicains',
          centre: { emoji: '🏛️', texte: 'Les symboles de la République' },
          autour: [
            ['🇫🇷', 'L\'emblème national : le drapeau tricolore, bleu, blanc, rouge'],
            ['🎶', 'L\'hymne national : La Marseillaise'],
            ['✍️', 'La devise : « Liberté, Egalité, Fraternité »'],
            ['🎆', 'La fête nationale : le 14 juillet'],
            ['👩', '« Marianne » : la représentation symbolique de la République'],
            ['🗣️', 'La langue de la République : le français'],
          ],
        },
        {
          type: 'citation',
          narration: 'Une phrase à savoir par cœur : elle donne les quatre caractères de la République.',
          texte: 'La France est une République indivisible, laïque, démocratique et sociale dont les principes sont fixés par la Constitution du 4 octobre 1958.',
          source: 'Charte des droits et devoirs du citoyen français',
        },
        {
          type: 'points',
          titre: 'Ce que veut dire chaque mot',
          points: [
            ['🧩', 'Indivisible : la souveraineté nationale appartient au peuple, qui l\'exerce par ses représentants élus et par le référendum. Aucune partie du peuple, ni aucun individu, ne peut s\'en attribuer l\'exercice.'],
            ['☮️', 'Laïque : la République assure la liberté de conscience et respecte toutes les croyances. L\'État et les religions sont séparés.'],
            ['🗳️', 'Démocratique : gouvernement du peuple, par le peuple et pour le peuple. Le suffrage est toujours universel, égal et secret. La justice, rendue au nom du peuple français, est indépendante.'],
            ['🤲', 'Sociale : la Nation assure à l\'individu et à la famille les conditions nécessaires à leur développement.'],
            ['🛡️', 'Enfin, la République garantit à tous la sécurité des personnes et des biens.'],
          ],
        },
        {
          type: 'scène',
          titre: 'Au café : peut-on changer de religion ?',
          décor: '☕🪑',
          acteurs: [
            { emoji: '👩', nom: 'Léa', dit: 'Mon cousin dit qu\'en France, on n\'a pas le droit de quitter sa religion. C\'est vrai ?' },
            { emoji: '🧔', nom: 'Moussa', dit: 'Non ! La République assure la liberté de conscience. Chacun est libre de croire, de ne pas croire, de changer de religion.' },
            { emoji: '👩', nom: 'Léa', dit: 'Et l\'État paie les religions ?' },
            { emoji: '🧔', nom: 'Moussa', dit: 'Non plus. La République garantit le libre exercice des cultes, mais n\'en reconnaît, n\'en salarie ni n\'en subventionne aucun.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Un citoyen peut ignorer une loi qu\'il n\'a pas votée.', false, 'La loi est l\'expression de la volonté générale : tout citoyen doit la respecter. La force publique garantit le respect de la loi et des décisions de justice.'],
            ['La République participe à l\'Union européenne.', true, 'L\'Union européenne est constituée d\'Etats qui ont choisi librement d\'exercer en commun certaines de leurs compétences.'],
            ['Un groupe de citoyens peut s\'attribuer seul l\'exercice de la souveraineté.', false, 'La République est indivisible : aucune partie du peuple, ni aucun individu, ne peut s\'en attribuer l\'exercice.'],
          ],
        },
      ],
      questions: [
        { q: 'Quels symboles de la République la Charte cite-t-elle ?', r: 'Le drapeau tricolore, La Marseillaise, la devise « Liberté, Egalité, Fraternité », le 14 juillet et Marianne. La langue est le français.' },
        { q: 'Quels sont les quatre caractères de la République française ?', r: 'Indivisible, laïque, démocratique et sociale. Ses principes sont fixés par la Constitution du 4 octobre 1958.' },
        { q: 'Que veut dire « laïque » selon la Charte ?', r: 'La République assure la liberté de conscience : chacun est libre de croire, de ne pas croire, de changer de religion. L\'État et les religions sont séparés.' },
        { q: 'Quel est le principe de la République selon la Charte ?', r: 'Gouvernement du peuple, par le peuple et pour le peuple.' },
      ],
    },

    // ─────────────────────────────── p. 80 : Charte (2) droits et devoirs
    {
      page: 80,
      partie: 6,
      section: 'II. La Charte des droits et devoirs du citoyen français',
      titre: 'Droits et devoirs du citoyen',
      emoji: '⚖️',
      type: 'contenu',
      résumé: 'Chacun possède des droits inaliénables et doit respecter ceux des autres. Le citoyen français vote dès 18 ans, concourt à la défense nationale et peut participer aux jurys d\'assises. La Charte détaille la liberté (opinions, vie privée, associations), l\'égalité (femmes et hommes, instruction jusqu\'à 16 ans) et la fraternité (impôts, protection sociale).',
      scènes: [
        {
          type: 'citation',
          narration: 'La Charte commence par un principe qui vaut pour tout être humain. Puis elle ajoute des droits et des devoirs particuliers pour les citoyens français.',
          texte: 'Tout être humain, sans distinction de race, de religion ni de croyance, possède des droits inaliénables. Sur le territoire de la République, ces droits sont garantis à chacun et chacun a le devoir de les respecter.',
          source: 'Charte des droits et devoirs du citoyen français',
        },
        {
          type: 'balance',
          titre: 'Ce que je reçois, ce que je dois',
          narration: 'À la qualité de citoyen français s\'attachent en outre des droits et devoirs particuliers, comme participer à l\'élection des représentants du peuple, concourir à la défense nationale ou participer aux jurys d\'assises.',
          gauche: {
            titre: 'Droits',
            items: [
              'Participer à l\'élection des représentants du peuple',
              'Voter dès 18 ans, avec ses droits civiques, et pouvoir être candidat',
              'Protection de la santé, sécurité matérielle, congés',
              'Des moyens convenables d\'existence si l\'on ne peut pas travailler',
            ],
          },
          droite: {
            titre: 'Devoirs',
            items: [
              'Respecter les droits de chacun',
              'Concourir à la défense nationale',
              'Participer aux jurys d\'assises',
              'Voter : c\'est aussi un devoir civique',
              'Payer impôts et cotisations sociales selon ses capacités',
            ],
          },
        },
        {
          type: 'zoom',
          titre: 'Liberté',
          narration: 'Comme en 1789, la Charte rappelle que les êtres humains naissent et demeurent libres et égaux en droits, et que la liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui.',
          centre: { emoji: '🕊️', texte: 'Liberté' },
          autour: [
            ['🧍', 'Le respect dû à la personne interdit toute atteinte à sa dignité. Le corps humain est inviolable.'],
            ['💬', 'Opinions libres si elles ne troublent pas l\'ordre public ; on peut parler, écrire, imprimer librement.'],
            ['🔒', 'Droit au respect de sa vie privée et des biens dont on a la propriété.'],
            ['⚖️', 'Nul n\'est arrêté que dans les cas prévus par la loi ; chacun est présumé innocent.'],
            ['🤝', 'Liberté d\'association, d\'adhésion aux partis et d\'action syndicale.'],
            ['🗳️', 'Électeur à 18 ans, candidat selon la loi. Voter est un droit, c\'est aussi un devoir civique.'],
          ],
        },
        {
          type: 'points',
          titre: 'Égalité',
          points: [
            ['⚖️', 'Tous les citoyens sont égaux devant la loi, sans distinction de sexe, d\'origine, de race ou de religion. La loi est la même pour tous.'],
            ['👫', 'L\'homme et la femme ont dans tous les domaines les mêmes droits. La République favorise leur égal accès aux mandats électoraux et aux responsabilités.'],
            ['💼', 'Chacun des conjoints peut librement exercer une profession, percevoir ses revenus et en disposer, après avoir contribué aux charges communes.'],
            ['👨‍👩‍👧', 'Les parents exercent en commun l\'autorité parentale. Ils pourvoient à l\'éducation des enfants et préparent leur avenir.'],
            ['🎒', 'L\'instruction est obligatoire pour les enfants des deux sexes jusqu\'à seize ans. L\'État organise un enseignement public gratuit et laïque.'],
          ],
        },
        {
          type: 'scène',
          titre: 'À la préfecture : la fraternité',
          décor: '🏛️🇫🇷',
          acteurs: [
            { emoji: '🧑‍💼', nom: 'L\'agent', dit: 'La fraternité, c\'est d\'abord ceci : tout citoyen français concourt à la défense et à la cohésion de la Nation.' },
            { emoji: '🙋‍♀️', nom: 'Nadia', dit: 'Et si une personne devenue française ne respecte pas ces obligations ?' },
            { emoji: '🧑‍💼', nom: 'L\'agent', dit: 'Elle peut être déchue de la nationalité française si elle s\'est soustraite à ses obligations de défense, ou livrée à des actes contraires aux intérêts fondamentaux de la France.' },
            { emoji: '🙋‍♀️', nom: 'Nadia', dit: 'Et chacun contribue, selon ses capacités financières, aux dépenses de la Nation par les impôts et les cotisations sociales.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Un citoyen français peut accéder à tout emploi public selon ses capacités.', true, 'Les citoyens français étant égaux, ils peuvent accéder à tout emploi public selon leurs capacités.'],
            ['Seul le père exerce l\'autorité parentale.', false, 'Les parents exercent en commun l\'autorité parentale.'],
            ['Une personne qui ne peut pas travailler à cause de son âge ou de sa santé n\'a droit à rien.', false, 'Elle a le droit d\'obtenir de la collectivité des moyens convenables d\'existence.'],
          ],
        },
      ],
      questions: [
        { q: 'À partir de quel âge un citoyen français est-il électeur ?', r: 'À dix-huit ans, s\'il jouit de ses droits civiques. Voter est un droit, c\'est aussi un devoir civique.' },
        { q: 'Quels devoirs particuliers la Charte attache-t-elle à la qualité de citoyen français ?', r: 'Concourir à la défense nationale ou participer aux jurys d\'assises.' },
        { q: 'Jusqu\'à quel âge l\'instruction est-elle obligatoire ?', r: 'Jusqu\'à seize ans, pour les enfants des deux sexes.' },
        { q: 'Quand une personne devenue française peut-elle être déchue de la nationalité ?', r: 'Si elle s\'est soustraite à ses obligations de défense, ou livrée à des actes contraires aux intérêts fondamentaux de la France.' },
      ],
    },

    // ─────────────────────────────── p. 81 : ressources
    {
      page: 81,
      partie: 6,
      section: 'III. Ressources',
      titre: 'Les textes de référence',
      emoji: '📚',
      type: 'contenu',
      résumé: 'Le livret renvoie aux grands textes publiés sur le site du Conseil constitutionnel : le préambule de la Constitution de 1946, la Constitution de la Ve République (4 octobre 1958) et la Charte de l\'environnement de 2004. Le référentiel de l\'examen civique est l\'annexe I de l\'arrêté du 10 octobre 2025, sur Légifrance.',
      scènes: [
        {
          type: 'titre',
          emoji: '🔗',
          titre: 'Pour aller plus loin',
          texte: 'Le livret donne les adresses officielles des grands textes de la République et du programme de l\'examen civique.',
        },
        {
          type: 'frise',
          titre: 'Quatre textes à connaître',
          étapes: [
            ['1946', 'Préambule de la Constitution du 27 octobre 1946', '📜'],
            ['1958', 'Constitution de la Ve République du 4 octobre 1958', '🏛️'],
            ['2004', 'Charte de l\'environnement', '🌿'],
            ['2025', 'Arrêté du 10 octobre 2025 sur l\'examen civique', '📝'],
          ],
        },
        {
          type: 'duo',
          titre: 'Où les lire ?',
          gauche: { emoji: '🏛️', titre: 'conseil-constitutionnel.fr', texte: 'Le préambule de 1946, la Constitution de 1958 et la Charte de l\'environnement de 2004, dans la rubrique « le bloc de constitutionnalité ».' },
          droite: { emoji: '⚖️', titre: 'legifrance.gouv.fr', texte: 'L\'arrêté du 10 octobre 2025 relatif au programme, aux épreuves et aux modalités d\'organisation de l\'examen civique. Son annexe I est le référentiel.' },
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Le référentiel de l\'examen civique figure à l\'annexe I de l\'arrêté du 10 octobre 2025.', true, 'Cet arrêté est relatif au programme, aux épreuves et aux modalités d\'organisation de l\'examen civique.'],
            ['La Charte de l\'environnement date de 1958.', false, 'Elle date de 2004. C\'est la Constitution de la Ve République qui date du 4 octobre 1958.'],
          ],
        },
      ],
      questions: [
        { q: 'De quand date la Constitution de la Ve République ?', r: 'Du 4 octobre 1958.' },
        { q: 'De quelle année date la Charte de l\'environnement ?', r: 'De 2004.' },
        { q: 'Où se trouve le référentiel de l\'examen civique ?', r: 'Dans l\'annexe I de l\'arrêté du 10 octobre 2025 relatif au programme, aux épreuves et aux modalités d\'organisation de l\'examen civique.' },
      ],
    },

    // ─────────────────────────────── p. 82 : page de notes
    {
      page: 82,
      partie: 6,
      section: 'Annexes',
      titre: 'Page de notes',
      emoji: '📝',
      type: 'garde',
      résumé: 'Page lignée laissée libre pour prendre des notes.',
      scènes: [],
      questions: [],
    },

    // ─────────────────────────────── p. 83 : quatrième de couverture
    {
      page: 83,
      partie: 6,
      section: 'Annexes',
      titre: 'Quatrième de couverture',
      emoji: '📘',
      type: 'garde',
      résumé: 'Le Livret du citoyen (édition mai 2026) est téléchargeable sur le site https://www.immigration.interieur.gouv.fr. Copyright : Ministère de l\'intérieur, Direction générale des étrangers en France.',
      scènes: [],
      questions: [],
    },
  ],

  leçons: [
    { id: 'ann-ddhc', titre: 'La Déclaration des droits de l\'homme et du citoyen de 1789', emoji: '📜', pages: [78] },
    { id: 'ann-charte', titre: 'La Charte des droits et devoirs du citoyen et les textes de référence', emoji: '🤝', pages: [79, 80, 81] },
  ],

  maison: [
    { id: 'ann-malle', pièce: 'grenier', emoji: '🧳', objet: 'La vieille malle', fait: 'Article 1er de la DDHC : « Les hommes naissent et demeurent libres et égaux en droits. »', image: 'Tu ouvres la vieille malle du grenier : des dizaines de bébés en sortent, tous exactement de la même taille, et chacun casse une petite chaîne en criant « Libres et égaux ! ».', page: 78 },
    { id: 'ann-coffre', pièce: 'grenier', emoji: '🔐', objet: 'Le coffre à quatre serrures', fait: 'Article 2 de la DDHC : les droits naturels et imprescriptibles de l\'Homme sont la liberté, la propriété, la sûreté et la résistance à l\'oppression.', image: 'Le coffre a quatre serrures : un oiseau qui s\'envole (liberté), une petite maison (propriété), un bouclier (sûreté) et un poing levé (résistance à l\'oppression). Il faut les quatre clés pour l\'ouvrir.', page: 78 },
    { id: 'ann-poutre', pièce: 'grenier', emoji: '🪵', objet: 'La poutre basse', fait: 'Article 4 de la DDHC : la liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui. Ses bornes ne peuvent être déterminées que par la Loi.', image: 'Tu danses librement dans le grenier… jusqu\'à la poutre basse, où est gravé « AUTRUI ». Un pas de plus et c\'est la tête de ton voisin que tu cognes : ta liberté s\'arrête là.', page: 78 },
    { id: 'ann-mannequin', pièce: 'grenier', emoji: '👗', objet: 'Le mannequin de couture', fait: 'Article 9 de la DDHC : tout homme est présumé innocent jusqu\'à ce qu\'il ait été déclaré coupable.', image: 'Le vieux mannequin porte une pancarte « INNOCENT ». Même quand un policier l\'emmène, la pancarte reste accrochée : seul le jugement qui le déclare coupable pourrait l\'enlever.', page: 78 },
    { id: 'ann-machine', pièce: 'grenier', emoji: '⌨️', objet: 'La machine à écrire', fait: 'Article 11 de la DDHC : tout citoyen peut parler, écrire, imprimer librement, sauf à répondre de l\'abus de cette liberté dans les cas déterminés par la Loi.', image: 'La vieille machine à écrire tape toute seule tes pensées et les imprime en affiches. Mais dès qu\'elle abuse, une clochette marquée « LOI » retentit et il faut en répondre.', page: 78 },
    { id: 'ann-tirelire', pièce: 'grenier', emoji: '🐷', objet: 'La tirelire', fait: 'Article 13 de la DDHC : la contribution commune doit être également répartie entre tous les citoyens, en raison de leurs facultés.', image: 'Une tirelire géante où chacun glisse une pièce à sa mesure : le géant une énorme pièce, l\'enfant une toute petite. Avec cet argent, on paie la force publique et l\'administration.', page: 78 },
    { id: 'ann-miroir', pièce: 'grenier', emoji: '🪞', objet: 'Le miroir à panneaux', fait: 'Article 16 de la DDHC : une Société sans garantie des droits ni séparation des pouvoirs n\'a point de Constitution.', image: 'Le vieux miroir a des panneaux bien séparés. Si tu les colles ensemble, le miroir devient tout noir : sans séparation des pouvoirs, il n\'y a plus de Constitution à refléter.', page: 78 },
    { id: 'ann-deguisements', pièce: 'grenier', emoji: '🎭', objet: 'Le carton de déguisements', fait: 'Les symboles de la République : le drapeau tricolore bleu, blanc, rouge, La Marseillaise, la devise « Liberté, Egalité, Fraternité », le 14 juillet et Marianne. La langue de la République est le français.', image: 'Dans le carton, tu trouves un drapeau bleu-blanc-rouge, un buste de Marianne, un disque de La Marseillaise et une fusée du 14 juillet. Et tout ce qui en sort parle français !', page: 79 },
    { id: 'ann-lucarne', pièce: 'grenier', emoji: '🪟', objet: 'La lucarne à quatre carreaux', fait: 'La France est une République indivisible, laïque, démocratique et sociale, dont les principes sont fixés par la Constitution du 4 octobre 1958.', image: 'La lucarne du grenier a quatre carreaux gravés I, L, D, S : Indivisible, Laïque, Démocratique, Sociale. Juste en dessous, un vieux calendrier reste bloqué sur le 4 octobre 1958.', page: 79 },
    { id: 'ann-boite', pièce: 'grenier', emoji: '🗳️', objet: 'La boîte à chaussures', fait: 'Tout citoyen français âgé de dix-huit ans et jouissant de ses droits civiques est électeur. Voter est un droit, c\'est aussi un devoir civique.', image: 'La vieille boîte à chaussures a une fente sur le couvercle : c\'est une urne ! Dessus, une bougie d\'anniversaire « 18 » et deux mots écrits en gros : DROIT et DEVOIR.', page: 80 },
    { id: 'ann-cartable', pièce: 'grenier', emoji: '🎒', objet: 'Le vieux cartable', fait: 'L\'instruction est obligatoire pour les enfants des deux sexes jusqu\'à seize ans. Organiser l\'enseignement public gratuit et laïque est un devoir de l\'État.', image: 'Le cartable porte deux étiquettes, « fille » et « garçon », et une horloge en forme de 16 : impossible de le ranger au grenier avant le seizième anniversaire.', page: 80 },
    { id: 'ann-casque', pièce: 'grenier', emoji: '🪖', objet: 'Le casque militaire', fait: 'Une personne devenue française peut être déchue de la nationalité si elle s\'est soustraite à ses obligations de défense ou livrée à des actes contraires aux intérêts fondamentaux de la France.', image: 'Un casque militaire pend à un clou. Si quelqu\'un le laisse là pour fuir la défense du pays, sa carte d\'identité française s\'envole par la lucarne.', page: 80 },
  ],

  frise: [
    { année: 1789, date: '26 août 1789', titre: 'Déclaration des droits de l\'homme et du citoyen', détail: 'Texte de 17 articles dans lequel le peuple français se reconnaît : « Les hommes naissent et demeurent libres et égaux en droits. »', emoji: '📜', période: 'Révolution', page: 79 },
    { année: 1946, date: '27 octobre 1946', titre: 'Préambule de la Constitution de 1946', détail: 'Le livret renvoie à son texte sur le site du Conseil constitutionnel, rubrique « le bloc de constitutionnalité ».', emoji: '📜', période: 'IVe République', page: 81 },
    { année: 1958, date: '4 octobre 1958', titre: 'Constitution de la Ve République', détail: 'Elle fixe les principes de la République : indivisible, laïque, démocratique et sociale.', emoji: '🏛️', période: 'Ve République', page: 79 },
    { année: 2004, date: '2004', titre: 'Charte de l\'environnement', détail: 'Le livret renvoie à son texte sur le site du Conseil constitutionnel, rubrique « le bloc de constitutionnalité ».', emoji: '🌿', période: 'Ve République', page: 81 },
    { année: 2025, date: '10 octobre 2025', titre: 'Arrêté sur l\'examen civique', détail: 'Arrêté relatif au programme, aux épreuves et aux modalités d\'organisation de l\'examen civique ; son annexe I en est le référentiel.', emoji: '📝', période: 'Ve République', page: 81 },
  ],

  situations: [
    {
      id: 'ann-s1', thème: 'Liberté (DDHC, article 4)', emoji: '🎉',
      contexte: 'Ton voisin met de la musique très fort chaque nuit jusqu\'à 3 heures. Quand tu te plains, il répond : « Je suis chez moi, je suis libre, la Déclaration de 1789 me protège ! »',
      question: 'Que dit vraiment la Déclaration de 1789 ?',
      choix: [
        { texte: 'La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui : elle a des bornes, fixées par la Loi.', bon: true, explication: 'Article 4 : les droits de chacun n\'ont de bornes que celles qui assurent aux autres la jouissance de ces mêmes droits.' },
        { texte: 'Il a raison : chez soi, la liberté n\'a aucune limite.', bon: false, explication: 'Faux : l\'article 4 fixe une limite claire, ne pas nuire à autrui.' },
        { texte: 'Il a raison, car la propriété est un droit inviolable et sacré.', bon: false, explication: 'L\'article 17 protège la propriété, mais il ne permet pas de nuire aux autres (article 4).' },
      ],
      page: 78,
    },
    {
      id: 'ann-s2', thème: 'Présomption d\'innocence', emoji: '🚓',
      contexte: 'Un collègue a été arrêté par la police dans une affaire de vol. À la pause, quelqu\'un dit : « S\'il a été arrêté, c\'est qu\'il est coupable. On peut le raconter à tout le monde. »',
      question: 'Que dit la Déclaration de 1789 ?',
      choix: [
        { texte: 'Il est présumé innocent jusqu\'à ce qu\'il ait été déclaré coupable.', bon: true, explication: 'Article 9 de la DDHC. La Charte le rappelle : chacun est présumé innocent tant qu\'il n\'a pas été jugé coupable.' },
        { texte: 'Il est coupable dès son arrestation.', bon: false, explication: 'Non : une arrestation n\'est pas un jugement. Seule une déclaration de culpabilité met fin à la présomption d\'innocence.' },
        { texte: 'La police peut arrêter n\'importe qui, sans aucune règle.', bon: false, explication: 'Non : article 7, nul ne peut être accusé, arrêté ni détenu que dans les cas déterminés par la Loi et selon les formes qu\'elle a prescrites.' },
      ],
      page: 78,
    },
    {
      id: 'ann-s3', thème: 'Laïcité', emoji: '🕊️',
      contexte: 'Ton amie Sofia ne croit plus en la religion de sa famille. Son oncle lui dit : « En France, la loi interdit de quitter sa religion. »',
      question: 'Selon la Charte des droits et devoirs du citoyen français, qui a raison ?',
      choix: [
        { texte: 'Sofia : chacun est libre de croire, de ne pas croire, de changer de religion.', bon: true, explication: 'La République est laïque : elle assure la liberté de conscience et respecte toutes les croyances.' },
        { texte: 'L\'oncle : il faut une autorisation de l\'État pour changer de religion.', bon: false, explication: 'Non : l\'État et les religions sont séparés. La République ne reconnaît aucun culte.' },
        { texte: 'L\'oncle : la République impose une religion officielle.', bon: false, explication: 'Non : la République garantit le libre exercice des cultes, mais n\'en reconnaît, n\'en salarie ni n\'en subventionne aucun.' },
      ],
      page: 79,
    },
    {
      id: 'ann-s4', thème: 'Égalité entre conjoints', emoji: '💼',
      contexte: 'Leïla a trouvé un emploi. Son mari lui dit : « Tu ne peux pas travailler sans mon accord, et c\'est moi qui garderai ton salaire. »',
      question: 'Que dit la Charte des droits et devoirs du citoyen français ?',
      choix: [
        { texte: 'Chacun des conjoints peut librement exercer une profession, percevoir ses revenus et en disposer comme il l\'entend.', bon: true, explication: 'Après avoir contribué aux charges communes, chacun dispose de ses revenus. L\'homme et la femme ont dans tous les domaines les mêmes droits.' },
        { texte: 'Le mari décide, car il est le chef de famille.', bon: false, explication: 'Non : l\'homme et la femme ont les mêmes droits, et les parents exercent en commun l\'autorité parentale.' },
        { texte: 'Leïla peut travailler, mais elle ne peut pas disposer de son salaire.', bon: false, explication: 'Non : chacun perçoit ses revenus et en dispose comme il l\'entend, après avoir contribué aux charges communes.' },
      ],
      page: 80,
    },
    {
      id: 'ann-s5', thème: 'Instruction obligatoire', emoji: '🎒',
      contexte: 'Un voisin veut arrêter l\'instruction de sa fille de 14 ans pour qu\'elle aide à la maison. Son fils, lui, continuera ses études.',
      question: 'Est-ce permis ?',
      choix: [
        { texte: 'Non : l\'instruction est obligatoire pour les enfants des deux sexes jusqu\'à seize ans.', bon: true, explication: 'La Charte vise les filles comme les garçons. Organiser l\'enseignement public gratuit et laïque est un devoir de l\'État.' },
        { texte: 'Oui : l\'instruction n\'est obligatoire que pour les garçons.', bon: false, explication: 'Non : elle est obligatoire pour les enfants des deux sexes. L\'homme et la femme ont les mêmes droits.' },
        { texte: 'Oui : l\'instruction obligatoire s\'arrête à 14 ans.', bon: false, explication: 'Non : elle est obligatoire jusqu\'à seize ans.' },
      ],
      page: 80,
    },
    {
      id: 'ann-s6', thème: 'Devoirs du citoyen', emoji: '⚖️',
      contexte: 'Tu es devenu(e) français(e). Tu reçois un courrier : tu es appelé(e) à participer à un jury d\'assises. Un ami te conseille de jeter la lettre : « Ce n\'est pas ton affaire. »',
      question: 'Que dit la Charte des droits et devoirs du citoyen français ?',
      choix: [
        { texte: 'Participer aux jurys d\'assises fait partie des devoirs attachés à la qualité de citoyen français.', bon: true, explication: 'La Charte cite ce devoir à côté de celui de concourir à la défense nationale.' },
        { texte: 'C\'est une tâche réservée aux juges et aux avocats.', bon: false, explication: 'Non : la Charte en fait un devoir des citoyens français.' },
        { texte: 'Seuls les Français de naissance sont concernés.', bon: false, explication: 'Non : ce devoir s\'attache à la qualité de citoyen français. Tous les citoyens sont égaux devant la loi, sans distinction d\'origine.' },
      ],
      page: 80,
    },
  ],
}
