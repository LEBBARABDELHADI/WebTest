import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PanneauSync from '../components/PanneauSync'
import { BoutonIcone } from '../components/UI'
import EnTetePilotage from '../components/EnTetePilotage'
import { stylesPilotage } from '../lib/stylesPilotage'
import { grotesk, useTheme } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { useLectures, TYPES, STATUTS, domaine, typeDepuisUrl, titreDepuisUrl, cartesDepuisNote } from '../lib/lectures'
import { lireLocal, modifierOutil } from '../lib/donneesFoyer'
import { aujourdhuiLocal, dateDe } from '../lib/habitudes'
import { uid } from '../lib/pilotage'

const CLÉ_PAQUET = espace => `react-blocs-lire-paquet-${espace}`
const NOM_PAQUET = '📚 À lire'
const dateCourte = j => (j ? dateDe(j.slice(0, 10)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '')

export default function ALire() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const S = stylesPilotage(T)
  const [params, setParams] = useSearchParams()
  const { data, setData, token, statut, erreur, connecter, déconnecter } = useLectures(espace)
  const [filtre, setFiltre] = useState(() => data.éléments.find(x => x.id === params.get('el'))?.statut || 'àlire')
  const [type, setType] = useState('')
  const [étiquette, setÉtiquette] = useState('')
  const [recherche, setRecherche] = useState('')
  const [ouvert, setOuvert] = useState(() => params.get('el') || null)
  const [message, setMessage] = useState('')
  const afficher = t => { setMessage(t); setTimeout(() => setMessage(m => (m === t ? '' : m)), 3500) }
  useEffect(() => { try { localStorage.setItem('react-blocs-lire-espace', espace) } catch { /* ignore */ } }, [espace])

  // Adresse reçue par le menu Partager du téléphone ou le favori du navigateur.
  const reçu = params.get('url') || params.get('titre') ? { url: params.get('url') || '', titre: params.get('titre') || '' } : null
  const éléments = data.éléments
  const ouvertId = ouvert
  useEffect(() => {
    if (!ouvertId) return
    if (params.get('el')) setTimeout(() => document.getElementById(`lecture-${ouvertId}`)?.scrollIntoView({ block: 'center' }), 100)
  }, [ouvertId]) // eslint-disable-line react-hooks/exhaustive-deps

  const modifier = (id, champs) => setData(d => ({ ...d, éléments: d.éléments.map(x => (x.id === id ? { ...x, ...champs } : x)) }))
  const changerStatut = (é, s) => modifier(é.id, { statut: s, ...(s === 'lu' ? { luLe: é.luLe || aujourdhuiLocal() } : { luLe: undefined }) })
  const ajouter = ({ url, titre, type: t, étiquettes }) => {
    const u = url.trim()
    if (u && éléments.some(x => x.url === u)) { afficher('Déjà dans ta liste'); return false }
    const é = { id: uid(), url: u, titre: titre.trim() || (u ? titreDepuisUrl(u) : 'Sans titre'), type: t || (u ? typeDepuisUrl(u) : 'article'), étiquettes, statut: 'àlire', ajouté: aujourdhuiLocal() }
    setData(d => ({ ...d, éléments: [é, ...d.éléments] }))
    setFiltre('àlire')
    afficher(`✓ « ${é.titre} » ajouté`)
    return true
  }

  const toutesÉtiquettes = useMemo(() => [...new Set(éléments.flatMap(x => x.étiquettes || []))].sort(), [éléments])
  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return éléments
      .filter(x => filtre === 'tout' || x.statut === filtre)
      .filter(x => !type || x.type === type)
      .filter(x => !étiquette || (x.étiquettes || []).includes(étiquette))
      .filter(x => !q || `${x.titre} ${x.url} ${x.note || ''} ${(x.étiquettes || []).join(' ')}`.toLowerCase().includes(q))
  }, [éléments, filtre, type, étiquette, recherche])
  const nombre = s => éléments.filter(x => x.statut === s).length
  const mois = aujourdhuiLocal().slice(0, 7)
  const lusCeMois = éléments.filter(x => x.statut === 'lu' && (x.luLe || '').startsWith(mois)).length
  const avecCartes = éléments.filter(x => (x.cartes || []).length).length

  const autre = espace.endsWith('pro') ? espace.replace(/pro$/, 'perso') : espace.replace(/perso$/, 'pro')
  const bascule = (
    <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
      {[espace.endsWith('pro') ? autre : espace, espace.endsWith('pro') ? espace : autre].map(e => (
        <Link key={e} to={`/lire/${e}`} style={{ fontSize: 12, fontFamily: grotesk, fontWeight: 600, padding: '7px 12px', borderRadius: 6, textDecoration: 'none', background: e === espace ? T.accent : 'transparent', color: e === espace ? T.accentText : T.textMuted }}>{e.endsWith('pro') ? 'Pro' : 'Perso'}</Link>
      ))}
    </div>
  )

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <EnTetePilotage T={T} foyer={foyer} actif="lire" espace={espace} titre="📚 À lire" droite={bascule}
          sousTitre={`${nombre('àlire')} à lire · ${nombre('encours')} en cours · ${lusCeMois} lu${lusCeMois > 1 ? 's' : ''} ce mois-ci${avecCartes ? ` · ${avecCartes} transformé${avecCartes > 1 ? 's' : ''} en cartes` : ''}`} />
        <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`lectures-${espace}.json`} marginBottom="12px" />

        <FormulaireAjout key={reçu ? `${reçu.url}|${reçu.titre}` : 'vide'} T={T} S={S} reçu={reçu} étiquettes={toutesÉtiquettes}
          onAjouter={v => { const ok = ajouter(v); if (ok && reçu) setParams({}, { replace: true }); return ok }} />

        <div role="tablist" aria-label="Statut" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
          {[['àlire', `À lire (${nombre('àlire')})`], ['encours', `En cours (${nombre('encours')})`], ['lu', `Lus (${nombre('lu')})`], ['tout', `Tout (${éléments.length})`]].map(([id, nom]) => (
            <button key={id} role="tab" aria-selected={filtre === id} onClick={() => setFiltre(id)} style={S.puce(filtre === id)}>{nom}</button>
          ))}
        </div>
        {éléments.length > 3 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher dans À lire" style={{ ...S.champ, flex: '1 1 180px', width: 'auto', minHeight: 38, fontSize: 15 }} />
            <select value={type} onChange={e => setType(e.target.value)} aria-label="Type" style={{ ...S.champ, width: 'auto', minHeight: 38, fontSize: 14 }}>
              <option value="">Tous les types</option>
              {Object.entries(TYPES).map(([id, t]) => <option key={id} value={id}>{t.emoji} {t.nom}</option>)}
            </select>
            {toutesÉtiquettes.length > 0 && (
              <select value={étiquette} onChange={e => setÉtiquette(e.target.value)} aria-label="Étiquette" style={{ ...S.champ, width: 'auto', minHeight: 38, fontSize: 14 }}>
                <option value="">Toutes les étiquettes</option>
                {toutesÉtiquettes.map(e => <option key={e} value={e}>#{e}</option>)}
              </select>
            )}
          </div>
        )}

        {visibles.length === 0 && (
          <div style={{ ...S.carte, textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ fontSize: 34, margin: '0 0 6px' }}>{filtre === 'lu' ? '📖' : '☕'}</p>
            <p style={S.discret}>{éléments.length === 0 ? 'Colle l\'adresse d\'un article, d\'une vidéo ou d\'une page de documentation pour la garder ici.' : filtre === 'àlire' ? 'Rien à lire pour l\'instant.' : 'Rien ici avec ces filtres.'}</p>
          </div>
        )}
        {visibles.map(é => (
          <CarteLecture key={é.id} T={T} S={S} é={é} espace={espace} ouvert={ouvert === é.id} onOuvrir={() => setOuvert(o => (o === é.id ? null : é.id))}
            onModifier={champs => modifier(é.id, champs)} onStatut={s => changerStatut(é, s)} afficher={afficher}
            onSupprimer={() => { if (window.confirm(`Supprimer « ${é.titre} » ?`)) setData(d => ({ ...d, éléments: d.éléments.filter(x => x.id !== é.id) })) }} />
        ))}

        <AideAjout T={T} S={S} espace={espace} />
      </div>
      {message && <div role="status" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 60, maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: 12, fontSize: 14, background: T.text, color: T.bg, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>{message}</div>}
    </div>
  )
}

