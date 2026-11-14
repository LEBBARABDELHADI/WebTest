// La carte administrative de la page 21, sur une feuille claire : régions
// colorées, départements et leur numéro, ■ préfectures de région, • préfectures
// de département. Sur une région, la caméra part de la France entière et
// zoome sur elle (viewBox animée). Le cadrage tient compte de ce qui recouvre
// la scène : l'étiquette du haut (data-zone-haute) et la carte « texte
// officiel » du bas ; la région reste visible entre les deux.
// En Île-de-France, Paris et la petite couronne ont leur encadré agrandi,
// comme sur les cartes administratives.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CARTE_ADMIN } from '../../../lib/livret2026/cinema/carteAdmin'
import { TOUR_RÉGIONS } from '../../../lib/livret2026/cinema/etiquettesRegions'

const COULEUR = Object.fromEntries(TOUR_RÉGIONS.map(([c, , , coul]) => [c, coul]))
const FRANCE = [20, 20, 980, 980]
const PETITE_COURONNE = ['75', '92', '93', '94']
const ZOOM_PARIS = [459, 244, 509, 282] // cadre de l'encadré (unités de la carte)

// Position verticale d'un élément dans la scène, sans les transformations en cours.
function hauteurDans(el, fin) {
  let y = 0, n = el
  while (n && n !== fin) { y += n.offsetTop; n = n.offsetParent }
  return n === fin ? y : null
}

// viewBox qui place le cadre [x0, y0, x1, y1] au centre du rectangle libre
// (en px dans la zone de dessin l × h), avec une marge.
function cadrer([x0, y0, x1, y1], l, h, libre) {
  const marge = Math.max(x1 - x0, y1 - y0) * 0.07 + 6
  const bw = Math.max(110, x1 - x0 + 2 * marge), bh = Math.max(90, y1 - y0 + 2 * marge)
  const lx = libre.droite - libre.gauche, ly = libre.bas - libre.haut
  const s = Math.min(lx / bw, ly / bh)
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  return { vue: [cx - (libre.gauche + lx / 2) / s, cy - (libre.haut + ly / 2) / s, l / s, h / s], s }
}

