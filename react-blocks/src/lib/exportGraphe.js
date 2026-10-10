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

// Bloc de code d'une bulle : fond sombre, police à chasse fixe, lignes
// coupées au bord comme à l'écran.
function dessinerCode(ctx, code, gauche, haut, polices) {
  const { f } = code
  const x = gauche + code.x
  const y = haut + code.y
  ctx.save()
  rectangleArrondi(ctx, x, y, code.l, code.h, 8 * f)
  ctx.fillStyle = '#0d0f14'
  ctx.fill()
  ctx.clip()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  let ligneY = y + 8 * f
  if (code.langage) {
    ctx.font = `400 ${9.5 * f}px ${polices.mono}`
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(code.langage.toUpperCase(), x + 10 * f, ligneY + 2 * f)
    ligneY += 9.5 * f * 1.5 + 3 * f
  }
  ctx.font = `400 ${11.5 * f}px ${polices.mono}`
  ctx.fillStyle = '#e2e8f0'
  const hauteur = 11.5 * f * 1.5
  code.lignes.forEach(l => { ctx.fillText(l, x + 10 * f, ligneY + 2 * f); ligneY += hauteur })
  if (code.reste) {
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`… +${code.reste} ligne${code.reste > 1 ? 's' : ''}`, x + 10 * f, ligneY + 5 * f)
  }
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
// liens   : [{ p0, k | points, p1, milieu, sens, texte }]
export async function exporterGraphePNG({ bulles, branches, liens, séparateurs = [], lignes = [], couleurs, polices }) {
  const images = await Promise.all(bulles.map(b => chargerImage(b.image)))

  const xs = bulles.flatMap(b => [b.x - b.l / 2, b.x + b.l / 2]).concat(liens.map(l => l.milieu.x), lignes.flatMap(l => [l.x1, l.x2]))
  const ys = bulles.flatMap(b => [b.y - b.h / 2, b.y + b.h / 2]).concat(liens.map(l => l.milieu.y), lignes.flatMap(l => [l.y1, l.y2]))
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

  // Séparateurs entre les arbres
  séparateurs.forEach(l => {
    ctx.save()
    ctx.strokeStyle = couleurs.texte
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1.5
    ctx.setLineDash([10, 8])
    ctx.beginPath()
    ctx.moveTo(l.x0, l.y)
    ctx.lineTo(l.x1, l.y)
    ctx.stroke()
    ctx.restore()
  })

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
    if (l.points) l.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    else ctx.quadraticCurveTo(l.k.x, l.k.y, l.p1.x, l.p1.y)
    ctx.stroke()
    ctx.setLineDash([])
    // Les flèches suivent la direction du dernier (ou premier) segment.
    const avantFin = l.points ? l.points[l.points.length - 2] : l.k
    const aprèsDébut = l.points ? l.points[1] : l.k
    if (l.sens === 'vers' || l.sens === 'deux') flèche(ctx, l.p1, avantFin, couleurs.accent)
    if (l.sens === 'deux') flèche(ctx, l.p0, aprèsDébut, couleurs.accent)
  })

  // Lignes libres (couleur, épaisseur, style, flèches)
  lignes.forEach(l => {
    const é = l.épaisseur || 3
    const long = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) || 1
    const ux = (l.x2 - l.x1) / long
    const uy = (l.y2 - l.y1) / long
    const recul = 4 + é * 2.2
    const fin = l.flèche === 'fin' || l.flèche === 'deux'
    const début = l.flèche === 'début' || l.flèche === 'deux'
    ctx.save()
    ctx.strokeStyle = l.couleur
    ctx.fillStyle = l.couleur
    ctx.lineWidth = é
    ctx.lineCap = 'round'
    ctx.setLineDash(l.style === 'tirets' ? [é * 3 + 4, é * 2 + 4] : l.style === 'pointillés' ? [0.1, é * 2 + 3] : [])
    ctx.beginPath()
    ctx.moveTo(début ? l.x1 + ux * recul : l.x1, début ? l.y1 + uy * recul : l.y1)
    ctx.lineTo(fin ? l.x2 - ux * recul : l.x2, fin ? l.y2 - uy * recul : l.y2)
    ctx.stroke()
    ctx.setLineDash([])
    const pointe = (x, y, deX, deY) => {
      const t = 6 + é * 2.6
      const a = Math.atan2(y - deY, x - deX)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - t * Math.cos(a - 0.42), y - t * Math.sin(a - 0.42))
      ctx.lineTo(x - t * Math.cos(a + 0.42), y - t * Math.sin(a + 0.42))
      ctx.closePath()
      ctx.fill()
    }
    if (fin) pointe(l.x2, l.y2, l.x1, l.y1)
    if (début) pointe(l.x1, l.y1, l.x2, l.y2)
    ctx.restore()
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
    // Avec du code, le texte occupe l'espace au-dessus du bloc de code.
    const bas = b.code ? b.code.y - 6 * f : b.h - margeV
    const disponible = bas - margeV - hauteurImage
    let y = haut + margeV + hauteurImage + (disponible - lignes.length * hauteurLigne) / 2 + hauteurLigne / 2
    lignes.forEach(ligne => { ctx.fillText(ligne, b.x, y); y += hauteurLigne })

    if (b.code) dessinerCode(ctx, b.code, gauche, haut, polices)

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
