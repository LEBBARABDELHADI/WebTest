// Petits utilitaires de texte : distance d'édition et suggestions (« vouliez-vous dire … ? »).

// Distance de Levenshtein bornée : renvoie max+1 dès que la distance dépasse `max`.
export function distance(a, b, max = 3) {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let mini = i
    for (let j = 1; j <= b.length; j++) {
      const coût = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + coût)
      if (cur[j] < mini) mini = cur[j]
    }
    if (mini > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

// Les candidats les plus proches de `mot` (insensible à la casse), du plus proche au plus lointain.
// Un candidat qui contient le mot (ou l'inverse) compte comme proche.
export function suggérer(mot, candidats, { n = 3, max = 3 } = {}) {
  const m = mot.toLowerCase()
  const trouvés = []
  for (const c of candidats) {
    const cl = c.toLowerCase()
    let d = distance(m, cl, max)
    if (d > max && m.length >= 4 && (cl.includes(m) || m.includes(cl))) d = max
    if (d <= max) trouvés.push([d, c])
  }
  trouvés.sort((x, y) => x[0] - y[0] || x[1].length - y[1].length || x[1].localeCompare(y[1]))
  // On ne garde que les candidats presque aussi proches que le meilleur (pas de bruit).
  const meilleur = trouvés.length ? trouvés[0][0] : 0
  return trouvés.filter(([d]) => d <= meilleur + 1).slice(0, n).map(([d, c]) => ({ valeur: c, distance: d }))
}

export const sansAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
export const unique = xs => [...new Set(xs)]
export const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? (plusieurs ?? `${un}s`) : un}`
