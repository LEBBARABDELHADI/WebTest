// Évaluation d'une requête contre des politiques IAM (logique documentée par AWS) :
//   refus explicite > autorisation explicite > refus implicite.
// Couches : identité (politiques de l'identité), plafond de permissions, SCP, ressource, approbation.
//  · un Deny explicite dans n'importe quelle couche l'emporte ;
//  · SCP et plafond doivent AUTORISER (sinon refus implicite) lorsqu'ils sont fournis ;
//  · compte unique : l'identité OU la politique de ressource suffit à autoriser.
// Limites assumées : un seul compte (pas de cas inter-comptes), pas de politiques de session,
// ni de RCP, ni de passage d'un service à l'autre (aws:CalledVia) : le contexte est celui fourni.
import { compilerParties, reconnaît, correspond } from './glob.js'
import { découperArn } from './arn.js'
import { évaluerConditions, normaliserContexte, résoudreVariables } from './conditions.js'

// Contexte effectif : celui fourni, plus quelques clés que AWS renseigne toujours.
export function contexteEffectif(requête, auto = true) {
  const ajouts = []
  const brut = { ...(requête.contexte ?? {}) }
  const a = k => Object.keys(brut).some(x => x.toLowerCase() === k.toLowerCase())
  const ajouter = (clé, valeur, source) => { if (auto && !a(clé) && valeur !== undefined && valeur !== null && valeur !== '') { brut[clé] = valeur; ajouts.push({ clé, valeur: String(valeur), source }) } }
  const p = requête.principal
  if (p?.arn) {
    ajouter('aws:PrincipalArn', p.arn, 'principal')
    const compte = p.compte ?? découperArn(p.arn).compte
    if (/^\d{12}$/.test(compte ?? '')) ajouter('aws:PrincipalAccount', compte, 'principal')
    const type = { utilisateur: 'User', rôle: 'AssumedRole', compte: 'Account', fédéré: 'FederatedUser', anonyme: 'Anonymous' }[p.type]
    if (type) ajouter('aws:PrincipalType', type, 'principal')
    const u = /:user\/(?:.*\/)?([^/]+)$/.exec(p.arn)
    if (u) ajouter('aws:username', u[1], 'principal')
  }
  if (p?.service) ajouter('aws:PrincipalServiceName', p.service, 'principal')
  const r = découperArn(requête.ressource)
  if (r.ok) {
    if (r.région && !/[*?]/.test(r.région)) ajouter('aws:RequestedRegion', r.région, 'déduite de l\'ARN de la ressource')
    if (/^\d{12}$/.test(r.compte)) ajouter('aws:ResourceAccount', r.compte, 'déduite de l\'ARN de la ressource')
  }
  const maintenant = new Date()
  ajouter('aws:CurrentTime', maintenant.toISOString(), 'heure actuelle')
  ajouter('aws:EpochTime', String(Math.floor(maintenant.getTime() / 1000)), 'heure actuelle')
  return { ctx: normaliserContexte(brut), ajouts }
}

// Une chaîne de politique (avec variables) contre un texte : Resource, NotResource.
function ressourceCorrespond(motif, ressource, ctx) {
  const { parties, manquantes } = résoudreVariables(motif, ctx)
  if (manquantes.length) return false
  return reconnaît(compilerParties(parties), ressource)
}

function principalCorrespond(p, principal) {
  const v = p.valeurs
  let ok = false
  if (v === '*') ok = true
  else if (principal) {
    for (const [type, liste] of Object.entries(v)) {
      for (const e of liste) {
        if (type === 'AWS') {
          if (principal.type === 'service' || principal.type === 'fédéré') continue
          if (e === '*') ok = true
          else if (/^\d{12}$/.test(e)) ok ||= principal.compte === e
          else {
            const d = découperArn(e)
            if (e === principal.arn) ok = true
            else if (d.ok && d.ressource === 'root' && d.compte === principal.compte) ok = true
          }
        } else if (type === 'Service') ok ||= !!principal.service && principal.service.toLowerCase() === e.toLowerCase()
        else if (type === 'Federated') ok ||= !!principal.fédéré && principal.fédéré === e
        else if (type === 'CanonicalUser') ok ||= !!principal.canonique && principal.canonique === e
      }
    }
  }
  return p.inverse ? !ok : ok
}

