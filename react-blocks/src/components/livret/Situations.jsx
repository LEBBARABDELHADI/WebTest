import { useState } from 'react'
import { SITUATIONS } from '../../lib/livret2026'
import { aujourdhuiLocal } from '../../lib/habitudes'

// 8. Mises en situation : des scènes de la vie quotidienne, 3 choix, une seule
// bonne attitude, l'explication tirée du livret. Comme à l'examen civique et
// à l'entretien.
const mélanger = l => { const c = [...l]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] } return c }

export default function Situations({ T, S, data, setData, versPage }) {
  const thèmes = [...new Set(SITUATIONS.map(s => s.thème))]
  const [thème, setThème] = useState('')
  const [série, setSérie] = useState(null) // { ids, i, bons }
  const [choix, setChoix] = useState(null)
  const faites = SITUATIONS.filter(s => data.situations[s.id])
  const réussies = faites.filter(s => data.situations[s.id].bon)

  // Les choix sont mélangés à chaque série (la bonne réponse change de place).
  const lancer = (liste, titre) => {
    const ids = mélanger(liste).map(s => s.id).slice(0, 10)
    setSérie({ ids, i: 0, bons: 0, titre, ordres: Object.fromEntries(ids.map(id => [id, mélanger([0, 1, 2])])) })
    setChoix(null)
  }
  if (!SITUATIONS.length) return <p style={S.discret}>Les mises en situation arrivent avec le contenu du livret.</p>

  if (série) {
    const s = SITUATIONS.find(x => x.id === série.ids[série.i])
    if (!s) {
      return (
        <section style={{ ...S.carte, textAlign: 'center' }} className="l26-zoom">
          <div style={{ fontSize: 56 }}>{série.bons === série.ids.length ? '🏆' : série.bons >= série.ids.length / 2 ? '👍' : '💪'}</div>
          <h2 style={{ margin: '6px 0', fontSize: 24 }}>{série.bons} / {série.ids.length}</h2>
          <p style={{ ...S.discret, marginBottom: 14 }}>Les situations ratées sont marquées : refais-les jusqu'à ce qu'elles soient toutes justes.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setSérie(null)} style={S.bouton(false)}>Retour</button>
            <button onClick={() => lancer(SITUATIONS.filter(x => thème ? x.thème === thème : true), série.titre)} style={S.bouton(true)}>🎲 Nouvelle série</button>
          </div>
        </section>
      )
    }
    const répondre = c => {
      if (choix) return
      setChoix(c)
      setData(d => ({ ...d, situations: { ...d.situations, [s.id]: { bon: c.bon, date: aujourdhuiLocal() } } }))
      if (c.bon) setSérie(x => ({ ...x, bons: x.bons + 1 }))
    }
    return (
      <section key={s.id} style={S.carte} className="l26-monte" aria-labelledby="t-sit">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: T.textMuted, flex: 1 }}>{série.titre} · {série.i + 1}/{série.ids.length}</span>
          <button onClick={() => setSérie(null)} style={{ ...S.bouton(false), minHeight: 34, fontSize: 13 }}>Arrêter</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span className="l26-rebond" style={{ fontSize: 48 }}>{s.emoji}</span>
          <div><span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: T.accent }}>{s.thème}</span>
            <p id="t-sit" style={{ margin: '2px 0 0', fontSize: 16.5, lineHeight: 1.5 }}>{s.contexte}</p></div>
        </div>
        <p style={{ fontWeight: 800, fontSize: 17, margin: '0 0 10px' }}>{s.question}</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {(série.ordres?.[s.id] || [0, 1, 2]).map(n => s.choix[n]).map((c, k) => {
            const montré = !!choix
            const estChoisi = choix === c
            const couleur = montré ? (c.bon ? '#22a55e' : estChoisi ? T.danger : T.border) : T.border
            return (
              <button key={k} onClick={() => répondre(c)} disabled={montré} className={`l26-glisse-g ${estChoisi && !c.bon ? 'l26-faux' : ''}`} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: montré ? 'default' : 'pointer', fontSize: 15.5, lineHeight: 1.45, color: T.text, background: montré && c.bon ? 'rgba(34,165,94,.12)' : estChoisi ? 'rgba(239,68,68,.1)' : T.bg, border: `2px solid ${couleur}`, animationDelay: `${k * 0.12}s` }}>
                <span style={{ fontWeight: 800, marginRight: 8 }}>{montré ? (c.bon ? '✅' : estChoisi ? '❌' : '○') : String.fromCharCode(65 + k)}</span>{' '}{c.texte}
                {montré && (estChoisi || c.bon) && <span style={{ display: 'block', marginTop: 6, fontSize: 14, color: T.textMuted }}>{c.explication}</span>}
              </button>
            )
          })}
        </div>
        {choix && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={() => { setChoix(null); setSérie(x => ({ ...x, i: x.i + 1 })) }} style={S.bouton(true)}>{série.i + 1 < série.ids.length ? 'Situation suivante →' : 'Voir mon score'}</button>
            <button onClick={() => versPage(s.page)} style={S.bouton(false)}>📖 Page {s.page}</button>
          </div>
        )}
      </section>
    )
  }

  return (
    <section style={S.carte}>
      <h2 style={S.titre}>🎭 Mises en situation · {SITUATIONS.length}</h2>
      <p style={{ ...S.discret, marginBottom: 10 }}>Des scènes de la vie de tous les jours. Choisis la bonne attitude : c'est exactement ce que vérifient l'examen civique et l'entretien.</p>
      <p style={{ margin: '0 0 12px', fontSize: 14.5 }}>{faites.length ? `✅ ${réussies.length} réussies sur ${faites.length} faites` : 'Aucune faite pour l\'instant.'}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => lancer(thème ? SITUATIONS.filter(x => x.thème === thème) : SITUATIONS, thème || 'Toutes les situations')} style={S.bouton(true)}>▶ Série de 10</button>
        {faites.length > réussies.length && <button onClick={() => lancer(faites.filter(x => !data.situations[x.id].bon), 'À refaire')} style={S.bouton(false)}>↺ Refaire les ratées ({faites.length - réussies.length})</button>}
        {SITUATIONS.length > faites.length && <button onClick={() => lancer(SITUATIONS.filter(x => !data.situations[x.id]), 'Nouvelles situations')} style={S.bouton(false)}>✨ Jamais faites ({SITUATIONS.length - faites.length})</button>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setThème('')} aria-pressed={!thème} style={{ ...S.bouton(!thème), minHeight: 34, fontSize: 12.5, borderRadius: 17 }}>Tous les thèmes</button>
        {thèmes.map(t => <button key={t} onClick={() => setThème(t)} aria-pressed={thème === t} style={{ ...S.bouton(thème === t), minHeight: 34, fontSize: 12.5, borderRadius: 17 }}>{t} ({SITUATIONS.filter(x => x.thème === t).length})</button>)}
      </div>
    </section>
  )
}
