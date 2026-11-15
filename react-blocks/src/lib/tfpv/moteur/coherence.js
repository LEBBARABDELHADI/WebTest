// Validateur AWS (cohérence) : ce que ni le schéma du provider, ni TFLint, ni
// Checkov ne vérifient, et qui fait échouer plan ou apply : CIDR, sous-réseaux
// hors VPC ou qui se chevauchent, ports des groupes de sécurité, EBS, RDS,
// principaux IAM, AMI. Une valeur inconnue avant l'apply n'est jamais un échec.
import { enfants } from './hcl.js'
import { DocJson, INCONNU, RéfRessource, brut, connu, lireCidr, lireCidr6, littéral } from './expr.js'

const ABSENT = Symbol('absent')
const AMI = /^ami-([0-9a-f]{8}|[0-9a-f]{17})$/
const PRINCIPAL_SERVICE = /^[a-z0-9][a-z0-9.-]*\.amazonaws\.com(\.cn)?$/
const COMPTE = /^\d{12}$/
const ARN_PRINCIPAL = /^arn:aws[a-z-]*:(iam|sts)::\d{12}:[A-Za-z0-9+=,.@_/:*-]+$/
const ARN_FÉDÉRÉ = /^arn:aws[a-z-]*:iam::\d{12}:(saml-provider|oidc-provider)\/.+$/
export const ATTRS_POLITIQUE = {
  aws_iam_policy: ['policy'], aws_iam_role: ['assume_role_policy'], aws_iam_role_policy: ['policy'], aws_iam_user_policy: ['policy'],
  aws_iam_group_policy: ['policy'], aws_s3_bucket_policy: ['policy'], aws_sqs_queue_policy: ['policy'], aws_sns_topic_policy: ['policy'],
  aws_kms_key: ['policy'], aws_ecr_repository_policy: ['policy'], aws_secretsmanager_secret_policy: ['policy'],
}
const SANS_IOPS = new Set(['gp2', 'st1', 'sc1', 'standard'])
const PIOPS = new Set(['io1', 'io2'])
const TAILLE_MIN_EBS = { st1: 125, sc1: 125, io1: 4, io2: 4, gp2: 1, gp3: 1, standard: 1 }

const nombre = v => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() && !Number.isNaN(Number(v)) ? Number(v) : null)
const ligne = (b, n) => b.attributes[n]?.line ?? b.line

export function cohérence(projet, insts) {
  const t = { réussis: 0, échecs: 0, nonÉvalués: 0, constats: [], externes: { ami: [], instance_type: [], rds_engine: [] } }
  for (const inst of insts) new Règles(inst, t).tout()
  // Un même fichier peut être évalué par plusieurs instances de module.
  const vus = new Set()
  t.constats = t.constats.filter(c => {
    const k = `${c.ruleId}|${c.file}|${c.line}|${JSON.stringify(c.value)}`
    if (vus.has(k)) { t.échecs--; return false }
    vus.add(k)
    return true
  })
  return t
}

class Règles {
  constructor(inst, t) { this.inst = inst; this.t = t }
  get(b, n) { return b.attributes[n] ? this.inst.portée.éval(b.attributes[n]) : ABSENT }
  *items(type) { for (const [k, [b, rel]] of Object.entries(this.inst.module.resources).sort()) if (k.split('.')[0] === type) yield [k, b, rel] }
  adr(k) { return `${this.inst.préfixe}${k}` }
  échec(ruleId, message, rel, line, k, attribute, value, extra = {}) {
    this.t.échecs++
    this.t.constats.push({ engine: 'tfpv', engineRule: ruleId.toLowerCase(), ruleId, message, file: rel, line, resource: this.adr(k), attribute, value: value === undefined ? null : brut(value), tier: 'static', extra })
  }
  issue(ok) { if (ok === null) this.t.nonÉvalués++; else if (ok) this.t.réussis++ }
  tout() { this.réseau(); this.groupesSécurité(); this.stockage(); this.bases(); this.iam(); this.ec2() }

  cidr(v, rel, line, k, attribute, v6 = false) {
    if (v === ABSENT || v === null) return null
    if (typeof v !== 'string') { this.issue(null); return null }
    const c = v6 ? lireCidr6(v) : lireCidr(v)
    if (c.erreur || (!v6 && c.v6)) {
      const raison = c.erreur || 'IPv6 address in an IPv4 field'
      this.échec('NET_INVALID_CIDR', `"${v}" is not a valid IPv${v6 ? 6 : 4} CIDR block (${raison}).${c.suggestion ? ` Did you mean ${c.suggestion}?` : ''}`, rel, line, k, attribute, v)
      return null
    }
    this.issue(true)
    return c
  }

