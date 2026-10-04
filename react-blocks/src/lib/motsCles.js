import { analyserTexte, texteBrut } from './texteFormate'

// Vérification d'une réponse libre (tapée ou dictée) par mots-clés :
// utilisée en révision (« Vérifier ») et dans l'entretien simulé.

const MOTS_VIDES = new Set([
  'avec', 'dans', 'pour', 'sans', 'sous', 'leur', 'leurs', 'cette', 'ces', 'elle', 'elles', 'ils', 'nous', 'vous',
  'sont', 'etre', 'avoir', 'fait', 'faire', 'comme', 'mais', 'donc', 'plus', 'tous', 'tout', 'toute', 'toutes',
  'aussi', 'meme', 'entre', 'depuis', 'pendant', 'apres', 'avant', 'quel', 'quelle', 'quelque', 'qui', 'que',
  'quoi', 'dont', 'etait', 'ont', 'une', 'des', 'les', 'aux', 'par', 'sur', 'est', 'pas', 'non', 'bien', 'cela',
  'ceci', 'celui', 'celle', 'ainsi', 'alors', 'encore', 'chaque', 'autre', 'autres', 'tres', 'peut', 'selon',
  'the', 'and', 'with', 'that', 'this', 'from', 'for',
])

export function normaliser(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Mots-clés attendus : les passages en gras du verso s'il y en a (on
// choisit soi-même l'essentiel), sinon les mots significatifs.
export function extraireMotsClés(verso) {
  const gras = analyserTexte(verso || '').filter(s => s.gras).map(s => s.texte.trim()).filter(Boolean)
  const candidats = gras.length > 0
    ? gras
    : texteBrut(verso).split(/[^\p{L}\p{N}]+/u).filter(m => {
      const n = normaliser(m)
      return (/^\d{2,}$/.test(n) || n.length >= 4) && !MOTS_VIDES.has(n)
    })
  const vus = new Set()
  return candidats.filter(m => {
    const n = normaliser(m)
    if (!n || vus.has(n)) return false
    vus.add(n)
    return true
  })
}

// Tolère pluriels et petites variantes : on compare sur la racine du mot.
function motPrésent(mot, motsSaisis) {
  const racine = mot.length > 5 ? mot.slice(0, mot.length - 2) : mot
  return motsSaisis.some(m => m === mot || (mot.length > 5 && m.startsWith(racine)))
}

export function vérifierMotsClés(verso, saisie) {
  const motsSaisis = normaliser(saisie).split(' ').filter(Boolean)
  return extraireMotsClés(verso).map(motClé => {
    const morceaux = normaliser(motClé).split(' ').filter(m => m.length >= 2 && !MOTS_VIDES.has(m))
    const trouvé = morceaux.length > 0 && morceaux.every(m => motPrésent(m, motsSaisis))
    return { motClé, trouvé }
  })
}
