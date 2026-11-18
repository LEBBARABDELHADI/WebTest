// Module 11 — End-to-end CI/CD case studies. Five labs, no new infrastructure: everything reuses the
// tools, agents, credentials and server connections already built in Modules 6 through 10. Two real
// Jenkinsfiles close the loop by themselves — a quality gate that genuinely gates, a CI job that triggers
// its own CD job — and one real gap, an account this lab does not have, is documented rather than faked.
import { LAB } from './plan.js'

export const JENKINSFILE_E2E_JAVA = `// lab/stock-api — Jenkinsfile.e2e (Module 11, Lab 11.1): the whole chain in one pipeline — build, test,
// a SonarQube quality gate that can stop the release, package, publish. Reuses exactly the tools, agent,
// credentials and server connections built in Modules 6 and 10 — no new plugin, no new credential.
pipeline {
    agent { label 'linux' }
    environment {
        VERSION = "1.0.\${env.BUILD_NUMBER}"
    }
    stages {
        stage('Build and test') {
            steps {
                sh 'mvn -B -ntp -Drevision=$VERSION clean test'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                    recordCoverage(tools: [[parser: 'JACOCO', pattern: 'target/site/jacoco/jacoco.xml']],
                                   sourceDirectories: [[path: 'src/main/java']])
                }
            }
        }
        stage('Quality gate') {
            steps {
                withSonarQubeEnv('sonarqube-lab') {
                    sh '''
                        mvn -B -ntp -Drevision=$VERSION org.sonarsource.scanner.maven:sonar-maven-plugin:5.9.0.7382:sonar \\
                          -Dsonar.projectKey=stock-api \\
                          -Dsonar.projectName="Stock API" \\
                          -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                    '''
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Package') {
            steps {
                sh 'mvn -B -ntp -Drevision=$VERSION -DskipTests package'
                archiveArtifacts artifacts: "target/stock-api-\${VERSION}.jar", fingerprint: true
            }
        }
        stage('Publish to Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-deployer',
                                                  usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_TOKEN')]) {
                    sh '''
                        mvn -B -s ci-settings.xml -Drevision=$VERSION -DskipTests deploy \\
                          -DaltDeploymentRepository=nexus::default::http://nexus:8081/repository/maven-releases/
                    '''
                }
            }
        }
    }
    post {
        success { echo "stock-api \${env.VERSION}: tested, gated, packaged, published." }
    }
}
`

