// Outil « Query Generator » : JSON → requêtes jq et JMESPath. Les requêtes
// sont générées localement (par l'exemple, par description FR/EN ou en mode
// guidé), puis exécutées par les vrais moteurs (jq 1.8 en WebAssembly,
// jmespath.js) dans un Web Worker, et vérifiées. Aucune donnée n'est envoyée.
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { appeler, préparerMoteur } from '../../../lib/querygen/client'
import { analyserJson, colorerJson, formaterJson, lireAttendu, minifierJson, tailleTexte } from '../../../lib/querygen/json'
import { EXEMPLES } from '../../../lib/querygen/exemples'
import { MODES } from '../../../lib/querygen/comparer'
import Badge from './Badge'
import CarteRequete from './CarteRequete'
import EditeurCode from './EditeurCode'
import ModeGuide from './ModeGuide'
import Resultat from './Resultat'

const LIMITE_FICHIER = 25 * 1024 * 1024
const texteExemple = id => JSON.stringify(EXEMPLES.find(e => e.id === id).données, null, 2)
const ressembleJson = t => /^\s*([[{"\d-]|(true|false|null)\b)/.test(t)

function sourceProbable(texte) {
  if (/"Reservations"|"Volumes"|"Buckets"|"SecurityGroups"|"Subnets"|"Vpcs"|"Functions"|"DBInstances"/.test(texte.slice(0, 5000))) return 'aws'
  if (/"apiVersion"|"kind"\s*:\s*"(List|Pod|Deployment|Service|Node)/.test(texte.slice(0, 5000))) return 'kubectl'
  return null
}

export default function GenerateurJson({ T, S }) {
  const [moteur, setMoteur] = useState({ état: 'chargement' })
  const [entrée, setEntrée] = useState(() => texteExemple('ec2'))
  const [exempleActif, setExempleActif] = useState('ec2')
  const [mode, setMode] = useState('description')
  const [description, setDescription] = useState(EXEMPLES[0].descriptions[0])
  const [attendu, setAttendu] = useState('')
  const [comparaison, setComparaison] = useState('exact')
  const [planGuidé, setPlanGuidé] = useState(null)
  const [structure, setStructure] = useState(null)
  const [résultat, setRésultat] = useState(null)
  const [indexCandidat, setIndexCandidat] = useState(0)
  const [occupé, setOccupé] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [cartes, setCartes] = useState({ jq: null, jmespath: null })
  const [entréeGénérée, setEntréeGénérée] = useState(null)
  const [info, setInfo] = useState(null)
  const zoneEntrée = useRef(null)
  const sélecteurFichier = useRef(null)
  const génération = useRef(0)

  useEffect(() => {
    let actif = true
    préparerMoteur()
      .then(v => { if (actif) setMoteur({ état: 'prêt', version: v }) })
      .catch(e => { if (actif) setMoteur({ état: 'erreur', message: e.message }) })
    return () => { actif = false }
  }, [])

  const entréeDifférée = useDeferredValue(entrée)
  const validation = useMemo(() => analyserJson(entréeDifférée), [entréeDifférée])
  const prêt = moteur.état === 'prêt'

  // Structure détectée (collections, champs) : calculée par le worker.
  useEffect(() => {
    if (!validation.ok || !prêt) return undefined
    let actif = true
    const t = setTimeout(() => {
      appeler('analyser', { texteEntrée: entréeDifférée }).then(r => { if (actif && r.ok) setStructure(r.structure) }).catch(() => {})
    }, 300)
    return () => { actif = false; clearTimeout(t) }
  }, [entréeDifférée, validation.ok, prêt])

  const candidat = résultat?.candidats?.[indexCandidat] || null

  const choisir = useCallback((r, i) => {
    setIndexCandidat(i)
    const c = r?.candidats?.[i]
    if (!c) { setCartes({ jq: null, jmespath: null }); return }
    setCartes({
      jq: { requête: c.jq.requête || '', exécution: c.jq, statut: c.jq.statut, explication: null },
      jmespath: { requête: c.jmespath.requête || '', exécution: c.jmespath, statut: c.jmespath.statut, explication: null },
    })
  }, [])

  const générer = useCallback(async () => {
    const n = ++génération.current
    setOccupé(true)
    setErreur(null)
    try {
      const r = await appeler('générer', { texteEntrée: entrée, mode, texteAttendu: attendu, comparaison, description, plan: planGuidé }, 30000)
      if (n !== génération.current) return
      if (!r.ok) { setErreur(r.erreur); setRésultat(null); choisir(null, 0); return }
      setRésultat(r)
      setEntréeGénérée(entrée)
      choisir(r, 0)
    } catch (e) {
      if (n === génération.current) setErreur(e.message)
    } finally {
      if (n === génération.current) setOccupé(false)
    }
  }, [entrée, mode, attendu, comparaison, description, planGuidé, choisir])

  // Mode guidé : chaque choix régénère les requêtes.
  useEffect(() => {
    if (mode !== 'guidé' || !planGuidé || !prêt || !validation.ok) return undefined
    const t = setTimeout(générer, 250)
    return () => clearTimeout(t)
  }, [mode, planGuidé, prêt, validation.ok, générer])

  const majCarte = (l, patch) => setCartes(c => ({ ...c, [l]: { ...c[l], ...patch } }))
  const éditer = (l, v) => majCarte(l, { requête: v, statut: 'modifiée', explication: null })

  const exécuter = async (l, requête = cartes[l]?.requête) => {
    majCarte(l, { requête, statut: 'enCours', explication: null })
    try {
      const r = await appeler('exécuter', { langage: l, requête, texteEntrée: entrée, texteAttendu: mode === 'exemple' ? attendu : '', comparaison, plan: mode !== 'exemple' ? candidat?.plan : undefined })
      if (!r.ok) majCarte(l, { statut: 'erreur', exécution: { erreur: { message: r.erreur } } })
      else majCarte(l, { statut: r.exécution.statut, exécution: r.exécution })
    } catch (e) {
      majCarte(l, { statut: 'erreur', exécution: { erreur: { message: e.message } } })
    }
  }

  const expliquer = async l => {
    if (cartes[l]?.explication) { majCarte(l, { explication: null }); return }
    try {
      const r = await appeler('expliquer', { langage: l, requête: cartes[l].requête })
      majCarte(l, { explication: r.ok ? r : { erreur: r.erreur, étapes: r.étapes || [] } })
    } catch (e) {
      majCarte(l, { explication: { erreur: e.message, étapes: [] } })
    }
  }

  const importer = f => {
    if (!f) return
    if (f.size > LIMITE_FICHIER) { setInfo(`Fichier trop volumineux (${(f.size / 1048576).toFixed(1)} Mo, maximum 25 Mo).`); return }
    f.text().then(t => { setEntrée(t); setExempleActif(null); setInfo(`« ${f.name} » importé (${tailleTexte(t)}). Il reste dans ce navigateur.`) })
  }

  const chargerExemple = id => {
    const ex = EXEMPLES.find(e => e.id === id)
    if (!ex) return
    setEntrée(texteExemple(id))
    setExempleActif(id)
    setDescription(ex.descriptions[0])
    setAttendu('')
    setRésultat(null)
    choisir(null, 0)
    setInfo(null)
  }

  const formater = compacter => {
    const t = compacter ? minifierJson(entrée) : formaterJson(entrée)
    if (t === null) { setInfo('Mise en forme impossible : corrigez d\'abord le JSON.'); return }
    setEntrée(t)
    setInfo(null)
  }

  const allerÀLErreur = () => {
    const z = zoneEntrée.current
    const e = validation.erreur
    if (!z || !e) return
    z.focus()
    z.setSelectionRange(e.position, Math.min(entrée.length, e.position + 1))
    const ligne = parseFloat(getComputedStyle(z).lineHeight) || 21
    z.scrollTop = Math.max(0, (e.ligne - 3) * ligne)
  }

  const réunir = () => {
    if (!validation.valeurs) return
    setEntrée(`[\n${validation.valeurs.map(v => JSON.stringify(v, null, 2).replace(/^/gm, '  ')).join(',\n')}\n]`)
  }

  const exemple = EXEMPLES.find(e => e.id === exempleActif)
  const attenduLu = useMemo(() => (mode === 'exemple' && attendu.trim() ? lireAttendu(attendu) : null), [mode, attendu])
  const obsolète = résultat && entréeGénérée !== null && entréeGénérée !== entrée
  const source = sourceProbable(entrée)
  const étiquette = S.étiquette
  const bouton = { ...S.puce(false), minHeight: 36, fontSize: 13 }

  return (
    <div>
      <div style={S.carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: grotesk, fontSize: 19 }}>JSON → jq &amp; JMESPath</h2>
          <span style={{ flex: 1 }} />
          <span role="status" style={{ fontSize: 12.5, fontFamily: grotesk, fontWeight: 700, color: moteur.état === 'prêt' ? '#2e9e6b' : moteur.état === 'erreur' ? '#dc2626' : T.textMuted }}>
            {moteur.état === 'prêt' ? `● ${moteur.version.jq} · JMESPath ${moteur.version.jmespath} · local` : moteur.état === 'erreur' ? `● moteur indisponible : ${moteur.message}` : '● chargement de jq (WebAssembly)…'}
          </span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: T.textMuted }}>
          Collez un JSON, décrivez ou montrez le résultat voulu : les requêtes jq et JMESPath sont générées séparément, <strong style={{ color: T.text }}>exécutées pour de vrai</strong> et vérifiées. Tout reste dans ce navigateur.
        </p>
      </div>

      {/* 1 · JSON d'entrée */}
      <section aria-labelledby="qg-entree" style={S.carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <h3 id="qg-entree" style={{ margin: 0, fontFamily: grotesk, fontSize: 17 }}>1 · JSON d'entrée</h3>
          <span style={{ flex: 1 }} />
          <button onClick={() => sélecteurFichier.current?.click()} style={bouton}>📂 Importer</button>
          <input ref={sélecteurFichier} type="file" accept=".json,application/json,.txt,text/plain" aria-label="Fichier JSON" style={{ display: 'none' }} onChange={e => { importer(e.target.files?.[0]); e.target.value = '' }} />
          <button onClick={() => formater(false)} style={bouton}>✨ Formater</button>
          <button onClick={() => formater(true)} style={bouton}>🗜️ Compacter</button>
          <select value={exempleActif || ''} onChange={e => chargerExemple(e.target.value)} aria-label="Exemples de JSON" style={{ ...S.champ, width: 'auto', minHeight: 36, padding: '4px 10px', fontFamily: grotesk, fontSize: 13 }}>
            <option value="">🧪 Exemples…</option>
            {EXEMPLES.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
          </select>
          <button onClick={() => { setEntrée(''); setExempleActif(null) }} aria-label="Vider le JSON" style={bouton}>🗑️</button>
        </div>
        <EditeurCode
          valeur={entrée}
          onChange={v => { setEntrée(v); setExempleActif(x => (x && v !== texteExemple(x) ? null : x)) }}
          colorer={colorerJson}
          T={T}
          hauteur={260}
          ariaLabel="JSON d'entrée"
          placeholder={'Collez ici un JSON (sortie de aws … --output json, kubectl get … -o json, API…), ou déposez un fichier.'}
          zoneRef={zoneEntrée}
          onDrop={e => { if (e.dataTransfer?.files?.length) { e.preventDefault(); importer(e.dataTransfer.files[0]) } }}
          onDragOver={e => e.preventDefault()}
        />
        <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8, fontSize: 13.5 }}>
          {validation.ok ? (
            <span style={{ color: '#2e9e6b', fontWeight: 700 }}>✅ JSON valide · {tailleTexte(entrée)}{structure ? ` · ${structure.collections.filter(c => c.nombre).length} collection(s) détectée(s)` : ''}</span>
          ) : validation.vide ? (
            <span style={{ color: T.textMuted }}>Aucun JSON pour l'instant.</span>
          ) : (
            <>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>❌ Ligne {validation.erreur.ligne}, colonne {validation.erreur.colonne} : {validation.erreur.message}</span>
              {!validation.multiple && <button onClick={allerÀLErreur} style={{ ...bouton, minHeight: 30 }}>Aller à l'erreur</button>}
              {validation.multiple && <button onClick={réunir} style={{ ...bouton, minHeight: 30 }}>Réunir dans un tableau</button>}
            </>
          )}
          {entrée.length > 150000 && <span style={{ color: T.textMuted }}>(coloration désactivée pour ce gros document)</span>}
        </div>
        {info && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: T.textMuted }}>{info}</p>}
        {validation.ok && structure && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, fontFamily: grotesk, fontWeight: 700 }}>🔎 Structure détectée</summary>
            <div style={{ marginTop: 6, maxHeight: 280, overflowY: 'auto' }}>
              {structure.collections.filter(c => c.nombre && c.typeÉléments !== 'vide').slice(0, 12).map(c => (
                <div key={c.id} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13.5 }}>
                  <code style={{ fontWeight: 800 }}>{c.chemin.length === 1 ? '[] (tableau racine)' : c.id}</code> <span style={{ color: T.textMuted }}>· {c.nombre} élément{c.nombre > 1 ? 's' : ''}</span>
                  <div style={{ color: T.textMuted, marginTop: 2, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {c.champs.slice(0, 14).map(ch => `${ch.texte}${ch.exemples.length && !ch.multi ? ` (${ch.exemples.slice(0, 2).map(v => JSON.stringify(v)).join(', ')}${ch.distincts > 2 ? '…' : ''})` : ''}`).join(' · ')}{c.champs.length > 14 ? ' · …' : ''}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>

      {/* 2 · Résultat attendu */}
      <section aria-labelledby="qg-attendu" style={S.carte}>
        <h3 id="qg-attendu" style={{ margin: '0 0 8px', fontFamily: grotesk, fontSize: 17 }}>2 · Résultat attendu</h3>
        <div role="tablist" aria-label="Façon de décrire le résultat" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['description', '📝 Description'], ['exemple', '🧾 JSON attendu'], ['guidé', '🧭 Mode guidé']].map(([id, nom]) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)} style={S.puce(mode === id)}>{nom}</button>
          ))}
        </div>
        {mode === 'description' && (
          <>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} aria-label="Description du résultat" placeholder="Ex. : Retourner les instances EC2 en état running avec leur ID et leur type — ou en anglais : Count available EBS volumes" style={{ ...S.champ, fontFamily: grotesk, resize: 'vertical', lineHeight: 1.5 }} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) générer() }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {(exemple?.descriptions || ['Je souhaite avoir la valeur de la clé …', 'Compter le nombre total d\'éléments', 'List names sorted by …']).map(d => (
                <button key={d} onClick={() => setDescription(d)} style={{ ...S.puce(description === d), minHeight: 32, fontSize: 12.5, fontWeight: 600, whiteSpace: 'normal', textAlign: 'left' }}>{d}</button>
              ))}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.5 }}>Français ou anglais. Interprétation locale, à partir des noms et des valeurs du JSON : chaque choix est affiché comme hypothèse.</p>
          </>
        )}
        {mode === 'exemple' && (
          <>
            <EditeurCode valeur={attendu} onChange={setAttendu} colorer={ressembleJson(attendu) ? colorerJson : null} T={T} hauteur={150} ariaLabel="Résultat attendu" placeholder={'[\n  { "id": "i-123", "type": "t3.medium" }\n]'} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <label style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>Comparaison
                <select value={comparaison} onChange={e => setComparaison(e.target.value)} aria-label="Mode de comparaison" style={{ ...S.champ, width: 'auto', minHeight: 34, padding: '4px 8px', fontFamily: grotesk, fontSize: 13 }}>
                  {Object.entries(MODES).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                </select>
              </label>
              <span aria-live="polite" style={{ fontSize: 13 }}>
                {attenduLu && (attenduLu.ok ? <span style={{ color: '#2e9e6b' }}>✅ {attenduLu.brut ? 'texte brut, une valeur par ligne (comme jq -r)' : attenduLu.flux ? `${attenduLu.valeur.valeurs.length} documents (flux)` : 'JSON valide'}</span> : <span style={{ color: '#dc2626' }}>❌ {attenduLu.erreur.message}{attenduLu.erreur.ligne ? ` (ligne ${attenduLu.erreur.ligne})` : ''}</span>)}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.5 }}>« Partielle » : l'attendu est un extrait (le résultat peut contenir plus d'éléments ou de clés). Le moteur cherche la requête la plus simple qui reproduit exactement l'attendu.</p>
          </>
        )}
        {mode === 'guidé' && (validation.ok && structure ? <ModeGuide structure={structure} T={T} S={S} onPlan={setPlanGuidé} /> : <p style={{ color: T.textMuted, fontSize: 14 }}>Le mode guidé s'appuie sur la structure du JSON : saisissez d'abord un JSON valide.</p>)}
        {mode !== 'guidé' && (
          <button onClick={générer} disabled={!prêt || occupé || !validation.ok} style={{ ...S.puce(true), minHeight: 46, fontSize: 16, marginTop: 12, padding: '0 22px', opacity: !prêt || !validation.ok ? 0.55 : 1 }}>{occupé ? 'Génération…' : !prêt ? 'Chargement du moteur…' : '⚡ Générer les requêtes'}</button>
        )}
        {mode === 'guidé' && occupé && <p style={{ fontSize: 13, color: T.textMuted }}>Génération…</p>}
      </section>

      {/* 3 · Requêtes générées */}
      {erreur && <div role="alert" style={{ ...S.carte, borderColor: '#dc2626', color: T.text }}>❌ {erreur}</div>}
      {résultat && (
        <section aria-labelledby="qg-requetes">
          <div style={S.carte}>
            <h3 id="qg-requetes" style={{ margin: '0 0 6px', fontFamily: grotesk, fontSize: 17 }}>3 · Requêtes générées</h3>
            {obsolète && <p role="status" style={{ margin: '0 0 8px', fontSize: 13.5, color: '#d97706' }}>⚠️ Le JSON d'entrée a changé depuis la génération : régénérez ou ré-exécutez.</p>}
            {résultat.messages?.map(m => <p key={m.texte} style={{ margin: '0 0 6px', fontSize: 13.5, lineHeight: 1.5, color: m.niveau === 'attention' ? '#d97706' : T.text }}>{m.niveau === 'attention' ? '⚠️' : 'ℹ️'} {m.texte}</p>)}
            {!résultat.candidats.length && (
              <div role="alert" style={{ fontSize: 14, lineHeight: 1.55 }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Aucune requête proposée : la demande ne peut pas être rattachée au JSON sans deviner.</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{résultat.raisons.map(r => <li key={r}>{r}</li>)}</ul>
                <p style={{ margin: '8px 0 0', color: T.textMuted }}>Essayez {mode === 'exemple' ? 'une description, ou un exemple plus complet' : 'le mode guidé, ou un exemple de résultat (JSON attendu)'}.</p>
              </div>
            )}
            {candidat && (
              <>
                {résultat.candidats.length > 1 && (
                  <div role="radiogroup" aria-label="Interprétations" style={{ marginBottom: 8 }}>
                    <p style={{ ...étiquette }}>Interprétations ({résultat.candidats.length}{résultat.autres ? ` affichées, ${résultat.autres} de plus` : ''})</p>
                    {résultat.candidats.map((c, i) => (
                      <button key={i} role="radio" aria-checked={i === indexCandidat} onClick={() => choisir(résultat, i)} style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 8, alignItems: 'center', padding: '8px 10px', marginBottom: 4, borderRadius: 10, border: `1px solid ${i === indexCandidat ? T.accent : T.border}`, background: i === indexCandidat ? T.accentSoft : T.bg, color: T.text, cursor: 'pointer', fontSize: 13.5 }}>
                        <span style={{ fontWeight: 800 }}>{i + 1}.</span>
                        <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{c.étapes.slice(1).join(' · ') || c.étapes[0]}</span>
                        <Badge statut={c.jq.statut} />
                      </button>
                    ))}
                  </div>
                )}
                <p style={{ ...étiquette }}>Interprétation</p>
                <ol style={{ margin: '0 0 8px', paddingLeft: 20, fontSize: 14, lineHeight: 1.55 }}>{candidat.étapes.map(e => <li key={e}>{e}</li>)}</ol>
                {candidat.hypothèses?.length > 0 && (
                  <details open={mode === 'description'}>
                    <summary style={{ cursor: 'pointer', fontSize: 13.5, fontFamily: grotesk, fontWeight: 700 }}>Hypothèses ({candidat.hypothèses.length})</summary>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55 }}>{candidat.hypothèses.map(h => <li key={h}>{h}</li>)}</ul>
                  </details>
                )}
                {candidat.concordance !== null && (
                  <p style={{ margin: '8px 0 0', fontSize: 13.5, color: candidat.concordance ? '#2e9e6b' : '#d97706' }}>{candidat.concordance ? '✅ Contrôle croisé : jq et JMESPath, exécutés séparément, donnent le même résultat.' : '⚠️ jq et JMESPath ne donnent pas le même résultat : voir les différences ci-dessous.'}</p>
                )}
              </>
            )}
          </div>
          {candidat && cartes.jq && cartes.jmespath && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 430px), 1fr))', gap: 12, marginBottom: 12 }}>
              {['jq', 'jmespath'].map(l => (
                <CarteRequete
                  key={`${l}-${indexCandidat}`}
                  langage={l}
                  T={T}
                  S={S}
                  requête={cartes[l].requête}
                  setRequête={v => éditer(l, v)}
                  exécution={cartes[l].exécution}
                  statut={cartes[l].statut}
                  onExécuter={() => exécuter(l)}
                  onExpliquer={() => expliquer(l)}
                  explication={cartes[l].explication}
                  onAppliquer={q => exécuter(l, q)}
                  brut={!!résultat.brut}
                  source={source}
                  référence={mode === 'exemple' ? 'attendu' : 'plan'}
                />
              ))}
            </div>
          )}
          {candidat?.alternatives?.length > 0 && (
            <div style={S.carte}>
              <p style={{ ...étiquette }}>Variante jq</p>
              {candidat.alternatives.map(a => (
                <div key={a.requête} style={{ marginBottom: 8 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 13.5, lineHeight: 1.5 }}>{a.note} <Badge statut={a.statut} /></p>
                  <Resultat texte={a.requête} T={T} hauteur={80} aria="Variante jq" />
                  <button onClick={() => exécuter('jq', a.requête)} style={{ ...bouton, marginTop: 6 }}>Utiliser cette variante</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  )
}
