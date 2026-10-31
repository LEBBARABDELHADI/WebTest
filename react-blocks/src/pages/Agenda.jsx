import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { useDonnéesFoyer, ajouterRapidement } from '../lib/donneesFoyer'
import { analyserAujourdhui } from '../lib/aujourdhui'
import { prévue, faite, actives, aujourdhuiLocal, décaler, dateDe, iso } from '../lib/habitudes'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const COULEUR = { tâche: '#f0a839', retard: '#e2574c', planifiée: '#5b8dc9', habitude: '#4a9d94', livraison: '#22a55e', quotidienne: '#8b7ab8' }

// Tout ce qui a une date dans le foyer (perso + pro) : échéances, dates de
// livraison et tâches planifiées du Programme, tâches quotidiennes du jour,
// révisions de Mémoriser, habitudes du jour.
function construireIndex(lire, foyer, auj) {
  const parJour = new Map()
  const ajouter = (jour, e) => { if (!parJour.has(jour)) parJour.set(jour, []); parJour.get(jour).push(e) }
  ;['perso', 'pro'].forEach(type => {
    const espace = `${foyer.préfixe}${type}`
    const étiquette = type === 'pro' ? 'Pro' : 'Perso'
    const t = lire('taches', espace)
    const { colonneTerminée } = analyserAujourdhui(t, auj)
    ;(t.cartes || []).filter(c => !c.archivé && c.échéance).forEach(c => {
      const finie = c.fait || c.colonneId === colonneTerminée?.id
      const e = { type: 'tâche', espace: étiquette, titre: c.texte.split('\n')[0], fait: finie, retard: !finie && c.échéance < auj, lien: `/taches/${espace}?carte=${c.id}` }
      ajouter(c.échéance, e)
      // Une tâche en retard réapparaît aussi aujourd'hui.
      if (e.retard) ajouter(auj, { ...e, détail: `prévue le ${dateDe(c.échéance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` })
    })
    ;(t.cartes || []).filter(c => !c.archivé && c.livraison).forEach(c => {
      const finie = c.fait || c.colonneId === colonneTerminée?.id
      ajouter(c.livraison, { type: 'livraison', espace: étiquette, titre: `📦 ${c.texte.split('\n')[0]}`, fait: finie, lien: `/taches/${espace}?carte=${c.id}` })
    })
    // Une tâche récurrente se valide jour par jour (case des « Tâches
    // quotidiennes ») : faite ce jour-là si ce jour est dans ses validations.
    const faiteLe = (c, jour) => (c?.récurrence ? (c.validées || []).includes(jour) : !!c?.fait || c?.colonneId === colonneTerminée?.id)
    const quotidiennesDuJour = new Set()
    ;(t.timeline || []).forEach(ev => {
      const c = (t.cartes || []).find(x => x.id === ev.carteId)
      if (c?.archivé) return
      if (c?.récurrence && ev.date === auj) quotidiennesDuJour.add(c.id)
      ajouter(ev.date, { type: c?.récurrence ? 'quotidienne' : 'planifiée', espace: étiquette, titre: ev.texte || c?.texte || 'Tâche', fait: faiteLe(c, ev.date), lien: `/taches/${espace}${ev.carteId ? `?carte=${ev.carteId}` : ''}` })
    })
    // Tâches quotidiennes (et hebdomadaires du jour) pas encore recopiées
    // dans la timeline : elles comptent aussi pour aujourd'hui.
    const jourSemaine = dateDe(auj).getDay()
    ;(t.cartes || []).filter(c => !c.archivé && !quotidiennesDuJour.has(c.id)
      && (c.récurrence === 'quotidienne' || (c.récurrence === 'hebdomadaire' && c.récurrenceJour === jourSemaine))).forEach(c => {
      ajouter(auj, { type: 'quotidienne', espace: étiquette, titre: c.texte.split('\n')[0], fait: faiteLe(c, auj), lien: `/taches/${espace}?carte=${c.id}` })
    })
    const m = lire('memoriser', espace)
    const révisions = new Map()
    ;(m.cartes || []).forEach(c => {
      const jour = !c.prochaineRevision || c.prochaineRevision < auj ? auj : c.prochaineRevision
      const k = `${jour}|${c.paquetId}`
      const r = révisions.get(k) || { jour, paquet: (m.paquets || []).find(p => p.id === c.paquetId), n: 0, retard: 0 }
      r.n += 1
      if (c.prochaineRevision && c.prochaineRevision < auj) r.retard += 1
      révisions.set(k, r)
    })
    révisions.forEach(r => ajouter(r.jour, {
      type: 'révision', espace: étiquette, couleur: r.paquet?.couleur, lien: `/memoriser/${espace}`,
      titre: `${r.paquet?.nom || 'Cartes'} · ${r.n} à réviser`, détail: r.retard ? `dont ${r.retard} en retard` : '',
    }))
  })
  return parJour
}

