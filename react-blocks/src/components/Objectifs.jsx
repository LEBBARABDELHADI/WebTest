import { useState, useEffect } from 'react'
import { grotesk } from '../lib/theme'
import { FenêtreMémo } from './PaquetsPrets'
import { compteÀRebours, PRÉSETS, créerObjectif, planDeRévision, préparation, estimation, maîtrise, joursAvant, aujourdhui, MAÎTRISE } from '../lib/certifications'
import { lireTâches, créerTâches } from '../lib/donneesFoyer'

const titre = { fontFamily: grotesk, fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 6px' }
const pourcent = x => `${Math.round(x * 100)} %`
const dateFr = s => new Date(`${s}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
export { compteÀRebours }

function Barre({ T, valeur, seuil, hauteur = 10 }) {
  const ok = seuil !== undefined && valeur >= seuil
  return (
    <div style={{ position: 'relative', height: hauteur, borderRadius: hauteur / 2, background: T.surface2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, valeur * 100)}%`, background: ok ? '#2e9e6b' : valeur >= (seuil ?? 1) * 0.6 ? '#e0a100' : T.accent }} />
      {seuil !== undefined && <div title={`Objectif ${pourcent(seuil)}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${seuil * 100}%`, width: 2, background: T.text, opacity: 0.5 }} />}
    </div>
  )
}

// Courbe des examens blancs (pourcentage) avec la ligne de réussite.
function Courbe({ T, examens, seuil }) {
  if (examens.length < 1) return <p style={{ fontSize: '12.5px', color: T.textMuted, margin: 0 }}>Aucun examen blanc pour cet objectif.</p>
  const L = 300, H = 110, m = 8
  const pts = examens.map((e, i) => [m + (examens.length === 1 ? (L - 2 * m) / 2 : (i * (L - 2 * m)) / (examens.length - 1)), H - m - (e.bonnes / e.total) * (H - 2 * m)])
  const yS = H - m - seuil * (H - 2 * m)
  return (
    <svg viewBox={`0 0 ${L} ${H}`} style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block' }} role="img" aria-label="Évolution des examens blancs">
      <line x1={m} x2={L - m} y1={yS} y2={yS} stroke="#2e9e6b" strokeDasharray="4 4" />
      <text x={L - m} y={yS - 4} textAnchor="end" fontSize="10" fill="#2e9e6b">{pourcent(seuil)}</text>
      <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={T.accent} strokeWidth="2.5" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={T.accent}><title>{`${new Date(examens[i].date).toLocaleDateString('fr-FR')} : ${examens[i].bonnes}/${examens[i].total}`}</title></circle>)}
    </svg>
  )
}

