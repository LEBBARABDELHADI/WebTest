// Validation d'une politique IAM : structure, syntaxe, cohérence avec les données AWS (services,
// actions, types de ressources, clés de condition) et signaux de sécurité. Les messages sont en
// français ; chaque constat porte sa gravité, la déclaration concernée, un chemin dans le JSON et,
// quand c'est sûr, un correctif applicable.
import { analyserArn, arnCompatible, découperArn } from './arn.js'
import { correspond, estJoker } from './glob.js'
import { analyserOpérateur, bitsHôteNonNuls, enTexte, lireCidr, lireDate, lireIp, listeOpérateurs } from './conditions.js'
import { étendreMotif, découperAction, servicesVisés } from './etendre.js'
import { ÉLÉMENTS_DÉCLARATION, ÉLÉMENTS_RACINE, TYPES, VERSION_COURANTE, limitesPour, normaliser, normaliserDéclaration, tailleDoc } from './politique.js'
import { suggérer } from './texte.js'
import { analyserSécurité } from './securite.js'

export const GRAVITÉS = ['erreur', 'sécurité', 'avertissement', 'suggestion', 'info']
const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const IAM_GÉRÉ = ['identite', 'plafond', 'approbation', 'scp']

export function valider(doc, { type = 'identite', cat = null, lecture = null } = {}) {
  const constats = []
  const t = TYPES[type] ?? TYPES.identite
  const ajouter = (code, niveau, message, extra = {}) => constats.push({ code, niveau, message, ...extra })

  if (!estObjet(doc)) {
    ajouter('RACINE', 'erreur', 'Une politique est un objet JSON { "Version": …, "Statement": […] }.')
    return finir(constats, doc, type, null)
  }
  // ---- Racine ---------------------------------------------------------------------------------
  for (const k of Object.keys(doc)) {
    if (!ÉLÉMENTS_RACINE.includes(k)) {
      const s = suggérer(k, ÉLÉMENTS_RACINE, { n: 1, max: 3 })[0]
      ajouter('CLÉ_INCONNUE', 'erreur', `Clé « ${k} » inconnue à la racine${s ? ` : vouliez-vous écrire « ${s.valeur} » ?` : ' (attendu : Version, Id, Statement).'}`, { chemin: [k, '#clé'] })
    }
  }
  for (const d of lecture?.doublons ?? []) {
    ajouter('CLÉ_DUPLIQUÉE', 'erreur', `La clé « ${d.clé} » est écrite deux fois dans le même objet : seule la dernière est conservée, la première est perdue sans erreur.`, { chemin: [...d.chemin, d.clé, '#clé'], ligneDirecte: d })
  }
  const versionTexte = JSON.stringify(doc.Version ?? null)
  if (doc.Version === undefined) {
    ajouter('VERSION_ABSENTE', 'avertissement', 'Version absente : IAM suppose alors 2008-10-17, ancienne version qui ignore les variables de politique (${aws:username}). Écrivez "Version": "2012-10-17".', { chemin: ['Version'], correctif: { libellé: 'Ajouter "Version": "2012-10-17"', appliquer: p => ({ ...p, version: VERSION_COURANTE }) } })
  } else if (doc.Version !== '2012-10-17' && doc.Version !== '2008-10-17') {
    ajouter('VERSION_INVALIDE', 'erreur', `Version ${versionTexte} invalide : seules "2012-10-17" et "2008-10-17" existent.`, { chemin: ['Version'], correctif: { libellé: 'Remplacer par 2012-10-17', appliquer: p => ({ ...p, version: VERSION_COURANTE }) } })
  } else if (doc.Version === '2008-10-17') {
    ajouter('VERSION_ANCIENNE', 'avertissement', 'Version 2008-10-17 : ancienne, sans variables de politique (${aws:username} y est du texte littéral). Utilisez 2012-10-17.', { chemin: ['Version'], correctif: { libellé: 'Passer en 2012-10-17', appliquer: p => ({ ...p, version: VERSION_COURANTE }) } })
  }
  if (doc.Id !== undefined && typeof doc.Id !== 'string') ajouter('ID_TYPE', 'erreur', 'Id doit être une chaîne.', { chemin: ['Id'] })

  // ---- Statement --------------------------------------------------------------------------------
  const s = doc.Statement
  if (s === undefined) {
    ajouter('STATEMENT_MANQUANT', 'erreur', 'Statement manquant : une politique contient au moins une déclaration.')
    return finir(constats, doc, type, null)
  }
  const liste = Array.isArray(s) ? s : estObjet(s) ? [s] : null
  if (!liste) {
    ajouter('STATEMENT_TYPE', 'erreur', 'Statement doit être un objet ou un tableau d\'objets.', { chemin: ['Statement'] })
    return finir(constats, doc, type, null)
  }
  if (!liste.length) {
    ajouter('STATEMENT_VIDE', 'erreur', 'Statement est vide : ajoutez au moins une déclaration.', { chemin: ['Statement'] })
    return finir(constats, doc, type, null)
  }
  const cheminD = (i, ...reste) => (Array.isArray(s) ? ['Statement', i, ...reste] : ['Statement', ...reste])

  const entrées = liste.map((raw, i) => ({ raw, i, norm: estObjet(raw) ? normaliserDéclaration(raw) : null }))
  const sidsVus = new Map()
  for (const { raw, i } of entrées) {
    const p = (...r) => cheminD(i, ...r)
    const d = i
    if (!estObjet(raw)) { ajouter('DÉCLARATION_TYPE', 'erreur', `La déclaration ${i + 1} doit être un objet.`, { déclaration: d, chemin: p() }); continue }
    for (const k of Object.keys(raw)) {
      if (!ÉLÉMENTS_DÉCLARATION.includes(k)) {
        const sug = suggérer(k, ÉLÉMENTS_DÉCLARATION, { n: 1, max: 3 })[0]
        ajouter('CLÉ_INCONNUE', 'erreur', `Déclaration ${i + 1} : clé « ${k} » inconnue${sug ? ` : vouliez-vous écrire « ${sug.valeur} » ?` : ' (attendu : Sid, Effect, Principal, Action, Resource, Condition…).'}`, { déclaration: d, chemin: p(k, '#clé') })
      }
    }
    // Effect
    if (raw.Effect === undefined) ajouter('EFFET_MANQUANT', 'erreur', `Déclaration ${i + 1} : Effect manquant ("Allow" ou "Deny").`, { déclaration: d, chemin: p() })
    else if (raw.Effect !== 'Allow' && raw.Effect !== 'Deny') {
      const proche = typeof raw.Effect === 'string' && ['allow', 'deny'].includes(raw.Effect.toLowerCase())
      ajouter('EFFET_INVALIDE', 'erreur', `Déclaration ${i + 1} : Effect ${JSON.stringify(raw.Effect)} invalide${proche ? ` (la casse compte : écrivez « ${raw.Effect[0].toUpperCase()}${raw.Effect.slice(1).toLowerCase()} »)` : ' : seuls "Allow" et "Deny" sont permis'}.`, { déclaration: d, chemin: p('Effect'), correctif: proche ? { libellé: `Écrire ${raw.Effect[0].toUpperCase()}${raw.Effect.slice(1).toLowerCase()}`, appliquer: pol => ({ ...pol, déclarations: pol.déclarations.map((x, j) => (j === d ? { ...x, effet: raw.Effect[0].toUpperCase() + raw.Effect.slice(1).toLowerCase() } : x)) }) } : undefined })
    }
    // Sid
    if (raw.Sid !== undefined) {
      if (typeof raw.Sid !== 'string') ajouter('SID_TYPE', 'erreur', `Déclaration ${i + 1} : Sid doit être une chaîne.`, { déclaration: d, chemin: p('Sid') })
      else {
        if (!/^[A-Za-z0-9]+$/.test(raw.Sid)) ajouter('SID_CARACTÈRES', IAM_GÉRÉ.includes(type) ? 'erreur' : 'avertissement', `Déclaration ${i + 1} : le Sid « ${raw.Sid} » ne doit contenir que des lettres et des chiffres ASCII (pas d'espace, de tiret ni d'accent).`, { déclaration: d, chemin: p('Sid'), correctif: { libellé: 'Retirer les caractères interdits', appliquer: pol => ({ ...pol, déclarations: pol.déclarations.map((x, j) => (j === d ? { ...x, sid: raw.Sid.replace(/[^A-Za-z0-9]/g, '') || undefined } : x)) }) } })
        if (sidsVus.has(raw.Sid)) ajouter('SID_DOUBLON', 'erreur', `Les déclarations ${sidsVus.get(raw.Sid) + 1} et ${i + 1} ont le même Sid « ${raw.Sid} » : il doit être unique dans la politique.`, { déclaration: d, chemin: p('Sid') })
        else sidsVus.set(raw.Sid, i)
      }
    }
    // Action / NotAction
    const a = raw.Action
    const na = raw.NotAction
    if (a !== undefined && na !== undefined) ajouter('ACTION_DOUBLE', 'erreur', `Déclaration ${i + 1} : Action et NotAction ne peuvent pas coexister.`, { déclaration: d, chemin: p('NotAction', '#clé') })
    if (a === undefined && na === undefined) ajouter('ACTION_MANQUANTE', 'erreur', `Déclaration ${i + 1} : Action (ou NotAction) manquante.`, { déclaration: d, chemin: p() })
    for (const [nom, v] of [['Action', a], ['NotAction', na]]) {
      if (v === undefined) continue
      const arr = Array.isArray(v) ? v : [v]
      if (!arr.length) ajouter('LISTE_VIDE', 'erreur', `Déclaration ${i + 1} : ${nom} est une liste vide.`, { déclaration: d, chemin: p(nom) })
      arr.forEach((x, k) => { if (typeof x !== 'string') ajouter('VALEUR_TYPE', 'erreur', `Déclaration ${i + 1} : ${nom} ne doit contenir que des chaînes (reçu ${JSON.stringify(x)}).`, { déclaration: d, chemin: Array.isArray(v) ? p(nom, k) : p(nom) }) })
    }
    // Resource / NotResource
    const r = raw.Resource
    const nr = raw.NotResource
    if (r !== undefined && nr !== undefined) ajouter('RESSOURCE_DOUBLE', 'erreur', `Déclaration ${i + 1} : Resource et NotResource ne peuvent pas coexister.`, { déclaration: d, chemin: p('NotResource', '#clé') })
    if (t.ressource === 'interdite' && (r !== undefined || nr !== undefined)) ajouter('RESSOURCE_INTERDITE', 'erreur', `Déclaration ${i + 1} : une politique d'approbation ne contient pas de Resource (la ressource est le rôle lui-même) : IAM la refuse.`, { déclaration: d, chemin: p(r !== undefined ? 'Resource' : 'NotResource', '#clé') })
    if (t.ressource === 'requise' && r === undefined && nr === undefined) ajouter('RESSOURCE_MANQUANTE', 'erreur', `Déclaration ${i + 1} : Resource (ou NotResource) manquante${type === 'ressource' ? ' (exigée par la plupart des services)' : ''}. Pour toutes les ressources, écrivez "Resource": "*".`, { déclaration: d, chemin: p() })
    for (const [nom, v] of [['Resource', r], ['NotResource', nr]]) {
      if (v === undefined) continue
      const arr = Array.isArray(v) ? v : [v]
      if (!arr.length) ajouter('LISTE_VIDE', 'erreur', `Déclaration ${i + 1} : ${nom} est une liste vide.`, { déclaration: d, chemin: p(nom) })
      arr.forEach((x, k) => { if (typeof x !== 'string') ajouter('VALEUR_TYPE', 'erreur', `Déclaration ${i + 1} : ${nom} ne doit contenir que des chaînes (reçu ${JSON.stringify(x)}).`, { déclaration: d, chemin: Array.isArray(v) ? p(nom, k) : p(nom) }) })
    }
    // Principal
    const pr = raw.Principal
    const npr = raw.NotPrincipal
    if (pr !== undefined && npr !== undefined) ajouter('PRINCIPAL_DOUBLE', 'erreur', `Déclaration ${i + 1} : Principal et NotPrincipal ne peuvent pas coexister.`, { déclaration: d, chemin: p('NotPrincipal', '#clé') })
    if (t.principal === 'interdit' && (pr !== undefined || npr !== undefined)) ajouter('PRINCIPAL_INTERDIT', 'erreur', `Déclaration ${i + 1} : une politique ${t.court === 'Identité' ? 'd\'identité' : `de type « ${t.court} »`} n'a pas de Principal (c'est l'identité à laquelle elle est attachée) : IAM la refuse.`, { déclaration: d, chemin: p(pr !== undefined ? 'Principal' : 'NotPrincipal', '#clé') })
    if (t.principal === 'requis' && pr === undefined && npr === undefined) ajouter('PRINCIPAL_MANQUANT', 'erreur', `Déclaration ${i + 1} : Principal manquant : il dit QUI est autorisé${type === 'approbation' ? ' à assumer le rôle' : ''}.`, { déclaration: d, chemin: p() })
    for (const [nom, v] of [['Principal', pr], ['NotPrincipal', npr]]) {
      if (v === undefined) continue
      vérifierPrincipal(v, nom, i, d, p(nom), ajouter)
    }
    if (npr !== undefined && raw.Effect === 'Allow') ajouter('NOTPRINCIPAL_ALLOW', 'avertissement', `Déclaration ${i + 1} : NotPrincipal avec Allow autorise tout le monde sauf les principaux listés (y compris des anonymes) : à éviter.`, { déclaration: d, chemin: p('NotPrincipal', '#clé') })
    // Condition
    if (raw.Condition !== undefined) {
      if (!estObjet(raw.Condition)) ajouter('CONDITION_TYPE', 'erreur', `Déclaration ${i + 1} : Condition doit être un objet { "Opérateur": { "clé": "valeur" } }.`, { déclaration: d, chemin: p('Condition') })
      else {
        for (const [op, cl] of Object.entries(raw.Condition)) {
          if (!estObjet(cl)) ajouter('CONDITION_TYPE', 'erreur', `Déclaration ${i + 1} : « ${op} » doit contenir des paires "clé": valeur.`, { déclaration: d, chemin: p('Condition', op) })
          else if (!Object.keys(cl).length) ajouter('CONDITION_VIDE', 'erreur', `Déclaration ${i + 1} : « ${op} » ne contient aucune clé.`, { déclaration: d, chemin: p('Condition', op) })
        }
      }
    }
  }

  // ---- Sémantique (nécessite les données) -----------------------------------------------------------
  const valides = entrées.filter(e => e.norm)
  if (cat) for (const e of valides) sémantique(e, { type, cat, ajouter, cheminD, doc, tableau: Array.isArray(s) })
  for (const e of valides) règlesSimples(e, { ajouter, cheminD })
  const pol = normaliser(doc)
  analyserSécurité({ entrées: valides, type, cat, ajouter, cheminD })
  return finir(constats, doc, type, pol)
}

