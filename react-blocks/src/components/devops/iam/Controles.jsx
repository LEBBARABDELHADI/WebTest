// Contrôles : constats de la validation (erreurs, sécurité, avertissements…), taille, correctifs applicables.
import { grotesk } from '../../../lib/theme'
import { Pastille } from './ui'

const NIVEAUX = {
  erreur: ['❌', '#dc2626', 'Erreur'],
  sécurité: ['🛡️', '#c2410c', 'Sécurité'],
  avertissement: ['⚠️', '#d97706', 'Avertissement'],
  suggestion: ['💡', '#2563eb', 'Suggestion'],
  info: ['ℹ️', '#6b7280', 'Information'],
}

export default function Controles({ rapport, lecture, onCorriger, onAller, T, S }) {
  if (!rapport) return <p style={{ margin: 0, fontSize: 14, color: T.textMuted }}>Analyse en attente…</p>
  const r = rapport.résumé
  const tout = rapport.constats
  const ligne = c => {
    if (c.ligneDirecte) return c.ligneDirecte.ligne
    if (c.chemin && lecture?.où) return lecture.où(c.chemin.filter(x => x !== '#clé'), c.chemin.includes('#clé'))?.ligne ?? lecture.où(c.chemin.slice(0, 2))?.ligne
    return null
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <Pastille couleur={r.erreurs ? '#dc2626' : '#2e9e6b'}>{r.erreurs ? `❌ ${r.erreurs} erreur${r.erreurs > 1 ? 's' : ''}` : '✅ Aucune erreur'}</Pastille>
        {r.sécurité > 0 && <Pastille couleur="#c2410c">🛡️ {r.sécurité} sécurité</Pastille>}
        {r.avertissements > 0 && <Pastille couleur="#d97706">⚠️ {r.avertissements} avertissement{r.avertissements > 1 ? 's' : ''}</Pastille>}
        {r.suggestions > 0 && <Pastille couleur="#2563eb">💡 {r.suggestions}</Pastille>}
        {r.infos > 0 && <Pastille couleur="#6b7280">ℹ️ {r.infos}</Pastille>}
      </div>
      {rapport.limites.length > 0 && (
        <p style={{ margin: '0 0 8px', fontSize: 13, color: T.textMuted }}>
          Taille : <strong style={{ color: T.text }}>{rapport.taille.toLocaleString('fr-FR')}</strong> caractères (espaces exclus) ·{' '}
          {rapport.limites.map(l => <span key={l.nom} style={{ marginRight: 8, color: l.ok ? T.textMuted : '#dc2626' }}>{l.ok ? '✓' : '✗'} {l.nom} ({l.max.toLocaleString('fr-FR')})</span>)}
        </p>
      )}
      {!tout.length && <p style={{ margin: 0, fontSize: 14 }}>Aucun constat : la politique est cohérente avec les données AWS (services, actions, ressources, clés de condition).</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {tout.map((c, k) => {
          const [icône, couleur, nom] = NIVEAUX[c.niveau]
          const l = ligne(c)
          return (
            <li key={`${c.code}-${k}`} style={{ border: `1px solid ${couleur}55`, borderLeft: `4px solid ${couleur}`, borderRadius: 10, padding: '8px 10px', background: T.bg }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span aria-hidden="true">{icône}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}><span className="sr-only">{nom} : </span>{c.message}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                    <code style={{ fontFamily: grotesk, fontSize: 11.5, color: couleur, fontWeight: 800 }}>{c.code}</code>
                    {l && <button type="button" onClick={() => onAller(l)} style={{ ...S.puce(false), minHeight: 30, fontSize: 12, padding: '0 10px' }}>Aller à la ligne {l}</button>}
                    {c.correctif && <button type="button" onClick={() => onCorriger(c)} style={{ ...S.puce(true), minHeight: 30, fontSize: 12, padding: '0 10px' }}>🔧 {c.correctif.libellé}</button>}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
