import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import donnéesInitiales from '../data/notes.json'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from '../lib/githubSync'
import Icon from '../components/Icon'
import { BoutonIcone, Repli } from '../components/UI'
import { T, grotesk, serif, PALETTE } from '../lib/theme'

const ESPACES_TÂCHES = [
  { id: 'perso', nom: 'Perso', stockage: 'react-blocs-taches-perso' },
  { id: 'pro', nom: 'Pro', stockage: 'react-blocs-taches-pro' },
]

const MODÈLES = [
  {
    nom: 'Courses', titre: 'Courses',
    blocs: () => [nouveauBloc('tache'), nouveauBloc('tache'), nouveauBloc('tache')],
  },
  {
    nom: 'Réunion', titre: 'Réunion',
    blocs: () => [
      { ...nouveauBloc('texte'), contenu: 'Ordre du jour : ' },
      { ...nouveauBloc('texte'), contenu: 'Décisions : ' },
      nouveauBloc('tache'),
    ],
  },
  {
    nom: 'Idée', titre: 'Idée',
    blocs: () => [{ ...nouveauBloc('texte'), contenu: '' }],
  },
]

// Rendu très simple **gras** et *italique* pour les blocs texte
function TexteFormaté({ texte }) {
  if (!texte) return null
  const parts = texte.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <p style={{ margin: 0, fontSize: '12.5px', color: T.textMuted, lineHeight: '1.5', wordBreak: 'break-word' }}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: T.text }}>{p.slice(2, -2)}</strong>
        if (p.startsWith('*') && p.endsWith('*')) return <em key={i} style={{ color: T.text }}>{p.slice(1, -1)}</em>
        return p
      })}
    </p>
  )
}

const STORAGE_KEY = 'react-blocs-notes'
const CHEMIN = 'react-blocks/src/data/notes.json'

function complète(objet) {
  return { notes: Array.isArray(objet.notes) ? objet.notes : [] }
}

function chargerDonnées() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return complète(JSON.parse(raw))
  } catch { /* ignore */ }
  return complète(donnéesInitiales)
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const TYPES_BLOC = [
  { type: 'texte', icon: 'texte', label: 'Texte' },
  { type: 'tache', icon: 'checklist', label: 'Tâche' },
  { type: 'choix', icon: 'radio', label: 'Choix' },
]

function nouveauBloc(type) {
  const id = uid()
  if (type === 'texte') return { id, type, contenu: '' }
  if (type === 'tache') return { id, type, texte: '', fait: false }
  return { id, type, question: '', options: [{ id: uid(), texte: '' }], sélection: null }
}

