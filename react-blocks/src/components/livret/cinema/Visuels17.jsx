// Visuels pédagogiques du court-métrage de la page 17 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const BLEU = '#93c5fd', VERT = '#22c55e', ROUGE = '#ef4444', VIOLET = '#c4b5fd'
const titreCarte = c => ({ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', letterSpacing: '.05em', textTransform: 'uppercase', color: c })
const carte = (bord, extra = {}) => ({ borderRadius: 14, padding: 'clamp(5px, 1vw, 10px) clamp(8px, 1.4vw, 12px)', border: `2px solid ${bord}`, background: 'rgba(14,12,32,.84)', ...extra })
const texteCarte = { fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(11.5px, 1.6vw, 15px)', lineHeight: 1.25 }
const flèche = (délai = 0) => <span className="c-apparait" aria-hidden="true" style={{ color: or, fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 900, animationDelay: `${délai}s` }}>→</span>

function Justice({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>👩‍⚖️ la justice est rendue par les juges</div>
      {étape >= 2 && <div style={rangée}><span className="c-mot-pilule" style={pilule(BLEU)}>🤝 litiges entre particuliers ou entreprises</span><span className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: '.3s' }}>🏛️ entre citoyens et administration</span></div>}
      {étape >= 3 && <div className="c-mot-pilule" style={pilule(ROUGE)}>⚖️ infractions : peines prévues par la loi (emprisonnement, amende…)</div>}
    </div>
  )
}

function Conseil({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>📜 le Conseil constitutionnel</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>⚖️ les lois</span>
        <span className="c-apparait" style={{ color: or, fontWeight: 900, fontSize: 'clamp(16px, 2.6vw, 24px)', animationDelay: '.3s' }}>=</span>
        <span className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: '.45s' }}>📜 la Constitution ?</span>
      </div>
      {étape >= 2 && <div className="c-mot-pilule" style={pilule(VERT)}>🗳️ contrôle aussi la régularité des élections nationales</div>}
    </div>
  )
}

function DroitVote({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🗳️ exprimer sa volonté à l'occasion d'une élection</div>
      {étape >= 2 && <div className="c-impact-6" style={{ ...pastille(), fontSize: 'clamp(14px, 2.4vw, 22px)' }}>suffrage universel : l'ensemble des citoyens vote</div>}
    </div>
  )
}

const DATES = [['1848', 'premier vote au suffrage universel', 'seulement les hommes en âge de voter', '👨'], ['avril 1944', 'les femmes françaises obtiennent le droit de vote', '', '✊'], ['avril 1945', 'elles votent pour la première fois', 'un an plus tard', '🗳️']]
function FriseVote({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {DATES.slice(0, étape).map(([d, t, s, e]) => (
        <div key={d} className="c-mot-pilule" style={{ ...carte(d === '1848' ? BLEU : or), width: 'clamp(104px, 29vw, 240px)' }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 24px)' }}>{e}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 900, color: d === '1848' ? BLEU : or, fontSize: 'clamp(16px, 2.8vw, 26px)' }}>{d}</div>
          <div style={texteCarte}>{t}</div>
          {s && <div style={{ ...texteCarte, opacity: 0.75, fontStyle: 'italic' }}>{s}</div>}
        </div>
      ))}
    </div>
  )
}

const CONDITIONS = [['🇫🇷', 'la nationalité française', 'ou ressortissant de l\'UE : municipales et Parlement européen'], ['🎂', 'être majeur', 'au moins 18 ans'], ['⚖️', 'ne pas avoir été privé de ses droits civiques', ''], ['📋', 'être inscrit sur les listes électorales', 'sur internet ou à la mairie']]
function Conditions({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>✅ à ce jour, pour voter, il faut…</div>
      <div style={{ display: 'grid', gap: 4, width: 'min(92vw, 560px)' }}>
        {CONDITIONS.slice(0, Math.min(4, étape)).map(([e, t, s], k) => (
          <div key={t} className="c-apparait" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 12, background: 'rgba(14,12,32,.84)', border: `1.5px solid ${VERT}`, animationDelay: `${(k % 2) * 0.15}s` }}>
            <span style={{ fontSize: 'clamp(15px, 2.4vw, 22px)' }}>{e}</span>
            <span style={{ ...texteCarte, color: '#fff' }}>{t}{s && <span style={{ display: 'block', color: crème, opacity: 0.8, fontSize: 'clamp(10.5px, 1.4vw, 13px)' }}>{s}</span>}</span>
            <span style={{ marginLeft: 'auto', color: VERT, fontWeight: 900 }}>✓</span>
          </div>
        ))}
      </div>
      {étape >= 5 && <div className="c-impact-6" style={{ ...pastille(), borderColor: ROUGE }}>⛔ une condition manque : pas de vote</div>}
    </div>
  )
}

