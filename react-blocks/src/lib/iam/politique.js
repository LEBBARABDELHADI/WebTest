// Politique IAM : lecture du JSON (avec positions et clés dupliquées), modèle normalisé,
// sérialisation canonique, taille et limites, types de politique.
import { analyserJson, positionTexte } from '../querygen/json.js'

export const VERSION_COURANTE = '2012-10-17'

// Types de politique : ce qui est permis ou interdit dans chaque déclaration.
export const TYPES = {
  identite: { nom: 'Identité (utilisateur, groupe ou rôle)', court: 'Identité', principal: 'interdit', ressource: 'requise', aide: 'Attachée à un utilisateur, un groupe ou un rôle IAM : dit ce que cette identité peut faire.' },
  ressource: { nom: 'Ressource (bucket S3, file SQS, clé KMS…)', court: 'Ressource', principal: 'requis', ressource: 'requise', aide: 'Attachée à une ressource : dit QUI (Principal) peut faire quoi dessus.' },
  approbation: { nom: 'Approbation de rôle (trust policy)', court: 'Approbation', principal: 'requis', ressource: 'interdite', aide: 'Attachée à un rôle : dit qui peut l\'assumer (sts:AssumeRole…).' },
  plafond: { nom: 'Permissions boundary (plafond)', court: 'Plafond', principal: 'interdit', ressource: 'requise', aide: 'Limite maximale des permissions qu\'une identité peut obtenir ; n\'accorde rien seule.' },
  scp: { nom: 'SCP (AWS Organizations)', court: 'SCP', principal: 'interdit', ressource: 'requise', aide: 'Garde-fou appliqué à des comptes d\'une organisation ; n\'accorde rien seul.' },
}

// Limites de taille (caractères, espaces exclus) par destination.
export const LIMITES = {
  identite: [['politique gérée', 6144], ['en ligne, rôle', 10240], ['en ligne, groupe', 5120], ['en ligne, utilisateur', 2048]],
  plafond: [['plafond de permissions', 6144]],
  approbation: [['approbation de rôle', 2048]],
  scp: [['SCP', 5120]],
  ressource: [['politique de bucket S3', 20480], ['clé KMS', 32768], ['topic SNS', 30720], ['file SQS', 8192], ['secret', 20480], ['dépôt ECR', 10240]],
}

export const ÉLÉMENTS_RACINE = ['Version', 'Id', 'Statement']
export const ÉLÉMENTS_DÉCLARATION = ['Sid', 'Effect', 'Principal', 'NotPrincipal', 'Action', 'NotAction', 'Resource', 'NotResource', 'Condition']

// ---- Lecture avec positions ----------------------------------------------------------------------

// Parcours minimal d'un JSON DÉJÀ valide : positions de chaque valeur (clé de chemin = JSON d'un
// tableau) et clés dupliquées dans un même objet (JSON.parse garde silencieusement la dernière).
function parcourir(texte) {
  const positions = new Map()
  const doublons = []
  let i = 0
  const espaces = () => { while (i < texte.length && /\s/.test(texte[i])) i++ }
  const chaîne = () => {
    const d = i
    i++
    while (texte[i] !== '"') i += texte[i] === '\\' ? 2 : 1
    i++
    return JSON.parse(texte.slice(d, i))
  }
  const valeur = chemin => {
    espaces()
    positions.set(JSON.stringify(chemin), { d: i })
    const c = texte[i]
    if (c === '{') {
      i++
      const vus = new Set()
      espaces()
      if (texte[i] === '}') { i++; return }
      for (;;) {
        espaces()
        const dClé = i
        const k = chaîne()
        if (vus.has(k)) doublons.push({ chemin, clé: k, d: dClé })
        vus.add(k)
        positions.set(JSON.stringify([...chemin, k, '#clé']), { d: dClé })
        espaces()
        i++ // :
        valeur([...chemin, k])
        espaces()
        if (texte[i] === ',') { i++; continue }
        i++ // }
        return
      }
    } else if (c === '[') {
      i++
      espaces()
      if (texte[i] === ']') { i++; return }
      for (let k = 0; ; k++) {
        valeur([...chemin, k])
        espaces()
        if (texte[i] === ',') { i++; continue }
        i++ // ]
        return
      }
    } else if (c === '"') chaîne()
    else { while (i < texte.length && !/[\s,\]}]/.test(texte[i])) i++ }
  }
  valeur([])
  return { positions, doublons }
}

// Résultat : { ok, doc, positions, doublons } ou { ok:false, erreur:{message, ligne, colonne, position} }.
export function lirePolitique(texte) {
  const a = analyserJson(texte)
  if (!a.ok) return { ok: false, erreur: a.erreur, vide: !!a.vide, multiple: !!a.multiple }
  const { positions, doublons } = parcourir(texte)
  const avecLigne = d => ({ ...d, ...positionTexte(texte, d.d) })
  return {
    ok: true,
    doc: a.valeur,
    positions,
    doublons: doublons.map(x => ({ ...x, ...positionTexte(texte, x.d) })),
    où: (chemin, clé = false) => {
      const p = positions.get(JSON.stringify(clé ? [...chemin, '#clé'] : chemin))
      return p ? avecLigne(p) : null
    },
  }
}

