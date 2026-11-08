// Décors du mode film, dessinés en CSS/SVG (aucune image à télécharger).
const abs = { position: 'absolute' }

function Immeubles({ couleur = '#0a0f1f', fenêtres = '#ffd86b', graine = 1, hauteur = 46 }) {
  const bâtiments = Array.from({ length: 14 }, (_, i) => {
    const h = 30 + ((i * 37 + graine * 13) % 55)
    return { x: i * 7.4 - 2, l: 6.6 + ((i * 3) % 3), h }
  })
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ ...abs, left: 0, right: 0, bottom: 0, width: '100%', height: `${hauteur}%` }} aria-hidden="true">
      {bâtiments.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={100 - b.h} width={b.l} height={b.h} fill={couleur} />
          {fenêtres && Array.from({ length: Math.floor(b.h / 9) }, (_, k) => [0, 1].map(c => ((i + k + c + graine) % 3 === 0 ? <rect key={`${k}${c}`} x={b.x + 1.2 + c * 2.6} y={100 - b.h + 3 + k * 8} width="1.5" height="3" fill={fenêtres} opacity=".85" /> : null)))}
        </g>
      ))}
    </svg>
  )
}

function Mairie() {
  return (
    <svg viewBox="0 -10 200 130" style={{ ...abs, left: '50%', bottom: '33%', width: 'min(78%, 500px)', transform: 'translateX(-50%)' }} aria-hidden="true">
      <rect x="20" y="48" width="160" height="72" fill="#f3e9d6" stroke="#b9a684" />
      <polygon points="14,50 100,14 186,50" fill="#e8dcc2" stroke="#b9a684" />
      <text x="100" y="42" textAnchor="middle" fontSize="11" fontWeight="800" fill="#6b5a3a" fontFamily="Georgia, serif">MAIRIE</text>
      <rect x="20" y="52" width="160" height="9" fill="#d8c8a6" />
      <text x="100" y="59" textAnchor="middle" fontSize="5.6" fill="#5a4a2e" fontFamily="Georgia, serif">LIBERTÉ · ÉGALITÉ · FRATERNITÉ</text>
      {[34, 62, 120, 148].map(x => <rect key={x} x={x} y="66" width="18" height="26" rx="2" fill="#8fb3d9" stroke="#b9a684" />)}
      <rect x="86" y="72" width="28" height="48" rx="3" fill="#7a4e2d" />
      {[26, 56, 140, 170].map(x => <rect key={x} x={x - 3} y="61" width="6" height="59" fill="#e2d4b6" />)}
      <line x1="100" y1="14" x2="100" y2="-6" stroke="#555" strokeWidth="1.5" />
      <g style={{ transformOrigin: '100px 0px', animation: 'f-drapeau 1.6s ease-in-out infinite' }}>
        <rect x="100" y="-6" width="7" height="12" fill="#1d4ed8" /><rect x="107" y="-6" width="7" height="12" fill="#fff" /><rect x="114" y="-6" width="7" height="12" fill="#dc2626" />
      </g>
    </svg>
  )
}

const étoiles = Array.from({ length: 34 }, (_, i) => ({ x: (i * 53) % 100, y: (i * 29) % 55, d: (i % 7) * 0.35 }))

