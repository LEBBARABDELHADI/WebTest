// Moteur de plateforme 2D à pas fixe (1/60 s). Pur : aucun accès au DOM, donc testable sous Node.
import { TUILE, HAUTEUR, JOUEUR, PHYS, ENNEMIS } from './config.js'
import { NIVEAUX } from './niveaux.js'

const SOLIDES = new Set(['#', 'B', '?', 'M', 'U', '=', 'P'])
const CACHÉS = new Set(['H', 'V'])          // blocs invisibles : solides seulement quand on les frappe par en dessous

export const hauteurJ = s => (s.grand ? JOUEUR.hGrand : JOUEUR.hPetit)
const tuile = (s, c, r) => (c < 0 ? '#' : c >= s.largeur || r < 0 || r >= HAUTEUR ? '.' : s.grille[r][c])
const solide = (s, c, r, montant) => { const t = tuile(s, c, r); return SOLIDES.has(t) || (montant && CACHÉS.has(t)) }

function créerEnnemi(sp) {
  const d = ENNEMIS[sp.type]
  const x = sp.c * TUILE + (TUILE - d.w) / 2
  const y = sp.type === 'chauve' ? sp.r * TUILE : (sp.r ?? 10) * TUILE - d.h
  return { type: sp.type, x, y, y0: y, x0: x, w: d.w, h: d.h, vx: 0, vy: 0, dir: sp.dir ?? -1, vivant: true, mortT: 0, t: (sp.phase || 0), actif: false, sol: false, amp: sp.amp ?? 40 }
}
function créerPlateforme(sp) {
  return { x: sp.x, y: sp.y, x0: sp.x, y0: sp.y, w: 32, h: 8, axe: sp.axe, amp: sp.amp, vit: sp.vit ?? 0.025, t: sp.phase ?? 0, dx: 0, dy: 0 }
}

export function nouvelÉtat(i = 0) {
  const n = NIVEAUX[i].créer()
  let total = 0, secrets = 0
  for (const l of n.grille) for (const t of l) { if (t === 'C' || t === '?') total++; if (t === 'H' || t === 'V') secrets++ }
  return {
    niveau: i, grille: n.grille, largeur: n.grille[0].length, piècesTotal: total, secretsTotal: secrets + (n.secretsBonus || 0), par: NIVEAUX[i].par,
    arrivéeC: n.arrivée, arrivéeY: n.arrivéeY ?? 160, mâtY: Math.min(...n.grille.flatMap((l, r) => (l[n.arrivée] === 'F' ? [r * TUILE] : []))), ennemis: n.ennemis.map(créerEnnemi), plateformes: (n.plateformes || []).map(créerPlateforme), objets: [],
    départ: { ...n.départ }, x: n.départ.x, y: n.départ.y, vx: 0, vy: 0, dy: 0, sol: false, dir: 1, coyote: 0, tampon: 0, sautAvant: false,
    surf: null, air: 0, sautT: 99, atterritT: 0, frein: false, grand: false, aGrandi: false, invuln: 0, gel: 0, combo: 0, comboMax: 0,
    pièces: 0, score: 0, vies: 3, mortsNiveau: 0, écrasés: 0, secrets: 0, temps: 0, mortT: 0, attT: 0, finT: 0, finPhase: 0, visible: true,
    point: -1, statut: 'jeu', événements: [], bosse: [], bonus: 0,
  }
}

export const critères = s => ({ terminé: s.statut === 'gagné', pièces: s.pièces >= Math.ceil(s.piècesTotal * 0.8), sansMort: s.mortsNiveau === 0 })
export const étoiles = s => { const c = critères(s); return (c.terminé ? 1 : 0) + (c.pièces ? 1 : 0) + (c.sansMort ? 1 : 0) }

