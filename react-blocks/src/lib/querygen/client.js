// Accès au moteur jq / JMESPath depuis l'interface : Web Worker avec délai
// maximal (voir workerClient.js). Sans Worker : moteur dans la page.
import { DélaiDépassé, créerClient } from '../workerClient.js'

export { DélaiDépassé }

let directe = null
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

const client = créerClient({
  créerWorker: () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }),
  direct: appelerDirect,
  messageDélai: délai => `Délai dépassé (${Math.round(délai / 1000)} s) : le calcul ne s'est pas terminé (boucle infinie ou JSON très volumineux). Le moteur a été redémarré.`,
})

export const appeler = client.appeler

// Premier appel : chargement du WebAssembly (délai plus long sur mobile).
export const préparerMoteur = () => appeler('version', {}, 60000)
