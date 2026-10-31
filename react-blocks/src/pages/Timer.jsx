import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { grotesk } from '../lib/theme'
import { déverrouillerAudio, bip } from '../lib/texteFormate'
import { useÉcranAllumé } from '../lib/ecoute'
import { lireLocal, ajouterTempsHabitude } from '../lib/donneesFoyer'
import { FOYERS } from '../lib/foyers'
import { aujourdhuiLocal } from '../lib/habitudes'

// Page minuteur, toujours en noir avec des chiffres blancs « à palettes ».
// Les temps sont calculés à partir d'horodatages (heure de fin, heure de
// départ) et non d'un décompte seconde par seconde : le minuteur reste
// juste même si le téléphone ralentit la page ou si on change de page.

const CLÉ = 'react-blocs-timer'
const CLÉ_VUE = 'react-blocs-timer-vue' // minuteur | heure
const NOIR = '#000000'
const CARTE = '#1c1c1e'
const BLANC = '#ffffff'
const GRIS = '#8e8e93'
const ROUGE = '#ff453a'

const PRÉRÉGLAGES = [
  { libellé: '1 min', ms: 60e3 },
  { libellé: '5 min', ms: 5 * 60e3 },
  { libellé: '10 min', ms: 10 * 60e3 },
  { libellé: '15 min', ms: 15 * 60e3 },
  { libellé: '25 min', ms: 25 * 60e3 },
  { libellé: '30 min', ms: 30 * 60e3 },
  { libellé: '1 h', ms: 3600e3 },
  { libellé: '1 h 30', ms: 5400e3 },
  { libellé: '2 h', ms: 7200e3 },
  { libellé: '24 h', ms: 24 * 3600e3 },
]
const DURÉE_MAX = 99 * 3600e3 + 59 * 60e3 + 59e3

const ÉTAT_INITIAL = {
  mode: 'rebours', // rebours | chrono
  durée: 5 * 60e3,
  état: 'arrêté', // arrêté | en cours | pause | fini
  fin: null, // rebours en cours : heure de fin
  restant: null, // rebours en pause
  début: null, // chrono en cours : heure de (re)départ
  accumulé: 0, // chrono : temps déjà écoulé avant la pause
  tours: [],
}

