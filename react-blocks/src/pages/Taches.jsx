import { useState, useEffect, useRef } from 'react'
import { videsParEspace } from '../lib/donneesVides'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from '../lib/githubSync'
import { useRelectureAuRetour } from '../lib/synchro'
import { analyserAujourdhui } from '../lib/aujourdhui'
import LiensÉlément from '../components/LiensElement'
import { fusionner, réconcilier, lireBase, écrireBase, annoncer } from '../lib/fusion'
import Icon from '../components/Icon'
import { BoutonIcone, Repli } from '../components/UI'
import { T, grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, espacesPourTousLesFoyers } from '../lib/foyers'

const DONNÉES = videsParEspace('taches')

const ESPACES = espacesPourTousLesFoyers((foyer, type, id) => ({
  titre: `Programme ${type}`,
  eyebrow: `${foyer.nom} · Planning ${type}`,
  chemin: `react-blocks/src/data/taches-${id}.json`,
  stockage: `react-blocs-taches-${id}`,
  données: DONNÉES[id],
}))

const PALETTE_ÉTIQUETTES = [T.accent, T.danger, '#4a9d94', '#5b8dc9', '#8b7ab8']

function complète(objet) {
  return {
    ...objet,
    timeline: Array.isArray(objet.timeline) ? objet.timeline : [],
    étiquettes: Array.isArray(objet.étiquettes) ? objet.étiquettes : [],
  }
}

function chargerDonnées(config) {
  try {
    const raw = localStorage.getItem(config.stockage)
    if (raw) return complète(JSON.parse(raw))
  } catch { /* ignore */ }
  // Aucune sauvegarde locale : on part du fichier data du projet pour cet espace
  return complète(config.données)
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function formatDateCourte(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// « mar. 21 oct. » (+ l'année si ce n'est pas l'année en cours).
function formatDateClaire(iso) {
  const d = new Date(`${iso}T00:00`)
  const options = { weekday: 'short', day: 'numeric', month: 'short' }
  if (d.getFullYear() !== new Date().getFullYear()) options.year = 'numeric'
  return d.toLocaleDateString('fr-FR', options)
}

// Écart en jours avec aujourd'hui (date locale) : « aujourd'hui », « demain »,
// « dans 3 j », « hier », « il y a 2 j ».
function écartJours(iso) {
  const auj = new Date()
  auj.setHours(0, 0, 0, 0)
  const n = Math.round((new Date(`${iso}T00:00`) - auj) / 86400000)
  if (n === 0) return { n, texte: "aujourd'hui" }
  if (n === 1) return { n, texte: 'demain' }
  if (n === -1) return { n, texte: 'hier' }
  return { n, texte: n > 0 ? `dans ${n} j` : `il y a ${-n} j` }
}

// Échéance et date de livraison, en clair et en gras sur la carte.
function DatesCarte({ T, carte, vert }) {
  if (!carte.échéance && !carte.livraison) return null
  const ligne = (icône, libellé, iso, couleur, fond, détail) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', padding: '4px 8px', borderRadius: '8px', background: fond, fontFamily: grotesk }}>
      <span aria-hidden="true" style={{ fontSize: '13px' }}>{icône}</span>
      <span style={{ fontSize: '12.5px', fontWeight: 600, color: T.textMuted }}>{libellé}</span>
      <strong style={{ fontSize: '13.5px', fontWeight: 800, color: couleur }}>{formatDateClaire(iso)}</strong>
      <span style={{ fontSize: '11.5px', fontWeight: 700, color: couleur, opacity: 0.85 }}>· {détail}</span>
    </div>
  )
  const éch = carte.échéance && écartJours(carte.échéance)
  const couleurÉch = !éch ? null : éch.n < 0 ? T.danger : éch.n <= 1 ? T.accent : T.text
  const fondÉch = !éch ? null : éch.n < 0 ? T.dangerSoft : éch.n <= 1 ? T.accentSoft : T.bg
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '0 0 8px', opacity: estBarrée(carte) ? 0.55 : 1 }}>
      {éch && ligne('⏰', 'Échéance', carte.échéance, couleurÉch, fondÉch, éch.n < 0 ? `en retard de ${-éch.n} j` : éch.texte)}
      {carte.livraison && ligne('📦', 'Livraison', carte.livraison, vert, `${vert}1f`, écartJours(carte.livraison).texte)}
    </div>
  )
}

// ---------- Tâches récurrentes (quotidiennes, hebdomadaires) ----------
// Une tâche récurrente n'est pas « faite » une fois pour toutes : on la
// valide chaque jour. `validées` garde les jours validés (AAAA-MM-JJ, date
// locale), les 90 derniers.
function jourLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const validéeAujourdhui = c => (c.validées || []).includes(jourLocal())
// Barrée sur la carte : faite (tâche simple) ou validée aujourd'hui (récurrente).
const estBarrée = c => (c.récurrence ? validéeAujourdhui(c) : !!c.fait)
const prévueAujourdhui = c => c.récurrence === 'quotidienne' || (c.récurrence === 'hebdomadaire' && c.récurrenceJour === new Date().getDay())
// Nombre de jours de suite (quotidiennes) validés, jusqu'à aujourd'hui ou hier.
function série(c) {
  const jours = new Set(c.validées || [])
  const d = new Date()
  if (!jours.has(jourLocal(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (jours.has(jourLocal(d))) { n += 1; d.setDate(d.getDate() - 1) }
  return n
}

// Sous les échéances : les tâches quotidiennes (et hebdomadaires du jour),
// chacune avec sa case à cocher pour la valider aujourd'hui.
function PanneauQuotidiennes({ T, cartes, colonnes, vert, onBasculer, onAjouter, onAller }) {
  const [saisie, setSaisie] = useState('')
  const nomColonne = new Map(colonnes.map(c => [c.id, c.titre]))
  const liste = cartes.filter(c => !c.archivé && prévueAujourdhui(c))
  const faites = liste.filter(validéeAujourdhui).length
  const triée = [...liste].sort((a, b) => Number(validéeAujourdhui(a)) - Number(validéeAujourdhui(b)))
  const ajouter = () => {
    if (!saisie.trim()) return
    onAjouter(saisie.trim())
    setSaisie('')
  }
  return (
    <section aria-label="Tâches quotidiennes" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px 14px 12px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: liste.length ? '8px' : '10px' }}>
        <span aria-hidden="true">🔁</span>
        <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '16px', color: T.text }}>Tâches quotidiennes</strong>
        {liste.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', fontFamily: grotesk, fontWeight: 800, color: faites === liste.length ? vert : T.textMuted }}>
            {faites === liste.length ? '✓ ' : ''}{faites}/{liste.length}
          </span>
        )}
      </div>
      {liste.length > 0 && (
        <div aria-hidden="true" style={{ height: '4px', borderRadius: '2px', background: T.bg, overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ width: `${(faites / liste.length) * 100}%`, height: '100%', background: vert, transition: 'width .3s' }} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {triée.map(c => {
          const fait = validéeAujourdhui(c)
          const n = c.récurrence === 'quotidienne' ? série(c) : 0
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderRadius: '8px', background: fait ? `${vert}12` : 'transparent' }}>
              <input
                type="checkbox"
                checked={fait}
                onChange={() => onBasculer(c.id)}
                aria-label={fait ? `Annuler la validation de « ${c.texte} »` : `Valider « ${c.texte} » pour aujourd'hui`}
                style={{ width: '22px', height: '22px', margin: 0, flexShrink: 0, cursor: 'pointer', accentColor: vert }}
              />
              <button onClick={() => onAller(c.id)} title="Voir la tâche" style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: grotesk }}>
                <span style={{
                  display: 'block', fontSize: '14px', fontWeight: 600, color: fait ? T.textMuted : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: fait ? 'line-through' : 'none', textDecorationThickness: '2px',
                }}>{c.texte}</span>
                <span style={{ fontSize: '11px', color: T.textMuted }}>
                  {c.récurrence === 'quotidienne' ? 'Chaque jour' : 'Chaque semaine'}{nomColonne.get(c.colonneId) ? ` · ${nomColonne.get(c.colonneId)}` : ''}
                </span>
              </button>
              {n >= 2 && <span title={`${n} jours de suite`} style={{ fontSize: '12px', fontWeight: 800, color: T.accent, fontFamily: grotesk, flexShrink: 0 }}>🔥 {n}</span>}
            </div>
          )
        })}
      </div>
      <form onSubmit={e => { e.preventDefault(); ajouter() }} style={{ display: 'flex', gap: '6px', marginTop: liste.length ? '10px' : 0 }}>
        <input
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          placeholder="Ajouter une tâche quotidienne…"
          aria-label="Nouvelle tâche quotidienne"
          enterKeyHint="done"
          style={{ flex: 1, minWidth: 0, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '8px 10px', fontSize: '13px', outline: 'none' }}
        />
        <button type="submit" aria-label="Ajouter la tâche quotidienne" disabled={!saisie.trim()} style={{
          background: saisie.trim() ? T.accent : T.bg, color: saisie.trim() ? T.accentText : T.textMuted, border: 'none', borderRadius: '7px', width: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saisie.trim() ? 'pointer' : 'default',
        }}><Icon nom="plus" taille={15} trait={2.5} /></button>
      </form>
    </section>
  )
}

