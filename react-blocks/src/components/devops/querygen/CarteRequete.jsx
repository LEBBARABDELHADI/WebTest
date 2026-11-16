// Carte d'une requête générée (jq ou JMESPath) : éditeur, Copier, Exécuter,
// Expliquer, statut de vérification, résultat, différences, corrections.
import { useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { colorerJmes, colorerJq } from '../../../lib/querygen/coloration'
import { MONO, STATUTS } from '../../../lib/querygen/apparence'
import Badge from './Badge'
import Resultat from './Resultat'
import EditeurCode from './EditeurCode'

const shell = q => `'${q.replace(/'/g, "'\\''")}'`

function BoutonCopier({ texte, T, libellé = '📋 Copier', aria }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(texte).catch(() => {}); setOk(true); setTimeout(() => setOk(false), 1200) }}
      aria-label={aria || libellé}
      style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: ok ? '#2e9e6b' : T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
    >{ok ? '✓ Copié' : libellé}</button>
  )
}

export default function CarteRequete({ langage, T, S, requête, setRequête, exécution, statut, onExécuter, onExpliquer, explication, onAppliquer, brut, source, référence }) {
  const nom = langage === 'jq' ? 'jq' : 'JMESPath'
  const s = STATUTS[statut] || STATUTS.modifiée
  const bouton = { minHeight: 36, padding: '0 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontFamily: grotesk, fontWeight: 700, fontSize: 13, cursor: 'pointer' }
  const commandes = langage === 'jq'
    ? [`jq ${brut ? '-r ' : ''}${shell(requête)} fichier.json`, `${source === 'kubectl' ? 'kubectl get pods -o json' : source === 'aws' ? 'aws ec2 describe-instances' : 'cat fichier.json'} | jq ${brut ? '-r ' : ''}${shell(requête)}`]
    : [`${source === 'aws' ? 'aws ec2 describe-instances' : 'aws <service> <commande>'} --query ${shell(requête)}${brut ? ' --output text' : ''}`, `jp -f fichier.json ${shell(requête)}`]
  const [voirCommandes, setVoirCommandes] = useState(false)
  const diff = exécution?.comparaison
  return (
    <section aria-label={`Requête ${nom}`} style={{ ...S.carte, marginBottom: 0, minWidth: 0, borderTop: `3px solid ${s.couleur}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontFamily: grotesk, fontSize: 18 }}>{nom}</h3>
        <span style={{ color: T.textMuted, fontSize: 12.5 }}>{langage === 'jq' ? 'jq 1.8 · WebAssembly' : 'jmespath.js 0.16 (référence)'}</span>
        <span style={{ flex: 1 }} />
        <Badge statut={statut} />
      </div>
      {statut === 'impossible' ? (
        <div style={{ padding: '10px 12px', borderRadius: 10, background: T.bg, border: `1px dashed ${T.border}`, fontSize: 14, lineHeight: 1.55 }}>
          <strong>Pas de requête {nom} équivalente.</strong> {exécution?.raison}
        </div>
      ) : (
        <EditeurCode valeur={requête} onChange={setRequête} colorer={langage === 'jq' ? colorerJq : colorerJmes} T={T} hauteur={76} retour ariaLabel={`Requête ${nom}`} />
      )}
      {statut !== 'impossible' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <BoutonCopier texte={requête} T={T} aria={`Copier la requête ${nom}`} />
          <button onClick={onExécuter} disabled={!requête.trim() || statut === 'enCours'} aria-label={`Exécuter la requête ${nom}`} style={{ ...bouton, background: T.accent, color: T.accentText, borderColor: T.accent }}>▶ Exécuter</button>
          <button onClick={onExpliquer} disabled={!requête.trim()} aria-label={`Expliquer la requête ${nom}`} aria-expanded={!!explication} style={bouton}>💡 Expliquer</button>
          <button onClick={() => setVoirCommandes(v => !v)} aria-expanded={voirCommandes} style={bouton}>⌨️ Commande</button>
        </div>
      )}
      {voirCommandes && statut !== 'impossible' && (
        <div style={{ marginTop: 8 }}>
          {commandes.map(c => (
            <div key={c} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <code style={{ flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, fontSize: 12.5, overflowX: 'auto', whiteSpace: 'nowrap' }}>{c}</code>
              <BoutonCopier texte={c} T={T} libellé="📋" aria="Copier la commande" />
            </div>
          ))}
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: T.textMuted }}>{langage === 'jq' ? 'Guillemets simples : la requête est protégée pour bash/zsh.' : 'jp est l\'outil en ligne de commande JMESPath ; l\'AWS CLI applique --query côté client.'}</p>
        </div>
      )}
      {statut !== 'impossible' && (
        <p style={{ margin: '10px 0 6px', fontSize: 13.5, lineHeight: 1.5, color: statut === 'erreur' ? '#dc2626' : T.text }}>
          {statut === 'différente' && référence === 'plan' ? 'Exécutée, mais le résultat diffère de l\'interprétation.' : statut === 'différente' ? 'Exécutée, mais le résultat diffère de l\'attendu.' : s.texte}
          {exécution?.durée !== undefined && statut !== 'modifiée' && statut !== 'enCours' && <span style={{ color: T.textMuted }}> · {exécution.durée < 1 ? '< 1' : Math.round(exécution.durée)} ms</span>}
          {exécution?.nbSorties > 1 && <span style={{ color: T.textMuted }}> · {exécution.nbSorties} résultats (flux)</span>}
        </p>
      )}
      {exécution?.erreur && statut === 'erreur' && <pre style={{ margin: '0 0 8px', padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.35)', color: T.text, fontFamily: MONO, fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{exécution.erreur.message}</pre>}
      {exécution?.dépendDesDonnées && statut !== 'modifiée' && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#d97706', lineHeight: 1.5 }}>⚠️ Requête écrite pour les valeurs présentes dans ce JSON (JMESPath n'a pas de regroupement) : à régénérer si de nouvelles valeurs apparaissent.</p>}
      {!!exécution?.notes?.length && statut !== 'modifiée' && (
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>
          {exécution.notes.map(n => <li key={n}>{n}</li>)}
        </ul>
      )}
      {exécution?.texte !== undefined && statut !== 'modifiée' && (
        <>
          <p style={{ ...S.étiquette, marginTop: 8 }}>Résultat {exécution.tronqué ? '(affichage tronqué)' : ''}</p>
          <Resultat texte={exécution.texte} T={T} aria={`Résultat ${nom}`} />
        </>
      )}
      {diff && !diff.égal && statut === 'différente' && (
        <div style={{ marginTop: 10 }}>
          <p style={{ ...S.étiquette }}>Différences ({diff.résumé})</p>
          {diff.remarques?.map(r => <p key={r} style={{ margin: '0 0 6px', fontSize: 13.5, lineHeight: 1.5 }}>ℹ️ {r}</p>)}
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>
            {diff.différences.map((d, i) => <li key={i} style={{ wordBreak: 'break-word' }}><span aria-hidden="true">{d.type === 'manquant' ? '➖ ' : d.type === 'enTrop' ? '➕ ' : d.type === 'ordre' ? '🔀 ' : '≠ '}</span>{d.message}</li>)}
          </ul>
        </div>
      )}
      {exécution?.corrections && (statut === 'différente' || statut === 'erreur') && (
        <div style={{ marginTop: 10 }}>
          <p style={{ ...S.étiquette }}>Correction proposée</p>
          {exécution.corrections.vérifiées.map(c => (
            <div key={c.requête} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(46,158,107,.45)', background: 'rgba(46,158,107,.08)', marginBottom: 6 }}>
              <div style={{ fontSize: 13.5, marginBottom: 4 }}>✅ {c.texte} <em style={{ color: T.textMuted }}>(exécutée : reproduit l'attendu)</em></div>
              <code style={{ display: 'block', fontSize: 12.5, wordBreak: 'break-all', marginBottom: 6 }}>{c.requête}</code>
              <button onClick={() => onAppliquer(c.requête)} style={{ ...bouton, minHeight: 32 }}>Appliquer</button>
            </div>
          ))}
          {exécution.corrections.pistes.map(p => <p key={p} style={{ margin: '0 0 4px', fontSize: 13.5, lineHeight: 1.5 }}>💡 {p}</p>)}
          {!exécution.corrections.vérifiées.length && !exécution.corrections.pistes.length && <p style={{ fontSize: 13.5, color: T.textMuted }}>Aucune correction simple n'a reproduit l'attendu.</p>}
        </div>
      )}
      {explication && (
        <div style={{ marginTop: 10 }}>
          <p style={{ ...S.étiquette }}>Explication</p>
          {explication.erreur && <p style={{ fontSize: 13.5, color: '#dc2626', margin: '0 0 6px' }}>{explication.erreur}</p>}
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.55 }}>
            {explication.étapes?.map((e, i) => (
              <li key={i} style={{ marginLeft: e.niveau * 14, marginBottom: 4, listStyle: e.niveau ? 'circle' : undefined }}>
                <code style={{ fontSize: 12.5, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '0 4px', wordBreak: 'break-all' }}>{e.code}</code> — {e.texte}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
