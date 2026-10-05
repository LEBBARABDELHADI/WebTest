import { useState, useEffect } from 'react'
import { useTheme, grotesk, serif } from '../lib/theme'
import { TexteFormaté, direTexte, déverrouillerAudio } from '../lib/texteFormate'
import { useÉcranAllumé } from '../lib/ecoute'
import Icon from './Icon'
import { ImageCarte } from './ImageCarte'

function mélanger(tableau) {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

const PAUSES = [3, 5, 8, 12]

// Révision à écouter : question lue, temps de réflexion, réponse lue, carte
// suivante, en boucle. Chaque étape est rejouée si on met en pause puis
// qu'on reprend ; « Suivante » / « Précédente » interrompent la lecture.
export default function ModePodcast({ cartes, titre, onFermer }) {
  const T = useTheme()
  const [pause, setPause] = useState(5)
  const [boucle, setBoucle] = useState(true)
  const [aléatoire, setAléatoire] = useState(true)
  const [file, setFile] = useState([])
  const [enCours, setEnCours] = useState(false)
  const [enPause, setEnPause] = useState(false)
  const [terminé, setTerminé] = useState(false)
  const [index, setIndex] = useState(0)
  const [étape, setÉtape] = useState('question') // question | réflexion | réponse | transition
  const [tour, setTour] = useState(1)
  const [restant, setRestant] = useState(0)

  useÉcranAllumé(enCours && !enPause && !terminé)

  const démarrer = () => {
    déverrouillerAudio()
    setFile(aléatoire ? mélanger(cartes) : cartes)
    setIndex(0)
    setTour(1)
    setÉtape('question')
    setTerminé(false)
    setEnPause(false)
    setEnCours(true)
  }

  const avancer = () => {
    if (index + 1 < file.length) {
      setIndex(index + 1)
      setÉtape('question')
    } else if (boucle) {
      if (aléatoire) setFile(mélanger(cartes))
      setIndex(0)
      setTour(t => t + 1)
      setÉtape('question')
    } else {
      setTerminé(true)
      direTexte('Fin de la révision.')
    }
  }

  useEffect(() => {
    if (!enCours || enPause || terminé || file.length === 0) return
    let annulé = false
    let minuteur = null
    let décompte = null
    const carte = file[index]
    if (étape === 'question') {
      direTexte(carte.recto).then(() => { if (!annulé) setÉtape('réflexion') })
    } else if (étape === 'réflexion') {
      setRestant(pause)
      décompte = setInterval(() => setRestant(r => Math.max(0, r - 1)), 1000)
      minuteur = setTimeout(() => setÉtape('réponse'), pause * 1000)
    } else if (étape === 'réponse') {
      direTexte(carte.verso, { réponse: true }).then(() => { if (!annulé) setÉtape('transition') })
    } else if (étape === 'transition') {
      minuteur = setTimeout(avancer, 1300)
    }
    return () => {
      annulé = true
      clearTimeout(minuteur)
      clearInterval(décompte)
      window.speechSynthesis?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enCours, enPause, terminé, index, étape, tour, file])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const carte = file[index]
  const réponseVisible = étape === 'réponse' || étape === 'transition'

  const gros = (actif = false) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
    padding: '14px 6px', borderRadius: '14px', cursor: 'pointer', fontFamily: grotesk, fontSize: '12px', fontWeight: 600,
    background: actif ? T.accent : T.surface2, color: actif ? T.accentText : T.text,
    border: `1px solid ${actif ? T.accent : T.border}`,
  })

  return (
    <div role="dialog" aria-label="Mode podcast" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: T.bg, overflowY: 'auto', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: T.accent, fontFamily: grotesk, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>🎧 Mode podcast</p>
            <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '20px', color: T.text }}>{titre}</strong>
          </div>
          <button onClick={onFermer} aria-label="Fermer" title="Fermer" style={{
            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer',
          }}><Icon nom="x" taille={14} /></button>
        </div>

        {!enCours ? (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: T.textMuted, lineHeight: 1.6 }}>
              L'app lit chaque question, te laisse le temps de répondre dans ta tête, puis lit la réponse — {cartes.length} carte{cartes.length > 1 ? 's' : ''}.
            </p>
            <div>
              <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontFamily: grotesk }}>Temps de réflexion</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {PAUSES.map(p => (
                  <button key={p} onClick={() => setPause(p)} style={{ ...gros(pause === p), padding: '10px 6px', fontSize: '13px' }}>{p} s</button>
                ))}
              </div>
            </div>
            {[
              { libellé: 'Recommencer en boucle à la fin', valeur: boucle, changer: setBoucle },
              { libellé: 'Ordre aléatoire', valeur: aléatoire, changer: setAléatoire },
            ].map(o => (
              <label key={o.libellé} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: T.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={o.valeur} onChange={e => o.changer(e.target.checked)} style={{ accentColor: T.accent, width: '18px', height: '18px' }} />
                {o.libellé}
              </label>
            ))}
            <button onClick={démarrer} disabled={cartes.length === 0} style={{
              background: T.accent, color: T.accentText, border: 'none', borderRadius: '12px', padding: '14px',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: grotesk,
            }}>▶︎ Lancer l'écoute</button>
            <p style={{ margin: 0, fontSize: '11.5px', color: T.textMuted, lineHeight: 1.5 }}>
              Garde l'app ouverte à l'écran (elle empêche la mise en veille) : sur téléphone, la lecture s'arrête si l'écran se verrouille ou si tu changes d'app. La voix utilisée est celle choisie dans « 🗣️ Voix ».
            </p>
          </div>
        ) : terminé ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <p style={{ fontSize: '40px', margin: '0 0 10px' }}>🎧</p>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '22px', color: T.text, margin: '0 0 18px' }}>Écoute terminée</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={démarrer} style={gros(true)}>↻ Réécouter</button>
              <button onClick={onFermer} style={gros()}>Fermer</button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ textAlign: 'center', fontSize: '12px', color: T.textMuted, fontFamily: grotesk, margin: '0 0 10px' }}>
              Carte {index + 1}/{file.length}{boucle ? ` · tour ${tour}` : ''}{enPause ? ' · en pause' : ''}
            </p>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '26px 20px', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '18px', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', fontFamily: grotesk }}>
                  {étape === 'question' && !enPause ? '🔊 Question' : 'Question'}
                </p>
                <p style={{ fontFamily: serif, fontSize: '20px', lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>
                  <TexteFormaté texte={carte?.recto} couleurDéfaut={T.text} />
                </p>
                {carte?.imageRecto && <ImageCarte image={carte.imageRecto} hauteurMax={180} style={{ marginTop: '12px' }} />}
              </div>
              {étape === 'réflexion' && (
                <div aria-live="polite" style={{ fontFamily: grotesk, color: T.accent }}>
                  <span style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1 }}>{restant}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.textMuted }}>réponds dans ta tête…</p>
                </div>
              )}
              {réponseVisible && (
                <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: '16px' }}>
                  <p style={{ fontSize: '10px', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', fontFamily: grotesk }}>
                    {étape === 'réponse' && !enPause ? '🔊 Réponse' : 'Réponse'}
                  </p>
                  <p style={{ fontSize: '15px', lineHeight: 1.5, margin: 0, wordBreak: 'break-word' }}>
                    <TexteFormaté texte={carte?.verso} couleurDéfaut={T.text} />
                  </p>
                  {carte?.imageVerso && <ImageCarte image={carte.imageVerso} hauteurMax={180} style={{ marginTop: '12px' }} />}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={() => { setIndex(i => Math.max(0, i - 1)); setÉtape('question') }} style={gros()} aria-label="Carte précédente">
                <span style={{ fontSize: '20px' }}>⏮</span>Précédente
              </button>
              <button onClick={() => setEnPause(p => !p)} style={gros(true)} aria-label={enPause ? 'Reprendre' : 'Pause'}>
                <span style={{ fontSize: '20px' }}>{enPause ? '▶︎' : '⏸'}</span>{enPause ? 'Reprendre' : 'Pause'}
              </button>
              <button onClick={avancer} style={gros()} aria-label="Carte suivante">
                <span style={{ fontSize: '20px' }}>⏭</span>Suivante
              </button>
            </div>
            {étape === 'réflexion' && !enPause && (
              <button onClick={() => setÉtape('réponse')} style={{ ...gros(), width: '100%', marginTop: '8px', flexDirection: 'row' }}>
                Révéler la réponse maintenant
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