// Fin d'une séance : ajouter ce temps à une habitude (« 1 lab par jour »…),
// qui est aussi cochée pour aujourd'hui.
function TempsVersHabitude({ minutes }) {
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const plusieursFoyers = Object.values(FOYERS).filter(f => ['perso', 'pro'].some(t => (lireLocal('habitudes', `${f.préfixe}${t}`).habitudes || []).length)).length > 1
  const liste = Object.values(FOYERS).flatMap(f => ['perso', 'pro'].flatMap(type => {
    const espace = `${f.préfixe}${type}`
    return (lireLocal('habitudes', espace).habitudes || []).filter(h => !h.archivée)
      .map(h => ({ espace, h, où: `${plusieursFoyers ? `${f.nom} · ` : ''}${type === 'pro' ? 'Pro' : 'Perso'}` }))
  }))
  const ajouter = async ({ espace, h }) => {
    setEnvoi(true)
    try {
      const { enLigne } = await ajouterTempsHabitude({ espace, habitudeId: h.id, minutes, jour: aujourdhuiLocal() })
      setMessage(`✓ ${minutes} min ajoutées à ${h.emoji} ${h.nom}${enLigne ? '' : ' (sur cet appareil)'}`)
    } catch (err) { setMessage(`Impossible d'enregistrer : ${err.message}`) }
    setEnvoi(false)
  }
  return (
    <div style={{ width: '100%', maxWidth: '460px', background: CARTE, borderRadius: '16px', padding: '14px', boxSizing: 'border-box' }}>
      {message ? <p style={{ margin: 0, fontFamily: grotesk, fontSize: '15px', color: message.startsWith('✓') ? '#30d158' : ROUGE, textAlign: 'center' }}>{message}</p> : (
        <>
          <p style={{ margin: '0 0 10px', fontFamily: grotesk, fontSize: '14px', color: BLANC, textAlign: 'center' }}>Compter ces <strong>{minutes} min</strong> pour une habitude ?</p>
          {liste.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: GRIS, textAlign: 'center', lineHeight: 1.5 }}>Crée une habitude (par exemple 🧪 1 lab par jour) dans Habitudes : tu pourras y ajouter ce temps.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {liste.map(x => (
                <button key={`${x.espace}-${x.h.id}`} disabled={envoi} onClick={() => ajouter(x)} style={{ minHeight: 40, padding: '0 14px', borderRadius: '20px', border: `1px solid ${x.h.couleur || GRIS}`, background: 'transparent', color: BLANC, fontFamily: grotesk, fontSize: '14px', cursor: 'pointer' }}>
                  {x.h.emoji} {x.h.nom} <span style={{ color: GRIS, fontSize: '11px' }}>{x.où}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function charger() {
  try {
    const s = { ...ÉTAT_INITIAL, ...JSON.parse(localStorage.getItem(CLÉ) || '{}') }
    // Compte à rebours arrivé à zéro pendant qu'on était ailleurs.
    if (s.mode === 'rebours' && s.état === 'en cours' && s.fin <= Date.now()) return { ...s, état: 'fini' }
    return s
  } catch {
    return { ...ÉTAT_INITIAL }
  }
}

function découper(ms, arrondiHaut) {
  const total = Math.max(0, arrondiHaut ? Math.ceil(ms / 1000) : Math.floor(ms / 1000))
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 }
}

const deux = n => String(n).padStart(2, '0')

const ANIMATIONS = `
@keyframes flipChiffre { from { transform: rotateX(-90deg); opacity: .2 } to { transform: rotateX(0); opacity: 1 } }
@keyframes clignote { 0%, 100% { opacity: 1 } 50% { opacity: .25 } }
@media (prefers-reduced-motion: reduce) { .flip-anim, .clignote-anim { animation: none !important } }
`

// Un chiffre dans sa carte, façon horloge à palettes.
function Chiffre({ valeur, taille, couleur }) {
  return (
    <div style={{
      position: 'relative', width: `calc(${taille} * 0.74)`, height: `calc(${taille} * 1.22)`,
      borderRadius: `calc(${taille} * 0.12)`, background: `linear-gradient(${CARTE} 50%, #161618 50%)`,
      boxShadow: '0 6px 18px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '400px', overflow: 'hidden',
    }}>
      <span key={valeur} className="flip-anim" style={{
        fontFamily: grotesk, fontWeight: 700, fontSize: taille, lineHeight: 1, color: couleur,
        fontVariantNumeric: 'tabular-nums', animation: 'flipChiffre .32s ease-out', transformOrigin: '50% 50%',
      }}>{valeur}</span>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '2px', marginTop: '-1px', background: NOIR }} />
    </div>
  )
}

function Groupe({ valeur, libellé, taille, couleur, onPlus, onMoins, sansLibellé = false }) {
  const flèche = {
    width: '100%', height: '34px', background: 'transparent', border: 'none', color: GRIS,
    fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {onPlus && <button onClick={onPlus} aria-label={`Ajouter ${libellé}`} style={flèche}>▲</button>}
      <div style={{ display: 'flex', gap: `calc(${taille} * 0.08)` }}>
        {deux(valeur).split('').map((c, i) => <Chiffre key={i} valeur={c} taille={taille} couleur={couleur} />)}
      </div>
      {onMoins && <button onClick={onMoins} aria-label={`Retirer ${libellé}`} style={flèche}>▼</button>}
      {!sansLibellé && (
        <span style={{ fontFamily: grotesk, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: GRIS, textTransform: 'uppercase', marginTop: '6px' }}>
          {libellé}
        </span>
      )}
    </div>
  )
}

// `décalé` : les flèches ▲ (mode réglage) poussent les cartes vers le bas.
function Séparateur({ taille, couleur, décalé }) {
  return (
    <span style={{
      fontFamily: grotesk, fontWeight: 700, fontSize: `calc(${taille} * 0.8)`, color: couleur,
      lineHeight: `calc(${taille} * 1.22)`, alignSelf: 'flex-start', padding: '0 2px',
      marginTop: décalé ? '38px' : 0,
    }}>:</span>
  )
}

// Heure actuelle (HH:MM) avec les mêmes cartes à palettes, en petit.
function heureDuMoment() {
  const d = new Date()
  return `${deux(d.getHours())}${deux(d.getMinutes())}`
}

// Mode heure : grande horloge HH:MM:SS et la date du jour.
function Horloge({ maintenant, taille, géante = false }) {
  const d = new Date(maintenant)
  const date = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: géante ? '3vh' : '18px' }}>
      <div role="timer" aria-label={`Il est ${d.getHours()} heures ${d.getMinutes()}`} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: géante ? '1vw' : '4px' }}>
        <Groupe valeur={d.getHours()} libellé="Heures" taille={taille} couleur={BLANC} sansLibellé={géante} />
        <Séparateur taille={taille} couleur={BLANC} />
        <Groupe valeur={d.getMinutes()} libellé="Minutes" taille={taille} couleur={BLANC} sansLibellé={géante} />
        <Séparateur taille={taille} couleur={BLANC} />
        <Groupe valeur={d.getSeconds()} libellé="Secondes" taille={taille} couleur={BLANC} sansLibellé={géante} />
      </div>
      <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 600, color: GRIS, fontSize: géante ? 'min(4vw, 26px)' : '16px', textAlign: 'center' }}>
        {date[0].toUpperCase() + date.slice(1)}
      </p>
    </div>
  )
}

