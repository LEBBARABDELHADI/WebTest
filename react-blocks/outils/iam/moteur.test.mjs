// Tests du moteur IAM : jokers, ARN, conditions, évaluation, validation, assistant (avec ses tests
// automatiques exécutés), exports et intégrité des données. `npm run test:iam`.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { catalogueTest, DOSSIER_DONNEES } from './source.mjs'
import { correspond, compiler, intersecte } from '../../src/lib/iam/glob.js'
import { analyserArn, arnCompatible, instancier } from '../../src/lib/iam/arn.js'
import { analyserOpérateur, évaluerCondition, normaliserContexte, ipDansCidr, lireCidr, lireDate } from '../../src/lib/iam/conditions.js'
import { normaliser, lirePolitique, sérialiser, versDoc } from '../../src/lib/iam/politique.js'
import { évaluer, évaluerSelonType } from '../../src/lib/iam/evaluer.js'
import { valider, appliquerCorrectif } from '../../src/lib/iam/valider.js'
import { servicesÀCharger, résumerAccès, étendreMotif } from '../../src/lib/iam/etendre.js'
import { expliquerPolitique } from '../../src/lib/iam/expliquer.js'
import { interpréter } from '../../src/lib/iam/assistant.js'
import { testsDepuisPlan, testsApprobation, exécuterTests, résumerTests, sondesDepuisPolitique } from '../../src/lib/iam/testsauto.js'
import { versTerraform, versCloudFormation, versCli, versYaml, versJson } from '../../src/lib/iam/exporter.js'
import { VERBES_SERVICE, SERVICES, PRINCIPAUX_SERVICE } from '../../src/lib/iam/lexique.js'
import yaml from 'js-yaml'

const cat = await catalogueTest()
const unique = xs => [...new Set(xs)]

// ---- Données ------------------------------------------------------------------------------------------------------------
test('données : index, services et niveaux cohérents', async () => {
  assert.ok(cat.source.version && cat.source.licence === 'MIT')
  const services = cat.préfixes()
  assert.ok(services.length > 400)
  assert.equal(readdirSync(`${DOSSIER_DONNEES}/services`).length, services.length)
  await cat.charger(['s3', 'iam', 'ec2', 'lambda', 'dynamodb'])
  for (const p of ['s3', 'iam', 'ec2', 'lambda', 'dynamodb']) {
    const s = cat.service(p)
    assert.equal(s.actions.length, cat.infoService(p).a, `${p} : nombre d'actions`)
    for (const a of s.actions) assert.ok(a.niveau >= 0 && a.niveau <= 4 && a.desc, `${a.id} : niveau et description`)
  }
  assert.equal(cat.action('s3', 'getobject').niveauNom, 'Read')
  assert.equal(cat.action('iam', 'AttachRolePolicy').niveauNom, 'Permissions management')
  assert.equal(cat.action('s3', 'PutObjectTagging').niveauNom, 'Tagging')
  assert.ok(cat.globales().some(g => g.k === 'aws:SourceIp' && g.t === 'IPAddress'))
})

test('lexique : tous les services et toutes les actions citées existent dans les données', async () => {
  for (const p of Object.keys(SERVICES)) assert.ok(cat.existe(p), `service ${p}`)
  await cat.charger(Object.keys(VERBES_SERVICE))
  for (const [p, verbes] of Object.entries(VERBES_SERVICE)) for (const [mot, actions] of Object.entries(verbes)) for (const a of actions) assert.ok(cat.action(p, a), `${p}:${a} (« ${mot} »)`)
  assert.ok(Object.values(PRINCIPAUX_SERVICE).every(x => /\.amazonaws\.com$/.test(x)))
})

// ---- Jokers et ARN ----------------------------------------------------------------------------------------------------------
test('jokers : correspondance, insensibilité à la casse, intersection, pas de backtracking exponentiel', () => {
  const cas = [['s3:Get*', 's3:GetObject', true], ['s3:Get*', 's3:PutObject', false], ['*', '', true], ['a?c', 'abc', true], ['a?c', 'ac', false], ['a*b*c', 'axxbyyc', true], ['a*b*c', 'axxbyy', false], ['arn:aws:s3:::b/*', 'arn:aws:s3:::b', false], ['a**b', 'ab', true], ['', 'a', false], ['*abc*', 'xxabcxx', true]]
  for (const [m, t, r] of cas) assert.equal(correspond(m, t), r, `${m} ~ ${t}`)
  assert.ok(correspond('S3:GET*', 's3:getobject', { insensible: true }))
  assert.equal(intersecte(compiler('arn:aws:s3:::b'), compiler('arn:*:s3:::*/*')), false)
  assert.equal(intersecte(compiler('a*'), compiler('*c')), true)
  const t0 = Date.now()
  assert.equal(correspond(`${'a*'.repeat(40)}b`, 'a'.repeat(20000)), false)
  assert.ok(Date.now() - t0 < 1500, 'motif pathologique lent')
})

test('ARN : analyse, compatibilité avec les gabarits, instanciation', () => {
  assert.equal(analyserArn('arn:aws:s3:::b').ok, true)
  assert.deepEqual(analyserArn('arn:aws:iam::123:role/x').problèmes.map(p => p.code), ['ARN_COMPTE'])
  assert.equal(analyserArn('bucket').ok, false)
  const T = { bucket: 'arn:${Partition}:s3:::${BucketName}', objet: 'arn:${Partition}:s3:::${BucketName}/${ObjectName}', ssm: 'arn:${Partition}:ssm:${Region}:${Account}:parameter/${ParameterNameWithoutLeadingSlash}' }
  assert.equal(arnCompatible('arn:aws:s3:::b', T.objet), false) // le piège classique : oubli de /*
  assert.equal(arnCompatible('arn:aws:s3:::b/*', T.objet), true)
  assert.equal(arnCompatible('arn:aws:s3:::b/*', T.bucket), false)
  assert.equal(arnCompatible('arn:aws:s3:::b', T.bucket), true)
  assert.equal(arnCompatible('arn:aws:ssm:*:*:parameter/app/prod/*', T.ssm), true)
  assert.equal(arnCompatible('arn:aws:ec2:*:*:instance/*', T.bucket), false)
  assert.equal(instancier(T.objet, { BucketName: 'x' }, 'z'), 'arn:z:s3:::x/z')
})

