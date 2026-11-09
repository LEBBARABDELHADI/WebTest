// Expérience narrative cinématographique — PROTOTYPE, page 14 uniquement.
// « Au nom du peuple » : C. une République démocratique (souveraineté
// nationale, article 3 de la Constitution, élus, suffrage universel direct ou
// indirect, droit de vote) et D. une République sociale (principe d'égalité,
// égalité des chances, éducation, logement, emploi, santé).
//
// Règle de fidélité : les cartes « officiel » reprennent MOT POUR MOT le texte
// de la page 14 (les quatre domaines sont cités un par un, sans la ponctuation
// de la liste). Personnages, lieux et dialogues sont fictifs ; ils n'énoncent
// que ce que dit la page. Aucun parti, candidat ni scrutin réel n'est montré.
import { VOIX_P14 } from './voixP14.js'
import { PERSONNAGES as P8 } from './p8.js'

const p14 = 'Livret du citoyen, page 14'
const domaines = `${p14} (domaines d'intervention de l'État)`

export const PERSONNAGES = P8

export const COURT_MÉTRAGE = {
  page: 14,
  titre: 'Au nom du peuple',
  sousTitre: 'Une République démocratique et sociale',
  avertissement: 'Personnages et situations fictifs : aucun parti, candidat ni scrutin réel. Les cartes « 📜 Livret » reprennent le texte officiel, mot pour mot.',
  voix: VOIX_P14,
  affiche: 'ecole-vote',
  scènes: [
    {
      id: 'ouverture', titre: 'Ouverture', décor: 'ecole-vote', ambiance: 'rue', musique: 'chaleureux', transition: 'fondu', particules: 'feuilles',
      caméra: { de: { x: 3, z: 1.16 }, à: { x: -2, z: 1.02 } }, titreFilm: true,
      temps: [
        { qui: 'narrateur', texte: 'Un dimanche matin, jour d\'élection.' },
        { qui: 'narrateur', texte: 'Devant l\'école du quartier, une banderole annonce le bureau de vote.', son: 'carillon' },
        { qui: 'narrateur', texte: 'M. Arnaud vient voter. Sa petite-fille Zoé et Lina l\'accompagnent.', son: 'pas' },
      ],
    },
    {
      id: 'chapitre-c', titre: 'C. Une République démocratique', décor: 'carton', visuel: 'carton', carton: { lettre: 'C', titre: 'Une République démocratique', sous: 'Troisième pilier' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Troisième pilier : une République démocratique.', son: 'whoosh' }],
    },
    {
      id: 'democratie', titre: 'Le pouvoir au peuple', décor: 'ecole-vote', visuel: 'souverainete', ambiance: 'rue', musique: 'réflexion', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 25, regard: 'droite', échelle: 0.72 }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'zoe', texte: 'Papi, pourquoi tous ces gens viennent voter ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Parce que la France est une démocratie : la souveraineté nationale, c\'est-à-dire le pouvoir, appartient au peuple français.', émotion: 'sourire', geste: 'explique', étape: 1 },
        { officiel: { texte: 'La France est une démocratie, c\'est-à-dire que la souveraineté nationale (le pouvoir) appartient au peuple français :', source: p14 }, étape: 1 },
        { qui: 'zoe', texte: 'Le pouvoir appartient au peuple…', émotion: 'fier', étape: 2 },
      ],
    },
    {
      id: 'article3', titre: 'L\'article 3 de la Constitution', décor: 'bureau-vote', visuel: 'article-3', ambiance: 'salle', musique: 'réflexion', transition: 'fondu', lumière: 'rgba(255,236,200,.6)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Dans le bureau de vote, Lina ouvre son livret.', son: 'page' },
        { qui: 'lina', texte: 'Mon livret cite l\'article 3 de la Constitution de la Ve République, de 1958.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'Article 3 de la Constitution de la Vème République de 1958 : « La souveraineté nationale appartient au peuple qui l\'exerce par ses représentants et par la voie du référendum. »', source: p14 }, étape: 1 },
        { qui: 'arnaud', texte: 'Le peuple exerce donc ce pouvoir de deux façons : par ses représentants, et par la voie du référendum.', émotion: 'sourire', geste: 'explique', étape: 2 },
      ],
    },
    {
      id: 'elus', titre: 'Des dirigeants élus', décor: 'bureau-vote', visuel: 'elus', ambiance: 'salle', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,236,200,.6)',
      caméra: { de: { x: -2, z: 1.08 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 25, regard: 'droite', échelle: 0.72 }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'arnaud', texte: 'La République, c\'est un régime politique où les dirigeants sont élus, et gouvernent au nom du peuple.', émotion: 'neutre', étape: 1 },
        { officiel: { texte: 'La République est un régime politique dans lequel les dirigeants sont élus et gouvernent au nom du peuple.', source: p14 }, étape: 1 },
        { qui: 'zoe', texte: 'Même le Président ?', émotion: 'surprise', étape: 1 },
        { qui: 'arnaud', texte: 'Oui. Le Président de la République, les parlementaires, les maires, les représentants des régions, des départements et des communes.', émotion: 'sourire', geste: 'montre', étape: 2 },
        { qui: 'arnaud', texte: 'Tous sont élus au suffrage universel, direct ou indirect.', étape: 3, son: 'bloc' },
        { officiel: { texte: 'Ainsi, le Président de la République, les parlementaires, les maires, les représentants des régions, des départements et des communes, sont élus au suffrage universel direct ou indirect.', source: p14 }, étape: 3 },
      ],
    },
    {
      id: 'suffrage', titre: 'Direct ou indirect', décor: 'bureau-vote', visuel: 'direct-indirect', ambiance: 'salle', musique: 'réflexion', transition: 'flou', lumière: 'rgba(255,236,200,.6)',
      caméra: { de: { x: 2, z: 1.1 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 22, regard: 'droite' }, { id: 'arnaud', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Suffrage universel direct ou indirect : quelle est la différence ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Au suffrage direct, les citoyens votent directement pour élire leurs représentants.', émotion: 'neutre', geste: 'explique', étape: 1, son: 'bloc' },
        { qui: 'arnaud', texte: 'Au suffrage indirect, des personnes élues par les citoyens élisent, à leur tour, les représentants.', étape: 2, son: 'bloc' },
        { officiel: { texte: 'Le suffrage universel direct permet aux citoyens de voter directement pour élire leurs représentants, tandis que dans le cadre du suffrage universel indirect, des personnes élues par les citoyens, élisent à leur tour les représentants.', source: `${p14} (encadré)` }, étape: 2 },
      ],
    },
    {
      id: 'majorite', titre: 'Qui peut voter ?', décor: 'bureau-vote', visuel: 'majorite', ambiance: 'salle', musique: 'chaleureux', transition: 'fondu', lumière: 'rgba(255,236,200,.6)',
      caméra: { de: { x: 0, z: 1.1 }, à: { x: 0, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 25, regard: 'droite', échelle: 0.72 }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'M. Arnaud passe dans l\'isoloir, puis glisse son bulletin dans l\'urne.', son: 'bloc' },
        { qui: 'zoe', texte: 'Moi aussi, je veux voter !', émotion: 'joie' },
        { qui: 'arnaud', texte: 'Pas encore, ma puce : il faut avoir au moins 18 ans. C\'est l\'âge de la majorité civile.', émotion: 'tendre', étape: 1 },
        { qui: 'zoe', texte: 'Et les femmes aussi, elles votent ?', émotion: 'réflexion', étape: 1 },
        { qui: 'arnaud', texte: 'Bien sûr. Tous les citoyens, hommes et femmes, qui disposent de leurs droits civils et politiques.', émotion: 'sourire', étape: 2 },
        { qui: 'arnaud', texte: 'Ils ont le droit de voter, et de se présenter aux élections, dans les conditions fixées par la loi.', étape: 3 },
        { officiel: { texte: 'Cela signifie que tous les citoyens, hommes et femmes, ayant au moins 18 ans (majorité civile) et disposant de leurs droits civils et politiques, ont le droit de voter et de se présenter aux élections dans les conditions fixées par la loi.', source: p14 }, étape: 3 },
      ],
    },
    {
      id: 'chapitre-d', titre: 'D. Une République sociale', décor: 'carton', visuel: 'carton', carton: { lettre: 'D', titre: 'Une République sociale', sous: 'Quatrième pilier' }, ambiance: 'souffle', musique: 'élévation', transition: 'iris',
      caméra: { de: { x: 0, z: 1.08 }, à: { x: 0, z: 1.0 } },
      temps: [{ qui: 'narrateur', texte: 'Quatrième pilier : une République sociale.', son: 'whoosh' }],
    },
    {
      id: 'egalite', titre: 'Libres et égaux en droits', décor: 'parc', visuel: 'ddhc-1', ambiance: 'soir', musique: 'tendre', transition: 'lumiere', lumière: 'rgba(255,236,190,.65)',
      caméra: { de: { x: -2, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'En sortant, ils traversent le parc. Lina a encore une question.', son: 'pas' },
        { qui: 'lina', texte: 'Démocratique, j\'ai compris. Mais une République sociale, qu\'est-ce que ça veut dire ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Le caractère social de la République est une conséquence du principe d\'égalité.', émotion: 'neutre', étape: 1 },
        { officiel: { texte: 'Le caractère social de la République est une conséquence du principe d\'égalité :', source: p14 }, étape: 1 },
        { qui: 'arnaud', texte: 'Souviens-toi de l\'article premier de la Déclaration de 1789 : « Les hommes naissent et demeurent libres et égaux en droits ».', émotion: 'sourire', étape: 2, son: 'plume' },
        { officiel: { texte: '« Les hommes naissent et demeurent libres et égaux en droits » affirme la Déclaration des droits de l\'homme et du citoyen de 1789 (article 1er).', source: p14 }, étape: 2 },
      ],
    },
    {
      id: 'egalite-reelle', titre: 'Une égalité réelle', décor: 'parc', visuel: 'egalite-reelle', ambiance: 'soir', musique: 'élévation', transition: 'fondu', lumière: 'rgba(255,236,190,.65)',
      caméra: { de: { x: 2, z: 1.08 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 22, regard: 'droite' }, { id: 'lina', x: 78, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Égaux en droits… Mais comment cette égalité devient-elle réelle ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'Pour que cette égalité de droits soit réelle, l\'État favorise l\'égalité des chances.', émotion: 'sourire', geste: 'explique', étape: 1 },
        { qui: 'arnaud', texte: 'Et il contribue à améliorer la condition des plus démunis ou fragiles.', émotion: 'tendre', étape: 2 },
        { officiel: { texte: 'Pour que cette égalité de droits soit réelle, l\'État favorise l\'égalité des chances et contribue à l\'amélioration de la condition des plus démunis ou fragiles, en intervenant notamment dans les domaines suivants :', source: p14 }, étape: 2 },
        { qui: 'arnaud', texte: 'Il intervient notamment dans quatre domaines. Venez, je vous les montre !', émotion: 'joie', étape: 3 },
      ],
    },
    {
      id: 'education', titre: '1. L\'éducation', décor: 'ecole-vote', visuel: 'domaine-education', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: -3, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 25, regard: 'droite', échelle: 0.72 }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'zoe', texte: 'Le premier, je le connais : c\'est mon école !', émotion: 'joie' },
        { qui: 'arnaud', texte: 'Oui : l\'éducation, avec l\'école gratuite.', émotion: 'sourire', geste: 'montre', étape: 1 },
        { officiel: { texte: 'l\'éducation (école gratuite)', source: domaines }, étape: 1 },
      ],
    },
    {
      id: 'logement', titre: '2. Le logement', décor: 'residence', visuel: 'domaine-logement', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(255,230,180,.65)',
      caméra: { de: { x: 3, z: 1.1 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'narrateur', texte: 'Un peu plus loin, une grande résidence.', son: 'pas' },
        { qui: 'arnaud', texte: 'Deuxième domaine : le logement, avec la politique de logement social.', émotion: 'sourire', geste: 'montre', étape: 1 },
        { officiel: { texte: 'le logement (politique de logement social)', source: domaines }, étape: 1 },
      ],
    },
    {
      id: 'emploi', titre: '3. L\'emploi', décor: 'emploi', visuel: 'domaine-emploi', ambiance: 'rue', musique: 'réflexion', transition: 'volet', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: -3, z: 1.1 }, à: { x: 2, z: 1.0 } },
      personnages: [{ id: 'lina', x: 24, regard: 'droite' }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'lina', texte: 'Et le travail ?', émotion: 'réflexion' },
        { qui: 'arnaud', texte: 'C\'est le troisième domaine : l\'emploi, avec le revenu de solidarité active et l\'aide au retour à l\'emploi.', émotion: 'neutre', geste: 'explique', étape: 1 },
        { officiel: { texte: 'l\'emploi (revenu de solidarité active et aide au retour à l\'emploi)', source: domaines }, étape: 1 },
      ],
    },
    {
      id: 'sante', titre: '4. La santé', décor: 'sante', visuel: 'domaine-sante', ambiance: 'rue', musique: 'chaleureux', transition: 'volet', lumière: 'rgba(230,240,255,.6)',
      caméra: { de: { x: 3, z: 1.1 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'zoe', x: 25, regard: 'droite', échelle: 0.72 }, { id: 'arnaud', x: 76, regard: 'gauche' }],
      temps: [
        { qui: 'zoe', texte: 'Et là, c\'est le centre de santé !', émotion: 'surprise' },
        { qui: 'arnaud', texte: 'Quatrième domaine : la santé, avec la Sécurité sociale.', émotion: 'sourire', étape: 1 },
        { officiel: { texte: 'la santé (Sécurité sociale)', source: domaines }, étape: 1 },
        { qui: 'zoe', texte: 'L\'école, le logement, l\'emploi, la santé : quatre domaines !', émotion: 'fier', étape: 2 },
      ],
    },
    {
      id: 'final', titre: 'Final', décor: 'place-mairie-soir', visuel: 'recap-14', ambiance: 'soir', musique: 'final', transition: 'fondu', particules: 'poussiere', lumière: 'rgba(255,200,150,.65)',
      caméra: { de: { x: 2, z: 1.12 }, à: { x: -2, z: 1.0 } },
      personnages: [{ id: 'arnaud', x: 16, regard: 'droite', échelle: 0.8 }, { id: 'zoe', x: 46, regard: 'droite', échelle: 0.66 }, { id: 'lina', x: 80, regard: 'gauche', échelle: 0.86 }],
      temps: [
        { qui: 'lina', texte: 'Une République démocratique : la souveraineté appartient au peuple, qui l\'exerce par ses représentants et par le référendum.', émotion: 'joie', étape: 1 },
        { qui: 'zoe', texte: 'Et sociale : l\'école, le logement, l\'emploi et la santé !', émotion: 'fier', étape: 1 },
        { qui: 'arnaud', texte: 'Bravo. Et quand tu auras 18 ans, Zoé, tu pourras voter à ton tour.', émotion: 'fier', étape: 1, son: 'carillon' },
        { qui: 'narrateur', texte: 'À suivre : le système institutionnel et politique, page 15.', étape: 1 },
      ],
    },
  ],
  quiz: [
    { q: 'Que signifie « la France est une démocratie » ?', r: 'La souveraineté nationale, c\'est-à-dire le pouvoir, appartient au peuple français', f: ['Le pouvoir appartient au Président de la République', 'Le pouvoir appartient aux maires'], scène: 'democratie' },
    { q: 'Selon l\'article 3 de la Constitution, comment le peuple exerce-t-il la souveraineté nationale ?', r: 'Par ses représentants et par la voie du référendum', f: ['Uniquement par la voie du référendum', 'Uniquement par les maires'], scène: 'article3' },
    { q: 'L\'article 3 cité par le livret appartient à…', r: 'la Constitution de la Ve République de 1958', f: ['la Déclaration des droits de l\'homme et du citoyen de 1789', 'la loi de 1905'], scène: 'article3' },
    { q: 'Qu\'est-ce que la République, selon le livret ?', r: 'Un régime politique dans lequel les dirigeants sont élus et gouvernent au nom du peuple', f: ['Un régime dans lequel les dirigeants sont nommés à vie', 'Un régime dans lequel les dirigeants gouvernent en leur propre nom'], scène: 'elus' },
    { q: 'Qui est élu au suffrage universel direct ou indirect ?', r: 'Le Président de la République, les parlementaires, les maires, les représentants des régions, des départements et des communes', f: ['Seulement le Président de la République', 'Seulement les maires'], scène: 'elus', o: 1 },
    { q: 'Le suffrage universel direct, c\'est quand…', r: 'les citoyens votent directement pour élire leurs représentants', f: ['des élus choisissent les représentants à la place des citoyens', 'les représentants se désignent entre eux'], scène: 'suffrage' },
    { q: 'Le suffrage universel indirect, c\'est quand…', r: 'des personnes élues par les citoyens élisent à leur tour les représentants', f: ['les citoyens votent directement pour leurs représentants', 'le Président désigne les représentants'], scène: 'suffrage' },
    { q: 'Qui a le droit de voter et de se présenter aux élections ?', r: 'Les citoyens, hommes et femmes, d\'au moins 18 ans (majorité civile), disposant de leurs droits civils et politiques', f: ['Seulement les hommes de plus de 21 ans', 'Tous les habitants, dès 16 ans'], scène: 'majorite' },
    { q: 'Le caractère social de la République est une conséquence…', r: 'du principe d\'égalité', f: ['du principe de laïcité', 'du suffrage universel'], scène: 'egalite' },
    { q: 'Que dit l\'article 1er de la Déclaration des droits de l\'homme et du citoyen de 1789 ?', r: '« Les hommes naissent et demeurent libres et égaux en droits »', f: ['« La souveraineté nationale appartient au peuple »', '« La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui »'], scène: 'egalite', o: 1 },
    { q: 'Pour que l\'égalité de droits soit réelle, l\'État…', r: 'favorise l\'égalité des chances et contribue à améliorer la condition des plus démunis ou fragiles', f: ['laisse chacun se débrouiller seul', 'réserve les droits à ceux qui votent'], scène: 'egalite-reelle' },
    { q: 'Quels domaines le livret cite-t-il pour la République sociale ?', r: 'L\'éducation, le logement, l\'emploi et la santé', f: ['Le vote, le référendum et les élections', 'La laïcité, l\'indivisibilité et la démocratie'], scène: 'egalite-reelle' },
    { q: 'Pour la santé, le livret cite…', r: 'la Sécurité sociale', f: ['l\'école gratuite', 'le revenu de solidarité active'], scène: 'sante' },
  ],
}

