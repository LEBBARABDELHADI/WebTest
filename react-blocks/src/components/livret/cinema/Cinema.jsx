import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react'
import Personnage from './Personnage'
import DecorCinema, { Particules } from './Decors10'
import Visuel from './Visuels10'
import { CSS_CINÉMA } from '../../../lib/livret2026/cinema/cinemaCss'
import { créerSonCinéma, garderVoix, lireVoix, effacerVoix, clésVoix, enregistreur, jouerVoix } from '../../../lib/livret2026/cinema/sonCinema'
import { imagePage } from '../../../lib/livret2026/outils'
import { distribuerVoix, jouerRéplique } from '../../../lib/livret2026/cinema/voixActeurs'

// Expérience narrative cinématographique (PROTOTYPE, page 10).
// Affiche → scènes (décor en couches + caméra + personnages dessinés +
// visuels pédagogiques) → quiz. Faits officiels sur des cartes « 📜 Livret »,
// fiction en sous-titres. Son sans IA : ambiances, bruitages, piano « humain »,
// vraies voix enregistrées dans le studio.

const CLÉ_RÉGLAGES = 'react-blocs-cinema-reglages'
const lireRéglages = () => { try { return { musique: true, ambiance: true, voix: true, synthèse: true, taille: 1, ...JSON.parse(localStorage.getItem(CLÉ_RÉGLAGES) || '{}') } } catch { return { musique: true, ambiance: true, voix: true, synthèse: true, taille: 1 } } }
const mélanger = l => { const c = [...l]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] } return c }
const cléVoix = (page, scène, k) => `p${page}:${scène}:${k}`

// Temps de lecture « humain » : selon la longueur, avec des respirations
// aux virgules et aux points.
const durée = t => t.officiel
  ? 2600 + t.officiel.texte.length * 52
  : 1100 + t.texte.length * 58 + (t.texte.match(/[,;:]/g) || []).length * 180 + (t.texte.match(/[.!?…]/g) || []).length * 320
const duréeParole = t => (t.texte ? Math.min(durée(t) - 600, 400 + t.texte.length * 46) : 0)

function useTaille(ref, actif) {
  const [t, setT] = useState({ l: 800, h: 450 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const m = () => setT({ l: el.clientWidth, h: el.clientHeight })
    m()
    const o = new ResizeObserver(m)
    o.observe(el)
    return () => o.disconnect()
  }, [ref, actif])
  return t
}

