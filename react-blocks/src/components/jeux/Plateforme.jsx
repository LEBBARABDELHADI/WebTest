import { useEffect, useRef, useState } from 'react'
import { nouvelÉtat, pas, hauteurJ, étoiles, critères } from '../../lib/jeux/moteur'
import { NIVEAUX, COMPTE_NIVEAUX } from '../../lib/jeux/niveaux'
import { VUE_L, VUE_H } from '../../lib/jeux/config'
import { créerRendu } from '../../lib/jeux/rendu'
import { créerEffets } from '../../lib/jeux/effets'
import { créerCaméra, majCaméra, recaler } from '../../lib/jeux/camera'
import { créerEntrées } from '../../lib/jeux/entrees'
import * as audio from '../../lib/jeux/audio'

const INTRO = 100
const PAS = 1000 / 60
const SFX = { saut: 'saut', pièce: 'piece', bloc: 'bloc', coup: 'coup', brique: 'brique', écrase: 'ecrase', rapetisse: 'degat', mort: 'mort', agrandir: 'agrandir', bonus: 'piece', point: 'point', vie: 'vie', secret: 'secret', atterrit: 'atterrit', victoire_mat: 'victoire_mat' }
const AIDES = { clavier: 'FLECHES : BOUGER   ESPACE : SAUTER   MAJ : COURIR', tactile: 'CROIX : BOUGER   A : SAUTER   B : COURIR', manette: 'STICK : BOUGER   A : SAUTER   X : COURIR' }
const GB = { fond: '#0f380f', moyen: '#306230', clair: '#8bac0f', pâle: '#9bbc0f' }

const pref = (k, déf) => { try { const v = localStorage.getItem(k); return v === null ? déf : v } catch { return déf } }

