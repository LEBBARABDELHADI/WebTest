// Zone de test d'une regex (en bas de l'écran) : texte libre avec surlignage des
// correspondances, verdict par ligne, liste des correspondances et de leurs groupes.
import { useMemo } from 'react'
import { grotesk } from '../../../lib/theme'
import { colorerCorrespondances } from '../../../lib/querygen/coloration'
import EditeurCode from './EditeurCode'

const MAX_AFFICHÉES = 60
const tronquer = (t, n = 90) => (t.length > n ? `${t.slice(0, n - 1)}…` : t)
const visible = t => t.replace(/\t/g, '⇥').replace(/ $/, '␣')

export default function ZoneTest({ T, S, texte, onTexte, parLigne, onMode, résultat, onExemples, exemplesDispo, onVider, ancré }) {
  const àJour = !!résultat && résultat.pour === texte
  const colorer = useMemo(() => (àJour && résultat.ok && résultat.correspondances.length ? t => colorerCorrespondances(t, résultat.correspondances) : null), [àJour, résultat])
  const bouton = { ...S.puce(false), minHeight: 36, fontSize: 13 }
  return (
    <section aria-labelledby="rx-test" style={S.carte}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <h3 id="rx-test" style={{ margin: 0, fontFamily: grotesk, fontSize: 17 }}>3 · Tester la regex</h3>
        <span style={{ flex: 1 }} />
        <button onClick={onExemples} disabled={!exemplesDispo} style={{ ...bouton, opacity: exemplesDispo ? 1 : 0.5 }}>💡 Insérer des exemples</button>
        <button onClick={onVider} aria-label="Vider le texte de test" style={bouton}>🗑️</button>
      </div>
      <div role="radiogroup" aria-label="Façon de tester" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button role="radio" aria-checked={parLigne} onClick={() => onMode(true)} style={{ ...S.puce(parLigne), minHeight: 34, fontSize: 13 }}>Chaque ligne séparément</button>
        <button role="radio" aria-checked={!parLigne} onClick={() => onMode(false)} style={{ ...S.puce(!parLigne), minHeight: 34, fontSize: 13 }}>Texte entier</button>
      </div>
      <EditeurCode
        valeur={texte}
        onChange={onTexte}
        colorer={colorer}
        T={T}
        hauteur={170}
        ariaLabel="Texte à tester"
        placeholder={'Tapez ou collez ici le texte à tester : les correspondances sont surlignées.\nChaque ligne est testée séparément (mode « Chaque ligne séparément »).'}
      />
      <div aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {!résultat || !àJour ? (
          <span style={{ color: T.textMuted }}>Test en cours…</span>
        ) : !résultat.ok ? (
          <div role="alert" style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.35)' }}>
            {résultat.délai ? '⚠️' : '❌'} {résultat.erreur.message}
          </div>
        ) : résultat.total === 0 ? (
          <span style={{ color: '#d97706', fontWeight: 700 }}>Aucune correspondance{texte.trim() ? '' : ' (le texte est vide)'}.</span>
        ) : (
          <span style={{ color: '#2e9e6b', fontWeight: 700 }}>✅ {résultat.total}{résultat.tronqué ? '+' : ''} correspondance{résultat.total > 1 ? 's' : ''} · {résultat.nbLignesCorrespondantes} ligne{résultat.nbLignesCorrespondantes > 1 ? 's' : ''} sur {résultat.nbLignes}
            <span style={{ color: T.textMuted, fontWeight: 400 }}> · {résultat.durée < 1 ? '< 1' : Math.round(résultat.durée)} ms</span>
          </span>
        )}
      </div>
      {!parLigne && ancré && texte.includes('\n') && (
        <p style={{ margin: '6px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>ℹ️ Le motif est ancré (^ … $) : en mode « Texte entier » il doit correspondre au texte tout entier. Pour tester chaque ligne, choisissez « Chaque ligne séparément » ou activez le drapeau m.</p>
      )}
      {àJour && résultat.ok && résultat.nbLignes > 1 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 14, fontFamily: grotesk, fontWeight: 700 }}>Verdict par ligne</summary>
          <ul aria-label="Verdict par ligne" style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, maxHeight: 220, overflowY: 'auto', fontSize: 13.5 }}>
            {résultat.lignes.slice(0, 200).map(l => (
              <li key={l.n} style={{ display: 'flex', gap: 8, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>
                <span aria-label={l.ok ? 'correspond' : 'ne correspond pas'}>{l.ok ? '✅' : '❌'}</span>
                <span style={{ color: T.textMuted, minWidth: 28 }}>{l.n}</span>
                <code style={{ wordBreak: 'break-all', color: T.text }}>{l.texte === '' ? '(ligne vide)' : visible(tronquer(l.texte))}</code>
              </li>
            ))}
          </ul>
        </details>
      )}
      {àJour && résultat.ok && résultat.total > 0 && (
        <details open style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 14, fontFamily: grotesk, fontWeight: 700 }}>Correspondances et groupes</summary>
          <ol aria-label="Correspondances" style={{ margin: '6px 0 0', paddingLeft: 22, fontSize: 13.5, lineHeight: 1.55 }}>
            {résultat.correspondances.slice(0, MAX_AFFICHÉES).map((c, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <code style={{ background: T.accentSoft, borderRadius: 4, padding: '0 4px', wordBreak: 'break-all' }}>{c.texte === '' ? '(vide)' : visible(tronquer(c.texte, 120))}</code>
                <span style={{ color: T.textMuted }}> · ligne {c.ligne}, colonne {c.colonne}</span>
                {c.groupes.length > 0 && (
                  <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {c.groupes.map(g => (
                      <span key={g.num} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '0 6px', fontSize: 12.5, wordBreak: 'break-all' }}>
                        <strong>{g.nom ?? `$${g.num}`}</strong> = {g.valeur === null ? <em style={{ color: T.textMuted }}>non défini</em> : <code>{visible(tronquer(g.valeur, 60))}</code>}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {résultat.total > MAX_AFFICHÉES && <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted }}>… {résultat.total - MAX_AFFICHÉES}{résultat.tronqué ? '+' : ''} de plus (surlignées dans le texte).</p>}
        </details>
      )}
    </section>
  )
}
