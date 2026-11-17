// Explication d'une politique en français : une phrase par déclaration (effet, actions regroupées
// par service et niveau d'accès, ressources, principaux, conditions). Sert à vérifier d'un coup
// d'œil que la politique dit bien ce qu'on voulait.
import { OPÉRATEURS_FR } from './globales.js'
import { analyserOpérateur, enTexte } from './conditions.js'
import { étendreMotif, découperAction } from './etendre.js'
import { NIVEAUX_FR, NIVEAUX } from './donnees.js'
import { découperArn, regexGabarit } from './arn.js'

const liste = (xs, max = 4) => (xs.length <= max ? xs.join(', ') : `${xs.slice(0, max).join(', ')}… (+${xs.length - max})`)

// « arn:aws:s3:::b/* » → « objets du bucket b (S3) » quand un gabarit connu correspond.
export function décrireRessource(cat, arn) {
  if (arn === '*') return 'toutes les ressources'
  const d = découperArn(arn)
  if (!d.ok) return arn
  const s = cat?.service(d.service)
  if (s) {
    // Gabarits les plus précis d'abord (plus de caractères fixes).
    const gabarits = Object.entries(s.ressources).sort((a, b) => b[1].replace(/\$\{[^}]+\}/g, '').length - a[1].replace(/\$\{[^}]+\}/g, '').length)
    const normalisé = arn.replace(/^arn:[^:]+:/, 'arn:${Partition}:')
    for (const [nom, modèle] of gabarits) {
      const { regex, champs } = regexGabarit(modèle)
      const m = regex.exec(normalisé)
      if (m) {
        const valeurs = champs.map((p, i) => [p, m[i + 1]]).filter(([p]) => !['Partition', 'Region', 'Account'].includes(p))
        return `${nom} ${s.nom}${valeurs.length ? ` (${valeurs.map(([p, v]) => `${p} = ${v}`).join(', ')})` : ''}`
      }
    }
  }
  return `« ${arn} »`
}

function décrireCondition(c) {
  const op = analyserOpérateur(c.opérateur)
  const vals = c.valeurs.map(enTexte)
  const clé = c.clé
  const k = clé.toLowerCase()
  const ensemble = op?.ensemble ? ` (${op.ensemble === 'ForAllValues' ? 'toutes les valeurs' : 'au moins une valeur'})` : ''
  const si = op?.siExiste ? ' (si la clé existe)' : ''
  if (k === 'aws:multifactorauthpresent') {
    const vrai = vals.some(v => v.toLowerCase() === 'true')
    return op?.siExiste || !vrai ? (vrai ? 'la session utilise la MFA' : 'la session n\'utilise pas la MFA (ou la clé est absente)') : 'la session utilise la MFA'
  }
  if (k === 'aws:securetransport') return vals.some(v => v.toLowerCase() === 'true') ? 'la requête est chiffrée (HTTPS/TLS)' : 'la requête n\'est PAS chiffrée (HTTP)'
  if (k === 'aws:requestedregion') return `la région ${op?.base.includes('Not') ? 'n\'est pas' : 'est'} ${liste(vals, 6)}`
  if (k === 'aws:sourceip') return `l'adresse IP source ${op?.base === 'NotIpAddress' ? 'n\'est pas dans' : 'est dans'} ${liste(vals)}`
  if (k.startsWith('aws:resourcetag/')) return `la ressource porte le tag ${clé.slice(16)} ${op?.base.includes('Not') ? '≠' : '='} ${liste(vals)}`
  if (k.startsWith('aws:requesttag/')) return `le tag ${clé.slice(15)} fourni à la création ${op?.base.includes('Not') ? '≠' : '='} ${liste(vals)}`
  if (k.startsWith('aws:principaltag/')) return `le principal porte le tag ${clé.slice(17)} ${op?.base.includes('Not') ? '≠' : '='} ${liste(vals)}`
  if (op?.base === 'Null') return vals.some(v => v.toLowerCase() === 'true') ? `« ${clé} » est absente` : `« ${clé} » est présente`
  const phrase = OPÉRATEURS_FR[op?.base] ?? c.opérateur
  return `${clé}${ensemble}${si} ${phrase} ${liste(vals)}`
}