export default function CarteAdmin({ focus = 'france', étape = 0 }) {
  const boîte = useRef(null), svg = useRef(null), vue = useRef(null), raf = useRef(0)
  const région = CARTE_ADMIN.régions.find(r => r.code === focus)
  const idf = focus === '11'
  const [cadrage, setCadrage] = useState({ s: 1, l: 0, encadré: null })
  const [redim, setRedim] = useState(0)

  useEffect(() => {
    const el = boîte.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => setRedim(n => n + 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = boîte.current, s = svg.current
    if (!el || !s) return undefined
    const l = el.offsetWidth, h = el.offsetHeight
    if (!l || !h) return undefined
    // Zone libre : sous l'étiquette du haut, au-dessus de la carte officielle.
    const scène = el.closest('.c-scene')
    const y0 = scène ? hauteurDans(el, scène) : null
    let haut = 6, bas = h - 6
    if (scène && y0 !== null) {
      const zh = scène.querySelector('[data-zone-haute]')
      const yh = zh && hauteurDans(zh, scène)
      if (yh !== null && yh !== undefined) haut = Math.max(haut, yh + zh.offsetHeight + 8 - y0)
      const o = scène.querySelector('.c-officiel')
      if (o) bas = Math.min(bas, o.offsetTop - 8 - y0)
    }
    if (bas - haut < 110) { haut = 6; bas = h - 6 } // trop peu de place : on accepte d'être recouvert
    let libre = { gauche: 6, droite: l - 6, haut, bas }
    // Île-de-France : l'encadré de Paris prend le coin droit (ou le bas si l'écran est étroit).
    let encadré = null
    if (idf) {
      const large = (libre.droite - libre.gauche) / (libre.bas - libre.haut) > 1.25
      const ew = Math.min(300, Math.max(120, (large ? 0.3 : 0.48) * l)), eh = ew * 0.76
      if (large) { encadré = { x: libre.droite - ew, y: libre.haut, l: ew, h: eh }; libre = { ...libre, droite: libre.droite - ew - 8 } }
      else { encadré = { x: libre.droite - ew, y: libre.bas - eh, l: ew, h: eh }; libre = { ...libre, bas: libre.bas - eh - 6 } }
    }
    const départ = cadrer(FRANCE, l, h, libre)
    const cible = région ? cadrer(région.cadre, l, h, libre) : départ
    setCadrage(c => (c.s === cible.s && c.l === l && JSON.stringify(c.encadré) === JSON.stringify(encadré) ? c : { s: cible.s, l, encadré }))
    const poser = b => { vue.current = b; s.setAttribute('viewBox', b.map(v => v.toFixed(1)).join(' ')) }
    cancelAnimationFrame(raf.current)
    const calme = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const de = vue.current || (région ? départ.vue : cible.vue)
    if (calme || de.every((v, i) => Math.abs(v - cible.vue[i]) < 0.5)) { poser(cible.vue); return undefined }
    const t0 = performance.now(), durée = vue.current ? 1000 : 1700
    const pas = t => {
      const k = Math.min(1, (t - t0) / durée), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      poser(de.map((v, i) => v + (cible.vue[i] - v) * e))
      if (k < 1) raf.current = requestAnimationFrame(pas)
    }
    poser(de)
    raf.current = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(raf.current)
  }, [focus, étape, redim]) // eslint-disable-line react-hooks/exhaustive-deps

  const k = cadrage.s || 1 // pixels par unité de carte (à l'arrivée du zoom)
  const px = n => n / k
  // Taille des numéros : selon la place que prend la région à l'écran.
  const largeurPx = région ? Math.max(région.cadre[2] - région.cadre[0], région.cadre[3] - région.cadre[1]) * k : 0
  const fsPx = Math.max(9, Math.min(cadrage.l < 520 ? 13 : 17, largeurPx / 19))
  const fsNum = px(fsPx)
  const dép = région ? CARTE_ADMIN.départements.filter(d => d.région === focus) : CARTE_ADMIN.départements
  const halo = { paintOrder: 'stroke', stroke: '#fff', strokeLinejoin: 'round' }
  // Préfecture au bord est de sa région (Strasbourg) : son nom passe en bas à gauche du carré.
  // Quand la région est petite à l'écran, l'étiquette du haut suffit (« ■ Lyon »).
  const àDroite = r => r.préfectureXy[0] > r.cadre[0] + (r.cadre[2] - r.cadre[0]) * 0.7
  const apparaît = délai => ({ opacity: 0, animation: `c-fondu-monte .8s ease-out ${délai}s forwards` })
  return (
    <div className="c-apparait" style={{ position: 'absolute', inset: 0, background: '#f8f5ec', overflow: 'hidden' }}>
      <div ref={boîte} style={{ position: 'absolute', inset: 0 }}>
        <svg ref={svg} preserveAspectRatio="xMinYMin meet" role="img" aria-label={région ? `Carte de la région ${région.nom}` : 'Carte administrative de la France'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <g strokeLinejoin="round">
            {CARTE_ADMIN.régions.map(r => <path key={r.code} d={r.d} fill={COULEUR[r.code]} opacity={région && r.code !== focus ? 0.32 : 1} stroke="#64748b" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
            {CARTE_ADMIN.départements.map(d => <path key={d.code} d={d.d} fill="none" stroke="#fff" strokeWidth={région && d.région === focus ? 1.6 : 0.8} opacity={région && d.région !== focus ? 0.5 : 1} vectorEffect="non-scaling-stroke" />)}
            {région && <path d={région.d} fill="none" stroke="#1e293b" strokeWidth={2.4} vectorEffect="non-scaling-stroke" />}
            {idf && cadrage.encadré && <rect x={ZOOM_PARIS[0]} y={ZOOM_PARIS[1]} width={ZOOM_PARIS[2] - ZOOM_PARIS[0]} height={ZOOM_PARIS[3] - ZOOM_PARIS[1]} fill="none" stroke="#7f1d1d" strokeWidth={1.4} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" style={apparaît(1.6)} />}
          </g>
          {dép.filter(d => !(idf && PETITE_COURONNE.includes(d.code))).map(d => <circle key={`p${d.code}`} cx={d.préfectureXy[0]} cy={d.préfectureXy[1]} r={px(région ? 3 : 1.8)} fill="#1f2937" />)}
          {région && dép.filter(d => !(idf && PETITE_COURONNE.includes(d.code))).map(d => <text key={`n${d.code}`} x={d.xy[0]} y={d.xy[1]} textAnchor="middle" dominantBaseline="central" fontFamily="system-ui" fontWeight="900" fontSize={fsNum} fill="#1f2937" strokeWidth={fsNum * 0.24} style={{ ...halo, ...apparaît(1.5) }}>{d.code}</text>)}
          {CARTE_ADMIN.régions.filter(r => !région || r.code === focus).map(r => (
            <g key={`r${r.code}`}>
              <rect x={r.préfectureXy[0] - px(région ? 5.5 : 3.5)} y={r.préfectureXy[1] - px(région ? 5.5 : 3.5)} width={px(région ? 11 : 7)} height={px(région ? 11 : 7)} fill="#7f1d1d" stroke="#fff" strokeWidth={px(1.2)} />
              {région && !idf && fsPx >= 11 && <text x={r.préfectureXy[0] + px(àDroite(r) ? -7 : 9)} y={r.préfectureXy[1] + px(àDroite(r) ? fsPx + 4 : -9)} textAnchor={àDroite(r) ? 'end' : 'start'} fontFamily="system-ui" fontWeight="900" fontSize={fsNum * 0.95} fill="#7f1d1d" strokeWidth={fsNum * 0.24} style={{ ...halo, ...apparaît(1.7) }}>{r.préfecture}</text>}
            </g>
          ))}
        </svg>
        {idf && cadrage.encadré && <EncadréParis {...cadrage.encadré} />}
      </div>
    </div>
  )
}

// Encadré agrandi : Paris (75) et la petite couronne (92, 93, 94).
function EncadréParis({ x, y, l, h }) {
  const [x0, y0, x1, y1] = ZOOM_PARIS
  const k = Math.min(l / (x1 - x0), (h - 18) / (y1 - y0))
  const px = n => n / k
  const dép = CARTE_ADMIN.départements.filter(d => d.région === '11')
  const paris = CARTE_ADMIN.régions.find(r => r.code === '11')
  const halo = { paintOrder: 'stroke', stroke: '#fff', strokeWidth: px(3), strokeLinejoin: 'round' }
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: l, height: h, background: '#fffdf7', border: '2px solid #7f1d1d', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,.25)', overflow: 'hidden', opacity: 0, animation: 'c-fondu-monte .8s ease-out 1.8s forwards' }}>
      <div style={{ fontFamily: 'system-ui', fontWeight: 800, fontSize: 10.5, color: '#7f1d1d', padding: '2px 6px', lineHeight: '14px' }}>Paris et la petite couronne</div>
      <svg viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 18, bottom: 0, width: '100%', height: 'calc(100% - 18px)' }}>
        {dép.map(d => <path key={d.code} d={d.d} fill={PETITE_COURONNE.includes(d.code) ? '#f8fafc' : '#e2e8f0'} stroke="#64748b" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}
        {dép.filter(d => PETITE_COURONNE.includes(d.code) && d.code !== '75').map(d => <circle key={`p${d.code}`} cx={d.préfectureXy[0]} cy={d.préfectureXy[1]} r={px(3)} fill="#1f2937" />)}
        {dép.filter(d => PETITE_COURONNE.includes(d.code)).map(d => <text key={`n${d.code}`} x={d.xy[0]} y={d.xy[1] + (d.code === '75' ? px(11) : 0)} textAnchor="middle" dominantBaseline="central" fontFamily="system-ui" fontWeight="900" fontSize={px(13)} fill="#1f2937" style={halo}>{d.code}</text>)}
        <rect x={paris.préfectureXy[0] - px(5)} y={paris.préfectureXy[1] - px(5)} width={px(10)} height={px(10)} fill="#7f1d1d" stroke="#fff" strokeWidth={px(1.2)} />
        <text x={paris.préfectureXy[0] - px(7)} y={paris.préfectureXy[1] - px(7)} textAnchor="end" fontFamily="system-ui" fontWeight="900" fontSize={px(12)} fill="#7f1d1d" style={halo}>Paris</text>
      </svg>
    </div>
  )
}