  réseau() {
    const vpcs = {}
    for (const [k, b, rel] of this.items('aws_vpc')) {
      if (b.attributes.count || b.attributes.for_each) { this.issue(null); continue }
      const v = this.get(b, 'cidr_block')
      const e = { cidrs: [], complet: true }
      vpcs[this.adr(k)] = e
      if (typeof v !== 'string') { e.complet = false; this.issue(null); continue }
      const c = this.cidr(v, rel, ligne(b, 'cidr_block'), k, 'cidr_block')
      if (!c) { e.complet = false; continue }
      e.cidrs.push(c)
      if (c.prefix < 16 || c.prefix > 28) this.échec('NET_VPC_CIDR_SIZE', `VPC CIDR ${c.texte} has a /${c.prefix} prefix; AWS accepts /16 to /28.`, rel, ligne(b, 'cidr_block'), k, 'cidr_block', v)
      else this.issue(true)
    }
    for (const [k, b, rel] of this.items('aws_vpc_ipv4_cidr_block_association')) {
      const réf = this.get(b, 'vpc_id')
      const v = this.get(b, 'cidr_block')
      const cible = réf instanceof RéfRessource && réf.attr === 'id' ? vpcs[réf.address] : null
      const c = typeof v === 'string' ? this.cidr(v, rel, ligne(b, 'cidr_block'), k, 'cidr_block') : null
      if (cible) { if (c) cible.cidrs.push(c); else cible.complet = false } else Object.values(vpcs).forEach(x => { x.complet = false })
    }
    const sousRéseaux = []
    for (const [k, b, rel] of this.items('aws_subnet')) {
      if (b.attributes.count || b.attributes.for_each) { this.issue(null); continue }
      const v = this.get(b, 'cidr_block')
      if (v === ABSENT) continue
      const c = this.cidr(v, rel, ligne(b, 'cidr_block'), k, 'cidr_block')
      if (!c) continue
      if (c.prefix < 16 || c.prefix > 28) this.échec('NET_SUBNET_CIDR_SIZE', `Subnet CIDR ${c.texte} has a /${c.prefix} prefix; AWS accepts /16 to /28.`, rel, ligne(b, 'cidr_block'), k, 'cidr_block', v)
      else this.issue(true)
      const réf = this.get(b, 'vpc_id')
      const vpc = réf instanceof RéfRessource && réf.attr === 'id' ? réf.address : null
      sousRéseaux.push({ k, b, rel, c, vpc })
      const e = vpc ? vpcs[vpc] : null
      if (!e || !e.complet || !e.cidrs.length) { this.issue(null); continue }
      const dedans = e.cidrs.some(x => c.base >= x.base && c.base + c.taille <= x.base + x.taille)
      if (dedans) this.issue(true)
      else this.échec('NET_SUBNET_OUTSIDE_VPC', `Subnet CIDR ${c.texte} is not inside the CIDR block(s) of ${vpc} (${e.cidrs.map(x => x.texte).join(', ')}).`, rel, ligne(b, 'cidr_block'), k, 'cidr_block', c.texte, { vpc })
    }
    const parVpc = {}
    for (const s of sousRéseaux) if (s.vpc) (parVpc[s.vpc] ||= []).push(s)
    for (const [vpc, liste] of Object.entries(parVpc)) {
      liste.sort((a, b) => a.rel.localeCompare(b.rel) || a.b.line - b.b.line)
      liste.forEach((s, i) => {
        const conflit = liste.slice(0, i).find(o => o.c.base < s.c.base + s.c.taille && s.c.base < o.c.base + o.c.taille)
        if (conflit) this.échec('NET_SUBNET_OVERLAP', `Subnet CIDR ${s.c.texte} overlaps ${this.adr(conflit.k)} (${conflit.c.texte}) in ${vpc}.`, s.rel, ligne(s.b, 'cidr_block'), s.k, 'cidr_block', s.c.texte, { other: this.adr(conflit.k) })
        else if (i) this.issue(true)
      })
    }
  }

