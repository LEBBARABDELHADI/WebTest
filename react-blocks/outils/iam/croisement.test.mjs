// Comparaisons avec de VRAIS outils tiers, quand ils sont présents (sinon les tests sont ignorés, jamais inventés) :
//   · Parliament (linter IAM, BSD-3)             : validation des politiques générées et accord sur les erreurs ;
//   · iam-simulate (simulateur IAM, AGPL-3.0)    : mêmes décisions que notre évaluateur sur des milliers de requêtes ;
//   · cfn-lint (CloudFormation) et python-hcl2   : validité des exports CloudFormation et Terraform.
// Ces outils ne sont JAMAIS une dépendance de l'application : installez-les dans un dossier à part et pointez-y avec
//   IAM_ORACLES=/chemin  (contient venv/ avec parliament, cfn-lint, python-hcl2, et node_modules/ avec iam-simulate).
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { catalogueTest } from './source.mjs'
import { TEXTES } from './corpus.mjs'
import { interpréter } from '../../src/lib/iam/assistant.js'
import { normaliser, versDoc } from '../../src/lib/iam/politique.js'
import { évaluer } from '../../src/lib/iam/evaluer.js'
import { valider } from '../../src/lib/iam/valider.js'
import { servicesÀCharger } from '../../src/lib/iam/etendre.js'
import { testsDepuisPlan, testsApprobation } from '../../src/lib/iam/testsauto.js'
import { versTerraform, versCloudFormation } from '../../src/lib/iam/exporter.js'

const ici = dirname(fileURLToPath(import.meta.url))
const RACINE = process.env.IAM_ORACLES ?? ''
const PY = join(RACINE, 'venv', 'bin', 'python')
const CFN = join(RACINE, 'venv', 'bin', 'cfn-lint')
const SIM = join(RACINE, 'node_modules', '@cloud-copilot', 'iam-simulate', 'dist', 'esm', 'index.js')
const python = RACINE && existsSync(PY)
const peut = module => python && spawnSync(PY, ['-c', `import ${module}`]).status === 0
const aParliament = peut('parliament')
const aHcl = peut('hcl2')
const aCfn = RACINE && existsSync(CFN)
const simulateur = RACINE && existsSync(SIM) ? await import(pathToFileURL(SIM).href) : null
const absent = nom => `${nom} absent (définir IAM_ORACLES, voir l'en-tête de ce fichier)`

const cat = await catalogueTest()

// Politiques produites par l'assistant pour toutes les descriptions du corpus.
const générées = []
for (const texte of TEXTES) {
  const { plan, politique, type } = await interpréter(texte, cat)
  générées.push({ texte, plan, politique, type })
}

