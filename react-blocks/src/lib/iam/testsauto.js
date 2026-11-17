// Tests automatiques : à partir du PLAN (ce qui était voulu) on fabrique des requêtes de part et d'autre
// des frontières (action voisine, ressource voisine, condition violée…) ; l'attendu est calculé sur le
// plan, le résultat observé est celui de l'évaluateur sur la POLITIQUE générée. Les deux ne partagent
// que les opérateurs de condition : tout écart (jokers trop larges, ressource oubliée…) est un échec visible.
import { correspond } from './glob.js'
import { découperArn, arnCompatible } from './arn.js'
import { analyserOpérateur, enTexte, lireCidr, lireDate, normaliserContexte, évaluerConditions } from './conditions.js'
import { évaluerSelonType } from './evaluer.js'
import { normaliser } from './politique.js'
import { unique } from './texte.js'

const JOUR = 86400000

// Chaîne concrète tirée d'un motif d'ARN : « * » → texte d'exemple, « ? » → « x ». Pour un ARN, partition, région et
// compte restent vraisemblables (aws, eu-west-3, 123456789012) : le simulateur d'AWS valide ces champs.
export function concret(motif, exemple = 'exemple') {
  const d = découperArn(motif)
  if (!d.ok) return motif.replace(/\*+/g, exemple).replace(/\?/g, 'x')
  const [arn, partition, service, région, compte, ressource] = d.composantes
  const bout = (x, défaut) => (/[*?]/.test(x) ? défaut : x)
  return [arn, bout(partition, 'aws'), bout(service, 'service'), bout(région, 'eu-west-3'), bout(compte, '123456789012'), ressource].map((x, i) => (i < 5 ? x : x.replace(/\*+/g, exemple).replace(/\?/g, 'x'))).join(':')
}

// Un ARN pour une action : une instance de l'un de ses gabarits qui reste dans les motifs de ressources donnés.
function ressourcePour(action, motifs) {
  if (!motifs || motifs.includes('*')) {
    const rt = action.ressources.find(r => r.modèle)
    if (!rt) return '*'
    return concret(rt.modèle.replace(/\$\{Partition\}/, 'aws').replace(/\$\{Region\}/, 'eu-west-3').replace(/\$\{Account\}/, '123456789012').replace(/\$\{[^}]+\}/g, 'exemple'))
  }
  for (const m of motifs) {
    if (action.ressources.some(rt => rt.modèle && arnCompatible(m, rt.modèle))) return concret(m)
  }
  return null
}

// Valeur de contexte qui satisfait une condition (ou la viole si `violer`).
function valeurPour(c, violer) {
  const op = analyserOpérateur(c.opérateur)
  if (!op) return null
  const vals = c.valeurs.map(enTexte)
  const v0 = vals[0] ?? ''
  const f = op.info.famille
  const nég = op.info.nég
  // La valeur produite doit « correspondre » à la liste de la politique pour satisfaire un opérateur
  // positif, ou ne PAS correspondre pour un opérateur négatif ; l'inverse pour violer la condition.
  const ok = violer ? nég : !nég
  switch (f) {
    case 'string': case 'binary': {
      if (ok) return v0.replace(/[*?]/g, 'x')
      return op.info.cmp === 'like' ? 'zz-autre' : `${v0}-autre`
    }
    case 'arn': return ok ? v0.replace(/[*?]/g, 'x') : 'arn:aws:s3:::zz-autre'
    case 'bool': {
      const attendu = v0.toLowerCase() === 'true'
      return String(ok ? attendu : !attendu)
    }
    case 'numeric': {
      const n = Number(v0)
      const cmp = op.info.cmp
      const bon = cmp === '<' ? n - 1 : cmp === '>' ? n + 1 : n
      const mauvais = cmp === '<' ? n + 1 : cmp === '>' ? n - 1 : cmp === '<=' ? n + 1 : cmp === '>=' ? n - 1 : n + 1
      return String(ok ? bon : mauvais)
    }
    case 'date': {
      const t = lireDate(v0)
      if (t === null) return v0
      const cmp = op.info.cmp
      const bon = cmp === '<' || cmp === '<=' ? t - JOUR : cmp === '>' || cmp === '>=' ? t + JOUR : t
      const mauvais = cmp === '<' || cmp === '<=' ? t + JOUR : cmp === '>' || cmp === '>=' ? t - JOUR : t + JOUR
      return new Date(ok ? bon : mauvais).toISOString()
    }
    case 'ip': {
      const c0 = lireCidr(v0)
      if (!c0) return '203.0.113.5'
      if (ok) { const adr = v0.split('/')[0]; return adr }
      return c0.v === 6 ? '2001:db8:ffff::1' : (v0.startsWith('198.51.100.') ? '192.0.2.77' : '198.51.100.77')
    }
    default: return null
  }
}

