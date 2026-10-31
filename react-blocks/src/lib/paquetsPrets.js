// Paquets de cartes prêts à importer dans Mémoriser : commandes DevOps
// (le verso est un bloc ```bash … ``` avec bouton Copier), préparation à
// la naturalisation (un paquet par thème, pour le QCM et le score par thème)
// et français (connecteurs, sujets d'oral chronométrés).
// Une carte : [recto, verso]. `cmd(…)` met le texte dans un bloc de code.

const cmd = (code, note = '', langage = 'bash') => `\`\`\`${langage}\n${code}\n\`\`\`${note ? `\n${note}` : ''}`

const KUBECTL = [
  ['Lister les pods de tous les namespaces', cmd('kubectl get pods -A')],
  ['Voir les pods avec leur IP et leur nœud', cmd('kubectl get pods -o wide')],
  ['Voir le détail et les événements d\'un pod', cmd('kubectl describe pod <pod>')],
  ['Suivre les logs d\'un pod en direct', cmd('kubectl logs -f <pod>')],
  ['Logs du conteneur AVANT son dernier redémarrage (crash)', cmd('kubectl logs <pod> --previous')],
  ['Logs d\'un conteneur précis dans un pod à plusieurs conteneurs', cmd('kubectl logs <pod> -c <conteneur>')],
  ['Ouvrir un shell dans un pod', cmd('kubectl exec -it <pod> -- sh')],
  ['Appliquer un manifeste YAML', cmd('kubectl apply -f fichier.yaml')],
  ['Passer un déploiement à 3 réplicas', cmd('kubectl scale deployment <nom> --replicas=3')],
  ['Suivre l\'avancement d\'un déploiement', cmd('kubectl rollout status deployment/<nom>')],
  ['Revenir à la version précédente d\'un déploiement', cmd('kubectl rollout undo deployment/<nom>')],
  ['Redémarrer tous les pods d\'un déploiement (sans changer le YAML)', cmd('kubectl rollout restart deployment/<nom>')],
  ['Accéder en local au port 80 d\'un service', cmd('kubectl port-forward svc/<service> 8080:80', 'Puis http://localhost:8080')],
  ['Changer le namespace par défaut du contexte courant', cmd('kubectl config set-context --current --namespace=<ns>')],
  ['Voir le contexte (cluster) utilisé', cmd('kubectl config current-context')],
  ['Consommation CPU / mémoire des pods', cmd('kubectl top pods', 'Nécessite metrics-server')],
  ['Événements du namespace, du plus ancien au plus récent', cmd('kubectl get events --sort-by=.metadata.creationTimestamp')],
  ['Pod en CrashLoopBackOff : les 2 premières commandes', cmd('kubectl describe pod <pod>\nkubectl logs <pod> --previous', 'Regarder : Exit Code, OOMKilled, probes, variables, image')],
  ['Générer le YAML d\'un déploiement sans le créer', cmd('kubectl create deployment web --image=nginx --dry-run=client -o yaml')],
  ['Voir les ressources d\'un namespace (pods, services, déploiements…)', cmd('kubectl get all -n <ns>')],
]

const DOCKER = [
  ['Lister les conteneurs, y compris arrêtés', cmd('docker ps -a')],
  ['Construire une image taguée app:1.0 depuis le dossier courant', cmd('docker build -t app:1.0 .')],
  ['Lancer nginx en arrière-plan, port 8080 → 80, nommé web', cmd('docker run -d -p 8080:80 --name web nginx')],
  ['Suivre les logs d\'un conteneur', cmd('docker logs -f <conteneur>')],
  ['Ouvrir un shell dans un conteneur qui tourne', cmd('docker exec -it <conteneur> sh')],
  ['Voir la consommation CPU / mémoire des conteneurs', cmd('docker stats')],
  ['Voir toute la configuration d\'un conteneur (IP, volumes, env)', cmd('docker inspect <conteneur>')],
  ['Copier un fichier d\'un conteneur vers la machine', cmd('docker cp <conteneur>:/chemin/fichier .')],
  ['Supprimer les images, conteneurs et réseaux inutilisés', cmd('docker system prune -a', '⚠️ Supprime aussi les images non utilisées')],
  ['Place occupée par Docker sur le disque', cmd('docker system df')],
  ['Démarrer / arrêter une stack Compose', cmd('docker compose up -d\ndocker compose down')],
  ['Taguer et pousser une image vers un registre', cmd('docker tag app:1.0 registre.exemple.com/app:1.0\ndocker push registre.exemple.com/app:1.0')],
  ['Différence entre CMD et ENTRYPOINT', 'ENTRYPOINT = la commande fixe du conteneur.\nCMD = les arguments par défaut (remplacés par ceux de `docker run`).'],
  ['Dockerfile multi-étapes : à quoi ça sert ?', cmd('FROM maven:3.9-eclipse-temurin-21 AS build\nRUN mvn -q package\n\nFROM eclipse-temurin:21-jre\nCOPY --from=build /app/target/app.jar /app.jar', 'Image finale plus petite : sans les outils de build', 'dockerfile')],
]

const GIT = [
  ['Créer une branche et s\'y placer', cmd('git switch -c <branche>')],
  ['Historique compact de toutes les branches en graphe', cmd('git log --oneline --graph --all')],
  ['Mettre de côté ses modifications puis les reprendre', cmd('git stash\ngit stash pop')],
  ['Corriger le message (ou le contenu) du dernier commit', cmd('git commit --amend')],
  ['Annuler le dernier commit en gardant les modifications', cmd('git reset --soft HEAD~1')],
  ['Annuler un commit déjà poussé (sans réécrire l\'historique)', cmd('git revert <sha>')],
  ['Récupérer un seul commit d\'une autre branche', cmd('git cherry-pick <sha>')],
  ['Voir ce qui est prêt à être commité', cmd('git diff --staged')],
  ['Annuler les modifications d\'un fichier non commitées', cmd('git restore <fichier>')],
  ['Nettoyer les branches distantes supprimées', cmd('git fetch --prune')],
  ['Réécrire / regrouper les 3 derniers commits', cmd('git rebase -i HEAD~3')],
  ['Retrouver un commit « perdu » après un reset', cmd('git reflog')],
]

const TERRAFORM = [
  ['Préparer un dossier Terraform (providers, backend)', cmd('terraform init')],
  ['Voir ce qui va changer, sans rien appliquer', cmd('terraform plan')],
  ['Enregistrer un plan puis l\'appliquer tel quel', cmd('terraform plan -out=tfplan\nterraform apply tfplan')],
  ['Appliquer les changements', cmd('terraform apply')],
  ['Supprimer toute l\'infrastructure gérée', cmd('terraform destroy')],
  ['Formater et vérifier les fichiers', cmd('terraform fmt -recursive\nterraform validate')],
  ['Lister les ressources connues de l\'état', cmd('terraform state list')],
  ['Ramener une ressource existante dans l\'état', cmd('terraform import <adresse> <id>')],
  ['Oublier une ressource sans la détruire', cmd('terraform state rm <adresse>')],
  ['Afficher les sorties (outputs)', cmd('terraform output')],
  ['À quoi sert le state ? Où le stocker en équipe ?', 'Il relie le code aux ressources réelles. En équipe : backend distant (S3 + verrou, GCS, Terraform Cloud…), jamais dans Git.'],
]

