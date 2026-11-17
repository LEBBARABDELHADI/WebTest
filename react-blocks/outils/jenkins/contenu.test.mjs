// Intégrité de la formation « Learning Jenkins » : captures réelles présentes et repérées,
// schémas existants, blocs valides, code cohérent, quiz et checklists corrects, contenu en anglais.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { PLAN, LAB } from '../../src/lib/jenkins/plan.js'
import { LAB0, COMPOSE, SCRIPT_SHELL } from '../../src/lib/jenkins/lab0.js'
import { MODULE1, JENKINSFILE_HELLO } from '../../src/lib/jenkins/module1.js'
import { SCHÉMAS_IDS } from '../../src/lib/jenkins/schemas.js'

const ici = dirname(fileURLToPath(import.meta.url))
const racine = join(ici, '..', '..')
const CAPTURES = JSON.parse(readFileSync(join(racine, 'src/lib/jenkins/captures.json'), 'utf8'))
const CONTENUS = { lab0: LAB0, m1: MODULE1 }
const TYPES = new Set(['objectives', 'h', 'h3', 'p', 'ul', 'ol', 'table', 'code', 'cmd', 'shot', 'diagram', 'callout', 'errors', 'lab', 'exercise', 'checklist', 'quiz', 'recap'])

// Tous les blocs, y compris ceux des TP et exercices (étapes et corrigés).
function* parcourir(blocs) {
  for (const b of blocs) {
    yield b
    for (const champ of ['étapes', 'solution', 'énoncé']) if (Array.isArray(b[champ])) yield* parcourir(b[champ])
  }
}
const tous = Object.fromEntries(Object.entries(CONTENUS).map(([k, v]) => [k, [...parcourir(v)]]))

test('plan : 13 modules + Lab 0, les modules disponibles ont un contenu', () => {
  assert.equal(PLAN.length, 14)
  assert.deepEqual(PLAN.map(m => m.num).slice(1), Array.from({ length: 13 }, (_, i) => `Module ${i + 1}`))
  for (const m of PLAN) {
    assert.ok(m.objectifs.length && m.sujets.length && m.tp.length && m.résumé, m.id)
    assert.equal(!!CONTENUS[m.id], !!m.disponible, `${m.id} : contenu ⇔ disponible`)
  }
})

test('captures : chaque capture citée existe, avec son image et des repères valides', () => {
  const citées = new Set()
  for (const [id, blocs] of Object.entries(tous)) {
    for (const b of blocs.filter(x => x.t === 'shot')) {
      citées.add(b.id)
      const c = CAPTURES[b.id]
      assert.ok(c, `${id} : capture ${b.id} absente du manifeste`)
      const fichier = join(racine, 'public/jenkins', c.fichier)
      assert.ok(existsSync(fichier) && statSync(fichier).size > 20000, `${b.id} : image absente ou vide`)
      assert.ok(b.titre && b.ce && b.éléments.length && b.actions.length && b.résultat, `${b.id} : titre, explication, éléments, actions et résultat attendus`)
      assert.ok(c.marqueurs.length <= b.éléments.length, `${b.id} : plus de repères que d'éléments décrits`)
      c.marqueurs.forEach((m, i) => {
        assert.equal(m.n, i + 1, `${b.id} : repères numérotés de 1 à n`)
        assert.ok(m.x >= 0 && m.y >= 0 && m.l > 0 && m.h > 0 && m.x + m.l <= 100.01 && m.y + m.h <= 100.01, `${b.id} : repère ${m.n} hors de l'image`)
      })
    }
  }
  assert.ok(citées.size >= 20, `${citées.size} captures citées`)
  for (const id of Object.keys(CAPTURES)) assert.ok(citées.has(id), `capture ${id} jamais utilisée`)
})

