import { useState } from 'react'
import { useTheme, grotesk, serif } from '../lib/theme'
import { TexteFormaté, lireTexte } from '../lib/texteFormate'
import { découperRéponse, aDesPuces } from './CarteBulles'
import { ImageCarte } from './ImageCarte'
import Icon from './Icon'

const CLÉ_TAILLE = 'react-blocs-lecture-taille'
const TAILLE_MIN = 13
const TAILLE_MAX = 23

function tailleMémorisée() {
  try { return Number(localStorage.getItem(CLÉ_TAILLE)) || 16 } catch { return 16 }
}

// Toutes les cartes d'un paquet à lire comme une fiche de cours.
export default function ModeLecture({ cartes, titre, couleur, onFermer, onBulles }) {
  const T = useTheme()
  const [taille, setTaille] = useState(tailleMémorisée)
  const [masquer, setMasquer] = useState(false)
  const [révélées, setRévélées] = useState(() => new Set())

  const changerTaille = delta => {
    const nouvelle = Math.min(TAILLE_MAX, Math.max(TAILLE_MIN, taille + delta))
    setTaille(nouvelle)
    try { localStorage.setItem(CLÉ_TAILLE, String(nouvelle)) } catch { /* ignore */ }
  }

  const basculerMasquer = () => {
    setMasquer(m => !m)
    setRévélées(new Set())
  }

  const révéler = id => setRévélées(r => new Set(r).add(id))

  const petitBouton = {
    height: '32px', minWidth: '32px', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '20px',
    cursor: 'pointer', fontFamily: grotesk, fontSize: '12px', fontWeight: 600,
  }

  return (
    <div role="dialog" aria-label="Mode lecture" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: T.bg, overflowY: 'auto' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 1, background: T.bg, borderBottom: `1px solid ${T.border}`,
        padding: '14px 16px 12px',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '11px', color: T.accent, fontFamily: grotesk, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                📖 Mode lecture · {cartes.length} carte{cartes.length > 1 ? 's' : ''}
              </p>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '21px', color: T.text }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: couleur, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titre}</span>
              </strong>
            </div>
            <button onClick={onFermer} aria-label="Fermer" title="Fermer" style={{ ...petitBouton, padding: 0, width: '34px', height: '34px', borderRadius: '50%' }}>
              <Icon nom="x" taille={14} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => changerTaille(-1)} disabled={taille <= TAILLE_MIN} aria-label="Texte plus petit" style={{ ...petitBouton, opacity: taille <= TAILLE_MIN ? 0.4 : 1 }}>A−</button>
            <button onClick={() => changerTaille(1)} disabled={taille >= TAILLE_MAX} aria-label="Texte plus grand" style={{ ...petitBouton, fontSize: '14px', opacity: taille >= TAILLE_MAX ? 0.4 : 1 }}>A+</button>
            <button onClick={basculerMasquer} style={{
              ...petitBouton,
              background: masquer ? T.accentSoft : T.surface2, color: masquer ? T.accent : T.text,
              border: `1px solid ${masquer ? T.accent : T.border}`,
            }}>{masquer ? '🙈 Réponses masquées' : '👁 Réponses visibles'}</button>
            {masquer && révélées.size > 0 && (
              <button onClick={() => setRévélées(new Set())} style={petitBouton}>Tout remasquer</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '18px 16px 60px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {cartes.length === 0 && (
          <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '14px', marginTop: '40px' }}>Ce paquet ne contient pas encore de carte.</p>
        )}
        {cartes.map((carte, i) => {
          const cachée = masquer && !révélées.has(carte.id)
          const puces = aDesPuces(carte.verso)
          return (
            <article key={carte.id} style={{
              background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${couleur}`,
              borderRadius: '12px', padding: '14px 14px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{
                  flexShrink: 0, minWidth: '24px', height: '24px', borderRadius: '12px', background: T.surface2, color: T.textMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: grotesk, marginTop: '1px',
                }}>{i + 1}</span>
                <h3 style={{ flex: 1, margin: 0, fontFamily: serif, fontWeight: 600, fontSize: `${taille + 2}px`, lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {(carte.fautesConsécutives || 0) >= 2 && <span title="Point faible" style={{ marginRight: '6px' }}>⚠️</span>}
                  <TexteFormaté texte={carte.recto} couleurDéfaut={T.text} />
                </h3>
              </div>
              {carte.imageRecto && <ImageCarte image={carte.imageRecto} hauteurMax={240} style={{ marginTop: '10px' }} />}

              {cachée ? (
                <button onClick={() => révéler(carte.id)} style={{
                  display: 'block', width: '100%', marginTop: '12px', padding: '14px', borderRadius: '10px', cursor: 'pointer',
                  background: T.surface2, border: `1px dashed ${T.border}`, color: T.textMuted,
                  fontFamily: grotesk, fontSize: '13px',
                }}>Touche pour voir la réponse</button>
              ) : (
                <div style={{ marginTop: '10px', paddingLeft: '34px', fontSize: `${taille}px`, lineHeight: 1.6, wordBreak: 'break-word' }}>
                  {carte.imageVerso && <ImageCarte image={carte.imageVerso} hauteurMax={240} style={{ margin: '0 0 10px' }} />}
                  {puces ? (
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {découperRéponse(carte.verso).map((morceau, j) => (
                        <li key={j}><TexteFormaté texte={morceau} couleurDéfaut={T.text} /></li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}><TexteFormaté texte={carte.verso} couleurDéfaut={T.text} /></p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                <button onClick={() => lireTexte(carte.recto)} title="Écouter la question" aria-label="Écouter la question" style={{ ...petitBouton, height: '28px', fontSize: '11px' }}>🔊 Question</button>
                {!cachée && (
                  <button onClick={() => lireTexte(carte.verso, { réponse: true })} title="Écouter la réponse" aria-label="Écouter la réponse" style={{ ...petitBouton, height: '28px', fontSize: '11px' }}>🔊 Réponse</button>
                )}
                <button onClick={() => onBulles(carte.id)} title="Voir en bulles" aria-label="Voir en bulles" style={{ ...petitBouton, height: '28px', padding: '0 9px' }}>
                  <Icon nom="bulles" taille={13} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
