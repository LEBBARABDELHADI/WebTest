// Après l'épisode : frise du chapitre (indispensables / complémentaires),
// résumé en 5 phrases, 5 essentiels, mnémotechnique, 5 questions de
// compréhension (réponse écrite, vérifiée), puis quiz de 5 questions avec
// correction expliquée. 4 bonnes réponses sur 5 débloquent l'épisode suivant.
import { useEffect, useMemo, useRef, useState } from 'react'
import { hash } from '../../../lib/livret2026/outils'
import { SEUIL, motsTrouvés, verdictDe } from '../../../lib/livret2026/immersion/verification'
import { OR, SERIF } from '../../../lib/livret2026/immersion/immersionCss'
import { PageLivret } from './Lecteur'

const mélanger = (liste, graine) => [...liste].sort((a, b) => hash(`${graine}|${a}`) - hash(`${graine}|${b}`))

function Pastille({ n, onPage }) {
  return <button type="button" className="im-page" onClick={() => onPage(n)} aria-label={`Voir la page ${n} du livret`}>📖 p. {n}</button>
}

function Compréhension({ ep, onFini, déjà, onPage }) {
  const [états, setÉtats] = useState(() => ep.compréhension.map(() => ({ texte: '', verdict: déjà ? 'révélé' : null })))
  const changer = (i, v) => setÉtats(t => t.map((x, k) => (k === i ? { ...x, ...v } : x)))
  const traités = états.filter(x => x.verdict).length
  return (
    <>
      <p style={{ margin: '0 0 12px', opacity: 0.85, lineHeight: 1.5 }}>Réponds avec tes mots, puis vérifie. La réponse du livret s’affiche ensuite. Les 5 questions traitées ouvrent le quiz.</p>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
        {ep.compréhension.map((q, i) => {
          const é = états[i]
          const trouvés = é.verdict && é.verdict !== 'révélé' ? motsTrouvés(é.texte, q.clés) : null
          const manquants = trouvés ? q.clés.filter((_, k) => !trouvés[k]) : []
          return (
            <li key={i} className="im-carte" style={{ padding: 14 }}>
              <label htmlFor={`im-c-${ep.id}-${i}`} style={{ display: 'block', fontWeight: 800, fontSize: 16, lineHeight: 1.4, marginBottom: 8 }}>{i + 1}. {q.q}</label>
              <textarea id={`im-c-${ep.id}-${i}`} className="im-saisie" value={é.texte} disabled={!!é.verdict} onChange={e => changer(i, { texte: e.target.value })} placeholder="Ta réponse…" rows={2} />
              {!é.verdict && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="im-bouton im-plein" disabled={!é.texte.trim()} onClick={() => changer(i, { verdict: verdictDe(é.texte, q.clés) })}>Vérifier</button>
                  <button type="button" className="im-bouton" onClick={() => changer(i, { verdict: 'révélé' })}>Je ne sais pas</button>
                </div>
              )}
              {é.verdict && (
                <div className="im-monte" role="status" style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: é.verdict === 'bien' ? 'rgba(34,197,94,.14)' : é.verdict === 'presque' ? 'rgba(234,179,8,.14)' : 'rgba(148,163,184,.12)', border: `1px solid ${é.verdict === 'bien' ? '#22c55e' : é.verdict === 'presque' ? '#eab308' : 'rgba(148,163,184,.35)'}` }}>
                  <div style={{ fontWeight: 800 }}>{é.verdict === 'bien' ? '✅ Bonne réponse : tu as l’essentiel.' : é.verdict === 'presque' ? `🟡 Presque : pense à « ${manquants.join(' », « ')} ».` : é.verdict === 'non' ? '❌ Pas encore : compare avec la réponse du livret.' : '📖 Voici la réponse du livret.'}</div>
                  <div style={{ marginTop: 4, lineHeight: 1.45 }}><strong style={{ color: OR }}>Réponse :</strong> {q.r}</div>
                  {é.verdict !== 'bien' && <button type="button" className="im-bouton" style={{ marginTop: 8, minHeight: 38, fontSize: 13.5 }} onClick={() => changer(i, { verdict: null })}>↺ Réessayer</button>}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, opacity: 0.85 }}>Questions traitées : {traités} / {ep.compréhension.length}</div>
        <button type="button" className="im-bouton im-plein" disabled={traités < ep.compréhension.length} onClick={() => onFini(états.filter(x => x.verdict === 'bien').length)}>Passer au quiz →</button>
      </div>
      <div style={{ marginTop: 8 }}><Pastille n={ep.pages[0]} onPage={onPage} /></div>
    </>
  )
}

export function Quiz({ questions, graine, onFini, onPage, titre = 'Quiz' }) {
  const [essai, setEssai] = useState(0)
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState(null)
  const [réponses, setRéponses] = useState([])
  const q = questions[i]
  const options = useMemo(() => (q ? mélanger([q.r, ...q.f.map(f => f[0])], `${graine}-${i}-${essai}`) : []), [q, graine, i, essai])
  const fini = i >= questions.length // après la correction de la dernière question
  const bonnes = réponses.filter(r => r.bon).length
  const recommencer = () => { setEssai(e => e + 1); setI(0); setChoix(null); setRéponses([]) }
  const choisir = o => { if (choix != null) return; setChoix(o); setRéponses(r => [...r, { bon: o === q.r, choix: o }]) }
  if (fini) {
    return onFini({ bonnes, total: questions.length, réponses, recommencer })
  }
  const pourquoi = choix != null && choix !== q.r ? q.f.find(f => f[0] === choix)?.[1] : null
  return (
    <div className="im-carte" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="im-etiquette" style={{ color: OR, flex: 1 }}>🎯 {titre} · question {i + 1} / {questions.length}</div>
        <div aria-hidden="true" style={{ display: 'flex', gap: 4 }}>{questions.map((_, k) => <span key={k} style={{ width: 9, height: 9, borderRadius: 5, background: k < réponses.length ? (réponses[k].bon ? '#22c55e' : '#ef4444') : k === i ? '#fff' : 'rgba(255,255,255,.25)' }} />)}</div>
      </div>
      <h3 style={{ fontFamily: SERIF, fontSize: 'clamp(19px, 2.6vw, 24px)', margin: '0 0 12px', lineHeight: 1.3 }}>{q.q}</h3>
      <div style={{ display: 'grid', gap: 8 }} role="group" aria-label="Choix de réponse">
        {options.map(o => {
          const montré = choix != null
          const bon = o === q.r, choisi = o === choix
          return (
            <button key={o} type="button" className="im-option" disabled={montré} onClick={() => choisir(o)}
              style={montré ? { borderColor: bon ? '#22c55e' : choisi ? '#ef4444' : 'rgba(255,255,255,.12)', background: bon ? 'rgba(34,197,94,.16)' : choisi ? 'rgba(239,68,68,.16)' : 'transparent', opacity: bon || choisi ? 1 : 0.55 } : undefined}>
              {montré && (bon ? '✅ ' : choisi ? '❌ ' : '')}{o}
            </button>
          )
        })}
      </div>
      {choix != null && (
        <div className="im-monte" role="status" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.06)', lineHeight: 1.5 }}>
          {choix === q.r
            ? <><strong style={{ color: '#4ade80' }}>Exact.</strong> {q.explication}</>
            : <><strong style={{ color: '#f87171' }}>Ce n’est pas ça.</strong> {pourquoi} <br /><strong style={{ color: OR }}>La bonne réponse :</strong> {q.r}. {q.explication}</>}
          {' '}<Pastille n={q.p} onPage={onPage} />
          <div style={{ marginTop: 10, textAlign: 'right' }}>
            <button type="button" className="im-bouton im-plein" onClick={() => { setChoix(null); setI(x => x + 1) }}>{i + 1 < questions.length ? 'Question suivante →' : 'Voir mon score'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

const ÉTAPES = [['frise', '🗓️', 'Frise'], ['resume', '📝', 'Résumé'], ['comprehension', '❓', 'Compréhension'], ['quiz', '🎯', 'Quiz']]

export default function Etude({ ep, n, suivi, suivant, onCompris, onQuiz, onSuivant, onRevoir, onSommaire }) {
  const [étape, setÉtape] = useState('frise')
  const [pageVue, setPageVue] = useState(null)
  const défile = useRef(null)
  const compris = !!suivi?.compris || !!suivi?.validé
  const k = ÉTAPES.findIndex(e => e[0] === étape)
  const aller = id => { setÉtape(id); défile.current?.scrollTo?.({ top: 0 }) }
  const suite = ÉTAPES[k + 1]
  return (
    <div ref={défile} className="im-defile" style={{ position: 'relative' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '14px 14px 40px' }}>
        <div className="im-etiquette" style={{ color: OR }}>Épisode {n} · après le film</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4.4vw, 38px)', margin: '4px 0 2px', lineHeight: 1.1 }}>{ep.titre}</h2>
        <div style={{ opacity: 0.8, marginBottom: 12 }}>{ep.période} · {suivi?.validé ? '✅ chapitre validé' : 'à valider : 4 bonnes réponses sur 5 au quiz'}</div>
        <nav aria-label="Étapes de l’étude" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12, scrollbarWidth: 'none' }}>
          {ÉTAPES.map(([id, e, nom], i) => {
            const fermé = id === 'quiz' && !compris
            return <button key={id} type="button" className="im-puce" aria-pressed={étape === id} disabled={fermé} onClick={() => aller(id)} style={{ opacity: fermé ? 0.5 : 1 }} title={fermé ? 'Réponds d’abord aux 5 questions de compréhension' : undefined}>{fermé ? '🔒' : e} {i + 1}. {nom}</button>
          })}
        </nav>

        {étape === 'frise' && (
          <div className="im-carte im-monte">
            <div className="im-etiquette" style={{ color: OR }}>🗓️ La frise du chapitre</div>
            <div style={{ display: 'flex', gap: 14, fontSize: 13, opacity: 0.85, margin: '6px 0 10px', flexWrap: 'wrap' }}><span><span style={{ color: OR }}>★</span> indispensable : à connaître par cœur</span><span><span style={{ color: '#94a3b8' }}>○</span> complémentaire : pour comprendre</span></div>
            <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 14px', borderLeft: `2px solid ${ep.couleur}`, display: 'grid', gap: 10 }}>
              {ep.frise.map((f, i) => (
                <li key={i} style={{ position: 'relative', paddingLeft: 10 }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: -23, top: 3, width: 16, height: 16, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 10, background: f.essentiel ? OR : '#1f2937', color: f.essentiel ? '#111' : '#94a3b8', border: `2px solid ${f.essentiel ? OR : '#475569'}` }}>{f.essentiel ? '★' : ''}</span>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: f.essentiel ? 18 : 16, color: f.essentiel ? '#fff' : '#cbd5e1' }}>{f.date} <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: f.essentiel ? OR : '#94a3b8', textTransform: 'uppercase', marginLeft: 6 }}>{f.essentiel ? 'indispensable' : 'complémentaire'}</span></div>
                  <div style={{ lineHeight: 1.4, opacity: f.essentiel ? 1 : 0.8 }}>{f.texte}</div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {étape === 'resume' && (
          <div style={{ display: 'grid', gap: 12 }} className="im-monte">
            <div className="im-carte">
              <div className="im-etiquette" style={{ color: OR }}>📝 Le chapitre en 5 phrases</div>
              <ol style={{ margin: '8px 0 0', paddingLeft: 22, display: 'grid', gap: 6, lineHeight: 1.5 }}>{ep.résumé.map((t, i) => <li key={i}>{t}</li>)}</ol>
            </div>
            <div className="im-carte">
              <div className="im-etiquette" style={{ color: OR }}>🔑 Les 5 éléments essentiels</div>
              <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>{ep.essentiels.map((t, i) => <li key={i} style={{ padding: '7px 11px', borderRadius: 12, border: `1px solid ${ep.couleur}`, background: `${ep.couleur}22`, lineHeight: 1.35 }}>{t}</li>)}</ul>
            </div>
            <div className="im-carte" style={{ borderColor: 'rgba(255,209,102,.45)' }}>
              <div className="im-etiquette" style={{ color: OR }}>🧠 Pour retenir</div>
              <p style={{ margin: '8px 0 0', fontFamily: SERIF, fontSize: 18, lineHeight: 1.45 }}>{ep.mnémo}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ opacity: 0.8, fontSize: 13.5 }}>D’après le livret :</span>{ep.pages.map(p => <Pastille key={p} n={p} onPage={setPageVue} />)}</div>
          </div>
        )}

        {étape === 'comprehension' && <Compréhension ep={ep} déjà={compris} onPage={setPageVue} onFini={bien => { onCompris(bien); aller('quiz') }} />}

        {étape === 'quiz' && (
          <Quiz questions={ep.quiz} graine={ep.id} onPage={setPageVue} onFini={({ bonnes, total, réponses, recommencer }) => (
            <ScoreQuiz ep={ep} bonnes={bonnes} total={total} réponses={réponses} recommencer={recommencer} suivant={suivant} onQuiz={onQuiz} onSuivant={onSuivant} onRevoir={onRevoir} onSommaire={onSommaire} />
          )} />
        )}

        {étape !== 'quiz' && étape !== 'comprehension' && suite && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button type="button" className="im-bouton" onClick={onRevoir}>🎬 Revoir l’épisode</button>
            <button type="button" className="im-bouton im-plein" onClick={() => aller(suite[0])}>{suite[1]} {suite[2]} →</button>
          </div>
        )}
      </div>
      {pageVue && <div style={{ position: 'fixed', inset: 0, zIndex: 1001 }}><PageLivret n={pageVue} onFermer={() => setPageVue(null)} /></div>}
    </div>
  )
}

