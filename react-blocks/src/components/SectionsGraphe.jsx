import { useState, useRef } from 'react'
import { grotesk, serif } from '../lib/theme'
import { TexteFormaté } from '../lib/texteFormate'
import { uid } from '../lib/graphe'
import CodeBlock from './CodeBlock'
import OutilsTexte from './OutilsTexte'

// Sections sous le graphe : chacune a un titre et ses propres blocs de
// texte (gras, couleurs) et de code. Sections et blocs se réordonnent en
// les glissant par leur poignée ⠿ (souris ou doigt).
//
// graphe.sections : [{ id, titre, replié?, blocs: [{ id, type: 'texte' | 'code', texte, langage? }] }]

const LANGAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'HTML', 'CSS', 'SQL', 'Bash', 'JSON', 'YAML', 'XML', 'C#', 'PHP']
const POLICE_CODE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

function déplacer(liste, de, vers) {
  const copie = [...liste]
  const [élément] = copie.splice(de, 1)
  copie.splice(vers, 0, élément)
  return copie
}

// Glisser-déposer vertical à la souris et au doigt (les événements
// « drag » du HTML ne marchent pas sur iPhone). Les autres éléments
// s'écartent pour montrer où l'élément va se poser.
function useRéordonner(onDéplacer) {
  const conteneurRef = useRef(null)
  const [glisse, setGlisse] = useState(null) // { index, dy, cible, hauteur }

  const poignée = index => ({
    onPointerDown: e => {
      if (e.button !== undefined && e.button !== 0) return
      e.preventDefault()
      const éléments = [...conteneurRef.current.querySelectorAll(':scope > [data-element]')]
      const rects = éléments.map(el => el.getBoundingClientRect())
      const écart = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 10
      const hauteur = rects[index].height + écart
      const départ = { y: e.clientY, défilement: window.scrollY }
      const poignéeEl = e.currentTarget
      poignéeEl.setPointerCapture?.(e.pointerId)
      let cible = index
      const bouger = ev => {
        if (ev.clientY < 70) window.scrollBy(0, -14)
        else if (ev.clientY > window.innerHeight - 70) window.scrollBy(0, 14)
        const dy = ev.clientY - départ.y + (window.scrollY - départ.défilement)
        const centre = rects[index].top + rects[index].height / 2 + dy
        cible = rects.filter((r, i) => i !== index && r.top + r.height / 2 < centre).length
        setGlisse({ index, dy, cible, hauteur })
      }
      const finir = () => {
        poignéeEl.removeEventListener('pointermove', bouger)
        poignéeEl.removeEventListener('pointerup', finir)
        poignéeEl.removeEventListener('pointercancel', finir)
        setGlisse(null)
        if (cible !== index) onDéplacer(index, cible)
      }
      poignéeEl.addEventListener('pointermove', bouger)
      poignéeEl.addEventListener('pointerup', finir)
      poignéeEl.addEventListener('pointercancel', finir)
      setGlisse({ index, dy: 0, cible: index, hauteur })
    },
  })

  // Décalage visuel de chaque élément pendant le glisser.
  const style = index => {
    if (!glisse) return {}
    if (index === glisse.index) {
      return { transform: `translateY(${glisse.dy}px)`, zIndex: 5, position: 'relative', boxShadow: '0 12px 30px rgba(0,0,0,.35)', transition: 'box-shadow .15s' }
    }
    let décalage = 0
    if (glisse.index < index && index <= glisse.cible) décalage = -glisse.hauteur
    if (glisse.cible <= index && index < glisse.index) décalage = glisse.hauteur
    return { transform: `translateY(${décalage}px)`, transition: 'transform .18s ease' }
  }

  return { conteneurRef, poignée, style, enCours: !!glisse }
}

function Poignée({ T, props, libellé }) {
  return (
    <span
      {...props}
      role="button"
      aria-label={libellé}
      title="Glisser pour déplacer"
      style={{
        cursor: 'grab', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', color: T.textMuted,
        fontSize: '18px', lineHeight: 1, padding: '6px 4px', flexShrink: 0,
      }}
    >⠿</span>
  )
}

