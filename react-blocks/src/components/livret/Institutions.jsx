import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { INSTITUTIONS } from '../../lib/livret2026'
import { direTexte, déverrouillerAudio } from '../../lib/texteFormate'

// 4. Schéma vivant des institutions : les liens (élit, nomme, vote, contrôle…)
// se dessinent un par un en flèches animées, puis le parcours d'une loi et un
// quiz « qui fait quoi ? ».
const RANGS = [
  ['constitution'],
  ['president'],
  ['premier-ministre', 'gouvernement'],
  ['parlement', 'assemblee', 'senat', 'conseil-constitutionnel'],
  ['justice', 'conseil-etat', 'administration', 'etat'],
  ['prefet', 'elus-locaux', 'region', 'departement', 'commune', 'intercommunalite', 'maire', 'outre-mer'],
  ['citoyens'],
]
const estEurope = id => /europ|-ue$|^ue-|union|^bce$/.test(id)
function rangDe(id) {
  const k = RANGS.findIndex(r => r.includes(id))
  if (k >= 0) return k
  if (/conseil-|cour|tribun|defenseur|cnil|autorit/.test(id)) return 3
  if (/region|depart|commun|metropol|intercommun|collectiv|local/.test(id)) return 4
  return 3
}

export default function Institutions({ T, S }) {
  const I = INSTITUTIONS
  const zone = useRef(null)
  const refs = useRef({})
  const [étape, setÉtape] = useState(-1)
  const [lecture, setLecture] = useState(false)
  const [choisi, setChoisi] = useState(null)
  const [tout, setTout] = useState(false)
  const [coords, setCoords] = useState({})
  const [loi, setLoi] = useState(-1)
  const [qi, setQi] = useState(0)
  const [vue, setVue] = useState(false)

  const acteurs = I?.acteurs || []
  const liens = (I?.liens || []).filter(l => acteurs.some(a => a.id === l.de) && acteurs.some(a => a.id === l.vers))
  const france = acteurs.filter(a => !estEurope(a.id))
  const europe = acteurs.filter(a => estEurope(a.id))
  const rangs = RANGS.map((_, k) => france.filter(a => rangDe(a.id) === k)).filter(r => r.length)

  // Positions des cases (pour tracer les flèches).
  const mesurer = () => {
    const z = zone.current?.getBoundingClientRect()
    if (!z) return
    const c = {}
    Object.entries(refs.current).forEach(([id, el]) => { if (el) { const r = el.getBoundingClientRect(); c[id] = { x: r.left - z.left + r.width / 2, y: r.top - z.top + r.height / 2, w: r.width, h: r.height } } })
    setCoords(c)
  }
  useLayoutEffect(() => { mesurer() }, [acteurs.length])
  useEffect(() => { window.addEventListener('resize', mesurer); return () => window.removeEventListener('resize', mesurer) }, [])

  useEffect(() => {
    if (!lecture || étape < 0) return undefined
    const l = liens[étape]
    let annulé = false, t
    const suite = () => { if (annulé) return; if (étape + 1 < liens.length) setÉtape(x => x + 1); else setLecture(false) }
    const de = acteurs.find(a => a.id === l.de), vers = acteurs.find(a => a.id === l.vers)
    if (window.speechSynthesis) direTexte(`${de.nom} ${l.verbe} ${vers.nom.replace(/^(le|la|les|l')\s*/i, m => m.toLowerCase())}.`).then(() => { if (!annulé) t = setTimeout(suite, 700) })
    else t = setTimeout(suite, 3200)
    return () => { annulé = true; clearTimeout(t); window.speechSynthesis?.cancel() }
  }, [lecture, étape]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loi < 0 || !I?.loi || loi >= I.loi.length - 1) return undefined
    const t = setTimeout(() => setLoi(x => x + 1), 1500)
    return () => clearTimeout(t)
  }, [loi, I])

  if (!I) return <p style={S.discret}>Le schéma des institutions arrive avec le contenu de la partie 2.</p>

  const lienActif = étape >= 0 ? liens[étape] : null
  const visibles = tout ? liens : lienActif ? [lienActif] : choisi ? liens.filter(l => l.de === choisi || l.vers === choisi) : []
  const flèche = (l, k, fort) => {
    const a = coords[l.de], b = coords[l.vers]
    if (!a || !b) return null
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
    const ra = Math.min(a.w, a.h) / 2 + 2, rb = Math.min(b.w, b.h) / 2 + 6
    const x1 = a.x + (dx / d) * ra, y1 = a.y + (dy / d) * ra, x2 = b.x - (dx / d) * rb, y2 = b.y - (dy / d) * rb
    const mx = (x1 + x2) / 2 - dy * 0.12, my = (y1 + y2) / 2 + dx * 0.12
    const chemin = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`
    return (
      <g key={`${l.de}-${l.vers}-${k}-${étape}`}>
        <path d={chemin} fill="none" stroke={fort ? '#f59e0b' : T.textMuted} strokeWidth={fort ? 3.5 : 1.6} markerEnd={`url(#${fort ? 'pointe-forte' : 'pointe'})`} style={fort ? { strokeDasharray: 900, strokeDashoffset: 900, animation: 'l26-trace 1.1s ease-out forwards' } : { opacity: 0.6 }} />
        {fort && <text x={mx} y={my} textAnchor="middle" fontSize="13" fontWeight="800" fill={T.text} stroke={T.surface} strokeWidth="4" paintOrder="stroke" className="l26-apparait" style={{ animationDelay: '.6s' }}>{l.verbe}</text>}
      </g>
    )
  }
  const Case = ({ a }) => {
    const actif = choisi === a.id || lienActif?.de === a.id || lienActif?.vers === a.id
    return (
      <button ref={el => { refs.current[a.id] = el }} onClick={() => { setLecture(false); setÉtape(-1); setChoisi(c => (c === a.id ? null : a.id)) }} aria-pressed={choisi === a.id} style={{
        position: 'relative', zIndex: 2, flex: '1 1 100px', maxWidth: 190, minHeight: 66, padding: '8px 6px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
        background: actif ? '#fff7e0' : T.surface, color: actif ? '#1f2937' : T.text, border: `2px solid ${actif ? '#f59e0b' : T.border}`, boxShadow: actif ? '0 0 0 5px rgba(245,158,11,.25)' : 'none', transition: 'all .3s', transform: actif ? 'scale(1.06)' : 'none',
      }}>
        <div style={{ fontSize: 24 }}>{a.emoji}</div>
        <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.2 }}>{a.nom}</div>
        {a.mandat && <div style={{ fontSize: 10.5, opacity: 0.75 }}>{a.mandat}</div>}
      </button>
    )
  }
  const ac = choisi && acteurs.find(a => a.id === choisi)
  const q = I.questions?.[qi % (I.questions.length || 1)]

  return (
    <>
      <section style={S.carte}>
        <h2 style={S.titre}>🏛️ Qui élit qui ? Qui nomme qui ?</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button onClick={() => { déverrouillerAudio(); setChoisi(null); setTout(false); if (lecture) setLecture(false); else { setÉtape(e => (e < 0 || e >= liens.length - 1 ? 0 : e)); setLecture(true) } }} style={S.bouton(true)}>{lecture ? '⏸ Pause' : '▶ Animer le schéma'}</button>
          <button onClick={() => { setLecture(false); setChoisi(null); setÉtape(e => Math.max(0, e - 1)) }} aria-label="Lien précédent" style={{ ...S.bouton(false), width: 46, padding: 0 }}>⏮</button>
          <button onClick={() => { setLecture(false); setChoisi(null); setÉtape(e => Math.min(liens.length - 1, e + 1)) }} aria-label="Lien suivant" style={{ ...S.bouton(false), width: 46, padding: 0 }}>⏭</button>
          <button onClick={() => { setLecture(false); setÉtape(-1); setChoisi(null); setTout(t => !t) }} aria-pressed={tout} style={S.bouton(tout)}>{tout ? 'Masquer les liens' : 'Tous les liens'}</button>
        </div>
        {lienActif && (
          <p key={étape} className="l26-monte" aria-live="polite" style={{ margin: '0 0 10px', padding: '10px 12px', borderRadius: 12, background: `${T.accent}1c`, fontSize: 15.5, lineHeight: 1.4 }}>
            <strong>{étape + 1}/{liens.length}</strong> · {acteurs.find(a => a.id === lienActif.de)?.emoji} <strong>{acteurs.find(a => a.id === lienActif.de)?.nom}</strong> → <em>{lienActif.verbe}</em> → {acteurs.find(a => a.id === lienActif.vers)?.emoji} <strong>{acteurs.find(a => a.id === lienActif.vers)?.nom}</strong>
          </p>
        )}
        <div ref={zone} style={{ position: 'relative', padding: '6px 0' }}>
          <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3, overflow: 'visible' }}>
            <defs>
              <marker id="pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={T.textMuted} /></marker>
              <marker id="pointe-forte" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" /></marker>
            </defs>
            {visibles.map((l, k) => flèche(l, k, !tout || visibles.length === 1))}
          </svg>
          {europe.length > 0 && (
            <div style={{ border: `2px dashed #2563eb`, borderRadius: 14, padding: '8px 6px', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', marginBottom: 6, textAlign: 'center' }}>🇪🇺 Union européenne</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>{europe.map(a => <Case key={a.id} a={a} />)}</div>
            </div>
          )}
          {rangs.map((r, k) => <div key={k} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 26 }}>{r.map(a => <Case key={a.id} a={a} />)}</div>)}
        </div>
        {ac && (
          <div className="l26-monte" style={{ marginTop: 4, padding: 12, borderRadius: 12, background: T.bg, border: `1px solid ${T.border}` }}>
            <strong style={{ fontSize: 16 }}>{ac.emoji} {ac.nom}</strong>{ac.mandat && <span style={{ color: T.textMuted, fontSize: 13 }}> · {ac.mandat}</span>}
            <p style={{ margin: '6px 0', fontSize: 14.5, lineHeight: 1.5 }}>{ac.rôle}</p>
            {liens.filter(l => l.de === ac.id || l.vers === ac.id).map((l, k) => <div key={k} style={{ fontSize: 13.5, color: T.textMuted }}>• {acteurs.find(a => a.id === l.de)?.nom} {l.verbe} {acteurs.find(a => a.id === l.vers)?.nom}</div>)}
          </div>
        )}
        <p style={{ ...S.discret, fontSize: 12.5, marginTop: 8 }}>Touche une institution pour voir son rôle et ses liens.</p>
      </section>

      {I.loi?.length > 0 && (
        <section style={S.carte} aria-labelledby="t-loi">
          <h2 id="t-loi" style={S.titre}>📜 De la loi à son application</h2>
          <button onClick={() => setLoi(0)} style={{ ...S.bouton(true), marginBottom: 12 }}>{loi < 0 ? '▶ Suivre le parcours' : '↺ Recommencer'}</button>
          <div style={{ display: 'grid', gap: 4 }}>
            {I.loi.map(([e, t], k) => (
              <div key={k}>
                {k > 0 && <div aria-hidden="true" style={{ textAlign: 'center', color: k <= loi ? '#f59e0b' : T.border, fontSize: 18, lineHeight: 1, transition: 'color .4s' }}>▼</div>}
                <div className={k === loi ? 'l26-zoom' : ''} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', borderRadius: 12, border: `2px solid ${k === loi ? '#f59e0b' : k < loi ? '#22a55e' : T.border}`, background: k <= loi ? T.surface : T.bg, opacity: loi < 0 || k <= loi ? 1 : 0.35, transition: 'opacity .4s, border-color .4s' }}>
                  <span style={{ fontSize: 24 }}>{e}</span><span style={{ fontSize: 14.5, lineHeight: 1.4 }}>{t}</span>
                  {k < loi && <span style={{ marginLeft: 'auto', color: '#22a55e' }}>✓</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {q && (
        <section style={S.carte} aria-labelledby="t-quiz">
          <h2 id="t-quiz" style={S.titre}>❓ Qui fait quoi ? · {qi % I.questions.length + 1}/{I.questions.length}</h2>
          <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.4 }}>{q.q}</p>
          {vue ? <p className="l26-retourne" style={{ margin: '0 0 12px', padding: 12, borderRadius: 12, background: `${T.accent}1c`, fontSize: 15.5, lineHeight: 1.5 }}>✅ {q.r}</p> : null}
          <button onClick={() => { if (vue) { setVue(false); setQi(x => x + 1) } else setVue(true) }} style={S.bouton(!vue)}>{vue ? 'Question suivante →' : 'Voir la réponse'}</button>
        </section>
      )}
    </>
  )
}
