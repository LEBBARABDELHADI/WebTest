import { useState } from 'react'
import { useTheme, grotesk } from '../lib/theme'
import { Repli } from './UI'
import Icon from './Icon'

const LIBELLÉS = {
  lecture: 'Lecture depuis le dépôt…',
  'lecture-seule': 'Lecture seule — pas de token connecté',
  chargement: 'Lecture depuis GitHub…',
  synchronisation: 'Synchronisation en cours…',
  connecté: 'Synchronisé avec GitHub',
}

// Ligne d'état de synchronisation repliable, avec saisie du token GitHub.
export default function PanneauSync({ statut, erreur, token, connecter, déconnecter, nomFichier, marginBottom = '14px', ouvertAuDépart = false }) {
  const T = useTheme()
  const [ouvert, setOuvert] = useState(ouvertAuDépart)
  const [saisie, setSaisie] = useState('')
  const couleur = { connecté: '#7fb069', erreur: T.danger, chargement: T.accent, synchronisation: T.accent }[statut] || T.textMuted
  return (
    <>
      <Repli
        icon={<span style={{ width: '7px', height: '7px', borderRadius: '50%', background: couleur, flexShrink: 0 }} />}
        texte={statut === 'erreur' ? (erreur || 'Erreur de synchronisation') : LIBELLÉS[statut]}
        ouvert={ouvert}
        onToggle={() => setOuvert(o => !o)}
        marginBottom={ouvert ? '8px' : marginBottom}
      />
      {ouvert && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', marginBottom }}>
          {token ? (
            <button onClick={déconnecter} style={{
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.danger,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}><Icon nom="x" taille={13} /> Déconnecter le token</button>
          ) : (
            <div>
              <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 10px', lineHeight: '1.6' }}>
                Colle le token GitHub (le même que pour les autres pages) pour enregistrer dans <code style={{ background: T.bg, padding: '1px 5px', borderRadius: '4px' }}>{nomFichier}</code> et retrouver tes données sur tous tes appareils.
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="password" value={saisie} onChange={e => setSaisie(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { connecter(saisie); setSaisie('') } }}
                  placeholder="github_pat_…"
                  style={{ flex: 1, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '9px 10px', fontSize: '13px', outline: 'none' }}
                />
                <button onClick={() => { connecter(saisie); setSaisie('') }} style={{
                  background: T.accent, color: T.accentText, border: 'none', fontWeight: 600, borderRadius: '7px',
                  padding: '0 16px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                }}>Connecter</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
