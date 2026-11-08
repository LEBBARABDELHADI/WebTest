// Visuels pédagogiques du court-métrage (page 10), au-dessus du décor.
// Responsives : lisibles sur téléphone comme sur ordinateur. `étape` fait
// avancer chaque visuel au rythme des dialogues.

const or = '#ffd166', crème = '#fff3c4'
const boîte = { position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 'min(94%, 980px)', pointerEvents: 'none' }

function QuatreMots({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...boîte, top: '5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(46%, 200px), 1fr))', gap: 'clamp(6px, 1.2vw, 14px)' }}>
      {['INDIVISIBLE', 'LAÏQUE', 'DÉMOCRATIQUE', 'SOCIALE'].map((m, k) => (
        <div key={m} className="c-mot-pilule" style={{ animationDelay: `${0.35 + k * 0.5}s`, ...(k < 2 ? { borderColor: or, boxShadow: '0 0 28px rgba(255,209,102,.55), inset 0 0 18px rgba(255,209,102,.25)' } : {}) }}>
          <span style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', letterSpacing: '.2em', opacity: 0.75 }}>{k < 2 ? 'CE SOIR' : 'PAGE 14'}</span>
          <strong style={{ display: 'block', fontFamily: 'Georgia, serif', fontSize: 'clamp(15px, 2.6vw, 26px)', letterSpacing: '.08em' }}>{m}</strong>
        </div>
      ))}
    </div>
  )
}

