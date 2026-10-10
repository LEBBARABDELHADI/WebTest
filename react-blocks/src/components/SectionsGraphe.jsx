import { Fragment, useState, useRef, useEffect } from 'react'
import { grotesk, serif } from '../lib/theme'
import { TexteFormaté, texteBrut } from '../lib/texteFormate'
import { uid } from '../lib/graphe'
import BlocCode from './BlocCode'
import OutilsTexte from './OutilsTexte'

// Sous le graphe : 4 grandes sections (colonnes sur ordinateur, à la suite
// sur téléphone), chacune avec ses sous-sections, qui contiennent des blocs.
//
// graphe.colonnes : [{ id, titre, sousSections: [{ id, titre, replié?, bulleId?, blocs }] }]
// bloc : { id, type, ... } selon le type :
//   texte   { texte }                        (**gras**, {{#hex|couleur}})
//   code    { texte, langage, surlignées? }  (numéros des lignes surlignées)
//   encadré { texte, variante }              (astuce, attention, retenir, info)
//   liste   { éléments: [{ id, texte, fait }] }
//   tableau { lignes: [[cellule…]…] }        (1re ligne = en-têtes)

export const LANGAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'HTML', 'CSS', 'SQL', 'Bash', 'JSON', 'YAML', 'XML', 'C#', 'PHP']
const POLICE_CODE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
export const NB_COLONNES = 4

export const VARIANTES = {
  astuce: { emoji: '💡', nom: 'Astuce', couleur: '#4a9d94' },
  attention: { emoji: '⚠️', nom: 'Attention', couleur: '#e2574c' },
  retenir: { emoji: '📌', nom: 'À retenir', couleur: '#f0a839' },
  info: { emoji: 'ℹ️', nom: 'Info', couleur: '#5b8dc9' },
}
const TYPES_BLOCS = [
  ['texte', '＋ Texte'], ['code', '＋ </> Code'], ['encadré', '＋ 💡 Encadré'], ['liste', '＋ ☑️ Liste'], ['tableau', '＋ ▦ Tableau'],
]

// Les 4 grandes sections d'un graphe. Les anciennes « sections » (avant
// les colonnes) deviennent les sous-sections de la première.
export function colonnesDe(graphe) {
  const existantes = Array.isArray(graphe?.colonnes) ? graphe.colonnes : []
  const colonnes = Array.from({ length: NB_COLONNES }, (_, i) => existantes[i] || { id: `col-${i + 1}`, titre: `Section ${i + 1}`, sousSections: [] })
    .map(c => ({ ...c, sousSections: Array.isArray(c.sousSections) ? c.sousSections : [] }))
  if (!existantes.length && Array.isArray(graphe?.sections) && graphe.sections.length) {
    colonnes[0] = { ...colonnes[0], sousSections: graphe.sections }
  }
  return colonnes
}

// Texte d'un bloc, pour la recherche.
export function texteDuBloc(bloc) {
  if (bloc.type === 'liste') return (bloc.éléments || []).map(e => e.texte).join(' ')
  if (bloc.type === 'tableau') return (bloc.lignes || []).map(l => l.join(' ')).join(' ')
  return texteBrut(bloc.texte || '')
}

// Bloc ↔ texte éditable (une ligne par élément / rangée).
function versÉdition(bloc) {
  if (bloc.type === 'liste') return (bloc.éléments || []).map(e => `${e.fait ? '[x] ' : ''}${e.texte}`).join('\n')
  if (bloc.type === 'tableau') return (bloc.lignes || []).map(l => l.join(' | ')).join('\n')
  return bloc.texte || ''
}
function depuisÉdition(bloc, édition) {
  const texte = édition.texte.replace(/\s+$/, '')
  if (bloc.type === 'liste') {
    const anciens = bloc.éléments || []
    return {
      ...bloc,
      éléments: texte.split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => {
        const fait = /^\[[xX]\]\s*/.test(l)
        return { id: anciens[i]?.id || uid(), texte: l.replace(/^\[[ xX]?\]\s*/, '').replace(/^[-*•]\s+/, ''), fait }
      }),
    }
  }
  if (bloc.type === 'tableau') {
    return { ...bloc, lignes: texte.split('\n').filter(l => l.trim()).map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim())) }
  }
  const maj = { ...bloc, texte }
  if (bloc.type === 'code') {
    maj.langage = édition.langage
    // Les lignes surlignées qui n'existent plus sont oubliées.
    const nb = texte.split('\n').length
    maj.surlignées = (bloc.surlignées || []).filter(n => n <= nb)
    if (!maj.surlignées.length) delete maj.surlignées
  }
  if (bloc.type === 'encadré') maj.variante = édition.variante || 'astuce'
  return maj
}
const blocVide = (bloc, édition) => (bloc.type === 'liste' || bloc.type === 'tableau' ? !édition.texte.trim() : !édition.texte.trim())

// Ordinateur (écran large) : 4 colonnes côte à côte ; téléphone : à la suite.
function useÉcranLarge() {
  const requête = '(min-width: 900px)'
  const [large, setLarge] = useState(() => typeof window !== 'undefined' && window.matchMedia(requête).matches)
  useEffect(() => {
    const m = window.matchMedia(requête)
    const changer = () => setLarge(m.matches)
    m.addEventListener('change', changer)
    return () => m.removeEventListener('change', changer)
  }, [])
  return large
}

