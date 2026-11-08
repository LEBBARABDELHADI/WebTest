import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import Decor from './Decors'
import { CSS_FILM } from '../../lib/livret2026/filmCss'
import { direRéplique, créerMusique } from '../../lib/livret2026/filmAudio'
import { imagePage } from '../../lib/livret2026/outils'
import { tempsDu, découper } from '../../lib/livret2026/filmTemps'
import { créerSonCinéma, jouerFichier, précharger } from '../../lib/livret2026/cinema/sonCinema'
import { PAGE } from '../../lib/livret2026'

// Mode film : la page racontée comme un épisode de dessin animé. Chaque plan a
// un décor, une caméra, des personnages, des répliques (bulles + voix propres)
// et une narration en sous-titres. Le scénario est dans lib/livret2026/films/.
const ÉMOTIONS = { joie: '✨', surprise: '❗', gêne: '💧', idée: '💡', colère: '💢', amour: '💖', peur: '😱' }
const CLÉ = 'react-blocs-film-reglages'
const lireRéglages = () => { try { return { voix: true, musique: true, sousTitres: true, ...JSON.parse(localStorage.getItem(CLÉ) || '{}') } } catch { return { voix: true, musique: true, sousTitres: true } } }

function useLargeur(ref, actif) {
  const [l, setL] = useState(360)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const mesurer = () => setL(el.clientWidth)
    mesurer()
    const o = new ResizeObserver(mesurer)
    o.observe(el)
    return () => o.disconnect()
  }, [ref, actif])
  return l
}

function MachineÀÉcrire({ texte, vitesse = 26 }) {
  const [n, setN] = useState(0)
  useEffect(() => { const t = setInterval(() => setN(x => (x >= texte.length ? (clearInterval(t), x) : x + 1)), vitesse); return () => clearInterval(t) }, [texte, vitesse])
  return <>{texte.slice(0, n)}</>
}

