import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notions } from '../notions'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import { TexteFormaté } from '../lib/texteFormate'
import { analyserAujourdhui } from '../lib/aujourdhui'
import { bilanJour, série, actives, aujourdhuiLocal, décaler, dateDe } from '../lib/habitudes'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { lireRécents, depuis } from '../lib/recents'
import { verrouiller } from '../components/Verrou'
import RechercheGlobale from '../components/RechercheGlobale'
import Sauvegarde from '../components/Sauvegarde'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { useDonnéesFoyer, ajouterRapidement, analyserSaisie } from '../lib/donneesFoyer'
import { rappelsActifs, activerRappels, désactiverRappels, vérifierRappels } from '../lib/rappels'

const aujourdhui = () => new Date().toISOString().slice(0, 10)

function statsTâches(d) {
  // Même définition que le bloc « Aujourd'hui » du Programme.
  const a = analyserAujourdhui(d)
  const colFini = a.colonneTerminée
  return {
    duJour: a.duJour,
    enRetard: a.enRetard.length,
    enCours: (d.cartes || []).filter(c => !c.archivé && c.colonneId !== colFini?.id).length,
  }
}
function statsMémo(d) {
  const auj = aujourdhui()
  const cartes = d.cartes || []
  return { àRéviser: cartes.filter(c => !c.prochaineRevision || c.prochaineRevision <= auj).length, cartes: cartes.length, paquets: (d.paquets || []).length }
}
function nomGrapheActif(lire, espace) {
  const graphes = lire('graph', espace).graphes || []
  const id = localStorage.getItem(`react-blocs-graph-actif-${espace}`)
  return (graphes.find(g => g.id === id) || graphes[0])?.nom
}

// Un hash stable de la date : la carte du jour change chaque jour.
function hashJour(chaîne) {
  let h = 0
  for (let i = 0; i < chaîne.length; i++) h = (h * 31 + chaîne.charCodeAt(i)) >>> 0
  return h
}
function carteDuJour(lire, foyer) {
  const toutes = ['perso', 'pro'].flatMap(type => {
    const espace = `${foyer.préfixe}${type}`
    const d = lire('memoriser', espace)
    return (d.cartes || []).map(c => ({ ...c, espace, paquet: (d.paquets || []).find(p => p.id === c.paquetId) }))
  })
  if (toutes.length === 0) return null
  return toutes[hashJour(aujourdhui()) % toutes.length]
}

