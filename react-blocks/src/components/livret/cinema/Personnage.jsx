import { useEffect, useId, useState } from 'react'

// Personnage dessiné (style animation japonaise), en SVG : yeux expressifs qui
// clignent, sourcils, bouche synchronisée avec la parole (ou la vraie voix
// enregistrée : `niveau` 0 à 1), gestes, respiration, lumière de bord.
// Proportions : viewBox 240 × 320 (cadrage buste).

const ombre = (hex, k = 0.82) => {
  const n = parseInt(hex.slice(1), 16)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * k))
  return `rgb(${c.join(',')})`
}

function Cheveux({ style, c, id, devant }) {
  const reflet = 'rgba(255,255,255,.28)'
  if (style === 'longs') {
    return devant ? (
      <g>
        <path d="M76,120 C70,74 98,50 126,52 C156,54 170,82 164,118 C160,100 150,84 136,78 C138,92 132,100 124,104 C126,92 120,84 112,80 C106,96 92,104 82,108 C80,112 78,116 76,120 Z" fill={`url(#${id}-ch)`} />
        <path d="M84,102 C92,88 104,76 118,70" stroke={reflet} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M150,80 C156,88 160,98 162,108" stroke={reflet} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    ) : (
      <path d="M72,122 C62,70 96,44 124,46 C158,48 180,78 170,128 C176,170 180,214 172,250 C160,236 156,214 156,196 L84,196 C84,214 80,236 68,250 C60,214 64,170 72,122 Z" fill={ombre(c, 0.78)} />
    )
  }
  if (style === 'boucles') {
    const boucles = [[86, 70, 22], [112, 54, 24], [142, 58, 24], [164, 82, 20], [70, 96, 18], [172, 108, 16], [64, 124, 14], [176, 132, 13]]
    return devant ? (
      <g>
        {[[96, 76, 14], [118, 66, 15], [142, 72, 14], [158, 90, 11], [82, 94, 11]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={`url(#${id}-ch)`} />)}
        <path d="M100,70 C108,64 118,62 126,64" stroke={reflet} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    ) : <g>{boucles.map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={ombre(c, 0.8)} />)}</g>
  }
  // courts (gris pour M. Arnaud)
  return devant ? (
    <g>
      <path d="M80,106 C78,76 98,58 122,58 C146,58 164,74 162,104 C156,90 146,82 132,80 C122,86 104,86 92,84 C86,90 82,98 80,106 Z" fill={`url(#${id}-ch)`} />
      <path d="M96,76 C108,70 122,68 136,70" stroke={reflet} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ) : <path d="M76,118 C70,76 96,54 122,54 C150,54 172,78 166,120 L162,150 L80,150 Z" fill={ombre(c, 0.8)} />
}

function Tenue({ style, c, id }) {
  const corps = <path d="M30,320 C32,262 66,234 120,230 C174,234 208,262 210,320 Z" fill={`url(#${id}-te)`} />
  if (style === 'gilet') return (
    <g>
      {corps}
      <path d="M104,232 L120,282 L136,232 Z" fill="#eef1f7" />
      <path d="M112,240 L120,262 L128,240 L120,246 Z" fill="#7a2e3a" />
      <path d="M98,234 L120,300 L92,320 L70,320 Z" fill={ombre(c, 0.86)} opacity=".6" />
      {[262, 284, 306].map(y => <circle key={y} cx="128" cy={y} r="2.6" fill={ombre(c, 0.6)} />)}
    </g>
  )
  if (style === 'veste') return (
    <g>
      {corps}
      <path d="M100,232 C108,262 112,290 114,320 L126,320 C128,290 132,262 140,232 C130,240 110,240 100,232 Z" fill="#fff7e8" />
      <path d="M96,234 L114,290 L104,320 L78,320 C84,290 88,262 96,234 Z" fill={ombre(c, 0.86)} />
      <path d="M144,234 L126,290 L136,320 L162,320 C156,290 152,262 144,234 Z" fill={ombre(c, 0.86)} />
    </g>
  )
  return (
    <g>
      {corps}
      <path d="M100,232 C108,246 132,246 140,232" stroke={ombre(c, 0.7)} strokeWidth="4" fill="none" />
    </g>
  )
}

