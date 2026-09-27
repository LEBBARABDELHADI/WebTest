import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NotionPage from './pages/NotionPage'
import Taches from './pages/Taches'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/notion/:id" element={<NotionPage />} />
      <Route path="/taches" element={<Taches />} />
    </Routes>
  )
}

export default App