// Contrôle de fidélité : chaque notion de la page 14 et la scène qui la montre.
export const COUVERTURE = [
  ['La France est une démocratie : la souveraineté nationale (le pouvoir) appartient au peuple français', 'democratie'],
  ['Article 3 de la Constitution de 1958 : par ses représentants et par la voie du référendum', 'article3'],
  ['La République : des dirigeants élus, qui gouvernent au nom du peuple', 'elus'],
  ['Président, parlementaires, maires, représentants des régions, départements et communes : suffrage universel direct ou indirect', 'elus'],
  ['Encadré : le suffrage universel direct et le suffrage universel indirect', 'suffrage'],
  ['Citoyens, hommes et femmes, 18 ans (majorité civile), droits civils et politiques : voter et se présenter aux élections', 'majorite'],
  ['Le caractère social, conséquence du principe d\'égalité ; DDHC de 1789, article 1er', 'egalite'],
  ['Égalité réelle : égalité des chances et condition des plus démunis ou fragiles', 'egalite-reelle'],
  ['L\'éducation (école gratuite)', 'education'],
  ['Le logement (politique de logement social)', 'logement'],
  ['L\'emploi (revenu de solidarité active et aide au retour à l\'emploi)', 'emploi'],
  ['La santé (Sécurité sociale)', 'sante'],
]
