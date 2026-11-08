// Visuels pédagogiques du court-métrage de la page 7 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const pilule = (extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', ...extra })
const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }

const HAINES = [['♀♂', 'le sexisme'], ['🌍', 'le racisme'], ['✡️', 'l\'antisémitisme'], ['🕊️', 'la discrimination sur critère religieux'], ['🏳️‍🌈', 'la haine et la discrimination anti-LGBT+']]

function Haines({ étape }) {
  if (étape < 1) return null
  const [icône, nom] = HAINES[Math.min(étape, 5) - 1]
  return (
    <div style={colonne}>
      <div style={pastille(false)}>🛡️ L'État lutte activement contre…</div>
      <div style={{ display: 'flex', gap: 'clamp(6px, 1.4vw, 12px)' }} aria-hidden="true">
        {HAINES.map(([e], k) => {
          const actif = k === étape - 1, vu = k < étape
          return <span key={k} style={{ width: actif ? 46 : 36, height: actif ? 46 : 36, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: actif ? 22 : 16, background: vu ? 'rgba(14,12,32,.88)' : 'rgba(14,12,32,.4)', border: `2px ${vu ? 'solid' : 'dashed'} ${actif ? or : vu ? 'rgba(255,209,102,.5)' : 'rgba(255,255,255,.3)'}`, boxShadow: actif ? '0 0 22px rgba(255,209,102,.6)' : 'none', opacity: vu ? 1 : 0.6, transition: 'all .5s', color: crème }}>{vu ? e : k + 1}</span>
        })}
      </div>
      <div key={étape} className="c-mot-pilule" style={{ ...pilule({ fontSize: 'clamp(15px, 2.6vw, 24px)', padding: '6px 16px' }), borderColor: or }}>{icône} {nom}</div>
    </div>
  )
}

