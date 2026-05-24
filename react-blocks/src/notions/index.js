import ComposantDeBase from './01-composant'
import PropsNotion from './02-props'
import UseStateNotion from './03-useState'
import UseEffectNotion from './04-useEffect'
import ListesNotion from './05-listes'
import FormulaireNotion from './06-formulaire'
import ConditionnelNotion from './07-conditionnel'
import UseContextNotion from './08-useContext'
import UseRefNotion from './09-useRef'
import HookCustomNotion from './10-hookCustom'

// Import du code source brut de chaque fichier notion via Vite
const rawFiles = import.meta.glob('./**/index.jsx', { as: 'raw', eager: true })

// Extrait les imports + la fonction export default (code réel de la démo)
function extractDemoSource(raw) {
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
    source: extractDemoSource(rawFiles['./01-composant/index.jsx']),
  },
  {
    id: '02-props',
    titre: 'Props',
    emoji: '📦',
    description: 'Les props transmettent des données du parent à l\'enfant.',
    niveau: 'Débutant',
    component: PropsNotion,
    source: extractDemoSource(rawFiles['./02-props/index.jsx']),
  },
  {
    id: '03-useState',
    titre: 'useState',
    emoji: '🔄',
    description: 'Gérer un état local qui déclenche un re-rendu.',
    niveau: 'Débutant',
    component: UseStateNotion,
    source: extractDemoSource(rawFiles['./03-useState/index.jsx']),
  },
  {
    id: '04-useEffect',
    titre: 'useEffect',
    emoji: '⚡',
    description: 'Déclencher des effets de bord après le rendu.',
    niveau: 'Intermédiaire',
    component: UseEffectNotion,
    source: extractDemoSource(rawFiles['./04-useEffect/index.jsx']),
  },
  {
    id: '05-listes',
    titre: 'Listes & Clés',
    emoji: '📋',
    description: 'Afficher des listes dynamiques avec .map() et key.',
    niveau: 'Débutant',
    component: ListesNotion,
    source: extractDemoSource(rawFiles['./05-listes/index.jsx']),
  },
  {
    id: '06-formulaire',
    titre: 'Formulaires',
    emoji: '📝',
    description: 'Contrôler les inputs avec l\'état React.',
    niveau: 'Intermédiaire',
    component: FormulaireNotion,
    source: extractDemoSource(rawFiles['./06-formulaire/index.jsx']),
  },
  {
    id: '07-conditionnel',
    titre: 'Rendu conditionnel',
    emoji: '🔀',
    description: 'Afficher ou masquer des éléments selon une condition.',
    niveau: 'Débutant',
    component: ConditionnelNotion,
    source: extractDemoSource(rawFiles['./07-conditionnel/index.jsx']),
  },
  {
    id: '08-useContext',
    titre: 'useContext',
    emoji: '🌐',
    description: 'Partager des données sans passer par les props.',
    niveau: 'Intermédiaire',
    component: UseContextNotion,
    source: extractDemoSource(rawFiles['./08-useContext/index.jsx']),
  },
  {
    id: '09-useRef',
    titre: 'useRef',
    emoji: '🎯',
    description: 'Accéder au DOM ou garder une valeur sans re-rendu.',
    niveau: 'Intermédiaire',
    component: UseRefNotion,
    source: extractDemoSource(rawFiles['./09-useRef/index.jsx']),
  },
  {
    id: '10-hookCustom',
    titre: 'Hook personnalisé',
    emoji: '🪝',
    description: 'Créer son propre hook pour réutiliser de la logique.',
    niveau: 'Avancé',
    component: HookCustomNotion,
    source: extractDemoSource(rawFiles['./10-hookCustom/index.jsx']),
  },
]
