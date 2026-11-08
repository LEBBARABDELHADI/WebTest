import { grotesk } from './theme'

export const SECTIONS_PILOTAGE = [
  ['journee', '🌅', 'Ma journée'],
  ['semaine', '📝', 'Ma semaine'],
  ['annee', '🎯', 'Mon année'],
  ['lire', '📚', 'À lire'],
]

export function stylesPilotage(T) {
  return {
    page: { background: T.bg, minHeight: '100dvh', padding: 'max(18px, env(safe-area-inset-top)) 16px 70px', color: T.text },
    carte: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 },
    titre: { fontFamily: grotesk, fontSize: 11.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 },
    champ: { width: '100%', boxSizing: 'border-box', minHeight: 44, padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 16, fontFamily: 'inherit' },
    bouton: (plein = false) => ({ minHeight: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${plein ? T.accent : T.border}`, background: plein ? T.accent : T.surface, color: plein ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }),
    puce: actif => ({ minHeight: 36, padding: '0 12px', borderRadius: 18, border: `1px solid ${actif ? T.accent : T.border}`, background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }),
    discret: { color: T.textMuted, fontSize: 13.5, margin: 0, lineHeight: 1.5 },
    lien: { color: T.accent, fontFamily: grotesk, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' },
  }
}
