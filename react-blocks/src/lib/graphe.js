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
export function ranger(noeuds, taille = () => TAILLE_DÉFAUT) {
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
  noeuds.filter(n => !n.parentId || !ids.has(n.parentId)).forEach(r => { placer(r, 0); ligne += ÉCART_Y / 2 })

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
export function géométrieLien(a, b, taille) {
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
