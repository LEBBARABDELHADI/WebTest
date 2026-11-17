// Libellés français des clés de condition globales, des opérateurs et des actions à risque.
// Les types des clés proviennent des données AWS ; ces textes sont écrits pour l'interface.

export const CLÉS_GLOBALES_FR = {
  'aws:principalarn': 'ARN du principal (utilisateur, rôle) qui fait la requête',
  'aws:principalaccount': 'Compte AWS du principal',
  'aws:principalorgid': 'Identifiant de l\'organisation du principal (o-xxxxxxxxxx)',
  'aws:principalorgpaths': 'Chemins d\'unités d\'organisation du principal',
  'aws:principaltag/tag-key': 'Étiquette (tag) du principal : contrôle d\'accès par attributs (ABAC)',
  'aws:principalisawsservice': 'Vrai si l\'appel vient d\'un service AWS',
  'aws:principalservicename': 'Nom du service AWS principal (ex. lambda.amazonaws.com)',
  'aws:principaltype': 'Type de principal : Account, User, FederatedUser, AssumedRole, Anonymous',
  'aws:userid': 'Identifiant unique du principal',
  'aws:username': 'Nom de l\'utilisateur IAM (absent pour un rôle)',
  'aws:multifactorauthpresent': 'Vrai si la session a été ouverte avec MFA (clé absente pour les clés d\'accès longue durée)',
  'aws:multifactorauthage': 'Secondes écoulées depuis l\'authentification MFA',
  'aws:sourceip': 'Adresse IP publique d\'origine (absente derrière un endpoint VPC ou pour un appel de service à service)',
  'aws:sourcevpc': 'Identifiant du VPC d\'où vient la requête (vpc-…), via un endpoint VPC',
  'aws:sourcevpce': 'Identifiant de l\'endpoint VPC utilisé (vpce-…)',
  'aws:vpcsourceip': 'Adresse IP privée d\'origine, via un endpoint VPC',
  'aws:sourcearn': 'ARN de la ressource à l\'origine d\'un appel de service (protection « confused deputy »)',
  'aws:sourceaccount': 'Compte de la ressource à l\'origine d\'un appel de service',
  'aws:sourceorgid': 'Organisation de la ressource à l\'origine d\'un appel de service',
  'aws:resourceaccount': 'Compte propriétaire de la ressource demandée',
  'aws:resourceorgid': 'Organisation propriétaire de la ressource demandée',
  'aws:resourcetag/tag-key': 'Étiquette (tag) de la ressource demandée',
  'aws:requesttag/tag-key': 'Étiquette (tag) transmise dans la requête (création ou modification)',
  'aws:tagkeys': 'Liste des clés d\'étiquettes transmises dans la requête',
  'aws:requestedregion': 'Région AWS ciblée par la requête',
  'aws:currenttime': 'Date et heure de la requête (ISO 8601, UTC)',
  'aws:epochtime': 'Heure de la requête en secondes depuis 1970',
  'aws:securetransport': 'Vrai si la requête passe par TLS (HTTPS)',
  'aws:calledvia': 'Services intermédiaires qui ont appelé en votre nom (liste ordonnée)',
  'aws:calledviafirst': 'Premier service de la chaîne d\'appel',
  'aws:calledvialast': 'Dernier service de la chaîne d\'appel',
  'aws:viaawsservice': 'Vrai si un service AWS appelle en votre nom',
  'aws:useragent': 'Agent utilisateur du client (peut être falsifié)',
  'aws:referer': 'En-tête Referer de la requête (peut être falsifié)',
  'aws:tokenissuetime': 'Date d\'émission des identifiants temporaires',
  'aws:federatedprovider': 'Fournisseur d\'identité fédérée',
  'aws:sourceidentity': 'Identité source définie à l\'assomption du rôle',
}

export const descriptionClé = clé => {
  const k = clé.toLowerCase()
  if (CLÉS_GLOBALES_FR[k]) return CLÉS_GLOBALES_FR[k]
  const m = /^([^/]+)\//.exec(k)
  if (m) return CLÉS_GLOBALES_FR[`${m[1]}/tag-key`] ?? ''
  return ''
}

// Clés qui restreignent réellement l'accès à des appelants identifiés (pour juger un Principal « * »).
export const CLÉS_RESTRICTIVES_PRINCIPAL = ['aws:principalorgid', 'aws:principalorgpaths', 'aws:principalaccount', 'aws:principalarn', 'aws:sourcevpc', 'aws:sourcevpce', 'aws:sourcearn', 'aws:sourceaccount', 'aws:sourceorgid', 'aws:sourceowner', 'aws:userid', 'aws:principaltag', 'aws:vpcsourceip', 'aws:sourceip', 'aws:resourceaccount', 'aws:resourceorgid']

