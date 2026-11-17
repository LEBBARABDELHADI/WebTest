// Simulation : tests automatiques (exécutés sur la politique) et requête saisie à la main.
import { useMemo, useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { MONO } from '../../../lib/querygen/apparence'
import { évaluerSelonType, NOM_COUCHE } from '../../../lib/iam/evaluer'
import { étendreMotif } from '../../../lib/iam/etendre'
import { concret } from '../../../lib/iam/testsauto'
import { Pastille } from './ui'

const DÉCISION = {
  'autorisation-explicite': ['✅', '#2e9e6b', 'Autorisé'],
  'refus-explicite': ['⛔', '#dc2626', 'Refus explicite (Deny)'],
  'refus-implicite': ['🚫', '#d97706', 'Refus implicite'],
  'accès-complet-implicite': ['✅', '#2e9e6b', 'Autorisé (FullAWSAccess)'],
}

function Détails({ résultat, T }) {
  const couches = Object.entries(résultat.couches)
  return (
    <div style={{ fontSize: 13, lineHeight: 1.5 }}>
      <p style={{ margin: '0 0 6px' }}>{résultat.résumé}</p>
      {résultat.ajouts.length > 0 && <p style={{ margin: '0 0 6px', color: T.textMuted }}>Clés ajoutées automatiquement : {résultat.ajouts.map(a => `${a.clé} = ${a.valeur} (${a.source})`).join(' ; ')}.</p>}
      {couches.map(([nom, c]) => (
        <div key={nom} style={{ marginTop: 4 }}>
          <strong>{NOM_COUCHE[nom]}</strong>
          <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
            {c.déclarations.map(d => (
              <li key={`${d.politique}-${d.indice}`} style={{ color: d.correspond ? T.text : T.textMuted }}>
                Déclaration {d.indice + 1}{d.sid ? ` (${d.sid})` : ''} · {d.effet} : {d.correspond ? <strong>s'applique</strong> : `ne s'applique pas — ${d.pourquoiPas}`}
                {d.raisons.conditions?.détails?.length > 0 && (
                  <ul style={{ margin: '2px 0 0', paddingLeft: 16, fontFamily: MONO, fontSize: 12 }}>{d.raisons.conditions.détails.map((x, k) => <li key={k}>{x.détail}</li>)}</ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function ListeTests({ résultats, origine, modifiée, T }) {
  const échecs = résultats.filter(r => !r.ok)
  const sondes = origine === 'sondes'
  const ok = résultats.filter(r => r.ok).length
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
        <Pastille couleur={échecs.length ? '#dc2626' : '#2e9e6b'}>{échecs.length ? '❌' : '✅'} {ok}/{résultats.length} {sondes ? 'sondes conformes' : 'tests conformes'}</Pastille>
        {modifiée && !sondes && <Pastille couleur="#d97706">Politique modifiée depuis la génération</Pastille>}
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>
        {sondes
          ? 'Politique saisie ou modifiée à la main : des requêtes tirées de la politique (doivent passer) et des requêtes voisines (autre compte, autre ressource, sans conditions, action d\'écriture voisine) sont simulées. Une ligne ⚠️ signifie que la politique autorise plus que ce que ses ressources et conditions laissent attendre.'
          : 'Chaque requête est simulée sur la politique courante ; l\'attendu vient de la description, pas de la politique. Si vous modifiez la politique et qu\'un test échoue, elle ne fait plus ce qui était demandé.'}
      </p>
      <div style={{ display: 'grid', gap: 6 }}>
        {[...échecs, ...résultats.filter(r => r.ok)].map(r => {
          const [icône, couleur, nom] = DÉCISION[r.résultat.motif]
          const plusLarge = sondes && !r.ok
          return (
            <details key={r.id} style={{ border: `1px solid ${r.ok ? T.border : '#dc262666'}`, borderRadius: 10, background: T.bg }}>
              <summary style={{ cursor: 'pointer', padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-start', listStyle: 'none' }}>
                <span aria-hidden="true">{r.ok ? '✅' : plusLarge ? '⚠️' : '❌'}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.45, wordBreak: 'break-word' }}>{r.libellé}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: couleur, whiteSpace: 'nowrap' }}>{icône} {nom}</span>
              </summary>
              <div style={{ padding: '0 10px 10px' }}>
                <p style={{ margin: '0 0 6px', fontSize: 13 }}>Attendu : <strong>{r.attenduTexte}</strong> · {r.ok ? 'conforme' : plusLarge ? 'plus large que prévu' : 'NON conforme'}</p>
                <p style={{ margin: '0 0 6px', fontFamily: MONO, fontSize: 12, wordBreak: 'break-all', color: T.textMuted }}>{r.requête.action} · {r.requête.ressource}{r.requête.contexte && Object.keys(r.requête.contexte).length ? ` · ${JSON.stringify(r.requête.contexte)}` : ''}</p>
                <Détails résultat={r.résultat} T={T} />
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}

const PRÉRÉGLAGES = [
  ['🔐 MFA présente', 'aws:MultiFactorAuthPresent', 'true'],
  ['🔓 Sans MFA', 'aws:MultiFactorAuthPresent', 'false'],
  ['🌐 IP 203.0.113.5', 'aws:SourceIp', '203.0.113.5'],
  ['🗺️ Région eu-west-3', 'aws:RequestedRegion', 'eu-west-3'],
  ['🔒 HTTPS', 'aws:SecureTransport', 'true'],
  ['⚠️ HTTP', 'aws:SecureTransport', 'false'],
]

function RequêteLibre({ politique, type, données, T, S }) {
  const [action, setAction] = useState('')
  const [ressource, setRessource] = useState('*')
  const [lignes, setLignes] = useState([])
  const [principal, setPrincipal] = useState('')
  const suggestions = useMemo(() => {
    const actions = []
    const ressources = []
    for (const d of politique.déclarations) {
      for (const m of d.actions?.liste ?? []) {
        const e = étendreMotif(données.cat, m)
        if (e.actions.length <= 300) actions.push(...e.actions.map(a => a.id))
        else if (!/[*?]/.test(m)) actions.push(m)
      }
      for (const r of d.ressources?.liste ?? []) ressources.push(/[*?]/.test(r) && r !== '*' ? concret(r) : r)
    }
    return { actions: [...new Set(actions)].slice(0, 300), ressources: [...new Set(ressources)].slice(0, 40) }
  }, [politique, données])
  const contexte = useMemo(() => {
    const c = {}
    for (const { k, v } of lignes) if (k.trim()) c[k.trim()] = v.includes(',') ? v.split(',').map(x => x.trim()) : v
    return c
  }, [lignes])
  const demandeur = useMemo(() => {
    const p = principal.trim()
    if (!p) return undefined
    if (/^\d{12}$/.test(p)) return { type: 'rôle', arn: `arn:aws:iam::${p}:role/appelant`, compte: p }
    if (/\.amazonaws\.com$/.test(p)) return { type: 'service', service: p }
    if (/oidc-provider|saml-provider/.test(p)) return { type: 'fédéré', fédéré: p }
    return { type: /:user\//.test(p) ? 'utilisateur' : 'rôle', arn: p, compte: /(\d{12})/.exec(p)?.[1] }
  }, [principal])
  const résultat = useMemo(() => (action.trim() ? évaluerSelonType(type, politique, { action: action.trim(), ressource: ressource.trim() || '*', contexte, principal: demandeur }) : null), [action, ressource, contexte, demandeur, politique, type])
  const [icône, couleur, nom] = résultat ? DÉCISION[résultat.motif] : []
  const besoinPrincipal = type === 'ressource' || type === 'approbation'
  return (
    <div>
      <datalist id="iam-sim-actions">{suggestions.actions.map(a => <option key={a} value={a} />)}</datalist>
      <datalist id="iam-sim-ressources">{suggestions.ressources.map(a => <option key={a} value={a} />)}</datalist>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13, color: T.textMuted }}>Action demandée
          <input value={action} onChange={e => setAction(e.target.value)} list="iam-sim-actions" aria-label="Action de la requête" placeholder={type === 'approbation' ? 'sts:AssumeRole' : 's3:GetObject'} autoCapitalize="off" spellCheck={false} style={{ ...S.champ, fontSize: 16, marginTop: 2 }} />
        </label>
        {type !== 'approbation' && (
          <label style={{ fontSize: 13, color: T.textMuted }}>Ressource visée (ARN, ou * pour les actions sans ressource)
            <input value={ressource} onChange={e => setRessource(e.target.value)} list="iam-sim-ressources" aria-label="Ressource de la requête" placeholder="arn:aws:s3:::mon-bucket/fichier.txt" autoCapitalize="off" spellCheck={false} style={{ ...S.champ, fontSize: 16, marginTop: 2 }} />
          </label>
        )}
        {besoinPrincipal && (
          <label style={{ fontSize: 13, color: T.textMuted }}>Qui fait la requête (compte à 12 chiffres, ARN, service.amazonaws.com ou fournisseur fédéré)
            <input value={principal} onChange={e => setPrincipal(e.target.value)} aria-label="Principal de la requête" placeholder={type === 'approbation' ? 'lambda.amazonaws.com' : '123456789012'} autoCapitalize="off" spellCheck={false} style={{ ...S.champ, fontSize: 16, marginTop: 2 }} />
          </label>
        )}
        <div>
          <p style={S.étiquette}>Contexte de la requête (clés de condition)</p>
          {lignes.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={l.k} onChange={e => setLignes(ls => ls.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} aria-label={`Clé du contexte ${i + 1}`} placeholder="aws:SourceIp" autoCapitalize="off" spellCheck={false} style={{ ...S.champ, flex: 1, minWidth: 0, fontSize: 16 }} />
              <input value={l.v} onChange={e => setLignes(ls => ls.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} aria-label={`Valeur du contexte ${i + 1}`} placeholder="valeur" autoCapitalize="off" spellCheck={false} style={{ ...S.champ, flex: 1, minWidth: 0, fontSize: 16 }} />
              <button type="button" onClick={() => setLignes(ls => ls.filter((_, j) => j !== i))} aria-label={`Retirer la clé ${i + 1}`} style={{ ...S.puce(false), minHeight: 42, padding: '0 10px' }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRÉRÉGLAGES.map(([nomP, k, v]) => <button key={nomP} type="button" onClick={() => setLignes(ls => [...ls.filter(x => x.k !== k), { k, v }])} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5, fontWeight: 600 }}>{nomP}</button>)}
            <button type="button" onClick={() => setLignes(ls => [...ls, { k: '', v: '' }])} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5, fontWeight: 600 }}>+ Autre clé</button>
          </div>
        </div>
      </div>
      <div aria-live="polite" style={{ marginTop: 12 }}>
        {!résultat && <p style={{ margin: 0, fontSize: 13.5, color: T.textMuted }}>Saisissez une action : le résultat s'affiche aussitôt.</p>}
        {résultat && (
          <div style={{ border: `1px solid ${couleur}66`, borderRadius: 12, padding: 10, background: T.bg }}>
            <p style={{ margin: '0 0 6px', fontFamily: grotesk, fontWeight: 800, fontSize: 16, color: couleur }}>{icône} {nom}</p>
            <Détails résultat={résultat} T={T} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Simulation({ résultats, origine, modifiée, politique, type, données, T, S }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <p style={S.étiquette}>Tests automatiques</p>
        {résultats.length ? <ListeTests résultats={résultats} origine={origine} modifiée={modifiée} T={T} /> : <p style={{ margin: 0, fontSize: 13.5, color: T.textMuted }}>Pas assez d'éléments pour générer des tests (ajoutez des actions et des ressources, ou décrivez la règle).</p>}
      </div>
      <div>
        <p style={S.étiquette}>Tester une requête</p>
        <RequêteLibre politique={politique} type={type} données={données} T={T} S={S} />
      </div>
    </div>
  )
}
