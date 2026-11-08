// Styles communs des visuels pédagogiques (pages pilotes 6 et 7).
export const or = '#ffd166', crème = '#fff3c4'
// Sous la bande noire du haut et le badge FICTION / OFFICIEL.
export const HAUT = 'calc(clamp(22px, 6.5vh, 66px) + 28px)'
export const boîte = { position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 'min(94%, 980px)', pointerEvents: 'none' }
export const pastille = (actif = true) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 'clamp(5px, 1vw, 9px) clamp(10px, 1.6vw, 16px)', borderRadius: 24, background: 'rgba(14,12,32,.84)', border: `2px solid ${actif ? or : 'rgba(255,255,255,.2)'}`, color: crème, fontFamily: 'Georgia, serif', fontSize: 'clamp(13px, 2vw, 20px)', boxShadow: actif ? '0 0 24px rgba(255,209,102,.35)' : 'none' })
