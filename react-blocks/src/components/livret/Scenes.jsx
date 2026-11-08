import { useState, useEffect, useRef } from 'react'
import { CONTOUR, CORSE, px, L, H } from '../../lib/carteFrance'

// Les scènes animées du Livret 2026. Chaque scène s'affiche sur la « scène »
// du théâtre (fond sombre, texte clair) avec ses propres animations.
// `onRépondu` : appelé quand une scène interactive a reçu sa réponse.

const carte = { background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 16 }
const d = (s, i) => ({ animationDelay: `${s + i}s` })
const Titre = ({ children }) => <h3 className="l26-apparait" style={{ margin: '0 0 16px', fontSize: 'clamp(19px, 4.6vw, 27px)', lineHeight: 1.25, fontWeight: 800, textAlign: 'center' }}>{children}</h3>

export function Compteur({ valeur, délai = 0, durée = 1400 }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let rafId, début
    const t = setTimeout(() => {
      const pas = ts => { if (!début) début = ts; const p = Math.min(1, (ts - début) / durée); setV(Math.round(valeur * (1 - Math.pow(1 - p, 3)))); if (p < 1) rafId = requestAnimationFrame(pas) }
      rafId = requestAnimationFrame(pas)
    }, délai * 1000)
    return () => { clearTimeout(t); cancelAnimationFrame(rafId) }
  }, [valeur, délai, durée])
  return <>{v.toLocaleString('fr-FR')}</>
}

function MachineÀÉcrire({ texte, vitesse = 28, onFini }) {
  const [n, setN] = useState(0)
  const fini = useRef(onFini)
  useEffect(() => { fini.current = onFini })
  useEffect(() => {
    const t = setInterval(() => setN(x => { if (x >= texte.length) { clearInterval(t); fini.current?.(); return x } return x + 1 }), vitesse)
    return () => clearInterval(t)
  }, [texte, vitesse])
  return <>{texte.slice(0, n)}<span className="l26-curseur" aria-hidden="true">{n < texte.length ? '▍' : ''}</span></>
}

function SceneTitre({ s }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="l26-rebond" style={{ fontSize: 'clamp(64px, 16vw, 110px)', lineHeight: 1.1 }}>{s.emoji}</div>
      <h3 className="l26-lettres" style={{ fontSize: 'clamp(24px, 6vw, 40px)', margin: '10px 0 14px', fontWeight: 800, lineHeight: 1.15 }}>
        {s.titre.split(' ').map((m, i) => <span key={i} style={{ display: 'inline-block', marginRight: '.28em', ...d(0.25, i * 0.09) }}>{m}</span>)}
      </h3>
      <p className="l26-apparait" style={{ fontSize: 'clamp(16px, 3.8vw, 20px)', lineHeight: 1.5, maxWidth: 620, margin: '0 auto', opacity: 0.92, ...d(0.9, 0) }}>{s.texte}</p>
    </div>
  )
}