export default function Decor({ nom }) {
  switch (nom) {
    case 'nuit-ville': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#060a1f 0%, #16224d 60%, #2b3b72 100%)' }}>
        {étoiles.map((e, i) => <span key={i} className="f-etoile" style={{ left: `${e.x}%`, top: `${e.y}%`, animationDelay: `${e.d}s` }} />)}
        <div style={{ ...abs, right: '12%', top: '10%', width: 70, height: 70, borderRadius: '50%', background: '#fdf6d8', boxShadow: '0 0 60px 20px rgba(253,246,216,.25)' }} />
        <Immeubles graine={2} />
      </div>
    )
    case 'chambre-matin': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#ffe9c9, #ffd39f)' }}>
        <div style={{ ...abs, left: '8%', top: '10%', width: '34%', height: '38%', border: '10px solid #fff7ec', borderRadius: 6, background: 'linear-gradient(#7cc4ff, #cdeaff)', overflow: 'hidden', boxShadow: 'inset 0 0 0 3px #e7c9a2' }}>
          <div style={{ ...abs, right: '14%', top: '16%', width: 46, height: 46, borderRadius: '50%', background: '#ffd34d', boxShadow: '0 0 40px 12px rgba(255,211,77,.6)', animation: 'f-soleil 3s ease-out both' }} />
          <div style={{ ...abs, left: '50%', top: 0, bottom: 0, width: 8, background: '#fff7ec' }} />
        </div>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '22%', background: 'linear-gradient(#c98b5a, #a86f45)' }} />
        <div style={{ ...abs, right: '6%', bottom: '18%', fontSize: 'clamp(50px, 12vh, 100px)' }}>🪴</div>
      </div>
    )
    case 'cuisine': return (
      <div style={{ ...abs, inset: 0, background: 'repeating-linear-gradient(90deg, #fdf3df 0 38px, #f6e8cc 38px 40px), #fdf3df' }}>
        <div style={{ ...abs, left: '62%', top: '9%', width: '26%', height: '30%', border: '8px solid #fff', borderRadius: 6, background: 'linear-gradient(#a7d8ff, #e6f5ff)' }} />
        <div style={{ ...abs, left: '6%', top: '12%', fontSize: 'clamp(34px, 7vh, 60px)' }}>🕰️</div>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '26%', background: 'linear-gradient(#b07446, #8a5631)', boxShadow: '0 -6px 0 #c58a58' }} />
      </div>
    )
    case 'parchemin': return <div style={{ ...abs, inset: 0, background: 'radial-gradient(circle at 50% 40%, #3b2a12, #120c05)' }} />
    case 'rue-mairie': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#7fbfff 0%, #d6efff 70%)' }}>
        {[0, 1].map(k => <div key={k} style={{ ...abs, top: `${8 + k * 14}%`, fontSize: 'clamp(40px, 8vh, 70px)', opacity: 0.9, animation: `f-nuage ${38 + k * 14}s linear ${-k * 16}s infinite` }}>☁️</div>)}
        <Immeubles couleur="#9fb4cf" fenêtres={null} graine={5} hauteur={40} />
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '34%', background: 'linear-gradient(#ddd5c4, #b8ad94)' }} />
        <Mairie />
      </div>
    )
    case 'bureau-vote': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#eef2f9, #d7deeb)' }}>
        <div style={{ ...abs, left: '8%', top: '8%', padding: '6px 14px', background: '#fff', border: '2px solid #1d4ed8', borderRadius: 6, color: '#1d4ed8', fontWeight: 900, fontSize: 'clamp(12px, 2vh, 18px)' }}>BUREAU DE VOTE</div>
        <div style={{ ...abs, right: '8%', bottom: '18%', width: '22%', height: '48%', background: 'repeating-linear-gradient(90deg, #6b7a99 0 10px, #56657f 10px 20px)', borderRadius: '8px 8px 0 0', boxShadow: '0 0 0 4px #3e4a63' }} />
        <div style={{ ...abs, left: '38%', right: '36%', bottom: '18%', height: '10%', background: '#a07650', borderRadius: 4 }} />
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '19%', background: 'repeating-linear-gradient(90deg, #c7ccd6 0 60px, #bcc2cd 60px 120px)' }} />
      </div>
    )
    case 'agence': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#e9f1ee, #d3e0db)' }}>
        <div style={{ ...abs, left: '6%', top: '7%', padding: '6px 14px', background: '#0f766e', color: '#fff', borderRadius: 6, fontWeight: 900, fontSize: 'clamp(12px, 2vh, 18px)', letterSpacing: '.06em' }}>APPARTEMENT À LOUER</div>
        <div style={{ ...abs, right: '7%', top: '9%', width: '28%', height: '34%', background: '#fff', border: '6px solid #94a3b8', borderRadius: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 6, boxSizing: 'border-box' }}>
          {['🏠', '🛋️', '🛏️', '🚿'].map(e => <span key={e} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontSize: 'clamp(16px, 3vh, 30px)' }}>{e}</span>)}
        </div>
        <div style={{ ...abs, left: '30%', right: '30%', bottom: '18%', height: '9%', background: '#7c5a3c', borderRadius: 4, boxShadow: '0 -4px 0 #9a7451' }} />
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '19%', background: 'repeating-linear-gradient(90deg, #b9c7c1 0 70px, #adbcb6 70px 140px)' }} />
      </div>
    )
    case 'ville-jour': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#ffd8a8 0%, #ffeccc 45%, #cfe8ff 100%)' }}>
        <Immeubles couleur="#6c7fa3" fenêtres="#ffe7a8" graine={7} hauteur={52} />
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '17%', background: '#9aa3b2' }} />
      </div>
    )
    case 'coucher-soleil': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#2b1055 0%, #7b2f8f 35%, #ff6a6a 70%, #ffb36b 100%)' }}>
        <div style={{ ...abs, left: '50%', bottom: '22%', width: 'min(40vw, 260px)', aspectRatio: '1', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle, #fff1b8, #ffb347)', boxShadow: '0 0 90px 30px rgba(255,179,71,.45)' }} />
        <Immeubles couleur="#2a0f3d" fenêtres="#ffb86b" graine={3} hauteur={40} />
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '17%', background: '#1c0a2a' }} />
      </div>
    )
    case 'mur-tags': case 'mur-fresque': {
      const fresque = nom === 'mur-fresque'
      return (
        <div style={{ ...abs, inset: 0, background: fresque ? 'linear-gradient(#7fbfff 0%, #e8f4ff 55%)' : 'linear-gradient(#93a5bf 0%, #dfe5ec 55%)' }}>
          <Immeubles couleur="#9fb4cf" fenêtres={null} graine={4} hauteur={62} />
          <div style={{ ...abs, left: 0, right: 0, bottom: '16%', height: '40%', background: 'repeating-linear-gradient(0deg, #e3d3b4 0 18px, #d9c7a7 18px 20px)', boxShadow: '0 -10px 0 #c8b38d' }}>
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" style={{ ...abs, inset: '8% 4%', width: '92%', height: '84%' }} aria-hidden="true">
              {fresque ? (
                <>
                  <rect x="0" y="0" width="200" height="60" rx="2" fill="#fbf7ee" />
                  <text x="100" y="16" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1d4ed8" fontFamily="Georgia, serif" letterSpacing="2">FRATERNITÉ</text>
                  {['#f1c9a5', '#8d5a3b', '#c98e64', '#5a3b22', '#e8b896', '#6b4226'].map((c, k) => <g key={c} transform={`rotate(${k * 60} 100 38)`}><rect x="104" y="35" width="30" height="7" rx="3" fill={['#2563eb', '#f2b134', '#22c3a6', '#dc2626', '#8b5cf6', '#f97316'][k]} /><ellipse cx="104" cy="38.5" rx="6" ry="4.5" fill={c} /></g>)}
                </>
              ) : [[10, 14, '#b91c1c'], [70, 10, '#111827'], [130, 16, '#7c3aed'], [30, 38, '#111827'], [100, 36, '#b91c1c'], [160, 40, '#111827']].map(([x, y, c], k) => (
                <path key={k} d={`M${x},${y} l5,-7 l4,9 l5,-8 l4,9 l5,-8 l4,8`} stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </svg>
          </div>
          <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '17%', background: 'linear-gradient(#bdb3a3, #a89d8b)' }} />
        </div>
      )
    }
    case 'bureau': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#eef2f5, #d8e0e6)' }}>
        <div style={{ ...abs, left: '6%', top: '7%', padding: '6px 14px', background: '#334155', color: '#fff', borderRadius: 6, fontWeight: 900, fontSize: 'clamp(12px, 2vh, 18px)', letterSpacing: '.06em' }}>RECRUTEMENT</div>
        <div style={{ ...abs, right: '6%', top: '8%', width: '34%', height: '42%', background: 'linear-gradient(#a9d3f0, #d9eefb)', border: '8px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}><Immeubles couleur="#7fa5c4" fenêtres={null} graine={6} hauteur={70} /></div>
        <div style={{ ...abs, left: '26%', right: '26%', bottom: '18%', height: '9%', background: '#c8a27a', borderRadius: 4, boxShadow: '0 -4px 0 #d9b48c' }} />
        <div style={{ ...abs, left: '44%', bottom: '27%', fontSize: 'clamp(26px, 6vh, 50px)' }}>💻</div>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '19%', background: 'repeating-linear-gradient(90deg, #b8c2c9 0 70px, #aab5bd 70px 140px)' }} />
      </div>
    )
    case 'fete-jour': case 'fete-nuit': {
      const nuit = nom === 'fete-nuit'
      const fanions = Array.from({ length: 22 }, (_, i) => ({ x: i * 4.6 + 0.5, y: 6 + Math.sin((i / 21) * Math.PI) * 9 }))
      return (
        <div style={{ ...abs, inset: 0, background: nuit ? 'linear-gradient(#0b1030 0%, #2a2350 60%, #4a3560 100%)' : 'linear-gradient(#7fbfff 0%, #d6efff 70%)' }}>
          {nuit && étoiles.map((e, i) => <span key={i} className="f-etoile" style={{ left: `${e.x}%`, top: `${e.y}%`, animationDelay: `${e.d}s` }} />)}
          {nuit && [[18, 14, '#f87171'], [78, 10, '#93c5fd'], [50, 6, '#fde68a'], [32, 26, '#86efac'], [88, 28, '#f0abfc']].map(([x, y, c], k) => (
            <svg key={k} viewBox="-50 -50 100 100" className="f-feu" style={{ ...abs, left: `${x}%`, top: `${y}%`, width: 'min(22vw, 150px)', transform: 'translate(-50%, -50%)', animationDelay: `${k * 0.8}s` }} aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * 10} y1={Math.sin(a) * 10} x2={Math.cos(a) * 44} y2={Math.sin(a) * 44} stroke={c} strokeWidth="3.5" strokeLinecap="round" /> })}
            </svg>
          ))}
          <Immeubles couleur={nuit ? '#1f1a3a' : '#9fb4cf'} fenêtres={nuit ? '#ffd86b' : null} graine={5} hauteur={40} />
          <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '34%', background: nuit ? 'linear-gradient(#4a3f50, #2e2638)' : 'linear-gradient(#ddd5c4, #b8ad94)' }} />
          <Mairie />
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ ...abs, left: 0, top: '4%', width: '100%', height: '16%' }} aria-hidden="true">
            <path d={`M0,6 Q50,24 100,6`} stroke="#3f3f46" strokeWidth=".5" fill="none" />
            {fanions.map((f, i) => <path key={i} d={`M${f.x},${f.y} l3.6,0 l-1.8,5 Z`} fill={['#1d4ed8', '#f8fafc', '#dc2626'][i % 3]} />)}
          </svg>
        </div>
      )
    }
    case 'salle-mairie': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#f3ead8, #e2d3b8)' }}>
        <div style={{ ...abs, left: '50%', top: '5%', transform: 'translateX(-50%)', padding: '5px 14px', background: '#1e3a8a', color: '#f2c94c', borderRadius: 6, fontFamily: 'Georgia, serif', fontSize: 'clamp(10px, 1.8vh, 15px)', letterSpacing: '.12em', whiteSpace: 'nowrap' }}>LIBERTÉ · ÉGALITÉ · FRATERNITÉ</div>
        {[6, 76].map(x => <div key={x} style={{ ...abs, left: `${x}%`, top: '14%', width: '18%', height: '44%', background: 'linear-gradient(#bcd9ee, #e6f3fb)', borderLeft: '10px solid #1e3a8a', borderRight: '10px solid #1e3a8a' }} />)}
        <svg viewBox="0 0 60 80" style={{ ...abs, left: '50%', bottom: '26%', width: 'min(20vw, 130px)', transform: 'translateX(-50%)' }} aria-label="Buste de Marianne au bonnet phrygien" role="img">
          <rect x="18" y="58" width="24" height="22" fill="#e7e0d2" /><rect x="14" y="55" width="32" height="5" rx="1" fill="#d8cfbd" />
          <path d="M8,56 C8,44 18,40 30,40 C42,40 52,44 52,56 Z" fill="#f3efe6" />
          <rect x="26" y="32" width="9" height="10" fill="#ece6da" />
          <ellipse cx="31" cy="26" rx="11" ry="13" fill="#f6f2ea" />
          <path d="M33,25 q3,-2 5,0" stroke="#4a4338" strokeWidth="1.4" fill="none" /><path d="M34,33 q2,1 4,0" stroke="#a24f42" strokeWidth="1.3" fill="none" />
          <path d="M19,24 C17,12 22,4 32,3 C40,2 46,8 44,15 C43,18 40,19 39,17 C40,14 38,12 36,13 C37,18 36,22 35,24 C29,26 24,26 19,24 Z" fill="#dc2626" />
          <circle cx="23" cy="18" r="3.2" fill="#1d4ed8" /><circle cx="23" cy="18" r="2" fill="#fff" /><circle cx="23" cy="18" r="1" fill="#dc2626" />
        </svg>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '26%', background: 'linear-gradient(#a0714a, #8a5f3c)' }} />
      </div>
    )
    case 'classe': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#f6edd9, #eadcbf)' }}>
        <div style={{ ...abs, left: '12%', right: '12%', top: '8%', height: '40%', background: '#1f4d3a', border: '10px solid #8a5a35', borderRadius: 6, boxShadow: 'inset 0 0 30px rgba(0,0,0,.35)' }}>
          <div style={{ ...abs, left: '8%', top: '14%', color: 'rgba(255,255,255,.85)', fontFamily: 'Georgia, serif', fontSize: 'clamp(14px, 2.6vh, 22px)' }}>Liberté · Égalité · Fraternité</div>
          <div style={{ ...abs, left: '8%', top: '46%', width: '50%', height: 3, background: 'rgba(255,255,255,.5)' }} />
          <div style={{ ...abs, left: '8%', top: '62%', width: '36%', height: 3, background: 'rgba(255,255,255,.4)' }} />
        </div>
        <div style={{ ...abs, right: '5%', top: '10%', fontSize: 'clamp(30px, 6vh, 52px)' }}>🕰️</div>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '22%', background: 'repeating-linear-gradient(90deg, #c08a5a 0 80px, #b57f50 80px 160px)' }} />
      </div>
    )
    case 'paysage': return (
      <div style={{ ...abs, inset: 0, background: 'linear-gradient(#8fd0ff 0%, #dff3ff 55%, #fff5d6 100%)' }}>
        {[0, 1].map(k => <div key={k} style={{ ...abs, top: `${6 + k * 12}%`, fontSize: 'clamp(40px, 8vh, 70px)', opacity: 0.9, animation: `f-nuage ${40 + k * 16}s linear ${-k * 18}s infinite` }}>☁️</div>)}
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ ...abs, left: 0, right: 0, bottom: '20%', width: '100%', height: '38%' }} aria-hidden="true">
          <path d="M0,40 L0,22 L14,8 L24,18 L36,4 L50,20 L62,10 L76,22 L88,12 L100,20 L100,40 Z" fill="#7d9cb8" />
          <path d="M33,7 L36,4 L39,8 Z M59,12 L62,10 L65,13 Z" fill="#fff" />
          <path d="M0,40 L0,30 Q25,22 50,30 T100,28 L100,40 Z" fill="#6fb35a" />
        </svg>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '21%', background: 'linear-gradient(#5fa04c, #4b8a3c)' }} />
      </div>
    )
    case 'tribunal': return (
      <div style={{ ...abs, inset: 0, background: 'repeating-linear-gradient(90deg, #6b4a2e 0 60px, #5e4027 60px 120px)' }}>
        <div style={{ ...abs, left: '50%', top: '6%', transform: 'translateX(-50%)', fontSize: 'clamp(40px, 9vh, 80px)', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.5))' }}>⚖️</div>
        <div style={{ ...abs, left: '22%', right: '22%', bottom: '18%', height: '22%', background: 'linear-gradient(#8a5a35, #6b4426)', borderRadius: '8px 8px 0 0', boxShadow: '0 -6px 0 #a06a40' }} />
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: '19%', background: '#3b2a1c' }} />
      </div>
    )
    default: return <div style={{ ...abs, inset: 0, background: 'radial-gradient(circle at 50% 30%, #2a2f55, #07080f)' }} />
  }
}
