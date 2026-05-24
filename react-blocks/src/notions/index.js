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

export const notions = [
  {
    id: '01-composant',
    titre: 'Composant de base',
    emoji: '🧱',
    description: 'Un composant est une fonction qui retourne du JSX.',
    niveau: 'Débutant',
    component: ComposantDeBase,
    explication: expl01,
    code: code01,
    source: extractDemoSource(rawFiles['./01-composant/index.jsx']),
  },
  {
    id: '02-props',
    titre: 'Props',
    emoji: '📦',
    description: 'Les props transmettent des données du parent à l\'enfant.',
    niveau: 'Débutant',
    component: PropsNotion,
    explication: expl02,
    code: code02,
    source: extractDemoSource(rawFiles['./02-props/index.jsx']),
  },
  {
    id: '03-useState',
    titre: 'useState',
    emoji: '🔄',
    description: 'Gérer un état local qui déclenche un re-rendu.',
    niveau: 'Débutant',
    component: UseStateNotion,
    explication: expl03,
    code: code03,
    source: extractDemoSource(rawFiles['./03-useState/index.jsx']),
  },
  {
    id: '04-useEffect',
    titre: 'useEffect',
    emoji: '⚡',
    description: 'Déclencher des effets de bord après le rendu.',
    niveau: 'Intermédiaire',
    component: UseEffectNotion,
    explication: expl04,
    code: code04,
    source: extractDemoSource(rawFiles['./04-useEffect/index.jsx']),
  },
  {
    id: '05-listes',
    titre: 'Listes & Clés',
    emoji: '📋',
    description: 'Afficher des listes dynamiques avec .map() et key.',
    niveau: 'Débutant',
    component: ListesNotion,
    explication: expl05,
    code: code05,
    source: extractDemoSource(rawFiles['./05-listes/index.jsx']),
  },
  {
    id: '06-formulaire',
    titre: 'Formulaires',
    emoji: '📝',
    description: 'Contrôler les inputs avec l\'état React.',
    niveau: 'Intermédiaire',
    component: FormulaireNotion,
    explication: expl06,
    code: code06,
    source: extractDemoSource(rawFiles['./06-formulaire/index.jsx']),
  },
  {
    id: '07-conditionnel',
    titre: 'Rendu conditionnel',
    emoji: '🔀',
    description: 'Afficher ou masquer des éléments selon une condition.',
    niveau: 'Débutant',
    component: ConditionnelNotion,
    explication: expl07,
    code: code07,
    source: extractDemoSource(rawFiles['./07-conditionnel/index.jsx']),
  },
  {
    id: '08-useContext',
    titre: 'useContext',
    emoji: '🌐',
    description: 'Partager des données sans passer par les props.',
    niveau: 'Intermédiaire',
    component: UseContextNotion,
    explication: expl08,
    code: code08,
    source: extractDemoSource(rawFiles['./08-useContext/index.jsx']),
  },
  {
    id: '09-useRef',
    titre: 'useRef',
    emoji: '🎯',
    description: 'Accéder au DOM ou garder une valeur sans re-rendu.',
    niveau: 'Intermédiaire',
    component: UseRefNotion,
    explication: expl09,
    code: code09,
    source: extractDemoSource(rawFiles['./09-useRef/index.jsx']),
  },
  {
    id: '10-hookCustom',
    titre: 'Hook personnalisé',
    emoji: '🪝',
    description: 'Créer son propre hook pour réutiliser de la logique.',
    niveau: 'Avancé',
    component: HookCustomNotion,
    explication: expl10,
    code: code10,
    source: extractDemoSource(rawFiles['./10-hookCustom/index.jsx']),
  },
]