// Contexte qui satisfait toutes les conditions (hors celle à violer). Plusieurs conditions sur la même
// date (début + fin) sont satisfaites par une date intermédiaire.
export function contexteAvec(conditions, violer = null) {
  const ctx = {}
  const dates = {}
  for (const c of conditions) {
    const op = analyserOpérateur(c.opérateur)
    if (!op) continue
    if (op.base === 'Null') {
      const absente = c.valeurs.some(v => enTexte(v).toLowerCase() === 'true')
      const violée = c === violer
      if (absente !== violée) delete ctx[c.clé]
      else ctx[c.clé] = 'valeur'
      continue
    }
    if (op.info.famille === 'date' && c !== violer) { (dates[c.clé] ??= []).push(c); continue }
    const v = valeurPour(c, c === violer)
    if (v !== null && v !== undefined) ctx[c.clé] = v
  }
  for (const [clé, liste] of Object.entries(dates)) {
    const bornes = liste.map(c => ({ op: analyserOpérateur(c.opérateur).info.cmp, t: lireDate(enTexte(c.valeurs[0])) })).filter(b => b.t !== null)
    const min = Math.max(...bornes.filter(b => b.op === '>' || b.op === '>=').map(b => b.t), -Infinity)
    const max = Math.min(...bornes.filter(b => b.op === '<' || b.op === '<=').map(b => b.t), Infinity)
    const t = Number.isFinite(min) && Number.isFinite(max) ? Math.floor((min + max) / 2) : Number.isFinite(min) ? min + JOUR : Number.isFinite(max) ? max - JOUR : Date.now()
    ctx[clé] = new Date(t).toISOString()
  }
  return ctx
}

// ---- Attendu calculé sur le plan -------------------------------------------------------------------------------------------------

function ressourceCorrespond(motifs, ressource) { return !motifs || motifs.some(m => correspond(m, ressource)) }

// Décision voulue par le plan pour une requête (refus explicite > autorisation > refus implicite).
export function attenduPlan(plan, requête) {
  const ctx = normaliserContexte(requête.contexte)
  let allow = false
  for (const i of plan.déclarations) {
    if (i.forme !== 'standard') continue
    const [svc] = requête.action.split(':')
    const actionVoulue = i.tout ? svc.toLowerCase() === i.service?.toLowerCase() : i.voulues.some(v => v.toLowerCase() === requête.action.toLowerCase())
    if (!actionVoulue) continue
    if (!ressourceCorrespond(i.ressources, requête.ressource)) continue
    if (!principalVisé(i.principal, requête.principal)) continue
    if (!évaluerConditions(i.conditions, ctx).vrai) continue
    if (i.effet === 'Deny') return 'refus-explicite'
    allow = true
  }
  return allow ? 'autorisé' : 'refusé'
}

// Le principal de la requête est-il visé par le Principal d'une instruction ? (écriture indépendante de l'évaluateur)
function principalVisé(p, demandeur) {
  if (!p) return true
  if (p.valeurs === '*') return true
  if (!demandeur) return false
  const v = p.valeurs
  return (v.AWS ?? []).some(e => e === '*' || e === demandeur.arn || (/:root$/.test(e) && e.includes(`::${demandeur.compte}:`)) || e === demandeur.compte) || (v.Service ?? []).includes(demandeur.service)
}