// Expressions : sourcils (décalage vertical, angle), yeux, bouche, rougeurs.
const EXPR = {
  neutre: { sy: 0, sa: 0, yeux: 'ouverts', bouche: 'neutre' },
  joie: { sy: -3, sa: 4, yeux: 'heureux', bouche: 'sourire', rose: true },
  sourire: { sy: -1, sa: 2, yeux: 'ouverts', bouche: 'sourire', rose: true },
  surprise: { sy: -8, sa: 5, yeux: 'grands', bouche: 'o' },
  inquiet: { sy: -3, sa: 12, yeux: 'ouverts', bouche: 'inquiet' },
  réflexion: { sy: -2, sa: 6, yeux: 'haut', bouche: 'moue' },
  fâché: { sy: 2, sa: -14, yeux: 'ouverts', bouche: 'triste' },
  fier: { sy: -1, sa: -3, yeux: 'mi', bouche: 'sourire', rose: true },
  tendre: { sy: -2, sa: 6, yeux: 'mi', bouche: 'sourire', rose: true },
}

function Œil({ cx, cy, iris, état, dx, uid }) {
  if (état === 'heureux') return <path d={`M${cx - 10},${cy + 2} Q${cx},${cy - 9} ${cx + 10},${cy + 2}`} stroke="#2a1a14" strokeWidth="3.4" fill="none" strokeLinecap="round" />
  const ry = état === 'grands' ? 11 : état === 'mi' ? 6.5 : 9.2
  const ix = cx + dx, iy = cy + (état === 'haut' ? -2.5 : 0) + (état === 'mi' ? 1.5 : 0)
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="10.5" ry={ry} fill="#fff" />
      <clipPath id={`${uid}-oeil-${cx}`}><ellipse cx={cx} cy={cy} rx="10.5" ry={ry} /></clipPath>
      <g clipPath={`url(#${uid}-oeil-${cx})`}>
        <ellipse cx={ix} cy={iy} rx={état === 'grands' ? 5.6 : 7} ry={état === 'grands' ? 6.8 : 8.4} fill={iris} />
        <ellipse cx={ix} cy={iy - 2.5} rx="6" ry="4" fill="rgba(0,0,0,.25)" />
        <ellipse cx={ix} cy={iy + 0.5} rx="3.1" ry="3.9" fill="#120c0a" />
        <circle cx={ix + 2.8} cy={iy - 3.4} r="2.5" fill="#fff" />
        <circle cx={ix - 2.6} cy={iy + 3.4} r="1.1" fill="#fff" opacity=".85" />
      </g>
      <path d={`M${cx - 12},${cy - ry + 3} Q${cx},${cy - ry - 4} ${cx + 12},${cy - ry + 2}`} stroke="#1c1210" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d={`M${cx + 11},${cy - ry + 2} l4,-3`} stroke="#1c1210" strokeWidth="2.2" strokeLinecap="round" />
      {état === 'mi' && <path d={`M${cx - 11},${cy - 2} Q${cx},${cy - 7} ${cx + 11},${cy - 2}`} stroke="#1c1210" strokeWidth="2.4" fill="none" />}
    </g>
  )
}

