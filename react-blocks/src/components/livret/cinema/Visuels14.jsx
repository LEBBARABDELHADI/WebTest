// Visuels pédagogiques du court-métrage de la page 14 (responsives, compacts
// pour laisser voir les personnages sur téléphone).
import { or, crème, HAUT, boîte, pastille } from '../../../lib/livret2026/cinema/styleVisuels'

const colonne = { ...boîte, top: HAUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)' }
const rangée = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 }
const pilule = (bord = or, extra = {}) => ({ fontFamily: 'Georgia, serif', fontSize: 'clamp(12px, 1.8vw, 17px)', padding: '5px 12px', borderColor: bord, ...extra })
const BLEU = '#93c5fd', VERT = '#22c55e'
const flèche = (délai = 0) => <span className="c-apparait" aria-hidden="true" style={{ color: or, fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 900, animationDelay: `${délai}s` }}>→</span>
const parchemin = { background: '#f8f5ec', color: '#111', borderRadius: 6, padding: '8px 12px', boxShadow: '0 14px 30px rgba(0,0,0,.5)', fontFamily: 'Georgia, serif', width: 'min(84vw, 420px)' }
const titreParchemin = { fontWeight: 900, fontSize: 'clamp(11.5px, 1.7vw, 15px)', borderBottom: '2px solid #111', marginBottom: 4, letterSpacing: '.02em' }
const titreCarte = c => ({ fontFamily: 'system-ui', fontWeight: 900, fontSize: 'clamp(10.5px, 1.5vw, 14px)', letterSpacing: '.05em', textTransform: 'uppercase', color: c })

function Souveraineté({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🇫🇷 La France est une démocratie</div>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>⚖️ la souveraineté nationale <em>(le pouvoir)</em></span>
        {flèche(0.5)}
        <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.8s', boxShadow: '0 0 24px rgba(255,209,102,.4)' }}>👥 appartient au peuple français</span>
      </div>
    </div>
  )
}

function Article3({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-journal" style={parchemin}>
        <div style={titreParchemin}>📜 Constitution de la Ve République (1958) · Article 3</div>
        <div style={{ fontSize: 'clamp(12px, 1.8vw, 16px)', lineHeight: 1.35 }}>« La souveraineté nationale appartient au peuple qui l'exerce <strong>par ses représentants</strong> et <strong>par la voie du référendum</strong>. »</div>
      </div>
      {étape >= 2 && (
        <div style={rangée}>
          <span className="c-mot-pilule" style={pilule()}>🗳️ par ses représentants</span>
          <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.35s' }}>✋ par la voie du référendum</span>
        </div>
      )}
    </div>
  )
}

const ÉLUS = ['Président de la République', 'parlementaires', 'maires', 'représentants des régions', 'des départements', 'des communes']
function Élus({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-apparait" style={pastille()}>🗳️ dirigeants élus · gouvernent au nom du peuple</div>
      {étape >= 2 && <div style={rangée}>{ÉLUS.map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: `${k * 0.22}s` }}>{t}</span>)}</div>}
      {étape >= 3 && <div className="c-impact-6" style={{ ...pastille(), fontSize: 'clamp(13px, 2.1vw, 20px)' }}>suffrage universel direct ou indirect</div>}
    </div>
  )
}

function Flux({ étapes, couleur, délai = 0 }) {
  return (
    <div style={{ ...rangée, gap: 4 }}>
      {étapes.map((e, k) => (
        <span key={e} style={{ display: 'contents' }}>
          {k > 0 && flèche(délai + k * 0.35 - 0.15)}
          <span className="c-mot-pilule" style={{ ...pilule(couleur, { padding: '4px 9px' }), animationDelay: `${délai + k * 0.35}s` }}>{e}</span>
        </span>
      ))}
    </div>
  )
}

