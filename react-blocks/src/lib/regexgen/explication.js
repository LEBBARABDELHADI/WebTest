// Explication en français d'une expression régulière, élément par élément
// (à partir de l'arbre lu par parse.js), et détection des constructions à risque.
import { analyserRegex, ErreurRegex, extrait } from './parse.js'
import { affichable, ESC_PLAGES, fusionner, nomEnsemble, plagesNœud } from './classes.js'
import { enfants, parcourir } from './ast.js'

const ESC_TEXTE = {
  d: 'un chiffre (0-9)',
  D: 'un caractère qui n\'est pas un chiffre',
  w: 'un caractère de mot (lettre, chiffre ou _)',
  W: 'un caractère qui n\'est pas un caractère de mot',
  s: 'un espace blanc (espace, tabulation, saut de ligne…)',
  S: 'un caractère qui n\'est pas un espace blanc',
}
const ESC_PLURIEL = {
  d: 'chiffres (0-9)', D: 'tout sauf les chiffres', w: 'caractères de mot (lettres, chiffres, _)', W: 'tout sauf les caractères de mot', s: 'espaces blancs', S: 'tout sauf les espaces blancs',
}
const DRAPEAUX = {
  g: 'g : toutes les correspondances (pas seulement la première)',
  i: 'i : insensible à la casse (A = a)',
  m: 'm : ^ et $ valent pour chaque ligne (et non pour tout le texte)',
  s: 's : le point correspond aussi au saut de ligne',
  u: 'u : mode Unicode',
  y: 'y : recherche collée à la position courante',
  d: 'd : positions des groupes',
}

const guillemets = t => `« ${t} »`
const nomCar = c => {
  const n = c.codePointAt(0)
  return n < 32 || n === 127 ? affichable(n) : n === 32 ? 'espace' : c
}

function nomItem(it) {
  if (it.esc) return ESC_PLURIEL[it.esc]
  const p = fusionner([[it.lo, it.hi]])
  const nom = nomEnsemble(p)
  if (nom) return nom
  return it.lo === it.hi ? guillemets(nomCar(String.fromCodePoint(it.lo))) : `de ${guillemets(nomCar(String.fromCodePoint(it.lo)))} à ${guillemets(nomCar(String.fromCodePoint(it.hi)))}`
}

function descriptionClasse(n) {
  const noms = n.items.map(nomItem)
  return n.neg ? `un caractère qui n'est PAS parmi : ${noms.join(', ')}` : `un caractère parmi : ${noms.join(', ')}`
}

function quantité(min, max, lazy) {
  let t
  if (min === 0 && max === 1) t = 'optionnel (0 ou 1 fois)'
  else if (min === 0 && max === Infinity) t = '0 fois ou plus'
  else if (min === 1 && max === Infinity) t = '1 fois ou plus'
  else if (min === max) t = min === 1 ? '1 fois' : `exactement ${min} fois`
  else if (max === Infinity) t = `au moins ${min} fois`
  else t = `de ${min} à ${max} fois`
  return lazy ? `${t}, le moins possible (paresseux)` : t
}

function descriptionSimple(n) {
  switch (n.t) {
    case 'lit': {
      const chars = [...n.v]
      if (chars.length === 1) return `le caractère ${guillemets(nomCar(n.v))}`
      return `le texte ${guillemets(n.v)}`
    }
    case 'esc': return ESC_TEXTE[n.c]
    case 'any': return 'n\'importe quel caractère (sauf le saut de ligne)'
    case 'cls': return descriptionClasse(n)
    case 'bol': return 'le début de la chaîne (ou de chaque ligne avec le drapeau m)'
    case 'eol': return 'la fin de la chaîne (ou de chaque ligne avec le drapeau m)'
    case 'wb': return 'une limite de mot (entre un caractère de mot et autre chose)'
    case 'nwb': return 'une position qui n\'est pas une limite de mot'
    case 'uni': return `un caractère ${n.neg ? 'qui n\'a pas' : 'de'} la propriété Unicode ${guillemets(n.prop)}`
    case 'ref': return `le même texte que le groupe n° ${n.n}`
    case 'nref': return `le même texte que le groupe nommé ${guillemets(n.name)}`
    default: return null
  }
}

const estSimple = n => descriptionSimple(n) !== null

