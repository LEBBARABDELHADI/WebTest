import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import donnéesPerso from '../data/memoriser-perso.json'
import donnéesPro from '../data/memoriser-pro.json'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from '../lib/githubSync'
import Icon from '../components/Icon'
import { BoutonIcone, Repli } from '../components/UI'
import { grotesk, serif, PALETTE, useTheme, useThemeMode } from '../lib/theme'

const ESPACES = {
  perso: {
    id: 'perso',
    titre: 'Mémoriser perso',
    eyebrow: 'Flashcards perso',
    chemin: 'react-blocks/src/data/memoriser-perso.json',
    stockage: 'react-blocs-memoriser-perso',
    données: donnéesPerso,
  },
  pro: {
    id: 'pro',
    titre: 'Mémoriser pro',
    eyebrow: 'Flashcards pro',
    chemin: 'react-blocks/src/data/memoriser-pro.json',
    stockage: 'react-blocs-memoriser-pro',
    données: donnéesPro,
  },
}

// Répétition espacée façon Leitner : chaque carte a un niveau (index dans
// INTERVALLES) qui fixe dans combien de jours elle revient. Une bonne
// réponse fait monter d'un niveau (intervalle plus long), une mauvaise
// renvoie direct au niveau 0 (revue dès aujourd'hui).
const INTERVALLES = [0, 1, 3, 7, 14, 30, 90]

function complète(objet) {
  return {
    paquets: Array.isArray(objet.paquets) ? objet.paquets : [],
    cartes: Array.isArray(objet.cartes) ? objet.cartes : [],
  }
}

function chargerDonnées(config) {
  try {
    const raw = localStorage.getItem(config.stockage)
    if (raw) return complète(JSON.parse(raw))
  } catch { /* ignore */ }
  return complète(config.données)
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10)
}

