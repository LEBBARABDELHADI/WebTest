# Formation « Learning Jenkins » (contenu en anglais)

Accueil › tuile **Learning Jenkins**. Lien direct : `#/jenkins/perso`.

C'est une formation progressive, du niveau débutant au niveau expert, en **13 modules** précédés d'un **Lab 0**. Sa structure s'inspire de « Learning Ansible ». Chaque module contient :
- des objectifs ;
- des concepts expliqués avant d'être utilisés ;
- des schémas et de **vraies captures** de Jenkins ;
- des commandes et leur **sortie réelle** ;
- des TP corrigés ;
- les erreurs fréquentes ;
- un récapitulatif, un quiz et une checklist de validation.

## Ce qui est disponible

| Partie | Statut |
|---|---|
| Plan général (13 modules) | Objectifs, sujets et TP de chaque module |
| **Lab 0 — Run Jenkins locally** | Rédigé : Docker Compose, déverrouillage, plugins, administrateur, premier job, exploitation, dépannage |
| **Module 1 — Introduction to Jenkins** | Rédigé : CI/CD, comparatif des outils, architecture, contrôleur et agents, Jenkins + Ansible, 2 TP, 3 exercices, quiz de 10 questions |
| **Module 2 — Installation and configuration** | Rédigé : prérequis, choix de la méthode, apt + systemd (override), VM Vagrant, plugins, agent WebSocket et 0 exécuteur sur le contrôleur, contrôleur « production » (plugins.txt + JCasC + secrets Docker), utilisateurs et matrice, Nginx HTTPS, CSP, 9 erreurs réelles, 5 TP, 3 exercices, quiz |
| **Module 3 — Mastering the Jenkins UI** | Rédigé : tableau de bord (statuts, météo, file d'attente, exécuteurs), vues, New Item, job Freestyle `build-report` section par section, builds suivis, interrompus et en échec, console horodatée, paramètres et API REST avec jeton, variables d'environnement, credentials et limites du masquage, 3 TP, 3 exercices, quiz |
| **Module 4 — Jenkins Pipeline** | Rédigé : pipeline as code, Declarative vs Scripted, anatomie d'un Jenkinsfile, variables et guillemets, paramètres, `when`, `input`, gestion d'erreurs (`post`, `try/catch`, `catchError`, `retry`, `timeout`), artefacts, `stash`, rapports JUnit, générateurs de syntaxe, Replay, Restart from Stage, 2 TP, 2 exercices, quiz |
| **Module 5 — Git integration** | Rédigé : serveur Gitea 28.4.0 dans le labo, compte robot et jeton, Pipeline script from SCM, GitHub/GitLab/Bitbucket (plugins et URL de webhook vérifiées), webhook réel (échec par la politique de sortie de Gitea 28 puis correction), multibranche, GitFlow, pull requests et statuts de commit, 3 TP, 2 exercices, quiz |
| **Module 6 — Continuous Integration** | Rédigé : image d'agent CI (Java 21, Maven, Node.js 26, Python 3.13, OSV-Scanner), trois projets réels (Java/Maven, Node.js, Python) en multibranche, rapports de tests et de couverture, Checkstyle/ESLint/flake8 avec quality gates, analyse de dépendances, artefacts versionnés, publication Maven vers le registre de paquets de Gitea, 10 erreurs réelles, 4 TP, 1 exercice, quiz |
| **Module 7 — Jenkins and Docker** | Rédigé : démon Docker-in-Docker 29.10.0 en TLS mutuel dans le labo, CLI Docker dans l'agent, plugin Docker Pipeline, service `lab/stock-service` (Dockerfile CI, test de conteneur par HEALTHCHECK, étiquettes version/commit/latest, publication dans le registre de Gitea, déploiement en staging), connexion au registre sans laisser de jeton, Docker Hub (variante non exécutée, signalée), job de nettoyage, 10 erreurs réelles, 4 TP, 1 exercice, quiz |
| **Module 8 — Jenkins and Kubernetes** | Rédigé : cluster kind (Kubernetes 1.37) dans le labo, comptes de service à privilèges minimaux, plugin Kubernetes et agents en pods, dépôt de déploiement avec manifestes puis chart Helm 4, disponibilité mesurée pendant les mises à jour (5 échecs sans `preStop`, 0 avec), retours arrière automatiques (kubectl puis Helm), canary réel (49/200), 9 erreurs réelles, 4 TP, 1 exercice, quiz |
| **Module 9 — Credentials and security** | Rédigé : types, portées et magasins d'identifiants, chiffrement sur disque, déploiement SSH vers `web-1` avec clé d'hôte épinglée et vérifiée, jetons de comptes robots, audit d'un pipeline qui divulgue un faux secret de cinq façons (base64 masqué par Jenkins, inversion, extrait et artefact non masqués), identifiants limités à un dossier, matrice d'autorisations, sandbox Groovy et approbation refusée, liste de durcissement, 3 TP, 1 exercice, quiz |
| **Module 10 — Jenkins and DevOps tools** | Rédigé : Ansible (SSH vers deux serveurs, clé épinglée, `become`, limite réelle du mode check), Terraform (état verrouillé dans le cluster, RBAC avec `bind` explicite, approbation humaine, dérive détectée, verrou d'état concurrent réel), SonarQube (jeton et webhook, quality gate qui bloque et avorte pour de vrai, échec puis correctif par un test — pas un seuil), Nexus (compte `jenkins-deployer` à moindre privilège, EULA bloquant même `admin`), Prometheus/Grafana (scrape de `/prometheus/`, tableau de bord provisionné par API), Artifactory documenté sans être exécuté, GitHub/GitLab en comparaison avec Gitea, 3 TP, 1 exercice, quiz |
| **Module 11 — End-to-end CI/CD case studies** | Rédigé : 5 TP qui chaînent les modules 6 à 10 dans de vrais Jenkinsfiles — Java (build + test + quality gate qui bloque + publish Nexus, un seul pipeline), Docker (scan de dépendances + build + scan d'image + push registre), Kubernetes (un CI qui déclenche son propre CD avec `build job: ... wait: true`), Ansible (`host_vars` propre à un serveur, prouvé par une vraie config nginx différente), DevSecOps (scan de dépendances + scan d'image Trivy + gate `error()` qui lirait vraiment le résultat). Docker Hub documenté sans être exécuté (pas de compte). 5 TP, quiz de 10 questions |
| **Module 12 — Administration and operations** | Rédigé : un deuxième agent SSH (`ops-1`, son propre volume de clé d'hôte) mis hors ligne pour maintenance avec une vraie file d'attente qui réagit, une sauvegarde scoped de JENKINS_HOME prouvée par une restauration réelle sur une instance jetable (API vérifiée : jobs, nœuds, plugins, un build relu), un enregistreur de logs réel, une vraie mise à jour de plugin avec un vrai Safe Restart, de vraies métriques Prometheus sous charge (jauge vs histogramme), un vrai avertissement d'espace disque provoqué puis annulé. Support Bundle documenté sans être généré (plugin absent, pas d'accès internet). 2 TP, 1 exercice, quiz de 10 questions |
| Module 13 | Annoncé (« Coming next ») avec son plan, rédigé ensuite |

## Les captures sont réelles

Les 22 captures viennent d'un vrai **Jenkins 2.580.2 LTS** (image officielle `jenkins/jenkins:2.580.2-lts-jdk21`, Java Temurin 21.0.13), le 17 novembre 2026 :
- Jenkins a été démarré avec le `docker-compose.yml` du Lab 0.
- L'assistant d'installation a été suivi pas à pas : déverrouillage, plugins suggérés (92 plugins installés), compte administrateur, URL.
- Les jobs `hello-jenkins` et `hello-pipeline` ont ensuite été créés et lancés, exactement comme dans les TP.
- Prise de vue : Playwright, fenêtre de 1280×800 à 1,5×, JPEG.
- Les **repères numérotés** sont des cadres mesurés sur les éléments de la page Jenkins au moment de la capture. Ils sont superposés par la formation, jamais dessinés dans l'image.
- Les **schémas** sont signalés « Diagram — an illustration, not a Jenkins screenshot ».
- Les sorties de commandes (`docker compose up`, journaux, `initialAdminPassword`, console des builds, `ls` de JENKINS_HOME, sauvegarde, port déjà utilisé) sont réelles. Les identifiants, mots de passe et durées diffèrent sur une autre machine.

### Module 2 : trois environnements réels

- Le **contrôleur du Lab 0**, enrichi pas à pas : plugin Configuration as Code, nœud `agent-1` (image `jenkins/inbound-agent:3395.v6e5377b_0fb_3c-5-jdk21`, WebSocket), 0 exécuteur sur le nœud intégré, utilisateurs `alice`/`bob` et matrice des droits (plugin Matrix Authorization 3.3), proxy Nginx 1.30.6 en HTTPS (captures prises par `https://localhost:8443`).
- Une machine **Ubuntu 24.04.5** avec systemd pour l'installation par apt (dépôt `debian-stable`, clé `jenkins.io-2026.key`) : c'est un conteneur systemd, faute d'hyperviseur sur la machine de capture. La formation le dit, et la ligne `CGroup:` le montre. Le script `install-jenkins.sh` de la VM Vagrant a été exécuté tel quel sur une Ubuntu neuve (code de sortie 0). Le démarrage de la VM Vagrant elle-même n'a pas pu être capturé.
- Un **contrôleur « production »** sur le port 8081, construit depuis `Dockerfile` + `plugins.txt` (74 plugins avec les dépendances) + `casc.yaml` + un secret Docker. Ses captures portent l'image `lab/jenkins-casc:2.580.2`.

Les blocs de code du module 2 sont **générés depuis les fichiers réellement exécutés** (et non recopiés). Les erreurs réelles rencontrées sont reprises en dépannage : secret illisible par l'uid 1000, faute de frappe JCasC, port déjà pris, volume monté sans droits, Java 17, mauvais secret d'agent, proxy inverse mal réglé.

### Module 3 : le job `build-report`, construit pour de vrai

27 captures du contrôleur du labo pendant la construction du job Freestyle `build-report` : paramètres, label `linux`, variable globale `COMPANY`, identifiant secret `report-api-token` (valeur factice, jamais affichée : masquée dans les captures, absente du contenu, vérifié par les tests), archive des rapports. Sept builds réels : interface, `curl` avec un jeton d'API, un build interrompu (« Aborted by Lab Admin »), un build en échec (`VERSION=1.x`). Le piège réel des artefacts périmés (espace de travail réutilisé) est montré puis corrigé avec *Delete workspace before build starts*. Les erreurs du dépannage ont été reproduites : label inexistant, POST sans crumb (403), jeton invalide (401), secret inversé non masqué.

### Module 4 : cinq Jenkinsfiles exécutés

Cinq Jenkinsfiles de complexité croissante, leur version Scripted et deux versions cassées ont tourné sur le labo (jobs `pipeline-*`). Le code affiché est généré depuis ces fichiers, et les sorties console sont insérées depuis les vrais journaux (`redaction/assembler.py` dans le bac à sable). Faits réels mis en avant : avertissement « A secret was passed to "sh" using Groovy String interpolation », variables d'environnement vides au premier build d'un pipeline paramétré, ordre fixe des conditions `post`, erreurs de compilation (`Unknown stage section "sh"`, `expecting anything but ''\n''`).

### Module 5 : Gitea et Jenkins pour de vrai

Le labo gagne un service `gitea` (image `docker.gitea.com/gitea:28.4.0`) et le dépôt `lab/inventory` (main, develop, release/1.1, feature/stock-alerts en pull request). Les captures marquées *Gitea 28.4.0* montrent Gitea lui-même. Faits réels repris dans le cours : *Manage hooks* ne crée pas le webhook tant que l'URL de Jenkins est `localhost` ; Gitea 28 refuse les adresses privées (« denied by egress policy ») tant que `[security].ALLOWED_HOST_LIST` ne les autorise pas (l'ancienne option `[webhook]` est dépréciée, un nom d'hôte ne suffit pas) ; `BRANCH_NAME` vaut `null` hors multibranche ; `CHANGE_AUTHOR` reste vide avec la source Gitea. Le scénario du TP 5.3 (commit cassant puis revert) a été joué : contrôle rouge puis vert dans la pull request.

Particularité de la machine de capture : ses connexions HTTPS passent par un proxy qui réinspecte TLS. Java, dans le conteneur, a donc reçu un magasin de certificats complété par un fichier Compose séparé, absent de la formation. Le message réel obtenu sans ce réglage, `PKIX path building failed`, figure dans le dépannage du Lab 0, avec la correction à appliquer en entreprise.

### Module 6 : trois chaînes d'intégration continue exécutées

Les dépôts `lab/stock-api`, `lab/stock-web` et `lab/stock-py` ont été poussés dans Gitea et construits par des jobs multibranches déclenchés par un webhook d'organisation. Les échecs montrés sont ceux qui se sont réellement produits, dans l'ordre : objectif de rapport `checkstyle:checkstyle` en échec (habillage de site non téléchargeable), avertissement Checkstyle → UNSTABLE puis correction, baisse de couverture révélant un cas non testé, test en échec (FAILURE) puis `-Dmaven.test.failure.ignore=true` (UNSTABLE), rapport flake8 périmé conservé dans l'espace de travail (reproduit), dépendances transitives non épinglées résolues autrement par le scanner, exceptions OSV documentées (`effectiveUntil`, l'ancien `ignoreUntil` produisant un avertissement), quality gate de couverture à 95 %, publication `mvn deploy` avec un jeton limité aux paquets, et `409 Conflict` en republiant une version.

Particularités de la machine de capture, absentes de la formation : l'agent y est construit par un `Dockerfile.sandbox` qui copie l'archive de Node.js et un binaire OSV-Scanner compilé localement (`go install github.com/google/osv-scanner/v2/cmd/osv-scanner@v2.7.1`), car github.com n'y est pas joignable ; Java et Node.js y reçoivent le certificat du proxy TLS. Le `Dockerfile` du cours télécharge ces fichiers depuis leurs sites officiels.

### Module 7 : Docker piloté par Jenkins, pour de vrai

Le labo gagne un service `docker` (`docker:29.10.0-dind`, privilégié, TLS mutuel sur 2376, volume des espaces de travail partagé avec agent-1) et l'image d'agent `lab/build-agent:2` (CLI Docker et buildx copiés de `docker:29.10.0-cli`). Les sept versions du Jenkinsfile de `lab/stock-service` ont été poussées dans l'ordre, et chaque problème montré s'est produit : `Bad substitution` (dash), jeton laissé dans `~/.docker/config.json`, mot de passe en argument avec `withDockerRegistry`, collision de noms de conteneurs entre deux branches au build n°1, image au mauvais port arrêtée par le contrôle de santé, premier lancement du job de nettoyage sans paramètre. Les erreurs « HTTP response to HTTPS client », « Cannot connect to the Docker daemon » et « Client sent an HTTP request to an HTTPS server » ont été reproduites. La publication sur Docker Hub est présentée comme variante non exécutée (elle demande un compte).

Particularités de la machine de capture, absentes de la formation : le démon dind y reçoit en plus `--registry-mirror=https://mirror.gcr.io` (limite de débit de Docker Hub) et le certificat du proxy TLS, par `docker-compose.override.yml`.

### Module 8 : un vrai cluster Kubernetes dans le labo

Le cluster `lab` a été créé avec kind 0.33.0 (nœud `kindest/node:v1.37.0`), relié au réseau du labo, et containerd y accepte le registre HTTP de Gitea. Jenkins s'y connecte avec le jeton du compte `jenkins` (pods de `jenkins-agents` seulement) ; les pods de déploiement tournent sous `deployer` (rôle `edit` dans `stock` seulement), droits vérifiés par `kubectl auth can-i`. Chaque échec montré s'est produit, dans l'ordre : URL de Jenkins absente (les pods visent `localhost`), commentaire `#` dans le Groovy, premier lancement sans paramètre, `runAsNonRoot` avec un utilisateur non numérique, 5 requêtes perdues sur 376 pendant une mise à jour progressive (corrigé par `preStop` : 422/422), version inexistante (482/482 requêtes servies, retour arrière automatique), reprise refusée par Helm (« invalid ownership metadata »), échec Helm annulé par `--rollback-on-failure`. Le canary (1 pod sur 4) a reçu 49 requêtes sur 200.

Particularités de la machine de capture, absentes de la formation : elle est en cgroup v1 et n'accorde pas `CAP_SYS_RESOURCE` ; le cluster y est donc créé avec `kind/cluster.sandbox.yaml` (`failCgroupV1: false`, `restrict_oom_score_adj = true`), sans les variables de proxy de l'hôte, avec un miroir de Docker Hub et l'autorité du proxy TLS pour containerd (`kind/sandbox-up.sh`). Le `cluster.yaml` du cours est celui d'une machine ordinaire.

### Module 9 : des fuites de secrets observées, pas supposées

Le labo gagne `web-1` (`jenkins/ssh-agent:9.5.0-jdk21`, clé publique de déploiement lue dans `.env`). Les secrets utilisés pour les démonstrations de fuite sont faux et créés pour l'occasion (`leak-demo-token`, `team-stock-token`). Le comportement réel a corrigé une idée reçue : Jenkins masque aussi la forme base64 d'un secret (`****Qo=`), alors que la valeur inversée, un extrait et le fichier archivé fuient bien ; le commentaire du pipeline a été corrigé et le pipeline relancé pour que code et journal concordent. La signature `new java.io.File` demandée par `sandbox-demo` a été refusée dans la page d'approbation après la capture. Deux captures du module 2 (matrice, accès refusé) sont reprises telles quelles.

### Module 10 : six outils, six pipelines réels

Le labo gagne six services : `app-1`/`app-2` (image `lab/managed-node:1`, SSH + Python 3 + sudo, comme deux VM) pour Ansible, `sonarqube`/`sonarqube-db` (SonarQube Community Build 26.11, PostgreSQL 17), `nexus` (Nexus Repository 3.98.1 OSS), `prometheus`/`grafana` (Prometheus 3.16, Grafana 13.3.1). L'agent reçoit Ansible-core 2.22 (venv) et Terraform 1.17 (somme de contrôle vérifiée). **Ansible** : clé dédiée, empreintes d'hôte comparées puis épinglées, `become` ajouté après un vrai refus `Permission denied`, `force: true` ajouté après un vrai refus du mode `--check`. **Terraform** : état verrouillé dans le cluster (Secret + Lease) ; le premier `apply` a échoué sur les RoleBindings (`is attempting to grant RBAC permissions not currently held`) après avoir déjà créé les deux namespaces, quotas et limites — la correction (`bind` explicite sur le ClusterRole nommé) n'a donc laissé que 2 ressources à ajouter, pas 8 ; un deuxième bug réel (`-backend=false` réutilisant le backend du build précédent) a aussi été corrigé ; un plan de dérive et un verrou d'état concurrent (un second client `terraform apply` lancé exprès) ont été capturés tels quels. **SonarQube** : jeton d'analyse et secret de webhook, refusé une première fois par SonarQube lui-même (« not allowed for webhooks » sur une adresse privée, assoupli volontairement pour ce labo) ; `waitForQualityGate(abortPipeline: true)` a réellement bloqué puis avorté un build (nouvelle classe non testée, 0 % de couverture sur le code neuf), corrigé en écrivant les tests manquants — jamais en baissant un seuil. Deux particularités réelles de SonarQube sont documentées : les petits changements sont dispensés des conditions de couverture/duplication sur le code neuf, et un commit qui n'ajoute que des tests n'a simplement rien de nouveau à couvrir. **Nexus** : compte `jenkins-deployer` limité à `add`/`browse`/`read` sur `maven-releases` (suppression vérifiée refusée) ; un vrai mur inattendu — même `admin` recevait 403 sur tout envoi tant que l'accord de licence (EULA) de cette édition Community n'était pas accepté, via l'assistant ou l'API REST. **Prometheus/Grafana** : cible réellement scrapée sur `/prometheus/`, tableau de bord provisionné par l'API Grafana (« dashboard as code »). **Artifactory** est documenté (tableau comparatif, étape Jenkinsfile plausible) sans être exécuté — il demanderait un compte JFrog. **GitHub/GitLab** sont comparés à Gitea (plugins de branche, signature des webhooks, API de statut) sans connexion réelle — `github.com` n'est pas joignable depuis cette machine. 3 TP, 1 exercice, quiz de 10 questions.

### Module 11 : cinq cas pratiques, zéro nouvel outil

Aucun service ni plugin n'est ajouté au labo : les 5 TP ne font que chaîner, dans de vrais Jenkinsfiles, ce que les modules 6 à 10 avaient déjà construit séparément. **Lab 11.1 (Java)** : `stock-api` reçoit un `Jenkinsfile.e2e` qui enchaîne build, test, `waitForQualityGate(abortPipeline: true)` (serveur `sonarqube-lab` du module 10), puis package et publish Nexus — dans cet ordre, dans un seul pipeline. Le deuxième run a reçu un vrai 403 Nexus : publier une deuxième version du même artefact réécrit `maven-metadata.xml`, un fichier existant, qui demande `edit` et pas seulement `add` — le même constat que le correctif du module 10, retrouvé ici en conditions réelles. **Lab 11.2 (Docker)** : `stock-service` garde son vrai push vers le registre Gitea ; le push Docker Hub équivalent est écrit, commenté et clairement marqué « Not run in this lab » — ce labo n'a pas de compte Docker Hub. **Lab 11.3 (Kubernetes)** : la dernière étape du même pipeline est `build job: 'stock-deploy', parameters: [...], wait: true` — un CI qui déclenche vraiment son CD, sans webhook ni personne qui clique, et attend son résultat avant de se dire lui-même terminé (capturé : `stock-deploy #14` démarré puis `SUCCESS` avant la fin de `stock-service-e2e #2`). **Lab 11.4 (Ansible)** : un fichier `host_vars/app-2.yml` donne un `site_root` différent de celui du groupe, sans toucher à `site.yml` ni écrire un seul `if` — la preuve est une vraie config nginx différente sur les deux serveurs après le même déploiement (`grep root` : `/var/www/stock-web/current` sur `app-1`, `/var/www/stock-web-canary/current` sur `app-2`). **Lab 11.5 (DevSecOps)** : OSV-Scanner sur le code source de `stock-service` (« no packages found », exact puisque le projet ne déclare aucune dépendance) puis Trivy sur l'image construite (7 HIGH, 0 CRITICAL — dans l'outillage npm embarqué par l'image de base Node.js, jamais dans le code de l'application), et une étape `script` qui compte les CRITICAL et appellerait `error()` si ce compte n'était pas nul — jamais déclenchée ici puisque le compte réel est resté à zéro à chaque run, mais lisible telle quelle dans le Jenkinsfile. Quiz de 10 questions.

