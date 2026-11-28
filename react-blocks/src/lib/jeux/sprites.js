// Atlas de sprites pixel-art ORIGINAUX de Super Plombier (style console portable).
// Chaque sprite est un tableau de chaînes : 1 caractère = 1 pixel, '.' = transparent. Les lettres sont résolues
// par une palette (locale au sprite, sinon celle du thème). Rendu : canvas hors-écran, lissage désactivé.
// Les grands décors (fonds, nuages, arbres, cabane) sont placés à la main avec des primitives entières
// (disques, triangles, rectangles) : aucune part d'aléatoire, aucun dégradé calculé.
export const TUILE = 16
const NOIR = '#1b1426'

// ---------------------------------------------------------------- palettes
const OBJ = { K: NOIR, 1: '#ffd23f', 2: '#c98a0e', 3: '#fff2a0', 4: '#6b3a0a', 5: '#f2a93b', 6: '#9c5a14', 7: '#ffe08a', 8: '#fff6d8', 9: '#e8ecf4', 0: '#ffffff' }
const HÉROS = { K: NOIR, O: '#e8742a', Y: '#ffb347', Q: '#a8481e', S: '#f3bb8c', T: '#c98558', W: '#f6f0dc', X: '#b9b09a', B: '#2f7fb8', L: '#6cb8e8', N: '#1d4f82', M: '#5a3320', F: '#6b3d22', E: '#ffffff' }

const THÈMES = [
  { // 0 Prairie : jour
    nom: 'Prairie',
    ciel: ['#6ec1f5', '#8fd2f8', '#b3e2fa', '#d7f2fc'], texte: '#ffffff', ombre: '#1d2b3a', hud: '#1d2b3a', iris: '#1d2b3a',
    p: { g: '#4cae4f', h: '#8fdc6a', j: '#2d7a3b', d: '#9a6a3a', e: '#c08a50', f: '#6b4524', r: '#c4623a', t: '#e88f5e', u: '#6e2e1c', p: '#9aa6b8', q: '#c6d0de', v: '#5e687f', x: '#2fa84f', y: '#7fe08a', z: '#17692e', w: '#ffffff', c: '#c9e6f5', i: '#1d2b3a',
      A: '#8ab4d8', C: '#6f9ac4', a: '#b4d4ec', D: '#5fae6a', G: '#3f8a52', H: '#8fd88a', I: '#3f9e48', J: '#79d06a', P: '#2a6f36', R: '#7a4a2a', U: '#ff8fb8', V: '#fff2a0', Z: '#f4f1d0' },
  },
  { // 1 Crépuscule
    nom: 'Crépuscule',
    ciel: ['#5b3f9c', '#9a5aa8', '#e2788f', '#ffb37a'], texte: '#fff4e0', ombre: '#2a1a3e', hud: '#2a1a3e', iris: '#2a1a3e',
    p: { g: '#4a9a7a', h: '#86d0a0', j: '#2c6a5a', d: '#7a4e6a', e: '#a06f8a', f: '#4e2e48', r: '#b25a5a', t: '#e08a7a', u: '#5a2a3a', p: '#8a86b8', q: '#b6b2e0', v: '#52507e', x: '#3a9a8a', y: '#8ae0c8', z: '#1d5a58', w: '#ffd9c0', c: '#e8a0a0', i: '#2a1a3e',
      A: '#7a5aa8', C: '#5e4290', a: '#a285cc', D: '#6a4a98', G: '#4a3478', H: '#9a78c8', I: '#6a4a88', J: '#9a72b8', P: '#3e2a58', R: '#4a2e46', U: '#ffb37a', V: '#ffe08a', Z: '#ffe8c0' },
  },
  { // 2 Nuit étoilée
    nom: 'Nuit étoilée',
    ciel: ['#0a0e2a', '#141c4a', '#222e6e', '#34479a'], texte: '#e8f4ff', ombre: '#080c20', hud: '#080c20', iris: '#080c20',
    p: { g: '#2f8a7e', h: '#54c0b0', j: '#1b5a58', d: '#3a3f78', e: '#5a62a0', f: '#222652', r: '#5a4a98', t: '#8a78d0', u: '#2a2058', p: '#5a7ab0', q: '#8ab0e0', v: '#32456e', x: '#2a8a9a', y: '#70d8e8', z: '#155468', w: '#4a60b0', c: '#344a98', i: '#080c20',
      A: '#202c6a', C: '#161e52', a: '#34479a', D: '#1a2860', G: '#121a48', H: '#2a3a82', I: '#17504a', J: '#2a8a78', P: '#0e3030', R: '#2a2038', U: '#7ae0ff', V: '#e0f8ff', Z: '#f0f4d0' },
  },
]
const palette = (th, locale) => ({ ...OBJ, ...THÈMES[th].p, ...(locale || {}) })

// ---------------------------------------------------------------- outils de dessin (entiers, déterministes)
const VIDE = '................'
const rep = (s, n) => Array(n).fill(s)
const décal = (rows, dx) => rows.map(r => (dx > 0 ? ('.'.repeat(dx) + r).slice(0, r.length) : r.slice(-dx) + '.'.repeat(-dx)))
const poser = (rows, pts) => { const g = rows.map(r => r.split('')); for (const [r, c, ch] of pts) if (g[r] && c >= 0 && c < g[r].length) g[r][c] = ch; return g.map(r => r.join('')) }
const coller = (rows, glyphe, x, y) => { const g = rows.map(r => r.split('')); glyphe.forEach((l, j) => [...l].forEach((ch, i) => { if (ch !== '.' && g[y + j] && g[y + j][x + i] !== undefined) g[y + j][x + i] = ch })); return g.map(r => r.join('')) }
const grille = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'))
const pt = (G, x, y, ch) => { if (y >= 0 && y < G.length && x >= 0 && x < G[0].length) G[y][x] = ch }
const rect = (G, x, y, w, h, ch) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pt(G, x + i, y + j, ch) }
const disque = (G, cx, cy, r, ch) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + r) pt(G, x, y, ch) }
const lignes = G => G.map(r => r.join(''))
const cadreBloc = (h, f, b, o) => [o.repeat(16), o + h.repeat(13) + b + o, ...rep(o + h + f.repeat(12) + b + o, 12), o + b.repeat(14) + o, o.repeat(16)]

// ---------------------------------------------------------------- registre
const STAT = {}
const PROC = {}
const def = (nom, frames, pal) => { STAT[nom] = { frames, pal } }

