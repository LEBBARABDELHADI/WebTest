// Décors et visuels du court-métrage de la page 10, en couches (fond, milieu,
// avant-plan) pour la profondeur : la caméra les déplace à des vitesses
// différentes (parallaxe) et floute l'avant-plan (profondeur de champ).
// Chaque décor est un SVG 1600 × 900.
const V = { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }
const hachure = (i, k = 1) => ((i * 9301 + 49297 * k) % 233280) / 233280

function Étagères({ x, y, l, h, sombre = false }) {
  const rangées = 5, hr = h / rangées
  const couleurs = sombre ? ['#4a2f2a', '#2f3b55', '#4b4a2a', '#5a2a3a', '#2a4a44', '#5b4630'] : ['#9b3d3d', '#2f5d8a', '#c7962f', '#3f7a58', '#7a4f8f', '#b8643a', '#3b4f6b', '#8a7a5a']
  const livres = []
  for (let r = 0; r < rangées; r++) {
    let cx = x + 8
    let i = 0
    while (cx < x + l - 20) {
      const w = 10 + hachure(r * 97 + i, 3) * 16
      const hh = hr * (0.62 + hachure(r * 13 + i, 7) * 0.3)
      const penché = hachure(r + i * 3, 5) > 0.93
      livres.push(<rect key={`${r}-${i}`} x={cx} y={y + (r + 1) * hr - hh - 6} width={w} height={hh} rx="2" fill={couleurs[(i * 7 + r * 3) % couleurs.length]} transform={penché ? `rotate(-9 ${cx} ${y + (r + 1) * hr - 6})` : undefined} />)
      if (hachure(i, r + 11) > 0.6) livres.push(<rect key={`b${r}-${i}`} x={cx + 2} y={y + (r + 1) * hr - hh * 0.75} width={w - 4} height="3" fill="rgba(255,230,170,.55)" />)
      cx += w + 1.5
      i++
    }
  }
  return (
    <g>
      <rect x={x - 10} y={y - 14} width={l + 20} height={h + 26} fill={sombre ? '#2a1c14' : '#6b4429'} />
      {livres}
      {Array.from({ length: rangées + 1 }, (_, r) => <rect key={r} x={x - 10} y={y + r * hr - 6} width={l + 20} height="10" fill={sombre ? '#3a271b' : '#8a5a36'} />)}
    </g>
  )
}

function Lampadaire({ x, y, h = 360, éclat = 1 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={90 * éclat} fill="url(#c-halo)" />
      <rect x={x - 5} y={y} width="10" height={h} fill="#1c1e2a" />
      <path d={`M${x - 22},${y + 6} L${x + 22},${y + 6} L${x + 14},${y - 24} L${x - 14},${y - 24} Z`} fill="#1c1e2a" />
      <rect x={x - 12} y={y - 18} width="24" height="22" fill="#ffd98a" />
    </g>
  )
}

const Défs = () => (
  <defs>
    <radialGradient id="c-halo"><stop offset="0" stopColor="rgba(255,214,140,.85)" /><stop offset=".35" stopColor="rgba(255,190,110,.28)" /><stop offset="1" stopColor="rgba(255,190,110,0)" /></radialGradient>
    <radialGradient id="c-halo-froid"><stop offset="0" stopColor="rgba(170,210,255,.7)" /><stop offset="1" stopColor="rgba(170,210,255,0)" /></radialGradient>
    <radialGradient id="c-or"><stop offset="0" stopColor="#fff3c4" /><stop offset=".5" stopColor="#ffd166" /><stop offset="1" stopColor="rgba(255,209,102,0)" /></radialGradient>
    <linearGradient id="c-rayon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,236,190,.55)" /><stop offset="1" stopColor="rgba(255,236,190,0)" /></linearGradient>
    <linearGradient id="c-pierre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe4d2" /><stop offset="1" stopColor="#c9b89c" /></linearGradient>
    <filter id="c-flou-doux"><feGaussianBlur stdDeviation="14" /></filter>
    <filter id="c-grain"><feTurbulence baseFrequency=".9" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .07 0" /></filter>
  </defs>
)

