// Génération de chaînes d'exemple à partir de l'arbre d'une regex : chaînes qui
// correspondent (parcours de l'arbre) et variantes abîmées (mutations). Le
// moteur exécute ensuite le motif sur chacune : seules les chaînes dont le
// verdict est confirmé par l'exécution sont montrées.
import { contient, plagesNœud } from './classes.js'

// Générateur pseudo-aléatoire déterministe (mulberry32) : mêmes exemples à chaque fois.
export function prng(graine = 1) {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const LETTRES_CHIFFRES = 'abcdefghijklmnopqrstuvwxyz0123456789'

function carDansPlages(plages, rng) {
  if (contient(plages, 32) && !plages.some(([a, b]) => b >= 33 && a <= 126)) return ' '
  const imprimables = plages.map(([a, b]) => [Math.max(a, 33), Math.min(b, 126)]).filter(([a, b]) => a <= b)
  const choix = imprimables.length ? imprimables : plages.map(([a, b]) => [a, Math.min(b, a + 20)])
  const total = choix.reduce((s, [a, b]) => s + (b - a + 1), 0)
  let k = Math.floor(rng() * total)
  for (const [a, b] of choix) {
    const t = b - a + 1
    if (k < t) return String.fromCodePoint(a + k)
    k -= t
  }
  return ''
}

// Une chaîne qui correspond au nœud (les assertions sont ignorées : le moteur vérifie ensuite).
export function générerChaîne(ast, rng) {
  const captures = {}
  function g(n) {
    switch (n.t) {
      case 'lit': return n.v
      case 'esc': case 'cls': return carDansPlages(plagesNœud(n), rng)
      case 'any': return LETTRES_CHIFFRES[Math.floor(rng() * LETTRES_CHIFFRES.length)]
      case 'seq': return n.xs.map(g).join('')
      case 'alt': return n.xs.length ? g(n.xs[Math.floor(rng() * n.xs.length)]) : ''
      case 'grp': {
        const s = g(n.x)
        if (n.num) captures[n.num] = s
        if (n.name) captures[n.name] = s
        return s
      }
      case 'q': {
        const max = Math.min(n.max, n.min + 3)
        const choix = [n.min, Math.min(n.min + 1, max), max]
        const k = choix[Math.floor(rng() * choix.length)]
        let s = ''
        for (let i = 0; i < k; i++) s += g(n.x)
        return s
      }
      case 'ref': return captures[n.n] ?? ''
      case 'nref': return captures[n.name] ?? ''
      default: return ''
    }
  }
  return g(ast)
}

export function exemplesDepuisArbre(ast, { n = 8, graine = 20240101 } = {}) {
  const rng = prng(graine)
  const vus = new Set()
  const sortie = []
  for (let essai = 0; essai < n * 15 && sortie.length < n; essai++) {
    const s = générerChaîne(ast, rng)
    if (s && !vus.has(s)) { vus.add(s); sortie.push(s) }
  }
  return sortie
}

// Pour un motif à assertions positives ((?=.*[A-Z])…), on part du corps du motif puis on y insère
// de quoi satisfaire chaque assertion. Le moteur exécute ensuite le motif : seuls les exemples
// reconnus comptent, et leur nombre mesure si le motif est satisfaisable.
export function exemplesAvecAssertions(ast, { n = 10, graine = 20240101 } = {}) {
  const rng = prng(graine)
  const xs = ast.t === 'seq' ? ast.xs : [ast]
  const premierCorps = xs.findIndex(x => x.t !== 'look')
  const positifs = xs.filter(x => x.t === 'look' && !x.neg)
  const termine = l => l.x.t === 'seq' && l.x.xs.at(-1)?.t === 'eol'
  // Les assertions qui doivent toucher la fin du texte sont traitées en dernier.
  positifs.sort((a, b) => Number(termine(a) || (!a.ahead && xs.indexOf(a) > premierCorps)) - Number(termine(b) || (!b.ahead && xs.indexOf(b) > premierCorps)))
  const corps = { t: 'seq', xs: xs.filter(x => x.t !== 'look') }
  const vus = new Set()
  const sortie = []
  for (let essai = 0; essai < n * 20 && sortie.length < n; essai++) {
    let s = générerChaîne(corps, rng)
    for (const l of positifs) {
      const ajout = générerChaîne(l.x, rng)
      let pos
      if (!l.ahead) pos = xs.indexOf(l) > premierCorps ? s.length : 0
      else if (termine(l)) pos = s.length
      else if (l.x.t === 'seq' && l.x.xs[0]?.t === 'q' && l.x.xs[0].x.t === 'any') pos = Math.floor(rng() * (s.length + 1))
      else pos = 0
      s = s.slice(0, pos) + ajout + s.slice(pos)
    }
    if (!vus.has(s)) { vus.add(s); sortie.push(s) }
  }
  return sortie
}

// Variantes abîmées d'une chaîne valide (suppression, ajout, remplacement, permutation, casse).
export function mutations(s, rng = prng(7)) {
  const sortie = new Set()
  if (s.length > 1) {
    sortie.add(s.slice(1))
    sortie.add(s.slice(0, -1))
    const k = Math.floor(rng() * s.length)
    sortie.add(s.slice(0, k) + s.slice(k + 1))
    const p = Math.floor(rng() * (s.length - 1))
    sortie.add(s.slice(0, p) + s[p + 1] + s[p] + s.slice(p + 2))
  }
  sortie.add(`${s}x`)
  sortie.add(`x${s}`)
  sortie.add(`${s}!`)
  sortie.add(` ${s}`)
  sortie.add(`${s} `)
  sortie.add(s.toUpperCase())
  sortie.add(s.toLowerCase())
  const k = Math.floor(rng() * Math.max(1, s.length))
  sortie.add(`${s.slice(0, k)}#${s.slice(k + 1)}`)
  sortie.add(`${s.slice(0, k)}${s.slice(k)}${s.slice(k)}`)
  return [...sortie].filter(x => x !== s)
}

// Chaînes banales qui ne devraient correspondre à presque aucun format.
export const NEUTRES = ['', 'bonjour tout le monde', '12345', '!!!', '   ', 'abc def', 'x@', '--']
