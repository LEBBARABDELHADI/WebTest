import { useState, useEffect, useRef } from 'react'

export const code = `import { useRef } from 'react'

function Demo() {
  const inputRef = useRef(null)
  const renderCount = useRef(0)

  // Accéder au DOM directement
  const focusInput = () => inputRef.current.focus()

  // Compter les renders SANS re-render
  renderCount.current += 1

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
      <p>Renders : {renderCount.current}</p>
    </>
  )
}`

export const explication = `### Qu'est-ce que useRef ?
\`useRef\` retourne un objet \`{ current: valeur }\` qui **persiste entre les renders** mais dont la modification ne déclenche **pas** de re-render. C'est sa différence fondamentale avec \`useState\`.

### Les 2 usages principaux

**1. Accéder au DOM directement**
\`const inputRef = useRef(null)\`
\`<input ref={inputRef} />\`
Puis : \`inputRef.current.focus()\` — accès direct à l'élément HTML.

**2. Mémoriser une valeur sans re-render**
\`const renderCount = useRef(0)\`
\`renderCount.current += 1\` — incrémente sans déclencher de re-render.
Utile pour : compter les renders, stocker l'ID d'un timer, garder la valeur précédente.

### useRef vs useState
- \`useState\` → valeur qui **affecte l'interface** → déclenche un re-render
- \`useRef\` → valeur **interne** (timer, DOM, compteur) → pas de re-render

### Usages courants du DOM
- \`focus()\` sur un input
- \`scrollIntoView()\` pour scroller vers un élément
- \`getBoundingClientRect()\` pour mesurer un élément
- Contrôler une animation ou un canvas

⚠️ Ne pas lire/modifier \`ref.current\` pendant le rendu — seulement dans des event handlers ou \`useEffect\`.
⚠️ Si tu mets une \`ref\` sur un composant React (et non un élément HTML), il faut utiliser \`forwardRef\`.
✅ Pour stocker la valeur précédente d'un état : \`const prevCount = useRef(); useEffect(() => { prevCount.current = count }, [count])`

export default function UseRefNotion() {
  const inputRef = useRef(null)
  const renderCount = useRef(0)
  const [text, setText] = useState('')
  const [highlights, setHighlights] = useState([])
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const lastPos = useRef(null)

  renderCount.current += 1

  const focus = () => inputRef.current?.focus()
  const select = () => { inputRef.current?.focus(); inputRef.current?.select() }
  const clear = () => { setText(''); inputRef.current?.focus() }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
  }, [])

  const getPos = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const startDraw = e => { setDrawing(true); lastPos.current = getPos(e) }
  const stopDraw = () => setDrawing(false)
  const draw = e => {
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }
  const clearCanvas = () => {
    const canvas = canvasRef.current
    canvasRef.current.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>Accès DOM via ref</p>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          placeholder="Clique sur un bouton…"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none', marginBottom: '8px',
          }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[['🎯 Focus', focus], ['✅ Sélectionner', select], ['🗑 Vider', clear]].map(([label, fn]) => (
            <button key={label} onClick={fn} style={{
              padding: '7px 12px', borderRadius: '6px',
              background: '#252836', color: '#a78bfa',
              border: '1px solid #2d3148', fontSize: '13px',
            }}>{label}</button>
          ))}
        </div>
        <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '12px' }}>
          Re-renders : <strong style={{ color: '#fbbf24' }}>{renderCount.current}</strong>
          {' '}(renderCount.current ne déclenche pas de re-render)
        </p>
      </div>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ color: '#94a3b8', fontSize: '12px' }}>Canvas via ref (dessine !)</p>
          <button onClick={clearCanvas} style={{ color: '#f87171', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>Effacer</button>
        </div>
        <canvas ref={canvasRef} width={280} height={140}
          onMouseDown={startDraw} onMouseUp={stopDraw} onMouseMove={draw}
          onTouchStart={startDraw} onTouchEnd={stopDraw} onTouchMove={draw}
          style={{
            width: '100%', height: '140px', borderRadius: '8px',
            background: '#252836', cursor: 'crosshair', touchAction: 'none',
          }} />
      </div>
    </div>
  )
}
