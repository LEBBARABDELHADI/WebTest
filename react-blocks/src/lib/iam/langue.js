// Lecture d'une description en français ou en anglais : jetons, repérage du vocabulaire
// (services, ressources nommées, intentions, verbes), conditions, principaux, messages
// « AccessDenied » collés depuis la console ou la CLI. Rien n'est deviné : ce qui n'est pas
// reconnu est rendu tel quel pour être signalé.
import { sansAccents } from './texte.js'
import { SERVICES, NOMS_RESSOURCE, INTENTIONS, VERBES_SERVICE, STOP_NOMS, PRINCIPAUX_SERVICE } from './lexique.js'

export const norm = s => sansAccents(String(s).toLowerCase())

// Jetons : { brut, n, i, cité } — l'apostrophe sépare (d'attente), les guillemets ouvrent un jeton cité.
export function jeter(texte) {
  const jetons = []
  const re = /«([^»]*)»|"([^"]*)"|“([^”]*)”|'([^']{2,})'(?=[\s,.;:)]|$)|([^\s,;'’()«»"“”]+)/g
  let m
  while ((m = re.exec(texte))) {
    const cité = m[1] ?? m[2] ?? m[3] ?? m[4]
    let brut = cité ?? m[5]
    if (cité === undefined) brut = brut.replace(/[.:!?]+$/, '').replace(/^[.:]+/, '')
    if (!brut) continue
    jetons.push({ brut, n: norm(brut), i: jetons.length, cité: cité !== undefined, début: m.index, fin: m.index + m[0].length })
  }
  return jetons
}

// Index des phrases du lexique : phrase (normalisée, en mots) → { type, id }.
const mots = p => norm(p).replace(/[^a-z0-9*/:.=_@-]+/g, ' ').trim().split(' ')
const INDEX = new Map()
const ajouter = (phrase, entrée) => { const k = mots(phrase).join(' '); if (!INDEX.has(k)) INDEX.set(k, []); INDEX.get(k).push(entrée) }
for (const [p, ms] of Object.entries(SERVICES)) for (const m of ms) ajouter(m, { type: 'service', id: p })
NOMS_RESSOURCE.forEach((n, idx) => { for (const m of n.mots) ajouter(m, { type: 'nom', id: idx }) })
// Verbes : une entrée par expression, avec l'intention générique éventuelle (lecture, suppression…).
const VERBES = new Map()
INTENTIONS.forEach(it => { for (const m of it.mots) VERBES.set(mots(m).join(' '), { intention: it.id }) })
for (const verbes of Object.values(VERBES_SERVICE)) for (const m of Object.keys(verbes)) { const k = mots(m).join(' '); if (!VERBES.has(k)) VERBES.set(k, {}) }
for (const [phrase, v] of VERBES) ajouter(phrase, { type: 'verbe', id: phrase, intention: v.intention })
for (const m of Object.keys(PRINCIPAUX_SERVICE)) ajouter(m, { type: 'principalService', id: m })
const LONGUEUR_MAX = Math.max(...[...INDEX.keys()].map(k => k.split(' ').length))

// Formes de base possibles d'un verbe anglais conjugué (-ing, -s, -ed).
function basesAnglaises(mot) {
  const bases = []
  const ajouterBase = b => { if (b.length >= 3) bases.push(b) }
  if (/ing$/.test(mot)) { const r = mot.slice(0, -3); ajouterBase(r); ajouterBase(`${r}e`); if (/(.)\1$/.test(r)) ajouterBase(r.slice(0, -1)) }
  if (/ed$/.test(mot)) { const r = mot.slice(0, -2); ajouterBase(r); ajouterBase(`${r}e`); ajouterBase(mot.slice(0, -1)) }
  if (/s$/.test(mot) && !/ss$/.test(mot)) ajouterBase(mot.slice(0, -1))
  return bases
}

// Repère les expressions du lexique, la plus longue d'abord. → annotations { type, id, i, k, phrase }
export function repérer(jetons) {
  const notes = []
  let i = 0
  while (i < jetons.length) {
    let trouvé = null
    for (let k = Math.min(LONGUEUR_MAX, jetons.length - i); k >= 1; k--) {
      const phrase = jetons.slice(i, i + k).map(j => j.n).join(' ')
      if (jetons.slice(i, i + k).some(j => j.cité)) continue
      const e = INDEX.get(phrase)
      if (e) { trouvé = { e, k, phrase }; break }
    }
    // Formes anglaises : « starting » → start, « reading » → read, « writes » → write (verbes seulement).
    if (!trouvé && !jetons[i].cité) {
      for (const base of basesAnglaises(jetons[i].n)) {
        const e = INDEX.get(base)?.filter(x => x.type === 'verbe')
        if (e?.length) { trouvé = { e, k: 1, phrase: base }; break }
      }
    }
    if (trouvé) {
      for (const e of trouvé.e) notes.push({ ...e, i, k: trouvé.k, phrase: trouvé.phrase })
      i += trouvé.k
    } else i++
  }
  return notes
}

