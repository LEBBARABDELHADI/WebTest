// « Immersion dans le Livret du citoyen 2026 » : l'histoire de France comme un
// film historique, d'après le livret uniquement. Bande-annonce, grande frise,
// puis 15 épisodes (plan en 18 étapes), chacun suivi d'une étude et d'un quiz :
// 4 bonnes réponses sur 5 débloquent l'épisode suivant. Volet géographique et
// préparation de l'examen. Progression : data.immersion (livret-<espace>.json).
import { useEffect, useRef, useState } from 'react'
import Lecteur from './Lecteur'
import Etude from './Etude'
import Geographie from './Geographie'
import Examen from './Examen'
import { créerSonCinéma } from '../../../lib/livret2026/cinema/sonCinema'
import { ÉPISODES, ÉTAPES, PÉRIODES } from '../../../lib/livret2026/immersion/histoire'
import { plansOuverture, plansÉpisode, plansGéo, planFrise, numéroÉpisode } from '../../../lib/livret2026/immersion/scenario'
import { SEUIL } from '../../../lib/livret2026/immersion/verification'
import { CSS_IMMERSION, OR, SERIF } from '../../../lib/livret2026/immersion/immersionCss'
import { aujourdhuiLocal } from '../../../lib/habitudes'

// Fait défiler la zone de l'écran (et elle seule) jusqu'à un élément.
function défilerVers(id) {
  const el = document.getElementById(id), zone = el?.closest('.im-defile')
  if (zone) zone.scrollTo({ top: el.getBoundingClientRect().top - zone.getBoundingClientRect().top + zone.scrollTop - 10, behavior: 'smooth' })
}

