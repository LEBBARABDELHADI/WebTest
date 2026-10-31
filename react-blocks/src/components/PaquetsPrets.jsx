import { grotesk, serif } from '../lib/theme'
import { PAQUETS_PRÊTS } from '../lib/paquetsPrets'

// Fenêtre plein écran commune aux outils de Mémoriser (paquets prêts,
// examen blanc, oral).
export function FenêtreMémo({ T, titre, onFermer, children, large = 560 }) {
  return (
    <div role="dialog" aria-label={titre} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 'max(16px, env(safe-area-inset-top)) 12px 24px' }}
      onClick={e => { if (e.target === e.currentTarget) onFermer() }}>
      <div style={{ width: '100%', maxWidth: large, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '18px 16px 20px', boxShadow: '0 20px 50px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <h2 style={{ flex: 1, margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '22px', color: T.text }}>{titre}</h2>
          <button onClick={onFermer} aria-label="Fermer" style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Bibliothèque : ajoute un paquet prêt, ou le complète (cartes manquantes,
// repérées par leur recto) s'il a déjà été ajouté.
export default function PaquetsPrêts({ T, data, onAjouter, onFermer }) {
  return (
    <FenêtreMémo T={T} titre="📚 Paquets prêts" onFermer={onFermer}>
      <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
        Des cartes déjà écrites, à réviser tout de suite. Les commandes s'affichent comme du code, avec un bouton <strong>Copier</strong>.
        Tu peux ensuite modifier ou compléter chaque carte.
      </p>
      {PAQUETS_PRÊTS.map(cat => (
        <section key={cat.catégorie} style={{ marginBottom: '16px' }}>
          <p style={{ fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.accent, margin: '0 0 8px' }}>{cat.catégorie}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {cat.paquets.map(m => {
              const existant = data.paquets.find(p => p.modèle === m.id)
              const rectos = new Set(data.cartes.filter(c => c.paquetId === existant?.id).map(c => c.recto))
              const manquantes = existant ? m.cartes.filter(([r]) => !rectos.has(r)).length : m.cartes.length
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: T.surface, border: `1px solid ${T.border}` }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.couleur, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontFamily: grotesk, fontSize: '14px', color: T.text }}>{m.nom}</strong>
                    <span style={{ fontSize: '11.5px', color: T.textMuted }}>{m.cartes.length} cartes{m.oral ? ' · oral chronométré' : ''}</span>
                  </span>
                  {existant && manquantes === 0
                    ? <span style={{ fontSize: '12px', color: T.accent, fontFamily: grotesk, fontWeight: 700 }}>✓ Ajouté</span>
                    : (
                      <button onClick={() => onAjouter(m)} style={{ minHeight: 36, padding: '0 14px', borderRadius: '18px', border: 'none', background: T.accent, color: T.accentText, fontWeight: 700, fontFamily: grotesk, fontSize: '12.5px', cursor: 'pointer', flexShrink: 0 }}>
                        {existant ? `Compléter (+${manquantes})` : 'Ajouter'}
                      </button>
                    )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </FenêtreMémo>
  )
}
