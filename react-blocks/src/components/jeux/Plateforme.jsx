import { useEffect, useRef, useState } from 'react'
import { nouvelÉtat, pas, J } from '../../lib/jeux/moteur'
import { LARGEUR, HAUTEUR, TUILE, PIÈCES_TOTAL } from '../../lib/jeux/niveau1'

const W = 640, H = HAUTEUR * TUILE
const TOUCHES = { ArrowLeft: 'gauche', KeyA: 'gauche', KeyQ: 'gauche', ArrowRight: 'droite', KeyD: 'droite', Space: 'saut', ArrowUp: 'saut', KeyW: 'saut', KeyZ: 'saut', ShiftLeft: 'course', ShiftRight: 'course', KeyX: 'course' }

// Petit synthé WebAudio : aucun fichier son.
function bip(ctx, f1, f2, d, type = 'square', vol = 0.06) {
  if (!ctx) return
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + d)
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d)
}
const SONS = { saut: ctx => bip(ctx, 300, 700, 0.15), pièce: ctx => { bip(ctx, 988, 988, 0.07); setTimeout(() => bip(ctx, 1319, 1319, 0.18), 70) }, écrase: ctx => bip(ctx, 220, 80, 0.15, 'sawtooth'), mort: ctx => bip(ctx, 500, 60, 0.7, 'sawtooth', 0.08), victoire: ctx => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => bip(ctx, f, f, 0.2), i * 120)) }