// ---------------------------------------------------------------- HÉROS (petit plombier-livreur, casquette orange)
const TÊTE = [
  '....KKKKKK......',
  '...KOYYOOOKK....',
  '..KOOOOOOOOOK...',
  '..KOOOOOOQQQQK..',
  '..KKSSSSSKKKKK..',
  '...KSSSSSSSSK...',
  '...KSSSSEKSSSK..',
  '...KSSSSSMMMMK..',
  '....KKSSSSKK....',
]
const TÊTE_BOB = TÊTE.filter((_, i) => i !== 2)
const TÊTE_AIE = TÊTE.map((r, i) => (i === 6 ? '...KSSSKKSSSK...' : i === 7 ? '...KSSSSSKKMMK..' : r))
const TORSE = ['...KWWWBBWWWK...', '..KWKBBBBBBKWK..', '..KSKBBLBBBKSK..']
const TORSE_COURSE = ['..KWWWWBBWWWK...', '.KWWKBBBBBBK....', '.KSK.BBLBBBK....']
const TORSE_HAUT = ['.KWWWWWBBWWWWWK.', '...KWBBBBBBWK...', '...KBBBBLBBBK...']
const J = {
  stand: ['...KBBBBBBBBK...', '...KNNK..KBBK...', '...KFFK..KFFK...', '..KKKKK..KKKKK..'],
  a: ['...KBBBBBBBBK...', '..KNNK....KBBK..', '.KFFK......KFFK.', 'KKKKK......KKKKK'],
  b: ['...KBBBBBBBBK...', '....KNNK.KBBK...', '....KKKK.KFFK...', '.........KKKKK..'],
  c: ['...KBBBBBBBBK...', '..KBBK....KNNK..', '.KFFK......KFFK.', 'KKKKK......KKKKK'],
  d: ['...KBBBBBBBBK...', '...KNNK.KBBK....', '...KFFK.KKKK....', '..KKKKK.........'],
  tuck: ['...KBBBBBBBBK...', '....KNNKKBBK....', '....KFFKKFFK....', VIDE],
  jump: ['...KBBBBBBBBK...', '..KNNK..KBBBBK..', '.KFFK....KFFFK..', '.KKKK....KKKKK..'],
  skid: ['...KBBBBBBBBK...', '...KNNK...KBBK..', '..KFFFK...KFFFK.', '.KKKKKK...KKKKKK'],
  land: ['..KBBBBBBBBBBK..', '.KFFFFFK.KFFFFFK', 'KKKKKKKK.KKKKKKK'],
}
const BRAS_HAUT = [[3, 0, 'K'], [3, 1, 'S'], [4, 0, 'K'], [4, 1, 'S'], [5, 0, 'K'], [5, 1, 'W'], [6, 0, 'K'], [6, 1, 'W'], [7, 0, 'K'], [7, 1, 'W'], [8, 0, 'K'], [8, 1, 'W'],
  [3, 15, 'K'], [3, 14, 'S'], [4, 15, 'K'], [4, 14, 'S'], [5, 15, 'K'], [5, 14, 'W'], [6, 15, 'K'], [6, 14, 'W'], [7, 15, 'K'], [7, 14, 'W'], [8, 15, 'K'], [8, 14, 'W']]
const BRAS_COTE = [[7, 0, 'K'], [7, 1, 'S'], [8, 0, 'K'], [8, 1, 'W'], [7, 15, 'K'], [7, 14, 'S'], [8, 15, 'K'], [8, 14, 'W']]
const petit = (tête, torse, jambes) => [...tête, ...torse, ...jambes]
const petitBob = (torse, jambes, tête = TÊTE_BOB) => [VIDE, ...tête, ...torse, ...jambes]
const grand = (tête, torse, jambes) => [...tête, torse[0], ...rep(torse[1], 5), torse[2], jambes[0], ...rep(jambes[1], 5), jambes[2], jambes[3]]
const grandBob = (torse, jambes, tête = TÊTE_BOB) => [VIDE, ...tête, torse[0], ...rep(torse[1], 5), torse[2], jambes[0], ...rep(jambes[1], 5), jambes[2], jambes[3]]
const H = (nom, p, g) => { def('petit_' + nom, p, HÉROS); if (g) def('grand_' + nom, g, HÉROS) }
H('attente', [petit(TÊTE, TORSE, J.stand), petitBob(TORSE, J.stand)], [grand(TÊTE, TORSE, J.stand), grandBob(TORSE, J.stand)])
H('marche', [petit(TÊTE, TORSE, J.a), petitBob(TORSE, J.b), petit(TÊTE, TORSE, J.c), petitBob(TORSE, J.d)],
  [grand(TÊTE, TORSE, J.a), grandBob(TORSE, J.b), grand(TÊTE, TORSE, J.c), grandBob(TORSE, J.d)])
const TC = décal(TÊTE, 1), TCB = décal(TÊTE_BOB, 1)
H('course', [petit(TC, TORSE_COURSE, J.a), petitBob(TORSE_COURSE, J.tuck, TCB), petit(TC, TORSE_COURSE, J.c), petitBob(TORSE_COURSE, J.tuck, TCB)],
  [grand(TC, TORSE_COURSE, J.a), grandBob(TORSE_COURSE, J.tuck, TCB), grand(TC, TORSE_COURSE, J.c), grandBob(TORSE_COURSE, J.tuck, TCB)])
H('saut', [poser(petit(TÊTE, TORSE_HAUT, J.jump), BRAS_HAUT)], [poser(grand(TÊTE, TORSE_HAUT, J.jump), BRAS_HAUT)])
H('chute', [poser(petit(TÊTE, TORSE_HAUT, J.stand), BRAS_COTE)], [poser(grand(TÊTE, TORSE_HAUT, J.stand), BRAS_COTE)])
H('atterrit', [[VIDE, VIDE, ...TÊTE, TORSE[0], TORSE[2], ...J.land]],
  [[...rep(VIDE, 5), ...TÊTE, TORSE[0], TORSE[1], TORSE[1], TORSE[1], TORSE[2], J.land[0], J.land[0], J.land[0], J.land[1], J.land[2]]])
