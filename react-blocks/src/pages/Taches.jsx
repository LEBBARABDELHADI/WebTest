import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'react-blocs-taches'

const COLONNES_DEFAUT = [
  { id: 'c1', titre: "Aujourd'hui", couleur: '#fbbf24' },
  { id: 'c2', titre: 'Cette semaine', couleur: '#4ade80' },
  { id: 'c3', titre: 'Plus tard', couleur: '#a78bfa' },
]

function chargerDonnées() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { colonnes: COLONNES_DEFAUT, cartes: [] }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function Taches() {
  const [data, setData] = useState(chargerDonnées)
  const [nouvelleCarte, setNouvelleCarte] = useState({})
  const [éditionId, setÉditionId] = useState(null)
  const [texteÉdition, setTexteÉdition] = useState('')
  const dragCarte = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const ajouterCarte = colonneId => {
    const texte = (nouvelleCarte[colonneId] || '').trim()
    if (!texte) return
    setData(d => ({
      ...d,
      cartes: [...d.cartes, { id: uid(), colonneId, texte }],
    }))
    setNouvelleCarte(n => ({ ...n, [colonneId]: '' }))
  }

  const supprimerCarte = id => {
    setData(d => ({ ...d, cartes: d.cartes.filter(c => c.id !== id) }))
  }

  const démarrerÉdition = carte => {
    setÉditionId(carte.id)
    setTexteÉdition(carte.texte)
  }

  const validerÉdition = id => {
    const texte = texteÉdition.trim()
    if (!texte) { supprimerCarte(id); setÉditionId(null); return }
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => c.id === id ? { ...c, texte } : c),
    }))
    setÉditionId(null)
  }

  const déplacerCarte = (carteId, colonneId) => {
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => c.id === carteId ? { ...c, colonneId } : c),
    }))
  }

  const onDrop = colonneId => {
    if (dragCarte.current) {
      déplacerCarte(dragCarte.current, colonneId)
      dragCarte.current = null
    }
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', maxWidth: '520px', margin: '0 auto 20px' }}>
        <Link to="/" style={{ color: '#94a3b8', fontSize: '14px' }}>← Accueil</Link>
        <div style={{ flex: 1 }} />
        <h1 style={{ fontSize: '18px', color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 Mes tâches
        </h1>
      </div>

      <div style={{
        display: 'flex', gap: '14px', overflowX: 'auto', padding: '4px 4px 20px',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        {data.colonnes.map(col => {
          const cartes = data.cartes.filter(c => c.colonneId === col.id)
          return (
            <div
              key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              style={{
                minWidth: '260px', maxWidth: '260px', flexShrink: 0,
                background: '#1a1d27', borderRadius: '12px',
                border: '1px solid #2d3148', padding: '12px',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.couleur }} />
                <strong style={{ color: '#e2e8f0', fontSize: '14px', flex: 1 }}>{col.titre}</strong>
                <span style={{
                  fontSize: '11px', color: col.couleur, background: col.couleur + '22',
                  padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold',
                }}>{cartes.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '20px' }}>
                {cartes.map(carte => (
                  <div
                    key={carte.id}
                    draggable
                    onDragStart={() => { dragCarte.current = carte.id }}
                    style={{
                      background: '#252836', borderRadius: '8px', padding: '10px 12px',
                      border: '1px solid #2d3148', cursor: 'grab',
                    }}
                  >
                    {éditionId === carte.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <textarea
                          autoFocus
                          value={texteÉdition}
                          onChange={e => setTexteÉdition(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); validerÉdition(carte.id) }
                            if (e.key === 'Escape') setÉditionId(null)
                          }}
                          style={{
                            width: '100%', background: '#0d0f14', color: '#e2e8f0',
                            border: '1px solid #6c63ff', borderRadius: '6px', padding: '6px 8px',
                            fontSize: '13px', resize: 'vertical', fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setÉditionId(null)} style={{
                            fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer',
                          }}>Annuler</button>
                          <button onClick={() => validerÉdition(carte.id)} style={{
                            fontSize: '12px', color: '#6c63ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                          }}>Valider</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: '#e2e8f0', fontSize: '13px', margin: '0 0 8px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {carte.texte}
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => démarrerÉdition(carte)} style={{
                            fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          }}>✏️ Modifier</button>
                          <button onClick={() => supprimerCarte(carte.id)} style={{
                            fontSize: '11px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          }}>🗑 Supprimer</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={e => { e.preventDefault(); ajouterCarte(col.id) }}
                style={{ display: 'flex', gap: '6px' }}
              >
                <input
                  value={nouvelleCarte[col.id] || ''}
                  onChange={e => setNouvelleCarte(n => ({ ...n, [col.id]: e.target.value }))}
                  placeholder="Ajouter une carte…"
                  enterKeyHint="done"
                  style={{
                    flex: 1, background: '#0d0f14', color: '#e2e8f0',
                    border: '1px solid #2d3148', borderRadius: '6px',
                    padding: '8px 10px', fontSize: '13px', outline: 'none',
                  }}
                />
                <button type="submit" style={{
                  background: '#6c63ff', color: '#fff', border: 'none',
                  borderRadius: '6px', padding: '0 12px', fontSize: '16px', cursor: 'pointer',
                }}>+</button>
              </form>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
        Glisse une carte vers une autre colonne pour la déplacer · sauvegarde automatique sur cet appareil
      </p>
    </div>
  )
}