// Déplacements génériques par axe (joueur, objets, ennemis).
function déplacerX(s, o, w, h) {
  o.x += o.vx
  let touche = false
  for (let r = Math.floor(o.y / TUILE); r <= Math.floor((o.y + h - 0.01) / TUILE); r++) {
    for (let c = Math.floor(o.x / TUILE); c <= Math.floor((o.x + w - 0.01) / TUILE); c++) {
      if (!solide(s, c, r, false)) continue
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
  for (let c = Math.floor(o.x / TUILE); c <= Math.floor((o.x + w - 0.01) / TUILE); c++) {
    for (let r = Math.floor(o.y / TUILE); r <= Math.floor((o.y + h - 0.01) / TUILE); r++) {
      if (!solide(s, c, r, v < 0)) continue
      if (v > 0) { o.y = r * TUILE - h; sol = true } else { o.y = (r + 1) * TUILE; if (!tête) tête = { c, r } }
    }
  }
  if (sol || tête) o.vy = 0
  return { sol, tête }
}
const chevauche = (a, aw, ah, b) => a.x < b.x + b.w && a.x + aw > b.x && a.y < b.y + b.h && a.y + ah > b.y

function mourir(s) {
  if (s.statut !== 'jeu') return
  s.statut = 'mort'; s.mortT = 0; s.vy = -4.2; s.vx = 0; s.grand = false; s.mortsNiveau++; s.surf = null; s.combo = 0
  s.événements.push({ t: 'mort', x: s.x + 5, y: s.y })
}
function blesser(s) {
  if (s.invuln > 0 || s.statut !== 'jeu') return
  if (s.grand) { s.grand = false; s.y += JOUEUR.hGrand - JOUEUR.hPetit; s.invuln = PHYS.invuln; s.gel = PHYS.gel; s.gelType = 'rapetisse'; s.événements.push({ t: 'rapetisse', x: s.x + 5, y: s.y }) } else mourir(s)
}
function grandir(s) {
  if (s.grand) return
  s.grand = true; s.aGrandi = true; s.y -= JOUEUR.hGrand - JOUEUR.hPetit; s.gel = PHYS.gel; s.gelType = 'agrandir'
  // pas de collision avec le plafond après la croissance
  for (let c = Math.floor(s.x / TUILE); c <= Math.floor((s.x + JOUEUR.w - 1) / TUILE); c++) if (solide(s, c, Math.floor(s.y / TUILE), false)) { s.y += JOUEUR.hGrand - JOUEUR.hPetit; break }
}
function pasMort(s) {
  s.mortT++
  if (s.mortT > 14) { s.vy = Math.min(5.5, s.vy + 0.22); s.y += s.vy } else if (s.mortT < 14) s.vy = 0
  if (s.mortT < 70) return s
  s.vies--
  if (s.vies <= 0) { s.statut = 'perdu'; s.événements.push({ t: 'perdu' }); return s }
  s.statut = 'attente'; s.attT = 0
  return s
}
function pasAttente(s) {
  s.attT++
  if (s.attT < 80) return s
  s.statut = 'jeu'; s.x = s.départ.x; s.y = s.départ.y; s.vx = 0; s.vy = 0; s.invuln = 90; s.sol = false; s.coyote = 0; s.tampon = 0
  s.événements.push({ t: 'réapparition' })
  return s
}

// Séquence d'arrivée : glissade le long du mât, marche jusqu'à la cabane, puis résultats.
function pasArrivée(s) {
  s.finT++
  const h = hauteurJ(s), sol = s.arrivéeY
  if (s.finPhase === 0) {
    s.y += 1.4
    if (s.y + h >= sol) { s.y = sol - h; s.finPhase = 1; s.finT = 0 }
  } else if (s.finPhase === 1) {
    if (s.finT === 14) s.dir = 1
    if (s.finT > 14) { s.x += 1.0; s.dir = 1 }
    if (s.x + 5 >= (s.arrivéeC + 4) * TUILE + 14) { s.finPhase = 2; s.finT = 0; s.visible = false }
  } else if (s.finPhase === 2) {
    if (s.finT === 40) { s.statut = 'gagné'; s.événements.push({ t: 'résultats' }) }
  }
  return s
}

function majPlateformes(s) {
  for (const p of s.plateformes) {
    const ox = p.x, oy = p.y
    p.t++
    const o = Math.sin(p.t * p.vit) * p.amp
    if (p.axe === 'h') p.x = p.x0 + o; else p.y = p.y0 + o
    p.dx = p.x - ox; p.dy = p.y - oy
  }
}

function majEnnemi(s, e) {
  const d = ENNEMIS[e.type]
  if (!e.vivant) { if (e.mortT > 0) e.mortT--; return }
  if (Math.abs(e.x - s.x) > 220) { e.actif = false; return }
  e.actif = true; e.t++
  if (e.type === 'chauve') {
    e.x += e.dir * d.vit
    if (Math.abs(e.x - e.x0) > e.amp) { e.dir *= -1; e.x = e.x0 + Math.sign(e.x - e.x0) * e.amp }
    e.y = e.y0 + Math.sin(e.t * 0.07) * 9
    return
  }
  let vit = d.vit
  if (e.type === 'rampant') { const k = e.t % 120; vit = k < 50 ? 0 : k < 62 ? 0 : k < 100 ? d.vit : 0.3; e.charge = k >= 50 && k < 100 }
  if (e.type === 'sauteur') {
    if (e.sol) { vit = 0; if (e.t % 80 === 0) { e.vy = -3.4; e.sol = false } }
    else vit = d.vit
  }
  e.vx = e.dir * vit
  e.vy = Math.min(5, e.vy + 0.24)
  if (déplacerX(s, e, e.w, e.h)) e.dir *= -1
  else if (e.sol || e.type !== 'sauteur') {
    // demi-tour au bord d'une plateforme
    const devant = e.dir > 0 ? e.x + e.w + 1 : e.x - 1
    const c = Math.floor(devant / TUILE), r = Math.floor((e.y + e.h) / TUILE)
    if (e.sol && !solide(s, c, r, false) && !solide(s, c, r + 1, false)) e.dir *= -1
  }
  const m = déplacerY(s, e, e.w, e.h)
  e.sol = m.sol
  if (e.y > HAUTEUR * TUILE + 32) e.vivant = false
}

export function pas(s, entrée) {
  s.événements.length = 0
  if (s.statut === 'mort') return pasMort(s)
  if (s.statut === 'attente') return pasAttente(s)
  if (s.statut === 'arrivée') return pasArrivée(s)
  if (s.statut !== 'jeu') return s
  if (s.gel > 0) { s.gel--; return s }
  s.temps++
  if (s.invuln > 0) s.invuln--
  if (s.atterritT > 0) s.atterritT--
  const h = hauteurJ(s)

  majPlateformes(s)
  // transport par une plateforme mobile
  if (s.surf) {
    const t = { x: s.x, y: s.y, vx: s.surf.dx, vy: 0 }
    déplacerX(s, t, JOUEUR.w, h); s.x = t.x; s.y += s.surf.dy
  }

  // --- commandes horizontales ---
  const gauche = entrée.gauche && !entrée.droite, droite = entrée.droite && !entrée.gauche
  const vmax = entrée.course ? PHYS.course : PHYS.marche
  const accel = s.sol ? (entrée.course ? PHYS.accélCourse : PHYS.accélSol) : PHYS.accélAir
  s.frein = false
  if (droite || gauche) {
    const sens = droite ? 1 : -1
    s.dir = sens
    if (s.vx * sens < 0) { s.vx += sens * (s.sol ? PHYS.frein : PHYS.freinAir); s.frein = s.sol && Math.abs(s.vx) > 0.8 }
    else if (s.vx * sens < vmax) s.vx = Math.min(vmax, s.vx * sens + accel) * sens
    else if (s.sol && s.vx * sens > vmax + 0.001) s.vx = sens * Math.max(vmax, s.vx * sens - PHYS.frottement)
  } else if (s.sol) {
    const a = Math.abs(s.vx)
    s.vx = a <= PHYS.frottement ? 0 : s.vx - Math.sign(s.vx) * PHYS.frottement
  } else s.vx -= Math.sign(s.vx) * Math.min(Math.abs(s.vx), PHYS.traînéeAir)

  // --- saut : coyote time + tampon ---
  s.coyote = s.sol ? PHYS.coyote : Math.max(0, s.coyote - 1)
  if (entrée.saut && !s.sautAvant) s.tampon = PHYS.tampon; else s.tampon = Math.max(0, s.tampon - 1)
  s.sautAvant = !!entrée.saut
  s.sautT++
  if (s.tampon > 0 && s.coyote > 0) {
    s.sautT = 0; s.vy = -(PHYS.saut + PHYS.bonusCourse * Math.min(1, Math.abs(s.vx) / PHYS.course)); s.tampon = 0; s.coyote = 0; s.sol = false; s.surf = null
    s.événements.push({ t: 'saut', x: s.x + 5, y: s.y + h })
  }
  if (!entrée.saut && s.vy < -PHYS.coupeSaut && s.sautT > 5) s.vy = -PHYS.coupeSaut   // saut minimal garanti, même sur une simple touche
  const g = s.vy < 0 ? (entrée.saut && Math.abs(s.vy) < 0.7 ? PHYS.gravitéApex : PHYS.gravité) : (entrée.saut && s.vy < 0.7 ? PHYS.gravitéApex : PHYS.gravitéChute)
  s.vy = Math.min(PHYS.chuteMax, s.vy + g)

  // --- déplacement et collisions ---
  déplacerX(s, s, JOUEUR.w, h)
  const avantY = s.y, impact = s.vy, avantSol = s.sol
  const m = déplacerY(s, s, JOUEUR.w, h)
  let sol = m.sol, surf = null
  if (!sol && s.vy >= 0) {
    for (const p of s.plateformes) {
      const piedsAvant = avantY + h - (p.dy > 0 ? 0 : 0), dessus = p.y - p.dy
      if (s.x + JOUEUR.w > p.x + 1 && s.x < p.x + p.w - 1 && piedsAvant <= dessus + 2 && s.y + h >= p.y) { s.y = p.y - h; s.vy = 0; sol = true; surf = p; break }
    }
  }
  s.dy = s.y - avantY
  s.sol = sol; s.surf = surf
  if (sol && !avantSol && impact > 2.4) { s.atterritT = 8; s.événements.push({ t: 'atterrit', x: s.x + 5, y: s.y + h }) }
  if (sol) s.combo = 0
  s.air = sol ? 0 : s.air + 1

  // --- blocs frappés par en dessous ---
  if (m.tête) {
    const { c, r } = m.tête, ch = tuile(s, c, r), cx = c * TUILE + 8, cy = r * TUILE
    if (ch === '?') { s.grille[r][c] = 'U'; s.pièces++; s.score += 200; s.événements.push({ t: 'bloc', x: cx, y: cy }, { t: 'pièce', x: cx, y: cy - 4, pts: 200 }); s.bosse.push({ c, r, t: 8 }) }
    else if (ch === 'M') { s.grille[r][c] = 'U'; s.objets.push({ type: 'champignon', x: c * TUILE, y: r * TUILE, w: 16, h: 14, vx: 0, vy: 0, dir: 1, émerge: 16 }); s.bosse.push({ c, r, t: 8 }); s.événements.push({ t: 'bloc', x: cx, y: cy }) }
    else if (ch === 'H') { s.grille[r][c] = 'U'; s.pièces++; s.score += 500; s.secrets++; s.événements.push({ t: 'bloc', x: cx, y: cy }, { t: 'secret', x: cx, y: cy - 4, pts: 500 }, { t: 'pièce', x: cx, y: cy - 4 }); s.bosse.push({ c, r, t: 8 }) }
    else if (ch === 'V') { s.grille[r][c] = 'U'; s.secrets++; s.objets.push({ type: 'vie', x: c * TUILE, y: r * TUILE, w: 16, h: 14, vx: 0, vy: 0, dir: 1, émerge: 16 }); s.bosse.push({ c, r, t: 8 }); s.événements.push({ t: 'bloc', x: cx, y: cy }, { t: 'secret', x: cx, y: cy - 4 }) }
    else if (ch === 'B' && s.grand) { s.grille[r][c] = '.'; s.score += 50; s.événements.push({ t: 'brique', x: cx, y: r * TUILE + 8 }) }
    else if (ch === 'B' || ch === 'U') { s.bosse.push({ c, r, t: 8 }); s.événements.push({ t: 'coup', x: cx, y: cy }) }
  }
  for (let i = s.bosse.length - 1; i >= 0; i--) { s.bosse[i].t--; if (s.bosse[i].t <= 0) s.bosse.splice(i, 1) }

  // --- objets (champignon, 1-UP) ---
  for (const o of s.objets) {
    if (o.émerge > 0) { o.émerge--; o.y -= 15 / 16; continue }
    o.vy = Math.min(4.5, o.vy + 0.22); o.vx = o.dir * 0.6
    if (déplacerX(s, o, o.w, o.h)) o.dir *= -1
    déplacerY(s, o, o.w, o.h)
    if (o.y > HAUTEUR * TUILE + 32) o.mort = true
    if (!o.mort && chevauche(s, JOUEUR.w, hauteurJ(s), o)) {
      o.mort = true
      if (o.type === 'vie') { s.vies = Math.min(9, s.vies + 1); s.score += 1000; s.événements.push({ t: 'vie', x: o.x + 8, y: o.y, pts: 1000 }) }
      else { s.score += 1000; if (s.grand) s.événements.push({ t: 'bonus', x: o.x + 8, y: o.y, pts: 1000 }); else { grandir(s); s.événements.push({ t: 'agrandir', x: o.x + 8, y: o.y, pts: 1000 }) } }
    }
  }
  for (let i = s.objets.length - 1; i >= 0; i--) if (s.objets[i].mort) s.objets.splice(i, 1)

  // --- pièces, point de passage, mât d'arrivée ---
  const h2 = hauteurJ(s)
  for (let r = Math.floor(s.y / TUILE); r <= Math.floor((s.y + h2 - 1) / TUILE); r++) {
    for (let c = Math.floor(s.x / TUILE); c <= Math.floor((s.x + JOUEUR.w - 1) / TUILE); c++) {
      const t = tuile(s, c, r)
      if (t === 'C') { s.grille[r][c] = '.'; s.pièces++; s.score += 100; s.événements.push({ t: 'pièce', x: c * TUILE + 8, y: r * TUILE + 8 }) }
      else if (t === 'K' && s.point < c) { s.point = c; s.départ = { x: c * TUILE + 3, y: 10 * TUILE - JOUEUR.hPetit }; s.événements.push({ t: 'point', x: c * TUILE + 8, y: r * TUILE }) }
      else if (t === 'F' && s.statut === 'jeu') {
        const haut = Math.max(0, Math.min(1, (s.arrivéeY - (s.y + h2)) / Math.max(16, s.arrivéeY - s.mâtY)))
        s.bonus = Math.round((100 + haut * 1900) / 100) * 100; s.score += s.bonus
        const sec = Math.floor(s.temps / 60); s.score += Math.max(0, s.par - sec) * 10
        s.statut = 'arrivée'; s.finPhase = 0; s.finT = 0; s.x = c * TUILE + 8 - JOUEUR.w - 1; s.vx = 0; s.vy = 0; s.dir = 1
        s.événements.push({ t: 'victoire_mat', x: s.x, y: s.y })
        return s
      }
    }
  }

  // --- ennemis ---
  for (const e of s.ennemis) {
    majEnnemi(s, e)
    if (!e.vivant || !e.actif || s.statut !== 'jeu') continue
    if (!chevauche(s, JOUEUR.w, h2, e)) continue
    const d = ENNEMIS[e.type]
    const pieds = s.y + h2
    if (d.écrasable && s.dy > 0 && pieds - s.dy <= e.y + 6) {
      e.vivant = false; e.mortT = 22; s.écrasés++
      const pts = [100, 200, 400, 800, 1000][Math.min(s.combo, 4)]; s.combo++; s.comboMax = Math.max(s.comboMax, s.combo); s.score += pts
      s.vy = entrée.saut ? -PHYS.rebondSaut : -PHYS.rebond; s.sol = false; s.surf = null
      s.événements.push({ t: 'écrase', x: e.x + e.w / 2, y: e.y, pts })
    } else blesser(s)
  }
  if (s.statut === 'jeu' && s.y > HAUTEUR * TUILE + 24) { s.grand = false; mourir(s) }
  return s
}
