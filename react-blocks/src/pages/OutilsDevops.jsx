import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import yaml from 'js-yaml'
import Icon from '../components/Icon'
import BlocCode from '../components/BlocCode'
import PanneauSync from '../components/PanneauSync'
import { BoutonIcone } from '../components/UI'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, foyerDeLEspace } from '../lib/foyers'
import { useDonnéesSynchronisées } from '../lib/synchro'
import {
  analyserCidr, découperCidr, analyserCron, chmodDepuisOctal, chmodDepuisSymbolique, chmodOctal, chmodSymbolique,
  base64Encoder, base64Décoder, décoderJwt, analyserHorodatage, variablesDe, remplir, EXEMPLES_COMMANDES,
} from '../lib/outilsDevops'
import { analyserManifestes } from '../lib/k8sExplication'
import { lirePlan, ACTIONS } from '../lib/terraformPlan'
import { analyserDockerfile } from '../lib/dockerfile'
import { analyserGitlabCi, MOTS_CLÉS } from '../lib/gitlabCi'
import { testerLogs, EXEMPLES_LOGS } from '../lib/logs'

// Outils DevOps : boîte à outils (calculs dans le navigateur, rien n'est
// envoyé) et coffre de commandes à variables (synchronisé avec le dépôt
// privé, par espace).

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const OUTILS = [['k8s', '☸️ YAML Kubernetes'], ['tfplan', '🏗️ Plan Terraform'], ['docker', '🐳 Dockerfile'], ['gitlab', '🦊 GitLab CI'], ['logs', '🔎 Logs (regex / grok)'], ['cidr', '🌐 CIDR'], ['cron', '⏰ Cron'], ['chmod', '🔐 chmod'], ['base64', '🔤 Base64'], ['jwt', '🎫 JWT'], ['temps', '🕒 Horodatage'], ['json', '🧾 JSON / YAML']]
const compléterCommandes = d => ({
  commandes: Array.isArray(d?.commandes) ? d.commandes : [],
  profils: Array.isArray(d?.profils) && d.profils.length ? d.profils : [{ id: 'dev', nom: 'dev', valeurs: {} }, { id: 'prod', nom: 'prod', valeurs: {} }],
  profilActif: d?.profilActif || 'dev',
})

function useStyles(T) {
  return {
    carte: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 12 },
    champ: { width: '100%', boxSizing: 'border-box', minHeight: 42, padding: '8px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 15, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
    puce: actif => ({ minHeight: 38, padding: '0 12px', borderRadius: 19, border: `1px solid ${actif ? T.accent : T.border}`, background: actif ? T.accent : T.surface, color: actif ? T.accentText : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', whiteSpace: 'nowrap' }),
    étiquette: { fontFamily: grotesk, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' },
  }
}
function Ligne({ T, nom, valeur, copier = true }) {
  const [ok, setOk] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ flex: '0 0 42%', fontSize: 13.5, color: T.textMuted }}>{nom}</span>
      <code style={{ flex: 1, minWidth: 0, fontSize: 14, wordBreak: 'break-all', color: T.text }}>{valeur}</code>
      {copier && <button onClick={() => { navigator.clipboard?.writeText(String(valeur)); setOk(true); setTimeout(() => setOk(false), 1200) }} aria-label={`Copier ${nom}`} style={{ minWidth: 36, minHeight: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: ok ? '#2e9e6b' : T.text, cursor: 'pointer' }}>{ok ? '✓' : '📋'}</button>}
    </div>
  )
}

function OutilCidr({ T, S }) {
  const [cidr, setCidr] = useState('10.0.0.0/24')
  const [découpe, setDécoupe] = useState(26)
  const a = analyserCidr(cidr)
  const d = !a.erreur ? découperCidr(cidr, découpe) : null
  return (
    <div style={S.carte}>
      <p style={S.étiquette}>Adresse / préfixe</p>
      <input value={cidr} onChange={e => setCidr(e.target.value)} aria-label="Bloc CIDR" style={S.champ} placeholder="10.0.0.0/24" />
      {a.erreur ? <p style={{ color: T.danger }}>{a.erreur}</p> : (
        <div style={{ marginTop: 10 }}>
          {!a.aligné && <p style={{ fontSize: 13, color: '#b07400', margin: '0 0 6px' }}>⚠️ L'adresse n'est pas le début du bloc : le réseau est {a.réseau}/{a.préfixe}.</p>}
          <Ligne T={T} nom="Réseau" valeur={`${a.réseau}/${a.préfixe}`} />
          <Ligne T={T} nom="Masque" valeur={a.masque} />
          <Ligne T={T} nom="Masque inverse (joker)" valeur={a.joker} />
          <Ligne T={T} nom="Plage" valeur={`${a.réseau} → ${a.diffusion}`} />
          <Ligne T={T} nom="Adresses au total" valeur={a.taille.toLocaleString('fr-FR')} copier={false} />
          <Ligne T={T} nom="Utilisables (réseau classique)" valeur={`${a.utilisables.toLocaleString('fr-FR')} (${a.premièreUtilisable} → ${a.dernièreUtilisable})`} copier={false} />
          <Ligne T={T} nom="Plage privée (RFC 1918)" valeur={a.privée ? 'oui' : 'non'} copier={false} />
          {a.aws && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#ff99001a' }}>
              <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800 }}>☁️ Dans un sous-réseau AWS : {a.aws.utilisables.toLocaleString('fr-FR')} adresses utilisables</p>
              <p style={{ margin: '0 0 6px', fontSize: 13.5 }}>Première : <code>{a.aws.premièreUtilisable}</code> · dernière : <code>{a.aws.dernièreUtilisable}</code></p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>{a.aws.réservées.map(([ip, r]) => <li key={ip}><code>{ip}</code> : {r}</li>)}</ul>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: a.aws.valideVpc ? T.textMuted : T.danger }}>{a.aws.valideVpc ? 'Taille acceptée pour un VPC ou un sous-réseau (/16 à /28).' : 'AWS accepte des blocs de /16 à /28 pour les VPC et sous-réseaux.'}</p>
            </div>
          )}
          <p style={{ ...S.étiquette, marginTop: 14 }}>Découper en sous-réseaux</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span>/</span><input type="number" min={a.préfixe} max={32} value={découpe} onChange={e => setDécoupe(Number(e.target.value))} aria-label="Préfixe des sous-réseaux" style={{ ...S.champ, width: 90 }} />
            {d && !d.erreur && <span style={{ fontSize: 13.5, color: T.textMuted }}>{d.total.toLocaleString('fr-FR')} sous-réseaux de {(2 ** (32 - découpe)).toLocaleString('fr-FR')} adresses</span>}
          </div>
          {d?.erreur ? <p style={{ color: T.danger, fontSize: 13.5 }}>{d.erreur}</p> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d?.sousRéseaux.map(x => <code key={x} style={{ padding: '4px 8px', borderRadius: 6, background: T.bg, border: `1px solid ${T.border}`, fontSize: 13 }}>{x}</code>)}{d?.total > d?.sousRéseaux.length && <span style={{ fontSize: 13, color: T.textMuted }}>… (64 premiers)</span>}</div>}
        </div>
      )}
    </div>
  )
}

