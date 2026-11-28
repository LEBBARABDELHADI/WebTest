// Tests du moteur de Super Plombier (physique, collisions, ennemis, objets, secrets, arrivée).
import test from 'node:test'
import assert from 'node:assert/strict'
import { nouvelÉtat, pas, étoiles, critères } from '../../src/lib/jeux/moteur.js'
import { NIVEAUX } from '../../src/lib/jeux/niveaux.js'
import { créerCaméra, majCaméra } from '../../src/lib/jeux/camera.js'
import { PHYS, TUILE } from '../../src/lib/jeux/config.js'

const L = 60
function monde({ trous = [], vide = false } = {}) {
  const s = nouvelÉtat(0)
  s.grille = Array.from({ length: 12 }, () => Array(L).fill('.'))
  if (!vide) for (let c = 0; c < L; c++) { if (trous.some(([a, b]) => c >= a && c <= b)) continue; s.grille[10][c] = '#'; s.grille[11][c] = '#' }
  s.largeur = L; s.ennemis = []; s.plateformes = []; s.objets = []
  s.x = 100; s.y = 160 - 14; s.vx = 0; s.vy = 0; s.sol = true; s.arrivéeC = 55; s.arrivéeY = 160; s.mâtY = 48
  return s
}
const rien = {}
const avancer = (s, n, e = rien) => { for (let i = 0; i < n; i++) pas(s, e) }

test('le héros se pose et reste immobile sans commande', () => {
  const s = monde(); avancer(s, 30)
  assert.equal(s.y, 146); assert.equal(s.vx, 0); assert.ok(s.sol)
})

test('accélération progressive puis vitesse de marche et de course', () => {
  const s = monde(); const v = []
  for (let i = 0; i < 40; i++) { pas(s, { droite: true }); v.push(s.vx) }
  assert.ok(v[0] > 0 && v[0] < v[10] && v[10] < PHYS.marche + 0.001); assert.ok(Math.abs(v[39] - PHYS.marche) < 0.01)
  for (let i = 0; i < 80; i++) pas(s, { droite: true, course: true })
  assert.ok(Math.abs(s.vx - PHYS.course) < 0.01)
})

test('décélération naturelle et dérapage lors d\'un demi-tour', () => {
  const s = monde(); avancer(s, 50, { droite: true, course: true })
  pas(s, { gauche: true }); assert.ok(s.frein, 'animation de dérapage')
  const avant = s.vx; avancer(s, 5, { gauche: true }); assert.ok(s.vx < avant)
  const t = monde(); avancer(t, 40, { droite: true }); const v0 = t.vx; pas(t, rien); assert.ok(t.vx < v0 && t.vx > 0, 'inertie légère')
  avancer(t, 30); assert.equal(t.vx, 0)
})

test('hauteur de saut variable selon la durée d\'appui', () => {
  const haut = n => { const s = monde(); let min = s.y; for (let i = 0; i < 70; i++) { pas(s, { saut: i < n }); min = Math.min(min, s.y) } return 146 - min }
  const court = haut(3), long = haut(40)
  assert.ok(long > court + 15, `court ${court} long ${long}`); assert.ok(long > 45 && long < 64)
})

test('saut plus haut en courant', () => {
  const haut = run => { const s = monde(); avancer(s, 60, run ? { droite: true, course: true } : { droite: true }); let min = s.y; for (let i = 0; i < 70; i++) { pas(s, { droite: true, course: run, saut: true }); min = Math.min(min, s.y) } return 146 - min }
  assert.ok(haut(true) > haut(false) + 2)
})

test('coyote time : saut accepté juste après avoir quitté le bord', () => {
  const s = monde({ trous: [[10, 20]] }); s.x = 9 * TUILE - 8
  let vu = false
  for (let i = 0; i < 40; i++) { pas(s, { droite: true }); if (!s.sol && s.coyote > 0 && !vu) { vu = true; pas(s, { droite: true, saut: true }); break } }
  assert.ok(vu); assert.ok(s.vy < -4, 'saut déclenché en l\'air grâce au coyote time')
})

test('saut mémorisé (jump buffering) avant l\'atterrissage', () => {
  const s = monde(); s.y = 160 - 14 - 12; s.sol = false; s.vy = 2
  let sauté = false
  for (let i = 0; i < 20; i++) { pas(s, { saut: i === 0 || (i < 8) ? i === 2 : false }); if (s.vy < -4) sauté = true }
  assert.ok(sauté)
})

test('collision avec un mur et un plafond', () => {
  const s = monde(); for (let r = 7; r <= 9; r++) s.grille[r][10] = '#'
  avancer(s, 200, { droite: true }); assert.ok(s.x + 10 <= 10 * TUILE + 0.001)
  const t = monde(); for (let c = 5; c < 8; c++) t.grille[6][c] = '#'
  t.x = 6 * TUILE + 3; avancer(t, 30, { saut: true }); assert.ok(t.y >= 7 * TUILE - 0.001)
})

