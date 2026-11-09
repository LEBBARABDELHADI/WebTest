// Préparer l'examen civique 2026 : séries de 10 questions du type examen, par
// thème, avec la réponse exacte du livret et sa page. Uniquement le livret :
// questions des pages, quiz et questions de compréhension des épisodes.
import { useMemo, useState } from 'react'
import { PageLivret } from './Lecteur'
import { PAGES } from '../../../lib/livret2026'
import { ÉPISODES, GÉO } from '../../../lib/livret2026/immersion/histoire'
import { OR, SERIF } from '../../../lib/livret2026/immersion/immersionCss'

const DE_PAGES = filtre => PAGES.filter(filtre).flatMap(p => (p.questions || []).map(q => ({ q: q.q, r: q.r, p: p.page })))
const THÈMES = [
  { id: 'valeurs', emoji: '🇫🇷', nom: 'Principes, valeurs et symboles', questions: () => DE_PAGES(p => p.partie === 1) },
  { id: 'institutions', emoji: '🏛️', nom: 'Institutions', questions: () => DE_PAGES(p => p.partie === 2) },
  { id: 'droits', emoji: '⚖️', nom: 'Droits et devoirs', questions: () => DE_PAGES(p => p.partie === 3) },
  { id: 'histoire', emoji: '📜', nom: 'Histoire (épisodes)', questions: () => [...DE_PAGES(p => p.page >= 38 && p.page <= 48), ...ÉPISODES.flatMap(e => [...e.quiz.map(q => ({ q: q.q, r: q.r, p: q.p, plus: q.explication })), ...e.compréhension.map(q => ({ q: q.q, r: q.r, p: e.pages[0] }))])] },
  { id: 'geographie', emoji: '🗺️', nom: 'Géographie', questions: () => [...DE_PAGES(p => p.page >= 49 && p.page <= 52), ...GÉO.quiz.map(q => ({ q: q.q, r: q.r, p: q.p, plus: q.explication }))] },
  { id: 'culture', emoji: '🎭', nom: 'Culture et patrimoine', questions: () => DE_PAGES(p => p.page >= 53 && p.page <= 60) },
  { id: 'societe', emoji: '🏡', nom: 'Vivre en France', questions: () => DE_PAGES(p => p.partie === 5) },
]
const TAILLE = 10

