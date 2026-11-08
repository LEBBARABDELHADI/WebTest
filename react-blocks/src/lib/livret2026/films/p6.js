// Mode film — page 6 : la devise, « A. Liberté », « B. Égalité » et les
// discriminations. Tout ce qui est dit vient de la page 6 du livret ; seuls
// les personnages, les décors et les situations sont inventés.
import { CASTING } from './casting'

export const FILM = {
  page: 6,
  épisode: 'Épisode 6',
  titre: 'Trois mots sur la façade',
  sousTitre: 'La devise : liberté et égalité',
  personnages: {
    ...CASTING,
    propriétaire: { nom: 'Le propriétaire', emoji: '🧔🏻', couleur: '#f97316', voix: { pitch: 0.7, rate: 1 } },
  },
  plans: [
    {
      type: 'titre', décor: 'rue-mairie', musique: 'mystère',
      narration: 'Un mercredi, devant la mairie. Yanis lève les yeux vers trois mots gravés sur la façade.',
    },
    {
      décor: 'rue-mairie', caméra: 'zoom', musique: 'joyeux',
      acteurs: [{ id: 'yanis', pos: 30, entrée: 'course', émotion: 'surprise' }, { id: 'lina', pos: 72, entrée: 'droite' }],
      répliques: [
        { qui: 'yanis', texte: 'Lina, c\'est quoi, ces trois mots sur la mairie ?' },
        { qui: 'lina', texte: 'C\'est la devise de la France : liberté, égalité, fraternité !', émotion: 'joie' },
        { qui: 'yanis', texte: 'Il y en a sur toutes les mairies ?', émotion: 'idée' },
        { qui: 'lina', texte: 'Elle est inscrite sur le fronton des bâtiments publics : les préfectures, les mairies…' },
      ],
    },
    {
      type: 'impact', texte: 'LIBERTÉ · ÉGALITÉ · FRATERNITÉ', sous: 'Les valeurs fondatrices de la République', effet: 'vitesse', musique: 'épique',
      narration: 'La devise consacre les valeurs fondatrices de la République française : des repères communs pour le vivre ensemble.',
    },
    {
      type: 'chapitre', numéro: 'Chapitre 1', titre: 'La liberté', musique: 'tendre',
      narration: 'Premier mot : la liberté.',
    },
    {
      type: 'manga', titre: 'Libres !', musique: 'joyeux',
      narration: 'Les femmes et les hommes sont libres dans leurs choix, leurs opinions et leur manière de penser, de s\'exprimer et de vivre.',
      cases: [
        { qui: 'lina', décor: '🎓', texte: 'Mes études, c\'est moi qui les choisis.', légende: 'Libre de ses choix' },
        { qui: 'diallo', décor: '📰', texte: 'Moi, je ne suis pas d\'accord avec cet article. J\'ai mon opinion !', légende: 'Libre de ses opinions' },
        { qui: 'samir', décor: '🎸', texte: 'Je chante ce que je pense !', légende: 'Libre de s\'exprimer' },
        { qui: 'odette', décor: '💃', texte: 'Et moi, je vis comme je l\'entends.', légende: 'Libre de sa manière de vivre' },
      ],
    },
    {
      décor: 'nuit-ville', caméra: 'tremble', effet: 'flash', musique: 'mystère', accessoires: [['🔊', 50, 58], ['🎶', 60, 36], ['🎶', 38, 30]],
      acteurs: [{ id: 'samir', pos: 26, entrée: 'fondu', émotion: 'joie' }, { id: 'odette', pos: 76, entrée: 'droite', émotion: 'colère' }],
      narration: 'Minuit. Samir veut continuer la fête…',
      répliques: [
        { qui: 'samir', texte: 'Je suis libre ! Je mets la musique à fond !' },
        { qui: 'odette', texte: 'Samir ! Il est minuit, toute la rue essaie de dormir !', émotion: 'colère' },
        { qui: 'samir', texte: 'Oups… Ma liberté gêne les autres.', émotion: 'gêne' },
      ],
    },
    {
      type: 'tableau', image: 'img-p06-ddhc.webp', musique: 'tendre',
      légende: 'La Déclaration des droits de l\'homme et du citoyen de 1789',
      narration: 'La liberté est une valeur fondamentale inscrite dans la Déclaration des droits de l\'homme et du citoyen de 1789.',
    },
    {
      type: 'citation', décor: 'parchemin',
      texte: '« La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui. »',
      source: 'Déclaration des droits de l\'homme et du citoyen de 1789, article 4',
      narration: 'Son article 4 le proclame.',
    },
    {
      décor: 'rue-mairie', caméra: 'travelling', musique: 'tendre',
      acteurs: [{ id: 'samir', pos: 26, entrée: 'fondu' }, { id: 'lina', pos: 72, entrée: 'fondu', émotion: 'idée' }],
      répliques: [
        { qui: 'lina', texte: 'C\'est-à-dire : on peut faire tout ce qui ne gêne pas les autres, et qui est défini par la loi.' },
        { qui: 'samir', texte: 'Et cette liberté, c\'est la même pour tout le monde ?' },
        { qui: 'lina', texte: 'Oui : les libertés sont les mêmes pour l\'ensemble des citoyens, dans le respect des lois.', émotion: 'joie' },
      ],
    },
    {
      type: 'chapitre', numéro: 'Chapitre 2', titre: 'L\'égalité', musique: 'mystère',
      narration: 'Deuxième mot : l\'égalité, un principe fondamental de la République, écrit dans l\'article 1er de la Constitution de 1958.',
    },
    {
      type: 'final', décor: 'ville-jour', musique: 'épique', texte: 'LES MÊMES DROITS',
      acteurs: [{ id: 'lina', pos: 12, entrée: 'saut' }, { id: 'samir', pos: 31, entrée: 'saut' }, { id: 'diallo', pos: 50, entrée: 'saut' }, { id: 'odette', pos: 69, entrée: 'saut' }, { id: 'yanis', pos: 88, entrée: 'saut' }],
      narration: 'Tous les citoyens ont les mêmes droits. C\'est l\'article 1er de la Déclaration des droits de l\'homme et du citoyen.',
      répliques: [
        { qui: 'lina', texte: 'Quel que soit notre sexe…' },
        { qui: 'diallo', texte: '… notre origine…' },
        { qui: 'samir', texte: '… notre religion…' },
        { qui: 'odette', texte: '… nos opinions ou notre orientation sexuelle…' },
        { qui: 'yanis', texte: '… on a tous les mêmes droits !', émotion: 'joie' },
      ],
    },
    {
      type: 'split', titre: 'L\'égalité entre les femmes et les hommes', musique: 'épique',
      gauche: { titre: 'DEPUIS 1946', chaîne: ['📜', '👩', '🤝', '👨'], texte: 'Elle est inscrite dans le préambule de la Constitution depuis 1946.' },
      droite: { titre: 'PARTOUT', chaîne: ['💼', '🏥', '🎓', '…'], texte: 'Elle s\'applique dans tous les domaines : travail, santé, éducation…' },
      narration: 'Et l\'égalité entre les femmes et les hommes ?',
    },
    {
      décor: 'agence', caméra: 'zoom', musique: 'mystère', accessoires: [['🔑', 50, 62]],
      acteurs: [{ id: 'diallo', pos: 24, entrée: 'gauche' }, { id: 'propriétaire', pos: 76, entrée: 'fondu' }],
      narration: 'Mme Diallo visite un appartement.',
      répliques: [
        { qui: 'diallo', texte: 'Bonjour, je viens pour l\'appartement. J\'ai mon dossier complet.', émotion: 'joie' },
        { qui: 'propriétaire', texte: 'Ah… Avec votre origine, ce sera non.' },
        { qui: 'diallo', texte: 'Pardon ?!', émotion: 'surprise' },
      ],
    },
    {
      décor: 'agence', caméra: 'travelling', effet: 'flash',
      acteurs: [{ id: 'diallo', pos: 18, entrée: 'fondu' }, { id: 'lina', pos: 44, entrée: 'course', émotion: 'colère' }, { id: 'propriétaire', pos: 80, entrée: 'fondu', émotion: 'gêne' }],
      répliques: [
        { qui: 'lina', texte: 'Monsieur, c\'est une discrimination ! Vous traitez Mme Diallo différemment d\'une autre personne, dans la même situation, à cause de son origine.' },
      ],
      narration: 'Une discrimination, c\'est traiter différemment une personne par rapport à une autre, dans une situation comparable — logement, travail, loisirs — en raison de son origine, de son sexe, de son orientation sexuelle, de son opinion politique, de son âge, de ses convictions religieuses, de son apparence physique…',
    },
    {
      type: 'impact', texte: 'PUNIES PAR LA LOI', sous: 'La France condamne les discriminations', effet: 'vitesse', musique: 'épique',
      narration: 'La France condamne les discriminations. Les discriminations sont punies par la loi.',
    },
    {
      type: 'final', décor: 'coucher-soleil', effet: 'étoiles', musique: 'tendre', texte: 'À SUIVRE : LA FRATERNITÉ',
      acteurs: [{ id: 'odette', pos: 16, entrée: 'fondu' }, { id: 'diallo', pos: 38, entrée: 'fondu' }, { id: 'lina', pos: 60, entrée: 'fondu' }, { id: 'yanis', pos: 84, entrée: 'saut', émotion: 'idée' }],
      répliques: [
        { qui: 'yanis', texte: 'Liberté, égalité… Et le troisième mot, fraternité ?' },
        { qui: 'lina', texte: 'Ça, c\'est pour le prochain épisode !', émotion: 'joie' },
      ],
    },
    {
      type: 'fin',
      retenir: [
        ['🏛️', 'La devise « liberté, égalité, fraternité » consacre les valeurs fondatrices de la République. Elle est inscrite sur le fronton des bâtiments publics (préfectures, mairies…).'],
        ['🕊️', 'Liberté : « la liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui » (article 4 de la DDHC de 1789). Les libertés sont les mêmes pour tous, dans le respect des lois.'],
        ['⚖️', 'Égalité : principe fondamental (article 1er de la Constitution de 1958). Mêmes droits quel que soit le sexe, l\'origine, la religion, les opinions ou l\'orientation sexuelle (article 1er de la DDHC).'],
        ['👩‍🤝‍👨', 'L\'égalité femmes-hommes est dans le préambule de la Constitution depuis 1946 : travail, santé, éducation…'],
        ['🚫', 'Une discrimination, c\'est traiter différemment une personne dans une situation comparable (logement, travail, loisirs…) à cause de son origine, son sexe, son âge, sa religion… Elle est punie par la loi.'],
      ],
    },
  ],
}
