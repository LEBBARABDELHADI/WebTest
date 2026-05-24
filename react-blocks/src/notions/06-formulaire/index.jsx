import { useState } from 'react'

export const code = `import { useState } from 'react'

function Formulaire() {
  const [form, setForm] = useState({ nom: '', email: '' })

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault() // Évite le rechargement de la page
    console.log('Envoyé :', form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="nom" value={form.nom} onChange={handleChange} />
      <input name="email" value={form.email} onChange={handleChange} />
      <button type="submit">Envoyer</button>
    </form>
  )
}`

export const explication = `### Formulaire contrôlé vs non contrôlé
En React, il y a deux approches :
- **Contrôlé** : React détient la valeur via \`useState\` → recommandé
- **Non contrôlé** : le DOM gère la valeur via \`useRef\` → cas rares

### Comment ça marche (contrôlé)
1. L'utilisateur tape → l'événement \`onChange\` se déclenche
2. \`onChange\` appelle \`setValeur(e.target.value)\`
3. React re-rend avec la nouvelle valeur dans \`value={valeur}\`
C'est une **boucle** : état → affichage → événement → état

### Gérer plusieurs champs efficacement
Au lieu d'un \`useState\` par champ, utilise un objet et le \`name\` de l'input :
\`const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))\`
L'attribut \`name\` de l'input devient la clé dans l'objet.

### La soumission du formulaire
\`onSubmit\` sur la balise \`<form>\` (pas sur le bouton).
\`e.preventDefault()\` est indispensable pour empêcher le rechargement de page.

### Validation
- **HTML natif** : \`required\`, \`type="email"\`, \`minLength\`
- **Manuelle** : vérifier l'état avant de soumettre
- **Bibliothèques** : React Hook Form, Zod pour des formulaires complexes

⚠️ Si \`value\` est défini sans \`onChange\`, l'input devient **en lecture seule** → erreur dans la console.
✅ Pour les cases à cocher, utilise \`checked\` et \`onChange\` au lieu de \`value\`.`

const fieldStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2d3148', background: '#252836',
  color: '#e2e8f0', fontSize: '14px', outline: 'none',
}

export default function FormulaireNotion() {
  const [form, setForm] = useState({ nom: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(null)

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    setSubmitted(form)
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ padding: '16px', background: '#4ade8022', borderRadius: '8px', border: '1px solid #4ade80' }}>
          <p style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: '8px' }}>✅ Formulaire soumis !</p>
          {Object.entries(submitted).map(([k, v]) => (
            <p key={k} style={{ color: '#e2e8f0', fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>{k}:</span> {v}
            </p>
          ))}
        </div>
        <button onClick={() => { setSubmitted(null); setForm({ nom: '', email: '', message: '' }) }}
          style={{ padding: '10px', borderRadius: '8px', background: '#252836', color: '#94a3b8' }}>
          ← Recommencer
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nom</label>
        <input name="nom" value={form.nom} onChange={handleChange}
          placeholder="Ton nom…" required style={fieldStyle} />
      </div>
      <div>
        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange}
          placeholder="ton@email.com" required style={fieldStyle} />
      </div>
      <div>
        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Message</label>
        <textarea name="message" value={form.message} onChange={handleChange}
          placeholder="Ton message…" rows={3}
          style={{ ...fieldStyle, resize: 'vertical' }} />
      </div>

      <div style={{ padding: '10px', background: '#252836', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#6c63ff' }}>
        {JSON.stringify(form, null, 2)}
      </div>

      <button type="submit" style={{
        padding: '12px', borderRadius: '8px',
        background: '#6c63ff', color: '#fff',
        fontWeight: 'bold', fontSize: '15px',
      }}>
        Envoyer →
      </button>
    </form>
  )
}
