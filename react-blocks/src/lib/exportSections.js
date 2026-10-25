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

export function texteEnHTML(texte) {
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

// Document structuré prêt à imprimer en PDF, compact (le moins de pages
// possible) et lisible : en-tête court avec le contenu cliquable, vue
// d'ensemble (image sur fond clair, à la hauteur de la page), structure
// numérotée du graphe sur deux colonnes, puis les sections à la suite —
// aucun saut de page forcé, seuls les blocs courts (code, tableaux,
// encadrés) ne sont pas coupés.
export function pageImprimable({ nom, image, proportion = 0, colonnes, noeuds = [], liens = [], imageDe = () => null }) {
  const chapitres = colonnes.filter(c => c.sousSections.length)
  // Numéros : 1 vue d'ensemble, 2 structure, 3… sections.
  const numéroSection = new Map()
  chapitres.forEach((c, i) => c.sousSections.forEach((ss, j) => numéroSection.set(ss.id, `${i + 3}.${j + 1}`)))
  const sectionDeBulle = new Map(chapitres.flatMap(c => c.sousSections.filter(ss => ss.bulleId).map(ss => [ss.bulleId, ss])))
  const nbBlocs = chapitres.reduce((n, c) => n + c.sousSections.reduce((m, ss) => m + ss.blocs.length, 0), 0)
  const nbSous = chapitres.reduce((n, c) => n + c.sousSections.length, 0)
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const enfants = arbre(noeuds)
  const parId = new Map(noeuds.map(n => [n.id, n]))
  const bulle = (n, numéro) => {
    const ss = sectionDeBulle.get(n.id)
    const img = imageDe(n)
    return `<li><div class="bulle"><span class="num">${numéro}</span> <span class="texte-bulle">${n.icone ? `${n.icone} ` : ''}${texteEnHTML(n.texte)}</span>${
      ss ? ` <a class="renvoi" href="#ss-${ss.id}">→ ${numéroSection.get(ss.id)}</a>` : ''}</div>${
      img ? `<img class="img-bulle" src="${échapper(img)}" alt="">` : ''}${
      n.code ? blocEnHTML({ type: 'code', texte: n.code, langage: n.langage }) : ''}${
      (enfants.get(n.id) || []).length ? `<ol>${enfants.get(n.id).map((e, i) => bulle(e, `${numéro}.${i + 1}`)).join('')}</ol>` : ''}</li>`
  }
  const racines = enfants.get(null) || []
  const structure = racines.map((r, i) => bulle(r, `${i + 1}`)).join('')
  // Deux colonnes seulement si la structure est assez longue pour en profiter.
  const structureLongue = noeuds.length > 12
  // Hauteur de l'image sur la page (186 mm de large, 205 mm de haut au plus) :
  // si elle laisse moins de ~6 cm, la structure commence page suivante plutôt
  // que d'y laisser un titre seul.
  const hauteurImage = image ? Math.min(205, 186 * (proportion || 1)) : 0
  const sautAvantStructure = hauteurImage > 165
  const relations = liens.filter(l => parId.has(l.de) && parId.has(l.vers)).map(l => {
    const flèche = l.sens === 'deux' ? '↔' : l.sens === 'vers' ? '→' : '—'
    return `<li>${texteEnHTML(parId.get(l.de).texte)} <b>${flèche}</b> ${texteEnHTML(parId.get(l.vers).texte)}${l.texte ? ` <i>(${échapper(l.texte)})</i>` : ''}</li>`
  }).join('')

  const contenu = [
    image ? '<a href="#vue">1. Vue d\'ensemble</a>' : '',
    '<a href="#structure">2. Structure</a>',
    ...chapitres.map((c, i) => `<a href="#col-${c.id}">${i + 3}. ${échapper(c.titre)}</a>`),
  ].filter(Boolean).join('<span class="sep">·</span>')

  const corps = chapitres.map((c, i) => `
    <section class="chapitre" id="col-${c.id}">
      <h2><span class="num-chap">${i + 3}.</span> ${échapper(c.titre)}</h2>
      ${c.sousSections.map(ss => {
        const lié = ss.bulleId && parId.get(ss.bulleId)
        return `<section class="sous" id="ss-${ss.id}">
          <h3>${numéroSection.get(ss.id)} ${échapper(ss.titre)}${lié ? ` <span class="lie">🫧 ${texteEnHTML(lié.texte)}</span>` : ''}</h3>
          ${ss.blocs.map(blocEnHTML).join('') || '<p class="vide">(vide)</p>'}
        </section>`
      }).join('')}
    </section>`).join('')

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${échapper(nom)}</title>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box }
  @page { size: A4; margin: 12mm 12mm 14mm;
    @bottom-left { content: "${échapper(nom).replace(/"/g, '')}"; font: 8pt -apple-system, system-ui, sans-serif; color: #999 }
    @bottom-right { content: counter(page) " / " counter(pages); font: 8pt -apple-system, system-ui, sans-serif; color: #999 } }
  body { font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; color: #1b1b1b; margin: 0 auto; max-width: 820px; padding: 16px; line-height: 1.45; font-size: 10pt }
  a { color: inherit; text-decoration: none }
  .entete { border-left: 5px solid #f0a839; padding: 2px 0 2px 14px; margin: 0 0 10px }
  .entete .sur { font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; color: #c47a0d; font-weight: 700; margin: 0 }
  .entete h1 { font-family: Georgia, serif; font-style: italic; font-weight: 500; font-size: 24pt; line-height: 1.1; margin: 2px 0 3px }
  .entete .infos { color: #666; font-size: 9pt; margin: 0 }
  .contenu { font-size: 9pt; color: #444; margin: 0 0 12px; padding: 6px 10px; background: #f6f3ee; border-radius: 6px }
  .contenu a { font-weight: 600 } .contenu .sep { color: #c9b99c; margin: 0 7px }
  h2 { font-family: Georgia, serif; font-style: italic; font-weight: 500; font-size: 15pt; border-bottom: 1.5px solid #f0a839; padding-bottom: 3px; margin: 16px 0 8px; break-after: avoid }
  .num-chap { color: #c47a0d }
  h3 { font-size: 11pt; margin: 12px 0 4px; break-after: avoid; border-left: 3px solid #f0a839; padding-left: 7px }
  h3 .lie { font-size: 8.5pt; font-weight: 500; color: #777; margin-left: 6px }
  .vide { color: #999; font-style: italic }
  #vue h2 { margin-top: 4px }
  img.graphe { display: block; max-width: 100%; max-height: 205mm; width: auto; height: auto; margin: 0 auto; border-radius: 8px; border: 1px solid #e3ddd2 }
  .structure.saut { break-before: page } .structure.saut h2 { margin-top: 0 }
  .structure ol { list-style: none; padding-left: 12px; margin: 1px 0; border-left: 1px solid #e3d8c4 }
  .structure > ol { padding-left: 0; border: none }
  .structure.longue > ol { column-count: 2; column-gap: 7mm; column-rule: 1px solid #eee5d6 }
  .structure > ol > li { break-inside: avoid-column }
  .structure li { margin: 2px 0; font-size: 9pt; line-height: 1.35 }
  .bulle .num { color: #c47a0d; font-weight: 700; font-size: 8pt }
  .renvoi { font-size: 8pt; color: #3f6fb0; white-space: nowrap }
  .img-bulle { display: block; max-width: calc(100% - 12px); max-height: 55mm; margin: 3px 0 3px 12px; border-radius: 5px; break-inside: avoid }
  .structure .code { margin-left: 12px }
  .structure pre { font-size: 7.5pt }
  .relations { columns: 2; column-gap: 7mm; font-size: 8.5pt; padding-left: 16px; margin: 4px 0 } .relations li { break-inside: avoid; margin: 1px 0 }
  .relations i { color: #777 }
  p { margin: 4px 0 }
  .code { background: #0d0f14; border-radius: 6px; margin: 6px 0; overflow: hidden; break-inside: avoid }
  .langage { background: #151924; color: #8a94ad; font-size: 7pt; text-transform: uppercase; letter-spacing: .08em; padding: 3px 8px }
  pre { margin: 0; padding: 6px 0; font: 8.5pt/1.5 ui-monospace, Menlo, Consolas, monospace; color: #e2e8f0; white-space: pre-wrap; word-break: break-word }
  .ligne { display: flex; padding-right: 8px } .ligne.marquee { background: rgba(255,214,10,.15); box-shadow: inset 3px 0 0 #ffd60a }
  .ligne .num { width: 3ch; text-align: right; padding-right: 1ch; color: #4b5470; flex-shrink: 0 }
  .encadre { border-left: 4px solid; border-radius: 5px; padding: 6px 10px; margin: 6px 0; break-inside: avoid }
  .titre-encadre { font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 1px }
  ul.cases { list-style: none; padding-left: 2px; margin: 4px 0 } ul.cases li { margin: 1px 0 } ul.cases li.fait { color: #888; text-decoration: line-through }
  table { border-collapse: collapse; margin: 6px 0; font-size: 9pt; break-inside: avoid } th, td { border: 1px solid #ccc; padding: 3px 7px; text-align: left; vertical-align: top } th { background: #f3f0ea }
  @media screen { body { padding-bottom: 60px } }
</style></head><body>
<header class="entete">
  <p class="sur">Graphe et fiches</p>
  <h1>${échapper(nom)}</h1>
  <p class="infos">${date} · ${noeuds.length} bulle${noeuds.length > 1 ? 's' : ''} · ${nbSous} sous-section${nbSous > 1 ? 's' : ''} · ${nbBlocs} bloc${nbBlocs > 1 ? 's' : ''}</p>
</header>
<nav class="contenu">${contenu}</nav>
${image ? `<section id="vue"><h2><span class="num-chap">1.</span> Vue d'ensemble</h2><img class="graphe" src="${image}" alt="Graphe ${échapper(nom)}"></section>` : ''}
<section class="structure${structureLongue ? ' longue' : ''}${sautAvantStructure ? ' saut' : ''}" id="structure"><h2><span class="num-chap">2.</span> Structure du graphe</h2>
  ${structure ? `<ol>${structure}</ol>` : '<p class="vide">(aucune bulle)</p>'}
  ${relations ? `<h3>Relations entre les idées</h3><ul class="relations">${relations}</ul>` : ''}
</section>
${corps}
</body></html>`
}
