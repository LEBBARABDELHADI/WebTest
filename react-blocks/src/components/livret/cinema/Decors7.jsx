// Décors du court-métrage de la page 7 (en couches pour la parallaxe) :
// le mur de l'école (tagué, puis repeint ensemble), le bureau de
// l'entreprise, la collecte sur la place de la mairie.
import Decors6, { Defs, Immeuble } from './Decors6'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const PEAUX = ['#f1c9a5', '#8d5a3b', '#c98e64', '#5a3b22', '#e8b896', '#6b4226']
const MANCHES = ['#2563eb', '#f2b134', '#22c3a6', '#dc2626', '#8b5cf6', '#f97316']

// Tags illisibles (gribouillis) : on montre la haine sans l'écrire.
function Tags({ opacité = 1 }) {
  const traits = [
    [170, 470, '#b91c1c', 11], [520, 430, '#111827', 9], [930, 480, '#7c3aed', 12], [1240, 440, '#b91c1c', 9],
    [330, 610, '#111827', 7], [760, 600, '#b91c1c', 10], [1120, 620, '#111827', 8],
  ]
  return (
    <g opacity={opacité} style={{ transition: 'opacity 1.4s' }}>
      {traits.map(([x, y, c, n], k) => (
        <g key={k}>
          <path d={`M${x},${y} ${Array.from({ length: n }, (_, i) => `l${18 + ((i * 7 + k) % 4) * 6},${i % 2 ? -58 + (k % 3) * 10 : 52}`).join(' ')}`} stroke={c} strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {[0, 1].map(i => <path key={i} d={`M${x + 40 + i * 90},${y + 40} l0,${40 + i * 26}`} stroke={c} strokeWidth="5" strokeLinecap="round" opacity=".8" />)}
        </g>
      ))}
    </g>
  )
}

// Fresque : des mains de toutes les couleurs réunies, « FRATERNITÉ ».
function Fresque({ étape }) {
  const cx = 800, cy = 575
  return (
    <g>
      <rect x="170" y="405" width="1260" height="310" rx="6" fill="#fbf7ee" className="c-deroule" />
      {étape >= 2 && (
        <g className="c-apparait">
          {PEAUX.map((peau, k) => (
            <g key={k} transform={`rotate(${k * 60 - 90} ${cx} ${cy + 40})`}>
              <g className="c-apparait" style={{ animationDelay: `${k * 0.18}s` }}>
                <rect x={cx + 64} y={cy + 40 - 26} width="190" height="52" rx="22" fill={MANCHES[k]} />
                <ellipse cx={cx + 58} cy={cy + 40} rx="52" ry="34" fill={peau} />
                {[-18, -6, 6, 18].map(dy => <ellipse key={dy} cx={cx + 12} cy={cy + 40 + dy} rx="18" ry="6" fill={peau} />)}
              </g>
            </g>
          ))}
          <text x={cx} y="470" textAnchor="middle" fontFamily="Georgia, serif" fontSize="54" fontWeight="700" letterSpacing="12" fill="#1d4ed8" stroke="#fbf7ee" strokeWidth="12" paintOrder="stroke" strokeLinejoin="round">FRATERNITÉ</text>
        </g>
      )}
      {étape >= 3 && [0, 1].map(côté => (
        <g key={côté} className="c-apparait">
          {Array.from({ length: 4 }, (_, i) => {
            const x = côté ? 1110 + i * 70 : 270 + i * 70
            return (
              <g key={i} transform={`translate(${x},690)`}>
                <circle cy="-78" r="15" fill={PEAUX[(i + côté * 2) % 6]} />
                <path d="M-20,0 C-20,-40 -12,-58 0,-58 C12,-58 20,-40 20,0 Z" fill={MANCHES[(i + côté * 3) % 6]} />
                {i < 3 && <path d="M18,-34 L52,-34" stroke={PEAUX[(i + côté) % 6]} strokeWidth="7" strokeLinecap="round" />}
              </g>
            )
          })}
          <path d={`M${côté ? 1180 : 340},560 c-14,-22 -46,-6 -30,18 l30,26 l30,-26 c16,-24 -16,-40 -30,-18 Z`} fill="#ef4444" className="c-bougie-lum" />
        </g>
      ))}
    </g>
  )
}

