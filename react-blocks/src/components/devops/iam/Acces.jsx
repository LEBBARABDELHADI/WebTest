// « Qui peut quoi » : explication en français et répartition des actions par service et niveau d'accès.
import { useMemo } from 'react'
import { grotesk } from '../../../lib/theme'
import { NIVEAUX_FR } from '../../../lib/iam/donnees'
import { expliquerPolitique } from '../../../lib/iam/expliquer'
import { résumerAccès } from '../../../lib/iam/etendre'

export default function Acces({ politique, type, données, T, S }) {
  const explication = useMemo(() => expliquerPolitique(politique, données.cat, type), [politique, type, données])
  const accès = useMemo(() => résumerAccès(données.cat, politique), [politique, données])
  return (
    <div>
      <p style={S.étiquette}>En français</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {explication.map(e => (
          <div key={e.indice} style={{ border: `1px solid ${e.effet === 'Deny' ? '#dc262655' : T.border}`, borderRadius: 10, padding: '8px 10px', background: T.bg }}>
            <p style={{ margin: '0 0 2px', fontFamily: grotesk, fontWeight: 800, fontSize: 13 }}>{e.titre}</p>
            {e.phrases.map(p => <p key={p} style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{p}</p>)}
          </div>
        ))}
        {!explication.length && <p style={{ margin: 0, fontSize: 14, color: T.textMuted }}>Aucune déclaration.</p>}
      </div>
      {type !== 'approbation' && accès.some(a => a.services.length || a.tout) && (
        <>
          <p style={{ ...S.étiquette, marginTop: 12 }}>Actions par service et niveau d'accès</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: T.textMuted }}>
                  <th style={{ padding: '4px 8px 4px 0' }}>Décl.</th><th style={{ padding: 4 }}>Service</th>
                  {Object.values(NIVEAUX_FR).map(n => <th key={n} style={{ padding: 4, textAlign: 'right', whiteSpace: 'nowrap' }}>{n.replace(' (tags)', '').replace('Gestion des permissions', 'Permissions')}</th>)}
                </tr>
              </thead>
              <tbody>
                {accès.flatMap(a => (a.tout
                  ? [<tr key={`${a.indice}-tout`}><td style={{ padding: '4px 8px 4px 0' }}>{a.indice + 1}</td><td colSpan={6} style={{ padding: 4 }}>{a.effet === 'Deny' ? '⛔' : '✅'} <strong>toutes les actions de tous les services</strong> ({a.nombre.toLocaleString('fr-FR')})</td></tr>]
                  : a.services.map(s => (
                    <tr key={`${a.indice}-${s.service}`} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: '4px 8px 4px 0' }}>{a.indice + 1}{a.effet === 'Deny' ? ' ⛔' : ''}{a.inverse ? ' (sauf)' : ''}</td>
                      <td style={{ padding: 4 }}><code>{s.service}</code></td>
                      {s.niveaux.map(n => <td key={n.niveau} style={{ padding: 4, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: n.nombre ? (n.niveau >= 2 ? '#c2410c' : T.text) : T.textMuted }}>{n.nombre || '·'}</td>)}
                    </tr>
                  ))))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textMuted }}>Nombre d'actions développées avec les jokers, d'après les données AWS. En orange : écriture, permissions, étiquettes.</p>
        </>
      )}
    </div>
  )
}
