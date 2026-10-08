import { useState } from 'react'
import { grotesk } from '../lib/theme'
import { colorerCode, COULEURS_CODE } from '../lib/coloration'

const POLICE_CODE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

// Bloc de code coloré selon le langage, avec numéros de ligne. Toucher un
// numéro surligne la ligne (si onBasculerLigne est fourni).
export default function BlocCode({ code, langage, surlignées = [], onBasculerLigne, numéros = true, taille = 12.5 }) {
  const [copié, setCopié] = useState(false)
  const lignes = colorerCode(code || '', langage)
  const marquées = new Set(surlignées)
  const largeur = String(lignes.length).length

  const copier = async () => {
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopié(true)
    setTimeout(() => setCopié(false), 1500)
  }

  return (
    <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#0d0f14', border: '1px solid #1f2433' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px 5px 12px', background: '#151924', borderBottom: '1px solid #1f2433' }}>
        <span style={{ flex: 1, fontSize: '10.5px', color: '#8a94ad', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>{langage || 'Code'}</span>
        {onBasculerLigne && <span style={{ fontSize: '10px', color: '#5d6680', fontFamily: grotesk }}>n° = surligner</span>}
        <button onClick={copier} style={{
          padding: '3px 9px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: grotesk,
          background: copié ? '#4ade8033' : '#252836', color: copié ? '#4ade80' : '#94a3b8', border: `1px solid ${copié ? '#4ade80' : '#2d3148'}`,
        }}>{copié ? '✓ Copié' : 'Copier'}</button>
      </div>
      <pre style={{ margin: 0, padding: '8px 0', overflowX: 'auto', fontSize: `${taille}px`, lineHeight: 1.65, fontFamily: POLICE_CODE }}>
        <code style={{ display: 'block', minWidth: 'max-content' }}>
          {lignes.map((ligne, i) => {
            const n = i + 1
            const marquée = marquées.has(n)
            return (
              <div key={i} style={{
                display: 'flex', paddingRight: '14px',
                background: marquée ? 'rgba(255, 214, 10, .13)' : 'transparent',
                boxShadow: marquée ? 'inset 3px 0 0 #ffd60a' : 'none',
              }}>
                {numéros && (
                  <span
                    onClick={onBasculerLigne ? () => onBasculerLigne(n) : undefined}
                    role={onBasculerLigne ? 'button' : undefined}
                    aria-label={onBasculerLigne ? `${marquée ? 'Ne plus surligner' : 'Surligner'} la ligne ${n}` : undefined}
                    style={{
                      width: `${largeur + 2.2}ch`, flexShrink: 0, textAlign: 'right', paddingRight: '1.2ch', userSelect: 'none', WebkitUserSelect: 'none',
                      color: marquée ? '#ffd60a' : '#4b5470', cursor: onBasculerLigne ? 'pointer' : 'default',
                    }}
                  >{n}</span>
                )}
                <span style={{ whiteSpace: 'pre', paddingLeft: numéros ? 0 : '14px', color: COULEURS_CODE.texte }}>
                  {ligne.length === 0 ? ' ' : ligne.map((m, j) => (
                    <span key={j} style={{ color: COULEURS_CODE[m.type], fontStyle: m.type === 'commentaire' ? 'italic' : 'normal' }}>{m.texte}</span>
                  ))}
                </span>
              </div>
            )
          })}
        </code>
      </pre>
    </div>
  )
}
