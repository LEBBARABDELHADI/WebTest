import{V as e}from"./index-3dYGjnq_.js";import{d as t,n}from"./SectionsGraphe-CUEXeoJM.js";var r=e=>(e||``).replace(/\{\{#[0-9a-fA-F]{6}\|([\s\S]*?)\}\}/g,`$1`),i=e=>String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),a=e=>r(e).replace(/\|/g,`\\|`);function o(e){if(e.type===`image`)return`🖼️ ${r(e.texte)||`Photo`}`;if(e.type===`code`)return`\`\`\`${(e.langage||``).toLowerCase()}\n${e.texte}\n\`\`\``;if(e.type===`encadré`){let t=n[e.variante]||n.astuce;return r(`${t.emoji} **${t.nom}** — ${e.texte}`).split(`
`).map(e=>`> ${e}`).join(`
`)}if(e.type===`liste`)return(e.éléments||[]).map(e=>`- [${e.fait?`x`:` `}] ${r(e.texte)}`).join(`
`);if(e.type===`tableau`){let t=e.lignes||[];if(!t.length)return``;let n=Math.max(...t.map(e=>e.length)),r=e=>`| ${Array.from({length:n},(t,n)=>a(e[n]||``)).join(` | `)} |`;return[r(t[0]),`|${` --- |`.repeat(n)}`,...t.slice(1).map(r)].join(`
`)}return r(e.texte)}function s({nom:e,plan:t,colonnes:n}){let r=[`# ${e}`,``,`## Graphe`,``,"```",t,"```"];return n.forEach(e=>{e.sousSections.length&&(r.push(``,`## ${e.titre}`),e.sousSections.forEach(e=>{r.push(``,`### ${e.titre}`),e.blocs.forEach(e=>r.push(``,o(e)))}))}),`${r.join(`
`)}\n`}function c(t){return e(t||``).map(e=>{let t=i(e.texte).replace(/\n/g,`<br>`);return e.gras&&(t=`<strong>${t}</strong>`),e.couleur&&(t=`<span style="color:${e.couleur}">${t}</span>`),t}).join(``)}function l(e,r=()=>null){if(e.type===`image`){let t=e.image&&r(e);return`<figure class="photo">${t?`<img src="${i(t)}" alt="">`:`<p class="vide">(photo)</p>`}${e.texte?`<figcaption>${c(e.texte)}</figcaption>`:``}</figure>`}if(e.type===`code`){let n=new Set(e.surlignées||[]),r=t(e.texte||``,e.langage).split(`
`).map((e,t)=>`<div class="ligne${n.has(t+1)?` marquee`:``}"><span class="num">${t+1}</span><span>${e||` `}</span></div>`).join(``);return`<div class="code"><div class="langage">${i(e.langage||`Code`)}</div><pre>${r}</pre></div>`}if(e.type===`encadré`){let t=n[e.variante]||n.astuce;return`<div class="encadre" style="border-color:${t.couleur};background:${t.couleur}1a"><div class="titre-encadre" style="color:${t.couleur}">${t.emoji} ${t.nom}</div>${c(e.texte)}</div>`}if(e.type===`liste`)return`<ul class="cases">${(e.éléments||[]).map(e=>`<li class="${e.fait?`fait`:``}">${e.fait?`☑`:`☐`} ${c(e.texte)}</li>`).join(``)}</ul>`;if(e.type===`tableau`){let[t=[],...n]=e.lignes||[],r=Math.max(0,...(e.lignes||[]).map(e=>e.length)),i=(e,t)=>Array.from({length:r},(n,r)=>`<${t}>${c(e[r]||``)}</${t}>`).join(``);return`<table><thead><tr>${i(t,`th`)}</tr></thead><tbody>${n.map(e=>`<tr>${i(e,`td`)}</tr>`).join(``)}</tbody></table>`}return`<p>${c(e.texte)}</p>`}function u(e){let t=new Set(e.map(e=>e.id)),n=new Map;return e.forEach(e=>{let r=e.parentId&&t.has(e.parentId)?e.parentId:null;n.has(r)||n.set(r,[]),n.get(r).push(e)}),n.forEach(e=>e.sort((e,t)=>e.y-t.y||e.x-t.x)),n}function d({nom:e,image:t,proportion:n=0,colonnes:r,noeuds:a=[],liens:o=[],imageDe:s=()=>null,imageDeBloc:d=()=>null}){let f=r.filter(e=>e.sousSections.length),p=new Map;f.forEach((e,t)=>e.sousSections.forEach((e,n)=>p.set(e.id,`${t+3}.${n+1}`)));let m=new Map(f.flatMap(e=>e.sousSections.filter(e=>e.bulleId).map(e=>[e.bulleId,e]))),h=f.reduce((e,t)=>e+t.sousSections.reduce((e,t)=>e+t.blocs.length,0),0),g=f.reduce((e,t)=>e+t.sousSections.length,0),_=new Date().toLocaleDateString(`fr-FR`,{day:`numeric`,month:`long`,year:`numeric`}),v=u(a),y=new Map(a.map(e=>[e.id,e])),b=(e,t)=>{let n=m.get(e.id),r=s(e);return`<li><div class="bulle"><span class="num">${t}</span> <span class="texte-bulle">${e.icone?`${e.icone} `:``}${c(e.texte)}</span>${n?` <a class="renvoi" href="#ss-${n.id}">→ ${p.get(n.id)}</a>`:``}</div>${r?`<img class="img-bulle" src="${i(r)}" alt="">`:``}${e.code?l({type:`code`,texte:e.code,langage:e.langage}):``}${(v.get(e.id)||[]).length?`<ol>${v.get(e.id).map((e,n)=>b(e,`${t}.${n+1}`)).join(``)}</ol>`:``}</li>`},x=(v.get(null)||[]).map((e,t)=>b(e,`${t+1}`)).join(``),S=a.length>12,C=(t?Math.min(205,186*(n||1)):0)>165,w=o.filter(e=>y.has(e.de)&&y.has(e.vers)).map(e=>{let t=e.sens===`deux`?`↔`:e.sens===`vers`?`→`:`—`;return`<li>${c(y.get(e.de).texte)} <b>${t}</b> ${c(y.get(e.vers).texte)}${e.texte?` <i>(${i(e.texte)})</i>`:``}</li>`}).join(``),T=[t?`<a href="#vue">1. Vue d'ensemble</a>`:``,`<a href="#structure">2. Structure</a>`,...f.map((e,t)=>`<a href="#col-${e.id}">${t+3}. ${i(e.titre)}</a>`)].filter(Boolean).join(`<span class="sep">·</span>`),E=f.map((e,t)=>`
    <section class="chapitre" id="col-${e.id}">
      <h2><span class="num-chap">${t+3}.</span> ${i(e.titre)}</h2>
      ${e.sousSections.map(e=>{let t=e.bulleId&&y.get(e.bulleId);return`<section class="sous" id="ss-${e.id}">
          <h3>${p.get(e.id)} ${i(e.titre)}${t?` <span class="lie">🫧 ${c(t.texte)}</span>`:``}</h3>
          ${e.blocs.map(e=>l(e,d)).join(``)||`<p class="vide">(vide)</p>`}
        </section>`}).join(``)}
    </section>`).join(``);return`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${i(e)}</title>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box }
  @page { size: A4; margin: 12mm 12mm 14mm;
    @bottom-left { content: "${i(e).replace(/"/g,``)}"; font: 8pt -apple-system, system-ui, sans-serif; color: #999 }
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
  figure.photo { margin: 6px 0; break-inside: avoid } figure.photo img { display: block; max-width: 100%; max-height: 120mm; border-radius: 6px }
  figure.photo figcaption { font-size: 8.5pt; color: #666; margin-top: 3px }
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
  <h1>${i(e)}</h1>
  <p class="infos">${_} · ${a.length} bulle${a.length>1?`s`:``} · ${g} sous-section${g>1?`s`:``} · ${h} bloc${h>1?`s`:``}</p>
</header>
<nav class="contenu">${T}</nav>
${t?`<section id="vue"><h2><span class="num-chap">1.</span> Vue d'ensemble</h2><img class="graphe" src="${t}" alt="Graphe ${i(e)}"></section>`:``}
<section class="structure${S?` longue`:``}${C?` saut`:``}" id="structure"><h2><span class="num-chap">2.</span> Structure du graphe</h2>
  ${x?`<ol>${x}</ol>`:`<p class="vide">(aucune bulle)</p>`}
  ${w?`<h3>Relations entre les idées</h3><ul class="relations">${w}</ul>`:``}
</section>
${E}
</body></html>`}export{d as n,c as r,s as t};