// Web Worker du Query Generator : jq 1.8 (WebAssembly) et JMESPath tournent
// hors du fil de l'interface. Une requête jq qui ne se termine pas (boucle
// infinie) ne bloque donc pas la page : le client arrête le worker après un délai.
import { loadJq } from 'jq-wasm'
import wasmUrl from 'jq-wasm/jq.wasm?url'
import { créerMoteur } from './moteur.js'

let moteur = null
const obtenir = () => (moteur ??= loadJq({ wasmURL: wasmUrl }).then(jq => créerMoteur(jq)))

self.onmessage = async ({ data }) => {
  const { id, type, args } = data
  try {
    const m = await obtenir()
    let résultat
    if (type === 'version') résultat = m.version
    else if (type === 'analyser') résultat = m.analyser(args.texteEntrée)
    else if (type === 'générer') résultat = m.générer(args)
    else if (type === 'exécuter') résultat = m.exécuterRequête(args)
    else if (type === 'expliquer') résultat = m.expliquer(args)
    else throw new Error(`Demande inconnue : ${type}`)
    self.postMessage({ id, ok: true, résultat })
  } catch (e) {
    moteur = e?.name === 'RuntimeError' ? null : moteur
    self.postMessage({ id, ok: false, erreur: e?.message || String(e) })
  }
}
