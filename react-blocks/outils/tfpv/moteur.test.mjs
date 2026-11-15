// Tests du moteur tfpv embarqué dans l'application (node --test).
// Les attentes reprennent ce qu'ont produit les vrais outils sur les mêmes
// fichiers : terraform 1.17.2 (validate), TFLint 0.66.0 + ruleset AWS 0.50.0,
// Checkov 3.4.5 (voir terraform-preplan-validator/tests/).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyser } from '../../src/lib/tfpv/moteur/index.js'
import { Évaluateur, INCONNU, PORTÉE_VIDE, analyserJetons, lireCidr } from '../../src/lib/tfpv/moteur/expr.js'
import { lireHcl } from '../../src/lib/tfpv/moteur/hcl.js'
import { typeDepuisAst, vérifierValeur } from '../../src/lib/tfpv/moteur/types.js'

const ICI = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(ICI, '../..')
const FIXTURES = path.resolve(APP, '../terraform-preplan-validator/tests/fixtures')
const lireJson = f => JSON.parse(fs.readFileSync(path.join(APP, 'public/tfpv', f), 'utf8'))
const DONNÉES = { schémas: { aws: lireJson('schema-aws.json'), ...lireJson('schema-autres.json') }, tflint: lireJson('tflint-aws.json') }

function fichiers(nom) {
  const out = []
  const parcourir = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) parcourir(p, r)
      else out.push({ path: r, content: fs.readFileSync(p, 'utf8') })
    }
  }
  parcourir(path.join(FIXTURES, nom), nom)
  return out
}
const scan = (f, options) => analyser({ fichiers: f, options, données: DONNÉES })
const clés = r => new Set(r.findings.map(f => `${f.rule_id} ${f.file}:${f.line}`))

test('invalid_aws : les erreurs des vrais outils et celles que seul tfpv voit', async () => {
  const r = await scan(fichiers('invalid_aws'))
  assert.equal(r.status, 'FAILED')
  const k = clés(r)
  for (const attendu of [
    'AWS_INVALID_INSTANCE_TYPE main.tf:3', // TFLint
    'TF_UNDECLARED_REFERENCE network.tf:47', // terraform validate
    'SG_SSH_OPEN_TO_INTERNET network.tf:28', // Checkov CKV_AWS_24
    'TF_FORMAT unformatted.tf:2', // terraform fmt
    'TF_VARIABLE_TYPE_MISMATCH terraform.tfvars:1', 'TF_MISSING_VARIABLE_VALUE variables.tf:20', // erreurs du plan (laboratoire)
    'EBS_IOPS_NOT_SUPPORTED storage.tf:9', 'NET_SUBNET_OUTSIDE_VPC network.tf:17', 'NET_SUBNET_OVERLAP network.tf:12',
    'RDS_MULTI_AZ_WITH_AZ storage.tf:22', 'IAM_INVALID_PRINCIPAL iam.tf:15', 'EC2_AMI_ID_MALFORMED main.tf:13',
  ]) assert.ok(k.has(attendu), `${attendu} manquant`)
  assert.equal(r.checks.find(c => c.id === 'schema').findings, 0) // validate n'a rien d'autre à redire
  assert.ok(!JSON.stringify(r).includes('Sup3rS3cretPassw0rd'))
})

test('valid_basic : validé, et le #checkov:skip est respecté', async () => {
  const r = await scan(fichiers('valid_basic'))
  assert.equal(r.status, 'PASSED', r.status_reason)
  assert.equal(r.findings.length, 0)
  assert.deepEqual(r.suppressed.map(f => f.rule_id), ['VPC_FLOW_LOGS'])
})

