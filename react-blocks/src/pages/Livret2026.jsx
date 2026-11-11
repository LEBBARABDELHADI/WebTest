import { useState, useMemo, lazy, Suspense } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PanneauSync from '../components/PanneauSync'
import { BoutonIcone } from '../components/UI'
import Icon from '../components/Icon'
import Théâtre from '../components/livret/Theatre'
import Film from '../components/livret/Film'
import { PAGES_FILM, chargerFilm } from '../lib/livret2026/films'

// Prototype « expérience cinéma » : page 10 seulement, chargé à la demande.
const Cinéma = lazy(() => import('../components/livret/cinema/Cinema'))
// Prototypes « expérience cinéma » : uniquement les pages pilotes validées une à une.
// « Immersion » : l'histoire de France comme un film (d'après le livret), chargée à la demande.
const Immersion = lazy(() => import('../components/livret/immersion/Immersion'))
const CINÉMAS = { 6: () => import('../lib/livret2026/cinema/p6'), 7: () => import('../lib/livret2026/cinema/p7'), 8: () => import('../lib/livret2026/cinema/p8'), 10: () => import('../lib/livret2026/cinema/p10'), 11: () => import('../lib/livret2026/cinema/p11'), 12: () => import('../lib/livret2026/cinema/p12'), 13: () => import('../lib/livret2026/cinema/p13'), 14: () => import('../lib/livret2026/cinema/p14'), 15: () => import('../lib/livret2026/cinema/p15'), 16: () => import('../lib/livret2026/cinema/p16'), 17: () => import('../lib/livret2026/cinema/p17'), 18: () => import('../lib/livret2026/cinema/p18'), 19: () => import('../lib/livret2026/cinema/p19'), 20: () => import('../lib/livret2026/cinema/p20') }
import Leçon from '../components/livret/Lecon'
import Maison from '../components/livret/Maison'
import Frise from '../components/livret/Frise'
import Institutions from '../components/livret/Institutions'
import Situations from '../components/livret/Situations'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { lireLocal } from '../lib/donneesFoyer'
import { aujourdhuiLocal, dateDe } from '../lib/habitudes'
import { CSS_LIVRET } from '../lib/livret2026/animations'
import { PAGES, PAGE, LEÇONS, NB_PAGES, PAGES_CONTENU, leçonDePage } from '../lib/livret2026'
import { PARTIES, imagePage, COULEURS_NIVEAU, NOMS_NIVEAU } from '../lib/livret2026/outils'
import { useLivret, créerPlan, étatPlan, niveauPage, bilanMaîtrise, ajouterCartesLivret } from '../lib/livret2026/progression'

const ONGLETS = [
  ['plan', '🗺️', 'Mon plan'],
  ['pages', '🎬', 'Pages animées'],
  ['maison', '🏠', 'Ma maison'],
  ['frise', '⏳', 'Frise'],
  ['institutions', '🏛️', 'Institutions'],
  ['situations', '🎭', 'Situations'],
]
const dateCourte = j => dateDe(j).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