// Principal concret qui est visé (ou, avec `autre`, qui ne l'est pas) par un Principal de politique de ressource.
function demandeurPour(p, autre = false) {
  if (!p) return undefined
  if (autre) return { type: 'rôle', arn: 'arn:aws:iam::999999999999:role/intrus', compte: '999999999999' }
  if (p.valeurs === '*') return { type: 'rôle', arn: 'arn:aws:iam::999999999999:role/quelconque', compte: '999999999999' }
  const arn = p.valeurs.AWS?.[0]
  if (arn) { const compte = /(\d{12})/.exec(arn)?.[1] ?? '123456789012'; return { type: 'rôle', arn: /:root$/.test(arn) ? `arn:aws:iam::${compte}:role/un-role` : arn, compte } }
  if (p.valeurs.Service?.[0]) return { type: 'service', service: p.valeurs.Service[0] }
  return undefined
}

const MOTIFS_ATTENDUS = { 'refus-explicite': 'refus explicite', refusé: 'refusé', autorisé: 'autorisé' }

// ---- Génération -----------------------------------------------------------------------------------------------------------------------------

function échantillon(actions, max) {
  const parNiveau = new Map()
  for (const a of actions) { if (!parNiveau.has(a.niveau)) parNiveau.set(a.niveau, []); parNiveau.get(a.niveau).push(a) }
  const sortie = []
  for (let k = 0; sortie.length < max; k++) {
    let ajouté = false
    for (const l of parNiveau.values()) if (l[k] && sortie.length < max) { sortie.push(l[k]); ajouté = true }
    if (!ajouté) break
  }
  return sortie
}

let compteur = 0
const test = (libellé, requête, attendu, extra = {}) => ({ id: `t${++compteur}`, libellé, requête, attendu, ...extra })

