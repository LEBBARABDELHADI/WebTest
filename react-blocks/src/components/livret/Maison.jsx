import { useState, useEffect } from 'react'
import { MAISON } from '../../lib/livret2026'
import { aujourdhuiLocal } from '../../lib/habitudes'
import { direTexte, déverrouillerAudio } from '../../lib/texteFormate'

// 1. Palais de mémoire « Ma maison République » : chaque partie du livret est
// une pièce, chaque fait important est un objet de la pièce, relié par une
// image mentale. Visite libre, visite guidée, puis visite à l'aveugle.
const PIÈCES = [
  { id: 'entrée', nom: 'L\'entrée', emoji: '🚪', partie: 'Principes et valeurs', fond: '#dbeafe', zone: 'entree' },
  { id: 'salon', nom: 'Le salon', emoji: '🛋️', partie: 'Institutions', fond: '#ede9fe', zone: 'salon' },
  { id: 'bureau', nom: 'Le bureau', emoji: '🗄️', partie: 'Droits et devoirs', fond: '#d1fae5', zone: 'bureau' },
  { id: 'bibliothèque', nom: 'La bibliothèque', emoji: '📚', partie: 'Histoire', fond: '#fde7c8', zone: 'biblio' },
  { id: 'jardin', nom: 'Le jardin', emoji: '🌳', partie: 'Géographie et culture', fond: '#dcfce7', zone: 'jardin' },
  { id: 'cuisine', nom: 'La cuisine', emoji: '🍳', partie: 'Vivre en France', fond: '#ffedd5', zone: 'cuisine' },
  { id: 'grenier', nom: 'Le grenier', emoji: '🕯️', partie: 'Annexes : DDHC et Charte', fond: '#f3e8d2', zone: 'grenier' },
]
const ORDRE = PIÈCES.flatMap(p => MAISON.filter(o => o.pièce === p.id))

