// Rappels : une notification par jour (cartes à réviser, tâches du jour ou
// en retard) quand on ouvre l'app, et un nombre sur l'icône de l'app
// installée. Sans serveur, rien ne peut s'afficher quand l'app est fermée.
const CLÉ = 'react-blocs-rappels'
const CLÉ_JOUR = 'react-blocs-rappels-dernier'

export const notificationsPossibles = () => typeof window !== 'undefined' && 'Notification' in window

export function rappelsActifs() {
  return notificationsPossibles() && localStorage.getItem(CLÉ) === 'oui' && Notification.permission === 'granted'
}

export async function activerRappels() {
  if (!notificationsPossibles()) throw new Error('Ce navigateur ne permet pas les notifications. Sur iPhone : ajoute l\'app à l\'écran d\'accueil (Partager → Sur l\'écran d\'accueil), puis ouvre-la depuis l\'icône.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications refusées. Tu peux les autoriser dans les réglages du navigateur pour ce site.')
  localStorage.setItem(CLÉ, 'oui')
  localStorage.removeItem(CLÉ_JOUR)
}

export function désactiverRappels() {
  localStorage.removeItem(CLÉ)
  navigator.clearAppBadge?.().catch(() => {})
}

async function notifier(titre, options) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.()
    if (reg?.showNotification) { await reg.showNotification(titre, options); return }
  } catch { /* repli ci-dessous */ }
  new Notification(titre, options) // eslint-disable-line no-new
}

// { àRéviser, duJour, enRetard } → badge de l'icône + notification du jour.
export async function vérifierRappels({ àRéviser, duJour, enRetard }, nomFoyer) {
  const total = àRéviser + duJour + enRetard
  if ('setAppBadge' in navigator) {
    try { if (total && rappelsActifs()) await navigator.setAppBadge(total); else await navigator.clearAppBadge() } catch { /* ignore */ }
  }
  if (!rappelsActifs() || !total) return
  const jour = new Date().toISOString().slice(0, 10)
  if (localStorage.getItem(CLÉ_JOUR) === jour) return
  localStorage.setItem(CLÉ_JOUR, jour)
  const lignes = []
  if (duJour) lignes.push(`${duJour} tâche${duJour > 1 ? 's' : ''} pour aujourd'hui`)
  if (enRetard) lignes.push(`${enRetard} en retard`)
  if (àRéviser) lignes.push(`${àRéviser} carte${àRéviser > 1 ? 's' : ''} à réviser`)
  await notifier(nomFoyer, { body: lignes.join(' · '), tag: 'rappel-du-jour', icon: '/WebTest/icons/icon-192.png', badge: '/WebTest/icons/icon-192.png' })
}