function Privation({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={{ ...pastille(), borderColor: ROUGE }}>⚖️ une sanction pour des infractions graves</div>
      {étape >= 2 && <div style={rangée}>{['🗳️ le droit de vote', '🙋 se présenter à une élection'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: `${k * 0.3}s`, textDecoration: 'line-through', textDecorationColor: ROUGE }}>{t}</span>)}</div>}
      {étape >= 2 && <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.7s' }}>retire certains droits fondamentaux</div>}
    </div>
  )
}

function VoteSecret({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🤫 le vote est personnel et secret</div>
      {étape >= 2 && (
        <div style={rangée}>
          {['🚪 l\'isoloir', '📄 le bulletin dans l\'enveloppe', '🗳️ l\'urne'].map((t, k) => (
            <span key={t} style={{ display: 'contents' }}>
              {k > 0 && flèche(k * 0.4 - 0.1)}
              <span className="c-mot-pilule" style={{ ...pilule(BLEU, { padding: '4px 10px' }), animationDelay: `${k * 0.4}s` }}>{t}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Isoloir({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🚪 dans l'isoloir</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(ROUGE)}>⛔ entrer à plusieurs</span>
        {étape >= 2 && <span className="c-mot-pilule" style={pilule(ROUGE)}>⛔ communiquer avec un autre isoloir</span>}
      </div>
    </div>
  )
}

function PièceIdentité({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-mot-pilule" style={{ ...carte(or), display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg viewBox="0 0 60 40" style={{ width: 'clamp(38px, 6vw, 56px)' }} aria-hidden="true"><rect x="1" y="1" width="58" height="38" rx="5" fill="#e0ecff" stroke="#1d4ed8" strokeWidth="2" /><rect x="6" y="8" width="16" height="20" rx="3" fill="#94a3b8" /><path d="M27,12 L52,12 M27,19 L48,19 M27,26 L44,26" stroke="#334155" strokeWidth="3" /></svg>
        <span style={{ textAlign: 'left' }}><span style={{ display: 'block', ...titreCarte(or) }}>Pièce d'identité</span><span style={texteCarte}>Français ou ressortissants de l'UE</span></span>
      </div>
      {étape >= 2 && <div className="c-mot-pilule" style={pilule(VERT)}>🏘️ pas obligatoire dans les communes de moins de 1 000 habitants</div>}
      {étape >= 3 && <div className="c-apparait" style={pastille(false)}>❔ en cas de doute : prouver son identité par tout moyen</div>}
    </div>
  )
}

function Panneaux({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>📋 des panneaux d'affichage électoral dans chaque commune</div>
      {étape >= 2 && <div className="c-mot-pilule" style={pilule(BLEU)}>ℹ️ la présentation des candidats, pour informer les citoyens</div>}
      {étape >= 3 && <div className="c-impact-6" style={{ ...pastille(), borderColor: ROUGE }}>⛔ aucune dégradation tolérée</div>}
    </div>
  )
}

function Récap({ étape }) {
  if (étape < 1) return null
  const l = [['👩‍⚖️', 'La justice', 'rendue par les juges', VIOLET], ['📜', 'Le Conseil constitutionnel', 'lois conformes à la Constitution · élections nationales', BLEU], ['🗳️', 'Le vote', 'universel · personnel et secret', or]]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {l.map(([e, t, s, c], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.5}s`, borderColor: c, borderRadius: 16, width: 'clamp(104px, 29vw, 250px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: `0 0 22px ${c}55` }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{e}</div>
          <div style={titreCarte(c)}>{t}</div>
          <div style={{ ...texteCarte, fontSize: 'clamp(11px, 1.6vw, 15px)' }}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels17({ nom, étape }) {
  switch (nom) {
    case 'justice': return <Justice étape={étape} />
    case 'conseil-constitutionnel': return <Conseil étape={étape} />
    case 'droit-vote': return <DroitVote étape={étape} />
    case 'frise-vote': return <FriseVote étape={étape} />
    case 'conditions': return <Conditions étape={étape} />
    case 'privation': return <Privation étape={étape} />
    case 'vote-secret': return <VoteSecret étape={étape} />
    case 'isoloir': return <Isoloir étape={étape} />
    case 'piece-identite': return <PièceIdentité étape={étape} />
    case 'panneaux': return <Panneaux étape={étape} />
    case 'recap-17': return <Récap étape={étape} />
    default: return null
  }
}
