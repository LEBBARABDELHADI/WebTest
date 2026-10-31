import { useState, useEffect, useRef } from 'react'
import { grotesk, serif } from '../lib/theme'
import { TexteFormaté } from '../lib/texteFormate'
import BlocCode from './BlocCode'
import { FenêtreMémo } from './PaquetsPrets'

const mm = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Labo pratique chronométré : un énoncé, on le fait dans son terminal
// (cluster de test), commande de vérification à la demande, solution à la
// fin, puis « Réussi » ou « À retravailler » (révision espacée).
export default function LaboChrono({ T, cartes, titre, onRésultat, onFermer }) {
  const auj = new Date().toISOString().slice(0, 10)
  const ordre = useRef([...cartes].sort((a, b) => (a.prochaineRevision || '').localeCompare(b.prochaineRevision || '') || Math.random() - 0.5))
  const [i, setI] = useState(0)
  const [durée, setDurée] = useState(8 * 60)
  const [phase, setPhase] = useState('énoncé') // énoncé | chrono | solution
  const [reste, setReste] = useState(0)
  const [vérifVue, setVérifVue] = useState(false)
  const [bilan, setBilan] = useState({ réussis: 0, total: 0 })
  const finRef = useRef(0)
  const débutRef = useRef(0)
  const carte = ordre.current[i % ordre.current.length]

  useEffect(() => {
    if (phase !== 'chrono') return
    const m = setInterval(() => { const r = Math.round((finRef.current - Date.now()) / 1000); setReste(r) }, 250)
    return () => clearInterval(m)
  }, [phase])

  const démarrer = () => { débutRef.current = Date.now(); finRef.current = Date.now() + durée * 1000; setReste(durée); setVérifVue(false); setPhase('chrono') }
  const [passé, setPassé] = useState(0)
  const fini = () => { setPassé(Math.round((Date.now() - débutRef.current) / 1000)); setPhase('solution') }
  const noter = réussi => {
    onRésultat(carte.id, réussi)
    setBilan(b => ({ réussis: b.réussis + (réussi ? 1 : 0), total: b.total + 1 }))
    setI(n => n + 1); setPhase('énoncé')
  }
  const puce = actif => ({ minHeight: 36, padding: '0 14px', borderRadius: '18px', fontFamily: grotesk, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}` })
  const gros = (fond, couleur = '#fff') => ({ flex: 1, minHeight: 48, borderRadius: 12, border: 'none', background: fond, color: couleur, fontFamily: grotesk, fontWeight: 700, fontSize: '15px', cursor: 'pointer' })

  return (
    <FenêtreMémo T={T} titre={`🧪 Labo chrono · ${titre.replace(/^🧪\s*/, '')}`} onFermer={onFermer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '12.5px', color: T.textMuted, fontFamily: grotesk }}>
        <span style={{ flex: 1 }}>Tâche {(i % ordre.current.length) + 1}/{ordre.current.length}{carte?.prochaineRevision && carte.prochaineRevision <= auj ? ' · à revoir' : ''}</span>
        {bilan.total > 0 && <span>✓ {bilan.réussis}/{bilan.total} réussies</span>}
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px', marginBottom: 12, fontFamily: serif, fontSize: '18px', lineHeight: 1.45, color: T.text }}>
        <TexteFormaté texte={carte.recto} couleurDéfaut={T.text} />
      </div>

      {phase === 'énoncé' && (
        <>
          <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>Fais-le dans ton terminal, sur un cluster de test (kind, minikube, killercoda…). À l'examen, compte 6 à 8 minutes par tâche.</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: '13px', color: T.textMuted }}>Temps</span>
            {[4, 6, 8, 12].map(m => <button key={m} onClick={() => setDurée(m * 60)} style={puce(durée === m * 60)}>{m} min</button>)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setI(n => n + 1) }} style={{ ...gros(T.surface2, T.text), flex: 1 }}>⏭ Autre tâche</button>
            <button onClick={démarrer} style={{ ...gros(T.accent, T.accentText), flex: 2 }}>▶ Démarrer</button>
          </div>
        </>
      )}

      {phase === 'chrono' && (
        <>
          <div aria-label="Temps restant" style={{ textAlign: 'center', fontFamily: grotesk, fontSize: '52px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: reste <= 0 ? T.danger : reste <= 60 ? '#c98a00' : T.text }}>
            {reste >= 0 ? mm(reste) : `+${mm(-reste)}`}
          </div>
          {reste <= 0 && <p style={{ textAlign: 'center', color: T.danger, margin: '0 0 8px', fontFamily: grotesk, fontWeight: 700 }}>Temps dépassé : à l'examen, passe à la tâche suivante et reviens-y à la fin.</p>}
          {carte.vérif && (
            vérifVue
              ? <div style={{ marginBottom: 10 }}><p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 4px' }}>Pour vérifier ton résultat :</p><BlocCode code={carte.vérif} langage="bash" numéros={false} /></div>
              : <button onClick={() => setVérifVue(true)} style={{ ...puce(false), width: '100%', marginBottom: 10 }}>🔎 Comment vérifier mon résultat ?</button>
          )}
          <button onClick={fini} style={{ ...gros(T.accent, T.accentText), width: '100%' }}>✅ J'ai terminé</button>
        </>
      )}

      {phase === 'solution' && (
        <>
          <p style={{ fontSize: '13px', color: T.text, margin: '0 0 8px', fontFamily: grotesk }}>Temps passé : <strong>{mm(Math.max(0, passé))}</strong> {passé > durée ? '(au-delà du temps prévu)' : ''}</p>
          <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 4px' }}>Une solution possible :</p>
          <div style={{ marginBottom: 12 }}><TexteFormaté texte={carte.verso} couleurDéfaut={T.text} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => noter(false)} style={gros(T.danger)}>À retravailler</button>
            <button onClick={() => noter(true)} style={gros('#2e9e6b')}>Réussi ✓</button>
          </div>
        </>
      )}
    </FenêtreMémo>
  )
}
