import { colorerJson } from '../../../lib/querygen/json'
import { MONO, paletteDe } from '../../../lib/querygen/apparence'
import Colore from './Colore'

// Résultat JSON coloré, défilant.
export default function Resultat({ texte, T, hauteur = 260, aria }) {
  const segments = texte.length < 150000 ? colorerJson(texte) : [{ t: 'texte', texte }]
  return (
    <pre aria-label={aria} tabIndex={0} style={{ margin: 0, padding: '10px 12px', borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, maxHeight: hauteur, overflow: 'auto', fontFamily: MONO, fontSize: 13, lineHeight: 1.5, color: T.text, whiteSpace: 'pre' }}>
      <Colore segments={segments} palette={paletteDe(T)} />
    </pre>
  )
}
