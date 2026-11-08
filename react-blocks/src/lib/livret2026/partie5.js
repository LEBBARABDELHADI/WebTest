// Livret du citoyen (édition mai 2026), pages 61 à 76 : Partie 5 – Vivre dans la société française.
export const PARTIE = {
  pages: [
    // ───────────────────────── p. 61 : sommaire de la partie 5
    {
      page: 61,
      partie: 5,
      section: 'Partie 5 – Vivre dans la société française',
      titre: 'Sommaire de la partie 5',
      emoji: '🏘️',
      type: 'garde',
      résumé: 'Sommaire de la partie 5 : la vie quotidienne (logement, déplacements, assurance, espace public, environnement, santé, urgences), le travail en France et la vie familiale.',
      scènes: [],
      questions: [],
    },

    // ───────────────────────── p. 62 : se loger
    {
      page: 62,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'Propriétaire ou locataire',
      emoji: '🏠',
      type: 'contenu',
      résumé: 'Toute personne peut devenir propriétaire : l\'achat se signe chez le notaire, et construire exige un permis de construire demandé en mairie. 40 % de la population est locataire : le bail fixe les règles, le locataire paie loyer et charges, et le propriétaire doit offrir un logement décent.',
      scènes: [
        {
          type: 'titre',
          emoji: '🏠',
          titre: 'Se loger en France',
          texte: 'Acheter ou louer : chaque situation a ses règles, ses droits et ses obligations.',
        },
        {
          type: 'flux',
          titre: 'Devenir propriétaire',
          étapes: [
            ['🏡', 'Choisir un bien ancien (déjà construit) ou neuf (projet de construction)'],
            ['✍️', 'Signer obligatoirement l\'acte d\'achat chez le notaire'],
            ['🏛️', 'Pour construire une maison : déposer en mairie une demande de permis de construire'],
            ['🔨', 'Extension ou modification extérieure : se renseigner en mairie avant les travaux (déclaration préalable ou autorisation)'],
          ],
          narration: 'Toute personne peut devenir propriétaire. Et l\'accession sociale à la propriété permet aux foyers à revenus modestes de devenir propriétaires de leur résidence principale.',
        },
        {
          type: 'chiffres',
          titre: 'Les locataires en France',
          chiffres: [[40, ' %', 'de la population est locataire de son logement']],
          narration: 'En France, 40 % de la population est locataire. Un peu moins de la moitié de ces logements loués sont des logements publics, dits sociaux. Les règles viennent de la réglementation générale ou du contrat de location, le bail, qui fixe par exemple le prix du loyer.',
        },
        {
          type: 'balance',
          titre: 'Le locataire : droits et obligations',
          gauche: {
            titre: 'Ses droits',
            items: [
              'Faire des travaux décoratifs, comme peindre les murs',
              'Quitter le logement en respectant le préavis prévu au bail',
            ],
          },
          droite: {
            titre: 'Ses obligations',
            items: [
              'Payer le loyer et les charges (eau, électricité, chauffage…)',
              'Demander la permission au propriétaire pour les autres travaux',
            ],
          },
          narration: 'S\'il ne paie pas le loyer, le propriétaire peut engager une procédure pour obtenir l\'expulsion du locataire.',
        },
        {
          type: 'scène',
          titre: 'Le jour de la remise des clés',
          décor: '🏢🔑',
          acteurs: [
            { emoji: '👩🏽', nom: 'Nadia, locataire', dit: 'Je peux repeindre la chambre en bleu ? Et abattre la cloison de la cuisine ?' },
            { emoji: '👨🏻‍🦳', nom: 'M. Durand, propriétaire', dit: 'Peindre, oui : ce sont des travaux décoratifs. Pour la cloison, il faut ma permission. C\'est l\'article 7 de la loi du 6 juillet 1989.' },
            { emoji: '👩🏽', nom: 'Nadia', dit: 'Et vous, vous me devez un logement décent : sûr, bien entretenu, bien isolé et accessible aux personnes handicapées.' },
            { emoji: '👨🏻‍🦳', nom: 'M. Durand', dit: 'C\'est vrai. Et vous, vous payez le loyer convenu dans le bail, avec les charges.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Pour construire une maison, il faut déposer une demande de permis de construire en mairie.', true, 'Oui, la demande de permis de construire se dépose en mairie.'],
            ['Un locataire peut faire tous les travaux qu\'il veut sans rien demander.', false, 'Seuls les travaux décoratifs (peindre) sont libres ; les autres exigent la permission du propriétaire.'],
            ['L\'achat d\'un logement doit être signé chez le notaire.', true, 'L\'achat d\'un bien immobilier fait obligatoirement l\'objet d\'un acte signé chez le notaire.'],
          ],
        },
      ],
      questions: [
        { q: 'Où doit être signé l\'achat d\'un bien immobilier ?', r: 'Chez le notaire : l\'achat doit obligatoirement faire l\'objet d\'un acte signé chez le notaire.' },
        { q: 'Quelle part de la population française est locataire ?', r: '40 % ; un peu moins de la moitié de ces logements loués sont des logements publics (sociaux).' },
        { q: 'Quelles sont les responsabilités du propriétaire envers son locataire ?', r: 'Offrir un logement décent : sûr, bien entretenu, avec une bonne isolation et accessible aux personnes handicapées.' },
        { q: 'Qu\'est-ce que l\'accession sociale à la propriété ?', r: 'Un type d\'achat qui permet aux foyers à revenus modestes de devenir propriétaires de leur résidence principale.' },
      ],
    },

    // ───────────────────────── p. 63 : logement social, code de la route
    {
      page: 63,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'HLM et code de la route',
      emoji: '🚗',
      type: 'contenu',
      résumé: 'Le logement social (HLM) aide les personnes aux ressources modestes ; la demande se fait en ligne. Pour conduire, il faut un permis valide, une carte grise, une assurance et un contrôle technique à jour. Les infractions au code de la route sont punies selon leur gravité.',
      scènes: [
        {
          type: 'zoom',
          titre: 'Le logement social',
          centre: { emoji: '🏢', texte: 'HLM : habitation à loyer modéré' },
          autour: [
            ['💶', 'Pour les personnes aux ressources modestes'],
            ['🏗️', 'Construit avec l\'aide financière de l\'État'],
            ['📏', 'Revenus sous des plafonds de ressources'],
            ['🔒', 'Loyers encadrés par l\'État'],
            ['💻', 'Demande en ligne : demande-logement-social.gouv.fr'],
          ],
          narration: 'Les HLM respectent des règles de construction et de gestion, et des critères pour choisir les locataires. Pour en obtenir un, on dépose un dossier en ligne sur le site officiel.',
        },
        {
          type: 'points',
          titre: 'Pour conduire sur la voie publique',
          points: [
            ['🪪', 'Un permis de conduire valide'],
            ['📄', 'Une carte grise : elle prouve que le véhicule appartient à son propriétaire'],
            ['🛡️', 'Un véhicule assuré'],
            ['🔧', 'Un contrôle technique à jour'],
          ],
          narration: 'Le code de la route s\'applique partout : routes, autoroutes, rues, boulevards. Ne pas le respecter met la vie des autres en danger : c\'est pourquoi des sanctions sont prévues.',
        },
        {
          type: 'scène',
          titre: 'Sur le parking du supermarché',
          décor: '🅿️🛒',
          acteurs: [
            { emoji: '🧔🏻', nom: 'Marc', dit: 'J\'en ai pour deux minutes, je me gare sur la place handicapé.' },
            { emoji: '👵🏾', nom: 'Mme Diallo', dit: 'Non ! Ces places sont réservées aux personnes en situation de handicap, titulaires d\'une carte « mobilité inclusion ».' },
            { emoji: '🧔🏻', nom: 'Marc', dit: 'Vous avez raison, je vais chercher une autre place.' },
          ],
        },
        {
          type: 'duo',
          titre: 'Excès de vitesse : deux exemples',
          gauche: { emoji: '🐢', titre: 'Moins de 20 km/h de trop', texte: 'Amende de 68 euros et retrait d\'un point du permis.' },
          droite: { emoji: '🚨', titre: 'Plus de 50 km/h de trop', texte: 'Un délit : jusqu\'à 3 mois de prison, jusqu\'à 3 750 euros d\'amende, retrait de 6 points, voire suspension du permis.' },
          narration: 'Les infractions sont classées en plusieurs catégories, avec des peines selon leur gravité.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['On peut se garer deux minutes sur une place handicapée sans carte.', false, 'Ces places sont réservées aux titulaires de la carte « mobilité inclusion ».'],
            ['La carte grise prouve que le véhicule appartient à son propriétaire.', true, 'C\'est le document qui prouve la propriété du véhicule.'],
            ['Les loyers des HLM sont encadrés par l\'État.', true, 'Les logements sociaux sont construits avec l\'aide de l\'État et leurs loyers sont encadrés.'],
          ],
        },
      ],
      questions: [
        { q: 'Que signifie HLM ?', r: 'Habitation à loyer modéré : un logement social pour les personnes disposant de ressources modestes.' },
        { q: 'Comment demander un logement social ?', r: 'En déposant un dossier en ligne sur le site officiel demande-logement-social.gouv.fr.' },
        { q: 'Que faut-il pour conduire un véhicule motorisé sur la voie publique ?', r: 'Un permis valide, une carte grise, une assurance et un contrôle technique à jour.' },
        { q: 'Que risque-t-on pour un excès de vitesse de plus de 50 km/h ?', r: 'C\'est un délit : jusqu\'à 3 mois de prison, 3 750 euros d\'amende, retrait de 6 points, voire suspension du permis.' },
      ],
    },

    // ───────────────────────── p. 64 : délits routiers, transports collectifs, responsabilité civile
    {
      page: 64,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'Délits routiers, transports, assurance',
      emoji: '🚌',
      type: 'contenu',
      résumé: 'L\'alcool au volant au-delà de 0,8 g/l et la conduite sans permis sont des délits très sévèrement punis. Les transports collectifs réduisent la pollution, mais il faut payer son titre de transport. La responsabilité civile oblige à réparer les dommages causés à autrui ; les assurances indemnisent les victimes.',
      scènes: [
        {
          type: 'chiffres',
          titre: 'Les délits routiers les plus graves',
          chiffres: [
            [3, ' ans', 'de prison au maximum (alcool > 0,8 g/l)'],
            [9000, ' €', 'd\'amende (alcool > 0,8 g/l)'],
            [1, ' an', 'de prison (conduite sans permis)'],
            [15000, ' €', 'd\'amende (conduite sans permis)'],
          ],
          narration: 'Conduire avec plus de 0,8 gramme d\'alcool par litre de sang peut entraîner jusqu\'à 3 ans de prison, 9 000 euros d\'amende, la saisie du véhicule et l\'annulation du permis pendant 5 ans. Conduire sans permis : un an de prison et 15 000 euros d\'amende.',
        },
        {
          type: 'points',
          titre: 'Pourquoi prendre le bus, le métro, le train ou le tram ?',
          points: [
            ['🚗', 'Moins de voitures en circulation'],
            ['⚡', 'Moins d\'énergie consommée et moins de gaz polluants'],
            ['🌍', 'Lutte contre le changement climatique'],
            ['🌬️', 'Meilleure qualité de l\'air'],
            ['🔇', 'Moins de nuisances sonores'],
          ],
        },
        {
          type: 'scène',
          titre: 'Contrôle dans le tramway',
          décor: '🚋🏙️',
          acteurs: [
            { emoji: '👩🏽‍💼', nom: 'La contrôleuse', dit: 'Bonjour, votre titre de transport, s\'il vous plaît.' },
            { emoji: '🧑🏻', nom: 'Léo', dit: 'Je n\'ai pas de ticket… c\'est grave ?' },
            { emoji: '👩🏽‍💼', nom: 'La contrôleuse', dit: 'Pour voyager, il faut payer un titre de transport, ticket ou billet. Sans titre, vous pouvez recevoir une amende.' },
            { emoji: '🧑🏻', nom: 'Léo', dit: 'Dommage… Dans certaines villes, pourtant, les transports sont gratuits !' },
          ],
        },
        {
          type: 'scène',
          titre: 'Le ballon dans la fenêtre',
          décor: '⚽🪟🏡',
          acteurs: [
            { emoji: '👴🏼', nom: 'M. Petit, le voisin', dit: 'Votre fils a cassé ma fenêtre avec son ballon !' },
            { emoji: '👩🏾', nom: 'Awa, la maman', dit: 'Il ne l\'a pas fait exprès, mais c\'est mon enfant mineur : ma responsabilité civile est engagée. Je dois réparer le dommage.' },
            { emoji: '👴🏼', nom: 'M. Petit', dit: 'Et votre chien, qui a déchiré mon pantalon la semaine dernière ?' },
            { emoji: '👩🏾', nom: 'Awa', dit: 'Pareil pour un animal domestique sous ma responsabilité. Heureusement, l\'assurance permet d\'indemniser les victimes.' },
          ],
          narration: 'La responsabilité civile, c\'est l\'obligation de réparer les dommages matériels, corporels ou moraux causés sans le vouloir à d\'autres personnes : à son domicile, en voiture, dans la vie courante ou au travail.',
        },
        {
          type: 'points',
          titre: 'Les différents types d\'assurances',
          points: [
            ['🏠', 'Habitation : risques liés au logement (incendie, dégât des eaux…)'],
            ['🚗', 'Véhicule : accidents des véhicules motorisés (thermique, hybride, électrique)'],
            ['🎒', 'Scolaire et extra-scolaire : les enfants à l\'école ou à l\'extérieur'],
          ],
          narration: 'Ces assurances permettent d\'indemniser les victimes, personnes blessées ou touchées en cas d\'accident.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Voyager sans titre de transport peut être sanctionné par une amende.', true, 'L\'usage des transports collectifs est conditionné au paiement d\'un titre (ticket, billet…).'],
            ['Si mon enfant mineur casse quelque chose chez le voisin, je ne suis pas concerné.', false, 'Ma responsabilité civile est engagée pour un enfant mineur sous ma responsabilité.'],
            ['Conduire sans permis n\'est puni que d\'une petite amende.', false, 'C\'est puni d\'un an de prison et de 15 000 euros d\'amende.'],
          ],
        },
      ],
      questions: [
        { q: 'Que risque-t-on en conduisant avec plus de 0,8 g/l d\'alcool dans le sang ?', r: 'Jusqu\'à 3 ans de prison, 9 000 euros d\'amende, la saisie du véhicule et l\'annulation du permis pendant 5 ans.' },
        { q: 'Que risque-t-on à conduire sans permis ?', r: 'Un an de prison et 15 000 euros d\'amende.' },
        { q: 'Qu\'est-ce que la responsabilité civile ?', r: 'L\'obligation de réparer les dommages matériels, corporels ou moraux que l\'on cause sans le vouloir à d\'autres personnes.' },
        { q: 'Contre quoi protège l\'assurance habitation ?', r: 'Contre les risques liés à son logement, comme l\'incendie ou le dégât des eaux.' },
      ],
    },

    // ───────────────────────── p. 65 : tabac et alcool dans l'espace public
    {
      page: 65,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'Tabac et alcool en public',
      emoji: '🚭',
      type: 'contenu',
      résumé: 'Il est interdit de fumer dans les lieux publics fermés ou couverts et au travail ; depuis le 1er juillet 2025, aussi dans les parcs, plages, abribus et aux abords des écoles (loi Évin, amende de 135 euros). L\'alcool est encadré : arrêtés municipaux, vente interdite aux moins de 18 ans, amende jusqu\'à 150 euros pour ivresse publique.',
      scènes: [
        {
          type: 'titre',
          emoji: '🚭',
          titre: 'Vivre ensemble dans l\'espace public',
          texte: 'Des règles strictes encadrent le tabac et l\'alcool pour protéger la santé de tous.',
          narration: 'Il est interdit de fumer dans les lieux publics fermés ou couverts et dans les espaces intérieurs qui accueillent du public : gares, restaurants, bars, terrasses couvertes. Fumer dans les locaux de son lieu de travail est aussi interdit.',
        },
        {
          type: 'points',
          titre: 'Interdit de fumer depuis le 1er juillet 2025',
          points: [
            ['🌳', 'Parcs et jardins publics'],
            ['🏖️', 'Plages bordant des eaux de baignade'],
            ['🚏', 'Abribus et zones couvertes d\'attente des voyageurs'],
            ['🏫', 'Abords des écoles, collèges, lycées et lieux d\'accueil de mineurs'],
            ['🏊', 'Abords des bibliothèques, piscines, stades et installations sportives'],
          ],
          narration: 'Fumer dans l\'espace public est autorisé. Mais depuis le 1er juillet 2025, c\'est interdit dans ces lieux, pendant leurs heures ou périodes d\'ouverture.',
        },
        {
          type: 'scène',
          titre: 'Au parc, un dimanche',
          décor: '🌳🛝',
          acteurs: [
            { emoji: '🧑🏼', nom: 'Thomas', dit: 'Une petite cigarette sur ce banc, près des balançoires…' },
            { emoji: '👩🏻‍🦱', nom: 'Inès, une maman', dit: 'Depuis le 1er juillet 2025, on ne fume plus dans les parcs et jardins publics pendant les heures d\'ouverture.' },
            { emoji: '🧑🏼', nom: 'Thomas', dit: 'Bon… et si je jette juste mon mégot par terre ?' },
            { emoji: '👩🏻‍🦱', nom: 'Inès', dit: 'Un mégot est un déchet : il va à la poubelle, sinon c\'est une amende. Et fumer ici, c\'est 135 euros !' },
          ],
        },
        {
          type: 'devinette',
          question: 'Quelle loi, votée le 10 janvier 1991 et complétée au fil du temps, encadre le tabac dans l\'espace public ?',
          réponse: 'La loi Évin. La non-respecter est une infraction punie d\'une amende de 135 euros.',
          indice: 'Son nom commence par un « É ».',
          narration: 'Ces règles limitent l\'exposition des non-fumeurs, notamment des enfants et des personnes fragiles, et facilitent le vivre ensemble en limitant les nuisances olfactives.',
        },
        {
          type: 'zoom',
          titre: 'L\'alcool dans l\'espace public',
          centre: { emoji: '🍷', texte: 'Une consommation encadrée' },
          autour: [
            ['📜', 'Interdiction possible par arrêté municipal (rues, transports en commun, parcs…)'],
            ['🕒', 'Vente limitée dans certains lieux, à certaines périodes ou heures'],
            ['🔞', 'Vente interdite aux mineurs de moins de 18 ans'],
            ['💶', 'Ivresse publique : amende jusqu\'à 150 euros'],
            ['📺', 'Publicité encadrée par le code de la santé publique'],
          ],
          narration: 'Ces mesures préviennent les troubles à l\'ordre public et protègent les personnes, qu\'elles consomment ou soient simples usagers de l\'espace public.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['On peut fumer sur la terrasse couverte d\'un restaurant.', false, 'Les terrasses couvertes font partie des lieux où il est interdit de fumer.'],
            ['Il est interdit de vendre de l\'alcool aux mineurs de moins de 18 ans.', true, 'C\'est interdit par la loi.'],
            ['Fumer en plein air dans l\'espace public est toujours interdit.', false, 'C\'est autorisé, sauf dans certains lieux (parcs, plages, abords des écoles…) depuis le 1er juillet 2025.'],
          ],
        },
      ],
      questions: [
        { q: 'Depuis quand est-il interdit de fumer dans les parcs, sur les plages et aux abords des écoles ?', r: 'Depuis le 1er juillet 2025, pendant les heures ou périodes d\'ouverture.' },
        { q: 'Quelle est l\'amende pour non-respect de la loi Évin ?', r: 'Une amende de 135 euros.' },
        { q: 'Quelle amende risque-t-on en cas d\'ivresse publique ?', r: 'Une amende pouvant aller jusqu\'à 150 euros.' },
        { q: 'Comment la consommation d\'alcool peut-elle être interdite dans certaines rues ?', r: 'Par arrêté municipal, en fonction des circonstances locales (rues, transports en commun, certains parcs…).' },
      ],
    },

    // ───────────────────────── p. 66 : civisme, environnement, déchets
    {
      page: 66,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'Civisme et réduction des déchets',
      emoji: '♻️',
      type: 'contenu',
      résumé: 'Jeter ses déchets hors des poubelles, ne pas ramasser les excréments de son chien, faire des graffitis ou du bruit excessif est sanctionné. Chacun doit aussi préserver l\'environnement : un Français produit environ 500 kg de déchets par an, le tri s\'impose à tous et les dépôts sauvages sont interdits.',
      scènes: [
        {
          type: 'points',
          titre: 'Les règles de civisme',
          points: [
            ['🗑️', 'Jeter ses déchets dans les poubelles, sinon amende'],
            ['🐕', 'Ramasser obligatoirement les excréments de son chien'],
            ['🎨', 'Pas de graffitis ni de dégradations : c\'est du vandalisme puni par la loi'],
            ['🔊', 'Pas de nuisances sonores : musique forte, klaxons inutiles, fêtes, rassemblements…'],
          ],
          narration: 'Ces règles maintiennent la qualité des espaces publics et la tranquillité publique.',
        },
        {
          type: 'scène',
          titre: 'Dans la rue, un matin',
          décor: '🏙️🗑️',
          acteurs: [
            { emoji: '👨🏽', nom: 'Samir', dit: 'Rex a fait ses besoins… Bon, je laisse ça là, personne ne verra.' },
            { emoji: '👩🏼‍🦰', nom: 'Julie, une voisine', dit: 'Les excréments de chien doivent obligatoirement être ramassés, sinon vous pouvez être sanctionné !' },
            { emoji: '👨🏽', nom: 'Samir', dit: 'Vous avez raison, je ramasse. Et ce tag sur l\'abribus, vous l\'avez vu ?' },
            { emoji: '👩🏼‍🦰', nom: 'Julie', dit: 'Oui : les graffitis sont du vandalisme puni par la loi. Nettoyer ou réparer coûte cher aux collectivités.' },
          ],
        },
        {
          type: 'chiffres',
          titre: 'Nos déchets',
          chiffres: [[500, ' kg', 'de déchets produits chaque année par un Français (environ)']],
          narration: 'Changement climatique, protection de la nature : ces enjeux nous concernent tous. Au-delà du gouvernement, des collectivités et des associations, chacun peut et doit préserver la planète pour les générations futures.',
        },
        {
          type: 'flux',
          titre: 'Que faire de ses déchets ?',
          étapes: [
            ['📘', 'Connaître les règles de tri de sa commune : elles varient selon les territoires'],
            ['🥕', 'Trier les déchets verts et alimentaires pour le compostage : obligatoire depuis 2024'],
            ['🛋️', 'Déposer électroménager, encombrants et déchets verts à la déchèterie'],
            ['🚫', 'Jamais de dépôt sauvage : c\'est une infraction punie d\'une amende'],
          ],
          narration: 'La collecte des déchets et des ordures ménagères est organisée par les collectivités locales, avec des mesures de tri qui s\'imposent à tous.',
        },
        {
          type: 'devinette',
          question: 'Depuis quand les sacs plastiques à usage unique et non recyclables sont-ils interdits en France ?',
          réponse: 'Depuis janvier 2017.',
          indice: 'Il y a presque 10 ans.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Le tri des déchets alimentaires est obligatoire pour les particuliers depuis 2024.', true, 'Depuis 2024, le tri des déchets verts et alimentaires est obligatoire pour les particuliers et les professionnels.'],
            ['On peut abandonner son vieux frigo dans la nature, au bord d\'un chemin.', false, 'C\'est un dépôt sauvage, interdit et puni d\'une amende : il faut aller à la déchèterie.'],
            ['Protéger l\'environnement, c\'est seulement l\'affaire du gouvernement.', false, 'Chacun peut et doit contribuer à la préservation de la planète.'],
          ],
        },
      ],
      questions: [
        { q: 'Combien de déchets un Français produit-il chaque année ?', r: 'Environ 500 kg.' },
        { q: 'Qui organise la collecte des déchets en France ?', r: 'Les collectivités locales, avec des mesures de tri qui s\'imposent à tous et qui peuvent varier selon les territoires.' },
        { q: 'Qu\'est-ce qu\'un dépôt sauvage ?', r: 'Jeter des déchets dans la rue ou dans la nature hors des dispositifs de collecte : c\'est interdit et puni d\'une amende.' },
        { q: 'Depuis quand le tri des déchets verts et alimentaires est-il obligatoire ?', r: 'Depuis 2024, pour les particuliers et les professionnels.' },
      ],
    },

    // ───────────────────────── p. 67 : énergie, déplacements écologiques
    {
      page: 67,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'Énergie et transports écologiques',
      emoji: '🚲',
      type: 'contenu',
      résumé: 'La consommation d\'énergie pèse sur l\'environnement par les gaz à effet de serre. Des gestes simples réduisent cet impact et les factures : chauffage à 19 °C maximum, chauffe-eau à 55 °C, appareils éteints. Les transports font 34 % des émissions de CO2 : transports en commun, marche, vélo, covoiturage et conduite souple aident.',
      scènes: [
        {
          type: 'scène',
          titre: 'La bataille du thermostat',
          décor: '🏠❄️',
          acteurs: [
            { emoji: '👦🏻', nom: 'Hugo', dit: 'Il fait frais ! Je monte le chauffage à 23 °C.' },
            { emoji: '👵🏾', nom: 'Mamie Rose', dit: 'Non, mon grand : 19 °C maximum. C\'est mieux pour la planète et pour nos factures.' },
            { emoji: '👦🏻', nom: 'Hugo', dit: 'Et je laisse la console en veille ?' },
            { emoji: '👵🏾', nom: 'Mamie Rose', dit: 'Éteins-la ! On éteint les appareils en marche ou en veille quand on ne s\'en sert pas.' },
          ],
        },
        {
          type: 'points',
          titre: 'Les gestes les plus efficaces',
          points: [
            ['🌡️', 'Chauffage réglé à 19 °C maximum'],
            ['🚿', 'Chauffe-eau à 55 °C et douches plus courtes'],
            ['🔌', 'Éteindre les appareils en marche ou en veille inutilisés'],
            ['⏰', 'Utiliser les appareils électriques en dehors des heures de pointe'],
            ['🎛️', 'Installer un thermostat programmable'],
          ],
          narration: 'La consommation d\'énergie a un impact important sur l\'environnement, surtout par les émissions de gaz à effet de serre, les GES.',
        },
        {
          type: 'chiffres',
          titre: 'Les transports et le CO2',
          chiffres: [[34, ' %', 'des émissions de CO2 en France viennent des transports']],
          narration: 'Le secteur des transports représente 34 % des émissions de dioxyde de carbone en France, dont près de la moitié provient des véhicules des particuliers.',
        },
        {
          type: 'duo',
          titre: 'Se déplacer de manière écologique',
          gauche: { emoji: '🚶', titre: 'Sans voiture', texte: 'Transports en commun, surtout en ville ; marche ou vélo pour les trajets courts.' },
          droite: { emoji: '🚗', titre: 'Avec sa voiture', texte: 'Conduite souple, covoiturage, véhicule propre et entretien régulier (pneus gonflés, vidange).' },
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Il est conseillé de régler son chauffage à 19 °C maximum.', true, 'C\'est l\'un des gestes les plus efficaces au quotidien.'],
            ['Les transports représentent 34 % des émissions de CO2 en France.', true, 'Et près de la moitié vient des véhicules des particuliers.'],
            ['Accélérer fort permet d\'économiser du carburant.', false, 'Il faut une conduite souple : rouler et accélérer doucement.'],
          ],
        },
      ],
      questions: [
        { q: 'À quelle température est-il conseillé de régler son chauffage ?', r: 'À 19 °C maximum.' },
        { q: 'À quelle température est-il conseillé de régler son chauffe-eau ?', r: 'À 55 °C, en restant aussi moins longtemps sous la douche.' },
        { q: 'Quelle part des émissions de CO2 vient des transports en France ?', r: '34 %, dont près de la moitié provient des véhicules des particuliers.' },
        { q: 'Comment polluer moins quand on prend sa voiture ?', r: 'Conduite souple, covoiturage, véhicule propre et entretien régulier (pneus gonflés, vidange).' },
      ],
    },

    // ───────────────────────── p. 68 : la santé
    {
      page: 68,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'La Sécurité sociale et les soins',
      emoji: '🏥',
      type: 'contenu',
      résumé: 'Créée en 1945 à la Libération, la Sécurité sociale repose sur la solidarité : cotisations et impôts la financent. Toute personne vivant en France peut se soigner ; chaque résident doit être inscrit à l\'Assurance Maladie et reçoit une carte Vitale. La CPAM rembourse, une mutuelle complète, et le secret médical protège le patient.',
      scènes: [
        {
          type: 'titre',
          emoji: '🏥',
          titre: '1945 : la Sécurité sociale',
          texte: 'À la Libération, la volonté de solidarité nationale crée la Sécurité sociale : un principe de solidarité, donc de fraternité.',
        },
        {
          type: 'zoom',
          titre: 'Qui finance la Sécurité sociale ?',
          centre: { emoji: '🛡️', texte: 'La Sécurité sociale' },
          autour: [
            ['🏭', 'Les cotisations des employeurs'],
            ['👷', 'Les cotisations des salariés'],
            ['🧑‍🔧', 'Les cotisations des travailleurs indépendants'],
            ['🏛️', 'Des impôts'],
          ],
          narration: 'Employeurs, salariés et travailleurs indépendants paient des cotisations. Combinées à des impôts, elles financent la Sécurité sociale.',
        },
        {
          type: 'flux',
          titre: 'Se soigner en France',
          étapes: [
            ['📝', 'S\'inscrire à l\'Assurance Maladie : obligatoire pour tous les résidents'],
            ['💳', 'Recevoir sa carte Vitale, qui justifie ses droits'],
            ['👩‍⚕️', 'Consulter un médecin, aller à l\'hôpital ou en pharmacie'],
            ['💶', 'La CPAM rembourse (avec le tiers payant, on n\'avance pas la part remboursée)'],
            ['🧾', 'Une mutuelle complémentaire aide à payer le reste'],
          ],
          narration: 'Toute personne vivant en France peut se soigner. Les employeurs doivent proposer une complémentaire santé collective à tous leurs salariés, sauf exceptions.',
        },
        {
          type: 'scène',
          titre: 'Le secret du docteur',
          décor: '🩺🏥',
          acteurs: [
            { emoji: '🧑🏻‍💼', nom: 'Le patron de Moussa', dit: 'Docteur, mon salarié Moussa est venu vous voir hier. De quoi souffre-t-il ?' },
            { emoji: '👩🏽‍⚕️', nom: 'La médecin', dit: 'Je ne peux rien vous dire. Les personnels de santé doivent garder secrètes les informations médicales d\'un patient.' },
            { emoji: '🧑🏻‍💼', nom: 'Le patron', dit: 'Même pas un petit indice ?' },
            { emoji: '👩🏽‍⚕️', nom: 'La médecin', dit: 'Non : c\'est le principe de confidentialité dans le domaine de la santé.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Tous les résidents en France doivent être inscrits à l\'Assurance Maladie.', true, 'C\'est une obligation, selon sa situation et dans les conditions fixées par la loi.'],
            ['Avec le tiers payant, le patient avance toute la somme.', false, 'Le tiers payant permet de ne pas avancer la part remboursée par l\'Assurance Maladie.'],
            ['Un médecin peut raconter la maladie d\'un patient à son employeur.', false, 'Les personnels de santé doivent garder secrètes les informations médicales.'],
          ],
        },
      ],
      questions: [
        { q: 'Quand la Sécurité sociale a-t-elle été créée ?', r: 'En 1945, à la Libération, par volonté de solidarité nationale.' },
        { q: 'Qui rembourse les frais de santé ?', r: 'La Caisse primaire d\'assurance maladie (CPAM).' },
        { q: 'À quoi sert la carte Vitale ?', r: 'À justifier ses droits à l\'Assurance Maladie.' },
        { q: 'À quoi sert une mutuelle ?', r: 'C\'est une complémentaire santé : elle aide à payer les frais que la Sécurité sociale ne prend pas entièrement en charge.' },
      ],
    },

    // ───────────────────────── p. 69 : numéros d'urgence
    {
      page: 69,
      partie: 5,
      section: 'I. La vie quotidienne',
      titre: 'Les numéros d\'urgence',
      emoji: '🚑',
      type: 'contenu',
      résumé: 'Les services d\'urgence se joignent par téléphone 24h/24 et 7j/7, gratuitement : 15 (SAMU), 17 (police secours), 18 (sapeurs-pompiers), 112 (numéro européen), et aussi 115, 119, 196, 3919, 3018 ou 114 par SMS. Les victimes de violence peuvent porter plainte auprès de la police ou de la gendarmerie.',
      scènes: [
        {
          type: 'chiffres',
          titre: 'Les numéros à connaître par cœur',
          chiffres: [
            [15, '', 'SAMU'],
            [17, '', 'Police secours'],
            [18, '', 'Sapeurs-pompiers'],
            [112, '', 'Appel d\'urgence européen'],
          ],
          narration: 'En cas d\'urgence, les secours se joignent par téléphone 24 heures sur 24 et 7 jours sur 7. Ces appels sont gratuits.',
        },
        {
          type: 'chiffres',
          titre: 'D\'autres numéros d\'urgence',
          chiffres: [
            [115, '', 'Hébergement d\'urgence'],
            [119, '', 'Enfance maltraitée'],
            [196, '', 'Secours en mer'],
            [114, '', 'Par SMS, pour les personnes malentendantes'],
          ],
        },
        {
          type: 'points',
          titre: 'Violences, harcèlement, détresse',
          points: [
            ['💜', '3919 : violences conjugales'],
            ['🏫', '3018 : harcèlement scolaire'],
            ['🫂', '3114 : prévention du suicide'],
            ['🔎', '116 000 : enfants disparus'],
            ['🆘', '197 : alerte attentat'],
          ],
        },
        {
          type: 'scène',
          titre: 'Le quiz de Yasmine',
          décor: '📱🏠',
          acteurs: [
            { emoji: '👧🏽', nom: 'Yasmine', dit: 'Papa, quel numéro pour un risque pour la sécurité dans le métro ?' },
            { emoji: '👨🏽', nom: 'Papa', dit: 'Le 3117, ou un SMS au 31 177. Et pour les secours aéronautiques, c\'est le 191.' },
            { emoji: '👧🏽', nom: 'Yasmine', dit: 'Et si quelqu\'un est victime de violence ?' },
            { emoji: '👨🏽', nom: 'Papa', dit: 'Il peut porter plainte auprès de la police nationale ou de la gendarmerie nationale, et demander de l\'aide à des associations.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Le 15 est le numéro du SAMU.', true, '15 : SAMU ; 17 : police secours ; 18 : sapeurs-pompiers.'],
            ['Les appels aux numéros d\'urgence sont payants la nuit.', false, 'Ils sont gratuits et joignables 24h/24 et 7j/7.'],
            ['Le 3919 est le numéro des violences conjugales.', true, '3919 : violences conjugales ; 3018 : harcèlement scolaire.'],
          ],
        },
      ],
      questions: [
        { q: 'Quels sont les numéros du SAMU, de la police et des pompiers ?', r: '15 pour le SAMU, 17 pour police secours, 18 pour les sapeurs-pompiers.' },
        { q: 'Quel est le numéro d\'appel d\'urgence européen ?', r: 'Le 112.' },
        { q: 'Quel numéro appeler pour un enfant maltraité ?', r: 'Le 119 (enfance maltraitée).' },
        { q: 'Quel numéro pour les violences conjugales ? Et pour le harcèlement scolaire ?', r: 'Le 3919 pour les violences conjugales ; le 3018 pour le harcèlement scolaire.' },
      ],
    },

    // ───────────────────────── p. 70 : la réglementation du travail
    {
      page: 70,
      partie: 5,
      section: 'II. Travailler en France',
      titre: 'Le droit du travail',
      emoji: '⚖️',
      type: 'contenu',
      résumé: 'Le droit du travail encadre les relations entre salariés et employeurs : code du travail (35 heures par semaine), conventions collectives et règlement intérieur (entreprises d\'au moins 50 salariés). Le SMIC est le salaire horaire minimum garanti. Aucune discrimination n\'est permise, chacun peut se syndiquer et le conseil de prud\'hommes juge les litiges.',
      scènes: [
        {
          type: 'zoom',
          titre: 'Trois documents fixent les règles',
          centre: { emoji: '⚖️', texte: 'Le droit du travail' },
          autour: [
            ['📕', 'Le code du travail : droits et obligations pour tous (contrat, conditions de travail, salaire, durée légale)'],
            ['🤝', 'Les conventions collectives : accords négociés pour une activité (ex. transport routier), qui adaptent congés ou salaires minimum'],
            ['📋', 'Le règlement intérieur : écrit par l\'employeur d\'une entreprise d\'au moins 50 salariés (santé, sécurité, comportement)'],
          ],
          narration: 'Le droit du travail, c\'est l\'ensemble des règles juridiques qui concernent les relations professionnelles entre salariés et employeurs.',
        },
        {
          type: 'chiffres',
          titre: 'Deux repères chiffrés',
          chiffres: [
            [35, ' heures', 'durée légale du travail par semaine'],
            [50, ' salariés', 'au moins : l\'entreprise a un règlement intérieur'],
          ],
        },
        {
          type: 'scène',
          titre: 'L\'entretien d\'embauche',
          décor: '🏢💼',
          acteurs: [
            { emoji: '👩🏿', nom: 'Fatou, candidate', dit: 'Bonjour, je viens pour le poste de comptable.' },
            { emoji: '🧑🏼‍💼', nom: 'Le recruteur', dit: 'Ce poste exige une qualification : pouvez-vous me montrer votre diplôme ?' },
            { emoji: '👩🏿', nom: 'Fatou', dit: 'Le voici. Et vous ne me demanderez rien sur ma religion, j\'espère ?' },
            { emoji: '🧑🏼‍💼', nom: 'Le recruteur', dit: 'Bien sûr que non : au travail, aucune discrimination n\'est permise, ni sur le genre, ni sur la religion, ni sur le physique.' },
          ],
        },
        {
          type: 'points',
          titre: 'Les droits du salarié',
          points: [
            ['💶', 'Un salaire au moins égal au SMIC, le salaire horaire minimum garanti'],
            ['✊', 'Le droit de rejoindre un syndicat, sans condition'],
            ['🚫', 'Aucune discrimination : genre, religion, physique…'],
            ['🏛️', 'En cas de litige avec l\'employeur : le conseil de prud\'hommes'],
          ],
          narration: 'Le SMIC est dû aux salariés du secteur privé d\'au moins 18 ans, ou de 16 ans sur autorisation parentale ou s\'ils sont mineurs émancipés.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['La durée légale du travail est de 35 heures par semaine.', true, 'Elle est fixée par le code du travail.'],
            ['Il faut l\'accord de son employeur pour rejoindre un syndicat.', false, 'Chaque travailleur, sans condition, a le droit de rejoindre une organisation syndicale.'],
            ['Un litige entre un salarié et son employeur est jugé par le conseil de prud\'hommes.', true, 'Le conseil de prud\'hommes est compétent pour ces situations.'],
          ],
        },
      ],
      questions: [
        { q: 'Quelle est la durée légale du travail par semaine ?', r: '35 heures, fixées par le code du travail.' },
        { q: 'Qu\'est-ce que le SMIC ?', r: 'Le salaire minimum de croissance : le salaire horaire minimum garanti en France.' },
        { q: 'Qui juge un litige entre un employeur et son salarié ?', r: 'Le conseil de prud\'hommes.' },
        { q: 'Qu\'est-ce que le règlement intérieur ?', r: 'Un document écrit par l\'employeur d\'une entreprise d\'au moins 50 salariés : règles internes, santé, sécurité, comportement.' },
      ],
    },

    // ───────────────────────── p. 71 : contrat de travail, France Travail, création d'entreprise
    {
      page: 71,
      partie: 5,
      section: 'II. Travailler en France',
      titre: 'Contrat, emploi et entreprise',
      emoji: '📝',
      type: 'contenu',
      résumé: 'Après une embauche, un contrat de travail est obligatoire : il précise salaire, compétences, date de début, durée du travail et type de contrat (CDD, CDI, intérim). France Travail accompagne les demandeurs d\'emploi et peut verser l\'ARE. Chacun, même sans être français, peut créer son entreprise en faisant des démarches.',
      scènes: [
        {
          type: 'scène',
          titre: 'Le premier jour',
          décor: '🏢✍️',
          acteurs: [
            { emoji: '👩🏻‍💼', nom: 'Mme Martin, employeuse', dit: 'Bienvenue ! Voici votre contrat de travail à signer.' },
            { emoji: '🧑🏾', nom: 'Ibrahim', dit: 'Je vérifie : le salaire, les compétences demandées, la date de début, la durée du travail… et le type de contrat ?' },
            { emoji: '👩🏻‍💼', nom: 'Mme Martin', dit: 'Un CDI, pour un emploi permanent. Pour un travail temporaire, ce serait un CDD.' },
            { emoji: '🧑🏾', nom: 'Ibrahim', dit: 'Parfait. Ce document est obligatoire : je signe !' },
          ],
        },
        {
          type: 'duo',
          titre: 'CDD ou CDI ?',
          gauche: { emoji: '⏳', titre: 'CDD', texte: 'Contrat à durée déterminée : pour un travail temporaire.' },
          droite: { emoji: '♾️', titre: 'CDI', texte: 'Contrat à durée indéterminée : pour un emploi permanent.' },
          narration: 'Ce sont les contrats les plus courants, avec le contrat d\'intérim.',
        },
        {
          type: 'flux',
          titre: 'Chercher un emploi avec France Travail',
          étapes: [
            ['📝', 'S\'inscrire à France Travail'],
            ['🧭', 'Être accompagné : conseils adaptés à sa situation, formations'],
            ['✅', 'Vérifier les conditions : avoir travaillé assez longtemps, ne pas avoir quitté son travail volontairement…'],
            ['💶', 'Après une perte d\'emploi : recevoir chaque mois l\'Allocation d\'aide au retour à l\'emploi (ARE)'],
          ],
          narration: 'France Travail est un organisme public qui aide à trouver un emploi, en insertion professionnelle ou en retour à l\'emploi. Pour les jeunes de moins de 25 ans, l\'accompagnement est réalisé par les Missions Locales.',
        },
        {
          type: 'points',
          titre: 'Créer son entreprise : les démarches',
          points: [
            ['📜', 'Enregistrer les statuts de la société'],
            ['🔢', 'Immatriculer l\'entreprise'],
            ['📰', 'Publier son activité dans un journal d\'annonces légales'],
            ['📍', 'Déclarer le siège social'],
          ],
          narration: 'Chacun est libre de créer son entreprise en France : il n\'est pas nécessaire d\'être français. Mais il faut faire des démarches administratives.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Il faut être français pour créer une entreprise en France.', false, 'Chacun est libre de créer son entreprise ; il n\'est pas nécessaire d\'être français.'],
            ['Le contrat de travail est obligatoire après une embauche.', true, 'Il doit être signé entre le salarié et l\'employeur.'],
            ['Les jeunes de moins de 25 ans sont accompagnés par les Missions Locales.', true, 'Elles réalisent l\'accompagnement vers l\'emploi des moins de 25 ans.'],
          ],
        },
      ],
      questions: [
        { q: 'Quelle est la différence entre un CDD et un CDI ?', r: 'Le CDD (durée déterminée) est pour un travail temporaire, le CDI (durée indéterminée) pour un emploi permanent.' },
        { q: 'Quel organisme accompagne les personnes qui cherchent un emploi ?', r: 'France Travail : il aide à trouver un emploi, propose des formations et peut verser l\'ARE.' },
        { q: 'Qu\'est-ce que l\'ARE ?', r: 'L\'Allocation d\'aide au retour à l\'emploi, versée chaque mois par France Travail aux personnes ayant perdu leur emploi, sous conditions.' },
        { q: 'Faut-il être français pour créer son entreprise en France ?', r: 'Non : chacun est libre de créer son entreprise en France.' },
      ],
    },

    // ───────────────────────── p. 72 : secteurs d'activité, emploi public
    {
      page: 72,
      partie: 5,
      section: 'II. Travailler en France',
      titre: 'Entreprendre et fonction publique',
      emoji: '🏛️',
      type: 'contenu',
      résumé: 'Les règles de création d\'entreprise varient selon quatre secteurs : artisanat, commerce, professions libérales, agriculture ; la CMA et la CCI aident les créateurs. La fonction publique est ouverte à tous sans discrimination, par concours et sous conditions (nationalité française ou européenne, droits civiques, casier). Il existe trois fonctions publiques.',
      scènes: [
        {
          type: 'points',
          titre: 'Les quatre grands secteurs d\'activité',
          points: [
            ['🔨', 'L\'artisanat : production, transformation ou services, en indépendant'],
            ['🛍️', 'Le commerce : achats pour revente, intermédiaire, transport de marchandises…'],
            ['⚕️', 'Les professions libérales : services non commerciaux (médecins, avocats…)'],
            ['🚜', 'L\'activité agricole'],
          ],
          narration: 'Partout en France, des structures aident les créateurs : conseils, planification du projet, recherche de financements. Par exemple la chambre des métiers et de l\'artisanat, la CMA, ou la chambre de commerce et d\'industrie, la CCI.',
        },
        {
          type: 'zoom',
          titre: 'Qu\'est-ce qu\'un fonctionnaire ?',
          centre: { emoji: '🧑‍💼', texte: 'Un agent public titulaire' },
          autour: [
            ['🏛️', 'Fonction publique d\'État'],
            ['🗺️', 'Fonction publique territoriale'],
            ['🏥', 'Fonction publique hospitalière'],
            ['📘', 'Statut régi par le code général de la fonction publique'],
          ],
          narration: 'Le fonctionnaire travaille dans l\'une des trois fonctions publiques.',
        },
        {
          type: 'flux',
          titre: 'Devenir fonctionnaire',
          étapes: [
            ['✅', 'Remplir les conditions : âge, diplôme, nationalité française (ou UE/EEE), droits civiques, aucune condamnation au bulletin n°2 du casier'],
            ['📝', 'Réussir un concours (sauf exceptions), qui garantit l\'égal accès'],
            ['🎓', 'Effectuer une période de stage'],
            ['🏅', 'Être titularisé dans un grade (A, B ou C)'],
            ['🏢', 'Occuper un emploi permanent dans l\'administration'],
          ],
          narration: 'L\'accès aux emplois publics est ouvert à tous sans discrimination : la sélection se fait uniquement selon les compétences et les qualités.',
        },
        {
          type: 'scène',
          titre: 'Les questions d\'Elena',
          décor: '📋🏛️',
          acteurs: [
            { emoji: '👩🏻', nom: 'Elena, Espagnole', dit: 'Je suis européenne : je peux passer un concours de la fonction publique ?' },
            { emoji: '🧑🏽‍🏫', nom: 'Le conseiller', dit: 'Oui, mais pas pour les emplois dits « de souveraineté », comme la défense ou les affaires étrangères.' },
            { emoji: '👩🏻', nom: 'Elena', dit: 'Et si je réussis un concours de la fonction publique territoriale, j\'ai un poste tout de suite ?' },
            { emoji: '🧑🏽‍🏫', nom: 'Le conseiller', dit: 'Non : contrairement à la fonction publique d\'État, vous serez inscrite sur une liste et devrez postuler vous-même à un emploi.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['L\'accès à la fonction publique est ouvert à tous sans discrimination.', true, 'La sélection se fait uniquement selon les compétences et les qualités.'],
            ['Un candidat européen peut accéder à tous les emplois publics, même dans la défense.', false, 'Les emplois dits « de souveraineté » (défense, affaires étrangères…) ne leur sont pas ouverts.'],
            ['Les médecins et les avocats exercent des professions libérales.', true, 'Elles se caractérisent par une offre de services non commerciaux.'],
          ],
        },
      ],
      questions: [
        { q: 'Quelles sont les trois fonctions publiques ?', r: 'La fonction publique d\'État, la fonction publique territoriale et la fonction publique hospitalière.' },
        { q: 'Comment est-on recruté dans la fonction publique ?', r: 'Par concours (sauf exceptions), pour garantir l\'égal accès ; après un stage, on est titularisé dans un grade (A, B ou C).' },
        { q: 'Quelles conditions faut-il remplir pour passer un concours de la fonction publique ?', r: 'Âge, diplôme, nationalité française ou européenne (UE/EEE), droits civiques, aucune condamnation au bulletin n°2 du casier.' },
        { q: 'Quelles structures aident à créer une entreprise ?', r: 'Par exemple la chambre des métiers et de l\'artisanat (CMA) et la chambre de commerce et d\'industrie (CCI).' },
      ],
    },

    // ───────────────────────── p. 73 : mariage, droits des parents
    {
      page: 73,
      partie: 5,
      section: 'III. La vie familiale',
      titre: 'Le mariage et les droits des parents',
      emoji: '💍',
      type: 'contenu',
      résumé: 'Seul le mariage civil, célébré en mairie, est reconnu par la loi ; il est possible à 18 ans (16 ans avec autorisation). La polygamie est interdite. Depuis 2013, le mariage est ouvert aux couples de même sexe. Après un divorce, les deux parents gardent l\'autorité parentale. La loi protège l\'emploi des femmes enceintes et prévoit des congés pour les parents.',
      scènes: [
        {
          type: 'scène',
          titre: 'À la mairie, le grand jour',
          décor: '🏛️💐',
          acteurs: [
            { emoji: '🤵🏽', nom: 'Karim', dit: 'Pourquoi se marier ici, dans la commune de tes parents ?' },
            { emoji: '👰🏻', nom: 'Claire', dit: 'Parce qu\'on se marie à la mairie où vit l\'un de nous deux ou l\'un de nos parents. Et seul le mariage civil est reconnu par la loi.' },
            { emoji: '🧑🏻‍💼', nom: 'Le maire', dit: 'Je vous déclare unis par les liens du mariage ! Voici votre acte de mariage français et votre livret de famille.' },
          ],
          narration: 'Le mariage est célébré par le maire ou par un adjoint au maire.',
        },
        {
          type: 'points',
          titre: 'Les règles du mariage',
          points: [
            ['🎂', 'Possible à partir de 18 ans ; à 16 ans seulement avec l\'autorisation du procureur de la République et l\'accord des parents'],
            ['🚫', 'La polygamie (être marié à plusieurs personnes à la fois) est interdite : c\'est une infraction pénale'],
            ['🏳️‍🌈', 'Depuis le 17 mai 2013, le mariage est ouvert aux couples de même sexe : la France est le 14e pays au monde à l\'autoriser'],
            ['⚖️', 'Divorce devant un juge, ou par consentement mutuel devant un notaire'],
          ],
          narration: 'En cas de séparation, l\'autorité parentale sur les enfants continue d\'être exercée par les deux parents, sauf décision de justice contraire.',
        },
        {
          type: 'devinette',
          question: 'Dans quel délai faut-il déclarer la naissance d\'un enfant à l\'état civil ?',
          réponse: 'Dans les 5 jours qui suivent la naissance. Déclarer les naissances, les mariages et les décès est obligatoire.',
          indice: 'Moins d\'une semaine.',
          narration: 'L\'état civil met à jour les informations officielles sur la vie d\'une personne. C\'est aussi le service de la commune, ou du ministère des Affaires étrangères pour les personnes nées à l\'étranger, qui dresse les actes.',
        },
        {
          type: 'frise',
          titre: 'Les congés des parents',
          étapes: [
            ['1er juillet 2021', 'Le congé paternité dure désormais 28 jours', '👨‍🍼'],
            ['1er janvier 2026', 'Enfant né ou adopté à partir de cette date : « congé supplémentaire de naissance » d\'un ou deux mois', '👶'],
            ['Juillet 2026', 'Ce congé supplémentaire peut être pris', '📅'],
          ],
          narration: 'Pendant la grossesse et le congé maternité, l\'employeur ne peut pas licencier la salariée pour ce motif. Et après la naissance ou l\'adoption d\'un enfant de moins de 16 ans, tout salarié peut prendre un congé parental d\'éducation.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Un mariage seulement religieux est reconnu par la loi française.', false, 'Seul le mariage civil célébré en mairie est reconnu par la loi.'],
            ['Un employeur peut licencier une salariée parce qu\'elle est enceinte.', false, 'La loi garantit à la femme de conserver son emploi pendant la grossesse et le congé maternité.'],
            ['Après un divorce, les deux parents gardent l\'autorité parentale, sauf décision de justice contraire.', true, 'L\'autorité parentale continue d\'être exercée par les deux parents.'],
          ],
        },
      ],
      questions: [
        { q: 'Quel mariage est reconnu par la loi en France ?', r: 'Seul le mariage civil, célébré par le maire ou un adjoint à la mairie.' },
        { q: 'À partir de quel âge peut-on se marier ?', r: 'À 18 ans ; à 16 ans seulement avec l\'autorisation du procureur de la République et l\'accord des parents.' },
        { q: 'Depuis quand le mariage est-il ouvert aux couples de même sexe ?', r: 'Depuis la loi promulguée le 17 mai 2013 ; la France a été le 14e pays du monde à l\'autoriser.' },
        { q: 'Combien de jours dure le congé paternité ?', r: '28 jours, depuis le 1er juillet 2021.' },
      ],
    },

    // ───────────────────────── p. 74 : droits des enfants, obligations parentales
    {
      page: 74,
      partie: 5,
      section: 'III. La vie familiale',
      titre: 'Droits de l\'enfant, devoirs des parents',
      emoji: '🧒',
      type: 'contenu',
      résumé: 'La Convention internationale des droits de l\'enfant, signée en 1989 par 196 États dans le cadre de l\'ONU, protège les enfants et fonde l\'action de l\'UNICEF. L\'autorité parentale (article 371-1 du code civil) est un ensemble de droits et de devoirs pour protéger l\'enfant ; elle s\'exerce sans violence et toute maltraitance est interdite.',
      scènes: [
        {
          type: 'titre',
          emoji: '🌐',
          titre: 'La Convention internationale des droits de l\'enfant',
          texte: 'En 1989, dans le cadre de l\'ONU, 196 États ont signé ce texte. Il présente les droits fondamentaux des enfants et impose des obligations aux États signataires.',
          narration: 'Cette convention assure la protection des enfants. C\'est le fondement de toute l\'action de l\'UNICEF, une organisation qui dépend de l\'ONU.',
        },
        {
          type: 'nuage',
          titre: 'Quelques droits de l\'enfant',
          mots: ['Égalité', 'Un nom', 'Une identité', 'Être soigné', 'Bien manger', 'Aller à l\'école', 'Vie privée', 'Pas de violence', 'Pas d\'exploitation', 'S\'exprimer, être entendu'],
          narration: 'L\'enfant a droit à l\'égalité, à un nom, à être soigné et bien nourri, à l\'école, à la vie privée, à la protection contre la violence et l\'exploitation, et à être entendu. Les enfants handicapés ont droit à la même vie que les autres, avec un emploi du temps aménagé si besoin.',
        },
        {
          type: 'zoom',
          titre: 'L\'autorité parentale (article 371-1 du code civil)',
          centre: { emoji: '👨‍👩‍👧', texte: 'Des droits et des devoirs pour protéger l\'enfant' },
          autour: [
            ['🛡️', 'Sécurité : surveiller relations, déplacements, communications, réseaux sociaux'],
            ['🩺', 'Santé'],
            ['🔒', 'Vie privée et image'],
            ['🍲', 'Bien-être : alimentation, hébergement, loisirs'],
            ['🎓', 'Éducation et développement'],
            ['🗣️', 'Associer l\'enfant aux décisions, selon son âge et sa maturité'],
          ],
          narration: 'L\'autorité parentale appartient aux parents jusqu\'à la majorité ou l\'émancipation de l\'enfant. Ils doivent le protéger, par exemple contre le racket, le viol, la prostitution, les addictions, le harcèlement ou la violence.',
        },
        {
          type: 'scène',
          titre: 'Une fessée ? Non.',
          décor: '🏠🧸',
          acteurs: [
            { emoji: '👴🏽', nom: 'Grand-père', dit: 'De mon temps, une bonne correction, ça faisait grandir !' },
            { emoji: '👩🏽', nom: 'Salma, la maman', dit: 'Aujourd\'hui, l\'autorité parentale s\'exerce sans violences physiques ou psychologiques.' },
            { emoji: '👴🏽', nom: 'Grand-père', dit: 'Même une petite tape ?' },
            { emoji: '👩🏽', nom: 'Salma', dit: 'Les châtiments corporels sont interdits par la loi, comme l\'excision : ils portent atteinte à l\'intégrité physique et à la dignité de l\'enfant.' },
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Des parents peuvent déshériter totalement l\'un de leurs enfants.', false, 'Ce n\'est pas possible : le partage doit être équitable entre tous les membres de la fratrie.'],
            ['L\'UNICEF est une organisation qui dépend de l\'ONU.', true, 'La Convention internationale des droits de l\'enfant est le fondement de son action.'],
            ['Les parents associent l\'enfant aux décisions qui le concernent, selon son âge et sa maturité.', true, 'C\'est ce que prévoit l\'exercice de l\'autorité parentale.'],
          ],
        },
      ],
      questions: [
        { q: 'Qu\'est-ce que la Convention internationale des droits de l\'enfant ?', r: 'Un texte signé en 1989 par 196 États dans le cadre de l\'ONU, qui présente et protège les droits fondamentaux des enfants.' },
        { q: 'Qu\'est-ce que l\'autorité parentale ?', r: 'Un ensemble de droits et de devoirs (article 371-1 du code civil) pour protéger l\'intérêt de l\'enfant et favoriser son bien-être.' },
        { q: 'Les châtiments corporels sont-ils autorisés ?', r: 'Non : toutes les maltraitances physiques, comme l\'excision et les châtiments corporels, sont interdites par la loi.' },
        { q: 'Peut-on déshériter totalement ses enfants ?', r: 'Non : le partage doit être équitable entre tous les membres de la fratrie.' },
      ],
    },

    // ───────────────────────── p. 75 : l'éducation
    {
      page: 75,
      partie: 5,
      section: 'III. La vie familiale',
      titre: 'L\'école, de 3 à 16 ans',
      emoji: '🎒',
      type: 'contenu',
      résumé: 'Les parents veillent à l\'éducation de leurs enfants. L\'instruction est obligatoire de 3 à 16 ans ; seules les absences pour santé ou raisons familiales sont acceptées. Les mairies gèrent les inscriptions. Les enfants allophones et handicapés sont accueillis. Les parents participent à la vie de l\'école. Parcours : maternelle, élémentaire, collège, lycée.',
      scènes: [
        {
          type: 'chiffres',
          titre: 'L\'instruction obligatoire',
          chiffres: [
            [3, ' ans', 'début de l\'instruction obligatoire'],
            [16, ' ans', 'fin de l\'instruction obligatoire'],
          ],
          narration: 'L\'école est obligatoire de 3 à 16 ans. Les parents qui ne respectent pas cette obligation peuvent être sanctionnés par une amende, ainsi qu\'une peine de prison. Seules les absences pour raisons de santé ou familiales, comme un mariage ou un enterrement, sont acceptées.',
        },
        {
          type: 'scène',
          titre: 'Inscription à la mairie',
          décor: '🏛️🎒',
          acteurs: [
            { emoji: '👨🏾', nom: 'M. Mensah', dit: 'Nous venons d\'arriver. Ma fille Leïla, 7 ans, ne parle pas encore français. Elle doit attendre pour aller à l\'école ?' },
            { emoji: '👩🏻‍💼', nom: 'L\'agente de la mairie', dit: 'Non ! C\'est la mairie qui gère les inscriptions à l\'école publique. Les enfants allophones sont accueillis comme les autres.' },
            { emoji: '👨🏾', nom: 'M. Mensah', dit: 'Elle apprendra le français là-bas ?' },
            { emoji: '👩🏻‍💼', nom: 'L\'agente', dit: 'Oui, le français et aussi toutes les autres matières.' },
          ],
          narration: 'Les enfants en situation de handicap peuvent aussi avoir un emploi du temps aménagé à l\'école pour suivre leurs soins.',
        },
        {
          type: 'flux',
          titre: 'Le parcours scolaire',
          étapes: [
            ['🧸', 'École maternelle : dès 3 ans, au début de l\'instruction obligatoire'],
            ['✏️', 'École élémentaire : de 6 à 11 ans, du CP au CM2'],
            ['📚', 'Collège : quatre années, pour tous les enfants'],
            ['🎓', 'Lycée général, technologique ou professionnel : seconde, première, terminale'],
          ],
          narration: 'L\'école primaire regroupe l\'école maternelle et l\'école élémentaire. Le collège est l\'établissement de niveau secondaire. Au lycée, la scolarité dure trois ans.',
        },
        {
          type: 'points',
          titre: 'Les parents dans la communauté éducative',
          points: [
            ['🤝', 'Garder des relations avec les professeurs, l\'administration et l\'équipe (ATSEM, animateurs périscolaires…)'],
            ['🗳️', 'Se présenter aux élections des représentants de parents d\'élèves'],
            ['👪', 'Rejoindre une association de parents'],
          ],
          narration: 'Les parents doivent veiller à l\'éducation scolaire, intellectuelle et morale de leurs enfants.',
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['L\'instruction est obligatoire de 3 à 16 ans.', true, 'Les parents qui ne respectent pas cette obligation peuvent être sanctionnés.'],
            ['On peut garder son enfant à la maison pour qu\'il aide au magasin familial.', false, 'Seules les absences pour raisons de santé ou familiales (mariage, enterrement…) sont acceptées.'],
            ['Un enfant qui ne parle pas français doit attendre avant d\'aller à l\'école.', false, 'Les enfants allophones sont accueillis comme les autres ; ils y apprennent le français et les autres matières.'],
          ],
        },
      ],
      questions: [
        { q: 'De quel âge à quel âge l\'instruction est-elle obligatoire ?', r: 'De 3 à 16 ans.' },
        { q: 'Qui gère les inscriptions des enfants à l\'école publique ?', r: 'Les mairies.' },
        { q: 'Quelles absences sont acceptées par les établissements scolaires ?', r: 'Seulement les absences pour raisons de santé ou familiales (mariage, enterrement…).' },
        { q: 'Combien d\'années dure le collège ? Et le lycée ?', r: 'Quatre années au collège ; trois ans au lycée : la seconde, la première et la terminale.' },
      ],
    },

    // ───────────────────────── p. 76 : le numérique et les enfants
    {
      page: 76,
      partie: 5,
      section: 'III. La vie familiale',
      titre: 'Le numérique et les enfants',
      emoji: '📱',
      type: 'contenu',
      résumé: 'Les écrans sont très présents dans les familles ; trop les regarder peut nuire à la santé physique et mentale des enfants et à leur vie sociale. Les parents veillent au bon usage des écrans. La loi du 7 juillet 2023 a instauré la majorité numérique à 15 ans. L\'école enseigne la citoyenneté numérique.',
      scènes: [
        {
          type: 'titre',
          emoji: '📱',
          titre: 'Les écrans à la maison',
          texte: 'Téléphone, ordinateur, télévision : utiles, mais trop d\'écrans peut nuire à la santé physique et mentale des enfants et à leur vie sociale.',
          narration: 'Les enfants et les adolescents utilisent les écrans très tôt, à la maison comme à l\'école. Les parents doivent s\'assurer du bon usage des écrans par leur enfant.',
        },
        {
          type: 'scène',
          titre: 'Le compte du collégien',
          décor: '🏠📱',
          acteurs: [
            { emoji: '👦🏽', nom: 'Adam, 13 ans', dit: 'Maman, je m\'inscris tout seul sur ce réseau social, tous mes copains y sont !' },
            { emoji: '👩🏽', nom: 'Maman', dit: 'Impossible : la loi du 7 juillet 2023 a instauré la majorité numérique à 15 ans.' },
            { emoji: '👦🏽', nom: 'Adam', dit: 'Mais pourquoi ?' },
            { emoji: '👩🏽', nom: 'Maman', dit: 'Pour lutter contre les délits en ligne, comme le cyber-harcèlement. Et moi, je dois veiller au bon usage de tes écrans.' },
          ],
        },
        {
          type: 'chiffres',
          titre: 'La majorité numérique',
          chiffres: [[15, ' ans', 'avant cet âge, on ne peut plus s\'inscrire seul sur les réseaux sociaux']],
        },
        {
          type: 'zoom',
          titre: 'La citoyenneté numérique',
          centre: { emoji: '💻', texte: 'Enseignée notamment à l\'école' },
          autour: [
            ['🎯', 'Un usage efficace des technologies numériques'],
            ['🤝', 'Un usage responsable'],
            ['⚖️', 'Un usage éthique'],
            ['🔐', 'Un usage sûr'],
          ],
        },
        {
          type: 'vraiFaux',
          affirmations: [
            ['Avant 15 ans, on ne peut plus s\'inscrire seul sur les réseaux sociaux.', true, 'La loi du 7 juillet 2023 a instauré la majorité numérique à 15 ans.'],
            ['Les écrans n\'ont aucune conséquence sur la santé des enfants.', false, 'Trop les regarder peut avoir des conséquences sur leur santé physique et mentale et sur leur vie sociale.'],
          ],
        },
      ],
      questions: [
        { q: 'Quel est l\'âge de la majorité numérique ?', r: '15 ans, depuis la loi du 7 juillet 2023.' },
        { q: 'Pourquoi la majorité numérique a-t-elle été instaurée ?', r: 'Pour lutter contre les délits en ligne, comme le cyber-harcèlement.' },
        { q: 'À quoi sert la citoyenneté numérique enseignée à l\'école ?', r: 'À apprendre à faire un usage efficace des technologies numériques, de manière responsable, éthique et sûre.' },
      ],
    },
  ],

  leçons: [
    { id: 'p5-loger', titre: 'Se loger et prendre la route', emoji: '🏠', pages: [62, 63] },
    { id: 'p5-route', titre: 'Transports, assurance, tabac et alcool', emoji: '🚌', pages: [64, 65] },
    { id: 'p5-planete', titre: 'Civisme et environnement', emoji: '♻️', pages: [66, 67] },
    { id: 'p5-sante', titre: 'La santé et les numéros d\'urgence', emoji: '🏥', pages: [68, 69] },
    { id: 'p5-droit-travail', titre: 'Le droit du travail', emoji: '⚖️', pages: [70] },
    { id: 'p5-emploi', titre: 'Contrat, emploi, entreprise, fonction publique', emoji: '💼', pages: [71, 72] },
    { id: 'p5-famille', titre: 'Le mariage, les parents et les enfants', emoji: '💍', pages: [73, 74] },
    { id: 'p5-ecole', titre: 'L\'école et le numérique', emoji: '🎒', pages: [75, 76] },
  ],

  maison: [
    {
      id: 'p5-cle',
      pièce: 'cuisine',
      emoji: '🔑',
      objet: 'Le porte-clés au mur',
      fait: 'En France, 40 % de la population est locataire ; un peu moins de la moitié de ces logements loués sont des logements sociaux (HLM).',
      image: 'Sur les 10 crochets du porte-clés, 4 clés portent l\'étiquette « locataire » : 40 % ! Et presque la moitié d\'entre elles ont un petit porte-clés « HLM ».',
      page: 62,
    },
    {
      id: 'p5-bouteille',
      pièce: 'cuisine',
      emoji: '🍾',
      objet: 'La bouteille de vin sur le plan de travail',
      fait: 'Conduire avec plus de 0,8 g/l d\'alcool dans le sang : jusqu\'à 3 ans de prison, 9 000 euros d\'amende, saisie du véhicule et annulation du permis pendant 5 ans.',
      image: 'L\'étiquette de la bouteille affiche « 0,8 ». Trois menottes pendent au goulot, 9 000 pièces en tombent, et une petite voiture est enfermée dans le placard pendant 5 ans.',
      page: 64,
    },
    {
      id: 'p5-hotte',
      pièce: 'cuisine',
      emoji: '💨',
      objet: 'La hotte aspirante',
      fait: 'Depuis le 1er juillet 2025, il est interdit de fumer dans les parcs, sur les plages, aux abribus et aux abords des écoles ; la loi Évin (10 janvier 1991) prévoit une amende de 135 euros.',
      image: 'La hotte aspire toute la fumée en criant « Évin ! Évin ! », puis recrache un ticket d\'amende de 135 euros décoré d\'un parc, d\'une plage et d\'une école.',
      page: 65,
    },
    {
      id: 'p5-poubelle',
      pièce: 'cuisine',
      emoji: '🗑️',
      objet: 'La poubelle de tri',
      fait: 'Un Français produit environ 500 kg de déchets par an ; depuis 2024, le tri des déchets verts et alimentaires (pour le compostage) est obligatoire.',
      image: 'La poubelle a une balance intégrée qui affiche 500 kg à la fin de l\'année. À côté, un petit composteur en forme de « 2024 » croque les épluchures.',
      page: 66,
    },
    {
      id: 'p5-radiateur',
      pièce: 'cuisine',
      emoji: '🌡️',
      objet: 'Le radiateur sous la fenêtre',
      fait: 'Gestes pour économiser l\'énergie : chauffage à 19 °C maximum, chauffe-eau à 55 °C, appareils éteints quand ils ne servent pas.',
      image: 'Le radiateur porte un énorme « 19 » rouge et refuse de chauffer plus. Au-dessus de l\'évier, le chauffe-eau affiche « 55 » et chantonne « douche courte ! ».',
      page: 67,
    },
    {
      id: 'p5-vitale',
      pièce: 'cuisine',
      emoji: '💳',
      objet: 'La boîte à biscuits verte',
      fait: 'La Sécurité sociale a été créée en 1945, à la Libération. Chaque assuré reçoit une carte Vitale ; la CPAM rembourse les frais de santé.',
      image: 'La boîte à biscuits est verte comme une carte Vitale et datée « 1945 ». Quand tu l\'ouvres, une carte Vitale saute dehors en criant « La CPAM te rembourse ! ».',
      page: 68,
    },
    {
      id: 'p5-frigo',
      pièce: 'cuisine',
      emoji: '🧲',
      objet: 'Les aimants du frigo',
      fait: 'Numéros d\'urgence gratuits, 24h/24 et 7j/7 : 15 SAMU, 17 police secours, 18 sapeurs-pompiers, 112 numéro d\'urgence européen.',
      image: 'Quatre aimants sur la porte du frigo : une ambulance « 15 », un képi de policier « 17 », un casque de pompier « 18 » et un drapeau européen étoilé « 112 ».',
      page: 69,
    },
    {
      id: 'p5-horloge',
      pièce: 'cuisine',
      emoji: '🕰️',
      objet: 'L\'horloge de la cuisine',
      fait: 'Le code du travail fixe la durée légale du travail à 35 heures par semaine ; le SMIC est le salaire horaire minimum garanti.',
      image: 'L\'horloge n\'a que 35 heures sur son cadran pour toute la semaine. À chaque heure qui sonne, elle crache une pièce gravée « SMIC ».',
      page: 70,
    },
    {
      id: 'p5-minuteur',
      pièce: 'cuisine',
      emoji: '⏲️',
      objet: 'Le minuteur de cuisine',
      fait: 'Depuis le 1er juillet 2021, le congé paternité dure 28 jours.',
      image: 'Papa règle le minuteur non pas sur 28 minutes mais sur 28 jours : tant qu\'il ne sonne pas, il reste à la maison avec le biberon à la main.',
      page: 73,
    },
    {
      id: 'p5-gateau',
      pièce: 'cuisine',
      emoji: '🎂',
      objet: 'La pièce montée sur la table',
      fait: 'Seul le mariage civil, célébré à la mairie par le maire ou un adjoint, est reconnu par la loi ; il est possible à partir de 18 ans.',
      image: 'Au sommet de la pièce montée trône une mini-mairie, avec le maire en écharpe tricolore ; 18 bougies brûlent autour des deux mariés.',
      page: 73,
    },
    {
      id: 'p5-cartable',
      pièce: 'cuisine',
      emoji: '🎒',
      objet: 'Le cartable posé sur une chaise',
      fait: 'L\'instruction est obligatoire de 3 à 16 ans ; les mairies gèrent les inscriptions à l\'école publique.',
      image: 'Le cartable a deux fermetures, l\'une en forme de « 3 », l\'autre en forme de « 16 », et un gros tampon « mairie » sur le rabat.',
      page: 75,
    },
    {
      id: 'p5-tablette',
      pièce: 'cuisine',
      emoji: '📱',
      objet: 'La tablette des recettes',
      fait: 'La loi du 7 juillet 2023 a instauré la majorité numérique à 15 ans : avant cet âge, on ne peut plus s\'inscrire seul sur les réseaux sociaux.',
      image: 'La tablette refuse d\'ouvrir les réseaux sociaux tant que l\'enfant n\'a pas soufflé les 15 bougies de son gâteau d\'anniversaire.',
      page: 76,
    },
  ],

  frise: [
    { année: 1945, date: '1945', titre: 'Création de la Sécurité sociale', détail: 'À la Libération, la volonté de solidarité nationale conduit à créer la Sécurité sociale.', emoji: '🏥', période: 'Santé', page: 68 },
    { année: 1989, date: '6 juillet 1989', titre: 'Loi n°89-462 du 6 juillet 1989', détail: 'Citée pour les droits du locataire : son article 7 impose de demander la permission au propriétaire pour les travaux autres que décoratifs.', emoji: '🔑', période: 'Logement', page: 62 },
    { année: 1989, date: '1989', titre: 'Convention internationale des droits de l\'enfant', détail: 'Signée par 196 États dans le cadre de l\'ONU, elle présente les droits fondamentaux des enfants et fonde l\'action de l\'UNICEF.', emoji: '🧒', période: 'Famille', page: 74 },
    { année: 1991, date: '10 janvier 1991', titre: 'Loi Évin', détail: 'Elle encadre la consommation de tabac dans l\'espace public et a été complétée au fil du temps ; son non-respect est puni d\'une amende de 135 euros.', emoji: '🚭', période: 'Vie quotidienne', page: 65 },
    { année: 2013, date: '17 mai 2013', titre: 'Mariage ouvert aux couples de même sexe', détail: 'La loi est promulguée : la France devient le 14e pays du monde à autoriser le mariage homosexuel.', emoji: '💍', période: 'Famille', page: 73 },
    { année: 2017, date: 'janvier 2017', titre: 'Fin des sacs plastiques à usage unique', détail: 'Les sacs plastiques à usage unique et non recyclables sont interdits en France.', emoji: '🛍️', période: 'Environnement', page: 66 },
    { année: 2021, date: '1er juillet 2021', titre: 'Congé paternité de 28 jours', détail: 'Depuis cette date, le congé paternité dure 28 jours.', emoji: '👨‍🍼', période: 'Famille', page: 73 },
    { année: 2023, date: '7 juillet 2023', titre: 'Majorité numérique à 15 ans', détail: 'Pour lutter contre les délits en ligne comme le cyber-harcèlement, on ne peut plus s\'inscrire seul sur les réseaux sociaux avant 15 ans.', emoji: '📱', période: 'Famille', page: 76 },
    { année: 2024, date: '2024', titre: 'Tri obligatoire des déchets verts et alimentaires', détail: 'Le tri des déchets verts et alimentaires, destinés au compostage, devient obligatoire pour les particuliers et les professionnels.', emoji: '🥕', période: 'Environnement', page: 66 },
    { année: 2025, date: '1er juillet 2025', titre: 'Nouveaux lieux interdits au tabac', détail: 'Interdiction de fumer dans les parcs et jardins publics, sur les plages, aux abribus, aux abords des écoles et des équipements sportifs, pendant leurs heures d\'ouverture.', emoji: '🌳', période: 'Vie quotidienne', page: 65 },
    { année: 2026, date: '1er janvier 2026', titre: 'Congé supplémentaire de naissance', détail: 'Pour un enfant né ou adopté à partir de cette date : un ou deux mois au choix du parent, à prendre à partir de juillet 2026.', emoji: '👶', période: 'Famille', page: 73 },
  ],

  situations: [
    {
      id: 'p5-s1',
      thème: 'Logement',
      emoji: '🏠',
      contexte: 'Amina vient de louer un appartement. Elle veut repeindre le salon et abattre la cloison entre la cuisine et le séjour.',
      question: 'Que doit-elle faire ?',
      choix: [
        { texte: 'Elle peut peindre librement, mais doit demander la permission au propriétaire pour abattre la cloison.', bon: true, explication: 'Le locataire peut faire des travaux décoratifs comme peindre ; pour les autres travaux, il faut la permission du propriétaire (article 7 de la loi du 6 juillet 1989).' },
        { texte: 'Elle paie un loyer, elle peut donc faire tous les travaux qu\'elle veut.', bon: false, explication: 'Non : payer le loyer et les charges est une obligation, pas une autorisation. Seuls les travaux décoratifs sont libres.' },
        { texte: 'Elle ne peut rien changer, pas même la couleur des murs.', bon: false, explication: 'Non : peindre les murs fait partie des travaux décoratifs que le locataire peut faire.' },
      ],
      page: 62,
    },
    {
      id: 'p5-s2',
      thème: 'Santé',
      emoji: '🩺',
      contexte: 'Mamadou réside en France. Après une consultation chez le médecin, il se demande qui rembourse ses frais et comment payer la part qui n\'est pas prise en charge.',
      question: 'Que doit-il savoir ?',
      choix: [
        { texte: 'La CPAM rembourse les frais de santé, et une mutuelle complémentaire peut l\'aider à payer le reste.', bon: true, explication: 'Le remboursement est effectué par la Caisse primaire d\'assurance maladie ; une mutuelle aide à payer les frais restants. Sa carte Vitale justifie ses droits.' },
        { texte: 'C\'est la mairie qui rembourse les consultations médicales.', bon: false, explication: 'Non : le remboursement des frais de santé est effectué par la CPAM.' },
        { texte: 'Rien n\'est remboursé : en France, chacun paie seul ses soins.', bon: false, explication: 'Non : la Sécurité sociale, fondée sur la solidarité, rembourse les soins. Tous les résidents doivent être inscrits à l\'Assurance Maladie.' },
      ],
      page: 68,
    },
    {
      id: 'p5-s3',
      thème: 'Travail et discrimination',
      emoji: '💼',
      contexte: 'Fatou passe un entretien d\'embauche dans une petite entreprise de 20 salariés. Le recruteur lui dit : « Je préfère un homme pour ce poste. Et quelle est votre religion ? »',
      question: 'Que dit la loi ?',
      choix: [
        { texte: 'C\'est interdit : au travail, aucune discrimination liée au genre ou à la religion n\'est permise.', bon: true, explication: 'Aucune discrimination ne peut avoir lieu (genre, religion, physique…). L\'employeur peut seulement demander les diplômes si le poste exige une qualification. En cas de litige, le conseil de prud\'hommes est compétent.' },
        { texte: 'C\'est permis, car l\'entreprise a moins de 50 salariés.', bon: false, explication: 'Non : le seuil de 50 salariés concerne le règlement intérieur, pas l\'interdiction des discriminations.' },
        { texte: 'C\'est permis s\'il lui demande aussi ses diplômes.', bon: false, explication: 'Demander les diplômes est possible si le poste exige une qualification, mais cela n\'autorise aucune discrimination.' },
      ],
      page: 70,
    },
    {
      id: 'p5-s4',
      thème: 'Droits des salariés',
      emoji: '🤰',
      contexte: 'Léa, salariée, annonce à son employeur qu\'elle est enceinte. Il lui répond qu\'il va la licencier pour cette raison.',
      question: 'A-t-il le droit ?',
      choix: [
        { texte: 'Non : la loi garantit à la femme de conserver son emploi pendant la grossesse et le congé maternité.', bon: true, explication: 'L\'employeur ne peut pas licencier la salariée pour ce motif. En cas de litige, le conseil de prud\'hommes est compétent.' },
        { texte: 'Oui, c\'est l\'employeur qui décide seul.', bon: false, explication: 'Non : la loi interdit de licencier une salariée pour ce motif.' },
        { texte: 'Oui, mais seulement pendant son congé maternité.', bon: false, explication: 'Non : la protection couvre la grossesse et aussi la période du congé maternité.' },
      ],
      page: 73,
    },
    {
      id: 'p5-s5',
      thème: 'Autorité parentale',
      emoji: '👨‍👩‍👧‍👦',
      contexte: 'Après leur divorce, Lucie dit à Malik : « Les enfants vivent avec moi, tu n\'as plus ton mot à dire sur leur éducation. » Aucun juge n\'a rien décidé à ce sujet.',
      question: 'Qui exerce l\'autorité parentale ?',
      choix: [
        { texte: 'Les deux parents, comme avant le divorce.', bon: true, explication: 'En cas de séparation, l\'autorité parentale continue d\'être exercée par les deux parents, sauf décision de justice contraire.' },
        { texte: 'Seulement Lucie, puisque les enfants vivent chez elle.', bon: false, explication: 'Non : sans décision de justice contraire, les deux parents gardent l\'autorité parentale.' },
        { texte: 'Seulement le père, en tant que « chef de famille ».', bon: false, explication: 'Non : l\'autorité parentale appartient aux parents, pas à un seul « chef de famille ».' },
      ],
      page: 73,
    },
    {
      id: 'p5-s6',
      thème: 'École',
      emoji: '🏫',
      contexte: 'Les parents de Noé, 10 ans, veulent le garder une semaine à la maison, en pleine période scolaire, pour qu\'il aide au marché familial.',
      question: 'Est-ce possible ?',
      choix: [
        { texte: 'Non : seules les absences pour raisons de santé ou familiales (mariage, enterrement…) sont acceptées.', bon: true, explication: 'L\'instruction est obligatoire de 3 à 16 ans. Les parents qui ne respectent pas cette obligation peuvent être sanctionnés par une amende, ainsi qu\'une peine de prison.' },
        { texte: 'Oui, l\'école n\'est obligatoire qu\'à partir de 12 ans.', bon: false, explication: 'Non : l\'instruction est obligatoire dès 3 ans et jusqu\'à 16 ans.' },
        { texte: 'Oui, il suffit de prévenir la mairie.', bon: false, explication: 'Non : la mairie gère les inscriptions à l\'école publique, et ce motif d\'absence n\'est pas accepté.' },
      ],
      page: 75,
    },
  ],
}