const LINUX = [
  ['Place libre sur les disques', cmd('df -h')],
  ['Les dossiers les plus lourds du dossier courant', cmd('du -sh * | sort -h')],
  ['Mémoire libre', cmd('free -h')],
  ['Ports en écoute et programme associé', cmd('sudo ss -tlnp')],
  ['Quel processus utilise le port 8080 ?', cmd('sudo lsof -i :8080')],
  ['Trouver un processus par son nom', cmd('ps aux | grep <nom>')],
  ['État et redémarrage d\'un service', cmd('systemctl status <service>\nsudo systemctl restart <service>')],
  ['Suivre les logs d\'un service systemd', cmd('journalctl -u <service> -f')],
  ['Suivre un fichier de log', cmd('tail -f /var/log/syslog')],
  ['Chercher un texte dans tous les fichiers d\'un dossier', cmd('grep -rn "texte" <dossier>')],
  ['Trouver les fichiers de plus de 500 Mo', cmd('sudo find / -type f -size +500M 2>/dev/null')],
  ['Voir seulement les en-têtes HTTP d\'une URL', cmd('curl -I https://exemple.com')],
  ['Date d\'expiration du certificat d\'un site', cmd('echo | openssl s_client -connect exemple.com:443 -servername exemple.com 2>/dev/null | openssl x509 -noout -dates')],
  ['Droits : propriétaire lecture/écriture, groupe lecture, autres rien', cmd('chmod 640 <fichier>')],
  ['Archiver et compresser un dossier', cmd('tar -czf archive.tar.gz <dossier>')],
]

const HELM = [
  ['Ajouter un dépôt de charts et le mettre à jour', cmd('helm repo add bitnami https://charts.bitnami.com/bitnami\nhelm repo update')],
  ['Installer ou mettre à jour une release avec un fichier de valeurs', cmd('helm upgrade --install <release> <chart> -f values.yaml -n <ns> --create-namespace')],
  ['Lister les releases de tous les namespaces', cmd('helm list -A')],
  ['Historique des versions d\'une release', cmd('helm history <release> -n <ns>')],
  ['Revenir à la révision 1 d\'une release', cmd('helm rollback <release> 1 -n <ns>')],
  ['Voir les valeurs par défaut d\'un chart', cmd('helm show values <chart>')],
  ['Générer les YAML sans rien installer', cmd('helm template <release> <chart> -f values.yaml')],
  ['Désinstaller une release', cmd('helm uninstall <release> -n <ns>')],
]

const VALEURS = [
  ['Quelle est la devise de la République française ?', '**Liberté, Égalité, Fraternité**'],
  ['Quelles sont les couleurs du drapeau ?', 'Bleu, blanc, rouge'],
  ['Quel est l\'hymne national ? Qui l\'a écrit ?', '**La Marseillaise**, écrite par Rouget de Lisle en 1792'],
  ['Quelle est la date de la fête nationale ?', 'Le **14 juillet**'],
  ['Qui est Marianne ?', 'La figure qui représente la République française'],
  ['Selon l\'article 1er de la Constitution, la République est…', 'Indivisible, laïque, démocratique et sociale'],
  ['Qu\'est-ce que la laïcité ?', 'La séparation des Églises et de l\'État (loi de **1905**) : l\'État est neutre, chacun est libre de croire ou de ne pas croire'],
  ['Quel texte de 1789 proclame les droits fondamentaux ?', 'La **Déclaration des droits de l\'homme et du citoyen** (26 août 1789)'],
  ['Depuis quand les femmes ont-elles le droit de vote ?', '1944 (premier vote en 1945)'],
  ['Quand la peine de mort a-t-elle été abolie ? Par qui ?', 'En **1981**, loi portée par Robert Badinter'],
  ['Quelle est la langue de la République ?', 'Le français (article 2 de la Constitution)'],
  ['À quel âge devient-on majeur et électeur ?', '18 ans'],
  ['Citer des droits et des devoirs du citoyen', 'Droits : voter, s\'exprimer, s\'associer…\nDevoirs : respecter la loi, payer ses impôts, être juré si on est tiré au sort, participer à la défense'],
]

const INSTITUTIONS = [
  ['Depuis quand la Ve République existe-t-elle ?', 'Depuis la Constitution du **4 octobre 1958**'],
  ['Comment et pour combien de temps le président est-il élu ?', 'Au suffrage universel direct, pour **5 ans**'],
  ['Qui nomme le Premier ministre ?', 'Le président de la République'],
  ['De quoi est composé le Parlement ?', 'L\'**Assemblée nationale** et le **Sénat**'],
  ['Combien y a-t-il de députés ? Pour combien de temps ?', '**577** députés, élus pour 5 ans au suffrage universel direct'],
  ['Comment les sénateurs sont-ils élus ?', 'Au suffrage universel indirect (par les grands électeurs), pour 6 ans'],
  ['Qui vote les lois ?', 'Le Parlement'],
  ['Quel est le rôle du Conseil constitutionnel ?', 'Vérifier que les lois respectent la Constitution'],
  ['Quelles sont les collectivités territoriales ?', 'Les communes, les départements et les régions (et des collectivités à statut particulier)'],
  ['Qui élit le maire ?', 'Le conseil municipal, lui-même élu par les habitants'],
  ['Combien de régions compte la France ?', '18, dont 13 en métropole'],
  ['La France est membre fondateur de quelle organisation européenne ?', 'Des Communautés européennes (traité de Rome, 1957), aujourd\'hui l\'**Union européenne**'],
  ['Où siège le Parlement européen ?', 'À **Strasbourg**'],
]

const HISTOIRE = [
  ['Que se passe-t-il le 14 juillet 1789 ?', 'La **prise de la Bastille**, début de la Révolution française'],
  ['En quelle année la Première République est-elle proclamée ?', '1792'],
  ['Qui est sacré empereur en 1804 ?', 'Napoléon Bonaparte (Napoléon Ier)'],
  ['Qu\'est-ce qui est adopté en 1848 ?', 'Le suffrage universel masculin et l\'abolition de l\'esclavage (Victor Schœlcher)'],
  ['Qu\'apportent les lois Jules Ferry (1881-1882) ?', 'L\'école primaire **gratuite, laïque et obligatoire**'],
  ['Que célèbre-t-on le 11 novembre ?', 'L\'armistice de 1918, fin de la Première Guerre mondiale'],
  ['Qu\'est-ce que l\'appel du 18 juin 1940 ?', 'L\'appel du général de Gaulle, depuis Londres, à continuer le combat : naissance de la Résistance'],
  ['Que célèbre-t-on le 8 mai ?', 'La victoire de 1945 sur l\'Allemagne nazie'],
  ['Qui fonde la Ve République ?', 'Le général de Gaulle, en 1958'],
  ['Qui est couronné empereur en l\'an 800 ?', 'Charlemagne'],
  ['Qui est Jeanne d\'Arc ?', 'Une héroïne de la guerre de Cent Ans (XVe siècle)'],
  ['Qu\'est-ce que l\'édit de Nantes (1598) ?', 'Il accorde la liberté de culte aux protestants (Henri IV)'],
  ['Quel roi fait construire le château de Versailles ?', 'Louis XIV'],
  ['En quelle année l\'Algérie devient-elle indépendante ?', '1962'],
]

const GÉOGRAPHIE = [
  ['Quelle est la capitale de la France ?', 'Paris'],
  ['Quel est le plus long fleuve de France ?', 'La **Loire** (environ 1 000 km)'],
  ['Quel est le point culminant de la France ?', 'Le **mont Blanc** (environ 4 806 m)'],
  ['Quelles mers et quel océan bordent la France métropolitaine ?', 'La Manche, la mer du Nord, l\'océan Atlantique et la Méditerranée'],
  ['Citer les pays frontaliers de la France métropolitaine', 'Belgique, Luxembourg, Allemagne, Suisse, Italie, Monaco, Andorre, Espagne'],
  ['Citer les départements et régions d\'outre-mer', 'Guadeloupe, Martinique, Guyane, La Réunion, Mayotte'],
  ['Environ combien d\'habitants compte la France ?', 'Environ 68 millions'],
  ['Quelle est la monnaie de la France ?', 'L\'euro'],
  ['Qui a écrit « Les Misérables » ?', 'Victor Hugo'],
  ['Quel auteur de théâtre a écrit « Le Malade imaginaire » ?', 'Molière'],
  ['Quelle scientifique a reçu deux prix Nobel ?', 'Marie Curie (1903 et 1911)'],
  ['Qui a mis au point le vaccin contre la rage ?', 'Louis Pasteur (1885)'],
  ['Qu\'est-ce que le Panthéon ?', 'Le monument de Paris où reposent de grandes personnalités de la Nation'],
]

