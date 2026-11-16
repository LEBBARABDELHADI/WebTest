// Mode « Texte → Regex » : on décrit en français ou en anglais (ou on donne des
// exemples) ce qu'il faut reconnaître ; une regex est générée localement, vérifiée
// par exécution, expliquée, réécrite pour d'autres dialectes, puis testée sur un
// texte libre en bas de l'écran. Aucune donnée ne quitte le navigateur.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { colorerRegex } from '../../../lib/querygen/coloration'
import { DélaiDépassé, appeler } from '../../../lib/regexgen/client'
import { littéralJs } from '../../../lib/regexgen/ast'
import BoutonCopier from './BoutonCopier'
import EditeurCode from './EditeurCode'
import PanneauDialectes from './PanneauDialectes'
import ZoneTest from './ZoneTest'

const EXEMPLES_DESCRIPTION = [
  'adresse e-mail valide',
  '3 lettres majuscules suivies d\'un tiret puis 4 chiffres',
  'mot de passe d\'au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial',
  'extraire les adresses IP d\'un log',
  'lignes contenant ERROR mais pas DEBUG',
  'date au format jj/mm/aaaa',
  'comme AB-1234, XY-9876',
  'starts with a capital letter followed by lowercase letters',
]
const CIBLES = [['auto', 'Automatique'], ['valider', 'Valider une chaîne entière'], ['trouver', 'Trouver dans un texte'], ['lignes', 'Sélectionner des lignes']]
const NOM_CIBLE = { valider: 'valider une chaîne entière', trouver: 'trouver dans un texte', lignes: 'sélectionner des lignes' }
const DRAPEAUX = [['g', 'toutes les correspondances'], ['i', 'insensible à la casse'], ['m', '^ et $ valent pour chaque ligne'], ['s', 'le point inclut le saut de ligne'], ['u', 'mode Unicode']]
const AUCUN = []

const normaliserDrapeaux = s => ['g', 'i', 'm', 's', 'u', 'y'].filter(f => s.includes(f)).join('')

function Pastille({ couleur, children }) {
  return <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: `${couleur}22`, color: couleur, fontFamily: grotesk, fontWeight: 800, fontSize: 12.5, whiteSpace: 'nowrap' }}>{children}</span>
}

