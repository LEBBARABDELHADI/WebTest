// Visuels du court-métrage de la page 18 : le schéma des principales
// élections, montré flèche par flèche, puis en entier (scène sans personnage).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const GRIS = '#cbd5e1', BLEU = '#93c5fd', ORANGE = '#fb923c', VERT = '#22c55e'
const texte = { fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(11px, 1.6vw, 15px)', lineHeight: 1.25 }
const titre = c => ({ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', letterSpacing: '.04em', textTransform: 'uppercase', color: c })

// Une flèche étiquetée (« élisent », « nomme le Premier ministre », « contrôle »).
function Flèche({ mot, délai = 0, c = or }) {
  return (
    <span className="c-apparait" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', animationDelay: `${délai}s`, color: c, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(11px, 1.6vw, 15px)', lineHeight: 1.1 }}>
      {mot}<span aria-hidden="true" style={{ fontStyle: 'normal', fontWeight: 900, fontSize: 'clamp(18px, 3vw, 28px)' }}>→</span>
    </span>
  )
}
const Boîte = ({ c, t, s, délai = 0 }) => (
  <span className="c-mot-pilule" style={{ display: 'inline-block', borderColor: c, borderRadius: 14, padding: 'clamp(4px, .9vw, 8px) clamp(8px, 1.4vw, 12px)', animationDelay: `${délai}s`, maxWidth: 'min(80vw, 320px)' }}>
    <span style={{ display: 'block', ...titre(c) }}>{t}</span>{s && <span style={{ display: 'block', ...texte }}>{s}</span>}
  </span>
)

function Citoyens({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={{ ...pastille(false), fontSize: 'clamp(12px, 1.8vw, 16px)' }}>🗳️ Les principales élections en France</div>
      <div className="c-impact-6" style={{ borderRadius: 18, padding: 'clamp(6px, 1.2vw, 12px) clamp(12px, 2vw, 20px)', background: 'rgba(14,12,32,.86)', border: `2px solid ${or}`, textAlign: 'center', maxWidth: 'min(92vw, 560px)' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontWeight: 900, color: or, fontSize: 'clamp(20px, 3.6vw, 32px)' }}>👥 Citoyens</div>
        <div style={texte}>Toutes les Françaises et Français âgés de plus de 18 ans{étape >= 2 ? ' et qui n\'ont pas été privés du droit de vote par une décision de justice' : '…'}</div>
      </div>
    </div>
  )
}

function Communes({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}><Boîte c={or} t="👥 Citoyens" /><Flèche mot="élisent" délai={0.3} /><Boîte c={GRIS} t="🏘️ Communes" s="maire, conseillers municipaux" délai={0.5} /></div>
      {étape >= 2 && <div className="c-impact-6" style={pastille()}>⏳ élus pour 6 ans</div>}
    </div>
  )
}

function Territoires({ étape }) {
  if (étape < 1) return null
  const l = [['🏘️ Communes', 'maire, conseillers municipaux', true], ['🗺️ Départements', 'conseillers départementaux', étape >= 1], ['🧭 Régions', 'conseillers régionaux', étape >= 2]]
  return (
    <div style={colonne}>
      <div style={rangée}><Boîte c={or} t="👥 Citoyens" /><Flèche mot="élisent" délai={0.2} /></div>
      <div style={rangée}>{l.filter(x => x[2]).map(([t, s], k) => <Boîte key={t} c={GRIS} t={t} s={s} délai={k * 0.2} />)}</div>
      {étape >= 3 && <div className="c-impact-6" style={pastille()}>⏳ 6 ans à chaque fois</div>}
    </div>
  )
}

function Sénateurs({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>{['🧭 Régions', '🗺️ Départements', '🏘️ Communes'].map((t, k) => <Boîte key={t} c={GRIS} t={t} délai={k * 0.15} />)}</div>
      <div style={rangée}><Flèche mot="élisent les sénateurs" délai={0.5} /><Boîte c={BLEU} t="🏛️ Sénat" délai={0.8} /></div>
    </div>
  )
}

function Assemblée({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}><Boîte c={or} t="👥 Citoyens" /><Flèche mot="élisent" délai={0.3} /><Boîte c={BLEU} t="🏛️ Assemblée nationale" délai={0.5} /></div>
      {étape >= 2 && (
        <div className="c-mot-pilule" style={{ borderColor: ORANGE, borderRadius: 16, padding: 'clamp(5px, 1vw, 10px) 12px' }}>
          <div style={titre(ORANGE)}>Parlement</div>
          <div style={texte}>vote les lois au nom du peuple</div>
          <div style={{ ...rangée, marginTop: 4 }}><span style={{ ...texte, color: BLEU, fontWeight: 700 }}>Assemblée nationale</span><span style={{ color: or, fontWeight: 900 }}>+</span><span style={{ ...texte, color: BLEU, fontWeight: 700 }}>Sénat</span></div>
        </div>
      )}
    </div>
  )
}

function Président({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}><Boîte c={or} t="👥 Citoyens" /><Flèche mot="élisent" délai={0.3} /><Boîte c={ORANGE} t="🇫🇷 Président de la République" s="élu pour 5 ans" délai={0.5} /></div>
    </div>
  )
}

