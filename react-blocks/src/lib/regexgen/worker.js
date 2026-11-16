// Web Worker du générateur de regex : génération, analyse d'un motif et test
// s'exécutent hors du fil de l'interface. Un motif à backtracking catastrophique
// ne bloque donc pas la page : le client arrête le worker après un délai.
import { exécuter } from './api.js'

self.onmessage = ({ data }) => {
  const { id, type, args } = data
  try {
    self.postMessage({ id, ok: true, résultat: exécuter(type, args) })
  } catch (e) {
    self.postMessage({ id, ok: false, erreur: e?.message || String(e) })
  }
}
