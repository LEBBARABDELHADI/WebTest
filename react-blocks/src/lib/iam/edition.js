// Modifications pures d'une politique normalisée (le constructeur visuel n'écrit jamais le JSON à la main) :
// chaque fonction renvoie une NOUVELLE politique.
import { déclarationVide, TYPES } from './politique.js'
import { unique } from './texte.js'

const sur = (pol, i, f) => ({ ...pol, déclarations: pol.déclarations.map((d, j) => (j === i ? f(d) : d)) })

export const ajouterDéclaration = (pol, type = 'identite') => ({ ...pol, déclarations: [...pol.déclarations, { ...déclarationVide(type), actions: { inverse: false, liste: type === 'approbation' ? ['sts:AssumeRole'] : [] } }] })
export const supprimerDéclaration = (pol, i) => ({ ...pol, déclarations: pol.déclarations.filter((_, j) => j !== i) })
export const dupliquerDéclaration = (pol, i) => {
  const copie = JSON.parse(JSON.stringify(pol.déclarations[i]))
  if (copie.sid) copie.sid = `${copie.sid}Copie`
  return { ...pol, déclarations: [...pol.déclarations.slice(0, i + 1), copie, ...pol.déclarations.slice(i + 1)] }
}
export const déplacerDéclaration = (pol, i, delta) => {
  const j = i + delta
  if (j < 0 || j >= pol.déclarations.length) return pol
  const d = [...pol.déclarations]
  ;[d[i], d[j]] = [d[j], d[i]]
  return { ...pol, déclarations: d }
}
export const modifierDéclaration = (pol, i, patch) => sur(pol, i, d => ({ ...d, ...patch }))
export const définirSid = (pol, i, sid) => sur(pol, i, d => ({ ...d, sid: sid || undefined }))
export const définirEffet = (pol, i, effet) => sur(pol, i, d => ({ ...d, effet }))

// Actions et ressources : { inverse, liste }.
const liste = (champ, d) => d[champ] ?? { inverse: false, liste: [] }
export const ajouterÀListe = (pol, i, champ, valeurs) => sur(pol, i, d => {
  let l = liste(champ, d)
  // Ajouter un ARN précis à « * » remplace le joker (sinon « * » absorberait tout) ; ajouter « * » remplace tout.
  if (champ === 'ressources' && !l.inverse && l.liste.length === 1 && l.liste[0] === '*' && !valeurs.includes('*')) l = { ...l, liste: [] }
  if (champ === 'ressources' && !l.inverse && valeurs.includes('*')) return { ...d, [champ]: { ...l, liste: ['*'] } }
  const déjà = new Set(l.liste.map(x => x.toLowerCase()))
  return { ...d, [champ]: { ...l, liste: [...l.liste, ...unique(valeurs).filter(v => v && !déjà.has(v.toLowerCase()))] } }
})
export const retirerDeListe = (pol, i, champ, valeur) => sur(pol, i, d => ({ ...d, [champ]: { ...liste(champ, d), liste: liste(champ, d).liste.filter(x => x !== valeur) } }))
export const remplacerListe = (pol, i, champ, valeurs) => sur(pol, i, d => ({ ...d, [champ]: { ...liste(champ, d), liste: valeurs } }))
export const basculerInverse = (pol, i, champ) => sur(pol, i, d => ({ ...d, [champ]: { ...liste(champ, d), inverse: !liste(champ, d).inverse } }))
export const retirerRessources = (pol, i) => sur(pol, i, d => ({ ...d, ressources: null }))
export const activerRessources = (pol, i) => sur(pol, i, d => ({ ...d, ressources: d.ressources ?? { inverse: false, liste: ['*'] } }))

// Conditions : { opérateur, clé, valeurs }.
export const ajouterCondition = (pol, i, condition) => sur(pol, i, d => ({ ...d, conditions: [...(d.conditions ?? []), condition] }))
export const modifierCondition = (pol, i, k, patch) => sur(pol, i, d => ({ ...d, conditions: d.conditions.map((c, j) => (j === k ? { ...c, ...patch } : c)) }))
export const supprimerCondition = (pol, i, k) => sur(pol, i, d => ({ ...d, conditions: d.conditions.filter((_, j) => j !== k) }))

// Principal : { inverse, valeurs: '*' | { AWS, Service, Federated, CanonicalUser } }.
export const définirPrincipal = (pol, i, principal) => sur(pol, i, d => ({ ...d, principal }))
export const ajouterPrincipal = (pol, i, type, valeurs) => sur(pol, i, d => {
  const p = d.principal ?? { inverse: false, valeurs: {} }
  const base = p.valeurs === '*' ? {} : p.valeurs
  return { ...d, principal: { ...p, valeurs: { ...base, [type]: unique([...(base[type] ?? []), ...valeurs]) } } }
})
export const retirerPrincipal = (pol, i, type, valeur) => sur(pol, i, d => {
  const p = d.principal
  if (!p || p.valeurs === '*') return d
  const l = (p.valeurs[type] ?? []).filter(x => x !== valeur)
  const valeurs = { ...p.valeurs }
  if (l.length) valeurs[type] = l
  else delete valeurs[type]
  return { ...d, principal: { ...p, valeurs } }
})

// Adapte une politique à un autre type (principal/ressource exigés ou interdits).
export function adapterAuType(pol, type) {
  const t = TYPES[type]
  return {
    ...pol,
    déclarations: pol.déclarations.map(d => ({
      ...d,
      principal: t.principal === 'interdit' ? null : d.principal ?? { inverse: false, valeurs: type === 'approbation' ? { Service: ['ec2.amazonaws.com'] } : { AWS: [] } },
      ressources: t.ressource === 'interdite' ? null : d.ressources ?? { inverse: false, liste: ['*'] },
    })),
  }
}

// Conditions rapides du constructeur : [libellé, condition].
export const CONDITIONS_RAPIDES = [
  ['🔐 MFA exigée', { opérateur: 'Bool', clé: 'aws:MultiFactorAuthPresent', valeurs: ['true'] }],
  ['🌐 Depuis une adresse IP', { opérateur: 'IpAddress', clé: 'aws:SourceIp', valeurs: ['203.0.113.0/24'] }],
  ['🗺️ Régions autorisées', { opérateur: 'StringEquals', clé: 'aws:RequestedRegion', valeurs: ['eu-west-3'] }],
  ['🔒 HTTPS obligatoire', { opérateur: 'Bool', clé: 'aws:SecureTransport', valeurs: ['true'] }],
  ['🏷️ Ressource taguée', { opérateur: 'StringEquals', clé: 'aws:ResourceTag/Environment', valeurs: ['dev'] }],
  ['🏢 Organisation', { opérateur: 'StringEquals', clé: 'aws:PrincipalOrgID', valeurs: ['o-xxxxxxxxxx'] }],
  ['⏱️ Avant une date', { opérateur: 'DateLessThan', clé: 'aws:CurrentTime', valeurs: ['2027-12-31T23:59:59Z'] }],
]
