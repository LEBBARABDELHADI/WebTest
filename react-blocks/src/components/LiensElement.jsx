import { useState } from 'react'
import { Link } from 'react-router-dom'
import { grotesk } from '../lib/theme'
import { lireLocal } from '../lib/donneesFoyer'
import RechercheGlobale from './RechercheGlobale'

const ICÔNE = { tâche: '✔︎', note: '📝', carte: '🧠', graphe: '🕸️', bulle: '🫧', section: '📄', paquet: '🧠' }

// Liens d'un élément (tâche, note, bulle, paquet) vers d'autres éléments
// de l'app : puces cliquables, ✕ pour retirer, « ＋ Lier » pour en choisir
// un avec la recherche. liens : [{ type, titre, lien, espace }]
export default function LiensÉlément({ T, liens = [], onChange, foyer, compact = false }) {
  const [choix, setChoix] = useState(false)
  const ajouter = r => {
    if (liens.some(l => l.lien === r.lien)) return
    onChange([...liens, { type: r.type, titre: (r.titre || '').slice(0, 80), lien: r.lien, espace: r.espace }])
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
      {!compact && <span style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk, marginRight: '2px' }}>Liens</span>}
      {liens.map(l => (
        <span key={l.lien} style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%', borderRadius: '20px', background: `${T.accent}1f`, border: `1px solid ${T.accent}66` }}>
          <Link to={l.lien} title={`${l.titre} (${l.espace || ''})`} style={{ padding: '3px 4px 3px 9px', fontSize: '12px', color: T.text, fontFamily: grotesk, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px', textDecoration: 'none' }}>
            {ICÔNE[l.type] || '🔗'} {l.titre || 'Élément'}
          </Link>
          <button onClick={() => onChange(liens.filter(x => x.lien !== l.lien))} aria-label={`Retirer le lien vers ${l.titre}`} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '12px', padding: '3px 8px 3px 2px' }}>✕</button>
        </span>
      ))}
      <button onClick={() => setChoix(true)} style={{ padding: '3px 10px', borderRadius: '20px', border: `1px dashed ${T.border}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: '12px', fontFamily: grotesk, fontWeight: 600 }}>🔗 Lier</button>
      {choix && (
        <RechercheGlobale T={T} lire={lireLocal} foyer={foyer} titre="Lier à… (tâche, note, carte, graphe, bulle, section)" onChoisir={ajouter} onFermer={() => setChoix(false)} />
      )}
    </div>
  )
}
