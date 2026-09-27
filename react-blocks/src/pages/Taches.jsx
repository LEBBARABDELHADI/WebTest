import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import donnéesInitiales from '../data/taches.json'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from '../lib/githubSync'
import Icon from '../components/Icon'

const STORAGE_KEY = 'react-blocs-taches'

const T = {
  bg: '#141210',
  surface: '#1c1814',
  surface2: '#26201a',
  border: '#3a3125',
  text: '#f3ecdf',
  textMuted: '#a99a80',
  accent: '#f0a839',
  accentText: '#221806',
  accentSoft: 'rgba(240,168,57,0.14)',
  danger: '#e2574c',
  dangerSoft: 'rgba(226,87,76,0.12)',
}

const grotesk = "'Space Grotesk', 'Segoe UI', sans-serif"
const serif = "'Fraunces', Georgia, serif"

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

function BoutonIcone({ icon, onClick, title, couleur = T.textMuted, taille = 15 }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', borderRadius: '7px',
        color: couleur, cursor: 'pointer', flexShrink: 0,
      }}
    >
      <Icon nom={icon} taille={taille} />
    </button>
  )
}

export default function Taches() {
  const [data, setData] = useState(chargerDonnées)
  const [nouvelleCarte, setNouvelleCarte] = useState({})
  const [éditionId, setÉditionId] = useState(null)
  const [texteÉdition, setTexteÉdition] = useState('')
  const [colonneÉditionId, setColonneÉditionId] = useState(null)
  const [titreÉdition, setTitreÉdition] = useState('')
  const [messageImport, setMessageImport] = useState('')
  const [jourSélectionné, setJourSélectionné] = useState(() => new Date().toISOString().slice(0, 10))
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [tokenSaisi, setTokenSaisi] = useState('')
  const [statutSync, setStatutSync] = useState(token ? 'chargement' : 'lecture')
  const [erreurSync, setErreurSync] = useState('')
  const [syncOuvert, setSyncOuvert] = useState(false)
  const dragCarte = useRef(null)
  const fichierRef = useRef(null)
  const shaRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const ignoreProchaineÉcritureRef = useRef(false)
  const prêtPourSyncRef = useRef(false)
  const dernierEnvoiRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // Lecture depuis le fichier data/taches.json du dépôt GitHub (fonctionne
  // sans token car le dépôt est public) — c'est ce qui permet de retrouver
  // les mêmes données sur n'importe quel ordinateur.
  useEffect(() => {
    let annulé = false
    setStatutSync(s => (s === 'erreur' ? s : token ? 'chargement' : 'lecture'))
    lireDepuisGitHub(token)
      .then(({ data: distant, sha }) => {
        if (annulé) return
        shaRef.current = sha
        dernierEnvoiRef.current = JSON.stringify(distant)
        ignoreProchaineÉcritureRef.current = true
        setData({ ...distant, timeline: Array.isArray(distant.timeline) ? distant.timeline : [] })
        setStatutSync(token ? 'connecté' : 'lecture-seule')
      })
      .catch(err => {
        if (annulé) return
        setStatutSync('erreur')
        setErreurSync(err.message)
      })
      .finally(() => { prêtPourSyncRef.current = true })
    return () => { annulé = true }
  }, [token])

  // Écriture différée vers GitHub après chaque modification, si un token
  // est configuré. Sans token, seule la sauvegarde locale (ci-dessus) joue.
  useEffect(() => {
    if (!token) return
    if (!prêtPourSyncRef.current) return
    if (ignoreProchaineÉcritureRef.current) { ignoreProchaineÉcritureRef.current = false; return }
    const contenu = JSON.stringify(data)
    if (contenu === dernierEnvoiRef.current) return
    clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      setStatutSync('synchronisation')
      écrireVersGitHub(data, token, shaRef.current)
        .then(({ sha }) => {
          shaRef.current = sha
          dernierEnvoiRef.current = contenu
          setStatutSync('connecté')
        })
        .catch(err => {
          setStatutSync('erreur')
          setErreurSync(err.message)
        })
    }, 1500)
    return () => clearTimeout(syncTimeoutRef.current)
  }, [data, token])

  const connecterToken = () => {
    const t = tokenSaisi.trim()
    if (!t) return
    localStorage.setItem(TOKEN_KEY, t)
    setTokenSaisi('')
    setToken(t)
  }

  const déconnecterToken = () => {
    localStorage.removeItem(TOKEN_KEY)
    shaRef.current = null
    setToken('')
  }

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
        setMessageImport('Fichier importé')
      } catch {
        setMessageImport('Fichier invalide')
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

  const statutCouleur = {
    lecture: T.textMuted, 'lecture-seule': T.textMuted, chargement: T.accent,
    synchronisation: T.accent, connecté: '#7fb069', erreur: T.danger,
  }[statutSync]

  const statutLabel = {
    lecture: 'Lecture depuis le dépôt…',
    'lecture-seule': 'Lecture seule — pas de token connecté',
    chargement: 'Lecture depuis GitHub…',
    synchronisation: 'Synchronisation en cours…',
    connecté: 'Synchronisé avec GitHub',
    erreur: erreurSync || 'Erreur de synchronisation',
  }[statutSync]

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.textMuted, fontSize: '13px', fontFamily: grotesk }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <div style={{ display: 'flex', gap: '2px' }}>
            <BoutonIcone icon="telecharger" title="Exporter en .json" onClick={exporter} />
            <BoutonIcone icon="televerser" title="Importer un .json" onClick={() => fichierRef.current?.click()} />
            <input ref={fichierRef} type="file" accept="application/json" onChange={importer} style={{ display: 'none' }} />
          </div>
        </div>

        <p style={{
          fontFamily: grotesk, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
          color: T.accent, margin: '0 0 4px', fontWeight: 600,
        }}>Planning personnel</p>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '34px', color: T.text, margin: '0 0 22px', lineHeight: 1.1 }}>
          Mes tâches
        </h1>

        {messageImport && (
          <p style={{ fontSize: '12px', color: T.accent, margin: '-14px 0 14px' }}>{messageImport}</p>
        )}

        <button
          onClick={() => setSyncOuvert(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px',
            padding: '10px 12px', marginBottom: syncOuvert ? '8px' : '22px', cursor: 'pointer',
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statutCouleur, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: T.textMuted, flex: 1, textAlign: 'left', fontFamily: grotesk }}>
            {statutLabel}
          </span>
          <Icon nom="chevronBas" taille={14} style={{ color: T.textMuted, transform: syncOuvert ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>

        {syncOuvert && (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px',
            padding: '14px', marginBottom: '22px',
          }}>
            {token ? (
              <button onClick={déconnecterToken} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: T.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}><Icon nom="x" taille={13} /> Déconnecter le token</button>
            ) : (
              <div>
                <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 10px', lineHeight: '1.6' }}>
                  Colle un token GitHub pour écrire tes modifications dans <code style={{ background: T.bg, padding: '1px 5px', borderRadius: '4px' }}>data/taches.json</code> — visible ensuite sur tous tes appareils.
                  Génère-le sur <strong style={{ color: T.text }}>github.com → Settings → Developer settings → Fine-grained tokens</strong>, limité au dépôt <strong style={{ color: T.text }}>WebTest</strong>, permission <strong style={{ color: T.text }}>Contents: Read and write</strong>.
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="password"
                    value={tokenSaisi}
                    onChange={e => setTokenSaisi(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') connecterToken() }}
                    placeholder="github_pat_…"
                    style={{
                      flex: 1, background: T.bg, color: T.text,
                      border: `1px solid ${T.border}`, borderRadius: '7px',
                      padding: '9px 10px', fontSize: '13px', outline: 'none',
                    }}
                  />
                  <button onClick={connecterToken} style={{
                    background: T.accent, color: T.accentText, border: 'none', fontWeight: 600,
                    borderRadius: '7px', padding: '0 16px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                  }}>Connecter</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: '14px', overflowX: 'auto', padding: '4px 16px 20px',
        maxWidth: '1132px', margin: '0 auto',
        scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch',
      }}>
        {data.colonnes.map(col => {
          const cartes = data.cartes.filter(c => c.colonneId === col.id)
          return (
            <div
              key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              style={{
                minWidth: 'min(272px, 84vw)', maxWidth: 'min(272px, 84vw)', flexShrink: 0,
                background: T.surface, borderRadius: '14px',
                border: `1px solid ${T.border}`, padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '12px',
                scrollSnapAlign: 'start',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ width: '3px', height: '16px', borderRadius: '2px', background: col.couleur, flexShrink: 0 }} />
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
                      flex: 1, background: T.bg, color: T.text,
                      border: `1px solid ${T.accent}`, borderRadius: '6px',
                      padding: '2px 6px', fontSize: '14px', fontWeight: 600, outline: 'none', fontFamily: grotesk,
                    }}
                  />
                ) : (
                  <strong
                    onClick={() => démarrerÉditionColonne(col)}
                    title="Toucher pour renommer"
                    style={{ color: T.text, fontSize: '14px', flex: 1, cursor: 'text', fontFamily: grotesk, fontWeight: 600 }}
                  >{col.titre}</strong>
                )}
                <span style={{
                  fontSize: '11px', color: T.textMuted, background: T.bg,
                  padding: '2px 8px', borderRadius: '20px', fontFamily: 'monospace',
                }}>{cartes.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '20px' }}>
                {cartes.map(carte => (
                  <div
                    key={carte.id}
                    draggable
                    onDragStart={() => { dragCarte.current = carte.id }}
                    style={{
                      background: T.surface2, borderRadius: '10px', padding: '10px 10px 6px',
                      border: `1px solid ${T.border}`,
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
                            width: '100%', background: T.bg, color: T.text,
                            border: `1px solid ${T.accent}`, borderRadius: '6px', padding: '6px 8px',
                            fontSize: '13px', resize: 'vertical', fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '2px 0 4px' }}>
                          <button onClick={() => setÉditionId(null)} style={{
                            fontSize: '12px', color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer',
                          }}>Annuler</button>
                          <button onClick={() => validerÉdition(carte.id)} style={{
                            fontSize: '12px', color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                          }}>Valider</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: T.text, fontSize: '13.5px', margin: '0 0 8px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {carte.texte}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <BoutonIcone icon="crayon" title="Modifier" onClick={() => démarrerÉdition(carte)} taille={14} />
                          <BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} onClick={() => supprimerCarte(carte.id)} taille={14} />
                          <BoutonIcone icon="calendrier" title="Ajouter au jour sélectionné" couleur={T.accent} onClick={() => ajouterÉvénementTimeline(carte.id, jourSélectionné)} taille={14} />
                          <select
                            value={col.id}
                            onChange={e => déplacerCarte(carte.id, e.target.value)}
                            title="Déplacer vers un autre bloc"
                            style={{
                              fontSize: '11px', color: T.textMuted, background: T.bg,
                              border: `1px solid ${T.border}`, borderRadius: '6px', padding: '4px 4px',
                              marginLeft: 'auto', maxWidth: '104px',
                            }}
                          >
                            {data.colonnes.map(c => (
                              <option key={c.id} value={c.id}>{c.titre}</option>
                            ))}
                          </select>
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
                    flex: 1, background: T.bg, color: T.text,
                    border: `1px solid ${T.border}`, borderRadius: '7px',
                    padding: '9px 10px', fontSize: '13px', outline: 'none',
                  }}
                />
                <button type="submit" aria-label="Ajouter" style={{
                  background: T.accent, color: T.accentText, border: 'none',
                  borderRadius: '7px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}><Icon nom="plus" taille={16} trait={2.5} /></button>
              </form>
            </div>
          )
        })}
      </div>

      <div style={{ maxWidth: '560px', margin: '30px auto 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px' }}>
          <Icon nom="calendrier" taille={16} style={{ color: T.accent }} />
          <h2 style={{ fontFamily: grotesk, fontSize: '14px', fontWeight: 600, color: T.text, margin: 0 }}>Timeline</h2>
        </div>
        <p style={{ color: T.textMuted, fontSize: '12px', margin: '0 0 14px', lineHeight: '1.5' }}>
          Sélectionne un jour, puis touche l'icône calendrier d'une carte (ou glisse-la ici sur ordinateur).
        </p>

        <div style={{
          display: 'flex', gap: '7px', overflowX: 'auto', padding: '2px 2px 12px',
          scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch',
        }}>
          {jours.map(jour => {
            const nbÉvénements = data.timeline.filter(ev => ev.date === jour.iso).length
            const estAujourdhui = jour.iso === aujourdhuiISO
            const estSélectionné = jour.iso === jourSélectionné
            return (
              <button
                key={jour.iso}
                onClick={() => setJourSélectionné(jour.iso)}
                style={{
                  minWidth: '50px', flexShrink: 0, scrollSnapAlign: 'start',
                  background: estSélectionné ? T.accent : T.surface,
                  border: estSélectionné ? `1px solid ${T.accent}` : estAujourdhui ? `1px dashed ${T.accent}` : `1px solid ${T.border}`,
                  borderRadius: '10px', padding: '8px 4px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                }}
              >
                <span style={{ fontSize: '10px', color: estSélectionné ? T.accentText : T.textMuted, textTransform: 'capitalize', fontFamily: grotesk }}>
                  {jour.label}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: estSélectionné ? T.accentText : T.text, fontFamily: grotesk }}>
                  {jour.num}
                </span>
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: nbÉvénements > 0 ? (estSélectionné ? T.accentText : T.accent) : 'transparent',
                }} />
              </button>
            )
          })}
        </div>

        <div
          onDragOver={e => e.preventDefault()}
          onDrop={() => onDropTimeline(jourSélectionné)}
          style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px',
            padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '84px',
          }}
        >
          <strong style={{ color: T.text, fontSize: '15px', textTransform: 'capitalize', fontFamily: serif, fontStyle: 'italic', fontWeight: 500 }}>
            {jourSélectionné === aujourdhuiISO ? "Aujourd'hui" : new Date(jourSélectionné).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </strong>
          {data.timeline.filter(ev => ev.date === jourSélectionné).length === 0 && (
            <p style={{ color: T.textMuted, fontSize: '12px', margin: 0 }}>Rien de planifié pour ce jour</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.timeline.filter(ev => ev.date === jourSélectionné).map(ev => {
              const colOrigine = data.colonnes.find(c => c.id === ev.colonneId)
              return (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'stretch', background: T.surface2,
                  borderRadius: '8px', border: `1px solid ${T.border}`, overflow: 'hidden',
                }}>
                  <span style={{ width: '3px', background: colOrigine?.couleur || T.accent, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '13px', color: T.text, lineHeight: '1.4', flex: 1, wordBreak: 'break-word', padding: '9px 10px' }}>
                    {ev.texte}
                  </p>
                  <BoutonIcone icon="corbeille" title="Retirer" couleur={T.danger} taille={13} onClick={() => supprimerÉvénementTimeline(ev.id)} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '11.5px', maxWidth: '440px', margin: '26px auto 0', lineHeight: '1.7' }}>
        Glisse une carte vers un autre bloc pour la déplacer sur ordinateur, ou utilise le menu déroulant sur mobile.
        Sauvegarde automatique sur cet appareil — « Exporter » garde un fichier de secours.
      </p>
    </div>
  )
}
