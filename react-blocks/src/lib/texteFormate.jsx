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

// Lit un texte à voix haute via la synthèse vocale du navigateur.
export function lireTexte(texte) {
  if (!texte || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texteBrut(texte))
  u.lang = 'fr-FR'
  window.speechSynthesis.speak(u)
}
