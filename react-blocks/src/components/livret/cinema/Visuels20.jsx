// Visuels du court-métrage de la page 20. Sur les scènes de carte, ils sont
// placés en bas de l'écran (la carte occupe le haut) ; compacts sur téléphone.
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const bas = { ...boîte, bottom: 'clamp(8px, 2vh, 18px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(5px, 1vh, 10px)' }
const haut = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 5 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.7vw, 16px)', padding: '4px 10px', borderColor: bord, ...extra })
const TURQUOISE = '#5eead4', VIOLET = '#c4b5fd'
const DROM = ['Guadeloupe', 'Martinique', 'Mayotte', 'Guyane', 'La Réunion']
const COM = ['Nouvelle-Calédonie', 'Polynésie française', 'Saint-Martin', 'Saint-Barthélemy', 'Saint-Pierre-et-Miquelon', 'Terres australes et antarctiques françaises', 'Wallis-et-Futuna']
const grand = (chiffre, c, légende) => (
  <div className="c-impact-6" style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '2px 16px', borderRadius: 18, background: 'rgba(14,12,32,.86)', border: `2px solid ${c}` }}>
    <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 'clamp(28px, 5.6vw, 52px)', color: c, lineHeight: 1.1 }}>{chiffre}</span>
    <span style={{ fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(13px, 2vw, 19px)' }}>{légende}</span>
  </div>
)

function Douze({ étape }) {
  if (étape < 1) return null
  return (
    <div style={bas}>
      {grand('12', or, 'territoires d\'outre-mer')}
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.5s' }}>situés en dehors de la France métropolitaine</div>
      <div className="c-apparait" style={{ ...rangée, animationDelay: '.9s' }}>
        <span style={{ ...pilule(TURQUOISE), border: `2px solid ${TURQUOISE}`, borderRadius: 14, background: 'rgba(14,12,32,.86)', color: crème }}>1 à 5 : départements et régions</span>
        <span style={{ ...pilule(VIOLET), border: `2px solid ${VIOLET}`, borderRadius: 14, background: 'rgba(14,12,32,.86)', color: crème }}>6 à 12 : collectivités à statut particulier</span>
      </div>
    </div>
  )
}

function Liste({ étape, chiffre, c, titre, noms, numéroter = false }) {
  if (étape < 1) return null
  return (
    <div style={bas}>
      {grand(chiffre, c, titre)}
      {étape >= 2 && <div style={rangée}>{noms.map((n, k) => <span key={n} className="c-mot-pilule" style={{ ...pilule(c), animationDelay: `${k * 0.18}s` }}>{numéroter && <strong style={{ color: or, marginRight: 5 }}>{k + 1}</strong>}{n}</span>)}</div>}
    </div>
  )
}

function Antilles({ étape }) {
  if (étape < 1) return null
  return (
    <div style={bas}>
      <div className="c-apparait" style={pastille()}>🏝️ les Antilles françaises : des îles</div>
      <div style={rangée}>{['Martinique', 'Guadeloupe', 'Saint-Martin', 'Saint-Barthélemy'].map((n, k) => <span key={n} className="c-mot-pilule" style={{ ...pilule(TURQUOISE), animationDelay: `${k * 0.2}s` }}>{n}</span>)}</div>
    </div>
  )
}

function Récap({ étape }) {
  if (étape < 1) return null
  const l = [['🌍', '12 territoires', 'en dehors de la France métropolitaine', or], ['🏛️', '5 départements et régions', DROM.join(' · '), TURQUOISE], ['🌴', '7 collectivités à statut particulier', 'dont Saint-Martin et Saint-Barthélemy, aux Antilles', VIOLET]]
  return (
    <div style={{ ...haut, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
      {l.map(([e, t, s, c], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.5}s`, borderColor: c, borderRadius: 16, width: 'clamp(104px, 29vw, 250px)', padding: 'clamp(5px, 1vw, 10px) 6px', boxShadow: `0 0 22px ${c}55` }}>
          <div style={{ fontSize: 'clamp(16px, 2.6vw, 26px)' }}>{e}</div>
          <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10px, 1.4vw, 13px)', letterSpacing: '.04em', textTransform: 'uppercase', color: c }}>{t}</div>
          <div style={{ fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(10.5px, 1.5vw, 14px)', lineHeight: 1.25 }}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels20({ nom, étape }) {
  switch (nom) {
    case 'douze-territoires': return <Douze étape={étape} />
    case 'cinq-drom': return <Liste étape={étape} chiffre="5" c={TURQUOISE} titre="à la fois départements et régions" noms={DROM} />
    case 'sept-com': return <Liste étape={étape} chiffre="7" c={VIOLET} titre="collectivités d'outre-mer à statut particulier" noms={COM} numéroter />
    case 'antilles-fr': return <Antilles étape={étape} />
    case 'recap-20': return <Récap étape={étape} />
    default: return null
  }
}
