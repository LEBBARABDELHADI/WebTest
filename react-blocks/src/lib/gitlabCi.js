// Explication d'un .gitlab-ci.yml : pipeline par étapes (stages), jobs,
// dépendances (needs), mots-clés expliqués et contrôle des erreurs courantes.

const GLOBAUX = new Set(['stages', 'variables', 'default', 'include', 'workflow', 'image', 'services', 'before_script', 'after_script', 'cache', 'pages'])
export const MOTS_CLÉS = {
  stage: 'Étape du pipeline où tourne le job. Les jobs d\'une même étape tournent en parallèle.',
  script: 'Commandes exécutées par le runner.',
  before_script: 'Commandes lancées avant script (souvent : connexion, installation).',
  after_script: 'Commandes lancées après script, même en cas d\'échec (nettoyage).',
  image: 'Image Docker dans laquelle le job s\'exécute.',
  services: 'Conteneurs lancés à côté du job (base de données, Docker-in-Docker…).',
  rules: 'Conditions qui décident si le job est ajouté au pipeline (branche, merge request, fichiers modifiés…).',
  only: 'Ancienne façon de limiter le job (branches, tags…). Préfère rules.',
  except: 'Ancienne façon d\'exclure le job. Préfère rules.',
  needs: 'Jobs à attendre : le job démarre dès qu\'ils ont fini, sans attendre toute l\'étape précédente (DAG).',
  dependencies: 'Jobs dont on récupère les artefacts.',
  artifacts: 'Fichiers produits par le job, gardés et transmis aux jobs suivants (binaires, rapports…).',
  cache: 'Fichiers réutilisés d\'un pipeline à l\'autre pour aller plus vite (node_modules, .m2…).',
  variables: 'Variables d\'environnement du job.',
  environment: 'Environnement déployé (staging, production) : historique, URL, retour arrière dans GitLab.',
  when: 'Quand lancer le job : on_success (défaut), manual (bouton), always, on_failure, delayed, never.',
  allow_failure: 'Si true, l\'échec du job ne fait pas échouer le pipeline.',
  retry: 'Nombre de nouvelles tentatives automatiques en cas d\'échec.',
  timeout: 'Durée maximale du job.',
  tags: 'Choisit les runners qui peuvent exécuter le job.',
  extends: 'Hérite de la configuration d\'un autre job (souvent un modèle caché commençant par un point).',
  trigger: 'Déclenche un autre pipeline (enfant ou d\'un autre projet).',
  interruptible: 'Le job peut être annulé si un pipeline plus récent démarre sur la même branche.',
  coverage: 'Expression pour extraire le pourcentage de couverture des logs.',
  parallel: 'Lance plusieurs copies du job (ou une matrice de variables).',
  resource_group: 'Empêche deux jobs du même groupe de tourner en même temps (déploiements).',
  release: 'Crée une release GitLab.',
  secrets: 'Secrets lus depuis un coffre externe (Vault…).',
  id_tokens: 'Jetons OIDC pour s\'authentifier auprès d\'un cloud (AWS, GCP) sans secret stocké.',
  start_in: 'Délai avant un job « delayed ».',
  inherit: 'Contrôle ce qui est hérité de default et des variables globales.',
}
const secret = /(pass(word)?|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|credentials?)/i
const fusion = (a, b) => ({ ...a, ...b, variables: { ...(a.variables || {}), ...(b.variables || {}) } })

