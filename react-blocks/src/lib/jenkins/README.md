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
| Modules 5 à 13 | Annoncés (« Coming next ») avec leur plan, rédigés un par un, dans l'ordre |

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

Particularité de la machine de capture : ses connexions HTTPS passent par un proxy qui réinspecte TLS. Java, dans le conteneur, a donc reçu un magasin de certificats complété par un fichier Compose séparé, absent de la formation. Le message réel obtenu sans ce réglage, `PKIX path building failed`, figure dans le dépannage du Lab 0, avec la correction à appliquer en entreprise.

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
