// Jenkins Basics — a 2-hour course for beginners, built from the real lab of "Learning Jenkins".
// Screenshots, code and real outputs are taken from Lab 0 and Modules 1, 3, 4 and 5 by the helpers below
// (never copied by hand); the three pipelines specific to this course ran on the built-in node of the lab
// Jenkins 2.580.2 LTS, as in a fresh Lab 0 (2026-11-17). Code constants are generated from the files that ran.
import { LAB0 } from './lab0.js'
import { MODULE1 } from './module1.js'
import { MODULE3 } from './module3.js'
import { MODULE4 } from './module4.js'
import { MODULE5 } from './module5.js'

// Tous les blocs d'un module, y compris ceux des TP et des exercices.
const tous = blocs => {
  const r = []
  const parcourir = l => l.forEach(b => { r.push(b); for (const k of ['étapes', 'solution', 'énoncé']) if (Array.isArray(b[k])) parcourir(b[k]) })
  parcourir(blocs)
  return r
}
// Reprend un bloc existant ; une erreur si le module a changé et que le bloc n'existe plus.
const prendre = (blocs, test, nom) => {
  const b = tous(blocs).find(test)
  if (!b) throw new Error(`Jenkins Basics: block not found in its module (${nom})`)
  return b
}
const capture = (blocs, id) => prendre(blocs, b => b.t === 'shot' && b.id === id, id)
const schéma = (blocs, id) => prendre(blocs, b => b.t === 'diagram' && b.id === id, id)
const commande = (blocs, motif) => prendre(blocs, b => b.t === 'cmd' && motif.test(`${b.where} ${b.cmd}`), String(motif))
const code = (blocs, motif) => prendre(blocs, b => b.t === 'code' && motif.test(b.file), String(motif))
const tableau = (blocs, entête) => prendre(blocs, b => b.t === 'table' && b.head[0] === entête, entête)
// Une partie du glossaire du Module 1, dans l'ordre demandé.
const glossaire = termes => {
  const t = tableau(MODULE1, 'Term')
  return { ...t, rows: termes.map(n => t.rows.find(r => r[0] === n) ?? (() => { throw new Error(`Jenkins Basics: glossary term ${n}`) })()) }
}
// Des lignes de tableaux d'erreurs d'un module, choisies par le début du symptôme.
const erreurs = (blocs, débuts) => {
  const lignes = tous(blocs).filter(b => b.t === 'errors').flatMap(b => b.rows)
  return débuts.map(d => lignes.find(r => r[0].startsWith(d)) ?? (() => { throw new Error(`Jenkins Basics: error row ${d}`) })())
}
// Adapte les renvois internes d'un bloc repris (« Module 1 » → « lesson 1.2 »…) sans modifier l'original ;
// chaque remplacement doit servir au moins une fois.
const adapter = (bloc, remplacements) => {
  const vus = new Set()
  const r = v => typeof v === 'string'
    ? remplacements.reduce((t, [a, b], i) => (t.includes(a) ? (vus.add(i), t.split(a).join(b)) : t), v)
    : Array.isArray(v) ? v.map(r) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, r(x)])) : v
  const n = r(bloc)
  if (vus.size !== remplacements.length) throw new Error(`Jenkins Basics: nothing to adapt in ${bloc.id ?? bloc.where}`)
  return n
}

export const BASICS_FAIL = `pipeline {
    agent any                       // run on any available executor
    stages {
        stage('Build') {
            steps {
                echo "Building version 1.0.\${env.BUILD_NUMBER}"
                sh 'echo "app version 1.0.\${BUILD_NUMBER}" > version.txt'
            }
        }
        stage('Test') {
            steps {
                sh 'test -s release-notes.txt && echo "tests passed"'   // this file does not exist: the test fails
            }
        }
        stage('Package') {
            steps {
                archiveArtifacts artifacts: 'version.txt', fingerprint: true
            }
        }
    }
    post {
        success { echo 'Pipeline finished: the artifact is archived.' }
        failure { echo 'Pipeline failed: read the console output.' }
    }
}
`