function MurQuartier({ couche, étape, visuel }) {
  const repeint = visuel === 'mains'
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d7-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={repeint ? '#6fb3f2' : '#8fa6c4'} /><stop offset="1" stopColor={repeint ? '#fdf0d8' : '#dfe5ec'} /></linearGradient>
      <rect width="1600" height="900" fill="url(#d7-ciel)" />
      <circle cx="1280" cy="150" r="130" fill="url(#d6-soleil)" opacity={repeint ? 0.85 : 0.35} />
      {[[260, 150, 1], [900, 100, 0.8]].map(([x, y, s], k) => <g key={k} opacity=".75" filter="url(#d6-flou)" className="c-nuage" style={{ animationDuration: `${80 + k * 30}s` }}><ellipse cx={x} cy={y} rx={170 * s} ry={30 * s} fill="#fff" /><ellipse cx={x + 80} cy={y - 18} rx={100 * s} ry={26 * s} fill="#fff" /></g>)}
      <Immeuble x={-30} l={340} hh={460} sol={720} />
      <Immeuble x={1300} l={340} hh={480} sol={720} teinte="#efe3cc" />
      <g>
        <rect x="440" y="190" width="720" height="330" fill="#f0e2c6" />
        <path d="M420,192 L1180,192 L1140,140 L460,140 Z" fill="#9a5b3c" />
        <rect x="640" y="210" width="320" height="50" rx="4" fill="#1d4ed8" />
        <text x="800" y="246" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" letterSpacing="10" fill="#fff">ÉCOLE</text>
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={470 + i * 86} y="290" width="48" height="70" rx="3" fill="#9cbad6" />)}
        <rect x="797" y="60" width="6" height="84" fill="#555" />
        <g className="c-drapeau-6"><rect x="803" y="62" width="24" height="36" fill="#1d4ed8" /><rect x="827" y="62" width="24" height="36" fill="#fff" /><rect x="851" y="62" width="24" height="36" fill="#dc2626" /></g>
      </g>
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <rect x="-20" y="380" width="1640" height="350" fill="#e3d3b4" />
      {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M-20,${400 + i * 22} L1620,${400 + i * 22}`} stroke="rgba(150,120,80,.12)" strokeWidth="2" />)}
      <rect x="-20" y="366" width="1640" height="26" fill="#c8b38d" />
      {[0, 400, 800, 1200, 1600].map(x => <rect key={x} x={x - 22} y="356" width="44" height="374" fill="#d4c19c" />)}
      {repeint ? <><Tags opacité={étape >= 1 ? 0 : 0.4} /><Fresque étape={étape} /></> : <Tags />}
      <rect y="730" width="1600" height="170" fill="#bdb3a3" />
      <rect y="726" width="1600" height="12" fill="#a89d8b" />
    </svg>
  )
  return (
    <svg {...V}>
      {repeint ? (
        <g>
          {[[90, '#2563eb'], [1500, '#f2b134']].map(([x, c]) => <g key={x} transform={`translate(${x},830)`}><path d="M-46,-70 L46,-70 L38,30 L-38,30 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="4" /><rect x="-46" y="-76" width="92" height="14" rx="4" fill={c} /><path d="M-30,-70 q30,-50 60,0" stroke="#6b7280" strokeWidth="4" fill="none" /></g>)}
          <g transform="translate(260,860) rotate(-18)"><rect x="-8" y="-120" width="16" height="120" fill="#7a5132" /><rect x="-50" y="-150" width="100" height="34" rx="10" fill="#22c3a6" /></g>
        </g>
      ) : (
        <g opacity=".95">{[[60, 840, 170, -20], [1540, 850, 180, 25]].map(([x, y, r, a], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.3} transform={`rotate(${a} ${x} ${y})`} fill={k % 2 ? '#2f5a2f' : '#3d7a3a'} />)}</g>
      )}
    </svg>
  )
}

function Bureau({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs />
      <linearGradient id="d7-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef2f5" /><stop offset="1" stopColor="#d8e0e6" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d7-mur)" />
      <rect x="930" y="100" width="600" height="510" rx="6" fill="#a9d3f0" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={950 + i * 58} y={300 + (i % 4) * 34} width="46" height={310 - (i % 4) * 34} fill={i % 2 ? '#7fa5c4' : '#90b4cf'} />)}
      <path d="M930,100 L1530,100 L1530,610 L930,610 Z M1230,100 L1230,610" fill="none" stroke="#c8d2d9" strokeWidth="14" />
      <rect x="110" y="160" width="470" height="290" rx="8" fill="#fff" stroke="#c7d0d6" strokeWidth="6" />
      <text x="345" y="210" textAnchor="middle" fontFamily="system-ui" fontSize="26" fontWeight="800" fill="#334155">RECRUTEMENT</text>
      <path d="M150,400 L240,350 L320,372 L410,300 L520,262" stroke="#0f766e" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[[160, 250], [160, 290]].map(([x, y], k) => <rect key={k} x={x} y={y} width={k ? 200 : 280} height="12" rx="6" fill="#cbd5e1" />)}
      <circle cx="680" cy="230" r="50" fill="#0f766e" /><text x="680" y="246" textAnchor="middle" fontFamily="Georgia, serif" fontSize="44" fill="#fff">E</text>
      <rect y="700" width="1600" height="200" fill="#b8c2c9" />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs />
      <g transform="translate(150,720)"><path d="M-50,0 L50,0 L38,-90 L-38,-90 Z" fill="#c2410c" />{[-40, 0, 40, -20, 20].map((dx, k) => <ellipse key={k} cx={dx} cy={-150 - (k % 3) * 30} rx="34" ry="70" transform={`rotate(${dx / 2} ${dx} ${-150 - (k % 3) * 30})`} fill={['#3f7a3f', '#4d8f48', '#5a9e52'][k % 3]} />)}</g>
      <path d="M360,720 L1240,720 L1300,900 L300,900 Z" fill="#c8a27a" />
      <rect x="300" y="700" width="1000" height="26" rx="6" fill="#d9b48c" />
      <g transform="translate(820,560)"><rect x="-110" y="0" width="220" height="140" rx="10" fill="#1f2937" /><rect x="-100" y="10" width="200" height="118" rx="6" fill="#93c5fd" /><rect x="-130" y="140" width="260" height="14" rx="5" fill="#374151" /></g>
      <g transform="translate(560,700)"><rect x="-70" y="-14" width="140" height="12" fill="#fff" transform="rotate(-5)" /><rect x="-62" y="-22" width="140" height="12" fill="#f8fafc" transform="rotate(4)" /><text x="0" y="-30" textAnchor="middle" fontFamily="system-ui" fontSize="22" fontWeight="900" fill="#0f766e">CV</text></g>
      <g transform="translate(1060,690)"><rect x="-20" y="-34" width="40" height="44" rx="6" fill="#f8fafc" /><path d="M20,-24 q18,4 0,22" stroke="#f8fafc" strokeWidth="6" fill="none" /></g>
    </svg>
  )
  return (
    <svg {...V}><g opacity=".85"><rect x="1490" y="0" width="130" height="900" fill="rgba(210,225,235,.55)" />{[0, 1, 2].map(k => <rect key={k} x={1500 + k * 36} y="0" width="6" height="900" fill="rgba(255,255,255,.5)" />)}</g></svg>
  )
}

// La place de la mairie, avec le stand de la collecte du quartier.
function PlaceCollecte({ couche }) {
  if (couche !== 'milieu') return <Decors6 nom="place-mairie" couche={couche} />
  return (
    <>
      <Decors6 nom="place-mairie" couche="milieu" />
      <svg {...V}>
        {[[700, '#f2b134', '#5a3b22'], [900, '#22c3a6', '#f1c9a5']].map(([x, c, p]) => <g key={x} transform={`translate(${x},660)`}><circle cy="-80" r="20" fill={p} /><path d="M-30,10 C-30,-40 -18,-60 0,-60 C18,-60 30,-40 30,10 Z" fill={c} /></g>)}
        {[590, 1010].map(x => <rect key={x} x={x - 6} y="470" width="12" height="300" fill="#6b4a2e" />)}
        <rect x="560" y="470" width="480" height="70" rx="8" fill="#fff" stroke="#0f766e" strokeWidth="5" />
        <text x="800" y="516" textAnchor="middle" fontFamily="Georgia, serif" fontSize="32" fill="#0f766e">Association du quartier</text>
        <rect x="560" y="650" width="480" height="22" rx="4" fill="#e5e7eb" />
        <path d="M560,672 L1040,672 L1030,780 L570,780 Z" fill="#1d4ed8" />
        <text x="800" y="738" textAnchor="middle" fontFamily="system-ui" fontSize="30" fontWeight="900" letterSpacing="4" fill="#fff">COLLECTE SOLIDAIRE</text>
        {[[640, '🥫'], [800, '👕'], [960, '📚']].map(([x, e]) => <g key={x} transform={`translate(${x},650)`}><path d="M-56,0 L-56,-76 L56,-76 L56,0 Z" fill="#c08a4a" /><path d="M-56,-76 L-30,-96 L30,-96 L56,-76 Z" fill="#d9a466" /><text y="-24" textAnchor="middle" fontSize="40">{e}</text></g>)}
      </svg>
    </>
  )
}

export default function Decors7({ nom, couche, étape = 0, visuel }) {
  if (nom === 'mur-quartier') return <MurQuartier couche={couche} étape={étape} visuel={visuel} />
  if (nom === 'bureau') return <Bureau couche={couche} />
  if (nom === 'place-collecte') return <PlaceCollecte couche={couche} />
  return null
}
