import { Link } from 'react-router-dom'
import Icon from './Icon'
import { BoutonIcone } from './UI'
import { grotesk, serif, useThemeMode } from '../lib/theme'
import { SECTIONS_PILOTAGE } from '../lib/stylesPilotage'

// Barre de progression accessible.
export function Barre({ T, taux, couleur, repère, nom, hauteur = 8 }) {
  const p = Math.round(Math.max(0, Math.min(1, taux || 0)) * 100)
  return (
    <div role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={nom} style={{ position: 'relative', height: hauteur, borderRadius: hauteur, background: T.surface2, overflow: 'visible' }}>
      <div style={{ width: `${p}%`, height: '100%', borderRadius: hauteur, background: couleur || T.accent, transition: 'width .4s' }} />
      {repère != null && <div title="Où tu devrais en être aujourd'hui" style={{ position: 'absolute', top: -3, bottom: -3, left: `${Math.round(repère * 100)}%`, width: 2, background: T.text, opacity: 0.55, borderRadius: 1 }} />}
    </div>
  )
}

// En-tête commun : retour à l'accueil, navigation entre les 4 sections,
// thème. `espace` sert aux liens (le foyer y est inclus).
export default function EnTetePilotage({ T, foyer, actif, titre, sousTitre, espace, droite }) {
  const { mode, basculer } = useThemeMode()
  const base = `${foyer.préfixe}perso`
  return (
    <header style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {droite}
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
      </div>
      <nav aria-label="Pilotage" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
        {SECTIONS_PILOTAGE.map(([id, emoji, nom]) => {
          const vers = `/${id}/${id === 'lire' ? (espace || base) : base}`
          const est = id === actif
          return (
            <Link key={id} to={vers} aria-current={est ? 'page' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 14px', borderRadius: 20, flexShrink: 0, textDecoration: 'none',
              fontFamily: grotesk, fontWeight: 700, fontSize: 13.5,
              background: est ? T.accent : T.surface, color: est ? T.accentText : T.text, border: `1px solid ${est ? T.accent : T.border}`,
            }}><span aria-hidden="true">{emoji}</span>{nom}</Link>
          )
        })}
      </nav>
      <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 36px)', margin: 0, lineHeight: 1.1 }}>{titre}</h1>
      {sousTitre && <p style={{ margin: '6px 0 0', color: T.textMuted, fontSize: 14.5, lineHeight: 1.5 }}>{sousTitre}</p>}
    </header>
  )
}
