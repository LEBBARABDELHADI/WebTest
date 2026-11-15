// Outil « Terraform · TFLint » : validation d'une configuration Terraform avant
// terraform plan, par le moteur local tfpv (terraform fmt/init/validate,
// TFLint terraform + AWS, Checkov, contrôles AWS de cohérence).
// Sur téléphone, ou sans moteur : ouverture d'un rapport JSON (CI) ou exemple.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { grotesk } from '../../lib/theme'
import {
  CATÉGORIES, ÉTAPES, ÉTAT_CONTRÔLE, GRAVITÉ, GRAVITÉS, MOTEUR_DÉFAUT, NIVEAU, STATUTS, appel, connexionMémorisée, estRapport,
  fichiersUtiles, filtrer, lireFichiers, mémoriserConnexion, parFichier, rapportHtml, résumé, télécharger, urlMoteurValide, valeurTexte,
} from '../../lib/tfpv/client'

const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

function Puce({ couleur, children, style }) {
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, background: `${couleur}22`, color: couleur, fontFamily: grotesk, fontWeight: 800, fontSize: 12.5, whiteSpace: 'nowrap', ...style }}>{children}</span>
}

function Copier({ texte, T, libellé = '📋' }) {
  const [ok, setOk] = useState(false)
  return <button onClick={() => { navigator.clipboard?.writeText(texte); setOk(true); setTimeout(() => setOk(false), 1200) }} aria-label="Copier" style={{ minHeight: 32, padding: '0 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: ok ? '#2e9e6b' : T.text, cursor: 'pointer', fontSize: 13 }}>{ok ? '✓ copié' : libellé}</button>
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
        <p style={{ margin: '6px 0', fontSize: 12.5, color: T.textMuted, wordBreak: 'break-word' }}>Message du moteur : {f.message}</p>
        {(f.references || []).map(u => <div key={u} style={{ fontSize: 13, wordBreak: 'break-all' }}><a href={u} target="_blank" rel="noreferrer">📖 {u}</a></div>)}
      </div>
    </details>
  )
}

function Résultats({ r, T, S, onRelancer, peutRelancer }) {
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
          <button onClick={() => télécharger(`tfpv-${r.project?.name || 'rapport'}.json`, JSON.stringify(r, null, 2), 'application/json')} style={S.puce(false)}>⬇️ JSON</button>
          <button onClick={() => télécharger(`tfpv-${r.project?.name || 'rapport'}.html`, rapportHtml(r), 'text/html')} style={S.puce(false)}>⬇️ HTML</button>
          <Copier texte={résumé(r)} T={T} libellé="📋 Résumé" />
          {peutRelancer && <button onClick={onRelancer} style={S.puce(true)}>🔁 Relancer après correction</button>}
        </div>
      </div>

      <details style={{ ...S.carte, padding: 0 }}>
        <summary style={{ cursor: 'pointer', padding: 14, fontFamily: grotesk, fontWeight: 800 }}>🧪 Contrôles exécutés ({r.checks.filter(c => c.status === 'passed' || c.status === 'failed').length}/{r.checks.length})</summary>
        <ul style={{ listStyle: 'none', margin: 0, padding: '0 14px 12px' }}>
          {r.checks.map(c => {
            const [ic, nom, coul] = ÉTAT_CONTRÔLE[c.status] || ÉTAT_CONTRÔLE.pending
            return (
              <li key={c.id} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                <Puce couleur={coul} style={{ marginRight: 6 }}>{ic} {nom}</Puce>{c.name} <Puce couleur={T.textMuted}>{NIVEAU[c.tier] || c.tier}</Puce>
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
      <details style={S.carte}>
        <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 800 }}>📦 Inventaire du projet</summary>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>
          <div>Fichiers : {inv.files?.tf ?? 0} .tf · {inv.files?.tfvars ?? 0} .tfvars{inv.files?.lock_file ? ' · .terraform.lock.hcl' : ''}{inv.backend ? ` · backend ${inv.backend}` : ''}{inv.required_version ? ` · Terraform ${inv.required_version}` : ''}</div>
          {(inv.providers || []).length > 0 && <div>Providers : {inv.providers.map(p => `${p.source || p.name} ${p.versions.join(', ')}`).join(' · ')}</div>}
          <div>Ressources : {Object.entries(inv.resources_by_type || {}).map(([t, n]) => `${t} ×${n}`).join(' · ') || 'aucune'}</div>
          {(inv.variables || []).length > 0 && <div>Variables : {inv.variables.map(v => `${v.name}${v.required ? '*' : ''}${v.sensitive ? ' 🔒' : ''}${v.value_source ? ` (${v.value_source})` : ' (sans valeur)'}`).join(' · ')}</div>}
          {(inv.modules || []).length > 1 && <div>Modules : {inv.modules.map(m => m.dir).join(' · ')}</div>}
          <div style={{ color: T.textMuted }}>Moteurs : {Object.entries(r.environment || {}).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ')}</div>
        </div>
      </details>
      {(r.notes || []).length > 0 && <div style={S.carte}><p style={S.étiquette}>Notes</p><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{r.notes.map(n => <li key={n}>{n}</li>)}</ul></div>}
    </>
  )
}

export default function TerraformPrePlan({ T, S }) {
  const [params, setParams] = useSearchParams()
  const [moteur, setMoteur] = useState(() => params.get('moteur') || connexionMémorisée().moteur)
  const [jeton, setJeton] = useState(() => params.get('jeton') || connexionMémorisée().jeton)
  const [santé, setSanté] = useState(null)
  const [connexion, setConnexion] = useState('aucune')
  const [erreurConnexion, setErreurConnexion] = useState('')
  const [source, setSource] = useState('dossier')
  const [dossier, setDossier] = useState(null)
  const [chemin, setChemin] = useState('')
  const [options, setOptions] = useState({ fail_on: 'HIGH', offline: false, aws_checks: false })
  const [job, setJob] = useState(null)
  const [rapport, setRapport] = useState(null)
  const [erreur, setErreur] = useState('')
  const [occupé, setOccupé] = useState(false)
  const suivi = useRef(null)
  const dernierEnvoi = useRef(null)
  const dossierInput = useRef(null)

  async function connecter(url = moteur, clé = jeton) {
    setErreurConnexion('')
    if (!urlMoteurValide(url)) { setConnexion('erreur'); setErreurConnexion('Adresse refusée : le moteur doit tourner sur ce poste (http://127.0.0.1:<port>).'); return }
    if (!clé.trim()) { setConnexion('erreur'); setErreurConnexion('Colle le jeton affiché par « tfpv serve ».'); return }
    setConnexion('en-cours')
    try {
      const h = await appel(url, clé.trim(), '/api/health')
      setSanté(h)
      setConnexion('ok')
      mémoriserConnexion(url, clé.trim())
    } catch (e) {
      setConnexion('erreur')
      setErreurConnexion(e.message)
    }
  }

  // Lien affiché par `tfpv serve` : #/outils/pro?outil=tfpv&moteur=…&jeton=…
  // (y compris quand la page est déjà ouverte). Le jeton est retiré de
  // l'adresse aussitôt lu ; il n'est gardé que pour l'onglet (sessionStorage).
  const jetonUrl = params.get('jeton')
  const moteurUrl = params.get('moteur')
  useEffect(() => {
    if (!jetonUrl && !moteurUrl) return
    const p = new URLSearchParams(params)
    p.delete('jeton')
    p.delete('moteur')
    setParams(p, { replace: true })
    const m = moteurUrl || moteur
    const k = jetonUrl || jeton
    Promise.resolve().then(() => {
      setMoteur(m)
      setJeton(k)
      connecter(m, k)
    })
  }, [jetonUrl, moteurUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!params.get('jeton') && connexionMémorisée().jeton) Promise.resolve().then(() => connecter())
    return () => suivi.current?.abort()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function suivre(id) {
    suivi.current?.abort()
    const ctrl = new AbortController()
    suivi.current = ctrl
    try {
      while (!ctrl.signal.aborted) {
        const j = await appel(moteur, jeton.trim(), `/api/scans/${id}`, { signal: ctrl.signal })
        setJob(j)
        if (j.state === 'done' || j.state === 'error') {
          if (j.report) setRapport(j.report)
          if (j.error) setErreur(j.error)
          break
        }
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (e) {
      if (e.name !== 'AbortError') setErreur(e.message)
    } finally {
      setOccupé(false)
    }
  }

  async function lancer() {
    setErreur('')
    setRapport(null)
    setOccupé(true)
    try {
      let corps
      if (source === 'chemin') {
        corps = { source: { type: 'path', path: chemin.trim() }, options }
      } else {
        const files = await lireFichiers(dossier.garder)
        corps = { source: { type: 'files', files, label: dossier.nom }, options }
      }
      dernierEnvoi.current = source
      setJob({ id: null, state: 'queued', steps: (santé?.steps || []).map(s => ({ ...s, state: 'pending' })), progress: {} })
      const { id } = await appel(moteur, jeton.trim(), '/api/scans', { méthode: 'POST', corps })
      await suivre(id)
    } catch (e) {
      setOccupé(false)
      setErreur(e.name === 'NotReadableError' ? 'Les fichiers ont changé depuis leur sélection : choisis à nouveau le dossier.' : e.message)
    }
  }

  async function relancer() {
    if (dernierEnvoi.current === 'chemin' && job?.id) {
      setErreur('')
      setRapport(null)
      setOccupé(true)
      try {
        const { id } = await appel(moteur, jeton.trim(), `/api/scans/${job.id}/rerun`, { méthode: 'POST' })
        await suivre(id)
      } catch (e) {
        setOccupé(false)
        setErreur(e.message)
      }
    } else {
      await lancer()
    }
  }

  function choisirDossier(liste) {
    const tri = fichiersUtiles([...liste])
    const premier = tri.garder[0]?.webkitRelativePath || ''
    setDossier({ ...tri, nom: premier.split('/')[0] || 'projet' })
  }

  async function ouvrirRapport(fichier) {
    setErreur('')
    try {
      const d = JSON.parse(await fichier.text())
      if (!estRapport(d)) throw new Error('Ce fichier n’est pas un rapport tfpv (JSON produit par « tfpv scan -f json »).')
      setJob(null)
      setRapport(d)
    } catch (e) {
      setErreur(e instanceof SyntaxError ? 'JSON illisible.' : e.message)
    }
  }

  async function exemple() {
    setErreur('')
    const m = await import('../../lib/tfpv/exempleRapport.json')
    setJob(null)
    setRapport(m.default)
  }

  const prêt = connexion === 'ok' && !occupé && (source === 'chemin' ? chemin.trim() : dossier?.nbTerraform > 0)
  const pct = job?.state === 'done' || job?.state === 'error' ? 100 : (job?.progress?.percent || (job ? 4 : 0))
  const outils = santé?.tools || {}
  return (
    <>
      <div style={S.carte}>
        <p style={{ margin: 0, fontFamily: grotesk, fontWeight: 800, fontSize: 17 }}>🛡️ Validation Terraform avant <code>plan</code></p>
        <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: T.textMuted }}>
          Le moteur <strong>tfpv</strong> tourne sur ton poste : <code>terraform fmt</code>, <code>init -backend=false</code>, <code>validate</code>, TFLint (règles terraform + AWS), Checkov et des contrôles AWS que ces outils ne font pas (CIDR, EBS, RDS, IAM…). Jamais de <code>plan</code> ni d’<code>apply</code>, aucun fichier modifié. Sur téléphone : ouvre un rapport JSON produit en CI.
        </p>
      </div>

      <div style={S.carte}>
        <p style={S.étiquette}>1 · Moteur local</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
          <input value={moteur} onChange={e => setMoteur(e.target.value)} aria-label="Adresse du moteur" placeholder={MOTEUR_DÉFAUT} style={S.champ} />
          <input value={jeton} onChange={e => setJeton(e.target.value)} aria-label="Jeton du moteur" type="password" placeholder="Jeton affiché par tfpv serve" autoComplete="off" style={S.champ} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button onClick={() => connecter()} disabled={connexion === 'en-cours'} style={S.puce(connexion !== 'ok')}>{connexion === 'en-cours' ? 'Connexion…' : connexion === 'ok' ? '✓ Connecté' : 'Se connecter'}</button>
          {connexion === 'ok' && Object.entries(outils).map(([nom, t]) => <Puce key={nom} couleur={t.available ? '#15803d' : '#64748b'}>{t.available ? '✓' : '–'} {nom} {t.version || ''}{t.detail && nom === 'tflint' ? ` (${t.detail})` : ''}</Puce>)}
        </div>
        {erreurConnexion && <p role="alert" style={{ margin: '8px 0 0', fontSize: 13.5, color: T.danger }}>{erreurConnexion}</p>}
        {connexion !== 'ok' && (
          <details style={{ marginTop: 8, fontSize: 13.5 }}>
            <summary style={{ cursor: 'pointer' }}>Installer et lancer le moteur</summary>
            <pre style={{ margin: '6px 0', padding: 10, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, overflowX: 'auto', fontSize: 12.5, fontFamily: mono }}>{`pip install ./terraform-preplan-validator
pipx install checkov        # + terraform et tflint dans le PATH
tflint --init               # (une fois) ruleset AWS
tfpv doctor
tfpv serve --root ~/infra   # affiche le jeton et un lien vers cette page`}</pre>
          </details>
        )}
        {connexion === 'ok' && santé?.root && <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.textMuted, wordBreak: 'break-all' }}>Scans par chemin autorisés sous {santé.root}</p>}
      </div>

      <div style={S.carte}>
        <p style={S.étiquette}>2 · Projet Terraform</p>
        <div role="tablist" aria-label="Source" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['dossier', '📁 Envoyer un dossier'], ['chemin', '🗂️ Chemin sur le poste'], ['rapport', '📄 Ouvrir un rapport']].map(([id, nom]) => <button key={id} role="tab" aria-selected={source === id} onClick={() => setSource(id)} style={S.puce(source === id)}>{nom}</button>)}
        </div>
        {source === 'dossier' && (
          <>
            <input ref={dossierInput} type="file" webkitdirectory="" directory="" multiple onChange={e => e.target.files?.length && choisirDossier(e.target.files)} aria-label="Dossier Terraform" style={{ fontSize: 14, maxWidth: '100%' }} />
            {dossier && <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>{dossier.nom} : {dossier.nbTerraform} fichier(s) .tf, {dossier.garder.length} envoyé(s){dossier.ignorés.length ? `, ${dossier.ignorés.length} ignoré(s) (.terraform, .git, états, binaires…)` : ''}</p>}
            {dossier && dossier.nbTerraform === 0 && <p role="alert" style={{ margin: '6px 0 0', fontSize: 13.5, color: T.danger }}>Aucun fichier .tf dans ce dossier.</p>}
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textMuted }}>Les fichiers vont uniquement au moteur local (127.0.0.1), qui les efface après l’analyse.</p>
          </>
        )}
        {source === 'chemin' && <input value={chemin} onChange={e => setChemin(e.target.value)} placeholder="ex. environments/prod" aria-label="Chemin du projet sur le poste" style={S.champ} />}
        {source === 'rapport' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input type="file" accept=".json,application/json" onChange={e => e.target.files?.[0] && ouvrirRapport(e.target.files[0])} aria-label="Rapport JSON" style={{ fontSize: 14, maxWidth: '100%' }} />
            <button onClick={exemple} style={S.puce(false)}>Voir un exemple réel</button>
          </div>
        )}
        {source !== 'rapport' && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 10, fontSize: 14 }}>
              <label>Échec à partir de{' '}
                <select value={options.fail_on} onChange={e => setOptions(o => ({ ...o, fail_on: e.target.value }))} style={{ ...S.champ, width: 'auto', minHeight: 36, fontFamily: 'inherit' }}>
                  {GRAVITÉS.map(g => <option key={g} value={g}>{GRAVITÉ[g].nom}</option>)}
                </select>
              </label>
              <label><input type="checkbox" checked={options.offline} onChange={e => setOptions(o => ({ ...o, offline: e.target.checked }))} /> Hors ligne (sans init)</label>
              <label><input type="checkbox" checked={options.aws_checks} onChange={e => setOptions(o => ({ ...o, aws_checks: e.target.checked }))} disabled={!outils.aws?.available} /> Contrôles via l’API AWS{outils.aws?.available ? '' : ' (AWS CLI absente)'}</label>
            </div>
            <button onClick={lancer} disabled={!prêt} style={{ ...S.puce(true), minHeight: 46, fontSize: 16, marginTop: 12, padding: '0 22px', opacity: prêt ? 1 : 0.5 }}>{occupé ? 'Analyse en cours…' : '▶ Scan'}</button>
            {connexion !== 'ok' && <span style={{ marginLeft: 8, fontSize: 13, color: T.textMuted }}>Connecte d’abord le moteur.</span>}
          </>
        )}
        {erreur && <p role="alert" style={{ margin: '10px 0 0', fontSize: 14, color: T.danger }}>{erreur}</p>}
      </div>

      {job && (
        <div style={S.carte} aria-live="polite">
          <p style={S.étiquette}>3 · Analyse {job.state === 'done' ? 'terminée' : job.state === 'error' ? 'interrompue' : 'en cours'}</p>
          <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progression" style={{ height: 10, borderRadius: 6, background: T.bg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: job.state === 'error' ? T.danger : T.accent, transition: 'width .4s' }} />
          </div>
          <ol style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none', fontSize: 13.5 }}>
            {(job.steps || []).map(s => <li key={s.id} style={{ padding: '2px 0', color: s.state === 'pending' ? T.textMuted : T.text }}>{s.state === 'done' ? '✓' : s.state === 'running' ? '⏳' : '·'} {ÉTAPES[s.id] || s.label}</li>)}
          </ol>
        </div>
      )}

      {rapport && <Résultats key={rapport.generated_at + rapport.project?.name} r={rapport} T={T} S={S} onRelancer={relancer} peutRelancer={connexion === 'ok' && !!job && !occupé} />}
    </>
  )
}