// ---- Conditions ---------------------------------------------------------------------------------------------------------------
const C = (o, c, v, ctx) => évaluerCondition({ opérateur: o, clé: c, valeurs: Array.isArray(v) ? v : [v] }, normaliserContexte(ctx)).vrai
test('conditions : opérateurs, clés absentes, IfExists, ForAllValues/ForAnyValue, variables', () => {
  const cas = [
    ['StringEquals', 'k', 'a', { k: 'a' }, true], ['StringEquals', 'k', 'a', {}, false], ['StringNotEquals', 'k', 'a', {}, true], ['StringNotEquals', 'k', ['a', 'b'], { k: 'b' }, false],
    ['StringEqualsIfExists', 'k', 'a', {}, true], ['StringLike', 'k', 'a*', { k: 'abc' }, true], ['StringLike', 'k', 'A*', { k: 'abc' }, false], ['StringEqualsIgnoreCase', 'k', 'ABC', { k: 'abc' }, true],
    ['Bool', 'aws:MultiFactorAuthPresent', 'true', { 'aws:MultiFactorAuthPresent': true }, true], ['Bool', 'aws:MultiFactorAuthPresent', 'true', {}, false], ['BoolIfExists', 'aws:MultiFactorAuthPresent', 'false', {}, true],
    ['NumericLessThan', 'n', '10', { n: '9' }, true], ['NumericLessThan', 'n', '10', { n: '10' }, false], ['NumericGreaterThanEquals', 'n', '10', { n: 10 }, true], ['NumericEquals', 'n', 'x', { n: '1' }, false],
    ['DateLessThan', 'd', '2030-01-01T00:00:00Z', { d: '2029-12-31T23:59:59Z' }, true], ['DateGreaterThan', 'd', '2030-01-01', { d: '2029-12-31T23:59:59Z' }, false], ['DateEquals', 'd', '1700000000', { d: '2023-11-14T22:13:20Z' }, true],
    ['IpAddress', 'ip', '203.0.113.0/24', { ip: '203.0.113.77' }, true], ['IpAddress', 'ip', '203.0.113.0/24', { ip: '203.0.114.1' }, false], ['NotIpAddress', 'ip', ['10.0.0.0/8', '192.168.0.0/16'], { ip: '8.8.8.8' }, true], ['NotIpAddress', 'ip', '10.0.0.0/8', { ip: '10.1.2.3' }, false],
    ['IpAddress', 'ip', '2001:db8::/32', { ip: '2001:db8:1::5' }, true], ['IpAddress', 'ip', '10.0.0.0/8', { ip: '2001:db8::1' }, false],
    ['ArnLike', 'a', 'arn:aws:sns:*:123456789012:t-*', { a: 'arn:aws:sns:eu-west-3:123456789012:t-x' }, true], ['ArnLike', 'a', 'arn:aws:sns:*:123456789012:t-*', { a: 'arn:aws:sns:eu-west-3:999999999999:t-x' }, false], ['ArnNotLike', 'a', 'arn:aws:s3:::b*', { a: 'arn:aws:s3:::c' }, true],
    ['Null', 'k', 'true', {}, true], ['Null', 'k', 'true', { k: 'x' }, false], ['Null', 'k', 'false', { k: 'x' }, true],
    ['ForAnyValue:StringEquals', 't', ['a', 'b'], { t: ['b', 'z'] }, true], ['ForAnyValue:StringEquals', 't', 'a', {}, false], ['ForAllValues:StringEquals', 't', ['a', 'b'], { t: ['b', 'z'] }, false], ['ForAllValues:StringEquals', 't', 'a', {}, true],
    ['StringEquals', 'aws:username', '${aws:username}', { 'aws:username': 'bob' }, true], ['StringLike', 's3:prefix', '${aws:username}/*', { 's3:prefix': 'bob/x', 'aws:username': 'bob' }, true], ['StringLike', 's3:prefix', '${aws:username}/*', { 's3:prefix': 'alice/x', 'aws:username': 'bob' }, false], ['StringLike', 's3:prefix', '${aws:username}/*', { 's3:prefix': 'bob/x' }, false],
    ['StringLike', 'k', '${*}x', { k: '*x' }, true], ['StringLike', 'k', '${*}x', { k: 'ax' }, false], ['StringEquals', 'k', "${aws:foo, 'def'}", { k: 'def' }, true], ['StringEquals', 'AWS:RequestedRegion', 'eu-west-3', { 'aws:requestedregion': 'eu-west-3' }, true],
  ]
  for (const [o, c, v, ctx, r] of cas) assert.equal(C(o, c, v, ctx), r, `${o} ${c} ${JSON.stringify(v)} ${JSON.stringify(ctx)}`)
  assert.equal(analyserOpérateur('forallvalues:stringlikeifexists').canonique, 'ForAllValues:StringLikeIfExists')
  assert.equal(analyserOpérateur('Bidule'), null)
  assert.equal(lireCidr('1.2.3.4/33'), null)
  assert.equal(ipDansCidr('::1', '::/0'), true)
  assert.equal(lireDate('14/11/2023'), null)
})

