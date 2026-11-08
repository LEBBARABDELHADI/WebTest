// Visuels pédagogiques du court-métrage de la page 6 (responsives).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

function Devise({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.4vh, 14px)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(6px, 1.2vw, 14px)' }}>
        {['LIBERTÉ', 'ÉGALITÉ', 'FRATERNITÉ'].map((m, k) => (
          <div key={m} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.6}s`, padding: 'clamp(8px, 1.4vw, 14px) clamp(14px, 2.6vw, 28px)', borderColor: or, boxShadow: '0 0 34px rgba(255,209,102,.55), inset 0 0 20px rgba(255,209,102,.2)' }}>
            <strong style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px, 3.6vw, 36px)', letterSpacing: '.12em' }}>{m}</strong>
          </div>
        ))}
      </div>
      {étape >= 2 && <div className="c-apparait" style={pastille()}>🏛️ sur le fronton des bâtiments publics : préfectures, mairies…</div>}
    </div>
  )
}

function Libres({ étape }) {
  const c = [['🎓', 'leurs choix'], ['💬', 'leurs opinions'], ['🎤', 'leur manière de penser, de s\'exprimer'], ['🏡', '… et de vivre']]
  const n = étape >= 4 ? 4 : étape >= 2 ? 2 : étape >= 1 ? 1 : 0
  if (!n) return null
  return (
    <div style={{ ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vw, 10px)' }}>
      <div className="c-apparait" style={pastille()}>🕊️ Libres dans…</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(6px, 1.2vw, 12px)' }}>
        {c.slice(0, n).map(([e, t], k) => (
          <div key={t} className="c-mot-pilule" style={{ animationDelay: `${(k % 2) * 0.3}s`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: or }}>
            <span style={{ fontSize: 'clamp(18px, 3vw, 30px)' }}>{e}</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(13px, 2vw, 20px)' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Nuisance({ étape }) {
  return (
    <div style={{ ...boîte, top: HAUT, display: 'flex', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 300" style={{ width: 'min(100%, 640px)' }} aria-hidden="true">
        <rect x="30" y="20" width="320" height="250" rx="12" fill="rgba(255,190,90,.22)" stroke="rgba(255,210,140,.6)" strokeWidth="3" />
        <rect x="450" y="20" width="320" height="250" rx="12" fill="rgba(120,140,220,.18)" stroke="rgba(170,190,255,.5)" strokeWidth="3" />
        <rect x="380" y="10" width="40" height="270" fill="#5a4a62" />
        <g transform="translate(150,170)"><rect x="-40" y="-60" width="80" height="110" rx="10" fill="#2a2433" /><circle r="26" cy="-14" fill="#4a3f5a" /><circle r="10" cy="-14" fill="#1a1622" /><circle r="12" cy="32" fill="#4a3f5a" /></g>
        {étape >= 1 && [0, 1, 2].map(k => <path key={k} d={`M${220 + k * 50},110 Q${250 + k * 50},150 ${220 + k * 50},190`} stroke={or} strokeWidth="6" fill="none" strokeLinecap="round" className="c-onde-son" style={{ animationDelay: `${k * 0.25}s` }} />)}
        <g transform="translate(610,190)"><rect x="-90" y="0" width="180" height="40" rx="8" fill="#c7d2fe" /><circle cx="-60" cy="-6" r="22" fill="#f1c9a5" /><path d="M-40,-10 L80,-10 L80,10 L-40,10 Z" fill="#818cf8" /></g>
        <text x="650" y="110" fontSize="34" fill="#c7d2fe" className="c-zzz">z z z</text>
        {étape >= 2 && <g className="c-apparait"><circle cx="400" cy="150" r="56" fill="rgba(220,38,38,.18)" stroke="#ef4444" strokeWidth="6" /><path d="M362,112 L438,188" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" /></g>}
      </svg>
      {étape >= 2 && <div className="c-apparait" style={{ ...pastille(), position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>ne pas nuire à autrui</div>}
    </div>
  )
}

function Tableau({ étape }) {
  return (
    <div style={{ position: 'absolute', inset: 'calc(clamp(22px, 6.5vh, 66px) + 10px) 5% 18%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 3vw, 36px)' }}>
      <div className="c-apparait" style={{ height: '100%', maxHeight: 420, aspectRatio: '296 / 434', overflow: 'hidden', border: '10px solid #c9a24a', outline: '3px solid #6b4f1d', boxShadow: '0 24px 60px rgba(0,0,0,.7), inset 0 0 0 2px #e8cf8a', borderRadius: 4, background: '#111' }}>
        <img src={`${import.meta.env.BASE_URL}livret2026/img-p06-ddhc.webp`} alt="La Déclaration des droits de l'homme et du citoyen de 1789 (illustration du livret)" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'c-kenburns 16s ease-in-out both' }} />
      </div>
      {étape >= 2 && (
        <div className="c-deroule" style={{ flex: '1 1 260px', maxWidth: 420, background: 'radial-gradient(ellipse at center, #fbf0d0, #e2c48a)', color: '#3b2a12', borderRadius: 10, border: '4px solid #c9a46a', padding: 'clamp(12px, 2vw, 20px)', fontFamily: 'Georgia, serif', textAlign: 'center', boxShadow: '0 18px 40px rgba(0,0,0,.5)' }}>
          <div style={{ fontSize: 'clamp(12px, 1.6vw, 15px)', letterSpacing: '.12em' }}>DDHC 1789 · ARTICLE 4</div>
          <div className="c-plume" style={{ fontStyle: 'italic', fontSize: 'clamp(17px, 2.8vw, 26px)', lineHeight: 1.4, marginTop: 6 }}>« la liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui »</div>
        </div>
      )}
    </div>
  )
}

function Mêmes({ étape }) {
  if (étape < 1) return null
  const couleurs = ['#f472b6', '#38bdf8', '#facc15', '#34d399', '#a78bfa', '#fb923c']
  return (
    <div style={{ ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <svg viewBox="0 0 720 160" style={{ width: 'min(100%, 560px)' }} aria-hidden="true">
        {couleurs.map((c, k) => (
          <g key={c} transform={`translate(${70 + k * 116},120)`}>
            <g className="c-monte" style={{ animationDelay: `${k * 0.15}s` }}>
              <circle cy="-70" r="22" fill={['#f1c9a5', '#8d5a3b', '#c98e64', '#e8b896', '#5a3b22', '#f4d7bc'][k]} />
              <path d="M-34,30 C-34,-24 -20,-40 0,-40 C20,-40 34,-24 34,30 Z" fill={c} />
              <circle cx="0" cy="-2" r="12" fill={or} stroke="#fff3c4" strokeWidth="3" />
            </g>
          </g>
        ))}
      </svg>
      <div className="c-apparait" style={pastille()}>les mêmes libertés pour tous · dans le respect des lois</div>
    </div>
  )
}

function Balance({ étape }) {
  const critères = ['leur sexe', 'leur origine', 'leur religion', 'leurs opinions', 'leur orientation sexuelle']
  return (
    <div style={{ ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg viewBox="0 0 700 300" style={{ width: 'min(100%, 520px)' }} aria-hidden="true">
        <defs><linearGradient id="v6-laiton" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe8a3" /><stop offset="1" stopColor="#b8892a" /></linearGradient></defs>
        <rect x="340" y="60" width="20" height="200" fill="url(#v6-laiton)" />
        <path d="M280,280 L420,280 L390,252 L310,252 Z" fill="url(#v6-laiton)" />
        <g className={étape >= 2 ? 'c-fleau-6' : ''} style={{ transformOrigin: '350px 64px' }}>
          <rect x="120" y="58" width="460" height="12" rx="6" fill="url(#v6-laiton)" />
          {[150, 550].map(x => <g key={x}><path d={`M${x},64 L${x - 60},170 M${x},64 L${x + 60},170`} stroke="#b8892a" strokeWidth="3" /><path d={`M${x - 76},170 Q${x},212 ${x + 76},170 Z`} fill="url(#v6-laiton)" /></g>)}
        </g>
        <circle cx="350" cy="58" r="16" fill={or} />
      </svg>
      {étape >= 1 && <div className="c-apparait" style={pastille()}>⚖️ principe fondamental · article 1er de la Constitution de 1958</div>}
      {étape >= 2 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
          <span className="c-apparait" style={{ color: crème, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', textShadow: '0 2px 6px #000', alignSelf: 'center' }}>quel que soit :</span>
          {critères.map((c, k) => <span key={c} className="c-mot-pilule" style={{ animationDelay: `${k * 0.2}s`, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px' }}>{c}</span>)}
          <span className="c-mot-pilule" style={{ animationDelay: '1.1s', borderColor: or, fontFamily: 'Georgia, serif', fontSize: 'clamp(13px, 2vw, 19px)', padding: '5px 14px' }}>= les mêmes droits · article 1er de la DDHC</span>
        </div>
      )}
    </div>
  )
}

function FemmesHommes({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...boîte, top: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="c-apparait" style={pastille()}>♀ = ♂ · préambule de la Constitution · depuis 1946</div>
      {étape >= 2 && <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>{[['💼', 'travail'], ['🩺', 'santé'], ['🎓', 'éducation'], ['…', 'tous les domaines']].map(([e, t], k) => <span key={t} className="c-mot-pilule" style={{ animationDelay: `${k * 0.25}s`, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px' }}>{e} {t}</span>)}</div>}
    </div>
  )
}

function Définition({ étape }) {
  const situations = ['logement', 'travail', 'loisirs…']
  const critères = ['origine', 'sexe', 'orientation sexuelle', 'opinion politique', 'âge', 'convictions religieuses', 'apparence physique…']
  return (
    <div style={{ ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }}>
      {étape >= 1 && <div className="c-apparait" style={{ ...pastille(), borderColor: '#ef4444', boxShadow: '0 0 24px rgba(239,68,68,.4)' }}>🚫 La France condamne les discriminations</div>}
      {étape >= 2 && (
        <div className="c-apparait" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ color: crème, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', textShadow: '0 2px 6px #000' }}>traiter différemment, dans une situation comparable :</span>
          {situations.map((s, k) => <span key={s} className="c-mot-pilule" style={{ animationDelay: `${k * 0.2}s`, padding: '4px 12px', fontSize: 'clamp(12px, 1.8vw, 16px)' }}>{s}</span>)}
        </div>
      )}
      {étape >= 3 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ color: crème, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', textShadow: '0 2px 6px #000' }}>en raison de :</span>
          {critères.map((c, k) => <span key={c} className="c-mot-pilule" style={{ animationDelay: `${k * 0.15}s`, padding: '4px 11px', fontSize: 'clamp(11.5px, 1.7vw, 15px)', borderColor: '#ef4444' }}>{c}</span>)}
        </div>
      )}
    </div>
  )
}

function Loi({ étape }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 6%' }}>
      <div style={{ fontSize: 'clamp(70px, 14vw, 150px)', lineHeight: 1, filter: 'drop-shadow(0 0 30px rgba(255,209,102,.6))' }} className="c-titre-carton">⚖️</div>
      {étape >= 1 && <div className="c-impact-6" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(30px, 7vw, 76px)', lineHeight: 1.05, color: '#fff', marginTop: 12, textShadow: '0 4px 0 #b91c1c, 0 10px 30px rgba(0,0,0,.7)' }}>PUNIES PAR LA LOI</div>}
      {étape >= 1 && <div className="c-apparait" style={{ marginTop: 10, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(15px, 2.4vw, 24px)', color: '#e5e7eb', animationDelay: '.6s' }}>les discriminations</div>}
    </div>
  )
}

export default function Visuels6({ nom, étape }) {
  switch (nom) {
    case 'devise': return <Devise étape={étape} />
    case 'libres': return <Libres étape={étape} />
    case 'nuisance': return <Nuisance étape={étape} />
    case 'tableau': return <Tableau étape={étape} />
    case 'memes': return <Mêmes étape={étape} />
    case 'balance': return <Balance étape={étape} />
    case 'femmes-hommes': return <FemmesHommes étape={étape} />
    case 'definition': return <Définition étape={étape} />
    case 'loi': return <Loi étape={étape} />
    default: return null
  }
}
