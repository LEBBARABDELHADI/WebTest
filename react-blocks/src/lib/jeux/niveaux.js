// Niveaux construits par code (coordonnées en tuiles de 16 px). Hauteur : 12 tuiles, sol aux lignes 10-11.
// '#' sol · 'B' brique · '?' bloc pièce · 'M' bloc champignon · 'U' bloc vide · '=' pierre · 'P' tuyau
// 'H' bloc caché (pièce, secret) · 'V' bloc caché (1-UP, secret) · 'C' pièce · 'K' point de passage · 'F' mât d'arrivée
import { TUILE, HAUTEUR } from './config.js'
export { TUILE, HAUTEUR }

function monde(largeur, trous = []) {
  const g = Array.from({ length: HAUTEUR }, () => Array(largeur).fill('.'))
  for (let c = 0; c < largeur; c++) { if (trous.some(([a, b]) => c >= a && c <= b)) continue; g[10][c] = '#'; g[11][c] = '#' }
  const ennemis = [], plateformes = []
  const api = {
    g, ennemis, plateformes,
    ligne: (r, a, b, ch) => { for (let c = a; c <= b; c++) g[r][c] = ch },
    colonne: (c, a, b, ch) => { for (let r = a; r <= b; r++) g[r][c] = ch },
    bloc: (c, r, ch) => { g[r][c] = ch },
    tuyau: (c, h = 2) => { for (let r = 10 - h; r <= 9; r++) { g[r][c] = 'P'; g[r][c + 1] = 'P' } },
    plateau: (a, b, h) => { for (let c = a; c <= b; c++) for (let r = 10 - h; r <= 9; r++) g[r][c] = '#' },
    montée: (c, n) => { for (let k = 0; k < n; k++) for (let r = 9 - k; r <= 9; r++) g[r][c + k] = '#' },
    descente: (c, n) => { for (let k = 0; k < n; k++) for (let r = 9 - k; r <= 9; r++) g[r][c + n - 1 - k] = '#' },
    pièces: lst => { for (const [c, r] of lst) g[r][c] = 'C' },
    arc: (a, b, r) => { for (let c = a; c <= b; c++) g[r][c] = 'C' },
    mat: (c, haut, bas = 9) => { for (let r = haut; r <= bas; r++) g[r][c] = 'F' },
    E: (type, c, r = 10, extra = {}) => ennemis.push({ type, c, r, ...extra }),
    PM: (c, r, axe, amp, vit = 0.025, phase = 0) => plateformes.push({ x: c * TUILE, y: r * TUILE, axe, amp, vit, phase }),
  }
  return api
}

function niveau1() {
  const m = monde(200, [[46, 48], [105, 108], [124, 126], [154, 156]])
  // 1. Apprendre : marcher, ramasser, sauter
  m.arc(8, 10, 9)
  m.ligne(6, 16, 18, 'B'); m.bloc(17, 6, '?')
  m.bloc(28, 6, '?')
  m.E('mousse', 24)
  // 2. Premier obstacle et premier trou
  m.tuyau(34); m.E('mousse', 40)
  m.arc(46, 48, 7)
  // 3. Champignon, ennemis, plateforme basse, point de passage
  m.ligne(6, 55, 57, 'B'); m.bloc(56, 6, 'M')
  m.E('mousse', 62); m.E('mousse', 68)
  m.arc(63, 66, 7)
  m.bloc(72, 9, 'K')
  // 4. Terrasse avec ennemi à piques et secret
  m.montée(80, 2); m.plateau(82, 93, 3); m.descente(94, 2)
  m.E('pic', 88, 7)
  m.arc(86, 90, 5); m.bloc(88, 4, 'H')
  // 5. Trou avec pierre-relais, tuyau, trou
  m.ligne(9, 106, 107, '=')
  m.E('mousse', 112); m.tuyau(116); m.E('mousse', 120)
  m.arc(124, 126, 7)
  // 6. Chemin du haut (pièces + 1-UP caché) ou chemin du bas (ennemis)
  m.ligne(6, 132, 136, 'B'); m.bloc(134, 6, '?')
  m.bloc(137, 9, '='); m.ligne(7, 139, 142, '='); m.ligne(5, 144, 147, '='); m.ligne(3, 149, 152, '=')
  m.arc(139, 142, 6); m.arc(144, 147, 4); m.arc(149, 152, 2); m.bloc(150, 1, 'V')
  m.bloc(145, 9, 'K')
  m.E('mousse', 130); m.E('mousse', 142); m.E('mousse', 147)
  m.arc(154, 156, 7)
  // 7. Dernier escalier et arrivée
  m.E('mousse', 162); m.E('pic', 166)
  m.montée(170, 6); m.plateau(176, 177, 6); m.descente(178, 6)
  m.arc(171, 176, 3)
  m.E('mousse', 187)
  m.mat(194, 3)
  return { grille: m.g, ennemis: m.ennemis, plateformes: m.plateformes, départ: { x: 3 * TUILE, y: 160 - 14 }, arrivée: 194 }
}

