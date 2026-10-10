// Mémoriser → page imprimable (PDF) : fiche de révision, fiche
// d'interrogation (réponses masquées) ou cartes à découper recto / verso.
import { texteEnHTML } from './exportSections'

const échapper = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const PAR_PAGE = 8 // cartes à découper : 2 colonnes × 4 rangées

function face(texte, image, imageDe) {
  const src = image ? imageDe(image) : null
  return `${src ? `<img src="${échapper(src)}" alt="">` : ''}<div>${texteEnHTML(texte)}</div>`
}

// groupes : [{ paquet, cartes }] ; mode : 'fiche' | 'quiz' | 'decouper'
export function pageMémo({ titre, groupes, mode, imageDe = () => null }) {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const total = groupes.reduce((n, g) => n + g.cartes.length, 0)
  let corps = ''
  if (mode === 'decouper') {
    const toutes = groupes.flatMap(g => g.cartes.map(c => ({ ...c, paquet: g.paquet })))
    for (let i = 0; i < toutes.length; i += PAR_PAGE) {
      const lot = toutes.slice(i, i + PAR_PAGE)
      while (lot.length < PAR_PAGE) lot.push(null)
      const rectos = lot.map((c, j) => `<div class="carte">${c ? `<span class="coin">${échapper(c.paquet.nom)} · ${i + j + 1}</span>${face(c.recto, c.imageRecto, imageDe)}` : ''}</div>`).join('')
      // Verso : colonnes inversées pour tomber au dos de la bonne carte
      // (impression recto verso, retournement sur le bord long).
      const versos = []
      for (let r = 0; r < PAR_PAGE / 2; r++) {
        ;[lot[r * 2 + 1], lot[r * 2]].forEach((c, k) => versos.push(`<div class="carte verso">${c ? `<span class="coin">${i + r * 2 + (k === 0 ? 2 : 1)}</span>${face(c.verso, c.imageVerso, imageDe)}` : ''}</div>`))
      }
      corps += `<section class="planche">${rectos}</section><section class="planche">${versos.join('')}</section>`
    }
  } else {
    corps = groupes.map(g => `
      <h2><span class="pastille" style="background:${échapper(g.paquet.couleur || '#f0a839')}"></span>${échapper(g.paquet.nom)} <small>${g.cartes.length} carte${g.cartes.length > 1 ? 's' : ''}</small></h2>
      <table><thead><tr><th class="n">#</th><th>Question</th><th>Réponse</th></tr></thead><tbody>
        ${g.cartes.map((c, i) => `<tr><td class="n">${i + 1}</td><td>${face(c.recto, c.imageRecto, imageDe)}</td><td class="${mode === 'quiz' ? 'vide' : ''}">${mode === 'quiz' ? '' : face(c.verso, c.imageVerso, imageDe)}</td></tr>`).join('')}
      </tbody></table>`).join('')
  }
  const sousTitre = { fiche: 'Fiche de révision', quiz: 'Interrogation — réponses à écrire', decouper: 'Cartes à découper (imprimer en recto verso, bord long)' }[mode]
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${échapper(titre)}</title>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box }
  @page { size: A4; margin: ${mode === 'decouper' ? '10mm' : '16mm 14mm'};
    @bottom-right { content: counter(page) " / " counter(pages); font: 9pt system-ui, sans-serif; color: #999 } }
  body { font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; color: #1b1b1b; margin: 0 auto; max-width: 820px; padding: 20px 14px; line-height: 1.45; font-size: 11pt }
  header { border-left: 5px solid #f0a839; padding-left: 14px; margin-bottom: 18px }
  header .sur { margin: 0; font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: #c47a0d; font-weight: 700 }
  h1 { font-family: Georgia, serif; font-style: italic; font-weight: 500; font-size: 26pt; margin: 4px 0 }
  header p { margin: 0; color: #666 }
  h2 { font-size: 14pt; margin: 22px 0 8px; display: flex; align-items: center; gap: 8px; break-after: avoid }
  h2 small { color: #888; font-weight: 400; font-size: 10pt }
  .pastille { width: 12px; height: 12px; border-radius: 50%; display: inline-block }
  table { width: 100%; border-collapse: collapse } th, td { border: 1px solid #d8d2c6; padding: 7px 9px; text-align: left; vertical-align: top }
  th { background: #f3efe6; font-size: 9.5pt } th:nth-child(2), th:nth-child(3) { width: 47% } td.n, th.n { width: 2.6em; color: #999; text-align: right }
  tr { break-inside: avoid } td.vide { height: 3.2em; background: repeating-linear-gradient(transparent, transparent 1.55em, #e4ddd0 1.55em, #e4ddd0 calc(1.55em + 1px)) }
  td img { max-width: 160px; max-height: 110px; display: block; margin-bottom: 4px; border-radius: 4px }
  .planche { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, 66mm); gap: 0; break-after: page; margin-bottom: 10px }
  .carte { position: relative; border: 1px dashed #bbb; padding: 10mm 8mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-size: 12.5pt; overflow: hidden }
  .carte.verso { background: #faf7f0 }
  .carte img { max-width: 70%; max-height: 28mm; margin-bottom: 4px; border-radius: 4px }
  .coin { position: absolute; top: 3mm; left: 4mm; font-size: 7.5pt; color: #aaa }
  @media screen { .planche { border: 1px solid #eee; } }
</style></head><body>
${mode === 'decouper' ? '' : `<header><p class="sur">Mémoriser · ${sousTitre}</p><h1>${échapper(titre)}</h1><p>${date} · ${total} carte${total > 1 ? 's' : ''}</p></header>`}
${corps}
</body></html>`
}
