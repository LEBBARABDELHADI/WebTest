// Vocabulaire de l'assistant : services AWS (mots français/anglais), noms de ressources, verbes
// d'intention et actions précises par verbe. Les textes sont comparés sans accents ni majuscules.

// Un mot-clé → un service. Plusieurs mots possibles ; les expressions de plusieurs mots sont permises.
export const SERVICES = {
  s3: ['s3', 'amazon s3', 'bucket', 'buckets', 'seau', 'seaux'],
  ec2: ['ec2', 'instance', 'instances', 'machine virtuelle', 'machines virtuelles', 'vm', 'ebs', 'volume ebs', 'snapshot', 'snapshots'],
  lambda: ['lambda', 'fonction', 'fonctions', 'function', 'functions'],
  dynamodb: ['dynamodb', 'dynamo', 'dynamo db', 'table', 'tables'],
  sqs: ['sqs', 'file d attente', 'files d attente', 'queue', 'queues'],
  sns: ['sns', 'topic', 'topics', 'rubrique', 'rubriques'],
  kms: ['kms', 'cle', 'cles', 'cle de chiffrement', 'cles de chiffrement'],
  secretsmanager: ['secrets manager', 'secretsmanager', 'secret', 'secrets', 'gestionnaire de secrets'],
  ssm: ['ssm', 'parameter store', 'systems manager', 'parametre', 'parametres', 'parameter', 'parameters'],
  logs: ['cloudwatch logs', 'logs', 'journaux', 'journal', 'log group', 'groupe de logs', 'groupes de logs', 'groupe de journaux'],
  cloudwatch: ['cloudwatch', 'metriques', 'metrique', 'metrics', 'alarme', 'alarmes', 'alarm', 'alarms'],
  ecr: ['ecr', 'registre de conteneurs', 'container registry', 'registre docker', 'image docker', 'images docker'],
  ecs: ['ecs', 'service ecs', 'taches ecs', 'tache ecs'],
  eks: ['eks', 'kubernetes', 'k8s'],
  rds: ['rds', 'base de donnees', 'bases de donnees', 'database', 'databases', 'aurora'],
  iam: ['iam', 'utilisateur iam', 'utilisateurs iam', 'groupe iam', 'politique iam', 'politiques iam', 'role iam', 'roles iam'],
  sts: ['sts', 'jeton temporaire', 'security token service'],
  route53: ['route 53', 'route53', 'dns', 'zone hebergee', 'zones hebergees', 'hosted zone'],
  cloudfront: ['cloudfront', 'cdn', 'distribution cloudfront'],
  apigateway: ['api gateway', 'apigateway', 'api rest', 'passerelle d api'],
  states: ['step functions', 'stepfunctions', 'state machine', 'machine a etats', 'machines a etats'],
  events: ['eventbridge', 'cloudwatch events', 'evenements', 'event bus', 'bus d evenements'],
  kinesis: ['kinesis'],
  firehose: ['firehose', 'kinesis firehose'],
  athena: ['athena'],
  glue: ['glue', 'aws glue'],
  cloudformation: ['cloudformation', 'stack cloudformation', 'stacks cloudformation'],
  codebuild: ['codebuild', 'code build'],
  codepipeline: ['codepipeline', 'code pipeline', 'pipeline codepipeline'],
  codecommit: ['codecommit', 'code commit'],
  elasticloadbalancing: ['load balancer', 'load balancers', 'alb', 'elb', 'nlb', 'equilibreur de charge', 'repartiteur de charge'],
  autoscaling: ['autoscaling', 'auto scaling', 'groupe auto scaling'],
  sagemaker: ['sagemaker'],
  bedrock: ['bedrock'],
  ses: ['ses', 'simple email service', 'envoi d e-mails', 'envoi d emails'],
  'cognito-idp': ['cognito', 'user pool', 'user pools', 'pool d utilisateurs'],
  backup: ['aws backup', 'sauvegardes aws'],
  elasticfilesystem: ['efs', 'elastic file system', 'systeme de fichiers efs'],
  acm: ['acm', 'certificat', 'certificats', 'certificate manager'],
  wafv2: ['waf', 'wafv2'],
  guardduty: ['guardduty'],
  securityhub: ['security hub', 'securityhub'],
  config: ['aws config'],
  cloudtrail: ['cloudtrail'],
  organizations: ['organizations', 'aws organizations', 'organisation aws'],
  ce: ['cost explorer', 'couts', 'facturation'],
  tag: ['tag editor', 'resource groups tagging'],
}

