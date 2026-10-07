// Export d'un graphe en image PNG, redessiné sur un <canvas> à partir des
// positions et des tailles réelles des bulles (mesurées à l'écran), sans
// dépendance externe.

import { CHEMIN_NUAGE } from './graphe'

const MARGE = 40

// Marges intérieures (horizontale, verticale) selon la forme, comme à l'écran.
const MARGES = {
  arrondi: [[16, 11], [18, 14]],
  rectangle: [[16, 11], [18, 14]],
  rond: [[24, 16], [28, 20]],
  nuage: [[28, 20], [34, 24]],
}

// Contour de la bulle selon sa forme, en Path2D (rempli puis tracé).
function contourBulle(b, gauche, haut) {
  const chemin = new Path2D()
  if (b.forme === 'rond') {
    chemin.ellipse(b.x, b.y, b.l / 2, b.h / 2, 0, 0, 2 * Math.PI)
  } else if (b.forme === 'nuage') {
    chemin.addPath(new Path2D(CHEMIN_NUAGE), new DOMMatrix().translate(gauche, haut).scale(b.l / 100, b.h / 60))
  } else {
    const r = Math.min(b.forme === 'rectangle' ? 4 : 18, b.l / 2, b.h / 2)
    chemin.moveTo(gauche + r, haut)
    chemin.arcTo(gauche + b.l, haut, gauche + b.l, haut + b.h, r)
    chemin.arcTo(gauche + b.l, haut + b.h, gauche, haut + b.h, r)
    chemin.arcTo(gauche, haut + b.h, gauche, haut, r)
    chemin.arcTo(gauche, haut, gauche + b.l, haut, r)
    chemin.closePath()
  }
  return chemin
}

function rectangleArrondi(ctx, x, y, l, h, r) {
  const rr = Math.min(r, l / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + l, y, x + l, y + h, rr)
  ctx.arcTo(x + l, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + l, y, rr)
  ctx.closePath()
}

function couperLignes(ctx, texte, largeur) {
  const lignes = []
  texte.split('\n').forEach(paragraphe => {
    let ligne = ''
    paragraphe.split(/\s+/).filter(Boolean).forEach(mot => {
      const essai = ligne ? `${ligne} ${mot}` : mot
      if (ctx.measureText(essai).width <= largeur || !ligne) ligne = essai
      else { lignes.push(ligne); ligne = mot }
    })
    lignes.push(ligne)
  })
  return lignes
}

