// Décor du court-métrage de la page 12 (en couches pour la parallaxe) : un
// marché en ville, l'espace public par excellence (étals, passants de toutes
// origines dont certains portent un signe religieux, arrêt de tram).
import { Defs, Immeuble } from './Decors6'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const PEAUX = ['#f1c9a5', '#8d5a3b', '#c98e64', '#5a3b22', '#e8b896', '#6b4226', '#f4d7bc']
const HABITS = ['#2563eb', '#be123c', '#0f766e', '#a16207', '#7c3aed', '#475569', '#ea580c']

// Un passant ; « signe » : foulard, kippa, turban, croix… (simples formes).
function Passant({ x, y, e = 1, k, signe }) {
  const peau = PEAUX[k % PEAUX.length], habit = HABITS[k % HABITS.length]
  return (
    <g transform={`translate(${x},${y}) scale(${e})`}>
      <path d="M-32,0 C-32,-56 -20,-74 0,-74 C20,-74 32,-56 32,0 Z" fill={habit} />
      <circle cy="-96" r="22" fill={peau} />
      {signe === 'foulard' && <path d="M-25,-96 C-26,-126 26,-126 25,-96 C25,-78 18,-70 0,-68 C-18,-70 -25,-78 -25,-96 Z M-16,-98 C-16,-84 16,-84 16,-98 C16,-110 -16,-110 -16,-98 Z" fill="#7c3aed" fillRule="evenodd" />}
      {signe === 'kippa' && <path d="M-12,-115 Q0,-124 12,-115 Z" fill="#1e3a8a" />}
      {signe === 'turban' && <path d="M-24,-104 C-26,-128 26,-128 24,-104 C14,-110 -14,-110 -24,-104 Z" fill="#ea580c" />}
      {signe === 'croix' && <g fill="#f2c94c"><rect x="-2" y="-62" width="4" height="16" /><rect x="-6" y="-58" width="12" height="4" /></g>}
      {!signe && k % 3 === 0 && <path d="M-22,-108 C-22,-124 22,-124 22,-108 Z" fill="#334155" />}
    </g>
  )
}

function Étal({ x, couleur, fruits }) {
  return (
    <g transform={`translate(${x},0)`}>
      <rect x="-8" y="520" width="10" height="230" fill="#6b4a2e" /><rect x="218" y="520" width="10" height="230" fill="#6b4a2e" />
      <path d="M-30,520 L250,520 L230,470 L-10,470 Z" fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${-30 + i * 40},520 L${10 + i * 40},520 L${16 + i * 34},470 L${-10 + i * 34},470 Z`} fill={i % 2 ? couleur : '#fff'} />)}
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${-30 + i * 40},520 q20,24 40,0`} fill={i % 2 ? couleur : '#fff'} />)}
      <rect x="-14" y="660" width="248" height="30" rx="4" fill="#a16207" />
      {fruits.map((f, i) => <g key={i}><rect x={-4 + i * 80} y="630" width="70" height="34" rx="4" fill="#c08a4a" />{[0, 1, 2, 3].map(j => <circle key={j} cx={8 + i * 80 + j * 15} cy={630} r="10" fill={f} />)}</g>)}
    </g>
  )
}

function Marché({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d12-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fb3f2" /><stop offset=".75" stopColor="#dbeffd" /><stop offset="1" stopColor="#f6efe0" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d12-ciel)" />
      <circle cx="1240" cy="140" r="120" fill="url(#d6-soleil)" opacity=".85" />
      {[[300, 140, 1], [920, 100, 0.8]].map(([x, y, s], k) => <g key={k} opacity=".75" filter="url(#d6-flou)" className="c-nuage" style={{ animationDuration: `${80 + k * 30}s` }}><ellipse cx={x} cy={y} rx={170 * s} ry={30 * s} fill="#fff" /><ellipse cx={x + 80} cy={y - 18} rx={100 * s} ry={26 * s} fill="#fff" /></g>)}
      <Immeuble x={-40} l={420} hh={480} sol={720} />
      <Immeuble x={380} l={420} hh={420} sol={720} teinte="#efe3cc" />
      <Immeuble x={800} l={420} hh={460} sol={720} teinte="#e4d3b8" />
      <Immeuble x={1220} l={420} hh={500} sol={720} />
      <g transform="translate(1420,560)"><rect x="-6" y="0" width="12" height="170" fill="#334155" /><rect x="-60" y="-10" width="120" height="44" rx="6" fill="#16a34a" /><text y="20" textAnchor="middle" fontFamily="system-ui" fontSize="22" fontWeight="900" fill="#fff">TRAM</text></g>
      {[[200, 10], [560, 12], [900, 14], [1150, 16]].map(([x, k]) => <Passant key={x} x={x} y={735} e={0.55} k={k} />)}
      <rect y="720" width="1600" height="180" fill="#cbbfa8" />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <Étal x={150} couleur="#dc2626" fruits={['#ef4444', '#f59e0b', '#84cc16']} />
      <Étal x={1230} couleur="#2563eb" fruits={['#a3e635', '#f97316', '#7c3aed']} />
      <Passant x={560} y={760} e={0.85} k={1} signe="foulard" />
      <Passant x={680} y={770} e={0.8} k={4} signe="kippa" />
      <Passant x={920} y={765} e={0.85} k={3} signe="turban" />
      <Passant x={1040} y={770} e={0.8} k={0} signe="croix" />
      <Passant x={800} y={775} e={0.78} k={6} />
    </svg>
  )
  return (
    <svg {...V}><g opacity=".9">{[[70, 860, '#ef4444'], [1530, 870, '#f59e0b']].map(([x, y, c]) => <g key={x}><rect x={x - 60} y={y - 50} width="120" height="70" rx="6" fill="#c08a4a" />{[0, 1, 2].map(j => <circle key={j} cx={x - 34 + j * 34} cy={y - 50} r="20" fill={c} />)}</g>)}</g></svg>
  )
}

export default function Decors12({ nom, couche }) {
  if (nom === 'marche') return <Marché couche={couche} />
  return null
}
