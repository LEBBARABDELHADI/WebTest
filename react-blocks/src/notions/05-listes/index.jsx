import { useState } from 'react'

export const code = `const fruits = ['🍎 Pomme', '🍌 Banane', '🍊 Orange']

function Liste() {
  return (
    <ul>
      {fruits.map((fruit, index) => (
        // La key aide React à identifier chaque élément
        <li key={index}>{fruit}</li>
      ))}
    </ul>
  )
}

// ✅ Mieux : utiliser un id unique comme key
const tâches = [
  { id: 1, texte: 'Apprendre React' },
  { id: 2, texte: 'Créer une app' },
]
<ul>
  {tâches.map(t => <li key={t.id}>{t.texte}</li>)}
</ul>`

export const explication = `Pour afficher une liste, on utilise **.map()** pour transformer un tableau en JSX.
- Chaque élément doit avoir une **key unique** pour les performances
- La key aide React à détecter les **ajouts, suppressions, réordres**
- Utiliser l'index comme key est à éviter si la liste peut changer`

const emojis = ['🍎', '🍌', '🍊', '🍇', '🥝', '🍓', '🫐', '🍑']

export default function ListesNotion() {
  const [items, setItems] = useState([
    { id: 1, texte: 'Apprendre React' },
    { id: 2, texte: 'Créer une todo list' },
    { id: 3, texte: 'Déployer sur GitHub Pages' },
  ])
  const [input, setInput] = useState('')
  let nextId = items.length + 4

  const ajouter = () => {
    const val = input.trim()
    if (!val) return
    setItems(prev => [...prev, { id: nextId++, texte: val }])
    setInput('')
  }

  const supprimer = id => setItems(prev => prev.filter(i => i.id !== id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ajouter()}
          placeholder="Nouvelle tâche…"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none',
          }}
        />
        <button onClick={ajouter} style={{
          padding: '10px 16px', borderRadius: '8px',
          background: '#6c63ff', color: '#fff', fontWeight: 'bold',
        }}>+</button>
      </div>

      {items.length === 0 && (
        <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>
          Liste vide — ajoute une tâche !
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', background: '#1a1d27',
            borderRadius: '8px', border: '1px solid #2d3148',
          }}>
            <span>{emojis[i % emojis.length]}</span>
            <span style={{ flex: 1, color: '#e2e8f0', fontSize: '14px' }}>{item.texte}</span>
            <span style={{ color: '#2d3148', fontSize: '11px', fontFamily: 'monospace' }}>id:{item.id}</span>
            <button onClick={() => supprimer(item.id)} style={{
              color: '#f87171', fontSize: '16px', padding: '2px 6px',
            }}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
