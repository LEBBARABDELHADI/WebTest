// Rendu des blocs de la formation Jenkins : texte, tableaux, code commenté ligne par ligne,
// commandes avec leur sortie réelle, captures réelles avec repères numérotés, schémas, TP avec
// corrigé, exercices, erreurs fréquentes, quiz, checklist et récapitulatif.
import { useState } from 'react'
import { grotesk } from '../../lib/theme'
import BlocCode from '../BlocCode'
import CAPTURES from '../../lib/jenkins/captures.json'
import { LAB } from '../../lib/jenkins/plan'
import Schema from './Schemas'

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const BASE = import.meta.env.BASE_URL

// Texte enrichi : **gras**, *italique*, `code`, [lien](url).
export function Texte({ texte, T }) {
  const morceaux = String(texte).split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g)
  return morceaux.map((m, i) => {
    if (/^\*\*[^*]+\*\*$/.test(m)) return <strong key={i}>{m.slice(2, -2)}</strong>
    if (/^`[^`]+`$/.test(m)) return <code key={i} style={{ fontFamily: MONO, fontSize: '0.9em', padding: '1px 5px', borderRadius: 5, background: T.surface2 ?? T.bg, border: `1px solid ${T.border}`, wordBreak: 'break-word' }}>{m.slice(1, -1)}</code>
    const lien = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(m)
    if (lien) return <a key={i} href={lien[2]} target="_blank" rel="noreferrer" style={{ color: T.accent }}>{lien[1]}</a>
    if (/^\*[^*\s][^*]*\*$/.test(m)) return <em key={i}>{m.slice(1, -1)}</em>
    return m
  })
}

const ENCADRÉS = {
  tip: ['💡', 'Tip', '#2563eb'],
  warning: ['⚠️', 'Warning', '#d97706'],
  info: ['ℹ️', 'Good to know', '#6b7280'],
  enterprise: ['🏢', 'In a company', '#7c3aed'],
  why: ['🤔', 'Why?', '#2e9e6b'],
}

function Encadré({ b, T }) {
  const [icône, nom, couleur] = ENCADRÉS[b.kind] ?? ENCADRÉS.info
  return (
    <aside style={{ margin: '14px 0', padding: '10px 12px', borderRadius: 12, borderLeft: `4px solid ${couleur}`, background: `${couleur}14` }}>
      <p style={{ margin: '0 0 4px', fontFamily: grotesk, fontWeight: 800, fontSize: 14, color: couleur }}>{icône} {b.title ?? nom}</p>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}><Texte texte={b.text} T={T} /></p>
    </aside>
  )
}

function Tableau({ b, T }) {
  return (
    <div style={{ margin: '12px 0', overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: b.head.length > 3 ? 640 : 0, fontSize: 14 }}>
        <thead>
          <tr>{b.head.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '8px 10px', background: T.surface, borderBottom: `1px solid ${T.border}`, fontFamily: grotesk, fontSize: 13, verticalAlign: 'bottom' }}><Texte texte={h} T={T} /></th>)}</tr>
        </thead>
        <tbody>
          {b.rows.map((r, i) => (
            <tr key={i} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              {r.map((c, j) => <td key={j} style={{ padding: '8px 10px', verticalAlign: 'top', lineHeight: 1.5, fontWeight: j === 0 && b.head.length > 2 ? 600 : 400 }}><Texte texte={c} T={T} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Code complet + emplacement du fichier + explication ligne par ligne (toucher une explication surligne la ligne).
function Code({ b, T }) {
  const [ligne, setLigne] = useState(null)
  return (
    <div style={{ margin: '12px 0' }}>
      {b.file && <p style={{ margin: '0 0 6px', fontSize: 13, color: T.textMuted }}>📄 <span style={{ fontFamily: MONO, color: T.text }}>{b.file}</span></p>}
      <BlocCode code={b.code.replace(/\n$/, '')} langage={b.lang} surlignées={ligne ? [ligne] : []} libellés={['Copy', '✓ Copied']} />
      {b.lignes?.length > 0 && (
        <details style={{ marginTop: 6 }} open>
          <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 14 }}>Line-by-line explanation</summary>
          <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 4 }}>
            {b.lignes.map(([n, t]) => (
              <li key={n}>
                <button type="button" onClick={() => setLigne(l => (l === n ? null : n))} aria-pressed={ligne === n} style={{ display: 'flex', gap: 8, width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 8, border: `1px solid ${ligne === n ? '#ffd60a' : T.border}`, background: ligne === n ? 'rgba(255,214,10,.12)' : T.surface, color: T.text, cursor: 'pointer', fontSize: 14, lineHeight: 1.5 }}>
                  <span style={{ fontFamily: MONO, fontWeight: 700, color: T.textMuted, minWidth: 34 }}>L{n}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><Texte texte={t} T={T} /></span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

// Commande et sa sortie réelle, dans un terminal.
function Commande({ b, T }) {
  const [copié, setCopié] = useState(false)
  const copier = () => { navigator.clipboard?.writeText(b.cmd).catch(() => {}); setCopié(true); setTimeout(() => setCopié(false), 1200) }
  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2433', background: '#0d0f14' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px 5px 12px', background: '#151924', borderBottom: '1px solid #1f2433' }}>
          <span style={{ flex: 1, fontSize: 11, color: '#8a94ad', fontFamily: grotesk, letterSpacing: '.04em' }}>{b.cmd ? '▸ ' : '📜 '}{b.where}</span>
          {b.cmd && <button type="button" onClick={copier} aria-label="Copy the command" style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: grotesk, background: copié ? '#4ade8033' : '#252836', color: copié ? '#4ade80' : '#94a3b8', border: `1px solid ${copié ? '#4ade80' : '#2d3148'}` }}>{copié ? '✓ Copied' : 'Copy'}</button>}
        </div>
        <pre style={{ margin: 0, padding: '10px 12px', overflowX: 'auto', fontFamily: MONO, fontSize: 12.5, lineHeight: 1.6, color: '#d7dbe8' }}>
          {b.cmd && b.cmd.split('\n').map((l, i) => <div key={`c${i}`}><span style={{ color: '#4ade80', userSelect: 'none' }}>{/^\s/.test(l) ? '  ' : '$ '}</span><span style={{ color: '#f5f7ff', fontWeight: 600 }}>{l}</span></div>)}
          {b.out && <div style={{ color: '#aab3c8', marginTop: b.cmd ? 6 : 0 }}>{b.out}</div>}
        </pre>
      </div>
      {b.cmd && b.out && <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textMuted }}>Output recorded on the lab machine; IDs, times and passwords differ on yours.</p>}
      {b.note && <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: T.textMuted }}><Texte texte={b.note} T={T} /></p>}
    </div>
  )
}

// Capture réelle + repères numérotés (positions mesurées sur la page Jenkins au moment de la capture).
export function Capture({ b, T }) {
  const c = CAPTURES[b.id]
  const [zoom, setZoom] = useState(false)
  if (!c) return <p role="alert" style={{ color: '#dc2626' }}>Missing screenshot: {b.id}</p>
  const src = `${BASE}jenkins/${c.fichier}`
  const repères = c.marqueurs
  return (
    <figure style={{ margin: '16px 0', border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', background: T.surface }}>
      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${T.border}` }}>
        <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 800, fontSize: 15.5 }}>📸 {b.titre}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: T.textMuted }}>Real screenshot · Jenkins {LAB.jenkins} {LAB.ligne} · image <span style={{ fontFamily: MONO }}>{LAB.image}</span> · {LAB.date}{c.url ? <> · page <span style={{ fontFamily: MONO }}>{c.url}</span></> : null} · numbered markers added by the course</p>
      </div>
      <div style={{ position: 'relative', background: '#e5e7eb', cursor: zoom ? 'zoom-out' : 'zoom-in' }} onClick={() => setZoom(z => !z)}>
        <div style={{ overflowX: zoom ? 'auto' : 'hidden' }}>
          <div style={{ position: 'relative', width: zoom ? 1280 : '100%' }}>
            <img src={src} alt={`Jenkins screenshot: ${b.titre}`} width={c.largeur} height={c.hauteur} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
            {repères.map(m => (
              <div key={m.n} aria-hidden="true" style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, width: `${m.l}%`, height: `${m.h}%`, outline: '2.5px solid #f59e0b', borderRadius: 6, boxShadow: '0 0 0 4px rgba(245,158,11,.18)', pointerEvents: 'none' }}>
                <span style={{ position: 'absolute', left: -11, top: -11, width: 22, height: 22, borderRadius: 11, background: '#f59e0b', color: '#111', fontFamily: grotesk, fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }}>{m.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption style={{ padding: '10px 12px 12px', fontSize: 14.5, lineHeight: 1.55 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: T.textMuted }}>{zoom ? 'Tap the image to fit it to the screen.' : 'Tap the image to see it at full size.'} <a href={src} target="_blank" rel="noreferrer" style={{ color: T.accent }}>Open the original</a></p>
        <p style={{ margin: '0 0 6px' }}><strong>What you see.</strong> <Texte texte={b.ce} T={T} /></p>
        <p style={{ margin: '0 0 4px' }}><strong>Important elements</strong></p>
        <ol style={{ margin: '0 0 6px', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
          {b.éléments.map((e, i) => (
            <li key={i} style={{ display: 'flex', gap: 8 }}>
              <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 10, background: i < repères.length ? '#f59e0b' : T.border, color: '#111', fontFamily: grotesk, fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>{i + 1}</span>
              <span><Texte texte={e} T={T} /></span>
            </li>
          ))}
        </ol>
        <p style={{ margin: '0 0 4px' }}><strong>Actions</strong></p>
        <ul style={{ margin: '0 0 6px', paddingLeft: 20 }}>{b.actions.map((a, i) => <li key={i}><Texte texte={a} T={T} /></li>)}</ul>
        <p style={{ margin: 0 }}><strong>Expected result.</strong> <Texte texte={b.résultat} T={T} /></p>
      </figcaption>
    </figure>
  )
}

function Erreurs({ b, T }) {
  return (
    <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
      {b.rows.map(([symptôme, cause, solution], i) => (
        <div key={i} style={{ border: `1px solid ${T.border}`, borderLeft: '4px solid #dc2626', borderRadius: 12, padding: '8px 12px', background: T.surface, fontSize: 14.5, lineHeight: 1.55 }}>
          <p style={{ margin: '0 0 4px' }}>❌ <strong><Texte texte={symptôme} T={T} /></strong></p>
          <p style={{ margin: '0 0 4px', color: T.textMuted }}><strong style={{ color: T.text }}>Cause:</strong> <Texte texte={cause} T={T} /></p>
          <p style={{ margin: 0 }}>✅ <strong>Fix:</strong> <Texte texte={solution} T={T} /></p>
        </div>
      ))}
    </div>
  )
}

function Corrigé({ titre, children }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <div style={{ marginTop: 10 }}>
      <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} style={{ minHeight: 42, padding: '0 14px', borderRadius: 10, border: `1px solid #2e9e6b`, background: ouvert ? '#2e9e6b' : 'transparent', color: ouvert ? '#fff' : '#2e9e6b', fontFamily: grotesk, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{ouvert ? '▾ Hide' : '▸ Show'} {titre}</button>
      {ouvert && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 12, border: '1px solid #2e9e6b55', background: '#2e9e6b10' }}>{children}</div>}
    </div>
  )
}

