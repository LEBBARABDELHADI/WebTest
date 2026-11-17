// Assistant : description (FR/EN) → plan → politique IAM. Règles locales, sans IA externe.
//
//   1. lire    : jetons, vocabulaire, éléments structurés (IP, régions, comptes…), AccessDenied ;
//   2. planifier : une instruction par (service, effet, groupe de ressources), avec les actions VOULUES
//      (résolues avec les données AWS), les conditions et les hypothèses faites ;
//   3. compiler : le plan devient une politique ; les jokers d'actions ne sont utilisés que si
//      l'expansion est exactement l'ensemble voulu (vérifiée par `vérifierExpansion`).
//
// Ce qui n'est pas compris est rapporté (mots inutilisés), jamais deviné.
import { jeter, repérer, nomAprès, RE, trouverTous, lireAccessDenied, norm } from './langue.js'
import { INTENTIONS, VERBES_SERVICE, NOMS_RESSOURCE, PRINCIPAUX_SERVICE, STOP_NOMS } from './lexique.js'
import { découperArn, regexGabarit, champsDuGabarit, instancier, arnCompatible } from './arn.js'
import { étendreMotif } from './etendre.js'
import { correspond } from './glob.js'
import { SERVICES_GLOBAUX } from './globales.js'
import { sansAccents, unique } from './texte.js'

const MOTS_REFUS = new Set(['interdire', 'interdit', 'interdis', 'interdiction', 'interdite', 'refuser', 'refuse', 'refus', 'bloquer', 'bloque', 'bloquee', 'empecher', 'deny', 'denied', 'forbid', 'forbidden', 'block', 'prevent', 'jamais', 'never', 'prohibit', 'prohiber'])
const MOTS_COUPURE = new Set(['mais', 'sauf', 'excepte', 'except', 'but', 'toutefois', 'cependant', 'hormis'])
const ACTIONS_MFA_LIBRES = ['iam:CreateVirtualMFADevice', 'iam:EnableMFADevice', 'iam:ListMFADevices', 'iam:ListVirtualMFADevices', 'iam:ResyncMFADevice', 'iam:ChangePassword', 'iam:GetUser', 'sts:GetSessionToken']
const EXEMPLE_COMPTE = '123456789012'

const sid = (...parties) => sansAccents(parties.join(' ')).replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, c => c.toUpperCase()).slice(0, 60) || 'Declaration'
const nomService = (cat, p) => cat.infoService(p)?.n ?? p

// ---- 1. Lecture --------------------------------------------------------------------------------------------------

function découperClauses(texte) {
  const phrases = texte.split(/(?<=[.;!?])\s+|\n+/).map(s => s.trim()).filter(Boolean)
  const clauses = []
  for (const phrase of phrases) {
    const jetons = jeter(phrase)
    let courant = []
    let exception = false
    for (const j of jetons) {
      if (MOTS_COUPURE.has(j.n)) {
        if (courant.length) { clauses.push({ jetons: courant, exception }); courant = [] }
        // « sauf X » est une exception ; « mais pas X » aussi ; « mais Y » continue simplement.
        const suivant = jetons[j.i + 1]?.n
        exception = !['mais', 'but', 'toutefois', 'cependant'].includes(j.n) || ['pas', 'sans', 'jamais', 'ne', 'not', 'no', 'never'].includes(suivant)
        continue
      }
      courant.push(j)
    }
    if (courant.length) clauses.push({ jetons: courant, exception })
  }
  return clauses.map(c => {
    const jetons = c.jetons.map((j, i) => ({ ...j, i }))
    const notes = repérer(jetons)
    const ne = jetons.some((j, i) => j.n === 'ne' && jetons[i + 1]?.n === 'pas')
    const refus = ne || jetons.some(j => MOTS_REFUS.has(j.n)) || c.exception
    return { ...c, jetons, notes, effet: refus ? 'Deny' : 'Allow' }
  })
}

// Éléments structurés de tout le texte.
function lireStructure(texte, jetons) {
  const t = norm(texte)
  const arns = trouverTous(RE.arn, texte).map(a => a.replace(/[.,;)]+$/, ''))
  const ips = [...trouverTous(RE.ip, texte), ...trouverTous(RE.ipv6, texte).filter(x => x.includes(':') && /[0-9]/.test(x) && x.split(':').length > 2 && !/^[0-9]+:[0-9]+$/.test(x))]
  const régions = unique(trouverTous(RE.région, texte))
  const comptes = unique(trouverTous(RE.compte, texte.replace(RE.arn, ' ')))
  const orgs = unique(trouverTous(RE.org, texte))
  const vpces = unique(trouverTous(RE.vpce, texte))
  const vpcs = unique(trouverTous(RE.vpc, texte))
  const dates = trouverTous(RE.date, texte)
  const tags = [...texte.matchAll(new RegExp(RE.tag.source, 'gi'))].map(m => ({ clé: m[1], valeur: m[2] })).filter(x => !/^(est|vaut|egal)$/i.test(x.clé))
  const quand = /(?:external ?id|id externe|identifiant externe)\s*[:=]?\s*["«']?([A-Za-z0-9_+=,.@:/-]{2,})/i.exec(texte)
  const mfa = /\b(mfa|2fa|multi[ -]?factor|multifacteur|multi-facteur|double authentification)\b/.test(t)
  const tls = /\b(https|tls|ssl|transport securise|secure ?transport|chiffrement en transit|encryption in transit|connexion chiffree|connexions chiffrees)\b/.test(t)
  const avant = /\b(avant le|jusqu au|jusqu'au|until|before|expire|expirant)\b/.test(t)
  const après = /\b(apres le|a partir du|after|starting)\b/.test(t)
  const création = /\b(creation|creer|creant|a la creation|creating|at creation|on create)\b/.test(t)
  void jetons
  return { arns, ips, régions, comptes, orgs, vpces, vpcs, dates, tags, externalId: quand?.[1] ?? null, mfa, tls, avant, après, création, t }
}

// Mode d'une région : « hors de eu-west-3 » (refus hors zone) ou « dans eu-west-3 » (limitation).
function modeRégion(texte, régions) {
  if (!régions.length) return null
  const t = norm(texte)
  for (const r of régions) {
    const i = t.indexOf(r)
    const avant = t.slice(Math.max(0, i - 45), i)
    if (/\b(hors|en dehors|outside|autres? que|except|sauf|ailleurs)\b/.test(avant) || /\b(hors|en dehors) (de|des|du)?\b/.test(avant)) return 'hors'
  }
  return 'dans'
}

// ---- 2. Ressources nommées ---------------------------------------------------------------------------------------------

const PARAMS_COMMUNS = new Set(['Partition', 'Region', 'Account'])

// Ressource nommée : { service, valeurs: { BucketName: 'x', … }, région?, compte? }
function ressourceDepuisNom(nomDef, valeur, cat) {
  const s = cat.service(nomDef.service)
  if (!s) return null
  // Plusieurs gabarits peuvent convenir (clé KMS : key/${KeyId} ou alias/${Alias}) : « alias/x » vise l'alias.
  const candidats = []
  for (const modèle of Object.values(s.ressources)) {
    const p = champsDuGabarit(modèle).find(c => nomDef.param.test(c))
    if (p) candidats.push(p)
  }
  if (!candidats.length) return null
  const alias = /^alias\//.test(valeur)
  // Les actions KMS s'appliquent à la CLÉ, pas à l'alias : « alias/x » devient une condition kms:RequestAlias sur toutes les clés.
  if (alias && nomDef.service === 'kms') return { service: 'kms', valeurs: { KeyId: '*' }, exigés: ['KeyId'], alias: valeur, libellé: `clé « ${valeur} »` }
  const p = candidats.find(c => !/Alias/.test(c)) ?? candidats[0]
  let v = valeur
  if (p.startsWith('ParameterName')) v = v.replace(/^\//, '')
  if (p === 'SecretId' && !/[*?]/.test(v) && !/-[A-Za-z0-9]{6}$/.test(v)) v = `${v}-*`
  return { service: nomDef.service, valeurs: { [p]: v }, libellé: `${nomDef.libellé} « ${valeur} »` }
}

function ressourceDepuisArn(cat, arn) {
  const d = découperArn(arn)
  if (!d.ok) return null
  const s = cat.service(d.service)
  const résultat = { service: d.service, valeurs: {}, région: d.région && d.région !== '*' ? d.région : null, compte: /^\d{12}$/.test(d.compte) ? d.compte : null, libellé: `ARN ${arn}`, arn }
  if (!s) return résultat
  const gabarits = Object.values(s.ressources).sort((a, b) => b.replace(/\$\{[^}]+\}/g, '').length - a.replace(/\$\{[^}]+\}/g, '').length)
  const normalisé = arn.replace(/^arn:[^:]+:/, 'arn:${Partition}:')
  for (const g of gabarits) {
    const { regex, champs } = regexGabarit(g)
    const m = regex.exec(normalisé)
    if (m) { champs.forEach((c, i) => { if (!PARAMS_COMMUNS.has(c)) résultat.valeurs[c] = m[i + 1] }); return résultat }
  }
  return résultat
}

