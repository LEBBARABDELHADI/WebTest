// Client du moteur local tfpv (Terraform Pre-Plan Validator).
// Le navigateur ne peut pas exécuter Terraform, TFLint ni Checkov : la page
// parle au moteur lancé sur le poste (`tfpv serve`, 127.0.0.1 uniquement,
// jeton obligatoire) ou affiche un rapport JSON produit en CI.

export const MOTEUR_DÉFAUT = 'http://127.0.0.1:7317'
const CLÉ_MOTEUR = 'react-blocs-tfpv-moteur'
const CLÉ_JETON = 'react-blocs-tfpv-jeton' // sessionStorage : le jeton ne survit pas à l'onglet

export const GRAVITÉS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
export const GRAVITÉ = {
  CRITICAL: { nom: 'Critique', couleur: '#b91c1c' },
  HIGH: { nom: 'Élevée', couleur: '#dc2626' },
  MEDIUM: { nom: 'Moyenne', couleur: '#d97706' },
  LOW: { nom: 'Faible', couleur: '#2563eb' },
}
export const STATUTS = {
  PASSED: { nom: '✅ Validé', couleur: '#15803d', phrase: 'Tous les contrôles ont tourné, aucun problème.' },
  PASSED_WITH_WARNINGS: { nom: '🟡 Validé avec avertissements', couleur: '#b7791f', phrase: 'Rien de bloquant ; des avertissements sont à revoir.' },
  FAILED: { nom: '⛔ Échec : corrections nécessaires', couleur: '#dc2626', phrase: 'La configuration doit être corrigée avant terraform plan.' },
  INCOMPLETE: { nom: '🟣 Incomplet : NON validé', couleur: '#7c3aed', phrase: 'Des contrôles requis n’ont pas pu tourner : rien ne garantit que plan passera.' },
  ERROR: { nom: '⚠️ Erreur', couleur: '#6b7280', phrase: 'La validation n’a pas pu être faite.' },
}
export const ÉTAT_CONTRÔLE = { passed: ['✓', 'réussi', '#15803d'], failed: ['✗', 'problèmes', '#dc2626'], skipped: ['–', 'non exécuté', '#7c3aed'], error: ['!', 'erreur', '#b45309'], pending: ['…', 'en attente', '#64748b'] }
export const NIVEAU = { static: 'statique', providers: 'providers (init)', aws: 'API AWS' }
export const ÉTAPES = {
  discover: 'Détection des fichiers .tf et .tfvars',
  analyze: 'Analyse des modules, providers, variables et ressources',
  native: 'Contrôles Terraform (fmt, init -backend=false, validate)',
  tflint: 'TFLint (règles terraform + AWS)',
  aws_security: 'Validateur AWS et sécurité (Checkov)',
  centralize: 'Centralisation et dédoublonnage',
  report: 'Recommandations et rapport',
}
export const CATÉGORIES = {
  SYNTAX: 'Syntaxe', CONFIGURATION: 'Configuration', VARIABLES: 'Variables', MODULES_PROVIDERS: 'Modules et providers', AWS_VALIDITY: 'Validité AWS',
  NETWORK: 'Réseau', STORAGE: 'Stockage', DATABASE: 'Bases de données', IAM: 'IAM', SECURITY: 'Sécurité', STYLE: 'Style',
}

const lire = (stockage, clé) => { try { return stockage.getItem(clé) } catch { return null } }
const écrire = (stockage, clé, v) => { try { if (v) stockage.setItem(clé, v); else stockage.removeItem(clé) } catch { /* ignore */ } }

export function connexionMémorisée() {
  return { moteur: lire(localStorage, CLÉ_MOTEUR) || MOTEUR_DÉFAUT, jeton: lire(sessionStorage, CLÉ_JETON) || '' }
}
export function mémoriserConnexion(moteur, jeton) {
  écrire(localStorage, CLÉ_MOTEUR, moteur)
  écrire(sessionStorage, CLÉ_JETON, jeton)
}

export function urlMoteurValide(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)
  } catch { return false }
}

