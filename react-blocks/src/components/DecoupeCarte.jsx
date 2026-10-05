import { useState } from 'react'
import { useTheme, grotesk, serif } from '../lib/theme'
import { texteBrut, TexteFormaté } from '../lib/texteFormate'
import { découperRéponse } from './CarteBulles'
import Icon from './Icon'

// Propose une petite carte par élément de la réponse. Si l'élément commence
// par « sujet : détail » (« La Marianne : une femme… »), le sujet passe dans
// la question et le détail devient la réponse ; sinon la question est
// numérotée. Tout reste modifiable avant de valider.
export function proposerDécoupe(carte) {
  const morceaux = découperRéponse(carte.verso)
  const sujet = texteBrut(carte.recto).replace(/\s*\?\s*$/, '').trim()
  return morceaux.map((morceau, i) => {
    const deuxPoints = morceau.match(/\s?:\s/)
    if (deuxPoints) {
      const gauche = texteBrut(morceau.slice(0, deuxPoints.index)).trim()
      const droite = morceau.slice(deuxPoints.index + deuxPoints[0].length).trim()
      if (gauche.length >= 2 && gauche.length <= 60 && droite) {
        return { recto: `${sujet} — ${gauche}`, verso: droite }
      }
    }
    return { recto: `${sujet} (${i + 1}/${morceaux.length})`, verso: morceau }
  })
}

export default function DecoupeCarte({ carte, onValider, onFermer }) {
  const T = useTheme()
  const [propositions, setPropositions] = useState(() => proposerDécoupe(carte))
  const [supprimerOrigine, setSupprimerOrigine] = useState(true)

  const modifier = (i, champ, valeur) =>
    setPropositions(p => p.map((x, j) => (j === i ? { ...x, [champ]: valeur } : x)))
  const retirer = i => setPropositions(p => p.filter((_, j) => j !== i))
  const valides = propositions.filter(p => p.recto.trim() && p.verso.trim())

  const champ = {
    width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`,
    borderRadius: '8px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit',
  }

  return (
    <div role="dialog" aria-label="Découper la carte" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: T.bg, overflowY: 'auto', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: T.accent, fontFamily: grotesk, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>✂️ Découper la carte</p>
            <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '19px', color: T.text }}>{texteBrut(carte.recto)}</strong>
          </div>
          <button onClick={onFermer} aria-label="Fermer" style={{
            width: '34px', height: '34px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer',
          }}><Icon nom="x" taille={14} /></button>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: T.textMuted, lineHeight: 1.5 }}>
          {propositions.length} petites cartes proposées, chacune avec son propre suivi. Ajuste les questions si besoin ; les réponses gardent leur mise en forme et restent modifiables ensuite comme n'importe quelle carte.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {propositions.map((p, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>Carte {i + 1}</span>
                <button onClick={() => retirer(i)} aria-label={`Ne pas créer la carte ${i + 1}`} title="Ne pas créer cette carte" style={{
                  background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', display: 'flex', padding: '2px',
                }}><Icon nom="x" taille={13} /></button>
              </div>
              <textarea
                value={p.recto} onChange={e => modifier(i, 'recto', e.target.value)} rows={2}
                aria-label={`Question de la carte ${i + 1}`} style={{ ...champ, fontWeight: 600, resize: 'vertical' }}
              />
              <p aria-label={`Réponse de la carte ${i + 1}`} style={{
                margin: 0, padding: '8px 10px', borderRadius: '8px', background: T.surface2,
                fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word',
              }}>
                <TexteFormaté texte={p.verso} couleurDéfaut={T.text} />
              </p>
            </div>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', fontSize: '13.5px', color: T.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={supprimerOrigine} onChange={e => setSupprimerOrigine(e.target.checked)} style={{ accentColor: T.accent, width: '18px', height: '18px' }} />
          Supprimer la carte d'origine
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onFermer} style={{
            flex: 1, padding: '12px', borderRadius: '12px', background: T.surface2, color: T.text,
            border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: grotesk, fontWeight: 600, fontSize: '13px',
          }}>Annuler</button>
          <button onClick={() => onValider(valides, supprimerOrigine)} disabled={valides.length === 0} style={{
            flex: 2, padding: '12px', borderRadius: '12px', background: T.accent, color: T.accentText,
            border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: '13px',
            opacity: valides.length === 0 ? 0.5 : 1,
          }}>Créer {valides.length} carte{valides.length > 1 ? 's' : ''}</button>
        </div>
      </div>
    </div>
  )
}
