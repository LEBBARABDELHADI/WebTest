// Décors du court-métrage de la page 13 (en couches pour la parallaxe) :
// l'atelier de l'entreprise (sécurité), la salle de classe d'une école
// publique (tableau, pupitres, affiche de la Charte de la laïcité à l'École).
import { Defs } from './Decors6'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }

function Atelier({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d13-hangar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3f4a5a" /><stop offset="1" stopColor="#7b8796" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d13-hangar)" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 220 - 60},0 L${i * 220 + 40},140`} stroke="#2b3440" strokeWidth="10" />)}
      {[300, 800, 1300].map(x => <g key={x}><rect x={x - 6} y="0" width="12" height="120" fill="#1f2937" /><path d={`M${x - 70},120 L${x + 70},120 L${x + 40},150 L${x - 40},150 Z`} fill="#111827" /><ellipse cx={x} cy="160" rx="140" ry="36" fill="rgba(255,236,170,.35)" className="c-fenetre" /></g>)}
      {[120, 1180].map(x => (
        <g key={x}>
          {[0, 1, 2].map(r => <rect key={r} x={x} y={250 + r * 140} width="300" height="14" fill="#f59e0b" />)}
          <rect x={x} y="240" width="14" height="440" fill="#1d4ed8" /><rect x={x + 286} y="240" width="14" height="440" fill="#1d4ed8" />
          {[0, 1, 2].map(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={x + 22 + c * 92} y={180 + r * 140} width="80" height="70" fill={['#c08a4a', '#a16207', '#d9a466'][(r + c) % 3]} />))}
        </g>
      ))}
      <g transform="translate(800,300)">
        <rect x="-150" y="-60" width="300" height="120" rx="10" fill="#1e3a8a" />
        <circle cx="-95" cy="0" r="34" fill="#2563eb" stroke="#fff" strokeWidth="5" /><path d="M-118,6 C-118,-26 -72,-26 -72,6 Z" fill="#fff" /><rect x="-122" y="4" width="54" height="8" rx="3" fill="#fff" />
        <text x="30" y="-8" textAnchor="middle" fontFamily="system-ui" fontSize="22" fontWeight="900" fill="#fff">PORT DU CASQUE</text>
        <text x="30" y="22" textAnchor="middle" fontFamily="system-ui" fontSize="22" fontWeight="900" fill="#fde68a">OBLIGATOIRE</text>
      </g>
      <rect y="690" width="1600" height="210" fill="#9ca3af" />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 110} y="700" width="60" height="12" fill={i % 2 ? '#111827' : '#f59e0b'} transform={`skewX(-30)`} />)}
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <g transform="translate(1010,700)">
        <rect x="-120" y="-120" width="190" height="90" rx="10" fill="#f59e0b" />
        <rect x="-110" y="-200" width="90" height="90" rx="8" fill="none" stroke="#374151" strokeWidth="10" />
        <rect x="70" y="-260" width="14" height="240" fill="#374151" /><rect x="84" y="-60" width="80" height="10" fill="#374151" />
        <circle cx="-80" cy="-20" r="26" fill="#111827" /><circle cx="30" cy="-20" r="26" fill="#111827" />
      </g>
      <g transform="translate(520,690)"><path d="M-40,0 L40,0 L32,-34 L-32,-34 Z" fill="#f59e0b" /><path d="M-30,-34 C-30,-70 30,-70 30,-34 Z" fill="#fbbf24" /></g>
    </svg>
  )
  return null
}

function SalleClasse({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d13-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fdf3df" /><stop offset="1" stopColor="#efe0c2" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d13-mur)" />
      <rect x="430" y="120" width="740" height="330" rx="8" fill="#1f4d3a" stroke="#8a5a35" strokeWidth="16" />
      <text x="470" y="190" fontFamily="Georgia, serif" fontSize="34" fill="rgba(255,255,255,.88)">Lundi</text>
      <text x="470" y="250" fontFamily="Georgia, serif" fontSize="28" fill="rgba(255,255,255,.75)">Sciences · Sport · Lecture</text>
      <path d="M470,300 L900,300 M470,350 L760,350" stroke="rgba(255,255,255,.45)" strokeWidth="5" />
      <g transform="translate(1310,150)">
        <rect x="-110" y="0" width="220" height="290" rx="6" fill="#fff" stroke="#1e3a8a" strokeWidth="6" />
        <rect x="-110" y="0" width="220" height="54" fill="#1e3a8a" />
        <text y="24" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fill="#fff">Charte de la laïcité</text>
        <text y="45" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fill="#fff">à l'École</text>
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x="-86" y={74 + i * 26} width={i % 3 ? 172 : 130} height="9" rx="4" fill="#cbd5e1" />)}
        <g>{['#1d4ed8', '#f8fafc', '#dc2626'].map((c, k) => <rect key={c} x={-24 + k * 16} y="268" width="16" height="12" fill={c} stroke="#cbd5e1" strokeWidth=".5" />)}</g>
      </g>
      <g transform="translate(220,150)">
        <rect x="-120" y="0" width="240" height="190" rx="6" fill="#bcd9ee" />
        <path d="M-120,95 L120,95 M0,0 L0,190" stroke="#fdf3df" strokeWidth="10" />
      </g>
      <g transform="translate(220,430)"><rect x="-90" y="0" width="180" height="120" rx="6" fill="#fff" stroke="#94a3b8" strokeWidth="4" /><path d="M-60,90 L-30,40 L-10,60 L20,20 L60,90 Z" fill="#7cc48f" /><circle cx="44" cy="30" r="10" fill="#f59e0b" /></g>
      <rect y="640" width="1600" height="260" fill="#c08a5a" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 150 - 60},900 L${800 + (i - 6) * 40},640`} stroke="rgba(80,40,10,.15)" strokeWidth="3" />)}
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      {[[380, 700], [800, 690], [1220, 700]].map(([x, y]) => (
        <g key={x} transform={`translate(${x},${y})`}>
          <rect x="-130" y="0" width="260" height="22" rx="6" fill="#e9c58f" />
          <rect x="-120" y="22" width="12" height="90" fill="#6b7280" /><rect x="108" y="22" width="12" height="90" fill="#6b7280" />
          <rect x="-70" y="-14" width="70" height="14" rx="3" fill="#fff" /><rect x="10" y="-8" width="40" height="8" rx="3" fill="#ef4444" />
        </g>
      ))}
    </svg>
  )
  return null
}

export default function Decors13({ nom, couche }) {
  if (nom === 'atelier') return <Atelier couche={couche} />
  if (nom === 'salle-classe') return <SalleClasse couche={couche} />
  return null
}