H('frein', [petit(décal(TÊTE, -1), TORSE, J.skid)], [grand(décal(TÊTE, -1), TORSE, J.skid)])
H('degat', [poser(petit(TÊTE_AIE, TORSE_HAUT, J.jump), BRAS_COTE)], [poser(grand(TÊTE_AIE, TORSE_HAUT, J.jump), BRAS_COTE)])
def('petit_mort', [poser(petit(TÊTE_AIE, TORSE_HAUT, J.jump), BRAS_HAUT), poser(petit(TÊTE_AIE, TORSE_HAUT, J.stand), BRAS_HAUT)], HÉROS)
H('victoire', [poser(petit(TÊTE, TORSE_HAUT, J.stand), BRAS_HAUT), poser(petit(TÊTE, TORSE_HAUT, J.jump), BRAS_HAUT)],
  [poser(grand(TÊTE, TORSE_HAUT, J.stand), BRAS_HAUT), poser(grand(TÊTE, TORSE_HAUT, J.jump), BRAS_HAUT)])
def('transfo', [
  [...rep(VIDE, 8), ...petit(TÊTE, TORSE, J.stand)],
  [...rep(VIDE, 6), ...TÊTE, TORSE[0], TORSE[1], TORSE[1], TORSE[2], J.stand[0], J.stand[1], J.stand[1], J.stand[2], J.stand[3]],
  grand(TÊTE, TORSE, J.stand),
], HÉROS)

// ---------------------------------------------------------------- ENNEMIS
const P_MOUSSE = { K: NOIR, M: '#8e4f7a', L: '#c27aa8', D: '#5a2d4c', C: '#f6e8d0', E: '#ffffff', F: '#3a2420' }
const MOUSSE_HAUT = [
  '................', '................', '................',
  '.....KKKKKK.....', '...KKMMLLMMKK...', '..KMMLLMMMMMMK..', '.KMMLMMMMMMMMMK.', '.KMMMMMMMMMMDDK.', '.KKKKKKKKKKKKKK.',
  '..KCKKCCCCKKCK..', '..KCCEKCCKECCK..', '...KCCCCCCCCK...', '...KKCCDDCCKK...', '....KKKKKKKK....',
]
def('mousse_marche', [[...MOUSSE_HAUT, '...KFFK..KFFK...', '...KKKK..KKKK...'], [...MOUSSE_HAUT, '..KFFK....KFFK..', '..KKKK....KKKK..']], P_MOUSSE)
def('mousse_ecrase', [[...rep(VIDE, 12), '..KKKKKKKKKKKK..', '.KMMLLMMMMMMMMK.', '.KCCEKCCCCKECCK.', '.KKKKKKKKKKKKKK.']], P_MOUSSE)

const P_PIC = { K: NOIR, R: '#8a1f2a', D: '#4e0f1c', L: '#c94058', G: '#e8ecf4', H: '#8d93ad', E: '#ffffff', F: '#2a1218' }
const PIC_HAUT = [
  VIDE, VIDE,
  '....G...G...G...', '...GHG.GHG.GHG..', '..KGGGKGGGKGGGK.',
  '.KRRLLRRRRRRRRK.', '.KRLRRRRRRRRRDK.', 'GKRRKKRRRRKKRRKG', 'GKRREKRRRREKRRKG', 'GKRRRRRRRRRRRRKG',
  '.KRRKGKGKGKGKRK.', '.KDRRRRRRRRRRDK.', '..KDDDDDDDDDDK..', '...KKKKKKKKKK...',
]
def('pic_marche', [[...PIC_HAUT, '..KFFK....KFFK..', '..KKKK....KKKK..'], [...PIC_HAUT, '...KFFK..KFFK...', '...KKKK..KKKK...']], P_PIC)

const P_SAUT = { K: NOIR, G: '#4fb34a', L: '#a6e36a', D: '#2a7230', C: '#e8f0c0', E: '#ffffff' }
def('sauteur_sol', [[...rep(VIDE, 6),
  '..KKKK....KKKK..', '.KEKEEK..KEKEEK.', '.KGGGGKKKKGGGGK.', 'KGGLGGGGGGGGGGGK', 'KGGGGGGGGGGGGGGK', 'KGCCCCCCCCCCCCGK', 'KGGCCCCCCCCCCGGK', '.KKGGGGGGGGGGKK.', 'KGGGKKK..KKKGGGK', 'KKKKK......KKKKK'].slice(0, 16)], P_SAUT)
def('sauteur_air', [[VIDE, '..KKKK....KKKK..', '.KEKEEK..KEKEEK.', '.KGGGGKKKKGGGGK.', '.KGLGGGGGGGGGGK.', '.KGGGGGGGGGGGGK.', '.KGCCCCCCCCCCGK.', '.KGCCCCCCCCCCGK.', '..KGCCCCCCCCGK..', '...KGGGGGGGGK...', '..KGGK....KGGK..', '..KGGK....KGGK..', '.KGGK......KGGK.', '.KGGK......KGGK.', 'KGGGK......KGGGK', 'KKKKK......KKKKK']], P_SAUT)
def('sauteur_ecrase', [[...rep(VIDE, 12), '..KKKKKKKKKKKK..', '.KGGLGGGGGGGGGK.', '.KEKEGGGGGEKEGK.', 'KKKKKKKKKKKKKKKK']], P_SAUT)

const P_CHAUVE = { K: NOIR, V: '#6a4a98', L: '#a98ae0', D: '#3e2766', Y: '#ffd23f', W: '#ffffff', P: '#ff7aa8' }
def('chauve_vol', [
  [VIDE, 'K..............K', 'KK....K..K....KK', 'KVK...KKKK...KVK', 'KVVK.KVVVVK.KVVK', 'KVVVKKVYVVKKVVVK', 'KDVVVKVVVVKVVVDK', '.KDVVVKWWKVVVDK.', '..KDDVVKKVVDDK..', '...KKDDVVDDKK...', '.....KKKKKK.....', VIDE, VIDE, VIDE, VIDE, VIDE],
  [VIDE, VIDE, VIDE, VIDE, '......K..K......', '.....KKKKKK.....', '..KKKKVYVVKKKK..', '.KVVVKVVVVKVVVK.', 'KVVVVVKWWKVVVVVK', 'KDVVVVVKKVVVVVDK', 'KK.DDVVVVVVDD.KK', 'K...KDDVVDDK...K', '.....KKKKKK.....', VIDE, VIDE, VIDE],
], P_CHAUVE)
def('chauve_ecrase', [[...rep(VIDE, 12), '.KKKKK....KKKKK.', 'KVVVVKKKKKVVVVVK', 'KDVYVVWWWWVVYVDK', '.KKKKKKKKKKKKKK.']], P_CHAUVE)