function dessiner(g, s, parts, t) {
  const cam = Math.max(0, Math.min(LARGEUR * TUILE - W, s.x + J.w / 2 - W / 2))
  const ciel = g.createLinearGradient(0, 0, 0, H); ciel.addColorStop(0, '#4aa8ff'); ciel.addColorStop(1, '#bfe6ff')
  g.fillStyle = ciel; g.fillRect(0, 0, W, H)
  // parallaxe : nuages lents, collines moyennes
  g.fillStyle = 'rgba(255,255,255,.85)'
  for (let i = 0; i < 12; i++) { const x = ((i * 260 - cam * 0.2) % (W + 300) + W + 300) % (W + 300) - 100, y = 30 + (i * 37) % 80; g.beginPath(); g.ellipse(x, y, 42, 16, 0, 0, 7); g.ellipse(x + 26, y - 8, 30, 14, 0, 0, 7); g.ellipse(x - 26, y - 4, 26, 12, 0, 0, 7); g.fill() }
  g.fillStyle = '#7fcf8a'
  for (let i = 0; i < 10; i++) { const x = ((i * 300 - cam * 0.5) % (W + 400) + W + 400) % (W + 400) - 150; g.beginPath(); g.ellipse(x, 9 * TUILE, 130, 90 - (i % 3) * 14, 0, Math.PI, 0); g.fill() }
  g.save(); g.translate(-Math.round(cam), 0)
  const c0 = Math.floor(cam / TUILE), c1 = Math.min(LARGEUR - 1, c0 + W / TUILE + 1)
  for (let r = 0; r < HAUTEUR; r++) for (let c = c0; c <= c1; c++) {
    const ch = s.grille[r][c]; if (ch === '.') continue
    let x = c * TUILE, y = r * TUILE
    const b = s.bosse.find(q => q.c === c && q.r === r); if (b) y -= Math.sin((b.t / 8) * Math.PI) * 8
    if (ch === '#') { const herbe = r === 0 || s.grille[r - 1][c] !== '#'; g.fillStyle = '#9a5b2e'; g.fillRect(x, y, TUILE, TUILE); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + TUILE - 4, TUILE, 4); if (herbe) { g.fillStyle = '#3fae45'; g.fillRect(x, y, TUILE, 8); g.fillStyle = '#5fd063'; g.fillRect(x, y, TUILE, 3) } }
    else if (ch === 'B' || ch === '=') { g.fillStyle = ch === 'B' ? '#c8693a' : '#8a6bd1'; g.fillRect(x, y, TUILE, TUILE); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, TUILE - 2, TUILE - 2); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 2, y + 2, TUILE - 4, 4) }
    else if (ch === '?' || ch === 'U') { g.fillStyle = ch === '?' ? '#f7b733' : '#8c8c8c'; g.fillRect(x, y, TUILE, TUILE); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, TUILE - 2, TUILE - 2); if (ch === '?') { g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('?', x + 16, y + 24) } }
    else if (ch === 'C') { const w = Math.abs(Math.cos(t / 220 + c)) * 9 + 2; g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(x + 16, y + 16, w, 11, 0, 0, 7); g.fill(); g.strokeStyle = '#c99a00'; g.lineWidth = 2; g.stroke() }
    else if (ch === 'F') { if (r === 3 || s.grille[r - 1][c] !== 'F') { g.fillStyle = '#e63946'; g.beginPath(); g.moveTo(x + 14, y); g.lineTo(x - 14, y + 10); g.lineTo(x + 14, y + 20); g.fill() } g.fillStyle = '#e9e9e9'; g.fillRect(x + 13, y, 5, TUILE) }
  }
  for (const e of s.ennemis) {
    if (!e.vivant && e.écrasé <= 0) continue
    const h = e.vivant ? e.h : 8, y = e.y + e.h - h
    g.fillStyle = '#8b4a2b'; g.beginPath(); g.ellipse(e.x + 13, y + h / 2 + 2, 14, h / 2 + 2, 0, 0, 7); g.fill()
    if (e.vivant) { g.fillStyle = '#fff'; g.fillRect(e.x + 6, y + 6, 5, 6); g.fillRect(e.x + 15, y + 6, 5, 6); g.fillStyle = '#111'; g.fillRect(e.x + 8 + e.dir, y + 8, 2, 3); g.fillRect(e.x + 17 + e.dir, y + 8, 2, 3); const p = Math.sin(t / 90) * 3; g.fillStyle = '#3b2314'; g.fillRect(e.x + 3 + p, y + h - 2, 7, 4); g.fillRect(e.x + 16 - p, y + h - 2, 7, 4) }
  }
  // joueur
  const cligne = s.statut === 'jeu' || s.statut === 'gagné'
  if (cligne) {
    const px = s.x, py = s.y, marche = s.sol && Math.abs(s.vx) > 0.5 ? Math.sin(t / 60) * 3 : 0
    g.save(); g.translate(px + J.w / 2, 0); g.scale(s.dir, 1); g.translate(-J.w / 2, 0)
    g.fillStyle = '#2b4acb'; g.fillRect(2, py + 16, 16, 10); g.fillRect(2 + marche, py + 24, 6, 6); g.fillRect(12 - marche, py + 24, 6, 6)
    g.fillStyle = '#e63946'; g.fillRect(1, py + 8, 18, 10)
    g.fillStyle = '#f2c29b'; g.fillRect(3, py + 2, 14, 10)
    g.fillStyle = '#e63946'; g.fillRect(1, py - 1, 18, 6); g.fillRect(10, py + 3, 10, 3)
    g.fillStyle = '#111'; g.fillRect(12, py + 6, 2, 3); g.fillStyle = '#4a2a14'; g.fillRect(10, py + 9, 7, 2)
    g.restore()
  }
  for (const p of parts) { g.globalAlpha = Math.max(0, p.vie / 30); g.fillStyle = p.c; g.fillRect(p.x, p.y, 4, 4) }
  g.globalAlpha = 1
  g.restore()
  // HUD
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, 26)
  g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.textAlign = 'left'
  g.fillText(`❤ ${s.vies}   🪙 ${s.pièces}/${PIÈCES_TOTAL}   ★ ${s.score}`, 10, 18); g.textAlign = 'right'; g.fillText(`⏱ ${Math.floor(s.temps / 60)} s`, W - 10, 18)
}

