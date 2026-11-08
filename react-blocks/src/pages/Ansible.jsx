import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import BlocCode from '../components/BlocCode'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { modifierOutil, lireLocal } from '../lib/donneesFoyer'
import { DÉFINITIONS, BASES, EXEMPLES, SIMULATIONS, QUEL_MODULE, QCM, RETENIR, AIDE_MÉMOIRE, STRUCTURE } from '../lib/ansible/cours'

const ÉTAPES = [
  ['definitions', '📖', 'Définitions'],
  ['bases', '🧱', 'Les bases'],
  ['exemples', '🧪', 'Exemples'],
  ['simulateur', '🎮', 'Simulateur'],
  ['quiz', '❓', 'Quiz'],
  ['retenir', '✅', 'À retenir'],
]
const CLÉ = 'react-blocs-ansible'
const lireProgrès = () => { try { return JSON.parse(localStorage.getItem(CLÉ) || '{}') } catch { return {} } }
const mélanger = l => { const c = [...l]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] } return c }
const CSS = `
@keyframes an-monte { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
@keyframes an-pop { from { opacity: 0; transform: scale(.6) } to { opacity: 1; transform: none } }
@keyframes an-paquet { 0% { offset-distance: 0%; opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { offset-distance: 100%; opacity: 0 } }
@keyframes an-curseur { 50% { opacity: 0 } }
@keyframes an-secoue { 0%, 100% { transform: none } 25%, 75% { transform: translateX(-6px) } 50% { transform: translateX(6px) } }
.an-monte { animation: an-monte .45s ease-out both }
.an-carte { perspective: 900px; cursor: pointer }
.an-carte-int { position: relative; height: 100%; transition: transform .55s cubic-bezier(.2,.8,.25,1); transform-style: preserve-3d }
.an-carte[aria-pressed="true"] .an-carte-int { transform: rotateY(180deg) }
.an-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 14px; padding: 14px; box-sizing: border-box; overflow: hidden }
.an-dos { transform: rotateY(180deg); overflow-y: auto }
.an-faux { animation: an-secoue .4s }
@media (prefers-reduced-motion: reduce) { .an-carte-int { transition: none } .an-monte { animation: none } }
`

