// Moteur « Regex intelligent » : décrire un texte à reconnaître (français ou
// anglais) → regex, avec ses variantes par dialecte, son explication, ses
// hypothèses et une auto-vérification exécutée (exemples générés, exemples du
// format, exemples fournis). Tout est local ; aucune IA externe.
import { DIALECTES, drapeauxNécessaires, émettre, littéralJs, parcourir, traduireDrapeaux } from './ast.js'
import { assembler } from './assemblage.js'
import { arbreEntité, entité } from './catalogue.js'
import { exemplesAvecAssertions, exemplesDepuisArbre, mutations, prng } from './exemples.js'
import { expliquerMotif, risquesMotif } from './explication.js'
import { généraliserExemples } from './generaliser.js'
import { analyserDescription } from './langue.js'
import { ErreurRegex, analyserRegex } from './parse.js'
import { compiler, nettoyerDrapeaux, tester } from './testeur.js'
import { ressembleExemple } from './langue.js'

export { tester, compiler }

// ---- Écriture dans les autres dialectes ---------------------------------------------------------

const shell = s => `'${s.replace(/'/g, "'\\''")}'`
const python = s => {
  if (!s.includes("'")) return `r'${s}'`
  if (!s.includes('"')) return `r"${s}"`
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
const goChaîne = s => (s.includes('`') ? `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : `\`${s}\``)
const hcl = s => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$\{/g, '$${').replace(/%\{/g, '%%{')}"`

function exemplesDeCode(d, pattern, f, cible, flagsJs) {
  const i = flagsJs.includes('i')
  const trouver = cible === 'trouver'
  switch (d) {
    case 'js': return [{ titre: 'JavaScript', code: `const re = ${littéralJs(pattern, flagsJs)}\n${trouver ? 'texte.match(re)           // toutes les occurrences' : cible === 'lignes' ? 'texte.match(re)           // les lignes qui correspondent' : 're.test(texte)            // true / false'}` }]
    case 'python': return [{ titre: 'Python', code: `import re\n${trouver ? `re.findall(${python(pattern)}, texte${f.python.length ? `, ${f.python.join(' | ')}` : ''})` : cible === 'lignes' ? `re.findall(${python(pattern)}, texte, ${['re.MULTILINE', ...f.python.filter(x => x !== 're.MULTILINE')].join(' | ')})` : `re.search(${python(pattern)}, texte${f.python.length ? `, ${f.python.join(' | ')}` : ''})`}` }]
    case 'pcre': return [{ titre: 'grep -P', code: `grep -${trouver ? 'o' : ''}P${i ? 'i' : ''} ${shell(pattern)} fichier.txt` }]
    case 'ere': return [{ titre: 'grep -E', code: `grep -${trouver ? 'o' : ''}E${i ? 'i' : ''} ${shell(pattern)} fichier.txt` }, { titre: 'sed -E', code: `sed -E${i ? '' : ''} -n ${shell(`/${pattern.replace(/\//g, '\\/')}/${i ? 'I' : ''}p`)} fichier.txt` }]
    case 'go': return [
      { titre: 'Go', code: `re := regexp.MustCompile(${goChaîne(`${f.préfixe}${pattern}`)})\n${trouver ? 're.FindAllString(s, -1)' : 're.MatchString(s)'}` },
      { titre: 'Terraform (validation d\'une variable)', code: trouver ? `regexall(${hcl(`${f.préfixe}${pattern}`)}, var.texte)` : `validation {\n  condition     = can(regex(${hcl(`${f.préfixe}${pattern}`)}, var.valeur))\n  error_message = "Valeur invalide."\n}` },
    ]
    default: return []
  }
}

// Le même arbre écrit pour chaque dialecte : { js, pcre, python, ere, go }.
export function variantesDe(ast, flags, cible, patternJs = null) {
  const sortie = {}
  for (const d of Object.keys(DIALECTES)) {
    const e = émettre(ast, d)
    const f = traduireDrapeaux(flags, d)
    const pattern = d === 'js' && patternJs ? patternJs : e.pattern
    sortie[d] = {
      dialecte: d, nom: DIALECTES[d].nom, pattern, impossible: e.impossible, drapeaux: f,
      avertissements: [...e.avertissements, ...f.avertissements],
      code: e.impossible ? [] : exemplesDeCode(d, pattern, f, cible, flags),
    }
  }
  return sortie
}

// ---- Vérification --------------------------------------------------------------------------------------

const aAssertions = ast => { let r = false; parcourir(ast, n => { if (n.t === 'look' || n.t === 'ref' || n.t === 'nref') r = true }); return r }
const phrase = s => `Voir ${s}, merci.`

function extraitExactement(re, s) {
  const m = re.exec(phrase(s))
  return !!m && m[0] === s
}

function vérifier({ motif, flags, ast, cible, entitéId, pur, exemplesDonnés = [], ancrée = false }) {
  const contrôles = []
  const c = compiler(motif, flags)
  contrôles.push({ libellé: 'Le motif est accepté par le moteur JavaScript', ok: c.ok, détail: c.ok ? '' : c.erreur.message })
  if (!c.ok) return { contrôles, statut: 'échec', total: 1, réussis: 0, valides: [], invalides: [] }
  const re = new RegExp(motif, c.drapeaux.replace('g', ''))
  const reG = new RegExp(motif, c.drapeaux.includes('g') ? c.drapeaux : `${c.drapeaux}g`)
  const def = entitéId ? entité(entitéId) : null
  let valides = []
  let invalides = []

  // Exemples du format (catalogue) : testés sur le motif final quand il est « pur », sinon sur la base.
  if (def?.valides && (pur || def.ancré)) {
    valides = def.valides
    invalides = def.invalides
    if (cible === 'trouver' && def.peuDistinctif) {
      contrôles.push({ libellé: 'Format trop général pour une recherche en texte libre : le contrôle d\'extraction n\'est pas concluant', ok: null })
    } else if (cible === 'trouver' && !ancrée) {
      const ok = valides.filter(s => extraitExactement(new RegExp(motif, reG.flags), s))
      contrôles.push({ libellé: `Exemples valides retrouvés dans un texte : ${ok.length}/${valides.length}`, ok: ok.length === valides.length, détail: ok.length === valides.length ? '' : `Non retrouvés : ${valides.filter(s => !ok.includes(s)).join(', ')}` })
    } else {
      const bon = valides.filter(s => re.test(s))
      const mal = invalides.filter(s => !re.test(s))
      contrôles.push({ libellé: `Exemples valides acceptés : ${bon.length}/${valides.length}`, ok: bon.length === valides.length, détail: bon.length === valides.length ? '' : `Refusés à tort : ${valides.filter(s => !bon.includes(s)).join(', ')}` })
      contrôles.push({ libellé: `Exemples invalides refusés : ${mal.length}/${invalides.length}`, ok: mal.length === invalides.length, détail: mal.length === invalides.length ? '' : `Acceptés à tort : ${invalides.filter(s => !mal.includes(s)).join(', ')}` })
    }
  } else if (def?.valides && !pur) {
    // Conditions supplémentaires : on contrôle au moins le format de base, seul.
    const base = new RegExp(`^(?:${émettre(arbreEntité(def.id), 'js').pattern})$`)
    const bon = def.valides.filter(s => base.test(s))
    contrôles.push({ libellé: `Format de base « ${def.titre} » : ${bon.length}/${def.valides.length} exemples valides acceptés`, ok: bon.length === def.valides.length })
  }

  // Exemples générés depuis l'arbre.
  const générés = exemplesDepuisArbre(ast, { n: 8 })
  if (!aAssertions(ast) && !ancrée) {
    const ok = générés.filter(s => re.test(s))
    contrôles.push({ libellé: `Exemples générés depuis le motif : ${ok.length}/${générés.length} reconnus`, ok: ok.length === générés.length, détail: ok.length === générés.length ? '' : `Non reconnus : ${générés.filter(s => !ok.includes(s)).join(', ')}` })
  } else if (aAssertions(ast) && !ancrée) {
    // Assertions (?=…) : on construit des exemples d'après les conditions, puis on mesure combien sont reconnus.
    const construits = exemplesAvecAssertions(ast, { n: 12 })
    const reconnus = construits.filter(s => re.test(s))
    // Aucun exemple reconnu : la construction automatique n'a pas su satisfaire les conditions (non concluant, pas un échec).
    contrôles.push({ libellé: `Satisfaisable : ${reconnus.length}/${construits.length} exemples construits d'après les conditions sont reconnus`, ok: reconnus.length === 0 ? null : reconnus.length >= Math.min(3, construits.length), détail: reconnus.length ? '' : 'la construction automatique n\'a pas su satisfaire les conditions : contrôle non concluant' })
    if (!valides.length) valides = reconnus.slice(0, 5)
  }
  if (!valides.length) {
    valides = générés.filter(s => { try { return re.test(s) } catch { return false } }).slice(0, 5)
  }
  if (!invalides.length) {
    const rng = prng(11)
    const candidats = valides.flatMap(s => mutations(s, rng)).filter((s, i, t) => t.indexOf(s) === i)
    invalides = candidats.filter(s => { try { return !re.test(s) && !/[\n\r]/.test(s) } catch { return false } }).slice(0, 5)
  }

  // Sélectivité : un motif qui accepte tout ce qu'on lui montre, même abîmé, ne contrôle rien.
  if ((cible === 'valider' || cible === 'lignes') && !ancrée && !def?.invalides) {
    const refusés = invalides.filter(s => !re.test(s))
    contrôles.push({ libellé: `Sélectif : ${refusés.length}/${invalides.length} variantes abîmées sont refusées`, ok: invalides.length === 0 ? null : refusés.length > 0 && refusés.length === invalides.length, détail: refusés.length === invalides.length ? '' : 'le motif accepte des chaînes abîmées : il est peut-être trop permissif' })
  }

  // Exemples fournis par l'utilisateur.
  if (exemplesDonnés.length) {
    const ok = exemplesDonnés.filter(s => (cible === 'trouver' ? extraitExactement(new RegExp(motif, reG.flags), s) : re.test(s)))
    contrôles.push({ libellé: `Vos exemples reconnus : ${ok.length}/${exemplesDonnés.length}`, ok: ok.length === exemplesDonnés.length, détail: ok.length === exemplesDonnés.length ? '' : `Non reconnus : ${exemplesDonnés.filter(s => !ok.includes(s)).join(', ')}` })
  }
  const concluants = contrôles.filter(x => x.ok !== null)
  const réussis = concluants.filter(x => x.ok).length
  return { contrôles, statut: réussis === concluants.length ? 'vérifiée' : 'échec', total: concluants.length, réussis, valides, invalides }
}

// Texte d'essai pour la zone de test.
function texteDessai({ cible, valides, invalides, exemplesDonnés = [] }) {
  const v = [...new Set([...exemplesDonnés, ...valides])].slice(0, 6)
  const i = invalides.slice(0, 5)
  if (cible === 'trouver') {
    const phrases = []
    if (v[0]) phrases.push(`Contactez ${v[0]}${v[1] ? ` ou ${v[1]}` : ''} pour plus d'informations.`)
    if (v[2]) phrases.push(`Autre exemple : ${v[2]}${v[3] ? `, puis ${v[3]}` : ''}.`)
    phrases.push('Cette ligne ne contient rien à trouver.')
    if (i[0]) phrases.push(`Mauvais format : ${i[0]}`)
    return phrases.join('\n')
  }
  return [...v, ...i].join('\n')
}

// ---- Construction d'un candidat ------------------------------------------------------------------------------

function construireCandidat(brut, { exemplesDonnés = [], index = 0 }) {
  const ast = brut.ast
  const need = drapeauxNécessaires(ast)
  let flags = nettoyerDrapeaux(`${brut.flags}${[...need].join('')}`)
  const e = émettre(ast, 'js')
  const motif = e.pattern
  const def = brut.entité ? entité(brut.entité) : null
  const ancrée = !!def?.ancré
  const pur = !!def && brut.étapes.length <= 1 && (!brut.hypothèses.some(h => /longueur totale/.test(h)))
  const vérification = vérifier({ motif, flags, ast, cible: brut.cible, entitéId: brut.entité, pur, exemplesDonnés, ancrée })
  const explication = expliquerMotif(motif, flags)
  return {
    id: index,
    titre: brut.titre,
    entité: brut.entité,
    cible: brut.cible,
    motif,
    drapeaux: flags,
    littéral: littéralJs(motif, flags),
    hypothèses: brut.hypothèses,
    notes: brut.notes ?? [],
    variantes: variantesDe(ast, flags, brut.cible),
    explication,
    risques: explication.ok ? explication.risques : [],
    vérification: { contrôles: vérification.contrôles, statut: vérification.statut, total: vérification.total, réussis: vérification.réussis },
    exemples: { valides: vérification.valides, invalides: vérification.invalides, texteTest: texteDessai({ cible: brut.cible, valides: vérification.valides, invalides: vérification.invalides, exemplesDonnés }) },
  }
}

// ---- Points d'entrée ---------------------------------------------------------------------------------------------

const AIDE = 'Exemples de descriptions comprises : « adresse e-mail valide », « 3 lettres majuscules suivies d\'un tiret puis 4 chiffres », « mot de passe d\'au moins 8 caractères avec une majuscule et un chiffre », « lignes contenant ERROR mais pas DEBUG », « date au format jj/mm/aaaa », « version sémantique commençant par v ». Vous pouvez aussi donner des exemples : « comme AB-1234, XY-9876 ».'

// Sans format ni condition reconnus : la description est (ou contient) des exemples de valeurs.
// Entre guillemets, chaque citation est un exemple ; avec virgules / lignes, chaque morceau ; sinon la ligne entière.
function exemplesImplicites(description, spec) {
  if (!spec.J.some(j => j.cité || ressembleExemple(j))) return []
  const cités = spec.J.filter(j => j.cité).map(j => j.brut)
  if (cités.length) return cités
  const morceaux = description.split(/\r?\n|;|,(?=\s)/).map(x => x.trim()).filter(Boolean)
  return morceaux.length > 1 ? morceaux : [description.trim()]
}

export function générerRegex({ description = '', cible = 'auto', casse = null, groupes = null, exemples = [] } = {}) {
  const spec = analyserDescription(description, { groupes, casse })
  if (spec.vide) return { ok: false, erreur: 'Décrivez le texte à reconnaître (en français ou en anglais), ou donnez quelques exemples.' }
  const exemplesDonnés = [...spec.exemples, ...exemples.map(s => s.trim()).filter(Boolean)]
  const bruts = []
  const raisons = []
  let cibleRésolue = null
  let raisonCible = ''
  // Plusieurs textes entre guillemets sans « suivi de / puis » : des exemples de valeurs, pas une suite.
  const citationsSeules = spec.pièces.length >= 2 && !spec.contraintes.length && spec.pièces.every(p => p.littéral && spec.J[p.k]?.cité) && !spec.J.some(t => !t.cité && ['suivi', 'suivie', 'suivis', 'suivies', 'puis', 'ensuite', 'followed', 'then'].includes(t.norm))
  if (citationsSeules) { exemplesDonnés.push(...spec.pièces.map(p => spec.J[p.k].brut)); spec.pièces = []; spec.exemplesImplicites = exemplesDonnés.slice() }
  if (spec.pièces.length || spec.contraintes.length) {
    const r = assembler(spec, { cible })
    bruts.push(...r.candidats)
    raisons.push(...r.raisons)
    cibleRésolue = r.cible
    raisonCible = r.raisonCible
  } else {
    // Aucun format ni condition reconnus : les jetons qui ressemblent à des valeurs sont des exemples.
    const implicites = exemplesDonnés.length ? [] : exemplesImplicites(description, spec)
    const ex = exemplesDonnés.length ? exemplesDonnés : implicites
    if (spec.exemplesImplicites?.length === 0) delete spec.exemplesImplicites
    if (ex.length) {
      const g = généraliserExemples(ex, { groupes: spec.groupes })
      for (const c of g.candidats) {
        const cibleEx = cible === 'auto' ? 'valider' : cible
        bruts.push({ ...c, flags: spec.options.casse ? 'i' : '', cible: cibleEx, étapes: [], hypothèses: [`Cible : ${cibleEx === 'valider' ? 'valider la chaîne entière (^…$)' : cibleEx}.`, ...c.hypothèses] })
      }
      // ^…$ autour du motif déduit
      for (const b of bruts) {
        if (b.cible === 'valider') b.ast = { t: 'seq', xs: [{ t: 'bol' }, b.ast, { t: 'eol' }] }
      }
      cibleRésolue = cible === 'auto' ? 'valider' : cible
      raisonCible = 'par défaut, on valide une chaîne entière'
      if (!exemplesDonnés.length) spec.exemplesImplicites = implicites
    }
  }
  if (!bruts.length) {
    return { ok: true, langue: spec.langue, candidats: [], raisons: raisons.length ? raisons : [`Je n'ai pas pu rattacher cette description à un format, une suite d'éléments ou des exemples. ${AIDE}`], aide: AIDE }
  }
  const complément = exemplesDonnés.length && (spec.pièces.length || spec.contraintes.length) ? exemplesDonnés : (spec.exemplesImplicites?.length ? spec.exemplesImplicites : [])
  let candidats = bruts.slice(0, 4).map((b, index) => construireCandidat(b, { exemplesDonnés: complément, index }))
  // Des exemples fournis que aucun candidat ne reconnaît : on propose le motif déduit de ces exemples (correction).
  if (complément.length && spec.pièces.length + spec.contraintes.length > 0 && !candidats.some(c => c.vérification.statut === 'vérifiée')) {
    const g = généraliserExemples(complément, { groupes: spec.groupes })
    for (const c of g.candidats.slice(-1)) {
      const cibleEx = cibleRésolue === 'trouver' ? 'trouver' : 'valider'
      const ast = cibleEx === 'valider' ? { t: 'seq', xs: [{ t: 'bol' }, c.ast, { t: 'eol' }] } : c.ast
      candidats.push(construireCandidat({ ...c, ast, flags: cibleEx === 'trouver' ? 'g' : '', cible: cibleEx, étapes: [], hypothèses: ['Correction proposée : motif déduit de vos exemples (la description seule ne les reconnaissait pas).', ...c.hypothèses] }, { exemplesDonnés: complément, index: candidats.length }))
    }
  }
  // Les candidats vérifiés d'abord (ordre d'origine conservé).
  candidats = candidats.map((c, i) => ({ c, i })).sort((a, b) => (a.c.vérification.statut === 'vérifiée' ? 0 : 1) - (b.c.vérification.statut === 'vérifiée' ? 0 : 1) || a.i - b.i).map(({ c }, i) => ({ ...c, id: i }))
  return { ok: true, langue: spec.langue, cible: cibleRésolue, raisonCible, candidats, raisons, exemplesDonnés: complément, aide: AIDE }
}

// Analyse d'un motif écrit ou modifié à la main : explication, risques, conversions.
export function analyserMotif({ motif = '', drapeaux = '', cible = 'valider', exemples = [] } = {}) {
  const flags = nettoyerDrapeaux(drapeaux)
  if (!motif) return { ok: false, vide: true, erreur: { message: 'Le motif est vide.', position: 0 } }
  let lu
  try { lu = analyserRegex(motif, flags) } catch (e) {
    if (e instanceof ErreurRegex) return { ok: false, erreur: { message: e.message, position: e.position } }
    throw e
  }
  const explication = expliquerMotif(motif, flags)
  const vérification = vérifier({ motif, flags, ast: lu.ast, cible, entitéId: null, pur: false, exemplesDonnés: exemples })
  return {
    ok: true,
    explication,
    risques: risquesMotif(lu.ast),
    variantes: variantesDe(lu.ast, flags, cible, motif),
    vérification: { contrôles: vérification.contrôles, statut: vérification.statut, total: vérification.total, réussis: vérification.réussis },
    exemples: { valides: vérification.valides, invalides: vérification.invalides, texteTest: texteDessai({ cible, valides: vérification.valides, invalides: vérification.invalides }) },
    groupes: lu.groupes,
  }
}

export { DIALECTES }
