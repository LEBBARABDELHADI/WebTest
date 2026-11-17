// Outil « Règle IAM » : décrire une règle (français ou anglais), la construire visuellement ou en JSON, la valider
// avec les vraies données AWS, la simuler (tests générés + requête libre) et l'exporter (Terraform, CloudFormation, CLI).
// Tout se passe dans le navigateur : rien n'est envoyé, aucune IA externe.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { grotesk } from '../../lib/theme'
import { STYLE_CODE } from '../../lib/querygen/apparence'
import { colorerJson, formaterJson } from '../../lib/querygen/json'
import { catalogueWeb } from '../../lib/iam/sourceWeb'
import { TYPES, lirePolitique, normaliser, sérialiser, politiqueVide } from '../../lib/iam/politique'
import { valider, appliquerCorrectif } from '../../lib/iam/valider'
import { servicesÀCharger } from '../../lib/iam/etendre'
import { interpréter } from '../../lib/iam/assistant'
import { adapterAuType } from '../../lib/iam/edition'
import { testsDepuisPlan, testsApprobation, sondesDepuisPolitique, exécuterTests, résumerTests } from '../../lib/iam/testsauto'
import EditeurCode from './querygen/EditeurCode'
import BoutonCopier from './querygen/BoutonCopier'
import Assistant from './iam/Assistant'
import Constructeur from './iam/Constructeur'
import Controles from './iam/Controles'
import Acces from './iam/Acces'
import Simulation from './iam/Simulation'
import Export from './iam/Export'
import { Segments } from './iam/ui'

const EXEMPLE_INITIAL = 'Lecture seule sur le bucket S3 mon-bucket'
const VUES = [['constructeur', '🧱 Constructeur'], ['json', '{ } JSON'], ['explication', '📖 Explication']]
const AUCUN = []

