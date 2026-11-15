// Moteur de diagnostic et de recommandation : règle canonique, explication,
// gravité, ressource et ligne exactes, extrait de code masqué, dédoublonnage,
// suppressions (# tfpv:ignore, # tflint-ignore, #checkov:skip), statut final.
import KB from '../donnees/connaissances.js'
import { brut } from './expr.js'
import { localiser, texteFichier } from './projet.js'

export const GRAVITÉ_RANG = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
const GÉNÉRIQUES = new Set(['SECURITY_GENERIC', 'TF_LINT', 'AWS_INVALID_ATTRIBUTE_VALUE', 'TF_VALIDATE_ERROR', 'TF_VALIDATE_WARNING'])
const GRAVITÉ_MOTEUR = { error: 'HIGH', warning: 'MEDIUM', notice: 'LOW', info: 'LOW' }
const DEEP = /^aws_\w+_invalid_(ami|iam_profile|key_name|subnet|vpc_security_group|security_group|db_subnet_group|option_group|parameter_group|image_id|route_table|gateway|nat_gateway|instance|network_interface|vpc_peering_connection|egress_only_gateway|security_groups|subnets)$/

export function règleTflint(nom) {
  if (KB.tflint_map[nom]) return KB.tflint_map[nom]
  if (DEEP.test(nom)) return 'AWS_INVALID_REFERENCE_DEEP'
  if (nom.startsWith('aws_') && nom.endsWith('_previous_type')) return 'AWS_PREVIOUS_GENERATION_TYPE'
  if (nom.startsWith('aws_') && nom.includes('_deprecated_')) return 'AWS_DEPRECATED'
  if (nom.startsWith('aws_') && nom.includes('_invalid_')) return 'AWS_INVALID_ATTRIBUTE_VALUE'
  if (nom === 'aws_route_not_specified_target') return 'AWS_ROUTE_WITHOUT_TARGET'
  return 'TF_LINT'
}

function lienTflint(nom, version) {
  const nommées = new Set(['aws_instance_invalid_type', 'aws_instance_previous_type', 'aws_db_instance_invalid_type', 'aws_db_instance_invalid_engine', 'aws_db_instance_previous_type', 'aws_db_instance_default_parameter_group', 'aws_route_not_specified_target', 'aws_route_specified_multiple_targets', 'aws_s3_bucket_name', 'aws_lambda_function_deprecated_runtime'])
  const base = `https://github.com/terraform-linters/tflint-ruleset-aws/blob/v${version}/docs/rules`
  return nommées.has(nom) ? `${base}/${nom}.md` : `${base}/README.md`
}

const MASQUE = '***REDACTED***'
const NOM_SECRET = /(pass(word|wd|phrase)?|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|credential|auth|signing[_-]?key|session[_-]?key)/i
const MOTIFS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\b(AKIA|ASIA|AGPA|AIDA|AROA|ANPA|ANVA|AIPA)[A-Z0-9]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g, /\bglpat-[A-Za-z0-9_-]{16,}\b/g, /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
]
const AFFECTATION = /(["']?[A-Za-z0-9_.-]*(?:pass(?:word|wd|phrase)?|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|credentials?)[A-Za-z0-9_.-]*["']?\s*[:=]\s*)(["'])([^"'\n]+)\2/gi

export class Masqueur {
  constructor() { this.valeurs = new Set(); this.compte = 0 }
  ajouter(v) { if (typeof v === 'string' && v.length >= 4 && !['true', 'false', 'null'].includes(v)) this.valeurs.add(v) }
  texte(s) {
    if (typeof s !== 'string' || !s) return s
    let out = s
    for (const v of [...this.valeurs].sort((a, b) => b.length - a.length)) if (out.includes(v)) { this.compte += out.split(v).length - 1; out = out.split(v).join(MASQUE) }
    for (const m of MOTIFS) out = out.replace(m, () => { this.compte++; return MASQUE })
    out = out.replace(AFFECTATION, (tout, clé, q, val) => {
      if (val === MASQUE || val.startsWith('${') || val.startsWith('var.') || val.startsWith('***')) return tout
      this.compte++
      return `${clé}${q}${MASQUE}${q}`
    })
    return out
  }
  valeur(attr, v) {
    if (v === null || v === undefined) return null
    if (attr && NOM_SECRET.test(attr)) { this.compte++; return MASQUE }
    if (typeof v === 'string') return this.texte(v)
    if (Array.isArray(v)) return v.map(x => this.valeur(null, x))
    if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, this.valeur(k, x)]))
    return v
  }
  profond(o) {
    if (typeof o === 'string') return this.texte(o)
    if (Array.isArray(o)) return o.map(x => this.profond(x))
    if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, this.profond(v)]))
    return o
  }
}