// En haut de la page : toutes les échéances et dates de livraison, de toutes
// les sections, par ordre de date. Les tâches faites, archivées ou dans
// « Terminé » n'y sont pas.
// Chaque ligne a sa case : cochée, la tâche est faite (comme la case de la
// carte) ; elle reste affichée barrée jusqu'au soir pour pouvoir décocher.
function PanneauDates({ T, cartes, colonnes, colonneTerminée, vert, onAller, onBasculer }) {
  const [toutVoir, setToutVoir] = useState(false)
  const nomColonne = new Map(colonnes.map(c => [c.id, c]))
  const auj = jourLocal()
  const entrées = cartes
    .filter(c => !c.archivé && c.colonneId !== colonneTerminée?.id && (!estBarrée(c) || c.récurrence || c.faitLe === auj))
    .flatMap(c => [
      c.échéance && { carte: c, type: 'échéance', date: c.échéance },
      c.livraison && { carte: c, type: 'livraison', date: c.livraison },
    ].filter(Boolean))
    .sort((a, b) => Number(estBarrée(a.carte)) - Number(estBarrée(b.carte)) || a.date.localeCompare(b.date) || (a.type === 'échéance' ? -1 : 1))
  if (entrées.length === 0) return null
  const LIMITE = 6
  const visibles = toutVoir ? entrées : entrées.slice(0, LIMITE)
  const àFaire = entrées.filter(e => !estBarrée(e.carte))
  const nbRetard = àFaire.filter(e => e.type === 'échéance' && écartJours(e.date).n < 0).length
  return (
    <section aria-label="Échéances et livraisons" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px 14px 10px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span aria-hidden="true">📅</span>
        <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '16px', color: T.text }}>Échéances et livraisons</strong>
        <span style={{ marginLeft: 'auto', fontSize: '11.5px', fontFamily: grotesk, fontWeight: 700, color: nbRetard ? T.danger : T.textMuted }}>
          {nbRetard ? `${nbRetard} en retard · ` : ''}{àFaire.length} à faire{entrées.length > àFaire.length ? ` · ${entrées.length - àFaire.length} ✓` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visibles.map(({ carte, type, date }) => {
          const écart = écartJours(date)
          const livraison = type === 'livraison'
          const fait = estBarrée(carte)
          const couleur = fait ? T.textMuted : livraison ? vert : écart.n < 0 ? T.danger : écart.n <= 1 ? T.accent : T.text
          const fond = fait ? T.bg : livraison ? `${vert}1a` : écart.n < 0 ? T.dangerSoft : écart.n <= 1 ? T.accentSoft : T.bg
          const col = nomColonne.get(carte.colonneId)
          return (
            <div key={`${carte.id}-${type}`} style={{
              display: 'flex', alignItems: 'center', gap: '10px', background: fond, borderLeft: `4px solid ${couleur}`, borderRadius: '8px', padding: '7px 10px',
              opacity: fait ? 0.7 : 1,
            }}>
              <input
                type="checkbox"
                checked={fait}
                onChange={() => onBasculer(carte.id)}
                aria-label={fait ? `Décocher « ${carte.texte} »` : `Cocher « ${carte.texte} » : faite`}
                style={{ width: '22px', height: '22px', margin: 0, flexShrink: 0, cursor: 'pointer', accentColor: vert }}
              />
            <button onClick={() => onAller(carte.id)} title="Voir la tâche" style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer',
              background: 'none', border: 'none', padding: 0, fontFamily: grotesk,
              textDecoration: fait ? 'line-through' : 'none', textDecorationThickness: '2px',
            }}>
              <span style={{ flexShrink: 0, minWidth: '92px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '13px', fontWeight: 800, color: couleur }}>{formatDateClaire(date)}</strong>
                <span style={{ fontSize: '11px', fontWeight: 700, color: couleur, opacity: 0.85 }}>{fait ? '✓ faite' : !livraison && écart.n < 0 ? `retard ${-écart.n} j` : écart.texte}</span>
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{carte.texte}</span>
                <span style={{ fontSize: '11px', color: T.textMuted }}>
                  {livraison ? '📦 Livraison' : '⏰ Échéance'}{col ? ` · ${col.titre}` : ''}
                </span>
              </span>
            </button>
            </div>
          )
        })}
      </div>
      {entrées.length > LIMITE && (
        <button onClick={() => setToutVoir(v => !v)} style={{ marginTop: '8px', background: 'none', border: 'none', color: T.accent, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: grotesk, padding: '4px 2px' }}>
          {toutVoir ? 'Voir moins' : `Tout voir (${entrées.length})`}
        </button>
      )}
    </section>
  )
}