function BoutonCoin({ lib, ico, onClick }) {
  return <button type="button" onClick={onClick} aria-label={lib} title={lib} style={{ width: 'calc(var(--k, 3px) * 11)', height: 'calc(var(--k, 3px) * 9)', minWidth: 22, minHeight: 20, padding: 0, border: `1px solid ${GB.pâle}`, background: 'rgba(15,56,15,.7)', color: GB.pâle, fontSize: 'max(11px, calc(var(--k, 3px) * 6))', fontWeight: 900, fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}>{ico}</button>
}

export default function Plateforme({ niveau, aSuivant, meilleur, profilNiveaux, onFin, onSuivant, onMenu }) {
  const conteneur = useRef(null), zone = useRef(null), cv = useRef(null)
  const jeu = useRef(null)          // tout l'état mutable du jeu (hors React)
  const [fin, setFin] = useState(null)
  const [pause, setPause] = useState(false)
  const [plein, setPlein] = useState(() => pref('react-blocs-jeux-grand', '1') !== '0')
  const [portrait, setPortrait] = useState(() => !!window.matchMedia?.('(orientation: portrait)').matches)
  const [tactile] = useState(() => !!window.matchMedia?.('(pointer: coarse)').matches)
  const [vol, setVol] = useState(() => ({ musique: audio.volume('musique'), effets: audio.volume('effets'), muet: audio.estMuet() }))
  const [toast, setToast] = useState('')
  const [appareil, setAppareil] = useState('clavier')
  const [manette, setManette] = useState(null)
  const pleinRef = useRef(plein), pauseRef = useRef(false), finRef = useRef(null), réel = useRef(false), essayé = useRef(false)
  const surFin = useRef(onFin), basculerRef = useRef(() => {}), pauseFnRef = useRef(() => {})

  const montrer = t => { setToast(t); clearTimeout(montrer.id); montrer.id = setTimeout(() => setToast(''), 2600) }

  // ---------- plein écran (API réelle sur le document + repli CSS pour iOS) ----------
  const entrerPleinÉcran = async () => {
    const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen
    if (!f || document.fullscreenElement) return
    try { réel.current = true; await f.call(el); try { await screen.orientation?.lock?.('landscape') } catch { /* non supporté */ } } catch { réel.current = false }
  }
  const essayerPleinÉcran = () => { if (pleinRef.current && !essayé.current && !document.fullscreenElement) { essayé.current = true; entrerPleinÉcran() } }
  const basculerPlein = async () => {
    const v = !pleinRef.current
    setPlein(v); try { localStorage.setItem('react-blocs-jeux-grand', v ? '1' : '0') } catch { /* ignore */ }
    if (v) { essayé.current = true; await entrerPleinÉcran() } else { réel.current = false; if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}) }
  }

  const définirPause = v => {
    if (finRef.current || pauseRef.current === v) return
    pauseRef.current = v; setPause(v)
    jeu.current?.entrées.vider()
    if (v) { audio.suspendre(); audio.sfx('pause') } else { audio.reprendre(); audio.sfx('reprise') }
  }
  useEffect(() => { surFin.current = onFin; pleinRef.current = plein; basculerRef.current = basculerPlein; pauseFnRef.current = définirPause })

  const recommencer = () => {
    const J = jeu.current; if (!J) return
    J.s = nouvelÉtat(niveau); J.fx.vider(); recaler(J.cam, J.s); J.intro = INTRO; J.iris = { r: 0, vers: 220, v: 7 }
    finRef.current = null; setFin(null); J.musiqueOn = false
    pauseRef.current = false; setPause(false); audio.reprendre()
  }
  const quitterVers = (cb) => { const J = jeu.current; if (!J) return cb(); J.iris = { r: J.iris?.r ?? 220, vers: 0, v: -8, après: cb, cx: VUE_L / 2, cy: VUE_H / 2 } }

  // ---------- boucle de jeu ----------
  useEffect(() => {
    const s0 = nouvelÉtat(niveau)
    const entrées = créerEntrées({
      pause: () => pauseFnRef.current(!pauseRef.current),
      plein: () => basculerRef.current(),
      muet: () => { const v = !audio.estMuet(); audio.régler(v); setVol(x => ({ ...x, muet: v })) },
      geste: () => { audio.activer(); essayerPleinÉcran(); if (J.intro > 0 && J.intro < INTRO - 20) J.intro = 0 },
      caché: () => pauseFnRef.current(true),
      bloqué: () => pauseRef.current || !!finRef.current,
      manette: (ok, id) => { setManette(ok ? id : null); montrer(ok ? 'Manette connectée' : 'Manette déconnectée — jeu en pause'); if (!ok) pauseFnRef.current(true) },
    })
    const J = jeu.current = { s: s0, cam: créerCaméra(s0), fx: créerEffets(), rendu: créerRendu(niveau), entrées, intro: INTRO, iris: { r: 0, vers: 220, v: 7 }, musiqueOn: false, reste: 0, dernier: performance.now(), id: 0 }
    J.fx.réduit = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (import.meta.env.DEV) { window.__jeu = { get état() { return J.s }, entrées, J } }
    entrées.attacher()
    const g = cv.current.getContext('2d', { alpha: false })
    g.imageSmoothingEnabled = false

    // échelle entière : pixels nets (le canvas garde 256×144, seul son affichage change)
    const ajuster = () => {
      const dpr = window.devicePixelRatio || 1
      const wrap = zone.current; if (!wrap) return
      const dispoL = wrap.clientWidth, dispoH = pleinRef.current ? window.innerHeight : Math.max(140, window.innerHeight - 190)
      let k = Math.floor(Math.min(dispoL * dpr / VUE_L, dispoH * dpr / VUE_H))
      const cssL = k >= 1 ? (VUE_L * k) / dpr : Math.min(dispoL, (dispoH * VUE_L) / VUE_H)
      cv.current.style.width = cssL + 'px'; cv.current.style.height = (cssL * VUE_H) / VUE_L + 'px'
      cv.current.parentElement.style.setProperty('--k', cssL / VUE_L + 'px')
    }
    const obs = new ResizeObserver(ajuster); obs.observe(zone.current); window.addEventListener('resize', ajuster)
    ajuster()

    const orient = window.matchMedia?.('(orientation: portrait)')
    const surOrient = e => { setPortrait(e.matches); if (e.matches && tactile && pleinRef.current) pauseFnRef.current(true) }
    orient?.addEventListener?.('change', surOrient)
    const changerPlein = () => { if (!document.fullscreenElement && réel.current) { réel.current = false; setPlein(false); try { localStorage.setItem('react-blocs-jeux-grand', '0') } catch { /* ignore */ } } ajuster() }
    document.addEventListener('fullscreenchange', changerPlein)

    const pasLogique = () => {
      const s = J.s
      if (J.intro > 0) { J.intro--; if (J.intro > 0) return }
      if (!J.musiqueOn && s.statut === 'jeu') { J.musiqueOn = true; audio.musique(true, niveau) }
      const e = entrées.lire()
      if (e.appareil !== J.appareil) { J.appareil = e.appareil; setAppareil(e.appareil) }
      pas(s, e)
      for (let i = 0; i < s.événements.length; i++) {
        const ev = s.événements[i]
        const son = SFX[ev.t]; if (son) audio.sfx(son)
        J.fx.sur(ev)
        if (ev.t === 'mort') { audio.musique(false); J.musiqueOn = false; navigator.vibrate?.(40) }
        else if (ev.t === 'rapetisse') navigator.vibrate?.(30)
        else if (ev.t === 'réapparition') { recaler(J.cam, s); J.iris = { r: 0, vers: 220, v: 7, cx: s.x + 5 - J.cam.x, cy: s.y - J.cam.y }; J.musiqueOn = true; audio.musique(true, niveau) }
        else if (ev.t === 'victoire_mat') { audio.musique(false); J.musiqueOn = false; navigator.vibrate?.([30, 40, 60]) }
        else if (ev.t === 'résultats') audio.jingle(niveau === COMPTE_NIVEAUX - 1 ? 'final' : 'niveau')
        else if (ev.t === 'perdu') audio.jingle('perdu')
      }
      if (s.statut === 'mort' && s.mortT === 38) J.iris = { r: 220, vers: 0, v: -7, cx: s.x + 5 - J.cam.x, cy: s.y - J.cam.y }
      if (s.statut === 'jeu' && s.sol && Math.abs(s.vx) > 1.7 && s.temps % 7 === 0) J.fx.particule(0, s.x + 5 - s.dir * 3, s.y + hauteurJ(s), -s.dir * 0.3, -0.2, 14, 0.01)
      J.fx.maj(); majCaméra(J.cam, s)
      if ((s.statut === 'gagné' || s.statut === 'perdu') && !finRef.current) {
        const bilan = { statut: s.statut, score: s.score, pièces: s.pièces, total: s.piècesTotal, temps: s.temps, étoiles: étoiles(s), critères: critères(s), mortsNiveau: s.mortsNiveau, écrasés: s.écrasés, aGrandi: s.aGrandi, secrets: s.secrets, secretsTotal: s.secretsTotal, comboMax: s.comboMax, bonus: s.bonus, par: s.par, niveau }
        finRef.current = bilan; J.finT = 0
        setTimeout(() => { setFin(bilan); surFin.current?.(bilan) }, s.statut === 'gagné' ? 1100 : 600)
      }
    }

    const boucle = now => {
      J.id = requestAnimationFrame(boucle)
      J.reste += Math.min(100, now - J.dernier); J.dernier = now
      if (!pauseRef.current) while (J.reste >= PAS) { J.reste -= PAS; pasLogique() } else { J.reste = 0; entrées.sonder() }
      // transition en iris
      const ir = J.iris
      if (ir) {
        ir.r += ir.v
        if ((ir.v > 0 && ir.r >= ir.vers) || (ir.v < 0 && ir.r <= ir.vers)) { ir.r = ir.vers; if (ir.après) { const f = ir.après; ir.après = null; f() } if (ir.v > 0) J.iris = null }
      }
      const s = J.s
      const aide = niveau === 0 && s.statut === 'jeu' && s.temps < 420 && J.intro === 0 ? AIDES[J.appareil || 'clavier'] : null
      const ui = { intro: J.intro, aide, iris: J.iris ? { r: J.iris.r, cx: J.iris.cx ?? Math.round(s.x + 5 - J.cam.x), cy: J.iris.cy ?? Math.round(s.y - J.cam.y) } : null }
      J.rendu.dessiner(g, s, J.cam, J.fx, now, ui)
    }
    J.id = requestAnimationFrame(boucle)
    return () => {
      cancelAnimationFrame(J.id); obs.disconnect(); window.removeEventListener('resize', ajuster); entrées.détacher(); audio.musique(false)
      orient?.removeEventListener?.('change', surOrient); document.removeEventListener('fullscreenchange', changerPlein)
      jeu.current = null; if (import.meta.env.DEV) delete window.__jeu
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [niveau])

  useEffect(() => {
    if (!plein) return
    const a = document.body.style.overflow, b = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'; document.documentElement.style.overscrollBehavior = 'none'
    jeu.current && zone.current && window.dispatchEvent(new Event('resize'))
    return () => { document.body.style.overflow = a; document.documentElement.style.overscrollBehavior = b; window.dispatchEvent(new Event('resize')) }
  }, [plein])

  // ---------- commandes tactiles : croix glissante + A/B ----------
  const croix = useRef(null)
  const surCroix = e => {
    const J = jeu.current; if (!J) return
    if (e.type === 'pointerup' || e.type === 'pointercancel' || e.type === 'lostpointercapture') { J.entrées.toucherTactile('gauche', false); J.entrées.toucherTactile('droite', false); return }
    const r = croix.current.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5
    J.entrées.toucherTactile('gauche', x < -0.08); J.entrées.toucherTactile('droite', x > 0.08)
  }
  const bouton = (k, lib, taille, extra = {}) => (
    <button type="button" aria-label={k === 'saut' ? 'Sauter' : 'Courir'} onContextMenu={e => e.preventDefault()}
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); jeu.current?.entrées.toucherTactile(k, true); navigator.vibrate?.(8) }}
      onPointerUp={() => jeu.current?.entrées.toucherTactile(k, false)} onPointerCancel={() => jeu.current?.entrées.toucherTactile(k, false)}
      style={{ width: taille, height: taille, borderRadius: taille / 2, border: `3px solid ${GB.pâle}`, background: 'rgba(15,56,15,.6)', color: GB.pâle, fontSize: taille / 3, fontWeight: 900, fontFamily: 'ui-monospace, monospace', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent', ...extra }}>{lib}</button>
  )

  const changerVolume = (type, v) => { audio.régler_volume(type, v); setVol(x => ({ ...x, [type]: v })) }
  const style = { fontFamily: 'ui-monospace, "Courier New", monospace', textTransform: 'uppercase', letterSpacing: '.04em' }
  const btn = (plein = false) => ({ ...style, minHeight: 44, minWidth: 140, padding: '0 16px', border: `3px solid ${GB.pâle}`, background: plein ? GB.pâle : GB.fond, color: plein ? GB.fond : GB.pâle, fontWeight: 900, fontSize: 14, cursor: 'pointer' })
  const panneau = { position: 'absolute', inset: 0, lineHeight: 1.45, background: 'rgba(15,56,15,.86)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: GB.pâle, textAlign: 'center', padding: 10, zIndex: 20, overflowY: 'auto', ...style }
  const rec = fin && meilleur ? { score: fin.score > (meilleur.meilleur || 0), temps: fin.statut === 'gagné' && (!meilleur.temps || fin.temps < meilleur.temps), étoiles: fin.étoiles > (meilleur.étoiles || 0) } : {}
  const sec = n => Math.floor(n / 60) + ' s'
  const totalÉtoiles = Object.values(profilNiveaux || {}).reduce((a, x) => a + (x.étoiles || 0), 0)
  const finale = fin?.statut === 'gagné' && !aSuivant

  const ligneCritère = (ok, txt) => <div style={{ display: 'flex', gap: 8, justifyContent: 'center', opacity: ok ? 1 : .75 }}><span aria-hidden="true">{ok ? '★' : '☆'}</span><span>{txt}</span><span className="sr-only" style={{ position: 'absolute', left: -9999 }}>{ok ? 'obtenue' : 'manquante'}</span></div>

  return (
    <div ref={conteneur} onPointerDown={() => { audio.activer(); essayerPleinÉcran() }} style={plein ? { position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overscrollBehavior: 'none', touchAction: 'none' } : {}}>
      <div ref={zone} style={{ position: 'relative', width: plein ? '100vw' : '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: plein ? '100dvh' : 'auto' }}>
        <div style={{ position: 'relative', lineHeight: 0, border: plein ? 'none' : `3px solid ${GB.moyen}`, background: '#000' }}>
          <canvas ref={cv} width={VUE_L} height={VUE_H} onDoubleClick={basculerPlein} role="img" aria-label={`Super Plombier, niveau ${niveau + 1} : ${NIVEAUX[niveau].nom}`} style={{ imageRendering: 'pixelated', display: 'block' }} />
          <div style={{ position: 'absolute', top: 'calc(var(--k, 3px) * 1)', right: 'calc(var(--k, 3px) * 1)', display: 'flex', gap: 'calc(var(--k, 3px) * 1)', lineHeight: 1 }}>
            <BoutonCoin lib="Pause" ico={pause ? '▶' : 'II'} onClick={() => définirPause(!pause)} />
            <BoutonCoin lib={vol.muet ? 'Activer le son' : 'Couper le son'} ico={vol.muet ? '×' : '♪'} onClick={() => { const v = !audio.estMuet(); audio.activer(); audio.régler(v); setVol(x => ({ ...x, muet: v })) }} />
            <BoutonCoin lib={plein ? 'Quitter le grand écran' : 'Grand écran'} ico={plein ? '▭' : '⛶'} onClick={basculerPlein} />
          </div>
          {toast && <div role="status" style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: GB.fond, color: GB.pâle, border: `2px solid ${GB.pâle}`, padding: '4px 10px', fontSize: 12, ...style, lineHeight: 1.4, zIndex: 30, whiteSpace: 'nowrap' }}>{toast}</div>}
          {tactile && !fin && !pause && (
            <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none', lineHeight: 1 }}>
              <div ref={croix} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); surCroix(e) }} onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') surCroix(e) }} onPointerUp={surCroix} onPointerCancel={surCroix} onLostPointerCapture={surCroix} onContextMenu={e => e.preventDefault()}
                style={{ pointerEvents: 'auto', width: 150, height: 70, borderRadius: 35, border: `3px solid ${GB.pâle}`, background: 'rgba(15,56,15,.55)', color: GB.pâle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontSize: 24, fontWeight: 900, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }} aria-label="Croix directionnelle gauche et droite" role="group"><span>◀</span><span>▶</span></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', pointerEvents: 'auto' }}>{bouton('course', 'B', 58)}{bouton('saut', 'A', 76, { background: 'rgba(139,172,15,.55)' })}</div>
            </div>
          )}
          {tactile && plein && portrait && !fin && (
            <div style={{ ...panneau, zIndex: 40 }}><div style={{ fontSize: 40 }}>↻ 📱</div><div style={{ fontWeight: 900 }}>Tourne ton téléphone en paysage</div><div style={{ fontSize: 12, opacity: .8 }}>Le jeu est en pause</div></div>
          )}
          {pause && !fin && (
            <div style={panneau} role="dialog" aria-label="Pause">
              <div style={{ fontSize: 22, fontWeight: 900 }}>Pause</div>
              <div style={{ display: 'grid', gap: 6, fontSize: 12, textAlign: 'left' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>Musique <input type="range" min="0" max="1" step="0.05" value={vol.musique} onChange={e => changerVolume('musique', +e.target.value)} style={{ accentColor: GB.pâle, width: 130 }} aria-label="Volume de la musique" /></label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>Effets <input type="range" min="0" max="1" step="0.05" value={vol.effets} onChange={e => changerVolume('effets', +e.target.value)} style={{ accentColor: GB.pâle, width: 130 }} aria-label="Volume des effets" /></label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={vol.muet} onChange={e => { audio.régler(e.target.checked); setVol(x => ({ ...x, muet: e.target.checked })) }} style={{ appearance: 'none', WebkitAppearance: 'none', width: 18, height: 18, margin: 0, border: `3px solid ${GB.pâle}`, background: vol.muet ? GB.pâle : 'transparent', cursor: 'pointer' }} /> Couper tout le son (M)</label>
              </div>
              <button type="button" autoFocus onClick={() => définirPause(false)} style={btn(true)}>Reprendre</button>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" onClick={recommencer} style={btn()}>Recommencer</button>
                <button type="button" onClick={() => quitterVers(onMenu)} style={btn()}>Menu</button>
              </div>
              <div style={{ fontSize: 11, opacity: .8, maxWidth: 300, lineHeight: 1.5, textTransform: 'none' }}>{appareil === 'manette' ? 'Manette : croix/stick bouger · A sauter · X/B/gâchette courir · Start pause' : appareil === 'tactile' ? 'Croix et boutons A/B à l\'écran' : '← → ou Q/D · Espace ou ↑ sauter · Maj ou B courir · Échap/P pause · F grand écran · M son'}{manette ? ' · manette détectée' : ''}</div>
            </div>
          )}
          {fin && (
            <div style={panneau} role="dialog" aria-label="Résultats">
              <div style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 900 }}>{fin.statut === 'gagné' ? (finale ? '★ Victoire finale ! ★' : 'Niveau terminé !') : 'Plus de vies'}</div>
              {fin.statut === 'gagné' && <div style={{ fontSize: 30, letterSpacing: 6 }} aria-label={`${fin.étoiles} étoiles sur 3`}>{[1, 2, 3].map(i => <span key={i} style={{ color: i <= fin.étoiles ? GB.pâle : GB.moyen }}>★</span>)}</div>}
              <div style={{ fontSize: 12, lineHeight: 1.55 }}>
                <div>Score {fin.score}{rec.score ? ' — nouveau record !' : ''}</div>
                <div>Pièces {fin.pièces}/{fin.total} · Secrets {fin.secrets}/{fin.secretsTotal} · {sec(fin.temps)}{rec.temps ? ' — record !' : ''}</div>
              </div>
              {fin.statut === 'gagné' ? (
                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                  {ligneCritère(fin.critères.terminé, 'Terminer le niveau')}
                  {ligneCritère(fin.critères.pièces, `Collecter 80 % des pièces (${Math.ceil(fin.total * 0.8)} sur ${fin.total})`)}
                  {ligneCritère(fin.critères.sansMort, 'Terminer sans perdre de vie')}
                </div>
              ) : <div style={{ fontSize: 12 }}>Tu y es presque : réessaie, les points de passage te rapprochent.</div>}
              {finale && <div style={{ fontSize: 12, textTransform: 'none' }}>Total : {totalÉtoiles}/{COMPTE_NIVEAUX * 3} étoiles{totalÉtoiles < COMPTE_NIVEAUX * 3 ? ' — rejoue les niveaux pour compléter les étoiles manquantes.' : ' — parfait, tu as tout débloqué !'}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                {fin.statut === 'gagné' && aSuivant && <button type="button" autoFocus onClick={() => quitterVers(onSuivant)} style={btn(true)}>Niveau suivant</button>}
                <button type="button" autoFocus={fin.statut !== 'gagné' || !aSuivant} onClick={recommencer} style={btn(fin.statut !== 'gagné' || !aSuivant)}>Rejouer</button>
                <button type="button" onClick={() => quitterVers(onMenu)} style={btn()}>Menu</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
