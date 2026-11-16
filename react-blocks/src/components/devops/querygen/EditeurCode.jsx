// Éditeur de code coloré : une zone de saisie transparente posée sur une copie
// colorée du texte (même police, mêmes marges, défilement synchronisé).
import { useLayoutEffect, useMemo, useRef } from 'react'
import { paletteDe } from '../../../lib/querygen/apparence'
import Colore from './Colore'

const LIMITE_COLORATION = 150000

export default function EditeurCode({ valeur, onChange, colorer, T, hauteur = 220, ariaLabel, placeholder, zoneRef, onDrop, onDragOver, lectureSeule = false, id, retour = false }) {
  const zone = useRef(null)
  const fond = useRef(null)
  const palette = paletteDe(T)
  const segments = useMemo(() => (colorer && valeur.length <= LIMITE_COLORATION ? colorer(valeur) : null), [valeur, colorer])
  const synchro = () => {
    if (fond.current && zone.current) {
      fond.current.scrollTop = zone.current.scrollTop
      fond.current.scrollLeft = zone.current.scrollLeft
    }
  }
  // Requêtes : retour à la ligne et hauteur ajustée au contenu.
  useLayoutEffect(() => {
    const z = zone.current
    if (retour && z) { z.style.height = 'auto'; z.style.height = `${Math.min(260, Math.max(64, z.scrollHeight + 2))}px` }
    synchro()
  }, [segments, retour, valeur])
  const commun = retour
    ? { margin: 0, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'anywhere', scrollbarGutter: 'stable', border: 0, boxSizing: 'border-box' }
    : { margin: 0, padding: '10px 12px', whiteSpace: 'pre', border: 0, boxSizing: 'border-box' }
  const lier = el => { zone.current = el; if (zoneRef) zoneRef.current = el }
  return (
    <div style={{ position: 'relative', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, overflow: 'hidden' }} onDrop={onDrop} onDragOver={onDragOver}>
      {segments && (
        <pre ref={fond} aria-hidden="true" className="qg-code" style={{ ...commun, position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', color: T.text }}>
          <Colore segments={segments} palette={palette} />{'\n'}
        </pre>
      )}
      <textarea
        id={id}
        ref={lier}
        className="qg-code"
        value={valeur}
        readOnly={lectureSeule}
        onChange={e => onChange?.(e.target.value)}
        onScroll={synchro}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label={ariaLabel}
        placeholder={placeholder}
        style={{ ...commun, position: 'relative', display: 'block', width: '100%', height: hauteur, minHeight: 64, resize: 'vertical', background: 'transparent', color: segments ? 'transparent' : T.text, caretColor: T.text, overflow: 'auto', outline: 'none' }}
      />
    </div>
  )
}
