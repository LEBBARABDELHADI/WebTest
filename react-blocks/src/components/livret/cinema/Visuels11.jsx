// Visuels pédagogiques du court-métrage de la page 11 (responsives, compacts
// pour laisser voir les personnages sur téléphone). Les religions sont
// évoquées par des bâtiments génériques, sans en distinguer aucune.
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const ROUGE = '#ef4444', VERT = '#22c55e'

function Séparation({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: 16, overflow: 'hidden', border: `2px solid ${or}`, background: 'rgba(14,12,32,.86)' }}>
        <div style={{ padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 20px)', textAlign: 'center', color: crème }}>
          <div style={{ fontSize: 'clamp(20px, 3.4vw, 32px)' }}>🏛️</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)' }}>l'État</div>
        </div>
        <div style={{ width: 4, background: `repeating-linear-gradient(${or} 0 8px, transparent 8px 14px)` }} />
        <div style={{ padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 20px)', textAlign: 'center', color: crème }}>
          <div style={{ fontSize: 'clamp(20px, 3.4vw, 32px)' }}>⛪🕌🕍🛕</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)' }}>les organisations religieuses</div>
        </div>
      </div>
      <div className="c-apparait" style={{ ...pastille(), animationDelay: '.5s' }}>📜 loi de 1905 · séparation des Églises et de l'État</div>
      {étape >= 2 && <div className="c-apparait" style={pastille(false)}>⚖️ la même loi pour tout le monde</div>}
    </div>
  )
}

function RèglesÉtat({ étape }) {
  if (étape < 1) return null
  const règles = [['🚫', 'ne soutient aucune organisation religieuse', 1, or], ['⚖️', 'les considère toutes de la même manière', 2, or], ['🔒', 'pas impliqué dans leur fonctionnement interne', 2, or], ['⛔', 'pas de financement de la construction d\'un édifice religieux', 3, ROUGE], ['⛔', 'pas de salaire pour un personnel religieux', 3, ROUGE]]
  return (
    <div style={colonne}>
      <div style={pastille(false)}>🏛️ L'État…</div>
      <div style={rangée}>
        {règles.filter(r => étape >= r[2]).map(([e, t, , c], k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(c), animationDelay: `${(k % 2) * 0.3}s` }}>{e} {t}</span>)}
      </div>
    </div>
  )
}

function CarteAlsace({ étape }) {
  return (
    <div style={{ position: 'absolute', inset: 'calc(clamp(22px, 6.5vh, 66px) + 12px) 4% 16%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <svg viewBox="0 0 400 390" style={{ height: '100%', maxHeight: 420, width: 'auto', maxWidth: '100%', filter: 'drop-shadow(0 18px 40px rgba(0,0,0,.6))' }} role="img" aria-label="Carte de France : l'Alsace et la Moselle mises en évidence">
        <path className="c-trace" d="M132,28 L214,40 L256,72 L300,88 L334,104 L322,178 L300,214 L328,262 L318,330 L248,346 L182,362 L128,352 L94,332 L106,252 L62,196 L18,150 L62,122 L112,110 Z" fill="rgba(37,99,235,.28)" stroke="#bfdbfe" strokeWidth="3" strokeLinejoin="round" />
        <path d="M132,28 L214,40 L256,72 L300,88 L334,104 L322,178 L300,214 L328,262 L318,330 L248,346 L182,362 L128,352 L94,332 L106,252 L62,196 L18,150 L62,122 L112,110 Z" fill="rgba(37,99,235,.22)" />
        {étape >= 2 && (
          <g className="c-apparait">
            <path d="M256,72 L300,88 L302,122 L272,118 L250,96 Z" fill={or} stroke="#fff" strokeWidth="2" className="c-scintille" />
            <path d="M300,88 L334,104 L322,178 L304,180 L302,122 Z" fill="#fb923c" stroke="#fff" strokeWidth="2" className="c-scintille" style={{ animationDelay: '.6s' }} />
            <text x="236" y="66" textAnchor="end" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#fff">Moselle</text>
            <text x="346" y="150" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#fff">Alsace</text>
          </g>
        )}
        <circle cx="200" cy="120" r="5" fill="#fff" /><text x="210" y="125" fontFamily="system-ui" fontSize="13" fill="#e5e7eb">Paris</text>
      </svg>
      {étape >= 1 && <div className="c-apparait" style={pastille()}>⚠️ quelques exceptions{étape >= 2 ? ' · accords spéciaux, en raison de l\'Histoire' : ''}</div>}
    </div>
  )
}

function Patrimoine({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(ROUGE)}>⛔ construire un édifice religieux</span>
        <span className="c-mot-pilule" style={{ ...pilule(VERT), animationDelay: '.4s' }}>✅ restaurer un monument religieux classé</span>
      </div>
    </div>
  )
}

function Neutres({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        {['🏛️ l\'État', '🏙️ les collectivités territoriales', '🏢 les services publics'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(), animationDelay: `${k * 0.3}s` }}>{t}</span>)}
      </div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '1s' }}>= neutres vis-à-vis des religions</div>
      {étape >= 2 && <div className="c-apparait" style={pastille()}>🤝 tous traités de la même manière · la neutralité de l'État</div>}
    </div>
  )
}