const CONNECTEURS = [
  ['Exprimer la **cause** (4 façons)', 'parce que · puisque · étant donné que · grâce à / à cause de'],
  ['Exprimer la **conséquence** (4 façons)', 'donc · c\'est pourquoi · par conséquent · si bien que'],
  ['Exprimer l\'**opposition**', 'cependant · pourtant · néanmoins · alors que · en revanche'],
  ['« Bien que » est suivi de quel mode ?', 'Du **subjonctif** : « Bien qu\'il **soit** fatigué, il travaille. »'],
  ['Exprimer le **but**', 'pour / afin de + infinitif · pour que / afin que + **subjonctif**'],
  ['Ajouter une idée', 'de plus · en outre · par ailleurs · d\'ailleurs'],
  ['Conclure', 'en somme · pour conclure · en définitive · bref'],
  ['Donner son opinion', 'à mon avis · selon moi · il me semble que · je suis convaincu(e) que'],
  ['Nuancer son propos', 'certes… mais · dans une certaine mesure · il faut toutefois reconnaître que'],
  ['Hypothèse : si + imparfait → ?', 'Conditionnel présent : « Si j\'**avais** le temps, je **ferais** du sport. »'],
  ['Regret : si + plus-que-parfait → ?', 'Conditionnel passé : « Si j\'**avais su**, je **serais venu**. »'],
  ['« Se rendre compte » : sens et exemple', 'Prendre conscience : « Je me suis rendu compte de mon erreur. »'],
  ['« Avoir du mal à » : sens et exemple', 'Avoir des difficultés : « J\'ai du mal à me lever tôt. »'],
  ['Structurer un exposé : 3 mots pour les étapes', 'Tout d\'abord… ensuite… enfin…'],
]

const ORAL = [
  ['Présentez-vous en deux minutes', 'Plan : identité et origine → parcours (études, arrivée en France) → travail → vie en France (amis, associations, loisirs) → projets.\nConnecteurs : tout d\'abord, ensuite, depuis, aujourd\'hui, enfin.'],
  ['Pourquoi souhaitez-vous devenir français(e) ?', 'Plan : attachement à la France (années passées, travail, famille) → adhésion aux valeurs (liberté, égalité, fraternité, laïcité) → envie de participer (voter, s\'engager).\nÉviter les raisons seulement pratiques (passeport, papiers).'],
  ['Parlez de votre métier', 'Plan : ce que je fais → une journée type → ce que j\'aime → une difficulté et comment je la surmonte.\nDevOps : automatiser, déployer, surveiller, travailler avec les équipes.'],
  ['Que représente la laïcité pour vous ?', 'Plan : définition (loi de 1905, neutralité de l\'État) → ce qu\'elle garantit (liberté de croire ou non, égalité) → un exemple concret (école publique, administration).'],
  ['L\'égalité entre les femmes et les hommes', 'Plan : principe (Constitution, droit de vote en 1944) → dans la vie quotidienne (travail, salaires, tâches) → ce que je fais moi-même.'],
  ['Parlez de la région où vous vivez', 'Plan : situation géographique → ce qu\'on y trouve (villes, paysages, spécialités) → ce que j\'y aime → un lieu à recommander.'],
  ['Racontez un événement de l\'histoire de France', 'Exemples : 1789, 1905, 18 juin 1940, 1958.\nPlan : contexte → ce qui s\'est passé → pourquoi c\'est important aujourd\'hui.'],
  ['Le télétravail : avantages et inconvénients', 'Plan : avantages (moins de trajets, concentration) → inconvénients (isolement, frontière vie pro/perso) → mon avis nuancé.\nConnecteurs : d\'un côté… de l\'autre, cependant, en somme.'],
  ['Les réseaux sociaux : danger ou progrès ?', 'Plan : apports (information, lien) → risques (désinformation, harcèlement, temps passé) → solutions → conclusion personnelle.'],
  ['Pourquoi est-il important de voter ?', 'Plan : un droit conquis (1848, 1944) → un devoir civique → l\'abstention et ses risques → mon engagement.'],
  ['L\'engagement associatif ou bénévole', 'Plan : définition (loi de 1901 sur les associations) → un exemple que je connais ou que je fais → ce que ça apporte à la société et à soi.'],
  ['Comment protéger l\'environnement au quotidien ?', 'Plan : constat → gestes individuels (tri, transports, consommation) → rôle de l\'État et des entreprises → conclusion.'],
]

// Labos pratiques (CKA) : [énoncé, solution, { vérif }] — à faire dans un
// cluster de test (kind, minikube, killercoda…).
const LABOS_CKA = [
  ['Crée le namespace « app », puis un Deployment « web » (image nginx, 3 réplicas) dedans.', cmd('kubectl create namespace app\nkubectl create deployment web --image=nginx --replicas=3 -n app'), { vérif: 'kubectl get deploy web -n app' }],
  ['Expose le Deployment « web » (namespace app) sur le port 80 avec un Service ClusterIP.', cmd('kubectl expose deployment web --port=80 -n app'), { vérif: 'kubectl get svc,endpoints web -n app' }],
  ['Passe l\'image de « web » en nginx:1.27, attends la fin du déploiement, puis reviens à la version précédente.', cmd('kubectl set image deployment/web nginx=nginx:1.27 -n app\nkubectl rollout status deployment/web -n app\nkubectl rollout undo deployment/web -n app'), { vérif: 'kubectl rollout history deployment/web -n app' }],
  ['Lance un pod « busy » (busybox) qui exécute « sleep 3600 », puis teste la résolution DNS depuis ce pod.', cmd('kubectl run busy --image=busybox --restart=Never -- sleep 3600\nkubectl exec busy -- nslookup kubernetes.default'), { vérif: 'kubectl get pod busy' }],
  ['Crée la ConfigMap « config » (MODE=prod) et un pod « lecteur » (nginx) qui la reçoit en variables d\'environnement.', cmd('kubectl create configmap config --from-literal=MODE=prod\nkubectl run lecteur --image=nginx --dry-run=client -o yaml > lecteur.yaml\n# dans lecteur.yaml, sous le conteneur :\n#   envFrom:\n#   - configMapRef:\n#       name: config\nkubectl apply -f lecteur.yaml'), { vérif: 'kubectl exec lecteur -- env | grep MODE' }],
  ['Crée le Secret « db » (PASSWORD=s3cret) et affiche sa valeur décodée.', cmd('kubectl create secret generic db --from-literal=PASSWORD=s3cret\nkubectl get secret db -o jsonpath=\'{.data.PASSWORD}\' | base64 -d'), { vérif: 'kubectl get secret db' }],
  ['Mets le nœud « node01 » en maintenance (plus de nouveaux pods, pods existants déplacés), puis remets-le en service.', cmd('kubectl cordon node01\nkubectl drain node01 --ignore-daemonsets --delete-emptydir-data\n# … maintenance …\nkubectl uncordon node01'), { vérif: 'kubectl get nodes' }],
  ['Crée un PVC « donnees » de 1 Gi (ReadWriteOnce) et monte-le sur /data dans un pod « stockage ».', cmd('apiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: donnees\nspec:\n  accessModes: ["ReadWriteOnce"]\n  resources:\n    requests:\n      storage: 1Gi\n---\napiVersion: v1\nkind: Pod\nmetadata:\n  name: stockage\nspec:\n  containers:\n  - name: app\n    image: nginx\n    volumeMounts:\n    - name: d\n      mountPath: /data\n  volumes:\n  - name: d\n    persistentVolumeClaim:\n      claimName: donnees', '', 'yaml'), { vérif: 'kubectl get pvc donnees && kubectl exec stockage -- ls /data' }],
  ['Donne au ServiceAccount « lecteur » (namespace app) le droit de lister les pods de ce namespace.', cmd('kubectl create serviceaccount lecteur -n app\nkubectl create role lire-pods --verb=get,list,watch --resource=pods -n app\nkubectl create rolebinding lecteur-pods --role=lire-pods --serviceaccount=app:lecteur -n app'), { vérif: 'kubectl auth can-i list pods -n app --as=system:serviceaccount:app:lecteur' }],
  ['NetworkPolicy « db-depuis-web » : les pods app=db n\'acceptent que le trafic des pods app=web, sur le port 5432.', cmd('apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: db-depuis-web\nspec:\n  podSelector:\n    matchLabels:\n      app: db\n  policyTypes: ["Ingress"]\n  ingress:\n  - from:\n    - podSelector:\n        matchLabels:\n          app: web\n    ports:\n    - protocol: TCP\n      port: 5432', '', 'yaml'), { vérif: 'kubectl describe networkpolicy db-depuis-web' }],
  ['Sauvegarde etcd dans /opt/etcd.db (certificats dans /etc/kubernetes/pki/etcd).', cmd('ETCDCTL_API=3 etcdctl snapshot save /opt/etcd.db \\\n  --endpoints=https://127.0.0.1:2379 \\\n  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\\n  --cert=/etc/kubernetes/pki/etcd/server.crt \\\n  --key=/etc/kubernetes/pki/etcd/server.key'), { vérif: 'ls -lh /opt/etcd.db' }],
  ['Ajoute un autoscaler à « web » (namespace app) : CPU 50 %, de 2 à 5 pods.', cmd('kubectl autoscale deployment web --cpu-percent=50 --min=2 --max=5 -n app'), { vérif: 'kubectl get hpa -n app' }],
]