// Objectifs d'examen : création (certification ou examen civique + date),
// domaines reliés aux paquets, plan dans le Programme, progrès.
export default function Objectifs({ T, data, espace, onAjouter, onModifier, onSupprimer, onExamen, onFermer }) {
  const [onglet, setOnglet] = useState(data.objectifs?.length ? 'progrès' : 'objectifs')
  const [préset, setPréset] = useState('civique')
  const [date, setDate] = useState('')
  const [nomLibre, setNomLibre] = useState('')
  const [domainesDe, setDomainesDe] = useState(null)
  const [planDe, setPlanDe] = useState(null)
  const objectifs = data.objectifs || []
  const puce = actif => ({ minHeight: 36, padding: '0 12px', borderRadius: '18px', fontFamily: grotesk, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, border: `1px solid ${actif ? T.accent : T.border}` })
  const bouton = { minHeight: 34, padding: '0 12px', borderRadius: '17px', fontFamily: grotesk, fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', background: T.surface2, color: T.text, border: `1px solid ${T.border}` }

  const créer = () => {
    const p = PRÉSETS.find(x => x.id === préset)
    const o = créerObjectif(p, date, data.paquets)
    if (p.id === 'libre') o.nom = nomLibre.trim() || 'Mon examen'
    onAjouter(o); setDate(''); setNomLibre('')
    if (p.id === 'libre' || o.domaines.some(d => !d.paquetIds.length)) setDomainesDe(o.id)
  }

  return (
    <FenêtreMémo T={T} titre="🎯 Objectifs d'examen" onFermer={onFermer} large={620}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button onClick={() => setOnglet('progrès')} style={puce(onglet === 'progrès')} aria-pressed={onglet === 'progrès'}>📊 Progrès</button>
        <button onClick={() => setOnglet('objectifs')} style={puce(onglet === 'objectifs')} aria-pressed={onglet === 'objectifs'}>🎯 Objectifs</button>
      </div>

      {onglet === 'objectifs' && (
        <>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <p style={{ ...titre, color: T.accent }}>Nouvel objectif</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {PRÉSETS.map(p => <button key={p.id} onClick={() => setPréset(p.id)} style={puce(préset === p.id)} aria-pressed={préset === p.id}>{p.nom}</button>)}
            </div>
            {PRÉSETS.find(p => p.id === préset).note && <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 10px', lineHeight: 1.45 }}>ℹ️ {PRÉSETS.find(p => p.id === préset).note} Les pourcentages des domaines viennent du guide officiel : vérifie la dernière version.</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {préset === 'libre' && <input value={nomLibre} onChange={e => setNomLibre(e.target.value)} placeholder="Nom de l'examen" aria-label="Nom de l'examen" style={{ flex: '1 1 160px', minHeight: 38, padding: '0 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: T.text }}>Date de l'examen
                <input type="date" value={date} min={aujourdhui()} onChange={e => setDate(e.target.value)} aria-label="Date de l'examen" style={{ minHeight: 38, padding: '0 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
              </label>
              <button onClick={créer} disabled={!date} style={{ ...puce(true), opacity: date ? 1 : 0.5, cursor: date ? 'pointer' : 'default' }}>Créer</button>
            </div>
          </div>

          {objectifs.length === 0 && <p style={{ fontSize: '13px', color: T.textMuted }}>Aucun objectif pour l'instant.</p>}
          {objectifs.map(o => (
            <div key={o.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontFamily: grotesk, fontSize: '15px', color: T.text, flex: 1 }}>{o.nom}</strong>
                <span style={{ fontFamily: grotesk, fontWeight: 800, color: T.accent }}>{compteÀRebours(o.date)}</span>
              </div>
              <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '2px 0 10px' }}>{dateFr(o.date)} · {o.questions} questions · {o.minutes} min · réussite {pourcent(o.seuil)}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button onClick={() => onExamen(o)} style={bouton}>📝 Examen blanc</button>
                <button onClick={() => setPlanDe(planDe === o.id ? null : o.id)} style={bouton} aria-expanded={planDe === o.id}>🗓️ Plan de révision</button>
                <button onClick={() => setDomainesDe(domainesDe === o.id ? null : o.id)} style={bouton} aria-expanded={domainesDe === o.id}>🧩 Domaines et paquets</button>
                <button onClick={() => { if (window.confirm(`Supprimer l'objectif « ${o.nom} » ?`)) onSupprimer(o.id) }} style={{ ...bouton, color: T.danger }}>Supprimer</button>
              </div>
              {domainesDe === o.id && <ÉditeurDomaines T={T} o={o} paquets={data.paquets} onModifier={ch => onModifier(o.id, ch)} />}
              {planDe === o.id && <Plan T={T} o={o} espace={espace} onFait={() => onModifier(o.id, { planCréé: aujourdhui() })} />}
            </div>
          ))}
        </>
      )}

      {onglet === 'progrès' && (
        <>
          {objectifs.length === 0 && (
            <p style={{ fontSize: '13px', color: T.textMuted, lineHeight: 1.5 }}>Crée un objectif (certification ou examen civique) pour voir ta préparation par domaine et une estimation de la date où tu seras prêt(e). <button onClick={() => setOnglet('objectifs')} style={{ ...bouton, marginLeft: 6 }}>Créer un objectif</button></p>
          )}
          {objectifs.map(o => {
            const prép = préparation(o, data.cartes)
            const exams = (data.examens || []).filter(e => e.objectifId === o.id)
            const est = estimation(o, data.examens)
            return (
              <section key={o.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <strong style={{ fontFamily: grotesk, fontSize: '15px', color: T.text, flex: 1 }}>{o.nom}</strong>
                  <span style={{ fontFamily: grotesk, fontWeight: 800, color: T.accent }}>{compteÀRebours(o.date)}</span>
                </div>
                <p style={{ ...titre, color: T.textMuted, marginTop: 10 }}>Cartes maîtrisées (pondéré) : {pourcent(prép.taux)}</p>
                <Barre T={T} valeur={prép.taux} seuil={o.seuil} hauteur={12} />
                {prép.couvert < 1 && <p style={{ fontSize: '12px', color: '#b07400', margin: '6px 0 0' }}>⚠️ {pourcent(1 - prép.couvert)} du programme n'a pas encore de cartes (voir « Domaines et paquets »).</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
                  {prép.détail.map(d => (
                    <div key={d.nom}>
                      <div style={{ display: 'flex', fontSize: '12.5px', color: T.text, marginBottom: 2 }}>
                        <span style={{ flex: 1 }}>{d.nom} <span style={{ color: T.textMuted }}>({d.poids} %)</span></span>
                        <span style={{ fontFamily: grotesk, color: d.total ? T.text : T.textMuted }}>{d.total ? `${d.maîtrisées}/${d.total}` : 'aucune carte'}</span>
                      </div>
                      <Barre T={T} valeur={d.total ? d.maîtrisées / d.total : 0} hauteur={6} />
                    </div>
                  ))}
                </div>
                <p style={{ ...titre, color: T.textMuted }}>Examens blancs</p>
                <Courbe T={T} examens={exams} seuil={o.seuil} />
                <p style={{ fontSize: '13px', color: est.avant === false ? T.danger : T.text, margin: '8px 0 0', fontFamily: grotesk, fontWeight: 600 }}>{est.texte}</p>
              </section>
            )
          })}
          <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
            <p style={{ ...titre, color: T.textMuted }}>Tous les paquets</p>
            <p style={{ fontSize: '11.5px', color: T.textMuted, margin: '0 0 8px' }}>Maîtrisée = réussie au moins {MAÎTRISE} fois de suite (révision espacée).</p>
            {data.paquets.map(p => {
              const m = maîtrise(data.cartes, [p.id])
              if (!m.total) return null
              return (
                <div key={p.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', fontSize: '12.5px', color: T.text, marginBottom: 2 }}><span style={{ flex: 1 }}>{p.nom}</span><span style={{ fontFamily: grotesk }}>{m.maîtrisées}/{m.total}</span></div>
                  <Barre T={T} valeur={m.maîtrisées / m.total} hauteur={6} />
                </div>
              )
            })}
          </section>
        </>
      )}
    </FenêtreMémo>
  )
}

function ÉditeurDomaines({ T, o, paquets, onModifier }) {
  const maj = (i, ch) => onModifier({ domaines: o.domaines.map((d, k) => (k === i ? { ...d, ...ch } : d)) })
  const champ = { minHeight: 32, padding: '0 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: '13px' }
  return (
    <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
      <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 8px', lineHeight: 1.45 }}>Relie chaque domaine à tes paquets de cartes : l'examen blanc tirera les questions selon le poids de chaque domaine.</p>
      {o.domaines.map((d, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <input value={d.nom} onChange={e => maj(i, { nom: e.target.value })} aria-label="Nom du domaine" style={{ ...champ, flex: 1, minWidth: 0 }} />
            <input type="number" min="0" max="100" value={d.poids} onChange={e => maj(i, { poids: Math.max(0, Number(e.target.value) || 0) })} aria-label={`Poids de ${d.nom} en %`} style={{ ...champ, width: 62 }} />
            <span style={{ fontSize: '12px', color: T.textMuted }}>%</span>
            <button onClick={() => onModifier({ domaines: o.domaines.filter((_, k) => k !== i) })} aria-label={`Retirer ${d.nom}`} style={{ ...champ, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {paquets.map(p => {
              const lié = d.paquetIds.includes(p.id)
              return <button key={p.id} onClick={() => maj(i, { paquetIds: lié ? d.paquetIds.filter(x => x !== p.id) : [...d.paquetIds, p.id] })} aria-pressed={lié}
                style={{ minHeight: 30, padding: '0 10px', borderRadius: 15, fontSize: '12px', cursor: 'pointer', background: lié ? `${p.couleur}33` : 'transparent', color: T.text, border: `1px solid ${lié ? p.couleur : T.border}` }}>{lié ? '✓ ' : ''}{p.nom}</button>
            })}
          </div>
        </div>
      ))}
      <button onClick={() => onModifier({ domaines: [...o.domaines, { nom: 'Nouveau domaine', poids: 10, paquetIds: [] }] })} style={{ ...champ, cursor: 'pointer' }}>＋ Domaine</button>
    </div>
  )
}

function Plan({ T, o, espace, onFait }) {
  const tâches = planDeRévision(o)
  const [programme, setProgramme] = useState(null)
  const [colonne, setColonne] = useState('')
  const [état, setÉtat] = useState('')
  useEffect(() => { let ok = true; lireTâches(espace).then(d => { if (ok) { setProgramme(d); setColonne(d?.colonnes?.[0]?.id || '') } }); return () => { ok = false } }, [espace])
  const envoyer = async () => {
    setÉtat('Envoi…')
    try { const r = await créerTâches({ espace, colonneId: colonne, tâches }); setÉtat(`✓ ${r.nombre} tâches ajoutées dans « ${r.colonne.titre} » avec leurs échéances (visibles aussi dans l'Agenda).`); onFait() } catch (err) { setÉtat(err.message) }
  }
  return (
    <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
      {o.planCréé && <p style={{ fontSize: '12px', color: '#b07400', margin: '0 0 6px' }}>Plan déjà ajouté le {new Date(`${o.planCréé}T12:00:00`).toLocaleDateString('fr-FR')} : le renvoyer créerait des doublons.</p>}
      <ol style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: '12.5px', color: T.text, lineHeight: 1.6, maxHeight: 220, overflowY: 'auto' }}>
        {tâches.map((t, i) => <li key={i}><strong style={{ fontFamily: grotesk }}>{new Date(`${t.échéance}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</strong> · {t.texte.replace(`🎯 ${o.nom} · `, '').replace(`🎯 ${o.nom} : `, '')}</li>)}
      </ol>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: '13px', color: T.text, display: 'flex', gap: 6, alignItems: 'center' }}>Section
          <select value={colonne} onChange={e => setColonne(e.target.value)} aria-label="Section du Programme" style={{ minHeight: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
            {(programme?.colonnes || []).map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
          </select>
        </label>
        <button onClick={envoyer} disabled={!programme?.colonnes?.length} style={{ minHeight: 36, padding: '0 14px', borderRadius: 18, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, cursor: 'pointer' }}>Ajouter au Programme ({tâches.length})</button>
      </div>
      {état && <p style={{ fontSize: '12.5px', color: état.startsWith('✓') ? '#2e9e6b' : T.text, margin: '8px 0 0' }}>{état}</p>}
    </div>
  )
}
