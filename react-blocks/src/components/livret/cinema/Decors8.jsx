// Décors du court-métrage de la page 8 (en couches pour la parallaxe) :
// la place de la mairie un 14 Juillet (jour, soir et feu d'artifice),
// Paris en 1789-1790, la salle de la mairie avec le buste de Marianne.
import Decors6, { Defs } from './Decors6'
import { Particules } from './Decors10'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const TRICOLORE = ['#1d4ed8', '#f8fafc', '#dc2626']

// Guirlande de fanions bleu, blanc, rouge, en arc.
function Guirlande({ y0 = 150, creux = 300, n = 28 }) {
  const pt = u => [(1 - u) ** 2 * -20 + 2 * u * (1 - u) * 800 + u * u * 1620, (1 - u) ** 2 * y0 + 2 * u * (1 - u) * (y0 + creux) + u * u * y0]
  const [ax, ay] = pt(0), [mx, my] = [800, y0 + creux], [bx, by] = pt(1)
  return (
    <g>
      <path d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`} stroke="#3f3f46" strokeWidth="3" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pt((i + 0.5) / n)
        return <path key={i} d={`M${x - 20},${y} L${x + 20},${y} L${x},${y + 42} Z`} fill={TRICOLORE[i % 3]} stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
      })}
    </g>
  )
}

// Grand drapeau fixé à la façade, qui ondule (le bleu côté hampe).
function GrandDrapeau() {
  return (
    <g>
      <path d="M856,262 L900,100" stroke="#4b5563" strokeWidth="8" strokeLinecap="round" />
      <circle cx="900" cy="100" r="8" fill="#d4a017" />
      <g transform="translate(898,104)">
        <g className="c-drapeau-8">
          {TRICOLORE.map((c, k) => <rect key={c} x={k * 78} y="0" width="80" height="150" fill={c} />)}
          <rect x="0" y="0" width="234" height="150" fill="url(#d8-pli)" />
        </g>
      </g>
    </g>
  )
}

// Feu d'artifice : gerbes qui éclosent l'une après l'autre.
function Feux() {
  const gerbes = [[330, 170, '#f87171', 0], [1240, 140, '#93c5fd', 0.9], [640, 90, '#fde68a', 1.7], [1460, 260, '#f0abfc', 2.4], [1000, 70, '#86efac', 3.1]]
  return (
    <g style={{ mixBlendMode: 'screen' }}>
      {gerbes.map(([x, y, c, d], k) => (
        <g key={k} className="c-feu" style={{ animationDelay: `${d}s` }}>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            return <path key={i} d={`M${x + Math.cos(a) * 18},${y + Math.sin(a) * 18} L${x + Math.cos(a) * 130},${y + Math.sin(a) * 130}`} stroke={c} strokeWidth="7" strokeLinecap="round" />
          })}
          <circle cx={x} cy={y} r="10" fill="#fff" opacity=".9" />
        </g>
      ))}
    </g>
  )
}

// Les enfants de l'école, devant la mairie, avec leurs flûtes.
function Chorale() {
  const peaux = ['#f1c9a5', '#8d5a3b', '#c98e64', '#5a3b22', '#e8b896', '#6b4226', '#f4d7bc']
  return (
    <g>
      {peaux.map((p, i) => {
        const x = 600 + i * 66, y = 700 - (i % 2) * 10
        return (
          <g key={i}>
            <circle cx={x} cy={y - 58} r="15" fill={p} />
            <path d={`M${x - 20},${y + 10} C${x - 20},${y - 26} ${x - 12},${y - 40} ${x},${y - 40} C${x + 12},${y - 40} ${x + 20},${y - 26} ${x + 20},${y + 10} Z`} fill={['#3b82f6', '#f8fafc', '#ef4444'][i % 3]} />
            <path d={`M${x + 4},${y - 46} L${x + 22},${y - 22}`} stroke="#5b3a1e" strokeWidth="5" strokeLinecap="round" />
          </g>
        )
      })}
      {[0, 1, 2, 3].map(k => <text key={k} x={620 + k * 110} y={590 - (k % 2) * 30} fontSize="40" fill="#1e3a8a" className="c-note" style={{ animationDelay: `${k * 0.5}s` }}>{k % 2 ? '♫' : '♪'}</text>)}
    </g>
  )
}

function PlaceFête({ couche, soir, visuel }) {
  const base = soir ? 'place-mairie-soir' : 'place-mairie'
  if (couche === 'fond') return (
    <>
      <Decors6 nom={base} couche="fond" />
    </>
  )
  if (couche === 'milieu') return (
    <>
      <Decors6 nom={base} couche="milieu" />
      <svg {...V}>
        <defs><linearGradient id="d8-pli" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="rgba(0,0,0,0)" /><stop offset=".3" stopColor="rgba(0,0,0,.14)" /><stop offset=".55" stopColor="rgba(255,255,255,.12)" /><stop offset=".8" stopColor="rgba(0,0,0,.12)" /><stop offset="1" stopColor="rgba(0,0,0,0)" /></linearGradient></defs>
        <Guirlande y0={120} creux={260} />
        <GrandDrapeau />
        {visuel === 'marseillaise' && <Chorale />}
        {soir && <Feux />}
        {soir && [260, 560, 1040, 1340].map((x, k) => <g key={x}><circle cx={x} cy={300 + (k % 2) * 40} r="22" fill="#ffd38a" className="c-bougie-lum" /><circle cx={x} cy={300 + (k % 2) * 40} r="60" fill="url(#d6-halo)" /></g>)}
      </svg>
    </>
  )
  return <Decors6 nom={base} couche="avant" />
}

// Paris, 1789 (fumée, forteresse) puis 1790 (la fête) : image d'archive.
function Bastille({ couche, étape }) {
  const fête = étape >= 2
  const archive = { ...V.style, filter: 'sepia(.55) contrast(1.05)', transition: 'filter 1.4s' }
  if (couche === 'fond') return (
    <svg {...V} style={archive}><Defs />
      <linearGradient id="d8-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={fête ? '#7aa7d6' : '#3b2a26'} /><stop offset="1" stopColor={fête ? '#f3e3c3' : '#c2703d'} /></linearGradient>
      <rect width="1600" height="900" fill="url(#d8-ciel)" />
      {!fête && [[300, 220, 1.3], [900, 160, 1.1], [1350, 260, 1.4]].map(([x, y, s], k) => <g key={k} opacity=".7" filter="url(#d6-flou)" className="c-nuage" style={{ animationDuration: `${40 + k * 15}s` }}><ellipse cx={x} cy={y} rx={220 * s} ry={60 * s} fill="#6b5b53" /><ellipse cx={x + 90} cy={y - 30} rx={120 * s} ry={50 * s} fill="#7c6a60" /></g>)}
      {fête && <circle cx="1250" cy="170" r="120" fill="url(#d6-soleil)" opacity=".8" />}
      <g opacity=".55">{Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 120 - 30} y={560 + (i % 3) * 30} width="110" height="400" fill="#2a1f1a" />)}</g>
    </svg>
  )
  if (couche === 'milieu') {
    const tours = [380, 620, 980, 1220]
    return (
      <svg {...V} style={archive}><Defs />
        <g opacity={fête ? 0.12 : 1} style={{ transition: 'opacity 1.6s' }}>
          <rect x="380" y="330" width="990" height="320" fill="#5b4a3c" />
          {tours.map(x => (
            <g key={x}>
              <rect x={x - 75} y="250" width="150" height="400" rx="18" fill="#6e5a48" />
              {Array.from({ length: 5 }, (_, i) => <rect key={i} x={x - 72 + i * 30} y="230" width="20" height="26" fill="#6e5a48" />)}
              {[300, 400, 500].map(y => <rect key={y} x={x - 5} y={y} width="10" height="34" fill="#2a1f1a" />)}
            </g>
          ))}
        </g>
        {fête && <Guirlande y0={260} creux={180} n={24} />}
        {Array.from({ length: 22 }, (_, i) => {
          const x = 40 + i * 72, y = 760 + (i % 3) * 26
          return (
            <g key={i}>
              <circle cx={x} cy={y - 70} r="20" fill="#1f1612" />
              <path d={`M${x - 30},${y + 140} C${x - 30},${y - 30} ${x - 18},${y - 48} ${x},${y - 48} C${x + 18},${y - 48} ${x + 30},${y - 30} ${x + 30},${y + 140} Z`} fill="#1f1612" />
              {i % 3 === 0 && <path d={`M${x + 20},${y - 30} L${x + 40},${y - 130}`} stroke="#1f1612" strokeWidth="10" strokeLinecap="round" />}
              {fête && i % 3 === 0 && <g>{TRICOLORE.map((c, k) => <rect key={c} x={x + 40 + k * 18} y={y - 150} width="18" height="34" fill={c} />)}</g>}
            </g>
          )
        })}
      </svg>
    )
  }
  return <Particules type="poussiere" n={14} />
}

// Salle de la mairie : buste de Marianne, exposition sur les symboles.
function SalleMairie({ couche, étape, visuel }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d8-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3ead8" /><stop offset="1" stopColor="#e2d3b8" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d8-mur)" />
      {[[140, 430], [1170, 1460]].map(([a, b]) => (
        <g key={a}>
          <rect x={a} y="140" width={b - a} height="420" rx="4" fill="#bcd9ee" />
          <path d={`M${(a + b) / 2},140 L${(a + b) / 2},560 M${a},350 L${b},350`} stroke="#e8dcc4" strokeWidth="10" />
          <path d={`M${a - 40},120 C${a + 10},300 ${a - 10},460 ${a + 20},580 L${a - 50},580 Z`} fill="#1e3a8a" />
          <path d={`M${b + 40},120 C${b - 10},300 ${b + 10},460 ${b - 20},580 L${b + 50},580 Z`} fill="#1e3a8a" />
        </g>
      ))}
      <rect x="520" y="60" width="560" height="54" rx="6" fill="#1e3a8a" />
      <text x="800" y="96" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" letterSpacing="6" fill="#f2c94c">LIBERTÉ · ÉGALITÉ · FRATERNITÉ</text>
      <rect y="580" width="1600" height="130" fill="#b98b5e" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={20 + i * 160} y="600" width="130" height="90" rx="4" fill="none" stroke="#9a6f46" strokeWidth="5" />)}
      <rect y="700" width="1600" height="200" fill="#a0714a" />
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 110 - 60},900 L${800 + (i - 8) * 26},700`} stroke="rgba(60,30,10,.2)" strokeWidth="2" />)}
      <g transform="translate(560,150)"><rect x="-4" y="0" width="8" height="450" fill="#8a6a3a" /><circle cx="0" cy="-6" r="10" fill="#d4a017" />{TRICOLORE.map((c, k) => <path key={c} d={`M${4 + k * 36},8 L${40 + k * 36},8 L${36 + k * 34},300 L${4 + k * 34},300 Z`} fill={c} />)}</g>
    </svg>
  )
  if (couche === 'milieu') {
    const brille = visuel === 'marianne' && étape >= 1
    return (
      <svg {...V}><Defs />
        {[[290, '🐓', 'Le coq'], [1310, '🎶', 'L\'hymne']].map(([x, e, t]) => (
          <g key={x}>
            <path d={`M${x - 70},800 L${x - 20},470 M${x + 70},800 L${x + 20},470 M${x},470 L${x},810`} stroke="#6b4a2e" strokeWidth="10" strokeLinecap="round" />
            <rect x={x - 110} y="420" width="220" height="170" rx="8" fill="#fff" stroke="#1e3a8a" strokeWidth="6" />
            <text x={x} y="505" textAnchor="middle" fontSize="64">{e}</text>
            <text x={x} y="565" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" fill="#1e3a8a">{t}</text>
          </g>
        ))}
        <circle cx="800" cy="420" r="190" fill="url(#d6-halo)" opacity={brille ? 1 : 0.35} style={{ transition: 'opacity 1s' }} />
        <g className={brille ? 'c-livre-brille' : ''}>
          <rect x="720" y="548" width="160" height="20" rx="4" fill="#d8cfbd" />
          <rect x="742" y="566" width="116" height="220" fill="#e7e0d2" />
          <rect x="726" y="784" width="148" height="22" rx="4" fill="#d8cfbd" />
          <path d="M692,552 C694,500 738,474 800,474 C862,474 906,500 908,552 Z" fill="#f3efe6" />
          <path d="M730,552 C744,520 770,506 800,510 C830,506 856,520 870,552" stroke="#ddd5c6" strokeWidth="4" fill="none" />
          <rect x="783" y="430" width="34" height="54" fill="#ece6da" />
          <path d="M766,420 C746,440 742,476 760,500 C772,470 770,446 776,430 Z" fill="#e6dfd2" />
          <path d="M752,400 C740,440 744,470 770,492 C772,466 766,440 774,420 Z" fill="#e2dacb" stroke="#cfc6b5" strokeWidth="2" />
          <ellipse cx="802" cy="406" rx="42" ry="50" fill="#f6f2ea" />
          <path d="M842,392 C850,402 856,412 852,420 C848,424 842,424 840,428" stroke="#cfc6b5" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M812,402 q10,-6 20,-1" stroke="#6f6656" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M813,414 q9,-7 18,0 q-9,5 -18,0 Z" fill="#4a4338" />
          <path d="M826,441 q8,4 15,-1" stroke="#a24f42" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M770,424 C766,440 768,452 776,462" stroke="#ddd5c6" strokeWidth="3" fill="none" />
          <path d="M750,398 C744,352 760,312 796,298 C826,286 858,292 872,314 C884,332 882,358 866,368 C856,374 848,368 852,358 C855,349 848,341 839,343 C846,364 842,384 838,394 C808,402 776,402 750,398 Z" fill="#dc2626" />
          <path d="M752,392 C786,400 818,398 840,388" stroke="#991b1b" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M786,318 C800,330 812,350 816,372" stroke="#b91c1c" strokeWidth="3" fill="none" />
          <circle cx="768" cy="372" r="13" fill="#1d4ed8" /><circle cx="768" cy="372" r="8.5" fill="#f8fafc" /><circle cx="768" cy="372" r="4" fill="#dc2626" />
        </g>
      </svg>
    )
  }
  return <svg {...V}><g opacity=".9"><rect x="0" y="0" width="80" height="900" fill="#1e3a8a" /><rect x="1520" y="0" width="80" height="900" fill="#1e3a8a" /></g></svg>
}

export default function Decors8({ nom, couche, étape = 0, visuel }) {
  if (nom === 'place-14-juillet') return <PlaceFête couche={couche} visuel={visuel} />
  if (nom === 'place-14-juillet-soir') return <PlaceFête couche={couche} soir />
  if (nom === 'bastille') return <Bastille couche={couche} étape={étape} />
  if (nom === 'salle-mairie') return <SalleMairie couche={couche} étape={étape} visuel={visuel} />
  return null
}