// Nom de ressource : « bucket mon-bucket » → service + paramètre du gabarit d'ARN à renseigner.
// Le nom est le mot qui suit (ignorer « nommé », « appelé », les guillemets).
export const NOMS_RESSOURCE = [
  { mots: ['bucket', 'buckets', 'seau'], service: 's3', param: /^BucketName$/, libellé: 'bucket' },
  { mots: ['table', 'tables'], service: 'dynamodb', param: /^TableName$/, libellé: 'table' },
  { mots: ['fonction', 'fonctions', 'function', 'functions', 'lambda'], service: 'lambda', param: /^FunctionName$/, libellé: 'fonction' },
  { mots: ['file', 'files', 'queue', 'queues'], service: 'sqs', param: /^QueueName$/, libellé: 'file' },
  { mots: ['topic', 'topics', 'rubrique'], service: 'sns', param: /^TopicName$/, libellé: 'topic' },
  { mots: ['secret', 'secrets'], service: 'secretsmanager', param: /^SecretId$/, libellé: 'secret' },
  { mots: ['parametre', 'parametres', 'parameter', 'parameters', 'chemin ssm'], service: 'ssm', param: /^ParameterName/, libellé: 'paramètre' },
  { mots: ['log group', 'groupe de logs', 'groupe de journaux', 'log-group'], service: 'logs', param: /^LogGroupName$/, libellé: 'groupe de logs' },
  { mots: ['depot ecr', 'repository ecr', 'registre'], service: 'ecr', param: /^RepositoryName$/, libellé: 'dépôt ECR' },
  { mots: ['cle', 'key', 'cle kms', 'alias'], service: 'kms', param: /^(KeyId|Alias)/, libellé: 'clé' },
  { mots: ['role'], service: 'iam', param: /^RoleName/, libellé: 'rôle' },
  { mots: ['stream', 'flux'], service: 'kinesis', param: /^StreamName$/, libellé: 'flux' },
  { mots: ['cluster ecs'], service: 'ecs', param: /^ClusterName$/, libellé: 'cluster ECS' },
  { mots: ['cluster eks'], service: 'eks', param: /^ClusterName$/, libellé: 'cluster EKS' },
  { mots: ['instance', 'instances'], service: 'ec2', param: /^InstanceId$/, libellé: 'instance', identifiant: /^i-[0-9a-f]+$/ },
]

