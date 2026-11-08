// Réponse à une carte de Mémoriser (révision espacée + carnet d'erreurs) et
// journal des révisions par jour. Partagé par Mémoriser et « Ma journée ».
import { avancerCarnet } from './certifications'

export const INTERVALLES = [0, 1, 3, 7, 14, 30, 90]

export const aujourdhuiISO = () => new Date().toISOString().slice(0, 10)
export function dateDans(jours) {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

// su : true (je savais), false (je ne savais pas) ou 'hésité'.
export function répondreCarte(carte, su) {
  const c = avancerCarnet(carte, su)
  if (su === 'hésité') {
    const niveau = Math.max(1, c.niveau || 0)
    return { ...c, niveau, prochaineRevision: dateDans(Math.max(1, Math.round(INTERVALLES[niveau] / 2))), fautesConsécutives: 0 }
  }
  const niveau = su ? Math.min((c.niveau || 0) + 1, INTERVALLES.length - 1) : 0
  return { ...c, niveau, prochaineRevision: dateDans(INTERVALLES[niveau]), fautesConsécutives: su ? 0 : (c.fautesConsécutives || 0) + 1 }
}

// Journal : { 'AAAA-MM-JJ': { vues, sues } }, gardé sur 400 jours.
export function noterActivité(activité, su, jour = jourLocal()) {
  const a = { ...(activité && typeof activité === 'object' ? activité : {}) }
  const j = a[jour] || { vues: 0, sues: 0 }
  a[jour] = { vues: j.vues + 1, sues: j.sues + (su === true ? 1 : 0) }
  const jours = Object.keys(a).sort()
  jours.slice(0, Math.max(0, jours.length - 400)).forEach(k => delete a[k])
  return a
}

export const jourLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Une réponse appliquée aux données d'un espace de Mémoriser.
export const appliquerRéponse = (d, carteId, su) => ({
  ...d,
  cartes: (d.cartes || []).map(c => (c.id === carteId ? répondreCarte(c, su) : c)),
  activité: noterActivité(d.activité, su),
})
