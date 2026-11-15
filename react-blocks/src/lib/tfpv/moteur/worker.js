// Web Worker : l'analyse tourne hors du fil de l'interface. Les données de
// référence (schémas des providers, règles AWS de TFLint) sont chargées une
// fois depuis le site de l'application ; aucun fichier de l'utilisateur ne sort.
import { analyser } from './index.js'
import { préparerTflint } from './tflintAws.js'

let données = null

async function charger(base) {
  if (données) return données
  const lire = async f => {
    const r = await fetch(`${base}tfpv/${f}`)
    if (!r.ok) throw new Error(`données de référence introuvables (${f}, HTTP ${r.status})`)
    return r.json()
  }
  const [aws, autres, tflint] = await Promise.all([lire('schema-aws.json'), lire('schema-autres.json'), lire('tflint-aws.json')])
  données = { schémas: { aws, ...autres }, tflint, tflintPréparé: préparerTflint(tflint) }
  return données
}

self.onmessage = async ({ data }) => {
  const { id, fichiers, options, base } = data
  try {
    self.postMessage({ id, type: 'progress', ev: { step: 'donnees', index: 0, total: 9, label: 'Chargement des données de référence', state: données ? 'done' : 'running', percent: 2 } })
    const d = await charger(base)
    const rapport = await analyser({ fichiers, options, données: d, onProgress: ev => self.postMessage({ id, type: 'progress', ev }) })
    self.postMessage({ id, type: 'done', rapport })
  } catch (e) {
    self.postMessage({ id, type: 'error', message: e?.message || String(e) })
  }
}