function dateDans(jours) {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

function mélanger(tableau) {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

export default function Memoriser() {
  const { espace: espaceParam } = useParams()
  const config = ESPACES[espaceParam] || ESPACES.perso
  const T = useTheme()
  const { mode, basculer } = useThemeMode()

  const [data, setData] = useState(() => chargerDonnées(config))
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [tokenSaisi, setTokenSaisi] = useState('')
  const [statutSync, setStatutSync] = useState(token ? 'chargement' : 'lecture')
  const [erreurSync, setErreurSync] = useState('')
  const [syncOuvert, setSyncOuvert] = useState(false)

  const [nouveauPaquetNom, setNouveauPaquetNom] = useState('')
  const [couleurPaquet, setCouleurPaquet] = useState(PALETTE[0])
  const [paquetOuvertId, setPaquetOuvertId] = useState(null)
  const [nouvelleCarte, setNouvelleCarte] = useState({})
  const [éditionCarteId, setÉditionCarteId] = useState(null)
  const [éditionRecto, setÉditionRecto] = useState('')
  const [éditionVerso, setÉditionVerso] = useState('')

  const [vue, setVue] = useState('liste') // 'liste' | 'revision'
  const [paquetRévisionId, setPaquetRévisionId] = useState(null) // null = tous les paquets
  const [fileRévision, setFileRévision] = useState([])
  const [indexRévision, setIndexRévision] = useState(0)
  const [estRetournée, setEstRetournée] = useState(false)
  const [sues, setSues] = useState(0)

  const shaRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const ignoreProchaineÉcritureRef = useRef(false)
  const prêtPourSyncRef = useRef(false)
  const dernierEnvoiRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(config.stockage, JSON.stringify(data))
  }, [data, config.stockage])

  // Lecture depuis le fichier data/memoriser-{espace}.json du dépôt GitHub
  // (fonctionne sans token car le dépôt est public).
  useEffect(() => {
    let annulé = false
    setStatutSync(s => (s === 'erreur' ? s : token ? 'chargement' : 'lecture'))
    lireDepuisGitHub(token, config.chemin)
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
  }, [token, config.chemin])

  // Écriture différée vers GitHub après chaque modification, si un token
  // est configuré (le même que pour Programme/Notes).
  useEffect(() => {
    if (!token) return
    if (!prêtPourSyncRef.current) return
    if (ignoreProchaineÉcritureRef.current) { ignoreProchaineÉcritureRef.current = false; return }
    const contenu = JSON.stringify(data)
    if (contenu === dernierEnvoiRef.current) return
    clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      setStatutSync('synchronisation')
      écrireVersGitHub(data, token, shaRef.current, config.chemin)
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
  }, [data, token, config.chemin])

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

  const ajouterPaquet = () => {
    const nom = nouveauPaquetNom.trim()
    if (!nom) return
    setData(d => ({ ...d, paquets: [...d.paquets, { id: uid(), nom, couleur: couleurPaquet }] }))
    setNouveauPaquetNom('')
  }

  const supprimerPaquet = (id, nom) => {
    const nb = data.cartes.filter(c => c.paquetId === id).length
    const message = nb > 0
      ? `Supprimer le paquet « ${nom} » et ${nb > 1 ? 'ses' : 'sa'} ${nb} carte${nb > 1 ? 's' : ''} ?`
      : `Supprimer le paquet « ${nom} » ?`
    if (!window.confirm(message)) return
    setData(d => ({
      ...d,
      paquets: d.paquets.filter(p => p.id !== id),
      cartes: d.cartes.filter(c => c.paquetId !== id),
    }))
    if (paquetOuvertId === id) setPaquetOuvertId(null)
  }

  const ajouterCarte = paquetId => {
    const saisie = nouvelleCarte[paquetId] || {}
    const recto = (saisie.recto || '').trim()
    const verso = (saisie.verso || '').trim()
    if (!recto || !verso) return
    setData(d => ({
      ...d,
      cartes: [...d.cartes, { id: uid(), paquetId, recto, verso, niveau: 0, prochaineRevision: aujourdhuiISO() }],
    }))
    setNouvelleCarte(n => ({ ...n, [paquetId]: { recto: '', verso: '' } }))
  }

  const supprimerCarte = id => {
    setData(d => ({ ...d, cartes: d.cartes.filter(c => c.id !== id) }))
  }

  const démarrerÉditionCarte = carte => {
    setÉditionCarteId(carte.id)
    setÉditionRecto(carte.recto)
    setÉditionVerso(carte.verso)
  }

  const validerÉditionCarte = id => {
    const recto = éditionRecto.trim()
    const verso = éditionVerso.trim()
    setÉditionCarteId(null)
    if (!recto || !verso) return
    setData(d => ({ ...d, cartes: d.cartes.map(c => c.id === id ? { ...c, recto, verso } : c) }))
  }

  const cartesDues = paquetId => {
    const auj = aujourdhuiISO()
    return data.cartes.filter(c => (!paquetId || c.paquetId === paquetId) && (!c.prochaineRevision || c.prochaineRevision <= auj))
  }

  const démarrerRévision = paquetId => {
    const file = mélanger(cartesDues(paquetId).map(c => c.id))
    if (file.length === 0) return
    setPaquetRévisionId(paquetId)
    setFileRévision(file)
    setIndexRévision(0)
    setEstRetournée(false)
    setSues(0)
    setVue('revision')
  }

  const répondre = su => {
    const carteId = fileRévision[indexRévision]
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => {
        if (c.id !== carteId) return c
        const niveau = su ? Math.min((c.niveau || 0) + 1, INTERVALLES.length - 1) : 0
        return { ...c, niveau, prochaineRevision: dateDans(INTERVALLES[niveau]) }
      }),
    }))
    if (su) setSues(s => s + 1)
    setEstRetournée(false)
    setIndexRévision(i => i + 1)
  }

  const quitterRévision = () => {
    setVue('liste')
    setFileRévision([])
  }

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

  const totalDû = cartesDues(null).length
  const carteActuelle = data.cartes.find(c => c.id === fileRévision[indexRévision])
  const nomPaquetRévision = paquetRévisionId ? data.paquets.find(p => p.id === paquetRévisionId)?.nom : null

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '40px 16px 60px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.textMuted, fontSize: '13px', fontFamily: grotesk }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <div style={{ display: 'flex', gap: '2px' }}>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
            <Link to={`/taches/${config.id}`} title="Tâches" aria-label="Tâches" style={{
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '7px', color: T.textMuted,
            }}><Icon nom="checklist" taille={15} /></Link>
            <Link to={`/notes/${config.id}`} title="Notes" aria-label="Notes" style={{
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '7px', color: T.textMuted,
            }}><Icon nom="note" taille={15} /></Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginBottom: '22px' }}>
          <div>
            <p style={{
              fontFamily: grotesk, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: T.accent, margin: '0 0 4px', fontWeight: 600,
            }}>{config.eyebrow}</p>
            <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '34px', color: T.text, margin: 0, lineHeight: 1.1 }}>
              {config.titre}
            </h1>
          </div>
          <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '3px', flexShrink: 0 }}>
            {Object.values(ESPACES).map(e => (
              <Link
                key={e.id}
                to={`/memoriser/${e.id}`}
                style={{
                  fontSize: '11px', fontFamily: grotesk, fontWeight: 600, padding: '6px 10px', borderRadius: '6px',
                  background: e.id === config.id ? T.accent : 'transparent',
                  color: e.id === config.id ? T.accentText : T.textMuted,
                }}
              >{e.id === 'perso' ? 'Perso' : 'Pro'}</Link>
            ))}
          </div>
        </div>

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
                  Colle un token GitHub (le même que pour Programme et Notes) pour synchroniser <code style={{ background: T.bg, padding: '1px 5px', borderRadius: '4px' }}>memoriser-{config.id}.json</code> sur tous tes appareils.
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

        {vue === 'liste' ? (
          <>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: totalDû > 0 ? '12px' : '0' }}>
                <Icon nom="repeter" taille={16} style={{ color: T.accent }} />
                <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '16px', color: T.text }}>
                  {totalDû > 0 ? `${totalDû} carte${totalDû > 1 ? 's' : ''} à réviser aujourd'hui` : "Rien à réviser aujourd'hui"}
                </strong>
              </div>
              {totalDû > 0 && (
                <button onClick={() => démarrerRévision(null)} style={{
                  background: T.accent, color: T.accentText, border: 'none', fontWeight: 600,
                  borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}><Icon nom="repeter" taille={14} /> Réviser tout</button>
              )}
            </div>

            {data.paquets.length === 0 && (
              <p style={{ fontSize: '13px', color: T.textMuted, textAlign: 'center', margin: '0 0 22px', lineHeight: '1.6' }}>
                Aucun paquet pour l'instant. Crée-en un ci-dessous pour commencer à ajouter des cartes.
              </p>
            )}

            {data.paquets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                {data.paquets.map(paquet => {
                  const cartesPaquet = data.cartes.filter(c => c.paquetId === paquet.id)
                  const dues = cartesDues(paquet.id).length
                  const ouvert = paquetOuvertId === paquet.id
                  return (
                    <div key={paquet.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: paquet.couleur, flexShrink: 0 }} />
                        <button
                          onClick={() => setPaquetOuvertId(ouvert ? null : paquet.id)}
                          style={{
                            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <strong style={{ fontFamily: grotesk, fontSize: '14px', color: T.text, fontWeight: 600 }}>{paquet.nom}</strong>
                          <span style={{ fontSize: '11px', color: T.textMuted }}>
                            {cartesPaquet.length} carte{cartesPaquet.length > 1 ? 's' : ''}{dues > 0 ? ` · ${dues} à réviser` : ''}
                          </span>
                        </button>
                        {dues > 0 && (
                          <BoutonIcone icon="repeter" title="Réviser ce paquet" couleur={T.accent} onClick={() => démarrerRévision(paquet.id)} />
                        )}
                        <BoutonIcone icon="corbeille" title="Supprimer ce paquet" couleur={T.danger} taille={13} onClick={() => supprimerPaquet(paquet.id, paquet.nom)} />
                        <BoutonIcone icon={ouvert ? 'chevronHaut' : 'chevronBas'} title={ouvert ? 'Replier' : 'Voir les cartes'} taille={13} onClick={() => setPaquetOuvertId(ouvert ? null : paquet.id)} />
                      </div>

                      {ouvert && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {cartesPaquet.map(carte => (
                            <div key={carte.id} style={{ background: T.surface2, borderRadius: '8px', padding: '8px 10px', border: `1px solid ${T.border}` }}>
                              {éditionCarteId === carte.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <input
                                    autoFocus
                                    value={éditionRecto}
                                    onChange={e => setÉditionRecto(e.target.value)}
                                    placeholder="Recto"
                                    style={{ background: T.bg, color: T.text, border: `1px solid ${T.accent}`, borderRadius: '6px', padding: '6px 8px', fontSize: '12.5px' }}
                                  />
                                  <input
                                    value={éditionVerso}
                                    onChange={e => setÉditionVerso(e.target.value)}
                                    placeholder="Verso"
                                    onKeyDown={e => { if (e.key === 'Enter') validerÉditionCarte(carte.id) }}
                                    style={{ background: T.bg, color: T.text, border: `1px solid ${T.accent}`, borderRadius: '6px', padding: '6px 8px', fontSize: '12.5px' }}
                                  />
                                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setÉditionCarteId(null)} style={{ fontSize: '12px', color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Annuler</button>
                                    <button onClick={() => validerÉditionCarte(carte.id)} style={{ fontSize: '12px', color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Valider</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '12.5px', color: T.text, wordBreak: 'break-word' }}>{carte.recto}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: T.textMuted, wordBreak: 'break-word' }}>{carte.verso}</p>
                                  </div>
                                  <BoutonIcone icon="crayon" title="Modifier" taille={13} onClick={() => démarrerÉditionCarte(carte)} />
                                  <BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} taille={13} onClick={() => supprimerCarte(carte.id)} />
                                </div>
                              )}
                            </div>
                          ))}

                          <form onSubmit={e => { e.preventDefault(); ajouterCarte(paquet.id) }} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                            <input
                              value={(nouvelleCarte[paquet.id] || {}).recto || ''}
                              onChange={e => setNouvelleCarte(n => ({ ...n, [paquet.id]: { ...(n[paquet.id] || {}), recto: e.target.value } }))}
                              placeholder="Recto (question)"
                              style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 9px', fontSize: '12.5px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                value={(nouvelleCarte[paquet.id] || {}).verso || ''}
                                onChange={e => setNouvelleCarte(n => ({ ...n, [paquet.id]: { ...(n[paquet.id] || {}), verso: e.target.value } }))}
                                placeholder="Verso (réponse)"
                                style={{ flex: 1, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 9px', fontSize: '12.5px' }}
                              />
                              <button type="submit" style={{
                                background: T.accent, color: T.accentText, border: 'none', borderRadius: '6px', width: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              }}><Icon nom="plus" taille={14} /></button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontFamily: grotesk }}>Nouveau paquet</p>
              <form onSubmit={e => { e.preventDefault(); ajouterPaquet() }} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={nouveauPaquetNom}
                  onChange={e => setNouveauPaquetNom(e.target.value)}
                  placeholder="Nom du paquet…"
                  style={{ flex: 1, minWidth: '120px', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '8px 10px', fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  {PALETTE.map(couleur => (
                    <button key={couleur} type="button" onClick={() => setCouleurPaquet(couleur)} style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: couleur, cursor: 'pointer',
                      border: couleurPaquet === couleur ? `2px solid ${T.text}` : '2px solid transparent',
                    }} />
                  ))}
                </div>
                <button type="submit" style={{
                  background: T.accent, color: T.accentText, border: 'none', borderRadius: '7px',
                  padding: '0 14px', height: '34px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk, fontWeight: 600,
                }}>Créer</button>
              </form>
            </div>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <button onClick={quitterRévision} style={{
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: T.textMuted,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: grotesk,
              }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Quitter</button>
              <span style={{ fontSize: '12px', color: T.textMuted, fontFamily: grotesk }}>
                {nomPaquetRévision || 'Tous les paquets'} · {Math.min(indexRévision + 1, fileRévision.length)}/{fileRévision.length}
              </span>
            </div>

            {indexRévision >= fileRévision.length ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🎉</p>
                <h2 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '22px', color: T.text, margin: '0 0 8px' }}>
                  Session terminée
                </h2>
                <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 20px' }}>
                  {sues}/{fileRévision.length} carte{fileRévision.length > 1 ? 's' : ''} sue{sues > 1 ? 's' : ''} du premier coup
                </p>
                <button onClick={quitterRévision} style={{
                  background: T.accent, color: T.accentText, border: 'none', fontWeight: 600,
                  borderRadius: '8px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                }}>Retour aux paquets</button>
              </div>
            ) : (
              <>
                <div
                  onClick={() => setEstRetournée(r => !r)}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px',
                    padding: '40px 24px', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', cursor: 'pointer', marginBottom: '16px',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px', fontFamily: grotesk }}>
                      {estRetournée ? 'Réponse' : 'Question'}
                    </p>
                    <p style={{ fontSize: '19px', color: T.text, lineHeight: '1.5', margin: 0, fontFamily: serif, wordBreak: 'break-word' }}>
                      {estRetournée ? carteActuelle?.verso : carteActuelle?.recto}
                    </p>
                    {!estRetournée && (
                      <p style={{ fontSize: '11px', color: T.textMuted, margin: '18px 0 0' }}>Touche la carte pour voir la réponse</p>
                    )}
                  </div>
                </div>

                {estRetournée && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => répondre(false)} style={{
                      flex: 1, background: T.dangerSoft, color: T.danger, border: `1px solid ${T.danger}55`,
                      borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                    }}>Je ne savais pas</button>
                    <button onClick={() => répondre(true)} style={{
                      flex: 1, background: T.accentSoft, color: T.accent, border: `1px solid ${T.accent}55`,
                      borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                    }}>Je savais</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