  groupesSécurité() {
    const règle = (k, b, rel, attrProto = 'protocol') => {
      const fp = this.get(b, 'from_port')
      const tp = this.get(b, 'to_port')
      const proto = this.get(b, attrProto)
      const l4 = this.get(b, 'cidr_blocks')
      if (Array.isArray(l4)) l4.forEach(x => this.cidr(x, rel, ligne(b, 'cidr_blocks'), k, 'cidr_blocks'))
      const l6 = this.get(b, 'ipv6_cidr_blocks')
      if (Array.isArray(l6)) l6.forEach(x => this.cidr(x, rel, ligne(b, 'ipv6_cidr_blocks'), k, 'ipv6_cidr_blocks', true))
      const f = nombre(fp)
      const to = nombre(tp)
      const p = typeof proto === 'string' || typeof proto === 'number' ? String(proto).toLowerCase() : null
      if (p === null || f === null || to === null) { this.issue(null); return }
      const l = ligne(b, 'from_port')
      if (p === '-1' || p === 'all') {
        if (f !== 0 || to !== 0) this.échec('SG_ALL_PROTOCOL_WITH_PORTS', `protocol "${proto}" (all traffic) with from_port=${f} and to_port=${to}: all ports are opened, not the ones written, and the provider expects 0/0.`, rel, l, k, 'protocol', { protocol: proto, from_port: f, to_port: to })
        else this.issue(true)
        return
      }
      if (['tcp', 'udp', '6', '17'].includes(p)) {
        if (f > to || f < 0 || to > 65535) this.échec('SG_PORT_RANGE_INVALID', `Invalid port range from_port=${f} to_port=${to} for protocol ${proto}.`, rel, l, k, 'from_port', { from_port: f, to_port: to })
        else this.issue(true)
        return
      }
      this.issue(true)
    }
    for (const [k, b, rel] of this.items('aws_security_group')) for (const c of b.blocks) { if (c.type === 'ingress' || c.type === 'egress') règle(k, c, rel); else if (c.type === 'dynamic') this.issue(null) }
    for (const [k, b, rel] of this.items('aws_security_group_rule')) règle(k, b, rel)
    for (const type of ['aws_vpc_security_group_ingress_rule', 'aws_vpc_security_group_egress_rule']) {
      for (const [k, b, rel] of this.items(type)) {
        this.cidr(this.get(b, 'cidr_ipv4'), rel, ligne(b, 'cidr_ipv4'), k, 'cidr_ipv4')
        this.cidr(this.get(b, 'cidr_ipv6'), rel, ligne(b, 'cidr_ipv6'), k, 'cidr_ipv6', true)
        const proto = this.get(b, 'ip_protocol')
        if (typeof proto === 'string' && ['tcp', 'udp', '6', '17'].includes(proto.toLowerCase())) {
          const f = nombre(this.get(b, 'from_port'))
          const to = nombre(this.get(b, 'to_port'))
          if (f !== null && to !== null && (f > to || f < 0 || to > 65535)) this.échec('SG_PORT_RANGE_INVALID', `Invalid port range from_port=${f} to_port=${to}.`, rel, ligne(b, 'from_port'), k, 'from_port', { from_port: f, to_port: to })
          else this.issue(f !== null && to !== null ? true : null)
        }
      }
    }
  }

  ebs(k, b, rel, attrType, attrTaille, autonome) {
    const t = this.get(b, attrType)
    if (typeof t !== 'string') { this.issue(null); return }
    const type = t.toLowerCase()
    const iops = this.get(b, 'iops')
    const débit = this.get(b, 'throughput')
    const taille = nombre(this.get(b, attrTaille))
    const plus = autonome ? {} : { severity: 'MEDIUM', fails_at: 'apply', confidence: 'medium' }
    if (SANS_IOPS.has(type) && iops !== ABSENT && iops !== null) this.échec('EBS_IOPS_NOT_SUPPORTED', `iops is set but volume type "${type}" does not support provisioned IOPS.`, rel, ligne(b, 'iops'), k, 'iops', connu(iops) ? iops : null, plus)
    else this.issue(true)
    if (PIOPS.has(type) && (iops === ABSENT || iops === null)) this.échec('EBS_IOPS_REQUIRED', `Volume type "${type}" requires iops.`, rel, ligne(b, attrType), k, 'iops', null, autonome ? {} : { fails_at: 'apply' })
    else this.issue(true)
    if (débit !== ABSENT && débit !== null && type !== 'gp3') this.échec('EBS_THROUGHPUT_NOT_SUPPORTED', `throughput is only supported on gp3 volumes (type is "${type}").`, rel, ligne(b, 'throughput'), k, 'throughput', connu(débit) ? débit : null, plus)
    else this.issue(true)
    const min = TAILLE_MIN_EBS[type]
    if (min !== undefined && taille !== null) {
      if (taille < min) this.échec('EBS_SIZE_BELOW_MINIMUM', `Volume size ${taille} GiB is below the ${min} GiB minimum for "${type}".`, rel, ligne(b, attrTaille), k, attrTaille, taille)
      else this.issue(true)
    } else this.issue(null)
  }

