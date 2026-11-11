// Décors du court-métrage de la page 16 (en couches pour la parallaxe) :
// deux illustrations de « l'affiche de Zoé », sans nom ni lieu réel :
// un palais avec sa cour et son drapeau (le Président, le Gouvernement), et
// un hémicycle (le Parlement). Sur téléphone, la bande centrale (x ≈ 540 à
// 1060) reste visible : le pavillon central et la tribune y sont placés.
import { Defs, Immeuble } from './Decors6'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const CSS = `
.d16-lustre { animation: d16-lueur 4s ease-in-out infinite }
.d16-public { animation: d16-bouge 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100% }
@keyframes d16-lueur { 0%, 100% { opacity: .75 } 50% { opacity: 1 } }
@keyframes d16-bouge { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
@media (prefers-reduced-motion: reduce) { .d16-lustre, .d16-public { animation: none } }
`

// Fenêtre haute à petits carreaux.
function Fenêtre({ x, y, l = 54, h = 96, arc = true }) {
  return (
    <g>
      <path d={`M${x},${y + h} L${x},${y + (arc ? l / 2 : 0)} ${arc ? `Q${x + l / 2},${y - l / 4} ${x + l},${y + l / 2}` : `L${x + l},${y}`} L${x + l},${y + h} Z`} fill="#a9c4dd" stroke="#e9dcc0" strokeWidth="5" />
      <path d={`M${x + l / 2},${y + 4} L${x + l / 2},${y + h} M${x},${y + h * 0.45} L${x + l},${y + h * 0.45} M${x},${y + h * 0.75} L${x + l},${y + h * 0.75}`} stroke="#e9dcc0" strokeWidth="3" />
    </g>
  )
}

