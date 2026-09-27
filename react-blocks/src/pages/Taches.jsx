import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import donnéesInitiales from '../data/taches.json'

const STORAGE_KEY = 'react-blocs-taches'

function chargerDonnées() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...parsed, timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [] }
    }
  } catch { /* ignore */ }
  // Aucune sauvegarde locale : on part du fichier data/taches.json du projet
  return donnéesInitiales
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function Taches() {
  const [data, setData] = useState(chargerDonnées)
  const [nouvelleCarte, setNouvelleCarte] = useState({})
  const [éditionId, setÉditionId] = useState(null)
  const [texteÉdition, setTexteÉdition] = useState('')
  const [colonneÉditionId, setColonneÉditionId] = useState(null)
  const [titreÉdition, setTitreÉdition] = useState('')
  const [messageImport, setMessageImport] = useState('')
  const dragCarte = useRef(null)
  const fichierRef = useRef(null)

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

  const ajouterÉvénementTimeline = (carteId, date) => {
    const carte = data.cartes.find(c => c.id === carteId)
    if (!carte) return
    setData(d => ({
      ...d,
      timeline: [...d.timeline, { id: uid(), colonneId: carte.colonneId, texte: carte.texte, date }],
    }))
  }

  const supprimerÉvénementTimeline = id => {
    setData(d => ({ ...d, timeline: d.timeline.filter(ev => ev.id !== id) }))
  }

  const onDropTimeline = date => {
    if (dragCarte.current) {
      ajouterÉvénementTimeline(dragCarte.current, date)
      dragCarte.current = null
    }
  }

  const démarrerÉditionColonne = col => {
    setColonneÉditionId(col.id)
    setTitreÉdition(col.titre)
  }

  const validerÉditionColonne = id => {
    const titre = titreÉdition.trim()
    setColonneÉditionId(null)
    if (!titre) return
    setData(d => ({
      ...d,
      colonnes: d.colonnes.map(c => c.id === id ? { ...c, titre } : c),
    }))
  }

  const exporter = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `mes-taches-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importer = e => {
    const fichier = e.target.files[0]
    if (!fichier) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const contenu = JSON.parse(reader.result)
        if (!Array.isArray(contenu.colonnes) || !Array.isArray(contenu.cartes)) {
          throw new Error('format invalide')
        }
        setData({ ...contenu, timeline: Array.isArray(contenu.timeline) ? contenu.timeline : [] })
        setMessageImport('✅ Fichier importé')
      } catch {
        setMessageImport('❌ Fichier invalide')
      }
      setTimeout(() => setMessageImport(''), 3000)
    }
    reader.readAsText(fichier)
    e.target.value = ''
  }

  const aujourdhuiISO = new Date().toISOString().slice(0, 10)
  const jours = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      num: d.getDate(),
    }
  })

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', maxWidth: '520px', margin: '0 auto 10px' }}>
        <Link to="/" style={{ color: '#94a3b8', fontSize: '14px' }}>← Accueil</Link>
        <div style={{ flex: 1 }} />
        <h1 style={{ fontSize: '18px', color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 Mes tâches
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px', maxWidth: '520px', margin: '0 auto 20px' }}>
        <button onClick={exporter} style={{
          fontSize: '12px', color: '#94a3b8', background: '#1a1d27', border: '1px solid #2d3148',
          borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}>⬇ Exporter (.json)</button>
        <button onClick={() => fichierRef.current?.click()} style={{
          fontSize: '12px', color: '#94a3b8', background: '#1a1d27', border: '1px solid #2d3148',
          borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}>⬆ Importer</button>
        <input ref={fichierRef} type="file" accept="application/json" onChange={importer} style={{ display: 'none' }} />
        {messageImport && (
          <span style={{ fontSize: '12px', color: messageImport.startsWith('✅') ? '#4ade80' : '#f87171', alignSelf: 'center' }}>
            {messageImport}
          </span>
        )}
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
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.couleur, flexShrink: 0 }} />
                {colonneÉditionId === col.id ? (
                  <input
                    autoFocus
                    value={titreÉdition}
                    onChange={e => setTitreÉdition(e.target.value)}
                    onBlur={() => validerÉditionColonne(col.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); validerÉditionColonne(col.id) }
                      if (e.key === 'Escape') setColonneÉditionId(null)
                    }}
                    style={{
                      flex: 1, background: '#0d0f14', color: '#e2e8f0',
                      border: '1px solid #6c63ff', borderRadius: '6px',
                      padding: '2px 6px', fontSize: '14px', fontWeight: 'bold', outline: 'none',
                    }}
                  />
                ) : (
                  <strong
                    onClick={() => démarrerÉditionColonne(col)}
                    title="Cliquer pour renommer"
                    style={{ color: '#e2e8f0', fontSize: '14px', flex: 1, cursor: 'text' }}
                  >{col.titre}</strong>
                )}
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

      <div style={{ maxWidth: '1100px', margin: '28px auto 0' }}>
        <h2 style={{ fontSize: '15px', color: '#e2e8f0', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🗓 Timeline
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 12px' }}>
          Glisse une carte depuis un bloc et dépose-la sur un jour — une copie est planifiée ici, l'originale reste dans son bloc
        </p>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 4px 16px' }}>
          {jours.map(jour => {
            const événements = data.timeline.filter(ev => ev.date === jour.iso)
            const estAujourdhui = jour.iso === aujourdhuiISO
            return (
              <div
                key={jour.iso}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDropTimeline(jour.iso)}
                style={{
                  minWidth: '140px', maxWidth: '140px', flexShrink: 0,
                  background: estAujourdhui ? '#6c63ff15' : '#1a1d27',
                  border: estAujourdhui ? '1px solid #6c63ff' : '1px solid #2d3148',
                  borderRadius: '10px', padding: '10px',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: estAujourdhui ? '#a78bfa' : '#94a3b8', textTransform: 'capitalize' }}>
                    {jour.label}
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#e2e8f0' }}>{jour.num}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '30px' }}>
                  {événements.map(ev => {
                    const colOrigine = data.colonnes.find(c => c.id === ev.colonneId)
                    return (
                      <div key={ev.id} style={{
                        background: '#252836', borderRadius: '6px', padding: '6px 8px',
                        borderLeft: `3px solid ${colOrigine?.couleur || '#6c63ff'}`,
                      }}>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#e2e8f0', lineHeight: '1.4', wordBreak: 'break-word' }}>
                          {ev.texte}
                        </p>
                        <button onClick={() => supprimerÉvénementTimeline(ev.id)} style={{
                          fontSize: '10px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        }}>🗑 Retirer</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
        Glisse une carte vers une autre colonne pour la déplacer · sauvegarde automatique sur cet appareil
        <br />Utilise « Exporter » pour garder un fichier de sauvegarde ou le transférer vers un autre appareil
      </p>
    </div>
  )
}