test('schéma : les 9 erreurs de terraform validate (dont 2 qu\'il ne remonte qu\'au 2e passage)', async () => {
  const r = await scan(fichiers('schema_errors'))
  const k = clés(r)
  for (const attendu of ['TF_INVALID_RESOURCE_TYPE main.tf:14', 'TF_UNSUPPORTED_ARGUMENT main.tf:20', 'TF_UNCONFIGURABLE_ATTRIBUTE main.tf:21', 'TF_INVALID_ARGUMENT_VALUE main.tf:22',
    'TF_BLOCK_COUNT main.tf:28', 'TF_UNSUPPORTED_BLOCK main.tf:32', 'TF_MISSING_REQUIRED_ARGUMENT main.tf:37', 'TF_UNSUPPORTED_BLOCK main.tf:43', 'TF_UNSUPPORTED_ATTRIBUTE main.tf:49']) assert.ok(k.has(attendu), `${attendu} manquant`)
  const type = r.findings.find(f => f.rule_id === 'TF_INVALID_RESOURCE_TYPE')
  assert.match(type.message, /Did you mean "aws_instance"\?/)
  assert.equal(r.findings.filter(f => f.engines.includes('schema')).length, 9)
})

test('règles AWS de TFLint : les 9 constats du vrai TFLint', async () => {
  const r = await scan(fichiers('tflint_rules'))
  const vus = new Set(r.findings.flatMap(f => f.engine_rules.map(e => `${e}:${f.line}`)))
  for (const attendu of ['aws_ebs_volume_invalid_type:18', 'aws_db_instance_invalid_engine:23', 'aws_db_instance_invalid_type:24', 'aws_instance_previous_type:32',
    'aws_lambda_function_deprecated_runtime:39', 'aws_s3_bucket_name:44', 'aws_route_not_specified_target:47', 'aws_iam_role_invalid_name:58']) assert.ok(vus.has(attendu), `${attendu} manquant`)
})

test('modules locaux : valeurs suivies à travers les modules', async () => {
  const r = await scan(fichiers('modules_local'))
  const parRègle = Object.fromEntries(r.findings.map(f => [f.rule_id, f]))
  assert.equal(parRègle.NET_SUBNET_OUTSIDE_VPC.resource, 'module.network.aws_subnet.b')
  assert.equal(parRègle.IAM_INVALID_PRINCIPAL.value, '12345678901')
  assert.equal(parRègle.TF_MISSING_REQUIRED_ARGUMENT.resource, 'module.app')
})

test('syntaxe, module manquant, exemple de la demande', async () => {
  const s = await scan(fichiers('syntax_error'))
  const f = s.findings.find(x => x.rule_id === 'TF_SYNTAX_ERROR')
  assert.equal(f.severity, 'CRITICAL')
  assert.equal(f.line, 7)
  const m = await scan(fichiers('module_missing'))
  assert.ok(m.findings.some(x => x.rule_id === 'TF_LOCAL_MODULE_NOT_FOUND' && x.resource === 'module.ghost'))
  const u = await scan(fichiers('user_example'))
  const i = u.findings.find(x => x.rule_id === 'AWS_INVALID_INSTANCE_TYPE')
  assert.deepEqual([i.file, i.line, i.resource, i.value], ['main.tf', 3, 'aws_instance.example', 't3.invalid'])
  assert.match(i.recommendation, /Verify that the instance type exists in the selected AWS region/)
})

test('secrets : jamais dans le rapport', async () => {
  const clé = 'AKIA' + 'IOSFODNN7' + 'EXAMPLE'
  const secret = 'wJalrXUtnFEMI/K7MDENG/' + 'bPxRfiCY' + 'EXAMPLEKEY'
  const f = fichiers('secrets').map(x => ({ ...x, content: x.content.replace('__FAKE_ACCESS_KEY__', clé).replace('__FAKE_SECRET_KEY__', secret) }))
  const r = await scan(f)
  const tout = JSON.stringify(r)
  for (const s of [clé, secret, 'Tr0ub4dor&3-horse-battery']) assert.ok(!tout.includes(s), `${s.slice(0, 6)}… a fuité`)
  assert.ok(r.findings.some(x => x.rule_id === 'PROVIDER_HARDCODED_CREDENTIALS'))
})

