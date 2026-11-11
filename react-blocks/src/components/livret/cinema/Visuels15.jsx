// Visuels du court-métrage de la page 15 : le sommaire de la partie 2,
// révélé chapitre par chapitre (compacts pour laisser voir les personnages).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const BLEU = '#93c5fd'
const CHAPITRES = [
  { n: 'I', emoji: '⚖️', titre: 'Démocratie et État de droit', page: 16, couleur: or, parties: [['A', 'Les principales institutions de l\'État', 16], ['B', 'Le droit de vote', 17]] },
  { n: 'II', emoji: '🗺️', titre: 'Organisation territoriale de la République', page: 19, couleur: '#86efac', parties: [['A', 'Les communes', 19], ['B', 'Les départements', 19], ['C', 'Les régions', 19], ['D', 'L\'outre-mer', 20]] },
  { n: 'III', emoji: '🇪🇺', titre: 'L\'Union européenne et ses institutions', page: 22, couleur: BLEU, parties: [['A', 'Les pays membres et leur date d\'entrée (ou de sortie)', 22], ['B', 'Les étapes clés de la construction européenne', 23]] },
]
const numéro = c => ({ display: 'inline-grid', placeItems: 'center', minWidth: 'clamp(26px, 3.6vw, 36px)', height: 'clamp(26px, 3.6vw, 36px)', padding: '0 6px', borderRadius: 18, background: c, color: '#14102a', fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 'clamp(12px, 1.8vw, 16px)' })
const badgePage = p => <span style={{ marginLeft: 'auto', flexShrink: 0, padding: '1px 8px', borderRadius: 10, border: '1px solid rgba(255,209,102,.5)', color: or, fontFamily: 'system-ui', fontWeight: 800, fontSize: 'clamp(10.5px, 1.5vw, 13px)' }}>p. {p}</span>

function Partie2({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ ...pastille(), fontSize: 'clamp(14px, 2.4vw, 22px)' }}>🏛️ Partie 2 · Système institutionnel et politique</div>
      {étape >= 2 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
          {CHAPITRES.map((c, k) => (
            <span key={c.n} className="c-mot-pilule" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderColor: c.couleur, animationDelay: `${k * 0.35}s`, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 16px)' }}>
              <span style={numéro(c.couleur)}>{c.n}</span>{c.emoji} {c.titre}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Un chapitre : son titre, puis ses parties, révélées selon l'étape.
function Chapitre({ k, étape, révélée }) {
  if (étape < 1) return null
  const c = CHAPITRES[k]
  return (
    <div style={colonne}>
      <div className="c-journal" style={{ width: 'min(92vw, 560px)', borderRadius: 14, padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 1.8vw, 16px)', background: 'rgba(14,12,32,.86)', border: `2px solid ${c.couleur}`, boxShadow: `0 0 26px ${c.couleur}55` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#fff', fontSize: 'clamp(14px, 2.2vw, 20px)' }}>
          <span style={numéro(c.couleur)}>{c.n}</span><span>{c.emoji} {c.titre}</span>{badgePage(c.page)}
        </div>
        <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
          {c.parties.map(([l, t, p], j) => révélée(j) && (
            <div key={l} className="c-apparait" style={{ display: 'flex', alignItems: 'center', gap: 8, color: crème, fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 16px)', animationDelay: `${(j % 2) * 0.2}s` }}>
              <strong style={{ color: c.couleur, width: 16 }}>{l}.</strong><span>{t}</span>{badgePage(p)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Carte({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {CHAPITRES.map((c, k) => (
        <div key={c.n} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.45}s`, borderColor: c.couleur, borderRadius: 16, width: 'clamp(104px, 29vw, 260px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: `0 0 22px ${c.couleur}55` }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{c.emoji}</div>
          <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10px, 1.4vw, 13px)', letterSpacing: '.04em', textTransform: 'uppercase', color: c.couleur }}>{c.n} · page {c.page}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11px, 1.6vw, 15px)', lineHeight: 1.2, color: crème }}>{c.titre}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels15({ nom, étape }) {
  switch (nom) {
    case 'partie-2': return <Partie2 étape={étape} />
    case 'chapitre-1': return <Chapitre k={0} étape={étape} révélée={j => étape >= j + 1} />
    case 'chapitre-2': return <Chapitre k={1} étape={étape} révélée={j => (j < 3 ? étape >= 2 : étape >= 3)} />
    case 'chapitre-3': return <Chapitre k={2} étape={étape} révélée={j => étape >= j + 1} />
    case 'carte-partie-2': return <Carte étape={étape} />
    default: return null
  }
}