export const BASICS_TESTS = `// basics-tests — test results, build result and an artifact (Jenkins Basics, lesson 7)
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                // A real project runs its test tool here (mvn test, npm test, pytest…): it writes JUnit XML.
                sh '''
                    mkdir -p reports
                    printf '%s\\\\n' \\
                      '<testsuite name="inventory" tests="3" failures="1">' \\
                      '  <testcase classname="inventory" name="adds_items"/>' \\
                      '  <testcase classname="inventory" name="removes_items"/>' \\
                      '  <testcase classname="inventory" name="rejects_negative_stock">' \\
                      '    <failure message="negative stock was accepted"/>' \\
                      '  </testcase>' \\
                      '</testsuite>' > reports/TEST-inventory.xml
                '''
            }
            post {
                always { junit 'reports/*.xml' }      // publish the results, even when tests fail
            }
        }
        stage('Package') {
            steps {
                sh 'echo "inventory 1.0.\${BUILD_NUMBER}" > app.txt'
                archiveArtifacts artifacts: 'app.txt', fingerprint: true
            }
        }
    }
}
`

export const BASICS_SECRET = `// basics-secret — use a credential without leaking it (Jenkins Basics, lesson 8)
pipeline {
    agent any
    stages {
        stage('Call the API') {
            steps {
                withCredentials([string(credentialsId: 'report-api-token', variable: 'API_TOKEN')]) {
                    sh 'test -n "$API_TOKEN" && echo "token received"'   // single quotes: the shell reads the secret
                    sh 'echo "Token: $API_TOKEN"'                       // printed by mistake: Jenkins masks it
                }
            }
        }
    }
}
`

// Contenu des leçons, par identifiant de leçon (les titres et durées sont dans basics-plan.js).
// Les captures propres à cette formation (Jenkins du labo, nœud intégré, comme un Lab 0 tout neuf).
const NOUVELLES = {
  'bas-01-hello-stages': { t: 'shot', id: 'bas-01-hello-stages', titre: 'hello-pipeline → Stages', ce: 'The *Stages* view draws each stage of the run with its result and duration; click a stage to read its steps and log.', éléments: ['**Build**.', '**Test**.', '**Package**: `version.txt` is archived.', '**Post Actions**: the `post { success }` block.'], actions: ['Open the build, click **Stages** (or *Pipeline Overview*), then each stage.'], résultat: 'Four green stages: the pipeline did what the Jenkinsfile says.' },
  'bas-02-fail-stages': { t: 'shot', id: 'bas-02-fail-stages', titre: 'A failed stage in the Stages view', ce: 'The same pipeline with the failing test.', éléments: ['**Test** failed (red).', '**Package** was skipped: the graph goes around it.', 'The command that failed and its exit code.'], actions: ['Click the red stage to see the failing command.'], résultat: 'You see where the run stopped without reading the whole log.' },
  'bas-03-tests-build': { t: 'shot', id: 'bas-03-tests-build', titre: 'basics-tests #1: the build page', ce: 'An UNSTABLE build (orange exclamation mark): it ran to the end, but a test failed.', éléments: ['**Build Artifacts**: `app.txt`, archived by the Package stage.', '**Tests (1 failure)**.', 'The failed test, one click away.'], actions: ['Click **Tests**.'], résultat: 'Results and deliverable of the build, on one page.' },
  'bas-04-test-report': { t: 'shot', id: 'bas-04-test-report', titre: 'basics-tests #1 → Tests', ce: 'The JUnit report, read by Jenkins.', éléments: ['**All Failed Tests**.', '`rejects_negative_stock`.', '**All Tests**: 3 tests, 1 failed, 2 passed.'], actions: ['Click the failed test to read its message.'], résultat: 'You know which test fails — and, build after build, since when.' },
  'bas-05-secret-masked': { t: 'shot', id: 'bas-05-secret-masked', titre: 'basics-secret #1 → Console Output', ce: 'The secret is used, never shown.', éléments: ['*Masking supported pattern matches of $API_TOKEN*: Jenkins knows the value to hide.', '`token received`: the script got the secret.', '`Token: ****`: printed by mistake, masked.'], actions: ['Search the console for the value of your credential: it is not there.'], résultat: 'The pipeline used the secret without leaking it.' },
}

