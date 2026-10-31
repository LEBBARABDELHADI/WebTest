import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { grotesk } from '../lib/theme'
import { FOYERS, espacesPourTousLesFoyers } from '../lib/foyers'
import { useDonnéesSynchronisées } from '../lib/synchro'
import { normaliser } from '../lib/motsCles'
import { useUrlImage, envoyerImage } from '../components/ImageCarte'
import PanneauSync from '../components/PanneauSync'
import { MODÈLES_TABLEAU, instancierÉléments } from '../lib/modelesTableau'

// « Graphe amélioré » : un tableau blanc façon Miro. Canevas infini à grille
// (glisser le fond pour se déplacer, pincer / Ctrl + molette pour zoomer),
// pense-bêtes, textes, formes, lignes et flèches (reliées aux éléments),
// stylo, cadres, commentaires, images. Sélection, poignées de taille,
// barre contextuelle, « + » pour enchaîner un pense-bête relié, annuler /
// rétablir, plusieurs tableaux, recherche. Enregistré comme les autres
// outils (fichier tableau-{espace}.json du dépôt privé).

const ESPACES = espacesPourTousLesFoyers((foyer, type, id) => ({
  titre: `Graphe amélioré ${type}`,
  foyer: foyer.id,
  chemin: `react-blocks/src/data/tableau-${id}.json`,
  stockage: `react-blocs-tableau-${id}`,
  données: { tableaux: [] },
}))
const compléter = d => ({
  ...d,
  tableaux: Array.isArray(d?.tableaux) && d.tableaux.length
    ? d.tableaux.map(t => ({ ...t, éléments: Array.isArray(t.éléments) ? t.éléments : [] }))
    : [{ id: 'principal', nom: 'Sans titre', éléments: [] }],
})

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const NOTES = ['#fff59d', '#ffcc80', '#f8bbd0', '#b3e5fc', '#c8e6c9', '#e1bee7', '#ffffff', '#cfd8dc']
const TRAITS = ['#1b1b1b', '#e2574c', '#f0a839', '#2e9e6b', '#3b6fd8', '#8b5cf6', '#9aa0a6', '#ffffff']
const FORMES = [['rect', '▭', 'Rectangle'], ['rond', '◯', 'Ellipse'], ['losange', '◇', 'Losange'], ['triangle', '△', 'Triangle'], ['bulle', '💬', 'Bulle']]
const UI = { fond: '#f2f2f0', grille: '#e3e3e0', barre: '#ffffff', texte: '#1b1b1b', doux: '#6b6b6b', bord: '#e2e2e2', accent: '#3b5bdb' }
const TAILLES = { note: [200, 200], texte: [240, 60], forme: [170, 120], cadre: [640, 420], commentaire: [34, 34] }

// ---------- Géométrie ----------
function boîte(el) {
  if (el.type === 'ligne') return { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), l: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) }
  if (el.type === 'trait') {
    const xs = el.points.map(p => p[0]); const ys = el.points.map(p => p[1])
    return { x: Math.min(...xs), y: Math.min(...ys), l: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
  }
  return { x: el.x, y: el.y, l: el.l, h: el.h }
}
const centre = el => { const b = boîte(el); return { x: b.x + b.l / 2, y: b.y + b.h / 2 } }
// Point du bord d'un élément dans la direction de `vers`.
function bord(el, vers) {
  const c = centre(el); const b = boîte(el)
  const dx = vers.x - c.x, dy = vers.y - c.y
  if (!dx && !dy) return c
  const k = Math.min(dx ? (b.l / 2 + 4) / Math.abs(dx) : Infinity, dy ? (b.h / 2 + 4) / Math.abs(dy) : Infinity)
  return { x: c.x + dx * k, y: c.y + dy * k }
}
// Extrémités réelles d'une ligne (suivent les éléments auxquels elle est reliée).
function bouts(l, parId) {
  const de = l.de && parId.get(l.de), vers = l.vers && parId.get(l.vers)
  const p1 = { x: l.x1, y: l.y1 }, p2 = { x: l.x2, y: l.y2 }
  const a = de ? bord(de, vers ? centre(vers) : p2) : p1
  const b = vers ? bord(vers, de ? centre(de) : p1) : p2
  return { a, b }
}
function taillePolice(el) {
  if (typeof el.taille === 'number') return el.taille
  const n = Math.max(1, (el.texte || '').length)
  const motLePlusLong = Math.max(1, ...(el.texte || '').split(/\s+/).map(m => m.length))
  const base = el.type === 'texte' ? 22 : Math.sqrt((el.l * el.h * 0.4) / n)
  const largeurMot = (el.l * 0.8) / (motLePlusLong * 0.62) // un mot ne doit pas être coupé
  return Math.max(10, Math.min(el.type === 'texte' ? 40 : 46, base, el.type === 'texte' ? Infinity : largeurMot))
}
const avecTexte = el => ['note', 'texte', 'forme', 'cadre', 'commentaire'].includes(el.type)

function cheminForme(forme) {
  if (forme === 'rond') return 'M50 1 A49 49 0 1 1 49.9 1 Z'
  if (forme === 'losange') return 'M50 1 L99 50 L50 99 L1 50 Z'
  if (forme === 'triangle') return 'M50 2 L98 98 L2 98 Z'
  if (forme === 'bulle') return 'M8 2 H92 Q98 2 98 8 V68 Q98 74 92 74 H40 L22 96 L26 74 H8 Q2 74 2 68 V8 Q2 2 8 2 Z'
  return 'M6 1 H94 Q99 1 99 6 V94 Q99 99 94 99 H6 Q1 99 1 94 V6 Q1 1 6 1 Z'
}

function ImageÉlément({ image }) {
  const { url, échec } = useUrlImage(image)
  if (échec) return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', color: '#888', fontSize: '13px' }}>Image indisponible</div>
  return url ? <img src={url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '4px', pointerEvents: 'none' }} /> : <div style={{ width: '100%', height: '100%', background: '#e9e9e9' }} />
}

// ---------- Icônes simples ----------
const I = {
  sélection: 'M5 3l14 8-6 2-2 6Z', main: 'M8 13V5a1.5 1.5 0 0 1 3 0v6 M11 11V4a1.5 1.5 0 0 1 3 0v7 M14 11V5.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.5 1.5 0 0 1 2.6-1.5L8 14',
  note: 'M4 4h16v10l-6 6H4Z M14 20v-6h6', texte: 'M5 5h14 M12 5v14 M9 19h6', forme: 'M4 4h7v7H4Z M17.5 7.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0 M4 20l3.5-6 3.5 6Z M14 14l6 6 M20 14v6h-6',
  ligne: 'M5 19 19 5 M13 5h6v6', stylo: 'M4 20c2-6 6-14 9-15s1 7-2 9 6-2 8 0', cadre: 'M7 3v18 M17 3v18 M3 7h18 M3 17h18', commentaire: 'M4 5h16v11H9l-5 4Z',
  image: 'M4 5h16v14H4Z M4 16l5-5 4 4 3-3 4 4', plus: 'M12 5v14 M5 12h14', annuler: 'M9 14 4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11', rétablir: 'M15 14l5-5-5-5 M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  maison: 'M4 10l8-6 8 6v10h-5v-6H9v6H4Z', loupe: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 20l-4-4', points: 'M12 5h.01 M12 12h.01 M12 19h.01', corbeille: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  dupliquer: 'M9 9h11v11H9Z M5 15H4V4h11v1', ajuster: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
  modèles: 'M4 4h7v7H4Z M13 4h7v7h-7Z M4 13h7v7H4Z M13 13h7v7h-7Z',
}

