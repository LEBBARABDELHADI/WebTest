// Client générique de Web Worker avec délai maximal : si une demande ne se
// termine pas (requête jq sans fin, motif à backtracking catastrophique), le
// worker est arrêté puis recréé à la demande suivante. Sans Worker disponible,
// la demande est exécutée dans la page.
//
//   const client = créerClient({
//     créerWorker: () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }),
//     direct: (type, args) => …,   // exécution sans worker
//   })
//   client.appeler('type', args, délaiMs)

export class DélaiDépassé extends Error {}

export function créerClient({ créerWorker, direct, messageDélai }) {
  let worker = null
  let suivant = 0
  const attentes = new Map()

  const rejeterTout = erreur => {
    for (const a of attentes.values()) { clearTimeout(a.minuteur); a.rejeter(erreur) }
    attentes.clear()
  }

  const créer = () => {
    worker = créerWorker()
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

  function appeler(type, args = {}, délai = 15000) {
    if (typeof Worker === 'undefined') return direct(type, args)
    if (!worker) créer()
    return new Promise((résoudre, rejeter) => {
      const id = ++suivant
      const minuteur = setTimeout(() => {
        attentes.delete(id)
        worker?.terminate()
        worker = null
        rejeterTout(new Error('Le moteur a été redémarré.'))
        rejeter(new DélaiDépassé(messageDélai ? messageDélai(délai) : `Délai dépassé (${Math.round(délai / 1000)} s) : le calcul ne s'est pas terminé. Le moteur a été redémarré.`))
      }, délai)
      attentes.set(id, { résoudre, rejeter, minuteur })
      worker.postMessage({ id, type, args })
    })
  }

  return { appeler }
}
