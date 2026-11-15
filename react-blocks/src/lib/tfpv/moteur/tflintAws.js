// Règles AWS de TFLint, à partir des données du ruleset officiel
// (tflint-ruleset-aws, extraites de son code source) : ~1 400 règles générées
// depuis les modèles de l'API AWS (valeurs autorisées, motifs, longueurs) et
// les règles écrites à la main (types d'instance, classes RDS, runtimes Lambda
// obsolètes, cibles de routes, noms de buckets S3).
import { connu } from './expr.js'

function compiler(r) {
  if (!r.p) return null
  try { return new RegExp(r.p, r.f) } catch {
    try { return new RegExp(r.p, (r.f || '').replace('u', '')) } catch { return null }
  }
}

export function préparerTflint(data) {
  const parType = new Map()
  let invalides = 0
  for (const r of data.generated) {
    const re = compiler(r)
    if (r.p && !re) invalides++
    const e = r.e ? new Set(r.e) : null
    if (!parType.has(r.r)) parType.set(r.r, [])
    parType.get(r.r).push({ ...r, re, e })
  }
  return {
    version: data.version, parType, invalides,
    familles: new Set(data.instance_previous_families), classesDb: new Set(data.db_instance_classes), anciennesDb: new Set(data.db_previous_classes),
    nœudsCache: new Set(data.elasticache_node_types), moteursDb: new Set(data.db_engines), cibles: data.route_targets, runtimes: data.lambda_runtimes,
  }
}

export function reglesTflint(insts, t, maintenant = new Date()) {
  const constats = []
  let réussis = 0
  const vus = new Set()
  const ajouter = (inst, k, rel, b, attr, règle, message, valeur, gravité = 'error') => {
    const clé = `${règle}|${rel}|${(attr && b.attributes[attr]?.line) || b.line}|${valeur}`
    if (vus.has(clé)) return
    vus.add(clé)
    constats.push({ engine: 'tflint', engineRule: règle, message, file: rel, line: (attr && b.attributes[attr]?.line) || b.line, resource: `${inst.préfixe}${k}`, attribute: attr, value: valeur ?? null, engineSeverity: gravité, tier: 'static', extra: {} })
  }
  for (const inst of insts) {
    for (const [k, [b, rel]] of Object.entries(inst.module.resources)) {
      const type = k.split('.')[0]
      const val = n => (b.attributes[n] ? inst.portée.éval(b.attributes[n]) : undefined)
      for (const r of t.parType.get(type) || []) {
        if (!b.attributes[r.a]) continue
        const v = val(r.a)
        if (typeof v !== 'string' || !connu(v)) continue
        let msg = null
        if (r.e && !r.e.has(v)) msg = `"${v}" is an invalid value as ${r.a}`
        else if (r.mx !== undefined && [...v].length > r.mx) msg = `${r.a} must be ${r.mx} characters or less`
        else if (r.mn !== undefined && [...v].length < r.mn) msg = `${r.a} must be ${r.mn} characters or higher`
        else if (r.re && !r.re.test(v)) msg = `"${v}" does not match valid pattern ${r.p}`
        if (msg) ajouter(inst, k, rel, b, r.a, r.n, msg, v, r.s)
        else réussis++
      }
      // Règles écrites à la main dans tflint-ruleset-aws
      if (type === 'aws_instance') {
        const it = val('instance_type')
        if (typeof it === 'string' && t.familles.has(it.split('.')[0])) ajouter(inst, k, rel, b, 'instance_type', 'aws_instance_previous_type', `"${it}" is previous generation instance type.`, it, 'warning')
      }
      if (type === 'aws_db_instance') {
        const cl = val('instance_class')
        if (typeof cl === 'string') {
          if (!t.classesDb.has(cl)) ajouter(inst, k, rel, b, 'instance_class', 'aws_db_instance_invalid_type', `"${cl}" is invalid instance type.`, cl)
          else if (t.anciennesDb.has(cl)) ajouter(inst, k, rel, b, 'instance_class', 'aws_db_instance_previous_type', `"${cl}" is previous generation instance type.`, cl, 'warning')
          else réussis++
        }
        const en = val('engine')
        if (typeof en === 'string') { if (!t.moteursDb.has(en)) ajouter(inst, k, rel, b, 'engine', 'aws_db_instance_invalid_engine', `"${en}" is invalid engine.`, en); else réussis++ }
        const pg = val('parameter_group_name')
        if (typeof pg === 'string' && pg.startsWith('default.')) ajouter(inst, k, rel, b, 'parameter_group_name', 'aws_db_instance_default_parameter_group', `"${pg}" is default parameter group. You cannot edit it.`, pg, 'notice')
      }
      if (type === 'aws_elasticache_cluster' || type === 'aws_elasticache_replication_group') {
        const nt = val('node_type')
        if (typeof nt === 'string') { if (!t.nœudsCache.has(nt)) ajouter(inst, k, rel, b, 'node_type', `${type}_invalid_type`, `"${nt}" is invalid node type.`, nt); else réussis++ }
      }
      if (type === 'aws_lambda_function') {
        const rt = val('runtime')
        const info = typeof rt === 'string' ? t.runtimes[rt] : null
        if (info?.end_of_support_date && new Date(info.end_of_support_date) < maintenant) {
          const bloque = info.block_update_date && new Date(info.block_update_date) < maintenant ? ' and can no longer be created or updated' : info.block_create_date && new Date(info.block_create_date) < maintenant ? ' and can no longer be used to create functions' : ''
          ajouter(inst, k, rel, b, 'runtime', 'aws_lambda_function_deprecated_runtime', `The "${rt}" runtime reached end of support on ${info.end_of_support_date.slice(0, 10)}${bloque}.`, rt, 'warning')
        } else if (typeof rt === 'string') réussis++
      }
      if (type === 'aws_route') {
        const présentes = t.cibles.filter(c => b.attributes[c])
        if (!présentes.length) ajouter(inst, k, rel, b, null, 'aws_route_not_specified_target', `The routing target is not specified, each aws_route must contain either ${t.cibles.join(', ')}.`, null)
        else if (présentes.length > 1) ajouter(inst, k, rel, b, présentes[1], 'aws_route_specified_multiple_targets', `More than one routing target specified. It must be one: ${présentes.join(', ')}.`, null)
        else réussis++
      }
      if (type === 'aws_s3_bucket') {
        const nom = val('bucket')
        if (typeof nom === 'string') {
          const pbs = []
          if (nom.length < 3 || nom.length > 63) pbs.push('must be between 3 and 63 characters long')
          if (/[^a-z0-9.-]/.test(nom)) pbs.push('can only contain lowercase letters, numbers, dots (.) and hyphens (-)')
          if (/^[^a-z0-9]|[^a-z0-9]$/.test(nom)) pbs.push('must begin and end with a letter or number')
          if (nom.includes('..')) pbs.push('must not contain two adjacent periods')
          if (/^\d+\.\d+\.\d+\.\d+$/.test(nom)) pbs.push('must not be formatted as an IP address')
          if (nom.startsWith('xn--') || nom.endsWith('-s3alias') || nom.endsWith('--ol-s3')) pbs.push('must not use a reserved prefix or suffix')
          if (pbs.length) ajouter(inst, k, rel, b, 'bucket', 'aws_s3_bucket_name', `Bucket name "${nom}" ${pbs.join('; ')}.`, nom)
          else réussis++
        }
      }
    }
  }
  return { constats, réussis }
}