// Actions d'une déclaration, regroupées par service : « Amazon S3 : lecture (3), écriture (2) ».
function décrireActions(cat, motifs) {
  if (motifs.some(m => m === '*' || m === '*:*')) return 'TOUTES les actions de tous les services AWS'
  const groupes = new Map()
  const inconnus = []
  for (const m of motifs) {
    const { service } = découperAction(m)
    const e = étendreMotif(cat, m)
    if (!e.actions.length) {
      if (e.manquants.length) { inconnus.push(`${m} (${e.nombre} action${e.nombre > 1 ? 's' : ''}, non chargées)`); continue }
      inconnus.push(m)
      continue
    }
    for (const a of e.actions) {
      if (!groupes.has(a.service)) groupes.set(a.service, new Map())
      groupes.get(a.service).set(a.id, a)
    }
    void service
  }
  const parties = [...groupes].map(([svc, actions]) => {
    const as = [...actions.values()]
    const total = cat.service(svc)?.actions.length
    const nom = cat.infoService(svc)?.n ?? svc
    if (total && as.length === total) return `toutes les actions de ${nom} (${total})`
    const parNiv = NIVEAUX.map((n, i) => [n, as.filter(a => a.niveau === i)]).filter(([, l]) => l.length)
    const niveaux = parNiv.map(([n, l]) => `${NIVEAUX_FR[n].toLowerCase()} : ${l.length <= 3 ? l.map(a => a.nom).join(', ') : `${l.length} actions`}`).join(' ; ')
    return `${nom} (${niveaux})`
  })
  if (inconnus.length) parties.push(inconnus.join(', '))
  return parties.join(' + ')
}

function décrirePrincipal(p) {
  if (!p) return null
  const v = p.valeurs
  const quoi = v === '*' ? 'tout le monde (*)' : Object.entries(v).map(([t, l]) => `${{ AWS: 'identité AWS', Service: 'service', Federated: 'fournisseur fédéré', CanonicalUser: 'utilisateur canonique' }[t] ?? t} ${liste(l)}`).join(' ; ')
  return `${p.inverse ? 'tous SAUF ' : ''}${quoi}`
}

// Une phrase (ou deux) par déclaration.
export function expliquerPolitique(politique, cat, type = 'identite') {
  return politique.déclarations.map((d, indice) => {
    const sujet = d.effet === 'Deny' ? '⛔ INTERDIT' : '✅ AUTORISE'
    const motifs = d.actions?.liste ?? []
    let quoi = d.actions ? (d.actions.inverse ? `tout SAUF ${décrireActions(cat, motifs)}` : décrireActions(cat, motifs)) : 'aucune action'
    if (type === 'approbation') quoi = `l'assomption du rôle (${motifs.join(', ')})`
    const où = d.ressources ? (d.ressources.inverse ? `sur toutes les ressources SAUF ${liste(d.ressources.liste.map(r => décrireRessource(cat, r)))}` : `sur ${liste(d.ressources.liste.map(r => décrireRessource(cat, r)), 3)}`) : ''
    const qui = décrirePrincipal(d.principal)
    const cond = d.conditions.map(c => décrireCondition(c))
    const phrases = []
    phrases.push(`${sujet}${qui ? ` pour ${qui}` : ''} : ${quoi}${où ? ` ${où}` : ''}.`)
    if (cond.length) phrases.push(`Condition${cond.length > 1 ? 's (toutes requises)' : ''} : ${cond.join(' ET ')}.`)
    return { indice, sid: d.sid, effet: d.effet, titre: `Déclaration ${indice + 1}${d.sid ? ` · ${d.sid}` : ''}`, phrases }
  })
}

