// Moteur tfpv dans le navigateur : orchestre les analyses et produit un
// rapport au même format que le moteur tfpv (schema_version 1.0).
// Rien ne quitte l'appareil : les fichiers sont lus et analysés ici.
import MANIFESTE from '../donnees/manifeste.js'
import { chargerProjet, instances, inventaire, valeursRacine, valeursSecrètes, vérifierProjet } from './projet.js'
import { validerSchémas } from './schema.js'
import { préparerTflint, reglesTflint } from './tflintAws.js'
import { cohérence } from './coherence.js'
import { sécurité } from './securite.js'
import { vérifierFormat } from './format.js'
import { Masqueur, consolider, statut } from './diagnostic.js'

export const VERSION = '2.0.0'
export const ÉTAPES = [
  ['lecture', 'Lecture des fichiers .tf et .tfvars'],
  ['analyse', 'Analyse des modules, providers, variables et ressources'],
  ['schema', 'Schéma des providers (équivalent terraform validate)'],
  ['tflint', 'Règles AWS de TFLint'],
  ['coherence', 'Cohérence AWS (réseau, EBS, RDS, IAM)'],
  ['securite', 'Sécurité (équivalents Checkov)'],
  ['format', 'Formatage (approximation de terraform fmt)'],
  ['rapport', 'Centralisation, recommandations et rapport'],
]

function contrôle(id, name, engine, extra = {}) {
  return { id, name, engine, tier: 'static', required: true, status: 'pending', reason: '', duration_s: 0, passed_count: 0, not_evaluated: 0, partial: false, findings: 0, constats: [], ...extra }
}

const pause = () => new Promise(r => setTimeout(r, 0))

