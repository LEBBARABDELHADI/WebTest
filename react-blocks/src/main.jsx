import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './lib/theme.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/WebTest/sw.js', { scope: '/WebTest/' })
      .then(inscription => {
        // Vérifie s'il existe une nouvelle version dès l'ouverture de la page,
        // au lieu d'attendre le prochain cycle de contrôle du navigateur.
        inscription.update().catch(() => {})
      })
      .catch(() => {})

    // Le service worker « saute » déjà l'attente (skipWaiting côté sw.js),
    // mais un onglet déjà ouvert garde son JS chargé en mémoire tant qu'il
    // n'est pas rechargé — d'où un vieux code qui persiste malgré la mise
    // à jour. On force un rechargement unique dès que le nouveau service
    // worker prend le contrôle.
    let déjàRechargé = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (déjàRechargé) return
      déjàRechargé = true
      window.location.reload()
    })
  })
}