function finir(constats, doc, type, politique) {
  const trié = constats
    .map((c, k) => [k, c])
    .sort(([ka, a], [kb, b]) => GRAVITÉS.indexOf(a.niveau) - GRAVITÉS.indexOf(b.niveau) || (a.déclaration ?? -1) - (b.déclaration ?? -1) || ka - kb)
    .map(([, c]) => c)
  const taille = doc && typeof doc === 'object' ? tailleDoc(doc) : 0
  const limites = limitesPour(type, taille)
  if (limites.length && limites.every(l => !l.ok)) {
    trié.unshift({ code: 'TAILLE', niveau: 'erreur', message: `Taille ${taille.toLocaleString('fr-FR')} caractères : dépasse la limite (${limites.map(l => `${l.nom} ${l.max.toLocaleString('fr-FR')}`).join(', ')}). Les espaces ne comptent pas.` })
  } else if (limites.some(l => !l.ok)) {
    trié.push({ code: 'TAILLE_PARTIELLE', niveau: 'info', message: `Taille ${taille.toLocaleString('fr-FR')} caractères : trop grande pour ${limites.filter(l => !l.ok).map(l => `${l.nom} (${l.max.toLocaleString('fr-FR')})`).join(', ')}, acceptable pour ${limites.filter(l => l.ok).map(l => l.nom).join(', ')}.` })
  }
  const compte = n => trié.filter(c => c.niveau === n).length
  return {
    constats: trié,
    résumé: { erreurs: compte('erreur'), sécurité: compte('sécurité'), avertissements: compte('avertissement'), suggestions: compte('suggestion'), infos: compte('info') },
    valide: compte('erreur') === 0,
    politique: politique ?? normaliser(doc),
    taille,
    limites,
  }
}

