// Visuels pédagogiques du court-métrage de la page 8 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const tuile = (actif, extra = {}) => ({ borderRadius: 14, padding: 'clamp(5px, 1vw, 10px) clamp(6px, 1.2vw, 12px)', borderColor: actif ? or : 'rgba(255,255,255,.25)', boxShadow: actif ? '0 0 22px rgba(255,209,102,.45)' : 'none', ...extra })
const an = { fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(16px, 2.8vw, 28px)', color: or, lineHeight: 1.1 }
const légende = { fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.7vw, 16px)', lineHeight: 1.25 }

// Frise des dates : rien n'est affiché avant que le récit ne l'annonce.
function Frise({ points, étape }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 'clamp(4px, 1vw, 10px)' }}>
      {points.map(([a, t, dès], k) => étape >= dès && (
        <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 10px)' }}>
          {k > 0 && <span aria-hidden="true" style={{ color: or, fontSize: 20, textShadow: '0 2px 6px #000' }}>➜</span>}
          <div className="c-mot-pilule" style={tuile(étape === dès, { width: 'clamp(92px, 19vw, 200px)' })}>
            <div style={an}>{a}</div>
            <div style={légende}>{t}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Frise14({ étape }) {
  if (étape < 1) return null
  return <div style={colonne}><Frise étape={étape} points={[['1789', 'prise de la Bastille', 1], ['1790', 'Fête de la Fédération', 2], ['1880', 'fête nationale', 3]]} /></div>
}

function Marseillaise({ étape }) {
  return (
    <div style={colonne}>
      <div aria-hidden="true" style={{ position: 'relative', height: 'clamp(30px, 6vh, 56px)', width: 'min(80%, 420px)' }}>
        {['♪', '♫', '♪', '♬', '♫'].map((n, k) => <span key={k} className="c-note" style={{ position: 'absolute', left: `${10 + k * 19}%`, top: `${(k % 2) * 30}%`, fontSize: 'clamp(22px, 4vw, 38px)', color: or, textShadow: '0 2px 8px #000', animationDelay: `${k * 0.45}s` }}>{n}</span>)}
      </div>
      {étape >= 1 && <div className="c-apparait" style={pastille()}>🎺 La Marseillaise · hymne national · 1792</div>}
      {étape >= 2 && <div className="c-apparait" style={pastille(false)}>✍️ Rouget de Lisle · 🏫 étudiée à l'école primaire</div>}
    </div>
  )
}

function Langue({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🗣️ langue officielle de la République : le français</div>
    </div>
  )
}

function Marianne({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🔴 bonnet phrygien = symbole de la liberté</div>
      {étape >= 2 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
          <div className="c-apparait" style={pastille(false)}>📄 documents de l'administration</div>
          <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.4s' }}>🏛️ statue dans toutes les mairies</div>
        </div>
      )}
    </div>
  )
}

function Drapeau({ étape }) {
  if (étape < 1) return null
  return <div style={colonne}><Frise étape={étape} points={[['Révolution', 'création du drapeau tricolore', 1], ['1794', 'drapeau officiel', 2], ['1814-1830', 'sauf la Restauration', 2]]} /></div>
}

function Coq({ étape }) {
  return (
    <div style={{ ...colonne, gap: 6 }}>
      <svg viewBox="0 0 300 260" style={{ width: 'clamp(90px, 18vw, 190px)', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,.55))' }} aria-label="Un coq" role="img" className="c-apparait">
        <path d="M118,150 C70,128 52,70 84,30 C82,78 100,116 132,140 Z" fill="#1d4ed8" />
        <path d="M120,152 C64,146 30,100 40,52 C54,98 86,130 132,144 Z" fill="#f8fafc" />
        <path d="M122,156 C70,166 30,136 22,92 C46,128 86,146 134,148 Z" fill="#dc2626" />
        <path d="M112,150 C112,208 160,236 204,222 C238,210 248,176 236,144 L218,98 C208,82 192,84 188,100 L182,140 C160,138 130,136 112,150 Z" fill="#1e40af" />
        <ellipse cx="166" cy="176" rx="44" ry="26" fill="#f8fafc" transform="rotate(-12 166 176)" />
        <path d="M128,178 C150,188 176,190 200,180" stroke="#cbd5e1" strokeWidth="3" fill="none" />
        <circle cx="204" cy="84" r="26" fill="#1e40af" />
        {[[192, 58, 9], [204, 52, 10], [216, 56, 9]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="#dc2626" />)}
        <path d="M228,80 L252,88 L228,96 Z" fill="#f59e0b" />
        <ellipse cx="226" cy="108" rx="7" ry="12" fill="#dc2626" />
        <circle cx="212" cy="80" r="5" fill="#fff" /><circle cx="213" cy="80" r="2.6" fill="#111" />
        <path d="M168,224 L162,252 M196,222 L202,252 M150,252 L172,252 M190,252 L214,252" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
      </svg>
      {étape >= 1 && <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>{['fierté', 'courage', 'vigilance'].map((m, k) => <span key={m} className="c-mot-pilule" style={{ animationDelay: `${k * 0.3}s`, fontFamily: 'Georgia, serif', fontSize: 'clamp(13px, 2vw, 19px)', padding: '5px 14px', borderColor: or }}>{m}</span>)}</div>}
      {étape >= 2 && <div className="c-apparait" style={pastille(false)}>pas de statut officiel · symbole national reconnu</div>}
    </div>
  )
}

// Marianne au bonnet phrygien, en petit (icône dessinée, sans logo réel).
function MarianneIcône({ taille = 28 }) {
  return <svg viewBox="0 0 40 40" width={taille} height={taille} aria-hidden="true" style={{ display: 'inline-block' }}><path d="M12,18 C10,6 22,2 30,7 C35,10 36,15 32,18 L30,15 C26,17 18,18 12,18 Z" fill="#dc2626" /><circle cx="22" cy="22" r="9" fill="#f1c9a5" /><path d="M14,40 C14,30 18,28 22,28 C26,28 30,30 30,40 Z" fill="#1d4ed8" /></svg>
}

// Un site de l'administration (illustration générique, sans logo réel).
function Partout({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...boîte, top: '22%', display: 'flex', justifyContent: 'center' }}>
      <div className="c-apparait" style={{ width: 'min(70%, 360px)', borderRadius: 12, overflow: 'hidden', background: '#fff', color: '#1e293b', boxShadow: '0 18px 40px rgba(0,0,0,.55)' }}>
        <div style={{ display: 'flex', gap: 5, padding: '6px 8px', background: '#e2e8f0' }}>{['#f87171', '#fbbf24', '#34d399'].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: 5, background: c }} />)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
          <span aria-hidden="true" style={{ display: 'flex', height: 26, width: 30, borderRadius: 3, overflow: 'hidden' }}>{['#1d4ed8', '#fff', '#dc2626'].map(c => <span key={c} style={{ flex: 1, background: c, border: c === '#fff' ? '1px solid #e2e8f0' : 'none' }} />)}</span>
          <MarianneIcône taille={28} />
          <strong style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11px, 1.6vw, 15px)' }}>Site de l'administration</strong>
        </div>
        <div style={{ padding: '8px 12px', display: 'grid', gap: 5 }}>{[90, 70, 80].map((w, k) => <span key={k} style={{ height: 8, width: `${w}%`, borderRadius: 4, background: '#cbd5e1' }} />)}</div>
      </div>
    </div>
  )
}

