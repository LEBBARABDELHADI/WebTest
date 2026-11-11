// Décors du court-métrage de la page 14 (en couches pour la parallaxe) :
// l'école du quartier un jour d'élection (banderole « bureau de vote »), la
// salle de classe devenue bureau de vote (isoloirs, urne transparente), puis
// la rue : une résidence, le bureau de l'emploi, le centre de santé.
// Sur téléphone, seule la bande centrale (x ≈ 540 à 1060) est visible : les
// enseignes et l'urne y sont placées.
import { Defs, Immeuble } from './Decors6'

const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const h = (i, k = 1) => ((i * 9301 + 49297 * k) % 233280) / 233280

// Animations propres à ces décors (passants, banderole, enveloppe, rideau).
const CSS = `
.d14-passant { animation: d14-marche linear infinite }
.d14-pas { animation: d14-pas .9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100% }
.d14-banderole { animation: d14-ondule 4.5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0 }
.d14-rideau { animation: d14-rideau 6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0 }
.d14-enveloppe { animation: d14-tombe 1.6s cubic-bezier(.5,0,.6,1) 1.4s both }
.d14-croix { animation: d14-luit 2.4s ease-in-out infinite }
.d14-feuillage { animation: d14-vent 5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100% }
@keyframes d14-marche { from { transform: translateX(-160px) } to { transform: translateX(1760px) } }
@keyframes d14-pas { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
@keyframes d14-ondule { 0%, 100% { transform: skewX(0) scaleY(1) } 50% { transform: skewX(1.5deg) scaleY(.97) } }
@keyframes d14-rideau { 0%, 100% { transform: skewX(0) } 50% { transform: skewX(-2deg) } }
@keyframes d14-tombe { 0% { transform: translateY(-90px); opacity: 0 } 25% { opacity: 1 } 80% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(14px); opacity: 0 } }
@keyframes d14-luit { 0%, 100% { opacity: .78 } 50% { opacity: 1 } }
@keyframes d14-vent { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(1.6deg) } }
@media (prefers-reduced-motion: reduce) { .d14-passant, .d14-pas, .d14-banderole, .d14-rideau, .d14-feuillage { animation: none } }
`

// Styles des passants et du feuillage, pour les décors qui réutilisent la rue.
export const StyleRue = () => <style>{CSS}</style>

// Ciel du matin, nuages, soleil.
export function Ciel({ id }) {
  return (
    <>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5fa8f0" /><stop offset=".68" stopColor="#cbe8ff" /><stop offset="1" stopColor="#f4f0e0" /></linearGradient>
      <rect width="1600" height="900" fill={`url(#${id})`} />
      <circle cx="1280" cy="150" r="150" fill="url(#d6-soleil)" opacity=".8" />
      {[[260, 150, 1.1], [860, 90, 0.9], [1440, 230, 1.2]].map(([x, y, s], k) => <g key={k} opacity=".78" filter="url(#d6-flou)" className="c-nuage" style={{ animationDuration: `${70 + k * 25}s` }}><ellipse cx={x} cy={y} rx={170 * s} ry={32 * s} fill="#fff" /><ellipse cx={x + 80} cy={y - 18} rx={100 * s} ry={28 * s} fill="#fff" /></g>)}
    </>
  )
}

// Silhouettes de passants (arrière-plan), qui traversent la scène.
export function Passants({ y = 700, n = 3, échelle = 0.9, teintes = ['#47506a', '#6b4f6b', '#3f5f5a'] }) {
  return Array.from({ length: n }, (_, i) => (
    <g key={i} className="d14-passant" style={{ animationDuration: `${26 + i * 9}s`, animationDelay: `${-i * 11}s` }}>
      <g transform={`translate(0,${y}) scale(${échelle * (0.85 + h(i, 3) * 0.3)})`}>
        <g className="d14-pas" style={{ animationDelay: `${i * 0.2}s` }}>
          <circle cy="-118" r="15" fill={teintes[i % teintes.length]} opacity=".9" />
          <path d="M-18,-100 C-18,-82 -16,-52 -12,-40 L12,-40 C16,-52 18,-82 18,-100 Z" fill={teintes[i % teintes.length]} opacity=".9" />
          <path d="M-10,-40 L-14,0 M10,-40 L14,0" stroke={teintes[i % teintes.length]} strokeWidth="9" strokeLinecap="round" opacity=".9" />
        </g>
      </g>
    </g>
  ))
}

