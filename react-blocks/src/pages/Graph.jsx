import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import donnéesPerso from '../data/graph-perso.json'
import donnéesPro from '../data/graph-pro.json'
import donnéesIdrissiPerso from '../data/graph-idrissi-perso.json'
import donnéesIdrissiPro from '../data/graph-idrissi-pro.json'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import PanneauSync from '../components/PanneauSync'
import { grotesk, serif, PALETTE, useTheme, useThemeMode } from '../lib/theme'
import { TexteFormaté } from '../lib/texteFormate'
import { FOYERS, espacesPourTousLesFoyers } from '../lib/foyers'
import { useDonnéesSynchronisées } from '../lib/synchro'

const DONNÉES = {
  perso: donnéesPerso,
  pro: donnéesPro,
  'idrissi-perso': donnéesIdrissiPerso,
  'idrissi-pro': donnéesIdrissiPro,
}

const ESPACES = espacesPourTousLesFoyers((foyer, type, id) => ({
  titre: `Graph ${type}`,
  eyebrow: `${foyer.nom} · Graphes ${type}`,
  chemin: `react-blocks/src/data/graph-${id}.json`,
  stockage: `react-blocs-graph-${id}`,
  données: DONNÉES[id],
}))

// Fichier : { graphes: [{ id, nom, noeuds: [{ id, texte, x, y, parentId, couleur? }] }] }
// x, y = centre de la bulle ; parentId relie la bulle à sa bulle parente
// (null pour une racine ou une bulle libre).
const ÉCART_X = 240
const ÉCART_Y = 92
const ZOOM_MIN = 0.25
const ZOOM_MAX = 2.5
const SEUIL_GLISSER = 6

