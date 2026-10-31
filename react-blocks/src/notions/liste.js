// Liste des notions (titres seulement) : légère, pour l'accueil. Le contenu
// complet (démos, code) est dans index.js, chargé avec la page de la notion.
export const notionsListe = [
  { id: '01-composant', titre: 'Composant de base', emoji: '🧱', description: 'Un composant est une fonction qui retourne du JSX.', niveau: 'Débutant' },
  { id: '02-props', titre: 'Props', emoji: '📦', description: 'Les props transmettent des données du parent à l\'enfant.', niveau: 'Débutant' },
  { id: '03-useState', titre: 'useState', emoji: '🔄', description: 'Gérer un état local qui déclenche un re-rendu.', niveau: 'Débutant' },
  { id: '04-useEffect', titre: 'useEffect', emoji: '⚡', description: 'Déclencher des effets de bord après le rendu.', niveau: 'Intermédiaire' },
  { id: '05-listes', titre: 'Listes & Clés', emoji: '📋', description: 'Afficher des listes dynamiques avec .map() et key.', niveau: 'Débutant' },
  { id: '06-formulaire', titre: 'Formulaires', emoji: '📝', description: 'Contrôler les inputs avec l\'état React.', niveau: 'Intermédiaire' },
  { id: '07-conditionnel', titre: 'Rendu conditionnel', emoji: '🔀', description: 'Afficher ou masquer des éléments selon une condition.', niveau: 'Débutant' },
  { id: '08-useContext', titre: 'useContext', emoji: '🌐', description: 'Partager des données sans passer par les props.', niveau: 'Intermédiaire' },
  { id: '09-useRef', titre: 'useRef', emoji: '🎯', description: 'Accéder au DOM ou garder une valeur sans re-rendu.', niveau: 'Intermédiaire' },
  { id: '10-hookCustom', titre: 'Hook personnalisé', emoji: '🪝', description: 'Créer son propre hook pour réutiliser de la logique.', niveau: 'Avancé' },
]
