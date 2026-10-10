// Pages ouvertes récemment (sur cet appareil), pour « Reprendre » sur l'accueil.
const CLÉ = 'react-blocs-recents'
const MAX = 12

export function lireRécents() {
  try { return JSON.parse(localStorage.getItem(CLÉ)) || [] } catch { return [] }
}

export function enregistrerVisite(chemin) {
  if (!chemin || chemin === '/' || chemin === '/idrissi') return
  try {
    const liste = lireRécents().filter(r => r.chemin !== chemin)
    liste.unshift({ chemin, date: Date.now() })
    localStorage.setItem(CLÉ, JSON.stringify(liste.slice(0, MAX)))
  } catch { /* ignore */ }
}

// « il y a 5 min », « hier »…
export function depuis(date) {
  const min = Math.round((Date.now() - date) / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.round(h / 24)
  return j === 1 ? 'hier' : `il y a ${j} j`
}
