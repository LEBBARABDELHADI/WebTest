import { useRef, useState, useEffect } from 'react'
import { useTheme, grotesk } from '../lib/theme'
import { envoyerFichier, adresseBrute, lireFichierBinaire, TOKEN_KEY } from '../lib/githubSync'

const DOSSIER_IMAGES = 'react-blocks/src/data/images'
const CÔTÉ_MAX = 900
const QUALITÉ = 0.78

// Images envoyées pendant cette session : affichées tout de suite depuis
// le téléphone, sans attendre que GitHub les serve.
const aperçus = new Map()

// Adresses déjà prêtes (aperçu de session, adresse publique ou image déjà
// chargée avec le token).
const chargées = new Map()
const enCours = new Map()
export function adresseImage(image) {
  if (!image?.chemin) return null
  return aperçus.get(image.chemin) || adresseBrute(image.chemin) || chargées.get(image.chemin) || null
}
// Adresse utilisable de l'image (chargée avec le token si le dépôt est privé).
export function urlImage(image) {
  const prête = adresseImage(image)
  if (prête || !image?.chemin) return Promise.resolve(prête)
  const { chemin } = image
  if (!enCours.has(chemin)) {
    enCours.set(chemin, lireFichierBinaire(chemin, localStorage.getItem(TOKEN_KEY) || '')
      .then(b => { const u = URL.createObjectURL(b); chargées.set(chemin, u); return u })
      .catch(() => { enCours.delete(chemin); return null }))
  }
  return enCours.get(chemin)
}
export function useUrlImage(image) {
  const [url, setUrl] = useState(() => adresseImage(image))
  const [échec, setÉchec] = useState(false)
  useEffect(() => {
    let actif = true
    const prête = adresseImage(image)
    if (prête) { setUrl(prête); return undefined }
    urlImage(image).then(u => { if (!actif) return; if (u) setUrl(u); else setÉchec(true) })
    return () => { actif = false }
  }, [image?.chemin]) // eslint-disable-line react-hooks/exhaustive-deps
  return { url, échec }
}

// Réduit la photo (900 px max, JPEG) pour qu'elle pèse ~100 Ko au lieu de
// plusieurs Mo, puis renvoie son contenu en base64.
function préparerImage(fichier) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onerror = () => reject(new Error('Lecture de l\'image impossible'))
    lecteur.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Format d\'image non reconnu'))
      img.onload = () => {
        const échelle = Math.min(1, CÔTÉ_MAX / Math.max(img.width, img.height))
        const toile = document.createElement('canvas')
        toile.width = Math.round(img.width * échelle)
        toile.height = Math.round(img.height * échelle)
        const ctx = toile.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, toile.width, toile.height)
        ctx.drawImage(img, 0, 0, toile.width, toile.height)
        const dataUrl = toile.toDataURL('image/jpeg', QUALITÉ)
        resolve({ dataUrl, base64: dataUrl.split(',')[1] })
      }
      img.src = lecteur.result
    }
    lecteur.readAsDataURL(fichier)
  })
}

export function ImageCarte({ image, hauteurMax = 220, style }) {
  const [erreur, setErreur] = useState(false)
  const { url, échec } = useUrlImage(image)
  if (!image?.chemin) return null
  if (!url && !échec) return <div aria-hidden="true" style={{ height: `${Math.min(60, hauteurMax)}px`, borderRadius: '10px', background: 'rgba(127,127,127,.15)', ...style }} />
  if (erreur || échec) {
    return <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, textAlign: 'center' }}>🖼️ Image en cours de publication…</p>
  }
  return (
    <img
      src={url}
      alt="Illustration de la carte"
      loading="lazy"
      draggable={false}
      onError={() => setErreur(true)}
      style={{ display: 'block', maxWidth: '100%', maxHeight: `${hauteurMax}px`, margin: '0 auto', borderRadius: '10px', objectFit: 'contain', ...style }}
    />
  )
}

// Champ d'édition : ajoute (photo ou galerie) ou retire l'image d'un côté
// de la carte. L'image est envoyée dès qu'elle est choisie.
export function ChampImage({ image, onChange, token, libellé }) {
  const T = useTheme()
  const entrée = useRef(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const choisir = async e => {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    setErreur('')
    setEnvoi(true)
    try {
      const { dataUrl, base64 } = await préparerImage(fichier)
      const chemin = `${DOSSIER_IMAGES}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`
      await envoyerFichier(chemin, base64, token, `chore: image de carte ${new Date().toISOString()}`)
      aperçus.set(chemin, dataUrl)
      onChange({ chemin })
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  const petit = {
    fontSize: '11.5px', fontFamily: grotesk, fontWeight: 600, padding: '5px 10px', borderRadius: '20px',
    background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer',
  }

  return (
    <div style={{ marginTop: '6px' }}>
      {image?.chemin ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '64px', flexShrink: 0 }}><ImageCarte image={image} hauteurMax={64} /></div>
          <button type="button" onClick={() => onChange(null)} style={{ ...petit, color: T.danger }}>Retirer l'image</button>
        </div>
      ) : token ? (
        <button type="button" onClick={() => entrée.current?.click()} disabled={envoi} style={petit}>
          {envoi ? '⏳ Envoi de l\'image…' : `🖼️ ${libellé}`}
        </button>
      ) : (
        <p style={{ margin: 0, fontSize: '11px', color: T.textMuted }}>🖼️ Connecte le token GitHub (en haut) pour ajouter des images.</p>
      )}
      <input ref={entrée} type="file" accept="image/*" onChange={choisir} style={{ display: 'none' }} />
      {erreur && <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.danger }}>{erreur}</p>}
    </div>
  )
}
