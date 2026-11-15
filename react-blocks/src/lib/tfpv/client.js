// Outil « Terraform · TFLint » : tout se passe dans l'application. Lecture des
// fichiers (dossier, fichiers, archive .zip, code collé), lancement du moteur
// dans un Web Worker, aides d'affichage et exports. Aucun fichier n'est envoyé.

export const GRAVITÉS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
export const GRAVITÉ = {
  CRITICAL: { nom: 'Critique', couleur: '#b91c1c' },
  HIGH: { nom: 'Élevée', couleur: '#dc2626' },
  MEDIUM: { nom: 'Moyenne', couleur: '#d97706' },
  LOW: { nom: 'Faible', couleur: '#2563eb' },
}
export const STATUTS = {
  PASSED: { nom: '✅ Validé', couleur: '#15803d', phrase: 'Tous les contrôles de l’outil ont tourné, aucun problème.' },
  PASSED_WITH_WARNINGS: { nom: '🟡 Validé avec avertissements', couleur: '#b7791f', phrase: 'Rien de bloquant ; des avertissements sont à revoir.' },
  FAILED: { nom: '⛔ Échec : corrections nécessaires', couleur: '#dc2626', phrase: 'La configuration doit être corrigée avant terraform plan.' },
  INCOMPLETE: { nom: '🟣 Incomplet : NON validé', couleur: '#7c3aed', phrase: 'Une partie du projet n’a pas pu être analysée : rien ne garantit que plan passera.' },
  ERROR: { nom: '⚠️ Erreur', couleur: '#6b7280', phrase: 'L’analyse n’a pas pu être faite.' },
}
export const ÉTAT_CONTRÔLE = { passed: ['✓', 'réussi', '#15803d'], failed: ['✗', 'problèmes', '#dc2626'], skipped: ['–', 'non exécuté', '#7c3aed'], error: ['!', 'erreur', '#b45309'], pending: ['…', 'en attente', '#64748b'] }
export const NIVEAU = { static: 'statique', providers: 'providers (init)', aws: 'API AWS' }
export const ÉTAPES = [
  ['donnees', 'Chargement des données de référence (schémas, règles TFLint)'],
  ['lecture', 'Lecture des fichiers .tf et .tfvars'],
  ['analyse', 'Analyse des modules, providers, variables et ressources'],
  ['schema', 'Schéma des providers (équivalent terraform validate)'],
  ['tflint', 'Règles AWS de TFLint'],
  ['coherence', 'Cohérence AWS (réseau, EBS, RDS, IAM)'],
  ['securite', 'Sécurité (équivalents Checkov)'],
  ['format', 'Formatage (approximation de terraform fmt)'],
  ['rapport', 'Centralisation, recommandations et rapport'],
]
export const CATÉGORIES = {
  SYNTAX: 'Syntaxe', CONFIGURATION: 'Configuration', VARIABLES: 'Variables', MODULES_PROVIDERS: 'Modules et providers', AWS_VALIDITY: 'Validité AWS',
  NETWORK: 'Réseau', STORAGE: 'Stockage', DATABASE: 'Bases de données', IAM: 'IAM', SECURITY: 'Sécurité', STYLE: 'Style',
}

// ---------------------------------------------------------------- lecture
const IGNORÉS = new Set(['.terraform', '.git', 'node_modules', '.terragrunt-cache', '__pycache__', '.venv', 'venv', '.idea', '.vscode'])
export const TAILLE_MAX = 5 * 1024 * 1024
export const estUtile = nom => /\.(tf|tf\.json|tfvars|tfvars\.json)$/.test(nom) && !/\.tfstate/.test(nom)
const ignoréDossier = nom => IGNORÉS.has(nom) || nom.startsWith('.terraform')