// Poussières dans la lumière, feuilles, pluie : petites animations d'ambiance.
export function Particules({ type, n = 26 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const x = hachure(i, 2) * 100, d = 6 + hachure(i, 4) * 10, del = -hachure(i, 6) * d
        if (type === 'pluie') return <span key={i} className="c-goutte" style={{ left: `${x}%`, animationDuration: `${0.6 + hachure(i, 8) * 0.5}s`, animationDelay: `${del / 8}s` }} />
        if (type === 'feuilles') return <span key={i} className="c-feuille" style={{ left: `${x}%`, animationDuration: `${d}s`, animationDelay: `${del}s`, background: ['#e07a32', '#c9542b', '#e8a33c', '#a8432a'][i % 4] }} />
        return <span key={i} className="c-poussiere" style={{ left: `${x}%`, top: `${hachure(i, 9) * 100}%`, animationDuration: `${d}s`, animationDelay: `${del}s` }} />
      })}
    </div>
  )
}

// ---------- Les décors ----------
function RueSoir({ couche, nuit }) {
  if (couche === 'fond') return (
    <svg {...V}><Défs />
      <linearGradient id="c-ciel-soir" x1="0" y1="0" x2="0" y2="1">{nuit ? <><stop offset="0" stopColor="#070b24" /><stop offset=".6" stopColor="#1b2556" /><stop offset="1" stopColor="#3a3f7a" /></> : <><stop offset="0" stopColor="#1d2250" /><stop offset=".45" stopColor="#7a4a86" /><stop offset=".8" stopColor="#f2895c" /><stop offset="1" stopColor="#ffc27a" /></>}</linearGradient>
      <rect width="1600" height="900" fill="url(#c-ciel-soir)" />
      {nuit ? Array.from({ length: 70 }, (_, i) => <circle key={i} cx={hachure(i, 1) * 1600} cy={hachure(i, 2) * 420} r={0.8 + hachure(i, 3) * 1.6} fill="#fff" className="c-scintille" style={{ animationDelay: `${hachure(i, 5) * 3}s` }} />)
        : <circle cx="1180" cy="560" r="160" fill="url(#c-or)" opacity=".75" />}
      {!nuit && [[220, 180, 1.2], [760, 120, 1], [1260, 220, 1.4]].map(([x, y, s], k) => <g key={k} opacity=".5" filter="url(#c-flou-doux)" className="c-nuage" style={{ animationDuration: `${80 + k * 30}s` }}><ellipse cx={x} cy={y} rx={180 * s} ry={34 * s} fill="#ffd6c2" /><ellipse cx={x + 90} cy={y - 18} rx={110 * s} ry={30 * s} fill="#ffe3d4" /></g>)}
      <path d="M0,600 L60,560 L60,520 L120,520 L120,480 L200,480 L200,540 L280,540 L280,470 L360,470 L360,430 L380,430 L380,470 L460,470 L460,540 L560,540 L560,500 L660,500 L660,560 L760,560 L760,520 L840,520 L840,470 L900,470 L900,520 L1000,520 L1000,560 L1100,560 L1100,500 L1200,500 L1200,450 L1240,450 L1240,500 L1340,500 L1340,550 L1440,550 L1440,510 L1520,510 L1520,560 L1600,560 L1600,900 L0,900 Z" fill={nuit ? '#0e1230' : '#3b2a4f'} opacity=".85" />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Défs />
      <rect x="0" y="760" width="1600" height="140" fill={nuit ? '#141626' : '#4a3a44'} />
      <rect x="0" y="752" width="1600" height="12" fill={nuit ? '#262a3d' : '#6a5560'} />
      <g>
        <rect x="430" y="250" width="740" height="510" fill="url(#c-pierre)" />
        <rect x="430" y="250" width="740" height="510" fill={nuit ? 'rgba(10,12,40,.55)' : 'rgba(120,60,90,.18)'} />
        <path d="M410,250 L1190,250 L1150,200 L450,200 Z" fill="#b9a78a" />
        <rect x="560" y="210" width="480" height="34" rx="4" fill="#2b2a3a" />
        <text x="800" y="235" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" letterSpacing="8" fill="#ffd98a">MÉDIATHÈQUE</text>
        {[0, 1, 2, 3].map(k => (
          <g key={k}>
            <path d={`M${480 + k * 175},${560} L${480 + k * 175},${360} Q${535 + k * 175},${300} ${590 + k * 175},${360} L${590 + k * 175},${560} Z`} fill="#ffcf7a" className="c-fenetre" style={{ animationDelay: `${k * 0.7}s` }} />
            <path d={`M${535 + k * 175},${310} L${535 + k * 175},${560} M${480 + k * 175},${450} L${590 + k * 175},${450}`} stroke="#6b4a2a" strokeWidth="6" />
            {[0, 1, 2].map(r => <rect key={r} x={490 + k * 175} y={470 + r * 28} width="90" height="5" fill="#8a5a2a" opacity=".55" />)}
          </g>
        ))}
        <rect x="760" y="600" width="80" height="160" rx="6" fill="#ffd98a" />
        <rect x="770" y="610" width="60" height="150" rx="4" fill="#c98a3a" opacity=".5" />
        <ellipse cx="800" cy="780" rx="260" ry="26" fill="rgba(255,200,120,.25)" />
      </g>
      {[[150, 420], [1440, 400]].map(([x, y], k) => (
        <g key={k}>
          <rect x={x - 8} y={y + 120} width="16" height={760 - y - 120} fill="#2a1d18" />
          {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={x + Math.cos(i) * 70} cy={y + Math.sin(i * 1.7) * 50 + 60} r={58 - (i % 3) * 8} fill={['#c9542b', '#e07a32', '#a8432a', '#e8a33c'][i % 4]} opacity={nuit ? 0.55 : 0.92} />)}
        </g>
      ))}
      <Lampadaire x={330} y={420} éclat={nuit ? 1.3 : 1} />
      <Lampadaire x={1280} y={420} éclat={nuit ? 1.3 : 1} />
    </svg>
  )
  return (
    <svg {...V}>
      <g opacity=".9">{Array.from({ length: 6 }, (_, i) => <circle key={i} cx={1480 + Math.cos(i) * 120} cy={80 + Math.sin(i) * 80} r={90} fill={['#a8432a', '#c9542b', '#7a2e1e'][i % 3]} />)}</g>
      <rect x="40" y="0" width="34" height="900" fill="#14101a" />
    </svg>
  )
}