export default function GenerateurRegex({ T, S }) {
  const [description, setDescription] = useState(EXEMPLES_DESCRIPTION[0])
  const [exemplesTexte, setExemplesTexte] = useState('')
  const [cible, setCible] = useState('auto')
  const [casse, setCasse] = useState(false)
  const [groupes, setGroupes] = useState(false)
  const [résultat, setRésultat] = useState(null)
  const [index, setIndex] = useState(0)
  const [occupé, setOccupé] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [motif, setMotif] = useState('')
  const [drapeaux, setDrapeaux] = useState('')
  const [analyse, setAnalyse] = useState(null)
  const [modifié, setModifié] = useState(false)
  const [dialecte, setDialecte] = useState('js')
  const [voirExplication, setVoirExplication] = useState(false)
  const [test, setTest] = useState({ texte: '', auto: true })
  const [parLigne, setParLigne] = useState(true)
  const [résultatTest, setRésultatTest] = useState(null)
  const compteur = useRef(0)

  const exemplesDonnés = useMemo(() => exemplesTexte.split('\n').map(x => x.trim()).filter(Boolean), [exemplesTexte])
  const candidat = résultat?.candidats?.[index] ?? null
  const cibleCourante = candidat?.cible ?? 'valider'
  const exemplesVérifiés = résultat?.exemplesDonnés ?? AUCUN

  // Sélection d'un candidat : le motif, les drapeaux et l'analyse viennent du candidat.
  const choisir = useCallback((r, i) => {
    const c = r?.candidats?.[i]
    setIndex(i)
    if (!c) { setMotif(''); setDrapeaux(''); setAnalyse(null); setModifié(false); return }
    setMotif(c.motif)
    setDrapeaux(c.drapeaux)
    setAnalyse({ ok: true, explication: c.explication, risques: c.risques, variantes: c.variantes, vérification: c.vérification, exemples: c.exemples })
    setModifié(false)
    setParLigne(c.cible !== 'trouver')
    setTest(prev => (prev.auto || !prev.texte.trim() ? { texte: c.exemples.texteTest, auto: true } : prev))
  }, [])

  const générer = useCallback(async (surcharge = {}) => {
    const n = ++compteur.current
    setOccupé(true)
    setErreur(null)
    try {
      const r = await appeler('générer', { description, cible, casse, groupes, exemples: exemplesDonnés, ...surcharge }, 8000)
      if (n !== compteur.current) return
      if (!r.ok) { setErreur(r.erreur); setRésultat(null); choisir(null, 0); return }
      setRésultat(r)
      setVoirExplication(false)
      choisir(r, 0)
    } catch (e) {
      if (n === compteur.current) setErreur(e.message)
    } finally {
      if (n === compteur.current) setOccupé(false)
    }
  }, [description, cible, casse, groupes, exemplesDonnés, choisir])

  // Options : régénération immédiate quand un résultat est déjà affiché.
  const changerCible = v => { setCible(v); if (résultat || erreur) générer({ cible: v }) }
  const changerCasse = v => { setCasse(v); if (résultat) générer({ casse: v }) }
  const changerGroupes = v => { setGroupes(v); if (résultat) générer({ groupes: v }) }

  // Motif modifié à la main : analyse (explication, risques, dialectes) après une courte pause.
  useEffect(() => {
    if (!modifié || !motif) return undefined
    let actif = true
    const t = setTimeout(() => {
      appeler('analyser', { motif, drapeaux, cible: cibleCourante, exemples: exemplesVérifiés }, 5000)
        .then(r => { if (actif) setAnalyse(r) })
        .catch(e => { if (actif) setAnalyse({ ok: false, erreur: { message: e.message, position: 0 } }) })
    }, 250)
    return () => { actif = false; clearTimeout(t) }
  }, [modifié, motif, drapeaux, cibleCourante, exemplesVérifiés])

  // Test du motif sur le texte (dans le worker, avec délai de sécurité).
  useEffect(() => {
    if (!motif) return undefined
    let actif = true
    const pour = test.texte
    const t = setTimeout(() => {
      appeler('tester', { pattern: motif, flags: drapeaux, texte: pour, parLigne, max: 500 }, 3000)
        .then(r => { if (actif) setRésultatTest({ ...r, pour }) })
        .catch(e => { if (actif) setRésultatTest({ ok: false, délai: e instanceof DélaiDépassé, erreur: { message: e.message }, pour }) })
    }, 150)
    return () => { actif = false; clearTimeout(t) }
  }, [motif, drapeaux, test.texte, parLigne])

  const modifierMotif = v => { setMotif(v.replace(/\r?\n/g, '')); setModifié(true) }
  const basculerDrapeau = f => { setDrapeaux(d => normaliserDrapeaux(d.includes(f) ? d.replace(f, '') : d + f)); setModifié(true) }

  const motifInvalide = analyse && analyse.ok === false
  const vérification = analyse?.ok ? analyse.vérification : null
  const statut = motifInvalide ? 'invalide' : modifié && !vérification ? 'attente' : vérification?.statut === 'vérifiée' ? 'vérifiée' : vérification ? 'échec' : 'attente'
  const pastille = {
    invalide: ['#dc2626', '❌ Motif invalide'], vérifiée: ['#2e9e6b', vérification?.total > 1 ? `✅ Auto-vérifiée · ${vérification.réussis}/${vérification.total} contrôles` : '✅ Motif accepté par JavaScript (aucun autre contrôle concluant)'],
    échec: ['#d97706', '⚠️ Un contrôle échoue'], attente: ['#8b8b8b', '⏳ Analyse…'],
  }[statut]
  const littéral = motif ? littéralJs(motif, drapeaux) : ''
  const bouton = { ...S.puce(false), minHeight: 36, fontSize: 13 }
  const exemplesDispo = !!analyse?.ok && !!analyse.exemples?.texteTest

  return (
    <div>
      {/* 1 · Description */}
      <section aria-labelledby="rx-description" style={S.carte}>
        <h3 id="rx-description" style={{ margin: '0 0 6px', fontFamily: grotesk, fontSize: 17 }}>1 · Décrivez ce qu'il faut reconnaître</h3>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) générer() }}
          rows={3}
          aria-label="Description de la regex"
          placeholder="Ex. : adresse e-mail valide · 3 lettres majuscules suivies d'un tiret puis 4 chiffres · lines containing ERROR but not DEBUG · comme AB-1234, XY-9876"
          style={{ ...S.champ, fontFamily: grotesk, fontSize: 16, resize: 'vertical', lineHeight: 1.5 }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {EXEMPLES_DESCRIPTION.map(d => (
            <button key={d} onClick={() => setDescription(d)} style={{ ...S.puce(description === d), minHeight: 32, fontSize: 12.5, fontWeight: 600, whiteSpace: 'normal', textAlign: 'left' }}>{d.length > 60 ? `${d.slice(0, 58)}…` : d}</button>
          ))}
        </div>
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontSize: 14, fontFamily: grotesk, fontWeight: 700 }}>➕ Exemples qui doivent correspondre (facultatif)</summary>
          <textarea value={exemplesTexte} onChange={e => setExemplesTexte(e.target.value)} rows={3} aria-label="Exemples attendus" placeholder={'Un exemple par ligne.\nIls sont exécutés sur la regex : un exemple non reconnu est signalé et une correction est proposée.'} style={{ ...S.champ, fontSize: 16, marginTop: 6, resize: 'vertical' }} />
        </details>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>Cible
            <select value={cible} onChange={e => changerCible(e.target.value)} aria-label="Cible de la regex" style={{ ...S.champ, width: 'auto', maxWidth: '100%', minWidth: 0, minHeight: 40, padding: '4px 10px', fontFamily: grotesk, fontSize: 14 }}>
              {CIBLES.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={casse} onChange={e => changerCasse(e.target.checked)} /> Insensible à la casse</label>
          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={groupes} onChange={e => changerGroupes(e.target.checked)} /> Groupes de capture</label>
        </div>
        <button onClick={() => générer()} disabled={occupé || !description.trim()} style={{ ...S.puce(true), minHeight: 46, fontSize: 16, marginTop: 12, padding: '0 22px', opacity: !description.trim() ? 0.55 : 1 }}>{occupé ? 'Génération…' : '⚡ Générer la regex'}</button>
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13.5, color: T.textMuted }}>Ce que l'outil comprend</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: T.textMuted }}>
            <li><strong style={{ color: T.text }}>Des formats connus</strong> (une soixantaine) : e-mail, IPv4, CIDR, UUID, URL, dates, heures, téléphone, code postal, IBAN, version sémantique, identifiants AWS, ARN, Kubernetes, Docker, hash Git, JWT…</li>
            <li><strong style={{ color: T.text }}>Des suites</strong> : « 3 lettres majuscules suivies d'un tiret puis 4 chiffres », « de 3 à 10 caractères », « au moins 5 chiffres », « un mot de 5 à 8 lettres ».</li>
            <li><strong style={{ color: T.text }}>Des conditions</strong> : commence par, finit par, contient, ne contient pas, « au moins une majuscule et un chiffre ».</li>
            <li><strong style={{ color: T.text }}>Des formats de date</strong> : jj/mm/aaaa, yyyy-mm-dd hh:mm:ss…</li>
            <li><strong style={{ color: T.text }}>Des exemples</strong> : « comme AB-1234, XY-9876 » → la regex est déduite.</li>
          </ul>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.textMuted }}>Français ou anglais, interprétation locale par règles (pas de modèle de langage). Chaque choix est affiché comme hypothèse ; ce qui n'est pas compris est signalé, jamais inventé.</p>
        </details>
      </section>

      {erreur && <div role="alert" style={{ ...S.carte, borderColor: '#dc2626' }}>❌ {erreur}</div>}

      {/* 2 · Regex générée */}
      {résultat && (
        <section aria-labelledby="rx-regex" style={S.carte}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <h3 id="rx-regex" style={{ margin: 0, fontFamily: grotesk, fontSize: 17 }}>2 · Regex</h3>
            <span style={{ flex: 1 }} />
            {candidat && <Pastille couleur={pastille[0]}>{pastille[1]}</Pastille>}
          </div>

          {!résultat.candidats.length ? (
            <div role="alert" style={{ fontSize: 14, lineHeight: 1.55 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Aucune regex proposée : la description ne peut pas être rattachée à un format, une suite ou des exemples sans deviner.</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{résultat.raisons.map(r => <li key={r}>{r}</li>)}</ul>
            </div>
          ) : (
            <>
              {résultat.candidats.length > 1 && (
                <div role="radiogroup" aria-label="Interprétations" style={{ marginBottom: 8 }}>
                  <p style={S.étiquette}>Interprétations ({résultat.candidats.length})</p>
                  {résultat.candidats.map((c, i) => (
                    <button key={i} role="radio" aria-checked={i === index} onClick={() => choisir(résultat, i)} style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 8, alignItems: 'center', padding: '8px 10px', marginBottom: 4, borderRadius: 10, border: `1px solid ${i === index ? T.accent : T.border}`, background: i === index ? T.accentSoft : T.bg, color: T.text, cursor: 'pointer', fontSize: 13.5 }}>
                      <span style={{ fontWeight: 800 }}>{i + 1}.</span>
                      <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{c.titre}</span>
                      <span aria-hidden="true">{c.vérification.statut === 'vérifiée' ? '✅' : '⚠️'}</span>
                    </button>
                  ))}
                </div>
              )}
              <p style={{ margin: '0 0 8px', fontSize: 13.5, color: T.textMuted }}>
                {candidat.titre} · cible : <strong style={{ color: T.text }}>{NOM_CIBLE[candidat.cible]}</strong> · langue détectée : {résultat.langue === 'en' ? 'anglais' : 'français'}
              </p>
              <EditeurCode valeur={motif} onChange={modifierMotif} colorer={colorerRegex} T={T} hauteur={76} retour ariaLabel="Expression régulière" />
              <div role="group" aria-label="Drapeaux" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 13, color: T.textMuted }}>Drapeaux :</span>
                {DRAPEAUX.map(([f, titre]) => (
                  <button key={f} onClick={() => basculerDrapeau(f)} aria-pressed={drapeaux.includes(f)} aria-label={`Drapeau ${f} : ${titre}`} title={titre} style={{ ...S.puce(drapeaux.includes(f)), minHeight: 32, minWidth: 36, padding: '0 10px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 14 }}>{f}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                <BoutonCopier texte={motif} T={T} libellé="📋 Copier le motif" aria="Copier le motif" />
                <BoutonCopier texte={littéral} T={T} libellé="📋 Copier /…/drapeaux" aria="Copier la regex JavaScript" />
                <button onClick={() => setVoirExplication(v => !v)} aria-expanded={voirExplication} disabled={motifInvalide} style={bouton}>💡 Expliquer</button>
              </div>
              <code aria-label="Regex JavaScript" style={{ display: 'block', marginTop: 8, fontSize: 13, color: T.textMuted, wordBreak: 'break-all' }}>{littéral}</code>

              {motifInvalide && (
                <div role="alert" style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.35)', fontSize: 14, lineHeight: 1.5 }}>
                  ❌ {analyse.erreur.message}{analyse.erreur.position ? ` (position ${analyse.erreur.position + 1})` : ''}
                </div>
              )}
              {analyse?.ok && analyse.risques?.map(r => (
                <p key={r.texte} role="alert" style={{ margin: '8px 0 0', padding: '8px 10px', borderRadius: 10, background: r.niveau === 'attention' ? 'rgba(217,119,6,.1)' : T.bg, border: `1px solid ${r.niveau === 'attention' ? 'rgba(217,119,6,.45)' : T.border}`, fontSize: 13.5, lineHeight: 1.5 }}>{r.niveau === 'attention' ? '⚠️' : 'ℹ️'} {r.texte}</p>
              ))}

              {voirExplication && analyse?.ok && (
                <div style={{ marginTop: 10 }}>
                  <p style={S.étiquette}>Explication</p>
                  <p style={{ margin: '0 0 6px', fontSize: 13.5, lineHeight: 1.5 }}>{analyse.explication.résumé.join(' ')}</p>
                  {analyse.explication.drapeaux.length > 0 && <p style={{ margin: '0 0 6px', fontSize: 13, color: T.textMuted }}>Drapeaux — {analyse.explication.drapeaux.join(' · ')}</p>}
                  <ol aria-label="Explication pas à pas" style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.55 }}>
                    {analyse.explication.étapes.map((e, i) => (
                      <li key={i} style={{ marginLeft: e.niveau * 14, marginBottom: 4, listStyle: e.niveau ? 'circle' : undefined }}>
                        {e.code && <code style={{ fontSize: 12.5, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '0 4px', wordBreak: 'break-all' }}>{e.code}</code>} — {e.texte}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {candidat.hypothèses.length > 0 && (
                <details open style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 14, fontFamily: grotesk, fontWeight: 700 }}>Interprétation et hypothèses ({candidat.hypothèses.length})</summary>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55 }}>{candidat.hypothèses.map(h => <li key={h} style={{ wordBreak: 'break-word' }}>{h}</li>)}</ul>
                </details>
              )}
              {vérification && (
                <details open style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 14, fontFamily: grotesk, fontWeight: 700 }}>Auto-vérification (exécutée) {modifié ? '· motif modifié' : ''}</summary>
                  <ul aria-label="Contrôles" style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, fontSize: 13.5, lineHeight: 1.55 }}>
                    {vérification.contrôles.map(c => (
                      <li key={c.libellé} style={{ display: 'flex', gap: 8 }}>
                        <span aria-hidden="true">{c.ok === null ? 'ℹ️' : c.ok ? '✅' : '❌'}</span>
                        <span style={{ wordBreak: 'break-word' }}>{c.libellé}{c.détail ? ` — ${c.détail}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textMuted }}>Les exemples sont exécutés par le moteur JavaScript de ce navigateur ; une regex « vérifiée » reconnaît ses exemples, ce qui ne prouve pas qu'elle couvre tous vos cas : testez-la ci-dessous.</p>
                </details>
              )}
              <PanneauDialectes variantes={analyse?.ok ? analyse.variantes : null} dialecte={dialecte} onDialecte={setDialecte} T={T} S={S} />
            </>
          )}
        </section>
      )}

      {/* 3 · Test, en bas */}
      {motif && (
        <ZoneTest
          T={T}
          S={S}
          texte={test.texte}
          onTexte={v => setTest({ texte: v, auto: false })}
          parLigne={parLigne}
          onMode={setParLigne}
          résultat={résultatTest}
          exemplesDispo={exemplesDispo}
          onExemples={() => setTest({ texte: analyse.exemples.texteTest, auto: true })}
          onVider={() => setTest({ texte: '', auto: false })}
          ancré={motif.startsWith('^') && motif.endsWith('$') && !drapeaux.includes('m')}
        />
      )}
    </div>
  )
}