export const CONTENU_BASES = {
  b1: [
    { t: 'objectives', items: [
      'Explain what Jenkins does, with the words job, build, pipeline, agent and plugin.',
      'Install Jenkins on your machine with Docker and complete the setup wizard.',
      'Find your way around the dashboard, a job, a build and its console output.',
      'Create and run a Freestyle job, then a first Declarative pipeline (Jenkinsfile).',
      'Explain how a pipeline is read from Git and started by a push.',
      'Publish test results and an artifact, and read SUCCESS, UNSTABLE and FAILURE.',
      'Use a credential in a pipeline without leaking it.',
    ] },
    { t: 'p', text: 'This short course takes about **two hours**. You only need Docker: every step runs on the Jenkins you install in lesson 2. All screenshots are **real** — taken from the Jenkins of the full course *Learning Jenkins* — and all console outputs are real too.' },
    { t: 'h', id: 'b1-1', text: '1.1 Jenkins in one paragraph' },
    prendre(MODULE1, b => b.t === 'p' && b.text.startsWith('**Jenkins is an open source automation server.**'), 'definition'),
    schéma(MODULE1, 'cicd'),
    { t: 'p', text: '**Continuous integration (CI)**: every push is built and tested automatically, so a broken change is seen within minutes. **Continuous delivery / deployment (CD)**: every version that passes the checks is ready to go to production — or goes there automatically. Jenkins is the engine that runs these steps, again and again, the same way.' },
    { t: 'h', id: 'b1-2', text: '1.2 How Jenkins is organized' },
    schéma(MODULE1, 'architecture'),
    { t: 'p', text: 'The **controller** is the Jenkins you open in your browser: it stores the configuration and decides what runs where. **Agents** are the machines that run the builds. In this course everything runs on the *built-in node* — the controller itself — which is fine to learn and avoided in production (the full course adds agents in Module 2).' },
    { t: 'h', id: 'b1-3', text: '1.3 The words you will meet' },
    glossaire(['Controller', 'Agent', 'Executor', 'Item / job', 'Build / run', 'Freestyle project', 'Pipeline', 'Jenkinsfile', 'Stage / step', 'Workspace', 'Artifact', 'Plugin', 'Credential', 'Webhook']),
  ],

  b2: [
    { t: 'h', id: 'b2-1', text: '2.1 What you need' },
    { t: 'ul', items: [
      'Docker Engine (Linux) or Docker Desktop (Windows, macOS), with Docker Compose v2.',
      'About 4 GB of free memory, 2 GB of disk, and the port 8080 free on your machine.',
      'A terminal and a web browser. Allow 15 minutes, most of it waiting for downloads.',
    ] },
    commande(LAB0, /docker --version/),
    { t: 'h', id: 'b2-2', text: '2.2 The Compose file' },
    { t: 'p', text: 'Docker Compose describes the container in a file, so that the whole set-up is one command — and the same for everyone.' },
    commande(LAB0, /mkdir -p ~\/jenkins-lab/),
    code(LAB0, /^~\/jenkins-lab\/docker-compose\.yml$/),
    { t: 'h', id: 'b2-3', text: '2.3 Start Jenkins and unlock it' },
    commande(LAB0, /in ~\/jenkins-lab docker compose up -d$/),
    commande(LAB0, /docker compose ps/),
    commande(LAB0, /initialAdminPassword/),
    capture(LAB0, '01-unlock'),
    { t: 'h', id: 'b2-4', text: '2.4 Plugins, administrator, URL' },
    capture(LAB0, '02-customize'),
    capture(LAB0, '03-installing'),
    capture(LAB0, '04-admin'),
    capture(LAB0, '05-instance'),
    capture(LAB0, '06-ready'),
    { t: 'errors', rows: erreurs(LAB0, ['`Bind for 0.0.0.0:8080 failed', 'http://localhost:8080 does not answer', '`cat: …/initialAdminPassword', 'The container restarts in a loop']) },
    { t: 'lab', id: 'labB1', titre: 'Lab B.1 — Your own Jenkins', durée: '15 min', objectif: 'A running Jenkins with your administrator account.', étapes: [
      { t: 'p', text: '**1.** Create `~/jenkins-lab/docker-compose.yml` with the file of section 2.2.' },
      { t: 'p', text: '**2.** Run `docker compose up -d`, then read the initial password.' },
      { t: 'p', text: '**3.** Open http://localhost:8080, unlock, install the suggested plugins, create your administrator, keep the URL.' },
      { t: 'p', text: '**4.** Check: `docker compose ps` shows the container *Up*, and the dashboard opens.' },
    ], solution: [
      { t: 'ul', items: ['`docker compose ps`: `jenkins … Up …` with ports 8080 and 50000.', 'The page *Jenkins is ready!*, then the empty dashboard of lesson 3.', 'Lost? The first lines of `docker compose logs jenkins` usually tell why (see the table of errors above).'] },
    ] },
  ],

  b3: [
    { t: 'h', id: 'b3-1', text: '3.1 The dashboard' },
    adapter(capture(LAB0, '07-dashboard'), [['(Module 1)', '(lesson 1.2)']]),
    { t: 'h', id: 'b3-2', text: '3.2 Manage Jenkins' },
    capture(MODULE1, '13-manage'),
    capture(MODULE1, '16-about'),
    { t: 'h', id: 'b3-3', text: '3.3 Where to find what' },
    { t: 'table', head: ['I want to…', 'Go to'], rows: [
      ['Create a job or a pipeline', 'Dashboard → **New Item**'],
      ['Run a job', 'The job page → **Build Now** (or **Build with Parameters**)'],
      ['Know why a build failed', 'The build → **Console Output**, read from the top'],
      ['See test results and files of a build', 'The build page: **Tests**, **Build Artifacts**'],
      ['Add or update a plugin', '**Manage Jenkins → Plugins**'],
      ['Store a password or a token', '**Manage Jenkins → Credentials** (lesson 8)'],
      ['See the machines that run builds', '**Manage Jenkins → Nodes**'],
      ['Know the exact version', '**Manage Jenkins → About Jenkins**'],
    ] },
  ],

  b4: [
    { t: 'p', text: 'A **Freestyle project** is a job configured with web forms. It is the quickest way to see Jenkins work: one shell step, one build.' },
    { t: 'h', id: 'b4-1', text: '4.1 Create the job' },
    { ...capture(LAB0, '08-new-item'), éléments: [
      'Item name: `hello-jenkins` (no spaces: the name becomes a folder and a URL).',
      '**Freestyle project**: a job configured with forms — selected here.',
      '**Pipeline**: a job described by code (lesson 5).',
      '**Multibranch Pipeline**: one pipeline per Git branch (full course, Module 5).',
      '**OK** creates the job and opens its configuration.',
    ] },
    capture(LAB0, '09-build-step'),
    code(LAB0, /^hello-jenkins → Configure/),
    { t: 'h', id: 'b4-2', text: '4.2 Run it and read the result' },
    capture(LAB0, '10-job'),
    capture(LAB0, '11-console'),
    adapter(commande(LAB0, /hello-jenkins #1 → Console Output/), [['Module 1 explains why it is avoided in production', 'avoided in production (lesson 1.2)']]),
    capture(LAB0, '12-workspace'),
    commande(LAB0, /build-info\.txt/),
    { t: 'exercise', id: 'exB4', titre: 'Exercise B.4 — Make it fail', énoncé: [
      { t: 'p', text: 'Add the line `ls missing-file.txt` at the end of the command, save, and click **Build Now**. Which colour is the build? Which lines of the console tell you why?' },
    ], solution: [
      { t: 'p', text: 'The build is **red** (FAILURE). Jenkins runs the script with `sh -xe`: `-e` stops at the first command that fails, and a non-zero exit code fails the step. Our test job (two lines: an `echo`, then `ls missing-file.txt`) printed:' },
      { t: 'cmd', where: 'A Freestyle job with this command → Console Output (real text, excerpt)', cmd: '', out: `+ echo Hello from basics-freestyle-fail
Hello from basics-freestyle-fail
+ ls missing-file.txt
ls: cannot access 'missing-file.txt': No such file or directory
Build step 'Execute shell' marked build as failure
Finished: FAILURE` },
    ] },
  ],

  b5: [
    { t: 'h', id: 'b5-1', text: '5.1 Freestyle or Pipeline?' },
    { t: 'table', head: ['', 'Freestyle project', 'Pipeline'], rows: [
      ['Defined by', 'Web forms', 'Code: a `Jenkinsfile`'],
      ['Stored', 'In Jenkins only', 'In Git, next to the application, reviewed like code'],
      ['History of changes', 'Hard to follow', '`git log` of the Jenkinsfile'],
      ['Phases', 'One list of build steps', 'Named **stages**, drawn in the *Stages* view'],
      ['Use it for', 'A quick task, a first try', 'Every real project'],
    ] },
    { t: 'h', id: 'b5-2', text: '5.2 The anatomy of a Jenkinsfile' },
    schéma(MODULE4, 'm4-anatomie'),
    code(MODULE1, /^hello-pipeline → Configure/),
    { t: 'h', id: 'b5-3', text: '5.3 Create and run it' },
    { t: 'p', text: '**New Item** → name `hello-pipeline` → **Pipeline** → **OK**. In the **Pipeline** section, keep *Pipeline script* and paste the Jenkinsfile:' },
    { ...capture(MODULE4, 'm4-02-pipeline-config'), éléments: [
      '**Definition**: *Pipeline script* (typed here) or *Pipeline script from SCM* (read from Git, lesson 6).',
      'The editor, with syntax highlighting and checks.',
      '**Use Groovy Sandbox**: keep it ticked — the script runs with restricted rights.',
      '**Pipeline Syntax**: generators that write the code of a step for you.',
    ], actions: ['Paste the Jenkinsfile, **Save**, then **Build Now**.'], résultat: 'The pipeline runs.' },
    commande(MODULE1, /hello-pipeline #1 → Console Output/),
    NOUVELLES['bas-01-hello-stages'],
    { t: 'h', id: 'b5-4', text: '5.4 When a stage fails' },
    { t: 'p', text: 'Now test a file that does not exist — only line 12 changes:' },
    { t: 'code', lang: 'groovy', file: 'hello-pipeline → Configure → Pipeline script (Test stage changed)', code: BASICS_FAIL, lignes: [
      [12, '`test -s` fails when the file is missing or empty: the shell returns 1, the step and the stage fail.'],
      [17, 'Never reached: after a failure, the next stages are skipped.'],
      [23, '`post { failure }` runs because the build failed.'],
    ] },
    { t: 'cmd', where: 'hello-pipeline with the failing test → Console Output (real text, [Pipeline] lines removed)', cmd: '', out: `Started by user Lab Admin
Running on Jenkins in /var/jenkins_home/workspace/basics-fail
Building version 1.0.1
+ echo app version 1.0.1
+ test -s release-notes.txt
Stage "Package" skipped due to earlier failure(s)
Pipeline failed: read the console output.
ERROR: script returned exit code 1
Finished: FAILURE` },
    NOUVELLES['bas-02-fail-stages'],
    { ...capture(MODULE4, 'm4-15-syntax-error'), ce: 'Another kind of failure: a Jenkinsfile that does not compile stops before running any step (here, `sh` written outside a `steps` block).' },
    { t: 'lab', id: 'labB2', titre: 'Lab B.2 — Your first pipeline', durée: '15 min', objectif: 'Run, break and repair a Declarative pipeline.', étapes: [
      { t: 'p', text: '**1.** Create the Pipeline job `hello-pipeline` with the Jenkinsfile of section 5.2; run it.' },
      { t: 'p', text: '**2.** Open the build: read the console, then the *Stages* view. Download `version.txt` from the build page.' },
      { t: 'p', text: '**3.** Change the Test stage as in section 5.4; run again. Which stages ran? Which `post` block?' },
      { t: 'p', text: '**4.** Put the original line back; run again.' },
    ], solution: [
      { t: 'ul', items: ['Step 1: four green stages, *Finished: SUCCESS*, `version.txt` archived.', 'Step 3: Build ✓, Test ✗, Package skipped; *Pipeline failed: read the console output.* — `post { failure }`.', 'Step 4: green again. The history keeps every build: you can compare them.'] },
    ] },
  ],

  b6: [
    { t: 'h', id: 'b6-1', text: '6.1 The Jenkinsfile lives with the code' },
    { t: 'p', text: 'In a real project, the Jenkinsfile is a file of the Git repository. The job only says **where** the repository is: choose *Pipeline script from SCM* instead of *Pipeline script*. Each build fetches the code, reads the Jenkinsfile of that version, and runs it.' },
    schéma(MODULE5, 'm5-flux'),
    capture(MODULE5, 'm5-04-scm-config'),
    capture(MODULE5, 'm5-04b-script-path'),
    { t: 'h', id: 'b6-2', text: '6.2 Webhooks: a build for every push' },
    { t: 'p', text: '**Polling** asks the Git server every few minutes whether something changed: slow and wasteful. A **webhook** is the opposite: the Git server calls Jenkins the moment someone pushes. Each forge has its plugin and webhook address:' },
    tableau(MODULE5, 'Forge'),
    { ...capture(MODULE5, 'm5-12-push-cause'), actions: ['On any build page, the cause comes first: *Started by user…*, *Push event…*, *Started by timer…*.'] },
    { t: 'callout', kind: 'info', title: 'Do it for real', text: 'These screenshots come from Module 5 of *Learning Jenkins*, which adds a Git server (Gitea) to this lab: Pipeline script from SCM, webhooks, one pipeline per branch and pull request. It takes about four hours — the natural next step after this course.' },
  ],

  b7: [
    { t: 'h', id: 'b7-1', text: '7.1 The results of a build' },
    { t: 'table', head: ['Result', 'Icon', 'Meaning', 'Typical cause'], rows: [
      ['**SUCCESS**', 'Green check', 'Everything passed', '—'],
      ['**UNSTABLE**', 'Orange exclamation mark', 'The build ran to the end, but a check complained', 'Failed tests in a JUnit report, a quality gate'],
      ['**FAILURE**', 'Red cross', 'A step failed: the build stopped', 'Compilation error, a command that returned non-zero'],
      ['**ABORTED**', 'Grey', 'Stopped by a user or a timeout', 'Clicking ✕ on a running build'],
    ] },
    { t: 'h', id: 'b7-2', text: '7.2 Publish test results and keep the deliverable' },
    { t: 'p', text: 'Test tools write their results in the **JUnit XML** format; the `junit` step turns that file into Jenkins pages. `archiveArtifacts` keeps the deliverable with the build. Here a script writes the report itself, with one failing test:' },
    { t: 'code', lang: 'groovy', file: 'basics-tests → Configure → Pipeline script', code: BASICS_TESTS, lignes: [
      [7, 'In a real project this is `mvn test`, `npm test`, `pytest`…: the test tool writes the XML.'],
      [10, 'Three test cases, one of them with a `<failure>`.'],
      [21, '`junit` reads the report. In `post { always }`: published even when the stage fails.'],
      [27, '`archiveArtifacts`: the file stays attached to the build, downloadable; the fingerprint identifies it.'],
    ] },
    { t: 'cmd', where: 'basics-tests #1 → Console Output (real text, [Pipeline] lines removed)', cmd: '', out: `Started by user Lab Admin
Running on Jenkins in /var/jenkins_home/workspace/basics-tests
+ mkdir -p reports
+ printf %s\\n <testsuite name="inventory" tests="3" failures="1">   <testcase classname="inventory" name="adds_items"/>   <testcase classname="inventory" name="removes_items"/>   <testcase classname="inventory" name="rejects_negative_stock">     <failure message="negative stock was accepted"/>   </testcase> </testsuite>
Post stage
Recording test results
+ echo inventory 1.0.1
Archiving artifacts
Recording fingerprints
Finished: UNSTABLE`, note: 'A failed test makes the build **UNSTABLE**, not FAILURE: the Package stage still ran, and the artifact is archived.' },
    NOUVELLES['bas-03-tests-build'],
    NOUVELLES['bas-04-test-report'],
  ],

  b8: [
    { t: 'p', text: 'Passwords and tokens never go in a Jenkinsfile: the file is in Git, readable by everyone who reads the code. Jenkins stores them encrypted, as **credentials**, and gives them to a build only inside a `withCredentials` block.' },
    { t: 'h', id: 'b8-1', text: '8.1 Store the secret in Jenkins' },
    capture(MODULE3, 'm3-21-credential-kinds'),
    capture(MODULE3, 'm3-22-credential-secret'),
    { t: 'h', id: 'b8-2', text: '8.2 Use it in a pipeline' },
    { t: 'code', lang: 'groovy', file: 'basics-secret → Configure → Pipeline script', code: BASICS_SECRET, lignes: [
      [7, '`withCredentials`: inside the block, the environment variable `API_TOKEN` holds the secret `report-api-token`.'],
      [8, 'Single quotes: Jenkins passes the text as it is, and **the shell** reads `$API_TOKEN` from its environment.'],
      [9, 'Even printed by mistake, the value is replaced by `****` in the log.'],
    ] },
    { t: 'cmd', where: 'basics-secret #1 → Console Output (real text, [Pipeline] lines removed)', cmd: '', out: `Started by user Lab Admin
Running on Jenkins in /var/jenkins_home/workspace/basics-secret
Masking supported pattern matches of $API_TOKEN
+ test -n ****
+ echo token received
token received
+ echo Token: ****
Token: ****
Finished: SUCCESS` },
    NOUVELLES['bas-05-secret-masked'],
    { t: 'callout', kind: 'warning', title: 'The most common mistake', text: 'With double quotes, `sh "curl -H \'Authorization: Bearer ${API_TOKEN}\' …"`, Groovy pastes the secret into the command line before the shell runs: other processes of the machine can read it. Jenkins warns about it (screenshot below). Masking the log does not fix it — single quotes do.' },
    adapter({ ...capture(MODULE4, 'm4-16-groovy-warning'), actions: ['Use single quotes around commands that contain a secret: the warning disappears.'] }, [['does not make line 39 safe', 'does not make the double-quoted line safe']]),
    { t: 'lab', id: 'labB3', titre: 'Lab B.3 — A secret in a pipeline', durée: '10 min', objectif: 'Use a credential without leaking it.', étapes: [
      { t: 'p', text: '**1.** **Manage Jenkins → Credentials → System → Global → Add Credentials** → *Secret text*, ID `report-api-token`, any fake value.' },
      { t: 'p', text: '**2.** Create the Pipeline job `basics-secret` with the Jenkinsfile of section 8.2; run it.' },
      { t: 'p', text: '**3.** In the console, find the two lines that use the secret. What is printed?' },
    ], solution: [
      { t: 'ul', items: ['`+ test -n ****` and `Token: ****`: the value never appears.', '*Masking supported pattern matches of $API_TOKEN*: Jenkins knows which value to hide.'] },
    ] },
  ],

  b9: [
    { t: 'h', id: 'b9-1', text: 'Recap' },
    { t: 'recap', items: [
      'Jenkins automates build, test and delivery: a **job** runs as **builds**, each with a log, a result and its files.',
      'A Docker Compose file gives you a Jenkins in minutes; its data lives in the `jenkins_home` volume.',
      'Freestyle jobs are configured with forms; **pipelines** are code — a `Jenkinsfile` with `agent`, `stages`, `steps` and `post`.',
      'The **Console Output** explains every failure: read it from the top.',
      'A failed step makes the build **FAILURE**; failed tests in a JUnit report make it **UNSTABLE**.',
      'In real projects, the Jenkinsfile is in Git and a **webhook** starts a build on every push.',
      'Secrets are **credentials**, used inside `withCredentials`, with single quotes in `sh`.',
    ] },
    { t: 'h', id: 'b9-2', text: 'Quiz' },
    { t: 'quiz', id: 'quizB', questions: [
      { q: 'What is a build?', choix: ['The Jenkins server', 'One execution of a job, with a number, a log and a result', 'A plugin', 'A Git branch'], bonne: 1, pourquoi: 'Each click on *Build Now* creates build #1, #2, #3…' },
      { q: 'Where does Jenkins keep its jobs, builds and plugins in the Docker lab?', choix: ['In the image', 'In the named volume mounted on /var/jenkins_home', 'In your browser', 'In Git'], bonne: 1, pourquoi: 'JENKINS_HOME survives the deletion of the container.' },
      { q: 'Where do you read the initial password?', choix: ['On jenkins.io', 'In /var/jenkins_home/secrets/initialAdminPassword, inside the container', 'In the browser console', 'It is admin/admin'], bonne: 1, pourquoi: '`docker compose exec jenkins cat …/initialAdminPassword`.' },
      { q: 'A build is red. What do you open first?', choix: ['Manage Jenkins', 'The Console Output of the build', 'The plugin list', 'The workspace'], bonne: 1, pourquoi: 'The log says which command failed and why.' },
      { q: 'Which blocks are mandatory in a Declarative pipeline?', choix: ['post and options', 'pipeline, agent, stages, stage, steps', 'environment and parameters', 'node and script'], bonne: 1, pourquoi: 'The rest is optional.' },
      { q: 'A stage fails. What happens to the next stages?', choix: ['They run anyway', 'They are skipped; post blocks still run', 'Jenkins retries them', 'The build becomes UNSTABLE'], bonne: 1, pourquoi: '*Stage "Package" skipped due to earlier failure(s)*.' },
      { q: 'One test fails in a JUnit report published with junit. Result of the build?', choix: ['SUCCESS', 'UNSTABLE', 'FAILURE', 'ABORTED'], bonne: 1, pourquoi: 'The build ran to the end; the tests complained.' },
      { q: 'What does archiveArtifacts do?', choix: ['Deletes old builds', 'Keeps files with the build, downloadable from its page', 'Pushes to Git', 'Compresses the logs'], bonne: 1, pourquoi: 'The deliverable stays attached to the build that produced it.' },
      { q: 'Why use a webhook rather than polling?', choix: ['It is the only way', 'The Git server calls Jenkins at once instead of Jenkins asking every few minutes', 'It is more secure for passwords', 'Polling needs a plugin'], bonne: 1, pourquoi: 'Faster and lighter.' },
      { q: 'Which line uses a credential safely?', choix: ['sh "echo ${API_TOKEN}"', 'sh \'test -n "$API_TOKEN"\' inside withCredentials', 'The token written in the Jenkinsfile', 'echo API_TOKEN in a comment'], bonne: 1, pourquoi: 'Single quotes: the shell reads the variable; Groovy never pastes the secret.' },
    ] },
    { t: 'h', id: 'b9-3', text: 'Checklist' },
    { t: 'checklist', id: 'basics', items: [
      'My Jenkins runs with Docker Compose and I know where its data is.',
      'I can find New Item, Build Now, the Console Output and Manage Jenkins.',
      'My Freestyle job `hello-jenkins` ran, and I read its console.',
      'My pipeline `hello-pipeline` ran, failed on purpose, and ran again.',
      'I can explain SUCCESS, UNSTABLE and FAILURE.',
      'I know how a Jenkinsfile is read from Git and what a webhook does.',
      'I used a credential in a pipeline and saw it masked.',
    ] },
    { t: 'h', id: 'b9-4', text: 'Stop your lab, and what comes next' },
    commande(LAB0, /^Your terminal docker compose stop\ndocker compose start$/),
    { t: 'table', head: ['Next topic', 'In Learning Jenkins'], rows: [
      ['Agents, plugins, users, configuration as code', 'Module 2'],
      ['Freestyle jobs in depth, parameters, environment variables', 'Module 3'],
      ['Pipelines in depth: parameters, `when`, parallel stages, error handling', 'Module 4'],
      ['Git, webhooks, one pipeline per branch and pull request', 'Module 5'],
      ['Real CI for Java, Node.js and Python', 'Module 6'],
      ['Docker images built and deployed by Jenkins', 'Module 7'],
    ] },
  ],
}

export default CONTENU_BASES