// Dernière colonne du tableau : créer une nouvelle section (nom + couleur).
function NouvelleSection({ T, onCréer }) {
  const [ouvert, setOuvert] = useState(false)
  const [titre, setTitre] = useState('')
  const [couleur, setCouleur] = useState(PALETTE_ÉTIQUETTES[0])
  const valider = () => {
    if (!titre.trim()) return
    onCréer(titre, couleur)
    setTitre('')
    setOuvert(false)
  }
  const cadre = {
    minWidth: 'min(272px, 84vw)', maxWidth: 'min(272px, 84vw)', flexShrink: 0, alignSelf: 'flex-start',
    borderRadius: '14px', border: `1.5px dashed ${T.border}`, padding: '14px', scrollSnapAlign: 'start', boxSizing: 'border-box',
  }
  if (!ouvert) return (
    <button onClick={() => setOuvert(true)} style={{
      ...cadre, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontFamily: grotesk, fontSize: '14px', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '64px',
    }}><Icon nom="plus" taille={16} trait={2.5} /> Nouvelle section</button>
  )
  return (
    <form onSubmit={e => { e.preventDefault(); valider() }} aria-label="Nouvelle section" style={{ ...cadre, background: T.surface, borderColor: T.accent, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <strong style={{ fontFamily: grotesk, fontSize: '13px', color: T.text }}>Nouvelle section</strong>
      <input
        autoFocus
        value={titre}
        onChange={e => setTitre(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') setOuvert(false) }}
        placeholder="Nom de la section…"
        enterKeyHint="done"
        style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '9px 10px', fontSize: '13px', outline: 'none' }}
      />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {PALETTE_ÉTIQUETTES.map(c => (
          <button key={c} type="button" onClick={() => setCouleur(c)} aria-label={`Couleur ${c}`} aria-pressed={couleur === c} style={{
            width: '22px', height: '22px', borderRadius: '50%', background: c, cursor: 'pointer',
            border: couleur === c ? `2px solid ${T.text}` : '2px solid transparent',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => { setOuvert(false); setTitre('') }} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: '12.5px', cursor: 'pointer', fontFamily: grotesk }}>Annuler</button>
        <button type="submit" disabled={!titre.trim()} style={{
          background: titre.trim() ? T.accent : T.bg, color: titre.trim() ? T.accentText : T.textMuted, border: 'none', borderRadius: '7px',
          padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, cursor: titre.trim() ? 'pointer' : 'default', fontFamily: grotesk,
        }}>Créer</button>
      </div>
    </form>
  )
}

export default function Taches() {
  const { espace: espaceParam } = useParams()
  const config = ESPACES[espaceParam] || ESPACES.perso
  const T = useTheme()
  const { mode, basculer } = useThemeMode()

  const [data, setData] = useState(() => chargerDonnées(config))
  const [nouvelleCarte, setNouvelleCarte] = useState({})
  const [éditionId, setÉditionId] = useState(null)
  const [texteÉdition, setTexteÉdition] = useState('')
  const [détailsId, setDétailsId] = useState(null)
  const [carteRepérée, setCarteRepérée] = useState(null)
  const [nouvelItem, setNouvelItem] = useState({})
  const [colonneÉditionId, setColonneÉditionId] = useState(null)
  const [titreÉdition, setTitreÉdition] = useState('')
  const [messageImport, setMessageImport] = useState('')
  const [jourSélectionné, setJourSélectionné] = useState(() => new Date().toISOString().slice(0, 10))
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [tokenSaisi, setTokenSaisi] = useState('')
  const [statutSync, setStatutSync] = useState(token ? 'chargement' : 'lecture')
  // Lien venant de la recherche de l'accueil : ?carte=… ouvre ses détails,
  // fait défiler jusqu'à elle et la met en évidence.
  const [paramètres, setParamètres] = useSearchParams()
  useEffect(() => {
    const id = paramètres.get('carte')
    if (!id) return
    if (!data.cartes.some(c => c.id === id) && ['chargement', 'lecture'].includes(statutSync)) return // attendre GitHub
    setParamètres({}, { replace: true })
    setDétailsId(id)
    setCarteRepérée(id)
    setTimeout(() => document.querySelector(`[data-carte="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250)
    setTimeout(() => setCarteRepérée(null), 3000)
  }, [paramètres, data, statutSync]) // eslint-disable-line react-hooks/exhaustive-deps
  const [erreurSync, setErreurSync] = useState('')
  const [syncOuvert, setSyncOuvert] = useState(false)
  const [étiquettesOuvert, setÉtiquettesOuvert] = useState(false)
  const [nouvelleÉtiquette, setNouvelleÉtiquette] = useState('')
  const [couleurÉtiquette, setCouleurÉtiquette] = useState(PALETTE_ÉTIQUETTES[0])
  const [archivesOuvert, setArchivesOuvert] = useState(false)
  const [statsOuvert, setStatsOuvert] = useState(false)
  const [sectionsMasquées, setSectionsMasquées] = useState(() => {
    try {
      const raw = localStorage.getItem('react-blocs-sections-masquees')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [moisAffiché, setMoisAffiché] = useState(() => {
    const d = new Date()
    return { année: d.getFullYear(), mois: d.getMonth() }
  })
  const [peutAnnuler, setPeutAnnuler] = useState(false)
  const dragCarte = useRef(null)
  const fichierRef = useRef(null)
  const shaRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const ignoreProchaineÉcritureRef = useRef(false)
  const ignoreProchainUndoRef = useRef(false)
  const prêtPourSyncRef = useRef(false)
  const dernierEnvoiRef = useRef(null)
  const pileAnnulerRef = useRef([])
  const donnéesPrécédentesRef = useRef(data)
  const récurrenceAppliquéeRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(config.stockage, JSON.stringify(data))
  }, [data, config.stockage])

  useEffect(() => {
    localStorage.setItem('react-blocs-sections-masquees', JSON.stringify(sectionsMasquées))
  }, [sectionsMasquées])

  // Historique pour « Annuler » : on garde l'état précédent avant chaque
  // changement, sauf pour les remplacements silencieux (lecture GitHub,
  // récurrence automatique, un « annuler » lui-même).
  useEffect(() => {
    if (donnéesPrécédentesRef.current === data) return
    if (ignoreProchainUndoRef.current) {
      ignoreProchainUndoRef.current = false
      donnéesPrécédentesRef.current = data
      return
    }
    pileAnnulerRef.current.push(donnéesPrécédentesRef.current)
    if (pileAnnulerRef.current.length > 25) pileAnnulerRef.current.shift()
    donnéesPrécédentesRef.current = data
    setPeutAnnuler(true)
  }, [data])

  // Lecture depuis le fichier data/taches-{espace}.json du dépôt GitHub
  // (fonctionne sans token car le dépôt est public) — c'est ce qui permet
  // de retrouver les mêmes données sur n'importe quel ordinateur.
  // Relecture de GitHub au retour sur l'app, seulement si tout est envoyé.
  const [relecture, setRelecture] = useState(0)
  const donnéesActuellesRef = useRef(data)
  donnéesActuellesRef.current = data
  useRelectureAuRetour(() => {
    if (prêtPourSyncRef.current && JSON.stringify(donnéesActuellesRef.current) === dernierEnvoiRef.current) setRelecture(r => r + 1)
  })

  useEffect(() => {
    let annulé = false
    setStatutSync(s => (s === 'erreur' ? s : token ? 'chargement' : 'lecture'))
    lireDepuisGitHub(token, config.chemin)
      .then(({ data: distant, sha, périmé }) => {
        if (annulé) return
        // Ancienne version servie en retard par GitHub (juste après un de
        // nos enregistrements) : on garde ce qu'on a.
        if (périmé && shaRef.current) { setStatutSync(token ? 'connecté' : 'lecture-seule'); return }
        shaRef.current = sha
        const distantComplet = complète(distant)
        // Modifications pas encore envoyées (hors ligne, erreur…) : fusionnées
        // avec la version en ligne au lieu d'être écrasées.
        const { données, àEnvoyer } = réconcilier({ distant: distantComplet, local: donnéesActuellesRef.current, base: lireBase(config.stockage) })
        dernierEnvoiRef.current = JSON.stringify(distantComplet)
        écrireBase(config.stockage, dernierEnvoiRef.current)
        if (!àEnvoyer) ignoreProchaineÉcritureRef.current = true
        ignoreProchainUndoRef.current = true
        setData(données)
        if (àEnvoyer) annoncer('Modifications faites hors ligne ajoutées à la version en ligne')
        setStatutSync(token ? 'connecté' : 'lecture-seule')
      })
      .catch(err => {
        if (annulé) return
        setStatutSync('erreur')
        setErreurSync(err.message)
      })
      .finally(() => { prêtPourSyncRef.current = true })
    return () => { annulé = true }
  }, [token, config.chemin, relecture])

  // Replanifie une fois, au premier chargement, les cartes récurrentes qui
  // n'ont pas encore de copie dans la timeline pour aujourd'hui.
  useEffect(() => {
    if (récurrenceAppliquéeRef.current) return
    if (!['connecté', 'lecture-seule', 'erreur'].includes(statutSync)) return
    récurrenceAppliquéeRef.current = true
    const aujourd = new Date().toISOString().slice(0, 10)
    const jourSemaine = new Date().getDay()
    setData(d => {
      const nouveaux = []
      d.cartes.forEach(c => {
        if (!c.récurrence || c.archivé) return
        if (c.récurrence === 'hebdomadaire' && c.récurrenceJour !== jourSemaine) return
        const déjà = d.timeline.some(ev => ev.carteId === c.id && ev.date === aujourd)
        if (déjà) return
        nouveaux.push({ id: uid(), carteId: c.id, colonneId: c.colonneId, texte: c.texte, date: aujourd })
      })
      if (nouveaux.length === 0) return d
      ignoreProchainUndoRef.current = true
      return { ...d, timeline: [...d.timeline, ...nouveaux] }
    })
  }, [statutSync])

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
      const base = dernierEnvoiRef.current ? JSON.parse(dernierEnvoiRef.current) : undefined
      écrireVersGitHub(data, token, shaRef.current, config.chemin, base)
        .then(({ sha, données: écrites, fusionné }) => {
          shaRef.current = sha
          dernierEnvoiRef.current = fusionné ? JSON.stringify(écrites) : contenu
          écrireBase(config.stockage, dernierEnvoiRef.current)
          if (fusionné) {
            // Un autre appareil avait changé le fichier : on affiche la
            // fusion, sans perdre ce qui a été tapé depuis l'envoi.
            ignoreProchainUndoRef.current = true
            setData(courant => fusionner(data, courant, écrites))
            annoncer('Mis à jour avec les changements d\'un autre appareil')
          }
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

  const masquerSection = id => {
    setSectionsMasquées(s => s.includes(id) ? s : [...s, id])
  }

  const réafficherSections = () => setSectionsMasquées([])

  const annuler = () => {
    const pile = pileAnnulerRef.current
    if (pile.length === 0) return
    const précédent = pile.pop()
    ignoreProchainUndoRef.current = true
    donnéesPrécédentesRef.current = précédent
    setData(précédent)
    setPeutAnnuler(pile.length > 0)
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

  const archiverCarte = id => {
    const aujourd = new Date().toISOString().slice(0, 10)
    setData(d => ({ ...d, cartes: d.cartes.map(c => c.id === id ? { ...c, archivé: true, archivéLe: aujourd } : c) }))
  }

  const désarchiverCarte = id => {
    setData(d => ({ ...d, cartes: d.cartes.map(c => c.id === id ? { ...c, archivé: false } : c) }))
  }

  const réordonnerCarte = (carteId, direction) => {
    setData(d => {
      const carte = d.cartes.find(c => c.id === carteId)
      if (!carte) return d
      const indicesColonne = d.cartes
        .map((c, i) => ({ c, i }))
        .filter(o => o.c.colonneId === carte.colonneId && !o.c.archivé)
        .map(o => o.i)
      const pos = indicesColonne.indexOf(d.cartes.indexOf(carte))
      const nouvellePos = pos + direction
      if (nouvellePos < 0 || nouvellePos >= indicesColonne.length) return d
      const cartes = [...d.cartes]
      const iA = indicesColonne[pos]
      const iB = indicesColonne[nouvellePos]
      ;[cartes[iA], cartes[iB]] = [cartes[iB], cartes[iA]]
      return { ...d, cartes }
    })
  }

  const définirRécurrence = (carteId, valeur) => {
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => {
        if (c.id !== carteId) return c
        const copie = { ...c }
        if (!valeur) { delete copie.récurrence; delete copie.récurrenceJour; return copie }
        copie.récurrence = valeur
        if (valeur === 'hebdomadaire') copie.récurrenceJour = new Date().getDay()
        else delete copie.récurrenceJour
        return copie
      }),
    }))
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
    setData(d => {
      const carte = d.cartes.find(c => c.id === carteId)
      if (!carte) return d
      // Idempotent : une même carte ne se retrouve pas planifiée deux fois
      // le même jour (protège aussi contre un double déclenchement du clic).
      const déjà = d.timeline.some(ev => ev.carteId === carte.id && ev.date === date)
      if (déjà) return d
      return {
        ...d,
        timeline: [...d.timeline, { id: uid(), carteId: carte.id, colonneId: carte.colonneId, texte: carte.texte, date }],
      }
    })
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

  const ajouterColonne = (titre, couleur) => {
    const nom = titre.trim()
    if (!nom) return
    const id = uid()
    setData(d => ({ ...d, colonnes: [...d.colonnes, { id, titre: nom, couleur }] }))
    setTimeout(() => document.querySelector(`[data-colonne="${id}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }), 100)
  }

  // Réordonner les sections : on attrape la poignée ⠿ et on glisse (souris
  // ou doigt). Les milieux des autres colonnes sont relevés au départ ; la
  // rangée défile toute seule près des bords.
  const rangéeRef = useRef(null)
  const glisseRef = useRef(null)
  const [glisseCol, setGlisseCol] = useState(null) // { id, dx, cible }
  const déplacerColonne = (id, index) => setData(d => {
    const col = d.colonnes.find(c => c.id === id)
    if (!col) return d
    const colonnes = d.colonnes.filter(c => c.id !== id)
    colonnes.splice(Math.max(0, Math.min(index, colonnes.length)), 0, col)
    return colonnes.every((c, i) => c.id === d.colonnes[i].id) ? d : { ...d, colonnes }
  })
  const calculerGlisse = () => {
    const g = glisseRef.current
    const r = rangéeRef.current
    if (!g || !r) return
    const x = g.clientX - r.getBoundingClientRect().left + r.scrollLeft
    g.cible = g.milieux.filter(m => m < x).length
    setGlisseCol({ id: g.id, dx: x - g.x0, cible: g.cible })
  }
  const débutGlisseCol = (e, id) => {
    if (e.button) return
    e.preventDefault()
    const r = rangéeRef.current
    const gauche = r.getBoundingClientRect().left
    const milieux = [...r.querySelectorAll('[data-colonne]')]
      .filter(el => el.dataset.colonne !== id)
      .map(el => { const b = el.getBoundingClientRect(); return b.left - gauche + r.scrollLeft + b.width / 2 })
    glisseRef.current = { id, clientX: e.clientX, x0: e.clientX - gauche + r.scrollLeft, milieux, cible: null }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const boucle = () => {
      const g = glisseRef.current
      if (!g) return
      const b = r.getBoundingClientRect()
      if (g.clientX < b.left + 48) r.scrollLeft -= 10
      else if (g.clientX > b.right - 48) r.scrollLeft += 10
      calculerGlisse()
      g.raf = requestAnimationFrame(boucle)
    }
    boucle()
  }
  const mouvementGlisseCol = e => { if (glisseRef.current) glisseRef.current.clientX = e.clientX }
  const finGlisseCol = () => {
    const g = glisseRef.current
    if (!g) return
    cancelAnimationFrame(g.raf)
    glisseRef.current = null
    setGlisseCol(null)
    if (g.cible != null) déplacerColonne(g.id, g.cible)
  }
  useEffect(() => () => cancelAnimationFrame(glisseRef.current?.raf), [])

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

  const supprimerColonne = (id, titre) => {
    if (data.colonnes.length <= 1) {
      window.alert('Impossible de supprimer le dernier bloc restant.')
      return
    }
    const nbCartes = data.cartes.filter(c => c.colonneId === id).length
    if (nbCartes > 0) {
      const ok = window.confirm(
        `Le bloc « ${titre} » contient ${nbCartes} carte${nbCartes > 1 ? 's' : ''} (actives ou archivées). Les supprimer aussi ?`
      )
      if (!ok) return
    } else if (!window.confirm(`Supprimer le bloc « ${titre} » ?`)) {
      return
    }
    setData(d => ({
      ...d,
      colonnes: d.colonnes.filter(c => c.id !== id),
      cartes: d.cartes.filter(c => c.colonneId !== id),
      timeline: d.timeline.filter(ev => ev.colonneId !== id),
    }))
  }

  // Case à cocher sur la carte : la tâche est faite (texte barré).
  // Tâche récurrente : coche / décoche la validation du jour.
  const basculerFait = carteId => {
    const auj = jourLocal()
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => {
        if (c.id !== carteId) return c
        const copie = { ...c }
        if (c.récurrence) {
          const jours = (c.validées || []).filter(j => j !== auj)
          copie.validées = (jours.length === (c.validées || []).length ? [...jours, auj].sort() : jours).slice(-90)
          if (!copie.validées.length) delete copie.validées
        } else if (c.fait) { delete copie.fait; delete copie.faitLe }
        else { copie.fait = true; copie.faitLe = auj }
        return copie
      }),
    }))
  }
  const ajouterQuotidienne = texte => {
    const colonne = colonneAujourdhui || data.colonnes[0]
    if (!colonne) return
    setData(d => ({ ...d, cartes: [...d.cartes, { id: uid(), colonneId: colonne.id, texte, étiquettes: [], récurrence: 'quotidienne' }] }))
  }

  // champ : 'échéance' ou 'livraison'
  const définirÉchéance = (carteId, date, champ = 'échéance') => {
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => {
        if (c.id !== carteId) return c
        const copie = { ...c }
        if (date) copie[champ] = date
        else delete copie[champ]
        return copie
      }),
    }))
  }

  const basculerÉtiquette = (carteId, étiquetteId) => {
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => {
        if (c.id !== carteId) return c
        const actuelles = c.étiquettes || []
        const nouvelles = actuelles.includes(étiquetteId)
          ? actuelles.filter(id => id !== étiquetteId)
          : [...actuelles, étiquetteId]
        return { ...c, étiquettes: nouvelles }
      }),
    }))
  }

  const ajouterÉtiquette = () => {
    const nom = nouvelleÉtiquette.trim()
    if (!nom) return
    setData(d => ({ ...d, étiquettes: [...d.étiquettes, { id: uid(), nom, couleur: couleurÉtiquette }] }))
    setNouvelleÉtiquette('')
  }

  const supprimerÉtiquette = id => {
    setData(d => ({
      ...d,
      étiquettes: d.étiquettes.filter(e => e.id !== id),
      cartes: d.cartes.map(c => c.étiquettes ? { ...c, étiquettes: c.étiquettes.filter(eid => eid !== id) } : c),
    }))
  }

  const ajouterItemChecklist = carteId => {
    const texte = (nouvelItem[carteId] || '').trim()
    if (!texte) return
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => c.id === carteId
        ? { ...c, checklist: [...(c.checklist || []), { id: uid(), texte, fait: false }] }
        : c),
    }))
    setNouvelItem(n => ({ ...n, [carteId]: '' }))
  }

  const basculerItemChecklist = (carteId, itemId) => {
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => c.id === carteId
        ? { ...c, checklist: (c.checklist || []).map(i => i.id === itemId ? { ...i, fait: !i.fait } : i) }
        : c),
    }))
  }

  const supprimerItemChecklist = (carteId, itemId) => {
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => c.id === carteId
        ? { ...c, checklist: (c.checklist || []).filter(i => i.id !== itemId) }
        : c),
    }))
  }

  const exporter = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `taches-${config.id}-${date}.json`
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

  const aujourdhuiISO = new Date().toISOString().slice(0, 10)
  const vertLivraison = mode === 'light' ? '#15803d' : '#4ade80'
  const jours = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      num: d.getDate(),
    }
  })

  const premierJourMois = new Date(moisAffiché.année, moisAffiché.mois, 1)
  const nbJoursMois = new Date(moisAffiché.année, moisAffiché.mois + 1, 0).getDate()
  const décalageDébut = (premierJourMois.getDay() + 6) % 7 // lundi = 0
  const grilleMois = [
    ...Array.from({ length: décalageDébut }, () => null),
    ...Array.from({ length: nbJoursMois }, (_, j) => {
      const d = new Date(moisAffiché.année, moisAffiché.mois, j + 1)
      return { iso: d.toISOString().slice(0, 10), num: j + 1 }
    }),
  ]
  const nomMois = new Date(moisAffiché.année, moisAffiché.mois, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // Même définition que l'accueil (lib/aujourdhui.js).
  const {
    enRetard: cartesEnRetard, échéance: cartesÉchéanceAujourdhui, colonne: cartesColonneAujourdhui,
    planifiées: planifiéesAujourdhui, total: totalAujourdhui, colonneAujourdhui, colonneTerminée,
  } = analyserAujourdhui(data, aujourdhuiISO, { sansRécurrentes: true })

  // Statistiques de progression
  const cartesActives = data.cartes.filter(c => !c.archivé)
  const cartesArchivées = data.cartes.filter(c => c.archivé)
  const il7Jours = new Date(); il7Jours.setDate(il7Jours.getDate() - 6)
  const il7JoursISO = il7Jours.toISOString().slice(0, 10)
  const archivéesCetteSemaine = cartesArchivées.filter(c => c.archivéLe && c.archivéLe >= il7JoursISO).length
  const tousLesItems = data.cartes.flatMap(c => c.checklist || [])
  const itemsFaits = tousLesItems.filter(i => i.fait).length
  const tauxComplétion = tousLesItems.length > 0 ? Math.round((itemsFaits / tousLesItems.length) * 100) : null
  const joursActifs = new Set([
    ...data.timeline.map(ev => ev.date),
    ...cartesArchivées.filter(c => c.archivéLe).map(c => c.archivéLe),
  ])
  let série = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    if (joursActifs.has(d.toISOString().slice(0, 10))) série++
    else break
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

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '40px 16px 40px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link to={FOYERS[config.foyer].accueil} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.textMuted, fontSize: '13px', fontFamily: grotesk }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <div style={{ display: 'flex', gap: '2px' }}>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
            {peutAnnuler && (
              <BoutonIcone icon="annuler" title="Annuler la dernière action" onClick={annuler} />
            )}
            <Link to={`/notes/${config.id}`} title="Notes" aria-label="Notes" style={{
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '7px', color: T.textMuted,
            }}><Icon nom="note" taille={15} /></Link>
            <Link to={`/memoriser/${config.id}`} title="Mémoriser" aria-label="Mémoriser" style={{
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '7px', color: T.textMuted,
            }}><Icon nom="repeter" taille={15} /></Link>
            <BoutonIcone icon="telecharger" title="Exporter en .json" onClick={exporter} />
            <BoutonIcone icon="televerser" title="Importer un .json" onClick={() => fichierRef.current?.click()} />
            <input ref={fichierRef} type="file" accept="application/json" onChange={importer} style={{ display: 'none' }} />
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
            {Object.values(ESPACES).filter(e => e.foyer === config.foyer).map(e => (
              <Link
                key={e.id}
                to={`/taches/${e.id}`}
                style={{
                  fontSize: '11px', fontFamily: grotesk, fontWeight: 600, padding: '6px 10px', borderRadius: '6px',
                  background: e.id === config.id ? T.accent : 'transparent',
                  color: e.id === config.id ? T.accentText : T.textMuted,
                }}
              >{e.type === 'perso' ? 'Perso' : 'Pro'}</Link>
            ))}
          </div>
        </div>

        {messageImport && (
          <p style={{ fontSize: '12px', color: T.accent, margin: '-14px 0 14px' }}>{messageImport}</p>
        )}

        <PanneauDates T={T} cartes={data.cartes} colonnes={data.colonnes} colonneTerminée={colonneTerminée} vert={vertLivraison} onBasculer={basculerFait}
          onAller={id => {
            setCarteRepérée(id)
            document.querySelector(`[data-carte="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => setCarteRepérée(null), 3000)
          }} />

        <PanneauQuotidiennes T={T} cartes={data.cartes} colonnes={data.colonnes} vert={vertLivraison}
          onBasculer={basculerFait} onAjouter={ajouterQuotidienne}
          onAller={id => {
            setCarteRepérée(id)
            document.querySelector(`[data-carte="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => setCarteRepérée(null), 3000)
          }} />

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: totalAujourdhui > 0 ? '12px' : '0' }}>
            <Icon nom="cible" taille={16} style={{ color: T.accent }} />
            <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '16px', color: T.text }}>Aujourd'hui</strong>
            {totalAujourdhui > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: cartesEnRetard.length ? T.danger : T.textMuted, fontFamily: grotesk }}>
                {totalAujourdhui - cartesEnRetard.length} pour aujourd'hui{cartesEnRetard.length ? ` · ${cartesEnRetard.length} en retard` : ''}
              </span>
            )}
          </div>
          {totalAujourdhui === 0 ? (
            <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>Rien de prévu pour aujourd'hui.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {cartesEnRetard.map(c => (
                <div key={'r' + c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: T.text }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.danger, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{c.texte}</span>
                    <span style={{ fontSize: '10px', color: T.danger, flexShrink: 0 }}>en retard</span>
                    {colonneTerminée && (
                      <BoutonIcone icon="checklist" title="Déplacer vers Terminé" couleur={colonneTerminée.couleur} taille={12} onClick={() => déplacerCarte(c.id, colonneTerminée.id)} />
                    )}
                    <BoutonIcone icon="x" title="Retirer l'échéance" taille={11} onClick={() => définirÉchéance(c.id, null)} />
                  </div>
                  {(c.checklist || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0 0 14px' }}>
                      {c.checklist.map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: item.fait ? T.textMuted : T.text, cursor: 'pointer' }}>
                          <input type="checkbox" checked={item.fait} onChange={() => basculerItemChecklist(c.id, item.id)}
                            style={{ accentColor: T.accent, width: '12px', height: '12px', flexShrink: 0 }} />
                          <span style={{ textDecoration: item.fait ? 'line-through' : 'none' }}>{item.texte}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {cartesÉchéanceAujourdhui.map(c => (
                <div key={'e' + c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: T.text }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.accent, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{c.texte}</span>
                    <span style={{ fontSize: '10px', color: T.textMuted, flexShrink: 0 }}>échéance</span>
                    {colonneTerminée && (
                      <BoutonIcone icon="checklist" title="Déplacer vers Terminé" couleur={colonneTerminée.couleur} taille={12} onClick={() => déplacerCarte(c.id, colonneTerminée.id)} />
                    )}
                    <BoutonIcone icon="x" title="Retirer l'échéance" taille={11} onClick={() => définirÉchéance(c.id, null)} />
                  </div>
                  {(c.checklist || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0 0 14px' }}>
                      {c.checklist.map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: item.fait ? T.textMuted : T.text, cursor: 'pointer' }}>
                          <input type="checkbox" checked={item.fait} onChange={() => basculerItemChecklist(c.id, item.id)}
                            style={{ accentColor: T.accent, width: '12px', height: '12px', flexShrink: 0 }} />
                          <span style={{ textDecoration: item.fait ? 'line-through' : 'none' }}>{item.texte}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {cartesColonneAujourdhui.map(c => (
                <div key={'c' + c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: T.text }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colonneAujourdhui?.couleur || T.accent, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{c.texte}</span>
                    <span style={{ fontSize: '10px', color: T.textMuted, flexShrink: 0 }}>colonne</span>
                    {colonneTerminée && (
                      <BoutonIcone icon="checklist" title="Déplacer vers Terminé" couleur={colonneTerminée.couleur} taille={12} onClick={() => déplacerCarte(c.id, colonneTerminée.id)} />
                    )}
                  </div>
                  {(c.checklist || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0 0 14px' }}>
                      {c.checklist.map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: item.fait ? T.textMuted : T.text, cursor: 'pointer' }}>
                          <input type="checkbox" checked={item.fait} onChange={() => basculerItemChecklist(c.id, item.id)}
                            style={{ accentColor: T.accent, width: '12px', height: '12px', flexShrink: 0 }} />
                          <span style={{ textDecoration: item.fait ? 'line-through' : 'none' }}>{item.texte}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {planifiéesAujourdhui.map(ev => (
                <div key={'p' + ev.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: T.text }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.textMuted, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{ev.texte}</span>
                  <span style={{ fontSize: '10px', color: T.textMuted, flexShrink: 0 }}>planifiée</span>
                  {colonneTerminée && (
                    <BoutonIcone icon="checklist" title="Déplacer vers Terminé" couleur={colonneTerminée.couleur} taille={12} onClick={() => déplacerCarte(ev.carteId, colonneTerminée.id)} />
                  )}
                  <BoutonIcone icon="x" title="Retirer de la timeline" taille={11} onClick={() => supprimerÉvénementTimeline(ev.id)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {!sectionsMasquées.includes('sync') && (
          <>
            <Repli
              icon={<span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statutCouleur, flexShrink: 0 }} />}
              texte={statutLabel}
              ouvert={syncOuvert}
              onToggle={() => setSyncOuvert(o => !o)}
              marginBottom={syncOuvert ? '8px' : '14px'}
              onMasquer={() => masquerSection('sync')}
            />

            {syncOuvert && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                {token ? (
                  <button onClick={déconnecterToken} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', color: T.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}><Icon nom="x" taille={13} /> Déconnecter le token</button>
                ) : (
                  <div>
                    <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 10px', lineHeight: '1.6' }}>
                      Colle un token GitHub pour écrire tes modifications dans <code style={{ background: T.bg, padding: '1px 5px', borderRadius: '4px' }}>taches-{config.id}.json</code> — visible ensuite sur tous tes appareils.
                      Génère-le sur <strong style={{ color: T.text }}>github.com → Settings → Developer settings → Fine-grained tokens</strong>, avec accès au dépôt privé <strong style={{ color: T.text }}>WebTest-donnees</strong>, permission <strong style={{ color: T.text }}>Contents: Read and write</strong>.
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
          </>
        )}

        {!sectionsMasquées.includes('etiquettes') && (
          <>
            <Repli
              icon={<Icon nom="etiquette" taille={14} style={{ color: T.textMuted }} />}
              texte={`${data.étiquettes.length} étiquette${data.étiquettes.length > 1 ? 's' : ''}`}
              ouvert={étiquettesOuvert}
              onToggle={() => setÉtiquettesOuvert(o => !o)}
              marginBottom={étiquettesOuvert ? '8px' : '22px'}
              onMasquer={() => masquerSection('etiquettes')}
            />

            {étiquettesOuvert && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', marginBottom: '22px' }}>
                {data.étiquettes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {data.étiquettes.map(ét => (
                      <span key={ét.id} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: grotesk,
                        color: ét.couleur, background: ét.couleur + '18', border: `1px solid ${ét.couleur}55`,
                        padding: '4px 6px 4px 10px', borderRadius: '20px',
                      }}>
                        {ét.nom}
                        <button onClick={() => supprimerÉtiquette(ét.id)} style={{ display: 'flex', color: ét.couleur, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <Icon nom="x" taille={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <form onSubmit={e => { e.preventDefault(); ajouterÉtiquette() }} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    value={nouvelleÉtiquette}
                    onChange={e => setNouvelleÉtiquette(e.target.value)}
                    placeholder="Nouvelle étiquette…"
                    style={{ flex: 1, minWidth: '120px', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '8px 10px', fontSize: '13px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PALETTE_ÉTIQUETTES.map(couleur => (
                      <button key={couleur} type="button" onClick={() => setCouleurÉtiquette(couleur)} style={{
                        width: '22px', height: '22px', borderRadius: '50%', background: couleur, cursor: 'pointer',
                        border: couleurÉtiquette === couleur ? `2px solid ${T.text}` : '2px solid transparent',
                      }} />
                    ))}
                  </div>
                  <button type="submit" style={{
                    background: T.accent, color: T.accentText, border: 'none', borderRadius: '7px',
                    padding: '0 14px', height: '34px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk, fontWeight: 600,
                  }}>Ajouter</button>
                </form>
              </div>
            )}
          </>
        )}

        {data.cartes.some(c => c.archivé) && !sectionsMasquées.includes('archives') && (
          <>
            <Repli
              icon={<Icon nom="archive" taille={14} style={{ color: T.textMuted }} />}
              texte={`${data.cartes.filter(c => c.archivé).length} carte${data.cartes.filter(c => c.archivé).length > 1 ? 's' : ''} archivée${data.cartes.filter(c => c.archivé).length > 1 ? 's' : ''}`}
              ouvert={archivesOuvert}
              onToggle={() => setArchivesOuvert(o => !o)}
              marginBottom={archivesOuvert ? '8px' : '22px'}
              onMasquer={() => masquerSection('archives')}
            />
            {archivesOuvert && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', marginBottom: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.cartes.filter(c => c.archivé).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: T.textMuted }}>
                    <span style={{ flex: 1, textDecoration: 'line-through' }}>{c.texte}</span>
                    <button onClick={() => désarchiverCarte(c.id)} title="Restaurer" style={{
                      fontSize: '11px', color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontFamily: grotesk,
                    }}>Restaurer</button>
                    <BoutonIcone icon="corbeille" title="Supprimer définitivement" couleur={T.danger} taille={13} onClick={() => supprimerCarte(c.id)} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!sectionsMasquées.includes('stats') && (
          <>
            <Repli
              icon={<Icon nom="graphique" taille={14} style={{ color: T.textMuted }} />}
              texte="Statistiques"
              ouvert={statsOuvert}
              onToggle={() => setStatsOuvert(o => !o)}
              marginBottom={statsOuvert ? '8px' : '22px'}
              onMasquer={() => masquerSection('stats')}
            />

            {statsOuvert && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '16px', marginBottom: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 700, color: T.text, fontFamily: grotesk }}>{cartesActives.length}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: T.textMuted }}>cartes actives</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 700, color: T.text, fontFamily: grotesk }}>{cartesArchivées.length}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: T.textMuted }}>terminées au total{archivéesCetteSemaine > 0 ? ` (${archivéesCetteSemaine} cette semaine)` : ''}</p>
                  </div>
                </div>

                {tauxComplétion !== null && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', color: T.textMuted }}>Sous-tâches complétées</span>
                      <span style={{ fontSize: '11px', color: T.text, fontFamily: grotesk, fontWeight: 600 }}>{itemsFaits}/{tousLesItems.length} · {tauxComplétion}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: T.surface2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${tauxComplétion}%`, background: T.accent, borderRadius: '3px' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon nom="repeter" taille={14} style={{ color: T.accent }} />
                  <span style={{ fontSize: '12.5px', color: T.text }}>
                    {série > 0 ? <><strong style={{ color: T.accent }}>{série}</strong> jour{série > 1 ? 's' : ''} d'activité d'affilée</> : 'Aucune activité récente'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {sectionsMasquées.length > 0 && (
          <button
            onClick={réafficherSections}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: T.textMuted,
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 22px', fontFamily: grotesk,
            }}
          >
            <Icon nom="annuler" taille={12} /> Réafficher les sections masquées ({sectionsMasquées.length})
          </button>
        )}
      </div>

      <div ref={rangéeRef} style={{
        display: 'flex', gap: '14px', overflowX: 'auto', padding: '4px 16px 20px',
        maxWidth: '1132px', margin: '0 auto', justifyContent: 'safe center',
        scrollSnapType: glisseCol ? 'none' : 'x proximity', WebkitOverflowScrolling: 'touch',
      }}>
        {data.colonnes.map((col, i) => {
          const cartes = data.cartes.filter(c => c.colonneId === col.id && !c.archivé)
          // Pendant un glissement : la colonne attrapée suit le doigt, un trait
          // montre où elle sera posée (à gauche de la colonne cible, ou à
          // droite de la dernière).
          const attrapée = glisseCol?.id === col.id
          const autres = glisseCol ? data.colonnes.filter(c => c.id !== glisseCol.id) : []
          const rang = autres.findIndex(c => c.id === col.id)
          const repère = glisseCol && !attrapée && (rang === glisseCol.cible
            ? `-9px 0 0 -5px ${T.accent}`
            : glisseCol.cible === autres.length && rang === autres.length - 1 ? `9px 0 0 -5px ${T.accent}` : null)
          return (
            <div
              key={col.id}
              data-colonne={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              style={{
                minWidth: 'min(272px, 84vw)', maxWidth: 'min(272px, 84vw)', flexShrink: 0,
                background: T.surface, borderRadius: '14px',
                border: `1px solid ${T.border}`, padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '12px',
                scrollSnapAlign: 'start',
                ...(attrapée ? {
                  position: 'relative', zIndex: 5, transform: `translateX(${glisseCol.dx}px) rotate(1deg)`,
                  boxShadow: `0 18px 40px rgba(0,0,0,.45)`, borderColor: T.accent,
                } : repère ? { boxShadow: repère } : {}),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <button
                  type="button"
                  aria-label={`Déplacer la section ${col.titre} (glisser, ou flèches gauche / droite)`}
                  title="Glisser pour déplacer la section"
                  onPointerDown={e => débutGlisseCol(e, col.id)}
                  onPointerMove={mouvementGlisseCol}
                  onPointerUp={finGlisseCol}
                  onPointerCancel={finGlisseCol}
                  onKeyDown={e => {
                    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); déplacerColonne(col.id, i - 1) }
                    if (e.key === 'ArrowRight' && i < data.colonnes.length - 1) { e.preventDefault(); déplacerColonne(col.id, i + 1) }
                  }}
                  style={{
                    touchAction: 'none', cursor: attrapée ? 'grabbing' : 'grab', background: 'none', border: 'none', color: T.textMuted,
                    fontSize: '18px', lineHeight: 1, padding: '6px 4px', margin: '-6px -4px -6px -6px', flexShrink: 0, userSelect: 'none', WebkitUserSelect: 'none',
                  }}
                >⠿</button>
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
                <BoutonIcone icon="corbeille" title="Supprimer ce bloc" couleur={T.danger} taille={13} onClick={() => supprimerColonne(col.id, col.titre)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '20px' }}>
                {cartes.map(carte => {
                  const checklist = carte.checklist || []
                  const étiquettesCarte = carte.étiquettes || []
                  const aBadges = étiquettesCarte.length > 0 || checklist.length > 0 || carte.récurrence
                  return (
                    <div
                      key={carte.id}
                      data-carte={carte.id}
                      draggable
                      onDragStart={() => { dragCarte.current = carte.id }}
                      style={{
                        background: T.surface2, borderRadius: '10px', padding: '10px 10px 6px',
                        border: `1px solid ${carteRepérée === carte.id ? T.accent : T.border}`,
                        boxShadow: carteRepérée === carte.id ? `0 0 0 3px ${T.accent}55` : 'none', transition: 'box-shadow .3s, border-color .3s',
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
                          {aBadges && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '7px' }}>
                              {étiquettesCarte.map(id => {
                                const ét = data.étiquettes.find(e => e.id === id)
                                if (!ét) return null
                                return (
                                  <span key={id} style={{ fontSize: '10px', color: ét.couleur, background: ét.couleur + '20', padding: '2px 7px', borderRadius: '20px', fontFamily: grotesk }}>
                                    {ét.nom}
                                  </span>
                                )
                              })}
                              {checklist.length > 0 && (
                                <span style={{
                                  fontSize: '10px', color: T.textMuted, background: T.bg, padding: '2px 7px',
                                  borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: grotesk,
                                }}>
                                  <Icon nom="checklist" taille={10} /> {checklist.filter(i => i.fait).length}/{checklist.length}
                                </span>
                              )}
                              {carte.récurrence && (
                                <span style={{
                                  fontSize: '10px', color: T.textMuted, background: T.bg, padding: '2px 7px',
                                  borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: grotesk,
                                }}>
                                  <Icon nom="repeter" taille={10} /> {carte.récurrence === 'quotidienne' ? 'Quotidienne' : 'Hebdomadaire'}
                                </span>
                              )}
                            </div>
                          )}
                          <DatesCarte T={T} carte={carte} vert={vertLivraison} />
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '0 0 8px' }}>
                            <input
                              type="checkbox"
                              checked={estBarrée(carte)}
                              onChange={() => basculerFait(carte.id)}
                              aria-label={estBarrée(carte) ? `Décocher « ${carte.texte} »` : `Cocher « ${carte.texte} » (fait)`}
                              title={estBarrée(carte) ? 'Décocher' : carte.récurrence ? 'Cocher : faite pour aujourd\'hui' : 'Cocher : la tâche est faite'}
                              style={{ width: '20px', height: '20px', margin: '1px 0 0', flexShrink: 0, cursor: 'pointer', accentColor: vertLivraison }}
                            />
                            <p style={{
                              flex: 1, minWidth: 0, color: estBarrée(carte) ? T.textMuted : T.text, fontSize: '13.5px', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap',
                              textDecoration: estBarrée(carte) ? 'line-through' : 'none', textDecorationThickness: '2px', opacity: estBarrée(carte) ? 0.75 : 1,
                            }}>
                              {carte.texte}
                            </p>
                          </div>
                          {(carte.liens || []).length > 0 && détailsId !== carte.id && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '-2px 0 8px' }}>
                              {carte.liens.map(l => (
                                <Link key={l.lien} to={l.lien} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: `${T.accent}1f`, color: T.text, fontFamily: grotesk, textDecoration: 'none', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {l.titre}</Link>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <BoutonIcone icon="crayon" title="Modifier" onClick={() => démarrerÉdition(carte)} taille={14} />
                            <BoutonIcone icon="archive" title="Archiver" couleur={T.danger} onClick={() => archiverCarte(carte.id)} taille={14} />
                            <BoutonIcone icon="calendrier" title="Ajouter au jour sélectionné" couleur={T.accent} onClick={() => ajouterÉvénementTimeline(carte.id, jourSélectionné)} taille={14} />
                            <BoutonIcone icon="chevronHaut" title="Monter" taille={14} onClick={() => réordonnerCarte(carte.id, -1)} />
                            <BoutonIcone icon="chevronBas" title="Descendre" taille={14} onClick={() => réordonnerCarte(carte.id, 1)} />
                            <button
                              onClick={() => setDétailsId(d => d === carte.id ? null : carte.id)}
                              style={{
                                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: T.textMuted,
                                background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', fontFamily: grotesk,
                              }}
                            >
                              Détails
                              <Icon nom="chevronBas" taille={12} style={{ transform: détailsId === carte.id ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                            </button>
                          </div>

                          {détailsId === carte.id && (
                            <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <LiensÉlément T={T} liens={carte.liens || []} foyer={FOYERS[config.foyer]}
                                onChange={liens => setData(d => ({ ...d, cartes: d.cartes.map(c => (c.id === carte.id ? { ...c, liens } : c)) }))} />
                              <div>
                                <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: grotesk, fontWeight: 700 }}>⏰ Échéance</p>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <input
                                    type="date"
                                    value={carte.échéance || ''}
                                    onChange={e => définirÉchéance(carte.id, e.target.value)}
                                    style={{ flex: 1, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '6px 8px', fontSize: '12px', colorScheme: mode }}
                                  />
                                  {carte.échéance && (
                                    <BoutonIcone icon="x" title="Retirer l'échéance" taille={13} onClick={() => définirÉchéance(carte.id, null)} />
                                  )}
                                </div>
                              </div>
                              <div>
                                <p style={{ fontSize: '10px', color: vertLivraison, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: grotesk, fontWeight: 700 }}>📦 Date de livraison</p>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <input
                                    type="date"
                                    aria-label="Date de livraison"
                                    value={carte.livraison || ''}
                                    onChange={e => définirÉchéance(carte.id, e.target.value, 'livraison')}
                                    style={{ flex: 1, background: T.bg, color: T.text, border: `1px solid ${carte.livraison ? vertLivraison : T.border}`, borderRadius: '6px', padding: '6px 8px', fontSize: '12px', colorScheme: mode }}
                                  />
                                  {carte.livraison && (
                                    <BoutonIcone icon="x" title="Retirer la date de livraison" taille={13} onClick={() => définirÉchéance(carte.id, null, 'livraison')} />
                                  )}
                                </div>
                              </div>

                              {data.étiquettes.length > 0 && (
                                <div>
                                  <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: grotesk }}>Étiquettes</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {data.étiquettes.map(ét => {
                                      const actif = étiquettesCarte.includes(ét.id)
                                      return (
                                        <button key={ét.id} onClick={() => basculerÉtiquette(carte.id, ét.id)} style={{
                                          fontSize: '11px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontFamily: grotesk,
                                          background: actif ? ét.couleur : 'transparent',
                                          color: actif ? T.accentText : ét.couleur,
                                          border: `1px solid ${ét.couleur}`,
                                        }}>{ét.nom}</button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              <div>
                                <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: grotesk }}>Sous-tâches</p>
                                {checklist.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '6px' }}>
                                    {checklist.map(item => (
                                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: item.fait ? T.textMuted : T.text, cursor: 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          checked={item.fait}
                                          onChange={() => basculerItemChecklist(carte.id, item.id)}
                                          style={{ accentColor: T.accent, width: '14px', height: '14px', flexShrink: 0 }}
                                        />
                                        <span style={{ flex: 1, textDecoration: item.fait ? 'line-through' : 'none' }}>{item.texte}</span>
                                        <BoutonIcone icon="x" title="Retirer" taille={12} onClick={() => supprimerItemChecklist(carte.id, item.id)} />
                                      </label>
                                    ))}
                                  </div>
                                )}
                                <form onSubmit={e => { e.preventDefault(); ajouterItemChecklist(carte.id) }} style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    value={nouvelItem[carte.id] || ''}
                                    onChange={e => setNouvelItem(n => ({ ...n, [carte.id]: e.target.value }))}
                                    placeholder="Ajouter une sous-tâche…"
                                    style={{ flex: 1, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '6px 8px', fontSize: '12px' }}
                                  />
                                  <button type="submit" style={{
                                    background: T.surface, border: `1px solid ${T.border}`, borderRadius: '6px', width: '30px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.text,
                                  }}><Icon nom="plus" taille={13} /></button>
                                </form>
                              </div>

                              <div>
                                <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: grotesk }}>Récurrence</p>
                                <select
                                  value={carte.récurrence || ''}
                                  onChange={e => définirRécurrence(carte.id, e.target.value || null)}
                                  style={{ width: '100%', fontSize: '12px', color: T.text, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 8px' }}
                                >
                                  <option value="">Aucune</option>
                                  <option value="quotidienne">Quotidienne</option>
                                  <option value="hebdomadaire">Hebdomadaire (chaque {new Date().toLocaleDateString('fr-FR', { weekday: 'long' })})</option>
                                </select>
                                {carte.récurrence && (
                                  <p style={{ fontSize: '10px', color: T.textMuted, margin: '5px 0 0' }}>
                                    Se replanifie automatiquement dans la timeline à chaque ouverture.
                                  </p>
                                )}
                              </div>

                              <div style={{ paddingBottom: '4px' }}>
                                <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: grotesk }}>Déplacer vers</p>
                                <select
                                  value={col.id}
                                  onChange={e => déplacerCarte(carte.id, e.target.value)}
                                  style={{ width: '100%', fontSize: '12px', color: T.text, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 8px' }}
                                >
                                  {data.colonnes.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
        <NouvelleSection T={T} onCréer={ajouterColonne} />
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

      <div style={{ maxWidth: '560px', margin: '30px auto 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '17px', color: T.text, textTransform: 'capitalize' }}>
            {nomMois}
          </strong>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              title="Mois précédent" aria-label="Mois précédent"
              onClick={() => setMoisAffiché(m => {
                const d = new Date(m.année, m.mois - 1, 1)
                return { année: d.getFullYear(), mois: d.getMonth() }
              })}
              style={{
                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', borderRadius: '7px', color: T.textMuted, cursor: 'pointer',
              }}
            ><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /></button>
            <button
              title="Mois suivant" aria-label="Mois suivant"
              onClick={() => setMoisAffiché(m => {
                const d = new Date(m.année, m.mois + 1, 1)
                return { année: d.getFullYear(), mois: d.getMonth() }
              })}
              style={{
                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', borderRadius: '7px', color: T.textMuted, cursor: 'pointer',
              }}
            ><Icon nom="fleche" taille={13} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
            <div key={j} style={{ textAlign: 'center', fontSize: '10px', color: T.textMuted, fontFamily: grotesk }}>{j}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {grilleMois.map((jour, i) => {
            if (!jour) return <div key={`vide-${i}`} />
            const nbÉvénements = data.timeline.filter(ev => ev.date === jour.iso).length
            const estAujourdhui = jour.iso === aujourdhuiISO
            const estSélectionné = jour.iso === jourSélectionné
            return (
              <button
                key={jour.iso}
                onClick={() => setJourSélectionné(jour.iso)}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                  background: estSélectionné ? T.accent : T.surface,
                  border: estSélectionné ? `1px solid ${T.accent}` : estAujourdhui ? `1px dashed ${T.accent}` : `1px solid ${T.border}`,
                  borderRadius: '8px', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: estSélectionné ? T.accentText : T.text, fontFamily: grotesk }}>{jour.num}</span>
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: nbÉvénements > 0 ? (estSélectionné ? T.accentText : T.accent) : 'transparent',
                }} />
              </button>
            )
          })}
        </div>
        <p style={{ color: T.textMuted, fontSize: '11px', margin: '10px 0 0', lineHeight: '1.5' }}>
          Touche un jour pour l'ouvrir dans la timeline ci-dessus.
        </p>
      </div>

      <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '11.5px', maxWidth: '440px', margin: '26px auto 0', lineHeight: '1.7' }}>
        Glisse une carte vers un autre bloc pour la déplacer sur ordinateur, ou utilise le menu déroulant sur mobile.
        Sauvegarde automatique sur cet appareil — « Exporter » garde un fichier de secours.
      </p>
    </div>
  )
}
