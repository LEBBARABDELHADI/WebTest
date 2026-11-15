// Outil « Terraform · TFLint » : validation d'une configuration Terraform avant
// terraform plan, entièrement dans l'application (rien à installer, aucun
// fichier envoyé). Le moteur tourne dans un Web Worker avec les données de
// référence des vrais outils : schéma du provider AWS (terraform validate),
// règles AWS de TFLint, politiques de sécurité équivalentes à Checkov.
import { useMemo, useRef, useState } from 'react'
import { grotesk } from '../../lib/theme'
import {
  CATÉGORIES, ÉTAPES, ÉTAT_CONTRÔLE, GRAVITÉ, GRAVITÉS, NIVEAU, STATUTS, analyserDansLeNavigateur, estRapport, filtrer, lireDépôt,
  lireFichiers, lireRépertoire, parFichier, rapportHtml, rapportTexte, résumé, résuméFichiers, télécharger, valeurTexte,
} from '../../lib/tfpv/client'

const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const CODE_DÉPART = `resource "aws_instance" "example" {
  ami           = "ami-12345678"
  instance_type = "t3.invalid"
}
`

function Puce({ couleur, children, style }) {
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, background: `${couleur}22`, color: couleur, fontFamily: grotesk, fontWeight: 800, fontSize: 12.5, whiteSpace: 'nowrap', ...style }}>{children}</span>
}

function Copier({ texte, T, libellé = '📋' }) {
  const [ok, setOk] = useState(false)
  return <button onClick={() => { navigator.clipboard?.writeText(texte); setOk(true); setTimeout(() => setOk(false), 1200) }} aria-label={libellé === '📋' ? 'Copier' : libellé} style={{ minHeight: 32, padding: '0 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: ok ? '#2e9e6b' : T.text, cursor: 'pointer', fontSize: 13 }}>{ok ? '✓ copié' : libellé}</button>
}

function Extrait({ snippet, T }) {
  if (!snippet) return null
  return (
    <pre style={{ margin: '8px 0', padding: '8px 0', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, overflowX: 'auto', fontSize: 12.5, lineHeight: 1.5, fontFamily: mono }}>
      {snippet.lines.map((l, i) => {
        const n = snippet.start_line + i
        const hl = n === snippet.highlight
        return <div key={n} style={{ padding: '0 10px', background: hl ? 'rgba(240,168,57,.22)' : 'transparent', whiteSpace: 'pre' }}><span style={{ display: 'inline-block', width: 34, color: T.textMuted, userSelect: 'none' }}>{n}</span>{l}</div>
      })}
    </pre>
  )
}

function Constat({ f, T }) {
  const g = GRAVITÉ[f.severity]
  return (
    <details style={{ border: `1px solid ${T.border}`, borderLeft: `4px solid ${g.couleur}`, borderRadius: 10, padding: '8px 10px', marginBottom: 8, background: T.surface }}>
      <summary style={{ cursor: 'pointer', listStyle: 'revert', lineHeight: 1.45 }}>
        <Puce couleur={g.couleur} style={{ marginRight: 6 }}>{g.nom}</Puce>
        <code style={{ fontWeight: 800, wordBreak: 'break-all' }}>{f.rule_id}</code>
        {f.blocking && <Puce couleur="#dc2626" style={{ marginLeft: 6 }}>bloquant · {f.fails_at}</Puce>}
        <div style={{ fontSize: 14, marginTop: 3 }}>{f.title}</div>
        <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2, wordBreak: 'break-word' }}>
          {f.line ? `ligne ${f.line}` : 'sans ligne'}{f.resource ? ` · ${f.resource}` : ''}{f.value !== null && f.value !== undefined ? ` · valeur ${valeurTexte(f.value)}` : ''}
        </div>
      </summary>
      <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 6 }}>
        <Extrait snippet={f.snippet} T={T} />
        <p style={{ margin: '6px 0', wordBreak: 'break-word' }}><strong>Constat.</strong> {f.message}</p>
        <p style={{ margin: '6px 0' }}><strong>Description.</strong> {f.description}</p>
        <p style={{ margin: '6px 0' }}><strong>Cause probable.</strong> {f.cause}</p>
        <p style={{ margin: '6px 0' }}><strong>Correction recommandée.</strong> {f.recommendation}</p>
        {f.fix && (
          <div style={{ position: 'relative' }}>
            <pre style={{ margin: '6px 0', padding: 10, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, overflowX: 'auto', fontSize: 12.5, fontFamily: mono }}>{f.fix}</pre>
            <div style={{ position: 'absolute', top: 6, right: 6 }}><Copier texte={f.fix} T={T} /></div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0' }}>
          <Puce couleur={T.textMuted}>{CATÉGORIES[f.category] || f.category}</Puce>
          <Puce couleur={T.textMuted}>{NIVEAU[f.tier] || f.tier}</Puce>
          {f.confidence !== 'high' && <Puce couleur="#b7791f">confiance moyenne</Puce>}
          <Puce couleur={T.textMuted} style={{ whiteSpace: 'normal' }}>{f.engines.join(', ')} : {f.engine_rules.join(', ')}</Puce>
        </div>
        {(f.references || []).map(u => <div key={u} style={{ fontSize: 13, wordBreak: 'break-all' }}><a href={u} target="_blank" rel="noreferrer">📖 {u}</a></div>)}
      </div>
    </details>
  )
}

