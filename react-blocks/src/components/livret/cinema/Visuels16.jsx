// Visuels pédagogiques du court-métrage de la page 16 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const BLEU = '#93c5fd', VERT = '#22c55e', ROUGE = '#ef4444'
const titreCarte = c => ({ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', letterSpacing: '.05em', textTransform: 'uppercase', color: c })
const carte = (bord, extra = {}) => ({ borderRadius: 14, padding: 'clamp(5px, 1vw, 10px) clamp(8px, 1.4vw, 12px)', border: `2px solid ${bord}`, background: 'rgba(14,12,32,.84)', ...extra })
const texteCarte = { fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(11.5px, 1.6vw, 15px)', lineHeight: 1.25 }
const flèche = (délai = 0, sens = '→') => <span className="c-apparait" aria-hidden="true" style={{ color: or, fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 900, animationDelay: `${délai}s` }}>{sens}</span>
const parchemin = { background: '#f8f5ec', color: '#111', borderRadius: 6, padding: '8px 12px', boxShadow: '0 14px 30px rgba(0,0,0,.5)', fontFamily: 'Georgia, serif', width: 'min(84vw, 440px)' }

function ÉtatDeDroit({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>⚖️ la loi doit être respectée par tous</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>👥 les citoyens</span>
        <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.35s', boxShadow: '0 0 22px rgba(255,209,102,.45)' }}>🏛️ y compris l'État</span>
      </div>
      {étape >= 2 && (
        <div style={rangée}>
          <span className="c-mot-pilule" style={pilule(VERT)}>✅ État de droit : condition de la démocratie</span>
          <span className="c-mot-pilule" style={{ ...pilule(ROUGE), animationDelay: '.35s' }}>⛔ État arbitraire</span>
        </div>
      )}
    </div>
  )
}

function Article2({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-journal" style={parchemin}>
        <div style={{ fontWeight: 900, fontSize: 'clamp(11.5px, 1.7vw, 15px)', borderBottom: '2px solid #111', marginBottom: 4 }}>📜 Constitution de 1958 · article 2 · le principe de la démocratie</div>
        <div style={{ fontSize: 'clamp(13px, 2vw, 18px)', lineHeight: 1.35, fontStyle: 'italic' }}>« le Gouvernement du peuple, par le peuple et pour le peuple »</div>
      </div>
      <div style={rangée}>{['du peuple', 'par le peuple', 'pour le peuple'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(), animationDelay: `${0.5 + k * 0.3}s` }}>👥 {t}</span>)}</div>
    </div>
  )
}

function Constitution({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>📜 la Constitution structure le système institutionnel</div>
      {étape >= 2 && <div className="c-mot-pilule" style={pilule(BLEU)}>🗳️ référendum : un vote où les citoyens sont consultés directement</div>}
      {étape >= 3 && <div className="c-impact-6" style={{ ...pastille(), fontSize: 'clamp(15px, 2.6vw, 24px)' }}>Ve République · adoptée en 1958</div>}
    </div>
  )
}

function Modifier({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>✍️ modifier la Constitution</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>🗳️ par référendum</span>
        <span className="c-apparait" style={{ color: crème, fontFamily: 'Georgia, serif', fontStyle: 'italic', animationDelay: '.4s' }}>ou</span>
        <span className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: '.6s' }}>🏛️ par le Parlement réuni en Congrès</span>
      </div>
    </div>
  )
}

function Préambule({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>les décisions de l'État respectent…</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>📜 la Constitution française</span>
        <span className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: '.35s' }}>🕊️ la Déclaration de 1789</span>
      </div>
      {étape >= 2 && <div className="c-apparait" style={pastille(false)}>la Déclaration de 1789 est citée dans le préambule de la Constitution</div>}
      {étape >= 3 && <div className="c-mot-pilule" style={pilule()}>🏛️ la Constitution définit l'organisation de l'État</div>}
    </div>
  )
}

const PRINCIPES = [['🛡️', 'protection des libertés fondamentales'], ['🧩', 'séparation des trois pouvoirs'], ['⚖️', 'indépendance de la justice']]
function Principes({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>les principes de l'État de droit</div>
      <div style={rangée}>{PRINCIPES.slice(0, étape).map(([e, t]) => <span key={t} className="c-mot-pilule" style={pilule()}>{e} {t}</span>)}</div>
    </div>
  )
}

const POUVOIRS = [['🏛️', 'Législatif', 'élaborer et voter des lois', 'députés et sénateurs', BLEU], ['🏢', 'Exécutif', 'définir la politique de la Nation et mettre en œuvre les lois', 'gouvernement', or], ['👩‍⚖️', 'Judiciaire', 'rendre la justice', 'les juges', '#c4b5fd']]
function TroisPouvoirs({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {POUVOIRS.slice(0, étape).map(([e, n, t, qui, c]) => (
        <div key={n} className="c-mot-pilule" style={{ ...carte(c), width: 'clamp(104px, 29vw, 250px)' }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{e}</div>
          <div style={titreCarte(c)}>Pouvoir {n.toLowerCase()}</div>
          <div style={texteCarte}>{t}</div>
          <div style={{ ...texteCarte, color: c, fontWeight: 700, marginTop: 2 }}>{qui}</div>
        </div>
      ))}
    </div>
  )
}

function Partis({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div aria-hidden="true" style={{ display: 'flex', gap: 10 }}>
        {['#f59e0b', '#22c55e', '#a855f7', '#0ea5e9'].map((c, k) => (
          <svg key={c} className="c-monte" viewBox="0 0 40 50" style={{ width: 'clamp(26px, 4vw, 40px)', animationDelay: `${k * 0.15}s` }}><rect x="4" y="2" width="3" height="46" fill="#ddd" /><path d="M7,4 L36,9 L7,22 Z" fill={c} /></svg>
        ))}
      </div>
      <div className="c-apparait" style={pastille()}>🎌 les partis politiques se forment et exercent leur activité librement</div>
    </div>
  )
}

function Administration({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🗂️ l'administration exerce ses missions dans le respect…</div>
      <div style={rangée}>{['📜 de la Constitution', '⚖️ des lois', '🇫🇷 des principes républicains'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: `${k * 0.25}s` }}>{t}</span>)}</div>
      {étape >= 2 && <div className="c-impact-6" style={pastille()}>👩‍⚖️ sous le contrôle du juge</div>}
    </div>
  )
}

