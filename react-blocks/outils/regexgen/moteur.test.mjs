// Tests du moteur « Regex intelligent » : lecture et explication d'un motif,
// testeur, catalogue de formats, interprétation de descriptions françaises et
// anglaises (chaque motif est exécuté : valides acceptés, invalides refusés,
// extractions exactes), exemples, options et cas limites.
//   npm run test:regexgen
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyserRegex, ErreurRegex } from '../../src/lib/regexgen/parse.js'
import { émettre, littéralJs } from '../../src/lib/regexgen/ast.js'
import { expliquerMotif, risquesMotif } from '../../src/lib/regexgen/explication.js'
import { exemplesDepuisArbre, mutations, prng } from '../../src/lib/regexgen/exemples.js'
import { tester } from '../../src/lib/regexgen/testeur.js'
import { CATALOGUE, arbreEntité } from '../../src/lib/regexgen/catalogue.js'
import { générerRegex, analyserMotif } from '../../src/lib/regexgen/moteur.js'
import { analyserJson } from '../../src/lib/querygen/json.js'

void analyserJson

// ---- Parseur, émission, explication ----------------------------------------------------

test('parseur : lecture puis réécriture JavaScript identiques en comportement (60 000 comparaisons)', () => {
  const motifs = [
    String.raw`^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$`, String.raw`[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}`,
    String.raw`(?<annee>\d{4})/(?<mois>\d{2})`, String.raw`\b(?:GET|POST|PUT)\b\s+/[^\s?]*`, String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`,
    String.raw`(?<![\d.])\d+(?:\.\d+)?(?![\d.])`, String.raw`(a|b)\1`, String.raw`a{2,5}?b*?c+`, String.raw`[\w.-]+|\s*`, String.raw`\t\n[^\]\\]`,
    String.raw`(?:ab)+`, String.raw`x{2}y{3,}z?`, String.raw`\.\*\+\?\(\)\[\]\{\}\|\^\$`, String.raw`^$`, String.raw`a|b|`,
  ]
  const alphabet = ['a', 'b', 'c', 'A', '1', '2', '9', '-', '.', '@', ' ', '\n', '/', '_', 'x', 'y', 'z']
  let graine = 7
  const hasard = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647 }
  for (const m of motifs) {
    const { ast } = analyserRegex(m)
    const original = new RegExp(m), réécrit = new RegExp(émettre(ast, 'js').pattern)
    for (let k = 0; k < 4000; k++) {
      let s = ''
      for (let i = 0, n = Math.floor(hasard() * 14); i < n; i++) s += alphabet[Math.floor(hasard() * alphabet.length)]
      const a = original.exec(s), b = réécrit.exec(s)
      assert.equal(a && a[0], b && b[0], `${m} sur ${JSON.stringify(s)}`)
    }
  }
})

test('parseur : erreurs en français avec position', () => {
  const cas = [['(abc', /jamais fermée/, 0], ['abc)', /sans parenthèse ouvrante/, 3], ['[a-', /Crochet/, 0], ['*a', /rien à répéter/, 0], ['a**', /Deux quantificateurs/, 2], ['a{3,1}', /minimum dépasse/, 1], ['[z-a]', /Plage invalide/, 1], ['abc\\', /incomplète/, 3], ['(?<n>a)(?<n>b)', /utilisé deux fois/, 7], ['(?P<n>a)', /Python/, 0], ['(?i)abc', /drapeaux en ligne/, 0], ['^*', /ancre/, 0]]
  for (const [motif, message, position] of cas) {
    assert.throws(() => analyserRegex(motif), e => e instanceof ErreurRegex && message.test(e.message) && e.position === position, motif)
  }
})

test('explication : étapes lisibles, groupes, drapeaux et risques', () => {
  const e = expliquerMotif(String.raw`^(?<annee>\d{4})-(?:0[1-9]|1[0-2])$`, '')
  assert.ok(e.ok)
  assert.match(e.résumé[0], /chaîne entière/)
  assert.ok(e.étapes.some(x => /Groupe nommé « annee »/.test(x.texte)))
  assert.ok(e.étapes.some(x => /un chiffre \(0-9\) — exactement 4 fois/.test(x.texte)))
  assert.deepEqual(e.groupes, [{ num: 1, nom: 'annee' }])
  assert.match(expliquerMotif('a', 'gi').drapeaux.join(' '), /insensible à la casse/)
  const mauvais = expliquerMotif('(abc', '')
  assert.equal(mauvais.ok, false)
  assert.match(mauvais.erreur.message, /jamais fermée/)
  // Backtracking catastrophique : détecté ; motif correct : rien
  assert.match(expliquerMotif(String.raw`(\w+\s?)+$`, '').risques[0].texte, /backtracking catastrophique/)
  assert.match(expliquerMotif('(a|ab)*c', '').risques[0].texte, /même|mêmes/)
  assert.equal(expliquerMotif(String.raw`(\d+,)+\d+`, '').risques.length, 0)
  assert.equal(risquesMotif(analyserRegex('^[a-z]+$').ast).length, 0)
})

test('testeur : correspondances, lignes, colonnes, groupes nommés et numérotés', () => {
  const r = tester({ pattern: String.raw`(\d+)-(?<mot>[a-z]+)`, flags: 'i', texte: 'ab 12-foo, 7-BAR\nzz 3-x' })
  assert.equal(r.total, 3)
  assert.deepEqual(r.correspondances.map(c => [c.texte, c.ligne, c.colonne]), [['12-foo', 1, 4], ['7-BAR', 1, 12], ['3-x', 2, 4]])
  assert.deepEqual(r.correspondances[0].groupes, [{ num: 1, nom: null, valeur: '12' }, { num: 2, nom: 'mot', valeur: 'foo' }])
  assert.deepEqual(r.lignes.map(l => l.ok), [true, true])
  const l = tester({ pattern: '^a*$', flags: 'm', texte: 'aaa\nb\n\naa', parLigne: true })
  assert.deepEqual(l.lignes.map(x => x.ok), [true, false, true, true])
  assert.equal(l.nbLignesCorrespondantes, 3)
  // motif invalide : message français ; correspondance vide : pas de boucle infinie
  assert.match(tester({ pattern: '(', texte: 'x' }).erreur.message, /jamais fermée/)
  assert.equal(tester({ pattern: 'x*', texte: 'axb' }).total, 4)
  assert.equal(tester({ pattern: '', texte: 'x' }).ok, false)
})

test('exemples : chaînes générées toujours reconnues, variantes abîmées refusées', () => {
  for (const m of [String.raw`^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$`, String.raw`[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}`, String.raw`(a|b)\1c`, String.raw`^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$`]) {
    const { ast } = analyserRegex(m)
    const re = new RegExp(m)
    const ex = exemplesDepuisArbre(ast, { n: 8 })
    assert.ok(ex.length >= 2, m)
    for (const s of ex) assert.ok(re.test(s), `${m} devrait reconnaître ${JSON.stringify(s)}`)
    assert.ok(ex.flatMap(s => mutations(s, prng(3))).some(s => !re.test(s)), `${m} : aucune variante refusée`)
  }
})

// ---- Catalogue -----------------------------------------------------------------------------

test('catalogue : chaque format accepte ses exemples valides, refuse ses invalides (texte entier et recherche)', () => {
  let n = 0
  for (const e of CATALOGUE) {
    if (!e.src && !e.format) continue
    n++
    const ast = arbreEntité(e.id)
    const p = émettre(ast, 'js').pattern
    const total = e.ancré ? new RegExp(p, (e.flags ?? '').replace('g', '')) : new RegExp(`^(?:${p})$`)
    for (const v of e.valides) assert.ok(total.test(v), `${e.id} devrait accepter ${JSON.stringify(v)}`)
    for (const v of e.invalides) assert.ok(!total.test(v), `${e.id} devrait refuser ${JSON.stringify(v)}`)
    if (e.srcGroupes || e.format) {
      const g = new RegExp(`^(?:${émettre(arbreEntité(e.id, { groupes: true }), 'js').pattern})$`)
      for (const v of e.valides) assert.ok(g.test(v), `${e.id} (groupes nommés) devrait accepter ${JSON.stringify(v)}`)
      for (const v of e.invalides) assert.ok(!g.test(v), `${e.id} (groupes nommés) devrait refuser ${JSON.stringify(v)}`)
    }
  }
  assert.ok(n >= 55, `${n} formats`)
})

test('catalogue : recherche dans un texte retrouve exactement chaque exemple valide', () => {
  for (const e of CATALOGUE) {
    if ((!e.src && !e.format) || e.ancré || e.peuDistinctif) continue
    const r = générerRegex({ description: e.noms[0] ?? e.titre, cible: 'trouver' })
    const c = r.candidats.find(x => x.entité === e.id)
    if (!c) continue
    for (const v of e.valides) {
      const m = new RegExp(c.motif, c.drapeaux).exec(`Voir ${v}, merci.`)
      assert.equal(m?.[0], v, `${e.id} : ${JSON.stringify(v)} non retrouvé par ${c.littéral}`)
    }
    assert.equal(c.vérification.statut, 'vérifiée', `${e.id} : ${c.vérification.contrôles.filter(x => x.ok === false).map(x => x.libellé).join(' ; ')}`)
  }
})

// ---- Descriptions (français / anglais) -----------------------------------------------------------

const re = c => new RegExp(c.motif, c.drapeaux.replace('g', ''))
function essayer(description, attendu = {}, options = {}) {
  const r = générerRegex({ description, ...options })
  assert.ok(r.ok, `${description} : ${r.erreur}`)
  assert.ok(r.candidats.length, `${description} : aucun candidat (${r.raisons?.[0]})`)
  const c = r.candidats[0]
  if (attendu.cible) assert.equal(r.cible, attendu.cible, `${description} : cible`)
  if (attendu.motif) assert.equal(c.motif, attendu.motif, description)
  if (attendu.drapeaux !== undefined) assert.equal(c.drapeaux, attendu.drapeaux, `${description} : drapeaux`)
  const exp = re(c)
  for (const v of attendu.valides ?? []) assert.ok(exp.test(v), `${description} : ${c.littéral} devrait reconnaître ${JSON.stringify(v)}`)
  for (const v of attendu.invalides ?? []) assert.ok(!exp.test(v), `${description} : ${c.littéral} devrait refuser ${JSON.stringify(v)}`)
  if (attendu.trouvés) {
    const g = new RegExp(c.motif, c.drapeaux.includes('g') ? c.drapeaux : `${c.drapeaux}g`)
    assert.deepEqual([...attendu.trouvés[0].matchAll(g)].map(m => m[0]), attendu.trouvés[1], `${description} : extractions`)
  }
  assert.equal(c.vérification.statut, 'vérifiée', `${description} : ${c.vérification.contrôles.filter(x => x.ok === false).map(x => `${x.libellé} ${x.détail}`).join(' ; ')}`)
  return { r, c }
}

test('descriptions françaises : formats connus', () => {
  essayer('adresse e-mail valide', { cible: 'valider', valides: ['alice.martin@example.com', 'bob+x@sub.domain.fr'], invalides: ['alice@', '@example.com', 'alice example.com'] })
  essayer('Valider une adresse IPv4', { cible: 'valider', valides: ['192.168.1.10', '0.0.0.0'], invalides: ['256.1.1.1', '1.2.3'] })
  essayer('extraire les adresses email dans un texte', { cible: 'trouver', trouvés: ['Contactez a@b.fr ou c.d@e.com.', ['a@b.fr', 'c.d@e.com']] })
  essayer('toutes les adresses IP dans un log', { cible: 'trouver', trouvés: ['src=10.0.0.1 dst=8.8.8.8 port=53 ver=1.2.3', ['10.0.0.1', '8.8.8.8']] })
  essayer('date au format jj/mm/aaaa', { motif: String.raw`^(?:0[1-9]|[12]\d|3[01])/(?:0[1-9]|1[0-2])/\d{4}$`, valides: ['16/11/2024'], invalides: ['32/01/2024', '2024-11-16'] })
  essayer('date au format dd/mm/yyyy', { valides: ['01/12/1999'], invalides: ['1/12/1999'] })
  essayer('une date au format yyyy-mm-dd hh:mm:ss', { valides: ['2024-11-16 09:30:45'], invalides: ['2024-11-16 25:00:00', '2024-11-16'] })
  essayer('heure hh:mm:ss', { motif: String.raw`^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$` })
  essayer('code postal français', { valides: ['75001', '20000'], invalides: ['00100', '7500'] })
  essayer('numéro de téléphone français', { valides: ['06 12 34 56 78', '+33 6 12 34 56 78'], invalides: ['0012345678', '06 12 34 56'] })
  essayer('identifiant d\'instance EC2', { valides: ['i-0a1b2c3d4e5f60718'], invalides: ['i-xyz', 'vol-0a1b2c3d4e5f60718'] })
  essayer('extraire les ID d\'instances EC2 d\'un texte', { cible: 'trouver', trouvés: ['i-0a1b2c3d4e5f60718 et i-0a1b2c3d, pas vol-0a1b2c3d', ['i-0a1b2c3d4e5f60718', 'i-0a1b2c3d']] })
  essayer('plaque d\'immatriculation', { valides: ['AB-123-CD'], invalides: ['AI-123-CD'] })
  essayer('UUID', { valides: ['123e4567-e89b-12d3-a456-426614174000'] })
  essayer('version sémantique', { valides: ['1.2.3', '2.0.0-rc.1+exp'], invalides: ['1.2', '01.2.3'] })
  essayer('snake_case', { valides: ['ma_variable'], invalides: ['maVariable'] })
  essayer('ligne vide', { cible: 'lignes', drapeaux: 'gm', valides: ['', '   '], invalides: ['a'] })
  essayer('espaces en fin de ligne', { cible: 'lignes', valides: ['texte   '], invalides: ['texte'] })
  essayer('lignes qui ne sont pas vides', { cible: 'lignes', valides: ['a', ' # x '], invalides: ['', '  '] })
})

test('descriptions françaises : suites, quantités, classes de caractères', () => {
  essayer('3 lettres majuscules suivies d\'un tiret puis 4 chiffres', { motif: '^[A-Z]{3}-\\d{4}$', valides: ['ABC-1234'], invalides: ['AB-1234', 'abc-1234', 'ABC-123'] })
  essayer('trois chiffres puis un point puis deux chiffres', { motif: '^\\d{3}\\.\\d{2}$' })
  essayer('une lettre majuscule suivie de 2 chiffres', { motif: '^[A-Z]\\d{2}$' })
  essayer('nombre entre 1 et 3 chiffres', { motif: '^\\d{1,3}$' })
  essayer('uniquement des lettres et des chiffres de 3 à 10 caractères', { motif: '^[A-Za-z0-9]{3,10}$' })
  essayer('des lettres, des chiffres et des tirets de 4 à 12 caractères', { motif: '^[A-Za-z0-9-]{4,12}$' })
  essayer('nom d\'utilisateur de 3 à 16 caractères : lettres minuscules, chiffres et underscore', { motif: '^[a-z0-9_]{3,16}$', valides: ['jean_42'], invalides: ['Jean', 'ab'] })
  essayer('5 chiffres ou plus', { motif: '^\\d{5,}$' })
  essayer('chaîne de 6 caractères hexadécimaux', { motif: '^[0-9A-Fa-f]{6}$' })
  essayer('chiffres uniquement', { motif: '^\\d+$' })
  essayer('tout sauf des espaces', { motif: '^[^ ]+$', valides: ['abc'], invalides: ['a b'] })
  essayer('code de 2 lettres majuscules', { motif: '^[A-Z]{2}$' })
  essayer('ABC suivi de 3 chiffres', { motif: '^ABC\\d{3}$' })
  essayer('nombre à 2 décimales', { motif: String.raw`^[+-]?\d+[.,]\d{2}$`, valides: ['12.50', '3,14'], invalides: ['12', '12.5', '12.505'] })
  essayer('une URL ou une adresse IP', { valides: ['https://example.com', '192.168.0.1'], invalides: ['example'] })
  essayer('adresse IP suivie de deux-points et d\'un port', { valides: ['10.0.0.1:8080'], invalides: ['10.0.0.1:99999', '10.0.0.1'] })
})

test('descriptions françaises : conditions (commence par, finit par, contient, sans)', () => {
  essayer('mot de passe d\'au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial', {
    cible: 'valider', motif: String.raw`^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$`,
    valides: ['Abcdef1!x', 'Tr0ub4dor&3'], invalides: ['abcdefg1!', 'ABCDEFG1!', 'Abcdefgh!', 'Abcdef1x', 'Ab1!'],
  })
  essayer('au moins une majuscule et un chiffre', { valides: ['Ab1', 'xA9y'], invalides: ['abc', 'ABC', '123'] })
  essayer('lignes contenant ERROR mais pas DEBUG', { cible: 'lignes', valides: ['2024 ERROR disque plein'], invalides: ['DEBUG ERROR x', 'INFO ok'] })
  essayer('lignes contenant ERROR ou WARN', { valides: ['x WARN y', 'ERROR'], invalides: ['INFO'] })
  essayer('lignes qui commencent par #', { motif: '^#.*$', valides: ['# note'], invalides: [' # x', 'x # y'] })
  essayer('lignes commençant par ERROR ou FATAL', { valides: ['FATAL oups'], invalides: ['WARN'] })
  essayer('lignes qui ne contiennent pas le mot DEBUG', { valides: ['INFO ok'], invalides: ['DEBUG x'] })
  essayer('texte commençant par "http" et finissant par ".com"', { motif: '^http.*\\.com$', valides: ['https://example.com'], invalides: ['https://example.fr', 'ftp://x.com'] })
  essayer('adresse email se terminant par .fr', { valides: ['a@b.fr'], invalides: ['a@b.com'] })
  essayer('emails se terminant par @example.com', { cible: 'trouver', trouvés: ['a@example.com, b@other.org, c@example.com.', ['a@example.com', 'c@example.com']] })
  essayer('ligne avec une adresse email', { valides: ['écrire à alice@example.com svp'], invalides: ['aucune adresse'] })
  essayer('mot commençant par une majuscule', { valides: ['Paris'], invalides: ['paris'] })
  essayer('URL commençant par https', { valides: ['https://example.com'], invalides: ['http://example.com'] })
  essayer('le mot "foo" insensible à la casse', { cible: 'trouver', drapeaux: 'gi', trouvés: ['Foo food FOO barfoo', ['Foo', 'FOO']] })
})

test('descriptions anglaises', () => {
  essayer('validate an IPv4 address', { cible: 'valider', valides: ['10.0.0.1'], invalides: ['10.0.0'] })
  essayer('find all dates like 2024-01-31', { cible: 'trouver', trouvés: ['from 2024-01-31 to 2024-02-15.', ['2024-01-31', '2024-02-15']] })
  essayer('exactly 3 digits followed by a dash and 2 letters', { motif: '^\\d{3}-[A-Za-z]{2}$' })
  essayer('between 2 and 5 digits', { motif: '^\\d{2,5}$' })
  essayer('only letters', { motif: '^[A-Za-z]+$' })
  essayer('a word of 5 to 8 letters', { motif: '^[A-Za-z]{5,8}$' })
  essayer('starts with a capital letter followed by lowercase letters', { motif: '^[A-Z][a-z]+$', valides: ['Paris'], invalides: ['paris', 'PARIS'] })
  essayer('lines starting with # or //', { cible: 'lignes', valides: ['# x', '// y'], invalides: ['/ z', 'x #'] })
  essayer('lines containing the word timeout', { valides: ['read timeout after 30s'], invalides: ['ok'] })
  essayer('words ending with "ing"', { cible: 'trouver', trouvés: ['singing ingot running', ['singing', 'running']] })
  essayer('password at least 10 characters with an uppercase letter, a digit and a special character', { motif: String.raw`^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{10,}$` })
  essayer('starts with http and contains example', { valides: ['http://example.com'], invalides: ['https://x.com', 'http://x.com'] })
  const tel = générerRegex({ description: 'phone number' })
  assert.equal(tel.langue, 'en')
  assert.equal(tel.candidats[0].entité, 'tel_e164')
  assert.ok(tel.candidats.some(c => c.entité === 'tel_fr_nat'))
})

test('exemples : généralisation, formats reconnus, correction d\'une description', () => {
  essayer('comme AB-1234, XY-9876', { motif: '^[A-Z]{2}-\\d{4}$', valides: ['ZZ-0001'], invalides: ['A-1234'] })
  essayer('"AB-1234" "XY-9876" "ZZ-0001"', { motif: '^[A-Z]{2}-\\d{4}$' })
  essayer('AB-1234\nXY-98765\nZZ-001', { motif: '^[A-Z]{2}-\\d{3,5}$' })
  essayer('GET /api/users/42 200', { motif: String.raw`^[A-Z]{3} /[a-z]{3}/[a-z]{5}/\d{2} \d{3}$` })
  const f = générerRegex({ description: '2024-11-16' })
  assert.equal(f.candidats[0].entité, 'date_iso')
  // la description seule ne reconnaît pas « v1.2.3 » : la variante avec v facultatif passe devant
  const v = essayer('a version number like v1.2.3', { valides: ['v1.2.3', '1.2.3'], invalides: ['vv1.2.3'] })
  assert.equal(v.c.entité, 'semver_v')
  // exemples fournis à part : vérifiés, et signalés quand ils ne passent pas
  const ok = générerRegex({ description: 'adresse email', exemples: ['a@b.fr'] })
  assert.equal(ok.candidats[0].vérification.statut, 'vérifiée')
  const ko = générerRegex({ description: '3 chiffres', exemples: ['12'] })
  assert.ok(ko.candidats.some(c => c.vérification.statut === 'vérifiée' && re(c).test('12')), 'motif corrigé déduit de l\'exemple')
  assert.match(ko.candidats.at(-1).hypothèses[0] + ko.candidats[0].hypothèses[0], /Correction proposée|Cible/)
})

test('auto-vérification : motifs à assertions (satisfaisabilité) et sélectivité, libellés propres', () => {
  const mdp = générerRegex({ description: 'mot de passe d\'au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial' }).candidats[0]
  assert.doesNotMatch(mdp.titre, / ,/)
  const libellés = mdp.vérification.contrôles.map(c => c.libellé)
  assert.ok(libellés.some(l => /^Satisfaisable : 1\d\/12/.test(l) || /^Satisfaisable : \d+\/12/.test(l)), libellés.join(' | '))
  assert.ok(libellés.some(l => /^Sélectif : [1-9]/.test(l)), libellés.join(' | '))
  assert.ok(mdp.vérification.total >= 3 && mdp.vérification.statut === 'vérifiée')
  const lignes = générerRegex({ description: 'lignes contenant ERROR mais pas DEBUG' }).candidats[0]
  assert.ok(lignes.vérification.contrôles.some(c => /^Satisfaisable/.test(c.libellé) && c.ok === true))
  // un motif impossible à satisfaire n'est pas déclaré satisfaisable (contrôle non concluant, jamais vert)
  const impossible = analyserMotif({ motif: '^(?=a)b$', drapeaux: '' })
  const s2 = impossible.vérification.contrôles.find(c => /^Satisfaisable/.test(c.libellé))
  assert.notEqual(s2?.ok, true)
})

test('options : cible forcée, groupes nommés, insensible à la casse', () => {
  const t = essayer('adresse email', { cible: 'trouver' }, { cible: 'trouver' })
  assert.match(t.c.drapeaux, /g/)
  const g = essayer('adresse email', {}, { groupes: true })
  assert.equal(new RegExp(g.c.motif).exec('a@b.fr').groups.utilisateur, 'a')
  const d = essayer('date au format jj/mm/aaaa', {}, { groupes: true })
  assert.deepEqual(Object.keys(new RegExp(d.c.motif).exec('16/11/2024').groups), ['jour', 'mois', 'annee'])
  const i = essayer('3 chiffres', { drapeaux: 'i' }, { casse: true })
  assert.match(i.c.littéral, /\/i$/)
  const l = essayer('IPv4 address', { cible: 'lignes', drapeaux: 'gm' }, { cible: 'lignes' })
  assert.ok(l.c.hypothèses[0].includes('lignes'))
})

test('cas limites : description vide, incomprise, bruit seul', () => {
  assert.equal(générerRegex({ description: '' }).ok, false)
  assert.equal(générerRegex({ description: '   ' }).ok, false)
  for (const d of ['trucmuche inconnu', 'le', 'regex svp']) {
    const r = générerRegex({ description: d })
    assert.ok(r.ok)
    assert.equal(r.candidats.length, 0, d)
    assert.match(r.raisons[0], /Exemples de descriptions comprises/)
  }
})

test('chaque candidat : variantes de dialectes, explication, vérification exécutée, texte d\'essai', () => {
  const r = générerRegex({ description: 'adresse email' })
  const c = r.candidats[0]
  assert.deepEqual(Object.keys(c.variantes), ['js', 'pcre', 'python', 'ere', 'go'])
  assert.equal(c.variantes.js.pattern, c.motif)
  assert.match(c.variantes.ere.pattern, /\[0-9A-Za-z-\]|\[%\+/)
  assert.ok(c.explication.ok && c.explication.étapes.length > 3)
  assert.ok(c.vérification.contrôles.length >= 3 && c.vérification.statut === 'vérifiée')
  assert.ok(c.exemples.valides.length > 0 && c.exemples.invalides.length > 0)
  assert.match(c.exemples.texteTest, /@/)
  assert.equal(c.littéral, littéralJs(c.motif, c.drapeaux))
  const p = générerRegex({ description: 'mot de passe fort' }).candidats[0]
  assert.match(p.variantes.go.impossible, /assertions/)
  assert.match(p.variantes.ere.impossible, /assertions/)
  assert.equal(p.variantes.python.impossible, null)
})

test('motif écrit à la main : explication, conversions, erreurs', () => {
  const ok = analyserMotif({ motif: String.raw`^(?<a>\d+)-(?<b>[a-z]+)$`, drapeaux: '' })
  assert.ok(ok.ok)
  assert.equal(ok.variantes.python.pattern, String.raw`^(?P<a>\d+)-(?P<b>[a-z]+)$`)
  assert.equal(ok.variantes.ere.pattern, '^([0-9]+)-([a-z]+)$')
  assert.ok(ok.variantes.ere.avertissements.some(a => /nommés/.test(a)))
  assert.equal(ok.variantes.js.pattern, String.raw`^(?<a>\d+)-(?<b>[a-z]+)$`)
  assert.ok(ok.exemples.valides.length > 0)
  const bad = analyserMotif({ motif: '(abc', drapeaux: '' })
  assert.equal(bad.ok, false)
  assert.match(bad.erreur.message, /jamais fermée/)
  assert.equal(analyserMotif({ motif: '' }).ok, false)
  const lent = analyserMotif({ motif: String.raw`(a+)+$`, drapeaux: '' })
  assert.match(lent.risques[0].texte, /ReDoS/)
})

test('aucune valeur ressemblant à une clé ou à un jeton n\'est écrite en clair dans le catalogue', () => {
  const clé = CATALOGUE.find(e => e.id === 'cle_acces_aws')
  for (const v of clé.valides) assert.match(v, /^(AKIA|ASIA)[0-9A-Z]{16}$/)
  const jwt = CATALOGUE.find(e => e.id === 'jwt')
  assert.match(jwt.valides[0], /^eyJ/)
})