test('schémas : chaque schéma cité est dessiné', () => {
  const source = readFileSync(join(racine, 'src/components/jenkins/Schemas.jsx'), 'utf8')
  const dessinés = /const SCHÉMAS = \{([^}]+)\}/.exec(source)[1].split(',').map(x => x.split(':')[0].trim().replace(/'/g, ''))
  assert.deepEqual([...dessinés].sort(), [...SCHÉMAS_IDS].sort())
  for (const blocs of Object.values(tous)) for (const b of blocs.filter(x => x.t === 'diagram')) assert.ok(SCHÉMAS_IDS.includes(b.id), b.id)
})

test('blocs : types connus, titres uniques, explications de code dans les bornes', () => {
  const ids = new Set()
  for (const [id, blocs] of Object.entries(tous)) {
    for (const b of blocs) {
      assert.ok(TYPES.has(b.t), `${id} : type inconnu ${b.t}`)
      if (b.t === 'h') { assert.ok(!ids.has(b.id), `titre en double ${b.id}`); ids.add(b.id) }
      if (b.t === 'code') {
        const n = b.code.replace(/\n$/, '').split('\n').length
        for (const [l] of b.lignes ?? []) assert.ok(l >= 1 && l <= n, `${id} : ligne ${l} hors du code (${n} lignes) dans ${b.file}`)
        assert.ok(b.file, `${id} : emplacement du fichier manquant`)
      }
      if (b.t === 'table') for (const r of b.rows) assert.equal(r.length, b.head.length, `${id} : tableau irrégulier`)
      if (b.t === 'lab') assert.ok(b.étapes.length >= 3 && b.solution.length >= 1, `${id} : TP sans étapes ou sans corrigé`)
      if (b.t === 'exercise') assert.ok(b.énoncé.length && b.solution.length, `${id} : exercice sans corrigé`)
      if (b.t === 'errors') for (const r of b.rows) assert.equal(r.length, 3, `${id} : erreur = symptôme, cause, solution`)
      if (b.t === 'quiz') for (const q of b.questions) assert.ok(q.bonne >= 0 && q.bonne < q.choix.length && q.pourquoi, `${id} : question mal formée`)
      if (b.t === 'cmd') assert.ok(b.where && (b.cmd || b.out), `${id} : commande vide`)
    }
    const top = CONTENUS[id]
    for (const t of ['objectives', 'checklist', 'recap']) assert.ok(top.some(b => b.t === t), `${id} : ${t} manquant`)
  }
})

test('lab 0 : le docker-compose.yml est valide et cohérent avec l\'environnement des captures', () => {
  const doc = yaml.load(COMPOSE)
  const j = doc.services.jenkins
  assert.equal(j.image, LAB.image)
  assert.deepEqual(j.ports, ['8080:8080', '50000:50000'])
  assert.deepEqual(j.volumes, ['jenkins_home:/var/jenkins_home'])
  assert.ok('jenkins_home' in doc.volumes)
  assert.ok(SCRIPT_SHELL.includes('$BUILD_NUMBER') && SCRIPT_SHELL.includes('build-info.txt'))
  // La sortie console montrée correspond au script (chaque commande échoée par sh -x).
  const console1 = LAB0.find(b => b.t === 'cmd' && /Console Output/.test(b.where)).out
  for (const l of ['+ echo Hello from Jenkins!', 'Node: built-in', 'Finished: SUCCESS']) assert.ok(console1.includes(l), l)
})

test('module 1 : le pipeline de démonstration et sa sortie réelle concordent', () => {
  for (const s of ["stage('Build')", "stage('Test')", "stage('Package')", 'archiveArtifacts', 'post {']) assert.ok(JENKINSFILE_HELLO.includes(s), s)
  const lab = MODULE1.find(b => b.t === 'lab' && b.id === 'lab12')
  const sortie = lab.étapes.find(b => b.t === 'cmd').out
  for (const s of ['{ (Build)', '{ (Test)', '{ (Package)', 'Archiving artifacts', 'Pipeline finished: the artifact is archived.', 'Finished: SUCCESS']) assert.ok(sortie.includes(s), s)
  const quiz = MODULE1.find(b => b.t === 'quiz')
  assert.equal(quiz.questions.length, 10)
})

test('langue : le contenu pédagogique est en anglais', () => {
  const textes = []
  const prendre = v => { if (typeof v === 'string') textes.push(v); else if (Array.isArray(v)) v.forEach(prendre); else if (v && typeof v === 'object') Object.values(v).forEach(prendre) }
  for (const blocs of Object.values(tous)) for (const b of blocs) if (!['code', 'cmd'].includes(b.t)) prendre({ ...b, étapes: undefined, solution: undefined, énoncé: undefined })
  const français = /\b(le|la|les|des|une|est|sont|avec|pour|dans|vous|nous)\b/i
  const suspects = textes.filter(t => français.test(t.replace(/`[^`]*`/g, '')))
  assert.deepEqual(suspects, [])
  assert.ok(textes.length > 400)
})
