// Moteur de plateforme 2D à pas fixe (1/60 s). Pur : aucun accès au DOM, donc testable sous Node.
import { créerNiveau, LARGEUR, HAUTEUR, TUILE } from './niveau1.js'

export const J = { w: 20, h: 30 }
const SOLIDES = new Set(['#', 'B', '?', 'U', '='])
const tuile = (s, c, r) => (c < 0 ? '#' : c >= LARGEUR || r < 0 || r >= HAUTEUR ? '.' : s.grille[r][c])
const solide = (s, c, r) => SOLIDES.has(tuile(s, c, r))

export function nouvelÉtat() {
  const n = créerNiveau()
  return { ...n, x: n.départ.x, y: n.départ.y, vx: 0, vy: 0, sol: false, dir: 1, coyote: 0, tampon: 0, sautAvant: false,
    pièces: 0, score: 0, vies: 3, mortsNiveau: 0, écrasés: 0, temps: 0, statut: 'jeu', événements: [], bosse: [] }
}

function mourir(s) {
  s.vies--; s.mortsNiveau++; s.événements.push({ t: 'mort' })
  if (s.vies <= 0) { s.statut = 'perdu'; return }
  s.x = s.départ.x; s.y = s.départ.y; s.vx = 0; s.vy = 0
}

export function pas(s, entrée) {
  s.événements = []
  if (s.statut !== 'jeu') return s
  s.temps++
  const gauche = entrée.gauche && !entrée.droite, droite = entrée.droite && !entrée.gauche
  const max = entrée.course ? 4.4 : 3.2
  if (gauche) { s.vx -= 0.55; s.dir = -1 } else if (droite) { s.vx += 0.55; s.dir = 1 } else { s.vx *= 0.78; if (Math.abs(s.vx) < 0.1) s.vx = 0 }
  s.vx = Math.max(-max, Math.min(max, s.vx))

  s.coyote = s.sol ? 6 : Math.max(0, s.coyote - 1)
  if (entrée.saut && !s.sautAvant) s.tampon = 6; else s.tampon = Math.max(0, s.tampon - 1)
  s.sautAvant = !!entrée.saut
  if (s.tampon > 0 && s.coyote > 0) { s.vy = -10.4; s.tampon = 0; s.coyote = 0; s.sol = false; s.événements.push({ t: 'saut' }) }
  if (!entrée.saut && s.vy < -4) s.vy = -4
  s.vy = Math.min(11, s.vy + 0.5)

  // axe X
  s.x += s.vx
  for (let r = Math.floor(s.y / TUILE); r <= Math.floor((s.y + J.h - 1) / TUILE); r++) {
    for (let c = Math.floor(s.x / TUILE); c <= Math.floor((s.x + J.w - 1) / TUILE); c++) {
      if (!solide(s, c, r)) continue
      s.x = s.vx > 0 ? c * TUILE - J.w : (c + 1) * TUILE; s.vx = 0
    }
  }
  // axe Y
  s.y += s.vy; s.sol = false
  for (let c = Math.floor(s.x / TUILE); c <= Math.floor((s.x + J.w - 1) / TUILE); c++) {
    for (let r = Math.floor(s.y / TUILE); r <= Math.floor((s.y + J.h - 1) / TUILE); r++) {
      if (!solide(s, c, r)) continue
      if (s.vy > 0) { s.y = r * TUILE - J.h; s.sol = true } else {
        s.y = (r + 1) * TUILE
        if (tuile(s, c, r) === '?') { s.grille[r][c] = 'U'; s.pièces++; s.score += 200; s.événements.push({ t: 'pièce', x: c * TUILE + 16, y: r * TUILE }); s.bosse.push({ c, r, t: 8 }) }
      }
      s.vy = 0
    }
  }
  s.bosse = s.bosse.map(b => ({ ...b, t: b.t - 1 })).filter(b => b.t > 0)

  // pièces et drapeau
  for (let r = Math.floor(s.y / TUILE); r <= Math.floor((s.y + J.h - 1) / TUILE); r++) {
    for (let c = Math.floor(s.x / TUILE); c <= Math.floor((s.x + J.w - 1) / TUILE); c++) {
      const t = tuile(s, c, r)
      if (t === 'C') { s.grille[r][c] = '.'; s.pièces++; s.score += 100; s.événements.push({ t: 'pièce', x: c * TUILE + 16, y: r * TUILE + 16 }) }
      if (t === 'F') { s.statut = 'gagné'; s.score += Math.max(0, 400 - Math.floor(s.temps / 60)) * 5; s.événements.push({ t: 'victoire' }) }
    }
  }

  // ennemis
  for (const e of s.ennemis) {
    if (!e.vivant) { if (e.écrasé > 0) e.écrasé--; continue }
    e.x += e.dir * 0.8
    const devant = e.dir > 0 ? e.x + e.w + 1 : e.x - 1
    const c = Math.floor(devant / TUILE), r = Math.floor((e.y + e.h - 1) / TUILE)
    if (solide(s, c, r) || !solide(s, c, r + 1)) e.dir *= -1
    const touche = s.x < e.x + e.w && s.x + J.w > e.x && s.y < e.y + e.h && s.y + J.h > e.y
    if (!touche) continue
    if (s.vy > 0 && s.y + J.h - s.vy <= e.y + 8) {
      e.vivant = false; e.écrasé = 20; s.vy = -7; s.score += 100; s.écrasés++; s.événements.push({ t: 'écrase', x: e.x + 13, y: e.y })
    } else { mourir(s); break }
  }
  if (s.statut === 'jeu' && s.y > HAUTEUR * TUILE + 64) mourir(s)
  return s
}
