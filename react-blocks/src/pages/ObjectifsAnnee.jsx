import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import PanneauSync from '../components/PanneauSync'
import { BoutonIcone } from '../components/UI'
import EnTetePilotage, { Barre } from '../components/EnTetePilotage'
import { stylesPilotage } from '../lib/stylesPilotage'
import { grotesk, serif, useTheme } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { useDonnéesFoyer } from '../lib/donneesFoyer'
import { aujourdhuiLocal } from '../lib/habitudes'
import {
  usePilotage, uid, avancement, rythme, partÉcoulée, trimestreDe, MODÈLES, depuisModèle, SOURCES,
  TYPES_ÉCHÉANCE, prochainesÉchéances, compte, urgence, dateCourte,
} from '../lib/pilotage'

const NOMS_T = ['', 'Janv. – mars', 'Avril – juin', 'Juil. – sept.', 'Oct. – déc.']
const EMOJIS = ['🎯', '☁️', '🇫🇷', '🏃', '📚', '☸️', '💼', '💶', '🏠', '❤️', '🗣️', '🧘', '✈️', '🎓']

export default function ObjectifsAnnee() {
  const { espace } = useParams()
  const { hash } = useLocation()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const S = stylesPilotage(T)
  const { lire } = useDonnéesFoyer(foyer)
  const { data: pilotage, setData: setPilotage, token, statut, erreur, connecter, déconnecter } = usePilotage(foyer)
  const auj = aujourdhuiLocal()
  const [année, setAnnée] = useState(Number(auj.slice(0, 4)))
  const [ajout, setAjout] = useState(false)
  const [édition, setÉdition] = useState(null)
  const lireLectures = e => lire('lectures', e)
  const espaces = ['perso', 'pro'].map(t => ({ espace: `${foyer.préfixe}${t}`, nom: t === 'pro' ? 'Pro' : 'Perso' }))
  useEffect(() => { if (hash === '#dates') setTimeout(() => document.getElementById('dates')?.scrollIntoView({ block: 'start' }), 150) }, [hash])

  const objectifs = pilotage.objectifs.filter(o => o.année === année)
  const modifierObjectif = (id, fn) => setPilotage(d => ({ ...d, objectifs: d.objectifs.map(o => (o.id === id ? { ...o, ...(typeof fn === 'function' ? fn(o) : fn) } : o)) }))
  const avancements = objectifs.map(o => avancement(o, lire, lireLectures))
  const moyenne = avancements.length ? avancements.reduce((n, a) => n + a.taux, 0) / avancements.length : 0
  const écoulée = partÉcoulée(année, auj)
  const trimestre = Number(auj.slice(0, 4)) === année ? trimestreDe(auj) : null

  // Source préremplie depuis ce qui existe déjà dans les autres outils.
  const sourceDevinée = m => {
    const s = { ...m.source }
    if (s.type === 'examen') {
      const trouvé = espaces.flatMap(({ espace: e }) => (lire('memoriser', e).objectifs || []).map(o => ({ ...o, e }))).find(o => o.préset === 'aws-cloudops' || /aws|cloudops|soa/i.test(o.nom))
      return trouvé ? { type: 'examen', espace: trouvé.e, id: trouvé.id } : { type: 'étapes' }
    }
    if (s.type === 'habitude') {
      const trouvé = espaces.flatMap(({ espace: e }) => (lire('habitudes', e).habitudes || []).filter(h => !h.archivée).map(h => ({ ...h, e }))).find(h => /sport|course|courir|gym|muscu|vélo|marche|natation|footing/i.test(h.nom))
      return trouvé ? { type: 'habitude', espace: trouvé.e, id: trouvé.id, cible: s.cible } : { type: 'étapes' }
    }
    if (s.type === 'lectures') return { ...s, espace: espaces[0].espace }
    return s
  }
  const ajouterObjectif = m => {
    const o = m ? { ...depuisModèle(m, année), source: sourceDevinée(m) } : { id: uid(), année, emoji: '🎯', titre: 'Nouvel objectif', pourquoi: '', source: { type: 'étapes' }, étapes: [] }
    setPilotage(d => ({ ...d, objectifs: [...d.objectifs, o] }))
    setAjout(false)
    if (!m) setÉdition(o.id)
  }

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <EnTetePilotage T={T} foyer={foyer} actif="annee" titre="🎯 Mes objectifs de l'année" sousTitre="3 à 5 grands objectifs, découpés en étapes par trimestre. L'avancement vient de tes autres outils." />
        <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`pilotage-${foyer.id}.json`} marginBottom="12px" />

        <div style={{ ...S.carte, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setAnnée(a => a - 1)} aria-label="Année précédente" style={{ ...S.bouton(false), width: 40, padding: 0 }}>‹</button>
            <strong style={{ fontFamily: serif, fontSize: 30, minWidth: 80, textAlign: 'center' }}>{année}</strong>
            <button onClick={() => setAnnée(a => a + 1)} aria-label="Année suivante" style={{ ...S.bouton(false), width: 40, padding: 0 }}>›</button>
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px 10px', fontSize: 13.5, marginBottom: 4 }}>
              <span style={{ whiteSpace: 'nowrap' }}>{objectifs.length ? `Avancement moyen : ${Math.round(moyenne * 100)} %` : 'Aucun objectif pour cette année'}</span>
              <span style={{ color: T.textMuted, whiteSpace: 'nowrap' }}>{Math.round(écoulée * 100)} % de l'année passée</span>
            </div>
            <Barre T={T} taux={moyenne} repère={écoulée} nom="Avancement moyen" hauteur={10} />
          </div>
        </div>

        {objectifs.length === 0 && !ajout && (
          <div style={{ ...S.carte, textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ fontSize: 36, margin: '0 0 8px' }}>🎯</p>
            <p style={{ ...S.discret, marginBottom: 14 }}>Choisis 3 à 5 objectifs qui comptent vraiment cette année.</p>
            <button onClick={() => setAjout(true)} style={S.bouton(true)}>＋ Choisir mes objectifs</button>
          </div>
        )}

        {objectifs.map((o, i) => (
          <CarteObjectif key={o.id} T={T} S={S} o={o} a={avancements[i]} trimestre={trimestre} auj={auj} lire={lire} espaces={espaces}
            enÉdition={édition === o.id} onÉditer={() => setÉdition(e => (e === o.id ? null : o.id))}
            onModifier={fn => modifierObjectif(o.id, fn)}
            onSupprimer={() => { if (window.confirm(`Supprimer l'objectif « ${o.titre} » ?`)) setPilotage(d => ({ ...d, objectifs: d.objectifs.filter(x => x.id !== o.id) })) }} />
        ))}

        {objectifs.length > 0 && !ajout && (
          <button onClick={() => setAjout(true)} style={{ ...S.bouton(objectifs.length < 3), width: '100%', minHeight: 48, marginBottom: 14 }}>＋ Ajouter un objectif{objectifs.length >= 5 ? ' (tu en as déjà 5 : garde l\'essentiel)' : ''}</button>
        )}
        {ajout && (
          <section style={{ ...S.carte, borderColor: T.accent }} aria-labelledby="t-modeles">
            <h2 id="t-modeles" style={S.titre}>Choisis un modèle (tu pourras tout modifier) <button onClick={() => setAjout(false)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 13 }}>Fermer</button></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 8 }}>
              {MODÈLES.map(m => {
                const déjà = objectifs.some(o => o.titre === m.titre)
                return (
                  <button key={m.id} onClick={() => ajouterObjectif(m)} disabled={déjà} style={{ textAlign: 'left', padding: 12, borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, cursor: déjà ? 'default' : 'pointer', opacity: déjà ? 0.5 : 1 }}>
                    <span style={{ fontSize: 22 }}>{m.emoji}</span>
                    <strong style={{ display: 'block', fontSize: 14.5, margin: '4px 0 2px' }}>{m.titre}</strong>
                    <span style={{ fontSize: 12.5, color: T.textMuted }}>{déjà ? 'Déjà ajouté' : `${m.étapes.length} étapes · ${SOURCES[m.source.type]}`}</span>
                  </button>
                )
              })}
              <button onClick={() => ajouterObjectif(null)} style={{ textAlign: 'left', padding: 12, borderRadius: 12, border: `1px dashed ${T.accent}`, background: T.bg, color: T.text, cursor: 'pointer' }}>
                <span style={{ fontSize: 22 }}>✍️</span>
                <strong style={{ display: 'block', fontSize: 14.5, margin: '4px 0 2px' }}>Objectif personnalisé</strong>
                <span style={{ fontSize: 12.5, color: T.textMuted }}>Partir d'une page blanche</span>
              </button>
            </div>
          </section>
        )}

        <DatesImportantes T={T} S={S} pilotage={pilotage} setPilotage={setPilotage} lire={lire} foyer={foyer} auj={auj} />
      </div>
    </div>
  )
}

