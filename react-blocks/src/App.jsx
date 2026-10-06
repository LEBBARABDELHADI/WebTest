import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Home from './pages/Home'
import NotionPage from './pages/NotionPage'
import Taches from './pages/Taches'
import Notes from './pages/Notes'
import Memoriser from './pages/Memoriser'
import Timer from './pages/Timer'
import Verrou from './components/Verrou'
import { foyerDeLEspace } from './lib/foyers'
import './App.css'

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

function App() {
  return (
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
    </Routes>
  )
}

export default App
