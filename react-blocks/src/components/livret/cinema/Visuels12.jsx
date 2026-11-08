// Visuels pédagogiques du court-métrage de la page 12 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const ROUGE = '#ef4444', VERT = '#22c55e'

const LIMITES = [['🗯️', 'diffamation, injures publiques'], ['⚠️', 'encourager des crimes ou délits contre une religion'], ['🔥', 'inciter à la haine raciale, ethnique ou religieuse'], ['💣', 'justifier crimes de guerre ou terrorisme par la religion'], ['🚷', 'inciter à discriminer'], ['🕯️', 'nier un crime contre l\'humanité (négationnisme)']]

function Limites({ étape }) {
  return (
    <div style={colonne}>
      <div style={pastille(false)}>🗣️ Liberté d'expression : des limites…</div>
      {étape >= 1 && (
        <div style={rangée}>
          {LIMITES.slice(0, étape).map(([e, t], k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(k === étape - 1 ? ROUGE : 'rgba(239,68,68,.45)'), opacity: k === étape - 1 ? 1 : 0.8 }}>{e} {t}</span>)}
        </div>
      )}
      {étape === 0 && <div className="c-apparait" style={{ ...pastille(), animationDelay: '.6s' }}>✏️ … qui ne concernent pas le blasphème</div>}
    </div>
  )
}

function EspacePublic({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>{['🛣️ rues', '🌳 parcs et jardins', '🧺 marchés', '🚋 transports'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(), animationDelay: `${k * 0.25}s` }}>{t}</span>)}</div>
      {étape >= 2 && <div className="c-apparait" style={pastille(false)}>✅ signes religieux · célébrations · rassemblements · convictions</div>}
    </div>
  )
}

function OrdrePublic({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🚦 l'ordre public, indispensable</div>
      <div style={rangée}>{[['📝', 'soumise à autorisation'], ['🚧', 'encadrée'], ['⛔', 'interdite']].map(([e, t], k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(k === 2 ? ROUGE : or), animationDelay: `${0.3 + k * 0.3}s` }}>{e} {t}</span>)}</div>
      {étape >= 2 && <div className="c-apparait" style={pastille(false)}>exemple : prières de rue</div>}
    </div>
  )
}

function Loi2010({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ ...pastille(), borderColor: ROUGE }}>📜 loi du 11 octobre 2010</div>
      <div style={rangée}>{['cagoule', 'masque', 'voile intégral…'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: `${0.4 + k * 0.3}s` }}>⛔ {t}</span>)}</div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '1.4s' }}>visage dissimulé interdit dans l'espace public · ordre public</div>
    </div>
  )
}

function AgentsNeutres({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>{['🏥 hôpitaux', '🏫 écoles', '🏛️ mairies'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(), animationDelay: `${k * 0.25}s` }}>{t}</span>)}</div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.8s' }}>👔 agents neutres pendant leur travail</div>
      {étape >= 2 && <div className="c-apparait" style={pastille()}>⚖️ un traitement équitable des usagers</div>}
    </div>
  )
}

function MursNeutres({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...colonne, top: '30%' }}>
      <div className="c-impact-6" style={{ ...pastille(), fontSize: 'clamp(15px, 2.6vw, 24px)' }}>aucun signe ni emblème</div>
      <div style={rangée}>{['religieux', 'politique', 'philosophique'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: `${0.4 + k * 0.3}s`, textDecoration: 'line-through' }}>{t}</span>)}</div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '1.4s' }}>🗂️ bureaux · 🪟 guichets · 🚪 espaces communs</div>
    </div>
  )
}

function Usagers({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(or)}>👔 agent : neutre</span>
        <span className="c-mot-pilule" style={{ ...pilule(VERT), animationDelay: '.4s' }}>🙂 usager : signe religieux possible</span>
      </div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.9s' }}>en respectant les règles de fonctionnement du service</div>
    </div>
  )
}

function Adaptation({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ ...pastille(), borderColor: ROUGE, boxShadow: '0 0 24px rgba(239,68,68,.45)' }}>⛔ exiger une adaptation du service public au nom d'une religion</div>
    </div>
  )
}

function LieuxRécap({ étape }) {
  if (étape < 1) return null
  const l = [['🗣️', 'Expression', 'des limites, pas le blasphème'], ['🏙️', 'Espace public', 'religion visible · ordre public'], ['🏛️', 'Services publics', 'agents neutres · usagers libres']]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {l.map(([e, t, s], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.6}s`, borderColor: or, borderRadius: 16, width: 'clamp(100px, 24vw, 220px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: '0 0 26px rgba(255,209,102,.4)' }}>
          <div style={{ fontSize: 'clamp(18px, 3vw, 28px)' }}>{e}</div>
          <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', textTransform: 'uppercase', letterSpacing: '.05em', color: or }}>{t}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.7vw, 16px)', lineHeight: 1.25, color: crème }}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels12({ nom, étape }) {
  switch (nom) {
    case 'limites': return <Limites étape={étape} />
    case 'espace-public': return <EspacePublic étape={étape} />
    case 'ordre-public': return <OrdrePublic étape={étape} />
    case 'loi-2010': return <Loi2010 étape={étape} />
    case 'agents-neutres': return <AgentsNeutres étape={étape} />
    case 'murs-neutres': return <MursNeutres étape={étape} />
    case 'usagers': return <Usagers étape={étape} />
    case 'adaptation': return <Adaptation étape={étape} />
    case 'lieux-recap': return <LieuxRécap étape={étape} />
    default: return null
  }
}
