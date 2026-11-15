// Analyse de sécurité dans le navigateur : une sélection de politiques
// équivalentes à celles de Checkov (identifiants CKV_* conservés pour la
// traçabilité). Une valeur inconnue avant l'apply n'est jamais un échec.
import { enfants } from './hcl.js'
import { DocJson, INCONNU, RéfRessource, analyserJetons, connu, littéral, références } from './expr.js'
import { ATTRS_POLITIQUE } from './coherence.js'

const ABSENT = Symbol('absent')
const PORTS_SENSIBLES = { 3306: 'MySQL', 5432: 'PostgreSQL', 1433: 'SQL Server', 1521: 'Oracle', 27017: 'MongoDB', 6379: 'Redis', 9200: 'Elasticsearch', 5601: 'Kibana', 11211: 'Memcached', 2379: 'etcd', 9092: 'Kafka', 5984: 'CouchDB', 23: 'Telnet', 445: 'SMB', 21: 'FTP' }
const OUVERT = new Set(['0.0.0.0/0', '::/0'])
const ÉCRITURE = /^(Put|Create|Delete|Update|Attach|Detach|Modify|Run|Start|Stop|Terminate|Set|Add|Remove|Associate|Disassociate|Revoke|Authorize|Replace|Reset|Restore|Import|Upload|Invoke|Publish|Send|Pass|Enable|Disable|Register|Deregister|Tag|Untag|\*)/
const NOM_SECRET = /(^|_)(password|passwd|secret|token|api_key|apikey|private_key|client_secret|access_key|secret_key)$/i
const SECRET_DANS_TEXTE = /(AKIA|ASIA)[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(password|passwd|secret|api_key|token)\s*[=:]\s*["']?[^\s"'$]{4,}/i

const vrai = v => v === true || v === 'true'
const faux = v => v === false || v === 'false'

export function sécurité(p, insts) {
  const t = { constats: [], réussis: 0, nonÉvalués: 0 }
  const vus = new Set()
  const échec = (ruleId, engineRule, message, rel, line, adr, attribute = null, value = null, extra = {}) => {
    const k = `${ruleId}|${engineRule}|${rel}|${line}|${adr}`
    if (vus.has(k)) return
    vus.add(k)
    t.constats.push({ engine: 'security', engineRule, ruleId, message, file: rel, line, resource: adr, attribute, value, tier: 'static', extra: { checkov_equivalent: engineRule.startsWith('CKV'), ...extra } })
  }
  const ok = () => { t.réussis++ }
  const inconnu = () => { t.nonÉvalués++ }

  for (const inst of insts) {
    const m = inst.module
    const val = (b, n) => (b.attributes[n] ? inst.portée.éval(b.attributes[n]) : ABSENT)
    const items = type => Object.entries(m.resources).filter(([k]) => k.split('.')[0] === type).map(([k, [b, rel]]) => [k, b, rel, `${inst.préfixe}${k}`])
    const ligne = (b, n) => b.attributes[n]?.line ?? b.line
    // Ressources « filles » (ex. aws_s3_bucket_versioning.bucket = aws_s3_bucket.x.id)
    const liées = (type, attr, adr, nomLittéral) => {
      let incertain = false
      const trouvées = []
      for (const [, b] of items(type)) {
        const v = val(b, attr)
        if (v instanceof RéfRessource && v.address === adr) trouvées.push(b)
        else if (typeof v === 'string' && nomLittéral && v === nomLittéral) trouvées.push(b)
        else if (!(v instanceof RéfRessource) && typeof v !== 'string') incertain = true
      }
      return { trouvées, incertain }
    }

    // ---------- S3
    const bloquéCompte = items('aws_s3_account_public_access_block').some(([, b]) => ['block_public_acls', 'block_public_policy', 'ignore_public_acls', 'restrict_public_buckets'].every(a => vrai(val(b, a))))
    for (const [, b, rel, adr] of items('aws_s3_bucket')) {
      const nom = val(b, 'bucket')
      const nomL = typeof nom === 'string' ? nom : null
      const pab = liées('aws_s3_bucket_public_access_block', 'bucket', adr, nomL)
      if (bloquéCompte) ok()
      else if (pab.trouvées.length) {
        const faibles = ['block_public_acls', 'block_public_policy', 'ignore_public_acls', 'restrict_public_buckets'].filter(a => !vrai(val(pab.trouvées[0], a)))
        if (faibles.length) échec('S3_PUBLIC_ACCESS_BLOCK', 'CKV_AWS_53', `The public access block of ${adr} does not enable: ${faibles.join(', ')}.`, rel, pab.trouvées[0].line, adr)
        else ok()
      } else if (pab.incertain) inconnu()
      else échec('S3_PUBLIC_ACCESS_BLOCK', 'CKV2_AWS_6', `${adr} has no aws_s3_bucket_public_access_block.`, rel, b.line, adr)
      const sse = liées('aws_s3_bucket_server_side_encryption_configuration', 'bucket', adr, nomL)
      if (sse.trouvées.length || enfants(b, 'server_side_encryption_configuration').length) ok()
      else if (sse.incertain) inconnu()
      else échec('S3_BUCKET_ENCRYPTION', 'CKV_AWS_19', `${adr} has no explicit server-side encryption configuration.`, rel, b.line, adr)
      const ver = liées('aws_s3_bucket_versioning', 'bucket', adr, nomL)
      const héritée = enfants(b, 'versioning').some(v => vrai(val(v, 'enabled')))
      if (héritée || ver.trouvées.some(v => enfants(v, 'versioning_configuration').some(c => val(c, 'status') === 'Enabled'))) ok()
      else if (ver.incertain && !ver.trouvées.length) inconnu()
      else échec('S3_BUCKET_VERSIONING', 'CKV_AWS_21', `Versioning is not enabled on ${adr}.`, rel, b.line, adr)
      const log = liées('aws_s3_bucket_logging', 'bucket', adr, nomL)
      if (log.trouvées.length || enfants(b, 'logging').length) ok()
      else if (log.incertain) inconnu()
      else échec('S3_ACCESS_LOGGING', 'CKV_AWS_18', `Access logging is not configured for ${adr}.`, rel, b.line, adr)
      const acl = val(b, 'acl')
      if (typeof acl === 'string' && /^(public-read|public-read-write|authenticated-read)$/.test(acl)) échec('S3_PUBLIC_ACL', acl === 'public-read-write' ? 'CKV_AWS_57' : 'CKV_AWS_20', `${adr} uses the "${acl}" ACL.`, rel, ligne(b, 'acl'), adr, 'acl', acl)
    }
    for (const [, b, rel, adr] of items('aws_s3_bucket_acl')) {
      const acl = val(b, 'acl')
      if (typeof acl === 'string' && /^(public-read|public-read-write|authenticated-read)$/.test(acl)) échec('S3_PUBLIC_ACL', acl === 'public-read-write' ? 'CKV_AWS_57' : 'CKV_AWS_20', `The bucket ACL is "${acl}".`, rel, ligne(b, 'acl'), adr, 'acl', acl)
      else if (typeof acl === 'string') ok()
    }

    // ---------- Groupes de sécurité (entrées ouvertes à Internet)
    const entrée = (b, rel, adr, protoAttr, cidrs) => {
      const proto = val(b, protoAttr)
      const f = val(b, 'from_port')
      const to = val(b, 'to_port')
      const ouverts = cidrs.filter(c => typeof c === 'string' && OUVERT.has(c))
      if (!ouverts.length) { if (cidrs.every(connu)) ok(); else inconnu(); return }
      const p = typeof proto === 'string' || typeof proto === 'number' ? String(proto).toLowerCase() : null
      const tous = p === '-1' || p === 'all' || (f === 0 && to === 65535)
      const l = ligne(b, b.attributes.cidr_blocks ? 'cidr_blocks' : b.attributes.cidr_ipv4 ? 'cidr_ipv4' : 'from_port')
      if (p === null || (!tous && (typeof f !== 'number' || typeof to !== 'number'))) { inconnu(); return }
      if (tous) { échec('SG_ALL_PORTS_OPEN_TO_INTERNET', 'CKV_AWS_277', `All ports are open to ${ouverts.join(', ')}.`, rel, l, adr, 'cidr_blocks', ouverts); return }
      const couvre = port => f <= port && port <= to
      let trouvé = false
      if (couvre(22)) { échec('SG_SSH_OPEN_TO_INTERNET', 'CKV_AWS_24', `Port 22 (SSH) is open to ${ouverts.join(', ')}.`, rel, l, adr, 'cidr_blocks', { from_port: f, to_port: to }); trouvé = true }
      if (couvre(3389)) { échec('SG_RDP_OPEN_TO_INTERNET', 'CKV_AWS_25', `Port 3389 (RDP) is open to ${ouverts.join(', ')}.`, rel, l, adr, 'cidr_blocks', { from_port: f, to_port: to }); trouvé = true }
      const sensibles = Object.entries(PORTS_SENSIBLES).filter(([port]) => couvre(Number(port)))
      if (sensibles.length) { échec('SG_SENSITIVE_PORT_OPEN', 'sg_sensitive_port', `Sensitive port(s) open to ${ouverts.join(', ')}: ${sensibles.map(([port, n]) => `${port} (${n})`).join(', ')}.`, rel, l, adr, 'cidr_blocks', { from_port: f, to_port: to }); trouvé = true }
      if (couvre(80) && !trouvé) { échec('SG_HTTP_OPEN_TO_INTERNET', 'CKV_AWS_260', `Port 80 (HTTP) is open to ${ouverts.join(', ')}.`, rel, l, adr, 'cidr_blocks', { from_port: f, to_port: to }); trouvé = true }
      if (!trouvé) ok()
    }
    const liste = v => (Array.isArray(v) ? v : [])
    for (const [, b, rel, adr] of items('aws_security_group')) {
      let sansDescription = 0
      for (const c of b.blocks) {
        if (c.type === 'ingress') entrée(c, rel, adr, 'protocol', [...liste(val(c, 'cidr_blocks')), ...liste(val(c, 'ipv6_cidr_blocks'))])
        if ((c.type === 'ingress' || c.type === 'egress') && !c.attributes.description) sansDescription++
      }
      if (sansDescription) échec('SG_HYGIENE', 'CKV_AWS_23', `${sansDescription} rule(s) of ${adr} have no description.`, rel, b.line, adr)
    }
    for (const [, b, rel, adr] of items('aws_security_group_rule')) if (val(b, 'type') === 'ingress') entrée(b, rel, adr, 'protocol', [...liste(val(b, 'cidr_blocks')), ...liste(val(b, 'ipv6_cidr_blocks'))])
    for (const [, b, rel, adr] of items('aws_vpc_security_group_ingress_rule')) entrée(b, rel, adr, 'ip_protocol', [val(b, 'cidr_ipv4'), val(b, 'cidr_ipv6')].filter(x => x !== ABSENT))

    // ---------- IAM
    const déclarations = doc => {
      if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null
      const st = Array.isArray(doc.Statement) ? doc.Statement : doc.Statement && typeof doc.Statement === 'object' ? [doc.Statement] : []
      return st.filter(s => s && typeof s === 'object').map(s => ({ effet: s.Effect ?? 'Allow', actions: [].concat(s.Action ?? []), pasActions: [].concat(s.NotAction ?? []), ressources: [].concat(s.Resource ?? []), principal: s.Principal, condition: s.Condition }))
    }
    const analyserDéclarations = (sts, rel, line, adr, attribute, confiance) => {
      if (!sts) { inconnu(); return }
      for (const s of sts) {
        if (s.effet !== 'Allow') continue
        if (s.pasActions.length) échec('IAM_NOTACTION_ALLOW', 'iam_notaction_allow', `Allow with NotAction (${s.pasActions.filter(x => typeof x === 'string').join(', ')}).`, rel, line, adr, attribute)
        const actions = s.actions.filter(x => typeof x === 'string')
        const toutes = actions.includes('*') || actions.includes('*:*')
        const ressEtoile = s.ressources.includes('*')
        if (confiance && s.principal !== undefined) {
          const pr = s.principal
          const tout = pr === '*' || (pr && typeof pr === 'object' && [].concat(pr.AWS ?? []).includes('*'))
          if (tout && !s.condition) échec('IAM_TRUST_ANY_PRINCIPAL', 'CKV_AWS_60', `${adr} can be assumed by any AWS principal ("*") without condition.`, rel, line, adr, attribute)
          else ok()
          continue
        }
        if (toutes && ressEtoile) { échec('IAM_FULL_ADMIN', 'CKV_AWS_62', 'The policy allows "*" actions on "*" resources (full administrator).', rel, line, adr, attribute); continue }
        if (toutes) échec('IAM_WILDCARD_ACTION', 'CKV_AWS_63', 'The policy allows "*" actions.', rel, line, adr, attribute)
        const sensibles = actions.filter(a => /^(iam|sts|kms|organizations|secretsmanager):(\*|Pass.*|Create(AccessKey|LoginProfile|PolicyVersion)|Attach.*Policy|Put.*Policy|Update(AssumeRolePolicy|LoginProfile)|AssumeRole|Decrypt|GetSecretValue)$/i.test(a))
        if (ressEtoile && sensibles.length) échec('IAM_EXCESSIVE_PERMISSIONS', 'CKV_AWS_286', `Sensitive actions on "*": ${sensibles.join(', ')} (privilege escalation / credentials exposure).`, rel, line, adr, attribute)
        else if (ressEtoile && actions.some(a => ÉCRITURE.test(a.split(':')[1] || ''))) échec('IAM_WILDCARD_RESOURCE', 'CKV_AWS_355', `Write actions are allowed on Resource "*": ${actions.filter(a => ÉCRITURE.test(a.split(':')[1] || '')).slice(0, 5).join(', ')}.`, rel, line, adr, attribute)
        else if (!toutes) ok()
      }
    }
    for (const [type, attrs] of Object.entries(ATTRS_POLITIQUE)) {
      if (!type.startsWith('aws_iam_')) continue
      for (const [, b, rel, adr] of items(type)) {
        const cibles = [...attrs.map(a => [b, a]), ...enfants(b, 'inline_policy').map(c => [c, 'policy'])]
        for (const [blk, attr] of cibles) {
          const v = val(blk, attr)
          if (v === ABSENT || v === null) continue
          if (v instanceof RéfRessource) continue // document analysé à sa source (aws_iam_policy_document)
          let doc = v instanceof DocJson ? v.value : null
          if (typeof v === 'string') { try { doc = JSON.parse(v) } catch { doc = null } }
          analyserDéclarations(déclarations(doc), rel, ligne(blk, attr), adr, attr, attr === 'assume_role_policy')
        }
      }
    }
    const confianceDe = new Set()
    for (const [, b] of items('aws_iam_role')) {
      const a = b.attributes.assume_role_policy
      if (!a) continue
      for (const r of références(analyserJetons(a.tokens))) if (r.root === 'data' && r.path[0]?.[1] === 'aws_iam_policy_document') confianceDe.add(r.path[1]?.[1])
    }
    for (const [k, [b, rel]] of Object.entries(m.data)) {
      if (k.split('.')[0] !== 'aws_iam_policy_document') continue
      const sts = enfants(b, 'statement').map(s => ({
        effet: val(s, 'effect') === ABSENT ? 'Allow' : val(s, 'effect'),
        actions: liste(val(s, 'actions')), pasActions: liste(val(s, 'not_actions')), ressources: liste(val(s, 'resources')),
        principal: enfants(s, 'principals').length ? Object.fromEntries(enfants(s, 'principals').map(pb => [val(pb, 'type'), val(pb, 'identifiers')])) : undefined,
        condition: enfants(s, 'condition').length ? true : undefined, line: s.line,
      }))
      const confiance = confianceDe.has(k.split('.')[1])
      for (const s of sts) analyserDéclarations([s], rel, s.line, `${inst.préfixe}data.${k}`, 'statement', confiance)
    }
    for (const type of ['aws_iam_user_policy', 'aws_iam_user_policy_attachment']) for (const [, b, rel, adr] of items(type)) échec('IAM_HYGIENE', 'CKV_AWS_40', `${adr} attaches a policy directly to an IAM user.`, rel, b.line, adr)

    // ---------- RDS
    for (const type of ['aws_db_instance', 'aws_rds_cluster']) {
      for (const [, b, rel, adr] of items(type)) {
        const membre = type === 'aws_db_instance' && b.attributes.cluster_identifier
        const chiffré = val(b, 'storage_encrypted')
        if (!membre) {
          if (vrai(chiffré) || val(b, 'kms_key_id') instanceof RéfRessource || typeof val(b, 'kms_key_id') === 'string') ok()
          else if (chiffré === INCONNU) inconnu()
          else échec('RDS_UNENCRYPTED', type === 'aws_rds_cluster' ? 'CKV_AWS_96' : 'CKV_AWS_16', `${adr} does not set storage_encrypted = true.`, rel, ligne(b, 'storage_encrypted'), adr, 'storage_encrypted')
        }
        if (vrai(val(b, 'publicly_accessible'))) échec('RDS_PUBLICLY_ACCESSIBLE', 'CKV_AWS_17', `${adr} is publicly accessible.`, rel, ligne(b, 'publicly_accessible'), adr, 'publicly_accessible', true)
        else ok()
        const faibles = []
        if (!vrai(val(b, 'deletion_protection')) && !membre) faibles.push('deletion_protection')
        if (val(b, 'backup_retention_period') === 0) faibles.push('backup_retention_period = 0')
        if (faibles.length) échec('RDS_HARDENING', faibles[0] === 'deletion_protection' ? 'CKV_AWS_293' : 'CKV_AWS_133', `${adr}: ${faibles.join(', ')} not set as recommended.`, rel, b.line, adr)
      }
    }

    // ---------- EBS / EC2
    for (const [, b, rel, adr] of items('aws_ebs_volume')) {
      const e = val(b, 'encrypted')
      if (vrai(e)) ok(); else if (e === INCONNU) inconnu(); else échec('EBS_UNENCRYPTED', 'CKV_AWS_3', `${adr} is not encrypted.`, rel, ligne(b, 'encrypted'), adr, 'encrypted')
    }
    for (const type of ['aws_instance', 'aws_launch_template']) {
      for (const [, b, rel, adr] of items(type)) {
        const disques = type === 'aws_instance' ? [...enfants(b, 'root_block_device'), ...enfants(b, 'ebs_block_device')] : enfants(b, 'block_device_mappings').flatMap(x => enfants(x, 'ebs'))
        const nonChiffrés = disques.filter(d => !vrai(val(d, 'encrypted')))
        if ((type === 'aws_instance' && !enfants(b, 'root_block_device').length) || nonChiffrés.length) échec('EBS_UNENCRYPTED', 'CKV_AWS_8', `${adr}: block device(s) not encrypted.`, rel, (nonChiffrés[0] || b).line, adr)
        else ok()
        const md = enfants(b, 'metadata_options')[0]
        const jeton = md ? val(md, 'http_tokens') : ABSENT
        if (jeton === 'required') ok()
        else if (jeton === INCONNU) inconnu()
        else échec('EC2_IMDSV1_ENABLED', 'CKV_AWS_79', `${adr} accepts IMDSv1 (metadata_options.http_tokens is not "required").`, rel, md ? md.line : b.line, adr, 'http_tokens')
        if (type === 'aws_instance') {
          if (vrai(val(b, 'associate_public_ip_address'))) échec('EC2_PUBLIC_IP', 'CKV_AWS_88', `${adr} gets a public IP address.`, rel, ligne(b, 'associate_public_ip_address'), adr, 'associate_public_ip_address', true)
          const ud = val(b, 'user_data')
          if (typeof ud === 'string' && SECRET_DANS_TEXTE.test(ud)) échec('EC2_SECRETS_IN_USER_DATA', 'CKV_AWS_46', `${adr}: user_data seems to contain a secret.`, rel, ligne(b, 'user_data'), adr, 'user_data')
        }
      }
    }

    // ---------- Provider, KMS, CloudTrail, équilibreurs, VPC
    for (const [b, rel] of m.providers) {
      if (b.labels[0] !== 'aws') continue
      for (const a of ['access_key', 'secret_key']) {
        const v = b.attributes[a] ? littéral(b.attributes[a].tokens) : null
        if (typeof v === 'string' && v) échec('PROVIDER_HARDCODED_CREDENTIALS', 'CKV_AWS_41', `The aws provider contains a hard-coded ${a}.`, rel, b.attributes[a].line, `provider.aws`, a)
      }
    }
    for (const [, b, rel, adr] of items('aws_kms_key')) {
      const usage = val(b, 'key_usage')
      const spec = val(b, 'customer_master_key_spec')
      if ((usage === ABSENT || usage === 'ENCRYPT_DECRYPT') && (spec === ABSENT || spec === 'SYMMETRIC_DEFAULT')) {
        if (vrai(val(b, 'enable_key_rotation'))) ok(); else échec('KMS_KEY_ROTATION', 'CKV_AWS_7', `${adr} does not enable automatic key rotation.`, rel, ligne(b, 'enable_key_rotation'), adr, 'enable_key_rotation')
      }
    }
    for (const [, b, rel, adr] of items('aws_cloudtrail')) {
      const manque = []
      if (!vrai(val(b, 'is_multi_region_trail'))) manque.push('is_multi_region_trail')
      if (!vrai(val(b, 'enable_log_file_validation'))) manque.push('enable_log_file_validation')
      if (!b.attributes.kms_key_id) manque.push('kms_key_id')
      if (manque.length) échec('CLOUDTRAIL_HARDENING', manque[0] === 'is_multi_region_trail' ? 'CKV_AWS_67' : manque[0] === 'enable_log_file_validation' ? 'CKV_AWS_36' : 'CKV_AWS_35', `${adr}: ${manque.join(', ')} not set.`, rel, b.line, adr)
      else ok()
    }
    for (const type of ['aws_lb_listener', 'aws_alb_listener']) {
      for (const [, b, rel, adr] of items(type)) {
        const proto = val(b, 'protocol')
        if (proto !== 'HTTP') { if (typeof proto === 'string' || proto === ABSENT) ok(); continue }
        const redirige = enfants(b, 'default_action').some(a => val(a, 'type') === 'redirect' && enfants(a, 'redirect').some(r => val(r, 'protocol') === 'HTTPS'))
        if (redirige) ok(); else échec('ALB_HTTP_LISTENER', 'CKV_AWS_2', `${adr} listens in plain HTTP without redirecting to HTTPS.`, rel, ligne(b, 'protocol'), adr, 'protocol', 'HTTP')
      }
    }
    const journaux = items('aws_flow_log').map(([, b]) => val(b, 'vpc_id'))
    for (const [, b, rel, adr] of items('aws_vpc')) {
      if (journaux.some(v => v instanceof RéfRessource && v.address === adr)) ok()
      else if (journaux.some(v => !(v instanceof RéfRessource))) inconnu()
      else échec('VPC_FLOW_LOGS', 'CKV2_AWS_11', `${adr} has no aws_flow_log.`, rel, b.line, adr)
      const défaut = items('aws_default_security_group').map(([, d]) => d).find(d => { const v = val(d, 'vpc_id'); return v instanceof RéfRessource && v.address === adr })
      if (défaut && !défaut.blocks.some(c => c.type === 'ingress' || c.type === 'egress')) ok()
      else échec('SG_HYGIENE', 'CKV2_AWS_12', `The default security group of ${adr} is not restricted (no aws_default_security_group without rules).`, rel, b.line, adr)
    }
    for (const [, b, rel, adr] of items('aws_subnet')) {
      if (vrai(val(b, 'map_public_ip_on_launch'))) échec('SUBNET_PUBLIC_IP_ON_LAUNCH', 'CKV_AWS_130', `${adr} assigns public IPs on launch.`, rel, ligne(b, 'map_public_ip_on_launch'), adr, 'map_public_ip_on_launch', true)
      else ok()
    }

    // ---------- Messagerie, DynamoDB, ECR, EKS, ElastiCache
    for (const [, b, rel, adr] of items('aws_sqs_queue')) {
      if (faux(val(b, 'sqs_managed_sse_enabled')) && !b.attributes.kms_master_key_id) échec('MESSAGING_UNENCRYPTED', 'CKV_AWS_27', `${adr} disables server-side encryption.`, rel, ligne(b, 'sqs_managed_sse_enabled'), adr, 'sqs_managed_sse_enabled', false)
      else ok()
    }
    for (const [, b, rel, adr] of items('aws_sns_topic')) {
      if (!b.attributes.kms_master_key_id) échec('MESSAGING_UNENCRYPTED', 'CKV_AWS_26', `${adr} has no kms_master_key_id.`, rel, b.line, adr)
      else ok()
    }
    for (const [, b, rel, adr] of items('aws_dynamodb_table')) {
      if (enfants(b, 'point_in_time_recovery').some(x => vrai(val(x, 'enabled')))) ok()
      else échec('DYNAMODB_HARDENING', 'CKV_AWS_28', `${adr} does not enable point-in-time recovery.`, rel, b.line, adr)
    }
    for (const [, b, rel, adr] of items('aws_ecr_repository')) {
      const manque = []
      if (val(b, 'image_tag_mutability') !== 'IMMUTABLE') manque.push('image_tag_mutability = "IMMUTABLE"')
      if (!enfants(b, 'image_scanning_configuration').some(x => vrai(val(x, 'scan_on_push')))) manque.push('scan_on_push')
      if (manque.length) échec('ECR_HARDENING', manque[0].startsWith('image_tag') ? 'CKV_AWS_51' : 'CKV_AWS_163', `${adr}: ${manque.join(', ')} not set.`, rel, b.line, adr)
      else ok()
    }
    for (const [, b, rel, adr] of items('aws_eks_cluster')) {
      const vc = enfants(b, 'vpc_config')[0]
      const pub = vc ? val(vc, 'endpoint_public_access') : ABSENT
      const cidrs = vc ? val(vc, 'public_access_cidrs') : ABSENT
      if (faux(pub)) ok()
      else if (pub === INCONNU || cidrs === INCONNU) inconnu()
      else if (cidrs === ABSENT || (Array.isArray(cidrs) && cidrs.includes('0.0.0.0/0'))) échec('EKS_PUBLIC_ENDPOINT', cidrs === ABSENT ? 'CKV_AWS_39' : 'CKV_AWS_38', `${adr} exposes a public Kubernetes API endpoint open to 0.0.0.0/0.`, rel, vc ? vc.line : b.line, adr, 'vpc_config')
      else ok()
      if (!enfants(b, 'encryption_config').length) échec('EKS_SECRETS_ENCRYPTION', 'CKV_AWS_58', `${adr} has no encryption_config for Kubernetes secrets.`, rel, b.line, adr)
      else ok()
    }
    for (const [, b, rel, adr] of items('aws_elasticache_replication_group')) {
      const manque = ['at_rest_encryption_enabled', 'transit_encryption_enabled'].filter(a => !vrai(val(b, a)))
      if (manque.length) échec('ELASTICACHE_UNENCRYPTED', manque[0] === 'at_rest_encryption_enabled' ? 'CKV_AWS_29' : 'CKV_AWS_30', `${adr}: ${manque.join(', ')} not enabled.`, rel, b.line, adr)
      else ok()
    }
  }

  // ---------- Secrets écrits en clair (tous modules)
  for (const m of Object.values(p.modules)) {
    for (const [nom, [b, rel]] of Object.entries(m.variables)) {
      const d = b.attributes.default ? littéral(b.attributes.default.tokens) : null
      if (NOM_SECRET.test(nom) && typeof d === 'string' && d.length >= 4) échec('SECRET_HARDCODED', 'secret_in_variable_default', `Variable "${nom}" has a literal default value.`, rel, b.attributes.default.line, `var.${nom}`, 'default')
    }
    const visiter = (b, rel, adr) => {
      for (const [n, a] of Object.entries(b.attributes)) {
        const v = littéral(a.tokens)
        if (NOM_SECRET.test(n) && typeof v === 'string' && v.length >= 4 && !(b.type === 'provider')) échec('SECRET_HARDCODED', 'secret_literal', `"${n}" is set to a literal value.`, rel, a.line, adr, n)
        if (v && typeof v === 'object' && !Array.isArray(v)) for (const [kk, vv] of Object.entries(v)) if (NOM_SECRET.test(kk.toLowerCase()) && typeof vv === 'string' && vv.length >= 4) échec('SECRET_HARDCODED', 'secret_literal', `"${n}.${kk}" is set to a literal value.`, rel, a.line, adr, n)
      }
      for (const c of b.blocks) visiter(c, rel, adr)
    }
    for (const [k, [b, rel]] of Object.entries(m.resources)) visiter(b, rel, k)
  }
  return t
}