function ProPerso({ étape }) {
  if (étape < 1) return null
  const carte = (bon, titre, mots, k) => (
    <div className="c-mot-pilule" style={{ animationDelay: `${k * 0.35}s`, borderRadius: 16, padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 1.8vw, 18px)', borderColor: bon ? '#22c55e' : '#ef4444', minWidth: 'min(42vw, 220px)' }}>
      <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(11px, 1.6vw, 15px)', letterSpacing: '.06em', color: bon ? '#86efac' : '#fca5a5' }}>{bon ? '✅' : '❌'} {titre}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(13px, 2vw, 19px)', textDecoration: bon ? 'none' : 'line-through', opacity: bon ? 1 : 0.75 }}>{mots}</div>
    </div>
  )
  return (
    <div style={colonne}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {carte(true, 'RAISONS PROFESSIONNELLES', 'les compétences', 0)}
        {carte(false, 'RAISONS PERSONNELLES', 'le fils d\'un ami', 1)}
      </div>
      {étape >= 2 && <div className="c-apparait" style={pastille()}>💼 embauche · promotion…</div>}
    </div>
  )
}

function Mains({ étape }) {
  return (
    <div style={colonne}>
      {étape >= 2 && <div className="c-apparait" style={pastille()}>🤝 la fraternité entre tous</div>}
      {étape >= 3 && <div className="c-apparait" style={pastille()}>🏛️ civique · non basée sur l'origine ou la religion</div>}
    </div>
  )
}

function Formes({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille(false)}>🤝 fraternité → solidarité</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {[['🏛️', 'Collective'], ['👧 👩 👵', 'Intergénérationnelle']].map(([e, t], k) => (
          <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.5}s`, borderColor: or, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8, ...pilule({ fontSize: 'clamp(14px, 2.2vw, 21px)', padding: '8px 16px' }) }}><span style={{ fontSize: 'clamp(18px, 3vw, 28px)' }}>{e}</span>{t}</div>
        ))}
      </div>
    </div>
  )
}

function Collective({ étape }) {
  if (étape < 1) return null
  const l = [['🏥', 'protection', 'la Sécurité sociale'], ['🧾', 'impôts', 'services publics pour tous'], ['🛡️', 'défense', 'de la Nation']]
  return (
    <div style={colonne}>
      <div style={pastille(false)}>🏛️ Solidarité collective</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(5px, 1.2vw, 12px)' }}>
        {l.slice(0, étape).map(([e, t, s], k) => (
          <div key={t} className="c-mot-pilule" style={{ borderRadius: 14, width: 'clamp(96px, 20vw, 190px)', padding: 'clamp(5px, 1vw, 10px) 6px', borderColor: k === étape - 1 ? or : 'rgba(255,255,255,.25)', boxShadow: k === étape - 1 ? '0 0 22px rgba(255,209,102,.45)' : 'none' }}>
            <div style={{ fontSize: 'clamp(18px, 3.2vw, 30px)' }}>{e}</div>
            <div style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{t}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.7vw, 16px)', lineHeight: 1.25 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Générations({ étape }) {
  return (
    <div style={{ ...boîte, top: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {étape >= 1 && (
        <div className="c-apparait" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 10px)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['👩🏾‍💼', 'le salarié cotise'], ['➜'], ['👵🏾', 'retraites versées']].map(([e, t], k) => t
            ? <span key={k} className="c-mot-pilule" style={{ animationDelay: `${k * 0.4}s`, ...pilule() }}>{e} {t}</span>
            : <span key={k} style={{ color: or, fontSize: 22, textShadow: '0 2px 6px #000' }}>{e}</span>)}
        </div>
      )}
      {étape >= 2 && <div className="c-apparait" style={pastille()}>👧 👩 👵 soutien entre différentes générations</div>}
    </div>
  )
}

function Inégalités({ étape }) {
  const avant = [18, 32, 50, 74, 100], après = [44, 52, 60, 70, 82]
  const h = étape >= 2 ? après : avant
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 2vh, 18px)', padding: '0 6%' }}>
      {étape >= 1 && <div className="c-apparait" style={pastille(false)}>🏥 protéger · 🧾 financer · 👵 se soutenir</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(8px, 2vw, 18px)', height: 'clamp(110px, 26vh, 220px)' }} aria-hidden="true">
        {h.map((v, k) => <div key={k} style={{ width: 'clamp(26px, 6vw, 56px)', height: `${v}%`, borderRadius: '10px 10px 4px 4px', background: `linear-gradient(${['#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#facc15'][k]}, rgba(255,255,255,.15))`, boxShadow: '0 10px 30px rgba(0,0,0,.4)', transition: 'height 2.2s cubic-bezier(.3,1.2,.4,1)' }} />)}
      </div>
      {étape >= 2 && <div className="c-impact-6" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(22px, 4.6vw, 46px)', textAlign: 'center', color: '#fff', textShadow: '0 4px 0 #1d4ed8, 0 10px 30px rgba(0,0,0,.7)' }}>moins d'inégalités</div>}
    </div>
  )
}

function Collecte({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>📦 participation citoyenne</div>
      <div className="c-apparait" style={{ ...pastille(false), animationDelay: '.5s' }}>solidarité · fraternité</div>
    </div>
  )
}

function TroisMots({ étape }) {
  if (étape < 1) return null
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {['LIBERTÉ', 'ÉGALITÉ', 'FRATERNITÉ'].map((m, k) => (
        <div key={m} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.7}s`, padding: 'clamp(7px, 1.3vw, 13px) clamp(12px, 2.4vw, 26px)', borderColor: or, boxShadow: k === 2 ? '0 0 44px rgba(255,209,102,.85), inset 0 0 20px rgba(255,209,102,.3)' : '0 0 24px rgba(255,209,102,.4)', transform: k === 2 ? 'scale(1.08)' : 'none' }}>
          <strong style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(16px, 3.4vw, 34px)', letterSpacing: '.1em' }}>✓ {m}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Visuels7({ nom, étape }) {
  switch (nom) {
    case 'haines': return <Haines étape={étape} />
    case 'pro-perso': return <ProPerso étape={étape} />
    case 'mains': return <Mains étape={étape} />
    case 'formes': return <Formes étape={étape} />
    case 'collective': return <Collective étape={étape} />
    case 'generations': return <Générations étape={étape} />
    case 'inegalites': return <Inégalités étape={étape} />
    case 'collecte': return <Collecte étape={étape} />
    case 'trois-mots': return <TroisMots étape={étape} />
    default: return null
  }
}
