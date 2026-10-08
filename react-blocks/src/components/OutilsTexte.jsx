import { PALETTE, grotesk } from '../lib/theme'

// Barre d'outils gras + couleur qui s'applique uniquement au texte
// sélectionné dans le champ (pas tout le champ) : on enveloppe la
// sélection avec **gras** ou {{#hex|couleur}}, comme un mini-markdown.
export default function OutilsTexte({ T, obtenirInput, valeur, setValeur, grand = false }) {
  const côté = grand ? 30 : 22
  const pastille = grand ? 22 : 16
  const appliquer = action => {
    const el = obtenirInput()
    if (!el) return
    const début = el.selectionStart
    const fin = el.selectionEnd
    if (début == null || fin == null || début === fin) return
    const sélection = valeur.slice(début, fin)
    let remplacement
    if (action === 'gras') {
      remplacement = (sélection.startsWith('**') && sélection.endsWith('**') && sélection.length >= 4)
        ? sélection.slice(2, -2)
        : `**${sélection}**`
    } else if (action === 'effacer') {
      remplacement = sélection
        .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
        .replace(/\{\{#[0-9a-fA-F]{6}\|([\s\S]*?)\}\}/g, '$1')
    } else {
      remplacement = `{{${action}|${sélection}}}`
    }
    const nouvelleValeur = valeur.slice(0, début) + remplacement + valeur.slice(fin)
    setValeur(nouvelleValeur)
    requestAnimationFrame(() => {
      if (!obtenirInput()) return
      const input = obtenirInput()
      input.focus()
      const pos = début + remplacement.length
      input.setSelectionRange(pos, pos)
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
      <button
        type="button" onMouseDown={e => e.preventDefault()} onClick={() => appliquer('gras')}
        title="Mettre en gras le texte sélectionné"
        style={{
          width: `${côté}px`, height: `${côté}px`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '5px', fontSize: grand ? '14px' : '11px', fontWeight: 700, cursor: 'pointer', fontFamily: grotesk,
          background: 'transparent', color: T.textMuted, border: `1px solid ${T.border}`, flexShrink: 0,
        }}
      >B</button>
      {PALETTE.map(c => (
        <button
          key={c} type="button" onMouseDown={e => e.preventDefault()} onClick={() => appliquer(c)}
          title="Colorer le texte sélectionné"
          style={{ width: `${pastille}px`, height: `${pastille}px`, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, background: c, border: '2px solid transparent' }}
        />
      ))}
      <button
        type="button" onMouseDown={e => e.preventDefault()} onClick={() => appliquer('effacer')}
        title="Effacer la mise en forme du texte sélectionné"
        style={{ width: `${pastille}px`, height: `${pastille}px`, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, background: 'transparent', border: `1.5px dashed ${T.textMuted}` }}
      />
    </div>
  )
}
