import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { notions } from '../notions'
import CodeBlock from '../components/CodeBlock'

function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} style={{ color: '#a78bfa' }}>{p.slice(2, -2)}</strong>
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} style={{ background: '#0d0f14', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace' }}>{p.slice(1, -1)}</code>
    return p
  })
}

function ExplicationRenderer({ text }) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i++; continue }

    // Section header: ### titre
    if (line.startsWith('### ')) {
      blocks.push(
        <p key={i} style={{ color: '#6c63ff', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px' }}>
          {line.slice(4)}
        </p>
      )
    }
    // Piège / warning: ⚠️ ...
    else if (line.startsWith('⚠️')) {
      blocks.push(
        <div key={i} style={{ padding: '10px 12px', background: '#fbbf2415', border: '1px solid #fbbf2444', borderRadius: '8px', margin: '6px 0' }}>
          <p style={{ color: '#fbbf24', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            <InlineText text={line} />
          </p>
        </div>
      )
    }
    // Tip / bon usage: ✅ ...
    else if (line.startsWith('✅')) {
      blocks.push(
        <div key={i} style={{ padding: '10px 12px', background: '#4ade8015', border: '1px solid #4ade8044', borderRadius: '8px', margin: '6px 0' }}>
          <p style={{ color: '#4ade80', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            <InlineText text={line} />
          </p>
        </div>
      )
    }
    // Numbered list: 1. ...
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)[1]
      const content = line.replace(/^\d+\.\s/, '')
      blocks.push(
        <div key={i} style={{ display: 'flex', gap: '10px', margin: '4px 0' }}>
          <span style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: '13px', minWidth: '18px' }}>{num}.</span>
          <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            <InlineText text={content} />
          </p>
        </div>
      )
    }
    // Bullet list: - ...
    else if (line.startsWith('- ')) {
      blocks.push(
        <div key={i} style={{ display: 'flex', gap: '10px', margin: '4px 0' }}>
          <span style={{ color: '#6c63ff', fontSize: '16px', lineHeight: '1.4', minWidth: '10px' }}>·</span>
          <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            <InlineText text={line.slice(2)} />
          </p>
        </div>
      )
    }
    // Normal paragraph
    else {
      blocks.push(
        <p key={i} style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7', margin: '0 0 8px' }}>
          <InlineText text={line} />
        </p>
      )
    }
    i++
  }

  return (
    <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '12px', border: '1px solid #2d3148' }}>
      {blocks}
    </div>
  )
}

const niveauColor = {
  'Débutant': '#4ade80',
  'Intermédiaire': '#fbbf24',
  'Avancé': '#f87171',
}

export default function NotionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('demo')

  const index = notions.findIndex(n => n.id === id)
  const notion = notions[index]
  const prev = notions[index - 1]
  const next = notions[index + 1]

  if (!notion) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#f87171' }}>Notion introuvable.</p>
        <Link to="/" style={{ color: '#6c63ff' }}>← Retour</Link>
      </div>
    )
  }

  const Demo = notion.component

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Accueil
        </Link>
        <div style={{ flex: 1 }} />
        <span style={{
          padding: '2px 10px', borderRadius: '20px', fontSize: '11px',
          background: niveauColor[notion.niveau] + '22',
          color: niveauColor[notion.niveau],
        }}>{notion.niveau}</span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '36px', marginBottom: '6px' }}>{notion.emoji}</div>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#e2e8f0', margin: '0 0 6px' }}>
          {notion.titre}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>{notion.description}</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#1a1d27', padding: '4px', borderRadius: '10px' }}>
        {[
          { key: 'demo', label: '▶ Démo' },
          { key: 'code', label: '</> Code' },
          { key: 'explication', label: '📖 Explication' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px',
            background: tab === t.key ? '#252836' : 'transparent',
            color: tab === t.key ? '#e2e8f0' : '#94a3b8',
            fontWeight: tab === t.key ? '600' : '400',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ minHeight: '200px' }}>
        {tab === 'demo' && (
          <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '12px', border: '1px solid #2d3148' }}>
            <Demo />
          </div>
        )}
        {tab === 'code' && <CodeBlock code={notion.source || '// Code à venir'} />}
        {tab === 'explication' && (
          <ExplicationRenderer text={notion.explication || ''} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '10px' }}>
        {prev ? (
          <button onClick={() => navigate(`/notion/${prev.id}`)} style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            background: '#1a1d27', border: '1px solid #2d3148',
            color: '#94a3b8', fontSize: '13px', textAlign: 'left',
          }}>
            ← {prev.emoji} {prev.titre}
          </button>
        ) : <div style={{ flex: 1 }} />}

        {next ? (
          <button onClick={() => navigate(`/notion/${next.id}`)} style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            background: '#1a1d27', border: '1px solid #2d3148',
            color: '#94a3b8', fontSize: '13px', textAlign: 'right',
          }}>
            {next.emoji} {next.titre} →
          </button>
        ) : <div style={{ flex: 1 }} />}
      </div>
    </div>
  )
}