export const OPÉRATEURS_FR = {
  StringEquals: 'est exactement',
  StringNotEquals: 'n\'est pas',
  StringEqualsIgnoreCase: 'est (sans tenir compte de la casse)',
  StringNotEqualsIgnoreCase: 'n\'est pas (sans tenir compte de la casse)',
  StringLike: 'correspond à (jokers * ?)',
  StringNotLike: 'ne correspond pas à (jokers * ?)',
  NumericEquals: '=',
  NumericNotEquals: '≠',
  NumericLessThan: '<',
  NumericLessThanEquals: '≤',
  NumericGreaterThan: '>',
  NumericGreaterThanEquals: '≥',
  DateEquals: 'est le',
  DateNotEquals: 'n\'est pas le',
  DateLessThan: 'est avant',
  DateLessThanEquals: 'est au plus le',
  DateGreaterThan: 'est après',
  DateGreaterThanEquals: 'est au moins le',
  Bool: 'vaut',
  BinaryEquals: 'est (binaire base64)',
  IpAddress: 'est dans le réseau',
  NotIpAddress: 'n\'est pas dans le réseau',
  ArnEquals: 'est l\'ARN',
  ArnNotEquals: 'n\'est pas l\'ARN',
  ArnLike: 'correspond à l\'ARN (jokers)',
  ArnNotLike: 'ne correspond pas à l\'ARN',
  Null: 'est absente (true) / présente (false)',
}

// Opérateurs proposés selon le type de la clé (données AWS : String, ARN, Bool, Numeric, Date, IPAddress, ArrayOf…).
export function opérateursPour(type) {
  const base = String(type).replace(/^ArrayOf/, '')
  const multi = /^ArrayOf/.test(type)
  const liste = {
    String: ['StringEquals', 'StringLike', 'StringNotEquals', 'StringNotLike', 'StringEqualsIgnoreCase', 'StringEqualsIfExists', 'StringNotEqualsIfExists'],
    ARN: ['ArnLike', 'ArnEquals', 'ArnNotLike', 'ArnNotEquals', 'ArnLikeIfExists'],
    Bool: ['Bool', 'BoolIfExists'],
    Numeric: ['NumericEquals', 'NumericLessThan', 'NumericLessThanEquals', 'NumericGreaterThan', 'NumericGreaterThanEquals', 'NumericNotEquals'],
    Date: ['DateLessThan', 'DateGreaterThan', 'DateEquals', 'DateLessThanEquals', 'DateGreaterThanEquals', 'DateNotEquals'],
    IPAddress: ['IpAddress', 'NotIpAddress'],
  }[base] ?? ['StringEquals', 'StringLike']
  const ops = multi ? liste.filter(o => !/NotEquals|NotLike|IfExists/.test(o)).flatMap(o => [`ForAnyValue:${o}`, `ForAllValues:${o}`]) : liste
  return [...ops, 'Null']
}

