// Export du « Graphe amélioré » en image : redessine les éléments sur un
// canevas (fond clair), pour tout le tableau ou un cadre. Les fonctions de
// géométrie (boîte, bouts, cheminLigne, taillePolice, cheminForme) sont
// fournies par la page pour garder un seul calcul.

function chargerImage(url) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function lignesDeTexte(ctx, texte, largeur) {
  const lignes = []
  ;(texte || '').split('\n').forEach(par => {
    let ligne = ''
    par.split(/\s+/).forEach(mot => {
      const essai = ligne ? `${ligne} ${mot}` : mot
      if (ctx.measureText(essai).width > largeur && ligne) { lignes.push(ligne); ligne = mot } else ligne = essai
    })
    lignes.push(ligne)
  })
  return lignes
}

function écrire(ctx, texte, b, { taille, couleur = '#1b1b1b', gras = false, align = 'center', vertical = 'center', police }) {
  if (!texte) return
  ctx.save()
  ctx.fillStyle = couleur
  ctx.font = `${gras ? 700 : 400} ${taille}px ${police}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = align
  const lignes = lignesDeTexte(ctx, texte, b.l)
  const h = taille * 1.25
  const total = lignes.length * h
  let y = vertical === 'top' ? b.y + h / 2 : b.y + (b.h - total) / 2 + h / 2
  const x = align === 'left' ? b.x : align === 'right' ? b.x + b.l : b.x + b.l / 2
  ctx.beginPath(); ctx.rect(b.x - 2, b.y - 2, b.l + 4, b.h + 4); ctx.clip()
  lignes.forEach(l => { ctx.fillText(l, x, y); y += h })
  ctx.restore()
}

function flèche(ctx, de, vers, taille, couleur) {
  const a = Math.atan2(vers.y - de.y, vers.x - de.x)
  ctx.save()
  ctx.fillStyle = couleur
  ctx.beginPath()
  ctx.moveTo(vers.x, vers.y)
  ctx.lineTo(vers.x - taille * Math.cos(a - 0.45), vers.y - taille * Math.sin(a - 0.45))
  ctx.lineTo(vers.x - taille * Math.cos(a + 0.45), vers.y - taille * Math.sin(a + 0.45))
  ctx.closePath(); ctx.fill()
  ctx.restore()
}

export async function exporterTableauPNG({ éléments, région, outils, urlImage, police = 'system-ui, sans-serif', fond = '#ffffff' }) {
  const { boîte, bouts, cheminLigne, taillePolice, cheminForme } = outils
  const parId = new Map(éléments.map(e => [e.id, e]))
  const visibles = région
    ? éléments.filter(e => { const b = e.type === 'ligne' ? (() => { const { a, b: z } = bouts(e, parId); return { x: Math.min(a.x, z.x), y: Math.min(a.y, z.y), l: Math.abs(z.x - a.x), h: Math.abs(z.y - a.y) } })() : boîte(e); return b.x < région.x + région.l && b.x + b.l > région.x && b.y < région.y + région.h && b.y + b.h > région.y })
    : éléments
  const bs = visibles.map(e => (e.type === 'ligne' ? (() => { const { a, b } = bouts(e, parId); return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), l: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) } })() : boîte(e)))
  if (!bs.length) throw new Error('Rien à exporter')
  const marge = 40
  const zone = région || {
    x: Math.min(...bs.map(b => b.x)) - marge, y: Math.min(...bs.map(b => b.y)) - marge - 30,
    l: Math.max(...bs.map(b => b.x + b.l)) - Math.min(...bs.map(b => b.x)) + 2 * marge,
    h: Math.max(...bs.map(b => b.y + b.h)) - Math.min(...bs.map(b => b.y)) + 2 * marge + 30,
  }
  const échelle = Math.min(3, 7000 / Math.max(zone.l, zone.h), Math.sqrt(30e6 / (zone.l * zone.h)))
  const toile = document.createElement('canvas')
  toile.width = Math.ceil(zone.l * échelle); toile.height = Math.ceil(zone.h * échelle)
  const ctx = toile.getContext('2d')
  ctx.scale(échelle, échelle); ctx.translate(-zone.x, -zone.y)
  ctx.fillStyle = fond; ctx.fillRect(zone.x, zone.y, zone.l, zone.h)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'

  const images = new Map(await Promise.all(visibles.filter(e => e.type === 'image').map(async e => [e.id, await chargerImage(await urlImage(e.image))])))

  // 1. Cadres
  visibles.filter(e => e.type === 'cadre').forEach(e => {
    ctx.fillStyle = e.couleur || '#ffffff'; ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = 1.5
    ctx.fillRect(e.x, e.y, e.l, e.h); ctx.strokeRect(e.x, e.y, e.l, e.h)
    écrire(ctx, e.texte || 'Cadre', { x: e.x, y: e.y - 26, l: e.l, h: 22 }, { taille: 15, couleur: '#555', align: 'left', police })
  })
  // 2. Lignes et traits
  visibles.filter(e => e.type === 'ligne' || e.type === 'trait').forEach(e => {
    ctx.save()
    ctx.strokeStyle = e.couleur; ctx.lineWidth = e.épaisseur
    if (e.type === 'trait') {
      ctx.beginPath(); e.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore(); return
    }
    const { d, a, b, avantFin, aprèsDébut, milieu } = cheminLigne(e, parId)
    if (e.style === 'tirets') ctx.setLineDash([8 + e.épaisseur * 2, 6 + e.épaisseur * 2])
    ctx.stroke(new Path2D(d))
    ctx.setLineDash([])
    const t = 8 + e.épaisseur * 3
    if (e.flèche === 'fin' || e.flèche === 'deux') flèche(ctx, avantFin, b, t, e.couleur)
    if (e.flèche === 'deux') flèche(ctx, aprèsDébut, a, t, e.couleur)
    if (e.texte) {
      ctx.font = `400 14px ${police}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.lineWidth = 5; ctx.strokeStyle = fond; ctx.strokeText(e.texte, milieu.x, milieu.y - 8); ctx.fillStyle = '#1b1b1b'; ctx.fillText(e.texte, milieu.x, milieu.y - 8)
    }
    ctx.restore()
  })
  // 3. Blocs
  visibles.filter(e => !['cadre', 'ligne', 'trait'].includes(e.type)).forEach(e => {
    const fs = avecTaille(e) ? taillePolice(e) : 14
    if (e.type === 'note') {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5
      ctx.fillStyle = e.couleur; ctx.fillRect(e.x, e.y, e.l, e.h); ctx.restore()
      const p = Math.max(8, e.l * 0.07)
      écrire(ctx, e.texte, { x: e.x + p, y: e.y + p, l: e.l - 2 * p, h: e.h - 2 * p }, { taille: fs, gras: e.gras, align: alignement(e.align, 'center'), police, ...(e.tâcheFaite ? { couleur: '#777' } : {}) })
    } else if (e.type === 'texte') {
      écrire(ctx, e.texte, { x: e.x + 4, y: e.y + 4, l: e.l - 8, h: e.h - 8 }, { taille: fs, couleur: e.couleur, gras: e.gras, align: alignement(e.align, 'left'), vertical: 'top', police })
    } else if (e.type === 'forme') {
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.l / 100, e.h / 100)
      const chemin = new Path2D(cheminForme(e.forme))
      ctx.fillStyle = e.couleur; ctx.fill(chemin)
      ctx.restore()
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.l / 100, e.h / 100); ctx.lineWidth = 2 / Math.min(e.l / 100, e.h / 100); ctx.strokeStyle = e.bord || '#1b1b1b'; ctx.stroke(chemin); ctx.restore()
      const px = e.l * (e.forme === 'bulle' ? 0.1 : 0.12), py = e.h * (e.forme === 'bulle' ? 0.08 : 0.12)
      écrire(ctx, e.texte, { x: e.x + px, y: e.y + py, l: e.l - 2 * px, h: e.h * (e.forme === 'bulle' ? 0.62 : 0.76) }, { taille: fs, couleur: e.couleurTexte || '#1b1b1b', gras: e.gras, align: alignement(e.align, 'center'), police })
    } else if (e.type === 'commentaire') {
      ctx.fillStyle = '#3b5bdb'; ctx.beginPath(); ctx.arc(e.x + e.l / 2, e.y + e.h / 2, e.l / 2, 0, Math.PI * 2); ctx.fill()
      ctx.font = `${e.h * 0.5}px ${police}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💬', e.x + e.l / 2, e.y + e.h / 2)
    } else if (e.type === 'image') {
      const img = images.get(e.id)
      if (img) ctx.drawImage(img, e.x, e.y, e.l, e.h)
      else { ctx.fillStyle = '#e9e9e9'; ctx.fillRect(e.x, e.y, e.l, e.h) }
    }
  })
  return new Promise(resolve => toile.toBlob(resolve, 'image/png'))
}
const avecTaille = e => ['note', 'texte', 'forme'].includes(e.type)
const alignement = (a, défaut) => (a === 'left' ? 'left' : a === 'right' ? 'right' : a === 'center' ? 'center' : défaut)