// Scénarios de panne : la réponse est une démarche, dans l'ordre.
const PANNES = [
  ['Un pod reste en **Pending** : que vérifies-tu ?', `1. Les événements : ${'`kubectl describe pod <pod>`'}\n2. Ressources insuffisantes (requests trop hautes) ?\n3. Taints / tolérances, nodeSelector, affinité ?\n4. PVC pas encore lié ?`],
  ['Un pod est en **ImagePullBackOff** : que vérifies-tu ?', `1. Nom et tag de l'image (faute de frappe ?)\n2. Registre privé : imagePullSecrets\n3. Accès réseau du nœud au registre\n${'`kubectl describe pod <pod>`'} → Events`],
  ['Un pod est en **CrashLoopBackOff** : que vérifies-tu ?', `1. ${'`kubectl logs <pod> --previous`'}\n2. Exit code et raison (OOMKilled ?) dans ${'`describe`'}\n3. Probes trop strictes ?\n4. Variable, Secret ou ConfigMap manquant ?`],
  ['Un conteneur est **OOMKilled** : que fais-tu ?', `Il a dépassé sa limite mémoire.\n1. Confirmer : ${'`kubectl describe pod`'} (Last State: OOMKilled)\n2. Mesurer : ${'`kubectl top pod`'}\n3. Augmenter limits.memory ou corriger la fuite`],
  ['Un **Service** ne répond pas (aucun endpoint) : que vérifies-tu ?', `1. ${'`kubectl get endpoints <svc>`'} : vide ?\n2. Le selector du Service correspond-il aux labels des pods ? (${'`kubectl get pods --show-labels`'})\n3. targetPort = port du conteneur ?\n4. Pods prêts (readiness) ?`],
  ['Un **Ingress** renvoie 502 / 503 : que vérifies-tu ?', `1. ${'`kubectl describe ingress`'} : bon Service et bon port ?\n2. Le Service a-t-il des endpoints ?\n3. Pods prêts (readiness probe) ?\n4. Bonne ingressClass ?`],
  ['La **résolution DNS** ne marche pas dans un pod : que vérifies-tu ?', `1. Test : ${'`kubectl exec <pod> -- nslookup kubernetes.default`'}\n2. Pods CoreDNS : ${'`kubectl get pods -n kube-system -l k8s-app=kube-dns`'}\n3. Leurs logs\n4. Une NetworkPolicy bloque-t-elle le port 53 ?`],
  ['Un nœud est **NotReady** : que vérifies-tu ?', `1. ${'`kubectl describe node <nœud>`'} → Conditions\n2. Sur le nœud : ${'`systemctl status kubelet`'} et ${'`journalctl -u kubelet`'}\n3. Disque ou mémoire saturés ?\n4. Runtime de conteneurs (containerd) actif ?`],
  ['Un **PVC** reste en Pending : que vérifies-tu ?', `1. ${'`kubectl describe pvc <pvc>`'}\n2. La StorageClass existe-t-elle ? Y en a-t-il une par défaut ?\n3. Le provisioner fonctionne-t-il ?\n4. Taille / accessMode compatibles avec un PV ?`],
  ['Un **déploiement** reste bloqué à mi-chemin : que vérifies-tu ?', `1. ${'`kubectl rollout status deployment/<nom>`'}\n2. Nouveaux pods : prêts ? (readiness)\n3. Quotas du namespace\n4. Si besoin : ${'`kubectl rollout undo deployment/<nom>`'}`],
  ['Terraform : **Error acquiring the state lock** : que fais-tu ?', `1. Une autre exécution est-elle en cours ? Attendre.\n2. Sinon, vérifier qui détient le verrou (ID dans le message)\n3. Seulement si c'est sûr : ${'`terraform force-unlock <ID>`'}`],
  ['Des pods sont **Evicted** : que vérifies-tu ?', `Le nœud manquait de ressources (souvent disque ou mémoire).\n1. ${'`kubectl describe pod`'} → raison\n2. ${'`kubectl describe node`'} → pressions\n3. Nettoyer, ajuster requests/limits`],
]

const DROITS = [
  ['Le vote est-il obligatoire en France ?', 'Non. Voter est un droit et un **devoir civique**, mais pas une obligation légale.'],
  ['Qui peut voter aux élections nationales ?', 'Les citoyens français majeurs, inscrits sur les listes électorales.'],
  ['La liberté d\'expression a-t-elle des limites ?', 'Oui : l\'injure, la diffamation et l\'appel à la haine ou à la violence sont interdits par la loi.'],
  ['Jusqu\'à quel âge l\'instruction est-elle obligatoire ?', 'De **3 à 16 ans** ; puis obligation de formation jusqu\'à 18 ans.'],
  ['Quel mariage a une valeur légale ?', 'Le **mariage civil**, à la mairie. Il doit avoir lieu avant toute cérémonie religieuse.'],
  ['À quel âge peut-on se marier ?', '**18 ans**, pour les femmes comme pour les hommes, avec le libre consentement des deux.'],
  ['La polygamie est-elle autorisée ?', 'Non, elle est interdite en France.'],
  ['Quels numéros d\'urgence connaître ?', '15 SAMU · 17 police · 18 pompiers · **112** numéro européen · 114 par SMS'],
  ['Payer ses impôts : droit ou devoir ?', 'Un devoir : chacun contribue selon ses moyens (article 13 de la Déclaration de 1789).'],
  ['Peut-on se faire justice soi-même ?', 'Non. Seule la justice peut juger et sanctionner.'],
  ['Qu\'est-ce que la présomption d\'innocence ?', 'Toute personne est considérée innocente tant que sa culpabilité n\'a pas été établie par un jugement.'],
  ['La discrimination est-elle punie ?', 'Oui : origine, sexe, religion, handicap, orientation sexuelle… On peut saisir le **Défenseur des droits** ou porter plainte.'],
  ['Que garantit la liberté de religion ?', 'Le droit de croire, de ne pas croire ou de changer de religion, et de pratiquer dans le respect de l\'ordre public.'],
  ['Que protège la Sécurité sociale ?', 'La santé, la famille, la retraite… financée par les cotisations de tous : c\'est la solidarité.'],
]