function Lab({ b, T, état }) {
  return (
    <section aria-label={b.titre} style={{ margin: '16px 0', border: `2px solid ${T.accent}`, borderRadius: 16, padding: 14, background: T.surface }}>
      <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 900, fontSize: 17 }}>🧪 {b.titre}</p>
      <p style={{ margin: '4px 0 8px', fontSize: 13.5, color: T.textMuted }}>⏱️ {b.durée} · Goal: <Texte texte={b.objectif} T={T} /></p>
      <Blocs blocs={b.étapes} T={T} état={état} />
      <Corrigé titre="the solution"><Blocs blocs={b.solution} T={T} état={état} /></Corrigé>
    </section>
  )
}

function Exercice({ b, T, état }) {
  return (
    <section aria-label={b.titre} style={{ margin: '14px 0', border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, background: T.surface }}>
      <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800, fontSize: 16 }}>✍️ {b.titre}</p>
      <Blocs blocs={b.énoncé} T={T} état={état} />
      <Corrigé titre="the solution"><Blocs blocs={b.solution} T={T} état={état} /></Corrigé>
    </section>
  )
}

function Checklist({ b, T, état }) {
  const cochés = état.cases?.[b.id] ?? []
  const fait = cochés.filter(Boolean).length
  return (
    <div style={{ margin: '12px 0', border: `1px solid ${T.border}`, borderRadius: 14, padding: '8px 12px', background: T.surface }}>
      <p style={{ margin: '4px 0 8px', fontFamily: grotesk, fontWeight: 800 }}>✅ {fait}/{b.items.length} validated</p>
      {b.items.map((it, i) => (
        <label key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', fontSize: 15, lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!cochés[i]} onChange={() => état.cocher(b.id, i, b.items.length)} style={{ width: 20, height: 20, marginTop: 2, accentColor: '#2e9e6b', flexShrink: 0 }} />
          <span style={{ textDecoration: cochés[i] ? 'line-through' : 'none', color: cochés[i] ? T.textMuted : T.text }}><Texte texte={it} T={T} /></span>
        </label>
      ))}
    </div>
  )
}