// Une déclaration contre la requête. `exigences` : { principal, ressource } selon le type de politique.
export function évaluerDéclaration(d, requête, ctx, { principalRequis = false, ressourceIgnorée = false } = {}) {
  const raisons = {}
  // Action
  if (!d.actions) raisons.action = { ok: false, texte: 'aucune action (Action/NotAction) dans la déclaration' }
  else {
    const trouvé = d.actions.liste.find(p => correspond(p, requête.action, { insensible: true }))
    const ok = d.actions.inverse ? trouvé === undefined : trouvé !== undefined
    raisons.action = { ok, texte: d.actions.inverse ? (ok ? `${requête.action} n'est pas dans NotAction` : `${requête.action} est exclue par NotAction (${trouvé})`) : (ok ? `${requête.action} correspond à ${trouvé}` : `${requête.action} ne correspond à aucune des actions listées`) }
  }
  // Ressource
  if (ressourceIgnorée) raisons.ressource = { ok: true, texte: 'Resource sans objet pour ce type de politique' }
  else if (!d.ressources) raisons.ressource = { ok: false, texte: 'aucune ressource (Resource/NotResource) dans la déclaration' }
  else {
    const trouvé = d.ressources.liste.find(p => ressourceCorrespond(p, requête.ressource, ctx))
    const ok = d.ressources.inverse ? trouvé === undefined : trouvé !== undefined
    raisons.ressource = { ok, texte: d.ressources.inverse ? (ok ? 'la ressource n\'est pas dans NotResource' : `la ressource est exclue par NotResource (${trouvé})`) : (ok ? `la ressource correspond à ${trouvé}` : 'la ressource ne correspond à aucun motif de Resource') }
  }
  // Principal
  if (principalRequis) {
    if (!d.principal) raisons.principal = { ok: false, texte: 'aucun Principal dans la déclaration' }
    else {
      const ok = principalCorrespond(d.principal, requête.principal)
      raisons.principal = { ok, texte: ok ? 'le principal est visé' : 'le principal de la requête n\'est pas visé' }
    }
  }
  // Conditions
  const conds = d.conditions ?? []
  if (conds.length) {
    const c = évaluerConditions(conds, ctx)
    raisons.conditions = { ok: c.vrai, texte: c.vrai ? 'toutes les conditions sont vraies' : 'au moins une condition est fausse', détails: c.détails }
  }
  const correspond_ = Object.values(raisons).every(r => r.ok)
  const premièreRaison = Object.entries(raisons).find(([, r]) => !r.ok)
  return { correspond: correspond_, raisons, pourquoiPas: premièreRaison ? `${{ action: 'Action', ressource: 'Ressource', principal: 'Principal', conditions: 'Condition' }[premièreRaison[0]]} : ${premièreRaison[1].texte}` : null }
}

// Évalue les déclarations d'un ensemble de politiques normalisées pour une couche.
function évaluerCouche(politiques, requête, ctx, options) {
  const déclarations = []
  let allow = false
  let deny = false
  politiques.forEach((pol, pi) => {
    pol.déclarations.forEach((d, i) => {
      const r = évaluerDéclaration(d, requête, ctx, options)
      const effet = d.effet === 'Deny' ? 'Deny' : d.effet === 'Allow' ? 'Allow' : null
      déclarations.push({ politique: pi, indice: i, sid: d.sid, effet: d.effet, ...r })
      if (r.correspond && effet === 'Allow') allow = true
      if (r.correspond && effet === 'Deny') deny = true
    })
  })
  return { allow, deny, déclarations }
}

const NOMS_COUCHES = { identité: 'Politique d\'identité', plafond: 'Plafond de permissions', scp: 'SCP', ressource: 'Politique de ressource', approbation: 'Politique d\'approbation' }