function niveau2() {
  const m = monde(250, [[26, 31], [52, 55], [94, 99], [120, 123], [150, 153], [178, 183], [208, 211]])
  m.ligne(6, 14, 16, 'B'); m.bloc(15, 6, 'M')
  m.E('mousse', 12); m.E('sauteur', 21)
  m.PM(28.5 - 1, 10, 'h', 24, 0.03)              // passerelle mobile au-dessus du premier grand trou
  m.arc(27, 31, 7)
  m.tuyau(38); m.E('mousse', 44); m.E('pic', 48)
  m.ligne(9, 53, 54, '='); m.arc(52, 55, 7)
  // chemin du haut sur pierres (course nécessaire) avec secret ; chemin du bas avec ennemis
  m.ligne(7, 62, 66, '='); m.ligne(7, 69, 74, '='); m.ligne(7, 77, 80, '=')
  m.arc(62, 66, 6); m.arc(69, 74, 6); m.arc(77, 80, 6); m.bloc(71, 4, 'H')
  m.E('mousse', 60); m.E('sauteur', 68); m.E('pic', 75); m.E('mousse', 82)
  m.ligne(6, 86, 88, 'B'); m.bloc(87, 6, '?')
  m.bloc(90, 9, 'K')
  // deuxième grand trou : deux passerelles
  m.PM(95, 10, 'h', 16, 0.03, 0); m.PM(98.5 - 1, 10, 'h', 12, 0.035, 2)
  m.arc(94, 99, 7)
  m.tuyau(104); m.E('sauteur', 108); m.E('pic', 112); m.ligne(6, 114, 116, 'B'); m.bloc(115, 6, 'M')
  m.arc(120, 123, 7)
  m.E('mousse', 126); m.E('pic', 130); m.tuyau(134); m.E('sauteur', 138); m.E('rampant', 142)
  m.arc(150, 153, 7)
  // tour : escalier, ennemis, secret en hauteur
  m.montée(156, 4); m.plateau(160, 168, 4); m.descente(169, 4)
  m.bloc(175, 9, 'K')
  m.E('rampant', 164, 6); m.E('mousse', 173)
  m.arc(161, 167, 4); m.bloc(165, 3, 'V')
  // grand trou à passerelle verticale et horizontale
  m.PM(179, 10, 'h', 28, 0.03); m.PM(182.5 - 1, 9, 'v', 16, 0.04, 1)
  m.arc(178, 183, 6)
  m.E('sauteur', 188); m.E('rampant', 194); m.E('pic', 198); m.E('mousse', 202)
  m.ligne(9, 209, 210, '='); m.arc(208, 211, 7)
  m.E('sauteur', 216); m.E('pic', 220)
  m.montée(226, 5); m.plateau(231, 232, 5); m.descente(233, 5)
  m.mat(244, 3)
  m.E('mousse', 240)
  return { grille: m.g, ennemis: m.ennemis, plateformes: m.plateformes, départ: { x: 3 * TUILE, y: 160 - 14 }, arrivée: 244 }
}