export default function Examen({ suivi = {}, onSérie, onRetour }) {
  const banque = useMemo(() => Object.fromEntries(THÈMES.map(t => {
    const vues = new Set()
    return [t.id, t.questions().filter(q => { const k = q.q.trim().toLowerCase(); if (vues.has(k)) return false; vues.add(k); return true })]
  })), [])
  const [série, setSérie] = useState(null) // { thème, questions, i, montré, sues: [], àRevoir: [] }
  const [pageVue, setPageVue] = useState(null)

  const lancer = id => {
    const toutes = id === 'tout' ? Object.values(banque).flat() : banque[id]
    const tirées = [...toutes].map(q => [Math.random(), q]).sort((a, b) => a[0] - b[0]).slice(0, TAILLE).map(x => x[1])
    setSérie({ thème: id, questions: tirées, i: 0, montré: false, sues: [], àRevoir: [] })
  }
  const noter = su => {
    const s = série, q = s.questions[s.i]
    const n = { ...s, i: s.i + 1, montré: false, sues: su ? [...s.sues, q] : s.sues, àRevoir: su ? s.àRevoir : [...s.àRevoir, q] }
    setSérie(n)
    if (n.i >= n.questions.length) onSérie(s.thème, n.sues.length, n.questions.length)
  }
  const nomThème = id => (id === 'tout' ? '🎲 Tous les thèmes' : (t => `${t.emoji} ${t.nom}`)(THÈMES.find(t => t.id === id)))

  let contenu
  if (!série) {
    contenu = (
      <>
        <p style={{ margin: '0 0 12px', lineHeight: 1.5, opacity: 0.88 }}>Des séries de {TAILLE} questions du type examen. Réfléchis, puis affiche la <strong>réponse exacte du livret</strong> (avec sa page) et dis honnêtement si tu la savais.</p>
        <div className="im-carte" style={{ marginBottom: 12, borderColor: 'rgba(255,209,102,.4)' }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>📕 Uniquement le livret</div>
          <div style={{ lineHeight: 1.5, fontSize: 14.5, opacity: 0.9 }}>Toutes les réponses viennent du Livret du citoyen 2026 : ce qu’il dit explicitement, page citée. Aucun complément culturel extérieur n’est ajouté.</div>
        </div>
        <div className="im-grille">
          {[...THÈMES.map(t => t.id), 'tout'].map(id => {
            const r = suivi[id]
            const n = id === 'tout' ? Object.values(banque).flat().length : banque[id].length
            return (
              <button key={id} type="button" className="im-episode" onClick={() => lancer(id)} style={{ minHeight: 92, background: 'linear-gradient(160deg, #1b2236, #0d111c)' }}>
                <div style={{ fontWeight: 800, fontSize: 16.5 }}>{nomThème(id)}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{n} questions</div>
                {r && <div style={{ fontSize: 13, color: OR, marginTop: 'auto' }}>Dernière série : {r.sues} / {r.total}</div>}
              </button>
            )
          })}
        </div>
      </>
    )
  } else if (série.i >= série.questions.length) {
    contenu = (
      <div className="im-carte im-monte" style={{ padding: 18 }}>
        <div className="im-etiquette" style={{ color: OR }}>{nomThème(série.thème)}</div>
        <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 800, color: série.sues.length >= 8 ? OR : '#fff' }}>{série.sues.length} / {série.questions.length}</div>
        <p style={{ margin: '4px 0 12px', lineHeight: 1.5 }}>{série.sues.length >= 8 ? '✅ Très bien : tu es prêt pour ce thème.' : 'Revois les réponses ci-dessous, puis fais une nouvelle série.'}</p>
        {série.àRevoir.length > 0 && (
          <>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>🔁 À revoir</div>
            <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, display: 'grid', gap: 8 }}>
              {série.àRevoir.map(q => <li key={q.q} style={{ padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,.05)', lineHeight: 1.45 }}><strong>{q.q}</strong><br /><span style={{ color: OR }}>→ {q.r}</span> <button type="button" className="im-page" onClick={() => setPageVue(q.p)}>📖 p. {q.p}</button></li>)}
            </ul>
          </>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="im-bouton im-plein" onClick={() => lancer(série.thème)}>↺ Nouvelle série</button>
          <button type="button" className="im-bouton" onClick={() => setSérie(null)}>Changer de thème</button>
        </div>
      </div>
    )
  } else {
    const q = série.questions[série.i]
    contenu = (
      <div className="im-carte im-monte" key={série.i} style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="im-etiquette" style={{ color: OR, flex: 1 }}>{nomThème(série.thème)} · {série.i + 1} / {série.questions.length}</div>
          <button type="button" className="im-page" onClick={() => setSérie(null)}>✕ Arrêter</button>
        </div>
        <h3 style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 2.8vw, 26px)', margin: '0 0 14px', lineHeight: 1.3 }}>{q.q}</h3>
        {!série.montré ? (
          <button type="button" className="im-bouton im-plein" onClick={() => setSérie(s => ({ ...s, montré: true }))}>Voir la réponse exacte</button>
        ) : (
          <>
            <div className="im-monte" style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${OR}`, background: 'rgba(255,209,102,.08)', lineHeight: 1.5, fontSize: 16.5 }}>
              <div className="im-etiquette" style={{ color: OR, marginBottom: 4 }}>Réponse du livret</div>
              {q.r}{q.plus && q.plus !== q.r && <div style={{ marginTop: 6, fontSize: 14.5, opacity: 0.85 }}>{q.plus}</div>}
              <div style={{ marginTop: 8 }}><button type="button" className="im-page" onClick={() => setPageVue(q.p)}>📖 Page {q.p} du livret</button></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button type="button" className="im-bouton" style={{ borderColor: '#22c55e' }} onClick={() => noter(true)}>✅ Je savais</button>
              <button type="button" className="im-bouton" style={{ borderColor: '#f59e0b' }} onClick={() => noter(false)}>🔁 À revoir</button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="im-defile">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '14px 14px 40px' }}>
        <div className="im-etiquette" style={{ color: OR }}>🎓 Examen civique 2026</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', margin: '4px 0 10px' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4.4vw, 38px)', margin: 0, lineHeight: 1.1, flex: 1 }}>Préparer l’examen</h2>
          <button type="button" className="im-bouton" onClick={onRetour}>☰ Sommaire</button>
        </div>
        {contenu}
      </div>
      {pageVue && <div style={{ position: 'fixed', inset: 0, zIndex: 1001 }}><PageLivret n={pageVue} onFermer={() => setPageVue(null)} /></div>}
    </div>
  )
}