function DirectIndirect({ étape }) {
  if (étape < 1) return null
  const carte = (bord, extra = {}) => ({ borderRadius: 14, padding: 'clamp(5px, 1vw, 10px) clamp(8px, 1.4vw, 12px)', border: `2px solid ${bord}`, background: 'rgba(14,12,32,.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, ...extra })
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div className="c-apparait" style={carte(or)}>
        <div style={titreCarte(or)}>Direct</div>
        <Flux étapes={['👥 citoyens', '🏛️ représentants']} couleur={or} délai={0.3} />
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.6vw, 14px)', color: crème }}>votent directement</div>
      </div>
      {étape >= 2 && (
        <div className="c-apparait" style={carte(BLEU)}>
          <div style={titreCarte(BLEU)}>Indirect</div>
          <Flux étapes={['👥 citoyens', '🧑‍💼 élus', '🏛️ représentants']} couleur={BLEU} délai={0.3} />
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.6vw, 14px)', color: crème }}>les élus élisent à leur tour</div>
        </div>
      )}
    </div>
  )
}

function Majorité({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div className="c-impact-6" style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '2px 16px', borderRadius: 18, background: 'rgba(14,12,32,.84)', border: `2px solid ${or}` }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 'clamp(30px, 6vw, 56px)', color: or, lineHeight: 1.1 }}>18 ans</span>
        <span style={{ fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(13px, 2vw, 19px)' }}>au moins · majorité civile</span>
      </div>
      {étape >= 2 && <div style={rangée}>{['👩 femmes', '👨 hommes', '⚖️ droits civils et politiques'].map((t, k) => <span key={t} className="c-mot-pilule" style={{ ...pilule(BLEU), animationDelay: `${k * 0.25}s` }}>{t}</span>)}</div>}
      {étape >= 3 && (
        <div style={rangée}>
          <span className="c-mot-pilule" style={pilule(VERT)}>✅ voter</span>
          <span className="c-mot-pilule" style={{ ...pilule(VERT), animationDelay: '.3s' }}>✅ se présenter aux élections</span>
          <span className="c-apparait" style={{ ...pastille(false), fontSize: 'clamp(11.5px, 1.6vw, 15px)', animationDelay: '.7s' }}>dans les conditions fixées par la loi</span>
        </div>
      )}
    </div>
  )
}

function DDHC({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>🤝 République sociale</span>
        <span className="c-apparait" aria-hidden="true" style={{ color: or, fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 900, animationDelay: '.3s' }}>←</span>
        <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.5s' }}>⚖️ principe d'égalité</span>
      </div>
      {étape >= 2 && (
        <div className="c-journal" style={parchemin}>
          <div style={titreParchemin}>📜 Déclaration des droits de l'homme et du citoyen · 1789 · article 1er</div>
          <div style={{ fontSize: 'clamp(13px, 2vw, 18px)', lineHeight: 1.35, fontStyle: 'italic' }}>« Les hommes naissent et demeurent libres et égaux en droits »</div>
        </div>
      )}
    </div>
  )
}

const DOMAINES = [
  { id: 'education', emoji: '🎓', nom: 'L\'éducation', exemple: 'école gratuite' },
  { id: 'logement', emoji: '🏠', nom: 'Le logement', exemple: 'politique de logement social' },
  { id: 'emploi', emoji: '💼', nom: 'L\'emploi', exemple: 'revenu de solidarité active et aide au retour à l\'emploi' },
  { id: 'sante', emoji: '🏥', nom: 'La santé', exemple: 'Sécurité sociale' },
]
function ÉgalitéRéelle({ étape }) {
  if (étape < 1) return null
  return (
    <div style={colonne}>
      <div style={rangée}>
        <span className="c-mot-pilule" style={pilule(BLEU)}>📜 égalité de droits</span>
        {flèche(0.35)}
        <span className="c-mot-pilule" style={{ ...pilule(), animationDelay: '.6s' }}>⚖️ égalité réelle</span>
      </div>
      <div className="c-apparait" style={{ ...pastille(), animationDelay: '.9s' }}>🎯 l'État favorise l'égalité des chances</div>
      {étape >= 2 && <div className="c-apparait" style={pastille()}>🤲 amélioration de la condition des plus démunis ou fragiles</div>}
      {étape >= 3 && <div style={rangée}>{DOMAINES.map((d, k) => <span key={d.id} className="c-mot-pilule" style={{ ...pilule('rgba(255,255,255,.45)'), animationDelay: `${k * 0.2}s` }}>{d.emoji} {d.nom}</span>)}<span className="c-apparait" style={{ color: crème, fontStyle: 'italic', fontFamily: 'Georgia, serif', animationDelay: '.9s' }}>… notamment</span></div>}
    </div>
  )
}

