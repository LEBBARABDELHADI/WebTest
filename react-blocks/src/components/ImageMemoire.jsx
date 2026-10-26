import { useState, useEffect, useRef } from 'react'
import { grotesk, serif } from '../lib/theme'
import { chercherImages, requêteDeCarte, pictogrammeDeCarte } from '../lib/imagesMemoire'

// Affiche l'image « mémoire visuelle » d'une carte : photo du web (avec sa
// source) ou pictogramme généré (émojis, dates, mots-clés).
export function VueImageMémoire({ T, image, couleur, hauteur = 220 }) {
  const [erreur, setErreur] = useState(false)
  if (!image) return null
  if (image.type === 'picto') {
    return (
      <div aria-label="Pictogramme mémoire" style={{
        borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
        background: `linear-gradient(135deg, ${couleur}33, ${couleur}0d)`, border: `1px solid ${couleur}55`,
      }}>
        <span style={{ fontSize: `${Math.round(hauteur / 4.4)}px`, lineHeight: 1, letterSpacing: '4px' }}>{image.émojis.join('')}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          {image.dates.length > 0 && (
            <strong style={{ fontFamily: serif, fontSize: '26px', color: T.text, lineHeight: 1.1 }}>{image.dates.join(' · ')}</strong>
          )}
          {image.mots.length > 0 && (
            <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {image.mots.map(m => (
                <span key={m} style={{ fontFamily: grotesk, fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: T.text, background: `${couleur}2e`, padding: '3px 9px', borderRadius: '20px' }}>{m}</span>
              ))}
            </span>
          )}
        </span>
      </div>
    )
  }
  if (erreur) return <p style={{ margin: 0, fontSize: '12px', color: T.textMuted }}>🖼️ Image indisponible ({image.titre})</p>
  return (
    <figure style={{ margin: 0 }}>
      <img src={image.url} alt={image.titre || ''} loading="lazy" onError={() => setErreur(true)} referrerPolicy="no-referrer"
        style={{ display: 'block', maxWidth: '100%', maxHeight: `${hauteur}px`, borderRadius: '10px', border: `1px solid ${T.border}`, background: '#fff' }} />
      <figcaption style={{ marginTop: '4px', fontSize: '11px', color: T.textMuted, fontFamily: grotesk }}>
        {image.page ? <a href={image.page} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{image.titre} · {image.source} ↗</a> : image.titre}
      </figcaption>
    </figure>
  )
}

// Choisir l'image d'une carte : propositions trouvées d'après la question
// (recherche modifiable), ou pictogramme généré.
export function ChoixImageMémoire({ T, carte, couleur, onChoisir, onRetirer, onFermer }) {
  const [requête, setRequête] = useState(() => requêteDeCarte(carte))
  const [état, setÉtat] = useState({ chargement: true, résultats: [], erreur: '' })
  const picto = pictogrammeDeCarte(carte)
  const champRef = useRef(null)
  const lancer = async q => {
    setÉtat({ chargement: true, résultats: [], erreur: '' })
    try { setÉtat({ chargement: false, résultats: await chercherImages(q), erreur: '' }) }
    catch (e) { setÉtat({ chargement: false, résultats: [], erreur: e.message || 'Recherche impossible (hors ligne ?)' }) }
  }
  useEffect(() => { lancer(requête) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const f = e => { if (e.key === 'Escape') { e.stopPropagation(); onFermer() } }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [onFermer])

  const bouton = { padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: grotesk, fontSize: '13px', fontWeight: 700, border: `1px solid ${T.border}`, background: T.surface2, color: T.text }
  return (
    <div role="dialog" aria-label="Image mémoire" onClick={onFermer} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '720px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '16px', marginTop: '4vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <strong style={{ flex: 1, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '20px', color: T.text }}>🖼️ Image pour mémoriser</strong>
          <button onClick={onFermer} aria-label="Fermer" style={{ ...bouton, width: '36px', height: '36px', padding: 0 }}>✕</button>
        </div>

        <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>Pictogramme généré</p>
        <button onClick={() => onChoisir(picto)} title="Choisir ce pictogramme" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: '14px' }}>
          <VueImageMémoire T={T} image={picto} couleur={couleur} hauteur={180} />
        </button>

        <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>Photos (Wikipédia)</p>
        <form onSubmit={e => { e.preventDefault(); lancer(requête) }} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input ref={champRef} value={requête} onChange={e => setRequête(e.target.value)} aria-label="Rechercher une image"
            style={{ flex: 1, minWidth: 0, background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '9px 11px', fontSize: '14px' }} />
          <button type="submit" style={{ ...bouton, background: T.accent, color: T.accentText, border: 'none' }}>Chercher</button>
        </form>
        {état.chargement && <p style={{ color: T.textMuted, fontSize: '13px' }}>Recherche d'images…</p>}
        {état.erreur && <p style={{ color: T.danger, fontSize: '13px' }}>{état.erreur}. Le pictogramme reste disponible.</p>}
        {!état.chargement && !état.erreur && état.résultats.length === 0 && (
          <p style={{ color: T.textMuted, fontSize: '13px' }}>Aucune image trouvée : essaie d'autres mots (ex. « Marianne », « drapeau français »).</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
          {état.résultats.map(r => (
            <button key={r.url} onClick={() => onChoisir(r)} title={`${r.titre} (${r.source})`} style={{
              padding: 0, border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: T.surface, textAlign: 'left',
            }}>
              <img src={r.url} alt={r.titre} loading="lazy" referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', height: '110px', objectFit: 'cover', background: '#fff' }} />
              <span style={{ display: 'block', padding: '5px 7px', fontSize: '11.5px', color: T.text, fontFamily: grotesk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titre}</span>
            </button>
          ))}
        </div>
        {carte.imageMémoire && (
          <button onClick={onRetirer} style={{ ...bouton, marginTop: '14px', color: T.danger }}>Retirer l'image de cette carte</button>
        )}
      </div>
    </div>
  )
}