function Médiathèque({ couche, nuit, étape, visuel }) {
  if (couche === 'fond') return (
    <svg {...V}><Défs />
      <rect width="1600" height="900" fill={nuit ? '#1a1220' : '#3b2618'} />
      <Étagères x={40} y={90} l={430} h={620} sombre={nuit} />
      <Étagères x={1130} y={90} l={430} h={620} sombre={nuit} />
      <path d="M560,700 L560,260 Q800,60 1040,260 L1040,700 Z" fill={nuit ? '#0d1a3a' : '#2a4a7a'} />
      <path d="M560,700 L560,260 Q800,60 1040,260 L1040,700 Z" fill="none" stroke="#6b4429" strokeWidth="22" />
      <path d="M800,120 L800,700 M560,420 L1040,420" stroke="#6b4429" strokeWidth="12" />
      {nuit ? <circle cx="930" cy="250" r="34" fill="#f4f1d8" opacity=".9" /> : <circle cx="880" cy="300" r="120" fill="url(#c-or)" opacity=".5" />}
      {!nuit && <g className="c-rayons">{[0, 1, 2].map(k => <path key={k} d={`M${640 + k * 120},200 L${520 + k * 160},900 L${720 + k * 160},900 L${720 + k * 120},200 Z`} fill="url(#c-rayon)" opacity=".5" />)}</g>}
      <rect y="700" width="1600" height="200" fill={nuit ? '#24160f' : '#5a3a22'} />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Défs />
      <circle cx="1180" cy="560" r={nuit ? 360 : 220} fill="url(#c-halo)" opacity={nuit ? 0.9 : 0.55} />
      <path d="M260,760 L1340,760 L1400,900 L200,900 Z" fill="#7a4a2a" />
      <rect x="200" y="740" width="1200" height="26" rx="6" fill="#9a6238" />
      <g>
        <path d="M1160,740 L1180,610 L1196,610 L1216,740 Z" fill="#2c2c34" />
        <path d="M1130,612 L1250,612 L1220,560 L1160,560 Z" fill="#2f6b5a" />
        <ellipse cx="1190" cy="614" rx="60" ry="8" fill="#ffe3a0" opacity=".8" />
      </g>
      <g className={(visuel === 'livre' || visuel === 'quatre-mots') && étape >= 1 ? 'c-livre-brille' : ''}>
        <path d="M640,742 L800,728 L960,742 L960,750 L800,740 L640,750 Z" fill="#e9dcc0" />
        <path d="M640,742 L800,728 L800,738 L640,750 Z" fill="#f6eedb" />
        <path d="M800,728 L800,740" stroke="#c9b48a" strokeWidth="2" />
      </g>
      <rect x="420" y="726" width="120" height="16" rx="3" fill="#2f5d8a" transform="rotate(-4 480 734)" />
      <rect x="1000" y="730" width="90" height="12" rx="3" fill="#9b3d3d" transform="rotate(6 1045 736)" />
    </svg>
  )
  return (
    <svg {...V}>
      <g opacity=".95">{[[90, 760, 160, -30], [150, 820, 190, -10], [40, 690, 150, -50], [1560, 800, 170, 30], [1500, 860, 200, 10]].map(([x, y, r, a], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.32} transform={`rotate(${a} ${x} ${y})`} fill={k % 2 ? '#2f5a2f' : '#3d7a3a'} />)}</g>
    </svg>
  )
}

