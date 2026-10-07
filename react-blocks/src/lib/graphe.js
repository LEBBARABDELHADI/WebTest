// Logique des graphes (page Graph), indépendante de l'affichage.
//
// Fichier : { graphes: [{ id, nom, noeuds, liens }] }
// - noeud : { id, texte, x, y, parentId, couleur?, replié?, image?, verrouillé? }
//   x, y = centre de la bulle ; parentId = bulle parente dans l'arbre
//   (null pour une racine ou une bulle libre) ; replié = ses descendants
//   sont cachés.
// - lien  : { id, de, vers, texte?, sens? } relie librement deux bulles,
//   en plus de l'arbre. sens : 'aucun' (défaut) | 'vers' (de → vers) |
//   'deux' (↔).

export const ÉCART_X = 240
export const ÉCART_Y = 92

export function compléterGraphes(objet) {
  const graphes = Array.isArray(objet?.graphes) ? objet.graphes : []
  return {
    graphes: graphes.map(g => ({
      ...g,
      noeuds: Array.isArray(g.noeuds) ? g.noeuds : [],
      liens: Array.isArray(g.liens) ? g.liens : [],
    })),
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function descendants(noeuds, id) {
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

// Bulles cachées parce qu'un de leurs ancêtres est replié.
export function bullesCachées(noeuds) {
  const cachées = new Set()
  noeuds.filter(n => n.replié).forEach(n => descendants(noeuds, n.id).forEach(id => cachées.add(id)))
  return cachées
}

export function ancêtres(noeuds, id) {
  const parId = new Map(noeuds.map(n => [n.id, n]))
  const résultat = []
  let courant = parId.get(id)
  const vus = new Set()
  while (courant?.parentId && parId.has(courant.parentId) && !vus.has(courant.parentId)) {
    vus.add(courant.parentId)
    courant = parId.get(courant.parentId)
    résultat.push(courant.id)
  }
  return résultat
}

// Range l'arbre de gauche à droite : profondeur → colonne, feuilles
// empilées, chaque parent centré sur ses enfants. Une branche repliée
// compte comme une feuille ; ses bulles cachées suivent sa bulle.
// `taille(id)` (facultatif) donne la taille affichée des bulles, pour que
// les grandes bulles (code, image) gardent de la place autour d'elles.
const TAILLE_DÉFAUT = { l: 120, h: 44 }
export function ranger(noeuds, taille = () => TAILLE_DÉFAUT, { écartArbres = ÉCART_Y / 2 } = {}) {
  const ids = new Set(noeuds.map(n => n.id))
  const enfants = new Map()
  noeuds.forEach(n => {
    if (n.parentId && ids.has(n.parentId)) {
      if (!enfants.has(n.parentId)) enfants.set(n.parentId, [])
      enfants.get(n.parentId).push(n)
    }
  })
  const positions = {}
  const profondeurs = {}
  const vus = new Set()
  let ligne = 0
  const placer = (n, profondeur) => {
    if (vus.has(n.id)) return
    vus.add(n.id)
    profondeurs[n.id] = profondeur
    const fils = n.replié ? [] : (enfants.get(n.id) || []).filter(f => !vus.has(f.id))
    if (fils.length === 0) {
      const hauteur = Math.max(ÉCART_Y, (taille(n.id)?.h || TAILLE_DÉFAUT.h) + 36)
      positions[n.id] = { y: ligne + hauteur / 2 }
      ligne += hauteur
      return
    }
    fils.forEach(f => placer(f, profondeur + 1))
    const ys = fils.map(f => positions[f.id].y)
    positions[n.id] = { y: (Math.min(...ys) + Math.max(...ys)) / 2 }
  }
  noeuds.filter(n => !n.parentId || !ids.has(n.parentId)).forEach(r => { placer(r, 0); ligne += écartArbres })

  // Colonnes : assez écartées pour les bulles les plus larges de chacune.
  const largeurs = []
  Object.entries(profondeurs).forEach(([id, p]) => { largeurs[p] = Math.max(largeurs[p] || 0, taille(id)?.l || TAILLE_DÉFAUT.l) })
  const colonnes = [0]
  for (let p = 1; p < largeurs.length; p += 1) {
    colonnes[p] = colonnes[p - 1] + Math.max(ÉCART_X, (largeurs[p - 1] + largeurs[p]) / 2 + 70)
  }
  Object.keys(positions).forEach(id => { positions[id].x = colonnes[profondeurs[id]] })

  // Bulles verrouillées : elles restent où elles sont, et leur branche
  // (bulles non verrouillées en dessous) est rangée autour d'elles.
  const parIdentifiant = new Map(noeuds.map(n => [n.id, n]))
  const décalageDe = new Map()
  const décalage = id => {
    if (décalageDe.has(id)) return décalageDe.get(id)
    const n = parIdentifiant.get(id)
    let d = { dx: 0, dy: 0 }
    if (n.verrouillé && positions[id]) d = { dx: n.x - positions[id].x, dy: n.y - positions[id].y }
    else if (n.parentId && ids.has(n.parentId) && positions[n.parentId]) d = décalage(n.parentId)
    décalageDe.set(id, d)
    return d
  }
  Object.keys(positions).forEach(id => {
    const { dx, dy } = décalage(id)
    positions[id] = { x: positions[id].x + dx, y: positions[id].y + dy }
  })

  // Les bulles cachées gardent leur position relative à la bulle repliée.
  const décalages = {}
  noeuds.filter(n => n.replié && positions[n.id]).forEach(n => {
    const dx = positions[n.id].x - n.x
    const dy = positions[n.id].y - n.y
    descendants(noeuds, n.id).forEach(id => { if (!positions[id]) décalages[id] = { dx, dy } })
  })
  return noeuds.map(n => {
    if (positions[n.id]) return { ...n, ...positions[n.id] }
    if (décalages[n.id]) return { ...n, x: n.x + décalages[n.id].dx, y: n.y + décalages[n.id].dy }
    return n
  })
}

// ---------- Géométrie des liens libres ----------

// Point d'une courbe de Bézier quadratique.
function point(a, c, b, t) {
  const u = 1 - t
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
}

// Courbe d'autant plus marquée que le lien est long, pour contourner les
// bulles placées entre les deux et ne pas confondre avec une branche.
// Les extrémités sont coupées au bord des bulles (pour que les flèches se
// voient) : `taille(id)` donne la largeur et la hauteur affichées.
// tracé : 'courbe' (défaut) | 'droit' | 'horizontal' (sort par les côtés,
// segments horizontaux et verticaux) | 'vertical' (sort par le haut/bas).
export const TRACÉS = [
  { id: 'courbe', nom: 'Courbe', symbole: '⌒' },
  { id: 'droit', nom: 'Droit', symbole: '╱' },
  { id: 'horizontal', nom: 'Horizontal', symbole: '↔' },
  { id: 'vertical', nom: 'Vertical', symbole: '↕' },
]

// Tracés en lignes droites : `points` = la ligne brisée, du bord de a au bord de b.
function lienAnguleux(a, b, taille, tracé) {
  const ta = taille(a.id)
  const tb = taille(b.id)
  let points
  if (tracé === 'horizontal') {
    const sx = Math.sign(b.x - a.x) || 1
    const p0 = { x: a.x + sx * (ta.l / 2 + 2), y: a.y }
    const p1 = { x: b.x - sx * (tb.l / 2 + 2), y: b.y }
    const mx = (p0.x + p1.x) / 2
    points = Math.abs(p0.y - p1.y) < 1 ? [p0, p1] : [p0, { x: mx, y: p0.y }, { x: mx, y: p1.y }, p1]
  } else if (tracé === 'vertical') {
    const sy = Math.sign(b.y - a.y) || 1
    const p0 = { x: a.x, y: a.y + sy * (ta.h / 2 + 2) }
    const p1 = { x: b.x, y: b.y - sy * (tb.h / 2 + 2) }
    const my = (p0.y + p1.y) / 2
    points = Math.abs(p0.x - p1.x) < 1 ? [p0, p1] : [p0, { x: p0.x, y: my }, { x: p1.x, y: my }, p1]
  } else {
    // Droit : segment coupé au bord des deux rectangles.
    const dx = b.x - a.x
    const dy = b.y - a.y
    const sortie = t => Math.min(dx ? (t.l / 2 + 4) / Math.abs(dx) : Infinity, dy ? (t.h / 2 + 4) / Math.abs(dy) : Infinity)
    const t0 = Math.min(0.45, sortie(ta))
    const t1 = Math.min(0.45, sortie(tb))
    points = [{ x: a.x + dx * t0, y: a.y + dy * t0 }, { x: b.x - dx * t1, y: b.y - dy * t1 }]
  }
  const milieu = points.length === 4
    ? { x: (points[1].x + points[2].x) / 2, y: (points[1].y + points[2].y) / 2 }
    : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
  return {
    p0: points[0], p1: points[points.length - 1], points, milieu,
    d: points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' '),
  }
}

export function géométrieLien(a, b, taille, tracé = 'courbe') {
  if (tracé && tracé !== 'courbe') return lienAnguleux(a, b, taille, tracé)
  const long = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const écart = Math.min(170, Math.max(50, long * 0.6))
  const c = {
    x: (a.x + b.x) / 2 - ((b.y - a.y) / long) * écart,
    y: (a.y + b.y) / 2 + ((b.x - a.x) / long) * écart,
  }
  const dedans = (p, n) => {
    const { l, h } = taille(n.id)
    return Math.abs(p.x - n.x) < l / 2 + 4 && Math.abs(p.y - n.y) < h / 2 + 4
  }
  let t0 = 0
  while (t0 < 0.45 && dedans(point(a, c, b, t0), a)) t0 += 0.01
  let t1 = 1
  while (t1 > 0.55 && dedans(point(a, c, b, t1), b)) t1 -= 0.01
  // Sous-courbe [t0, t1] : extrémités et point de contrôle « floraison ».
  const p0 = point(a, c, b, t0)
  const p1 = point(a, c, b, t1)
  const k = {
    x: (1 - t0) * (1 - t1) * a.x + ((1 - t0) * t1 + t0 * (1 - t1)) * c.x + t0 * t1 * b.x,
    y: (1 - t0) * (1 - t1) * a.y + ((1 - t0) * t1 + t0 * (1 - t1)) * c.y + t0 * t1 * b.y,
  }
  return { p0, k, p1, milieu: point(a, c, b, 0.5), d: `M ${p0.x} ${p0.y} Q ${k.x} ${k.y} ${p1.x} ${p1.y}` }
}

// ---------- Modèles de graphes ----------

const [ORANGE, ROUGE, VERT, BLEU, VIOLET] = ['#f0a839', '#e2574c', '#4a9d94', '#5b8dc9', '#8b7ab8']

// Arbre décrit par { texte, couleur?, enfants: [...] } → bulles avec parentId.
function depuisArbre(arbre) {
  const noeuds = []
  const ajouter = (n, parentId) => {
    const id = uid()
    noeuds.push({ id, texte: n.texte, x: 0, y: 0, parentId, ...(n.couleur ? { couleur: n.couleur } : {}) })
    ;(n.enfants || []).forEach(e => ajouter(e, id))
    return id
  }
  ajouter(arbre, null)
  return { noeuds: ranger(noeuds), liens: [] }
}

const pourEtContre = [{ texte: '✅ Avantages', couleur: VERT }, { texte: '⚠️ Inconvénients', couleur: ROUGE }]

export const MODÈLES = [
  {
    id: 'vide', emoji: '⚪', nom: 'Vide', description: 'Juste une bulle centrale',
    créer: nom => depuisArbre({ texte: nom }),
  },
  {
    id: 'expose', emoji: '🎤', nom: "Plan d'exposé", description: 'Introduction, deux parties, conclusion',
    créer: nom => depuisArbre({
      texte: nom,
      enfants: [
        { texte: 'Introduction', couleur: BLEU, enfants: [{ texte: 'Accroche' }, { texte: 'Problématique' }, { texte: 'Annonce du plan' }] },
        { texte: 'Partie 1', couleur: VERT, enfants: [{ texte: 'Argument' }, { texte: 'Exemple' }] },
        { texte: 'Partie 2', couleur: VIOLET, enfants: [{ texte: 'Argument' }, { texte: 'Exemple' }] },
        { texte: 'Conclusion', couleur: ORANGE, enfants: [{ texte: 'Bilan' }, { texte: 'Ouverture' }] },
      ],
    }),
  },
  {
    id: 'swot', emoji: '🧭', nom: 'SWOT', description: 'Forces, faiblesses, opportunités, menaces',
    créer: nom => {
      const racine = { id: uid(), texte: nom, x: 0, y: 0, parentId: null }
      const coins = [
        ['💪 Forces', VERT, -270, -150], ['🩹 Faiblesses', ROUGE, 270, -150],
        ['🌱 Opportunités', BLEU, -270, 150], ['⛈️ Menaces', ORANGE, 270, 150],
      ]
      return {
        noeuds: [racine, ...coins.map(([texte, couleur, x, y]) => ({ id: uid(), texte, couleur, x, y, parentId: racine.id }))],
        liens: [],
      }
    },
  },
  {
    id: 'decision', emoji: '🔀', nom: 'Arbre de décision', description: 'Options avec avantages et inconvénients',
    créer: nom => depuisArbre({
      texte: nom,
      enfants: [
        { texte: 'Option A', couleur: BLEU, enfants: pourEtContre },
        { texte: 'Option B', couleur: VIOLET, enfants: pourEtContre },
      ],
    }),
  },
  {
    id: 'famille', emoji: '👪', nom: 'Arbre généalogique', description: 'Moi, mes parents, mes grands-parents',
    créer: nom => depuisArbre({
      texte: nom,
      enfants: [
        { texte: 'Parent 1', couleur: BLEU, enfants: [{ texte: 'Grand-parent 1' }, { texte: 'Grand-parent 2' }] },
        { texte: 'Parent 2', couleur: ROUGE, enfants: [{ texte: 'Grand-parent 3' }, { texte: 'Grand-parent 4' }] },
      ],
    }),
  },
  {
    id: 'causes', emoji: '⚡', nom: 'Causes et conséquences', description: 'Un problème, ce qui le cause, ce qu\'il entraîne',
    créer: nom => {
      const centre = { id: uid(), texte: nom, x: 0, y: 0, parentId: null }
      const causes = [-120, 0, 120].map((y, i) => ({ id: uid(), texte: `Cause ${i + 1}`, couleur: ORANGE, x: -300, y, parentId: null }))
      const effets = [-70, 70].map((y, i) => ({ id: uid(), texte: `Conséquence ${i + 1}`, couleur: VIOLET, x: 300, y, parentId: null }))
      return {
        noeuds: [centre, ...causes, ...effets],
        liens: [
          ...causes.map(c => ({ id: uid(), de: c.id, vers: centre.id, texte: 'cause', sens: 'vers' })),
          ...effets.map(e => ({ id: uid(), de: centre.id, vers: e.id, texte: 'entraîne', sens: 'vers' })),
        ],
      }
    },
  },
]

export const ÉTIQUETTES_LIENS = ['cause', 'entraîne', 'exemple', "s'oppose à", 'implique', 'fait partie de', 'voir aussi']

// ---------- Formes et icônes des bulles ----------
// noeud.forme : 'arrondi' (défaut) | 'rond' | 'rectangle' | 'nuage'
// noeud.icone : emoji affiché en tête du texte
export const FORMES = [
  { id: 'arrondi', nom: 'Arrondie', symbole: '▢' },
  { id: 'rond', nom: 'Ronde', symbole: '◯' },
  { id: 'rectangle', nom: 'Rectangle', symbole: '□' },
  { id: 'nuage', nom: 'Nuage', symbole: '☁︎' },
]
export const ICÔNES = [
  { emoji: '⭐', nom: 'Important' },
  { emoji: '❓', nom: 'À vérifier' },
  { emoji: '⚠️', nom: 'Attention' },
  { emoji: '✅', nom: 'Fait' },
  { emoji: '💡', nom: 'Idée' },
  { emoji: '📌', nom: 'À retenir' },
  { emoji: '🔥', nom: 'Urgent' },
  { emoji: '❤️', nom: 'Coup de cœur' },
]

// Contour d'un nuage dans une boîte 100 × 60, étiré à la taille de la bulle.
export const CHEMIN_NUAGE = 'M24 54 C9 55 2 44 8 35 C1 27 9 14 22 17 C24 6 39 1 48 9 C55 1 72 3 74 14 C87 10 99 21 92 32 C100 41 92 56 78 53 C72 60 57 60 51 54 C44 60 30 60 24 54 Z'

// Ordre du mode présentation : chaque arbre en profondeur (les enfants de
// haut en bas), en commençant par les plus grands arbres, puis les bulles
// libres de haut en bas.
export function ordrePrésentation(noeuds) {
  const ids = new Set(noeuds.map(n => n.id))
  const enfants = new Map()
  noeuds.forEach(n => {
    if (n.parentId && ids.has(n.parentId)) {
      if (!enfants.has(n.parentId)) enfants.set(n.parentId, [])
      enfants.get(n.parentId).push(n)
    }
  })
  const racines = noeuds
    .filter(n => !n.parentId || !ids.has(n.parentId))
    .sort((a, b) => descendants(noeuds, b.id).size - descendants(noeuds, a.id).size || a.y - b.y || a.x - b.x)
  const ordre = []
  const vus = new Set()
  const parcourir = n => {
    if (vus.has(n.id)) return
    vus.add(n.id)
    ordre.push(n.id)
    ;(enfants.get(n.id) || []).slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach(parcourir)
  }
  racines.forEach(parcourir)
  return ordre
}

// noeud.taille : agrandit (ou réduit) le texte et la largeur de la bulle.
export const TAILLES_BULLES = [
  { id: 'petite', nom: 'Petite', facteur: 0.85 },
  { id: 'normale', nom: 'Normale', facteur: 1 },
  { id: 'grande', nom: 'Grande', facteur: 1.35 },
  { id: 'enorme', nom: 'Très grande', facteur: 1.75 },
]
export function facteurTaille(noeud) {
  return TAILLES_BULLES.find(t => t.id === noeud.taille)?.facteur || 1
}

// ---------- Plan texte (copier / coller) ----------

const ROMAINS = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
function romain(n) {
  let reste = n
  return ROMAINS.reduce((r, [v, l]) => { while (reste >= v) { r += l; reste -= v } return r }, '')
}
const lettre = (i, maj) => String.fromCharCode((maj ? 65 : 97) + (i % 26))
// Numérotation d'un plan : I. → A. → 1. → a) → -
function numéro(profondeur, i) {
  if (profondeur === 1) return `${romain(i + 1)}.`
  if (profondeur === 2) return `${lettre(i, true)}.`
  if (profondeur === 3) return `${i + 1}.`
  if (profondeur === 4) return `${lettre(i, false)})`
  return '-'
}

function enfantsTriés(noeuds) {
  const ids = new Set(noeuds.map(n => n.id))
  const enfants = new Map()
  noeuds.forEach(n => {
    const p = n.parentId && ids.has(n.parentId) ? n.parentId : null
    if (!enfants.has(p)) enfants.set(p, [])
    enfants.get(p).push(n)
  })
  enfants.forEach(l => l.sort((a, b) => a.y - b.y || a.x - b.x))
  return enfants
}

// Graphe → plan numéroté et indenté ; une ligne vide sépare les arbres.
export function planTexte(noeuds) {
  const enfants = enfantsTriés(noeuds)
  const lignes = []
  const écrire = (n, profondeur, i) => {
    const texte = `${n.icone ? `${n.icone} ` : ''}${texteSimple(n.texte)}`
    lignes.push(profondeur === 0 ? texte : `${'  '.repeat(profondeur)}${numéro(profondeur, i)} ${texte}`)
    ;(enfants.get(n.id) || []).forEach((e, j) => écrire(e, profondeur + 1, j))
  }
  ;(enfants.get(null) || []).forEach((r, i) => {
    if (i > 0) lignes.push('')
    écrire(r, 0, i)
  })
  return lignes.join('\n')
}
// Retire le balisage **gras** / {{#hex|couleur}} et les retours à la ligne.
function texteSimple(texte) {
  return (texte || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\{\{#[0-9a-fA-F]{3,8}\|(.+?)\}\}/g, '$1').replace(/\s*\n\s*/g, ' ').trim()
}

const MARQUEUR = /^(?:([-*+•–·])|(\d+)[.)]|([IVXLCDM]+)\.|([A-Z])[.)]|([a-z])[.)])\s+/
// Rang d'un marqueur quand le plan n'a aucune indentation : I. < A. < 1. < a) < -
function rangMarqueur(m) {
  if (!m) return 0
  if (m[3]) return 1
  if (m[4]) return 2
  if (m[2]) return 3
  if (m[5]) return 4
  return 5
}

// Texte (plan, liste à puces, titres Markdown) → bulles. L'indentation (ou,
// à défaut, le type de numérotation) donne la profondeur.
export function analyserPlan(texte) {
  const brutes = texte.replace(/\r/g, '').split('\n')
    .map(l => l.replace(/\t/g, '    '))
    .filter(l => l.trim())
  if (brutes.length === 0) return { noeuds: [], liens: [] }
  const sansIndentation = brutes.every(l => !/^\s/.test(l)) && !brutes.some(l => /^#{1,6}\s/.test(l))
  const lignes = []
  let base = -1
  brutes.forEach(l => {
    const retrait = l.match(/^\s*/)[0].length
    let contenu = l.trim()
    const titre = contenu.match(/^(#{1,6})\s+(.*)$/)
    if (titre) {
      base = (titre[1].length - 1) * 1000
      lignes.push({ niveau: base, texte: titre[2], titre: true })
      return
    }
    const m = contenu.match(MARQUEUR)
    if (m) contenu = contenu.slice(m[0].length)
    // Une puce au même retrait qu'une ligne simple en dépend (« Titre » puis « - a »).
    const niveau = sansIndentation ? rangMarqueur(m) : base + 1 + retrait + (m ? 0.5 : 0)
    lignes.push({ niveau, texte: contenu })
  })
  const noeuds = []
  const pile = []
  lignes.forEach(({ niveau, texte: t, titre }) => {
    // Un titre ferme les listes au-dessus de lui et les titres de même niveau.
    while (pile.length && (pile[pile.length - 1].niveau >= niveau || (titre && !pile[pile.length - 1].titre))) pile.pop()
    const parent = pile[pile.length - 1]
    const icône = ICÔNES.find(i => t.startsWith(`${i.emoji} `))
    const n = { id: uid(), texte: icône ? t.slice(icône.emoji.length + 1) : t, x: 0, y: 0, parentId: parent ? parent.id : null }
    if (icône) n.icone = icône.emoji
    noeuds.push(n)
    pile.push({ niveau, id: n.id, titre })
  })
  return { noeuds: ranger(noeuds), liens: [] }
}

// ---------- Copier / coller des branches ----------

// Les bulles choisies avec tout ce qui en dépend, et les liens entre elles.
export function copierBranches(noeuds, liens, ids) {
  const pris = new Set()
  ids.forEach(id => { pris.add(id); descendants(noeuds, id).forEach(d => pris.add(d)) })
  return {
    noeuds: noeuds.filter(n => pris.has(n.id)).map(n => ({ ...n, parentId: pris.has(n.parentId) ? n.parentId : null })),
    liens: liens.filter(l => pris.has(l.de) && pris.has(l.vers)),
  }
}

// Nouvelle copie (nouveaux identifiants), décalée de (dx, dy) ; les racines
// de la copie sont rattachées à parentDe(ancienId) (null = bulle libre).
export function dupliquerCopie(copie, { dx = 0, dy = 0, parentDe = () => null } = {}) {
  const nouveaux = new Map(copie.noeuds.map(n => [n.id, uid()]))
  return {
    noeuds: copie.noeuds.map(n => ({
      ...n, id: nouveaux.get(n.id), x: n.x + dx, y: n.y + dy,
      parentId: n.parentId && nouveaux.has(n.parentId) ? nouveaux.get(n.parentId) : parentDe(n.id),
    })),
    liens: copie.liens.map(l => ({ ...l, id: uid(), de: nouveaux.get(l.de), vers: nouveaux.get(l.vers) })),
  }
}

// ---------- Aligner / répartir ----------

// Nouvelles positions des bulles choisies. Les bulles verrouillées ne
// bougent pas et servent de repère quand il y en a.
export function aligner(noeuds, ids, mode, taille) {
  const choisies = noeuds.filter(n => ids.includes(n.id))
  if (choisies.length < 2) return {}
  const repères = choisies.some(n => n.verrouillé) ? choisies.filter(n => n.verrouillé) : choisies
  const t = n => taille(n.id)
  const positions = {}
  const placer = (n, x, y) => { if (!n.verrouillé) positions[n.id] = { x, y } }
  if (mode === 'gauche') {
    const g = Math.min(...repères.map(n => n.x - t(n).l / 2))
    choisies.forEach(n => placer(n, g + t(n).l / 2, n.y))
  } else if (mode === 'centre') {
    const cx = repères.reduce((s, n) => s + n.x, 0) / repères.length
    choisies.forEach(n => placer(n, cx, n.y))
  } else if (mode === 'haut') {
    const h = Math.min(...repères.map(n => n.y - t(n).h / 2))
    choisies.forEach(n => placer(n, n.x, h + t(n).h / 2))
  } else if (mode === 'milieu') {
    const cy = repères.reduce((s, n) => s + n.y, 0) / repères.length
    choisies.forEach(n => placer(n, n.x, cy))
  } else if (mode === 'répartirH' || mode === 'répartirV') {
    const horiz = mode === 'répartirH'
    const axe = horiz ? 'x' : 'y'
    const dim = horiz ? 'l' : 'h'
    const triées = [...choisies].sort((a, b) => a[axe] - b[axe])
    const début = triées[0][axe] - t(triées[0])[dim] / 2
    const fin = triées[triées.length - 1][axe] + t(triées[triées.length - 1])[dim] / 2
    const total = triées.reduce((s, n) => s + t(n)[dim], 0)
    const écart = (fin - début - total) / (triées.length - 1)
    let curseur = début
    triées.forEach(n => {
      const centre = curseur + t(n)[dim] / 2
      placer(n, horiz ? centre : n.x, horiz ? n.y : centre)
      curseur += t(n)[dim] + écart
    })
  }
  return positions
}

// ---------- Séparateurs entre les arbres ----------

// Lignes horizontales entre les arbres empilés (un arbre = une bulle racine
// et ses bulles visibles), là où ils ne se chevauchent pas en hauteur.
export function séparateursArbres(visibles, taille) {
  const ids = new Set(visibles.map(n => n.id))
  const racineDe = new Map()
  const parId = new Map(visibles.map(n => [n.id, n]))
  const racine = n => {
    if (racineDe.has(n.id)) return racineDe.get(n.id)
    const r = n.parentId && ids.has(n.parentId) ? racine(parId.get(n.parentId)) : n.id
    racineDe.set(n.id, r)
    return r
  }
  const boîtes = new Map()
  visibles.forEach(n => {
    const r = racine(n)
    const { l, h } = taille(n.id)
    const b = boîtes.get(r) || { haut: Infinity, bas: -Infinity, gauche: Infinity, droite: -Infinity }
    boîtes.set(r, {
      haut: Math.min(b.haut, n.y - h / 2), bas: Math.max(b.bas, n.y + h / 2),
      gauche: Math.min(b.gauche, n.x - l / 2), droite: Math.max(b.droite, n.x + l / 2),
    })
  })
  const liste = [...boîtes.values()].sort((a, b) => a.haut - b.haut)
  if (liste.length < 2) return []
  const x0 = Math.min(...liste.map(b => b.gauche)) - 40
  const x1 = Math.max(...liste.map(b => b.droite)) + 40
  const lignes = []
  let basCourant = liste[0].bas
  for (let i = 1; i < liste.length; i += 1) {
    if (liste[i].haut > basCourant + 8) lignes.push({ x0, x1, y: (basCourant + liste[i].haut) / 2 })
    basCourant = Math.max(basCourant, liste[i].bas)
  }
  return lignes
}
