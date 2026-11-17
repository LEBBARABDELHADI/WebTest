// Signaux de sécurité d'une politique IAM : accès administrateur, escalade de privilèges, ressources
// trop larges, principaux publics, relations d'approbation OIDC/SAML sans restriction, « confused deputy ».
// Ce sont des avertissements argumentés, pas une preuve : le contexte métier peut les justifier.
import { correspond } from './glob.js'
import { ACTIONS_À_RISQUE, CLÉS_RESTRICTIVES_PRINCIPAL } from './globales.js'
import { enTexte } from './conditions.js'

const SERVICES_SENSIBLES = ['iam', 'organizations', 'sts', 'kms', 'secretsmanager', 'ssm', 'cloudtrail', 'config', 'guardduty', 'account']
const clésDe = norm => norm.conditions.map(c => c.clé.toLowerCase())
const aClé = (norm, re) => clésDe(norm).some(k => re.test(k))

export function analyserSécurité({ entrées, type, cat, ajouter, cheminD }) {
  for (const { norm, i } of entrées) {
    const d = i
    const n = i + 1
    const chemin = cheminD(i)
    const allow = norm.effet === 'Allow'
    const deny = norm.effet === 'Deny'
    const actions = norm.actions?.liste ?? []
    const inverse = !!norm.actions?.inverse
    const ressources = norm.ressources?.liste ?? []
    const toutesRessources = !!norm.ressources && !norm.ressources.inverse && ressources.some(r => r === '*')
    const sansCondition = norm.conditions.length === 0
    const toutesActions = !inverse && actions.some(a => a === '*' || a === '*:*')

    if (allow && inverse) ajouter('NOTACTION_ALLOW', 'sécurité', `Déclaration ${n} : Allow + NotAction autorise TOUT SAUF ${actions.length > 3 ? `${actions.slice(0, 3).join(', ')}… (${actions.length} actions)` : actions.join(', ')}, y compris les actions que AWS ajoutera plus tard. Listez plutôt ce qui est permis.`, { déclaration: d, chemin: cheminD(i, 'NotAction') })
    if (allow && norm.ressources?.inverse) ajouter('NOTRESOURCE_ALLOW', 'avertissement', `Déclaration ${n} : Allow + NotResource autorise l'action sur toutes les ressources SAUF celles listées, y compris les futures.`, { déclaration: d, chemin: cheminD(i, 'NotResource') })

    // Administrateur complet.
    if (allow && toutesActions && toutesRessources && !inverse && type !== 'approbation' && type !== 'ressource') {
      if (sansCondition) ajouter('ADMIN_COMPLET', 'sécurité', `Déclaration ${n} : « Action * sur Resource * » = accès administrateur complet (équivalent à AdministratorAccess). Restreignez les actions et les ressources.`, { déclaration: d, chemin })
      else ajouter('ADMIN_CONDITIONNÉ', 'avertissement', `Déclaration ${n} : toutes les actions sur toutes les ressources, limitées seulement par des conditions : vérifiez qu'elles suffisent.`, { déclaration: d, chemin })
    } else if (allow && toutesActions && !toutesRessources && type !== 'approbation') {
      ajouter('ACTION_TOUT', 'avertissement', `Déclaration ${n} : toutes les actions (*) sur ces ressources, y compris la suppression et la gestion des permissions. Listez les actions nécessaires.`, { déclaration: d, chemin: cheminD(i, 'Action') })
    }

    // Service entier sur toutes les ressources.
    if (allow && !inverse && type !== 'approbation') {
      for (const a of actions) {
        const m = /^([a-z0-9-]+):\*$/i.exec(a)
        if (!m) continue
        const sensible = SERVICES_SENSIBLES.includes(m[1].toLowerCase())
        if (toutesRessources && sensible) ajouter('SERVICE_SENSIBLE_TOUT', 'sécurité', `Déclaration ${n} : « ${a} » sur toutes les ressources donne le contrôle complet de ${m[1]} (service sensible : identités, secrets, clés, audit).`, { déclaration: d, chemin: cheminD(i, 'Action') })
        else if (toutesRessources) ajouter('SERVICE_ENTIER', 'avertissement', `Déclaration ${n} : « ${a} » sur toutes les ressources : toutes les opérations du service, suppression comprise. Préférez les actions nécessaires et des ARN précis.`, { déclaration: d, chemin: cheminD(i, 'Action') })
      }
    }

    // Actions à risque (escalade, données, destruction, furtivité), déduites par correspondance de motifs.
    if (allow && !inverse && type !== 'approbation' && type !== 'ressource') {
      const touchées = Object.entries(ACTIONS_À_RISQUE).filter(([k]) => actions.some(a => correspond(a, k, { insensible: true })))
      const parType = {}
      for (const [k, v] of touchées) (parType[v.type] ??= []).push([k, v])
      const sur = toutesRessources || (!!norm.ressources && norm.ressources.inverse)
      for (const [t, liste] of Object.entries(parType)) {
        if (!sur) continue
        // iam:PassRole borné par iam:PassedToService : risque acceptable.
        const utiles = liste.filter(([k]) => !(k === 'iam:passrole' && aClé(norm, /^iam:passedtoservice$/)))
        if (!utiles.length) continue
        const noms = utiles.slice(0, 4).map(([, v]) => v.nom).join(', ')
        const mots = { escalade: 'd\'escalade de privilèges', données: 'de lecture de données sensibles', destruction: 'de destruction de ressources', furtivité: 'de suppression de traces ou de désactivation de la détection' }[t]
        const niveau = t === 'escalade' && sansCondition ? 'sécurité' : 'avertissement'
        const détail = utiles.length === 1 ? ` : ${utiles[0][1].pourquoi}` : ` (${utiles.length} actions)`
        ajouter(`RISQUE_${t.toUpperCase()}`, niveau, `Déclaration ${n} : risque ${mots} — ${noms}${détail}. La ressource « * » rend l'action applicable à tout le compte.${sansCondition ? '' : ' Des conditions existent : vérifiez qu\'elles suffisent.'}`, { déclaration: d, chemin: cheminD(i, 'Action') })
      }
    }

    // Ressource « * » alors que des ARN précis sont possibles (nécessite les données).
    if (allow && !inverse && toutesRessources && cat && type !== 'approbation' && !toutesActions && !actions.some(a => /^[a-z0-9-]+:\*$/i.test(a))) {
      const trouvées = []
      for (const a of actions) {
        const [svc] = a.split(':')
        if (/[*?]/.test(svc) || !cat.chargé(svc)) continue
        for (const act of cat.service(svc).actions) {
          if (act.niveau >= 2 && act.ressources.some(r => r.modèle) && correspond(a, act.id, { insensible: true })) trouvées.push(act)
        }
      }
      if (trouvées.length) {
        const ex = trouvées[0]
        const modèle = [...ex.ressources.filter(r => r.modèle)].sort((x, y) => (x.modèle.match(/\$\{/g) ?? []).length - (y.modèle.match(/\$\{/g) ?? []).length)[0].modèle
        ajouter('RESSOURCE_TROP_LARGE', 'suggestion', `Déclaration ${n} : Resource « * » alors que ${trouvées.length > 1 ? `${trouvées.length} actions d'écriture acceptent` : `${ex.id} accepte`} des ressources précises (ex. ${modèle.replace('${Partition}', 'aws')}). Restreindre limite les dégâts d'une erreur ou d'une fuite d'identifiants.`, { déclaration: d, chemin: cheminD(i, 'Resource') })
      }
    }

    // Cas où une politique d'identité ne suffit pas : KMS (politique de clé) et sts:AssumeRole (politique d'approbation).
    if (allow && !inverse && (type === 'identite' || type === 'plafond') && actions.some(a => correspond(a, 'kms:Decrypt', { insensible: true }) || correspond(a, 'kms:Encrypt', { insensible: true }))) {
      ajouter('KMS_POLITIQUE_DE_CLÉ', 'info', `Déclaration ${n} : KMS exige AUSSI l'accord de la politique de la clé (ou une clé qui délègue l'accès à IAM via le compte racine) : cette politique d'identité ne suffit pas seule.`, { déclaration: d, chemin: cheminD(i, 'Action') })
    }
    if (allow && !inverse && (type === 'identite' || type === 'plafond') && actions.some(a => correspond(a, 'sts:AssumeRole', { insensible: true }))) {
      ajouter('ASSUME_APPROBATION', 'info', `Déclaration ${n} : sts:AssumeRole exige AUSSI que la politique d'approbation du rôle visé accepte ce principal.`, { déclaration: d, chemin: cheminD(i, 'Action') })
    }

    // Deny qui verrouille tout.
    if (deny && sansCondition && (toutesActions || inverse) && toutesRessources && type !== 'ressource') {
      ajouter('DENY_TOTAL', 'avertissement', `Déclaration ${n} : ${inverse ? `un Deny NotAction (tout sauf ${actions.slice(0, 3).join(', ')}${actions.length > 3 ? '…' : ''})` : 'un Deny de toutes les actions'} sans condition verrouille entièrement l'identité : aucun Allow ne pourra jamais contourner un Deny.`, { déclaration: d, chemin })
    }

    // Principal public.
    const pr = norm.principal
    const publique = pr && !pr.inverse && (pr.valeurs === '*' || (pr.valeurs?.AWS ?? []).includes('*'))
    if (allow && publique && (type === 'ressource' || type === 'approbation')) {
      const restrictive = clésDe(norm).some(k => CLÉS_RESTRICTIVES_PRINCIPAL.some(r => k === r || k.startsWith(`${r}/`)))
      if (type === 'approbation') ajouter('APPROBATION_PUBLIQUE', restrictive ? 'avertissement' : 'sécurité', `Déclaration ${n} : Principal « * » dans une politique d'approbation${restrictive ? ' limité par des conditions : vérifiez-les attentivement' : ' : n\'importe quel principal AWS de n\'importe quel compte pourrait assumer ce rôle'}.`, { déclaration: d, chemin: cheminD(i, 'Principal') })
      else ajouter('PRINCIPAL_PUBLIC', restrictive ? 'avertissement' : 'sécurité', `Déclaration ${n} : Principal « * » ${restrictive ? 'limité par des conditions (' + [...new Set(clésDe(norm))].join(', ') + ') : vérifiez qu\'elles suffisent' : ': la ressource est accessible à tout le monde, y compris sans compte AWS'}.`, { déclaration: d, chemin: cheminD(i, 'Principal') })
    }

    // Approbation : fédération, comptes, cohérence des actions.
    if (type === 'approbation' && pr && !pr.inverse && pr.valeurs !== '*') {
      const fédérés = pr.valeurs.Federated ?? []
      const aws = pr.valeurs.AWS ?? []
      const actionsSts = actions.map(a => a.toLowerCase())
      for (const f of fédérés) {
        const oidc = /oidc-provider\/(.+)$/.exec(f)
        if (oidc) {
          const hôte = oidc[1].toLowerCase()
          const sub = norm.conditions.filter(c => c.clé.toLowerCase() === `${hôte}:sub`)
          const aud = norm.conditions.filter(c => ['aud', 'oaud'].some(x => c.clé.toLowerCase() === `${hôte}:${x}`))
          if (!sub.length) ajouter('OIDC_SANS_SUB', 'sécurité', `Déclaration ${n} : aucune condition sur « ${hôte}:sub » — n'importe quel jeton émis par ce fournisseur (tout dépôt, tout projet, tout compte) pourrait assumer ce rôle. Limitez le sujet (sub).`, { déclaration: d, chemin: cheminD(i, 'Condition') })
          else {
            const trop = sub.some(c => c.valeurs.some(v => /^(\*|repo:\*|project_path:\*|system:serviceaccount:\*|\*:\*)$/.test(enTexte(v))))
            if (trop) ajouter('OIDC_SUB_LARGE', 'sécurité', `Déclaration ${n} : la condition sur « ${hôte}:sub » accepte n'importe quel sujet.`, { déclaration: d, chemin: cheminD(i, 'Condition') })
          }
          if (!aud.length) ajouter('OIDC_SANS_AUD', 'avertissement', `Déclaration ${n} : aucune condition sur « ${hôte}:aud » (public visé du jeton) : ajoutez-la (ex. sts.amazonaws.com).`, { déclaration: d, chemin: cheminD(i, 'Condition') })
        } else if (/saml-provider\//.test(f)) {
          if (!aClé(norm, /^saml:aud$/)) ajouter('SAML_SANS_AUD', 'avertissement', `Déclaration ${n} : aucune condition SAML:aud (https://signin.aws.amazon.com/saml).`, { déclaration: d, chemin: cheminD(i, 'Condition') })
        }
        if (allow && actionsSts.length && !actionsSts.some(a => /assumerolewith|^sts:\*$|^\*$/.test(a))) ajouter('FÉDÉRÉ_ACTION', 'avertissement', `Déclaration ${n} : un principal Federated exige sts:AssumeRoleWithWebIdentity (OIDC, Cognito) ou sts:AssumeRoleWithSAML, pas sts:AssumeRole.`, { déclaration: d, chemin: cheminD(i, 'Action') })
      }
      if (!fédérés.length && actionsSts.some(a => /assumerolewith(webidentity|saml)/.test(a))) ajouter('ACTION_FÉDÉRÉE_SANS_FÉDÉRÉ', 'avertissement', `Déclaration ${n} : sts:AssumeRoleWith… s'utilise avec un principal Federated (fournisseur OIDC ou SAML).`, { déclaration: d, chemin: cheminD(i, 'Action') })
      for (const e of aws) {
        if (/^arn:[^:]+:iam::\d{12}:root$/.test(e) || /^\d{12}$/.test(e)) {
          ajouter('APPROBATION_COMPTE', 'info', `Déclaration ${n} : le compte ${e.replace(/^arn:[^:]+:iam::|:root$/g, '')} entier est approuvé : tout principal de ce compte qui possède sts:AssumeRole pour ce rôle pourra l'assumer.${aClé(norm, /^sts:externalid$/) ? '' : ' Pour un compte tiers, ajoutez la condition sts:ExternalId.'}`, { déclaration: d, chemin: cheminD(i, 'Principal') })
        }
      }
      for (const a of actions) if (!/^sts:|^\*$/i.test(a)) { ajouter('APPROBATION_ACTION', 'avertissement', `Déclaration ${n} : « ${a} » n'a pas de sens dans une politique d'approbation (actions sts:AssumeRole, AssumeRoleWithWebIdentity, AssumeRoleWithSAML, TagSession, SetSourceIdentity).`, { déclaration: d, chemin: cheminD(i, 'Action') }); break }
    }

    // « Confused deputy » : un service AWS autorisé sans restriction sur l'origine de l'appel.
    if (type === 'ressource' && allow && pr && !pr.inverse && pr.valeurs !== '*' && (pr.valeurs.Service ?? []).length) {
      if (!aClé(norm, /^aws:(sourcearn|sourceaccount|sourceowner|sourceorgid|resourceaccount|sourceorgpaths)$/)) ajouter('CONFUSED_DEPUTY', 'avertissement', `Déclaration ${n} : le service ${pr.valeurs.Service.join(', ')} est autorisé sans condition aws:SourceArn ou aws:SourceAccount : un autre client AWS pourrait lui faire utiliser cette autorisation (« confused deputy »).`, { déclaration: d, chemin: cheminD(i, 'Principal') })
    }
  }
}