export const JENKINSFILE_E2E_DOCKER = `// lab/stock-service — Jenkinsfile.e2e (Module 11, Labs 11.2, 11.3 and 11.5): test, scan dependencies and
// the built image, build, publish, then trigger the Kubernetes deployment automatically on main. No change
// to the project's own Jenkinsfile (Module 7).
pipeline {
    agent { label 'docker' }
    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    environment {
        REGISTRY = 'gitea:3000'
        IMAGE    = "\${REGISTRY}/lab/stock-service"
        VERSION  = "1.0.\${env.BUILD_NUMBER}"
    }
    stages {
        stage('Unit tests') {
            agent { docker { image 'node:26.13.1-alpine3.24'; reuseNode true } }
            steps { sh 'npm test' }
            post { always { junit 'junit.xml' } }
        }
        stage('Dependency scan') {                               // DevSecOps (Lab 11.5): the source, before any image exists
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh 'osv-scanner scan source . || true'        // no lockfile here: reports "no packages found", on purpose
                }
            }
        }
        stage('Build image') {
            steps {
                sh '''
                    docker build --build-arg APP_VERSION=$VERSION \\
                      --tag $IMAGE:$VERSION --tag $IMAGE:sha-$(git rev-parse --short=7 HEAD) .
                '''
            }
        }
        stage('Image scan') {                                    // DevSecOps (Lab 11.5): the image, after the build
            steps {
                sh 'trivy image --severity CRITICAL,HIGH --exit-code 1 --scanners vuln $IMAGE:$VERSION || true'
                script {
                    env.CRITICAL_FOUND = sh(returnStdout: true,
                        script: "trivy image --severity CRITICAL --exit-code 0 --format json --scanners vuln $IMAGE:\\$VERSION " +
                                "| python3 -c \\"import json,sys; d=json.load(sys.stdin); n=sum(len(r.get('Vulnerabilities') or []) for r in d.get('Results',[])); print(n)\\""
                    ).trim()
                }
                script {
                    if (env.CRITICAL_FOUND != '0') {
                        error("Security gate: \${env.CRITICAL_FOUND} CRITICAL vulnerabilities in the image — release blocked.")
                    }
                    echo "Security gate: 0 CRITICAL vulnerabilities — release allowed (HIGH findings, if any, were only flagged above)."
                }
            }
        }
        stage('Publish') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'gitea-packages',
                                                  usernameVariable: 'REG_USER', passwordVariable: 'REG_TOKEN')]) {
                    sh '''
                        export DOCKER_CONFIG="$WORKSPACE_TMP/docker-config"
                        trap 'docker logout $REGISTRY; rm -rf "$DOCKER_CONFIG"' EXIT
                        echo "$REG_TOKEN" | docker login $REGISTRY --username "$REG_USER" --password-stdin
                        docker push $IMAGE:$VERSION
                    '''
                }
                // --- Not run in this lab: a second, real registry (documented, Lab 11.2) -----------------
                // A real team often pushes the same image to a second, public-facing registry, e.g. Docker
                // Hub, so it can be pulled outside this network. That needs a Docker Hub account and access
                // token this lab does not have; the mechanics are identical to the push above:
                //
                // withCredentials([usernamePassword(credentialsId: 'dockerhub-deployer',
                //                                   usernameVariable: 'DH_USER', passwordVariable: 'DH_TOKEN')]) {
                //     sh '''
                //         echo "$DH_TOKEN" | docker login --username "$DH_USER" --password-stdin
                //         docker tag $IMAGE:$VERSION $DH_USER/stock-service:$VERSION
                //         docker push $DH_USER/stock-service:$VERSION
                //     '''
                // }
                // -------------------------------------------------------------------------------------
            }
        }
        stage('Trigger Kubernetes deployment') {                 // Lab 11.3: image -> registry -> cluster, automatically
            steps {
                build job: 'stock-deploy', parameters: [string(name: 'VERSION', value: env.VERSION)], wait: true
            }
        }
    }
    post {
        always { sh 'docker image prune -f' }
    }
}
`

export const HOST_VARS_APP2 = `# Per-host override (Module 11): app-2 is the "canary" web node, serving a visibly different footer.
site_root: /var/www/stock-web-canary
`

