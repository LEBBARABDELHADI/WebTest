import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NotionPage from './pages/NotionPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/notion/:id" element={<NotionPage />} />
    </Routes>
  )
}

export default App
