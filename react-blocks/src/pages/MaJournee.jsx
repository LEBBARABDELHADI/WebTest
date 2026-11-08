import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import PanneauSync from '../components/PanneauSync'
import EnTetePilotage, { Barre } from '../components/EnTetePilotage'
import { stylesPilotage } from '../lib/stylesPilotage'
import { grotesk, serif, useTheme } from '../lib/theme'
import { TexteFormaté } from '../lib/texteFormate'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { useDonnéesFoyer, modifierOutil, lireLocal } from '../lib/donneesFoyer'
import { analyserAujourdhui } from '../lib/aujourdhui'
import { construireIndex } from '../lib/agendaIndex'
import { actives, prévue, faite, série, aujourdhuiLocal, décaler } from '../lib/habitudes'
import { appliquerRéponse, aujourdhuiISO, INTERVALLES } from '../lib/revisionCarte'
import { TYPES as TYPES_LECTURE } from '../lib/lectures'
import {
  usePilotage, uid, nettoyerJours, lundiDe, trimestreDe, prochainesÉchéances, compte, urgence, dateCourte, dateLongue,
  TYPES_ÉCHÉANCE, avancement,
} from '../lib/pilotage'

const COULEUR = { tâche: '#f0a839', retard: '#e2574c', planifiée: '#5b8dc9', livraison: '#22a55e', quotidienne: '#8b7ab8', révision: '#4a9d94' }
const MAX = 3

function salutation(h) { return h < 5 ? 'Bonne nuit 🌙' : h < 12 ? 'Bonjour ☀️' : h < 18 ? 'Bon après-midi 🌤️' : 'Bonsoir 🌙' }
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

