import { useState, useEffect } from 'react'
import Théâtre from './Theatre'
import { PAGE, MAISON } from '../../lib/livret2026'
import { PARTIES } from '../../lib/livret2026/outils'
import { ajouterCartesLivret } from '../../lib/livret2026/progression'
import { lireLocal } from '../../lib/donneesFoyer'
import { aujourdhuiLocal } from '../../lib/habitudes'
import { bip } from '../../lib/texteFormate'

const PIÈCES = { entrée: '🚪 l\'entrée', salon: '🛋️ le salon', bureau: '🗄️ le bureau', bibliothèque: '📚 la bibliothèque', jardin: '🌳 le jardin', cuisine: '🍳 la cuisine', grenier: '🕯️ le grenier' }
const ÉTAPES = ['🎬 Découvrir', '🧠 Me rappeler', '🏠 Ancrer', '🗣️ Expliquer']

// B. Une leçon de 15 minutes en 4 temps, puis C : les cartes partent dans Mémoriser.
export default function Leçon({ leçon, setData, espace, afficher, onFermer }) {
  const pages = leçon.pages.map(n => PAGE.get(n)).filter(Boolean)
  const thème = PARTIES[pages[0]?.partie ?? 0]
  const [étape, setÉtape] = useState(0)
  const questions = pages.flatMap(p => (p.questions || []).map(q => ({ ...q, page: p.page })))
  const [qi, setQi] = useState(0)
  const [vue, setVue] = useState(false)
  const [bonnes, setBonnes] = useState(0)
  const objets = MAISON.filter(o => leçon.pages.includes(o.page))
  const [reste, setReste] = useState(60)
  const [chrono, setChrono] = useState(false)
  const [fin, setFin] = useState(false)

  useEffect(() => {
    if (!chrono) return undefined
    const t = setInterval(() => setReste(r => { if (r <= 1) { clearInterval(t); setChrono(false); bip(660, 0.3); return 0 } return r - 1 }), 1000)
    return () => clearInterval(t)
  }, [chrono])

  const terminer = async () => {
    const auj = aujourdhuiLocal()
    setData(d => ({
      ...d,
      leçons: { ...d.leçons, [leçon.id]: { faite: auj, bonnes, total: questions.length, oral: true } },
      pages: { ...d.pages, ...Object.fromEntries(leçon.pages.map(n => [n, { ...(d.pages[n] || {}), animée: d.pages[n]?.animée || auj }])) },
    }))
    setFin(true)
    try {
      const r = await ajouterCartesLivret(espace, leçon.pages, lireLocal('memoriser', espace))
      afficher(`✅ Leçon faite · 🧠 ${r.ajoutées} carte${r.ajoutées > 1 ? 's' : ''} dans Mémoriser (retour demain, puis J+3, J+7…)`)
    } catch (e) { afficher(`Leçon enregistrée, mais cartes non ajoutées : ${e.message}`) }
  }

  if (étape === 0) {
    return <Théâtre pages={pages} onFermer={onFermer} libelléFin="Étape 2 : je me rappelle →" onFini={() => setÉtape(1)} />
  }

  const q = questions[qi]
  const motsClés = pages.map(p => `${p.emoji} ${p.titre}`)
  return (
    <div role="dialog" aria-modal="true" aria-label={`Leçon : ${leçon.titre}`} style={{ position: 'fixed', inset: 0, zIndex: 1000, color: '#fff', display: 'flex', flexDirection: 'column', background: `radial-gradient(120% 90% at 50% 0%, ${thème.a}cc 0%, ${thème.b} 62%, #07080f 100%), #07080f`, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'max(10px, env(safe-area-inset-top)) 14px 8px' }}>
        <span style={{ fontSize: 24 }}>{leçon.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.75 }}>Leçon · pages {leçon.pages.join(', ')}</div>
          <div style={{ fontWeight: 800, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leçon.titre}</div>
        </div>
        <button onClick={onFermer} aria-label="Fermer la leçon" className="l26-bouton-clair" style={{ width: 44, padding: 0 }}>✕</button>
      </div>
      <ol aria-label="Étapes de la leçon" style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: '0 14px 6px' }}>
        {ÉTAPES.map((e, k) => <li key={e} aria-current={k === étape ? 'step' : undefined} style={{ flex: 1, textAlign: 'center', fontSize: 11.5, padding: '6px 2px', borderRadius: 8, background: k < étape ? 'rgba(255,209,102,.35)' : k === étape ? '#ffd166' : 'rgba(255,255,255,.12)', color: k === étape ? '#1b1b1b' : '#fff', fontWeight: 700 }}>{e}</li>)}
      </ol>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
          {étape === 1 && (q ? (
            <div key={qi} className="l26-monte" style={{ textAlign: 'center' }}>
              <p style={{ opacity: 0.8, margin: '0 0 6px' }}>Question {qi + 1} / {questions.length} · sans regarder !</p>
              <h3 style={{ fontSize: 'clamp(20px, 5vw, 27px)', lineHeight: 1.35, margin: '0 0 18px' }}>{q.q}</h3>
              {!vue
                ? <button onClick={() => setVue(true)} className="l26-bouton">J'ai ma réponse en tête → voir</button>
                : <>
                    <div className="l26-retourne" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 16, padding: 16, fontSize: 17, lineHeight: 1.5, marginBottom: 14 }}>{q.r}<div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 6 }}>page {q.page}</div></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setVue(false); setQi(i => i + 1) }} className="l26-bouton" style={{ flex: 1, background: '#ef476f', color: '#fff' }}>✗ Pas encore</button>
                      <button onClick={() => { setBonnes(b => b + 1); setVue(false); setQi(i => i + 1) }} className="l26-bouton" style={{ flex: 1, background: '#06d6a0' }}>✓ Je savais</button>
                    </div>
                  </>}
            </div>
          ) : (
            <div className="l26-zoom" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 60 }}>{bonnes >= questions.length * 0.75 ? '🌟' : bonnes >= questions.length / 2 ? '👍' : '💪'}</div>
              <h3 style={{ fontSize: 26, margin: '6px 0' }}>{bonnes} / {questions.length}</h3>
              <p style={{ opacity: 0.9, margin: '0 0 18px' }}>{bonnes === questions.length ? 'Parfait !' : 'Les réponses manquées reviendront dans Mémoriser.'}</p>
              <button onClick={() => setÉtape(2)} className="l26-bouton">Étape 3 : j'ancre dans ma maison →</button>
            </div>
          ))}

          {étape === 2 && (
            <div className="l26-monte">
              <h3 style={{ textAlign: 'center', fontSize: 22, margin: '0 0 6px' }}>🏠 Range ces idées dans ta maison</h3>
              <p style={{ textAlign: 'center', opacity: 0.85, margin: '0 0 16px', lineHeight: 1.5 }}>Lis chaque image, ferme les yeux 5 secondes et imagine-la vraiment, avec des couleurs et du son.</p>
              {objets.length ? objets.map((o, k) => (
                <div key={o.id} className="l26-glisse-g" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 16, padding: 14, marginBottom: 10, animationDelay: `${k * 0.35}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><span style={{ fontSize: 34 }}>{o.emoji}</span><span><strong>{o.objet}</strong><span style={{ display: 'block', fontSize: 12.5, opacity: 0.75 }}>dans {PIÈCES[o.pièce] || o.pièce}</span></span></div>
                  <p style={{ margin: '0 0 6px', fontSize: 16, lineHeight: 1.5, color: '#ffd166' }}>✨ {o.image}</p>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.45, opacity: 0.9 }}>📌 {o.fait}</p>
                </div>
              )) : pages.map((p, k) => (
                <div key={p.page} className="l26-glisse-g" style={{ background: 'rgba(255,255,255,.08)', borderRadius: 16, padding: 14, marginBottom: 10, animationDelay: `${k * 0.35}s` }}>
                  <strong>{p.emoji} {p.titre}</strong><p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{p.résumé}</p>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: 10 }}><button onClick={() => setÉtape(3)} className="l26-bouton">Étape 4 : j'explique à voix haute →</button></div>
            </div>
          )}

          {étape === 3 && !fin && (
            <div className="l26-monte" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 22, margin: '0 0 8px' }}>🗣️ Explique « {leçon.titre} »</h3>
              <p style={{ opacity: 0.85, margin: '0 0 14px', lineHeight: 1.5 }}>Comme devant l'agent de préfecture : 1 minute, à voix haute, avec tes mots. Appuie-toi sur ces repères :</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 18 }}>{motsClés.map(m => <span key={m} style={{ padding: '6px 12px', borderRadius: 16, background: 'rgba(255,255,255,.12)', fontSize: 14 }}>{m}</span>)}</div>
              <div aria-live="polite" style={{ width: 140, height: 140, margin: '0 auto 18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, background: `conic-gradient(#ffd166 ${(reste / 60) * 360}deg, rgba(255,255,255,.12) 0)`, boxShadow: chrono ? '0 0 0 8px rgba(255,209,102,.2)' : 'none' }}>
                <span style={{ width: 112, height: 112, borderRadius: '50%', background: thème.b, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{reste}s</span>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {!chrono && reste === 60 && <button onClick={() => setChrono(true)} className="l26-bouton">▶ Je commence</button>}
                {chrono && <button onClick={() => setChrono(false)} className="l26-bouton-clair">⏸ Pause</button>}
                <button onClick={terminer} className="l26-bouton" style={{ background: '#06d6a0' }}>✓ J'ai expliqué : leçon finie</button>
              </div>
            </div>
          )}
          {fin && (
            <div className="l26-zoom" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 70 }}>🏅</div>
              <h3 style={{ fontSize: 26, margin: '6px 0' }}>Leçon terminée !</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.5, margin: '0 0 18px' }}>Ses cartes reviendront demain dans Mémoriser, puis à J+3, J+7, J+14 et J+30. Ses pages passent à l'orange sur ta carte de maîtrise.</p>
              <button onClick={onFermer} className="l26-bouton">Retour au plan</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