// ---- Évaluation ---------------------------------------------------------------------------------------------------------------------
const P = doc => normaliser(doc)
test('évaluation : refus explicite > allow > refus implicite, NotAction, variables, SCP, plafond, approbation', () => {
  const pol = P({ Version: '2012-10-17', Statement: [
    { Sid: 'Lire', Effect: 'Allow', Action: ['s3:GetObject', 's3:ListBucket'], Resource: ['arn:aws:s3:::b', 'arn:aws:s3:::b/*'] },
    { Sid: 'PasSecret', Effect: 'Deny', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/secret/*' },
    { Sid: 'MFA', Effect: 'Deny', NotAction: 'iam:*', Resource: '*', Condition: { BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' } } },
  ] })
  const mfa = { 'aws:MultiFactorAuthPresent': 'true' }
  const R = (action, ressource, contexte = mfa) => évaluer({ action, ressource, contexte }, { identité: [pol] })
  assert.equal(R('s3:GetObject', 'arn:aws:s3:::b/x').décision, 'autorisé')
  assert.equal(R('S3:GETOBJECT', 'arn:aws:s3:::b/x').décision, 'autorisé')
  assert.equal(R('s3:GetObject', 'arn:aws:s3:::autre/x').motif, 'refus-implicite')
  assert.equal(R('s3:ListBucket', 'arn:aws:s3:::b').décision, 'autorisé')
  assert.equal(R('s3:PutObject', 'arn:aws:s3:::b/x').motif, 'refus-implicite')
  assert.equal(R('s3:GetObject', 'arn:aws:s3:::b/secret/x').motif, 'refus-explicite')
  assert.equal(R('s3:GetObject', 'arn:aws:s3:::B/x').décision, 'refusé') // les ARN sont sensibles à la casse
  assert.equal(R('s3:GetObject', 'arn:aws:s3:::b/x', {}).motif, 'refus-explicite') // clé MFA absente + BoolIfExists
  assert.equal(R('iam:ListUsers', '*', {}).motif, 'refus-implicite') // NotAction exclut iam:*, mais aucun Allow
  const home = P({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: 'arn:aws:s3:::home/${aws:username}/*' }] })
  const h = u => évaluer({ action: 's3:GetObject', ressource: 'arn:aws:s3:::home/bob/f', principal: { arn: `arn:aws:iam::123456789012:user/${u}`, type: 'utilisateur' } }, { identité: [home] }).décision
  assert.equal(h('bob'), 'autorisé'); assert.equal(h('alice'), 'refusé')
  const scp = P({ Version: '2012-10-17', Statement: [{ Effect: 'Deny', Action: 'ec2:*', Resource: '*', Condition: { StringNotEquals: { 'aws:RequestedRegion': ['eu-west-3'] } } }] })
  assert.equal(évaluerSelonType('scp', scp, { action: 'ec2:RunInstances', ressource: 'arn:aws:ec2:us-east-1:123456789012:instance/*' }).motif, 'refus-explicite')
  assert.equal(évaluerSelonType('scp', scp, { action: 'ec2:RunInstances', ressource: 'arn:aws:ec2:eu-west-3:123456789012:instance/i-1' }).décision, 'autorisé')
  const plafond = P({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: '*' }] })
  const id = P({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject', 'ec2:RunInstances'], Resource: '*' }] })
  assert.equal(évaluer({ action: 'ec2:RunInstances', ressource: '*' }, { identité: [id], plafond: [plafond] }).motif, 'refus-implicite')
  assert.equal(évaluer({ action: 's3:GetObject', ressource: 'arn:aws:s3:::b/x' }, { identité: [id], plafond: [plafond] }).décision, 'autorisé')
  const tr = P({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }] })
  assert.equal(évaluerSelonType('approbation', tr, { action: 'sts:AssumeRole', ressource: '*', principal: { service: 'lambda.amazonaws.com', type: 'service' } }).décision, 'autorisé')
  assert.equal(évaluerSelonType('approbation', tr, { action: 'sts:AssumeRole', ressource: '*', principal: { service: 'ec2.amazonaws.com', type: 'service' } }).décision, 'refusé')
})

// ---- Lecture et sérialisation ----------------------------------------------------------------------------------------------------------
test('politique : lecture (positions, clés dupliquées), sérialisation canonique idempotente', () => {
  const t = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:GetObject","Action":"s3:PutObject","Resource":"*"}]}'
  const l = lirePolitique(t)
  assert.equal(l.ok, true)
  assert.equal(l.doublons.length, 1)
  assert.equal(l.doublons[0].clé, 'Action')
  assert.equal(lirePolitique('{"a":1,}').ok, false)
  const p = normaliser({ Version: '2012-10-17', Statement: { Sid: 'A', Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::b/*', Condition: { Bool: { 'aws:SecureTransport': true } } } })
  const s1 = sérialiser(p)
  assert.deepEqual(versDoc(normaliser(JSON.parse(s1))), versDoc(p))
  assert.equal(sérialiser(normaliser(JSON.parse(s1))), s1)
})

// ---- Validation --------------------------------------------------------------------------------------------------------------------------
async function valide(doc, type = 'identite', texte) {
  await cat.charger(servicesÀCharger(cat, normaliser(doc)))
  return valider(doc, { type, cat, lecture: texte ? lirePolitique(texte) : null })
}
const codes = r => r.constats.map(c => c.code)

test('validation : politiques correctes sans erreur', async () => {
  const bonnes = [
    [{ Version: '2012-10-17', Statement: [{ Sid: 'Lire', Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::mon-bucket/*' }, { Sid: 'Lister', Effect: 'Allow', Action: 's3:ListBucket', Resource: 'arn:aws:s3:::mon-bucket' }] }, 'identite'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'ec2:DescribeInstances', Resource: '*' }] }, 'identite'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }] }, 'approbation'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { AWS: 'arn:aws:iam::123456789012:root' }, Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*' }] }, 'ressource'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'dynamodb:Query', Resource: ['arn:aws:dynamodb:eu-west-3:123456789012:table/t', 'arn:aws:dynamodb:eu-west-3:123456789012:table/t/index/*'] }] }, 'identite'],
  ]
  for (const [doc, type] of bonnes) { const r = await valide(doc, type); assert.equal(r.résumé.erreurs, 0, JSON.stringify(r.constats)) }
})

test('validation : erreurs de structure, de syntaxe et de cohérence avec les données AWS', async () => {
  const cas = [
    [{ Statements: [] }, 'identite', ['CLÉ_INCONNUE', 'VERSION_ABSENTE', 'STATEMENT_MANQUANT']],
    [{ Version: '2012-10-18', Statement: [] }, 'identite', ['VERSION_INVALIDE', 'STATEMENT_VIDE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'allow', Action: 's3:GetObject', Resource: '*' }] }, 'identite', ['EFFET_INVALIDE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObjekt', Resource: '*' }] }, 'identite', ['ACTION_INCONNUE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'lamda:InvokeFunction', Resource: '*' }] }, 'identite', ['PRÉFIXE_INCONNU']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b' }] }, 'identite', ['RESSOURCE_INCOMPATIBLE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:ListBucket', Resource: 'arn:aws:s3:::b/*' }] }, 'identite', ['RESSOURCE_INCOMPATIBLE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'ec2:DescribeInstances', Resource: 'arn:aws:ec2:eu-west-3:123456789012:instance/*' }] }, 'identite', ['RESSOURCE_INCOMPATIBLE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*', Condition: { StringEquals: { 's3:prefix': 'x' } } }] }, 'identite', ['CLÉ_NON_APPLICABLE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*', Condition: { IpAddress: { 'aws:SourceIp': '10.0.0.0/33' } } }] }, 'identite', ['IP_INVALIDE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*', Condition: { StringEqualz: { 'aws:SourceIp': 'x' } } }] }, 'identite', ['OPÉRATEUR_INCONNU']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: '*' }] }, 'identite', ['PRINCIPAL_INTERDIT']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'sts:AssumeRole' }] }, 'approbation', ['PRINCIPAL_MANQUANT']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole', Resource: '*' }] }, 'approbation', ['RESSOURCE_INTERDITE']],
    [{ Version: '2012-10-17', Statement: [{ Sid: 'a b', Effect: 'Allow', Action: 's3:GetObject', Resource: '*' }, { Sid: 'x', Effect: 'Allow', Action: 's3:GetObject', Resource: '*' }, { Sid: 'x', Effect: 'Allow', Action: 's3:GetObject', Resource: '*' }] }, 'identite', ['SID_CARACTÈRES', 'SID_DOUBLON']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], NotAction: 's3:PutObject', Resource: '*' }] }, 'identite', ['ACTION_DOUBLE']],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { AWS: 'arn:aws:iam::123456789012:role/*' }, Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*' }] }, 'ressource', ['PRINCIPAL_JOKER']],
  ]
  for (const [doc, type, attendus] of cas) {
    const r = await valide(doc, type)
    for (const a of attendus) assert.ok(codes(r).includes(a), `${a} attendu pour ${JSON.stringify(doc)} ; obtenu ${codes(r)}`)
  }
  // Clé dupliquée : détectée dans le texte.
  const t = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:GetObject","Action":"s3:PutObject","Resource":"*"}]}'
  assert.ok(codes(await valide(JSON.parse(t), 'identite', t)).includes('CLÉ_DUPLIQUÉE'))
})

test('validation : signaux de sécurité', async () => {
  const cas = [
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }, 'identite', 'ADMIN_COMPLET'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', NotAction: 'iam:*', Resource: '*' }] }, 'identite', 'NOTACTION_ALLOW'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'iam:*', Resource: '*' }] }, 'identite', 'SERVICE_SENSIBLE_TOUT'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['iam:PassRole'], Resource: '*' }] }, 'identite', 'RISQUE_ESCALADE'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*' }] }, 'ressource', 'PRINCIPAL_PUBLIC'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Federated: 'arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com' }, Action: 'sts:AssumeRoleWithWebIdentity' }] }, 'approbation', 'OIDC_SANS_SUB'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'sns.amazonaws.com' }, Action: 's3:PutObject', Resource: 'arn:aws:s3:::b/*' }] }, 'ressource', 'CONFUSED_DEPUTY'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Deny', Action: '*', Resource: '*', Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'false' } } }] }, 'identite', 'MFA_MOTIF'],
    [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b/*', Condition: { 'ForAllValues:StringEquals': { 'aws:TagKeys': ['a'] } } }] }, 'identite', 'FORALL_ALLOW'],
  ]
  for (const [doc, type, code] of cas) assert.ok(codes(await valide(doc, type)).includes(code), `${code} attendu`)
  // Une condition sur le sujet OIDC lève l'alerte.
  const ok = await valide({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Federated: 'arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com' }, Action: 'sts:AssumeRoleWithWebIdentity', Condition: { StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com', 'token.actions.githubusercontent.com:sub': 'repo:o/r:ref:refs/heads/main' } } }] }, 'approbation')
  assert.equal(ok.constats.filter(c => c.niveau !== 'info').length, 0, JSON.stringify(ok.constats))
})

test('validation : les correctifs proposés produisent une politique corrigée', async () => {
  const doc = { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObjekt', 's3:ListBucket'], Resource: 'arn:aws:s3:::b' }, { Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::b' }, { Effect: 'Deny', Action: '*', Resource: '*', Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'false' } } }] }
  let pol = normaliser(doc)
  for (let tour = 0; tour < 6; tour++) {
    await cat.charger(servicesÀCharger(cat, pol))
    const r = valider(versDoc(pol), { type: 'identite', cat })
    const c = r.constats.find(x => x.correctif)
    if (!c) break
    pol = appliquerCorrectif(pol, c)
  }
  await cat.charger(servicesÀCharger(cat, pol))
  const fin = valider(versDoc(pol), { type: 'identite', cat })
  assert.equal(fin.résumé.erreurs, 0, JSON.stringify(fin.constats))
  assert.ok(!codes(fin).includes('MFA_MOTIF'))
})

// ---- Expansion et explication -----------------------------------------------------------------------------------------------------
test('expansion des jokers, résumé d\'accès et explication en français', async () => {
  await cat.charger(['s3'])
  const e = étendreMotif(cat, 's3:Get*')
  assert.ok(e.actions.length > 20 && e.actions.every(a => a.nom.startsWith('Get')))
  assert.equal(étendreMotif(cat, 's3:*').nombre, cat.infoService('s3').a)
  assert.equal(étendreMotif(cat, '*').tout, true)
  const pol = P({ Version: '2012-10-17', Statement: [{ Sid: 'Lire', Effect: 'Allow', Action: ['s3:Get*', 's3:ListBucket'], Resource: 'arn:aws:s3:::b/*', Condition: { Bool: { 'aws:SecureTransport': 'true' } } }] })
  const r = résumerAccès(cat, pol)
  assert.equal(r[0].services[0].service, 's3')
  assert.ok(r[0].services[0].niveaux[1].nombre > 10)
  const ex = expliquerPolitique(pol, cat)
  assert.match(ex[0].phrases.join(' '), /AUTORISE.*Amazon S3.*chiffrée/s)
})

// ---- Assistant : descriptions → politique, puis tests automatiques exécutés -----------------------------------------------------------------
const DESCRIPTIONS = [
  ['Lecture seule sur le bucket S3 mon-bucket', p => {
    const a = p.déclarations.flatMap(d => d.actions.liste)
    assert.ok(a.includes('s3:GetObject') && a.includes('s3:ListBucket'))
    assert.ok(!a.some(x => /^s3:(Put|Delete)/.test(x)))
    assert.deepEqual(unique(p.déclarations.flatMap(d => d.ressources.liste)).sort(), ['arn:aws:s3:::mon-bucket', 'arn:aws:s3:::mon-bucket/*'])
  }],
  ['Autoriser une fonction Lambda à écrire dans la table DynamoDB users et à envoyer des logs dans CloudWatch', p => {
    const svc = unique(p.déclarations.flatMap(d => d.actions.liste.map(x => x.split(':')[0])))
    assert.deepEqual(svc.sort(), ['dynamodb', 'logs'])
    assert.ok(p.déclarations.some(d => d.actions.liste.includes('dynamodb:PutItem')))
  }],
  ['Démarrer et arrêter les instances EC2 taguées Environment=dev depuis 203.0.113.0/24 avec MFA', p => {
    const d = p.déclarations.find(x => x.actions.liste.includes('ec2:StartInstances'))
    assert.deepEqual(d.actions.liste, ['ec2:StartInstances', 'ec2:StopInstances'])
    const k = d.conditions.map(c => c.clé)
    assert.ok(k.includes('aws:ResourceTag/Environment') && k.includes('aws:SourceIp') && k.includes('aws:MultiFactorAuthPresent'))
  }],
  ['Interdire en dehors de eu-west-3 et eu-west-1', p => {
    const d = p.déclarations[0]
    assert.equal(d.effet, 'Deny'); assert.equal(d.actions.inverse, true)
    assert.deepEqual(d.conditions[0].valeurs, ['eu-west-3', 'eu-west-1'])
  }],
  ['Accès complet au bucket S3 backups uniquement depuis 203.0.113.0/24 avec MFA', p => {
    assert.deepEqual(p.déclarations[0].actions.liste, ['s3:*'])
    assert.equal(p.déclarations[0].conditions.length, 2)
  }],
  ['Permettre de lire la table users et le bucket logs-prod', p => {
    const r = unique(p.déclarations.flatMap(d => d.ressources.liste))
    assert.ok(r.some(x => x.includes('table/users')) && r.includes('arn:aws:s3:::logs-prod'))
  }],
  ['Envoyer des messages dans la file SQS jobs et recevoir les messages de la file SQS resultats', p => {
    const r = p.déclarations.map(d => `${d.actions.liste.join(',')} ${d.ressources.liste.join(',')}`).join(' | ')
    assert.match(r, /sqs:SendMessage.*:jobs/); assert.match(r, /sqs:ReceiveMessage.*:resultats/)
  }],
  ['Publier sur le topic SNS alertes', p => assert.deepEqual(p.déclarations[0].actions.liste, ['sns:Publish'])],
  ['Invoquer la fonction Lambda traitement', p => {
    assert.deepEqual(p.déclarations[0].actions.liste, ['lambda:InvokeFunction'])
    assert.match(p.déclarations[0].ressources.liste[0], /function:traitement/)
  }],
  ['Chiffrer et déchiffrer avec la clé KMS alias/app', p => {
    assert.ok(p.déclarations[0].actions.liste.includes('kms:Decrypt') && p.déclarations[0].actions.liste.includes('kms:Encrypt'))
    assert.equal(p.déclarations[0].conditions[0].clé, 'kms:RequestAlias')
    assert.deepEqual(p.déclarations[0].conditions[0].valeurs, ['alias/app'])
  }],
  ['Lire le secret prod/db et le déchiffrer avec la clé KMS alias/app', p => {
    const svc = unique(p.déclarations.flatMap(d => d.actions.liste.map(x => x.split(':')[0]))).sort()
    assert.deepEqual(svc, ['kms', 'secretsmanager'])
  }],
  ['Pousser et tirer des images du dépôt ECR mon-app', p => {
    const a = p.déclarations.flatMap(d => d.actions.liste)
    assert.ok(a.includes('ecr:PutImage') && a.includes('ecr:BatchGetImage'))
  }],
  ['Écrire des logs dans le groupe de logs /aws/lambda/mon-app', p => {
    assert.ok(p.déclarations.some(d => d.ressources.liste.some(r => r.includes('log-group:/aws/lambda/mon-app'))))
  }],
  ['Lire le paramètre SSM /app/prod/db', p => assert.ok(p.déclarations.some(d => d.ressources.liste.includes('arn:aws:ssm:*:*:parameter/app/prod/db')))],
  ['Interdire la suppression des buckets S3', p => {
    assert.equal(p.déclarations[0].effet, 'Deny')
    assert.ok(p.déclarations[0].actions.liste.includes('s3:DeleteBucket'))
  }],
  ['Autoriser s3:GetObject sur arn:aws:s3:::data/*', p => { assert.deepEqual(p.déclarations[0].actions.liste, ['s3:GetObject']); assert.deepEqual(p.déclarations[0].ressources.liste, ['arn:aws:s3:::data/*']) }],
  ['Read-only access to the S3 bucket reports', p => assert.ok(p.déclarations.flatMap(d => d.ressources.liste).includes('arn:aws:s3:::reports'))],
  ['Allow starting and stopping EC2 instances tagged Env=dev', p => {
    assert.ok(p.déclarations[0].actions.liste.includes('ec2:StartInstances'))
    assert.equal(p.déclarations[0].conditions[0].clé, 'aws:ResourceTag/Env')
  }],
  ['Autoriser la lecture et l écriture sur le bucket S3 docs mais pas la suppression', p => {
    const a = p.déclarations.filter(d => d.effet === 'Allow').flatMap(d => d.actions.liste)
    assert.ok(a.includes('s3:GetObject') && a.includes('s3:PutObject'))
    assert.ok(!a.some(x => /Delete/.test(x)))
  }],
  ['Bloquer toutes les actions sans MFA', p => { assert.equal(p.déclarations[0].effet, 'Deny'); assert.equal(p.déclarations[0].conditions[0].opérateur, 'BoolIfExists') }],
  ['Bloquer l adresse IP 198.51.100.7', p => { assert.equal(p.déclarations[0].effet, 'Deny'); assert.deepEqual(p.déclarations[0].conditions[0].valeurs, ['198.51.100.7']) }],
  ['Autoriser S3 en lecture jusqu au 2027-01-31', p => assert.equal(p.déclarations[0].conditions[0].opérateur, 'DateLessThan')],
  ['Accès à S3 pour le bucket data dans la région eu-west-3 avec HTTPS obligatoire', p => assert.ok(p.déclarations.some(d => d.effet === 'Deny' && d.conditions.some(c => c.clé === 'aws:SecureTransport')))],
]

for (const [texte, vérifier] of DESCRIPTIONS) {
  test(`assistant : « ${texte.slice(0, 80)} »`, async () => {
    const { plan, politique, type } = await interpréter(texte, cat)
    assert.deepEqual(plan.nonCompris, [], `non compris : ${plan.nonCompris}`)
    assert.ok(politique.déclarations.length > 0)
    vérifier(politique, plan)
    // La politique produite est valide…
    await cat.charger(servicesÀCharger(cat, politique))
    const v = valider(versDoc(politique), { type, cat })
    assert.equal(v.résumé.erreurs, 0, `erreurs de validation : ${JSON.stringify(v.constats.filter(c => c.niveau === 'erreur'))}`)
    // … et fait ce qui était voulu : tests automatiques exécutés sur la politique générée.
    const tests = type === 'approbation' ? testsApprobation(plan) : testsDepuisPlan(plan, cat)
    assert.ok(tests.length >= 2, 'au moins deux tests générés')
    const s = résumerTests(exécuterTests(tests, politique, type))
    assert.equal(s.échecs, 0, JSON.stringify(exécuterTests(tests, politique, type).filter(t => !t.ok).map(t => [t.libellé, t.attenduTexte, t.résultat.décision, t.résultat.motif])))
  })
}

test('assistant : relations d\'approbation (service, compte, GitHub, GitLab, EKS, SAML)', async () => {
  const cas = [
    ['Rôle assumable par le service Lambda', p => assert.deepEqual(p.déclarations[0].principal.valeurs, { Service: ['lambda.amazonaws.com'] })],
    ['Rôle assumable par les tâches ECS et par le service CodeBuild', p => assert.ok(p.déclarations.some(d => d.principal.valeurs.Service?.includes('ecs-tasks.amazonaws.com')) || p.déclarations.some(d => d.principal.valeurs.Service?.includes('codebuild.amazonaws.com')))],
    ['Rôle assumable par le compte 111122223333 avec MFA', p => { assert.deepEqual(p.déclarations[0].principal.valeurs.AWS, ['arn:aws:iam::111122223333:root']); assert.equal(p.déclarations[0].conditions[0].clé, 'aws:MultiFactorAuthPresent') }],
    ['Rôle assumable par le compte 111122223333 avec external id abc-123', p => assert.equal(p.déclarations[0].conditions.find(c => c.clé === 'sts:ExternalId').valeurs[0], 'abc-123')],
    ['Rôle assumable par GitHub Actions pour le dépôt monorg/monrepo sur la branche main', p => {
      const d = p.déclarations[0]
      assert.deepEqual(d.actions.liste, ['sts:AssumeRoleWithWebIdentity'])
      assert.equal(d.conditions.find(c => c.clé.endsWith(':sub')).valeurs[0], 'repo:monorg/monrepo:ref:refs/heads/main')
      assert.equal(d.conditions.find(c => c.clé.endsWith(':aud')).valeurs[0], 'sts.amazonaws.com')
    }],
    ['Rôle assumable par GitLab CI pour le projet groupe/projet sur la branche main', p => assert.equal(p.déclarations[0].conditions.find(c => c.clé.endsWith(':sub')).valeurs[0], 'project_path:groupe/projet:ref_type:branch:ref:main')],
    ['Rôle pour le compte de service Kubernetes web du namespace app sur EKS oidc.eks.eu-west-3.amazonaws.com/id/ABCDEF0123456789ABCDEF0123456789', p => {
      assert.equal(p.déclarations[0].conditions.find(c => c.clé.endsWith(':sub')).valeurs[0], 'system:serviceaccount:app:web')
      assert.match(p.déclarations[0].principal.valeurs.Federated[0], /oidc-provider\/oidc\.eks\.eu-west-3\.amazonaws\.com\/id\/ABCDEF0123456789ABCDEF0123456789$/)
    }],
  ]
  for (const [texte, vérifier] of cas) {
    const { plan, politique, type } = await interpréter(texte, cat)
    assert.equal(type, 'approbation', texte)
    assert.deepEqual(plan.nonCompris, [], `${texte} : ${plan.nonCompris}`)
    vérifier(politique)
    const v = valider(versDoc(politique), { type, cat })
    assert.equal(v.résumé.erreurs, 0, `${texte} : ${JSON.stringify(v.constats.filter(c => c.niveau === 'erreur'))}`)
    assert.equal(v.constats.filter(c => c.niveau === 'sécurité').length, 0, `${texte} : ${JSON.stringify(v.constats.filter(c => c.niveau === 'sécurité'))}`)
    const s = résumerTests(exécuterTests(testsApprobation(plan), politique, type))
    assert.ok(s.total >= 2 && s.échecs === 0, `${texte} : tests ${s.ok}/${s.total}`)
  }
})

test('assistant : politiques de ressource (compte, organisation, service)', async () => {
  const cas = [
    ['Autoriser le compte 123456789012 à lire le bucket S3 partage et exiger HTTPS', p => { assert.ok(p.déclarations.some(d => d.principal?.valeurs?.AWS?.[0] === 'arn:aws:iam::123456789012:root')); assert.ok(p.déclarations.some(d => d.effet === 'Deny' && d.principal?.valeurs === '*')) }],
    ['Permettre à l organisation o-abc1234567 de lire le bucket S3 donnees', p => { assert.equal(p.déclarations[0].principal.valeurs, '*'); assert.equal(p.déclarations[0].conditions.at(-1).clé, 'aws:PrincipalOrgID') }],
    ['Permettre au service CloudFront de lire le bucket S3 site-web', p => assert.deepEqual(p.déclarations[0].principal.valeurs, { Service: ['cloudfront.amazonaws.com'] })],
  ]
  for (const [texte, vérifier] of cas) {
    const { plan, politique, type } = await interpréter(texte, cat)
    assert.equal(type, 'ressource', texte)
    vérifier(politique)
    const s = résumerTests(exécuterTests(testsDepuisPlan(plan, cat), politique, type))
    assert.ok(s.total >= 4 && s.échecs === 0, `${texte} : tests ${s.ok}/${s.total}`)
  }
})

test('assistant : message AccessDenied → règle exacte', async () => {
  const msg = 'An error occurred (AccessDenied): User: arn:aws:iam::123456789012:user/bob is not authorized to perform: s3:GetObject on resource: "arn:aws:s3:::rapports/q1/x.csv" because no identity-based policy allows the s3:GetObject action'
  const { plan, politique } = await interpréter(msg, cat)
  assert.deepEqual(politique.déclarations[0].actions.liste, ['s3:GetObject'])
  assert.deepEqual(politique.déclarations[0].ressources.liste, ['arn:aws:s3:::rapports/q1/x.csv'])
  const r = évaluer({ action: 's3:GetObject', ressource: 'arn:aws:s3:::rapports/q1/x.csv' }, { identité: [politique] })
  assert.equal(r.décision, 'autorisé')
  assert.equal(plan.accessDenied[0].cause, 'identité')
  const scp = await interpréter('User: arn:aws:iam::123456789012:role/r is not authorized to perform: ec2:RunInstances on resource: arn:aws:ec2:us-east-1:123456789012:instance/* with an explicit deny in a service control policy', cat)
  assert.equal(scp.politique.déclarations.length, 0)
  assert.match(scp.plan.avertissements[0], /SCP/)
})

test('assistant : ce qui n\'est pas compris est signalé, jamais inventé', async () => {
  for (const t of ['bonjour tout le monde', 'faire quelque chose avec les trucs', '']) {
    const { plan, politique } = await interpréter(t, cat)
    assert.equal(politique.déclarations.length, 0, t)
    assert.ok(plan.nonCompris.length > 0 || t === '', t)
  }
  const { plan } = await interpréter('Lire le bucket S3 données gnagnagna zorglub', cat)
  assert.ok(plan.motsInutilisés.includes('gnagnagna') && plan.motsInutilisés.includes('zorglub'))
})

test('sondes : politique saisie à la main (exemples autorisés, voisines refusées)', async () => {
  const pol = P({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject', 's3:ListBucket'], Resource: ['arn:aws:s3:::b', 'arn:aws:s3:::b/*'], Condition: { IpAddress: { 'aws:SourceIp': '203.0.113.0/24' } } }] })
  await cat.charger(['s3'])
  const sondes = sondesDepuisPolitique(pol, cat)
  const r = exécuterTests(sondes, pol)
  assert.ok(r.length >= 4)
  for (const x of r.filter(s => !s.sonde)) assert.ok(x.ok, x.libellé)
  for (const x of r.filter(s => s.sonde)) assert.ok(x.ok, `${x.libellé} → ${x.résultat.décision}`) // aucune voisine autorisée ici
  // Une politique trop large est révélée par les sondes.
  const large = P({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:Get*', Resource: '*' }, { Effect: 'Allow', Action: 's3:*', Resource: '*' }] })
  const r2 = exécuterTests(sondesDepuisPolitique(large, cat), large)
  assert.ok(r2.some(x => x.sonde && !x.ok), 'une action voisine devrait être autorisée')
})

// ---- Exports --------------------------------------------------------------------------------------------------------------------------
test('exports : JSON, YAML, Terraform, CloudFormation et CLI restent fidèles à la politique', async () => {
  const doc = { Version: '2012-10-17', Statement: [
    { Sid: 'Lire', Effect: 'Allow', Action: ['s3:GetObject', 's3:ListBucket'], Resource: ['arn:aws:s3:::b', 'arn:aws:s3:::b/*'], Condition: { StringLike: { 's3:prefix': '${aws:username}/*' }, Bool: { 'aws:SecureTransport': 'true' } } },
    { Effect: 'Deny', NotAction: ['iam:*'], Resource: '*', Condition: { StringNotEquals: { 'aws:RequestedRegion': ['eu-west-3', 'eu-west-1'] } } },
  ] }
  const pol = normaliser(doc)
  assert.deepEqual(JSON.parse(versJson(pol)), versDoc(pol))
  assert.deepEqual(yaml.load(versYaml(pol)), versDoc(pol))
  for (const type of ['identite', 'plafond']) {
    const cf = yaml.load(versCloudFormation(pol, { nom: 'Ma politique', type }))
    assert.equal(cf.Resources.MaPolitiquePolicy.Properties.PolicyDocument.Statement[0].Sid, 'Lire')
    assert.deepEqual(cf.Resources.MaPolitiquePolicy.Properties.PolicyDocument, versDoc(pol))
  }
  const tf = versTerraform(pol, { nom: 'Ma politique' })
  assert.match(tf, /data "aws_iam_policy_document" "ma_politique"/)
  assert.match(tf, /actions = \[\n\s+"s3:GetObject",/)
  assert.match(tf, /not_actions = \["iam:\*"\]/)
  assert.match(tf, /"\$\{aws:username\}\/\*"|"\$\$\{aws:username\}\/\*"/)
  assert.ok(tf.includes('$${aws:username}'), 'les variables de politique doivent être protégées en HCL')
  const cli = versCli(pol, { nom: 'Ma politique' })
  const heredoc = /<<'EOF'\n([\s\S]*?)\nEOF\n/.exec(cli)[1]
  assert.deepEqual(JSON.parse(heredoc), versDoc(pol))
  assert.match(cli, /aws iam create-policy --policy-name 'MaPolitique'/)
  // Trust policy et bucket policy.
  const trust = normaliser({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }] })
  assert.match(versTerraform(trust, { nom: 'r', type: 'approbation' }), /assume_role_policy = data\.aws_iam_policy_document\.r\.json/)
  assert.ok(yaml.load(versCloudFormation(trust, { nom: 'r', type: 'approbation' })).Resources.RRole.Properties.AssumeRolePolicyDocument)
  assert.match(versCli(trust, { nom: 'r', type: 'approbation' }), /create-role --role-name 'R'/)
  const bp = normaliser({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: 'arn:aws:s3:::mon-site/*' }] })
  assert.match(versTerraform(bp, { nom: 'x', type: 'ressource' }), /aws_s3_bucket_policy/)
  assert.match(versCli(bp, { nom: 'x', type: 'ressource' }), /put-bucket-policy --bucket 'mon-site'/)
})

// ---- Édition (constructeur visuel) ------------------------------------------------------------------------------------------------------------
import * as ed from '../../src/lib/iam/edition.js'
test('édition : les modifications du constructeur sont pures et cohérentes', () => {
  let p = normaliser({ Version: '2012-10-17', Statement: [{ Sid: 'A', Effect: 'Allow', Action: ['s3:GetObject'], Resource: '*' }] })
  const copie = JSON.stringify(p)
  p = ed.ajouterÀListe(p, 0, 'actions', ['s3:ListBucket', 's3:getobject'])
  assert.deepEqual(p.déclarations[0].actions.liste, ['s3:GetObject', 's3:ListBucket']) // pas de doublon, casse ignorée
  p = ed.ajouterÀListe(p, 0, 'ressources', ['arn:aws:s3:::b/*'])
  assert.deepEqual(p.déclarations[0].ressources.liste, ['arn:aws:s3:::b/*']) // l'ARN précis remplace « * »
  p = ed.ajouterÀListe(p, 0, 'ressources', ['*'])
  assert.deepEqual(p.déclarations[0].ressources.liste, ['*'])
  p = ed.basculerInverse(p, 0, 'actions')
  assert.equal(p.déclarations[0].actions.inverse, true)
  p = ed.ajouterCondition(p, 0, ed.CONDITIONS_RAPIDES[0][1])
  p = ed.modifierCondition(p, 0, 0, { valeurs: ['false'] })
  assert.equal(p.déclarations[0].conditions[0].valeurs[0], 'false')
  p = ed.dupliquerDéclaration(p, 0)
  assert.equal(p.déclarations.length, 2)
  assert.equal(p.déclarations[1].sid, 'ACopie')
  p = ed.déplacerDéclaration(p, 1, -1)
  assert.equal(p.déclarations[0].sid, 'ACopie')
  p = ed.supprimerDéclaration(p, 0)
  assert.equal(p.déclarations.length, 1)
  assert.notEqual(JSON.stringify(p), copie)
  // Principal et changement de type.
  let t = ed.adapterAuType(normaliser({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'sts:AssumeRole', Resource: '*' }] }), 'approbation')
  assert.equal(t.déclarations[0].ressources, null)
  assert.ok(t.déclarations[0].principal)
  t = ed.ajouterPrincipal(t, 0, 'Service', ['lambda.amazonaws.com'])
  assert.deepEqual(t.déclarations[0].principal.valeurs.Service, ['ec2.amazonaws.com', 'lambda.amazonaws.com'])
  t = ed.retirerPrincipal(t, 0, 'Service', 'ec2.amazonaws.com')
  assert.deepEqual(t.déclarations[0].principal.valeurs.Service, ['lambda.amazonaws.com'])
  assert.equal(ed.adapterAuType(t, 'identite').déclarations[0].principal, null)
})

// ---- Les exemples proposés par l'interface fonctionnent tous -------------------------------------------------------------------------------------
import { EXEMPLES } from '../../src/lib/iam/exemples.js'
test('exemples de l\'interface : chaque phrase donne une politique valide dont les tests réussissent', async () => {
  let n = 0
  for (const [, phrases] of EXEMPLES) {
    for (const phrase of phrases) {
      n++
      const { plan, politique, type } = await interpréter(phrase, cat)
      assert.ok(politique.déclarations.length > 0, phrase)
      assert.deepEqual(plan.nonCompris, [], phrase)
      await cat.charger(servicesÀCharger(cat, politique))
      const v = valider(versDoc(politique), { type, cat })
      assert.equal(v.résumé.erreurs, 0, `${phrase} : ${JSON.stringify(v.constats.filter(c => c.niveau === 'erreur'))}`)
      const planUtilisable = plan.déclarations.length > 0 && !plan.accessDenied?.length
      const tests = planUtilisable ? (type === 'approbation' ? testsApprobation(plan) : testsDepuisPlan(plan, cat)) : sondesDepuisPolitique(politique, cat)
      assert.ok(tests.length >= 2, phrase)
      const r = exécuterTests(tests, politique, type)
      assert.equal(résumerTests(r).échecs, 0, `${phrase} : ${JSON.stringify(r.filter(x => !x.ok).map(x => [x.libellé, x.résultat.motif]))}`)
    }
  }
  assert.ok(n >= 20)
})
