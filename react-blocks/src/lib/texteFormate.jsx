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

// Préférences de lecture, propres à l'appareil puisque les voix disponibles
// dépendent du téléphone/navigateur. `voixRéponse` vide = même voix que la
// question ; `style` = dernier style prédéfini appliqué ('' si réglé à la main).
const CLÉ_VOIX = 'react-blocs-voix'
const PRÉFÉRENCES_PAR_DÉFAUT = {
  voix: '', voixRéponse: '', vitesse: 1, hauteur: 1, style: 'naturel', autresLangues: false,
}

// Styles applicables à n'importe quelle voix (même s'il n'y en a qu'une
// installée), en jouant sur la vitesse et la hauteur.
export const STYLES_VOIX = [
  { id: 'naturel', nom: 'Naturel', emoji: '🙂', vitesse: 1, hauteur: 1 },
  { id: 'pose', nom: 'Posé', emoji: '📖', vitesse: 0.85, hauteur: 0.95 },
  { id: 'professeur', nom: 'Professeur', emoji: '🎓', vitesse: 0.9, hauteur: 0.75 },
  { id: 'dictee', nom: 'Dictée lente', emoji: '🐢', vitesse: 0.6, hauteur: 1 },
  { id: 'dynamique', nom: 'Dynamique', emoji: '⚡', vitesse: 1.3, hauteur: 1.1 },
  { id: 'express', nom: 'Express', emoji: '🚀', vitesse: 1.7, hauteur: 1 },
  { id: 'grave', nom: 'Grave', emoji: '🐻', vitesse: 0.95, hauteur: 0.4 },
  { id: 'enfant', nom: 'Enfant', emoji: '🧒', vitesse: 1.1, hauteur: 1.6 },
  { id: 'souris', nom: 'Souris', emoji: '🐭', vitesse: 1.3, hauteur: 2 },
  { id: 'robot', nom: 'Robot', emoji: '🤖', vitesse: 0.9, hauteur: 0 },
]

const nomsDeLangues = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['fr'], { type: 'language' })
  : null

// « fr-CA » → « français (Canada) », « en-GB » → « anglais (Royaume-Uni) ».
export function nomDeLangue(lang) {
  try { return nomsDeLangues?.of(lang.replace('_', '-')) || lang } catch { return lang }
}

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

const estFrançaise = v => v.lang.toLowerCase().startsWith('fr')

// Sur iPhone/Mac, une voix téléchargée en meilleure qualité garde le même
// nom que la version de base : seule l'adresse interne (voiceURI) l'indique.
// 2 = Premium, 1 = Améliorée, 0 = standard.
export function qualitéVoix(v) {
  const id = `${v.voiceURI} ${v.name}`.toLowerCase()
  if (id.includes('premium')) return 2
  if (id.includes('enhanced') || id.includes('améliorée') || id.includes('natural') || id.includes('neural')) return 1
  return 0
}

// Voix installées sur l'appareil : les françaises d'abord, puis (si
// demandé) celles des autres langues, qui lisent le français avec leur
// accent. La liste arrive parfois après le chargement de la page (Chrome),
// d'où l'écoute de « voiceschanged ».
export function useVoix() {
  const lire = () => [...(window.speechSynthesis?.getVoices() || [])]
    .sort((a, b) => (estFrançaise(b) - estFrançaise(a))
      || (qualitéVoix(b) - qualitéVoix(a))
      || a.lang.localeCompare(b.lang)
      || a.name.localeCompare(b.name))
  const [voix, setVoix] = useState(lire)
  useEffect(() => {
    const synthèse = window.speechSynthesis
    if (!synthèse) return
    const maj = () => setVoix(lire())
    synthèse.addEventListener('voiceschanged', maj)
    maj()
    return () => synthèse.removeEventListener('voiceschanged', maj)
  }, [])
  return { françaises: voix.filter(estFrançaise), autres: voix.filter(v => !estFrançaise(v)) }
}

// Lit un texte à voix haute via la synthèse vocale du navigateur.
// `réponse` : utilise la voix choisie pour les réponses, si elle diffère.
// `voix` : force une voix précise (extrait d'essai dans les réglages).
export function lireTexte(texte, { réponse = false, voix: voixForcée, préférences = lirePréférencesVoix() } = {}) {
  if (!texte || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texteBrut(texte))
  const voixVoulue = voixForcée ?? ((réponse && préférences.voixRéponse) || préférences.voix)
  const voix = window.speechSynthesis.getVoices().find(v => v.voiceURI === voixVoulue)
  if (voix) u.voice = voix
  u.lang = voix ? voix.lang : 'fr-FR'
  u.rate = préférences.vitesse
  u.pitch = préférences.hauteur
  window.speechSynthesis.speak(u)
}
