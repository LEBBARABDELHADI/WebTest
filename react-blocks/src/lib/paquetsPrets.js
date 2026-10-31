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
    ],
  },
  {
    catégorie: 'Naturalisation — un paquet par thème', paquets: [
      { id: 'nat-valeurs', nom: '🇫🇷 Valeurs et symboles', couleur: '#1f4fa3', cartes: VALEURS },
      { id: 'nat-institutions', nom: '🏛️ Institutions', couleur: '#5a6b8c', cartes: INSTITUTIONS },
      { id: 'nat-histoire', nom: '📜 Histoire de France', couleur: '#a3541f', cartes: HISTOIRE },
      { id: 'nat-geo', nom: '🗺️ Géographie et culture', couleur: '#2e7d4f', cartes: GÉOGRAPHIE },
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