// ARN d'une action pour une ressource nommée : instancie chaque gabarit qui contient TOUS les paramètres
// identifiants (valeurs autres que « * ») ; sans identifiant, l'ARN donné doit être compatible avec le gabarit.
function arnsPour(action, ressources, { région, compte, préfixe }) {
  const sortie = []
  for (const res of ressources) {
    if (res.service !== action.service) continue
    const identifiants = res.exigés ?? Object.keys(res.valeurs).filter(k => res.valeurs[k] !== '*')
    for (const rt of action.ressources) {
      if (!rt.modèle) continue
      const champs = champsDuGabarit(rt.modèle)
      const convient = identifiants.length ? identifiants.every(k => champs.includes(k)) : !!res.arn && arnCompatible(res.arn, rt.modèle)
      if (!convient) continue
      const défaut = nom => {
        if (nom === 'Partition') return 'aws'
        if (nom === 'Region') return res.région ?? région ?? '*'
        if (nom === 'Account') return res.compte ?? compte ?? '*'
        if (nom === 'ObjectName' && préfixe) return `${préfixe}*`
        return '*'
      }
      const valeurs = {}
      for (const c of champs) if (res.valeurs[c] !== undefined) valeurs[c] = res.valeurs[c]
      sortie.push(instancier(rt.modèle, valeurs, défaut))
    }
  }
  return unique(sortie)
}

// ---- 3. Actions voulues ------------------------------------------------------------------------------------------------------

const COURT = { ecritureTotale: 'EcritureComplete', lectureTotale: 'LectureComplete', lecture: 'Lecture', liste: 'Liste', ecriture: 'Ecriture', suppression: 'Suppression', complet: 'Acces', tags: 'Tags', permissions: 'Permissions' }

function actionsPourVerbe(cat, service, verbe) {
  const s = cat.service(service)
  if (!s) return { actions: [], tout: false, raison: 'service-non-chargé' }
  const spécifique = VERBES_SERVICE[service]?.[verbe.id]
  if (spécifique) return { actions: spécifique.map(n => s.parNom.get(n.toLowerCase())).filter(Boolean), tout: false, libellé: verbe.id, court: verbe.id.replace(/[^a-z0-9]+(.)?/gi, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, c => c.toUpperCase()) }
  const it = INTENTIONS.find(i => i.id === verbe.intention)
  if (!it) return { actions: [], tout: false, raison: 'verbe-inapplicable' }
  if (it.tout) return { actions: s.actions, tout: true, libellé: it.libellé, court: COURT[it.id] }
  const actions = s.actions.filter(a => it.niveaux.includes(a.niveau) && (!it.inclure || it.inclure.test(a.nom)) && (!it.exclure || !it.exclure.test(a.nom)))
  return { actions, tout: false, libellé: it.libellé, court: COURT[it.id] }
}

// ---- 4. Compression en jokers (exacte) ----------------------------------------------------------------------------------------------

// Préfixes aux frontières de mots d'un nom d'action : GetObjectAcl → Get, GetObject, GetObjectAcl.
const préfixesMots = nom => { const mots = nom.match(/[A-Z][a-z0-9]*|[0-9]+|[a-z]+/g) ?? [nom]; const sortie = []; let acc = ''; for (const m of mots) { acc += m; sortie.push(acc) } return sortie }

// Une action est inerte pour une déclaration si aucune de ses ressources possibles n'est visée par les
// ressources de la déclaration : même autorisée par un joker, elle n'aurait aucun effet.
function inerte(action, ressources) {
  if (!ressources || ressources.includes('*')) return false
  if (!action.ressources.length) return true // ne s'applique qu'à « * », absent de la déclaration
  return !action.ressources.some(rt => rt.modèle && ressources.some(r => arnCompatible(r, rt.modèle)))
}

// Choisit des motifs « Préfixe* » dont toute l'expansion reste dans les actions voulues ou n'a aucun
// effet pour les ressources de la déclaration (niveaux List/Read seulement), puis complète avec des
// actions explicites. Résultat trié.
export function compresserActions(cat, service, groupe, autorisées, ressources = null) {
  const s = cat.service(service)
  const ids = new Set(groupe.map(a => a.id))
  const ok = new Set(autorisées.map(a => a.id))
  const sûrs = groupe.every(a => a.niveau <= 1)
  const motifs = []
  const couverts = new Set()
  if (sûrs && groupe.length >= 3) {
    const candidats = new Map()
    for (const a of groupe) for (const p of préfixesMots(a.nom)) if (p !== a.nom) candidats.set(`${p}*`, p)
    const valables = []
    for (const [motif, p] of candidats) {
      const étendu = s.actions.filter(a => a.nom.startsWith(p))
      if (!étendu.every(a => ok.has(a.id) || (a.niveau <= 1 && inerte(a, ressources)))) continue
      const utiles = étendu.filter(a => ids.has(a.id))
      if (utiles.length >= 3) valables.push({ motif, utiles })
    }
    // Glouton : le plus de nouvelles actions couvertes, puis le motif le plus court.
    for (;;) {
      let meilleur = null
      for (const v of valables) {
        const neuf = v.utiles.filter(a => !couverts.has(a.id)).length
        if (neuf >= 3 && (!meilleur || neuf > meilleur.neuf || (neuf === meilleur.neuf && v.motif.length < meilleur.v.motif.length))) meilleur = { v, neuf }
      }
      if (!meilleur) break
      motifs.push(`${service}:${meilleur.v.motif}`)
      meilleur.v.utiles.forEach(a => couverts.add(a.id))
    }
  }
  for (const a of groupe) if (!couverts.has(a.id)) motifs.push(a.id)
  // Un motif large couvre les motifs plus étroits.
  const final = motifs.filter(m => !motifs.some(x => x !== m && x.endsWith('*') && correspond(x, m, { insensible: true })))
  return unique(final).sort((x, y) => x.localeCompare(y, 'en'))
}

// ---- 5. Plan -----------------------------------------------------------------------------------------------------------------------------------

