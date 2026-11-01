import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { TOKEN_KEY, lireFichierBinaire } from '../lib/githubSync'

// Set de questions AWS CloudOps (SOA-C03). Le contenu (questions en anglais,
// discussions, explications) est dans le dépôt de données PRIVÉ : il est lu
// avec le token GitHub et gardé en cache sur l'appareil. Une section par
// question : répondre → correction → explication → simulation console →
// discussion d'origine.

const CHEMIN = 'react-blocks/src/data/aws-soa-c03.json'
const CACHE = 'react-blocs-set-soa'
const CLÉ_PROGRÈS = 'react-blocs-set-soa-progres'
const DOMAINES = { surveillance: '📈 Surveillance', fiabilite: '🛟 Fiabilité', deploiement: '🚀 Déploiement', securite: '🔐 Sécurité', reseau: '🌐 Réseau' }
const lire = (k, défaut) => { try { return JSON.parse(localStorage.getItem(k)) ?? défaut } catch { return défaut } }
const gras = t => (t || '').split(/(\*\*[^*]+\*\*)/g).map((m, i) => (m.startsWith('**') ? <strong key={i}>{m.slice(2, -2)}</strong> : m))
const égal = (a, b) => a.length === b.length && [...a].sort().join('') === [...b].sort().join('')