export default function Cinema({ film, personnages, onFermer, onTerminé }) {
  const [phase, setPhase] = useState('affiche') // affiche | film | quiz
  const [s, setS] = useState(0)
  const [b, setB] = useState(0)
  const [lecture, setLecture] = useState(true)
  const [réglages, setRéglages] = useState(lireRéglages)
  const [transition, setTransition] = useState(null)
  const [menu, setMenu] = useState(false)
  const [original, setOriginal] = useState(false)
  const [studio, setStudio] = useState(false)
  const [voix, setVoix] = useState(() => new Set())
  const [niveau, setNiveau] = useState(null)
  const [parlant, setParlant] = useState(null)
  const son = useRef(null)
  const lectureVoix = useRef(null)
  const génération = useRef(0)
  const scèneRef = useRef(null)
  const taille = useTaille(scèneRef, phase)
  const scène = film.scènes[s]
  const t = scène.temps[b]
  const étape = scène.temps.slice(0, b + 1).reduce((m, x) => Math.max(m, x.étape || 0), 0)

  const régler = (k, v) => setRéglages(r => { const n = { ...r, [k]: v }; try { localStorage.setItem(CLÉ_RÉGLAGES, JSON.stringify(n)) } catch { /* ignore */ } return n })
  // Voix de l'appareil distribuées aux personnages (la liste arrive parfois en retard).
  const [distribution, setDistribution] = useState(() => distribuerVoix(personnages))
  useEffect(() => {
    const maj = () => setDistribution(distribuerVoix(personnages))
    window.speechSynthesis?.addEventListener?.('voiceschanged', maj)
    const t = setTimeout(maj, 600)
    return () => { window.speechSynthesis?.removeEventListener?.('voiceschanged', maj); clearTimeout(t) }
  }, [personnages])
  const rafraîchirVoix = useCallback(() => clésVoix().then(k => setVoix(new Set(k.filter(x => String(x).startsWith(`p${film.page}:`))))).catch(() => {}), [film.page])
  useEffect(() => { rafraîchirVoix() }, [rafraîchirVoix])
  useEffect(() => () => { génération.current++; lectureVoix.current?.arrêter(); son.current?.fermer() }, [])

  // Son de la scène.
  useEffect(() => {
    const x = son.current
    if (!x || phase !== 'film') return
    x.réglages({ musique: réglages.musique ? 0.55 : 0, ambiance: réglages.ambiance ? 0.7 : 0 })
    x.musique(scène.musique); x.ambiance(scène.ambiance)
    if (lecture) x.démarrer(); else x.pause()
  }, [phase, s, lecture, réglages.musique, réglages.ambiance]) // eslint-disable-line react-hooks/exhaustive-deps

  // Déroulé, temps par temps.
  useEffect(() => {
    if (phase !== 'film' || !lecture || transition) return undefined
    const g = ++génération.current
    const encore = () => génération.current === g
    let minuteurs = []
    const après = (ms, fn) => minuteurs.push(setTimeout(() => { if (encore()) fn() }, ms))
    if (b >= scène.temps.length) {
      après(1200, () => (s < film.scènes.length - 1 ? allerScène(s + 1) : setPhase('quiz')))
      return () => minuteurs.forEach(clearTimeout)
    }
    if (t.son) son.current?.effet(t.son)
    const k = cléVoix(film.page, scène.id, b)
    const suivant = () => après(t.officiel ? 400 : 650, () => setB(x => x + 1))
    const démarrer = async () => {
      if (t.texte && réglages.voix && voix.has(k)) {
        const blob = await lireVoix(k).catch(() => null)
        if (blob && encore()) {
          son.current?.atténuer(true)
          setParlant(t.qui)
          const l = jouerVoix(son.current, blob, v => encore() && setNiveau(v))
          lectureVoix.current = l
          await l.promesse
          if (!encore()) return
          son.current?.atténuer(false); setParlant(null); setNiveau(null)
          suivant()
          return
        }
      }
      // Mode mixte : sinon, la voix la plus naturelle de l'appareil, « jouée »
      // phrase par phrase (les cartes officielles sont lues par la narration).
      const qui = t.officiel ? 'narrateur' : t.qui
      const v = réglages.synthèse && distribution?.get(qui)
      if (v) {
        son.current?.atténuer(true)
        const l = jouerRéplique(t.officiel ? t.officiel.texte : t.texte, v, personnages[qui]?.voix, parle => { if (encore()) setParlant(parle && !t.officiel ? t.qui : null) })
        lectureVoix.current = l
        await l.promesse
        if (!encore()) return
        son.current?.atténuer(false); setParlant(null)
        suivant()
        return
      }
      // Sans voix : sous-titres au rythme de lecture, lèvres qui bougent le
      // temps de la réplique.
      if (t.texte) { setParlant(t.qui); après(duréeParole(t), () => setParlant(null)) }
      après(durée(t), suivant)
    }
    après(b === 0 ? 900 : 120, démarrer)
    return () => { minuteurs.forEach(clearTimeout); lectureVoix.current?.arrêter(); lectureVoix.current = null; setParlant(null); setNiveau(null); son.current?.atténuer(false) }
  }, [phase, s, b, lecture, transition, réglages.voix, réglages.synthèse, voix, distribution]) // eslint-disable-line react-hooks/exhaustive-deps

  function allerScène(k) {
    if (k < 0 || k >= film.scènes.length) return
    génération.current++
    const type = film.scènes[k].transition || 'fondu'
    son.current?.effet('whoosh')
    setTransition(type)
    setTimeout(() => { setS(k); setB(0) }, 560)
    setTimeout(() => setTransition(null), 1200)
  }
  const lancer = () => {
    try { window.speechSynthesis?.speak(Object.assign(new SpeechSynthesisUtterance(' '), { volume: 0 })) } catch { /* ignore */ }
    if (!son.current) son.current = créerSonCinéma()
    son.current?.démarrer()
    setPhase('film'); setS(0); setB(0); setLecture(true)
  }
  const basculer = () => setLecture(l => !l)
  useEffect(() => {
    const touche = e => {
      if (studio || original) { if (e.key === 'Escape') { setStudio(false); setOriginal(false) } return }
      if (e.key === 'Escape') onFermer()
      if (phase !== 'film') return
      if (e.key === ' ') { e.preventDefault(); basculer() }
      if (e.key === 'ArrowRight') allerScène(s + 1)
      if (e.key === 'ArrowLeft') allerScène(s - 1)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  // Caméra : mouvement de la scène + léger recadrage vers celui qui parle.
  const progrès = scène.temps.length ? Math.min(1, b / scène.temps.length) : 0
  const de = scène.caméra?.de || { x: 0, z: 1 }, à = scène.caméra?.à || { x: 0, z: 1 }
  const quiParle = t?.qui && t.qui !== 'narrateur' ? (scène.personnages || []).find(p => p.id === t.qui) : null
  const cx = de.x + (à.x - de.x) * progrès + (quiParle ? (50 - quiParle.x) * 0.05 : 0)
  const cz = de.z + (à.z - de.z) * progrès + (quiParle ? 0.025 : 0)
  const flouFond = scène.focus === 'fond' ? 0 : (scene => (scene.personnages?.length ? 2.6 : 0))(scène)
  const couche = (facteur, flou, enfant, extra = {}) => (
    <div className="c-couche" style={{ transform: `translateX(${cx * facteur}%) scale(${1 + (cz - 1) * facteur})`, filter: flou ? `blur(${flou}px)` : 'none', ...extra }}>{enfant}</div>
  )
  // Taille des personnages : selon la hauteur de l'écran, sans se chevaucher.
  const hPerso = n => Math.min(taille.h * 0.82, ((taille.l * (n > 1 ? (taille.l < taille.h ? 0.5 : 0.46) : 0.7)) / 0.75))

  // ---------- Affiche ----------
  if (phase === 'affiche') {
    return (
      <div className="c-ecran" role="dialog" aria-modal="true" aria-label={`${film.titre} : court-métrage de la page ${film.page}`}>
        <style>{CSS_CINÉMA}</style>
        <div style={{ position: 'absolute', inset: 0 }}>
          <div className="c-couche"><DecorCinema nom="rue-soir" couche="fond" /></div>
          <div className="c-couche"><DecorCinema nom="rue-soir" couche="milieu" /></div>
          <Particules type="feuilles" n={18} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(5,6,20,.55), rgba(5,6,20,.88))' }} />
        <div style={{ position: 'relative', zIndex: 2, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 18px', gap: 10 }}>
          <span style={{ fontSize: 11.5, letterSpacing: '.34em', textTransform: 'uppercase', color: '#ffd166' }}>Prototype · Livret du citoyen · page {film.page}</span>
          <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 'clamp(38px, 8vw, 74px)', fontWeight: 700, lineHeight: 1, textShadow: '0 8px 30px rgba(0,0,0,.7)' }}>{film.titre}</h2>
          <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(16px, 2.6vw, 22px)', opacity: 0.9 }}>{film.sousTitre}</p>
          <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 18px)', margin: '10px 0 4px' }}>
            {Object.entries(personnages).filter(([k]) => k !== 'narrateur').map(([k, p]) => (
              <div key={k} style={{ width: 'clamp(76px, 14vw, 120px)', textAlign: 'center' }}>
                <div style={{ height: 'clamp(92px, 17vw, 150px)' }}><Personnage p={p} émotion="sourire" regard="face" /></div>
                <strong style={{ display: 'block', fontSize: 13.5, color: p.couleur }}>{p.nom}</strong>
                <span style={{ fontSize: 11.5, opacity: 0.75 }}>{p.rôle}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '4px 0', maxWidth: 560, fontSize: 13.5, opacity: 0.85, lineHeight: 1.5 }}>🎭 {film.avertissement}</p>
          <p style={{ margin: 0, fontSize: 12.5, opacity: 0.7 }}>{film.scènes.length} scènes · environ 7 min · puis un quiz de {film.quiz.length} questions</p>
          <p style={{ margin: 0, maxWidth: 600, fontSize: 12.5, opacity: 0.8, lineHeight: 1.5 }}>
            🗣️ {voix.size ? `${voix.size} réplique(s) avec ta vraie voix ; ` : ''}{distribution ? `les autres, voix de l'appareil : ${[...new Set([...distribution.values()].map(v => v.name.replace(/\s*\(.*\)/, '')))].slice(0, 3).join(', ')}` : 'aucune voix française sur cet appareil : sous-titres seuls'}
            <button onClick={() => régler('synthèse', !réglages.synthèse)} aria-pressed={réglages.synthèse} className="c-btn" style={{ minHeight: 30, fontSize: 12, marginLeft: 8 }}>{réglages.synthèse ? 'Voix de l\'appareil : oui' : 'Voix de l\'appareil : non'}</button>
          </p>
          <button onClick={lancer} className="c-btn c-plein" style={{ minHeight: 56, padding: '0 30px', fontSize: 18, borderRadius: 28, marginTop: 6 }}>▶ Lancer l'histoire</button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setStudio(true)} className="c-btn">🎙️ Voix humaines ({voix.size}/{film.scènes.reduce((n, x) => n + x.temps.filter(y => y.texte).length, 0)})</button>
            <button onClick={() => setOriginal(true)} className="c-btn">📄 Page originale</button>
            <button onClick={onFermer} className="c-btn">Fermer</button>
          </div>
        </div>
        {studio && <Studio film={film} personnages={personnages} voix={voix} onMàj={rafraîchirVoix} onFermer={() => setStudio(false)} />}
        {original && <PageOriginale page={film.page} onFermer={() => setOriginal(false)} />}
      </div>
    )
  }

  if (phase === 'quiz') {
    return (
      <div className="c-ecran" role="dialog" aria-modal="true" aria-label="Quiz de la page 10">
        <style>{CSS_CINÉMA}</style>
        <Quiz film={film} onRevoir={id => { const k = film.scènes.findIndex(x => x.id === id); setPhase('film'); setS(Math.max(0, k)); setB(0); setLecture(true) }} onRejouer={() => { setPhase('film'); setS(0); setB(0); setLecture(true) }} onFermer={onFermer} onTerminé={onTerminé} onOriginal={() => setOriginal(true)} />
        {original && <PageOriginale page={film.page} onFermer={() => setOriginal(false)} />}
      </div>
    )
  }

  const persos = scène.personnages || []
  return (
    <div className="c-ecran" role="dialog" aria-modal="true" aria-label={`${film.titre} : scène ${s + 1} sur ${film.scènes.length}, ${scène.titre}`} style={{ '--c-taille': `clamp(${16 * réglages.taille}px, ${2.3 * réglages.taille}vw, ${22 * réglages.taille}px)` }}>
      <style>{CSS_CINÉMA}</style>
      <div className="c-scene" ref={scèneRef}>
        <div key={scène.id} style={{ position: 'absolute', inset: 0 }}>
          {couche(0.35, flouFond, <DecorCinema nom={scène.décor} couche="fond" étape={étape} visuel={scène.visuel} />)}
          {couche(0.65, flouFond ? flouFond * 0.45 : 0, <DecorCinema nom={scène.décor} couche="milieu" étape={étape} visuel={scène.visuel} />)}
          {(scène.étiquettes || []).map(([txt, x]) => <span key={txt} style={{ position: 'absolute', zIndex: 3, top: '15%', left: `${x}%`, padding: '6px 12px', borderRadius: 18, background: 'rgba(0,0,0,.5)', fontSize: 'clamp(11px, 1.6vw, 15px)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#22c55e', marginRight: 6 }} />{txt}</span>)}
          <div className="c-couche" style={{ transform: `translateX(${cx}%) scale(${cz})`, transformOrigin: '50% 100%', inset: 0 }}>
            {persos.map((p, k) => {
              const h = hPerso(persos.length) * (p.échelle || 1)
              const pp = personnages[p.id]
              const actif = parlant === p.id || t?.qui === p.id
              const émo = scène.temps.slice(0, b + 1).filter(x => x.qui === p.id && x.émotion).at(-1)?.émotion || 'neutre'
              const geste = t?.qui === p.id ? t.geste : null
              return (
                <div key={`${scène.id}-${p.id}`} className={`c-perso-boite c-entre ${t?.qui && t.qui !== 'narrateur' && !actif ? 'c-silence' : ''}`} style={{ left: `${p.x}%`, height: h, width: h * 0.75, animationDelay: `${0.3 + k * 0.25}s`, zIndex: actif ? 3 : 2 }}>
                  <Personnage p={pp} émotion={émo} parle={parlant === p.id} niveau={parlant === p.id ? niveau : null} regard={p.regard} geste={geste} lumière={scène.lumière} />
                </div>
              )
            })}
          </div>
          <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}><Visuel nom={scène.visuel} étape={étape} carton={scène.carton} /></div>
          {couche(1.4, persos.length ? 5 : 0, <DecorCinema nom={scène.décor} couche="avant" étape={étape} visuel={scène.visuel} />, { zIndex: 5, pointerEvents: 'none' })}
          {scène.particules && <div style={{ position: 'absolute', inset: 0, zIndex: 6 }}><Particules type={scène.particules} n={22} /></div>}
          {scène.titreFilm && b === 0 && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'radial-gradient(ellipse, rgba(0,0,0,.5), transparent 70%)', pointerEvents: 'none' }}>
              <span className="c-apparait" style={{ letterSpacing: '.4em', fontSize: 'clamp(11px, 1.6vw, 15px)', color: '#ffd166' }}>LIVRET DU CITOYEN · PAGE {film.page}</span>
              <span className="c-titre-carton" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(40px, 9vw, 92px)', fontWeight: 700, textShadow: '0 8px 30px rgba(0,0,0,.8)' }}>{film.titre}</span>
            </div>
          )}
        </div>
        <div className="c-vignette" style={{ zIndex: 7 }} />
        <div className="c-fuite" style={{ zIndex: 7 }} />
        <div className="c-grain" style={{ zIndex: 7 }} />
        <div className="c-bande" style={{ top: 0 }} />

        {/* Faits officiels */}
        {t?.officiel && (
          <div key={`o-${s}-${b}`} className="c-officiel" role="note" aria-label="Texte officiel du Livret du citoyen">
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: 6 }}>📜 Texte officiel · {t.officiel.source}</div>
            <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 'clamp(15px, 2.1vw, 20px)', lineHeight: 1.5 }}>{t.officiel.texte}</p>
          </div>
        )}
        <div style={{ position: 'absolute', top: 'clamp(22px, 6.5vh, 66px)', right: 10, zIndex: 9, display: 'flex', gap: 6 }}>
          <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: 11, fontWeight: 800, background: t?.officiel ? '#fbf7ee' : 'rgba(0,0,0,.55)', color: t?.officiel ? '#1d4ed8' : '#fff' }}>{t?.officiel ? '📜 OFFICIEL' : '🎭 FICTION'}</span>
        </div>
        {transition && <div className={`c-transition c-tr-${transition}`} />}
      </div>

      {/* Sous-titres + commandes */}
      <div style={{ flex: '0 0 auto', background: '#000', padding: '8px 12px max(10px, env(safe-area-inset-bottom))' }}>
        <div aria-live="polite" style={{ minHeight: 'calc(var(--c-taille) * 3.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {t?.texte && (
            <p key={`${s}-${b}`} className="c-sous-titre">
              {t.qui === 'narrateur'
                ? <em style={{ color: '#e7e2d4' }}>{t.texte}</em>
                : <><strong style={{ color: personnages[t.qui]?.couleur }}>{personnages[t.qui]?.nom} : </strong>{t.texte}</>}
            </p>
          )}
          {t?.officiel && <p className="c-sous-titre" style={{ opacity: 0.7, fontSize: '0.85em' }}>📜 À lire : le texte officiel du livret.</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }} aria-hidden="true">
          {film.scènes.map((x, k) => <button key={x.id} tabIndex={-1} onClick={() => allerScène(k)} title={x.titre} style={{ flex: 1, height: 5, minHeight: 0, minWidth: 0, padding: 0, border: 'none', borderRadius: 3, cursor: 'pointer', background: k < s ? '#ffd166' : k === s ? `linear-gradient(90deg, #fff ${Math.round(progrès * 100)}%, rgba(255,255,255,.3) 0)` : 'rgba(255,255,255,.18)' }} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => allerScène(s - 1)} disabled={s === 0} aria-label="Scène précédente" className="c-btn" style={{ opacity: s === 0 ? 0.4 : 1 }}>⏮</button>
          <button onClick={basculer} aria-label={lecture ? 'Pause' : 'Reprendre'} className="c-btn c-plein" style={{ minWidth: 64 }}>{lecture ? '⏸' : '▶'}</button>
          <button onClick={() => (s < film.scènes.length - 1 ? allerScène(s + 1) : setPhase('quiz'))} aria-label="Scène suivante" className="c-btn">⏭</button>
          <button onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label="Liste des scènes" className="c-btn">☰ <span style={{ fontSize: 12 }}>{s + 1}/{film.scènes.length}</span></button>
          <button onClick={() => { setLecture(false); setOriginal(true) }} aria-label="Page originale" className="c-btn">📄</button>
          <button onClick={() => { régler('synthèse', !réglages.synthèse); window.speechSynthesis?.cancel() }} aria-pressed={réglages.synthèse} aria-label="Voix de l'appareil" title="Voix de synthèse de l'appareil (les voix enregistrées passent toujours en premier)" className="c-btn">{réglages.synthèse ? '🗣️' : '🤐'}</button>
          <button onClick={() => régler('musique', !réglages.musique)} aria-pressed={réglages.musique} aria-label="Musique" className="c-btn">{réglages.musique ? '🎹' : '🔇'}</button>
          <button onClick={() => régler('ambiance', !réglages.ambiance)} aria-pressed={réglages.ambiance} aria-label="Ambiance sonore" className="c-btn">🌧️</button>
          <button onClick={() => régler('taille', réglages.taille >= 1.3 ? 0.9 : Math.round((réglages.taille + 0.2) * 10) / 10)} aria-label="Taille des sous-titres" className="c-btn" style={{ fontWeight: 800, fontSize: 13 }}>A{réglages.taille > 1 ? '+' : réglages.taille < 1 ? '−' : ''}</button>
          <button onClick={onFermer} aria-label="Fermer" className="c-btn">✕</button>
        </div>
      </div>

      {menu && (
        <div role="dialog" aria-label="Scènes" style={{ position: 'absolute', right: 10, bottom: 'clamp(130px, 22vh, 190px)', zIndex: 30, width: 'min(320px, calc(100vw - 20px))', maxHeight: '60vh', overflowY: 'auto', background: 'rgba(14,14,24,.96)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, padding: 6 }}>
          {film.scènes.map((x, k) => <button key={x.id} onClick={() => { setMenu(false); allerScène(k) }} aria-current={k === s ? 'true' : undefined} style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: k === s ? 'rgba(255,209,102,.18)' : 'transparent', color: '#fff', fontSize: 14 }}><span style={{ opacity: 0.6, width: 20 }}>{k + 1}</span>{x.titre}</button>)}
          <button onClick={() => { setMenu(false); setPhase('quiz') }} style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#ffd166', fontSize: 14, fontWeight: 700 }}><span style={{ width: 20 }}>✓</span>Quiz final</button>
        </div>
      )}
      {original && <PageOriginale page={film.page} onFermer={() => setOriginal(false)} />}
    </div>
  )
}