### Module 12 : administrer, pas seulement construire

Un seul nouveau conteneur gagné par le labo : `ops-1`, un deuxième agent SSH avec son propre volume pour `/etc/ssh` — sans lui, un redémarrage régénère une clé d'hôte neuve et casse l'épinglage côté Jenkins (constaté pour de vrai pendant la construction de ce module, sur un redémarrage réel de l'environnement). **Lab 12.1** : identifiant dédié (`ops-agent`, jamais celui du module 9), nœud étiqueté `maintenance-pool`, empreinte comparée avant épinglage. Mis hors ligne avec une vraie raison, un pipeline restreint à l'étiquette se met en file (`‘ops-1’ is offline`, lu dans la vraie API de la file) au lieu d'échouer, puis s'exécute normalement une fois le nœud remis en ligne. **Lab 12.2** : un pipeline de sauvegarde, exécuté sur le contrôleur lui-même, archive un sous-ensemble volontairement restreint de `JENKINS_HOME` (config, jobs, utilisateurs, credentials, nœuds, plugins — jamais les workspaces ni les caches) : 296 Mo réels. La preuve n'est pas que le job réussit, mais qu'une deuxième instance Jenkins jetable, démarrée sur un volume neuf avec l'archive extraite avant son premier démarrage, retrouve réellement 38 jobs, 3 nœuds et 113 plugins, vérifiés par sa propre API REST — puis est détruite. **Logs** : un enregistreur ciblé sur `hudson.model.Queue` en `FINE` capture la ligne réelle marquant l'entrée d'un job en file ; un Support Bundle complet n'a pas pu être généré (plugin `support-core` absent, pas d'accès internet pour l'installer) — documenté comme tel, la page System Information servant de repli honnête. **Plugins** : le vrai centre de mise à jour de cette instance a signalé une mise à jour du plugin Coverage (celui dont dépend déjà le module 6) ; mise à jour réelle (`4.3583...` → `4.3620...`), Safe Restart réel qui attend la fin de l'installation et des builds en cours, les trois nœuds se reconnectant seuls. **Performance** : en réutilisant Prometheus/Grafana du module 10, `agent-1` ramené à 1 exécuteur puis saturé par 3 builds simultanés montre une vraie jauge `default_jenkins_executors_busy` à 1.0 et un histogramme `jenkins_queue_size_history` qui garde la trace du pic après que la jauge instantanée est déjà retombée à zéro — une vraie nuance jauge/histogramme, pas une approximation. **Espace disque** : le seuil réel du moniteur de disque, relevé volontairement au-dessus de l'espace libre réel (7,23 Gio), déclenche un vrai avertissement d'administration avec les deux chiffres exacts dans le message — puis est annulé. 2 TP, 1 exercice, quiz de 10 questions.

## Jenkins Basics : la formation courte (2 h)

Un second bouton de l'accueil, **Jenkins Basics** (`/jenkins-basics/:espace`), ouvre une formation de deux heures pour grands débutants, en neuf étapes chronométrées (10 à 25 min, 120 min au total) : ce que fait Jenkins, installation Docker, tour de l'interface, premier job Freestyle, premier pipeline (lancé, cassé, réparé), pipelines depuis Git et webhooks, tests, artefacts et résultats, credentials, puis récap, quiz et checklist. Tout ce qui s'y lance fonctionne sur le seul Jenkins du Lab 0 (`agent any`).

Réutilisation : `src/lib/jenkins/basics.js` ne recopie rien à la main. Des fonctions (`capture`, `commande`, `code`, `schéma`, `tableau`, `glossaire`, `erreurs`) vont chercher les blocs dans `lab0.js` et les modules 1, 3, 4 et 5 — mêmes captures, mêmes sorties réelles, mêmes explications ligne par ligne — et échouent au chargement si un bloc disparaît ; `adapter` remplace seulement les renvois internes (« Module 1 » → « lesson 1.2 »). Trois petits pipelines propres à la formation (`basics-fail`, `basics-tests`, `basics-secret`) et un job Freestyle en échec ont été exécutés pour de vrai ; les pipelines l'ont été sur le nœud intégré, comme dans un Lab 0 neuf (agent-1 mis hors ligne le temps des essais, puis remis en service), et cinq captures `bas-*` en proviennent. Le plan léger est dans `basics-plan.js`, le contenu est chargé à la demande ; la progression est gardée sous `react-blocs-jenkins-basics`.

## Architecture

```
src/pages/Jenkins.jsx                  page : plan, navigation, progression (localStorage react-blocs-jenkins)
src/components/jenkins/Blocs.jsx       rendu des blocs : texte, tableaux, code expliqué ligne par ligne, commandes + sorties,
                                       captures avec repères, TP/exercices avec corrigé, erreurs, quiz, checklist, récap
src/components/jenkins/Schemas.jsx     schémas SVG (lab, boucle DevOps, CI/CD, architecture, vie d'un build, entreprise, Jenkins + Ansible)
src/lib/jenkins/plan.js                les 14 parties (Lab 0 + 13 modules) et l'environnement du lab
src/lib/jenkins/lab0.js · moduleN.js  le contenu, sous forme de blocs (un fichier chargé à la demande par module)
src/lib/jenkins/captures.json          manifeste des captures : fichier, page Jenkins, repères (en % de l'image)
public/jenkins/*.jpg                   les captures (chargées à la demande ; un champ `outil` signale celles d'un autre outil que Jenkins)
```

Pour ajouter un module :
1. Écrire `src/lib/jenkins/moduleN.js`.
2. L'ajouter à `CHARGEURS` dans `Jenkins.jsx` (import dynamique : un fichier JS par module).
3. Passer `disponible: true` dans `plan.js`.
4. Ajouter ses captures dans `public/jenkins` et dans le manifeste.

## Vérifications

- `npm run test:jenkins` vérifie :
  - que chaque capture citée existe, avec son image, sa légende en 5 parties et des repères dans l'image ;
  - que chaque schéma cité est dessiné ;
  - que les blocs sont valides : titres uniques, explications de lignes dans les bornes du code, TP et exercices avec corrigé ;
  - que le `docker-compose.yml` du Lab 0 est un YAML valide et cohérent avec l'image des captures ;
  - que le pipeline du Module 1 concorde avec sa sortie réelle ;
  - que le contenu est rédigé en anglais.
- Playwright, sur téléphone (375 px) et PC (1366 px), soit 50 contrôles :
  - tuile d'accueil et plan ;
  - Lab 0 : images chargées, repères, zoom ;
  - explication de ligne ;
  - checklist conservée après rechargement ;
  - module marqué terminé ;
  - corrigé d'un TP et quiz ;
  - plan d'un module à venir ;
  - aucun débordement horizontal, aucune requête hors du site.
