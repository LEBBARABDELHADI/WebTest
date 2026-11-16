// Formats de date et d'heure écrits comme « jj/mm/aaaa », « yyyy-mm-dd hh:mm:ss »
// (français ou anglais) → arbre de regex avec bornes réalistes (mois 01-12,
// jour 01-31, heure 00-23, minutes et secondes 00-59).
import { ANY, alt, cls, esc, grp, lit, nc, plage, q, seq } from './ast.js'

const COMPOSANTS = /yyyy|aaaa|sss|yy|aa|jj|dd|hh|mm|ss/gi

const jour = () => nc(alt(seq(lit('0'), cls([plage('1', '9')])), seq(cls([plage('1', '2')]), esc('d')), seq(lit('3'), cls([plage('0', '1')]))))
const mois = () => nc(alt(seq(lit('0'), cls([plage('1', '9')])), seq(lit('1'), cls([plage('0', '2')]))))
const heure = () => nc(alt(seq(cls([plage('0', '1')]), esc('d')), seq(lit('2'), cls([plage('0', '3')]))))
const sexagésimal = () => seq(cls([plage('0', '5')]), esc('d'))

const TYPES = {
  yyyy: ['annee', () => q(esc('d'), 4, 4)],
  aaaa: ['annee', () => q(esc('d'), 4, 4)],
  yy: ['annee2', () => q(esc('d'), 2, 2)],
  aa: ['annee2', () => q(esc('d'), 2, 2)],
  jj: ['jour', jour],
  dd: ['jour', jour],
  hh: ['heure', heure],
  ss: ['seconde', sexagésimal],
  sss: ['milli', () => q(esc('d'), 3, 3)],
}

// « jj/mm/aaaa » est-il un format ? (au moins deux composants, le reste étant des séparateurs)
export function estFormat(texte) {
  const t = String(texte).toLowerCase()
  const composants = t.match(COMPOSANTS) ?? []
  if (composants.length < 2) return false
  const reste = t.replace(COMPOSANTS, '')
  return /^[-/.:\s_t]*$/.test(reste)
}

export function formatVersArbre(format, { groupes = false } = {}) {
  const t = String(format)
  const morceaux = []
  let dernier = 0
  for (const m of t.matchAll(COMPOSANTS)) {
    if (m.index > dernier) morceaux.push({ sep: t.slice(dernier, m.index) })
    morceaux.push({ comp: m[0].toLowerCase() })
    dernier = m.index + m[0].length
  }
  if (dernier < t.length) morceaux.push({ sep: t.slice(dernier) })
  const comps = morceaux.filter(x => x.comp)
  // « mm » : minutes si une heure précède (ou si des secondes suivent sans date), sinon mois.
  comps.forEach((c, i) => {
    if (c.comp !== 'mm') return
    const avant = comps[i - 1]?.comp, après = comps[i + 1]?.comp
    c.rôle = avant === 'hh' || (après === 'ss' && !['jj', 'dd', 'yyyy', 'aaaa', 'yy', 'aa'].includes(avant)) ? 'minute' : 'mois'
  })
  const xs = []
  const titres = []
  for (const x of morceaux) {
    if (x.sep !== undefined) {
      // « T » seul entre une date et une heure : le T littéral de l'ISO 8601.
      xs.push(lit(/^t$/i.test(x.sep) ? 'T' : x.sep))
      continue
    }
    let nom, nœud
    if (x.comp === 'mm') {
      nom = x.rôle
      nœud = x.rôle === 'minute' ? sexagésimal() : mois()
    } else [nom, nœud] = [TYPES[x.comp][0], TYPES[x.comp][1]()]
    const libellé = { annee: 'année', annee2: 'année (2 chiffres)', mois: 'mois', jour: 'jour', heure: 'heure', minute: 'minute', seconde: 'seconde', milli: 'millisecondes' }[nom]
    titres.push(libellé)
    xs.push(groupes ? grp(nœud, nom === 'annee2' ? 'annee' : nom) : nœud)
  }
  return { ast: seq(...xs), titre: `Format ${t}`, composants: titres }
}

export { ANY }