function Visio({ couche }) {
  if (couche === 'fond') return (
    <svg {...V}><Défs />
      <rect width="800" height="900" fill="#141a33" />
      <rect x="120" y="120" width="560" height="440" rx="10" fill="#0b1030" />
      {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={140 + hachure(i, 1) * 520} cy={300 + hachure(i, 2) * 240} r={8 + hachure(i, 3) * 22} fill={['#ffd166', '#f472b6', '#93c5fd'][i % 3]} opacity={0.18 + hachure(i, 4) * 0.25} filter="url(#c-flou-doux)" />)}
      <path d="M120,120 L680,120 L680,560 L120,560 Z M400,120 L400,560 M120,340 L680,340" fill="none" stroke="#3a2a22" strokeWidth="14" />
      <circle cx="140" cy="760" r="300" fill="url(#c-halo)" opacity=".6" />
      <rect x="0" y="700" width="800" height="200" fill="#2a1d24" />
      <linearGradient id="c-ciel-reu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4fb3ff" /><stop offset=".7" stopColor="#bfe6ff" /><stop offset="1" stopColor="#ffe7b8" /></linearGradient>
      <rect x="800" width="800" height="900" fill="url(#c-ciel-reu)" />
      <circle cx="1420" cy="170" r="70" fill="#fff6c8" /><circle cx="1420" cy="170" r="140" fill="url(#c-or)" opacity=".5" />
      <path d="M800,600 L960,420 L1040,470 L1160,330 L1240,380 L1330,300 L1460,450 L1600,520 L1600,640 L800,640 Z" fill="#3d7a5a" />
      <path d="M1160,330 L1200,300 L1240,320 L1240,380 Z" fill="#2f5d45" />
      <rect x="800" y="630" width="800" height="120" fill="#1f8fbf" />
      {[0, 1, 2].map(k => <path key={k} d={`M800,${650 + k * 30} Q1000,${640 + k * 30} 1200,${655 + k * 30} T1600,${650 + k * 30}`} stroke="rgba(255,255,255,.5)" strokeWidth="3" fill="none" className="c-vague" style={{ animationDelay: `${k * 0.7}s` }} />)}
      <rect x="800" y="740" width="800" height="160" fill="#f2d9a6" />
    </svg>
  )
  if (couche === 'milieu') return (
    <svg {...V}><Défs />
      <g transform="translate(1480,500)" className="c-palmier">
        <path d="M0,260 C10,160 0,60 20,0" stroke="#7a5230" strokeWidth="22" fill="none" />
        {[-70, -30, 10, 50, 90, 130].map((a, k) => <path key={k} d="M20,0 C70,-30 130,-10 170,40" stroke="#2f7a3a" strokeWidth="18" fill="none" strokeLinecap="round" transform={`rotate(${a} 20 0)`} />)}
      </g>
      <rect x="784" y="0" width="32" height="900" fill="#0a0a12" />
    </svg>
  )
  return <Particules type="pluie" n={40} />
}

