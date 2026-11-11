// Décors du court-métrage de la page 19 (en couches pour la parallaxe) :
// un collège public (les départements) et un lycée public avec son arrêt de
// bus (les régions : lycées, transports publics). Illustrations sans nom réel.
// Sur téléphone, la bande centrale (x ≈ 540 à 1060) reste visible.
import { Defs, Immeuble } from './Decors6'
import { StyleRue, Ciel, Sol, Arbre, Lampadaire, Passants, Horizon } from './Decors14'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const CSS = `
.d19-bus { animation: d19-roule 14s cubic-bezier(.4,0,.3,1) infinite }
.d19-roue { animation: d19-tourne 1s linear infinite; transform-box: fill-box; transform-origin: center }
@keyframes d19-roule { 0% { transform: translateX(-700px) } 35%, 65% { transform: translateX(0) } 100% { transform: translateX(1900px) } }
@keyframes d19-tourne { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .d19-bus, .d19-roue { animation: none } }
`

// Façade d'établissement scolaire : corps principal, enseigne, drapeau, fenêtres.
function Établissement({ enseigne, couleur, étages = 2 }) {
  const haut = 720 - étages * 150 - 40
  return (
    <g>
      <rect x="400" y={haut} width="800" height={720 - haut} fill="#f3ead8" />
      <rect x="390" y={haut - 16} width="820" height="20" fill="#b8a98e" />
      {Array.from({ length: étages }, (_, r) => Array.from({ length: 6 }, (_, c) => {
        if (r === étages - 1 && (c === 2 || c === 3)) return null
        const x = 440 + c * 126, y = haut + 30 + r * 150
        return <g key={`${r}${c}`}><rect x={x} y={y} width="96" height="96" rx="4" fill="#a7c7e1" stroke="#e3d6bc" strokeWidth="6" /><path d={`M${x + 48},${y} L${x + 48},${y + 96} M${x},${y + 48} L${x + 96},${y + 48}`} stroke="#e3d6bc" strokeWidth="4" /></g>
      }))}
      <rect x="610" y={haut + 24} width="380" height="56" rx="8" fill={couleur} />
      <text x="800" y={haut + 63} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="34" fontWeight="900" letterSpacing="6" fill="#fff">{enseigne}</text>
      <text x="800" y={haut + 106} textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" letterSpacing="5" fill="#8a7650">LIBERTÉ · ÉGALITÉ · FRATERNITÉ</text>
      <path d="M720,720 L720,600 Q800,566 880,600 L880,720 Z" fill="#334155" />
      <path d="M800,580 L800,720" stroke="#1e293b" strokeWidth="4" />
      <rect x="797" y={haut - 150} width="6" height="136" fill="#555" />
      <g style={{ transform: `translate(803px, ${haut - 148}px)` }}><g className="c-drapeau-8"><rect x="0" y="0" width="26" height="40" fill="#1d4ed8" /><rect x="26" y="0" width="26" height="40" fill="#fff" /><rect x="52" y="0" width="26" height="40" fill="#dc2626" /></g></g>
      {/* Grille et portail */}
      {[[400, 710], [890, 1200]].map(([a, b]) => <g key={a}><rect x={a} y="664" width={b - a} height="6" fill="#2f3542" />{Array.from({ length: Math.floor((b - a) / 20) }, (_, i) => <rect key={i} x={a + 6 + i * 20} y="664" width="5" height="56" fill="#2f3542" />)}</g>)}
    </g>
  )
}

function Bus() {
  return (
    <g className="d19-bus">
      <g transform="translate(560,600)">
        <rect x="0" y="0" width="480" height="120" rx="18" fill="#0ea5e9" />
        <rect x="0" y="96" width="480" height="24" rx="8" fill="#0369a1" />
        {Array.from({ length: 6 }, (_, i) => <rect key={i} x={22 + i * 72} y="16" width="56" height="44" rx="6" fill="#dbeafe" />)}
        <rect x="440" y="16" width="30" height="70" rx="6" fill="#bfdbfe" />
        <rect x="16" y="70" width="140" height="14" rx="4" fill="#fde68a" />
        {[90, 390].map(x => <g key={x}><circle cx={x} cy="124" r="26" fill="#111827" /><g className="d19-roue"><circle cx={x} cy="124" r="11" fill="#9ca3af" /><rect x={x - 2} y="113" width="4" height="22" fill="#4b5563" /></g></g>)}
      </g>
    </g>
  )
}

function Rue({ couche, quoi }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs /><StyleRue />
      <Ciel id={`d19-ciel-${quoi}`} />
      <Horizon />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs /><StyleRue /><style>{CSS}</style>
      <Sol />
      <Immeuble x={-60} l={360} hh={440} sol={720} teinte="#e9dcc4" />
      <Immeuble x={1300} l={360} hh={420} sol={720} teinte="#efe3cc" />
      {quoi === 'college' ? <Établissement enseigne="COLLÈGE" couleur="#7c3aed" étages={2} /> : <Établissement enseigne="LYCÉE" couleur="#0f766e" étages={3} />}
      <Arbre x={330} r={58} />
      <Arbre x={1270} r={62} />
      {quoi === 'lycee' ? (
        <>
          <g transform="translate(1100,520)"><rect x="0" y="0" width="8" height="200" fill="#2f3542" /><rect x="-30" y="0" width="70" height="44" rx="6" fill="#0ea5e9" /><text x="5" y="30" textAnchor="middle" fontFamily="system-ui" fontSize="24" fontWeight="900" fill="#fff">BUS</text></g>
          <Bus />
        </>
      ) : <Lampadaire x={1180} />}
      <Passants y={716} n={2} échelle={0.6} />
    </svg>
  )
  return (
    <svg {...V}>
      <g opacity=".95">{[[40, 850, 170, -15], [1560, 860, 190, 20]].map(([x, y, r, a], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.3} transform={`rotate(${a} ${x} ${y})`} fill={k % 2 ? '#2f5a2f' : '#3d7a3a'} />)}</g>
    </svg>
  )
}

export default function Decors19({ nom, couche }) {
  if (nom === 'college' || nom === 'lycee') return <Rue couche={couche} quoi={nom} />
  return null
}
