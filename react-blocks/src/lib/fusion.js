// Fusion à trois versions, pour ne rien perdre quand deux appareils
// modifient le même fichier :
//   base    = la version que l'appareil avait lue (ou envoyée) en dernier,
//   local   = la version de l'appareil, avec ses modifications,
//   distant = la version actuelle sur GitHub (modifiée ailleurs entre-temps).
// Les listes d'objets avec un `id` (tâches, notes, cartes, bulles…) sont
// fusionnées élément par élément, les objets champ par champ. En cas de
// vrai conflit (même champ changé des deux côtés), la version locale (la
// plus récente, celle qu'on enregistre) l'emporte.

export function égal(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => égal(x, b[i]))
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  return ka.length === kb.length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && égal(a[k], b[k]))
}

const estObjet = x => x !== null && typeof x === 'object' && !Array.isArray(x)
const avecIds = liste => Array.isArray(liste) && liste.length > 0 && liste.every(x => estObjet(x) && x.id != null)

export function fusionner(base, local, distant) {
  if (égal(local, distant)) return local
  if (égal(local, base)) return distant
  if (égal(distant, base)) return local
  // Les deux côtés ont changé.
  if (Array.isArray(local) && Array.isArray(distant)) {
    const listeBase = Array.isArray(base) ? base : []
    if ((avecIds(local) || local.length === 0) && (avecIds(distant) || distant.length === 0) && (avecIds(listeBase) || listeBase.length === 0)) {
      return fusionnerListes(listeBase, local, distant)
    }
    return local
  }
  if (estObjet(local) && estObjet(distant)) {
    const b = estObjet(base) ? base : {}
    const résultat = {}
    // Ordre des champs : celui du local, puis les nouveaux du distant.
    const clés = [...new Set([...Object.keys(local), ...Object.keys(distant), ...Object.keys(b)])]
    clés.forEach(k => {
      const v = fusionner(b[k], local[k], distant[k])
      if (v !== undefined) résultat[k] = v
    })
    return résultat
  }
  return local
}

function fusionnerListes(base, local, distant) {
  const parId = liste => new Map(liste.map(x => [x.id, x]))
  const B = parId(base)
  const L = parId(local)
  const D = parId(distant)
  const gardé = id => {
    const enL = L.has(id)
    const enD = D.has(id)
    const enB = B.has(id)
    if (enL && enD) return true
    // Supprimé d'un côté : on le garde seulement s'il a été modifié de l'autre.
    if (enL) return !enB || !égal(L.get(id), B.get(id))
    if (enD) return !enB || !égal(D.get(id), B.get(id))
    return false
  }
  const valeur = id => {
    if (L.has(id) && D.has(id)) return fusionner(B.get(id), L.get(id), D.get(id))
    return L.has(id) ? L.get(id) : D.get(id)
  }
  // Ordre : celui du côté qui a réordonné (le local s'il l'a fait), puis on
  // insère les éléments ajoutés par l'autre côté après leur voisin.
  const ordreChangé = liste => {
    const ids = liste.map(x => x.id).filter(id => B.has(id))
    const présents = new Set(ids)
    return ids.join('\u0000') !== base.map(x => x.id).filter(id => présents.has(id)).join('\u0000')
  }
  const localRéordonné = ordreChangé(local)
  const [principal, secondaire] = localRéordonné || !ordreChangé(distant) ? [local, distant] : [distant, local]
  const ordre = principal.map(x => x.id).filter(gardé)
  const placés = new Set(ordre)
  secondaire.forEach((x, i) => {
    if (placés.has(x.id) || !gardé(x.id)) return
    let j = i - 1
    while (j >= 0 && !placés.has(secondaire[j].id)) j -= 1
    let pos = j >= 0 ? ordre.indexOf(secondaire[j].id) + 1 : 0
    // Après les éléments déjà ajoutés de l'autre côté au même endroit.
    while (pos < ordre.length && !B.has(ordre[pos])) pos += 1
    ordre.splice(pos, 0, x.id)
    placés.add(x.id)
  })
  return ordre.map(valeur)
}

// ---------- Version de base mémorisée sur l'appareil ----------
// Gardée à côté de la copie locale (`stockage`) : elle permet, à la
// réouverture, de savoir ce qui n'avait pas encore été envoyé.

export function lireBase(stockage) {
  try { return localStorage.getItem(`${stockage}:base`) } catch { return null }
}
export function écrireBase(stockage, json) {
  try { localStorage.setItem(`${stockage}:base`, json) } catch { /* ignore */ }
}

// À la lecture de GitHub : si l'appareil avait des modifications pas encore
// envoyées (hors ligne, erreur…), on les fusionne avec la version distante
// au lieu de les écraser. `àEnvoyer` : le résultat diffère de GitHub.
export function réconcilier({ distant, local, base }) {
  if (!base || local == null) return { données: distant, àEnvoyer: false }
  let b
  try { b = JSON.parse(base) } catch { return { données: distant, àEnvoyer: false } }
  if (égal(local, b)) return { données: distant, àEnvoyer: false }
  const données = fusionner(b, local, distant)
  return { données, àEnvoyer: !égal(données, distant) }
}

// Petit message global (affiché par <Annonces /> dans App).
export function annoncer(texte) {
  window.dispatchEvent(new CustomEvent('react-blocs-annonce', { detail: texte }))
}
