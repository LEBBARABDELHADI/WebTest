// Explication d'un manifeste Kubernetes (un ou plusieurs documents YAML) :
// chaque champ connu expliqué en français, et contrôle des erreurs courantes.
import { analyserCron } from './outilsDevops.js'

// Explications par chemin (sans index de liste : containers[] → containers).
const CHAMPS = {
  apiVersion: 'Version de l\'API Kubernetes qui définit ce type d\'objet.',
  kind: 'Type d\'objet Kubernetes.',
  'metadata.name': 'Nom de l\'objet, unique dans son namespace.',
  'metadata.namespace': 'Namespace (espace de noms) où l\'objet est créé.',
  'metadata.labels': 'Étiquettes clé/valeur : servent aux sélecteurs (Service, Deployment…).',
  'metadata.annotations': 'Informations supplémentaires lues par des outils (ingress controller, monitoring…).',
  'spec.replicas': 'Nombre de pods identiques à garder en marche.',
  'spec.selector': 'Comment l\'objet retrouve ses pods : par leurs labels.',
  'spec.selector.matchLabels': 'Labels que les pods doivent porter pour être gérés ici. Doit correspondre aux labels du modèle de pod.',
  'spec.strategy': 'Façon de mettre à jour les pods.',
  'spec.strategy.type': 'RollingUpdate (remplacement progressif, sans coupure) ou Recreate (tout arrêter puis relancer).',
  'spec.strategy.rollingUpdate.maxSurge': 'Nombre de pods en plus autorisés pendant la mise à jour.',
  'spec.strategy.rollingUpdate.maxUnavailable': 'Nombre de pods qui peuvent être indisponibles pendant la mise à jour.',
  'spec.template': 'Modèle des pods à créer.',
  'spec.template.metadata.labels': 'Labels posés sur chaque pod (visés par le selector et les Services).',
  'spec.template.spec.containers': 'Liste des conteneurs du pod.',
  'spec.template.spec.initContainers': 'Conteneurs lancés avant les autres, un par un (préparation).',
  'containers.name': 'Nom du conteneur dans le pod.',
  'containers.image': 'Image Docker à lancer (registre/nom:tag). Évite le tag « latest ».',
  'containers.imagePullPolicy': 'Quand télécharger l\'image : Always, IfNotPresent ou Never.',
  'containers.command': 'Remplace l\'ENTRYPOINT de l\'image.',
  'containers.args': 'Remplace le CMD de l\'image (arguments).',
  'containers.ports': 'Ports ouverts par le conteneur (documentation, et nommage pour les Services).',
  'containers.ports.containerPort': 'Port sur lequel l\'application écoute dans le conteneur.',
  'containers.ports.name': 'Nom du port, réutilisable dans targetPort d\'un Service.',
  'containers.env': 'Variables d\'environnement du conteneur.',
  'containers.env.valueFrom.secretKeyRef': 'Valeur lue dans un Secret.',
  'containers.env.valueFrom.configMapKeyRef': 'Valeur lue dans une ConfigMap.',
  'containers.envFrom': 'Importe toutes les clés d\'une ConfigMap ou d\'un Secret en variables.',
  'containers.resources': 'Ressources CPU/mémoire du conteneur.',
  'containers.resources.requests': 'Ressources réservées : le scheduler place le pod sur un nœud qui les a.',
  'containers.resources.limits': 'Plafond : au-delà de la limite mémoire le conteneur est tué (OOMKilled), le CPU est bridé.',
  'containers.readinessProbe': 'Test « prêt à recevoir du trafic » : tant qu\'il échoue, le pod est retiré du Service.',
  'containers.livenessProbe': 'Test « vivant » : s\'il échoue, Kubernetes redémarre le conteneur.',
  'containers.startupProbe': 'Test de démarrage : protège les applications lentes à démarrer des autres probes.',
  'containers.volumeMounts': 'Où monter les volumes dans le conteneur.',
  'containers.securityContext': 'Réglages de sécurité du conteneur (utilisateur, droits).',
  'containers.securityContext.runAsNonRoot': 'Interdit de lancer le conteneur en root.',
  'containers.securityContext.privileged': 'Donne presque tous les droits sur le nœud : à éviter.',
  'containers.securityContext.readOnlyRootFilesystem': 'Système de fichiers du conteneur en lecture seule.',
  'spec.template.spec.volumes': 'Volumes disponibles pour le pod (ConfigMap, Secret, PVC, emptyDir…).',
  'spec.template.spec.serviceAccountName': 'Compte de service : identité du pod pour l\'API Kubernetes (et IRSA sur EKS).',
  'spec.template.spec.nodeSelector': 'Ne place le pod que sur les nœuds qui ont ces labels.',
  'spec.template.spec.affinity': 'Règles de placement avancées (sur certains nœuds, loin d\'autres pods…).',
  'spec.template.spec.tolerations': 'Permet au pod d\'aller sur des nœuds « taintés ».',
  'spec.template.spec.imagePullSecrets': 'Identifiants pour télécharger depuis un registre privé.',
  'spec.template.spec.hostNetwork': 'Le pod partage le réseau du nœud : à éviter sauf besoin précis.',
  'spec.type': 'Service : ClusterIP (interne), NodePort (port sur chaque nœud), LoadBalancer (load balancer du cloud).',
  'spec.ports': 'Ports exposés par le Service.',
  'spec.ports.port': 'Port du Service (celui qu\'on appelle).',
  'spec.ports.targetPort': 'Port du conteneur vers lequel le trafic est envoyé (numéro ou nom du port).',
  'spec.ports.nodePort': 'Port ouvert sur chaque nœud (NodePort, 30000-32767).',
  'spec.ingressClassName': 'Quel ingress controller gère cet Ingress (nginx, alb…).',
  'spec.rules': 'Règles de routage : hôte et chemins vers des Services.',
  'spec.rules.host': 'Nom de domaine concerné.',
  'spec.rules.http.paths.path': 'Chemin d\'URL (ex. /api).',
  'spec.rules.http.paths.pathType': 'Prefix (le chemin et ses sous-chemins) ou Exact.',
  'spec.rules.http.paths.backend.service.name': 'Service qui reçoit le trafic.',
  'spec.rules.http.paths.backend.service.port.number': 'Port du Service ciblé.',
  'spec.tls': 'Certificats TLS (Secret) pour servir en HTTPS.',
  data: 'Données de la ConfigMap ou du Secret (dans un Secret : encodées en base64, pas chiffrées).',
  stringData: 'Données du Secret en clair, encodées par Kubernetes à la création.',
  'spec.schedule': 'Planning de la CronJob (format cron, heure du contrôleur, en général UTC).',
  'spec.concurrencyPolicy': 'Que faire si l\'exécution précédente tourne encore : Allow, Forbid ou Replace.',
  'spec.jobTemplate': 'Modèle du Job lancé à chaque exécution.',
  'spec.backoffLimit': 'Nombre de nouvelles tentatives avant de déclarer le Job en échec.',
  'spec.minReplicas': 'HPA : nombre minimal de pods.',
  'spec.maxReplicas': 'HPA : nombre maximal de pods.',
  'spec.scaleTargetRef': 'HPA : l\'objet (Deployment…) à faire varier.',
  'spec.metrics': 'HPA : métriques qui déclenchent l\'ajout ou le retrait de pods.',
  'spec.accessModes': 'PVC : ReadWriteOnce (un nœud), ReadOnlyMany, ReadWriteMany (plusieurs nœuds).',
  'spec.resources.requests.storage': 'PVC : taille de disque demandée.',
  'spec.storageClassName': 'Classe de stockage (type de disque, ex. gp3).',
  'spec.serviceName': 'StatefulSet : Service « headless » qui donne un nom DNS stable à chaque pod.',
  'spec.volumeClaimTemplates': 'StatefulSet : un disque (PVC) créé pour chaque pod.',
}
const KINDS = {
  Deployment: 'Garde un nombre de pods identiques et gère leurs mises à jour progressives.',
  StatefulSet: 'Comme un Deployment, mais chaque pod garde son nom et son disque (bases de données…).',
  DaemonSet: 'Un pod sur chaque nœud (agents de logs, monitoring : Datadog, Dynatrace…).',
  Service: 'Adresse stable qui répartit le trafic entre les pods sélectionnés par leurs labels.',
  Ingress: 'Routage HTTP(S) depuis l\'extérieur vers des Services, selon le domaine et le chemin.',
  ConfigMap: 'Configuration non sensible (clés/valeurs) injectée dans les pods.',
  Secret: 'Données sensibles (mots de passe, jetons). Encodées en base64, pas chiffrées par défaut.',
  Job: 'Lance un ou plusieurs pods jusqu\'à ce qu\'ils réussissent une fois.',
  CronJob: 'Lance un Job selon un planning cron.',
  HorizontalPodAutoscaler: 'Ajoute ou retire des pods selon une métrique (CPU…).',
  PersistentVolumeClaim: 'Demande de disque persistant pour un pod.',
  Namespace: 'Espace de noms pour séparer les ressources.',
  ServiceAccount: 'Identité utilisée par les pods.',
  Role: 'Droits dans un namespace.', ClusterRole: 'Droits dans tout le cluster.',
  RoleBinding: 'Donne un Role à un utilisateur ou un ServiceAccount.', ClusterRoleBinding: 'Donne un ClusterRole à l\'échelle du cluster.',
  NetworkPolicy: 'Pare-feu entre pods : quels pods peuvent parler à quels pods.',
  Pod: 'Un ou plusieurs conteneurs lancés ensemble. En général créé par un Deployment.',
  PodDisruptionBudget: 'Nombre minimal de pods à garder pendant une maintenance des nœuds.',
}