function CarteObjectif({ T, S, o, a, trimestre, auj, lire, espaces, enÉdition, onÉditer, onModifier, onSupprimer }) {
  const r = rythme(a.taux, o.année, auj)
  const étapes = o.étapes || []
  const basculer = id => onModifier(x => ({ étapes: (x.étapes || []).map(s => (s.id === id ? { ...s, fait: !s.fait, faitLe: s.fait ? undefined : auj } : s)) }))
  const ajouterÉtape = (q, texte) => onModifier(x => ({ étapes: [...(x.étapes || []), { id: uid(), trimestre: q, texte, fait: false }] }))
  const retirerÉtape = id => onModifier(x => ({ étapes: (x.étapes || []).filter(s => s.id !== id) }))
  const s = o.source || { type: 'étapes' }
  return (
    <article style={{ ...S.carte, padding: 0, overflow: 'hidden' }} aria-label={o.titre}>
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 30, lineHeight: 1 }} aria-hidden="true">{o.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: grotesk, fontSize: 17.5, lineHeight: 1.3 }}>{o.titre}</h2>
            {o.pourquoi && <p style={{ ...S.discret, fontSize: 13 }}>Pourquoi : {o.pourquoi}</p>}
          </div>
          <BoutonIcone icon="crayon" title="Modifier l'objectif" taille={15} onClick={onÉditer} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 10px', margin: '12px 0 6px' }}>
          <strong style={{ fontFamily: serif, fontSize: 30, lineHeight: 1, whiteSpace: 'nowrap' }}>{Math.round(a.taux * 100)} %</strong>
          <span style={{ color: r.couleur, fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}>{r.nom}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: T.textMuted, textAlign: 'right' }}>
            {a.lien ? <Link to={a.lien} style={{ color: T.textMuted }}>{a.texte} ↗</Link> : a.texte}
          </span>
        </div>
        <Barre T={T} taux={a.taux} couleur={r.couleur} repère={r.attendu} nom={`Avancement de ${o.titre}`} hauteur={10} />
        {a.manquant && <p style={{ ...S.discret, color: T.danger, fontSize: 12.5, marginTop: 6 }}>⚠️ {a.manquant} : avancement calculé sur les étapes. Modifie la source.</p>}
        {s.type === 'compteur' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <button onClick={() => onModifier(x => ({ source: { ...x.source, valeur: Math.max(0, (Number(x.source.valeur) || 0) - 1) } }))} aria-label="Retirer 1" style={{ ...S.bouton(false), width: 40, padding: 0 }}>−</button>
            <input type="number" value={s.valeur ?? 0} onChange={e => onModifier(x => ({ source: { ...x.source, valeur: Number(e.target.value) } }))} aria-label="Valeur actuelle" style={{ ...S.champ, width: 100, textAlign: 'center' }} />
            <button onClick={() => onModifier(x => ({ source: { ...x.source, valeur: (Number(x.source.valeur) || 0) + 1 } }))} aria-label="Ajouter 1" style={{ ...S.bouton(false), width: 40, padding: 0 }}>＋</button>
            <span style={S.discret}>/ {s.cible} {s.unité || ''}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', borderTop: `1px solid ${T.border}` }}>
        {[1, 2, 3, 4].map(q => {
          const liste = étapes.filter(x => x.trimestre === q)
          const actuel = q === trimestre
          return (
            <div key={q} style={{ padding: '10px 12px 12px', borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: actuel ? `${T.accent}12` : 'transparent' }}>
              <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800, fontSize: 12.5, color: actuel ? T.accent : T.textMuted }}>T{q} · {NOMS_T[q]}{actuel ? ' · maintenant' : ''}</p>
              {liste.map(é => (
                <div key={é.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
                  <input type="checkbox" checked={!!é.fait} onChange={() => basculer(é.id)} aria-label={é.texte} style={{ width: 19, height: 19, marginTop: 1, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.35, textDecoration: é.fait ? 'line-through' : 'none', color: é.fait ? T.textMuted : T.text }}>{é.texte}</span>
                  {enÉdition && <button onClick={() => retirerÉtape(é.id)} aria-label={`Retirer ${é.texte}`} style={{ border: 'none', background: 'transparent', color: T.textMuted, cursor: 'pointer' }}>×</button>}
                </div>
              ))}
              {liste.length === 0 && !enÉdition && <p style={{ ...S.discret, fontSize: 12.5 }}>—</p>}
              {enÉdition && <AjoutÉtape S={S} q={q} onAjouter={t => ajouterÉtape(q, t)} />}
            </div>
          )
        })}
      </div>

      {enÉdition && <EditeurObjectif T={T} S={S} o={o} lire={lire} espaces={espaces} onModifier={onModifier} onSupprimer={onSupprimer} onFermer={onÉditer} />}
    </article>
  )
}

