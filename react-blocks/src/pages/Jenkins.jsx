// Formation « Learning Jenkins » (contenu en anglais) : plan des 13 modules, Lab 0 (Jenkins en local)
// et modules rédigés un par un, avec de vraies captures de Jenkins, des TP corrigés, des quiz et des
// checklists. La progression est gardée dans ce navigateur.
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import Blocs from '../components/jenkins/Blocs'
import { PLAN, NIVEAUX, LAB, STRUCTURE } from '../lib/jenkins/plan'

// Chaque module est un fichier chargé à la demande : la page reste légère même avec 14 modules.
const CHARGEURS = {
  lab0: () => import('../lib/jenkins/lab0'),
  m1: () => import('../lib/jenkins/module1'),
  m2: () => import('../lib/jenkins/module2'),
  m3: () => import('../lib/jenkins/module3'),
  m4: () => import('../lib/jenkins/module4'),
  m5: () => import('../lib/jenkins/module5'),
  m6: () => import('../lib/jenkins/module6'),
  m7: () => import('../lib/jenkins/module7'),
}
const CLÉ = 'react-blocs-jenkins'
const ROUGE = '#d24939'
const lireProgrès = () => { try { return JSON.parse(localStorage.getItem(CLÉ) || '{}') } catch { return {} } }