// Intentions génériques : niveaux d'accès (0 List, 1 Read, 2 Write, 3 Permissions management, 4 Tagging)
// et, au besoin, filtres sur le nom de l'action.
const SUPPR = /^(Delete|Remove|Terminate|Destroy|Purge|Deregister)/
export const INTENTIONS = [
  { id: 'complet', mots: ['acces complet', 'full access', 'tout faire', 'administrer', 'administrateur', 'toutes les actions', 'tous les droits', 'controle total', 'full control', 'tous les acces', 'acces total'], tout: true, libellé: 'toutes les actions' },
  { id: 'lectureTotale', mots: ['toutes les actions de lecture', 'tous les droits de lecture', 'lecture complete', 'full read', 'read all', 'toute la lecture'], niveaux: [0, 1], libellé: 'toutes les actions de niveau lecture (List + Read)' },
  { id: 'ecritureTotale', mots: ['toutes les actions d ecriture', 'ecriture complete', 'full write', 'write all', 'tous les droits d ecriture'], niveaux: [2], libellé: 'toutes les actions de niveau écriture (suppressions comprises)' },
  { id: 'lecture', mots: ['lecture seule', 'read only', 'read-only', 'readonly', 'en lecture', 'lecture', 'lire', 'consulter', 'read', 'voir', 'visualiser', 'telecharger', 'download', 'recuperer', 'obtenir', 'get'], niveaux: [0, 1], libellé: 'lecture seule (liste + lecture)' },
  { id: 'liste', mots: ['lister', 'liste', 'list', 'enumerer', 'parcourir', 'decrire', 'describe'], niveaux: [0], libellé: 'liste' },
  { id: 'suppression', mots: ['supprimer', 'suppression', 'effacer', 'delete', 'remove', 'detruire', 'destruction', 'terminer'], niveaux: [2], inclure: SUPPR, libellé: 'suppression' },
  { id: 'ecriture', mots: ['ecrire', 'ecriture', 'write', 'modifier', 'modification', 'mettre a jour', 'update', 'uploader', 'upload', 'deposer', 'televerser', 'put', 'ajouter', 'creer', 'creation', 'create', 'enregistrer'], niveaux: [2], exclure: SUPPR, libellé: 'écriture (sans suppression)' },
  { id: 'tags', mots: ['gerer les tags', 'taguer', 'etiqueter', 'tagging', 'gerer les etiquettes', 'ajouter des tags'], niveaux: [4], libellé: 'gestion des étiquettes (tags)' },
  { id: 'permissions', mots: ['gerer les permissions', 'permissions management', 'gerer les droits', 'gerer les acces'], niveaux: [3], libellé: 'gestion des permissions' },
]