function flèche(ctx, pointe, depuis, couleur) {
  const angle = Math.atan2(pointe.y - depuis.y, pointe.x - depuis.x)
  const t = 11
  ctx.save()
  ctx.fillStyle = couleur
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(pointe.x, pointe.y)
  ctx.lineTo(pointe.x - t * Math.cos(angle - 0.45), pointe.y - t * Math.sin(angle - 0.45))
  ctx.lineTo(pointe.x - t * Math.cos(angle + 0.45), pointe.y - t * Math.sin(angle + 0.45))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function chargerImage(src) {
  return new Promise(resolve => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// bulles  : [{ x, y, l, h, texte, racine, couleur, image (adresse|null), badge }]
// branches: [{ de: {x,y}, vers: {x,y}, couleur }]
// liens   : [{ p0, k, p1, milieu, sens, texte }]
export async function exporterGraphePNG({ bulles, branches, liens, couleurs, polices }) {
  const images = await Promise.all(bulles.map(b => chargerImage(b.image)))

  const xs = bulles.flatMap(b => [b.x - b.l / 2, b.x + b.l / 2]).concat(liens.map(l => l.milieu.x))
  const ys = bulles.flatMap(b => [b.y - b.h / 2, b.y + b.h / 2]).concat(liens.map(l => l.milieu.y))
  const minX = Math.min(...xs) - MARGE
  const minY = Math.min(...ys) - MARGE
  const largeur = Math.max(...xs) + MARGE - minX
  const hauteur = Math.max(...ys) + MARGE - minY
  const échelle = Math.min(2, 6000 / Math.max(largeur, hauteur))

  const toile = document.createElement('canvas')
  toile.width = Math.ceil(largeur * échelle)
  toile.height = Math.ceil(hauteur * échelle)
  const ctx = toile.getContext('2d')
  ctx.scale(échelle, échelle)
  ctx.translate(-minX, -minY)
  ctx.fillStyle = couleurs.fond
  ctx.fillRect(minX, minY, largeur, hauteur)
  ctx.lineCap = 'round'

  // Branches de l'arbre
  branches.forEach(({ de, vers, couleur }) => {
    const mx = (de.x + vers.x) / 2
    ctx.strokeStyle = couleur
    ctx.globalAlpha = 0.7
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(de.x, de.y)
    ctx.bezierCurveTo(mx, de.y, mx, vers.y, vers.x, vers.y)
    ctx.stroke()
    ctx.globalAlpha = 1
  })

  // Liens libres (pointillés, flèches)
  liens.forEach(l => {
    ctx.strokeStyle = couleurs.accent
    ctx.lineWidth = 2.5
    ctx.setLineDash([7, 6])
    ctx.beginPath()
    ctx.moveTo(l.p0.x, l.p0.y)
    ctx.quadraticCurveTo(l.k.x, l.k.y, l.p1.x, l.p1.y)
    ctx.stroke()
    ctx.setLineDash([])
    if (l.sens === 'vers' || l.sens === 'deux') flèche(ctx, l.p1, l.k, couleurs.accent)
    if (l.sens === 'deux') flèche(ctx, l.p0, l.k, couleurs.accent)
  })

  // Bulles
  bulles.forEach((b, i) => {
    const gauche = b.x - b.l / 2
    const haut = b.y - b.h / 2
    const contour = contourBulle(b, gauche, haut)
    if (b.racine) {
      ctx.fillStyle = b.couleur
      ctx.fill(contour)
    } else {
      ctx.fillStyle = couleurs.surface
      ctx.fill(contour)
      ctx.globalAlpha = 0.13
      ctx.fillStyle = b.couleur
      ctx.fill(contour)
      ctx.globalAlpha = 1
    }
    ctx.lineWidth = 2
    ctx.strokeStyle = b.couleur
    ctx.stroke(contour)

    const f = b.facteur || 1
    const [marge, margeV] = (MARGES[b.forme] || MARGES.arrondi)[b.racine ? 1 : 0].map(m => m * f)
    const img = images[i]
    let hauteurImage = 0
    if (img) {
      const r = Math.min((180 * f) / img.width, (110 * f) / img.height, (b.l - 2 * marge) / img.width)
      const li = img.width * r
      hauteurImage = img.height * r
      ctx.save()
      rectangleArrondi(ctx, b.x - li / 2, haut + margeV, li, hauteurImage, 8)
      ctx.clip()
      ctx.drawImage(img, b.x - li / 2, haut + margeV, li, hauteurImage)
      ctx.restore()
      hauteurImage += 6
    }

    const taillePolice = (b.racine ? 15 : 13.5) * f
    ctx.font = `${b.racine ? 700 : 500} ${taillePolice}px ${b.racine ? polices.serif : polices.sans}`
    ctx.fillStyle = b.racine ? '#1b1b1b' : couleurs.texte
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Petite tolérance : les polices du canvas mesurent un peu plus large.
    const lignes = couperLignes(ctx, b.texte, b.l - 2 * marge + 8)
    const hauteurLigne = taillePolice * 1.35
    const disponible = b.h - 2 * margeV - hauteurImage
    let y = haut + margeV + hauteurImage + (disponible - lignes.length * hauteurLigne) / 2 + hauteurLigne / 2
    lignes.forEach(ligne => { ctx.fillText(ligne, b.x, y); y += hauteurLigne })

    if (b.badge) {
      ctx.font = `700 11px ${polices.sans}`
      const lb = ctx.measureText(b.badge).width + 12
      rectangleArrondi(ctx, gauche + b.l - lb + 6, haut - 8, lb, 18, 9)
      ctx.fillStyle = couleurs.accent
      ctx.fill()
      ctx.fillStyle = '#1b1b1b'
      ctx.fillText(b.badge, gauche + b.l - lb / 2 + 6, haut + 1)
    }
  })

  // Textes des liens (au-dessus du reste)
  liens.filter(l => l.texte).forEach(l => {
    ctx.font = `600 11.5px ${polices.sans}`
    const lt = ctx.measureText(l.texte).width + 14
    rectangleArrondi(ctx, l.milieu.x - lt / 2, l.milieu.y - 11, lt, 22, 11)
    ctx.fillStyle = couleurs.surface
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = couleurs.accent
    ctx.stroke()
    ctx.fillStyle = couleurs.texte
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(l.texte, l.milieu.x, l.milieu.y + 0.5)
  })

  return new Promise((resolve, reject) => {
    try {
      toile.toBlob(b => (b ? resolve(b) : reject(new Error('Image impossible à créer'))), 'image/png')
    } catch (err) {
      reject(err)
    }
  })
}
