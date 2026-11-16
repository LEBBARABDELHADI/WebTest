// Demandes acceptées par le moteur regex (Web Worker ou exécution directe).
import { analyserMotif, générerRegex } from './moteur.js'
import { tester } from './testeur.js'

export function exécuter(type, args) {
  switch (type) {
    case 'générer': return générerRegex(args)
    case 'analyser': return analyserMotif(args)
    case 'tester': {
      // Le texte testé n'est pas renvoyé : l'interface garde celui qu'elle a envoyé.
      const r = tester(args)
      delete r.texteTesté
      return r
    }
    default: throw new Error(`Demande inconnue : ${type}`)
  }
}
