// Éditeurs d'une déclaration : principal, ressources, conditions (le constructeur visuel).
import { useMemo, useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { MONO } from '../../../lib/querygen/apparence'
import { PRINCIPAUX_SERVICE } from '../../../lib/iam/lexique'
import { champsDuGabarit, instancier, gabaritAffichable, RÉGIONS_COURANTES } from '../../../lib/iam/arn'
import { OPÉRATEURS_FR, descriptionClé, opérateursPour } from '../../../lib/iam/globales'
import { analyserOpérateur, listeOpérateurs, enTexte } from '../../../lib/iam/conditions'
import { étendreMotif } from '../../../lib/iam/etendre'
import { CONDITIONS_RAPIDES } from '../../../lib/iam/edition'
import { AjoutTexte, PuceSuppr, Segments } from './ui'

const SERVICES_PRINCIPAUX = [...new Set(Object.values(PRINCIPAUX_SERVICE))].sort()

// ---- Principal -----------------------------------------------------------------------------------------------------------------------------
export function EditeurPrincipal({ principal, type, onChange, T, S }) {
  const valeurs = principal?.valeurs
  const mode = valeurs === '*' ? '*' : valeurs?.Federated ? 'Federated' : valeurs?.Service ? 'Service' : 'AWS'
  const [choix, setChoix] = useState(mode)
  const actif = valeurs === '*' ? '*' : choix
  const liste = valeurs && valeurs !== '*' ? valeurs[actif] ?? [] : []
  const ajouter = (v, t) => {
    const nettoyées = v.map(x => (t === 'AWS' && /^\d{12}$/.test(x) ? `arn:aws:iam::${x}:root` : x))
    const base = valeurs && valeurs !== '*' ? valeurs : {}
    onChange({ inverse: !!principal?.inverse, valeurs: { ...base, [t]: [...new Set([...(base[t] ?? []), ...nettoyées])] } })
  }
  const retirer = (v, t) => {
    const base = { ...(valeurs && valeurs !== '*' ? valeurs : {}) }
    base[t] = (base[t] ?? []).filter(x => x !== v)
    if (!base[t].length) delete base[t]
    onChange({ inverse: !!principal?.inverse, valeurs: base })
  }
  const aide = {
    '*': 'Tout le monde, y compris sans compte AWS : à n\'utiliser qu\'avec des conditions (organisation, VPC…).',
    Service: 'Un service AWS (lambda.amazonaws.com…) qui assume le rôle ou utilise la ressource.',
    AWS: 'Un compte (12 chiffres → arn:aws:iam::ID:root) ou une identité (arn:aws:iam::ID:role/nom).',
    Federated: 'Un fournisseur d\'identité : arn:aws:iam::ID:oidc-provider/hôte ou saml-provider/nom.',
  }[actif]
  return (
    <div>
      <p style={S.étiquette}>{type === 'approbation' ? 'Qui peut assumer le rôle' : 'Principal (qui est concerné)'}</p>
      <Segments aria="Type de principal" S={S} valeur={actif} onChange={v => { setChoix(v); if (v === '*') onChange({ inverse: !!principal?.inverse, valeurs: '*' }); else if (valeurs === '*') onChange({ inverse: !!principal?.inverse, valeurs: {} }) }} options={[['Service', 'Service AWS'], ['AWS', 'Compte / identité'], ['Federated', 'Fédéré (OIDC, SAML)'], ['*', 'Tout le monde (*)']]} />
      <p style={{ margin: '6px 0', fontSize: 12.5, color: T.textMuted }}>{aide}</p>
      {actif !== '*' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>{liste.map(v => <PuceSuppr key={v} texte={v} T={T} onSuppr={() => retirer(v, actif)} />)}</div>
          {actif === 'Service' && <datalist id="iam-services-principaux">{SERVICES_PRINCIPAUX.map(x => <option key={x} value={x} />)}</datalist>}
          <AjoutTexte S={S} T={T} onAjouter={v => ajouter(v, actif)} placeholder={actif === 'Service' ? 'lambda.amazonaws.com' : actif === 'AWS' ? '123456789012 ou arn:aws:iam::…:role/…' : 'arn:aws:iam::…:oidc-provider/token.actions.githubusercontent.com'} aria={`Ajouter un principal ${actif}`} listeId={actif === 'Service' ? 'iam-services-principaux' : undefined} />
        </>
      )}
    </div>
  )
}

