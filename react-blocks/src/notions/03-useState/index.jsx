import { useState, useRef } from 'react'

export const code = `import { useState } from 'react'

function Compteur() {
  // [valeur, fonctionMàJ] = useState(valeurInitiale)
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Compteur : {count}</p>

      {/* Mise à jour directe */}
      <button onClick={() => setCount(count + 1)}>+1</button>

      {/* Mise à jour fonctionnelle — recommandée si
          le nouvel état dépend de l'ancien */}
      <button onClick={() => setCount(prev => prev + 1)}>+1 (fn)</button>

      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

// Plusieurs états indépendants
function Panier() {
  const [articles, setArticles] = useState([])
  const [promo, setPromo] = useState(false)

  const ajouter = (item) =>
    setArticles(prev => [...prev, item])

  return (/* ... */)
}`

export const explication = `**useState** permet à un composant de mémoriser une valeur entre les renders.
- Syntaxe : \`const [état, setÉtat] = useState(valeurInitiale)\`
- À chaque \`setÉtat()\` → React **re-rend** le composant avec la nouvelle valeur
- L'état initial ne s'applique qu'au **premier rendu**
- Pour mettre à jour selon l'état précédent, utilise la forme fonctionnelle : \`setCount(prev => prev + 1)\`
- Chaque appel à useState crée un état **indépendant**`

const ITEMS = ['☕ Café', '🍕 Pizza', '🎮 Jeux', '📚 Livre', '🎧 Casque']
const COLORS = ['#6c63ff', '#4ade80', '#f87171', '#fbbf24', '#a78bfa']

export default function UseStateNotion() {
  const [count, setCount] = useState(0)
  const [color, setColor] = useState('#6c63ff')
  const [history, setHistory] = useState([0])
  const [panier, setPanier] = useState([])
  const [promo, setPromo] = useState(false)
  const renderCount = useRef(0)
  renderCount.current += 1

  const update = (fn) => {
    setCount(prev => {
      const next = fn(prev)
      setHistory(h => [...h.slice(-6), next])
      return next
    })
  }

  const total = panier.reduce((s, p) => s + p.prix, 0)
  const totalFinal = promo ? total * 0.8 : total

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Bloc 1 — Compteur visuel */}
      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>État : <code style={{ color: '#fbbf24', background: '#252836', padding: '1px 6px', borderRadius: '4px' }}>count</code></span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>🔁 {renderCount.current} renders</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => update(p => p - 1)} style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#f87171', color: '#fff', fontSize: '20px', fontWeight: 'bold',
          }}>−</button>

          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: color, boxShadow: `0 0 24px ${color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 'bold', color: '#fff',
            transition: 'background 0.3s',
          }}>
            {count}
          </div>

          <button onClick={() => update(p => p + 1)} style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#4ade80', color: '#0f1117', fontSize: '20px', fontWeight: 'bold',
          }}>+</button>
        </div>

        {/* Historique des états */}
        <div style={{ marginTop: '12px' }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}>Historique des états :</p>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            {history.map((v, i) => (
              <span key={i} style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '13px',
                background: i === history.length - 1 ? color + '33' : '#252836',
                color: i === history.length - 1 ? color : '#94a3b8',
                border: `1px solid ${i === history.length - 1 ? color : '#2d3148'}`,
                fontFamily: 'monospace',
              }}>{v}</span>
            ))}
            {history.length > 1 && <span style={{ color: '#94a3b8', fontSize: '11px' }}>← actuel</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => update(() => 0)} style={{
            padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
            background: '#252836', color: '#94a3b8', border: '1px solid #2d3148',
          }}>Reset</button>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: '24px', height: '24px', borderRadius: '50%', background: c,
              border: color === c ? '2px solid #fff' : '2px solid transparent',
            }} />
          ))}
        </div>
      </div>

      {/* Bloc 2 — Panier (objet + booléen) */}
      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>
          Plusieurs états : <code style={{ color: '#a78bfa', background: '#252836', padding: '1px 5px', borderRadius: '4px' }}>articles[]</code> + <code style={{ color: '#a78bfa', background: '#252836', padding: '1px 5px', borderRadius: '4px' }}>promo</code>
        </p>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {ITEMS.map((item, i) => (
            <button key={item} onClick={() => setPanier(p => [...p, { id: Date.now(), nom: item, prix: (i + 1) * 5 }])}
              style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '13px', background: '#252836', color: '#e2e8f0', border: '1px solid #2d3148' }}>
              {item}
            </button>
          ))}
        </div>

        {panier.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
            {panier.slice(-3).map((a, i) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#e2e8f0' }}>
                <span>{a.nom}</span>
                <span style={{ color: '#fbbf24' }}>{a.prix} €</span>
              </div>
            ))}
            {panier.length > 3 && <p style={{ color: '#94a3b8', fontSize: '11px' }}>+{panier.length - 3} article(s)…</p>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => setPromo(p => !p)} style={{
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
            background: promo ? '#4ade8033' : '#252836',
            color: promo ? '#4ade80' : '#94a3b8',
            border: `1px solid ${promo ? '#4ade80' : '#2d3148'}`,
          }}>
            {promo ? '✅ Promo -20%' : '🏷 Activer promo'}
          </button>

          <div style={{ textAlign: 'right' }}>
            {promo && total > 0 && <p style={{ color: '#94a3b8', fontSize: '11px', textDecoration: 'line-through' }}>{total} €</p>}
            <p style={{ color: '#4ade80', fontWeight: 'bold' }}>
              {panier.length === 0 ? 'Panier vide' : `${totalFinal.toFixed(2)} €`}
            </p>
          </div>

          {panier.length > 0 && (
            <button onClick={() => setPanier([])} style={{
              padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
              background: '#252836', color: '#f87171', border: '1px solid #2d3148',
            }}>🗑 Vider</button>
          )}
        </div>
      </div>

    </div>
  )
}

