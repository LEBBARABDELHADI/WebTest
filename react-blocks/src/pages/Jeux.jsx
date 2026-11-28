import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import Plateforme from '../components/jeux/Plateforme'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { PIÈCES_TOTAL } from '../lib/jeux/niveau1'

const CLÉ = 'react-blocs-jeux'
const lire = () => { try { return JSON.parse(localStorage.getItem(CLÉ) || '{}') } catch { return {} } }
const SUCCÈS = [
  ['premier', '🏁', 'Premier drapeau', 'Terminer le niveau 1', s => s.gagné],
  ['intact', '🛡️', 'Sans une égratignure', 'Terminer sans perdre de vie', s => s.gagné && s.mortsNiveau === 0],
  ['pièces', '🪙', 'Tout ramasser', `Collecter les ${PIÈCES_TOTAL} pièces en une partie`, s => s.pièces >= PIÈCES_TOTAL],
  ['écraseur', '👟', 'Écraseur', 'Écraser 5 ennemis en une partie', s => s.écrasés >= 5],
  ['rapide', '⚡', 'Éclair', 'Terminer en moins de 60 secondes', s => s.gagné && s.temps / 60 < 60],
]

export default function Jeux() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [params, setParams] = useSearchParams()
  const [profil, setProfil] = useState(lire)
  const jouer = params.get('jeu') === 'plateforme'
  const fin = useCallback(s => {
    const f = { gagné: s.statut === 'gagné', pièces: s.pièces, mortsNiveau: s.mortsNiveau, écrasés: s.écrasés, temps: s.temps }
    setProfil(p => {
      const débloqués = { ...(p.succès || {}) }
      for (const [id, , , , test] of SUCCÈS) if (test({ ...f, gagné: f.gagné })) débloqués[id] = débloqués[id] || new Date().toISOString().slice(0, 10)
      const n = { ...p, parties: (p.parties || 0) + 1, meilleur: Math.max(p.meilleur || 0, s.score), pièces: (p.pièces || 0) + s.pièces, succès: débloqués }
      try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* ignore */ }
      return n
    })
  }, [])
  const carte = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }
  const titre = { fontFamily: grotesk, fontSize: 11.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px' }
  const nbSuccès = Object.keys(profil.succès || {}).length
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          {jouer
            ? <button onClick={() => setParams({}, { replace: true })} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, background: 'none', border: 'none', cursor: 'pointer' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Mes jeux</button>
            : <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>}
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 12px', lineHeight: 1.1 }}>🎮 {jouer ? 'Super Plombier' : 'Jeux'}</h1>
        {jouer ? <Plateforme T={T} onFin={fin} /> : (
          <>
            <div style={{ ...carte, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: '#107c10', display: 'grid', placeItems: 'center', fontSize: 26 }}>🎮</div>
              <div style={{ flex: '1 1 160px' }}>
                <div style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 17 }}>{foyer.nom}</div>
                <div style={{ color: T.textMuted, fontSize: 13 }}>{profil.parties || 0} partie{(profil.parties || 0) > 1 ? 's' : ''} · meilleur score {profil.meilleur || 0}</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: grotesk, fontWeight: 800, color: '#107c10' }}>🏆 {nbSuccès}/{SUCCÈS.length}</div>
            </div>
            <h2 style={titre}>Mes jeux</h2>
            <button onClick={() => setParams({ jeu: 'plateforme' })} className="tuile-jeu" style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box', borderRadius: 16, overflow: 'hidden', border: `2px solid #107c10`, marginBottom: 18 }} aria-label="Lancer Super Plombier">
              <div style={{ height: 150, background: 'linear-gradient(#4aa8ff,#bfe6ff 62%,#3fae45 62%,#3fae45 72%,#9a5b2e 72%)', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '18%', bottom: '28%', fontSize: 38 }}>🏃</span>
                <span style={{ position: 'absolute', left: '52%', bottom: '28%', fontSize: 28 }}>🍄</span>
                <span style={{ position: 'absolute', right: '12%', top: '18%', fontSize: 26 }}>🪙</span>
              </div>
              <div style={{ background: '#107c10', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 16 }}>Super Plombier</span>
                <span style={{ fontSize: 13, opacity: .9 }}>Niveau 1 · ▶ Jouer</span>
              </div>
            </button>
            <h2 style={titre}>Succès</h2>
            <div style={carte}>
              {SUCCÈS.map(([id, emoji, nom, desc], k) => {
                const date = profil.succès?.[id]
                return (
                  <div key={id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: k < SUCCÈS.length - 1 ? `1px solid ${T.border}` : 'none', opacity: date ? 1 : .5 }}>
                    <span style={{ fontSize: 24, width: 32, textAlign: 'center', filter: date ? 'none' : 'grayscale(1)' }}>{emoji}</span>
                    <span style={{ flex: 1 }}><strong style={{ fontSize: 14.5 }}>{nom}</strong><br /><span style={{ color: T.textMuted, fontSize: 13 }}>{desc}</span></span>
                    <span style={{ fontSize: 12, color: '#107c10', fontWeight: 700 }}>{date ? `✓ ${date}` : '🔒'}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
