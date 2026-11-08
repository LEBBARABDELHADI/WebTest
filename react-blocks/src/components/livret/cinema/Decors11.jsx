// Décors du court-métrage de la page 11 (en couches pour la parallaxe) :
// le guichet d'accueil de la mairie, un monument religieux classé en
// restauration (façade gothique générique, sans symbole d'un culte précis).
import { Defs } from './Decors6'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const PEAUX = ['#f1c9a5', '#8d5a3b', '#c98e64', '#5a3b22', '#e8b896', '#6b4226']

// Personnes qui attendent leur tour (silhouettes neutres, de toutes origines).
function File({ x0, y, n, échelle = 1 }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + i * 74 * échelle
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${échelle})`}>
            <circle cy="-92" r="22" fill={PEAUX[(i * 2 + 1) % 6]} />
            <path d="M-30,0 C-30,-50 -18,-68 0,-68 C18,-68 30,-50 30,0 Z" fill={['#64748b', '#a16207', '#0f766e', '#7c3aed', '#be123c'][i % 5]} />
          </g>
        )
      })}
    </g>
  )
}

function Guichet({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d11-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef2f7" /><stop offset="1" stopColor="#d9e0ea" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d11-mur)" />
      <rect x="520" y="56" width="560" height="52" rx="6" fill="#1e3a8a" />
      <text x="800" y="90" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" letterSpacing="6" fill="#f2c94c">LIBERTÉ · ÉGALITÉ · FRATERNITÉ</text>
      {[[130, 'ÉTAT CIVIL'], [1150, 'ACCUEIL']].map(([x, t]) => (
        <g key={t}>
          <rect x={x} y="150" width="320" height="64" rx="8" fill="#0f766e" />
          <text x={x + 160} y="192" textAnchor="middle" fontFamily="system-ui" fontSize="28" fontWeight="800" letterSpacing="3" fill="#fff">{t}</text>
        </g>
      ))}
      <g transform="translate(800,190)"><rect x="-110" y="-46" width="220" height="92" rx="10" fill="#111827" /><text y="-10" textAnchor="middle" fontFamily="system-ui" fontSize="20" fill="#9ca3af">TICKET</text><text y="30" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="44" fontWeight="800" fill="#f87171" className="c-scintille">042</text></g>
      <rect x="300" y="250" width="300" height="300" rx="6" fill="#bcd9ee" /><path d="M450,250 L450,550 M300,400 L600,400" stroke="#e5e7eb" strokeWidth="10" />
      <rect x="1000" y="250" width="300" height="300" rx="6" fill="#bcd9ee" /><path d="M1150,250 L1150,550 M1000,400 L1300,400" stroke="#e5e7eb" strokeWidth="10" />
      <File x0={360} y={640} n={4} échelle={0.7} />
      <rect y="640" width="1600" height="260" fill="#cbd5e1" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 150 - 60},900 L${800 + (i - 6) * 40},640`} stroke="rgba(0,0,0,.06)" strokeWidth="3" />)}
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <path d="M980,640 L1620,640 L1620,900 L940,900 Z" fill="#475569" />
      <rect x="970" y="610" width="660" height="40" rx="6" fill="#94a3b8" />
      <rect x="1000" y="470" width="600" height="140" fill="rgba(186,230,253,.35)" stroke="#e2e8f0" strokeWidth="6" />
      <g transform="translate(1260,560)"><rect x="-80" y="0" width="160" height="50" rx="6" fill="#1f2937" /><rect x="-70" y="6" width="140" height="38" rx="4" fill="#60a5fa" opacity=".85" /></g>
      <g transform="translate(140,690)"><path d="M-46,0 L46,0 L36,-80 L-36,-80 Z" fill="#c2410c" />{[-30, 0, 30].map((dx, k) => <ellipse key={k} cx={dx} cy={-140 - (k % 2) * 30} rx="30" ry="62" transform={`rotate(${dx / 2} ${dx} ${-140 - (k % 2) * 30})`} fill={['#3f7a3f', '#4d8f48', '#5a9e52'][k]} />)}</g>
    </svg>
  )
  return null
}

