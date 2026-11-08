// Décors du court-métrage de la page 6 (en couches pour la parallaxe) :
// la place de la mairie (matin / soir), le parc, l'agence immobilière.
import { Particules } from './Decors10'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const h = (i, k = 1) => ((i * 9301 + 49297 * k) % 233280) / 233280

export const Defs = () => (
  <defs>
    <radialGradient id="d6-halo"><stop offset="0" stopColor="rgba(255,214,140,.85)" /><stop offset=".35" stopColor="rgba(255,190,110,.28)" /><stop offset="1" stopColor="rgba(255,190,110,0)" /></radialGradient>
    <radialGradient id="d6-soleil"><stop offset="0" stopColor="#fff8d8" /><stop offset=".45" stopColor="#ffd98a" /><stop offset="1" stopColor="rgba(255,217,138,0)" /></radialGradient>
    <linearGradient id="d6-pierre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4ead8" /><stop offset="1" stopColor="#d6c4a4" /></linearGradient>
    <linearGradient id="d6-rayon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,240,200,.45)" /><stop offset="1" stopColor="rgba(255,240,200,0)" /></linearGradient>
    <filter id="d6-flou"><feGaussianBlur stdDeviation="14" /></filter>
  </defs>
)

// Immeuble haussmannien (fenêtres, balcons, toit en zinc).
export function Immeuble({ x, l, hh, sol, teinte = '#e9dcc4', soir }) {
  const étages = Math.floor((hh - 60) / 70)
  return (
    <g>
      <rect x={x} y={sol - hh} width={l} height={hh} fill={teinte} />
      <path d={`M${x - 8},${sol - hh} L${x + l + 8},${sol - hh} L${x + l - 14},${sol - hh - 46} L${x + 14},${sol - hh - 46} Z`} fill={soir ? '#4b4a6a' : '#7d8ca3'} />
      {Array.from({ length: Math.floor(l / 46) }, (_, c) => Array.from({ length: étages }, (_, e) => {
        const fx = x + 14 + c * 46, fy = sol - hh + 26 + e * 70, allumée = soir && h(c * 7 + e, x) > 0.45
        return (
          <g key={`${c}-${e}`}>
            <rect x={fx} y={fy} width="24" height="40" rx="2" fill={allumée ? '#ffd38a' : soir ? '#3a3556' : '#93b3cf'} />
            {e === 1 && <rect x={fx - 4} y={fy + 38} width="32" height="5" fill={soir ? '#2a2638' : '#4a4a55'} />}
          </g>
        )
      }))}
    </g>
  )
}