function Résultats({ r, T, S, onRelancer, relance }) {
  const [gravités, setGravités] = useState(() => new Set(GRAVITÉS))
  const [bloquants, setBloquants] = useState(false)
  const [texte, setTexte] = useState('')
  const st = STATUTS[r.status] || STATUTS.ERROR
  const s = r.summary
  const vus = useMemo(() => filtrer(r.findings, { gravités, bloquantsSeulement: bloquants, texte }), [r, gravités, bloquants, texte])
  const groupes = useMemo(() => parFichier(vus), [vus])
  const nb = sev => r.findings.filter(f => f.severity === sev).length
  const basculer = sev => setGravités(g => { const n = new Set(g); if (n.has(sev)) n.delete(sev); else n.add(sev); return n })
  const inv = r.inventory || {}
  const nom = r.project?.name || 'rapport'
  return (
    <>
      <div role="status" style={{ ...S.carte, borderColor: st.couleur, background: `${st.couleur}14` }}>
        <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 800, fontSize: 18, color: st.couleur }}>{st.nom}</p>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>{st.phrase}</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted, wordBreak: 'break-word' }}>{r.status_reason}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 6, marginTop: 10 }}>
          {[['Erreurs', s.failed, '#dc2626'], ['Avertissements', s.warnings, '#d97706'], ['Bloquants', s.blocking, '#b91c1c'], ['Contrôles', s.total_checks, T.text], ['Réussis', s.passed, '#15803d'], ['Non exécutés', s.not_run, '#7c3aed']].map(([n, v, c]) => (
            <div key={n} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 8px' }}>
              <div style={{ fontSize: 11.5, color: T.textMuted }}>{n}</div>
              <div style={{ fontFamily: grotesk, fontWeight: 800, fontSize: 20, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {onRelancer && <button onClick={onRelancer} disabled={!!relance?.occupé} style={S.puce(true)}>🔁 {relance?.libellé || 'Relancer après correction'}</button>}
          <button onClick={() => télécharger(`tfpv-${nom}.json`, JSON.stringify(r, null, 2), 'application/json')} style={S.puce(false)}>⬇️ JSON</button>
          <button onClick={() => télécharger(`tfpv-${nom}.html`, rapportHtml(r), 'text/html')} style={S.puce(false)}>⬇️ HTML</button>
          <button onClick={() => télécharger(`tfpv-${nom}.txt`, rapportTexte(r), 'text/plain')} style={S.puce(false)}>⬇️ Texte</button>
          <Copier texte={résumé(r)} T={T} libellé="📋 Résumé" />
        </div>
        {relance?.message && <p role="alert" style={{ margin: '8px 0 0', fontSize: 13.5, color: T.danger }}>{relance.message}</p>}
      </div>

      <details style={{ ...S.carte, padding: 0 }}>
        <summary style={{ cursor: 'pointer', padding: 14, fontFamily: grotesk, fontWeight: 800 }}>🧪 Contrôles exécutés ({r.checks.filter(c => c.status === 'passed' || c.status === 'failed').length}/{r.checks.length})</summary>
        <ul style={{ listStyle: 'none', margin: 0, padding: '0 14px 12px' }}>
          {r.checks.map(c => {
            const [ic, n, coul] = ÉTAT_CONTRÔLE[c.status] || ÉTAT_CONTRÔLE.pending
            return (
              <li key={c.id} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                <Puce couleur={coul} style={{ marginRight: 6 }}>{ic} {n}</Puce>{c.name}
                {c.partial && <Puce couleur="#7c3aed" style={{ marginLeft: 6 }}>partiel</Puce>}
                {c.reason && <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2, wordBreak: 'break-word' }}>{c.reason}</div>}
              </li>
            )
          })}
        </ul>
      </details>

      <div style={S.carte}>
        <p style={S.étiquette}>Filtrer ({vus.length}/{r.findings.length})</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {GRAVITÉS.map(sev => <button key={sev} aria-pressed={gravités.has(sev)} onClick={() => basculer(sev)} style={{ ...S.puce(gravités.has(sev)), ...(gravités.has(sev) ? { background: GRAVITÉ[sev].couleur, borderColor: GRAVITÉ[sev].couleur, color: '#fff' } : {}) }}>{GRAVITÉ[sev].nom} {nb(sev)}</button>)}
          <button aria-pressed={bloquants} onClick={() => setBloquants(b => !b)} style={S.puce(bloquants)}>⛔ Bloquants seulement</button>
        </div>
        <input value={texte} onChange={e => setTexte(e.target.value)} placeholder="Règle, fichier, ressource…" aria-label="Rechercher dans les constats" style={{ ...S.champ, marginTop: 8, fontFamily: 'inherit' }} />
      </div>

      {groupes.length === 0 && <div style={S.carte}><p style={{ margin: 0, color: T.textMuted }}>{r.findings.length ? 'Aucun constat avec ces filtres.' : 'Aucun constat.'}</p></div>}
      {groupes.map(([fichier, liste]) => (
        <section key={fichier} aria-label={`Fichier ${fichier}`} style={{ marginBottom: 10 }}>
          <p style={{ margin: '14px 2px 6px', fontFamily: mono, fontWeight: 800, fontSize: 14, wordBreak: 'break-all' }}>📄 {fichier} <span style={{ color: T.textMuted, fontWeight: 400 }}>· {liste.length}</span></p>
          {liste.map(f => <Constat key={f.id} f={f} T={T} />)}
        </section>
      ))}

      {(r.suppressed || []).length > 0 && (
        <details style={S.carte}><summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 800 }}>🙈 Ignorés volontairement ({r.suppressed.length})</summary>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13.5 }}>{r.suppressed.map(f => <li key={f.id}><code>{f.rule_id}</code> {f.file}:{f.line} — {f.suppression_reason}</li>)}</ul>
        </details>
      )}
      {r.scope && (
        <details style={S.carte}>
          <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 800 }}>🔭 Périmètre de l’analyse</summary>
          <p style={{ margin: '8px 0 4px', fontSize: 13.5 }}><strong>Vérifié dans l’outil :</strong></p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{r.scope.covered.map(x => <li key={x}>{x}</li>)}</ul>
          <p style={{ margin: '8px 0 4px', fontSize: 13.5 }}><strong>Non vérifiable sans exécuter Terraform ni accès AWS :</strong></p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{r.scope.not_covered.map(x => <li key={x}>{x}</li>)}</ul>
        </details>
      )}
      <details style={S.carte}>
        <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 800 }}>📦 Inventaire du projet</summary>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>
          <div>Fichiers : {inv.files?.tf ?? 0} .tf · {inv.files?.tfvars ?? 0} .tfvars{inv.backend ? ` · backend ${inv.backend}` : ''}{inv.required_version ? ` · Terraform ${inv.required_version}` : ''}</div>
          {(inv.roots || []).length > 0 && <div>Modules racines : {inv.roots.join(' · ')}</div>}
          {(inv.providers || []).length > 0 && <div>Providers : {inv.providers.map(p => `${p.source || p.name} ${p.versions.join(', ')}`).join(' · ')}</div>}
          <div>Ressources : {Object.entries(inv.resources_by_type || {}).map(([t, n]) => `${t} ×${n}`).join(' · ') || 'aucune'}</div>
          {(inv.variables || []).length > 0 && <div>Variables : {inv.variables.map(v => `${v.name}${v.required ? '*' : ''}${v.sensitive ? ' 🔒' : ''}${v.value_source ? ` (${v.value_source})` : ' (sans valeur)'}`).join(' · ')}</div>}
          <div style={{ color: T.textMuted }}>Référentiels : {Object.entries(r.environment || {}).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ')}</div>
        </div>
      </details>
      {(r.notes || []).length > 0 && <div style={S.carte}><p style={S.étiquette}>Notes</p><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{r.notes.map(n => <li key={n}>{n}</li>)}</ul></div>}
    </>
  )
}