function AjoutÉtape({ S, q, onAjouter }) {
  const [t, setT] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); if (t.trim()) { onAjouter(t.trim()); setT('') } }} style={{ display: 'flex', gap: 4, marginTop: 6 }}>
      <input value={t} onChange={e => setT(e.target.value)} placeholder="＋ Étape" aria-label={`Nouvelle étape du trimestre ${q}`} style={{ ...S.champ, minHeight: 36, fontSize: 14, padding: '6px 10px' }} />
    </form>
  )
}

function EditeurObjectif({ T, S, o, lire, espaces, onModifier, onSupprimer, onFermer }) {
  const s = o.source || { type: 'étapes' }
  const choix = { examen: [], paquet: [], habitude: [], étiquette: [] }
  espaces.forEach(({ espace: e, nom }) => {
    const m = lire('memoriser', e)
    ;(m.objectifs || []).forEach(x => choix.examen.push({ espace: e, id: x.id, nom: `${x.nom} (${nom})` }))
    ;(m.paquets || []).forEach(x => choix.paquet.push({ espace: e, id: x.id, nom: `${x.nom} (${nom})` }))
    ;(lire('habitudes', e).habitudes || []).filter(h => !h.archivée).forEach(x => choix.habitude.push({ espace: e, id: x.id, nom: `${x.emoji || ''} ${x.nom} (${nom})`.trim() }))
    ;(lire('taches', e).étiquettes || []).forEach(x => choix.étiquette.push({ espace: e, id: x.id, nom: `#${x.nom} (${nom})` }))
  })
  const setSource = champs => onModifier(x => ({ source: { ...(x.source || {}), ...champs } }))
  const liste = choix[s.type]
  return (
    <div style={{ padding: 16, background: T.bg, borderTop: `1px solid ${T.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 10 }}>
        <label style={{ fontSize: 13, color: T.textMuted }}>Titre
          <input defaultValue={o.titre} onBlur={e => e.target.value.trim() && onModifier({ titre: e.target.value.trim() })} style={{ ...S.champ, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, color: T.textMuted }}>Pourquoi c'est important
          <input defaultValue={o.pourquoi} onBlur={e => onModifier({ pourquoi: e.target.value.trim() })} placeholder="Ta motivation, en une phrase" style={{ ...S.champ, marginTop: 4 }} />
        </label>
      </div>
      <p style={{ fontSize: 13, color: T.textMuted, margin: '10px 0 4px' }}>Icône</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {EMOJIS.map(e => <button key={e} onClick={() => onModifier({ emoji: e })} aria-label={`Icône ${e}`} aria-pressed={o.emoji === e} style={{ width: 40, height: 40, fontSize: 20, borderRadius: 10, cursor: 'pointer', border: `2px solid ${o.emoji === e ? T.accent : T.border}`, background: T.surface }}>{e}</button>)}
      </div>
      <label style={{ display: 'block', fontSize: 13, color: T.textMuted, marginTop: 12 }}>D'où vient l'avancement ?
        <select value={s.type} onChange={e => onModifier({ source: { type: e.target.value, ...(e.target.value === 'compteur' ? { valeur: 0, cible: 100, unité: '' } : ['habitude', 'lectures'].includes(e.target.value) ? { cible: s.cible || 50 } : {}), ...(e.target.value === 'lectures' ? { espace: espaces[0].espace } : {}) } })} style={{ ...S.champ, marginTop: 4 }}>
          {Object.entries(SOURCES).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
        </select>
      </label>
      {liste && (
        <label style={{ display: 'block', fontSize: 13, color: T.textMuted, marginTop: 8 }}>Lequel ?
          <select value={s.id ? `${s.espace}|${s.id}` : ''} onChange={e => { const [espace, id] = e.target.value.split('|'); setSource({ espace, id }) }} style={{ ...S.champ, marginTop: 4 }}>
            <option value="">— Choisir —</option>
            {liste.map(x => <option key={`${x.espace}|${x.id}`} value={`${x.espace}|${x.id}`}>{x.nom}</option>)}
          </select>
          {liste.length === 0 && <span style={{ display: 'block', marginTop: 4 }}>Rien à choisir pour l'instant : crée-le d'abord dans l'outil.</span>}
        </label>
      )}
      {s.type === 'lectures' && (
        <label style={{ display: 'block', fontSize: 13, color: T.textMuted, marginTop: 8 }}>Liste
          <select value={s.espace} onChange={e => setSource({ espace: e.target.value })} style={{ ...S.champ, marginTop: 4 }}>
            {espaces.map(x => <option key={x.espace} value={x.espace}>À lire {x.nom.toLowerCase()}</option>)}
          </select>
        </label>
      )}
      {['habitude', 'lectures', 'compteur'].includes(s.type) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <label style={{ flex: 1, fontSize: 13, color: T.textMuted }}>Objectif (nombre)
            <input type="number" min="1" value={s.cible || ''} onChange={e => setSource({ cible: Number(e.target.value) })} style={{ ...S.champ, marginTop: 4 }} />
          </label>
          {s.type === 'compteur' && (
            <label style={{ flex: 1, fontSize: 13, color: T.textMuted }}>Unité
              <input value={s.unité || ''} onChange={e => setSource({ unité: e.target.value })} placeholder="km, kg, €…" style={{ ...S.champ, marginTop: 4 }} />
            </label>
          )}
        </div>
      )}
      <p style={{ ...S.discret, fontSize: 12.5, marginTop: 8 }}>Les étapes de chaque trimestre se modifient directement au-dessus (champ « ＋ Étape »).</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onFermer} style={S.bouton(true)}>✓ Terminé</button>
        <button onClick={onSupprimer} style={{ ...S.bouton(false), color: T.danger, borderColor: T.danger, marginLeft: 'auto' }}>Supprimer l'objectif</button>
      </div>
    </div>
  )
}

function DatesImportantes({ T, S, pilotage, setPilotage, lire, foyer, auj }) {
  const [titre, setTitre] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('document')
  const toutes = prochainesÉchéances(pilotage, lire, foyer, auj)
  const passées = pilotage.échéances.filter(e => e.date < auj).sort((a, b) => b.date.localeCompare(a.date))
  const ajouter = e => {
    e.preventDefault()
    if (!titre.trim() || !date) return
    setPilotage(d => ({ ...d, échéances: [...d.échéances, { id: uid(), titre: titre.trim(), date, type }] }))
    setTitre(''); setDate('')
  }
  const retirer = id => setPilotage(d => ({ ...d, échéances: d.échéances.filter(x => x.id !== id) }))
  return (
    <section id="dates" style={{ ...S.carte, marginTop: 20, scrollMarginTop: 16 }} aria-labelledby="t-dates">
      <h2 id="t-dates" style={S.titre}>📌 Dates à ne pas manquer</h2>
      <p style={{ ...S.discret, marginBottom: 10 }}>Passeport, titre de séjour, rendez-vous en préfecture… La plus proche s'affiche dans « Ma journée ». Les examens de Mémoriser sont ajoutés tout seuls.</p>
      {toutes.map(e => {
        const u = urgence(e.date, auj)
        const couleur = u === 'forte' ? T.danger : u === 'moyenne' ? '#c98a00' : T.textMuted
        return (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 20 }}>{TYPES_ÉCHÉANCE[e.type]?.emoji || '📌'}</span>
            <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 14.5 }}>{e.titre}</strong><span style={{ fontSize: 12.5, color: T.textMuted }}>{dateCourte(e.date)} {e.date.slice(0, 4)} · {TYPES_ÉCHÉANCE[e.type]?.nom}{e.lien ? ' · depuis Mémoriser' : ''}</span></span>
            <strong style={{ fontFamily: grotesk, color: couleur }}>{compte(e.date, auj)}</strong>
            {!e.lien && <BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} taille={14} onClick={() => retirer(e.id)} />}
          </div>
        )
      })}
      {toutes.length === 0 && <p style={S.discret}>Aucune date à venir.</p>}
      <form onSubmit={ajouter} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 6, marginTop: 12 }}>
        <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex. Fin du titre de séjour" aria-label="Intitulé de la date" style={{ ...S.champ, gridColumn: '1 / -1' }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Date" style={S.champ} />
        <select value={type} onChange={e => setType(e.target.value)} aria-label="Type de date" style={S.champ}>
          {Object.entries(TYPES_ÉCHÉANCE).map(([id, t]) => <option key={id} value={id}>{t.emoji} {t.nom}</option>)}
        </select>
        <button type="submit" disabled={!titre.trim() || !date} style={{ ...S.bouton(true), opacity: titre.trim() && date ? 1 : 0.5 }}>＋ Ajouter la date</button>
      </form>
      {passées.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: T.textMuted }}>{passées.length} date{passées.length > 1 ? 's' : ''} passée{passées.length > 1 ? 's' : ''}</summary>
          {passées.map(e => <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, color: T.textMuted, padding: '4px 0' }}><span style={{ flex: 1 }}>{TYPES_ÉCHÉANCE[e.type]?.emoji} {e.titre} · {dateCourte(e.date)}</span><BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} taille={13} onClick={() => retirer(e.id)} /></div>)}
        </details>
      )}
    </section>
  )
}