export default function Plateforme({ T, onFin }) {
  const cv = useRef(null), etat = useRef(nouvelÉtat()), ent = useRef({}), parts = useRef([]), audio = useRef(null), fin = useRef(false)
  const [statut, setStatut] = useState('jeu')
  const [, rendre] = useState(0)
  const recommencer = () => { etat.current = nouvelÉtat(); parts.current = []; fin.current = false; setStatut('jeu') }

  useEffect(() => {
    const clavier = (v, e) => { const k = TOUCHES[e.code]; if (!k) return; ent.current[k] = v; e.preventDefault(); if (v && !audio.current) { try { audio.current = new (window.AudioContext || window.webkitAudioContext)() } catch { /* sans son */ } } }
    const bas = e => clavier(true, e), haut = e => clavier(false, e)
    window.addEventListener('keydown', bas); window.addEventListener('keyup', haut)
    const g = cv.current.getContext('2d')
    let id, dernier = performance.now(), reste = 0
    const boucle = now => {
      reste += Math.min(100, now - dernier); dernier = now
      const s = etat.current
      while (reste >= 1000 / 60) {
        reste -= 1000 / 60
        pas(s, ent.current)
        for (const ev of s.événements) {
          SONS[ev.t === 'mort' ? 'mort' : ev.t]?.(audio.current)
          if (ev.x != null) for (let i = 0; i < 8; i++) parts.current.push({ x: ev.x, y: ev.y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4, vie: 30, c: ev.t === 'pièce' ? '#ffd23f' : '#cfcfcf' })
        }
        if (s.événements.length) rendre(n => n + 1)
      }
      parts.current = parts.current.filter(p => p.vie > 0).map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.2, vie: p.vie - 1 }))
      dessiner(g, s, parts.current, now)
      if (s.statut !== 'jeu' && !fin.current) { fin.current = true; setStatut(s.statut); onFin?.(s) }
      id = requestAnimationFrame(boucle)
    }
    id = requestAnimationFrame(boucle)
    return () => { cancelAnimationFrame(id); window.removeEventListener('keydown', bas); window.removeEventListener('keyup', haut) }
  }, [onFin])

  const bouton = (k, lib, extra = {}) => (
    <button aria-label={lib} onPointerDown={e => { e.preventDefault(); ent.current[k] = true; if (!audio.current) { try { audio.current = new (window.AudioContext || window.webkitAudioContext)() } catch { /* sans son */ } } }}
      onPointerUp={() => { ent.current[k] = false }} onPointerLeave={() => { ent.current[k] = false }} onPointerCancel={() => { ent.current[k] = false }}
      style={{ width: 64, height: 64, borderRadius: 32, border: `2px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 24, fontWeight: 800, touchAction: 'none', userSelect: 'none', ...extra }}>{lib}</button>
  )
  return (
    <div>
      <div style={{ position: 'relative', width: '100%', maxWidth: W, margin: '0 auto', aspectRatio: `${W}/${H}`, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, background: '#000' }}>
        <canvas ref={cv} width={W} height={H} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Jeu de plateforme" />
        {statut !== 'jeu' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{statut === 'gagné' ? '🏁 Niveau terminé !' : '💀 Partie perdue'}</div>
            <div style={{ fontSize: 15 }}>Score {etat.current.score} · pièces {etat.current.pièces}/{PIÈCES_TOTAL}</div>
            <button onClick={recommencer} style={{ minHeight: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: '#ffd23f', color: '#222', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Rejouer</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: W, margin: '12px auto 0', touchAction: 'none' }}>
        <div style={{ display: 'flex', gap: 10 }}>{bouton('gauche', '◀')}{bouton('droite', '▶')}</div>
        <div style={{ display: 'flex', gap: 10 }}>{bouton('course', 'B', { width: 52, height: 52 })}{bouton('saut', 'A', { background: '#e63946', color: '#fff', borderColor: '#e63946' })}</div>
      </div>
      <p style={{ textAlign: 'center', color: T.textMuted, fontSize: 12.5, margin: '10px 0 0' }}>Clavier : ← → ou Q/D pour bouger · Espace/↑ pour sauter (reste appuyé = plus haut) · Maj pour courir</p>
    </div>
  )
}