function Bouche({ forme, ouverture }) {
  const x = 120, y = 154
  if (ouverture > 0.08) {
    const h = 3 + ouverture * 10
    return (
      <g>
        <path d={`M${x - 9},${y - 1} Q${x},${y - 4} ${x + 9},${y - 1} Q${x + 7},${y + h} ${x},${y + h + 1} Q${x - 7},${y + h} ${x - 9},${y - 1} Z`} fill="#5a1f24" />
        <path d={`M${x - 7},${y - 1} Q${x},${y - 3} ${x + 7},${y - 1} L${x + 6},${y + 1.4} L${x - 6},${y + 1.4} Z`} fill="#fff" opacity=".9" />
        {h > 7 && <ellipse cx={x} cy={y + h - 1.5} rx="4.5" ry="2.2" fill="#d4636b" />}
      </g>
    )
  }
  const d = {
    neutre: `M${x - 8},${y} Q${x},${y + 3} ${x + 8},${y}`,
    sourire: `M${x - 11},${y - 2} Q${x},${y + 9} ${x + 11},${y - 2}`,
    inquiet: `M${x - 8},${y + 2} Q${x - 3},${y - 1} ${x},${y + 1} Q${x + 4},${y + 3} ${x + 8},${y}`,
    moue: `M${x - 4},${y + 1} Q${x + 2},${y + 3} ${x + 8},${y - 1}`,
    triste: `M${x - 9},${y + 4} Q${x},${y - 3} ${x + 9},${y + 4}`,
  }[forme]
  if (forme === 'o') return <ellipse cx={x} cy={y + 2} rx="4.4" ry="5.6" fill="#5a1f24" />
  return <path d={d} stroke="#6b2a2a" strokeWidth="2.8" fill={forme === 'sourire' ? 'rgba(255,255,255,.0)' : 'none'} strokeLinecap="round" />
}

function Geste({ type, peau, tenue }) {
  if (!type) return null
  const manche = ombre(tenue, 0.92)
  if (type === 'explique') return (
    <g className="c-geste">
      <path d="M186,320 C186,296 178,270 168,252 L150,262 C158,280 162,300 160,320 Z" fill={manche} />
      <path d="M150,262 C146,250 150,238 160,236 C166,226 176,228 176,236 C182,238 182,246 176,252 C172,260 160,266 150,262 Z" fill={peau} />
      <path d="M164,236 C164,222 166,212 170,208 C174,206 176,210 174,218 L172,236" fill={peau} />
    </g>
  )
  if (type === 'montre') return (
    <g className="c-geste">
      <path d="M190,320 C192,290 196,262 208,244 L196,232 C182,250 172,282 168,320 Z" fill={manche} />
      <path d="M196,232 C198,222 210,218 218,224 L236,218 C240,218 240,224 236,226 L222,232 C224,240 214,248 204,246 Z" fill={peau} />
    </g>
  )
  if (type === 'cœur') return (
    <g className="c-geste">
      <path d="M70,320 C76,292 92,274 108,266 L122,278 C108,288 96,304 92,320 Z" fill={manche} />
      <path d="M108,266 C112,254 128,250 136,258 C142,266 136,280 124,282 C116,284 110,278 108,266 Z" fill={peau} />
    </g>
  )
  return null
}