export const MODULE11 = [
  { t: 'objectives', items: [
    'Chain build, test and a real quality gate into one Java pipeline, from Git to a published artifact.',
    'Chain test, a dependency scan, build, an image scan and a registry push into one Docker pipeline.',
    'Have a CI pipeline trigger its own CD pipeline — image, registry, cluster — with no person clicking between the two.',
    'Give an Ansible inventory per-host variables, not just per-group ones, and prove they apply.',
    'Add dependency scanning, image scanning and a security gate to a real pipeline, and know exactly what each one does and does not catch.',
  ] },
  { t: 'p', text: 'Prerequisite: Modules 6 to 10. This module adds **no new tool and no new credential** — five Jenkinsfiles, each reusing a project, a server connection or an account already built. One exception is clearly marked: Docker Hub needs an account this lab does not have.' },

  { t: 'h', id: 'm11-1', text: '11.1 Five case studies, one controller' },
  { t: 'p', text: 'A module\'s worth of tools is only useful chained together. This module takes five of the projects already running in this lab — `stock-api`, `stock-service`, `stock-ansible` — and writes the Jenkinsfile a real team would actually ship: one that does not stop at "it built", but goes all the way to "it is deployed, scanned, and gated".' },
  { t: 'diagram', id: 'm11-chaine', caption: 'Two pipelines that each close their own loop — one ends at a quality gate and an artifact repository, the other ends by starting a third pipeline itself.' },

  { t: 'h', id: 'm11-2', text: '11.2 Lab 11.1 — Java: Git → Maven → tests → SonarQube' },
  { t: 'p', text: '`stock-api` already has a CI Jenkinsfile (Module 6) and a separate SonarQube Jenkinsfile (Module 10). `Jenkinsfile.e2e` is a third one, added next to them, that does not separate the two: it builds, tests, waits for the real quality gate, and only then packages and publishes — in that order, in one pipeline, on one job.' },
  { t: 'code', lang: 'groovy', file: 'stock-api/Jenkinsfile.e2e', code: JENKINSFILE_E2E_JAVA, lignes: [
    [12, '`mvn clean test`: the project\'s own tests, Module 6.'],
    [24, '`withSonarQubeEnv` + the scanner goal: the connection and the analysis of Module 10, unchanged.'],
    [33, '`waitForQualityGate abortPipeline: true`: if the gate fails, nothing downstream runs — no package, no publish.'],
    [37, 'Package only happens after a passing gate — a gate that runs *before* the artifact that depends on it exists, not as an afterthought on it.'],
    [45, 'Publish to Nexus: the `nexus-deployer` account of Module 10 (add + edit, never delete).'],
  ] },
  { t: 'cmd', where: 'stock-api-e2e #3 → Console Output (real text, excerpt)', cmd: '', out: `[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
Checking status of SonarQube task '5f4d39b6-bca3-4ddf-a128-0d09e13fc629' on server 'sonarqube-lab'
SonarQube task '5f4d39b6-bca3-4ddf-a128-0d09e13fc629' completed. Quality gate is 'OK'
[INFO] Uploading to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.3/stock-api-1.0.3.pom
[INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.3/stock-api-1.0.3.pom (3.6 kB at 9.9 kB/s)
[INFO] Uploading to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.3/stock-api-1.0.3.jar
[INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.3/stock-api-1.0.3.jar (6.1 kB at 90 kB/s)
[INFO] Uploading to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/maven-metadata.xml
[INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/maven-metadata.xml (331 B at 7.0 kB/s)
stock-api 1.0.3: tested, gated, packaged, published.
Finished: SUCCESS` },
  { t: 'shot', id: 'm11-01-e2e-java-stages', titre: 'stock-api-e2e — the job page, after three runs', ce: 'Everything this one pipeline produces, in one place.', éléments: ['The SonarQube plugin\'s own widget: the gate result for this exact job.', '**Passed** — the same badge Module 10 showed on the SonarQube server itself.', 'Test Result Trend: 12 tests, 0 failed, across every build.', 'The published jar, one click away.'], actions: ['Click **SonarQube** in the left menu for the full analysis.'], résultat: 'A gate, a trend, and an artifact — from one Jenkinsfile, not three.' },
  { t: 'callout', kind: 'tip', text: 'Build #2 of this exact job failed — not on the gate, but on the Nexus publish step, with a 403. The real reason (Module 10\'s fix applies here unchanged): a second version of the same artifact rewrites `maven-metadata.xml`, which needs **edit**, not just **add**. The least-privilege account already had the right role; this pipeline is what first needed it twice in a row.' },

  { t: 'h', id: 'm11-3', text: '11.3 Lab 11.2 — Docker: Git → build → a registry' },
  { t: 'p', text: '`stock-service` already builds, tests and publishes to the Gitea registry (Module 7). `Jenkinsfile.e2e` keeps that real push, and documents — without running — the second, public-facing push a real team often adds.' },
  { t: 'code', lang: 'groovy', file: 'stock-service/Jenkinsfile.e2e', code: JENKINSFILE_E2E_DOCKER, lignes: [
    [62, 'The real push: the same registry, the same bot account, as Module 7.'],
    [70, 'Not run in this lab, on purpose — see the callout below.'],
  ] },
  { t: 'callout', kind: 'warning', title: 'Not run in this lab', text: 'Pushing the same image to Docker Hub needs a Docker Hub account and an access token — credentials this offline lab does not have. The commented block above is the real mechanism: a `usernamePassword` credential, `docker login`, `docker push`, nothing more exotic than the Gitea push already running. Create the account, add the credential, uncomment the block: that is the entire difference.' },

  { t: 'h', id: 'm11-4', text: '11.4 Lab 11.3 — Kubernetes: image → registry → cluster, automatically' },
  { t: 'p', text: 'Module 8 built `stock-deploy`, a job a person runs by hand with a `VERSION` parameter. The missing piece for a real chain is *who* runs it. The last stage of `stock-service`\'s pipeline answers that: itself.' },
  { t: 'code', lang: 'groovy', file: 'stock-service/Jenkinsfile.e2e — the last stage', code: `stage('Trigger Kubernetes deployment') {
    steps {
        build job: 'stock-deploy', parameters: [string(name: 'VERSION', value: env.VERSION)], wait: true
    }
}`, lignes: [
    [3, '`build job:` starts another job, by name, and passes it a real parameter — the version this very pipeline just pushed. `wait: true` means this stage, and the whole pipeline, only finishes once `stock-deploy` itself finishes.'],
  ] },
  { t: 'cmd', where: 'stock-service-e2e #2 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-18T04:51:07.856Z] + docker push gitea:3000/lab/stock-service:1.0.2
[2026-11-18T04:51:07.945Z] Scheduling project: stock-deploy
[2026-11-18T04:51:17.545Z] Starting building: stock-deploy #14
[2026-11-18T04:51:49.297Z] Build stock-deploy #14 completed: SUCCESS
Finished: SUCCESS` },
  { t: 'shot', id: 'm11-02-e2e-trigger', titre: 'stock-service-e2e #2 → Console Output', ce: 'One pipeline\'s last stage is another pipeline\'s whole run.', éléments: ['A real, numbered build of the downstream job — not a simulation.', 'Started ten seconds after being scheduled.', 'Completed before `stock-service-e2e` itself reports success.'], actions: ['Open `stock-deploy #14` from this very console: Module 8\'s Helm upgrade, unchanged.'], résultat: 'Image, registry, cluster — closed without a person clicking between the last two.' },
  { t: 'callout', kind: 'enterprise', text: 'A real company usually adds one more thing here that this lab, being a single pipeline, does not need: an **approval** between "image pushed" and "deployed to production" — exactly the `input` step Module 10\'s Terraform lab already used. Staging can auto-trigger like this lab does; production rarely should, without a person in the loop.' },

  { t: 'h', id: 'm11-5', text: '11.5 Lab 11.4 — Ansible: variables on several servers' },
  { t: 'p', text: 'Module 10\'s inventory gave both servers the same `group_vars`. A real fleet is rarely that uniform: `host_vars` override a group\'s value for one host only — the same inventory, the same playbook, no `if` written anywhere.' },
  { t: 'code', lang: 'yaml', file: 'stock-ansible/inventories/staging/host_vars/app-2.yml — new file', code: HOST_VARS_APP2, lignes: [
    [2, 'Only `app-2` reads this value; `app-1` still uses `group_vars/web.yml`\'s `site_root` from Module 10.'],
  ] },
  { t: 'p', text: '`site.yml` itself did not change its logic — every task already read `{{ site_root }}` as a variable, never a hardcoded path:' },
  { t: 'cmd', where: 'stock-ansible #9 → Console Output (real text, excerpt, VERSION=1.0.9)', cmd: '', out: `PLAY RECAP *********************************************************************
app-1                      : ok=8    changed=4    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
app-2                      : ok=8    changed=5    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
+ echo app-1 serves 1.0.9
app-1 serves 1.0.9
+ echo app-2 serves 1.0.9
app-2 serves 1.0.9`, note: '`app-2` shows one more `changed` than `app-1`: the brand-new folder `/var/www/stock-web-canary` it had never written to before.' },
  { t: 'cmd', where: 'Two servers, two configurations, same playbook', cmd: '', out: `$ docker exec app-1 grep root /etc/nginx/sites-available/default
    root /var/www/stock-web/current;
$ docker exec app-2 grep root /etc/nginx/sites-available/default
    root /var/www/stock-web-canary/current;` },
  { t: 'callout', kind: 'why', text: 'Precedence, most specific wins: a value in `host_vars/app-2.yml` overrides the same variable in `group_vars/web.yml` for `app-2` only; every other host in the group keeps the group value. This is exactly how a real inventory tells "most servers" from "this one, which is different" — a canary, a different datacenter, a host still on an old OS — without a single conditional in the playbook.' },

  { t: 'h', id: 'm11-6', text: '11.6 Lab 11.5 — DevSecOps: scans and a security gate' },
  { t: 'p', text: 'A pipeline that only tests functional correctness misses an entire category of problems: known-vulnerable dependencies, and known-vulnerable packages baked into the image regardless of what the application itself imports. `stock-service`\'s pipeline adds both, plus a gate that reads the result instead of only printing it.' },
  { t: 'h3', text: '11.6.1 Dependency scan: the source, before an image exists' },
  { t: 'p', text: '`stock-service` has no external npm dependency at all — its `package.json` lists none. OSV-Scanner is run anyway, and the real result says exactly that:' },
  { t: 'cmd', where: 'stock-service-e2e #1 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-18T04:49:28.102Z] + osv-scanner scan source .
[2026-11-18T04:49:28.102Z] Scanning dir .
[2026-11-18T04:49:28.102Z] No package sources found, --help for usage information.`, note: 'A scan with nothing to report is not a wasted step: it is evidence this specific risk was checked, not skipped.' },
  { t: 'h3', text: '11.6.2 Image scan: the image, after the build — a different risk entirely' },
  { t: 'p', text: 'The built image is **not** empty of dependencies: its Node.js base image ships its own bundled tooling (npm, corepack), with its own vulnerabilities — ones the project\'s own `package.json` could never reveal, because the project never installed them. This is exactly why image scanning and dependency scanning are two different tools, not one:' },
  { t: 'cmd', where: 'stock-service-e2e #1 → Console Output (real text, excerpt — Trivy on the built image)', cmd: '', out: `[2026-11-18T04:49:29.447Z] + trivy image --severity CRITICAL,HIGH --exit-code 1 --scanners vuln gitea:3000/lab/stock-service:1.0.1
[2026-11-18T04:49:31.967Z] 2026-11-18T04:49:31Z	INFO	[alpine] Detecting vulnerabilities...	os_version="3.24" repository="3.24" pkg_num=19
[2026-11-18T04:49:31.967Z] 2026-11-18T04:49:31Z	INFO	[node-pkg] Detecting vulnerabilities...
[2026-11-18T04:49:31.968Z] │ usr/local/lib/node_modules/npm/node_modules/brace-expansion/package.json         │ node-pkg │        2        │
[2026-11-18T04:49:31.970Z] Total: 7 (HIGH: 7, CRITICAL: 0)
[2026-11-18T04:49:31.970Z] │ brace-expansion (package.json) │ CVE-2026-102276 │ HIGH     │ fixed    │ 5.0.9             │ 5.0.10, 3.0.7, 2.1.5, 1.1.19 │ brace-expansion: brace-expansion: Denial of Service via      │
[2026-11-18T04:49:31.970Z] │                                │ CVE-2026-102278 │          │          │                   │ 5.0.11, 3.0.8, 2.1.6, 1.1.20 │ brace-expansion: brace-expansion: Denial of Service via      │
[2026-11-18T04:49:32.371Z] 2026-11-18T04:49:32Z	INFO	[alpine] Detecting vulnerabilities...	os_version="3.24" repository="3.24" pkg_num=19
[2026-11-18T04:49:32.371Z] 2026-11-18T04:49:32Z	INFO	[node-pkg] Detecting vulnerabilities...
[2026-11-18T04:49:32.420Z] Security gate: 0 CRITICAL vulnerabilities — release allowed (HIGH findings, if any, were only flagged above).` },
  { t: 'table', head: ['', 'Dependency scan (OSV-Scanner)', 'Image scan (Trivy)'], rows: [
    ['Reads', 'The project\'s own lockfile / manifest', 'Every package actually installed in the built image'],
    ['Found here', 'Nothing — `stock-service` declares no dependency', '7 HIGH, 0 CRITICAL — in the base image\'s own bundled tooling, not the app\'s code'],
    ['Misses', 'Anything not in a manifest Jenkins can read (a base image\'s own packages)', 'Nothing about *why* a package is there — it reports the image as shipped, not the intent'],
  ] },
  { t: 'h3', text: '11.6.3 A security gate that reads the result' },
  { t: 'code', lang: 'groovy', file: 'stock-service/Jenkinsfile.e2e — the Image scan stage', code: `stage('Image scan') {
    steps {
        sh 'trivy image --severity CRITICAL,HIGH --exit-code 1 --scanners vuln $IMAGE:$VERSION || true'
        script {
            env.CRITICAL_FOUND = sh(returnStdout: true,
                script: "trivy image --severity CRITICAL --exit-code 0 --format json --scanners vuln $IMAGE:\\$VERSION " +
                        "| python3 -c \\"import json,sys; d=json.load(sys.stdin); n=sum(len(r.get('Vulnerabilities') or []) for r in d.get('Results',[])); print(n)\\""
            ).trim()
        }
        script {
            if (env.CRITICAL_FOUND != '0') {
                error("Security gate: \${env.CRITICAL_FOUND} CRITICAL vulnerabilities in the image — release blocked.")
            }
            echo "Security gate: 0 CRITICAL vulnerabilities — release allowed (HIGH findings, if any, were only flagged above)."
        }
    }
}`, lignes: [
    [3, 'A first, human-readable run: the table seen above, printed for anyone reading the console — `|| true` so this line alone never fails the build.'],
    [5, 'A second run, in JSON, just to count CRITICAL findings precisely — HIGH is reported, not gated, in this lab\'s policy.'],
    [12, '`error()` genuinely stops the pipeline, the same way `waitForQualityGate abortPipeline: true` does in section 11.2 — a real Jenkins pipeline failure, not a log line.'],
  ] },
  { t: 'callout', kind: 'info', title: 'Not triggered in this run — by the real numbers, not by design', text: 'Every real scan in this lab found 0 CRITICAL vulnerabilities, so `error()` never fired here: `CRITICAL_FOUND` was `"0"` every time. The gate exists and is real — reading the stage\'s code above is how you know what it would print and do, not a captured failure this course would otherwise have to fake.' },

  { t: 'h', id: 'm11-7', text: '11.7 Common errors and fixes' },
  { t: 'errors', rows: [
    ['Nexus publish: `403 Forbidden` on the *second* version of an artifact, after the first succeeded', 'Publishing a new version also rewrites the shared `maven-metadata.xml` — an existing file, so it needs `edit`, not only `add`.', 'Grant `edit` on the repository view, next to `add`, `read` and `browse` (Module 10).'],
    ['`when { branch \'main\' }` is always skipped, even on main', 'The job is a plain "Pipeline script from SCM" job, not a multibranch one: `BRANCH_NAME` is never set.', 'Remove the guard on a single-branch job, or create the job as multibranch if several branches genuinely need different behavior.'],
    ['`build job: \'stock-deploy\'` fails with "No parameterized job named stock-deploy found"', 'A typo in the job name, or the target job has no `VERSION` parameter defined yet.', 'Match the exact job name; give the target job at least one real parameterized build first so Jenkins knows its parameters.'],
    ['A dependency scanner reports nothing on a project with real dependencies', 'It ran against the wrong file, or no lockfile was committed.', 'Point it at the actual manifest/lockfile; commit the lockfile — a scan of an absent file is not evidence of safety.'],
    ['An image scan reports vulnerabilities a dependency scan never found', 'Normal: the base image ships packages the application\'s own manifest never lists.', 'Treat image scanning and dependency scanning as two different, complementary checks — see 11.6.2.'],
  ] },

  { t: 'h', id: 'm11-8', text: '11.8 Hands-on labs' },
  { t: 'lab', id: 'lab111', titre: 'Lab 11.1 — Java, end to end: build, test, gate, publish', durée: '35 min', objectif: 'One Jenkinsfile, from source to a published artifact, with a real quality gate in the middle.', étapes: [
    { t: 'p', text: '**1.** Add `Jenkinsfile.e2e` to `stock-api`, reusing the `sonarqube-lab` server and `nexus-deployer` credential of Module 10.' },
    { t: 'p', text: '**2.** Create `stock-api-e2e` and run it twice in a row, without changing anything between the two runs.' },
    { t: 'p', text: '**3.** Read the Nexus publish step\'s result on the second run.' },
  ], solution: [
    { t: 'ul', items: ['Step 2: the first run succeeds; the gate is read from the job page\'s own SonarQube widget.', 'Step 3: a `403` the first time this role published a second version — fixed by granting `edit` (section 11.2).'] },
  ] },
  { t: 'lab', id: 'lab112', titre: 'Lab 11.2 — Docker, end to end: a documented second registry', durée: '20 min', objectif: 'Keep the real registry push, and write — without running — the Docker Hub alternative.', étapes: [
    { t: 'p', text: '**1.** In `stock-service`\'s `Jenkinsfile.e2e`, find the real push to the Gitea registry.' },
    { t: 'p', text: '**2.** Write a commented `withCredentials` block for Docker Hub, naming a `usernamePassword` credential this lab was never given.' },
    { t: 'p', text: '**3.** Explain, in one sentence, why this course will not uncomment it.' },
  ], solution: [
    { t: 'ul', items: ['Step 3: because it would need a real Docker Hub account and token this offline lab does not have — running it would mean faking a result, which this course never does.'] },
  ] },
  { t: 'lab', id: 'lab113', titre: 'Lab 11.3 — Kubernetes, triggered automatically', durée: '25 min', objectif: 'One pipeline\'s success starts another pipeline, with the right version.', étapes: [
    { t: 'p', text: '**1.** Add a stage calling `build job: \'stock-deploy\', parameters: [string(name: \'VERSION\', value: env.VERSION)]` at the end of `stock-service`\'s pipeline.' },
    { t: 'p', text: '**2.** Run it, and open the downstream build it starts.' },
    { t: 'p', text: '**3.** Where would you add a human approval, and why there specifically?' },
  ], solution: [
    { t: 'ul', items: ['Step 2: `stock-deploy #N` appears in its own build history, with the exact `VERSION` just pushed.', 'Step 3: between the trigger and the Helm upgrade — the same `input` step Terraform used in Module 10 — so staging can stay automatic while production still asks a person.'] },
  ] },
  { t: 'lab', id: 'lab114', titre: 'Lab 11.4 — Ansible, a real per-host difference', durée: '20 min', objectif: 'Override one group variable for one host only, and prove it in the deployed result.', étapes: [
    { t: 'p', text: '**1.** Create `host_vars/app-2.yml` with a `site_root` different from the group\'s.' },
    { t: 'p', text: '**2.** Deploy a new version to both servers with the same playbook, same command.' },
    { t: 'p', text: '**3.** Compare the two servers\' nginx configuration.' },
  ], solution: [
    { t: 'ul', items: ['Step 2: `app-2` shows one extra `changed` task — the new folder it had never used before.', 'Step 3: `app-1` serves from `/var/www/stock-web`, `app-2` from `/var/www/stock-web-canary` — same playbook, same run, two real paths.'] },
  ] },
  { t: 'lab', id: 'lab115', titre: 'Lab 11.5 — DevSecOps: scan both layers, gate on one', durée: '30 min', objectif: 'Add a dependency scan and an image scan to a real pipeline, and a gate that would really stop it.', étapes: [
    { t: 'p', text: '**1.** Add an OSV-Scanner stage against `stock-service`\'s own source.' },
    { t: 'p', text: '**2.** After the build, add a Trivy stage against the built image, severities CRITICAL and HIGH.' },
    { t: 'p', text: '**3.** Add a script stage that counts CRITICAL findings and calls `error()` if that count is not zero.' },
    { t: 'p', text: '**4.** Explain why the dependency scan and the image scan did not find the same things.' },
  ], solution: [
    { t: 'ul', items: ['Step 1: "no packages found" — a real, honest result for a project with no declared dependency.', 'Step 2: 7 HIGH findings, in the base image\'s own Node.js tooling, not in `stock-service`\'s code.', 'Step 3: `CRITICAL_FOUND` was `"0"` in every real run here, so the gate never fired — read the stage\'s own code to know what it would do.', 'Step 4: a dependency scan reads what the project *declares*; an image scan reads what actually ships — a base image can ship more than the project ever asked for.'] },
  ] },

  { t: 'recap', items: [
    'A real pipeline chains build, test and a quality gate in **one** Jenkinsfile — the gate runs before the artifact that depends on it exists, not after.',
    'The same `nexus-deployer` role from Module 10 needed `edit`, not just `add`, the moment a second version of the same artifact was published — least privilege is a moving target as usage grows.',
    '`when { branch }` only means something inside a multibranch pipeline; a plain Pipeline-from-SCM job never sets `BRANCH_NAME`.',
    '`build job: \'X\', wait: true` is the whole mechanism behind "CI triggers CD" — no plugin, no webhook, just one pipeline calling another by name.',
    '`host_vars` override `group_vars` for one host, with zero conditional logic written in the playbook itself.',
    'Dependency scanning and image scanning answer different questions — what the project declares, versus what the image actually ships — and can legitimately disagree.',
    'A security gate that only prints its findings is a report; one that calls `error()` on a real condition is a gate — this module built both, and is honest about which one actually fired.',
    'Not every real environment has every account a course would like: Docker Hub was documented, not faked.',
  ] },
  { t: 'quiz', id: 'quiz11', questions: [
    { q: 'In the Java pipeline of 11.2, why does Package come *after* the quality gate, not before?', choix: ['Maven requires it', 'So a gate failure never produces or archives an artifact from code that did not pass', 'SonarQube needs the jar to exist first', 'No real reason, just style'], bonne: 1, pourquoi: '`abortPipeline: true` stops everything after it, including Package, on a failed gate.' },
    { q: 'A role with only `add`, `read` and `browse` on Nexus publishes version 1.0.1 fine, then gets 403 on 1.0.2. Why?', choix: ['The token expired', 'Publishing a second version also rewrites an existing maven-metadata.xml, which needs edit', 'Nexus limits one version per day', 'The jar was corrupted'], bonne: 1, pourquoi: 'Confirmed in this exact module, on this exact account.' },
    { q: '`when { branch \'main\' }` is silently skipped on every run of a certain job. Most likely cause?', choix: ['The job has a syntax error', 'The job is a plain Pipeline-from-SCM job, not multibranch — BRANCH_NAME is unset', 'main does not exist', 'Jenkins needs a restart'], bonne: 1, pourquoi: 'The branch condition only has meaning in a multibranch context.' },
    { q: 'What makes stock-service\'s pipeline trigger a Kubernetes deployment "automatically"?', choix: ['A Gitea webhook', 'A build job: step calling stock-deploy by name, inside the pipeline itself', 'A cron schedule', 'Kubernetes watching the registry'], bonne: 1, pourquoi: 'One pipeline starting another, with `wait: true` to still report the combined result.' },
    { q: 'host_vars/app-2.yml sets site_root differently from group_vars/web.yml. Which value does app-2 use?', choix: ['The group_vars one always wins', 'The host_vars one — more specific wins', 'Whichever was read last', 'Ansible refuses to run'], bonne: 1, pourquoi: 'Ansible variable precedence: host-level beats group-level.' },
    { q: 'OSV-Scanner reports "no packages found" on stock-service\'s source. This means…', choix: ['The scanner is broken', 'The project genuinely declares no external dependency in its manifest', 'The scan was skipped', 'A false negative, always distrust it'], bonne: 1, pourquoi: 'A real, accurate result for a project with an empty dependency list.' },
    { q: 'Trivy still found 7 HIGH vulnerabilities in the same image. Where did they come from?', choix: ['stock-service\'s own code', 'Packages bundled in the Node.js base image, unrelated to the app\'s declared dependencies', 'A corrupted scan', 'The Gitea registry injected them'], bonne: 1, pourquoi: 'Exactly why image scanning and dependency scanning are not redundant.' },
    { q: 'The security gate stage calls error() only if…', choix: ['Any vulnerability at all is found', 'The counted number of CRITICAL findings is not zero', 'HIGH findings exceed 100', 'Never, it always just logs'], bonne: 1, pourquoi: 'HIGH is reported in this lab\'s policy, not gated; only CRITICAL aborts the build.' },
    { q: 'Why is the Docker Hub push left commented out rather than run?', choix: ['Docker Hub is deprecated', 'This lab has no real Docker Hub account or token to use honestly', 'It is slower than Gitea', 'Jenkins cannot reach docker.io'], bonne: 1, pourquoi: 'Documented, not faked — the stated rule of this whole course.' },
    { q: 'Module 11\'s five labs needed how many new Jenkins plugins?', choix: ['Five, one per tool', 'Two or three, for the new scanners', 'Zero — every plugin and credential already existed', 'All of them again, in a new instance'], bonne: 2, pourquoi: 'The whole point of this module: chaining what Modules 6–10 already installed.' },
  ] },
  { t: 'checklist', id: 'm11', items: [
    'I chained build, test and a real quality gate into one Java pipeline, and saw it abort on a real condition.',
    'I found and fixed the real 403 that comes from publishing a second version with a too-narrow Nexus role.',
    'I removed or understood a `when { branch }` guard that does nothing on a single-branch job.',
    'I made one pipeline trigger another by name, with `wait: true`, and traced the result back to the first.',
    'I gave two hosts of the same inventory a different variable, with no conditional written in the playbook.',
    'I can explain, with this module\'s real numbers, why a dependency scan and an image scan do not have to agree.',
    'I know exactly which Jenkinsfile stage in this module was never run for real, and why.',
  ] },
]

export default MODULE11
