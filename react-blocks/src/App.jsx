import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Home from './pages/Home'
import NotionPage from './pages/NotionPage'
import Taches from './pages/Taches'
import Notes from './pages/Notes'
import './App.css'

function TachesRoute() {
  const { espace } = useParams()
  // key={espace} force un remontage complet du composant au changement
  // d'espace, pour repartir avec un état et une source GitHub propres.
  return <Taches key={espace} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/notion/:id" element={<NotionPage />} />
      <Route path="/taches" element={<Navigate to="/taches/perso" replace />} />
      <Route path="/taches/:espace" element={<TachesRoute />} />
      <Route path="/notes" element={<Notes />} />
    </Routes>
  )
}

export default App