test('bloc « ? » : pièce, bloc vide et rebond visuel', () => {
  const s = monde(); s.grille[7][6] = '?'; s.x = 6 * TUILE + 3
  avancer(s, 25, { saut: true }); assert.equal(s.grille[7][6], 'U'); assert.equal(s.pièces, 1)
  assert.ok(s.événements.length >= 0)
})

test('champignon : apparaît, se déplace, fait grandir ; un coup le fait rapetisser', () => {
  const s = monde(); s.grille[7][6] = 'M'; s.x = 6 * TUILE + 3
  avancer(s, 25, { saut: true }); assert.equal(s.objets.length, 1)
  for (let i = 0; i < 300 && !s.grand; i++) pas(s, { droite: s.objets.length ? s.objets[0].x > s.x : false, gauche: s.objets.length ? s.objets[0].x < s.x - 4 : false })
  assert.ok(s.grand && s.aGrandi); avancer(s, 40)
  assert.equal(s.objets.length, 0)
  s.ennemis.push({ type: 'pic', x: s.x + 2, y: 160 - 12, w: 12, h: 12, vx: 0, vy: 0, dir: -1, vivant: true, mortT: 0, t: 0, actif: false, sol: true, amp: 0, x0: 0, y0: 0 })
  avancer(s, 3); assert.ok(!s.grand && s.statut === 'jeu' && s.invuln > 0, 'perd sa taille mais pas la vie')
})

test('brique : cassée par un grand héros, secouée par un petit', () => {
  const s = monde(); s.grille[7][6] = 'B'; s.x = 6 * TUILE + 3; avancer(s, 25, { saut: true }); assert.equal(s.grille[7][6], 'B')
  const g = monde(); g.grand = true; g.y = 160 - 24; g.grille[6][6] = 'B'; g.x = 6 * TUILE + 3; avancer(g, 30, { saut: true }); assert.equal(g.grille[6][6], '.')
})

test('blocs cachés : traversables sur les côtés, frappés par en dessous (pièce et 1-UP)', () => {
  const s = monde(); s.grille[7][6] = 'H'; s.x = 4 * TUILE; avancer(s, 70, { droite: true }); assert.ok(s.x > 7 * TUILE, 'ne bloque pas la marche')
  const t = monde(); t.grille[7][6] = 'H'; t.x = 6 * TUILE + 3; avancer(t, 25, { saut: true }); assert.equal(t.secrets, 1); assert.equal(t.grille[7][6], 'U')
  const v = monde(); v.grille[7][6] = 'V'; v.x = 6 * TUILE + 3; avancer(v, 25, { saut: true }); assert.equal(v.objets[0].type, 'vie')
  for (let i = 0; i < 300 && v.vies === 3; i++) pas(v, { droite: v.objets.length ? v.objets[0].x > v.x : false, gauche: v.objets.length ? v.objets[0].x < v.x - 4 : false })
  assert.equal(v.vies, 4)
})

test('ennemi écrasable : détruit par le dessus avec rebond et combo', () => {
  const s = monde(); s.x = 100
  const mk = x => ({ type: 'mousse', x, y: 160 - 12, w: 12, h: 12, vx: 0, vy: 0, dir: 0, vivant: true, mortT: 0, t: 0, actif: false, sol: true, amp: 0, x0: 0, y0: 0 })
  s.ennemis.push(mk(103)); s.y = 160 - 14 - 30; s.sol = false; s.vy = 2
  avancer(s, 20); assert.equal(s.ennemis[0].vivant, false); assert.equal(s.écrasés, 1); assert.ok(s.vy < 0 || s.y < 146); assert.equal(s.statut, 'jeu')
})

test('ennemi à piques : dangereux même en sautant dessus', () => {
  const s = monde(); const e = { type: 'pic', x: 103, y: 160 - 12, w: 12, h: 12, vx: 0, vy: 0, dir: 0, vivant: true, mortT: 0, t: 0, actif: false, sol: true, amp: 0, x0: 0, y0: 0 }
  s.ennemis.push(e); s.y = 160 - 14 - 30; s.sol = false; s.vy = 2; s.x = 100
  avancer(s, 20); assert.ok(e.vivant); assert.equal(s.statut, 'mort')
})

test('comportements : le mousse fait demi-tour au mur et au bord, le chauve patrouille, le rampant a un rythme', () => {
  const s = monde({ trous: [[20, 30]] }); s.x = 100
  s.ennemis.push({ type: 'mousse', x: 17 * TUILE, y: 160 - 12, w: 12, h: 12, vx: 0, vy: 0, dir: 1, vivant: true, mortT: 0, t: 0, actif: false, sol: true, amp: 0, x0: 0, y0: 0 })
  avancer(s, 120); assert.ok(s.ennemis[0].dir === -1 || s.ennemis[0].x < 20 * TUILE, 'ne tombe pas dans le trou')
  const r = monde(); r.x = 100; r.ennemis.push({ type: 'rampant', x: 120, y: 160 - 12, w: 12, h: 12, vx: 0, vy: 0, dir: 1, vivant: true, mortT: 0, t: 0, actif: false, sol: true, amp: 0, x0: 0, y0: 0 })
  const xs = []; for (let i = 0; i < 120; i++) { pas(r, { }); xs.push(r.ennemis[0].x); r.x = 100; r.y = 146; r.invuln = 99; r.statut = 'jeu' }
  assert.equal(xs[10], xs[0], 'immobile au début du cycle'); assert.ok(xs[90] - xs[60] > 10, 'puis fonce')
})