const SITUATIONS = [
  ['Un collègue refuse de travailler sous la direction d\'une femme. Qu\'en pensez-vous ?', 'C\'est contraire à l\'**égalité entre les femmes et les hommes**. Son attitude n\'est pas acceptable et l\'employeur peut le sanctionner.'],
  ['À la mairie, l\'agent au guichet porte un signe religieux visible. Est-ce permis ?', 'Non : les **agents publics** doivent rester neutres (laïcité). Les usagers, eux, peuvent en porter.'],
  ['Des parents veulent dispenser leur fille du cours de natation pour des raisons religieuses.', 'Ce n\'est pas possible : les enseignements sont obligatoires pour tous, filles et garçons. L\'école publique est laïque.'],
  ['Votre voisin annonce qu\'il ne paiera plus d\'impôts car il désapprouve le gouvernement.', 'Payer l\'impôt est une obligation. On exprime son désaccord par le vote, une pétition ou une manifestation déclarée.'],
  ['Un employeur écarte un candidat à cause de son nom à consonance étrangère.', 'C\'est une **discrimination à l\'embauche**, punie par la loi. Le candidat peut saisir le Défenseur des droits ou porter plainte.'],
  ['Vous êtes témoin de violences conjugales chez des voisins.', 'Appeler le **17** (ou le 112). Le **3919** écoute et oriente les victimes. Ne pas rester indifférent.'],
  ['Un ami veut marier sa fille de 16 ans.', 'Interdit : il faut avoir **18 ans** et donner son libre consentement. Le mariage forcé est puni.'],
  ['Une personne porte un voile intégral dans la rue.', 'La loi de **2010** interdit de dissimuler son visage dans l\'espace public.'],
  ['Quelqu\'un insulte une personne à cause de sa religion sur les réseaux sociaux.', 'L\'injure à caractère religieux ou raciste est un délit. On peut le signaler (plateforme Pharos) et porter plainte.'],
  ['Au travail, un collègue critique une religion. En a-t-il le droit ?', 'Oui : critiquer une religion ou une idée est permis (le blasphème n\'est pas un délit). Insulter des personnes ou appeler à la haine est interdit.'],
  ['Vous recevez une convocation pour être juré d\'assises.', 'C\'est une **obligation civique** : il faut s\'y rendre, sauf motif grave reconnu.'],
  ['Aux urgences, votre conjoint refuse que vous soyez examiné(e) par un médecin de l\'autre sexe.', 'Dans un service public, on ne choisit pas le soignant selon son sexe, surtout en urgence. Les soins priment.'],
  ['Une association veut organiser une manifestation.', 'Manifester est une liberté. Il faut la **déclarer** à l\'avance (mairie ou préfecture).'],
]

const ACTUALITÉ = [
  ['Qui est le président de la République ?', 'Emmanuel Macron (réélu en 2022, mandat jusqu\'en 2027)'],
  ['Qui est le Premier ministre ?', 'À compléter (vérifier sur gouvernement.fr)'],
  ['Qui préside l\'Assemblée nationale ?', 'À compléter'],
  ['Qui préside le Sénat ?', 'À compléter'],
  ['Qui est le maire de ma commune ?', 'À compléter'],
  ['Qui est mon député ?', 'À compléter'],
  ['Combien de pays compte l\'Union européenne ?', '27 (depuis le départ du Royaume-Uni en 2020)'],
  ['Quand aura lieu la prochaine élection présidentielle ?', 'En 2027'],
].map(c => [...c, { aVérifier: true }])

