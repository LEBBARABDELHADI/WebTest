// Exports d'une politique : JSON, YAML, Terraform (aws_iam_policy_document), CloudFormation (YAML),
// AWS CLI (script bash avec heredoc protégé : aucune expansion de $ ni de `).
import yaml from 'js-yaml'
import { versDoc } from './politique.js'

const slug = (s, sép = '_') => String(s || 'politique').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, sép).replace(new RegExp(`^${sép}+|${sép}+$`, 'g'), '').toLowerCase() || 'politique'
const pascal = s => slug(s, ' ').split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join('')
const chaîne = v => (typeof v === 'string' ? v : String(v))

// ---- JSON / YAML ---------------------------------------------------------------------------------------------------

export const versJson = (politique, options = {}) => JSON.stringify(versDoc(politique, options), null, 2)
export const versJsonCompact = (politique, options = {}) => JSON.stringify(versDoc(politique, options))
export const versYaml = (politique, options = {}) => yaml.dump(versDoc(politique, options), { lineWidth: 120, noRefs: true, quotingType: '"' })

// ---- Terraform --------------------------------------------------------------------------------------------------------

// Chaîne HCL : \ " et les séquences d'interpolation (${ → $${, %{ → %%{) sont protégés.
const hcl = s => `"${chaîne(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\$\{/g, () => '$${').replace(/%\{/g, () => '%%{')}"`
const liste = (xs, marge) => (xs.length <= 1 ? `[${xs.map(hcl).join(', ')}]` : `[\n${xs.map(x => `${marge}  ${hcl(x)},`).join('\n')}\n${marge}]`)

function déclarationTerraform(d, marge = '  ') {
  const l = []
  const m = marge
  l.push(`${m}statement {`)
  if (d.sid) l.push(`${m}  sid    = ${hcl(d.sid)}`)
  l.push(`${m}  effect = ${hcl(d.effet)}`)
  if (d.principal) {
    const bloc = d.principal.inverse ? 'not_principals' : 'principals'
    if (d.principal.valeurs === '*') l.push(`${m}  ${bloc} {\n${m}    type        = "*"\n${m}    identifiers = ["*"]\n${m}  }`)
    else for (const [type, ids] of Object.entries(d.principal.valeurs)) l.push(`${m}  ${bloc} {\n${m}    type        = ${hcl(type)}\n${m}    identifiers = ${liste(ids, `${m}    `)}\n${m}  }`)
  }
  if (d.actions) l.push(`${m}  ${d.actions.inverse ? 'not_actions' : 'actions'} = ${liste(d.actions.liste, `${m}  `)}`)
  if (d.ressources) l.push(`${m}  ${d.ressources.inverse ? 'not_resources' : 'resources'} = ${liste(d.ressources.liste, `${m}  `)}`)
  for (const c of d.conditions ?? []) {
    l.push(`${m}  condition {\n${m}    test     = ${hcl(c.opérateur)}\n${m}    variable = ${hcl(c.clé)}\n${m}    values   = ${liste(c.valeurs.map(chaîne), `${m}    `)}\n${m}  }`)
  }
  l.push(`${m}}`)
  return l.join('\n')
}

export function versTerraform(politique, { nom = 'politique', type = 'identite', description = '' } = {}) {
  const id = slug(nom)
  const doc = `data "aws_iam_policy_document" "${id}" {\n${politique.déclarations.map(d => déclarationTerraform(d)).join('\n\n')}\n}\n`
  if (type === 'approbation') {
    return `${doc}
resource "aws_iam_role" "${id}" {
  name               = ${hcl(pascal(nom))}
  assume_role_policy = data.aws_iam_policy_document.${id}.json
}
`
  }
  if (type === 'ressource') {
    const bucket = politique.déclarations.flatMap(d => d.ressources?.liste ?? []).map(r => /^arn:[^:]+:s3:::([^/]+)/.exec(r)?.[1]).find(Boolean)
    if (bucket) return `${doc}
resource "aws_s3_bucket_policy" "${id}" {
  bucket = ${hcl(bucket)} # ou aws_s3_bucket.xxx.id
  policy = data.aws_iam_policy_document.${id}.json
}
`
    return `${doc}
# Attachez data.aws_iam_policy_document.${id}.json à la ressource voulue (file SQS, topic SNS, clé KMS, secret…).
`
  }
  if (type === 'scp') {
    return `${doc}
resource "aws_organizations_policy" "${id}" {
  name        = ${hcl(pascal(nom))}
  description = ${hcl(description || 'SCP générée')}
  type        = "SERVICE_CONTROL_POLICY"
  content     = data.aws_iam_policy_document.${id}.json
}
`
  }
  return `${doc}
resource "aws_iam_policy" "${id}" {
  name        = ${hcl(pascal(nom))}
  description = ${hcl(description || 'Politique générée')}
  policy      = data.aws_iam_policy_document.${id}.json
}
`
}

// ---- CloudFormation ---------------------------------------------------------------------------------------------------------

