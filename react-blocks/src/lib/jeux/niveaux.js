// Niveaux construits par code (coordonnées lisibles). 1 caractère = 1 tuile de 32 px.
// '#' sol · 'B' brique · '?' bloc pièce · 'M' bloc champignon · 'U' bloc vide · '=' plateforme · 'P' tuyau
// 'C' pièce · 'K' point de passage · 'F' drapeau · '.' vide
export const TUILE = 32
export const HAUTEUR = 11

function monde(largeur, trous) {
  const g = Array.from({ length: HAUTEUR }, () => Array(largeur).fill('.'))
  for (let c = 0; c < largeur; c++) {
    if (trous.some(([a, b]) => c >= a && c <= b)) continue
    g[9][c] = '#'; g[10][c] = '#'
  }
  const ligne = (r, a, b, ch) => { for (let c = a; c <= b; c++) g[r][c] = ch }
  const colonne = (c, a, b, ch) => { for (let r = a; r <= b; r++) g[r][c] = ch }
  const tuyau = c => { colonne(c, 7, 8, 'P'); colonne(c + 1, 7, 8, 'P') }
  const escalier = (c, n, montant = true) => { for (let k = 0; k < n; k++) { const col = montant ? c + k : c + n - 1 - k; for (let r = 8 - k; r < 9; r++) g[r][col] = '#' } }
  const pièces = lst => { for (const [c, r] of lst) g[r][c] = 'C' }
  const arcs = () => { for (const [a, b] of trous) for (let c = a; c <= b; c++) g[5][c] = 'C' }
  const fin = (c, escCol, escN) => { if (escN) escalier(escCol, escN); colonne(c, 3, 8, 'F') }
  const ennemis = lst => lst.map(([c, type = 'goomba']) => ({ x: c * TUILE, y: 9 * TUILE - 26, w: 26, h: 26, dir: -1, vivant: true, écrasé: 0, type }))
  return { g, ligne, colonne, tuyau, escalier, pièces, arcs, fin, ennemis }
}

function niveau1() {
  const m = monde(130, [[38, 40], [70, 73], [95, 97]])
  const { g } = m
  m.ligne(6, 14, 18, 'B'); g[6][16] = 'M'; g[6][15] = '?'
  g[6][30] = '?'; g[6][32] = '?'
  m.ligne(6, 44, 48, '='); m.ligne(4, 52, 55, '=')
  m.ligne(6, 60, 62, 'B'); g[6][61] = '?'
  m.ligne(5, 76, 80, '='); m.ligne(6, 99, 103, 'B'); g[6][101] = 'M'
  m.tuyau(26); m.tuyau(84)
  m.colonne(66, 7, 8, 'K')
  m.pièces([[20, 8], [21, 8], [22, 8], [15, 4], [16, 4], [17, 4], [45, 4], [46, 4], [47, 4], [53, 2], [54, 2], [67, 8], [68, 8], [77, 3], [78, 3], [79, 3], [88, 7], [89, 7], [90, 7], [104, 4], [105, 4], [120, 8], [121, 8]])
  m.fin(124, 110, 8)
  return { grille: g, ennemis: m.ennemis([[22], [34], [58], [64], [82], [89], [106]]), départ: { x: 2 * TUILE, y: 9 * TUILE - 30 } }
}

function niveau2() {
  const trous = [[20, 22], [36, 39], [56, 58], [78, 81], [104, 106], [122, 125]]
  const m = monde(150, trous)
  const { g } = m
  m.ligne(6, 12, 17, 'B'); g[6][14] = 'M'; g[6][16] = '?'
  m.ligne(7, 37, 38, '=')
  m.ligne(5, 44, 48, 'B'); g[5][46] = '?'
  m.ligne(6, 64, 66, '='); m.ligne(4, 68, 70, '=')
  m.ligne(6, 86, 90, 'B'); g[6][88] = 'M'
  m.ligne(6, 111, 115, '='); g[6][113] = '?'
  m.tuyau(93)
  m.colonne(75, 7, 8, 'K')
  m.arcs()
  m.pièces([[13, 4], [14, 4], [15, 4], [45, 3], [46, 3], [47, 3], [65, 4], [69, 2], [87, 4], [88, 4], [89, 4], [112, 4], [113, 4], [114, 4], [130, 8], [131, 8], [132, 8]])
  m.fin(148, 136, 8)
  return { grille: g, ennemis: m.ennemis([[29], [45, 'pic'], [52], [66, 'pic'], [71], [89], [97, 'pic'], [114, 'pic'], [132]]), départ: { x: 2 * TUILE, y: 9 * TUILE - 30 } }
}

function niveau3() {
  const trous = [[16, 19], [30, 33], [44, 47], [60, 63], [76, 79], [92, 95], [108, 111], [124, 127], [140, 143]]
  const m = monde(170, trous)
  const { g } = m
  m.ligne(6, 8, 12, 'B'); g[6][10] = 'M'
  for (const [a, b] of trous) m.ligne(7, a + 1, b - 1, '=')
  m.ligne(5, 52, 56, 'B'); g[5][54] = '?'
  m.ligne(6, 84, 88, 'B'); g[6][86] = 'M'
  m.ligne(6, 116, 120, 'B'); g[6][118] = '?'
  m.tuyau(71)
  m.colonne(86, 7, 8, 'K')
  m.arcs()
  m.pièces([[9, 4], [10, 4], [11, 4], [53, 3], [54, 3], [55, 3], [85, 4], [86, 4], [87, 4], [117, 4], [118, 4], [119, 4], [132, 8], [133, 8], [134, 8], [148, 8], [149, 8]])
  m.fin(166, 152, 8)
  return { grille: g, ennemis: m.ennemis([[26], [38, 'pic'], [53], [66, 'pic'], [84], [101, 'pic'], [116], [133, 'pic'], [147, 'pic']]), départ: { x: 2 * TUILE, y: 9 * TUILE - 30 } }
}

export const NIVEAUX = [
  { nom: 'Prairie', par: 75, thème: { ciel: ['#4aa8ff', '#bfe6ff'], nuage: 'rgba(255,255,255,.85)', colline: '#7fcf8a', terre: '#9a5b2e', herbe: ['#3fae45', '#5fd063'], nuit: false }, créer: niveau1 },
  { nom: 'Crépuscule', par: 90, thème: { ciel: ['#6a4fb3', '#ffb37a'], nuage: 'rgba(255,214,190,.75)', colline: '#5a6fb0', terre: '#6e4a63', herbe: ['#4f8f6a', '#76b88a'], nuit: false }, créer: niveau2 },
  { nom: 'Nuit étoilée', par: 110, thème: { ciel: ['#0b1030', '#2c3a78'], nuage: 'rgba(160,180,255,.28)', colline: '#222d63', terre: '#3a3560', herbe: ['#2f7a6b', '#47a08c'], nuit: true }, créer: niveau3 },
]
export const COMPTE_NIVEAUX = NIVEAUX.length
export const compterPièces = i => { let n = 0; for (const l of NIVEAUX[i].créer().grille) for (const t of l) if (t === 'C') n++; return n }