const P_RAMP = { K: NOIR, B: '#b8d86a', b: '#e0f08a', d: '#7a9a3a', H: '#d98a2b', h: '#ffc060', g: '#8a5214', E: '#ffffff', R: '#e83a3a' }
const RAMP_CORPS = [
  VIDE, VIDE, VIDE, VIDE,
  '....KKKKKK......', '..KKHHhhHHKK....', '.KHHhHHHHHHHK...', '.KHhHHggHHHHK...', '.KHHHgHHgHHHKKK.', '.KHHHHggHHHKBBK.',
  '.KgHHHHHHHgKBEKK',
]
def('rampant_marche', [[...RAMP_CORPS, '..KKBBBBBBBBBBBK', '..KddBBBBBBBBBBK', '..KKKddKKddKKKKK', '...KK.KK.KK.KK..', '................'].slice(0, 16),
  [...RAMP_CORPS, '..KKBBBBBBBBBBBK', '..KBBddBBBBBBBBK', '..KKKKKddKKddKKK', '...KK.KK..KK.KK.', '................'].slice(0, 16)], P_RAMP)
def('rampant_charge', [[...RAMP_CORPS.slice(0, 10), '.KgHHHHHHHgKBRKK'.replace('R', 'E'), '..KKBBBBBBBBBBBK', '..KddBBBBBBBBBBK', '..KKKddKKddKKKKK', '...KK.KK.KK.KK..', VIDE].slice(0, 16),
  [...RAMP_CORPS.slice(0, 10), '.KgHHHHHHHgKBEKK', '..KKBBBBBBBBBBBK', '..KBBddBBBBBBBBK', '..KKKKKddKKddKKK', '...KK.KK..KK.KK.', VIDE].slice(0, 16)], { ...P_RAMP, B: '#f08a6a', b: '#ffc0a0', d: '#a8483a' })
def('rampant_ecrase', [[...rep(VIDE, 12), '..KKKKKKKKKKKK..', '.KHHhHHHHHHHHKK.', '.KBBBBBBBBBBBEKK', '.KKKKKKKKKKKKKKK']], P_RAMP)