function ScenePoints({ s }) {
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ display: 'grid', gap: 10, maxWidth: 640, margin: '0 auto' }}>
        {s.points.map(([e, t], i) => (
          <div key={i} className="l26-glisse-g" style={{ ...carte, display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', ...d(0.4, i * 0.75) }}>
            <span className="l26-pop" style={{ fontSize: 30, ...d(0.55, i * 0.75) }}>{e}</span>
            <span style={{ fontSize: 'clamp(15px, 3.6vw, 18px)', lineHeight: 1.45 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneChiffres({ s }) {
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        {s.chiffres.map(([n, suf, lib], i) => (
          <div key={i} className="l26-zoom" style={{ ...carte, padding: '16px 18px', minWidth: 140, flex: '1 1 140px', maxWidth: 260, textAlign: 'center', ...d(0.3, i * 0.6) }}>
            <div style={{ fontSize: 'clamp(34px, 9vw, 52px)', fontWeight: 900, color: '#ffd166', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}><Compteur valeur={n} délai={0.3 + i * 0.6} />{suf}</div>
            <div style={{ fontSize: 15, marginTop: 6, opacity: 0.9, lineHeight: 1.4 }}>{lib}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneFrise({ s }) {
  const n = s.étapes.length
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', paddingLeft: 26 }}>
        <div className="l26-trace-v" style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 4, borderRadius: 2, background: 'linear-gradient(#ffd166, #ef476f)', transformOrigin: 'top' }} />
        {s.étapes.map(([date, texte, e], i) => (
          <div key={i} className="l26-glisse-d" style={{ position: 'relative', marginBottom: i < n - 1 ? 14 : 0, ...d(0.5, i * 0.8) }}>
            <span className="l26-pop" style={{ position: 'absolute', left: -26, top: 4, width: 22, height: 22, borderRadius: 11, background: '#ffd166', boxShadow: '0 0 0 4px rgba(255,209,102,.25)', ...d(0.5, i * 0.8) }} />
            <div style={{ ...carte, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 26 }}>{e}</span>
              <span><strong style={{ display: 'block', color: '#ffd166', fontSize: 17 }}>{date}</strong><span style={{ fontSize: 15.5, lineHeight: 1.4 }}>{texte}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneDuo({ s }) {
  const panneau = (p, cls, delai) => (
    <div className={cls} style={{ ...carte, flex: '1 1 220px', padding: 16, textAlign: 'center', ...d(delai, 0) }}>
      <div style={{ fontSize: 46 }}>{p.emoji}</div>
      <strong style={{ display: 'block', fontSize: 18, margin: '6px 0' }}>{p.titre}</strong>
      <span style={{ fontSize: 15.5, lineHeight: 1.45, opacity: 0.92 }}>{p.texte}</span>
    </div>
  )
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'stretch', position: 'relative', maxWidth: 700, margin: '0 auto' }}>
        {panneau(s.gauche, 'l26-glisse-g', 0.3)}
        <span className="l26-pop" aria-hidden="true" style={{ alignSelf: 'center', fontSize: 26, fontWeight: 900, color: '#ffd166', ...d(1.1, 0) }}>⇄</span>
        {panneau(s.droite, 'l26-glisse-d', 0.7)}
      </div>
    </div>
  )
}

function SceneBalance({ s }) {
  const plateau = (p, i) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <strong style={{ display: 'block', textAlign: 'center', fontSize: 17, marginBottom: 8, color: i ? '#9be7c4' : '#ffd166' }}>{p.titre}</strong>
      {p.items.map((x, k) => <div key={k} className="l26-tombe" style={{ ...carte, padding: '7px 10px', marginBottom: 6, fontSize: 14.5, lineHeight: 1.35, ...d(0.9 + i * 0.4, k * 0.45) }}>{x}</div>)}
    </div>
  )
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', fontSize: 40, lineHeight: 1 }} aria-hidden="true">⚖️</div>
        <div className="l26-fleau" style={{ height: 6, borderRadius: 3, background: '#ffd166', margin: '6px 8% 14px', transformOrigin: 'center' }} />
        <div style={{ display: 'flex', gap: 12 }}>{plateau(s.gauche, 0)}{plateau(s.droite, 1)}</div>
      </div>
    </div>
  )
}

function SceneCitation({ s }) {
  const [fini, setFini] = useState(false)
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
      <div className="l26-pop" style={{ fontSize: 70, lineHeight: 0.6, color: '#ffd166', fontFamily: 'Georgia, serif' }} aria-hidden="true">“</div>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(18px, 4.4vw, 25px)', lineHeight: 1.55, margin: '10px 0 14px', minHeight: '3em' }}>
        <span className="l26-masque-lecteur">{s.texte}</span>
        <span aria-hidden="true"><MachineÀÉcrire texte={s.texte} vitesse={s.texte.length > 300 ? 12 : 24} onFini={() => setFini(true)} /></span>
      </p>
      <p style={{ opacity: fini ? 0.85 : 0, transition: 'opacity .8s', fontSize: 15 }}>— {s.source}</p>
    </div>
  )
}

function SceneScène({ s }) {
  // Chaque réplique arrive après la précédente (selon sa longueur).
  const délais = s.acteurs.reduce((l, a, i) => [...l, i ? l[i - 1] + 0.6 + Math.min(2.4, s.acteurs[i - 1].dit.length * 0.022) : 0.5], [])
  return (
    <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: '30% 0 auto', textAlign: 'center', fontSize: 'clamp(90px, 24vw, 160px)', opacity: 0.1, letterSpacing: 10, pointerEvents: 'none', filter: 'grayscale(.3)' }}><div className="l26-decor">{s.décor}</div></div>
      <Titre>🎭 {s.titre}</Titre>
      <div style={{ display: 'grid', gap: 12, position: 'relative' }}>
        {s.acteurs.map((a, i) => {
          const gauche = i % 2 === 0
          const moi = délais[i]
          return (
            <div key={i} className={gauche ? 'l26-entre-g' : 'l26-entre-d'} style={{ display: 'flex', flexDirection: gauche ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 10, ...d(moi, 0) }}>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 70 }}>
                <div className="l26-parle" style={{ fontSize: 44, lineHeight: 1, ...d(moi + 0.3, 0) }}>{a.emoji}</div>
                <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 2 }}>{a.nom}</div>
              </div>
              <div className="l26-bulle" style={{ background: gauche ? '#fff' : '#ffd166', color: '#1b1b1b', borderRadius: 16, [gauche ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 4, padding: '10px 14px', fontSize: 15.5, lineHeight: 1.45, maxWidth: 'min(480px, 75%)', boxShadow: '0 6px 20px rgba(0,0,0,.25)', ...d(moi + 0.25, 0) }}>{a.dit}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SceneFlux({ s }) {
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div className="l26-flux" style={{ maxWidth: 760, margin: '0 auto' }}>
        {s.étapes.map(([e, t], i) => [
          i > 0 && <div key={`f${i}`} className="l26-fleche" aria-hidden="true" style={d(0.3, i * 0.85 - 0.35)}>➜</div>,
          <div key={i} className="l26-zoom" style={{ ...carte, padding: '10px 12px', textAlign: 'center', ...d(0.3, i * 0.85) }}>
            <div style={{ fontSize: 30 }}>{e}</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.4, marginTop: 4 }}>{t}</div>
          </div>,
        ])}
      </div>
    </div>
  )
}

function SceneZoom({ s }) {
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div className="l26-zoom l26-halo" style={{ width: 150, height: 150, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(255,209,102,.35), rgba(255,209,102,.06))', border: '2px solid #ffd166', textAlign: 'center', padding: 12, boxSizing: 'border-box' }}>
          <div style={{ fontSize: 40 }}>{s.centre.emoji}</div>
          <strong style={{ fontSize: 14.5, lineHeight: 1.25 }}>{s.centre.texte}</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8, width: '100%', maxWidth: 700 }}>
          {s.autour.map(([e, t], i) => (
            <div key={i} className="l26-orbite" style={{ ...carte, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'center', ...d(0.6, i * 0.55) }}>
              <span style={{ fontSize: 24 }}>{e}</span><span style={{ fontSize: 14.5, lineHeight: 1.35 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const chemin = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${px(p).map(v => v.toFixed(1)).join(',')}`).join(' ') + 'Z'
function SceneCarte({ s }) {
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'center' }}>
        <svg viewBox={`-20 -20 ${L + 40} ${H + 40}`} style={{ width: 'min(100%, 380px)', height: 'auto' }} role="img" aria-label={`Carte : ${s.lieux.map(l => l[0]).join(', ')}`}>
          <path d={chemin(CONTOUR)} fill="rgba(255,255,255,.1)" stroke="#9db4ff" strokeWidth="2.5" className="l26-trace-carte" />
          <path d={chemin(CORSE)} fill="rgba(255,255,255,.1)" stroke="#9db4ff" strokeWidth="2.5" className="l26-trace-carte" />
          {s.lieux.map(([, lat, lon, e], i) => {
            const [x, y] = px([lat, lon])
            return (
              <g key={i} className="l26-pop" style={{ ...d(0.8, i * 0.6), transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}>
                <circle cx={x} cy={y} r="22" fill="#ffd166" opacity=".25" className="l26-onde" style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }} />
                <circle cx={x} cy={y} r="7" fill="#ffd166" />
                <text x={x} y={y - 14} textAnchor="middle" fontSize="26">{e}</text>
              </g>
            )
          })}
        </svg>
        <div style={{ display: 'grid', gap: 6, minWidth: 160 }}>
          {s.lieux.map(([nom, , , e], i) => <div key={i} className="l26-glisse-d" style={{ ...carte, padding: '6px 10px', fontSize: 15, ...d(0.8, i * 0.6) }}>{e} {nom}</div>)}
        </div>
      </div>
    </div>
  )
}

const COULEURS = ['#ffd166', '#9be7c4', '#a5c8ff', '#ffadad', '#e4c1f9', '#fdffb6']
function SceneNuage({ s }) {
  return (
    <div>
      <Titre>{s.titre}</Titre>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px 18px', maxWidth: 680, margin: '0 auto', padding: '10px 0' }}>
        {s.mots.map((m, i) => (
          <span key={i} className="l26-flotte" style={{ fontSize: `${17 + ((i * 7) % 4) * 5}px`, fontWeight: 800, color: COULEURS[i % COULEURS.length], ...d(0.3, i * 0.35), '--l26-flotte': `${(i % 3) + 3}s` }}>{m}</span>
        ))}
      </div>
    </div>
  )
}

function SceneDevinette({ s, onRépondu }) {
  const [vu, setVu] = useState(false)
  const [indice, setIndice] = useState(false)
  return (
    <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
      <div className="l26-rebond" style={{ fontSize: 60 }}>🤔</div>
      <Titre>{s.question}</Titre>
      {!vu && s.indice && !indice && <button onClick={() => setIndice(true)} className="l26-bouton-clair">💡 Un indice</button>}
      {indice && !vu && <p className="l26-apparait" style={{ fontSize: 15.5, opacity: 0.9 }}>💡 {s.indice}</p>}
      {!vu
        ? <div><button onClick={() => { setVu(true); onRépondu?.() }} className="l26-bouton" style={{ marginTop: 10 }}>Voir la réponse</button></div>
        : <div className="l26-retourne" style={{ ...carte, padding: 16, marginTop: 12, fontSize: 17, lineHeight: 1.5, background: 'rgba(155,231,196,.16)', borderColor: '#9be7c4' }}>✅ {s.réponse}</div>}
    </div>
  )
}

function SceneVraiFaux({ s, onRépondu }) {
  const [rép, setRép] = useState({})
  const répondre = (i, v) => setRép(r => { const x = { ...r, [i]: v }; if (Object.keys(x).length === s.affirmations.length) onRépondu?.(s.affirmations.filter((a, k) => a[1] === x[k]).length, s.affirmations.length); return x })
  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      <Titre>✅ Vrai ou faux ?</Titre>
      <div style={{ display: 'grid', gap: 10 }}>
        {s.affirmations.map(([texte, vrai, expl], i) => {
          const r = rép[i]
          const juste = r !== undefined && r === vrai
          return (
            <div key={i} className={`l26-apparait ${r !== undefined ? (juste ? 'l26-juste' : 'l26-faux') : ''}`} style={{ ...carte, padding: 14, ...d(0.2, i * 0.3), ...(r !== undefined ? { borderColor: juste ? '#9be7c4' : '#ff8fa3', background: juste ? 'rgba(155,231,196,.14)' : 'rgba(255,143,163,.14)' } : {}) }}>
              <p style={{ margin: '0 0 10px', fontSize: 16.5, lineHeight: 1.45 }}>{texte}</p>
              {r === undefined
                ? <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => répondre(i, true)} className="l26-bouton" style={{ flex: 1 }}>Vrai</button>
                    <button onClick={() => répondre(i, false)} className="l26-bouton" style={{ flex: 1, background: '#ef476f', color: '#fff' }}>Faux</button>
                  </div>
                : <p role="status" style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}><strong>{juste ? '🎉 Bien vu !' : `😬 C'était ${vrai ? 'vrai' : 'faux'}.`}</strong> {expl}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RENDUS = { titre: SceneTitre, points: ScenePoints, chiffres: SceneChiffres, frise: SceneFrise, duo: SceneDuo, balance: SceneBalance, citation: SceneCitation, scène: SceneScène, flux: SceneFlux, zoom: SceneZoom, carte: SceneCarte, nuage: SceneNuage, devinette: SceneDevinette, vraiFaux: SceneVraiFaux }

export default function Scene({ s, onRépondu }) {
  const R = RENDUS[s.type]
  return R ? <R s={s} onRépondu={onRépondu} /> : null
}
