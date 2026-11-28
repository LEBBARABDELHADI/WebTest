// Niveau 1 : construit par code pour garder les coordonnées lisibles. 1 caractère = 1 tuile de 32 px.
// '#' sol · 'B' brique · '?' bloc surprise · 'U' bloc vide · '=' plateforme · 'C' pièce · 'F' drapeau · '.' vide
export const LARGEUR = 130
export const HAUTEUR = 11
export const TUILE = 32

export function créerNiveau() {
  const g = Array.from({ length: HAUTEUR }, () => Array(LARGEUR).fill('.'))
  const trous = [[38, 40], [70, 73], [95, 97]]
  for (let c = 0; c < LARGEUR; c++) {
    if (trous.some(([a, b]) => c >= a && c <= b)) continue
    g[9][c] = '#'; g[10][c] = '#'
  }
  const ligne = (r, a, b, ch) => { for (let c = a; c <= b; c++) g[r][c] = ch }
  ligne(6, 14, 18, 'B'); g[6][16] = '?'
  g[6][30] = '?'; g[6][32] = '?'
  ligne(6, 44, 48, '='); ligne(4, 52, 55, '=')
  ligne(6, 60, 62, 'B'); g[6][61] = '?'
  ligne(5, 76, 80, '=')
  ligne(6, 99, 103, 'B'); g[6][101] = '?'
  for (let k = 0; k < 8; k++) for (let r = 8 - k; r < 9; r++) g[r][110 + k] = '#'
  for (let r = 3; r <= 8; r++) g[r][124] = 'F'
  for (const [c, r] of [[20, 8], [21, 8], [22, 8], [15, 4], [16, 4], [17, 4], [45, 4], [46, 4], [47, 4], [53, 2], [54, 2],
    [66, 8], [67, 8], [77, 3], [78, 3], [79, 3], [88, 7], [89, 7], [90, 7], [104, 4], [105, 4], [120, 8], [121, 8]]) g[r][c] = 'C'
  const ennemis = [22, 34, 58, 64, 82, 88, 102].map(c => ({ x: c * TUILE, y: 9 * TUILE - 26, w: 26, h: 26, dir: -1, vivant: true, écrasé: 0 }))
  return { grille: g, ennemis, départ: { x: 2 * TUILE, y: 9 * TUILE - 30 } }
}
export const PIÈCES_TOTAL = (() => { let n = 0; for (const l of créerNiveau().grille) for (const t of l) if (t === 'C') n++; return n })()
