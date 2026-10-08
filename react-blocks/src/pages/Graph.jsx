import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import donnéesPerso from '../data/graph-perso.json'
import donnéesPro from '../data/graph-pro.json'
import donnéesIdrissiPerso from '../data/graph-idrissi-perso.json'
import donnéesIdrissiPro from '../data/graph-idrissi-pro.json'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import PanneauSync from '../components/PanneauSync'
import { ImageCarte, ChampImage, adresseImage } from '../components/ImageCarte'
import CodeBlock from '../components/CodeBlock'
import SectionsGraphe from '../components/SectionsGraphe'
import { grotesk, serif, PALETTE, useTheme, useThemeMode } from '../lib/theme'
import { TexteFormaté, texteBrut } from '../lib/texteFormate'
import { normaliser } from '../lib/motsCles'
import { FOYERS, espacesPourTousLesFoyers } from '../lib/foyers'
import { useDonnéesSynchronisées } from '../lib/synchro'
import { listerVersions, lireVersion } from '../lib/githubSync'
import {
  ÉCART_X, ÉCART_Y, compléterGraphes, uid, descendants, bullesCachées, ancêtres, ranger,
  géométrieLien, MODÈLES, ÉTIQUETTES_LIENS, FORMES, ICÔNES, CHEMIN_NUAGE, ordrePrésentation, TRACÉS,
  TAILLES_BULLES, facteurTaille, planTexte, analyserPlan, copierBranches, dupliquerCopie, aligner, séparateursArbres,
} from '../lib/graphe'
import { exporterGraphePNG } from '../lib/exportGraphe'

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

const ZOOM_MIN = 0.25
const ZOOM_MAX = 2.5
const SEUIL_GLISSER = 6
const HISTORIQUE_MAX = 60
const TAILLE_PAR_DÉFAUT = { l: 120, h: 44 }
// Presse-papiers des bulles : dans le navigateur, donc partagé entre les
// graphes, Perso/Pro et les deux Home.
const CLÉ_PRESSE_PAPIERS = 'react-blocs-graph-presse-papiers'
function lirePressePapiers() {
  try { return JSON.parse(localStorage.getItem(CLÉ_PRESSE_PAPIERS)) } catch { return null }
}
const SENS = [['aucun', '—', 'Sans flèche'], ['vers', '→', 'Flèche vers la 2ᵉ bulle'], ['inverse', '←', 'Flèche vers la 1ʳᵉ bulle'], ['deux', '↔', 'Flèche dans les deux sens']]

const ANIMATIONS = `
@keyframes trouvée { 0%, 100% { box-shadow: 0 0 0 4px #ffd60a99, 0 0 22px #ffd60a } 50% { box-shadow: 0 0 0 9px #ffd60a33, 0 0 4px #ffd60a } }
@keyframes trouvéeNuage { 0%, 100% { filter: drop-shadow(0 0 10px #ffd60a) } 50% { filter: drop-shadow(0 0 2px #ffd60a) } }
@keyframes apparition { from { opacity: 0; transform: translate(-50%, -50%) scale(.3) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
@keyframes tracer { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes fondu { from { opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .bulle-trouvee, .anime { animation: none !important } }
`

