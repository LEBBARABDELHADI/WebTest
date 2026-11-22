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
import MODULE8, { KIND_CLUSTER, RBAC_YAML, JF_K8S_HELLO, DEPLOYMENT_YAML, JF_DEPLOY_MANIFESTS, JF_DEPLOY_HELM, JF_DEPLOY_HELM_STAGE, VALUES_YAML, TPL_DEPLOYMENT, TPL_SERVICE } from '../../src/lib/jenkins/module8.js'
import MODULE9, { COMPOSE_WEB1, DEPLOY_WEB1, SAFE_PIPELINE, LEAKY_PIPELINE, USE_TEAM_TOKEN, SANDBOX_DEMO } from '../../src/lib/jenkins/module9.js'
import MODULE10, { SITE_YML, JENKINSFILE_ANSIBLE, TF_MAIN, TERRAFORM_RBAC, JENKINSFILE_TERRAFORM, JENKINSFILE_SONAR, JENKINSFILE_NEXUS, CI_SETTINGS as CI_SETTINGS_M10, PROMETHEUS_YML } from '../../src/lib/jenkins/module10.js'
import MODULE11, { JENKINSFILE_E2E_JAVA, JENKINSFILE_E2E_DOCKER, HOST_VARS_APP2 } from '../../src/lib/jenkins/module11.js'
import MODULE12, { JENKINSFILE_MAINTENANCE, JENKINSFILE_BACKUP, COMPOSE_OPS1 } from '../../src/lib/jenkins/module12.js'
import MODULE13, { JENKINSFILE_CAPSTONE, ANSIBLE_CAPSTONE_PROXY, APP_JAVA, DOCKERFILE_CAPSTONE } from '../../src/lib/jenkins/module13.js'
import CONTENU_BASES, { BASICS_FAIL } from '../../src/lib/jenkins/basics.js'
import { PLAN_BASES, DURÉE_TOTALE, durée } from '../../src/lib/jenkins/basics-plan.js'
import { SCHÉMAS_IDS } from '../../src/lib/jenkins/schemas.js'

const ici = dirname(fileURLToPath(import.meta.url))
const racine = join(ici, '..', '..')
const CAPTURES = JSON.parse(readFileSync(join(racine, 'src/lib/jenkins/captures.json'), 'utf8'))
const CONTENUS = { lab0: LAB0, m1: MODULE1, m2: MODULE2, m3: MODULE3, m4: MODULE4, m5: MODULE5, m6: MODULE6, m7: MODULE7, m8: MODULE8, m9: MODULE9, m10: MODULE10, m11: MODULE11, m12: MODULE12, m13: MODULE13, basics: PLAN_BASES.flatMap(l => CONTENU_BASES[l.id]) }
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