// ---- Ressources -----------------------------------------------------------------------------------------------------------------------------
function GabaritsRessources({ actions, données, onAjouter, T, S }) {
  const [choisi, setChoisi] = useState(null)
  const [valeurs, setValeurs] = useState({})
  const gabarits = useMemo(() => {
    const cat = données.cat
    const tous = new Map()
    for (const m of actions) {
      const e = étendreMotif(cat, m)
      if (e.actions.length > 400) continue
      for (const a of e.actions) for (const r of a.ressources) if (r.modèle) tous.set(`${a.service}:${r.nom}`, { service: a.service, nom: r.nom, modèle: r.modèle })
    }
    return [...tous.values()].slice(0, 30)
  }, [actions, données])
  if (!gabarits.length) return null
  const champs = choisi ? champsDuGabarit(choisi.modèle).filter(c => c !== 'Partition') : []
  const arn = choisi ? instancier(choisi.modèle, valeurs, nom => (nom === 'Partition' ? 'aws' : '*')) : ''
  return (
    <details style={{ marginTop: 8 }}>
      <summary style={{ cursor: 'pointer', fontSize: 13.5, fontFamily: grotesk, fontWeight: 700 }}>🧩 Formats d'ARN des actions choisies ({gabarits.length})</summary>
      <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
        {gabarits.map(g => (
          <button key={`${g.service}:${g.nom}`} type="button" onClick={() => { setChoisi(g); setValeurs({}) }} style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 10, border: `1px solid ${choisi === g ? T.accent : T.border}`, background: choisi === g ? T.accentSoft : T.surface, color: T.text, cursor: 'pointer', minHeight: 40 }}>
            <strong style={{ fontSize: 13 }}>{g.service} · {g.nom}</strong>
            <code style={{ display: 'block', fontFamily: MONO, fontSize: 12, wordBreak: 'break-all', color: T.textMuted }}>{gabaritAffichable(g.modèle)}</code>
          </button>
        ))}
      </div>
      {choisi && (
        <div style={{ marginTop: 8, padding: 10, border: `1px dashed ${T.border}`, borderRadius: 10 }}>
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {champs.map(c => (
              <label key={c} style={{ fontSize: 12.5, color: T.textMuted }}>{c}
                <input value={valeurs[c] ?? ''} onChange={e => setValeurs(v => ({ ...v, [c]: e.target.value }))} placeholder="* (tous)" list={c === 'Region' ? 'iam-régions' : undefined} style={{ ...S.champ, fontSize: 16, marginTop: 2 }} />
              </label>
            ))}
          </div>
          <datalist id="iam-régions">{RÉGIONS_COURANTES.map(r => <option key={r} value={r} />)}</datalist>
          <p style={{ margin: '8px 0 6px' }}><code style={{ fontFamily: MONO, fontSize: 13, wordBreak: 'break-all' }}>{arn}</code></p>
          <button type="button" onClick={() => onAjouter([arn])} style={{ ...S.puce(true), minHeight: 40 }}>Ajouter cet ARN</button>
        </div>
      )}
    </details>
  )
}

export function EditeurRessources({ ressources, actions, onAjouter, onRetirer, onBasculer, onActiver, interdite, données, T, S }) {
  if (interdite) {
    return <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>ℹ️ Une politique d'approbation n'a pas de « Resource » : la ressource est le rôle lui-même.</p>
  }
  if (!ressources) {
    return (
      <div>
        <p style={S.étiquette}>Ressources</p>
        <button type="button" onClick={onActiver} style={{ ...S.puce(false), minHeight: 38 }}>+ Ajouter Resource</button>
      </div>
    )
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <p style={{ ...S.étiquette, margin: 0 }}>{ressources.inverse ? 'NotResource (toutes SAUF)' : 'Ressources'}</p>
        <label style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={ressources.inverse} onChange={onBasculer} style={{ width: 18, height: 18, accentColor: T.accent }} /> NotResource</label>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {ressources.liste.map(r => <PuceSuppr key={r} texte={r} T={T} onSuppr={() => onRetirer(r)} />)}
        {!ressources.liste.length && <span style={{ fontSize: 13, color: '#dc2626' }}>Aucune ressource</span>}
      </div>
      <AjoutTexte S={S} T={T} onAjouter={onAjouter} placeholder="arn:aws:s3:::mon-bucket/*  ou  *" aria="Ajouter une ressource" />
      <GabaritsRessources actions={actions} données={données} onAjouter={onAjouter} T={T} S={S} />
    </div>
  )
}