// Façade gothique (rosace, arcs brisés, tours) avec un échafaudage de restauration.
function Monument({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d11-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc0f5" /><stop offset=".7" stopColor="#dff0fc" /><stop offset="1" stopColor="#f6efe0" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d11-ciel)" />
      <circle cx="1320" cy="150" r="120" fill="url(#d6-soleil)" opacity=".8" />
      {[[260, 150, 1], [980, 110, 0.8]].map(([x, y, s], k) => <g key={k} opacity=".7" filter="url(#d6-flou)" className="c-nuage" style={{ animationDuration: `${80 + k * 30}s` }}><ellipse cx={x} cy={y} rx={170 * s} ry={30 * s} fill="#fff" /><ellipse cx={x + 80} cy={y - 18} rx={100 * s} ry={26 * s} fill="#fff" /></g>)}
      <g fill="#d9cdb4" stroke="#b9a988" strokeWidth="3">
        {[470, 1010].map(x => (
          <g key={x}>
            <rect x={x} y="170" width="120" height="560" />
            <path d={`M${x - 6},172 L${x + 60},70 L${x + 126},172 Z`} />
            {[230, 330, 430].map(y => <path key={y} d={`M${x + 40},${y + 70} L${x + 40},${y + 20} Q${x + 60},${y} ${x + 80},${y + 20} L${x + 80},${y + 70} Z`} fill="#7c8aa3" />)}
          </g>
        ))}
        <rect x="590" y="260" width="420" height="470" />
        <path d="M586,262 L800,150 L1014,262 Z" />
        <circle cx="800" cy="380" r="92" fill="#e9dfc8" />
      </g>
      <g>
        <circle cx="800" cy="380" r="76" fill="#3b5b9a" />
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M800,380 L${800 + Math.cos(a) * 76},${380 + Math.sin(a) * 76}`} stroke="#e9dfc8" strokeWidth="6" /> })}
        {Array.from({ length: 12 }, (_, i) => { const a = ((i + 0.5) / 12) * Math.PI * 2; return <circle key={i} cx={800 + Math.cos(a) * 52} cy={380 + Math.sin(a) * 52} r="9" fill={['#dc2626', '#f2c94c', '#16a34a'][i % 3]} opacity=".85" /> })}
        <circle cx="800" cy="380" r="18" fill="#f2c94c" />
      </g>
      {[640, 800, 960].map((x, k) => <path key={x} d={`M${x - (k === 1 ? 70 : 46)},730 L${x - (k === 1 ? 70 : 46)},${k === 1 ? 560 : 600} Q${x},${k === 1 ? 470 : 530} ${x + (k === 1 ? 70 : 46)},${k === 1 ? 560 : 600} L${x + (k === 1 ? 70 : 46)},730 Z`} fill="#5b4a3c" />)}
      <rect y="730" width="1600" height="170" fill="#cbbfa8" />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <g stroke="#9ca3af" strokeWidth="8">
        {[1000, 1080, 1160, 1240].map(x => <path key={x} d={`M${x},740 L${x},160`} />)}
        {[260, 380, 500, 620].map(y => <path key={y} d={`M990,${y} L1250,${y}`} />)}
        <path d="M1000,620 L1240,260 M1000,380 L1240,740" strokeWidth="5" />
      </g>
      {[260, 380, 500, 620].map(y => <rect key={y} x="990" y={y - 8} width="260" height="12" fill="#a16207" />)}
      <g transform="translate(330,690)">
        <rect x="-150" y="-70" width="300" height="140" rx="10" fill="#1e3a8a" />
        <text y="-22" textAnchor="middle" fontFamily="Georgia, serif" fontSize="28" fill="#f2c94c">MONUMENT HISTORIQUE</text>
        <text y="20" textAnchor="middle" fontFamily="system-ui" fontSize="22" fontWeight="800" fill="#fff">classé au patrimoine</text>
        <text y="52" textAnchor="middle" fontFamily="system-ui" fontSize="18" fill="#bfdbfe">Travaux de restauration</text>
      </g>
      <rect x="168" y="760" width="14" height="140" fill="#374151" /><rect x="478" y="760" width="14" height="140" fill="#374151" />
    </svg>
  )
  return null
}

export default function Decors11({ nom, couche }) {
  if (nom === 'guichet-mairie') return <Guichet couche={couche} />
  if (nom === 'monument') return <Monument couche={couche} />
  return null
}