function titreGroupe(n) {
  if (n.kind === 'named') return `Groupe nommé ${guillemets(n.name)} (n° ${n.num})`
  if (n.kind === 'cap') return `Groupe n° ${n.num} (capturé)`
  return 'Groupe sans capture'
}

function titreAssertion(n) {
  if (n.ahead) return n.neg ? 'Vérifie que ce qui suit ne correspond PAS à (sans consommer de texte)' : 'Vérifie que ce qui suit correspond à (sans consommer de texte)'
  return n.neg ? 'Vérifie que ce qui précède ne correspond PAS à' : 'Vérifie que ce qui précède correspond à'
}

export function expliquerArbre(src, ast) {
  const sortie = []
  const ajouter = (code, texte, niveau) => sortie.push({ code, texte, niveau })

  function contenu(n, niveau) {
    if (n.t === 'seq') {
      const xs = n.xs
      for (let k = 0; k < xs.length; k++) {
        // Littéraux consécutifs : une seule ligne.
        if (xs[k].t === 'lit') {
          let fin = k
          while (fin + 1 < xs.length && xs[fin + 1].t === 'lit') fin++
          if (fin > k) {
            const texte = xs.slice(k, fin + 1).map(x => x.v).join('')
            ajouter(src.slice(xs[k].pos[0], xs[fin].pos[1]), `le texte ${guillemets(texte)}`, niveau)
            k = fin
            continue
          }
        }
        décrire(xs[k], niveau)
      }
    } else décrire(n, niveau)
  }

  function décrire(n, niveau) {
    const code = extrait(src, n)
    if (estSimple(n)) { ajouter(code, descriptionSimple(n), niveau); return }
    switch (n.t) {
      case 'seq': contenu(n, niveau); return
      case 'alt': {
        ajouter(code, `L'une des ${n.xs.length} possibilités :`, niveau)
        n.xs.forEach(b => {
          const c = extrait(src, b)
          if (b.t === 'seq' && b.xs.length === 0) ajouter('', 'ou rien (alternative vide)', niveau + 1)
          else if (estSimple(b) || (b.t === 'seq' && b.xs.every(x => x.t === 'lit'))) {
            const texte = b.t === 'seq' ? `le texte ${guillemets(b.xs.map(x => x.v).join(''))}` : descriptionSimple(b)
            ajouter(c, `ou ${texte}`, niveau + 1)
          } else {
            ajouter(c, 'ou :', niveau + 1)
            contenu(b, niveau + 2)
          }
        })
        return
      }
      case 'grp': {
        ajouter(code, `${titreGroupe(n)} :`, niveau)
        contenu(n.x, niveau + 1)
        return
      }
      case 'look': {
        ajouter(code, `${titreAssertion(n)} :`, niveau)
        contenu(n.x, niveau + 1)
        return
      }
      case 'q': {
        const qt = quantité(n.min, n.max, n.lazy)
        const x = n.x
        if (estSimple(x) || (x.t === 'lit')) {
          ajouter(code, `${descriptionSimple(x)} — ${qt}`, niveau)
        } else if (x.t === 'grp' && x.kind !== 'non') {
          ajouter(code, `${titreGroupe(x)} — répété : ${qt} :`, niveau)
          contenu(x.x, niveau + 1)
        } else if (x.t === 'grp') {
          ajouter(code, `Groupe répété : ${qt} :`, niveau)
          contenu(x.x, niveau + 1)
        } else {
          ajouter(code, `Répété : ${qt} :`, niveau)
          contenu(x, niveau + 1)
        }
        return
      }
      default: ajouter(code, 'élément du motif', niveau)
    }
  }

  contenu(ast, 0)
  return sortie
}

// ---- Constructions à risque ---------------------------------------------------

function nonBorné(n) { return n.t === 'q' && n.max === Infinity }

// Plages des premiers caractères possibles d'un nœud (null = inconnu).
function premiers(n) {
  switch (n.t) {
    case 'lit': return n.v ? [[n.v.codePointAt(0), n.v.codePointAt(0)]] : null
    case 'esc': case 'cls': return plagesNœud(n)
    case 'any': return [[0, 0x10ffff]]
    case 'grp': return premiers(n.x)
    case 'q': return n.min === 0 ? null : premiers(n.x)
    case 'seq': return n.xs.length ? premiers(n.xs[0]) : null
    case 'alt': { const p = n.xs.map(premiers); return p.some(x => !x) ? null : fusionner(p.flat()) }
    default: return null
  }
}

