// Exports : JSON, Terraform, CloudFormation, AWS CLI, YAML.
import { useMemo, useState } from 'react'
import { FORMATS, exporter } from '../../../lib/iam/exporter'
import { MONO } from '../../../lib/querygen/apparence'
import BoutonCopier from '../querygen/BoutonCopier'
import { Segments } from './ui'

const EXTENSIONS = { json: 'json', terraform: 'tf', cloudformation: 'yaml', cli: 'sh', yaml: 'yaml' }

export default function Export({ politique, type, T, S }) {
  const [format, setFormat] = useState('terraform')
  const [nom, setNom] = useState('ma-politique')
  const texte = useMemo(() => exporter(format, politique, { nom, type }), [format, politique, nom, type])
  const télécharger = () => {
    const url = URL.createObjectURL(new Blob([texte], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${nom || 'politique'}.${EXTENSIONS[format]}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div>
      <Segments aria="Format d'export" S={S} valeur={format} onChange={setFormat} options={FORMATS.map(([id, nomF]) => [id, nomF])} />
      <label style={{ display: 'block', margin: '10px 0', fontSize: 13, color: T.textMuted }}>Nom de la politique
        <input value={nom} onChange={e => setNom(e.target.value)} aria-label="Nom de la politique" autoCapitalize="off" spellCheck={false} style={{ ...S.champ, fontSize: 16, marginTop: 2 }} />
      </label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <BoutonCopier texte={texte} T={T} libellé="📋 Copier" aria={`Copier l'export ${format}`} />
        <button type="button" onClick={télécharger} style={{ ...S.puce(false), minHeight: 40 }}>⬇ Télécharger</button>
      </div>
      <pre aria-label={`Export ${format}`} style={{ margin: 0, padding: '10px 12px', borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, fontFamily: MONO, fontSize: 12.5, lineHeight: 1.5, overflowX: 'auto', whiteSpace: 'pre', maxHeight: 420 }}>{texte}</pre>
      <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.textMuted }}>Les variables de politique (<code>{'${aws:username}'}</code>) sont protégées dans Terraform (<code>{'$${…}'}</code>). Le script CLI utilise un « heredoc » entre apostrophes : le shell n'interprète rien.</p>
    </div>
  )
}