function Place({ couche, soir }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id={`d6-ciel-${soir ? 's' : 'j'}`} x1="0" y1="0" x2="0" y2="1">{soir ? <><stop offset="0" stopColor="#24124f" /><stop offset=".5" stopColor="#b24a78" /><stop offset=".85" stopColor="#ffa35c" /><stop offset="1" stopColor="#ffd08a" /></> : <><stop offset="0" stopColor="#5fa8f0" /><stop offset=".7" stopColor="#cbe8ff" /><stop offset="1" stopColor="#f4f0e0" /></>}</linearGradient>
      <rect width="1600" height="900" fill={`url(#d6-ciel-${soir ? 's' : 'j'})`} />
      <circle cx={soir ? 1300 : 1260} cy={soir ? 520 : 160} r={soir ? 200 : 140} fill="url(#d6-soleil)" opacity={soir ? 0.9 : 0.75} />
      {!soir && [[240, 170, 1.1], [820, 110, 0.9], [1420, 250, 1.2]].map(([x, y, s], k) => <g key={k} opacity=".75" filter="url(#d6-flou)" className="c-nuage" style={{ animationDuration: `${70 + k * 25}s` }}><ellipse cx={x} cy={y} rx={170 * s} ry={32 * s} fill="#fff" /><ellipse cx={x + 80} cy={y - 18} rx={100 * s} ry={28 * s} fill="#fff" /></g>)}
      <g opacity=".9">
        <Immeuble x={-20} l={330} hh={420} sol={700} soir={soir} />
        <Immeuble x={1290} l={340} hh={440} sol={700} teinte="#efe3cc" soir={soir} />
      </g>
    </svg>
  )
  if (couche === 'milieu') {
    const t = soir ? 'rgba(60,20,70,.35)' : 'rgba(255,255,255,0)'
    return (
      <svg {...V}><Defs />
        <path d="M0,700 L1600,700 L1600,900 L0,900 Z" fill={soir ? '#5a4152' : '#cbbfa8'} />
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 110 - 60},900 L${800 + (i - 8) * 30},700`} stroke={soir ? 'rgba(0,0,0,.18)' : 'rgba(120,100,70,.18)'} strokeWidth="2" />)}
        <g>
          <rect x="360" y="250" width="880" height="450" fill="url(#d6-pierre)" />
          <rect x="360" y="250" width="880" height="450" fill={t} />
          <path d="M330,252 L1270,252 L800,92 Z" fill="#e4d6bb" stroke="#bda884" strokeWidth="4" />
          <circle cx="800" cy="190" r="38" fill="#f8f2e4" stroke="#8a7650" strokeWidth="5" />
          <path d="M800,190 L800,166 M800,190 L816,198" stroke="#3b2f22" strokeWidth="4" strokeLinecap="round" />
          <rect x="360" y="252" width="880" height="56" fill="#d8c6a2" />
          <text x="800" y="290" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" letterSpacing="8" fill="#5a4630">LIBERTÉ · ÉGALITÉ · FRATERNITÉ</text>
          <rect x="560" y="320" width="480" height="30" rx="4" fill="#3a3040" opacity=".85" />
          <text x="800" y="342" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" letterSpacing="10" fill="#ffd98a">HÔTEL DE VILLE</text>
          {[0, 1, 2, 3, 4, 5].map(k => (
            <g key={k}>
              <path d={`M${420 + k * 140},${640} L${420 + k * 140},${420} Q${465 + k * 140},${380} ${510 + k * 140},${420} L${510 + k * 140},${640} Z`} fill={soir ? '#ffcf7a' : '#9cbad6'} className={soir ? 'c-fenetre' : ''} style={{ animationDelay: `${k * 0.4}s` }} />
              <path d={`M${465 + k * 140},${400} L${465 + k * 140},${640} M${420 + k * 140},${520} L${510 + k * 140},${520}`} stroke="#8a7650" strokeWidth="5" />
            </g>
          ))}
          {[380, 1200].map(x => <rect key={x} x={x} y="308" width="24" height="392" fill="#cdb995" />)}
          <path d="M700,700 L700,610 Q800,560 900,610 L900,700 Z" fill="#6b4a2e" />
          {[0, 1, 2].map(k => <rect key={k} x={640 - k * 24} y={700 + k * 16} width={320 + k * 48} height="16" fill={soir ? '#6b5560' : '#dccfb7'} stroke="rgba(0,0,0,.08)" />)}
          <rect x="797" y="10" width="6" height="86" fill="#555" />
          <g className="c-drapeau-6"><rect x="803" y="12" width="26" height="40" fill="#1d4ed8" /><rect x="829" y="12" width="26" height="40" fill="#fff" /><rect x="855" y="12" width="26" height="40" fill="#dc2626" /></g>
        </g>
        {[180, 1420].map((x, k) => (
          <g key={x}>
            <rect x={x - 10} y="560" width="20" height="200" fill="#4a3424" />
            {Array.from({ length: 7 }, (_, i) => <circle key={i} cx={x + Math.cos(i * 1.3) * 70} cy={520 + Math.sin(i * 1.9) * 50} r={62 - (i % 3) * 10} fill={soir ? ['#5a3a4a', '#6e4058', '#4a2f40'][i % 3] : ['#4f8a46', '#5f9e52', '#3f7339'][i % 3]} />)}
            <ellipse cx={x} cy="770" rx="80" ry="12" fill="rgba(0,0,0,.2)" />
            {k === 0 && <circle cx={x + 120} cy="480" r="70" fill="url(#d6-halo)" opacity={soir ? 1 : 0} />}
          </g>
        ))}
        <g>
          <ellipse cx="800" cy="830" rx="190" ry="34" fill={soir ? '#3a2e44' : '#9fb7c9'} />
          <ellipse cx="800" cy="822" rx="160" ry="24" fill={soir ? '#584a78' : '#bfe0f2'} className="c-vague" />
          <rect x="790" y="740" width="20" height="80" fill={soir ? '#4a3f50' : '#b9ad96'} />
          <path d="M800,742 C780,760 770,786 776,800 M800,742 C820,760 830,786 824,800" stroke="rgba(190,225,255,.7)" strokeWidth="4" fill="none" className="c-jet" />
        </g>
      </svg>
    )
  }
  return (
    <svg {...V}>
      <g opacity=".95">{[[60, 820, 170, -20], [140, 880, 200, -5], [1540, 840, 180, 25]].map(([x, y, r, a], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.3} transform={`rotate(${a} ${x} ${y})`} fill={soir ? '#2a1f2e' : k % 2 ? '#2f5a2f' : '#3d7a3a'} />)}</g>
    </svg>
  )
}

function Parc({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d6-ciel-parc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7ec4ff" /><stop offset=".75" stopColor="#d8f0ff" /><stop offset="1" stopColor="#f6f2dc" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d6-ciel-parc)" />
      <circle cx="320" cy="150" r="130" fill="url(#d6-soleil)" opacity=".8" />
      {[0, 1, 2].map(k => <path key={k} d={`M${380 + k * 160},120 L${200 + k * 220},900 L${360 + k * 220},900 L${470 + k * 160},120 Z`} fill="url(#d6-rayon)" opacity=".45" className="c-rayons" />)}
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={i * 125 - 20} cy={520 + (i % 3) * 18} r={120 + (i % 4) * 22} fill={['#3f7a3f', '#4d8f48', '#5a9e52', '#356b35'][i % 4]} />)}
    </svg>
  )
  if (couche === 'milieu') {
    const silhouette = (x, y, c, ext, e = 1) => (
      <g transform={`translate(${x},${y}) scale(${e})`}>
        <circle cy="-62" r="18" fill="#3b2f2a" /><path d="M-26,0 C-26,-34 -16,-44 0,-44 C16,-44 26,-34 26,0 Z" fill={c} />{ext}
      </g>
    )
    return (
      <svg {...V}><Defs />
        <path d="M0,640 Q800,600 1600,650 L1600,900 L0,900 Z" fill="#6fb35a" />
        <path d="M520,900 Q760,700 820,640 Q900,700 1180,900 Z" fill="#e8dcc0" />
        {[[300, 600], [1320, 590], [1500, 610]].map(([x, y], k) => <g key={k}><rect x={x - 6} y={y - 40} width="12" height="60" fill="#4a3424" /><circle cx={x} cy={y - 70} r="48" fill={['#4f8a46', '#5f9e52', '#3f7339'][k]} /></g>)}
        <g transform="translate(0,-40)">
          <g transform="translate(690,660) scale(.72)"><rect x="-90" y="-30" width="180" height="14" rx="4" fill="#7a5132" /><rect x="-90" y="-6" width="180" height="12" rx="4" fill="#7a5132" /><rect x="-80" y="6" width="10" height="34" fill="#4a3220" /><rect x="70" y="6" width="10" height="34" fill="#4a3220" /></g>
          {silhouette(680, 640, '#c0392b', <rect x="-16" y="-36" width="32" height="22" fill="#f6efe0" className="c-livre" />, 0.72)}
          {silhouette(800, 650, '#2f6fb0', <><path d="M14,-24 l46,-30" stroke="#7a5132" strokeWidth="8" strokeLinecap="round" /><ellipse cx="18" cy="-16" rx="22" ry="16" fill="#b8763a" /><text x="50" y="-80" fontSize="44" fill="#1b1b2a" className="c-note">♪</text></>, 0.72)}
          {silhouette(900, 648, '#8e44ad', <text x="-10" y="-96" fontSize="40" className="c-note">💬</text>, 0.72)}
          {silhouette(950, 652, '#16a085', <text x="0" y="-104" fontSize="40" className="c-note" style={{ animationDelay: '1.3s' }}>💬</text>, 0.72)}
        </g>
      </svg>
    )
  }
  return (
    <svg {...V}><g opacity=".95">{Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx={i < 5 ? 40 + i * 50 : 1360 + (i - 5) * 60} cy={860 - (i % 2) * 40} rx="60" ry="24" fill={['#e85d75', '#f2c14e', '#3d7a3a', '#5a9e52'][i % 4]} />)}</g></svg>
  )
}

function Agence({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <rect width="1600" height="900" fill="#e6eef0" />
      <rect x="980" y="120" width="520" height="440" rx="8" fill="#9ccbe8" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={1000 + i * 56} y={300 + (i % 3) * 30} width="44" height={260 - (i % 3) * 30} fill="#7fa5c4" />)}
      <path d="M980,120 L1500,120 L1500,560 L980,560 Z M1240,120 L1240,560" fill="none" stroke="#cfd9de" strokeWidth="14" />
      {[[140, 170], [400, 170], [140, 420], [400, 420]].map(([x, y], k) => (
        <g key={k}>
          <rect x={x} y={y} width="210" height="200" rx="8" fill="#fff" stroke="#d6dde2" strokeWidth="3" />
          <path d={`M${x + 50},${y + 120} L${x + 105},${y + 70} L${x + 160},${y + 120} L${x + 160},${y + 165} L${x + 50},${y + 165} Z`} fill={['#f2b134', '#5aa9e6', '#7ed6a5', '#f48fb1'][k]} />
          <rect x={x + 20} y={y + 20} width="120" height="18" rx="9" fill="#0f766e" />
          <text x={x + 80} y={y + 34} textAnchor="middle" fontFamily="system-ui" fontSize="13" fontWeight="800" fill="#fff">À LOUER</text>
        </g>
      ))}
      <rect y="700" width="1600" height="200" fill="#c7d3d8" />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <g transform="translate(800,150)"><rect x="-300" y="-46" width="600" height="92" rx="10" fill="#0f766e" /><text y="14" textAnchor="middle" fontFamily="Georgia, serif" fontSize="40" letterSpacing="6" fill="#fff">AGENCE IMMOBILIÈRE</text></g>
      <g transform="translate(800,330)"><rect x="-150" y="-70" width="300" height="140" rx="10" fill="#fff" stroke="#0f766e" strokeWidth="6" /><path d="M-60,30 L0,-28 L60,30 L60,52 L-60,52 Z" fill="#f2b134" /><text y="-36" textAnchor="middle" fontFamily="system-ui" fontSize="26" fontWeight="900" fill="#0f766e">À LOUER · T2</text></g>
      <path d="M380,720 L1220,720 L1280,900 L320,900 Z" fill="#8a6a4c" />
      <rect x="320" y="700" width="960" height="28" rx="6" fill="#a8815d" />
      <g transform="translate(1000,560)"><rect x="-110" y="0" width="220" height="140" rx="10" fill="#1f2937" /><rect x="-100" y="10" width="200" height="118" rx="6" fill="#60a5fa" opacity=".8" /><rect x="-14" y="140" width="28" height="18" fill="#374151" /><rect x="-50" y="156" width="100" height="8" rx="4" fill="#374151" /></g>
      <g transform="translate(600,690)"><rect x="-70" y="0" width="140" height="10" fill="#fff" transform="rotate(-4)" /><rect x="-60" y="-8" width="140" height="10" fill="#f4f4f4" transform="rotate(3)" /></g>
      <g transform="translate(820,690)"><circle r="10" fill="none" stroke="#c9a227" strokeWidth="4" /><rect x="8" y="-3" width="26" height="6" fill="#c9a227" /></g>
    </svg>
  )
  return (
    <svg {...V}><g opacity=".9"><rect x="1480" y="0" width="140" height="900" fill="rgba(190,215,225,.55)" /><ellipse cx="80" cy="820" rx="150" ry="60" fill="#3d7a3a" /></g></svg>
  )
}

// Rue d'immeubles la nuit : une fenêtre fait la fête, les autres dorment.
function ImmeublesNuit({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d6-nuit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070a24" /><stop offset=".7" stopColor="#1e1a48" /><stop offset="1" stopColor="#3a2d5e" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d6-nuit)" />
      {Array.from({ length: 70 }, (_, i) => <circle key={i} cx={h(i, 3) * 1600} cy={h(i, 5) * 420} r={0.8 + h(i, 7) * 1.6} fill="#dfe6ff" className="c-scintille" style={{ animationDelay: `${h(i, 9) * 3}s` }} />)}
      <circle cx="1320" cy="150" r="56" fill="#f4f1dc" /><circle cx="1342" cy="138" r="52" fill="#141436" />
      <g opacity=".55">{Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 140 - 20} y={420 + h(i, 2) * 80} width="130" height="500" fill="#14122e" />)}</g>
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <rect y="720" width="1600" height="180" fill="#1d1a2c" />
      <rect y="712" width="1600" height="14" fill="#2e2a42" />
      <Immeuble x={-40} l={420} hh={520} sol={720} teinte="#4a4462" soir />
      <Immeuble x={1220} l={420} hh={540} sol={720} teinte="#4a4462" soir />
      <g>
        <rect x="430" y="170" width="740" height="550" fill="#57506f" />
        <path d="M410,170 L1190,170 L1150,118 L450,118 Z" fill="#2f2b45" />
        {[0, 1, 2, 3, 4, 5].map(c => [0, 1, 2, 3, 4, 5].map(e => {
          const fx = 470 + c * 116, fy = 210 + e * 82, fête = c === 1 && e === 3
          return (
            <g key={`${c}-${e}`}>
              <rect x={fx} y={fy} width="60" height="58" rx="3" fill={fête ? '#ff5fa2' : '#2b2745'} className={fête ? 'c-fete-6' : ''} />
              {e > 0 && <rect x={fx - 6} y={fy + 56} width="72" height="6" fill="#2a2638" />}
            </g>
          )
        }))}
        {[0, 1, 2].map(k => <text key={k} x={560 + k * 40} y={440 - k * 30} fontSize="34" fill="#ffd166" className="c-note" style={{ animationDelay: `${k * 0.6}s` }}>♪</text>)}
        <rect x="760" y="600" width="80" height="120" rx="6" fill="#2a1d2e" />
      </g>
      <g transform="translate(300,720)"><rect x="-6" y="-260" width="12" height="260" fill="#1b1826" /><path d="M-6,-260 q30,-30 70,-10" stroke="#1b1826" strokeWidth="10" fill="none" /><circle cx="64" cy="-262" r="14" fill="#ffe7a8" /><circle cx="64" cy="-250" r="120" fill="url(#d6-halo)" opacity=".8" /></g>
    </svg>
  )
  return null
}

export default function Decors6({ nom, couche }) {
  if (nom === 'place-mairie') return <Place couche={couche} />
  if (nom === 'place-mairie-soir') return <Place couche={couche} soir />
  if (nom === 'parc') return <Parc couche={couche} />
  if (nom === 'agence') return <Agence couche={couche} />
  if (nom === 'immeubles-nuit') return <ImmeublesNuit couche={couche} />
  return couche === 'avant' ? <Particules type="poussiere" n={10} /> : null
}