export default function Livret2026() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [params, setParams] = useSearchParams()
  const onglet = ONGLETS.some(o => o[0] === params.get('onglet')) ? params.get('onglet') : 'plan'
  const choisir = (o, extra = {}) => setParams({ ...(o === 'plan' ? {} : { onglet: o }), ...extra }, { replace: true })
  const { data, setData, token, statut, erreur, connecter, déconnecter } = useLivret(espace)
  const [message, setMessage] = useState('')
  const [immersion, setImmersion] = useState(false)
  const afficher = t => { setMessage(t); setTimeout(() => setMessage(m => (m === t ? '' : m)), 4000) }
  const cartesMémo = lireLocal('memoriser', espace).cartes || []
  const S = useMemo(() => ({
    carte: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 },
    titre: { fontFamily: grotesk, fontSize: 11.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px' },
    bouton: (plein = false) => ({ minHeight: 44, padding: '0 16px', borderRadius: 12, border: `1px solid ${plein ? T.accent : T.border}`, background: plein ? T.accent : T.surface, color: plein ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }),
    discret: { color: T.textMuted, fontSize: 14, margin: 0, lineHeight: 1.5 },
  }), [T])

  if (!PAGES.length) return <div style={{ padding: 30, color: T.text, background: T.bg, minHeight: '100dvh' }}>Le contenu du livret n'est pas encore disponible.</div>

  const autre = espace.endsWith('pro') ? espace.replace(/pro$/, 'perso') : espace.replace(/perso$/, 'pro')
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px' }}>
      <style>{`${CSS_LIVRET} @media (max-width: 420px) { .l26-masque-tel { display: none } }`}</style>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
              {[espace.endsWith('pro') ? autre : espace, espace.endsWith('pro') ? espace : autre].map(e => (
                <Link key={e} to={`/livret2026/${e}`} style={{ fontSize: 12, fontFamily: grotesk, fontWeight: 600, padding: '7px 12px', borderRadius: 6, textDecoration: 'none', background: e === espace ? T.accent : 'transparent', color: e === espace ? T.accentText : T.textMuted }}>{e.endsWith('pro') ? 'Pro' : 'Perso'}</Link>
              ))}
            </div>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
          </div>
        </div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 4px', lineHeight: 1.1 }}>🇫🇷 Livret du citoyen 2026</h1>
        <p style={{ ...S.discret, marginBottom: 14 }}>Les {NB_PAGES} pages de l'édition de mai 2026, mises en scène, pour retenir tout le livret avant l'examen civique et l'entretien.</p>
        <button type="button" onClick={() => setImmersion(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '10px 16px', marginBottom: 14, borderRadius: 16, cursor: 'pointer', textAlign: 'left', border: '1px solid #ffd166', background: 'linear-gradient(135deg, #0b0e18, #2a2140 55%, #3a2a12)', color: '#fff', boxShadow: '0 10px 26px rgba(0,0,0,.28)' }}>
          <span aria-hidden="true" style={{ fontSize: 30 }}>🎬</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: grotesk, fontWeight: 800, fontSize: 16.5, color: '#ffd166' }}>Immersion dans le Livret du citoyen 2026</span>
            <span style={{ display: 'block', fontSize: 13, opacity: 0.85, marginTop: 2 }}>L'histoire de France comme un film : bande-annonce, grande frise, 15 épisodes, cartes, quiz</span>
          </span>
          <span aria-hidden="true" style={{ fontSize: 20, color: '#ffd166' }}>▶</span>
        </button>
        <nav aria-label="Livret 2026" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 14, scrollbarWidth: 'none' }}>
          {ONGLETS.map(([id, emoji, nom]) => (
            <button key={id} onClick={() => choisir(id)} aria-current={onglet === id ? 'page' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 6, minHeight: 42, padding: '0 14px', borderRadius: 21, flexShrink: 0, cursor: 'pointer',
              fontFamily: grotesk, fontWeight: 700, fontSize: 13.5, background: onglet === id ? T.accent : T.surface, color: onglet === id ? T.accentText : T.text, border: `1px solid ${onglet === id ? T.accent : T.border}`,
            }}><span aria-hidden="true">{emoji}</span>{nom}</button>
          ))}
        </nav>
        <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`livret-${espace}.json`} marginBottom="12px" />

        {onglet === 'plan' && <OngletPlan T={T} S={S} data={data} setData={setData} espace={espace} cartesMémo={cartesMémo} afficher={afficher} versPage={n => choisir('pages', { page: String(n) })} />}
        {onglet === 'pages' && <OngletPages T={T} S={S} data={data} setData={setData} cartesMémo={cartesMémo} page={Number(params.get('page')) || 6} setPage={n => choisir('pages', { page: String(n) })} />}
        {onglet === 'maison' && <Maison T={T} S={S} data={data} setData={setData} versPage={n => choisir('pages', { page: String(n) })} />}
        {onglet === 'frise' && <Frise T={T} S={S} data={data} setData={setData} versPage={n => choisir('pages', { page: String(n) })} />}
        {onglet === 'institutions' && <Institutions T={T} S={S} versPage={n => choisir('pages', { page: String(n) })} />}
        {onglet === 'situations' && <Situations T={T} S={S} data={data} setData={setData} versPage={n => choisir('pages', { page: String(n) })} />}
      </div>
      {immersion && <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#07090f', color: '#ffd166', display: 'grid', placeItems: 'center', fontFamily: grotesk, fontWeight: 800 }}>🎬 Immersion…</div>}><Immersion data={data} setData={setData} onFermer={() => setImmersion(false)} /></Suspense>}
      {message && <div role="status" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 1100, maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: 12, fontSize: 14, background: T.text, color: T.bg, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>{message}</div>}
    </div>
  )
}