// ---- Principal -------------------------------------------------------------------------------------------

function vérifierPrincipal(v, nom, i, d, chemin, ajouter) {
  const base = `Déclaration ${i + 1} : ${nom}`
  if (v === '*') return
  if (!estObjet(v)) { ajouter('PRINCIPAL_FORMAT', 'erreur', `${base} doit être "*" ou un objet { "AWS": …, "Service": …, "Federated": … }.`, { déclaration: d, chemin }); return }
  const TYPES_P = ['AWS', 'Service', 'Federated', 'CanonicalUser']
  for (const [k, x] of Object.entries(v)) {
    if (!TYPES_P.includes(k)) { ajouter('PRINCIPAL_TYPE', 'erreur', `${base} : type « ${k} » inconnu (attendu : ${TYPES_P.join(', ')}).`, { déclaration: d, chemin: [...chemin, k] }); continue }
    const arr = Array.isArray(x) ? x : [x]
    if (!arr.length) ajouter('LISTE_VIDE', 'erreur', `${base}.${k} est une liste vide.`, { déclaration: d, chemin: [...chemin, k] })
    for (const e of arr) {
      if (typeof e !== 'string') { ajouter('VALEUR_TYPE', 'erreur', `${base}.${k} ne doit contenir que des chaînes.`, { déclaration: d, chemin: [...chemin, k] }); continue }
      if (k === 'AWS') {
        if (e === '*') continue
        if (/[*?]/.test(e)) ajouter('PRINCIPAL_JOKER', 'erreur', `${base}.AWS : « ${e} » — les jokers ne sont pas permis dans Principal (sauf "*" seul). Utilisez une condition aws:PrincipalArn ou aws:PrincipalOrgID.`, { déclaration: d, chemin: [...chemin, k] })
        else if (/^\d{12}$/.test(e)) continue
        else if (/^AIDA|^AROA/.test(e)) ajouter('PRINCIPAL_ID_UNIQUE', 'avertissement', `${base}.AWS : « ${e} » est un identifiant unique : IAM le remplace par l'ARN à l'enregistrement, ou le refuse si l'identité est supprimée.`, { déclaration: d, chemin: [...chemin, k] })
        else if (!e.startsWith('arn:')) ajouter('PRINCIPAL_AWS', 'erreur', `${base}.AWS : « ${e} » doit être un ARN (arn:aws:iam::123456789012:role/nom), un identifiant de compte à 12 chiffres ou "*".`, { déclaration: d, chemin: [...chemin, k] })
        else {
          const a = analyserArn(e)
          for (const pb of a.problèmes) ajouter(pb.code, pb.niveau, `${base}.AWS : ${pb.message}`, { déclaration: d, chemin: [...chemin, k] })
          if (a.ok && a.service !== 'iam' && a.service !== 'sts') ajouter('PRINCIPAL_SERVICE_ARN', 'avertissement', `${base}.AWS : l'ARN « ${e} » n'est pas celui d'une identité IAM (iam ou sts).`, { déclaration: d, chemin: [...chemin, k] })
        }
      } else if (k === 'Service') {
        if (/[*?]/.test(e)) ajouter('PRINCIPAL_JOKER', 'erreur', `${base}.Service : jokers interdits (« ${e} »).`, { déclaration: d, chemin: [...chemin, k] })
        else if (!/^[a-z0-9.-]+\.(amazonaws\.com(\.cn)?|aws\.internal)$|^[a-z0-9-]+\.amazonaws\.com$/.test(e)) ajouter('PRINCIPAL_SERVICE', 'avertissement', `${base}.Service : « ${e} » ne ressemble pas à un principal de service AWS (ex. lambda.amazonaws.com).`, { déclaration: d, chemin: [...chemin, k] })
      } else if (k === 'Federated') {
        if (/[*?]/.test(e)) ajouter('PRINCIPAL_JOKER', 'erreur', `${base}.Federated : jokers interdits (« ${e} »).`, { déclaration: d, chemin: [...chemin, k] })
        else if (!e.startsWith('arn:') && !/^(cognito-identity|accounts\.google|www\.amazon|graph\.facebook)\.(amazonaws\.com|com)$/.test(e)) ajouter('PRINCIPAL_FÉDÉRÉ', 'avertissement', `${base}.Federated : « ${e} » devrait être l'ARN d'un fournisseur (arn:aws:iam::123456789012:oidc-provider/… ou saml-provider/…).`, { déclaration: d, chemin: [...chemin, k] })
      }
    }
  }
}