// ---------------------------------------------------------------- TUILES
const HERBE = ['hhhghhhhghhhhghh', 'ggjggggjggggjggg', 'gjjgjgjjgjgjjgjg', 'jdjdjjdjdjjdjdjj']
const TERRE = ['dddddedddddddedd', 'ddfdddddfdddddfd', 'dddddddddeddddde', 'fdddddfdddddfddd', 'dddedddddddddddd', 'ddddddfdddedddfd', 'dfdddddddddddddd', 'dddddedddfddddde', 'dddfdddddddedddd', 'edddddfdddddddfd', 'dddddddddedddddd', 'ddfddddddddddddd']
def('sol_herbe', [[...HERBE, ...TERRE]])
def('sol_terre', [[...TERRE.slice(4), ...TERRE.slice(0, 4), ...TERRE.slice(0, 4)].slice(0, 16)])
const BRIQ_A = ['utttttttuttttttt', 'urrrrrrrurrrrrrr', 'urrrrrrrurrrrrrr']
const BRIQ_B = ['ttttutttttttuttt', 'rrrrurrrrrrrurrr', 'rrrrurrrrrrrurrr']
def('brique', [['u'.repeat(16), ...BRIQ_A, 'u'.repeat(16), ...BRIQ_B, 'u'.repeat(16), ...BRIQ_A, 'u'.repeat(16), ...BRIQ_B]])
const QM = ['.888.', '8...8', '....8', '..88.', '..8..', '.....', '..8..']
const bloc0 = coller(coller(cadreBloc('7', '5', '6', 'K'), QM.map(l => l.replace(/8/g, '6')), 6, 5), QM, 5, 4)
def('bloc', [poser(bloc0, [[2, 2, '3'], [2, 3, '3']]), poser(bloc0, [[12, 12, '3'], [12, 11, '3'], [11, 12, '3']])])
const bloc1 = poser(cadreBloc('q', 'p', 'v', 'K'), [[2, 2, 'v'], [2, 13, 'v'], [13, 2, 'v'], [13, 13, 'v'], [3, 3, 'q'], [12, 3, 'q'], [3, 12, 'q'], [12, 12, 'q']])
def('bloc_vide', [bloc1])
def('bloc_secret', [bloc1])
def('pierre', [poser(['q'.repeat(16), ...rep('q' + 'p'.repeat(14) + 'v', 14), 'v'.repeat(16)], [[2, 2, 'v'], [13, 2, 'v'], [2, 13, 'v'], [13, 13, 'v'], [5, 5, 'v'], [6, 6, 'v'], [7, 6, 'v'], [8, 7, 'v'], [9, 8, 'v'], [9, 9, 'v'], [10, 10, 'v'], [4, 10, 'q'], [5, 10, 'q'], [11, 4, 'q']])])
const TUY_LEVRE_G = 'iyyxxxxxxxxxxxxx', TUY_LEVRE_D = 'xxxxxxxxxxxxxzzi', TUY_CORPS_G = '.iyyxxxxxxxxxxxx', TUY_CORPS_D = 'xxxxxxxxxxxxzzi.'
def('tuyau_hg', [['i'.repeat(16), ...rep(TUY_LEVRE_G, 6), 'i'.repeat(16), ...rep(TUY_CORPS_G, 8)]])
def('tuyau_hd', [['i'.repeat(16), ...rep(TUY_LEVRE_D, 6), 'i'.repeat(16), ...rep(TUY_CORPS_D, 8)]])
def('tuyau_cg', [rep(TUY_CORPS_G, 16)])
def('tuyau_cd', [rep(TUY_CORPS_D, 16)])
def('piece', [
  [VIDE, VIDE, '....44444444....', '...4333111114...', '..433331111124..', '..431112211124..', '..431112211124..', '..431112211124..', '..431112211124..', '..431112211124..', '..431112211124..', '..411111221124..', '...4111111224...', '....44444444....', VIDE, VIDE],
  [VIDE, VIDE, '.....444444.....', '....43311114....', '....43112214....', '....43112214....', '....43112214....', '....43112214....', '....43112214....', '....43112214....', '....43112214....', '....43112214....', '....41111224....', '.....444444.....', VIDE, VIDE],
  [VIDE, VIDE, '......4444......', ...rep('......4324......', 10), '......4444......', VIDE, VIDE],
  [VIDE, VIDE, '.....444444.....', '....43311114....'.replace(/3/g, '2'), ...rep('....41221134....', 8), '....41111224....', '.....444444.....', VIDE, VIDE],
])
def('mat', [rep('......KqpK......', 16)])
def('mat_haut', [[VIDE, '.....444444.....', '....43311124....', '....43111124....', '....41111224....', '....42112224....', '.....444444.....', ...rep('......KqpK......', 9)]])
const FLAG_PAL = { K: NOIR, O: '#e8742a', Y: '#ffb347', Q: '#a8481e' }
def('drapeau', [
  [VIDE, 'KKKKKKKKKKKK....', 'OYYYOOOOOOOOKK..', 'OYYOOOOOOOOKK...', 'OOOOOOOOOOKK....', 'OOOOOOOOKK......', 'OOOOOOKK........', 'OOOOKK..........', 'OOKK............', 'KK..............', ...rep(VIDE, 6)],
  [VIDE, 'KKKKKKKKKKK.....', 'OYYYOOOOOOOKK...', 'OYYOOOOOOOKKQ...', 'OOOOOOOOOOKK....', 'OOOOOOOKK.......', 'OOOOOKK.........', 'OOOKK...........', 'OKK.............', 'K...............', ...rep(VIDE, 6)],
], FLAG_PAL)
const POTEAU = '..KqpK..........'
const pointBase = (haut) => [...rep(POTEAU, 16)].map((r, i) => haut[i] || r)
def('point_off', [pointBase({ 1: '..KqpKKKKKKKK...', 2: '..KqpKppppppK...', 3: '..KqpKppppppK...', 4: '..KqpKppppppK...', 5: '..KqpKKKKKKKK...' })])
def('point_on', [
  pointBase({ 1: '..KqpKKKKKKKK...', 2: '..KqpKhhhgggK...', 3: '..KqpKgggggjK...', 4: '..KqpKgggjjjK...', 5: '..KqpKKKKKKKK...' }),
  pointBase({ 1: '..KqpKKKKKKK....', 2: '..KqpKhhhggK....', 3: '..KqpKgggggjKK..', 4: '..KqpKggjjjK....', 5: '..KqpKKKKKKKK...' }),
])
def('champignon', [['................', '................', '.....KKKKKK.....', '...KK@@$$@@KK...', '..K@@$$@@@@@@K..', '.K@@$CC@@@CC@@K.', '.K@@@CC@@@CC@@K.', '.K@@@@@@@@@@@@K.', '.K&&@@@@@@@@&&K.', '..KK&&&&&&&&KK..', '...KWWWWWWWWK...', '...KWKWWWWKWK...', '...KWWWWWWWWK...', '....KWWWWWWK....', '.....KKKKKK.....', '................']], { K: NOIR, '@': '#3fc0b0', '&': '#1d7a78', $: '#9ff0e0', C: '#f6f0dc', W: '#f6f0dc' })
const P_VIE = { K: NOIR, P: '#ff5a8a', L: '#ffb0c8', D: '#b02a5a', Y: '#fff2a0' }
def('vie', [
  [VIDE, VIDE, VIDE, '...KKKK..KKKK...', '..KLLPPKKPPPPK..', '..KLPPPPPPPPPK..', '..KPPPPPPPPPDK..', '..KPPPPPPPPDDK..', '...KPPPPPPDDK...', '....KPPPPDDK....', '.....KPPDDK.....', '......KDDK......', '.......KK.......', VIDE, VIDE, VIDE],
  [VIDE, VIDE, '..............Y.', '...KKKK..KKKK...', '..KLLPPKKPPPPK..', '..KLPPPPPPPPPK..', '..KPPPPPPPPPDK..', '..KPPPPPPPPDDK..', '...KPPPPPPDDK...', '....KPPPPDDK....', '.....KPPDDK.....', '......KDDK......', '.......KK.......', VIDE, VIDE, VIDE],
], P_VIE)
def('debris', [
  ['........', '.uuuu...', '.utrr...', '.urrr...', '.urrr...', '........', '........', '........'],
  ['........', '...uu...', '..utrr..', '..urrr..', '...rr...', '........', '........', '........'],
  ['........', '........', '..uuuu..', '..urrr..', '..urrr..', '..uuuu..', '........', '........'],
  ['........', '....u...', '...ttr..', '..urrr..', '...rr...', '........', '........', '........'],
])
def('etincelle', [
  ['........', '........', '...00...', '...00...', '........', '........', '........', '........'],
  ['........', '...1....', '...1....', '.11001..', '...1....', '...1....', '........', '........'],
  ['...1....', '...1....', '...1....', '1110011.', '...1....', '...1....', '...1....', '........'],
  ['........', '.1....1.', '..1..1..', '...00...', '..1..1..', '.1....1.', '........', '........'],
])
const plat = () => { const G = grille(32, 8); rect(G, 0, 0, 32, 8, 'i'); rect(G, 1, 1, 30, 1, 'q'); rect(G, 1, 2, 30, 4, 'p'); rect(G, 1, 6, 30, 1, 'v'); for (const x of [3, 11, 19, 27]) { pt(G, x, 3, 'v'); pt(G, x, 4, 'q') } return [lignes(G)] }
def('plateforme_mobile', plat())

// ---------------------------------------------------------------- icônes UI 8×8
def('icone_coeur', [['.KK..KK.', 'KRRKKRRK', 'KRLRRRRK', 'KRRRRRRK', '.KRRRRK.', '..KRRK..', '...KK...', '........']], { K: NOIR, R: '#e8415a', L: '#ffb0c0' })
def('icone_piece', [['..KKKK..', '.K3311K.', 'K331112K', 'K311122K', 'K311122K', 'K311222K', '.K2222K.', '..KKKK..']])
def('icone_etoile', [['...KK...', '...KK...', 'KKKYYKKK', '.KYYYYK.', '..KYYK..', '.KYKKYK.', '.KK..KK.', '........']], { K: NOIR, Y: '#ffd23f' })
def('icone_champi', [['..KKKK..', '.K@@$@K.', 'K@$@@@@K', 'K@@@C@@K', '.KKKKKK.', '..KWWK..', '..KWWK..', '...KK...']], { K: NOIR, '@': '#3fc0b0', $: '#9ff0e0', C: '#f6f0dc', W: '#f6f0dc' })
def('icone_horloge', [['..KKKK..', '.KWWWWK.', 'KWWWKWWK', 'KWWWKWWK', 'KWWWKKWK', 'KWWWWWWK', '.KWWWWK.', '..KKKK..']], { K: NOIR, W: '#f6f0dc' })