export function Arbre({ x, sol = 720, r = 62, feuilles = ['#4f8a46', '#5f9e52', '#3f7339'] }) {
  return (
    <g>
      <rect x={x - 10} y={sol - 170} width="20" height="170" fill="#4a3424" />
      <g className="d14-feuillage" style={{ animationDelay: `${(x % 7) * 0.3}s` }}>
        {Array.from({ length: 7 }, (_, i) => <circle key={i} cx={x + Math.cos(i * 1.3) * r * 1.1} cy={sol - 210 + Math.sin(i * 1.9) * r * 0.8} r={r - (i % 3) * 10} fill={feuilles[i % 3]} />)}
      </g>
      <ellipse cx={x} cy={sol + 8} rx={r * 1.25} ry="12" fill="rgba(0,0,0,.18)" />
    </g>
  )
}

export function Lampadaire({ x, sol = 720 }) {
  return (
    <g>
      <rect x={x - 5} y={sol - 250} width="10" height="250" fill="#2f3542" />
      <path d={`M${x},${sol - 250} q0,-26 26,-26 l18,0`} stroke="#2f3542" strokeWidth="8" fill="none" />
      <path d={`M${x + 30},${sol - 276} l28,0 l-6,22 l-16,0 z`} fill="#3b4252" />
      <ellipse cx={x + 44} cy={sol - 250} rx="12" ry="5" fill="#fff4c2" opacity=".8" />
    </g>
  )
}