export default function SetQuestions() {
  const { espace: espaceParam } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espaceParam || 'perso')]
  const espace = espaceParam || `${foyer.préfixe}perso`
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [set, setSet] = useState(() => lire(CACHE, null))
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [progrès, setProgrès] = useState(() => lire(CLÉ_PROGRÈS, {}))
  const [filtre, setFiltre] = useState('toutes')
  const [domaine, setDomaine] = useState('')
  const [recherche, setRecherche] = useState('')
  const [n, setN] = useState(null)
  const haut = useRef(null)
  const [grille, setGrille] = useState(false)

  const charger = async () => {
    const token = localStorage.getItem(TOKEN_KEY) || ''
    if (!token) { setErreur('Ces questions sont dans ton dépôt privé : connecte ton token GitHub (dans la Prépa AWS ou Mémoriser) pour les lire.'); return }
    setChargement(true); setErreur('')
    try {
      const d = JSON.parse(await (await lireFichierBinaire(CHEMIN, token)).text())
      setSet(d)
      try { localStorage.setItem(CACHE, JSON.stringify(d)) } catch { /* trop gros : pas de cache */ }
    } catch (e) { if (!set) setErreur(`Lecture impossible : ${e.message}`) }
    setChargement(false)
  }
  useEffect(() => { charger() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const questions = set?.questions || []
  const noter = (num, champs) => setProgrès(p => {
    const x = { ...p, [num]: { ...(p[num] || {}), ...champs } }
    try { localStorage.setItem(CLÉ_PROGRÈS, JSON.stringify(x)) } catch { /* ignore */ }
    return x
  })
  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return questions.filter(x => {
      const p = progrès[x.n]
      if (filtre === 'nonfaites' && p?.choix) return false
      if (filtre === 'ratees' && !(p?.choix && !p.juste)) return false
      if (filtre === 'marquees' && !p?.marquée) return false
      if (filtre === 'doutes' && !(x.doute || x.accord === false)) return false
      if (domaine && x.domaine !== domaine) return false
      if (q && !`${x.n} ${x.question} ${x.choix.map(c => c.t).join(' ')}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [questions, progrès, filtre, domaine, recherche])
  const faites = questions.filter(x => progrès[x.n]?.choix)
  const justes = faites.filter(x => progrès[x.n].juste)
  const ouvrir = num => { setN(num); setGrille(false); setTimeout(() => haut.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30) }
  const idx = liste.findIndex(x => x.n === n)
  // Au chargement : ouvrir la première question pas encore faite.
  useEffect(() => { if (set && n === null && questions.length) setN((questions.find(x => !progrès[x.n]?.choix) || questions[0]).n) }, [set]) // eslint-disable-line react-hooks/exhaustive-deps
  const courante = questions.find(x => x.n === n)

  const puce = actif => ({ minHeight: 36, padding: '0 12px', borderRadius: 18, border: `1px solid ${actif ? T.accent : T.border}`, background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' })

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '20px 16px 60px', color: T.text }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link to={`/prepa/aws/${espace}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36 }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Prépa AWS CloudOps</Link>
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
        <p style={{ fontFamily: grotesk, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent, margin: '0 0 4px', fontWeight: 600 }}>AWS Certified CloudOps Engineer – Associate (SOA-C03)</p>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 30, margin: '0 0 10px', lineHeight: 1.1 }}>📚 Set de questions</h1>

        {!set && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 14.5 }}>{chargement ? 'Chargement des questions…' : erreur || 'Aucune question chargée.'}</p>
            {!chargement && <button onClick={charger} style={puce(true)}>Réessayer</button>}
          </div>
        )}

        {set && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {[[`${faites.length}/${questions.length}`, 'répondues'], [faites.length ? `${Math.round((justes.length / faites.length) * 100)} %` : '—', 'de bonnes réponses'], [Object.values(progrès).filter(p => p.marquée).length, 'à revoir ⭐']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}` }}>
                  <div style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 20 }}>{v}</div><div style={{ fontSize: 12, color: T.textMuted }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 8, borderRadius: 4, background: T.surface2, overflow: 'hidden', marginBottom: 14 }}><div style={{ height: '100%', width: `${(faites.length / Math.max(1, questions.length)) * 100}%`, background: T.accent }} /></div>

            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }} role="tablist" aria-label="Filtre">
              {[['toutes', 'Toutes'], ['nonfaites', 'Non faites'], ['ratees', 'Ratées'], ['marquees', '⭐ À revoir'], ['doutes', '⚠️ Réponse discutée']].map(([id, nom]) => <button key={id} role="tab" aria-selected={filtre === id} onClick={() => setFiltre(id)} style={puce(filtre === id)}>{nom}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }} aria-label="Domaine">
              <button onClick={() => setDomaine('')} style={puce(!domaine)}>Tous domaines</button>
              {Object.entries(DOMAINES).map(([id, nom]) => <button key={id} onClick={() => setDomaine(d => (d === id ? '' : id))} style={puce(domaine === id)}>{nom}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher (mot anglais, n°…)" aria-label="Rechercher une question"
                style={{ flex: 1, minWidth: 0, minHeight: 40, padding: '0 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 15 }} />
              <button onClick={() => liste.length && ouvrir(liste[Math.floor(Math.random() * liste.length)].n)} style={puce(false)} title="Question au hasard">🎲</button>
            </div>

            {/* Une pastille par question (section), repliable */}
            <button onClick={() => setGrille(g => !g)} aria-expanded={grille} style={{ ...puce(false), width: '100%', minHeight: 42, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📋 Toutes les questions ({liste.length})</span><span>{grille ? '▲' : '▼'}</span>
            </button>
            {grille && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }} aria-label={`${liste.length} questions`}>
              {liste.map(x => {
                const p = progrès[x.n]
                const fond = p?.choix ? (p.juste ? '#2e9e6b' : T.danger) : T.surface
                return (
                  <button key={x.n} onClick={() => ouvrir(x.n)} aria-label={`Question ${x.n}${p?.choix ? (p.juste ? ', juste' : ', ratée') : ''}`} aria-current={x.n === n}
                    style={{ width: 42, height: 38, borderRadius: 8, border: `2px solid ${x.n === n ? T.accent : p?.marquée ? '#e0a100' : T.border}`, background: fond, color: p?.choix ? '#fff' : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13, cursor: 'pointer', position: 'relative' }}>
                    {x.n}{(x.doute || x.accord === false) && <span style={{ position: 'absolute', top: -6, right: -4, fontSize: 10 }}>⚠️</span>}
                  </button>
                )
              })}
              {!liste.length && <p style={{ color: T.textMuted, fontSize: 14 }}>Aucune question pour ce filtre.</p>}
            </div>}

            <div ref={haut} style={{ scrollMarginTop: 12 }} />
            {courante && <SectionQuestion key={courante.n} T={T} q={courante} p={progrès[courante.n]} noter={champs => noter(courante.n, champs)}
              précédente={idx > 0 ? () => ouvrir(liste[idx - 1].n) : null} suivante={idx >= 0 && idx < liste.length - 1 ? () => ouvrir(liste[idx + 1].n) : null} />}
            {!courante && <p style={{ textAlign: 'center', color: T.textMuted, fontSize: 14 }}>Touche un numéro pour ouvrir sa section.</p>}
            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 20, lineHeight: 1.5 }}>{set.source || ''} Les réponses « votées » viennent de la discussion d'origine ; chaque réponse a été revérifiée, et les écarts sont signalés par ⚠️.</p>
          </>
        )}
      </div>
    </div>
  )
}

function SectionQuestion({ T, q, p, noter, précédente, suivante }) {
  const nb = q.réponse.length
  const [choix, setChoix] = useState(() => p?.choix || [])
  const [validée, setValidée] = useState(!!p?.choix)
  const [étapes, setÉtapes] = useState(() => new Set(p?.étapes || []))
  const [discussion, setDiscussion] = useState(false)
  const juste = égal(choix, q.réponse)
  const basculerChoix = l => { if (validée) return; setChoix(c => (nb === 1 ? [l] : c.includes(l) ? c.filter(x => x !== l) : [...c, l])) }
  const valider = () => { setValidée(true); noter({ choix, juste: égal(choix, q.réponse), date: new Date().toISOString() }) }
  const réessayer = () => { setValidée(false); setChoix([]) }
  const bloc = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 12 }
  const titre = { fontFamily: grotesk, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 8px' }
  const bouton = (plein = false) => ({ minHeight: 44, padding: '0 16px', borderRadius: 22, border: plein ? 'none' : `1px solid ${T.border}`, background: plein ? T.accent : T.surface, color: plein ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 14, cursor: 'pointer' })
  return (
    <section aria-label={`Question ${q.n}`}>
      <div style={bloc}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <h2 style={{ flex: 1, margin: 0, fontFamily: grotesk, fontSize: 18, color: T.accent }}>Question {q.n} <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>· Topic {q.topic}{q.domaine ? ` · ${DOMAINES[q.domaine] || q.domaine}` : ''}</span></h2>
          <button onClick={() => noter({ marquée: !p?.marquée })} aria-pressed={!!p?.marquée} title="Marquer à revoir" style={{ ...bouton(), minHeight: 36, padding: '0 10px', borderColor: p?.marquée ? '#e0a100' : T.border }}>{p?.marquée ? '⭐' : '☆'}</button>
        </div>
        <p lang="en" style={{ margin: '0 0 12px', fontSize: 16, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{q.question}</p>
        {nb > 1 && <p style={{ margin: '0 0 8px', fontSize: 13, color: T.accent, fontFamily: grotesk, fontWeight: 700 }}>Choisis {nb} réponses</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role={nb === 1 ? 'radiogroup' : 'group'}>
          {q.choix.map(c => {
            const pris = choix.includes(c.l), bon = q.réponse.includes(c.l)
            const couleur = validée ? (bon ? '#2e9e6b' : pris ? T.danger : T.border) : pris ? T.accent : T.border
            return (
              <button key={c.l} lang="en" role={nb === 1 ? 'radio' : 'checkbox'} aria-checked={pris} onClick={() => basculerChoix(c.l)}
                style={{ display: 'flex', gap: 10, textAlign: 'left', padding: '11px 12px', borderRadius: 10, minHeight: 48, border: `2px solid ${couleur}`, background: validée && bon ? '#2e9e6b1c' : validée && pris ? T.dangerSoft : pris ? `${T.accent}18` : T.bg, color: T.text, fontSize: 15, lineHeight: 1.45, cursor: validée ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                <strong style={{ fontFamily: grotesk, color: T.accent }}>{c.l}.</strong><span style={{ flex: 1 }}>{c.t}</span>{validée && bon && '✓'}{validée && pris && !bon && '✗'}
              </button>
            )
          })}
        </div>
        {!validée
          ? <button onClick={valider} disabled={choix.length !== nb} style={{ ...bouton(true), width: '100%', marginTop: 12, opacity: choix.length === nb ? 1 : 0.5 }}>Valider ma réponse</button>
          : (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: juste ? '#2e9e6b1c' : T.dangerSoft }}>
              <strong style={{ fontFamily: grotesk, color: juste ? '#1f7a50' : T.danger }}>{juste ? '🎉 Bonne réponse' : '❌ Pas tout à fait'} — réponse : {q.réponse.join(', ')}</strong>
              {(q.accord === false || q.doute) && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: T.text }}>⚠️ Réponse votée : <strong>{(q.réponseVotée || []).join(', ')}</strong> ({q.votes}). {q.doute}</p>}
              {q.accord !== false && !q.doute && q.votes && <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textMuted }}>Discussion : {q.votes}</p>}
            </div>
          )}
      </div>

      {validée && (
        <>
          {q.explication && (
            <div style={bloc}>
              <p style={titre}>📖 Explication détaillée</p>
              <div style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{gras(q.explication)}</div>
              {q.aRetenir && <p style={{ margin: '12px 0 0', padding: '8px 12px', borderRadius: 10, background: `${T.accent}18`, fontSize: 14.5 }}>💡 <strong>À retenir :</strong> {q.aRetenir}</p>}
            </div>
          )}
          {q.console?.length > 0 && (
            <div style={bloc}>
              <p style={titre}>🖥️ Le simuler dans la console AWS ({étapes.size}/{q.console.length})</p>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.console.map((é, i) => (
                  <li key={i}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 10, background: étapes.has(i) ? '#2e9e6b14' : T.bg, cursor: 'pointer', fontSize: 14.5, lineHeight: 1.5 }}>
                      <input type="checkbox" checked={étapes.has(i)} onChange={() => setÉtapes(s => { const x = new Set(s); if (x.has(i)) x.delete(i); else x.add(i); noter({ étapes: [...x] }); return x })} style={{ width: 20, height: 20, marginTop: 2, accentColor: '#2e9e6b', flexShrink: 0 }} />
                      <span><strong style={{ fontFamily: grotesk }}>{i + 1}.</strong> {gras(é)}</span>
                    </label>
                  </li>
                ))}
              </ol>
              {q.nettoyage && <p style={{ margin: '10px 0 0', fontSize: 13.5, color: '#b07400' }}>🧹 Nettoyage : {q.nettoyage}</p>}
              <p style={{ margin: '6px 0 0', fontSize: 12, color: T.textMuted }}>À faire sur un compte d'entraînement, avec une alerte de budget.</p>
            </div>
          )}
          {q.discussion?.length > 0 && (
            <div style={bloc}>
              <button onClick={() => setDiscussion(d => !d)} aria-expanded={discussion} style={{ ...titre, margin: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, minHeight: 32 }}>💬 Discussion d'origine ({q.discussion.length}) {discussion ? '▲' : '▼'}</button>
              {discussion && (
                <div lang="en" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {q.discussion.map((c, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: T.bg, borderLeft: `3px solid ${T.border}`, marginLeft: c.réponse ? 24 : 0 }}>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}><strong style={{ color: T.text }}>{c.auteur}</strong> · {c.date}{c.vote && <> · <span style={{ background: '#2e9e6b22', color: '#1f7a50', padding: '0 6px', borderRadius: 4, fontWeight: 700 }}>{c.vote}</span></>}{c.likes ? ` · 👍 ${c.likes}` : ''}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.texte}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={précédente} disabled={!précédente} style={{ ...bouton(), opacity: précédente ? 1 : 0.4 }}>◀ Précédente</button>
        {validée && <button onClick={réessayer} style={bouton()}>↻ Réessayer</button>}
        <span style={{ flex: 1 }} />
        <button onClick={suivante} disabled={!suivante} style={{ ...bouton(true), opacity: suivante ? 1 : 0.4 }}>Suivante ▶</button>
      </div>
    </section>
  )
}
