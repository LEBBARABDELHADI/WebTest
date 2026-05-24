import { useState, useEffect } from 'react'

export const code = `// Un hook personnalisé = une fonction qui commence par "use"
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// Utilisation comme useState
function App() {
  const [nom, setNom] = useLocalStorage('nom', '')
  return <input value={nom} onChange={e => setNom(e.target.value)} />
}`

export const explication = `Un **hook personnalisé** est une fonction dont le nom commence par \`use\` et qui appelle d'autres hooks.
- Permet de **réutiliser de la logique** entre composants
- N'est pas un composant : ne retourne pas de JSX
- Peut appeler \`useState\`, \`useEffect\`, etc.`

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init } catch { return init }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(val))
  }, [key, val])
  return [val, setVal]
}

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return size
}

export default function HookCustomNotion() {
  const [notes, setNotes] = useLocalStorage('react-blocs-notes', '')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 600)
  const size = useWindowSize()

  const hook = (name, color) => (
    <span style={{ padding: '2px 8px', borderRadius: '20px', background: color + '22', color, fontSize: '12px', fontFamily: 'monospace' }}>{name}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          {hook('useLocalStorage', '#4ade80')}
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Les notes persistent après reload</span>
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Écris une note… elle sera sauvegardée automatiquement !"
          rows={3} style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical',
          }} />
        <p style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>
          💾 Sauvegardé dans localStorage
        </p>
      </div>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          {hook('useDebounce', '#fbbf24')}
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Attend la fin de frappe</span>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tape pour chercher…"
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none',
          }} />
        <p style={{ marginTop: '6px', fontSize: '13px', color: '#94a3b8' }}>
          Valeur immédiate : <span style={{ color: '#e2e8f0' }}>{search || '—'}</span>
          {' | '}Debounced : <span style={{ color: '#fbbf24' }}>{debouncedSearch || '—'}</span>
        </p>
      </div>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
          {hook('useWindowSize', '#a78bfa')}
        </div>
        <p style={{ color: '#e2e8f0', fontSize: '18px', fontFamily: 'monospace' }}>
          {size.w} × {size.h} px
        </p>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>Redimensionne la fenêtre pour voir</p>
      </div>

    </div>
  )
}
