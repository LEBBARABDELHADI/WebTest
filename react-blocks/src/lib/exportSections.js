// Export d'un graphe et de ses sections : Markdown (fichier .md) ou page
// imprimable (→ PDF avec « Imprimer » du navigateur).
import { analyserTexte } from './texteFormate'
import { codeEnHTML } from './coloration'
import { VARIANTES } from '../components/SectionsGraphe'

const sansCouleurs = t => (t || '').replace(/\{\{#[0-9a-fA-F]{6}\|([\s\S]*?)\}\}/g, '$1')
const échapper = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const cellule = t => sansCouleurs(t).replace(/\|/g, '\\|')

function blocEnMarkdown(b) {
  if (b.type === 'code') return `\`\`\`${(b.langage || '').toLowerCase()}\n${b.texte}\n\`\`\``
  if (b.type === 'encadré') {
    const v = VARIANTES[b.variante] || VARIANTES.astuce
    return sansCouleurs(`${v.emoji} **${v.nom}** — ${b.texte}`).split('\n').map(l => `> ${l}`).join('\n')
  }
  if (b.type === 'liste') return (b.éléments || []).map(e => `- [${e.fait ? 'x' : ' '}] ${sansCouleurs(e.texte)}`).join('\n')
  if (b.type === 'tableau') {
    const lignes = b.lignes || []
    if (!lignes.length) return ''
    const n = Math.max(...lignes.map(l => l.length))
    const rangée = l => `| ${Array.from({ length: n }, (_, j) => cellule(l[j] || '')).join(' | ')} |`
    return [rangée(lignes[0]), `|${' --- |'.repeat(n)}`, ...lignes.slice(1).map(rangée)].join('\n')
  }
  return sansCouleurs(b.texte)
}

// plan : plan numéroté du graphe (texte), colonnes : sections du graphe.
export function exporterMarkdown({ nom, plan, colonnes }) {
  const parties = [`# ${nom}`, '', '## Graphe', '', '```', plan, '```']
  colonnes.forEach(c => {
    if (!c.sousSections.length) return
    parties.push('', `## ${c.titre}`)
    c.sousSections.forEach(s => {
      parties.push('', `### ${s.titre}`)
      s.blocs.forEach(b => parties.push('', blocEnMarkdown(b)))
    })
  })
  return `${parties.join('\n')}\n`
}

function texteEnHTML(texte) {
  return analyserTexte(texte || '').map(seg => {
    let h = échapper(seg.texte).replace(/\n/g, '<br>')
    if (seg.gras) h = `<strong>${h}</strong>`
    if (seg.couleur) h = `<span style="color:${seg.couleur}">${h}</span>`
    return h
  }).join('')
}

function blocEnHTML(b) {
  if (b.type === 'code') {
    const surlignées = new Set(b.surlignées || [])
    const lignes = codeEnHTML(b.texte || '', b.langage).split('\n')
      .map((l, i) => `<div class="ligne${surlignées.has(i + 1) ? ' marquee' : ''}"><span class="num">${i + 1}</span><span>${l || ' '}</span></div>`).join('')
    return `<div class="code"><div class="langage">${échapper(b.langage || 'Code')}</div><pre>${lignes}</pre></div>`
  }
  if (b.type === 'encadré') {
    const v = VARIANTES[b.variante] || VARIANTES.astuce
    return `<div class="encadre" style="border-color:${v.couleur};background:${v.couleur}1a"><div class="titre-encadre" style="color:${v.couleur}">${v.emoji} ${v.nom}</div>${texteEnHTML(b.texte)}</div>`
  }
  if (b.type === 'liste') {
    return `<ul class="cases">${(b.éléments || []).map(e => `<li class="${e.fait ? 'fait' : ''}">${e.fait ? '☑' : '☐'} ${texteEnHTML(e.texte)}</li>`).join('')}</ul>`
  }
  if (b.type === 'tableau') {
    const [entête = [], ...corps] = b.lignes || []
    const n = Math.max(0, ...(b.lignes || []).map(l => l.length))
    const cases = (l, balise) => Array.from({ length: n }, (_, j) => `<${balise}>${texteEnHTML(l[j] || '')}</${balise}>`).join('')
    return `<table><thead><tr>${cases(entête, 'th')}</tr></thead><tbody>${corps.map(l => `<tr>${cases(l, 'td')}</tr>`).join('')}</tbody></table>`
  }
  return `<p>${texteEnHTML(b.texte)}</p>`
}

// Graphe en arbre : racines puis enfants, de haut en bas.
function arbre(noeuds) {
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

// Document structuré prêt à imprimer en PDF : page de titre, sommaire
// cliquable, vue d'ensemble (image), structure numérotée du graphe (avec
// renvois vers les sous-sections reliées) puis un chapitre par section.
export function pageImprimable({ nom, image, colonnes, noeuds = [], liens = [], imageDe = () => null }) {
  const chapitres = colonnes.filter(c => c.sousSections.length)
  // Numéros : 1 vue d'ensemble, 2 structure, 3… sections.
  const numéroSection = new Map()
  chapitres.forEach((c, i) => c.sousSections.forEach((ss, j) => numéroSection.set(ss.id, `${i + 3}.${j + 1}`)))
  const sectionDeBulle = new Map(chapitres.flatMap(c => c.sousSections.filter(ss => ss.bulleId).map(ss => [ss.bulleId, ss])))
  const nbBlocs = chapitres.reduce((n, c) => n + c.sousSections.reduce((m, ss) => m + ss.blocs.length, 0), 0)
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const enfants = arbre(noeuds)
  const parId = new Map(noeuds.map(n => [n.id, n]))
  const bulle = (n, numéro) => {
    const ss = sectionDeBulle.get(n.id)
    const img = imageDe(n)
    return `<li><div class="bulle"><span class="num">${numéro}</span><span class="texte-bulle">${n.icone ? `${n.icone} ` : ''}${texteEnHTML(n.texte)}</span>${
      ss ? ` <a class="renvoi" href="#ss-${ss.id}">→ voir ${numéroSection.get(ss.id)} ${échapper(ss.titre)}</a>` : ''}</div>${
      img ? `<img class="img-bulle" src="${échapper(img)}" alt="">` : ''}${
      n.code ? blocEnHTML({ type: 'code', texte: n.code, langage: n.langage }) : ''}${
      (enfants.get(n.id) || []).length ? `<ol>${enfants.get(n.id).map((e, i) => bulle(e, `${numéro}.${i + 1}`)).join('')}</ol>` : ''}</li>`
  }
  const structure = (enfants.get(null) || []).map((r, i) => bulle(r, `2.${i + 1}`)).join('')
  const relations = liens.filter(l => parId.has(l.de) && parId.has(l.vers)).map(l => {
    const flèche = l.sens === 'deux' ? '↔' : l.sens === 'vers' ? '→' : '—'
    return `<tr><td>${texteEnHTML(parId.get(l.de).texte)}</td><td class="centre">${flèche}</td><td>${texteEnHTML(parId.get(l.vers).texte)}</td><td>${échapper(l.texte || '')}</td></tr>`
  }).join('')

  const sommaire = `
    <li><a href="#vue">1. Vue d'ensemble</a></li>
    <li><a href="#structure">2. Structure du graphe</a></li>
    ${chapitres.map((c, i) => `<li><a href="#col-${c.id}">${i + 3}. ${échapper(c.titre)}</a>
      <ol>${c.sousSections.map(ss => `<li><a href="#ss-${ss.id}">${numéroSection.get(ss.id)} ${échapper(ss.titre)}</a></li>`).join('')}</ol></li>`).join('')}`

  const corps = chapitres.map((c, i) => `
    <section class="chapitre" id="col-${c.id}">
      <h2><span class="num-chap">${i + 3}.</span> ${échapper(c.titre)}</h2>
      ${c.sousSections.map(ss => {
        const lié = ss.bulleId && parId.get(ss.bulleId)
        return `<section class="sous" id="ss-${ss.id}">
          <h3>${numéroSection.get(ss.id)} ${échapper(ss.titre)}</h3>
          ${lié ? `<p class="lie">Bulle reliée : <strong>${texteEnHTML(lié.texte)}</strong></p>` : ''}
          ${ss.blocs.map(blocEnHTML).join('') || '<p class="vide">(vide)</p>'}
        </section>`
      }).join('')}
    </section>`).join('')

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${échapper(nom)}</title>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box }
  @page { size: A4; margin: 18mm 15mm 18mm;
    @bottom-left { content: "${échapper(nom).replace(/"/g, '')}"; font: 9pt -apple-system, system-ui, sans-serif; color: #999 }
    @bottom-right { content: counter(page) " / " counter(pages); font: 9pt -apple-system, system-ui, sans-serif; color: #999 } }
  @page :first { @bottom-left { content: none } @bottom-right { content: none } }
  body { font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; color: #1b1b1b; margin: 0 auto; max-width: 820px; padding: 24px 16px; line-height: 1.55; font-size: 11pt }
  a { color: inherit; text-decoration: none }
  .couverture { min-height: 92vh; display: flex; flex-direction: column; justify-content: center; break-after: page; border-left: 6px solid #f0a839; padding-left: 28px }
  .couverture .sur { font-size: 10pt; letter-spacing: .14em; text-transform: uppercase; color: #c47a0d; font-weight: 700; margin: 0 0 10px }
  .couverture h1 { font-family: Georgia, serif; font-style: italic; font-weight: 500; font-size: 40pt; line-height: 1.1; margin: 0 0 14px }
  .couverture .date { color: #666; margin: 0 0 24px }
  .chiffres { display: flex; gap: 28px; color: #444 } .chiffres strong { display: block; font-family: Georgia, serif; font-size: 22pt; font-weight: 500; color: #1b1b1b }
  .sommaire { break-after: page }
  .sommaire h2, h2 { font-family: Georgia, serif; font-style: italic; font-weight: 500; font-size: 22pt; border-bottom: 2px solid #f0a839; padding-bottom: 6px; margin: 0 0 16px; break-after: avoid }
  .sommaire ol { list-style: none; padding-left: 0; margin: 0 } .sommaire > ol > li { margin: 8px 0; font-weight: 600 }
  .sommaire ol ol { padding-left: 22px; font-weight: 400; color: #444 } .sommaire ol ol li { margin: 3px 0 }
  .sommaire a { display: block; border-bottom: 1px dotted #ccc; padding-bottom: 2px }
  .chapitre { break-before: page }
  .num-chap { color: #c47a0d }
  h3 { font-size: 13pt; margin: 20px 0 6px; break-after: avoid; border-left: 3px solid #f0a839; padding-left: 8px }
  .sous { break-inside: avoid-page }
  .lie { font-size: 9.5pt; color: #666; margin: 0 0 6px }
  .vide { color: #999; font-style: italic }
  img.graphe { width: 100%; border-radius: 10px; border: 1px solid #ddd }
  .structure ol { list-style: none; padding-left: 18px; margin: 2px 0; border-left: 1px solid #e3d8c4 } .structure > ol { padding-left: 0; border: none }
  .structure li { margin: 4px 0; break-inside: avoid }
  .bulle .num { display: inline-block; min-width: 4.6em; padding-right: 6px; color: #c47a0d; font-weight: 700; font-size: 9.5pt }
  .renvoi { font-size: 9pt; color: #5b8dc9; margin-left: 6px; white-space: nowrap }
  .img-bulle { display: block; max-width: 220px; max-height: 140px; margin: 4px 0 4px 4.6em; border-radius: 6px }
  .structure .code { margin-left: 4.6em }
  p { margin: 6px 0 }
  .code { background: #0d0f14; border-radius: 8px; margin: 8px 0; overflow: hidden; break-inside: avoid }
  .langage { background: #151924; color: #8a94ad; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; padding: 4px 10px }
  pre { margin: 0; padding: 8px 0; font: 9pt/1.6 ui-monospace, Menlo, Consolas, monospace; color: #e2e8f0; white-space: pre-wrap; word-break: break-word }
  .ligne { display: flex; padding-right: 10px } .ligne.marquee { background: rgba(255,214,10,.15); box-shadow: inset 3px 0 0 #ffd60a }
  .ligne .num { width: 3.2ch; text-align: right; padding-right: 1.2ch; color: #4b5470; flex-shrink: 0 }
  .encadre { border-left: 4px solid; border-radius: 6px; padding: 8px 12px; margin: 8px 0; break-inside: avoid }
  .titre-encadre { font-size: 8.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px }
  ul.cases { list-style: none; padding-left: 4px; margin: 6px 0 } ul.cases li.fait { color: #888; text-decoration: line-through }
  table { border-collapse: collapse; margin: 8px 0; font-size: 10pt; break-inside: avoid } th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; vertical-align: top } th { background: #f3f0ea } td.centre { text-align: center }
  @media screen { body { padding-bottom: 60px } .chapitre, .sommaire { border-top: 1px dashed #ddd; padding-top: 24px; margin-top: 30px } }
</style></head><body>
<header class="couverture">
  <p class="sur">Graphe et fiches</p>
  <h1>${échapper(nom)}</h1>
  <p class="date">${date}</p>
  <div class="chiffres"><span><strong>${noeuds.length}</strong>bulles</span><span><strong>${chapitres.reduce((n, c) => n + c.sousSections.length, 0)}</strong>sous-sections</span><span><strong>${nbBlocs}</strong>blocs</span></div>
</header>
<nav class="sommaire"><h2>Sommaire</h2><ol>${sommaire}</ol></nav>
<section id="vue"><h2><span class="num-chap">1.</span> Vue d'ensemble</h2>${image ? `<img class="graphe" src="${image}" alt="Graphe ${échapper(nom)}">` : '<p class="vide">(graphe vide)</p>'}</section>
<section class="chapitre structure" id="structure"><h2><span class="num-chap">2.</span> Structure du graphe</h2>
  ${structure ? `<ol>${structure}</ol>` : '<p class="vide">(aucune bulle)</p>'}
  ${relations ? `<h3>Relations entre les idées</h3><table><thead><tr><th>De</th><th></th><th>Vers</th><th>Lien</th></tr></thead><tbody>${relations}</tbody></table>` : ''}
</section>
${corps}
</body></html>`
}
