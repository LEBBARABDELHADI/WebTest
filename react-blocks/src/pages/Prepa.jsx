import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { PRÉPAS, imprimerFiche } from '../lib/prepas'
import { PRÉSETS, créerObjectif, préparation, estimation, compteÀRebours, aujourdhui } from '../lib/certifications'
import { PAQUETS_PRÊTS, ajouterPaquetsPrêts } from '../lib/paquetsPrets'
import { lireLocal, lireOutil, modifierOutil } from '../lib/donneesFoyer'

const gras = t => t.split(/(\*\*[^*]+\*\*)/g).map((m, i) => (m.startsWith('**') ? <strong key={i}>{m.slice(2, -2)}</strong> : m))
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Page de préparation d'un examen (AWS CloudOps, naturalisation) : mise en
// place en un toucher, objectif et compte à rebours, à faire aujourd'hui,
// raccourcis vers tous les outils, fiche de synthèse imprimable.
export default function Prépa() {
  const { examen, espace: espaceParam } = useParams()
  const prépa = PRÉPAS[examen] || PRÉPAS.aws
  const foyer = FOYERS[foyerDeLEspace(espaceParam || 'perso')]
  const espace = espaceParam || `${foyer.préfixe}perso`
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const [mémo, setMémo] = useState(() => lireLocal('memoriser', espace))
  const [date, setDate] = useState('')
  const [état, setÉtat] = useState('')
  const [ouvertes, setOuvertes] = useState(() => new Set([0]))
  useEffect(() => { let ok = true; lireOutil('memoriser', espace).then(d => { if (ok && d) setMémo(d) }); return () => { ok = false } }, [espace])

  const préset = PRÉSETS.find(p => p.id === prépa.préset)
  const objectif = (mémo.objectifs || []).find(o => o.préset === prépa.préset)
  const paquets = (mémo.paquets || []).filter(p => prépa.paquets.includes(p.modèle))
  const manquants = prépa.paquets.filter(id => !paquets.some(p => p.modèle === id))
  const cartes = (mémo.cartes || []).filter(c => paquets.some(p => p.id === c.paquetId))
  const auj = aujourdhui()
  const dues = cartes.filter(c => !c.prochaineRevision || c.prochaineRevision <= auj)
  const carnet = cartes.filter(c => c.carnet && c.carnet.prochaine <= auj)
  const actu = cartes.filter(c => c.aVérifier && (!c.vérifiéLe || c.vérifiéLe < new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10)))
  const examens = (mémo.examens || []).filter(e => objectif && e.objectifId === objectif.id)
  const dernierExamen = examens.at(-1)
  const tâches = lireLocal('taches', espace)
  const étapePlan = objectif && (tâches.cartes || []).filter(c => c.texte?.startsWith(`🎯 ${objectif.nom}`) && !c.fait && !c.archivé).sort((a, b) => (a.échéance || '').localeCompare(b.échéance || ''))[0]
  const prép = objectif ? préparation(objectif, mémo.cartes || []) : null
  const est = objectif ? estimation(objectif, mémo.examens) : null
  const M = `/memoriser/${espace}`
  const modèles = ids => `modeles=${encodeURIComponent(ids.join(','))}`

  // Mise en place : paquets prêts + objectif, sur l'appareil et sur GitHub.
  const mettreEnPlace = async (avecObjectif = true) => {
    setÉtat('Mise en place…')
    const préfixe = `${Date.now().toString(36)}-`
    const idObj = uid()
    try {
      const { données, enLigne } = await modifierOutil('memoriser', espace, d => {
        const d2 = ajouterPaquetsPrêts({ paquets: [], cartes: [], ...d }, prépa.paquets, préfixe, auj)
        if (!avecObjectif || !date || (d2.objectifs || []).some(o => o.préset === prépa.préset)) return d2
        return { ...d2, objectifs: [...(d2.objectifs || []), { ...créerObjectif(préset, date, d2.paquets), id: idObj }] }
      })
      setMémo(données)
      setÉtat(enLigne ? '✓ Prêt : paquets et objectif enregistrés.' : '✓ Prêt sur cet appareil (connecte le token GitHub pour synchroniser).')
    } catch (err) { setÉtat(`Erreur : ${err.message}`) }
  }
  const changerDate = async () => {
    if (!date || !objectif) return
    const { données } = await modifierOutil('memoriser', espace, d => ({ ...d, objectifs: (d.objectifs || []).map(o => (o.préset === prépa.préset ? { ...o, date } : o)) }))
    setMémo(données); setDate(''); setÉtat('✓ Date mise à jour')
  }

  const carte = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }
  const titre = { margin: '0 0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted, fontFamily: grotesk }
  const bouton = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 42, padding: '0 16px', borderRadius: 12, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: '14px', cursor: 'pointer', textDecoration: 'none' }
  const champDate = { minHeight: 42, padding: '0 10px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: '15px' }

  const àFaire = [
    dues.length > 0 && { emoji: '🃏', texte: `${dues.length} carte${dues.length > 1 ? 's' : ''} à réviser`, lien: `${M}?action=reviser&${modèles(prépa.paquets)}` },
    carnet.length > 0 && { emoji: '📕', texte: `${carnet.length} erreur${carnet.length > 1 ? 's' : ''} à refaire (carnet)`, lien: `${M}?action=carnet` },
    objectif && (!dernierExamen || (Date.now() - new Date(dernierExamen.date)) > 6 * 864e5) && { emoji: '📝', texte: dernierExamen ? `Dernier examen blanc il y a ${Math.floor((Date.now() - new Date(dernierExamen.date)) / 864e5)} jours : en refaire un` : 'Passer un premier examen blanc', lien: `${M}?action=examen&objectif=${objectif.id}` },
    étapePlan && { emoji: '🗓️', texte: `Plan : ${étapePlan.texte.replace(`🎯 ${objectif.nom} · `, '').replace(`🎯 ${objectif.nom} : `, '')}${étapePlan.échéance ? ` (avant le ${new Date(`${étapePlan.échéance}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})` : ''}`, lien: `/taches/${espace}` },
    actu.length > 0 && { emoji: '📰', texte: `${actu.length} info${actu.length > 1 ? 's' : ''} d'actualité à vérifier`, lien: `${M}?action=ouvrir&modele=nat-actu` },
  ].filter(Boolean)

  const outils = [
    prépa.id === 'aws' && { emoji: '📚', titre: 'Set SOA-C03', détail: '197 questions : réponse, explication, console, discussion', lien: `/set/soa-c03/${espace}` },
    { emoji: '🃏', titre: 'Réviser mes cartes', détail: `${cartes.length} cartes · ${dues.length} à revoir`, lien: `${M}?action=reviser&${modèles(prépa.paquets)}` },
    objectif && { emoji: '📝', titre: 'Examen blanc', détail: `${objectif.questions} q. · ${objectif.minutes} min · pondéré`, lien: `${M}?action=examen&objectif=${objectif.id}` },
    { emoji: '📕', titre: 'Carnet d\'erreurs', détail: `${cartes.filter(c => c.carnet).length} dedans · ${carnet.length} aujourd'hui`, lien: `${M}?action=carnet` },
    { emoji: '📊', titre: 'Progrès et plan', détail: 'Domaines, courbe, plan de révision', lien: `${M}?action=objectifs` },
    prépa.labo && { emoji: '🧪', titre: 'Labos pratiques', détail: 'Tâches chronométrées + vérification', lien: `${M}?action=labo&modele=${prépa.labo}` },
    prépa.pannes && { emoji: '🚑', titre: 'Scénarios de panne', détail: 'Démarches de dépannage', lien: `${M}?action=reviser&${modèles([prépa.pannes])}` },
    prépa.id === 'aws' && { emoji: '⌨️', titre: 'Commandes AWS CLI', détail: 'Cartes avec bouton Copier', lien: `${M}?action=reviser&${modèles(['aws-cli'])}` },
    prépa.id === 'aws' && { emoji: '🚨', titre: 'Runbooks', détail: 'Checklists d\'incident dans Notes', lien: `/notes/${espace}?modele=${encodeURIComponent('🚨 Runbook')}` },
    prépa.id === 'naturalisation' && { emoji: '📘', titre: 'Cours animé du Livret', détail: '11 chapitres : cours, révision, questions, QCM', lien: `/cours/livret/${espace}` },
    prépa.entretien && { emoji: '🎙️', titre: 'Entretien simulé', détail: 'Questions à voix haute', lien: `${M}?action=entretien&modele=${prépa.entretien}` },
    prépa.oral && { emoji: '🗣️', titre: 'Oral chronométré', détail: 'Sujet au hasard, 1 à 3 min', lien: `${M}?action=oral&modele=${prépa.oral}` },
    prépa.id === 'naturalisation' && { emoji: '🤝', titre: 'Mises en situation', détail: 'Laïcité, égalité, loi', lien: `${M}?action=reviser&${modèles(['nat-situations'])}` },
    prépa.id === 'naturalisation' && { emoji: '🎲', titre: 'Jeux', détail: 'Frise, avant/après, carte de France', lien: `${M}?action=jeux` },
    prépa.id === 'naturalisation' && { emoji: '📰', titre: 'Actualité', détail: `${actu.length} à vérifier`, lien: `${M}?action=ouvrir&modele=nat-actu` },
    { emoji: '📄', titre: prépa.noteModèle.replace(/^\S+\s/, ''), détail: 'Ta fiche personnelle dans Notes', lien: `/notes/${espace}?modele=${encodeURIComponent(prépa.noteModèle)}` },
    ...prépa.schémas.map(([id, nom]) => ({ emoji: nom.split(' ')[0], titre: nom.replace(/^\S+\s/, ''), détail: 'Schéma dans le Graphe amélioré', lien: `/tableau/${espace}?modele=${id}` })),
    { emoji: '⏱️', titre: 'Session de 25 min', détail: 'Minuteur, temps compté dans l\'habitude', lien: '/timer?minutes=25' },
    { emoji: '🔥', titre: 'Habitude quotidienne', détail: `${prépa.habitude.emoji} ${prépa.habitude.nom}`, lien: `/habitudes/${espace}?idee=${encodeURIComponent(prépa.habitude.nom)}&emoji=${encodeURIComponent(prépa.habitude.emoji)}&couleur=${encodeURIComponent(prépa.habitude.couleur)}` },
    { emoji: '📥', titre: 'Importer mes questions', détail: 'Texte, CSV, Q:/R:', lien: `${M}?action=import` },
  ].filter(Boolean)

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '24px 16px 48px', color: T.text }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: '13px', fontFamily: grotesk, minHeight: 36 }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
              {['perso', 'pro'].map(t => {
                const e = `${foyer.préfixe}${t}`
                return <Link key={t} to={`/prepa/${prépa.id}/${e}`} style={{ fontSize: '12px', fontFamily: grotesk, fontWeight: 600, padding: '7px 12px', borderRadius: 6, background: e === espace ? T.accent : 'transparent', color: e === espace ? T.accentText : T.textMuted }}>{t === 'perso' ? 'Perso' : 'Pro'}</Link>
              })}
            </div>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
          </div>
        </div>
        <p style={{ fontFamily: grotesk, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent, margin: '0 0 4px', fontWeight: 600 }}>{prépa.sousTitre}</p>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '32px', margin: '0 0 18px', lineHeight: 1.1 }}>{prépa.emoji} {prépa.titre}</h1>

        {/* Objectif */}
        <section style={carte} aria-label="Objectif">
          {!objectif ? (
            <>
              <p style={titre}>Commencer</p>
              <p style={{ margin: '0 0 12px', fontSize: '14px', lineHeight: 1.5 }}>
                Un toucher installe les <strong>{prépa.paquets.length} paquets de cartes</strong> et crée ton objectif avec le format de l'examen ({préset.questions} questions, {préset.minutes} min, {Math.round(préset.seuil * 100)} %) et le compte à rebours.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px' }}>Date de l'examen
                  <input type="date" min={auj} value={date} onChange={e => setDate(e.target.value)} aria-label="Date de l'examen" style={champDate} />
                </label>
                <button onClick={() => mettreEnPlace(true)} disabled={!date} style={{ ...bouton, opacity: date ? 1 : 0.5 }}>🚀 Tout mettre en place</button>
                {manquants.length > 0 && <button onClick={() => mettreEnPlace(false)} style={{ ...bouton, background: T.surface2, color: T.text, border: `1px solid ${T.border}` }}>Seulement les cartes</button>}
              </div>
              {préset.note && <p style={{ fontSize: '12px', color: T.textMuted, margin: '10px 0 0', lineHeight: 1.45 }}>ℹ️ {préset.note} À vérifier sur le site officiel.</p>}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: grotesk, fontSize: '40px', fontWeight: 800, color: T.accent, lineHeight: 1 }}>{compteÀRebours(objectif.date)}</span>
                <span style={{ fontSize: '14px', color: T.textMuted }}>examen le {new Date(`${objectif.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div style={{ margin: '14px 0 6px', display: 'flex', fontSize: '13px' }}>
                <span style={{ flex: 1 }}>Préparation (cartes maîtrisées, pondérées par domaine)</span>
                <strong style={{ fontFamily: grotesk }}>{Math.round(prép.taux * 100)} %</strong>
              </div>
              <div style={{ position: 'relative', height: 12, borderRadius: 6, background: T.surface2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${prép.taux * 100}%`, background: prép.taux >= objectif.seuil ? '#2e9e6b' : T.accent }} />
                <div title={`Objectif ${Math.round(objectif.seuil * 100)} %`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${objectif.seuil * 100}%`, width: 2, background: T.text, opacity: 0.5 }} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '13px', fontFamily: grotesk, fontWeight: 600, color: est.avant === false ? T.danger : T.text }}>{est.texte}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
                {manquants.length > 0 && <button onClick={() => mettreEnPlace(false)} style={bouton}>Ajouter les {manquants.length} paquet{manquants.length > 1 ? 's' : ''} manquant{manquants.length > 1 ? 's' : ''}</button>}
                <input type="date" min={auj} value={date} onChange={e => setDate(e.target.value)} aria-label="Nouvelle date de l'examen" style={{ ...champDate, minHeight: 36, fontSize: '13px' }} />
                <button onClick={changerDate} disabled={!date} style={{ ...bouton, minHeight: 36, fontSize: '12.5px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`, opacity: date ? 1 : 0.5 }}>Changer la date</button>
              </div>
            </>
          )}
          {état && <p role="status" style={{ margin: '10px 0 0', fontSize: '13px', fontFamily: grotesk, fontWeight: 600, color: état.startsWith('✓') ? '#2e9e6b' : T.text }}>{état}</p>}
        </section>

        {/* Aujourd'hui */}
        {àFaire.length > 0 && (
          <section style={carte} aria-label="Aujourd'hui">
            <p style={titre}>Aujourd'hui</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {àFaire.map(a => (
                <Link key={a.texte} to={a.lien} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '6px 10px', borderRadius: 10, background: T.surface2, color: T.text, textDecoration: 'none', fontSize: '14px' }}>
                  <span style={{ fontSize: '18px' }}>{a.emoji}</span><span style={{ flex: 1 }}>{a.texte}</span><Icon nom="fleche" taille={14} style={{ color: T.textMuted }} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Outils */}
        <p style={titre}>Tous les outils</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 10, marginBottom: 20 }}>
          {outils.map(o => (
            <Link key={o.titre} to={o.lien} className="tuile-prepa" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 12px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, color: T.text, textDecoration: 'none', minHeight: 64 }}>
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{o.emoji}</span>
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', fontFamily: grotesk, fontSize: '14px' }}>{o.titre}</strong>
                <span style={{ fontSize: '12px', color: T.textMuted }}>{o.détail}</span>
              </span>
            </Link>
          ))}
        </div>

        {/* Fiche */}
        <section style={carte} aria-label="Fiche de synthèse">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <p style={{ ...titre, margin: 0, flex: 1 }}>📄 Fiche de synthèse</p>
            <button onClick={() => setOuvertes(o => (o.size === prépa.fiche.length ? new Set() : new Set(prépa.fiche.map((_, i) => i))))} style={{ ...bouton, minHeight: 34, fontSize: '12.5px', background: T.surface2, color: T.text, border: `1px solid ${T.border}` }}>{ouvertes.size === prépa.fiche.length ? 'Tout replier' : 'Tout déplier'}</button>
            <button onClick={() => { if (!imprimerFiche(prépa)) setÉtat('Autorise les fenêtres pour imprimer la fiche') }} style={{ ...bouton, minHeight: 34, fontSize: '12.5px', background: T.surface2, color: T.text, border: `1px solid ${T.border}` }}>🖨️ Imprimer / PDF</button>
            <Link to={`/notes/${espace}?fiche=${prépa.id}`} style={{ ...bouton, minHeight: 34, fontSize: '12.5px', background: T.surface2, color: T.text, border: `1px solid ${T.border}` }}>📝 Copier dans Notes</Link>
          </div>
          {prépa.fiche.map((s, i) => {
            const ouverte = ouvertes.has(i)
            return (
              <div key={s.titre} style={{ borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => setOuvertes(o => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n })} aria-expanded={ouverte}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '8px 2px', background: 'none', border: 'none', color: T.text, fontFamily: grotesk, fontWeight: 700, fontSize: '15px', textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ flex: 1 }}>{s.titre}</span><Icon nom={ouverte ? 'chevronHaut' : 'chevronBas'} taille={14} />
                </button>
                {ouverte && (
                  <ul style={{ margin: '0 0 12px', paddingLeft: 20, fontSize: '14px', lineHeight: 1.55 }}>
                    {s.points.map(p => <li key={p} style={{ marginBottom: 4 }}>{gras(p)}</li>)}
                  </ul>
                )}
              </div>
            )
          })}
        </section>

        <p style={{ fontSize: '12px', color: T.textMuted, lineHeight: 1.5 }}>
          Paquets de cette préparation : {PAQUETS_PRÊTS.flatMap(c => c.paquets).filter(m => prépa.paquets.includes(m.id)).map(m => m.nom).join(' · ')}.
        </p>
      </div>
    </div>
  )
}