export default function Notes() {
  const [data, setData] = useState(chargerDonnées)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [tokenSaisi, setTokenSaisi] = useState('')
  const [statutSync, setStatutSync] = useState(token ? 'chargement' : 'lecture')
  const [erreurSync, setErreurSync] = useState('')
  const [syncOuvert, setSyncOuvert] = useState(false)
  const [messageImport, setMessageImport] = useState('')
  const [recherche, setRecherche] = useState('')
  const [couleurOuvertePour, setCouleurOuvertePour] = useState(null)
  const [lienOuvertPour, setLienOuvertPour] = useState(null)
  const [espaceLienChoisi, setEspaceLienChoisi] = useState('perso')
  const [noteEnGlissement, setNoteEnGlissement] = useState(null)
  const [noteSurvolée, setNoteSurvolée] = useState(null)
  const fichierRef = useRef(null)
  const shaRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const ignoreProchaineÉcritureRef = useRef(false)
  const prêtPourSyncRef = useRef(false)
  const dernierEnvoiRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    let annulé = false
    setStatutSync(s => (s === 'erreur' ? s : token ? 'chargement' : 'lecture'))
    lireDepuisGitHub(token, CHEMIN)
      .then(({ data: distant, sha }) => {
        if (annulé) return
        shaRef.current = sha
        dernierEnvoiRef.current = JSON.stringify(distant)
        ignoreProchaineÉcritureRef.current = true
        setData(complète(distant))
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

  useEffect(() => {
    if (!token) return
    if (!prêtPourSyncRef.current) return
    if (ignoreProchaineÉcritureRef.current) { ignoreProchaineÉcritureRef.current = false; return }
    const contenu = JSON.stringify(data)
    if (contenu === dernierEnvoiRef.current) return
    clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      setStatutSync('synchronisation')
      écrireVersGitHub(data, token, shaRef.current, CHEMIN)
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

  const ajouterNote = modèle => {
    const couleur = PALETTE[data.notes.length % PALETTE.length]
    setData(d => ({
      notes: [{
        id: uid(),
        titre: modèle ? modèle.titre : 'Nouvelle note',
        couleur,
        blocs: modèle ? modèle.blocs() : [],
      }, ...d.notes],
    }))
  }

  const supprimerNote = id => {
    setData(d => ({ notes: d.notes.filter(n => n.id !== id) }))
  }

  const renommerNote = (id, titre) => {
    setData(d => ({ notes: d.notes.map(n => n.id === id ? { ...n, titre } : n) }))
  }

  const changerCouleurNote = (id, couleur) => {
    setData(d => ({ notes: d.notes.map(n => n.id === id ? { ...n, couleur } : n) }))
  }

  const basculerÉpingle = id => {
    setData(d => ({ notes: d.notes.map(n => n.id === id ? { ...n, épinglé: !n.épinglé } : n) }))
  }

  const réordonnerNotes = (idSource, idCible) => {
    setData(d => {
      const notes = [...d.notes]
      const iSource = notes.findIndex(n => n.id === idSource)
      const iCible = notes.findIndex(n => n.id === idCible)
      if (iSource === -1 || iCible === -1 || iSource === iCible) return d
      const [élément] = notes.splice(iSource, 1)
      notes.splice(iCible, 0, élément)
      return { ...d, notes }
    })
  }

  const lierTâche = (noteId, espace, carte) => {
    setData(d => ({
      notes: d.notes.map(n => n.id === noteId ? { ...n, carteLiée: { espace, carteId: carte.id, texte: carte.texte } } : n),
    }))
    setLienOuvertPour(null)
  }

  const délierTâche = noteId => {
    setData(d => ({ notes: d.notes.map(n => n.id === noteId ? { ...n, carteLiée: null } : n) }))
  }

  const cartesDisponibles = espaceId => {
    try {
      const config = ESPACES_TÂCHES.find(e => e.id === espaceId)
      const brut = localStorage.getItem(config.stockage)
      if (!brut) return []
      const d = JSON.parse(brut)
      return (d.cartes || []).filter(c => !c.archivé)
    } catch {
      return []
    }
  }

  const majBloc = (noteId, blocId, changements) => {
    setData(d => ({
      notes: d.notes.map(n => n.id !== noteId ? n : {
        ...n,
        blocs: n.blocs.map(b => b.id === blocId ? { ...b, ...changements } : b),
      }),
    }))
  }

  const ajouterBloc = (noteId, type) => {
    setData(d => ({
      notes: d.notes.map(n => n.id !== noteId ? n : { ...n, blocs: [...n.blocs, nouveauBloc(type)] }),
    }))
  }

  const supprimerBloc = (noteId, blocId) => {
    setData(d => ({
      notes: d.notes.map(n => n.id !== noteId ? n : { ...n, blocs: n.blocs.filter(b => b.id !== blocId) }),
    }))
  }

  const ajouterOption = (noteId, blocId) => {
    setData(d => ({
      notes: d.notes.map(n => n.id !== noteId ? n : {
        ...n,
        blocs: n.blocs.map(b => b.id !== blocId ? b : { ...b, options: [...b.options, { id: uid(), texte: '' }] }),
      }),
    }))
  }

  const majOption = (noteId, blocId, optionId, texte) => {
    setData(d => ({
      notes: d.notes.map(n => n.id !== noteId ? n : {
        ...n,
        blocs: n.blocs.map(b => b.id !== blocId ? b : { ...b, options: b.options.map(o => o.id === optionId ? { ...o, texte } : o) }),
      }),
    }))
  }

  const supprimerOption = (noteId, blocId, optionId) => {
    setData(d => ({
      notes: d.notes.map(n => n.id !== noteId ? n : {
        ...n,
        blocs: n.blocs.map(b => {
          if (b.id !== blocId) return b
          const options = b.options.filter(o => o.id !== optionId)
          return { ...b, options, sélection: b.sélection === optionId ? null : b.sélection }
        }),
      }),
    }))
  }

  const exporter = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `notes-${date}.json`
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
        if (!Array.isArray(contenu.notes)) throw new Error('format invalide')
        setData(complète(contenu))
        setMessageImport('Fichier importé')
      } catch {
        setMessageImport('Fichier invalide')
      }
      setTimeout(() => setMessageImport(''), 3000)
    }
    reader.readAsText(fichier)
    e.target.value = ''
  }

  const noteCorrespond = (note, q) => {
    if (note.titre.toLowerCase().includes(q)) return true
    return note.blocs.some(b => {
      if (b.type === 'texte') return b.contenu.toLowerCase().includes(q)
      if (b.type === 'tache') return b.texte.toLowerCase().includes(q)
      if (b.type === 'choix') return b.question.toLowerCase().includes(q) || b.options.some(o => o.texte.toLowerCase().includes(q))
      return false
    })
  }

  const q = recherche.trim().toLowerCase()
  const notesFiltrées = [...data.notes]
    .filter(n => !q || noteCorrespond(n, q))
    .sort((a, b) => (b.épinglé ? 1 : 0) - (a.épinglé ? 1 : 0))

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
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '40px 16px 60px' }}>
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
        }}>Carnet</p>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '34px', color: T.text, margin: '0 0 22px', lineHeight: 1.1 }}>
          Notes
        </h1>

        {messageImport && (
          <p style={{ fontSize: '12px', color: T.accent, margin: '-14px 0 14px' }}>{messageImport}</p>
        )}

        <Repli
          icon={<span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statutCouleur, flexShrink: 0 }} />}
          texte={statutLabel}
          ouvert={syncOuvert}
          onToggle={() => setSyncOuvert(o => !o)}
          marginBottom={syncOuvert ? '8px' : '22px'}
        />

        {syncOuvert && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', marginBottom: '22px' }}>
            {token ? (
              <button onClick={déconnecterToken} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: T.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}><Icon nom="x" taille={13} /> Déconnecter le token</button>
            ) : (
              <div>
                <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 10px', lineHeight: '1.6' }}>
                  Colle un token GitHub pour écrire tes notes dans <code style={{ background: T.bg, padding: '1px 5px', borderRadius: '4px' }}>notes.json</code> — visible ensuite sur tous tes appareils.
                  Même token que la page Tâches si tu l'as déjà connecté là-bas.
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

        <button onClick={() => ajouterNote(null)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
          background: T.accent, color: T.accentText, border: 'none', borderRadius: '10px',
          padding: '12px', fontSize: '13px', fontWeight: 600, fontFamily: grotesk, cursor: 'pointer', marginBottom: '10px',
        }}>
          <Icon nom="plus" taille={15} trait={2.5} /> Nouvelle note
        </button>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {MODÈLES.map(m => (
            <button key={m.nom} onClick={() => ajouterNote(m)} style={{
              flex: 1, fontSize: '11px', color: T.textMuted, background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: '7px', padding: '8px 4px', cursor: 'pointer', fontFamily: grotesk,
            }}>{m.nom}</button>
          ))}
        </div>

        <div style={{ marginBottom: '22px' }}>
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher dans les notes…"
            style={{
              width: '100%', background: T.surface, color: T.text, border: `1px solid ${T.border}`,
              borderRadius: '10px', padding: '11px 14px', fontSize: '13px', outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid', gap: '16px', maxWidth: '1132px', margin: '0 auto',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 300px))', justifyContent: 'center',
      }}>
        {notesFiltrées.map((note, i) => {
          const rotation = i % 3 === 0 ? '-0.6deg' : i % 3 === 1 ? '0.5deg' : '-0.3deg'
          const enGlissement = noteEnGlissement === note.id
          const survolée = noteSurvolée === note.id
          return (
            <div
              key={note.id}
              draggable
              onDragStart={() => setNoteEnGlissement(note.id)}
              onDragEnd={() => { setNoteEnGlissement(null); setNoteSurvolée(null) }}
              onDragOver={e => {
                e.preventDefault()
                if (noteEnGlissement && noteEnGlissement !== note.id) setNoteSurvolée(note.id)
              }}
              onDragLeave={() => setNoteSurvolée(s => (s === note.id ? null : s))}
              onDrop={e => {
                e.preventDefault()
                if (noteEnGlissement && noteEnGlissement !== note.id) réordonnerNotes(noteEnGlissement, note.id)
                setNoteEnGlissement(null)
                setNoteSurvolée(null)
              }}
              style={{
                background: T.surface,
                border: survolée ? `2px dashed ${T.accent}` : `1px solid ${note.épinglé ? T.accent : T.border}`,
                borderRadius: '14px',
                padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px',
                transform: `rotate(${rotation})`, transition: 'transform .15s, opacity .15s',
                opacity: enGlissement ? 0.4 : 1,
              }}
              onFocus={e => { e.currentTarget.style.transform = 'rotate(0deg)' }}
              onBlur={e => { e.currentTarget.style.transform = `rotate(${rotation})` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span title="Glisser pour réordonner" style={{ display: 'flex', color: T.textMuted, cursor: 'grab', flexShrink: 0 }}>
                  <Icon nom="glisser" taille={14} />
                </span>
                <button
                  onClick={() => setCouleurOuvertePour(p => p === note.id ? null : note.id)}
                  title="Changer la couleur"
                  style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: note.couleur,
                    border: 'none', cursor: 'pointer', flexShrink: 0, marginRight: '4px',
                  }}
                />
                <input
                  value={note.titre}
                  onChange={e => renommerNote(note.id, e.target.value)}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none', minWidth: 0,
                    color: T.text, fontFamily: grotesk, fontWeight: 600, fontSize: '14px', padding: '2px 0',
                  }}
                />
                <BoutonIcone icon="epingle" title={note.épinglé ? 'Désépingler' : 'Épingler'} couleur={note.épinglé ? T.accent : T.textMuted} taille={14} onClick={() => basculerÉpingle(note.id)} />
                <BoutonIcone icon="lien" title="Lier une tâche" couleur={note.carteLiée ? T.accent : T.textMuted} taille={14} onClick={() => setLienOuvertPour(p => p === note.id ? null : note.id)} />
                <BoutonIcone icon="corbeille" title="Supprimer la note" couleur={T.danger} taille={14} onClick={() => supprimerNote(note.id)} />
              </div>

              {couleurOuvertePour === note.id && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => { changerCouleurNote(note.id, c); setCouleurOuvertePour(null) }} style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: c, cursor: 'pointer',
                      border: note.couleur === c ? `2px solid ${T.text}` : '2px solid transparent',
                    }} />
                  ))}
                </div>
              )}

              {note.carteLiée && (
                <Link to={`/taches/${note.carteLiée.espace}`} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.accent,
                  background: T.accentSoft, borderRadius: '7px', padding: '6px 8px',
                }}>
                  <Icon nom="lien" taille={11} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.carteLiée.texte}</span>
                  <span onClick={e => { e.preventDefault(); délierTâche(note.id) }} style={{ display: 'flex' }}><Icon nom="x" taille={11} /></span>
                </Link>
              )}

              {lienOuvertPour === note.id && (
                <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {ESPACES_TÂCHES.map(e => (
                      <button key={e.id} onClick={() => setEspaceLienChoisi(e.id)} style={{
                        flex: 1, fontSize: '11px', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontFamily: grotesk,
                        background: espaceLienChoisi === e.id ? T.accent : T.surface,
                        color: espaceLienChoisi === e.id ? T.accentText : T.textMuted,
                        border: `1px solid ${espaceLienChoisi === e.id ? T.accent : T.border}`,
                      }}>{e.nom}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                    {cartesDisponibles(espaceLienChoisi).length === 0 && (
                      <p style={{ fontSize: '11px', color: T.textMuted, margin: 0 }}>Aucune carte trouvée pour cet espace sur cet appareil.</p>
                    )}
                    {cartesDisponibles(espaceLienChoisi).map(c => (
                      <button key={c.id} onClick={() => lierTâche(note.id, espaceLienChoisi, c)} style={{
                        textAlign: 'left', fontSize: '12px', color: T.text, background: T.surface,
                        border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 9px', cursor: 'pointer',
                      }}>{c.texte}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {note.blocs.map(bloc => {
                  if (bloc.type === 'texte') return (
                    <div key={bloc.id}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <textarea
                          value={bloc.contenu}
                          onChange={e => majBloc(note.id, bloc.id, { contenu: e.target.value })}
                          placeholder="Écris quelque chose… (**gras**, *italique*)"
                          rows={2}
                          style={{
                            flex: 1, background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
                            borderRadius: '8px', padding: '8px 10px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit',
                          }}
                        />
                        <BoutonIcone icon="x" title="Retirer" taille={13} onClick={() => supprimerBloc(note.id, bloc.id)} />
                      </div>
                      {/\*\*[^*]+\*\*|\*[^*]+\*/.test(bloc.contenu) && (
                        <div style={{ padding: '6px 10px' }}>
                          <TexteFormaté texte={bloc.contenu} />
                        </div>
                      )}
                    </div>
                  )

                  if (bloc.type === 'tache') return (
                    <div key={bloc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={bloc.fait}
                        onChange={() => majBloc(note.id, bloc.id, { fait: !bloc.fait })}
                        style={{ accentColor: T.accent, width: '15px', height: '15px', flexShrink: 0 }}
                      />
                      <input
                        value={bloc.texte}
                        onChange={e => majBloc(note.id, bloc.id, { texte: e.target.value })}
                        placeholder="Une tâche…"
                        style={{
                          flex: 1, background: 'none', border: 'none', outline: 'none', borderBottom: `1px solid ${T.border}`,
                          color: bloc.fait ? T.textMuted : T.text, textDecoration: bloc.fait ? 'line-through' : 'none',
                          fontSize: '13px', padding: '3px 0', fontFamily: 'inherit',
                        }}
                      />
                      <BoutonIcone icon="x" title="Retirer" taille={13} onClick={() => supprimerBloc(note.id, bloc.id)} />
                    </div>
                  )

                  // choix : groupe de boutons radio
                  return (
                    <div key={bloc.id} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <input
                          value={bloc.question}
                          onChange={e => majBloc(note.id, bloc.id, { question: e.target.value })}
                          placeholder="Question…"
                          style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: T.text, fontSize: '12.5px', fontWeight: 600, fontFamily: grotesk,
                          }}
                        />
                        <BoutonIcone icon="x" title="Retirer le bloc" taille={13} onClick={() => supprimerBloc(note.id, bloc.id)} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {bloc.options.map(opt => (
                          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="radio"
                              name={`choix-${bloc.id}`}
                              checked={bloc.sélection === opt.id}
                              onChange={() => majBloc(note.id, bloc.id, { sélection: opt.id })}
                              style={{ accentColor: T.accent, width: '14px', height: '14px', flexShrink: 0 }}
                            />
                            <input
                              value={opt.texte}
                              onChange={e => majOption(note.id, bloc.id, opt.id, e.target.value)}
                              placeholder="Option…"
                              style={{
                                flex: 1, background: 'none', border: 'none', outline: 'none', borderBottom: `1px solid ${T.border}`,
                                color: T.text, fontSize: '12.5px', padding: '2px 0', fontFamily: 'inherit',
                              }}
                            />
                            <button onClick={() => supprimerOption(note.id, bloc.id, opt.id)} style={{
                              background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', display: 'flex', padding: 0,
                            }}><Icon nom="x" taille={11} /></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => ajouterOption(note.id, bloc.id)} style={{
                        marginTop: '8px', fontSize: '11px', color: T.accent, background: 'none', border: 'none',
                        cursor: 'pointer', padding: 0, fontFamily: grotesk, display: 'flex', alignItems: 'center', gap: '4px',
                      }}><Icon nom="plus" taille={11} /> Option</button>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '4px', borderTop: `1px solid ${T.border}`, paddingTop: '10px' }}>
                {TYPES_BLOC.map(t => (
                  <button
                    key={t.type}
                    onClick={() => ajouterBloc(note.id, t.type)}
                    title={`Ajouter un bloc ${t.label}`}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      fontSize: '11px', color: T.textMuted, background: T.surface2, border: `1px solid ${T.border}`,
                      borderRadius: '7px', padding: '7px 4px', cursor: 'pointer', fontFamily: grotesk,
                    }}
                  ><Icon nom={t.icon} taille={12} /> {t.label}</button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {data.notes.length === 0 && (
        <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '13px', marginTop: '20px' }}>
          Aucune note pour l'instant — touche « Nouvelle note » pour commencer.
        </p>
      )}
      {data.notes.length > 0 && notesFiltrées.length === 0 && (
        <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '13px', marginTop: '20px' }}>
          Aucune note ne correspond à « {recherche} ».
        </p>
      )}
    </div>
  )
}
