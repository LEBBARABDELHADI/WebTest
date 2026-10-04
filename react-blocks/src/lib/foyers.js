// Deux foyers indépendants, chacun avec ses espaces perso et pro dans
// Programme, Notes et Mémoriser. Home Lebbar garde les identifiants et
// fichiers d'origine (perso, pro) ; Home Idrissi a les siens, préfixés.
export const FOYERS = {
  lebbar: { id: 'lebbar', nom: 'Home Lebbar', accueil: '/', préfixe: '' },
  idrissi: { id: 'idrissi', nom: 'Home Idrissi', accueil: '/idrissi', préfixe: 'idrissi-' },
}

// Foyer auquel appartient un identifiant d'espace (« idrissi-pro » → idrissi).
export function foyerDeLEspace(espaceId = '') {
  const foyer = Object.values(FOYERS).find(f => f.préfixe && espaceId.startsWith(f.préfixe))
  return foyer ? foyer.id : 'lebbar'
}

// Construit les entrées de configuration d'une page pour tous les foyers.
// `créer(foyer, type, id)` renvoie la config spécifique à la page.
export function espacesPourTousLesFoyers(créer) {
  const espaces = {}
  Object.values(FOYERS).forEach(foyer => {
    ;['perso', 'pro'].forEach(type => {
      const id = `${foyer.préfixe}${type}`
      espaces[id] = { id, type, foyer: foyer.id, ...créer(foyer, type, id) }
    })
  })
  return espaces
}