export async function appel(moteur, jeton, chemin, { méthode = 'GET', corps, signal } = {}) {
  let r
  try {
    r = await fetch(`${moteur.replace(/\/+$/, '')}${chemin}`, {
      method: méthode, signal,
      headers: { Authorization: `Bearer ${jeton}`, ...(corps ? { 'Content-Type': 'application/json' } : {}) },
      body: corps ? JSON.stringify(corps) : undefined,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new Error('Moteur injoignable : lance « tfpv serve » sur ton poste, puis vérifie l’adresse.', { cause: e })
  }
  let données = null
  try { données = await r.json() } catch { /* corps vide */ }
  if (!r.ok) {
    const msg = données?.error || `HTTP ${r.status}`
    throw new Error(r.status === 401 ? 'Jeton refusé : copie le jeton affiché par « tfpv serve ».' : msg)
  }
  return données
}

// Fichiers utiles au moteur (les mêmes que ceux qu'il accepte).
const SUFFIXES = ['.tf', '.tf.json', '.tfvars', '.tfvars.json', '.hcl', '.tftpl', '.tpl', '.json', '.yaml', '.yml', '.sh', '.toml']
const IGNORÉS = ['/.terraform/', '/.git/', '/node_modules/', '/.terragrunt-cache/']
export const TAILLE_MAX_FICHIER = 5 * 1024 * 1024

export function fichiersUtiles(liste) {
  const garder = [], ignorés = []
  for (const f of liste) {
    const chemin = f.webkitRelativePath || f.name
    const n = `/${chemin}`
    if (IGNORÉS.some(x => n.includes(x)) || /\.tfstate/.test(chemin)) { ignorés.push(chemin); continue }
    if (!SUFFIXES.some(s => chemin.endsWith(s)) && !chemin.endsWith('.terraform.lock.hcl')) { ignorés.push(chemin); continue }
    if (f.size > TAILLE_MAX_FICHIER) { ignorés.push(chemin); continue }
    garder.push(f)
  }
  return { garder, ignorés, nbTerraform: garder.filter(f => /\.tf(\.json)?$/.test(f.name)).length }
}

export async function lireFichiers(fichiers) {
  return Promise.all(fichiers.map(async f => ({ path: f.webkitRelativePath || f.name, content: await f.text() })))
}

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

// Rapport HTML autonome (hors ligne), produit dans le navigateur.
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
  const contrôles = r.checks.map(c => `<tr><td>${échapper(c.name)}</td><td>${échapper(NIVEAU[c.tier] || c.tier)}</td><td>${échapper((ÉTAT_CONTRÔLE[c.status] || [])[1] || c.status)}</td><td>${échapper(c.reason || '')}</td></tr>`).join('')
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rapport Terraform pré-plan</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:960px;margin:0 auto;padding:16px;color:#0f172a;background:#f8fafc}pre{background:#eef2f7;padding:8px;border-radius:8px;overflow-x:auto}pre .hl{background:#fde68a;display:block}details{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;margin:8px 0}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e2e8f0;padding:4px 6px;text-align:left}.st{color:#fff;background:${st.couleur};padding:6px 12px;border-radius:999px;font-weight:800}a{word-break:break-all}</style></head><body>
<h1>Rapport de validation Terraform (avant plan)</h1><p>Projet <b>${échapper(r.project?.name)}</b> · ${échapper(r.generated_at)}</p>
<p><span class="st">${échapper(r.status)}</span> ${échapper(r.status_reason)}</p>
<p>Contrôles : ${s.total_checks} · réussis : ${s.passed} · en échec : ${s.failed} · avertissements : ${s.warnings} · non exécutés : ${s.not_run}</p>
<h2>Contrôles</h2><table><tr><th>Contrôle</th><th>Niveau</th><th>État</th><th>Note</th></tr>${contrôles}</table>
<h2>Constats (${r.findings.length})</h2>${constats || '<p>Aucun constat.</p>'}
${(r.notes || []).length ? `<h2>Notes</h2><ul>${r.notes.map(n => `<li>${échapper(n)}</li>`).join('')}</ul>` : ''}
<p style="color:#64748b">Produit par tfpv ${échapper(r.tool?.version)} — jamais de terraform plan/apply ; secrets masqués.</p></body></html>`
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
