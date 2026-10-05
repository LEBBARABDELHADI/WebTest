import { useState } from 'react'
import { useTheme, grotesk, serif } from '../lib/theme'
import Icon from './Icon'

// Duplique un paquet dans l'espace courant, ou le copie vers un autre
// espace (l'autre foyer, ou perso ↔ pro). `onCopier(espaceId)` renvoie une
// promesse ; la copie part avec une progression remise à zéro.
export default function CopiePaquet({ paquet, nbCartes, destinations, peutCopier, onDupliquerIci, onCopier, onFermer }) {
  const T = useTheme()
  const [enCours, setEnCours] = useState(null)
  const [message, setMessage] = useState(null) // { ok, texte }

  const copier = async destination => {
    setEnCours(destination.id)
    setMessage(null)
    try {
      const { nom } = await onCopier(destination.id)
      setMessage({ ok: true, texte: `« ${nom} » (${nbCartes} carte${nbCartes > 1 ? 's' : ''}) a été copié dans ${destination.libellé}.` })
    } catch (err) {
      setMessage({ ok: false, texte: `Copie impossible : ${err.message}` })
    } finally {
      setEnCours(null)
    }
  }

  const ligne = {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '12px 14px',
    borderRadius: '12px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
  }

  return (
    <div role="dialog" aria-label="Dupliquer ou copier le paquet" onClick={onFermer} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '480px', background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: T.accent, fontFamily: grotesk, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Dupliquer ou copier</p>
            <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '19px', color: T.text }}>{paquet.nom}</strong>
          </div>
          <button onClick={onFermer} aria-label="Fermer" style={{
            width: '32px', height: '32px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer',
          }}><Icon nom="x" taille={13} /></button>
        </div>

        <button onClick={() => { onDupliquerIci(); onFermer() }} style={ligne}>
          <Icon nom="dupliquer" taille={16} />
          <span style={{ flex: 1 }}>Dans cet espace <span style={{ color: T.textMuted, fontSize: '12px' }}>(« {paquet.nom} (copie) »)</span></span>
        </button>

        <p style={{ margin: '6px 0 0', fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>
          Copier vers un autre espace
        </p>
        {!peutCopier && (
          <p style={{ margin: 0, fontSize: '12px', color: T.textMuted, lineHeight: 1.5 }}>
            Connecte le token GitHub (en haut de la page) pour copier vers un autre espace.
          </p>
        )}
        {destinations.map(d => (
          <button key={d.id} onClick={() => copier(d)} disabled={!peutCopier || enCours !== null} style={{
            ...ligne, opacity: !peutCopier ? 0.5 : 1, cursor: peutCopier ? 'pointer' : 'default',
          }}>
            <Icon nom="televerser" taille={16} />
            <span style={{ flex: 1 }}>{d.libellé}</span>
            {enCours === d.id && <span style={{ fontSize: '12px', color: T.textMuted }}>⏳</span>}
          </button>
        ))}
        {message && (
          <p role="status" style={{ margin: '4px 0 0', fontSize: '12.5px', lineHeight: 1.5, color: message.ok ? '#7fb069' : T.danger }}>
            {message.ok ? '✓ ' : ''}{message.texte}
          </p>
        )}
        <p style={{ margin: '2px 0 0', fontSize: '11px', color: T.textMuted, lineHeight: 1.5 }}>
          La copie repart de zéro (aucune carte déjà apprise) et chaque espace garde ensuite sa propre progression.
        </p>
      </div>
    </div>
  )
}
