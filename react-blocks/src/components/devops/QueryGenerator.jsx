// Outil « Query Generator » : deux modes.
//  · { } JSON → jq & JMESPath : requêtes générées, exécutées (jq 1.8 WebAssembly, jmespath.js) et vérifiées ;
//  · 🔤 Texte → Regex : une description (ou des exemples) → regex expliquée, vérifiée, testable.
// Les deux restent dans le navigateur : aucune donnée n'est envoyée. Un mode n'est
// chargé qu'à sa première ouverture, puis reste monté (son état est conservé).
import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { grotesk } from '../../lib/theme'
import { STYLE_CODE } from '../../lib/querygen/apparence'

const GenerateurJson = lazy(() => import('./querygen/GenerateurJson'))
const GenerateurRegex = lazy(() => import('./querygen/GenerateurRegex'))

const MODES = [['json', '{ } JSON → jq & JMESPath'], ['regex', '🔤 Texte → Regex']]

export default function QueryGenerator({ T, S }) {
  const [paramètres] = useSearchParams()
  const [mode, setMode] = useState(() => (paramètres.get('mode') === 'regex' ? 'regex' : 'json'))
  const [visités, setVisités] = useState(() => new Set([mode]))
  const choisir = m => { setMode(m); setVisités(v => (v.has(m) ? v : new Set([...v, m]))) }
  const attente = <div style={S.carte}>Chargement…</div>
  return (
    <div>
      <style>{STYLE_CODE}</style>
      <div style={{ ...S.carte, padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ margin: '0 6px 0 4px', fontFamily: grotesk, fontSize: 21 }}>🧮 Query Generator</h2>
          <div role="tablist" aria-label="Mode du générateur" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MODES.map(([id, nom]) => <button key={id} role="tab" aria-selected={mode === id} onClick={() => choisir(id)} style={{ ...S.puce(mode === id), minHeight: 40 }}>{nom}</button>)}
          </div>
        </div>
      </div>
      {visités.has('json') && <div style={{ display: mode === 'json' ? 'block' : 'none' }}><Suspense fallback={attente}><GenerateurJson T={T} S={S} /></Suspense></div>}
      {visités.has('regex') && <div style={{ display: mode === 'regex' ? 'block' : 'none' }}><Suspense fallback={attente}><GenerateurRegex T={T} S={S} /></Suspense></div>}

      <aside aria-label="Confidentialité" style={{ ...S.carte, fontSize: 13.5, lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>🔒 <strong>Confidentialité.</strong> Le JSON et les textes sont lus, analysés et interrogés dans ce navigateur : jq 1.8 (compilé en WebAssembly), JMESPath et le moteur de regex tournent dans un Web Worker. Aucune donnée n'est envoyée ni conservée.</p>
        <p style={{ margin: '6px 0 0' }}>🤖 <strong>IA externe : non configurée.</strong> Les descriptions sont interprétées localement (noms et valeurs du JSON, règles FR/EN, catalogue de formats) ; le mode guidé fonctionne sans aucune IA. Une IA externe n'est jamais appelée depuis la page avec une clé API : il faudrait un backend sécurisé, et votre accord avant tout envoi.</p>
      </aside>
    </div>
  )
}
