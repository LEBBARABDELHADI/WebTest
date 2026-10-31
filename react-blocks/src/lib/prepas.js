// Pages « Prépa » : un examen, sa fiche de synthèse et ses raccourcis vers
// tous les outils de l'appli (cartes, examen blanc, labos, notes, schémas,
// minuteur, habitudes…). Les liens « ?action= / ?modèle= » sont lus par les
// pages concernées.

export const PRÉPAS = {
  aws: {
    id: 'aws',
    titre: 'Prépa AWS CloudOps',
    emoji: '☁️',
    sousTitre: 'AWS Certified CloudOps Engineer – Associate (SOA-C03)',
    préset: 'aws-cloudops',
    paquets: ['aws-surveillance', 'aws-fiabilite', 'aws-deploiement', 'aws-securite', 'aws-reseau', 'aws-cli', 'aws-pannes', 'aws-labos'],
    labo: 'aws-labos',
    pannes: 'aws-pannes',
    noteModèle: '☁️ Fiche AWS perso',
    schémas: [['aws-vpc', '🏗️ Architecture AWS multi-AZ'], ['architecture', '🌐 Schéma d\'architecture'], ['cicd', '🚀 Pipeline CI/CD']],
    habitude: { nom: 'Réviser AWS 25 min', emoji: '☁️', couleur: '#ff9900' },
    fiche: [
      {
        titre: '📋 L\'examen', points: [
          'Nouveau nom de l\'examen **SysOps Administrator** (code SOA-C03).',
          '**65 questions** (choix unique ou multiple), **130 minutes**, réussite à **720/1000**. Valable 3 ans.',
          'Cinq domaines : surveillance 22 %, fiabilité 22 %, déploiement 22 %, sécurité 16 %, réseau 18 %.',
          'Vérifie le guide officiel sur aws.amazon.com avant de réserver : contenu et format peuvent évoluer.',
        ],
      },
      {
        titre: '📈 Surveillance, journalisation, performance (22 %)', points: [
          '**CloudWatch** = métriques, alarmes, logs, tableaux de bord. Mémoire et disque EC2 → **agent CloudWatch**.',
          'Surveillance EC2 de base : 5 min ; détaillée : 1 min.',
          '**CloudTrail** = qui a fait quoi (appels d\'API). **Config** = état et conformité des ressources (+ remédiation).',
          '**EventBridge** = réagir à un événement. **Logs Insights** = requêter les logs. **Filtre de métrique** = transformer des logs en métrique.',
          'Performance : gp3 (IOPS indépendantes de la taille), réplicas en lecture et ElastiCache, **Compute Optimizer** pour la taille des instances.',
        ],
      },
      {
        titre: '🛟 Fiabilité et continuité (22 %)', points: [
          '**Multi-AZ** = disponibilité (synchrone, bascule auto). **Réplica en lecture** = performance (asynchrone).',
          'Auto Scaling + contrôles de santé **ELB** ; règle la plus simple : **target tracking**.',
          'Sauvegardes : **AWS Backup**, Data Lifecycle Manager (EBS), versioning + réplication S3, Object Lock.',
          'Reprise : sauvegarde/restauration → pilot light → warm standby → multi-site. RTO = durée d\'arrêt, RPO = données perdues.',
          '**Route 53 failover** + contrôles de santé pour basculer vers un site de secours.',
        ],
      },
      {
        titre: '🚀 Déploiement et automatisation (22 %)', points: [
          '**CloudFormation** : change set (prévisualiser), drift (dérive), StackSets (multi-comptes), DeletionPolicy Retain, rollback automatique.',
          '**Systems Manager** : Run Command, Patch Manager, Session Manager (sans SSH), Automation, Parameter Store.',
          'Secrets : **Secrets Manager** si rotation automatique, sinon Parameter Store SecureString.',
          'AMI à jour : **EC2 Image Builder**. Script au premier démarrage : **user data**. Sans interruption : **blue/green**.',
        ],
      },
      {
        titre: '🔐 Sécurité et conformité (16 %)', points: [
          'IAM : **refus explicite > autorisation > refus par défaut**. Instances → **rôle IAM**, jamais de clés.',
          'Organisations : **SCP** pour interdire, même au compte root.',
          'Chiffrement : **KMS**. Certificats : **ACM**. Web : **WAF**.',
          'Détection : **GuardDuty** (menaces), **Inspector** (vulnérabilités), **Security Hub** (vue centrale), **Access Analyzer** (accès externes).',
          'S3 : **Block Public Access**, politiques de bucket, chiffrement par défaut.',
        ],
      },
      {
        titre: '🌐 Réseau et diffusion (18 %)', points: [
          'Sous-réseau public = route **0.0.0.0/0 → Internet Gateway**. Privé + sortie Internet = **NAT Gateway** (une par AZ).',
          '**Security Group** : avec état, autorisations seulement. **NACL** : sans état, autoriser/refuser, ports éphémères.',
          'S3/DynamoDB sans NAT : **endpoint gateway**. Autres services : **endpoint interface** (PrivateLink).',
          'Peering non transitif → **Transit Gateway**. Diagnostic : **VPC Flow Logs**.',
          'Route 53 : **Alias** à la racine du domaine ; routage par latence, géolocalisation, pondéré, failover. **CloudFront** pour le contenu statique.',
        ],
      },
      {
        titre: '⚠️ Pièges classiques', points: [
          '« Le moins d\'effort opérationnel » → un **service managé** plutôt qu\'un script maison.',
          'Multi-AZ n\'améliore pas les performances de lecture.',
          'Un CNAME est impossible à la racine du domaine : utiliser un **Alias**.',
          'NACL : penser au trafic **retour** (ports éphémères 1024-65535).',
          'CloudTrail (qui ?) ≠ Config (quel état ?) ≠ CloudWatch (combien ? quand ?).',
        ],
      },
      {
        titre: '🧭 Méthode pour les questions', points: [
          'Repère la **contrainte** : le moins cher, le plus rapide, le moins d\'effort, le plus sûr.',
          'Élimine d\'abord les réponses qui ne respectent pas la contrainte, puis compare les deux restantes.',
          'Ne bloque pas : marque la question et reviens-y. Garde 10 minutes pour relire.',
        ],
      },
    ],
  },
  naturalisation: {
    id: 'naturalisation',
    titre: 'Prépa naturalisation',
    emoji: '🇫🇷',
    sousTitre: 'Entretien en préfecture et examen civique',
    préset: 'civique',
    paquets: ['nat-valeurs', 'nat-institutions', 'nat-droits', 'nat-histoire', 'nat-geo', 'nat-situations', 'nat-actu', 'fr-connecteurs', 'fr-oral'],
    oral: 'fr-oral',
    entretien: 'nat-situations',
    noteModèle: '🇫🇷 Mon parcours',
    schémas: [['naturalisation', '🇫🇷 Révision naturalisation'], ['frise', '📜 Frise chronologique']],
    habitude: { nom: 'Réviser la naturalisation', emoji: '🇫🇷', couleur: '#1f4fa3' },
    fiche: [
      {
        titre: '📋 Le jour de l\'entretien', points: [
          'Un entretien individuel en préfecture : l\'agent vérifie ton **parcours**, ta **connaissance de la France** et ton **adhésion aux valeurs** de la République.',
          'Questions personnelles, culture générale, mises en situation. Réponds avec des **phrases complètes**, calmement.',
          'Apporte ta convocation, ta pièce d\'identité et les documents demandés.',
          'Examen civique et niveau de langue exigés : vérifie les règles en vigueur sur **service-public.fr**.',
        ],
      },
      {
        titre: '✨ Valeurs et symboles', points: [
          'Devise : **Liberté, Égalité, Fraternité**. Drapeau bleu, blanc, rouge. Hymne : **La Marseillaise** (1792).',
          'Fête nationale : **14 juillet**. **Marianne** représente la République.',
          'République **indivisible, laïque, démocratique et sociale** (article 1er de la Constitution).',
          '**Laïcité** (loi de 1905) : l\'État est neutre ; chacun est libre de croire ou de ne pas croire.',
          '**Déclaration des droits de l\'homme et du citoyen** : 26 août 1789.',
        ],
      },
      {
        titre: '🏛️ Institutions', points: [
          '**Ve République** : Constitution du 4 octobre 1958 (général de Gaulle).',
          'Président élu pour **5 ans** au suffrage universel direct ; il nomme le Premier ministre.',
          'Parlement = **Assemblée nationale** (577 députés, 5 ans) + **Sénat** (élu au suffrage indirect). Il vote les lois.',
          '**Conseil constitutionnel** : vérifie que les lois respectent la Constitution.',
          'Communes, départements, **18 régions** (13 en métropole). Le maire est élu par le conseil municipal.',
          'Membre fondateur de l\'**Union européenne** (traité de Rome, 1957) ; Parlement européen à Strasbourg.',
        ],
      },
      {
        titre: '📜 Dates clés', points: [
          '**1789** Révolution, Déclaration des droits · **1792** Ire République · **1804** Napoléon empereur',
          '**1848** suffrage universel masculin, abolition de l\'esclavage · **1882** école gratuite, laïque, obligatoire',
          '**1905** séparation des Églises et de l\'État · **1918** armistice (11 novembre)',
          '**1940** appel du 18 juin · **1944** droit de vote des femmes · **1945** victoire (8 mai)',
          '**1958** Ve République · **1981** abolition de la peine de mort · **2002** l\'euro',
        ],
      },
      {
        titre: '🗺️ Géographie', points: [
          'Capitale : **Paris**. Plus long fleuve : **la Loire**. Point culminant : **le mont Blanc** (environ 4 806 m).',
          'Mers et océan : Manche, mer du Nord, Atlantique, Méditerranée.',
          'Voisins : Belgique, Luxembourg, Allemagne, Suisse, Italie, Monaco, Andorre, Espagne.',
          'Outre-mer : Guadeloupe, Martinique, Guyane, La Réunion, Mayotte. Environ 68 millions d\'habitants.',
        ],
      },
      {
        titre: '⚖️ Droits et devoirs', points: [
          'Voter (droit et devoir civique), payer ses impôts, respecter la loi, être juré si on est tiré au sort.',
          'Égalité femmes-hommes, refus de toute discrimination, présomption d\'innocence.',
          'Mariage civil à la mairie (avant toute cérémonie religieuse), à 18 ans, avec libre consentement.',
          'Urgences : **15** SAMU, **17** police, **18** pompiers, **112** européen. Violences conjugales : **3919**.',
        ],
      },
      {
        titre: '🤝 Répondre à une mise en situation', points: [
          '1. Nomme le **principe** en jeu (égalité, laïcité, loi, liberté).',
          '2. Dis ce que tu **ferais concrètement**.',
          '3. Cite qui peut aider : 17, Défenseur des droits, mairie, plainte…',
          'Exemple : « Un agent au guichet doit rester neutre : la laïcité s\'impose aux agents publics, pas aux usagers. »',
        ],
      },
      {
        titre: '🙋 Questions personnelles fréquentes', points: [
          'Présentez-vous. Votre parcours, votre arrivée en France, votre travail, votre famille.',
          'Pourquoi voulez-vous devenir français(e) ? Parle d\'attachement et de valeurs, pas seulement de papiers.',
          'Que faites-vous pour vous intégrer ? (travail, amis, associations, vie locale)',
          'Garde des **dates cohérentes avec ton dossier** : prépare la note « Mon parcours ».',
        ],
      },
    ],
  },
}

// Rendu imprimable d'une fiche (nouvelle fenêtre → Imprimer / PDF).
export function imprimerFiche(prépa) {
  const html = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${prépa.titre} — fiche</title>
<style>body{font:13px/1.45 system-ui,sans-serif;color:#1b1b1b;margin:18mm 14mm;columns:2;column-gap:10mm}h1{column-span:all;font-size:20px;margin:0 0 2px}p.s{column-span:all;margin:0 0 10px;color:#555}section{break-inside:avoid;margin:0 0 10px}h2{font-size:14px;margin:0 0 4px;border-bottom:1px solid #ccc}ul{margin:0;padding-left:16px}li{margin:2px 0}@page{margin:10mm}</style></head><body>
<h1>${prépa.emoji} ${prépa.titre}</h1><p class="s">${prépa.sousTitre}</p>
${prépa.fiche.map(s => `<section><h2>${html(s.titre)}</h2><ul>${s.points.map(p => `<li>${html(p)}</li>`).join('')}</ul></section>`).join('')}
<script>setTimeout(()=>print(),300)</script></body></html>`)
  w.document.close()
  return true
}
