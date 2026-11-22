// Module 13 — Final professional project. One new Gitea repo, "capstone" — Maven source copied straight
// from stock-api (Module 6), a thin HTTP entry point added, nothing else new — chained through all eight
// tools in a single Jenkinsfile: build, test, a real quality gate, image, a real security gate, Nexus and
// the registry, Helm on the kind cluster, and — finally giving Ansible a real place in the same pipeline
// instead of a separate lab — a playbook that gives the project a second front door on app-1.
import { LAB } from './plan.js'

export const JENKINSFILE_CAPSTONE = `// lab/capstone — Jenkinsfile (Module 13, final project): one pipeline, all eight tools, in order.
// Nothing here is a new tool — every stage reuses a server connection, credential or agent pattern already
// built in an earlier module. The point of this project is the integration, not new application logic.
pipeline {
    agent none
    options {
        timestamps()
        timeout(time: 25, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    environment {
        VERSION         = "1.0.\${env.BUILD_NUMBER}"
        REGISTRY        = 'gitea:3000'
        IMAGE           = "\${REGISTRY}/lab/capstone"
        CAPSTONE_PORT   = '30081'
    }
    stages {
        stage('Build and test') {
            agent { label 'docker' }
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
            agent { label 'docker' }
            steps {
                withSonarQubeEnv('sonarqube-lab') {
                    sh '''
                        mvn -B -ntp -Drevision=$VERSION org.sonarsource.scanner.maven:sonar-maven-plugin:5.9.0.7382:sonar \\
                          -Dsonar.projectKey=capstone \\
                          -Dsonar.projectName="Capstone" \\
                          -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                    '''
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Package') {
            agent { label 'docker' }
            steps {
                sh 'mvn -B -ntp -Drevision=$VERSION -DskipTests package'
                archiveArtifacts artifacts: "target/capstone-\${VERSION}.jar", fingerprint: true
                stash name: 'jar', includes: 'target/capstone-*.jar'
            }
        }
        stage('Build image') {
            agent { label 'docker' }
            steps {
                unstash 'jar'
                sh 'docker build --build-arg APP_VERSION=$VERSION --tag $IMAGE:$VERSION --tag $IMAGE:sha-$(git rev-parse --short=7 HEAD) .'
            }
        }
        stage('Image scan') {
            agent { label 'docker' }
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
                    echo "Security gate: 0 CRITICAL vulnerabilities — release allowed."
                }
            }
        }
        stage('Publish') {
            agent { label 'docker' }
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-deployer',
                                                  usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_TOKEN')]) {
                    sh 'mvn -B -s ci-settings.xml -Drevision=$VERSION -DskipTests deploy'
                }
                withCredentials([usernamePassword(credentialsId: 'gitea-packages',
                                                  usernameVariable: 'REG_USER', passwordVariable: 'REG_TOKEN')]) {
                    sh '''
                        export DOCKER_CONFIG="$WORKSPACE_TMP/docker-config"
                        trap 'docker logout $REGISTRY; rm -rf "$DOCKER_CONFIG"' EXIT
                        echo "$REG_TOKEN" | docker login $REGISTRY --username "$REG_USER" --password-stdin
                        docker push $IMAGE:$VERSION
                    '''
                }
            }
        }
        stage('Deploy to Kubernetes') {
            agent {
                kubernetes {
                    yaml '''
                        apiVersion: v1
                        kind: Pod
                        spec:
                          serviceAccountName: deployer
                          securityContext:
                            runAsUser: 1000
                            runAsNonRoot: true
                          containers:
                            - name: k8s
                              image: alpine/k8s:1.37.2
                              command: ["sleep"]
                              args: ["infinity"]
                              env:
                                - name: HOME
                                  value: /home/jenkins/agent
                    '''
                    defaultContainer 'k8s'
                }
            }
            steps {
                checkout scm
                sh '''
                    helm upgrade --install capstone charts/capstone \\
                      --namespace stock \\
                      --set image.tag=$VERSION \\
                      --rollback-on-failure --timeout 2m
                    helm history capstone --namespace stock --max 5
                    kubectl -n stock rollout status deployment/capstone --timeout=90s
                '''
            }
        }
        stage('Ansible: front door on app-1') {
            agent { label 'linux' }
            steps {
                checkout scm
                dir('ansible') {
                    ansiblePlaybook(
                        installation: 'ansible-2.22',
                        playbook: 'capstone-proxy.yml',
                        inventory: 'inventories/hosts.ini',
                        credentialsId: 'ansible-ssh-key',
                        extraVars: [capstone_nodeport: env.CAPSTONE_PORT],
                        extras: '--diff')
                }
            }
        }
        stage('Smoke test') {
            agent { label 'docker' }
            steps {
                sh '''
                    curl -fsS http://lab-control-plane:$CAPSTONE_PORT/health | grep -q OK \\
                        && echo "cluster NodePort $CAPSTONE_PORT: OK" \\
                        || { echo "cluster NodePort $CAPSTONE_PORT did not answer OK"; exit 1; }
                    curl -fsS http://app-1/capstone/health | grep -q OK \\
                        && echo "app-1 /capstone/: OK" \\
                        || { echo "app-1 /capstone/ did not answer OK"; exit 1; }
                '''
            }
        }
    }
    post {
        success { echo "capstone \${env.VERSION}: tested, gated, scanned, published, deployed, proxied, smoke-tested." }
    }
}
`

