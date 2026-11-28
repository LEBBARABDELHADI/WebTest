import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import Plateforme from '../components/jeux/Plateforme'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { NIVEAUX } from '../lib/jeux/niveaux'

const CLÉ = 'react-blocs-jeux'
const lire = () => { try { return JSON.parse(localStorage.getItem(CLÉ) || '{}') } catch { return {} } }
const SUCCÈS = [
  ['premier', '🏁', 'Premier drapeau', 'Terminer un niveau', b => b.statut === 'gagné'],
  ['intact', '🛡️', 'Sans une égratignure', 'Terminer un niveau sans perdre de vie', b => b.statut === 'gagné' && b.mortsNiveau === 0],
  ['pièces', '🪙', 'Tout ramasser', 'Collecter toutes les pièces d\'un niveau', b => b.pièces >= b.total],
  ['écraseur', '👟', 'Écraseur', 'Écraser 5 ennemis dans un niveau', b => b.écrasés >= 5],
  ['champi', '🍄', 'Gourmand', 'Attraper un champignon', b => b.aGrandi],
  ['éclair', '⚡', 'Éclair', 'Terminer un niveau en moins de 60 s', b => b.statut === 'gagné' && b.temps / 60 < 60],
  ['parfait', '🌟', 'Perfectionniste', 'Obtenir 3 étoiles sur un niveau', b => b.statut === 'gagné' && b.étoiles === 3],
]

export default function Jeux() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [params, setParams] = useSearchParams()
  const [profil, setProfil] = useState(lire)
  const n = Math.max(1, Math.min(NIVEAUX.length, parseInt(params.get('niveau'), 10) || 1)) - 1
  const jouer = params.get('jeu') === 'plateforme'
  const niveaux = profil.niveaux || {}
  const débloqué = i => i === 0 || (niveaux[i - 1]?.étoiles || 0) > 0
  const fin = useCallback(b => {
    setProfil(p => {
      const sucs = { ...(p.succès || {}) }
      for (const [id, , , , test] of SUCCÈS) if (test(b)) sucs[id] = sucs[id] || new Date().toISOString().slice(0, 10)
      const anc = (p.niveaux || {})[n] || {}
      const maj = { ...(p.niveaux || {}), [n]: { étoiles: Math.max(anc.étoiles || 0, b.statut === 'gagné' ? b.étoiles : 0), meilleur: Math.max(anc.meilleur || 0, b.score), temps: b.statut === 'gagné' ? Math.min(anc.temps || Infinity, b.temps) : anc.temps } }
      const nv = { ...p, parties: (p.parties || 0) + 1, meilleur: Math.max(p.meilleur || 0, b.score), succès: sucs, niveaux: maj }
      try { localStorage.setItem(CLÉ, JSON.stringify(nv)) } catch { /* ignore */ }
      return nv
    })
  }, [n])
  const carte = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }
  const titre = { fontFamily: grotesk, fontSize: 11.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px' }
  const nbSuccès = Object.keys(profil.succès || {}).length
  const totalÉtoiles = Object.values(niveaux).reduce((a, x) => a + (x.étoiles || 0), 0)
  const lancer = i => setParams({ jeu: 'plateforme', niveau: String(i + 1) })
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          {jouer
            ? <button onClick={() => setParams({}, { replace: true })} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, background: 'none', border: 'none', cursor: 'pointer' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Mes jeux</button>
            : <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>}
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 12px', lineHeight: 1.1 }}>🎮 {jouer ? `Super Plombier · ${NIVEAUX[n].nom}` : 'Jeux'}</h1>
        {jouer ? (
          <Plateforme key={n} T={T} niveau={n} aSuivant={n < NIVEAUX.length - 1} onFin={fin} onSuivant={() => lancer(n + 1)} onMenu={() => setParams({}, { replace: true })} />
        ) : (
          <>
            <div style={{ ...carte, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: '#107c10', display: 'grid', placeItems: 'center', fontSize: 26 }}>🎮</div>
              <div style={{ flex: '1 1 160px' }}>
                <div style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 17 }}>{foyer.nom}</div>
                <div style={{ color: T.textMuted, fontSize: 13 }}>{profil.parties || 0} partie{(profil.parties || 0) > 1 ? 's' : ''} · meilleur score {profil.meilleur || 0}</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: grotesk, fontWeight: 800, color: '#107c10', lineHeight: 1.5 }}>⭐ {totalÉtoiles}/{NIVEAUX.length * 3}<br />🏆 {nbSuccès}/{SUCCÈS.length}</div>
            </div>
            <h2 style={titre}>Super Plombier — choisis un niveau</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 18 }}>
              {NIVEAUX.map((nv, i) => {
                const ok = débloqué(i), st = niveaux[i]?.étoiles || 0
                return (
                  <button key={nv.nom} disabled={!ok} onClick={() => lancer(i)} aria-label={ok ? `Lancer le niveau ${i + 1}, ${nv.nom}` : `Niveau ${i + 1} verrouillé`}
                    style={{ all: 'unset', cursor: ok ? 'pointer' : 'not-allowed', display: 'block', boxSizing: 'border-box', borderRadius: 16, overflow: 'hidden', border: `2px solid ${ok ? '#107c10' : T.border}`, opacity: ok ? 1 : .55 }}>
                    <div style={{ height: 110, background: `linear-gradient(${nv.thème.ciel[0]},${nv.thème.ciel[1]} 62%,${nv.thème.herbe[0]} 62%,${nv.thème.herbe[0]} 72%,${nv.thème.terre} 72%)`, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16%', bottom: '28%', fontSize: 30 }}>{ok ? '🏃' : '🔒'}</span>
                      <span style={{ position: 'absolute', right: '14%', bottom: '28%', fontSize: 24 }}>{i === 1 ? '🌵' : i === 2 ? '🌙' : '🍄'}</span>
                    </div>
                    <div style={{ background: ok ? '#107c10' : T.surface2, color: ok ? '#fff' : T.textMuted, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 15 }}>{i + 1}. {nv.nom}</span>
                      <span style={{ letterSpacing: 2 }} aria-label={`${st} étoiles sur 3`}>{[1, 2, 3].map(k => <span key={k} style={{ color: k <= st ? '#ffd23f' : 'rgba(255,255,255,.35)' }}>★</span>)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
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
