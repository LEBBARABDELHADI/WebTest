// Module 1 — Introduction to Jenkins. Outputs and screenshots come from the Lab 0 instance
// (Jenkins 2.580.2 LTS, official Docker image, 2026-11-17).

export const JENKINSFILE_HELLO = `pipeline {
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
                sh 'test -s version.txt && echo "tests passed"'
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

export const MODULE1 = [
  { t: 'objectives', items: [
    'Explain what Jenkins is, where it comes from and which release line to use.',
    'Explain why DevOps teams automate with a CI/CD server.',
    'Tell **continuous integration**, **continuous delivery** and **continuous deployment** apart, with examples.',
    'Compare Jenkins with **GitLab CI/CD**, **GitHub Actions** and **Azure DevOps** and justify a choice.',
    'Describe the architecture: **controller**, **agents**, **nodes**, **executors**, JENKINS_HOME, plugins.',
    'Follow the life of a build from the trigger to the result.',
    'Explain the different roles of **Jenkins and Ansible** and how they work together.',
  ] },
  { t: 'p', text: 'Prerequisite: the Jenkins of **Lab 0** is running (`docker compose ps` shows **Up**). The labs of this module use it to look at the architecture for real.' },

  { t: 'h', id: 'm1-1', text: '1.1 What is Jenkins?' },
  { t: 'p', text: '**Jenkins is an open source automation server.** It runs, automatically and repeatably, the tasks that turn source code into delivered software: compile, test, analyze, package, publish, deploy. A task (a *job*, today usually a *pipeline*) starts on an **event** — a commit, a pull request, a schedule, a click, the end of another job — and each execution (a *build*) leaves a trace: logs, results, artifacts.' },
  { t: 'p', text: 'Its own "About" page sums it up: *"The leading open source automation server which enables developers around the world to reliably build, test, and deploy their software."*' },
  { t: 'shot', id: '16-about', titre: 'Manage Jenkins → About Jenkins', ce: 'The version of your controller and the licenses of the libraries it embeds.', éléments: ['The exact version: **2.580.2** (LTS).'], actions: ['Open **Manage Jenkins → About Jenkins**.'], résultat: 'You can tell which Jenkins you run — always the first thing to give when you ask for help.' },
  { t: 'table', head: ['Characteristic', 'What it means in practice'], rows: [
    ['**Open source** (MIT license)', 'Free to use, inspect and modify; a large community; commercial support exists (e.g. CloudBees) but is optional.'],
    ['**Self-hosted**', 'You run it on your servers, VMs, containers or Kubernetes: code and secrets stay in your infrastructure — sometimes a regulatory requirement.'],
    ['**Written in Java**', 'Needs a supported Java (21 or 25 today). Runs on Linux, Windows and macOS.'],
    ['**Extensible by plugins**', '2,300+ community plugins (plugins.jenkins.io): Git, Docker, Kubernetes, SonarQube, Ansible, cloud providers…'],
    ['**Pipeline as code**', 'The pipeline is a `Jenkinsfile` versioned with the application: reviewed, traced, reproducible.'],
    ['**Distributed**', 'One controller orchestrates many agents (Linux, Windows, macOS, containers, cloud machines).'],
    ['**Web UI, REST API, CLI**', 'Everything can be done by hand, by script or by another tool.'],
  ] },
  { t: 'h3', text: 'A short history' },
  { t: 'table', head: ['Year', 'Event'], rows: [
    ['2004', 'Kohsuke Kawaguchi starts **Hudson** at Sun Microsystems to stop breaking builds.'],
    ['2011', 'After a dispute with Oracle over the name, the community continues the project as **Jenkins**.'],
    ['2016', '**Jenkins 2.0**: *Pipeline as code* (Jenkinsfile) becomes a core feature.'],
    ['2019', 'Jenkins becomes a founding project of the **Continuous Delivery Foundation** (Linux Foundation).'],
    ['2020–2021', 'Inclusive terminology: "master/slave" become **controller/agent**; the master node becomes the **built-in node**.'],
    ['2024–2026', 'Modernization: new UI, Java 17 then **Java 21** minimum, Java 25 supported.'],
  ] },
  { t: 'h3', text: 'Weekly or LTS? Read a version number' },
  { t: 'table', head: ['Release line', 'Rhythm', 'Example', 'For whom'], rows: [
    ['**Weekly**', 'A new release every week', '2.591', 'Early adopters, plugin developers'],
    ['**LTS** (Long-Term Support)', 'Every 12 weeks a recent weekly is chosen as *baseline*; it then gets **3 updates, one every 4 weeks**', '2.580.1 → **2.580.2** → 2.580.3', '**Production** and this course'],
  ] },
  { t: 'p', text: '`2.580.2` reads: baseline **2.580**, second LTS update. LTS updates mostly contain bug and security fixes, which is what you want on a server the whole team depends on.' },
  { t: 'callout', kind: 'enterprise', title: 'In a company', text: 'Production runs an **LTS**, upgraded after testing on a staging instance, and the version is pinned (Docker tag, package version) to know exactly what runs. Security advisories (jenkins.io/security) are followed for both the core and the plugins.' },

  { t: 'h', id: 'm1-2', text: '1.2 Why use Jenkins in a DevOps approach?' },
  { t: 'p', text: 'DevOps aims at delivering **often**, **safely** and **with fast feedback**. That is impossible if building, testing and deploying depend on manual steps. Jenkins is the **orchestrator** that chains these steps automatically, every time, in the same way.' },
  { t: 'table', head: ['Without automation', 'With a Jenkins pipeline'], rows: [
    ['"It works on my machine": builds depend on each developer\'s laptop.', 'Every build runs on controlled agents, with the same tools and versions.'],
    ['Code is merged rarely; integration is painful ("integration hell").', 'Every push is built and tested: problems appear within minutes, when they are cheap to fix.'],
    ['Tests are run "when we have time".', 'Tests are a mandatory stage: a red build stops the chain.'],
    ['Releases are long checklists, prone to human error.', 'The release is a pipeline: same steps, same order, traced.'],
    ['Nobody knows what is deployed, by whom, from which commit.', 'Each build records who/what/when: logs, artifacts, fingerprints, commit IDs.'],
  ] },
  { t: 'diagram', id: 'boucle', caption: 'The DevOps loop: Jenkins automates the delivery part and orchestrates the tools of each step.' },
  { t: 'callout', kind: 'enterprise', title: 'Real-world example', text: 'A Java team of 40 developers pushes to GitLab. Before: a nightly build, broken one morning out of two, and a release every 6 weeks prepared over a weekend. After: every push triggers Jenkins (build, unit tests, SonarQube quality gate, Docker image published to Nexus, deployment to a test environment) in about 10 minutes; production releases are a click on an approved build. The modules of this course build exactly this chain (Module 13).' },

  { t: 'h', id: 'm1-3', text: '1.3 CI and CD in plain words' },
  { t: 'p', text: '**Continuous Integration (CI)** — developers integrate their changes into the shared main branch **frequently** (at least daily). **Every change is automatically built and tested**; a broken build is fixed first, before anything else. CI answers: *"Does the code still build and pass the tests?"*' },
  { t: 'p', text: '**Continuous Delivery (CD)** — CI plus automated deployment to test/staging environments, so that **every change that passes the pipeline is releasable**. Going to production is a **business decision**, executed in one click. It answers: *"Could we release this version now?"*' },
  { t: 'p', text: '**Continuous Deployment (also CD)** — every change that passes all automated stages **goes to production automatically**, without human approval. It answers: *"This version is live."* It requires excellent automated tests, monitoring and a fast rollback.' },
  { t: 'diagram', id: 'cicd', caption: 'Where automation stops: the only difference between delivery and deployment is the manual gate before production.' },

  { t: 'h', id: 'm1-4', text: '1.4 Continuous integration vs continuous delivery vs continuous deployment' },
  { t: 'table', head: ['', 'Continuous integration', 'Continuous delivery', 'Continuous deployment'], rows: [
    ['Automated', 'Build + tests (+ analysis)', 'CI + packaging + deployment to test/staging', 'Everything, up to production'],
    ['Human decision', 'None (but fix red builds at once)', '**Yes**: approve the production release', 'None'],
    ['Production release', 'Separate, often manual', 'One click, any time', 'Every green change'],
    ['Prerequisites', 'Automated tests, fast build', '+ reproducible deployments, environments', '+ very good tests, monitoring, feature flags, fast rollback'],
    ['Typical context', 'Every team, first step', 'Banks, insurance, regulated industries, B2B', 'SaaS, web products deploying many times a day'],
    ['In a Jenkinsfile (Module 4)', '`stage(\'Build\')`, `stage(\'Test\')`', '+ deploy stages and an `input` step (approval)', '+ production deploy stage without `input`'],
  ] },
  { t: 'callout', kind: 'tip', title: 'The trap of "CD"', text: 'The acronym CD means both. In a meeting, ask: *"Is the production release automatic, or approved by someone?"* Approved → continuous **delivery**. Automatic → continuous **deployment**.' },

  { t: 'h', id: 'm1-5', text: '1.5 Jenkins compared with GitLab CI/CD, GitHub Actions and Azure DevOps' },
  { t: 'table', head: ['', 'Jenkins', 'GitLab CI/CD', 'GitHub Actions', 'Azure DevOps (Pipelines)'], rows: [
    ['Hosting', 'Self-hosted (you operate it)', 'SaaS (gitlab.com) or self-managed', 'SaaS (github.com); GitHub Enterprise Server on premises', 'SaaS (Azure DevOps Services) or Azure DevOps Server'],
    ['Pipeline definition', '`Jenkinsfile` (Groovy-based DSL, Declarative or Scripted)', '`.gitlab-ci.yml` (YAML)', '`.github/workflows/*.yml` (YAML)', '`azure-pipelines.yml` (YAML) or classic editor'],
    ['Where jobs run', 'Agents: static, Docker, Kubernetes, cloud VMs', 'GitLab Runners (hosted or self-managed)', 'Runners (GitHub-hosted or self-hosted)', 'Agents (Microsoft-hosted or self-hosted)'],
    ['Extensions', '2,300+ plugins, shared libraries', 'Built-in features, CI/CD components and templates', 'Marketplace actions', 'Marketplace extensions and tasks'],
    ['Source control', 'Any: GitHub, GitLab, Bitbucket, Gitea, SVN…', 'Best with GitLab repositories', 'Best with GitHub repositories', 'Azure Repos, GitHub and others'],
    ['Strengths', 'Flexibility, any tool and any SCM, on-premises and air-gapped, complex orchestrations', 'All-in-one platform: code, CI/CD, registry, security scans', 'Easiest for projects on GitHub; huge ecosystem', 'Integration with Azure and Microsoft tools (Boards, Test Plans)'],
    ['Limits', 'You install, upgrade, secure and back it up; plugins to maintain; Groovy to learn', 'Strongly tied to GitLab', 'Strongly tied to GitHub; self-hosted runners to manage', 'Best inside the Microsoft ecosystem'],
    ['Typical choice', 'Large heterogeneous companies, on-premises, regulated, existing Jenkins estate', 'Teams already on GitLab', 'Open source and GitHub-centric teams', 'Microsoft/Azure organizations'],
  ] },
  { t: 'p', text: 'There is no "best" tool: the choice depends on where the code lives, the hosting constraints, the existing skills and the cost of operating the tool. Jenkins remains very present in companies with many heterogeneous projects, strict on-premises constraints or complex pipelines — and its concepts (pipeline, stage, agent, artifact, credentials) transfer directly to the other tools.' },
  { t: 'callout', kind: 'info', title: 'Prices and quotas', text: 'Free minutes, runner prices and license terms of SaaS offers change often: check the vendor pages on the day you choose. Jenkins is free, but its operation (servers, upgrades, security, backups) has a cost in time.' },

  { t: 'h', id: 'm1-6', text: '1.6 Jenkins architecture' },
  { t: 'diagram', id: 'architecture', caption: 'The controller orchestrates; agents execute. Builds should run on agents, not on the controller.' },
  { t: 'table', head: ['Component', 'Role', 'In your Lab 0'], rows: [
    ['**Controller**', 'The Jenkins server: web UI, configuration, scheduling, plugins, credentials, build records.', 'The container `jenkins`'],
    ['**JENKINS_HOME**', 'The directory with the entire state of the controller.', '`/var/jenkins_home`, volume `jenkins-lab_jenkins_home`'],
    ['**Node**', 'A machine (or container) able to run builds.', 'One node: the built-in node'],
    ['**Agent**', 'A process on a node, connected to the controller, that executes builds.', 'None yet (Module 12)'],
    ['**Built-in node**', 'The node inside the controller process.', '`Built-In Node`, 2 executors'],
    ['**Executor**', 'A slot that runs one build at a time on a node.', '`Build Executor Status 0/2`'],
    ['**Label**', 'A tag used to choose nodes (`linux`, `docker`, `windows`…).', 'None yet'],
    ['**Job / item**', 'The definition of a task (Freestyle, Pipeline, Multibranch, Folder…).', '`hello-jenkins`, `hello-pipeline`'],
    ['**Build (run)**', 'One execution of a job, numbered #1, #2…', '`hello-jenkins #1`'],
    ['**Workspace**', 'The folder of a node where a build works.', '`/var/jenkins_home/workspace/hello-jenkins`'],
    ['**Artifact**', 'A file produced by a build and archived by the controller.', '`version.txt` of `hello-pipeline`'],
    ['**Plugin / update center**', 'Extensions and the site they are downloaded from.', '92 plugins, `updates.jenkins.io`'],
    ['**Credentials**', 'Encrypted secrets (passwords, tokens, SSH keys) used by builds.', 'Module 3 and 9'],
    ['**Trigger**', 'What starts a build: webhook, SCM polling, schedule (cron), upstream job, manual.', 'Manual (Build Now)'],
    ['**Queue**', 'Builds waiting for a suitable free executor.', '`Build Queue`'],
  ] },

  { t: 'h', id: 'm1-7', text: '1.7 The controller and the agents' },
  { t: 'p', text: 'The **controller** decides; the **agents** do the work. A build always runs **on a node**, in an **executor**, inside a **workspace**. Following one build from start to end makes the architecture concrete:' },
  { t: 'diagram', id: 'vie-build', caption: 'The life of a build, from the trigger to the result.' },
  { t: 'ol', items: [
    '**Trigger**: a webhook from Git, a schedule, a click on *Build Now* or the end of another job.',
    '**Queue**: the build waits in the *Build Queue*.',
    '**Scheduling**: the controller looks for a node whose **labels** match the job and which has a **free executor**.',
    '**Workspace**: on that node, the build gets a folder (and checks out the code if the job uses Git).',
    '**Steps**: the commands run **on the agent**; the log is streamed live to the controller (*Console Output*).',
    '**Records**: test reports and **artifacts** are sent back and stored by the controller.',
    '**Result and notifications**: SUCCESS, UNSTABLE, FAILURE or ABORTED; e-mail, chat, commit status in GitHub/GitLab.',
  ] },
  { t: 'h3', text: 'How agents connect' },
  { t: 'table', head: ['Method', 'Who opens the connection', 'Typical use'], rows: [
    ['**SSH** (SSH Build Agents plugin)', 'The controller connects to the agent over SSH', 'Linux servers reachable from the controller'],
    ['**Inbound agent** (WebSocket over HTTPS, or TCP port **50000**)', 'The agent connects to the controller', 'Machines behind a firewall/NAT, Windows agents'],
    ['**Cloud / ephemeral** (Docker, Kubernetes, EC2…)', 'Jenkins creates an agent for a build, then deletes it', 'Clean, scalable builds: one fresh agent per build'],
  ] },
  { t: 'p', text: 'A pipeline chooses its node with a label expression, for example `agent { label \'linux && docker\' }`: only nodes having **both** labels can run it.' },
  { t: 'h3', text: 'Why builds should not run on the controller' },
  { t: 'shot', id: '13-manage', titre: 'Manage Jenkins: the security warning', ce: 'Jenkins itself warns you: our lab builds on the built-in node.', éléments: ['"Building on the built-in node can be a security issue. You should set up distributed builds."', 'A notice: Java 21 support ends on or after 30 September 2027 — plan the move to Java 25.', '**System**: global settings and paths.', '**Plugins**: add, update, remove plugins.', '**Nodes**: the built-in node and the agents.'], actions: ['Click the gear icon (**Manage Jenkins**) and read the warnings at the top.'], résultat: 'You understand why a lab can build on the built-in node but production cannot.' },
  { t: 'p', text: 'A build on the built-in node runs **inside the controller, with its operating-system user**: a malicious or buggy script can read JENKINS_HOME, which contains the encrypted credentials and the keys to decrypt them, change the configuration or fill its disk. Heavy builds also slow down the UI for everybody. That is why the Jenkins documentation (*Controller Isolation*) recommends running builds on agents and setting the built-in node to **0 executors** in production (Module 12).' },
  { t: 'diagram', id: 'entreprise', caption: 'A typical enterprise topology: the controller never builds; static and ephemeral agents do.' },

  { t: 'h', id: 'm1-8', text: '1.8 Jenkins and Ansible: different jobs, one chain' },
  { t: 'p', text: 'If you know Ansible, the comparison helps. They are **not competitors**: Jenkins decides **when** and **in which order** things happen; Ansible describes **how** servers must be configured and deploys applications on them.' },
  { t: 'table', head: ['', 'Jenkins', 'Ansible'], rows: [
    ['Category', 'CI/CD orchestrator (automation server)', 'Configuration management and deployment automation'],
    ['Main question', 'When, in which order, with which result?', 'In which state must these servers be?'],
    ['Unit of work', 'Job / pipeline (Jenkinsfile), builds #1, #2…', 'Playbook, roles, tasks'],
    ['Language', 'Groovy-based DSL (Declarative or Scripted)', 'YAML (+ Jinja2 templates)'],
    ['Execution', 'Controller + agents', 'Agentless: control node → SSH/WinRM to managed nodes'],
    ['State', 'History of builds, logs, artifacts', 'Desired state, **idempotent** tasks'],
    ['Triggered by', 'Commits, pull requests, schedules, people', 'A person, a scheduler… or **Jenkins**'],
    ['Typical output', 'Tested artifacts, reports, published images', 'Configured servers, deployed applications'],
  ] },
  { t: 'diagram', id: 'jenkins-ansible', caption: 'Together: Jenkins builds and tests, then calls an Ansible playbook to deploy on several servers.' },
  { t: 'code', lang: 'groovy', file: 'Jenkinsfile (excerpt — complete project in Module 11, Lab 11.4)', code: `stage('Deploy to staging') {
    steps {
        withCredentials([sshUserPrivateKey(credentialsId: 'ansible-ssh-key', keyFileVariable: 'SSH_KEY')]) {
            sh '''
                ansible-playbook -i inventories/staging/hosts.ini site.yml \\
                  --private-key "$SSH_KEY" \\
                  -e app_version=1.0.$BUILD_NUMBER
            '''
        }
    }
}`, lignes: [
    [1, 'A stage named "Deploy to staging", shown in the stage graph.'],
    [3, '`withCredentials` gets the SSH private key stored in Jenkins (id `ansible-ssh-key`) as a temporary file whose path is in `$SSH_KEY`; it is deleted after the block and masked in the log.'],
    [5, 'Jenkins calls Ansible: the playbook `site.yml` on the servers of the staging inventory.'],
    [6, 'Ansible connects over SSH with the key provided by Jenkins.'],
    [7, 'The version built by this pipeline is passed to the playbook: traceability from commit to server.'],
  ] },
  { t: 'p', text: 'This needs an agent with Ansible installed and a credential `ansible-ssh-key`: both are built step by step in Modules 9, 10 and 11.' },

  { t: 'h', id: 'm1-9', text: '1.9 Glossary' },
  { t: 'table', head: ['Term', 'Definition'], rows: [
    ['Controller', 'The Jenkins server that stores the configuration and schedules the builds (formerly "master").'],
    ['Agent', 'A process connected to the controller that runs builds on a node (formerly "slave").'],
    ['Node', 'A machine able to run builds: the built-in node or an agent.'],
    ['Executor', 'A build slot on a node; a node with 2 executors runs 2 builds at once.'],
    ['Label', 'A tag on nodes, used by jobs to choose where to run.'],
    ['Item / job', 'Something you create with *New Item*: Freestyle, Pipeline, Multibranch Pipeline, Folder…'],
    ['Build / run', 'One execution of a job, with a number, a log and a result.'],
    ['Freestyle project', 'A job configured with web forms.'],
    ['Pipeline', 'A job described as code, made of stages and steps.'],
    ['Jenkinsfile', 'The file containing a pipeline, stored in the Git repository of the project.'],
    ['Stage / step', 'A stage is a logical phase (Build, Test…); a step is one action (`sh`, `echo`, `archiveArtifacts`…).'],
    ['Workspace', 'The working folder of a job on a node.'],
    ['Artifact', 'A file produced by a build and kept by Jenkins (package, report…).'],
    ['Fingerprint', 'An MD5 checksum recorded for a file, to trace which build produced or used it.'],
    ['Plugin', 'An extension installed from the update center.'],
    ['Credential', 'An encrypted secret stored by Jenkins and injected into builds.'],
    ['Webhook', 'An HTTP call from Git (GitHub, GitLab…) telling Jenkins "something changed: build".'],
    ['JENKINS_HOME', 'The directory holding all the state of the controller.'],
  ] },

  { t: 'h', id: 'm1-10', text: '1.10 Lab 1.1 — Explore the architecture of your Jenkins' },
  { t: 'lab', id: 'lab11', titre: 'Explore the architecture of your Jenkins', durée: '30 min', objectif: 'Find, in the real instance of Lab 0, each component of the architecture: version, built-in node, executors, JENKINS_HOME, jobs, builds, workspaces, plugins.', étapes: [
    { t: 'p', text: '**Step 1 — The exact version, three ways.** Look at the bottom right of any page, then **Manage Jenkins → About Jenkins**, then from the terminal:' },
    { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'curl -sI http://localhost:8080/login | grep -i x-jenkins\ndocker compose exec jenkins java -jar /usr/share/jenkins/jenkins.war --version', out: 'X-Jenkins: 2.580.2\nX-Jenkins-Session: bde79284\n2.580.2', note: 'Every Jenkins HTTP answer carries an `X-Jenkins` header: handy to check a server without logging in. Your session ID differs.' },
    { t: 'p', text: '**Step 2 — The administration and its warnings.** Open **Manage Jenkins**. Read the warnings at the top (screenshot of section 1.7), then scroll to the *Security* and *Status Information* sections:' },
    { t: 'shot', id: '13b-manage-security', titre: 'Manage Jenkins: Security and Status Information', ce: 'The second half of Manage Jenkins: who can do what, and how the instance is doing.', éléments: ['**Security**: authentication and authorization (Module 9).', '**Credentials**: the secrets used by builds (Modules 3 and 9).', '**Users**: the accounts of the internal user database.', '**System Information**: Java, system properties, environment variables — useful for diagnosis.', '**About Jenkins**: version and licenses.'], actions: ['Open each link, read, and come back without changing anything.'], résultat: 'You know where security, secrets and diagnostics are.' },
    { t: 'p', text: '**Step 3 — Nodes and executors.** Open **Manage Jenkins → Nodes**, then click **Built-In Node → Configure**.' },
    { t: 'shot', id: '14-nodes', titre: 'Manage Jenkins → Nodes', ce: 'The list of the nodes that can run builds, with their health monitoring.', éléments: ['**Built-In Node**: the node inside the controller — the only one for now.', 'Architecture of the node: Linux (amd64).', 'Free disk space, monitored: Jenkins takes a node offline when it is too low.', '**New Node**: add an agent (Module 12).'], actions: ['Note how many nodes exist and their architecture.'], résultat: 'One node: the built-in node.' },
    { t: 'shot', id: '15-builtin-config', titre: 'Built-In Node → Configure', ce: 'The settings of the built-in node.', éléments: ['**Number of executors**: 2 here — how many builds can run at the same time on this node.', '**Labels**: none — jobs cannot target it by label.', '**Build Executor Status**: executors currently busy (0/2).'], actions: ['Read the values. Do **not** set the executors to 0 now: the next labs still build on this node.'], résultat: 'You can explain the "0/2" seen on the dashboard.' },
    { t: 'p', text: '**Step 4 — Inside JENKINS_HOME.** List the content of the directory that holds the whole state of the controller:' },
    { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'docker compose exec jenkins ls -1 /var/jenkins_home', out: `caches
config.xml
copy_reference_file.log
fingerprints
hudson.model.UpdateCenter.xml
hudson.plugins.git.GitTool.xml
identity.key.enc
jenkins.install.InstallUtil.lastExecVersion
jenkins.install.UpgradeWizard.state
jenkins.model.JenkinsLocationConfiguration.xml
jenkins.telemetry.Correlator.xml
jobs
nodeMonitors.xml
org.jenkinsci.plugins.workflow.flow.FlowExecutionList.xml
plugins
queue.xml
secret.key
secret.key.not-so-secret
secrets
updates
userContent
users
war
workspace`, note: '`config.xml`: global configuration · `jobs/`: job definitions and build history · `plugins/`: installed plugins · `secrets/` and `secret.key`: encryption material of the credentials · `users/`: accounts · `workspace/`: workspaces of the built-in node · `jenkins.model.JenkinsLocationConfiguration.xml`: the Jenkins URL you entered in Lab 0.' },
    { t: 'p', text: '**Step 5 — A job on disk.** Find the definition and the first build of `hello-jenkins`:' },
    { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'docker compose exec jenkins ls -1 /var/jenkins_home/jobs/hello-jenkins /var/jenkins_home/jobs/hello-jenkins/builds/1', out: `/var/jenkins_home/jobs/hello-jenkins:
builds
config.xml
nextBuildNumber

/var/jenkins_home/jobs/hello-jenkins/builds/1:
build.xml
changelog.xml
log`, note: '`config.xml` is the job definition; `builds/1/log` is the console output of build #1; `nextBuildNumber` holds 2.' },
    { t: 'code', lang: 'xml', file: '/var/jenkins_home/jobs/hello-jenkins/config.xml (excerpt)', code: `  <builders>
    <hudson.tasks.Shell>
      <command>echo &quot;Hello from Jenkins!&quot;
echo &quot;Job: $JOB_NAME - build #$BUILD_NUMBER&quot;
echo &quot;Node: $NODE_NAME - workspace: $WORKSPACE&quot;
java -version
date -u +&quot;%Y-%m-%dT%H:%M:%SZ&quot; &gt; build-info.txt
echo &quot;Build $BUILD_NUMBER of $JOB_NAME&quot; &gt;&gt; build-info.txt</command>
      <configuredLocalRules/>
    </hudson.tasks.Shell>
  </builders>`, lignes: [
      [1, '`<builders>`: the "Build Steps" section of the form.'],
      [2, '`hudson.tasks.Shell`: the "Execute shell" step (the old name *Hudson* is still in the code).'],
      [3, 'Your script, XML-escaped (`&quot;` is `"`, `&gt;` is `>`).'],
    ] },
    { t: 'callout', kind: 'warning', title: 'Look, but do not edit these files by hand', text: 'Jenkins keeps the configuration in memory: a file modified on disk is ignored until **Manage Jenkins → Reload Configuration from Disk** or a restart, and a typo can break the job. Change jobs through the UI, the REST API or — best — through code (Jenkinsfile, Module 4).' },
    { t: 'p', text: '**Step 6 — Plugins.** Open **Manage Jenkins → Plugins → Installed plugins**, then count the plugins from the terminal:' },
    { t: 'shot', id: '17-plugins', titre: 'Manage Jenkins → Plugins', ce: 'The plugin manager: updates, available plugins, installed plugins.', éléments: ['**Installed plugins**: what this Jenkins can do.', '**Available plugins**: search and install new plugins.', '**Health**: a score computed by the Jenkins project (maintenance, security, adoption).'], actions: ['Browse the installed list; find **Pipeline** and **Git**.'], résultat: 'You know where features come from and where to add some.' },
    { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'docker compose exec jenkins sh -c \'ls /var/jenkins_home/plugins | grep -c "\\.jpi$"\'', out: '92', note: 'Each plugin is a `.jpi` file: 92 after installing the suggested plugins.' },
    { t: 'p', text: '**Questions** — answer them before opening the solution:' },
    { t: 'ol', items: [
      'Which exact version runs, and which release line is it?',
      'On which node did build #1 of `hello-jenkins` run, and how many builds can this node run at once?',
      'Why does Manage Jenkins show a security warning?',
      'Where are the definition of `hello-jenkins`, the log of its build #1 and its workspace?',
      'What would `docker compose down -v` destroy?',
      'How many plugins are installed, and where are they stored?',
    ] },
  ], solution: [
    { t: 'ol', items: [
      '**2.580.2**, an **LTS** release (baseline 2.580, second update) — seen in the footer, in *About Jenkins*, in the `X-Jenkins` header and with `jenkins.war --version`.',
      'On the **built-in node** (the console shows `Node: built-in`). It has **2 executors**: 2 builds at once.',
      'Because builds run inside the controller, with access to JENKINS_HOME and its secrets. In production, builds run on agents and the built-in node has 0 executors.',
      'Definition: `/var/jenkins_home/jobs/hello-jenkins/config.xml` · log: `/var/jenkins_home/jobs/hello-jenkins/builds/1/log` · workspace: `/var/jenkins_home/workspace/hello-jenkins`.',
      'The volume `jenkins-lab_jenkins_home`, hence **everything**: configuration, jobs, build history, plugins, users and secrets.',
      '**92** `.jpi` files in `/var/jenkins_home/plugins`.',
    ] },
  ] },

  { t: 'h', id: 'm1-11', text: '1.11 Lab 1.2 — Your first pipeline as code (preview of Module 4)' },
  { t: 'lab', id: 'lab12', titre: 'Your first pipeline as code', durée: '20 min', objectif: 'See the difference between a Freestyle job configured with forms and a pipeline described as code, with stages, a graph and an archived artifact. Module 4 explains every keyword in depth.', étapes: [
    { t: 'p', text: '**Step 1** — **New Item**, name `hello-pipeline`, type **Pipeline**, **OK**.' },
    { t: 'p', text: '**Step 2** — In the **Pipeline** section, keep *Definition: Pipeline script* and paste the pipeline below.' },
    { t: 'shot', id: '18-pipeline-config', titre: 'Pipeline job → Configure → Pipeline', ce: 'For a Pipeline job, the build steps are not forms but **code**.', éléments: ['**Definition**: *Pipeline script* (code typed here) or *Pipeline script from SCM* (a Jenkinsfile read from Git — the production way, Module 5).', 'The editor, with syntax highlighting.', '**Save**.'], actions: ['Paste the pipeline, then **Save**.'], résultat: 'The page of the job `hello-pipeline` opens.' },
    { t: 'code', lang: 'groovy', file: 'hello-pipeline → Configure → Pipeline → Script', code: JENKINSFILE_HELLO, lignes: [
      [1, '`pipeline { }`: a **Declarative** pipeline.'],
      [2, '`agent any`: run on any node with a free executor (here, the built-in node).'],
      [3, '`stages`: the ordered list of the phases.'],
      [4, 'First stage, **Build**: its name appears in the graph.'],
      [6, '`echo`: a Jenkins step that writes in the log. `${env.BUILD_NUMBER}` is the build number (Groovy string interpolation, double quotes).'],
      [7, '`sh`: run a shell command on the node. Single quotes: the **shell** expands `${BUILD_NUMBER}`, not Groovy.'],
      [12, '**Test**: `test -s` fails if the file is missing or empty, which would make the stage — and the build — fail.'],
      [17, '**Package**: `archiveArtifacts` copies `version.txt` to the controller; `fingerprint: true` records its checksum.'],
      [21, '`post`: actions after the stages, depending on the result.'],
      [22, '`success { }`: only if everything succeeded.'],
      [23, '`failure { }`: only if something failed.'],
    ] },
    { t: 'p', text: '**Step 3** — Click **Build Now**, then open build **#1**.' },
    { t: 'shot', id: '19-pipeline-job', titre: 'The Pipeline job page', ce: 'Compared with a Freestyle job, the page offers pipeline tools.', éléments: ['**Build Now**.', '**Stages**: the graph of the stages of the builds.', '**Pipeline Syntax**: the *snippet generator*, which writes steps for you (Module 4).', '**Last Successful Artifacts**: `version.txt`, archived by the Package stage.'], actions: ['Click **Build Now**, then **#1** in the build history.'], résultat: 'Build #1 is green.' },
    { t: 'shot', id: '20-pipeline-build', titre: 'Build #1 of hello-pipeline', ce: 'The page of one build.', éléments: ['**Build Artifacts**: `version.txt` (18 bytes).', '**Console Output**: the full log.', '**Pipeline Overview**: the stage graph.', '**Replay**: run again with a modified script, without changing the job — handy to debug.', '**Restart from Stage**: start again from a given stage.'], actions: ['Open **Pipeline Overview**.'], résultat: 'The graph of the stages is displayed.' },
    { t: 'shot', id: '21-pipeline-graph', titre: 'Pipeline Overview: the stages', ce: 'The Pipeline Graph View plugin draws each stage with its result and duration; clicking a stage shows its steps and their log.', éléments: ['Stage **Build** (0.39 s).', 'Stage **Test** (0.28 s).', 'Stage **Package** (56 ms).', '**Post Actions**: the `post { }` section, with its message.'], actions: ['Click each stage and read its log.'], résultat: 'Four green steps: Build → Test → Package → Post Actions.' },
    { t: 'cmd', where: 'hello-pipeline #1 → Console Output (real text)', cmd: '', out: `Started by user Lab Admin
[Pipeline] Start of Pipeline
[Pipeline] node
Running on Jenkins in /var/jenkins_home/workspace/hello-pipeline
[Pipeline] {
[Pipeline] stage
[Pipeline] { (Build)
[Pipeline] echo
Building version 1.0.1
[Pipeline] sh
+ echo app version 1.0.1
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Test)
[Pipeline] sh
+ test -s version.txt
+ echo tests passed
tests passed
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Package)
[Pipeline] archiveArtifacts
Archiving artifacts
Recording fingerprints
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Declarative: Post Actions)
[Pipeline] echo
Pipeline finished: the artifact is archived.
[Pipeline] }
[Pipeline] // stage
[Pipeline] }
[Pipeline] // node
[Pipeline] End of Pipeline
Finished: SUCCESS`, note: '`[Pipeline] …` lines are written by Jenkins for each step; the other lines are the output of your commands. "Running on Jenkins" = the built-in node.' },
    { t: 'p', text: '**Questions:** (1) Which line chose the node? (2) What happens if `version.txt` is not created? (3) Where is the artifact stored? (4) What is the advantage of this job over `hello-jenkins`?' },
  ], solution: [
    { t: 'ol', items: [
      '`agent any`: Jenkins took the first free executor, on the built-in node ("Running on Jenkins in …").',
      '`test -s version.txt` returns an error: the **Test** stage fails, **Package** is skipped, the `failure { }` block prints its message and the build ends in **FAILURE**.',
      'On the controller, with build #1 (`jobs/hello-pipeline/builds/1/archive/`), not in the workspace: it survives the cleanup of workspaces and agents.',
      'The whole process is **code**: it can live in Git next to the application (`Jenkinsfile`), be reviewed in pull requests, versioned and reused; and the stages give a readable graph. That is why pipelines replaced Freestyle jobs in companies.',
    ] },
  ] },

  { t: 'h', id: 'm1-12', text: '1.12 Exercises with solutions' },
  { t: 'exercise', id: 'ex13', titre: 'Exercise 1.3 — Integration, delivery or deployment?', énoncé: [
    { t: 'p', text: 'For each situation, say whether it is continuous **integration**, continuous **delivery** or continuous **deployment** (or none):' },
    { t: 'ol', items: [
      'Each push to `main` triggers a build and the unit tests; the team fixes red builds first.',
      'Each green build is deployed to staging; a product manager clicks "Release" to deploy to production.',
      'A web shop deploys to production about 30 times a day, automatically, after the tests and a canary step.',
      'A developer builds the release on their laptop and copies the JAR to the server with `scp`.',
      'A nightly job builds the code once a day; nobody looks at the result.',
      'A bank pipeline deploys automatically to test and pre-production; production requires the approval of the change board in Jenkins (`input`).',
    ] },
  ], solution: [
    { t: 'ol', items: [
      '**Continuous integration**: every change is built and tested automatically, and a broken build is the priority.',
      '**Continuous delivery**: always releasable, production is a human decision.',
      '**Continuous deployment**: green changes go to production without approval.',
      '**None**: manual, not reproducible, not traced ("works on my machine").',
      '**None** (at best a scheduled build): integration is not continuous and the feedback is ignored.',
      '**Continuous delivery**: the approval step before production is the signature of delivery (`input` in a Jenkinsfile, Module 4).',
    ] },
  ] },
  { t: 'exercise', id: 'ex14', titre: 'Exercise 1.4 — Choose a CI/CD tool', énoncé: [
    { t: 'p', text: 'Propose a tool for each company and justify it in two sentences:' },
    { t: 'ol', items: [
      'An insurance company: 300 heterogeneous projects (Java, .NET, COBOL batch), code in Bitbucket Data Center, no internet access from production networks, 50 existing Jenkins jobs.',
      'A start-up of 8 people, all its code on GitHub, no operations team.',
      'A public administration fully on GitLab self-managed, wanting one platform for code, CI/CD and container registry.',
    ] },
  ], solution: [
    { t: 'ol', items: [
      '**Jenkins**: self-hosted and usable without internet (offline plugin mirror), works with any SCM and any technology, and the existing jobs can be migrated progressively to Jenkinsfiles.',
      '**GitHub Actions**: zero server to operate, native integration with their repositories and pull requests, hosted runners.',
      '**GitLab CI/CD**: already part of their platform, no extra tool to secure and back up. Jenkins remains an option if they need complex orchestration across systems.',
    ] },
    { t: 'p', text: 'Other answers can be right if they are justified by **where the code lives**, **hosting constraints**, **skills** and **operating cost**.' },
  ] },
  { t: 'exercise', id: 'ex15', titre: 'Exercise 1.5 — The life of a build', énoncé: [
    { t: 'p', text: 'Put these events in order: (a) the artifact is archived on the controller · (b) a webhook arrives from GitLab · (c) the build waits in the queue · (d) the code is checked out in the workspace of the agent · (e) the result is sent back to GitLab as a commit status · (f) the controller finds an agent labelled `linux` with a free executor · (g) the tests run on the agent.' },
  ], solution: [
    { t: 'p', text: '**b → c → f → d → g → a → e**: trigger, queue, scheduling on a matching node, checkout in the workspace, steps on the agent, records on the controller, notification.' },
  ] },

  { t: 'h', id: 'm1-13', text: '1.13 Common mistakes and misconceptions' },
  { t: 'errors', rows: [
    ['"Jenkins deploys my servers, so I do not need Ansible/Terraform."', 'Jenkins orchestrates; it does not describe the state of an infrastructure.', 'Let Jenkins call the right tool: Ansible for configuration, Terraform for infrastructure, kubectl/Helm for Kubernetes (Modules 8 and 10).'],
    ['Running every build on the controller in production.', 'Builds can read JENKINS_HOME and its secrets, and slow down the UI (see the warning of Manage Jenkins).', 'Agents only; built-in node at 0 executors (Module 12).'],
    ['Giant Freestyle jobs edited by hand in the UI.', 'Not versioned, not reviewed, hard to reproduce.', 'Pipelines as code in a Jenkinsfile stored in Git (Modules 4 and 5).'],
    ['Installing dozens of plugins "just in case".', 'Each plugin is code to update and a possible vulnerability.', 'Install what you use, update regularly, remove the rest (Module 12).'],
    ['Using the weekly release in production.', 'More changes, less stabilization time.', 'Use an LTS; test upgrades on a staging instance first.'],
    ['Calling "CD" an automatic deployment that has a manual approval.', 'That is continuous delivery, not deployment.', 'Ask whether production needs an approval.'],
    ['Editing `config.xml` files on disk while Jenkins runs.', 'Changes are ignored until reload, and a typo breaks the job.', 'Use the UI, the API or code; reload from disk only on purpose.'],
  ] },

  { t: 'h', id: 'm1-14', text: '1.14 Recap' },
  { t: 'recap', items: [
    'Jenkins is a **self-hosted, open source automation server** extended by **2,300+ plugins**; production runs an **LTS** (here **2.580.2**, Java 21).',
    '**CI** = every change built and tested; **continuous delivery** = always releasable, production on approval; **continuous deployment** = production automatically.',
    'The **controller** stores the configuration in **JENKINS_HOME** and schedules builds; **agents** on **nodes** run them in **executors** and **workspaces**.',
    'A build goes: **trigger → queue → node with a matching label and a free executor → workspace → steps → artifacts and reports → result and notifications**.',
    'Building on the **built-in node** is a security risk: production uses agents only.',
    'Jenkins decides **when and in which order**; **Ansible** describes **how servers must be configured** — Jenkins calls Ansible in its deploy stages.',
    'A **Pipeline** job is **code** (stages and steps) and gives a graph, a replay and a history that Freestyle jobs do not.',
  ] },
  { t: 'h', id: 'm1-15', text: '1.15 Quiz' },
  { t: 'quiz', id: 'quiz1', questions: [
    { q: 'What best describes Jenkins?', choix: ['A Git hosting service', 'A self-hosted, open source automation server', 'A configuration management tool like Ansible', 'A container orchestrator'], bonne: 1, pourquoi: 'Jenkins automates build, test and delivery tasks; it is installed and operated by you.' },
    { q: 'A change passes all the tests and is deployed to production automatically. This is…', choix: ['Continuous integration', 'Continuous delivery', 'Continuous deployment', 'Nightly build'], bonne: 2, pourquoi: 'No human approval before production: continuous deployment.' },
    { q: 'What separates continuous delivery from continuous deployment?', choix: ['The use of Docker', 'A manual approval before production', 'The number of tests', 'The use of Git'], bonne: 1, pourquoi: 'Delivery: always releasable, production on a human decision.' },
    { q: 'Where does a build run?', choix: ['In the browser of the user', 'In an executor of a node', 'In the update center', 'In Git'], bonne: 1, pourquoi: 'A node (built-in node or agent) offers executors; each executor runs one build.' },
    { q: 'What does "Build Executor Status 0/2" mean on a fresh Docker install?', choix: ['0 jobs out of 2 exist', '0 of the 2 executors of the built-in node are busy', '2 builds failed', '2 agents are offline'], bonne: 1, pourquoi: 'The built-in node has 2 executors, none busy.' },
    { q: 'Why should production builds not run on the built-in node?', choix: ['It is slower than Docker', 'Builds could access JENKINS_HOME and its secrets, and slow down the controller', 'It does not support pipelines', 'It requires a license'], bonne: 1, pourquoi: 'Controller isolation: builds run on agents; built-in node at 0 executors.' },
    { q: 'Which directory holds jobs, build history, plugins and secrets?', choix: ['/usr/share/jenkins', '/var/jenkins_home (JENKINS_HOME)', '/tmp', '/etc/jenkins/plugins'], bonne: 1, pourquoi: 'Everything is in JENKINS_HOME — that is what you back up.' },
    { q: 'What is `2.580.2`?', choix: ['A weekly release', 'The second update of the LTS baseline 2.580', 'Jenkins 2, plugin 580', 'A Java version'], bonne: 1, pourquoi: 'LTS: baseline 2.580, updates .1, .2, .3 every 4 weeks.' },
    { q: 'An agent behind a firewall cannot be reached by the controller. Which connection method fits?', choix: ['SSH from the controller', 'Inbound agent (WebSocket or TCP 50000) started from the agent', 'Webhook', 'Update center'], bonne: 1, pourquoi: 'The agent opens the connection to the controller.' },
    { q: 'How do Jenkins and Ansible usually work together?', choix: ['Ansible replaces Jenkins', 'Jenkins orchestrates the pipeline and runs an Ansible playbook in a deploy stage', 'Jenkins configures servers through Ansible plugins only', 'They cannot be combined'], bonne: 1, pourquoi: 'Jenkins: when and in which order; Ansible: how servers are configured.' },
  ] },
  { t: 'h', id: 'm1-16', text: '1.16 Validation checklist' },
  { t: 'checklist', id: 'm1', items: [
    'I can define Jenkins in two sentences and explain why a team uses it.',
    'I can explain CI, continuous delivery and continuous deployment with an example of each.',
    'I can justify a choice between Jenkins, GitLab CI/CD, GitHub Actions and Azure DevOps.',
    'I can name the components: controller, node, agent, executor, label, workspace, artifact, JENKINS_HOME.',
    'I can tell the 7 steps of the life of a build.',
    'I know why production builds do not run on the built-in node.',
    'I completed Lab 1.1 (architecture) and Lab 1.2 (first pipeline).',
    'I can explain how Jenkins and Ansible complement each other.',
  ] },
]