export async function lireZip(fichier) {
  const buf = new Uint8Array(await fichier.arrayBuffer())
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let fin = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break }
  if (fin < 0) throw new Error(`${fichier.name} : archive ZIP illisible`)
  const total = dv.getUint16(fin + 10, true)
  let off = dv.getUint32(fin + 16, true)
  if (off === 0xffffffff) throw new Error(`${fichier.name} : archive ZIP64 non prise en charge`)
  const déc = new TextDecoder()
  const out = []
  for (let n = 0; n < total; n++) {
    if (dv.getUint32(off, true) !== 0x02014b50) throw new Error(`${fichier.name} : répertoire ZIP corrompu`)
    const méthode = dv.getUint16(off + 10, true)
    const taille = dv.getUint32(off + 20, true)
    const tailleBrute = dv.getUint32(off + 24, true)
    const ln = dv.getUint16(off + 28, true)
    const le = dv.getUint16(off + 30, true)
    const lc = dv.getUint16(off + 32, true)
    const local = dv.getUint32(off + 42, true)
    const nom = déc.decode(buf.subarray(off + 46, off + 46 + ln))
    off += 46 + ln + le + lc
    if (nom.endsWith('/') || !estUtile(nom) || nom.split('/').some(ignoréDossier) || tailleBrute > TAILLE_MAX) continue
    const début = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true)
    const données = buf.subarray(début, début + taille)
    let brut
    if (méthode === 0) brut = données
    else if (méthode === 8 && typeof DecompressionStream !== 'undefined') brut = new Uint8Array(await new Response(new Blob([données]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer())
    else continue
    out.push({ path: nom, content: déc.decode(brut) })
  }
  return out
}

export async function lireFichiers(liste) {
  const out = []
  for (const f of liste) {
    const chemin = f.webkitRelativePath || f.name
    if (/\.zip$/i.test(f.name)) { out.push(...await lireZip(f)); continue }
    if (!estUtile(f.name) || chemin.split('/').slice(0, -1).some(ignoréDossier) || f.size > TAILLE_MAX) continue
    out.push({ path: chemin, content: await f.text() })
  }
  return out
}

// Dossier ouvert avec showDirectoryPicker : relisible à chaque relance.
export async function lireRépertoire(poignée, chemin = poignée.name) {
  const out = []
  for await (const [nom, h] of poignée.entries()) {
    if (h.kind === 'directory') { if (!ignoréDossier(nom)) out.push(...await lireRépertoire(h, `${chemin}/${nom}`)) } else if (estUtile(nom)) {
      const f = await h.getFile()
      if (f.size <= TAILLE_MAX) out.push({ path: `${chemin}/${nom}`, content: await f.text() })
    }
  }
  return out
}

// Glisser-déposer : dossiers, fichiers ou archive .zip.
export async function lireDépôt(transfert) {
  const entrées = [...transfert.items].filter(i => i.kind === 'file').map(i => i.webkitGetAsEntry?.()).filter(Boolean)
  if (!entrées.length) return lireFichiers([...transfert.files])
  const out = []
  const lire = async (e, chemin) => {
    if (e.isFile) {
      const f = await new Promise((ok, ko) => e.file(ok, ko))
      if (/\.zip$/i.test(f.name)) out.push(...await lireZip(f))
      else if (estUtile(f.name) && f.size <= TAILLE_MAX) out.push({ path: chemin, content: await f.text() })
    } else if (e.isDirectory && !ignoréDossier(e.name)) {
      const lecteur = e.createReader()
      let lot
      do {
        lot = await new Promise((ok, ko) => lecteur.readEntries(ok, ko))
        for (const x of lot) await lire(x, `${chemin}/${x.name}`)
      } while (lot.length)
    }
  }
  for (const e of entrées) await lire(e, e.name)
  return out
}

export function résuméFichiers(fichiers) {
  const tf = fichiers.filter(f => /\.tf(\.json)?$/.test(f.path)).length
  const tfvars = fichiers.filter(f => /\.tfvars(\.json)?$/.test(f.path)).map(f => f.path)
  return { total: fichiers.length, tf, tfvars }
}

