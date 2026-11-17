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
import MODULE4, { JF1, JF2, JF3, JF4, JF5, JF_SCRIPTED, JF_BROKEN_A, JF_BROKEN_B, JF_FIXED } from '../../src/lib/jenkins/module4.js'
import MODULE5, { COMPOSE_GITEA, JF_INVENTORY, BUILD_SH, TEST_SH } from '../../src/lib/jenkins/module5.js'
import MODULE6, { AGENT_DOCKERFILE, COMPOSE_AGENT_BUILD, POM_XML, CI_SETTINGS, JF_API, JF_WEB, JF_PY, PACKAGE_JSON, OSV_TOML, REQUIREMENTS, REQUIREMENTS_V1 } from '../../src/lib/jenkins/module6.js'
import MODULE7, { COMPOSE_DOCKER, COMPOSE_AGENT1, DOCKERFILE_AGENT_EXTRAIT, DOCKERFILE, JF_SERVICE, DSL_EXTRAIT, DOCKER_CLEANUP } from '../../src/lib/jenkins/module7.js'
import CONTENU_BASES, { BASICS_FAIL } from '../../src/lib/jenkins/basics.js'
import { PLAN_BASES, DURÉE_TOTALE, durée } from '../../src/lib/jenkins/basics-plan.js'
import { SCHÉMAS_IDS } from '../../src/lib/jenkins/schemas.js'

const ici = dirname(fileURLToPath(import.meta.url))
const racine = join(ici, '..', '..')
const CAPTURES = JSON.parse(readFileSync(join(racine, 'src/lib/jenkins/captures.json'), 'utf8'))
const CONTENUS = { lab0: LAB0, m1: MODULE1, m2: MODULE2, m3: MODULE3, m4: MODULE4, m5: MODULE5, m6: MODULE6, m7: MODULE7, basics: PLAN_BASES.flatMap(l => CONTENU_BASES[l.id]) }
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

