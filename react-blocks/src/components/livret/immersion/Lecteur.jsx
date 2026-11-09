// Lecteur « film » de l'Immersion : plans plein écran (bande-annonce, génériques)
// ou carte animée + fiche (décor, personnages, événements, dates), voix
// doublées (edge-tts) réplique par réplique, musique au piano, page du livret.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Carte from './Carte'
import { jouerFichier, précharger } from '../../../lib/livret2026/cinema/sonCinema'
import { direRéplique } from '../../../lib/livret2026/filmAudio'
import { imagePage } from '../../../lib/livret2026/outils'
import { VOIX_IMMERSION } from '../../../lib/livret2026/immersion/voixImmersion'
import { PÉRIODES } from '../../../lib/livret2026/immersion/histoire'
import { parlé } from '../../../lib/livret2026/immersion/scenario'
import { OR, CRÈME, SERIF } from '../../../lib/livret2026/immersion/immersionCss'

const CLÉ = 'react-blocs-immersion-reglages'
const lireRéglages = () => { try { return { voix: true, musique: true, ...JSON.parse(localStorage.getItem(CLÉ) || '{}') } } catch { return { voix: true, musique: true } } }
const urlVoix = f => `${import.meta.env.BASE_URL}${VOIX_IMMERSION.base}${f}`
const VOIX_APPAREIL = { annonce: { pitch: 0.8, rate: 0.92 }, narrateur: { pitch: 0.95, rate: 1 }, narratrice: { pitch: 1.12, rate: 1 } }
const PLEIN_ÉCRAN = new Set(['ba', 'ba-titre', 'générique', 'géo-titre'])
const DÉPART = { ba: 450, 'ba-titre': 900, générique: 1300, 'géo-titre': 1100, frise: 900 }
const ATTENTE = { ba: 700, 'ba-titre': 2200, générique: 900, frise: 1800, transition: 1600 }

function useTaille(ref) {
  const [t, setT] = useState({ l: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const mesurer = () => setT(a => (a.l === el.clientWidth && a.h === el.clientHeight ? a : { l: el.clientWidth, h: el.clientHeight }))
    mesurer()
    const o = new ResizeObserver(mesurer)
    o.observe(el)
    return () => o.disconnect()
  }, [ref])
  return t
}

function RenvoiPage({ n, onPage }) {
  if (!n) return null
  return <button type="button" className="im-page" onClick={() => onPage(n)} aria-label={`Voir la page ${n} du livret`}>📖 p. {n}</button>
}

export function PageLivret({ n, onFermer }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={`Page ${n} du livret`} onClick={onFermer} style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(0,0,0,.86)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'max(12px, env(safe-area-inset-top)) 12px 12px', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 640 }}>
        <div style={{ flex: 1, fontWeight: 800 }}>📖 Livret du citoyen 2026 · page {n}</div>
        <button type="button" className="im-bouton im-rond" onClick={onFermer} aria-label="Fermer la page">✕</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <img src={imagePage(n)} alt={`Page ${n} du Livret du citoyen 2026`} style={{ maxWidth: 'min(100%, 640px)', height: 'auto', alignSelf: 'flex-start', borderRadius: 6, boxShadow: '0 20px 50px rgba(0,0,0,.6)' }} />
      </div>
    </div>
  )
}

