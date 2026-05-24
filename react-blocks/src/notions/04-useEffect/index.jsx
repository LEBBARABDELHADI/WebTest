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

export const explication = `### À quoi sert useEffect ?
**useEffect** permet de synchroniser ton composant avec quelque chose **en dehors de React** : un timer, une API, le titre de la page, un écouteur d'événement, etc. Il s'exécute **après** que React a mis à jour le DOM.

### Syntaxe complète
\`useEffect(() => { /* effet */ return () => { /* cleanup */ } }, [deps])\`

### Le tableau de dépendances
- **Absent** \`useEffect(fn)\` → s'exécute après **chaque** render
- **Vide** \`useEffect(fn, [])\` → s'exécute **une seule fois** au montage
- **Avec deps** \`useEffect(fn, [a, b])\` → se relance quand \`a\` ou \`b\` change

### La fonction de cleanup
Elle s'exécute **avant** le prochain effet, et au **démontage** du composant.
Indispensable pour : \`clearInterval\`, \`removeEventListener\`, annuler une requête.

### Cas d'usage courants
1. Charger des données depuis une API au montage
2. S'abonner à un WebSocket ou un événement
3. Synchroniser avec \`localStorage\`
4. Modifier \`document.title\`

⚠️ Ne mets pas \`async\` directement dans useEffect : \`useEffect(async () => {...})\` est incorrect. Crée une fonction async à l'intérieur.
⚠️ Oublier le cleanup d'un \`setInterval\` provoque une **fuite mémoire** : le timer continue même après que le composant a disparu.
✅ Si tu te demandes "pourquoi mon effet s'exécute en boucle ?" → vérifie que les dépendances ne changent pas à chaque render (objets/fonctions créés à l'intérieur du composant).`

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