function hachage(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

function conseil(raw, options, versionTflint) {
  let kbId = raw.ruleId
  if (!kbId && raw.engine === 'tflint') kbId = règleTflint(raw.engineRule)
  if (!kbId && raw.engine === 'security') kbId = KB.checkov_map[raw.engineRule] || 'SECURITY_GENERIC'
  const r = KB.rules[kbId] || KB.rules.SECURITY_GENERIC
  let ruleId = kbId in KB.rules ? kbId : 'SECURITY_GENERIC'
  let titre = r.title
  let description = r.description
  let gravité = r.severity
  let bloquant = r.blocking
  let échoueÀ = r.fails_at
  const références = [...r.references]
  if (GÉNÉRIQUES.has(ruleId)) {
    if (raw.engine === 'tflint') { titre = `${r.title}: ${raw.engineRule}`; description = `${r.description} TFLint: ${raw.message}` }
    if (raw.engineSeverity) gravité = GRAVITÉ_MOTEUR[raw.engineSeverity] || gravité
  }
  if (raw.engine === 'tflint' && ruleId === 'AWS_INVALID_INSTANCE_TYPE') description = `${r.description} (${raw.message})`
  if ((raw.engineSeverity || '') === 'warning' && raw.engine !== 'tflint') { bloquant = false; échoueÀ = 'none'; if (GRAVITÉ_RANG[gravité] >= 3) gravité = 'LOW' }
  if (raw.engine === 'tflint') { const l = lienTflint(raw.engineRule, versionTflint); if (!références.includes(l)) références.unshift(l) }
  const extra = raw.extra || {}
  if (extra.severity) gravité = extra.severity
  if (extra.fails_at) échoueÀ = extra.fails_at
  for (const k of [ruleId, kbId, raw.engineRule]) if (options.surcharges?.[k]) { gravité = options.surcharges[k]; break }
  return { ruleId, titre, description, cause: r.cause, recommandation: r.recommendation, correctif: r.fix, références: [...new Set(références)], gravité, catégorie: r.category, bloquant, échoueÀ, confiance: extra.confidence || r.confidence, niveau: raw.tier && raw.tier !== 'static' ? raw.tier : r.tier }
}

function extrait(p, rel, line, masqueur, rayon = 3) {
  if (!rel || !line) return null
  const t = texteFichier(p, rel)
  if (t === null) return null
  const lignes = t.split('\n')
  if (line > lignes.length + 1) return null
  const début = Math.max(1, line - rayon)
  const fin = Math.min(lignes.length, line + rayon)
  const out = []
  for (let i = début; i <= fin; i++) { const s = lignes[i - 1]; out.push(masqueur.texte(s.length > 300 ? `${s.slice(0, 300)}…` : s)) }
  return { start_line: début, highlight: line, lines: out }
}

const IGNORE_TFPV = /#\s*tfpv:ignore(?:[=:\s]+([A-Za-z0-9_,\s]*?))?\s*(?:--\s*(.*))?$/
const IGNORE_TFLINT = /(?:#|\/\/)\s*tflint-ignore:\s*([A-Za-z0-9_,\s]+?)\s*(?:#.*)?$/
const SKIP_CHECKOV = /checkov:skip=([A-Z0-9_]+)(?::(.*))?/g

function suppression(p, f) {
  if (!f.file || !f.line) return null
  const t = texteFichier(p, f.file)
  if (!t) return null
  const lignes = t.split('\n')
  for (const l of [f.line, f.line - 1]) {
    if (l < 1 || l > lignes.length) continue
    const m = IGNORE_TFPV.exec(lignes[l - 1])
    if (m) {
      const règles = (m[1] || '').split(/[,\s]+/).filter(Boolean)
      if (!règles.length || règles.includes(f.rule_id) || f.engine_rules.some(r => règles.includes(r))) return (m[2] || 'inline tfpv:ignore').trim()
    }
    const t2 = IGNORE_TFLINT.exec(lignes[l - 1])
    if (t2 && f.engines.includes('tflint')) {
      const règles = t2[1].split(/[,\s]+/).filter(Boolean)
      if (règles.includes('all') || f.engine_rules.some(r => règles.includes(r))) return 'tflint-ignore annotation'
    }
  }
  if (f.engines.includes('security')) {
    const hf = p.analysés[f.file]
    const b = hf?.blocks.find(x => x.line <= f.line && f.line <= x.endLine)
    if (b) {
      for (let l = b.line; l <= b.endLine; l++) {
        for (const m of (lignes[l - 1] || '').matchAll(SKIP_CHECKOV)) if (f.engine_rules.includes(m[1])) return (m[2] || `checkov:skip=${m[1]}`).trim()
      }
    }
  }
  return null
}

export function normaliser(raw, p, options, masqueur, versionTflint) {
  const c = conseil(raw, options, versionTflint)
  const ressource = raw.resource || localiser(p, raw.file, raw.line)
  let valeur = brut(raw.value ?? null)
  if (raw.extra?.sensitive) { valeur = MASQUE; masqueur.compte++ }
  valeur = masqueur.valeur(raw.attribute, valeur)
  return {
    id: hachage(`${c.ruleId}|${raw.file}|${raw.line}|${ressource}|${raw.engineRule}`), rule_id: c.ruleId, title: masqueur.texte(c.titre), severity: c.gravité,
    category: c.catégorie, blocking: c.bloquant, fails_at: c.échoueÀ, file: raw.file || null, line: raw.line || null, end_line: raw.endLine || null,
    resource: ressource, attribute: raw.attribute || null, value: valeur, description: masqueur.texte(c.description), cause: c.cause,
    recommendation: c.recommandation, fix: c.correctif, references: c.références, engines: [raw.engine], engine_rules: [raw.engineRule],
    message: masqueur.texte(raw.message), tier: c.niveau, confidence: c.confiance, snippet: extrait(p, raw.file, raw.line, masqueur), suppressed: false, suppression_reason: null,
  }
}

export function consolider(contrôles, p, options, masqueur, versionTflint) {
  const fusion = new Map()
  for (const c of contrôles) {
    for (const raw of c.constats) {
      const f = normaliser(raw, p, options, masqueur, versionTflint)
      const clé = raw.engine === 'security' && f.resource ? `sec|${f.rule_id}|${f.file}|${f.resource}` : `${f.rule_id}|${f.file}|${f.line}|${f.rule_id.startsWith('NET_') || f.rule_id.startsWith('IAM_') ? JSON.stringify(f.value) : ''}`
      const m = fusion.get(clé)
      if (!m) { fusion.set(clé, f); continue }
      for (const e of f.engines) if (!m.engines.includes(e)) m.engines.push(e)
      for (const r of f.engine_rules) if (!m.engine_rules.includes(r)) m.engine_rules.push(r)
      if (GRAVITÉ_RANG[f.severity] > GRAVITÉ_RANG[m.severity]) m.severity = f.severity
    }
  }
  // Un constat générique (valeur refusée par l'API) qui double un constat précis
  // sur le même attribut disparaît au profit du précis.
  const tous = [...fusion.values()]
  const précis = new Map()
  for (const f of tous) if (!GÉNÉRIQUES.has(f.rule_id) && f.attribute) précis.set(`${f.file}|${f.line}|${f.attribute}`, f)
  const gardés = tous.filter(f => {
    if (!GÉNÉRIQUES.has(f.rule_id) || !f.attribute) return true
    const m = précis.get(`${f.file}|${f.line}|${f.attribute}`)
    if (!m) return true
    for (const e of f.engines) if (!m.engines.includes(e)) m.engines.push(e)
    for (const r of f.engine_rules) if (!m.engine_rules.includes(r)) m.engine_rules.push(r)
    return false
  })
  const ignorer = new Set(options.ignorer || [])
  const actifs = []
  const supprimés = []
  for (const f of gardés) {
    let raison = suppression(p, f)
    if (raison === null && (ignorer.has(f.rule_id) || f.engine_rules.some(r => ignorer.has(r)))) raison = 'ignored in the tool settings'
    if (raison) { f.suppressed = true; f.suppression_reason = masqueur.texte(raison); supprimés.push(f) } else actifs.push(f)
  }
  actifs.sort((a, b) => GRAVITÉ_RANG[b.severity] - GRAVITÉ_RANG[a.severity] || Number(b.blocking) - Number(a.blocking) || (a.file || '~').localeCompare(b.file || '~') || (a.line || 0) - (b.line || 0) || a.rule_id.localeCompare(b.rule_id))
  return { actifs, supprimés }
}

export function statut(constats, contrôles, seuil) {
  const auDessus = f => f.blocking || GRAVITÉ_RANG[f.severity] >= GRAVITÉ_RANG[seuil]
  const échecs = constats.filter(auDessus)
  const avertissements = constats.filter(f => !auDessus(f))
  const nonFaits = contrôles.filter(c => c.required && (c.status === 'skipped' || c.status === 'error'))
  const partiels = contrôles.filter(c => c.required && c.partial && ['passed', 'failed'].includes(c.status))
  const réussis = contrôles.filter(c => ['passed', 'failed'].includes(c.status)).reduce((n, c) => n + (c.passed_count || 0), 0)
  const résumé = {
    total_checks: réussis + échecs.length + avertissements.length, passed: réussis, failed: échecs.length, warnings: avertissements.length,
    blocking: constats.filter(f => f.blocking).length, not_run: nonFaits.length, not_evaluated: contrôles.reduce((n, c) => n + (c.not_evaluated || 0), 0),
    by_severity: Object.fromEntries(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => [s, constats.filter(f => f.severity === s).length])),
    by_category: constats.reduce((o, f) => ({ ...o, [f.category]: (o[f.category] || 0) + 1 }), {}),
    files_with_findings: new Set(constats.filter(f => f.file).map(f => f.file)).size,
  }
  const lacunes = [...nonFaits.map(c => `${c.id} (${c.reason})`), ...partiels.map(c => `${c.id} partial (${c.reason})`)]
  if (échecs.length) return ['FAILED', `${échecs.length} finding(s) blocking or at/above ${seuil}${lacunes.length ? `; also not fully validated: ${[...nonFaits, ...partiels].map(c => c.id).join(', ')}` : ''}`, résumé]
  if (lacunes.length) return ['INCOMPLETE', `Configuration NOT fully validated: ${lacunes.join('; ')}`, résumé]
  if (avertissements.length) return ['PASSED_WITH_WARNINGS', `No blocking finding; ${avertissements.length} warning(s) below ${seuil}`, résumé]
  return ['PASSED', 'All in-app checks ran; no finding', résumé]
}