function détecterType(texte, demandé) {
  if (demandé && demandé !== 'auto') return { type: demandé, détecté: false }
  const t = norm(texte)
  if (/\b(assumer|assume|assumable|assumed|trust polic|politique d approbation|relation d approbation|relation de confiance|trust relationship|peut etre assume|oidc|irsa|federation)\b/.test(t)) return { type: 'approbation', détecté: true }
  if (/\b(scp|service control polic|politique de controle de service)\b/.test(t)) return { type: 'scp', détecté: true }
  if (/\b(permissions? boundary|plafond de permissions|boundary)\b/.test(t)) return { type: 'plafond', détecté: true }
  if (/\b(autoriser|permettre|donner|accorder|allow|grant)\s+(?:l[ae]\s+|au\s+|à\s+)?(?:compte|account)\s+\d{12}\b|\b(?:compte|account)\s+\d{12}\s+(?:peut|pourra|can|may|a le droit)\b/.test(t) && !/\bassum/.test(t)) return { type: 'ressource', détecté: true }
  if (/\bo-[a-z0-9]{10,32}\b/.test(t) && !/\bassum/.test(t)) return { type: 'ressource', détecté: true }
  if (/\b(au|aux|le|du)\s+service\s+[a-z0-9]/.test(t) && /\b(lire|ecrire|publier|envoyer|acceder|deposer|read|write|publish|send|access)\b/.test(t) && !/\bassum/.test(t)) return { type: 'ressource', détecté: true }
  if (/\b(bucket polic|politique de bucket|resource polic|politique de ressource|queue polic|politique de file|topic polic|key polic|politique de cle|politique du bucket)\b/.test(t)) return { type: 'ressource', détecté: true }
  return { type: 'identite', détecté: false }
}

// Instructions « modèles » (garde-fous standards) ---------------------------------------------------------------------------------------
function instrRégion(régions, typeP) {
  return {
    forme: 'région', effet: 'Deny', service: null, titre: `Refus hors de ${régions.join(', ')}`, sid: sid('Refus hors region'),
    inverse: true, motifs: SERVICES_GLOBAUX.map(s => `${s}:*`), voulues: [], tout: false,
    ressources: ['*'], conditions: [{ opérateur: 'StringNotEquals', clé: 'aws:RequestedRegion', valeurs: régions, raison: 'région autorisée' }],
    principal: typeP === 'ressource' ? { inverse: false, valeurs: '*' } : null, régions,
  }
}
function instrMfa(typeP) {
  return {
    forme: 'mfa', effet: 'Deny', service: null, titre: 'Refus sans MFA', sid: sid('Refus sans MFA'),
    inverse: true, motifs: ACTIONS_MFA_LIBRES, voulues: [], tout: false, ressources: ['*'],
    conditions: [{ opérateur: 'BoolIfExists', clé: 'aws:MultiFactorAuthPresent', valeurs: ['false'], raison: 'session sans MFA' }],
    principal: typeP === 'ressource' ? { inverse: false, valeurs: '*' } : null,
  }
}
function instrTls(cat, ressourcesTls, typeP, service) {
  return {
    forme: 'tls', effet: 'Deny', service: service ?? null, titre: 'Refus du transport non chiffré (HTTP)', sid: sid('Refus sans TLS'),
    inverse: false, motifs: [service ? `${service}:*` : '*'], voulues: [], tout: true, ressources: ressourcesTls.length ? ressourcesTls : ['*'],
    conditions: [{ opérateur: 'Bool', clé: 'aws:SecureTransport', valeurs: ['false'], raison: 'requête non chiffrée' }],
    principal: typeP === 'ressource' ? { inverse: false, valeurs: '*' } : null,
  }
}
function instrIpBloquée(ips, typeP) {
  return {
    forme: 'ip', effet: 'Deny', service: null, titre: `Refus depuis ${ips.join(', ')}`, sid: sid('Refus adresses IP'),
    inverse: false, motifs: ['*'], voulues: [], tout: true, ressources: ['*'],
    conditions: [{ opérateur: 'IpAddress', clé: 'aws:SourceIp', valeurs: ips, raison: 'adresse bloquée' }],
    principal: typeP === 'ressource' ? { inverse: false, valeurs: '*' } : null,
  }
}

// Conditions globales ajoutées aux autorisations ----------------------------------------------------------------------------------------
function conditionsGlobales(st, ctx) {
  const c = []
  if (st.mfa && ctx.modeMfa === 'condition') c.push({ opérateur: 'Bool', clé: 'aws:MultiFactorAuthPresent', valeurs: ['true'], raison: 'MFA exigée' })
  if (st.ips.length && ctx.modeIp === 'depuis') c.push({ opérateur: 'IpAddress', clé: 'aws:SourceIp', valeurs: st.ips, raison: 'adresses autorisées' })
  if (st.régions.length && ctx.modeRégion === 'dans') c.push({ opérateur: 'StringEquals', clé: 'aws:RequestedRegion', valeurs: st.régions, raison: 'régions autorisées' })
  if (st.vpces.length) c.push({ opérateur: 'StringEquals', clé: 'aws:SourceVpce', valeurs: st.vpces, raison: 'endpoint VPC' })
  else if (st.vpcs.length) c.push({ opérateur: 'StringEquals', clé: 'aws:SourceVpc', valeurs: st.vpcs, raison: 'VPC' })
  if (st.dates.length && st.avant && !st.après) c.push({ opérateur: 'DateLessThan', clé: 'aws:CurrentTime', valeurs: [st.dates[0].includes('T') ? st.dates[0] : `${st.dates[0]}T00:00:00Z`], raison: 'valable jusqu\'à' })
  else if (st.dates.length && st.après && !st.avant) c.push({ opérateur: 'DateGreaterThan', clé: 'aws:CurrentTime', valeurs: [st.dates[0].includes('T') ? st.dates[0] : `${st.dates[0]}T00:00:00Z`], raison: 'valable à partir de' })
  else if (st.dates.length >= 2) {
    c.push({ opérateur: 'DateGreaterThan', clé: 'aws:CurrentTime', valeurs: [`${st.dates[0]}T00:00:00Z`], raison: 'début de validité' })
    c.push({ opérateur: 'DateLessThan', clé: 'aws:CurrentTime', valeurs: [`${st.dates[1]}T00:00:00Z`], raison: 'fin de validité' })
  }
  return c
}

// Principaux (politique de ressource) -------------------------------------------------------------------------------------------------------
function principalRessource(st, texteNorm, hypothèses) {
  const aws = []
  const services = []
  for (const c of st.comptes) aws.push(`arn:aws:iam::${c}:root`)
  for (const a of st.arns) if (/^arn:[^:]+:iam::\d{12}:(user|role|root)/.test(a)) aws.push(a)
  for (const [mot, p] of Object.entries(PRINCIPAUX_SERVICE)) if (new RegExp(`\\b(?:service|principal de service)\\s+(?:aws\\s+|amazon\\s+)?${norm(mot)}\\b`).test(texteNorm)) services.push(p)
  if (/\b(tout le monde|public|anonyme|anonymes|everyone|anyone|internet)\b/.test(texteNorm)) return { inverse: false, valeurs: '*' }
  if (st.orgs.length && !aws.length && !services.length) { hypothèses.push(`Organisation ${st.orgs[0]} : Principal « * » limité par la condition aws:PrincipalOrgID (schéma recommandé par AWS).`); return { inverse: false, valeurs: '*', orgs: true } }
  const valeurs = {}
  if (aws.length) valeurs.AWS = unique(aws)
  if (services.length) valeurs.Service = unique(services)
  return Object.keys(valeurs).length ? { inverse: false, valeurs } : null
}

