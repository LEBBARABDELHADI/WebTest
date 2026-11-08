import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PanneauSync from '../components/PanneauSync'
import EnTetePilotage, { Barre } from '../components/EnTetePilotage'
import { stylesPilotage } from '../lib/stylesPilotage'
import { grotesk, serif, useTheme } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { useDonnéesFoyer, modifierOutil } from '../lib/donneesFoyer'
import { aujourdhuiLocal, décaler, dateDe } from '../lib/habitudes'
import { normaliser } from '../lib/motsCles'
import { usePilotage, uid, lundiDe, bilanSemaine, avancement, rythme, trimestreDe, dateCourte } from '../lib/pilotage'

const HUMEURS = [['😫', 'Très difficile'], ['😕', 'Difficile'], ['😐', 'Moyenne'], ['🙂', 'Bonne'], ['😄', 'Excellente']]
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MAX = 5
const formatMinutes = m => (m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)} min`)

export default function RevueSemaine() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const S = stylesPilotage(T)
  const [params, setParams] = useSearchParams()
  const { lire, remplacer } = useDonnéesFoyer(foyer)
  const { data: pilotage, setData: setPilotage, token, statut, erreur, connecter, déconnecter } = usePilotage(foyer)
  const auj = aujourdhuiLocal()
  const actuelle = lundiDe(auj)
  const lundi = /^\d{4}-\d{2}-\d{2}$/.test(params.get('semaine') || '') ? lundiDe(params.get('semaine')) : actuelle
  const suivante = décaler(lundi, 7)
  const aller = l => setParams(l === actuelle ? {} : { semaine: l }, { replace: true })
  const [message, setMessage] = useState('')
  const afficher = t => { setMessage(t); setTimeout(() => setMessage(m => (m === t ? '' : m)), 3500) }

  const revue = pilotage.semaines[lundi] || {}
  const prochaine = pilotage.semaines[suivante] || {}
  const modifierSemaine = (clé, champs) => setPilotage(d => ({ ...d, semaines: { ...d.semaines, [clé]: { ...(d.semaines[clé] || {}), ...(typeof champs === 'function' ? champs(d.semaines[clé] || {}) : champs) } } }))

  const b = bilanSemaine(lire, e => lire('lectures', e), foyer, lundi)
  const joursPrio = b.jours.flatMap(j => pilotage.jours[j]?.priorités || [])
  const prioFaites = joursPrio.filter(p => p.fait).length
  const objectifs = pilotage.objectifs.filter(o => o.année === Number(lundi.slice(0, 4)))
  const fin = b.jours[6]
  const titre = `Semaine du ${dateDe(lundi).getDate()}${dateDe(lundi).getMonth() !== dateDe(fin).getMonth() ? ` ${dateDe(lundi).toLocaleDateString('fr-FR', { month: 'short' })}` : ''} au ${dateCourte(fin)}`
  const enCours = lundi === actuelle
  const maxVues = Math.max(1, ...Object.values(b.révisions).map(r => r.vues))
  const espaces = ['perso', 'pro'].map(t => ({ espace: `${foyer.préfixe}${t}`, nom: t === 'pro' ? 'Pro' : 'Perso' }))

  // Suggestions pour la semaine suivante.
  const suggestions = (() => {
    const l = []
    const vus = new Set((prochaine.priorités || []).map(p => p.texte.toLowerCase()))
    const pousser = (texte, origine) => { const k = texte.toLowerCase(); if (texte && !vus.has(k)) { vus.add(k); l.push({ texte, origine }) } }
    ;(revue.priorités || []).filter(p => !p.fait).forEach(p => pousser(p.texte, '↩ pas finie'))
    espaces.forEach(({ espace: e, nom }) => {
      const t = lire('taches', e)
      const col = (t.colonnes || []).find(c => normaliser(c.titre).includes('semaine'))
      if (col) (t.cartes || []).filter(c => c.colonneId === col.id && !c.archivé && !c.fait).slice(0, 4).forEach(c => pousser((c.texte || '').split('\n')[0], `${nom} · ${col.titre}`))
    })
    const q = trimestreDe(suivante)
    objectifs.forEach(o => (o.étapes || []).filter(s => !s.fait && s.trimestre === q).slice(0, 1).forEach(s => pousser(s.texte, `${o.emoji || '🎯'} T${q}`)))
    return l.slice(0, 8)
  })()
  const ajouterProchaine = texte => modifierSemaine(suivante, s => {
    const l = s.priorités || []
    if (l.length >= MAX || l.some(p => p.texte.toLowerCase() === texte.toLowerCase())) return {}
    return { priorités: [...l, { id: uid(), texte, fait: false }] }
  })
  const versProgramme = async e => {
    const àEnvoyer = (prochaine.priorités || []).filter(p => !p.tâche)
    if (!àEnvoyer.length) return
    const ids = àEnvoyer.map(() => uid())
    try {
      const r = await modifierOutil('taches', e, d => {
        const cols = d.colonnes || []
        const col = cols.find(c => normaliser(c.titre).includes('semaine')) || cols.find(c => !/termin/.test(normaliser(c.titre))) || cols[0]
        if (!col) return d
        const déjà = new Set((d.cartes || []).map(c => c.id))
        return { ...d, cartes: [...(d.cartes || []), ...àEnvoyer.map((p, i) => ({ id: ids[i], colonneId: col.id, texte: p.texte, étiquettes: [] })).filter(c => !déjà.has(c.id))] }
      }, lire('taches', e))
      remplacer('taches', e, r.données)
      modifierSemaine(suivante, s => ({ priorités: (s.priorités || []).map(p => { const i = àEnvoyer.findIndex(x => x.id === p.id); return i >= 0 ? { ...p, tâche: { espace: e, id: ids[i] } } : p }) }))
      afficher(`📋 ${ids.length} tâche${ids.length > 1 ? 's' : ''} ajoutée${ids.length > 1 ? 's' : ''} au Programme ${e.endsWith('pro') ? 'pro' : 'perso'}`)
    } catch (err) { afficher(`Pas ajouté : ${err.message}`) }
  }

  const historique = Object.entries(pilotage.semaines).filter(([k, s]) => k <= actuelle && (s.terminée || s.bien || s.humeur)).sort((a, c) => c[0].localeCompare(a[0])).slice(0, 10)
  const tuile = (emoji, valeur, nom, détail) => (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 12px 10px' }}>
      <div style={{ fontSize: 13, color: T.textMuted }}>{emoji} {nom}</div>
      <div style={{ fontFamily: serif, fontSize: 28, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{valeur}</div>
      {détail && <div style={{ fontSize: 12, color: T.textMuted }}>{détail}</div>}
    </div>
  )

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <EnTetePilotage T={T} foyer={foyer} actif="semaine" titre="📝 Revue de la semaine" sousTitre="Ce que tu as fait, ce qui a marché, et tes priorités pour la semaine suivante." />
        <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`pilotage-${foyer.id}.json`} marginBottom="12px" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={() => aller(décaler(lundi, -7))} aria-label="Semaine précédente" style={{ ...S.bouton(false), padding: 0, width: 44 }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <strong style={{ fontFamily: grotesk, fontSize: 16 }}>{titre}</strong>
            <div style={{ fontSize: 12.5, color: revue.terminée ? '#2e9e6b' : T.textMuted }}>{revue.terminée ? `✓ Revue faite le ${dateCourte(revue.terminée)}` : enCours ? 'Semaine en cours' : lundi > actuelle ? 'À venir' : 'Revue pas encore faite'}</div>
          </div>
          <button onClick={() => aller(suivante)} disabled={lundi >= actuelle} aria-label="Semaine suivante" style={{ ...S.bouton(false), padding: 0, width: 44, opacity: lundi >= actuelle ? 0.4 : 1 }}>›</button>
        </div>
        {!enCours && <p style={{ textAlign: 'center', margin: '-6px 0 14px' }}><button onClick={() => aller(actuelle)} style={{ ...S.puce(false), minHeight: 32 }}>Revenir à cette semaine</button></p>}

        {/* Chiffres */}
        <section style={S.carte} aria-label="Chiffres de la semaine">
          <h2 style={S.titre}>📊 Ta semaine en chiffres</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: 8 }}>
            {tuile('✅', b.tâches.length, 'Tâches terminées', b.récurrentes ? `+ ${b.récurrentes} quotidiennes` : null)}
            {tuile('🔁', b.tauxHabitudes == null ? '—' : `${Math.round(b.tauxHabitudes * 100)} %`, 'Habitudes', `${b.habitudes.reduce((n, h) => n + h.faits, 0)}/${b.habitudes.reduce((n, h) => n + h.prévus, 0)} cochées`)}
            {tuile('🧠', b.vues, 'Cartes révisées', b.vues ? `${Math.round((b.sues / b.vues) * 100)} % sues` : null)}
            {tuile('⏱️', b.minutes ? formatMinutes(b.minutes) : '—', 'Temps chronométré', 'Timer → habitudes')}
            {tuile('📚', b.lectures.length, 'Lectures finies', null)}
            {tuile('⭐', joursPrio.length ? `${prioFaites}/${joursPrio.length}` : '—', 'Priorités du jour', joursPrio.length ? `${Math.round((prioFaites / joursPrio.length) * 100)} % faites` : 'Ma journée')}
          </div>
        </section>

        {(revue.priorités || []).length > 0 && (
          <section style={S.carte} aria-labelledby="t-prio-semaine">
            <h2 id="t-prio-semaine" style={S.titre}>🎯 Priorités prévues pour cette semaine</h2>
            {revue.priorités.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!p.fait} onChange={() => modifierSemaine(lundi, s => ({ priorités: (s.priorités || []).map(x => (x.id === p.id ? { ...x, fait: !x.fait } : x)) }))} style={{ width: 20, height: 20 }} />
                <span style={{ fontSize: 15, textDecoration: p.fait ? 'line-through' : 'none', color: p.fait ? T.textMuted : T.text }}>{p.texte}</span>
              </label>
            ))}
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 14, alignItems: 'start' }}>
          <section style={S.carte} aria-labelledby="t-fait">
            <h2 id="t-fait" style={S.titre}>✅ Ce que j'ai fait</h2>
            {b.tâches.length === 0 && <p style={S.discret}>Aucune tâche cochée ou passée dans « Terminé » cette semaine.</p>}
            <ListeRepliable limite={8} éléments={b.tâches} rendu={t => (
              <Link key={t.id} to={t.lien} style={{ display: 'flex', gap: 10, padding: '6px 0', textDecoration: 'none', color: T.text, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: '#2e9e6b' }}>✓</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.texte}</span>
                <span style={{ fontSize: 11.5, color: T.textMuted, flexShrink: 0 }}>{dateDe(t.le).toLocaleDateString('fr-FR', { weekday: 'short' })} · {t.espace}</span>
              </Link>
            )} T={T} />
            {b.lectures.length > 0 && <p style={{ ...S.discret, marginTop: 10 }}>📚 Lu : {b.lectures.map(l => l.titre).join(' · ')}</p>}
          </section>

          <section style={S.carte} aria-labelledby="t-hab">
            <h2 id="t-hab" style={S.titre}>🔁 Habitudes</h2>
            {b.habitudes.length === 0 && <p style={S.discret}>Aucune habitude prévue cette semaine.</p>}
            {b.habitudes.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) repeat(7, 22px) 44px', gap: '6px 4px', alignItems: 'center', fontSize: 13.5 }}>
                <span />{JOURS.map((j, i) => <span key={i} style={{ textAlign: 'center', fontSize: 11, color: T.textMuted, fontWeight: 700 }}>{j}</span>)}<span />
                {b.habitudes.map(h => [
                  <span key={`${h.id}n`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nom}</span>,
                  ...h.jours.map(j => <span key={`${h.id}${j.jour}`} title={`${dateCourte(j.jour)} : ${!j.prévu ? 'pas prévue' : j.fait ? 'faite' : 'pas faite'}`} style={{ width: 18, height: 18, margin: '0 auto', borderRadius: 9, background: j.fait ? (h.couleur || '#2e9e6b') : 'transparent', border: j.prévu ? `2px solid ${j.fait ? (h.couleur || '#2e9e6b') : (j.jour <= auj ? '#e8590c88' : T.border)}` : 'none', color: T.textMuted, textAlign: 'center', lineHeight: '18px', fontSize: 11 }}>{j.prévu ? '' : '·'}</span>),
                  <strong key={`${h.id}t`} style={{ textAlign: 'right', fontFamily: grotesk, fontSize: 13 }}>{h.faits}/{h.prévus}</strong>,
                ])}
              </div>
            )}
          </section>

          <section style={S.carte} aria-labelledby="t-rev">
            <h2 id="t-rev" style={S.titre}>🧠 Révisions et scores</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90, marginBottom: 6 }} aria-label={`Cartes révisées par jour : ${b.jours.map((j, i) => `${JOURS[i]} ${b.révisions[j].vues}`).join(', ')}`} role="img">
              {b.jours.map(j => {
                const r = b.révisions[j]
                return (
                  <div key={j} title={`${dateCourte(j)} : ${r.vues} cartes, ${r.sues} sues`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <span style={{ fontSize: 10.5, color: T.textMuted, textAlign: 'center' }}>{r.vues || ''}</span>
                    <div style={{ height: `${(r.vues / maxVues) * 70}px`, minHeight: r.vues ? 3 : 0, borderRadius: 4, background: `linear-gradient(to top, #2e9e6b ${r.vues ? (r.sues / r.vues) * 100 : 0}%, ${T.accent}99 0)` }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>{JOURS.map((j, i) => <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: T.textMuted }}>{j}</span>)}</div>
            <p style={{ ...S.discret, marginTop: 8 }}>{b.vues ? `${b.vues} cartes révisées, ${b.sues} sues du premier coup (en vert).` : 'Aucune carte révisée cette semaine (le décompte commence avec cette version de l\'appli).'}</p>
            {b.examens.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ ...S.titre, marginBottom: 6 }}>Examens blancs</p>
                {b.examens.map((e, i) => {
                  const p = e.total ? Math.round((e.bonnes / e.total) * 100) : 0
                  return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '4px 0' }}><span style={{ flex: 1 }}>{dateCourte(e.date.slice(0, 10))} · {e.nom || e.titre || 'Examen blanc'}</span><strong style={{ color: p >= 72 ? '#2e9e6b' : '#e8590c' }}>{e.bonnes}/{e.total} ({p} %)</strong></div>
                })}
              </div>
            )}
          </section>

          {objectifs.length > 0 && (
            <section style={S.carte} aria-labelledby="t-obj">
              <h2 id="t-obj" style={S.titre}>🎯 Objectifs de l'année <Link to={`/annee/${foyer.préfixe}perso`} style={{ ...S.lien, marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontSize: 12.5 }}>Voir →</Link></h2>
              {objectifs.map(o => {
                const a = avancement(o, lire, e => lire('lectures', e))
                const r = rythme(a.taux, o.année, fin)
                return (
                  <div key={o.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14, marginBottom: 4 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.emoji} {o.titre}</span><span style={{ color: r.couleur, fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{Math.round(a.taux * 100)} % · {r.nom}</span></div>
                    <Barre T={T} taux={a.taux} couleur={r.couleur} repère={r.attendu} nom={o.titre} hauteur={6} />
                  </div>
                )
              })}
            </section>
          )}
        </div>

        {/* Bilan */}
        <section style={S.carte} aria-labelledby="t-bilan">
          <h2 id="t-bilan" style={S.titre}>💬 Mon bilan</h2>
          <p style={{ ...S.discret, marginBottom: 6 }}>Comment s'est passée ta semaine ?</p>
          <div role="radiogroup" aria-label="Humeur de la semaine" style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {HUMEURS.map(([e, nom], i) => (
              <button key={e} role="radio" aria-checked={revue.humeur === i + 1} aria-label={nom} title={nom} onClick={() => modifierSemaine(lundi, { humeur: revue.humeur === i + 1 ? undefined : i + 1 })} style={{ flex: 1, minHeight: 50, fontSize: 26, borderRadius: 12, cursor: 'pointer', border: `2px solid ${revue.humeur === i + 1 ? T.accent : T.border}`, background: revue.humeur === i + 1 ? `${T.accent}22` : T.bg, filter: revue.humeur && revue.humeur !== i + 1 ? 'grayscale(.8)' : 'none' }}>{e}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 10 }}>
            <ChampBilan key={`${lundi}-bien`} S={S} id="bien" titre="👍 Ce qui a bien marché" texte={revue.bien} onChange={v => modifierSemaine(lundi, { bien: v })} indice="Une réussite, même petite" />
            <ChampBilan key={`${lundi}-coince`} S={S} id="coince" titre="🧱 Ce qui a coincé" texte={revue.coincé} onChange={v => modifierSemaine(lundi, { coincé: v })} indice="Ce qui t'a ralenti ou bloqué" />
            <ChampBilan key={`${lundi}-changer`} S={S} id="changer" titre="🔧 Ce que je change" texte={revue.changer} onChange={v => modifierSemaine(lundi, { changer: v })} indice="Une seule chose à essayer" />
          </div>
        </section>

        {/* Semaine suivante */}
        <section style={{ ...S.carte, borderColor: T.accent }} aria-labelledby="t-suivante">
          <h2 id="t-suivante" style={S.titre}>🚀 Priorités de la semaine du {dateCourte(suivante)}</h2>
          <p style={{ ...S.discret, marginBottom: 8 }}>Jusqu'à {MAX} choses qui comptent vraiment. Elles apparaîtront dans « Ma journée » toute la semaine.</p>
          {(prochaine.priorités || []).map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ width: 26, height: 26, borderRadius: 13, background: T.accent, color: T.accentText, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 15 }}>{p.texte}{p.tâche && <span style={{ marginLeft: 6, fontSize: 12, color: T.textMuted }}>📋 dans le Programme</span>}</span>
              <button onClick={() => modifierSemaine(suivante, s => ({ priorités: (s.priorités || []).filter(x => x.id !== p.id) }))} aria-label={`Retirer ${p.texte}`} style={{ minWidth: 32, minHeight: 32, border: 'none', background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}
          {(prochaine.priorités || []).length < MAX && <Saisie S={S} onAjouter={ajouterProchaine} indice={(prochaine.priorités || []).length ? 'Une autre priorité…' : 'La priorité n° 1 de la semaine prochaine…'} />}
          {(prochaine.priorités || []).length < MAX && suggestions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {suggestions.map(s => (
                <button key={s.texte} onClick={() => ajouterProchaine(s.texte)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '6px 10px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, cursor: 'pointer', textAlign: 'left', maxWidth: '100%' }}>
                  <span style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>＋ {s.texte}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{s.origine}</span>
                </button>
              ))}
            </div>
          )}
          {(prochaine.priorités || []).some(p => !p.tâche) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {espaces.map(({ espace: e, nom }) => <button key={e} onClick={() => versProgramme(e)} style={S.bouton(false)}>📋 Mettre aussi dans le Programme {nom.toLowerCase()}</button>)}
            </div>
          )}
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 26px' }}>
          {revue.terminée
            ? <button onClick={() => modifierSemaine(lundi, { terminée: undefined })} style={S.bouton(false)}>✓ Revue faite le {dateCourte(revue.terminée)} · rouvrir</button>
            : <button onClick={() => { modifierSemaine(lundi, { terminée: auj }); afficher('🎉 Revue terminée. Bonne semaine !') }} style={{ ...S.bouton(true), minHeight: 52, fontSize: 16, padding: '0 26px' }}>✓ Terminer la revue</button>}
        </div>

        {historique.length > 0 && (
          <section style={S.carte} aria-labelledby="t-hist">
            <h2 id="t-hist" style={S.titre}>🗓️ Mes revues</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {historique.map(([k, s]) => (
                <button key={k} onClick={() => aller(k)} aria-current={k === lundi ? 'true' : undefined} style={{ ...S.puce(k === lundi), minHeight: 38 }}>
                  {s.humeur ? HUMEURS[s.humeur - 1][0] : '📝'} {dateCourte(k)}{s.terminée ? ' ✓' : ''}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
      {message && <div role="status" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 60, maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: 12, fontSize: 14, background: T.text, color: T.bg, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>{message}</div>}
    </div>
  )
}

function ListeRepliable({ T, éléments, limite, rendu }) {
  const [tout, setTout] = useState(false)
  return (
    <>
      {(tout ? éléments : éléments.slice(0, limite)).map(rendu)}
      {éléments.length > limite && <button onClick={() => setTout(t => !t)} style={{ marginTop: 8, border: 'none', background: 'transparent', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13.5, padding: 0 }}>{tout ? 'Voir moins' : `Voir les ${éléments.length}`}</button>}
    </>
  )
}

// Texte enregistré après une courte pause (pas à chaque lettre).
function ChampBilan({ S, id, titre, texte, onChange, indice }) {
  const [v, setV] = useState(texte || '')
  const minuteur = useRef(null)
  const dernier = useRef(texte || '')
  useEffect(() => () => clearTimeout(minuteur.current), [])
  const écrire = x => { setV(x); clearTimeout(minuteur.current); minuteur.current = setTimeout(() => { dernier.current = x; onChange(x) }, 500) }
  return (
    <label htmlFor={`bilan-${id}`} style={{ display: 'block' }}>
      <span style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{titre}</span>
      <textarea id={`bilan-${id}`} value={v} onChange={e => écrire(e.target.value)} onBlur={() => { if (v !== dernier.current) { clearTimeout(minuteur.current); dernier.current = v; onChange(v) } }} placeholder={indice} rows={3} style={{ ...S.champ, resize: 'vertical', lineHeight: 1.5 }} />
    </label>
  )
}

function Saisie({ S, onAjouter, indice }) {
  const [t, setT] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); if (t.trim()) { onAjouter(t.trim()); setT('') } }} style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      <input value={t} onChange={e => setT(e.target.value)} placeholder={indice} aria-label="Nouvelle priorité de la semaine" style={{ ...S.champ, flex: 1 }} />
      <button type="submit" disabled={!t.trim()} style={{ ...S.bouton(true), opacity: t.trim() ? 1 : 0.5 }}>Ajouter</button>
    </form>
  )
}
