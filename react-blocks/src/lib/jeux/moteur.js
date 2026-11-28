// Moteur de plateforme 2D à pas fixe (1/60 s). Pur : aucun accès au DOM, donc testable sous Node.
import { NIVEAUX, HAUTEUR, TUILE } from './niveaux.js'

export const J = { w: 20 }
export const hauteurJ = s => (s.grand ? 44 : 30)
const SOLIDES = new Set(['#', 'B', '?', 'M', 'U', '=', 'P'])

const tuile = (s, c, r) => (c < 0 ? '#' : c >= s.largeur || r < 0 || r >= HAUTEUR ? '.' : s.grille[r][c])
const solide = (s, c, r) => SOLIDES.has(tuile(s, c, r))

export function nouvelÉtat(i = 0) {
  const n = NIVEAUX[i].créer()
  let total = 0
  for (const l of n.grille) for (const t of l) if (t === 'C') total++
  return { niveau: i, ...n, largeur: n.grille[0].length, piècesTotal: total, x: n.départ.x, y: n.départ.y, vx: 0, vy: 0,
    sol: false, dir: 1, coyote: 0, tampon: 0, sautAvant: false, air: 0, grand: false, aGrandi: false, invuln: 0, objets: [],
    pièces: 0, score: 0, vies: 3, mortsNiveau: 0, écrasés: 0, temps: 0, mortT: 0, point: -1, statut: 'jeu', événements: [], bosse: [] }
}

export const étoiles = s => 1 + (s.pièces >= Math.ceil(s.piècesTotal * 0.8) ? 1 : 0) + (s.mortsNiveau === 0 ? 1 : 0)

// Déplacements génériques avec résolution par axe (utilisés par le joueur et les objets).
function déplacerX(s, o, w, h) {
  o.x += o.vx
  let touche = false
  for (let r = Math.floor(o.y / TUILE); r <= Math.floor((o.y + h - 1) / TUILE); r++) {
    for (let c = Math.floor(o.x / TUILE); c <= Math.floor((o.x + w - 1) / TUILE); c++) {
      if (!solide(s, c, r)) continue
      o.x = o.vx > 0 ? c * TUILE - w : (c + 1) * TUILE; touche = true
    }
  }
  if (touche) o.vx = 0
  return touche
}
function déplacerY(s, o, w, h) {
  const v = o.vy
  o.y += v
  let sol = false, tête = null
  for (let c = Math.floor(o.x / TUILE); c <= Math.floor((o.x + w - 1) / TUILE); c++) {
    for (let r = Math.floor(o.y / TUILE); r <= Math.floor((o.y + h - 1) / TUILE); r++) {
      if (!solide(s, c, r)) continue
      if (v > 0) { o.y = r * TUILE - h; sol = true } else { o.y = (r + 1) * TUILE; tête = tête || { c, r } }
    }
  }
  if (sol || tête) o.vy = 0
  return { sol, tête }
}

function mourir(s) {
  if (s.statut !== 'jeu') return
  s.statut = 'mort'; s.mortT = 0; s.vy = -9; s.vx = 0; s.grand = false; s.mortsNiveau++
  s.événements.push({ t: 'mort', x: s.x + 10, y: s.y })
}
function blesser(s) {
  if (s.invuln > 0 || s.statut !== 'jeu') return
  if (s.grand) { s.grand = false; s.y += 14; s.invuln = 110; s.événements.push({ t: 'rapetisse', x: s.x + 10, y: s.y }) } else mourir(s)
}
function pasMort(s) {
  s.mortT++; s.vy = Math.min(11, s.vy + 0.5); s.y += s.vy
  if (s.mortT < 70) return s
  s.vies--
  if (s.vies <= 0) { s.statut = 'perdu'; return s }
  s.statut = 'jeu'; s.x = s.départ.x; s.y = s.départ.y; s.vx = 0; s.vy = 0; s.invuln = 90; s.événements.push({ t: 'réapparition' })
  return s
}

