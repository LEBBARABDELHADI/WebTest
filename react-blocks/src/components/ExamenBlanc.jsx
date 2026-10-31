import { useState, useEffect, useMemo, useRef } from 'react'
import { grotesk, serif } from '../lib/theme'
import { TexteFormaté } from '../lib/texteFormate'
import { FenêtreMémo } from './PaquetsPrets'

function mélanger(t) {
  const c = [...t]
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] }
  return c
}
const OBJECTIF = 0.8
const pourcent = (a, b) => (b ? Math.round((a / b) * 100) : 0)

// Questions réparties entre les thèmes (un paquet = un thème), chacune avec
// la bonne réponse et 3 réponses d'autres cartes du même thème.
function préparer(cartes, paquetsIds, nombre) {
  const parThème = paquetsIds.map(id => mélanger(cartes.filter(c => c.paquetId === id)))
  const choisies = []
  for (let tour = 0; choisies.length < nombre && parThème.some(l => l.length > tour); tour++) {
    parThème.forEach(l => { if (l[tour] && choisies.length < nombre) choisies.push(l[tour]) })
  }
  const toutes = cartes.filter(c => paquetsIds.includes(c.paquetId))
  return mélanger(choisies).map(c => {
    const vus = new Set([c.verso])
    const pioche = [...mélanger(toutes.filter(x => x.paquetId === c.paquetId)), ...mélanger(toutes)]
    const autres = []
    for (const x of pioche) { if (autres.length >= 3) break; if (!vus.has(x.verso)) { vus.add(x.verso); autres.push(x) } }
    return { carte: c, options: mélanger([c, ...autres]) }
  })
}