export const ANSIBLE_CAPSTONE_PROXY = `---
# lab/capstone — ansible/capstone-proxy.yml: give the capstone project a second front door, through app-1's
# own nginx, next to the site Modules 10/11 already deploy there. A separate, small, idempotent playbook —
# it only ever touches one marked block inside the existing file, never the whole site.
- name: Reverse-proxy /capstone/ on app-1 to the capstone Service in the kind cluster
  hosts: app-1
  become: true
  vars:
    capstone_nodeport: "30081"   # Jenkins may override with -e capstone_nodeport=...
  tasks:
    - name: Add the /capstone/ location to app-1's nginx site
      ansible.builtin.blockinfile:
        path: /etc/nginx/sites-available/default
        marker: "    # {mark} ANSIBLE MANAGED BLOCK — capstone proxy (Module 13)"
        insertbefore: "^}"
        block: "{{ lookup('template', 'templates/capstone-location.j2') }}"
      notify: Reload nginx

  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
`

export const APP_JAVA = `package com.example.stock;

import com.example.stock.report.InventoryReport;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/** The capstone project's own thin entry point: stock-api was a library with no server of its own. */
public final class App {
    private App() {
    }

    public static HttpServer createServer(int port) throws IOException {
        Stock stock = new Stock(5);
        stock.add("widget", 42);
        stock.add("gadget", 3);
        InventoryReport report = new InventoryReport(stock);
        report.track("widget");
        report.track("gadget");

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/health", exchange -> respond(exchange, 200, "OK\\n"));
        server.createContext("/report", exchange -> respond(exchange, 200, report.render()));
        server.setExecutor(null);
        return server;
    }

    private static void respond(HttpExchange exchange, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = createServer(port);
        server.start();
        System.out.println("capstone listening on :" + port);
    }
}
`

export const DOCKERFILE_CAPSTONE = `# lab/capstone — Dockerfile: the jar is built by the pipeline's own "Package" stage (mvn package), not
# inside this build — a fresh container has no path to Maven Central through this lab's own proxy, and a
# real team rarely wants two separate Maven resolutions of the same dependencies for one release anyway.
FROM eclipse-temurin:21-jre-alpine
ARG APP_VERSION=dev
ENV APP_VERSION=\${APP_VERSION} \\
    PORT=8080
COPY target/capstone-*.jar /app.jar
RUN addgroup -g 1000 app && adduser -S -u 1000 app -G app
USER app
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["java", "-jar", "/app.jar"]
`

