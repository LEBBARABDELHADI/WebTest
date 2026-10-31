import { useState, useEffect, useRef } from 'react'
import { grotesk, serif } from '../lib/theme'
import { TexteFormaté, texteBrut } from '../lib/texteFormate'
import { écouter, autoriserMicro, dictéeDisponible, useÉcranAllumé } from '../lib/ecoute'
import { CONNECTEURS_ORAL } from '../lib/paquetsPrets'
import { FenêtreMémo } from './PaquetsPrets'

const normaliser = t => ` ${t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '\'').replace(/[^a-z'\s]/g, ' ').replace(/\s+/g, ' ')} `

// Oral chronométré : un sujet (recto), on parle 1 à 3 minutes, la dictée
// écrit ce qui est dit. Bilan : nombre de mots, débit, connecteurs utilisés,
// et le plan conseillé (verso) pour comparer.
export default function OralChrono({ T, cartes, titre, onFermer }) {
  const [carte, setCarte] = useState(() => cartes[Math.floor(Math.random() * cartes.length)])
  const [durée, setDurée] = useState(120)
  const [phase, setPhase] = useState('sujet')
  const [reste, setReste] = useState(0)
  const [texte, setTexte] = useState('')
  const [erreur, setErreur] = useState('')
  const écouteRef = useRef(null)
  const finRef = useRef(0)
  const débutRef = useRef(0)
  useÉcranAllumé(phase === 'parole')

  const autreSujet = () => { if (cartes.length > 1) { let c; do { c = cartes[Math.floor(Math.random() * cartes.length)] } while (c.id === carte.id); setCarte(c) } }
  const commencer = async () => {
    setTexte(''); setErreur('')
    if (dictéeDisponible) await autoriserMicro().catch(() => {})
    débutRef.current = Date.now(); finRef.current = Date.now() + durée * 1000
    setReste(durée); setPhase('parole')
    if (dictéeDisponible) {
      const é = écouter({ attente: durée * 1000, silence: durée * 1000, maximum: durée * 1000, surTexte: setTexte })
      écouteRef.current = é
      é.promesse.then(t => { if (t) setTexte(t) }).catch(e => setErreur(e.message === 'not-allowed' ? 'Micro refusé : autorise-le dans le navigateur.' : 'Dictée interrompue.'))
    }
  }
  const terminer = () => { écouteRef.current?.arrêter(); setPhase('bilan') }
  useEffect(() => {
    if (phase !== 'parole') return
    const m = setInterval(() => {
      const r = Math.max(0, Math.round((finRef.current - Date.now()) / 1000))
      setReste(r)
      if (r <= 0) { clearInterval(m); terminer() }
    }, 250)
    return () => clearInterval(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])
  useEffect(() => () => écouteRef.current?.arrêter(), [])

  const puce = actif => ({ minHeight: 36, padding: '0 14px', borderRadius: '18px', fontFamily: grotesk, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}` })
  const sujet = (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '18px 16px', marginBottom: '14px', fontFamily: serif, fontSize: '20px', lineHeight: 1.4, color: T.text, textAlign: 'center' }}>
      <TexteFormaté texte={carte.recto} couleurDéfaut={T.text} />
    </div>
  )

  if (phase === 'sujet') {
    return (
      <FenêtreMémo T={T} titre={`🗣️ Oral · ${titre}`} onFermer={onFermer}>
        <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
          Prends quelques secondes pour réfléchir à un plan, puis parle sans t'arrêter. {dictéeDisponible ? 'Ce que tu dis s\'écrit à l\'écran.' : 'La dictée n\'est pas disponible sur ce navigateur : le chronomètre fonctionne quand même.'}
        </p>
        {sujet}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: T.textMuted, marginRight: 4 }}>Durée</span>
          {[60, 120, 180].map(d => <button key={d} onClick={() => setDurée(d)} style={puce(durée === d)}>{d / 60} min</button>)}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={autreSujet} disabled={cartes.length < 2} style={{ ...puce(false), flex: 1, minHeight: 46, borderRadius: 12 }}>🎲 Autre sujet</button>
          <button onClick={commencer} style={{ ...puce(true), flex: 2, minHeight: 46, borderRadius: 12, fontSize: '15px' }}>🎙️ Commencer</button>
        </div>
      </FenêtreMémo>
    )
  }

  if (phase === 'parole') {
    const fraction = reste / durée
    return (
      <FenêtreMémo T={T} titre={`🗣️ Oral · ${titre}`} onFermer={() => { écouteRef.current?.arrêter(); onFermer() }}>
        {sujet}
        <div style={{ textAlign: 'center', margin: '4px 0 12px' }}>
          <div aria-label="Temps restant" style={{ fontFamily: grotesk, fontSize: '54px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: reste <= 15 ? T.danger : T.text }}>
            {Math.floor(reste / 60)}:{String(reste % 60).padStart(2, '0')}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: T.surface2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${fraction * 100}%`, background: reste <= 15 ? T.danger : T.accent, transition: 'width .25s linear' }} /></div>
        </div>
        {dictéeDisponible && (
          <div style={{ minHeight: 90, maxHeight: 200, overflowY: 'auto', padding: '10px 12px', borderRadius: '10px', background: T.surface2, border: `1px solid ${T.border}`, fontSize: '14px', lineHeight: 1.5, color: texte ? T.text : T.textMuted, marginBottom: '12px' }}>
            {texte || '🎤 J\'écoute…'}
          </div>
        )}
        {erreur && <p style={{ color: T.danger, fontSize: '13px' }}>{erreur}</p>}
        <button onClick={terminer} style={{ width: '100%', minHeight: 46, borderRadius: 12, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>J'ai terminé</button>
      </FenêtreMémo>
    )
  }

  const secondes = Math.max(1, Math.round((Math.min(Date.now(), finRef.current) - débutRef.current) / 1000))
  const mots = texte.trim() ? texte.trim().split(/\s+/).length : 0
  const n = normaliser(texte)
  const utilisés = CONNECTEURS_ORAL.filter(c => n.includes(normaliser(c)))
  const àEssayer = CONNECTEURS_ORAL.filter(c => !utilisés.includes(c)).filter((c, i) => i % 4 === 0).slice(0, 6)
  return (
    <FenêtreMémo T={T} titre="🗣️ Bilan de l'oral" onFermer={onFermer}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        {[[`${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}`, 'durée'], [mots, 'mots'], [mots ? Math.round(mots / (secondes / 60)) : '—', 'mots / min']].map(([v, l]) => (
          <div key={l} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: '10px', background: T.surface, border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: grotesk, fontSize: '22px', fontWeight: 800, color: T.text }}>{v}</div>
            <div style={{ fontSize: '11.5px', color: T.textMuted }}>{l}</div>
          </div>
        ))}
      </div>
      {dictéeDisponible && (
        <>
          <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Connecteurs utilisés ({utilisés.length})</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {utilisés.length ? utilisés.map(c => <span key={c} style={{ fontSize: '12.5px', padding: '4px 10px', borderRadius: 14, background: '#2e9e6b22', color: '#1f7a50', border: '1px solid #2e9e6b66' }}>✓ {c}</span>)
              : <span style={{ fontSize: '13px', color: T.textMuted }}>Aucun repéré : structure ton propos avec des mots de liaison.</span>}
          </div>
          <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '0 0 12px' }}>À essayer la prochaine fois : {àEssayer.join(' · ')}</p>
          {texte && (
            <details style={{ marginBottom: '12px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '13px', color: T.text, fontFamily: grotesk, fontWeight: 600 }}>Ce que tu as dit</summary>
              <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: T.text, background: T.surface2, padding: '10px 12px', borderRadius: '10px', margin: '6px 0 0' }}>{texte}</p>
            </details>
          )}
        </>
      )}
      {texteBrut(carte.verso).trim() && (
        <>
          <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Plan conseillé</p>
          <div style={{ fontSize: '13.5px', lineHeight: 1.55, color: T.text, background: T.surface, border: `1px solid ${T.border}`, padding: '10px 12px', borderRadius: '10px', whiteSpace: 'pre-wrap', marginBottom: '14px' }}>
            <TexteFormaté texte={carte.verso} couleurDéfaut={T.text} />
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setPhase('sujet')} style={{ ...puce(false), flex: 1, minHeight: 44, borderRadius: 12 }}>↻ Recommencer</button>
        <button onClick={() => { autreSujet(); setPhase('sujet') }} style={{ ...puce(true), flex: 1, minHeight: 44, borderRadius: 12 }}>🎲 Autre sujet</button>
      </div>
    </FenêtreMémo>
  )
}
