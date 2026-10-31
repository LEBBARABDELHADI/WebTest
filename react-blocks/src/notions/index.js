import { notionsListe } from './liste'
import ComposantDeBase, { explication as expl01, code as code01 } from './01-composant'
import PropsNotion, { explication as expl02, code as code02 } from './02-props'
import UseStateNotion, { explication as expl03, code as code03 } from './03-useState'
import UseEffectNotion, { explication as expl04, code as code04 } from './04-useEffect'
import ListesNotion, { explication as expl05, code as code05 } from './05-listes'
import FormulaireNotion, { explication as expl06, code as code06 } from './06-formulaire'
import ConditionnelNotion, { explication as expl07, code as code07 } from './07-conditionnel'
import UseContextNotion, { explication as expl08, code as code08 } from './08-useContext'
import UseRefNotion, { explication as expl09, code as code09 } from './09-useRef'
import HookCustomNotion, { explication as expl10, code as code10 } from './10-hookCustom'

// Import du code source brut de chaque fichier notion via Vite
const rawFiles = import.meta.glob('./**/index.jsx', { query: '?raw', import: 'default', eager: true })

// Extrait les imports + la fonction export default (code réel de la démo)
function extractDemoSource(raw) {
  if (!raw) return '// Source non disponible'
  const lines = raw.split('\n')
  const importLines = lines.filter(l => l.trimStart().startsWith('import'))
  const demoStart = raw.indexOf('export default function')
  if (demoStart === -1) return raw
  return [...importLines, '', raw.slice(demoStart)].join('\n')
}

const contenus = {
  '01-composant': { component: ComposantDeBase, explication: expl01, code: code01, source: extractDemoSource(rawFiles['./01-composant/index.jsx']) },
  '02-props': { component: PropsNotion, explication: expl02, code: code02, source: extractDemoSource(rawFiles['./02-props/index.jsx']) },
  '03-useState': { component: UseStateNotion, explication: expl03, code: code03, source: extractDemoSource(rawFiles['./03-useState/index.jsx']) },
  '04-useEffect': { component: UseEffectNotion, explication: expl04, code: code04, source: extractDemoSource(rawFiles['./04-useEffect/index.jsx']) },
  '05-listes': { component: ListesNotion, explication: expl05, code: code05, source: extractDemoSource(rawFiles['./05-listes/index.jsx']) },
  '06-formulaire': { component: FormulaireNotion, explication: expl06, code: code06, source: extractDemoSource(rawFiles['./06-formulaire/index.jsx']) },
  '07-conditionnel': { component: ConditionnelNotion, explication: expl07, code: code07, source: extractDemoSource(rawFiles['./07-conditionnel/index.jsx']) },
  '08-useContext': { component: UseContextNotion, explication: expl08, code: code08, source: extractDemoSource(rawFiles['./08-useContext/index.jsx']) },
  '09-useRef': { component: UseRefNotion, explication: expl09, code: code09, source: extractDemoSource(rawFiles['./09-useRef/index.jsx']) },
  '10-hookCustom': { component: HookCustomNotion, explication: expl10, code: code10, source: extractDemoSource(rawFiles['./10-hookCustom/index.jsx']) },
}

export const notions = notionsListe.map(n => ({ ...n, ...contenus[n.id] }))