function SixSymboles({ étape }) {
  if (étape < 1) return null
  const l = [['🎆', 'le 14 juillet'], ['🎶', 'La Marseillaise'], ['🗣️', 'le français'], [<MarianneIcône key="m" taille={30} />, 'Marianne'], ['🇫🇷', 'le drapeau'], ['🐓', 'le coq']]
  return (
    <div style={{ ...colonne, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', width: 'min(94%, 640px)', gap: 'clamp(5px, 1vw, 10px)' }}>
      {l.map(([e, t], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.35}s`, ...tuile(true, { padding: 'clamp(4px, .8vw, 8px) 4px' }) }}>
          <div style={{ fontSize: 'clamp(18px, 3.2vw, 30px)' }}>{e}</div>
          <div style={{ ...légende, color: crème }}>{t}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels8({ nom, étape }) {
  switch (nom) {
    case 'frise-14': return <Frise14 étape={étape} />
    case 'marseillaise': return <Marseillaise étape={étape} />
    case 'langue': return <Langue étape={étape} />
    case 'marianne': return <Marianne étape={étape} />
    case 'drapeau': return <Drapeau étape={étape} />
    case 'coq': return <Coq étape={étape} />
    case 'partout': return <Partout étape={étape} />
    case 'six-symboles': return <SixSymboles étape={étape} />
    default: return null
  }
}
