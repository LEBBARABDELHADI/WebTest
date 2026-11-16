import { grotesk } from '../../../lib/theme'
import { STATUTS } from '../../../lib/querygen/apparence'

// Pastille de statut d'une requête (vérifiée, exécutée, différente, erreur…).
export default function Badge({ statut }) {
  const s = STATUTS[statut] || STATUTS.modifiée
  return <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: `${s.couleur}22`, color: s.couleur, fontFamily: grotesk, fontWeight: 800, fontSize: 12.5, whiteSpace: 'nowrap' }}>{s.icône} {s.nom}</span>
}