function salutation(heure) {
  if (heure < 5) return 'Bonne nuit'
  if (heure < 12) return 'Bonjour'
  if (heure < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

// Libellé d'une page récente, d'après son adresse.
function libelléRécent(lire, chemin) {
  const [, outil, espace] = chemin.split('/')
  const type = espace?.endsWith('pro') ? 'Pro' : 'Perso'
  if (outil === 'taches') return { titre: `Programme ${type.toLowerCase()}`, icône: 'checklist' }
  if (outil === 'notes') return { titre: `Notes ${type.toLowerCase()}`, icône: 'note' }
  if (outil === 'memoriser') return { titre: `Mémoriser ${type.toLowerCase()}`, icône: 'cartes' }
  if (outil === 'graph') {
    const nom = nomGrapheActif(lire, espace)
    return { titre: nom ? `${nom}` : 'Graph', détail: `Graph ${type.toLowerCase()}`, icône: 'reseau' }
  }
  if (outil === 'habitudes') return { titre: `Habitudes ${type.toLowerCase()}`, icône: 'checklist' }
  if (outil === 'agenda') return { titre: 'Agenda', icône: 'calendrier' }
  if (outil === 'timer') return { titre: 'Timer', icône: 'horloge' }
  if (outil === 'notion') {
    const n = notions.find(x => x.id === espace)
    return { titre: n ? n.titre : 'Cours React', détail: 'Cours React', icône: 'livre' }
  }
  return null
}

const CLÉ_TYPE = 'react-blocs-accueil-espace'

export default function Home({ foyerId = 'lebbar' }) {
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const foyer = FOYERS[foyerId]
  const autresFoyers = Object.values(FOYERS).filter(f => f.id !== foyer.id)
  const [type, setType] = useState(() => localStorage.getItem(`${CLÉ_TYPE}-${foyerId}`) || 'perso')
  const [maintenant, setMaintenant] = useState(() => new Date())
  const [retournée, setRetournée] = useState(false)
  const [coursOuverts, setCoursOuverts] = useState(false)
  const [rechercheOuverte, setRechercheOuverte] = useState(false)
  const [sauvegardeOuverte, setSauvegardeOuverte] = useState(false)
  const [rappels, setRappels] = useState(rappelsActifs)
  const [message, setMessage] = useState(null) // { texte, erreur }
  const { lire, remplacer, rafraîchir } = useDonnéesFoyer(foyer)
  const afficher = (texte, erreur = false) => {
    setMessage({ texte, erreur })
    setTimeout(() => setMessage(m => (m?.texte === texte ? null : m)), erreur ? 6000 : 3500)
  }

  // Ctrl+K (ou « / ») ouvre la recherche globale.
  useEffect(() => {
    const surTouche = e => {
      const dansChamp = e.target.closest?.('input, textarea, select')
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !dansChamp)) {
        e.preventDefault()
        setRechercheOuverte(true)
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  const choisirType = t => {
    setType(t)
    try { localStorage.setItem(`${CLÉ_TYPE}-${foyerId}`, t) } catch { /* ignore */ }
  }

  const espace = `${foyer.préfixe}${type}`
  const tâches = statsTâches(lire('taches', espace))
  const notes = lire('notes', espace).notes || []
  const mémo = statsMémo(lire('memoriser', espace))
  const graphes = lire('graph', espace).graphes || []
  const grapheActif = nomGrapheActif(lire, espace)
  // Résumé du jour sur les deux espaces (perso + pro).
  const total = ['perso', 'pro'].reduce((acc, t) => {
    const e = `${foyer.préfixe}${t}`
    const st = statsTâches(lire('taches', e))
    return { duJour: acc.duJour + st.duJour, enRetard: acc.enRetard + st.enRetard, àRéviser: acc.àRéviser + statsMémo(lire('memoriser', e)).àRéviser }
  }, { duJour: 0, enRetard: 0, àRéviser: 0 })
  // Habitudes du jour (perso + pro) et de l'espace choisi.
  const habAujourdhui = ['perso', 'pro'].reduce((n, t) => { const b = bilanJour(lire('habitudes', `${foyer.préfixe}${t}`)); return n + b.prévues.length - b.faites.length }, 0)
  const habEspace = lire('habitudes', espace)
  const bilanHab = bilanJour(habEspace)
  const meilleureSérieEnCours = Math.max(0, ...actives(habEspace).map(h => série(h, habEspace.coches)))
  // Agenda : échéances des 7 prochains jours (perso + pro).
  const aujLocal = aujourdhuiLocal()
  const dansSemaine = ['perso', 'pro'].flatMap(t => {
    const d = lire('taches', `${foyer.préfixe}${t}`)
    const fini = analyserAujourdhui(d).colonneTerminée?.id
    return (d.cartes || []).filter(c => !c.archivé && c.colonneId !== fini && c.échéance && c.échéance >= aujLocal && c.échéance <= décaler(aujLocal, 6))
  })
    .sort((a, b) => a.échéance.localeCompare(b.échéance))
  const carte = carteDuJour(lire, foyer)
  const récents = lireRécents()
    .filter(r => {
      const e = r.chemin.split('/')[2]
      return !['taches', 'notes', 'memoriser', 'graph', 'habitudes', 'agenda'].includes(r.chemin.split('/')[1]) || foyerDeLEspace(e) === foyer.id
    })
    .map(r => ({ ...r, ...libelléRécent(lire, r.chemin) }))
    .filter(r => r.titre)
    .slice(0, 5)

  // Badge de l'icône et notification du jour (si les rappels sont activés).
  useEffect(() => { vérifierRappels(total, foyer.nom) }, [total.duJour, total.enRetard, total.àRéviser, rappels]) // eslint-disable-line react-hooks/exhaustive-deps
  const basculerRappels = async () => {
    if (rappels) { désactiverRappels(); setRappels(false); afficher('Rappels désactivés'); return }
    try {
      await activerRappels()
      setRappels(true)
      afficher('🔔 Rappels activés : une notification par jour quand il y a quelque chose à faire')
    } catch (err) { afficher(err.message, true) }
  }

  const date = maintenant.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const heure = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const résumé = []
  if (total.duJour) résumé.push(`${total.duJour} tâche${total.duJour > 1 ? 's' : ''} pour aujourd'hui`)
  if (total.enRetard) résumé.push(`${total.enRetard} en retard`)
  if (total.àRéviser) résumé.push(`${total.àRéviser} carte${total.àRéviser > 1 ? 's' : ''} à réviser`)
  if (habAujourdhui) résumé.push(`${habAujourdhui} habitude${habAujourdhui > 1 ? 's' : ''} à cocher`)

  const tuiles = [
    {
      to: `/taches/${espace}`, icône: 'checklist', titre: 'Programme',
      chiffre: tâches.duJour, unité: "pour aujourd'hui",
      détail: [tâches.enRetard ? `${tâches.enRetard} en retard` : null, `${tâches.enCours} en cours`].filter(Boolean).join(' · '),
      alerte: tâches.enRetard > 0,
    },
    {
      to: `/memoriser/${espace}`, icône: 'cartes', titre: 'Mémoriser',
      chiffre: mémo.àRéviser, unité: mémo.àRéviser ? 'à réviser' : 'à jour',
      détail: `${mémo.cartes} carte${mémo.cartes > 1 ? 's' : ''} · ${mémo.paquets} paquet${mémo.paquets > 1 ? 's' : ''}`,
    },
    {
      to: `/notes/${espace}`, icône: 'note', titre: 'Notes',
      chiffre: notes.length, unité: `note${notes.length > 1 ? 's' : ''}`,
      détail: notes[0]?.titre ? `Dernière : ${notes[0].titre}` : 'Aucune note',
    },
    {
      to: `/graph/${espace}`, icône: 'reseau', titre: 'Graph',
      chiffre: graphes.length, unité: `graphe${graphes.length > 1 ? 's' : ''}`,
      détail: grapheActif ? `Dernier : ${grapheActif}` : 'Aucun graphe',
    },
    {
      to: `/habitudes/${espace}`, icône: 'checklist', titre: 'Habitudes',
      chiffre: bilanHab.prévues.length ? `${bilanHab.faites.length}/${bilanHab.prévues.length}` : '—', unité: bilanHab.prévues.length ? "aujourd'hui" : '',
      détail: meilleureSérieEnCours ? `🔥 série de ${meilleureSérieEnCours} jour${meilleureSérieEnCours > 1 ? 's' : ''}` : actives(habEspace).length ? 'Coche tes habitudes' : 'Ajoute une habitude',
    },
    {
      to: `/agenda/${foyer.préfixe}perso`, icône: 'calendrier', titre: 'Agenda',
      chiffre: dansSemaine.length, unité: `échéance${dansSemaine.length > 1 ? 's' : ''} sur 7 j`,
      détail: dansSemaine[0] ? `${dateDe(dansSemaine[0].échéance).toLocaleDateString('fr-FR', { weekday: 'short' })} : ${dansSemaine[0].texte.split('\n')[0]}` : 'Perso et Pro réunis',
    },
    { to: '/timer', icône: 'horloge', titre: 'Timer', chiffre: heure, unité: '', détail: 'Chrono · minuteur' },
  ]

  const carteStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px' }
  const titreBloc = { margin: '0 0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted, fontFamily: grotesk }
  const niveaux = ['Débutant', 'Intermédiaire', 'Avancé']
  const couleurNiveau = { Débutant: '#4a9d94', Intermédiaire: T.accent, Avancé: T.danger }

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text }}>
      <style>{`
        .tuile { transition: border-color .15s, transform .15s, background .15s }
        .tuile:hover { border-color: ${T.accent} !important; transform: translateY(-2px) }
        .ligne-recente:hover { background: ${T.surface2} }
        .grille-outils { grid-template-columns: repeat(2, minmax(0, 1fr)) }
        @media (max-width: 560px) { .masque-tel { display: none } }
        @media (min-width: 700px) { .grille-outils { grid-template-columns: repeat(4, minmax(0, 1fr)) } }
        @media (min-width: 1050px) { .grille-outils { grid-template-columns: repeat(7, minmax(0, 1fr)) } }
        @media (prefers-reduced-motion: reduce) { .tuile, .tuile:hover { transition: none; transform: none } }
      `}</style>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'max(24px, env(safe-area-inset-top)) 16px 40px' }}>

        {/* En-tête */}
        <header style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '22px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.accent, fontFamily: grotesk }}>
              {foyer.nom} · {date}
            </p>
            <h1 style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(30px, 6vw, 42px)', lineHeight: 1.1 }}>
              {salutation(maintenant.getHours())}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: T.textMuted, lineHeight: 1.5 }}>
              {résumé.length ? `${résumé.join(', ')}.` : 'Rien d\'urgent aujourd\'hui.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button onClick={() => setRechercheOuverte(true)} title="Rechercher partout (Ctrl+K)" aria-label="Rechercher partout" style={{
              display: 'flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 12px', marginRight: '6px', borderRadius: '10px', cursor: 'pointer',
              background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted, fontFamily: grotesk, fontSize: '13px',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <span className="masque-tel">Rechercher</span>
              <kbd className="masque-tel" style={{ fontSize: '11px', border: `1px solid ${T.border}`, borderRadius: '5px', padding: '0 5px', fontFamily: grotesk }}>Ctrl K</kbd>
            </button>
            <button onClick={basculerRappels} title={rappels ? 'Désactiver les rappels' : 'Activer les rappels'} aria-pressed={rappels} aria-label="Rappels" style={{
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '7px', cursor: 'pointer',
              background: rappels ? `${T.accent}26` : 'transparent', color: rappels ? T.accent : T.textMuted,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />{!rappels && <path d="M3 3l18 18" />}</svg>
            </button>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
            <BoutonIcone icon="telecharger" title="Sauvegarde (télécharger / restaurer)" onClick={() => setSauvegardeOuverte(true)} />
            <BoutonIcone icon="cadenas" title="Verrouiller" onClick={verrouiller} />
          </div>
        </header>

        {/* Perso / Pro */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div role="tablist" aria-label="Espace" style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '3px' }}>
            {[['perso', 'Perso'], ['pro', 'Pro']].map(([id, nom]) => (
              <button key={id} role="tab" aria-selected={type === id} onClick={() => choisirType(id)} style={{
                padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: grotesk, fontSize: '13px', fontWeight: 600,
                background: type === id ? T.accent : 'transparent', color: type === id ? T.accentText : T.textMuted,
              }}>{nom}</button>
            ))}
          </div>
          {autresFoyers.map(f => (
            <Link key={f.id} to={f.accueil} style={{ fontSize: '13px', color: T.textMuted, fontFamily: grotesk, textDecoration: 'none' }}>
              {f.nom} <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>

        <AjoutRapide T={T} espace={espace} type={type} afficher={afficher} onAjouté={(outil, données) => { remplacer(outil, espace, données); setTimeout(() => rafraîchir(true), 4000) }} />

        {/* Outils */}
        <div className="grille-outils" style={{ display: 'grid', gap: '10px', marginBottom: '26px' }}>
          {tuiles.map(t => (
            <Link key={t.titre} to={t.to} className="tuile" style={{ ...carteStyle, padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', textDecoration: 'none', color: T.text, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${T.accent}1f`, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon nom={t.icône} taille={18} />
                </span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: '15px', fontFamily: grotesk }}>{t.titre}</span>
                <Icon nom="fleche" taille={14} style={{ color: T.textMuted }} />
              </div>
              <div>
                <span style={{ fontFamily: serif, fontSize: '30px', lineHeight: 1, color: t.alerte ? T.danger : T.text, fontVariantNumeric: 'tabular-nums' }}>{t.chiffre}</span>
                {t.unité && <span style={{ marginLeft: '7px', fontSize: '13px', color: T.textMuted }}>{t.unité}</span>}
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: t.alerte ? T.danger : T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.détail}</p>
            </Link>
          ))}
        </div>

        {/* Reprendre + carte du jour */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '18px', marginBottom: '26px', alignItems: 'start' }}>
          <section>
            <h2 style={titreBloc}>Reprendre</h2>
            <div style={{ ...carteStyle, padding: '4px' }}>
              {récents.length === 0 && <p style={{ margin: 0, padding: '14px', fontSize: '13px', color: T.textMuted }}>Les pages que tu ouvres apparaîtront ici.</p>}
              {récents.map(r => (
                <Link key={r.chemin} to={r.chemin} className="ligne-recente" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', textDecoration: 'none', color: T.text }}>
                  <span style={{ color: T.textMuted }}><Icon nom={r.icône} taille={17} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titre}</span>
                    {r.détail && <span style={{ fontSize: '12px', color: T.textMuted }}>{r.détail}</span>}
                  </span>
                  <span style={{ fontSize: '12px', color: T.textMuted, flexShrink: 0 }}>{depuis(r.date)}</span>
                </Link>
              ))}
            </div>
          </section>

          {carte && (
            <section>
              <h2 style={titreBloc}>Carte du jour</h2>
              <button onClick={() => setRetournée(r => !r)} style={{ ...carteStyle, width: '100%', textAlign: 'left', padding: '16px 18px', cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: carte.paquet?.couleur || T.accent, fontWeight: 600 }}>{carte.paquet?.nom || 'Mémoriser'}</span>
                  <span style={{ fontSize: '11.5px', color: T.textMuted }}>{retournée ? 'Réponse' : 'Question'}</span>
                </span>
                <span style={{ display: 'block', fontFamily: serif, fontSize: '19px', lineHeight: 1.4 }}>
                  <TexteFormaté texte={retournée ? carte.verso : carte.recto} couleurDéfaut={T.text} />
                </span>
                <span style={{ display: 'block', marginTop: '12px', fontSize: '12px', color: T.textMuted }}>
                  {retournée ? 'Toucher pour revoir la question' : 'Toucher pour voir la réponse'}
                </span>
              </button>
              <Link to={`/memoriser/${carte.espace}`} style={{ display: 'inline-block', marginTop: '8px', fontSize: '13px', color: T.accent, textDecoration: 'none', fontFamily: grotesk }}>
                Réviser ce paquet →
              </Link>
            </section>
          )}
        </div>

        {/* Cours React, replié */}
        <section style={{ ...carteStyle }}>
          <button onClick={() => setCoursOuverts(o => !o)} aria-expanded={coursOuverts} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: T.text, textAlign: 'left',
          }}>
            <span style={{ color: T.textMuted }}><Icon nom="livre" taille={18} /></span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: '15px', fontFamily: grotesk }}>Cours React</span>
            <span style={{ fontSize: '12.5px', color: T.textMuted }}>{notions.length} notions</span>
            <Icon nom="chevronBas" taille={15} style={{ color: T.textMuted, transform: coursOuverts ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {coursOuverts && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '2px 16px', padding: '0 12px 14px' }}>
              {niveaux.map(niveau => notions.filter(n => n.niveau === niveau).map(n => (
                <Link key={n.id} to={`/notion/${n.id}`} className="ligne-recente" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 8px', borderRadius: '10px', textDecoration: 'none', color: T.text }}>
                  <span title={niveau} style={{ width: '7px', height: '7px', borderRadius: '50%', background: couleurNiveau[niveau], flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>{n.titre}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.description}</span>
                  </span>
                </Link>
              )))}
            </div>
          )}
        </section>
      </div>
      {message && (
        <div role="status" style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 50,
          maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: '12px', fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.35)',
          background: message.erreur ? T.danger : T.text, color: message.erreur ? '#fff' : T.bg,
        }}>{message.texte}</div>
      )}
      {sauvegardeOuverte && <Sauvegarde T={T} foyer={foyer} onFermer={() => setSauvegardeOuverte(false)} onRestauré={() => rafraîchir(true)} />}
      {rechercheOuverte && <RechercheGlobale T={T} lire={lire} foyer={foyer} onFermer={() => setRechercheOuverte(false)} />}
    </div>
  )
}