const seChevauchent = (a, b) => a.some(([x1, y1]) => b.some(([x2, y2]) => x1 <= y2 && x2 <= y1))

export function risquesMotif(ast) {
  const r = []
  const vus = new Set()
  const ajouter = (clé, texte, niveau = 'attention') => { if (!vus.has(clé)) { vus.add(clé); r.push({ niveau, texte }) } }
  parcourir(ast, n => {
    if (n.t === 'q' && (n.max === Infinity || n.max > 10)) {
      // Répétition d'un groupe dont le contenu est lui-même répétable sans séparateur obligatoire.
      let intérieur = false
      const corps = n.x.t === 'grp' ? n.x.x : n.x
      const éléments = corps.t === 'seq' ? corps.xs : [corps]
      const tousFlexibles = éléments.length > 0 && éléments.every(e => e.t === 'q' || e.t === 'bol' || e.t === 'eol')
      parcourir(n.x, m => { if (m !== n.x && nonBorné(m)) intérieur = true })
      if (n.x.t !== 'cls' && n.x.t !== 'esc' && intérieur && tousFlexibles) ajouter('imbriqué', 'Quantificateurs imbriqués (comme (a+)+ ou (\\w+\\s?)*) : sur un texte long qui ne correspond pas, le nombre d\'essais explose (backtracking catastrophique / ReDoS). Imposez un séparateur obligatoire dans le groupe.')
      // Alternatives qui commencent par les mêmes caractères, dans une répétition non bornée.
      if (nonBorné(n)) {
        parcourir(n.x, m => {
          if (m.t !== 'alt') return
          for (let a = 0; a < m.xs.length; a++) {
            for (let b = a + 1; b < m.xs.length; b++) {
              const pa = premiers(m.xs[a]), pb = premiers(m.xs[b])
              if (pa && pb && seChevauchent(pa, pb)) { ajouter('altchevauche', 'Alternatives qui commencent par les mêmes caractères dans une répétition (comme (a|ab)*) : risque de backtracking lent. Ordonnez-les ou factorisez le début commun.'); return }
            }
          }
        })
      }
    }
  })
  let pointsÉtoiles = 0
  parcourir(ast, n => { if (n.t === 'q' && n.x.t === 'any' && n.max === Infinity) pointsÉtoiles++ })
  if (pointsÉtoiles >= 3) ajouter('points', `${pointsÉtoiles} « .* » ou « .+ » dans le même motif : peut devenir lent sur de longues lignes ; préférez des classes précises (ex. [^,]*).`, 'info')
  return r
}

// ---- Point d'entrée ------------------------------------------------------------

export function expliquerMotif(src, flags = '') {
  let lu
  try {
    lu = analyserRegex(src, flags)
  } catch (e) {
    if (e instanceof ErreurRegex) return { ok: false, erreur: { message: e.message, position: e.position } }
    throw e
  }
  const { ast, groupes } = lu
  const étapes = expliquerArbre(src, ast)
  const résumé = []
  const xs = ast.t === 'seq' ? ast.xs : [ast]
  const débute = xs[0]?.t === 'bol', finit = xs.at(-1)?.t === 'eol'
  if (débute && finit) résumé.push('Valide la chaîne entière : le motif est ancré au début (^) et à la fin ($).')
  else if (débute) résumé.push('Ancré au début de la chaîne (^) : la correspondance commence tout au début.')
  else if (finit) résumé.push('Ancré à la fin de la chaîne ($).')
  else résumé.push('Non ancré : cherche une correspondance n\'importe où dans le texte.')
  let nAlternatives = 0
  parcourir(ast, n => { if (n.t === 'alt') nAlternatives++ })
  void enfants
  return {
    ok: true,
    étapes,
    résumé,
    groupes: groupes.map(g => ({ num: g.num, nom: g.nom })),
    drapeaux: [...new Set(flags)].filter(f => DRAPEAUX[f]).map(f => DRAPEAUX[f]),
    risques: risquesMotif(ast),
    complexité: nAlternatives,
  }
}

export { ESC_PLAGES }
