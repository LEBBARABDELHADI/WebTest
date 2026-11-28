import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'

export default function Jeux() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 4px', lineHeight: 1.1 }}>🎮 Jeux</h1>
        <p style={{ color: T.textMuted, fontSize: 14, margin: '0 0 16px', lineHeight: 1.55 }}>Cet espace accueillera tes jeux.</p>
        <div style={{ background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 16, padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 14.5 }}>Aucun jeu pour l'instant.</div>
      </div>
    </div>
  )
}