  stockage() {
    for (const [k, b, rel] of this.items('aws_ebs_volume')) this.ebs(k, b, rel, 'type', 'size', true)
    for (const type of ['aws_instance', 'aws_spot_instance_request']) {
      for (const [k, b, rel] of this.items(type)) for (const c of b.blocks) if ((c.type === 'root_block_device' || c.type === 'ebs_block_device') && c.attributes.volume_type) this.ebs(k, c, rel, 'volume_type', 'volume_size', false)
    }
    for (const [k, b, rel] of this.items('aws_launch_template')) for (const bdm of enfants(b, 'block_device_mappings')) for (const e of enfants(bdm, 'ebs')) if (e.attributes.volume_type) this.ebs(k, e, rel, 'volume_type', 'volume_size', false)
  }

  bases() {
    for (const [k, b, rel] of this.items('aws_db_instance')) {
      const engine = this.get(b, 'engine')
      const alloc = nombre(this.get(b, 'allocated_storage'))
      const max = nombre(this.get(b, 'max_allocated_storage'))
      const st = this.get(b, 'storage_type')
      const iops = this.get(b, 'iops')
      if (alloc !== null && max !== null && max > 0) {
        if (max < alloc) this.échec('RDS_MAX_STORAGE_BELOW_ALLOCATED', `max_allocated_storage (${max}) is lower than allocated_storage (${alloc}).`, rel, ligne(b, 'max_allocated_storage'), k, 'max_allocated_storage', max)
        else this.issue(true)
      } else if (b.attributes.max_allocated_storage) this.issue(null)
      if (typeof st === 'string') {
        const s = st.toLowerCase()
        if ((s === 'gp2' || s === 'standard') && iops !== ABSENT && iops !== null) this.échec('RDS_IOPS_STORAGE_TYPE_CONFLICT', `iops is set but storage_type "${s}" does not support provisioned IOPS.`, rel, ligne(b, 'iops'), k, 'iops', connu(iops) ? iops : null)
        else if (PIOPS.has(s) && (iops === ABSENT || iops === null)) this.échec('RDS_IOPS_STORAGE_TYPE_CONFLICT', `storage_type "${s}" requires iops.`, rel, ligne(b, 'storage_type'), k, 'iops', null)
        else this.issue(true)
      } else this.issue(b.attributes.storage_type ? null : true)
      const multi = this.get(b, 'multi_az')
      const az = b.attributes.availability_zone
      if (multi === true && az) this.échec('RDS_MULTI_AZ_WITH_AZ', 'multi_az = true cannot be combined with availability_zone.', rel, az.line, k, 'availability_zone', connu(littéral(az.tokens)) ? littéral(az.tokens) : null)
      else this.issue(multi !== INCONNU ? true : null)
      if (typeof engine === 'string' && engine.startsWith('aurora') && !b.attributes.cluster_identifier) this.échec('RDS_AURORA_ENGINE_ON_INSTANCE', `Engine "${engine}" requires an aws_rds_cluster (cluster_identifier is not set).`, rel, ligne(b, 'engine'), k, 'engine', engine)
      else if (typeof engine === 'string') this.issue(true)
      const restauré = ['replicate_source_db', 'snapshot_identifier', 'restore_to_point_in_time', 's3_import'].some(a => b.attributes[a])
      if (typeof engine === 'string' && !engine.startsWith('aurora') && alloc !== null && !restauré) {
        const s = typeof st === 'string' ? st.toLowerCase() : iops !== ABSENT && iops !== null ? 'io1' : 'gp2'
        const min = PIOPS.has(s) ? 100 : s === 'gp2' || s === 'gp3' ? 20 : null
        if (min && alloc < min) this.échec('RDS_STORAGE_BELOW_MINIMUM', `allocated_storage ${alloc} GiB is below the usual ${min} GiB minimum for ${s} storage.`, rel, ligne(b, 'allocated_storage'), k, 'allocated_storage', alloc)
        else if (min) this.issue(true)
      }
    }
  }

