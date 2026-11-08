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
    default: return <div style={{ ...abs, inset: 0, background: 'radial-gradient(circle at 50% 30%, #2a2f55, #07080f)' }} />
  }
}