// ---- Règles simples sur les valeurs (sans données AWS) ---------------------------------------------------------

function règlesSimples({ norm, i }, { ajouter, cheminD }) {
  const d = i
  // Doublons et chevauchements dans la liste d'actions.
  const liste = norm.actions?.liste ?? []
  const vus = new Map()
  liste.forEach((m, k) => {
    const bas = m.toLowerCase()
    if (vus.has(bas)) ajouter('ACTION_DOUBLON', 'suggestion', `Déclaration ${i + 1} : l'action « ${m} » est écrite plusieurs fois.`, { déclaration: d, chemin: cheminD(i, norm.actions.inverse ? 'NotAction' : 'Action'), correctif: { libellé: `Retirer le doublon de ${m}`, appliquer: pol => ({ ...pol, déclarations: pol.déclarations.map((x, j) => (j === d && x.actions ? { ...x, actions: { ...x.actions, liste: x.actions.liste.filter((y, kk) => y.toLowerCase() !== bas || kk === liste.findIndex(z => z.toLowerCase() === bas)) } } : x)) }) } })
    vus.set(bas, k)
  })
  const jokers = liste.filter(m => estJoker(m) && m !== '*')
  for (const m of liste) {
    if (estJoker(m)) continue
    const couvert = jokers.find(j => correspond(j, m, { insensible: true }))
    if (couvert) ajouter('ACTION_COUVERTE', 'suggestion', `Déclaration ${i + 1} : « ${m} » est déjà couverte par « ${couvert} » dans la même liste.`, { déclaration: d, chemin: cheminD(i, norm.actions.inverse ? 'NotAction' : 'Action'), correctif: { libellé: `Retirer ${m}`, appliquer: pol => ({ ...pol, déclarations: pol.déclarations.map((x, j) => (j === d && x.actions ? { ...x, actions: { ...x.actions, liste: x.actions.liste.filter(y => y !== m) } } : x)) }) } })
  }
  // Format d'action.
  for (const m of liste) {
    if (m === '*') continue
    if (!/^[A-Za-z0-9*?_.-]+:[A-Za-z0-9*?_.-]*$/.test(m)) ajouter('ACTION_FORMAT', 'erreur', `Déclaration ${i + 1} : « ${m} » n'est pas une action valide : écrivez service:Action (ex. s3:GetObject), ou "*".`, { déclaration: d, chemin: cheminD(i, norm.actions.inverse ? 'NotAction' : 'Action') })
  }
  // Ressources : forme des ARN (variables remplacées par du texte neutre).
  for (const r of norm.ressources?.liste ?? []) {
    if (r === '*') continue
    const a = analyserArn(r.replace(/\$\{[^}]+\}/g, 'x'))
    for (const pb of a.problèmes) ajouter(pb.code, pb.niveau, `Déclaration ${i + 1} : ${pb.message}`, { déclaration: d, chemin: cheminD(i, norm.ressources.inverse ? 'NotResource' : 'Resource') })
  }
  const ressources = norm.ressources?.liste ?? []
  if (ressources.length > 1 && ressources.includes('*') && !norm.ressources.inverse) ajouter('RESSOURCE_REDONDANTE', 'suggestion', `Déclaration ${i + 1} : Resource contient « * » : les autres entrées sont inutiles.`, { déclaration: d, chemin: cheminD(i, 'Resource') })
  // Conditions : opérateurs, valeurs.
  for (const c of norm.conditions) {
    const op = analyserOpérateur(c.opérateur)
    const chemin = cheminD(i, 'Condition', c.opérateur, c.clé)
    if (!op) {
      const base = c.opérateur.replace(/^(ForAllValues|ForAnyValue):/i, '').replace(/IfExists$/i, '')
      const s = suggérer(base, listeOpérateurs(), { n: 1, max: 4 })[0]
      ajouter('OPÉRATEUR_INCONNU', 'erreur', `Déclaration ${i + 1} : opérateur de condition « ${c.opérateur} » inconnu${s ? ` : vouliez-vous écrire « ${s.valeur} » ?` : '.'}`, { déclaration: d, chemin: cheminD(i, 'Condition', c.opérateur, '#clé') })
      continue
    }
    if (!op.casseCanonique) ajouter('OPÉRATEUR_CASSE', 'suggestion', `Déclaration ${i + 1} : écrivez l'opérateur « ${op.canonique} » (casse conventionnelle) plutôt que « ${c.opérateur} ».`, { déclaration: d, chemin })
    if (op.siExiste && op.base === 'Null') ajouter('NULL_IFEXISTS', 'erreur', `Déclaration ${i + 1} : l'opérateur Null n'accepte pas IfExists.`, { déclaration: d, chemin })
    if (!c.valeurs.length) ajouter('CONDITION_SANS_VALEUR', 'erreur', `Déclaration ${i + 1} : la clé « ${c.clé} » n'a aucune valeur.`, { déclaration: d, chemin })
    const f = op.info.famille
    for (const v of c.valeurs) {
      const s = enTexte(v)
      if (v === null || typeof v === 'object') { ajouter('VALEUR_TYPE', 'erreur', `Déclaration ${i + 1} : valeur de condition invalide pour « ${c.clé} » (chaîne, nombre ou booléen attendu).`, { déclaration: d, chemin }); continue }
      if (f === 'ip') {
        if (!lireCidr(s)) ajouter('IP_INVALIDE', 'erreur', `Déclaration ${i + 1} : « ${s} » n'est pas une adresse IP ou un CIDR valide (ex. 203.0.113.0/24).`, { déclaration: d, chemin })
        else if (bitsHôteNonNuls(s)) ajouter('CIDR_BITS_HÔTE', 'avertissement', `Déclaration ${i + 1} : « ${s} » a des bits d'hôte non nuls : le réseau couvert est celui de son préfixe (vérifiez que c'est voulu).`, { déclaration: d, chemin })
        else if (/\/0$/.test(s)) ajouter('CIDR_OUVERT', 'sécurité', `Déclaration ${i + 1} : « ${s} » couvre toutes les adresses : la condition ne restreint rien.`, { déclaration: d, chemin })
      } else if (f === 'numeric' && !/^-?\d+(\.\d+)?$/.test(s.trim())) ajouter('NOMBRE_INVALIDE', 'erreur', `Déclaration ${i + 1} : « ${s} » n'est pas un nombre (condition ${c.opérateur} sur ${c.clé}).`, { déclaration: d, chemin })
      else if (f === 'date' && lireDate(s) === null && !/\$\{/.test(s)) ajouter('DATE_INVALIDE', 'erreur', `Déclaration ${i + 1} : « ${s} » n'est pas une date valide (ISO 8601 comme 2027-01-31T23:59:59Z, ou secondes depuis 1970).`, { déclaration: d, chemin })
      else if ((f === 'bool' || (f === 'null')) && !/^(true|false)$/i.test(s)) ajouter('BOOL_INVALIDE', 'erreur', `Déclaration ${i + 1} : « ${s} » doit valoir true ou false (condition ${c.opérateur}).`, { déclaration: d, chemin })
      else if (f === 'arn' && s !== '*' && !/\$\{/.test(s) && !découperArn(s).ok) ajouter('ARN_INVALIDE', 'erreur', `Déclaration ${i + 1} : « ${s} » n'est pas un ARN (condition ${c.opérateur} sur ${c.clé}).`, { déclaration: d, chemin })
      else if (op.base === 'StringLike' && !/[*?]/.test(s) && !/\$\{/.test(s)) ajouter('LIKE_SANS_JOKER', 'suggestion', `Déclaration ${i + 1} : « ${s} » ne contient pas de joker : StringEquals suffit (et exprime mieux l'intention).`, { déclaration: d, chemin })
      else if (['StringLike', 'ArnLike'].includes(op.base) && s === '*') ajouter('LIKE_TOUT', 'avertissement', `Déclaration ${i + 1} : la valeur « * » est toujours vraie quand la clé existe : la condition ne restreint rien.`, { déclaration: d, chemin })
      if (f !== 'ip' && f !== 'null' && f !== 'bool' && f !== 'numeric' && f !== 'date' && /\$\{[^}]*\}/.test(s) && !/\$\{[A-Za-z0-9:_./*?$-]+(, *'[^']*')?\}/.test(s)) ajouter('VARIABLE_INVALIDE', 'avertissement', `Déclaration ${i + 1} : variable de politique mal écrite dans « ${s} » (attendu : \${aws:username}).`, { déclaration: d, chemin })
    }
    if (op.base === 'Null' && c.valeurs.length > 1) ajouter('NULL_PLUSIEURS', 'avertissement', `Déclaration ${i + 1} : Null attend une seule valeur (true ou false).`, { déclaration: d, chemin })
    // Piège MFA : Deny + Bool false sans IfExists ne bloque pas les clés d'accès longue durée.
    if (/^aws:multifactorauthpresent$/i.test(c.clé) && norm.effet === 'Deny' && op.base === 'Bool' && !op.siExiste && c.valeurs.some(v => enTexte(v).toLowerCase() === 'false')) {
      ajouter('MFA_MOTIF', 'sécurité', `Déclaration ${i + 1} : « Deny + Bool aws:MultiFactorAuthPresent=false » ne bloque pas les requêtes dont la clé est absente (clés d'accès longue durée, sans MFA). Utilisez BoolIfExists.`, { déclaration: d, chemin, correctif: { libellé: 'Utiliser BoolIfExists', appliquer: pol => ({ ...pol, déclarations: pol.déclarations.map((x, j) => (j === d ? { ...x, conditions: x.conditions.map(y => (y === c || (y.opérateur === c.opérateur && y.clé === c.clé) ? { ...y, opérateur: `${y.opérateur}IfExists` } : y)) } : x)) }) } })
    }
    if (/^aws:multifactorauthpresent$/i.test(c.clé) && norm.effet === 'Allow' && op.base === 'Bool' && c.valeurs.some(v => enTexte(v).toLowerCase() === 'false') && !op.siExiste) {
      ajouter('MFA_ALLOW_FAUX', 'avertissement', `Déclaration ${i + 1} : Allow quand la MFA est absente (false) est rarement voulu.`, { déclaration: d, chemin })
    }
    if (op.ensemble === 'ForAllValues' && norm.effet === 'Allow' && !norm.conditions.some(x => x.clé === c.clé && /^Null$/i.test(x.opérateur))) {
      ajouter('FORALL_ALLOW', 'sécurité', `Déclaration ${i + 1} : ForAllValues dans un Allow est vrai quand la clé « ${c.clé} » est absente de la requête : ajoutez une condition Null (false) sur cette clé.`, { déclaration: d, chemin })
    }
    // Deny sur adresse IP sans exception pour les services AWS.
    if (/^aws:sourceip$/i.test(c.clé) && norm.effet === 'Deny' && op.base === 'NotIpAddress' && !norm.conditions.some(x => /^aws:viaawsservice$/i.test(x.clé))) {
      ajouter('DENY_IP_SERVICES', 'avertissement', `Déclaration ${i + 1} : un Deny « hors de ces adresses » bloque aussi les appels que les services AWS font en votre nom (CloudFormation, Athena…). Ajoutez la condition Bool aws:ViaAWSService=false.`, { déclaration: d, chemin })
    }
  }
}

// ---- Sémantique : services, actions, ressources, clés ------------------------------------------------------------

function sémantique({ norm, i }, { cat, ajouter, cheminD, type }) {
  const d = i
  const motifs = (norm.actions?.liste ?? []).filter(m => typeof m === 'string' && m !== '*' && /^[A-Za-z0-9*?_.-]+:/.test(m))
  const cheminA = cheminD(i, norm.actions?.inverse ? 'NotAction' : 'Action')
  const actions = []
  for (const m of motifs) {
    const { service, nom } = découperAction(m)
    const services = servicesVisés(cat, m)
    if (!services.length) {
      const prefs = cat.préfixes().map(s => s.p)
      const s = suggérer(service, prefs, { n: 3, max: 3 })
      const proche = s[0]?.distance <= 2
      ajouter('PRÉFIXE_INCONNU', proche ? 'erreur' : 'avertissement', `Déclaration ${i + 1} : le service « ${service} » n'existe pas dans les données IAM d'AWS${s.length ? ` — vouliez-vous écrire ${s.map(x => `« ${x.valeur} »`).join(' ou ')} ?` : '.'}`, { déclaration: d, chemin: cheminA, correctif: proche ? { libellé: `Remplacer ${service} par ${s[0].valeur}`, appliquer: pol => remplacerAction(pol, d, m, `${s[0].valeur}:${nom}`) } : undefined })
      continue
    }
    if (services.length > 12) continue
    const e = étendreMotif(cat, m)
    if (e.manquants.length) continue // service non chargé : on ne conclut pas
    if (!e.actions.length) {
      if (!estJoker(nom)) {
        const s = suggérer(nom, cat.service(services[0]).actions.map(a => a.nom), { n: 3, max: 4 })
        const proche = s[0]?.distance <= 2
        ajouter('ACTION_INCONNUE', proche ? 'erreur' : 'avertissement', `Déclaration ${i + 1} : l'action « ${m} » n'existe pas dans les données IAM d'AWS (version du ${cat.source?.miseÀJour?.slice(0, 10) ?? '?'})${s.length ? ` — vouliez-vous écrire ${s.map(x => `« ${services[0]}:${x.valeur} »`).join(' ou ')} ?` : '.'}`, { déclaration: d, chemin: cheminA, correctif: proche ? { libellé: `Remplacer par ${services[0]}:${s[0].valeur}`, appliquer: pol => remplacerAction(pol, d, m, `${cat.infoService(services[0]).p}:${s[0].valeur}`) } : undefined })
      } else ajouter('ACTION_JOKER_VIDE', 'avertissement', `Déclaration ${i + 1} : le motif « ${m} » ne correspond à aucune action connue.`, { déclaration: d, chemin: cheminA })
      continue
    }
    actions.push(...e.actions)
    // Casse du préfixe : IAM est insensible, mais la convention est la minuscule.
    if (!estJoker(service) && service !== service.toLowerCase()) ajouter('PRÉFIXE_CASSE', 'suggestion', `Déclaration ${i + 1} : le préfixe de « ${m} » s'écrit en minuscules (« ${service.toLowerCase()} »).`, { déclaration: d, chemin: cheminA })
  }
  const uniques = [...new Map(actions.map(a => [a.id, a])).values()]

  // Ressources vs actions.
  if (!norm.ressources?.inverse && norm.ressources?.liste?.length && uniques.length && type !== 'approbation') {
    const ress = norm.ressources.liste.map(r => r.replace(/\$\{[^}]+\}/g, 'x'))
    const tout = ress.some(r => r === '*')
    if (!tout) {
      const sans = []
      for (const a of uniques) {
        const ok = a.ressources.length === 0
          ? ress.some(r => correspond(r, '*'))
          : a.ressources.some(rt => rt.modèle && ress.some(r => arnCompatible(r, rt.modèle)))
        if (!ok) sans.push(a)
      }
      if (sans.length === uniques.length || (sans.length && !motifs.some(estJoker))) {
        const exemples = sans.slice(0, 4).map(a => a.id).join(', ')
        const tousMorts = sans.length === uniques.length
        const a0 = sans[0]
        const attendu = a0.ressources.length ? [...a0.ressources.filter(r => r.modèle)].sort((x, y) => (x.modèle.match(/\$\{/g) ?? []).length - (y.modèle.match(/\$\{/g) ?? []).length).map(r => `${r.nom} : ${r.modèle.replace('${Partition}', 'aws')}`).slice(0, 3).join(' ; ') : 'cette action ne gère pas les ressources précises : utilisez "Resource": "*"'
        const refus = norm.effet === 'Deny'
        ajouter('RESSOURCE_INCOMPATIBLE', 'erreur', `Déclaration ${i + 1} : ${tousMorts ? 'aucune des actions' : `${sans.length > 1 ? 'les actions' : 'l\'action'} ${exemples}`} ne s'applique ${norm.ressources.liste.length > 1 ? 'aux ressources indiquées' : 'à la ressource indiquée'} — ${refus ? 'le Deny ne protège rien' : 'l\'autorisation ne sert à rien'}. Attendu pour ${a0.id} : ${attendu}.`, { déclaration: d, chemin: cheminD(i, 'Resource'), correctif: correctifS3(norm, d, a0, sans) })
      }
    }
  }
  // Clés de condition vs actions.
  for (const c of norm.conditions) {
    const chemin = cheminD(i, 'Condition', c.opérateur, c.clé)
    const op = analyserOpérateur(c.opérateur)
    const prefixe = /^([^:]+):/.exec(c.clé)?.[1] ?? ''
    const global = /^aws:/i.test(c.clé)
    const dépendDeLAction = /^aws:(requesttag|resourcetag|tagkeys)/i.test(c.clé)
    const connue = cat.trouverClé(c.clé, global ? null : (cat.existe(prefixe) && cat.chargé(prefixe) ? prefixe : null))
    if (!connue) {
      if (global) {
        const s = suggérer(c.clé, cat.globales().map(g => g.k.replace('tag-key', 'Clé')), { n: 2, max: 3 })
        ajouter('CLÉ_INCONNUE_GLOBALE', 'avertissement', `Déclaration ${i + 1} : la clé de condition « ${c.clé} » n'est pas une clé globale AWS connue${s.length ? ` — vouliez-vous écrire ${s.map(x => `« ${x.valeur} »`).join(' ou ')} ?` : '.'}`, { déclaration: d, chemin })
      } else if (cat.existe(prefixe) && cat.chargé(prefixe)) {
        const noms = [...cat.service(prefixe).clés.values()].map(k => k.clé)
        const s = suggérer(c.clé, noms, { n: 2, max: 4 })
        ajouter('CLÉ_INCONNUE', 'avertissement', `Déclaration ${i + 1} : la clé « ${c.clé} » n'existe pas pour le service ${prefixe}${s.length ? ` — vouliez-vous écrire ${s.map(x => `« ${x.valeur} »`).join(' ou ')} ?` : '.'}`, { déclaration: d, chemin })
      } else if (!cat.existe(prefixe) && !(type === 'approbation' && /[.]/.test(prefixe)) && !/^saml$/i.test(prefixe)) {
        ajouter('CLÉ_INCONNUE', 'avertissement', `Déclaration ${i + 1} : la clé « ${c.clé} » ne correspond à aucun service ni clé globale connus.`, { déclaration: d, chemin })
      }
      continue
    }
    // Disponibilité pour les actions de la déclaration.
    if (uniques.length && (dépendDeLAction || !connue.globale)) {
      const supportée = uniques.some(a => a.clés.some(k => k.clé.toLowerCase() === c.clé.toLowerCase() || (k.gabarit && k.gabarit.test(c.clé)) || (connue.gabarit && k.clé.toLowerCase() === connue.clé.toLowerCase())))
      const global_ = connue.globale && !dépendDeLAction
      if (!supportée && !global_) {
        const refus = norm.effet === 'Deny'
        ajouter('CLÉ_NON_APPLICABLE', refus ? 'sécurité' : 'avertissement', `Déclaration ${i + 1} : la clé « ${c.clé} » n'est pas fournie par ${uniques.length > 1 ? 'les actions' : 'l\'action'} de la déclaration (${uniques.slice(0, 3).map(a => a.id).join(', ')}${uniques.length > 3 ? '…' : ''}) : absente de la requête, la condition est fausse${refus ? ' → le Deny ne s\'appliquera jamais' : ' → l\'autorisation ne s\'appliquera jamais'}.`, { déclaration: d, chemin })
      }
    }
    // Type de la clé ↔ opérateur.
    if (op) {
      const type = connue.type ?? 'String'
      const base = String(type).replace(/^ArrayOf/, '')
      const multi = /^ArrayOf/.test(type)
      const famille = op.info.famille
      const attendue = { String: 'string', ARN: 'arn', Bool: 'bool', Numeric: 'numeric', Date: 'date', IPAddress: 'ip' }[base]
      if (famille !== 'null' && attendue && famille !== attendue) {
        const tolérant = (attendue === 'arn' && famille === 'string') || (attendue === 'string' && famille === 'string') || (attendue === 'bool' && famille === 'string') || (attendue === 'numeric' && famille === 'string')
        ajouter('TYPE_OPÉRATEUR', tolérant ? 'suggestion' : 'erreur', `Déclaration ${i + 1} : « ${c.clé} » est de type ${type} : ${tolérant ? `l'opérateur ${c.opérateur} fonctionne mais ${{ arn: 'ArnLike / ArnEquals', bool: 'Bool', numeric: 'Numeric…' }[attendue]} est plus adapté` : `l'opérateur ${c.opérateur} est de la famille « ${famille} », ce qui ne convient pas`}.`, { déclaration: d, chemin })
      }
      if (multi && !op.ensemble && famille !== 'null') ajouter('CLÉ_MULTIVALEUR', 'avertissement', `Déclaration ${i + 1} : « ${c.clé} » peut contenir plusieurs valeurs : utilisez ForAnyValue: ou ForAllValues: devant l'opérateur.`, { déclaration: d, chemin })
      if (!multi && op.ensemble && famille !== 'null') ajouter('ENSEMBLE_SUR_MONOVALEUR', 'avertissement', `Déclaration ${i + 1} : « ${c.clé} » n'a qu'une valeur par requête : ${op.ensemble}: n'est pas nécessaire (et peut piéger).`, { déclaration: d, chemin })
    }
  }
}

function remplacerAction(pol, d, ancien, nouveau) {
  return { ...pol, déclarations: pol.déclarations.map((x, j) => (j === d && x.actions ? { ...x, actions: { ...x.actions, liste: x.actions.liste.map(y => (y === ancien ? nouveau : y)) } } : x)) }
}

// Correctif sûr pour le piège S3 : arn:aws:s3:::bucket (bucket) au lieu de arn:aws:s3:::bucket/* (objets), ou l'inverse.
function correctifS3(norm, d, action, sans) {
  if (action.service !== 's3' || !norm.ressources?.liste) return undefined
  const buckets = norm.ressources.liste.filter(r => /^arn:[^:]+:s3:::[^/]+$/.test(r))
  const objets = norm.ressources.liste.filter(r => /^arn:[^:]+:s3:::[^/]+\/.+$/.test(r))
  const veutObjet = sans.some(a => a.ressources.some(r => r.nom === 'object')) && !sans.some(a => a.ressources.some(r => r.nom === 'bucket'))
  const veutBucket = sans.some(a => a.ressources.some(r => r.nom === 'bucket')) && !sans.some(a => a.ressources.some(r => r.nom === 'object'))
  if (veutObjet && buckets.length && !objets.length) return { libellé: 'Ajouter « /* » (objets du bucket)', appliquer: pol => ({ ...pol, déclarations: pol.déclarations.map((x, j) => (j === d ? { ...x, ressources: { ...x.ressources, liste: [...x.ressources.liste, ...buckets.map(b => `${b}/*`)] } } : x)) }) }
  if (veutBucket && objets.length && !buckets.length) return { libellé: 'Ajouter l\'ARN du bucket', appliquer: pol => ({ ...pol, déclarations: pol.déclarations.map((x, j) => (j === d ? { ...x, ressources: { ...x.ressources, liste: [...new Set([...objets.map(o => o.replace(/^(arn:[^:]+:s3:::[^/]+)\/.*$/, '$1')), ...x.ressources.liste])] } } : x)) }) }
  return undefined
}

// Applique un correctif d'un constat à une politique normalisée (renvoie la nouvelle politique).
export const appliquerCorrectif = (politique, constat) => (constat.correctif ? constat.correctif.appliquer(politique) : politique)

export { lireIp }
