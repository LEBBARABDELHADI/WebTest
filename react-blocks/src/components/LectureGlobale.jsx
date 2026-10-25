import { useState, useEffect, useRef, useMemo } from 'react'
import { grotesk, serif } from '../lib/theme'
import { TexteFormaté, texteBrut } from '../lib/texteFormate'
import { normaliser } from '../lib/motsCles'
import BlocCode from './BlocCode'
import { ImageCarte } from './ImageCarte'
import { VueBloc, texteDuBloc } from './SectionsGraphe'

// Mode lecture global d'un graphe : tout le graphe et ses sections lus comme
// un livre. Ordre de lecture : un accueil (sommaire), puis chaque bulle en
// profondeur (une idée, puis ses sous-idées), avec la fiche de sous-section
// qui lui est reliée ; enfin les fiches qui ne sont reliées à aucune bulle.
// Plan latéral (tiroir sur téléphone), recherche dans tout le contenu,
// fil d'Ariane, sous-bulles et « voir aussi » cliquables, progression,
// reprise là où on s'était arrêté, clavier (← → ↑ ↓, /, Échap) et
// balayage sur téléphone.

const CLÉ_TAILLE = 'react-blocs-lecture-taille'
const clésPosition = id => `react-blocs-lecture-globale-${id}`
const lire = (clé, défaut) => { try { return localStorage.getItem(clé) ?? défaut } catch { return défaut } }
const écrire = (clé, v) => { try { localStorage.setItem(clé, v) } catch { /* ignore */ } }