function Gouvernement({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}><Boîte c={ORANGE} t="🇫🇷 Président de la République" /><Flèche mot="nomme le Premier ministre" délai={0.3} /><Boîte c={ORANGE} t="🏢 Gouvernement" délai={0.5} /></div>
      {étape >= 2 && <div className="c-mot-pilule" style={pilule(VERT)}>détermine et conduit la politique de la Nation</div>}
    </div>
  )
}

function Contrôle({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}><Boîte c={ORANGE} t="🏛️ Parlement" /><Flèche mot="contrôle" délai={0.3} /><Boîte c={ORANGE} t="🏢 Gouvernement" délai={0.5} /></div>
    </div>
  )
}

// Le schéma complet, en trois colonnes, sous la case des citoyens.
function Schéma({ étape }) {
  if (étape < 1) return null
  const élit = étape >= 2, autres = étape >= 3
  const case_ = (c, t, s, allumée = false) => (
    <div style={{ borderRadius: 10, padding: 'clamp(3px, .7vw, 7px) clamp(5px, .9vw, 9px)', background: 'rgba(14,12,32,.88)', border: `${allumée ? 2.5 : 1.5}px solid ${c}`, boxShadow: allumée ? `0 0 18px ${c}88` : 'none', transition: 'box-shadow .6s, border-width .6s' }}>
      <div style={titre(c)}>{t}</div>{s && <div style={{ ...texte, fontSize: 'clamp(10px, 1.4vw, 13.5px)' }}>{s}</div>}
    </div>
  )
  const lien = (mot, allumé) => <div style={{ textAlign: 'center', color: allumé ? or : 'rgba(255,255,255,.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(10px, 1.4vw, 13px)', lineHeight: 1.1, transition: 'color .6s' }}>{mot}<br /><span style={{ fontStyle: 'normal', fontWeight: 900 }}>↓</span></div>
  return (
    <div style={{ ...boîte, top: HAUT, width: 'min(96%, 900px)' }}>
    <div className="c-apparait" style={{ display: 'grid', gap: 'clamp(4px, .8vh, 8px)' }}>
      {case_(or, '👥 Citoyens', 'Tous les Françaises et Français âgés de plus de 18 ans et qui n\'ont pas été privés du droit de vote par une décision de justice', élit)}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'clamp(4px, 1vw, 10px)', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          {lien('élisent', élit)}
          {case_(GRIS, 'Régions', 'Conseillers régionaux, élus pour 6 ans', autres)}
          {case_(GRIS, 'Départements', 'Conseillers départementaux, élus pour 6 ans', autres)}
          {case_(GRIS, 'Communes', 'Maire, conseillers municipaux élus pour 6 ans', autres)}
          <div style={{ textAlign: 'center', color: autres ? or : 'rgba(255,255,255,.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(10px, 1.4vw, 13px)' }}>élisent les sénateurs →</div>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          {lien('élisent', élit)}
          <div style={{ borderRadius: 12, padding: 'clamp(3px, .7vw, 7px)', border: `2px solid ${ORANGE}`, background: 'rgba(14,12,32,.88)' }}>
            <div style={titre(ORANGE)}>Parlement</div>
            <div style={{ ...texte, fontSize: 'clamp(10px, 1.4vw, 13.5px)', marginBottom: 4 }}>Vote les lois au nom du peuple</div>
            <div style={{ display: 'grid', gap: 4 }}>{case_(BLEU, 'Assemblée nationale', '', élit)}{case_(BLEU, 'Sénat', '', autres)}</div>
          </div>
          <div style={{ textAlign: 'center', color: autres ? or : 'rgba(255,255,255,.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(10px, 1.4vw, 13px)' }}>contrôle →</div>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          {lien('élisent', élit)}
          {case_(ORANGE, 'Président de la République', 'élu pour 5 ans', élit)}
          {lien('nomme le Premier ministre', autres)}
          {case_(ORANGE, 'Gouvernement', 'Détermine et conduit la politique de la Nation', autres)}
        </div>
      </div>
    </div>
    </div>
  )
}

function Récap({ étape }) {
  if (étape < 1) return null
  const l = [['🏘️', 'Communes · départements · régions', 'élus pour 6 ans · élisent les sénateurs', GRIS], ['🏛️', 'Parlement', 'vote les lois · contrôle le Gouvernement', BLEU], ['🇫🇷', 'Président', 'élu pour 5 ans · nomme le Premier ministre', ORANGE]]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {l.map(([e, t, s, c], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.5}s`, borderColor: c, borderRadius: 16, width: 'clamp(104px, 29vw, 250px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: `0 0 22px ${c}55` }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{e}</div>
          <div style={titre(c)}>{t}</div>
          <div style={texte}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels18({ nom, étape }) {
  switch (nom) {
    case 'citoyens-18': return <Citoyens étape={étape} />
    case 'communes-18': return <Communes étape={étape} />
    case 'territoires-18': return <Territoires étape={étape} />
    case 'senateurs-18': return <Sénateurs étape={étape} />
    case 'assemblee-18': return <Assemblée étape={étape} />
    case 'president-18': return <Président étape={étape} />
    case 'gouvernement-18': return <Gouvernement étape={étape} />
    case 'controle-18': return <Contrôle étape={étape} />
    case 'schema-18': return <Schéma étape={étape} />
    case 'recap-18': return <Récap étape={étape} />
    default: return null
  }
}
