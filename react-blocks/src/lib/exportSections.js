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

// Page complète prête à imprimer : image du graphe puis les sections.
export function pageImprimable({ nom, image, colonnes }) {
  const sections = colonnes.filter(c => c.sousSections.length).map(c => `
    <h2>${échapper(c.titre)}</h2>
    ${c.sousSections.map(s => `<section><h3>${échapper(s.titre)}</h3>${s.blocs.map(blocEnHTML).join('')}</section>`).join('')}
  `).join('')
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${échapper(nom)}</title>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box }
  body { font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; color: #1b1b1b; margin: 24px auto; max-width: 900px; padding: 0 16px; line-height: 1.55 }
  h1 { font-family: Georgia, serif; font-style: italic; font-weight: 500; font-size: 30px; margin: 0 0 14px }
  h2 { font-family: Georgia, serif; font-style: italic; font-weight: 500; font-size: 22px; border-bottom: 2px solid #f0a839; padding-bottom: 4px; margin: 28px 0 10px; break-after: avoid }
  h3 { font-size: 16px; margin: 16px 0 6px; break-after: avoid }
  img.graphe { width: 100%; border-radius: 10px; border: 1px solid #ddd }
  section { break-inside: avoid-page }
  p { margin: 6px 0 }
  .code { background: #0d0f14; border-radius: 8px; margin: 8px 0; overflow: hidden; break-inside: avoid }
  .langage { background: #151924; color: #8a94ad; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; padding: 4px 10px }
  pre { margin: 0; padding: 8px 0; font: 12px/1.6 ui-monospace, Menlo, Consolas, monospace; color: #e2e8f0; white-space: pre-wrap; word-break: break-word }
  .ligne { display: flex; padding-right: 10px } .ligne.marquee { background: rgba(255,214,10,.15); box-shadow: inset 3px 0 0 #ffd60a }
  .num { width: 3.2ch; text-align: right; padding-right: 1.2ch; color: #4b5470; flex-shrink: 0; user-select: none }
  .encadre { border-left: 4px solid; border-radius: 6px; padding: 8px 12px; margin: 8px 0 }
  .titre-encadre { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px }
  ul.cases { list-style: none; padding-left: 4px; margin: 6px 0 } ul.cases li.fait { color: #888; text-decoration: line-through }
  table { border-collapse: collapse; margin: 8px 0; font-size: 13px } th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; vertical-align: top } th { background: #f3f0ea }
  @media print { body { margin: 0 auto } }
</style></head><body>
<h1>${échapper(nom)}</h1>
${image ? `<img class="graphe" src="${image}" alt="Graphe ${échapper(nom)}">` : ''}
${sections}
</body></html>`
}