// Examen blanc : QCM chronométré sur un ou plusieurs paquets, score par
// thème à la fin, erreurs à remettre en révision.
export default function ExamenBlanc({ T, data, préchoix, onTerminer, onErreursEnRévision, onFermer }) {
  const avecCartes = data.paquets.filter(p => data.cartes.filter(c => c.paquetId === p.id).length >= 2)
  const [choix, setChoix] = useState(() => new Set((préchoix?.length ? préchoix : avecCartes.map(p => p.id)).filter(id => avecCartes.some(p => p.id === id))))
  const [nombre, setNombre] = useState(20)
  const [minutes, setMinutes] = useState(15)
  const [phase, setPhase] = useState('réglages')
  const [questions, setQuestions] = useState([])
  const [réponses, setRéponses] = useState([])
  const [index, setIndex] = useState(0)
  const [reste, setReste] = useState(0)
  const finRef = useRef(0)
  const réponsesRef = useRef([])
  const disponibles = data.cartes.filter(c => choix.has(c.paquetId)).length

  const commencer = () => {
    const q = préparer(data.cartes, [...choix], Math.min(nombre, disponibles))
    if (!q.length) return
    setQuestions(q); setRéponses([]); réponsesRef.current = []; setIndex(0)
    finRef.current = Date.now() + minutes * 60000
    setReste(minutes * 60); setPhase('examen')
  }
  const terminer = (rép = réponsesRef.current) => {
    setPhase('bilan')
    const bonnes = questions.filter((q, i) => rép[i] === q.carte.id).length
    const parThème = {}
    questions.forEach((q, i) => {
      const t = parThème[q.carte.paquetId] || (parThème[q.carte.paquetId] = { bonnes: 0, total: 0 })
      t.total += 1; if (rép[i] === q.carte.id) t.bonnes += 1
    })
    onTerminer?.({ id: Date.now().toString(36), date: new Date().toISOString(), bonnes, total: questions.length, parThème, durée: Math.round((minutes * 60000 - Math.max(0, finRef.current - Date.now())) / 1000) })
  }
  useEffect(() => {
    if (phase !== 'examen') return
    const m = setInterval(() => {
      const r = Math.max(0, Math.round((finRef.current - Date.now()) / 1000))
      setReste(r)
      if (r <= 0) { clearInterval(m); terminer() }
    }, 500)
    return () => clearInterval(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const répondre = id => {
    const rép = [...réponses]; rép[index] = id; setRéponses(rép); réponsesRef.current = rép
    if (index + 1 >= questions.length) terminer(rép)
    else setIndex(index + 1)
  }
  const nomThème = id => data.paquets.find(p => p.id === id)?.nom || 'Thème'
  const couleurThème = id => data.paquets.find(p => p.id === id)?.couleur || T.accent
  const historique = useMemo(() => (data.examens || []).slice(-6).reverse(), [data.examens])
  const puce = actif => ({ minHeight: 36, padding: '0 14px', borderRadius: '18px', fontFamily: grotesk, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}` })

  if (phase === 'réglages') {
    return (
      <FenêtreMémo T={T} titre="📝 Examen blanc" onFermer={onFermer}>
        <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
          Un QCM chronométré, sans correction pendant l'épreuve. À la fin : ta note, ton score par thème (un paquet = un thème) et tes erreurs. Objectif : {OBJECTIF * 100} %.
        </p>
        <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Thèmes</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
          {avecCartes.length === 0 && <p style={{ fontSize: '13px', color: T.textMuted }}>Il faut au moins un paquet de 2 cartes.</p>}
          {avecCartes.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: '14px', color: T.text }}>
              <input type="checkbox" checked={choix.has(p.id)} onChange={() => setChoix(s => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })} style={{ accentColor: T.accent }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.couleur }} />
              <span style={{ flex: 1 }}>{p.nom}</span>
              <span style={{ fontSize: '11.5px', color: T.textMuted }}>{data.cartes.filter(c => c.paquetId === p.id).length}</span>
            </label>
          ))}
        </div>
        <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Questions</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {[10, 20, 40].map(n => <button key={n} onClick={() => setNombre(n)} style={puce(nombre === n)}>{n}</button>)}
        </div>
        <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Durée</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[5, 10, 15, 30, 45].map(n => <button key={n} onClick={() => setMinutes(n)} style={puce(minutes === n)}>{n} min</button>)}
        </div>
        <button onClick={commencer} disabled={!disponibles} style={{ width: '100%', minHeight: 46, borderRadius: '12px', border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: '15px', cursor: disponibles ? 'pointer' : 'default', opacity: disponibles ? 1 : 0.5 }}>
          Commencer · {Math.min(nombre, disponibles)} questions · {minutes} min
        </button>
        {historique.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Derniers examens</p>
            {historique.map(e => {
              const p = pourcent(e.bonnes, e.total)
              return (
                <div key={e.date} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: T.text, padding: '4px 0' }}>
                  <span style={{ width: 92, color: T.textMuted, fontSize: '12px' }}>{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  <span style={{ flex: 1, height: 8, borderRadius: 4, background: T.surface2, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${p}%`, background: p >= OBJECTIF * 100 ? '#2e9e6b' : '#e0a100' }} /></span>
                  <strong style={{ width: 70, textAlign: 'right', fontFamily: grotesk }}>{e.bonnes}/{e.total}</strong>
                </div>
              )
            })}
          </div>
        )}
      </FenêtreMémo>
    )
  }

  if (phase === 'examen') {
    const q = questions[index]
    return (
      <FenêtreMémo T={T} titre="📝 Examen blanc" onFermer={() => { if (window.confirm('Arrêter l\'examen ? Il ne sera pas noté.')) onFermer() }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontFamily: grotesk }}>
          <span style={{ fontSize: '13px', color: T.textMuted }}>Question {index + 1}/{questions.length}</span>
          <span style={{ flex: 1, height: 6, borderRadius: 3, background: T.surface2, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${pourcent(index, questions.length)}%`, background: T.accent }} /></span>
          <strong aria-label="Temps restant" style={{ fontSize: '15px', color: reste <= 60 ? T.danger : T.text, fontVariantNumeric: 'tabular-nums' }}>⏱ {String(Math.floor(reste / 60)).padStart(2, '0')}:{String(reste % 60).padStart(2, '0')}</strong>
        </div>
        <p style={{ fontSize: '11.5px', margin: '0 0 6px', color: couleurThème(q.carte.paquetId), fontFamily: grotesk, fontWeight: 700 }}>{nomThème(q.carte.paquetId)}</p>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '18px 16px', marginBottom: '12px', fontFamily: serif, fontSize: '18px', lineHeight: 1.45, color: T.text, wordBreak: 'break-word' }}>
          <TexteFormaté texte={q.carte.recto} couleurDéfaut={T.text} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {q.options.map((o, k) => (
            <button key={o.id} onClick={() => répondre(o.id)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', background: T.surface, border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}>
              <strong style={{ fontFamily: grotesk, color: T.accent }}>{'ABCD'[k]}</strong>
              <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}><TexteFormaté texte={o.verso} couleurDéfaut={T.text} /></span>
            </button>
          ))}
        </div>
        <button onClick={() => répondre(null)} style={{ marginTop: '10px', background: 'none', border: 'none', color: T.textMuted, fontSize: '13px', cursor: 'pointer', fontFamily: grotesk, minHeight: 36 }}>Je ne sais pas → question suivante</button>
      </FenêtreMémo>
    )
  }

  // Bilan
  const bonnes = questions.filter((q, i) => réponses[i] === q.carte.id).length
  const note = pourcent(bonnes, questions.length)
  const thèmes = [...new Set(questions.map(q => q.carte.paquetId))]
  const erreurs = questions.map((q, i) => ({ ...q, choisie: réponses[i] })).filter(q => q.choisie !== q.carte.id)
  return (
    <FenêtreMémo T={T} titre="📝 Résultat" onFermer={onFermer}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '44px', margin: 0, fontFamily: grotesk, fontWeight: 800, color: note >= OBJECTIF * 100 ? '#2e9e6b' : note >= 50 ? '#c98a00' : T.danger }}>{note} %</p>
        <p style={{ margin: '2px 0 0', color: T.textMuted, fontSize: '13px' }}>{bonnes}/{questions.length} bonnes réponses · {note >= OBJECTIF * 100 ? 'objectif atteint 🎉' : `objectif : ${OBJECTIF * 100} %`}</p>
      </div>
      <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Par thème</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {thèmes.map(id => {
          const qs = questions.map((q, i) => ({ q, i })).filter(x => x.q.carte.paquetId === id)
          const b = qs.filter(x => réponses[x.i] === x.q.carte.id).length
          const p = pourcent(b, qs.length)
          return (
            <div key={id}>
              <div style={{ display: 'flex', fontSize: '13px', color: T.text, marginBottom: '3px' }}><span style={{ flex: 1 }}>{nomThème(id)}</span><strong style={{ fontFamily: grotesk }}>{b}/{qs.length}</strong></div>
              <div style={{ height: 10, borderRadius: 5, background: T.surface2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${p}%`, background: p >= OBJECTIF * 100 ? '#2e9e6b' : p >= 50 ? '#e0a100' : T.danger }} /></div>
            </div>
          )
        })}
      </div>
      {erreurs.length > 0 && (
        <>
          <button onClick={() => { onErreursEnRévision(erreurs.map(e => e.carte.id)); onFermer() }} style={{ width: '100%', minHeight: 44, borderRadius: '12px', border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>
            🔁 Revoir mes {erreurs.length} erreur{erreurs.length > 1 ? 's' : ''} dès aujourd'hui
          </button>
          <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>Erreurs</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {erreurs.map(e => (
              <div key={e.carte.id} style={{ padding: '10px 12px', borderRadius: '10px', background: T.surface, border: `1px solid ${T.border}`, fontSize: '13px', color: T.text, wordBreak: 'break-word' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}><TexteFormaté texte={e.carte.recto} couleurDéfaut={T.text} /></div>
                {e.choisie && <div style={{ color: T.danger, textDecoration: 'line-through', marginBottom: '2px' }}>✗ <TexteFormaté texte={e.options.find(o => o.id === e.choisie)?.verso} couleurDéfaut={T.danger} /></div>}
                <div style={{ color: '#2e9e6b' }}>✓ <TexteFormaté texte={e.carte.verso} couleurDéfaut="#2e9e6b" /></div>
              </div>
            ))}
          </div>
        </>
      )}
      <button onClick={() => setPhase('réglages')} style={{ width: '100%', marginTop: '14px', minHeight: 42, borderRadius: '12px', border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: grotesk, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Nouvel examen</button>
    </FenêtreMémo>
  )
}