// ---------- AWS Certified CloudOps Engineer – Associate (SOA-C03) ----------
const AWS_SURVEILLANCE = [
  ['Quelles métriques EC2 ne sont PAS dans CloudWatch par défaut ?', 'La **mémoire** et l\'**espace disque** : il faut installer l\'agent CloudWatch sur l\'instance.'],
  ['Métriques EC2 : surveillance de base ou détaillée ?', 'De base : toutes les **5 min** (gratuit). Détaillée : toutes les **1 min** (payant).'],
  ['Que peut déclencher une alarme CloudWatch ?', 'Une notification SNS, une action Auto Scaling, une action EC2 (arrêter, redémarrer, récupérer) ou un OpsItem Systems Manager.'],
  ['Qui a supprimé ce bucket S3 ? Quel service répond ?', '**AWS CloudTrail** : journal des appels d\'API (90 jours dans l\'historique des événements, plus avec un trail).'],
  ['Vérifier en continu que tous les volumes EBS sont chiffrés, et corriger', '**AWS Config** : règles de conformité + remédiation automatique (documents SSM Automation).'],
  ['Interroger des logs avec un langage de requête', '**CloudWatch Logs Insights**'],
  ['Compter les lignes « ERROR » d\'un log pour créer une alarme', 'Un **filtre de métrique** (metric filter) sur le groupe de logs, puis une alarme sur cette métrique.'],
  ['Réagir à un événement AWS (instance arrêtée, appel d\'API…)', '**Amazon EventBridge** : règle → cible (Lambda, SNS, SSM Automation…).'],
  ['Recommandations de taille d\'instances (rightsizing)', '**AWS Compute Optimizer** (et Trusted Advisor pour coûts, limites, sécurité).'],
  ['Réduire le bruit de plusieurs alarmes liées', 'Une **alarme composite** (combinaison ET / OU d\'alarmes).'],
  ['EBS gp3 ou gp2 : la différence ?', 'gp3 : IOPS et débit réglés **indépendamment** de la taille (base 3 000 IOPS, 125 Mo/s). gp2 : IOPS liées à la taille (3 IOPS par Go).'],
  ['Accélérer les lectures d\'une base RDS', 'Des **réplicas en lecture** et/ou un cache (ElastiCache). Multi-AZ sert la disponibilité, pas la performance.'],
]
const AWS_FIABILITÉ = [
  ['RDS Multi-AZ ou réplica en lecture ?', 'Multi-AZ : copie **synchrone** en attente, bascule automatique (haute disponibilité). Réplica : copie **asynchrone** pour répartir les lectures (peut être promu).'],
  ['Remplacer automatiquement une instance défaillante derrière un load balancer', 'Un **groupe Auto Scaling** avec des contrôles de santé de type **ELB**.'],
  ['RTO et RPO ?', 'RTO : durée maximale d\'interruption acceptable. RPO : perte de données maximale acceptable (en temps).'],
  ['Stratégies de reprise, de la moins chère à la plus rapide', 'Sauvegarde et restauration → Pilot light → Warm standby → Multi-site actif/actif.'],
  ['Centraliser et planifier les sauvegardes (EBS, RDS, EFS, DynamoDB…)', '**AWS Backup** : plans de sauvegarde, copies inter-régions et inter-comptes.'],
  ['Protéger des objets S3 contre la suppression accidentelle', 'Le **versioning** (+ MFA Delete) ; **Object Lock** pour rendre les objets non modifiables.'],
  ['Copier automatiquement des objets S3 dans une autre région', 'La **réplication inter-régions (CRR)** : versioning obligatoire sur les deux buckets.'],
  ['Basculer vers un site de secours si le site principal tombe', '**Route 53**, routage de **basculement** (failover) avec contrôles de santé.'],
  ['Automatiser les instantanés EBS', '**Amazon Data Lifecycle Manager** (ou AWS Backup).'],
  ['Le stockage d\'une base RDS se remplit', 'Activer l\'**autoscaling du stockage** RDS.'],
  ['La règle de scaling la plus simple à configurer', 'Le **suivi de cible** (target tracking), par exemple CPU moyen à 50 %.'],
  ['Laisser finir les requêtes avant de retirer une instance de l\'ELB', 'Le **délai de désinscription** (deregistration delay, ex-connection draining).'],
]
const AWS_DÉPLOIEMENT = [
  ['Voir l\'effet d\'une modification CloudFormation avant de l\'appliquer', 'Un **change set** (jeu de modifications).'],
  ['Repérer les modifications faites à la main hors CloudFormation', 'La **détection de dérive** (drift detection).'],
  ['Déployer une même pile dans plusieurs comptes et régions', '**CloudFormation StackSets**'],
  ['Que se passe-t-il si la création d\'une pile échoue ?', '**Retour arrière** automatique (rollback), désactivable pour déboguer.'],
  ['Garder une base de données quand on supprime la pile', '**DeletionPolicy: Retain** (ou Snapshot) sur la ressource.'],
  ['Lancer une commande sur 100 instances sans SSH', '**Systems Manager Run Command** (agent SSM + rôle IAM).'],
  ['Appliquer les correctifs de sécurité aux instances', '**Systems Manager Patch Manager** (baselines, fenêtres de maintenance).'],
  ['Se connecter à une instance sans port 22 ni bastion', '**Systems Manager Session Manager**'],
  ['Parameter Store ou Secrets Manager ?', 'Parameter Store : configuration et secrets simples (SecureString, KMS). Secrets Manager : **rotation automatique** des secrets (bases RDS…).'],
  ['Produire automatiquement des AMI à jour', '**EC2 Image Builder**'],
  ['Déployer sans interruption avec retour arrière rapide', 'Le **blue/green** (deux environnements, bascule du trafic : CodeDeploy, groupes cibles, Elastic Beanstalk).'],
  ['Lancer un script au premier démarrage d\'une instance', 'Les **user data** (exécutées au premier démarrage, en root).'],
]
const AWS_SÉCURITÉ = [
  ['Comment AWS évalue-t-il les politiques IAM ?', 'Un **refus explicite** l\'emporte toujours. Sinon il faut une autorisation. Par défaut, tout est refusé.'],
  ['Donner à une instance EC2 l\'accès à S3', 'Un **rôle IAM** (profil d\'instance), jamais de clés d\'accès stockées sur l\'instance.'],
  ['Interdire une action à tous les comptes d\'une organisation, même root', 'Une **SCP** (Service Control Policy) d\'AWS Organizations.'],
  ['Chiffrer avec des clés gérées, tournées et auditées', '**AWS KMS** (clés gérées par le client, rotation, traces dans CloudTrail).'],
  ['Détecter des menaces (activité suspecte, minage de cryptomonnaie…)', '**Amazon GuardDuty**'],
  ['Scanner les vulnérabilités des instances et des images de conteneurs', '**Amazon Inspector**'],
  ['Vue centralisée des alertes de sécurité et des bonnes pratiques', '**AWS Security Hub**'],
  ['Empêcher toute exposition publique des buckets S3', '**S3 Block Public Access** (au niveau du compte et du bucket).'],
  ['Certificats TLS gratuits et renouvelés pour ALB et CloudFront', '**AWS Certificate Manager (ACM)**'],
  ['Bloquer injections SQL et XSS devant un site', '**AWS WAF** (sur ALB, CloudFront, API Gateway).'],
  ['Exiger le MFA pour une action', 'Une politique IAM avec la condition **aws:MultiFactorAuthPresent**.'],
  ['Trouver les ressources partagées avec l\'extérieur du compte', '**IAM Access Analyzer**'],
]
const AWS_RÉSEAU = [
  ['Qu\'est-ce qui rend un sous-réseau « public » ?', 'Sa table de routage envoie **0.0.0.0/0 vers une Internet Gateway**.'],
  ['Accès Internet sortant pour un sous-réseau privé', 'Une **NAT Gateway** dans un sous-réseau public (une par AZ pour la haute disponibilité).'],
  ['Security Group ou NACL ?', 'SG : instance, **avec état**, règles d\'autorisation seulement. NACL : sous-réseau, **sans état**, autoriser et refuser, règles numérotées (penser aux ports éphémères).'],
  ['Accéder à S3 depuis un sous-réseau privé sans NAT', 'Un **VPC endpoint de type gateway** (S3 et DynamoDB, gratuit).'],
  ['Accès privé à SSM, Secrets Manager, etc.', 'Des **VPC endpoints de type interface** (PrivateLink).'],
  ['Relier de nombreux VPC et le réseau sur site', '**AWS Transit Gateway** (le peering de VPC n\'est pas transitif).'],
  ['Voir le trafic accepté ou refusé dans un VPC', 'Les **VPC Flow Logs** (vers CloudWatch Logs ou S3).'],
  ['Envoyer chaque utilisateur vers la région la plus rapide', 'Route 53, routage **par latence** (géolocalisation : selon le pays).'],
  ['Pointer le domaine racine (exemple.com) vers un ALB', 'Un enregistrement **Alias** Route 53 (un CNAME est impossible à la racine).'],
  ['Diffuser du contenu statique rapidement dans le monde', '**Amazon CloudFront**, origine S3 protégée par OAC.'],
  ['Connexion privée et dédiée vers AWS', '**Direct Connect**. Le VPN site-à-site est chiffré sur Internet et plus rapide à mettre en place.'],
  ['ALB ou NLB ?', 'ALB : couche 7 (HTTP, routage par chemin ou hôte). NLB : couche 4 (TCP/UDP), très performant, IP fixe.'],
]
const AWS_CLI = [
  ['Quel compte et quel rôle j\'utilise ?', cmd('aws sts get-caller-identity')],
  ['Lister les ID des instances en cours d\'exécution', cmd('aws ec2 describe-instances \\\n  --filters Name=instance-state-name,Values=running \\\n  --query \'Reservations[].Instances[].InstanceId\' --output text')],
  ['Synchroniser un dossier local vers S3', cmd('aws s3 sync ./site s3://mon-bucket/')],
  ['Suivre les logs d\'une fonction Lambda en direct', cmd('aws logs tail /aws/lambda/ma-fonction --follow')],
  ['Exécuter « uptime » sur les instances taguées Env=prod (SSM)', cmd('aws ssm send-command --document-name AWS-RunShellScript \\\n  --targets Key=tag:Env,Values=prod --parameters commands=uptime')],
  ['Ouvrir une session sur une instance sans SSH', cmd('aws ssm start-session --target i-0123456789abcdef0')],
  ['Lire un paramètre chiffré de Parameter Store', cmd('aws ssm get-parameter --name /app/db/password --with-decryption')],
  ['Créer ou mettre à jour une pile CloudFormation', cmd('aws cloudformation deploy --template-file modele.yaml \\\n  --stack-name ma-pile --capabilities CAPABILITY_IAM')],
  ['Voir pourquoi une pile a échoué', cmd('aws cloudformation describe-stack-events --stack-name ma-pile')],
  ['Passer un groupe Auto Scaling à 4 instances', cmd('aws autoscaling set-desired-capacity \\\n  --auto-scaling-group-name mon-asg --desired-capacity 4')],
  ['Qui a supprimé un bucket ? (CloudTrail)', cmd('aws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket')],
]
const AWS_PANNES = [
  ['Une instance échoue au **contrôle d\'état système** : que faire ?', 'Problème côté matériel AWS : **arrêter puis démarrer** l\'instance (elle change d\'hôte) ou utiliser la récupération automatique. (Contrôle d\'état **instance** : problème dans l\'OS → redémarrer, logs, disque, mémoire.)'],
  ['Impossible de se connecter en SSH : que vérifies-tu ?', '1. Security group : port 22 depuis ton IP\n2. NACL : entrée ET sortie (ports éphémères)\n3. IP publique et route vers l\'Internet Gateway\n4. Paire de clés et utilisateur\nAlternative : Session Manager'],
  ['Une instance privée n\'accède pas à Internet', '1. Route 0.0.0.0/0 vers la NAT Gateway\n2. NAT Gateway dans un sous-réseau **public** (route vers l\'IGW)\n3. NACL'],
  ['L\'ALB renvoie 502, 503 ou 504', '503 : aucune cible saine (contrôles de santé). 502 : réponse invalide de la cible. 504 : délai dépassé.\nVérifier le chemin et le port du contrôle de santé, et que le security group des cibles autorise l\'ALB.'],
  ['AccessDenied sur S3 depuis une instance', '1. Politique du rôle de l\'instance\n2. Politique du bucket (un Deny ?)\n3. Objet chiffré par KMS : droit kms:Decrypt\n4. Politique du VPC endpoint'],
  ['Auto Scaling lance puis termine des instances en boucle', 'Contrôle de santé ELB qui échoue (chemin, délai de grâce trop court), user data en erreur, mauvaise AMI ou quota atteint.'],
  ['Pile CloudFormation en UPDATE_ROLLBACK_FAILED', 'Une ressource n\'a pas pu revenir en arrière (souvent modifiée à la main) : corriger la cause puis **Continue update rollback** (en ignorant la ressource si besoin).'],
  ['Une instance n\'apparaît pas dans Systems Manager', '1. Agent SSM installé et démarré\n2. Rôle IAM avec AmazonSSMManagedInstanceCore\n3. Accès réseau aux points de terminaison SSM (NAT ou VPC endpoints)'],
  ['Une instance T3 devient très lente', 'Crédits CPU épuisés (métrique CPUCreditBalance) : mode **unlimited**, type plus grand ou instance non « burstable ».'],
  ['Erreur InsufficientInstanceCapacity au lancement', 'Réessayer plus tard, changer d\'AZ ou de type d\'instance ; réserver de la capacité à l\'avance (capacity reservation).'],
  ['Une fonction Lambda est limitée (throttling)', 'La concurrence maximale est atteinte : réserver ou augmenter la concurrence, lisser avec une file SQS.'],
]
const AWS_LABOS = [
  ['Crée un bucket S3 avec le versioning activé (région eu-west-3).', cmd('aws s3api create-bucket --bucket mon-bucket-unique --region eu-west-3 \\\n  --create-bucket-configuration LocationConstraint=eu-west-3\naws s3api put-bucket-versioning --bucket mon-bucket-unique \\\n  --versioning-configuration Status=Enabled'), { vérif: 'aws s3api get-bucket-versioning --bucket mon-bucket-unique' }],
  ['Bloque tout accès public à ce bucket.', cmd('aws s3api put-public-access-block --bucket mon-bucket-unique \\\n  --public-access-block-configuration \\\n  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'), { vérif: 'aws s3api get-public-access-block --bucket mon-bucket-unique' }],
  ['Crée un topic SNS « alertes » et abonne ton adresse e-mail.', cmd('aws sns create-topic --name alertes\naws sns subscribe --topic-arn <arn-du-topic> \\\n  --protocol email --notification-endpoint toi@exemple.com'), { vérif: 'aws sns list-subscriptions-by-topic --topic-arn <arn-du-topic>' }],
  ['Crée une alarme : CPU moyen > 80 % pendant 2 × 5 min sur une instance, qui notifie « alertes ».', cmd('aws cloudwatch put-metric-alarm --alarm-name cpu-haut \\\n  --namespace AWS/EC2 --metric-name CPUUtilization \\\n  --dimensions Name=InstanceId,Value=<id-instance> \\\n  --statistic Average --period 300 --evaluation-periods 2 \\\n  --threshold 80 --comparison-operator GreaterThanThreshold \\\n  --alarm-actions <arn-du-topic>'), { vérif: 'aws cloudwatch describe-alarms --alarm-names cpu-haut' }],
  ['Enregistre un mot de passe chiffré /app/db/password dans Parameter Store.', cmd('aws ssm put-parameter --name /app/db/password --type SecureString --value \'S3cret!\''), { vérif: 'aws ssm get-parameter --name /app/db/password --with-decryption' }],
  ['Exécute « uptime » sur les instances taguées Env=dev avec Systems Manager.', cmd('aws ssm send-command --document-name AWS-RunShellScript \\\n  --targets Key=tag:Env,Values=dev --parameters commands=uptime'), { vérif: 'aws ssm list-command-invocations --command-id <id-commande> --details' }],
  ['Déploie une pile CloudFormation qui crée un bucket S3.', cmd('# bucket.yaml\nResources:\n  MonBucket:\n    Type: AWS::S3::Bucket\n\naws cloudformation deploy --template-file bucket.yaml --stack-name labo-bucket'), { vérif: 'aws cloudformation describe-stacks --stack-name labo-bucket' }],
  ['Fais un instantané d\'un volume EBS avec le tag Projet=labo.', cmd('aws ec2 create-snapshot --volume-id <id-volume> --description "avant mise à jour" \\\n  --tag-specifications \'ResourceType=snapshot,Tags=[{Key=Projet,Value=labo}]\''), { vérif: 'aws ec2 describe-snapshots --owner-ids self --filters Name=tag:Projet,Values=labo' }],
  ['Active les VPC Flow Logs d\'un VPC vers CloudWatch Logs.', cmd('aws ec2 create-flow-logs --resource-type VPC --resource-ids <id-vpc> \\\n  --traffic-type ALL --log-destination-type cloud-watch-logs \\\n  --log-group-name flowlogs --deliver-logs-permission-arn <arn-role>'), { vérif: 'aws ec2 describe-flow-logs' }],
  ['Passe un groupe Auto Scaling à 3 instances et regarde-les arriver.', cmd('aws autoscaling set-desired-capacity --auto-scaling-group-name mon-asg --desired-capacity 3'), { vérif: 'aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names mon-asg --query \'AutoScalingGroups[0].Instances\'' }],
]