function PageOriginale({ page, onFermer }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={`Page ${page} originale`} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'max(12px, env(safe-area-inset-top)) 12px 12px' }}>
      <div style={{ display: 'flex', width: 'min(100%, 760px)', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ flex: 1, color: '#fff' }}>📄 Page {page} originale du Livret du citoyen</strong>
        <button onClick={onFermer} className="c-btn" aria-label="Fermer la page originale">✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', width: 'min(100%, 760px)' }}>
        <img src={imagePage(page)} alt={`Page ${page} du Livret du citoyen`} style={{ width: '100%', borderRadius: 6, background: '#fff' }} />
      </div>
    </div>
  )
}

// Studio : enregistrer de vraies voix, réplique par réplique.
function Studio({ film, personnages, voix, onMàj, onFermer }) {
  const [enCours, setEnCours] = useState(null)
  const [erreur, setErreur] = useState('')
  const rec = useRef(null)
  const lecture = useRef(null)
  const lignes = film.scènes.flatMap(sc => sc.temps.map((t, k) => ({ t, k, sc })).filter(x => x.t.texte))
  const démarrer = async clé => {
    setErreur('')
    try { rec.current = await enregistreur(); setEnCours(clé) } catch { setErreur('Micro indisponible : autorise le micro dans le navigateur pour enregistrer.') }
  }
  const arrêter = async () => {
    const blob = await rec.current?.arrêter()
    if (blob && enCours) await garderVoix(enCours, blob)
    rec.current = null; setEnCours(null); onMàj()
  }
  const écouter = async clé => {
    const blob = await lireVoix(clé)
    if (!blob) return
    lecture.current?.pause?.()
    const a = new Audio(URL.createObjectURL(blob)); lecture.current = a; a.play().catch(() => {})
  }
  return (
    <div role="dialog" aria-modal="true" aria-label="Studio des voix" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#0b0b12', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'max(14px, env(safe-area-inset-top)) 16px 10px', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ flex: 1, fontSize: 18 }}>🎙️ Studio des voix humaines</strong>
          <button onClick={onFermer} className="c-btn" aria-label="Fermer le studio">✕</button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13.5, opacity: 0.8, lineHeight: 1.5 }}>Pas de voix artificielle : enregistre chaque réplique avec ta voix (ou demande à un proche de jouer un personnage). Les lèvres suivront ta voix. {voix.size}/{lignes.length} répliques enregistrées, gardées sur cet appareil.</p>
        {erreur && <p role="alert" style={{ margin: '6px 0 0', color: '#fca5a5', fontSize: 13.5 }}>{erreur}</p>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 20px' }}>
        {film.scènes.map(sc => {
          const l = lignes.filter(x => x.sc.id === sc.id)
          if (!l.length) return null
          return (
            <div key={sc.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#ffd166', margin: '10px 0 6px' }}>{sc.titre}</div>
              {l.map(({ t, k }) => {
                const clé = cléVoix(film.page, sc.id, k)
                const a = voix.has(clé), rec2 = enCours === clé
                const p = personnages[t.qui]
                return (
                  <div key={clé} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, marginBottom: 6, background: rec2 ? 'rgba(239,68,68,.16)' : 'rgba(255,255,255,.05)', border: `1px solid ${rec2 ? '#ef4444' : 'rgba(255,255,255,.08)'}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 12.5, color: p?.couleur || '#ddd' }}>{p?.nom}</strong>
                      <div style={{ fontSize: 14, lineHeight: 1.4 }}>{t.texte}</div>
                    </div>
                    {rec2
                      ? <button onClick={arrêter} className="c-btn" style={{ background: '#ef4444', borderColor: '#ef4444' }} aria-label="Arrêter l'enregistrement">■</button>
                      : <button onClick={() => démarrer(clé)} disabled={!!enCours} className="c-btn" aria-label={`Enregistrer : ${t.texte}`}>●</button>}
                    {a && !rec2 && <button onClick={() => écouter(clé)} className="c-btn" aria-label="Écouter">▶</button>}
                    {a && !rec2 && <button onClick={() => effacerVoix(clé).then(onMàj)} className="c-btn" aria-label="Effacer">🗑</button>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Quiz({ film, onRevoir, onRejouer, onFermer, onTerminé, onOriginal }) {
  const questions = useMemo(() => film.quiz.map(q => ({ ...q, options: mélanger([q.r, ...q.f]) })), [film])
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState(null)
  const [bonnes, setBonnes] = useState(0)
  const [fin, setFin] = useState(false)
  const q = questions[i]
  const scène = q && film.scènes.find(x => x.id === q.scène)
  const officiel = scène?.temps.filter(x => x.officiel)[q?.o || 0]?.officiel
  const suivante = () => {
    if (i + 1 < questions.length) { setI(x => x + 1); setChoix(null) } else { setFin(true); onTerminé?.(bonnes, questions.length) }
  }
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'radial-gradient(120% 90% at 50% 0%, #2b2552, #07070d)', padding: 'max(16px, env(safe-area-inset-top)) 16px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 12, letterSpacing: '.18em', color: '#ffd166' }}>QUIZ · PAGE {film.page}</span>
          <button onClick={onOriginal} className="c-btn" style={{ fontSize: 13 }}>📄 Page originale</button>
          <button onClick={onFermer} className="c-btn" aria-label="Fermer">✕</button>
        </div>
        {!fin ? (
          <div key={i} className="c-apparait">
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.15)', marginBottom: 14 }}><div style={{ width: `${(i / questions.length) * 100}%`, height: '100%', borderRadius: 3, background: '#ffd166' }} /></div>
            <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 4px' }}>Question {i + 1} / {questions.length}</p>
            <h2 style={{ margin: '0 0 14px', fontFamily: 'Georgia, serif', fontSize: 'clamp(20px, 4vw, 28px)', lineHeight: 1.3 }}>{q.q}</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {q.options.map(o => {
                const vu = !!choix, bon = o === q.r, pris = choix === o
                return <button key={o} onClick={() => { if (choix) return; setChoix(o); if (bon) setBonnes(x => x + 1) }} disabled={vu} style={{ textAlign: 'left', padding: '13px 15px', borderRadius: 14, fontSize: 16, lineHeight: 1.4, cursor: vu ? 'default' : 'pointer', color: '#fff', border: `2px solid ${vu ? (bon ? '#22c55e' : pris ? '#ef4444' : 'rgba(255,255,255,.15)') : 'rgba(255,255,255,.22)'}`, background: vu && bon ? 'rgba(34,197,94,.18)' : pris ? 'rgba(239,68,68,.16)' : 'rgba(255,255,255,.05)', fontFamily: 'inherit' }}>{vu ? (bon ? '✅ ' : pris ? '❌ ' : '') : ''}{o}</button>
              })}
            </div>
            {choix && (
              <div className="c-apparait" style={{ marginTop: 14 }}>
                {officiel && <div style={{ background: '#fbf7ee', color: '#1b1b2a', borderRadius: 12, padding: '12px 14px', borderLeft: '8px solid #2563eb', fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.5 }}><div style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 900, letterSpacing: '.1em', color: '#1d4ed8', marginBottom: 4 }}>📜 TEXTE OFFICIEL</div>{officiel.texte}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={suivante} className="c-btn c-plein" style={{ padding: '0 18px' }}>{i + 1 < questions.length ? 'Question suivante →' : 'Voir mon score'}</button>
                  {choix !== q.r && <button onClick={() => onRevoir(q.scène)} className="c-btn">🎬 Revoir la scène</button>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="c-apparait" style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 64 }}>{bonnes >= 9 ? '🏆' : bonnes >= 7 ? '👏' : '💪'}</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 34, margin: '6px 0' }}>{bonnes} / {questions.length}</h2>
            <p style={{ opacity: 0.85, maxWidth: 480, margin: '0 auto 16px', lineHeight: 1.5 }}>{bonnes >= 8 ? 'Tu as compris et retenu l\'essentiel de la page 10.' : 'Revois les scènes des questions manquées, puis retente le quiz.'}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setI(0); setChoix(null); setBonnes(0); setFin(false) }} className="c-btn">↺ Refaire le quiz</button>
              <button onClick={onRejouer} className="c-btn">🎬 Revoir l'histoire</button>
              <button onClick={onFermer} className="c-btn c-plein" style={{ padding: '0 18px' }}>Terminer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
