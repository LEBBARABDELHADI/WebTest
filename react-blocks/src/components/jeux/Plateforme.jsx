import { useEffect, useRef, useState } from 'react'
import { nouvelÉtat, pas, hauteurJ, étoiles, J } from '../../lib/jeux/moteur'
import { NIVEAUX, HAUTEUR, TUILE } from '../../lib/jeux/niveaux'
import { activer, sfx, musique, régler, estMuet } from '../../lib/jeux/audio'

const W = 640, H = HAUTEUR * TUILE
const CLAVIER = { ArrowLeft: 'gauche', KeyA: 'gauche', KeyQ: 'gauche', ArrowRight: 'droite', KeyD: 'droite', Space: 'saut', ArrowUp: 'saut', KeyW: 'saut', KeyZ: 'saut', ShiftLeft: 'course', ShiftRight: 'course', KeyX: 'course' }
const INTRO = 110

function dessiner(g, s, cam, parts, textes, t, intro, shake) {
  const th = NIVEAUX[s.niveau].thème
  g.save()
  if (shake > 0) g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
  const ciel = g.createLinearGradient(0, 0, 0, H); ciel.addColorStop(0, th.ciel[0]); ciel.addColorStop(1, th.ciel[1])
  g.fillStyle = ciel; g.fillRect(-10, -10, W + 20, H + 20)
  if (th.nuit) {
    g.fillStyle = '#fff'
    for (let i = 0; i < 40; i++) { const x = (i * 97 + 13) % W, y = (i * 53 + 7) % 200; g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t / 700 + i)); g.fillRect(x - cam * 0.03 % W, y, 2, 2) }
    g.globalAlpha = 1; g.fillStyle = '#f4f1d0'; g.beginPath(); g.arc(540, 60, 26, 0, 7); g.fill(); g.fillStyle = th.ciel[0]; g.beginPath(); g.arc(550, 54, 22, 0, 7); g.fill()
  }
  g.fillStyle = th.nuage
  for (let i = 0; i < 12; i++) { const x = ((i * 260 - cam * 0.2) % (W + 300) + W + 300) % (W + 300) - 100, y = 30 + (i * 37) % 80; g.beginPath(); g.ellipse(x, y, 42, 16, 0, 0, 7); g.ellipse(x + 26, y - 8, 30, 14, 0, 0, 7); g.ellipse(x - 26, y - 4, 26, 12, 0, 0, 7); g.fill() }
  g.fillStyle = th.colline
  for (let i = 0; i < 10; i++) { const x = ((i * 300 - cam * 0.5) % (W + 400) + W + 400) % (W + 400) - 150; g.beginPath(); g.ellipse(x, 9 * TUILE, 130, 90 - (i % 3) * 14, 0, Math.PI, 0); g.fill() }
  g.save(); g.translate(-Math.round(cam), 0)
  const c0 = Math.max(0, Math.floor(cam / TUILE)), c1 = Math.min(s.largeur - 1, c0 + W / TUILE + 1)
  for (let r = 0; r < HAUTEUR; r++) for (let c = c0; c <= c1; c++) {
    const ch = s.grille[r][c]; if (ch === '.') continue
    const x = c * TUILE; let y = r * TUILE
    const b = s.bosse.find(q => q.c === c && q.r === r); if (b) y -= Math.sin((b.t / 8) * Math.PI) * 8
    if (ch === '#') { const herbe = r === 0 || s.grille[r - 1][c] !== '#'; g.fillStyle = th.terre; g.fillRect(x, y, TUILE, TUILE); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + TUILE - 4, TUILE, 4); if (herbe) { g.fillStyle = th.herbe[0]; g.fillRect(x, y, TUILE, 8); g.fillStyle = th.herbe[1]; g.fillRect(x, y, TUILE, 3) } }
    else if (ch === 'B' || ch === '=') { g.fillStyle = ch === 'B' ? '#c8693a' : '#8a6bd1'; g.fillRect(x, y, TUILE, TUILE); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, TUILE - 2, TUILE - 2); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 2, y + 2, TUILE - 4, 4) }
    else if (ch === '?' || ch === 'M' || ch === 'U') { g.fillStyle = ch === 'U' ? '#8c8c8c' : '#f7b733'; g.fillRect(x, y, TUILE, TUILE); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, TUILE - 2, TUILE - 2); if (ch !== 'U') { g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('?', x + 16, y + 24 + Math.sin(t / 200 + c) * 0) } }
    else if (ch === 'P') { const haut = s.grille[r - 1]?.[c] !== 'P'; const gauche = s.grille[r]?.[c - 1] !== 'P'; g.fillStyle = '#2fa84f'; g.fillRect(haut ? x - 2 : x, y, TUILE + (haut ? 4 : 0), TUILE); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(gauche ? x + 4 : x + 4, y, 5, TUILE); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x + TUILE - 6, y, 6, TUILE); if (haut) { g.strokeStyle = '#17692e'; g.lineWidth = 2; g.strokeRect(x - 1, y + 1, TUILE + 2, TUILE - 2) } }
    else if (ch === 'C') { const w = Math.abs(Math.cos(t / 220 + c)) * 9 + 2; g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(x + 16, y + 16, w, 11, 0, 0, 7); g.fill(); g.strokeStyle = '#c99a00'; g.lineWidth = 2; g.stroke() }
    else if (ch === 'K') { const actif = s.point >= c; g.fillStyle = '#d9d9d9'; g.fillRect(x + 14, y, 4, TUILE); if (s.grille[r - 1]?.[c] !== 'K') { g.fillStyle = actif ? '#2fbf5b' : '#8d8d8d'; g.beginPath(); g.moveTo(x + 18, y + 2); g.lineTo(x + 34, y + 9); g.lineTo(x + 18, y + 16); g.fill() } }
    else if (ch === 'F') { if (s.grille[r - 1][c] !== 'F') { g.fillStyle = '#e63946'; g.beginPath(); g.moveTo(x + 14, y); g.lineTo(x - 14, y + 10 + Math.sin(t / 180) * 2); g.lineTo(x + 14, y + 20); g.fill() } g.fillStyle = '#e9e9e9'; g.fillRect(x + 13, y, 5, TUILE) }
  }
  for (const m of s.objets) { g.fillStyle = '#f4f4f4'; g.beginPath(); g.ellipse(m.x + 12, m.y + 18, 8, 7, 0, 0, 7); g.fill(); g.fillStyle = '#e63946'; g.beginPath(); g.ellipse(m.x + 12, m.y + 10, 13, 10, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(m.x + 7, m.y + 7, 3, 0, 7); g.arc(m.x + 17, m.y + 6, 3, 0, 7); g.fill() }
  for (const e of s.ennemis) {
    if (!e.vivant && e.écrasé <= 0) continue
    const h = e.vivant ? e.h : 8, y = e.y + e.h - h
    if (e.type === 'pic') {
      g.fillStyle = '#b4232f'; g.beginPath(); g.ellipse(e.x + 13, y + h / 2 + 2, 14, h / 2 + 2, 0, 0, 7); g.fill()
      if (e.vivant) { g.fillStyle = '#f4f4f4'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(e.x + 2 + k * 7, y + 6); g.lineTo(e.x + 5.5 + k * 7, y - 5); g.lineTo(e.x + 9 + k * 7, y + 6); g.fill() } g.fillStyle = '#fff'; g.fillRect(e.x + 6, y + 10, 5, 5); g.fillRect(e.x + 15, y + 10, 5, 5); g.fillStyle = '#111'; g.fillRect(e.x + 8 + e.dir, y + 12, 2, 3); g.fillRect(e.x + 17 + e.dir, y + 12, 2, 3) }
    } else {
      g.fillStyle = '#8b4a2b'; g.beginPath(); g.ellipse(e.x + 13, y + h / 2 + 2, 14, h / 2 + 2, 0, 0, 7); g.fill()
      if (e.vivant) { g.fillStyle = '#fff'; g.fillRect(e.x + 6, y + 6, 5, 6); g.fillRect(e.x + 15, y + 6, 5, 6); g.fillStyle = '#111'; g.fillRect(e.x + 8 + e.dir, y + 8, 2, 3); g.fillRect(e.x + 17 + e.dir, y + 8, 2, 3); const p = Math.sin(t / 90) * 3; g.fillStyle = '#3b2314'; g.fillRect(e.x + 3 + p, y + h - 2, 7, 4); g.fillRect(e.x + 16 - p, y + h - 2, 7, 4) }
    }
  }
  // joueur : coordonnées locales, origine aux pieds, étirement/écrasement selon la vitesse verticale
  if (!(s.invuln > 0 && Math.floor(s.invuln / 4) % 2 === 0 && s.statut === 'jeu')) {
    const h = hauteurJ(s), k = h / 30, air = !s.sol && s.statut !== 'mort'
    const sy = air ? 1 + Math.max(-0.12, Math.min(0.14, -s.vy * 0.016)) : 1, sx = 1 / sy
    const marche = s.sol && Math.abs(s.vx) > 0.6 ? Math.sin(t / 55) * 3.5 : 0
    g.save(); g.translate(s.x + J.w / 2, s.y + h); g.scale(s.dir * k * sx, k * sy)
    if (s.statut === 'mort') g.rotate(Math.sin(s.mortT / 5) * 0.4)
    g.fillStyle = '#2b4acb'; g.fillRect(-8, -14, 16, 9); g.fillRect(-8 + marche, -7, 7, 7); g.fillRect(1 - marche, -7, 7, 7)
    g.fillStyle = '#3b2314'; g.fillRect(-9 + marche, -2, 8, 3); g.fillRect(1 - marche, -2, 8, 3)
    g.fillStyle = '#e63946'; g.fillRect(-9, -22, 18, 9)
    g.fillStyle = '#f2c29b'; g.fillRect(air ? 7 : -12, air ? -26 : -18, 5, 4); g.fillRect(-7, -29, 14, 9)
    g.fillStyle = '#e63946'; g.fillRect(-9, -32, 18, 6); g.fillRect(2, -27, 10, 3)
    g.fillStyle = '#111'; g.fillRect(2, -25, 2, 3); g.fillStyle = '#4a2a14'; g.fillRect(1, -21, 8, 2)
    g.restore()
  }
  for (const p of parts) { g.globalAlpha = Math.max(0, p.vie / 30); g.fillStyle = p.c; g.fillRect(p.x, p.y, p.t || 4, p.t || 4) }
  g.globalAlpha = 1
  g.font = 'bold 15px sans-serif'; g.textAlign = 'center'
  for (const tx of textes) { g.globalAlpha = Math.min(1, tx.vie / 20); g.fillStyle = '#000'; g.fillText(tx.txt, tx.x + 1, tx.y + 1); g.fillStyle = '#fff'; g.fillText(tx.txt, tx.x, tx.y) }
  g.globalAlpha = 1
  g.restore()
  g.restore()
  // HUD
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, 26)
  g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.textAlign = 'left'
  g.fillText(`❤ ${s.vies}${s.grand ? '  🍄' : ''}   🪙 ${s.pièces}/${s.piècesTotal}`, 10, 18); g.textAlign = 'center'; g.fillText(`★ ${s.score}`, W / 2, 18); g.textAlign = 'right'; g.fillText(`⏱ ${Math.floor(s.temps / 60)} s`, W - 112, 18)
  if (intro > 0) {
    const a = Math.min(1, intro / 25, (INTRO - intro) / 12 + 0.2)
    g.fillStyle = `rgba(0,0,0,${0.55 * a})`; g.fillRect(0, 0, W, H)
    g.globalAlpha = a; g.fillStyle = '#fff'; g.textAlign = 'center'
    g.font = 'bold 18px sans-serif'; g.fillText(`NIVEAU ${s.niveau + 1}`, W / 2, H / 2 - 22)
    g.font = 'italic 40px Georgia, serif'; g.fillText(NIVEAUX[s.niveau].nom, W / 2, H / 2 + 20)
    g.font = '14px sans-serif'; g.fillText('Touche pour commencer', W / 2, H / 2 + 52); g.globalAlpha = 1
  }
}