// Trottoir, bordure, chaussée et passage piéton.
export function Sol({ sol = 720 }) {
  return (
    <g>
      <rect y={sol} width="1600" height={900 - sol} fill="#cfc4ae" />
      {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${i * 100 - 40},900 L${800 + (i - 8) * 26},${sol}`} stroke="rgba(110,95,70,.16)" strokeWidth="2" />)}
      <rect y={sol + 96} width="1600" height="12" fill="#a8a08e" />
      <rect y={sol + 108} width="1600" height={900 - sol - 108} fill="#5a5f6b" />
      {Array.from({ length: 7 }, (_, i) => <rect key={i} x={600 + i * 62} y={sol + 126} width="38" height="60" fill="#e8e6df" opacity=".85" />)}
    </g>
  )
}

// ---------- L'école du quartier, jour d'élection ----------
function ÉcoleVote({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <Ciel id="d14-ciel-ecole" />
      <g opacity=".92">
        <Immeuble x={-40} l={360} hh={430} sol={720} />
        <Immeuble x={1290} l={360} hh={450} sol={720} teinte="#efe3cc" />
      </g>
      {[120, 1480].map(x => <Arbre key={x} x={x} r={70} feuilles={['#3f7a3f', '#4d8f48', '#356b35']} />)}
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <Sol />
      <g>
        {/* Corps du bâtiment */}
        <rect x="380" y="300" width="840" height="420" fill="url(#d6-pierre)" />
        <path d="M352,302 L1248,302 L1210,250 L390,250 Z" fill="#6b7a90" />
        <rect x="600" y="196" width="400" height="110" fill="#efe2c6" stroke="#bda884" strokeWidth="3" />
        <path d="M580,198 L1020,198 L800,128 Z" fill="#e4d6bb" stroke="#bda884" strokeWidth="4" />
        <text x="800" y="266" textAnchor="middle" fontFamily="Georgia, serif" fontSize="38" fontWeight="700" letterSpacing="6" fill="#5a4630">ÉCOLE PUBLIQUE</text>
        <text x="800" y="294" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" letterSpacing="5" fill="#8a7650">LIBERTÉ · ÉGALITÉ · FRATERNITÉ</text>
        <rect x="797" y="10" width="6" height="122" fill="#555" />
        <g className="c-drapeau-6"><rect x="803" y="12" width="26" height="40" fill="#1d4ed8" /><rect x="829" y="12" width="26" height="40" fill="#fff" /><rect x="855" y="12" width="26" height="40" fill="#dc2626" /></g>
        {/* Fenêtres, avec des dessins d'enfants */}
        {[0, 1].map(r => [0, 1, 2, 3, 4, 5].map(c => {
          if (r === 1 && (c === 2 || c === 3)) return null
          const x = 418 + c * 132, y = 338 + r * 170
          return (
            <g key={`${r}${c}`}>
              <path d={`M${x},${y + 120} L${x},${y + 26} Q${x + 46},${y - 6} ${x + 92},${y + 26} L${x + 92},${y + 120} Z`} fill="#a9c8e2" stroke="#8a7650" strokeWidth="5" />
              <path d={`M${x + 46},${y + 6} L${x + 46},${y + 120} M${x},${y + 70} L${x + 92},${y + 70}`} stroke="#8a7650" strokeWidth="4" />
              {r === 0 && h(c, 5) > 0.4 && <g opacity=".9"><circle cx={x + 24} cy={y + 46} r="9" fill="#fbbf24" /><path d={`M${x + 56},${y + 64} l12,-14 l12,14 z`} fill="#ef4444" /><rect x={x + 58} y={y + 64} width="20" height="12" fill="#60a5fa" /></g>}
            </g>
          )
        }))}
        {/* Porte et marches */}
        <path d="M730,720 L730,590 Q800,548 870,590 L870,720 Z" fill="#1e3a8a" />
        <path d="M800,566 L800,720" stroke="#14275e" strokeWidth="4" />
        <circle cx="788" cy="660" r="5" fill="#fcd34d" /><circle cx="812" cy="660" r="5" fill="#fcd34d" />
        {/* Muret et grille */}
        {[[380, 700], [900, 1220]].map(([a, b]) => (
          <g key={a}>
            <rect x={a} y="660" width={b - a} height="60" fill="#d9c9a6" />
            {Array.from({ length: Math.floor((b - a) / 22) }, (_, i) => <rect key={i} x={a + 8 + i * 22} y="612" width="5" height="50" fill="#2f3542" />)}
            <rect x={a} y="610" width={b - a} height="6" fill="#2f3542" />
          </g>
        ))}
        {/* Banderole « bureau de vote » */}
        <path d="M612,520 L600,610 M988,520 L1000,610" stroke="#6b5b45" strokeWidth="3" />
        <g className="d14-banderole">
          <rect x="590" y="486" width="420" height="64" rx="6" fill="#fffdf6" stroke="#1d4ed8" strokeWidth="4" />
          <rect x="590" y="486" width="18" height="64" fill="#1d4ed8" /><rect x="992" y="486" width="18" height="64" fill="#dc2626" />
          <text x="800" y="530" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="36" fontWeight="900" letterSpacing="3" fill="#1d3a8a">BUREAU DE VOTE</text>
        </g>
        {/* Panneaux d'affichage (sans affiches) */}
        {[1060, 1130].map(x => <g key={x}><rect x={x} y="596" width="58" height="80" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="3" /><rect x={x + 26} y="676" width="6" height="44" fill="#6b7280" /></g>)}
      </g>
      <Lampadaire x={300} />
      <Lampadaire x={1290} />
      <Passants y={716} n={3} échelle={0.62} />
    </svg>
  )
  return (
    <svg {...V}>
      <g opacity=".95">{[[60, 840, 170, -20], [150, 900, 200, -5], [1540, 850, 180, 25]].map(([x, y, r, a], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.3} transform={`rotate(${a} ${x} ${y})`} fill={k % 2 ? '#2f5a2f' : '#3d7a3a'} />)}</g>
    </svg>
  )
}

// ---------- La salle de classe devenue bureau de vote ----------
function Isoloir({ x, sol = 700, rideau = '#3b5b9a', bouge }) {
  return (
    <g>
      <rect x={x} y={sol - 330} width="8" height="330" fill="#9ca3af" />
      <rect x={x + 132} y={sol - 330} width="8" height="330" fill="#9ca3af" />
      <rect x={x} y={sol - 336} width="140" height="10" fill="#6b7280" />
      <g className={bouge ? 'd14-rideau' : undefined}>
        <path d={`M${x + 4},${sol - 326} L${x + 136},${sol - 326} L${x + 136},${sol - 96} Q${x + 70},${sol - 84} ${x + 4},${sol - 96} Z`} fill={rideau} />
        {[1, 2, 3, 4].map(k => <path key={k} d={`M${x + 4 + k * 26},${sol - 326} L${x + 4 + k * 26},${sol - 92}`} stroke="rgba(0,0,0,.16)" strokeWidth="3" />)}
      </g>
      <rect x={x + 30} y={sol - 30} width="24" height="30" fill="#374151" opacity=".55" />
    </g>
  )
}

function BureauVote({ couche, visuel }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <linearGradient id="d14-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbf1dd" /><stop offset="1" stopColor="#eedfc0" /></linearGradient>
      <rect width="1600" height="900" fill="url(#d14-mur)" />
      <rect y="560" width="1600" height="140" fill="#dccaa6" />
      <rect y="556" width="1600" height="8" fill="#b99f74" />
      {[[60, 120], [1340, 120]].map(([x, y]) => (
        <g key={x}>
          <rect x={x} y={y} width="200" height="330" rx="6" fill="#bfe0f6" stroke="#8a6a44" strokeWidth="10" />
          <path d={`M${x + 100},${y} L${x + 100},${y + 330} M${x},${y + 165} L${x + 200},${y + 165}`} stroke="#8a6a44" strokeWidth="6" />
          <path d={`M${x + 20},${y + 330} L${x + (x < 800 ? 320 : -120)},900 L${x + (x < 800 ? 520 : 80)},900 L${x + 180},${y + 330} Z`} fill="url(#d6-rayon)" opacity=".5" className="c-fenetre" />
        </g>
      ))}
      <rect x="540" y="130" width="520" height="250" rx="8" fill="#1f4d3a" stroke="#8a5a35" strokeWidth="14" />
      <text x="800" y="200" textAnchor="middle" fontFamily="Georgia, serif" fontSize="40" fill="rgba(255,255,255,.9)">Bureau de vote n° 1</text>
      <path d="M610,230 L990,230" stroke="rgba(255,255,255,.5)" strokeWidth="4" />
      <text x="800" y="290" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fill="rgba(255,255,255,.72)">Élection · dimanche</text>
      <text x="800" y="344" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" fill="rgba(255,255,255,.55)">Ouvert à tous les électeurs</text>
      <g transform="translate(1068,150)">{['#1d4ed8', '#f8fafc', '#dc2626'].map((c, k) => <rect key={c} x={k * 12} y="0" width="12" height="60" fill={c} />)}</g>
      <circle cx="800" cy="80" r="30" fill="#fff" stroke="#8a6a44" strokeWidth="6" /><path d="M800,80 L800,60 M800,80 L814,88" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <rect y="700" width="1600" height="200" fill="#b98b5e" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 150 - 60},900 L${800 + (i - 6) * 40},700`} stroke="rgba(80,40,10,.16)" strokeWidth="3" />)}
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <Isoloir x={300} rideau="#41629f" />
      <Isoloir x={460} rideau="#3b5b9a" bouge />
      <Isoloir x={1000} rideau="#3b5b9a" bouge />
      <Isoloir x={1160} rideau="#41629f" />
      {/* Table et urne transparente */}
      <rect x="640" y="600" width="320" height="22" rx="4" fill="#d9b98a" />
      <rect x="652" y="622" width="12" height="80" fill="#6b7280" /><rect x="936" y="622" width="12" height="80" fill="#6b7280" />
      <g>
        <rect x="740" y="488" width="120" height="112" rx="6" fill="rgba(214,236,255,.45)" stroke="#64748b" strokeWidth="4" />
        <rect x="740" y="480" width="120" height="14" rx="3" fill="#1d4ed8" />
        <rect x="780" y="482" width="40" height="6" rx="2" fill="#0b1b4a" />
        {[[752, 570, -8], [770, 578, 6], [800, 574, -3], [826, 580, 10], [790, 560, 14]].map(([x, y, a], k) => <rect key={k} x={x} y={y} width="34" height="20" rx="2" fill="#2f6fd6" opacity=".85" transform={`rotate(${a} ${x + 17} ${y + 10})`} />)}
        <rect x="740" y="488" width="120" height="112" rx="6" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" />
        {(visuel === 'majorite' || visuel === 'vote-secret') && <g className="d14-enveloppe"><rect x="784" y="452" width="32" height="20" rx="2" fill="#2563eb" stroke="#0b1b4a" strokeWidth="2" /></g>}
      </g>
      {/* Bulletins et enveloppes sur la table */}
      {[0, 1, 2].map(k => <rect key={k} x={662 + k * 6} y={586 - k * 4} width="52" height="14" fill="#fff" stroke="#cbd5e1" />)}
      {[0, 1].map(k => <rect key={k} x={878 + k * 5} y={588 - k * 4} width="46" height="12" fill="#2f6fd6" />)}
    </svg>
  )
  return (
    <svg {...V}>
      <g opacity=".9"><path d="M-20,900 L-20,700 Q60,660 140,700 L140,900 Z" fill="#7c4a2a" /><rect x="-20" y="690" width="170" height="20" rx="6" fill="#8a5a35" /></g>
      <g opacity=".9">{Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx={1520 + Math.cos(i) * 40} cy={760 + Math.sin(i * 1.7) * 40} rx="40" ry="70" transform={`rotate(${i * 30 - 60} ${1520} ${800})`} fill={['#3f7a3f', '#4d8f48'][i % 2]} />)}<rect x="1480" y="820" width="80" height="80" fill="#b45309" /></g>
    </svg>
  )
}