export default function MaJournee() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const S = stylesPilotage(T)
  const { lire, remplacer } = useDonnéesFoyer(foyer)
  const { data: pilotage, setData: setPilotage, token, statut, erreur, connecter, déconnecter } = usePilotage(foyer)
  const auj = aujourdhuiLocal()
  const [message, setMessage] = useState('')
  const afficher = t => { setMessage(t); setTimeout(() => setMessage(m => (m === t ? '' : m)), 3500) }
  const espaces = ['perso', 'pro'].map(t => ({ espace: `${foyer.préfixe}${t}`, nom: t === 'pro' ? 'Pro' : 'Perso' }))

  // Écriture dans un autre outil (copie de l'appareil + GitHub), puis affichage.
  const écrire = async (outil, e, fn, ok) => {
    try {
      const r = await modifierOutil(outil, e, fn, lire(outil, e))
      remplacer(outil, e, r.données)
      if (ok) afficher(ok)
    } catch (err) { afficher(`Pas enregistré : ${err.message}`) }
  }

  // ---------- Priorités ----------
  const priorités = pilotage.jours[auj]?.priorités || []
  const setPriorités = fn => setPilotage(d => ({ ...d, jours: nettoyerJours({ ...d.jours, [auj]: { ...(d.jours[auj] || {}), priorités: fn(d.jours[auj]?.priorités || []) } }) }))
  const ajouterPriorité = p => {
    if (priorités.length >= MAX) { afficher(`${MAX} priorités, c'est le maximum : termine-en une d'abord`); return }
    if (priorités.some(x => x.texte.toLowerCase() === p.texte.toLowerCase())) return
    setPriorités(l => [...l, { id: uid(), texte: p.texte, fait: false, ...(p.tâche ? { tâche: p.tâche } : {}) }])
  }
  const basculerTâche = (e, id, fait) => écrire('taches', e, d => ({
    ...d,
    cartes: (d.cartes || []).map(c => {
      if (c.id !== id) return c
      if (c.récurrence) { const v = (c.validées || []).filter(j => j !== auj); return { ...c, validées: fait ? [...v, auj].sort() : v } }
      const x = { ...c }
      if (fait) { x.fait = true; x.faitLe = auj } else { delete x.fait; delete x.faitLe }
      return x
    }),
  }))
  const cocherPriorité = p => {
    setPriorités(l => l.map(x => (x.id === p.id ? { ...x, fait: !x.fait } : x)))
    if (p.tâche) basculerTâche(p.tâche.espace, p.tâche.id, !p.fait)
    if (!p.fait && priorités.filter(x => x.fait).length + 1 === priorités.length && priorités.length === MAX) afficher('🎉 Tes 3 priorités sont faites !')
  }

  const lundi = lundiDe(auj)
  const suggestions = useMemo(() => {
    const l = []
    const vus = new Set(priorités.map(p => p.texte.toLowerCase()))
    const pousser = s => { const k = s.texte.toLowerCase(); if (!vus.has(k)) { vus.add(k); l.push(s) } }
    ;(pilotage.jours[décaler(auj, -1)]?.priorités || []).filter(p => !p.fait).forEach(p => pousser({ texte: p.texte, tâche: p.tâche, origine: "↩ d'hier" }))
    ;(pilotage.semaines[lundi]?.priorités || []).filter(p => !p.fait).forEach(p => pousser({ texte: p.texte, origine: '📝 semaine' }))
    espaces.forEach(({ espace: e, nom }) => {
      const a = analyserAujourdhui(lire('taches', e), aujourdhuiISO(), { sansRécurrentes: true })
      a.enRetard.forEach(c => pousser({ texte: (c.texte || '').split('\n')[0], tâche: { espace: e, id: c.id }, origine: `${nom} · en retard`, retard: true }))
      ;[...a.échéance, ...a.colonne].forEach(c => pousser({ texte: (c.texte || '').split('\n')[0], tâche: { espace: e, id: c.id }, origine: `${nom} · aujourd'hui` }))
    })
    const lv = lireLocal('livret', `${foyer.préfixe}perso`)
    const lç = (lv.plan?.calendrier || []).find(([id, date]) => !lv.leçons?.[id]?.faite && date <= auj)
    if (lç) pousser({ texte: `🇫🇷 Leçon du livret : ${lç[2]}`, origine: '📘 Livret 2026' })
    const trimestre = trimestreDe(auj)
    pilotage.objectifs.filter(o => o.année === Number(auj.slice(0, 4))).forEach(o => (o.étapes || []).filter(s => !s.fait && s.trimestre === trimestre).slice(0, 1).forEach(s => pousser({ texte: s.texte, origine: `${o.emoji || '🎯'} objectif` })))
    return l.slice(0, 8)
  }, [pilotage, lire, auj]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Agenda, habitudes, carte, lecture ----------
  const agenda = (construireIndex(lire, foyer, auj).get(auj) || []).filter(e => e.type !== 'révision')
  const habitudes = espaces.flatMap(({ espace: e, nom }) => {
    const d = lire('habitudes', e)
    return actives(d).filter(h => prévue(h, auj)).map(h => ({ ...h, espace: e, nomEspace: nom, fait: faite(d.coches, h, auj), série: série(h, d.coches, auj) }))
  })
  const cocherHabitude = h => écrire('habitudes', h.espace, d => {
    const coches = { ...(d.coches || {}) }
    const jour = { ...(coches[auj] || {}) }
    if (jour[h.id]) delete jour[h.id]; else jour[h.id] = true
    coches[auj] = jour
    return { ...d, coches }
  }, h.fait ? null : `✓ ${h.emoji || ''} ${h.nom}${h.série + 1 > 1 ? ` · 🔥 ${h.série + 1} jours` : ''}`)

  const àRéviser = espaces.flatMap(({ espace: e }) => {
    const d = lire('memoriser', e)
    return (d.cartes || []).filter(c => !c.prochaineRevision || c.prochaineRevision <= aujourdhuiISO()).map(c => ({ ...c, espace: e, paquet: (d.paquets || []).find(p => p.id === c.paquetId) }))
  })
  const [passées, setPassées] = useState([])
  const restantes = àRéviser.filter(c => !passées.includes(c.id))
  const carte = restantes.length ? restantes[hash(auj) % restantes.length] : null

  const lectures = espaces.flatMap(({ espace: e }) => (lire('lectures', e).éléments || []).map(x => ({ ...x, espace: e })))
  const lecture = lectures.find(x => x.statut === 'encours') || lectures.filter(x => x.statut === 'àlire').sort((a, b) => (a.ajouté || '').localeCompare(b.ajouté || ''))[0]

  // Leçon du jour du Livret 2026 (plan créé dans la page du livret).
  const livretEspace = `${foyer.préfixe}perso`
  const livret = lireLocal('livret', livretEspace)
  const leçonLivret = (livret.plan?.calendrier || []).find(([id]) => !livret.leçons?.[id]?.faite)
  const livretRetard = (livret.plan?.calendrier || []).filter(([id, date]) => !livret.leçons?.[id]?.faite && date < auj).length
  const échéances = prochainesÉchéances(pilotage, lire, foyer, auj)
  const objectifs = pilotage.objectifs.filter(o => o.année === Number(auj.slice(0, 4)))
  const lireLectures = e => lire('lectures', e)

  const maintenant = new Date()
  const dimanche = maintenant.getDay() === 0
  const revueDernière = pilotage.semaines[décaler(lundi, -7)]
  const proposerRevue = dimanche ? !pilotage.semaines[lundi]?.terminée : (maintenant.getDay() === 1 && !revueDernière?.terminée)
  const faites = priorités.filter(p => p.fait).length

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <EnTetePilotage T={T} foyer={foyer} actif="journee" titre={salutation(maintenant.getHours())}
          sousTitre={`${dateLongue(auj).replace(/^./, c => c.toUpperCase())} · ${foyer.nom}`} />
        <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`pilotage-${foyer.id}.json`} marginBottom="12px" />

        {proposerRevue && (
          <Link to={`/semaine/${foyer.préfixe}perso${dimanche ? '' : `?semaine=${décaler(lundi, -7)}`}`} style={{ ...S.carte, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: T.text, borderColor: T.accent, background: `${T.accent}14` }}>
            <span style={{ fontSize: 26 }}>📝</span>
            <span style={{ flex: 1 }}><strong style={{ fontFamily: grotesk }}>{dimanche ? 'C\'est dimanche : fais ta revue de la semaine' : 'La revue de la semaine dernière n\'est pas faite'}</strong><span style={{ display: 'block', ...S.discret }}>10 minutes pour faire le bilan et choisir tes priorités.</span></span>
            <span style={S.lien}>Ouvrir →</span>
          </Link>
        )}

        {échéances.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {échéances.slice(0, 4).map(e => {
              const u = urgence(e.date, auj)
              const couleur = u === 'forte' ? T.danger : u === 'moyenne' ? '#c98a00' : T.textMuted
              const contenu = (
                <>
                  <span style={{ fontSize: 18 }}>{TYPES_ÉCHÉANCE[e.type]?.emoji || '📌'}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190 }}>{e.titre}</span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{dateCourte(e.date)}</span>
                  </span>
                  <strong style={{ fontFamily: grotesk, color: couleur, fontSize: 15, marginLeft: 4 }}>{compte(e.date, auj)}</strong>
                </>
              )
              const style = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, border: `1px solid ${u === 'faible' ? T.border : couleur}`, background: T.surface, flexShrink: 0, textDecoration: 'none', color: T.text }
              return e.lien ? <Link key={e.id} to={e.lien} style={style}>{contenu}</Link> : <Link key={e.id} to={`/annee/${foyer.préfixe}perso#dates`} style={style}>{contenu}</Link>
            })}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 14, alignItems: 'start' }}>
          <div>
            {/* Priorités */}
            <section style={S.carte} aria-labelledby="titre-priorites">
              <h2 id="titre-priorites" style={S.titre}>⭐ Mes 3 priorités <span style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>{priorités.length ? `${faites}/${priorités.length}` : ''}</span></h2>
              {priorités.length > 0 && <div style={{ marginBottom: 10 }}><Barre T={T} taux={priorités.length ? faites / MAX : 0} couleur="#2e9e6b" nom="Priorités faites" /></div>}
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {priorités.map((p, i) => (
                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <button onClick={() => cocherPriorité(p)} role="checkbox" aria-checked={p.fait} aria-label={`${p.texte} : ${p.fait ? 'faite' : 'à faire'}`} style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 9, border: `2px solid ${p.fait ? '#2e9e6b' : T.border}`, background: p.fait ? '#2e9e6b' : 'transparent', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{p.fait ? '✓' : i + 1}</button>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 15.5, textDecoration: p.fait ? 'line-through' : 'none', color: p.fait ? T.textMuted : T.text, wordBreak: 'break-word' }}>{p.texte}{p.tâche && <span title="Reliée à une tâche du Programme : la cocher coche aussi la tâche" style={{ marginLeft: 6, fontSize: 12, color: T.textMuted }}>🔗</span>}</span>
                    <button onClick={() => setPriorités(l => l.filter(x => x.id !== p.id))} aria-label={`Retirer ${p.texte}`} style={{ minWidth: 32, minHeight: 32, border: 'none', background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 16 }}>×</button>
                  </li>
                ))}
              </ol>
              {priorités.length < MAX && <SaisiePriorité S={S} n={priorités.length + 1} onAjouter={t => ajouterPriorité({ texte: t })} />}
              {priorités.length < MAX && suggestions.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ ...S.discret, fontSize: 12.5, marginBottom: 6 }}>Idées (touche pour ajouter) :</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {suggestions.map(s => (
                      <button key={s.texte} onClick={() => ajouterPriorité(s)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, maxWidth: '100%', padding: '6px 10px', borderRadius: 10, border: `1px solid ${s.retard ? T.danger : T.border}`, background: T.bg, color: T.text, cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>＋ {s.texte}</span>
                        <span style={{ fontSize: 11, color: s.retard ? T.danger : T.textMuted }}>{s.origine}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {pilotage.semaines[lundi]?.priorités?.length > 0 && (
                <p style={{ ...S.discret, fontSize: 12.5, marginTop: 10 }}>📝 Semaine : {pilotage.semaines[lundi].priorités.map(p => `${p.fait ? '✓' : '○'} ${p.texte}`).join(' · ')}</p>
              )}
            </section>

            {leçonLivret && (
              <Link to={`/livret2026/${livretEspace}`} style={{ ...S.carte, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: T.text, borderColor: leçonLivret[1] <= auj ? T.accent : T.border }}>
                <span style={{ fontSize: 34 }}>{leçonLivret[3] || '📘'}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ ...S.titre, display: 'block', margin: '0 0 2px' }}>🇫🇷 Leçon du livret (15 min)</span>
                  <strong style={{ display: 'block', fontSize: 15, lineHeight: 1.3 }}>{leçonLivret[2]}</strong>
                  <span style={{ fontSize: 12.5, color: livretRetard ? T.danger : T.textMuted }}>{leçonLivret[1] > auj ? `Prévue le ${dateCourte(leçonLivret[1])} : tu peux avancer` : livretRetard ? `${livretRetard} leçon${livretRetard > 1 ? 's' : ''} en retard` : 'Prévue aujourd\'hui'}</span>
                </span>
                <span style={S.lien}>▶</span>
              </Link>
            )}

            {/* Agenda */}
            <section style={S.carte} aria-labelledby="titre-agenda">
              <h2 id="titre-agenda" style={S.titre}>📅 Agenda du jour <Link to={`/agenda/${foyer.préfixe}perso`} style={{ ...S.lien, marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontSize: 12.5 }}>Agenda →</Link></h2>
              {agenda.length === 0 && <p style={S.discret}>Rien de prévu aujourd'hui dans le Programme.</p>}
              {agenda.slice(0, 10).map((e, i) => (
                <Link key={i} to={e.lien} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', textDecoration: 'none', color: T.text, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: e.retard ? COULEUR.retard : COULEUR[e.type] || T.accent, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, textDecoration: e.fait ? 'line-through' : 'none', color: e.fait ? T.textMuted : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titre}</span>
                  <span style={{ fontSize: 11.5, color: e.retard ? T.danger : T.textMuted, flexShrink: 0 }}>{e.retard ? e.détail || 'en retard' : e.espace}</span>
                </Link>
              ))}
              {agenda.length > 10 && <p style={{ ...S.discret, marginTop: 6 }}>… et {agenda.length - 10} autre{agenda.length > 11 ? 's' : ''}</p>}
            </section>
          </div>

          <div>
            {/* Habitudes */}
            <section style={S.carte} aria-labelledby="titre-habitudes">
              <h2 id="titre-habitudes" style={S.titre}>🔁 Habitudes du jour <span style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>{habitudes.length ? `${habitudes.filter(h => h.fait).length}/${habitudes.length}` : ''}</span></h2>
              {habitudes.length === 0 && <p style={S.discret}>Aucune habitude prévue aujourd'hui. <Link to={`/habitudes/${foyer.préfixe}perso`} style={S.lien}>En créer une →</Link></p>}
              <div style={{ display: 'grid', gap: 6 }}>
                {habitudes.map(h => (
                  <button key={`${h.espace}-${h.id}`} onClick={() => cocherHabitude(h)} role="checkbox" aria-checked={h.fait} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, padding: '6px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1px solid ${h.fait ? (h.couleur || '#2e9e6b') : T.border}`, background: h.fait ? `${h.couleur || '#2e9e6b'}22` : T.bg, color: T.text }}>
                    <span style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: h.fait ? (h.couleur || '#2e9e6b') : 'transparent', border: `2px solid ${h.couleur || '#2e9e6b'}`, color: '#fff', fontSize: 13, fontWeight: 800 }}>{h.fait ? '✓' : ''}</span>
                    <span style={{ flex: 1, fontSize: 15 }}>{h.emoji} {h.nom}</span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{h.série > 0 ? `🔥 ${h.série}` : ''} {h.nomEspace}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Carte à réviser */}
            <section style={S.carte} aria-labelledby="titre-carte">
              <h2 id="titre-carte" style={S.titre}>🧠 Carte à réviser <span style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>{àRéviser.length ? `${àRéviser.length} à réviser` : ''}</span></h2>
              {carte
                ? <CarteRévision key={carte.id} T={T} S={S} carte={carte}
                    onRépondre={su => écrire('memoriser', carte.espace, d => appliquerRéponse(d, carte.id, su), su === true ? '✓ Bien joué' : su === 'hésité' ? '🤔 Revue bientôt' : '↺ Elle reviendra demain')}
                    onPasser={() => setPassées(l => [...l, carte.id])} />
                : <p style={S.discret}>{àRéviser.length ? 'Tu as passé toutes les cartes du jour.' : '✓ Aucune carte à réviser aujourd\'hui.'}</p>}
              {àRéviser.length > 1 && <Link to={`/memoriser/${carte?.espace || espaces[0].espace}`} style={{ ...S.lien, display: 'inline-block', marginTop: 10 }}>Réviser les {àRéviser.length} cartes dans Mémoriser →</Link>}
            </section>

            {/* Lecture */}
            <section style={S.carte} aria-labelledby="titre-lecture">
              <h2 id="titre-lecture" style={S.titre}>📚 À lire <Link to={`/lire/${lecture?.espace || foyer.préfixe + 'perso'}`} style={{ ...S.lien, marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontSize: 12.5 }}>Ma liste →</Link></h2>
              {lecture
                ? <a href={lecture.url || undefined} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', color: T.text, textDecoration: 'none' }}>
                    <span style={{ fontSize: 22 }}>{TYPES_LECTURE[lecture.type]?.emoji || '📰'}</span>
                    <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 14.5 }}>{lecture.titre}</strong><span style={{ fontSize: 12, color: T.textMuted }}>{lecture.statut === 'encours' ? 'En cours' : `Ajouté le ${dateCourte(lecture.ajouté || auj)}`}</span></span>
                  </a>
                : <p style={S.discret}>Rien en attente. Garde ici les articles et vidéos à voir.</p>}
            </section>

            {/* Objectifs */}
            {objectifs.length > 0 && (
              <section style={S.carte} aria-labelledby="titre-objectifs">
                <h2 id="titre-objectifs" style={S.titre}>🎯 Mon année <Link to={`/annee/${foyer.préfixe}perso`} style={{ ...S.lien, marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontSize: 12.5 }}>Objectifs →</Link></h2>
                {objectifs.map(o => {
                  const a = avancement(o, lire, lireLectures)
                  const étape = (o.étapes || []).find(s => !s.fait && s.trimestre === trimestreDe(auj))
                  return (
                    <div key={o.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14, marginBottom: 4 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.emoji} {o.titre}</span><strong style={{ fontFamily: grotesk }}>{Math.round(a.taux * 100)} %</strong></div>
                      <Barre T={T} taux={a.taux} nom={o.titre} hauteur={6} />
                      {étape && <p style={{ ...S.discret, fontSize: 12.5, marginTop: 4 }}>T{étape.trimestre} : {étape.texte}</p>}
                    </div>
                  )
                })}
              </section>
            )}
          </div>
        </div>
      </div>
      {message && <div role="status" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 60, maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: 12, fontSize: 14, background: T.text, color: T.bg, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>{message}</div>}
    </div>
  )
}

