// Accès au moteur depuis l'interface : Web Worker avec délai maximal. Si une
// demande dépasse le délai (requête jq sans fin, calcul énorme), le worker est
// arrêté puis recréé à la demande suivante. Sans Worker : moteur dans la page.

let worker = null
let suivant = 0
const attentes = new Map()
let directe = null

export class DélaiDépassé extends Error {}

function rejeterTout(erreur) {
  for (const a of attentes.values()) { clearTimeout(a.minuteur); a.rejeter(erreur) }
  attentes.clear()
}

function créer() {
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    const a = attentes.get(data.id)
    if (!a) return
    attentes.delete(data.id)
    clearTimeout(a.minuteur)
    if (data.ok) a.résoudre(data.résultat)
    else a.rejeter(new Error(data.erreur))
  }
  worker.onerror = e => {
    e.preventDefault?.()
    rejeterTout(new Error(`Le moteur s'est arrêté : ${e.message || 'erreur inattendue'}.`))
    worker?.terminate()
    worker = null
  }
}

async function moteurDirect() {
  if (!directe) {
    directe = Promise.all([import('jq-wasm'), import('jq-wasm/jq.wasm?url'), import('./moteur.js')])
      .then(([{ loadJq }, { default: wasmURL }, { créerMoteur }]) => loadJq({ wasmURL }).then(créerMoteur))
  }
  return directe
}

async function appelerDirect(type, args) {
  const m = await moteurDirect()
  if (type === 'version') return m.version
  if (type === 'analyser') return m.analyser(args.texteEntrée)
  if (type === 'générer') return m.générer(args)
  if (type === 'exécuter') return m.exécuterRequête(args)
  if (type === 'expliquer') return m.expliquer(args)
  throw new Error(`Demande inconnue : ${type}`)
}

export function appeler(type, args = {}, délai = 15000) {
  if (typeof Worker === 'undefined') return appelerDirect(type, args)
  if (!worker) créer()
  return new Promise((résoudre, rejeter) => {
    const id = ++suivant
    const minuteur = setTimeout(() => {
      attentes.delete(id)
      worker?.terminate()
      worker = null
      rejeterTout(new Error('Le moteur a été redémarré.'))
      rejeter(new DélaiDépassé(`Délai dépassé (${Math.round(délai / 1000)} s) : le calcul ne s'est pas terminé (boucle infinie ou JSON très volumineux). Le moteur a été redémarré.`))
    }, délai)
    attentes.set(id, { résoudre, rejeter, minuteur })
    worker.postMessage({ id, type, args })
  })
}

// Premier appel : chargement du WebAssembly (délai plus long sur mobile).
export const préparerMoteur = () => appeler('version', {}, 60000)