// ensemble : { identité?: [pol], plafond?: [pol], scp?: [pol], ressource?: [pol], approbation?: [pol] } (politiques normalisées)
// Résultat : { décision: 'autorisé'|'refusé', motif, résumé, couches: {…}, ajouts }
export function évaluer(requête, ensemble, options = {}) {
  const { ctx, ajouts } = contexteEffectif(requête, options.contexteAuto !== false)
  const couches = {}
  const calculer = (nom, opts) => { if (ensemble[nom]?.length) couches[nom] = évaluerCouche(ensemble[nom], requête, ctx, opts) }
  calculer('identité', {})
  calculer('plafond', {})
  calculer('scp', {})
  calculer('ressource', { principalRequis: true })
  calculer('approbation', { principalRequis: true, ressourceIgnorée: true })

  const fin = (décision, motif, résumé) => ({ décision, motif, résumé, couches, ajouts, noms: NOMS_COUCHES })
  const premierDeny = Object.entries(couches).find(([, c]) => c.deny)
  if (premierDeny) {
    const d = premierDeny[1].déclarations.find(x => x.correspond && x.effet === 'Deny')
    return fin('refusé', 'refus-explicite', `Refus explicite : la déclaration ${d.indice + 1}${d.sid ? ` (${d.sid})` : ''} de « ${NOMS_COUCHES[premierDeny[0]]} » interdit cette requête. Un Deny l'emporte toujours.`)
  }
  // SCP : doit autoriser (par défaut, FullAWSAccess implicite si la SCP n'a aucun Allow).
  if (couches.scp && !couches.scp.allow) {
    const aAllow = ensemble.scp.some(p => p.déclarations.some(d => d.effet === 'Allow'))
    if (aAllow || options.scpSansAccèsComplet) return fin('refusé', 'refus-implicite', 'Refus implicite : aucune déclaration Allow de la SCP ne couvre cette requête (une SCP doit autoriser ET ne rien interdire).')
  }
  if (couches.plafond && !couches.plafond.allow) return fin('refusé', 'refus-implicite', 'Refus implicite : la requête sort du plafond de permissions (aucune de ses déclarations Allow ne la couvre).')
  const autorisé = couches.identité?.allow || couches.ressource?.allow || couches.approbation?.allow
  if (autorisé) {
    const nom = couches.identité?.allow ? 'identité' : couches.ressource?.allow ? 'ressource' : 'approbation'
    const d = couches[nom].déclarations.find(x => x.correspond && x.effet === 'Allow')
    return fin('autorisé', 'autorisation-explicite', `Autorisé : la déclaration ${d.indice + 1}${d.sid ? ` (${d.sid})` : ''} de « ${NOMS_COUCHES[nom]} » l'autorise et aucun Deny ne s'applique.`)
  }
  // Plafond/SCP seuls (type de politique évalué isolément) : rien ne l'autorise explicitement.
  return fin('refusé', 'refus-implicite', 'Refus implicite : aucune déclaration Allow ne couvre cette requête (sans autorisation explicite, tout est refusé).')
}

// Raccourci : une seule politique, évaluée selon son type (identite, ressource, approbation, plafond, scp).
//  · plafond : « autorisé » = la requête reste dans le plafond (aucun Deny, au moins un Allow) ;
//  · SCP sans aucun Allow (liste de refus) : on suppose FullAWSAccess, la SCP par défaut.
export function évaluerSelonType(type, politique, requête, options = {}) {
  const couche = { identite: 'identité', ressource: 'ressource', approbation: 'approbation', plafond: 'plafond', scp: 'scp' }[type] ?? 'identité'
  if (couche === 'plafond') {
    const r = évaluer(requête, { plafond: [politique] }, options)
    if (r.décision === 'refusé' && r.motif === 'refus-implicite' && !r.couches.plafond?.allow) return r
    return r.décision === 'refusé' ? r : { ...r, résumé: r.résumé.replace('de « Plafond de permissions » l\'autorise et aucun Deny ne s\'applique', 'du plafond couvre la requête : elle reste dans les limites') }
  }
  if (couche === 'scp') {
    const aAllow = politique.déclarations.some(d => d.effet === 'Allow')
    const r = évaluer(requête, { scp: [politique] }, options)
    if (!aAllow && r.décision === 'refusé' && r.motif === 'refus-implicite') return { ...r, décision: 'autorisé', motif: 'accès-complet-implicite', résumé: 'Autorisé : cette SCP ne contient que des Deny ; avec FullAWSAccess (SCP par défaut), tout ce qu\'elle n\'interdit pas reste possible.' }
    if (aAllow && r.décision === 'refusé' && r.motif === 'refus-implicite') return r
    return r.décision === 'refusé' ? r : { ...r, résumé: 'Autorisé : la SCP couvre la requête et aucun Deny ne s\'applique.' }
  }
  return évaluer(requête, { [couche]: [politique] }, options)
}

export const NOM_COUCHE = NOMS_COUCHES
