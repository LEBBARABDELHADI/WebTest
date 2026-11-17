// Jokers IAM : « * » = n'importe quelle suite de caractères (même vide), « ? » = exactement un
// caractère. Aucune expression régulière : l'appariement est itératif (pas de retour exponentiel).
//
// Un motif est compilé en jetons { t: 'c', c } (caractère), { t: '?' } ou { t: '*', x } où x est
// l'ensemble facultatif des caractères qu'une étoile ne peut PAS produire (utile pour les
// gabarits d'ARN : le nom d'un bucket ne contient pas « / »).

export const estJoker = s => /[*?]/.test(s)

// Jetons d'un motif. `interdits` : caractères interdits aux étoiles de CE motif.
export function compiler(motif, { insensible = false, interdits = null } = {}) {
  const texte = insensible ? motif.toLowerCase() : motif
  const jetons = []
  for (const c of texte) {
    if (c === '*') jetons.push({ t: '*', x: interdits })
    else if (c === '?') jetons.push({ t: '?' })
    else jetons.push({ t: 'c', c })
  }
  return jetons
}

// Jetons d'un motif dont certaines parties sont littérales (valeurs de variables substituées).
// parties : [{ v, littéral }]
export function compilerParties(parties, { insensible = false } = {}) {
  const jetons = []
  for (const p of parties) {
    const texte = insensible ? p.v.toLowerCase() : p.v
    if (p.littéral) for (const c of texte) jetons.push({ t: 'c', c })
    else jetons.push(...compiler(texte))
  }
  return jetons
}

// Le texte est-il reconnu par les jetons ? Parcours glouton avec un seul point de reprise
// (algorithme classique des jokers) : O(n·m) au pire, jamais exponentiel. Les étoiles sont
// ici toutes libres : les ensembles d'interdits ne servent qu'à `intersecte`.
export function reconnaît(jetons, texte, { insensible = false } = {}) {
  const s = Array.from(insensible ? texte.toLowerCase() : texte)
  let p = 0
  let t = 0
  let étoile = -1
  let reprise = 0
  while (t < s.length) {
    const j = jetons[p]
    if (j && (j.t === '?' || (j.t === 'c' && j.c === s[t]))) { p++; t++ } else if (j && j.t === '*') {
      étoile = p++
      reprise = t
    } else if (étoile >= 0) {
      // La dernière étoile absorbe un caractère de plus.
      p = étoile + 1
      t = ++reprise
    } else return false
  }
  while (jetons[p]?.t === '*') p++
  return p === jetons.length
}

// Raccourci : motif (avec jokers) contre texte.
export function correspond(motif, texte, options = {}) {
  return reconnaît(compiler(motif, options), texte, options)
}

// Existe-t-il au moins une chaîne reconnue par les deux motifs ? Produit des automates en
// parcourant les couples de positions (O(n·m)). Sert à savoir si un motif d'ARN saisi par
// l'utilisateur peut désigner une ressource d'un gabarit donné, sans énumérer les chaînes.
export function intersecte(A, B) {
  const n = A.length
  const m = B.length
  const vus = new Set()
  const pile = [[0, 0]]
  while (pile.length) {
    const [i, j] = pile.pop()
    const clé = i * (m + 1) + j
    if (vus.has(clé)) continue
    vus.add(clé)
    if (i === n && j === m) return true
    const a = A[i]
    const b = B[j]
    if (a?.t === '*') pile.push([i + 1, j])
    if (b?.t === '*') pile.push([i, j + 1])
    if (!a || !b) continue
    if (a.t === 'c' && b.t === 'c') { if (a.c === b.c) pile.push([i + 1, j + 1]) } else if (a.t === 'c' && b.t === '?') pile.push([i + 1, j + 1])
    else if (a.t === '?' && b.t === 'c') pile.push([i + 1, j + 1])
    else if (a.t === '?' && b.t === '?') pile.push([i + 1, j + 1])
    else if (a.t === '*' && b.t === 'c') { if (!a.x?.has(b.c)) pile.push([i, j + 1]) } else if (a.t === '*' && b.t === '?') pile.push([i, j + 1])
    else if (b.t === '*' && a.t === 'c') { if (!b.x?.has(a.c)) pile.push([i + 1, j]) } else if (b.t === '*' && a.t === '?') pile.push([i + 1, j])
  }
  return false
}

// Un motif en couvre-t-il un autre ? (tout ce que reconnaît `petit` l'est-il par `grand` ?)
// Réponse sûre dans le cas simple : grand = « * », ou égalité, ou grand = préfixe + « * » et petit
// commence par ce préfixe. Les autres cas renvoient false (« non prouvé »).
export function couvre(grand, petit, insensible = false) {
  const G = insensible ? grand.toLowerCase() : grand
  const P = insensible ? petit.toLowerCase() : petit
  if (G === P || G === '*') return true
  if (!/[?]/.test(G) && /\*/.test(G)) {
    // Sans « ? » dans le grand motif : si le petit en est une instance concrète, on teste.
    if (!estJoker(P)) return correspond(G, P)
    // Petit motif avec jokers : on le couvre si G, privé de ses étoiles, se retrouve dans l'ordre
    // dans P avec les mêmes littéraux aux extrémités (cas « préfixe* » ⊇ « préfixe-plus-long* »).
    const morceaux = G.split('*')
    if (morceaux.length === 2 && morceaux[1] === '' && P.startsWith(morceaux[0])) return true
  }
  return false
}
