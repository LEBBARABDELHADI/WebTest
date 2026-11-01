import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import Dictée from '../components/Dictee'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { CHAPITRES, SOURCE_LIVRET } from '../lib/coursLivret'
import { PAGES_LIVRET } from '../lib/pagesLivret'
import { LIEUX } from '../lib/paquetsPrets'
import { CONTOUR, CORSE, px, L as LC, H as HC } from '../lib/carteFrance'
import { vérifierMotsClés } from '../lib/motsCles'
import { lireTexte } from '../lib/texteFormate'
import { modifierOutil } from '../lib/donneesFoyer'

// Cours animé du Livret du citoyen : par chapitre, 1. cours en diapositives
// animées, 2. révision (mots à retrouver), 3. questions ouvertes, 4. QCM.
// Puis un examen final. Progression gardée sur l'appareil.

const CLÉ = 'react-blocs-cours-livret'
const lireProgrès = () => { try { return JSON.parse(localStorage.getItem(CLÉ) || '{}') } catch { return {} } }
const mélanger = t => { const c = [...t]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] } return c }
const gras = t => t.split(/(\*\*[^*]+\*\*)/g).map((m, i) => (m.startsWith('**') ? <strong key={i}>{m.slice(2, -2)}</strong> : m))
const sansGras = t => t.replace(/\*\*/g, '')
const ÉTAPES = [['cours', '🎬 Cours'], ['révision', '🔁 Révision'], ['ouvertes', '✍️ Questions'], ['qcm', '✅ QCM']]

const ANIMATIONS = `
@keyframes cl-monte { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
@keyframes cl-gauche { from { opacity: 0; transform: translateX(-40px) } to { opacity: 1; transform: none } }
@keyframes cl-droite { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: none } }
@keyframes cl-pop { 0% { opacity: 0; transform: scale(.3) } 70% { transform: scale(1.12) } 100% { opacity: 1; transform: scale(1) } }
@keyframes cl-bande { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes cl-ligne { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes cl-trait { from { stroke-dashoffset: var(--long) } to { stroke-dashoffset: 0 } }
@keyframes cl-carte { from { opacity: 0; transform: rotateY(90deg) } to { opacity: 1; transform: none } }
@keyframes cl-flotte { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
.cl-a { animation: cl-monte .6s cubic-bezier(.2,.8,.2,1) both }
.cl-g { animation: cl-gauche .7s cubic-bezier(.2,.8,.2,1) both }
.cl-d { animation: cl-droite .7s cubic-bezier(.2,.8,.2,1) both }
.cl-p { animation: cl-pop .6s cubic-bezier(.2,.8,.2,1) both }
.cl-c { animation: cl-carte .7s ease both; transform-origin: left center }
.cl-f { animation: cl-flotte 3s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) { .cl-a, .cl-g, .cl-d, .cl-p, .cl-c, .cl-f, [data-anim] { animation: none !important } }
`
const retard = s => ({ animationDelay: `${s}s` })

// Nombre qui compte jusqu'à sa valeur.
function Compteur({ valeur, délai = 0 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let id, début
    const t = setTimeout(() => {
      const pas = ts => { if (!début) début = ts; const p = Math.min(1, (ts - début) / 1200); setN(Math.round(valeur * (1 - (1 - p) ** 3))); if (p < 1) id = requestAnimationFrame(pas) }
      id = requestAnimationFrame(pas)
    }, délai * 1000)
    return () => { clearTimeout(t); cancelAnimationFrame(id) }
  }, [valeur, délai])
  return n.toLocaleString('fr-FR')
}

// Texte lu à voix haute pour une diapositive.
function texteDiapo(d) {
  if (d.type === 'titre') return `${d.titre}. ${d.texte}`
  if (d.type === 'points') return `${d.titre}. ${d.points.map(p => p[1]).join('. ')}`
  if (d.type === 'devise') return 'La devise de la République : Liberté, Égalité, Fraternité.'
  if (d.type === 'frise') return `${d.titre}. ${d.étapes.map(e => `${e[0]} : ${e[1]}`).join('. ')}`
  if (d.type === 'question') return `${d.titre} ${d.réponse}`
  if (d.type === 'duo') return `${d.titre}. ${d.gauche.titre} : ${d.gauche.texte} ${d.droite.titre} : ${d.droite.texte}`
  if (d.type === 'chiffres') return `${d.titre}. ${d.chiffres.map(c => `${c[0]}${c[1]} : ${c[2]}`).join('. ')}`
  if (d.type === 'schéma') return 'Les citoyens élisent le Parlement, le Président de la République et les élus locaux. Le Président nomme le Premier ministre et le Gouvernement. Le Parlement vote les lois et contrôle le Gouvernement. Les élus locaux élisent les sénateurs.'
  if (d.type === 'personnes') return `${d.titre}. ${d.personnes.map(p => `${p[1]} : ${p[2]}`).join('. ')}`
  if (d.type === 'carte') return `${d.titre} : ${d.villes.join(', ')}.`
  if (d.type === 'article') return `Article ${d.numéro}. ${d.texte}`
  if (d.type === 'nuage') return `${d.titre} : ${d.mots.join(', ')}.`
  if (d.type === 'vraiFaux') return `Vrai ou faux ? ${d.affirmations.map(a => a[0]).join(' ')}`
  return ''
}