// ---- Conditions ---------------------------------------------------------------------------------------------------------------------------------
export function EditeurConditions({ conditions, clésConnues, données, onAjouter, onModifier, onSupprimer, indice, T, S }) {
  const globales = useMemo(() => données.cat.globales().map(g => g.k.replace('/tag-key', '/')), [données])
  const toutesClés = useMemo(() => [...new Set([...clésConnues, ...globales])], [clésConnues, globales])
  return (
    <div>
      <p style={S.étiquette}>Conditions (toutes requises)</p>
      <datalist id={`iam-clés-${indice}`}>{toutesClés.map(k => <option key={k} value={k} />)}</datalist>
      {conditions.map((c, k) => {
        const info = données.cat.trouverClé(c.clé, /^([^:]+):/.exec(c.clé)?.[1] ?? null)
        const op = analyserOpérateur(c.opérateur)
        const type = info?.type
        const ops = type ? [...new Set([...opérateursPour(type), c.opérateur])] : listeOpérateurs()
        const description = info?.desc || descriptionClé(c.clé)
        return (
          <div key={`${k}-${c.clé}`} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, marginBottom: 6, background: T.bg }}>
            <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'minmax(0, 1fr)' }}>
              <input value={c.clé} onChange={e => onModifier(k, { clé: e.target.value })} list={`iam-clés-${indice}`} aria-label={`Clé de la condition ${k + 1}`} placeholder="aws:SourceIp" autoCapitalize="off" spellCheck={false} style={{ ...S.champ, fontSize: 16 }} />
              <select value={c.opérateur} onChange={e => onModifier(k, { opérateur: e.target.value })} aria-label={`Opérateur de la condition ${k + 1}`} style={{ ...S.champ, fontFamily: grotesk, fontSize: 15 }}>
                {ops.map(o => <option key={o} value={o}>{o}{OPÉRATEURS_FR[analyserOpérateur(o)?.base] ? ` — ${OPÉRATEURS_FR[analyserOpérateur(o).base]}` : ''}</option>)}
              </select>
              {op?.info.famille === 'bool'
                ? <select value={enTexte(c.valeurs[0] ?? 'true')} onChange={e => onModifier(k, { valeurs: [e.target.value] })} aria-label={`Valeur de la condition ${k + 1}`} style={{ ...S.champ, fontFamily: grotesk, fontSize: 15 }}><option value="true">true</option><option value="false">false</option></select>
                : <input value={c.valeurs.map(enTexte).join(', ')} onChange={e => onModifier(k, { valeurs: e.target.value.split(',').map(x => x.trim()) })} aria-label={`Valeurs de la condition ${k + 1}`} placeholder="valeur1, valeur2" autoCapitalize="off" spellCheck={false} style={{ ...S.champ, fontSize: 16 }} />}
            </div>
            {description && <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.4 }}>{description}{type ? ` (type ${type})` : ''}</p>}
            <button type="button" onClick={() => onSupprimer(k)} aria-label={`Supprimer la condition ${k + 1}`} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5, marginTop: 6 }}>🗑️ Supprimer</button>
          </div>
        )
      })}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CONDITIONS_RAPIDES.map(([nom, c]) => <button key={nom} type="button" onClick={() => onAjouter({ ...c })} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5, fontWeight: 600 }}>{nom}</button>)}
        <button type="button" onClick={() => onAjouter({ opérateur: 'StringEquals', clé: '', valeurs: [''] })} style={{ ...S.puce(false), minHeight: 34, fontSize: 12.5, fontWeight: 600 }}>+ Autre condition</button>
      </div>
    </div>
  )
}
