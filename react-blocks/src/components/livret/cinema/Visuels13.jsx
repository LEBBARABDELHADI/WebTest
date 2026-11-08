// Visuels pédagogiques du court-métrage de la page 13 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const ROUGE = '#ef4444', VERT = '#22c55e'
const carte = (bord, extra = {}) => ({ borderRadius: 14, padding: 'clamp(5px, 1vw, 10px) clamp(8px, 1.6vw, 14px)', borderColor: bord, minWidth: 'min(40vw, 210px)', ...extra })
const titreCarte = c => ({ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', letterSpacing: '.05em', textTransform: 'uppercase', color: c })

function PublicPrivé({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <div className="c-mot-pilule" style={carte(or)}><div style={titreCarte(or)}>🏛️ Services publics</div><div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 16px)' }}>fonctionnaires et agents publics</div></div>
        <div className="c-mot-pilule" style={{ ...carte('#93c5fd'), animationDelay: '.4s' }}><div style={titreCarte('#93c5fd')}>🏢 Entreprises privées</div><div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 16px)' }}>salariés</div></div>
      </div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.9s' }}>≠ la laïcité ne s'applique pas de la même manière</div>
    </div>
  )
}

function AgentPublic({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🏛️ agent public · neutralité de l'État</div>
      <div style={rangée}>{['montrer sa religion ou ses opinions', 'porter des signes religieux', 'pratiquer sa religion au travail'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: `${0.3 + k * 0.3}s` }}>⛔ {t}</span>)}</div>
    </div>
  )
}

function Salariés({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={{ ...pastille(), borderColor: VERT }}>✅ salariés du privé : opinions religieuses, tenues, signes</div>
      {étape >= 2 && <div style={rangée}>{[['⚙️', 'sauf si cela perturbe le bon fonctionnement'], ['🦺', 'ou pour des raisons de sécurité']].map(([e, t], k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: `${k * 0.35}s` }}>{e} {t}</span>)}</div>}
    </div>
  )
}

function Règlement({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-journal" style={{ background: '#f8f5ec', color: '#111', borderRadius: 6, padding: '8px 12px', boxShadow: '0 14px 30px rgba(0,0,0,.5)', fontFamily: 'Georgia, serif', width: 'min(70vw, 300px)' }}>
        <div style={{ fontWeight: 900, fontSize: 'clamp(12px, 1.9vw, 17px)', borderBottom: '2px solid #111', marginBottom: 4 }}>📘 Règlement intérieur</div>
        <div style={{ fontSize: 'clamp(11.5px, 1.7vw, 15px)', lineHeight: 1.3 }}>Limites possibles, si elles sont <strong>justifiées par la nature des tâches</strong> confiées au salarié.</div>
      </div>
    </div>
  )
}

function Absence({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>📅 autorisation d'absence pour une fête religieuse : on peut la demander</div>
      {étape >= 2 && <div style={rangée}>
        <span className="c-mot-pilule" style={pilule('rgba(255,255,255,.4)')}>refus possible : 📘 règlement intérieur · 🗓️ nécessités de service</span>
        <span className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: '.4s' }}>⛔ jamais discriminatoire</span>
      </div>}
    </div>
  )
}

function ÉcoleNeutre({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🏫 école publique neutre vis-à-vis des religions</div>
      <div style={rangée}>{['💭 penser librement', '🧩 se construire ses opinions', '🛡️ à l\'abri des pressions'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(), animationDelay: `${0.4 + k * 0.3}s` }}>{t}</span>)}</div>
    </div>
  )
}

function Charte({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ ...pastille(), fontSize: 'clamp(14px, 2.4vw, 22px)' }}>📜 Charte de la laïcité à l'École</div>
      {étape >= 2 && <div style={rangée}>{['👩‍🏫 professeurs', '🎨 animateurs périscolaires', '🎒 élèves', '👪 parents d\'élèves'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(), animationDelay: `${k * 0.25}s` }}>{t}</span>)}</div>}
    </div>
  )
}

function Loi2004({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>📜 loi du 15 mars 2004</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(ROUGE)}>⛔ signe ou vêtement ostensible · visible immédiatement</span>
        {étape >= 2 && <span className="c-mot-pilule" style={pilule(VERT)}>✅ signes discrets autorisés</span>}
      </div>
    </div>
  )
}

function Programme({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ ...pastille(), borderColor: ROUGE }}>⛔ refuser une règle ou un enseignement au nom de sa religion</div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.6s' }}>🔬 sciences · ⚽ sport · 📚 programme scolaire : pour tous</div>
    </div>
  )
}

function TravailÉcole({ étape }) {
  if (étape < 1) return null
  const l = [['🏛️', 'Agents publics', 'neutres au travail'], ['🏢', 'Salariés du privé', 'libres, avec des limites'], ['🏫', 'École publique', 'neutre · Charte · loi de 2004']]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {l.map(([e, t, s], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.6}s`, borderColor: or, borderRadius: 16, width: 'clamp(100px, 24vw, 220px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: '0 0 26px rgba(255,209,102,.4)' }}>
          <div style={{ fontSize: 'clamp(18px, 3vw, 28px)' }}>{e}</div>
          <div style={titreCarte(or)}>{t}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.7vw, 16px)', lineHeight: 1.25, color: crème }}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels13({ nom, étape }) {
  switch (nom) {
    case 'public-prive': return <PublicPrivé étape={étape} />
    case 'agent-public': return <AgentPublic étape={étape} />
    case 'salaries': return <Salariés étape={étape} />
    case 'reglement': return <Règlement étape={étape} />
    case 'absence': return <Absence étape={étape} />
    case 'ecole-neutre': return <ÉcoleNeutre étape={étape} />
    case 'charte': return <Charte étape={étape} />
    case 'loi-2004': return <Loi2004 étape={étape} />
    case 'programme': return <Programme étape={étape} />
    case 'travail-ecole': return <TravailÉcole étape={étape} />
    default: return null
  }
}
