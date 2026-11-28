// Rendu pixel-perfect (écran logique 256×144) : parallaxe à plusieurs plans, tuiles, entités animées par sprites, HUD bitmap.
import { VUE_L, VUE_H, TUILE, HAUTEUR, JOUEUR, SOL_Y } from './config.js'
import { NIVEAUX } from './niveaux.js'
import { créerAtlas, dessinerTexte, largeurTexte } from './sprites.js'

const O_BLANC = { couleur: '#fff', ombre: '#000', align: 'left', échelle: 1 }
const O_CENTRE = { couleur: '#fff', ombre: '#000', align: 'center', échelle: 1 }
const O_DROITE = { couleur: '#fff', ombre: '#000', align: 'right', échelle: 1 }
const O_BLEU = { couleur: '#7cf', ombre: '#000', align: 'center', échelle: 1 }
const O_JAUNE = { couleur: '#f8e028', ombre: '#000', align: 'center', échelle: 1 }
const O_GRAND = { couleur: '#fff', ombre: '#000', align: 'center', échelle: 2 }
const hash = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; return h }

export function créerRendu(niveau) {
  const atlas = créerAtlas(NIVEAUX[niveau].thème)
  const R = { atlas, marche: 0, rotation: 0 }
  const dessin = (g, nom, i, x, y, flip = false, dw = 0, dh = 0) => {
    const f = atlas.cadre(nom, i), w = f.w + dw, h = f.h + dh
    if (flip) { g.save(); g.translate(Math.round(x) + w, Math.round(y)); g.scale(-1, 1); g.drawImage(f.c, 0, 0, w, h); g.restore() }
    else if (dw || dh) g.drawImage(f.c, Math.round(x), Math.round(y), w, h)
    else g.drawImage(f.c, Math.round(x), Math.round(y))
  }
  R.dessin = dessin

  function fond(g, s, cam, t) {
    const bandes = atlas.coul.ciel, n = bandes.length, hb = Math.ceil(VUE_H / n)
    for (let i = 0; i < n; i++) { g.fillStyle = bandes[i]; g.fillRect(0, i * hb, VUE_L, hb) }
    const th = NIVEAUX[s.niveau].thème
    if (th === 2) {
      for (let i = 0; i < 26; i++) { const h = hash(i + 7); const x = ((h % 512) - cam.x * 0.04) % 256, y = (h >>> 9) % 70; dessin(g, 'etoile', ((t / 400) | 0) + i, ((x % 256) + 256) % 256, y) }
    }
    dessin(g, 'lune', 0, 208, 12 - cam.y * 0.02)
    // nuages (lents)
    for (let i = 0; i < 6; i++) {
      const h = hash(i + 31), larg = 320
      const x = (((h % larg) - cam.x * 0.12 - t * 0.004 * (1 + (i % 3))) % larg + larg) % larg - 60
      dessin(g, i % 2 ? 'nuage_b' : 'nuage_a', 0, x, 10 + (h >>> 8) % 34 - cam.y * 0.05)
    }
    // montagnes lointaines, collines : tuilées horizontalement
    const couche = (nom, vit, hSprite, yBase) => {
      const f = atlas.cadre(nom, 0), w = f.w, dec = -(((cam.x * vit) % w) + w) % w
      const y = Math.round(yBase - hSprite - cam.y * (vit * 0.8))
      for (let x = dec; x < VUE_L; x += w) g.drawImage(f.c, Math.round(x), y)
    }
    couche('fond_loin', 0.18, 64, SOL_Y - 4)
    couche('fond_milieu', 0.4, 48, SOL_Y)
  }

  function décors(g, s, cam, c0, c1) {
    // buissons, fleurs, arbres posés sur le sol (déterministes, jamais devant un tuyau ni un mât)
    for (let c = c0; c <= c1; c++) {
      if (s.grille[10][c] !== '#' || s.grille[9][c] !== '.' || s.grille[9][c + 1] === 'P' || s.grille[9][c - 1] === 'P') continue
      const h = hash(c * 13 + s.niveau * 101) % 17
      const x = c * TUILE - cam.x, y = SOL_Y - cam.y
      if (h === 0 && s.grille[8][c] === '.' && s.grille[8][c + 1] === '.') dessin(g, 'deco_arbre', 0, x - 8, y - 48)
      else if (h === 3) dessin(g, 'deco_buisson', 0, x, y - 16)
      else if (h === 6) dessin(g, 'deco_fleur', (hash(c) >>> 4) & 1, x, y - 16)
      else if (h === 9) dessin(g, 'deco_champi', 0, x, y - 16)
    }
    dessin(g, 'cabane', 0, (s.arrivéeC + 4) * TUILE - cam.x, s.arrivéeY - 32 - cam.y)
  }

  function tuiles(g, s, cam, c0, c1, r0, r1, t) {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const ch = s.grille[r][c]
      if (ch === '.' || ch === 'H' || ch === 'V') continue
      let x = c * TUILE - cam.x, y = r * TUILE - cam.y
      for (let k = 0; k < s.bosse.length; k++) { const b = s.bosse[k]; if (b.c === c && b.r === r) y -= Math.sin((b.t / 8) * Math.PI) * 4 }
      switch (ch) {
        case '#': dessin(g, s.grille[r - 1]?.[c] === '#' ? 'sol_terre' : 'sol_herbe', 0, x, y); break
        case 'B': dessin(g, 'brique', 0, x, y); break
        case '?': case 'M': dessin(g, 'bloc', ((t / 260) | 0) + c, x, y); break
        case 'U': dessin(g, 'bloc_vide', 0, x, y); break
        case '=': dessin(g, 'pierre', 0, x, y); break
        case 'P': { const haut = s.grille[r - 1]?.[c] !== 'P', gauche = s.grille[r]?.[c - 1] !== 'P'; dessin(g, (haut ? 'tuyau_h' : 'tuyau_c') + (gauche ? 'g' : 'd'), 0, x, y); break }
        case 'C': dessin(g, 'piece', ((t / 110) | 0) + c, x, y); break
        case 'K': dessin(g, s.point >= c ? 'point_on' : 'point_off', ((t / 200) | 0), x, y); break
        case 'F': if (s.grille[r - 1]?.[c] !== 'F') { dessin(g, 'mat_haut', 0, x, y); dessin(g, 'drapeau', ((t / 220) | 0), x + 8, y + 3 + (s.statut === 'arrivée' && s.finPhase === 0 ? Math.min(40, (s.y - 30)) * 0 : 0)) } else dessin(g, 'mat', 0, x, y); break
      }
    }
  }

  function joueur(g, s, t) {
    if (!s.visible) return
    if (s.invuln > 0 && s.statut === 'jeu' && ((s.invuln >> 2) & 1)) return
    const grand = s.grand, pré = grand ? 'grand_' : 'petit_', h = grand ? JOUEUR.hGrand : JOUEUR.hPetit
    let nom, i = 0, dw = 0, dh = 0
    const marche = Math.abs(s.vx)
    if (s.statut === 'mort') { nom = 'petit_mort'; i = (s.mortT >> 3) & 1 }
    else if (s.gel > 0) { nom = 'transfo'; i = (s.gel >> 2) % 3; if (s.gelType === 'rapetisse') i = 2 - i }
    else if (s.statut === 'arrivée' && s.finPhase === 0) { nom = pré + 'chute' }
    else if (s.statut === 'arrivée' && s.finPhase === 1) { if (s.finT < 28) { nom = pré + 'victoire'; i = (s.finT >> 3) & 1 } else { nom = pré + 'marche'; i = (s.finT >> 3) & 3 } }
    else if (!s.grand && s.invuln > 92 && s.gelType === 'rapetisse' && s.statut === 'jeu') nom = 'petit_degat'
    else if (s.statut === 'gagné') { nom = 'petit_victoire'; i = (t / 250) & 1 }
    else if (!s.sol) { nom = s.vy < 0 ? pré + 'saut' : pré + 'chute'; if (s.vy < -2) { dh = 1; dw = -1 } else if (s.vy > 3) { dh = 1; dw = -1 } }
    else if (s.atterritT > 0) nom = pré + 'atterrit'
    else if (s.frein) nom = pré + 'frein'
    else if (marche > 0.15) { R.marche += marche; nom = pré + (marche > 1.6 ? 'course' : 'marche'); i = Math.floor(R.marche / (marche > 1.6 ? 4 : 5)) & 3 }
    else { nom = pré + 'attente'; i = ((t / 520) | 0) & 1 }
    const f = atlas.cadre(nom, i)
    const hh = nom === 'transfo' ? 24 : f.h
    const x = s.x + JOUEUR.w / 2 - f.w / 2, y = s.y + h - hh
    return { nom, i, x, y, flip: s.dir < 0, dw, dh }
  }

  // dessine toute la scène ; `ui` : { intro, iris:{r,cx,cy}, étatPause }
  R.dessiner = (g, s, cam, fx, t, ui) => {
    g.imageSmoothingEnabled = false
    g.save()
    const sx = fx.secousse > 0 ? Math.round((Math.random() - 0.5) * fx.secousse) : 0, sy = fx.secousse > 0 ? Math.round((Math.random() - 0.5) * fx.secousse) : 0
    g.translate(sx, sy)
    const cx = Math.round(cam.x), cy = Math.round(cam.y), c = { x: cx, y: cy }
    fond(g, s, c, t)
    const c0 = Math.max(0, Math.floor(cx / TUILE)), c1 = Math.min(s.largeur - 1, Math.floor((cx + VUE_L) / TUILE))
    const r0 = Math.max(0, Math.floor(cy / TUILE)), r1 = Math.min(HAUTEUR - 1, Math.floor((cy + VUE_H) / TUILE))
    décors(g, s, c, c0, c1)
    tuiles(g, s, c, c0, c1, r0, r1, t)
    for (const p of s.plateformes) dessin(g, 'plateforme_mobile', 0, p.x - cx, p.y - cy)
    for (const o of s.objets) {
      if (o.émerge > 0) { g.save(); g.beginPath(); g.rect(Math.round(o.x - cx), Math.round(o.y - cy - 20), 16, 20 + 0); g.clip(); dessin(g, o.type === 'vie' ? 'vie' : 'champignon', ((t / 200) | 0), o.x - cx, o.y - cy); g.restore() }
      else dessin(g, o.type === 'vie' ? 'vie' : 'champignon', ((t / 200) | 0), o.x - cx + (16 - o.w) / 2, o.y - cy - (16 - o.h))
    }
    for (const e of s.ennemis) {
      const x = e.x + e.w / 2 - 8 - cx, y = e.y + e.h - 16 - cy
      if (x < -20 || x > VUE_L + 4) continue
      if (!e.vivant) { if (e.mortT > 0 && (e.mortT > 8 || (e.mortT >> 1) & 1)) dessin(g, e.type + '_ecrase', 0, x, y); continue }
      const f = ((e.t / (e.type === 'rampant' && e.charge ? 5 : 12)) | 0) & 1
      let nom = e.type + '_marche', i = f
      if (e.type === 'sauteur') { nom = e.sol ? 'sauteur_sol' : 'sauteur_air'; i = 0 }
      else if (e.type === 'chauve') nom = 'chauve_vol'
      else if (e.type === 'rampant' && e.charge) nom = 'rampant_charge'
      dessin(g, nom, i, x, y, e.dir > 0)
    }
    const pj = joueur(g, s, t)
    if (pj) dessin(g, pj.nom, pj.i, pj.x - cx - pj.dw / 2 * 0, pj.y - cy - pj.dh, pj.flip, pj.dw, pj.dh)
    // particules
    for (const p of fx.parts) {
      if (!p.on) continue
      const x = Math.round(p.x - cx), y = Math.round(p.y - cy)
      if (p.type === 2) dessin(g, 'debris', ((p.vie >> 2) + p.f) & 3, x - 4, y - 4)
      else if (p.type === 1) { if (p.vie > 6 || (p.vie & 1)) dessin(g, 'etincelle', ((p.vie >> 2) + p.f) & 3, x - 4, y - 4) }
      else if (p.type === 3) { g.fillStyle = ['#f8e028', '#ff5c5c', '#7cf', '#9f6'][p.f & 3]; g.fillRect(x, y, 2, 2) }
      else { g.fillStyle = atlas.coul.texte; g.globalAlpha = Math.min(1, p.vie / 8); g.fillRect(x, y, 2, 2); g.globalAlpha = 1 }
    }
    for (const tx of fx.textes) {
      if (!tx.on) continue
      const o = tx.coul === 1 ? O_BLEU : tx.coul === 2 ? O_JAUNE : O_CENTRE
      dessinerTexte(g, tx.txt, Math.round(tx.x - cx), Math.round(tx.y - cy), o)
    }
    g.restore()
    if (fx.flash > 0) { g.globalAlpha = fx.flash / 14; g.fillStyle = '#fff'; g.fillRect(0, 0, VUE_L, VUE_H); g.globalAlpha = 1 }
    R.hud(g, s, t)
    if (ui.aide) dessinerTexte(g, ui.aide, VUE_L / 2, 128, O_CENTRE)
    if (ui.iris) R.iris(g, ui.iris.r, ui.iris.cx, ui.iris.cy)
    if (ui.intro > 0) R.intro(g, s, ui.intro)
    if (s.statut === 'attente') R.attente(g, s)
  }

  R.hud = (g, s) => {
    const y = 3
    dessin(g, 'icone_coeur', 0, 4, y); dessinerTexte(g, '×' + s.vies, 14, y + 1, O_BLANC)
    dessin(g, 'icone_piece', 0, 38, y); dessinerTexte(g, String(s.pièces).padStart(2, '0') + '/' + s.piècesTotal, 48, y + 1, O_BLANC)
    if (s.grand) dessin(g, 'icone_champi', 0, 92, y)
    dessinerTexte(g, 'NIV ' + (s.niveau + 1), 118, y + 1, O_CENTRE)
    dessin(g, 'icone_horloge', 0, 140, y); dessinerTexte(g, String(Math.floor(s.temps / 60)).padStart(3, '0'), 150, y + 1, O_BLANC)
    dessinerTexte(g, String(s.score).padStart(6, '0'), VUE_L - 46, y + 1, O_DROITE)
  }
  R.intro = (g, s, k) => {
    const a = Math.min(1, k / 20)
    g.globalAlpha = a; g.fillStyle = atlas.coul.iris; g.fillRect(0, 0, VUE_L, VUE_H)
    dessinerTexte(g, 'NIVEAU ' + (s.niveau + 1), VUE_L / 2, 40, O_CENTRE)
    dessinerTexte(g, NIVEAUX[s.niveau].nom.toUpperCase(), VUE_L / 2, 58, O_GRAND)
    dessinerTexte(g, '★ TERMINE   ★ 80% DES PIECES   ★ SANS PERTE', VUE_L / 2, 92, O_CENTRE)
    dessinerTexte(g, 'APPUIE SUR UNE TOUCHE', VUE_L / 2, 112, O_CENTRE)
    g.globalAlpha = 1
  }
  R.attente = (g, s) => {
    const a = Math.min(1, s.attT / 10, (80 - s.attT) / 12)
    g.globalAlpha = Math.max(0, a); g.fillStyle = atlas.coul.iris; g.fillRect(0, 0, VUE_L, VUE_H)
    const f = atlas.cadre('petit_attente', 0); g.drawImage(f.c, 100, 56)
    dessinerTexte(g, '×' + s.vies, 122, 60, O_BLANC)
    dessinerTexte(g, 'VIE PERDUE', VUE_L / 2, 82, O_CENTRE)
    g.globalAlpha = 1
  }
  // iris pixel-perfect : r = rayon (0 = tout noir) ; spans ligne par ligne, sans anti-crénelage
  R.iris = (g, r, cx, cy) => {
    g.fillStyle = atlas.coul.iris
    for (let y = 0; y < VUE_H; y++) {
      const dy = y - cy, d = r * r - dy * dy
      if (d <= 0) { g.fillRect(0, y, VUE_L, 1); continue }
      const w = Math.floor(Math.sqrt(d))
      if (cx - w > 0) g.fillRect(0, y, cx - w, 1)
      if (cx + w < VUE_L) g.fillRect(cx + w, y, VUE_L - cx - w, 1)
    }
  }
  return R
}
export { largeurTexte }
