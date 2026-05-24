import { useState } from 'react'

export const code = `import { useState } from 'react'

function Compteur() {
  // [valeur, fonctionMàJ] = useState(valeurInitiale)
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Compteur : {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}`

export const explication = `**useState** permet à un composant de mémoriser une valeur.
- À chaque changement d'état → React **re-rend** le composant
- L'état initial ne s'applique qu'au **premier rendu**
- Ne pas modifier l'état directement : toujours passer par le setter`

export default function UseStateNotion() {
  const [count, setCount] = useState(0)
  const [color, setColor] = useState('#6c63ff')

  const colors = ['#6c63ff', '#4ade80', '#f87171', '#fbbf24', '#a78bfa']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <div style={{
        width: '120px', height: '120px',
        borderRadius: '50%',
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '36px', fontWeight: 'bold', color: '#fff',
        transition: 'background 0.3s',
        boxShadow: `0 0 30px ${color}66`,
      }}>
        {count}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setCount(c => c - 1)} style={{
          padding: '10px 20px', borderRadius: '8px',
          background: '#f87171', color: '#fff', fontWeight: 'bold', fontSize: '18px',
        }}>−</button>
        <button onClick={() => setCount(0)} style={{
          padding: '10px 20px', borderRadius: '8px',
          background: '#252836', color: '#94a3b8', fontSize: '13px',
        }}>Reset</button>
        <button onClick={() => setCount(c => c + 1)} style={{
          padding: '10px 20px', borderRadius: '8px',
          background: '#4ade80', color: '#0f1117', fontWeight: 'bold', fontSize: '18px',
        }}>+</button>
      </div>

      <div>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>Couleur :</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {colors.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: c,
              border: color === c ? '3px solid #fff' : '3px solid transparent',
              transition: 'border 0.2s',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