// La fiche d'un plan, synchronisée avec la réplique en cours (b).
function Fiche({ plan, b, onPage }) {
  const L = plan.lignes
  const état = i => (i < b ? 'im-ligne-passee' : i === b ? 'im-ligne-actuelle' : 'im-ligne-future')
  const para = { margin: '8px 0 0', fontSize: 'clamp(15px, 1.9vw, 17.5px)', lineHeight: 1.5 }
  const titre = { fontFamily: SERIF, fontSize: 'clamp(21px, 3vw, 28px)', fontWeight: 700, margin: '4px 0 2px', lineHeight: 1.15, color: '#fff' }
  const marque = i => (i === b ? { borderLeft: `3px solid ${OR}`, paddingLeft: 10, marginLeft: -13 } : {})
  switch (plan.type) {
    case 'contexte':
      return (
        <>
          <div className="im-etiquette" style={{ color: plan.couleur === '#1e40af' ? '#93c5fd' : OR }}>🎬 Le décor</div>
          {L.map((l, i) => <p key={l.clé} className={`im-ligne ${état(i)}`} style={{ ...para, ...marque(i) }}>{l.texte} <RenvoiPage n={l.p} onPage={onPage} /></p>)}
        </>
      )
    case 'horsLivret':
      return (
        <>
          <div className="im-etiquette" style={{ color: '#fca5a5' }}>📕 Hors livret</div>
          <p style={para}>{L[0].texte}</p>
          <p style={{ ...para, fontSize: 13.5, opacity: 0.75 }}>Le livret ne vise pas à résumer toute l’histoire de France, mais à présenter « quelques étapes majeures ». <RenvoiPage n={38} onPage={onPage} /></p>
        </>
      )
    case 'personnage': {
      const pp = plan.personnage
      return (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div aria-hidden="true" className="im-monte" style={{ width: 'clamp(62px, 9vw, 84px)', height: 'clamp(62px, 9vw, 84px)', flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 'clamp(30px, 4.6vw, 42px)', background: `radial-gradient(circle at 35% 30%, ${plan.couleur}, #0b0f1a 78%)`, border: `3px solid ${OR}`, boxShadow: `0 0 0 6px rgba(255,209,102,.12), 0 12px 30px rgba(0,0,0,.5)` }}>{pp.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div className="im-etiquette" style={{ color: OR }}>👤 Personnage</div>
              <h3 style={titre}>{pp.nom}</h3>
              {pp.dates && <div style={{ fontSize: 14.5, opacity: 0.85 }}>{pp.dates}</div>}
            </div>
          </div>
          <p className="im-apparait" style={para}>{pp.rôle} <RenvoiPage n={pp.p} onPage={onPage} /></p>
        </>
      )
    }
    case 'événement': {
      const e = plan.événement
      const rangées = [['cause', '❓ Pourquoi ?', e.cause], ['déroulement', '🎬 Ce qui se passe', e.déroulement], ['conséquence', '➡️ Conséquence', e.conséquence]]
      return (
        <>
          <div className="im-annee" key={plan.id} style={{ color: OR, fontSize: 'clamp(24px, 4.2vw, 38px)' }}>{e.date}</div>
          <h3 style={titre}>{e.titre}</h3>
          {rangées.map(([r, nom, texte]) => {
            const i = L.findIndex(l => l.rôle === r)
            if (i < 0 || i > b) return null
            return (
              <div key={r} className={`im-ligne im-monte ${état(i)}`} style={{ marginTop: 10, ...marque(i) }}>
                <div className="im-etiquette" style={{ color: r === 'conséquence' ? '#86efac' : r === 'cause' ? '#fcd34d' : '#93c5fd', fontSize: 11 }}>{nom}</div>
                <div style={{ fontSize: 'clamp(15px, 1.9vw, 17.5px)', lineHeight: 1.45, marginTop: 2 }}>{texte}</div>
              </div>
            )
          })}
          <div style={{ marginTop: 10 }}><RenvoiPage n={e.p} onPage={onPage} /></div>
        </>
      )
    }
    case 'dates': {
      const cour = L[b]?.index
      const dits = new Set(L.slice(0, b + 1).map(l => l.index))
      return (
        <>
          <div className="im-etiquette" style={{ color: OR }}>🗓️ Les dates du chapitre</div>
          <div style={{ fontSize: 12.5, opacity: 0.8, margin: '4px 0 6px' }}>★ indispensable · ○ complémentaire</div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 5 }}>
            {plan.frise.map((f, i) => (
              <li key={i} className="im-ligne" style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '5px 8px', borderRadius: 10, background: cour === i ? 'rgba(255,209,102,.16)' : 'transparent', opacity: f.essentiel ? (dits.has(i) || b >= L.length ? 1 : 0.55) : 0.62, transform: cour === i ? 'translateX(4px)' : 'none' }}>
                <span aria-hidden="true" style={{ color: f.essentiel ? OR : '#94a3b8', width: 14 }}>{f.essentiel ? '★' : '○'}</span>
                <span style={{ fontFamily: SERIF, fontWeight: 700, minWidth: 'min(38%, 150px)', color: f.essentiel ? '#fff' : '#cbd5e1' }}>{f.date}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.35 }}>{f.texte}{!f.essentiel && <span className="im-sr"> (complémentaire)</span>}</span>
              </li>
            ))}
          </ol>
        </>
      )
    }
    case 'transition':
      return (
        <>
          <div className="im-etiquette" style={{ color: OR }}>⏭ À suivre…</div>
          <p className="im-apparait" style={{ ...para, fontFamily: SERIF, fontSize: 'clamp(18px, 2.4vw, 23px)', lineHeight: 1.4 }}>{L[0].texte}</p>
        </>
      )
    case 'fleuve':
    case 'géo':
    case 'pourquoi':
      return (
        <>
          <div className="im-etiquette" style={{ color: plan.type === 'pourquoi' ? '#fcd34d' : '#7dd3fc' }}>{plan.type === 'pourquoi' ? '💡 Pourquoi c’est important' : plan.type === 'fleuve' ? '🌊 Fleuve' : '🌍 Géographie'}</div>
          <h3 style={{ ...titre, color: plan.type === 'fleuve' ? plan.couleur : '#fff' }}>{plan.titre}</h3>
          {(plan.type === 'géo' ? L : L.slice(1)).map((l, k) => { const i = plan.type === 'géo' ? k : k + 1; return <p key={l.clé} className={`im-ligne ${état(i)}`} style={{ ...para, ...marque(i) }}>{plan.type === 'pourquoi' ? plan.texte : l.texte} <RenvoiPage n={l.p} onPage={onPage} /></p> })}
        </>
      )
    default:
      return null
  }
}