function useLarge() {
  const [large, setLarge] = useState(() => window.matchMedia('(min-width: 900px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(min-width: 900px)')
    const f = () => setLarge(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return large
}

// Construit les pages dans l'ordre de lecture.
function construirePages(noeuds, colonnes) {
  const ids = new Set(noeuds.map(n => n.id))
  const enfants = new Map()
  noeuds.forEach(n => {
    const p = n.parentId && ids.has(n.parentId) ? n.parentId : null
    if (!enfants.has(p)) enfants.set(p, [])
    enfants.get(p).push(n)
  })
  enfants.forEach(l => l.sort((a, b) => a.y - b.y || a.x - b.x))
  const ficheDeBulle = new Map()
  colonnes.forEach(c => c.sousSections.forEach(ss => { if (ss.bulleId && ids.has(ss.bulleId)) ficheDeBulle.set(ss.bulleId, { ss, colonne: c }) }))

  const pages = [{ clé: 'accueil', type: 'accueil', profondeur: 0 }]
  const vues = new Set()
  const parcourir = (n, profondeur) => {
    if (vues.has(n.id)) return
    vues.add(n.id)
    pages.push({ clé: `b:${n.id}`, type: 'bulle', n, profondeur, fiche: ficheDeBulle.get(n.id) || null })
    ;(enfants.get(n.id) || []).forEach(e => parcourir(e, profondeur + 1))
  }
  ;(enfants.get(null) || []).forEach(r => parcourir(r, 0))
  colonnes.forEach(c => c.sousSections.forEach(ss => {
    if (!(ss.bulleId && ids.has(ss.bulleId))) pages.push({ clé: `s:${ss.id}`, type: 'fiche', ss, colonne: c, profondeur: 0 })
  }))
  return { pages, enfants, ficheDeBulle }
}

const titreDe = p => (p.type === 'accueil' ? 'Sommaire' : p.type === 'fiche' ? p.ss.titre : texteBrut(p.n.texte).split('\n')[0] || '(bulle sans texte)')

// Tout le texte d'une page, pour la recherche.
function texteDePage(p) {
  if (p.type === 'accueil') return ''
  const fiche = p.type === 'fiche' ? p : p.fiche
  const blocs = fiche ? `${fiche.ss.titre} ${fiche.ss.blocs.map(texteDuBloc).join(' ')}` : ''
  return `${p.type === 'bulle' ? `${texteBrut(p.n.texte)} ${p.n.code || ''}` : ''} ${blocs}`
}

// Le graphe à côté de la lecture : en lecture seule, la bulle lue est mise en
// évidence et la vue se cadre sur elle, son parent et ses sous-idées (ou sur
// tout le graphe). Toucher une bulle ouvre sa page.
const TAILLE_DÉFAUT = { l: 160, h: 48 }
function VueGraphe({ T, noeuds, liens, tailleDe, actuelId, vues, avecFiche, onChoisir }) {
  const [toutVoir, setToutVoir] = useState(false)
  const taille = id => tailleDe?.(id) || TAILLE_DÉFAUT
  const parId = useMemo(() => new Map(noeuds.map(n => [n.id, n])), [noeuds])
  const boîte = liste => {
    const xs = liste.flatMap(n => { const t = taille(n.id); return [n.x - t.l / 2, n.x + t.l / 2] })
    const ys = liste.flatMap(n => { const t = taille(n.id); return [n.y - t.h / 2, n.y + t.h / 2] })
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
  }
  const cible = useMemo(() => {
    if (!noeuds.length) return { x: 0, y: 0, l: 100, h: 100 }
    const actuel = actuelId && parId.get(actuelId)
    const liste = toutVoir || !actuel ? noeuds : [actuel, parId.get(actuel.parentId), ...noeuds.filter(n => n.parentId === actuel.id)].filter(Boolean)
    const b = boîte(liste)
    const marge = toutVoir || !actuel ? 40 : 90
    let l = b.x1 - b.x0 + 2 * marge
    let h = b.y1 - b.y0 + 2 * marge
    const minL = toutVoir || !actuel ? 0 : 520
    const minH = toutVoir || !actuel ? 0 : 340
    const cx = (b.x0 + b.x1) / 2
    const cy = (b.y0 + b.y1) / 2
    l = Math.max(l, minL); h = Math.max(h, minH)
    return { x: cx - l / 2, y: cy - h / 2, l, h }
  }, [noeuds, actuelId, toutVoir]) // eslint-disable-line react-hooks/exhaustive-deps
  // Glissement doux de la vue vers la nouvelle cible.
  const [vue, setVue] = useState(cible)
  const vueRef = useRef(cible)
  useEffect(() => {
    const départ = vueRef.current
    const t0 = performance.now()
    let raf
    const pas = t => {
      const k = Math.min(1, (t - t0) / 380)
      const e = 1 - (1 - k) ** 3
      const v = { x: départ.x + (cible.x - départ.x) * e, y: départ.y + (cible.y - départ.y) * e, l: départ.l + (cible.l - départ.l) * e, h: départ.h + (cible.h - départ.h) * e }
      vueRef.current = v
      setVue(v)
      if (k < 1) raf = requestAnimationFrame(pas)
    }
    raf = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(raf)
  }, [cible])

  const ids = new Set(noeuds.map(n => n.id))
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: T.bg, overflow: 'hidden' }}>
      <svg viewBox={`${vue.x} ${vue.y} ${vue.l} ${vue.h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}
        role="img" aria-label="Graphe : toucher une bulle pour lire sa page">
        {noeuds.filter(n => n.parentId && ids.has(n.parentId)).map(n => {
          const p = parId.get(n.parentId)
          const mx = (p.x + n.x) / 2
          return <path key={`b${n.id}`} d={`M${p.x},${p.y} C${mx},${p.y} ${mx},${n.y} ${n.x},${n.y}`} fill="none" stroke={n.couleur || p.couleur || T.textMuted} strokeOpacity={0.55} strokeWidth={2} />
        })}
        {liens.filter(l => parId.has(l.de) && parId.has(l.vers)).map(l => {
          const a = parId.get(l.de), z = parId.get(l.vers)
          return <line key={`l${l.id}`} x1={a.x} y1={a.y} x2={z.x} y2={z.y} stroke={T.accent} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 6" />
        })}
        {noeuds.map(n => {
          const t = taille(n.id)
          const racine = !n.parentId || !ids.has(n.parentId)
          const actuel = n.id === actuelId
          const couleur = n.couleur || (racine ? T.accent : T.border)
          return (
            <g key={n.id} onClick={() => onChoisir(n.id)} style={{ cursor: 'pointer' }}>
              {actuel && <rect x={n.x - t.l / 2 - 8} y={n.y - t.h / 2 - 8} width={t.l + 16} height={t.h + 16} rx={18} fill={T.accent} opacity={0.25} />}
              <rect x={n.x - t.l / 2} y={n.y - t.h / 2} width={t.l} height={t.h} rx={12}
                fill={racine ? couleur : T.surface} stroke={actuel ? T.accent : couleur} strokeWidth={actuel ? 4 : 2}
                opacity={actuelId && !actuel && !vues.has(`b:${n.id}`) ? 0.85 : 1} />
              <foreignObject x={n.x - t.l / 2 + 6} y={n.y - t.h / 2 + 4} width={Math.max(10, t.l - 12)} height={Math.max(10, t.h - 8)} style={{ pointerEvents: 'none' }}>
                <div style={{
                  height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  fontFamily: grotesk, fontSize: racine ? '15px' : '13px', fontWeight: racine || actuel ? 700 : 500, lineHeight: 1.25,
                  color: racine ? '#1b1b1b' : T.text, overflow: 'hidden', wordBreak: 'break-word',
                }}>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: Math.max(1, Math.floor((t.h - 8) / 17)), WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.icone ? `${n.icone} ` : ''}{texteBrut(n.texte)}
                  </span>
                </div>
              </foreignObject>
              {avecFiche.has(n.id) && <text x={n.x + t.l / 2 - 4} y={n.y - t.h / 2 + 4} fontSize="16" textAnchor="middle">📑</text>}
              {vues.has(`b:${n.id}`) && !actuel && <circle cx={n.x - t.l / 2 + 2} cy={n.y - t.h / 2 + 2} r={5} fill={T.accent} />}
            </g>
          )
        })}
      </svg>
      <button onClick={() => setToutVoir(v => !v)} aria-pressed={toutVoir} style={{
        position: 'absolute', right: '10px', bottom: '10px', padding: '7px 12px', borderRadius: '20px', border: `1px solid ${T.border}`,
        background: T.surface, color: T.text, fontFamily: grotesk, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
      }}>{toutVoir ? '🎯 Centrer sur la bulle' : '🗺️ Tout le graphe'}</button>
    </div>
  )
}

export default function LectureGlobale({ T, nom, grapheId, noeuds, liens = [], colonnes, départ, onFermer, onVoirBulle, onChangerColonnes, tailleDe }) {
  const large = useLarge()
  const { pages, enfants } = useMemo(() => construirePages(noeuds, colonnes), [noeuds, colonnes])
  const indexDe = useMemo(() => new Map(pages.map((p, i) => [p.clé, i])), [pages])
  const parId = useMemo(() => new Map(noeuds.map(n => [n.id, n])), [noeuds])
  const [i, setI] = useState(() => {
    const clé = départ ? `b:${départ}` : lire(clésPosition(grapheId), 'accueil')
    return Math.max(0, pages.findIndex(p => p.clé === clé))
  })
  const page = pages[Math.min(i, pages.length - 1)]
  const [vues, setVues] = useState(() => new Set())
  const [planOuvert, setPlanOuvert] = useState(false)
  const [grapheVisible, setGrapheVisible] = useState(() => noeuds.length > 0 && lire('react-blocs-lecture-graphe', 'oui') === 'oui')
  const basculerGraphe = () => setGrapheVisible(v => { écrire('react-blocs-lecture-graphe', v ? 'non' : 'oui'); return !v })
  // Sur ordinateur : le plan est une colonne, sauf quand le graphe occupe la
  // place (il passe alors dans un tiroir ☰, comme sur téléphone).
  const planEnColonne = large && !grapheVisible
  const [recherche, setRecherche] = useState('')
  const [échelle, setÉchelle] = useState(() => Number(lire(CLÉ_TAILLE, '1')) || 1)
  const fenêtreRef = useRef(null)
  const articleRef = useRef(null)
  const rechercheRef = useRef(null)
  const planRef = useRef(null)
  const toucheRef = useRef(null)

  useEffect(() => {
    setVues(v => (v.has(page.clé) ? v : new Set([...v, page.clé])))
    écrire(clésPosition(grapheId), page.clé)
    articleRef.current?.scrollTo?.(0, 0)
    planRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
    // Le bouton touché a pu disparaître avec l'ancienne page : on garde le
    // focus dans la lecture.
    if (!fenêtreRef.current?.contains(document.activeElement)) fenêtreRef.current?.focus()
  }, [page.clé, grapheId])
  useEffect(() => { fenêtreRef.current?.focus() }, [])

  const aller = clé => {
    const k = indexDe.get(clé)
    if (k == null) return
    setI(k)
    if (!planEnColonne) setPlanOuvert(false)
  }
  const précédente = pages[i - 1]
  const suivante = pages[i + 1]
  const parent = page.type === 'bulle' && page.n.parentId && parId.get(page.n.parentId)
  const premierEnfant = page.type === 'bulle' && (enfants.get(page.n.id) || [])[0]
  const changerTaille = delta => setÉchelle(é => {
    const v = Math.round(Math.min(2, Math.max(0.8, é + delta)) * 100) / 100
    écrire(CLÉ_TAILLE, String(v))
    return v
  })

  // Écoute au niveau de la fenêtre, en premier (capture) : le clavier marche
  // même quand le bouton touché a disparu avec la page, et les raccourcis du
  // graphe (Suppr, flèches…) ne s'appliquent pas derrière la lecture.
  const toucheRef2 = useRef(null)
  toucheRef2.current = e => {
    const dansChamp = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
    if (e.key === 'Escape') {
      e.preventDefault()
      if (dansChamp && recherche) { setRecherche(''); return }
      if (planOuvert && !planEnColonne) { setPlanOuvert(false); return }
      onFermer()
      return
    }
    if (dansChamp) return
    if (e.key === 'ArrowRight' && suivante) { e.preventDefault(); setI(i + 1) }
    else if (e.key === 'ArrowLeft' && précédente) { e.preventDefault(); setI(i - 1) }
    else if (e.key === 'ArrowUp' && parent && e.altKey) { e.preventDefault(); aller(`b:${parent.id}`) }
    else if (e.key === 'ArrowDown' && premierEnfant && e.altKey) { e.preventDefault(); aller(`b:${premierEnfant.id}`) }
    else if (e.key === '/') { e.preventDefault(); setPlanOuvert(true); setTimeout(() => rechercheRef.current?.focus(), 50) }
  }
  useEffect(() => {
    const f = e => {
      toucheRef2.current(e)
      // Rien ne passe au graphe derrière, sauf Ctrl/⌘ (annuler, copier…).
      if (!e.ctrlKey && !e.metaKey) e.stopPropagation()
    }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [])
  // Balayage horizontal sur téléphone : page suivante / précédente.
  const débutTouche = e => { const t = e.touches[0]; toucheRef.current = { x: t.clientX, y: t.clientY } }
  const finTouche = e => {
    const d = toucheRef.current
    toucheRef.current = null
    if (!d) return
    const t = e.changedTouches[0]
    const dx = t.clientX - d.x
    const dy = t.clientY - d.y
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      if (dx < 0 && suivante) setI(i + 1)
      if (dx > 0 && précédente) setI(i - 1)
    }
  }

  const majBloc = (ssId, blocId, fn) => onChangerColonnes?.(cols => cols.map(c => ({
    ...c, sousSections: c.sousSections.map(s => (s.id === ssId ? { ...s, blocs: s.blocs.map(b => (b.id === blocId ? fn(b) : b)) } : s)),
  })))

  // ---------- Recherche dans tout le contenu ----------
  const q = normaliser(recherche.trim())
  const résultats = q ? pages.filter(p => p.type !== 'accueil' && normaliser(texteDePage(p)).includes(q)).slice(0, 60) : []
  const extrait = p => {
    const brut = texteDePage(p).replace(/\s+/g, ' ')
    const k = normaliser(brut).indexOf(q)
    if (k < 0) return ''
    return `${k > 30 ? '…' : ''}${brut.slice(Math.max(0, k - 30), k + q.length + 50)}…`
  }

  const avecFiche = useMemo(() => new Set(pages.filter(p => p.fiche).map(p => p.n.id)), [pages])
  const nbBulles = pages.filter(p => p.type === 'bulle').length
  const nbFiches = pages.filter(p => p.fiche || p.type === 'fiche').length
  const fs = n => `${n * échelle}px`
  const bouton = (actif = true) => ({
    minWidth: '38px', height: '38px', borderRadius: '11px', border: `1px solid ${T.border}`, background: T.surface, color: T.text,
    cursor: actif ? 'pointer' : 'default', opacity: actif ? 1 : 0.35, fontSize: '14px', fontWeight: 700, fontFamily: grotesk, padding: '0 9px', flexShrink: 0,
  })
  const pastille = {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '20px', cursor: 'pointer', fontFamily: grotesk,
    fontSize: fs(12.5), fontWeight: 600, background: T.surface, border: `1px solid ${T.border}`, color: T.text, maxWidth: '100%',
  }
  const résumé = n => {
    const nb = (enfants.get(n.id) || []).length
    const fiche = pages[indexDe.get(`b:${n.id}`)]?.fiche
    return [nb ? `${nb} sous-idée${nb > 1 ? 's' : ''}` : '', fiche ? '📑 fiche' : '', n.image ? '🖼️' : '', n.code ? '</>' : ''].filter(Boolean).join(' · ')
  }

  // ---------- Plan (barre latérale / tiroir) ----------
  const plan = (
    <nav ref={planRef} aria-label="Plan de lecture" style={{
      display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: T.surface,
      borderRight: `1px solid ${T.border}`, width: planEnColonne ? '300px' : 'min(86vw, 340px)', flexShrink: 0,
    }}>
      <div style={{ padding: '12px', borderBottom: `1px solid ${T.border}` }}>
        <input
          ref={rechercheRef}
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher dans tout le graphe…"
          aria-label="Rechercher dans le graphe et les sections"
          style={{ width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '9px 11px', fontSize: '14px', outline: 'none' }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 20px' }}>
        {q ? (
          résultats.length === 0
            ? <p style={{ color: T.textMuted, fontSize: '13px', padding: '10px' }}>Aucun résultat.</p>
            : résultats.map(p => (
              <button key={p.clé} onClick={() => aller(p.clé)} style={{
                display: 'block', width: '100%', textAlign: 'left', background: p.clé === page.clé ? `${T.accent}22` : 'transparent', border: 'none',
                borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', fontFamily: grotesk, color: T.text,
              }}>
                <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 700 }}>{p.type === 'fiche' ? '📑 ' : ''}{titreDe(p)}</span>
                <span style={{ display: 'block', fontSize: '12px', color: T.textMuted, lineHeight: 1.4 }}>{extrait(p)}</span>
              </button>
            ))
        ) : pages.map((p, k) => (
          <div key={p.clé}>
            {p.type === 'fiche' && pages[k - 1]?.type !== 'fiche' && (
              <p style={{ margin: '14px 10px 4px', fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, fontFamily: grotesk }}>Autres fiches</p>
            )}
            <button onClick={() => aller(p.clé)} aria-current={p.clé === page.clé ? 'page' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: grotesk,
              background: p.clé === page.clé ? `${T.accent}26` : 'transparent', color: p.clé === page.clé ? T.text : vues.has(p.clé) ? T.textMuted : T.text,
              borderRadius: '7px', padding: `6px 8px 6px ${8 + Math.min(p.profondeur, 6) * 14}px`,
              fontSize: p.profondeur === 0 ? '13.5px' : '13px', fontWeight: p.profondeur === 0 || p.type === 'accueil' ? 700 : 500,
              borderLeft: p.clé === page.clé ? `3px solid ${T.accent}` : '3px solid transparent',
            }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.type === 'accueil' ? '🏠 ' : p.type === 'fiche' ? '📑 ' : ''}{titreDe(p)}
              </span>
              {p.fiche && <span title="Fiche reliée" style={{ fontSize: '11px' }}>📑</span>}
              {vues.has(p.clé) && p.clé !== page.clé && <span aria-label="lue" style={{ fontSize: '10px', color: T.accent }}>✓</span>}
            </button>
          </div>
        ))}
      </div>
    </nav>
  )

  // ---------- Contenu de la page ----------
  const fiche = page.type === 'fiche' ? page : page.fiche
  const blocsFiche = fiche && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: fs(12) }}>
      {fiche.ss.blocs.length === 0 && <p style={{ color: T.textMuted, fontStyle: 'italic', margin: 0 }}>Fiche vide.</p>}
      {fiche.ss.blocs.map(b => <VueBloc key={b.id} T={T} bloc={b} lecture échelle={échelle} majBloc={fn => majBloc(fiche.ss.id, b.id, fn)} />)}
    </div>
  )
  const ancêtres = []
  if (page.type === 'bulle') for (let p = parId.get(page.n.parentId); p && ancêtres.length < 8 && !ancêtres.includes(p); p = parId.get(p.parentId)) ancêtres.unshift(p)
  const voirAussi = page.type === 'bulle'
    ? liens.filter(l => (l.de === page.n.id || l.vers === page.n.id) && parId.has(l.de) && parId.has(l.vers)).map(l => ({ l, autre: parId.get(l.de === page.n.id ? l.vers : l.de) }))
    : []
  const enfantsPage = page.type === 'bulle' ? enfants.get(page.n.id) || [] : []
  // Idée sans sous-idée : on montre ses voisines (même parent) pour le contexte.
  const voisines = page.type === 'bulle' && enfantsPage.length === 0 && parent ? enfants.get(parent.id) || [] : []

  let contenu
  if (page.type === 'accueil') {
    const racines = enfants.get(null) || []
    const autres = pages.filter(p => p.type === 'fiche')
    contenu = (
      <>
        <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontSize: fs(12), fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.accent }}>Lecture du graphe</p>
        <h1 style={{ margin: '0 0 8px', fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: fs(34), lineHeight: 1.15, color: T.text }}>{nom}</h1>
        <p style={{ margin: '0 0 22px', color: T.textMuted, fontFamily: grotesk, fontSize: fs(14) }}>
          {nbBulles} idée{nbBulles > 1 ? 's' : ''} · {nbFiches} fiche{nbFiches > 1 ? 's' : ''}{vues.size > 1 ? ` · ${vues.size - 1} page${vues.size > 2 ? 's' : ''} lue${vues.size > 2 ? 's' : ''}` : ''}
        </p>
        {suivante && (
          <button onClick={() => setI(1)} style={{ ...pastille, background: T.accent, color: T.accentText, border: 'none', fontSize: fs(15), fontWeight: 800, padding: '11px 18px', marginBottom: '26px' }}>
            Commencer la lecture →
          </button>
        )}
        {racines.length > 0 && (
          <>
            <h2 style={{ fontFamily: grotesk, fontSize: fs(13), fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px' }}>Les grandes idées</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '26px' }}>
              {racines.map(r => (
                <button key={r.id} onClick={() => aller(`b:${r.id}`)} style={{
                  textAlign: 'left', background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${r.couleur || T.accent}`, borderRadius: '12px',
                  padding: '12px 14px', cursor: 'pointer', fontFamily: grotesk, color: T.text,
                }}>
                  <span style={{ display: 'block', fontSize: fs(15), fontWeight: 700, lineHeight: 1.3 }}>{r.icone ? `${r.icone} ` : ''}{texteBrut(r.texte)}</span>
                  <span style={{ display: 'block', fontSize: fs(12), color: T.textMuted, marginTop: '4px' }}>{résumé(r) || '—'}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {autres.length > 0 && (
          <>
            <h2 style={{ fontFamily: grotesk, fontSize: fs(13), fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px' }}>Fiches des sections</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {autres.map(p => <button key={p.clé} onClick={() => aller(p.clé)} style={pastille}>📑 <span style={{ color: T.textMuted }}>{p.colonne.titre} ›</span> {p.ss.titre}</button>)}
            </div>
          </>
        )}
      </>
    )
  } else {
    contenu = (
      <>
        {/* Fil d'Ariane */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginBottom: '10px', fontFamily: grotesk, fontSize: fs(12.5) }}>
          <button onClick={() => aller('accueil')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.accent, fontWeight: 700, fontSize: 'inherit', fontFamily: 'inherit' }}>🏠 {nom}</button>
          {page.type === 'fiche' && <span style={{ color: T.textMuted }}>› {page.colonne.titre}</span>}
          {ancêtres.map(a => (
            <span key={a.id} style={{ display: 'inline-flex', gap: '4px', minWidth: 0 }}>
              <span style={{ color: T.textMuted }}>›</span>
              <button onClick={() => aller(`b:${a.id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.text, fontSize: 'inherit', fontFamily: 'inherit', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{texteBrut(a.texte)}</button>
            </span>
          ))}
        </div>

        {page.type === 'bulle' ? (
          <>
            <h1 style={{
              margin: '0 0 14px', fontFamily: grotesk, fontSize: fs(page.profondeur === 0 ? 28 : 24), lineHeight: 1.25, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              borderLeft: `5px solid ${page.n.couleur || T.accent}`, paddingLeft: '12px',
            }}>
              {page.n.icone && <span style={{ marginRight: '8px' }}>{page.n.icone}</span>}
              <TexteFormaté texte={page.n.texte || ''} couleurDéfaut={T.text} />
            </h1>
            {page.n.image && <ImageCarte image={page.n.image} hauteurMax={Math.round(420 * échelle)} style={{ margin: '0 0 14px' }} />}
            {page.n.code && <div style={{ margin: '0 0 14px' }}><BlocCode code={page.n.code} langage={page.n.langage} taille={12.5 * échelle} /></div>}
            {page.fiche && (
              <section aria-label="Fiche reliée" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: `${12 * échelle}px ${16 * échelle}px`, margin: '0 0 18px' }}>
                <p style={{ margin: '0 0 10px', fontFamily: grotesk, fontSize: fs(12), fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>
                  📑 {page.fiche.colonne.titre} › <span style={{ color: T.text }}>{page.fiche.ss.titre}</span>
                </p>
                {blocsFiche}
              </section>
            )}
            {voirAussi.length > 0 && (
              <div style={{ margin: '0 0 18px' }}>
                <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontSize: fs(12), fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>Voir aussi</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {voirAussi.map(({ l, autre }) => (
                    <button key={l.id} onClick={() => aller(`b:${autre.id}`)} style={pastille}>
                      <span style={{ color: T.accent }}>{l.sens === 'deux' ? '↔' : l.de === page.n.id ? '→' : '←'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{texteBrut(autre.texte)}</span>
                      {l.texte && <span style={{ color: T.textMuted, fontStyle: 'italic' }}>({l.texte})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {enfantsPage.length > 0 && (
              <div style={{ margin: '0 0 18px' }}>
                <p style={{ margin: '0 0 8px', fontFamily: grotesk, fontSize: fs(12), fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>
                  Sous-idées ({enfantsPage.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {enfantsPage.map(e => (
                    <button key={e.id} onClick={() => aller(`b:${e.id}`)} style={{
                      textAlign: 'left', background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${e.couleur || T.border}`,
                      borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', fontFamily: grotesk, color: T.text,
                    }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: fs(14), fontWeight: 600, lineHeight: 1.35 }}>
                        {e.icone ? `${e.icone} ` : ''}{texteBrut(e.texte)}
                      </span>
                      {résumé(e) && <span style={{ display: 'block', fontSize: fs(11.5), color: T.textMuted, marginTop: '4px' }}>{résumé(e)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {voisines.length > 1 && (
              <div style={{ margin: '0 0 18px' }}>
                <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontSize: fs(12), fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>
                  Dans « {texteBrut(parent.texte).slice(0, 40)} »
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {voisines.map((v, k) => (
                    <button key={v.id} onClick={() => aller(`b:${v.id}`)} aria-current={v.id === page.n.id ? 'true' : undefined} style={{
                      ...pastille, borderRadius: '9px', justifyContent: 'flex-start', textAlign: 'left',
                      background: v.id === page.n.id ? `${T.accent}26` : T.surface, borderColor: v.id === page.n.id ? T.accent : T.border,
                    }}>
                      <span style={{ color: T.textMuted, fontWeight: 700 }}>{k + 1}.</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{texteBrut(v.texte)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {onVoirBulle && (
              <button onClick={() => onVoirBulle(page.n.id)} style={{ ...pastille, background: 'transparent' }}>Voir dans le graphe ↗</button>
            )}
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 16px', fontFamily: grotesk, fontSize: fs(26), lineHeight: 1.25, color: T.text }}>📑 {page.ss.titre}</h1>
            {blocsFiche}
          </>
        )}
      </>
    )
  }

  const navBas = (
    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
      {[précédente && { p: précédente, sens: -1 }, suivante && { p: suivante, sens: 1 }].map((x, k) => (x ? (
        <button key={k} onClick={() => setI(i + x.sens)} style={{
          flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: '14px', border: `1px dashed ${T.border}`, background: 'transparent', cursor: 'pointer',
          color: T.textMuted, fontFamily: grotesk, fontSize: '13px', textAlign: x.sens < 0 ? 'left' : 'right',
        }}>
          {x.sens < 0 ? '‹ Précédent' : 'Suivant ›'}
          <strong style={{ display: 'block', color: T.text, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titreDe(x.p)}</strong>
        </button>
      ) : <span key={k} style={{ flex: 1 }} />))}
    </div>
  )

  return (
    <div role="dialog" aria-modal="true" aria-label={`Lecture : ${nom}`} ref={fenêtreRef} tabIndex={-1}
      style={{ position: 'fixed', inset: 0, zIndex: 1400, background: T.bg, display: 'flex', flexDirection: 'column', outline: 'none' }}>
      {/* Barre du haut */}
      <div style={{ flexShrink: 0, borderBottom: `1px solid ${T.border}`, background: T.bg, padding: 'max(8px, env(safe-area-inset-top)) 10px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!planEnColonne && <button onClick={() => setPlanOuvert(o => !o)} aria-expanded={planOuvert} aria-label="Plan et recherche" style={bouton()}>☰</button>}
          <span style={{ flex: 1, minWidth: 0, fontFamily: grotesk, fontSize: '13px', color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <strong style={{ color: T.text }}>{nom}</strong> · {i + 1}/{pages.length}
          </span>
          <button onClick={() => précédente && setI(i - 1)} disabled={!précédente} aria-label="Page précédente" style={bouton(!!précédente)}>‹</button>
          <button onClick={() => suivante && setI(i + 1)} disabled={!suivante} aria-label="Page suivante" style={bouton(!!suivante)}>›</button>
          {large && <button onClick={() => changerTaille(-0.1)} aria-label="Texte plus petit" style={bouton(échelle > 0.8)}>A−</button>}
          {large && <button onClick={() => changerTaille(0.1)} aria-label="Texte plus grand" style={bouton(échelle < 2)}>A+</button>}
          {noeuds.length > 0 && (
            <button onClick={basculerGraphe} aria-pressed={grapheVisible} aria-label={grapheVisible ? 'Masquer le graphe' : 'Afficher le graphe à côté'} title={grapheVisible ? 'Masquer le graphe' : 'Graphe et lecture ensemble'}
              style={{ ...bouton(), ...(grapheVisible ? { background: `${T.accent}26`, borderColor: T.accent } : {}) }}>🗺️</button>
          )}
          <button onClick={onFermer} aria-label="Fermer la lecture" style={bouton()}>✕</button>
        </div>
        <div aria-hidden="true" style={{ height: '3px', borderRadius: '2px', background: T.surface, marginTop: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${((i + 1) / pages.length) * 100}%`, height: '100%', background: T.accent, transition: 'width .25s' }} />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: large ? 'row' : 'column', position: 'relative' }}>
        {planEnColonne && plan}
        {grapheVisible && (
          <div style={{
            flexShrink: 0, ...(large ? { width: '50%', borderRight: `1px solid ${T.border}` } : { height: '36vh', borderBottom: `1px solid ${T.border}` }),
          }}>
            <VueGraphe T={T} noeuds={noeuds} liens={liens} tailleDe={tailleDe} actuelId={page.type === 'bulle' ? page.n.id : null}
              vues={vues} avecFiche={avecFiche} onChoisir={id => aller(`b:${id}`)} />
          </div>
        )}
        {!planEnColonne && planOuvert && (
          <>
            <div onClick={() => setPlanOuvert(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 3, display: 'flex', boxShadow: '0 0 40px rgba(0,0,0,.5)' }}>{plan}</div>
          </>
        )}
        <div ref={articleRef} onTouchStart={débutTouche} onTouchEnd={finTouche} style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <article style={{ maxWidth: '780px', margin: '0 auto', padding: `22px 18px max(40px, env(safe-area-inset-bottom))`, fontSize: fs(15), lineHeight: 1.6, color: T.text }}>
            {!large && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', margin: '-8px 0 8px' }}>
                <button onClick={() => changerTaille(-0.1)} aria-label="Texte plus petit" style={{ ...bouton(échelle > 0.8), height: '32px', minWidth: '34px' }}>A−</button>
                <button onClick={() => changerTaille(0.1)} aria-label="Texte plus grand" style={{ ...bouton(échelle < 2), height: '32px', minWidth: '34px' }}>A+</button>
              </div>
            )}
            {contenu}
            {navBas}
            {large && (
              <p style={{ marginTop: '18px', fontSize: '11.5px', color: T.textMuted, textAlign: 'center', fontFamily: grotesk }}>
                ← → page précédente / suivante · Alt + ↑ idée parente · Alt + ↓ première sous-idée · / rechercher · Échap fermer
              </p>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
