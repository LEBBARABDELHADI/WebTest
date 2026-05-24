import { useState } from 'react'

export const code = `function Statut({ connecté }) {
  // if/else classique
  if (!connecté) return <p>🔒 Non connecté</p>

  // Opérateur ternaire
  return (
    <div>
      {connecté
        ? <p>✅ Connecté</p>
        : <p>❌ Déconnecté</p>
      }

      {/* && : affiche seulement si la condition est vraie */}
      {connecté && <button>Se déconnecter</button>}
    </div>
  )
}`

export const explication = `**3 patterns** pour le rendu conditionnel :
1. \`if/else\` — sortie anticipée du composant
2. **Ternaire** \`condition ? <A/> : <B/>\` — choisir entre deux éléments
3. **Court-circuit** \`condition && <A/>\` — afficher ou rien`

export default function ConditionnelNotion() {
  const [connecté, setConnecté] = useState(false)
  const [theme, setTheme] = useState('sombre')
  const [count, setCount] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>if / else</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, padding: '12px', borderRadius: '8px',
            background: connecté ? '#4ade8022' : '#f8717122',
            border: `1px solid ${connecté ? '#4ade80' : '#f87171'}`,
            textAlign: 'center',
          }}>
            {connecté
              ? <span style={{ color: '#4ade80' }}>✅ Bienvenue !</span>
              : <span style={{ color: '#f87171' }}>🔒 Non connecté</span>
            }
          </div>
          <button onClick={() => setConnecté(v => !v)} style={{
            padding: '10px 20px', borderRadius: '8px',
            background: connecté ? '#f87171' : '#4ade80',
            color: connecté ? '#fff' : '#0f1117',
            fontWeight: 'bold',
          }}>
            {connecté ? 'Se déconnecter' : 'Se connecter'}
          </button>
        </div>
        {connecté && (
          <p style={{ marginTop: '10px', color: '#a78bfa', fontSize: '13px' }}>
            👆 Ce message n'apparaît que si <code style={{ background: '#2d3148', padding: '1px 6px', borderRadius: '4px' }}>connecté && ...</code>
          </p>
        )}
      </div>

      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>Ternaire</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['sombre', 'clair', 'violet'].map(t => (
            <button key={t} onClick={() => setTheme(t)} style={{
              padding: '8px 14px', borderRadius: '8px',
              background: theme === t ? '#6c63ff' : '#252836',
              color: theme === t ? '#fff' : '#94a3b8',
              border: theme === t ? '1px solid #6c63ff' : '1px solid #2d3148',
            }}>{t}</button>
          ))}
        </div>
        <div style={{
          marginTop: '10px', padding: '12px', borderRadius: '8px',
          background: theme === 'clair' ? '#f0f0f0' : theme === 'violet' ? '#2d1b6b' : '#252836',
          color: theme === 'clair' ? '#0f1117' : '#e2e8f0',
          transition: 'all 0.3s',
        }}>
          Thème actif : <strong>{theme}</strong>
        </div>
      </div>

    </div>
  )
}