export default function Personnage({ p, émotion = 'neutre', parle = false, niveau = null, regard = 'face', geste = null, lumière = 'rgba(255,214,160,.55)' }) {
  const id = useId().replace(/:/g, '')
  const e = EXPR[émotion] || EXPR.neutre
  const [ouv, setOuv] = useState(0)
  // Sans enregistrement : la bouche bouge au rythme naturel de la parole
  // (syllabes irrégulières, petites pauses), pas en boucle mécanique.
  useEffect(() => {
    if (!parle || niveau != null) return undefined
    let t
    const pas = () => {
      const pause = Math.random() < 0.12
      setOuv(pause ? 0 : 0.25 + Math.random() * 0.75)
      t = setTimeout(pas, pause ? 180 + Math.random() * 160 : 70 + Math.random() * 90)
    }
    pas()
    return () => clearTimeout(t)
  }, [parle, niveau])
  const ouverture = !parle ? 0 : niveau != null ? Math.min(1, niveau * 2.2) : ouv
  const dx = regard === 'gauche' ? -2.6 : regard === 'droite' ? 2.6 : 0
  const iris = p.yeux || '#4b3424'
  const délaiCligne = `${(id.charCodeAt(id.length - 1) % 7) * 0.53}s`
  return (
    <svg viewBox="0 0 240 320" className={`c-perso ${parle ? 'c-parle' : ''}`} style={{ width: '100%', height: '100%', overflow: 'visible', filter: `drop-shadow(0 0 1.5px ${lumière}) drop-shadow(0 14px 18px rgba(0,0,0,.35))` }} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-pe`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.peau} /><stop offset="1" stopColor={ombre(p.peau, 0.88)} /></linearGradient>
        <linearGradient id={`${id}-ch`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.cheveux.couleur} /><stop offset="1" stopColor={ombre(p.cheveux.couleur, 0.7)} /></linearGradient>
        <linearGradient id={`${id}-te`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.tenue.couleur} /><stop offset="1" stopColor={ombre(p.tenue.couleur, 0.7)} /></linearGradient>
      </defs>
      <g className="c-respire">
        <Cheveux style={p.cheveux.style} c={p.cheveux.couleur} id={id} devant={false} />
        <path d="M107,176 L107,214 Q120,222 133,214 L133,176 Z" fill={ombre(p.peau, 0.84)} />
        <g transform="translate(120 320) scale(1.02 1.28) translate(-120 -320)"><Tenue style={p.tenue.style} c={p.tenue.couleur} id={id} /></g>
        <g transform="translate(120 196) scale(1.1) translate(-120 -184)"><g className="c-tete">
          <ellipse cx="80" cy="128" rx="7" ry="11" fill={ombre(p.peau, 0.92)} />
          <ellipse cx="160" cy="128" rx="7" ry="11" fill={ombre(p.peau, 0.92)} />
          <path d="M80,120 C80,80 98,60 120,60 C142,60 160,80 160,120 C160,152 144,178 120,186 C96,178 80,152 80,120 Z" fill={`url(#${id}-pe)`} />
          <path d="M84,140 C90,166 104,180 120,186 C136,180 150,166 156,140 C150,160 136,174 120,178 C104,174 90,160 84,140 Z" fill={ombre(p.peau, 0.9)} opacity=".6" />
          {e.rose && <><ellipse cx="96" cy="144" rx="8" ry="4" fill="#ff7a8a" opacity=".32" /><ellipse cx="144" cy="144" rx="8" ry="4" fill="#ff7a8a" opacity=".32" /></>}
          <g className="c-yeux" style={{ animationDelay: délaiCligne }}>
            <Œil cx={101} cy={126} iris={iris} état={e.yeux} dx={dx} uid={id} />
            <Œil cx={139} cy={126} iris={iris} état={e.yeux} dx={dx} uid={id} />
          </g>
          <g style={{ transition: 'transform .35s', transform: `translateY(${e.sy}px)` }}>
            <path d="M90,108 Q101,102 112,106" stroke={ombre(p.cheveux.couleur, 0.8)} strokeWidth="3.4" fill="none" strokeLinecap="round" style={{ transformOrigin: '112px 106px', transform: `rotate(${-e.sa}deg)`, transition: 'transform .35s' }} />
            <path d="M128,106 Q139,102 150,108" stroke={ombre(p.cheveux.couleur, 0.8)} strokeWidth="3.4" fill="none" strokeLinecap="round" style={{ transformOrigin: '128px 106px', transform: `rotate(${e.sa}deg)`, transition: 'transform .35s' }} />
          </g>
          <path d="M121,134 q-3,9 1,10" stroke={ombre(p.peau, 0.7)} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".7" />
          {p.moustache && <path d="M108,147 C114,143 120,145 120,147 C120,145 126,143 132,147 C128,150 122,149 120,148 C118,149 112,150 108,147 Z" fill={ombre(p.cheveux.couleur, 0.85)} />}
          <Bouche forme={e.bouche} ouverture={ouverture} />
          {p.lunettes && (
            <g fill="none" stroke="#3a3440" strokeWidth="2.4">
              <rect x="87" y="114" width="28" height="22" rx="7" />
              <rect x="125" y="114" width="28" height="22" rx="7" />
              <path d="M115,123 Q120,120 125,123" />
              <path d="M92,118 L100,132" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
              <path d="M130,118 L138,132" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
            </g>
          )}
          <Cheveux style={p.cheveux.style} c={p.cheveux.couleur} id={id} devant />
          {p.barrette && <rect x="146" y="88" width="12" height="5" rx="2.5" fill={p.barrette} transform="rotate(-30 152 90)" />}
        </g></g>
        <Geste type={geste} peau={p.peau} tenue={p.tenue.couleur} />
      </g>
    </svg>
  )
}