export function versCloudFormation(politique, { nom = 'politique', type = 'identite', description = '' } = {}) {
  const doc = versDoc(politique)
  const logique = pascal(nom)
  let ressources
  if (type === 'approbation') ressources = { [`${logique}Role`]: { Type: 'AWS::IAM::Role', Properties: { RoleName: logique, AssumeRolePolicyDocument: doc } } }
  else if (type === 'ressource') {
    const bucket = politique.déclarations.flatMap(d => d.ressources?.liste ?? []).map(r => /^arn:[^:]+:s3:::([^/]+)/.exec(r)?.[1]).find(Boolean)
    ressources = bucket
      ? { [`${logique}BucketPolicy`]: { Type: 'AWS::S3::BucketPolicy', Properties: { Bucket: bucket, PolicyDocument: doc } } }
      : { [`${logique}Policy`]: { Type: 'AWS::IAM::ManagedPolicy', Properties: { ManagedPolicyName: logique, Description: 'Remplacez par la ressource qui porte la politique (file SQS, topic SNS, clé KMS…)', PolicyDocument: doc } } }
  } else if (type === 'scp') ressources = { [`${logique}Scp`]: { Type: 'AWS::Organizations::Policy', Properties: { Name: logique, Type: 'SERVICE_CONTROL_POLICY', Description: description || 'SCP générée', Content: doc, TargetIds: ['r-xxxx (racine, OU ou compte)'] } } }
  else ressources = { [`${logique}Policy`]: { Type: 'AWS::IAM::ManagedPolicy', Properties: { ManagedPolicyName: logique, Description: description || 'Politique générée', PolicyDocument: doc } } }
  return yaml.dump({ AWSTemplateFormatVersion: '2010-09-09', Description: description || `Politique IAM ${logique}`, Resources: ressources }, { lineWidth: 120, noRefs: true, quotingType: '"' })
}

// ---- AWS CLI ----------------------------------------------------------------------------------------------------------------------------

// Texte protégé pour le shell : entre apostrophes.
const sh = s => `'${String(s).replace(/'/g, `'\\''`)}'`

export function versCli(politique, { nom = 'politique', type = 'identite', description = '' } = {}) {
  const json = versJson(politique)
  const n = pascal(nom)
  const fichier = type === 'approbation' ? 'trust-policy.json' : 'policy.json'
  const écrire = `cat > ${fichier} <<'EOF'\n${json}\nEOF\n`
  if (type === 'approbation') return `${écrire}\naws iam create-role --role-name ${sh(n)} --assume-role-policy-document file://${fichier}\n# Attachez ensuite des permissions :\n# aws iam attach-role-policy --role-name ${sh(n)} --policy-arn arn:aws:iam::aws:policy/<politique>\n`
  if (type === 'ressource') {
    const bucket = politique.déclarations.flatMap(d => d.ressources?.liste ?? []).map(r => /^arn:[^:]+:s3:::([^/]+)/.exec(r)?.[1]).find(Boolean)
    if (bucket) return `${écrire}\naws s3api put-bucket-policy --bucket ${sh(bucket)} --policy file://${fichier}\n`
    return `${écrire}\n# Appliquez ce document à la ressource voulue, par exemple :\n# aws sqs set-queue-attributes --queue-url <url> --attributes Policy="$(jq -c . ${fichier})"\n# aws sns set-topic-attributes --topic-arn <arn> --attribute-name Policy --attribute-value file://${fichier}\n# aws kms put-key-policy --key-id <id> --policy-name default --policy file://${fichier}\n`
  }
  if (type === 'scp') return `${écrire}\naws organizations create-policy --name ${sh(n)} --description ${sh(description || 'SCP générée')} --type SERVICE_CONTROL_POLICY --content file://${fichier}\n# puis : aws organizations attach-policy --policy-id <p-xxxx> --target-id <r-xxxx|ou-xxxx|compte>\n`
  if (type === 'plafond') return `${écrire}\naws iam create-policy --policy-name ${sh(n)} --policy-document file://${fichier}\n# puis : aws iam put-role-permissions-boundary --role-name <rôle> --permissions-boundary arn:aws:iam::<compte>:policy/${n}\n`
  return `${écrire}\naws iam create-policy --policy-name ${sh(n)} --description ${sh(description || 'Politique générée')} --policy-document file://${fichier}\n# puis : aws iam attach-role-policy --role-name <rôle> --policy-arn arn:aws:iam::<compte>:policy/${n}\n`
}

export const FORMATS = [
  ['json', 'JSON', 'json'],
  ['terraform', 'Terraform', 'hcl'],
  ['cloudformation', 'CloudFormation', 'yaml'],
  ['cli', 'AWS CLI', 'bash'],
  ['yaml', 'YAML', 'yaml'],
]

export function exporter(format, politique, options = {}) {
  switch (format) {
    case 'terraform': return versTerraform(politique, options)
    case 'cloudformation': return versCloudFormation(politique, options)
    case 'cli': return versCli(politique, options)
    case 'yaml': return versYaml(politique)
    default: return versJson(politique)
  }
}
