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
import MODULE2, { COMPOSE_AGENT, PROXY_SERVICE, NGINX_CONF, DOCKERFILE_CASC, PLUGINS_TXT, CASC_YAML, COMPOSE_CASC, INSTALL_SH, OVERRIDE_CONF } from '../../src/lib/jenkins/module2.js'
import MODULE3, { BUILD_REPORT_SH } from '../../src/lib/jenkins/module3.js'
import { SCHÉMAS_IDS } from '../../src/lib/jenkins/schemas.js'

const ici = dirname(fileURLToPath(import.meta.url))
const racine = join(ici, '..', '..')
const CAPTURES = JSON.parse(readFileSync(join(racine, 'src/lib/jenkins/captures.json'), 'utf8'))
const CONTENUS = { lab0: LAB0, m1: MODULE1, m2: MODULE2, m3: MODULE3 }
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
      const vus = new Set(c.marqueurs.map(m => `${m.x}/${m.y}/${m.l}/${m.h}`))
      assert.equal(vus.size, c.marqueurs.length, `${b.id} : deux repères au même endroit`)
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

test('module 2 : fichiers cohérents entre eux et avec le labo', () => {
  // Compose du labo : contrôleur inchangé + agent WebSocket ; le service proxy s'insère avant « volumes: ».
  const doc = yaml.load(COMPOSE_AGENT)
  assert.equal(doc.services.jenkins.image, LAB.image)
  const a = doc.services['agent-1']
  assert.match(a.image, /^jenkins\/inbound-agent:[\w.-]+-jdk21$/)
  assert.equal(a.environment.JENKINS_URL, 'http://jenkins:8080')
  assert.equal(a.environment.JENKINS_AGENT_NAME, 'agent-1')
  assert.equal(a.environment.JENKINS_SECRET, '${AGENT_1_SECRET}')
  assert.equal(a.environment.JENKINS_WEB_SOCKET, 'true')
  assert.deepEqual(Object.keys(doc.volumes), ['jenkins_home', 'agent1_work'])
  const complet = yaml.load(COMPOSE_AGENT.replace('volumes:\n  jenkins_home:', `${PROXY_SERVICE}\nvolumes:\n  jenkins_home:`))
  assert.equal(complet.services.proxy.ports[0], '8443:443')
  assert.ok(complet.services.proxy.volumes.includes('./nginx/jenkins.conf:/etc/nginx/conf.d/default.conf:ro'))
  // Nginx : pas de barre finale après proxy_pass, en-têtes WebSocket et X-Forwarded-Proto.
  assert.match(NGINX_CONF, /proxy_pass\s+http:\/\/jenkins;/)
  for (const h of ['Connection', 'Upgrade', 'Host', 'X-Forwarded-Proto']) assert.ok(new RegExp(`proxy_set_header\\s+${h}\\s`).test(NGINX_CONF), h)
  // Image « production » : plugins épinglés, JCasC lu au chemin monté par Compose, secret via ${…}.
  assert.match(DOCKERFILE_CASC, new RegExp(`^FROM ${LAB.image.replace(/[.]/g, '\\.')}$`, 'm'))
  const plugins = PLUGINS_TXT.split('\n').filter(l => l && !l.startsWith('#'))
  assert.ok(plugins.length >= 5 && plugins.every(l => /^[a-z0-9-]+:[\w.-]+$/.test(l)), 'plugins.txt : id:version')
  const casc = yaml.load(CASC_YAML)
  assert.equal(casc.jenkins.numExecutors, 0)
  assert.equal(casc.jenkins.securityRealm.local.users[0].password, '${admin_password}')
  assert.equal(casc.jenkins.nodes[0].permanent.launcher, 'inbound')
  assert.equal(casc.security.contentSecurityPolicy.enforce, true)
  const cc = yaml.load(COMPOSE_CASC)
  const conf = DOCKERFILE_CASC.match(/CASC_JENKINS_CONFIG=(\S+)/)[1]
  assert.ok(cc.services.jenkins.volumes.some(v => v.endsWith(`:${conf}:ro`)), 'casc.yaml monté là où JCasC le lit')
  assert.ok(cc.services.jenkins.secrets.includes('admin_password') && cc.secrets.admin_password.file)
  // Script d'installation = commandes officielles ; override systemd valide.
  for (const l of ['set -euo pipefail', 'openjdk-21-jre', 'https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key', 'apt-get install -y jenkins']) assert.ok(INSTALL_SH.includes(l), l)
  assert.ok(INSTALL_SH.includes('\\\n'), 'continuations de ligne conservées')
  assert.match(OVERRIDE_CONF, /^\[Service\]\nEnvironment="JENKINS_PORT=8081"/)
  // Le build de démonstration tourne bien sur l'agent.
  const sortie = [...parcourir(MODULE2)].find(b => b.t === 'cmd' && /hello-jenkins → Build Now/.test(b.where)).out
  assert.ok(sortie.includes('Building remotely on agent-1 (linux)') && sortie.includes('Finished: SUCCESS'))
  assert.equal(MODULE2.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 3 : script, sorties réelles et paramètres cohérents', () => {
  const tout = [...parcourir(MODULE3)]
  // Le script lit exactement les paramètres déclarés et la variable globale du labo.
  for (const v of ['$ENVIRONMENT', '$VERSION', '$DRY_RUN', '$COMPANY', '$REPORT_API_TOKEN', '$BUILD_NUMBER', '$NODE_NAME', '$WORKSPACE']) assert.ok(BUILD_REPORT_SH.includes(v), v)
  assert.match(BUILD_REPORT_SH, /^#!\/bin\/sh -e\n/)
  // La sortie réelle du build #1 correspond au script : secret masqué, variable globale, artefact.
  const s1 = tout.find(b => b.t === 'cmd' && /build-report #1/.test(b.where)).out
  for (const l of ['Environment : dev', 'Company     : Acme Corp', 'Token value : ****', 'Dry run: report-dev-1.0.0.txt generated, nothing published', 'Archiving artifacts', 'Finished: SUCCESS']) assert.ok(s1.includes(l), l)
  assert.ok(!/demo-token-not-a-real-secret/.test(JSON.stringify(MODULE3)), 'la valeur du secret de démonstration n\'apparaît jamais')
  // Échec et interruption réels.
  assert.ok(tout.some(b => b.t === 'cmd' && b.out?.includes("Invalid VERSION '1.x'") && b.out.includes('Finished: FAILURE')))
  assert.ok(tout.some(b => b.t === 'cmd' && b.out?.includes('Aborted by Lab Admin') && b.out.includes('Finished: ABORTED')))
  assert.equal(MODULE3.find(b => b.t === 'quiz').questions.length, 10)
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