// ---------- Mon plan : A (plan), B (leçon du jour), C (cartes), E (carte de maîtrise) ----------
function OngletPlan({ T, S, data, setData, espace, cartesMémo, afficher, versPage }) {
  const auj = aujourdhuiLocal()
  const [date, setDate] = useState(data.plan?.examen || '')
  const [leçon, setLeçon] = useState(null)
  const [calendrier, setCalendrier] = useState(false)
  const état = étatPlan(data, auj)
  const bilan = bilanMaîtrise(data, cartesMémo)
  const lancer = () => {
    const plan = créerPlan(date || null, auj)
    setData(d => ({ ...d, plan }))
    afficher(`🗺️ Plan créé : ${plan.calendrier.length} leçons${plan.examen ? `, ${plan.parJour > 1 ? `${plan.parJour} par jour` : 'une par jour'}, révisions les ${plan.réserve} derniers jours` : ', une par jour'}`)
  }
  const toutesLesCartes = async () => {
    try {
      const r = await ajouterCartesLivret(espace, PAGES_CONTENU.map(p => p.page))
      afficher(r.ajoutées ? `🧠 ${r.ajoutées} cartes ajoutées dans Mémoriser` : 'Toutes les cartes sont déjà dans Mémoriser')
    } catch (e) { afficher(`Cartes non ajoutées : ${e.message}`) }
  }
  const prochaine = état?.prochaine && LEÇONS.find(l => l.id === état.prochaine[0])

  return (
    <>
      {!data.plan && (
        <section style={{ ...S.carte, borderColor: T.accent }}>
          <h2 style={S.titre}>🗺️ Ton plan pour retenir tout le livret</h2>
          <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.55 }}>Le livret est découpé en <strong>{LEÇONS.length} leçons de 15 minutes</strong>. Chaque leçon se fait en 4 temps :</p>
          <ol style={{ margin: '0 0 14px 20px', padding: 0, fontSize: 15, lineHeight: 1.7 }}>
            <li><strong>🎬 Découvrir</strong> : les pages sont mises en scène.</li>
            <li><strong>🧠 Se rappeler</strong> : des questions, sans regarder.</li>
            <li><strong>🏠 Ancrer</strong> : tu ranges les idées dans ta maison de mémoire.</li>
            <li><strong>🗣️ Expliquer</strong> : 1 minute à voix haute, comme à l'entretien.</li>
          </ol>
          <p style={{ ...S.discret, marginBottom: 12 }}>À la fin de chaque leçon, ses cartes partent dans Mémoriser et reviennent à J+1, J+3, J+7, J+14 et J+30. La carte de maîtrise montre les {PAGES_CONTENU.length} pages à apprendre : l'objectif est que tout soit vert.</p>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>Date de ton examen civique ou de ton entretien (facultatif)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={date} min={auj} onChange={e => setDate(e.target.value)} aria-label="Date de l'examen" style={{ minHeight: 44, padding: '0 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 16, flex: '1 1 180px' }} />
            <button onClick={lancer} style={S.bouton(true)}>🚀 Créer mon plan</button>
          </div>
          <p style={{ ...S.discret, fontSize: 12.5, marginTop: 6 }}>Sans date : une leçon par jour.</p>
        </section>
      )}

      {data.plan && état && (
        <section style={{ ...S.carte, borderColor: T.accent }} aria-labelledby="t-jour">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <h2 id="t-jour" style={{ ...S.titre, margin: 0, flex: 1 }}>📅 Aujourd'hui</h2>
            <span style={{ fontFamily: grotesk, fontWeight: 800 }}>{état.faites}/{état.total} leçons</span>
            {état.joursAvant != null && <span style={{ fontFamily: grotesk, fontWeight: 800, color: état.joursAvant <= 14 ? T.danger : T.accent }}>{état.joursAvant > 0 ? `J-${état.joursAvant}` : état.joursAvant === 0 ? 'Jour J' : 'Examen passé'}</span>}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: T.surface2, marginBottom: 14 }} role="progressbar" aria-valuenow={Math.round((état.faites / état.total) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Leçons faites">
            <div style={{ width: `${(état.faites / état.total) * 100}%`, height: '100%', borderRadius: 4, background: T.accent }} />
          </div>
          {prochaine ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 44 }}>{prochaine.emoji}</span>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: 17.5, lineHeight: 1.3 }}>{prochaine.titre}</strong>
                <span style={S.discret}>Pages {prochaine.pages.join(', ')} · {état.duJour.length > 1 ? `${état.duJour.length} leçons à faire${état.enRetard ? ` dont ${état.enRetard} en retard` : ''}` : état.prochaine[1] > auj ? `prévue ${dateCourte(état.prochaine[1])} (tu peux avancer)` : 'leçon du jour'}</span>
              </div>
              <button onClick={() => setLeçon(prochaine)} style={{ ...S.bouton(true), minHeight: 52, fontSize: 16 }}>▶ Commencer (15 min)</button>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 16 }}>🎉 <strong>Toutes les leçons sont faites.</strong> Place aux révisions :</p>
              <ul style={{ margin: '0 0 0 18px', padding: 0, lineHeight: 1.7, fontSize: 15 }}>
                <li>tes cartes du livret dans <Link to={`/memoriser/${espace}`} style={{ color: T.accent }}>Mémoriser</Link> chaque jour ;</li>
                <li>les mises en situation et la visite à l'aveugle de ta maison ;</li>
                <li>les examens blancs de la <Link to={`/prepa/naturalisation/${espace}`} style={{ color: T.accent }}>Prépa naturalisation</Link>.</li>
              </ul>
            </div>
          )}
        </section>
      )}

      {/* E. Carte de maîtrise */}
      <section style={S.carte} aria-labelledby="t-maitrise">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h2 id="t-maitrise" style={{ ...S.titre, margin: 0, flex: 1 }}>🟩 Carte de maîtrise des {NB_PAGES} pages</h2>
          <strong style={{ fontFamily: grotesk }}>{Math.round(bilan.taux * 100)} %</strong>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10, fontSize: 12.5, color: T.textMuted }}>
          {NOMS_NIVEAU.map((n, k) => <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: COULEURS_NIVEAU[k] }} />{n} ({bilan.compte[k]})</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))', gap: 4 }}>
          {Array.from({ length: NB_PAGES }, (_, k) => k + 1).map(n => {
            const niv = niveauPage(n, data, cartesMémo)
            const p = PAGE.get(n)
            return (
              <button key={n} onClick={() => versPage(n)} title={`Page ${n}${p ? ` · ${p.titre}` : ''} · ${niv == null ? 'page de garde' : NOMS_NIVEAU[niv]}`} aria-label={`Page ${n}, ${niv == null ? 'page de garde' : NOMS_NIVEAU[niv]}`} style={{
                height: 34, borderRadius: 6, cursor: 'pointer', fontFamily: grotesk, fontSize: 11.5, fontWeight: 700,
                border: niv == null ? `1px dashed ${T.border}` : 'none', color: niv == null ? T.textMuted : '#fff',
                background: niv == null ? 'transparent' : COULEURS_NIVEAU[niv],
              }}>{n}</button>
            )
          })}
        </div>
        <p style={{ ...S.discret, fontSize: 12.5, marginTop: 8 }}>Vue = animée · Apprise = leçon faite avec au moins la moitié des réponses · Maîtrisée = toutes ses cartes au niveau 3 dans Mémoriser.</p>
      </section>

      {data.plan && (
        <section style={S.carte}>
          <button onClick={() => setCalendrier(c => !c)} aria-expanded={calendrier} style={{ ...S.titre, margin: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', width: '100%', alignItems: 'center' }}>🗓️ Toutes les leçons <span style={{ marginLeft: 'auto' }}>{calendrier ? '▲' : '▼'}</span></button>
          {calendrier && (
            <div style={{ marginTop: 10 }}>
              {data.plan.calendrier.map(([id, jour]) => {
                const l = LEÇONS.find(x => x.id === id)
                if (!l) return null
                const r = data.leçons[id]
                const retard = !r?.faite && jour < auj
                return (
                  <button key={id} onClick={() => setLeçon(l)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 4px', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, color: T.text, cursor: 'pointer' }}>
                    <span style={{ width: 26, textAlign: 'center', color: r?.faite ? '#22a55e' : retard ? T.danger : T.textMuted, fontWeight: 800 }}>{r?.faite ? '✓' : '○'}</span>
                    <span style={{ fontSize: 20 }}>{l.emoji}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5 }}>{l.titre}<span style={{ display: 'block', fontSize: 12, color: T.textMuted }}>p. {l.pages.join(', ')}{r?.total ? ` · ${r.bonnes}/${r.total} au rappel` : ''}</span></span>
                    <span style={{ fontSize: 12, color: retard ? T.danger : T.textMuted, flexShrink: 0 }}>{dateCourte(jour)}</span>
                  </button>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Nouvelle date d'examen" style={{ minHeight: 40, padding: '0 10px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 15 }} />
            <button onClick={lancer} style={S.bouton(false)}>↻ Recalculer le plan</button>
            <button onClick={toutesLesCartes} style={S.bouton(false)}>🧠 Toutes les cartes dans Mémoriser</button>
          </div>
        </section>
      )}

      {leçon && <Leçon leçon={leçon} setData={setData} espace={espace} afficher={afficher} onFermer={() => setLeçon(null)} />}
    </>
  )
}

// ---------- Pages animées : chaque page affichée, puis « Animer » ----------
function OngletPages({ T, S, data, setData, cartesMémo, page, setPage }) {
  const [anime, setAnime] = useState(false)
  const [film, setFilm] = useState(null)
  const ouvrirFilm = async k => setFilm(await chargerFilm(k))
  const [cinéma, setCinéma] = useState(null)
  const ouvrirCinéma = async () => { const m = await CINÉMAS[n](); setCinéma({ film: m.COURT_MÉTRAGE, personnages: m.PERSONNAGES }) }
  const n = Math.min(NB_PAGES, Math.max(1, page))
  const p = PAGE.get(n)
  const niv = niveauPage(n, data, cartesMémo)
  const thème = PARTIES[p?.partie ?? 0]
  const leçon = leçonDePage(n)
  const marquer = k => setData(d => ({ ...d, pages: { ...d.pages, [k]: { ...(d.pages[k] || {}), animée: aujourdhuiLocal() } } }))
  const parties = [...new Set(PAGES.map(x => x.partie))]
  return (
    <>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
        {parties.map(k => {
          const première = PAGES.find(x => x.partie === k)
          const active = p?.partie === k
          return <button key={k} onClick={() => setPage(première.page)} style={{ ...S.bouton(active), minHeight: 36, fontSize: 12.5, padding: '0 12px', borderRadius: 18, flexShrink: 0 }}>{PARTIES[k].emoji} {k === 0 ? 'Début' : k === 6 ? 'Annexes' : `Partie ${k}`}</button>
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setPage(n - 1)} disabled={n <= 1} aria-label="Page précédente" style={{ ...S.bouton(false), width: 46, padding: 0, opacity: n <= 1 ? 0.4 : 1 }}>‹</button>
        <label style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontFamily: grotesk, fontWeight: 700 }}>
          <span className="l26-masque-tel">Page</span>
          <select value={n} onChange={e => setPage(Number(e.target.value))} aria-label="Choisir la page" style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 320, minHeight: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 15, padding: '0 8px' }}>
            {Array.from({ length: NB_PAGES }, (_, k) => k + 1).map(k => <option key={k} value={k}>{k}{PAGE.get(k) ? ` · ${PAGE.get(k).titre}` : ''}</option>)}
          </select>
          <span style={{ flexShrink: 0 }}>/ {NB_PAGES}</span>
        </label>
        <button onClick={() => setPage(n + 1)} disabled={n >= NB_PAGES} aria-label="Page suivante" style={{ ...S.bouton(false), width: 46, padding: 0, opacity: n >= NB_PAGES ? 0.4 : 1 }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,.25)', background: '#fff' }}>
          <img src={imagePage(n)} alt={`Page ${n} du Livret du citoyen 2026${p ? ` : ${p.titre}` : ''}`} style={{ width: '100%', display: 'block' }} />
          {p?.type === 'contenu' && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}><button onClick={() => setAnime(true)} className="l26-halo" style={{ pointerEvents: 'auto', minHeight: 54, padding: '0 22px', borderRadius: 27, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${thème.a}, ${thème.b})`, color: '#fff', fontFamily: grotesk, fontWeight: 800, fontSize: 16.5, whiteSpace: 'nowrap' }}>▶ Animer la page</button>{PAGES_FILM.has(n) && <button onClick={() => ouvrirFilm(n)} style={{ pointerEvents: 'auto', marginLeft: 8, minHeight: 54, padding: '0 18px', borderRadius: 27, border: '2px solid #fff', cursor: 'pointer', background: '#111', color: '#fff', fontFamily: grotesk, fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,.35)' }}>🍿 Film</button>}</div>
          )}
        </div>
        <div>
          {p ? (
            <div style={S.carte}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 30 }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 17 }}>{p.titre}</strong>
                  <span style={{ fontSize: 12.5, color: T.textMuted }}>{PARTIES[p.partie].nom}{p.section && p.section !== '-' ? ` · ${p.section}` : ''}</span>
                </div>
              </div>
              {p.type === 'contenu' ? (
                <>
                  <p style={{ margin: '8px 0 10px', fontSize: 15, lineHeight: 1.55 }}>📌 {p.résumé}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px', fontSize: 13.5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: COULEURS_NIVEAU[niv] }} />{NOMS_NIVEAU[niv]}{data.pages[n]?.animée ? ` · animée le ${dateDe(data.pages[n].animée).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}</p>
                  <p style={{ ...S.discret, fontSize: 13 }}>{p.scènes.length} scènes : {[...new Set(p.scènes.map(s => s.type))].join(', ')}{leçon ? ` · leçon « ${leçon.titre} »` : ''}</p>
                  <button onClick={() => setAnime(true)} style={{ ...S.bouton(true), width: '100%', marginTop: 12 }}>▶ Animer la page</button>
                  {PAGES_FILM.has(n) && <button onClick={() => ouvrirFilm(n)} style={{ ...S.bouton(false), width: '100%', marginTop: 8, borderColor: T.text }}>🍿 Mode film : l'épisode de la page {n}</button>}
                  {CINÉMAS[n] && <button onClick={ouvrirCinéma} style={{ ...S.bouton(false), width: '100%', marginTop: 8, borderColor: '#ffd166', background: 'linear-gradient(135deg, #1b1630, #3a2a12)', color: '#ffd166' }}>🎞️ Expérience cinéma (prototype)</button>}
                </>
              ) : CINÉMAS[n] ? (
                <>
                  <p style={{ ...S.discret, margin: '8px 0 0' }}>📌 {p.résumé}</p>
                  <button onClick={ouvrirCinéma} style={{ ...S.bouton(false), width: '100%', marginTop: 10, borderColor: '#ffd166', background: 'linear-gradient(135deg, #1b1630, #3a2a12)', color: '#ffd166' }}>🎞️ Expérience cinéma (prototype)</button>
                </>
              ) : <p style={S.discret}>Page de garde (titre ou sommaire) : rien à animer.</p>}
            </div>
          ) : <p style={S.discret}>Contenu de cette page en préparation.</p>}
          <p style={{ ...S.discret, fontSize: 12.5 }}>Astuce : dans l'animation, « Page suivante » continue la lecture du livret page après page. Touche ⏸ pour lire à ton rythme et 🔊 pour la voix.</p>
        </div>
      </div>
      {cinéma && <Suspense fallback={null}><Cinéma film={cinéma.film} personnages={cinéma.personnages} onFermer={() => setCinéma(null)} onTerminé={(bonnes, total) => setData(d => ({ ...d, pages: { ...d.pages, [n]: { ...(d.pages[n] || {}), animée: d.pages[n]?.animée || aujourdhuiLocal(), cinéma: { date: aujourdhuiLocal(), bonnes, total } } } }))} /></Suspense>}
      {film && <Film film={film} onFermer={() => setFilm(null)} onVu={k => setData(d => ({ ...d, pages: { ...d.pages, [k]: { ...(d.pages[k] || {}), animée: d.pages[k]?.animée || aujourdhuiLocal(), film: aujourdhuiLocal() } } }))} />}
      {anime && p && <Théâtre pages={PAGES_CONTENU} départ={Math.max(0, PAGES_CONTENU.indexOf(p))} onFermer={() => setAnime(false)} onPageAnimée={k => { marquer(k); setPage(k) }} libelléFin="Fin du livret 🎉" />}
    </>
  )
}