export default function Jenkins() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [params, setParams] = useSearchParams()
  const vue = PLAN.some(m => m.id === params.get('vue')) ? params.get('vue') : 'plan'
  const [progrès, setProgrès] = useState(lireProgrès)
  const enregistrer = fn => setProgrès(p => { const n = fn(p); try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* stockage indisponible : la progression reste en mémoire */ } return n })
  const aller = id => { setParams(id === 'plan' ? {} : { vue: id }, { replace: false }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const disponibles = PLAN.filter(m => m.disponible)
  const faits = disponibles.filter(m => progrès.faits?.[m.id]).length
  const état = useMemo(() => ({
    cases: progrès.cases ?? {},
    meilleur: progrès.quiz ?? {},
    cocher: (id, i, n) => enregistrer(p => { const l = [...(p.cases?.[id] ?? Array(n).fill(false))]; l[i] = !l[i]; return { ...p, cases: { ...(p.cases ?? {}), [id]: l } } }),
    score: (id, bonnes, total) => enregistrer(p => ({ ...p, quiz: { ...(p.quiz ?? {}), [id]: Math.max(p.quiz?.[id] ?? 0, Math.round((bonnes / total) * 100)) } })),
  }), [progrès])
  const module = PLAN.find(m => m.id === vue)
  const iModule = PLAN.findIndex(m => m.id === vue)
  const autre = espace.endsWith('pro') ? espace.replace(/pro$/, 'perso') : espace.replace(/perso$/, 'pro')
  const S = {
    carte: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 },
    bouton: (plein = false) => ({ minHeight: 44, padding: '0 16px', borderRadius: 12, border: `1px solid ${plein ? T.accent : T.border}`, background: plein ? T.accent : T.surface, color: plein ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }),
  }
  const marquerFait = id => enregistrer(p => ({ ...p, faits: { ...(p.faits ?? {}), [id]: p.faits?.[id] ? undefined : new Date().toISOString().slice(0, 10) } }))
  const [contenus, setContenus] = useState({})
  const [échec, setÉchec] = useState(null)
  const contenu = contenus[vue]
  useEffect(() => {
    if (!CHARGEURS[vue] || contenus[vue]) return
    let actif = true
    CHARGEURS[vue]()
      .then(m => { if (actif) setContenus(c => ({ ...c, [vue]: m.default })) })
      .catch(() => { if (actif) setÉchec(vue) })
    return () => { actif = false }
  }, [vue, contenus])
  const sommaire = module?.disponible && contenu ? contenu.filter(b => b.t === 'h') : []

  return (
    <div lang="en" style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px', overflowWrap: 'anywhere' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <Link to={foyer.accueil} lang="fr" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
              {[espace.endsWith('pro') ? autre : espace, espace.endsWith('pro') ? espace : autre].map(e => (
                <Link key={e} to={`/jenkins/${e}${vue !== 'plan' ? `?vue=${vue}` : ''}`} style={{ fontSize: 12, fontFamily: grotesk, fontWeight: 600, padding: '7px 12px', borderRadius: 6, textDecoration: 'none', background: e === espace ? T.accent : 'transparent', color: e === espace ? T.accentText : T.textMuted }}>{e.endsWith('pro') ? 'Pro' : 'Perso'}</Link>
              ))}
            </div>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Light theme' : 'Dark theme'} onClick={basculer} />
          </div>
        </div>

        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 4px', lineHeight: 1.1 }}>🤵 Learning Jenkins</h1>
        <p style={{ color: T.textMuted, fontSize: 14.5, margin: '0 0 12px', lineHeight: 1.55 }}>From beginner to DevOps expert: a real Jenkins {LAB.jenkins} {LAB.ligne} on your machine, real screenshots, step-by-step labs with solutions, quizzes and checklists.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.surface2 ?? T.surface }} role="progressbar" aria-valuenow={faits} aria-valuemin={0} aria-valuemax={disponibles.length} aria-label="Modules completed"><div style={{ width: `${(faits / disponibles.length) * 100}%`, height: '100%', borderRadius: 4, background: ROUGE, transition: 'width .4s' }} /></div>
          <span style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 13 }}>{faits}/{disponibles.length} available · {PLAN.length} planned</span>
        </div>

        <nav aria-label="Course modules" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
          {[{ id: 'plan', num: '📋', titre: 'Course plan', disponible: true }, ...PLAN].map(m => (
            <button key={m.id} type="button" onClick={() => aller(m.id)} aria-current={vue === m.id ? 'page' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 6, minHeight: 42, padding: '0 13px', borderRadius: 21, flexShrink: 0, cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 13.5,
              background: vue === m.id ? T.accent : T.surface, color: vue === m.id ? T.accentText : m.disponible ? T.text : T.textMuted, border: `1px solid ${vue === m.id ? T.accent : T.border}`, opacity: m.disponible || vue === m.id ? 1 : 0.75,
            }}>{progrès.faits?.[m.id] ? '✓ ' : ''}{m.id === 'plan' ? `${m.num} ${m.titre}` : `${m.num}${m.disponible ? '' : ' 🔜'}`}</button>
          ))}
        </nav>

        {vue === 'plan' && <Plan T={T} S={S} progrès={progrès} aller={aller} />}

        {module && (
          <article key={vue}>
            <header style={{ ...S.carte, borderTop: `4px solid ${ROUGE}` }}>
              <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 800, fontSize: 13, color: T.textMuted }}>{module.num} · <span style={{ color: NIVEAUX[module.niveau].couleur }}>{NIVEAUX[module.niveau].nom}</span> · ⏱️ {module.durée}</p>
              <h2 style={{ fontFamily: grotesk, fontSize: 25, margin: '4px 0 6px' }}>{module.titre}</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: T.textMuted }}>{module.résumé}</p>
            </header>

            {module.disponible && !contenu ? (
              <div style={S.carte} role="status">
                {échec === vue
                  ? <p style={{ margin: 0 }}>⚠️ The module could not be loaded. Check your connection and <button type="button" onClick={() => window.location.reload()} style={{ ...S.bouton(false), minHeight: 36 }}>reload the page</button>.</p>
                  : <p style={{ margin: 0, color: T.textMuted }}>⏳ Loading the module…</p>}
              </div>
            ) : module.disponible ? (
              <>
                <details style={{ ...S.carte, padding: '10px 14px' }}>
                  <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 800 }}>📑 Contents ({sommaire.length} sections)</summary>
                  <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 2 }}>
                    {sommaire.map(h => <li key={h.id}><a href={`#${h.id}`} onClick={e => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }) }} style={{ color: T.text, fontSize: 14.5, textDecoration: 'none', display: 'block', padding: '5px 0' }}>{h.text}</a></li>)}
                  </ol>
                </details>
                <div style={{ ...S.carte, padding: '6px 16px 16px' }}>
                  <Blocs blocs={contenu} T={T} état={état} />
                </div>
                <div style={{ ...S.carte, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => marquerFait(vue)} style={S.bouton(!progrès.faits?.[vue])}>{progrès.faits?.[vue] ? `✓ Completed on ${progrès.faits[vue]} (undo)` : '✓ Mark this module as completed'}</button>
                  <span style={{ fontSize: 13.5, color: T.textMuted }}>Your progress, checklists and quiz scores stay in this browser.</span>
                </div>
              </>
            ) : (
              <div style={S.carte}>
                <p style={{ margin: '0 0 8px', fontFamily: grotesk, fontWeight: 800, fontSize: 16 }}>🔜 Coming next</p>
                <p style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.6 }}>This module is developed after the previous ones, with the same structure: objectives, concepts, diagrams, real screenshots, commands, labs with solutions, common errors and a recap. Here is its outline.</p>
                <Liste titre="🎯 Objectives" items={module.objectifs} />
                <Liste titre="📚 Topics" items={module.sujets} />
                <Liste titre="🧪 Labs" items={module.tp} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
              <button type="button" onClick={() => aller(iModule > 0 ? PLAN[iModule - 1].id : 'plan')} style={S.bouton(false)}>← {iModule > 0 ? PLAN[iModule - 1].num : 'Course plan'}</button>
              {iModule < PLAN.length - 1 && <button type="button" onClick={() => aller(PLAN[iModule + 1].id)} style={S.bouton(true)}>{PLAN[iModule + 1].num} →</button>}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}