export default function Film({ film, onFermer, onVu }) {
  const [réglages, setRéglages] = useState(lireRéglages)
  const [lancé, setLancé] = useState(false)
  const [p, setP] = useState(0)
  const [b, setB] = useState(0)
  const [lecture, setLecture] = useState(true)
  const musique = useRef(null)
  const son = useRef(null) // voix doublées (MP3 générés) et bruitages
  const lectureVoix = useRef(null)
  const génération = useRef(0)
  const scène = useRef(null)
  const largeur = useLargeur(scène, lancé)
  const plan = film.plans[p]
  const temps = tempsDu(plan)
  const actuel = temps[b]
  const perso = id => film.personnages[id] || { nom: id, voix: {} }

  const urlVoix = f => `${import.meta.env.BASE_URL}${film.voix?.base || ''}${f}`
  const voixDe = (k, i) => film.voix?.lignes[`${k}:${i}`]
  const couperVoix = () => { lectureVoix.current?.arrêter(); lectureVoix.current = null; window.speechSynthesis?.cancel() }
  // Précharge les voix du plan en cours et du suivant.
  useEffect(() => {
    if (!lancé || !son.current || !film.voix) return
    ;[p, p + 1].forEach(k => film.plans[k] && tempsDu(film.plans[k]).forEach((_, i) => { const v = voixDe(k, i); if (v) précharger(son.current, urlVoix(v.f)) }))
  }, [lancé, p]) // eslint-disable-line react-hooks/exhaustive-deps
  const régler = (k, v) => setRéglages(r => { const n = { ...r, [k]: v }; try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* ignore */ } return n })

  // Musique : ambiance du plan (gardée tant qu'un plan n'en change pas).
  useEffect(() => {
    if (!lancé || !musique.current) return
    const amb = film.plans.slice(0, p + 1).reverse().find(x => x.musique)?.musique
    musique.current.ambiance(amb)
    if (réglages.musique && lecture && plan.type !== 'fin') musique.current.démarrer(); else musique.current.arrêter()
  }, [lancé, p, réglages.musique, lecture]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { génération.current++; couperVoix(); musique.current?.fermer(); son.current?.fermer?.() }, [])

  // Déroulé : chaque temps est dit (ou affiché), puis le suivant, puis le plan suivant.
  useEffect(() => {
    if (!lancé || !lecture || plan.type === 'fin') return undefined
    const g = ++génération.current
    let minuteur
    const encore = () => génération.current === g
    if (b >= temps.length) {
      minuteur = setTimeout(() => { if (encore()) { setP(x => Math.min(film.plans.length - 1, x + 1)); setB(0) } }, plan.type === 'final' ? 3400 : plan.type === 'chapitre' || plan.type === 'impact' ? 900 : 1400)
      return () => clearTimeout(minuteur)
    }
    const t = temps[b]
    const départ = b === 0 ? 900 : 250
    minuteur = setTimeout(() => {
      if (!encore()) return
      const suite = () => { if (encore()) minuteur = setTimeout(() => { if (encore()) setB(x => x + 1) }, 550) }
      // Temps musical sans parole (La Marseillaise, feu d'artifice…).
      if (t.pause) { if (t.son) son.current?.effet(t.son); minuteur = setTimeout(suite, t.pause); return }
      // 1) voix doublée générée à l'avance (une voix par personnage),
      // 2) sinon la voix de l'appareil, 3) sinon les sous-titres seuls.
      const v = réglages.voix && voixDe(p, b)
      if (v && son.current) { const l = jouerFichier(son.current, urlVoix(v.f)); lectureVoix.current = l; l.promesse.then(suite); return }
      if (réglages.voix && window.speechSynthesis) direRéplique(t.texte, perso(t.qui).voix).then(suite)
      else minuteur = setTimeout(suite, 1400 + t.texte.length * 52)
    }, départ)
    return () => { clearTimeout(minuteur); lectureVoix.current?.arrêter(); lectureVoix.current = null }
  }, [lancé, lecture, p, b, réglages.voix]) // eslint-disable-line react-hooks/exhaustive-deps

  const allerPlan = k => { génération.current++; couperVoix(); setP(Math.max(0, Math.min(film.plans.length - 1, k))); setB(0) }
  const lancer = () => {
    try { window.speechSynthesis?.speak(Object.assign(new SpeechSynthesisUtterance(' '), { volume: 0 })) } catch { /* ignore */ }
    if (!musique.current) musique.current = créerMusique()
    if (!son.current) son.current = créerSonCinéma()
    son.current?.démarrer()
    setLancé(true); setLecture(true); setP(0); setB(0)
  }
  const basculerLecture = () => { if (lecture) { génération.current++; couperVoix() } setLecture(l => !l) }
  useEffect(() => {
    const touche = e => {
      if (e.key === 'Escape') onFermer()
      else if (!lancé) return
      else if (e.key === ' ') { e.preventDefault(); basculerLecture() }
      else if (e.key === 'ArrowRight') allerPlan(p + 1)
      else if (e.key === 'ArrowLeft') allerPlan(p - 1)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  // Émotion affichée d'un acteur : sa dernière réplique avec émotion, sinon celle d'entrée.
  const émotionDe = a => {
    const passées = temps.slice(0, b + 1).filter(t => t.qui === a.id && t.émotion)
    return passées.length ? passées.at(-1).émotion : (b > 0 || !temps.length ? a.émotion : null)
  }
  const parle = actuel && actuel.qui !== 'narrateur' ? actuel.qui : null
  const acteurParlant = (plan.acteurs || []).find(a => a.id === parle)
  const largeurBulle = Math.min(300, largeur * 0.78)
  const xParlant = acteurParlant ? (acteurParlant.pos / 100) * largeur : largeur / 2
  const gaucheBulle = Math.max(8, Math.min(largeur - largeurBulle - 8, xParlant - largeurBulle / 2))
  const queue = Math.max(24, Math.min(largeurBulle - 24, xParlant - gaucheBulle))
  const quiParle = parle && perso(parle)

  // ---------- Affiche ----------
  if (!lancé) {
    return (
      <div className="f-ecran" role="dialog" aria-modal="true" aria-label={`${film.épisode} : ${film.titre}`}>
        <style>{CSS_FILM}</style>
        <div style={{ position: 'absolute', inset: 0 }}><Decor nom={film.plans[0].décor} /></div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'radial-gradient(ellipse at center, rgba(5,8,20,.8), rgba(5,8,20,.45) 80%)' }} />
        <div className="f-vignette" />
        <div style={{ position: 'relative', zIndex: 4, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, gap: 10 }}>
          <img src={imagePage(film.page)} alt={`Page ${film.page} du livret`} style={{ width: 'min(30vw, 130px)', borderRadius: 6, boxShadow: '0 12px 30px rgba(0,0,0,.6)', transform: 'rotate(-4deg)' }} />
          <div className="f-titre-ep">{film.épisode} · page {film.page}</div>
          <h2 className="f-titre" style={{ margin: 0 }}>{film.titre}</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>{film.sousTitre}</p>
          <p style={{ margin: '4px 0 10px', opacity: 0.75, fontSize: 13 }}>{film.plans.length - 1} plans · avec {Object.entries(film.personnages).filter(([k]) => k !== 'narrateur').map(([, v]) => `${v.emoji} ${v.nom}`).join(', ')}</p>
          {film.voix && <p style={{ margin: '-6px 0 6px', opacity: 0.75, fontSize: 12.5 }}>🗣️ Voix doublées : {[...new Set(Object.values(film.voix.lignes).map(v => v.voix))].join(', ')}</p>}
          <button onClick={lancer} className="f-controle f-plein" style={{ minHeight: 56, padding: '0 28px', fontSize: 18, borderRadius: 28 }}>▶ Regarder l'épisode</button>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={() => régler('voix', !réglages.voix)} aria-pressed={réglages.voix} className="f-controle" style={{ padding: '0 12px', fontSize: 13.5 }}>{réglages.voix ? '🔊 Voix' : '🔇 Sans voix'}</button>
            <button onClick={() => régler('musique', !réglages.musique)} aria-pressed={réglages.musique} className="f-controle" style={{ padding: '0 12px', fontSize: 13.5 }}>{réglages.musique ? '🎵 Musique' : '🔕 Sans musique'}</button>
          </div>
          <button onClick={onFermer} className="f-controle" style={{ marginTop: 8, padding: '0 14px', fontSize: 13.5, background: 'transparent' }}>Fermer</button>
        </div>
      </div>
    )
  }

  // ---------- Plans ----------
  const acteurs = (plan.acteurs || []).map((a, k) => {
    const pp = perso(a.id)
    const émo = émotionDe(a)
    return (
      <div key={`${p}-${a.id}`} className={`f-acteur ${parle === a.id ? 'f-parle' : ''}`} style={{ left: `${a.pos}%` }}>
        <div className={`f-entree-${a.entrée || 'fondu'}`} style={{ animationDelay: `${k * 0.18}s`, position: 'relative' }}>
          <span className="f-corps" aria-hidden="true" style={{ fontSize: `min(17vh, ${Math.floor(80 / Math.max(2, (plan.acteurs || []).length))}vw, 160px)` }}>{pp.emoji}</span>
          {émo && <span key={`${b}-${émo}`} className="f-emotion" aria-hidden="true">{ÉMOTIONS[émo]}</span>}
          <div className="f-ombre" />
          {((plan.acteurs || []).length < 4 || parle === a.id) && <div className="f-nom" style={{ color: pp.couleur }}>{pp.nom}</div>}
        </div>
      </div>
    )
  })
  const effets = (
    <>
      {plan.effet === 'vitesse' && <div className="f-vitesse" />}
      {plan.effet === 'flash' && <div key={`fl${p}`} className="f-flash" />}
      {plan.effet === 'étoiles' && plan.décor !== 'nuit-ville' && Array.from({ length: 22 }, (_, i) => <span key={i} className="f-etoile" style={{ left: `${(i * 41) % 100}%`, top: `${(i * 23) % 40}%`, animationDelay: `${(i % 6) * 0.4}s`, zIndex: 1 }} />)}
      {plan.effet === 'confettis' && Array.from({ length: 24 }, (_, i) => <span key={i} className="f-confetti" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.22}s`, fontSize: 18 + (i % 3) * 6 }}>{['🎉', '🎊', '✨', '⭐'][i % 4]}</span>)}
    </>
  )

  let contenu
  if (plan.type === 'titre') {
    contenu = (
      <>
        <Decor nom={plan.décor} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'radial-gradient(ellipse at center, rgba(5,8,20,.72), rgba(5,8,20,.35) 75%)' }} />
        <div className="f-impact" style={{ zIndex: 3 }}>
          <div className="f-titre-ep">{film.épisode}</div>
          <div className="f-titre">{film.titre}</div>
          <div style={{ opacity: 0.9, fontSize: 'clamp(15px, 2.6vh, 20px)', animation: 'f-fondu 1s 1.4s both' }}>{film.sousTitre}</div>
        </div>
      </>
    )
  } else if (plan.type === 'impact') {
    contenu = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, #ef476f 0%, #7a0f2d 55%, #12030a 100%)' }} />
        {effets}
        <div className="f-impact" style={{ zIndex: 3 }}>
          <div className="f-impact-texte">{plan.texte}</div>
          {plan.sous && <div style={{ marginTop: 18, fontSize: 'clamp(16px, 2.8vh, 22px)', fontWeight: 700, animation: 'f-fondu .6s 1s both' }}>{plan.sous}</div>}
        </div>
      </>
    )
  } else if (plan.type === 'citation') {
    contenu = (
      <>
        <Decor nom={plan.décor} />
        <div className="f-parchemin">
          <div style={{ fontSize: 'clamp(40px, 9vh, 70px)', lineHeight: 0.5, color: '#8a5a1a' }} aria-hidden="true">“</div>
          <p style={{ fontStyle: 'italic', fontSize: 'clamp(18px, 3.4vh, 28px)', lineHeight: 1.5, margin: '10px 0', minHeight: '4.5em' }}>{b >= temps.length - 1 ? <MachineÀÉcrire texte={plan.texte} /> : ''}</p>
          <p style={{ margin: 0, fontSize: 'clamp(13px, 2vh, 16px)', opacity: b >= temps.length - 1 ? 0.85 : 0, transition: 'opacity 1s 2s' }}>— {plan.source}</p>
        </div>
      </>
    )
  } else if (plan.type === 'split') {
    const côté = (c, visible) => (
      <div>
        <div style={{ fontSize: 'clamp(22px, 5vw, 40px)', fontWeight: 900, letterSpacing: '.08em' }}>{c.titre}</div>
        <div className="f-chaine" aria-hidden="true">{visible && c.chaîne.map((e, k) => <span key={k} style={{ animationDelay: `${k * 0.35}s` }}>{k > 0 && <span style={{ fontSize: '.55em', margin: '0 2px', opacity: 0.7 }}>➜</span>}{e}</span>)}</div>
        <p style={{ margin: 0, fontSize: 'clamp(13px, 2.2vh, 17px)', lineHeight: 1.4, maxWidth: 280, opacity: visible ? 1 : 0, transition: 'opacity .6s .5s' }}>{c.texte}</p>
      </div>
    )
    contenu = (
      <>
        <div className="f-split">{côté(plan.gauche, b >= 1)}{côté(plan.droite, b >= 2)}</div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 3, width: 64, height: 64, borderRadius: '50%', background: '#ffd166', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, boxShadow: '0 0 0 5px #111', animation: 'f-pop .5s .8s both' }}>VS</div>
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', zIndex: 3, fontWeight: 900, fontSize: 'clamp(15px, 2.6vh, 20px)', textShadow: '0 2px 6px #000' }}>{plan.titre}</div>
      </>
    )
  } else if (plan.type === 'tableau') {
    contenu = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, #3a2a18, #0b0805)' }} />
        <div style={{ position: 'absolute', inset: '6% 0 14%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
          <div style={{ height: '100%', aspectRatio: '296 / 434', maxWidth: '86%', overflow: 'hidden', border: '10px solid #c9a24a', outline: '3px solid #6b4f1d', boxShadow: '0 20px 60px rgba(0,0,0,.7), inset 0 0 0 2px #e8cf8a', borderRadius: 4, background: '#111' }}>
            <img src={`${import.meta.env.BASE_URL}livret2026/${plan.image}`} alt={plan.légende} style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'f-kenburns 14s ease-in-out both' }} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '3%', textAlign: 'center', zIndex: 3, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(13px, 2.1vh, 17px)', color: '#f3dfa8', animation: 'f-fondu 1s 1s both' }}>{plan.légende}</div>
      </>
    )
  } else if (plan.type === 'chapitre') {
    contenu = (
      <div className="f-chapitre">
        <div className="f-titre-ep">{plan.numéro}</div>
        <div style={{ fontSize: 'clamp(28px, 7vw, 56px)', fontWeight: 900, marginTop: 12, animation: 'f-coup .9s cubic-bezier(.2,1.2,.4,1) .4s both' }}>{plan.titre}</div>
        <div style={{ width: 120, height: 3, background: '#ffd166', marginTop: 16, animation: 'f-fondu 1s 1s both' }} />
      </div>
    )
  } else if (plan.type === 'manga') {
    contenu = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: '#f4f1ea', backgroundImage: 'radial-gradient(#d9d3c4 1.2px, transparent 1.2px)', backgroundSize: '12px 12px' }} />
        <div className="f-manga">
          {plan.cases.map((c, k) => {
            // Chaque case : sa légende (narration), puis la réplique. La narration
            // du plan, s'il y en a une, passe avant la première case.
            const d = plan.narration ? découper(plan.narration).length : 0
            if (b < d + 2 * k) return <div key={k} style={{ border: '4px dashed #c9c2b2', borderRadius: 6 }} />
            const pp = perso(c.qui)
            return (
              <div key={k} className="f-case">
                <div className="f-case-fond" aria-hidden="true">{c.décor}</div>
                <div className="f-case-legende">{c.légende}</div>
                <span className={b === d + 1 + 2 * k ? 'f-parle' : ''} style={{ position: 'relative', fontSize: 'clamp(44px, 10vh, 84px)', marginTop: 18 }}><span className="f-corps" style={{ fontSize: 'inherit' }}>{pp.emoji}</span></span>
                {b >= d + 1 + 2 * k && <div className="f-case-bulle" style={{ animation: 'f-bulle .35s both' }}><strong style={{ color: pp.couleur, filter: 'brightness(.7)' }}>{pp.nom} : </strong>{c.texte}</div>}
              </div>
            )
          })}
        </div>
      </>
    )
  } else if (plan.type === 'fin') {
    const questions = PAGE.get(film.page)?.questions || []
    contenu = <FinÉpisode film={film} plan={plan} questions={questions} onRevoir={() => allerPlan(0)} onFermer={onFermer} onVu={onVu} />
  } else {
    contenu = (
      <>
        <div className={`f-camera ${plan.caméra ? `f-cam-${plan.caméra}` : ''}`}>
          <Decor nom={plan.décor} />
          {(plan.accessoires || []).map(([e, x, y], k) => <span key={k} className="f-accessoire" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${k * 0.4}s` }} aria-hidden="true">{e}</span>)}
          {acteurs}
        </div>
        {effets}
        {plan.type === 'final' && b >= temps.length && <div className="f-impact" style={{ zIndex: 3, justifyContent: 'flex-start', paddingTop: '6%' }}><div className="f-impact-texte" style={{ fontSize: 'clamp(26px, 7vw, 60px)' }}>{plan.texte}</div></div>}
        {quiParle && (
          <div key={`${p}-${b}`} className="f-bulle" style={{ left: gaucheBulle, width: largeurBulle, '--queue': `${queue}px`, top: plan.type === 'final' ? '7%' : undefined }}>
            <span className="f-bulle-nom" style={{ color: quiParle.couleur, filter: 'brightness(.75)' }}>{quiParle.nom}</span>
            {actuel.texte}
          </div>
        )}
      </>
    )
  }

  const sousTitre = actuel && réglages.sousTitres && plan.type !== 'fin'
    ? (actuel.légende ? <em>{actuel.légende}</em> : actuel.qui === 'narrateur' ? <em>{actuel.texte}</em> : <><strong style={{ color: perso(actuel.qui).couleur }}>{perso(actuel.qui).nom} : </strong>{actuel.texte}</>)
    : null

  return (
    <div className="f-ecran" role="dialog" aria-modal="true" aria-label={`${film.épisode} : ${film.titre}`}>
      <style>{CSS_FILM}</style>
      <div className="f-bande f-haut">
        <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#ffd166', fontWeight: 800, whiteSpace: 'nowrap' }}>{film.épisode}</span>
        <div style={{ flex: 1, display: 'flex', gap: 3 }} aria-hidden="true">
          {film.plans.map((_, k) => <button key={k} onClick={() => allerPlan(k)} tabIndex={-1} style={{ flex: 1, height: 5, padding: 0, border: 'none', borderRadius: 3, cursor: 'pointer', background: k < p ? '#ffd166' : k === p ? '#fff' : 'rgba(255,255,255,.22)' }} />)}
        </div>
        <button onClick={onFermer} aria-label="Fermer l'épisode" className="f-controle">✕</button>
      </div>
      <div className="f-scene" ref={scène}>
        <div key={p} className="f-plan">{contenu}</div>
        {plan.type !== 'fin' && plan.type !== 'chapitre' && <div className="f-vignette" />}
      </div>
      <div className="f-bande f-bas">
        <div aria-live="polite" style={{ minHeight: '3em', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {sousTitre && <p key={`${p}-${b}`} className="f-sous-titre">{sousTitre}</p>}
        </div>
        {plan.type !== 'fin' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button onClick={() => allerPlan(p - 1)} aria-label="Plan précédent" className="f-controle">⏮</button>
            <button onClick={basculerLecture} aria-label={lecture ? 'Pause' : 'Lecture'} className="f-controle f-plein" style={{ minWidth: 60 }}>{lecture ? '⏸' : '▶'}</button>
            <button onClick={() => allerPlan(p + 1)} aria-label="Plan suivant" className="f-controle">⏭</button>
            <button onClick={() => { régler('voix', !réglages.voix); if (réglages.voix) couperVoix() }} aria-pressed={réglages.voix} aria-label="Voix" className="f-controle">{réglages.voix ? '🔊' : '🔇'}</button>
            <button onClick={() => régler('musique', !réglages.musique)} aria-pressed={réglages.musique} aria-label="Musique" className="f-controle">{réglages.musique ? '🎵' : '🔕'}</button>
            <button onClick={() => régler('sousTitres', !réglages.sousTitres)} aria-pressed={réglages.sousTitres} aria-label="Sous-titres" className="f-controle" style={{ fontSize: 12, fontWeight: 800 }}>CC</button>
          </div>
        )}
      </div>
    </div>
  )
}