function Président({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🇫🇷 Président de la République · chef de l'État et des armées</div>
      {étape >= 2 && <div style={rangée}>{['🗳️ suffrage universel direct', '⏳ cinq ans', '🔁 renouvelables une fois'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(), animationDelay: `${k * 0.3}s` }}>{t}</span>)}</div>}
    </div>
  )
}

function Parrainages({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '2px 16px', borderRadius: 18, background: 'rgba(14,12,32,.84)', border: `2px solid ${or}` }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 'clamp(30px, 6vw, 56px)', color: or, lineHeight: 1.1 }}>500</span>
        <span style={{ fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(13px, 2vw, 19px)' }}>parrainages d'élus</span>
      </div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.5s' }}>pour se présenter à l'élection présidentielle</div>
    </div>
  )
}

function Gouvernement({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule()}>🇫🇷 le Président</span>
        {flèche(0.35)}<span className="c-apparait" style={{ ...texteCarte, fontStyle: 'italic', animationDelay: '.4s' }}>nomme</span>{flèche(0.45)}
        <span className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: '.6s' }}>👥 le Gouvernement (les ministres)</span>
      </div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.9s' }}>👤 sur proposition du Premier ministre, qui en dirige l'action</div>
      {étape >= 2 && <div className="c-mot-pilule" style={pilule(VERT)}>🗳️ issu de la majorité aux élections législatives</div>}
    </div>
  )
}

function Parlement({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>🏛️ Assemblée nationale</span>
        <span className="c-apparait" style={{ color: or, fontWeight: 900, fontSize: 'clamp(16px, 2.6vw, 24px)', animationDelay: '.3s' }}>+</span>
        <span className="c-mot-pilule" style={{ ...pilule('#c4b5fd'), animationDelay: '.45s' }}>🏛️ Sénat</span>
        <span className="c-apparait" style={{ color: or, fontWeight: 900, fontSize: 'clamp(16px, 2.6vw, 24px)', animationDelay: '.7s' }}>=</span>
        <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.85s' }}>le Parlement</span>
      </div>
      {étape >= 2 && <div style={rangée}><span className="c-mot-pilule" style={pilule(VERT)}>✍️ vote les lois</span><span className="c-mot-pilule" style={{ ...pilule(VERT), animationDelay: '.3s' }}>🔍 contrôle le Gouvernement</span></div>}
    </div>
  )
}

function DéputésSénateurs({ étape }) {
  if (étape < 1) return null
  const bloc = (c, chiffre, qui, lignes, délai = 0) => (
    <div className="c-mot-pilule" style={{ ...carte(c), width: 'clamp(140px, 42vw, 300px)', animationDelay: `${délai}s` }}>
      <div style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 'clamp(26px, 5vw, 46px)', color: c, lineHeight: 1 }}>{chiffre}</div>
      <div style={titreCarte(c)}>{qui}</div>
      {lignes.map(l => <div key={l} style={texteCarte}>{l}</div>)}
    </div>
  )
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {bloc(BLEU, '577', 'députés · Assemblée nationale', ['suffrage universel direct', 'tous les cinq ans (législatives)'])}
      {étape >= 2 && bloc('#c4b5fd', '348', 'sénateurs · Sénat', ['suffrage universel indirect', 'mandat de six ans'], 0.1)}
    </div>
  )
}

function Récap({ étape }) {
  if (étape < 1) return null
  const l = [['⚖️', 'État de droit', 'la loi respectée par tous, y compris par l\'État'], ['🧩', 'Trois pouvoirs', 'législatif · exécutif · judiciaire'], ['🏛️', 'Institutions', 'Président (5 ans) · Parlement : 577 députés, 348 sénateurs']]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {l.map(([e, t, s], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.5}s`, borderColor: or, borderRadius: 16, width: 'clamp(104px, 29vw, 250px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: '0 0 26px rgba(255,209,102,.4)' }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{e}</div>
          <div style={titreCarte(or)}>{t}</div>
          <div style={{ ...texteCarte, fontSize: 'clamp(11px, 1.6vw, 15px)' }}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels16({ nom, étape }) {
  switch (nom) {
    case 'etat-droit': return <ÉtatDeDroit étape={étape} />
    case 'article-2': return <Article2 étape={étape} />
    case 'constitution': return <Constitution étape={étape} />
    case 'modifier': return <Modifier étape={étape} />
    case 'preambule': return <Préambule étape={étape} />
    case 'principes': return <Principes étape={étape} />
    case 'trois-pouvoirs': return <TroisPouvoirs étape={étape} />
    case 'partis': return <Partis étape={étape} />
    case 'administration': return <Administration étape={étape} />
    case 'president': return <Président étape={étape} />
    case 'parrainages': return <Parrainages étape={étape} />
    case 'gouvernement': return <Gouvernement étape={étape} />
    case 'parlement': return <Parlement étape={étape} />
    case 'deputes-senateurs': return <DéputésSénateurs étape={étape} />
    case 'recap-16': return <Récap étape={étape} />
    default: return null
  }
}