// Plan « approbation » (trust policy) ------------------------------------------------------------------------------------------------------------
function planApprobation(texte, st, clauses, cat, plan) {
  const t = st.t
  const compte = st.comptes[0] ?? EXEMPLE_COMPTE
  let compteExemple = false
  const federation = /\b(github|gitlab|eks|irsa|saml|service ?account|compte de service)\b/.test(t)
  if (federation && !st.comptes.length) compteExemple = true
  const mfa = st.mfa ? [{ opérateur: 'Bool', clé: 'aws:MultiFactorAuthPresent', valeurs: ['true'], raison: 'MFA exigée' }] : []
  let trouvé = false

  const fournisseur = /\bgithub\b/.test(t) ? 'github' : /\bgitlab\b/.test(t) ? 'gitlab' : null
  if (fournisseur) {
    trouvé = true
    const hôte = fournisseur === 'github' ? 'token.actions.githubusercontent.com' : 'gitlab.com'
    const aud = fournisseur === 'github' ? 'sts.amazonaws.com' : 'https://gitlab.com'
    const dépôt = texte.match(/(?:repo:|(?:d[eé]p[oô]t|repository|repo|projet|project)\s+["«']?)([A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+)/i)?.[1] ?? texte.match(/\b([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\b(?!\/)/)?.[1]
    const branche = /(?:branche|branch)\s+["«']?([A-Za-z0-9_./*-]+)/i.exec(texte)?.[1]
    const balise = /(?:tag|balise|release)s?\s+["«']?(v?[A-Za-z0-9_./*-]*\*[A-Za-z0-9_./*-]*|v[0-9][A-Za-z0-9_./*-]*)/i.exec(texte)?.[1]
    const env = /(?:environnement|environment|env)\s+["«']?([A-Za-z0-9_-]+)/i.exec(texte)?.[1]
    const pr = /\b(pull request|pull_request|merge request)\b/.test(t)
    let sub
    if (!dépôt) { plan.nonCompris.push('Dépôt non reconnu : écrivez-le sous la forme organisation/dépôt (ex. monorg/monrepo).') ; sub = fournisseur === 'github' ? 'repo:ORGANISATION/DEPOT:*' : 'project_path:GROUPE/PROJET:*' }
    else if (fournisseur === 'github') sub = env ? `repo:${dépôt}:environment:${env}` : pr ? `repo:${dépôt}:pull_request` : branche ? `repo:${dépôt}:ref:refs/heads/${branche}` : balise ? `repo:${dépôt}:ref:refs/tags/${balise}` : `repo:${dépôt}:*`
    else sub = branche ? `project_path:${dépôt}:ref_type:branch:ref:${branche}` : balise ? `project_path:${dépôt}:ref_type:tag:ref:${balise}` : `project_path:${dépôt}:*`
    if (dépôt && !branche && !env && !pr && !balise) plan.hypothèses.push(`Aucune branche ni environnement : « ${sub} » accepte TOUTES les branches du dépôt. Précisez « branche main » pour restreindre.`)
    plan.déclarations.push({
      forme: 'approbation', effet: 'Allow', service: null, titre: `${fournisseur === 'github' ? 'GitHub Actions' : 'GitLab CI'} : ${dépôt ?? '?'}${branche ? ` (branche ${branche})` : ''}`, sid: sid(`Oidc ${fournisseur}`),
      voulues: [], tout: false, inverse: false, motifs: ['sts:AssumeRoleWithWebIdentity'], ressources: null,
      principal: { inverse: false, valeurs: { Federated: [`arn:aws:iam::${compte}:oidc-provider/${hôte}`] } },
      conditions: [{ opérateur: 'StringEquals', clé: `${hôte}:aud`, valeurs: [aud], raison: 'public du jeton' }, { opérateur: /\*/.test(sub) ? 'StringLike' : 'StringEquals', clé: `${hôte}:sub`, valeurs: [sub], raison: 'sujet du jeton' }],
    })
  }
  if (/\b(eks|irsa|service ?account|compte de service)\b/.test(t)) {
    trouvé = true
    const issuer = /oidc\.eks\.([a-z0-9-]+)\.amazonaws\.com\/id\/([A-Z0-9]+)/i.exec(texte)
    const ns = /(?:namespace|espace de noms)\s+["«']?([a-z0-9-]+)/i.exec(texte)?.[1]
    const sa = /(?:service ?account|compte de service)\s+(?:(?:kubernetes|k8s)\s+)?(?:(?:nomm[ée]e?|named|appel[ée]e?)\s+)?["«']?([a-z0-9-]+)/i.exec(texte)?.[1]
    const nsSa = /\b([a-z0-9-]+)\/([a-z0-9-]+)\b/.exec(texte.replace(/oidc\.eks[^\s]*/gi, ''))
    const namespace = ns ?? nsSa?.[1]
    const compteSvc = sa ?? nsSa?.[2]
    const région = issuer?.[1] ?? st.régions[0] ?? 'eu-west-3'
    const id = issuer?.[2] ?? 'EXAMPLED539D4633E53DE1B71EXAMPLE'
    const hôte = `oidc.eks.${région}.amazonaws.com/id/${id}`
    if (!issuer) plan.hypothèses.push(`Fournisseur OIDC du cluster : ${hôte} est un exemple — remplacez l'identifiant par celui de votre cluster (aws eks describe-cluster --query cluster.identity.oidc.issuer).`)
    if (!namespace || !compteSvc) plan.nonCompris.push('Namespace et compte de service Kubernetes non reconnus : écrivez « namespace X » et « serviceaccount Y », ou X/Y.')
    plan.déclarations.push({
      forme: 'approbation', effet: 'Allow', service: null, titre: `EKS (IRSA) : ${namespace ?? '?'}/${compteSvc ?? '?'}`, sid: sid('Irsa eks'),
      voulues: [], tout: false, inverse: false, motifs: ['sts:AssumeRoleWithWebIdentity'], ressources: null,
      principal: { inverse: false, valeurs: { Federated: [`arn:aws:iam::${compte}:oidc-provider/${hôte}`] } },
      conditions: [{ opérateur: 'StringEquals', clé: `${hôte}:sub`, valeurs: [`system:serviceaccount:${namespace ?? 'NAMESPACE'}:${compteSvc ?? 'SERVICEACCOUNT'}`], raison: 'compte de service' }, { opérateur: 'StringEquals', clé: `${hôte}:aud`, valeurs: ['sts.amazonaws.com'], raison: 'public du jeton' }],
    })
  }
  if (/\bsaml\b/.test(t)) {
    trouvé = true
    const nom = /saml[ -]?provider\s+["«']?([A-Za-z0-9_+=,.@-]+)/i.exec(texte)?.[1] ?? 'MonFournisseurSAML'
    plan.déclarations.push({
      forme: 'approbation', effet: 'Allow', service: null, titre: `Fédération SAML : ${nom}`, sid: sid('Saml'), voulues: [], tout: false, inverse: false, motifs: ['sts:AssumeRoleWithSAML'], ressources: null,
      principal: { inverse: false, valeurs: { Federated: [`arn:aws:iam::${compte}:saml-provider/${nom}`] } },
      conditions: [{ opérateur: 'StringEquals', clé: 'SAML:aud', valeurs: ['https://signin.aws.amazon.com/saml'], raison: 'public SAML' }],
    })
  }
  // Services AWS.
  const services = []
  for (const c of clauses) for (const n of c.notes) if (n.type === 'principalService') services.push(PRINCIPAUX_SERVICE[n.id])
  if (services.length) {
    trouvé = true
    const s = unique(services)
    plan.déclarations.push({ forme: 'approbation', effet: 'Allow', service: null, titre: `Service AWS : ${s.join(', ')}`, sid: sid('Service', s[0].split('.')[0]), voulues: [], tout: false, inverse: false, motifs: ['sts:AssumeRole'], ressources: null, principal: { inverse: false, valeurs: { Service: s } }, conditions: [] })
  }
  // Comptes et identités AWS.
  const aws = []
  for (const c of st.comptes) if (!fournisseur && !/\b(eks|irsa)\b/.test(t) && !/saml/.test(t)) aws.push(`arn:aws:iam::${c}:root`)
  for (const a of st.arns) if (/^arn:[^:]+:iam::\d{12}:(user|role|root)/.test(a)) aws.push(a)
  if (aws.length) {
    trouvé = true
    const conds = [...mfa]
    if (st.externalId) conds.push({ opérateur: 'StringEquals', clé: 'sts:ExternalId', valeurs: [st.externalId], raison: 'identifiant externe' })
    plan.déclarations.push({ forme: 'approbation', effet: 'Allow', service: null, titre: `Identités AWS : ${unique(aws).join(', ')}`, sid: sid('Compte approuve'), voulues: [], tout: false, inverse: false, motifs: ['sts:AssumeRole'], ressources: null, principal: { inverse: false, valeurs: { AWS: unique(aws) } }, conditions: conds })
    if (aws.some(a => /:root$/.test(a)) && !st.externalId && !st.mfa) plan.hypothèses.push('Tout principal du compte approuvé pourra assumer le rôle s\'il possède sts:AssumeRole. Pour un compte tiers, ajoutez un identifiant externe ; pour des humains, exigez la MFA.')
  }
  if (compteExemple && trouvé) plan.hypothèses.push(`Compte non précisé : l'identifiant d'exemple ${EXEMPLE_COMPTE} est utilisé pour les ARN de fournisseur — à remplacer par le vôtre.`)
  if (!trouvé) plan.nonCompris.push('Qui doit pouvoir assumer le rôle ? Précisez par exemple « le service Lambda », « le compte 123456789012 », « GitHub Actions pour le dépôt org/repo, branche main » ou « EKS namespace app serviceaccount web ».')
}

// Plan principal ------------------------------------------------------------------------------------------------------------------------------------
export function construirePlan(texte, cat, options = {}) {
  const { type: typeDemandé = 'auto', région: régionDéfaut = null, compte: compteDéfaut = null } = options
  const plan = { type: 'identite', typeDétecté: false, déclarations: [], hypothèses: [], nonCompris: [], avertissements: [], accessDenied: [] }
  const clauses = découperClauses(texte)
  const jetonsTous = clauses.flatMap(c => c.jetons)
  const st = lireStructure(texte, jetonsTous)
  const { type, détecté } = détecterType(texte, typeDemandé)
  plan.type = type
  plan.typeDétecté = détecté
  const compte = st.comptes[0] ?? compteDéfaut ?? null
  const région = st.régions.length === 1 ? st.régions[0] : régionDéfaut
  const ctx = {
    modeRégion: modeRégion(texte, st.régions),
    modeMfa: st.mfa ? (/\b(sans|without|absence)\b[^.;]{0,25}\b(mfa|2fa|multi)/.test(st.t) || /\b(bloquer|interdire|refuser|deny|block|forbid)\b[^.;]{0,40}\b(mfa|2fa|authentification)/.test(st.t) ? 'refus' : 'condition') : null,
    modeIp: st.ips.length ? (/\b(bloquer|interdire|refuser|deny|block|forbid)\b[^.;]{0,30}\b(ip|adresse|reseau|depuis|from)/.test(st.t) ? 'refus' : 'depuis') : null,
  }

  // Messages AccessDenied : une règle exacte par message.
  const refus = lireAccessDenied(texte)
  if (refus.length) return planAccessDenied(refus, plan, cat)

  if (type === 'approbation') { planApprobation(texte, st, clauses, cat, plan); finirPlan(plan, st, clauses, jetonsTous); return plan }

  // Cibles par clause.
  const sidsVus = new Set()
  let précédente = null
  for (const clause of clauses) {
    const { jetons, notes, effet } = clause
    const cibles = new Map() // service → { service, pos, ressources:[], verbes:[], explicites:[] }
    const cible = (service, pos) => { if (!cibles.has(service)) cibles.set(service, { service, pos, ressources: [], verbes: [], explicites: [], préfixe: null }); return cibles.get(service) }
    let préfixeS3 = null
    for (const n of notes) {
      if (n.type === 'service') cible(n.id, n.i)
      if (n.type === 'nom') {
        const def = NOMS_RESSOURCE[n.id]
        const c = cible(def.service, n.i)
        const nom = nomAprès(jetons, n.i + n.k, notes, def.service)
        if (nom) {
          const noms = [nom.nom]
          let k = nom.i + 1
          while (jetons[k] && !STOP_NOMS.has(jetons[k].n) && !notes.some(x => k >= x.i && k < x.i + x.k) && /^[A-Za-z0-9_./:*@=+-]+$/.test(jetons[k].brut) && /[-_.0-9]/.test(jetons[k].brut) && noms.length < 6) { noms.push(jetons[k].brut); k++ }
          for (const nm of noms) { const r = ressourceDepuisNom(def, nm, cat); if (r) c.ressources.push(r) }
          for (const nm of noms) (clause.utilisés ??= new Set()).add(nm)
        }
      }
      if (n.type === 'verbe') clause.verbesTrouvés = [...(clause.verbesTrouvés ?? []), n]
    }
    // Préfixe S3 (« dans le dossier logs/ »).
    jetons.forEach((j, i) => { if (['dossier', 'prefixe', 'prefix', 'chemin', 'path', 'repertoire', 'folder'].includes(j.n) && jetons[i + 1]) { const nxt = jetons[i + 1].brut; if (!STOP_NOMS.has(jetons[i + 1].n)) { préfixeS3 = nxt.replace(/^\//, '').replace(/\/?\*?$/, '/'); (clause.utilisés ??= new Set()).add(nxt) } } })
    // ARN et actions explicites.
    jetons.forEach((j, i) => {
      if (/^arn:/i.test(j.brut)) {
        const arn = j.brut.replace(/[.,;)]+$/, '')
        const r = ressourceDepuisArn(cat, arn)
        if (r) { cible(r.service, i).ressources.push(r); (clause.utilisés ??= new Set()).add(j.brut) }
      }
      const m = /^([a-z][a-z0-9-]*):([A-Za-z*?][A-Za-z0-9*?]*)$/.exec(j.brut)
      if (m && cat.existe(m[1])) { cible(cat.infoService(m[1]).p, i).explicites.push(j.brut); (clause.utilisés ??= new Set()).add(j.brut) }
    })
    if (préfixeS3) for (const c of cibles.values()) c.préfixe = préfixeS3
    // Verbes → cible la plus proche (suivante d'abord).
    const liste = [...cibles.values()].sort((a, b) => a.pos - b.pos)
    const verbes = clause.verbesTrouvés ?? []
    for (const v of verbes) {
      if (!liste.length) break
      const après = liste.find(c => c.pos >= v.i)
      const avant = [...liste].reverse().find(c => c.pos < v.i)
      // Un verbe propre à un service s'attache de préférence à ce service.
      const candidats = [après, avant, ...liste].filter(Boolean)
      const propre = candidats.find(c => VERBES_SERVICE[c.service]?.[v.id])
      ;(propre ?? candidats[0]).verbes.push(v)
    }
    // Une cible sans verbe mais nommée reprend les verbes de la cible précédente (« lire la table x et le bucket y ») ;
    // une cible sans verbe ni nom, à côté de cibles qui ont des verbes, est un simple contexte (« une fonction Lambda à écrire dans… »).
    const avecVerbes = liste.some(c => c.verbes.length || c.explicites.length)
    liste.forEach((c, k) => {
      if (c.verbes.length || c.explicites.length) return
      const précédent = [...liste.slice(0, k)].reverse().find(x => x.verbes.length)
      const entre = précédent && verbes.some(v => v.i > précédent.pos && v.i < c.pos)
      if (c.ressources.length && précédent && !entre) c.verbes = [...précédent.verbes]
      else if (avecVerbes) c.contexte = true
    })
    for (const c of liste) if (c.contexte) cibles.delete(c.service)
    // Clause d'exception sans cible : hérite de la précédente.
    if (!liste.length && clause.exception && précédente) {
      for (const c of précédente) cibles.set(c.service, { ...c, verbes: [], explicites: [], pos: 0 })
      for (const v of clause.verbesTrouvés ?? []) for (const c of cibles.values()) c.verbes.push(v)
    }
    const cibleListe = [...cibles.values()]
    if (cibleListe.length) précédente = cibleListe.map(c => ({ ...c }))
    if (!cibleListe.length) {
      const resteVerbes = (clause.verbesTrouvés ?? []).length
      const contientQuelqueChose = jetons.length && (resteVerbes || notes.length)
      if (contientQuelqueChose && !(st.régions.length || st.mfa || st.ips.length || st.tls)) plan.nonCompris.push(`« ${jetons.map(j => j.brut).join(' ')} » : aucun service AWS reconnu dans cette partie.`)
      continue
    }
    for (const c of cibleListe) construireInstructions(c, clause, effet, { cat, plan, st, ctx, compte, région, type, sidsVus })
  }

  // Garde-fous standards (formes), indépendants des cibles.
  const typeP = type
  if (ctx.modeRégion === 'hors' && st.régions.length) plan.déclarations.push(instrRégion(st.régions, typeP))
  if (ctx.modeMfa === 'refus') plan.déclarations.push(instrMfa(typeP))
  if (ctx.modeIp === 'refus') plan.déclarations.push(instrIpBloquée(st.ips, typeP))
  if (st.tls && /\b(exiger|exige|obliger|obligatoire|obligatoirement|forcer|force|imposer|impose|requis|require|required|enforce|enforced|mandatory|only|uniquement|interdire|interdit|bloquer|refuser|deny)\b/.test(st.t)) {
    const cibleS3 = plan.déclarations.find(d => d.service === 's3' && d.ressources && d.ressources[0] !== '*')
    const buckets = cibleS3 ? unique(plan.déclarations.filter(d => d.service === 's3' && d.ressources).flatMap(d => d.ressources).map(r => r.replace(/\/.*$/, '').replace(/(arn:[^:]+:s3:::[^/]+)\/?.*/, '$1'))) : []
    const ress = buckets.flatMap(b => [b, `${b}/*`])
    // Le refus TLS remplace les éventuelles déclarations « HTTPS » déjà produites par les clauses.
    plan.déclarations.push(instrTls(cat, ress, typeP, cibleS3 ? 's3' : null))
    if (!cibleS3) plan.hypothèses.push('Aucune ressource nommée : le refus du HTTP vise toutes les actions et toutes les ressources.')
  }
  if (!plan.déclarations.length && !plan.nonCompris.length) plan.nonCompris.push('Aucun service AWS ni garde-fou reconnu dans la description.')
  fusionner(plan)
  if (type !== 'approbation' && plan.déclarations.some(d => d.service === 'kms' && d.effet === 'Allow')) plan.hypothèses.push('KMS : la politique de la clé doit aussi autoriser ce principal (ou déléguer l\'accès à IAM) : une politique d\'identité seule ne suffit pas.')
  const sansRégion = plan.déclarations.some(d => (d.ressources ?? []).some(r => /^arn:[^:]*:(?!s3:|iam:|route53:|cloudfront:)[a-z0-9-]+:\*:\*:/.test(r)))
  if (sansRégion) plan.hypothèses.push('Région et compte non précisés : « * » dans les ARN (toute région, tout compte). Donnez le compte (12 chiffres) et la région pour resserrer.')
  finirPlan(plan, st, clauses, jetonsTous)
  return plan
}

// Fusionne les déclarations qui ne diffèrent que par leurs ressources (même effet, mêmes actions, mêmes conditions).
function fusionner(plan) {
  const vues = new Map()
  const sortie = []
  for (const d of plan.déclarations) {
    if (d.forme !== 'standard' || !d.ressources) { sortie.push(d); continue }
    const clé = JSON.stringify([d.effet, d.motifs, d.conditions, d.principal, d.inverse])
    const déjà = vues.get(clé)
    if (déjà) {
      déjà.ressources = unique([...déjà.ressources, ...d.ressources])
      déjà.voulues = unique([...déjà.voulues, ...d.voulues])
      déjà.sid = déjà.sid.replace(/(Object|Bucket|Table|Index|Objects)+$/, '') || déjà.sid
    } else { vues.set(clé, d); sortie.push(d) }
  }
  plan.déclarations = sortie
}

// Mots non utilisés : jetons qui n'ont servi à rien de reconnu (information, pas une erreur).
function finirPlan(plan, st, clauses, jetons) {
  const utilisés = new Set()
  for (const c of clauses) { for (const n of c.notes) for (let k = n.i; k < n.i + n.k; k++) utilisés.add(c.jetons[k]?.brut); for (const u of c.utilisés ?? []) utilisés.add(u) }
  const ignorés = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'a', 'au', 'aux', 'sur', 'dans', 'en', 'pour', 'avec', 'sans', 'qui', 'que', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'son', 'sa', 'ses', 'leur', 'par', 'uniquement', 'seulement', 'seule', 'seul', 'tous', 'toutes', 'tout', 'toute', 'the', 'a', 'an', 'to', 'in', 'on', 'of', 'for', 'and', 'or', 'with', 'all', 'only', 'from', 'depuis', 'si', 'il', 'elle', 'peut', 'peuvent', 'doit', 'doivent', 'etre', 'est', 'sont', 'autoriser', 'permettre', 'accorder', 'donner', 'allow', 'grant', 'permit', 'avoir', 'creer', 'faire', 'ne', 'pas', 'plus', 'puis', 'assumable', 'assumer', 'assume', 'github', 'gitlab', 'actions', 'depot', 'branche', 'branch', 'repository', 'repo', 'projet', 'environnement', 'namespace', 'serviceaccount', 'cluster', 'saml', 'oidc', 'service', 'services', 'exiger', 'obliger', 'forcer', 'imposer', 'require', 'enforce', 'taguees', 'tagguees', 'taguee', 'tague', 'tagues', 'etiquetees', 'etiquetes', 'etiquettes', 'ainsi', 'afin', 'cela', 'ceci', 'nomme', 'appele', 'named', 'called', 'rôle', 'role', 'politique', 'regle', 'règle', 'policy', 'iam', 'utilisateur', 'groupe', 'application', 'app', 'compte', 'account', 'region', 'région', 'ip', 'adresse', 'reseau', 'réseau', 'mfa', 'avant', 'apres', 'après', 'jusqu', 'au', 'tag', 'tags', 'https', 'tls'])
  const mots = []
  for (const j of jetons) {
    const n = j.n
    if (utilisés.has(j.brut) || ignorés.has(n) || STOP_NOMS.has(n) || n.length < 3) continue
    if (/^\d|[./:=*@]/.test(j.brut) && j.brut.length > 3) continue
    mots.push(j.brut)
  }
  plan.motsInutilisés = unique(mots).slice(0, 12)
  void st
}

// Genre d'une ressource (« object », « bucket », « table »…) d'après les gabarits du service.
function genreRessource(service, arn) {
  const gabarits = Object.entries(service.ressources).sort((a, b) => b[1].replace(/\$\{[^}]+\}/g, '').length - a[1].replace(/\$\{[^}]+\}/g, '').length)
  const normalisé = arn.replace(/^arn:[^:]+:/, 'arn:${Partition}:')
  for (const [nom, modèle] of gabarits) if (regexGabarit(modèle).regex.test(normalisé)) return nom.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, c => c.toUpperCase())
  return ''
}

// Instructions d'une cible (service) ------------------------------------------------------------------------------------------------------------------
function construireInstructions(c, clause, effet, { cat, plan, st, ctx, compte, région, type, sidsVus }) {
  const s = cat.service(c.service)
  const nomSvc = nomService(cat, c.service)
  if (!s) { plan.nonCompris.push(`Service « ${c.service} » : données non chargées.`); return }
  // 1. Actions voulues.
  let tout = false
  const voulues = new Map()
  const libellés = []
  const courts = []
  for (const v of c.verbes) {
    const r = actionsPourVerbe(cat, c.service, v)
    if (!r.actions.length) { plan.nonCompris.push(`« ${v.id} » n'a pas d'équivalent pour ${nomSvc} : ignoré.`); continue }
    if (r.tout) tout = true
    for (const a of r.actions) voulues.set(a.id, a)
    libellés.push(r.libellé)
    courts.push(r.court)
  }
  for (const e of c.explicites) { const x = étendreMotif(cat, e); for (const a of x.actions) voulues.set(a.id, a); if (!x.actions.length) plan.nonCompris.push(`Action « ${e} » inconnue des données AWS.`)
    else { libellés.push(e); courts.push('Actions') }
  }
  if (!voulues.size) {
    if (effet === 'Deny') { tout = true; for (const a of s.actions) voulues.set(a.id, a); libellés.push('toutes les actions'); courts.push('Acces'); plan.hypothèses.push(`Aucune action précisée pour ${nomSvc} : le refus vise toutes ses actions.`) } else {
      for (const a of s.actions) if (a.niveau <= 1) voulues.set(a.id, a)
      libellés.push('lecture seule (liste + lecture)')
      courts.push('Lecture')
      plan.hypothèses.push(`Aucune action précisée pour ${nomSvc} : lecture seule (List + Read) par défaut, le moins de droits possible.`)
    }
  }
  const ressourcesNommées = c.ressources
  const résol = { région, compte, préfixe: c.préfixe }
  if (ressourcesNommées.length && ctx.modeRégion === 'dans' && st.régions.length === 1) résol.région = st.régions[0]
  // 2. Groupes par ressource.
  const groupes = new Map()
  const ajouterGroupe = (clé, ressources, action) => { if (!groupes.has(clé)) groupes.set(clé, { ressources, actions: [] }); groupes.get(clé).actions.push(action) }
  const horsRessource = []
  for (const a of voulues.values()) {
    if (ressourcesNommées.length) {
      const arns = arnsPour(a, ressourcesNommées, résol)
      if (arns.length) ajouterGroupe(JSON.stringify([...arns].sort()), arns, a)
      else if (c.explicites.some(e => correspond(e, a.id, { insensible: true }))) { horsRessource.push(a); ajouterGroupe('*', ['*'], a) }
      // Action sans ressource applicable à la ressource nommée : exclue (hors sujet pour cette ressource).
      else horsRessource.push(a)
    } else ajouterGroupe('*', ['*'], a)
  }
  if (ressourcesNommées.length && horsRessource.length && !tout) {
    const noms = horsRessource.slice(0, 3).map(a => a.nom).join(', ')
    plan.hypothèses.push(`${horsRessource.length} action${horsRessource.length > 1 ? 's' : ''} ${nomSvc} ne s'applique${horsRessource.length > 1 ? 'nt' : ''} pas à ${ressourcesNommées.map(r => r.libellé).join(', ')} (${noms}${horsRessource.length > 3 ? '…' : ''}) : exclue${horsRessource.length > 1 ? 's' : ''}.`)
  }
  if (ressourcesNommées.length && tout) {
    // Accès complet à une ressource nommée : toutes les actions du service, sur la ressource (et ses sous-ressources).
    groupes.clear()
    const arns = unique(ressourcesNommées.flatMap(r => unique(Object.values(s.ressources).flatMap(m => arnsPour({ service: c.service, ressources: [{ modèle: m }] }, [r], résol)))))
    if (arns.length) groupes.set('tout', { ressources: arns, actions: [...voulues.values()], tout: true })
    else groupes.set('*', { ressources: ['*'], actions: [...voulues.values()], tout: true })
  }
  if (!ressourcesNommées.length && effet === 'Allow' && !tout) {
    const exemple = NOMS_RESSOURCE.find(x => x.service === c.service)
    if (st.tags.length) plan.hypothèses.push(`${nomSvc} : ressources ciblées par leurs étiquettes (condition), pas par leur nom.`)
    else plan.hypothèses.push(`Aucune ressource ${nomSvc} nommée : Resource « * » (toutes les ressources). Nommez-la${exemple ? ` (ex. « ${exemple.libellé} mon-nom »)` : ''} pour restreindre.`)
  }
  // 3. Conditions.
  let conditions = effet === 'Allow' ? conditionsGlobales(st, ctx) : []
  if (effet === 'Deny' && ctx.modeIp === 'depuis') conditions = []
  // Étiquettes.
  const tagsC = st.tags
  // 4. Instructions par groupe.
  const types = type === 'ressource' ? principalRessource(st, st.t, plan.hypothèses) : null
  for (const g of groupes.values()) {
    const actions = g.actions
    const autorisées = [...voulues.values()]
    // Conditions qui dépendent de l'action (étiquettes, alias KMS) : seulement pour les actions qui acceptent la clé ;
    // les autres vont dans une déclaration séparée, sans cette condition.
    let sousGroupes = [{ actions, conditions }]
    const spécifiques = []
    if (tagsC.length && effet === 'Allow') {
      for (const t of tagsC) spécifiques.push({ cond: { opérateur: 'StringEquals', clé: `${st.création ? 'aws:RequestTag' : 'aws:ResourceTag'}/${t.clé}`, valeurs: [t.valeur], raison: `étiquette ${t.clé}` }, préfixeClé: `${st.création ? 'aws:requesttag' : 'aws:resourcetag'}/` })
    }
    const alias = ressourcesNommées.find(r => r.alias)?.alias
    if (alias && effet === 'Allow') spécifiques.push({ cond: { opérateur: 'StringEquals', clé: 'kms:RequestAlias', valeurs: [alias], raison: `alias ${alias}` }, clé: 'kms:requestalias' })
    if (spécifiques.length) {
      const supporte = a => spécifiques.every(x => a.clés.some(k => (x.clé ? k.clé.toLowerCase() === x.clé : k.clé.toLowerCase().startsWith(x.préfixeClé))))
      const oui = actions.filter(supporte)
      const non = actions.filter(a => !supporte(a))
      sousGroupes = []
      if (oui.length) sousGroupes.push({ actions: oui, conditions: [...conditions, ...spécifiques.map(x => x.cond)] })
      if (non.length) {
        sousGroupes.push({ actions: non, conditions })
        plan.hypothèses.push(`${non.length} action${non.length > 1 ? 's' : ''} ${nomSvc} (${non.slice(0, 3).map(a => a.nom).join(', ')}${non.length > 3 ? '…' : ''}) n'accepte${non.length > 1 ? 'nt' : ''} pas la condition ${spécifiques.map(x => x.cond.clé.split('/')[0]).join(' + ')} : autorisée${non.length > 1 ? 's' : ''} sans elle, dans une déclaration séparée.`)
      }
      if (alias) plan.hypothèses.push(`Les actions KMS visent la clé, pas l'alias : « ${alias} » devient la condition kms:RequestAlias (valable quand l'appelant désigne la clé par cet alias) sur toutes les clés.`)
    }
    sousGroupes.forEach(sg => {
      const genre = g.ressources[0] === '*' ? '' : [...new Set(g.ressources.map(r => genreRessource(s, r)).filter(Boolean))].join('')
      const nomPropre = ressourcesNommées[0] ? Object.values(ressourcesNommées[0].valeurs ?? {})[0]?.replace(/[-*]+$/, '') ?? '' : ''
      const base = sid(...(effet === 'Deny' ? ['Refus'] : []), courts[0] ?? 'Acces', c.service, nomPropre, genre)
      let identifiant = base
      for (let i = 2; sidsVus.has(identifiant); i++) identifiant = `${base}${i}`
      sidsVus.add(identifiant)
      const motifs = g.tout ? [`${c.service}:*`] : compresserActions(cat, c.service, sg.actions, autorisées, g.ressources)
      plan.déclarations.push({
        forme: 'standard', effet, service: c.service, sid: identifiant,
        titre: `${effet === 'Deny' ? 'Refus' : 'Accès'} · ${libellés.filter(Boolean)[0] ?? ''} · ${nomSvc}${g.ressources[0] !== '*' ? ` · ${ressourcesNommées.map(r => r.libellé).join(', ')}` : ''}`,
        voulues: sg.actions.map(a => a.id), tout: !!g.tout, inverse: false, motifs,
        ressources: g.ressources, conditions: sg.conditions, principal: types ? { inverse: false, valeurs: types.valeurs } : null,
        orgPrincipal: !!types?.orgs, libellés,
        noms: ressourcesNommées.flatMap(r => Object.values(r.valeurs ?? {}).filter(v => v !== '*').map(v => String(v).replace(/[-*]+$/, ''))).filter(Boolean),
      })
      if (types?.orgs && st.orgs.length) plan.déclarations.at(-1).conditions = [...sg.conditions, { opérateur: 'StringEquals', clé: 'aws:PrincipalOrgID', valeurs: st.orgs, raison: 'organisation' }]
      if (types?.valeurs?.Service) {
        const source = st.arns.find(a => !a.startsWith(`arn:aws:${c.service}:`))
        if (source) plan.déclarations.at(-1).conditions = [...sg.conditions, { opérateur: 'ArnLike', clé: 'aws:SourceArn', valeurs: [source], raison: 'ressource à l\'origine de l\'appel' }]
        else if (!plan.hypothèses.some(h => h.startsWith('Principal de service'))) plan.hypothèses.push('Principal de service sans condition d\'origine : ajoutez aws:SourceArn (ARN de la ressource appelante) ou aws:SourceAccount pour éviter l\'attaque « confused deputy ».')
      }
    })
  }
}

// Message AccessDenied : exactement ce qui manque ---------------------------------------------------------------------------------------------------------
function planAccessDenied(refus, plan, cat) {
  plan.accessDenied = refus
  const parRessource = new Map()
  for (const r of refus) {
    const raisons = { identité: null, scp: 'Une SCP interdit explicitement cette action : une politique d\'identité ne peut pas la contourner (il faut modifier la SCP).', rcp: 'Une RCP interdit explicitement cette action : modifiez la RCP.', plafond: 'Le plafond de permissions (permissions boundary) du principal ne couvre pas cette action : ajoutez-la au plafond EN PLUS de la politique d\'identité.', 'refus-identité': 'Un Deny explicite d\'une politique d\'identité bloque l\'action : un Allow ne suffit pas, retirez ou restreignez ce Deny.', 'refus-ressource': 'Un Deny explicite de la politique de ressource bloque l\'action : retirez-le ou ajoutez une exception.', session: 'La politique de session du jeton limite l\'action : modifiez-la.', ressource: 'Aucune politique de ressource n\'autorise l\'action : ajoutez-la à la politique de la ressource (Principal = ce principal).', inconnue: null }
    if (raisons[r.cause]) plan.avertissements.push(`${r.action} : ${raisons[r.cause]}`)
    if (r.cause === 'identité' || r.cause === 'inconnue') {
      const clé = r.ressource ?? '*'
      if (!parRessource.has(clé)) parRessource.set(clé, [])
      parRessource.get(clé).push(r.action)
    }
  }
  plan.hypothèses.push('Règle déduite du message d\'erreur : exactement l\'action refusée, sur la ressource citée. Élargissez-la seulement si c\'est voulu.')
  const sidsVus = new Set()
  for (const [ressource, actions] of parRessource) {
    const base = sid('Autoriser', actions[0].split(':')[1] ?? 'Action')
    let identifiant = base
    for (let i = 2; sidsVus.has(identifiant); i++) identifiant = `${base}${i}`
    sidsVus.add(identifiant)
    plan.déclarations.push({ forme: 'standard', effet: 'Allow', service: actions[0].split(':')[0], sid: identifiant, titre: `Autoriser ${unique(actions).join(', ')}`, voulues: unique(actions), tout: false, inverse: false, motifs: unique(actions), ressources: [ressource], conditions: [], principal: null, exact: true })
  }
  if (!plan.déclarations.length && !plan.avertissements.length) plan.nonCompris.push('Aucune action refusée reconnue dans ce message.')
  void cat
  return plan
}

// ---- 6. Compilation du plan en politique normalisée --------------------------------------------------------------------------------------------------------
export function compilerPlan(plan) {
  const déclarations = plan.déclarations.map(i => ({
    sid: i.sid, effet: i.effet,
    principal: i.principal ?? null,
    actions: { inverse: !!i.inverse, liste: i.motifs },
    ressources: i.ressources ? { inverse: false, liste: i.ressources } : null,
    conditions: i.conditions.map(({ opérateur, clé, valeurs }) => ({ opérateur, clé, valeurs })),
  }))
  return { version: '2012-10-17', id: undefined, déclarations }
}

// ---- 7. Point d'entrée ----------------------------------------------------------------------------------------------------------------------------------------------------
// Charge les services utiles puis construit le plan et la politique.
export async function interpréter(texte, cat, options = {}) {
  await cat.prêt()
  const clauses = découperClauses(texte)
  const prefixes = new Set()
  for (const c of clauses) {
    for (const n of c.notes) {
      if (n.type === 'service') prefixes.add(n.id)
      if (n.type === 'nom') prefixes.add(NOMS_RESSOURCE[n.id].service)
    }
    for (const j of c.jetons) {
      const m = /^([a-z][a-z0-9-]*):[A-Za-z*?]/.exec(j.brut)
      if (m && cat.existe(m[1])) prefixes.add(cat.infoService(m[1]).p)
      const a = /^arn:[^:]+:([a-z0-9-]+):/i.exec(j.brut)
      if (a && cat.existe(a[1])) prefixes.add(cat.infoService(a[1]).p)
    }
  }
  for (const r of lireAccessDenied(texte)) { const p = r.action.split(':')[0]; if (cat.existe(p)) prefixes.add(cat.infoService(p).p) }
  await cat.charger([...prefixes].filter(p => cat.existe(p)))
  const plan = construirePlan(texte, cat, options)
  const politique = compilerPlan(plan)
  return { plan, politique, type: plan.type }
}

