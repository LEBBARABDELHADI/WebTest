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

export function Repli({ icon, texte, ouvert, onToggle, marginBottom, onMasquer }) {
  const T = useTheme()
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '4px', width: '100%',
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px',
        padding: '4px 6px 4px 12px', marginBottom,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0,
          background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer', textAlign: 'left',
        }}
      >
        {icon}
        <span style={{ fontSize: '12px', color: T.textMuted, flex: 1, textAlign: 'left', fontFamily: grotesk }}>{texte}</span>
      </button>
      {onMasquer && <BoutonIcone icon="x" title="Masquer cette section" taille={13} onClick={onMasquer} />}
      <button
        onClick={onToggle}
        aria-label={ouvert ? 'Replier' : 'Déplier'}
        style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: '6px', cursor: 'pointer', flexShrink: 0 }}
      >
        <Icon nom="chevronBas" taille={14} style={{ color: T.textMuted, transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
    </div>
  )
}