// ---------------------------------------------------------------- DÉCORS procéduraux (placement manuel, entiers)
const arêteHaute = (G, de, vers) => { for (let y = 1; y < G.length; y++) for (let x = 0; x < G[0].length; x++) if (G[y][x] === de && G[y - 1][x] === '.') G[y][x] = vers; for (let x = 0; x < G[0].length; x++) if (G[0][x] === de) G[0][x] = vers }
const enroule = (w, fn) => { for (const dx of [-w, 0, w]) fn(dx) }
const trianglePlein = (G, cx, haut, base, h, demi, clair, sombre, w) => enroule(w, dx => {
  for (let y = 0; y <= h; y++) { const demiY = Math.floor((demi * y) / h); for (let x = cx + dx - demiY; x <= cx + dx + demiY; x++) pt(G, x, haut + y, x > cx + dx ? sombre : clair) }
})

PROC.fond_loin = th => {
  const G = grille(128, 64)
  if (th === 0) { for (const [cx, h, d] of [[20, 44, 34], [64, 56, 42], [104, 38, 30]]) trianglePlein(G, cx, 64 - h, 63, h, d, 'A', 'C', 128); arêteHaute(G, 'A', 'a') }
  else if (th === 1) {
    for (const [x, w, h] of [[6, 14, 34], [30, 10, 46], [50, 18, 28], [78, 12, 52], [100, 16, 38], [120, 14, 30]]) enroule(128, dx => { rect(G, x + dx, 64 - h, w, h, 'A'); rect(G, x + dx + w - 3, 64 - h, 3, h, 'C'); rect(G, x + dx - 1, 64 - h, w + 2, 2, 'a') })
    rect(G, 0, 60, 128, 4, 'C')
  } else {
    for (const [cx, h, d] of [[6, 30, 7], [18, 40, 9], [31, 26, 6], [42, 36, 8], [56, 44, 10], [70, 28, 7], [82, 38, 9], [95, 30, 7], [108, 42, 10], [121, 32, 8]]) trianglePlein(G, cx, 64 - h, 63, h, d, 'A', 'C', 128)
    rect(G, 0, 58, 128, 6, 'C'); arêteHaute(G, 'A', 'a')
  }
  return [lignes(G)]
}
PROC.fond_milieu = th => {
  const G = grille(128, 48)
  const collines = [[20, 26, 34, 22], [64, 20, 40, 28], [108, 28, 32, 20]]
  for (const [cx, haut, rx, ry] of collines) enroule(128, dx => { for (let y = haut; y < 48; y++) for (let x = cx + dx - rx; x <= cx + dx + rx; x++) { const dy = Math.max(0, y - haut - ry), ddx = x - cx - dx; if (ddx * ddx * ry * ry + (y - haut - ry) * (y - haut - ry) * rx * rx <= rx * rx * ry * ry || y >= haut + ry) { if (y - haut <= ry || Math.abs(ddx) <= rx) pt(G, x, y, 'D') } void dy } })
  arêteHaute(G, 'D', 'H')
  for (let y = 44; y < 48; y++) for (let x = 0; x < 128; x++) if (G[y][x] === 'D') G[y][x] = 'G'
  const hautCol = x => { for (let y = 0; y < 48; y++) if (G[y][((x % 128) + 128) % 128] !== '.') return y; return 47 }
  const arbres = th === 0 ? [8, 30, 52, 76, 98, 120] : th === 1 ? [10, 36, 58, 84, 104] : [6, 22, 40, 60, 78, 96, 114]
  for (const x of arbres) {
    const y = hautCol(x)
    if (th === 0) { disque(G, x, y - 3, 3, 'G'); pt(G, x - 1, y - 4, 'D'); pt(G, x, y - 1, 'G'); pt(G, x, y, 'G') }
    else if (th === 1) { for (let k = 0; k < 7; k++) pt(G, x, y - k, 'G'); pt(G, x - 1, y - 5, 'G'); pt(G, x - 2, y - 6, 'G'); pt(G, x + 1, y - 4, 'G'); pt(G, x + 2, y - 5, 'G') }
    else { for (let k = 0; k < 8; k++) { const l = Math.floor(k / 2); for (let dx = -l; dx <= l; dx++) pt(G, x + dx, y - 8 + k, 'G') } pt(G, x, y - 1, 'G'); pt(G, x, y, 'G') }
  }
  return [lignes(G)]
}
const nuage = (w, h, ds) => th => { const G = grille(w, h); for (const [cx, cy, r] of ds) disque(G, cx, cy, r, 'w'); const F = G.map(r => [...r]); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (F[y][x] === 'w' && (y + 1 >= h || F[y + 1][x] === '.' || (y + 2 < h && F[y + 2][x] === '.'))) G[y][x] = 'c'; void th; return [lignes(G)] }
PROC.nuage_a = nuage(32, 16, [[9, 10, 4], [16, 8, 6], [23, 10, 5], [14, 11, 5]])
PROC.nuage_b = nuage(48, 16, [[10, 10, 5], [19, 7, 7], [29, 8, 7], [38, 10, 5], [24, 11, 6]])
PROC.etoile = () => [['.0.', '000', '.0.'], ['...', '.0.', '...']]
PROC.lune = () => { const G = grille(24, 24); disque(G, 12, 12, 11, 'Z'); for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if ((x - 17) ** 2 + (y - 9) ** 2 <= 100 + 10) G[y][x] = '.'; return [lignes(G)] }
PROC.deco_buisson = () => { const G = grille(16, 16); for (const [cx, cy, r] of [[4, 12, 3], [8, 10, 4], [12, 12, 3]]) disque(G, cx, cy, r, 'I'); for (let y = 15; y >= 0; y--) for (let x = 0; x < 16; x++) if (G[y][x] === 'I' && (y === 0 || G[y - 1][x] === '.' || (x > 0 && G[y - 1][x - 1] === '.'))) G[y][x] = 'J'; for (let x = 0; x < 16; x++) if (G[15][x] === 'I') G[15][x] = 'P'; pt(G, 6, 9, 'U'); pt(G, 10, 11, 'U'); return [lignes(G)] }
PROC.deco_fleur = () => { const mk = dx => { const G = grille(16, 16); for (let y = 8; y < 16; y++) pt(G, 8, y, 'j'); pt(G, 9, 11, 'j'); pt(G, 10, 10, 'j'); pt(G, 7, 12, 'j'); pt(G, 6, 11, 'j'); const x = 8 + dx; pt(G, x, 6, 'U'); pt(G, x - 1, 7, 'U'); pt(G, x + 1, 7, 'U'); pt(G, x, 8, 'U'); pt(G, x, 7, 'V'); pt(G, x, 5, 'U'); G[8][8] = G[8][8] === '.' ? 'j' : G[8][8]; return lignes(G) }; return [mk(0), mk(1)] }
PROC.deco_champi = () => { const G = grille(16, 16); rect(G, 6, 10, 4, 5, 'V'); rect(G, 6, 10, 1, 5, 'Z'); disque(G, 8, 9, 4, 'U'); rect(G, 0, 10, 16, 6, '.'); rect(G, 6, 10, 4, 5, 'V'); for (let x = 3; x <= 12; x++) if (G[9][x] === '.') pt(G, x, 9, 'U'); pt(G, 6, 6, 'V'); pt(G, 10, 7, 'V'); pt(G, 8, 8, 'V'); for (let x = 3; x <= 12; x++) if (G[10][x] === '.' && (x < 6 || x > 9)) pt(G, x, 10, 'P'); return [lignes(G)] }
PROC.deco_arbre = th => {
  const G = grille(32, 48)
  if (th === 0) { rect(G, 14, 26, 5, 22, 'R'); rect(G, 14, 26, 1, 22, 'P'); for (const [cx, cy, r] of [[16, 14, 10], [9, 20, 7], [23, 20, 7], [16, 24, 8]]) disque(G, cx, cy, r, 'I'); for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) if (G[y][x] === 'I' && (G[y - 1]?.[x] === '.' || G[y]?.[x - 1] === '.')) G[y][x] = 'J'; for (let y = 0; y < 47; y++) for (let x = 0; x < 32; x++) if (G[y][x] === 'I' && (G[y + 1][x] === '.' || G[y]?.[x + 1] === '.')) G[y][x] = 'P' }
  else if (th === 1) { rect(G, 14, 20, 4, 28, 'R'); for (const [x, y, l] of [[13, 24, 6], [18, 18, 7], [12, 14, 5], [19, 10, 6]]) for (let k = 0; k < l; k++) pt(G, x + (x < 16 ? -k : k), y - Math.floor(k / 2), 'R'); disque(G, 9, 15, 3, 'I'); disque(G, 24, 8, 3, 'I'); disque(G, 13, 6, 3, 'J'); pt(G, 9, 14, 'J'); pt(G, 24, 7, 'J') }
  else { rect(G, 14, 40, 4, 8, 'R'); for (const [haut, l] of [[0, 6], [8, 9], [16, 12], [26, 14]]) for (let k = 0; k <= l + 6; k++) { const demi = Math.min(l, Math.floor((k * l) / (l + 6)) + 1); for (let x = 16 - demi; x <= 16 + demi; x++) pt(G, x, haut + k, x > 16 ? 'P' : x < 15 ? 'J' : 'I') } }
  return [lignes(G)]
}
PROC.cabane = () => {
  const G = grille(32, 32)
  for (let dy = 0; dy <= 12; dy++) { const demi = dy + 3; for (let x = 16 - demi; x <= 16 + demi; x++) pt(G, x, 2 + dy, 'r'); pt(G, 16 - demi, 2 + dy, 'u'); pt(G, 16 + demi, 2 + dy, 'u'); if (dy % 4 === 3) for (let x = 17 - demi; x < 16 + demi; x++) pt(G, x, 2 + dy, 'u'); else if (dy % 4 === 1) for (let x = 18 - demi; x < 16 + demi; x += 4) pt(G, x, 2 + dy, 't') }
  rect(G, 3, 14, 26, 1, 'u'); rect(G, 4, 15, 24, 15, 'p'); rect(G, 4, 15, 2, 15, 'q'); rect(G, 26, 15, 2, 15, 'v'); rect(G, 4, 28, 24, 2, 'v')
  rect(G, 13, 21, 6, 9, 'i'); rect(G, 14, 22, 4, 8, 'f'); pt(G, 17, 26, '1')
  for (const x of [7, 21]) { rect(G, x, 19, 5, 5, 'i'); rect(G, x + 1, 20, 3, 3, '1'); pt(G, x + 1, 20, '3'); pt(G, x + 2, 19, 'i'); rect(G, x + 2, 20, 1, 3, 'i') }
  rect(G, 15, 0, 1, 3, 'i'); rect(G, 16, 0, 4, 2, '1'); pt(G, 16, 0, '3'); rect(G, 3, 30, 26, 2, 'g'); rect(G, 3, 30, 26, 1, 'h')
  return [lignes(G)]
}