export default function Ansible() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [params, setParams] = useSearchParams()
  const étape = ÉTAPES.some(e => e[0] === params.get('etape')) ? params.get('etape') : 'definitions'
  const [progrès, setProgrès] = useState(lireProgrès)
  const [message, setMessage] = useState('')
  const afficher = t => { setMessage(t); setTimeout(() => setMessage(m => (m === t ? '' : m)), 3500) }
  const enregistrer = fn => setProgrès(p => { const n = fn(p); try { localStorage.setItem(CLÉ, JSON.stringify(n)) } catch { /* ignore */ } return n })
  const iÉtape = ÉTAPES.findIndex(e => e[0] === étape)
  // Avancer vers une étape suivante compte l'étape quittée comme faite.
  const aller = id => {
    if (ÉTAPES.findIndex(e => e[0] === id) > iÉtape) enregistrer(p => ({ ...p, faites: { ...(p.faites || {}), [étape]: p.faites?.[étape] || new Date().toISOString().slice(0, 10) } }))
    setParams(id === 'definitions' ? {} : { etape: id }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const faites = ÉTAPES.filter(e => progrès.faites?.[e[0]]).length
  const suivant = () => {
    enregistrer(p => ({ ...p, faites: { ...(p.faites || {}), [étape]: new Date().toISOString().slice(0, 10) } }))
    if (iÉtape < ÉTAPES.length - 1) aller(ÉTAPES[iÉtape + 1][0])
  }
  const S = useMemo(() => ({
    carte: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 14 },
    titre: { fontFamily: grotesk, fontSize: 11.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 10px' },
    bouton: (plein = false) => ({ minHeight: 44, padding: '0 16px', borderRadius: 12, border: `1px solid ${plein ? T.accent : T.border}`, background: plein ? T.accent : T.surface, color: plein ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }),
    discret: { color: T.textMuted, fontSize: 14, margin: 0, lineHeight: 1.55 },
  }), [T])

  // Cartes Mémoriser : les définitions (identifiants fixes, sans doublon).
  const versMémoriser = async () => {
    const auj = new Date().toISOString().slice(0, 10)
    let ajoutées = 0
    try {
      await modifierOutil('memoriser', espace, d => {
        const paquets = (d.paquets || []).some(p => p.id === 'ans-paquet') ? d.paquets : [...(d.paquets || []), { id: 'ans-paquet', nom: '⚙️ Ansible', couleur: '#ee0000' }]
        const déjà = new Set((d.cartes || []).map(c => c.id))
        const neuves = DÉFINITIONS.map((x, i) => ({ id: `ans-def-${i}`, paquetId: 'ans-paquet', recto: `Ansible : ${x.emoji} ${x.terme}, c'est quoi ?`, verso: `${x.déf}\n\n💡 ${x.analogie}\n\n\`\`\`\n${x.code}\n\`\`\``, niveau: 0, prochaineRevision: auj })).filter(c => !déjà.has(c.id))
        ajoutées = neuves.length
        return { ...d, paquets, cartes: [...(d.cartes || []), ...neuves] }
      }, lireLocal('memoriser', espace))
      afficher(ajoutées ? `🧠 ${ajoutées} cartes ajoutées au paquet « ⚙️ Ansible »` : 'Les définitions sont déjà dans Mémoriser')
    } catch (e) { afficher(`Cartes non ajoutées : ${e.message}`) }
  }

  const autre = espace.endsWith('pro') ? espace.replace(/pro$/, 'perso') : espace.replace(/perso$/, 'pro')
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: 'max(18px, env(safe-area-inset-top)) 16px 70px' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36, textDecoration: 'none' }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
              {[espace.endsWith('pro') ? autre : espace, espace.endsWith('pro') ? espace : autre].map(e => (
                <Link key={e} to={`/ansible/${e}${étape !== 'definitions' ? `?etape=${étape}` : ''}`} style={{ fontSize: 12, fontFamily: grotesk, fontWeight: 600, padding: '7px 12px', borderRadius: 6, textDecoration: 'none', background: e === espace ? T.accent : 'transparent', color: e === espace ? T.accentText : T.textMuted }}>{e.endsWith('pro') ? 'Pro' : 'Perso'}</Link>
              ))}
            </div>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
          </div>
        </div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 6vw, 38px)', margin: '0 0 4px', lineHeight: 1.1 }}>⚙️ Learning Ansible</h1>
        <p style={{ ...S.discret, marginBottom: 12 }}>Automatiser des serveurs, de zéro : les mots, les bases, des exemples, un terminal pour voir, un quiz, et l'essentiel à retenir.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.surface2 }} role="progressbar" aria-valuenow={faites} aria-valuemin={0} aria-valuemax={ÉTAPES.length} aria-label="Étapes terminées"><div style={{ width: `${(faites / ÉTAPES.length) * 100}%`, height: '100%', borderRadius: 4, background: '#ee0000', transition: 'width .4s' }} /></div>
          <span style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 13 }}>{faites}/{ÉTAPES.length}</span>
        </div>
        <nav aria-label="Étapes de la formation" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
          {ÉTAPES.map(([id, emoji, nom], k) => (
            <button key={id} onClick={() => aller(id)} aria-current={étape === id ? 'step' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 6, minHeight: 42, padding: '0 13px', borderRadius: 21, flexShrink: 0, cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 13.5,
              background: étape === id ? T.accent : T.surface, color: étape === id ? T.accentText : T.text, border: `1px solid ${étape === id ? T.accent : T.border}`,
            }}><span style={{ fontSize: 11, opacity: 0.75 }}>{k + 1}</span><span aria-hidden="true">{progrès.faites?.[id] ? '✓' : emoji}</span>{nom}</button>
          ))}
        </nav>

        <div key={étape} className="an-monte">
          {étape === 'definitions' && <Définitions T={T} S={S} versMémoriser={versMémoriser} />}
          {étape === 'bases' && <Bases T={T} S={S} />}
          {étape === 'exemples' && <Exemples T={T} S={S} versSimulateur={() => aller('simulateur')} />}
          {étape === 'simulateur' && <Simulateur T={T} S={S} />}
          {étape === 'quiz' && <Quiz T={T} S={S} meilleur={progrès.quiz} onScore={(n, total) => enregistrer(p => ({ ...p, quiz: Math.max(p.quiz || 0, Math.round((n / total) * 100)) }))} />}
          {étape === 'retenir' && <ARetenir T={T} S={S} />}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 18 }}>
          {iÉtape > 0 ? <button onClick={() => aller(ÉTAPES[iÉtape - 1][0])} style={S.bouton(false)}>← {ÉTAPES[iÉtape - 1][2]}</button> : <span />}
          <button onClick={suivant} style={S.bouton(true)}>{iÉtape < ÉTAPES.length - 1 ? `✓ Compris · ${ÉTAPES[iÉtape + 1][2]} →` : progrès.faites?.retenir ? '🎓 Formation terminée' : '🎓 Terminer la formation'}</button>
        </div>
      </div>
      {message && <div role="status" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 60, maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: 12, fontSize: 14, background: T.text, color: T.bg, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>{message}</div>}
    </div>
  )
}