const normaliser = chemin => chemin.replace(/\[\d+\]/g, '').replace(/^spec\.(template\.spec|jobTemplate\.spec\.template\.spec)\.(initContainers|containers)\./, 'containers.').replace(/^spec\.(template\.spec|jobTemplate\.spec\.template\.spec)\.(initContainers|containers)$/, 'spec.template.spec.containers')
export function expliquerChamp(chemin) {
  const n = normaliser(chemin)
  return CHAMPS[n] || CHAMPS[n.replace(/^spec\.jobTemplate\.spec\.template\.spec/, 'spec.template.spec')] || ''
}

// Parcours : liste de lignes { chemin, profondeur, clé, valeur (feuille), explication }.
function parcourir(objet, chemin = '', profondeur = 0, lignes = []) {
  if (Array.isArray(objet)) {
    objet.forEach((v, i) => {
      const c = `${chemin}[${i}]`
      if (v && typeof v === 'object') { lignes.push({ chemin: c, profondeur, clé: `- élément ${i + 1}${v.name ? ` (${v.name})` : ''}`, valeur: null, explication: '' }); parcourir(v, c, profondeur + 1, lignes) } else lignes.push({ chemin: c, profondeur, clé: '-', valeur: v, explication: '' })
    })
  } else if (objet && typeof objet === 'object') {
    for (const [k, v] of Object.entries(objet)) {
      const c = chemin ? `${chemin}.${k}` : k
      const feuille = !(v && typeof v === 'object')
      lignes.push({ chemin: c, profondeur, clé: k, valeur: feuille ? v : null, explication: expliquerChamp(c) })
      if (!feuille) parcourir(v, c, profondeur + 1, lignes)
    }
  }
  return lignes
}

