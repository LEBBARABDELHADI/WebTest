// Comparaison avec les VRAIS moteurs d'expressions régulières : chaque motif
// généré, réécrit pour PCRE (grep -P), Python (re), POSIX ERE (grep -E) et Go
// (RE2), est exécuté par l'outil réel sur des chaînes valides, invalides et
// abîmées ; ses verdicts doivent être ceux de JavaScript. Les outils absents
// de la machine font ignorer les tests correspondants (rien n'est inventé).
//   npm run test:regexgen
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyserRegex } from '../../src/lib/regexgen/parse.js'
import { CATALOGUE } from '../../src/lib/regexgen/catalogue.js'
import { exemplesDepuisArbre, mutations, NEUTRES, prng } from '../../src/lib/regexgen/exemples.js'
import { analyserMotif, générerRegex } from '../../src/lib/regexgen/moteur.js'
import { interroger, outilsDisponibles } from './croisement.mjs'

const outils = outilsDisponibles()
const DIALECTES_TESTÉS = ['pcre', 'python', 'ere', 'go'].filter(d => ({ pcre: outils.grepP, python: outils.python, ere: outils.grepE, go: outils.go })[d])
const ascii = s => /^[\x20-\x7e\t]*$/.test(s)

// Chaînes d'essai : exemples du format, variantes abîmées, exemples générés depuis l'arbre, chaînes banales.
function chaînes(valides, invalides, motifJs, drapeaux) {
  const rng = prng(5)
  let générés = []
  try { générés = exemplesDepuisArbre(analyserRegex(motifJs, drapeaux.replace('g', '')).ast, { n: 8 }) } catch { /* motif sans arbre */ }
  const base = [...valides, ...invalides, ...générés]
  return [...new Set([...base, ...base.flatMap(s => mutations(s, rng)), ...NEUTRES])].filter(ascii).filter(s => !/[\n\r]/.test(s))
}

function lot(candidats) {
  const cas = []
  for (const { id, c } of candidats) {
    const flagsJs = c.drapeaux.replace('g', '')
    const js = new RegExp(c.motif, flagsJs)
    const liste = chaînes(c.exemples.valides, c.exemples.invalides, c.motif, c.drapeaux)
    const attendu = liste.map(s => js.test(s))
    for (const d of DIALECTES_TESTÉS) {
      const v = c.variantes[d]
      if (v.impossible) continue
      cas.push({ id: `${d}|${id}`, dialecte: d, pattern: v.pattern, flags: flagsJs, chaines: liste, attendu, motif: c.motif })
    }
  }
  return cas
}

function comparer(cas) {
  const r = interroger(cas)
  const écarts = []
  for (const c of cas) {
    const v = r[c.id]
    if (v.erreur) { écarts.push(`${c.id} → ERREUR du moteur : ${v.erreur.slice(0, 120)}  [${c.pattern}]`); continue }
    const diff = c.chaines.map((s, i) => [s, v.verdicts[i], c.attendu[i]]).filter(([, a, b]) => a !== b)
    if (diff.length) écarts.push(`${c.id} → ${c.pattern}\n     ${diff.slice(0, 3).map(([s, a, b]) => `${JSON.stringify(s)} : moteur=${a}, JavaScript=${b}`).join(' ; ')}`)
  }
  return écarts
}

test('outils disponibles pour la comparaison', () => {
  console.log(`# moteurs réels : grep -E ${outils.grepE ? 'oui' : 'non'}, grep -P ${outils.grepP ? 'oui' : 'non'}, Python ${outils.python ? 'oui' : 'non'}, Go/RE2 ${outils.go ? 'oui' : 'non'}`)
  assert.ok(true)
})

test('chaque format du catalogue : pcre, python, ere et go donnent les verdicts de JavaScript', { skip: !DIALECTES_TESTÉS.length && 'aucun moteur réel disponible' }, () => {
  const candidats = []
  for (const e of CATALOGUE) {
    if (!e.src && !e.format) continue
    const r = générerRegex({ description: e.noms[0] ?? e.titre, cible: e.ancré ? 'auto' : 'valider' })
    const c = r.candidats.find(x => x.entité === e.id)
    if (c) candidats.push({ id: e.id, c })
  }
  assert.ok(candidats.length >= 55, `${candidats.length} formats`)
  const cas = lot(candidats)
  const écarts = comparer(cas)
  assert.deepEqual(écarts, [], `${écarts.length} écart(s) sur ${cas.length} comparaisons :\n${écarts.join('\n')}`)
  console.log(`# ${cas.length} comparaisons (${candidats.length} formats × ${DIALECTES_TESTÉS.join(', ')}) : identiques à JavaScript`)
})

