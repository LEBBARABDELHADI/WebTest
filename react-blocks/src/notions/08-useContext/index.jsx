import { useState, useContext, createContext } from 'react'

export const code = `import { createContext, useContext, useState } from 'react'

// 1. Créer le contexte
const ThemeCtx = createContext('clair')

// 2. Fournir le contexte (Provider)
function App() {
  const [theme, setTheme] = useState('clair')
  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      <DeepChild />
    </ThemeCtx.Provider>
  )
}

// 3. Consommer le contexte (n'importe où dans l'arbre)
function DeepChild() {
  const { theme } = useContext(ThemeCtx)
  return <p>Thème actuel : {theme}</p>
}`

export const explication = `### Le problème : prop drilling
Imagine transmettre \`utilisateur\` de \`App\` → \`Layout\` → \`Sidebar\` → \`Avatar\`. Chaque niveau doit passer la prop même s'il ne l'utilise pas. C'est le **prop drilling** — long et fragile.

### La solution : Context
Le Context crée un **canal direct** entre le fournisseur et n'importe quel consommateur dans l'arbre, sans passer par les intermédiaires.

### Les 3 étapes
1. **Créer** : \`const MonCtx = createContext(valeurParDéfaut)\`
2. **Fournir** : \`<MonCtx.Provider value={...}>\` enveloppe l'arbre
3. **Consommer** : \`const valeur = useContext(MonCtx)\` dans n'importe quel enfant

### Quand utiliser le Context ?
- Thème (dark/light)
- Langue / internationalisation
- Utilisateur connecté
- Panier d'achat global

### Quand NE PAS l'utiliser ?
- Données locales à 2-3 composants → props suffisent
- Données qui changent très souvent → risque de re-renders inutiles

### Optimisation
Chaque composant qui consomme un contexte se re-rend quand la **valeur du Provider change**. Pour les grandes apps, séparer les contextes (ex: \`UserCtx\` et \`ThemeCtx\` séparément).

⚠️ Un \`useContext\` retourne \`undefined\` si le composant n'est pas à l'intérieur du \`Provider\` correspondant.
✅ Bonne pratique : créer un hook personnalisé \`useTheme()\` qui appelle \`useContext(ThemeCtx)\` — plus propre à utiliser.`

const ThemeCtx = createContext()

function Bouton({ children, onClick, active }) {
  const { theme } = useContext(ThemeCtx)
  const isDark = theme === 'sombre'
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: '8px',
      background: active ? '#6c63ff' : isDark ? '#252836' : '#e2e8f0',
      color: active ? '#fff' : isDark ? '#94a3b8' : '#0f1117',
      border: `1px solid ${active ? '#6c63ff' : isDark ? '#2d3148' : '#ccc'}`,
    }}>{children}</button>
  )
}

function Carte({ titre, valeur }) {
  const { theme } = useContext(ThemeCtx)
  const isDark = theme === 'sombre'
  return (
    <div style={{
      padding: '16px', borderRadius: '10px',
      background: isDark ? '#1a1d27' : '#f8f8f8',
      color: isDark ? '#e2e8f0' : '#0f1117',
      border: `1px solid ${isDark ? '#2d3148' : '#ddd'}`,
      transition: 'all 0.3s',
    }}>
      <p style={{ color: isDark ? '#94a3b8' : '#666', fontSize: '12px' }}>{titre}</p>
      <p style={{ fontWeight: 'bold', fontSize: '20px' }}>{valeur}</p>
    </div>
  )
}

export default function UseContextNotion() {
  const [theme, setTheme] = useState('sombre')
  const [langue, setLangue] = useState('fr')

  const textes = {
    fr: { bonjour: 'Bonjour !', titre: 'Tableau de bord', revenus: 'Revenus', users: 'Utilisateurs' },
    en: { bonjour: 'Hello!', titre: 'Dashboard', revenus: 'Revenue', users: 'Users' },
    ar: { bonjour: 'مرحبا!', titre: 'لوحة التحكم', revenus: 'الإيرادات', users: 'المستخدمون' },
  }
  const t = textes[langue]

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px', alignSelf: 'center' }}>Thème :</span>
          {['sombre', 'clair'].map(t => (
            <Bouton key={t} active={theme === t} onClick={() => setTheme(t)}>{t}</Bouton>
          ))}
          <span style={{ color: '#94a3b8', fontSize: '13px', alignSelf: 'center', marginLeft: '8px' }}>Langue :</span>
          {['fr', 'en', 'ar'].map(l => (
            <Bouton key={l} active={langue === l} onClick={() => setLangue(l)}>{l}</Bouton>
          ))}
        </div>

        <h3 style={{ color: theme === 'sombre' ? '#a78bfa' : '#6c63ff' }}>{t.bonjour} — {t.titre}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Carte titre={t.revenus} valeur="12 450 €" />
          <Carte titre={t.users} valeur="1 247" />
        </div>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>
          Les composants lisent le contexte sans recevoir de props !
        </p>
      </div>
    </ThemeCtx.Provider>
  )
}