  principaux(principal, rel, line, k, attribute) {
    if (principal === INCONNU || principal === null || principal === undefined) { this.issue(null); return }
    if (principal === '*') { this.issue(true); return }
    if (typeof principal !== 'object' || Array.isArray(principal)) { this.issue(null); return }
    for (const [type, ids] of Object.entries(principal)) {
      for (const id of Array.isArray(ids) ? ids : [ids]) {
        if (typeof id !== 'string') { this.issue(null); continue }
        let mauvais = null
        if (type === 'Service' && !PRINCIPAL_SERVICE.test(id)) mauvais = `"${id}" is not a valid service principal${id.endsWith('.amazon.com') ? ` (did you mean "${id.replace(/\.amazon\.com$/, '.amazonaws.com')}"?)` : ' (expected <service>.amazonaws.com)'}`
        else if (type === 'AWS' && !(id === '*' || COMPTE.test(id) || ARN_PRINCIPAL.test(id))) mauvais = `"${id}" is not a valid AWS principal (expected a 12-digit account ID, an IAM/STS ARN or "*")`
        else if (type === 'Federated' && id.startsWith('arn:') && !ARN_FÉDÉRÉ.test(id)) mauvais = `"${id}" is not a valid federated principal ARN`
        if (mauvais) this.échec('IAM_INVALID_PRINCIPAL', `${mauvais}.`, rel, line, k, attribute, id)
        else this.issue(true)
      }
    }
  }

  document(doc, rel, line, k, attribute) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) { this.issue(null); return }
    const st = Array.isArray(doc.Statement) ? doc.Statement : doc.Statement && typeof doc.Statement === 'object' ? [doc.Statement] : []
    for (const s of st) if (s && typeof s === 'object') for (const clé of ['Principal', 'NotPrincipal']) if (clé in s) this.principaux(s[clé], rel, line, k, attribute)
  }

  iam() {
    for (const [type, attrs] of Object.entries(ATTRS_POLITIQUE)) {
      for (const [k, b, rel] of this.items(type)) {
        const cibles = [...attrs.map(a => [b, a]), ...enfants(b, 'inline_policy').map(c => [c, 'policy'])]
        for (const [blk, attr] of cibles) {
          const v = this.get(blk, attr)
          if (v === ABSENT || v === null) continue
          const l = ligne(blk, attr)
          if (v instanceof RéfRessource && v.attr === 'json' && `.${v.address}`.includes('.aws_iam_policy_document.')) continue
          if (v instanceof DocJson) this.document(v.value, rel, l, k, attr)
          else if (typeof v === 'string') {
            let doc
            try { doc = JSON.parse(v) } catch (e) { this.échec('IAM_POLICY_INVALID_JSON', `${attr} is not valid JSON: ${String(e.message).slice(0, 120)}.`, rel, l, k, attr, null); continue }
            this.issue(true)
            this.document(doc, rel, l, k, attr)
          } else this.issue(null)
        }
      }
    }
    for (const [k, [b, rel]] of Object.entries(this.inst.module.data).sort()) {
      if (k.split('.')[0] !== 'aws_iam_policy_document') continue
      for (const st of enfants(b, 'statement')) for (const pb of [...enfants(st, 'principals'), ...enfants(st, 'not_principals')]) {
        const type = this.get(pb, 'type')
        const ids = this.get(pb, 'identifiers')
        if (typeof type === 'string' && Array.isArray(ids)) this.principaux({ [type]: ids }, rel, ligne(pb, 'identifiers'), `data.${k}`, 'identifiers')
        else this.issue(null)
      }
    }
  }

  ec2() {
    for (const [type, attr] of [['aws_instance', 'ami'], ['aws_spot_instance_request', 'ami'], ['aws_launch_template', 'image_id'], ['aws_launch_configuration', 'image_id']]) {
      for (const [k, b, rel] of this.items(type)) {
        const v = this.get(b, attr)
        if (v === ABSENT) continue
        if (typeof v !== 'string') { this.issue(null); continue }
        if (v.startsWith('resolve:ssm:') || AMI.test(v)) this.issue(true)
        else this.échec('EC2_AMI_ID_MALFORMED', `"${v}" is not a valid AMI ID (expected ami- followed by 8 or 17 hex characters).`, rel, ligne(b, attr), k, attr, v)
      }
    }
  }
}