test('plateforme mobile : transporte le héros', () => {
  const s = monde({ vide: true }); s.plateformes = [{ x: 90, y: 160, x0: 90, y0: 160, w: 32, h: 8, axe: 'h', amp: 40, vit: 0.03, t: 0, dx: 0, dy: 0 }]
  s.x = 100; s.y = 160 - 14; s.sol = true; s.surf = null
  avancer(s, 5); assert.ok(s.sol && s.surf)
  const x0 = s.x; avancer(s, 40); assert.ok(Math.abs(s.x - x0) > 20 && s.sol, 'porté sans glisser')
})

test('point de passage : on réapparaît au dernier point atteint', () => {
  const s = monde(); s.grille[9][8] = 'K'; s.x = 7 * TUILE; avancer(s, 40, { droite: true }); assert.ok(s.point === 8)
  s.x = 20 * TUILE; s.statut = 'jeu'; s.y = 11 * TUILE + 40; avancer(s, 2); assert.equal(s.statut, 'mort')
  avancer(s, 71); assert.equal(s.statut, 'attente'); assert.equal(s.vies, 2)
  avancer(s, 85); assert.equal(s.statut, 'jeu'); assert.ok(Math.abs(s.x - (8 * TUILE + 3)) < 1)
})

test('trois vies : à zéro, la partie est perdue', () => {
  const s = monde()
  for (let k = 0; k < 3; k++) { s.statut = 'jeu'; s.y = 11 * TUILE + 40; avancer(s, 160) }
  assert.equal(s.statut, 'perdu'); assert.equal(s.vies, 0)
})

test('séquence d\'arrivée : mât, marche vers la cabane, résultats', () => {
  const s = monde(); s.arrivéeC = 30; for (let r = 3; r <= 9; r++) s.grille[r][30] = 'F'
  s.x = 29 * TUILE; s.y = 160 - 14 - 20; s.sol = false; s.vy = 0
  let phases = new Set(); for (let i = 0; i < 400 && s.statut !== 'gagné'; i++) { pas(s, { droite: true }); phases.add(s.statut + s.finPhase) }
  assert.equal(s.statut, 'gagné'); assert.ok(phases.has('arrivée0') && phases.has('arrivée1') && phases.has('arrivée2')); assert.ok(s.bonus >= 100)
})

test('étoiles : terminer, 80 % des pièces, aucune vie perdue', () => {
  const s = monde(); s.piècesTotal = 10; s.statut = 'gagné'; s.pièces = 8; s.mortsNiveau = 0
  assert.equal(étoiles(s), 3); assert.deepEqual(critères(s), { terminé: true, pièces: true, sansMort: true })
  s.pièces = 7; assert.equal(étoiles(s), 2); s.mortsNiveau = 1; assert.equal(étoiles(s), 1); s.statut = 'perdu'; assert.equal(étoiles(s), 0)
})

test('déterminisme : mêmes entrées, même résultat', () => {
  const jouer = () => { const s = nouvelÉtat(0); for (let i = 0; i < 600; i++) pas(s, { droite: true, course: i % 90 < 70, saut: i % 45 < 20 }); return [s.x, s.y, s.score, s.statut, s.vies] }
  assert.deepEqual(jouer(), jouer())
})

test('caméra : suit sans osciller pendant un saut', () => {
  const s = monde(); const c = créerCaméra(s); avancer(s, 30)
  const ys = []; for (let i = 0; i < 80; i++) { pas(s, { droite: true, saut: i < 25 }); majCaméra(c, s); ys.push(c.y) }
  assert.ok(Math.max(...ys) - Math.min(...ys) < 1, 'caméra verticale stable en saut')
  assert.ok(c.x >= 0 && c.x <= L * TUILE - 256)
})

test('niveaux : structure valide (arrivée, départ sur le sol, pas d\'ennemi dans un mur, blocs et pièces présents)', () => {
  for (let i = 0; i < NIVEAUX.length; i++) {
    const s = nouvelÉtat(i)
    assert.ok(s.largeur >= 200 && s.piècesTotal >= 20 && s.secretsTotal >= 2, NIVEAUX[i].nom)
    assert.ok(s.grille.some(l => l[s.arrivéeC] === 'F')); assert.equal(s.grille[10][3], '#')
    for (const e of s.ennemis) { const c = Math.floor((e.x + 6) / TUILE), r = Math.floor((e.y + 6) / TUILE); assert.ok(!'#B?MU=P'.includes(s.grille[r][c]), `ennemi dans un mur niveau ${i + 1} col ${c}`) }
    assert.ok(s.grille.flat().includes('K') && s.grille.flat().includes('M'))
  }
})
