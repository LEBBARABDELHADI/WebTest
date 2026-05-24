export const code = `// Un composant = une fonction qui retourne du JSX
function Salutation({ nom }) {
  return (
    <div style={{ padding: '16px', background: '#252836', borderRadius: '8px' }}>
      <h2>👋 Bonjour, {nom} !</h2>
      <p>Je suis un composant React.</p>
    </div>
  )
}

// On l'utilise comme une balise HTML
function App() {
  return <Salutation nom="Monde" />
}`

export const explication = `Un **composant** React est une simple fonction JavaScript qui :
- Accepte des **props** en paramètre (optionnel)
- Retourne du **JSX** (HTML-like syntax)
- Commence par une **majuscule**

Le JSX est transformé en appels React.createElement() par Babel.`

export default function ComposantDeBase() {
  function Salutation({ nom }) {
    return (
      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '8px', border: '1px solid #2d3148' }}>
        <h2 style={{ color: '#a78bfa', marginBottom: '8px' }}>👋 Bonjour, {nom} !</h2>
        <p style={{ color: '#94a3b8' }}>Je suis un composant React.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Salutation nom="Monde" />
      <Salutation nom="React" />
      <Salutation nom="Développeur" />
    </div>
  )
}