export default function SectionsGraphe({ T, sections, onChanger }) {
  const [édition, setÉdition] = useState(null) // { sectionId, blocId, texte, langage, nouveau }
  const [titreÉdité, setTitreÉdité] = useState(null) // { id, valeur }
  const zoneRef = useRef(null)
  const listeSections = useRéordonner((de, vers) => onChanger(s => déplacer(s, de, vers)))

  const majSection = (id, fn) => onChanger(s => s.map(x => (x.id === id ? fn(x) : x)))
  const ajouterSection = () => {
    const section = { id: uid(), titre: `Section ${sections.length + 1}`, blocs: [] }
    onChanger(s => [...s, section])
    setTitreÉdité({ id: section.id, valeur: section.titre })
  }
  const supprimerSection = section => {
    if (section.blocs.length && !window.confirm(`Supprimer la section « ${section.titre} » et ses ${section.blocs.length} bloc(s) ?`)) return
    onChanger(s => s.filter(x => x.id !== section.id))
  }
  const ajouterBloc = (sectionId, type) => {
    const bloc = { id: uid(), type, texte: '', ...(type === 'code' ? { langage: '' } : {}) }
    majSection(sectionId, s => ({ ...s, replié: false, blocs: [...s.blocs, bloc] }))
    setÉdition({ sectionId, blocId: bloc.id, texte: '', langage: '', nouveau: true })
  }
  // Valider un bloc vide le retire ; annuler un bloc qu'on vient d'ajouter aussi.
  const validerBloc = () => {
    const { sectionId, blocId, texte, langage } = édition
    if (!texte.trim()) supprimerBloc(sectionId, blocId)
    else {
      majSection(sectionId, s => ({
        ...s,
        blocs: s.blocs.map(b => (b.id === blocId ? { ...b, texte: texte.replace(/\s+$/, ''), ...(b.type === 'code' ? { langage } : {}) } : b)),
      }))
    }
    setÉdition(null)
  }
  const annulerBloc = () => {
    if (édition?.nouveau) supprimerBloc(édition.sectionId, édition.blocId)
    setÉdition(null)
  }
  const supprimerBloc = (sectionId, blocId) => majSection(sectionId, s => ({ ...s, blocs: s.blocs.filter(b => b.id !== blocId) }))
  const validerTitre = () => {
    if (!titreÉdité) return
    const titre = titreÉdité.valeur.trim()
    if (titre) majSection(titreÉdité.id, s => ({ ...s, titre }))
    setTitreÉdité(null)
  }

  const petitBouton = (couleur = T.text) => ({
    background: T.surface2, color: couleur, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '7px 11px',
    fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
  })
  const icône = {
    background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '14px', padding: '6px', borderRadius: '7px', flexShrink: 0,
  }

  return (
    <div data-sections ref={zoneRef} style={{ marginTop: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <h2 style={{ flex: 1, margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '22px', color: T.text }}>
          Sections <span style={{ fontSize: '13px', color: T.textMuted, fontStyle: 'normal', fontFamily: grotesk }}>({sections.length})</span>
        </h2>
        <button onClick={ajouterSection} style={{ ...petitBouton(), background: T.accent, color: T.accentText, border: 'none', fontWeight: 700 }}>＋ Section</button>
      </div>

      {sections.length === 0 && (
        <p style={{ margin: 0, padding: '18px', textAlign: 'center', fontSize: '13px', color: T.textMuted, border: `1px dashed ${T.border}`, borderRadius: '14px', lineHeight: 1.6 }}>
          Ajoute des sections sous le graphe pour y garder du texte (en <strong>gras</strong>, en couleur) et des blocs de code.
        </p>
      )}

      <div ref={listeSections.conteneurRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sections.map((section, i) => (
          <div key={section.id} data-element style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '10px 12px 12px',
            ...listeSections.style(i),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Poignée T={T} props={listeSections.poignée(i)} libellé={`Déplacer la section ${section.titre}`} />
              <button onClick={() => majSection(section.id, s => ({ ...s, replié: !s.replié }))} aria-label={section.replié ? 'Déplier la section' : 'Replier la section'}
                style={{ ...icône, fontSize: '12px', transform: section.replié ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}>▼</button>
              {titreÉdité?.id === section.id ? (
                <input
                  autoFocus
                  value={titreÉdité.valeur}
                  onChange={e => setTitreÉdité({ id: section.id, valeur: e.target.value })}
                  onBlur={validerTitre}
                  onKeyDown={e => { if (e.key === 'Enter') validerTitre(); if (e.key === 'Escape') setTitreÉdité(null) }}
                  onFocus={e => e.target.select()}
                  aria-label="Titre de la section"
                  style={{ flex: 1, minWidth: 0, fontSize: '16px', fontWeight: 700, color: T.text, background: T.bg, border: `1px solid ${T.accent}`, borderRadius: '8px', padding: '6px 8px', fontFamily: grotesk }}
                />
              ) : (
                <h3 onClick={() => setTitreÉdité({ id: section.id, valeur: section.titre })} title="Toucher pour renommer"
                  style={{ flex: 1, minWidth: 0, margin: 0, fontSize: '16px', fontWeight: 700, color: T.text, fontFamily: grotesk, cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {section.titre}
                  <span style={{ marginLeft: '8px', fontSize: '11.5px', fontWeight: 500, color: T.textMuted }}>{section.blocs.length} bloc{section.blocs.length > 1 ? 's' : ''}</span>
                </h3>
              )}
              <button onClick={() => supprimerSection(section)} aria-label={`Supprimer la section ${section.titre}`} title="Supprimer la section" style={{ ...icône, color: T.danger }}>🗑️</button>
            </div>

            {!section.replié && (
              <BlocsSection
                T={T}
                section={section}
                édition={édition?.sectionId === section.id ? édition : null}
                setÉdition={setÉdition}
                validerBloc={validerBloc}
                annulerBloc={annulerBloc}
                supprimerBloc={supprimerBloc}
                déplacerBloc={(de, vers) => majSection(section.id, s => ({ ...s, blocs: déplacer(s.blocs, de, vers) }))}
                ajouterBloc={ajouterBloc}
                petitBouton={petitBouton}
                icône={icône}
              />
            )}
          </div>
        ))}
      </div>
      {sections.length > 0 && (
        <button onClick={ajouterSection} style={{ ...petitBouton(T.textMuted), width: '100%', marginTop: '12px', padding: '11px', borderStyle: 'dashed', background: 'transparent' }}>
          ＋ Ajouter une section en dessous
        </button>
      )}
    </div>
  )
}

function BlocsSection({ T, section, édition, setÉdition, validerBloc, annulerBloc, supprimerBloc, déplacerBloc, ajouterBloc, petitBouton, icône }) {
  const liste = useRéordonner(déplacerBloc)
  return (
    <>
      <div ref={liste.conteneurRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: section.blocs.length ? '8px' : 0 }}>
        {section.blocs.map((bloc, i) => (
          <div key={bloc.id} data-element style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', background: T.surface, borderRadius: '10px', ...liste.style(i) }}>
            <Poignée T={T} props={liste.poignée(i)} libellé="Déplacer le bloc" />
            <div style={{ flex: 1, minWidth: 0 }}>
              {édition?.blocId === bloc.id ? (
                <ÉditeurBloc T={T} bloc={bloc} édition={édition} setÉdition={setÉdition} valider={validerBloc} annuler={() => annulerBloc()} petitBouton={petitBouton} />
              ) : bloc.type === 'code' ? (
                <div>
                  {bloc.langage && <p style={{ margin: '0 0 4px', fontSize: '10.5px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>{bloc.langage}</p>}
                  <CodeBlock code={bloc.texte} />
                </div>
              ) : (
                <div style={{ fontSize: '14.5px', lineHeight: 1.6, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '4px 2px' }}>
                  <TexteFormaté texte={bloc.texte} couleurDéfaut={T.text} />
                </div>
              )}
            </div>
            {édition?.blocId !== bloc.id && (
              <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <button onClick={() => setÉdition({ sectionId: section.id, blocId: bloc.id, texte: bloc.texte, langage: bloc.langage || '', nouveau: false })} aria-label="Modifier le bloc" title="Modifier" style={icône}>✏️</button>
                <button onClick={() => supprimerBloc(section.id, bloc.id)} aria-label="Supprimer le bloc" title="Supprimer" style={icône}>🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => ajouterBloc(section.id, 'texte')} style={petitBouton()}>＋ Texte</button>
        <button onClick={() => ajouterBloc(section.id, 'code')} style={petitBouton()}>＋ <span style={{ fontFamily: POLICE_CODE }}>&lt;/&gt;</span> Code</button>
      </div>
    </>
  )
}

function ÉditeurBloc({ T, bloc, édition, setÉdition, valider, annuler, petitBouton }) {
  const champ = useRef(null)
  const code = bloc.type === 'code'
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
      <textarea
        ref={champ}
        autoFocus
        value={édition.texte}
        onChange={e => setÉdition(é => ({ ...é, texte: e.target.value }))}
        onKeyDown={surTouche}
        placeholder={code ? 'Colle ou écris ton code…' : 'Écris ton texte… sélectionne un passage puis B pour le mettre en gras'}
        aria-label={code ? 'Code du bloc' : 'Texte du bloc'}
        rows={code ? 8 : 4}
        spellCheck={!code}
        autoCapitalize={code ? 'off' : undefined}
        autoCorrect={code ? 'off' : undefined}
        style={{
          width: '100%', boxSizing: 'border-box', borderRadius: '10px', padding: '10px', resize: 'vertical', lineHeight: 1.55,
          border: `1px solid ${T.accent}`,
          ...(code
            ? { background: '#0d0f14', color: '#e2e8f0', fontFamily: POLICE_CODE, fontSize: '13px', whiteSpace: 'pre', overflowX: 'auto' }
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
