import { useState, useEffect, useRef, useCallback } from 'react'
import Scene from './Scenes'
import { PARTIES, imagePage, entréeDe, texteScène, duréeLecture, interactive, hash } from '../../lib/livret2026/outils'
import { direTexte, déverrouillerAudio } from '../../lib/texteFormate'

// Le « théâtre » : met en scène une page (ou plusieurs, pour une leçon).
// 1. la page du livret apparaît puis la caméra plonge dedans,
// 2. le rideau s'ouvre,
// 3. les scènes s'enchaînent (lecture à voix haute et défilement auto),
// 4. salut final avec confettis.
const CLÉ_VOIX = 'react-blocs-livret26-voix'
const lireVoix = () => { try { return localStorage.getItem(CLÉ_VOIX) !== 'non' } catch { return true } }

export default function Théâtre({ pages, départ = 0, onFermer, onPageAnimée, onFini, libelléFin = 'Terminer', autoDépart = true }) {
  const [iPage, setIPage] = useState(départ)
  const page = pages[iPage]
  const scènes = page.scènes || []
  const thème = PARTIES[page.partie] || PARTIES[0]
  const [phase, setPhase] = useState('intro') // intro → rideau → scène → fin
  const [i, setI] = useState(0)
  const [lecture, setLecture] = useState(autoDépart)
  const [voix, setVoix] = useState(() => lireVoix() && !!window.speechSynthesis)
  const [répondu, setRépondu] = useState(false)
  const génération = useRef(0)
  const fermerRef = useRef(null)
  const dernièrePage = iPage === pages.length - 1

  // Intro (page + plongée) puis rideau.
  useEffect(() => {
    if (phase === 'intro') { const t = setTimeout(() => setPhase('rideau'), 1900); return () => clearTimeout(t) }
    if (phase === 'rideau') { const t = setTimeout(() => { setPhase(scènes.length ? 'scène' : 'fin'); setI(0) }, 1300); return () => clearTimeout(t) }
    return undefined
  }, [phase, scènes.length])

  const suivante = useCallback(() => {
    window.speechSynthesis?.cancel()
    setRépondu(false)
    if (i < scènes.length - 1) setI(x => x + 1)
    else { onPageAnimée?.(page.page); setPhase('fin') }
  }, [i, scènes.length, onPageAnimée, page.page])
  const précédente = () => { window.speechSynthesis?.cancel(); setRépondu(false); if (i > 0) setI(x => x - 1) }

  // Lecture d'une scène : voix (si activée), puis attente, puis scène suivante.
  useEffect(() => {
    if (phase !== 'scène') return undefined
    const g = ++génération.current
    const s = scènes[i]
    let minuteur
    const avancer = délai => { minuteur = setTimeout(() => { if (génération.current === g && lecture) suivante() }, délai) }
    const attendre = interactive(s) && !répondu
    if (voix) {
      direTexte(texteScène(s)).then(() => { if (génération.current === g && lecture && !attendre) avancer(1400) })
    } else if (lecture && !attendre) avancer(duréeLecture(s))
    return () => { clearTimeout(minuteur) }
  }, [phase, i, lecture, voix, répondu]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { génération.current++; window.speechSynthesis?.cancel() }, [])
  useEffect(() => { fermerRef.current?.focus() }, [])
  useEffect(() => {
    const touche = e => {
      if (e.key === 'Escape') onFermer()
      else if (e.key === 'ArrowRight' && phase === 'scène') suivante()
      else if (e.key === 'ArrowLeft' && phase === 'scène') précédente()
      else if (e.key === ' ' && phase === 'scène' && !e.target.closest?.('button')) { e.preventDefault(); setLecture(l => !l) }
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  const basculerVoix = () => {
    déverrouillerAudio()
    setVoix(v => { const n = !v; try { localStorage.setItem(CLÉ_VOIX, n ? 'oui' : 'non') } catch { /* ignore */ } if (!n) window.speechSynthesis?.cancel(); return n })
  }
  const pageSuivante = () => { génération.current++; setIPage(p => p + 1); setPhase('intro'); setI(0); setRépondu(false) }
  const rejouer = () => { génération.current++; setPhase('intro'); setI(0); setRépondu(false) }

  // Particules de décor : les emojis de la page flottent doucement.
  const emojis = [page.emoji, ...scènes.map(s => s.emoji || s.centre?.emoji || s.points?.[0]?.[0] || s.étapes?.[0]?.[2] || s.étapes?.[0]?.[0]).filter(x => x && typeof x === 'string' && x.length <= 4)].slice(0, 6)
  const s = scènes[i]

  return (
    <div role="dialog" aria-modal="true" aria-label={`Animation de la page ${page.page} : ${page.titre}`} style={{
      position: 'fixed', inset: 0, zIndex: 1000, color: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: `radial-gradient(120% 90% at 50% 0%, ${thème.a}cc 0%, ${thème.b} 62%, #07080f 100%), #07080f`, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {emojis.map((e, k) => (
          <span key={`${page.page}-${k}`} style={{ position: 'absolute', left: `${(hash(`${page.page}${k}`) % 90) + 3}%`, bottom: '-60px', fontSize: 28 + (k % 3) * 10, opacity: 0.13, animation: `l26-particule ${18 + (k % 4) * 5}s linear ${k * 2.5}s infinite` }}>{e}</span>
        ))}
      </div>

      {/* Barre du haut */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: 'max(10px, env(safe-area-inset-top)) 14px 6px' }}>
        <span style={{ fontSize: 22 }}>{page.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.75 }}>Page {page.page} · {thème.nom}{pages.length > 1 ? ` · ${iPage + 1}/${pages.length}` : ''}</div>
          <div style={{ fontWeight: 800, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.titre}</div>
        </div>
        <button ref={fermerRef} onClick={onFermer} aria-label="Fermer l'animation" className="l26-bouton-clair" style={{ width: 44, padding: 0 }}>✕</button>
      </div>
      {phase === 'scène' && (
        <div style={{ display: 'flex', gap: 4, padding: '0 14px 4px' }} aria-hidden="true">
          {scènes.map((_, k) => <span key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: k < i ? '#ffd166' : k === i ? '#fff' : 'rgba(255,255,255,.22)', transition: 'background .3s' }} />)}
        </div>
      )}

      {/* Scène */}
      <div style={{ position: 'relative', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '14px 16px 20px' }}>
        {phase === 'intro' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src={imagePage(page.page)} alt={`Page ${page.page} du Livret du citoyen`} style={{ width: 'min(78vw, 400px)', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.6)', animation: 'l26-kenburns 1.9s ease-in forwards', transformOrigin: '50% 20%' }} />
          </div>
        )}
        {phase === 'rideau' && (
          <div style={{ textAlign: 'center' }} className="l26-zoom">
            <div style={{ fontSize: 72 }}>{page.emoji}</div>
            <div style={{ fontSize: 'clamp(22px, 6vw, 34px)', fontWeight: 900, marginTop: 8 }}>{page.titre}</div>
            {page.section && page.section !== '-' && <div style={{ opacity: 0.75, marginTop: 6, fontSize: 14 }}>{page.section}</div>}
          </div>
        )}
        {phase === 'scène' && s && (
          <div key={`${page.page}-${i}`} className={entréeDe(page.page, i)} aria-live="polite">
            <Scene s={s} onRépondu={() => setRépondu(true)} />
          </div>
        )}
        {phase === 'fin' && (
          <div style={{ textAlign: 'center' }} className="l26-zoom">
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {Array.from({ length: 26 }, (_, k) => <span key={k} style={{ position: 'absolute', top: 0, left: `${(k * 37) % 100}%`, fontSize: 18 + (k % 3) * 6, animation: `l26-confetti ${2.6 + (k % 5) * 0.4}s linear ${(k % 7) * 0.15}s both` }}>{['🎉', '⭐', '🇫🇷', '✨', '🎊'][k % 5]}</span>)}
            </div>
            <div style={{ fontSize: 70 }}>{scènes.length ? '👏' : page.emoji}</div>
            <h3 style={{ fontSize: 'clamp(22px, 5.5vw, 30px)', margin: '8px 0 6px' }}>{scènes.length ? 'Page mise en scène !' : 'Page de garde'}</h3>
            {page.résumé && <p style={{ maxWidth: 560, margin: '0 auto 18px', fontSize: 16, lineHeight: 1.5, opacity: 0.92 }}>📌 {page.résumé}</p>}
            {!scènes.length && !page.résumé && <p style={{ opacity: 0.85, margin: '0 0 18px' }}>Rien à animer sur cette page : passe à la suivante.</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {scènes.length > 0 && <button onClick={rejouer} className="l26-bouton-clair">↺ Rejouer</button>}
              {!dernièrePage
                ? <button onClick={pageSuivante} className="l26-bouton">Page suivante →</button>
                : <button onClick={() => { onFini?.(); if (!onFini) onFermer() }} className="l26-bouton">{libelléFin}</button>}
            </div>
          </div>
        )}
      </div>

      {/* Rideau */}
      {(phase === 'intro' || phase === 'rideau') && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: phase === 'rideau' ? 'block' : 'none' }}>
          {['g', 'd'].map(c => (
            <div key={c} style={{ position: 'absolute', top: 0, bottom: 0, [c === 'g' ? 'left' : 'right']: 0, width: '51%', background: 'repeating-linear-gradient(90deg, #8b1020 0 26px, #a3142a 26px 52px)', boxShadow: 'inset 0 -40px 60px rgba(0,0,0,.45)', animation: `l26-ouvre-${c} 1.2s cubic-bezier(.6,.05,.3,1) .1s forwards` }} />
          ))}
        </div>
      )}

      {/* Commandes */}
      {phase === 'scène' && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 14px max(14px, env(safe-area-inset-bottom))' }}>
          <button onClick={précédente} disabled={i === 0} aria-label="Scène précédente" className="l26-bouton-clair" style={{ width: 50, opacity: i === 0 ? 0.4 : 1 }}>⏮</button>
          <button onClick={() => { déverrouillerAudio(); setLecture(l => !l) }} aria-label={lecture ? 'Pause' : 'Lecture automatique'} className="l26-bouton" style={{ width: 64 }}>{lecture ? '⏸' : '▶'}</button>
          <button onClick={suivante} aria-label="Scène suivante" className="l26-bouton-clair" style={{ width: 50 }}>⏭</button>
          {window.speechSynthesis && <button onClick={basculerVoix} aria-pressed={voix} aria-label={voix ? 'Couper la voix' : 'Activer la voix'} className="l26-bouton-clair" style={{ width: 50 }}>{voix ? '🔊' : '🔇'}</button>}
        </div>
      )}
    </div>
  )
}