// Petit aperçu d'un modèle : ses blocs et ses liens, à l'échelle.
function AperçuModèle({ éléments }) {
  const parId = new Map(éléments.map(e => [e.id, e]))
  const placés = éléments.filter(e => !(e.type === 'ligne' && (e.de || e.vers)))
  const bs = placés.map(boîte)
  if (!bs.length) return <div style={{ height: 96 }} />
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y))
  const l = Math.max(1, Math.max(...bs.map(b => b.x + b.l)) - x0), h = Math.max(1, Math.max(...bs.map(b => b.y + b.h)) - y0)
  return (
    <svg viewBox={`${x0 - 20} ${y0 - 20} ${l + 40} ${h + 40}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 96, display: 'block', background: '#f6f6f4', borderRadius: 10 }} aria-hidden="true">
      {éléments.filter(e => e.type === 'cadre').map(e => <rect key={e.id} x={e.x} y={e.y} width={e.l} height={e.h} rx={8} fill={e.couleur || '#fff'} stroke="#bbb" strokeWidth={Math.max(2, l / 200)} />)}
      {éléments.filter(e => e.type === 'ligne').map(e => { const { a, b } = bouts(e, parId); return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#555" strokeWidth={Math.max(2, l / 180)} /> })}
      {éléments.filter(e => ['note', 'forme', 'texte'].includes(e.type)).map(e => (
        e.type === 'forme'
          ? <svg key={e.id} x={e.x} y={e.y} width={e.l} height={e.h} viewBox="0 0 100 100" preserveAspectRatio="none"><path d={cheminForme(e.forme)} fill={e.couleur} stroke="#333" strokeWidth={3} /></svg>
          : e.type === 'texte' ? <rect key={e.id} x={e.x} y={e.y + e.h * 0.3} width={Math.min(e.l, 260)} height={e.h * 0.35} rx={4} fill="#9a9a9a" />
            : <rect key={e.id} x={e.x} y={e.y} width={e.l} height={e.h} fill={e.couleur} />
      ))}
    </svg>
  )
}
const Ic = ({ n, t = 22 }) => (
  <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={I[n]} /></svg>
)

export default function Tableau() {
  const { espace: espaceParam } = useParams()
  const config = ESPACES[espaceParam] || ESPACES.perso
  const foyer = FOYERS[config.foyer]
  const { data, setData, token, statut, erreur, connecter, déconnecter } = useDonnéesSynchronisées(config, compléter)
  const [tableauId, setTableauId] = useState(() => { try { return localStorage.getItem(`${config.stockage}:actif`) || '' } catch { return '' } })
  const tableau = data.tableaux.find(t => t.id === tableauId) || data.tableaux[0]
  const éléments = tableau.éléments
  const parId = useMemo(() => new Map(éléments.map(e => [e.id, e])), [éléments])

  const [vue, setVue] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2.4, z: 1 })
  const [outil, setOutil] = useState('sélection')
  const [forme, setForme] = useState('rect')
  const [sélection, setSélection] = useState([])
  const [édition, setÉdition] = useState(null)
  const [aperçu, setAperçu] = useState(null) // élément en cours de création (glisser)
  const [cadreSel, setCadreSel] = useState(null)
  const [feuille, setFeuille] = useState(false)
  const [menu, setMenu] = useState(false)
  const [recherche, setRecherche] = useState(null)
  const [message, setMessage] = useState('')
  const [syncOuvert, setSyncOuvert] = useState(false)
  const [modèlesOuvert, setModèlesOuvert] = useState(false)
  const zoneRef = useRef(null)
  const fichierRef = useRef(null)
  const geste = useRef(null)
  const pointeurs = useRef(new Map())
  const dernierToucher = useRef({ id: null, t: 0 })
  const historique = useRef({ passé: [], futur: [] })
  const [, forcer] = useState(0)
  // Texte en cours d'écriture : enregistré quand on termine, quelle que soit
  // la façon (toucher ailleurs, Échap, autre outil…).
  const brouillon = useRef(null) // { id, valeur }
  const réf = useRef({})
  réf.current = { éléments, vue, outil, sélection, parId, forme, édition }

  useEffect(() => { try { localStorage.setItem(`${config.stockage}:actif`, tableau.id) } catch { /* ignore */ } }, [tableau.id, config.stockage])
  const terminerÉdition = () => {
    const b = brouillon.current
    brouillon.current = null
    if (b) {
      const el = réf.current.parId.get(b.id)
      if (el && b.valeur !== (el.texte || '')) majÉlément(b.id, { texte: b.valeur })
    }
    setÉdition(null)
  }
  const afficher = t => { setMessage(t); clearTimeout(afficher.m); afficher.m = setTimeout(() => setMessage(''), 2200) }

  // ---------- Données ----------
  const majÉléments = (fn, trace = true) => {
    if (trace) { historique.current.passé.push(réf.current.éléments); historique.current.passé = historique.current.passé.slice(-80); historique.current.futur = []; forcer(n => n + 1) }
    setData(d => ({ ...d, tableaux: d.tableaux.map(t => (t.id === tableau.id ? { ...t, éléments: fn(t.éléments) } : t)) }))
  }
  const majÉlément = (id, champs, trace = true) => majÉléments(l => l.map(e => (e.id === id ? { ...e, ...champs } : e)), trace)
  const voyager = (de, vers) => {
    const h = historique.current
    if (!h[de].length) return
    h[vers].push(réf.current.éléments)
    const état = h[de].pop()
    setData(d => ({ ...d, tableaux: d.tableaux.map(t => (t.id === tableau.id ? { ...t, éléments: état } : t)) }))
    setSélection([]); setÉdition(null); forcer(n => n + 1)
  }
  const annuler = () => voyager('passé', 'futur')
  const rétablir = () => voyager('futur', 'passé')
  useEffect(() => { historique.current = { passé: [], futur: [] }; setSélection([]); setÉdition(null); forcer(n => n + 1) }, [tableau.id])

  const ajouter = (el, éditer = false) => {
    if (brouillon.current) terminerÉdition()
    majÉléments(l => [...l, el])
    setSélection([el.id]); setOutil('sélection')
    if (éditer) setTimeout(() => setÉdition(el.id), 30)
    return el
  }
  const supprimer = ids => {
    const s = new Set(ids)
    majÉléments(l => l.filter(e => !s.has(e.id)).map(e => {
      if (e.type !== 'ligne' || (!s.has(e.de) && !s.has(e.vers))) return e
      const { a, b } = bouts(e, réf.current.parId) // les lignes reliées restent, détachées
      const m = { ...e, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
      if (s.has(e.de)) delete m.de
      if (s.has(e.vers)) delete m.vers
      return m
    }))
    setSélection([]); setÉdition(null)
  }
  const dupliquer = ids => {
    const copies = ids.map(id => parId.get(id)).filter(Boolean).map(e => {
      const c = { ...e, id: uid() }
      if (e.type === 'ligne') { Object.assign(c, { x1: e.x1 + 30, y1: e.y1 + 30, x2: e.x2 + 30, y2: e.y2 + 30 }); delete c.de; delete c.vers }
      else if (e.type === 'trait') c.points = e.points.map(([x, y]) => [x + 30, y + 30])
      else { c.x += 30; c.y += 30 }
      return c
    })
    majÉléments(l => [...l, ...copies]); setSélection(copies.map(c => c.id))
  }
  const premierPlan = ids => { const s = new Set(ids); majÉléments(l => [...l.filter(e => !s.has(e.id)), ...l.filter(e => s.has(e.id))]) }

  // ---------- Coordonnées ----------
  const versMonde = (cx, cy) => {
    const r = zoneRef.current.getBoundingClientRect(); const v = réf.current.vue
    return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z }
  }
  const zoomer = (facteur, cx, cy) => setVue(v => {
    const r = zoneRef.current.getBoundingClientRect()
    const z = Math.min(4, Math.max(0.1, v.z * facteur))
    const px = cx - r.left, py = cy - r.top
    return { z, x: px - (px - v.x) * (z / v.z), y: py - (py - v.y) * (z / v.z) }
  })
  const ajusterVue = (liste = réf.current.éléments) => {
    const r = zoneRef.current?.getBoundingClientRect()
    if (!r) return
    if (!liste.length) { setVue({ x: r.width / 2, y: r.height / 2.4, z: 1 }); return }
    const bs = liste.map(boîte)
    const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y))
    const x1 = Math.max(...bs.map(b => b.x + b.l)), y1 = Math.max(...bs.map(b => b.y + b.h))
    const z = Math.min(1.6, Math.max(0.1, Math.min((r.width - 60) / Math.max(1, x1 - x0), (r.height - 220) / Math.max(1, y1 - y0))))
    setVue({ z, x: r.width / 2 - ((x0 + x1) / 2) * z, y: r.height / 2 - ((y0 + y1) / 2) * z })
  }
  // Ouverture d'un tableau : cadrer son contenu.
  const ouvertRef = useRef(null)
  useEffect(() => {
    if (ouvertRef.current === tableau.id || !zoneRef.current) return
    if (statut === 'chargement') return
    ouvertRef.current = tableau.id
    ajusterVue(tableau.éléments)
  }, [tableau.id, statut]) // eslint-disable-line react-hooks/exhaustive-deps

  // Molette : défilement ; Ctrl/⌘ + molette (ou pincement du pavé) : zoom.
  useEffect(() => {
    const z = zoneRef.current
    const f = e => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) zoomer(Math.exp(-Math.max(-60, Math.min(60, e.deltaY)) * 0.006), e.clientX, e.clientY)
      else setVue(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
    }
    z.addEventListener('wheel', f, { passive: false })
    return () => z.removeEventListener('wheel', f)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Gestes ----------
  const élémentSous = (cx, cy, sauf) => {
    const cible = document.elementsFromPoint(cx, cy).map(n => n.closest?.('[data-el]')).find(n => n && n.dataset.el !== sauf)
    return cible?.dataset.el || null
  }
  const surBas = e => {
    if (e.button === 2) return
    if (e.target.closest('textarea, input')) return // écrire dans un élément
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    zoneRef.current.setPointerCapture?.(e.pointerId)
    if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()]
      geste.current = { type: 'pince', d0: Math.hypot(a.x - b.x, a.y - b.y), vue0: réf.current.vue, m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
      setAperçu(null); setCadreSel(null)
      return
    }
    if (réf.current.édition && !e.target.closest('textarea')) terminerÉdition()
    if (e.target.closest('textarea, button, input')) return
    const p = versMonde(e.clientX, e.clientY)
    const poignée = e.target.closest('[data-poignee]')?.dataset.poignee
    const idEl = e.target.closest('[data-el]')?.dataset.el
    const { outil: o } = réf.current
    if (poignée) {
      const [id, coin] = poignée.split(':')
      geste.current = { type: 'redim', id, coin, p0: p, départ: parId.get(id), tracé: false }
      return
    }
    if (o === 'main' || (o === 'sélection' && !idEl && !(e.shiftKey && e.pointerType === 'mouse'))) {
      geste.current = { type: 'pan', s0: { x: e.clientX, y: e.clientY }, vue0: réf.current.vue, bougé: false }
      return
    }
    if (o === 'sélection' && !idEl) { geste.current = { type: 'cadreSel', p0: p }; return }
    if (o === 'sélection') {
      const el = parId.get(idEl)
      const maintenant = Date.now()
      if (dernierToucher.current.id === idEl && maintenant - dernierToucher.current.t < 350 && avecTexte(el)) { setSélection([idEl]); setÉdition(idEl); geste.current = null; return }
      dernierToucher.current = { id: idEl, t: maintenant }
      let sel = réf.current.sélection
      if (e.shiftKey) sel = sel.includes(idEl) ? sel.filter(x => x !== idEl) : [...sel, idEl]
      else if (!sel.includes(idEl)) sel = [idEl]
      setSélection(sel)
      // Un cadre emporte ce qui est dedans.
      const ids = new Set(sel)
      sel.map(id => parId.get(id)).filter(x => x?.type === 'cadre').forEach(c => {
        réf.current.éléments.forEach(x => { const m = centre(x); if (x.id !== c.id && m.x > c.x && m.x < c.x + c.l && m.y > c.y && m.y < c.y + c.h) ids.add(x.id) })
      })
      geste.current = { type: 'déplacer', p0: p, départs: new Map([...ids].map(id => [id, parId.get(id)])), tracé: false }
      return
    }
    // Outils de création
    if (o === 'stylo') { geste.current = { type: 'stylo', points: [[p.x, p.y]] }; setAperçu({ id: '__aperçu', type: 'trait', points: [[p.x, p.y]], couleur: '#1b1b1b', épaisseur: 3 }); return }
    if (o === 'ligne') {
      const de = élémentSous(e.clientX, e.clientY)
      geste.current = { type: 'ligne', p0: p, de }
      setAperçu({ id: '__aperçu', type: 'ligne', x1: p.x, y1: p.y, x2: p.x, y2: p.y, de, couleur: '#1b1b1b', épaisseur: 2, flèche: 'fin' })
      return
    }
    if (o === 'commentaire') { const [l, h] = TAILLES.commentaire; ajouter({ id: uid(), type: 'commentaire', x: p.x - l / 2, y: p.y - h / 2, l, h, texte: '' }, true); return }
    geste.current = { type: 'créer', genre: o, p0: p }
  }

  const surMouvement = e => {
    if (!pointeurs.current.has(e.pointerId)) return
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = geste.current
    if (!g) return
    if (g.type === 'pince' && pointeurs.current.size >= 2) {
      const [a, b] = [...pointeurs.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y); const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const r = zoneRef.current.getBoundingClientRect()
      const z = Math.min(4, Math.max(0.1, g.vue0.z * d / g.d0))
      const px = g.m0.x - r.left, py = g.m0.y - r.top
      setVue({ z, x: px - (px - g.vue0.x) * (z / g.vue0.z) + (m.x - g.m0.x), y: py - (py - g.vue0.y) * (z / g.vue0.z) + (m.y - g.m0.y) })
      return
    }
    if (g.type === 'pan') {
      const dx = e.clientX - g.s0.x, dy = e.clientY - g.s0.y
      if (Math.hypot(dx, dy) > 4) g.bougé = true
      setVue({ ...g.vue0, x: g.vue0.x + dx, y: g.vue0.y + dy })
      return
    }
    const p = versMonde(e.clientX, e.clientY)
    const dx = p.x - g.p0?.x, dy = p.y - g.p0?.y
    if (g.type === 'déplacer') {
      if (!g.tracé) { if (Math.hypot(dx, dy) * réf.current.vue.z < 4) return; g.tracé = true; historique.current.passé.push(réf.current.éléments); historique.current.futur = [] }
      majÉléments(l => l.map(x => {
        const d = g.départs.get(x.id)
        if (!d) return x
        if (d.type === 'ligne') return { ...x, x1: d.x1 + dx, y1: d.y1 + dy, x2: d.x2 + dx, y2: d.y2 + dy }
        if (d.type === 'trait') return { ...x, points: d.points.map(([px, py]) => [px + dx, py + dy]) }
        return { ...x, x: d.x + dx, y: d.y + dy }
      }), false)
    } else if (g.type === 'redim') {
      if (!g.tracé) { g.tracé = true; historique.current.passé.push(réf.current.éléments); historique.current.futur = [] }
      const d = g.départ
      if (d.type === 'ligne') { majÉlément(d.id, g.coin === 'a' ? { x1: p.x, y1: p.y, de: undefined } : { x2: p.x, y2: p.y, vers: undefined }, false); return }
      const min = d.type === 'commentaire' ? 20 : 24
      let { x, y, l, h } = d
      if (g.coin.includes('e')) l = Math.max(min, d.l + dx)
      if (g.coin.includes('s')) h = Math.max(min, d.h + dy)
      if (g.coin.includes('w')) { l = Math.max(min, d.l - dx); x = d.x + d.l - l }
      if (g.coin.includes('n')) { h = Math.max(min, d.h - dy); y = d.y + d.h - h }
      if (d.type === 'image' || (d.type === 'note' && e.shiftKey)) { const r = d.h / d.l; h = l * r; if (g.coin.includes('n')) y = d.y + d.h - h }
      majÉlément(d.id, { x, y, l, h }, false)
    } else if (g.type === 'stylo') {
      g.points.push([p.x, p.y]); setAperçu(a => ({ ...a, points: [...g.points] }))
    } else if (g.type === 'ligne') {
      setAperçu(a => ({ ...a, x2: p.x, y2: p.y, vers: null }))
    } else if (g.type === 'créer' || g.type === 'cadreSel') {
      const b = { x: Math.min(g.p0.x, p.x), y: Math.min(g.p0.y, p.y), l: Math.abs(dx), h: Math.abs(dy) }
      if (g.type === 'cadreSel') setCadreSel(b)
      else if (['forme', 'cadre', 'note', 'texte'].includes(g.genre)) setAperçu({ id: '__aperçu', type: g.genre === 'forme' ? 'forme' : g.genre, forme: réf.current.forme, ...b, couleur: g.genre === 'note' ? NOTES[0] : '#ffffff', texte: '' })
    }
  }

  const surHaut = e => {
    pointeurs.current.delete(e.pointerId)
    const g = geste.current
    if (!g) return
    if (g.type === 'pince') { if (pointeurs.current.size === 0) geste.current = null; return }
    geste.current = null
    const p = versMonde(e.clientX, e.clientY)
    if (g.type === 'pan') { if (!g.bougé && réf.current.outil === 'sélection') { setSélection([]); terminerÉdition() } return }
    if (g.type === 'cadreSel') {
      const b = cadreSel; setCadreSel(null)
      if (!b) { setSélection([]); return }
      setSélection(réf.current.éléments.filter(x => { const k = boîte(x); return k.x < b.x + b.l && k.x + k.l > b.x && k.y < b.y + b.h && k.y + k.h > b.y }).map(x => x.id))
      return
    }
    if (g.type === 'stylo') {
      setAperçu(null)
      if (g.points.length > 1) ajouter({ id: uid(), type: 'trait', points: g.points.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]), couleur: '#1b1b1b', épaisseur: 3 })
      setOutil('stylo')
      return
    }
    if (g.type === 'ligne') {
      setAperçu(null)
      const vers = élémentSous(e.clientX, e.clientY, g.de)
      if (Math.hypot(p.x - g.p0.x, p.y - g.p0.y) < 8 && !vers) return
      ajouter({ id: uid(), type: 'ligne', x1: g.p0.x, y1: g.p0.y, x2: p.x, y2: p.y, ...(g.de ? { de: g.de } : {}), ...(vers ? { vers } : {}), couleur: '#1b1b1b', épaisseur: 2, flèche: 'fin', style: 'plein' })
      return
    }
    if (g.type === 'créer') {
      setAperçu(null)
      const [ld, hd] = TAILLES[g.genre] || [160, 120]
      const glissé = Math.abs(p.x - g.p0.x) > 12 && Math.abs(p.y - g.p0.y) > 12
      const b = glissé ? { x: Math.min(g.p0.x, p.x), y: Math.min(g.p0.y, p.y), l: Math.abs(p.x - g.p0.x), h: Math.abs(p.y - g.p0.y) } : { x: p.x - ld / 2, y: p.y - hd / 2, l: ld, h: hd }
      const base = { id: uid(), ...b, texte: '' }
      if (g.genre === 'note') ajouter({ ...base, type: 'note', couleur: NOTES[0], taille: 'auto' }, true)
      else if (g.genre === 'texte') ajouter({ ...base, type: 'texte', couleur: '#1b1b1b', taille: 'auto' }, true)
      else if (g.genre === 'forme') ajouter({ ...base, type: 'forme', forme: réf.current.forme, couleur: '#ffffff', bord: '#1b1b1b', taille: 'auto' }, true)
      else if (g.genre === 'cadre') ajouter({ ...base, type: 'cadre', texte: `Cadre ${réf.current.éléments.filter(x => x.type === 'cadre').length + 1}` })
    }
  }

  // ---------- Actions ----------
  const ajouterRelié = id => {
    if (brouillon.current) terminerÉdition()
    const s = parId.get(id)
    const n = { id: uid(), type: s.type === 'forme' ? 'forme' : 'note', forme: s.forme, x: s.x + s.l + 90, y: s.y, l: s.l, h: s.h, texte: '', couleur: s.couleur, bord: s.bord, taille: 'auto' }
    const ligne = { id: uid(), type: 'ligne', x1: 0, y1: 0, x2: 0, y2: 0, de: s.id, vers: n.id, couleur: '#1b1b1b', épaisseur: 2, flèche: 'fin', style: 'plein' }
    majÉléments(l => [...l, n, ligne])
    setSélection([n.id]); setTimeout(() => setÉdition(n.id), 30)
  }
  const choisirImage = async e => {
    const fichier = e.target.files?.[0]; e.target.value = ''
    if (!fichier) return
    if (!token) { afficher('Connecte le token GitHub pour ajouter des images'); return }
    afficher('Envoi de l\'image…')
    try {
      const { image, largeur, hauteur } = await envoyerImage(fichier, token)
      const r = zoneRef.current.getBoundingClientRect()
      const c = versMonde(r.left + r.width / 2, r.top + r.height / 2)
      const l = Math.min(360, largeur), h = l * (hauteur / largeur)
      ajouter({ id: uid(), type: 'image', image, x: c.x - l / 2, y: c.y - h / 2, l, h })
      afficher('Image ajoutée')
    } catch (err) { afficher(`Image : ${err.message}`) }
  }
  // Modèles : posés au centre de l'écran, puis la vue se cadre dessus.
  const insérerModèle = modèleÉléments => {
    if (brouillon.current) terminerÉdition()
    const r = zoneRef.current.getBoundingClientRect()
    const c = versMonde(r.left + r.width / 2, r.top + r.height / 2)
    let nouveaux = instancierÉléments(modèleÉléments, c.x, c.y, uid, boîte)
    // Tableau déjà rempli : le modèle se pose à droite du contenu, sur une
    // place libre, au lieu de tout recouvrir.
    const existants = éléments.filter(e => !(e.type === 'ligne' && (e.de || e.vers)))
    if (existants.length) {
      const placés = nouveaux.filter(e => !(e.type === 'ligne' && (e.de || e.vers))).map(boîte)
      const bx = Math.min(...placés.map(b => b.x)), by = Math.min(...placés.map(b => b.y))
      const eb = existants.map(boîte)
      const dx = Math.max(...eb.map(b => b.x + b.l)) + 240 - bx
      const dy = Math.min(...eb.map(b => b.y)) - by
      nouveaux = nouveaux.map(e => e.type === 'ligne' ? { ...e, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy }
        : e.type === 'trait' ? { ...e, points: e.points.map(([x, y]) => [x + dx, y + dy]) } : { ...e, x: e.x + dx, y: e.y + dy })
    }
    majÉléments(l => [...l, ...nouveaux])
    setSélection([]); setOutil('sélection'); setModèlesOuvert(false); setMenu(false)
    setTimeout(() => ajusterVue(nouveaux), 30)
    afficher('Modèle ajouté — touche deux fois un élément pour écrire')
  }
  const enregistrerModèle = () => {
    const source = sélection.length ? sélection.map(id => parId.get(id)).filter(Boolean) : éléments
    if (!source.length) { afficher('Le tableau est vide'); return }
    const nom = window.prompt(sélection.length ? `Nom du modèle (${source.length} élément(s) choisi(s))` : 'Nom du modèle (tout le tableau)', tableau.nom)
    if (nom === null || !nom.trim()) return
    setData(d => ({ ...d, modèles: [...(d.modèles || []), { id: uid(), nom: nom.trim(), éléments: source }] }))
    afficher('Modèle enregistré'); setMenu(false)
  }
  const supprimerModèle = m => {
    if (!window.confirm(`Supprimer le modèle « ${m.nom} » ?`)) return
    setData(d => ({ ...d, modèles: (d.modèles || []).filter(x => x.id !== m.id) }))
  }

  const choisirOutil = o => {
    setFeuille(false); terminerÉdition()
    if (o === 'image') { fichierRef.current?.click(); return }
    if (o === 'modèles') { setModèlesOuvert(true); return }
    setOutil(o); if (o !== 'sélection') setSélection([])
  }

  // Clavier (ordinateur)
  useEffect(() => {
    const f = e => {
      if (e.target.closest?.('textarea, input')) return
      const { sélection: sel } = réf.current
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) rétablir(); else annuler(); return }
      if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); rétablir(); return }
      if ((e.ctrlKey || e.metaKey) && k === 'd' && sel.length) { e.preventDefault(); dupliquer(sel); return }
      if ((e.ctrlKey || e.metaKey) && k === 'a') { e.preventDefault(); setSélection(réf.current.éléments.map(x => x.id)); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length) { e.preventDefault(); supprimer(sel); return }
      if (e.key === 'Escape') { setSélection([]); setOutil('sélection'); setFeuille(false); return }
      if (e.key === 'Enter' && sel.length === 1 && avecTexte(réf.current.parId.get(sel[0]))) { e.preventDefault(); setÉdition(sel[0]); return }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const raccourcis = { v: 'sélection', h: 'main', n: 'note', t: 'texte', r: 'forme', l: 'ligne', p: 'stylo', f: 'cadre', c: 'commentaire' }
      if (raccourcis[k]) choisirOutil(raccourcis[k])
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }) // à chaque rendu : fonctions à jour

  // ---------- Tableaux ----------
  const nouveauTableau = () => {
    const nom = window.prompt('Nom du nouveau tableau', 'Sans titre')
    if (nom === null) return
    const t = { id: uid(), nom: nom.trim() || 'Sans titre', éléments: [] }
    setData(d => ({ ...d, tableaux: [...d.tableaux, t] })); setTableauId(t.id); setMenu(false)
  }
  const renommer = () => {
    const nom = window.prompt('Nom du tableau', tableau.nom)
    if (nom === null || !nom.trim()) return
    setData(d => ({ ...d, tableaux: d.tableaux.map(t => (t.id === tableau.id ? { ...t, nom: nom.trim() } : t)) }))
  }
  const supprimerTableau = () => {
    if (data.tableaux.length < 2) { afficher('C\'est le seul tableau'); return }
    if (!window.confirm(`Supprimer le tableau « ${tableau.nom} » et tout son contenu ?`)) return
    const reste = data.tableaux.filter(t => t.id !== tableau.id)
    setData(d => ({ ...d, tableaux: d.tableaux.filter(t => t.id !== tableau.id) })); setTableauId(reste[0].id); setMenu(false)
  }

  // ---------- Rendu des éléments ----------
  const sel = new Set(sélection)
  const lignes = [...éléments.filter(x => x.type === 'ligne' || x.type === 'trait'), ...(aperçu && (aperçu.type === 'ligne' || aperçu.type === 'trait') ? [aperçu] : [])]
  const blocs = [...éléments.filter(x => x.type === 'cadre'), ...éléments.filter(x => x.type !== 'cadre' && x.type !== 'ligne' && x.type !== 'trait'),
    ...(aperçu && aperçu.type !== 'ligne' && aperçu.type !== 'trait' ? [aperçu] : [])]
  const z = vue.z
  const poignée = (id, coin, x, y) => (
    <div key={coin} data-poignee={`${id}:${coin}`} style={{
      position: 'absolute', left: x, top: y, width: 14 / z, height: 14 / z, marginLeft: -7 / z, marginTop: -7 / z, borderRadius: '50%',
      background: '#fff', border: `${1.6 / z}px solid #8a8a8a`, cursor: 'nwse-resize', touchAction: 'none', zIndex: 5,
    }}>
      <div data-poignee={`${id}:${coin}`} style={{ position: 'absolute', inset: -14 / z }} />
    </div>
  )
  const champTexte = el => (
    <textarea
      autoFocus
      defaultValue={el.texte || ''}
      onFocus={e => { const t = e.target; t.selectionStart = t.selectionEnd = t.value.length; brouillon.current = { id: el.id, valeur: t.value } }}
      onChange={e => { brouillon.current = { id: el.id, valeur: e.target.value } }}
      onBlur={() => terminerÉdition()}
      onKeyDown={e => { if (e.key === 'Escape') e.target.blur(); e.stopPropagation() }}
      aria-label="Texte"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
        font: 'inherit', color: 'inherit', textAlign: 'inherit', padding: 'inherit', lineHeight: 'inherit', fontWeight: 'inherit', boxSizing: 'border-box',
      }}
    />
  )
  const contenuTexte = el => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: el.type === 'texte' ? 'flex-start' : 'center', justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center', overflow: 'hidden' }}>
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%', textAlign: el.align || (el.type === 'texte' ? 'left' : 'center') }}>{el.texte}</div>
    </div>
  )

  const rendreBloc = el => {
    const choisi = sel.has(el.id) && el.id !== '__aperçu'
    const fs = taillePolice(el)
    const commun = { position: 'absolute', left: el.x, top: el.y, width: el.l, height: el.h, boxSizing: 'border-box' }
    let corps
    if (el.type === 'note') {
      corps = (
        <div style={{ ...commun, background: el.couleur, boxShadow: '0 6px 14px rgba(0,0,0,.14)', padding: Math.max(8, el.l * 0.07), fontSize: fs, lineHeight: 1.25, color: '#1b1b1b', fontWeight: el.gras ? 700 : 400, fontFamily: grotesk, textAlign: el.align || 'center' }}>
          {édition === el.id ? champTexte(el) : contenuTexte(el)}
        </div>
      )
    } else if (el.type === 'texte') {
      corps = (
        <div style={{ ...commun, fontSize: fs, lineHeight: 1.3, color: el.couleur || '#1b1b1b', fontWeight: el.gras ? 700 : 400, fontFamily: grotesk, textAlign: el.align || 'left', padding: 4, ...(el.texte || édition === el.id ? {} : { outline: '1px dashed #aaa' }) }}>
          {édition === el.id ? champTexte(el) : (el.texte ? contenuTexte(el) : <span style={{ color: '#aaa' }}>Texte</span>)}
        </div>
      )
    } else if (el.type === 'forme') {
      corps = (
        <div style={{ ...commun, fontSize: fs, lineHeight: 1.25, color: el.couleurTexte || '#1b1b1b', fontWeight: el.gras ? 700 : 400, fontFamily: grotesk, textAlign: el.align || 'center', padding: el.forme === 'bulle' ? '8% 10% 30%' : '12%' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            <path d={cheminForme(el.forme)} fill={el.couleur} stroke={el.bord || '#1b1b1b'} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </svg>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>{édition === el.id ? champTexte(el) : contenuTexte(el)}</div>
        </div>
      )
    } else if (el.type === 'cadre') {
      corps = (
        <div style={{ ...commun, background: el.couleur || '#ffffff', border: `${1.5 / z}px solid ${choisi ? UI.accent : '#c9c9c9'}`, borderRadius: 4 }}>
          <div style={{ position: 'absolute', left: 0, bottom: '100%', marginBottom: 6 / z, fontSize: 14 / z, color: '#555', fontFamily: grotesk, whiteSpace: 'nowrap', minWidth: 120 / z, height: 22 / z }}>
            {édition === el.id ? champTexte(el) : (el.texte || 'Cadre')}
          </div>
        </div>
      )
    } else if (el.type === 'commentaire') {
      corps = (
        <div style={{ ...commun }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50% 50% 50% 4px', background: UI.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: el.h * 0.5, boxShadow: '0 3px 8px rgba(0,0,0,.25)' }}>💬</div>
          {(choisi || édition === el.id) && (
            <div style={{ position: 'absolute', left: '110%', top: 0, width: 240 / z, minHeight: 60 / z, padding: 10 / z, background: '#fff', borderRadius: 10 / z, boxShadow: '0 6px 20px rgba(0,0,0,.18)', fontSize: 14 / z, color: '#1b1b1b', fontFamily: grotesk, lineHeight: 1.35 }}>
              <div style={{ position: 'relative', minHeight: 40 / z }}>{édition === el.id ? champTexte(el) : (el.texte || <span style={{ color: '#999' }}>Touche deux fois pour écrire un commentaire</span>)}</div>
            </div>
          )}
        </div>
      )
    } else if (el.type === 'image') {
      corps = <div style={{ ...commun, boxShadow: '0 4px 12px rgba(0,0,0,.12)' }}><ImageÉlément image={el.image} /></div>
    }
    return (
      <div key={el.id} data-el={el.id === '__aperçu' ? undefined : el.id} style={{ position: 'absolute', left: 0, top: 0, opacity: el.id === '__aperçu' ? 0.6 : 1, cursor: outil === 'sélection' ? 'move' : 'crosshair' }}>
        {corps}
        {choisi && el.type !== 'commentaire' && (
          <>
            <div style={{ position: 'absolute', left: el.x - 4 / z, top: el.y - 4 / z, width: el.l + 8 / z, height: el.h + 8 / z, border: `${1.6 / z}px solid ${UI.accent}`, pointerEvents: 'none' }} />
            {sélection.length === 1 && [['nw', el.x, el.y], ['ne', el.x + el.l, el.y], ['sw', el.x, el.y + el.h], ['se', el.x + el.l, el.y + el.h]].map(([c, x, y]) => poignée(el.id, c, x, y))}
          </>
        )}
      </div>
    )
  }

  const rendreLigne = el => {
    const choisi = sel.has(el.id) && el.id !== '__aperçu'
    if (el.type === 'trait') {
      const d = el.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
      return (
        <g key={el.id} data-el={el.id === '__aperçu' ? undefined : el.id} style={{ cursor: 'move' }}>
          <path d={d} fill="none" stroke="transparent" strokeWidth={Math.max(16 / z, el.épaisseur + 10)} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'stroke' }} />
          <path d={d} fill="none" stroke={choisi ? UI.accent : el.couleur} strokeWidth={el.épaisseur} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
        </g>
      )
    }
    const { a, b } = bouts(el, parId)
    const tirets = el.style === 'tirets' ? `${8 + el.épaisseur * 2} ${6 + el.épaisseur * 2}` : undefined
    return (
      <g key={el.id} data-el={el.id === '__aperçu' ? undefined : el.id} style={{ cursor: 'move' }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={Math.max(18 / z, el.épaisseur + 12)} style={{ pointerEvents: 'stroke' }} />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={choisi ? UI.accent : el.couleur} strokeWidth={el.épaisseur} strokeDasharray={tirets}
          markerEnd={el.flèche === 'fin' || el.flèche === 'deux' ? `url(#fl-${choisi ? 'sel' : el.couleur.slice(1)})` : undefined}
          markerStart={el.flèche === 'deux' ? `url(#fl-${choisi ? 'sel' : el.couleur.slice(1)})` : undefined} style={{ pointerEvents: 'none' }} />
        {el.texte && (
          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} textAnchor="middle" fontSize={14} fontFamily="system-ui" fill="#1b1b1b" paintOrder="stroke" stroke={UI.fond} strokeWidth={4} style={{ pointerEvents: 'none' }}>{el.texte}</text>
        )}
      </g>
    )
  }
  const couleursFlèches = [...new Set(lignes.filter(l => l.type === 'ligne').map(l => l.couleur))]

  // ---------- Barre contextuelle ----------
  const choisis = sélection.map(id => parId.get(id)).filter(Boolean)
  const seul = choisis.length === 1 ? choisis[0] : null
  const majChoisis = champs => majÉléments(l => l.map(e => (sel.has(e.id) ? { ...e, ...(typeof champs === 'function' ? champs(e) : champs) } : e)))
  const pastille = (c, actif, onClick, titre) => (
    <button key={c} type="button" onClick={onClick} aria-label={titre} title={titre} style={{ width: 30, height: 30, minWidth: 30, borderRadius: '50%', background: c, border: actif ? `3px solid ${UI.accent}` : '1px solid #ccc', cursor: 'pointer', flexShrink: 0 }} />
  )
  const btn = (contenu, onClick, titre, actif = false) => (
    <button type="button" onClick={onClick} title={titre} aria-label={titre} aria-pressed={actif} style={{
      minWidth: 40, height: 40, padding: '0 8px', border: 'none', borderRadius: 10, background: actif ? '#e8edff' : 'transparent', color: actif ? UI.accent : UI.texte,
      cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{contenu}</button>
  )
  const sép = <span style={{ width: 1, alignSelf: 'stretch', background: UI.bord, margin: '6px 4px', flexShrink: 0 }} />
  const barreContexte = choisis.length > 0 && !édition && (
    <div role="toolbar" aria-label="Élément choisi" onPointerDown={e => e.stopPropagation()} style={{
      position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(84px + env(safe-area-inset-bottom))', zIndex: 20, maxWidth: 'calc(100% - 20px)',
      background: UI.barre, borderRadius: 14, boxShadow: '0 6px 24px rgba(0,0,0,.16)', display: 'flex', alignItems: 'center', gap: 2, padding: '4px 6px', overflowX: 'auto',
    }}>
      {seul && ['note', 'texte', 'forme'].includes(seul.type) && (
        <>
          {btn('−', () => majChoisis(e => ({ taille: Math.max(8, Math.round(taillePolice(e) - 2)) })), 'Texte plus petit')}
          {btn(typeof seul.taille === 'number' ? Math.round(seul.taille) : 'AUTO', () => majChoisis({ taille: 'auto' }), 'Taille automatique', seul.taille === 'auto' || seul.taille == null)}
          {btn('+', () => majChoisis(e => ({ taille: Math.min(120, Math.round(taillePolice(e) + 2)) })), 'Texte plus grand')}
          {sép}
          {btn(<b style={{ textDecoration: 'underline' }}>B</b>, () => majChoisis(e => ({ gras: !e.gras })), 'Gras', !!seul.gras)}
          {btn(seul.align === 'left' ? '⇤' : seul.align === 'right' ? '⇥' : '≡', () => majChoisis(e => ({ align: e.align === 'left' ? 'center' : e.align === 'center' || !e.align ? 'right' : 'left' })), 'Alignement')}
          {btn('✎', () => setÉdition(seul.id), 'Écrire')}
          {sép}
        </>
      )}
      {seul?.type === 'note' && NOTES.map(c => pastille(c, seul.couleur === c, () => majChoisis({ couleur: c }), `Couleur ${c}`))}
      {seul?.type === 'forme' && (
        <>
          {FORMES.map(([f, s, n]) => btn(s, () => majChoisis({ forme: f }), n, seul.forme === f))}
          {sép}
          {['#ffffff', ...NOTES.slice(0, 6), '#1b1b1b'].map(c => pastille(c, seul.couleur === c, () => majChoisis({ couleur: c, couleurTexte: c === '#1b1b1b' ? '#ffffff' : '#1b1b1b' }), `Remplissage ${c}`))}
        </>
      )}
      {(seul?.type === 'texte' || seul?.type === 'trait') && TRAITS.slice(0, 7).map(c => pastille(c, seul.couleur === c, () => majChoisis({ couleur: c }), `Couleur ${c}`))}
      {seul?.type === 'ligne' && (
        <>
          {btn('→', () => majChoisis({ flèche: 'fin' }), 'Flèche', seul.flèche === 'fin')}
          {btn('↔', () => majChoisis({ flèche: 'deux' }), 'Double flèche', seul.flèche === 'deux')}
          {btn('—', () => majChoisis({ flèche: 'aucune' }), 'Sans flèche', seul.flèche === 'aucune')}
          {btn('┅', () => majChoisis(e => ({ style: e.style === 'tirets' ? 'plein' : 'tirets' })), 'Pointillés', seul.style === 'tirets')}
          {btn('T', () => { const t = window.prompt('Texte sur la ligne', seul.texte || ''); if (t !== null) majChoisis({ texte: t }) }, 'Texte sur la ligne', !!seul.texte)}
          {sép}
          {[1, 2, 4, 6].map(ep => btn(<span style={{ width: 18, height: ep, background: UI.texte, borderRadius: 2 }} />, () => majChoisis({ épaisseur: ep }), `Épaisseur ${ep}`, seul.épaisseur === ep))}
          {sép}
          {TRAITS.slice(0, 6).map(c => pastille(c, seul.couleur === c, () => majChoisis({ couleur: c }), `Couleur ${c}`))}
        </>
      )}
      {seul?.type === 'trait' && [2, 3, 6, 10].map(ep => btn(<span style={{ width: 18, height: Math.min(8, ep), background: UI.texte, borderRadius: 2 }} />, () => majChoisis({ épaisseur: ep }), `Épaisseur ${ep}`, seul.épaisseur === ep))}
      {seul?.type === 'cadre' && ['#ffffff', '#fff8e1', '#e3f2fd', '#e8f5e9', '#fce4ec', '#f3e5f5'].map(c => pastille(c, (seul.couleur || '#ffffff') === c, () => majChoisis({ couleur: c }), `Fond ${c}`))}
      {sép}
      {btn(<Ic n="dupliquer" t={20} />, () => dupliquer(sélection), 'Dupliquer')}
      {btn('⤒', () => premierPlan(sélection), 'Premier plan')}
      {btn(<span style={{ color: '#d33' }}><Ic n="corbeille" t={20} /></span>, () => supprimer(sélection), 'Supprimer')}
    </div>
  )

  // « + » à côté d'un pense-bête ou d'une forme : enchaîner une idée reliée.
  const boutonPlus = seul && ['note', 'forme'].includes(seul.type) && !édition && (
    <button onPointerDown={e => e.stopPropagation()} onClick={() => ajouterRelié(seul.id)} aria-label="Ajouter une idée reliée" title="Ajouter une idée reliée" style={{
      position: 'absolute', left: vue.x + (seul.x + seul.l) * z + 14, top: vue.y + (seul.y + seul.h / 2) * z - 24, width: 48, height: 48, borderRadius: '50%',
      border: 'none', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.18)', color: UI.texte, cursor: 'pointer', zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}><Ic n="plus" t={24} /></button>
  )

  // ---------- Recherche ----------
  const résultats = recherche?.q ? éléments.filter(e => e.texte && normaliser(e.texte).includes(normaliser(recherche.q))) : []
  const allerÀ = e => {
    const r = zoneRef.current.getBoundingClientRect(); const c = centre(e)
    const zz = Math.max(0.6, Math.min(1.4, vue.z))
    setVue({ z: zz, x: r.width / 2 - c.x * zz, y: r.height / 2.3 - c.y * zz }); setSélection([e.id])
  }

  const OUTILS = [
    ['sélection', 'sélection', 'Sélection (V)'], ['main', 'main', 'Se déplacer (H)'], ['note', 'note', 'Pense-bête (N)'], ['texte', 'texte', 'Texte (T)'],
    ['forme', 'forme', 'Formes (R)'], ['ligne', 'ligne', 'Ligne / flèche (L)'], ['stylo', 'stylo', 'Stylo (P)'], ['cadre', 'cadre', 'Cadre (F)'],
    ['commentaire', 'commentaire', 'Commentaire (C)'], ['image', 'image', 'Charger une image'],
  ]
  const pill = { background: UI.barre, borderRadius: 22, boxShadow: '0 4px 18px rgba(0,0,0,.12)' }
  const passéVide = !historique.current.passé.length, futurVide = !historique.current.futur.length

  return (
    <div style={{ position: 'fixed', inset: 0, background: UI.fond, overflow: 'hidden', color: UI.texte, fontFamily: grotesk, userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Canevas */}
      <div ref={zoneRef} onPointerDown={surBas} onPointerMove={surMouvement} onPointerUp={surHaut} onPointerCancel={surHaut} onContextMenu={e => e.preventDefault()}
        aria-label="Tableau blanc" style={{
          position: 'absolute', inset: 0, touchAction: 'none', cursor: outil === 'main' || outil === 'sélection' ? 'default' : 'crosshair',
          backgroundColor: UI.fond,
          backgroundImage: `linear-gradient(${UI.grille} 1px, transparent 1px), linear-gradient(90deg, ${UI.grille} 1px, transparent 1px)`,
          backgroundSize: `${40 * z}px ${40 * z}px`, backgroundPosition: `${vue.x}px ${vue.y}px`,
        }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${vue.x}px, ${vue.y}px) scale(${z})`, transformOrigin: '0 0' }}>
          {blocs.filter(b => b.type === 'cadre').map(rendreBloc)}
          <svg width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              {[...couleursFlèches, '1b1b1b'].map(c => c.replace('#', '')).concat('sel').map(c => (
                <marker key={c} id={`fl-${c}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 Z" fill={c === 'sel' ? UI.accent : `#${c}`} />
                </marker>
              ))}
            </defs>
            <g style={{ pointerEvents: 'auto' }}>{lignes.map(rendreLigne)}</g>
          </svg>
          {blocs.filter(b => b.type !== 'cadre').map(rendreBloc)}
          {sélection.length === 1 && seul?.type === 'ligne' && (() => { const { a, b } = bouts(seul, parId); return <>{poignée(seul.id, 'a', a.x, a.y)}{poignée(seul.id, 'b', b.x, b.y)}</> })()}
          {cadreSel && <div style={{ position: 'absolute', left: cadreSel.x, top: cadreSel.y, width: cadreSel.l, height: cadreSel.h, background: 'rgba(59,91,219,.08)', border: `${1 / z}px solid ${UI.accent}` }} />}
        </div>
        {éléments.length === 0 && !aperçu && (
          <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: '#8a8a8a', pointerEvents: 'none', padding: 20, maxWidth: 320 }}>
            <div style={{ fontSize: 34 }}>🧭</div>
            <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.5 }}>Touche <b>＋</b> en bas pour ajouter un pense-bête, un texte, une forme, une flèche…<br />Glisse le fond pour te déplacer, pince pour zoomer.</p>
          </div>
        )}
      </div>

      {boutonPlus}

      {/* Barre du haut */}
      <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 'max(12px, env(safe-area-inset-top))', left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', zIndex: 20, ...pill }}>
        <Link to={foyer.accueil} aria-label="Accueil" title="Accueil" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: UI.texte, flexShrink: 0 }}><Ic n="maison" /></Link>
        <button onClick={() => setMenu(m => !m)} aria-expanded={menu} title="Tableaux" style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', fontFamily: grotesk, fontSize: 17, fontWeight: 700, color: UI.texte, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>
          {tableau.nom} <span style={{ fontSize: 12, color: UI.doux }}>▾</span>
        </button>
        <span style={{ fontSize: 12, color: UI.doux, flexShrink: 0 }}>{Math.round(z * 100)}%</span>
        {btn(<Ic n="ajuster" />, () => ajusterVue(), 'Tout voir')}
        {btn(<Ic n="loupe" />, () => setRecherche(r => (r ? null : { q: '' })), 'Rechercher', !!recherche)}
        <button onClick={() => setSyncOuvert(o => !o)} title={statut === 'connecté' ? 'Synchronisé' : statut} aria-label="Synchronisation" style={{ width: 34, height: 34, minWidth: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: statut === 'connecté' ? '#2e9e6b' : statut === 'synchronisation' || statut === 'chargement' ? '#f0a839' : statut === 'erreur' ? '#d33' : '#aaa' }} />
        </button>
      </div>

      {menu && (
        <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(max(12px, env(safe-area-inset-top)) + 62px)', left: 12, width: 'min(320px, calc(100% - 24px))', zIndex: 30, padding: 8, ...pill, borderRadius: 16 }}>
          {data.tableaux.map(t => (
            <button key={t.id} onClick={() => { setTableauId(t.id); setMenu(false) }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '10px 12px', border: 'none', borderRadius: 10, background: t.id === tableau.id ? '#e8edff' : 'transparent', cursor: 'pointer', fontFamily: grotesk, fontSize: 15, color: UI.texte, textAlign: 'left' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nom}</span>
              <span style={{ fontSize: 12, color: UI.doux }}>{t.éléments.length}</span>
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${UI.bord}`, margin: '6px 0', paddingTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {btn('📋 Modèles', () => { setMenu(false); setModèlesOuvert(true) }, 'Modèles')}
            {btn('⭐ Enregistrer comme modèle', enregistrerModèle, 'Enregistrer comme modèle')}
            {btn('＋ Nouveau tableau', nouveauTableau, 'Nouveau tableau')}
            {btn('✎ Renommer', renommer, 'Renommer')}
            {btn(<span style={{ color: '#d33' }}>Supprimer</span>, supprimerTableau, 'Supprimer le tableau')}
          </div>
        </div>
      )}

      {syncOuvert && (
        <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(max(12px, env(safe-area-inset-top)) + 62px)', right: 12, width: 'min(360px, calc(100% - 24px))', zIndex: 30, background: '#1c1a17', borderRadius: 14, padding: 8 }}>
          <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={config.chemin.split('/').pop()} marginBottom="0" />
        </div>
      )}

      {recherche && (
        <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(max(12px, env(safe-area-inset-top)) + 62px)', left: 12, right: 12, maxWidth: 420, zIndex: 30, padding: 8, ...pill, borderRadius: 16 }}>
          <input autoFocus value={recherche.q} onChange={e => setRecherche({ q: e.target.value })} placeholder="Rechercher dans le tableau…" aria-label="Rechercher dans le tableau"
            onKeyDown={e => { if (e.key === 'Escape') setRecherche(null); if (e.key === 'Enter' && résultats[0]) allerÀ(résultats[0]) }}
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${UI.bord}`, borderRadius: 10, padding: '10px 12px', fontSize: 15, outline: 'none' }} />
          {résultats.slice(0, 8).map(r => (
            <button key={r.id} onClick={() => allerÀ(r)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: UI.texte, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {{ note: '🟨', texte: 'T', forme: '◇', cadre: '▢', commentaire: '💬', ligne: '→' }[r.type]} {r.texte}
            </button>
          ))}
          {recherche.q && !résultats.length && <p style={{ margin: '8px 10px', fontSize: 13, color: UI.doux }}>Aucun résultat</p>}
        </div>
      )}

      {/* Annuler / rétablir */}
      <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', left: 12, top: 'calc(max(12px, env(safe-area-inset-top)) + 74px)', display: 'flex', flexDirection: 'column', gap: 2, padding: 6, zIndex: 20, ...pill }}>
        <button onClick={annuler} disabled={passéVide} aria-label="Annuler" title="Annuler (Ctrl+Z)" style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', color: passéVide ? '#bbb' : UI.texte }}><Ic n="annuler" /></button>
        <button onClick={rétablir} disabled={futurVide} aria-label="Rétablir" title="Rétablir (Ctrl+Y)" style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', color: futurVide ? '#bbb' : UI.texte }}><Ic n="rétablir" /></button>
      </div>

      {barreContexte}

      {/* Barre d'outils du bas */}
      <div onPointerDown={e => e.stopPropagation()} role="toolbar" aria-label="Outils" style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'max(14px, env(safe-area-inset-bottom))', zIndex: 20, display: 'flex', alignItems: 'center', gap: 2, padding: 6,
        maxWidth: 'calc(100% - 20px)', overflowX: 'auto', ...pill,
      }}>
        {OUTILS.filter(([o]) => ['sélection', 'note', 'texte', 'forme', 'ligne', 'stylo'].includes(o)).map(([o, ic, titre]) => (
          <button key={o} onClick={() => choisirOutil(o)} aria-label={titre} title={titre} aria-pressed={outil === o} style={{
            width: 44, height: 44, minWidth: 44, border: 'none', borderRadius: 12, cursor: 'pointer', background: outil === o ? '#e8edff' : 'transparent', color: outil === o ? UI.accent : UI.texte,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Ic n={ic} /></button>
        ))}
        <span style={{ width: 1, height: 26, background: UI.bord, margin: '0 2px' }} />
        <button onClick={() => setFeuille(f => !f)} aria-label="Plus d'outils" aria-expanded={feuille} style={{ width: 44, height: 44, minWidth: 44, border: 'none', borderRadius: 12, cursor: 'pointer', background: feuille ? '#e8edff' : 'transparent', color: UI.texte, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="plus" t={26} /></button>
      </div>
      {outil === 'forme' && !feuille && (
        <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(76px + env(safe-area-inset-bottom))', zIndex: 21, display: 'flex', gap: 2, padding: 6, ...pill }}>
          {FORMES.map(([f, s, n]) => btn(<span style={{ fontSize: 20 }}>{s}</span>, () => setForme(f), n, forme === f))}
        </div>
      )}
      {outil !== 'sélection' && outil !== 'main' && !feuille && outil !== 'forme' && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(80px + env(safe-area-inset-bottom))', zIndex: 19, background: 'rgba(27,27,27,.82)', color: '#fff', fontSize: 13, padding: '6px 12px', borderRadius: 20, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {{ note: 'Touche le tableau pour poser un pense-bête', texte: 'Touche le tableau pour écrire', ligne: 'Glisse d\'un élément à un autre', stylo: 'Dessine avec le doigt', cadre: 'Glisse pour tracer un cadre', commentaire: 'Touche pour placer un commentaire' }[outil]}
        </div>
      )}

      {/* Feuille d'outils (comme Miro) */}
      {feuille && (
        <>
          <div onPointerDown={() => setFeuille(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 40 }} />
          <div role="dialog" aria-label="Ajouter" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, background: '#fff', borderRadius: '22px 22px 0 0', padding: '10px 14px max(18px, env(safe-area-inset-bottom))', maxWidth: 640, margin: '0 auto' }}>
            <div style={{ width: 40, height: 5, borderRadius: 3, background: '#ddd', margin: '0 auto 12px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[['modèles', 'modèles', 'Modèles'], ['texte', 'texte', 'Texte'], ['note', 'note', 'Pense-bête'], ['forme', 'forme', 'Formes'], ['ligne', 'ligne', 'Lignes et flèches'], ['stylo', 'stylo', 'Stylo'], ['cadre', 'cadre', 'Cadre'], ['commentaire', 'commentaire', 'Commentaire'], ['image', 'image', 'Charger']].map(([o, ic, n]) => (
                <button key={o} onClick={() => choisirOutil(o)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 4px', border: 'none', background: 'transparent', borderRadius: 14, cursor: 'pointer', color: UI.texte, fontFamily: grotesk, fontSize: 14 }}>
                  <Ic n={ic} t={30} /> {n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {modèlesOuvert && (
        <div role="dialog" aria-label="Modèles" onPointerDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) setModèlesOuvert(false) }} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 900, maxHeight: '88dvh', overflowY: 'auto', background: '#fff', borderRadius: '22px 22px 0 0', padding: '14px 16px max(20px, env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <strong style={{ flex: 1, fontSize: 20 }}>📋 Modèles</strong>
              {btn('⭐ Enregistrer le mien', enregistrerModèle, 'Enregistrer ce tableau (ou la sélection) comme modèle')}
              {btn('✕', () => setModèlesOuvert(false), 'Fermer')}
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: UI.doux }}>Touche un modèle : il est posé au centre de l'écran, prêt à remplir (touche deux fois un élément pour écrire).</p>
            {[...(data.modèles?.length ? [['⭐ Mes modèles', data.modèles.map(m => ({ ...m, perso: true, emoji: '⭐', description: `${m.éléments.length} éléments` }))]] : []),
              ...[...new Set(MODÈLES_TABLEAU.map(m => m.catégorie))].map(c => [c, MODÈLES_TABLEAU.filter(m => m.catégorie === c)])].map(([cat, liste]) => (
              <section key={cat} style={{ marginBottom: 14 }}>
                <p style={{ margin: '6px 0 8px', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: UI.doux }}>{cat}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {liste.map(m => {
                    const els = m.perso ? m.éléments : m.créer()
                    return (
                      <div key={m.id} style={{ position: 'relative' }}>
                        <button onClick={() => insérerModèle(els)} style={{ width: '100%', textAlign: 'left', border: `1px solid ${UI.bord}`, borderRadius: 14, background: '#fff', padding: 8, cursor: 'pointer', fontFamily: grotesk, color: UI.texte }}>
                          <AperçuModèle éléments={els} />
                          <span style={{ display: 'block', marginTop: 6, fontSize: 14, fontWeight: 700 }}>{m.emoji} {m.nom}</span>
                          <span style={{ display: 'block', fontSize: 12, color: UI.doux, lineHeight: 1.3 }}>{m.description}</span>
                        </button>
                        {m.perso && (
                          <button onClick={() => supprimerModèle(m)} aria-label={`Supprimer le modèle ${m.nom}`} style={{ position: 'absolute', top: 6, right: 6, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.9)', color: '#d33', cursor: 'pointer' }}>✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {message && <div role="status" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(max(12px, env(safe-area-inset-top)) + 70px)', zIndex: 50, background: '#1b1b1b', color: '#fff', padding: '8px 14px', borderRadius: 20, fontSize: 14 }}>{message}</div>}
      <input ref={fichierRef} type="file" accept="image/*" onChange={choisirImage} style={{ display: 'none' }} />
    </div>
  )
}