function compléter(objet) {
  const graphes = Array.isArray(objet?.graphes) ? objet.graphes : []
  return { graphes: graphes.map(g => ({ ...g, noeuds: Array.isArray(g.noeuds) ? g.noeuds : [] })) }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function descendants(noeuds, id) {
  const résultat = new Set()
  const pile = [id]
  while (pile.length) {
    const courant = pile.pop()
    noeuds.forEach(n => {
      if (n.parentId === courant && !résultat.has(n.id)) { résultat.add(n.id); pile.push(n.id) }
    })
  }
  return résultat
}

// Range l'arbre de gauche à droite : profondeur → colonne, feuilles
// empilées, chaque parent centré sur ses enfants.
function ranger(noeuds) {
  const ids = new Set(noeuds.map(n => n.id))
  const enfants = new Map()
  noeuds.forEach(n => {
    if (n.parentId && ids.has(n.parentId)) {
      if (!enfants.has(n.parentId)) enfants.set(n.parentId, [])
      enfants.get(n.parentId).push(n)
    }
  })
  const positions = {}
  const vus = new Set()
  let ligne = 0
  const placer = (n, profondeur) => {
    if (vus.has(n.id)) return
    vus.add(n.id)
    const fils = (enfants.get(n.id) || []).filter(f => !vus.has(f.id))
    if (fils.length === 0) {
      positions[n.id] = { x: profondeur * ÉCART_X, y: ligne * ÉCART_Y }
      ligne += 1
      return
    }
    fils.forEach(f => placer(f, profondeur + 1))
    const ys = fils.map(f => positions[f.id].y)
    positions[n.id] = { x: profondeur * ÉCART_X, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
  }
  noeuds.filter(n => !n.parentId || !ids.has(n.parentId)).forEach(r => { placer(r, 0); ligne += 0.5 })
  return noeuds.map(n => (positions[n.id] ? { ...n, ...positions[n.id] } : n))
}

export default function Graph() {
  const { espace: espaceParam } = useParams()
  const config = ESPACES[espaceParam] || ESPACES.perso
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const { data, setData, token, statut, erreur, connecter, déconnecter } = useDonnéesSynchronisées(config, compléter)

  const cléActif = `react-blocs-graph-actif-${config.id}`
  const [grapheId, setGrapheId] = useState(() => localStorage.getItem(cléActif))
  const graphe = data.graphes.find(g => g.id === grapheId) || data.graphes[0] || null
  const noeuds = graphe?.noeuds || []

  const [vue, setVue] = useState({ x: 0, y: 0, zoom: 1 })
  const [sélection, setSélection] = useState(null)
  const [édition, setÉdition] = useState(null) // { id, texte }
  const [rattachement, setRattachement] = useState(false)
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [agrandi, setAgrandi] = useState(false)
  const [message, setMessage] = useState('')

  const zoneRef = useRef(null)
  const pointeursRef = useRef(new Map())
  const gesteRef = useRef(null)
  const vueRef = useRef(vue)
  vueRef.current = vue

  useEffect(() => {
    if (graphe) { try { localStorage.setItem(cléActif, graphe.id) } catch { /* ignore */ } }
  }, [graphe?.id, cléActif])

  // ---------- Vue (déplacement / zoom) ----------
  const taille = () => {
    const r = zoneRef.current?.getBoundingClientRect()
    return r ? { l: r.width, h: r.height, gauche: r.left, haut: r.top } : { l: 360, h: 500, gauche: 0, haut: 0 }
  }
  const centrer = (liste = noeuds) => {
    const { l, h } = taille()
    if (liste.length === 0) { setVue({ x: l / 2, y: h / 2, zoom: 1 }); return }
    const xs = liste.map(n => n.x)
    const ys = liste.map(n => n.y)
    const larg = Math.max(...xs) - Math.min(...xs) + 240
    const haut = Math.max(...ys) - Math.min(...ys) + 120
    const zoom = Math.min(1.1, Math.max(ZOOM_MIN, Math.min(l / larg, h / haut)))
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2
    setVue({ x: l / 2 - cx * zoom, y: h / 2 - cy * zoom, zoom })
  }
  useEffect(() => {
    const id = requestAnimationFrame(() => centrer())
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphe?.id, agrandi])

  const zoomerAutour = (facteur, px, py) => {
    setVue(v => {
      const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.zoom * facteur))
      const wx = (px - v.x) / v.zoom
      const wy = (py - v.y) / v.zoom
      return { zoom, x: px - wx * zoom, y: py - wy * zoom }
    })
  }
  // Cadre la vue sur une nouvelle bulle et son parent (une bulle créée à
  // droite de son parent sort souvent de l'écran d'un téléphone) : on ne
  // bouge que si l'un des deux est caché, en dézoomant si c'est trop large.
  const révéler = (...points) => {
    const { l, h } = taille()
    setVue(v => {
      const xs = points.map(p => p.x)
      const ys = points.map(p => p.y)
      const larg = Math.max(...xs) - Math.min(...xs)
      const haut = Math.max(...ys) - Math.min(...ys)
      let zoom = v.zoom
      if (larg * zoom > l - 180) zoom = Math.max(ZOOM_MIN, (l - 180) / larg)
      if (haut * zoom > h - 240) zoom = Math.max(ZOOM_MIN, (h - 240) / haut)
      const visible = p => {
        const sx = v.x + p.x * v.zoom
        const sy = v.y + p.y * v.zoom
        return sx > 90 && sx < l - 90 && sy > 70 && sy < h - 150
      }
      if (zoom === v.zoom && points.every(visible)) return v
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2
      const cy = (Math.max(...ys) + Math.min(...ys)) / 2
      return { zoom, x: l / 2 - cx * zoom, y: (h - 80) / 2 - cy * zoom }
    })
  }
  const zoomerCentre = facteur => { const { l, h } = taille(); zoomerAutour(facteur, l / 2, h / 2) }

  // ---------- Modifications ----------
  const majGraphe = fn => setData(d => ({ ...d, graphes: d.graphes.map(g => (g.id === graphe.id ? fn(g) : g)) }))
  const majNoeuds = fn => majGraphe(g => ({ ...g, noeuds: fn(g.noeuds) }))

  const créerGraphe = () => {
    const nom = window.prompt('Nom du nouveau graphe ?', 'Nouveau graphe')
    if (nom === null) return
    const racine = { id: uid(), texte: nom.trim() || 'Idée centrale', x: 0, y: 0, parentId: null }
    const nouveau = { id: uid(), nom: nom.trim() || 'Nouveau graphe', noeuds: [racine] }
    setData(d => ({ ...d, graphes: [...d.graphes, nouveau] }))
    setGrapheId(nouveau.id)
    setSélection(racine.id)
  }
  const renommerGraphe = () => {
    const nom = window.prompt('Nouveau nom du graphe ?', graphe.nom)
    if (nom && nom.trim()) majGraphe(g => ({ ...g, nom: nom.trim() }))
  }
  const supprimerGraphe = () => {
    if (!window.confirm(`Supprimer le graphe « ${graphe.nom} » et ses ${noeuds.length} bulle(s) ?`)) return
    setData(d => ({ ...d, graphes: d.graphes.filter(g => g.id !== graphe.id) }))
    setGrapheId(null)
    setSélection(null)
  }

  const ajouterEnfant = parentId => {
    const parent = noeuds.find(n => n.id === parentId)
    const frères = noeuds.filter(n => n.parentId === parentId).length
    const nouveau = { id: uid(), texte: 'Nouvelle idée', x: parent.x + ÉCART_X, y: parent.y + frères * ÉCART_Y, parentId }
    majNoeuds(liste => [...liste, nouveau])
    setSélection(nouveau.id)
    révéler(nouveau, parent)
    setÉdition({ id: nouveau.id, texte: '' })
  }
  const ajouterBulleLibre = () => {
    const { l, h } = taille()
    const nouveau = { id: uid(), texte: 'Nouvelle idée', x: (l / 2 - vue.x) / vue.zoom, y: (h / 2 - vue.y) / vue.zoom, parentId: null }
    majNoeuds(liste => [...liste, nouveau])
    setSélection(nouveau.id)
    setÉdition({ id: nouveau.id, texte: '' })
  }
  const supprimerNoeud = id => {
    const sous = descendants(noeuds, id)
    if (sous.size > 0 && !window.confirm(`Supprimer cette bulle et les ${sous.size} bulle(s) qui en dépendent ?`)) return
    majNoeuds(liste => liste.filter(n => n.id !== id && !sous.has(n.id)))
    setSélection(null)
  }
  const rattacher = (enfantId, parentId) => {
    if (enfantId === parentId) return
    if (descendants(noeuds, enfantId).has(parentId)) {
      setMessage('Impossible : cette bulle dépend déjà de celle que tu déplaces.')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    majNoeuds(liste => liste.map(n => (n.id === enfantId ? { ...n, parentId } : n)))
  }
  const détacher = id => majNoeuds(liste => liste.map(n => (n.id === id ? { ...n, parentId: null } : n)))
  const changerCouleur = (id, couleur) => majNoeuds(liste => liste.map(n => (n.id === id ? { ...n, couleur } : n)))
  const validerÉdition = () => {
    const texte = édition.texte.trim()
    majNoeuds(liste => liste.map(n => (n.id === édition.id ? { ...n, texte: texte || 'Nouvelle idée' } : n)))
    setÉdition(null)
  }
  const rangerTout = () => {
    const rangés = ranger(noeuds)
    majNoeuds(() => rangés)
    requestAnimationFrame(() => centrer(rangés))
  }

  // ---------- Gestes : une seule logique pour la souris et le doigt ----------
  const touche = id => {
    if (rattachement && sélection) {
      rattacher(sélection, id)
      setRattachement(false)
      return
    }
    if (sélection === id) {
      const n = noeuds.find(x => x.id === id)
      setÉdition({ id, texte: n.texte })
    } else {
      setSélection(id)
      setPaletteOuverte(false)
    }
  }

  const surAppui = e => {
    const zone = zoneRef.current
    zone.setPointerCapture?.(e.pointerId)
    pointeursRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = [...pointeursRef.current.values()]
    if (p.length === 2) {
      const milieu = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }
      gesteRef.current = { type: 'pincer', dist0: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), milieu0: milieu, vue0: vueRef.current }
      return
    }
    const bulle = e.target.closest('[data-noeud]')
    if (bulle) {
      const n = noeuds.find(x => x.id === bulle.dataset.noeud)
      gesteRef.current = { type: 'bulle', id: n.id, départ: { x: e.clientX, y: e.clientY }, pos0: { x: n.x, y: n.y }, déplacé: false }
    } else {
      gesteRef.current = { type: 'fond', départ: { x: e.clientX, y: e.clientY }, vue0: vueRef.current, déplacé: false }
    }
  }

  const surMouvement = e => {
    if (!pointeursRef.current.has(e.pointerId)) return
    pointeursRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesteRef.current
    if (!g) return
    if (g.type === 'pincer') {
      const p = [...pointeursRef.current.values()]
      if (p.length < 2) return
      const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
      const { gauche, haut } = taille()
      const milieu = { x: (p[0].x + p[1].x) / 2 - gauche, y: (p[0].y + p[1].y) / 2 - haut }
      const m0 = { x: g.milieu0.x - gauche, y: g.milieu0.y - haut }
      const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, g.vue0.zoom * (dist / g.dist0)))
      const wx = (m0.x - g.vue0.x) / g.vue0.zoom
      const wy = (m0.y - g.vue0.y) / g.vue0.zoom
      setVue({ zoom, x: milieu.x - wx * zoom, y: milieu.y - wy * zoom })
      return
    }
    const dx = e.clientX - g.départ.x
    const dy = e.clientY - g.départ.y
    if (!g.déplacé && Math.hypot(dx, dy) < SEUIL_GLISSER) return
    g.déplacé = true
    if (g.type === 'bulle') {
      const z = vueRef.current.zoom
      majNoeuds(liste => liste.map(n => (n.id === g.id ? { ...n, x: g.pos0.x + dx / z, y: g.pos0.y + dy / z } : n)))
    } else {
      setVue({ ...g.vue0, x: g.vue0.x + dx, y: g.vue0.y + dy })
    }
  }

  const surRelâche = e => {
    pointeursRef.current.delete(e.pointerId)
    const g = gesteRef.current
    if (!g) return
    if (g.type === 'pincer') {
      // On repart sur un simple déplacement avec le doigt restant.
      const reste = [...pointeursRef.current.values()][0]
      gesteRef.current = reste ? { type: 'fond', départ: reste, vue0: vueRef.current, déplacé: true } : null
      return
    }
    if (pointeursRef.current.size === 0) gesteRef.current = null
    if (g.déplacé) return
    if (g.type === 'bulle') touche(g.id)
    else { setSélection(null); setRattachement(false); setPaletteOuverte(false) }
  }

  const surMolette = e => {
    const { gauche, haut } = taille()
    zoomerAutour(Math.exp(-e.deltaY * 0.0015), e.clientX - gauche, e.clientY - haut)
  }

  // ---------- Rendu ----------
  const noeudSélectionné = noeuds.find(n => n.id === sélection)
  const ids = new Set(noeuds.map(n => n.id))
  const interditsRattachement = rattachement && sélection ? new Set([sélection, ...descendants(noeuds, sélection)]) : new Set()

  const boutonFlottant = {
    width: '40px', height: '40px', borderRadius: '12px', background: T.surface, color: T.text,
    border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '17px', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,.25)',
  }
  const action = (danger = false) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '54px', padding: '6px 4px',
    background: 'transparent', border: 'none', cursor: 'pointer', color: danger ? T.danger : T.text,
    fontFamily: grotesk, fontSize: '10.5px', fontWeight: 600,
  })

  const canevas = (
    <div style={{
      position: agrandi ? 'fixed' : 'relative', inset: agrandi ? 0 : undefined, zIndex: agrandi ? 1000 : undefined,
      flex: agrandi ? undefined : 1, minHeight: agrandi ? undefined : '420px',
      borderRadius: agrandi ? 0 : '14px', border: agrandi ? 'none' : `1px solid ${T.border}`, overflow: 'hidden', background: T.bg,
    }}>
      <div
        ref={zoneRef}
        onPointerDown={surAppui}
        onPointerMove={surMouvement}
        onPointerUp={surRelâche}
        onPointerCancel={surRelâche}
        onWheel={surMolette}
        style={{
          position: 'absolute', inset: 0, touchAction: 'none', cursor: gesteRef.current?.type === 'fond' ? 'grabbing' : 'grab',
          backgroundImage: `radial-gradient(${T.border} 1.2px, transparent 1.2px)`,
          backgroundSize: `${24 * vue.zoom}px ${24 * vue.zoom}px`,
          backgroundPosition: `${vue.x}px ${vue.y}px`,
          userSelect: 'none', WebkitUserSelect: 'none',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${vue.x}px, ${vue.y}px) scale(${vue.zoom})`, transformOrigin: '0 0' }}>
          <svg width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
            {noeuds.filter(n => n.parentId && ids.has(n.parentId)).map(n => {
              const p = noeuds.find(x => x.id === n.parentId)
              const mx = (p.x + n.x) / 2
              return (
                <path key={n.id} d={`M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${n.y}, ${n.x} ${n.y}`}
                  fill="none" stroke={n.couleur || p.couleur || T.textMuted} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              )
            })}
          </svg>
          {noeuds.map(n => {
            const racine = !n.parentId || !ids.has(n.parentId)
            const couleur = n.couleur || (racine ? T.accent : T.border)
            const choisi = sélection === n.id
            const cible = rattachement && !interditsRattachement.has(n.id)
            return (
              <div
                key={n.id}
                data-noeud={n.id}
                role="button"
                aria-label={`Bulle : ${n.texte}`}
                aria-pressed={choisi}
                style={{
                  position: 'absolute', left: n.x, top: n.y, transform: 'translate(-50%, -50%)',
                  minWidth: '64px', maxWidth: '210px', width: 'max-content', padding: racine ? '12px 16px' : '9px 14px',
                  borderRadius: '18px', textAlign: 'center', cursor: 'pointer', lineHeight: 1.35,
                  fontSize: racine ? '15px' : '13.5px', fontWeight: racine ? 700 : 500,
                  fontFamily: racine ? serif : 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: racine ? couleur : `linear-gradient(${couleur}22, ${couleur}22), ${T.surface}`,
                  color: racine ? '#1b1b1b' : T.text,
                  border: `2px ${cible ? 'dashed' : 'solid'} ${choisi ? T.text : couleur}`,
                  boxShadow: choisi ? `0 0 0 4px ${T.accent}55, 0 6px 18px rgba(0,0,0,.3)` : '0 3px 10px rgba(0,0,0,.18)',
                }}
              >
                <TexteFormaté texte={n.texte} couleurDéfaut={racine ? '#1b1b1b' : T.text} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Commandes de vue */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button onClick={() => zoomerCentre(1.25)} aria-label="Zoomer" style={boutonFlottant}>+</button>
        <button onClick={() => zoomerCentre(0.8)} aria-label="Dézoomer" style={boutonFlottant}>−</button>
        <button onClick={() => centrer()} aria-label="Centrer" title="Tout voir" style={{ ...boutonFlottant, fontSize: '15px' }}>⤢</button>
        <button onClick={() => setAgrandi(a => !a)} aria-label={agrandi ? 'Réduire' : 'Agrandir'} title={agrandi ? 'Réduire' : 'Plein écran'} style={{ ...boutonFlottant, fontSize: '15px' }}>{agrandi ? '✕' : '⛶'}</button>
      </div>
      {graphe && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
          <button onClick={ajouterBulleLibre} style={{ ...boutonFlottant, width: 'auto', padding: '0 12px', fontSize: '12.5px', fontFamily: grotesk }}>＋ Bulle</button>
          {noeuds.length > 1 && (
            <button onClick={rangerTout} style={{ ...boutonFlottant, width: 'auto', padding: '0 12px', fontSize: '12.5px', fontFamily: grotesk }}>Ranger</button>
          )}
        </div>
      )}

      {rattachement && (
        <div style={{ position: 'absolute', left: '10px', right: '10px', top: '60px', background: T.accent, color: T.accentText, borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ flex: 1 }}>Touche la bulle qui devient le parent</span>
          <button onClick={() => setRattachement(false)} style={{ background: 'rgba(0,0,0,.15)', color: 'inherit', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Annuler</button>
        </div>
      )}
      {message && (
        <div role="status" style={{ position: 'absolute', left: '10px', right: '10px', top: '60px', background: T.danger, color: '#fff', borderRadius: '12px', padding: '10px 12px', fontSize: '13px' }}>{message}</div>
      )}

      {/* Barre d'actions de la bulle sélectionnée */}
      {noeudSélectionné && !rattachement && (
        <div style={{ position: 'absolute', left: '8px', right: '8px', bottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          {paletteOuverte && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '10px', marginBottom: '6px' }}>
              {[null, ...PALETTE].map(c => (
                <button key={c || 'défaut'} onClick={() => changerCouleur(noeudSélectionné.id, c)} aria-label={c ? `Couleur ${c}` : 'Couleur par défaut'} style={{
                  width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', background: c || 'transparent',
                  border: c ? `3px solid ${noeudSélectionné.couleur === c ? T.text : 'transparent'}` : `2px dashed ${T.textMuted}`,
                }} />
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-around', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '6px 4px', boxShadow: '0 6px 20px rgba(0,0,0,.3)' }}>
            <button onClick={() => ajouterEnfant(noeudSélectionné.id)} style={action()}><span style={{ fontSize: '18px' }}>➕</span>Enfant</button>
            <button onClick={() => setÉdition({ id: noeudSélectionné.id, texte: noeudSélectionné.texte })} style={action()}><span style={{ fontSize: '18px' }}>✏️</span>Texte</button>
            <button onClick={() => setPaletteOuverte(o => !o)} style={action()}><span style={{ fontSize: '18px' }}>🎨</span>Couleur</button>
            {noeudSélectionné.parentId && ids.has(noeudSélectionné.parentId)
              ? <button onClick={() => détacher(noeudSélectionné.id)} style={action()}><span style={{ fontSize: '18px' }}>✂️</span>Détacher</button>
              : null}
            <button onClick={() => { setRattachement(true); setPaletteOuverte(false) }} style={action()}><span style={{ fontSize: '18px' }}>🔗</span>Rattacher</button>
            <button onClick={() => supprimerNoeud(noeudSélectionné.id)} style={action(true)}><span style={{ fontSize: '18px' }}>🗑️</span>Suppr.</button>
          </div>
        </div>
      )}

      {graphe && noeuds.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <p style={{ color: T.textMuted, fontSize: '13px' }}>Graphe vide — « ＋ Bulle » pour commencer.</p>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '24px 16px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <Link to={FOYERS[config.foyer].accueil} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.textMuted, fontSize: '13px', fontFamily: grotesk }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
          <div>
            <p style={{ fontFamily: grotesk, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent, margin: '0 0 4px', fontWeight: 600 }}>{config.eyebrow}</p>
            <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '30px', color: T.text, margin: 0, lineHeight: 1.1 }}>{config.titre}</h1>
          </div>
          <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '3px', flexShrink: 0 }}>
            {Object.values(ESPACES).filter(e => e.foyer === config.foyer).map(e => (
              <Link key={e.id} to={`/graph/${e.id}`} style={{
                fontSize: '11px', fontFamily: grotesk, fontWeight: 600, padding: '6px 10px', borderRadius: '6px',
                background: e.id === config.id ? T.accent : 'transparent', color: e.id === config.id ? T.accentText : T.textMuted,
              }}>{e.type === 'perso' ? 'Perso' : 'Pro'}</Link>
            ))}
          </div>
        </div>

        <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`graph-${config.id}.json`} marginBottom="12px" />

        {data.graphes.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '40px 10px' }}>
            <p style={{ fontSize: '40px', margin: 0 }}>🕸️</p>
            <p style={{ margin: 0, color: T.textMuted, fontSize: '14px', lineHeight: 1.6, maxWidth: '320px' }}>
              Crée un graphe : une bulle centrale, puis des bulles enfants que tu relies, déplaces et colores comme tu veux.
            </p>
            <button onClick={créerGraphe} style={{ background: T.accent, color: T.accentText, border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: grotesk }}>
              ＋ Créer mon premier graphe
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <select
                value={graphe?.id || ''}
                onChange={e => { setGrapheId(e.target.value); setSélection(null) }}
                aria-label="Graphe affiché"
                style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 600, color: T.text, background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '9px 10px', fontFamily: grotesk }}
              >
                {data.graphes.map(g => <option key={g.id} value={g.id}>{g.nom} ({g.noeuds.length})</option>)}
              </select>
              <BoutonIcone icon="crayon" title="Renommer le graphe" onClick={renommerGraphe} />
              <BoutonIcone icon="corbeille" title="Supprimer le graphe" couleur={T.danger} onClick={supprimerGraphe} />
              <BoutonIcone icon="plus" title="Nouveau graphe" onClick={créerGraphe} />
            </div>
            {canevas}
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: T.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
              Touche une bulle pour la choisir, retouche-la pour écrire. Glisse les bulles ou le fond ; pince pour zoomer.
            </p>
          </>
        )}
      </div>

      {édition && (
        <div role="dialog" aria-label="Texte de la bulle" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px', marginTop: 'max(10px, env(safe-area-inset-top))' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>Texte de la bulle</p>
            <textarea
              autoFocus
              value={édition.texte}
              onChange={e => setÉdition(é => ({ ...é, texte: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) validerÉdition() }}
              placeholder="Écris ton idée… (**gras** possible)"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={() => setÉdition(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: grotesk, fontWeight: 600 }}>Annuler</button>
              <button onClick={validerÉdition} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: T.accent, color: T.accentText, border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700 }}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