function Palais({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <linearGradient id="d16-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6aaee8" /><stop offset=".7" stopColor="#d4ecff" /><stop offset="1" stopColor="#f5f0e2" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d16-ciel)" />
      <circle cx="1270" cy="150" r="150" fill="url(#d6-soleil)" opacity=".8" />
      {[[240, 140, 1.1], [900, 90, 0.9], [1430, 220, 1.2]].map(([x, y, s], k) => <g key={k} opacity=".78" filter="url(#d6-flou)" className="c-nuage" style={{ animationDuration: `${70 + k * 25}s` }}><ellipse cx={x} cy={y} rx={170 * s} ry={32 * s} fill="#fff" /><ellipse cx={x + 80} cy={y - 18} rx={100 * s} ry={28 * s} fill="#fff" /></g>)}
      <g opacity=".85"><Immeuble x={-40} l={330} hh={420} sol={700} /><Immeuble x={1310} l={340} hh={440} sol={700} teinte="#efe3cc" /></g>
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={i * 140 + 20} cy={560 + (i % 3) * 14} r={70 + (i % 4) * 14} fill={['#4f8a46', '#5f9e52', '#3f7339'][i % 3]} opacity=".9" />)}
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      {/* Cour en gravier, en perspective */}
      <rect y="700" width="1600" height="200" fill="#e6dac2" />
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 110 - 60},900 L${800 + (i - 8) * 30},700`} stroke="rgba(120,100,70,.14)" strokeWidth="2" />)}
      <path d="M760,700 L840,700 L940,900 L660,900 Z" fill="#b91c1c" opacity=".85" />
      {/* Ailes */}
      {[[300, 560], [1040, 1300]].map(([a, b]) => (
        <g key={a}>
          <rect x={a} y="340" width={b - a} height="360" fill="url(#d6-pierre)" />
          <path d={`M${a - 10},342 L${b + 10},342 L${b - 20},286 L${a + 20},286 Z`} fill="#5b6b80" />
          {[0, 1, 2].map(c => [0, 1].map(r => <Fenêtre key={`${c}${r}`} x={a + 30 + c * 80} y={372 + r * 160} />))}
        </g>
      ))}
      {/* Pavillon central */}
      <rect x="560" y="250" width="480" height="450" fill="url(#d6-pierre)" />
      <path d="M548,252 L1052,252 L1020,196 L580,196 Z" fill="#4f5d72" />
      <path d="M600,254 L1000,254 L800,180 Z" fill="#efe3c8" stroke="#c2ad86" strokeWidth="4" />
      <circle cx="800" cy="226" r="16" fill="#d9c49a" stroke="#b39a6c" strokeWidth="3" />
      {[620, 700, 880, 960].map(x => <rect key={x} x={x} y="270" width="22" height="430" fill="#ece0c6" stroke="#cbb791" strokeWidth="2" />)}
      {[0, 1].map(r => [0, 1, 2].map(c => (c === 1 && r === 1 ? null : <Fenêtre key={`p${r}${c}`} x={652 + c * 120 + (c === 1 ? 0 : 0)} y={300 + r * 170} l={60} h={110} />)))}
      {/* Porte, perron, lanternes */}
      <path d="M752,700 L752,560 Q800,526 848,560 L848,700 Z" fill="#2b3a55" />
      <path d="M800,540 L800,700" stroke="#1d2a40" strokeWidth="3" />
      {[0, 1, 2].map(k => <rect key={k} x={700 - k * 20} y={688 + k * 8} width={200 + k * 40} height="8" fill="#d8ccb2" />)}
      {[720, 880].map(x => <g key={x}><rect x={x - 3} y="610" width="6" height="80" fill="#2f3542" /><rect x={x - 10} y="590" width="20" height="24" rx="3" fill="#fde68a" className="d16-lustre" /></g>)}
      {/* Drapeau sur le toit */}
      <rect x="797" y="10" width="6" height="176" fill="#555" />
      <g className="c-drapeau-6"><rect x="803" y="12" width="26" height="40" fill="#1d4ed8" /><rect x="829" y="12" width="26" height="40" fill="#fff" /><rect x="855" y="12" width="26" height="40" fill="#dc2626" /></g>
      {/* Massifs taillés */}
      {[470, 1130].map(x => <g key={x}><ellipse cx={x} cy="700" rx="50" ry="16" fill="rgba(0,0,0,.15)" /><circle cx={x} cy="660" r="38" fill="#3f7339" /><rect x={x - 26} y="676" width="52" height="24" fill="#8a5a35" /></g>)}
    </svg>
  )
  return (
    <svg {...V}>
      {/* Grille dorée au premier plan */}
      <rect y="842" width="1600" height="12" fill="#2b2b2b" />
      {Array.from({ length: 30 }, (_, i) => (i > 11 && i < 18 ? null : <g key={i}><rect x={i * 56} y="720" width="8" height="134" fill="#2b2b2b" /><path d={`M${i * 56 - 4},724 L${i * 56 + 4},700 L${i * 56 + 12},724 Z`} fill="#d4a72c" /></g>))}
    </svg>
  )
}

function Hémicycle({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <linearGradient id="d16-salle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b1d1d" /><stop offset=".55" stopColor="#5c2a22" /><stop offset="1" stopColor="#2a1512" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d16-salle)" />
      {/* Verrière et lumière */}
      <path d="M260,0 L1340,0 L1180,120 L420,120 Z" fill="#f6e7c4" opacity=".55" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${300 + i * 125},0 L${440 + i * 92},120`} stroke="#7a5a3a" strokeWidth="4" opacity=".6" />)}
      <g className="c-rayons">{[0, 1, 2].map(k => <path key={k} d={`M${600 + k * 130},120 L${470 + k * 170},900 L${640 + k * 170},900 L${700 + k * 130},120 Z`} fill="url(#d6-rayon)" opacity=".35" />)}</g>
      {/* Colonnes et galerie du public */}
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={90 + i * 180} y="130" width="26" height="300" fill="#c9a97a" opacity=".85" />)}
      <path d="M0,300 Q800,150 1600,300 L1600,340 Q800,190 0,340 Z" fill="#7a3b2a" />
      {Array.from({ length: 22 }, (_, i) => { const x = 60 + i * 70; const y = 300 - Math.sin((x / 1600) * Math.PI) * 138; return <g key={i} className="d16-public" style={{ animationDelay: `${(i % 5) * 0.4}s` }}><circle cx={x} cy={y - 22} r="11" fill="#2a1a14" opacity=".75" /><rect x={x - 12} y={y - 12} width="24" height="16" rx="6" fill="#2a1a14" opacity=".75" /></g> })}
      <circle cx="800" cy="210" r="58" fill="url(#d6-halo)" className="d16-lustre" />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      {/* Gradins en arc de cercle */}
      {Array.from({ length: 8 }, (_, k) => {
        const r = 360 + k * 70
        const d = `M${800 - r},900 A${r},${r} 0 0 1 ${800 + r},900`
        return (
          <g key={k}>
            <path d={d} fill="none" stroke={k % 2 ? '#a11d1d' : '#b62424'} strokeWidth="50" />
            <path d={d} fill="none" stroke="#7f1414" strokeWidth="38" strokeDasharray="20 10" opacity=".65" />
            <path d={`M${800 - r + 25},900 A${r - 25},${r - 25} 0 0 1 ${800 + r - 25},900`} fill="none" stroke="#8a5a35" strokeWidth="6" />
          </g>
        )
      })}
      {/* Tribune et bureau */}
      <rect x="610" y="470" width="380" height="110" rx="8" fill="#7a4a2a" />
      <rect x="610" y="470" width="380" height="18" rx="6" fill="#9a6a3e" />
      <g transform="translate(560,330)">{['#1d4ed8', '#f8fafc', '#dc2626'].map((c, k) => <rect key={c} x={k * 26} y="0" width="26" height="130" fill={c} />)}</g>
      <rect x="556" y="320" width="6" height="250" fill="#c9a97a" />
      <rect x="700" y="580" width="200" height="130" rx="6" fill="#8a5a35" />
      <rect x="720" y="600" width="160" height="16" rx="4" fill="#b07a46" />
      <rect x="790" y="548" width="20" height="36" rx="4" fill="#3a3a3a" /><circle cx="800" cy="546" r="9" fill="#555" />
    </svg>
  )
  return null
}

export default function Decors16({ nom, couche }) {
  if (nom === 'palais') return <Palais couche={couche} />
  if (nom === 'hemicycle') return <Hémicycle couche={couche} />
  return null
}
