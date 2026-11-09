// Volet géographique (pages 49 à 51) : la carte à explorer (fleuves,
// montagnes, mers, voisins, villes, ports), « pourquoi c'est important »,
// le film du volet et un quiz corrigé.
import { useEffect, useState } from 'react'
import Carte from './Carte'
import { Quiz } from './Etude'
import { PageLivret } from './Lecteur'
import { FLEUVES, MASSIFS, LIEUX, GRANDES_VILLES, PORTS } from '../../../lib/livret2026/immersion/lieux'
import { GÉO } from '../../../lib/livret2026/immersion/histoire'
import { SEUIL } from '../../../lib/livret2026/immersion/verification'
import { OR, SERIF } from '../../../lib/livret2026/immersion/immersionCss'

const COUCHES = [['fleuves', '🌊', 'Fleuves'], ['massifs', '⛰️', 'Montagnes'], ['mers', '🌊', 'Mers et océan'], ['voisins', '🧭', 'Pays voisins'], ['villes', '🏙️', 'Grandes villes'], ['ports', '⚓', 'Ports']]
const VOISINS_EN = ['Germany', 'Andorra', 'Belgium', 'Spain', 'Italy', 'Luxembourg', 'Monaco', 'Switzerland']

export default function Geographie({ suivi, onQuiz, onRegarder, onRetour }) {
  const [couches, setCouches] = useState(['fleuves', 'massifs', 'mers'])
  const [fleuve, setFleuve] = useState(null)
  const [quiz, setQuiz] = useState(false)
  const [pageVue, setPageVue] = useState(null)
  const basculer = c => setCouches(t => (t.includes(c) ? t.filter(x => x !== c) : [...t, c]))
  const f = FLEUVES.find(x => x.id === fleuve)
  const lieux = [...(couches.includes('villes') ? GRANDES_VILLES : []), ...(couches.includes('ports') ? PORTS : []), ...(f ? f.villes : []), ...(couches.includes('massifs') ? ['mont-blanc'] : [])]
  return (
    <div className="im-defile">
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '14px 14px 40px' }}>
        <div className="im-etiquette" style={{ color: '#7dd3fc' }}>🌍 Volet géographique · pages 49 à 51</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4.4vw, 38px)', margin: '4px 0 6px', lineHeight: 1.1 }}>Fleuves, montagnes, mers et frontières</h2>
        <p style={{ margin: '0 0 12px', opacity: 0.85, lineHeight: 1.5 }}>{GÉO.intro.map(t => t[0]).join(' ')}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button type="button" className="im-bouton im-plein" onClick={onRegarder}>▶ Regarder le film du volet</button>
          <button type="button" className="im-bouton" onClick={() => setQuiz(true)}>🎯 Quiz géographie{suivi?.quiz ? ` (${suivi.quiz.bonnes}/${suivi.quiz.total})` : ''}</button>
          <button type="button" className="im-bouton" onClick={onRetour}>☰ Sommaire</button>
        </div>

        {quiz ? (
          <Quiz questions={GÉO.quiz} graine="geo" titre="Quiz géographie" onPage={setPageVue} onFini={({ bonnes, total, recommencer }) => (
            <FinQuiz bonnes={bonnes} total={total} recommencer={recommencer} onQuiz={onQuiz} onFermer={() => setQuiz(false)} />
          )} />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8, scrollbarWidth: 'none' }} role="group" aria-label="Couches de la carte">
              {COUCHES.map(([id, e, nom]) => <button key={id} type="button" className="im-puce" aria-pressed={couches.includes(id)} onClick={() => basculer(id)}>{e} {nom}</button>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 12, alignItems: 'start' }}>
              <div className="im-carte" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1 / 1', maxHeight: '72vh' }}>
                <Carte vue="france" pays={couches.includes('voisins') ? ['France', ...VOISINS_EN] : ['France']} lieux={lieux} actifs={f ? f.villes : []}
                  fleuves={couches.includes('fleuves') ? FLEUVES.map(x => x.id) : f ? [f.id] : []} trace={f?.id || null} couches={couches.filter(c => ['massifs', 'mers', 'voisins'].includes(c))}
                  sélection={fleuve} onFleuve={id => setFleuve(x => (x === id ? null : id))} focus={[]} étiquette="touchez un fleuve pour le découvrir" />
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {f ? (
                  <div className="im-carte im-monte" style={{ borderColor: f.couleur }}>
                    <div className="im-etiquette" style={{ color: f.couleur }}>🌊 Fleuve</div>
                    <h3 style={{ fontFamily: SERIF, fontSize: 26, margin: '4px 0 6px', color: '#fff' }}>{f.nom}</h3>
                    <p style={{ margin: 0, lineHeight: 1.5, fontSize: 16.5 }}>{f.info}</p>
                    {f.villes.length > 0 && <p style={{ margin: '8px 0 0', lineHeight: 1.5 }}><strong style={{ color: OR }}>Villes traversées citées :</strong> {f.villes.map(v => LIEUX[v].nom).join(', ')}</p>}
                    <p style={{ margin: '8px 0 0', fontSize: 12.5, opacity: 0.7 }}>Sur la carte : le cours, de la source (○) à l’embouchure (▼). Tracé indicatif.</p>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}><button type="button" className="im-page" onClick={() => setPageVue(f.p)}>📖 p. {f.p}</button><button type="button" className="im-page" onClick={() => setFleuve(null)}>✕ Fermer</button></div>
                  </div>
                ) : (
                  <div className="im-carte">
                    <div className="im-etiquette" style={{ color: '#7dd3fc' }}>🌊 Les cinq fleuves du livret</div>
                    <p style={{ margin: '6px 0 8px', opacity: 0.85 }}>Touchez un fleuve, sur la carte ou ici :</p>
                    <div style={{ display: 'grid', gap: 6 }}>{FLEUVES.map(x => <button key={x.id} type="button" className="im-option" onClick={() => setFleuve(x.id)} style={{ borderLeft: `5px solid ${x.couleur}` }}><strong>{x.nom}</strong> — <span style={{ opacity: 0.85 }}>{x.info}</span></button>)}</div>
                  </div>
                )}
                {couches.includes('massifs') && (
                  <div className="im-carte">
                    <div className="im-etiquette" style={{ color: '#bef264' }}>⛰️ Les montagnes</div>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5, display: 'grid', gap: 4 }}>{MASSIFS.slice(0, 2).map(m => <li key={m.id}><strong>{m.nom}</strong> : {m.info}</li>)}<li>Le Massif central, le Jura et les Vosges sont d’autres massifs.</li></ul>
                    <div style={{ marginTop: 6 }}><button type="button" className="im-page" onClick={() => setPageVue(51)}>📖 p. 51</button></div>
                  </div>
                )}
              </div>
            </div>

            <h3 style={{ fontFamily: SERIF, fontSize: 24, margin: '20px 0 8px' }}>💡 Pourquoi c’est important</h3>
            <div className="im-grille">
              {GÉO.pourquoi.map(c => (
                <div key={c.titre} className="im-carte" style={{ borderColor: 'rgba(252,211,77,.35)' }}>
                  <div style={{ fontWeight: 800, fontSize: 16.5, marginBottom: 4 }}>{c.titre}</div>
                  <div style={{ lineHeight: 1.5, fontSize: 15 }}>{c.texte}</div>
                  <div style={{ marginTop: 8 }}><button type="button" className="im-page" onClick={() => setPageVue(c.p)}>📖 p. {c.p}</button></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {pageVue && <div style={{ position: 'fixed', inset: 0, zIndex: 1001 }}><PageLivret n={pageVue} onFermer={() => setPageVue(null)} /></div>}
    </div>
  )
}

function FinQuiz({ bonnes, total, recommencer, onQuiz, onFermer }) {
  useEffect(() => { onQuiz(bonnes, total) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="im-carte im-monte" style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 800, color: bonnes >= SEUIL ? OR : '#fff' }}>{bonnes} / {total}</div>
      <p style={{ fontSize: 17 }}>{bonnes >= SEUIL ? '✅ Bravo : la géographie du livret est acquise.' : 'Revois la carte et les cinq fleuves, puis retente.'}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="im-bouton im-plein" onClick={recommencer}>↺ Recommencer</button>
        <button type="button" className="im-bouton" onClick={onFermer}>🗺️ Revenir à la carte</button>
      </div>
    </div>
  )
}