test('module 8 : cluster kind, RBAC minimal, pods agents, manifestes, Helm et mesures réelles concordent', () => {
  const tout = [...parcourir(MODULE8)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // Le cluster : un nœud, le port 30080 publié, containerd lit certs.d (registre HTTP de Gitea).
  const kc = yaml.load(KIND_CLUSTER)
  assert.equal(kc.name, 'lab')
  assert.equal(kc.nodes[0].extraPortMappings[0].hostPort, 30080)
  assert.ok(KIND_CLUSTER.includes('config_path = "/etc/containerd/certs.d"'))
  assert.ok(!/failCgroupV1|restrict_oom_score_adj/.test(KIND_CLUSTER), 'aucun correctif du bac à sable dans la formation')
  // RBAC : jenkins gère les pods de jenkins-agents ; deployer a le rôle edit dans stock seulement.
  const docs = yaml.loadAll(RBAC_YAML)
  const lien = docs.find(d => d.kind === 'RoleBinding' && d.metadata.name === 'deployer-edit')
  assert.equal(lien.metadata.namespace, 'stock')
  assert.deepEqual([lien.roleRef.kind, lien.roleRef.name], ['ClusterRole', 'edit'])
  const rôle = docs.find(d => d.kind === 'Role' && d.metadata.name === 'pod-agents')
  assert.ok(rôle.rules[0].resources.includes('pods') && !docs.some(d => d.kind === 'ClusterRoleBinding'))
  assert.equal(sortie(/check the rights/).match(/^(yes|no)$/gm).join(','), 'yes,no,yes,no,no')
  // Pods agents et déploiement : pod en sh, compte deployer, garde-fou, attente du rollout, retour arrière.
  assert.ok(JF_K8S_HELLO.includes("container('node')"))
  for (const s of ["serviceAccountName: deployer", "defaultContainer 'k8s'", '[ -n "$VERSION" ]', "envsubst '$VERSION'", 'rollout status', 'rollout undo', 'curl -fsS http://stock-service.stock.svc/health']) assert.ok(JF_DEPLOY_MANIFESTS.includes(s), s)
  assert.ok(!/defaultContainer 'k8s' +#/.test(JF_DEPLOY_MANIFESTS), 'commentaire Groovy corrigé')
  const dep = yaml.load(DEPLOYMENT_YAML)
  const c = dep.spec.template.spec.containers[0]
  assert.equal(dep.spec.strategy.rollingUpdate.maxUnavailable, 0)
  assert.equal(c.securityContext.runAsUser, 1000)
  assert.equal(c.lifecycle.preStop.sleep.seconds, 5)
  assert.ok(c.readinessProbe && c.livenessProbe)
  // Helm : une seule commande idempotente, retour arrière automatique ; le chart sépare stable et canary.
  assert.ok(JF_DEPLOY_HELM.includes(JF_DEPLOY_HELM_STAGE.trim().split('\n')[3].trim()))
  assert.ok(JF_DEPLOY_HELM_STAGE.includes('helm upgrade --install') && JF_DEPLOY_HELM_STAGE.includes('--rollback-on-failure'))
  assert.equal(yaml.load(VALUES_YAML).service.nodePort, 30080)
  assert.ok(TPL_DEPLOYMENT.includes('track: {{ .Values.track }}') && TPL_SERVICE.includes('{{- if .Values.service.enabled }}'))
  // Les mesures et journaux réels racontent l’histoire du module.
  assert.ok(sortie(/k8s-hello #2/).includes('Created Pod: kind-lab jenkins-agents/') && sortie(/k8s-hello #2/).includes('Finished: SUCCESS'))
  assert.ok(sortie(/why are the pods/).includes('non-numeric user (node)'))
  assert.match(sortie(/no preStop/), /5 000\n +371 200/)
  assert.match(sortie(/with preStop/), /422 200\n/)
  assert.ok(!sortie(/with preStop/).includes(' 000'))
  assert.ok(sortie(/stock-deploy #8 →/).includes('rolled back') && sortie(/45 s after/).includes('ErrImagePull'))
  assert.ok(sortie(/stock-deploy #9/).includes('invalid ownership metadata'))
  assert.ok(sortie(/stock-deploy #11/).includes('has been rolled back due to rollback-on-failure'))
  assert.match(sortie(/stock-deploy #10/), /REVISION: 1/)
  const canary = sortie(/in lab\/stock-deploy/)
  const [stable, nouveau] = [canary.match(/(\d+) \{"status":"UP","version":"1\.0\.6"\}/)[1], canary.match(/(\d+) \{"status":"UP","version":"1\.0\.7"\}/)[1]].map(Number)
  assert.equal(stable + nouveau, 200)
  assert.ok(nouveau > 20 && nouveau < 80, `part du canary ${nouveau}/200`)
  assert.ok(sortie(/k8s-hello #1/).includes('http://localhost:8080/login is not ready'))
  assert.ok(tout.find(b => b.t === 'cmd' && b.cmd.includes('create deployment essai')).out.includes('is forbidden'))
  assert.equal(MODULE8.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 9 : SSH avec clé d’hôte, jetons, limites du masquage, dossiers et sandbox concordent', () => {
  const tout = [...parcourir(MODULE9)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // La cible SSH : image officielle épinglée, clé publique lue dans .env (jamais de clé privée dans le contenu).
  assert.match(yaml.load(COMPOSE_WEB1)['web-1'].image, /^jenkins\/ssh-agent:\d+\.\d+\.\d+-jdk21$/)
  assert.ok(!/PRIVATE KEY/.test(JSON.stringify(MODULE9).replace(/BEGIN\/END/g, '')), 'aucune clé privée')
  // Le déploiement : clé d’hôte épinglée, pas de StrictHostKeyChecking=no, garde-fou sur VERSION.
  for (const s of ['sshUserPrivateKey', 'UserKnownHostsFile=known_hosts', '[ -n "$VERSION" ]', 'ln -sfn releases/$VERSION current']) assert.ok(DEPLOY_WEB1.includes(s), s)
  assert.ok(!DEPLOY_WEB1.includes('StrictHostKeyChecking'))
  const vérif = tout.find(b => b.t === 'cmd' && b.out.includes('ssh-keyscan')).out
  assert.equal(new Set(vérif.match(/SHA256:[A-Za-z0-9+/]+/g)).size, 1, 'même empreinte côté serveur et côté agent')
  assert.ok(DEPLOY_WEB1.includes(vérif.split('\n').at(-1).trim()), 'la clé épinglée est celle qui a été vérifiée')
  assert.ok(sortie(/deploy-web-1 #1/).includes('Host key verification failed.') && sortie(/deploy-web-1 #4/).includes('Finished: SUCCESS'))
  // Le masquage : ce que les journaux réels montrent vraiment.
  const fuite = sortie(/leaky-pipeline #2/)
  assert.ok(fuite.includes('Groovy String interpolation') && fuite.includes('****Qo=') && fuite.includes('18b5e2c9a3f7-kael-omed') && fuite.includes('demo-leak-7f3a9c2e'))
  assert.equal(sortie(/Anyone who can read/).trim().split('\n').at(-1), 'token=demo-leak-7f3a9c2e5b81')
  assert.ok(LEAKY_PIPELINE.includes('sh "echo Calling the API with ${TOKEN}"') && !SAFE_PIPELINE.includes('"${TOKEN}"'))
  assert.ok(sortie(/safe-pipeline #2/).includes('authenticated as jenkins-bot') && !sortie(/safe-pipeline #2/).includes('demo-'))
  // Dossiers et sandbox.
  assert.ok(sortie(/use-team-token #1/).includes('team token available') && sortie(/outside-folder #1/).includes("Could not find credentials entry with ID 'team-stock-token'"))
  assert.ok(USE_TEAM_TOKEN.includes("credentialsId: 'team-stock-token'") && SANDBOX_DEMO.includes('new File('))
  assert.ok(sortie(/sandbox-demo #1/).includes('Scripts not permitted to use new java.io.File java.lang.String'))
  // Les deux captures reprises du Module 2 sont les mêmes blocs.
  for (const id of ['m2-17-matrix-summary', 'm2-19-access-denied']) assert.ok(tout.some(b => b.t === 'shot' && b.id === id), id)
  assert.equal(MODULE9.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 10 : Ansible, Terraform, SonarQube, Nexus, Prometheus/Grafana concordent avec le labo réel', () => {
  const tout = [...parcourir(MODULE10)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // Ansible : become + force écrits dans le playbook réellement exécuté, et le Jenkinsfile les appelle bien.
  assert.ok(SITE_YML.includes('become: true') && SITE_YML.includes('force: true'))
  assert.ok(JENKINSFILE_ANSIBLE.includes("installation: 'ansible-2.22'") && JENKINSFILE_ANSIBLE.includes('checkMode: params.DRY_RUN'))
  assert.ok(sortie(/stock-ansible #1/).includes('VERSION is empty'))
  assert.ok(sortie(/stock-ansible #2/).includes('Failed to lock apt') && sortie(/stock-ansible #3/).includes('changed:'))
  assert.ok(sortie(/stock-ansible #5/).includes("use 'force=yes'") && sortie(/stock-ansible #7/).includes('serves 1.0.8'))
  // Terraform : état verrouillé dans le cluster, RBAC avec un bind explicite, verrouillage concurrent réel.
  assert.match(TF_MAIN, /kubernetes_role_binding_v1/)
  assert.ok(TERRAFORM_RBAC.includes('verbs: ["bind"]') && TERRAFORM_RBAC.includes('resourceNames: ["edit"]'))
  assert.ok(JENKINSFILE_TERRAFORM.includes('disableConcurrentBuilds()') && JENKINSFILE_TERRAFORM.includes("input id: 'apply'"))
  assert.ok(sortie(/platform-terraform #1/).includes('Plan: 8 to add') && sortie(/platform-terraform #1/).includes('is attempting to grant RBAC'))
  assert.ok(sortie(/platform-terraform #3/).includes('Plan: 2 to add') && sortie(/platform-terraform #3/).includes('Apply complete'))
  assert.ok(sortie(/platform-terraform #6/).includes('Error acquiring the state lock') && sortie(/platform-terraform #7/).includes('No changes'))
  // SonarQube : le pipeline attend vraiment le webhook et peut avorter ; l'échec et le correctif sont réels.
  assert.ok(JENKINSFILE_SONAR.includes('waitForQualityGate') && JENKINSFILE_SONAR.includes('abortPipeline: true'))
  assert.ok(sortie(/stock-api-sonar #1/).includes("Quality gate is 'OK'"))
  assert.ok(sortie(/stock-api-sonar #5/).includes("Quality gate is 'ERROR'") && sortie(/stock-api-sonar #5/).includes('aborted due to quality gate'))
  assert.ok(sortie(/stock-api-sonar #6/).includes("Quality gate is 'OK'"))
  const gate = JSON.parse(sortie(/the failing condition, read right after/))
  assert.equal(gate.projectStatus.status, 'ERROR')
  assert.ok(gate.projectStatus.conditions.some(c => c.metricKey === 'new_coverage' && c.status === 'ERROR'))
  // Nexus : le compte CI est bien limité (add/read/browse, pas delete), et l'EULA — pas un droit — bloquait au début.
  assert.ok(JENKINSFILE_NEXUS.includes("credentialsId: 'nexus-deployer'") && JENKINSFILE_NEXUS.includes('-DaltDeploymentRepository'))
  assert.ok(CI_SETTINGS_M10.includes('<id>nexus</id>') && CI_SETTINGS_M10.includes('${env.NEXUS_TOKEN}'))
  const cmds10 = tout.filter(b => b.t === 'cmd')
  assert.ok(cmds10.some(b => b.out.includes('"deployer-maven-releases"')))
  assert.ok(cmds10.some(b => b.out.includes('You must accept the End User License Agreement')))
  assert.ok(cmds10.some(b => b.out.includes('403 Forbidden') && b.out.includes('200 OK')))
  // Prometheus/Grafana : la cible réellement scrapée, le tableau de bord réellement provisionné.
  assert.ok(PROMETHEUS_YML.includes('metrics_path: /prometheus/') && PROMETHEUS_YML.includes('jenkins:8080'))
  assert.ok(sortie(/Prometheus — its own API/).includes('default_jenkins_up'))
  assert.ok(sortie(/the dashboard JSON, posted once/).includes('"status": "success"'))
  // Artifactory : documenté, jamais prétendu exécuté.
  const artifactory = tout.filter(b => b.t === 'callout' && /Artifactory/.test(JSON.stringify(b)))
  assert.ok(artifactory.some(b => /[Nn]ot run/.test(b.title ?? '') || /[Nn]ot run/.test(b.text)))
  assert.equal(MODULE10.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 11 : les 5 TP chaînent Modules 6 à 10 pour de vrai, sans nouvel outil', () => {
  const tout = [...parcourir(MODULE11)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // Lab 11.1 (Java) : le gate attend vraiment, package après le gate, publish Nexus réel (edit, pas seulement add).
  assert.ok(JENKINSFILE_E2E_JAVA.includes('waitForQualityGate abortPipeline: true'))
  assert.ok(JENKINSFILE_E2E_JAVA.includes("credentialsId: 'nexus-deployer'") && JENKINSFILE_E2E_JAVA.includes('-DaltDeploymentRepository'))
  assert.ok(sortie(/stock-api-e2e #3/).includes('Tests run: 12') && sortie(/stock-api-e2e #3/).includes("Quality gate is 'OK'"))
  assert.ok(sortie(/stock-api-e2e #3/).includes('tested, gated, packaged, published') && sortie(/stock-api-e2e #3/).includes('Finished: SUCCESS'))
  // Lab 11.2/11.5 (Docker + DevSecOps) : scan dépendances réel (rien à signaler), scan image réel (7 HIGH, 0 CRITICAL), gate lit le compte.
  assert.ok(JENKINSFILE_E2E_DOCKER.includes('osv-scanner scan source'))
  assert.ok(JENKINSFILE_E2E_DOCKER.includes('trivy image --severity CRITICAL,HIGH --exit-code 1'))
  assert.ok(JENKINSFILE_E2E_DOCKER.includes("error(\"Security gate: ${env.CRITICAL_FOUND} CRITICAL"))
  assert.ok(JENKINSFILE_E2E_DOCKER.includes('dockerhub-deployer'), 'Docker Hub documenté, même commenté')
  assert.ok(sortie(/stock-service-e2e #1 → Console Output \(real text, excerpt\)$/).includes('No package sources found'))
  const trivy = sortie(/Trivy on the built image/)
  assert.ok(trivy.includes('Total: 7 (HIGH: 7, CRITICAL: 0)') && trivy.includes('brace-expansion') && trivy.includes('Security gate: 0 CRITICAL'))
  // Lab 11.3 (Kubernetes) : le CI déclenche vraiment le CD, et attend son résultat.
  assert.ok(JENKINSFILE_E2E_DOCKER.includes("build job: 'stock-deploy'") && JENKINSFILE_E2E_DOCKER.includes('wait: true'))
  assert.ok(sortie(/stock-service-e2e #2/).includes('Starting building: stock-deploy #14') && sortie(/stock-service-e2e #2/).includes('Build stock-deploy #14 completed: SUCCESS'))
  // Lab 11.4 (Ansible) : host_vars réel, et la différence se voit dans la config nginx déployée.
  assert.ok(HOST_VARS_APP2.includes('site_root: /var/www/stock-web-canary'))
  assert.ok(sortie(/stock-ansible #9/).includes('changed=4') && sortie(/stock-ansible #9/).includes('changed=5') && sortie(/stock-ansible #9/).includes('serves 1.0.9'))
  assert.ok(sortie(/Two servers, two configurations/).includes('/var/www/stock-web/current') && sortie(/Two servers, two configurations/).includes('/var/www/stock-web-canary/current'))
  // Pas de nouvel outil : Docker Hub est documenté, jamais prétendu exécuté.
  const dockerhub = tout.filter(b => b.t === 'callout' && /Docker Hub/.test(JSON.stringify(b)))
  assert.ok(dockerhub.some(b => /[Nn]ot run/.test(b.title ?? '') || /[Nn]ot run/.test(b.text)))
  assert.equal(MODULE11.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 12 : un nœud mis hors ligne et restauré pour de vrai sur une instance jetable', () => {
  const tout = [...parcourir(MODULE12)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // Lab 12.1 : ops-1 a son propre volume de clé d'hôte, sa connexion, puis la file réelle pendant qu'il est hors ligne.
  assert.ok(COMPOSE_OPS1.includes('ops1_hostkeys:/etc/ssh') && COMPOSE_OPS1.includes('JENKINS_AGENT_SSH_PUBKEY: ${OPS_AGENT_PUBKEY}'))
  assert.ok(JENKINSFILE_MAINTENANCE.includes("label 'maintenance-pool'"))
  assert.ok(sortie(/Host key, fetched/).includes('SHA256:53gl1ldC3Js+TEh1Tj+9nBT7zwR6PQlGftT5ehvB6dY'))
  assert.ok(sortie(/ops-1 connects/).includes('SSH host key matched') && sortie(/ops-1 connects/).includes('Agent successfully connected and online'))
  assert.ok(sortie(/Queue API, while ops-1 is offline/).includes('‘ops-1’ is offline'))
  assert.ok(sortie(/ops-maintenance-demo #2/).includes('Still waiting to schedule task') && sortie(/ops-maintenance-demo #2/).includes('Finished: SUCCESS'))
  // Lab 12.2 : sauvegarde réelle et scoped, puis restauration vérifiée par l'API d'une instance jetable.
  assert.ok(JENKINSFILE_BACKUP.includes("--exclude='workspace'") && JENKINSFILE_BACKUP.includes('config.xml jobs users credentials.xml secrets nodes plugins'))
  assert.ok(sortie(/jenkins-backup #1/).includes('296M'))
  assert.ok(sortie(/A second, throwaway instance/).includes('jenkins_restore_home') && sortie(/A second, throwaway instance/).includes('113 plugins restored'))
  // Logs, plugins, performance, espace disque : tous avec des traces réelles.
  assert.ok(sortie(/logger hudson\.model\.Queue/).includes('[log-demo] added to queue'))
  assert.ok(sortie(/Manage Jenkins → System Information/).includes('JENKINS_HOME=/var/jenkins_home') && sortie(/Manage Jenkins → System Information/).includes('Eclipse Adoptium'))
  assert.ok(sortie(/Plugin Manager, before and after/).includes('4.3583.v1a_a_ee48b_1b_dd') && sortie(/Plugin Manager, before and after/).includes('4.3620.v407ef5b_88f0d'))
  assert.ok(sortie(/agent-1 reduced to 1 executor/).includes('default_jenkins_executors_busy{label="agent-1"} 1.0') && sortie(/agent-1 reduced to 1 executor/).includes('jenkins_queue_size_history'))
  assert.ok(sortie(/Disk Space Monitoring, threshold raised/).includes('Disk space is below threshold of 10.00 GiB') && sortie(/Disk Space Monitoring, threshold raised/).includes('7.23 GiB'))
  // Support bundle : documenté, jamais prétendu généré.
  const bundle = tout.filter(b => b.t === 'callout' && /support bundle/i.test(JSON.stringify(b)))
  assert.ok(bundle.some(b => /[Nn]ot run/.test(b.title ?? '') || /[Nn]ot run/.test(b.text)))
  assert.equal(MODULE12.find(b => b.t === 'quiz').questions.length, 10)
})

test('module 13 : le projet capstone chaîne les huit outils dans un seul pipeline réel', () => {
  const tout = [...parcourir(MODULE13)]
  const sortie = motif => tout.find(b => b.t === 'cmd' && motif.test(b.where)).out
  // Le Jenkinsfile complet porte bien les neuf étapes réelles, dans l'ordre.
  assert.ok(JENKINSFILE_CAPSTONE.includes("stage('Quality gate')") && JENKINSFILE_CAPSTONE.includes('waitForQualityGate abortPipeline: true'))
  assert.ok(JENKINSFILE_CAPSTONE.includes("stage('Ansible: front door on app-1')") && JENKINSFILE_CAPSTONE.includes("stage('Smoke test')"))
  assert.ok(DOCKERFILE_CAPSTONE.includes('COPY target/capstone-*.jar'))
  assert.ok(ANSIBLE_CAPSTONE_PROXY.includes('blockinfile') && ANSIBLE_CAPSTONE_PROXY.includes('hosts: app-1'))
  assert.ok(APP_JAVA.includes('createContext("/health"'))
  // Un seul run réel, de bout en bout : build/test/gate, scan, publish, Helm, Ansible, smoke test.
  assert.ok(sortie(/Build\/Test\/Gate/).includes('Tests run: 14') && sortie(/Build\/Test\/Gate/).includes("Quality gate is 'OK'"))
  assert.ok(sortie(/image scan/).includes('Security gate: 0 CRITICAL'))
  assert.ok(sortie(/Publish \(real text/).includes('Uploaded to nexus') && sortie(/Publish \(real text/).includes('digest: sha256'))
  assert.ok(sortie(/Helm \(real text/).includes('STATUS: deployed') && sortie(/Helm \(real text/).includes('REVISION:'))
  assert.ok(sortie(/Ansible --diff/).includes('ANSIBLE MANAGED BLOCK') && sortie(/Ansible --diff/).includes('changed: [app-1]'))
  assert.ok(sortie(/smoke test/).includes('cluster NodePort 30081: OK') && sortie(/smoke test/).includes('Finished: SUCCESS'))
  assert.equal(MODULE13.find(b => b.t === 'quiz').questions.length, 10)
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