// Tests d'une politique d'identité / plafond / SCP générée par l'assistant.
export function testsDepuisPlan(plan, cat) {
  compteur = 0
  const tests = []
  const standard = plan.déclarations.filter(i => i.forme === 'standard')
  const voulues = new Set(standard.filter(i => i.effet === 'Allow').flatMap(i => i.voulues.map(v => v.toLowerCase())))
  const toutService = new Set(standard.filter(i => i.effet === 'Allow' && i.tout).map(i => i.service))
  const servicesPlan = new Set(standard.map(i => i.service))

  plan.déclarations.forEach((i, idx) => {
    if (i.forme === 'standard') {
      const s = i.service && cat.service(i.service)
      if (!s) return
      const actions = i.tout ? échantillon(s.actions, 5) : i.voulues.map(id => cat.action(...id.split(':'))).filter(Boolean)
      const choisies = échantillon(actions, 5)
      const nomsPropres = i.noms ?? []
      const contexte = contexteAvec(i.conditions)
      const principal = demandeurPour(i.principal)
      for (const a of choisies) {
        const res = ressourcePour(a, i.ressources)
        if (res === null) continue
        const r = { action: a.id, ressource: res, contexte, principal }
        tests.push(test(`${i.effet === 'Deny' ? 'Doit être refusée' : 'Doit être autorisée'} : ${a.id}${res !== '*' ? ` sur ${res}` : ''}`, r, attenduPlan(plan, r), { déclaration: idx, genre: 'cible' }))
      }
      // Frontières (seulement pour les autorisations ; pour un refus, on vérifie qu'une requête voisine n'est pas visée).
      const base = choisies[0]
      const resBase = base ? ressourcePour(base, i.ressources) : null
      if (base && resBase) {
        // Ressource voisine : le NOM de la ressource visée change (partie « ressource » de l'ARN seulement).
        const arnBase = découperArn(resBase)
        const np = arnBase.ok ? nomsPropres.find(n => arnBase.ressource.includes(n)) : null
        if (np && !i.ressources.includes('*')) {
          const voisine = [...arnBase.composantes.slice(0, 5), arnBase.ressource.replace(np, `autre-${np}`)].join(':')
          const r = { action: base.id, ressource: voisine, contexte, principal }
          tests.push(test(`Ressource voisine : ${base.id} sur ${r.ressource}`, r, attenduPlan(plan, r), { déclaration: idx, genre: 'ressource' }))
        }
        // Conditions violées une par une.
        for (const c of i.conditions.slice(0, 4)) {
          const op = analyserOpérateur(c.opérateur)
          if (!op || op.base === 'Null') continue
          const r = { action: base.id, ressource: resBase, contexte: contexteAvec(i.conditions, c), principal }
          tests.push(test(`Condition non remplie (${c.raison ?? c.clé}) : ${base.id}`, r, attenduPlan(plan, r), { déclaration: idx, genre: 'condition' }))
        }
      }
      // Actions voisines du même service, non voulues.
      if (i.effet === 'Allow' && !i.tout) {
        const voisines = s.actions.filter(a => !voulues.has(a.id.toLowerCase()) && !toutService.has(a.service) && (resBase ? ressourcePour(a, i.ressources) : true))
        const risquées = [...voisines.filter(a => a.niveau >= 2).slice(0, 40), ...voisines.filter(a => a.niveau < 2).slice(0, 5)]
        if (i.principal && i.principal.valeurs !== '*' && base && resBase) {
          const r = { action: base.id, ressource: resBase, contexte, principal: demandeurPour(i.principal, true) }
          tests.push(test(`Autre principal : ${base.id}`, r, attenduPlan(plan, r), { déclaration: idx, genre: 'principal' }))
        }
        for (const a of échantillon(risquées, 4)) {
          const res = ressourcePour(a, i.ressources) ?? ressourcePour(a, null)
          const r = { action: a.id, ressource: res, contexte, principal }
          tests.push(test(`Action voisine non voulue (${a.niveauNom}) : ${a.id}`, r, attenduPlan(plan, r), { déclaration: idx, genre: 'voisine' }))
        }
      }
    } else if (i.forme === 'région') {
      const dans = i.régions[0]
      const hors = ['us-east-1', 'eu-west-3', 'eu-central-1'].find(r => !i.régions.includes(r)) ?? 'ap-south-1'
      const ec2 = (r) => ({ action: 'ec2:RunInstances', ressource: `arn:aws:ec2:${r}:123456789012:instance/*`, contexte: { 'aws:RequestedRegion': r } })
      tests.push(test(`Région autorisée (${dans}) : pas de refus explicite`, ec2(dans), 'pas-refus-explicite', { déclaration: idx, genre: 'cible' }))
      tests.push(test(`Région non autorisée (${hors}) : refus explicite`, ec2(hors), 'refus-explicite', { déclaration: idx, genre: 'cible' }))
      tests.push(test('Service global (iam) hors région : pas de refus explicite', { action: 'iam:ListUsers', ressource: '*', contexte: { 'aws:RequestedRegion': hors } }, 'pas-refus-explicite', { déclaration: idx, genre: 'voisine' }))
    } else if (i.forme === 'mfa') {
      const r = { action: 'ec2:RunInstances', ressource: 'arn:aws:ec2:eu-west-3:123456789012:instance/*' }
      tests.push(test('Session avec MFA : pas de refus explicite', { ...r, contexte: { 'aws:MultiFactorAuthPresent': 'true' } }, 'pas-refus-explicite', { déclaration: idx, genre: 'cible' }))
      tests.push(test('Session sans MFA : refus explicite', { ...r, contexte: { 'aws:MultiFactorAuthPresent': 'false' } }, 'refus-explicite', { déclaration: idx, genre: 'cible' }))
      tests.push(test('Clés d\'accès sans MFA (clé absente) : refus explicite', { ...r, contexte: {} }, 'refus-explicite', { déclaration: idx, genre: 'condition' }))
      tests.push(test('Gestion de sa propre MFA sans MFA : pas de refus explicite', { action: 'iam:EnableMFADevice', ressource: '*', contexte: {} }, 'pas-refus-explicite', { déclaration: idx, genre: 'voisine' }))
    } else if (i.forme === 'tls') {
      const res = i.ressources[0] === '*' ? '*' : concret(i.ressources.at(-1))
      const act = i.service === 's3' ? 's3:GetObject' : 'ec2:DescribeInstances'
      tests.push(test('Requête HTTP (non chiffrée) : refus explicite', { action: act, ressource: i.service === 's3' ? res : '*', contexte: { 'aws:SecureTransport': 'false' } }, 'refus-explicite', { déclaration: idx, genre: 'cible' }))
      tests.push(test('Requête HTTPS : pas de refus explicite', { action: act, ressource: i.service === 's3' ? res : '*', contexte: { 'aws:SecureTransport': 'true' } }, 'pas-refus-explicite', { déclaration: idx, genre: 'condition' }))
    } else if (i.forme === 'ip') {
      const c = i.conditions[0]
      tests.push(test(`Depuis ${c.valeurs[0]} : refus explicite`, { action: 'ec2:DescribeInstances', ressource: '*', contexte: { 'aws:SourceIp': valeurPour(c, false) } }, 'refus-explicite', { déclaration: idx, genre: 'cible' }))
      tests.push(test('Depuis une autre adresse : pas de refus explicite', { action: 'ec2:DescribeInstances', ressource: '*', contexte: { 'aws:SourceIp': valeurPour(c, true) } }, 'pas-refus-explicite', { déclaration: idx, genre: 'condition' }))
    }
  })
  // Services non mentionnés : aucun droit.
  if (standard.some(i => i.effet === 'Allow') && !standard.some(i => i.effet === 'Allow' && i.tout && !i.service)) {
    const ailleurs = [['iam:CreateUser', '*'], ['ec2:RunInstances', 'arn:aws:ec2:eu-west-3:123456789012:instance/*'], ['s3:DeleteBucket', 'arn:aws:s3:::un-autre-bucket']].filter(([a]) => !servicesPlan.has(a.split(':')[0]))
    for (const [action, ressource] of ailleurs.slice(0, 2)) {
      const r = { action, ressource, contexte: {} }
      tests.push(test(`Autre service non demandé : ${action}`, r, attenduPlan(plan, r), { déclaration: null, genre: 'voisine' }))
    }
  }
  return tests
}