const podSpec = d => (d.kind === 'Pod' ? d.spec : d.kind === 'CronJob' ? d.spec?.jobTemplate?.spec?.template?.spec : d.spec?.template?.spec)
const labelsPod = d => (d.kind === 'Pod' ? d.metadata?.labels : d.kind === 'CronJob' ? d.spec?.jobTemplate?.spec?.template?.metadata?.labels : d.spec?.template?.metadata?.labels) || {}
const inclus = (petit, grand) => Object.entries(petit || {}).every(([k, v]) => grand?.[k] === v)

export function analyserManifestes(documents) {
  const docs = documents.filter(d => d && typeof d === 'object')
  const charges = docs.filter(d => ['Deployment', 'StatefulSet', 'DaemonSet', 'Pod', 'Job', 'CronJob'].includes(d.kind))
  const services = docs.filter(d => d.kind === 'Service')
  return docs.map(d => {
    const alertes = []
    const ajouter = (niveau, texte) => alertes.push({ niveau, texte })
    const nom = `${d.kind || '?'} ${d.metadata?.name || '(sans nom)'}`
    if (!d.apiVersion || !d.kind) ajouter('erreur', 'apiVersion et kind sont obligatoires.')
    if (!d.metadata?.name) ajouter('erreur', 'metadata.name est obligatoire.')
    if (d.kind && !['Namespace', 'ClusterRole', 'ClusterRoleBinding', 'PersistentVolume', 'StorageClass'].includes(d.kind) && !d.metadata?.namespace) ajouter('info', 'Pas de namespace : l\'objet ira dans le namespace courant (souvent « default »).')
    const ps = podSpec(d)
    if (ps) {
      for (const c of [...(ps.containers || []), ...(ps.initContainers || [])]) {
        const n = c.name || '?'
        if (!c.image) ajouter('erreur', `Conteneur ${n} : pas d'image.`)
        else if (/:latest$/.test(c.image) || !/[:@]/.test(c.image.split('/').pop())) ajouter('alerte', `Conteneur ${n} : image sans version fixe (${c.image}). Utilise un tag précis pour des déploiements reproductibles.`)
        if (!c.resources?.requests) ajouter('alerte', `Conteneur ${n} : pas de resources.requests : le scheduler place le pod à l'aveugle.`)
        if (!c.resources?.limits?.memory) ajouter('alerte', `Conteneur ${n} : pas de limite mémoire : il peut épuiser la mémoire du nœud.`)
        if (['Deployment', 'StatefulSet', 'DaemonSet'].includes(d.kind) && !(ps.initContainers || []).includes(c)) {
          if (!c.readinessProbe) ajouter('alerte', `Conteneur ${n} : pas de readinessProbe : il recevra du trafic avant d'être prêt.`)
          if (!c.livenessProbe) ajouter('info', `Conteneur ${n} : pas de livenessProbe : un blocage ne sera pas redémarré automatiquement.`)
        }
        if (c.securityContext?.privileged) ajouter('alerte', `Conteneur ${n} : privileged: true donne presque tous les droits sur le nœud.`)
        if (c.securityContext?.runAsUser === 0) ajouter('alerte', `Conteneur ${n} : lancé en root (runAsUser: 0).`)
        for (const e of c.env || []) if (e.value && /pass|secret|token|key/i.test(e.name || '')) ajouter('alerte', `Conteneur ${n} : la variable ${e.name} semble sensible et est écrite en clair : utilise un Secret (valueFrom.secretKeyRef).`)
      }
      if (ps.hostNetwork) ajouter('alerte', 'hostNetwork: true : le pod partage le réseau du nœud.')
    }
    if (['Deployment', 'StatefulSet', 'DaemonSet'].includes(d.kind)) {
      const sel = d.spec?.selector?.matchLabels
      if (!sel) ajouter('erreur', 'spec.selector.matchLabels manquant.')
      else if (!inclus(sel, labelsPod(d))) ajouter('erreur', 'Le selector ne correspond pas aux labels du modèle de pod : Kubernetes refusera l\'objet.')
      if (d.kind !== 'DaemonSet' && (d.spec?.replicas ?? 1) < 2) ajouter('info', `${d.spec?.replicas ?? 1} réplica : pas de haute disponibilité (une panne = coupure).`)
    }
    if (d.kind === 'Service') {
      const sel = d.spec?.selector
      if (!sel) ajouter('info', 'Service sans selector : il faudra gérer ses endpoints à la main.')
      else if (charges.length) {
        const cibles = charges.filter(w => inclus(sel, labelsPod(w)))
        if (!cibles.length) ajouter('erreur', `Aucune charge collée n'a les labels ${JSON.stringify(sel)} : le Service n'aura aucun endpoint.`)
        for (const p of d.spec?.ports || []) {
          if (p.targetPort === undefined) continue
          const ports = cibles.flatMap(w => (podSpec(w)?.containers || []).flatMap(c => c.ports || []))
          if (ports.length && !ports.some(x => x.containerPort === p.targetPort || x.name === p.targetPort)) ajouter('alerte', `targetPort ${p.targetPort} n'est déclaré dans aucun conteneur ciblé.`)
        }
      }
      if (d.spec?.type === 'LoadBalancer') ajouter('info', 'type LoadBalancer : crée un load balancer payant chez le fournisseur cloud.')
    }
    if (d.kind === 'Ingress') {
      for (const r of d.spec?.rules || []) for (const p of r.http?.paths || []) {
        const s = p.backend?.service?.name
        if (s && services.length && !services.some(x => x.metadata?.name === s)) ajouter('info', `Le Service ${s} n'est pas dans les manifestes collés : vérifie qu'il existe.`)
      }
      if (!d.spec?.tls) ajouter('info', 'Pas de section tls : l\'Ingress sert en HTTP seulement.')
    }
    if (d.kind === 'Secret' && (d.data || d.stringData)) ajouter('info', 'Les données d\'un Secret sont encodées en base64, pas chiffrées : ne le commite pas dans Git (utilise Sealed Secrets, External Secrets ou SOPS).')
    let planning = null
    if (d.kind === 'CronJob' && d.spec?.schedule) planning = analyserCron(d.spec.schedule)
    return { nom, kind: d.kind, description: KINDS[d.kind] || '', alertes, lignes: parcourir(d), planning }
  })
}