// ---- Modèle normalisé ------------------------------------------------------------------------------

const tableau = v => (v === undefined || v === null ? null : Array.isArray(v) ? v : [v])
const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v)

function normaliserPrincipal(v) {
  if (v === undefined) return null
  if (v === '*') return '*'
  if (!estObjet(v)) return null
  const sortie = {}
  for (const [k, x] of Object.entries(v)) sortie[k] = (tableau(x) ?? []).map(String)
  return sortie
}

// Déclaration brute → déclaration normalisée (tolérante : ignore ce qui n'est pas représentable).
export function normaliserDéclaration(d) {
  if (!estObjet(d)) return null
  const dual = (a, n) => {
    if (d[a] !== undefined) return { inverse: false, liste: (tableau(d[a]) ?? []).map(String) }
    if (d[n] !== undefined) return { inverse: true, liste: (tableau(d[n]) ?? []).map(String) }
    return null
  }
  let principal = null
  if (d.Principal !== undefined) principal = { inverse: false, valeurs: normaliserPrincipal(d.Principal) }
  else if (d.NotPrincipal !== undefined) principal = { inverse: true, valeurs: normaliserPrincipal(d.NotPrincipal) }
  const conditions = []
  if (estObjet(d.Condition)) {
    for (const [opérateur, clés] of Object.entries(d.Condition)) {
      if (!estObjet(clés)) continue
      for (const [clé, v] of Object.entries(clés)) conditions.push({ opérateur, clé, valeurs: tableau(v) ?? [] })
    }
  }
  return {
    sid: typeof d.Sid === 'string' ? d.Sid : undefined,
    effet: d.Effect,
    principal: principal?.valeurs === null ? null : principal,
    actions: dual('Action', 'NotAction'),
    ressources: dual('Resource', 'NotResource'),
    conditions,
  }
}

export function normaliser(doc) {
  if (!estObjet(doc)) return { version: undefined, id: undefined, déclarations: [] }
  const s = doc.Statement
  const liste = Array.isArray(s) ? s : estObjet(s) ? [s] : []
  return {
    version: typeof doc.Version === 'string' ? doc.Version : undefined,
    id: typeof doc.Id === 'string' ? doc.Id : undefined,
    déclarations: liste.map(normaliserDéclaration).filter(Boolean),
  }
}

// ---- Sérialisation canonique ------------------------------------------------------------------------

const un = (liste, simplifier) => (simplifier && liste.length === 1 ? liste[0] : liste)

function principalVersDoc(p, simplifier) {
  if (p === '*') return '*'
  const sortie = {}
  for (const [k, v] of Object.entries(p)) sortie[k] = un(v, simplifier)
  return sortie
}

export function déclarationVersDoc(d, { simplifier = true } = {}) {
  const sortie = {}
  if (d.sid) sortie.Sid = d.sid
  if (d.effet !== undefined) sortie.Effect = d.effet
  if (d.principal) sortie[d.principal.inverse ? 'NotPrincipal' : 'Principal'] = principalVersDoc(d.principal.valeurs, simplifier)
  if (d.actions) sortie[d.actions.inverse ? 'NotAction' : 'Action'] = un(d.actions.liste, simplifier)
  if (d.ressources) sortie[d.ressources.inverse ? 'NotResource' : 'Resource'] = un(d.ressources.liste, simplifier)
  if (d.conditions?.length) {
    const c = {}
    for (const { opérateur, clé, valeurs } of d.conditions) {
      c[opérateur] ??= {}
      c[opérateur][clé] = un(valeurs, simplifier)
    }
    sortie.Condition = c
  }
  return sortie
}

export function versDoc(p, options = {}) {
  const doc = {}
  if (p.version !== undefined) doc.Version = p.version
  if (p.id) doc.Id = p.id
  doc.Statement = p.déclarations.map(d => déclarationVersDoc(d, options))
  return doc
}

export const sérialiser = (p, options = {}) => JSON.stringify(versDoc(p, options), null, options.indentation ?? 2)

// ---- Taille ------------------------------------------------------------------------------------------

// Taille comptée par IAM : caractères du document, espaces blancs hors chaînes exclus.
export const tailleDoc = doc => JSON.stringify(doc).length

export function limitesPour(type, taille) {
  return (LIMITES[type] ?? []).map(([nom, max]) => ({ nom, max, ok: taille <= max }))
}

// ---- Fabriques ----------------------------------------------------------------------------------------

export const déclarationVide = (type = 'identite') => ({
  sid: undefined,
  effet: 'Allow',
  principal: TYPES[type]?.principal === 'requis' ? { inverse: false, valeurs: type === 'approbation' ? { Service: ['ec2.amazonaws.com'] } : { AWS: [] } } : null,
  actions: { inverse: false, liste: type === 'approbation' ? ['sts:AssumeRole'] : [] },
  ressources: TYPES[type]?.ressource === 'interdite' ? null : { inverse: false, liste: ['*'] },
  conditions: [],
})

export const politiqueVide = (type = 'identite') => ({ version: VERSION_COURANTE, id: undefined, déclarations: [déclarationVide(type)] })

// Valeur de condition → texte (les booléens et nombres JSON sont acceptés par IAM).
export const texteValeur = v => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v))