function OutilCron({ T, S }) {
  const [expr, setExpr] = useState('0 2 * * 1-5')
  const r = analyserCron(expr)
  return (
    <div style={S.carte}>
      <p style={S.étiquette}>Expression (Unix 5 champs ou AWS 6 champs)</p>
      <input value={expr} onChange={e => setExpr(e.target.value)} aria-label="Expression cron" style={S.champ} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0' }}>
        {['*/5 * * * *', '0 2 * * 1-5', '30 8 1 * *', 'cron(0 12 ? * MON-FRI *)', 'cron(0 0 L * ? *)'].map(x => <button key={x} onClick={() => setExpr(x)} style={{ ...S.puce(false), fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 400, fontSize: 12.5 }}>{x}</button>)}
      </div>
      {r.erreur ? <p style={{ color: T.danger }}>{r.erreur}</p> : (
        <>
          <p style={{ fontSize: 17, fontFamily: grotesk, fontWeight: 700, margin: '6px 0' }}>🗣️ {r.description}</p>
          <p style={{ fontSize: 12.5, color: T.textMuted, margin: '0 0 8px' }}>{r.aws ? 'Format AWS EventBridge. ' : 'Format Unix (crontab). '}{r.fuseau}</p>
          <p style={S.étiquette}>5 prochaines exécutions (heure de cet appareil)</p>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14.5 }}>{r.prochaines.map(d => <li key={d.getTime()}>{d.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>)}</ol>
        </>
      )}
      <p style={{ fontSize: 12.5, color: T.textMuted, margin: '10px 0 0', lineHeight: 1.5 }}>Champs : minute · heure · jour du mois · mois · jour de la semaine (· année pour AWS). Syntaxe : <code>*</code>, <code>*/n</code>, <code>a-b</code>, <code>a,b</code>, noms (MON, JAN), <code>?</code> et <code>L</code> pour AWS.</p>
    </div>
  )
}

function OutilChmod({ T, S }) {
  const [droits, setDroits] = useState(chmodDepuisOctal('750'))
  const [saisie, setSaisie] = useState('750')
  const appliquer = v => { setSaisie(v); const d = chmodDepuisOctal(v) || chmodDepuisSymbolique(v); if (d) setDroits(d) }
  const basculer = (i, j) => { const d = droits.map(r => [...r]); d[i][j] = !d[i][j]; setDroits(d); setSaisie(chmodOctal(d)) }
  return (
    <div style={S.carte}>
      <p style={S.étiquette}>Octal (755) ou symbolique (rwxr-xr-x)</p>
      <input value={saisie} onChange={e => appliquer(e.target.value)} aria-label="Droits" style={S.champ} />
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', textAlign: 'center' }}>
        <thead><tr><th />{['Lecture (r)', 'Écriture (w)', 'Exécution (x)'].map(h => <th key={h} style={{ fontSize: 12.5, color: T.textMuted, padding: 4 }}>{h}</th>)}</tr></thead>
        <tbody>{['Propriétaire', 'Groupe', 'Autres'].map((qui, i) => (
          <tr key={qui}><td style={{ textAlign: 'left', fontSize: 14, padding: 6 }}>{qui}</td>{[0, 1, 2].map(j => <td key={j}><input type="checkbox" checked={droits[i][j]} onChange={() => basculer(i, j)} aria-label={`${qui} ${'rwx'[j]}`} style={{ width: 24, height: 24, accentColor: T.accent }} /></td>)}</tr>
        ))}</tbody>
      </table>
      <Ligne T={T} nom="Octal" valeur={chmodOctal(droits)} />
      <Ligne T={T} nom="Symbolique" valeur={chmodSymbolique(droits)} />
      <Ligne T={T} nom="Commande" valeur={`chmod ${chmodOctal(droits)} <fichier>`} />
    </div>
  )
}

function OutilBase64({ T, S }) {
  const [texte, setTexte] = useState('')
  const [url, setUrl] = useState(false)
  let encodé = '', décodé = '', erreur = ''
  try { encodé = base64Encoder(texte, url) } catch { encodé = '' }
  try { décodé = texte.trim() ? base64Décoder(texte) : '' } catch { erreur = 'Ce texte n\'est pas du Base64 valide' }
  return (
    <div style={S.carte}>
      <p style={S.étiquette}>Texte ou Base64</p>
      <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={4} aria-label="Texte à encoder ou décoder" style={{ ...S.champ, resize: 'vertical' }} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, margin: '8px 0' }}><input type="checkbox" checked={url} onChange={e => setUrl(e.target.checked)} /> Variante URL (sans + / =)</label>
      {texte && <>
        <p style={S.étiquette}>Encodé en Base64</p><BlocCode code={encodé} langage="base64" numéros={false} />
        <p style={{ ...S.étiquette, marginTop: 10 }}>Décodé</p>{erreur ? <p style={{ color: T.textMuted, fontSize: 13.5 }}>{erreur}</p> : <BlocCode code={décodé} langage="texte" numéros={false} />}
      </>}
      <p style={{ fontSize: 12.5, color: T.textMuted, margin: '8px 0 0' }}>Tout se calcule dans ton navigateur : rien n'est envoyé.</p>
    </div>
  )
}