export default function Immersion({ data, setData, onFermer }) {
  const im = data.immersion && typeof data.immersion === 'object' ? data.immersion : {}
  const suivis = im.épisodes || {}
  const [écran, setÉcran] = useState({ nom: 'accueil' })
  const [son, setSon] = useState(null)
  const sonRef = useRef(null)
  const [friseToutes, setFriseToutes] = useState(false)
  useEffect(() => () => sonRef.current?.fermer(), [])

  // Le son se crée au toucher (obligatoire sur téléphone).
  const assurerSon = () => {
    try { window.speechSynthesis?.speak(Object.assign(new SpeechSynthesisUtterance(' '), { volume: 0 })) } catch { /* ignore */ }
    let s = sonRef.current
    if (!s) { s = créerSonCinéma(); sonRef.current = s; setSon(s) }
    s?.démarrer()
    return s
  }
  const majImmersion = f => setData(d => ({ ...d, immersion: f(d.immersion && typeof d.immersion === 'object' ? d.immersion : {}) }))
  const majÉpisode = (id, f) => majImmersion(i => { const é = i.épisodes || {}; return { ...i, épisodes: { ...é, [id]: { ...(é[id] || {}), ...f(é[id] || {}) } } } })

  const validé = id => !!suivis[id]?.validé
  const ouvert = k => !!im.libre || k === 0 || validé(ÉPISODES[k - 1].id) || validé(ÉPISODES[k].id)
  const nbValidés = ÉPISODES.filter(e => validé(e.id)).length
  const prochain = ÉPISODES.findIndex(e => !validé(e.id))

  const regarderÉpisode = ep => { assurerSon(); setÉcran({ nom: 'film', sorte: 'épisode', ep, plans: plansÉpisode(ep) }) }
  const étudier = ep => setÉcran({ nom: 'étude', ep })
  const ouverture = () => { assurerSon(); setÉcran({ nom: 'film', sorte: 'ouverture', plans: plansOuverture() }) }
  const sommaire = () => setÉcran({ nom: 'accueil' })

  useEffect(() => {
    if (écran.nom === 'film') return undefined
    const touche = e => { if (e.key === 'Escape') { if (écran.nom === 'accueil') onFermer(); else sommaire() } }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [écran.nom]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Film ----------
  if (écran.nom === 'film') {
    const { sorte, ep, plans } = écran
    const k = ep ? ÉPISODES.indexOf(ep) : -1
    let titre = '🎬 Immersion · Bande-annonce et grande frise', fin
    if (sorte === 'ouverture') {
      fin = { titre: 'La série commence', texte: 'Quinze épisodes, de Lascaux à aujourd’hui. Après chaque épisode : l’essentiel à retenir et un quiz pour vérifier ta compréhension.', auto: 9,
        principal: { libellé: `▶ Épisode 1 : ${ÉPISODES[0].titre}`, onClick: () => regarderÉpisode(ÉPISODES[0]) },
        autres: [{ libellé: '🗓️ Explorer la grande frise', onClick: () => setÉcran({ nom: 'frise' }) }, { libellé: '☰ Sommaire', onClick: sommaire }] }
    } else if (sorte === 'épisode') {
      titre = `🎬 Épisode ${k + 1} · ${ep.titre}`
      fin = { titre: `Fin de l’épisode ${k + 1}`, texte: `Avant l’épisode suivant, vérifions ta compréhension : frise, résumé, 5 questions, puis un quiz (${SEUIL} bonnes réponses sur 5 pour continuer).`, auto: 10,
        principal: { libellé: '📚 Vérifier ma compréhension', onClick: () => étudier(ep) },
        autres: [{ libellé: '↺ Revoir l’épisode', revoir: true }, { libellé: '☰ Sommaire', onClick: sommaire }] }
    } else if (sorte === 'géo') {
      titre = '🌍 Volet géographique'
      fin = { titre: 'Fin du volet géographique', principal: { libellé: '🗺️ Explorer la carte et faire le quiz', onClick: () => setÉcran({ nom: 'géo' }) }, autres: [{ libellé: '↺ Revoir', revoir: true }, { libellé: '☰ Sommaire', onClick: sommaire }] }
    } else {
      titre = '🗓️ La grande frise du livret'
      fin = { titre: 'La grande frise', principal: { libellé: '🗓️ Explorer la frise', onClick: () => setÉcran({ nom: 'frise' }) }, autres: [{ libellé: '↺ Réécouter', revoir: true }, { libellé: '☰ Sommaire', onClick: sommaire }] }
    }
    const terminé = () => {
      const auj = aujourdhuiLocal()
      if (sorte === 'ouverture') majImmersion(i => ({ ...i, ouverture: i.ouverture || auj }))
      else if (sorte === 'épisode') majÉpisode(ep.id, () => ({ vu: auj }))
      else if (sorte === 'géo') majImmersion(i => ({ ...i, géo: { ...(i.géo || {}), vu: auj } }))
    }
    return (
      <>
        <style>{CSS_IMMERSION}</style>
        <Lecteur key={`${sorte}-${ep?.id || ''}`} plans={plans} son={son} titre={titre} onFermer={() => (sorte === 'géo' ? setÉcran({ nom: 'géo' }) : sorte === 'frise' ? setÉcran({ nom: 'frise' }) : sommaire())} fin={fin} onFini={terminé} />
      </>
    )
  }

  // ---------- Écrans d'étude ----------
  let corps
  if (écran.nom === 'étude') {
    const ep = écran.ep, k = ÉPISODES.indexOf(ep), suivant = ÉPISODES[k + 1] || null
    corps = (
      <Etude key={ep.id} ep={ep} n={k + 1} suivi={suivis[ep.id]} suivant={suivant}
        onCompris={bien => majÉpisode(ep.id, s => ({ compris: s.compris || aujourdhuiLocal(), comprisBien: Math.max(s.comprisBien || 0, bien) }))}
        onQuiz={(bonnes, total) => majÉpisode(ep.id, s => ({ quiz: { bonnes, total, date: aujourdhuiLocal() }, meilleur: Math.max(s.meilleur || 0, bonnes), validé: s.validé || (bonnes >= SEUIL ? aujourdhuiLocal() : null) }))}
        onSuivant={() => suivant ? regarderÉpisode(suivant) : setÉcran({ nom: 'examen' })} onRevoir={() => regarderÉpisode(ep)} onSommaire={sommaire} />
    )
  } else if (écran.nom === 'géo') {
    corps = <Geographie suivi={im.géo} onRetour={sommaire} onRegarder={() => { assurerSon(); setÉcran({ nom: 'film', sorte: 'géo', plans: plansGéo() }) }}
      onQuiz={(bonnes, total) => majImmersion(i => ({ ...i, géo: { ...(i.géo || {}), quiz: { bonnes, total, date: aujourdhuiLocal() } } }))} />
  } else if (écran.nom === 'examen') {
    corps = <Examen suivi={im.examen || {}} onRetour={sommaire} onSérie={(thème, sues, total) => majImmersion(i => ({ ...i, examen: { ...(i.examen || {}), [thème]: { sues, total, date: aujourdhuiLocal() } } }))} />
  } else if (écran.nom === 'frise') {
    corps = (
      <div className="im-defile">
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '14px 14px 40px' }}>
          <div className="im-etiquette" style={{ color: OR }}>🗓️ Page 38 du livret, puis les dates de chaque épisode</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4.4vw, 38px)', margin: '4px 0 10px', lineHeight: 1.1 }}>La grande frise chronologique</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" className="im-bouton im-plein" onClick={() => { assurerSon(); setÉcran({ nom: 'film', sorte: 'frise', plans: [planFrise()] }) }}>🔊 Écouter la grande frise</button>
            <button type="button" className="im-bouton" aria-pressed={!friseToutes} onClick={() => setFriseToutes(false)}>★ Indispensables</button>
            <button type="button" className="im-bouton" aria-pressed={friseToutes} onClick={() => setFriseToutes(true)}>Toutes les dates</button>
            <button type="button" className="im-bouton" onClick={sommaire}>☰ Sommaire</button>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 4, paddingBottom: 8, marginBottom: 14 }} role="list" aria-label="Les périodes">
            {PÉRIODES.map(p => {
              const k = ÉPISODES.findIndex(e => e.id === p.épisode)
              return (
                <button key={p.nom} type="button" role="listitem" disabled={!ouvert(k)} onClick={() => défilerVers(`im-f-${p.épisode}`)}
                  style={{ flex: '0 0 auto', minWidth: 96, padding: '8px 10px', borderRadius: 10, border: 'none', background: `linear-gradient(160deg, ${p.couleur}, #10131c)`, color: '#fff', textAlign: 'left', cursor: 'pointer', opacity: ouvert(k) ? 1 : 0.5 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 15 }}>{p.début ?? '…'}{p.fin ? ` – ${p.fin}` : p.début ? ' –' : ''}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.2 }}>{p.court}</div>
                </button>
              )
            })}
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
            {ÉPISODES.map((e, k) => (
              <li key={e.id} id={`im-f-${e.id}`} className="im-carte" style={{ borderLeft: `5px solid ${e.couleur}`, scrollMarginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 800, flex: 1 }}>Épisode {k + 1} · {e.titre} <span style={{ opacity: 0.7, fontWeight: 500 }}>· {e.période}</span></div>
                  {ouvert(k) && <button type="button" className="im-page" onClick={() => regarderÉpisode(e)}>▶ Regarder</button>}
                </div>
                <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 4 }}>
                  {e.frise.filter(f => friseToutes || f.essentiel).map((f, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span aria-hidden="true" style={{ color: f.essentiel ? OR : '#94a3b8' }}>{f.essentiel ? '★' : '○'}</span>
                      <span style={{ fontFamily: SERIF, fontWeight: 700, minWidth: 'min(34%, 150px)' }}>{f.date}</span>
                      <span style={{ lineHeight: 1.35, opacity: f.essentiel ? 1 : 0.8 }}>{f.texte}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  } else {
    // ---------- Sommaire ----------
    const déjàVu = !!im.ouverture
    const suite = prochain >= 0 ? ÉPISODES[prochain] : null
    const cartes = []
    for (const s of ÉTAPES) {
      if (s.horsLivret) { cartes.push({ sorte: 'hors', s }); continue }
      const déjà = cartes.find(c => c.ep?.id === s.épisode)
      if (déjà) déjà.étapes.push(s.n); else cartes.push({ sorte: 'ep', ep: ÉPISODES.find(e => e.id === s.épisode), étapes: [s.n] })
    }
    corps = (
      <div className="im-defile">
        <div style={{ position: 'relative', padding: 'clamp(22px, 6vh, 56px) 16px clamp(18px, 4vh, 36px)', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 0%, #2a2140 0%, #0b0e18 60%, #07090f 100%)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="im-etiquette" style={{ color: OR, letterSpacing: '.35em' }}>Livret du citoyen 2026</div>
          <h2 className="im-titre-film" style={{ fontSize: 'clamp(40px, 10vw, 84px)', margin: '8px 0 6px' }}>Immersion</h2>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(17px, 2.6vw, 22px)', margin: '0 auto 16px', maxWidth: 640, lineHeight: 1.4 }}>L’histoire de France comme un film historique : 15 épisodes, de Lascaux à aujourd’hui, racontés d’après le livret uniquement.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!déjàVu
              ? <button type="button" className="im-bouton im-plein im-lueur" onClick={ouverture} style={{ minHeight: 54, fontSize: 17, padding: '0 22px', borderRadius: 27 }} autoFocus>▶ Commencer : la bande-annonce</button>
              : suite
                ? <button type="button" className="im-bouton im-plein im-lueur" onClick={() => (suivis[suite.id]?.vu ? étudier(suite) : regarderÉpisode(suite))} style={{ minHeight: 54, fontSize: 17, padding: '0 22px', borderRadius: 27 }} autoFocus>▶ {suivis[suite.id]?.vu ? 'Valider' : 'Continuer'} : épisode {prochain + 1}</button>
                : <button type="button" className="im-bouton im-plein" onClick={() => setÉcran({ nom: 'examen' })} style={{ minHeight: 54, fontSize: 17, padding: '0 22px', borderRadius: 27 }}>🎓 Série terminée : préparer l’examen</button>}
            {déjàVu && <button type="button" className="im-bouton" onClick={ouverture}>🎞️ Bande-annonce</button>}
            <button type="button" className="im-bouton" onClick={() => setÉcran({ nom: 'frise' })}>🗓️ Grande frise</button>
          </div>
          <div style={{ maxWidth: 420, margin: '18px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.85, marginBottom: 5 }}><span>Progression</span><span>{nbValidés} / {ÉPISODES.length} épisodes validés</span></div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}><div style={{ width: `${(nbValidés / ÉPISODES.length) * 100}%`, height: '100%', background: `linear-gradient(90deg, #f59e0b, ${OR})`, transition: 'width .6s ease' }} /></div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 14px 40px' }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 24, margin: '0 0 4px' }}>📺 Les épisodes</h3>
          <p style={{ margin: '0 0 12px', opacity: 0.8, lineHeight: 1.45 }}>Le plan en 18 étapes, dans l’ordre chronologique. Un épisode s’ouvre quand le précédent est validé ({SEUIL}/5 au quiz).</p>
          <div className="im-grille">
            {cartes.map(c => {
              if (c.sorte === 'hors') {
                return (
                  <div key={`h${c.s.n}`} className="im-episode" style={{ cursor: 'default', background: 'repeating-linear-gradient(135deg, #12151f, #12151f 10px, #151925 10px, #151925 20px)', borderStyle: 'dashed', opacity: 0.85 }}>
                    <div className="im-etiquette" style={{ color: '#fca5a5' }}>Étape {c.s.n} · 📕 hors livret</div>
                    <div style={{ fontWeight: 800, fontSize: 16.5 }}>{c.s.titre}</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.4, opacity: 0.85 }}>{c.s.horsLivret}</div>
                  </div>
                )
              }
              const ep = c.ep, k = ÉPISODES.indexOf(ep), s = suivis[ep.id] || {}, libre = ouvert(k)
              const statut = s.validé ? `✅ Validé · ${s.meilleur ?? s.quiz?.bonnes}/5` : s.vu ? '📚 Vu · quiz à réussir' : libre ? '▶ À regarder' : `🔒 Valide l’épisode ${k}`
              return (
                <div key={ep.id} className="im-episode" style={{ cursor: 'default', background: `linear-gradient(160deg, ${ep.couleur}${libre ? 'dd' : '55'}, #0c0f18 75%)`, borderColor: s.validé ? OR : 'rgba(255,255,255,.14)' }}>
                  <div className="im-etiquette" style={{ color: '#fff', opacity: 0.85 }}>Épisode {numéroÉpisode(ep.id)} · {c.étapes.length > 1 ? `étapes ${c.étapes.join(' et ')}` : `étape ${c.étapes[0]}`}</div>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 20, lineHeight: 1.15 }}>{ep.titre}</div>
                  <div style={{ fontSize: 13.5, opacity: 0.85 }}>{ep.période}{ep.horsLivret ? ' · en partie hors livret' : ''}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.validé ? OR : '#fff', marginTop: 2 }}>{statut}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="im-bouton" disabled={!libre} onClick={() => regarderÉpisode(ep)} style={{ minHeight: 38, fontSize: 13.5, background: 'rgba(0,0,0,.35)' }} aria-label={`Regarder l’épisode ${k + 1} : ${ep.titre}`}>{libre ? '▶ Regarder' : '🔒 Verrouillé'}</button>
                    {libre && (s.vu || s.validé) && <button type="button" className="im-bouton" onClick={() => étudier(ep)} style={{ minHeight: 38, fontSize: 13.5, background: 'rgba(0,0,0,.35)' }}>📚 Étude et quiz</button>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="im-grille" style={{ marginTop: 18 }}>
            <button type="button" className="im-episode" onClick={() => setÉcran({ nom: 'géo' })} style={{ background: 'linear-gradient(160deg, #0369a1, #0c0f18 75%)' }}>
              <div className="im-etiquette">Volet géographique · p. 49 à 51</div>
              <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 20 }}>🌍 Fleuves, montagnes, mers et frontières</div>
              <div style={{ fontSize: 13.5, opacity: 0.85 }}>La Seine, la Loire, la Garonne, le Rhône, le Rhin · carte à explorer · quiz{im.géo?.quiz ? ` (${im.géo.quiz.bonnes}/${im.géo.quiz.total})` : ''}</div>
            </button>
            <button type="button" className="im-episode" onClick={() => setÉcran({ nom: 'examen' })} style={{ background: 'linear-gradient(160deg, #7c2d12, #0c0f18 75%)' }}>
              <div className="im-etiquette">Examen civique 2026</div>
              <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 20 }}>🎓 Préparer l’examen</div>
              <div style={{ fontSize: 13.5, opacity: 0.85 }}>Institutions, symboles, valeurs, histoire… questions du type examen, réponses exactes du livret.</div>
            </button>
          </div>

          <div style={{ marginTop: 22, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.04)', fontSize: 13.5, lineHeight: 1.55, opacity: 0.85 }}>
            📕 <strong>Uniquement le livret.</strong> Chaque phrase vient du Livret du citoyen 2026 (page citée). Les étapes que le livret ne présente pas (la Gaule, César, Charlemagne, les rois capétiens, la Renaissance) sont signalées « hors livret », sans rien ajouter. Les cartes montrent les frontières actuelles, pour se repérer. Voix : enregistrées à l’avance (synthèse vocale « Natural »).
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!im.libre} onChange={e => majImmersion(i => ({ ...i, libre: e.target.checked }))} />
              <span>🔓 Accès libre à tous les épisodes (révision)</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="im-ecran" role="dialog" aria-modal="true" aria-label="Immersion dans le Livret du citoyen 2026">
      <style>{CSS_IMMERSION}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'max(8px, env(safe-area-inset-top)) 10px 8px', background: '#000', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <button type="button" className="im-bouton im-rond" onClick={écran.nom === 'accueil' ? onFermer : sommaire} aria-label={écran.nom === 'accueil' ? 'Fermer l’Immersion' : 'Revenir au sommaire'}>{écran.nom === 'accueil' ? '✕' : '←'}</button>
        <div style={{ flex: 1, minWidth: 0, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎬 Immersion · Livret du citoyen 2026</div>
        <div style={{ fontSize: 12.5, opacity: 0.75, whiteSpace: 'nowrap' }}>{nbValidés}/{ÉPISODES.length} ✅</div>
      </div>
      {corps}
    </div>
  )
}
