import { useState, useEffect, useRef } from 'react'
import { FRISE } from '../../lib/livret2026'
import { Compteur } from './Scenes'
import { direTexte, déverrouillerAudio } from '../../lib/texteFormate'

// 3. Voyage dans le temps : la frise du livret, de la plus ancienne date à
// aujourd'hui, avec un compteur d'années qui défile, puis un jeu d'ordre.
const TEINTES = ['#b45309', '#7c3aed', '#2563eb', '#0f9f6e', '#dc2626', '#0891b2', '#c026d3', '#65a30d', '#ea580c', '#4f46e5', '#be123c', '#0d9488']
const libelléAnnée = a => (a < 0 ? `${-a} av. J.-C.` : String(a))
const mélanger = l => { const c = [...l]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] } return c }

export default function Frise({ T, S, data, setData, versPage }) {
  const périodes = [...new Set(FRISE.map(f => f.période))]
  const couleur = p => TEINTES[périodes.indexOf(p) % TEINTES.length]
  const [filtre, setFiltre] = useState('')
  const liste = FRISE.filter(f => !filtre || f.période === filtre)
  const [i, setI] = useState(0)
  const [voyage, setVoyage] = useState(false)
  const [jeu, setJeu] = useState(null)
  const piste = useRef(null)
  const e = liste[Math.min(i, liste.length - 1)]
  const précédent = liste[Math.max(0, Math.min(i, liste.length - 1) - 1)]

  useEffect(() => { piste.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }, [i, filtre])
  useEffect(() => {
    if (!voyage || !e) return undefined
    let annulé = false, t
    const suite = () => { if (annulé) return; if (i + 1 < liste.length) setI(x => x + 1); else setVoyage(false) }
    if (window.speechSynthesis) direTexte(`${e.date}. ${e.titre}. ${e.détail}`).then(() => { if (!annulé) t = setTimeout(suite, 900) })
    else t = setTimeout(suite, 5200)
    return () => { annulé = true; clearTimeout(t); window.speechSynthesis?.cancel() }
  }, [voyage, i, filtre]) // eslint-disable-line react-hooks/exhaustive-deps

  const nouveauJeu = () => {
    const années = new Set()
    const choisis = mélanger(FRISE).filter(f => { if (années.has(f.année)) return false; années.add(f.année); return true }).slice(0, 5)
    setJeu({ cartes: mélanger(choisis), placés: [], erreurs: 0, raté: null })
  }
  const toucher = c => {
    const restants = jeu.cartes.filter(x => !jeu.placés.includes(x))
    const bon = [...restants].sort((a, b) => a.année - b.année)[0]
    if (c === bon) {
      const placés = [...jeu.placés, c]
      setJeu(j => ({ ...j, placés, raté: null }))
      if (placés.length === jeu.cartes.length) {
        const score = Math.max(0, 5 - jeu.erreurs)
        setData(d => ({ ...d, frise: { ...d.frise, parties: (d.frise.parties || 0) + 1, meilleur: Math.max(d.frise.meilleur || 0, score) } }))
      }
    } else setJeu(j => ({ ...j, erreurs: j.erreurs + 1, raté: c }))
  }

  if (!FRISE.length) return <p style={S.discret}>La frise se remplit au fur et à mesure que le contenu du livret est prêt.</p>
  return (
    <>
      <section style={{ ...S.carte, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 0' }}>
          <h2 style={S.titre}>⏳ Voyage dans le temps · {FRISE.length} dates</h2>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
            <button onClick={() => { setFiltre(''); setI(0) }} style={{ ...S.bouton(!filtre), minHeight: 34, fontSize: 12.5, borderRadius: 17, flexShrink: 0 }}>Tout</button>
            {périodes.map(p => <button key={p} onClick={() => { setFiltre(p); setI(0); setVoyage(false) }} style={{ ...S.bouton(filtre === p), minHeight: 34, fontSize: 12.5, borderRadius: 17, flexShrink: 0, ...(filtre === p ? { background: couleur(p), borderColor: couleur(p), color: '#fff' } : { borderColor: couleur(p) }) }}>{p}</button>)}
          </div>
        </div>
        {e && (
          <div style={{ background: `linear-gradient(135deg, ${couleur(e.période)}, #111827)`, color: '#fff', padding: '18px 16px', textAlign: 'center' }} aria-live="polite">
            <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.8 }}>{e.période}</div>
            <div key={`a${filtre}${i}`} style={{ fontSize: 'clamp(46px, 13vw, 76px)', fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
              {e.année < 0 ? libelléAnnée(e.année) : <Compteur valeur={e.année} délai={0} durée={précédent && précédent !== e ? 900 : 1200} />}
            </div>
            <div key={`c${filtre}${i}`} className="l26-voyage" style={{ maxWidth: 560, margin: '6px auto 0' }}>
              <div style={{ fontSize: 44 }}>{e.emoji}</div>
              <strong style={{ display: 'block', fontSize: 19, margin: '4px 0' }}>{e.titre}</strong>
              <div style={{ fontSize: 13.5, opacity: 0.85, marginBottom: 6 }}>{e.date}</div>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5 }}>{e.détail}</p>
              <button onClick={() => versPage(e.page)} className="l26-bouton-clair" style={{ marginTop: 10, minHeight: 34, fontSize: 13 }}>📖 page {e.page}</button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 16px' }}>
          <button onClick={() => { setVoyage(false); setI(x => Math.max(0, x - 1)) }} aria-label="Date précédente" style={{ ...S.bouton(false), width: 50, padding: 0 }}>⏮</button>
          <button onClick={() => { déverrouillerAudio(); if (!voyage && i >= liste.length - 1) setI(0); setVoyage(v => !v) }} style={{ ...S.bouton(true), minWidth: 170 }}>{voyage ? '⏸ Pause' : '▶ Lancer le voyage'}</button>
          <button onClick={() => { setVoyage(false); setI(x => Math.min(liste.length - 1, x + 1)) }} aria-label="Date suivante" style={{ ...S.bouton(false), width: 50, padding: 0 }}>⏭</button>
        </div>
        <div ref={piste} style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 16px', scrollbarWidth: 'thin' }}>
          {liste.map((f, k) => (
            <button key={`${f.année}-${f.titre}`} data-i={k} onClick={() => { setVoyage(false); setI(k) }} aria-current={k === i ? 'true' : undefined} style={{ flex: '0 0 auto', width: 112, textAlign: 'left', padding: '8px 9px', borderRadius: 10, cursor: 'pointer', background: k === i ? couleur(f.période) : T.bg, color: k === i ? '#fff' : T.text, border: `1px solid ${couleur(f.période)}`, borderTopWidth: 5 }}>
              <strong style={{ display: 'block', fontSize: 14 }}>{libelléAnnée(f.année)}</strong>
              <span style={{ fontSize: 11.5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.emoji} {f.titre}</span>
            </button>
          ))}
        </div>
      </section>

      <section style={S.carte} aria-labelledby="t-ordre">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h2 id="t-ordre" style={{ ...S.titre, margin: 0, flex: 1 }}>🧩 Remets dans l'ordre</h2>
          {data.frise.meilleur != null && <span style={{ fontSize: 13, color: T.textMuted }}>Record : {data.frise.meilleur}/5</span>}
        </div>
        {!jeu ? (
          <>
            <p style={{ ...S.discret, marginBottom: 10 }}>5 événements au hasard : touche-les du plus ancien au plus récent.</p>
            <button onClick={nouveauJeu} style={S.bouton(true)}>🎲 Nouvelle partie</button>
          </>
        ) : (
          <>
            {jeu.placés.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {jeu.placés.map((c, k) => <span key={k} className="l26-pop" style={{ padding: '6px 10px', borderRadius: 10, background: couleur(c.période), color: '#fff', fontSize: 13.5 }}><strong>{libelléAnnée(c.année)}</strong> {c.emoji} {c.titre}</span>)}
              </div>
            )}
            {jeu.placés.length < jeu.cartes.length ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {jeu.cartes.filter(c => !jeu.placés.includes(c)).map(c => (
                  <button key={c.titre} onClick={() => toucher(c)} className={jeu.raté === c ? 'l26-faux' : ''} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontSize: 15, background: T.bg, color: T.text, border: `1px solid ${jeu.raté === c ? T.danger : T.border}` }}>{c.emoji} {c.titre}</button>
                ))}
                {jeu.raté && <p role="status" style={{ ...S.discret, color: T.danger }}>Pas encore : « {jeu.raté.titre} » est plus récent. Cherche plus ancien.</p>}
              </div>
            ) : (
              <div className="l26-zoom" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44 }}>{jeu.erreurs === 0 ? '🏆' : '👍'}</div>
                <p style={{ margin: '4px 0 10px', fontSize: 16 }}>{jeu.erreurs === 0 ? 'Sans faute !' : `${jeu.erreurs} erreur${jeu.erreurs > 1 ? 's' : ''}.`}</p>
                <button onClick={nouveauJeu} style={S.bouton(true)}>🎲 Rejouer</button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