// ---------- 1. Définitions ----------
function Définitions({ T, S, versMémoriser }) {
  const [retournées, setRetournées] = useState({})
  const [liste, setListe] = useState(false)
  const tout = Object.keys(retournées).length === DÉFINITIONS.length && Object.values(retournées).every(Boolean)
  return (
    <section aria-labelledby="t-def">
      <h2 id="t-def" style={S.titre}>📖 Les {DÉFINITIONS.length} mots d'Ansible</h2>
      <p style={{ ...S.discret, marginBottom: 12 }}>Devine la définition, puis touche la carte pour la retourner. Chaque mot a une image pour s'en souvenir.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button onClick={() => setListe(l => !l)} style={S.bouton(false)}>{liste ? '🃏 Mode cartes' : '📋 Mode liste'}</button>
        {!liste && <button onClick={() => setRetournées(tout ? {} : Object.fromEntries(DÉFINITIONS.map((_, i) => [i, true])))} style={S.bouton(false)}>{tout ? '↺ Tout cacher' : '👀 Tout retourner'}</button>}
        <button onClick={versMémoriser} style={S.bouton(false)}>🧠 Ajouter à Mémoriser</button>
      </div>
      {liste ? (
        <div style={S.carte}>
          {DÉFINITIONS.map(d => (
            <div key={d.terme} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
              <strong style={{ fontSize: 15.5 }}>{d.emoji} {d.terme}</strong>
              <p style={{ margin: '4px 0', fontSize: 14.5, lineHeight: 1.5 }}>{d.déf}</p>
              <p style={{ ...S.discret, fontSize: 13 }}>💡 {d.analogie}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
          {DÉFINITIONS.map((d, i) => (
            <div key={d.terme} role="button" tabIndex={0} aria-pressed={!!retournées[i]} aria-label={`${d.terme} : ${retournées[i] ? d.déf : 'toucher pour voir la définition'}`} className="an-carte" style={{ height: 230 }}
              onClick={() => setRetournées(r => ({ ...r, [i]: !r[i] }))} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRetournées(r => ({ ...r, [i]: !r[i] })) } }}>
              <div className="an-carte-int">
                <div className="an-face" style={{ background: `linear-gradient(145deg, ${T.surface}, ${T.surface2})`, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8 }}>
                  <span style={{ fontSize: 46 }}>{d.emoji}</span>
                  <strong style={{ fontSize: 18, fontFamily: grotesk }}>{d.terme}</strong>
                  <span style={{ fontSize: 12, color: T.textMuted }}>Touche pour retourner</span>
                </div>
                <div className="an-face an-dos" style={{ background: '#1b1d29', color: '#f4f4f6', border: '1px solid #ee000055' }}>
                  <strong style={{ display: 'block', fontSize: 14.5, marginBottom: 6, color: '#ff8a8a' }}>{d.emoji} {d.terme}</strong>
                  <p style={{ margin: '0 0 8px', fontSize: 13.5, lineHeight: 1.45 }}>{d.déf}</p>
                  <p style={{ margin: '0 0 8px', fontSize: 12.5, lineHeight: 1.4, color: '#ffd166' }}>💡 {d.analogie}</p>
                  <code style={{ display: 'block', whiteSpace: 'pre-wrap', fontSize: 11.5, background: '#0d0f14', padding: '6px 8px', borderRadius: 6, color: '#9be7c4' }}>{d.code}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// Schéma animé : le nœud de contrôle envoie des modules aux serveurs en SSH.
function SchémaArchi({ T }) {
  const cibles = [['web1', 40], ['web2', 110], ['db1', 180]]
  return (
    <svg viewBox="0 0 340 220" style={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '4px auto 10px' }} role="img" aria-label="Le nœud de contrôle se connecte en SSH à web1, web2 et db1">
      <rect x="10" y="80" width="110" height="60" rx="12" fill="#ee0000" opacity=".9" />
      <text x="65" y="106" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">🖥️ Contrôle</text>
      <text x="65" y="124" textAnchor="middle" fontSize="10" fill="#fff">ansible-playbook</text>
      {cibles.map(([nom, y], k) => {
        const chemin = `M120,110 C180,110 180,${y + 20} 240,${y + 20}`
        return (
          <g key={nom}>
            <path d={chemin} fill="none" stroke={T.textMuted} strokeWidth="2" strokeDasharray="5 5" />
            <text x="176" y={y + 8 + (k === 1 ? 2 : 0)} fontSize="9" fill={T.textMuted}>SSH</text>
            <rect x="240" y={y} width="90" height="40" rx="10" fill={T.surface2} stroke={T.border} />
            <text x="285" y={y + 25} textAnchor="middle" fontSize="12" fontWeight="700" fill={T.text}>🗄️ {nom}</text>
            <circle r="6" fill="#ffd166" style={{ offsetPath: `path("${chemin}")`, animation: `an-paquet 2.4s ease-in-out ${k * 0.5}s infinite` }} />
          </g>
        )
      })}
      <text x="170" y="214" textAnchor="middle" fontSize="10" fill={T.textMuted}>● module envoyé, exécuté, résultat JSON renvoyé</text>
    </svg>
  )
}

// ---------- 2. Bases ----------
function Bases({ T, S }) {
  const [ouvert, setOuvert] = useState(BASES[0].id)
  return (
    <section aria-labelledby="t-bases">
      <h2 id="t-bases" style={S.titre}>🧱 Les bases en {BASES.length} leçons courtes</h2>
      {BASES.map((b, k) => {
        const o = ouvert === b.id
        return (
          <div key={b.id} style={{ ...S.carte, padding: 0, overflow: 'hidden', ...(o ? { borderColor: '#ee0000' } : {}) }}>
            <button onClick={() => setOuvert(o ? null : b.id)} aria-expanded={o} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '14px 16px', background: 'none', border: 'none', color: T.text, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, background: o ? '#ee0000' : T.surface2, color: o ? '#fff' : T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: grotesk, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{k + 1}</span>
              <span style={{ fontSize: 22 }}>{b.emoji}</span>
              <strong style={{ flex: 1, fontSize: 16 }}>{b.titre}</strong>
              <span style={{ color: T.textMuted }}>{o ? '▲' : '▼'}</span>
            </button>
            {o && (
              <div className="an-monte" style={{ padding: '0 16px 16px' }}>
                <p style={{ margin: '0 0 10px', fontSize: 15.5, lineHeight: 1.55, fontWeight: 600 }}>{b.bref}</p>
                {b.schéma && <SchémaArchi T={T} />}
                {b.points && <ul style={{ margin: '0 0 12px 18px', padding: 0, lineHeight: 1.65, fontSize: 14.5 }}>{b.points.map(p => <li key={p}>{p}</li>)}</ul>}
                {b.tableau && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '1px', background: T.border, borderRadius: 10, overflow: 'hidden', marginBottom: 12, fontSize: 14 }}>
                    {b.tableau.flatMap(([m, r]) => [<code key={`${m}a`} style={{ background: T.surface2, padding: '7px 10px', fontSize: 13 }}>{m}</code>, <span key={`${m}b`} style={{ background: T.surface, padding: '7px 10px' }}>{r}</span>])}
                  </div>
                )}
                <BlocCode code={b.code} langage={b.langage} numéros={b.langage === 'yaml'} />
                {b.code2 && <div style={{ marginTop: 8 }}><BlocCode code={b.code2} langage={b.langage2} numéros={false} /></div>}
                <p style={{ margin: '12px 0 0', padding: '10px 12px', borderRadius: 10, background: `${T.danger}18`, border: `1px solid ${T.danger}55`, fontSize: 14, lineHeight: 1.5 }}>⚠️ <strong>Piège :</strong> {b.piège}</p>
                {k < BASES.length - 1 && <button onClick={() => setOuvert(BASES[k + 1].id)} style={{ ...S.bouton(false), marginTop: 12 }}>Leçon suivante : {BASES[k + 1].titre} →</button>}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}

// ---------- 3. Exemples ----------
function Exemples({ T, S, versSimulateur }) {
  const [id, setId] = useState(EXEMPLES[0].id)
  const e = EXEMPLES.find(x => x.id === id)
  return (
    <section aria-labelledby="t-ex">
      <h2 id="t-ex" style={S.titre}>🧪 {EXEMPLES.length} exemples simples, de bout en bout</h2>
      <div role="tablist" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
        {EXEMPLES.map(x => <button key={x.id} role="tab" aria-selected={id === x.id} onClick={() => setId(x.id)} style={{ ...S.bouton(id === x.id), minHeight: 40, fontSize: 13.5, flexShrink: 0, borderRadius: 20 }}>{x.emoji} {x.titre.split(' ').slice(0, 3).join(' ')}…</button>)}
      </div>
      <div key={id} className="an-monte" style={S.carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 30 }}>{e.emoji}</span>
          <div style={{ flex: 1 }}><strong style={{ fontSize: 17 }}>{e.titre}</strong><div style={{ fontSize: 12.5, color: T.textMuted }}>Niveau {'●'.repeat(e.niveau)}{'○'.repeat(3 - e.niveau)}</div></div>
        </div>
        <p style={{ margin: '6px 0 12px', fontSize: 15, lineHeight: 1.5 }}>🎯 <strong>Objectif :</strong> {e.objectif}</p>
        {e.fichiers.map(([nom, lang, code]) => (
          <div key={nom} style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: T.textMuted, marginBottom: 4 }}>📄 {nom}</div>
            <BlocCode code={code} langage={lang} numéros={lang === 'yaml'} />
          </div>
        ))}
        <div style={{ fontSize: 12.5, color: T.textMuted, margin: '12px 0 4px' }}>▶ Commande</div>
        <BlocCode code={e.commande} langage="bash" numéros={false} />
        <div style={{ fontSize: 12.5, color: T.textMuted, margin: '12px 0 4px' }}>🖥️ Résultat attendu</div>
        <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 10, background: '#0d0f14', color: '#d7dbe6', fontSize: 12.5, lineHeight: 1.5, overflowX: 'auto' }}>{e.résultat}</pre>
        <p style={{ margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.5 }}>💡 {e.explication}</p>
        {e.id === 'nginx' && <button onClick={versSimulateur} style={{ ...S.bouton(false), marginTop: 12 }}>🎮 Le voir tourner dans le simulateur</button>}
      </div>
    </section>
  )
}

// ---------- 4. Simulateur ----------
const COULEURS = { titre: '#ffffff', ok: '#4ade80', changed: '#facc15', failed: '#f87171', diff: '#93c5fd', recap: '#e5e7eb' }
function LigneRecap({ texte }) {
  return <>{texte.split(/(\w+=\d+)/).map((m, i) => { const r = m.match(/^(\w+)=(\d+)$/); if (!r) return <span key={i}>{m}</span>; const c = r[1] === 'changed' && r[2] !== '0' ? COULEURS.changed : r[1] === 'failed' && r[2] !== '0' ? COULEURS.failed : r[1] === 'unreachable' && r[2] !== '0' ? COULEURS.failed : r[1] === 'ok' ? COULEURS.ok : '#9ca3af'; return <span key={i} style={{ color: c, fontWeight: 700 }}>{m}</span> })}</>
}
function Simulateur({ T, S }) {
  const [sim, setSim] = useState(SIMULATIONS[0].id)
  const [run, setRun] = useState(null)
  const [n, setN] = useState(0)
  const [frappe, setFrappe] = useState(0)
  const zone = useRef(null)
  const s = SIMULATIONS.find(x => x.id === sim)
  const r = run && s.runs[run]
  useEffect(() => {
    if (!r) return undefined
    if (frappe < r.commande.length) { const t = setTimeout(() => setFrappe(f => f + 1), 22); return () => clearTimeout(t) }
    if (n < r.lignes.length) { const t = setTimeout(() => setN(x => x + 1), r.lignes[n][0] === 'titre' ? 380 : 230); return () => clearTimeout(t) }
    return undefined
  }, [r, n, frappe])
  useEffect(() => { zone.current?.scrollTo({ top: zone.current.scrollHeight, behavior: 'smooth' }) }, [n])
  const lancer = id => { setRun(id); setN(0); setFrappe(0) }
  const fini = r && n >= r.lignes.length
  return (
    <section aria-labelledby="t-sim">
      <h2 id="t-sim" style={S.titre}>🎮 Le terminal Ansible, pour voir ce qui se passe</h2>
      <p style={{ ...S.discret, marginBottom: 10 }}>Choisis un lancement : la sortie défile comme dans un vrai terminal. <span style={{ color: '#16a34a', fontWeight: 700 }}>vert = ok</span>, <span style={{ color: '#ca8a04', fontWeight: 700 }}>jaune = changé</span>, <span style={{ color: '#dc2626', fontWeight: 700 }}>rouge = erreur</span>.</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {SIMULATIONS.map(x => <button key={x.id} onClick={() => { setSim(x.id); setRun(null) }} aria-pressed={sim === x.id} style={{ ...S.bouton(sim === x.id), minHeight: 38, fontSize: 13.5 }}>{x.titre}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(s.runs).map(([id, x]) => <button key={id} onClick={() => lancer(id)} style={{ ...S.bouton(false), minHeight: 38, fontSize: 13.5, borderColor: run === id ? '#ee0000' : T.border }}>▶ {x.libellé}</button>)}
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1f2433', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#1c2030' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}
          <span style={{ marginLeft: 8, fontSize: 12, color: '#8a94ad', fontFamily: 'ui-monospace, monospace' }}>ubuntu@controle: ~/mon-projet</span>
        </div>
        <div ref={zone} aria-live="polite" style={{ background: '#0d0f14', color: '#d7dbe6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12.5, lineHeight: 1.6, padding: '12px 14px', minHeight: 220, maxHeight: 380, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {!r && <span style={{ color: '#5d6680' }}>Choisis un lancement au-dessus ▲</span>}
          {r && <div><span style={{ color: '#4ade80' }}>$ </span>{r.commande.slice(0, frappe)}{frappe < r.commande.length && <span style={{ animation: 'an-curseur .8s step-end infinite' }}>▍</span>}</div>}
          {r && frappe >= r.commande.length && r.lignes.slice(0, n).map(([type, texte], k) => (
            <div key={k} style={{ color: type === 'diff' ? (texte.startsWith('+') ? '#4ade80' : texte.startsWith('-') && !texte.startsWith('---') ? '#f87171' : COULEURS.diff) : COULEURS[type], fontWeight: type === 'titre' ? 700 : 400, marginTop: type === 'titre' ? 8 : 0 }}>
              {type === 'recap' ? <LigneRecap texte={texte} /> : texte}
            </div>
          ))}
        </div>
      </div>
      {fini && <p className="an-monte" style={{ margin: '12px 0 0', padding: '12px 14px', borderRadius: 12, background: `${T.accent}1c`, border: `1px solid ${T.accent}55`, fontSize: 15, lineHeight: 1.5 }}>💡 {r.leçon}</p>}
    </section>
  )
}

// ---------- 5. Quiz ----------
function Quiz({ T, S, meilleur, onScore }) {
  const questions = useMemo(() => [
    ...mélanger(QUEL_MODULE).slice(0, 6).map(([besoin, bon, faux]) => ({ q: `Quel module pour : ${besoin.toLowerCase()} ?`, r: bon, options: mélanger([bon, ...faux]), code: true })),
    ...mélanger(QCM).slice(0, 6).map(x => ({ q: x.q, r: x.r, options: mélanger([x.r, ...x.f]) })),
  ], [])
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState(null)
  const [bonnes, setBonnes] = useState(0)
  const [fin, setFin] = useState(false)
  const q = questions[i]
  const répondre = o => { if (choix) return; setChoix(o); if (o === q.r) setBonnes(b => b + 1) }
  const suivante = () => {
    if (i + 1 < questions.length) { setI(x => x + 1); setChoix(null) } else { setFin(true); onScore(bonnes, questions.length) }
  }
  if (fin) {
    const p = Math.round((bonnes / questions.length) * 100)
    return (
      <section style={{ ...S.carte, textAlign: 'center' }} className="an-monte">
        <div style={{ fontSize: 56, animation: 'an-pop .5s both' }}>{p >= 80 ? '🏆' : p >= 50 ? '👍' : '💪'}</div>
        <h2 style={{ margin: '6px 0', fontSize: 26 }}>{bonnes} / {questions.length} · {p} %</h2>
        <p style={{ ...S.discret, marginBottom: 12 }}>{p >= 80 ? 'Excellent, tu maîtrises les bases !' : 'Relis les bases puis retente : les questions changent à chaque fois.'}{meilleur != null ? ` Record : ${Math.max(meilleur, p)} %.` : ''}</p>
        <button onClick={() => { setI(0); setChoix(null); setBonnes(0); setFin(false) }} style={S.bouton(true)}>↺ Rejouer</button>
      </section>
    )
  }
  return (
    <section aria-labelledby="t-quiz" style={S.carte}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <h2 id="t-quiz" style={{ ...S.titre, margin: 0, flex: 1 }}>❓ Question {i + 1} / {questions.length}{i < 6 ? ' · quel module ?' : ' · QCM'}</h2>
        <span style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 13 }}>{bonnes} ✓</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: T.surface2, marginBottom: 14 }}><div style={{ width: `${(i / questions.length) * 100}%`, height: '100%', borderRadius: 3, background: '#ee0000', transition: 'width .3s' }} /></div>
      <p key={i} className="an-monte" style={{ margin: '0 0 12px', fontSize: 17.5, fontWeight: 700, lineHeight: 1.4 }}>{q.q}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {q.options.map(o => {
          const montré = !!choix
          const bon = o === q.r
          const pris = choix === o
          return (
            <button key={o} onClick={() => répondre(o)} disabled={montré} className={pris && !bon ? 'an-faux' : ''} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, fontSize: 15, lineHeight: 1.4, cursor: montré ? 'default' : 'pointer', color: T.text, fontFamily: q.code ? 'ui-monospace, monospace' : 'inherit', border: `2px solid ${montré ? (bon ? '#22a55e' : pris ? T.danger : T.border) : T.border}`, background: montré && bon ? 'rgba(34,165,94,.12)' : pris ? 'rgba(239,68,68,.1)' : T.bg }}>
              {montré ? (bon ? '✅ ' : pris ? '❌ ' : '') : ''}{o}
            </button>
          )
        })}
      </div>
      {choix && <button onClick={suivante} style={{ ...S.bouton(true), marginTop: 12 }}>{i + 1 < questions.length ? 'Question suivante →' : 'Voir mon score'}</button>}
    </section>
  )
}

// ---------- 6. À retenir ----------
function ARetenir({ T, S }) {
  const [copié, setCopié] = useState(null)
  return (
    <section aria-labelledby="t-ret">
      <div style={{ ...S.carte, borderColor: '#ee0000' }}>
        <h2 id="t-ret" style={S.titre}>✅ Ce qu'il faut retenir</h2>
        {RETENIR.map(([e, t], k) => (
          <div key={k} className="an-monte" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderBottom: k < RETENIR.length - 1 ? `1px solid ${T.border}` : 'none', animationDelay: `${k * 0.06}s` }}>
            <span style={{ fontSize: 22, width: 28, textAlign: 'center', flexShrink: 0 }}>{e}</span>
            <span style={{ fontSize: 15.5, lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={S.carte}>
        <h3 style={S.titre}>🗂️ La structure d'un projet</h3>
        <BlocCode code={STRUCTURE} langage="texte" numéros={false} />
      </div>
      <div style={S.carte}>
        <h3 style={S.titre}>⌨️ L'aide-mémoire des commandes</h3>
        {AIDE_MÉMOIRE.map(([c, d]) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
            <code style={{ flex: '1 1 260px', minWidth: 0, fontSize: 12.5, background: '#0d0f14', color: '#9be7c4', padding: '6px 9px', borderRadius: 7, wordBreak: 'break-all' }}>{c}</code>
            <span style={{ flex: '1 1 140px', fontSize: 13.5, color: T.textMuted }}>{d}</span>
            <button onClick={() => { navigator.clipboard?.writeText(c); setCopié(c); setTimeout(() => setCopié(x => (x === c ? null : x)), 1400) }} aria-label={`Copier ${c}`} style={{ minWidth: 38, minHeight: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: copié === c ? '#22a55e' : T.text, cursor: 'pointer' }}>{copié === c ? '✓' : '📋'}</button>
          </div>
        ))}
      </div>
    </section>
  )
}