function Liste({ titre, items }) {
  return (
    <>
      <p style={{ margin: '10px 0 4px', fontFamily: grotesk, fontWeight: 800 }}>{titre}</p>
      <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>{items.map(x => <li key={x}>{x}</li>)}</ul>
    </>
  )
}

function Plan({ T, S, progrès, aller }) {
  return (
    <section aria-labelledby="plan-titre">
      <div style={S.carte}>
        <h2 id="plan-titre" style={{ fontFamily: grotesk, fontSize: 23, margin: '0 0 8px' }}>Course plan</h2>
        <p style={{ margin: '0 0 10px', fontSize: 15.5, lineHeight: 1.65 }}>Thirteen progressive modules take you from "what is Jenkins?" to an enterprise CI/CD chain <strong>GitHub/GitLab → Jenkins → Maven → SonarQube → Docker → Nexus → Kubernetes → Ansible</strong>. Every notion is explained before it is used, every lab is reproducible on your machine, and the examples are consistent from one module to the next: they all start from the Jenkins of <strong>Lab 0</strong>.</p>
        <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800 }}>Each module contains</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: 22, fontSize: 15, lineHeight: 1.6, columns: '2 260px' }}>{STRUCTURE.map(x => <li key={x}>{x}</li>)}</ul>
        <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800 }}>The lab environment of the screenshots</p>
        <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
            <tbody>
              {[['Jenkins', `${LAB.jenkins} (${LAB.ligne})`], ['Docker image', LAB.image], ['Java', LAB.java], ['Container OS', LAB.os], ['Tools', `${LAB.docker}, ${LAB.compose}`], ['Captured on', LAB.date]].map(([k, v], i) => (
                <tr key={k} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}><th style={{ textAlign: 'left', padding: '7px 10px', fontFamily: grotesk, fontWeight: 700, width: 140, background: T.surface }}>{k}</th><td style={{ padding: '7px 10px', fontFamily: k === 'Docker image' ? 'ui-monospace, monospace' : undefined }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside style={{ margin: '12px 0 0', padding: '10px 12px', borderRadius: 12, borderLeft: '4px solid #2e9e6b', background: '#2e9e6b14', fontSize: 14.5, lineHeight: 1.6 }}>
          <strong>📸 About the screenshots.</strong> Screenshots marked <em>Real screenshot</em> were taken from this real Jenkins while following the labs exactly as written; only the numbered markers are added. Drawings are labelled <em>Diagram</em> and are never presented as Jenkins screens. Command outputs are real too; IDs, times and passwords differ on your machine.
        </aside>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {PLAN.map(m => (
          <div key={m.id} style={{ ...S.carte, marginBottom: 0, borderLeft: `4px solid ${m.disponible ? ROUGE : T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: grotesk, fontWeight: 900, fontSize: 14, color: T.textMuted }}>{m.num}</span>
              <h3 style={{ margin: 0, fontFamily: grotesk, fontSize: 17.5 }}>{m.titre}</h3>
              <span style={{ fontSize: 12, fontWeight: 800, color: NIVEAUX[m.niveau].couleur, border: `1px solid ${NIVEAUX[m.niveau].couleur}66`, borderRadius: 999, padding: '1px 8px' }}>{NIVEAUX[m.niveau].nom}</span>
              <span style={{ fontSize: 12.5, color: T.textMuted }}>⏱️ {m.durée}</span>
            </div>
            <p style={{ margin: '6px 0', fontSize: 14.5, lineHeight: 1.55, color: T.textMuted }}>{m.résumé}</p>
            <p style={{ margin: '0 0 8px', fontSize: 13.5, lineHeight: 1.5 }}><strong>Labs:</strong> {m.tp.join(' · ')}</p>
            <button type="button" onClick={() => aller(m.id)} style={{ ...S.bouton(m.disponible && !progrès.faits?.[m.id]), minHeight: 40 }}>{progrès.faits?.[m.id] ? '✓ Completed · review' : m.disponible ? (m.id === 'lab0' ? '▶ Start here' : '▶ Open the module') : '🔜 See the outline'}</button>
          </div>
        ))}
      </div>
    </section>
  )
}
