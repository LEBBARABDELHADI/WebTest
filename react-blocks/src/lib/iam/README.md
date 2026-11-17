# Outil « Règle IAM »

React Blocs › *Outils DevOps* › **🔑 Règle IAM**. Lien direct : `#/outils/pro?outil=iam`.

Il sert à **créer une politique IAM d'AWS** (la « règle » qui dit qui peut faire quoi), sans la deviner : on la décrit, on la construit ou on la colle, puis l'outil la **valide avec les vraies données d'AWS**, la **simule** et l'**exporte**.

Tout se passe dans le navigateur : rien n'est envoyé, aucune IA externe n'est appelée.

## Types de politique

| Type | Principal | Resource | Exemple |
|---|---|---|---|
| Identité | interdit | requise | ce qu'un utilisateur, un groupe ou un rôle peut faire |
| Ressource | requis | requise | politique de bucket S3, de file SQS, de topic SNS, de clé KMS |
| Approbation (*trust policy*) | requis | interdite | qui peut assumer un rôle (service, compte, GitHub Actions, EKS, SAML) |
| Plafond (*permissions boundary*) | interdit | requise | limite maximale des droits d'une identité |
| SCP | interdit | requise | garde-fou d'AWS Organizations |

Le type peut être déduit de la description (« Automatique »).

## Utilisation

**1 · Décrire** : en français ou en anglais, ou en collant un message d'erreur `AccessDenied`.

| Vous écrivez | Vous obtenez |
|---|---|
| `Lecture seule sur le bucket S3 mon-bucket` | `s3:GetObject`, `s3:GetObjectVersion` sur `arn:aws:s3:::mon-bucket/*` ; `s3:GetBucketLocation`, `s3:ListBucket` sur `arn:aws:s3:::mon-bucket` |
| `Démarrer et arrêter les instances EC2 taguées Environment=dev depuis 203.0.113.0/24 avec MFA` | `ec2:StartInstances`, `ec2:StopInstances` + conditions `aws:ResourceTag/Environment`, `aws:SourceIp`, `aws:MultiFactorAuthPresent` |
| `Interdire en dehors de eu-west-3 et eu-west-1` | un `Deny` + `NotAction` (services mondiaux exclus) + `StringNotEquals aws:RequestedRegion` |
| `Rôle assumable par GitHub Actions pour le dépôt monorg/monrepo sur la branche main` | trust policy OIDC avec `aud` et `sub` |
| `Autoriser le compte 123456789012 à lire le bucket S3 partage et exiger HTTPS` | politique de bucket (Principal) + `Deny` si `aws:SecureTransport` est faux |
| `User: arn:… is not authorized to perform: s3:GetObject on resource: "arn:…"` | la règle exacte qui manque |

Les hypothèses faites sont listées (« Région et compte non précisés : * »), ainsi que ce qui n'est pas compris. Rien n'est inventé.

