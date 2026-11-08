// Mode film — page 8 : « D. Les symboles de la France » (fête nationale,
// hymne, langue, Marianne, drapeau, coq). Tout ce qui est dit vient de la
// page 8 du livret ; seuls les personnages, les décors et les situations sont
// inventés.
import { CASTING } from './casting.js'
import { VOIX_FILM8 } from './voixFilm8.js'

export const FILM = {
  page: 8,
  épisode: 'Épisode 8',
  titre: 'Le 14 juillet de Yanis',
  sousTitre: 'Les symboles de la France',
  voix: VOIX_FILM8,
  personnages: CASTING,
  plans: [
    {
      type: 'titre', décor: 'fete-jour', musique: 'joyeux',
      narration: 'Le 14 juillet au matin. Toute la ville s\'habille de bleu, de blanc et de rouge.',
    },
    {
      décor: 'fete-jour', caméra: 'zoom', musique: 'joyeux',
      acteurs: [{ id: 'yanis', pos: 28, entrée: 'course', émotion: 'surprise' }, { id: 'odette', pos: 72, entrée: 'droite' }],
      répliques: [
        { qui: 'yanis', texte: 'Mamie, pourquoi tout le monde fait la fête aujourd\'hui ?' },
        { qui: 'odette', texte: 'C\'est le 14 juillet, la fête nationale !', émotion: 'joie' },
        { qui: 'yanis', texte: 'Et pourquoi le 14 juillet ?', émotion: 'idée' },
        { qui: 'odette', texte: 'Pour deux événements de la Révolution. Écoute bien…', émotion: 'amour' },
      ],
    },
    {
      type: 'split', titre: 'Deux 14 juillet', musique: 'épique',
      gauche: { titre: '1789', chaîne: ['👥', '🏰', '💥'], texte: 'Le peuple de Paris prend la Bastille, une prison royale : c\'est le début de la Révolution française.' },
      droite: { titre: '1790', chaîne: ['🎉', '🤝', '🎆'], texte: 'Un an plus tard, on célèbre la Fête de la Fédération.' },
      narration: 'Paris, il y a plus de deux siècles.',
    },
    {
      type: 'impact', texte: 'DEPUIS 1880', sous: 'Le 14 juillet, fête nationale', effet: 'vitesse', musique: 'épique',
      narration: 'Depuis 1880, le 14 juillet est consacré comme jour de fête nationale, pour commémorer ces deux événements.',
    },
    {
      décor: 'fete-jour', caméra: 'travelling', musique: 'joyeux', accessoires: [['🎺', 46, 56], ['🥁', 56, 60], ['🎶', 50, 40]],
      acteurs: [{ id: 'yanis', pos: 22, entrée: 'saut' }, { id: 'samir', pos: 78, entrée: 'droite' }],
      répliques: [
        { pause: 8800, son: 'marseillaise', légende: '🎶 Devant la mairie, la fanfare joue La Marseillaise…' },
        { qui: 'yanis', texte: 'Je la connais ! On l\'étudie à l\'école primaire.', émotion: 'joie' },
        { qui: 'samir', texte: 'C\'est notre hymne national. Rouget de Lisle l\'a écrite en 1792.' },
      ],
    },
    {
      type: 'chapitre', numéro: 'Chapitre 2', titre: 'Les symboles', musique: 'tendre',
      narration: 'Les symboles de la France sont les suivants : la fête nationale, l\'hymne, la langue, Marianne, le drapeau et le coq.',
    },
    {
      type: 'manga', titre: 'Les symboles de la France', musique: 'joyeux',
      cases: [
        { qui: 'lina', décor: '🗣️', texte: 'La langue officielle de la République est le français.', légende: 'La langue officielle' },
        { qui: 'diallo', décor: '🏛️', texte: 'Marianne porte un bonnet phrygien, symbole de la liberté. Elle est devenue le symbole de la République.', légende: 'Marianne' },
        { qui: 'samir', décor: '🏳️', texte: 'Bleu, blanc, rouge : le drapeau tricolore a été créé pendant la Révolution.', légende: 'Le drapeau tricolore' },
        { qui: 'yanis', décor: '🐓', texte: 'Cocorico ! Le coq représente la fierté, le courage et la vigilance.', légende: 'Le coq' },
      ],
    },
    {
      décor: 'salle-mairie', caméra: 'zoom', musique: 'tendre',
      acteurs: [{ id: 'diallo', pos: 20, entrée: 'gauche' }, { id: 'yanis', pos: 80, entrée: 'droite', émotion: 'surprise' }],
      narration: 'Dans la salle de la mairie.',
      répliques: [
        { qui: 'yanis', texte: 'C\'est Marianne, là, avec son bonnet ?' },
        { qui: 'diallo', texte: 'Oui ! Sa statue est placée dans toutes les mairies. Elle rappelle la Révolution française.', émotion: 'joie' },
        { qui: 'diallo', texte: 'Et Marianne apparaît aussi sur les documents de l\'administration française.' },
      ],
    },
    {
      décor: 'fete-jour', caméra: 'travelling', musique: 'tendre',
      acteurs: [{ id: 'samir', pos: 26, entrée: 'fondu' }, { id: 'odette', pos: 74, entrée: 'fondu' }],
      répliques: [
        { qui: 'samir', texte: 'Et le drapeau tricolore, il est officiel depuis quand ?', émotion: 'idée' },
        { qui: 'odette', texte: 'Il est devenu le drapeau officiel de la France en 1794…' },
        { qui: 'odette', texte: '… sauf pendant la Restauration, de 1814 à 1830. On en reparlera en histoire !', émotion: 'joie' },
      ],
    },
    {
      type: 'impact', texte: 'LE COQ', sous: 'Un symbole national, sans statut officiel', effet: 'vitesse', musique: 'épique',
      narration: 'Bien qu\'il n\'ait pas de statut officiel selon la Constitution, le coq est utilisé depuis l\'Antiquité et il est largement reconnu comme un symbole national.',
    },
    {
      décor: 'chambre-matin', caméra: 'zoom', musique: 'tendre', accessoires: [['💻', 50, 62], ['📄', 66, 70]],
      acteurs: [{ id: 'lina', pos: 30, entrée: 'gauche' }, { id: 'samir', pos: 72, entrée: 'droite' }],
      répliques: [
        { qui: 'lina', texte: 'Regarde, sur le site de l\'administration : Marianne et le drapeau !', émotion: 'surprise' },
        { qui: 'samir', texte: 'On retrouve les symboles sur l\'ensemble des sites internet et des documents de l\'administration.' },
      ],
    },
    {
      type: 'final', décor: 'fete-nuit', effet: 'étoiles', musique: 'épique', texte: 'À SUIVRE : LA MARSEILLAISE',
      acteurs: [{ id: 'lina', pos: 12, entrée: 'fondu' }, { id: 'samir', pos: 31, entrée: 'fondu' }, { id: 'diallo', pos: 50, entrée: 'fondu' }, { id: 'odette', pos: 69, entrée: 'fondu' }, { id: 'yanis', pos: 88, entrée: 'saut', émotion: 'joie' }],
      répliques: [
        { pause: 3400, son: 'artifice', légende: '🎆 Le soir, le feu d\'artifice illumine la place.' },
        { qui: 'yanis', texte: 'La fête nationale, La Marseillaise, le français, Marianne, le drapeau, le coq !', émotion: 'joie' },
        { qui: 'odette', texte: 'Bravo, tu connais tous les symboles de la France !', émotion: 'amour' },
        { qui: 'lina', texte: 'Au prochain épisode : les paroles de La Marseillaise.' },
      ],
    },
    {
      type: 'fin',
      retenir: [
        ['🎆', 'Le 14 juillet 1789, le peuple de Paris a pris la Bastille (début de la Révolution française). Le 14 juillet 1790 : Fête de la Fédération. Depuis 1880, le 14 juillet est la fête nationale.'],
        ['🎶', 'La Marseillaise, l\'hymne national, a été écrite en 1792 par Rouget de Lisle. Elle est étudiée à l\'école primaire.'],
        ['🗣️', 'La langue officielle de la République est le français.'],
        ['🏛️', 'Marianne, au bonnet phrygien (symbole de la liberté), est le symbole de la République : sur les documents de l\'administration, sa statue dans toutes les mairies.'],
        ['🇫🇷', 'Le drapeau tricolore (bleu, blanc, rouge), créé pendant la Révolution, est officiel depuis 1794, sauf pendant la Restauration (1814-1830).'],
        ['🐓', 'Le coq : fierté, courage, vigilance. Pas de statut officiel selon la Constitution, mais un symbole national reconnu. On retrouve les symboles sur les sites et documents de l\'administration.'],
      ],
    },
  ],
}
