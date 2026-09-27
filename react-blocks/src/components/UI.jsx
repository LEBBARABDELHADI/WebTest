import Icon from './Icon'
import { useTheme, grotesk } from '../lib/theme'

export function BoutonIcone({ icon, onClick, title, couleur, taille = 15 }) {
  const T = useTheme()
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', borderRadius: '7px',
        color: couleur || T.textMuted, cursor: 'pointer', flexShrink: 0,
      }}
    >
      <Icon nom={icon} taille={taille} />
    </button>
  )
}

export function Repli({ icon, texte, ouvert, onToggle, marginBottom }) {
  const T = useTheme()
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px',
        padding: '10px 12px', marginBottom, cursor: 'pointer',
      }}
    >
      {icon}
      <span style={{ fontSize: '12px', color: T.textMuted, flex: 1, textAlign: 'left', fontFamily: grotesk }}>{texte}</span>
      <Icon nom="chevronBas" taille={14} style={{ color: T.textMuted, transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
    </button>
  )
}
