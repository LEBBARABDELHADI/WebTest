// Segments colorés d'un texte (JSON, jq, JMESPath).
export default function Colore({ segments, palette }) {
  return segments.map((s, i) => {
    const couleur = palette[s.t]
    if (!couleur) return s.texte
    return <span key={i} style={{ color: couleur, ...(s.t === 'erreur' ? { textDecoration: 'underline wavy', textDecorationColor: couleur } : null) }}>{s.texte}</span>
  })
}