test('module 4 : chaque Jenkinsfile et sa sortie réelle concordent', () => {
  const tout = [...parcourir(MODULE4)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // Accolades équilibrées dans les Jenkinsfiles valides, déséquilibrées dans la version B cassée.
  const équilibre = s => [...s.replace(/'[^'\n]*'|"[^"\n]*"/g, '')].reduce((n, c) => n + (c === '{') - (c === '}'), 0)
  for (const jf of [JF1, JF2, JF3, JF4, JF5, JF_SCRIPTED, JF_FIXED]) assert.equal(équilibre(jf), 0)
  for (const jf of [JF1, JF2, JF3, JF4, JF5, JF_BROKEN_A, JF_BROKEN_B, JF_FIXED]) assert.match(jf, /^(\/\/.*\n)?pipeline \{/)
  assert.match(JF_SCRIPTED, /\nnode\('linux'\) \{/)
  // Chaque étape déclarée apparaît dans la sortie réelle correspondante.
  const étapes = jf => [...jf.matchAll(/stage\('([^']+)'\)/g)].map(m => m[1])
  const s1 = sortie(/pipeline-basics #2/)
  for (const é of étapes(JF1)) assert.ok(s1.includes(`{ (${é})`), é)
  assert.ok(s1.includes('Archiving artifacts') && s1.endsWith('Finished: SUCCESS'))
  const s2 = sortie(/pipeline-variables #1/)
  assert.ok(s2.includes('Warning: A secret was passed to "sh" using Groovy String interpolation') && s2.includes('Token: ****'))
  assert.ok(!JSON.stringify(MODULE4).includes('demo-token-not-a-real-secret'))
  assert.ok(sortie(/pipeline-parameters #2/).includes('Stage "Approval" skipped due to when conditional'))
  assert.ok(sortie(/pipeline-parameters #3/).includes('Approved by Lab Admin'))
  assert.ok(sortie(/pipeline-parameters #4/).includes("VERSION must look like 1.2.3, got '1.x'"))
  const s4 = sortie(/pipeline-parallel #1/)
  for (const l of ['Setting overall build result to UNSTABLE', 'Retrying', 'Cancelling nested steps due to timeout', 'finally: this always runs.']) assert.ok(s4.includes(l), l)
  assert.ok(sortie(/pipeline-artifacts #2/).includes('Recording test results'))
  assert.ok(sortie(/version A/).includes('Unknown stage section "sh"'))
  assert.ok(sortie(/version B/).includes("expecting anything but ''\\n''; got it anyway"))
  assert.equal(MODULE4.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 5 : Gitea, Jenkinsfile GitFlow et sorties réelles concordent', () => {
  const tout = [...parcourir(MODULE5)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  const g = yaml.load(COMPOSE_GITEA).gitea
  assert.match(g.image, /^docker\.gitea\.com\/gitea:\d+\.\d+\.\d+$/)
  assert.equal(g.environment.GITEA__security__ALLOWED_HOST_LIST, 'private')
  assert.ok(!('GITEA__webhook__ALLOWED_HOST_LIST' in g.environment), 'ancienne option dépréciée absente')
  // Le Jenkinsfile GitFlow : une condition par type de branche, et les scripts qu'il appelle.
  for (const s of ["branch 'develop'", "branch pattern: 'release/.*', comparator: 'REGEXP'", "branch 'main'", 'changeRequest()', './scripts/build.sh', './scripts/test.sh']) assert.ok(JF_INVENTORY.includes(s), s)
  assert.ok(BUILD_SH.includes('cat VERSION') && TEST_SH.includes('grep -q'))
  // Chaque branche exécute sa propre étape dans les journaux réels.
  assert.ok(sortie(/develop #2/).includes('Push event to branch develop') && sortie(/develop #2/).includes('Deploying develop to staging'))
  assert.ok(sortie(/release\/1\.1 #1/).includes('Building a release candidate from release/1.1'))
  assert.ok(sortie(/PR-1 #1/).includes('Merging remotes/origin/develop'))
  assert.ok(sortie(/PR-1 #2/).includes('cat: VERSION: No such file or directory'))
  assert.ok(sortie(/Scan Multibranch/).includes('Scheduled build for branch: PR-1'))
  assert.ok(sortie(/inventory-main #1/).includes('Branch: null'))
  // Les URL de webhook annoncées sont celles des documentations des plugins.
  const t = JSON.stringify(MODULE5)
  for (const u of ['/github-webhook/', '/gitlab-webhook/post', '/project/<job>', '/gitea-webhook/post']) assert.ok(t.includes(u), u)
  assert.equal(MODULE5.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 6 : image d’agent, Jenkinsfiles, publication et sorties réelles concordent', () => {
  const tout = [...parcourir(MODULE6)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // L’image de l’agent : versions épinglées, somme de contrôle de Node.js, utilisateur non privilégié.
  assert.match(AGENT_DOCKERFILE, /^FROM jenkins\/inbound-agent:\S+-jdk21$/m)
  for (const s of ['libatomic1', 'sha256sum -c', 'ARG NODE_VERSION=26.', 'ARG OSV_VERSION=']) assert.ok(AGENT_DOCKERFILE.includes(s), s)
  assert.match(AGENT_DOCKERFILE.trim().split('\n').at(-1), /^USER jenkins$/)
  assert.ok(COMPOSE_AGENT_BUILD.includes('build: ./agent'))
  // Les versions affichées par l’agent sont celles de l’image.
  const outils = sortie(/in ~\/jenkins-lab/)
  assert.ok(outils.includes('v' + AGENT_DOCKERFILE.match(/NODE_VERSION=(\S+)/)[1]) && outils.includes('osv-scanner version: ' + AGENT_DOCKERFILE.match(/OSV_VERSION=(\S+)/)[1]))
  // Les trois Jenkinsfiles : mêmes étapes de rapport, quality gates, versions par build, accolades équilibrées.
  for (const jf of [JF_API, JF_WEB, JF_PY]) {
    for (const s of ["junit '", 'recordCoverage(', 'recordIssues(', "criticality: 'UNSTABLE'", "catchError(buildResult: 'UNSTABLE'", 'osv-scanner scan source --lockfile', 'archiveArtifacts', 'fingerprint: true']) assert.ok(jf.includes(s), s)
    assert.equal((jf.match(/\{/g) || []).length, (jf.match(/\}/g) || []).length)
  }
  assert.ok(JF_API.includes('VERSION = "1.0.${env.BUILD_NUMBER}"') && JF_API.includes("when { branch 'main' }"))
  assert.ok(JF_PY.includes('rm -f flake8.txt'), 'le rapport périmé est supprimé')
  assert.ok(JSON.parse(PACKAGE_JSON).scripts.test.startsWith('mkdir -p test-results'), 'le dossier du rapport junit est créé')
  // Publication : aucun secret dans le dépôt, l’id du serveur relie settings et pom.
  assert.ok(CI_SETTINGS.includes('${env.REPO_TOKEN}') && JF_API.includes("passwordVariable: 'REPO_TOKEN'"))
  assert.ok(POM_XML.includes('<id>gitea</id>') && CI_SETTINGS.includes('<id>gitea</id>') && POM_XML.includes('flatten-maven-plugin'))
  assert.ok(OSV_TOML.includes('effectiveUntil') && !OSV_TOML.includes('ignoreUntil'))
  assert.equal(REQUIREMENTS_V1.trim(), 'requests==2.31.0')
  assert.equal(REQUIREMENTS.split('\n').filter(l => /==/.test(l)).length, 5)
  // Les journaux réels racontent bien l’histoire du module.
  assert.ok(sortie(/main #1 → /).includes('Failed to retrieve skin artifact'))
  assert.ok(sortie(/stock-api » main #2/).includes('Actual value: 1, Quality gate: 1.00') && sortie(/stock-api » main #2/).includes('Finished: UNSTABLE'))
  assert.ok(sortie(/stock-api » main #3/).includes('Line Coverage: 93.33% (14/15)'))
  assert.ok(sortie(/restock-rule #1/).includes('Finished: FAILURE') && sortie(/restock-rule #2/).includes('Finished: UNSTABLE'))
  assert.ok(sortie(/feature\/coverage-gate #1/).includes('Actual value: 89.47%, Quality gate: 95.00'))
  assert.ok(sortie(/stock-py » main #2/).includes('certifi | 2026.7.22') && sortie(/stock-py » main #3/).includes('found 5 packages'))
  assert.ok(sortie(/main #5/).includes('Uploaded to gitea') && sortie(/main #5/).includes('Masking supported pattern matches of $REPO_TOKEN'))
  assert.ok(sortie(/token in REPO_TOKEN/).includes('409 Conflict'))
  assert.ok(sortie(/old flake8.txt/).includes('exit code: 0') && sortie(/old flake8.txt/).includes("F401 'os' imported but unused"))
  // Aucun jeton réel ne figure dans le contenu.
  assert.ok(!/(?<![0-9a-f])[0-9a-f]{40}(?![0-9a-f])/.test(JSON.stringify(MODULE6)), 'pas de jeton de 40 caractères hexadécimaux')
  assert.equal(MODULE6.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 7 : démon Docker TLS, Dockerfile, pipeline d’image et sorties réelles concordent', () => {
  const tout = [...parcourir(MODULE7)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // Le démon : dind épinglé, TLS, volume de l’espace de travail partagé avec l’agent.
  const d = yaml.load(COMPOSE_DOCKER).docker
  assert.match(d.image, /^docker:\d+\.\d+\.\d+-dind$/)
  assert.equal(d.privileged, true)
  assert.equal(d.environment.DOCKER_TLS_CERTDIR, '/certs')
  assert.ok(d.volumes.includes('agent1_work:/home/jenkins/agent'))
  const a = yaml.load(COMPOSE_AGENT1)['agent-1']
  assert.equal(a.environment.DOCKER_HOST, 'tcp://docker:2376')
  assert.equal(a.environment.DOCKER_TLS_VERIFY, '1')
  assert.ok(a.volumes.includes('docker_certs:/certs/client:ro') && a.depends_on.includes('docker'))
  // CLI de l’agent et version du serveur : la même version partout.
  const v = d.image.match(/docker:([\d.]+)-dind/)[1]
  assert.ok(DOCKERFILE_AGENT_EXTRAIT.includes(`docker:${v}-cli`))
  assert.ok(sortie(/in ~\/jenkins-lab/).includes(`Client: ${v}  Server: ${v}`))
  // Le Dockerfile de l’image : base épinglée, utilisateur non root, contrôle de santé.
  assert.match(DOCKERFILE, /^FROM node:\d+\.\d+\.\d+-alpine\d+\.\d+$/m)
  for (const s of ['USER node', 'HEALTHCHECK', 'CMD ["node", "src/server.js"]']) assert.ok(DOCKERFILE.includes(s), s)
  // Le Jenkinsfile final : corrections réelles appliquées.
  for (const s of ["agent { label 'docker' }", 'disableConcurrentBuilds()', "docker { image 'node:", 'git rev-parse --short=7 HEAD', 'cid=$(docker run -d', "trap 'docker rm -f $cid", '--password-stdin', 'DOCKER_CONFIG="$WORKSPACE_TMP/docker-config"', "when { branch 'main' }", 'curl -fsS http://docker:8090/health']) assert.ok(JF_SERVICE.includes(s), s)
  for (const interdit of ['${GIT_COMMIT:0:7}', '--name stock-service-ci-', 'docker login -p', ' -p $']) assert.ok(!JF_SERVICE.includes(interdit), interdit)
  assert.equal((JF_SERVICE.match(/\{/g) || []).length, (JF_SERVICE.match(/\}/g) || []).length)
  assert.ok(DSL_EXTRAIT.includes('docker.build(') && DSL_EXTRAIT.includes('docker.withRegistry(') && DSL_EXTRAIT.includes('image.inside'))
  assert.ok(DOCKER_CLEANUP.includes('${UNTIL:-168h}') && DOCKER_CLEANUP.includes("cron('H 3 * * 0')"))
  // Les journaux réels racontent l’histoire du module.
  assert.ok(sortie(/main #1 →/).includes('Bad substitution') && sortie(/main #1 →/).includes('seems to be running inside container'))
  assert.ok(sortie(/main #2 →/).includes("stored unencrypted in '/home/jenkins/.docker/config.json'"))
  assert.ok(sortie(/main #3 →/).includes('Using --password via the CLI is insecure'))
  const final = sortie(/main #7 →/)
  assert.ok(final.includes('health: healthy') && final.includes('{"status":"UP","version":"1.0.7"}') && final.includes('Finished: SUCCESS'))
  const digests = new Set([...final.matchAll(/(?:1\.0\.7|sha-[0-9a-f]{7}|latest): digest: (sha256:[0-9a-f]{64})/g)].map(m => m[1]))
  assert.equal(digests.size, 1, 'les trois étiquettes désignent la même image')
  assert.ok(sortie(/docker-dsl #1/).includes('is already in use') && sortie(/wrong-port #1/).includes('no such object'))
  assert.ok(sortie(/docker-cleanup #1/).includes('value is empty'))
  assert.ok(sortie(/without --insecure-registry/).includes('http: server gave HTTP response to HTTPS client'))
  // Aucun jeton : les seules empreintes de 40 caractères sont des commits Git (projet, buildx).
  const texte = JSON.stringify(MODULE7).replace(/(revision=|Revision |checkout -f |rev-list --no-walk |buildx v[\d.]+ )[0-9a-f]{40}/g, '')
  assert.ok(!/(?<![0-9a-f])[0-9a-f]{40}(?![0-9a-f])/.test(texte), 'pas de jeton de 40 caractères hexadécimaux')
  assert.equal(MODULE7.find(b => b.t === 'quiz').questions.length, 10)
})

test('jenkins basics : 2 h au plus, blocs repris des modules, pipelines du Lab 0 exécutés pour de vrai', () => {
  assert.ok(DURÉE_TOTALE <= 120, `durée totale ${DURÉE_TOTALE} min`)
  assert.equal(durée(DURÉE_TOTALE), '2 h')
  assert.deepEqual(Object.keys(CONTENU_BASES), PLAN_BASES.map(l => l.id))
  const tout = [...parcourir(PLAN_BASES.flatMap(l => CONTENU_BASES[l.id]))]
  // Chaque leçon a un titre et un visuel (capture réelle ou schéma) ; le bilan a quiz, checklist et récap.
  for (const l of PLAN_BASES.slice(0, -1)) {
    assert.ok(CONTENU_BASES[l.id].some(x => x.t === 'h'), `${l.id} : titre`)
    assert.ok(CONTENU_BASES[l.id].some(x => x.t === 'shot' || x.t === 'diagram'), `${l.id} : visuel`)
  }
  for (const t of ['quiz', 'checklist', 'recap']) assert.ok(CONTENU_BASES.b9.some(x => x.t === t), t)
  // Les blocs repris sont les objets mêmes des modules (pas des copies à la main).
  const sources = new Set([LAB0, MODULE1, MODULE3, MODULE4, MODULE5].flatMap(m => [...parcourir(m)]))
  assert.ok(tout.filter(b => sources.has(b)).length >= 25, 'au moins 25 blocs repris tels quels')
  // Tout ce qui se lance tourne sur un Jenkins de Lab 0 : agent any, jamais un label d’agent.
  const pipelines = tout.filter(x => x.t === 'code' && /pipeline \{/.test(x.code))
  assert.equal(pipelines.length, 4)
  for (const b of pipelines) assert.ok(/agent any/.test(b.code) && !/label '/.test(b.code), b.file)
  // Le pipeline cassé ne diffère de celui du Module 1 que par la ligne du test.
  const diff = BASICS_FAIL.split('\n').filter((l, i) => l !== JENKINSFILE_HELLO.split('\n')[i])
  assert.equal(diff.length, 1)
  assert.match(diff[0], /test -s release-notes\.txt/)
  // Les sorties réelles des pipelines propres à la formation : nœud intégré et résultats annoncés.
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  for (const m of [/failing test/, /basics-tests #1/, /basics-secret #1/]) {
    assert.ok(sortie(m).includes('Running on Jenkins in /var/jenkins_home/workspace/'), String(m))
    assert.ok(!/\[Pipeline\]|\[Gitea\]/.test(sortie(m)), String(m))
  }
  assert.ok(sortie(/failing test/).includes('Stage "Package" skipped due to earlier failure(s)') && sortie(/failing test/).endsWith('Finished: FAILURE'))
  assert.ok(sortie(/basics-tests #1/).includes('Recording test results') && sortie(/basics-tests #1/).endsWith('Finished: UNSTABLE'))
  assert.ok(sortie(/basics-secret #1/).includes('Token: ****') && sortie(/basics-secret #1/).includes('Masking supported pattern matches of $API_TOKEN'))
  assert.ok(sortie(/Freestyle job/).includes("Build step 'Execute shell' marked build as failure"))
  // Les renvois internes des blocs repris pointent vers les leçons, pas vers des sections d’autres modules.
  const textes = JSON.stringify(tout.filter(b => b.t !== 'table'))
  for (const renvoi of ['(Module 1)', 'line 39', 'Lab 1.2', 'section 4.8']) assert.ok(!textes.includes(renvoi), renvoi)
  assert.equal(CONTENU_BASES.b9.find(b => b.t === 'quiz').questions.length, 10)
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
