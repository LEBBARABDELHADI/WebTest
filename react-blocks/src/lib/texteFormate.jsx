import { useState, useEffect } from 'react'

// Analyse une chaîne avec mise en forme intégrée (**gras**, et
// {{#RRGGBB|couleur}} pour une couleur), récursivement pour que les deux
// puissent se combiner ou s'imbriquer, et renvoie une liste de segments
// {texte, gras?, couleur?} prêts à être rendus en <span>. Utilisé par
// Mémoriser (recto/verso des cartes) et par l'aperçu « carte du jour »
// sur l'accueil.
export function analyserTexte(texte, style = {}) {
  if (!texte) return []
  const mCouleur = texte.match(/\{\{(#[0-9a-fA-F]{6})\|([\s\S]*?)\}\}/)
  if (mCouleur) {
    const avant = texte.slice(0, mCouleur.index)
    const après = texte.slice(mCouleur.index + mCouleur[0].length)
    return [
      ...analyserTexte(avant, style),
      ...analyserTexte(mCouleur[2], { ...style, couleur: mCouleur[1] }),
      ...analyserTexte(après, style),
    ]
  }
  const mGras = texte.match(/\*\*([\s\S]+?)\*\*/)
  if (mGras) {
    const avant = texte.slice(0, mGras.index)
    const après = texte.slice(mGras.index + mGras[0].length)
    return [
      ...analyserTexte(avant, style),
      ...analyserTexte(mGras[1], { ...style, gras: true }),
      ...analyserTexte(après, style),
    ]
  }
  return [{ texte, ...style }]
}

// Rendu d'un recto/verso avec sa mise en forme.
export function TexteFormaté({ texte, couleurDéfaut }) {
  return analyserTexte(texte || '').map((seg, i) => (
    <span key={i} style={{ color: seg.couleur || couleurDéfaut, fontWeight: seg.gras ? 700 : 'inherit' }}>
      {seg.texte}
    </span>
  ))
}

// Texte sans le balisage **gras**/{{#hex|couleur}}, pour la lecture audio
// et les exports en texte brut.
export function texteBrut(texte) {
  return analyserTexte(texte || '').map(seg => seg.texte).join('')
}

// Préférences de lecture (voix, vitesse, hauteur), propres à l'appareil
// puisque les voix disponibles dépendent du téléphone/navigateur.
const CLÉ_VOIX = 'react-blocs-voix'
const PRÉFÉRENCES_PAR_DÉFAUT = { voix: '', vitesse: 1, hauteur: 1 }

export function lirePréférencesVoix() {
  try {
    return { ...PRÉFÉRENCES_PAR_DÉFAUT, ...JSON.parse(localStorage.getItem(CLÉ_VOIX) || '{}') }
  } catch {
    return { ...PRÉFÉRENCES_PAR_DÉFAUT }
  }
}

export function enregistrerPréférencesVoix(préférences) {
  try { localStorage.setItem(CLÉ_VOIX, JSON.stringify(préférences)) } catch { /* ignore */ }
}

// Voix françaises installées sur l'appareil. La liste arrive parfois après
// le chargement de la page (Chrome), d'où l'écoute de « voiceschanged ».
export function useVoixFrançaises() {
  const lire = () => (window.speechSynthesis?.getVoices() || [])
    .filter(v => v.lang.toLowerCase().startsWith('fr'))
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name))
  const [voix, setVoix] = useState(lire)
  useEffect(() => {
    const synthèse = window.speechSynthesis
    if (!synthèse) return
    const maj = () => setVoix(lire())
    synthèse.addEventListener('voiceschanged', maj)
    maj()
    return () => synthèse.removeEventListener('voiceschanged', maj)
  }, [])
  return voix
}

// Lit un texte à voix haute via la synthèse vocale du navigateur, avec la
// voix, la vitesse et la hauteur choisies (ou celles passées en argument).
export function lireTexte(texte, préférences = lirePréférencesVoix()) {
  if (!texte || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texteBrut(texte))
  const voix = window.speechSynthesis.getVoices().find(v => v.voiceURI === préférences.voix)
  if (voix) u.voice = voix
  u.lang = voix ? voix.lang : 'fr-FR'
  u.rate = préférences.vitesse
  u.pitch = préférences.hauteur
  window.speechSynthesis.speak(u)
}
