import { useState } from 'react'

export default function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#0d0f14' }}>
      <button onClick={copy} style={{
        position: 'absolute', top: '10px', right: '10px',
        padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
        background: copied ? '#4ade8033' : '#252836',
        color: copied ? '#4ade80' : '#94a3b8',
        border: `1px solid ${copied ? '#4ade80' : '#2d3148'}`,
        transition: 'all 0.2s',
      }}>
        {copied ? '✓ Copié' : 'Copier'}
      </button>
      <pre style={{
        margin: 0, padding: '16px', overflowX: 'auto',
        fontSize: '12px', lineHeight: '1.7', color: '#a78bfa',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