// Verbes précis par service : mot → actions (noms exacts ; vérifiés par un test contre les données).
export const VERBES_SERVICE = {
  s3: {
    // « Lecture » sur S3 : lire les objets et lister le bucket (usage courant). Pour tout le niveau Read/List : « toutes les actions de lecture ».
    lire: ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'], lecture: ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'], 'lecture seule': ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'],
    'en lecture': ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'], consulter: ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'], read: ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'],
    'read only': ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'], 'read-only': ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'], readonly: ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'], voir: ['GetObject', 'GetObjectVersion', 'ListBucket', 'GetBucketLocation'],
    ecrire: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], ecriture: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], write: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], 'en ecriture': ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'],
    modifier: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], 'mettre a jour': ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], ajouter: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], put: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'],
    telecharger: ['GetObject', 'GetObjectVersion'], uploader: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], deposer: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'],
    televerser: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'], upload: ['PutObject', 'AbortMultipartUpload', 'ListMultipartUploadParts'],
    'supprimer les objets': ['DeleteObject', 'DeleteObjectVersion'], 'supprimer des objets': ['DeleteObject', 'DeleteObjectVersion'], 'supprimer un objet': ['DeleteObject', 'DeleteObjectVersion'], 'delete objects': ['DeleteObject', 'DeleteObjectVersion'], 'lister les objets': ['ListBucket'], 'lister le contenu': ['ListBucket'],
    'lister les buckets': ['ListAllMyBuckets'], 'lister tous les buckets': ['ListAllMyBuckets'], 'creer un bucket': ['CreateBucket'], 'rendre public': ['PutBucketPolicy', 'PutBucketPublicAccessBlock', 'PutBucketAcl'],
  },
  lambda: {
    invoquer: ['InvokeFunction'], appeler: ['InvokeFunction'], invoke: ['InvokeFunction'], executer: ['InvokeFunction'], deployer: ['CreateFunction', 'UpdateFunctionCode', 'UpdateFunctionConfiguration', 'PublishVersion', 'GetFunction'],
    'mettre a jour le code': ['UpdateFunctionCode', 'GetFunction'],
  },
  sqs: {
    envoyer: ['SendMessage', 'GetQueueUrl', 'GetQueueAttributes'], publier: ['SendMessage', 'GetQueueUrl', 'GetQueueAttributes'], produire: ['SendMessage', 'GetQueueUrl', 'GetQueueAttributes'], send: ['SendMessage', 'GetQueueUrl', 'GetQueueAttributes'],
    recevoir: ['ReceiveMessage', 'DeleteMessage', 'ChangeMessageVisibility', 'GetQueueUrl', 'GetQueueAttributes'], consommer: ['ReceiveMessage', 'DeleteMessage', 'ChangeMessageVisibility', 'GetQueueUrl', 'GetQueueAttributes'], receive: ['ReceiveMessage', 'DeleteMessage', 'ChangeMessageVisibility', 'GetQueueUrl', 'GetQueueAttributes'],
    purger: ['PurgeQueue'],
  },
  sns: { publier: ['Publish'], publish: ['Publish'], envoyer: ['Publish'], 's abonner': ['Subscribe'], subscribe: ['Subscribe'] },
  ec2: {
    demarrer: ['StartInstances'], start: ['StartInstances'], lancer: ['RunInstances'], arreter: ['StopInstances'], stopper: ['StopInstances'], stop: ['StopInstances'], redemarrer: ['RebootInstances'], reboot: ['RebootInstances'],
    terminer: ['TerminateInstances'], 'se connecter': ['DescribeInstances'], 'creer un snapshot': ['CreateSnapshot', 'CreateTags'], 'prendre un snapshot': ['CreateSnapshot', 'CreateTags'],
  },
  kms: {
    chiffrer: ['Encrypt', 'GenerateDataKey', 'DescribeKey'], dechiffrer: ['Decrypt', 'DescribeKey'], encrypt: ['Encrypt', 'GenerateDataKey', 'DescribeKey'], decrypt: ['Decrypt', 'DescribeKey'],
    utiliser: ['Encrypt', 'Decrypt', 'ReEncryptFrom', 'ReEncryptTo', 'GenerateDataKey', 'GenerateDataKeyWithoutPlaintext', 'DescribeKey'],
  },
  secretsmanager: { lire: ['GetSecretValue', 'DescribeSecret'], recuperer: ['GetSecretValue', 'DescribeSecret'], lecture: ['GetSecretValue', 'DescribeSecret'], 'lecture seule': ['GetSecretValue', 'DescribeSecret'], get: ['GetSecretValue', 'DescribeSecret'] },
  ssm: { lire: ['GetParameter', 'GetParameters', 'GetParametersByPath'], recuperer: ['GetParameter', 'GetParameters', 'GetParametersByPath'], lecture: ['GetParameter', 'GetParameters', 'GetParametersByPath'], 'lecture seule': ['GetParameter', 'GetParameters', 'GetParametersByPath'], get: ['GetParameter', 'GetParameters', 'GetParametersByPath'] },
  logs: {
    ecrire: ['CreateLogStream', 'PutLogEvents'], envoyer: ['CreateLogStream', 'PutLogEvents'], write: ['CreateLogStream', 'PutLogEvents'], publier: ['CreateLogStream', 'PutLogEvents'],
    lire: ['GetLogEvents', 'FilterLogEvents', 'DescribeLogStreams', 'DescribeLogGroups'], lecture: ['GetLogEvents', 'FilterLogEvents', 'DescribeLogStreams', 'DescribeLogGroups'], 'lecture seule': ['GetLogEvents', 'FilterLogEvents', 'DescribeLogStreams', 'DescribeLogGroups'],
  },
  ecr: {
    pousser: ['GetAuthorizationToken', 'BatchCheckLayerAvailability', 'InitiateLayerUpload', 'UploadLayerPart', 'CompleteLayerUpload', 'PutImage'], push: ['GetAuthorizationToken', 'BatchCheckLayerAvailability', 'InitiateLayerUpload', 'UploadLayerPart', 'CompleteLayerUpload', 'PutImage'],
    tirer: ['GetAuthorizationToken', 'BatchCheckLayerAvailability', 'GetDownloadUrlForLayer', 'BatchGetImage'], pull: ['GetAuthorizationToken', 'BatchCheckLayerAvailability', 'GetDownloadUrlForLayer', 'BatchGetImage'], telecharger: ['GetAuthorizationToken', 'BatchCheckLayerAvailability', 'GetDownloadUrlForLayer', 'BatchGetImage'],
  },
  sts: { assumer: ['AssumeRole'], assume: ['AssumeRole'] },
  dynamodb: { lire: ['GetItem', 'BatchGetItem', 'Query', 'Scan', 'DescribeTable'], lecture: ['GetItem', 'BatchGetItem', 'Query', 'Scan', 'DescribeTable'], ecrire: ['PutItem', 'UpdateItem', 'BatchWriteItem', 'DescribeTable'], ecriture: ['PutItem', 'UpdateItem', 'BatchWriteItem', 'DescribeTable'] },
  ses: { envoyer: ['SendEmail', 'SendRawEmail'], send: ['SendEmail', 'SendRawEmail'] },
  states: { demarrer: ['StartExecution'], lancer: ['StartExecution'], executer: ['StartExecution'] },
  events: { publier: ['PutEvents'], envoyer: ['PutEvents'] },
  kinesis: { publier: ['PutRecord', 'PutRecords', 'DescribeStreamSummary'], ecrire: ['PutRecord', 'PutRecords', 'DescribeStreamSummary'], lire: ['GetRecords', 'GetShardIterator', 'DescribeStream', 'DescribeStreamSummary', 'ListShards'], consommer: ['GetRecords', 'GetShardIterator', 'DescribeStream', 'DescribeStreamSummary', 'ListShards'] },
  cloudformation: { deployer: ['CreateStack', 'UpdateStack', 'DescribeStacks', 'DescribeStackEvents', 'GetTemplate', 'CreateChangeSet', 'ExecuteChangeSet', 'DescribeChangeSet'] },
}