function FinÉpisode({ film, plan, questions, onRevoir, onFermer, onVu }) {
  const [vues, setVues] = useState({})
  useEffect(() => { onVu?.(film.page) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="f-fin">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="f-titre-ep" style={{ textAlign: 'center' }}>Fin de l'{film.épisode.toLowerCase()}</div>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 6vw, 38px)', margin: '8px 0 16px', fontWeight: 900 }}>🎬 Ce qu'il faut retenir</h2>
        {plan.retenir.map(([e, t], k) => (
          <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 14, padding: '10px 12px', marginBottom: 8, animation: `f-gauche .6s ${k * 0.15}s both` }}>
            <span style={{ fontSize: 26 }}>{e}</span><span style={{ fontSize: 15.5, lineHeight: 1.45 }}>{t}</span>
          </div>
        ))}
        {questions.length > 0 && (
          <>
            <h3 style={{ fontSize: 17, margin: '18px 0 8px' }}>❓ Mini-quiz de l'épisode</h3>
            {questions.map((q, k) => (
              <button key={k} onClick={() => setVues(v => ({ ...v, [k]: true }))} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', color: '#fff', background: vues[k] ? 'rgba(6,214,160,.16)' : 'rgba(255,255,255,.06)', border: `1px solid ${vues[k] ? '#06d6a0' : 'rgba(255,255,255,.2)'}`, fontFamily: 'inherit' }}>
                <strong style={{ display: 'block', fontSize: 15 }}>{q.q}</strong>
                <span style={{ fontSize: 14, opacity: 0.9 }}>{vues[k] ? `✅ ${q.r}` : 'Réponds dans ta tête, puis touche pour vérifier'}</span>
              </button>
            ))}
          </>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0 10px' }}>
          <button onClick={onRevoir} className="f-controle" style={{ padding: '0 16px' }}>↺ Revoir l'épisode</button>
          <button onClick={onFermer} className="f-controle f-plein" style={{ padding: '0 18px' }}>Terminer</button>
        </div>
      </div>
    </div>
  )
}