function Quiz({ b, T, état }) {
  const [réponses, setRéponses] = useState({})
  const répondues = Object.keys(réponses).length
  const bonnes = b.questions.filter((q, i) => réponses[i] === q.bonne).length
  const choisir = (i, k) => {
    if (réponses[i] !== undefined) return
    const n = { ...réponses, [i]: k }
    setRéponses(n)
    if (Object.keys(n).length === b.questions.length) état.score(b.id, b.questions.filter((q, j) => n[j] === q.bonne).length, b.questions.length)
  }
  return (
    <div style={{ margin: '12px 0', display: 'grid', gap: 10 }}>
      {b.questions.map((q, i) => (
        <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, background: T.surface }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 15 }}>{i + 1}. <Texte texte={q.q} T={T} /></p>
          <div style={{ display: 'grid', gap: 6 }}>
            {q.choix.map((c, k) => {
              const répondu = réponses[i] !== undefined
              const bonne = k === q.bonne
              const choisi = réponses[i] === k
              const couleur = répondu && bonne ? '#2e9e6b' : répondu && choisi ? '#dc2626' : T.border
              return <button key={k} type="button" onClick={() => choisir(i, k)} disabled={répondu} style={{ textAlign: 'left', minHeight: 42, padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${couleur}`, background: répondu && bonne ? '#2e9e6b18' : répondu && choisi ? '#dc262618' : T.bg, color: T.text, fontSize: 14.5, cursor: répondu ? 'default' : 'pointer' }}>{répondu && bonne ? '✅ ' : répondu && choisi ? '❌ ' : ''}<Texte texte={c} T={T} /></button>
            })}
          </div>
          {réponses[i] !== undefined && <p style={{ margin: '8px 0 0', fontSize: 14, color: T.textMuted }}>💬 <Texte texte={q.pourquoi} T={T} /></p>}
        </div>
      ))}
      <p role="status" style={{ margin: 0, fontFamily: grotesk, fontWeight: 800 }}>{répondues < b.questions.length ? `${répondues}/${b.questions.length} answered` : `Score: ${bonnes}/${b.questions.length}${état.meilleur?.[b.id] !== undefined ? ` · best: ${état.meilleur[b.id]}%` : ''}`}{répondues === b.questions.length && <button type="button" onClick={() => setRéponses({})} style={{ marginLeft: 10, minHeight: 36, padding: '0 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, cursor: 'pointer', fontFamily: grotesk, fontWeight: 700 }}>↺ Try again</button>}</p>
    </div>
  )
}

export default function Blocs({ blocs, T, état }) {
  return blocs.map((b, i) => {
    switch (b.t) {
      case 'h': return <h2 key={i} id={b.id} style={{ fontFamily: grotesk, fontSize: 21, margin: '26px 0 8px', scrollMarginTop: 12 }}>{b.text}</h2>
      case 'h3': return <h3 key={i} style={{ fontFamily: grotesk, fontSize: 17, margin: '18px 0 6px' }}>{b.text}</h3>
      case 'p': return <p key={i} style={{ margin: '8px 0', fontSize: 15.5, lineHeight: 1.65 }}><Texte texte={b.text} T={T} /></p>
      case 'ul': return <ul key={i} style={{ margin: '8px 0', paddingLeft: 22, fontSize: 15.5, lineHeight: 1.6 }}>{b.items.map((x, k) => <li key={k} style={{ marginBottom: 4 }}><Texte texte={x} T={T} /></li>)}</ul>
      case 'ol': return <ol key={i} style={{ margin: '8px 0', paddingLeft: 24, fontSize: 15.5, lineHeight: 1.6 }}>{b.items.map((x, k) => <li key={k} style={{ marginBottom: 4 }}><Texte texte={x} T={T} /></li>)}</ol>
      case 'objectives': return (
        <section key={i} aria-label="Learning objectives" style={{ margin: '0 0 14px', padding: '10px 14px', borderRadius: 14, background: `${T.accent}14`, border: `1px solid ${T.accent}55` }}>
          <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 900, fontSize: 15 }}>🎯 Learning objectives — at the end, you can:</p>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>{b.items.map((x, k) => <li key={k}><Texte texte={x} T={T} /></li>)}</ul>
        </section>
      )
      case 'table': return <Tableau key={i} b={b} T={T} />
      case 'code': return <Code key={i} b={b} T={T} />
      case 'cmd': return <Commande key={i} b={b} T={T} />
      case 'shot': return <Capture key={i} b={b} T={T} />
      case 'diagram': return <Schema key={i} id={b.id} légende={b.caption} T={T} />
      case 'callout': return <Encadré key={i} b={b} T={T} />
      case 'errors': return <Erreurs key={i} b={b} T={T} />
      case 'lab': return <Lab key={i} b={b} T={T} état={état} />
      case 'exercise': return <Exercice key={i} b={b} T={T} état={état} />
      case 'checklist': return <Checklist key={i} b={b} T={T} état={état} />
      case 'quiz': return <Quiz key={i} b={b} T={T} état={état} />
      case 'recap': return (
        <section key={i} aria-label="Recap" style={{ margin: '12px 0', padding: '10px 14px', borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface }}>
          <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 900 }}>📌 What you learned</p>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>{b.items.map((x, k) => <li key={k}><Texte texte={x} T={T} /></li>)}</ul>
        </section>
      )
      default: return null
    }
  })
}