// Principaux de service pour une relation d'approbation (« rôle assumable par le service X »).
export const PRINCIPAUX_SERVICE = {
  lambda: 'lambda.amazonaws.com', ec2: 'ec2.amazonaws.com', 'ecs-tasks': 'ecs-tasks.amazonaws.com', 'taches ecs': 'ecs-tasks.amazonaws.com', ecs: 'ecs-tasks.amazonaws.com', codebuild: 'codebuild.amazonaws.com',
  codepipeline: 'codepipeline.amazonaws.com', codedeploy: 'codedeploy.amazonaws.com', 'step functions': 'states.amazonaws.com', states: 'states.amazonaws.com', eventbridge: 'events.amazonaws.com',
  events: 'events.amazonaws.com', 'api gateway': 'apigateway.amazonaws.com', apigateway: 'apigateway.amazonaws.com', cloudformation: 'cloudformation.amazonaws.com', glue: 'glue.amazonaws.com',
  sagemaker: 'sagemaker.amazonaws.com', eks: 'eks.amazonaws.com', batch: 'batch.amazonaws.com', scheduler: 'scheduler.amazonaws.com', firehose: 'firehose.amazonaws.com', backup: 'backup.amazonaws.com',
  cloudfront: 'cloudfront.amazonaws.com', cloudtrail: 'cloudtrail.amazonaws.com', config: 'config.amazonaws.com', sns: 'sns.amazonaws.com', sqs: 'sqs.amazonaws.com', s3: 's3.amazonaws.com', logs: 'logs.amazonaws.com', ses: 'ses.amazonaws.com', guardduty: 'guardduty.amazonaws.com',
  rds: 'rds.amazonaws.com', 'flow logs': 'vpc-flow-logs.amazonaws.com', appsync: 'appsync.amazonaws.com', bedrock: 'bedrock.amazonaws.com', ssm: 'ssm.amazonaws.com', 'systems manager': 'ssm.amazonaws.com',
}

export const STOP_NOMS = new Set(['de', 'du', 'des', 'le', 'la', 'les', 'l', 'un', 'une', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'nomme', 'nommee', 'appele', 'appelee', 'named', 'called', 'the', 'a', 'an', 'of', 'tous', 'toutes', 'tout', 'all', 'every', 'dans', 'sur', 'pour', 'avec', 'et', 'ou', 'en', 'au', 'aux', 'chaque', 'seul', 'seule', 'uniquement', 'depuis', 'from', 'in', 'on', 'to', 'by', 'par', 'a', 'afin', 'qui', 'que', 'ainsi', 'where', 'with', 'identifie', 'id'])
