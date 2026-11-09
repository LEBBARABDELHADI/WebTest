// Carte animée de l'« Immersion » : pays (frontières actuelles), villes et
// repères cités par le livret, fleuves, montagnes, mers, flèches. La caméra
// glisse d'un plan à l'autre (viewBox animée) ; les noms gardent la même taille
// à l'écran (variable --u : unités de carte par pixel) et s'écartent pour ne
// pas se chevaucher.
import { memo, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CARTES } from '../../../lib/livret2026/immersion/cartes'
import { LIEUX, FLEUVES, MASSIFS, MERS } from '../../../lib/livret2026/immersion/lieux'
import { OR } from '../../../lib/livret2026/immersion/immersionCss'

const ZOOM_MAX = { france: 1.7, europe: 2.5, monde: 3 }
const ICÔNE = { port: '⚓ ', bataille: '⚔️ ', sommet: '▲ ', repère: '◆ ' }
const SANS_POINT = new Set(['région', 'pays', 'empire', 'continent'])
const COULEUR_TYPE = { région: '#fde68a', pays: '#bfdbfe', empire: '#fca5a5', continent: '#e2e8f0', 'outre-mer': '#6ee7b7', port: '#7dd3fc', sommet: '#bef264' }

function useTaille(ref) {
  const [t, setT] = useState({ l: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const mesurer = () => setT(a => (a.l === el.clientWidth && a.h === el.clientHeight ? a : { l: el.clientWidth, h: el.clientHeight }))
    mesurer()
    const o = new ResizeObserver(mesurer)
    o.observe(el)
    return () => o.disconnect()
  }, [ref])
  return t
}

// Cadre à montrer : la carte entière, ou les points à suivre (avec une marge),
// au format du conteneur ; « remplir » recadre (plein écran) au lieu d'ajouter des bords.
function cadrer(V, points, lPx, hPx, remplir, zmax) {
  const ar = lPx && hPx ? lPx / hPx : V.l / V.h
  let x0 = 0, y0 = 0, x1 = V.l, y1 = V.h
  if (points.length) {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1])
    const mx = Math.max(V.l * 0.1, (Math.max(...xs) - Math.min(...xs)) * 0.3), my = Math.max(V.h * 0.1, (Math.max(...ys) - Math.min(...ys)) * 0.3)
    x0 = Math.min(...xs) - mx; x1 = Math.max(...xs) + mx; y0 = Math.min(...ys) - my; y1 = Math.max(...ys) + my
    const minL = V.l / zmax, minH = V.h / zmax
    if (x1 - x0 < minL) { const c = (x0 + x1) / 2; x0 = c - minL / 2; x1 = c + minL / 2 }
    if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2 }
  }
  let w = x1 - x0, h = y1 - y0
  const couvrir = remplir && !points.length // plein cadre, sauf s'il faut voir des lieux précis
  if (couvrir ? w / h > ar : w / h < ar) w = h * ar; else h = w / ar
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  let x = cx - w / 2, y = cy - h / 2
  x = w <= V.l ? Math.max(0, Math.min(V.l - w, x)) : (V.l - w) / 2
  y = h <= V.h ? Math.max(0, Math.min(V.h - h, y)) : (V.h - h) / 2
  return { x, y, w, h }
}

// Place les noms : à droite, à gauche, au-dessus… la première place libre.
function placerNoms(items, obstacles, lPx, hPx) {
  const pris = [...obstacles]
  const recouvre = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]))
  return items.map(it => {
    const { sx, sy, fs, texte, centré } = it
    const w = texte.length * fs * 0.64 + 6, h = fs * 1.25
    const essais = centré
      ? [[0, fs * 0.35, 'middle'], [0, -fs * 0.9, 'middle'], [0, fs * 1.5, 'middle']]
      : [[9, fs * 0.36, 'start'], [-9, fs * 0.36, 'end'], [0, -9, 'middle'], [0, fs + 7, 'middle'], [7, -7, 'start'], [-7, -7, 'end'], [7, fs + 4, 'start'], [-7, fs + 4, 'end']]
    let meilleur = null
    for (const [dx, dy, a] of essais) {
      const x = sx + dx - (a === 'start' ? 3 : a === 'end' ? w - 3 : w / 2)
      const r = [x, sy + dy - fs * 0.95, w, h]
      let gêne = pris.reduce((s, o) => s + recouvre(r, o), 0)
      if (r[0] < 2 || r[1] < 2 || r[0] + r[2] > lPx - 2 || r[1] + r[3] > hPx - 2) gêne += w * h * 0.6
      if (!meilleur || gêne < meilleur.gêne) meilleur = { dx, dy, a, r, gêne }
      if (gêne === 0) break
    }
    pris.push(meilleur.r)
    return { ...it, dx: meilleur.dx, dy: meilleur.dy, ancre: meilleur.a }
  })
}

