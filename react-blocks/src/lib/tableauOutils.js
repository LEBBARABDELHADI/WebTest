// Outils du « Graphe amélioré » : formes et icônes en plus, rangement en
// arbre, conversion d'un graphe, d'une note ou d'une sous-section en
// éléments du tableau, mise en forme simple du texte.
import { texteBrut } from './texteFormate'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Formes en plus (viewBox 0 0 100 100).
export const FORMES_PLUS = {
  cylindre: 'M2 14 A48 12 0 0 1 98 14 V86 A48 12 0 0 1 2 86 Z M2 14 A48 12 0 0 0 98 14',
  nuage: 'M26 84 C8 84 2 70 10 60 C2 50 10 34 26 38 C28 20 50 12 62 26 C74 14 96 24 92 44 C100 52 98 76 80 84 Z',
  flèche: 'M2 34 H62 V8 L98 50 L62 92 V66 H2 Z',
  étoile: 'M50 2 L62 36 L98 37 L69 58 L80 94 L50 72 L20 94 L31 58 L2 37 L38 36 Z',
  hexagone: 'M26 4 H74 L98 50 L74 96 H26 L2 50 Z',
  document: 'M2 2 H98 V86 C76 74 58 100 36 92 C22 87 12 84 2 90 Z',
  parallélogramme: 'M22 4 H98 L78 96 H2 Z',
}
export const NOMS_FORMES_PLUS = [['cylindre', '🛢️', 'Cylindre (base de données)'], ['nuage', '☁️', 'Nuage'], ['flèche', '➡️', 'Grosse flèche'], ['étoile', '⭐', 'Étoile'], ['hexagone', '⬡', 'Hexagone'], ['document', '📄', 'Document'], ['parallélogramme', '▱', 'Entrée / sortie']]

export const ICÔNES = [
  ['🐳', 'Docker'], ['☸️', 'Kubernetes'], ['☁️', 'AWS / Cloud'], ['🖥️', 'Serveur'], ['🗄️', 'Base de données'], ['👤', 'Utilisateur'],
  ['🌐', 'Web / CDN'], ['⚖️', 'Load balancer'], ['🔒', 'Sécurité'], ['🔑', 'Secrets / IAM'], ['📦', 'Artefact'], ['🔀', 'Git'],
  ['⚙️', 'Service'], ['📨', 'File de messages'], ['📊', 'Monitoring'], ['🧪', 'Tests'], ['🚀', 'Déploiement'], ['🪣', 'S3 / stockage'],
  ['λ', 'Lambda'], ['📱', 'Mobile'], ['💻', 'Poste'], ['🧩', 'API'], ['🔔', 'Alerte'], ['🗂️', 'Fichiers'],
]

// Rangement en arbre (de gauche à droite) des éléments reliés par des
// lignes : chaque racine garde sa place, ses descendants s'alignent.
export function rangerArbre(éléments, ids) {
  const parId = new Map(éléments.map(e => [e.id, e]))
  const garder = e => e && e.type !== 'ligne' && e.type !== 'trait' && e.type !== 'cadre' && (!ids || ids.has(e.id))
  const enfants = new Map(), aParent = new Set()
  éléments.filter(e => e.type === 'ligne' && e.de && e.vers).forEach(l => {
    const a = parId.get(l.de), b = parId.get(l.vers)
    if (!garder(a) || !garder(b) || aParent.has(b.id) || a.id === b.id) return
    if (!enfants.has(a.id)) enfants.set(a.id, [])
    enfants.get(a.id).push(b); aParent.add(b.id)
  })
  const racines = [...new Set([...enfants.keys()])].filter(id => !aParent.has(id)).map(id => parId.get(id))
  const positions = new Map()
  const vus = new Set()
  const ÉCART_X = 120, ÉCART_Y = 40
  racines.sort((a, b) => a.y - b.y).forEach(r => {
    // largeur par profondeur
    const largeurs = []
    const mesurer = (n, p) => { if (vus.has(n.id)) return; vus.add(n.id); largeurs[p] = Math.max(largeurs[p] || 0, n.l); (enfants.get(n.id) || []).forEach(c => mesurer(c, p + 1)) }
    mesurer(r, 0)
    const xDe = p => r.x + largeurs.slice(0, p).reduce((s, l) => s + l + ÉCART_X, 0)
    let curseur = 0
    const placés = []
    const placer = (n, p, chemin) => {
      if (chemin.has(n.id)) return null
      const fils = (enfants.get(n.id) || []).slice().sort((a, b) => a.y - b.y)
      const ps = fils.map(f => placer(f, p + 1, new Set([...chemin, n.id]))).filter(Boolean)
      let y
      if (!ps.length) { y = curseur; curseur += n.h + ÉCART_Y }
      else { const haut = ps[0].y, bas = ps[ps.length - 1].y + ps[ps.length - 1].h; y = (haut + bas) / 2 - n.h / 2 }
      positions.set(n.id, { x: xDe(p), y }); placés.push(n.id)
      return { y, h: n.h }
    }
    placer(r, 0, new Set())
    // la racine reste où elle était
    const dy = r.y - positions.get(r.id).y
    placés.forEach(id => { const q = positions.get(id); positions.set(id, { x: q.x, y: q.y + dy }) })
  })
  return positions
}