// ---------------------------------------------------------------- SPÉCIFICATION (noms, tailles, nombre d'images)
const SPEC = {}
const S = (noms, w, h, nb = 1) => noms.split(' ').forEach(n => { SPEC[n] = [w, h, nb] })
S('sol_herbe sol_terre brique bloc_vide bloc_secret pierre tuyau_hg tuyau_hd tuyau_cg tuyau_cd mat mat_haut point_off', 16, 16)
S('bloc', 16, 16, 2); S('piece', 16, 16, 4); S('drapeau', 16, 16, 2); S('point_on', 16, 16, 2); S('cabane', 32, 32)
S('champignon', 16, 16); S('vie', 16, 16, 2); S('debris etincelle', 8, 8, 4); S('plateforme_mobile', 32, 8)
for (const g of ['petit', 'grand']) {
  const h = g === 'petit' ? 16 : 24
  S(`${g}_attente`, 16, h, 2); S(`${g}_marche ${g}_course`, 16, h, 4)
  S(`${g}_saut ${g}_chute ${g}_atterrit ${g}_frein ${g}_degat`, 16, h)
  S(`${g}_victoire`, 16, h, 2)
}
S('petit_mort', 16, 16, 2); S('transfo', 16, 24, 3)
S('mousse_marche', 16, 16, 2); S('mousse_ecrase', 16, 16); S('pic_marche', 16, 16, 2)
S('sauteur_sol sauteur_air sauteur_ecrase chauve_ecrase rampant_ecrase', 16, 16); S('chauve_vol rampant_marche rampant_charge', 16, 16, 2)
S('fond_loin', 128, 64); S('fond_milieu', 128, 48); S('nuage_a', 32, 16); S('nuage_b', 48, 16)
S('etoile', 3, 3, 2); S('lune', 24, 24); S('deco_buisson deco_champi', 16, 16); S('deco_fleur', 16, 16, 2); S('deco_arbre', 32, 48)
S('icone_coeur icone_piece icone_etoile icone_champi icone_horloge', 8, 8)