function HeureActuelle({ taille }) {
  const [heure, setHeure] = useState(heureDuMoment)
  useEffect(() => {
    const id = setInterval(() => setHeure(heureDuMoment()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div role="timer" aria-label={`Il est ${heure.slice(0, 2)} heures ${heure.slice(2)}`} style={{ display: 'flex', alignItems: 'flex-start', gap: `calc(${taille} * 0.08)` }}>
      <Chiffre valeur={heure[0]} taille={taille} couleur={BLANC} />
      <Chiffre valeur={heure[1]} taille={taille} couleur={BLANC} />
      <Séparateur taille={taille} couleur={BLANC} />
      <Chiffre valeur={heure[2]} taille={taille} couleur={BLANC} />
      <Chiffre valeur={heure[3]} taille={taille} couleur={BLANC} />
    </div>
  )
}

export default function Timer() {
  const navigate = useNavigate()
  const [t, setT] = useState(charger)
  const [maintenant, setMaintenant] = useState(Date.now())
  const alarmeRef = useRef(null)
  const [pleinÉcran, setPleinÉcran] = useState(false)
  const [contrôlesVisibles, setContrôlesVisibles] = useState(true)
  const masquageRef = useRef(null)

  const [vue, setVue] = useState(() => { try { return localStorage.getItem(CLÉ_VUE) === 'heure' ? 'heure' : 'minuteur' } catch { return 'minuteur' } })
  const modeHeure = vue === 'heure'
  const choisirVue = v => {
    setVue(v)
    try { localStorage.setItem(CLÉ_VUE, v) } catch { /* ignore */ }
  }

  const enCours = t.état === 'en cours'
  useÉcranAllumé(enCours || modeHeure)

  useEffect(() => {
    try { localStorage.setItem(CLÉ, JSON.stringify(t)) } catch { /* ignore */ }
  }, [t])

  useEffect(() => {
    if (!enCours && !modeHeure) return
    const id = setInterval(() => setMaintenant(Date.now()), 200)
    return () => clearInterval(id)
  }, [enCours, modeHeure])

  // Fin du compte à rebours : alarme (bips + vibration) pendant une minute.
  const arrêterAlarme = () => {
    clearInterval(alarmeRef.current)
    alarmeRef.current = null
    navigator.vibrate?.(0)
  }
  useEffect(() => {
    if (t.mode === 'rebours' && enCours && t.fin <= maintenant) {
      setT(s => ({ ...s, état: 'fini' }))
      choisirVue('minuteur') // le minuteur tournait pendant qu'on regardait l'heure
      let n = 0
      const sonner = () => {
        bip(988, 0.18)
        setTimeout(() => bip(988, 0.18), 260)
        navigator.vibrate?.([300, 150, 300])
        if (++n >= 60) arrêterAlarme()
      }
      sonner()
      alarmeRef.current = setInterval(sonner, 1000)
    }
  }, [maintenant, enCours, t.mode, t.fin])
  useEffect(() => () => arrêterAlarme(), [])

  const temps = t.mode === 'rebours'
    ? (t.état === 'arrêté' ? t.durée : t.état === 'pause' ? t.restant : t.état === 'fini' ? 0 : t.fin - maintenant)
    : t.accumulé + (enCours ? maintenant - t.début : 0)
  const { h, m, s } = découper(temps, t.mode === 'rebours')
  const avecHeures = t.mode === 'rebours' ? (t.état === 'arrêté' || t.durée >= 3600e3 || h > 0) : h > 0
  const taille = avecHeures ? 'min(11.5vw, 92px)' : 'min(17vw, 128px)'
  const couleur = t.état === 'fini' ? ROUGE : BLANC
  const réglable = t.mode === 'rebours' && t.état === 'arrêté'

  const changerDurée = delta => setT(s => ({ ...s, durée: Math.min(DURÉE_MAX, Math.max(0, s.durée + delta)) }))

  const démarrer = () => {
    déverrouillerAudio()
    const now = Date.now()
    setMaintenant(now)
    setT(s => {
      if (s.mode === 'chrono') return { ...s, état: 'en cours', début: now }
      const reste = s.état === 'pause' ? s.restant : s.durée
      return reste > 0 ? { ...s, état: 'en cours', fin: now + reste, restant: null } : s
    })
  }
  const pause = () => {
    const now = Date.now()
    setT(s => (s.mode === 'chrono'
      ? { ...s, état: 'pause', accumulé: s.accumulé + now - s.début, début: null }
      : { ...s, état: 'pause', restant: Math.max(0, s.fin - now), fin: null }))
  }
  const réinitialiser = () => {
    arrêterAlarme()
    setT(s => ({ ...ÉTAT_INITIAL, mode: s.mode, durée: s.durée }))
  }
  const changerMode = mode => {
    choisirVue('minuteur')
    // Revenir de l'heure au même mode ne remet pas le minuteur à zéro.
    if (modeHeure && t.mode === mode) return
    arrêterAlarme()
    setT(s => ({ ...ÉTAT_INITIAL, mode, durée: s.durée }))
  }
  const tour = () => setT(s => ({ ...s, tours: [temps, ...s.tours].slice(0, 50) }))

  // Plein écran intégré à la page (seule possibilité sur iPhone), doublé du
  // plein écran du navigateur là où il existe (Android, ordinateur).
  // Les commandes s'effacent après 3 s ; toucher l'écran les fait revenir.
  const montrerContrôles = () => {
    setContrôlesVisibles(true)
    clearTimeout(masquageRef.current)
    masquageRef.current = setTimeout(() => setContrôlesVisibles(false), 3000)
  }
  const entrerPleinÉcran = () => {
    setPleinÉcran(true)
    montrerContrôles()
    document.documentElement.requestFullscreen?.().catch(() => {})
  }
  const sortirPleinÉcran = () => {
    setPleinÉcran(false)
    clearTimeout(masquageRef.current)
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }
  useEffect(() => {
    const surChangement = () => { if (!document.fullscreenElement) setPleinÉcran(false) }
    document.addEventListener('fullscreenchange', surChangement)
    return () => {
      document.removeEventListener('fullscreenchange', surChangement)
      clearTimeout(masquageRef.current)
    }
  }, [])

  const bouton = (principal = false, couleurFond) => ({
    minWidth: '84px', height: '84px', borderRadius: '50%', border: 'none', cursor: 'pointer',
    fontFamily: grotesk, fontSize: '15px', fontWeight: 700,
    background: couleurFond || (principal ? BLANC : CARTE), color: couleurFond ? BLANC : principal ? NOIR : BLANC,
  })
  const pastille = actif => ({
    padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: grotesk, fontSize: '13px', fontWeight: 600,
    background: actif ? BLANC : CARTE, color: actif ? NOIR : BLANC, border: 'none',
  })

  if (pleinÉcran && modeHeure) {
    return (
      <div onClick={montrerContrôles} role="dialog" aria-label="Heure en plein écran" style={{
        position: 'fixed', inset: 0, zIndex: 2000, background: NOIR, color: BLANC, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: contrôlesVisibles ? 'default' : 'none',
      }}>
        <style>{ANIMATIONS}</style>
        <Horloge maintenant={maintenant} taille="min(14.5vw, 52vh)" géante />
        <button
          onClick={e => { e.stopPropagation(); sortirPleinÉcran() }}
          aria-label="Quitter le plein écran"
          style={{
            position: 'absolute', top: 'max(16px, env(safe-area-inset-top))', left: 'max(16px, env(safe-area-inset-left))',
            width: '44px', height: '44px', borderRadius: '50%', background: CARTE, border: 'none', color: BLANC,
            fontSize: '18px', cursor: 'pointer', opacity: contrôlesVisibles ? 1 : 0, transition: 'opacity .4s',
            pointerEvents: contrôlesVisibles ? 'auto' : 'none',
          }}
        >✕</button>
      </div>
    )
  }

  if (pleinÉcran) {
    const géante = avecHeures ? 'min(14.5vw, 52vh)' : 'min(22vw, 52vh)'
    const visibles = contrôlesVisibles || t.état === 'fini'
    const rond = {
      width: '64px', height: '64px', borderRadius: '50%', border: 'none', cursor: 'pointer',
      fontFamily: grotesk, fontSize: '13px', fontWeight: 700, color: BLANC,
    }
    return (
      <div
        onClick={montrerContrôles}
        role="dialog"
        aria-label="Timer en plein écran"
        style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: NOIR, color: BLANC, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3vh',
          cursor: visibles ? 'default' : 'none',
        }}
      >
        <style>{ANIMATIONS}</style>
        <div
          className={t.état === 'fini' ? 'clignote-anim' : undefined}
          aria-label={`${h} heures ${m} minutes ${s} secondes`}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '1vw', animation: t.état === 'fini' ? 'clignote 1s ease-in-out infinite' : 'none' }}
        >
          {avecHeures && (
            <>
              <Groupe valeur={h} libellé="Heures" taille={géante} couleur={couleur} sansLibellé />
              <Séparateur taille={géante} couleur={couleur} />
            </>
          )}
          <Groupe valeur={m} libellé="Minutes" taille={géante} couleur={couleur} sansLibellé />
          <Séparateur taille={géante} couleur={couleur} />
          <Groupe valeur={s} libellé="Secondes" taille={géante} couleur={couleur} sansLibellé />
        </div>
        {t.état === 'fini' && (
          <p style={{ margin: 0, fontFamily: grotesk, fontSize: 'min(5vw, 28px)', fontWeight: 700, color: ROUGE }}>⏰ Temps écoulé</p>
        )}

        <button
          onClick={e => { e.stopPropagation(); sortirPleinÉcran() }}
          aria-label="Quitter le plein écran"
          style={{
            position: 'absolute', top: 'max(16px, env(safe-area-inset-top))', left: 'max(16px, env(safe-area-inset-left))',
            width: '44px', height: '44px', borderRadius: '50%', background: CARTE, border: 'none', color: BLANC,
            fontSize: '18px', cursor: 'pointer', opacity: visibles ? 1 : 0, transition: 'opacity .4s',
            pointerEvents: visibles ? 'auto' : 'none',
          }}
        >✕</button>
        <div style={{ position: 'absolute', top: 'max(16px, env(safe-area-inset-top))', right: 'max(16px, env(safe-area-inset-right))' }}>
          <HeureActuelle taille="min(4.5vw, 30px)" />
        </div>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 'max(20px, env(safe-area-inset-bottom))', left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: '22px',
            opacity: visibles ? 1 : 0, transition: 'opacity .4s', pointerEvents: visibles ? 'auto' : 'none',
          }}
        >
          {t.état === 'fini' ? (
            <button onClick={réinitialiser} style={{ ...rond, width: '120px', borderRadius: '32px', background: ROUGE }}>Arrêter</button>
          ) : (
            <>
              <button onClick={() => { réinitialiser(); montrerContrôles() }} disabled={t.état === 'arrêté'}
                style={{ ...rond, background: CARTE, opacity: t.état === 'arrêté' ? 0.4 : 1 }}>Remise à 0</button>
              {enCours
                ? <button onClick={() => { pause(); montrerContrôles() }} style={{ ...rond, background: '#ff9f0a' }}>Pause</button>
                : <button onClick={() => { démarrer(); montrerContrôles() }} style={{ ...rond, background: '#30d158' }}>{t.état === 'pause' ? 'Reprendre' : 'Démarrer'}</button>}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: NOIR, color: BLANC, padding: '18px 16px 40px', display: 'flex', flexDirection: 'column' }}>
      <style>{ANIMATIONS}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="Retour"
          style={{ width: '42px', height: '42px', borderRadius: '50%', background: CARTE, border: 'none', color: BLANC, fontSize: '20px', cursor: 'pointer' }}
        >‹</button>
        <div style={{ display: 'flex', background: CARTE, borderRadius: '22px', padding: '3px' }}>
          {[['rebours', 'Minuteur'], ['chrono', 'Chrono']].map(([id, libellé]) => (
            <button key={id} onClick={() => changerMode(id)} aria-pressed={!modeHeure && t.mode === id} style={{ ...pastille(!modeHeure && t.mode === id), padding: '8px 12px' }}>{libellé}</button>
          ))}
          <button onClick={() => choisirVue('heure')} aria-pressed={modeHeure} style={{ ...pastille(modeHeure), padding: '8px 12px' }}>Heure</button>
        </div>
        <button onClick={entrerPleinÉcran} aria-label="Plein écran" title="Plein écran" style={{ width: '42px', height: '42px', borderRadius: '50%', background: CARTE, border: 'none', color: BLANC, fontSize: '16px', cursor: 'pointer' }}>⛶</button>
      </div>
      {!modeHeure && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-6px 0 10px' }}>
          <HeureActuelle taille="20px" />
        </div>
      )}

      {modeHeure && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
          <Horloge maintenant={maintenant} taille="min(11.5vw, 92px)" />
          {(enCours || t.état === 'pause') && (
            <button onClick={() => choisirVue('minuteur')} style={{ ...pastille(false), color: GRIS }}>
              {t.mode === 'rebours' ? '⏳ Minuteur' : '⏱️ Chrono'} {t.état === 'pause' ? 'en pause' : 'en cours'} — voir
            </button>
          )}
          <p style={{ margin: 0, fontSize: '12px', color: GRIS, textAlign: 'center' }}>L'écran reste allumé. ⛶ pour l'afficher en grand.</p>
        </div>
      )}

      <div style={{ flex: 1, display: modeHeure ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
        <div
          className={t.état === 'fini' ? 'clignote-anim' : undefined}
          aria-live="off"
          aria-label={`${h} heures ${m} minutes ${s} secondes`}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '4px', animation: t.état === 'fini' ? 'clignote 1s ease-in-out infinite' : 'none' }}
        >
          {avecHeures && (
            <>
              <Groupe valeur={h} libellé="Heures" taille={taille} couleur={couleur}
                onPlus={réglable ? () => changerDurée(3600e3) : null} onMoins={réglable ? () => changerDurée(-3600e3) : null} />
              <Séparateur taille={taille} couleur={couleur} décalé={réglable} />
            </>
          )}
          <Groupe valeur={m} libellé="Minutes" taille={taille} couleur={couleur}
            onPlus={réglable ? () => changerDurée(60e3) : null} onMoins={réglable ? () => changerDurée(-60e3) : null} />
          <Séparateur taille={taille} couleur={couleur} décalé={réglable} />
          <Groupe valeur={s} libellé="Secondes" taille={taille} couleur={couleur}
            onPlus={réglable ? () => changerDurée(1e3) : null} onMoins={réglable ? () => changerDurée(-1e3) : null} />
        </div>

        {t.état === 'fini' && (
          <p style={{ margin: 0, fontFamily: grotesk, fontSize: '18px', fontWeight: 700, color: ROUGE }}>⏰ Temps écoulé</p>
        )}

        {réglable && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '460px' }}>
            {PRÉRÉGLAGES.map(p => (
              <button key={p.libellé} onClick={() => setT(s => ({ ...s, durée: p.ms }))} style={pastille(t.durée === p.ms)}>{p.libellé}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
          {t.état === 'fini' ? (
            <button onClick={réinitialiser} style={{ ...bouton(false, ROUGE), minWidth: '120px', borderRadius: '42px' }}>Arrêter</button>
          ) : (
            <>
              <button
                onClick={t.mode === 'chrono' && enCours ? tour : réinitialiser}
                disabled={t.état === 'arrêté'}
                style={{ ...bouton(), opacity: t.état === 'arrêté' ? 0.4 : 1 }}
              >{t.mode === 'chrono' && enCours ? 'Tour' : 'Remise à 0'}</button>
              {enCours
                ? <button onClick={pause} style={bouton(false, '#ff9f0a')}>Pause</button>
                : <button onClick={démarrer} disabled={t.mode === 'rebours' && t.état === 'arrêté' && t.durée === 0} style={bouton(false, '#30d158')}>
                    {t.état === 'pause' ? 'Reprendre' : 'Démarrer'}
                  </button>}
            </>
          )}
        </div>

        {t.mode === 'rebours' && t.état === 'fini' && t.durée >= 60e3 && <TempsVersHabitude key={`r-${t.fin}`} minutes={Math.round(t.durée / 60e3)} />}
        {t.mode === 'chrono' && t.état === 'pause' && t.accumulé >= 60e3 && <TempsVersHabitude key={`c-${t.accumulé}`} minutes={Math.round(t.accumulé / 60e3)} />}

        {t.mode === 'chrono' && t.tours.length > 0 && (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%', maxWidth: '360px', fontFamily: grotesk, fontVariantNumeric: 'tabular-nums' }}>
            {t.tours.map((ms, i) => {
              const d = découper(ms, false)
              return (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', borderBottom: `1px solid ${CARTE}`, fontSize: '15px' }}>
                  <span style={{ color: GRIS }}>Tour {t.tours.length - i}</span>
                  <span>{d.h > 0 ? `${deux(d.h)}:` : ''}{deux(d.m)}:{deux(d.s)}</span>
                </li>
              )
            })}
          </ol>
        )}

        {enCours && (
          <p style={{ margin: 0, fontSize: '12px', color: GRIS, textAlign: 'center' }}>
            L'écran reste allumé. {t.mode === 'rebours' ? 'Le temps continue même si tu quittes la page ; l\'alarme sonne si elle est ouverte.' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