export default function IamBuilder({ T, S }) {
  const [type, setType] = useState('identite')
  const [auto, setAuto] = useState(true)
  const [texte, setTexte] = useState(() => sérialiser(politiqueVide('identite')))
  const [description, setDescription] = useState(EXEMPLE_INITIAL)
  const [génération, setGénération] = useState(null)
  const [précédent, setPrécédent] = useState(null)
  const [occupé, setOccupé] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [prêt, setPrêt] = useState(false)
  const [version, setVersion] = useState(0)
  const [vue, setVue] = useState('constructeur')
  const zoneJson = useRef(null)

  // Politique courante : le JSON est la source de vérité ; le constructeur et les contrôles en dérivent.
  const lecture = useMemo(() => lirePolitique(texte), [texte])
  const politique = useMemo(() => (lecture.ok ? normaliser(lecture.doc) : null), [lecture])
  const données = useMemo(() => ({ cat: catalogueWeb, v: `${prêt}:${version}` }), [prêt, version])

  // Applique le résultat d'une interprétation : nouvelle politique, hypothèses, plan pour les tests.
  const appliquerRésultat = useCallback((r, texteDescription, ancien) => {
    const nouveau = sérialiser(r.politique)
    if (r.politique.déclarations.length) {
      if (ancien) setPrécédent(ancien)
      setType(r.type)
      setTexte(nouveau)
    }
    setGénération({ plan: r.plan, type: r.type, texte: r.politique.déclarations.length ? nouveau : null, description: texteDescription, hypothèses: r.plan.hypothèses, nonCompris: r.plan.nonCompris, avertissements: r.plan.avertissements, motsInutilisés: r.plan.motsInutilisés, typeDétecté: r.plan.typeDétecté })
    setVersion(v => v + 1)
  }, [])

  // Au premier affichage : charge l'index des services, puis génère l'exemple de départ (la politique est déjà vérifiée).
  useEffect(() => {
    let actif = true
    ;(async () => {
      try {
        await catalogueWeb.prêt()
        if (!actif) return
        setPrêt(true)
        const r = await interpréter(EXEMPLE_INITIAL, catalogueWeb, { type: 'auto' })
        if (actif) appliquerRésultat(r, EXEMPLE_INITIAL, null)
      } catch (e) {
        if (actif) setErreur(`Chargement des données IAM impossible : ${e.message}`)
      } finally {
        if (actif) setOccupé(false)
      }
    })()
    return () => { actif = false }
  }, [appliquerRésultat])

  // Services nécessaires à l'analyse de la politique courante (chargés à la demande, puis tout est synchrone).
  const clé = useMemo(() => (prêt && politique ? servicesÀCharger(données.cat, politique).sort().join(',') : ''), [prêt, politique, données])
  useEffect(() => {
    if (!clé) return undefined
    let actif = true
    catalogueWeb.charger(clé.split(',')).then(() => { if (actif) setVersion(v => v + 1) }).catch(e => { if (actif) setErreur(e.message) })
    return () => { actif = false }
  }, [clé])

  // Tant que les services cités ne sont pas chargés, on n'affiche aucun verdict : il serait incomplet.
  const enAttente = useMemo(() => !!clé && clé.split(',').some(p => !données.cat.chargé(p)), [clé, données])
  const rapport = useMemo(() => (lecture.ok && prêt && !enAttente ? valider(lecture.doc, { type, cat: données.cat, lecture }) : null), [lecture, prêt, enAttente, type, données])

  // Tests : générés d'après la description (si la politique en vient) ou sondes sur une politique saisie à la main.
  const planUtilisable = génération?.plan && génération.type === type && génération.plan.déclarations.length > 0 && !génération.plan.accessDenied?.length && génération.texte
  const tests = useMemo(() => {
    if (!politique || !prêt || enAttente) return { origine: null, liste: AUCUN }
    if (planUtilisable) return { origine: 'plan', liste: type === 'approbation' ? testsApprobation(génération.plan) : testsDepuisPlan(génération.plan, données.cat) }
    return { origine: 'sondes', liste: sondesDepuisPolitique(politique, données.cat) }
  }, [politique, prêt, enAttente, planUtilisable, type, génération, données])
  const résultatsTests = useMemo(() => (politique && tests.liste.length ? exécuterTests(tests.liste, politique, type) : AUCUN), [tests, politique, type])
  const résumeTests = tests.origine === 'plan' && résultatsTests.length ? résumerTests(résultatsTests) : null
  const modifiée = !!génération?.texte && génération.texte !== texte

  const générer = async () => {
    setOccupé(true)
    setErreur(null)
    try {
      const r = await interpréter(description, catalogueWeb, { type: auto ? 'auto' : type })
      appliquerRésultat(r, description, { texte, type, auto })
      if (r.politique.déclarations.length) setVue('constructeur')
    } catch (e) {
      setErreur(e.message)
    } finally {
      setOccupé(false)
    }
  }
  const annuler = () => {
    if (!précédent) return
    setTexte(précédent.texte)
    setType(précédent.type)
    setAuto(précédent.auto)
    setPrécédent(null)
    setGénération(null)
  }
  const changerType = v => {
    if (v === 'auto') { setAuto(true); return }
    setAuto(false)
    setType(v)
    if (politique) setTexte(sérialiser(adapterAuType(politique, v)))
  }
  const modifier = p => setTexte(sérialiser(p))
  const corriger = c => { if (politique) modifier(appliquerCorrectif(politique, c)) }
  const aller = ligne => {
    setVue('json')
    setTimeout(() => {
      const z = zoneJson.current
      if (!z) return
      const lignes = texte.split('\n')
      const début = lignes.slice(0, ligne - 1).reduce((s, l) => s + l.length + 1, 0)
      z.focus()
      z.setSelectionRange(début, début + (lignes[ligne - 1]?.length ?? 0))
      z.scrollTop = Math.max(0, (ligne - 3) * 21)
      z.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    }, 50)
  }
  const formater = () => { const f = formaterJson(texte); if (f) setTexte(f) }

  const source = catalogueWeb.source
  const nombreServices = prêt ? catalogueWeb.préfixes().length : 0

  return (
    <div style={{ overflowWrap: 'anywhere' }}>
      <style>{STYLE_CODE}</style>
      <div style={{ ...S.carte, padding: 12 }}>
        <h2 style={{ margin: '0 0 4px', fontFamily: grotesk, fontSize: 21 }}>🔑 Règle IAM</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: T.textMuted }}>
          Décrivez une règle, construisez-la ou collez-la en JSON : elle est <strong style={{ color: T.text }}>validée avec les données IAM d'AWS</strong>
          {nombreServices ? ` (${nombreServices} services, ${catalogueWeb.nombreActionsTotal().toLocaleString('fr-FR')} actions)` : ''}, <strong style={{ color: T.text }}>simulée</strong> (refus explicite &gt; autorisation &gt; refus implicite) puis exportée en Terraform, CloudFormation ou AWS CLI.
        </p>
      </div>

      {erreur && <div role="alert" style={{ ...S.carte, borderColor: '#dc2626' }}>❌ {erreur}</div>}

      <Assistant
        description={description} onDescription={setDescription} type={type} auto={auto} onType={changerType}
        onGénérer={générer} occupé={occupé} génération={génération} résumeTests={résumeTests}
        peutAnnuler={!!précédent} onAnnuler={annuler} T={T} S={S}
      />

      <section aria-labelledby="iam-politique" style={S.carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <h3 id="iam-politique" style={{ margin: 0, fontFamily: grotesk, fontSize: 17 }}>2 · Politique</h3>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: T.textMuted }}>{TYPES[type].nom}</span>
        </div>
        <Segments aria="Vue de la politique" S={S} valeur={vue} onChange={setVue} options={VUES} />
        <div style={{ marginTop: 10 }}>
          {vue === 'constructeur' && (politique
            ? <Constructeur politique={politique} type={type} onChange={modifier} données={données} T={T} S={S} />
            : <div role="alert" style={{ fontSize: 14, lineHeight: 1.55 }}>Le JSON n'est pas valide : le constructeur est désactivé. <button type="button" onClick={() => setVue('json')} style={{ ...S.puce(true), minHeight: 36 }}>Corriger dans l'onglet JSON</button></div>)}
          {vue === 'json' && (
            <div>
              <EditeurCode valeur={texte} onChange={setTexte} colorer={colorerJson} T={T} hauteur={380} ariaLabel="Politique IAM (JSON)" zoneRef={zoneJson} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                <button type="button" onClick={formater} disabled={!lecture.ok} style={{ ...S.puce(false), minHeight: 40 }}>✨ Formater</button>
                <BoutonCopier texte={texte} T={T} libellé="📋 Copier le JSON" aria="Copier la politique JSON" />
                {lecture.ok ? <span style={{ fontSize: 13, color: '#2e9e6b', fontWeight: 700 }}>✅ JSON valide</span> : <span role="alert" style={{ fontSize: 13, color: '#dc2626', fontWeight: 700 }}>❌ Ligne {lecture.erreur.ligne}, colonne {lecture.erreur.colonne} : {lecture.erreur.message}</span>}
                {!lecture.ok && <button type="button" onClick={() => aller(lecture.erreur.ligne)} style={{ ...S.puce(false), minHeight: 36 }}>Aller à l'erreur</button>}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.textMuted }}>Collez ici une politique existante pour l'analyser : le constructeur, les contrôles, la simulation et les exports se mettent à jour à chaque frappe.</p>
            </div>
          )}
          {vue === 'explication' && (politique ? <Acces politique={politique} type={type} données={données} T={T} S={S} /> : <p style={{ fontSize: 14, color: '#dc2626' }}>JSON invalide : corrigez-le d'abord.</p>)}
        </div>
      </section>

      <section aria-labelledby="iam-contrôles" style={S.carte}>
        <h3 id="iam-contrôles" style={{ margin: '0 0 8px', fontFamily: grotesk, fontSize: 17 }}>3 · Contrôles</h3>
        {lecture.ok
          ? <Controles rapport={rapport} lecture={lecture} onCorriger={corriger} onAller={aller} T={T} S={S} />
          : <p role="alert" style={{ margin: 0, fontSize: 14, color: '#dc2626' }}>❌ JSON invalide — ligne {lecture.erreur.ligne}, colonne {lecture.erreur.colonne} : {lecture.erreur.message}</p>}
      </section>

      <section aria-labelledby="iam-simuler" style={S.carte}>
        <h3 id="iam-simuler" style={{ margin: '0 0 8px', fontFamily: grotesk, fontSize: 17 }}>4 · Simuler</h3>
        {politique
          ? <Simulation résultats={résultatsTests} origine={tests.origine} modifiée={modifiée} politique={politique} type={type} données={données} T={T} S={S} />
          : <p style={{ margin: 0, fontSize: 14, color: T.textMuted }}>Corrigez le JSON pour simuler.</p>}
      </section>

      <section aria-labelledby="iam-export" style={S.carte}>
        <h3 id="iam-export" style={{ margin: '0 0 8px', fontFamily: grotesk, fontSize: 17 }}>5 · Exporter</h3>
        {politique ? <Export politique={politique} type={type} T={T} S={S} /> : <p style={{ margin: 0, fontSize: 14, color: T.textMuted }}>Corrigez le JSON pour exporter.</p>}
      </section>

      <aside aria-label="Confidentialité et sources" style={{ ...S.carte, fontSize: 13.5, lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>🔒 <strong>Confidentialité.</strong> La description, la politique et la simulation restent dans ce navigateur : aucune donnée n'est envoyée, aucune IA externe n'est appelée. Les données de référence sont des fichiers du site, chargés service par service.</p>
        {source && <p style={{ margin: '6px 0 0' }}>📚 <strong>Données IAM :</strong> {source.nom} {source.version} (mises à jour le {source.miseÀJour?.slice(0, 10)}), licence {source.licence}. Les actions, niveaux d'accès, types de ressources et clés de condition viennent d'AWS ; une action très récente peut manquer.</p>}
        <p style={{ margin: '6px 0 0' }}>⚖️ <strong>Limites.</strong> La simulation couvre un seul compte : identité, plafond, SCP, ressource et approbation ; pas de politique de session, de RCP ni de passage entre services. KMS exige aussi la politique de la clé. Elle ne remplace pas le « Policy Simulator » d'AWS pour une validation finale.</p>
      </aside>
    </div>
  )
}