export default function Graph() {
  const { espace: espaceParam } = useParams()
  const config = ESPACES[espaceParam] || ESPACES.perso
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const { data, setData, token, statut, erreur, connecter, déconnecter } = useDonnéesSynchronisées(config, compléterGraphes)

  const cléActif = `react-blocs-graph-actif-${config.id}`
  const [grapheId, setGrapheId] = useState(() => localStorage.getItem(cléActif))
  const graphe = data.graphes.find(g => g.id === grapheId) || data.graphes[0] || null
  const noeuds = graphe?.noeuds || []
  const liens = graphe?.liens || []

  const [vue, setVue] = useState({ x: 0, y: 0, zoom: 1 })
  const [sélection, setSélection] = useState(null)
  const [édition, setÉdition] = useState(null) // { type: 'bulle' | 'lien', id, texte, image? }
  const [rattachement, setRattachement] = useState(false)
  const [liaison, setLiaison] = useState(false)
  const [tracéLiaison, setTracéLiaison] = useState('courbe') // tracé des nouveaux liens
  const [traitChoisi, setTraitChoisi] = useState(null) // { type: 'lien' | 'branche', id }
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [agrandi, setAgrandi] = useState(false)
  const [message, setMessage] = useState(null) // { texte, erreur }
  const [création, setCréation] = useState(false)
  const [recherche, setRecherche] = useState(null) // { q, index } (null = fermée)
  const [exportÉtat, setExportÉtat] = useState(null) // { enCours } | { url, blob, nom }
  const [tailles, setTailles] = useState({})
  const [présentation, setPrésentation] = useState(null) // { étape } (null = mode édition)
  const [transitionVue, setTransitionVue] = useState(false)
  const [multi, setMulti] = useState([]) // sélection de plusieurs bulles (ids)
  const [cadre, setCadre] = useState(null) // rectangle de sélection en cours { x0, y0, x1, y1 } (écran)
  const [modeCadre, setModeCadre] = useState(false) // au doigt : glisser trace un cadre
  const [agrandie, setAgrandie] = useState(null)
  const [pressePapiersPlein, setPressePapiersPlein] = useState(() => !!lirePressePapiers())
  const [dialoguePlan, setDialoguePlan] = useState(null) // 'voir' | 'coller'
  const [versionsOuvertes, setVersionsOuvertes] = useState(false) // id de la bulle dont on regarde l'image / le code en grand
  const [, setVersionHistorique] = useState(0)

  const zoneRef = useRef(null)
  const pointeursRef = useRef(new Map())
  const gesteRef = useRef(null)
  const vueRef = useRef(vue)
  vueRef.current = vue
  const dataRef = useRef(data)
  dataRef.current = data
  const historiqueRef = useRef({ passé: [], futur: [] })
  const élémentsRef = useRef(new Map())
  const observateurRef = useRef(null)

  useEffect(() => {
    if (graphe) { try { localStorage.setItem(cléActif, graphe.id) } catch { /* ignore */ } }
  }, [graphe?.id, cléActif])

  // ---------- Tailles réelles des bulles (pour couper les liens au bord et pour l'export) ----------
  useEffect(() => {
    const mesurer = () => {
      const nouvelles = {}
      élémentsRef.current.forEach((el, id) => { nouvelles[id] = { l: el.offsetWidth, h: el.offsetHeight } })
      setTailles(avant => {
        const clés = Object.keys(nouvelles)
        const identiques = clés.length === Object.keys(avant).length
          && clés.every(id => avant[id]?.l === nouvelles[id].l && avant[id]?.h === nouvelles[id].h)
        return identiques ? avant : nouvelles
      })
    }
    const obs = new ResizeObserver(mesurer)
    observateurRef.current = obs
    élémentsRef.current.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  const refBulle = id => el => {
    if (el) {
      élémentsRef.current.set(id, el)
      observateurRef.current?.observe(el)
    } else {
      élémentsRef.current.delete(id)
    }
  }
  const tailleDe = id => tailles[id] || TAILLE_PAR_DÉFAUT

  // Une bulle qui grandit (code, image, taille) peut recouvrir ses voisines :
  // on le signale pendant quelques secondes après la modification, avec un
  // bouton pour ranger l'arbre (sans rien déplacer d'office).
  const surveilléeRef = useRef(null)
  const surveillerTaille = id => {
    surveilléeRef.current = id
    setTimeout(() => { if (surveilléeRef.current === id) surveilléeRef.current = null }, 4000)
  }
  useEffect(() => {
    const id = surveilléeRef.current
    const n = id && parId.get(id)
    if (!n || cachées.has(id)) return
    const ta = tailleDe(id)
    const recouvre = visibles.some(o => {
      if (o.id === id) return false
      const tb = tailleDe(o.id)
      return Math.abs(n.x - o.x) < (ta.l + tb.l) / 2 + 4 && Math.abs(n.y - o.y) < (ta.h + tb.h) / 2 + 4
    })
    if (recouvre) {
      surveilléeRef.current = null
      afficher('Cette bulle recouvre ses voisines.', false, { libellé: 'Ranger', fn: rangerTout })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailles])

  // ---------- Bulles visibles (branches repliées) ----------
  const cachées = bullesCachées(noeuds)
  const visibles = noeuds.filter(n => !cachées.has(n.id))
  const ids = new Set(noeuds.map(n => n.id))
  const idsVisibles = new Set(visibles.map(n => n.id))
  const parId = new Map(noeuds.map(n => [n.id, n]))
  const estRacine = n => !n.parentId || !ids.has(n.parentId)
  const liensVisibles = liens
    .filter(l => idsVisibles.has(l.de) && idsVisibles.has(l.vers))
    .map(l => ({ l, géo: géométrieLien(parId.get(l.de), parId.get(l.vers), tailleDe, l.tracé) }))

  // En présentation, seules les bulles déjà dévoilées sont affichées.
  const ordre = présentation ? ordrePrésentation(visibles) : []
  const idsAffichés = présentation ? new Set(ordre.slice(0, présentation.étape + 1)) : idsVisibles
  const affichées = visibles.filter(n => idsAffichés.has(n.id))
  const liensAffichés = liensVisibles.filter(({ l }) => idsAffichés.has(l.de) && idsAffichés.has(l.vers))

  useEffect(() => {
    if (sélection && cachées.has(sélection)) setSélection(null)
  })

  // ---------- Vue (déplacement / zoom) ----------
  const dimensions = () => {
    const r = zoneRef.current?.getBoundingClientRect()
    return r ? { l: r.width, h: r.height, gauche: r.left, haut: r.top } : { l: 360, h: 500, gauche: 0, haut: 0 }
  }
  const centrer = (liste = visibles) => {
    const { l, h } = dimensions()
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
    const { l, h } = dimensions()
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
  const zoomerCentre = facteur => { const { l, h } = dimensions(); zoomerAutour(facteur, l / 2, h / 2) }

  // ---------- Mode présentation ----------
  // Cadre la bulle dévoilée avec son parent et ses sœurs déjà montrées,
  // pour voir la branche se construire ; la dernière étape montre tout.
  const cadrerÉtape = étape => {
    if (étape >= ordre.length) { centrer(visibles); return }
    const n = parId.get(ordre[étape])
    const montrées = new Set(ordre.slice(0, étape + 1))
    const parent = n.parentId && montrées.has(n.parentId) ? parId.get(n.parentId) : null
    const sœurs = parent ? visibles.filter(x => x.parentId === parent.id && montrées.has(x.id)) : []
    const points = [n, ...(parent ? [parent] : []), ...sœurs]
    const { l, h } = dimensions()
    const xs = points.map(q => q.x)
    const ys = points.map(q => q.y)
    const larg = Math.max(...xs) - Math.min(...xs) + 280
    const haut = Math.max(...ys) - Math.min(...ys) + 180
    const zoom = Math.min(1.6, Math.max(ZOOM_MIN, Math.min(l / larg, (h - 90) / haut)))
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2
    setVue({ zoom, x: l / 2 - cx * zoom, y: (h - 70) / 2 - cy * zoom })
  }
  const allerÀÉtape = étape => {
    const e = Math.max(0, Math.min(ordre.length, étape))
    setPrésentation({ étape: e })
    setTransitionVue(true)
    requestAnimationFrame(() => cadrerÉtape(e))
  }
  const démarrerPrésentation = () => {
    oublierSélection()
    setRecherche(null)
    setÉdition(null)
    setTransitionVue(false)
    setPrésentation({ étape: 0 })
    document.documentElement.requestFullscreen?.().catch(() => {})
    // Attendre que la zone passe en plein écran avant de cadrer.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const racine = parId.get(ordrePrésentation(visibles)[0])
      if (!racine) return
      const { l, h } = dimensions()
      setVue({ zoom: 1.4, x: l / 2 - racine.x * 1.4, y: (h - 70) / 2 - racine.y * 1.4 })
    }))
  }
  const quitterPrésentation = () => {
    setPrésentation(null)
    setTransitionVue(false)
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    requestAnimationFrame(() => centrer())
  }

  // ---------- Annuler / rétablir (en mémoire, pour la session) ----------
  const mémoriser = () => {
    const h = historiqueRef.current
    h.passé.push(dataRef.current.graphes)
    if (h.passé.length > HISTORIQUE_MAX) h.passé.shift()
    h.futur = []
    setVersionHistorique(v => v + 1)
  }
  const oublierSélection = () => {
    setSélection(null); setTraitChoisi(null); setRattachement(false); setLiaison(false); setPaletteOuverte(false); setMulti([])
  }
  const voyager = (depuis, vers, libellé) => {
    const h = historiqueRef.current
    if (h[depuis].length === 0) return
    h[vers].push(dataRef.current.graphes)
    const état = h[depuis].pop()
    setData(d => ({ ...d, graphes: état }))
    oublierSélection()
    setVersionHistorique(v => v + 1)
    afficher(libellé)
  }
  const annuler = () => voyager('passé', 'futur', 'Action annulée')
  const rétablir = () => voyager('futur', 'passé', 'Action rétablie')
  const peutAnnuler = historiqueRef.current.passé.length > 0
  const peutRétablir = historiqueRef.current.futur.length > 0

  useEffect(() => {
    const surTouche = e => {
      if (présentation) {
        const é = présentation.étape
        if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); allerÀÉtape(é + 1) }
        else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); allerÀÉtape(é - 1) }
        else if (e.key === 'Home') allerÀÉtape(0)
        else if (e.key === 'End') allerÀÉtape(ordre.length)
        else if (e.key === 'Escape') quitterPrésentation()
        return
      }
      if (!e.target.closest?.('input, textarea, select, [role=dialog], [data-sections]')) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && graphe) {
          e.preventDefault()
          setSélection(null); setTraitChoisi(null)
          setMulti(visibles.map(n => n.id))
          return
        }
        if (e.key === 'Escape' && (multi.length || modeCadre)) { setMulti([]); setModeCadre(false); return }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && graphe && !édition) {
          e.preventDefault()
          dupliquer()
          return
        }
        // Clavier sur la bulle choisie : Tab = sous-bulle, Entrée = bulle
        // suivante, F2/Espace = écrire, flèches = se déplacer dans l'arbre.
        const choisie = sélection && parId.get(sélection)
        if (graphe && !édition && !agrandie && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (choisie && e.key === 'Tab') { e.preventDefault(); if (e.shiftKey) ajouterSœur(choisie.parentId && parId.get(choisie.parentId) ? choisie.parentId : choisie.id, true); else ajouterEnfant(choisie.id, true); return }
          if (choisie && e.key === 'Enter' && !e.target.closest?.('button, a')) { e.preventDefault(); ajouterSœur(choisie.id, true); return }
          if (choisie && (e.key === 'F2' || (e.key === ' ' && !e.target.closest?.('button, a')))) { e.preventDefault(); setÉdition({ ...éditionBulle(choisie), clavier: true }); return }
          if (e.key.startsWith('Arrow') && choisie) {
            e.preventDefault()
            const suivante = voisine(choisie, e.key)
            if (suivante) { setSélection(suivante.id); setMulti([]); setTraitChoisi(null); révéler(suivante) }
            return
          }
        }
        // Suppr / Retour arrière : supprime ce qui est sélectionné (lien,
        // branche détachée, bulle ou groupe de bulles).
        if ((e.key === 'Delete' || e.key === 'Backspace') && !agrandie && !édition && graphe) {
          if (traitChoisi?.type === 'lien') { e.preventDefault(); supprimerLien(traitChoisi.id); setTraitChoisi(null); afficher('Lien supprimé'); return }
          if (traitChoisi?.type === 'branche') { e.preventDefault(); détacher(traitChoisi.id); setTraitChoisi(null); afficher('Branche détachée'); return }
          if (multiSet.size > 0 && !sélection) { e.preventDefault(); supprimerMulti(); return }
          if (sélection && parId.get(sélection)) { e.preventDefault(); supprimerNoeud(sélection); return }
        }
      }
      if (e.target.closest?.('input, textarea, select') || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' && e.key.toLowerCase() !== 'y') return
      e.preventDefault()
      if (e.key.toLowerCase() === 'y' || e.shiftKey) rétablir()
      else annuler()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  })

  // Ctrl+C / Ctrl+X / Ctrl+V : les bulles vont aussi dans le presse-papiers
  // du système sous forme de plan texte ; coller un texte crée des bulles.
  useEffect(() => {
    const horsGraphe = e => !graphe || présentation || !!édition || !!e.target.closest?.('input, textarea, select, [role=dialog], [data-sections]')
    const surCopier = (e, couper) => {
      if (horsGraphe(e) || window.getSelection()?.toString() || !idsÀCopier().length) return
      const r = copierSélection()
      e.clipboardData?.setData('text/plain', r.texte)
      e.preventDefault()
      if (couper) {
        const retirées = new Set(r.copie.noeuds.map(n => n.id))
        retirer(retirées)
        afficher(`✂️ ${retirées.size} bulle(s) coupée(s)`)
      } else afficher(`📄 ${r.copie.noeuds.length} bulle(s) copiée(s)`)
    }
    const surCouper = e => surCopier(e, true)
    const surColler = e => {
      if (horsGraphe(e)) return
      const texte = e.clipboardData?.getData('text/plain') || ''
      const interne = lirePressePapiers()
      if (interne && (!texte || texte === interne.texte)) { e.preventDefault(); insérer(interne.copie, 'collée(s)'); return }
      if (texte.trim()) { e.preventDefault(); insérer(analyserPlan(texte), 'créée(s) depuis le texte') }
    }
    window.addEventListener('copy', surCopier)
    window.addEventListener('cut', surCouper)
    window.addEventListener('paste', surColler)
    return () => {
      window.removeEventListener('copy', surCopier)
      window.removeEventListener('cut', surCouper)
      window.removeEventListener('paste', surColler)
    }
  })

  // ---------- Modifications ----------
  const afficher = (texte, estErreur = false, action = null) => {
    setMessage({ texte, erreur: estErreur, action })
    setTimeout(() => setMessage(m => (m?.texte === texte ? null : m)), action ? 6000 : 2500)
  }
  const majGraphe = (fn, garderTrace = true) => {
    if (garderTrace) mémoriser()
    setData(d => ({ ...d, graphes: d.graphes.map(g => (g.id === graphe.id ? fn(g) : g)) }))
  }
  const majNoeuds = (fn, garderTrace = true) => majGraphe(g => ({ ...g, noeuds: fn(g.noeuds) }), garderTrace)

  const créerGraphe = (nom, modèleId) => {
    const modèle = MODÈLES.find(m => m.id === modèleId) || MODÈLES[0]
    const { noeuds: bulles, liens: traits } = modèle.créer(nom)
    const nouveau = { id: uid(), nom, noeuds: bulles, liens: traits }
    mémoriser()
    setData(d => ({ ...d, graphes: [...d.graphes, nouveau] }))
    setGrapheId(nouveau.id)
    oublierSélection()
    setSélection(bulles[0].id)
    setCréation(false)
  }
  const renommerGraphe = () => {
    const nom = window.prompt('Nouveau nom du graphe ?', graphe.nom)
    if (nom && nom.trim()) majGraphe(g => ({ ...g, nom: nom.trim() }))
  }
  const supprimerGraphe = () => {
    if (!window.confirm(`Supprimer le graphe « ${graphe.nom} » et ses ${noeuds.length} bulle(s) ?`)) return
    mémoriser()
    setData(d => ({ ...d, graphes: d.graphes.filter(g => g.id !== graphe.id) }))
    setGrapheId(null)
    oublierSélection()
  }

  // Bas d'une branche : une nouvelle bulle se place sous tout ce qui en dépend.
  const basDeBranche = id => {
    const ys = [...descendants(noeuds, id)].map(d => parId.get(d)?.y).filter(y => y !== undefined)
    return ys.length ? Math.max(...ys) : null
  }
  // Bulle voisine pour les flèches du clavier : ← parent, → première
  // sous-bulle, ↑ ↓ bulle d'au-dessus / d'en dessous au même niveau.
  const voisine = (n, touche) => {
    if (!n) return [...visibles].sort((a, b) => a.y - b.y || a.x - b.x).find(estRacine) || visibles[0]
    if (touche === 'ArrowLeft') return n.parentId && idsVisibles.has(n.parentId) ? parId.get(n.parentId) : null
    if (touche === 'ArrowRight') return visibles.filter(c => c.parentId === n.id).sort((a, b) => a.y - b.y)[0] || null
    const frères = visibles.filter(c => (estRacine(n) ? estRacine(c) : c.parentId === n.parentId)).sort((a, b) => a.y - b.y || a.x - b.x)
    const i = frères.findIndex(c => c.id === n.id)
    return frères[i + (touche === 'ArrowDown' ? 1 : -1)] || null
  }
  // `clavier` : saisie enchaînée (Entrée = bulle suivante, Tab = sous-bulle).
  const créerBulle = (nouveau, parent, clavier) => {
    majNoeuds(liste => [...liste.map(n => (parent && n.id === parent.id ? { ...n, replié: false } : n)), nouveau])
    setSélection(nouveau.id); setMulti([]); setTraitChoisi(null)
    révéler(nouveau, parent || nouveau)
    setÉdition({ ...éditionBulle(nouveau), nouvelle: true, clavier })
  }
  const ajouterEnfant = (parentId, clavier = false) => {
    const parent = parId.get(parentId)
    const frères = noeuds.filter(n => n.parentId === parentId).sort((a, b) => a.y - b.y)
    const bas = basDeBranche(parentId)
    const x = frères.length ? frères[frères.length - 1].x : parent.x + ÉCART_X
    créerBulle({ id: uid(), texte: 'Nouvelle idée', x, y: bas === null ? parent.y : bas + ÉCART_Y, parentId }, parent, clavier)
  }
  const ajouterSœur = (id, clavier = false) => {
    const n = parId.get(id)
    if (!n) return
    if (n.parentId && parId.get(n.parentId)) { ajouterEnfant(n.parentId, clavier); return }
    const bas = Math.max(...noeuds.map(x => x.y))
    créerBulle({ id: uid(), texte: 'Nouvelle idée', x: n.x, y: bas + ÉCART_Y * 1.5, parentId: null }, null, clavier)
  }
  const ajouterBulleLibre = () => {
    const { l, h } = dimensions()
    créerBulle({ id: uid(), texte: 'Nouvelle idée', x: (l / 2 - vue.x) / vue.zoom, y: (h / 2 - vue.y) / vue.zoom, parentId: null }, null, false)
  }
  // Annuler la saisie d'une bulle qu'on vient de créer la retire (sans
  // laisser de « Nouvelle idée » ni de trace dans l'historique).
  const annulerÉdition = () => {
    if (édition?.nouvelle) {
      const id = édition.id
      const parent = parId.get(id)?.parentId
      historiqueRef.current.passé.pop()
      setVersionHistorique(v => v + 1)
      majNoeuds(liste => liste.filter(n => n.id !== id), false)
      setSélection(parent && parId.get(parent) ? parent : null)
    }
    setÉdition(null)
  }
  // Saisie enchaînée au clavier dans la fenêtre d'une bulle.
  const toucheSaisie = e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); validerÉdition(); return }
    if (!édition.clavier) return
    const id = édition.id
    const vide = !édition.texte.trim() && !édition.code && !édition.image
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (vide && édition.nouvelle) { annulerÉdition(); return }
      validerÉdition()
      ajouterSœur(id, true)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (vide) return
      validerÉdition()
      const n = parId.get(id)
      if (e.shiftKey) ajouterSœur(n?.parentId && parId.get(n.parentId) ? n.parentId : id, true)
      else ajouterEnfant(id, true)
    }
  }
  const supprimerNoeud = id => {
    const sous = descendants(noeuds, id)
    if (sous.size > 0 && !window.confirm(`Supprimer cette bulle et les ${sous.size} bulle(s) qui en dépendent ?`)) return
    const retirées = new Set([id, ...sous])
    majGraphe(g => ({
      ...g,
      noeuds: g.noeuds.filter(n => !retirées.has(n.id)),
      liens: g.liens.filter(l => !retirées.has(l.de) && !retirées.has(l.vers)),
    }))
    setSélection(null)
  }
  const rattacher = (enfantId, parentId) => {
    if (enfantId === parentId) return
    if (descendants(noeuds, enfantId).has(parentId)) {
      afficher('Impossible : cette bulle dépend déjà de celle que tu déplaces.', true)
      return
    }
    majNoeuds(liste => liste.map(n => (n.id === enfantId ? { ...n, parentId } : n)))
  }
  const détacher = id => majNoeuds(liste => liste.map(n => (n.id === id ? { ...n, parentId: null } : n)))
  const changerCouleur = (id, couleur) => majNoeuds(liste => liste.map(n => (n.id === id ? { ...n, couleur } : n)))
  // Valeur par défaut = champ retiré, pour garder le JSON léger.
  const changerChamp = (id, champ, valeur) => { surveillerTaille(id); majNoeuds(liste => liste.map(n => {
    if (n.id !== id) return n
    const maj = { ...n, [champ]: valeur }
    if (!valeur) delete maj[champ]
    return maj
  })) }
  // Déplie des branches ; si les bulles qui réapparaissent chevauchent
  // les autres (l'arbre a été rangé pendant le repli), on range tout.
  const déplier = (liste, idsÀDéplier) => {
    const après = liste.map(n => (idsÀDéplier.includes(n.id) ? { ...n, replié: false } : n))
    const cachéesAvant = bullesCachées(liste)
    const cachéesAprès = bullesCachées(après)
    const montrées = après.filter(n => cachéesAvant.has(n.id) && !cachéesAprès.has(n.id))
    const autres = après.filter(n => !cachéesAprès.has(n.id) && !cachéesAvant.has(n.id))
    const chevauche = (a, b) => {
      const ta = tailleDe(a.id)
      const tb = tailleDe(b.id)
      return Math.abs(a.x - b.x) < (ta.l + tb.l) / 2 && Math.abs(a.y - b.y) < (ta.h + tb.h) / 2
    }
    return montrées.some(m => autres.some(o => chevauche(m, o))) ? ranger(après, tailleDe, optionsRanger(!!graphe?.séparer)) : après
  }
  const basculerRepli = id => majNoeuds(liste => {
    const n = liste.find(x => x.id === id)
    return n?.replié ? déplier(liste, [id]) : liste.map(x => (x.id === id ? { ...x, replié: true } : x))
  })

  // Relie deux bulles ; si elles le sont déjà par un lien libre, le retire.
  const basculerLien = (a, b) => {
    if (a === b) return
    const na = parId.get(a)
    const nb = parId.get(b)
    if (na?.parentId === b || nb?.parentId === a) {
      afficher('Ces deux bulles sont déjà reliées par une branche de l\'arbre.', true)
      return
    }
    const existant = liens.find(l => (l.de === a && l.vers === b) || (l.de === b && l.vers === a))
    majGraphe(g => ({
      ...g,
      liens: existant ? g.liens.filter(l => l.id !== existant.id) : [...g.liens, { id: uid(), de: a, vers: b, ...(tracéLiaison !== 'courbe' ? { tracé: tracéLiaison } : {}) }],
    }))
    afficher(existant ? 'Lien retiré' : 'Lien ajouté')
  }
  const majLien = (id, fn) => majGraphe(g => ({ ...g, liens: g.liens.map(l => (l.id === id ? fn(l) : l)) }))
  const supprimerLien = id => majGraphe(g => ({ ...g, liens: g.liens.filter(l => l.id !== id) }))
  const choisirSens = (lien, sens) => {
    if (sens === 'inverse') majLien(lien.id, l => ({ ...l, de: l.vers, vers: l.de, sens: 'vers' }))
    else majLien(lien.id, l => ({ ...l, sens }))
  }

  // Fenêtre de saisie d'une bulle ; avecCode ouvre directement la section code.
  const éditionBulle = (n, avecCode = false) => ({
    type: 'bulle', id: n.id, texte: n.texte === 'Nouvelle idée' && !n.code ? '' : n.texte, image: n.image || null,
    code: n.code ?? (avecCode ? '' : null), langage: n.langage || '', focusCode: avecCode,
  })
  const basculerSéparer = () => {
    const séparer = !graphe.séparer
    majGraphe(g => {
      const maj = { ...g, séparer }
      if (!séparer) delete maj.séparer
      return maj
    })
    if (séparer) {
      requestAnimationFrame(() => rangerTout(true))
      afficher('Arbres séparés par une ligne et rangés (↩︎ pour annuler)')
    }
  }
  const validerÉdition = () => {
    if (édition.type === 'bulle') surveillerTaille(édition.id)
    const texte = édition.texte.trim()
    if (édition.type === 'lien') {
      majLien(édition.id, l => {
        const maj = { ...l, texte }
        if (!texte) delete maj.texte
        return maj
      })
    } else {
      majNoeuds(liste => liste.map(n => {
        if (n.id !== édition.id) return n
        const code = (édition.code || '').replace(/\s+$/, '')
        const maj = { ...n, texte: texte || 'Nouvelle idée', image: édition.image, code, langage: édition.langage }
        if (!maj.image) delete maj.image
        if (!code) { delete maj.code; delete maj.langage }
        if (!maj.langage) delete maj.langage
        return maj
      }))
    }
    setÉdition(null)
  }
  const optionsRanger = séparer => ({ écartArbres: séparer ? ÉCART_Y * 1.6 : ÉCART_Y / 2 })
  const rangerTout = (séparer = !!graphe?.séparer) => {
    const rangés = ranger(noeuds, tailleDe, optionsRanger(séparer))
    majNoeuds(() => rangés)
    const cachéesRangées = bullesCachées(rangés)
    requestAnimationFrame(() => centrer(rangés.filter(n => !cachéesRangées.has(n.id))))
  }

  // ---------- Recherche ----------
  const correspondances = recherche?.q.trim()
    ? noeuds.filter(n => normaliser(texteBrut(n.texte)).includes(normaliser(recherche.q)))
    : []
  const idsTrouvés = new Set(correspondances.map(n => n.id))
  const actuelle = correspondances[recherche?.index] || null
  const allerÀ = index => {
    const liste = correspondances
    if (liste.length === 0) return
    const i = (index + liste.length) % liste.length
    const n = liste[i]
    const àDéplier = ancêtres(noeuds, n.id).filter(id => parId.get(id)?.replié)
    // Si la bulle était cachée, le dépliage peut ranger l'arbre : on centre
    // sur sa nouvelle position.
    const cible = àDéplier.length ? déplier(noeuds, àDéplier).find(x => x.id === n.id) : n
    if (àDéplier.length) majNoeuds(l => déplier(l, àDéplier), false)
    setRecherche(r => ({ ...r, index: i }))
    const { l, h } = dimensions()
    setVue(v => {
      const zoom = Math.max(v.zoom, 0.9)
      return { zoom, x: l / 2 - cible.x * zoom, y: h / 2 - cible.y * zoom }
    })
  }
  useEffect(() => {
    if (recherche?.q.trim()) allerÀ(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche?.q])

  // ---------- Export PNG ----------
  // Position du bloc de code dans la bulle, mesurée à l'écran.
  const blocCode = n => {
    const pre = n.code && élémentsRef.current.get(n.id)?.querySelector('pre')
    if (!pre) return null
    const bord = (n.forme || 'arrondi') === 'nuage' ? 0 : 2
    return {
      x: pre.offsetLeft + bord, y: pre.offsetTop + bord, l: pre.offsetWidth, h: pre.offsetHeight,
      lignes: lignesVisibles(n.code).lignes, reste: lignesVisibles(n.code).reste, langage: n.langage || '', f: facteurTaille(n),
    }
  }
  const exporter = async () => {
    setExportÉtat({ enCours: true })
    try {
      const bulles = visibles.map(n => {
        const t = tailleDe(n.id)
        const racine = estRacine(n)
        return {
          x: n.x, y: n.y, l: t.l, h: t.h, texte: `${n.icone ? `${n.icone} ` : ''}${texteBrut(n.texte)}`, racine, forme: n.forme || 'arrondi', facteur: facteurTaille(n),
          couleur: n.couleur || (racine ? T.accent : T.border),
          image: n.image ? adresseImage(n.image) : null,
          badge: n.replié ? `+${descendants(noeuds, n.id).size}` : null,
          code: blocCode(n),
        }
      })
      const branches = visibles.filter(n => n.parentId && idsVisibles.has(n.parentId)).map(n => {
        const p = parId.get(n.parentId)
        return { de: { x: p.x, y: p.y }, vers: { x: n.x, y: n.y }, couleur: n.couleur || p.couleur || T.textMuted }
      })
      const blob = await exporterGraphePNG({
        bulles,
        branches,
        liens: liensVisibles.map(({ l, géo }) => ({ ...géo, sens: l.sens || 'aucun', texte: l.texte || '' })),
        séparateurs: graphe.séparer ? séparateursArbres(visibles, tailleDe) : [],
        couleurs: { fond: T.bg, surface: T.surface, texte: T.text, accent: T.accent },
        polices: { serif, sans: getComputedStyle(document.body).fontFamily, mono: POLICE_CODE },
      })
      setExportÉtat({ url: URL.createObjectURL(blob), blob, nom: graphe.nom })
    } catch (err) {
      setExportÉtat(null)
      afficher(`Export impossible : ${err.message}`, true)
    }
  }
  const fermerExport = () => {
    if (exportÉtat?.url) URL.revokeObjectURL(exportÉtat.url)
    setExportÉtat(null)
  }
  const fichierExport = exportÉtat?.blob ? new File([exportÉtat.blob], `${exportÉtat.nom}.png`, { type: 'image/png' }) : null
  const partagePossible = !!(fichierExport && navigator.canShare?.({ files: [fichierExport] }))

  // ---------- Gestes : une seule logique pour la souris et le doigt ----------
  const touche = id => {
    if (liaison && sélection) { basculerLien(sélection, id); return }
    if (rattachement && sélection) {
      rattacher(sélection, id)
      setRattachement(false)
      return
    }
    if (sélection === id) {
      const n = parId.get(id)
      setÉdition(éditionBulle(n))
    } else {
      setSélection(id)
      setTraitChoisi(null)
      setPaletteOuverte(false)
    }
  }

  const surAppui = e => {
    const loupe = e.target.closest('[data-agrandir]')
    if (loupe) { setAgrandie(loupe.dataset.agrandir); return }
    const zone = zoneRef.current
    zone.setPointerCapture?.(e.pointerId)
    pointeursRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = [...pointeursRef.current.values()]
    if (p.length === 2) {
      const milieu = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }
      gesteRef.current = { type: 'pincer', dist0: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), milieu0: milieu, vue0: vueRef.current }
      return
    }
    if (présentation) {
      setTransitionVue(false)
      gesteRef.current = { type: 'fond', départ: { x: e.clientX, y: e.clientY }, vue0: vueRef.current, déplacé: false, trait: null }
      return
    }
    const bulle = e.target.closest('[data-noeud]')
    const ajout = e.shiftKey || e.ctrlKey || e.metaKey
    if (bulle && ajout && !liaison && !rattachement) {
      // Maj/Ctrl + clic : ajoute ou retire la bulle de la sélection multiple.
      const id = bulle.dataset.noeud
      setMulti(m => {
        const départ = m.length ? m : (sélection && sélection !== id ? [sélection] : [])
        return départ.includes(id) ? départ.filter(x => x !== id) : [...départ, id]
      })
      setSélection(null); setTraitChoisi(null); setPaletteOuverte(false)
      gesteRef.current = null
      return
    }
    if (!bulle && (ajout || modeCadre) && !liaison && !rattachement) {
      const { gauche, haut } = dimensions()
      const x = e.clientX - gauche
      const y = e.clientY - haut
      gesteRef.current = { type: 'cadre', départ: { x: e.clientX, y: e.clientY }, déplacé: false, ajouter: e.ctrlKey || e.metaKey, origine: { x, y } }
      return
    }
    if (bulle) {
      const n = parId.get(bulle.dataset.noeud)
      gesteRef.current = { type: 'bulle', id: n.id, verrouillé: !!n.verrouillé, vue0: vueRef.current, départ: { x: e.clientX, y: e.clientY }, pos0: { x: n.x, y: n.y }, déplacé: false }
    } else {
      const trait = e.target.closest('[data-trait]')
      gesteRef.current = {
        type: 'fond', départ: { x: e.clientX, y: e.clientY }, vue0: vueRef.current, déplacé: false,
        trait: trait ? { type: trait.dataset.trait, id: trait.dataset.id } : null,
      }
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
      const { gauche, haut } = dimensions()
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
    if (g.type === 'cadre') {
      g.déplacé = true
      setCadre({ x0: g.origine.x, y0: g.origine.y, x1: g.origine.x + dx, y1: g.origine.y + dy })
      return
    }
    if (g.type === 'bulle' && g.verrouillé) {
      // Bulle verrouillée : glisser déplace la vue, pas la bulle.
      if (!g.déplacé) afficher('🔒 Bulle verrouillée : touche « Verrou » pour la déplacer.')
      g.déplacé = true
      setVue({ ...g.vue0, x: g.vue0.x + dx, y: g.vue0.y + dy })
    } else if (g.type === 'bulle') {
      // Un seul point d'annulation par glissement, pris au premier mouvement.
      if (!g.déplacé) mémoriser()
      g.déplacé = true
      const z = vueRef.current.zoom
      // Une branche repliée se déplace avec ses bulles cachées.
      const n = parId.get(g.id)
      // Si la bulle fait partie d'une sélection multiple, tout le groupe suit
      // (sauf les bulles verrouillées).
      const groupe = multi.includes(g.id) ? multi.filter(id => !parId.get(id)?.verrouillé) : [g.id]
      const àDéplacer = new Set()
      groupe.forEach(id => {
        àDéplacer.add(id)
        if (parId.get(id)?.replié) descendants(noeuds, id).forEach(d => àDéplacer.add(d))
      })
      const ddx = g.pos0.x + dx / z - n.x
      const ddy = g.pos0.y + dy / z - n.y
      majNoeuds(liste => liste.map(x => (àDéplacer.has(x.id) ? { ...x, x: x.x + ddx, y: x.y + ddy } : x)), false)
    } else {
      g.déplacé = true
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
    if (g.type === 'cadre') {
      setCadre(null)
      if (!g.déplacé) { oublierSélection(); return }
      const { gauche, haut } = dimensions()
      const v = vueRef.current
      const ax = (Math.min(g.origine.x, e.clientX - gauche) - v.x) / v.zoom
      const bx = (Math.max(g.origine.x, e.clientX - gauche) - v.x) / v.zoom
      const ay = (Math.min(g.origine.y, e.clientY - haut) - v.y) / v.zoom
      const by = (Math.max(g.origine.y, e.clientY - haut) - v.y) / v.zoom
      const dedans = visibles.filter(n => n.x >= ax && n.x <= bx && n.y >= ay && n.y <= by).map(n => n.id)
      const tous = g.ajouter ? [...new Set([...multi, ...dedans])] : dedans
      setSélection(null); setTraitChoisi(null); setPaletteOuverte(false)
      setMulti(tous)
      setModeCadre(false)
      if (tous.length === 0) afficher('Aucune bulle dans le cadre.')
      return
    }
    if (g.déplacé) return
    if (présentation) {
      // Toucher le quart gauche revient en arrière, le reste avance.
      const { l, gauche } = dimensions()
      allerÀÉtape(présentation.étape + (e.clientX - gauche < l / 4 ? -1 : 1))
      return
    }
    if (g.type === 'bulle') { setMulti([]); touche(g.id) }
    else if (g.trait && !liaison && !rattachement) { setTraitChoisi(g.trait); setSélection(null); setPaletteOuverte(false) }
    else oublierSélection()
  }

  const surMolette = e => {
    const { gauche, haut } = dimensions()
    zoomerAutour(Math.exp(-e.deltaY * 0.0015), e.clientX - gauche, e.clientY - haut)
  }

  // ---------- Rendu ----------
  const noeudSélectionné = parId.get(sélection)
  const séparateurs = graphe?.séparer && !présentation ? séparateursArbres(affichées, tailleDe) : []
  const multiSet = new Set(multi.filter(id => idsVisibles.has(id)))
  const multiNoeuds = [...multiSet].map(id => parId.get(id))
  const verrouillerMulti = valeur => {
    majNoeuds(liste => liste.map(n => {
      if (!multiSet.has(n.id)) return n
      const maj = { ...n, verrouillé: true }
      if (!valeur) delete maj.verrouillé
      return maj
    }))
    afficher(valeur ? `🔒 ${multiSet.size} bulles verrouillées` : `🔓 ${multiSet.size} bulles déverrouillées`)
  }
  const supprimerMulti = () => {
    const retirées = new Set()
    multiSet.forEach(id => { retirées.add(id); descendants(noeuds, id).forEach(d => retirées.add(d)) })
    if (!window.confirm(`Supprimer ${retirées.size} bulle(s) (avec celles qui en dépendent) ?`)) return
    retirer(retirées)
  }
  const retirer = retirées => {
    majGraphe(g => ({
      ...g,
      noeuds: g.noeuds.filter(n => !retirées.has(n.id)),
      liens: g.liens.filter(l => !retirées.has(l.de) && !retirées.has(l.vers)),
    }))
    setMulti([])
    setSélection(null)
  }

  // ---------- Copier / coller / dupliquer ----------
  const idsÀCopier = () => (multiSet.size ? [...multiSet] : sélection && parId.get(sélection) ? [sélection] : [])
  const copierSélection = () => {
    const ids = idsÀCopier()
    if (!ids.length) return null
    const copie = copierBranches(noeuds, liens, ids)
    const texte = planTexte(copie.noeuds)
    try { localStorage.setItem(CLÉ_PRESSE_PAPIERS, JSON.stringify({ texte, copie })) } catch { /* ignore */ }
    setPressePapiersPlein(true)
    return { copie, texte }
  }
  // Ajoute une copie : sous la bulle choisie (comme sous-bulles) ou au
  // centre de l'écran ; les bulles ajoutées restent sélectionnées.
  const insérer = (copie, libellé) => {
    if (!copie?.noeuds?.length) return
    const racines = copie.noeuds.filter(n => !n.parentId || !copie.noeuds.some(m => m.id === n.parentId)).sort((a, b) => a.y - b.y)
    const cible = sélection && parId.get(sélection) && !multiSet.size ? parId.get(sélection) : null
    let dx
    let dy
    if (cible) {
      const bas = basDeBranche(cible.id)
      const frères = noeuds.filter(n => n.parentId === cible.id)
      dx = (frères.length ? Math.max(...frères.map(f => f.x)) : cible.x + ÉCART_X) - racines[0].x
      dy = (bas === null ? cible.y : bas + ÉCART_Y) - racines[0].y
    } else {
      const { l, h } = dimensions()
      const xs = copie.noeuds.map(n => n.x)
      const ys = copie.noeuds.map(n => n.y)
      dx = (l / 2 - vue.x) / vue.zoom - (Math.min(...xs) + Math.max(...xs)) / 2
      dy = (h / 2 - vue.y) / vue.zoom - (Math.min(...ys) + Math.max(...ys)) / 2
    }
    const nouvelle = dupliquerCopie(copie, { dx, dy, parentDe: () => (cible ? cible.id : null) })
    majGraphe(g => ({
      ...g,
      noeuds: [...g.noeuds.map(n => (cible && n.id === cible.id ? { ...n, replié: false } : n)), ...nouvelle.noeuds],
      liens: [...g.liens, ...nouvelle.liens],
    }))
    setSélection(null); setTraitChoisi(null)
    setMulti(nouvelle.noeuds.map(n => n.id))
    afficher(`📋 ${nouvelle.noeuds.length} bulle${nouvelle.noeuds.length > 1 ? 's' : ''} ${libellé}`)
  }
  const coller = () => insérer(lirePressePapiers()?.copie, 'collée(s)')
  // La copie se place juste sous l'original, rattachée au même parent.
  const dupliquer = () => {
    const ids = idsÀCopier()
    if (!ids.length) return
    const copie = copierBranches(noeuds, liens, ids)
    const ys = copie.noeuds.map(n => n.y)
    const nouvelle = dupliquerCopie(copie, {
      dx: 0, dy: Math.max(...ys) - Math.min(...ys) + ÉCART_Y,
      parentDe: id => { const p = parId.get(id)?.parentId; return p && parId.get(p) ? p : null },
    })
    majGraphe(g => ({ ...g, noeuds: [...g.noeuds, ...nouvelle.noeuds], liens: [...g.liens, ...nouvelle.liens] }))
    setSélection(null); setTraitChoisi(null)
    setMulti(nouvelle.noeuds.map(n => n.id))
    afficher(`⧉ ${nouvelle.noeuds.length} bulle${nouvelle.noeuds.length > 1 ? 's' : ''} dupliquée(s)`)
  }

  // ---------- Aligner / répartir ----------
  const alignerSélection = mode => {
    const positions = aligner(visibles, [...multiSet], mode, tailleDe)
    const déplacements = new Map()
    Object.entries(positions).forEach(([id, p]) => {
      const n = parId.get(id)
      const d = { dx: p.x - n.x, dy: p.y - n.y }
      if (Math.abs(d.dx) < 0.5 && Math.abs(d.dy) < 0.5) return
      déplacements.set(id, d)
      if (n.replié) descendants(noeuds, id).forEach(c => { if (!multiSet.has(c)) déplacements.set(c, d) })
    })
    if (!déplacements.size) return
    majNoeuds(liste => liste.map(n => {
      const d = déplacements.get(n.id)
      return d ? { ...n, x: n.x + d.dx, y: n.y + d.dy } : n
    }))
  }
  const interditsRattachement = rattachement && sélection ? new Set([sélection, ...descendants(noeuds, sélection)]) : new Set()

  const boutonFlottant = (désactivé = false) => ({
    width: '40px', height: '40px', borderRadius: '12px', background: T.surface, color: T.text,
    border: `1px solid ${T.border}`, cursor: désactivé ? 'default' : 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '17px', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,.25)',
    opacity: désactivé ? 0.35 : 1, flexShrink: 0,
  })
  const boutonAlign = désactivé => ({
    width: '34px', height: '30px', borderRadius: '8px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: désactivé ? 'default' : 'pointer', opacity: désactivé ? 0.35 : 1, padding: 0,
  })
  const boutonTexte = { ...boutonFlottant(), width: 'auto', padding: '0 12px', fontSize: '12.5px', fontFamily: grotesk }
  const action = (danger = false) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: '1 1 auto', minWidth: 0, padding: '6px 2px', whiteSpace: 'nowrap',
    background: 'transparent', border: 'none', cursor: 'pointer', color: danger ? T.danger : T.text,
    fontFamily: grotesk, fontSize: '9.5px', fontWeight: 600,
  })
  const bandeau = { position: 'absolute', left: '10px', right: '10px', top: '60px', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600 }
  const boutonBandeau = { background: 'rgba(0,0,0,.15)', color: 'inherit', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }
  const court = n => texteBrut(n.texte).split('\n')[0].slice(0, 22)

  const plein = agrandi || !!présentation
  const canevas = (
    <div style={{
      position: plein ? 'fixed' : 'relative', inset: plein ? 0 : undefined, zIndex: plein ? 1000 : undefined,
      flex: plein ? undefined : 1, minHeight: plein ? undefined : '440px',
      borderRadius: plein ? 0 : '14px', border: plein ? 'none' : `1px solid ${T.border}`, overflow: 'hidden', background: T.bg,
    }}>
      <style>{ANIMATIONS}</style>
      <div
        ref={zoneRef}
        onPointerDown={surAppui}
        onPointerMove={surMouvement}
        onPointerUp={surRelâche}
        onPointerCancel={surRelâche}
        onWheel={surMolette}
        style={{
          position: 'absolute', inset: 0, touchAction: 'none', cursor: présentation ? 'pointer' : 'grab',
          backgroundImage: présentation ? 'none' : `radial-gradient(${T.border} 1.2px, transparent 1.2px)`,
          backgroundSize: `${24 * vue.zoom}px ${24 * vue.zoom}px`,
          backgroundPosition: `${vue.x}px ${vue.y}px`,
          userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
        }}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0, transform: `translate(${vue.x}px, ${vue.y}px) scale(${vue.zoom})`, transformOrigin: '0 0',
          transition: présentation && transitionVue ? 'transform .8s cubic-bezier(.45, 0, .2, 1)' : 'none',
        }}>
          <svg width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <marker id="pointe" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={T.accent} />
              </marker>
            </defs>
            {séparateurs.map((l, i) => (
              <line key={`sep-${i}`} x1={l.x0} x2={l.x1} y1={l.y} y2={l.y} stroke={T.textMuted} strokeOpacity="0.7" strokeWidth="2" strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />
            ))}
            {affichées.filter(n => n.parentId && idsAffichés.has(n.parentId)).map(n => {
              const p = parId.get(n.parentId)
              const mx = (p.x + n.x) / 2
              const d = `M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${n.y}, ${n.x} ${n.y}`
              const choisi = traitChoisi?.type === 'branche' && traitChoisi.id === n.id
              return (
                <g key={n.id}>
                  <path d={d} fill="none" stroke={choisi ? T.accent : (n.couleur || p.couleur || T.textMuted)}
                    strokeWidth={choisi ? 5 : 2.5} strokeLinecap="round" opacity={choisi ? 1 : 0.7}
                    {...(présentation ? { pathLength: 1, strokeDasharray: 1, className: 'anime', style: { animation: 'tracer .6s ease-out both' } } : {})} />
                  {!présentation && <path d={d} data-trait="branche" data-id={n.id} fill="none" stroke="transparent" strokeWidth="22" style={{ pointerEvents: 'stroke', cursor: 'pointer' }} />}
                </g>
              )
            })}
            {liensAffichés.map(({ l, géo }) => {
              const choisi = traitChoisi?.type === 'lien' && traitChoisi.id === l.id
              const sens = l.sens || 'aucun'
              return (
                <g key={l.id} className={présentation ? 'anime' : undefined} style={présentation ? { animation: 'fondu .7s ease-out both' } : undefined}>
                  <path d={géo.d} fill="none" stroke={T.accent} strokeWidth={choisi ? 4.5 : 2.5} strokeDasharray="7 6" strokeLinecap="round" opacity={choisi ? 1 : 0.85}
                    markerEnd={sens === 'vers' || sens === 'deux' ? 'url(#pointe)' : undefined}
                    markerStart={sens === 'deux' ? 'url(#pointe)' : undefined} />
                  {!présentation && <path d={géo.d} data-trait="lien" data-id={l.id} fill="none" stroke="transparent" strokeWidth="22" style={{ pointerEvents: 'stroke', cursor: 'pointer' }} />}
                </g>
              )
            })}
          </svg>

          {affichées.map(n => {
            const racine = estRacine(n)
            const couleur = n.couleur || (racine ? T.accent : T.border)
            const choisi = sélection === n.id || multiSet.has(n.id)
            const cible = (rattachement && !interditsRattachement.has(n.id)) || (liaison && n.id !== sélection)
            const trouvée = idsTrouvés.has(n.id)
            const nbCachées = n.replié ? descendants(noeuds, n.id).size : 0
            const forme = n.forme || 'arrondi'
            const f = facteurTaille(n)
            const marges = (v, h) => `${v * f}px ${h * f}px`
            const nuage = forme === 'nuage'
            const couleurBord = choisi ? T.text : trouvée ? '#ffd60a' : couleur
            const fond = racine ? couleur : `linear-gradient(${couleur}22, ${couleur}22), ${T.surface}`
            const enCours = présentation && ordre[Math.min(présentation.étape, ordre.length - 1)] === n.id && présentation.étape < ordre.length
            return (
              <div
                key={n.id}
                ref={refBulle(n.id)}
                data-noeud={n.id}
                role="button"
                aria-label={`Bulle : ${n.icone ? `${n.icone} ` : ''}${texteBrut(n.texte)}${nbCachées ? ` (${nbCachées} bulles repliées)` : ''}${n.verrouillé ? ' (verrouillée)' : ''}`}
                aria-pressed={choisi}
                className={présentation ? 'anime' : actuelle?.id === n.id ? 'bulle-trouvee' : undefined}
                style={{
                  position: 'absolute', left: n.x, top: n.y, transform: 'translate(-50%, -50%)',
                  minWidth: `${64 * f}px`, maxWidth: `${(n.code ? 340 : 210) * f}px`, width: 'max-content',
                  padding: nuage ? (racine ? marges(24, 34) : marges(20, 28)) : forme === 'rond' ? (racine ? marges(18, 26) : marges(14, 22)) : (racine ? marges(12, 16) : marges(9, 14)),
                  borderRadius: { arrondi: '18px', rond: '50%', rectangle: '4px', nuage: 0 }[forme],
                  textAlign: 'center', cursor: 'pointer', lineHeight: 1.35,
                  fontSize: `${(racine ? 15 : 13.5) * f}px`, fontWeight: racine ? 700 : 500,
                  fontFamily: racine ? serif : 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: nuage ? 'transparent' : fond,
                  color: racine ? '#1b1b1b' : T.text,
                  border: nuage ? 'none' : `2px ${cible ? 'dashed' : 'solid'} ${couleurBord}`,
                  boxShadow: nuage ? 'none'
                    : choisi || enCours ? `0 0 0 4px ${T.accent}55, 0 6px 18px rgba(0,0,0,.3)` : '0 3px 10px rgba(0,0,0,.18)',
                  filter: nuage ? (choisi || enCours ? `drop-shadow(0 0 6px ${T.accent})` : 'drop-shadow(0 3px 5px rgba(0,0,0,.25))') : undefined,
                  animation: présentation ? 'apparition .55s cubic-bezier(.2, .9, .3, 1.25) both'
                    : actuelle?.id === n.id ? `${nuage ? 'trouvéeNuage' : 'trouvée'} 1s ease-in-out infinite` : undefined,
                }}
              >
                {nuage && (
                  <svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'visible' }}>
                    {!racine && <path d={CHEMIN_NUAGE} fill={T.surface} />}
                    <path d={CHEMIN_NUAGE} fill={racine ? couleur : `${couleur}22`} stroke={couleurBord} strokeWidth={choisi ? 3 : 2}
                      strokeDasharray={cible ? '6 4' : undefined} vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
                {n.image && <ImageCarte image={n.image} hauteurMax={110 * f} style={{ maxWidth: `${180 * f}px`, margin: '0 auto 6px', borderRadius: '8px', pointerEvents: 'none' }} />}
                {n.icone && <span style={{ marginRight: '5px' }}>{n.icone}</span>}
                <TexteFormaté texte={n.texte} couleurDéfaut={racine ? '#1b1b1b' : T.text} />
                {n.code && <CodeDansBulle code={n.code} langage={n.langage} f={f} />}
                {n.verrouillé && !présentation && (
                  <span aria-hidden="true" title="Position verrouillée" style={{
                    position: 'absolute', top: '-10px', left: '-10px', width: '22px', height: '22px', borderRadius: '50%',
                    background: T.surface, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', boxShadow: '0 2px 6px rgba(0,0,0,.3)', pointerEvents: 'none',
                  }}>🔒</span>
                )}
                {(n.image || n.code) && (
                  <span data-agrandir={n.id} role="button" aria-label={`Agrandir ${n.image ? 'l\'image' : 'le code'}`} title="Agrandir" style={{
                    position: 'absolute', bottom: '-12px', right: '-12px', width: '28px', height: '28px', borderRadius: '50%',
                    background: T.surface, color: T.text, border: `1.5px solid ${T.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, cursor: 'zoom-in', boxShadow: '0 2px 6px rgba(0,0,0,.35)', fontFamily: grotesk,
                  }}>⤢</span>
                )}
                {nbCachées > 0 && (
                  <span style={{
                    position: 'absolute', top: '-10px', right: '-10px', minWidth: '24px', height: '22px', padding: '0 6px',
                    borderRadius: '11px', background: T.accent, color: '#1b1b1b', fontSize: '11px', fontWeight: 800,
                    fontFamily: grotesk, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)',
                  }}>+{nbCachées}</span>
                )}
              </div>
            )
          })}

          {liensAffichés.filter(({ l }) => l.texte).map(({ l, géo }) => (
            <div
              key={`texte-${l.id}`}
              data-trait="lien"
              data-id={l.id}
              className={présentation ? 'anime' : undefined}
              style={{
                position: 'absolute', left: géo.milieu.x, top: géo.milieu.y, transform: 'translate(-50%, -50%)',
                background: T.surface, border: `1.5px solid ${T.accent}`, borderRadius: '11px', padding: '2px 8px',
                fontSize: '11.5px', fontWeight: 600, color: T.text, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: grotesk,
                boxShadow: traitChoisi?.id === l.id ? `0 0 0 3px ${T.accent}66` : 'none',
                animation: présentation ? 'fondu .7s ease-out both' : undefined,
              }}
            >{l.texte}</div>
          ))}
        </div>
      </div>

      {!présentation && (<>
      {/* Commandes de vue */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button onClick={() => zoomerCentre(1.25)} aria-label="Zoomer" style={boutonFlottant()}>+</button>
        <button onClick={() => zoomerCentre(0.8)} aria-label="Dézoomer" style={boutonFlottant()}>−</button>
        <button onClick={() => centrer()} aria-label="Centrer" title="Tout voir" style={{ ...boutonFlottant(), fontSize: '15px' }}>⤢</button>
        <button onClick={() => setAgrandi(a => !a)} aria-label={agrandi ? 'Réduire' : 'Agrandir'} title={agrandi ? 'Réduire' : 'Plein écran'} style={{ ...boutonFlottant(), fontSize: '15px' }}>{agrandi ? '✕' : '⛶'}</button>
        {graphe && <button onClick={() => setRecherche(r => (r ? null : { q: '', index: 0 }))} aria-label="Rechercher" title="Rechercher" style={{ ...boutonFlottant(), fontSize: '15px' }}>🔍</button>}
        {graphe && noeuds.length > 0 && (
          <button onClick={exporter} disabled={exportÉtat?.enCours} aria-label="Exporter en image" title="Exporter en image PNG" style={{ ...boutonFlottant(), fontSize: '15px' }}>
            {exportÉtat?.enCours ? '⏳' : '📤'}
          </button>
        )}
      </div>

      {graphe && !recherche && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '60px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={ajouterBulleLibre} style={boutonTexte}>＋ Bulle</button>
          {noeuds.length > 1 && <button onClick={() => rangerTout()} style={boutonTexte}>Ranger</button>}
          {pressePapiersPlein && <button onClick={coller} title="Coller les bulles copiées (Ctrl+V)" style={boutonTexte}>📋 Coller</button>}
          <button onClick={annuler} disabled={!peutAnnuler} aria-label="Annuler" title="Annuler (Ctrl+Z)" style={boutonFlottant(!peutAnnuler)}>↩︎</button>
          <button onClick={rétablir} disabled={!peutRétablir} aria-label="Rétablir" title="Rétablir (Ctrl+Maj+Z)" style={boutonFlottant(!peutRétablir)}>↪︎</button>
          <button onClick={() => { setModeCadre(m => !m); setSélection(null); setTraitChoisi(null) }} aria-pressed={modeCadre} aria-label="Sélectionner plusieurs bulles"
            title="Sélectionner plusieurs bulles (ou Maj + glisser avec la souris)"
            style={{ ...boutonFlottant(), ...(modeCadre ? { background: T.accent, color: T.accentText, border: 'none' } : {}), fontSize: '16px' }}>⬚</button>
        </div>
      )}

      {recherche && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '60px', display: 'flex', alignItems: 'center', gap: '4px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '4px 4px 4px 10px', boxShadow: '0 2px 8px rgba(0,0,0,.25)' }}>
          <input
            autoFocus
            value={recherche.q}
            onChange={e => setRecherche({ q: e.target.value, index: 0 })}
            onKeyDown={e => { if (e.key === 'Enter') allerÀ(recherche.index + (e.shiftKey ? -1 : 1)); if (e.key === 'Escape') setRecherche(null) }}
            placeholder="Rechercher une bulle…"
            aria-label="Rechercher une bulle"
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: '14px' }}
          />
          {recherche.q.trim() && (
            <span style={{ fontSize: '11.5px', color: correspondances.length ? T.textMuted : T.danger, fontFamily: grotesk, whiteSpace: 'nowrap' }}>
              {correspondances.length ? `${recherche.index + 1}/${correspondances.length}` : 'aucune'}
            </span>
          )}
          <button onClick={() => allerÀ(recherche.index - 1)} disabled={correspondances.length < 2} aria-label="Résultat précédent" style={{ ...boutonFlottant(correspondances.length < 2), width: '32px', height: '32px', boxShadow: 'none', fontSize: '12px' }}>▲</button>
          <button onClick={() => allerÀ(recherche.index + 1)} disabled={correspondances.length < 2} aria-label="Résultat suivant" style={{ ...boutonFlottant(correspondances.length < 2), width: '32px', height: '32px', boxShadow: 'none', fontSize: '12px' }}>▼</button>
          <button onClick={() => setRecherche(null)} aria-label="Fermer la recherche" style={{ ...boutonFlottant(), width: '32px', height: '32px', boxShadow: 'none', fontSize: '13px' }}>✕</button>
        </div>
      )}

      {rattachement && (
        <div style={{ ...bandeau, background: T.accent, color: T.accentText }}>
          <span style={{ flex: 1 }}>Touche la bulle qui devient le parent</span>
          <button onClick={() => setRattachement(false)} style={boutonBandeau}>Annuler</button>
        </div>
      )}
      {liaison && (
        <div style={{ ...bandeau, background: T.accent, color: T.accentText }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span>Relier « {noeudSélectionné ? court(noeudSélectionné) : ''} » : touche les bulles <span style={{ fontWeight: 500, opacity: 0.8 }}>(retoucher retire le lien)</span></span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }} role="group" aria-label="Tracé des nouveaux liens">
              {TRACÉS.map(t => (
                <button key={t.id} onClick={() => setTracéLiaison(t.id)} aria-pressed={tracéLiaison === t.id} style={{
                  ...boutonBandeau, padding: '5px 9px', fontSize: '12px',
                  background: tracéLiaison === t.id ? T.accentText : 'rgba(0,0,0,.15)', color: tracéLiaison === t.id ? T.accent : 'inherit',
                }}>{t.symbole} {t.nom}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setLiaison(false)} style={{ ...boutonBandeau, alignSelf: 'flex-start' }}>Terminé</button>
        </div>
      )}
      {message && (
        <div role="status" style={{ ...bandeau, ...(liaison || rattachement ? { top: 'auto', bottom: '16px' } : {}), background: message.erreur ? T.danger : message.action ? T.surface : '#2f7d4f', color: message.action ? T.text : '#fff', border: message.action ? `1px solid ${T.accent}` : 'none', fontWeight: 500 }}>
          <span style={{ flex: 1 }}>{message.texte}</span>
          {message.action && (
            <button onClick={() => { message.action.fn(); setMessage(null) }} style={{ ...boutonBandeau, background: T.accent, color: T.accentText }}>{message.action.libellé}</button>
          )}
        </div>
      )}

      {/* Barre d'actions de la bulle sélectionnée */}
      {cadre && (
        <div style={{
          position: 'absolute', pointerEvents: 'none', left: Math.min(cadre.x0, cadre.x1), top: Math.min(cadre.y0, cadre.y1),
          width: Math.abs(cadre.x1 - cadre.x0), height: Math.abs(cadre.y1 - cadre.y0),
          border: `1.5px dashed ${T.accent}`, background: `${T.accent}1f`, borderRadius: '4px',
        }} />
      )}
      {modeCadre && !cadre && (
        <div style={{ ...bandeau, background: T.accent, color: T.accentText }}>
          <span style={{ flex: 1 }}>Glisse pour tracer un cadre autour des bulles à sélectionner</span>
          <button onClick={() => setModeCadre(false)} style={boutonBandeau}>Annuler</button>
        </div>
      )}

      {/* Barre d'actions de plusieurs bulles sélectionnées */}
      {multiSet.size > 0 && !noeudSélectionné && (
        <div style={{ position: 'absolute', left: '8px', right: '8px', bottom: 'max(8px, env(safe-area-inset-bottom))', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '10px 12px', boxShadow: '0 6px 20px rgba(0,0,0,.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: T.text }}>
            <strong>{multiSet.size} bulle{multiSet.size > 1 ? 's' : ''} sélectionnée{multiSet.size > 1 ? 's' : ''}</strong>
            <span style={{ color: T.textMuted }}> · {multiNoeuds.filter(n => n.verrouillé).length} verrouillée(s) · Maj/Ctrl + clic pour ajouter ou retirer</span>
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              ['🔒 Verrouiller', () => verrouillerMulti(true), multiNoeuds.every(n => n.verrouillé)],
              ['🔓 Déverrouiller', () => verrouillerMulti(false), !multiNoeuds.some(n => n.verrouillé)],
            ].map(([libellé, fn, inutile]) => (
              <button key={libellé} onClick={fn} disabled={inutile} style={{
                background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '8px 10px',
                fontSize: '12.5px', fontWeight: 600, cursor: inutile ? 'default' : 'pointer', fontFamily: grotesk, opacity: inutile ? 0.4 : 1,
              }}>{libellé}</button>
            ))}
            {[['📄 Copier', () => { const r = copierSélection(); if (r) afficher(`📄 ${r.copie.noeuds.length} bulle(s) copiée(s) — « Coller » ou Ctrl+V`) }], ['⧉ Dupliquer', dupliquer]].map(([libellé, fn]) => (
              <button key={libellé} onClick={fn} style={{
                background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '8px 10px',
                fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
              }}>{libellé}</button>
            ))}
            <button onClick={supprimerMulti} style={{ background: T.danger, color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 10px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: grotesk }}>🗑️ Supprimer</button>
            <button onClick={() => setMulti([])} aria-label="Tout désélectionner" style={{ marginLeft: 'auto', background: 'transparent', color: T.textMuted, border: 'none', fontSize: '16px', cursor: 'pointer', padding: '0 6px' }}>✕</button>
          </div>
          {multiSet.size > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }} role="group" aria-label="Aligner et répartir">
              <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: grotesk, marginRight: '2px' }}>Aligner</span>
              {[['gauche', 'Aligner à gauche'], ['centre', 'Centrer sur une même verticale'], ['haut', 'Aligner en haut'], ['milieu', 'Centrer sur une même horizontale']].map(([mode, titre]) => (
                <button key={mode} onClick={() => alignerSélection(mode)} title={titre} aria-label={titre} style={boutonAlign(false)}><IcôneAlign type={mode} /></button>
              ))}
              <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: grotesk, margin: '0 2px 0 8px' }}>Répartir</span>
              {[['répartirH', 'Espacer régulièrement à l\'horizontale'], ['répartirV', 'Espacer régulièrement à la verticale']].map(([mode, titre]) => (
                <button key={mode} onClick={() => alignerSélection(mode)} disabled={multiSet.size < 3} title={multiSet.size < 3 ? 'Choisis au moins 3 bulles' : titre} aria-label={titre} style={boutonAlign(multiSet.size < 3)}><IcôneAlign type={mode} /></button>
              ))}
            </div>
          )}
        </div>
      )}

      {noeudSélectionné && !rattachement && !liaison && (
        <div style={{ position: 'absolute', left: '8px', right: '8px', bottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          {paletteOuverte && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '10px 12px', marginBottom: '6px', boxShadow: '0 6px 20px rgba(0,0,0,.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {[null, ...PALETTE].map(c => (
                  <button key={c || 'défaut'} onClick={() => changerCouleur(noeudSélectionné.id, c)} aria-label={c ? `Couleur ${c}` : 'Couleur par défaut'} style={{
                    width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', background: c || 'transparent',
                    border: c ? `3px solid ${noeudSélectionné.couleur === c ? T.text : 'transparent'}` : `2px dashed ${T.textMuted}`,
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TAILLES_BULLES.map(t => {
                  const actif = (noeudSélectionné.taille || 'normale') === t.id
                  return (
                    <button key={t.id} onClick={() => changerChamp(noeudSélectionné.id, 'taille', t.id === 'normale' ? null : t.id)} aria-pressed={actif} aria-label={`Taille ${t.nom}`} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', padding: '6px 2px', borderRadius: '10px', cursor: 'pointer',
                      background: actif ? T.accent : T.surface2, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}`,
                      fontFamily: grotesk, fontSize: '10.5px', fontWeight: 600,
                    }}><span style={{ fontSize: `${12 * t.facteur}px`, fontFamily: serif, fontWeight: 700, lineHeight: 1 }}>A</span>{t.nom}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {FORMES.map(f => {
                  const actif = (noeudSélectionné.forme || 'arrondi') === f.id
                  return (
                    <button key={f.id} onClick={() => changerChamp(noeudSélectionné.id, 'forme', f.id === 'arrondi' ? null : f.id)} aria-pressed={actif} aria-label={`Forme ${f.nom}`} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 2px', borderRadius: '10px', cursor: 'pointer',
                      background: actif ? T.accent : T.surface2, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}`,
                      fontFamily: grotesk, fontSize: '10.5px', fontWeight: 600,
                    }}><span style={{ fontSize: '17px', lineHeight: 1 }}>{f.symbole}</span>{f.nom}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                {[{ emoji: null, nom: 'Sans icône' }, ...ICÔNES].map(i => {
                  const actif = (noeudSélectionné.icone || null) === i.emoji
                  return (
                    <button key={i.emoji || 'aucune'} onClick={() => changerChamp(noeudSélectionné.id, 'icone', i.emoji)} aria-pressed={actif} aria-label={`Icône ${i.nom}`} title={i.nom} style={{
                      width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', fontSize: '16px', padding: 0, flexShrink: 0,
                      background: actif ? `${T.accent}33` : 'transparent', border: `1.5px ${i.emoji ? 'solid' : 'dashed'} ${actif ? T.accent : i.emoji ? 'transparent' : T.textMuted}`,
                      color: T.textMuted,
                    }}>{i.emoji || '∅'}</button>
                  )
                })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-around', overflowX: 'auto', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '6px 4px', boxShadow: '0 6px 20px rgba(0,0,0,.3)' }}>
            <button onClick={() => ajouterEnfant(noeudSélectionné.id)} style={action()}><span style={{ fontSize: '18px' }}>➕</span>Enfant</button>
            <button onClick={() => setÉdition(éditionBulle(noeudSélectionné))} style={action()}><span style={{ fontSize: '18px' }}>✏️</span>Texte</button>
            <button onClick={() => setÉdition(éditionBulle(noeudSélectionné, true))} style={action()}><span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'ui-monospace, Menlo, monospace', lineHeight: '22px' }}>&lt;/&gt;</span>Code</button>
            <button onClick={() => setPaletteOuverte(o => !o)} style={action()}><span style={{ fontSize: '18px' }}>🎨</span>Style</button>
            <button onClick={() => { setLiaison(true); setPaletteOuverte(false) }} style={action()}><span style={{ fontSize: '18px' }}>🔗</span>Lier</button>
            <button onClick={() => { setRattachement(true); setPaletteOuverte(false) }} style={action()}><span style={{ fontSize: '18px' }}>🌳</span>Parent</button>
            {noeuds.some(n => n.parentId === noeudSélectionné.id) && (
              <button onClick={() => basculerRepli(noeudSélectionné.id)} style={action()}>
                <span style={{ fontSize: '18px' }}>{noeudSélectionné.replié ? '📂' : '📁'}</span>{noeudSélectionné.replié ? 'Déplier' : 'Replier'}
              </button>
            )}
            <button onClick={() => changerChamp(noeudSélectionné.id, 'verrouillé', !noeudSélectionné.verrouillé)} aria-pressed={!!noeudSélectionné.verrouillé}
              title={noeudSélectionné.verrouillé ? 'Déverrouiller la position' : 'Verrouiller la position (même avec Ranger)'}
              style={{ ...action(), color: noeudSélectionné.verrouillé ? T.accent : T.text }}>
              <span style={{ fontSize: '18px' }}>{noeudSélectionné.verrouillé ? '🔒' : '🔓'}</span>Verrou
            </button>
            <button onClick={() => supprimerNoeud(noeudSélectionné.id)} style={action(true)}><span style={{ fontSize: '18px' }}>🗑️</span>Suppr.</button>
          </div>
        </div>
      )}

      {/* Barre d'actions d'un trait sélectionné */}
      {traitChoisi && (() => {
        const lien = traitChoisi.type === 'lien' ? liens.find(l => l.id === traitChoisi.id) : null
        const enfant = traitChoisi.type === 'branche' ? parId.get(traitChoisi.id) : null
        const [a, b] = lien ? [parId.get(lien.de), parId.get(lien.vers)] : enfant ? [parId.get(enfant.parentId), enfant] : []
        if (!a || !b) return null
        const sens = lien?.sens || 'aucun'
        return (
          <div style={{ position: 'absolute', left: '8px', right: '8px', bottom: 'max(8px, env(safe-area-inset-bottom))', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '10px 12px', boxShadow: '0 6px 20px rgba(0,0,0,.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: T.text, lineHeight: 1.4 }}>
              {lien ? 'Lien' : 'Branche'} : <strong>{court(a)}</strong> {lien ? { aucun: '—', vers: '→', deux: '↔' }[sens] : '→'} <strong>{court(b)}</strong>
              {lien?.texte ? <span style={{ color: T.textMuted }}> « {lien.texte} »</span> : null}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {lien && (
                <>
                  <div style={{ display: 'flex', background: T.surface2, borderRadius: '10px', padding: '2px' }}>
                    {SENS.map(([id, symbole, titre]) => (
                      <button key={id} onClick={() => choisirSens(lien, id)} title={titre} aria-label={titre} aria-pressed={sens === id} style={{
                        width: '36px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700,
                        background: sens === id ? T.accent : 'transparent', color: sens === id ? T.accentText : T.text,
                      }}>{symbole}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', background: T.surface2, borderRadius: '10px', padding: '2px' }} role="group" aria-label="Tracé du lien">
                    {TRACÉS.map(t => {
                      const actif = (lien.tracé || 'courbe') === t.id
                      return (
                        <button key={t.id} onClick={() => majLien(lien.id, l => { const maj = { ...l, tracé: t.id }; if (t.id === 'courbe') delete maj.tracé; return maj })}
                          title={`Tracé ${t.nom.toLowerCase()}`} aria-label={`Tracé ${t.nom.toLowerCase()}`} aria-pressed={actif} style={{
                            width: '36px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 700,
                            background: actif ? T.accent : 'transparent', color: actif ? T.accentText : T.text,
                          }}>{t.symbole}</button>
                      )
                    })}
                  </div>
                  <button onClick={() => setÉdition({ type: 'lien', id: lien.id, texte: lien.texte || '' })} style={{ background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '8px 10px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk }}>🏷️ Texte</button>
                </>
              )}
              <button
                onClick={() => { if (lien) supprimerLien(lien.id); else détacher(enfant.id); setTraitChoisi(null) }}
                style={{ marginLeft: 'auto', background: T.danger, color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: grotesk }}
              >{lien ? 'Supprimer' : 'Détacher'}</button>
            </div>
          </div>
        )
      })()}

      {graphe && noeuds.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <p style={{ color: T.textMuted, fontSize: '13px' }}>Graphe vide — « ＋ Bulle » pour commencer.</p>
        </div>
      )}
      </>)}

      {présentation && (
        <>
          <div style={{ position: 'absolute', top: 'max(12px, env(safe-area-inset-top))', left: '14px', right: '60px', color: T.textMuted, fontFamily: serif, fontStyle: 'italic', fontSize: '17px', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {graphe?.nom}
          </div>
          <button onClick={quitterPrésentation} aria-label="Quitter la présentation" title="Quitter (Échap)" style={{ ...boutonFlottant(), position: 'absolute', top: 'max(10px, env(safe-area-inset-top))', right: '10px' }}>✕</button>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'max(14px, env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: '8px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '6px', boxShadow: '0 6px 20px rgba(0,0,0,.35)' }}>
            <button onClick={() => allerÀÉtape(présentation.étape - 1)} disabled={présentation.étape === 0} aria-label="Bulle précédente" style={boutonFlottant(présentation.étape === 0)}>◀</button>
            <span aria-live="polite" style={{ minWidth: '64px', textAlign: 'center', whiteSpace: 'nowrap', padding: '0 4px', fontFamily: grotesk, fontWeight: 700, fontSize: '13px', color: T.text }}>
              {présentation.étape >= ordre.length ? 'Vue d\'ensemble' : `${présentation.étape + 1} / ${ordre.length}`}
            </span>
            <button onClick={() => allerÀÉtape(présentation.étape + 1)} disabled={présentation.étape >= ordre.length} aria-label="Bulle suivante" style={{ ...boutonFlottant(présentation.étape >= ordre.length), background: T.accent, color: T.accentText, border: 'none' }}>▶</button>
            <button onClick={() => allerÀÉtape(présentation.étape >= ordre.length ? 0 : ordre.length)} title={présentation.étape >= ordre.length ? 'Recommencer' : 'Tout montrer'} aria-label={présentation.étape >= ordre.length ? 'Recommencer' : 'Tout montrer'} style={{ ...boutonFlottant(), fontSize: '15px' }}>
              {présentation.étape >= ordre.length ? '↺' : '⤢'}
            </button>
          </div>
          {présentation.étape === 0 && (
            <p style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(max(14px, env(safe-area-inset-bottom)) + 62px)', textAlign: 'center', color: T.textMuted, fontSize: '12px', margin: 0, pointerEvents: 'none' }}>
              Touche l'écran ou → pour dévoiler la suite · bord gauche ou ← pour revenir
            </p>
          )}
        </>
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
              Crée un graphe : une bulle centrale, puis des bulles enfants que tu relies, déplaces et colores comme tu veux — ou pars d'un modèle.
            </p>
            <button onClick={() => setCréation(true)} style={{ background: T.accent, color: T.accentText, border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: grotesk }}>
              ＋ Créer mon premier graphe
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <SélecteurGraphes
                T={T}
                graphes={data.graphes}
                actuelId={graphe?.id}
                onChoisir={id => { setGrapheId(id); oublierSélection(); setRecherche(null) }}
                onCréer={créerGraphe}
                actions={[
                  { icône: '☰', libellé: 'Séparer les arbres', actif: !!graphe?.séparer, onClick: basculerSéparer },
                  { icône: '📝', libellé: 'Voir et copier le plan (texte)', onClick: () => setDialoguePlan('voir') },
                  { icône: '📋', libellé: 'Coller un plan ou une liste', onClick: () => setDialoguePlan('coller') },
                  { icône: '🕓', libellé: 'Versions précédentes', onClick: () => setVersionsOuvertes(true) },
                ]}
              />
              <BoutonIcone icon="crayon" title="Renommer le graphe" onClick={renommerGraphe} />
              <BoutonIcone icon="corbeille" title="Supprimer le graphe" couleur={T.danger} onClick={supprimerGraphe} />
              <button onClick={démarrerPrésentation} disabled={noeuds.length === 0} title="Présenter le graphe bulle par bulle" style={{
                flexShrink: 0, background: T.accent, color: T.accentText, border: 'none', borderRadius: '10px', padding: '9px 11px',
                fontSize: '12.5px', fontWeight: 700, fontFamily: grotesk, cursor: 'pointer', opacity: noeuds.length === 0 ? 0.4 : 1,
              }}>▶ Présenter</button>
            </div>
            {canevas}
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: T.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
              Touche une bulle pour la choisir, retouche-la pour écrire. Touche un trait pour lui donner un texte, une flèche ou le retirer. Glisse les bulles ou le fond ; pince pour zoomer ; ↩︎ annule. Plusieurs bulles : ⬚, ou Maj + glisser / Maj + clic à la souris (Ctrl+A : toutes). Clavier : Tab sous-bulle, Entrée bulle suivante, flèches, Suppr, Ctrl+C / V / D.
            </p>
            {graphe && (
              <SectionsGraphe
                T={T}
                sections={graphe.sections || []}
                onChanger={fn => majGraphe(g => ({ ...g, sections: fn(g.sections || []) }))}
              />
            )}
          </>
        )}
      </div>

      {création && <DialogueCréation T={T} onCréer={créerGraphe} onFermer={() => setCréation(false)} />}
      {dialoguePlan && graphe && (
        <DialoguePlan
          T={T}
          mode={dialoguePlan}
          plan={planTexte(noeuds)}
          onCréer={texte => { insérer(analyserPlan(texte), 'créée(s) depuis le plan'); setDialoguePlan(null) }}
          onFermer={() => setDialoguePlan(null)}
        />
      )}
      {versionsOuvertes && graphe && (
        <DialogueVersions
          T={T}
          token={token}
          chemin={config.chemin}
          graphe={graphe}
          onRestaurer={(version, commeCopie) => {
            mémoriser()
            setData(d => ({
              ...d,
              graphes: commeCopie
                ? [...d.graphes, { ...version, id: uid(), nom: `${version.nom} (${commeCopie})` }]
                : d.graphes.map(g => (g.id === version.id ? version : g)),
            }))
            setVersionsOuvertes(false)
            oublierSélection()
            afficher(commeCopie ? 'Version ajoutée comme nouveau graphe' : 'Version restaurée (↩︎ pour annuler)')
          }}
          onFermer={() => setVersionsOuvertes(false)}
        />
      )}

      {édition && (
        <div role="dialog" aria-label={édition.type === 'lien' ? 'Texte du lien' : 'Texte de la bulle'}
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); annulerÉdition() } }}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px', marginTop: 'max(10px, env(safe-area-inset-top))' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>
              {édition.type === 'lien' ? 'Texte du lien' : 'Texte de la bulle'}
            </p>
            {édition.type === 'lien' ? (
              <>
                <input
                  autoFocus
                  value={édition.texte}
                  onChange={e => setÉdition(é => ({ ...é, texte: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') validerÉdition() }}
                  placeholder="cause, exemple, s'oppose à…"
                  style={{ width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px', fontSize: '15px', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {ÉTIQUETTES_LIENS.map(t => (
                    <button key={t} onClick={() => setÉdition(é => ({ ...é, texte: t }))} style={{
                      padding: '6px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '12.5px', fontFamily: grotesk, fontWeight: 600,
                      background: édition.texte === t ? T.accent : T.surface2, color: édition.texte === t ? T.accentText : T.text, border: `1px solid ${T.border}`,
                    }}>{t}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <textarea
                  autoFocus={!édition.focusCode}
                  value={édition.texte}
                  onChange={e => setÉdition(é => ({ ...é, texte: e.target.value }))}
                  onKeyDown={toucheSaisie}
                  placeholder="Écris ton idée… (**gras** possible)"
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }}
                />
                <ChampImage image={édition.image} onChange={image => setÉdition(é => ({ ...é, image }))} token={token} libellé="Ajouter une image" />
                <ChampCode T={T} édition={édition} setÉdition={setÉdition} />
                {édition.clavier && (
                  <p style={{ margin: '10px 0 0', fontSize: '11px', color: T.textMuted, lineHeight: 1.6 }}>
                    <strong>Entrée</strong> bulle suivante · <strong>Tab</strong> sous-bulle · <strong>Maj+Tab</strong> niveau au-dessus ·{' '}
                    <strong>Entrée</strong> sur une bulle vide : terminer · <strong>Maj+Entrée</strong> retour à la ligne · <strong>Échap</strong> annuler cette bulle
                  </p>
                )}
              </>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={annulerÉdition} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: grotesk, fontWeight: 600 }}>Annuler</button>
              <button onClick={validerÉdition} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: T.accent, color: T.accentText, border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700 }}>Valider</button>
            </div>
          </div>
        </div>
      )}

      {agrandie && parId.get(agrandie) && <VueAgrandie T={T} noeud={parId.get(agrandie)} onFermer={() => setAgrandie(null)} />}

      {exportÉtat?.url && (
        <div role="dialog" aria-label="Image du graphe" style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '20px 16px' }}>
          <img src={exportÉtat.url} alt={`Graphe « ${exportÉtat.nom} »`} style={{ maxWidth: '100%', maxHeight: '65dvh', borderRadius: '12px', background: T.bg, objectFit: 'contain' }} />
          <p style={{ margin: 0, color: '#d0d0d0', fontSize: '12px', textAlign: 'center', lineHeight: 1.5, maxWidth: '420px' }}>
            Sur iPhone : appui long sur l'image → « Enregistrer dans Photos », ou « Partager ».
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {partagePossible && (
              <button onClick={() => navigator.share({ files: [fichierExport], title: exportÉtat.nom }).catch(() => {})} style={{ padding: '11px 16px', borderRadius: '12px', background: T.accent, color: T.accentText, border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700 }}>Partager</button>
            )}
            <a href={exportÉtat.url} download={`${exportÉtat.nom}.png`} style={{ padding: '11px 16px', borderRadius: '12px', background: partagePossible ? '#2c2c2e' : T.accent, color: partagePossible ? '#fff' : T.accentText, fontFamily: grotesk, fontWeight: 700, textDecoration: 'none' }}>Télécharger</a>
            <button onClick={fermerExport} style={{ padding: '11px 16px', borderRadius: '12px', background: '#2c2c2e', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 600 }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Création d'un graphe : nom + choix d'un modèle de départ.
function DialogueCréation({ T, onCréer, onFermer }) {
  const [nom, setNom] = useState('')
  const [modèleId, setModèleId] = useState('vide')
  const modèle = MODÈLES.find(m => m.id === modèleId)
  const valider = () => onCréer(nom.trim() || (modèleId === 'vide' ? 'Nouveau graphe' : modèle.nom), modèleId)
  return (
    <div role="dialog" aria-label="Nouveau graphe" onKeyDown={e => { if (e.key === 'Escape') onFermer() }} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '16px', marginTop: 'max(10px, env(safe-area-inset-top))' }}>
        <p style={{ margin: '0 0 8px', fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>Nouveau graphe</p>
        <input
          autoFocus
          value={nom}
          onChange={e => setNom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') valider() }}
          placeholder="Nom (devient la bulle centrale)"
          aria-label="Nom du graphe"
          style={{ width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px', fontSize: '15px', fontFamily: 'inherit', marginBottom: '12px' }}
        />
        <p style={{ margin: '0 0 8px', fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>Modèle</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
          {MODÈLES.map(m => {
            const actif = m.id === modèleId
            return (
              <button key={m.id} onClick={() => setModèleId(m.id)} aria-pressed={actif} style={{
                textAlign: 'left', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                background: actif ? `${T.accent}22` : T.surface2, border: `2px solid ${actif ? T.accent : T.border}`, color: T.text,
              }}>
                <span style={{ fontSize: '20px' }}>{m.emoji}</span>
                <strong style={{ display: 'block', fontSize: '13px', margin: '4px 0 2px', fontFamily: grotesk }}>{m.nom}</strong>
                <span style={{ fontSize: '11px', color: T.textMuted, lineHeight: 1.35 }}>{m.description}</span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <button onClick={onFermer} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: grotesk, fontWeight: 600 }}>Annuler</button>
          <button onClick={valider} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: T.accent, color: T.accentText, border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700 }}>Créer</button>
        </div>
      </div>
    </div>
  )
}

// Liste déroulante des graphes : passer de l'un à l'autre, ou en créer un
// nouveau avec son libellé (et un modèle de départ).
function SélecteurGraphes({ T, graphes, actuelId, onChoisir, onCréer, actions = [] }) {
  const [ouvert, setOuvert] = useState(false)
  const [nom, setNom] = useState('')
  const [modèleId, setModèleId] = useState('vide')
  const actuel = graphes.find(g => g.id === actuelId)
  const fermer = () => { setOuvert(false); setNom(''); setModèleId('vide') }
  const créer = () => {
    const libellé = nom.trim()
    if (!libellé) return
    onCréer(libellé, modèleId)
    fermer()
  }
  const titre = { margin: '6px 8px', fontSize: '10.5px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk, fontWeight: 600 }
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <button
        onClick={() => (ouvert ? fermer() : setOuvert(true))}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label="Choisir ou créer un graphe"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: T.text,
          background: T.surface, border: `1px solid ${ouvert ? T.accent : T.border}`, borderRadius: '10px', padding: '9px 10px', fontFamily: grotesk, cursor: 'pointer',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{actuel?.nom || 'Graphe'}</span>
        <Icon nom="chevronBas" taille={14} style={{ flexShrink: 0, color: T.textMuted, transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {ouvert && (
        <>
          <div onClick={fermer} style={{ position: 'fixed', inset: 0, zIndex: 900 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 'min(360px, calc(100vw - 32px))', zIndex: 901,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '6px', boxShadow: '0 12px 32px rgba(0,0,0,.4)',
            maxHeight: '70dvh', overflowY: 'auto',
          }}>
            <p style={titre}>Mes graphes ({graphes.length})</p>
            <div role="listbox" aria-label="Mes graphes">
              {graphes.map(g => {
                const actif = g.id === actuelId
                return (
                  <button key={g.id} role="option" aria-selected={actif} onClick={() => { onChoisir(g.id); fermer() }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', cursor: 'pointer',
                    background: actif ? `${T.accent}22` : 'transparent', border: 'none', color: T.text, fontFamily: grotesk, fontSize: '14px', textAlign: 'left',
                  }}>
                    <span style={{ width: '16px', color: T.accent, fontWeight: 800 }}>{actif ? '✓' : ''}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: actif ? 700 : 500 }}>{g.nom}</span>
                    <span style={{ fontSize: '11.5px', color: T.textMuted, flexShrink: 0 }}>{g.noeuds.length} bulle{g.noeuds.length > 1 ? 's' : ''}</span>
                  </button>
                )
              })}
            </div>
            {actions.length > 0 && (
              <>
                <div style={{ height: '1px', background: T.border, margin: '6px 4px' }} />
                <p style={titre}>Ce graphe</p>
                {actions.map(a => (
                  <button key={a.libellé} onClick={() => { a.onClick(); fermer() }} aria-pressed={a.actif} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '10px', cursor: 'pointer',
                    background: 'transparent', border: 'none', color: T.text, fontFamily: grotesk, fontSize: '13.5px', textAlign: 'left',
                  }}>
                    <span style={{ width: '18px', textAlign: 'center' }}>{a.icône}</span>
                    <span style={{ flex: 1 }}>{a.libellé}</span>
                    {a.actif !== undefined && <span style={{ color: a.actif ? T.accent : T.textMuted, fontWeight: 800, fontSize: '12px' }}>{a.actif ? 'Oui ✓' : 'Non'}</span>}
                  </button>
                ))}
              </>
            )}
            <div style={{ height: '1px', background: T.border, margin: '6px 4px' }} />
            <p style={titre}>＋ Nouveau graphe</p>
            <div style={{ display: 'flex', gap: '6px', padding: '0 4px' }}>
              <input
                value={nom}
                onChange={e => setNom(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') créer(); if (e.key === 'Escape') fermer() }}
                placeholder="Libellé du graphe"
                aria-label="Libellé du nouveau graphe"
                style={{ flex: 1, minWidth: 0, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '9px 10px', fontSize: '15px', fontFamily: 'inherit' }}
              />
              <button onClick={créer} disabled={!nom.trim()} style={{
                flexShrink: 0, background: T.accent, color: T.accentText, border: 'none', borderRadius: '10px', padding: '0 14px',
                fontWeight: 700, fontFamily: grotesk, cursor: nom.trim() ? 'pointer' : 'default', opacity: nom.trim() ? 1 : 0.45,
              }}>Créer</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 4px 4px' }}>
              {MODÈLES.map(m => {
                const actif = m.id === modèleId
                return (
                  <button key={m.id} onClick={() => setModèleId(m.id)} aria-pressed={actif} title={m.description} style={{
                    padding: '5px 9px', borderRadius: '20px', cursor: 'pointer', fontSize: '11.5px', fontFamily: grotesk, fontWeight: 600,
                    background: actif ? T.accent : T.surface2, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}`,
                  }}>{m.emoji} {m.nom}</button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const POLICE_CODE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const LIGNES_CODE_MAX = 14
function lignesVisibles(code) {
  const lignes = code.replace(/\t/g, '  ').split('\n')
  return { lignes: lignes.slice(0, LIGNES_CODE_MAX), reste: Math.max(0, lignes.length - LIGNES_CODE_MAX) }
}

// Bloc de code affiché dans une bulle (les lignes trop longues sont coupées,
// le code complet se lit avec ⤢).
function CodeDansBulle({ code, langage, f }) {
  const { lignes, reste } = lignesVisibles(code)
  return (
    <pre style={{
      margin: `${6 * f}px 0 0`, padding: `${8 * f}px ${10 * f}px`, borderRadius: `${8 * f}px`, background: '#0d0f14', color: '#e2e8f0',
      fontFamily: POLICE_CODE, fontSize: `${11.5 * f}px`, lineHeight: 1.5, fontWeight: 400, textAlign: 'left',
      whiteSpace: 'pre', overflow: 'hidden', maxWidth: '100%', pointerEvents: 'none',
    }}>
      {langage && <span style={{ display: 'block', color: '#94a3b8', fontSize: `${9.5 * f}px`, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: `${3 * f}px` }}>{langage}</span>}
      {lignes.join('\n')}
      {reste > 0 && <span style={{ display: 'block', color: '#94a3b8', marginTop: `${3 * f}px` }}>… +{reste} ligne{reste > 1 ? 's' : ''}</span>}
    </pre>
  )
}

const LANGAGES = ['JavaScript', 'Python', 'HTML', 'CSS', 'SQL', 'Java', 'C#', 'PHP', 'Bash', 'JSON']

// Section « Code » de la fenêtre de saisie d'une bulle.
function ChampCode({ T, édition, setÉdition }) {
  const zone = useRef(null)
  useEffect(() => {
    if (édition.focusCode) zone.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const petit = {
    fontSize: '11.5px', fontFamily: grotesk, fontWeight: 600, padding: '5px 10px', borderRadius: '20px',
    background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer',
  }
  if (édition.code === null) {
    return (
      <div style={{ marginTop: '6px' }}>
        <button type="button" onClick={() => setÉdition(é => ({ ...é, code: '', focusCode: true }))} style={petit}>&lt;/&gt; Ajouter du code</button>
      </div>
    )
  }
  // Tab insère deux espaces au lieu de quitter le champ.
  const surTouche = e => {
    if (e.key !== 'Tab' || e.shiftKey) return
    e.preventDefault()
    // insertText garde le curseur au bon endroit (et l'annulation du clavier).
    if (document.execCommand?.('insertText', false, '  ')) return
    const el = e.currentTarget
    const { selectionStart: début, selectionEnd: fin, value } = el
    el.value = `${value.slice(0, début)}  ${value.slice(fin)}`
    el.selectionStart = el.selectionEnd = début + 2
    setÉdition(é => ({ ...é, code: el.value }))
  }
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk, flex: 1 }}>&lt;/&gt; Code</span>
        <select value={édition.langage} onChange={e => setÉdition(é => ({ ...é, langage: e.target.value }))} aria-label="Langage du code" style={{
          fontSize: '12px', fontFamily: grotesk, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '4px 6px',
        }}>
          <option value="">Langage…</option>
          {LANGAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button type="button" onClick={() => setÉdition(é => ({ ...é, code: null, langage: '' }))} style={{ ...petit, color: T.danger }}>Retirer</button>
      </div>
      <textarea
        ref={zone}
        value={édition.code}
        onChange={e => setÉdition(é => ({ ...é, code: e.target.value }))}
        onKeyDown={surTouche}
        placeholder="Colle ou écris ton code ici…"
        aria-label="Code de la bulle"
        rows={7}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        style={{
          width: '100%', boxSizing: 'border-box', background: '#0d0f14', color: '#e2e8f0', border: `1px solid ${T.border}`, borderRadius: '10px',
          padding: '10px', fontSize: '13px', fontFamily: POLICE_CODE, lineHeight: 1.5, resize: 'vertical', whiteSpace: 'pre', overflowX: 'auto',
        }}
      />
    </div>
  )
}

// Image et code d'une bulle en grand, par-dessus tout.
function VueAgrandie({ T, noeud, onFermer }) {
  const [zoom, setZoom] = useState(false)
  useEffect(() => {
    const surTouche = e => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])
  return (
    <div role="dialog" aria-label="Bulle en grand" style={{ position: 'fixed', inset: 0, zIndex: 1300, background: '#0b0b0c', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: 'max(12px, env(safe-area-inset-top)) 14px 10px' }}>
        <p style={{ flex: 1, margin: 0, color: '#f5f5f5', fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {noeud.icone ? `${noeud.icone} ` : ''}{texteBrut(noeud.texte)}
        </p>
        {noeud.image && (
          <button onClick={() => setZoom(z => !z)} aria-pressed={zoom} style={{ padding: '8px 12px', borderRadius: '10px', background: zoom ? T.accent : '#2c2c2e', color: zoom ? T.accentText : '#fff', border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: '12.5px' }}>
            {zoom ? '🔍 Ajuster' : '🔍 Zoom ×2'}
          </button>
        )}
        <button onClick={onFermer} aria-label="Fermer" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#2c2c2e', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '17px' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 14px max(16px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: zoom ? 'flex-start' : 'center' }}>
        {noeud.image && (
          <img
            src={adresseImage(noeud.image)}
            alt={texteBrut(noeud.texte)}
            onClick={() => setZoom(z => !z)}
            style={zoom
              ? { width: '200%', maxWidth: 'none', borderRadius: '10px', cursor: 'zoom-out', flexShrink: 0 }
              : { width: '100%', maxWidth: '900px', maxHeight: noeud.code ? '45dvh' : '78dvh', objectFit: 'contain', borderRadius: '10px', cursor: 'zoom-in', flexShrink: 0 }}
          />
        )}
        {noeud.code && (
          <div style={{ width: '100%', maxWidth: '900px', alignSelf: 'center' }}>
            {noeud.langage && <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>{noeud.langage}</p>}
            <CodeBlock code={noeud.code} />
          </div>
        )}
      </div>
    </div>
  )
}

// Petites icônes des boutons Aligner / Répartir.
function IcôneAlign({ type }) {
  const c = 'currentColor'
  const formes = {
    gauche: <><line x1="3" y1="2" x2="3" y2="16" stroke={c} strokeWidth="1.6" /><rect x="5" y="4" width="10" height="3.5" rx="1" fill={c} /><rect x="5" y="10.5" width="6" height="3.5" rx="1" fill={c} /></>,
    centre: <><line x1="9" y1="2" x2="9" y2="16" stroke={c} strokeWidth="1.2" strokeDasharray="2 1.5" /><rect x="3" y="4" width="12" height="3.5" rx="1" fill={c} /><rect x="5.5" y="10.5" width="7" height="3.5" rx="1" fill={c} /></>,
    haut: <><line x1="2" y1="3" x2="16" y2="3" stroke={c} strokeWidth="1.6" /><rect x="4" y="5" width="3.5" height="10" rx="1" fill={c} /><rect x="10.5" y="5" width="3.5" height="6" rx="1" fill={c} /></>,
    milieu: <><line x1="2" y1="9" x2="16" y2="9" stroke={c} strokeWidth="1.2" strokeDasharray="2 1.5" /><rect x="4" y="3" width="3.5" height="12" rx="1" fill={c} /><rect x="10.5" y="5.5" width="3.5" height="7" rx="1" fill={c} /></>,
    répartirH: <><rect x="1.5" y="5" width="3.5" height="8" rx="1" fill={c} /><rect x="7.25" y="5" width="3.5" height="8" rx="1" fill={c} /><rect x="13" y="5" width="3.5" height="8" rx="1" fill={c} /></>,
    répartirV: <><rect x="5" y="1.5" width="8" height="3.5" rx="1" fill={c} /><rect x="5" y="7.25" width="8" height="3.5" rx="1" fill={c} /><rect x="5" y="13" width="8" height="3.5" rx="1" fill={c} /></>,
  }
  return <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">{formes[type]}</svg>
}

// Plan du graphe en texte : à lire et copier, ou à coller pour créer des bulles.
function DialoguePlan({ T, mode, plan, onCréer, onFermer }) {
  const [texte, setTexte] = useState(mode === 'voir' ? plan : '')
  const [copié, setCopié] = useState(false)
  const lecture = mode === 'voir'
  const copier = async () => {
    try { await navigator.clipboard.writeText(texte); setCopié(true); setTimeout(() => setCopié(false), 1500) } catch { /* sélection manuelle */ }
  }
  const bouton = principal => ({
    flex: principal ? 2 : 1, padding: '11px', borderRadius: '10px', cursor: 'pointer', fontFamily: grotesk, fontWeight: principal ? 700 : 600,
    background: principal ? T.accent : T.surface2, color: principal ? T.accentText : T.text, border: principal ? 'none' : `1px solid ${T.border}`,
  })
  return (
    <div role="dialog" aria-label={lecture ? 'Plan du graphe' : 'Coller un plan'} onKeyDown={e => { if (e.key === 'Escape') onFermer() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '560px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px', marginTop: 'max(10px, env(safe-area-inset-top))' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>
          {lecture ? '📝 Plan du graphe' : '📋 Coller un plan ou une liste'}
        </p>
        <p style={{ margin: '0 0 10px', fontSize: '12px', color: T.textMuted, lineHeight: 1.5 }}>
          {lecture
            ? 'À copier dans Notes, un mail… Une ligne vide sépare les arbres.'
            : 'Une ligne = une bulle. Les retraits (espaces, tabulations), la numérotation (I. A. 1. a)) ou les titres # donnent les sous-bulles. Une bulle choisie avant reçoit le plan comme sous-bulles.'}
        </p>
        <textarea
          autoFocus
          value={texte}
          readOnly={lecture}
          onChange={e => setTexte(e.target.value)}
          onFocus={e => { if (lecture) e.target.select() }}
          placeholder={'Exposé\n  I. Introduction\n    A. Accroche\n  II. Développement'}
          rows={12}
          spellCheck={!lecture}
          style={{ width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px', fontSize: '13.5px', fontFamily: 'ui-monospace, Menlo, monospace', lineHeight: 1.55, resize: 'vertical', whiteSpace: 'pre', overflowX: 'auto' }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button onClick={onFermer} style={bouton(false)}>{lecture ? 'Fermer' : 'Annuler'}</button>
          {lecture
            ? <button onClick={copier} style={bouton(true)}>{copié ? '✓ Copié' : '📄 Copier le plan'}</button>
            : <button onClick={() => onCréer(texte)} disabled={!texte.trim()} style={{ ...bouton(true), opacity: texte.trim() ? 1 : 0.45 }}>Créer les bulles</button>}
        </div>
      </div>
    </div>
  )
}

// Versions précédentes du fichier (historique GitHub) : aperçu d'un graphe
// à une date, puis restauration ou copie.
function DialogueVersions({ T, token, chemin, graphe, onRestaurer, onFermer }) {
  const [versions, setVersions] = useState(null)
  const [erreur, setErreur] = useState('')
  const [choisie, setChoisie] = useState(null) // { sha, date, graphe | null, chargement }
  useEffect(() => {
    let annulé = false
    listerVersions(token, chemin)
      .then(v => { if (!annulé) setVersions(v) })
      .catch(err => { if (!annulé) setErreur(err.message) })
    return () => { annulé = true }
  }, [token, chemin])
  const date = d => new Date(d).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const ouvrir = async v => {
    setChoisie({ ...v, chargement: true })
    try {
      const contenu = await lireVersion(token, chemin, v.sha)
      const g = (contenu?.graphes || []).find(x => x.id === graphe.id) || null
      setChoisie({ ...v, graphe: g ? { ...g, noeuds: g.noeuds || [], liens: g.liens || [] } : null, autres: (contenu?.graphes || []).length })
    } catch (err) {
      setChoisie(null)
      setErreur(err.message)
    }
  }
  const bouton = principal => ({
    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontFamily: grotesk, fontWeight: principal ? 700 : 600, fontSize: '13px',
    background: principal ? T.accent : T.surface2, color: principal ? T.accentText : T.text, border: principal ? 'none' : `1px solid ${T.border}`,
  })
  return (
    <div role="dialog" aria-label="Versions précédentes" onKeyDown={e => { if (e.key === 'Escape') onFermer() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px', marginTop: 'max(10px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <p style={{ flex: 1, margin: 0, fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>🕓 Versions de « {graphe.nom} »</p>
          <button onClick={onFermer} aria-label="Fermer" style={{ background: 'transparent', border: 'none', color: T.textMuted, fontSize: '17px', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '12px', color: T.textMuted, lineHeight: 1.5 }}>
          Chaque enregistrement sur GitHub est une version. Choisis une date pour voir le graphe tel qu'il était.
        </p>
        {erreur && <p style={{ color: T.danger, fontSize: '13px' }}>{erreur}</p>}
        {!versions && !erreur && <p style={{ color: T.textMuted, fontSize: '13px' }}>Chargement de l'historique…</p>}
        {choisie && (
          <div style={{ background: T.surface2, border: `1px solid ${T.accent}`, borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '13.5px', color: T.text }}>{date(choisie.date)}</p>
            {choisie.chargement ? <p style={{ margin: 0, fontSize: '12.5px', color: T.textMuted }}>Lecture de la version…</p>
              : choisie.graphe ? (
                <>
                  <p style={{ margin: '0 0 6px', fontSize: '12.5px', color: T.textMuted }}>
                    {choisie.graphe.noeuds.length} bulle(s) à cette date (aujourd'hui : {graphe.noeuds.length})
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: T.text, lineHeight: 1.5, maxHeight: '90px', overflow: 'hidden' }}>
                    {choisie.graphe.noeuds.slice(0, 14).map(n => texteBrut(n.texte)).join(' · ')}{choisie.graphe.noeuds.length > 14 ? ' …' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => onRestaurer(choisie.graphe, false)} style={bouton(true)}>↺ Remplacer le graphe actuel</button>
                    <button onClick={() => onRestaurer(choisie.graphe, `version du ${date(choisie.date)}`)} style={bouton(false)}>⧉ Ouvrir comme copie</button>
                  </div>
                </>
              ) : <p style={{ margin: 0, fontSize: '12.5px', color: T.textMuted }}>Ce graphe n'existait pas encore à cette date.</p>}
          </div>
        )}
        {versions && versions.length === 0 && <p style={{ color: T.textMuted, fontSize: '13px' }}>Aucune version enregistrée pour l'instant.</p>}
        <div style={{ maxHeight: '50dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {versions?.map((v, i) => (
            <button key={v.sha} onClick={() => ouvrir(v)} aria-pressed={choisie?.sha === v.sha} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
              background: choisie?.sha === v.sha ? `${T.accent}22` : 'transparent', border: 'none', color: T.text, fontFamily: grotesk, fontSize: '13.5px',
            }}>
              <span style={{ flex: 1 }}>{date(v.date)}</span>
              {i === 0 && <span style={{ fontSize: '11px', color: T.accent, fontWeight: 700 }}>actuelle</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