function OutilJwt({ T, S }) {
  const [jeton, setJeton] = useState('')
  const r = jeton.trim() ? décoderJwt(jeton) : null
  return (
    <div style={S.carte}>
      <p style={S.étiquette}>Jeton JWT</p>
      <textarea value={jeton} onChange={e => setJeton(e.target.value)} rows={4} aria-label="Jeton JWT" placeholder="eyJhbGciOi…" style={{ ...S.champ, resize: 'vertical', wordBreak: 'break-all' }} />
      {r?.erreur && <p style={{ color: T.danger }}>{r.erreur}</p>}
      {r && !r.erreur && <>
        {r.expiré !== null && <p style={{ fontFamily: grotesk, fontWeight: 800, color: r.expiré ? T.danger : '#2e9e6b' }}>{r.expiré ? '⛔ Expiré' : '✅ Pas encore expiré'}</p>}
        {r.dates.map(([k, d]) => <Ligne key={k} T={T} nom={{ iat: 'Émis (iat)', nbf: 'Valide à partir de (nbf)', exp: 'Expire (exp)' }[k]} valeur={d.toLocaleString('fr-FR')} copier={false} />)}
        <p style={{ ...S.étiquette, marginTop: 10 }}>En-tête</p><BlocCode code={JSON.stringify(r.entête, null, 2)} langage="json" numéros={false} />
        <p style={{ ...S.étiquette, marginTop: 10 }}>Contenu (claims)</p><BlocCode code={JSON.stringify(r.contenu, null, 2)} langage="json" numéros={false} />
      </>}
      <p style={{ fontSize: 12.5, color: '#b07400', margin: '8px 0 0' }}>⚠️ Décodage seulement : la signature n'est pas vérifiée. Rien n'est envoyé, mais évite de coller des jetons de production encore valides.</p>
    </div>
  )
}

function OutilTemps({ T, S }) {
  const [texte, setTexte] = useState(String(Math.floor(Date.now() / 1000)))
  const r = analyserHorodatage(texte)
  return (
    <div style={S.carte}>
      <p style={S.étiquette}>Epoch (secondes ou millisecondes) ou date</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={texte} onChange={e => setTexte(e.target.value)} aria-label="Horodatage" style={S.champ} />
        <button onClick={() => setTexte(String(Math.floor(Date.now() / 1000)))} style={S.puce(false)}>Maintenant</button>
      </div>
      {r?.erreur && <p style={{ color: T.danger }}>{r.erreur}</p>}
      {r && !r.erreur && <div style={{ marginTop: 8 }}>
        <Ligne T={T} nom="ISO 8601 (UTC)" valeur={r.iso} />
        <Ligne T={T} nom="Heure locale" valeur={r.local} />
        <Ligne T={T} nom="Epoch secondes" valeur={r.secondes} />
        <Ligne T={T} nom="Epoch millisecondes" valeur={r.millisecondes} />
        <Ligne T={T} nom="Par rapport à maintenant" valeur={r.relatif} copier={false} />
      </div>}
    </div>
  )
}

function OutilJson({ T, S }) {
  const [texte, setTexte] = useState('')
  const r = useMemo(() => {
    const t = texte.trim()
    if (!t) return null
    try { return { format: 'JSON', objet: JSON.parse(t) } } catch (eJson) {
      // Commence comme du JSON : on le juge comme du JSON (YAML tolérerait les erreurs).
      if (t.startsWith('{') || t.startsWith('[')) return { erreur: `JSON invalide : ${eJson.message}` }
      try { const o = yaml.load(t); if (o === undefined || typeof o === 'string') throw new Error('Texte simple, ni JSON ni YAML structuré'); return { format: 'YAML', objet: o } } catch (eYaml) {
        return { erreur: t.startsWith('{') || t.startsWith('[') ? `JSON invalide : ${eJson.message}` : `YAML invalide : ${eYaml.message.split('\n')[0]}` }
      }
    }
  }, [texte])
  return (
    <div style={S.carte}>
      <p style={S.étiquette}>Colle du JSON ou du YAML</p>
      <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={8} spellCheck={false} aria-label="JSON ou YAML" style={{ ...S.champ, resize: 'vertical' }} />
      {r?.erreur && <p style={{ color: T.danger, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13.5 }}>❌ {r.erreur}</p>}
      {r && !r.erreur && <>
        <p style={{ fontFamily: grotesk, fontWeight: 800, color: '#2e9e6b', margin: '8px 0' }}>✅ {r.format} valide</p>
        <p style={S.étiquette}>JSON formaté</p><BlocCode code={JSON.stringify(r.objet, null, 2)} langage="json" numéros={false} />
        <p style={{ ...S.étiquette, marginTop: 10 }}>JSON sur une ligne</p><BlocCode code={JSON.stringify(r.objet)} langage="json" numéros={false} />
        <p style={{ ...S.étiquette, marginTop: 10 }}>YAML</p><BlocCode code={yaml.dump(r.objet, { lineWidth: 120 })} langage="yaml" numéros={false} />
      </>}
    </div>
  )
}

