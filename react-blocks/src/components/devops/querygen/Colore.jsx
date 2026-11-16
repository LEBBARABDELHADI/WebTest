// Segments colorés d'un texte (JSON, jq, JMESPath, regex, correspondances d'un test).
export default function Colore({ segments, palette }) {
  return segments.map((s, i) => {
    const couleur = palette[s.t]
    if (!couleur) return s.texte
    // Correspondances : fond coloré (le texte garde sa couleur).
    if (s.t.startsWith('match')) return <span key={i} style={{ background: couleur, borderRadius: 3 }}>{s.texte}</span>
    return <span key={i} style={{ color: couleur, ...(s.t === 'erreur' ? { textDecoration: 'underline wavy', textDecorationColor: couleur } : null) }}>{s.texte}</span>
  })
}