export default function Maison({ T, S, data, setData, versPage }) {
  const [mode, setMode] = useState('visite') // visite | aveugle
  const [choisi, setChoisi] = useState(null)
  const [révélé, setRévélé] = useState(false)
  const [guide, setGuide] = useState(-1)
  const retrouvés = ORDRE.filter(o => data.maison[o.id]).length
  const objet = guide >= 0 ? ORDRE[guide] : ORDRE.find(o => o.id === choisi)

  // Visite guidée : objet après objet, pièce après pièce.
  useEffect(() => {
    if (guide < 0) return undefined
    const o = ORDRE[guide]
    if (!o) return undefined
    let annulé = false
    const suite = () => { if (!annulé) setGuide(g => (g + 1 < ORDRE.length ? g + 1 : -1)) }
    let t
    if (window.speechSynthesis) direTexte(`${o.objet}. ${o.image}`).then(() => { if (!annulé) t = setTimeout(suite, 1200) })
    else t = setTimeout(suite, 6500)
    return () => { annulé = true; clearTimeout(t); window.speechSynthesis?.cancel() }
  }, [guide])

  const noter = (o, ok) => {
    setData(d => { const m = { ...d.maison }; if (ok) m[o.id] = aujourdhuiLocal(); else delete m[o.id]; return { ...d, maison: m } })
    const reste = ORDRE.filter(x => x.id !== o.id && !(data.maison[x.id]))
    setRévélé(false)
    setChoisi(mode === 'aveugle' && reste.length ? reste[0].id : null)
  }

  if (!MAISON.length) return <p style={S.discret}>La maison se remplit au fur et à mesure que le contenu du livret est prêt.</p>
  const pièce = id => PIÈCES.find(p => p.id === id)
  const Pièce = ({ p }) => {
    const objets = MAISON.filter(o => o.pièce === p.id)
    const allumée = objet?.pièce === p.id
    return (
      <div className={allumée ? 'l26-allume-boucle' : ''} style={{ gridArea: p.zone, background: p.fond, borderRadius: 12, padding: '8px 8px 10px', color: '#1f2937', border: `2px solid ${allumée ? '#f59e0b' : 'rgba(0,0,0,.08)'}`, minWidth: 0, transition: 'border-color .3s, transform .3s', transform: allumée ? 'scale(1.02)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }} aria-hidden="true">{p.emoji}</span>
          <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 13.5 }}>{p.nom}</strong><span style={{ fontSize: 11, opacity: 0.7 }}>{p.partie}</span></span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{objets.filter(o => data.maison[o.id]).length}/{objets.length}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {objets.map((o, k) => {
            const caché = mode === 'aveugle' && !(révélé && choisi === o.id)
            const actif = objet?.id === o.id
            return (
              <button key={o.id} onClick={() => { setGuide(-1); setChoisi(o.id); setRévélé(false) }} aria-label={caché ? `Objet caché ${k + 1} de ${p.nom}` : o.objet} title={caché ? '?' : o.objet} className="l26-pop" style={{
                width: 42, height: 42, borderRadius: 21, fontSize: caché ? 17 : 22, cursor: 'pointer', animationDelay: `${k * 0.06}s`,
                border: `2px solid ${actif ? '#f59e0b' : data.maison[o.id] ? '#22a55e' : 'rgba(0,0,0,.12)'}`, background: actif ? '#fff7e0' : '#fff', boxShadow: actif ? '0 0 0 4px rgba(245,158,11,.3)' : 'none', color: '#1f2937', fontWeight: 800,
              }}>{caché ? (data.maison[o.id] ? '✓' : '?') : o.emoji}</button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .l26-maison { display: grid; gap: 8px; grid-template-columns: 1fr 1fr; grid-template-areas: "grenier grenier" "bureau biblio" "salon cuisine" "entree entree" "jardin jardin" }
        @media (min-width: 760px) { .l26-maison { grid-template-columns: 1fr 1fr 1fr; grid-template-areas: "grenier grenier jardin" "bureau biblio jardin" "salon cuisine jardin" "entree entree jardin" } }
        .l26-allume-boucle { animation: l26-allume 2.2s ease-in-out infinite }
      `}</style>
      <section style={S.carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <h2 style={{ ...S.titre, margin: 0, flex: 1 }}>🏠 Ma maison République</h2>
          <span style={{ fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5 }}>{retrouvés}/{ORDRE.length} retrouvés</span>
        </div>
        <p style={{ ...S.discret, marginBottom: 12 }}>Chaque pièce est une partie du livret, chaque objet un fait à retenir, relié par une image mentale. Visite toujours dans le même ordre : de l'entrée au grenier.</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['visite', '👀 Visiter'], ['aveugle', '🙈 Visite à l\'aveugle']].map(([id, nom]) => <button key={id} onClick={() => { setMode(id); setChoisi(id === 'aveugle' ? (ORDRE.find(o => !data.maison[o.id]) || ORDRE[0]).id : null); setRévélé(false); setGuide(-1) }} aria-pressed={mode === id} style={{ ...S.bouton(mode === id), minHeight: 40 }}>{nom}</button>)}
          {mode === 'visite' && <button onClick={() => { déverrouillerAudio(); setChoisi(null); setGuide(g => (g >= 0 ? -1 : 0)) }} style={{ ...S.bouton(false), minHeight: 40 }}>{guide >= 0 ? '⏹ Arrêter la visite' : '▶ Visite guidée'}</button>}
        </div>
        {/* Toit */}
        <div aria-hidden="true" style={{ height: 34, margin: '0 6%', background: '#9a3412', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', opacity: 0.85 }} />
        <div className="l26-maison" style={{ background: T.surface2, padding: 8, borderRadius: '4px 4px 12px 12px' }}>
          {PIÈCES.map(p => <Pièce key={p.id} p={p} />)}
        </div>
      </section>

      {objet && (
        <section key={objet.id + mode + révélé} className="l26-monte" style={{ ...S.carte, borderColor: '#f59e0b', position: 'sticky', bottom: 10 }} aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 40 }} className="l26-rebond">{mode === 'aveugle' && !révélé ? '❓' : objet.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 16.5 }}>{mode === 'aveugle' && !révélé ? `Un objet de ${pièce(objet.pièce)?.nom.toLowerCase()}` : objet.objet}</strong>
              <span style={{ fontSize: 12.5, color: T.textMuted }}>{pièce(objet.pièce)?.emoji} {pièce(objet.pièce)?.nom} · page {objet.page}{guide >= 0 ? ` · visite ${guide + 1}/${ORDRE.length}` : ''}</span>
            </div>
          </div>
          {mode === 'aveugle' && !révélé ? (
            <>
              <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.5 }}>Qu'as-tu rangé ici ? Dis l'objet et le fait à voix haute, puis vérifie.</p>
              <button onClick={() => setRévélé(true)} style={S.bouton(true)}>Révéler</button>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 8px', fontSize: 16, lineHeight: 1.55, color: T.accent, fontWeight: 600 }}>✨ {objet.image}</p>
              <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.5 }}>📌 {objet.fait}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {mode === 'aveugle'
                  ? <>
                      <button onClick={() => noter(objet, false)} style={{ ...S.bouton(false), borderColor: T.danger, color: T.danger }}>✗ Oublié</button>
                      <button onClick={() => noter(objet, true)} style={{ ...S.bouton(true), background: '#22a55e', borderColor: '#22a55e', color: '#fff' }}>✓ Je m'en souvenais</button>
                    </>
                  : guide < 0 && <button onClick={() => setChoisi(null)} style={S.bouton(false)}>Fermer</button>}
                <button onClick={() => versPage(objet.page)} style={S.bouton(false)}>📖 Voir la page {objet.page}</button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  )
}