test('jamais « validé » si une partie n\'a pas pu être analysée', async () => {
  const distant = await scan([{ path: 'main.tf', content: 'module "vpc" {\n  source  = "terraform-aws-modules/vpc/aws"\n  version = "5.0.0"\n}\n' }])
  assert.equal(distant.status, 'INCOMPLETE')
  assert.match(distant.status_reason, /not analysed/)
  const k8s = await scan([{ path: 'main.tf', content: 'resource "kubernetes_namespace" "n" {\n  metadata {\n    name = "x"\n  }\n}\n' }])
  assert.equal(k8s.status, 'INCOMPLETE')
  assert.match(k8s.status_reason, /no embedded schema for provider\(s\) kubernetes/)
})

test('code collé, variables fournies par la CI, fichiers de variables choisis', async () => {
  const code = 'variable "env" {\n  type = string\n}\n\nresource "random_id" "x" {\n  byte_length = 8\n}\n'
  const sans = await scan([{ path: 'main.tf', content: code }])
  assert.ok(sans.findings.some(f => f.rule_id === 'TF_MISSING_VARIABLE_VALUE'))
  const ci = await scan([{ path: 'main.tf', content: code }], { variablesExternes: ['env'] })
  assert.ok(!ci.findings.some(f => f.rule_id === 'TF_MISSING_VARIABLE_VALUE'))
  const choisi = await scan([{ path: 'main.tf', content: code }, { path: 'env/prod.tfvars', content: 'env = "prod"\n' }], { fichiersVariables: ['env/prod.tfvars'] })
  assert.ok(!choisi.findings.some(f => f.rule_id === 'TF_MISSING_VARIABLE_VALUE'))
  assert.equal(choisi.status, 'PASSED', choisi.status_reason)
})

test('suppressions : tfpv:ignore, tflint-ignore et réglages', async () => {
  const code = 'resource "aws_instance" "w" {\n  ami           = "ami-0123456789abcdef0"\n  instance_type = "t3.nope" # tfpv:ignore AWS_INVALID_INSTANCE_TYPE -- type récent, vérifié\n\n  metadata_options {\n    http_tokens = "required"\n  }\n\n  root_block_device {\n    encrypted = true\n  }\n}\n'
  const r = await scan([{ path: 'main.tf', content: code }])
  assert.deepEqual(r.suppressed.map(f => [f.rule_id, f.suppression_reason]), [['AWS_INVALID_INSTANCE_TYPE', 'type récent, vérifié']])
  assert.equal(r.status, 'PASSED', r.status_reason)
})

test('évaluateur, types, CIDR', () => {
  const ev = src => new Évaluateur(PORTÉE_VIDE).éval(analyserJetons(lireHcl(`a = ${src}\n`, 'x.tfvars', true).attributes.a.tokens))
  assert.equal(ev('cidrsubnet("10.0.0.0/16", 8, 1)'), '10.0.1.0/24')
  assert.equal(ev('format("%s-%d", "a", 3)'), 'a-3')
  assert.equal(ev('var.x'), INCONNU)
  assert.equal(ev('[for s in ["a"] : s]'), INCONNU)
  const t = src => typeDepuisAst(analyserJetons(lireHcl(`a = ${src}\n`, 'x.tfvars', true).attributes.a.tokens))
  assert.ok(vérifierValeur('three', t('number')))
  assert.equal(vérifierValeur('3', t('number')), null)
  assert.match(vérifierValeur({ a: 'x' }, t('object({ a = string, b = number })')), /attribute "b" is required/)
  assert.equal(lireCidr('10.0.1.5/24').suggestion, '10.0.1.0/24')
})

test('données embarquées complètes', () => {
  assert.ok(DONNÉES.schémas.aws.r.aws_instance && DONNÉES.schémas.aws.d.aws_ami)
  assert.ok(DONNÉES.tflint.generated.length > 1300)
  const nonCompilées = DONNÉES.tflint.generated.filter(r => r.p).filter(r => { try { new RegExp(r.p, r.f); return false } catch { try { new RegExp(r.p, r.f.replace('u', '')); return false } catch { return true } } })
  assert.equal(nonCompilées.length, 0)
})