// ---------- La rue : résidence, bureau de l'emploi, centre de santé ----------
export function Horizon() {
  return (
    <g opacity=".55">
      {Array.from({ length: 11 }, (_, i) => { const x = i * 150 - 30, hh = 220 + h(i, 7) * 200; return <rect key={i} x={x} y={720 - hh} width="120" height={hh} fill={['#9fb4cc', '#b3c4d8', '#8fa6c0'][i % 3]} /> })}
    </g>
  )
}

function Résidence() {
  return (
    <g>
      <rect x="430" y="160" width="740" height="560" fill="#f1e4cf" />
      <rect x="420" y="150" width="760" height="18" fill="#c9b79a" />
      {Array.from({ length: 6 }, (_, e) => Array.from({ length: 6 }, (_, c) => {
        const x = 462 + c * 116, y = 186 + e * 84, déco = (e + c) % 3
        if (e === 2 && (c === 2 || c === 3)) return null // emplacement de l'enseigne
        return (
          <g key={`${e}${c}`}>
            <rect x={x} y={y} width="64" height="56" rx="3" fill={h(e * 6 + c, 2) > 0.7 ? '#fde68a' : '#9cc3e4'} />
            <path d={`M${x + 32},${y} L${x + 32},${y + 56}`} stroke="#e8dcc4" strokeWidth="4" />
            {e > 0 && <rect x={x - 6} y={y + 52} width="76" height="12" rx="2" fill={['#f59e0b', '#14b8a6', '#fb7185'][déco]} />}
            {e > 0 && h(e + c * 3, 9) > 0.55 && <g><circle cx={x + 10} cy={y + 48} r="8" fill="#4d8f48" /><circle cx={x + 22} cy={y + 46} r="7" fill="#5f9e52" /></g>}
          </g>
        )
      }))}
      <rect x="712" y="620" width="176" height="100" fill="#cfe6f7" stroke="#8a7650" strokeWidth="5" />
      <path d="M800,620 L800,720" stroke="#8a7650" strokeWidth="4" />
      <rect x="664" y="352" width="272" height="58" rx="8" fill="#0f766e" stroke="#e8dcc4" strokeWidth="4" />
      <text x="800" y="377" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="700" letterSpacing="3" fill="#ccfbf1">RÉSIDENCE</text>
      <text x="800" y="401" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="900" letterSpacing="2" fill="#fff">DES TILLEULS</text>
      <g transform="translate(1210,600)"><rect x="0" y="40" width="140" height="10" fill="#8a5a35" /><rect x="10" y="50" width="8" height="30" fill="#5b3a22" /><rect x="122" y="50" width="8" height="30" fill="#5b3a22" /><rect x="0" y="14" width="140" height="10" fill="#8a5a35" /></g>
    </g>
  )
}