export default function TerraformPrePlan({ T, S }) {
  const [mode, setMode] = useState('dossier')
  const [projet, setProjet] = useState(null) // { nom, fichiers, relire? }
  const [code, setCode] = useState(CODE_DÉPART)
  const [codeVars, setCodeVars] = useState('')
  const [seuil, setSeuil] = useState('HIGH')
  const [choisis, setChoisis] = useState([])
  const [externes, setExternes] = useState('')
  const [progression, setProgression] = useState(null)
  const [rapport, setRapport] = useState(null)
  const [erreur, setErreur] = useState('')
  const [occupé, setOccupé] = useState(false)
  const [msgRelance, setMsgRelance] = useState('')
  const [survol, setSurvol] = useState(false)
  const dossierInput = useRef(null)
  const fichiersInput = useRef(null)

  const infos = useMemo(() => (projet ? résuméFichiers(projet.fichiers) : null), [projet])
  const tfvarsFacultatifs = infos ? infos.tfvars.filter(p => !/(^|\/)(terraform\.tfvars(\.json)?|[^/]+\.auto\.tfvars(\.json)?)$/.test(p)) : []

  function charger(nom, fichiers, relire = null) {
    setErreur('')
    setRapport(null)
    setMsgRelance('')
    setChoisis([])
    if (!fichiers.some(f => /\.tf(\.json)?$/.test(f.path))) { setProjet(null); setErreur('Aucun fichier .tf trouvé (les dossiers .terraform, .git et les fichiers d’état sont ignorés).'); return }
    setProjet({ nom, fichiers, relire })
  }

  async function choisirDossier() {
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const h = await window.showDirectoryPicker({ mode: 'read' })
        const lire = () => lireRépertoire(h)
        charger(h.name, await lire(), lire)
      } catch (e) {
        if (e.name !== 'AbortError') setErreur(e.message)
      }
    } else dossierInput.current?.click()
  }

  async function lancer(source = null) {
    const p = source || (mode === 'coller' ? { nom: 'code collé', fichiers: [{ path: 'main.tf', content: code }, ...(codeVars.trim() ? [{ path: 'terraform.tfvars', content: codeVars }] : [])] } : projet)
    if (!p) return
    setErreur('')
    setOccupé(true)
    setRapport(null)
    setProgression({ étapes: {}, pourcent: 1 })
    try {
      const options = {
        seuil, nomProjet: p.nom, fichiersVariables: choisis,
        variablesExternes: externes.split(/[\s,;]+/).map(x => x.replace(/^TF_VAR_/, '')).filter(Boolean),
      }
      const r = await analyserDansLeNavigateur(p.fichiers, options, ev => setProgression(pr => ({ étapes: { ...pr?.étapes, [ev.step]: ev.state }, pourcent: Math.max(pr?.pourcent || 0, ev.percent || 0) })))
      setProgression(pr => ({ ...pr, pourcent: 100 }))
      setRapport(r)
    } catch (e) {
      setErreur(`Analyse impossible : ${e.message}`)
    } finally {
      setOccupé(false)
    }
  }

  async function relancer() {
    setMsgRelance('')
    if (mode === 'coller') return lancer()
    if (projet?.relire) {
      try {
        const fichiers = await projet.relire()
        const p = { ...projet, fichiers }
        setProjet(p)
        return lancer(p)
      } catch (e) {
        setMsgRelance(`Relecture impossible : ${e.message}`)
        return null
      }
    }
    setMsgRelance('Ce navigateur ne permet pas de relire le dossier : choisis-le à nouveau (ou utilise Chrome/Edge sur ordinateur).')
    return null
  }

  async function exemple() {
    const { default: fichiers } = await import('../../lib/tfpv/exempleProjet.js')
    setMode('dossier')
    charger('exemple-aws', fichiers)
    lancer({ nom: 'exemple-aws', fichiers })
  }

  async function ouvrirRapport(f) {
    setErreur('')
    try {
      const d = JSON.parse(await f.text())
      if (!estRapport(d)) throw new Error('Ce fichier n’est pas un rapport exporté par l’outil.')
      setProgression(null)
      setRapport(d)
    } catch (e) {
      setErreur(e instanceof SyntaxError ? 'JSON illisible.' : e.message)
    }
  }

  const prêt = !occupé && (mode === 'coller' ? code.trim() : projet)
  return (
    <>
      <div style={S.carte}>
        <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 800, fontSize: 17 }}>🛡️ Validation Terraform avant <code>plan</code></p>
        <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: T.textMuted }}>
          Tout se passe ici, dans l’outil : rien à installer, <strong>aucun fichier envoyé</strong>. L’analyse reprend les références des vrais outils : schéma officiel du provider AWS (ce que vérifie <code>terraform validate</code>), règles AWS de TFLint, politiques de sécurité équivalentes à Checkov, et des contrôles que ces outils ne font pas avant <code>plan</code> (variables, CIDR, EBS, RDS, IAM…).
        </p>
      </div>

      <div style={S.carte}>
        <p style={S.étiquette}>1 · Projet Terraform</p>
        <div role="tablist" aria-label="Source" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['dossier', '📁 Dossier ou fichiers'], ['coller', '✍️ Coller du code'], ['rapport', '📄 Ouvrir un rapport']].map(([id, nom]) => <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)} style={S.puce(mode === id)}>{nom}</button>)}
        </div>
        {mode === 'dossier' && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setSurvol(true) }} onDragLeave={() => setSurvol(false)}
              onDrop={async e => { e.preventDefault(); setSurvol(false); try { const f = await lireDépôt(e.dataTransfer); charger(e.dataTransfer.items?.[0]?.webkitGetAsEntry?.()?.name || 'projet', f) } catch (x) { setErreur(x.message) } }}
              style={{ border: `2px dashed ${survol ? T.accent : T.border}`, borderRadius: 12, padding: 14, textAlign: 'center', background: survol ? T.accentSoft : 'transparent' }}>
              <p style={{ margin: '0 0 10px', fontSize: 14, color: T.textMuted }}>Dépose ici un dossier, des fichiers .tf / .tfvars ou une archive .zip</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                <button onClick={choisirDossier} style={S.puce(true)}>📁 Choisir un dossier</button>
                <button onClick={() => fichiersInput.current?.click()} style={S.puce(false)}>📄 Fichiers ou .zip</button>
                <button onClick={exemple} style={S.puce(false)}>🧪 Essayer un exemple</button>
              </div>
              <input ref={dossierInput} type="file" webkitdirectory="" directory="" multiple onChange={async e => { const l = e.target.files; if (l?.length) { try { charger((l[0].webkitRelativePath || '').split('/')[0] || 'projet', await lireFichiers([...l])) } catch (x) { setErreur(x.message) } } e.target.value = '' }} aria-label="Dossier Terraform" style={{ display: 'none' }} />
              <input ref={fichiersInput} type="file" multiple accept=".tf,.tfvars,.json,.zip" onChange={async e => { const l = e.target.files; if (l?.length) { try { charger(l.length === 1 ? l[0].name.replace(/\.zip$/i, '') : 'fichiers', await lireFichiers([...l])) } catch (x) { setErreur(x.message) } } e.target.value = '' }} aria-label="Fichiers Terraform" style={{ display: 'none' }} />
            </div>
            {projet && infos && (
              <div style={{ marginTop: 10, fontSize: 14 }}>
                <strong>{projet.nom}</strong> : {infos.tf} fichier(s) .tf, {infos.tfvars.length} .tfvars{projet.relire ? ' · relu à chaque relance' : ''}
                <details style={{ marginTop: 4 }}><summary style={{ cursor: 'pointer', color: T.textMuted, fontSize: 13 }}>Voir les fichiers</summary>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12.5, fontFamily: mono, wordBreak: 'break-all' }}>{projet.fichiers.slice(0, 200).map(f => <li key={f.path}>{f.path}</li>)}</ul>
                </details>
              </div>
            )}
          </>
        )}
        {mode === 'coller' && (
          <>
            <label style={{ fontSize: 13, color: T.textMuted }}>main.tf
              <textarea value={code} onChange={e => setCode(e.target.value)} rows={12} spellCheck={false} aria-label="Code Terraform" style={{ ...S.champ, resize: 'vertical', marginTop: 4 }} />
            </label>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13.5 }}>terraform.tfvars (facultatif)</summary>
              <textarea value={codeVars} onChange={e => setCodeVars(e.target.value)} rows={4} spellCheck={false} aria-label="Valeurs des variables" style={{ ...S.champ, resize: 'vertical', marginTop: 6 }} />
            </details>
          </>
        )}
        {mode === 'rapport' && (
          <div style={{ fontSize: 14 }}>
            <p style={{ margin: '0 0 8px', color: T.textMuted }}>Rouvre un rapport JSON exporté depuis l’outil (⬇️ JSON).</p>
            <input type="file" accept=".json,application/json" onChange={e => e.target.files?.[0] && ouvrirRapport(e.target.files[0])} aria-label="Rapport JSON" style={{ fontSize: 14, maxWidth: '100%' }} />
          </div>
        )}
      </div>

      {mode !== 'rapport' && (
        <div style={S.carte}>
          <p style={S.étiquette}>2 · Réglages</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 14 }}>
            <label>Échec à partir de{' '}
              <select value={seuil} onChange={e => setSeuil(e.target.value)} style={{ ...S.champ, width: 'auto', minHeight: 36, fontFamily: 'inherit' }}>
                {GRAVITÉS.map(g => <option key={g} value={g}>{GRAVITÉ[g].nom}</option>)}
              </select>
            </label>
          </div>
          {mode === 'dossier' && tfvarsFacultatifs.length > 0 && (
            <fieldset style={{ border: `1px solid ${T.border}`, borderRadius: 10, marginTop: 10, padding: '6px 10px' }}>
              <legend style={{ fontSize: 13, color: T.textMuted }}>Fichiers de variables utilisés au plan (-var-file)</legend>
              {tfvarsFacultatifs.map(p => <label key={p} style={{ display: 'block', fontSize: 13.5, fontFamily: mono, wordBreak: 'break-all' }}><input type="checkbox" checked={choisis.includes(p)} onChange={e => setChoisis(c => (e.target.checked ? [...c, p] : c.filter(x => x !== p)))} /> {p}</label>)}
            </fieldset>
          )}
          <label style={{ display: 'block', marginTop: 10, fontSize: 13, color: T.textMuted }}>Variables fournies par la CI (TF_VAR_…), séparées par des virgules
            <input value={externes} onChange={e => setExternes(e.target.value)} placeholder="ex. db_password, environment" aria-label="Variables fournies par la CI" style={{ ...S.champ, marginTop: 4, fontFamily: 'inherit' }} />
          </label>
          <button onClick={() => lancer()} disabled={!prêt} style={{ ...S.puce(true), minHeight: 46, fontSize: 16, marginTop: 12, padding: '0 22px', opacity: prêt ? 1 : 0.5 }}>{occupé ? 'Analyse en cours…' : '▶ Analyser'}</button>
          {!projet && mode === 'dossier' && <span style={{ marginLeft: 8, fontSize: 13, color: T.textMuted }}>Choisis d’abord un projet.</span>}
        </div>
      )}
      {erreur && <div role="alert" style={{ ...S.carte, borderColor: T.danger }}><p style={{ margin: 0, fontSize: 14, color: T.danger }}>{erreur}</p></div>}

      {progression && (
        <div style={S.carte} aria-live="polite">
          <p style={S.étiquette}>3 · Analyse {occupé ? 'en cours' : 'terminée'}</p>
          <div role="progressbar" aria-valuenow={progression.pourcent} aria-valuemin={0} aria-valuemax={100} aria-label="Progression" style={{ height: 10, borderRadius: 6, background: T.bg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ width: `${progression.pourcent}%`, height: '100%', background: T.accent, transition: 'width .3s' }} />
          </div>
          <ol style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none', fontSize: 13.5 }}>
            {ÉTAPES.map(([id, label]) => { const é = progression.étapes[id]; return <li key={id} style={{ padding: '2px 0', color: é ? T.text : T.textMuted }}>{é === 'done' ? '✓' : é === 'running' ? '⏳' : '·'} {label}</li> })}
          </ol>
        </div>
      )}

      {rapport && <Résultats key={rapport.generated_at + rapport.project?.name} r={rapport} T={T} S={S} onRelancer={mode !== 'rapport' ? relancer : null} relance={{ occupé, message: msgRelance, libellé: mode === 'coller' ? 'Relancer avec le code modifié' : 'Relancer après correction' }} />}
    </>
  )
}