function Cultes({ couche, étape }) {
  if (couche === 'fond') return (
    <svg {...V}><Défs />
      <linearGradient id="c-ciel-cultes" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b1660" /><stop offset=".5" stopColor="#c0507a" /><stop offset=".85" stopColor="#ffb36b" /><stop offset="1" stopColor="#ffd59a" /></linearGradient>
      <rect width="1600" height="900" fill="url(#c-ciel-cultes)" />
      <circle cx="800" cy="610" r="190" fill="url(#c-or)" opacity=".9" />
    </svg>
  )
  if (couche === 'milieu') {
    const fenêtres = (x, y, n) => Array.from({ length: n }, (_, i) => <rect key={i} x={x + i * 26} y={y} width="12" height="20" rx="6" fill={étape >= 1 ? '#ffd98a' : '#2a1838'} style={{ transition: 'fill 1.2s', transitionDelay: `${i * 0.15}s` }} />)
    const sil = '#2a1838'
    return (
      <svg {...V} preserveAspectRatio="xMidYMax meet"><Défs />
        <g>
          <rect x="140" y="470" width="180" height="300" fill={sil} /><path d="M140,470 L230,300 L320,470 Z" fill={sil} /><rect x="222" y="250" width="16" height="60" fill={sil} /><rect x="210" y="266" width="40" height="12" fill={sil} />{fenêtres(168, 540, 5)}
        </g>
        <g>
          <rect x="420" y="520" width="220" height="250" fill={sil} /><path d="M440,520 Q530,400 620,520 Z" fill={sil} /><rect x="660" y="360" width="34" height="410" fill={sil} /><path d="M660,360 L677,320 L694,360 Z" fill={sil} /><path d="M524,402 a10,10 0 1,0 12,-2 a7,7 0 1,1 -12,2 Z" fill={sil} />{fenêtres(450, 600, 6)}
        </g>
        <g transform="translate(800,0)">
          <rect x="-120" y="500" width="240" height="270" fill={sil} /><path d="M-130,500 L130,500 L0,430 Z" fill={sil} />
          <rect x="-3" y="350" width="6" height="84" fill={sil} />
          <rect x="3" y="352" width="22" height="34" fill="#1d4ed8" opacity={étape >= 2 ? 1 : 0.5} /><rect x="25" y="352" width="22" height="34" fill="#fff" opacity={étape >= 2 ? 1 : 0.5} /><rect x="47" y="352" width="22" height="34" fill="#dc2626" opacity={étape >= 2 ? 1 : 0.5} />
          <text x="0" y="560" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" letterSpacing="4" fill={étape >= 2 ? '#fff3c4' : '#6b5a7a'}>MAIRIE</text>
          {fenêtres(-90, 600, 7)}
          {étape >= 2 && <circle cx="0" cy="560" r="230" fill="none" stroke="#fff3c4" strokeWidth="4" strokeDasharray="6 10" className="c-neutre" />}
        </g>
        <g>
          <rect x="960" y="510" width="220" height="260" fill={sil} /><path d="M950,510 L1190,510 L1070,450 Z" fill={sil} /><path d="M1070,470 l12,20 h-24 Z M1070,498 l12,-20 h-24 Z" fill="none" stroke="#ffd98a" strokeWidth="3" opacity={étape >= 1 ? 1 : 0.3} />{fenêtres(990, 580, 6)}
        </g>
        <g>
          <rect x="1270" y="560" width="200" height="210" fill={sil} /><path d="M1240,560 L1500,560 L1460,520 L1280,520 Z" fill={sil} /><path d="M1280,520 L1460,520 L1420,480 L1320,480 Z" fill={sil} /><path d="M1320,480 L1420,480 L1370,440 Z" fill={sil} />{fenêtres(1295, 620, 6)}
        </g>
        <rect y="770" width="1600" height="130" fill="#1a0f26" />
      </svg>
    )
  }
  return <Particules type="poussiere" n={22} />
}