// Plans plein écran : bande-annonce, génériques.
function PleinÉcran({ plan }) {
  const ombre = { textShadow: '0 4px 24px rgba(0,0,0,.85)' }
  if (plan.type === 'ba') {
    return (
      <div key={plan.id} style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center', padding: '0 6% clamp(56px, 13vh, 120px)', gap: 10, background: 'linear-gradient(to top, rgba(4,6,12,.92) 8%, rgba(4,6,12,.35) 55%, transparent)' }}>
        <div className="im-annee" style={{ color: plan.couleur === '#ffd166' ? OR : '#fff', fontSize: plan.année.length > 6 ? 'clamp(32px, 7.5vw, 76px)' : 'clamp(56px, 14vw, 132px)', WebkitTextStroke: '1px rgba(0,0,0,.25)' }}>{plan.année}</div>
        <div className="im-monte" style={{ ...ombre, fontFamily: SERIF, fontSize: 'clamp(19px, 3.1vw, 30px)', lineHeight: 1.3, maxWidth: 820, animationDelay: '.35s' }}>{plan.lignes[0].texte}</div>
      </div>
    )
  }
  if (plan.type === 'ba-titre' || plan.type === 'géo-titre') {
    const géo = plan.type === 'géo-titre'
    return (
      <div key={plan.id} style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 6%', gap: 12, background: 'radial-gradient(ellipse at center, rgba(4,6,12,.55), rgba(4,6,12,.9) 80%)' }}>
        <div className="im-etiquette" style={{ color: OR, letterSpacing: '.4em' }}>{géo ? 'Volet géographique' : 'Livret du citoyen 2026'}</div>
        <div className="im-titre-film" style={{ fontSize: 'clamp(44px, 11vw, 112px)', color: '#fff' }}>{géo ? 'La France, ses fleuves et ses frontières' : 'Immersion'}</div>
        <div className="im-monte" style={{ ...ombre, fontFamily: SERIF, fontSize: 'clamp(18px, 2.8vw, 26px)', maxWidth: 760, animationDelay: '1.1s' }}>{géo ? 'Pages 49 à 51 du livret' : 'L’histoire de France, comme un film.'}</div>
      </div>
    )
  }
  // Générique d'épisode.
  return (
    <div key={plan.id} style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 6%', gap: 10, background: `radial-gradient(ellipse at center, ${plan.couleur}55, rgba(4,6,12,.92) 72%)` }}>
      <div className="im-etiquette im-fondu" style={{ color: OR, letterSpacing: '.35em' }}>Épisode {plan.n} · {plan.étapes.length > 1 ? `étapes ${plan.étapes.join(' et ')}` : `étape ${plan.étapes[0]}`} sur 18</div>
      <div className="im-titre-film" style={{ fontSize: plan.titre.length > 28 ? 'clamp(32px, 7vw, 74px)' : 'clamp(40px, 9vw, 96px)', color: '#fff', maxWidth: 1000 }}>{plan.titre}</div>
      <div aria-hidden="true" className="im-apparait" style={{ width: 'min(240px, 50vw)', height: 2, background: `linear-gradient(90deg, transparent, ${OR}, transparent)`, animationDelay: '1s' }} />
      <div className="im-monte" style={{ ...ombre, fontFamily: SERIF, fontSize: 'clamp(18px, 2.8vw, 26px)', color: CRÈME, animationDelay: '1.3s' }}>{plan.période}</div>
    </div>
  )
}

