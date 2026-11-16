import { useState } from 'react'
import { grotesk } from '../../../lib/theme'

// Bouton « Copier » : confirme brièvement dans le bouton lui-même.
export default function BoutonCopier({ texte, T, libellé = '📋 Copier', aria }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(texte).catch(() => {}); setOk(true); setTimeout(() => setOk(false), 1200) }}
      aria-label={aria || libellé}
      style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: ok ? '#2e9e6b' : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
    >{ok ? '✓ Copié' : libellé}</button>
  )
}