const EXEMPLE_K8S = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: api
          image: registre.exemple.com/api:1.4.2
          ports:
            - containerPort: 8080
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits: { memory: 256Mi }
          readinessProbe:
            httpGet: { path: /health, port: 8080 }
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: prod
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
`
const NIVEAUX = { erreur: ['⛔', '#d33'], alerte: ['⚠️', '#c98a00'], info: ['ℹ️', '#3b6fd8'] }

function OutilK8s({ T, S }) {
  const [texte, setTexte] = useState('')
  const [détails, setDétails] = useState(true)
  const r = useMemo(() => {
    if (!texte.trim()) return null
    try { return { manifestes: analyserManifestes(yaml.loadAll(texte)) } } catch (e) { return { erreur: e.message.split('\n')[0] } }
  }, [texte])
  return (
    <>
      <div style={S.carte}>
        <p style={S.étiquette}>Colle un ou plusieurs manifestes (séparés par ---)</p>
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={10} spellCheck={false} aria-label="Manifeste Kubernetes" style={{ ...S.champ, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setTexte(EXEMPLE_K8S)} style={S.puce(false)}>Exemple</button>
          {texte && <button onClick={() => setTexte('')} style={S.puce(false)}>Effacer</button>}
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={détails} onChange={e => setDétails(e.target.checked)} /> Explication champ par champ</label>
        </div>
        {r?.erreur && <p style={{ color: T.danger, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13.5 }}>❌ YAML invalide : {r.erreur}</p>}
      </div>
      {r?.manifestes?.map((m, i) => {
        const par = n => m.alertes.filter(a => a.niveau === n).length
        return (
          <div key={i} style={S.carte}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ fontFamily: grotesk, fontSize: 17 }}>☸️ {m.nom}</strong>
              <span style={{ fontSize: 13, color: par('erreur') ? T.danger : par('alerte') ? '#c98a00' : '#2e9e6b', fontFamily: grotesk, fontWeight: 700 }}>{par('erreur') ? `${par('erreur')} erreur(s)` : par('alerte') ? `${par('alerte')} point(s) à revoir` : '✓ rien de bloquant'}</span>
            </div>
            {m.description && <p style={{ margin: '4px 0 10px', fontSize: 14.5, color: T.textMuted }}>{m.description}</p>}
            {m.planning && !m.planning.erreur && <p style={{ margin: '0 0 10px', fontSize: 14.5 }}>⏰ <strong>{m.planning.description}</strong> · prochaine exécution : {m.planning.prochaines[0]?.toLocaleString('fr-FR')} (heure de cet appareil ; le cluster est souvent en UTC)</p>}
            {m.alertes.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '0 0 10px', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...m.alertes].sort((a, b) => ['erreur', 'alerte', 'info'].indexOf(a.niveau) - ['erreur', 'alerte', 'info'].indexOf(b.niveau)).map((a, k) => (
                  <li key={k} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 10, background: T.bg, borderLeft: `4px solid ${NIVEAUX[a.niveau][1]}`, fontSize: 14, lineHeight: 1.45 }}><span>{NIVEAUX[a.niveau][0]}</span><span>{a.texte}</span></li>
                ))}
              </ul>
            )}
            {détails && (
              <details open={i === 0}>
                <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 14, minHeight: 32 }}>Champ par champ ({m.lignes.filter(l => l.explication).length} expliqués)</summary>
                <div style={{ marginTop: 6, fontSize: 13.5 }}>
                  {m.lignes.map(l => (
                    <div key={l.chemin} style={{ paddingLeft: l.profondeur * 14, padding: `4px 0 4px ${l.profondeur * 14}px`, borderBottom: `1px dashed ${T.border}` }}>
                      <code style={{ color: T.accent, fontWeight: 700 }}>{l.clé}</code>{l.valeur !== null && l.valeur !== undefined && <code style={{ marginLeft: 6, wordBreak: 'break-all' }}>{String(l.valeur)}</code>}
                      {l.explication && <div style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.4, marginTop: 2 }}>{l.explication}</div>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )
      })}
    </>
  )
}

const EXEMPLE_PLAN = `Terraform will perform the following actions:

  # aws_instance.web will be created
  + resource "aws_instance" "web" {
      + ami = "ami-0abc"
    }

  # aws_db_instance.main must be replaced
-/+ resource "aws_db_instance" "main" {
      ~ identifier        = "db-old" -> "db-new" # forces replacement
      ~ storage_encrypted = false -> true # forces replacement
    }

  # module.vpc.aws_subnet.private["a"] will be updated in-place
  ~ resource "aws_subnet" "private" {
      ~ tags = {}
    }

  # aws_s3_bucket.logs will be destroyed
  # (because aws_s3_bucket.logs is not in configuration)
  - resource "aws_s3_bucket" "logs" {
    }

Plan: 2 to add, 1 to change, 2 to destroy.`

function OutilTerraform({ T, S }) {
  const [texte, setTexte] = useState('')
  const r = useMemo(() => lirePlan(texte), [texte])
  const ordre = ['delete', 'replace', 'update', 'create', 'import', 'move', 'forget', 'read']
  return (
    <>
      <div style={S.carte}>
        <p style={S.étiquette}>Colle la sortie de terraform plan (ou terraform show -json plan.out)</p>
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={10} spellCheck={false} aria-label="Plan Terraform" style={{ ...S.champ, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => setTexte(EXEMPLE_PLAN)} style={S.puce(false)}>Exemple</button>
          {texte && <button onClick={() => setTexte('')} style={S.puce(false)}>Effacer</button>}
        </div>
        <p style={{ fontSize: 12.5, color: T.textMuted, margin: '8px 0 0' }}>Astuce : <code>terraform plan -no-color</code> ou <code>terraform plan -out=plan.out && terraform show -json plan.out</code>. Tout reste dans ton navigateur.</p>
      </div>
      {r?.erreur && <div style={S.carte}><p style={{ margin: 0, color: T.danger }}>{r.erreur}</p></div>}
      {r && !r.erreur && (
        <>
          {r.rien && !r.ressources.length && <div style={{ ...S.carte, borderColor: '#2e9e6b' }}><p style={{ margin: 0, fontFamily: grotesk, fontWeight: 800, color: '#2e9e6b' }}>✅ Aucun changement : l'infrastructure correspond à la configuration.</p></div>}
          {r.risquées.length > 0 && (
            <div role="alert" style={{ ...S.carte, background: '#d332', borderColor: '#d33' }}>
              <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800, fontSize: 17, color: '#d33' }}>🛑 {r.risquées.length} ressource(s) seront détruites{r.compte.replace ? ' ou remplacées' : ''}</p>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>{r.risquées.map(x => <li key={x.adresse}><code>{x.adresse}</code>{r.données.includes(x) && <strong style={{ color: '#d33' }}> · 💾 contient des données</strong>}</li>)}</ul>
            </div>
          )}
          <div style={S.carte}>
            <p style={S.étiquette}>Résumé · lu au format {r.format}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ordre.filter(a => r.compte[a]).map(a => <span key={a} style={{ padding: '6px 10px', borderRadius: 16, background: `${ACTIONS[a].couleur}22`, color: ACTIONS[a].couleur, fontFamily: grotesk, fontWeight: 800, fontSize: 13.5 }}>{ACTIONS[a].emoji} {r.compte[a]} {ACTIONS[a].nom.toLowerCase()}</span>)}
            </div>
            {r.annoncé && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: r.incohérent ? '#b07400' : T.textMuted }}>Terraform annonce : {r.annoncé.importer ? `${r.annoncé.importer} à importer, ` : ''}{r.annoncé.ajouter} à ajouter, {r.annoncé.modifier} à modifier, {r.annoncé.détruire} à détruire{r.incohérent ? ' ⚠️ ne correspond pas aux ressources lues : vérifie que le plan est complet.' : ' (un remplacement compte comme un ajout et une destruction).'}</p>}
          </div>
          {ordre.filter(a => r.compte[a]).map(a => (
            <div key={a} style={S.carte}>
              <p style={{ ...S.étiquette, color: ACTIONS[a].couleur }}>{ACTIONS[a].emoji} {ACTIONS[a].nom} ({r.compte[a]})</p>
              {r.ressources.filter(x => x.action === a).map(x => (
                <div key={x.adresse + a} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <code style={{ fontSize: 14, wordBreak: 'break-all', fontWeight: 700 }}>{x.adresse}</code>{x.vers && <> → <code>{x.vers}</code></>}
                  <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{x.type}{x.module ? ` · module ${x.module}` : ''}{r.données.includes(x) ? ' · 💾 données' : ''}</div>
                  {x.attributs.length > 0 && <div style={{ fontSize: 13.5, marginTop: 2 }}>Remplacement forcé par : {x.attributs.map(t => <code key={t} style={{ marginRight: 6, color: '#e8590c' }}>{t}</code>)}</div>}
                  {x.raison && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Raison : {x.raison}</div>}
                </div>
              ))}
            </div>
          ))}
          {r.conseils.length > 0 && <div style={S.carte}><p style={S.étiquette}>💡 Conseils</p><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14.5 }}>{r.conseils.map(c => <li key={c}>{c.split('`').map((m, k) => (k % 2 ? <code key={k}>{m}</code> : m))}</li>)}</ul></div>}
        </>
      )}
    </>
  )
}

