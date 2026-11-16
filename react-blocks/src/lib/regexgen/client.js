// Accès au moteur regex depuis l'interface : Web Worker avec délai maximal
// (un motif à backtracking catastrophique est interrompu). Sans Worker : dans la page.
import { DélaiDépassé, créerClient } from '../workerClient.js'

export { DélaiDépassé }

const client = créerClient({
  créerWorker: () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }),
  direct: async (type, args) => (await import('./api.js')).exécuter(type, args),
  messageDélai: délai => `Délai dépassé (${(délai / 1000).toFixed(1).replace('.0', '')} s) : ce motif est trop lent sur ce texte. C'est le signe d'un backtracking catastrophique (ReDoS) : évitez les quantificateurs imbriqués comme (a+)+. Le moteur a été redémarré.`,
})

export const appeler = client.appeler