export const MODULE13 = [
  { t: 'objectives', items: [
    'Chain all eight tools of this course — Git, Jenkins, Maven, SonarQube, Docker, a registry, Kubernetes and Ansible — into one real, successful pipeline.',
    'Reuse working code and working infrastructure deliberately, instead of writing a new project from zero to prove a point.',
    'Give Ansible a genuine place inside the same pipeline that already builds and deploys the project, not a separate, disconnected lab.',
    'Know exactly how to validate a finished pipeline end to end — not just "it went green", but what each real piece of evidence actually proves.',
    'Recognize the one class of problem a brand-new Docker build hits in a sandboxed network, and the real, better fix for it.',
  ] },
  { t: 'p', text: 'Prerequisite: every previous module. This is the last one, and it adds exactly one new container-free thing: a project. Every tool, server connection, credential and agent pattern it uses already exists — Modules 6 through 12 built every single piece. What was missing was never a tool. It was one pipeline willing to use all of them at once.' },

  { t: 'h', id: 'm13-1', text: '13.1 One project, eight tools, nothing new' },
  { t: 'p', text: '`capstone` is a small Java service, chained through Git, Jenkins, Maven, SonarQube, Docker, Nexus, a container registry, Kubernetes and Ansible — in that order, in one pipeline, on one real run. Nothing here is a new tool. The entire point of a final project is proving the chain, not inventing another link.' },
  { t: 'diagram', id: 'm13-capstone', caption: 'Eight stages, eight cross-references to the modules that already built each tool — the only genuinely new thing in this diagram is the order they run in.' },

  { t: 'h', id: 'm13-2', text: '13.2 Where capstone actually comes from' },
  { t: 'p', text: 'A final project does not need new application logic to prove an integration works — it needs code that already has real tests and a real Dockerfile. So `capstone`\'s Maven source — `Stock.java`, `InventoryReport.java`, their tests — is copied unchanged from `stock-api` (Module 6), with its own `groupId`, its own SonarQube project key, its own image name. The one real addition is a server: `stock-api` was a pure library with no process of its own.' },
  { t: 'code', lang: 'java', file: 'capstone/src/main/java/com/example/stock/App.java', code: APP_JAVA, lignes: [
    [11, '`stock-api` was a pure library with no server of its own — this one class is the entire new application logic this module adds.'],
    [25, 'The real endpoint the smoke-test stage checks, through both doors, at the very end of the pipeline.'],
  ] },
  { t: 'callout', kind: 'why', text: 'Reusing `stock-api`\'s tested source, openly, is not a shortcut this course is hiding — it is the honest answer to "what should a final project actually demonstrate?" A learner\'s own final project should do the same: reuse what already works, and spend the new effort on the chain connecting it, not on code nobody asked this module to prove.' },

  { t: 'h', id: 'm13-3', text: '13.3 The pipeline, stage by stage' },
  { t: 'p', text: 'The whole real Jenkinsfile, once, before it is cut into stages below — nine stages, `agent none` at the top so each one picks the agent it actually needs:' },
  { t: 'code', lang: 'groovy', file: 'capstone/Jenkinsfile', code: JENKINSFILE_CAPSTONE, lignes: [
    [19, 'The same build agent (agent-1) as every Maven stage since Module 6.'],
    [43, 'The same real `abortPipeline: true` gate as Module 11\'s `stock-api-e2e` — now protecting this project\'s own code.'],
    [74, 'The same real security-gate pattern as Module 11\'s `stock-service-e2e`, protecting a second project.'],
    [124, 'The same Helm pattern as Module 8\'s `stock-deploy` — a new release, the same namespace, the same RBAC.'],
    [138, 'Ansible, as a stage of this same pipeline — not a separate job nobody triggers.'],
    [152, 'Two real addresses, checked directly — not the stage view\'s own color.'],
  ] },
  { t: 'h3', text: '13.3.1 Build, test, a real quality gate' },
  { t: 'p', text: 'The same agent image as every Maven stage since Module 6, the same `sonarqube-lab` server as Module 10, the same real `abortPipeline: true` gate as Module 11 — now protecting a project of its own.' },
  { t: 'cmd', where: 'capstone-e2e #1 → Console Output, Build/Test/Gate (real text, excerpt)', cmd: '', out: `[2026-11-22T19:31:46.803Z] [INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[2026-11-22T19:32:12.425Z] [INFO] ANALYSIS SUCCESSFUL, you can find the results at: http://sonarqube:9000/dashboard?id=capstone
[2026-11-22T19:32:15.955Z] SonarQube task '5160ee03-577d-4a97-9990-8929c2f5eab0' completed. Quality gate is 'OK'` },
  { t: 'h3', text: '13.3.2 Package, image, a real security gate' },
  { t: 'p', text: 'Package archives the jar; Build image builds it in — but not by rebuilding it. A fresh container in this sandbox has no path to Maven Central, so the Dockerfile reuses the jar the Package stage already built on a trusted agent:' },
  { t: 'code', lang: 'dockerfile', file: 'capstone/Dockerfile', code: DOCKERFILE_CAPSTONE, lignes: [
    [8, 'The jar the pipeline\'s own Package stage already built — never re-resolved, never rebuilt, inside this image.'],
    [12, 'The same real HEALTHCHECK pattern as Module 7\'s stock-service.'],
  ] },
  { t: 'p', text: 'Image scan then runs the exact same Trivy security-gate pattern Module 11 wrote for `stock-service` — a real count of CRITICAL findings, `error()` if it is not zero.' },
  { t: 'cmd', where: 'capstone-e2e #1 → Console Output, image scan (real text, excerpt)', cmd: '', out: `[2026-11-22T19:32:52.831Z] Security gate: 0 CRITICAL vulnerabilities — release allowed.`, note: 'Trivy\'s own real report showed two clean targets — the alpine base and the jar itself — at 0 vulnerabilities each: nothing to list, so nothing to gate on, this run.' },
  { t: 'h3', text: '13.3.3 Publish: Nexus and the registry, one stage' },
  { t: 'code', lang: 'groovy', file: 'capstone/Jenkinsfile — the Publish stage', code: `stage('Publish') {
    agent { label 'docker' }
    steps {
        withCredentials([usernamePassword(credentialsId: 'nexus-deployer',
                                          usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_TOKEN')]) {
            sh 'mvn -B -s ci-settings.xml -Drevision=$VERSION -DskipTests deploy'
        }
        withCredentials([usernamePassword(credentialsId: 'gitea-packages',
                                          usernameVariable: 'REG_USER', passwordVariable: 'REG_TOKEN')]) {
            sh '''
                export DOCKER_CONFIG="$WORKSPACE_TMP/docker-config"
                trap 'docker logout $REGISTRY; rm -rf "$DOCKER_CONFIG"' EXIT
                echo "$REG_TOKEN" | docker login $REGISTRY --username "$REG_USER" --password-stdin
                docker push $IMAGE:$VERSION
            '''
        }
    }
}`, lignes: [
    [4, 'nexus-deployer: Module 10\'s least-privilege account (add + edit), publishing this brand-new artifact\'s very first version.'],
    [8, 'gitea-packages: Module 7\'s registry bot account, logged out again in the same `trap`.'],
  ] },
  { t: 'cmd', where: 'capstone-e2e #1 → Console Output, Publish (real text, excerpt)', cmd: '', out: `[2026-11-22T19:32:56.004Z] [INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/capstone/1.0.1/capstone-1.0.1.pom (4.0 kB at 6.5 kB/s)
[2026-11-22T19:32:56.259Z] [INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/capstone/1.0.1/capstone-1.0.1.jar (8.4 kB at 126 kB/s)
[2026-11-22T19:32:56.259Z] [INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/capstone/maven-metadata.xml (299 B at 5.8 kB/s)
[2026-11-22T19:32:57.354Z] 1.0.1: digest: sha256:3a151392dcc6bf8a6ef39fc7d01cbedcf0868fee750603b4aa31b67a9f0d5db9 size: 856` },
  { t: 'shot', id: 'm13-03-nexus-browse', titre: 'Nexus, browsing the artifact this exact run just published', ce: 'Not a demo artifact — the one this pipeline run produced, a minute earlier.', éléments: ['The artifact this exact pipeline run uploaded', 'Its POM, generated by the flatten plugin'], actions: ['Compare the version number here with the one in the console output above.'], résultat: 'A jar in Nexus and an image in the registry, both traceable to one real build number.' },
  { t: 'h3', text: '13.3.4 Deploy: Helm, the same cluster' },
  { t: 'p', text: 'A new Helm release, in the same `stock` namespace and under the same `deployer` ServiceAccount Module 8 already scoped — no new RBAC to write.' },
  { t: 'cmd', where: 'capstone-e2e #1 → Console Output, Helm (real text, excerpt)', cmd: '', out: `[2026-11-22T19:33:21.153Z] Release "capstone" does not exist. Installing it now.
[2026-11-22T19:33:23.674Z] STATUS: deployed
[2026-11-22T19:33:23.674Z] REVISION: 1
[2026-11-22T19:33:26.450Z] deployment "capstone" successfully rolled out` },
  { t: 'callout', kind: 'tip', text: '`helm history`\'s own APP VERSION column still shows Chart.yaml\'s static default (`1.0.0`) — the image actually running is `1.0.1`, set with `--set image.tag=$VERSION` at install time. A chart\'s declared app version and the tag a pipeline actually deploys are two different things; only the second one is true at runtime.' },
  { t: 'h3', text: '13.3.5 Ansible: a second front door, inside this same pipeline' },
  { t: 'p', text: 'Module 11\'s Ansible lab ran on its own, never triggered by anything. This pipeline fixes that: its last infrastructure stage is a real `ansiblePlaybook` step, in the same run, right after the cluster deployment it depends on.' },
  { t: 'code', lang: 'yaml', file: 'capstone/ansible/capstone-proxy.yml', code: ANSIBLE_CAPSTONE_PROXY, lignes: [
    [12, '`blockinfile`: touches only one marked block inside the real file Modules 10 and 11 already deploy to — never the whole site.'],
    [16, 'The block itself comes from a real Jinja2 template, kept separate so it stays readable as it grows.'],
  ] },
  { t: 'p', text: 'The real `--diff` this stage printed shows exactly the six lines it added, and nothing else:' },
  { t: 'cmd', where: 'capstone-e2e #1 → Console Output, Ansible --diff (real text, excerpt)', cmd: '', out: `[2026-11-22T19:33:29.812Z] PLAY [Reverse-proxy /capstone/ on app-1 to the capstone Service in the kind cluster] ***
[2026-11-22T19:33:29.820Z] TASK [Gathering Facts] *********************************************************
[2026-11-22T19:33:32.105Z] ok: [app-1]
[2026-11-22T19:33:32.106Z] TASK [Add the /capstone/ location to app-1's nginx site] ***********************
[2026-11-22T19:33:32.456Z] --- before: /etc/nginx/sites-available/default (content)
[2026-11-22T19:33:32.456Z] +++ after: /etc/nginx/sites-available/default (content)
[2026-11-22T19:33:32.456Z] @@ -4,4 +4,10 @@
[2026-11-22T19:33:32.456Z]      root /var/www/stock-web/current;
[2026-11-22T19:33:32.456Z]      index index.html;
[2026-11-22T19:33:32.456Z]      add_header X-Served-By app-1;
[2026-11-22T19:33:32.456Z] +    # BEGIN ANSIBLE MANAGED BLOCK — capstone proxy (Module 13)
[2026-11-22T19:33:32.456Z] +    location /capstone/ {
[2026-11-22T19:33:32.456Z] +        proxy_pass http://lab-control-plane:30081/;
[2026-11-22T19:33:32.456Z] +        proxy_set_header Host $host;
[2026-11-22T19:33:32.456Z] +    }
[2026-11-22T19:33:32.456Z] +    # END ANSIBLE MANAGED BLOCK — capstone proxy (Module 13)
[2026-11-22T19:33:32.456Z]  }
[2026-11-22T19:33:32.456Z] changed: [app-1]
[2026-11-22T19:33:32.466Z] RUNNING HANDLER [Reload nginx] *************************************************
[2026-11-22T19:33:32.884Z] changed: [app-1]
[2026-11-22T19:33:32.884Z] PLAY RECAP *********************************************************************
[2026-11-22T19:33:32.884Z] app-1                      : ok=3    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0` },
  { t: 'callout', kind: 'warning', text: 'A real, worth-knowing tension, not hidden: Module 10/11\'s own playbook (`site.yml`) templates this exact same file from scratch. If it ever runs again after this one, it will remove the marked block this playbook just added — two independent playbooks sharing one file is a genuine operational risk, the kind Module 12\'s whole premise is built around. The honest fix in a real team is either one playbook owning the whole file, or `blockinfile` everywhere a file is shared — never two different templating strategies on the same path.' },
  { t: 'h3', text: '13.3.6 Smoke test: both real doors, checked by address' },
  { t: 'cmd', where: 'capstone-e2e #1 → Console Output, smoke test (real text, excerpt)', cmd: '', out: `[2026-11-22T19:33:33.411Z] + echo cluster NodePort 30081: OK
[2026-11-22T19:33:33.411Z] cluster NodePort 30081: OK
[2026-11-22T19:33:33.411Z] + echo app-1 /capstone/: OK
[2026-11-22T19:33:33.411Z] app-1 /capstone/: OK
Finished: SUCCESS` },
  { t: 'shot', id: 'm13-01-pipeline-stages', titre: 'capstone-e2e — nine real stages, one real run', ce: 'The whole chain, left to right, each stage traceable to the module that built its tool.', éléments: ['Stage 1: mvn test (Module 6)', 'Stage 2: SonarQube gate (Module 10)', 'Stage 5: Trivy security gate (Module 11)', 'Stage 7: Helm, kind cluster (Module 8)', 'Stage 9: both real front doors checked'], actions: ['Hover any stage to read its real duration.'], résultat: 'No stage skipped, no stage faked — the real ending this whole course has been building toward.' },

  { t: 'h', id: 'm13-4', text: '13.4 Validating the result — what each piece of evidence actually proves' },
  { t: 'table', head: ['Evidence', 'What it actually proves', 'What it does NOT prove'], rows: [
    ['The pipeline stage view is all green', 'Every stage ran its real steps and returned success', 'Nothing about whether the deployed service is still healthy right now'],
    ['The SonarQube dashboard shows "Passed"', 'The new code met this project\'s real quality gate, at analysis time', 'Nothing about runtime behavior — a gate reads static analysis and coverage, not production traffic'],
    ['Nexus/the registry list the new version', 'The artifact and the image really were published, at the version this run built', 'Nothing about whether anything was ever deployed from them'],
    ['`kubectl get pods` shows capstone Running', 'The cluster scheduled and started the container', 'Nothing about whether it answers real traffic correctly'],
    ['The real curl against both doors returns OK', 'The application is actually reachable, through the exact paths a user would use', 'This is the strongest single proof in the list — but only for the one moment it was run'],
  ] },
  { t: 'shot', id: 'm13-02-sonar-dashboard', titre: 'capstone\'s own SonarQube dashboard', ce: 'A passed gate, on this project\'s first real analysis.', éléments: ['Quality gate: Passed, first analysis', 'Coverage of the whole project'], actions: ['Compare the coverage percentage here with JaCoCo\'s own number in the Jenkins job — they rarely match exactly.'], résultat: 'Two tools, two slightly different line-counting rules, the same real underlying tests — SonarQube read 95.7%, Jenkins\' own JaCoCo report read 94.25%, both correct for what each one actually counts.' },

  { t: 'h', id: 'm13-5', text: '13.5 Common errors and troubleshooting' },
  { t: 'errors', rows: [
    ['A fresh `docker build` fails trying to install Maven or resolve a dependency', 'A brand-new image has no path to the internet through this sandbox\'s own TLS interception — every fresh HTTPS call inside the build hits it.', 'Start from an image that already has what the build needs (`FROM maven:...-alpine` instead of installing it), or better, never build the artifact inside Docker at all — copy in a jar the pipeline already built on a trusted agent.'],
    ['`docker build` runs twice as long as it should, for no visible reason', 'The image is resolving the exact same dependencies Maven already resolved one stage earlier.', 'Build the jar once, outside Docker, and `COPY` it in — one Maven resolution per release, not two.'],
    ['A new project\'s SonarQube coverage number does not match Jenkins\' own JaCoCo report', 'The two tools apply slightly different line-counting rules to the same real tests.', 'Expected, not a bug — compare trends over time within one tool, not raw numbers across two different tools.'],
    ['`helm history` reports an app version that does not match what is actually running', 'Chart.yaml\'s `appVersion` is only ever a static default; a pipeline that deploys with `--set image.tag=...` overrides it at install time without updating that field.', 'Trust the deployment\'s actual image tag (`kubectl get deployment -o jsonpath=...`), never the chart\'s static default, for what is really running.'],
    ['An Ansible-managed block disappears from a file after an unrelated playbook run', 'A second playbook re-templates the same file from scratch, silently discarding the first playbook\'s `blockinfile` insertion.', 'Never let two playbooks manage the same file two different ways — pick one strategy (whole-file template, or `blockinfile` throughout) and use it everywhere that file is touched.'],
  ] },

  { t: 'h', id: 'm13-6', text: '13.6 The final project' },
  { t: 'lab', id: 'lab131', titre: 'Final project — one pipeline, eight tools, start to finish', durée: '90 min', objectif: 'Build and run, for real, a single pipeline that chains every tool this course covered — and know how to prove it worked.', étapes: [
    { t: 'p', text: '**1.** Start from a project with real, already-passing tests — your own, or a deliberate, acknowledged copy of one that already works. Add whatever thin entry point it is actually missing (a server, a CLI, a handler) — nothing more.' },
    { t: 'p', text: '**2.** Write one Jenkinsfile, `agent none` at the top, each stage choosing its own agent: build and test, a quality gate that can really abort the pipeline, package, build the image, an image scan with a real security gate, publish to both an artifact repository and a registry, deploy with Helm, and a configuration-management stage that does something a human would actually want automated.' },
    { t: 'p', text: '**3.** Give that last stage a real purpose in the same run — not a separate, disconnected lab. If nothing else fits, a second front door to the deployed service, proxied from somewhere else, is a genuine, defensible choice.' },
    { t: 'p', text: '**4.** Add a final smoke-test stage that checks the deployed result by address, not by trusting the stage view\'s own color.' },
    { t: 'p', text: '**5.** Run it. If it breaks, fix the real cause and rerun — a final project that needed one real fix along the way is more honest, and more useful, than one that happened to work by luck on the first try.' },
    { t: 'p', text: '**6.** Validate it using the table in 13.4: for each piece of evidence you can produce, write down what it actually proves, and what it still leaves unproven.' },
  ], solution: [
    { t: 'ul', items: [
      'Step 1: `capstone` itself is the worked example — `stock-api`\'s tested source, one new `App.java`.',
      'Step 2–3: the real stage order in this module\'s own pipeline — build/test, gate, package, image, scan, publish, deploy, Ansible, smoke test — is a template, not the only correct order.',
      'Step 5: this exact pipeline needed no rerun in Jenkins itself — but the Dockerfile underneath it needed a real fix (13.5\'s first row) before the first Jenkins run was even attempted. That fix is still part of "it broke once, for real, and was fixed" — it does not have to happen inside Jenkins to count.',
      'Step 6: the strongest answer is always the real curl in step 4 — everything else in 13.4\'s table is supporting evidence, not final proof.',
    ] },
  ] },

  { t: 'recap', items: [
    'A final project does not need new application logic — it needs a chain that genuinely uses every tool already built, in the right order, for real.',
    'Reusing tested code openly, and saying so, is more honest and more useful than rewriting it to look original.',
    'A quality gate and a security gate are worth the most on a brand-new project\'s very first run — that is exactly when nobody has checked yet.',
    'A chart\'s declared `appVersion` and the tag a pipeline actually deploys are two different things; only `--set` at install time is true at runtime.',
    'Giving a configuration-management tool a real stage in the same pipeline — not a separate, untriggered lab — is what makes it operational rather than decorative.',
    'Two playbooks (or two anything) that manage the same file two different ways will eventually erase each other\'s work — pick one strategy per file, everywhere that file is touched.',
    'A green pipeline, a passed quality gate, and a published artifact are each real evidence of something specific — none of them, alone, proves the deployed result still answers real traffic. A real curl against a real address is the strongest proof this course has, end to end.',
    'Every tool in this diagram already existed by Module 12. The only thing this module built that did not exist before was the decision to use all of them, together, on purpose.',
  ] },
  { t: 'quiz', id: 'quiz13', questions: [
    { q: 'Why does capstone reuse stock-api\'s Maven source instead of new application code?', choix: ['To save typing', 'A final project should prove the integration, not invent new logic that was never the point', 'stock-api is the only code that compiles', 'SonarQube requires reused code'], bonne: 1, pourquoi: 'Stated plainly in 13.2: the chain is what this module demonstrates.' },
    { q: 'What is the one genuinely new piece of application code in capstone?', choix: ['A database layer', 'App.java, a thin HTTP server entry point', 'A new test suite', 'A new Stock class'], bonne: 1, pourquoi: 'stock-api was a pure library with no process of its own.' },
    { q: 'A fresh docker build fails trying to resolve a Maven dependency it needs to install. Most likely real cause in this lab?', choix: ['The dependency does not exist', 'A brand-new image has no path through this sandbox\'s TLS interception for a fresh HTTPS call', 'Docker is out of disk', 'The pom.xml is invalid'], bonne: 1, pourquoi: 'The real snag this exact module hit, and the real fix: reuse the jar, don\'t re-resolve it.' },
    { q: 'Why does the Dockerfile COPY a jar instead of running mvn package inside it?', choix: ['Docker cannot run Maven', 'One Maven resolution per release, not two — and it sidesteps the sandbox\'s HTTPS problem entirely', 'It is required by Nexus', 'COPY is faster for no particular reason'], bonne: 1, pourquoi: 'Both a real fix and a better real-world pattern, stated together in the Dockerfile\'s own comment.' },
    { q: 'What does the pipeline stage view being all green actually prove?', choix: ['The deployed service is healthy right now', 'Every stage ran its real steps and returned success — nothing about current runtime health', 'Nothing at all', 'That no gate exists'], bonne: 1, pourquoi: 'Table in 13.4 — a real distinction, not a technicality.' },
    { q: 'SonarQube reports 95.7% coverage; Jenkins\' own JaCoCo report reports 94.25% for the same build. What does this mean?', choix: ['One of the two tools is broken', 'Two tools, two slightly different line-counting rules, over the same real tests', 'The build is non-deterministic', 'SonarQube re-ran the tests itself'], bonne: 1, pourquoi: 'A genuine, harmless discrepancy — expected, not a bug.' },
    { q: 'helm history shows APP VERSION 1.0.0, but the real running image tag is 1.0.1. Why?', choix: ['A deployment bug', 'Chart.yaml\'s appVersion is only a static default; --set image.tag at install time overrides it without updating that field', 'Helm caches old versions', 'The pipeline failed silently'], bonne: 1, pourquoi: 'A real, worth-knowing Helm detail, not an error.' },
    { q: 'Why is the Ansible stage placed inside the same pipeline this time, unlike Module 11\'s lab?', choix: ['Jenkins requires it', 'So configuration management has a genuine, triggered role instead of being a separate, disconnected lab', 'Ansible cannot run standalone', 'It makes the pipeline faster'], bonne: 1, pourquoi: 'Named explicitly as the gap this module closes, in 13.3.5.' },
    { q: 'What real risk does the course flag about site.yml and capstone-proxy.yml sharing one nginx file?', choix: ['They might run at the same time and deadlock', 'If site.yml re-templates the file from scratch, it silently removes capstone-proxy.yml\'s marked block', 'nginx refuses to reload twice', 'Ansible blocks a second playbook from touching the same host'], bonne: 1, pourquoi: 'Two different templating strategies on one shared file is a genuine, named operational risk.' },
    { q: 'What is the single strongest piece of evidence in 13.4\'s table that the deployed project actually works?', choix: ['A green pipeline stage view', 'A passed SonarQube gate', 'A real curl against a real address returning the expected response', 'A Helm revision number'], bonne: 2, pourquoi: 'Every other row proves something narrower; only a real request against a real address proves the thing a user would actually experience.' },
  ] },
  { t: 'checklist', id: 'm13', items: [
    'I built a project that reuses real, already-working code, and I can explain exactly why that is a legitimate choice for a final project.',
    'I chained Git, Jenkins, Maven, SonarQube, Docker, a registry, Kubernetes and Ansible into one real, successful pipeline run.',
    'I gave my configuration-management stage a genuine role inside the same pipeline, not a separate lab nobody triggers.',
    'I can name, for each piece of evidence my pipeline produces, exactly what it proves and what it does not.',
    'I hit at least one real problem while building this, and fixed the real cause rather than working around the symptom.',
    'I know the real difference between a chart\'s declared app version and the tag actually running.',
    'I validated the finished result with a real request against a real address, not just a green pipeline.',
  ] },
]

export default MODULE13