// ---- Parliament ------------------------------------------------------------------------------------------------------------
const parliament = politiques => {
  const r = spawnSync(PY, ['-I', join(ici, 'oracles', 'parliament_lint.py')], { input: JSON.stringify(politiques), encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
  assert.equal(r.status, 0, r.stderr)
  return JSON.parse(r.stdout)
}
// Constats de Parliament qui disent « la politique est fausse » (pas les remarques de style ou de sécurité).
const FAUX = ['MALFORMED', 'UNKNOWN_ACTION', 'UNKNOWN_PREFIX', 'RESOURCE_MISMATCH', 'UNKNOWN_CONDITION_FOR_ACTION', 'UNKNOWN_OPERATOR', 'MISMATCHED_TYPE_OPERATOR', 'INVALID_ARN', 'BAD_PATTERN_FOR_MFA', 'MISSING_RESOURCE', 'MISSING_PRINCIPAL', 'INVALID_SID_QUANTITY', 'UNKNOWN_CONDITION_KEY', 'INVALID_CONDITION', 'UNKNOWN_ACTION_FOR_RESOURCE_POLICY']

test('Parliament : aucune politique générée par l\'assistant n\'est jugée fausse', { skip: !aParliament && absent('Parliament') }, () => {
  const identité = générées.filter(g => g.type !== 'approbation' && g.type !== 'ressource' && g.politique.déclarations.length)
  const constats = parliament(identité.map(g => versDoc(g.politique)))
  const mauvais = []
  const nouvelles = new Set()
  constats.forEach((liste, i) => {
    const jokers = identité[i].politique.déclarations.some(d => d.actions?.liste.some(a => a.includes('*')))
    for (const c of liste) {
      if (!FAUX.includes(c.issue)) continue
      // Les données de Parliament sont plus anciennes : une action absente de Parliament mais présente dans les données IAM
      // (plus récentes) du catalogue n'est pas une erreur de la politique.
      const action = /Unknown action (\S+)/.exec(c.detail)?.[1]
      if (c.issue === 'UNKNOWN_ACTION' && action && cat.action(...action.split(':'))) { nouvelles.add(action); continue }
      // Avec des actions à joker (s3:*, s3:Get*), Parliament signale celles qui ne s'appliquent pas aux ARN indiqués : voulu et sans effet.
      if (c.issue === 'RESOURCE_MISMATCH' && jokers) continue
      mauvais.push(`${identité[i].texte} → ${c.issue} ${c.detail}`)
    }
  })
  console.log(`  (actions plus récentes que les données de Parliament : ${[...nouvelles].join(', ') || 'aucune'})`)
  assert.deepEqual(mauvais, [])
  assert.ok(identité.length >= 15)
})

// Corpus de politiques fausses : Parliament et notre validateur doivent s'accorder sur le diagnostic.
const FAUSSES = [
  ['action inconnue', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObjekt', Resource: '*' }] }, 'ACTION_INCONNUE', 'UNKNOWN_ACTION'],
  ['préfixe inconnu', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'lamda:InvokeFunction', Resource: '*' }] }, 'PRÉFIXE_INCONNU', 'UNKNOWN_PREFIX'],
  ['GetObject sur le bucket', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b' }] }, 'RESSOURCE_INCOMPATIBLE', 'RESOURCE_MISMATCH'],
  ['ListBucket sur les objets', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:ListBucket', Resource: 'arn:aws:s3:::b/*' }] }, 'RESSOURCE_INCOMPATIBLE', 'RESOURCE_MISMATCH'],
  ['Describe sur une instance', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'ec2:DescribeInstances', Resource: 'arn:aws:ec2:eu-west-3:123456789012:instance/*' }] }, 'RESSOURCE_INCOMPATIBLE', 'RESOURCE_MISMATCH'],
  ['clé s3:prefix sur GetObject', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*', Condition: { StringEquals: { 's3:prefix': 'x' } } }] }, 'CLÉ_NON_APPLICABLE', 'UNKNOWN_CONDITION_FOR_ACTION'],
  ['motif MFA', { Version: '2012-10-17', Statement: [{ Effect: 'Deny', Action: '*', Resource: '*', Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'false' } } }] }, 'MFA_MOTIF', 'BAD_PATTERN_FOR_MFA'],
  ['opérateur inconnu', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*', Condition: { StringEqualz: { 'aws:SourceIp': 'x' } } }] }, 'OPÉRATEUR_INCONNU', 'UNKNOWN_OPERATOR'],
  ['ressource manquante', { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject' }] }, 'RESSOURCE_MANQUANTE', 'MALFORMED'],
]
const SAINES = [
  { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject', 's3:GetObjectVersion'], Resource: 'arn:aws:s3:::mon-bucket/*' }, { Effect: 'Allow', Action: ['s3:GetBucketLocation', 's3:ListBucket'], Resource: 'arn:aws:s3:::mon-bucket' }] },
  { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'ec2:DescribeInstances', Resource: '*' }, { Effect: 'Allow', Action: ['ec2:StartInstances', 'ec2:StopInstances'], Resource: 'arn:aws:ec2:*:*:instance/*', Condition: { StringEquals: { 'aws:ResourceTag/Environment': 'dev' } } }] },
  { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['dynamodb:Query', 'dynamodb:GetItem'], Resource: ['arn:aws:dynamodb:eu-west-3:123456789012:table/t', 'arn:aws:dynamodb:eu-west-3:123456789012:table/t/index/*'] }] },
  { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'sqs:SendMessage', Resource: 'arn:aws:sqs:eu-west-3:123456789012:jobs' }, { Effect: 'Allow', Action: 'lambda:InvokeFunction', Resource: 'arn:aws:lambda:eu-west-3:123456789012:function:f' }] },
]
test('Parliament : accord avec notre validateur sur les politiques fausses et saines', { skip: !aParliament && absent('Parliament') }, async () => {
  const toutes = [...FAUSSES.map(f => f[1]), ...SAINES]
  const constats = parliament(toutes)
  for (const [i, [nom, doc, nôtre, leur]] of FAUSSES.entries()) {
    await cat.charger(servicesÀCharger(cat, normaliser(doc)))
    const mien = valider(doc, { type: 'identite', cat }).constats.map(c => c.code)
    const sien = constats[i].map(c => c.issue)
    assert.ok(sien.includes(leur), `${nom} : Parliament devrait signaler ${leur} (obtenu ${sien})`)
    assert.ok(mien.includes(nôtre), `${nom} : notre validateur devrait signaler ${nôtre} (obtenu ${mien})`)
  }
  for (const [k, doc] of SAINES.entries()) {
    await cat.charger(servicesÀCharger(cat, normaliser(doc)))
    const mien = valider(doc, { type: 'identite', cat })
    assert.equal(mien.résumé.erreurs, 0, JSON.stringify(mien.constats))
    assert.deepEqual(constats[FAUSSES.length + k].filter(c => FAUX.includes(c.issue)), [], `saine n°${k + 1}`)
  }
})

// ---- cfn-lint et python-hcl2 ----------------------------------------------------------------------------------------------------------
test('cfn-lint : les gabarits CloudFormation exportés sont valides', { skip: !aCfn && absent('cfn-lint') }, () => {
  const dossier = mkdtempSync(join(tmpdir(), 'iam-cfn-'))
  let n = 0
  for (const g of générées) {
    if (!g.politique.déclarations.length) continue
    // Les bucket policies de nos exemples portent sur des buckets réels ; les autres types restent génériques.
    const modèle = versCloudFormation(g.politique, { nom: `Exemple${++n}`, type: g.type })
    const fichier = join(dossier, `t${n}.yaml`)
    writeFileSync(fichier, modèle)
    const r = spawnSync(CFN, [fichier], { encoding: 'utf8' })
    assert.equal(r.status, 0, `${g.texte}\n${r.stdout}${r.stderr}`)
  }
  assert.ok(n >= 25)
})

test('python-hcl2 : le Terraform exporté est lu et redonne exactement la politique', { skip: !aHcl && absent('python-hcl2') }, () => {
  let n = 0
  for (const g of générées) {
    if (!g.politique.déclarations.length) continue
    const hcl = versTerraform(g.politique, { nom: `exemple ${++n}`, type: g.type })
    const r = spawnSync(PY, ['-I', join(ici, 'oracles', 'hcl_lire.py')], { input: hcl, encoding: 'utf8' })
    assert.equal(r.status, 0, `${g.texte}\n${r.stderr}`)
    const arbre = JSON.parse(r.stdout)
    const bloc = arbre.data.find(d => d.aws_iam_policy_document).aws_iam_policy_document
    const statements = Object.values(bloc)[0].statement
    const déséchapper = x => (typeof x === 'string' ? x.replace(/\$\$\{/g, '${').replace(/%%\{/g, '%{') : x)
    assert.equal(statements.length, g.politique.déclarations.length, g.texte)
    // Relecture : mêmes actions, ressources, effets et conditions.
    statements.forEach((s, i) => {
      const d = g.politique.déclarations[i]
      assert.equal(s.effect, d.effet, g.texte)
      if (d.actions) assert.deepEqual(s[d.actions.inverse ? 'not_actions' : 'actions'].map(déséchapper), d.actions.liste, g.texte)
      if (d.ressources) assert.deepEqual(s[d.ressources.inverse ? 'not_resources' : 'resources'].map(déséchapper), d.ressources.liste, g.texte)
      assert.equal((s.condition ?? []).length, d.conditions.length, g.texte)
      for (const [k, c] of (s.condition ?? []).entries()) { assert.equal(c.test, d.conditions[k].opérateur); assert.equal(c.variable, d.conditions[k].clé); assert.deepEqual(c.values.map(déséchapper), d.conditions[k].valeurs.map(String)) }
    })
  }
  assert.ok(n >= 25)
})

// ---- iam-simulate ----------------------------------------------------------------------------------------------------------------------
const COMPTE = '123456789012'
const PRINCIPAL = `arn:aws:iam::${COMPTE}:user/u`
const compteDe = arn => /^arn:[^:]*:[^:]*:[^:]*:(\d{12}):/.exec(arn)?.[1] ?? COMPTE

// Même requête, deux évaluateurs. Renvoie { mien, leur } ou null si le simulateur refuse la requête (validation de ses entrées).
async function comparer(politiques, requête, type = 'identite') {
  const couche = { identite: 'identityPolicies', plafond: 'permissionsBoundaries' }[type]
  void couche
  const r = await simulateur.runSimulation({
    identityPolicies: politiques.map((p, i) => ({ name: `p${i}`, policy: p })),
    serviceControlPolicies: [], resourceControlPolicies: [],
    request: { principal: PRINCIPAL, action: requête.action, resource: { resource: requête.ressource, accountId: compteDe(requête.ressource) }, contextVariables: requête.contexte ?? {} },
  }, {})
  if (r.resultType === 'error') return { erreur: r.errors?.message ?? JSON.stringify(r.errors) }
  const leur = { Allowed: 'autorisation-explicite', ExplicitlyDenied: 'refus-explicite', ImplicitlyDenied: 'refus-implicite' }[r.overallResult]
  const mien = évaluer({ ...requête, principal: undefined }, { identité: politiques.map(p => normaliser(p)) }, { contexteAuto: false }).motif
  return { mien, leur, résultat: r.overallResult }
}

const prng = graine => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

test('iam-simulate : mêmes décisions sur les politiques de l\'assistant et leurs tests automatiques', { skip: !simulateur && absent('iam-simulate') }, async () => {
  let comparés = 0
  let refusés = 0
  let réservés = 0
  const écarts = []
  for (const g of générées.filter(x => x.type === 'identite' && x.politique.déclarations.length)) {
    const requêtes = testsDepuisPlan(g.plan, cat).map(t => t.requête)
    for (const q of requêtes) {
      // Écart documenté : pour KMS, le simulateur exige aussi une politique de clé (une identité seule ne suffit pas) ;
      // notre outil le signale à part (hypothèse de l'assistant et constat KMS_POLITIQUE_DE_CLÉ).
      if (q.action.startsWith('kms:')) { réservés++; continue }
      const r = await comparer([versDoc(g.politique)], q)
      if (r.erreur) { refusés++; continue }
      comparés++
      if (r.mien !== r.leur) écarts.push(`${g.texte} | ${q.action} ${q.ressource} ${JSON.stringify(q.contexte)} → mien ${r.mien}, simulateur ${r.leur}`)
    }
  }
  assert.deepEqual(écarts, [])
  assert.ok(comparés > 200, `${comparés} requêtes comparées (${refusés} refusées par la validation du simulateur)`)
  assert.ok(refusés < comparés * 0.1, `trop de requêtes rejetées par le simulateur : ${refusés}`)
  assert.ok(réservés > 0 && réservés < comparés * 0.1)
  console.log(`  (${comparés} requêtes identiques, ${refusés} rejetées par la validation du simulateur, ${réservés} KMS réservées)`)
})

const ACTIONS = ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:Get*', 's3:*', 'ec2:DescribeInstances', 'ec2:StartInstances', 'ec2:*', 'iam:ListUsers', 'iam:*', '*', 'S3:getobject', 'sqs:SendMessage', 'sqs:Send*']
const RESSOURCES = ['*', 'arn:aws:s3:::b/*', 'arn:aws:s3:::b', 'arn:aws:s3:::b/p/*', 'arn:aws:s3:::*', 'arn:aws:ec2:*:*:instance/*', 'arn:aws:ec2:eu-west-3:123456789012:instance/i-1', 'arn:aws:sqs:eu-west-3:123456789012:q*', 'arn:aws:s3:::b?/*']
const CONDITIONS = [
  null,
  { Bool: { 'aws:MultiFactorAuthPresent': 'true' } },
  { BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' } },
  { IpAddress: { 'aws:SourceIp': '203.0.113.0/24' } },
  { NotIpAddress: { 'aws:SourceIp': ['203.0.113.0/24', '10.0.0.0/8'] } },
  { StringEquals: { 'aws:RequestedRegion': ['eu-west-3', 'eu-west-1'] } },
  { StringNotEquals: { 'aws:RequestedRegion': 'eu-west-3' } },
  { StringLike: { 'aws:RequestedRegion': 'eu-*' } },
  { StringNotLike: { 'aws:RequestedRegion': 'us-*' } },
  { DateLessThan: { 'aws:CurrentTime': '2030-01-01T00:00:00Z' } },
  { DateGreaterThan: { 'aws:CurrentTime': '2030-01-01T00:00:00Z' } },
  { 'ForAnyValue:StringEquals': { 'aws:TagKeys': ['a', 'b'] } },
  { 'ForAllValues:StringEquals': { 'aws:TagKeys': ['a', 'b'] } },
  { Null: { 'aws:TagKeys': 'true' } },
  { Null: { 'aws:MultiFactorAuthPresent': 'false' } },
  { StringEqualsIfExists: { 'aws:RequestedRegion': 'eu-west-3' } },
  { Bool: { 'aws:SecureTransport': 'true' }, IpAddress: { 'aws:SourceIp': '203.0.113.0/24' } },
]
const REQUÊTES = [
  ['s3:GetObject', 'arn:aws:s3:::b/k'], ['s3:GetObject', 'arn:aws:s3:::b/p/x'], ['s3:GetObject', 'arn:aws:s3:::other/k'], ['s3:PutObject', 'arn:aws:s3:::b/k'], ['s3:ListBucket', 'arn:aws:s3:::b'], ['s3:ListBucket', 'arn:aws:s3:::other'],
  ['ec2:DescribeInstances', '*'], ['ec2:StartInstances', 'arn:aws:ec2:eu-west-3:123456789012:instance/i-1'], ['ec2:StartInstances', 'arn:aws:ec2:us-east-1:123456789012:instance/i-2'],
  ['iam:ListUsers', '*'], ['sqs:SendMessage', 'arn:aws:sqs:eu-west-3:123456789012:q1'], ['sqs:SendMessage', 'arn:aws:sqs:eu-west-3:123456789012:other'],
]
const CONTEXTES = [
  {}, { 'aws:MultiFactorAuthPresent': 'true' }, { 'aws:MultiFactorAuthPresent': 'false' }, { 'aws:SourceIp': '203.0.113.5' }, { 'aws:SourceIp': '8.8.8.8' }, { 'aws:SourceIp': '10.1.1.1', 'aws:MultiFactorAuthPresent': 'true' },
  { 'aws:RequestedRegion': 'eu-west-3' }, { 'aws:RequestedRegion': 'us-east-1' }, { 'aws:RequestedRegion': 'eu-west-1', 'aws:MultiFactorAuthPresent': 'true' },
  { 'aws:CurrentTime': '2029-06-01T00:00:00Z' }, { 'aws:CurrentTime': '2031-06-01T00:00:00Z' }, { 'aws:TagKeys': ['a'] }, { 'aws:TagKeys': ['a', 'z'] }, { 'aws:TagKeys': ['a', 'b'] },
  { 'aws:SecureTransport': 'true', 'aws:SourceIp': '203.0.113.9' }, { 'aws:SecureTransport': 'false' },
]

test('iam-simulate : mêmes décisions sur des politiques aléatoires (déclarations, NotAction, NotResource, conditions…)', { skip: !simulateur && absent('iam-simulate') }, async () => {
  const hasard = prng(20261116)
  const choisir = xs => xs[Math.floor(hasard() * xs.length)]
  let comparés = 0
  let refusés = 0
  const écarts = []
  for (let k = 0; k < 220; k++) {
    const n = 1 + Math.floor(hasard() * 3)
    const déclarations = []
    for (let i = 0; i < n; i++) {
      const d = { Effect: hasard() < 0.25 ? 'Deny' : 'Allow' }
      const inverseA = hasard() < 0.15
      const acts = Array.from({ length: 1 + Math.floor(hasard() * 2) }, () => choisir(ACTIONS))
      d[inverseA ? 'NotAction' : 'Action'] = acts
      const inverseR = hasard() < 0.15
      d[inverseR ? 'NotResource' : 'Resource'] = Array.from({ length: 1 + Math.floor(hasard() * 2) }, () => choisir(RESSOURCES))
      const c = choisir(CONDITIONS)
      if (c) d.Condition = c
      déclarations.push(d)
    }
    const politique = { Version: '2012-10-17', Statement: déclarations }
    for (let j = 0; j < 6; j++) {
      const [action, ressource] = choisir(REQUÊTES)
      const contexte = { ...choisir(CONTEXTES), ...(hasard() < 0.3 ? choisir(CONTEXTES) : {}) }
      const r = await comparer([politique], { action, ressource, contexte })
      if (r.erreur) { refusés++; continue }
      comparés++
      if (r.mien !== r.leur) écarts.push(`${JSON.stringify(politique)} | ${action} ${ressource} ${JSON.stringify(contexte)} → mien ${r.mien}, simulateur ${r.leur}`)
    }
  }
  assert.deepEqual(écarts.slice(0, 5), [], `${écarts.length} écart(s) sur ${comparés} requêtes comparées`)
  assert.ok(comparés > 800, `${comparés} requêtes comparées (${refusés} rejetées)`)
  console.log(`  (${comparés} requêtes aléatoires identiques, ${refusés} rejetées par la validation du simulateur)`)
})