function FormulaireAjout({ T, S, reçu, étiquettes, onAjouter }) {
  const [url, setUrl] = useState(reçu?.url || '')
  const [titre, setTitre] = useState(reçu?.titre || '')
  const [type, setType] = useState('')
  const [tags, setTags] = useState('')
  const [plus, setPlus] = useState(!!reçu)
  const typeDevine = url.trim() ? typeDepuisUrl(url.trim()) : 'article'
  const valider = e => {
    e.preventDefault()
    if (!url.trim() && !titre.trim()) return
    const ok = onAjouter({ url, titre, type: type || typeDevine, étiquettes: tags.split(/[,#\s]+/).map(t => t.trim()).filter(Boolean) })
    if (ok) { setUrl(''); setTitre(''); setType(''); setTags(''); setPlus(false) }
  }
  return (
    <form onSubmit={valider} style={{ ...S.carte, padding: 10, ...(reçu ? { borderColor: T.accent } : {}) }}>
      {reçu && <p style={{ ...S.discret, margin: '2px 4px 8px', color: T.accent, fontWeight: 700 }}>📲 Reçu par le partage : vérifie puis ajoute.</p>}
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={url} onChange={e => setUrl(e.target.value)} onFocus={() => setPlus(true)} inputMode="url" placeholder="Colle une adresse (https://…) ou un titre de livre" aria-label="Adresse à garder" style={{ ...S.champ, flex: 1 }} />
        <button type="submit" disabled={!url.trim() && !titre.trim()} style={{ ...S.bouton(true), opacity: url.trim() || titre.trim() ? 1 : 0.5 }}>Ajouter</button>
      </div>
      {plus && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 6, marginTop: 6 }}>
          <input value={titre} onChange={e => setTitre(e.target.value)} placeholder={url.trim() ? `Titre (sinon « ${titreDepuisUrl(url.trim())} »)` : 'Titre'} aria-label="Titre" style={S.champ} />
          <select value={type || typeDevine} onChange={e => setType(e.target.value)} aria-label="Type de contenu" style={S.champ}>
            {Object.entries(TYPES).map(([id, t]) => <option key={id} value={id}>{t.emoji} {t.nom}</option>)}
          </select>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Étiquettes : aws, k8s…" aria-label="Étiquettes" list="etiquettes-lire" style={S.champ} />
          <datalist id="etiquettes-lire">{étiquettes.map(e => <option key={e} value={e} />)}</datalist>
        </div>
      )}
    </form>
  )
}

function CarteLecture({ T, S, é, espace, ouvert, onOuvrir, onModifier, onStatut, onSupprimer, afficher }) {
  const t = TYPES[é.type] || TYPES.article
  const [note, setNote] = useState(é.note || '')
  const [création, setCréation] = useState(false)
  const minuteur = useRef(null)
  useEffect(() => () => clearTimeout(minuteur.current), [])
  const écrireNote = v => { setNote(v); clearTimeout(minuteur.current); minuteur.current = setTimeout(() => onModifier({ note: v }), 500) }
  const aperçu = cartesDepuisNote({ ...é, note })
  const paquets = lireLocal('memoriser', espace).paquets || []
  const [paquetId, setPaquetId] = useState(() => { try { return localStorage.getItem(CLÉ_PAQUET(espace)) || '' } catch { return '' } })
  const paquetChoisi = paquets.find(p => p.id === paquetId) || paquets.find(p => p.nom === NOM_PAQUET)
  const créerCartes = async () => {
    if (!aperçu.length) return
    onModifier({ note })
    setCréation(true)
    const ids = aperçu.map(() => uid())
    const nouveauPaquet = uid()
    let nomPaquet = paquetChoisi?.nom || NOM_PAQUET
    try {
      await modifierOutil('memoriser', espace, d => {
        let ps = d.paquets || []
        let p = ps.find(x => x.id === paquetChoisi?.id) || ps.find(x => x.nom === NOM_PAQUET)
        if (!p) { p = { id: nouveauPaquet, nom: NOM_PAQUET, couleur: '#4a9d94' }; ps = [...ps, p] }
        nomPaquet = p.nom
        const déjà = new Set((d.cartes || []).map(c => c.id))
        const neuves = aperçu.map((c, i) => ({ id: ids[i], paquetId: p.id, recto: c.recto, verso: c.verso, niveau: 0, prochaineRevision: aujourdhuiLocal() })).filter(c => !déjà.has(c.id))
        return { ...d, paquets: ps, cartes: [...(d.cartes || []), ...neuves] }
      }, lireLocal('memoriser', espace))
      onModifier({ note, cartes: [...(é.cartes || []), ...ids] })
      afficher(`🧠 ${ids.length} carte${ids.length > 1 ? 's' : ''} ajoutée${ids.length > 1 ? 's' : ''} à « ${nomPaquet} »`)
    } catch (e) { afficher(`Cartes non créées : ${e.message}`) }
    setCréation(false)
  }
  const nbCartes = (é.cartes || []).length
  return (
    <article id={`lecture-${é.id}`} style={{ ...S.carte, padding: 0, overflow: 'hidden', ...(ouvert ? { borderColor: T.accent } : {}) }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 12px 10px 14px' }}>
        <span aria-hidden="true" style={{ fontSize: 22, lineHeight: '28px' }}>{t.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {é.url
            ? <a href={é.url} target="_blank" rel="noopener noreferrer" onClick={() => { if (é.statut === 'àlire') onStatut('encours') }} style={{ color: T.text, fontWeight: 700, fontSize: 15.5, lineHeight: 1.35, textDecoration: 'none', wordBreak: 'break-word', textDecorationLine: é.statut === 'lu' ? 'none' : undefined }}>{é.titre} <span aria-hidden="true" style={{ color: T.textMuted, fontSize: 12 }}>↗</span></a>
            : <span style={{ fontWeight: 700, fontSize: 15.5 }}>{é.titre}</span>}
          <p style={{ ...S.discret, fontSize: 12.5, marginTop: 3 }}>
            {[é.url && domaine(é.url), t.nom, é.statut === 'lu' && é.luLe ? `lu le ${dateCourte(é.luLe)}` : `ajouté le ${dateCourte(é.ajouté)}`].filter(Boolean).join(' · ')}
            {(é.étiquettes || []).map(x => <span key={x} style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 9, background: T.surface2 }}>#{x}</span>)}
            {nbCartes > 0 && <span style={{ marginLeft: 6, color: '#2e9e6b', fontWeight: 700 }}>🧠 {nbCartes}</span>}
          </p>
          {!ouvert && é.note && <p style={{ ...S.discret, fontSize: 13, marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>💡 {é.note}</p>}
        </div>
        <BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} taille={14} onClick={onSupprimer} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 12px 12px 14px' }}>
        {Object.entries(STATUTS).map(([s, nom]) => (
          <button key={s} onClick={() => onStatut(s)} aria-pressed={é.statut === s} style={{ ...S.puce(é.statut === s), minHeight: 34, fontSize: 12.5 }}>{s === 'lu' ? '✓ ' : ''}{nom}</button>
        ))}
        <button onClick={onOuvrir} aria-expanded={ouvert} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5, marginLeft: 'auto', borderColor: ouvert ? T.accent : T.border }}>💡 {é.note ? 'Ce que je retiens' : 'Noter ce que je retiens'}</button>
      </div>
      {ouvert && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: 14, background: T.bg }}>
          <label style={{ ...S.titre, marginBottom: 6 }} htmlFor={`note-${é.id}`}>Ce que j'en retiens</label>
          <textarea id={`note-${é.id}`} value={note} onChange={e => écrireNote(e.target.value)} onBlur={() => onModifier({ note })} rows={5}
            placeholder={'Les idées clés, en quelques lignes.\nAstuce : une ligne « question :: réponse » devient une carte.\nEx. Différence ALB / NLB :: ALB = couche 7 (HTTP), NLB = couche 4 (TCP/UDP)'}
            style={{ ...S.champ, minHeight: 120, resize: 'vertical', lineHeight: 1.5 }} />
          {aperçu.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...S.discret, fontSize: 12.5, marginBottom: 6 }}>{aperçu.length > 1 ? `${aperçu.length} cartes prêtes :` : 'Carte prête :'}</p>
              <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
                {aperçu.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 10px', background: T.surface, fontSize: 13.5 }}>
                    <strong>{c.recto}</strong>
                    <div style={{ color: T.textMuted, marginTop: 2, whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.verso}</div>
                  </div>
                ))}
                {aperçu.length > 4 && <span style={S.discret}>… et {aperçu.length - 4} autre{aperçu.length > 5 ? 's' : ''}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={créerCartes} disabled={création} style={S.bouton(true)}>{création ? '…' : `🧠 Créer ${aperçu.length > 1 ? `les ${aperçu.length} cartes` : 'la carte'}`}</button>
                <select value={paquetChoisi?.id || ''} onChange={e => { setPaquetId(e.target.value); try { localStorage.setItem(CLÉ_PAQUET(espace), e.target.value) } catch { /* ignore */ } }} aria-label="Paquet Mémoriser" style={{ ...S.champ, width: 'auto', flex: '1 1 160px', minHeight: 40, fontSize: 14 }}>
                  {!paquets.some(p => p.nom === NOM_PAQUET) && <option value="">{NOM_PAQUET} (nouveau paquet)</option>}
                  {paquets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
              {nbCartes > 0 && <p style={{ ...S.discret, marginTop: 8, color: '#2e9e6b' }}>✓ {nbCartes} carte{nbCartes > 1 ? 's' : ''} déjà créée{nbCartes > 1 ? 's' : ''} · <Link to={`/memoriser/${espace}`} style={S.lien}>Réviser dans Mémoriser →</Link></p>}
            </div>
          )}
          <EditeurInfos T={T} S={S} é={é} onModifier={onModifier} />
        </div>
      )}
    </article>
  )
}