**2 · Politique** : trois vues sur le même JSON.
- **🧱 Constructeur** : une carte par déclaration. Effet, Sid, principal, actions (saisie libre ou **parcours des services** avec niveaux d'accès List / Read / Write / Permissions management / Tagging, description AWS de chaque action), ressources (avec les **formats d'ARN** des actions choisies), conditions (clés proposées d'après les actions, opérateurs adaptés au type de la clé).
- **{ } JSON** : éditeur coloré ; c'est la **source de vérité**. Les erreurs de syntaxe sont données en français (ligne, colonne, cause probable). On peut y coller une politique existante.
- **📖 Explication** : la politique en phrases, et le nombre d'actions par service et niveau d'accès (jokers développés).

**3 · Contrôles** : erreurs, avertissements de sécurité, suggestions, avec le code du constat, la ligne du JSON et, quand c'est sûr, un bouton **🔧 de correction**.

**4 · Simuler** :
- **tests automatiques** (voir ci-dessous) ;
- **requête libre** : action, ressource, principal, clés de contexte (préréglages MFA, IP, région, HTTPS). Le résultat dit *Autorisé*, *Refus explicite* ou *Refus implicite*, avec le détail de chaque déclaration et de chaque condition.

**5 · Exporter** : JSON, Terraform (`aws_iam_policy_document` + ressource), CloudFormation (YAML), AWS CLI (script avec heredoc protégé), YAML. Copier ou télécharger.

## « Généré » ne veut pas dire « vérifié »

Une politique produite par l'assistant n'est présentée comme vérifiée qu'**après exécution** :

1. elle est validée (voir plus bas) ;
2. des **requêtes de test** sont fabriquées **à partir du plan** (ce qui était voulu), de part et d'autre des frontières : l'action voulue, une action voisine non voulue du même service, une autre ressource, chaque condition non remplie, un autre principal, un autre service ;
3. l'**attendu est calculé sur le plan**, le **résultat observé** vient de l'évaluateur appliqué à la **politique générée** ; un écart (joker trop large, ressource oubliée…) est un échec visible ;
4. si la politique est ensuite modifiée à la main, les tests sont rejoués : « Politique modifiée depuis la génération » signale qu'elle ne fait peut-être plus ce qui était demandé.

Pour une politique saisie à la main (pas de plan), des **sondes** sont simulées : des exemples tirés de la politique (doivent passer) et des requêtes voisines (autre compte, autre ressource, sans conditions, action d'écriture voisine). Une sonde ⚠️ signale une politique plus large que ses ressources et conditions ne le laissent attendre.

## Ce que valide le validateur

Pour chaque constat : gravité (erreur, sécurité, avertissement, suggestion, information), message en français, déclaration concernée, ligne.

- **Structure** : clés inconnues (avec suggestion), `Version`, `Effect`, `Sid` (caractères, unicité), `Action`/`NotAction`, `Resource`/`NotResource`, `Principal`/`NotPrincipal` selon le type, **clés dupliquées** (que `JSON.parse` écrase en silence), taille et limites (6 144 / 2 048 / 10 240… caractères).
- **Cohérence avec les données AWS** : service inconnu ou action inconnue avec suggestion (« vouliez-vous écrire `lambda` ? »), joker sans correspondance, **ressource incompatible avec l'action** (`s3:GetObject` sur l'ARN du bucket, sans `/*` ; `ec2:DescribeInstances` sur une instance), **clé de condition qui n'existe pas pour cette action** (la condition serait toujours fausse : un `Deny` ne s'appliquerait jamais), type de la clé et opérateur, clés à valeurs multiples sans `ForAnyValue`/`ForAllValues`, adresses IP, dates, nombres, ARN.
- **Pièges connus** : `Deny` + `Bool aws:MultiFactorAuthPresent` sans `IfExists` (ne bloque pas les clés d'accès longue durée), `ForAllValues` dans un `Allow` (vrai quand la clé est absente), `Deny` sur `NotIpAddress` qui bloque les appels de services AWS.
- **Sécurité** : `Action *` sur `Resource *`, `NotAction` avec `Allow`, service sensible entier, **escalade de privilèges** (`iam:PassRole`, `iam:CreatePolicyVersion`, `iam:AttachRolePolicy`…), principal `*` public, trust policy OIDC **sans condition sur `sub`** (n'importe quel dépôt pourrait assumer le rôle), « confused deputy », compte entier approuvé.
- **À savoir** : KMS exige aussi la politique de la clé ; `sts:AssumeRole` exige aussi la politique d'approbation du rôle.

## Architecture

```
public/iam/                  données (JSON par service, chargées à la demande) — voir « Données »
src/lib/iam/
  donnees.js                 catalogue : services, actions, niveaux, types de ressources, clés (accès synchrone une fois chargé)
  sourceWeb.js               chargement dans le navigateur (même origine)
  glob.js                    jokers IAM (* ?) sans retour exponentiel ; intersection de deux motifs
  arn.js                     analyse d'ARN, gabarits des types de ressources, compatibilité d'un motif avec un gabarit
  conditions.js              opérateurs (String, Numeric, Date, Bool, IpAddress, Arn, Null), IfExists, ForAllValues/ForAnyValue, variables ${aws:username}
  evaluer.js                 refus explicite > autorisation > refus implicite ; identité, plafond, SCP, ressource, approbation
  politique.js               lecture avec positions et clés dupliquées, modèle normalisé, sérialisation canonique, limites de taille
  valider.js · securite.js   constats (voir ci-dessus) et correctifs
  etendre.js · expliquer.js  jokers développés, résumé d'accès, explication en français
  lexique.js · langue.js     vocabulaire FR/EN, jetons, éléments structurés, messages AccessDenied
  assistant.js               description → plan → politique ; jokers d'actions écrits seulement si l'expansion est exacte
  testsauto.js               tests générés d'après le plan, sondes, exécution
  edition.js                 modifications pures utilisées par le constructeur
  exporter.js                JSON, YAML, Terraform, CloudFormation, AWS CLI
src/components/devops/IamBuilder.jsx · iam/*.jsx     interface
outils/iam/extraire.mjs      génère public/iam depuis le paquet de données (hors dépôt)
```

Le moteur est le même dans les tests Node et dans le navigateur : pas de worker (pas d'expression régulière utilisateur, appariement itératif).

## Données

`public/iam` contient, par service, les actions, leur niveau d'accès, les types de ressources (gabarits d'ARN) et les clés de condition, plus les clés globales. Elles sont extraites du paquet [`@cloud-copilot/iam-data`](https://github.com/cloud-copilot/iam-data) (**licence MIT**, voir `public/iam/LICENCE-iam-data.txt`), mis à jour chaque jour à partir de la documentation d'AWS. Version et date sont affichées sous l'outil. 457 services, 22 554 actions (3,3 Mo, chargés service par service).

Pour régénérer : installer le paquet **hors du dépôt**, puis `node outils/iam/extraire.mjs <dossier du paquet>`. Une action très récente d'AWS peut manquer : l'outil le signale comme « inconnue » avec la date des données.

## Ce qui a été vérifié

`npm run test:iam` : **49 tests**, dont :
- jokers, ARN, 42 cas de conditions, évaluation (refus explicite, `NotAction`, variables, SCP, plafond, approbation), validation (17 politiques fausses, 9 signaux de sécurité, correctifs appliqués jusqu'à zéro erreur) ;
- **plus de 30 descriptions** (français et anglais : identité, garde-fous, approbation, ressource, message `AccessDenied`) : chacune donne une politique **valide** dont les **tests automatiques réussissent** ; les 20 exemples de l'interface sont tous testés ;
- exports relus : JSON, YAML, CloudFormation et script CLI redonnent exactement la politique.

**Comparaisons avec de vrais outils** (ignorées, jamais inventées, si l'outil est absent ; `IAM_ORACLES=/chemin npm run test:iam`, voir `outils/iam/croisement.test.mjs`) :
- **iam-simulate** (simulateur IAM) : **263 requêtes** tirées des politiques de l'assistant et **1 320 requêtes** sur 220 politiques aléatoires (déclarations multiples, `NotAction`, `NotResource`, 17 familles de conditions) : **décisions identiques**, aucune requête rejetée ;
- **Parliament** (linter IAM) : aucune politique générée n'est jugée fausse ; accord sur 9 politiques fausses (action inconnue, ressource incompatible, clé non applicable, motif MFA…) ;
- **cfn-lint** : les 32 gabarits CloudFormation exportés sont valides ;
- **python-hcl2** : le Terraform exporté est lu et redonne exactement les déclarations.

Ces outils ne sont **jamais** une dépendance de l'application : `iam-simulate` est sous licence AGPL-3.0, il n'est ni installé ni embarqué par le projet.

Playwright, sur téléphone (375 px) et PC (1366 px), **66 contrôles** : exemple de départ vérifié, génération et retour arrière, JSON invalide, correctifs, constructeur (sélecteur de services, conditions), simulation, exports, approbation, politique de ressource, message `AccessDenied`, description non comprise, aucun débordement horizontal, **aucune requête réseau hors du site**.

## Limites connues

- **Ce n'est pas un modèle de langage.** Les descriptions sont interprétées par des règles locales (une cinquantaine de services, des verbes courants). Une phrase hors de ce vocabulaire n'est pas devinée : elle est signalée.
  - « Lecture » sur S3 signifie lire les objets et lister le bucket ; pour toutes les actions de niveau Read/List, dites « toutes les actions de lecture ».
  - Une clé KMS donnée par alias devient une condition `kms:RequestAlias`, car les actions KMS visent la clé.
- **La simulation couvre un seul compte** : pas d'accès entre comptes, de politique de session, de RCP ni de `aws:CalledVia`. Pour KMS, la politique de la clé n'est pas modélisée. Les ARN sont comparés avec leur casse ; `aws:RequestedRegion`, `aws:ResourceAccount` sont déduits de l'ARN quand la requête ne les donne pas (indiqué dans le résultat).
- **Les données AWS ont une date** : une action ou une clé très récente peut manquer ; l'outil dit « inconnue (version du … ) » avec une suggestion plutôt que de se tromper en silence.
- Le validateur n'est pas Access Analyzer : il ne voit pas votre compte (rôles existants, buckets réels).
- **IA externe : non configurée.** Aucune clé d'API dans la page ; il faudrait un backend et votre accord avant tout envoi.