// Frise : événements datés (jeux « remettre dans l'ordre » et « avant ou après »).
export const ÉVÉNEMENTS = [
  [496, 'Baptême de Clovis (vers 496)'], [800, 'Charlemagne couronné empereur'], [1429, 'Jeanne d\'Arc délivre Orléans'],
  [1515, 'Bataille de Marignan'], [1539, 'Ordonnance de Villers-Cotterêts : le français pour les actes officiels'], [1598, 'Édit de Nantes'],
  [1682, 'Louis XIV s\'installe à Versailles'], [1789, 'Prise de la Bastille, Déclaration des droits de l\'homme'], [1792, 'Proclamation de la Première République'],
  [1804, 'Napoléon sacré empereur'], [1848, 'Suffrage universel masculin, abolition de l\'esclavage'], [1870, 'Proclamation de la IIIe République'],
  [1882, 'École gratuite, laïque et obligatoire (lois Ferry)'], [1905, 'Loi de séparation des Églises et de l\'État'], [1914, 'Début de la Première Guerre mondiale'],
  [1918, 'Armistice du 11 novembre'], [1936, 'Front populaire : congés payés'], [1940, 'Appel du 18 juin du général de Gaulle'],
  [1944, 'Droit de vote des femmes'], [1945, 'Fin de la Seconde Guerre mondiale en Europe (8 mai)'], [1957, 'Traité de Rome'],
  [1958, 'Naissance de la Ve République'], [1962, 'Indépendance de l\'Algérie'], [1968, 'Mai 68'], [1974, 'Majorité à 18 ans'],
  [1981, 'Abolition de la peine de mort'], [1992, 'Traité de Maastricht'], [2002, 'L\'euro en pièces et billets'],
].map(([année, texte]) => ({ année, texte }))