// Graphe (ancien Graph) → éléments du tableau.
export function grapheVersÉléments(graphe) {
  const ids = new Map((graphe.noeuds || []).map(n => [n.id, uid()]))
  const É = 1.15
  const éls = []
  ;(graphe.noeuds || []).forEach(n => {
    const racine = !n.parentId || !ids.has(n.parentId)
    const texte = `${n.icone ? `${n.icone} ` : ''}${texteBrut(n.texte || '')}`
    const base = { id: ids.get(n.id), x: n.x * É - 90, y: n.y * É - 45 }
    if (n.code) {
      éls.push({ ...base, type: 'code', l: 300, h: 160, texte: n.code, langage: n.langage || '' })
      if (texte.trim()) éls.push({ id: uid(), type: 'texte', x: base.x, y: base.y - 40, l: 300, h: 36, texte, couleur: '#1b1b1b', taille: 16, gras: true })
    } else if (n.image) {
      éls.push({ ...base, type: 'image', image: n.image, l: 220, h: 150 })
    } else {
      éls.push({ ...base, type: racine ? 'forme' : 'note', forme: 'rect', l: racine ? 200 : 180, h: racine ? 90 : 100, texte, couleur: racine ? '#fff59d' : (n.couleur ? `${n.couleur}55` : '#ffffff'), bord: '#1b1b1b', taille: 'auto', ...(racine ? { gras: true } : {}) })
    }
  })
  ;(graphe.noeuds || []).forEach(n => {
    if (n.parentId && ids.has(n.parentId)) éls.push({ id: uid(), type: 'ligne', x1: 0, y1: 0, x2: 0, y2: 0, de: ids.get(n.parentId), vers: ids.get(n.id), couleur: '#555555', épaisseur: 2, flèche: 'aucune', style: 'plein', tracé: 'courbe' })
  })
  ;(graphe.liens || []).forEach(l => {
    if (ids.has(l.de) && ids.has(l.vers)) éls.push({ id: uid(), type: 'ligne', x1: 0, y1: 0, x2: 0, y2: 0, de: ids.get(l.de), vers: ids.get(l.vers), couleur: '#3b6fd8', épaisseur: 2, flèche: l.sens === 'aucun' ? 'aucune' : l.sens === 'deux' ? 'deux' : 'fin', style: 'tirets', ...(l.texte ? { texte: l.texte } : {}) })
  })
  return éls
}

// Blocs (sous-section du graphe ou note) → éléments empilés dans un cadre.
export function blocsVersÉléments(titre, blocs) {
  const éls = []
  let y = 30
  const L = 420
  blocs.forEach(b => {
    if (b.type === 'code') { const h = Math.min(420, 40 + (b.texte || '').split('\n').length * 20); éls.push({ id: uid(), type: 'code', x: 30, y, l: L, h, texte: b.texte || '', langage: b.langage || '' }); y += h + 20 }
    else if (b.type === 'image' && b.image) { éls.push({ id: uid(), type: 'image', image: b.image, x: 30, y, l: L, h: 260 }); y += 280 }
    else if (b.type === 'tableau') { const lignes = b.lignes || []; const h = 40 + lignes.length * 34; éls.push({ id: uid(), type: 'grille', x: 30, y, l: L, h, texte: lignes.map(l => l.join(' | ')).join('\n') }); y += h + 20 }
    else {
      const texte = b.type === 'liste' ? (b.éléments || []).map(e => `[${e.fait ? 'x' : ' '}] ${e.texte}`).join('\n')
        : b.type === 'tache' ? `[${b.fait ? 'x' : ' '}] ${b.texte || ''}`
          : b.type === 'choix' ? (b.options || []).map(o => `- ${o.texte || o}`).join('\n')
            : texteBrut(b.texte ?? b.contenu ?? '')
      if (!texte.trim()) return
      const h = Math.max(90, Math.min(400, 40 + texte.split('\n').length * 26 + texte.length / 3))
      éls.push({ id: uid(), type: 'note', x: 30, y, l: L, h, texte, couleur: b.type === 'encadré' ? '#ffcc80' : '#fff59d', taille: 16 }); y += h + 20
    }
  })
  éls.unshift({ id: uid(), type: 'cadre', x: 0, y: 0, l: L + 60, h: Math.max(160, y + 10), texte: titre, couleur: '#ffffff' })
  return éls
}

// Mise en forme simple : « - » puce, « [ ] » / « [x] » case, **gras**.
export function analyserLignes(texte) {
  return (texte || '').split('\n').map((l, i) => {
    const caseM = l.match(/^\s*\[( |x|X)\]\s?(.*)$/)
    if (caseM) return { i, type: 'case', fait: caseM[1] !== ' ', texte: caseM[2] }
    const puce = l.match(/^\s*[-*•]\s+(.*)$/)
    if (puce) return { i, type: 'puce', texte: puce[1] }
    return { i, type: 'texte', texte: l }
  })
}
export function basculerCase(texte, i) {
  const lignes = (texte || '').split('\n')
  lignes[i] = lignes[i].replace(/^(\s*)\[( |x|X)\]/, (m, a, c) => `${a}[${c === ' ' ? 'x' : ' '}]`)
  return lignes.join('\n')
}
export function morceauxGras(texte) {
  return (texte || '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(m => (m.startsWith('**') && m.endsWith('**') ? { gras: true, t: m.slice(2, -2) } : { gras: false, t: m }))
}