// Tests d'une politique d'approbation produite par l'assistant.
export function testsApprobation(plan) {
  compteur = 0
  const tests = []
  plan.déclarations.forEach((i, idx) => {
    if (i.forme !== 'approbation') return
    const v = i.principal.valeurs
    const action = i.motifs[0]
    const ctx = contexteAvec(i.conditions)
    const cas = (arg, ctxx = ctx) => ({ action, ressource: '*', principal: arg, contexte: ctxx })
    let bon
    let autre
    if (v.Service) { bon = { type: 'service', service: v.Service[0] }; autre = { type: 'service', service: 'autre-service.amazonaws.com' } }
    else if (v.Federated) { bon = { type: 'fédéré', fédéré: v.Federated[0] }; autre = { type: 'fédéré', fédéré: 'arn:aws:iam::123456789012:oidc-provider/autre.exemple.com' } }
    else if (v.AWS) {
      const arn = v.AWS[0]
      const compte = /(\d{12})/.exec(arn)?.[1] ?? '123456789012'
      bon = { type: 'rôle', arn: /:root$/.test(arn) ? `arn:aws:iam::${compte}:role/un-role` : arn, compte }
      autre = { type: 'rôle', arn: 'arn:aws:iam::999999999999:role/intrus', compte: '999999999999' }
    }
    if (!bon) return
    tests.push(test(`Principal prévu : ${action} doit réussir`, cas(bon), 'autorisé', { déclaration: idx, genre: 'cible' }))
    tests.push(test('Autre principal : doit échouer', cas(autre), 'refusé', { déclaration: idx, genre: 'voisine' }))
    for (const c of i.conditions.slice(0, 4)) {
      const op = analyserOpérateur(c.opérateur)
      if (!op || op.base === 'Null') continue
      tests.push(test(`Condition non remplie (${c.raison ?? c.clé}) : doit échouer`, cas(bon, contexteAvec(i.conditions, c)), 'refusé', { déclaration: idx, genre: 'condition' }))
    }
  })
  return tests
}

// ---- Exécution --------------------------------------------------------------------------------------------------------------------------------

const conforme = (attendu, r) => (attendu === 'autorisé' ? r.décision === 'autorisé' : attendu === 'refusé' ? r.décision === 'refusé' : attendu === 'refus-explicite' ? r.motif === 'refus-explicite' : r.motif !== 'refus-explicite')

