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

export const explication = `Un **formulaire contrôlé** : React détient la valeur de l'input.
- \`value={état}\` : React contrôle ce qui s'affiche
- \`onChange\` : met à jour l'état à chaque frappe
- \`e.preventDefault()\` évite le rechargement de la page`

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
