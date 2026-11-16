// La même regex écrite pour chaque dialecte (JavaScript, PCRE, Python, POSIX ERE,
// Go/RE2), avec avertissements, impossibilités expliquées et extraits de code.
import { grotesk } from '../../../lib/theme'
import { MONO } from '../../../lib/querygen/apparence'
import BoutonCopier from './BoutonCopier'

const ORDRE = ['js', 'pcre', 'python', 'ere', 'go']

export default function PanneauDialectes({ variantes, dialecte, onDialecte, T, S }) {
  if (!variantes) return null
  const v = variantes[dialecte] ?? variantes.js
  const texteMotif = v.impossible ? '' : `${v.drapeaux?.préfixe ?? ''}${v.pattern}`
  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ ...S.étiquette }}>Autres langages et outils</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select value={dialecte} onChange={e => onDialecte(e.target.value)} aria-label="Dialecte" style={{ ...S.champ, width: 'auto', maxWidth: '100%', minWidth: 0, minHeight: 40, padding: '6px 10px', fontFamily: grotesk, fontSize: 14 }}>
          {ORDRE.map(d => <option key={d} value={d}>{variantes[d].nom}{variantes[d].impossible ? ' — non exprimable' : ''}</option>)}
        </select>
        {dialecte !== 'js' && !v.impossible && <span style={{ fontSize: 12.5, color: T.textMuted }}>réécrite pour ce dialecte, non exécutée dans le navigateur</span>}
      </div>
      {v.impossible ? (
        <div role="alert" style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: T.bg, border: `1px dashed ${T.border}`, fontSize: 14, lineHeight: 1.55 }}>
          🚫 <strong>Pas d'équivalent exact.</strong> {v.impossible}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <code aria-label={`Motif ${v.nom}`} style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, fontFamily: MONO, fontSize: 13, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{texteMotif}</code>
            <BoutonCopier texte={texteMotif} T={T} libellé="📋" aria={`Copier le motif ${v.nom}`} />
          </div>
          {v.drapeaux?.python?.length > 0 && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.textMuted }}>Drapeaux : {v.drapeaux.python.join(' | ')}</p>}
          {v.drapeaux?.grep?.length > 0 && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.textMuted }}>Option grep : {v.drapeaux.grep.join(' ')}</p>}
          {v.avertissements.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.5, color: '#d97706' }}>
              {v.avertissements.map(a => <li key={a}>{a}</li>)}
            </ul>
          )}
          {v.code.map(c => (
            <div key={c.titre} style={{ marginTop: 8 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12.5, color: T.textMuted, fontWeight: 700 }}>{c.titre}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <pre style={{ flex: 1, minWidth: 0, margin: 0, padding: '8px 10px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, fontFamily: MONO, fontSize: 12.5, lineHeight: 1.5, overflowX: 'auto', whiteSpace: 'pre' }}>{c.code}</pre>
                <BoutonCopier texte={c.code} T={T} libellé="📋" aria={`Copier l'exemple ${c.titre}`} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
