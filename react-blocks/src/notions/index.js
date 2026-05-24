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

export const notions = [
  {
    id: '01-composant',
    titre: 'Composant de base',
    emoji: '🧱',
    description: 'Un composant est une fonction qui retourne du JSX.',
    niveau: 'Débutant',
    component: ComposantDeBase,
  },
  {
    id: '02-props',
    titre: 'Props',
    emoji: '📦',
    description: 'Les props transmettent des données du parent à l\'enfant.',
    niveau: 'Débutant',
    component: PropsNotion,
  },
  {
    id: '03-useState',
    titre: 'useState',
    emoji: '🔄',
    description: 'Gérer un état local qui déclenche un re-rendu.',
    niveau: 'Débutant',
    component: UseStateNotion,
  },
  {
    id: '04-useEffect',
    titre: 'useEffect',
    emoji: '⚡',
    description: 'Déclencher des effets de bord après le rendu.',
    niveau: 'Intermédiaire',
    component: UseEffectNotion,
  },
  {
    id: '05-listes',
    titre: 'Listes & Clés',
    emoji: '📋',
    description: 'Afficher des listes dynamiques avec .map() et key.',
    niveau: 'Débutant',
    component: ListesNotion,
  },
  {
    id: '06-formulaire',
    titre: 'Formulaires',
    emoji: '📝',
    description: 'Contrôler les inputs avec l\'état React.',
    niveau: 'Intermédiaire',
    component: FormulaireNotion,
  },
  {
    id: '07-conditionnel',
    titre: 'Rendu conditionnel',
    emoji: '🔀',
    description: 'Afficher ou masquer des éléments selon une condition.',
    niveau: 'Débutant',
    component: ConditionnelNotion,
  },
  {
    id: '08-useContext',
    titre: 'useContext',
    emoji: '🌐',
    description: 'Partager des données sans passer par les props.',
    niveau: 'Intermédiaire',
    component: UseContextNotion,
  },
  {
    id: '09-useRef',
    titre: 'useRef',
    emoji: '🎯',
    description: 'Accéder au DOM ou garder une valeur sans re-rendu.',
    niveau: 'Intermédiaire',
    component: UseRefNotion,
  },
  {
    id: '10-hookCustom',
    titre: 'Hook personnalisé',
    emoji: '🪝',
    description: 'Créer son propre hook pour réutiliser de la logique.',
    niveau: 'Avancé',
    component: HookCustomNotion,
  },
]