// Actions à risque : escalade de privilèges ou exfiltration. Clé : action en minuscules.
const RISQUES = {
  'iam:CreatePolicyVersion': { type: 'escalade', pourquoi: 'permet de réécrire une politique gérée et de la rendre active : l\'utilisateur peut s\'accorder tous les droits' },
  'iam:SetDefaultPolicyVersion': { type: 'escalade', pourquoi: 'permet de réactiver une ancienne version de politique, parfois plus permissive' },
  'iam:AttachUserPolicy': { type: 'escalade', pourquoi: 'permet d\'attacher AdministratorAccess à un utilisateur' },
  'iam:AttachGroupPolicy': { type: 'escalade', pourquoi: 'permet d\'attacher AdministratorAccess à un groupe' },
  'iam:AttachRolePolicy': { type: 'escalade', pourquoi: 'permet d\'attacher AdministratorAccess à un rôle' },
  'iam:PutUserPolicy': { type: 'escalade', pourquoi: 'permet d\'écrire une politique en ligne arbitraire sur un utilisateur' },
  'iam:PutGroupPolicy': { type: 'escalade', pourquoi: 'permet d\'écrire une politique en ligne arbitraire sur un groupe' },
  'iam:PutRolePolicy': { type: 'escalade', pourquoi: 'permet d\'écrire une politique en ligne arbitraire sur un rôle' },
  'iam:AddUserToGroup': { type: 'escalade', pourquoi: 'permet de s\'ajouter à un groupe plus privilégié' },
  'iam:UpdateAssumeRolePolicy': { type: 'escalade', pourquoi: 'permet de modifier qui peut assumer un rôle puis de l\'assumer' },
  'iam:CreateAccessKey': { type: 'escalade', pourquoi: 'permet de créer des clés d\'accès pour un autre utilisateur' },
  'iam:CreateLoginProfile': { type: 'escalade', pourquoi: 'permet de définir le mot de passe console d\'un autre utilisateur' },
  'iam:UpdateLoginProfile': { type: 'escalade', pourquoi: 'permet de changer le mot de passe console d\'un autre utilisateur' },
  'iam:PassRole': { type: 'escalade', pourquoi: 'permet de confier un rôle à un service (Lambda, EC2…) : tout rôle passable est exploitable' },
  'sts:AssumeRole': { type: 'escalade', pourquoi: 'sur « * », permet d\'assumer n\'importe quel rôle dont la relation d\'approbation l\'accepte' },
  'lambda:UpdateFunctionCode': { type: 'escalade', pourquoi: 'permet d\'exécuter du code arbitraire avec le rôle de la fonction' },
  'lambda:CreateFunction': { type: 'escalade', pourquoi: 'avec iam:PassRole, permet d\'exécuter du code avec un rôle choisi' },
  'cloudformation:CreateStack': { type: 'escalade', pourquoi: 'avec iam:PassRole, permet de créer des ressources avec les droits d\'un rôle' },
  'glue:CreateDevEndpoint': { type: 'escalade', pourquoi: 'avec iam:PassRole, donne un accès shell avec les droits d\'un rôle' },
  'ec2:RunInstances': { type: 'escalade', pourquoi: 'avec iam:PassRole, lance une instance qui porte les droits d\'un rôle' },
  'ssm:SendCommand': { type: 'escalade', pourquoi: 'permet d\'exécuter des commandes sur toutes les instances ciblées' },
  'ssm:StartSession': { type: 'escalade', pourquoi: 'ouvre un shell sur les instances ciblées' },
  'organizations:LeaveOrganization': { type: 'destruction', pourquoi: 'permet de quitter l\'organisation et d\'échapper à ses SCP' },
  'secretsmanager:GetSecretValue': { type: 'données', pourquoi: 'lit la valeur de secrets' },
  'ssm:GetParameter': { type: 'données', pourquoi: 'lit des paramètres (parfois des secrets déchiffrés avec WithDecryption)' },
  'ssm:GetParameters': { type: 'données', pourquoi: 'lit des paramètres (parfois des secrets déchiffrés avec WithDecryption)' },
  'ssm:GetParametersByPath': { type: 'données', pourquoi: 'lit des paramètres (parfois des secrets déchiffrés avec WithDecryption)' },
  'kms:Decrypt': { type: 'données', pourquoi: 'déchiffre n\'importe quelle donnée chiffrée avec les clés visées' },
  'kms:CreateGrant': { type: 'escalade', pourquoi: 'permet d\'accorder l\'usage d\'une clé KMS à quelqu\'un d\'autre' },
  's3:PutBucketPolicy': { type: 'escalade', pourquoi: 'permet de rendre un bucket public ou de s\'en donner l\'accès' },
  's3:DeleteObject': { type: 'destruction', pourquoi: 'supprime des objets' },
  'ec2:TerminateInstances': { type: 'destruction', pourquoi: 'détruit des instances' },
  'rds:DeleteDBInstance': { type: 'destruction', pourquoi: 'détruit des bases de données' },
  'dynamodb:DeleteTable': { type: 'destruction', pourquoi: 'détruit des tables' },
  'cloudtrail:StopLogging': { type: 'furtivité', pourquoi: 'arrête la journalisation CloudTrail' },
  'cloudtrail:DeleteTrail': { type: 'furtivité', pourquoi: 'supprime un journal CloudTrail' },
  'guardduty:DeleteDetector': { type: 'furtivité', pourquoi: 'désactive GuardDuty' },
  'config:StopConfigurationRecorder': { type: 'furtivité', pourquoi: 'arrête AWS Config' },
}

// Table indexée par action en minuscules : { nom, type, pourquoi }.
export const ACTIONS_À_RISQUE = Object.fromEntries(Object.entries(RISQUES).map(([nom, v]) => [nom.toLowerCase(), { nom, ...v }]))

// Actions qui n'existent pas par région/compte : exceptions classiques d'un « Deny hors région ».
export const SERVICES_GLOBAUX = ['iam', 'sts', 'organizations', 'route53', 'route53domains', 'cloudfront', 'waf', 'wafv2', 'support', 'budgets', 'ce', 'cur', 'health', 'trustedadvisor', 'account', 'billing', 'aws-portal', 'globalaccelerator', 'shield', 'sso', 'identitystore']

// Fournisseurs d'identité OIDC courants pour les relations d'approbation.
export const FOURNISSEURS_OIDC = {
  github: { nom: 'GitHub Actions', hôte: 'token.actions.githubusercontent.com', aud: 'sts.amazonaws.com' },
  gitlab: { nom: 'GitLab CI', hôte: 'gitlab.com', aud: 'https://gitlab.com' },
  bitbucket: { nom: 'Bitbucket Pipelines', hôte: 'api.bitbucket.org/2.0/workspaces', aud: 'ari:cloud:bitbucket::workspace' },
  circleci: { nom: 'CircleCI', hôte: 'oidc.circleci.com/org', aud: '' },
}
