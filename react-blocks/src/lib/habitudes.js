// Habitudes : { habitudes: [{ id, nom, emoji, couleur, jours: [0-6] }],
//               coches: { 'AAAA-MM-JJ': { idHabitude: true } } }
// (un objet par jour plutôt qu'une liste : deux appareils qui cochent des
// habitudes différentes le même jour sont fusionnés sans perte.)

export const JOURS_COURTS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] // getDay() : 0 = dimanche
export const TOUS_LES_JOURS = [0, 1, 2, 3, 4, 5, 6]

export const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const dateDe = s => new Date(`${s}T12:00:00`)
export const décaler = (s, n) => { const d = dateDe(s); d.setDate(d.getDate() + n); return iso(d) }
export const aujourdhuiLocal = () => iso(new Date())

export function compléterHabitudes(o) {
  return {
    ...(o && typeof o === 'object' ? o : {}),
    habitudes: Array.isArray(o?.habitudes) ? o.habitudes : [],
    coches: o?.coches && typeof o.coches === 'object' && !Array.isArray(o.coches) ? o.coches : {},
  }
}

// Pas prévue avant le jour de sa création.
export const prévue = (h, jour) => (!h.créée || jour >= h.créée) && (h.jours?.length ? h.jours : TOUS_LES_JOURS).includes(dateDe(jour).getDay())
export const faite = (coches, h, jour) => !!coches?.[jour]?.[h.id]
export const actives = data => (data.habitudes || []).filter(h => !h.archivée)

// Série : jours prévus consécutifs cochés, en remontant depuis aujourd'hui
// (aujourd'hui pas encore coché ne casse pas la série).
export function série(h, coches, auj = aujourdhuiLocal()) {
  let n = 0
  let jour = auj
  if (prévue(h, jour) && !faite(coches, h, jour)) jour = décaler(jour, -1)
  for (let i = 0; i < 800; i++) {
    if (prévue(h, jour)) {
      if (!faite(coches, h, jour)) break
      n += 1
    }
    jour = décaler(jour, -1)
  }
  return n
}

export function meilleureSérie(h, coches) {
  const jours = Object.keys(coches || {}).filter(j => coches[j]?.[h.id]).sort()
  if (!jours.length) return 0
  let meilleure = 0
  let courante = 0
  let jour = jours[0]
  const fin = jours[jours.length - 1]
  while (jour <= fin) {
    if (prévue(h, jour)) {
      if (faite(coches, h, jour)) { courante += 1; meilleure = Math.max(meilleure, courante) } else courante = 0
    }
    jour = décaler(jour, 1)
  }
  return meilleure
}

// Bilan d'un jour : habitudes prévues et faites.
export function bilanJour(data, jour = aujourdhuiLocal()) {
  const prévues = actives(data).filter(h => prévue(h, jour))
  return { prévues, faites: prévues.filter(h => faite(data.coches, h, jour)) }
}