function Domaine({ id, étape }) {
  if (étape < 1) return null
  const k = DOMAINES.findIndex(d => d.id === id), d = DOMAINES[k], tous = id === 'sante' && étape >= 2
  return (
    <div style={colonne}>
      {!tous && (
        <div className="c-impact-6" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 18px)', borderRadius: 18, background: 'rgba(14,12,32,.86)', border: `2px solid ${or}`, boxShadow: '0 0 30px rgba(255,209,102,.35)', maxWidth: 'min(92vw, 560px)' }}>
          <span aria-hidden="true" style={{ fontSize: 'clamp(30px, 5.5vw, 52px)' }}>{d.emoji}</span>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', ...titreCarte(or) }}>Domaine {k + 1} sur 4</span>
            <span style={{ display: 'block', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#fff', fontSize: 'clamp(16px, 2.6vw, 24px)' }}>{d.nom}</span>
            <span style={{ display: 'block', fontFamily: 'Georgia, serif', color: crème, fontSize: 'clamp(12.5px, 1.9vw, 17px)' }}>{d.exemple}</span>
          </span>
        </div>
      )}
      <div style={{ ...rangée, gap: 'clamp(4px, 1vw, 8px)' }} role="list" aria-label="Les quatre domaines">
        {DOMAINES.map((x, j) => {
          const fait = j < k || tous, actuel = j === k && !tous
          return (
            <span key={x.id} role="listitem" aria-label={`${x.nom}${fait ? ' (vu)' : actuel ? ' (en cours)' : ''}`} className={tous ? 'c-mot-pilule' : undefined} style={{ ...(tous ? pilule(or, { animationDelay: `${j * 0.25}s` }) : {}), display: 'inline-flex', alignItems: 'center', gap: 4, padding: tous ? '5px 12px' : '3px 9px', borderRadius: 20, background: 'rgba(14,12,32,.8)', border: `2px solid ${actuel ? or : fait ? VERT : 'rgba(255,255,255,.18)'}`, color: fait || actuel ? '#fff' : 'rgba(255,255,255,.45)', fontFamily: 'Georgia, serif', fontSize: tous ? 'clamp(12px, 1.8vw, 16px)' : 'clamp(11px, 1.6vw, 14px)' }}>
              {x.emoji} {tous ? `${x.nom} · ${x.exemple}` : actuel ? x.nom : fait ? '✓' : '…'}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function Récap({ étape }) {
  if (étape < 1) return null
  const l = [
    ['🗳️', 'Démocratique', 'le pouvoir appartient au peuple · représentants et référendum · 18 ans'],
    ['🤝', 'Sociale', 'égalité des chances · école, logement, emploi, santé'],
  ]
  return (
    <div style={{ ...colonne, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {l.map(([e, t, s], k) => (
        <div key={t} className="c-mot-pilule" style={{ animationDelay: `${0.3 + k * 0.6}s`, borderColor: or, borderRadius: 16, width: 'clamp(140px, 36vw, 300px)', padding: 'clamp(5px, 1vw, 10px) 8px', boxShadow: '0 0 26px rgba(255,209,102,.4)' }}>
          <div style={{ fontSize: 'clamp(18px, 3vw, 28px)' }}>{e}</div>
          <div style={titreCarte(or)}>Une République {t.toLowerCase()}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(11.5px, 1.7vw, 16px)', lineHeight: 1.25, color: crème }}>{s}</div>
        </div>
      ))}
    </div>
  )
}

export default function Visuels14({ nom, étape }) {
  switch (nom) {
    case 'souverainete': return <Souveraineté étape={étape} />
    case 'article-3': return <Article3 étape={étape} />
    case 'elus': return <Élus étape={étape} />
    case 'direct-indirect': return <DirectIndirect étape={étape} />
    case 'majorite': return <Majorité étape={étape} />
    case 'ddhc-1': return <DDHC étape={étape} />
    case 'egalite-reelle': return <ÉgalitéRéelle étape={étape} />
    case 'domaine-education': return <Domaine id="education" étape={étape} />
    case 'domaine-logement': return <Domaine id="logement" étape={étape} />
    case 'domaine-emploi': return <Domaine id="emploi" étape={étape} />
    case 'domaine-sante': return <Domaine id="sante" étape={étape} />
    case 'recap-14': return <Récap étape={étape} />
    default: return null
  }
}
