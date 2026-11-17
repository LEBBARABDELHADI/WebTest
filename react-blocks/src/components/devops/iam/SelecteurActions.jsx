// Sélecteur d'actions : on cherche un service (s3, ec2, lambda…), on filtre par niveau d'accès,
// on coche des actions, puis on les ajoute (en jokers quand l'expansion reste exacte).
import { useMemo, useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { NIVEAUX, NIVEAUX_FR } from '../../../lib/iam/donnees'
import { compresserActions } from '../../../lib/iam/assistant'
import { MONO } from '../../../lib/querygen/apparence'

const COULEURS = ['#2563eb', '#2e9e6b', '#d97706', '#dc2626', '#7c3aed']
const PAGE = 60

export default function SelecteurActions({ données, onAjouter, T, S }) {
  const catalogue = données.cat
  const [requête, setRequête] = useState('')
  const [service, setService] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [niveau, setNiveau] = useState(-1)
  const [filtre, setFiltre] = useState('')
  const [choix, setChoix] = useState(() => new Set())
  const [limite, setLimite] = useState(PAGE)

  const services = useMemo(() => {
    const q = requête.trim().toLowerCase()
    if (!q) return []
    return données.cat.préfixes().filter(s => s.p.toLowerCase().includes(q) || s.n.toLowerCase().includes(q)).sort((a, b) => Number(b.p.toLowerCase() === q) - Number(a.p.toLowerCase() === q) || Number(b.p.toLowerCase().startsWith(q)) - Number(a.p.toLowerCase().startsWith(q)) || a.p.localeCompare(b.p)).slice(0, 12)
  }, [requête, données])

  const choisirService = async s => {
    setChargement(true)
    setErreur(null)
    try {
      await catalogue.charger([s.p])
      setService(s)
      setChoix(new Set())
      setNiveau(-1)
      setFiltre('')
      setLimite(PAGE)
      setRequête('')
    } catch (e) {
      setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }

  const détails = service ? catalogue.service(service.p) : null
  const actions = useMemo(() => {
    if (!détails) return []
    const f = filtre.trim().toLowerCase()
    return détails.actions.filter(a => (niveau < 0 || a.niveau === niveau) && (!f || a.nom.toLowerCase().includes(f) || a.desc.toLowerCase().includes(f)))
  }, [détails, niveau, filtre])
  const parNiveau = useMemo(() => NIVEAUX.map((_, i) => détails?.actions.filter(a => a.niveau === i).length ?? 0), [détails])

  const basculer = id => setChoix(c => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toutChoisir = () => setChoix(c => new Set([...c, ...actions.map(a => a.id)]))
  const ajouter = () => {
    const sélection = détails.actions.filter(a => choix.has(a.id))
    if (!sélection.length) return
    onAjouter(compresserActions(catalogue, service.p, sélection, sélection, null))
    setChoix(new Set())
  }

  return (
    <div style={{ border: `1px dashed ${T.border}`, borderRadius: 12, padding: 10, background: T.bg }}>
      {!service ? (
        <>
          <input value={requête} onChange={e => setRequête(e.target.value)} aria-label="Chercher un service AWS" placeholder="Chercher un service : s3, ec2, lambda, dynamodb…" autoCapitalize="off" autoCorrect="off" spellCheck={false} style={{ ...S.champ, fontSize: 16 }} />
          {services.length > 0 && (
            <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 4 }}>
              {services.map(s => (
                <li key={s.p}>
                  <button type="button" onClick={() => choisirService(s)} style={{ display: 'flex', width: '100%', gap: 8, alignItems: 'center', textAlign: 'left', padding: '8px 10px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, cursor: 'pointer', minHeight: 42 }}>
                    <code style={{ fontFamily: MONO, fontWeight: 700 }}>{s.p}</code>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{s.n}</span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{s.a} actions</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {requête.trim() && !services.length && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.textMuted }}>Aucun service ne correspond à « {requête} ».</p>}
          {chargement && <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>Chargement…</p>}
          {erreur && <p role="alert" style={{ margin: '8px 0 0', fontSize: 13.5, color: '#dc2626' }}>{erreur}</p>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <strong style={{ fontFamily: grotesk }}>{service.n}</strong>
            <code style={{ fontFamily: MONO, fontSize: 13 }}>{service.p}</code>
            <span style={{ flex: 1 }} />
            <button type="button" onClick={() => setService(null)} style={{ ...S.puce(false), minHeight: 34, fontSize: 13 }}>↩ Autre service</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }} role="radiogroup" aria-label="Niveau d'accès">
            <button type="button" role="radio" aria-checked={niveau < 0} onClick={() => { setNiveau(-1); setLimite(PAGE) }} style={{ ...S.puce(niveau < 0), minHeight: 34, fontSize: 12.5 }}>Tous ({détails.actions.length})</button>
            {NIVEAUX.map((n, i) => parNiveau[i] > 0 && (
              <button key={n} type="button" role="radio" aria-checked={niveau === i} onClick={() => { setNiveau(i); setLimite(PAGE) }} style={{ ...S.puce(niveau === i), minHeight: 34, fontSize: 12.5 }}>{NIVEAUX_FR[n]} ({parNiveau[i]})</button>
            ))}
          </div>
          <input value={filtre} onChange={e => { setFiltre(e.target.value); setLimite(PAGE) }} aria-label="Filtrer les actions" placeholder="Filtrer : nom ou description (ex. bucket, delete)" style={{ ...S.champ, fontSize: 16, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            <button type="button" onClick={toutChoisir} disabled={!actions.length} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5 }}>Cocher les {actions.length} affichées</button>
            <button type="button" onClick={() => setChoix(new Set())} disabled={!choix.size} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5 }}>Tout décocher</button>
            <button type="button" onClick={() => onAjouter([`${service.p}:*`])} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5 }}>Ajouter {service.p}:* (tout)</button>
          </div>
          <div role="group" aria-label="Actions" style={{ maxHeight: 340, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10, background: T.surface }}>
            {actions.slice(0, limite).map(a => (
              <label key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                <input type="checkbox" checked={choix.has(a.id)} onChange={() => basculer(a.id)} style={{ marginTop: 3, width: 18, height: 18, accentColor: T.accent }} aria-label={a.id} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <code style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, wordBreak: 'break-all' }}>{a.nom}</code>
                    <span style={{ fontSize: 11, fontWeight: 800, color: COULEURS[a.niveau], border: `1px solid ${COULEURS[a.niveau]}55`, borderRadius: 999, padding: '0 6px' }}>{NIVEAUX_FR[a.niveauNom]}</span>
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: T.textMuted, lineHeight: 1.4 }}>{a.desc}</span>
                </span>
              </label>
            ))}
            {!actions.length && <p style={{ margin: 10, fontSize: 13.5, color: T.textMuted }}>Aucune action ne correspond.</p>}
            {actions.length > limite && <button type="button" onClick={() => setLimite(l => l + PAGE)} style={{ ...S.puce(false), margin: 8, minHeight: 36 }}>Afficher {Math.min(PAGE, actions.length - limite)} de plus ({actions.length - limite} restantes)</button>}
          </div>
          <button type="button" onClick={ajouter} disabled={!choix.size} style={{ ...S.puce(true), minHeight: 44, marginTop: 8, opacity: choix.size ? 1 : 0.5 }}>Ajouter la sélection ({choix.size})</button>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textMuted }}>La sélection est écrite avec des jokers (ex. {service.p}:Get*) seulement quand ils couvrent exactement les actions cochées.</p>
        </>
      )}
    </div>
  )
}