function Emploi() {
  return (
    <g>
      <rect x="450" y="320" width="700" height="400" fill="#e8eef5" />
      <rect x="440" y="300" width="720" height="26" fill="#334155" />
      <rect x="470" y="360" width="660" height="340" fill="#b9d6ea" />
      {[0, 1, 2, 3, 4, 5].map(k => <rect key={k} x={470 + k * 110} y="360" width="8" height="340" fill="#64748b" />)}
      <rect x="470" y="520" width="660" height="8" fill="#64748b" />
      {/* Intérieur : bureaux et silhouettes */}
      <g opacity=".75">
        <rect x="530" y="600" width="170" height="16" fill="#8a6a44" /><rect x="540" y="616" width="8" height="70" fill="#5b4630" /><rect x="682" y="616" width="8" height="70" fill="#5b4630" />
        <circle cx="580" cy="556" r="18" fill="#475569" /><path d="M556,600 C556,574 604,574 604,600 Z" fill="#475569" />
        <circle cx="660" cy="560" r="17" fill="#7c5c4a" /><path d="M638,600 C638,578 682,578 682,600 Z" fill="#7c5c4a" />
        <rect x="900" y="560" width="120" height="90" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
        {[0, 1, 2].map(k => <rect key={k} x={912 + (k % 3) * 36} y="574" width="28" height="34" fill="#fde68a" />)}
        {[0, 1, 2].map(k => <rect key={k} x={912 + (k % 3) * 36} y="612" width="28" height="26" fill="#bfdbfe" />)}
      </g>
      <rect x="610" y="386" width="380" height="70" rx="10" fill="#1e3a8a" />
      <text x="800" y="434" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="38" fontWeight="900" letterSpacing="6" fill="#fff">💼 EMPLOI</text>
      <rect x="740" y="600" width="120" height="120" fill="#d8ecf8" stroke="#334155" strokeWidth="5" />
      <text x="800" y="584" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="700" fill="#1e293b">Accueil</text>
    </g>
  )
}