const Terres = memo(function Terres({ vue, pays, couleur }) {
  const V = CARTES[vue]
  const choisis = new Set(pays.split('|'))
  return (
    <g style={{ strokeWidth: 'calc(var(--u) * 0.9px)' }} strokeLinejoin="round">
      {V.terres.map(([nom, d]) => {
        const en = choisis.has(nom)
        const fr = nom === 'France' && en
        return <path key={nom} d={d} fill={fr ? couleur : en ? '#5b6b8c' : '#1d2433'} fillOpacity={fr ? 0.42 : en ? 0.75 : 1} stroke={fr ? couleur : en ? '#a5b4cf' : '#3b4558'} />
      })}
    </g>
  )
})

export default function Carte({
  vue = 'france', pays = ['France'], lieux = [], actifs = [], flèches = [], fleuves = [], trace = null, couches = [], massif = null,
  couleur = OR, focus = null, remplir = false, légende = true, onLieu, onFleuve, sélection = null, style, étiquette = '', marges = null,
}) {
  const V = CARTES[vue] || CARTES.france
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const fondu = vue !== 'monde' // bords de la carte estompés (pas de coupure nette)
  const zone = useRef(null)
  const svg = useRef(null)
  const caméraActuelle = useRef(null)
  const { l: lPx, h: hPx } = useTaille(zone)
  const tracé = trace ? CARTES.france.fleuves?.[trace] : null
  // Partie visible (une fiche peut couvrir la droite ou le bas de la carte).
  const lVis = Math.max(120, lPx - (marges?.droite || 0)), hVis = Math.max(120, hPx - (marges?.bas || 0))

  // Points suivis par la caméra.
  const àSuivre = focus ?? actifs
  const cléFocus = `${vue}|${àSuivre.join(',')}|${trace || ''}`
  const cible = useMemo(() => {
    const pts = àSuivre.map(id => V.lieux[id]).filter(Boolean)
    if (tracé) pts.push(tracé.source, tracé.embouchure, tracé.étiquette)
    const b = cadrer(V, pts, lPx ? lVis : 0, hPx ? hVis : 0, remplir, ZOOM_MAX[vue] || 2)
    if (!lPx || !hPx) return b
    const k = b.w / lVis
    return { x: b.x, y: b.y, w: lPx * k, h: hPx * k }
  }, [cléFocus, lPx, hPx, lVis, hVis, remplir]) // eslint-disable-line react-hooks/exhaustive-deps
  const u = lPx ? cible.w / lPx : V.l / 600

  useLayoutEffect(() => {
    const el = svg.current
    if (!el || !lPx || !hPx) return undefined
    const poser = b => { el.setAttribute('viewBox', `${b.x} ${b.y} ${b.w} ${b.h}`); el.style.setProperty('--u', String(b.w / lPx)); caméraActuelle.current = b }
    const calme = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const a = caméraActuelle.current
    const départ = a && Math.abs(a.w / a.h - cible.w / cible.h) < 0.01 ? a : { x: cible.x - cible.w * 0.06, y: cible.y - cible.h * 0.06, w: cible.w * 1.12, h: cible.h * 1.12 }
    if (calme) { poser(cible); return undefined }
    const t0 = performance.now(), durée = a ? 1400 : 2200
    let raf = 0
    const pas = t => {
      const k = Math.min(1, (t - t0) / durée), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      poser({ x: départ.x + (cible.x - départ.x) * e, y: départ.y + (cible.y - départ.y) * e, w: départ.w + (cible.w - départ.w) * e, h: départ.h + (cible.h - départ.h) * e })
      if (k < 1) raf = requestAnimationFrame(pas)
    }
    poser(départ)
    raf = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(raf)
  }, [cible, lPx, hPx])

  // Positions à l'écran (pour écarter les noms), dans le cadre final.
  const écran = p => [(p[0] - cible.x) / u, (p[1] - cible.y) / u]
  const actif = new Set(actifs)
  const montrés = [...new Set([...lieux, ...actifs])].filter(id => V.lieux[id] && LIEUX[id])
  const obstacles = montrés.filter(id => !SANS_POINT.has(LIEUX[id].type)).map(id => { const [sx, sy] = écran(V.lieux[id]); return [sx - 6, sy - 6, 12, 12] })
  const zones = []
  if (vue === 'france' && couches.includes('mers')) MERS.forEach(m => zones.push({ id: m.id, p: V.mers[m.id], texte: m.nom, fs: 12, sorte: 'mer' }))
  if (vue === 'france' && couches.includes('massifs')) MASSIFS.forEach(m => zones.push({ id: m.id, p: V.massifs[m.id], texte: `▲ ${m.nom.replace(/^(Les |Le |La )/, '')}`, fs: m.id === massif || (massif === 'autres' && !['alpes', 'pyrenees'].includes(m.id)) ? 14 : 12, sorte: 'massif' }))
  if (vue === 'france' && couches.includes('voisins')) Object.entries(V.voisins || {}).forEach(([nom, p]) => zones.push({ id: nom, p, texte: nom.toUpperCase(), fs: 11.5, sorte: 'voisin' }))
  const fleuvesMontrés = vue === 'france' ? FLEUVES.filter(f => fleuves.includes(f.id) || f.id === trace) : []
  fleuvesMontrés.forEach(f => zones.push({ id: `f-${f.id}`, p: V.fleuves[f.id].étiquette, texte: f.nom.replace(/^(Le |La |L’)/, ''), fs: 12.5, sorte: 'fleuve', couleur: f.couleur }))
  const zonesPlacées = placerNoms(zones.filter(z => z.p).map(z => { const [sx, sy] = écran(z.p); return { ...z, sx, sy, centré: true } }), obstacles, lPx ? lVis : 600, hPx ? hVis : 600)
  const noms = placerNoms(
    montrés.map(id => {
      const L = LIEUX[id], [sx, sy] = écran(V.lieux[id])
      const sans = SANS_POINT.has(L.type)
      const texte = `${ICÔNE[L.type] || ''}${sans && L.type !== 'région' ? L.nom.toUpperCase() : L.nom}`
      return { id, sx, sy, texte, fs: actif.has(id) ? 15 : sans ? 11 : 13, centré: sans, type: L.type }
    }).sort((a, b) => Number(actif.has(b.id)) - Number(actif.has(a.id))),
    [...obstacles, ...zonesPlacées.map(z => { const w = z.texte.length * z.fs * 0.64 + 6; return [z.sx + z.dx - w / 2, z.sy + z.dy - z.fs * 0.95, w, z.fs * 1.25] })],
    lPx ? lVis : 600, hPx ? hVis : 600,
  )
  const pos = id => V.lieux[id]
  const résumé = [vue === 'monde' ? 'le monde' : vue === 'europe' ? 'l’Europe' : 'la France', ...montrés.map(id => LIEUX[id].nom), ...fleuvesMontrés.map(f => f.nom)].join(', ')
  const halo = { paintOrder: 'stroke', stroke: '#05070d', strokeWidth: 3.6, strokeLinejoin: 'round' }

  return (
    <div ref={zone} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: vue === 'monde' ? '#05070d' : 'radial-gradient(ellipse at 40% 40%, #11223a, #0a1322 75%)', ...style }}>
      <svg ref={svg} viewBox={`${cible.x} ${cible.y} ${cible.w} ${cible.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Carte : ${résumé}${étiquette ? ` — ${étiquette}` : ''}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', '--u': u }}>
        <defs>
          <marker id={`${id}-pointe`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={OR} /></marker>
          {fondu && [['h', 1, 0], ['v', 0, 1]].map(([s, x2, y2]) => (
            <g key={s}>
              <linearGradient id={`${id}-g${s}`} x1="0" y1="0" x2={x2} y2={y2}><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".08" stopColor="#fff" /><stop offset=".92" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
              <mask id={`${id}-m${s}`} maskUnits="userSpaceOnUse" x={-V.l} y={-V.h} width={V.l * 3} height={V.h * 3}><rect width={V.l} height={V.h} fill={`url(#${id}-g${s})`} /></mask>
            </g>
          ))}
        </defs>
        {V.sphère && <path d={V.sphère} fill="#0e1d33" stroke="#22324a" style={{ strokeWidth: 'calc(var(--u) * 1px)' }} />}
        <g mask={fondu ? `url(#${id}-mh)` : undefined}><g mask={fondu ? `url(#${id}-mv)` : undefined}>
        <Terres vue={vue} pays={pays.join('|')} couleur={couleur} />
        {vue === 'france' && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {FLEUVES.map(f => {
              const d = V.fleuves[f.id].d, montré = fleuvesMontrés.includes(f), choisi = sélection === f.id
              return (
                <g key={f.id} onClick={onFleuve ? () => onFleuve(f.id) : undefined} style={{ cursor: onFleuve ? 'pointer' : undefined }}>
                  {onFleuve && <path d={d} stroke="transparent" style={{ strokeWidth: 'calc(var(--u) * 18px)' }} />}
                  <path d={d} stroke={f.couleur} opacity={montré || choisi ? 1 : 0.4} style={{ strokeWidth: `calc(var(--u) * ${choisi ? 5 : montré ? 3.4 : 1.6}px)` }} />
                </g>
              )
            })}
            {tracé && <path key={`t-${trace}`} d={tracé.d} pathLength="1" className="im-trace" stroke="#fff" style={{ strokeWidth: 'calc(var(--u) * 2px)' }} opacity=".9" />}
          </g>
        )}
        </g></g>
        {tracé && [['source', tracé.source], ['embouchure', tracé.embouchure]].map(([n, p]) => (
          <g key={n} className="im-apparait" style={{ transform: `translate(${p[0]}px, ${p[1]}px) scale(var(--u))` }}>
            {n === 'source' ? <circle r="4.5" fill="#0a1322" stroke="#fff" strokeWidth="2" /> : <path d="M-6,-5 L6,-5 L0,6 Z" fill="#fff" />}
            <text x="0" y={n === 'source' ? -9 : 19} textAnchor="middle" fontSize="11" fontWeight="700" fill="#e2e8f0" style={halo}>{n}</text>
          </g>
        ))}
        {flèches.map(([a, b], i) => {
          const A = pos(a), B = pos(b)
          if (!A || !B) return null
          const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1]
          return <path key={`${a}-${b}-${i}`} d={`M${A[0]},${A[1]} Q${mx - dy * 0.25},${my + dx * 0.25} ${B[0]},${B[1]}`} pathLength="1" className="im-trace-court" fill="none" stroke={OR} strokeLinecap="round" markerEnd={`url(#${id}-pointe)`} style={{ strokeWidth: 'calc(var(--u) * 3.2px)' }} />
        })}
        {zonesPlacées.map(z => {
          const p = z.p, fort = z.sorte === 'massif' && z.fs > 12
          const c = z.sorte === 'mer' ? '#7dd3fc' : z.sorte === 'massif' ? (fort ? OR : '#bef264') : z.sorte === 'fleuve' ? z.couleur : '#e2e8f0'
          return (
            <g key={z.id} className="im-apparait" style={{ transform: `translate(${p[0]}px, ${p[1]}px) scale(var(--u))` }}>
              <text x={z.dx} y={z.dy} textAnchor="middle" fontSize={z.fs} fontWeight={z.sorte === 'voisin' ? 700 : 800} fontStyle={z.sorte === 'mer' || z.sorte === 'fleuve' ? 'italic' : 'normal'} letterSpacing={z.sorte === 'voisin' ? 1.2 : 0} fill={c} style={halo}>{z.texte}</text>
            </g>
          )
        })}
        {noms.map(n => {
          const p = pos(n.id), L = LIEUX[n.id], fort = actif.has(n.id), sans = SANS_POINT.has(L.type)
          const c = fort ? OR : COULEUR_TYPE[L.type] || '#f8fafc'
          return (
            <g key={n.id} className="im-apparait" onClick={onLieu ? () => onLieu(n.id) : undefined} style={{ transform: `translate(${p[0]}px, ${p[1]}px) scale(var(--u))`, cursor: onLieu ? 'pointer' : undefined }}>
              {fort && !sans && <circle r="7" fill="none" stroke={OR} strokeWidth="2.4" className="im-pouls" />}
              {!sans && <circle r={L.type === 'capitale' ? 5.5 : fort ? 5 : 3.8} fill={L.type === 'capitale' ? OR : fort ? OR : '#f8fafc'} stroke="#05070d" strokeWidth="1.6" />}
              {L.type === 'capitale' && <circle r="9" fill="none" stroke={OR} strokeWidth="1.4" opacity=".8" />}
              <text x={n.dx} y={n.dy} textAnchor={n.ancre} fontSize={n.fs} fontWeight={fort ? 900 : 700} fontStyle={L.type === 'région' ? 'italic' : 'normal'} letterSpacing={sans && L.type !== 'région' ? 1.1 : 0} fill={c} style={halo}>{n.texte}</text>
            </g>
          )
        })}
      </svg>
      {légende && <div style={{ position: 'absolute', left: 8, top: 6, fontSize: 10.5, color: 'rgba(226,232,240,.62)', pointerEvents: 'none', textShadow: '0 1px 2px #000' }}>Frontières actuelles, pour se repérer</div>}
    </div>
  )
}