export const ESTUN_NOM_PLAUSIBLE = j => !j.cité ? /^[A-Za-z0-9_./:*@=+-]*[A-Za-z0-9_*][A-Za-z0-9_./:*@=+-]*$/.test(j.brut) : true

// Nom de ressource qui suit un nom commun (« bucket mon-bucket », « table "Users" », « fonction nommée getUser »).
export function nomAprès(jetons, fin, notes, service = null) {
  let k = fin
  const pris = new Set()
  for (const n of notes) for (let x = n.i; x < n.i + n.k; x++) pris.add(x)
  // « table DynamoDB users », « bucket S3 mon-bucket » : le nom du service entre le nom commun et le nom propre est sauté.
  while (jetons[k] && service && notes.some(n => n.type === 'service' && n.id === service && n.i === k)) k++
  // Un seul mot de liaison toléré (nommé, appelé, named, called) ; les articles interrompent la recherche.
  if (jetons[k] && ['nomme', 'nommee', 'appele', 'appelee', 'named', 'called', 'id', 'identifie'].includes(jetons[k].n)) k++
  const j = jetons[k]
  if (!j) return null
  if (!j.cité && (STOP_NOMS.has(j.n) || pris.has(k))) return null
  if (!ESTUN_NOM_PLAUSIBLE(j)) return null
  return { nom: j.brut, i: k }
}

// ---- Éléments structurés (adresses, régions, comptes…) ---------------------------------------------------

export const RE = {
  arn: /arn:[a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]*:[0-9*]*:[^\s,;"'«»]+/gi,
  action: /\b([a-z][a-z0-9-]*):([A-Za-z*?][A-Za-z0-9*?]*)\b/g,
  ip: /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g,
  ipv6: /\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{0,4}(?:\/\d{1,3})?\b/gi,
  région: /\b(?:us|eu|ap|sa|ca|me|af|il|mx)(?:-[a-z]+)+-\d\b/g,
  compte: /(?<![\d-])\d{12}(?![\d-])/g,
  org: /\bo-[a-z0-9]{10,32}\b/g,
  vpce: /\bvpce-[0-9a-f]+\b/g,
  vpc: /\bvpc-[0-9a-f]+\b/g,
  date: /\b\d{4}-\d{2}-\d{2}(?:T[\d:]+Z?)?\b/g,
  tag: /(?:tag(?:s|u[eé]e?s?|ged)?|[eé]tiquet(?:te|t[eé]e?s?)s?|label(?:s|l?ed)?)\s+(?:["«']?)([A-Za-z0-9_.:/+@-]+)(?:["»']?)\s*(?:=|:|vaut|egal|est)\s*(?:["«']?)([A-Za-z0-9_.:/+@*-]+)/gi,
}
export const trouverTous = (re, texte) => [...texte.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`))].map(m => m[0])

// ---- Messages d'erreur AccessDenied ----------------------------------------------------------------------------

// « User: arn:… is not authorized to perform: s3:GetObject on resource: arn:… because no identity-based policy allows… »
export function lireAccessDenied(texte) {
  const trouvés = []
  const re = /(?:User|Role|Principal|Identity)\s*:\s*(arn:\S+)\s+is not authorized to perform:?\s+([a-z0-9-]+:[A-Za-z0-9*]+)(?:\s+on resource:?\s+"?(arn:[^\s"]+|\*)"?)?([^\n]*)/gi
  for (const m of texte.matchAll(re)) {
    const reste = m[4] ?? ''
    let cause = 'inconnue'
    if (/no identity-based policy allows/i.test(reste)) cause = 'identité'
    else if (/no resource-based policy allows/i.test(reste)) cause = 'ressource'
    else if (/explicit deny in a service control policy/i.test(reste)) cause = 'scp'
    else if (/explicit deny in a resource control policy/i.test(reste)) cause = 'rcp'
    else if (/explicit deny in a permissions boundary/i.test(reste)) cause = 'plafond'
    else if (/no permissions boundary allows/i.test(reste)) cause = 'plafond'
    else if (/explicit deny in an identity-based policy/i.test(reste)) cause = 'refus-identité'
    else if (/explicit deny in a resource-based policy/i.test(reste)) cause = 'refus-ressource'
    else if (/session policy/i.test(reste)) cause = 'session'
    trouvés.push({ principal: m[1].replace(/[.,]$/, ''), action: m[2], ressource: m[3]?.replace(/[.,]$/, '') ?? null, cause })
  }
  return trouvés
}