function Plan({ étape }) {
  const t = (d, k) => <path key={k} d={d} fill="none" stroke="#e8f4ff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="c-trace" style={{ animationDelay: `${k * 0.3}s` }} />
  return (
    <div style={{ ...boîte, top: '4%', bottom: '4%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 1000 720" style={{ width: '100%', height: '100%' }} aria-hidden="true">
        <text x="500" y="64" textAnchor="middle" fontFamily="Georgia, serif" fontSize="44" letterSpacing="10" fill="#e8f4ff">LA CONSTITUTION</text>
        <text x="500" y="104" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" letterSpacing="4" fill="#9fd1ff">acte fondateur d'un État</text>
        {étape >= 1 && [
          'M240,600 L760,600', 'M280,600 L280,360 L500,200 L720,360 L720,600', 'M280,360 L720,360',
          'M465,600 L465,470 L535,470 L535,600', 'M330,410 L410,410 L410,470 L330,470 Z', 'M590,410 L670,410 L670,470 L590,470 Z',
        ].map(t)}
        {étape >= 2 && (
          <g className="c-apparait">
            <path d="M220,630 L780,630" stroke={or} strokeWidth="14" strokeLinecap="round" />
            <text x="500" y="690" textAnchor="middle" fontFamily="Georgia, serif" fontSize="34" fill={or}>règles fondamentales</text>
            <text x="135" y="300" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fill={or}>organisé</text>
            <path d="M150,316 L270,380" stroke={or} strokeWidth="3" strokeDasharray="8 8" />
            <text x="865" y="300" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fill={or}>dirigé</text>
            <path d="M850,316 L730,380" stroke={or} strokeWidth="3" strokeDasharray="8 8" />
          </g>
        )}
      </svg>
    </div>
  )
}

function Pyramide({ étape }) {
  return (
    <div style={{ ...boîte, top: '4%', bottom: '6%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 900 720" style={{ width: '100%', height: '100%' }} aria-hidden="true">
        <defs><radialGradient id="v-or"><stop offset="0" stopColor="#fff3c4" /><stop offset=".5" stopColor={or} /><stop offset="1" stopColor="rgba(255,209,102,0)" /></radialGradient></defs>
        <ellipse cx="450" cy="660" rx="420" ry="34" fill="rgba(120,160,255,.18)" />
        {étape >= 1 && [0, 1, 2].map(r => Array.from({ length: 6 - r * 2 }, (_, i) => {
          const w = 132, y = 560 - r * 96, x0 = 450 - ((6 - r * 2) * w) / 2
          return <g key={`${r}-${i}`} className="c-bloc" style={{ animationDelay: `${(r * 6 + i) * 0.09}s` }}><rect x={x0 + i * w + 5} y={y} width={w - 10} height="82" rx="10" fill="#3b5ba8" stroke="#7fa2ff" strokeWidth="2" /><text x={x0 + i * w + w / 2} y={y + 52} textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fill="#dfe8ff">loi</text></g>
        }))}
        {étape >= 1 && <text x="450" y="700" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" letterSpacing="6" fill="#9fb8ff" className="c-apparait">TOUTES LES LOIS</text>}
        {étape >= 2 && (
          <g className="c-sommet">
            <circle cx="450" cy="230" r="220" fill="url(#v-or)" opacity=".55" />
            <path d="M270,310 L630,310 L570,190 L330,190 Z" fill={or} stroke={crème} strokeWidth="4" />
            <text x="450" y="266" textAnchor="middle" fontFamily="Georgia, serif" fontSize="38" fontWeight="700" fill="#3b2a05">CONSTITUTION</text>
            <text x="450" y="80" textAnchor="middle" fontFamily="Georgia, serif" fontSize="36" letterSpacing="7" fill={crème}>HIÉRARCHIE DES NORMES</text>
            <text x="450" y="124" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="26" fill="#c9d6ff">dans un État de droit</text>
          </g>
        )}
      </svg>
    </div>
  )
}

function Pouvoirs({ étape }) {
  const bât = [[150, 'Le gouvernement'], [450, 'Le Parlement'], [750, 'Les tribunaux']]
  return (
    <div style={{ ...boîte, top: '3%', bottom: '4%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 900 800" style={{ width: '100%', height: '100%' }} aria-hidden="true">
        <defs><radialGradient id="v-or2"><stop offset="0" stopColor="#fff3c4" /><stop offset=".5" stopColor={or} /><stop offset="1" stopColor="rgba(255,209,102,0)" /></radialGradient></defs>
        <text x="450" y="50" textAnchor="middle" fontFamily="Georgia, serif" fontSize="44" letterSpacing="6" fill={crème}>CONSTITUTION</text>
        <circle cx="450" cy="200" r="140" fill="url(#v-or2)" opacity=".5" />
        <path d="M360,240 L450,222 L540,240 L540,250 L450,234 L360,250 Z" fill="#f6eedb" />
        <path d="M360,240 L360,160 L450,142 L450,222 Z" fill="#fff8e6" /><path d="M540,240 L540,160 L450,142 L450,222 Z" fill="#efe4c8" />
        {étape >= 1 && <g className="c-apparait">
          {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <g key={i} transform={`translate(${450 + Math.cos(a) * 200},${200 + Math.sin(a) * 92})`}><circle cy="-15" r="12" fill="#ffd8b0" /><path d="M-14,16 Q0,-4 14,16 Z" fill={['#f472b6', '#38bdf8', '#facc15', '#34d399'][i % 4]} /></g> })}
          <text x="450" y="350" textAnchor="middle" fontFamily="Georgia, serif" fontSize="38" fill="#ffd8b0">droits et libertés des citoyens</text>
        </g>}
        {étape >= 2 && bât.map(([x], k) => <path key={k} d={`M450,250 Q${(450 + x) / 2},380 ${x},430`} stroke={or} strokeWidth="5" fill="none" strokeDasharray="12 12" className="c-trace" style={{ animationDelay: `${k * 0.3}s` }} />)}
        {étape >= 2 && bât.map(([x, nom], k) => (
          <g key={nom} className="c-monte" style={{ animationDelay: `${k * 0.35}s` }}>
            {k === 0 && <><rect x={x - 115} y="470" width="230" height="160" fill="#ece4d2" /><path d={`M${x - 125},470 L${x + 125},470 L${x},415 Z`} fill="#d9ccb0" />{[0, 1, 2, 3].map(i => <rect key={i} x={x - 92 + i * 52} y="505" width="30" height="46" fill="#8fb3d9" />)}<rect x={x - 3} y="352" width="6" height="66" fill="#555" /><rect x={x + 3} y="354" width="16" height="26" fill="#1d4ed8" /><rect x={x + 19} y="354" width="16" height="26" fill="#fff" /><rect x={x + 35} y="354" width="16" height="26" fill="#dc2626" /></>}
            {k === 1 && <><rect x={x - 115} y="490" width="230" height="140" fill="#e9e1cf" /><path d={`M${x - 85},490 Q${x},392 ${x + 85},490 Z`} fill="#d8cdb2" />{[0, 1, 2, 3, 4].map(i => <rect key={i} x={x - 98 + i * 45} y="526" width="17" height="104" fill="#bfb293" />)}</>}
            {k === 2 && <><rect x={x - 115} y="480" width="230" height="150" fill="#e6dfcf" /><path d={`M${x - 125},480 L${x + 125},480 L${x},422 Z`} fill="#d6cab0" />{[0, 1, 2, 3, 4].map(i => <rect key={i} x={x - 96 + i * 46} y="500" width="15" height="130" fill="#c4b89c" />)}<g transform={`translate(${x},565)`}><path d="M-38,-30 L38,-30 M0,-40 L0,30" stroke="#6b5a36" strokeWidth="5" /><path d="M-38,-30 L-52,0 L-24,0 Z M38,-30 L24,0 L52,0 Z" fill="#6b5a36" /></g></>}
            <text x={x} y="690" textAnchor="middle" fontFamily="Georgia, serif" fontSize="40" fill={crème}>{nom}</text>
          </g>
        ))}
        {étape >= 3 && <rect x="14" y="400" width="872" height="320" rx="30" fill="none" stroke={or} strokeWidth="7" className="c-cadre" />}
        {étape >= 3 && <text x="450" y="775" textAnchor="middle" fontFamily="Georgia, serif" fontSize="36" fill={or} className="c-apparait">partagés · encadrés</text>}
      </svg>
    </div>
  )
}

function Carton({ carton, étape }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 6%' }}>
      <div className="c-apparait" style={{ color: or, fontFamily: 'Georgia, serif', fontSize: 'clamp(22px, 4vw, 40px)', letterSpacing: '.5em' }}>{carton.lettre}</div>
      <div className="c-titre-carton" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(30px, 7vw, 76px)', lineHeight: 1.05, color: '#fff', margin: '10px 0 16px', textShadow: '0 6px 30px rgba(0,0,0,.6)' }}>{carton.titre}</div>
      <div className="c-apparait" style={{ display: 'flex', animationDelay: '.6s' }}>{['#2563eb', '#fff', '#dc2626'].map(c => <span key={c} style={{ width: 'clamp(40px, 7vw, 90px)', height: 6, background: c }} />)}</div>
      {carton.sous && <div className="c-apparait" style={{ marginTop: 14, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(16px, 2.6vw, 28px)', color: '#c9cdd8', animationDelay: '.9s' }}>{carton.sous}</div>}
      {carton.calendrier && étape >= 1 && (
        <div className="c-calendrier" style={{ marginTop: 'clamp(16px, 4vh, 40px)', width: 'clamp(120px, 18vw, 190px)', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.5)' }}>
          <div style={{ background: '#dc2626', color: '#fff', fontWeight: 800, letterSpacing: '.12em', padding: '8px 0', fontSize: 'clamp(13px, 1.8vw, 18px)' }}>DÉCEMBRE</div>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(54px, 9vw, 96px)', color: '#1b1b2a', lineHeight: 1.2 }}>9</div>
          <div style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: '#555', padding: '0 0 8px' }}>Journée de la laïcité</div>
        </div>
      )}
    </div>
  )
}

function Journal({ étape }) {
  return (
    <div style={{ ...boîte, top: '9%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 2vh, 18px)' }}>
      {étape >= 1 && (
        <div className="c-journal" style={{ width: 'min(62%, 460px)', background: '#f4f1ea', color: '#1b1b2a', padding: 'clamp(10px, 2vw, 18px)', boxShadow: '0 20px 50px rgba(0,0,0,.55)', transform: 'rotate(-3deg)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(11px, 1.7vw, 17px)', letterSpacing: '.08em', borderBottom: '3px solid #1b1b2a', paddingBottom: 4, textAlign: 'center' }}>LE QUOTIDIEN DU QUARTIER</div>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(16px, 3vw, 30px)', color: '#7a1e1e', lineHeight: 1.15, margin: '8px 0', textAlign: 'center' }}>« Notre quartier fera ses propres lois ! »</div>
          {[0, 1, 2].map(i => <div key={i} style={{ height: 7, borderRadius: 4, background: '#cfc9bc', margin: '6px 0', width: i === 2 ? '60%' : '100%' }} />)}
          <div style={{ display: 'inline-block', marginTop: 4, padding: '3px 10px', borderRadius: 10, background: '#1b1b2a', color: '#fff', fontSize: 'clamp(9px, 1.2vw, 12px)', fontWeight: 800, letterSpacing: '.08em' }}>JOURNAL FICTIF</div>
        </div>
      )}
      {étape >= 2 && (
        <div className="c-apparait" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 22px)', padding: 'clamp(8px, 1.6vw, 14px) clamp(12px, 2.4vw, 22px)', borderRadius: 20, background: 'rgba(12,14,36,.84)', border: `2px solid ${or}`, color: crème, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.9vw, 18px)', textAlign: 'center' }}>
          <span><span style={{ fontSize: 'clamp(24px, 4vw, 40px)', display: 'block' }}>🏛️</span>des représentants élus par le peuple</span>
          <strong style={{ color: or, fontSize: 'clamp(16px, 2.6vw, 26px)' }}>ou</strong>
          <span><span className="c-bulletin" style={{ fontSize: 'clamp(24px, 4vw, 40px)', display: 'block' }}>🗳️</span>le peuple lui-même, par référendum</span>
        </div>
      )}
    </div>
  )
}

function Fil({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...boîte, top: '22%', display: 'flex', justifyContent: 'center' }}>
      <div className="c-apparait" style={{ padding: 'clamp(6px, 1.2vw, 10px) clamp(12px, 2.4vw, 22px)', borderRadius: 30, background: 'rgba(10,14,40,.85)', border: `2px solid ${or}`, color: crème, fontFamily: 'Georgia, serif', fontSize: 'clamp(13px, 2.2vw, 22px)', textAlign: 'center', boxShadow: '0 0 30px rgba(255,209,102,.4)' }}>
        métropole <span style={{ color: or }}>⟷</span> outre-mer · mêmes lois · mêmes droits · mêmes devoirs
      </div>
    </div>
  )
}

function Lanternes({ étape }) {
  const l = ['avoir une religion', 'ne pas en avoir', 'en changer', 'ne plus en avoir']
  return (
    <div style={{ ...boîte, top: '3%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(46%, 150px), 1fr))', gap: 'clamp(4px, 1vw, 12px)', justifyItems: 'center' }}>
      {l.map((t, k) => {
        const on = étape >= k + 1
        return (
          <div key={t} className="c-lanterne" style={{ textAlign: 'center', animationDelay: `${k * 0.6}s` }}>
            <div style={{ width: 2, height: 'clamp(10px, 3vh, 26px)', background: '#6b5434', margin: '0 auto' }} />
            <div style={{ width: 'clamp(40px, 6vw, 70px)', height: 'clamp(54px, 8.5vw, 96px)', margin: '0 auto', borderRadius: 18, border: '4px solid #7a5a2a', background: on ? 'radial-gradient(circle, #fff6d0, #ffc861)' : '#3a3040', boxShadow: on ? '0 0 40px 14px rgba(255,200,110,.55)' : 'none', transition: 'all 1s' }} />
            <div style={{ marginTop: 8, display: 'inline-block', padding: '4px 12px', borderRadius: 14, background: on ? 'rgba(20,14,30,.85)' : 'rgba(20,14,30,.45)', fontFamily: 'Georgia, serif', fontSize: 'clamp(14px, 2vw, 21px)', color: on ? crème : 'rgba(255,243,196,.35)', transition: 'color 1s, background 1s', border: on ? `1px solid ${or}` : '1px solid transparent' }}>{t}</div>
          </div>
        )
      })}
      {étape >= 5 && <div className="c-apparait" style={{ gridColumn: '1 / -1', marginTop: 4, padding: '5px 14px', borderRadius: 16, background: 'rgba(20,14,30,.85)', fontFamily: 'Georgia, serif', letterSpacing: '.18em', color: or, fontSize: 'clamp(14px, 2.2vw, 22px)' }}>LA LIBERTÉ DE CONSCIENCE</div>}
    </div>
  )
}

function Parchemin({ étape }) {
  return (
    <div style={{ position: 'absolute', inset: '6% 5% 8%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="c-deroule" style={{ width: 'min(100%, 760px)', maxHeight: '100%', overflow: 'hidden', background: 'radial-gradient(ellipse at center, #fbf0d0, #e2c48a)', color: '#3b2a12', borderRadius: 12, border: '5px solid #c9a46a', boxShadow: '0 24px 60px rgba(0,0,0,.6), inset 0 0 60px rgba(120,80,20,.3)', padding: 'clamp(14px, 3vw, 34px)', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ fontSize: 'clamp(11px, 1.6vw, 16px)', letterSpacing: '.16em' }}>DÉCLARATION DES DROITS DE L'HOMME ET DU CITOYEN · 1789</div>
        <div style={{ fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 700, color: '#7a2e1e', margin: '8px 0 10px' }}>Article 10</div>
        {étape >= 1 && <p className="c-plume" style={{ margin: 0, fontStyle: 'italic', fontSize: 'clamp(16px, 2.8vw, 28px)', lineHeight: 1.45 }}>Nul ne doit être inquiété pour ses opinions, même religieuses, pourvu que leur manifestation ne trouble pas l'ordre public établi par la Loi.</p>}
      </div>
    </div>
  )
}

export default function Visuel({ nom, étape, carton }) {
  switch (nom) {
    case 'quatre-mots': return <QuatreMots étape={étape} />
    case 'plan': return <Plan étape={étape} />
    case 'pyramide': return <Pyramide étape={étape} />
    case 'pouvoirs': return <Pouvoirs étape={étape} />
    case 'carton': return <Carton carton={carton} étape={étape} />
    case 'journal': return <Journal étape={étape} />
    case 'fil': return <Fil étape={étape} />
    case 'lanternes': return <Lanternes étape={étape} />
    case 'parchemin': return <Parchemin étape={étape} />
    default: return null
  }
}