function Alertes({ T, alertes, avecLigne }) {
  if (!alertes.length) return null
  return (
    <ul style={{ listStyle: 'none', margin: '0 0 10px', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {alertes.map((a, k) => (
        <li key={k} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 10, background: T.bg, borderLeft: `4px solid ${NIVEAUX[a.niveau][1]}`, fontSize: 14, lineHeight: 1.45 }}>
          <span>{NIVEAUX[a.niveau][0]}</span>
          <span>{avecLigne && a.ligne ? <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace', marginRight: 6 }}>L{a.ligne}</strong> : null}{a.job ? <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace', marginRight: 6 }}>{a.job}</strong> : null}{a.texte}</span>
        </li>
      ))}
    </ul>
  )
}
const Bilan = ({ T, alertes }) => {
  const n = k => alertes.filter(a => a.niveau === k).length
  return <span style={{ fontSize: 13.5, color: n('erreur') ? T.danger : n('alerte') ? '#c98a00' : '#2e9e6b', fontFamily: grotesk, fontWeight: 800 }}>{n('erreur') ? `${n('erreur')} erreur(s)` : ''}{n('erreur') && n('alerte') ? ' · ' : ''}{n('alerte') ? `${n('alerte')} point(s) à revoir` : ''}{!n('erreur') && !n('alerte') ? '✓ rien de bloquant' : ''}</span>
}

const DOCKER_À_REVOIR = `FROM node
ENV API_KEY=abc123
WORKDIR /app
COPY . .
RUN apt-get update
RUN apt-get install -y curl git
RUN npm install && npm run build
CMD node dist/server.js`
const DOCKER_BON = `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/dist ./dist
USER app
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]`

