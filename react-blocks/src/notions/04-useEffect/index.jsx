import { useState, useEffect } from 'react'

export const code = `import { useState, useEffect } from 'react'

function Minuterie() {
  const [secondes, setSecondes] = useState(0)
  const [actif, setActif] = useState(false)

  useEffect(() => {
    if (!actif) return

    // Setup : démarre l'intervalle
    const id = setInterval(() => {
      setSecondes(s => s + 1)
    }, 1000)

    // Cleanup : arrête quand actif change ou que le composant disparaît
    return () => clearInterval(id)
  }, [actif]) // Se relance quand 'actif' change

  return (/* ... */)
}`

export const explication = `**useEffect** synchronise un composant avec un système externe.
- S'exécute **après** chaque rendu par défaut
- Le tableau \`[deps]\` contrôle **quand** il se relance
- La **fonction de cleanup** évite les fuites mémoire`

export default function UseEffectNotion() {
  const [secondes, setSecondes] = useState(0)
  const [actif, setActif] = useState(false)
  const [titre, setTitre] = useState('Page title')

  useEffect(() => {
    if (!actif) return
    const id = setInterval(() => setSecondes(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [actif])

  useEffect(() => {
    document.title = actif ? `⏱ ${secondes}s` : 'React Blocs'
    return () => { document.title = 'React Blocs' }
  }, [secondes, actif])

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '52px',
        fontWeight: 'bold',
        color: actif ? '#4ade80' : '#94a3b8',
        letterSpacing: '4px',
        transition: 'color 0.3s',
      }}>
        {fmt(secondes)}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setActif(a => !a)} style={{
          padding: '10px 24px', borderRadius: '8px',
          background: actif ? '#f87171' : '#4ade80',
          color: actif ? '#fff' : '#0f1117',
          fontWeight: 'bold',
          transition: 'background 0.2s',
        }}>
          {actif ? '⏸ Pause' : '▶ Démarrer'}
        </button>
        <button onClick={() => { setActif(false); setSecondes(0) }} style={{
          padding: '10px 16px', borderRadius: '8px',
          background: '#252836', color: '#94a3b8',
        }}>
          ↺ Reset
        </button>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '13px' }}>
        {actif ? '⚡ useEffect tourne — regarde le titre de l\'onglet !' : 'Appuie sur Démarrer pour lancer l\'effet'}
      </p>
    </div>
  )
}
