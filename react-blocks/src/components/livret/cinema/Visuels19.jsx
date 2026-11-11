// Visuels pédagogiques du court-métrage de la page 19 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const BLEU = '#93c5fd', VERT = '#22c55e', VIOLET = '#c4b5fd', TURQUOISE = '#5eead4', GRIS = '#cbd5e1'
const titreCarte = c => ({ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', letterSpacing: '.05em', textTransform: 'uppercase', color: c })
const texte = { fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(11.5px, 1.6vw, 15px)', lineHeight: 1.25 }
const grand = (chiffre, c, légende, extra = {}) => (
  <div className="c-impact-6" style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '2px 16px', borderRadius: 18, background: 'rgba(14,12,32,.84)', border: `2px solid ${c}`, ...extra }}>
    <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 'clamp(28px, 5.6vw, 52px)', color: c, lineHeight: 1.1 }}>{chiffre}</span>
    <span style={{ fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(13px, 2vw, 19px)' }}>{légende}</span>
  </div>
)
const liste = (items, c, étape, départ = 1) => <div style={rangée}>{items.map((t, k) => (étape >= départ + (Array.isArray(t) ? t[1] : 0) ? <span key={Array.isArray(t) ? t[0] : t} className="c-mot-pilule" style={{ ...pilule(c), animationDelay: `${(k % 3) * 0.2}s` }}>{Array.isArray(t) ? t[0] : t}</span> : null))}</div>

function Décentralisation({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>🏛️ l'État</span>
        <span className="c-apparait" style={{ ...texte, fontStyle: 'italic', color: or, animationDelay: '.3s' }}>transfère des compétences et des moyens →</span>
        <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.6s' }}>🗺️ collectivités territoriales</span>
      </div>
      {étape >= 2 && liste(['🏘️ communes', '🗺️ départements', '🧭 régions', '🌴 collectivités d\'outre-mer'], VERT, étape, 2)}
    </div>
  )
}

function Préfets({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🏛️ l'État est représenté dans ces territoires par…</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>🎖️ les préfets de région et de département</span>
        {étape >= 2 && <span className="c-mot-pilule" style={pilule(TURQUOISE)}>🌴 les hauts commissaires (certaines collectivités d'outre-mer)</span>}
      </div>
    </div>
  )
}

function Communes({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      {grand('34 875', or, 'communes au 1er janvier 2025')}
      {étape >= 2 && <div style={rangée}><span className="c-mot-pilule" style={pilule(BLEU)}>👤 un maire</span><span className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: '.25s' }}>👥 un conseil municipal</span><span className="c-apparait" style={{ ...pastille(), animationDelay: '.5s' }}>⏳ élu pour six ans</span></div>}
      {étape >= 3 && <div className="c-mot-pilule" style={pilule(VERT)}>🗳️ élections municipales : citoyens français et ressortissants de l'UE</div>}
    </div>
  )
}

function MissionsCommunes({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🏘️ les communes sont responsables notamment…</div>
      {liste([['🎒 des écoles primaires publiques (maternelles et élémentaires)', 0], ['⚽ des activités sportives et culturelles', 1], ['🛣️ de l\'entretien des routes communales', 1]], GRIS, étape)}
      {étape >= 3 && <div className="c-mot-pilule" style={pilule(or)}>📖 état civil : naissances · mariages · décès</div>}
    </div>
  )
}

function Intercommunalités({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>{['🏘️', '🏘️', '🏘️'].map((e, k) => <span key={k} className="c-apparait" style={{ fontSize: 'clamp(20px, 3.4vw, 32px)', animationDelay: `${k * 0.15}s` }}>{e}</span>)}<span className="c-apparait" style={{ ...pastille(), animationDelay: '.5s' }}>intercommunalités : communautés de communes, métropoles…</span></div>
      {étape >= 2 && liste(['💧 eau', '🚰 assainissement', '♻️ déchets', '🚌 transports urbains…'], BLEU, étape, 2)}
    </div>
  )
}

function MissionsDépartements({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🗺️ les départements · administrés par les conseils départementaux</div>
      {liste([['🏫 collèges publics', 1], ['🤝 action sociale', 1], ['🛣️ routes départementales', 1], ['🧒 protection de l\'enfance', 2], ['👵 aide aux personnes âgées', 2]], VIOLET, étape)}
    </div>
  )
}

function Départements101({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      {grand('101', VIOLET, 'départements')}
      <div style={rangée}><span className="c-mot-pilule" style={pilule(BLEU)}>96 en métropole</span><span className="c-mot-pilule" style={{ ...pilule(TURQUOISE), animationDelay: '.3s' }}>5 en outre-mer</span></div>
      {étape >= 2 && <div className="c-apparait" style={pastille()}>🌴 le plus récent : Mayotte, créé en 2011</div>}
    </div>
  )
}

function Régions({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>13 régions métropolitaines</span>
        <span className="c-apparait" style={{ color: or, fontWeight: 900, fontSize: 'clamp(16px, 2.6vw, 24px)', animationDelay: '.3s' }}>+</span>
        <span className="c-mot-pilule" style={{ ...pilule(TURQUOISE), animationDelay: '.45s' }}>5 régions en outre-mer</span>
      </div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.7s' }}>administrées par les conseils régionaux</div>
      {étape >= 2 && grand('18', TURQUOISE, 'régions en tout')}
    </div>
  )
}

function MissionsRégions({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🧭 les régions sont chargées notamment…</div>
      {liste([['🚌 des transports publics', 1], ['📈 du développement économique', 1], ['🛠️ de la formation professionnelle', 1], ['🏫 de la construction et l\'entretien des lycées publics', 2]], TURQUOISE, étape)}
    </div>
  )
}

function Récap({ étape }) {
  if (étape < 1) return null
  const l = [['🏘️', 'Commune', 'maire et conseil municipal · écoles primaires · état civil', GRIS], ['🗺️', 'Département', 'conseil départemental · collèges · action sociale', VIOLET], ['🧭', 'Région', 'conseil régional · lycées · transports publics', TURQUOISE]]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {l.map(([e, t, s, c], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.5}s`, borderColor: c, borderRadius: 16, width: 'clamp(104px, 29vw, 250px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: `0 0 22px ${c}55` }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{e}</div>
          <div style={titreCarte(c)}>{t}</div>
          <div style={texte}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels19({ nom, étape }) {
  switch (nom) {
    case 'decentralisation': return <Décentralisation étape={étape} />
    case 'prefets': return <Préfets étape={étape} />
    case 'communes-19': return <Communes étape={étape} />
    case 'missions-communes': return <MissionsCommunes étape={étape} />
    case 'intercommunalites': return <Intercommunalités étape={étape} />
    case 'missions-departements': return <MissionsDépartements étape={étape} />
    case 'departements-101': return <Départements101 étape={étape} />
    case 'regions-18': return <Régions étape={étape} />
    case 'missions-regions': return <MissionsRégions étape={étape} />
    case 'recap-19': return <Récap étape={étape} />
    default: return null
  }
}