// ---------------------------------------------------------------- moteur
let travailleur = null
let compteur = 0
export function analyserDansLeNavigateur(fichiers, options, onProgress) {
  const base = new URL(import.meta.env.BASE_URL, location.href).href
  if (typeof Worker === 'undefined') {
    return (async () => {
      const [{ analyser }, { préparerTflint }] = await Promise.all([import('./moteur/index.js'), import('./moteur/tflintAws.js')])
      const lire = f => fetch(`${base}tfpv/${f}`).then(r => r.json())
      const [aws, autres, tflint] = await Promise.all([lire('schema-aws.json'), lire('schema-autres.json'), lire('tflint-aws.json')])
      return analyser({ fichiers, options, données: { schémas: { aws, ...autres }, tflint, tflintPréparé: préparerTflint(tflint) }, onProgress })
    })()
  }
  travailleur ||= new Worker(new URL('./moteur/worker.js', import.meta.url), { type: 'module' })
  const id = ++compteur
  return new Promise((résoudre, rejeter) => {
    const écoute = ({ data }) => {
      if (data.id !== id) return
      if (data.type === 'progress') onProgress?.(data.ev)
      else {
        travailleur.removeEventListener('message', écoute)
        if (data.type === 'done') résoudre(data.rapport)
        else rejeter(new Error(data.message))
      }
    }
    travailleur.addEventListener('message', écoute)
    travailleur.postMessage({ id, fichiers, options, base })
  })
}

// ---------------------------------------------------------------- affichage
export function estRapport(d) {
  return d && typeof d === 'object' && typeof d.status === 'string' && Array.isArray(d.findings) && Array.isArray(d.checks) && d.summary
}

export function filtrer(constats, { gravités, bloquantsSeulement, texte }) {
  const t = (texte || '').trim().toLowerCase()
  return constats.filter(f => gravités.has(f.severity) && (!bloquantsSeulement || f.blocking) &&
    (!t || [f.rule_id, f.title, f.file, f.resource, f.message, ...(f.engine_rules || [])].some(x => String(x || '').toLowerCase().includes(t))))
}

export function parFichier(constats) {
  const groupes = new Map()
  for (const f of constats) {
    const k = f.file || '(projet)'
    if (!groupes.has(k)) groupes.set(k, [])
    groupes.get(k).push(f)
  }
  return [...groupes.entries()]
}