function niveau3() {
  const m = monde(300, [[18, 21], [34, 38], [60, 71], [110, 113], [120, 124], [132, 135], [180, 191], [214, 217]])
  m.ligne(6, 7, 9, 'B'); m.bloc(8, 6, 'M')
  m.arc(18, 21, 7); m.E('chauve', 26, 6, { amp: 32 })
  m.ligne(9, 36, 36, '='); m.arc(34, 38, 6)
  m.E('rampant', 44); m.E('pic', 49); m.tuyau(54); m.E('sauteur', 57)
  // longue traversée : trois passerelles (horizontale, verticale, horizontale)
  m.PM(61.5 - 1, 10, 'h', 12, 0.035); m.PM(65.5 - 1, 9, 'v', 20, 0.04, 1); m.PM(69, 10, 'h', 12, 0.035, 3)
  m.arc(61, 70, 6); m.bloc(66, 5, 'V')
  m.E('sauteur', 76); m.E('chauve', 80, 6, { amp: 40 }); m.E('rampant', 86); m.E('pic', 92)
  m.ligne(6, 94, 96, 'B'); m.bloc(95, 6, 'M')
  m.bloc(100, 9, 'K')
  m.E('sauteur', 104)
  m.ligne(9, 111, 112, '='); m.ligne(9, 121, 123, '=')
  m.arc(110, 113, 6); m.arc(120, 124, 6)
  m.E('pic', 116); m.E('rampant', 128); m.arc(132, 135, 6); m.ligne(9, 133, 134, '=')
  m.E('sauteur', 140); m.E('chauve', 144, 7, { amp: 40 })
  m.bloc(147, 9, 'K')
  // plateau à piques et bonus
  m.plateau(150, 170, 2)
  m.E('pic', 154, 8); m.E('pic', 160, 8); m.E('rampant', 165, 8)
  m.arc(152, 168, 7); m.ligne(5, 154, 158, '='); m.ligne(3, 162, 166, '=')
  m.arc(154, 158, 4); m.arc(162, 166, 2); m.bloc(156, 2, 'H')
  m.E('sauteur', 174); m.E('mousse', 177)
  // grand trou : plateformes plus rapides
  m.PM(181, 10, 'h', 28, 0.04); m.PM(185.5 - 1, 9, 'v', 20, 0.045, 2); m.PM(188.5 - 1, 10, 'h', 20, 0.04, 4)
  m.arc(180, 191, 6)
  m.bloc(193, 9, 'K'); m.E('chauve', 196, 6, { amp: 36 }); m.E('rampant', 200); m.E('pic', 205); m.E('sauteur', 209)
  m.ligne(9, 215, 216, '='); m.arc(214, 217, 6)
  m.E('rampant', 222); m.E('pic', 228); m.E('chauve', 232, 5, { amp: 44 }); m.E('sauteur', 238)
  // le final : grande ascension
  m.montée(250, 7); m.plateau(257, 280, 7); m.arc(252, 256, 3)
  m.E('chauve', 262, 2, { amp: 30 }); m.E('pic', 268, 3)
  m.mat(274, 0, 2)
  return { grille: m.g, ennemis: m.ennemis, plateformes: m.plateformes, départ: { x: 3 * TUILE, y: 160 - 14 }, arrivée: 274, arrivéeY: 3 * TUILE }
}

export const NIVEAUX = [
  { nom: 'Prairie', par: 110, thème: 0, créer: niveau1 },
  { nom: 'Crépuscule', par: 140, thème: 1, créer: niveau2 },
  { nom: 'Nuit étoilée', par: 170, thème: 2, créer: niveau3 },
]
export const COMPTE_NIVEAUX = NIVEAUX.length