const TYPES_AJOUT = [
  ['tâche', 'Tâche', 'Appeler le notaire demain #urgent'],
  ['note', 'Note', 'Titre de la note // texte de la note'],
  ['carte', 'Carte', 'Question :: réponse #paquet'],
]

// Ligne « ＋ Ajouter » : une tâche, une note ou une carte, écrite tout de
// suite dans le bon fichier (Perso ou Pro selon le sélecteur).
function AjoutRapide({ T, espace, type: typeEspace, afficher, onAjouté }) {
  const [genre, setGenre] = useState('tâche')
  const [saisie, setSaisie] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const analyse = saisie.trim() ? analyserSaisie(saisie) : null
  const valider = async e => {
    e.preventDefault()
    if (!saisie.trim() || envoi) return
    setEnvoi(true)
    try {
      const { outil, données, résumé } = await ajouterRapidement({ type: genre, espace, saisie })
      onAjouté(outil, données)
      setSaisie('')
      afficher(`✓ ${résumé} (${typeEspace === 'pro' ? 'Pro' : 'Perso'})`)
    } catch (err) {
      afficher(err.message, true)
    } finally {
      setEnvoi(false)
    }
  }
  const puce = { fontSize: '11.5px', padding: '2px 8px', borderRadius: '20px', background: `${T.accent}1f`, color: T.accent, fontFamily: grotesk, fontWeight: 600 }
  return (
    <form onSubmit={valider} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '6px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div role="tablist" aria-label="Type à ajouter" style={{ display: 'flex', flexShrink: 0 }}>
          {TYPES_AJOUT.map(([id, nom]) => (
            <button key={id} type="button" role="tab" aria-selected={genre === id} onClick={() => setGenre(id)} style={{
              padding: '7px 10px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontFamily: grotesk, fontSize: '12.5px', fontWeight: 600,
              background: genre === id ? T.surface2 : 'transparent', color: genre === id ? T.text : T.textMuted,
            }}>{nom}</button>
          ))}
        </div>
        <input
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          placeholder={TYPES_AJOUT.find(t => t[0] === genre)[2]}
          aria-label="Ajouter rapidement"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: '15px', padding: '8px 6px' }}
        />
        <button type="submit" disabled={!saisie.trim() || envoi} aria-label="Ajouter" style={{
          flexShrink: 0, height: '34px', padding: '0 14px', borderRadius: '10px', border: 'none', fontFamily: grotesk, fontWeight: 700, fontSize: '13px',
          background: saisie.trim() ? T.accent : T.surface2, color: saisie.trim() ? T.accentText : T.textMuted, cursor: saisie.trim() ? 'pointer' : 'default',
        }}>{envoi ? '…' : 'Ajouter'}</button>
      </div>
      {analyse && genre === 'tâche' && (analyse.date || analyse.étiquettes.length > 0) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '4px 8px 4px' }}>
          {analyse.date && <span style={puce}>📅 {new Date(analyse.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
          {analyse.étiquettes.map(é => <span key={é} style={puce}>#{é}</span>)}
        </div>
      )}
    </form>
  )
}