// Score du quiz, enregistré une fois, et la suite (débloquée à 4/5).
function ScoreQuiz({ ep, bonnes, total, réponses, recommencer, suivant, onQuiz, onSuivant, onRevoir, onSommaire }) {
  useEffect(() => { onQuiz(bonnes, total) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const réussi = bonnes >= SEUIL
  const ratées = ep.quiz.map((q, i) => [q, réponses[i]]).filter(([, r]) => !r?.bon)
  return (
    <div className="im-carte im-monte" style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 46 }} aria-hidden="true">{réussi ? '🏆' : '📚'}</div>
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: 800, color: réussi ? OR : '#fff', lineHeight: 1 }}>{bonnes} / {total}</div>
      <p style={{ fontSize: 17, lineHeight: 1.5, margin: '10px auto 14px', maxWidth: 520 }}>{réussi ? (suivant ? '✅ Chapitre validé ! L’épisode suivant est débloqué.' : '✅ Chapitre validé ! Tu as terminé toute la série.') : `Il faut ${SEUIL} bonnes réponses sur ${total} pour passer à la suite. Revois ces points, puis retente le quiz.`}</p>
      {!réussi && ratées.length > 0 && (
        <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 auto 14px', maxWidth: 560, display: 'grid', gap: 8 }}>
          {ratées.map(([q]) => <li key={q.q} style={{ padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,.05)', lineHeight: 1.45 }}><strong>{q.q}</strong><br /><span style={{ color: OR }}>→ {q.r}</span> <span style={{ opacity: 0.8 }}>(p. {q.p})</span></li>)}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {réussi && suivant && <button type="button" className="im-bouton im-plein" onClick={onSuivant}>▶ Épisode suivant : {suivant.titre}</button>}
        {!réussi && <button type="button" className="im-bouton im-plein" onClick={recommencer}>↺ Retenter le quiz</button>}
        <button type="button" className="im-bouton" onClick={onRevoir}>🎬 Revoir l’épisode</button>
        <button type="button" className="im-bouton" onClick={onSommaire}>☰ Sommaire</button>
      </div>
    </div>
  )
}
