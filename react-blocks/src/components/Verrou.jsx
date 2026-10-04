import { useState } from 'react'
import { useTheme, grotesk, serif } from '../lib/theme'
import { FOYERS } from '../lib/foyers'

// Le dépôt est public : on n'y met jamais les mots de passe en clair,
// seulement leur empreinte SHA-256 (salée), une par foyer. C'est un verrou
// d'accès côté navigateur, pas une protection des données (les fichiers
// JSON restent lisibles sur GitHub).
const SEL = 'react-blocs:'
const EMPREINTES = {
  lebbar: '8b3b3ef272dbec4908e0cea0c60cefdfd5b9ec1f2e4933c80104de2a57bc9515',
  idrissi: '905acc0a373e3812fa271365d0636a7587472d3445253722bea2e7062527f172',
}
const cléAccès = foyerId => `react-blocs-acces-${foyerId}`

async function empreinte(motDePasse) {
  const octets = new TextEncoder().encode(SEL + motDePasse)
  const hash = await crypto.subtle.digest('SHA-256', octets)
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function accèsMémorisé(foyerId) {
  try { return localStorage.getItem(cléAccès(foyerId)) === EMPREINTES[foyerId] } catch { return false }
}

export function verrouiller() {
  try {
    Object.keys(EMPREINTES).forEach(f => localStorage.removeItem(cléAccès(f)))
    localStorage.removeItem('react-blocs-acces')
  } catch { /* ignore */ }
  window.location.reload()
}

// `foyers` : foyers dont l'accès suffit à ouvrir la page (un seul pour les
// pages d'un foyer, les deux pour les pages communes comme les notions).
export default function Verrou({ foyers, children }) {
  const T = useTheme()
  const [ouvert, setOuvert] = useState(() => foyers.some(accèsMémorisé))
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  if (ouvert) return children

  const valider = async e => {
    e.preventDefault()
    if (!saisie) return
    if (!window.crypto?.subtle) {
      setErreur('Ce navigateur ne permet pas de vérifier le mot de passe (connexion non sécurisée).')
      return
    }
    setEnCours(true)
    const saisieHachée = await empreinte(saisie)
    setEnCours(false)
    const foyerOuvert = foyers.find(f => EMPREINTES[f] === saisieHachée)
    if (foyerOuvert) {
      try { localStorage.setItem(cléAccès(foyerOuvert), saisieHachée) } catch { /* ignore */ }
      setOuvert(true)
    } else {
      setErreur('Mot de passe incorrect')
      setSaisie('')
    }
  }

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <form onSubmit={valider} style={{
        width: '100%', maxWidth: '340px', background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: '16px', padding: '28px 22px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '6px' }}>🔒</div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '26px', color: T.text, margin: '0 0 6px' }}>
          Accès privé
        </h1>
        <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '0 0 18px' }}>
          {foyers.map(f => FOYERS[f].nom).join(' · ')}
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={saisie}
          onChange={e => { setSaisie(e.target.value); setErreur('') }}
          placeholder="Mot de passe"
          style={{
            width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text,
            border: `1px solid ${erreur ? T.danger : T.border}`, borderRadius: '9px',
            padding: '11px 12px', fontSize: '15px', outline: 'none', marginBottom: '10px',
          }}
        />
        {erreur && <p style={{ fontSize: '12px', color: T.danger, margin: '0 0 10px' }}>{erreur}</p>}
        <button type="submit" disabled={enCours} style={{
          width: '100%', background: T.accent, color: T.accentText, border: 'none', borderRadius: '9px',
          padding: '11px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
        }}>{enCours ? 'Vérification…' : 'Entrer'}</button>
      </form>
    </div>
  )
}