export function exécuterTests(tests, politique, type = 'identite') {
  const pol = politique.déclarations && !politique.Statement ? politique : normaliser(politique)
  return tests.map(t => {
    const r = évaluerSelonType(type, pol, t.requête)
    return { ...t, résultat: r, ok: conforme(t.attendu, r), attenduTexte: { 'pas-refus-explicite': 'pas de refus explicite', ...MOTIFS_ATTENDUS }[t.attendu] ?? t.attendu }
  })
}

export function résumerTests(résultats) {
  const ok = résultats.filter(r => r.ok).length
  return { total: résultats.length, ok, échecs: résultats.length - ok, tous: résultats.length > 0 && ok === résultats.length }
}

// ---- Sondes sur une politique saisie à la main (pas de plan) ---------------------------------------------------------------------------------------
// Pour chaque déclaration Allow : une requête qui doit passer (exemple tiré de la politique) et des requêtes voisines
// dont le résultat est montré (« plus large que prévu » si elles passent).
export function sondesDepuisPolitique(politique, cat) {
  compteur = 0
  const sondes = []
  politique.déclarations.forEach((d, idx) => {
    if (d.effet !== 'Allow' || !d.actions || d.actions.inverse || d.ressources?.inverse) return
    const motifs = d.actions.liste.filter(m => m !== '*' && m !== '*:*')
    const actions = []
    for (const m of motifs) {
      const [svc, nom] = [m.split(':')[0], m.split(':').slice(1).join(':')]
      const s = cat.service(svc)
      if (!s) continue
      for (const a of s.actions) if (correspond(nom, a.nom, { insensible: true })) actions.push(a)
    }
    const conds = d.conditions ?? []
    const ctx = contexteAvec(conds)
    const ressources = d.ressources?.liste ?? ['*']
    const choisies = échantillon(actions, 4)
    for (const a of choisies) {
      const res = ressourcePour(a, ressources)
      if (res === null) continue
      sondes.push(test(`Exemple tiré de la politique : ${a.id}${res !== '*' ? ` sur ${res}` : ''}`, { action: a.id, ressource: res, contexte: ctx }, 'autorisé', { déclaration: idx, genre: 'cible', sonde: false }))
    }
    const a0 = choisies[0]
    const r0 = a0 ? ressourcePour(a0, ressources) : null
    if (a0 && r0) {
      // Même action, autre ressource (compte et région différents).
      const d0 = découperArn(r0)
      if (d0.ok) {
        const autre = r0.replace(`:${d0.compte}:`, ':999999999999:')
        if (autre !== r0) sondes.push(test(`Même action, autre compte : ${a0.id}`, { action: a0.id, ressource: autre, contexte: ctx }, 'refusé', { déclaration: idx, genre: 'ressource', sonde: true }))
      }
      if (!ressources.includes('*')) {
        const neutre = r0.replace(/[A-Za-z0-9][A-Za-z0-9._-]{2,}/, m => (['arn', 'aws'].includes(m) ? m : `autre-${m}`))
        if (neutre !== r0 && !neutre.startsWith('autre-arn')) sondes.push(test(`Même action, autre ressource : ${a0.id}`, { action: a0.id, ressource: neutre.replace(/^arn:aws:autre-/, 'arn:aws:'), contexte: ctx }, 'refusé', { déclaration: idx, genre: 'ressource', sonde: true }))
      }
      // Sans les conditions.
      if (conds.length) sondes.push(test(`Sans les conditions : ${a0.id}`, { action: a0.id, ressource: r0, contexte: {} }, 'refusé', { déclaration: idx, genre: 'condition', sonde: true }))
    }
    // Actions voisines plus dangereuses du même service (écriture, permissions).
    const svcs = unique(actions.map(a => a.service))
    for (const svc of svcs.slice(0, 2)) {
      const s = cat.service(svc)
      const dangereuses = s.actions.filter(a => a.niveau >= 2 && !actions.some(x => x.id === a.id))
      for (const a of échantillon(dangereuses, 2)) {
        const res = ressourcePour(a, ressources) ?? ressourcePour(a, null)
        sondes.push(test(`Action voisine (${a.niveauNom}) : ${a.id}`, { action: a.id, ressource: res, contexte: ctx }, 'refusé', { déclaration: idx, genre: 'voisine', sonde: true }))
      }
    }
  })
  return sondes
}
