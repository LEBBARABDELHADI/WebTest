// Visuels du court-métrage de la page 21 : la légende de la carte, le nom de
// chaque région avec sa préfecture, les numéros de l'outre-mer.
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'
import { RÉGIONS_ADMIN } from '../../../lib/livret2026/cinema/regionsAdmin'
import { TOUR_RÉGIONS } from '../../../lib/livret2026/cinema/etiquettesRegions'

const haut = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(5px, 1vh, 10px)' }
const bas = { ...boîte, bottom: 'clamp(8px, 2vh, 18px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(5px, 1vh, 10px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 5 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.7vw, 16px)', padding: '4px 10px', borderColor: bord, ...extra })
const TURQUOISE = '#5eead4', VIOLET = '#c4b5fd'
const ÉTIQUETTE = Object.fromEntries(TOUR_RÉGIONS.map(([c, é, , coul]) => [c, [é, coul]]))
const DROM = [['971', 'Guadeloupe', 'Basse-Terre'], ['972', 'Martinique', 'Fort-de-France'], ['973', 'Guyane', 'Cayenne'], ['974', 'La Réunion', 'Saint-Denis'], ['976', 'Mayotte', 'Mamoudzou']]
const COM = [['975', 'Saint-Pierre et Miquelon'], ['977', 'Saint-Barthélemy'], ['978', 'Saint-Martin'], ['984', 'Terres Australes et Antarctiques Françaises'], ['986', 'Wallis-et-Futuna'], ['987', 'Polynésie française'], ['988', 'Nouvelle-Calédonie']]

function Légende({ étape }) {
  if (étape < 1) return null
  return (
    <div style={haut} data-zone-haute>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule()}><span style={{ display: 'inline-block', width: 11, height: 11, background: '#7f1d1d', border: '2px solid #fff', marginRight: 6 }} />Préfecture de région</span>
        {étape >= 2 && <span className="c-mot-pilule" style={pilule()}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#e2e8f0', marginRight: 6 }} />Préfecture de département</span>}
        {étape >= 2 && <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.3s' }}>🔢 un numéro par département</span>}
      </div>
      {étape >= 3 && <div className="c-impact-6" style={pastille()}>13 régions en métropole</div>}
    </div>
  )
}

function Région({ code, étape }) {
  const r = RÉGIONS_ADMIN.find(x => x.code === code)
  const [étiquette, couleur] = ÉTIQUETTE[code]
  return (
    <div style={haut} data-zone-haute>
      <div className="c-impact-6" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', padding: '4px 14px', borderRadius: 16, background: 'rgba(14,12,32,.88)', border: `2px solid ${couleur}` }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, color: '#fff', fontSize: 'clamp(15px, 2.6vw, 24px)' }}>{étiquette}</span>
        {étape >= 1 && <span className="c-apparait" style={{ fontFamily: 'Georgia, serif', color: or, fontSize: 'clamp(13px, 2vw, 19px)' }}>■ {r.préfecture}</span>}
        {étape >= 2 && <span className="c-apparait" style={{ fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(12px, 1.8vw, 16px)' }}>· {r.départements.length} départements</span>}
      </div>
    </div>
  )
}

function OutreMer({ liste, c, titre, étape }) {
  if (étape < 1) return null
  return (
    <div style={bas}>
      <div className="c-apparait" style={pastille()}>{titre}</div>
      <div style={rangée}>{liste.map(([n, nom, préf], k) => <span key={n} className="c-mot-pilule" style={{ ...pilule(c), animationDelay: `${k * 0.15}s` }}><strong style={{ color: or, marginRight: 5 }}>{n}</strong>{nom}{préf ? ` ■ ${préf}` : ''}</span>)}</div>
    </div>
  )
}

function Récap({ étape }) {
  if (étape < 1) return null
  const l = [['🗺️', '13 régions', 'une préfecture de région ■ chacune', or], ['🔢', 'Les départements', 'un numéro et une préfecture • chacun', TURQUOISE], ['🌍', 'L\'outre-mer', 'de 971 à 988', VIOLET]]
  return (
    <div data-zone-haute style={{ ...haut, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {l.map(([e, t, s, c], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.5}s`, borderColor: c, borderRadius: 16, width: 'clamp(104px, 29vw, 250px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: `0 0 22px ${c}55` }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{e}</div>
          <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10px, 1.4vw, 13px)', letterSpacing: '.04em', textTransform: 'uppercase', color: c }}>{t}</div>
          <div style={{ fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(11px, 1.6vw, 15px)', lineHeight: 1.25 }}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels21({ nom, étape }) {
  if (nom?.startsWith('region-21-')) return <Région code={nom.slice(10)} étape={étape} />
  switch (nom) {
    case 'legende-21': return <Légende étape={étape} />
    case 'outremer-21-drom': return <OutreMer liste={DROM} c={TURQUOISE} titre="Départements et régions d'outre-mer" étape={étape} />
    case 'outremer-21-com': return <OutreMer liste={COM} c={VIOLET} titre="Collectivités d'outre-mer à statut particulier" étape={étape} />
    case 'recap-21': return <Récap étape={étape} />
    default: return null
  }
}