function Atmosphère({ couche, teinte }) {
  const t = {
    plan: ['#0d3b66', '#062544', 'rgba(255,255,255,.08)'],
    hierarchie: ['#24346e', '#060818', null],
    pouvoirs: ['#1b2a5c', '#12081a', null],
    carton: ['#121220', '#040407', null],
    parchemin: ['#3a2414', '#120a05', null],
  }[teinte]
  if (couche === 'fond') return (
    <svg {...V}><Défs />
      <radialGradient id={`c-atm-${teinte}`} cx=".5" cy=".35"><stop offset="0" stopColor={t[0]} /><stop offset="1" stopColor={t[1]} /></radialGradient>
      <rect width="1600" height="900" fill={`url(#c-atm-${teinte})`} />
      {t[2] && Array.from({ length: 40 }, (_, i) => <path key={i} d={`M${i * 40},0 L${i * 40},900`} stroke={t[2]} />)}
      {t[2] && Array.from({ length: 23 }, (_, i) => <path key={`h${i}`} d={`M0,${i * 40} L1600,${i * 40}`} stroke={t[2]} />)}
      {(teinte === 'hierarchie' || teinte === 'pouvoirs') && Array.from({ length: 60 }, (_, i) => <circle key={i} cx={hachure(i, 1) * 1600} cy={hachure(i, 2) * 900} r={0.8 + hachure(i, 3) * 1.4} fill="#cfe0ff" className="c-scintille" style={{ animationDelay: `${hachure(i, 4) * 3}s` }} />)}
      {teinte === 'carton' && <><circle cx="300" cy="200" r="520" fill="rgba(37,99,235,.2)" filter="url(#c-flou-doux)" /><circle cx="1300" cy="700" r="520" fill="rgba(220,38,38,.18)" filter="url(#c-flou-doux)" /></>}
      {teinte === 'parchemin' && <><circle cx="1320" cy="320" r="380" fill="url(#c-halo)" className="c-bougie-lum" /><rect y="680" width="1600" height="220" fill="#2a190d" /></>}
      <rect width="1600" height="900" filter="url(#c-grain)" />
    </svg>
  )
  if (couche === 'avant' && teinte === 'parchemin') return (
    <svg {...V}><g transform="translate(1440,760)"><rect x="-16" y="-110" width="32" height="110" rx="7" fill="#f6efe0" /><path d="M0,-110 C-12,-134 -5,-156 0,-168 C5,-156 12,-134 0,-110 Z" fill="#ffb347" className="c-flamme" /></g></svg>
  )
  if (couche === 'avant') return <Particules type="poussiere" n={16} />
  return null
}

export default function DecorCinema({ nom, couche, étape = 0, visuel }) {
  switch (nom) {
    case 'rue-soir': return <RueSoir couche={couche} />
    case 'rue-nuit': return <RueSoir couche={couche} nuit />
    case 'mediatheque': return <Médiathèque couche={couche} étape={étape} visuel={visuel} />
    case 'mediatheque-nuit': return <Médiathèque couche={couche} nuit étape={étape} visuel={visuel} />
    case 'visio': return <Visio couche={couche} />
    case 'cultes': return <Cultes couche={couche} étape={étape} />
    case 'plan': case 'hierarchie': case 'pouvoirs': case 'carton': case 'parchemin': return <Atmosphère couche={couche} teinte={nom} />
    default: return null
  }
}
