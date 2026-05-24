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

export const explication = `### Qu'est-ce qu'un composant ?
Un **composant** React est une fonction JavaScript qui retourne du **JSX** — une syntaxe proche du HTML que React transforme en éléments visuels.

### Les 3 règles de base
1. Le nom **commence par une majuscule** (sinon React le traite comme une balise HTML)
2. Il retourne du **JSX** — un seul élément racine (utilise \`<>...</>\` pour en grouper plusieurs)
3. Il peut recevoir des **props** en paramètre pour être personnalisé

### Ce qui se passe sous le capot
Le JSX \`<Salutation nom="Monde" />\` est transformé par Babel en :
\`React.createElement(Salutation, { nom: "Monde" })\`
C'est du JavaScript pur — pas de magie.

### Pourquoi des composants ?
- **Réutilisabilité** : écrire une fois, utiliser partout
- **Lisibilité** : chaque composant a une responsabilité claire
- **Composabilité** : assembler des petits blocs pour construire des UI complexes

⚠️ Un composant doit être **pur** : pour les mêmes props, il retourne toujours le même JSX. Ne pas modifier des variables externes à l'intérieur.
✅ Commence petit : si un composant dépasse 50 lignes, envisage de le découper.`

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
