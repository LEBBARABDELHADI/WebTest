// Lecture d'un plan Terraform : sortie texte de `terraform plan` (couleurs
// retirées) ou JSON de `terraform show -json <plan>`. Résumé par action, avec
// une alerte sur les destructions et remplacements.

export const ACTIONS = {
  create: { emoji: '🟢', nom: 'Création', couleur: '#2e9e6b' },
  update: { emoji: '🟡', nom: 'Modification', couleur: '#c98a00' },
  replace: { emoji: '🟠', nom: 'Remplacement (détruit puis recréé)', couleur: '#e8590c' },
  delete: { emoji: '🔴', nom: 'Destruction', couleur: '#d33' },
  read: { emoji: '🔵', nom: 'Lecture (data source)', couleur: '#3b6fd8' },
  import: { emoji: '📥', nom: 'Import', couleur: '#6a4c93' },
  move: { emoji: '↪️', nom: 'Déplacement d\'adresse', couleur: '#6b7280' },
  forget: { emoji: '🫥', nom: 'Retiré de l\'état (sans destruction)', couleur: '#6b7280' },
}

// Ressources qui portent des données : leur destruction est rarement réversible.
const AVEC_DONNÉES = /(_db_instance|_rds_cluster|_s3_bucket$|_dynamodb_table|_ebs_volume|_efs_file_system|_elasticache|_kms_key|_secretsmanager_secret$|_opensearch_domain|_elasticsearch_domain|_redshift_cluster|_docdb_cluster|_neptune_cluster|_backup_vault|_ecr_repository|_route53_zone|_cloudwatch_log_group|google_sql_database|azurerm_.*(database|storage_account))/

const sansCouleurs = t => t.replace(/\x1b\[[0-9;]*m/g, '')
const type = adresse => (adresse.replace(/\[[^\]]*\]/g, '').split('.').filter(p => !['module', 'data'].includes(p)).slice(-2, -1)[0] || '')
const module = adresse => { const m = adresse.match(/^((?:module\.[^.]+(?:\[[^\]]*\])?\.)+)/); return m ? m[1].slice(0, -1) : '' }

function depuisJson(plan) {
  const ressources = (plan.resource_changes || []).map(r => {
    const a = r.change?.actions || []
    const action = a.includes('delete') && a.includes('create') ? 'replace' : a.includes('create') ? 'create' : a.includes('delete') ? 'delete' : a.includes('update') ? 'update' : a.includes('read') ? 'read' : a.includes('forget') ? 'forget' : r.change?.importing ? 'import' : r.previous_address ? 'move' : null
    if (!action) return null
    const remplacement = (r.change?.replace_paths || []).map(p => p.join('.'))
    return { adresse: r.address, type: r.type || type(r.address), module: r.module_address || '', action, raison: r.action_reason || '', attributs: remplacement }
  }).filter(Boolean)
  return { ressources, format: 'JSON (terraform show -json)' }
}

function depuisTexte(texte) {
  const lignes = sansCouleurs(texte).split('\n')
  const ressources = []
  let courante = null
  const motifs = [
    [/# (.+?) will be created/, 'create'], [/# (.+?) will be destroyed/, 'delete'], [/# (.+?) must be replaced/, 'replace'],
    [/# (.+?) will be replaced, as requested/, 'replace'], [/# (.+?) will be updated in-place/, 'update'], [/# (.+?) will be read during apply/, 'read'],
    [/# (.+?) will be imported/, 'import'], [/# (.+?) has moved to (.+)/, 'move'], [/# (.+?) will no longer be managed by Terraform/, 'forget'],
    [/# (.+?) is tainted, so must be replaced/, 'replace'],
  ]
  for (const ligne of lignes) {
    const t = ligne.trim()
    let trouvé = false
    for (const [re, action] of motifs) {
      const m = t.match(re)
      if (m) {
        const existante = ressources.find(r => r.adresse === m[1])
        if (existante && action === 'import') { existante.importée = true; courante = existante } else {
          courante = { adresse: m[1], type: type(m[1]), module: module(m[1]), action, raison: '', attributs: [], ...(action === 'move' ? { vers: m[2] } : {}) }
          ressources.push(courante)
        }
        trouvé = true; break
      }
    }
    if (trouvé || !courante) continue
    const raison = t.match(/^# \((.+)\)$/)
    if (raison) { courante.raison = raison[1]; continue }
    if (/# forces replacement/.test(t)) {
      const attr = t.replace(/^[~+\-/ ]+/, '').match(/^"?([\w.[\]"-]+?)"?\s*(=|\{|\[)/)
      if (attr && !courante.attributs.includes(attr[1])) courante.attributs.push(attr[1])
    }
  }
  const total = sansCouleurs(texte).match(/Plan: (?:(\d+) to import, )?(\d+) to add, (\d+) to change, (\d+) to destroy/)
  const annoncé = total ? { ...(total[1] ? { importer: Number(total[1]) } : {}), ajouter: Number(total[2]), modifier: Number(total[3]), détruire: Number(total[4]) } : null
  const rien = /No changes\. (Your infrastructure matches|Infrastructure is up-to-date)/.test(texte)
  return { ressources, annoncé, rien, format: 'texte (terraform plan)' }
}

export function lirePlan(texte) {
  const t = (texte || '').trim()
  if (!t) return null
  let r
  if (t.startsWith('{')) {
    try { r = depuisJson(JSON.parse(t)) } catch { return { erreur: 'JSON illisible : colle la sortie de « terraform show -json plan.out ».' } }
  } else r = depuisTexte(t)
  if (!r.ressources.length && !r.rien) return { erreur: 'Aucune ressource reconnue. Colle la sortie complète de « terraform plan » (les lignes « # … will be created »).' }
  const compte = Object.fromEntries(Object.keys(ACTIONS).map(a => [a, r.ressources.filter(x => x.action === a).length]))
  const risquées = r.ressources.filter(x => (x.action === 'delete' || x.action === 'replace'))
  const données = risquées.filter(x => AVEC_DONNÉES.test(x.type))
  const conseils = []
  if (données.length) conseils.push('Des ressources qui contiennent des données vont être détruites : vérifie les sauvegardes (snapshot) et ajoute `lifecycle { prevent_destroy = true }` sur les ressources critiques.')
  if (r.ressources.some(x => x.action === 'replace' && x.attributs.length)) conseils.push('Un remplacement est provoqué par un attribut marqué « forces replacement » : change-le autrement si possible, ou utilise `create_before_destroy` pour éviter une coupure.')
  if (r.ressources.some(x => x.action === 'move')) conseils.push('Les déplacements d\'adresse (blocs `moved`) ne détruisent rien : seule l\'adresse dans l\'état change.')
  if (r.ressources.some(x => x.action === 'forget')) conseils.push('« forget » retire la ressource de l\'état sans la supprimer dans le cloud (bloc `removed`).')
  const incohérent = r.annoncé && (r.annoncé.détruire !== compte.delete + compte.replace || r.annoncé.ajouter !== compte.create + compte.replace)
  return { ...r, compte, risquées, données, conseils, incohérent }
}