test('descriptions : suites, conditions, drapeaux — mêmes verdicts dans chaque moteur réel', { skip: !DIALECTES_TESTÉS.length && 'aucun moteur réel disponible' }, () => {
  const descriptions = [
    '3 lettres majuscules suivies d\'un tiret puis 4 chiffres', 'uniquement des lettres et des chiffres de 3 à 10 caractères', 'nombre à 2 décimales',
    'lignes contenant ERROR mais pas DEBUG', 'lignes qui commencent par #', 'lines starting with # or //', 'texte commençant par "http" et finissant par ".com"',
    'au moins une majuscule et un chiffre', 'tout sauf des espaces', '5 chiffres ou plus', 'une URL ou une adresse IP', 'adresse IP suivie de deux-points et d\'un port',
    'comme AB-1234, XY-9876', 'GET /api/users/42 200', 'starts with a capital letter followed by lowercase letters', 'words ending with "ing"',
    'adresse email se terminant par .fr', 'le mot "foo" insensible à la casse', 'mot de passe d\'au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial',
  ]
  const candidats = []
  for (const d of descriptions) {
    const r = générerRegex({ description: d })
    assert.ok(r.candidats.length, d)
    candidats.push({ id: d, c: r.candidats[0] })
  }
  const cas = lot(candidats)
  const écarts = comparer(cas)
  assert.deepEqual(écarts, [], `${écarts.length} écart(s) sur ${cas.length} comparaisons :\n${écarts.join('\n')}`)
  console.log(`# ${cas.length} comparaisons sur ${descriptions.length} descriptions : identiques à JavaScript`)
})

test('motifs écrits à la main : conversions identiques dans chaque moteur réel', { skip: !DIALECTES_TESTÉS.length && 'aucun moteur réel disponible' }, () => {
  const motifs = [
    [String.raw`^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$`, ''], [String.raw`[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}`, ''],
    [String.raw`^[\w.-]+@[\w-]+\.\w{2,}$`, 'i'], [String.raw`^\s*#.*$|^\s*$`, ''], [String.raw`\b(?:ERROR|WARN(?:ING)?)\b`, ''],
    [String.raw`^[^\]\\]+(?:x|yz){2,3}$`, ''], [String.raw`^\+?33[ .-]?[1-9](?:[ .-]?\d{2}){4}$`, ''], [String.raw`^(?:\d+,)+\d+$`, ''],
    [String.raw`^(?<a>\d+)-(?<b>[a-z]+)$`, ''], [String.raw`^[+-]?\d+(?:[.,]\d+)?$`, ''], [String.raw`^(?:[a-f0-9]{2}:){5}[a-f0-9]{2}$`, 'i'],
    [String.raw`^[ -~]{3,8}$`, ''], [String.raw`^[%+--.0-9]+$`, ''], [String.raw`^[a\-z]+[\]]$`, ''],
  ]
  const candidats = motifs.map(([motif, drapeaux], i) => {
    const a = analyserMotif({ motif, drapeaux })
    assert.ok(a.ok, motif)
    return { id: `main-${i}`, c: { motif, drapeaux, variantes: a.variantes, exemples: a.exemples } }
  })
  const cas = lot(candidats)
  const écarts = comparer(cas)
  assert.deepEqual(écarts, [], `${écarts.length} écart(s) sur ${cas.length} comparaisons :\n${écarts.join('\n')}`)
  console.log(`# ${cas.length} comparaisons sur ${motifs.length} motifs écrits à la main : identiques à JavaScript`)
})

test('les dialectes qui ne savent pas exprimer un motif le disent (et ne l\'écrivent pas de travers)', () => {
  const p = générerRegex({ description: 'mot de passe fort' }).candidats[0]
  for (const d of ['ere', 'go']) {
    assert.equal(p.variantes[d].pattern, '')
    assert.match(p.variantes[d].impossible, /assertions/)
  }
  const a = analyserMotif({ motif: String.raw`(?<![\d.])\d+`, drapeaux: '' })
  assert.match(a.variantes.go.impossible, /assertions/)
  assert.ok(a.variantes.python.avertissements.some(x => /largeur fixe/.test(x)) || a.variantes.python.impossible === null)
  const u = analyserMotif({ motif: String.raw`^\p{L}+$`, drapeaux: 'u' })
  assert.match(u.variantes.python.impossible, /regex/)
  assert.match(u.variantes.ere.impossible, /ERE/)
  assert.equal(u.variantes.go.impossible, null)
})