export async function analyser({ fichiers, options = {}, données, onProgress = () => {} }) {
  const t0 = Date.now()
  const seuil = options.seuil || 'HIGH'
  const étape = async (i, état) => {
    const [id, label] = ÉTAPES[i]
    onProgress({ step: id, index: i + 1, total: ÉTAPES.length, label, state: état, percent: Math.round((100 * (i + (état === 'done' ? 1 : 0.5))) / ÉTAPES.length) })
    await pause()
  }
  const chrono = async (c, fn) => {
    const d = Date.now()
    try { await fn() } catch (e) { c.status = 'error'; c.reason = `internal error: ${e.message}` }
    c.duration_s = Math.round((Date.now() - d) / 10) / 100
    if (c.status === 'pending') c.status = c.constats.length ? 'failed' : 'passed'
    c.findings = c.constats.length
  }

  await étape(0, 'running')
  const p = chargerProjet(fichiers, { fichiersVariables: options.fichiersVariables || [] })
  const nbTf = Object.keys(p.analysés).filter(r => r.endsWith('.tf')).length + p.json.length
  if (!nbTf) throw new Error('Aucun fichier .tf trouvé.')
  await étape(0, 'done')

  await étape(1, 'running')
  const masqueur = new Masqueur()
  const valeurs = {}
  for (const r of p.racines) valeurs[r] = valeursRacine(p, r, { externes: options.variablesExternes || [] })
  for (const v of valeursSecrètes(p, valeurs)) masqueur.ajouter(v)
  const insts = instances(p, valeurs)
  const cScanner = contrôle('analyse', 'tfpv scanner (syntax, variables, modules, references)', 'tfpv')
  await chrono(cScanner, () => { const r = vérifierProjet(p, valeurs, { externes: options.variablesExternes || [] }); cScanner.constats = r.constats; cScanner.passed_count = r.réussis })
  const distants = p.trous.filter(x => x.type === 'module_distant' || x.type === 'module_hors_dossier')
  if (distants.length) { cScanner.partial = true; cScanner.reason = `${distants.length} module(s) not analysed: ${distants.map(x => x.message).join(' ; ')}` }
  if (p.json.length) { cScanner.partial = true; cScanner.reason = `${cScanner.reason ? `${cScanner.reason} ; ` : ''}${p.json.length} .tf.json file(s) not analysed in the app` }
  await étape(1, 'done')

  await étape(2, 'running')
  const cSchéma = contrôle('schema', `Provider schemas (aws ${MANIFESTE.aws}) — terraform validate equivalent`, 'schema')
  await chrono(cSchéma, () => {
    if (!données?.schémas) { cSchéma.status = 'error'; cSchéma.reason = 'provider schemas could not be loaded'; return }
    const r = validerSchémas(p, données.schémas)
    cSchéma.constats = r.constats
    cSchéma.passed_count = r.réussis
    const manquants = Object.entries(r.sansSchéma)
    if (manquants.length) { cSchéma.partial = true; cSchéma.reason = `no embedded schema for provider(s) ${manquants.map(([pr, s]) => `${pr} (${s.size} type(s))`).join(', ')}` }
  })
  await étape(2, 'done')

  await étape(3, 'running')
  const cTflint = contrôle('tflint_aws', `TFLint AWS ruleset ${MANIFESTE.tflint_aws} (embedded rules)`, 'tflint')
  let versionTflint = MANIFESTE.tflint_aws
  await chrono(cTflint, () => {
    if (!données?.tflint) { cTflint.status = 'error'; cTflint.reason = 'TFLint AWS data could not be loaded'; return }
    const prép = données.tflintPréparé || préparerTflint(données.tflint)
    versionTflint = prép.version || versionTflint
    const r = reglesTflint(insts, prép)
    cTflint.constats = r.constats
    cTflint.passed_count = r.réussis
  })
  await étape(3, 'done')

  await étape(4, 'running')
  const cCohérence = contrôle('coherence', 'tfpv AWS coherence (network, storage, databases, IAM, AMI)', 'tfpv')
  await chrono(cCohérence, () => {
    const r = cohérence(p, insts)
    cCohérence.constats = r.constats
    cCohérence.passed_count = r.réussis
    cCohérence.not_evaluated = r.nonÉvalués
    if (r.nonÉvalués) cCohérence.reason = `${r.nonÉvalués} evaluation(s) depend on values known only at apply time`
  })
  await étape(4, 'done')

  await étape(5, 'running')
  const cSécurité = contrôle('securite', 'Security (Checkov-equivalent policies)', 'security')
  await chrono(cSécurité, () => {
    const r = sécurité(p, insts)
    cSécurité.constats = r.constats
    cSécurité.passed_count = r.réussis
    cSécurité.not_evaluated = r.nonÉvalués
  })
  await étape(5, 'done')

  await étape(6, 'running')
  const cFormat = contrôle('format', 'Formatting (terraform fmt approximation)', 'format')
  await chrono(cFormat, () => { const r = vérifierFormat(p); cFormat.constats = r.constats; cFormat.passed_count = r.réussis })
  await étape(6, 'done')

  await étape(7, 'running')
  const contrôles = [cScanner, cSchéma, cTflint, cCohérence, cSécurité, cFormat]
  const { actifs, supprimés } = consolider(contrôles, p, { surcharges: options.surcharges || {}, ignorer: options.ignorer || [] }, masqueur, versionTflint)
  const [st, raison, résumé] = statut(actifs, contrôles, seuil)
  résumé.suppressed = supprimés.length
  const rapport = {
    schema_version: '1.0',
    tool: { name: 'tfpv (in-app engine)', version: VERSION },
    project: { name: options.nomProjet || p.racineNom || 'projet', path: options.chemin || 'navigateur', var_files: options.fichiersVariables || [] },
    generated_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    duration_s: Math.round((Date.now() - t0) / 10) / 100,
    status: st, status_reason: raison, fail_on: seuil, summary: résumé,
    environment: { engine: `tfpv navigateur ${VERSION}`, aws_provider_schema: MANIFESTE.aws, tflint_aws_rules: versionTflint, knowledge_rules: MANIFESTE.knowledge_rules, runs_in: 'browser (no file leaves the device)' },
    checks: contrôles.map(c => masqueur.profond(Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'constats')))),
    inventory: inventaire(p, valeurs),
    findings: masqueur.profond(actifs),
    suppressed: masqueur.profond(supprimés),
    redaction: { applied: true, masked_values: masqueur.compte },
    notes: masqueur.profond([...p.trous.map(x => x.message), ...(p.tropGros.length ? [`${p.tropGros.length} file(s) over 5 MB ignored`] : [])]),
    scope: {
      covered: ['HCL syntax', 'variables and tfvars (values, types)', 'references, modules, providers', `provider schema validation (aws ${MANIFESTE.aws}, random, null, tls, local, archive, time, http, external, cloudinit)`, `TFLint AWS rules ${versionTflint}`, 'AWS coherence (CIDR, subnets, ports, EBS, RDS, IAM, AMI)', 'security policies equivalent to Checkov (selection)', 'formatting (approximation)'],
      not_covered: ['values known only at apply time', 'existence of AMIs/resources in your AWS account', 'provider validations not described in the schema', 'remote modules (registry, Git)', 'Checkov policies outside the embedded selection', 'exact terraform fmt output'],
    },
  }
  rapport.redaction.masked_values = masqueur.compte
  await étape(7, 'done')
  return rapport
}
