import { useState, useMemo } from 'react'
import { grotesk, serif } from '../lib/theme'
import { FenêtreMémo } from './PaquetsPrets'
import { ÉVÉNEMENTS, LIEUX } from '../lib/paquetsPrets'

const mélanger = t => { const c = [...t]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] } return c }
const record = (clé, v) => { try { const r = Number(localStorage.getItem(clé) || 0); if (v > r) localStorage.setItem(clé, String(v)); return Math.max(r, v) } catch { return v } }
const lireRecord = clé => { try { return Number(localStorage.getItem(clé) || 0) } catch { return 0 } }

// ---------- Frise : remettre dans l'ordre ----------
function Frise({ T }) {
  const [partie, setPartie] = useState(0)
  const évts = useMemo(() => { const l = []; const années = new Set(); for (const e of mélanger(ÉVÉNEMENTS)) { if (!années.has(e.année)) { années.add(e.année); l.push(e) } if (l.length === 5) break } return l }, [partie]) // eslint-disable-line react-hooks/exhaustive-deps
  const [placés, setPlacés] = useState([])
  const [erreurs, setErreurs] = useState(0)
  const [faux, setFaux] = useState(null)
  const restants = évts.filter(e => !placés.includes(e))
  const toucher = e => {
    const premier = restants.reduce((a, b) => (b.année < a.année ? b : a))
    if (e === premier) { setPlacés(p => [...p, e]); setFaux(null) } else { setErreurs(n => n + 1); setFaux(e.texte) }
  }
  const nouvelle = () => { setPartie(n => n + 1); setPlacés([]); setErreurs(0); setFaux(null) }
  return (
    <div>
      <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>Touche les événements du <strong>plus ancien</strong> au plus récent.</p>
      <ol style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, borderLeft: `3px solid ${T.accent}`, minHeight: 20 }}>
        {placés.map(e => (
          <li key={e.texte} style={{ padding: '6px 10px', fontSize: '14px', color: T.text }}><strong style={{ fontFamily: grotesk, color: T.accent, marginRight: 8 }}>{e.année}</strong>{e.texte}</li>
        ))}
        {!placés.length && <li style={{ padding: '6px 10px', fontSize: '13px', color: T.textMuted }}>La frise se remplit ici…</li>}
      </ol>
      {faux && <p role="status" style={{ color: T.danger, fontSize: '13px', margin: '0 0 8px' }}>✗ Pas encore : il y a plus ancien que « {faux} ».</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {restants.map(e => (
          <button key={e.texte} onClick={() => toucher(e)} style={{ textAlign: 'left', minHeight: 46, padding: '10px 12px', borderRadius: 10, border: `1px solid ${faux === e.texte ? T.danger : T.border}`, background: T.surface, color: T.text, fontSize: '14px', cursor: 'pointer' }}>{e.texte}</button>
        ))}
      </div>
      {!restants.length && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <p style={{ fontFamily: grotesk, fontWeight: 800, fontSize: '18px', color: erreurs ? '#c98a00' : '#2e9e6b', margin: '0 0 8px' }}>{erreurs ? `Terminé avec ${erreurs} erreur${erreurs > 1 ? 's' : ''}` : 'Parfait, sans erreur 🎉'}</p>
          <button onClick={nouvelle} style={{ minHeight: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, cursor: 'pointer' }}>Nouvelle frise</button>
        </div>
      )}
    </div>
  )
}