export default function Plateforme({ T, niveau, aSuivant, onFin, onSuivant, onMenu }) {
  const conteneur = useRef(null), cv = useRef(null)
  const etat = useRef(nouvelÉtat(niveau)), ent = useRef({}), parts = useRef([]), textes = useRef([]), fini = useRef(false), pauseRef = useRef(false)
  const cam = useRef({ x: 0, look: 0 }), intro = useRef(INTRO), secousse = useRef(0), échelle = useRef(1), onFinRef = useRef(onFin)
  const [fin, setFin] = useState(null)
  const [pause, setPause] = useState(false)
  const [muet, setMuet] = useState(estMuet)
  const [plein, setPlein] = useState(() => { try { return localStorage.getItem('react-blocs-jeux-grand') !== '0' } catch { return true } })
  const [portrait, setPortrait] = useState(() => window.matchMedia?.('(orientation: portrait)').matches)
  const pleinRef = useRef(plein), réel = useRef(false), essayé = useRef(false), basculerRef = useRef(() => {})
  pleinRef.current = plein
  const [tactile] = useState(() => window.matchMedia?.('(pointer: coarse)').matches)
  onFinRef.current = onFin
  const réduit = useRef(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  const basculerPause = v => { pauseRef.current = v; setPause(v); musique(!v && !muet, niveau) }
  const recommencer = () => { etat.current = nouvelÉtat(niveau); parts.current = []; textes.current = []; fini.current = false; intro.current = INTRO; cam.current = { x: 0, look: 0 }; setFin(null); basculerPause(false) }

  useEffect(() => {
    if (!plein) return
    const a = document.body.style.overflow, b = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'; document.documentElement.style.overscrollBehavior = 'none'
    return () => { document.body.style.overflow = a; document.documentElement.style.overscrollBehavior = b }
  }, [plein])

  useEffect(() => {
    const clavier = (v, e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') { if (v && !e.repeat && !fini.current) basculerPause(!pauseRef.current); e.preventDefault(); return }
      if (e.code === 'KeyF') { if (v && !e.repeat) basculerRef.current(); e.preventDefault(); return }
      const k = CLAVIER[e.code]; if (!k) return
      ent.current[k] = v; e.preventDefault()
      if (v) { activer(); essayerPleinÉcran(); if (intro.current > 0 && intro.current < INTRO - 20) intro.current = 0 }
    }
    const bas = e => clavier(true, e), haut = e => clavier(false, e)
    const cacher = () => { if (document.hidden && !fini.current) basculerPause(true) }
    window.addEventListener('keydown', bas); window.addEventListener('keyup', haut); document.addEventListener('visibilitychange', cacher)
    const obs = new ResizeObserver(() => { const cssW = cv.current.clientWidth; échelle.current = Math.min(3, Math.max(1, (cssW * (window.devicePixelRatio || 1)) / W)); cv.current.width = Math.round(W * échelle.current); cv.current.height = Math.round(H * échelle.current) })
    obs.observe(cv.current)
    const g = cv.current.getContext('2d')
    if (import.meta.env.DEV) window.__jeu = etat
    let id, dernier = performance.now(), reste = 0, boutonPause = false
    const boucle = now => {
      const gp = navigator.getGamepads?.()[0], s = etat.current
      const clavierEnt = { ...ent.current }
      if (gp) {
        const ax = gp.axes[0] || 0
        if (ax < -0.35 || gp.buttons[14]?.pressed) clavierEnt.gauche = true
        if (ax > 0.35 || gp.buttons[15]?.pressed) clavierEnt.droite = true
        if (gp.buttons[0]?.pressed || gp.buttons[3]?.pressed) clavierEnt.saut = true
        if (gp.buttons[1]?.pressed || gp.buttons[2]?.pressed || gp.buttons[7]?.pressed) clavierEnt.course = true
        const start = !!gp.buttons[9]?.pressed
        if (start && !boutonPause && !fini.current) basculerPause(!pauseRef.current)
        boutonPause = start
        if (Object.values(clavierEnt).some(Boolean)) activer()
        if ((clavierEnt.saut || clavierEnt.gauche || clavierEnt.droite) && intro.current > 0 && intro.current < INTRO - 20) intro.current = 0
      }
      reste += Math.min(100, now - dernier); dernier = now
      while (reste >= 1000 / 60) {
        reste -= 1000 / 60
        if (pauseRef.current) continue
        if (intro.current > 0) { intro.current--; if (intro.current === 0) musique(!estMuet(), niveau); continue }
        pas(s, clavierEnt)
        for (const ev of s.événements) {
          sfx(ev.t === 'écrase' ? 'écrase' : ev.t === 'victoire' ? 'victoire' : ev.t)
          if (ev.t === 'mort') { musique(false); navigator.vibrate?.(40); secousse.current = réduit.current ? 0 : 10 }
          if (ev.t === 'rapetisse') { navigator.vibrate?.(30); secousse.current = réduit.current ? 0 : 8 }
          if (ev.t === 'écrase') secousse.current = réduit.current ? 0 : 3
          if (ev.t === 'victoire') { musique(false); navigator.vibrate?.([30, 40, 60]) }
          if (ev.pts) textes.current.push({ x: ev.x, y: ev.y, txt: `+${ev.pts}`, vie: 45 })
          if (ev.t === 'point') textes.current.push({ x: ev.x, y: ev.y - 10, txt: 'Point de passage !', vie: 70 })
          if (ev.t === 'agrandir') textes.current.push({ x: ev.x, y: ev.y - 14, txt: 'Grand !', vie: 60 })
          const n = ev.t === 'pièce' ? 7 : ev.t === 'atterrit' || ev.t === 'saut' ? 4 : ev.t === 'brique' ? 10 : ev.t === 'écrase' ? 8 : 0
          for (let i = 0; i < n; i++) parts.current.push({ x: ev.x, y: ev.y, vx: (Math.random() - 0.5) * (ev.t === 'saut' || ev.t === 'atterrit' ? 3 : 4.5), vy: ev.t === 'saut' || ev.t === 'atterrit' ? -Math.random() * 1.2 : -Math.random() * 4, vie: 30, c: ev.t === 'pièce' ? '#ffd23f' : ev.t === 'brique' ? '#c8693a' : '#e8e8e8', t: ev.t === 'saut' || ev.t === 'atterrit' ? 3 : 4 })
        }
        if (s.statut === 'jeu' && s.sol && Math.abs(s.vx) > 3 && s.temps % 6 === 0) parts.current.push({ x: s.x + 10, y: s.y + hauteurJ(s), vx: -s.dir * Math.random(), vy: -Math.random() * 0.6, vie: 18, c: 'rgba(235,235,235,.8)', t: 3 })
        parts.current = parts.current.filter(p => p.vie > 0).map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.2, vie: p.vie - 1 }))
        textes.current = textes.current.filter(t => t.vie > 0).map(t => ({ ...t, y: t.y - 0.7, vie: t.vie - 1 }))
        if (secousse.current > 0) secousse.current = Math.max(0, secousse.current - 0.6)
        const cible = Math.max(0, Math.min(s.largeur * TUILE - W, s.x + J.w / 2 - W / 2 + cam.current.look))
        cam.current.look += (s.dir * 60 - cam.current.look) * 0.03
        cam.current.x += (cible - cam.current.x) * (s.statut === 'mort' ? 0 : 0.14)
        if (s.statut !== 'jeu' && s.statut !== 'mort' && !fini.current) {
          fini.current = true
          const bilan = { statut: s.statut, score: s.score, pièces: s.pièces, total: s.piècesTotal, temps: s.temps, étoiles: étoiles(s), mortsNiveau: s.mortsNiveau, écrasés: s.écrasés, aGrandi: s.aGrandi }
          if (s.statut === 'perdu') { musique(false); sfx('mort') }
          setTimeout(() => { setFin(bilan); onFinRef.current?.(bilan) }, s.statut === 'gagné' ? 900 : 300)
        }
      }
      g.setTransform(échelle.current, 0, 0, échelle.current, 0, 0)
      dessiner(g, s, cam.current.x, parts.current, textes.current, now, intro.current, secousse.current)
      id = requestAnimationFrame(boucle)
    }
    cam.current.x = Math.max(0, Math.min(etat.current.largeur * TUILE - W, etat.current.x - W / 2))
    id = requestAnimationFrame(boucle)
    const changerPlein = () => { if (!document.fullscreenElement && réel.current) { réel.current = false; setPlein(false); try { localStorage.setItem('react-blocs-jeux-grand', '0') } catch { /* ignore */ } } }
    const orientation = window.matchMedia?.('(orientation: portrait)'); const surOrientation = e => { setPortrait(e.matches); if (e.matches && tactile && pleinRef.current && !fini.current) basculerPause(true) }
    orientation?.addEventListener?.('change', surOrientation)
    document.addEventListener('fullscreenchange', changerPlein)
    return () => { cancelAnimationFrame(id); obs.disconnect(); musique(false); window.removeEventListener('keydown', bas); window.removeEventListener('keyup', haut); document.removeEventListener('visibilitychange', cacher); document.removeEventListener('fullscreenchange', changerPlein); orientation?.removeEventListener?.('change', surOrientation) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [niveau])

  const entrerPleinÉcran = async () => {
    const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen
    if (!f || document.fullscreenElement) return
    try { réel.current = true; await f.call(el); try { await screen.orientation?.lock?.('landscape') } catch { /* verrou non supporté */ } } catch { réel.current = false }
  }
  function essayerPleinÉcran() { if (pleinRef.current && !essayé.current && !document.fullscreenElement) { essayé.current = true; entrerPleinÉcran() } }
  const basculerPlein = async () => {
    const v = !pleinRef.current
    setPlein(v); try { localStorage.setItem('react-blocs-jeux-grand', v ? '1' : '0') } catch { /* ignore */ }
    if (v) { essayé.current = true; await entrerPleinÉcran() } else { réel.current = false; if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}) }
  }
  basculerRef.current = basculerPlein
  const basculerMuet = () => { const v = !muet; setMuet(v); régler(v); activer(); musique(!v && !pauseRef.current && intro.current === 0 && !fini.current, niveau) }

  const touche = (k, lib, extra = {}) => (
    <button aria-label={lib} onContextMenu={e => e.preventDefault()}
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); ent.current[k] = true; activer(); essayerPleinÉcran(); if (intro.current > 0 && intro.current < INTRO - 20) intro.current = 0; navigator.vibrate?.(8) }}
      onPointerUp={() => { ent.current[k] = false }} onPointerCancel={() => { ent.current[k] = false }}
      style={{ width: 70, height: 70, borderRadius: 35, border: '2px solid rgba(255,255,255,.55)', background: 'rgba(20,20,30,.5)', color: '#fff', fontSize: 26, fontWeight: 800, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent', ...extra }}>{lib}</button>
  )
  const petit = { width: 40, height: 40, borderRadius: 20, border: '1px solid rgba(255,255,255,.4)', background: 'rgba(20,20,30,.55)', color: '#fff', fontSize: 17, cursor: 'pointer', display: 'grid', placeItems: 'center' }
  const btn = (plein = false) => ({ minHeight: 46, padding: '0 20px', borderRadius: 12, border: plein ? 'none' : '1px solid rgba(255,255,255,.5)', background: plein ? '#ffd23f' : 'transparent', color: plein ? '#222' : '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' })
  return (
    <div ref={conteneur} onPointerDown={() => { activer(); essayerPleinÉcran() }} style={plein ? { position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overscrollBehavior: 'none', touchAction: 'none', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' } : {}}>
      <div style={{ position: 'relative', width: plein ? 'min(100vw, calc(100dvh * 640 / 352))' : 'min(100%, 896px, calc((100dvh - 110px) * 640 / 352))', maxWidth: 'none', margin: '0 auto', aspectRatio: `${W}/${H}`, borderRadius: plein ? 0 : 14, overflow: 'hidden', border: plein ? 'none' : `1px solid ${T.border}`, background: '#000', touchAction: 'none' }}>
        <canvas ref={cv} width={W} height={H} onDoubleClick={basculerPlein} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label={`Super Plombier, niveau ${niveau + 1}`} />
        <div style={{ position: 'absolute', top: 0, right: 4, height: 26, display: 'flex', gap: 2, alignItems: 'center' }}>
          <button onClick={() => basculerPause(!pause)} aria-label="Pause" style={{ ...petit, width: 30, height: 26, borderRadius: 6, fontSize: 15, border: 'none', background: 'transparent' }}>{pause ? '▶' : '⏸'}</button>
          <button onClick={basculerMuet} aria-label={muet ? 'Activer le son' : 'Couper le son'} style={{ ...petit, width: 30, height: 26, borderRadius: 6, fontSize: 15, border: 'none', background: 'transparent' }}>{muet ? '🔇' : '🔊'}</button>
          <button onClick={basculerPlein} aria-label={plein ? 'Quitter le grand écran' : 'Grand écran'} style={{ ...petit, width: 30, height: 26, borderRadius: 6, fontSize: 15, border: 'none', background: 'transparent' }}>{plein ? '🗗' : '⛶'}</button>
        </div>
        {tactile && !fin && !pause && (
          <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', gap: 10, pointerEvents: 'auto' }}>{touche('gauche', '◀')}{touche('droite', '▶')}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', pointerEvents: 'auto' }}>{touche('course', 'B', { width: 56, height: 56, fontSize: 20 })}{touche('saut', 'A', { width: 78, height: 78, background: 'rgba(230,57,70,.75)', borderColor: 'rgba(255,255,255,.7)' })}</div>
          </div>
        )}
        {tactile && plein && portrait && !fin && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', gap: 8, zIndex: 5 }}>
            <div style={{ fontSize: 44 }}>↻ 📱</div><div style={{ fontWeight: 800, fontSize: 17 }}>Tourne ton téléphone en paysage</div><div style={{ fontSize: 13, opacity: .8 }}>Le jeu est en pause</div>
          </div>
        )}
        {pause && !fin && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#fff' }}>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>⏸ Pause</div>
            <button onClick={() => basculerPause(false)} style={btn(true)}>Reprendre</button>
            <button onClick={recommencer} style={btn()}>Recommencer le niveau</button>
            <button onClick={onMenu} style={btn()}>Quitter vers le menu</button>
          </div>
        )}
        {fin && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800 }}>{fin.statut === 'gagné' ? '🏁 Niveau terminé !' : '💀 Plus de vies'}</div>
            {fin.statut === 'gagné' && <div style={{ fontSize: 'clamp(26px, 7vw, 38px)', letterSpacing: 6 }} aria-label={`${fin.étoiles} étoiles sur 3`}>{[1, 2, 3].map(i => <span key={i} style={{ color: i <= fin.étoiles ? '#ffd23f' : '#555' }}>★</span>)}</div>}
            <div style={{ fontSize: 14, opacity: .9 }}>Score {fin.score} · pièces {fin.pièces}/{fin.total} · {Math.floor(fin.temps / 60)} s</div>
            {fin.statut === 'gagné' && <div style={{ fontSize: 12, opacity: .7 }}>★ terminer · ★ 80 % des pièces · ★ sans perdre de vie</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
              {fin.statut === 'gagné' && aSuivant && <button onClick={onSuivant} style={btn(true)}>Niveau suivant ▶</button>}
              <button onClick={recommencer} style={btn(fin.statut !== 'gagné' || !aSuivant)}>Rejouer</button>
              <button onClick={onMenu} style={btn()}>Menu</button>
            </div>
          </div>
        )}
      </div>
      {!plein && <div style={{ textAlign: 'center', marginTop: 12 }}><button onClick={basculerPlein} style={{ minHeight: 44, padding: '0 20px', borderRadius: 12, border: '2px solid #107c10', background: '#107c10', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>🖥️ Passer en grand écran (F)</button></div>}
      {!plein && <p style={{ textAlign: 'center', color: T.textMuted, fontSize: 12.5, margin: '10px 0 0', lineHeight: 1.5 }}>{tactile ? 'Boutons à l\'écran · garde A appuyé pour sauter plus haut · B pour courir · ⛶ pour le plein écran' : '← → ou Q/D : bouger · Espace ou ↑ : sauter (reste appuyé = plus haut) · Maj : courir · F : grand écran · Échap/P : pause · manette Xbox compatible'}</p>}
    </div>
  )
}