function Prosélytisme({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>💬 prosélytisme : vouloir convaincre d'adopter sa religion</div>
      {étape >= 2 && <div className="c-apparait" style={pastille(false)}>📄 tracts dans la rue : possible, sans trouble à l'ordre public</div>}
    </div>
  )
}

function SansPression({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(VERT)}>✅ convaincre, sans forcer</span>
        {['violence', 'menace', 'pression'].map((m, k) => <span key={m} className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: `${0.4 + k * 0.3}s`, textDecoration: 'line-through' }}>⛔ {m}</span>)}
      </div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '1.4s' }}>personne n'est forcé à croire contre son gré</div>
    </div>
  )
}

function InterditSP({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ ...pastille(), borderColor: ROUGE, boxShadow: '0 0 24px rgba(239,68,68,.45)' }}>🏢 service public : prosélytisme interdit</div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.6s' }}>en application de la neutralité de l'État</div>
    </div>
  )
}

// Un journal satirique imaginaire : la caricature est évoquée, pas montrée.
function Blasphème({ étape }) {
  return (
    <div style={colonne}>
      {étape >= 1 && <div className="c-apparait" style={pastille()}>🗯️ blasphème : parole qui insulte la divinité, la religion, le sacré</div>}
      {étape >= 2 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div className="c-journal" style={{ width: 'clamp(110px, 18vw, 170px)', background: '#f8f5ec', color: '#111', borderRadius: 4, padding: 8, boxShadow: '0 14px 30px rgba(0,0,0,.5)', fontFamily: 'Georgia, serif' }}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(12px, 1.8vw, 16px)', borderBottom: '2px solid #111', marginBottom: 6 }}>LE CRAYON</div>
            <svg viewBox="0 0 120 70" style={{ width: '100%', display: 'block' }} aria-hidden="true">
              <rect x="2" y="2" width="116" height="66" fill="#fff" stroke="#111" strokeWidth="2" />
              <path d="M18,56 L74,12 L84,22 L28,66 Z" fill="#f2c94c" stroke="#111" strokeWidth="2" /><path d="M18,56 L28,66 L12,70 Z" fill="#111" />
              <path d="M78,40 q16,-14 32,0 q-4,14 -18,14 l-8,8 l1,-9 q-9,-4 -7,-13 Z" fill="#fff" stroke="#111" strokeWidth="2" /><text x="93" y="49" textAnchor="middle" fontSize="14" fontWeight="900">!?</text>
            </svg>
            <div style={{ fontSize: 10, fontStyle: 'italic', marginTop: 4 }}>caricature</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="c-mot-pilule" style={pilule(VERT)}>⚖️ pas un délit en France</span>
            <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.4s' }}>✏️ critiquer · se moquer · caricaturer</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Expression({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...boîte, top: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="c-apparait" style={pastille()}>🗣️ la liberté d'expression</div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.5s' }}>personne ne peut être puni pour avoir critiqué une religion</div>
    </div>
  )
}

function TroisPoints({ étape }) {
  if (étape < 1) return null
  const l = [['1', '🏛️', 'un État neutre'], ['2', '💬', 'convaincre sans forcer'], ['3', '✏️', 'libre de critiquer']]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {l.map(([n, e, t], k) => (
        <div key={n} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.6}s`, borderColor: or, borderRadius: 16, padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 18px)', boxShadow: '0 0 28px rgba(255,209,102,.45)' }}>
          <div style={{ fontFamily: 'system-ui', fontWeight: 900, color: or, fontSize: 'clamp(11px, 1.6vw, 14px)' }}>{n}</div>
          <div style={{ fontSize: 'clamp(18px, 3vw, 28px)' }}>{e}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)' }}>{t}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels11({ nom, étape }) {
  switch (nom) {
    case 'separation': return <Séparation étape={étape} />
    case 'regles-etat': return <RèglesÉtat étape={étape} />
    case 'carte-alsace': return <CarteAlsace étape={étape} />
    case 'patrimoine': return <Patrimoine étape={étape} />
    case 'neutres': return <Neutres étape={étape} />
    case 'proselytisme': return <Prosélytisme étape={étape} />
    case 'sans-pression': return <SansPression étape={étape} />
    case 'interdit-sp': return <InterditSP étape={étape} />
    case 'blaspheme': return <Blasphème étape={étape} />
    case 'expression': return <Expression étape={étape} />
    case 'trois-points': return <TroisPoints étape={étape} />
    default: return null
  }
}
