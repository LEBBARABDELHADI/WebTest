import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Verrou from './components/Verrou'
import { foyerDeLEspace } from './lib/foyers'
import { enregistrerVisite } from './lib/recents'
import './App.css'

// Chaque outil est un fichier à part, chargé seulement quand on l'ouvre :
// l'accueil s'affiche plus vite. Après une mise à jour du site, un onglet
// resté ouvert peut demander un ancien fichier qui n'existe plus : on
// recharge alors la page une fois pour prendre la nouvelle version.
function charger(importer) {
  return lazy(() => importer().catch(err => {
    const clé = 'react-blocs-rechargement-module'
    if (!sessionStorage.getItem(clé)) {
      sessionStorage.setItem(clé, '1')
      window.location.reload()
      return new Promise(() => {})
    }
    throw err
  }).then(m => { sessionStorage.removeItem('react-blocs-rechargement-module'); return m }))
}
const PAGES = {
  NotionPage: () => import('./pages/NotionPage'),
  Taches: () => import('./pages/Taches'),
  Notes: () => import('./pages/Notes'),
  Memoriser: () => import('./pages/Memoriser'),
  Timer: () => import('./pages/Timer'),
  Graph: () => import('./pages/Graph'),
  Habitudes: () => import('./pages/Habitudes'),
  Agenda: () => import('./pages/Agenda'),
  Tableau: () => import('./pages/Tableau'),
}
const NotionPage = charger(PAGES.NotionPage)
const Taches = charger(PAGES.Taches)
const Notes = charger(PAGES.Notes)
const Memoriser = charger(PAGES.Memoriser)
const Timer = charger(PAGES.Timer)
const Graph = charger(PAGES.Graph)
const Habitudes = charger(PAGES.Habitudes)
const Agenda = charger(PAGES.Agenda)
const Tableau = charger(PAGES.Tableau)

// Une fois la page affichée, les autres outils sont préchargés en douceur
// (ouverture instantanée ensuite, et disponibles hors ligne).
function Préchargement() {
  useEffect(() => {
    const lancer = () => Object.values(PAGES).forEach(p => p().catch(() => {}))
    // Après 2,5 s, quand le navigateur n'a rien d'autre à faire.
    let idle = null
    const minuteur = setTimeout(() => {
      idle = 'requestIdleCallback' in window ? window.requestIdleCallback(lancer, { timeout: 4000 }) : null
      if (idle === null) lancer()
    }, 2500)
    return () => { clearTimeout(minuteur); if (idle !== null) window.cancelIdleCallback?.(idle) }
  }, [])
  return null
}

function Chargement() {
  return (
    <div role="status" aria-label="Chargement" style={{ minHeight: '60dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '3px solid rgba(240,168,57,.25)', borderTopColor: '#f0a839', animation: 'tourner .8s linear infinite' }} />
      <style>{'@keyframes tourner { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}

// key = foyers : sans ça, React réutiliserait le même verrou (déjà ouvert)
// en passant d'un foyer à l'autre, et l'autre mot de passe serait sauté.
function Protégé({ foyers, children }) {
  return <Verrou key={foyers.join(',')} foyers={foyers}>{children}</Verrou>
}

function EspaceRoute({ Page }) {
  const { espace } = useParams()
  // key={espace} force un remontage complet du composant au changement
  // d'espace, pour repartir avec un état et une source GitHub propres.
  return (
    <Protégé foyers={[foyerDeLEspace(espace)]}>
      <Page key={espace} />
    </Protégé>
  )
}

// Messages globaux (ex. « Mis à jour avec les changements d'un autre appareil »).
function Annonces() {
  const [texte, setTexte] = useState(null)
  useEffect(() => {
    let minuteur
    const surAnnonce = e => { setTexte(e.detail); clearTimeout(minuteur); minuteur = setTimeout(() => setTexte(null), 4000) }
    window.addEventListener('react-blocs-annonce', surAnnonce)
    return () => { window.removeEventListener('react-blocs-annonce', surAnnonce); clearTimeout(minuteur) }
  }, [])
  if (!texte) return null
  return (
    <div role="status" style={{
      position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 2000,
      maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: '12px', fontSize: '14px', fontFamily: 'system-ui, sans-serif',
      background: '#2f7d4f', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,.35)',
    }}>🔄 {texte}</div>
  )
}

// Note chaque page ouverte pour la liste « Reprendre » de l'accueil.
function SuiviRécents() {
  const { pathname } = useLocation()
  useEffect(() => { enregistrerVisite(pathname) }, [pathname])
  return null
}

function App() {
  return (
    <>
    <SuiviRécents />
    <Annonces />
    <Préchargement />
    <Suspense fallback={<Chargement />}>
    <Routes>
      <Route path="/" element={<Protégé foyers={['lebbar']}><Home key="lebbar" foyerId="lebbar" /></Protégé>} />
      <Route path="/idrissi" element={<Protégé foyers={['idrissi']}><Home key="idrissi" foyerId="idrissi" /></Protégé>} />
      <Route path="/notion/:id" element={<Protégé foyers={['lebbar', 'idrissi']}><NotionPage /></Protégé>} />
      <Route path="/timer" element={<Protégé foyers={['lebbar', 'idrissi']}><Timer /></Protégé>} />
      <Route path="/taches" element={<Navigate to="/taches/perso" replace />} />
      <Route path="/taches/:espace" element={<EspaceRoute Page={Taches} />} />
      <Route path="/notes" element={<Navigate to="/notes/perso" replace />} />
      <Route path="/notes/:espace" element={<EspaceRoute Page={Notes} />} />
      <Route path="/memoriser" element={<Navigate to="/memoriser/perso" replace />} />
      <Route path="/memoriser/:espace" element={<EspaceRoute Page={Memoriser} />} />
      <Route path="/graph" element={<Navigate to="/graph/perso" replace />} />
      <Route path="/graph/:espace" element={<EspaceRoute Page={Graph} />} />
      <Route path="/habitudes" element={<Navigate to="/habitudes/perso" replace />} />
      <Route path="/habitudes/:espace" element={<EspaceRoute Page={Habitudes} />} />
      <Route path="/agenda" element={<Navigate to="/agenda/perso" replace />} />
      <Route path="/agenda/:espace" element={<EspaceRoute Page={Agenda} />} />
      <Route path="/tableau" element={<Navigate to="/tableau/perso" replace />} />
      <Route path="/tableau/:espace" element={<EspaceRoute Page={Tableau} />} />
    </Routes>
    </Suspense>
    </>
  )
}

export default App