function SaisiePriorité({ S, n, onAjouter }) {
  const [t, setT] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); if (t.trim()) { onAjouter(t.trim()); setT('') } }} style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      <input value={t} onChange={e => setT(e.target.value)} placeholder={n === 1 ? 'La chose la plus importante aujourd\'hui…' : `Priorité ${n}…`} aria-label={`Priorité ${n}`} style={{ ...S.champ, flex: 1 }} />
      <button type="submit" disabled={!t.trim()} style={{ ...S.bouton(true), opacity: t.trim() ? 1 : 0.5 }}>Ajouter</button>
    </form>
  )
}

function CarteRévision({ T, S, carte, onRépondre, onPasser }) {
  const [retournée, setRetournée] = useState(false)
  const niveau = carte.niveau || 0
  const bouton = (couleur, texte, détail, su) => (
    <button onClick={() => onRépondre(su)} style={{ flex: 1, minHeight: 50, borderRadius: 12, border: `1px solid ${couleur}`, background: `${couleur}1c`, color: T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
      {texte}<span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: T.textMuted }}>{détail}</span>
    </button>
  )
  return (
    <div>
      <button onClick={() => setRetournée(r => !r)} aria-label={retournée ? 'Voir la question' : 'Voir la réponse'} style={{ width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 14, border: `1px solid ${T.border}`, background: T.bg, color: T.text, cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}><span style={{ color: carte.paquet?.couleur || T.accent, fontWeight: 700 }}>{carte.paquet?.nom || 'Mémoriser'}</span><span style={{ color: T.textMuted }}>{retournée ? 'Réponse' : 'Question'}</span></span>
        <span style={{ display: 'block', fontFamily: serif, fontSize: 18.5, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}><TexteFormaté texte={retournée ? carte.verso : carte.recto} couleurDéfaut={T.text} /></span>
        {!retournée && <span style={{ display: 'block', marginTop: 10, fontSize: 12, color: T.textMuted }}>Touche pour voir la réponse</span>}
      </button>
      {retournée
        ? <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {bouton(T.danger, 'Je ne savais pas', 'demain', false)}
            {bouton('#c98a00', 'J\'ai hésité', `dans ${Math.max(1, Math.round(INTERVALLES[Math.max(1, niveau)] / 2))} j`, 'hésité')}
            {bouton('#2e9e6b', 'Je savais', `dans ${INTERVALLES[Math.min(niveau + 1, INTERVALLES.length - 1)]} j`, true)}
          </div>
        : <button onClick={onPasser} style={{ ...S.bouton(false), marginTop: 8, minHeight: 36, fontSize: 13 }}>Une autre carte</button>}
    </div>
  )
}