function EditeurInfos({ T, S, é, onModifier }) {
  const [titre, setTitre] = useState(é.titre)
  const [tags, setTags] = useState((é.étiquettes || []).join(', '))
  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer', color: T.textMuted, fontSize: 13, fontFamily: grotesk, fontWeight: 700 }}>Modifier le titre, le type, les étiquettes</summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 6, marginTop: 8 }}>
        <input value={titre} onChange={e => setTitre(e.target.value)} onBlur={() => titre.trim() && onModifier({ titre: titre.trim() })} aria-label="Titre" style={S.champ} />
        <select value={é.type} onChange={e => onModifier({ type: e.target.value })} aria-label="Type" style={S.champ}>
          {Object.entries(TYPES).map(([id, t]) => <option key={id} value={id}>{t.emoji} {t.nom}</option>)}
        </select>
        <input value={tags} onChange={e => setTags(e.target.value)} onBlur={() => onModifier({ étiquettes: tags.split(/[,#\s]+/).map(t => t.trim()).filter(Boolean) })} aria-label="Étiquettes" placeholder="Étiquettes" style={S.champ} />
      </div>
    </details>
  )
}

// Comment ajouter sans copier-coller : partage depuis le téléphone, favori sur ordinateur.
function AideAjout({ T, S, espace }) {
  const [copié, setCopié] = useState(false)
  const adresse = `${window.location.origin}${window.location.pathname}#/lire/${espace}`
  const favori = `javascript:(()=>{location.href='${adresse}?url='+encodeURIComponent(location.href)+'&titre='+encodeURIComponent(document.title)})()`
  return (
    <details style={{ ...S.carte, marginTop: 18 }}>
      <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 14.5 }}>📲 Ajouter en un geste depuis le téléphone ou l'ordinateur</summary>
      <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 8px' }}><strong>Sur Android :</strong> installe l'appli (menu du navigateur → « Ajouter à l'écran d'accueil »). Ensuite, dans n'importe quelle appli (Chrome, YouTube…), touche <em>Partager</em> puis <em>Mes tâches</em> : la page s'ajoute ici.</p>
        <p style={{ margin: '0 0 8px' }}><strong>Sur iPhone :</strong> copie l'adresse dans Safari, puis colle-la ici.</p>
        <p style={{ margin: '0 0 8px' }}><strong>Sur ordinateur :</strong> crée un favori et colle ce code à la place de l'adresse. Un clic sur ce favori depuis un article l'ajoute à ta liste.</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <code style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '8px 10px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favori}</code>
          <button onClick={() => { navigator.clipboard?.writeText(favori); setCopié(true); setTimeout(() => setCopié(false), 1500) }} style={S.bouton(false)}>{copié ? '✓ Copié' : '📋 Copier'}</button>
        </div>
      </div>
    </details>
  )
}