// ---------- Avant ou après ----------
function AvantAprès({ T }) {
  const tirer = () => { let a, b; do { [a, b] = mélanger(ÉVÉNEMENTS) } while (a.année === b.année); return [a, b] }
  const [paire, setPaire] = useState(tirer)
  const [choix, setChoix] = useState(null)
  const [série, setSérie] = useState(0)
  const [meilleure, setMeilleure] = useState(() => lireRecord('react-blocs-jeu-avant-apres'))
  const premier = paire[0].année < paire[1].année ? paire[0] : paire[1]
  const choisir = e => {
    if (choix) return
    setChoix(e)
    if (e === premier) { const s = série + 1; setSérie(s); setMeilleure(record('react-blocs-jeu-avant-apres', s)) } else setSérie(0)
  }
  return (
    <div>
      <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 6px' }}>Lequel s'est passé <strong>en premier</strong> ?</p>
      <p style={{ fontFamily: grotesk, fontSize: '13px', color: T.text, margin: '0 0 10px' }}>Série : <strong>{série}</strong> · record : {meilleure}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paire.map(e => {
          const bon = choix && e === premier, mauvais = choix === e && e !== premier
          return (
            <button key={e.texte} onClick={() => choisir(e)} style={{ minHeight: 64, padding: '12px 14px', borderRadius: 12, textAlign: 'left', fontSize: '15px', cursor: choix ? 'default' : 'pointer', color: T.text, background: bon ? '#2e9e6b22' : mauvais ? T.dangerSoft : T.surface, border: `2px solid ${bon ? '#2e9e6b' : mauvais ? T.danger : T.border}` }}>
              {e.texte}{choix && <strong style={{ display: 'block', fontFamily: grotesk, fontSize: '18px', marginTop: 4, color: bon ? '#2e9e6b' : T.textMuted }}>{e.année}</strong>}
            </button>
          )
        })}
      </div>
      {choix && <button onClick={() => { setPaire(tirer()); setChoix(null) }} style={{ width: '100%', marginTop: 12, minHeight: 46, borderRadius: 12, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Suivant →</button>}
    </div>
  )
}

// ---------- Carte de France ----------
// Contour simplifié (latitude, longitude), projection équirectangulaire.
const CONTOUR = [[51.05, 2.37], [50.95, 1.85], [50.73, 1.6], [50.2, 1.55], [49.92, 1.08], [49.76, 0.37], [49.49, 0.1], [49.28, -0.25], [49.39, -1.2], [49.67, -1.26], [49.64, -1.62], [49.72, -1.94], [49.33, -1.7], [48.84, -1.6], [48.64, -1.51], [48.65, -2.02], [48.53, -2.76], [48.82, -3.45], [48.72, -3.98], [48.6, -4.6], [48.36, -4.77], [48.25, -4.5], [48.04, -4.73], [47.8, -4.37], [47.75, -3.37], [47.48, -3.1], [47.55, -2.9], [47.27, -2.2], [46.95, -2.2], [46.5, -1.78], [46.16, -1.15], [45.62, -1.03], [45.2, -1.16], [44.64, -1.25], [44.0, -1.35], [43.48, -1.56], [43.36, -1.78], [43.05, -1.2], [42.8, -0.4], [42.7, 0.6], [42.5, 1.45], [42.43, 1.93], [42.43, 3.17], [42.7, 3.04], [43.0, 3.05], [43.3, 3.5], [43.53, 4.13], [43.45, 4.43], [43.33, 4.85], [43.3, 5.37], [43.12, 5.93], [43.27, 6.64], [43.55, 7.0], [43.7, 7.27], [43.78, 7.5], [44.09, 7.59], [44.42, 6.85], [44.93, 6.72], [45.25, 6.9], [45.5, 7.0], [45.92, 7.0], [46.39, 6.8], [46.2, 6.15], [46.13, 5.96], [46.48, 6.06], [46.9, 6.45], [47.5, 7.0], [47.58, 7.59], [48.0, 7.6], [48.57, 7.8], [48.97, 8.23], [49.12, 7.5], [49.2, 6.95], [49.47, 6.37], [49.55, 5.83], [49.8, 5.0], [50.15, 4.82], [50.0, 4.15], [50.35, 4.0], [50.55, 3.25], [50.75, 2.85], [51.09, 2.55]]
const CORSE = [[43.0, 9.4], [42.7, 9.45], [42.1, 9.55], [41.6, 9.3], [41.38, 9.17], [41.7, 8.8], [41.93, 8.6], [42.3, 8.55], [42.57, 8.75], [42.95, 9.35]]
const K = 60, COS = Math.cos((46.5 * Math.PI) / 180)
const px = ([lat, lon]) => [(lon + 5.5) * COS * K, (51.6 - lat) * K]
const versLatLon = (x, y) => [51.6 - y / K, x / (COS * K) - 5.5]
const L = 15.5 * COS * K, H = 10.4 * K
const km = (a, b) => { const r = Math.PI / 180, d1 = (b[0] - a[0]) * r, d2 = (b[1] - a[1]) * r; const h = Math.sin(d1 / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(d2 / 2) ** 2; return Math.round(12742 * Math.asin(Math.sqrt(h))) }

function Carte({ T }) {
  const [mode, setMode] = useState('où') // où | quelle | cheflieu
  const [tour, setTour] = useState(0)
  const [score, setScore] = useState({ points: 0, total: 0 })
  const candidats = mode === 'cheflieu' ? LIEUX.filter(l => l.région) : LIEUX
  const cible = useMemo(() => candidats[Math.floor(Math.random() * candidats.length)], [tour, mode]) // eslint-disable-line react-hooks/exhaustive-deps
  const options = useMemo(() => mélanger([cible, ...mélanger(candidats.filter(l => l !== cible)).slice(0, 3)]), [cible]) // eslint-disable-line react-hooks/exhaustive-deps
  const [réponse, setRéponse] = useState(null) // { x, y, km } | { choix }
  const suivant = () => { setRéponse(null); setTour(t => t + 1) }
  const changerMode = m => { setMode(m); setRéponse(null); setScore({ points: 0, total: 0 }); setTour(t => t + 1) }
  const toucherCarte = e => {
    if (mode !== 'où' || réponse) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * L, y = ((e.clientY - r.top) / r.height) * H
    const d = km(versLatLon(x, y), [cible.lat, cible.lon])
    setRéponse({ x, y, km: d })
    setScore(s => ({ points: s.points + (d <= 60 ? 1 : d <= 150 ? 0.5 : 0), total: s.total + 1 }))
  }
  const choisir = l => { if (réponse) return; setRéponse({ choix: l }); setScore(s => ({ points: s.points + (l === cible ? 1 : 0), total: s.total + 1 })) }
  const [cx, cy] = px([cible.lat, cible.lon])
  const montrerCible = mode !== 'où' ? mode === 'quelle' || !!réponse : !!réponse
  const puce = actif => ({ minHeight: 36, padding: '0 12px', borderRadius: '18px', fontFamily: grotesk, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}` })
  const question = mode === 'où' ? <>Où se trouve <strong>{cible.nom}</strong> ? Touche la carte.</> : mode === 'quelle' ? <>Quelle est cette ville (point rouge) ?</> : <>Quel est le chef-lieu de la région <strong>{cible.région}</strong> ?</>
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={() => changerMode('où')} style={puce(mode === 'où')}>📍 Où est… ?</button>
        <button onClick={() => changerMode('quelle')} style={puce(mode === 'quelle')}>❓ Quelle ville ?</button>
        <button onClick={() => changerMode('cheflieu')} style={puce(mode === 'cheflieu')}>🏛️ Chefs-lieux</button>
      </div>
      <p style={{ fontFamily: serif, fontSize: '18px', color: T.text, margin: '0 0 4px' }}>{question}</p>
      <p style={{ fontFamily: grotesk, fontSize: '12.5px', color: T.textMuted, margin: '0 0 8px' }}>Score : {score.points}/{score.total}</p>
      <svg viewBox={`0 0 ${L} ${H}`} onClick={toucherCarte} role="img" aria-label="Carte de France" style={{ width: '100%', height: 'auto', display: 'block', background: '#bfe0f5', borderRadius: 12, cursor: mode === 'où' && !réponse ? 'crosshair' : 'default', touchAction: 'manipulation' }}>
        <polygon points={CONTOUR.map(p => px(p).join(',')).join(' ')} fill="#f4efe1" stroke="#7a6f58" strokeWidth="2" strokeLinejoin="round" />
        <polygon points={CORSE.map(p => px(p).join(',')).join(' ')} fill="#f4efe1" stroke="#7a6f58" strokeWidth="2" strokeLinejoin="round" />
        {réponse?.x !== undefined && (
          <>
            <line x1={réponse.x} y1={réponse.y} x2={cx} y2={cy} stroke="#555" strokeWidth="2" strokeDasharray="6 5" />
            <circle cx={réponse.x} cy={réponse.y} r="8" fill={T.accent} stroke="#fff" strokeWidth="2" />
          </>
        )}
        {montrerCible && <circle cx={cx} cy={cy} r="9" fill="#d33" stroke="#fff" strokeWidth="3" />}
        {réponse && <text x={cx > L * 0.7 ? cx - 12 : cx + 12} y={cy - 10} textAnchor={cx > L * 0.7 ? 'end' : 'start'} fontSize="22" fontWeight="700" fill="#1b1b1b" stroke="#fff" strokeWidth="5" paintOrder="stroke">{cible.nom}</text>}
      </svg>
      {mode !== 'où' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          {options.map(l => {
            const bon = réponse && l === cible, mauvais = réponse?.choix === l && l !== cible
            return <button key={l.nom} onClick={() => choisir(l)} style={{ minHeight: 46, borderRadius: 10, fontSize: '14px', cursor: réponse ? 'default' : 'pointer', color: T.text, background: bon ? '#2e9e6b22' : mauvais ? T.dangerSoft : T.surface, border: `2px solid ${bon ? '#2e9e6b' : mauvais ? T.danger : T.border}` }}>{l.nom}</button>
          })}
        </div>
      )}
      {réponse && (
        <div style={{ marginTop: 10 }}>
          {réponse.km !== undefined && <p role="status" style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '15px', margin: '0 0 8px', color: réponse.km <= 60 ? '#2e9e6b' : réponse.km <= 150 ? '#c98a00' : T.danger }}>{réponse.km <= 60 ? '🎯 Bravo' : réponse.km <= 150 ? '👍 Pas loin' : '📏 Assez loin'} : {réponse.km} km{cible.région ? ` · chef-lieu de ${cible.région}` : ''}</p>}
          {réponse.choix && cible.région && mode === 'quelle' && <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 8px' }}>{cible.nom} est le chef-lieu de la région {cible.région}.</p>}
          <button onClick={suivant} style={{ width: '100%', minHeight: 46, borderRadius: 12, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Suivant →</button>
        </div>
      )}
    </div>
  )
}

export default function JeuxNaturalisation({ T, onFermer }) {
  const [jeu, setJeu] = useState('frise')
  const puce = actif => ({ minHeight: 38, padding: '0 14px', borderRadius: '19px', fontFamily: grotesk, fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}` })
  return (
    <FenêtreMémo T={T} titre="🎲 Jeux de révision" onFermer={onFermer}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }} role="tablist">
        {[['frise', '📜 Frise'], ['avant', '⏳ Avant ou après ?'], ['carte', '🗺️ Carte de France']].map(([id, nom]) => (
          <button key={id} role="tab" aria-selected={jeu === id} onClick={() => setJeu(id)} style={puce(jeu === id)}>{nom}</button>
        ))}
      </div>
      {jeu === 'frise' && <Frise T={T} />}
      {jeu === 'avant' && <AvantAprès T={T} />}
      {jeu === 'carte' && <Carte T={T} />}
    </FenêtreMémo>
  )
}