export function pas(s, entrée) {
  s.événements = []
  if (s.statut === 'mort') return pasMort(s)
  if (s.statut !== 'jeu') return s
  s.temps++
  if (s.invuln > 0) s.invuln--
  const h = hauteurJ(s)
  const gauche = entrée.gauche && !entrée.droite, droite = entrée.droite && !entrée.gauche
  const max = entrée.course ? 4.4 : 3.2
  if (gauche) { s.vx -= 0.55; s.dir = -1 } else if (droite) { s.vx += 0.55; s.dir = 1 } else { s.vx *= 0.78; if (Math.abs(s.vx) < 0.1) s.vx = 0 }
  s.vx = Math.max(-max, Math.min(max, s.vx))

  s.coyote = s.sol ? 6 : Math.max(0, s.coyote - 1)
  if (entrée.saut && !s.sautAvant) s.tampon = 6; else s.tampon = Math.max(0, s.tampon - 1)
  s.sautAvant = !!entrée.saut
  if (s.tampon > 0 && s.coyote > 0) { s.vy = -10.4; s.tampon = 0; s.coyote = 0; s.sol = false; s.événements.push({ t: 'saut', x: s.x + 10, y: s.y + h }) }
  if (!entrée.saut && s.vy < -4) s.vy = -4
  s.vy = Math.min(11, s.vy + 0.5)

  déplacerX(s, s, J.w, h)
  const avant = s.sol
  const { sol, tête } = déplacerY(s, s, J.w, h)
  s.sol = sol
  s.air = sol ? 0 : s.air + 1
  if (sol && !avant && s.vy === 0 && s.airAvant > 14) s.événements.push({ t: 'atterrit', x: s.x + 10, y: s.y + h })
  s.airAvant = s.air || s.airAvant
  if (sol) s.airAvant = 0
  if (tête) {
    const { c, r } = tête, ch = tuile(s, c, r)
    if (ch === '?') { s.grille[r][c] = 'U'; s.pièces++; s.score += 200; s.événements.push({ t: 'pièce', x: c * TUILE + 16, y: r * TUILE, pts: 200 }); s.bosse.push({ c, r, t: 8 }) }
    else if (ch === 'M') { s.grille[r][c] = 'U'; s.objets.push({ type: 'champignon', x: c * TUILE + 4, y: r * TUILE, w: 24, h: 24, vx: 0, vy: 0, dir: 1, émerge: 20 }); s.bosse.push({ c, r, t: 8 }); s.événements.push({ t: 'bloc' }) }
    else if (ch === 'B' && s.grand) { s.grille[r][c] = '.'; s.score += 50; s.événements.push({ t: 'brique', x: c * TUILE + 16, y: r * TUILE + 16 }) }
    else if (ch === 'B') s.bosse.push({ c, r, t: 8 })
  }
  s.bosse = s.bosse.map(b => ({ ...b, t: b.t - 1 })).filter(b => b.t > 0)

  // objets (champignon)
  for (const m of s.objets) {
    if (m.émerge > 0) { m.émerge--; m.y -= 26 / 20; continue }
    m.vy = Math.min(11, m.vy + 0.5); m.vx = m.dir * 1.3
    if (déplacerX(s, m, m.w, m.h)) m.dir *= -1
    déplacerY(s, m, m.w, m.h)
    if (m.y > HAUTEUR * TUILE + 64) m.mort = true
    if (s.x < m.x + m.w && s.x + J.w > m.x && s.y < m.y + m.h && s.y + h > m.y) {
      m.mort = true; s.score += 1000
      if (!s.grand) { s.grand = true; s.aGrandi = true; s.y -= 14 }
      s.événements.push({ t: 'agrandir', x: m.x + 12, y: m.y, pts: 1000 })
    }
  }
  s.objets = s.objets.filter(m => !m.mort)
  const h2 = hauteurJ(s)

  // pièces, point de passage, drapeau
  for (let r = Math.floor(s.y / TUILE); r <= Math.floor((s.y + h2 - 1) / TUILE); r++) {
    for (let c = Math.floor(s.x / TUILE); c <= Math.floor((s.x + J.w - 1) / TUILE); c++) {
      const t = tuile(s, c, r)
      if (t === 'C') { s.grille[r][c] = '.'; s.pièces++; s.score += 100; s.événements.push({ t: 'pièce', x: c * TUILE + 16, y: r * TUILE + 16, pts: 100 }) }
      else if (t === 'K' && s.point < c) { s.point = c; s.départ = { x: c * TUILE, y: 9 * TUILE - 30 }; s.événements.push({ t: 'point', x: c * TUILE + 16, y: r * TUILE }) }
      else if (t === 'F' && s.statut === 'jeu') { s.statut = 'gagné'; s.score += Math.max(0, 400 - Math.floor(s.temps / 60)) * 5; s.événements.push({ t: 'victoire' }) }
    }
  }

  // ennemis
  for (const e of s.ennemis) {
    if (!e.vivant) { if (e.écrasé > 0) e.écrasé--; continue }
    e.x += e.dir * (e.type === 'pic' ? 0.6 : 0.8)
    const devant = e.dir > 0 ? e.x + e.w + 1 : e.x - 1
    const c = Math.floor(devant / TUILE), r = Math.floor((e.y + e.h - 1) / TUILE)
    if (solide(s, c, r) || !solide(s, c, r + 1)) e.dir *= -1
    if (s.statut !== 'jeu') continue
    const touche = s.x < e.x + e.w && s.x + J.w > e.x && s.y < e.y + e.h && s.y + h2 > e.y
    if (!touche) continue
    if (e.type !== 'pic' && s.vy > 0 && s.y + h2 - s.vy <= e.y + 8) {
      e.vivant = false; e.écrasé = 20; s.vy = entrée.saut ? -9 : -7; s.score += 100; s.écrasés++; s.événements.push({ t: 'écrase', x: e.x + 13, y: e.y, pts: 100 })
    } else blesser(s)
  }
  if (s.statut === 'jeu' && s.y > HAUTEUR * TUILE + 64) { s.grand = false; mourir(s) }
  return s
}