function OutilDocker({ T, S }) {
  const [texte, setTexte] = useState('')
  const r = useMemo(() => analyserDockerfile(texte), [texte])
  return (
    <>
      <div style={S.carte}>
        <p style={S.étiquette}>Colle ton Dockerfile</p>
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={10} spellCheck={false} aria-label="Dockerfile" style={{ ...S.champ, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setTexte(DOCKER_À_REVOIR)} style={S.puce(false)}>Exemple à corriger</button>
          <button onClick={() => setTexte(DOCKER_BON)} style={S.puce(false)}>Exemple propre</button>
          {texte && <button onClick={() => setTexte('')} style={S.puce(false)}>Effacer</button>}
        </div>
      </div>
      {r && (
        <>
          <div style={S.carte}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8 }}>
              <strong style={{ fontFamily: grotesk, fontSize: 17 }}>🐳 {r.stats.étapes > 1 ? `Build multi-étapes (${r.stats.étapes})` : '1 étape'}</strong><Bilan T={T} alertes={r.alertes} />
            </div>
            {r.étapes.length > 0 && <p style={{ margin: '0 0 10px', fontSize: 14, color: T.textMuted }}>{r.étapes.map((e, i) => `${i + 1}. ${e.image}${e.nom ? ` (« ${e.nom} »)` : ''}`).join(' → ')}{r.étapes.length > 1 ? ' : seule la dernière étape forme l\'image finale.' : ''}</p>}
            <Alertes T={T} alertes={r.alertes} avecLigne />
          </div>
          <div style={S.carte}>
            <p style={S.étiquette}>Instruction par instruction</p>
            {r.instructions.map((x, i) => (
              <div key={i} style={{ padding: '7px 0', borderBottom: `1px dashed ${T.border}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, color: T.textMuted, minWidth: 28, fontFamily: 'ui-monospace, Menlo, monospace' }}>L{x.ligne}</span>
                  <code style={{ wordBreak: 'break-all', fontSize: 13.5 }}><strong style={{ color: T.accent }}>{x.instruction}</strong> {x.arguments}</code>
                </div>
                {x.explication && <div style={{ fontSize: 13, color: T.textMuted, marginLeft: 36, lineHeight: 1.4 }}>{x.explication}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

const EXEMPLE_GITLAB = `stages: [build, test, deploy]

default:
  interruptible: true

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

.node:
  image: node:20-alpine
  cache:
    key: { files: [package-lock.json] }
    paths: [node_modules/]

build:
  extends: .node
  stage: build
  script: [npm ci, npm run build]
  artifacts: { paths: [dist/], expire_in: 1 week }

lint:
  extends: .node
  stage: test
  needs: [build]
  script: [npm run lint]

test:
  extends: .node
  stage: test
  needs: [build]
  script: [npm test]

deploy_production:
  stage: deploy
  image: amazon/aws-cli:2.15.0
  needs: [lint, test]
  script: [aws s3 sync dist/ s3://$BUCKET]
  environment: { name: production, url: https://exemple.fr }
  resource_group: production
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual`

function OutilGitlab({ T, S }) {
  const [texte, setTexte] = useState('')
  const r = useMemo(() => {
    if (!texte.trim()) return null
    try { return analyserGitlabCi(yaml.load(texte)) } catch (e) { return { erreur: `YAML invalide : ${e.message.split('\n')[0]}` } }
  }, [texte])
  const clés = r?.jobs ? [...new Set(r.jobs.flatMap(j => j.clés))].filter(k => MOTS_CLÉS[k]) : []
  return (
    <>
      <div style={S.carte}>
        <p style={S.étiquette}>Colle ton .gitlab-ci.yml</p>
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={10} spellCheck={false} aria-label="Fichier GitLab CI" style={{ ...S.champ, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => setTexte(EXEMPLE_GITLAB)} style={S.puce(false)}>Exemple</button>
          {texte && <button onClick={() => setTexte('')} style={S.puce(false)}>Effacer</button>}
        </div>
        {r?.erreur && <p style={{ color: T.danger, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13.5 }}>❌ {r.erreur}</p>}
      </div>
      {r && !r.erreur && (
        <>
          <div style={S.carte}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 10 }}>
              <strong style={{ fontFamily: grotesk, fontSize: 17 }}>🦊 Pipeline : {r.jobs.length} job(s)</strong><Bilan T={T} alertes={r.alertes} />
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }} aria-label="Pipeline par étape">
              {r.stages.map(st => (
                <div key={st} style={{ flex: '0 0 190px', background: T.bg, borderRadius: 12, padding: 8 }}>
                  <p style={{ margin: '0 0 8px', fontFamily: grotesk, fontWeight: 800, fontSize: 13, color: r.déclarés.includes(st) || st.startsWith('.') ? T.textMuted : T.danger, textTransform: 'uppercase', letterSpacing: '.06em' }}>{st}</p>
                  {r.jobs.filter(j => j.étape === st).map(j => (
                    <div key={j.nom} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 10px', marginBottom: 6 }}>
                      <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13.5, wordBreak: 'break-all' }}>{j.trigger ? '↗ ' : ''}{j.nom}</strong>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, lineHeight: 1.45 }}>
                        {j.image && <div>🐳 {j.image}</div>}
                        {j.needs.length > 0 && <div>⏩ après {j.needs.join(', ')}</div>}
                        {j.when !== 'on_success' && <div>{j.when === 'manual' ? '▶️ manuel' : `⚙️ ${j.when}`}</div>}
                        {j.environment && <div>🌍 {j.environment}</div>}
                        {j.extends.length > 0 && <div>🧬 {j.extends.join(', ')}</div>}
                        {j.allow_failure && <div>🟡 échec toléré</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {r.modèles.length > 0 && <p style={{ fontSize: 13, color: T.textMuted, margin: '4px 0 10px' }}>Modèles cachés (non lancés) : {r.modèles.join(', ')}</p>}
            <Alertes T={T} alertes={r.alertes} />
          </div>
          {clés.length > 0 && (
            <div style={S.carte}>
              <p style={S.étiquette}>Mots-clés utilisés</p>
              {clés.map(k => <div key={k} style={{ padding: '6px 0', borderBottom: `1px dashed ${T.border}`, fontSize: 14 }}><code style={{ color: T.accent, fontWeight: 700 }}>{k}</code> <span style={{ color: T.textMuted }}>{MOTS_CLÉS[k]}</span></div>)}
            </div>
          )}
        </>
      )}
    </>
  )
}

function OutilLogs({ T, S }) {
  const [mode, setMode] = useState('grok')
  const [motif, setMotif] = useState('')
  const [drapeaux, setDrapeaux] = useState('')
  const [logs, setLogs] = useState('')
  const r = useMemo(() => testerLogs({ mode, motif, drapeaux, logs }), [mode, motif, drapeaux, logs])
  return (
    <>
      <div style={S.carte}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['grok', 'Règles grok (Datadog)'], ['regex', 'Expression régulière']].map(([id, nom]) => <button key={id} onClick={() => setMode(id)} aria-pressed={mode === id} style={S.puce(mode === id)}>{nom}</button>)}
          <button onClick={() => { setLogs(EXEMPLES_LOGS.logs); setMotif(EXEMPLES_LOGS[mode]) }} style={S.puce(false)}>Exemple</button>
        </div>
        <p style={S.étiquette}>{mode === 'grok' ? 'Règles : une par ligne, « nom_regle motif »' : 'Expression régulière (groupes nommés : (?<nom>…))'}</p>
        <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={mode === 'grok' ? 3 : 2} spellCheck={false} aria-label="Motif" style={{ ...S.champ, resize: 'vertical' }} />
        {mode === 'regex' && <input value={drapeaux} onChange={e => setDrapeaux(e.target.value)} placeholder="Drapeaux : i, m, s" aria-label="Drapeaux" style={{ ...S.champ, marginTop: 6, width: 180 }} />}
        {mode === 'grok' && <p style={{ fontSize: 12.5, color: T.textMuted, margin: '6px 0 0', lineHeight: 1.5 }}>Matchers : word, notSpace, data, integer, number, ip, hostname, uuid, quotedString, date("…"), regex("…")… Filtres : :keyvalue, :json, :lowercase. La règle doit couvrir toute la ligne, comme dans Datadog.</p>}
        <p style={{ ...S.étiquette, marginTop: 12 }}>Lignes de log</p>
        <textarea value={logs} onChange={e => setLogs(e.target.value)} rows={7} spellCheck={false} aria-label="Lignes de log" style={{ ...S.champ, resize: 'vertical' }} />
      </div>
      {r?.erreur && <div style={S.carte}><p style={{ margin: 0, color: T.danger, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13.5 }}>❌ {r.erreur}</p></div>}
      {r && !r.erreur && (
        <>
          <div style={S.carte}>
            <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800, color: r.reconnues === r.total ? '#2e9e6b' : '#c98a00' }}>{r.reconnues}/{r.total} lignes reconnues</p>
            <div style={{ height: 8, borderRadius: 4, background: T.surface2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(r.reconnues / r.total) * 100}%`, background: '#2e9e6b' }} /></div>
            {r.tops.length > 0 && <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>{r.tops.map(t => <div key={t.champ} style={{ fontSize: 13.5 }}><code style={{ color: T.accent, fontWeight: 700 }}>{t.champ}</code> : {t.valeurs.map(([v, n]) => `${v} (${n})`).join(' · ')}</div>)}</div>}
          </div>
          {r.résultats.map((x, i) => (
            <div key={i} style={{ ...S.carte, borderLeft: `4px solid ${x.ok ? '#2e9e6b' : T.danger}` }}>
              <code style={{ display: 'block', fontSize: 13, wordBreak: 'break-all', color: T.textMuted, marginBottom: x.ok ? 6 : 0 }}>{x.ok ? '✓' : '✗ non reconnue :'} {x.ligne}</code>
              {x.ok && <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'ui-monospace, Menlo, monospace' }}>{JSON.stringify(x.champs, null, 2)}</pre>}
            </div>
          ))}
        </>
      )}
    </>
  )
}

// ---------- Coffre de commandes ----------
function Commandes({ T, S, data, setData }) {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [formulaire, setFormulaire] = useState(null) // { id?, titre, commande, tags }
  const [locales, setLocales] = useState({}) // valeurs saisies sans les enregistrer
  const [copiée, setCopiée] = useState(null)
  const profil = data.profils.find(p => p.id === data.profilActif) || data.profils[0]
  const valeurs = { ...profil.valeurs, ...locales }
  const tags = [...new Set(data.commandes.flatMap(c => c.tags || []))].sort()
  const toutesVariables = [...new Set(data.commandes.flatMap(c => variablesDe(c.commande)))].sort()
  const liste = data.commandes.filter(c => (!tag || (c.tags || []).includes(tag)) && (!q.trim() || `${c.titre} ${c.commande} ${(c.tags || []).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())))
  const majProfil = (id, ch) => setData(d => ({ ...d, profils: d.profils.map(p => (p.id === id ? { ...p, ...ch } : p)) }))
  const enregistrerValeur = (v, val) => { majProfil(profil.id, { valeurs: { ...profil.valeurs, [v]: val } }); setLocales(l => { const x = { ...l }; delete x[v]; return x }) }
  const enregistrer = f => {
    if (!f.titre.trim() || !f.commande.trim()) return
    const c = { id: f.id || uid(), titre: f.titre.trim(), commande: f.commande.trim(), tags: f.tags.split(',').map(x => x.trim()).filter(Boolean) }
    setData(d => ({ ...d, commandes: f.id ? d.commandes.map(x => (x.id === f.id ? c : x)) : [c, ...d.commandes] }))
    setFormulaire(null)
  }
  const copier = c => { navigator.clipboard?.writeText(remplir(c.commande, valeurs)); setCopiée(c.id); setTimeout(() => setCopiée(x => (x === c.id ? null : x)), 1500) }
  return (
    <>
      <div style={S.carte}>
        <p style={S.étiquette}>Profil actif (remplit les variables)</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {data.profils.map(p => <button key={p.id} onClick={() => setData(d => ({ ...d, profilActif: p.id }))} aria-pressed={p.id === profil.id} style={S.puce(p.id === profil.id)}>{p.nom}</button>)}
          <button onClick={() => { const nom = window.prompt('Nom du profil (ex. staging, eu-west-1)'); if (nom?.trim()) { const id = uid(); setData(d => ({ ...d, profils: [...d.profils, { id, nom: nom.trim(), valeurs: { ...profil.valeurs } }], profilActif: id })) } }} style={S.puce(false)}>＋ Profil</button>
          {data.profils.length > 1 && <button onClick={() => { if (window.confirm(`Supprimer le profil « ${profil.nom} » ?`)) setData(d => ({ ...d, profils: d.profils.filter(p => p.id !== profil.id), profilActif: d.profils.find(p => p.id !== profil.id).id })) }} style={{ ...S.puce(false), color: T.danger }}>Supprimer</button>}
        </div>
        {toutesVariables.length > 0 && (
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: 14, minHeight: 32 }}>Variables du profil « {profil.nom} » ({toutesVariables.filter(v => profil.valeurs[v]).length}/{toutesVariables.length} remplies)</summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 8, marginTop: 8 }}>
              {toutesVariables.map(v => (
                <label key={v} style={{ fontSize: 13, color: T.textMuted }}>&lt;{v}&gt;
                  <input value={profil.valeurs[v] || ''} onChange={e => majProfil(profil.id, { valeurs: { ...profil.valeurs, [v]: e.target.value } })} style={{ ...S.champ, minHeight: 36, fontSize: 14, marginTop: 2 }} />
                </label>
              ))}
            </div>
          </details>
        )}
        <p style={{ fontSize: 12.5, color: '#b07400', margin: '10px 0 0' }}>⚠️ N'enregistre ni mot de passe ni clé secrète : ces valeurs sont synchronisées dans ton dépôt GitHub.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher une commande…" aria-label="Rechercher une commande" style={{ ...S.champ, flex: '1 1 200px', width: 'auto', fontFamily: 'inherit' }} />
        <button onClick={() => setFormulaire({ titre: '', commande: '', tags: '' })} style={S.puce(true)}>＋ Commande</button>
      </div>
      {tags.length > 0 && <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}><button onClick={() => setTag('')} style={S.puce(!tag)}>Toutes</button>{tags.map(t => <button key={t} onClick={() => setTag(x => (x === t ? '' : t))} style={S.puce(tag === t)}>#{t}</button>)}</div>}

      {formulaire && (
        <div style={{ ...S.carte, borderColor: T.accent }}>
          <p style={S.étiquette}>{formulaire.id ? 'Modifier la commande' : 'Nouvelle commande'}</p>
          <input value={formulaire.titre} onChange={e => setFormulaire(f => ({ ...f, titre: e.target.value }))} placeholder="Titre (ex. Session SSM)" aria-label="Titre" style={{ ...S.champ, fontFamily: 'inherit', marginBottom: 8 }} />
          <textarea value={formulaire.commande} onChange={e => setFormulaire(f => ({ ...f, commande: e.target.value }))} rows={3} spellCheck={false} placeholder="aws ssm start-session --target <instance-id>" aria-label="Commande" style={{ ...S.champ, resize: 'vertical', marginBottom: 4 }} />
          <p style={{ fontSize: 12.5, color: T.textMuted, margin: '0 0 8px' }}>Écris les variables entre chevrons : <code>&lt;instance-id&gt;</code>, <code>&lt;region&gt;</code>… {variablesDe(formulaire.commande).length > 0 && `Variables : ${variablesDe(formulaire.commande).join(', ')}`}</p>
          <input value={formulaire.tags} onChange={e => setFormulaire(f => ({ ...f, tags: e.target.value }))} placeholder="Étiquettes séparées par des virgules (aws, ssm)" aria-label="Étiquettes" style={{ ...S.champ, fontFamily: 'inherit', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setFormulaire(null)} style={S.puce(false)}>Annuler</button>
            <button onClick={() => enregistrer(formulaire)} disabled={!formulaire.titre.trim() || !formulaire.commande.trim()} style={S.puce(true)}>Enregistrer</button>
          </div>
        </div>
      )}

      {data.commandes.length === 0 && !formulaire && (
        <div style={{ ...S.carte, textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px', fontSize: 14.5 }}>Aucune commande pour l'instant.</p>
          <button onClick={() => setData(d => ({ ...d, commandes: EXEMPLES_COMMANDES.map(([titre, commande, t]) => ({ id: uid() + Math.random().toString(36).slice(2, 4), titre, commande, tags: t })) }))} style={S.puce(true)}>Ajouter {EXEMPLES_COMMANDES.length} commandes d'exemple (AWS, kubectl, Terraform…)</button>
        </div>
      )}

      {liste.map(c => {
        const vars = variablesDe(c.commande)
        const manquantes = vars.filter(v => !valeurs[v])
        return (
          <div key={c.id} style={S.carte}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <strong style={{ flex: 1, fontFamily: grotesk, fontSize: 15.5 }}>{c.titre}</strong>
              {(c.tags || []).map(t => <span key={t} style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 10, background: T.surface2, color: T.textMuted }}>#{t}</span>)}
              <BoutonIcone icon="crayon" title="Modifier" taille={14} onClick={() => setFormulaire({ id: c.id, titre: c.titre, commande: c.commande, tags: (c.tags || []).join(', ') })} />
              <BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} taille={14} onClick={() => { if (window.confirm(`Supprimer « ${c.titre} » ?`)) setData(d => ({ ...d, commandes: d.commandes.filter(x => x.id !== c.id) })) }} />
            </div>
            {vars.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 6, marginBottom: 8 }}>
                {vars.map(v => (
                  <label key={v} style={{ fontSize: 12.5, color: valeurs[v] ? T.textMuted : '#b07400' }}>&lt;{v}&gt;
                    <span style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <input value={valeurs[v] || ''} onChange={e => setLocales(l => ({ ...l, [v]: e.target.value }))} aria-label={`Valeur de ${v}`} style={{ ...S.champ, minHeight: 34, fontSize: 13.5, padding: '4px 8px' }} />
                      {locales[v] !== undefined && locales[v] !== (profil.valeurs[v] || '') && <button onClick={() => enregistrerValeur(v, locales[v])} title={`Enregistrer dans le profil ${profil.nom}`} aria-label={`Enregistrer ${v} dans le profil`} style={{ minWidth: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer' }}>💾</button>}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <BlocCode code={remplir(c.commande, valeurs)} langage="bash" numéros={false} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ flex: 1, fontSize: 12.5, color: manquantes.length ? '#b07400' : '#2e9e6b' }}>{manquantes.length ? `À remplir : ${manquantes.join(', ')}` : '✓ Prête à lancer'}</span>
              <button onClick={() => copier(c)} style={{ ...S.puce(true), background: copiée === c.id ? '#2e9e6b' : T.accent, borderColor: copiée === c.id ? '#2e9e6b' : T.accent }}>{copiée === c.id ? '✓ Copiée' : '📋 Copier'}</button>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default function OutilsDevops() {
  const { espace: espaceParam } = useParams()
  const foyer = FOYERS[foyerDeLEspace(espaceParam || 'perso')]
  const espace = espaceParam || `${foyer.préfixe}perso`
  const T = useTheme()
  const S = useStyles(T)
  const { mode, basculer } = useThemeMode()
  const config = useMemo(() => ({ id: espace, stockage: `react-blocs-commandes-${espace}`, chemin: `react-blocks/src/data/commandes-${espace}.json`, données: {} }), [espace])
  const { data, setData, token, statut, erreur, connecter, déconnecter } = useDonnéesSynchronisées(config, compléterCommandes)
  const [onglet, setOnglet] = useState(() => { try { return localStorage.getItem('react-blocs-outils-onglet') || 'outils' } catch { return 'outils' } })
  const [outil, setOutil] = useState('k8s')
  const choisirOnglet = o => { setOnglet(o); try { localStorage.setItem('react-blocs-outils-onglet', o) } catch { /* ignore */ } }
  const Outil = { k8s: OutilK8s, tfplan: OutilTerraform, docker: OutilDocker, gitlab: OutilGitlab, logs: OutilLogs, cidr: OutilCidr, cron: OutilCron, chmod: OutilChmod, base64: OutilBase64, jwt: OutilJwt, temps: OutilTemps, json: OutilJson }[outil]
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '20px 16px 60px', color: T.text }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link to={foyer.accueil} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 13, fontFamily: grotesk, minHeight: 36 }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
              {['perso', 'pro'].map(t => { const e = `${foyer.préfixe}${t}`; return <Link key={t} to={`/outils/${e}`} style={{ fontSize: 12, fontFamily: grotesk, fontWeight: 600, padding: '7px 12px', borderRadius: 6, background: e === espace ? T.accent : 'transparent', color: e === espace ? T.accentText : T.textMuted }}>{t === 'perso' ? 'Perso' : 'Pro'}</Link> })}
            </div>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
          </div>
        </div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 32, margin: '0 0 12px', lineHeight: 1.1 }}>🧰 Outils DevOps</h1>
        <div role="tablist" style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['outils', '🧰 Boîte à outils'], ['commandes', `⌨️ Commandes (${data.commandes.length})`]].map(([id, nom]) => <button key={id} role="tab" aria-selected={onglet === id} onClick={() => choisirOnglet(id)} style={{ ...S.puce(onglet === id), minHeight: 44, fontSize: 14.5 }}>{nom}</button>)}
        </div>
        {onglet === 'outils' && (
          <>
            <div role="tablist" aria-label="Outil" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
              {OUTILS.map(([id, nom]) => <button key={id} role="tab" aria-selected={outil === id} onClick={() => setOutil(id)} style={S.puce(outil === id)}>{nom}</button>)}
            </div>
            <Outil T={T} S={S} />
          </>
        )}
        {onglet === 'commandes' && (
          <>
            <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`commandes-${espace}.json`} marginBottom="12px" />
            <Commandes T={T} S={S} data={data} setData={setData} />
          </>
        )}
      </div>
    </div>
  )
}
