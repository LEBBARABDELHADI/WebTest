import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import Plateforme from '../components/jeux/Plateforme'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { NIVEAUX } from '../lib/jeux/niveaux'

const CLÉ = 'react-blocs-jeux'
const GB = { fond: '#0f380f', moyen: '#306230', clair: '#8bac0f', pâle: '#9bbc0f' }
const mono = { fontFamily: 'ui-monospace, "Courier New", monospace', textTransform: 'uppercase', letterSpacing: '.04em' }

// Lecture robuste : une sauvegarde illisible n'est jamais écrasée (copie de secours), une ancienne version est conservée telle quelle.
function lire() {
  try {
    const brut = localStorage.getItem(CLÉ)
    if (!brut) return { version: 2, niveaux: {}, succès: {} }
    try { const p = JSON.parse(brut); return { niveaux: {}, succès: {}, ...p, version: 2 } } catch {
      localStorage.setItem(CLÉ + '.sauvegarde', brut)
      return { version: 2, niveaux: {}, succès: {}, avertissement: true }
    }
  } catch { return { version: 2, niveaux: {}, succès: {} } }
}
const écrire = p => { try { localStorage.setItem(CLÉ, JSON.stringify(p)) } catch { /* stockage indisponible */ } }

const SUCCÈS = [
  ['premier', '🏁', 'Premier drapeau', 'Terminer un niveau', b => b.statut === 'gagné'],
  ['intact', '🛡️', 'Sans une égratignure', 'Terminer un niveau sans perdre de vie', b => b.statut === 'gagné' && b.mortsNiveau === 0],
  ['pièces', '🪙', 'Tout ramasser', 'Collecter toutes les pièces d\'un niveau', b => b.pièces >= b.total],
  ['écraseur', '👟', 'Écraseur', 'Écraser 5 ennemis dans un niveau', b => b.écrasés >= 5],
  ['champi', '🍄', 'Gourmand', 'Attraper un champignon', b => b.aGrandi],
  ['éclair', '⚡', 'Éclair', 'Terminer un niveau en moins de 60 s', b => b.statut === 'gagné' && b.temps / 60 < 60],
  ['parfait', '🌟', 'Perfectionniste', 'Obtenir 3 étoiles sur un niveau', b => b.statut === 'gagné' && b.étoiles === 3],
  ['secrets', '🔍', 'Chasseur de secrets', 'Trouver tous les secrets d\'un niveau', b => b.statut === 'gagné' && b.secretsTotal > 0 && b.secrets >= b.secretsTotal],
  ['combo', '🔥', 'Enchaînement', 'Écraser 4 ennemis d\'affilée sans toucher le sol', b => b.comboMax >= 4],
]
const SUCCÈS_GLOBAL = [['maître', '👑', 'Maître plombier', 'Obtenir les 9 étoiles', p => Object.values(p.niveaux || {}).reduce((a, x) => a + (x.étoiles || 0), 0) >= NIVEAUX.length * 3]]
const TOUS = [...SUCCÈS, ...SUCCÈS_GLOBAL]
const CRITÈRES = [['terminé', 'Terminer le niveau'], ['pièces', 'Collecter 80 % des pièces'], ['sansMort', 'Terminer sans perdre de vie']]

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
      const jour = new Date().toISOString().slice(0, 10)
      for (const [id, , , , test] of SUCCÈS) if (test(b)) sucs[id] = sucs[id] || jour
      const anc = (p.niveaux || {})[b.niveau] || {}
      const gagné = b.statut === 'gagné'
      const crit = { ...(anc.crit || {}) }
      if (gagné) for (const k of ['terminé', 'pièces', 'sansMort']) crit[k] = crit[k] || b.critères[k]
      const maj = { ...(p.niveaux || {}), [b.niveau]: { ...anc, étoiles: Math.max(anc.étoiles || 0, gagné ? b.étoiles : 0), meilleur: Math.max(anc.meilleur || 0, b.score), temps: gagné ? Math.min(anc.temps || Infinity, b.temps) : anc.temps, crit, secrets: Math.max(anc.secrets || 0, b.secrets || 0) } }
      const nv = { ...p, version: 2, parties: (p.parties || 0) + 1, meilleur: Math.max(p.meilleur || 0, b.score), succès: sucs, niveaux: maj }
      for (const [id, , , , test] of SUCCÈS_GLOBAL) if (test(nv)) nv.succès[id] = nv.succès[id] || jour
      écrire(nv)
      return nv
    })
  }, [])
  const carte = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }
  const titre = { fontFamily: grotesk, fontSize: 11.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px' }
  const nbSuccès = Object.keys(profil.succès || {}).length
  const totalÉtoiles = Object.values(niveaux).reduce((a, x) => a + (x.étoiles || 0), 0)
  const lancer = i => setParams({ jeu: 'plateforme', niveau: String(i + 1) })
  const menu = () => setParams({}, { replace: true })
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          {jouer
            ? <button type="button" onClick={menu} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, background: 'none', border: 'none', cursor: 'pointer' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Mes jeux</button>
            : <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>}
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 12px', lineHeight: 1.1 }}>🎮 {jouer ? `Super Plombier · ${NIVEAUX[n].nom}` : 'Jeux'}</h1>
        {profil.avertissement && !jouer && <div role="alert" style={{ ...carte, borderColor: '#d97706', fontSize: 13 }}>Ta sauvegarde n'a pas pu être lue. Elle n'a pas été supprimée : une copie est conservée dans ce navigateur (clé « {CLÉ}.sauvegarde »).</div>}
        {jouer ? (
          <Plateforme key={n} niveau={n} aSuivant={n < NIVEAUX.length - 1} meilleur={niveaux[n]} profilNiveaux={niveaux} onFin={fin} onSuivant={() => lancer(n + 1)} onMenu={menu} />
        ) : (
          <>
            <div style={{ ...carte, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: '#107c10', display: 'grid', placeItems: 'center', fontSize: 26 }}>🎮</div>
              <div style={{ flex: '1 1 160px' }}>
                <div style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 17 }}>{foyer.nom}</div>
                <div style={{ color: T.textMuted, fontSize: 13 }}>{profil.parties || 0} partie{(profil.parties || 0) > 1 ? 's' : ''} · meilleur score {profil.meilleur || 0}</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: grotesk, fontWeight: 800, color: '#107c10', lineHeight: 1.5 }}>⭐ {totalÉtoiles}/{NIVEAUX.length * 3}<br />🏆 {nbSuccès}/{TOUS.length}</div>
            </div>
            <h2 style={titre}>Super Plombier — choisis un niveau</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 18 }}>
              {NIVEAUX.map((nv, i) => {
                const ok = débloqué(i), d = niveaux[i] || {}, st = d.étoiles || 0, crit = d.crit
                const manquant = CRITÈRES.filter(([k]) => !crit?.[k])
                return (
                  <div key={nv.nom} style={{ border: `3px solid ${ok ? GB.moyen : T.border}`, background: GB.fond, color: GB.pâle, opacity: ok ? 1 : .6, ...mono }}>
                    <button type="button" disabled={!ok} onClick={() => lancer(i)} aria-label={ok ? `Lancer le niveau ${i + 1}, ${nv.nom}` : `Niveau ${i + 1} verrouillé : termine le niveau ${i} d'abord`}
                      style={{ all: 'unset', cursor: ok ? 'pointer' : 'not-allowed', display: 'block', width: '100%', boxSizing: 'border-box', padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, fontSize: 15 }}>
                        <span>{ok ? '' : '🔒 '}{i + 1}. {nv.nom}</span>
                        <span aria-label={`${st} étoiles sur 3`} style={{ letterSpacing: 3 }}>{[1, 2, 3].map(k => <span key={k} style={{ color: k <= st ? GB.pâle : GB.moyen }}>★</span>)}</span>
                      </div>
                      <div style={{ fontSize: 11, marginTop: 6, opacity: .9 }}>{ok ? (d.meilleur ? `Record ${d.meilleur}${d.temps ? ` · ${Math.floor(d.temps / 60)} s` : ''}${d.secrets ? ` · secrets ${d.secrets}` : ''}` : 'Pas encore joué') : `Termine le niveau ${i} pour débloquer`}</div>
                    </button>
                    {ok && (
                      <ul style={{ listStyle: 'none', margin: 0, padding: '0 12px 12px', fontSize: 11, lineHeight: 1.6 }}>
                        {CRITÈRES.map(([k, txt]) => <li key={k} style={{ opacity: crit?.[k] ? 1 : .7 }}>{crit?.[k] ? '★' : '☆'} {txt}</li>)}
                        {st > 0 && manquant.length > 0 && !crit && <li style={{ opacity: .7 }}>Étoiles obtenues avant le suivi détaillé : rejoue pour afficher les critères.</li>}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
            <h2 style={titre}>Succès</h2>
            <div style={carte}>
              {TOUS.map(([id, emoji, nom, desc], k) => {
                const date = profil.succès?.[id]
                return (
                  <div key={id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: k < TOUS.length - 1 ? `1px solid ${T.border}` : 'none', opacity: date ? 1 : .5 }}>
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