const sources = (nom, th) => { const p = PROC[nom]; if (p) return { frames: p(th), pal: null }; const s = STAT[nom]; return s ? { frames: s.frames, pal: s.pal } : null }

// Vérification (pure, sans DOM) : renvoie la liste des écarts à la spécification.
export function validerSprites() {
  const err = []
  for (let th = 0; th < THÈMES.length; th++) {
    for (const [nom, [w, h, nb]] of Object.entries(SPEC)) {
      const s = sources(nom, th)
      if (!s) { err.push(`${nom} : absent`); continue }
      if (s.frames.length !== nb) err.push(`${nom} : ${s.frames.length} images au lieu de ${nb}`)
      const pal = palette(th, s.pal)
      s.frames.forEach((f, i) => {
        if (f.length !== h) err.push(`${nom}[${i}] : hauteur ${f.length} au lieu de ${h}`)
        f.forEach((r, j) => { if (r.length !== w) err.push(`${nom}[${i}] ligne ${j} : largeur ${r.length} au lieu de ${w} → "${r}"`); for (const ch of r) if (ch !== '.' && !pal[ch]) err.push(`${nom}[${i}] ligne ${j} : lettre inconnue '${ch}'`) })
      })
    }
  }
  return [...new Set(err)]
}
export const NOMS_SPRITES = Object.keys(SPEC)
export const TAILLES_SPRITES = SPEC

// ---------------------------------------------------------------- atlas (canvas hors-écran, cache par thème)
const ATLAS = []
function cuire(rows, pal) {
  const h = rows.length, w = rows[0].length
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false
  let dernière = null
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = rows[y][x]; if (ch === '.') continue; const col = pal[ch]; if (!col) continue; if (col !== dernière) { g.fillStyle = col; dernière = col } g.fillRect(x, y, 1, 1) }
  return { c, w, h }
}
export function créerAtlas(thème = 0) {
  const th = ((thème % THÈMES.length) + THÈMES.length) % THÈMES.length
  if (ATLAS[th]) return ATLAS[th]
  const T = THÈMES[th], cache = {}
  const anim = nom => {
    if (cache[nom]) return cache[nom]
    const s = sources(nom, th)
    if (!s) throw new Error(`sprite inconnu : ${nom}`)
    const pal = palette(th, s.pal)
    return (cache[nom] = s.frames.map(f => cuire(f, pal)))
  }
  const atlas = {
    thème: th,
    coul: { ciel: [...T.ciel], texte: T.texte, ombre: T.ombre, hud: T.hud, iris: T.iris },
    nb: nom => anim(nom).length,
    cadre: (nom, i = 0) => { const a = anim(nom); return a[((i % a.length) + a.length) % a.length] },
  }
  return (ATLAS[th] = atlas)
}

// ---------------------------------------------------------------- police bitmap 5×7
const POLICE = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  '.': ['.', '.', '.', '.', '.', '.', '#'], ',': ['..', '..', '..', '..', '..', '.#', '#.'], ':': ['.', '.', '#', '.', '#', '.', '.'], ';': ['..', '..', '.#', '..', '.#', '.#', '#.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'], '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'], "'": ['#', '#', '.', '.', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...', '...', '...'], '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'], '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'], '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '×': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'], '(': ['..#.', '.#..', '#...', '#...', '#...', '.#..', '..#.'], ')': ['.#..', '..#.', '...#', '...#', '...#', '..#.', '.#..'],
  '★': ['..#..', '..#..', '#####', '.###.', '.###.', '##.##', '#...#'], '♥': ['.....', '##.##', '#####', '#####', '.###.', '..#..', '.....'], '●': ['.....', '.###.', '#####', '#####', '#####', '.###.', '.....'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'], '#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.....'], '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '<': ['...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'], '>': ['#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'], '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  '☆': ['..#..', '..#..', '#.#.#', '.#.#.', '.#.#.', '#...#', '#...#'], '→': ['.....', '..#..', '...#.', '#####', '...#.', '..#..', '.....'], '←': ['.....', '..#..', '.#...', '#####', '.#...', '..#..', '.....'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
}
const ALIAS = { '—': '-', '–': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '…': '.', '·': '.' }
export const GLYPHES_POLICE = Object.keys(POLICE)
const normaliser = c => { if (POLICE[c]) return c; if (ALIAS[c]) return ALIAS[c]; const m = c.toUpperCase(); if (POLICE[m]) return m; const b = m.normalize('NFD').replace(/[̀-ͯ]/g, ''); if (POLICE[b]) return b; if (m === 'Œ') return 'O'; if (m === 'Ç') return 'C'; return POLICE['?'] ? '?' : ' ' }
export function largeurTexte(texte, échelle = 1) {
  let w = 0
  for (const ch of String(texte)) w += POLICE[normaliser(ch)][0].length + 1
  return Math.max(0, w - 1) * échelle
}
export function dessinerTexte(g, texte, x, y, opts = {}) {
  const { couleur = '#ffffff', ombre = null, align = 'left', échelle = 1 } = opts
  const largeur = largeurTexte(texte, échelle)
  let cx = Math.round(align === 'center' ? x - largeur / 2 : align === 'right' ? x - largeur : x)
  const passes = ombre ? [[ombre, échelle, échelle], [couleur, 0, 0]] : [[couleur, 0, 0]]
  for (const [col, ox, oy] of passes) {
    let px = cx
    g.fillStyle = col
    for (const ch of String(texte)) {
      const gl = POLICE[normaliser(ch)]
      for (let j = 0; j < 7; j++) for (let i = 0; i < gl[j].length; i++) if (gl[j][i] === '#') g.fillRect(px + i * échelle + ox, Math.round(y) + j * échelle + oy, échelle, échelle)
      px += (gl[0].length + 1) * échelle
    }
  }
}