// Glisser-déposer à la souris et au doigt (les événements « drag » du HTML
// ne marchent pas sur iPhone), dans une liste ou vers une autre : l'élément
// suit le pointeur et une ligne montre où il va se poser.
function useGlisserEntreListes(onDéposer) {
  const [glisse, setGlisse] = useState(null) // { de: { liste, index }, dx, dy, vers: { liste, index } }
  const listesRef = useRef(new Map())
  const refListe = id => el => { if (el) listesRef.current.set(id, el); else listesRef.current.delete(id) }

  const poignée = (liste, index) => ({
    onPointerDown: e => {
      if (e.button !== undefined && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const départ = { x: e.clientX, y: e.clientY, défilement: window.scrollY }
      const poignéeEl = e.currentTarget
      poignéeEl.setPointerCapture?.(e.pointerId)
      let vers = { liste, index }
      const cible = (x, y) => {
        let meilleure = null
        let distance = Infinity
        listesRef.current.forEach((el, id) => {
          const r = el.getBoundingClientRect()
          const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
          const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0
          const d = Math.hypot(dx, dy)
          if (d < distance) { distance = d; meilleure = { id, el } }
        })
        if (!meilleure) return vers
        let i = 0
        meilleure.el.querySelectorAll(':scope > [data-element]').forEach(el => {
          if (el.dataset.element === `${liste}:${index}`) return
          const r = el.getBoundingClientRect()
          if (r.top + r.height / 2 < y) i += 1
        })
        return { liste: meilleure.id, index: i }
      }
      const bouger = ev => {
        if (ev.clientY < 70) window.scrollBy(0, -14)
        else if (ev.clientY > window.innerHeight - 70) window.scrollBy(0, 14)
        vers = cible(ev.clientX, ev.clientY)
        setGlisse({ de: { liste, index }, dx: ev.clientX - départ.x, dy: ev.clientY - départ.y + (window.scrollY - départ.défilement), vers })
      }
      const finir = () => {
        poignéeEl.removeEventListener('pointermove', bouger)
        poignéeEl.removeEventListener('pointerup', finir)
        poignéeEl.removeEventListener('pointercancel', finir)
        setGlisse(null)
        if (vers.liste !== liste || vers.index !== index) onDéposer({ liste, index }, vers)
      }
      poignéeEl.addEventListener('pointermove', bouger)
      poignéeEl.addEventListener('pointerup', finir)
      poignéeEl.addEventListener('pointercancel', finir)
      setGlisse({ de: { liste, index }, dx: 0, dy: 0, vers })
    },
  })
  const style = (liste, index) => (glisse && glisse.de.liste === liste && glisse.de.index === index
    ? { transform: `translate(${glisse.dx}px, ${glisse.dy}px)`, zIndex: 20, position: 'relative', boxShadow: '0 14px 34px rgba(0,0,0,.4)', opacity: 0.95, pointerEvents: 'none' }
    : {})
  // L'index cible ne compte pas l'élément déplacé : dans sa propre liste,
  // la ligne se place donc une position plus bas après lui.
  const repère = (liste, index) => {
    if (!glisse || glisse.vers.liste !== liste) return false
    const { de, vers } = glisse
    if (de.liste !== liste) return index === vers.index
    if (vers.index === de.index) return false
    return index === (vers.index < de.index ? vers.index : vers.index + 1)
  }
  return { refListe, poignée, style, repère, glisse }
}

// Déplace un élément d'une liste à une autre (ou dans la même).
function transférer(listes, de, vers) {
  const copie = new Map([...listes].map(([k, v]) => [k, [...v]]))
  const [élément] = copie.get(de.liste).splice(de.index, 1)
  copie.get(vers.liste).splice(vers.index, 0, élément)
  return copie
}

function Poignée({ T, props, libellé }) {
  return (
    <span
      {...props}
      role="button"
      aria-label={libellé}
      title="Glisser pour déplacer"
      style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', color: T.textMuted, fontSize: '18px', lineHeight: 1, padding: '6px 4px', flexShrink: 0 }}
    >⠿</span>
  )
}

// Sous-sections en mode lecture : mémorisé sur l'appareil (préférence
// d'affichage, pas une donnée du graphe).
const CLÉ_LECTURE = 'react-blocs-sections-lecture'
function lireLecture() {
  try { return new Set(JSON.parse(localStorage.getItem(CLÉ_LECTURE)) || []) } catch { return new Set() }
}

const ANIMATION = `
@keyframes repéré { 0%, 100% { box-shadow: 0 0 0 0 #ffd60a00 } 30%, 70% { box-shadow: 0 0 0 4px #ffd60acc } }
.repere-section { animation: repéré 1s ease-in-out 2 }
@media (prefers-reduced-motion: reduce) { .repere-section { animation: none; outline: 3px solid #ffd60a } }
`

// surbrillance : { id, sousSectionId?, n } — sous-section ou bloc à montrer
// (défile jusqu'à lui et le fait clignoter) ; n change à chaque demande.
export default function SectionsGraphe({ T, colonnes, onChanger, bulles = [], onAllerÀBulle, surbrillance }) {
  const large = useÉcranLarge()
  const [édition, setÉdition] = useState(null) // { sectionId, blocId, texte, langage, variante, nouveau }
  const [titreÉdité, setTitreÉdité] = useState(null) // { id, valeur }
  const [liaisonOuverte, setLiaisonOuverte] = useState(null) // id de sous-section
  const [repérée, setRepérée] = useState(null)
  const [ouvertes, setOuvertes] = useState(() => new Set()) // dépliées le temps d'une recherche
  // Ensemble des sous-sections ET des sections (colonnes) en mode lecture.
  const [enLecture, setEnLecture] = useState(lireLecture)
  const [sommaireOuvert, setSommaireOuvert] = useState(false)
  const [pleinÉcran, setPleinÉcran] = useState(null) // id de la sous-section lue en plein écran
  const définirLecture = (ids, actif) => {
    if (actif) {
      if (édition && ids.includes(édition.sectionId)) annulerBloc()
      if (titreÉdité && ids.includes(titreÉdité.id)) setTitreÉdité(null)
      if (ids.includes(liaisonOuverte)) setLiaisonOuverte(null)
    }
    setEnLecture(avant => {
      const après = new Set(avant)
      ids.forEach(id => (actif ? après.add(id) : après.delete(id)))
      try { localStorage.setItem(CLÉ_LECTURE, JSON.stringify([...après])) } catch { /* ignore */ }
      return après
    })
  }
  // Quitter la lecture d'une sous-section sort aussi sa section du mode lecture.
  const basculerLecture = (id, colonneId) => {
    const actif = !(enLecture.has(id) || enLecture.has(colonneId))
    définirLecture(actif ? [id] : [id, colonneId], actif)
  }
  const idsColonne = c => [c.id, ...c.sousSections.map(s => s.id)]
  const basculerColonne = c => définirLecture(idsColonne(c), !enLecture.has(c.id))
  const toutEnLecture = colonnes.every(c => enLecture.has(c.id))
  const basculerTout = () => définirLecture(colonnes.flatMap(idsColonne), !toutEnLecture)
  const replierTout = replié => {
    onChanger(cols => cols.map(c => ({ ...c, sousSections: c.sousSections.map(s => ({ ...s, replié })) })))
    setOuvertes(new Set())
  }
  // Fait défiler jusqu'à une section / sous-section / bloc et le fait clignoter.
  const montrer = (id, sousSectionId) => {
    setOuvertes(o => new Set([...o, sousSectionId || id]))
    setRepérée(id)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      zoneRef.current?.querySelector(`[data-repere="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: id.startsWith?.('col-') ? 'start' : 'center' })
    }))
    clearTimeout(minuteurRepère.current)
    minuteurRepère.current = setTimeout(() => setRepérée(null), 2400)
  }
  const minuteurRepère = useRef(null)
  const zoneRef = useRef(null)

  const sousSectionsParId = new Map(colonnes.flatMap(c => c.sousSections.map(s => [s.id, s])))
  const bullesParId = new Map(bulles.map(b => [b.id, b]))

  useEffect(() => {
    if (surbrillance) montrer(surbrillance.id, surbrillance.sousSectionId)
  }, [surbrillance?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  const glisserSections = useGlisserEntreListes((de, vers) => onChanger(cols => {
    const listes = transférer(new Map(cols.map(c => [c.id, c.sousSections])), de, vers)
    return cols.map(c => ({ ...c, sousSections: listes.get(c.id) }))
  }))
  const glisserBlocs = useGlisserEntreListes((de, vers) => onChanger(cols => {
    const toutes = cols.flatMap(c => c.sousSections)
    const listes = transférer(new Map(toutes.map(s => [s.id, s.blocs])), de, vers)
    return cols.map(c => ({ ...c, sousSections: c.sousSections.map(s => ({ ...s, blocs: listes.get(s.id) })) }))
  }))

  const majColonne = (id, fn) => onChanger(cols => cols.map(c => (c.id === id ? fn(c) : c)))
  const majSection = (id, fn) => onChanger(cols => cols.map(c => ({ ...c, sousSections: c.sousSections.map(s => (s.id === id ? fn(s) : s)) })))
  const majBloc = (sectionId, blocId, fn) => majSection(sectionId, s => ({ ...s, blocs: s.blocs.map(b => (b.id === blocId ? fn(b) : b)) }))
  const ajouterSousSection = colonne => {
    const section = { id: uid(), titre: `Sous-section ${colonne.sousSections.length + 1}`, blocs: [] }
    majColonne(colonne.id, c => ({ ...c, sousSections: [...c.sousSections, section] }))
    setTitreÉdité({ id: section.id, valeur: section.titre })
  }
  const supprimerSousSection = section => {
    if (section.blocs.length && !window.confirm(`Supprimer la sous-section « ${section.titre} » et ses ${section.blocs.length} bloc(s) ?`)) return
    onChanger(cols => cols.map(c => ({ ...c, sousSections: c.sousSections.filter(s => s.id !== section.id) })))
  }
  const supprimerBloc = (sectionId, blocId) => majSection(sectionId, s => ({ ...s, blocs: s.blocs.filter(b => b.id !== blocId) }))
  const ajouterBloc = (sectionId, type) => {
    const bloc = {
      id: uid(), type,
      ...(type === 'liste' ? { éléments: [] } : type === 'tableau' ? { lignes: [] } : { texte: '' }),
      ...(type === 'code' ? { langage: '' } : {}),
      ...(type === 'encadré' ? { variante: 'astuce' } : {}),
    }
    majSection(sectionId, s => ({ ...s, replié: false, blocs: [...s.blocs, bloc] }))
    setÉdition({ sectionId, blocId: bloc.id, texte: type === 'tableau' ? 'Colonne 1 | Colonne 2\n | ' : '', langage: '', variante: 'astuce', nouveau: true })
  }
  const éditer = (sectionId, bloc) => setÉdition({ sectionId, blocId: bloc.id, texte: versÉdition(bloc), langage: bloc.langage || '', variante: bloc.variante || 'astuce', nouveau: false })
  // Valider un bloc vide le retire ; annuler un bloc qu'on vient d'ajouter aussi.
  const validerBloc = () => {
    const { sectionId, blocId } = édition
    const bloc = sousSectionsParId.get(sectionId)?.blocs.find(b => b.id === blocId)
    if (!bloc || blocVide(bloc, édition)) supprimerBloc(sectionId, blocId)
    else majBloc(sectionId, blocId, b => depuisÉdition(b, édition))
    setÉdition(null)
  }
  const annulerBloc = () => {
    if (édition?.nouveau) supprimerBloc(édition.sectionId, édition.blocId)
    setÉdition(null)
  }
  const validerTitre = () => {
    if (!titreÉdité) return
    const titre = titreÉdité.valeur.trim()
    if (titre) onChanger(cols => cols.map(c => (c.id === titreÉdité.id ? { ...c, titre } : { ...c, sousSections: c.sousSections.map(s => (s.id === titreÉdité.id ? { ...s, titre } : s)) })))
    setTitreÉdité(null)
  }
  const relier = (sectionId, bulleId) => {
    // Une bulle n'est reliée qu'à une sous-section à la fois.
    onChanger(cols => cols.map(c => ({
      ...c,
      sousSections: c.sousSections.map(s => {
        if (s.id === sectionId) { const maj = { ...s, bulleId }; if (!bulleId) delete maj.bulleId; return maj }
        if (bulleId && s.bulleId === bulleId) { const maj = { ...s }; delete maj.bulleId; return maj }
        return s
      }),
    })))
    setLiaisonOuverte(null)
  }

  const petitBouton = (couleur = T.text) => ({
    background: T.surface2, color: couleur, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '7px 11px',
    fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
  })
  const icône = { background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '14px', padding: '6px', borderRadius: '7px', flexShrink: 0 }
  const champTitre = (id, taille) => (
    <input
      autoFocus
      value={titreÉdité.valeur}
      onChange={e => setTitreÉdité({ id, valeur: e.target.value })}
      onBlur={validerTitre}
      onKeyDown={e => { if (e.key === 'Enter') validerTitre(); if (e.key === 'Escape') setTitreÉdité(null) }}
      onFocus={e => e.target.select()}
      aria-label="Titre"
      style={{ flex: 1, minWidth: 0, fontSize: taille, fontWeight: 700, color: T.text, background: T.bg, border: `1px solid ${T.accent}`, borderRadius: '8px', padding: '6px 8px', fontFamily: grotesk }}
    />
  )
  const ligneRepère = <div style={{ height: '4px', borderRadius: '2px', background: T.accent, margin: '-2px 0' }} />

  return (
    <div data-sections ref={zoneRef} style={{ marginTop: '18px' }}>
      <style>{ANIMATION}</style>
      {/* Barre des sections : reste en haut de l'écran pendant qu'on fait défiler. */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: T.bg, padding: '8px 0', marginBottom: '8px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setSommaireOuvert(o => !o)} aria-expanded={sommaireOuvert} style={{ ...petitBouton(), ...(sommaireOuvert ? { background: T.accent, color: T.accentText, border: 'none' } : {}) }}>
            📑 Sommaire {sommaireOuvert ? '▴' : '▾'}
          </button>
          <button onClick={() => replierTout(true)} title="Replier toutes les sous-sections" style={petitBouton()}>⊟ Tout replier</button>
          <button onClick={() => replierTout(false)} title="Déplier toutes les sous-sections" style={petitBouton()}>⊞ Tout déplier</button>
          <button onClick={basculerTout} aria-pressed={toutEnLecture}
            title={toutEnLecture ? 'Revenir en modification partout' : 'Toutes les sections et sous-sections en mode lecture'}
            style={{ ...petitBouton(), ...(toutEnLecture ? { background: `${T.accent}26`, color: T.accent, borderColor: T.accent } : {}) }}>
            {toutEnLecture ? '✏️ Tout modifier' : '📖 Tout en lecture'}
          </button>
        </div>
        {sommaireOuvert && (
          <nav aria-label="Sommaire des sections" style={{
            marginTop: '8px', display: 'grid', gridTemplateColumns: large ? `repeat(${NB_COLONNES}, minmax(0, 1fr))` : '1fr', gap: large ? '14px' : '10px',
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '10px 12px', maxHeight: large ? 'none' : '55dvh', overflowY: 'auto',
          }}>
            {colonnes.map(c => (
              <div key={c.id} style={{ minWidth: 0 }}>
                <button onClick={() => { montrer(c.id); if (!large) setSommaireOuvert(false) }} style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer',
                  fontFamily: serif, fontStyle: 'italic', fontSize: '16px', color: T.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{c.titre}</button>
                {c.sousSections.length === 0 && <p style={{ margin: '2px 0 0 10px', fontSize: '12px', color: T.textMuted }}>—</p>}
                {c.sousSections.map(ss => (
                  <div key={ss.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => { montrer(ss.id); if (!large) setSommaireOuvert(false) }} style={{
                      flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 'none', padding: '4px 0 4px 10px', cursor: 'pointer',
                      fontSize: '13px', color: T.text, fontFamily: grotesk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderLeft: `2px solid ${T.border}`,
                    }}>{ss.titre} <span style={{ color: T.textMuted, fontSize: '11px' }}>{ss.blocs.length}</span></button>
                    <button onClick={() => setPleinÉcran(ss.id)} aria-label={`Lire « ${ss.titre} » en plein écran`} title="Lire en plein écran"
                      style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>⛶</button>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: large ? `repeat(${NB_COLONNES}, minmax(0, 1fr))` : '1fr', gap: large ? '14px' : '22px', alignItems: 'start' }}>
        {colonnes.map(colonne => {
          const nbBlocs = colonne.sousSections.reduce((n, s) => n + s.blocs.length, 0)
          const colonneEnLecture = enLecture.has(colonne.id)
          return (
            <section key={colonne.id} aria-label={colonne.titre} data-repere={colonne.id} className={repérée === colonne.id ? 'repere-section' : undefined} style={{
              scrollMarginTop: '70px',
              background: large ? `${T.surface}88` : 'transparent', border: large ? `1px solid ${T.border}` : 'none',
              borderRadius: '16px', padding: large ? '12px' : 0, minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', borderBottom: `2px solid ${T.accent}`, paddingBottom: '8px' }}>
                {titreÉdité?.id === colonne.id ? champTitre(colonne.id, '18px') : (
                  <h2 onClick={colonneEnLecture ? undefined : () => setTitreÉdité({ id: colonne.id, valeur: colonne.titre })} title={colonneEnLecture ? undefined : 'Toucher pour renommer'}
                    style={{ flex: 1, minWidth: 0, margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '21px', color: T.text, cursor: colonneEnLecture ? 'default' : 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {colonne.titre}
                  </h2>
                )}
                <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: grotesk, flexShrink: 0 }}>
                  {colonne.sousSections.length} sous-section{colonne.sousSections.length > 1 ? 's' : ''} · {nbBlocs} bloc{nbBlocs > 1 ? 's' : ''}
                </span>
                <button onClick={() => basculerColonne(colonne)} aria-pressed={colonneEnLecture}
                  aria-label={colonneEnLecture ? `Modifier la section ${colonne.titre}` : `Section ${colonne.titre} en mode lecture`}
                  title={colonneEnLecture ? 'Revenir en modification pour toute la section' : 'Toute la section en mode lecture'}
                  style={{ ...icône, ...(colonneEnLecture ? { background: `${T.accent}26`, color: T.accent } : {}) }}>{colonneEnLecture ? '✏️' : '📖'}</button>
              </div>

              <div ref={glisserSections.refListe(colonne.id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '24px' }}>
                {colonne.sousSections.map((section, i) => {
                  const bulle = section.bulleId && bullesParId.get(section.bulleId)
                  const visible = !section.replié || ouvertes.has(section.id)
                  const lecture = enLecture.has(section.id) || colonneEnLecture
                  return (
                    <Fragment key={section.id}>
                      {glisserSections.repère(colonne.id, i) && ligneRepère}
                      <div
                        data-element={`${colonne.id}:${i}`}
                        data-repere={section.id}
                        data-sous-section={section.id}
                        className={repérée === section.id ? 'repere-section' : undefined}
                        style={{
                          scrollMarginTop: '70px',
                          background: T.surface, border: `1px solid ${lecture ? `${T.accent}66` : T.border}`, borderRadius: '14px',
                          padding: lecture ? '8px 14px 12px' : '8px 10px 10px', minWidth: 0, ...glisserSections.style(colonne.id, i),
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {!lecture && <Poignée T={T} props={glisserSections.poignée(colonne.id, i)} libellé={`Déplacer la sous-section ${section.titre}`} />}
                          <button onClick={() => { majSection(section.id, s => ({ ...s, replié: !visible })); setOuvertes(o => { const n = new Set(o); n.delete(section.id); return n }) }}
                            aria-label={visible ? 'Replier la sous-section' : 'Déplier la sous-section'}
                            style={{ ...icône, fontSize: '11px', padding: '6px 4px', transform: visible ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }}>▼</button>
                          {titreÉdité?.id === section.id ? champTitre(section.id, '15px') : (
                            <h3 onClick={lecture ? undefined : () => setTitreÉdité({ id: section.id, valeur: section.titre })} title={lecture ? undefined : 'Toucher pour renommer'}
                              style={{ flex: 1, minWidth: 0, margin: 0, fontSize: lecture ? '16px' : '15px', fontWeight: 700, color: T.text, fontFamily: grotesk, cursor: lecture ? 'default' : 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {section.titre}
                              {!lecture && <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: 500, color: T.textMuted }}>{section.blocs.length}</span>}
                            </h3>
                          )}
                          <button onClick={() => setPleinÉcran(section.id)} aria-label={`Lire « ${section.titre} » en plein écran`} title="Lire en plein écran" style={icône}>⛶</button>
                          <button onClick={() => basculerLecture(section.id, colonne.id)} aria-pressed={lecture} aria-label={lecture ? 'Quitter le mode lecture' : 'Mode lecture'}
                            title={lecture ? 'Quitter le mode lecture (modifier)' : 'Mode lecture : masquer les boutons de modification'}
                            style={{ ...icône, ...(lecture ? { background: `${T.accent}26`, color: T.accent } : {}) }}>{lecture ? '✏️' : '📖'}</button>
                          {!lecture && (
                            <>
                              <button onClick={() => setLiaisonOuverte(o => (o === section.id ? null : section.id))} aria-label="Relier à une bulle du graphe" title="Relier à une bulle du graphe"
                                style={{ ...icône, color: bulle ? T.accent : T.textMuted }}>🔗</button>
                              <button onClick={() => supprimerSousSection(section)} aria-label={`Supprimer la sous-section ${section.titre}`} title="Supprimer la sous-section" style={{ ...icône, color: T.danger }}>🗑️</button>
                            </>
                          )}
                        </div>
                        {(bulle || liaisonOuverte === section.id) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: lecture ? '4px 0 6px' : '2px 0 4px 30px', flexWrap: 'wrap' }}>
                            {bulle && liaisonOuverte !== section.id && (
                              <button onClick={() => onAllerÀBulle?.(bulle.id)} title="Voir la bulle dans le graphe" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px', maxWidth: '100%', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
                                background: `${T.accent}22`, border: `1px solid ${T.accent}`, color: T.text, fontSize: '11.5px', fontWeight: 600, fontFamily: grotesk,
                              }}><span>🫧</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{texteBrut(bulle.texte)}</span><span style={{ color: T.textMuted }}>↗</span></button>
                            )}
                            {liaisonOuverte === section.id && (
                              <select
                                autoFocus
                                value={section.bulleId || ''}
                                onChange={e => relier(section.id, e.target.value || null)}
                                aria-label="Bulle reliée"
                                style={{ flex: 1, minWidth: 0, fontSize: '12.5px', fontFamily: grotesk, background: T.bg, color: T.text, border: `1px solid ${T.accent}`, borderRadius: '8px', padding: '5px 8px' }}
                              >
                                <option value="">— Aucune bulle —</option>
                                {bulles.map(b => <option key={b.id} value={b.id}>{texteBrut(b.texte).slice(0, 60)}</option>)}
                              </select>
                            )}
                          </div>
                        )}
                        {visible && (
                          <BlocsSection
                            T={T}
                            section={section}
                            lecture={lecture}
                            glisser={glisserBlocs}
                            repérée={repérée}
                            édition={édition?.sectionId === section.id ? édition : null}
                            setÉdition={setÉdition}
                            éditer={éditer}
                            validerBloc={validerBloc}
                            annulerBloc={annulerBloc}
                            supprimerBloc={supprimerBloc}
                            majBloc={majBloc}
                            ajouterBloc={ajouterBloc}
                            petitBouton={petitBouton}
                            icône={icône}
                            ligneRepère={ligneRepère}
                          />
                        )}
                      </div>
                    </Fragment>
                  )
                })}
                {glisserSections.repère(colonne.id, colonne.sousSections.length) && ligneRepère}
                {colonne.sousSections.length === 0 && !glisserSections.glisse && (
                  <p style={{ margin: 0, padding: '12px', textAlign: 'center', fontSize: '12px', color: T.textMuted, border: `1px dashed ${T.border}`, borderRadius: '12px', lineHeight: 1.5 }}>
                    Aucune sous-section
                  </p>
                )}
              </div>
              {!colonneEnLecture && (
                <button onClick={() => ajouterSousSection(colonne)} style={{ ...petitBouton(T.textMuted), width: '100%', marginTop: '10px', padding: '9px', borderStyle: 'dashed', background: 'transparent' }}>
                  ＋ Sous-section
                </button>
              )}
            </section>
          )
        })}
      </div>
      {pleinÉcran && sousSectionsParId.get(pleinÉcran) && (
        <LecturePleinÉcran
          T={T}
          colonnes={colonnes}
          id={pleinÉcran}
          onAller={setPleinÉcran}
          onFermer={() => { const id = pleinÉcran; setPleinÉcran(null); montrer(id) }}
          majBloc={majBloc}
        />
      )}
    </div>
  )
}

// Taille du texte en plein écran, mémorisée sur l'appareil.
const CLÉ_TAILLE = 'react-blocs-lecture-taille'
function lireTaille() {
  const v = Number(localStorage.getItem(CLÉ_TAILLE))
  return v >= 0.8 && v <= 2 ? v : 1.25
}

// Lecture d'une sous-section en plein écran : grand texte, rien d'autre ;
// ‹ › (ou flèches) passent à la sous-section précédente / suivante.
function LecturePleinÉcran({ T, colonnes, id, onAller, onFermer, majBloc }) {
  const [échelle, setÉchelle] = useState(lireTaille)
  const fenêtreRef = useRef(null)
  const toutes = colonnes.flatMap(c => c.sousSections.map(ss => ({ ss, colonne: c })))
  const i = toutes.findIndex(x => x.ss.id === id)
  const { ss, colonne } = toutes[i]
  const précédente = toutes[i - 1]
  const suivante = toutes[i + 1]
  useEffect(() => { fenêtreRef.current?.focus(); fenêtreRef.current?.scrollTo?.(0, 0) }, [id])
  const changerTaille = delta => setÉchelle(é => {
    const v = Math.round(Math.min(2, Math.max(0.8, é + delta)) * 100) / 100
    try { localStorage.setItem(CLÉ_TAILLE, String(v)) } catch { /* ignore */ }
    return v
  })
  const surTouche = e => {
    if (e.key === 'Escape') { e.preventDefault(); onFermer() }
    else if (e.key === 'ArrowRight' && suivante) { e.preventDefault(); onAller(suivante.ss.id) }
    else if (e.key === 'ArrowLeft' && précédente) { e.preventDefault(); onAller(précédente.ss.id) }
  }
  const rond = actif => ({
    minWidth: '40px', height: '40px', borderRadius: '12px', border: `1px solid ${T.border}`, background: T.surface, color: T.text,
    cursor: actif ? 'pointer' : 'default', opacity: actif ? 1 : 0.35, fontSize: '15px', fontWeight: 700, fontFamily: grotesk, padding: '0 10px',
  })
  return (
    <div role="dialog" aria-label={`Lecture : ${ss.titre}`} ref={fenêtreRef} tabIndex={-1} onKeyDown={surTouche}
      style={{ position: 'fixed', inset: 0, zIndex: 1300, background: T.bg, overflowY: 'auto', outline: 'none' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: T.bg, borderBottom: `1px solid ${T.border}`, padding: 'max(10px, env(safe-area-inset-top)) 14px 10px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => précédente && onAller(précédente.ss.id)} disabled={!précédente} aria-label="Sous-section précédente" title={précédente ? précédente.ss.titre : ''} style={rond(!!précédente)}>‹</button>
          <span style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '12px', color: T.textMuted, fontFamily: grotesk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {i + 1} / {toutes.length}
          </span>
          <button onClick={() => changerTaille(-0.1)} aria-label="Texte plus petit" style={rond(échelle > 0.8)}>A−</button>
          <button onClick={() => changerTaille(0.1)} aria-label="Texte plus grand" style={rond(échelle < 2)}>A+</button>
          <button onClick={() => suivante && onAller(suivante.ss.id)} disabled={!suivante} aria-label="Sous-section suivante" title={suivante ? suivante.ss.titre : ''} style={rond(!!suivante)}>›</button>
          <button onClick={onFermer} aria-label="Fermer la lecture" style={{ ...rond(true), marginLeft: '6px' }}>✕</button>
        </div>
      </div>
      <article style={{ maxWidth: '820px', margin: '0 auto', padding: '22px 18px max(40px, env(safe-area-inset-bottom))' }}>
        <p style={{ margin: '0 0 4px', fontFamily: serif, fontStyle: 'italic', fontSize: `${15 * échelle}px`, color: T.accent }}>{colonne.titre}</p>
        <h1 style={{ margin: '0 0 18px', fontFamily: grotesk, fontSize: `${26 * échelle}px`, lineHeight: 1.2, color: T.text }}>{ss.titre}</h1>
        {ss.blocs.length === 0 && <p style={{ color: T.textMuted, fontStyle: 'italic' }}>Sous-section vide.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${14 * échelle}px` }}>
          {ss.blocs.map(b => <VueBloc key={b.id} T={T} bloc={b} lecture échelle={échelle} majBloc={fn => majBloc(ss.id, b.id, fn)} />)}
        </div>
        {suivante && (
          <button onClick={() => onAller(suivante.ss.id)} style={{
            marginTop: '34px', width: '100%', padding: '14px', borderRadius: '14px', border: `1px dashed ${T.border}`, background: 'transparent',
            color: T.textMuted, cursor: 'pointer', fontFamily: grotesk, fontSize: '14px', textAlign: 'right',
          }}>Suivante : <strong style={{ color: T.text }}>{suivante.ss.titre}</strong> ›</button>
        )}
      </article>
    </div>
  )
}