function Santé() {
  return (
    <g>
      <rect x="460" y="290" width="680" height="430" fill="#f8fafc" />
      <rect x="450" y="272" width="700" height="24" fill="#94a3b8" />
      <rect x="560" y="312" width="480" height="62" rx="10" fill="#0e7490" />
      <g className="d14-croix">
        <rect x="574" y="318" width="50" height="50" rx="7" fill="#16a34a" />
        <rect x="591" y="324" width="16" height="38" rx="2" fill="#fff" /><rect x="580" y="335" width="38" height="16" rx="2" fill="#fff" />
      </g>
      <text x="826" y="355" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="900" letterSpacing="4" fill="#fff">CENTRE DE SANTÉ</text>
      {[0, 1, 2, 3].map(c => [0, 1].map(r => <rect key={`${c}${r}`} x={500 + c * 160 + (c > 1 ? 40 : 0)} y={400 + r * 106} width="100" height="80" rx="4" fill="#bde3f2" stroke="#cbd5e1" strokeWidth="4" />))}
      <rect x="730" y="612" width="140" height="108" fill="#d8ecf8" stroke="#64748b" strokeWidth="5" />
      <path d="M800,612 L800,720" stroke="#64748b" strokeWidth="4" />
      <path d="M870,720 L1010,690 L1010,720 Z" fill="#cbd5e1" />
    </g>
  )
}

function Rue({ couche, bâtiment }) {
  if (couche === 'fond') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <Ciel id={`d14-ciel-${bâtiment}`} />
      <Horizon />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Defs /><style>{CSS}</style>
      <Sol />
      {bâtiment === 'residence' ? <Résidence /> : bâtiment === 'emploi' ? <Emploi /> : <Santé />}
      <Immeuble x={-60} l={330} hh={460} sol={720} teinte="#e9dcc4" />
      <Immeuble x={1330} l={330} hh={420} sol={720} teinte="#efe3cc" />
      <Arbre x={340} r={58} />
      <Arbre x={1260} r={62} />
      <Lampadaire x={420} />
      <Passants y={716} n={2} échelle={0.6} />
    </svg>
  )
  return (
    <svg {...V}>
      <g opacity=".95">{[[40, 850, 170, -15], [1560, 860, 190, 20]].map(([x, y, r, a], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.3} transform={`rotate(${a} ${x} ${y})`} fill={k % 2 ? '#2f5a2f' : '#3d7a3a'} />)}</g>
    </svg>
  )
}

export default function Decors14({ nom, couche, visuel }) {
  if (nom === 'ecole-vote') return <ÉcoleVote couche={couche} />
  if (nom === 'bureau-vote') return <BureauVote couche={couche} visuel={visuel} />
  if (nom === 'residence' || nom === 'emploi' || nom === 'sante') return <Rue couche={couche} bâtiment={nom} />
  return null
}
