// Petits éléments d'interface partagés par l'outil IAM.
import { useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { MONO } from '../../../lib/querygen/apparence'

export function Pastille({ couleur, children, titre }) {
  return <span role="status" title={titre} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: `${couleur}22`, color: couleur, fontFamily: grotesk, fontWeight: 800, fontSize: 12.5 }}>{children}</span>
}

// Valeur éditable sous forme de pastille avec une croix.
export function PuceSuppr({ texte, onSuppr, T, mono = true, aria }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: '100%', padding: '3px 4px 3px 9px', borderRadius: 999, border: `1px solid ${T.border}`, background: T.bg, fontFamily: mono ? MONO : grotesk, fontSize: 13, wordBreak: 'break-all' }}>
      <span style={{ minWidth: 0 }}>{texte}</span>
      <button type="button" onClick={onSuppr} aria-label={aria ?? `Retirer ${texte}`} style={{ border: 0, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 16, minWidth: 28, minHeight: 28, lineHeight: 1 }}>✕</button>
    </span>
  )
}

// Champ + bouton « Ajouter » : Entrée valide ; les valeurs séparées par des virgules ou retours à la ligne sont ajoutées en bloc.
export function AjoutTexte({ onAjouter, S, T, placeholder, aria, listeId, libellé = 'Ajouter', séparer = true }) {
  const [valeur, setValeur] = useState('')
  const valider = () => {
    const v = valeur.trim()
    if (!v) return
    onAjouter(séparer ? v.split(/[\n,]+/).map(x => x.trim()).filter(Boolean) : [v])
    setValeur('')
  }
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input value={valeur} onChange={e => setValeur(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); valider() } }} list={listeId} aria-label={aria ?? placeholder} placeholder={placeholder} autoCapitalize="off" autoCorrect="off" spellCheck={false} style={{ ...S.champ, flex: 1, minWidth: 0, fontSize: 16 }} />
      <button type="button" onClick={valider} disabled={!valeur.trim()} style={{ ...S.puce(true), minHeight: 42, opacity: valeur.trim() ? 1 : 0.5, color: T.accentText }}>{libellé}</button>
    </div>
  )
}

// Choix exclusif sous forme de boutons.
export function Segments({ options, valeur, onChange, S, aria }) {
  return (
    <div role="radiogroup" aria-label={aria} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(([id, nom, aide]) => (
        <button key={id} type="button" role="radio" aria-checked={valeur === id} title={aide} onClick={() => onChange(id)} style={{ ...S.puce(valeur === id), minHeight: 38, fontSize: 13 }}>{nom}</button>
      ))}
    </div>
  )
}