function BlocsSection({ T, section, lecture, glisser, repérée, édition, setÉdition, éditer, validerBloc, annulerBloc, supprimerBloc, majBloc, ajouterBloc, petitBouton, icône, ligneRepère }) {
  return (
    <>
      <div ref={glisser.refListe(section.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', minHeight: '10px' }}>
        {section.blocs.map((bloc, i) => (
          <Fragment key={bloc.id}>
            {glisser.repère(section.id, i) && ligneRepère}
            <div
              data-element={`${section.id}:${i}`}
              data-repere={bloc.id}
              className={repérée === bloc.id ? 'repere-section' : undefined}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', background: T.surface, borderRadius: '10px', ...glisser.style(section.id, i) }}
            >
              {!lecture && <Poignée T={T} props={glisser.poignée(section.id, i)} libellé="Déplacer le bloc" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                {édition?.blocId === bloc.id && !lecture
                  ? <ÉditeurBloc T={T} bloc={bloc} édition={édition} setÉdition={setÉdition} valider={validerBloc} annuler={annulerBloc} petitBouton={petitBouton} />
                  : <VueBloc T={T} bloc={bloc} lecture={lecture} majBloc={fn => majBloc(section.id, bloc.id, fn)} />}
              </div>
              {édition?.blocId !== bloc.id && !lecture && (
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <button onClick={() => éditer(section.id, bloc)} aria-label="Modifier le bloc" title="Modifier" style={icône}>✏️</button>
                  <button onClick={() => supprimerBloc(section.id, bloc.id)} aria-label="Supprimer le bloc" title="Supprimer" style={icône}>🗑️</button>
                </div>
              )}
            </div>
          </Fragment>
        ))}
        {glisser.repère(section.id, section.blocs.length) && ligneRepère}
      </div>
      {lecture ? (
        section.blocs.length === 0 && <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: T.textMuted, fontStyle: 'italic' }}>Sous-section vide.</p>
      ) : (
      <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
        {TYPES_BLOCS.map(([type, libellé]) => (
          <button key={type} onClick={() => ajouterBloc(section.id, type)} style={{ ...petitBouton(), padding: '6px 9px', fontSize: '12px' }}>{libellé}</button>
        ))}
      </div>
      )}
    </>
  )
}

// Affichage d'un bloc (hors édition). Les cases des listes et les numéros
// de ligne du code se touchent directement.
function VueBloc({ T, bloc, lecture, majBloc, échelle = 1 }) {
  if (bloc.type === 'code') {
    return (
      <BlocCode
        code={bloc.texte}
        langage={bloc.langage}
        surlignées={bloc.surlignées || []}
        taille={12.5 * échelle}
        onBasculerLigne={lecture ? undefined : n => majBloc(b => {
          const s = new Set(b.surlignées || [])
          if (s.has(n)) s.delete(n); else s.add(n)
          const maj = { ...b, surlignées: [...s].sort((x, y) => x - y) }
          if (!maj.surlignées.length) delete maj.surlignées
          return maj
        })}
      />
    )
  }
  if (bloc.type === 'encadré') {
    const v = VARIANTES[bloc.variante] || VARIANTES.astuce
    return (
      <div style={{ borderLeft: `4px solid ${v.couleur}`, background: `${v.couleur}1f`, borderRadius: '8px', padding: '8px 12px' }}>
        <p style={{ margin: '0 0 3px', fontSize: `${11.5 * échelle}px`, fontWeight: 800, color: v.couleur, fontFamily: grotesk, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{v.emoji} {v.nom}</p>
        <div style={{ fontSize: `${14 * échelle}px`, lineHeight: 1.55, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><TexteFormaté texte={bloc.texte} couleurDéfaut={T.text} /></div>
      </div>
    )
  }
  if (bloc.type === 'liste') {
    const éléments = bloc.éléments || []
    const faits = éléments.filter(e => e.fait).length
    return (
      <div style={{ padding: '2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: T.surface2, overflow: 'hidden' }}>
            <div style={{ width: `${éléments.length ? (faits / éléments.length) * 100 : 0}%`, height: '100%', background: '#4a9d94', transition: 'width .2s' }} />
          </div>
          <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: grotesk }}>{faits}/{éléments.length}</span>
        </div>
        {éléments.map(é => (
          <label key={é.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '3px 0', cursor: 'pointer', fontSize: `${14 * échelle}px`, lineHeight: 1.45, color: é.fait ? T.textMuted : T.text }}>
            <input
              type="checkbox"
              checked={!!é.fait}
              onChange={() => majBloc(b => ({ ...b, éléments: b.éléments.map(x => (x.id === é.id ? { ...x, fait: !x.fait } : x)) }))}
              style={{ width: `${17 * échelle}px`, height: `${17 * échelle}px`, marginTop: `${2 * échelle}px`, accentColor: '#4a9d94', flexShrink: 0 }}
            />
            <span style={{ textDecoration: é.fait ? 'line-through' : 'none' }}><TexteFormaté texte={é.texte} couleurDéfaut={é.fait ? T.textMuted : T.text} /></span>
          </label>
        ))}
      </div>
    )
  }
  if (bloc.type === 'tableau') {
    const [entête = [], ...corps] = bloc.lignes || []
    const nbColonnes = Math.max(0, ...(bloc.lignes || []).map(l => l.length))
    const cellule = { border: `1px solid ${T.border}`, padding: '6px 9px', textAlign: 'left', verticalAlign: 'top' }
    return (
      <div style={{ overflowX: 'auto', padding: '2px 0' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: `${13 * échelle}px`, color: T.text, minWidth: '100%' }}>
          <thead>
            <tr>{Array.from({ length: nbColonnes }, (_, j) => (
              <th key={j} style={{ ...cellule, background: T.surface2, fontWeight: 700, fontFamily: grotesk }}><TexteFormaté texte={entête[j] || ''} couleurDéfaut={T.text} /></th>
            ))}</tr>
          </thead>
          <tbody>
            {corps.map((ligne, i) => (
              <tr key={i}>{Array.from({ length: nbColonnes }, (_, j) => (
                <td key={j} style={cellule}><TexteFormaté texte={ligne[j] || ''} couleurDéfaut={T.text} /></td>
              ))}</tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return (
    <div style={{ fontSize: `${14.5 * échelle}px`, lineHeight: 1.6, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '4px 2px' }}>
      <TexteFormaté texte={bloc.texte} couleurDéfaut={T.text} />
    </div>
  )
}

const AIDES = {
  liste: 'Une ligne par élément. « [x] » au début = déjà coché.',
  tableau: 'Une ligne par rangée, colonnes séparées par « | ». La 1re ligne donne les en-têtes.',
}

function ÉditeurBloc({ T, bloc, édition, setÉdition, valider, annuler, petitBouton }) {
  const champ = useRef(null)
  const code = bloc.type === 'code'
  const brut = code || bloc.type === 'tableau'
  const surTouche = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); valider(); return }
    if (e.key === 'Escape') { e.preventDefault(); annuler(); return }
    // Dans un bloc de code, Tab insère deux espaces au lieu de quitter le champ.
    if (code && e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      if (document.execCommand?.('insertText', false, '  ')) return
      const el = e.currentTarget
      const { selectionStart: début, selectionEnd: fin, value } = el
      el.value = `${value.slice(0, début)}  ${value.slice(fin)}`
      el.selectionStart = el.selectionEnd = début + 2
      setÉdition(é => ({ ...é, texte: el.value }))
    }
  }
  const placeholder = {
    code: 'Colle ou écris ton code…',
    encadré: 'Le conseil, la mise en garde ou le point à retenir…',
    liste: 'Installer Java\n[x] Installer Maven\nCréer le projet',
    tableau: 'Scope | Compilation | Exécution\ncompile | oui | oui\nruntime | non | oui',
  }[bloc.type] || 'Écris ton texte… sélectionne un passage puis B pour le mettre en gras'
  return (
    <div style={{ padding: '4px 0' }}>
      {code && (
        <select value={édition.langage} onChange={e => setÉdition(é => ({ ...é, langage: e.target.value }))} aria-label="Langage du code" style={{
          fontSize: '12.5px', fontFamily: grotesk, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '5px 8px', marginBottom: '6px',
        }}>
          <option value="">Langage…</option>
          {LANGAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      )}
      {bloc.type === 'encadré' && (
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }} role="group" aria-label="Type d'encadré">
          {Object.entries(VARIANTES).map(([id, v]) => {
            const actif = édition.variante === id
            return (
              <button key={id} type="button" onClick={() => setÉdition(é => ({ ...é, variante: id }))} aria-pressed={actif} style={{
                padding: '4px 9px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: grotesk,
                background: actif ? v.couleur : 'transparent', color: actif ? '#fff' : v.couleur, border: `1.5px solid ${v.couleur}`,
              }}>{v.emoji} {v.nom}</button>
            )
          })}
        </div>
      )}
      {AIDES[bloc.type] && <p style={{ margin: '0 0 5px', fontSize: '11.5px', color: T.textMuted, lineHeight: 1.4 }}>{AIDES[bloc.type]}</p>}
      <textarea
        ref={champ}
        autoFocus
        value={édition.texte}
        onChange={e => setÉdition(é => ({ ...é, texte: e.target.value }))}
        onKeyDown={surTouche}
        placeholder={placeholder}
        aria-label={code ? 'Code du bloc' : 'Texte du bloc'}
        rows={code ? 8 : bloc.type === 'liste' || bloc.type === 'tableau' ? 5 : 4}
        spellCheck={!brut}
        autoCapitalize={brut ? 'off' : undefined}
        autoCorrect={brut ? 'off' : undefined}
        style={{
          width: '100%', boxSizing: 'border-box', borderRadius: '10px', padding: '10px', resize: 'vertical', lineHeight: 1.55, border: `1px solid ${T.accent}`,
          ...(brut
            ? { background: code ? '#0d0f14' : T.bg, color: code ? '#e2e8f0' : T.text, fontFamily: POLICE_CODE, fontSize: '13px', whiteSpace: 'pre', overflowX: 'auto' }
            : { background: T.bg, color: T.text, fontFamily: 'inherit', fontSize: '15px' }),
        }}
      />
      {!code && <OutilsTexte T={T} grand obtenirInput={() => champ.current} valeur={édition.texte} setValeur={v => setÉdition(é => ({ ...é, texte: v }))} />}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
        <button onClick={annuler} style={petitBouton()}>Annuler</button>
        <button onClick={valider} style={{ ...petitBouton(), background: T.accent, color: T.accentText, border: 'none', fontWeight: 700 }}>Valider</button>
        <span style={{ alignSelf: 'center', fontSize: '11px', color: T.textMuted, marginLeft: '4px' }}>Ctrl+Entrée</span>
      </div>
    </div>
  )
}