// Carte : villes (latitude, longitude) et région dont elles sont le chef-lieu.
export const LIEUX = [
  ['Paris', 48.86, 2.35, 'Île-de-France'], ['Lyon', 45.76, 4.84, 'Auvergne-Rhône-Alpes'], ['Marseille', 43.30, 5.37, 'Provence-Alpes-Côte d\'Azur'],
  ['Toulouse', 43.60, 1.44, 'Occitanie'], ['Bordeaux', 44.84, -0.58, 'Nouvelle-Aquitaine'], ['Lille', 50.63, 3.06, 'Hauts-de-France'],
  ['Nantes', 47.22, -1.55, 'Pays de la Loire'], ['Strasbourg', 48.57, 7.75, 'Grand Est'], ['Rennes', 48.11, -1.68, 'Bretagne'],
  ['Dijon', 47.32, 5.04, 'Bourgogne-Franche-Comté'], ['Orléans', 47.90, 1.90, 'Centre-Val de Loire'], ['Rouen', 49.44, 1.10, 'Normandie'],
  ['Ajaccio', 41.93, 8.74, 'Corse'], ['Nice', 43.70, 7.27], ['Montpellier', 43.61, 3.88], ['Brest', 48.39, -4.49],
  ['Clermont-Ferrand', 45.78, 3.08], ['Le Havre', 49.49, 0.11], ['Grenoble', 45.19, 5.72], ['Mont-Saint-Michel', 48.64, -1.51],
  ['Mont Blanc', 45.83, 6.86],
].map(([nom, lat, lon, région]) => ({ nom, lat, lon, ...(région ? { région } : {}) }))

// Catégories affichées dans le dialogue « Paquets prêts ».
export const PAQUETS_PRÊTS = [
  {
    catégorie: 'DevOps — commandes', paquets: [
      { id: 'kubectl', nom: '☸️ kubectl', couleur: '#326ce5', cartes: KUBECTL },
      { id: 'docker', nom: '🐳 Docker', couleur: '#2496ed', cartes: DOCKER },
      { id: 'git', nom: '🔀 Git', couleur: '#f05032', cartes: GIT },
      { id: 'terraform', nom: '🏗️ Terraform', couleur: '#7b42bc', cartes: TERRAFORM },
      { id: 'linux', nom: '🐧 Linux', couleur: '#e0a100', cartes: LINUX },
      { id: 'helm', nom: '⛵ Helm', couleur: '#0f1689', cartes: HELM },
      { id: 'labos-cka', nom: '🧪 Labos CKA (pratique)', couleur: '#0b7a75', cartes: LABOS_CKA, labo: true },
      { id: 'pannes-k8s', nom: '🚑 Scénarios de panne', couleur: '#c62828', cartes: PANNES },
    ],
  },
  {
    catégorie: 'AWS CloudOps Engineer – Associate', paquets: [
      { id: 'aws-surveillance', nom: '📈 AWS · Surveillance et performance', couleur: '#ff9900', cartes: AWS_SURVEILLANCE },
      { id: 'aws-fiabilite', nom: '🛟 AWS · Fiabilité et continuité', couleur: '#e07b00', cartes: AWS_FIABILITÉ },
      { id: 'aws-deploiement', nom: '🚀 AWS · Déploiement et automatisation', couleur: '#c45500', cartes: AWS_DÉPLOIEMENT },
      { id: 'aws-securite', nom: '🔐 AWS · Sécurité et conformité', couleur: '#d13212', cartes: AWS_SÉCURITÉ },
      { id: 'aws-reseau', nom: '🌐 AWS · Réseau et diffusion', couleur: '#1f6feb', cartes: AWS_RÉSEAU },
      { id: 'aws-cli', nom: '⌨️ AWS CLI', couleur: '#232f3e', cartes: AWS_CLI },
      { id: 'aws-pannes', nom: '🚑 AWS · Scénarios de panne', couleur: '#b71c1c', cartes: AWS_PANNES },
      { id: 'aws-labos', nom: '🧪 Labos AWS (pratique)', couleur: '#0b7a75', cartes: AWS_LABOS, labo: true },
    ],
  },
  {
    catégorie: 'Naturalisation — un paquet par thème', paquets: [
      { id: 'nat-valeurs', nom: '🇫🇷 Valeurs et symboles', couleur: '#1f4fa3', cartes: VALEURS },
      { id: 'nat-institutions', nom: '🏛️ Institutions', couleur: '#5a6b8c', cartes: INSTITUTIONS },
      { id: 'nat-histoire', nom: '📜 Histoire de France', couleur: '#a3541f', cartes: HISTOIRE },
      { id: 'nat-geo', nom: '🗺️ Géographie et culture', couleur: '#2e7d4f', cartes: GÉOGRAPHIE },
      { id: 'nat-droits', nom: '⚖️ Droits et devoirs', couleur: '#6a4c93', cartes: DROITS },
      { id: 'nat-situations', nom: '🤝 Mises en situation', couleur: '#d1495b', cartes: SITUATIONS },
      { id: 'nat-actu', nom: '📰 Actualité (à vérifier)', couleur: '#455a64', cartes: ACTUALITÉ },
    ],
  },
  {
    catégorie: 'Français (niveau B2)', paquets: [
      { id: 'fr-connecteurs', nom: '🔗 Connecteurs et expressions', couleur: '#c2185b', cartes: CONNECTEURS },
      { id: 'fr-oral', nom: '🗣️ Sujets d\'oral', couleur: '#8e24aa', cartes: ORAL, oral: true },
    ],
  },
]

// Connecteurs repérés dans une réponse orale (pour le bilan de l'oral).
export const CONNECTEURS_ORAL = ['tout d\'abord', 'd\'abord', 'ensuite', 'puis', 'enfin', 'de plus', 'en outre', 'par ailleurs', 'cependant', 'pourtant', 'néanmoins', 'en revanche', 'alors que', 'bien que', 'parce que', 'puisque', 'étant donné', 'grâce à', 'donc', 'c\'est pourquoi', 'par conséquent', 'afin de', 'afin que', 'pour que', 'à mon avis', 'selon moi', 'il me semble', 'en somme', 'pour conclure', 'en conclusion', 'd\'un côté', 'de l\'autre', 'certes', 'par exemple', 'notamment']

// Ajoute (ou complète) des paquets prêts dans des données Mémoriser.
// `uid` : fonction, ou préfixe (identifiants stables, pour appliquer le même
// changement à la copie de l'appareil et à GitHub sans doublons).
export function ajouterPaquetsPrêts(d, ids, uid, auj) {
  const modèles = PAQUETS_PRÊTS.flatMap(c => c.paquets).filter(m => ids.includes(m.id))
  const stable = typeof uid === 'string'
  let paquets = d.paquets || [], cartes = d.cartes || []
  modèles.forEach(m => {
    let paquet = paquets.find(p => p.modèle === m.id)
    if (!paquet) { paquet = { id: stable ? `${uid}${m.id}` : uid(), nom: m.nom, couleur: m.couleur, modèle: m.id, ...(m.oral ? { oral: true } : {}), ...(m.labo ? { labo: true } : {}) }; paquets = [...paquets, paquet] }
    const rectos = new Set(cartes.filter(c => c.paquetId === paquet.id).map(c => c.recto))
    cartes = [...cartes, ...m.cartes.map((c, k) => [c, k]).filter(([[r]]) => !rectos.has(r)).map(([[recto, verso, extra], k]) => ({ id: stable ? `${paquet.id}-${k}` : uid(), paquetId: paquet.id, recto, verso, niveau: 0, prochaineRevision: auj, ...(extra || {}) }))]
  })
  return { ...d, paquets, cartes }
}
