import{_t as e,dt as t,ft as n,gt as r,mt as i,pt as a,ut as o}from"./index-DCSR3pR1.js";var s=e(r(),1),c=`export const code = \`// Un composant = une fonction qui retourne du JSX
function Salutation({ nom }) {
  return (
    <div style={{ padding: '16px', background: '#252836', borderRadius: '8px' }}>
      <h2>👋 Bonjour, {nom} !</h2>
      <p>Je suis un composant React.</p>
    </div>
  )
}

// On l'utilise comme une balise HTML
function App() {
  return <Salutation nom="Monde" />
}\`

export const explication = \`### Qu'est-ce qu'un composant ?
Un **composant** React est une fonction JavaScript qui retourne du **JSX** — une syntaxe proche du HTML que React transforme en éléments visuels.

### Les 3 règles de base
1. Le nom **commence par une majuscule** (sinon React le traite comme une balise HTML)
2. Il retourne du **JSX** — un seul élément racine (utilise \\\`<>...</>\\\` pour en grouper plusieurs)
3. Il peut recevoir des **props** en paramètre pour être personnalisé

### Ce qui se passe sous le capot
Le JSX \\\`<Salutation nom="Monde" />\\\` est transformé par Babel en :
\\\`React.createElement(Salutation, { nom: "Monde" })\\\`
C'est du JavaScript pur — pas de magie.

### Pourquoi des composants ?
- **Réutilisabilité** : écrire une fois, utiliser partout
- **Lisibilité** : chaque composant a une responsabilité claire
- **Composabilité** : assembler des petits blocs pour construire des UI complexes

⚠️ Un composant doit être **pur** : pour les mêmes props, il retourne toujours le même JSX. Ne pas modifier des variables externes à l'intérieur.
✅ Commence petit : si un composant dépasse 50 lignes, envisage de le découper.\`

export default function ComposantDeBase() {
  function Salutation({ nom }) {
    return (
      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '8px', border: '1px solid #2d3148' }}>
        <h2 style={{ color: '#a78bfa', marginBottom: '8px' }}>👋 Bonjour, {nom} !</h2>
        <p style={{ color: '#94a3b8' }}>Je suis un composant React.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Salutation nom="Monde" />
      <Salutation nom="React" />
      <Salutation nom="Développeur" />
    </div>
  )
}
`,l=`import { useState } from 'react'

export const code = \`function Carte({ titre, couleur, score }) {
  return (
    <div style={{ borderLeft: \\\`4px solid \\\${couleur}\\\`, padding: '12px' }}>
      <strong>{titre}</strong>
      <span>Score : {score}</span>
    </div>
  )
}

// Utilisation avec des props différentes
<Carte titre="React"  couleur="#6c63ff" score={95} />
<Carte titre="Vue"    couleur="#4ade80" score={82} />
<Carte titre="Angular" couleur="#f87171" score={74} />\`

export const explication = \`### Qu'est-ce que les props ?
Les **props** (propriétés) sont les paramètres que le composant parent transmet à son enfant. C'est la façon dont les composants communiquent entre eux.

### Flux de données
Les props suivent un flux **unidirectionnel** : parent → enfant uniquement. Un enfant ne peut jamais modifier les props qu'il reçoit.

### Types acceptés
- \\\`string\\\` → \\\`titre="Bonjour"\\\`
- \\\`number\\\` → \\\`score={95}\\\` (accolades obligatoires)
- \\\`boolean\\\` → \\\`actif={true}\\\` ou simplement \\\`actif\\\`
- \\\`tableau / objet\\\` → \\\`data={[1, 2, 3]}\\\`
- \\\`fonction\\\` → \\\`onClick={handleClick}\\\` (callbacks)
- \\\`JSX\\\` → \\\`children={<p>Texte</p>}\\\`

### La déstructuration
Au lieu de \\\`function Carte(props)\\\` puis \\\`props.titre\\\`, on déstructure directement :
\\\`function Carte({ titre, couleur, score })\\\` — plus lisible.

### La prop children
Tout ce qui est entre les balises devient \\\`children\\\` :
\\\`<Carte>Contenu ici</Carte>\\\` → accessible via \\\`props.children\\\`

⚠️ Ne jamais modifier une prop dans l'enfant : \\\`props.score = 100\\\` → interdit et sans effet.
✅ Si l'enfant a besoin de modifier une valeur, le parent doit lui passer une **fonction callback** via les props.\`

const joueurs = [
  { titre: 'React', couleur: '#6c63ff', score: 95 },
  { titre: 'Vue', couleur: '#4ade80', score: 82 },
  { titre: 'Angular', couleur: '#f87171', score: 74 },
  { titre: 'Svelte', couleur: '#fbbf24', score: 88 },
]

function Carte({ titre, couleur, score }) {
  return (
    <div style={{
      borderLeft: \`4px solid \${couleur}\`,
      padding: '12px 16px',
      background: '#1a1d27',
      borderRadius: '0 8px 8px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <strong style={{ color: '#e2e8f0' }}>{titre}</strong>
      <span style={{
        background: couleur + '33',
        color: couleur,
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
      }}>
        {score} pts
      </span>
    </div>
  )
}

export default function PropsNotion() {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
        Clique sur une carte pour voir ses props
      </p>
      {joueurs.map(j => (
        <div key={j.titre} onClick={() => setSelected(j.titre === selected ? null : j.titre)}
          style={{ cursor: 'pointer', opacity: selected && selected !== j.titre ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <Carte {...j} />
        </div>
      ))}
      {selected && (
        <div style={{ marginTop: '8px', padding: '12px', background: '#252836', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#a78bfa' }}>
          {\`<Carte titre="\${joueurs.find(j=>j.titre===selected).titre}" couleur="\${joueurs.find(j=>j.titre===selected).couleur}" score={\${joueurs.find(j=>j.titre===selected).score}} />\`}
        </div>
      )}
    </div>
  )
}
`,u=`import { useState, useRef } from 'react'

export const code = \`import { useState } from 'react'

function Compteur() {
  // [valeur, fonctionMàJ] = useState(valeurInitiale)
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Compteur : {count}</p>

      {/* Mise à jour directe */}
      <button onClick={() => setCount(count + 1)}>+1</button>

      {/* Mise à jour fonctionnelle — recommandée si
          le nouvel état dépend de l'ancien */}
      <button onClick={() => setCount(prev => prev + 1)}>+1 (fn)</button>

      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

// Plusieurs états indépendants
function Panier() {
  const [articles, setArticles] = useState([])
  const [promo, setPromo] = useState(false)

  const ajouter = (item) =>
    setArticles(prev => [...prev, item])

  return (/* ... */)
}\`

export const explication = \`### Qu'est-ce que l'état ?
L'**état** (state) est une valeur que le composant mémorise entre ses renders. Quand l'état change, React re-rend le composant automatiquement pour refléter la nouvelle valeur à l'écran.

### Syntaxe
\\\`const [valeur, setValeur] = useState(valeurInitiale)\\\`
- \\\`valeur\\\` → la valeur actuelle de l'état
- \\\`setValeur\\\` → la fonction pour la modifier
- \\\`valeurInitiale\\\` → uniquement utilisée au **premier rendu**

### 2 façons de mettre à jour
1. **Directe** : \\\`setCount(count + 1)\\\` — utilise la valeur courante
2. **Fonctionnelle** : \\\`setCount(prev => prev + 1)\\\` — utilise l'état précédent (recommandé quand la mise à jour dépend de l'état actuel)

### Ce qui déclenche un re-render
- Appeler \\\`setValeur()\\\` avec une **nouvelle valeur** (React compare avec \\\`Object.is\\\`)
- Si la valeur est la même, React ne re-rend **pas**

### Les pièges courants
⚠️ Ne jamais modifier l'état directement : \\\`count = count + 1\\\` → React ne sait pas qu'il y a eu un changement.
⚠️ Pour les objets et tableaux, toujours créer une **nouvelle référence** : \\\`setUser({ ...user, nom: 'Alice' })\\\` et non \\\`user.nom = 'Alice'\\\`
⚠️ \\\`useState\\\` est asynchrone : juste après \\\`setCount(5)\\\`, \\\`count\\\` vaut encore l'ancienne valeur.
✅ Chaque appel à \\\`useState\\\` est indépendant — tu peux en avoir autant que nécessaire dans un composant.\`

const ITEMS = ['☕ Café', '🍕 Pizza', '🎮 Jeux', '📚 Livre', '🎧 Casque']
const COLORS = ['#6c63ff', '#4ade80', '#f87171', '#fbbf24', '#a78bfa']

export default function UseStateNotion() {
  const [count, setCount] = useState(0)
  const [color, setColor] = useState('#6c63ff')
  const [history, setHistory] = useState([0])
  const [panier, setPanier] = useState([])
  const [promo, setPromo] = useState(false)
  const renderCount = useRef(0)
  renderCount.current += 1

  const update = (fn) => {
    setCount(prev => {
      const next = fn(prev)
      setHistory(h => [...h.slice(-6), next])
      return next
    })
  }

  const total = panier.reduce((s, p) => s + p.prix, 0)
  const totalFinal = promo ? total * 0.8 : total

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Bloc 1 — Compteur visuel */}
      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>État : <code style={{ color: '#fbbf24', background: '#252836', padding: '1px 6px', borderRadius: '4px' }}>count</code></span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>🔁 {renderCount.current} renders</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => update(p => p - 1)} style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#f87171', color: '#fff', fontSize: '20px', fontWeight: 'bold',
          }}>−</button>

          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: color, boxShadow: \`0 0 24px \${color}55\`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 'bold', color: '#fff',
            transition: 'background 0.3s',
          }}>
            {count}
          </div>

          <button onClick={() => update(p => p + 1)} style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#4ade80', color: '#0f1117', fontSize: '20px', fontWeight: 'bold',
          }}>+</button>
        </div>

        {/* Historique des états */}
        <div style={{ marginTop: '12px' }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}>Historique des états :</p>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            {history.map((v, i) => (
              <span key={i} style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '13px',
                background: i === history.length - 1 ? color + '33' : '#252836',
                color: i === history.length - 1 ? color : '#94a3b8',
                border: \`1px solid \${i === history.length - 1 ? color : '#2d3148'}\`,
                fontFamily: 'monospace',
              }}>{v}</span>
            ))}
            {history.length > 1 && <span style={{ color: '#94a3b8', fontSize: '11px' }}>← actuel</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => update(() => 0)} style={{
            padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
            background: '#252836', color: '#94a3b8', border: '1px solid #2d3148',
          }}>Reset</button>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: '24px', height: '24px', borderRadius: '50%', background: c,
              border: color === c ? '2px solid #fff' : '2px solid transparent',
            }} />
          ))}
        </div>
      </div>

      {/* Bloc 2 — Panier (objet + booléen) */}
      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>
          Plusieurs états : <code style={{ color: '#a78bfa', background: '#252836', padding: '1px 5px', borderRadius: '4px' }}>articles[]</code> + <code style={{ color: '#a78bfa', background: '#252836', padding: '1px 5px', borderRadius: '4px' }}>promo</code>
        </p>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {ITEMS.map((item, i) => (
            <button key={item} onClick={() => setPanier(p => [...p, { id: Date.now(), nom: item, prix: (i + 1) * 5 }])}
              style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '13px', background: '#252836', color: '#e2e8f0', border: '1px solid #2d3148' }}>
              {item}
            </button>
          ))}
        </div>

        {panier.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
            {panier.slice(-3).map((a, i) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#e2e8f0' }}>
                <span>{a.nom}</span>
                <span style={{ color: '#fbbf24' }}>{a.prix} €</span>
              </div>
            ))}
            {panier.length > 3 && <p style={{ color: '#94a3b8', fontSize: '11px' }}>+{panier.length - 3} article(s)…</p>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => setPromo(p => !p)} style={{
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
            background: promo ? '#4ade8033' : '#252836',
            color: promo ? '#4ade80' : '#94a3b8',
            border: \`1px solid \${promo ? '#4ade80' : '#2d3148'}\`,
          }}>
            {promo ? '✅ Promo -20%' : '🏷 Activer promo'}
          </button>

          <div style={{ textAlign: 'right' }}>
            {promo && total > 0 && <p style={{ color: '#94a3b8', fontSize: '11px', textDecoration: 'line-through' }}>{total} €</p>}
            <p style={{ color: '#4ade80', fontWeight: 'bold' }}>
              {panier.length === 0 ? 'Panier vide' : \`\${totalFinal.toFixed(2)} €\`}
            </p>
          </div>

          {panier.length > 0 && (
            <button onClick={() => setPanier([])} style={{
              padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
              background: '#252836', color: '#f87171', border: '1px solid #2d3148',
            }}>🗑 Vider</button>
          )}
        </div>
      </div>

    </div>
  )
}

`,d=`import { useState, useEffect } from 'react'

export const code = \`import { useState, useEffect } from 'react'

function Minuterie() {
  const [secondes, setSecondes] = useState(0)
  const [actif, setActif] = useState(false)

  useEffect(() => {
    if (!actif) return

    // Setup : démarre l'intervalle
    const id = setInterval(() => {
      setSecondes(s => s + 1)
    }, 1000)

    // Cleanup : arrête quand actif change ou que le composant disparaît
    return () => clearInterval(id)
  }, [actif]) // Se relance quand 'actif' change

  return (/* ... */)
}\`

export const explication = \`### À quoi sert useEffect ?
**useEffect** permet de synchroniser ton composant avec quelque chose **en dehors de React** : un timer, une API, le titre de la page, un écouteur d'événement, etc. Il s'exécute **après** que React a mis à jour le DOM.

### Syntaxe complète
\\\`useEffect(() => { /* effet */ return () => { /* cleanup */ } }, [deps])\\\`

### Le tableau de dépendances
- **Absent** \\\`useEffect(fn)\\\` → s'exécute après **chaque** render
- **Vide** \\\`useEffect(fn, [])\\\` → s'exécute **une seule fois** au montage
- **Avec deps** \\\`useEffect(fn, [a, b])\\\` → se relance quand \\\`a\\\` ou \\\`b\\\` change

### La fonction de cleanup
Elle s'exécute **avant** le prochain effet, et au **démontage** du composant.
Indispensable pour : \\\`clearInterval\\\`, \\\`removeEventListener\\\`, annuler une requête.

### Cas d'usage courants
1. Charger des données depuis une API au montage
2. S'abonner à un WebSocket ou un événement
3. Synchroniser avec \\\`localStorage\\\`
4. Modifier \\\`document.title\\\`

⚠️ Ne mets pas \\\`async\\\` directement dans useEffect : \\\`useEffect(async () => {...})\\\` est incorrect. Crée une fonction async à l'intérieur.
⚠️ Oublier le cleanup d'un \\\`setInterval\\\` provoque une **fuite mémoire** : le timer continue même après que le composant a disparu.
✅ Si tu te demandes "pourquoi mon effet s'exécute en boucle ?" → vérifie que les dépendances ne changent pas à chaque render (objets/fonctions créés à l'intérieur du composant).\`

export default function UseEffectNotion() {
  const [secondes, setSecondes] = useState(0)
  const [actif, setActif] = useState(false)
  const [titre, setTitre] = useState('Page title')

  useEffect(() => {
    if (!actif) return
    const id = setInterval(() => setSecondes(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [actif])

  useEffect(() => {
    document.title = actif ? \`⏱ \${secondes}s\` : 'React Blocs'
    return () => { document.title = 'React Blocs' }
  }, [secondes, actif])

  const fmt = s => \`\${String(Math.floor(s / 60)).padStart(2, '0')}:\${String(s % 60).padStart(2, '0')}\`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '52px',
        fontWeight: 'bold',
        color: actif ? '#4ade80' : '#94a3b8',
        letterSpacing: '4px',
        transition: 'color 0.3s',
      }}>
        {fmt(secondes)}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setActif(a => !a)} style={{
          padding: '10px 24px', borderRadius: '8px',
          background: actif ? '#f87171' : '#4ade80',
          color: actif ? '#fff' : '#0f1117',
          fontWeight: 'bold',
          transition: 'background 0.2s',
        }}>
          {actif ? '⏸ Pause' : '▶ Démarrer'}
        </button>
        <button onClick={() => { setActif(false); setSecondes(0) }} style={{
          padding: '10px 16px', borderRadius: '8px',
          background: '#252836', color: '#94a3b8',
        }}>
          ↺ Reset
        </button>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '13px' }}>
        {actif ? '⚡ useEffect tourne — regarde le titre de l\\'onglet !' : 'Appuie sur Démarrer pour lancer l\\'effet'}
      </p>
    </div>
  )
}
`,f=`import { useState } from 'react'

export const code = \`const fruits = ['🍎 Pomme', '🍌 Banane', '🍊 Orange']

function Liste() {
  return (
    <ul>
      {fruits.map((fruit, index) => (
        // La key aide React à identifier chaque élément
        <li key={index}>{fruit}</li>
      ))}
    </ul>
  )
}

// ✅ Mieux : utiliser un id unique comme key
const tâches = [
  { id: 1, texte: 'Apprendre React' },
  { id: 2, texte: 'Créer une app' },
]
<ul>
  {tâches.map(t => <li key={t.id}>{t.texte}</li>)}
</ul>\`

export const explication = \`### Afficher une liste en React
React ne connaît pas les boucles \\\`for\\\` dans le JSX. On utilise \\\`.map()\\\` qui transforme chaque élément du tableau en JSX.

### Syntaxe
\\\`{items.map(item => <li key={item.id}>{item.texte}</li>)}\\\`

### Pourquoi la prop key ?
La \\\`key\\\` est un identifiant unique que React utilise pour suivre chaque élément lors des mises à jour. Sans key, React ne sait pas **quoi** a changé → il re-rend tout.

### Quelle valeur utiliser comme key ?
1. **ID unique de la donnée** (base de données, UUID) → recommandé
2. **Index du tableau** \\\`i\\\` → acceptable seulement si la liste ne change jamais d'ordre
3. **Valeur stable et unique** (ex: un slug, un code)

### Ajouter / supprimer des éléments
- Ajouter : \\\`setItems(prev => [...prev, nouvelElement])\\\` — toujours créer un nouveau tableau
- Supprimer : \\\`setItems(prev => prev.filter(i => i.id !== id))\\\`
- Modifier : \\\`setItems(prev => prev.map(i => i.id === id ? {...i, ...changes} : i))\\\`

⚠️ La \\\`key\\\` doit être **unique parmi les frères** (siblings), pas forcément globalement unique.
⚠️ Ne jamais utiliser \\\`Math.random()\\\` comme key — elle change à chaque render et détruit les performances.
✅ Tu peux aussi utiliser \\\`.filter()\\\` avant \\\`.map()\\\` pour afficher une liste filtrée.\`

const emojis = ['🍎', '🍌', '🍊', '🍇', '🥝', '🍓', '🫐', '🍑']

export default function ListesNotion() {
  const [items, setItems] = useState([
    { id: 1, texte: 'Apprendre React' },
    { id: 2, texte: 'Créer une todo list' },
    { id: 3, texte: 'Déployer sur GitHub Pages' },
  ])
  const [input, setInput] = useState('')
  let nextId = items.length + 4

  const ajouter = () => {
    const val = input.trim()
    if (!val) return
    setItems(prev => [...prev, { id: nextId++, texte: val }])
    setInput('')
  }

  const supprimer = id => setItems(prev => prev.filter(i => i.id !== id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ajouter()}
          placeholder="Nouvelle tâche…"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none',
          }}
        />
        <button onClick={ajouter} style={{
          padding: '10px 16px', borderRadius: '8px',
          background: '#6c63ff', color: '#fff', fontWeight: 'bold',
        }}>+</button>
      </div>

      {items.length === 0 && (
        <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>
          Liste vide — ajoute une tâche !
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', background: '#1a1d27',
            borderRadius: '8px', border: '1px solid #2d3148',
          }}>
            <span>{emojis[i % emojis.length]}</span>
            <span style={{ flex: 1, color: '#e2e8f0', fontSize: '14px' }}>{item.texte}</span>
            <span style={{ color: '#2d3148', fontSize: '11px', fontFamily: 'monospace' }}>id:{item.id}</span>
            <button onClick={() => supprimer(item.id)} style={{
              color: '#f87171', fontSize: '16px', padding: '2px 6px',
            }}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
`,p=`import { useState } from 'react'

export const code = \`import { useState } from 'react'

function Formulaire() {
  const [form, setForm] = useState({ nom: '', email: '' })

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault() // Évite le rechargement de la page
    console.log('Envoyé :', form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="nom" value={form.nom} onChange={handleChange} />
      <input name="email" value={form.email} onChange={handleChange} />
      <button type="submit">Envoyer</button>
    </form>
  )
}\`

export const explication = \`### Formulaire contrôlé vs non contrôlé
En React, il y a deux approches :
- **Contrôlé** : React détient la valeur via \\\`useState\\\` → recommandé
- **Non contrôlé** : le DOM gère la valeur via \\\`useRef\\\` → cas rares

### Comment ça marche (contrôlé)
1. L'utilisateur tape → l'événement \\\`onChange\\\` se déclenche
2. \\\`onChange\\\` appelle \\\`setValeur(e.target.value)\\\`
3. React re-rend avec la nouvelle valeur dans \\\`value={valeur}\\\`
C'est une **boucle** : état → affichage → événement → état

### Gérer plusieurs champs efficacement
Au lieu d'un \\\`useState\\\` par champ, utilise un objet et le \\\`name\\\` de l'input :
\\\`const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))\\\`
L'attribut \\\`name\\\` de l'input devient la clé dans l'objet.

### La soumission du formulaire
\\\`onSubmit\\\` sur la balise \\\`<form>\\\` (pas sur le bouton).
\\\`e.preventDefault()\\\` est indispensable pour empêcher le rechargement de page.

### Validation
- **HTML natif** : \\\`required\\\`, \\\`type="email"\\\`, \\\`minLength\\\`
- **Manuelle** : vérifier l'état avant de soumettre
- **Bibliothèques** : React Hook Form, Zod pour des formulaires complexes

⚠️ Si \\\`value\\\` est défini sans \\\`onChange\\\`, l'input devient **en lecture seule** → erreur dans la console.
✅ Pour les cases à cocher, utilise \\\`checked\\\` et \\\`onChange\\\` au lieu de \\\`value\\\`.\`

const fieldStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2d3148', background: '#252836',
  color: '#e2e8f0', fontSize: '14px', outline: 'none',
}

export default function FormulaireNotion() {
  const [form, setForm] = useState({ nom: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(null)

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    setSubmitted(form)
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ padding: '16px', background: '#4ade8022', borderRadius: '8px', border: '1px solid #4ade80' }}>
          <p style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: '8px' }}>✅ Formulaire soumis !</p>
          {Object.entries(submitted).map(([k, v]) => (
            <p key={k} style={{ color: '#e2e8f0', fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>{k}:</span> {v}
            </p>
          ))}
        </div>
        <button onClick={() => { setSubmitted(null); setForm({ nom: '', email: '', message: '' }) }}
          style={{ padding: '10px', borderRadius: '8px', background: '#252836', color: '#94a3b8' }}>
          ← Recommencer
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nom</label>
        <input name="nom" value={form.nom} onChange={handleChange}
          placeholder="Ton nom…" required style={fieldStyle} />
      </div>
      <div>
        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange}
          placeholder="ton@email.com" required style={fieldStyle} />
      </div>
      <div>
        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Message</label>
        <textarea name="message" value={form.message} onChange={handleChange}
          placeholder="Ton message…" rows={3}
          style={{ ...fieldStyle, resize: 'vertical' }} />
      </div>

      <div style={{ padding: '10px', background: '#252836', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#6c63ff' }}>
        {JSON.stringify(form, null, 2)}
      </div>

      <button type="submit" style={{
        padding: '12px', borderRadius: '8px',
        background: '#6c63ff', color: '#fff',
        fontWeight: 'bold', fontSize: '15px',
      }}>
        Envoyer →
      </button>
    </form>
  )
}
`,m=`import { useState } from 'react'

export const code = \`function Statut({ connecté }) {
  // if/else classique
  if (!connecté) return <p>🔒 Non connecté</p>

  // Opérateur ternaire
  return (
    <div>
      {connecté
        ? <p>✅ Connecté</p>
        : <p>❌ Déconnecté</p>
      }

      {/* && : affiche seulement si la condition est vraie */}
      {connecté && <button>Se déconnecter</button>}
    </div>
  )
}\`

export const explication = \`### Pourquoi le rendu conditionnel ?
En React, le JSX est du JavaScript — on peut utiliser toutes les structures conditionnelles JS pour décider **quoi afficher** selon l'état ou les props.

### Les 3 patterns essentiels

1. **Early return** : sortir tôt du composant si une condition est remplie
\\\`if (!chargé) return <Spinner />\\\`
Parfait pour les états de chargement, erreurs, ou données manquantes.

2. **Ternaire** : choisir entre deux éléments
\\\`{connecté ? <Dashboard /> : <LoginPage />}\\\`
Utilise-le quand tu as toujours **deux options** possibles.

3. **Court-circuit &&** : afficher ou rien
\\\`{message && <Toast texte={message} />}\\\`
Utilise-le quand tu veux **afficher ou ne rien afficher**.

### Choisir le bon pattern
- Condition simple → \\\`&&\\\`
- Deux alternatives → ternaire \\\`? :\\\`
- Logique complexe (3+ cas) → \\\`if/else\\\` ou variable intermédiaire

### Variable intermédiaire (lisibilité)
Pour les conditions longues, stocke le JSX dans une variable :
\\\`const contenu = isLoading ? <Spinner /> : <Data />\\\`
puis \\\`{contenu}\\\` dans le JSX.

⚠️ Piège classique avec \\\`&&\\\` : si la condition est \\\`0\\\` (zéro), React affiche **le chiffre 0** à l'écran au lieu de rien ! Utilise \\\`items.length > 0 && ...\\\` plutôt que \\\`items.length && ...\\\`
✅ Évite les ternaires imbriqués — ils deviennent illisibles. Préfère un \\\`if/else\\\` ou un switch.\`

export default function ConditionnelNotion() {
  const [connecté, setConnecté] = useState(false)
  const [theme, setTheme] = useState('sombre')
  const [count, setCount] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>if / else</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, padding: '12px', borderRadius: '8px',
            background: connecté ? '#4ade8022' : '#f8717122',
            border: \`1px solid \${connecté ? '#4ade80' : '#f87171'}\`,
            textAlign: 'center',
          }}>
            {connecté
              ? <span style={{ color: '#4ade80' }}>✅ Bienvenue !</span>
              : <span style={{ color: '#f87171' }}>🔒 Non connecté</span>
            }
          </div>
          <button onClick={() => setConnecté(v => !v)} style={{
            padding: '10px 20px', borderRadius: '8px',
            background: connecté ? '#f87171' : '#4ade80',
            color: connecté ? '#fff' : '#0f1117',
            fontWeight: 'bold',
          }}>
            {connecté ? 'Se déconnecter' : 'Se connecter'}
          </button>
        </div>
        {connecté && (
          <p style={{ marginTop: '10px', color: '#a78bfa', fontSize: '13px' }}>
            👆 Ce message n'apparaît que si <code style={{ background: '#2d3148', padding: '1px 6px', borderRadius: '4px' }}>connecté && ...</code>
          </p>
        )}
      </div>

      <div style={{ padding: '16px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>Ternaire</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['sombre', 'clair', 'violet'].map(t => (
            <button key={t} onClick={() => setTheme(t)} style={{
              padding: '8px 14px', borderRadius: '8px',
              background: theme === t ? '#6c63ff' : '#252836',
              color: theme === t ? '#fff' : '#94a3b8',
              border: theme === t ? '1px solid #6c63ff' : '1px solid #2d3148',
            }}>{t}</button>
          ))}
        </div>
        <div style={{
          marginTop: '10px', padding: '12px', borderRadius: '8px',
          background: theme === 'clair' ? '#f0f0f0' : theme === 'violet' ? '#2d1b6b' : '#252836',
          color: theme === 'clair' ? '#0f1117' : '#e2e8f0',
          transition: 'all 0.3s',
        }}>
          Thème actif : <strong>{theme}</strong>
        </div>
      </div>

    </div>
  )
}
`,h=`import { useState, useContext, createContext } from 'react'

export const code = \`import { createContext, useContext, useState } from 'react'

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
}\`

export const explication = \`### Le problème : prop drilling
Imagine transmettre \\\`utilisateur\\\` de \\\`App\\\` → \\\`Layout\\\` → \\\`Sidebar\\\` → \\\`Avatar\\\`. Chaque niveau doit passer la prop même s'il ne l'utilise pas. C'est le **prop drilling** — long et fragile.

### La solution : Context
Le Context crée un **canal direct** entre le fournisseur et n'importe quel consommateur dans l'arbre, sans passer par les intermédiaires.

### Les 3 étapes
1. **Créer** : \\\`const MonCtx = createContext(valeurParDéfaut)\\\`
2. **Fournir** : \\\`<MonCtx.Provider value={...}>\\\` enveloppe l'arbre
3. **Consommer** : \\\`const valeur = useContext(MonCtx)\\\` dans n'importe quel enfant

### Quand utiliser le Context ?
- Thème (dark/light)
- Langue / internationalisation
- Utilisateur connecté
- Panier d'achat global

### Quand NE PAS l'utiliser ?
- Données locales à 2-3 composants → props suffisent
- Données qui changent très souvent → risque de re-renders inutiles

### Optimisation
Chaque composant qui consomme un contexte se re-rend quand la **valeur du Provider change**. Pour les grandes apps, séparer les contextes (ex: \\\`UserCtx\\\` et \\\`ThemeCtx\\\` séparément).

⚠️ Un \\\`useContext\\\` retourne \\\`undefined\\\` si le composant n'est pas à l'intérieur du \\\`Provider\\\` correspondant.
✅ Bonne pratique : créer un hook personnalisé \\\`useTheme()\\\` qui appelle \\\`useContext(ThemeCtx)\\\` — plus propre à utiliser.\`

const ThemeCtx = createContext()

function Bouton({ children, onClick, active }) {
  const { theme } = useContext(ThemeCtx)
  const isDark = theme === 'sombre'
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: '8px',
      background: active ? '#6c63ff' : isDark ? '#252836' : '#e2e8f0',
      color: active ? '#fff' : isDark ? '#94a3b8' : '#0f1117',
      border: \`1px solid \${active ? '#6c63ff' : isDark ? '#2d3148' : '#ccc'}\`,
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
      border: \`1px solid \${isDark ? '#2d3148' : '#ddd'}\`,
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
`,g=`import { useState, useEffect, useRef } from 'react'

export const code = \`import { useRef } from 'react'

function Demo() {
  const inputRef = useRef(null)
  const renderCount = useRef(0)

  // Accéder au DOM directement
  const focusInput = () => inputRef.current.focus()

  // Compter les renders SANS re-render
  renderCount.current += 1

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
      <p>Renders : {renderCount.current}</p>
    </>
  )
}\`

export const explication = \`### Qu'est-ce que useRef ?
\\\`useRef\\\` retourne un objet \\\`{ current: valeur }\\\` qui **persiste entre les renders** mais dont la modification ne déclenche **pas** de re-render. C'est sa différence fondamentale avec \\\`useState\\\`.

### Les 2 usages principaux

**1. Accéder au DOM directement**
\\\`const inputRef = useRef(null)\\\`
\\\`<input ref={inputRef} />\\\`
Puis : \\\`inputRef.current.focus()\\\` — accès direct à l'élément HTML.

**2. Mémoriser une valeur sans re-render**
\\\`const renderCount = useRef(0)\\\`
\\\`renderCount.current += 1\\\` — incrémente sans déclencher de re-render.
Utile pour : compter les renders, stocker l'ID d'un timer, garder la valeur précédente.

### useRef vs useState
- \\\`useState\\\` → valeur qui **affecte l'interface** → déclenche un re-render
- \\\`useRef\\\` → valeur **interne** (timer, DOM, compteur) → pas de re-render

### Usages courants du DOM
- \\\`focus()\\\` sur un input
- \\\`scrollIntoView()\\\` pour scroller vers un élément
- \\\`getBoundingClientRect()\\\` pour mesurer un élément
- Contrôler une animation ou un canvas

⚠️ Ne pas lire/modifier \\\`ref.current\\\` pendant le rendu — seulement dans des event handlers ou \\\`useEffect\\\`.
⚠️ Si tu mets une \\\`ref\\\` sur un composant React (et non un élément HTML), il faut utiliser \\\`forwardRef\\\`.
✅ Pour stocker la valeur précédente d'un état : \\\`const prevCount = useRef(); useEffect(() => { prevCount.current = count }, [count])\`

export default function UseRefNotion() {
  const inputRef = useRef(null)
  const renderCount = useRef(0)
  const [text, setText] = useState('')
  const [highlights, setHighlights] = useState([])
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const lastPos = useRef(null)

  renderCount.current += 1

  const focus = () => inputRef.current?.focus()
  const select = () => { inputRef.current?.focus(); inputRef.current?.select() }
  const clear = () => { setText(''); inputRef.current?.focus() }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
  }, [])

  const getPos = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const startDraw = e => { setDrawing(true); lastPos.current = getPos(e) }
  const stopDraw = () => setDrawing(false)
  const draw = e => {
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }
  const clearCanvas = () => {
    const canvas = canvasRef.current
    canvasRef.current.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px' }}>Accès DOM via ref</p>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          placeholder="Clique sur un bouton…"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none', marginBottom: '8px',
          }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[['🎯 Focus', focus], ['✅ Sélectionner', select], ['🗑 Vider', clear]].map(([label, fn]) => (
            <button key={label} onClick={fn} style={{
              padding: '7px 12px', borderRadius: '6px',
              background: '#252836', color: '#a78bfa',
              border: '1px solid #2d3148', fontSize: '13px',
            }}>{label}</button>
          ))}
        </div>
        <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '12px' }}>
          Re-renders : <strong style={{ color: '#fbbf24' }}>{renderCount.current}</strong>
          {' '}(renderCount.current ne déclenche pas de re-render)
        </p>
      </div>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ color: '#94a3b8', fontSize: '12px' }}>Canvas via ref (dessine !)</p>
          <button onClick={clearCanvas} style={{ color: '#f87171', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>Effacer</button>
        </div>
        <canvas ref={canvasRef} width={280} height={140}
          onMouseDown={startDraw} onMouseUp={stopDraw} onMouseMove={draw}
          onTouchStart={startDraw} onTouchEnd={stopDraw} onTouchMove={draw}
          style={{
            width: '100%', height: '140px', borderRadius: '8px',
            background: '#252836', cursor: 'crosshair', touchAction: 'none',
          }} />
      </div>
    </div>
  )
}
`,_=`import { useState, useEffect } from 'react'

export const code = \`// Un hook personnalisé = une fonction qui commence par "use"
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// Utilisation comme useState
function App() {
  const [nom, setNom] = useLocalStorage('nom', '')
  return <input value={nom} onChange={e => setNom(e.target.value)} />
}\`

export const explication = \`### Qu'est-ce qu'un hook personnalisé ?
Un **hook personnalisé** est une fonction JavaScript dont le nom commence par \\\`use\\\` et qui appelle d'autres hooks React. Ce n'est **pas** un composant — il ne retourne pas de JSX, mais de la logique réutilisable.

### Pourquoi en créer ?
Quand tu copies-colles la même logique (\\\`useState\\\` + \\\`useEffect\\\`) dans plusieurs composants, c'est le signe qu'il faut extraire un hook. C'est l'équivalent React des fonctions utilitaires.

### Structure type
\\\`function useMonHook(paramètre) {\\\`
\\\`  const [état, setÉtat] = useState(...)\\\`
\\\`  useEffect(() => { ... }, [paramètre])\\\`
\\\`  return état\\\` ou \\\`[état, setÉtat]\\\` ou un objet
\\\`}\\\`

### Les hooks de la démo
1. **\\\`useLocalStorage\\\`** : synchronise un état avec \\\`localStorage\\\` → données persistantes
2. **\\\`useDebounce\\\`** : attend la fin de frappe → évite trop d'appels API
3. **\\\`useWindowSize\\\`** : écoute le resize → dimensions en temps réel

### Règles des hooks (s'appliquent aussi aux customs)
1. Appeler les hooks uniquement au **niveau supérieur** (pas dans des if/boucles)
2. Appeler les hooks uniquement dans des **composants React** ou d'autres hooks

### Bibliothèques populaires
Des milliers de hooks prêts à l'emploi existent : \\\`usehooks-ts\\\`, \\\`react-use\\\`, \\\`ahooks\\\`.

⚠️ Le préfixe \\\`use\\\` n'est pas optionnel — sans lui, React ne peut pas vérifier les règles des hooks.
✅ Un bon hook personnalisé : nom clair, une seule responsabilité, bien testé.\`

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init } catch { return init }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(val))
  }, [key, val])
  return [val, setVal]
}

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return size
}

export default function HookCustomNotion() {
  const [notes, setNotes] = useLocalStorage('react-blocs-notes', '')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 600)
  const size = useWindowSize()

  const hook = (name, color) => (
    <span style={{ padding: '2px 8px', borderRadius: '20px', background: color + '22', color, fontSize: '12px', fontFamily: 'monospace' }}>{name}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          {hook('useLocalStorage', '#4ade80')}
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Les notes persistent après reload</span>
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Écris une note… elle sera sauvegardée automatiquement !"
          rows={3} style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical',
          }} />
        <p style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>
          💾 Sauvegardé dans localStorage
        </p>
      </div>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          {hook('useDebounce', '#fbbf24')}
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Attend la fin de frappe</span>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tape pour chercher…"
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px solid #2d3148', background: '#252836',
            color: '#e2e8f0', fontSize: '14px', outline: 'none',
          }} />
        <p style={{ marginTop: '6px', fontSize: '13px', color: '#94a3b8' }}>
          Valeur immédiate : <span style={{ color: '#e2e8f0' }}>{search || '—'}</span>
          {' | '}Debounced : <span style={{ color: '#fbbf24' }}>{debouncedSearch || '—'}</span>
        </p>
      </div>

      <div style={{ padding: '12px', background: '#1a1d27', borderRadius: '10px', border: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
          {hook('useWindowSize', '#a78bfa')}
        </div>
        <p style={{ color: '#e2e8f0', fontSize: '18px', fontFamily: 'monospace' }}>
          {size.w} × {size.h} px
        </p>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>Redimensionne la fenêtre pour voir</p>
      </div>

    </div>
  )
}
`,v=o(),y=`// Un composant = une fonction qui retourne du JSX
function Salutation({ nom }) {
  return (
    <div style={{ padding: '16px', background: '#252836', borderRadius: '8px' }}>
      <h2>👋 Bonjour, {nom} !</h2>
      <p>Je suis un composant React.</p>
    </div>
  )
}

// On l'utilise comme une balise HTML
function App() {
  return <Salutation nom="Monde" />
}`,b=`### Qu'est-ce qu'un composant ?
Un **composant** React est une fonction JavaScript qui retourne du **JSX** — une syntaxe proche du HTML que React transforme en éléments visuels.

### Les 3 règles de base
1. Le nom **commence par une majuscule** (sinon React le traite comme une balise HTML)
2. Il retourne du **JSX** — un seul élément racine (utilise \`<>...</>\` pour en grouper plusieurs)
3. Il peut recevoir des **props** en paramètre pour être personnalisé

### Ce qui se passe sous le capot
Le JSX \`<Salutation nom="Monde" />\` est transformé par Babel en :
\`React.createElement(Salutation, { nom: "Monde" })\`
C'est du JavaScript pur — pas de magie.

### Pourquoi des composants ?
- **Réutilisabilité** : écrire une fois, utiliser partout
- **Lisibilité** : chaque composant a une responsabilité claire
- **Composabilité** : assembler des petits blocs pour construire des UI complexes

⚠️ Un composant doit être **pur** : pour les mêmes props, il retourne toujours le même JSX. Ne pas modifier des variables externes à l'intérieur.
✅ Commence petit : si un composant dépasse 50 lignes, envisage de le découper.`;function x(){function e({nom:e}){return(0,v.jsxs)(`div`,{style:{padding:`16px`,background:`#1a1d27`,borderRadius:`8px`,border:`1px solid #2d3148`},children:[(0,v.jsxs)(`h2`,{style:{color:`#a78bfa`,marginBottom:`8px`},children:[`👋 Bonjour, `,e,` !`]}),(0,v.jsx)(`p`,{style:{color:`#94a3b8`},children:`Je suis un composant React.`})]})}return(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`12px`},children:[(0,v.jsx)(e,{nom:`Monde`}),(0,v.jsx)(e,{nom:`React`}),(0,v.jsx)(e,{nom:`Développeur`})]})}var S=`function Carte({ titre, couleur, score }) {
  return (
    <div style={{ borderLeft: \`4px solid \${couleur}\`, padding: '12px' }}>
      <strong>{titre}</strong>
      <span>Score : {score}</span>
    </div>
  )
}

// Utilisation avec des props différentes
<Carte titre="React"  couleur="#6c63ff" score={95} />
<Carte titre="Vue"    couleur="#4ade80" score={82} />
<Carte titre="Angular" couleur="#f87171" score={74} />`,C="### Qu'est-ce que les props ?\nLes **props** (propriétés) sont les paramètres que le composant parent transmet à son enfant. C'est la façon dont les composants communiquent entre eux.\n\n### Flux de données\nLes props suivent un flux **unidirectionnel** : parent → enfant uniquement. Un enfant ne peut jamais modifier les props qu'il reçoit.\n\n### Types acceptés\n- `string` → `titre=\"Bonjour\"`\n- `number` → `score={95}` (accolades obligatoires)\n- `boolean` → `actif={true}` ou simplement `actif`\n- `tableau / objet` → `data={[1, 2, 3]}`\n- `fonction` → `onClick={handleClick}` (callbacks)\n- `JSX` → `children={<p>Texte</p>}`\n\n### La déstructuration\nAu lieu de `function Carte(props)` puis `props.titre`, on déstructure directement :\n`function Carte({ titre, couleur, score })` — plus lisible.\n\n### La prop children\nTout ce qui est entre les balises devient `children` :\n`<Carte>Contenu ici</Carte>` → accessible via `props.children`\n\n⚠️ Ne jamais modifier une prop dans l'enfant : `props.score = 100` → interdit et sans effet.\n✅ Si l'enfant a besoin de modifier une valeur, le parent doit lui passer une **fonction callback** via les props.",w=[{titre:`React`,couleur:`#6c63ff`,score:95},{titre:`Vue`,couleur:`#4ade80`,score:82},{titre:`Angular`,couleur:`#f87171`,score:74},{titre:`Svelte`,couleur:`#fbbf24`,score:88}];function ee({titre:e,couleur:t,score:n}){return(0,v.jsxs)(`div`,{style:{borderLeft:`4px solid ${t}`,padding:`12px 16px`,background:`#1a1d27`,borderRadius:`0 8px 8px 0`,display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,v.jsx)(`strong`,{style:{color:`#e2e8f0`},children:e}),(0,v.jsxs)(`span`,{style:{background:t+`33`,color:t,padding:`2px 10px`,borderRadius:`20px`,fontSize:`14px`,fontWeight:`bold`},children:[n,` pts`]})]})}function te(){let[e,t]=(0,s.useState)(null);return(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`8px`},children:[(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`13px`,marginBottom:`4px`},children:`Clique sur une carte pour voir ses props`}),w.map(n=>(0,v.jsx)(`div`,{onClick:()=>t(n.titre===e?null:n.titre),style:{cursor:`pointer`,opacity:e&&e!==n.titre?.5:1,transition:`opacity 0.2s`},children:(0,v.jsx)(ee,{...n})},n.titre)),e&&(0,v.jsx)(`div`,{style:{marginTop:`8px`,padding:`12px`,background:`#252836`,borderRadius:`8px`,fontFamily:`monospace`,fontSize:`13px`,color:`#a78bfa`},children:`<Carte titre="${w.find(t=>t.titre===e).titre}" couleur="${w.find(t=>t.titre===e).couleur}" score={${w.find(t=>t.titre===e).score}} />`})]})}var ne=`import { useState } from 'react'

function Compteur() {
  // [valeur, fonctionMàJ] = useState(valeurInitiale)
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Compteur : {count}</p>

      {/* Mise à jour directe */}
      <button onClick={() => setCount(count + 1)}>+1</button>

      {/* Mise à jour fonctionnelle — recommandée si
          le nouvel état dépend de l'ancien */}
      <button onClick={() => setCount(prev => prev + 1)}>+1 (fn)</button>

      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

// Plusieurs états indépendants
function Panier() {
  const [articles, setArticles] = useState([])
  const [promo, setPromo] = useState(false)

  const ajouter = (item) =>
    setArticles(prev => [...prev, item])

  return (/* ... */)
}`,re="### Qu'est-ce que l'état ?\nL'**état** (state) est une valeur que le composant mémorise entre ses renders. Quand l'état change, React re-rend le composant automatiquement pour refléter la nouvelle valeur à l'écran.\n\n### Syntaxe\n`const [valeur, setValeur] = useState(valeurInitiale)`\n- `valeur` → la valeur actuelle de l'état\n- `setValeur` → la fonction pour la modifier\n- `valeurInitiale` → uniquement utilisée au **premier rendu**\n\n### 2 façons de mettre à jour\n1. **Directe** : `setCount(count + 1)` — utilise la valeur courante\n2. **Fonctionnelle** : `setCount(prev => prev + 1)` — utilise l'état précédent (recommandé quand la mise à jour dépend de l'état actuel)\n\n### Ce qui déclenche un re-render\n- Appeler `setValeur()` avec une **nouvelle valeur** (React compare avec `Object.is`)\n- Si la valeur est la même, React ne re-rend **pas**\n\n### Les pièges courants\n⚠️ Ne jamais modifier l'état directement : `count = count + 1` → React ne sait pas qu'il y a eu un changement.\n⚠️ Pour les objets et tableaux, toujours créer une **nouvelle référence** : `setUser({ ...user, nom: 'Alice' })` et non `user.nom = 'Alice'`\n⚠️ `useState` est asynchrone : juste après `setCount(5)`, `count` vaut encore l'ancienne valeur.\n✅ Chaque appel à `useState` est indépendant — tu peux en avoir autant que nécessaire dans un composant.",ie=[`☕ Café`,`🍕 Pizza`,`🎮 Jeux`,`📚 Livre`,`🎧 Casque`],ae=[`#6c63ff`,`#4ade80`,`#f87171`,`#fbbf24`,`#a78bfa`];function T(){let[e,t]=(0,s.useState)(0),[n,r]=(0,s.useState)(`#6c63ff`),[i,a]=(0,s.useState)([0]),[o,c]=(0,s.useState)([]),[l,u]=(0,s.useState)(!1),d=(0,s.useRef)(0);d.current+=1;let f=e=>{t(t=>{let n=e(t);return a(e=>[...e.slice(-6),n]),n})},p=o.reduce((e,t)=>e+t.prix,0),m=l?p*.8:p;return(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`},children:[(0,v.jsxs)(`div`,{style:{padding:`16px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:`10px`},children:[(0,v.jsxs)(`span`,{style:{color:`#94a3b8`,fontSize:`12px`},children:[`État : `,(0,v.jsx)(`code`,{style:{color:`#fbbf24`,background:`#252836`,padding:`1px 6px`,borderRadius:`4px`},children:`count`})]}),(0,v.jsxs)(`span`,{style:{color:`#94a3b8`,fontSize:`11px`},children:[`🔁 `,d.current,` renders`]})]}),(0,v.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`,justifyContent:`center`},children:[(0,v.jsx)(`button`,{onClick:()=>f(e=>e-1),style:{width:`40px`,height:`40px`,borderRadius:`50%`,background:`#f87171`,color:`#fff`,fontSize:`20px`,fontWeight:`bold`},children:`−`}),(0,v.jsx)(`div`,{style:{width:`80px`,height:`80px`,borderRadius:`50%`,background:n,boxShadow:`0 0 24px ${n}55`,display:`flex`,alignItems:`center`,justifyContent:`center`,fontSize:`28px`,fontWeight:`bold`,color:`#fff`,transition:`background 0.3s`},children:e}),(0,v.jsx)(`button`,{onClick:()=>f(e=>e+1),style:{width:`40px`,height:`40px`,borderRadius:`50%`,background:`#4ade80`,color:`#0f1117`,fontSize:`20px`,fontWeight:`bold`},children:`+`})]}),(0,v.jsxs)(`div`,{style:{marginTop:`12px`},children:[(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`11px`,marginBottom:`6px`},children:`Historique des états :`}),(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`4px`,alignItems:`center`,flexWrap:`wrap`},children:[i.map((e,t)=>(0,v.jsx)(`span`,{style:{padding:`2px 8px`,borderRadius:`4px`,fontSize:`13px`,background:t===i.length-1?n+`33`:`#252836`,color:t===i.length-1?n:`#94a3b8`,border:`1px solid ${t===i.length-1?n:`#2d3148`}`,fontFamily:`monospace`},children:e},t)),i.length>1&&(0,v.jsx)(`span`,{style:{color:`#94a3b8`,fontSize:`11px`},children:`← actuel`})]})]}),(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`6px`,marginTop:`10px`,flexWrap:`wrap`},children:[(0,v.jsx)(`button`,{onClick:()=>f(()=>0),style:{padding:`5px 12px`,borderRadius:`6px`,fontSize:`12px`,background:`#252836`,color:`#94a3b8`,border:`1px solid #2d3148`},children:`Reset`}),ae.map(e=>(0,v.jsx)(`button`,{onClick:()=>r(e),style:{width:`24px`,height:`24px`,borderRadius:`50%`,background:e,border:n===e?`2px solid #fff`:`2px solid transparent`}},e))]})]}),(0,v.jsxs)(`div`,{style:{padding:`16px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsxs)(`p`,{style:{color:`#94a3b8`,fontSize:`12px`,marginBottom:`10px`},children:[`Plusieurs états : `,(0,v.jsx)(`code`,{style:{color:`#a78bfa`,background:`#252836`,padding:`1px 5px`,borderRadius:`4px`},children:`articles[]`}),` + `,(0,v.jsx)(`code`,{style:{color:`#a78bfa`,background:`#252836`,padding:`1px 5px`,borderRadius:`4px`},children:`promo`})]}),(0,v.jsx)(`div`,{style:{display:`flex`,gap:`6px`,flexWrap:`wrap`,marginBottom:`10px`},children:ie.map((e,t)=>(0,v.jsx)(`button`,{onClick:()=>c(n=>[...n,{id:Date.now(),nom:e,prix:(t+1)*5}]),style:{padding:`6px 10px`,borderRadius:`6px`,fontSize:`13px`,background:`#252836`,color:`#e2e8f0`,border:`1px solid #2d3148`},children:e},e))}),o.length>0&&(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`4px`,marginBottom:`10px`},children:[o.slice(-3).map((e,t)=>(0,v.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,color:`#e2e8f0`},children:[(0,v.jsx)(`span`,{children:e.nom}),(0,v.jsxs)(`span`,{style:{color:`#fbbf24`},children:[e.prix,` €`]})]},e.id)),o.length>3&&(0,v.jsxs)(`p`,{style:{color:`#94a3b8`,fontSize:`11px`},children:[`+`,o.length-3,` article(s)…`]})]}),(0,v.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,flexWrap:`wrap`,gap:`8px`},children:[(0,v.jsx)(`button`,{onClick:()=>u(e=>!e),style:{padding:`6px 12px`,borderRadius:`6px`,fontSize:`12px`,background:l?`#4ade8033`:`#252836`,color:l?`#4ade80`:`#94a3b8`,border:`1px solid ${l?`#4ade80`:`#2d3148`}`},children:l?`✅ Promo -20%`:`🏷 Activer promo`}),(0,v.jsxs)(`div`,{style:{textAlign:`right`},children:[l&&p>0&&(0,v.jsxs)(`p`,{style:{color:`#94a3b8`,fontSize:`11px`,textDecoration:`line-through`},children:[p,` €`]}),(0,v.jsx)(`p`,{style:{color:`#4ade80`,fontWeight:`bold`},children:o.length===0?`Panier vide`:`${m.toFixed(2)} €`})]}),o.length>0&&(0,v.jsx)(`button`,{onClick:()=>c([]),style:{padding:`6px 10px`,borderRadius:`6px`,fontSize:`12px`,background:`#252836`,color:`#f87171`,border:`1px solid #2d3148`},children:`🗑 Vider`})]})]})]})}var E=`import { useState, useEffect } from 'react'

function Minuterie() {
  const [secondes, setSecondes] = useState(0)
  const [actif, setActif] = useState(false)

  useEffect(() => {
    if (!actif) return

    // Setup : démarre l'intervalle
    const id = setInterval(() => {
      setSecondes(s => s + 1)
    }, 1000)

    // Cleanup : arrête quand actif change ou que le composant disparaît
    return () => clearInterval(id)
  }, [actif]) // Se relance quand 'actif' change

  return (/* ... */)
}`,D="### À quoi sert useEffect ?\n**useEffect** permet de synchroniser ton composant avec quelque chose **en dehors de React** : un timer, une API, le titre de la page, un écouteur d'événement, etc. Il s'exécute **après** que React a mis à jour le DOM.\n\n### Syntaxe complète\n`useEffect(() => { /* effet */ return () => { /* cleanup */ } }, [deps])`\n\n### Le tableau de dépendances\n- **Absent** `useEffect(fn)` → s'exécute après **chaque** render\n- **Vide** `useEffect(fn, [])` → s'exécute **une seule fois** au montage\n- **Avec deps** `useEffect(fn, [a, b])` → se relance quand `a` ou `b` change\n\n### La fonction de cleanup\nElle s'exécute **avant** le prochain effet, et au **démontage** du composant.\nIndispensable pour : `clearInterval`, `removeEventListener`, annuler une requête.\n\n### Cas d'usage courants\n1. Charger des données depuis une API au montage\n2. S'abonner à un WebSocket ou un événement\n3. Synchroniser avec `localStorage`\n4. Modifier `document.title`\n\n⚠️ Ne mets pas `async` directement dans useEffect : `useEffect(async () => {...})` est incorrect. Crée une fonction async à l'intérieur.\n⚠️ Oublier le cleanup d'un `setInterval` provoque une **fuite mémoire** : le timer continue même après que le composant a disparu.\n✅ Si tu te demandes \"pourquoi mon effet s'exécute en boucle ?\" → vérifie que les dépendances ne changent pas à chaque render (objets/fonctions créés à l'intérieur du composant).";function O(){let[e,t]=(0,s.useState)(0),[n,r]=(0,s.useState)(!1),[i,a]=(0,s.useState)(`Page title`);return(0,s.useEffect)(()=>{if(!n)return;let e=setInterval(()=>t(e=>e+1),1e3);return()=>clearInterval(e)},[n]),(0,s.useEffect)(()=>(document.title=n?`⏱ ${e}s`:`React Blocs`,()=>{document.title=`React Blocs`}),[e,n]),(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`20px`,alignItems:`center`},children:[(0,v.jsx)(`div`,{style:{fontFamily:`monospace`,fontSize:`52px`,fontWeight:`bold`,color:n?`#4ade80`:`#94a3b8`,letterSpacing:`4px`,transition:`color 0.3s`},children:(e=>`${String(Math.floor(e/60)).padStart(2,`0`)}:${String(e%60).padStart(2,`0`)}`)(e)}),(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`10px`},children:[(0,v.jsx)(`button`,{onClick:()=>r(e=>!e),style:{padding:`10px 24px`,borderRadius:`8px`,background:n?`#f87171`:`#4ade80`,color:n?`#fff`:`#0f1117`,fontWeight:`bold`,transition:`background 0.2s`},children:n?`⏸ Pause`:`▶ Démarrer`}),(0,v.jsx)(`button`,{onClick:()=>{r(!1),t(0)},style:{padding:`10px 16px`,borderRadius:`8px`,background:`#252836`,color:`#94a3b8`},children:`↺ Reset`})]}),(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`13px`},children:n?`⚡ useEffect tourne — regarde le titre de l'onglet !`:`Appuie sur Démarrer pour lancer l'effet`})]})}var k=`const fruits = ['🍎 Pomme', '🍌 Banane', '🍊 Orange']

function Liste() {
  return (
    <ul>
      {fruits.map((fruit, index) => (
        // La key aide React à identifier chaque élément
        <li key={index}>{fruit}</li>
      ))}
    </ul>
  )
}

// ✅ Mieux : utiliser un id unique comme key
const tâches = [
  { id: 1, texte: 'Apprendre React' },
  { id: 2, texte: 'Créer une app' },
]
<ul>
  {tâches.map(t => <li key={t.id}>{t.texte}</li>)}
</ul>`,A="### Afficher une liste en React\nReact ne connaît pas les boucles `for` dans le JSX. On utilise `.map()` qui transforme chaque élément du tableau en JSX.\n\n### Syntaxe\n`{items.map(item => <li key={item.id}>{item.texte}</li>)}`\n\n### Pourquoi la prop key ?\nLa `key` est un identifiant unique que React utilise pour suivre chaque élément lors des mises à jour. Sans key, React ne sait pas **quoi** a changé → il re-rend tout.\n\n### Quelle valeur utiliser comme key ?\n1. **ID unique de la donnée** (base de données, UUID) → recommandé\n2. **Index du tableau** `i` → acceptable seulement si la liste ne change jamais d'ordre\n3. **Valeur stable et unique** (ex: un slug, un code)\n\n### Ajouter / supprimer des éléments\n- Ajouter : `setItems(prev => [...prev, nouvelElement])` — toujours créer un nouveau tableau\n- Supprimer : `setItems(prev => prev.filter(i => i.id !== id))`\n- Modifier : `setItems(prev => prev.map(i => i.id === id ? {...i, ...changes} : i))`\n\n⚠️ La `key` doit être **unique parmi les frères** (siblings), pas forcément globalement unique.\n⚠️ Ne jamais utiliser `Math.random()` comme key — elle change à chaque render et détruit les performances.\n✅ Tu peux aussi utiliser `.filter()` avant `.map()` pour afficher une liste filtrée.",j=[`🍎`,`🍌`,`🍊`,`🍇`,`🥝`,`🍓`,`🫐`,`🍑`];function M(){let[e,t]=(0,s.useState)([{id:1,texte:`Apprendre React`},{id:2,texte:`Créer une todo list`},{id:3,texte:`Déployer sur GitHub Pages`}]),[n,r]=(0,s.useState)(``),i=e.length+4,a=()=>{let e=n.trim();e&&(t(t=>[...t,{id:i++,texte:e}]),r(``))},o=e=>t(t=>t.filter(t=>t.id!==e));return(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`12px`},children:[(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`8px`},children:[(0,v.jsx)(`input`,{value:n,onChange:e=>r(e.target.value),onKeyDown:e=>e.key===`Enter`&&a(),placeholder:`Nouvelle tâche…`,style:{flex:1,padding:`10px 14px`,borderRadius:`8px`,border:`1px solid #2d3148`,background:`#252836`,color:`#e2e8f0`,fontSize:`14px`,outline:`none`}}),(0,v.jsx)(`button`,{onClick:a,style:{padding:`10px 16px`,borderRadius:`8px`,background:`#6c63ff`,color:`#fff`,fontWeight:`bold`},children:`+`})]}),e.length===0&&(0,v.jsx)(`p`,{style:{color:`#94a3b8`,textAlign:`center`,fontSize:`14px`},children:`Liste vide — ajoute une tâche !`}),(0,v.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`6px`},children:e.map((e,t)=>(0,v.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`10px`,padding:`10px 14px`,background:`#1a1d27`,borderRadius:`8px`,border:`1px solid #2d3148`},children:[(0,v.jsx)(`span`,{children:j[t%j.length]}),(0,v.jsx)(`span`,{style:{flex:1,color:`#e2e8f0`,fontSize:`14px`},children:e.texte}),(0,v.jsxs)(`span`,{style:{color:`#2d3148`,fontSize:`11px`,fontFamily:`monospace`},children:[`id:`,e.id]}),(0,v.jsx)(`button`,{onClick:()=>o(e.id),style:{color:`#f87171`,fontSize:`16px`,padding:`2px 6px`},children:`×`})]},e.id))})]})}var N=`import { useState } from 'react'

function Formulaire() {
  const [form, setForm] = useState({ nom: '', email: '' })

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault() // Évite le rechargement de la page
    console.log('Envoyé :', form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="nom" value={form.nom} onChange={handleChange} />
      <input name="email" value={form.email} onChange={handleChange} />
      <button type="submit">Envoyer</button>
    </form>
  )
}`,P="### Formulaire contrôlé vs non contrôlé\nEn React, il y a deux approches :\n- **Contrôlé** : React détient la valeur via `useState` → recommandé\n- **Non contrôlé** : le DOM gère la valeur via `useRef` → cas rares\n\n### Comment ça marche (contrôlé)\n1. L'utilisateur tape → l'événement `onChange` se déclenche\n2. `onChange` appelle `setValeur(e.target.value)`\n3. React re-rend avec la nouvelle valeur dans `value={valeur}`\nC'est une **boucle** : état → affichage → événement → état\n\n### Gérer plusieurs champs efficacement\nAu lieu d'un `useState` par champ, utilise un objet et le `name` de l'input :\n`const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))`\nL'attribut `name` de l'input devient la clé dans l'objet.\n\n### La soumission du formulaire\n`onSubmit` sur la balise `<form>` (pas sur le bouton).\n`e.preventDefault()` est indispensable pour empêcher le rechargement de page.\n\n### Validation\n- **HTML natif** : `required`, `type=\"email\"`, `minLength`\n- **Manuelle** : vérifier l'état avant de soumettre\n- **Bibliothèques** : React Hook Form, Zod pour des formulaires complexes\n\n⚠️ Si `value` est défini sans `onChange`, l'input devient **en lecture seule** → erreur dans la console.\n✅ Pour les cases à cocher, utilise `checked` et `onChange` au lieu de `value`.",F={width:`100%`,padding:`10px 14px`,borderRadius:`8px`,border:`1px solid #2d3148`,background:`#252836`,color:`#e2e8f0`,fontSize:`14px`,outline:`none`};function I(){let[e,t]=(0,s.useState)({nom:``,email:``,message:``}),[n,r]=(0,s.useState)(null),i=e=>t(t=>({...t,[e.target.name]:e.target.value}));return n?(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`12px`},children:[(0,v.jsxs)(`div`,{style:{padding:`16px`,background:`#4ade8022`,borderRadius:`8px`,border:`1px solid #4ade80`},children:[(0,v.jsx)(`p`,{style:{color:`#4ade80`,fontWeight:`bold`,marginBottom:`8px`},children:`✅ Formulaire soumis !`}),Object.entries(n).map(([e,t])=>(0,v.jsxs)(`p`,{style:{color:`#e2e8f0`,fontSize:`14px`},children:[(0,v.jsxs)(`span`,{style:{color:`#94a3b8`},children:[e,`:`]}),` `,t]},e))]}),(0,v.jsx)(`button`,{onClick:()=>{r(null),t({nom:``,email:``,message:``})},style:{padding:`10px`,borderRadius:`8px`,background:`#252836`,color:`#94a3b8`},children:`← Recommencer`})]}):(0,v.jsxs)(`form`,{onSubmit:t=>{t.preventDefault(),r(e)},style:{display:`flex`,flexDirection:`column`,gap:`12px`},children:[(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`label`,{style:{color:`#94a3b8`,fontSize:`12px`,display:`block`,marginBottom:`4px`},children:`Nom`}),(0,v.jsx)(`input`,{name:`nom`,value:e.nom,onChange:i,placeholder:`Ton nom…`,required:!0,style:F})]}),(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`label`,{style:{color:`#94a3b8`,fontSize:`12px`,display:`block`,marginBottom:`4px`},children:`Email`}),(0,v.jsx)(`input`,{name:`email`,type:`email`,value:e.email,onChange:i,placeholder:`ton@email.com`,required:!0,style:F})]}),(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`label`,{style:{color:`#94a3b8`,fontSize:`12px`,display:`block`,marginBottom:`4px`},children:`Message`}),(0,v.jsx)(`textarea`,{name:`message`,value:e.message,onChange:i,placeholder:`Ton message…`,rows:3,style:{...F,resize:`vertical`}})]}),(0,v.jsx)(`div`,{style:{padding:`10px`,background:`#252836`,borderRadius:`8px`,fontFamily:`monospace`,fontSize:`12px`,color:`#6c63ff`},children:JSON.stringify(e,null,2)}),(0,v.jsx)(`button`,{type:`submit`,style:{padding:`12px`,borderRadius:`8px`,background:`#6c63ff`,color:`#fff`,fontWeight:`bold`,fontSize:`15px`},children:`Envoyer →`})]})}var L=`function Statut({ connecté }) {
  // if/else classique
  if (!connecté) return <p>🔒 Non connecté</p>

  // Opérateur ternaire
  return (
    <div>
      {connecté
        ? <p>✅ Connecté</p>
        : <p>❌ Déconnecté</p>
      }

      {/* && : affiche seulement si la condition est vraie */}
      {connecté && <button>Se déconnecter</button>}
    </div>
  )
}`,R=`### Pourquoi le rendu conditionnel ?
En React, le JSX est du JavaScript — on peut utiliser toutes les structures conditionnelles JS pour décider **quoi afficher** selon l'état ou les props.

### Les 3 patterns essentiels

1. **Early return** : sortir tôt du composant si une condition est remplie
\`if (!chargé) return <Spinner />\`
Parfait pour les états de chargement, erreurs, ou données manquantes.

2. **Ternaire** : choisir entre deux éléments
\`{connecté ? <Dashboard /> : <LoginPage />}\`
Utilise-le quand tu as toujours **deux options** possibles.

3. **Court-circuit &&** : afficher ou rien
\`{message && <Toast texte={message} />}\`
Utilise-le quand tu veux **afficher ou ne rien afficher**.

### Choisir le bon pattern
- Condition simple → \`&&\`
- Deux alternatives → ternaire \`? :\`
- Logique complexe (3+ cas) → \`if/else\` ou variable intermédiaire

### Variable intermédiaire (lisibilité)
Pour les conditions longues, stocke le JSX dans une variable :
\`const contenu = isLoading ? <Spinner /> : <Data />\`
puis \`{contenu}\` dans le JSX.

⚠️ Piège classique avec \`&&\` : si la condition est \`0\` (zéro), React affiche **le chiffre 0** à l'écran au lieu de rien ! Utilise \`items.length > 0 && ...\` plutôt que \`items.length && ...\`
✅ Évite les ternaires imbriqués — ils deviennent illisibles. Préfère un \`if/else\` ou un switch.`;function z(){let[e,t]=(0,s.useState)(!1),[n,r]=(0,s.useState)(`sombre`),[i,a]=(0,s.useState)(0);return(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`20px`},children:[(0,v.jsxs)(`div`,{style:{padding:`16px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`12px`,marginBottom:`10px`},children:`if / else`}),(0,v.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`,flexWrap:`wrap`},children:[(0,v.jsx)(`div`,{style:{flex:1,padding:`12px`,borderRadius:`8px`,background:e?`#4ade8022`:`#f8717122`,border:`1px solid ${e?`#4ade80`:`#f87171`}`,textAlign:`center`},children:e?(0,v.jsx)(`span`,{style:{color:`#4ade80`},children:`✅ Bienvenue !`}):(0,v.jsx)(`span`,{style:{color:`#f87171`},children:`🔒 Non connecté`})}),(0,v.jsx)(`button`,{onClick:()=>t(e=>!e),style:{padding:`10px 20px`,borderRadius:`8px`,background:e?`#f87171`:`#4ade80`,color:e?`#fff`:`#0f1117`,fontWeight:`bold`},children:e?`Se déconnecter`:`Se connecter`})]}),e&&(0,v.jsxs)(`p`,{style:{marginTop:`10px`,color:`#a78bfa`,fontSize:`13px`},children:[`👆 Ce message n'apparaît que si `,(0,v.jsx)(`code`,{style:{background:`#2d3148`,padding:`1px 6px`,borderRadius:`4px`},children:`connecté && ...`})]})]}),(0,v.jsxs)(`div`,{style:{padding:`16px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`12px`,marginBottom:`10px`},children:`Ternaire`}),(0,v.jsx)(`div`,{style:{display:`flex`,gap:`8px`,alignItems:`center`,flexWrap:`wrap`},children:[`sombre`,`clair`,`violet`].map(e=>(0,v.jsx)(`button`,{onClick:()=>r(e),style:{padding:`8px 14px`,borderRadius:`8px`,background:n===e?`#6c63ff`:`#252836`,color:n===e?`#fff`:`#94a3b8`,border:n===e?`1px solid #6c63ff`:`1px solid #2d3148`},children:e},e))}),(0,v.jsxs)(`div`,{style:{marginTop:`10px`,padding:`12px`,borderRadius:`8px`,background:n===`clair`?`#f0f0f0`:n===`violet`?`#2d1b6b`:`#252836`,color:n===`clair`?`#0f1117`:`#e2e8f0`,transition:`all 0.3s`},children:[`Thème actif : `,(0,v.jsx)(`strong`,{children:n})]})]})]})}var B=`import { createContext, useContext, useState } from 'react'

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
}`,oe="### Le problème : prop drilling\nImagine transmettre `utilisateur` de `App` → `Layout` → `Sidebar` → `Avatar`. Chaque niveau doit passer la prop même s'il ne l'utilise pas. C'est le **prop drilling** — long et fragile.\n\n### La solution : Context\nLe Context crée un **canal direct** entre le fournisseur et n'importe quel consommateur dans l'arbre, sans passer par les intermédiaires.\n\n### Les 3 étapes\n1. **Créer** : `const MonCtx = createContext(valeurParDéfaut)`\n2. **Fournir** : `<MonCtx.Provider value={...}>` enveloppe l'arbre\n3. **Consommer** : `const valeur = useContext(MonCtx)` dans n'importe quel enfant\n\n### Quand utiliser le Context ?\n- Thème (dark/light)\n- Langue / internationalisation\n- Utilisateur connecté\n- Panier d'achat global\n\n### Quand NE PAS l'utiliser ?\n- Données locales à 2-3 composants → props suffisent\n- Données qui changent très souvent → risque de re-renders inutiles\n\n### Optimisation\nChaque composant qui consomme un contexte se re-rend quand la **valeur du Provider change**. Pour les grandes apps, séparer les contextes (ex: `UserCtx` et `ThemeCtx` séparément).\n\n⚠️ Un `useContext` retourne `undefined` si le composant n'est pas à l'intérieur du `Provider` correspondant.\n✅ Bonne pratique : créer un hook personnalisé `useTheme()` qui appelle `useContext(ThemeCtx)` — plus propre à utiliser.",V=(0,s.createContext)();function H({children:e,onClick:t,active:n}){let{theme:r}=(0,s.useContext)(V),i=r===`sombre`;return(0,v.jsx)(`button`,{onClick:t,style:{padding:`8px 16px`,borderRadius:`8px`,background:n?`#6c63ff`:i?`#252836`:`#e2e8f0`,color:n?`#fff`:i?`#94a3b8`:`#0f1117`,border:`1px solid ${n?`#6c63ff`:i?`#2d3148`:`#ccc`}`},children:e})}function U({titre:e,valeur:t}){let{theme:n}=(0,s.useContext)(V),r=n===`sombre`;return(0,v.jsxs)(`div`,{style:{padding:`16px`,borderRadius:`10px`,background:r?`#1a1d27`:`#f8f8f8`,color:r?`#e2e8f0`:`#0f1117`,border:`1px solid ${r?`#2d3148`:`#ddd`}`,transition:`all 0.3s`},children:[(0,v.jsx)(`p`,{style:{color:r?`#94a3b8`:`#666`,fontSize:`12px`},children:e}),(0,v.jsx)(`p`,{style:{fontWeight:`bold`,fontSize:`20px`},children:t})]})}function W(){let[e,t]=(0,s.useState)(`sombre`),[n,r]=(0,s.useState)(`fr`),i={fr:{bonjour:`Bonjour !`,titre:`Tableau de bord`,revenus:`Revenus`,users:`Utilisateurs`},en:{bonjour:`Hello!`,titre:`Dashboard`,revenus:`Revenue`,users:`Users`},ar:{bonjour:`مرحبا!`,titre:`لوحة التحكم`,revenus:`الإيرادات`,users:`المستخدمون`}}[n];return(0,v.jsx)(V.Provider,{value:{theme:e,setTheme:t},children:(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`},children:[(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,flexWrap:`wrap`},children:[(0,v.jsx)(`span`,{style:{color:`#94a3b8`,fontSize:`13px`,alignSelf:`center`},children:`Thème :`}),[`sombre`,`clair`].map(n=>(0,v.jsx)(H,{active:e===n,onClick:()=>t(n),children:n},n)),(0,v.jsx)(`span`,{style:{color:`#94a3b8`,fontSize:`13px`,alignSelf:`center`,marginLeft:`8px`},children:`Langue :`}),[`fr`,`en`,`ar`].map(e=>(0,v.jsx)(H,{active:n===e,onClick:()=>r(e),children:e},e))]}),(0,v.jsxs)(`h3`,{style:{color:e===`sombre`?`#a78bfa`:`#6c63ff`},children:[i.bonjour,` — `,i.titre]}),(0,v.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`10px`},children:[(0,v.jsx)(U,{titre:i.revenus,valeur:`12 450 €`}),(0,v.jsx)(U,{titre:i.users,valeur:`1 247`})]}),(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`12px`},children:`Les composants lisent le contexte sans recevoir de props !`})]})})}var G=`import { useRef } from 'react'

function Demo() {
  const inputRef = useRef(null)
  const renderCount = useRef(0)

  // Accéder au DOM directement
  const focusInput = () => inputRef.current.focus()

  // Compter les renders SANS re-render
  renderCount.current += 1

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
      <p>Renders : {renderCount.current}</p>
    </>
  )
}`,K="### Qu'est-ce que useRef ?\n`useRef` retourne un objet `{ current: valeur }` qui **persiste entre les renders** mais dont la modification ne déclenche **pas** de re-render. C'est sa différence fondamentale avec `useState`.\n\n### Les 2 usages principaux\n\n**1. Accéder au DOM directement**\n`const inputRef = useRef(null)`\n`<input ref={inputRef} />`\nPuis : `inputRef.current.focus()` — accès direct à l'élément HTML.\n\n**2. Mémoriser une valeur sans re-render**\n`const renderCount = useRef(0)`\n`renderCount.current += 1` — incrémente sans déclencher de re-render.\nUtile pour : compter les renders, stocker l'ID d'un timer, garder la valeur précédente.\n\n### useRef vs useState\n- `useState` → valeur qui **affecte l'interface** → déclenche un re-render\n- `useRef` → valeur **interne** (timer, DOM, compteur) → pas de re-render\n\n### Usages courants du DOM\n- `focus()` sur un input\n- `scrollIntoView()` pour scroller vers un élément\n- `getBoundingClientRect()` pour mesurer un élément\n- Contrôler une animation ou un canvas\n\n⚠️ Ne pas lire/modifier `ref.current` pendant le rendu — seulement dans des event handlers ou `useEffect`.\n⚠️ Si tu mets une `ref` sur un composant React (et non un élément HTML), il faut utiliser `forwardRef`.\n✅ Pour stocker la valeur précédente d'un état : `const prevCount = useRef(); useEffect(() => { prevCount.current = count }, [count])";function q(){let e=(0,s.useRef)(null),t=(0,s.useRef)(0),[n,r]=(0,s.useState)(``),[i,a]=(0,s.useState)([]),o=(0,s.useRef)(null),[c,l]=(0,s.useState)(!1),u=(0,s.useRef)(null);t.current+=1;let d=()=>e.current?.focus(),f=()=>{e.current?.focus(),e.current?.select()},p=()=>{r(``),e.current?.focus()};(0,s.useEffect)(()=>{let e=o.current;if(!e)return;let t=e.getContext(`2d`);t.strokeStyle=`#6c63ff`,t.lineWidth=3,t.lineCap=`round`},[]);let m=e=>{let t=o.current.getBoundingClientRect(),n=e.touches?e.touches[0]:e;return{x:n.clientX-t.left,y:n.clientY-t.top}},h=e=>{l(!0),u.current=m(e)},g=()=>l(!1),_=e=>{if(!c)return;let t=o.current.getContext(`2d`),n=m(e);t.beginPath(),t.moveTo(u.current.x,u.current.y),t.lineTo(n.x,n.y),t.stroke(),u.current=n};return(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`},children:[(0,v.jsxs)(`div`,{style:{padding:`12px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`12px`,marginBottom:`10px`},children:`Accès DOM via ref`}),(0,v.jsx)(`input`,{ref:e,value:n,onChange:e=>r(e.target.value),placeholder:`Clique sur un bouton…`,style:{width:`100%`,padding:`10px 14px`,borderRadius:`8px`,border:`1px solid #2d3148`,background:`#252836`,color:`#e2e8f0`,fontSize:`14px`,outline:`none`,marginBottom:`8px`}}),(0,v.jsx)(`div`,{style:{display:`flex`,gap:`6px`,flexWrap:`wrap`},children:[[`🎯 Focus`,d],[`✅ Sélectionner`,f],[`🗑 Vider`,p]].map(([e,t])=>(0,v.jsx)(`button`,{onClick:t,style:{padding:`7px 12px`,borderRadius:`6px`,background:`#252836`,color:`#a78bfa`,border:`1px solid #2d3148`,fontSize:`13px`},children:e},e))}),(0,v.jsxs)(`p`,{style:{marginTop:`8px`,color:`#94a3b8`,fontSize:`12px`},children:[`Re-renders : `,(0,v.jsx)(`strong`,{style:{color:`#fbbf24`},children:t.current}),` `,`(renderCount.current ne déclenche pas de re-render)`]})]}),(0,v.jsxs)(`div`,{style:{padding:`12px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:`8px`},children:[(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`12px`},children:`Canvas via ref (dessine !)`}),(0,v.jsx)(`button`,{onClick:()=>{let e=o.current;o.current.getContext(`2d`).clearRect(0,0,e.width,e.height)},style:{color:`#f87171`,fontSize:`12px`,background:`none`,border:`none`,cursor:`pointer`},children:`Effacer`})]}),(0,v.jsx)(`canvas`,{ref:o,width:280,height:140,onMouseDown:h,onMouseUp:g,onMouseMove:_,onTouchStart:h,onTouchEnd:g,onTouchMove:_,style:{width:`100%`,height:`140px`,borderRadius:`8px`,background:`#252836`,cursor:`crosshair`,touchAction:`none`}})]})]})}var se=`// Un hook personnalisé = une fonction qui commence par "use"
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// Utilisation comme useState
function App() {
  const [nom, setNom] = useLocalStorage('nom', '')
  return <input value={nom} onChange={e => setNom(e.target.value)} />
}`,ce="### Qu'est-ce qu'un hook personnalisé ?\nUn **hook personnalisé** est une fonction JavaScript dont le nom commence par `use` et qui appelle d'autres hooks React. Ce n'est **pas** un composant — il ne retourne pas de JSX, mais de la logique réutilisable.\n\n### Pourquoi en créer ?\nQuand tu copies-colles la même logique (`useState` + `useEffect`) dans plusieurs composants, c'est le signe qu'il faut extraire un hook. C'est l'équivalent React des fonctions utilitaires.\n\n### Structure type\n`function useMonHook(paramètre) {`\n`  const [état, setÉtat] = useState(...)`\n`  useEffect(() => { ... }, [paramètre])`\n`  return état` ou `[état, setÉtat]` ou un objet\n`}`\n\n### Les hooks de la démo\n1. **`useLocalStorage`** : synchronise un état avec `localStorage` → données persistantes\n2. **`useDebounce`** : attend la fin de frappe → évite trop d'appels API\n3. **`useWindowSize`** : écoute le resize → dimensions en temps réel\n\n### Règles des hooks (s'appliquent aussi aux customs)\n1. Appeler les hooks uniquement au **niveau supérieur** (pas dans des if/boucles)\n2. Appeler les hooks uniquement dans des **composants React** ou d'autres hooks\n\n### Bibliothèques populaires\nDes milliers de hooks prêts à l'emploi existent : `usehooks-ts`, `react-use`, `ahooks`.\n\n⚠️ Le préfixe `use` n'est pas optionnel — sans lui, React ne peut pas vérifier les règles des hooks.\n✅ Un bon hook personnalisé : nom clair, une seule responsabilité, bien testé.";function le(e,t){let[n,r]=(0,s.useState)(()=>{try{return JSON.parse(localStorage.getItem(e))??t}catch{return t}});return(0,s.useEffect)(()=>{localStorage.setItem(e,JSON.stringify(n))},[e,n]),[n,r]}function ue(e,t=500){let[n,r]=(0,s.useState)(e);return(0,s.useEffect)(()=>{let n=setTimeout(()=>r(e),t);return()=>clearTimeout(n)},[e,t]),n}function de(){let[e,t]=(0,s.useState)({w:window.innerWidth,h:window.innerHeight});return(0,s.useEffect)(()=>{let e=()=>t({w:window.innerWidth,h:window.innerHeight});return window.addEventListener(`resize`,e),()=>window.removeEventListener(`resize`,e)},[]),e}function J(){let[e,t]=le(`react-blocs-notes`,``),[n,r]=(0,s.useState)(``),i=ue(n,600),a=de(),o=(e,t)=>(0,v.jsx)(`span`,{style:{padding:`2px 8px`,borderRadius:`20px`,background:t+`22`,color:t,fontSize:`12px`,fontFamily:`monospace`},children:e});return(0,v.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`},children:[(0,v.jsxs)(`div`,{style:{padding:`12px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`6px`,alignItems:`center`,marginBottom:`8px`,flexWrap:`wrap`},children:[o(`useLocalStorage`,`#4ade80`),(0,v.jsx)(`span`,{style:{color:`#94a3b8`,fontSize:`12px`},children:`Les notes persistent après reload`})]}),(0,v.jsx)(`textarea`,{value:e,onChange:e=>t(e.target.value),placeholder:`Écris une note… elle sera sauvegardée automatiquement !`,rows:3,style:{width:`100%`,padding:`10px`,borderRadius:`8px`,border:`1px solid #2d3148`,background:`#252836`,color:`#e2e8f0`,fontSize:`14px`,outline:`none`,resize:`vertical`}}),(0,v.jsx)(`p`,{style:{color:`#4ade80`,fontSize:`11px`,marginTop:`4px`},children:`💾 Sauvegardé dans localStorage`})]}),(0,v.jsxs)(`div`,{style:{padding:`12px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`6px`,alignItems:`center`,marginBottom:`8px`,flexWrap:`wrap`},children:[o(`useDebounce`,`#fbbf24`),(0,v.jsx)(`span`,{style:{color:`#94a3b8`,fontSize:`12px`},children:`Attend la fin de frappe`})]}),(0,v.jsx)(`input`,{value:n,onChange:e=>r(e.target.value),placeholder:`Tape pour chercher…`,style:{width:`100%`,padding:`10px`,borderRadius:`8px`,border:`1px solid #2d3148`,background:`#252836`,color:`#e2e8f0`,fontSize:`14px`,outline:`none`}}),(0,v.jsxs)(`p`,{style:{marginTop:`6px`,fontSize:`13px`,color:`#94a3b8`},children:[`Valeur immédiate : `,(0,v.jsx)(`span`,{style:{color:`#e2e8f0`},children:n||`—`}),` | `,`Debounced : `,(0,v.jsx)(`span`,{style:{color:`#fbbf24`},children:i||`—`})]})]}),(0,v.jsxs)(`div`,{style:{padding:`12px`,background:`#1a1d27`,borderRadius:`10px`,border:`1px solid #2d3148`},children:[(0,v.jsx)(`div`,{style:{display:`flex`,gap:`6px`,alignItems:`center`,marginBottom:`6px`},children:o(`useWindowSize`,`#a78bfa`)}),(0,v.jsxs)(`p`,{style:{color:`#e2e8f0`,fontSize:`18px`,fontFamily:`monospace`},children:[a.w,` × `,a.h,` px`]}),(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`12px`},children:`Redimensionne la fenêtre pour voir`})]})]})}var Y=Object.assign({"./01-composant/index.jsx":c,"./02-props/index.jsx":l,"./03-useState/index.jsx":u,"./04-useEffect/index.jsx":d,"./05-listes/index.jsx":f,"./06-formulaire/index.jsx":p,"./07-conditionnel/index.jsx":m,"./08-useContext/index.jsx":h,"./09-useRef/index.jsx":g,"./10-hookCustom/index.jsx":_});function X(e){if(!e)return`// Source non disponible`;let t=e.split(`
`).filter(e=>e.trimStart().startsWith(`import`)),n=e.indexOf(`export default function`);return n===-1?e:[...t,``,e.slice(n)].join(`
`)}var fe={"01-composant":{component:x,explication:b,code:y,source:X(Y[`./01-composant/index.jsx`])},"02-props":{component:te,explication:C,code:S,source:X(Y[`./02-props/index.jsx`])},"03-useState":{component:T,explication:re,code:ne,source:X(Y[`./03-useState/index.jsx`])},"04-useEffect":{component:O,explication:D,code:E,source:X(Y[`./04-useEffect/index.jsx`])},"05-listes":{component:M,explication:A,code:k,source:X(Y[`./05-listes/index.jsx`])},"06-formulaire":{component:I,explication:P,code:N,source:X(Y[`./06-formulaire/index.jsx`])},"07-conditionnel":{component:z,explication:R,code:L,source:X(Y[`./07-conditionnel/index.jsx`])},"08-useContext":{component:W,explication:oe,code:B,source:X(Y[`./08-useContext/index.jsx`])},"09-useRef":{component:q,explication:K,code:G,source:X(Y[`./09-useRef/index.jsx`])},"10-hookCustom":{component:J,explication:ce,code:se,source:X(Y[`./10-hookCustom/index.jsx`])}},Z=t.map(e=>({...e,...fe[e.id]}));function pe({code:e}){let[t,n]=(0,s.useState)(!1);return(0,v.jsxs)(`div`,{style:{position:`relative`,borderRadius:`10px`,overflow:`hidden`,background:`#0d0f14`},children:[(0,v.jsx)(`button`,{onClick:async()=>{await navigator.clipboard.writeText(e).catch(()=>{}),n(!0),setTimeout(()=>n(!1),1500)},style:{position:`absolute`,top:`10px`,right:`10px`,padding:`4px 10px`,borderRadius:`6px`,fontSize:`11px`,background:t?`#4ade8033`:`#252836`,color:t?`#4ade80`:`#94a3b8`,border:`1px solid ${t?`#4ade80`:`#2d3148`}`,transition:`all 0.2s`},children:t?`✓ Copié`:`Copier`}),(0,v.jsx)(`pre`,{style:{margin:0,padding:`16px`,overflowX:`auto`,fontSize:`12px`,lineHeight:`1.7`,color:`#a78bfa`},children:(0,v.jsx)(`code`,{children:e})})]})}function Q({text:e}){return e.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((e,t)=>e.startsWith(`**`)&&e.endsWith(`**`)?(0,v.jsx)(`strong`,{style:{color:`#a78bfa`},children:e.slice(2,-2)},t):e.startsWith("`")&&e.endsWith("`")?(0,v.jsx)(`code`,{style:{background:`#0d0f14`,padding:`2px 6px`,borderRadius:`4px`,fontSize:`12px`,color:`#fbbf24`,fontFamily:`monospace`},children:e.slice(1,-1)},t):e)}function me({text:e}){let t=e.split(`
`),n=[],r=0;for(;r<t.length;){let e=t[r];if(!e.trim()){r++;continue}if(e.startsWith(`### `))n.push((0,v.jsx)(`p`,{style:{color:`#6c63ff`,fontSize:`11px`,fontWeight:`700`,textTransform:`uppercase`,letterSpacing:`1px`,margin:`16px 0 8px`},children:e.slice(4)},r));else if(e.startsWith(`⚠️`))n.push((0,v.jsx)(`div`,{style:{padding:`10px 12px`,background:`#fbbf2415`,border:`1px solid #fbbf2444`,borderRadius:`8px`,margin:`6px 0`},children:(0,v.jsx)(`p`,{style:{color:`#fbbf24`,fontSize:`13px`,lineHeight:`1.6`,margin:0},children:(0,v.jsx)(Q,{text:e})})},r));else if(e.startsWith(`✅`))n.push((0,v.jsx)(`div`,{style:{padding:`10px 12px`,background:`#4ade8015`,border:`1px solid #4ade8044`,borderRadius:`8px`,margin:`6px 0`},children:(0,v.jsx)(`p`,{style:{color:`#4ade80`,fontSize:`13px`,lineHeight:`1.6`,margin:0},children:(0,v.jsx)(Q,{text:e})})},r));else if(/^\d+\.\s/.test(e)){let t=e.match(/^(\d+)\.\s/)[1],i=e.replace(/^\d+\.\s/,``);n.push((0,v.jsxs)(`div`,{style:{display:`flex`,gap:`10px`,margin:`4px 0`},children:[(0,v.jsxs)(`span`,{style:{color:`#6c63ff`,fontWeight:`bold`,fontSize:`13px`,minWidth:`18px`},children:[t,`.`]}),(0,v.jsx)(`p`,{style:{color:`#e2e8f0`,fontSize:`14px`,lineHeight:`1.6`,margin:0},children:(0,v.jsx)(Q,{text:i})})]},r))}else e.startsWith(`- `)?n.push((0,v.jsxs)(`div`,{style:{display:`flex`,gap:`10px`,margin:`4px 0`},children:[(0,v.jsx)(`span`,{style:{color:`#6c63ff`,fontSize:`16px`,lineHeight:`1.4`,minWidth:`10px`},children:`·`}),(0,v.jsx)(`p`,{style:{color:`#e2e8f0`,fontSize:`14px`,lineHeight:`1.6`,margin:0},children:(0,v.jsx)(Q,{text:e.slice(2)})})]},r)):n.push((0,v.jsx)(`p`,{style:{color:`#e2e8f0`,fontSize:`14px`,lineHeight:`1.7`,margin:`0 0 8px`},children:(0,v.jsx)(Q,{text:e})},r));r++}return(0,v.jsx)(`div`,{style:{padding:`16px`,background:`#1a1d27`,borderRadius:`12px`,border:`1px solid #2d3148`},children:n})}var $={Débutant:`#4ade80`,Intermédiaire:`#fbbf24`,Avancé:`#f87171`};function he(){let{id:e}=i(),t=a(),[r,o]=(0,s.useState)(`demo`),c=Z.findIndex(t=>t.id===e),l=Z[c],u=Z[c-1],d=Z[c+1];if(!l)return(0,v.jsxs)(`div`,{style:{textAlign:`center`,padding:`60px 20px`},children:[(0,v.jsx)(`p`,{style:{color:`#f87171`},children:`Notion introuvable.`}),(0,v.jsx)(n,{to:`/`,style:{color:`#6c63ff`},children:`← Retour`})]});let f=l.component;return(0,v.jsxs)(`div`,{style:{maxWidth:`520px`,margin:`0 auto`,padding:`16px 16px 40px`},children:[(0,v.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`,marginBottom:`20px`},children:[(0,v.jsx)(n,{to:`/`,style:{color:`#94a3b8`,fontSize:`14px`,display:`flex`,alignItems:`center`,gap:`4px`},children:`← Accueil`}),(0,v.jsx)(`div`,{style:{flex:1}}),(0,v.jsx)(`span`,{style:{padding:`2px 10px`,borderRadius:`20px`,fontSize:`11px`,background:$[l.niveau]+`22`,color:$[l.niveau]},children:l.niveau})]}),(0,v.jsxs)(`div`,{style:{marginBottom:`20px`},children:[(0,v.jsx)(`div`,{style:{fontSize:`36px`,marginBottom:`6px`},children:l.emoji}),(0,v.jsx)(`h1`,{style:{fontSize:`22px`,fontWeight:`bold`,color:`#e2e8f0`,margin:`0 0 6px`},children:l.titre}),(0,v.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`14px`},children:l.description})]}),(0,v.jsx)(`div`,{style:{display:`flex`,gap:`4px`,marginBottom:`16px`,background:`#1a1d27`,padding:`4px`,borderRadius:`10px`},children:[{key:`demo`,label:`▶ Démo`},{key:`code`,label:`</> Code`},{key:`explication`,label:`📖 Explication`}].map(e=>(0,v.jsx)(`button`,{onClick:()=>o(e.key),style:{flex:1,padding:`8px`,borderRadius:`7px`,fontSize:`13px`,background:r===e.key?`#252836`:`transparent`,color:r===e.key?`#e2e8f0`:`#94a3b8`,fontWeight:r===e.key?`600`:`400`,transition:`all 0.2s`},children:e.label},e.key))}),(0,v.jsxs)(`div`,{style:{minHeight:`200px`},children:[r===`demo`&&(0,v.jsx)(`div`,{style:{padding:`16px`,background:`#1a1d27`,borderRadius:`12px`,border:`1px solid #2d3148`},children:(0,v.jsx)(f,{})}),r===`code`&&(0,v.jsx)(pe,{code:l.source||`// Code à venir`}),r===`explication`&&(0,v.jsx)(me,{text:l.explication||``})]}),(0,v.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginTop:`24px`,gap:`10px`},children:[u?(0,v.jsxs)(`button`,{onClick:()=>t(`/notion/${u.id}`),style:{flex:1,padding:`12px`,borderRadius:`10px`,background:`#1a1d27`,border:`1px solid #2d3148`,color:`#94a3b8`,fontSize:`13px`,textAlign:`left`},children:[`← `,u.emoji,` `,u.titre]}):(0,v.jsx)(`div`,{style:{flex:1}}),d?(0,v.jsxs)(`button`,{onClick:()=>t(`/notion/${d.id}`),style:{flex:1,padding:`12px`,borderRadius:`10px`,background:`#1a1d27`,border:`1px solid #2d3148`,color:`#94a3b8`,fontSize:`13px`,textAlign:`right`},children:[d.emoji,` `,d.titre,` →`]}):(0,v.jsx)(`div`,{style:{flex:1}})]})]})}export{he as default};