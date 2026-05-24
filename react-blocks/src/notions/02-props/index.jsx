import { useState } from 'react'

export const code = `function Carte({ titre, couleur, score }) {
  return (
    <div style={{ borderLeft: \`4px solid \${couleur}\`, padding: '12px' }}>
      <strong>{titre}</strong>
      <span>Score : {score}</span>
    </div>
  )
}

// Utilisation avec des props différentes
<Carte titre="React"  couleur="#6c63ff" score={95} />
<Carte titre="Vue"    couleur="#4ade80" score={82} />
<Carte titre="Angular" couleur="#f87171" score={74} />`

export const explication = `### Qu'est-ce que les props ?
Les **props** (propriétés) sont les paramètres que le composant parent transmet à son enfant. C'est la façon dont les composants communiquent entre eux.

### Flux de données
Les props suivent un flux **unidirectionnel** : parent → enfant uniquement. Un enfant ne peut jamais modifier les props qu'il reçoit.

### Types acceptés
- \`string\` → \`titre="Bonjour"\`
- \`number\` → \`score={95}\` (accolades obligatoires)
- \`boolean\` → \`actif={true}\` ou simplement \`actif\`
- \`tableau / objet\` → \`data={[1, 2, 3]}\`
- \`fonction\` → \`onClick={handleClick}\` (callbacks)
- \`JSX\` → \`children={<p>Texte</p>}\`

### La déstructuration
Au lieu de \`function Carte(props)\` puis \`props.titre\`, on déstructure directement :
\`function Carte({ titre, couleur, score })\` — plus lisible.

### La prop children
Tout ce qui est entre les balises devient \`children\` :
\`<Carte>Contenu ici</Carte>\` → accessible via \`props.children\`

⚠️ Ne jamais modifier une prop dans l'enfant : \`props.score = 100\` → interdit et sans effet.
✅ Si l'enfant a besoin de modifier une valeur, le parent doit lui passer une **fonction callback** via les props.`

const joueurs = [
  { titre: 'React', couleur: '#6c63ff', score: 95 },
  { titre: 'Vue', couleur: '#4ade80', score: 82 },
  { titre: 'Angular', couleur: '#f87171', score: 74 },
  { titre: 'Svelte', couleur: '#fbbf24', score: 88 },
]

function Carte({ titre, couleur, score }) {
  return (
    <div style={{
      borderLeft: `4px solid ${couleur}`,
      padding: '12px 16px',
      background: '#1a1d27',
      borderRadius: '0 8px 8px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <strong style={{ color: '#e2e8f0' }}>{titre}</strong>
      <span style={{
        background: couleur + '33',
        color: couleur,
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
      }}>
        {score} pts
      </span>
    </div>
  )
}

export default function PropsNotion() {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
        Clique sur une carte pour voir ses props
      </p>
      {joueurs.map(j => (
        <div key={j.titre} onClick={() => setSelected(j.titre === selected ? null : j.titre)}
          style={{ cursor: 'pointer', opacity: selected && selected !== j.titre ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <Carte {...j} />
        </div>
      ))}
      {selected && (
        <div style={{ marginTop: '8px', padding: '12px', background: '#252836', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#a78bfa' }}>
          {`<Carte titre="${joueurs.find(j=>j.titre===selected).titre}" couleur="${joueurs.find(j=>j.titre===selected).couleur}" score={${joueurs.find(j=>j.titre===selected).score}} />`}
        </div>
      )}
    </div>
  )
}