function habitudesDuJour(lire, foyer, jour) {
  return ['perso', 'pro'].flatMap(type => {
    const espace = `${foyer.préfixe}${type}`
    const d = lire('habitudes', espace)
    return actives(d).filter(h => prévue(h, jour)).map(h => ({
      type: 'habitude', espace: type === 'pro' ? 'Pro' : 'Perso', titre: `${h.emoji || ''} ${h.nom}`, fait: faite(d.coches, h, jour), lien: `/habitudes/${espace}`, couleur: h.couleur,
    }))
  })
}

const lundiDe = jour => { const d = dateDe(jour); return décaler(jour, -((d.getDay() + 6) % 7)) }

export default function Agenda() {
  const { espace } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espace)]
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const naviguer = useNavigate()
  const { lire, remplacer } = useDonnéesFoyer(foyer)
  const auj = aujourdhuiLocal()
  const [vue, setVue] = useState(() => (window.innerWidth < 700 ? 'semaine' : 'mois'))
  const [repère, setRepère] = useState(auj) // un jour du mois / de la semaine affichés
  const [jourChoisi, setJourChoisi] = useState(auj)
  const [filtres, setFiltres] = useState({ Perso: true, Pro: true, tâches: true, révisions: true, habitudes: true })
  const index = construireIndex(lire, foyer, auj)
  const garder = e => filtres[e.espace] && (e.type === 'révision' ? filtres.révisions : e.type === 'habitude' ? filtres.habitudes : filtres.tâches)
  // Les habitudes ne s'affichent que jusqu'à aujourd'hui (pas de futur encombré).
  const événements = jour => [...(index.get(jour) || []), ...(filtres.habitudes && jour <= auj ? habitudesDuJour(lire, foyer, jour) : [])].filter(garder)

  const dRepère = dateDe(repère)
  const premierDuMois = iso(new Date(dRepère.getFullYear(), dRepère.getMonth(), 1))
  const début = vue === 'mois' ? lundiDe(premierDuMois) : lundiDe(repère)
  const nbJours = vue === 'mois' ? 42 : 7
  const jours = Array.from({ length: nbJours }, (_, i) => décaler(début, i))
  const titre = vue === 'mois'
    ? dRepère.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : `Semaine du ${dateDe(début).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
  const avancer = sens => {
    if (vue === 'mois') setRepère(iso(new Date(dRepère.getFullYear(), dRepère.getMonth() + sens, 1)))
    else setRepère(décaler(repère, 7 * sens))
  }
  const puce = actif => ({
    padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: grotesk, cursor: 'pointer',
    background: actif ? `${T.accent}26` : 'transparent', color: actif ? T.text : T.textMuted, border: `1px solid ${actif ? T.accent : T.border}`,
  })

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.textMuted, fontSize: '13px', fontFamily: grotesk }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
        <p style={{ fontFamily: grotesk, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent, margin: '0 0 4px', fontWeight: 600 }}>{foyer.nom} · Agenda</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <h1 style={{ flex: 1, minWidth: '200px', fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '30px', color: T.text, margin: 0, lineHeight: 1.1, textTransform: 'capitalize' }}>{titre}</h1>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => avancer(-1)} aria-label="Précédent" style={puce(false)}>‹</button>
            <button onClick={() => { setRepère(auj); setJourChoisi(auj) }} style={puce(false)}>Aujourd'hui</button>
            <button onClick={() => avancer(1)} aria-label="Suivant" style={puce(false)}>›</button>
          </div>
          <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '3px' }}>
            {[['mois', 'Mois'], ['semaine', 'Semaine']].map(([id, nom]) => (
              <button key={id} onClick={() => setVue(id)} aria-pressed={vue === id} style={{
                fontSize: '12px', fontFamily: grotesk, fontWeight: 600, padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: vue === id ? T.accent : 'transparent', color: vue === id ? T.accentText : T.textMuted,
              }}>{nom}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {Object.keys(filtres).map(k => (
            <button key={k} onClick={() => setFiltres(f => ({ ...f, [k]: !f[k] }))} aria-pressed={filtres[k]} style={puce(filtres[k])}>
              {{ tâches: '✔︎ Tâches', révisions: '🧠 Révisions', habitudes: '🔥 Habitudes' }[k] || k}
            </button>
          ))}
        </div>

        {vue === 'mois' ? (
          <div className="agenda-mois" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', marginBottom: '16px' }}>
            <style>{`@media (max-width: 640px) { .agenda-mois .libelles { display: none !important } .agenda-mois > button { min-height: 54px !important } } @media (min-width: 641px) { .agenda-mois .points { display: none !important } }`}</style>
            {JOURS.map(j => <div key={j} style={{ fontSize: '11px', color: T.textMuted, textAlign: 'center', fontFamily: grotesk, fontWeight: 700, padding: '2px 0' }}>{j}</div>)}
            {jours.map(jour => {
              const evs = événements(jour)
              const horsMois = dateDe(jour).getMonth() !== dRepère.getMonth()
              const choisi = jour === jourChoisi
              return (
                <button key={jour} onClick={() => setJourChoisi(jour)} aria-pressed={choisi} aria-label={`${dateDe(jour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} : ${evs.length} élément(s)`}
                  style={{
                    minHeight: '86px', textAlign: 'left', padding: '5px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0,
                    background: choisi ? `${T.accent}22` : T.surface, border: `1.5px solid ${choisi ? T.accent : jour === auj ? T.text : T.border}`, opacity: horsMois ? 0.45 : 1, fontFamily: 'inherit',
                  }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: jour === auj ? T.accent : T.text, fontFamily: grotesk }}>{dateDe(jour).getDate()}</span>
                  <span className="libelles" style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    {evs.filter(e => e.type !== 'habitude').slice(0, 3).map((e, i) => (
                      <span key={i} style={{ fontSize: '10.5px', lineHeight: 1.25, padding: '1px 5px', borderRadius: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        background: `${e.retard ? COULEUR.retard : e.couleur || COULEUR[e.type] || T.accent}26`, color: T.text, textDecoration: e.fait ? 'line-through' : 'none' }}>{e.titre}</span>
                    ))}
                    {evs.filter(e => e.type !== 'habitude').length > 3 && <span style={{ fontSize: '10px', color: T.textMuted }}>+{evs.filter(e => e.type !== 'habitude').length - 3}</span>}
                    {evs.some(e => e.type === 'habitude') && <span style={{ fontSize: '10px', color: COULEUR.habitude }}>🔥 {evs.filter(e => e.type === 'habitude' && e.fait).length}/{evs.filter(e => e.type === 'habitude').length}</span>}
                  </span>
                  <span className="points" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                    {evs.slice(0, 6).map((e, i) => <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: e.retard ? COULEUR.retard : e.couleur || COULEUR[e.type] || T.accent, opacity: e.fait ? 0.4 : 1 }} />)}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}

        {(vue === 'mois' ? [jourChoisi] : jours).map(jour => (
          <JourDétail key={jour} T={T} jour={jour} auj={auj} évènements={événements(jour)} foyer={foyer} naviguer={naviguer}
            onAjouté={(outil, esp, données) => remplacer(outil, esp, données)} />
        ))}
      </div>
    </div>
  )
}

function JourDétail({ T, jour, auj, évènements, foyer, naviguer, onAjouté }) {
  const [texte, setTexte] = useState('')
  const [espace, setEspace] = useState(`${foyer.préfixe}perso`)
  const [message, setMessage] = useState('')
  const ajouter = async e => {
    e.preventDefault()
    if (!texte.trim()) return
    const [a, m, j] = jour.split('-')
    try {
      const r = await ajouterRapidement({ type: 'tâche', espace, saisie: `${texte} le ${j}/${m}/${a}` })
      onAjouté(r.outil, espace, r.données)
      setTexte('')
      setMessage('✓ Ajoutée')
      setTimeout(() => setMessage(''), 2000)
    } catch (err) { setMessage(err.message) }
  }
  const groupes = [['tâches', évènements.filter(e => ['tâche', 'planifiée', 'livraison', 'quotidienne'].includes(e.type))], ['révisions', évènements.filter(e => e.type === 'révision')], ['habitudes', évènements.filter(e => e.type === 'habitude')]]
  return (
    <section style={{ background: T.surface, border: `1px solid ${jour === auj ? T.accent : T.border}`, borderRadius: '14px', padding: '12px 14px', marginBottom: '10px' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: '15px', fontFamily: grotesk, color: jour === auj ? T.accent : T.text, textTransform: 'capitalize' }}>
        {dateDe(jour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}{jour === auj ? ' · aujourd\'hui' : ''}
      </h2>
      {évènements.length === 0 && <p style={{ margin: '0 0 8px', fontSize: '13px', color: T.textMuted }}>Rien de prévu.</p>}
      {groupes.filter(([, l]) => l.length).map(([nom, liste]) => (
        <div key={nom} style={{ marginBottom: '8px' }}>
          {liste.map((e, i) => (
            <button key={i} onClick={() => naviguer(e.lien)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 6px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: T.text,
            }}>
              <span style={{ width: '9px', height: '9px', borderRadius: e.type === 'habitude' ? '50%' : '3px', flexShrink: 0, background: e.retard ? COULEUR.retard : e.couleur || COULEUR[e.type] || T.accent, opacity: e.fait ? 0.4 : 1 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: '14px', textDecoration: e.fait ? 'line-through' : 'none', color: e.fait ? T.textMuted : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.type === 'habitude' ? (e.fait ? '✓ ' : '○ ') : ''}{e.titre}
                {e.détail && <span style={{ color: T.textMuted, fontSize: '12px' }}> · {e.détail}</span>}
              </span>
              <span style={{ fontSize: '11px', color: e.retard ? COULEUR.retard : T.textMuted, fontFamily: grotesk, flexShrink: 0 }}>
                {e.retard ? 'en retard · ' : e.type === 'planifiée' ? 'planifiée · ' : e.type === 'livraison' ? 'livraison · ' : e.type === 'quotidienne' ? 'chaque jour · ' : ''}{e.espace}
              </span>
            </button>
          ))}
        </div>
      ))}
      <form onSubmit={ajouter} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input value={texte} onChange={e => setTexte(e.target.value)} placeholder="＋ Tâche pour ce jour…" aria-label={`Ajouter une tâche le ${jour}`}
          style={{ flex: 1, minWidth: 0, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '8px 10px', fontSize: '14px' }} />
        <select value={espace} onChange={e => setEspace(e.target.value)} aria-label="Espace" style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '7px 6px', fontSize: '12.5px' }}>
          <option value={`${foyer.préfixe}perso`}>Perso</option>
          <option value={`${foyer.préfixe}pro`}>Pro</option>
        </select>
        {texte.trim() && <button type="submit" style={{ background: T.accent, color: T.accentText, border: 'none', borderRadius: '9px', padding: '8px 12px', fontWeight: 700, fontFamily: grotesk, cursor: 'pointer' }}>Ajouter</button>}
      </form>
      {message && <p style={{ margin: '6px 0 0', fontSize: '12px', color: message.startsWith('✓') ? '#4a9d94' : T.danger }}>{message}</p>}
    </section>
  )
}