function Diapo({ T, d }) {
  const [vue, setVue] = useState(false)
  const [réponses, setRéponses] = useState({})
  const carte = { background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }
  const h = <h2 className="cl-a" style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(22px, 5vw, 30px)', margin: '0 0 16px', color: T.text, lineHeight: 1.15 }}>{d.titre}</h2>
  if (d.type === 'titre') return (
    <div style={{ textAlign: 'center', paddingTop: 10 }}>
      <div className="cl-p" style={{ fontSize: 72, lineHeight: 1 }}><span className="cl-f" style={{ display: 'inline-block' }}>{d.emoji}</span></div>
      <h2 className="cl-a" style={{ ...retard(0.4), fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(24px, 6vw, 34px)', margin: '18px 0 12px', color: T.text }}>{d.titre}</h2>
      <p className="cl-a" style={{ ...retard(0.9), fontSize: 17, lineHeight: 1.55, color: T.text, maxWidth: 520, margin: '0 auto' }}>{d.texte}</p>
    </div>
  )
  if (d.type === 'points') return (
    <div>{h}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {d.points.map(([e, t], i) => (
          <div key={i} className="cl-g" style={{ ...retard(0.4 + i * 0.7), ...carte, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="cl-p" style={{ ...retard(0.6 + i * 0.7), fontSize: 26, lineHeight: 1.1 }}>{e}</span>
            <span style={{ fontSize: 16, lineHeight: 1.5, color: T.text }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
  if (d.type === 'devise') return (
    <div style={{ textAlign: 'center' }}>
      <h2 className="cl-a" style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 28, margin: '0 0 18px', color: T.text }}>La devise de la République</h2>
      <div style={{ display: 'flex', height: 170, borderRadius: 12, overflow: 'hidden', maxWidth: 420, margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>
        {[['#0055a4', 'Liberté'], ['#ffffff', 'Égalité'], ['#ef4135', 'Fraternité']].map(([c, mot], i) => (
          <div key={mot} data-anim style={{ flex: 1, background: c, transformOrigin: 'top', animation: `cl-bande .6s ${0.3 + i * 0.5}s cubic-bezier(.2,.8,.2,1) both`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14 }}>
            <span className="cl-p" style={{ ...retard(1 + i * 0.6), fontFamily: grotesk, fontWeight: 800, fontSize: 'clamp(13px, 3.6vw, 18px)', color: i === 1 ? '#1b1b1b' : '#fff' }}>{mot}</span>
          </div>
        ))}
      </div>
      <p className="cl-a" style={{ ...retard(2.8), fontSize: 16, color: T.text, marginTop: 18 }}>Ces trois mots forment la devise. Le drapeau bleu, blanc, rouge date de la Révolution.</p>
    </div>
  )
  if (d.type === 'frise') return (
    <div>{h}
      <div style={{ position: 'relative', paddingLeft: 30 }}>
        <div data-anim style={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 4, borderRadius: 2, background: T.accent, transformOrigin: 'top', animation: `cl-ligne ${0.6 + d.étapes.length * 0.6}s .2s linear both` }} />
        {d.étapes.map(([date, texte, e], i) => (
          <div key={i} className="cl-d" style={{ ...retard(0.5 + i * 0.6), position: 'relative', marginBottom: 12 }}>
            <span className="cl-p" style={{ ...retard(0.4 + i * 0.6), position: 'absolute', left: -30, top: 6, width: 26, height: 26, borderRadius: '50%', background: T.surface, border: `3px solid ${T.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{e}</span>
            <div style={{ ...carte, marginLeft: 6 }}>
              <strong style={{ fontFamily: grotesk, color: T.accent, fontSize: 15 }}>{date}</strong>
              <div style={{ fontSize: 15.5, lineHeight: 1.45, color: T.text }}>{texte}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  if (d.type === 'question') return (
    <div>
      <div className="cl-p" style={{ fontSize: 48, textAlign: 'center' }}>❓</div>
      <h2 className="cl-a" style={{ ...retard(0.3), fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 26px)', textAlign: 'center', color: T.text, margin: '10px 0 18px' }}>{d.titre}</h2>
      {vue
        ? <div className="cl-c" style={{ ...carte, fontSize: 16.5, lineHeight: 1.55, color: T.text, borderLeft: `5px solid ${T.accent}` }}>{d.réponse}</div>
        : <div style={{ textAlign: 'center' }}><button className="cl-a" onClick={() => setVue(true)} style={{ ...retard(0.8), minHeight: 46, padding: '0 20px', borderRadius: 23, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Voir la réponse</button><p className="cl-a" style={{ ...retard(1), fontSize: 13, color: T.textMuted }}>Réfléchis d'abord quelques secondes 🙂</p></div>}
    </div>
  )
  if (d.type === 'duo') return (
    <div>{h}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
        {[d.gauche, d.droite].map((c, i) => (
          <div key={i} className={i ? 'cl-d' : 'cl-g'} style={{ ...retard(0.4 + i * 0.8), ...carte, textAlign: 'center', padding: 18 }}>
            <div className="cl-p" style={{ ...retard(0.7 + i * 0.8), fontSize: 44 }}>{c.emoji}</div>
            <strong style={{ display: 'block', fontFamily: grotesk, fontSize: 17, margin: '8px 0 6px', color: T.text }}>{c.titre}</strong>
            <span style={{ fontSize: 15.5, lineHeight: 1.5, color: T.text }}>{c.texte}</span>
          </div>
        ))}
      </div>
    </div>
  )
  if (d.type === 'chiffres') return (
    <div>{h}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
        {d.chiffres.map(([v, suffixe, libellé], i) => (
          <div key={i} className="cl-p" style={{ ...retard(0.3 + i * 0.5), ...carte, textAlign: 'center', padding: 18 }}>
            <div style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 'clamp(30px, 8vw, 42px)', color: T.accent, fontVariantNumeric: 'tabular-nums' }}><Compteur valeur={v} délai={0.3 + i * 0.5} />{suffixe}</div>
            <div style={{ fontSize: 15, color: T.text }}>{libellé}</div>
          </div>
        ))}
      </div>
    </div>
  )
  if (d.type === 'schéma') {
    const boîte = (x, y, l, hb, titre, sous, couleur, i) => (
      <g key={titre} className="cl-p" style={{ ...retard(0.3 + i * 0.5), transformOrigin: `${x + l / 2}px ${y + hb / 2}px`, transformBox: 'view-box' }}>
        <rect x={x} y={y} width={l} height={hb} rx="12" fill={couleur} stroke={T.border} />
        <text x={x + l / 2} y={y + 26} textAnchor="middle" fontSize="17" fontWeight="700" fill="#1b1b1b">{titre}</text>
        {sous && <text x={x + l / 2} y={y + 48} textAnchor="middle" fontSize="13" fill="#444">{sous}</text>}
      </g>
    )
    const flèche = (x1, y1, x2, y2, texte, i) => {
      const long = Math.hypot(x2 - x1, y2 - y1)
      return (
        <g key={`${x1}-${y1}-${texte}`}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.accent} strokeWidth="3" markerEnd="url(#cl-pointe)" strokeDasharray={long} style={{ '--long': long, strokeDashoffset: long, animation: `cl-trait .7s ${0.5 + i * 0.5}s ease both` }} />
          <text className="cl-a" style={retard(0.8 + i * 0.5)} x={(x1 + x2) / 2 + 8} y={(y1 + y2) / 2} fontSize="13" fill={T.text}>{texte}</text>
        </g>
      )
    }
    return (
      <div>
        <h2 className="cl-a" style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(22px, 5vw, 30px)', margin: '0 0 10px', color: T.text }}>Qui élit qui ?</h2>
        <svg viewBox="0 0 600 420" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Schéma des institutions">
          <defs><marker id="cl-pointe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill={T.accent} /></marker></defs>
          {boîte(170, 10, 260, 60, 'Citoyens', 'Français de plus de 18 ans', '#dbe7f7', 0)}
          {flèche(200, 72, 95, 158, 'élisent', 1)}
          {flèche(300, 72, 300, 158, 'élisent', 2)}
          {flèche(400, 72, 505, 158, 'élisent', 3)}
          {boîte(5, 160, 180, 80, 'Élus locaux', 'élus pour 6 ans', '#f0f0ea', 4)}
          {boîte(210, 160, 180, 80, 'Parlement', 'Assemblée + Sénat', '#fff3c4', 5)}
          {boîte(415, 160, 180, 80, 'Président', 'élu pour 5 ans', '#fde2e1', 6)}
          {flèche(505, 242, 505, 318, 'nomme', 7)}
          {boîte(400, 320, 195, 80, 'Gouvernement', 'dirigé par le 1er ministre', '#fde2e1', 8)}
          {flèche(330, 242, 398, 330, 'contrôle', 9)}
          <path d="M95 242 V300 H250 V246" fill="none" stroke={T.accent} strokeWidth="3" markerEnd="url(#cl-pointe)" strokeDasharray="330" style={{ '--long': 330, strokeDashoffset: 330, animation: 'cl-trait .9s 5.5s ease both' }} />
          <text className="cl-a" style={retard(5.9)} x="102" y="322" fontSize="13" fill={T.text}>élisent les sénateurs</text>
        </svg>
        <p className="cl-a" style={{ ...retard(6.2), fontSize: 15, color: T.text, margin: '6px 0 0' }}>Le Parlement <strong>vote les lois</strong> au nom du peuple ; le Gouvernement <strong>conduit la politique</strong> de la nation.</p>
      </div>
    )
  }
  if (d.type === 'personnes') return (
    <div>{h}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10 }}>
        {d.personnes.map(([e, nom, texte], i) => (
          <div key={nom} className="cl-c" style={{ ...retard(0.3 + i * 0.45), ...carte, display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 30 }}>{e}</span>
            <span><strong style={{ fontFamily: grotesk, color: T.text }}>{nom}</strong><br /><span style={{ fontSize: 14, color: T.text, lineHeight: 1.4 }}>{texte}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
  if (d.type === 'carte') {
    const villes = d.villes.map(n => LIEUX.find(l => l.nom === n)).filter(Boolean)
    const tour = CONTOUR.map(p => px(p).join(',')).join(' ')
    return (
      <div>{h}
        <svg viewBox={`0 0 ${LC} ${HC}`} style={{ width: '100%', maxWidth: 520, height: 'auto', display: 'block', margin: '0 auto', background: '#bfe0f5', borderRadius: 12 }} role="img" aria-label="Carte des grandes villes">
          <polygon points={tour} fill="#f4efe1" stroke="#7a6f58" strokeWidth="2" strokeDasharray="4000" style={{ '--long': 4000, animation: 'cl-trait 2s ease both' }} />
          <polygon points={CORSE.map(p => px(p).join(',')).join(' ')} fill="#f4efe1" stroke="#7a6f58" strokeWidth="2" />
          {villes.map((v, i) => {
            const [x, y] = px([v.lat, v.lon])
            return (
              <g key={v.nom} className="cl-p" style={{ ...retard(1.2 + i * 0.45), transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}>
                <circle cx={x} cy={y} r={i < 3 ? 11 : 8} fill="#d33" stroke="#fff" strokeWidth="3" />
                <text x={x > LC * 0.72 ? x - 13 : x + 13} y={y + 6} textAnchor={x > LC * 0.72 ? 'end' : 'start'} fontSize="21" fontWeight="700" fill="#1b1b1b" stroke="#fff" strokeWidth="5" paintOrder="stroke">{i + 1}. {v.nom}</text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }
  if (d.type === 'nuage') return (
    <div>{h}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center', padding: '10px 0' }}>
        {d.mots.map((m, i) => (
          <span key={m} className="cl-p" style={{ ...retard(0.4 + i * 0.45), display: 'inline-block' }}>
            <span className="cl-f" style={{ display: 'inline-block', animationDelay: `${i * 0.4}s`, padding: '10px 16px', borderRadius: 999, background: [T.accent, '#1f4fa3', '#2e9e6b', '#c2185b', '#8e24aa'][i % 5], color: '#fff', fontFamily: grotesk, fontWeight: 700, fontSize: [20, 16, 18, 15, 17][i % 5], boxShadow: '0 6px 16px rgba(0,0,0,.15)' }}>{m}</span>
          </span>
        ))}
      </div>
    </div>
  )
  if (d.type === 'vraiFaux') {
    const justes = d.affirmations.filter((a, k) => réponses[k] !== undefined && réponses[k] === a[1]).length
    const faites = Object.keys(réponses).length
    return (
      <div>{h}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.affirmations.map(([texte, vrai, explication], k) => {
            const r = réponses[k], répondu = r !== undefined, juste = r === vrai
            return (
              <div key={k} className="cl-g" style={{ ...retard(0.3 + k * 0.4), ...carte, borderColor: répondu ? (juste ? '#2e9e6b' : T.danger) : T.border }}>
                <p style={{ margin: '0 0 8px', fontSize: 16.5, lineHeight: 1.45, color: T.text }}>{texte}</p>
                {!répondu ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[[true, '✓ Vrai'], [false, '✗ Faux']].map(([v, l]) => (
                      <button key={l} onClick={() => setRéponses(x => ({ ...x, [k]: v }))} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                ) : (
                  <p className="cl-p" style={{ margin: 0, fontSize: 15, color: juste ? '#2e9e6b' : T.danger, fontFamily: grotesk, fontWeight: 700 }}>
                    {juste ? '🎉 Bonne réponse' : '❌ Pas tout à fait'} : c'est {vrai ? 'vrai' : 'faux'}.{explication && <span style={{ display: 'block', fontFamily: 'inherit', fontWeight: 400, color: T.text, marginTop: 4 }}>{explication}</span>}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        {faites === d.affirmations.length && <p className="cl-p" style={{ textAlign: 'center', fontFamily: grotesk, fontWeight: 800, fontSize: 20, margin: '14px 0 0', color: justes === faites ? '#2e9e6b' : T.text }}>{justes === faites ? '🏆' : '👍'} {justes}/{faites}</p>}
      </div>
    )
  }
  if (d.type === 'article') {
    const mots = d.texte.split(' ')
    return (
      <div style={{ textAlign: 'center', paddingTop: 6 }}>
        <div className="cl-p" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 12, border: `3px solid ${T.accent}`, color: T.accent, fontFamily: grotesk, fontWeight: 800, fontSize: 30, transform: 'rotate(-3deg)' }}>Article {d.numéro}</div>
        <p style={{ fontFamily: serif, fontSize: 'clamp(20px, 5vw, 26px)', lineHeight: 1.5, color: T.text, margin: '22px auto 0', maxWidth: 560 }}>
          {mots.map((m, i) => <span key={i} className="cl-a" style={{ ...retard(0.5 + i * 0.12), display: 'inline-block', marginRight: '0.28em' }}>{m}</span>)}
        </p>
        <p className="cl-a" style={{ ...retard(0.8 + mots.length * 0.12), fontSize: 13, color: T.textMuted, marginTop: 14 }}>Déclaration des droits de l'homme et du citoyen, 1789</p>
      </div>
    )
  }
  return null
}

// ---------- 1. Cours ----------
function Cours({ T, chap, onFini, libelléFin = 'Passer à la révision →' }) {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(false)
  const départ = useRef(null)
  const n = chap.diapos.length
  const aller = k => { window.speechSynthesis?.cancel(); setI(Math.max(0, Math.min(n - 1, k))) }
  useEffect(() => {
    if (!auto) return
    lireTexte(texteDiapo(chap.diapos[i]))
    const t = setTimeout(() => { if (i < n - 1) setI(i + 1); else { setAuto(false); onFini() } }, Math.max(7000, texteDiapo(chap.diapos[i]).length * 75))
    return () => clearTimeout(t)
  }, [auto, i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  useEffect(() => {
    const f = e => { if (e.key === 'ArrowRight') aller(i + 1); if (e.key === 'ArrowLeft') aller(i - 1) }
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f)
  })
  const bouton = (actif = false) => ({ minHeight: 44, padding: '0 14px', borderRadius: 22, border: `1px solid ${actif ? T.accent : T.border}`, background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 14, cursor: 'pointer' })
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }} aria-label={`Diapositive ${i + 1} sur ${n}`}>
        {chap.diapos.map((_, k) => <button key={k} onClick={() => aller(k)} aria-label={`Diapositive ${k + 1}`} style={{ flex: 1, height: 6, minHeight: 6, padding: 0, borderRadius: 3, border: 'none', background: k <= i ? T.accent : T.surface2, cursor: 'pointer' }} />)}
      </div>
      <div onPointerDown={e => { départ.current = e.clientX }} onPointerUp={e => { if (départ.current !== null && Math.abs(e.clientX - départ.current) > 60) aller(i + (e.clientX < départ.current ? 1 : -1)); départ.current = null }}
        style={{ minHeight: 360, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 'clamp(16px, 4vw, 28px)', overflow: 'hidden', touchAction: 'pan-y' }}>
        <Diapo key={`${chap.id}-${i}`} T={T} d={chap.diapos[i]} />
      </div>
      {i === n - 1 && chap.note && <p className="cl-a" style={{ ...retard(1), fontSize: 13, color: '#b07400', margin: '10px 2px 0' }}>📅 Mise à jour : {chap.note}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => aller(i - 1)} disabled={i === 0} style={{ ...bouton(), opacity: i === 0 ? 0.4 : 1 }} aria-label="Précédente">◀</button>
        <button onClick={() => lireTexte(texteDiapo(chap.diapos[i]))} style={bouton()}>🔊 Écouter</button>
        <button onClick={() => setAuto(a => !a)} style={bouton(auto)} aria-pressed={auto}>{auto ? '⏸ Pause' : '▶ Lecture auto'}</button>
        <span style={{ flex: 1 }} />
        {i < n - 1
          ? <button onClick={() => aller(i + 1)} style={bouton(true)}>Suivante ▶</button>
          : <button onClick={onFini} style={bouton(true)}>{libelléFin}</button>}
      </div>
    </div>
  )
}

// ---------- 2. Révision : mots cachés ----------
function Révision({ T, chap, onFini }) {
  const phrases = chap.révision.map(p => p.split(/(\[\[[^\]]+\]\])/g))
  const total = phrases.flat().filter(m => m.startsWith('[[')).length
  const [vus, setVus] = useState(() => new Set())
  const basculer = k => setVus(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })
  let k = 0
  return (
    <div>
      <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>Retrouve chaque mot caché de mémoire, puis touche-le pour vérifier. ({vus.size}/{total} révélés)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {phrases.map((morceaux, i) => (
          <p key={i} className="cl-a" style={{ ...retard(i * 0.15), margin: 0, padding: '12px 14px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, fontSize: 17, lineHeight: 1.9, color: T.text }}>
            {morceaux.map((m, j) => {
              if (!m.startsWith('[[')) return <span key={j}>{m}</span>
              const id = k++, mot = m.slice(2, -2), vu = vus.has(id)
              return (
                <button key={j} onClick={() => basculer(id)} aria-label={vu ? mot : 'Mot caché : toucher pour révéler'}
                  style={{ display: 'inline-block', minWidth: 70, minHeight: 32, margin: '0 2px', padding: '0 8px', borderRadius: 8, border: `2px ${vu ? 'solid' : 'dashed'} ${T.accent}`, background: vu ? `${T.accent}22` : T.surface2, color: vu ? T.accent : 'transparent', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', animation: vu ? 'cl-pop .35s both' : 'none' }}>
                  {vu ? mot : mot.replace(/\S/g, '•')}
                </button>
              )
            })}
          </p>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={() => setVus(vus.size === total ? new Set() : new Set(Array.from({ length: total }, (_, i) => i)))} style={{ minHeight: 44, padding: '0 16px', borderRadius: 22, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: grotesk, fontWeight: 700, cursor: 'pointer' }}>{vus.size === total ? '🙈 Tout cacher' : '👀 Tout révéler'}</button>
        <span style={{ flex: 1 }} />
        <button onClick={onFini} style={{ minHeight: 44, padding: '0 18px', borderRadius: 22, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, cursor: 'pointer' }}>Questions ouvertes →</button>
      </div>
    </div>
  )
}

// ---------- 3. Questions ouvertes ----------
function QuestionOuverte({ T, item, index, onRésultat }) {
  const [saisie, setSaisie] = useState('')
  const [résultat, setRésultat] = useState(null)
  const champ = useRef(null)
  const vérifier = () => { const r = vérifierMotsClés(item.réponse, saisie); setRésultat(r); onRésultat(r.length ? r.filter(x => x.trouvé).length / r.length : 0) }
  const taux = résultat && résultat.length ? résultat.filter(x => x.trouvé).length / résultat.length : 0
  return (
    <div className="cl-a" style={{ ...retard(index * 0.15), background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
      <p style={{ margin: '0 0 8px', fontFamily: grotesk, fontWeight: 700, fontSize: 16, color: T.text }}>{index + 1}. {item.question}</p>
      <textarea ref={champ} value={saisie} onChange={e => setSaisie(e.target.value)} rows={3} placeholder="Réponds avec tes mots, à l'écrit ou à la voix…" aria-label={`Réponse à la question ${index + 1}`}
        style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, padding: 10, fontSize: 15.5, fontFamily: 'inherit', resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
        <Dictée T={T} obtenirInput={() => champ.current} setValeur={setSaisie} />
        <span style={{ flex: 1 }} />
        <button onClick={vérifier} disabled={!saisie.trim()} style={{ minHeight: 40, padding: '0 16px', borderRadius: 20, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, cursor: saisie.trim() ? 'pointer' : 'default', opacity: saisie.trim() ? 1 : 0.5 }}>Vérifier</button>
        {!résultat && <button onClick={() => { setRésultat([]); onRésultat(0) }} style={{ minHeight: 40, padding: '0 12px', borderRadius: 20, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontFamily: grotesk, cursor: 'pointer' }}>Je ne sais pas</button>}
      </div>
      {résultat && (
        <div className="cl-c" style={{ marginTop: 10, padding: 12, borderRadius: 10, background: T.surface2 }}>
          {résultat.length > 0 && (
            <>
              <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 700, color: taux >= 0.7 ? '#2e9e6b' : taux >= 0.4 ? '#c98a00' : T.danger }}>{taux >= 0.7 ? '🎉 Très bien' : taux >= 0.4 ? '👍 Presque' : '📖 À revoir'} : {résultat.filter(x => x.trouvé).length}/{résultat.length} mots-clés</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {résultat.map(r => <span key={r.motClé} style={{ fontSize: 13, padding: '3px 9px', borderRadius: 12, background: r.trouvé ? '#2e9e6b22' : T.dangerSoft, color: r.trouvé ? '#1f7a50' : T.danger }}>{r.trouvé ? '✓' : '✗'} {r.motClé}</span>)}
              </div>
            </>
          )}
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: T.text }}><strong>Réponse : </strong>{gras(item.réponse)}</p>
        </div>
      )}
    </div>
  )
}
function Ouvertes({ T, chap, onFini }) {
  const [scores, setScores] = useState({})
  const faites = Object.keys(scores).length
  return (
    <div>
      <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>Comme à l'entretien : réponds avec une phrase complète. 🎤 pour répondre à voix haute. L'app vérifie les mots-clés.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chap.ouvertes.map((item, i) => <QuestionOuverte key={i} T={T} item={item} index={i} onRésultat={s => setScores(x => ({ ...x, [i]: s }))} />)}
      </div>
      <div style={{ display: 'flex', marginTop: 14 }}>
        <span style={{ flex: 1, fontSize: 14, color: T.textMuted, alignSelf: 'center' }}>{faites}/{chap.ouvertes.length} répondues</span>
        <button onClick={() => onFini(faites ? Object.values(scores).reduce((a, b) => a + b, 0) / chap.ouvertes.length : 0)} style={{ minHeight: 44, padding: '0 18px', borderRadius: 22, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, cursor: 'pointer' }}>QCM →</button>
      </div>
    </div>
  )
}

// ---------- 4. QCM (et examen final) ----------
function QCM({ T, questions, titre, minutes = 0, onFini }) {
  const liste = useMemo(() => questions.map(x => ({ ...x, options: mélanger([x.bonne, ...x.fausses]) })), [questions])
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState(null)
  const [bonnes, setBonnes] = useState(0)
  const [erreurs, setErreurs] = useState([])
  const [fin, setFin] = useState(false)
  const [reste, setReste] = useState(minutes * 60)
  useEffect(() => {
    if (!minutes || fin) return
    const t = setInterval(() => setReste(r => { if (r <= 1) { clearInterval(t); setFin(true); return 0 } return r - 1 }), 1000)
    return () => clearInterval(t)
  }, [minutes, fin])
  useEffect(() => { if (fin) onFini(bonnes / liste.length) }, [fin]) // eslint-disable-line react-hooks/exhaustive-deps
  const x = liste[i]
  const répondre = o => { if (choix) return; setChoix(o); if (o === x.bonne) setBonnes(b => b + 1); else setErreurs(e => [...e, x]) }
  const suivant = () => { if (i + 1 >= liste.length) setFin(true); else { setI(i + 1); setChoix(null) } }
  if (fin) {
    const p = Math.round((bonnes / liste.length) * 100)
    return (
      <div style={{ textAlign: 'center' }}>
        <div className="cl-p" style={{ fontSize: 60 }}>{p >= 80 ? '🏆' : p >= 50 ? '👍' : '📖'}</div>
        <p className="cl-a" style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 40, margin: '6px 0', color: p >= 80 ? '#2e9e6b' : p >= 50 ? '#c98a00' : T.danger }}>{bonnes}/{liste.length}</p>
        <p className="cl-a" style={{ ...retard(0.3), color: T.textMuted, margin: '0 0 14px' }}>{titre} · {p >= 80 ? 'objectif 80 % atteint 🎉' : 'objectif : 80 %'}</p>
        {erreurs.length > 0 && (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {erreurs.map(e => (
              <div key={e.question} className="cl-a" style={{ padding: '10px 12px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontSize: 14.5, color: T.text }}>
                <strong>{e.question}</strong><br /><span style={{ color: '#2e9e6b' }}>✓ {e.bonne}</span>{e.explication && <><br /><span style={{ color: T.textMuted }}>{e.explication}</span></>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontFamily: grotesk, fontSize: 14, color: T.textMuted }}>
        <span>Question {i + 1}/{liste.length}</span>
        <span style={{ flex: 1, height: 6, borderRadius: 3, background: T.surface2, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${(i / liste.length) * 100}%`, background: T.accent, transition: 'width .3s' }} /></span>
        {minutes > 0 && <strong aria-label="Temps restant" style={{ color: reste < 60 ? T.danger : T.text }}>⏱ {Math.floor(reste / 60)}:{String(reste % 60).padStart(2, '0')}</strong>}
        <span>✓ {bonnes}</span>
      </div>
      <div key={i} className="cl-a" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
        {x.chapitre && <p style={{ margin: '0 0 6px', fontSize: 12.5, color: T.accent, fontFamily: grotesk, fontWeight: 700 }}>{x.chapitre}</p>}
        <p style={{ margin: 0, fontFamily: serif, fontSize: 20, lineHeight: 1.4, color: T.text }}>{x.question}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {x.options.map((o, k) => {
          const bon = choix && o === x.bonne, faux = choix === o && o !== x.bonne
          return (
            <button key={o} className="cl-d" onClick={() => répondre(o)} style={{ ...retard(k * 0.08), display: 'flex', gap: 10, textAlign: 'left', minHeight: 52, padding: '12px 14px', borderRadius: 12, fontSize: 16, cursor: choix ? 'default' : 'pointer', fontFamily: 'inherit', color: T.text, background: bon ? '#2e9e6b22' : faux ? T.dangerSoft : T.surface, border: `2px solid ${bon ? '#2e9e6b' : faux ? T.danger : T.border}`, animation: bon ? 'cl-pop .4s both' : undefined }}>
              <strong style={{ fontFamily: grotesk, color: T.accent }}>{'ABCD'[k]}</strong><span style={{ flex: 1 }}>{o}</span>{bon && '✓'}{faux && '✗'}
            </button>
          )
        })}
      </div>
      {choix && (
        <div className="cl-a" style={{ marginTop: 12 }}>
          {x.explication && <p style={{ margin: '0 0 10px', fontSize: 15, color: T.text, lineHeight: 1.5 }}>💡 {x.explication}</p>}
          <button onClick={suivant} style={{ width: '100%', minHeight: 48, borderRadius: 12, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>{i + 1 >= liste.length ? 'Voir mon résultat' : 'Question suivante →'}</button>
        </div>
      )}
    </div>
  )
}

export default function CoursLivret() {
  const { espace: espaceParam } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espaceParam || 'perso')]
  const espace = espaceParam || `${foyer.préfixe}perso`
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [progrès, setProgrès] = useState(lireProgrès)
  const [chapId, setChapId] = useState(null)
  const [onglet, setOnglet] = useState('chapitres') // chapitres | pages
  const [pageNo, setPageNo] = useState(null)
  const [étape, setÉtape] = useState('cours')
  const [final, setFinal] = useState(null)
  const [message, setMessage] = useState('')
  const chap = CHAPITRES.find(c => c.id === chapId)
  const noter = (id, champ, valeur) => setProgrès(p => {
    const n = { ...p, [id]: { ...(p[id] || {}), [champ]: champ === 'qcm' || champ === 'ouvertes' ? Math.max(valeur, p[id]?.[champ] || 0) : valeur } }
    try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* ignore */ }
    return n
  })
  const ouvrir = id => { setChapId(id); setÉtape('cours'); setFinal(null); window.scrollTo(0, 0) }
  const fait = id => { const p = progrès[id] || {}; return [p.cours, p.révision, p.ouvertes !== undefined, p.qcm !== undefined].filter(Boolean).length }
  const terminés = CHAPITRES.filter(c => fait(c.id) === 4).length
  const examenFinal = () => setFinal(mélanger(CHAPITRES.flatMap(c => c.qcm.map(x => ({ ...x, chapitre: c.titre })))).slice(0, 20))
  const versMémoriser = async () => {
    setMessage('Ajout…')
    const cartes = CHAPITRES.flatMap(c => [
      ...c.ouvertes.map((x, k) => ({ id: `livret-${c.id}-o${k}`, recto: x.question, verso: x.réponse })),
      ...c.qcm.map((x, k) => ({ id: `livret-${c.id}-q${k}`, recto: x.question, verso: `**${x.bonne}**${x.explication ? `\n${x.explication}` : ''}` })),
    ])
    const auj = new Date().toISOString().slice(0, 10)
    try {
      const { enLigne } = await modifierOutil('memoriser', espace, d => {
        const paquets = d.paquets || [], existantes = new Set((d.cartes || []).map(c => c.id))
        const ajoutPaquet = paquets.some(p => p.id === 'livret-citoyen') ? [] : [{ id: 'livret-citoyen', nom: '📘 Livret du citoyen', couleur: '#1f4fa3', modèle: 'livret' }]
        return { ...d, paquets: [...paquets, ...ajoutPaquet], cartes: [...(d.cartes || []), ...cartes.filter(c => !existantes.has(c.id)).map(c => ({ ...c, paquetId: 'livret-citoyen', niveau: 0, prochaineRevision: auj }))] }
      })
      setMessage(`✓ ${cartes.length} cartes dans « 📘 Livret du citoyen » (Mémoriser)${enLigne ? '' : ', sur cet appareil'}`)
    } catch (err) { setMessage(`Erreur : ${err.message}`) }
  }
  const puce = actif => ({ minHeight: 40, padding: '0 12px', borderRadius: 20, border: `1px solid ${actif ? T.accent : T.border}`, background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', whiteSpace: 'nowrap' })

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '20px 16px 48px', color: T.text }}>
      <style>{ANIMATIONS}</style>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {chap || final || pageNo !== null
            ? <button onClick={() => { setChapId(null); setFinal(null); setPageNo(null); window.speechSynthesis?.cancel() }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, background: 'none', border: 'none', cursor: 'pointer' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> {pageNo !== null ? 'Pages' : 'Chapitres'}</button>
            : <Link to={`/prepa/naturalisation/${espace}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36 }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Prépa naturalisation</Link>}
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>

        {!chap && !final && pageNo === null && (
          <>
            <p style={{ fontFamily: grotesk, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent, margin: '0 0 4px', fontWeight: 600 }}>Cours animé · {SOURCE_LIVRET}</p>
            <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 32, margin: '0 0 8px', lineHeight: 1.1 }}>📘 Le Livret du citoyen</h1>
            <div role="tablist" style={{ display: 'flex', gap: 6, margin: '6px 0 14px' }}>
              {[['chapitres', '📚 Par chapitre'], ['pages', '📄 Page par page']].map(([id, nom]) => <button key={id} role="tab" aria-selected={onglet === id} onClick={() => setOnglet(id)} style={{ ...puce(onglet === id), minHeight: 44, fontSize: 14.5 }}>{nom}</button>)}
            </div>
            {onglet === 'pages' && (
              <>
                <p style={{ fontSize: 14.5, color: T.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>Chaque page du livret en animations courtes, puis un « Vrai ou faux ? ». {Object.keys(progrès.pages || {}).length}/{PAGES_LIVRET.length} pages vues.</p>
                <div style={{ height: 10, borderRadius: 5, background: T.surface2, overflow: 'hidden', marginBottom: 16 }}><div style={{ height: '100%', width: `${(Object.keys(progrès.pages || {}).length / PAGES_LIVRET.length) * 100}%`, background: T.accent, transition: 'width .4s' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 10 }}>
                  {PAGES_LIVRET.map((pg, i) => {
                    const vue = progrès.pages?.[pg.page]
                    return (
                      <button key={pg.page} className="cl-a" onClick={() => { setPageNo(pg.page); window.scrollTo(0, 0) }} style={{ ...retard(i * 0.03), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left', padding: 12, borderRadius: 14, background: T.surface, border: `1px solid ${vue ? '#2e9e6b' : T.border}`, color: T.text, cursor: 'pointer', minHeight: 96 }}>
                        <span style={{ display: 'flex', width: '100%', alignItems: 'center' }}><span style={{ fontSize: 26, flex: 1 }}>{pg.emoji}</span><span style={{ fontFamily: grotesk, fontSize: 12, color: vue ? '#2e9e6b' : T.textMuted, fontWeight: 700 }}>{vue ? '✓ ' : ''}p. {pg.page}</span></span>
                        <strong style={{ fontFamily: grotesk, fontSize: 14, lineHeight: 1.3 }}>{pg.titre}</strong>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            {onglet === 'chapitres' && (<>
            <p style={{ fontSize: 14.5, color: T.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>Pour chaque chapitre : 🎬 cours animé → 🔁 révision → ✍️ questions ouvertes → ✅ QCM. {terminés}/{CHAPITRES.length} chapitres terminés.</p>
            <div style={{ height: 10, borderRadius: 5, background: T.surface2, overflow: 'hidden', marginBottom: 16 }}><div style={{ height: '100%', width: `${(CHAPITRES.reduce((t, c) => t + fait(c.id), 0) / (CHAPITRES.length * 4)) * 100}%`, background: T.accent, transition: 'width .4s' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))', gap: 10, marginBottom: 18 }}>
              {CHAPITRES.map((c, i) => {
                const f = fait(c.id), p = progrès[c.id] || {}
                return (
                  <button key={c.id} className="cl-a" onClick={() => ouvrir(c.id)} style={{ ...retard(i * 0.05), display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: 14, borderRadius: 14, background: T.surface, border: `1px solid ${f === 4 ? '#2e9e6b' : T.border}`, color: T.text, cursor: 'pointer', minHeight: 72 }}>
                    <span style={{ fontSize: 30 }}>{c.emoji}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontFamily: grotesk, fontSize: 15 }}>{i + 1}. {c.titre}</strong>
                      <span style={{ fontSize: 12.5, color: T.textMuted }}>{f === 4 ? `✓ terminé · QCM ${Math.round((p.qcm || 0) * 100)} %` : `${f}/4 étapes · p. ${c.pages}`}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button onClick={examenFinal} style={{ ...puce(true), minHeight: 48, fontSize: 15, padding: '0 18px' }}>🏁 Examen final (20 questions, 15 min)</button>
              <button onClick={versMémoriser} style={{ ...puce(false), minHeight: 48 }}>🧠 Toutes les questions dans Mémoriser</button>
            </div>
            {progrès.final !== undefined && <p style={{ fontSize: 13.5, color: T.textMuted, margin: '10px 0 0' }}>Meilleur examen final : {Math.round(progrès.final * 100)} %</p>}
            {message && <p role="status" style={{ fontSize: 14, fontFamily: grotesk, fontWeight: 600, color: message.startsWith('✓') ? '#2e9e6b' : T.text, margin: '10px 0 0' }}>{message}</p>}
            </>)}
          </>
        )}

        {pageNo !== null && (() => {
          const k = PAGES_LIVRET.findIndex(x => x.page === pageNo), pg = PAGES_LIVRET[k]
          const aller = j => { setPageNo(PAGES_LIVRET[j].page); window.scrollTo(0, 0) }
          const voir = () => setProgrès(p => { const n = { ...p, pages: { ...(p.pages || {}), [pg.page]: true } }; try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* ignore */ } return n })
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <button onClick={() => aller(k - 1)} disabled={k === 0} aria-label="Page précédente" style={{ ...puce(false), opacity: k === 0 ? 0.4 : 1 }}>◀</button>
                <span style={{ flex: 1, textAlign: 'center', fontFamily: grotesk, fontWeight: 700, color: T.textMuted, fontSize: 13 }}>Page {pg.page} du livret · {k + 1}/{PAGES_LIVRET.length}</span>
                <button onClick={() => aller(k + 1)} disabled={k === PAGES_LIVRET.length - 1} aria-label="Page suivante" style={{ ...puce(false), opacity: k === PAGES_LIVRET.length - 1 ? 0.4 : 1 }}>▶</button>
              </div>
              <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(24px, 6vw, 30px)', margin: '0 0 12px', lineHeight: 1.15 }}>{pg.emoji} {pg.titre}</h1>
              <Cours key={pg.page} T={T} chap={{ id: `p${pg.page}`, diapos: pg.diapos }} libelléFin={k < PAGES_LIVRET.length - 1 ? 'Page suivante →' : '✓ Terminé'}
                onFini={() => { voir(); if (k < PAGES_LIVRET.length - 1) aller(k + 1); else setPageNo(null) }} />
            </>
          )
        })()}

        {final && (
          <>
            <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 28, margin: '0 0 14px' }}>🏁 Examen final</h1>
            <QCM T={T} questions={final} titre="Examen final" minutes={15} onFini={s => setProgrès(p => { const n = { ...p, final: Math.max(s, p.final || 0) }; try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* ignore */ } return n })} />
          </>
        )}

        {chap && (
          <>
            <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(24px, 6vw, 30px)', margin: '0 0 12px', lineHeight: 1.15 }}>{chap.emoji} {chap.titre}</h1>
            <div role="tablist" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
              {ÉTAPES.map(([id, nom]) => {
                const p = progrès[chap.id] || {}
                const ok = id === 'cours' ? p.cours : id === 'révision' ? p.révision : p[id] !== undefined
                return <button key={id} role="tab" aria-selected={étape === id} onClick={() => setÉtape(id)} style={puce(étape === id)}>{nom}{ok ? ' ✓' : ''}</button>
              })}
            </div>
            {étape === 'cours' && <Cours T={T} chap={chap} onFini={() => { noter(chap.id, 'cours', true); setÉtape('révision') }} />}
            {étape === 'révision' && <Révision T={T} chap={chap} onFini={() => { noter(chap.id, 'révision', true); setÉtape('ouvertes') }} />}
            {étape === 'ouvertes' && <Ouvertes T={T} chap={chap} onFini={s => { noter(chap.id, 'ouvertes', s); setÉtape('qcm') }} />}
            {étape === 'qcm' && (
              <>
                <QCM key={chap.id} T={T} questions={chap.qcm} titre={chap.titre} onFini={s => noter(chap.id, 'qcm', s)} />
                {progrès[chap.id]?.qcm !== undefined && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    <button onClick={() => setÉtape('cours')} style={puce(false)}>↻ Revoir le cours</button>
                    {CHAPITRES.findIndex(c => c.id === chap.id) < CHAPITRES.length - 1
                      ? <button onClick={() => ouvrir(CHAPITRES[CHAPITRES.findIndex(c => c.id === chap.id) + 1].id)} style={puce(true)}>Chapitre suivant →</button>
                      : <button onClick={() => { setChapId(null); examenFinal() }} style={puce(true)}>🏁 Examen final</button>}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
