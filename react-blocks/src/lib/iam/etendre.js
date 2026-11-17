// Développement des jokers d'actions (s3:Get* → les vraies actions), regroupement par niveau d'accès
// et résumé « qui peut quoi » d'une politique. S'appuie sur les services chargés dans le catalogue.
import { correspond, estJoker } from './glob.js'
import { NIVEAUX } from './donnees.js'

export const découperAction = s => {
  const i = s.indexOf(':')
  return i < 0 ? { service: s, nom: '' } : { service: s.slice(0, i), nom: s.slice(i + 1) }
}

// Préfixes de services visés par un motif d'action (« s3:Get* » → s3 ; « *:* » → tous ; « ec2*:* » → ec2…).
export function servicesVisés(cat, motif) {
  if (motif === '*') return cat.préfixes().map(s => s.p)
  const { service } = découperAction(motif)
  if (!estJoker(service)) return cat.existe(service) ? [cat.infoService(service).p] : []
  return cat.préfixes().filter(s => correspond(service, s.p, { insensible: true })).map(s => s.p)
}

// Un motif d'action → { motif, services, actions, tout, manquants, nombre }
//  · tout : « * » ou « *:* » (on ne développe pas les 22 000 actions, on compte seulement) ;
//  · manquants : services visés dont les données ne sont pas chargées ;
//  · nombre : nombre d'actions visées (exact si les services sont chargés, sinon d'après l'index).
export function étendreMotif(cat, motif) {
  const { service, nom } = découperAction(motif)
  const services = servicesVisés(cat, motif)
  const tout = motif === '*' || (service === '*' && (nom === '*' || nom === ''))
  const actions = []
  const manquants = []
  let nombre = 0
  for (const p of services) {
    const s = cat.service(p)
    if (!s) {
      manquants.push(p)
      if (tout || nom === '*' || nom === '') nombre += cat.infoService(p)?.a ?? 0
      continue
    }
    for (const a of s.actions) if (tout || motif === '*' || correspond(nom, a.nom, { insensible: true })) { actions.push(a); nombre++ }
  }
  return { motif, services, actions, tout, manquants, nombre }
}

// Une liste de motifs → actions uniques (par identifiant) et détail par motif.
export function étendreListe(cat, motifs) {
  const unique = new Map()
  const parMotif = motifs.map(m => {
    const e = étendreMotif(cat, m)
    for (const a of e.actions) unique.set(a.id, a)
    return e
  })
  return { actions: [...unique.values()], parMotif, tout: parMotif.some(e => e.tout) }
}

// Répartition par niveau d'accès : [{ niveau, nom, nombre, exemples }]
export function parNiveau(actions) {
  return NIVEAUX.map((n, i) => {
    const liste = actions.filter(a => a.niveau === i)
    return { niveau: i, nom: n, nombre: liste.length, exemples: liste.slice(0, 6).map(a => a.nom) }
  })
}

// Services à charger pour analyser une politique normalisée (préfixes d'actions, sans les joker totaux).
export function servicesÀCharger(cat, politique, { max = 12 } = {}) {
  const ensemble = new Set()
  for (const d of politique.déclarations) {
    for (const m of d.actions?.liste ?? []) {
      if (typeof m !== 'string' || m === '*') continue
      const v = servicesVisés(cat, m)
      if (v.length <= max) v.forEach(p => ensemble.add(p))
    }
  }
  return [...ensemble]
}

// Résumé d'accès : pour chaque déclaration, ce qu'elle autorise/interdit, par service.
// Renvoie [{ indice, sid, effet, inverse, services: [{ service, nom, niveaux: [...], total }], tout, nombre, sansDonnées }]
export function résumerAccès(cat, politique) {
  return politique.déclarations.map((d, indice) => {
    const motifs = d.actions?.liste ?? []
    const inverse = !!d.actions?.inverse
    const e = étendreListe(cat, motifs.filter(m => typeof m === 'string'))
    const parService = new Map()
    for (const a of e.actions) {
      if (!parService.has(a.service)) parService.set(a.service, [])
      parService.get(a.service).push(a)
    }
    const services = [...parService].map(([service, actions]) => ({ service, nom: cat.infoService(service)?.n ?? service, niveaux: parNiveau(actions), total: actions.length }))
    const nombre = e.tout ? cat.nombreActionsTotal() : e.parMotif.reduce((s, x) => s + x.nombre, 0)
    return { indice, sid: d.sid, effet: d.effet, inverse, services, tout: e.tout, nombre, sansDonnées: [...new Set(e.parMotif.flatMap(x => x.manquants))] }
  })
}
