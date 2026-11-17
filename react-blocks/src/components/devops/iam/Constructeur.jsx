// Constructeur visuel : une carte par déclaration (effet, principal, actions, ressources, conditions).
// Il ne touche jamais au JSON : il transforme la politique normalisée avec des fonctions pures (lib/iam/edition).
import { useMemo, useState } from 'react'
import { grotesk } from '../../../lib/theme'
import { TYPES } from '../../../lib/iam/politique'
import * as ed from '../../../lib/iam/edition'
import { étendreMotif } from '../../../lib/iam/etendre'
import { AjoutTexte, PuceSuppr, Segments } from './ui'
import SelecteurActions from './SelecteurActions'
import { EditeurConditions, EditeurPrincipal, EditeurRessources } from './EditeursDeclaration'

function Carte({ d, i, total, politique, type, onChange, données, T, S }) {
  const t = TYPES[type]
  const [parcourir, setParcourir] = useState(false)
  const actions = d.actions ?? { inverse: false, liste: [] }
  const clésConnues = useMemo(() => {
    const ensemble = new Set()
    for (const m of actions.liste) {
      const e = étendreMotif(données.cat, m)
      if (e.actions.length > 400) continue
      for (const a of e.actions) for (const k of a.clés) ensemble.add(k.clé)
    }
    return [...ensemble]
  }, [actions.liste, données])
  const maj = f => onChange(f(politique))
  return (
    <section aria-label={`Déclaration ${i + 1}`} style={{ ...S.carte, borderColor: d.effet === 'Deny' ? '#dc262655' : T.border, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <h4 style={{ margin: 0, fontFamily: grotesk, fontSize: 16 }}>Déclaration {i + 1}</h4>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => maj(p => ed.déplacerDéclaration(p, i, -1))} disabled={i === 0} aria-label={`Monter la déclaration ${i + 1}`} style={{ ...S.puce(false), minHeight: 36, padding: '0 10px' }}>↑</button>
        <button type="button" onClick={() => maj(p => ed.déplacerDéclaration(p, i, 1))} disabled={i === total - 1} aria-label={`Descendre la déclaration ${i + 1}`} style={{ ...S.puce(false), minHeight: 36, padding: '0 10px' }}>↓</button>
        <button type="button" onClick={() => maj(p => ed.dupliquerDéclaration(p, i))} aria-label={`Dupliquer la déclaration ${i + 1}`} style={{ ...S.puce(false), minHeight: 36, padding: '0 10px' }}>⧉</button>
        <button type="button" onClick={() => maj(p => ed.supprimerDéclaration(p, i))} aria-label={`Supprimer la déclaration ${i + 1}`} style={{ ...S.puce(false), minHeight: 36, padding: '0 10px' }}>🗑️</button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <p style={S.étiquette}>Effet</p>
            <Segments aria={`Effet de la déclaration ${i + 1}`} S={S} valeur={d.effet} onChange={v => maj(p => ed.définirEffet(p, i, v))} options={[['Allow', '✅ Allow (autoriser)'], ['Deny', '⛔ Deny (interdire)']]} />
          </div>
          <label style={{ flex: '1 1 140px', minWidth: 0 }}>
            <span style={S.étiquette}>Sid (identifiant)</span>
            <input value={d.sid ?? ''} onChange={e => maj(p => ed.définirSid(p, i, e.target.value))} aria-label={`Sid de la déclaration ${i + 1}`} placeholder="LectureBucket" autoCapitalize="off" spellCheck={false} style={{ ...S.champ, fontSize: 16 }} />
          </label>
        </div>

        {t.principal === 'requis' && <EditeurPrincipal principal={d.principal} type={type} T={T} S={S} onChange={pr => maj(p => ed.définirPrincipal(p, i, pr))} />}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <p style={{ ...S.étiquette, margin: 0 }}>{actions.inverse ? 'NotAction (toutes SAUF)' : 'Actions'}</p>
            <label style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={actions.inverse} onChange={() => maj(p => ed.basculerInverse(p, i, 'actions'))} style={{ width: 18, height: 18, accentColor: T.accent }} /> NotAction</label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {actions.liste.map(a => <PuceSuppr key={a} texte={a} T={T} onSuppr={() => maj(p => ed.retirerDeListe(p, i, 'actions', a))} />)}
            {!actions.liste.length && <span style={{ fontSize: 13, color: '#dc2626' }}>Aucune action : ajoutez-en ci-dessous.</span>}
          </div>
          <AjoutTexte S={S} T={T} placeholder="s3:GetObject  ou  s3:Get*  ou  *" aria={`Ajouter une action à la déclaration ${i + 1}`} onAjouter={v => maj(p => ed.ajouterÀListe(p, i, 'actions', v))} />
          <button type="button" onClick={() => setParcourir(v => !v)} aria-expanded={parcourir} style={{ ...S.puce(false), minHeight: 38, marginTop: 8, fontSize: 13 }}>{parcourir ? '▾ Masquer' : '🔎 Parcourir les services et actions'}</button>
          {parcourir && <div style={{ marginTop: 8 }}><SelecteurActions données={données} T={T} S={S} onAjouter={v => maj(p => ed.ajouterÀListe(p, i, 'actions', v))} /></div>}
        </div>

        <EditeurRessources
          interdite={t.ressource === 'interdite'} ressources={d.ressources} actions={actions.liste} données={données} T={T} S={S}
          onAjouter={v => maj(p => ed.ajouterÀListe(p, i, 'ressources', v))} onRetirer={v => maj(p => ed.retirerDeListe(p, i, 'ressources', v))}
          onBasculer={() => maj(p => ed.basculerInverse(p, i, 'ressources'))} onActiver={() => maj(p => ed.activerRessources(p, i))}
        />

        <EditeurConditions
          conditions={d.conditions ?? []} clésConnues={clésConnues} données={données} indice={i} T={T} S={S}
          onAjouter={c => maj(p => ed.ajouterCondition(p, i, c))} onModifier={(k, patch) => maj(p => ed.modifierCondition(p, i, k, patch))} onSupprimer={k => maj(p => ed.supprimerCondition(p, i, k))}
        />
      </div>
    </section>
  )
}

export default function Constructeur({ politique, type, onChange, données, T, S }) {
  return (
    <div>
      {politique.déclarations.map((d, i) => <Carte key={i} d={d} i={i} total={politique.déclarations.length} politique={politique} type={type} onChange={onChange} données={données} T={T} S={S} />)}
      {!politique.déclarations.length && <p style={{ fontSize: 14, color: T.textMuted }}>Aucune déclaration : ajoutez-en une.</p>}
      <button type="button" onClick={() => onChange(ed.ajouterDéclaration(politique, type))} style={{ ...S.puce(true), minHeight: 44 }}>+ Ajouter une déclaration</button>
    </div>
  )
}
