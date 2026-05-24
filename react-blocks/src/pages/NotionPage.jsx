import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { notions } from '../notions'
import CodeBlock from '../components/CodeBlock'

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
  const { code, explication } = notion.component

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
        {tab === 'code' && <CodeBlock code={notion.component.code || '// Code à venir'} />}
        {tab === 'explication' && (
          <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '12px', border: '1px solid #2d3148' }}>
            {(notion.component.explication || '').split('\n').map((line, i) => {
              const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
              return (
                <p key={i} style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7', margin: '0 0 8px' }}>
                  {parts.map((p, j) => {
                    if (p.startsWith('**') && p.endsWith('**'))
                      return <strong key={j} style={{ color: '#a78bfa' }}>{p.slice(2, -2)}</strong>
                    if (p.startsWith('`') && p.endsWith('`'))
                      return <code key={j} style={{ background: '#252836', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', color: '#fbbf24' }}>{p.slice(1, -1)}</code>
                    if (p.startsWith('- '))
                      return <span key={j}>• {p.slice(2)}</span>
                    return p
                  })}
                </p>
              )
            })}
          </div>
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