export const valeurTexte = v => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const échapper = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function rapportHtml(r) {
  const s = r.summary
  const st = STATUTS[r.status] || STATUTS.ERROR
  const constats = parFichier(r.findings).map(([fichier, liste]) => `<h3>📄 ${échapper(fichier)}</h3>` + liste.map(f => {
    const code = f.snippet ? `<pre>${f.snippet.lines.map((l, i) => { const n = f.snippet.start_line + i; return `<span${n === f.snippet.highlight ? ' class="hl"' : ''}>${String(n).padStart(4)} | ${échapper(l)}</span>` }).join('\n')}</pre>` : ''
    return `<details${f.blocking ? ' open' : ''}><summary><b style="color:${GRAVITÉ[f.severity].couleur}">[${f.severity}]</b> ${échapper(f.rule_id)} — ${échapper(f.title)}</summary>
<p>${f.line ? `Ligne ${f.line} · ` : ''}${f.resource ? `Ressource <code>${échapper(f.resource)}</code> · ` : ''}${f.value != null ? `Valeur <code>${échapper(valeurTexte(f.value))}</code> · ` : ''}${échapper(f.engines.join(', '))} (${échapper(f.engine_rules.join(', '))})${f.blocking ? ` · <b>bloquant (${échapper(f.fails_at)})</b>` : ''}</p>
${code}<p><b>Description</b><br>${échapper(f.description)}</p><p><b>Cause probable</b><br>${échapper(f.cause)}</p><p><b>Recommandation</b><br>${échapper(f.recommendation)}</p>
${f.fix ? `<pre>${échapper(f.fix)}</pre>` : ''}${(f.references || []).map(u => `<a href="${échapper(u)}">${échapper(u)}</a>`).join('<br>')}</details>`
  }).join('')).join('')
  const contrôles = r.checks.map(c => `<tr><td>${échapper(c.name)}</td><td>${échapper((ÉTAT_CONTRÔLE[c.status] || [])[1] || c.status)}</td><td>${échapper(c.reason || '')}</td></tr>`).join('')
  const périmètre = r.scope ? `<h2>Périmètre</h2><p><b>Vérifié :</b> ${échapper(r.scope.covered.join(' · '))}</p><p><b>Non vérifiable dans l’outil :</b> ${échapper(r.scope.not_covered.join(' · '))}</p>` : ''
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rapport Terraform pré-plan</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:960px;margin:0 auto;padding:16px;color:#0f172a;background:#f8fafc}pre{background:#eef2f7;padding:8px;border-radius:8px;overflow-x:auto}pre .hl{background:#fde68a;display:block}details{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;margin:8px 0}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e2e8f0;padding:4px 6px;text-align:left}.st{color:#fff;background:${st.couleur};padding:6px 12px;border-radius:999px;font-weight:800}a{word-break:break-all}</style></head><body>
<h1>Rapport de validation Terraform (avant plan)</h1><p>Projet <b>${échapper(r.project?.name)}</b> · ${échapper(r.generated_at)}</p>
<p><span class="st">${échapper(r.status)}</span> ${échapper(r.status_reason)}</p>
<p>Contrôles : ${s.total_checks} · réussis : ${s.passed} · en échec : ${s.failed} · avertissements : ${s.warnings} · non exécutés : ${s.not_run}</p>
<h2>Contrôles</h2><table><tr><th>Contrôle</th><th>État</th><th>Note</th></tr>${contrôles}</table>
<h2>Constats (${r.findings.length})</h2>${constats || '<p>Aucun constat.</p>'}${périmètre}
${(r.notes || []).length ? `<h2>Notes</h2><ul>${r.notes.map(n => `<li>${échapper(n)}</li>`).join('')}</ul>` : ''}
<p style="color:#64748b">Produit par ${échapper(r.tool?.name)} ${échapper(r.tool?.version)} — analyse faite dans l’application, sans terraform plan/apply ; secrets masqués.</p></body></html>`
}

export function rapportTexte(r) {
  const s = r.summary
  const l = ['Terraform Pre-Plan Validation Report', '', `Project: ${r.project?.name}`, `Status: ${r.status}`, `Reason: ${r.status_reason}`, '', 'Summary:', '',
    `* Total checks: ${s.total_checks}`, `* Passed: ${s.passed}`, `* Failed: ${s.failed}`, `* Warnings: ${s.warnings}`, '', 'Findings:', '']
  for (const f of r.findings) {
    l.push(`[${f.severity}] ${f.rule_id}${f.blocking ? `  (blocking: fails at ${f.fails_at})` : ''}`, '')
    if (f.file) l.push(`File: ${f.file}`)
    if (f.line) l.push(`Line: ${f.line}`)
    if (f.resource) l.push(`Resource: ${f.resource}`)
    if (f.value !== null && f.value !== undefined && f.value !== '') l.push(`Current value: ${valeurTexte(f.value)}`)
    l.push(`Detected by: ${f.engines.join(', ')} (${f.engine_rules.join(', ')})`, '', 'Description:', f.description, '', 'Recommendation:', f.recommendation)
    if (f.references?.length) l.push('', `Reference: ${f.references[0]}`)
    l.push('', '-'.repeat(72), '')
  }
  const fin = { FAILED: 'FAILED - Terraform configuration requires corrections.', INCOMPLETE: 'INCOMPLETE - Part of the project could not be analysed: the configuration is NOT validated.', PASSED_WITH_WARNINGS: 'PASSED WITH WARNINGS - No blocking issue; review the warnings.', PASSED: 'PASSED - All checks ran and no issue was found.' }
  l.push('Final result:', fin[r.status] || r.status, '')
  return l.join('\n')
}

export function télécharger(nom, contenu, type) {
  const url = URL.createObjectURL(new Blob([contenu], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function résumé(r) {
  const s = r.summary
  const lignes = [`Validation Terraform (avant plan) — ${r.project?.name} : ${r.status}`, r.status_reason,
    `Contrôles ${s.total_checks} · réussis ${s.passed} · échecs ${s.failed} · avertissements ${s.warnings} · non exécutés ${s.not_run}`]
  for (const f of r.findings.filter(f => f.blocking || f.severity === 'CRITICAL' || f.severity === 'HIGH').slice(0, 15)) {
    lignes.push(`- [${f.severity}] ${f.rule_id} ${f.file || ''}${f.line ? `:${f.line}` : ''} ${f.resource || ''}`.trim())
  }
  return lignes.join('\n')
}