function CompteÀRebours({ secondes, onFin }) {
  const [reste, setReste] = useState(secondes)
  useEffect(() => {
    if (reste <= 0) { onFin(); return undefined }
    const t = setTimeout(() => setReste(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [reste]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span style={{ opacity: 0.8, fontWeight: 600 }}> · dans {reste} s</span>
}

// Écran de fin : action principale (lancée seule après un compte à rebours si
// « auto »), autres actions ; { revoir: true } relance le film.
function FinFilm({ titre, texte, principal, autres = [], auto, onRevoir }) {
  const [attente, setAttente] = useState(!!auto)
  return (
    <div style={{ textAlign: 'center', maxWidth: 620 }} className="im-monte">
      <div className="im-etiquette" style={{ color: OR }}>Fin</div>
      <div className="im-titre-film" style={{ fontSize: 'clamp(28px, 6vw, 52px)', margin: '6px 0 8px' }}>{titre}</div>
      {texte && <p style={{ lineHeight: 1.5, fontSize: 16.5, margin: '0 0 16px', opacity: 0.9 }}>{texte}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="im-bouton im-plein" onClick={principal.onClick} autoFocus>{principal.libellé}{attente && <CompteÀRebours secondes={auto} onFin={principal.onClick} />}</button>
        {attente && <button type="button" className="im-bouton" onClick={() => setAttente(false)}>Rester ici</button>}
        {autres.map(a => <button key={a.libellé} type="button" className="im-bouton" onClick={a.revoir ? onRevoir : a.onClick}>{a.libellé}</button>)}
      </div>
    </div>
  )
}

// La grande frise du livret (p. 38), période par période.
function GrandeFrise({ plan, b }) {
  const cour = plan.lignes[b]?.période
  const dites = new Set(plan.lignes.slice(0, b + 1).map(l => l.période))
  const fini = b >= plan.lignes.length
  return (
    <div className="im-defile" style={{ position: 'absolute', inset: 0, padding: 'clamp(12px, 3vh, 28px) clamp(10px, 3vw, 32px)', background: 'radial-gradient(ellipse at 50% 0%, #1b2440, #07090f 70%)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(8px, 2vh, 18px)' }}>
        <div className="im-etiquette" style={{ color: OR }}>La grande frise · page 38 du livret</div>
        <div className="im-titre-film" style={{ fontSize: 'clamp(24px, 4.5vw, 44px)', marginTop: 4 }}>Les principales périodes de l’histoire de France</div>
      </div>
      <ol style={{ listStyle: 'none', margin: '0 auto', padding: 0, maxWidth: 1100, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(30%, 150px), 1fr))', gap: 'clamp(5px, 1vw, 10px)' }}>
        {PÉRIODES.map((p, i) => {
          const actif = cour === i, vu = fini || dites.has(i) || p.début == null
          return (
            <li key={p.nom} className="im-ligne" style={{ position: 'relative', borderRadius: 12, padding: 'clamp(6px, 1.2vh, 10px) 9px', background: `linear-gradient(160deg, ${p.couleur}${vu ? 'cc' : '44'}, rgba(10,12,20,.9))`, border: `1px solid ${actif ? OR : 'rgba(255,255,255,.14)'}`, boxShadow: actif ? `0 0 0 3px rgba(255,209,102,.35), 0 10px 30px ${p.couleur}88` : 'none', transform: actif ? 'scale(1.06)' : 'none', opacity: vu ? 1 : 0.45, zIndex: actif ? 2 : 1 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(15px, 2.2vw, 20px)', color: actif ? OR : '#fff' }}>{p.début == null ? 'Avant 476' : p.fin ? `${p.début} – ${p.fin}` : `Depuis ${p.début}`}</div>
              <div style={{ fontSize: 'clamp(12px, 1.5vw, 14px)', lineHeight: 1.25, marginTop: 2 }}>{p.nom}</div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function Lecteur({ plans, son, titre, onFermer, fin, onFini, début = 0 }) {
  const [réglages, setRéglages] = useState(lireRéglages)
  const [p, setP] = useState(début)
  const [b, setB] = useState(0)
  const [lecture, setLecture] = useState(true)
  const [terminé, setTerminé] = useState(false)
  const [pageVue, setPageVue] = useState(null)
  const génération = useRef(0)
  const lectureVoix = useRef(null)
  const scène = useRef(null)
  const { l: lS, h: hS } = useTaille(scène)
  const plan = plans[p]
  const large = lS >= 720 && lS > hS * 1.05
  const plein = PLEIN_ÉCRAN.has(plan.type)
  const ligne = plan.lignes[Math.min(b, plan.lignes.length - 1)]
  const pageActuelle = ligne?.p || plan.p

  const régler = (k, v) => setRéglages(r => { const n = { ...r, [k]: v }; try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* ignore */ } return n })
  const couperVoix = () => { lectureVoix.current?.arrêter(); lectureVoix.current = null; window.speechSynthesis?.cancel() }

  // Précharge les voix du plan en cours et du suivant.
  useEffect(() => {
    if (!son) return
    ;[p, p + 1].forEach(k => plans[k]?.lignes.forEach(l => { const v = VOIX_IMMERSION.lignes[l.clé]; if (v) précharger(son, urlVoix(v.f)) }))
  }, [son, p, plans])

  // Musique (piano) : celle du plan, sinon la dernière choisie.
  useEffect(() => {
    if (!son) return
    const m = plans.slice(0, p + 1).reverse().find(x => x.musique)?.musique || 'réflexion'
    son.musique(réglages.musique && lecture && !terminé ? m : null)
  }, [son, p, plans, réglages.musique, lecture, terminé])
  // Bruitage d'entrée du plan.
  useEffect(() => { if (son && plan.son && lecture) son.effet(plan.son) }, [p]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const gén = génération, voix = lectureVoix
    return () => { gén.current++; voix.current?.arrêter(); window.speechSynthesis?.cancel(); son?.musique(null); son?.atténuer(false) }
  }, [son])

  // Déroulé : chaque réplique est dite, puis la suivante, puis le plan suivant.
  useEffect(() => {
    if (!lecture || terminé || pageVue) return undefined
    const gén = génération
    const g = ++gén.current
    const encore = () => génération.current === g
    let minuteur
    if (b >= plan.lignes.length) {
      minuteur = setTimeout(() => {
        if (!encore()) return
        if (p + 1 < plans.length) { setP(p + 1); setB(0) } else { setTerminé(true); onFini?.() }
      }, ATTENTE[plan.type] ?? 1100)
      return () => { gén.current++; clearTimeout(minuteur) }
    }
    const l = plan.lignes[b]
    minuteur = setTimeout(() => {
      if (!encore()) return
      son?.atténuer(true)
      const suite = () => { if (!encore()) return; son?.atténuer(false); minuteur = setTimeout(() => { if (encore()) setB(x => x + 1) }, 380) }
      const v = réglages.voix && VOIX_IMMERSION.lignes[l.clé]
      if (v && son) { const lec = jouerFichier(son, urlVoix(v.f)); lectureVoix.current = lec; lec.promesse.then(suite); return }
      if (réglages.voix && window.speechSynthesis) { direRéplique(parlé(l.texte), VOIX_APPAREIL[l.voix]).then(suite); return }
      minuteur = setTimeout(suite, 1600 + l.texte.length * 55)
    }, b === 0 ? DÉPART[plan.type] ?? 650 : 240)
    return () => { gén.current++; clearTimeout(minuteur); couperVoix(); son?.atténuer(false) }
  }, [lecture, terminé, pageVue, p, b, réglages.voix]) // eslint-disable-line react-hooks/exhaustive-deps

  const allerPlan = k => { génération.current++; couperVoix(); setTerminé(false); setP(Math.max(0, Math.min(plans.length - 1, k))); setB(0) }
  const revoir = () => { allerPlan(0); setLecture(true) }
  useEffect(() => {
    const touche = e => {
      if (e.key === 'Escape') { if (pageVue) setPageVue(null); else onFermer() }
      else if (pageVue || e.target.closest?.('input, textarea')) return
      else if (e.key === ' ') { e.preventDefault(); setLecture(l => !l) }
      else if (e.key === 'ArrowRight') allerPlan(p + 1)
      else if (e.key === 'ArrowLeft') allerPlan(p - 1)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  // Carte : plein écran pour les génériques ; sinon la fiche occupe un côté
  // (à droite sur grand écran, en bas sur téléphone) et la caméra cadre le reste.
  const ficheL = large ? Math.min(460, Math.round(lS * 0.42)) : 0
  const ficheH = large ? 0 : Math.round(hS * 0.5)
  const c = plan.carte
  const actifs = c?.actifs || []
  // La caméra suit les lieux du moment ; sur les cartes d'Europe et du monde,
  // elle cadre tous les lieux du plan (sinon ils seraient minuscules).
  const focus = plan.type === 'ba' ? (c?.lieux || []) : plan.type === 'fleuve' || plein ? [] : actifs.length ? actifs : (c?.vue && c.vue !== 'france' ? c.lieux || [] : [])
  const carte = c && (
    <div key={c.vue || 'france'} className="im-fondu" style={{ position: 'absolute', inset: 0 }}>
      <Carte vue={c.vue || 'france'} pays={c.pays || ['France']} lieux={plein && plan.type !== 'ba' ? [] : c.lieux || []} actifs={plan.type === 'ba' ? (c.lieux || []) : actifs} flèches={c.flèches || []} fleuves={c.fleuves || []} trace={c.trace || null} couches={c.couches || []} massif={ligne?.massif || null}
        couleur={plan.type === 'ba' || plein ? OR : plan.couleur} focus={focus} remplir={plein} légende={!plein}
        marges={plan.type === 'ba' ? { bas: Math.round(hS * 0.42) } : plein ? null : { droite: ficheL ? ficheL + 28 : 0, bas: ficheH ? ficheH + 14 : 0 }} />
    </div>
  )

  return (
    <div className="im-ecran" role="dialog" aria-modal="true" aria-label={titre}>
      <div style={{ padding: 'max(8px, env(safe-area-inset-top)) 10px 6px', background: '#000', zIndex: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="im-bouton im-rond" onClick={onFermer} aria-label="Fermer le film">✕</button>
          <div style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titre}</div>
          {pageActuelle && <button type="button" className="im-bouton" onClick={() => setPageVue(pageActuelle)} style={{ minHeight: 40, padding: '0 10px', fontSize: 13.5 }} aria-label={`Voir la page ${pageActuelle} du livret`}>📖 p. {pageActuelle}</button>}
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 8 }} aria-hidden="true">
          {plans.map((x, k) => <button key={x.id} type="button" tabIndex={-1} className="im-segment" onClick={() => allerPlan(k)} title={`Plan ${k + 1}`} style={{ background: k < p || terminé ? OR : k === p ? '#fff' : 'rgba(255,255,255,.2)' }} />)}
        </div>
      </div>

      <div ref={scène} style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', background: '#05070d' }}>
        {plan.type === 'frise' ? <GrandeFrise plan={plan} b={b} /> : carte}
        {plein && <PleinÉcran plan={plan} />}
        {plein && <><div className="im-lettrage" style={{ top: 0 }} /><div className="im-lettrage" style={{ bottom: 0 }} /></>}
        {!plein && plan.type !== 'frise' && (
          <div key={plan.id} className="im-carte im-monte" style={{ position: 'absolute', zIndex: 4, overflowY: 'auto', overscrollBehavior: 'contain', ...(large ? { right: 14, top: 14, bottom: 14, width: ficheL, display: 'flex', flexDirection: 'column', justifyContent: 'center' } : { left: 8, right: 8, bottom: 8, height: ficheH, boxSizing: 'border-box' }) }}>
            <div style={{ margin: large ? 'auto 0' : 0 }}><Fiche plan={plan} b={b} onPage={setPageVue} /></div>
          </div>
        )}
        <div className="im-vignette" />
        <div className="im-grain" />
        {!lecture && !terminé && <button type="button" onClick={() => setLecture(true)} aria-label="Reprendre" className="im-bouton im-plein im-rond" style={{ position: 'absolute', zIndex: 9, left: '50%', top: '40%', transform: 'translate(-50%, -50%)', width: 72, height: 72, borderRadius: 36, fontSize: 28 }}>▶</button>}
        {terminé && fin && <div className="im-fondu" style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(4,6,12,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}><FinFilm {...fin} onRevoir={revoir} /></div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px max(8px, env(safe-area-inset-bottom))', background: '#000', zIndex: 8 }}>
        <button type="button" className="im-bouton im-rond" onClick={() => allerPlan(p - 1)} disabled={p === 0} aria-label="Plan précédent">⏮</button>
        <button type="button" className="im-bouton im-rond im-plein" onClick={() => (terminé ? revoir() : setLecture(l => !l))} aria-label={terminé ? 'Revoir' : lecture ? 'Pause' : 'Lecture'}>{terminé ? '↺' : lecture ? '❚❚' : '▶'}</button>
        <button type="button" className="im-bouton im-rond" onClick={() => allerPlan(p + 1)} disabled={p >= plans.length - 1} aria-label="Plan suivant">⏭</button>
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, opacity: 0.7, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p + 1} / {plans.length}</div>
        <button type="button" className="im-bouton im-rond" onClick={() => régler('voix', !réglages.voix)} aria-pressed={réglages.voix} aria-label={réglages.voix ? 'Couper les voix' : 'Activer les voix'}>{réglages.voix ? '🔊' : '🔇'}</button>
        <button type="button" className="im-bouton im-rond" onClick={() => régler('musique', !réglages.musique)} aria-pressed={réglages.musique} aria-label={réglages.musique ? 'Couper la musique' : 'Activer la musique'}>{réglages.musique ? '🎵' : '🔕'}</button>
      </div>
      {pageVue && <PageLivret n={pageVue} onFermer={() => setPageVue(null)} />}
    </div>
  )
}
