// Formation « Jenkins Basics » (contenu en anglais, comme « Learning Jenkins ») : deux heures pour
// comprendre Jenkins, l'installer et lancer ses premiers jobs et pipelines. Les captures, le code et les
// sorties réelles viennent du labo de la formation complète. La progression reste dans ce navigateur.
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import Blocs from '../components/jenkins/Blocs'
import { LAB } from '../lib/jenkins/plan'
import { PLAN_BASES, DURÉE_TOTALE, durée } from '../lib/jenkins/basics-plan'

const CLÉ = 'react-blocs-jenkins-basics'
const ROUGE = '#d24939'
const lireProgrès = () => { try { return JSON.parse(localStorage.getItem(CLÉ) || '{}') } catch { return {} } }
// Toutes les leçons sont dans un seul fichier, chargé à la première leçon ouverte.
const chargerContenu = () => import('../lib/jenkins/basics')

export default function JenkinsBasics() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [params, setParams] = useSearchParams()
  const vue = PLAN_BASES.some(l => l.id === params.get('vue')) ? params.get('vue') : 'plan'
  const [progrès, setProgrès] = useState(lireProgrès)
  const enregistrer = fn => setProgrès(p => { const n = fn(p); try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* stockage indisponible : la progression reste en mémoire */ } return n })
  const aller = id => { setParams(id === 'plan' ? {} : { vue: id }, { replace: false }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const faites = PLAN_BASES.filter(l => progrès.faites?.[l.id])
  const minutesFaites = faites.reduce((n, l) => n + l.durée, 0)
  const état = useMemo(() => ({
    cases: progrès.cases ?? {},
    meilleur: progrès.quiz ?? {},
    cocher: (id, i, n) => enregistrer(p => { const l = [...(p.cases?.[id] ?? Array(n).fill(false))]; l[i] = !l[i]; return { ...p, cases: { ...(p.cases ?? {}), [id]: l } } }),
    score: (id, bonnes, total) => enregistrer(p => ({ ...p, quiz: { ...(p.quiz ?? {}), [id]: Math.max(p.quiz?.[id] ?? 0, Math.round((bonnes / total) * 100)) } })),
  }), [progrès])
  const marquerFaite = id => enregistrer(p => ({ ...p, faites: { ...(p.faites ?? {}), [id]: p.faites?.[id] ? undefined : new Date().toISOString().slice(0, 10) } }))
  const [contenu, setContenu] = useState(null)
  const [échec, setÉchec] = useState(false)
  useEffect(() => {
    if (vue === 'plan' || contenu) return
    let actif = true
    chargerContenu()
      .then(m => { if (actif) setContenu(m.default) })
      .catch(() => { if (actif) setÉchec(true) })
    return () => { actif = false }
  }, [vue, contenu])
  const leçon = PLAN_BASES.find(l => l.id === vue)
  const i = PLAN_BASES.findIndex(l => l.id === vue)
  const blocs = leçon && contenu ? contenu[leçon.id] : null
  const sommaire = blocs ? blocs.filter(b => b.t === 'h') : []
  const autre = espace.endsWith('pro') ? espace.replace(/pro$/, 'perso') : espace.replace(/perso$/, 'pro')
  const S = {
    carte: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 },
    bouton: (plein = false) => ({ minHeight: 44, padding: '0 16px', borderRadius: 12, border: `1px solid ${plein ? T.accent : T.border}`, background: plein ? T.accent : T.surface, color: plein ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }),
  }

  return (
    <div lang="en" style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px', overflowWrap: 'anywhere' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <Link to={foyer.accueil} lang="fr" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
              {[espace.endsWith('pro') ? autre : espace, espace.endsWith('pro') ? espace : autre].map(e => (
                <Link key={e} to={`/jenkins-basics/${e}${vue !== 'plan' ? `?vue=${vue}` : ''}`} style={{ fontSize: 12, fontFamily: grotesk, fontWeight: 600, padding: '7px 12px', borderRadius: 6, textDecoration: 'none', background: e === espace ? T.accent : 'transparent', color: e === espace ? T.accentText : T.textMuted }}>{e.endsWith('pro') ? 'Pro' : 'Perso'}</Link>
              ))}
            </div>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Light theme' : 'Dark theme'} onClick={basculer} />
          </div>
        </div>

        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 4px', lineHeight: 1.1 }}>🚀 Jenkins Basics</h1>
        <p style={{ color: T.textMuted, fontSize: 14.5, margin: '0 0 12px', lineHeight: 1.55 }}>Two hours to understand Jenkins, install it with Docker and run your first jobs and pipelines — with real screenshots of Jenkins {LAB.jenkins} {LAB.ligne}.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.surface2 ?? T.surface }} role="progressbar" aria-valuenow={minutesFaites} aria-valuemin={0} aria-valuemax={DURÉE_TOTALE} aria-label="Minutes of the course completed"><div style={{ width: `${(minutesFaites / DURÉE_TOTALE) * 100}%`, height: '100%', borderRadius: 4, background: ROUGE, transition: 'width .4s' }} /></div>
          <span style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 13 }}>{faites.length}/{PLAN_BASES.length} · {durée(minutesFaites)} / {durée(DURÉE_TOTALE)}</span>
        </div>

        <nav aria-label="Lessons" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
          {[{ id: 'plan', court: '📋 Overview' }, ...PLAN_BASES].map(l => (
            <button key={l.id} type="button" onClick={() => aller(l.id)} aria-current={vue === l.id ? 'page' : undefined} aria-label={l.id === 'plan' ? 'Overview' : `${l.num}: ${l.titre}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, minHeight: 42, minWidth: 42, justifyContent: 'center', padding: '0 13px', borderRadius: 21, flexShrink: 0, cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 13.5,
              background: vue === l.id ? T.accent : T.surface, color: vue === l.id ? T.accentText : T.text, border: `1px solid ${vue === l.id ? T.accent : T.border}`,
            }}>{progrès.faites?.[l.id] ? '✓ ' : ''}{l.court}</button>
          ))}
        </nav>

        {vue === 'plan' && <Aperçu T={T} S={S} progrès={progrès} aller={aller} espace={espace} />}

        {leçon && (
          <article key={vue}>
            <header style={{ ...S.carte, borderTop: `4px solid ${ROUGE}` }}>
              <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 800, fontSize: 13, color: T.textMuted }}>{leçon.num} of {PLAN_BASES.length} · ⏱️ {durée(leçon.durée)}</p>
              <h2 style={{ fontFamily: grotesk, fontSize: 25, margin: '4px 0 6px' }}>{leçon.titre}</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: T.textMuted }}>{leçon.but}</p>
            </header>

            {!blocs ? (
              <div style={S.carte} role="status">
                {échec
                  ? <p style={{ margin: 0 }}>⚠️ The lesson could not be loaded. Check your connection and <button type="button" onClick={() => window.location.reload()} style={{ ...S.bouton(false), minHeight: 36 }}>reload the page</button>.</p>
                  : <p style={{ margin: 0, color: T.textMuted }}>⏳ Loading the lesson…</p>}
              </div>
            ) : (
              <>
                {sommaire.length > 1 && (
                  <details style={{ ...S.carte, padding: '10px 14px' }}>
                    <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 800 }}>📑 Contents ({sommaire.length} sections)</summary>
                    <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 2 }}>
                      {sommaire.map(h => <li key={h.id}><a href={`#${h.id}`} onClick={e => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }) }} style={{ color: T.text, fontSize: 14.5, textDecoration: 'none', display: 'block', padding: '5px 0' }}>{h.text}</a></li>)}
                    </ol>
                  </details>
                )}
                <div style={{ ...S.carte, padding: '6px 16px 16px' }}>
                  <Blocs blocs={blocs} T={T} état={état} />
                </div>
                <div style={{ ...S.carte, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => marquerFaite(leçon.id)} style={S.bouton(!progrès.faites?.[leçon.id])}>{progrès.faites?.[leçon.id] ? `✓ Done on ${progrès.faites[leçon.id]} (undo)` : '✓ Mark this lesson as done'}</button>
                  <span style={{ fontSize: 13.5, color: T.textMuted }}>Your progress, checklist and quiz score stay in this browser.</span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
              <button type="button" onClick={() => aller(i > 0 ? PLAN_BASES[i - 1].id : 'plan')} style={S.bouton(false)}>← {i > 0 ? PLAN_BASES[i - 1].num : 'Overview'}</button>
              {i < PLAN_BASES.length - 1
                ? <button type="button" onClick={() => aller(PLAN_BASES[i + 1].id)} style={S.bouton(true)}>{PLAN_BASES[i + 1].num} →</button>
                : <Link to={`/jenkins/${espace}`} style={{ ...S.bouton(true), display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Learning Jenkins →</Link>}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}

function Aperçu({ T, S, progrès, aller, espace }) {
  const suivante = PLAN_BASES.find(l => !progrès.faites?.[l.id]) ?? PLAN_BASES[0]
  return (
    <section aria-labelledby="apercu-titre">
      <div style={S.carte}>
        <h2 id="apercu-titre" style={{ fontFamily: grotesk, fontSize: 23, margin: '0 0 8px' }}>Overview</h2>
        <p style={{ margin: '0 0 10px', fontSize: 15.5, lineHeight: 1.65 }}>Nine short steps, <strong>{durée(DURÉE_TOTALE)} in all</strong>, for complete beginners. You install Jenkins on your own machine, then build a Freestyle job, a pipeline, test reports and a secret — each time by doing it, with the real screen next to you.</p>
        <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800 }}>What you need</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>
          <li>A computer with Docker (Docker Desktop on Windows and macOS) and about 4 GB of free memory.</li>
          <li>Port 8080 free, a terminal and a web browser.</li>
          <li>No previous knowledge of Jenkins. Basic shell commands help.</li>
        </ul>
        <button type="button" onClick={() => aller(suivante.id)} style={S.bouton(true)}>{progrès.faites?.[PLAN_BASES[0].id] ? `▶ Continue: ${suivante.num}` : '▶ Start the course'}</button>
        <aside style={{ margin: '14px 0 0', padding: '10px 12px', borderRadius: 12, borderLeft: '4px solid #2e9e6b', background: '#2e9e6b14', fontSize: 14.5, lineHeight: 1.6 }}>
          <strong>📸 Real screenshots.</strong> Every screen and console output comes from a real Jenkins, the one of the full course <Link to={`/jenkins/${espace}`} style={{ color: T.text }}>Learning Jenkins</Link> — which continues where this course stops (agents, Git, CI for Java/Node/Python, Docker…).
        </aside>
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {PLAN_BASES.map(l => (
          <li key={l.id} style={{ ...S.carte, marginBottom: 0, borderLeft: `4px solid ${progrès.faites?.[l.id] ? '#2e9e6b' : ROUGE}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: grotesk, fontWeight: 900, fontSize: 14, color: T.textMuted }}>{l.num}</span>
              <h3 style={{ margin: 0, fontFamily: grotesk, fontSize: 17.5 }}>{l.titre}</h3>
              <span style={{ fontSize: 12.5, color: T.textMuted }}>⏱️ {durée(l.durée)}</span>
            </div>
            <p style={{ margin: '6px 0 8px', fontSize: 14.5, lineHeight: 1.55, color: T.textMuted }}>{l.but}</p>
            <button type="button" onClick={() => aller(l.id)} style={{ ...S.bouton(!progrès.faites?.[l.id] && l.id === suivante.id), minHeight: 40 }}>{progrès.faites?.[l.id] ? '✓ Done · review' : '▶ Open'}</button>
          </li>
        ))}
      </ol>
    </section>
  )
}