export function analyserGitlabCi(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return { erreur: 'Le fichier doit être un objet YAML (clé: valeur).' }
  const alertes = []
  const a = (niveau, texte, job = '') => alertes.push({ niveau, texte, job })
  const stages = Array.isArray(config.stages) ? config.stages : ['build', 'test', 'deploy']
  const ordre = ['.pre', ...stages.filter(s => s !== '.pre' && s !== '.post'), '.post']
  const brut = Object.entries(config).filter(([k, v]) => !GLOBAUX.has(k) && v && typeof v === 'object' && !Array.isArray(v))
  const modèles = Object.fromEntries(brut.filter(([k]) => k.startsWith('.')))
  const résoudre = (job, vus = new Set()) => {
    const ext = [].concat(job.extends || [])
    let base = {}
    for (const e of ext) { if (vus.has(e)) continue; vus.add(e); if (config[e]) base = fusion(base, résoudre(config[e], vus)); else a('erreur', `extends « ${e} » : modèle introuvable dans ce fichier (il est peut-être dans un include).`) }
    const r = fusion(base, job); delete r.extends; return r
  }
  const jobs = brut.filter(([k]) => !k.startsWith('.')).map(([nom, j]) => ({ nom, ...résoudre(j), brut: j }))
  const noms = new Set(jobs.map(j => j.nom))
  if (config.include) a('info', `include : ${[].concat(config.include).length} fichier(s) inclus ne sont pas lus ici ; les jobs qu'ils apportent n'apparaissent pas.`)
  if (!config.workflow) a('info', 'Pas de workflow:rules : sur une merge request, GitLab peut lancer deux pipelines (branche + MR). Un bloc workflow évite les doublons.')
  const défaut = config.default || {}
  if (!défaut.interruptible && !jobs.some(j => j.interruptible)) a('info', 'Aucun job « interruptible » : les anciens pipelines continuent quand tu pousses un nouveau commit. Ajoute default: interruptible: true (sauf déploiements).')
  for (const [k, v] of Object.entries(config.variables || {})) {
    const val = typeof v === 'object' && v !== null ? v.value : v
    if (secret.test(k) && val && !/^\$/.test(String(val))) a('erreur', `Variable globale ${k} : secret écrit en clair dans le dépôt. Mets-la dans Settings > CI/CD > Variables (masquée, protégée).`)
  }
  for (const j of jobs) {
    const stage = j.stage || 'test'
    j.étape = stage
    if (!j.script && !j.trigger && !j.brut.extends) a('erreur', 'Ni script ni trigger : GitLab refusera le job.', j.nom)
    else if (!j.script && !j.trigger) a('erreur', 'Pas de script, même après extends.', j.nom)
    if (!ordre.includes(stage)) a('erreur', `stage « ${stage} » n'est pas dans la liste stages (${stages.join(', ')}).`, j.nom)
    const img = typeof j.image === 'object' ? j.image?.name : j.image
    const imgFinale = img || (typeof défaut.image === 'object' ? défaut.image?.name : défaut.image) || (typeof config.image === 'object' ? config.image?.name : config.image)
    if (img && !img.startsWith('$')) { const tag = img.split('/').pop().split(':')[1]; if (!tag || tag === 'latest') a('alerte', `Image ${img} sans version fixe : le job peut casser du jour au lendemain.`, j.nom) }
    if (!imgFinale && !j.trigger) a('info', 'Pas d\'image : le job utilise l\'image par défaut du runner.', j.nom)
    if (j.only || j.except) a('info', 'only/except est déprécié : utilise rules.', j.nom)
    if (j.rules && (j.only || j.except)) a('erreur', 'rules ne peut pas être utilisé avec only/except dans le même job.', j.nom)
    for (const n of [].concat(j.needs || [])) {
      const cible = typeof n === 'object' ? n.job : n
      if (!cible) continue
      if (typeof n === 'object' && n.project) continue
      if (!noms.has(cible)) a('erreur', `needs « ${cible} » : job introuvable.`, j.nom)
      else {
        const sc = jobs.find(x => x.nom === cible)?.stage || 'test'
        if (ordre.indexOf(sc) > ordre.indexOf(stage)) a('erreur', `needs « ${cible} » est dans une étape plus tardive (${sc}).`, j.nom)
      }
    }
    for (const [k, v] of Object.entries(j.variables || {})) {
      const val = typeof v === 'object' && v !== null ? v.value : v
      if (secret.test(k) && val && !/^\$/.test(String(val))) a('erreur', `Variable ${k} : secret en clair. Utilise une variable CI/CD masquée.`, j.nom)
    }
    const scripts = [].concat(j.before_script || [], j.script || []).join('\n')
    if (/(AKIA[0-9A-Z]{16}|glpat-[\w-]{20})/.test(scripts)) a('erreur', 'Une clé d\'accès semble écrite dans le script.', j.nom)
    if (j.artifacts && !j.artifacts.expire_in) a('info', 'Artefacts sans expire_in : ils sont gardés selon la règle de l\'instance (souvent 30 jours) et prennent de la place.', j.nom)
    if (j.cache && !j.cache.key && !Array.isArray(j.cache)) a('info', 'Cache sans key : toutes les branches partagent le même cache. Utilise par exemple key: { files: [package-lock.json] }.', j.nom)
    const déploie = /deploy|prod|release/i.test(`${j.nom} ${stage}`)
    if (déploie && !j.environment && !j.trigger) a('info', 'Job de déploiement sans environment : pas d\'historique ni de retour arrière dans GitLab.', j.nom)
    if (/prod/i.test(`${j.nom} ${JSON.stringify(j.environment || '')}`) && j.when !== 'manual' && !JSON.stringify(j.rules || '').includes('manual')) a('alerte', 'Déploiement en production automatique : ajoute when: manual ou des rules limitées à la branche principale.', j.nom)
    if (déploie && !j.resource_group) a('info', 'Déploiement sans resource_group : deux pipelines pourraient déployer en même temps.', j.nom)
  }
  const utilisées = [...ordre.filter(s => jobs.some(j => j.étape === s)), ...[...new Set(jobs.map(j => j.étape))].filter(s => !ordre.includes(s))]
  return {
    stages: utilisées, déclarés: stages,
    jobs: jobs.map(j => ({ nom: j.nom, étape: j.étape, image: typeof j.image === 'object' ? j.image?.name : j.image, script: [].concat(j.script || []), needs: [].concat(j.needs || []).map(n => (typeof n === 'object' ? n.job : n)).filter(Boolean), when: j.when || (Array.isArray(j.rules) && j.rules.some(x => x?.when === 'manual') ? 'manual' : j.rules ? 'selon rules' : 'on_success'), environment: typeof j.environment === 'object' ? j.environment?.name : j.environment, extends: [].concat(j.brut.extends || []), clés: Object.keys(j.brut), trigger: !!j.trigger, allow_failure: !!j.allow_failure })),
    modèles: Object.keys(modèles),
    alertes,
  }
}
