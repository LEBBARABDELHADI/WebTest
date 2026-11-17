// Module 5 — Git integration. Gitea 28.4.0 runs in the lab as the Git server; every screenshot, scan log
// and console output comes from the lab (Jenkins 2.580.2 LTS, Gitea plugin 286.v0740a_413c1eb_, 2026-11-17).
// The code constants are generated from the files that ran.

export const COMPOSE_GITEA = `  gitea:
    image: docker.gitea.com/gitea:28.4.0      # self-hosted Git server for the labs (Module 5)
    container_name: gitea
    restart: unless-stopped
    environment:
      USER_UID: "1000"
      USER_GID: "1000"
      GITEA__server__ROOT_URL: http://gitea:3000/          # the address Jenkins uses (links adapt to the browser host)
      GITEA__server__DISABLE_SSH: "true"                   # HTTP only in the lab
      GITEA__security__INSTALL_LOCK: "true"                # no web installer: configured by these variables
      GITEA__database__DB_TYPE: sqlite3
      GITEA__service__DISABLE_REGISTRATION: "true"         # accounts are created by the admin
      GITEA__security__ALLOWED_HOST_LIST: private          # webhooks may call private addresses (the Jenkins container)
    ports:
      - "3000:3000"                           # http://localhost:3000 in your browser
    volumes:
      - gitea_data:/data                      # repositories, database, configuration
`

export const JF_INVENTORY = `// Jenkinsfile of lab/inventory — one pipeline for every branch and pull request (GitFlow)
pipeline {
    agent { label 'linux' }
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout info') {
            steps {
                sh 'git log -1 --pretty="commit %h by %an: %s"'
                echo "Branch: \${env.BRANCH_NAME}, pull request: \${env.CHANGE_ID ?: 'none'}"
            }
        }
        stage('Build') {
            steps { sh './scripts/build.sh' }
        }
        stage('Test') {
            steps { sh './scripts/test.sh' }
        }
        stage('Deploy to staging') {
            when { branch 'develop' }
            steps { echo "Deploying \${env.BRANCH_NAME} to staging" }
        }
        stage('Release candidate') {
            when { branch pattern: 'release/.*', comparator: 'REGEXP' }
            steps { echo "Building a release candidate from \${env.BRANCH_NAME}" }
        }
        stage('Deploy to production') {
            when { branch 'main' }
            steps { echo 'Deploying main to production' }
        }
        stage('Pull request checks') {
            when { changeRequest() }
            steps { echo "PR-\${env.CHANGE_ID}: \${env.CHANGE_BRANCH} -> \${env.CHANGE_TARGET}, by \${env.CHANGE_AUTHOR}" }
        }
    }

    post {
        always { archiveArtifacts artifacts: 'dist/*', allowEmptyArchive: true }
    }
}
`

export const BUILD_SH = `#!/bin/sh -e
# Build: write the deliverable of this version into dist/
VERSION=$(cat VERSION)
mkdir -p dist
printf 'inventory %s\\ncommit %s\\n' "$VERSION" "$(git rev-parse --short HEAD)" > "dist/inventory-$VERSION.txt"
echo "Built dist/inventory-$VERSION.txt"
`

export const TEST_SH = `#!/bin/sh -e
# Tests: the deliverable exists and carries the version of the VERSION file
VERSION=$(cat VERSION)
grep -q "^inventory $VERSION$" "dist/inventory-$VERSION.txt"
echo "Tests passed for version $VERSION"
`

export const MODULE5 = [
  { t: 'objectives', items: [
    'Explain how Jenkins reads code from Git: clone over HTTPS or SSH, credentials, Jenkinsfile from SCM.',
    'Connect a Pipeline job to a repository with **Pipeline script from SCM**.',
    'Know the plugins and webhook URLs of **GitHub**, **GitLab**, **Bitbucket** (and Gitea, used in the lab).',
    'Trigger builds automatically with **webhooks** instead of polling, and debug a webhook that fails.',
    'Build every branch and pull request with a **Multibranch Pipeline**.',
    'Apply a **GitFlow** branching strategy in one Jenkinsfile with `when { branch … }`.',
    'Report build results back to the Git server: commit statuses and pull request checks.',
  ] },
  { t: 'p', text: 'Prerequisite: the lab of Module 4. This module adds a Git server to the lab — **Gitea**, a lightweight self-hosted forge with the same concepts as GitHub and GitLab (organizations, pull requests, webhooks, commit statuses), so that every step can run on your machine without an account anywhere. Screenshots marked *Real screenshot · Gitea 28.4.0* show Gitea itself.' },

  { t: 'h', id: 'm5-1', text: '5.1 How Jenkins works with Git' },
  { t: 'table', head: ['Piece', 'Role', 'In the lab'], rows: [
    ['**Git plugin**', 'Clones and fetches repositories on the agent (`git` must be installed there)', 'Installed with the suggested plugins; git 2.47.3 in agent-1'],
    ['**Credentials**', 'Username + token (HTTPS) or SSH key, stored in Jenkins (Module 3)', '`gitea-jenkins-bot`: the account `jenkins-bot` and its access token'],
    ['**Pipeline script from SCM**', 'Reads the `Jenkinsfile` from the repository instead of the job form', 'Job `inventory-main`'],
    ['**Branch source plugin**', 'Talks to the forge API: lists branches and pull requests, reports statuses', 'Gitea plugin (GitHub Branch Source, GitLab Branch Source, Bitbucket Branch Source elsewhere)'],
    ['**Webhook**', 'The forge calls Jenkins on each push / pull request event', '`http://jenkins:8080/gitea-webhook/post`'],
    ['**Multibranch Pipeline**', 'One pipeline per branch and pull request that contains a Jenkinsfile', 'Job `inventory`'],
  ] },
  { t: 'diagram', id: 'm5-flux', caption: 'What happens when a developer pushes: (1) push, (2) webhook to Jenkins, (3) build on the agent, (4) clone with the bot credential, (5) status back to Gitea.' },
  { t: 'callout', kind: 'why', title: 'Why a bot account and a token?', text: 'Jenkins should not use a person\'s password: create a dedicated account (`jenkins-bot`) with the minimum rights, and give Jenkins a **personal access token** of that account (scopes `write:repository`, `read:user`, `read:organization` here). Tokens can be revoked one by one and never open the web UI with your password.' },

  { t: 'h', id: 'm5-2', text: '5.2 The Git server of the lab' },
  { t: 'p', text: 'Add this service to `~/jenkins-lab/docker-compose.yml` (before `volumes:`) and declare the volume `gitea_data:` at the bottom.' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/docker-compose.yml — service to add', code: COMPOSE_GITEA, lignes: [
    [2, 'Gitea 28.4.0, from the official registry of the project.'],
    [6, 'Gitea runs as uid/gid 1000 inside its container.'],
    [8, '`ROOT_URL`: the address used by Jenkins (`gitea` is the service name). Gitea adapts its links to the host you browse with, so `http://localhost:3000` works in your browser.'],
    [9, 'No SSH server: the lab clones over HTTP with a token.'],
    [10, '`INSTALL_LOCK`: skip the web installer; the variables configure Gitea.'],
    [12, 'Accounts are created by the administrator only.'],
    [13, '**Mandatory for webhooks to Jenkins**: Gitea 28 refuses to call private addresses unless they are allowed (section 5.5).'],
    [17, 'Repositories, database and configuration in a named volume.'],
  ] },
  { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'docker compose up -d gitea\ncurl -s http://localhost:3000/api/v1/version\ndocker compose exec -u git gitea gitea admin user create --admin --username lab-admin --password "<password>" --email lab-admin@example.com --must-change-password=false\ndocker compose exec -u git gitea gitea admin user create --username jenkins-bot --password "<password>" --email jenkins-bot@example.com --must-change-password=false', out: `{"version":"28.4.0"}
New user 'lab-admin' has been successfully created!
New user 'jenkins-bot' has been successfully created!`, note: 'Then, in http://localhost:3000 as `lab-admin`: create the organization `lab`, the repository `lab/inventory`, add `jenkins-bot` as collaborator with **Admin** rights (needed later to manage webhooks), log in as `jenkins-bot` → **Settings → Applications** → generate a token with the scopes above. We also created `alice`, a developer.' },
  { t: 'p', text: 'The repository contains two scripts, a `VERSION` file and the Jenkinsfile of section 5.7. We pushed it, then created the GitFlow branches:' },
  { t: 'code', lang: 'bash', file: 'lab/inventory — scripts/build.sh', code: BUILD_SH, lignes: [[1, '`-e`: stop at the first error.'], [3, 'The version comes from the `VERSION` file of the branch.'], [5, 'The deliverable records the version and the commit.']] },
  { t: 'code', lang: 'bash', file: 'lab/inventory — scripts/test.sh', code: TEST_SH, lignes: [[4, 'The test fails (exit 1) if the deliverable does not carry the expected version.']] },
  { t: 'cmd', where: 'Your clone of lab/inventory', cmd: 'git log --oneline --all --graph', out: `* 4f3b27e Document the branching model
| * ffed01f Stock alerts: document the feature
|/
| * 2b70a9c Release 1.1: bump version
|/
* c788b2c Initial version: build and test scripts, Jenkinsfile`, note: '`main` and `develop` start at c788b2c; `release/1.1` bumps the version to 1.1.0; `feature/stock-alerts` (by alice) is open as **pull request #1** into `develop`; 4f3b27e is a later commit on `develop` (section 5.5).' },
  { t: 'shot', id: 'm5-08-gitea-repo', titre: 'Gitea: the repository lab/inventory', ce: 'The repository, on the `develop` branch.', éléments: ['The branch selector: `develop` (4 branches).', 'The `Jenkinsfile`, versioned with the code.', 'The status of the last commit, set by Jenkins (green check).'], actions: ['Open http://localhost:3000/lab/inventory and switch branches.'], résultat: 'Code, Jenkinsfile and build status in one place.' },

  { t: 'h', id: 'm5-3', text: '5.3 Connect a Pipeline job to Git' },
  { t: 'shot', id: 'm5-02-credential', titre: 'Credentials: the token of jenkins-bot', ce: 'A *Username with password* credential, where the password is the access token.', éléments: ['**Username**: `jenkins-bot`.', '**Password**: its access token (hidden by the course).', '**ID**: `gitea-jenkins-bot` — referenced by jobs.', '**Create**.'], actions: ['Manage Jenkins → Credentials → System → Global → Add Credentials → *Username with password*.'], résultat: 'Jenkins can authenticate to Gitea, over HTTPS and on the API.' },
  { t: 'p', text: 'Create a Pipeline job `inventory-main` and, in its **Pipeline** section, choose **Pipeline script from SCM**:' },
  { t: 'shot', id: 'm5-04-scm-config', titre: 'Pipeline → Definition: Pipeline script from SCM', ce: 'Instead of pasting the script, Jenkins reads it from the repository.', éléments: ['**Definition**: *Pipeline script from SCM*, SCM *Git*.', '**Repository URL**: `http://gitea:3000/lab/inventory.git` — the address as seen from Jenkins and its agents.', '**Credentials**: `jenkins-bot/******`.', '**Branch Specifier**: `*/main` (just below).'], actions: ['Fill the fields, then scroll down.'], résultat: 'Jenkins knows where the code is.' },
  { t: 'shot', id: 'm5-04b-script-path', titre: 'Script Path and lightweight checkout', ce: 'The path of the Jenkinsfile in the repository.', éléments: ['**Script Path**: `Jenkinsfile` (at the root).', '**Lightweight checkout**: read only the Jenkinsfile through the API before allocating an agent; the full checkout happens in the pipeline.'], actions: ['**Save**, then **Build Now**.'], résultat: 'The build reads the Jenkinsfile from main.' },
  { t: 'cmd', where: 'inventory-main #1 → Console Output (real text, excerpt)', cmd: '', out: `Obtained Jenkinsfile from git http://gitea:3000/lab/inventory.git
Running on agent-1 in /home/jenkins/agent/workspace/inventory-main
using credential gitea-jenkins-bot
Cloning repository http://gitea:3000/lab/inventory.git
 > git fetch --tags --force --progress -- http://gitea:3000/lab/inventory.git +refs/heads/*:refs/remotes/origin/* # timeout=10
Checking out Revision c788b2c32095714e15a3e7ee921de6e646b03a28 (refs/remotes/origin/main)
Commit message: "Initial version: build and test scripts, Jenkinsfile"
[2026-11-17T13:30:51.956Z] commit c788b2c by Lab Admin: Initial version: build and test scripts, Jenkinsfile
[2026-11-17T13:30:51.972Z] Branch: null, pull request: none
[2026-11-17T13:30:52.277Z] Built dist/inventory-1.0.0.txt
[2026-11-17T13:30:52.587Z] Tests passed for version 1.0.0
Stage "Deploy to staging" skipped due to when conditional
Stage "Release candidate" skipped due to when conditional
Stage "Deploy to production" skipped due to when conditional
Stage "Pull request checks" skipped due to when conditional
Finished: SUCCESS`, note: 'Two lessons: Jenkins clones with the credential (`using credential gitea-jenkins-bot`) and checks out a precise commit; and in a single-branch job `BRANCH_NAME` is **null**, so every `when { branch … }` stage is skipped — branch conditions need a **multibranch** job (section 5.6).' },

  { t: 'h', id: 'm5-4', text: '5.4 GitHub, GitLab and Bitbucket' },
  { t: 'p', text: 'The mechanics are the same on every forge: a branch-source plugin, a credential for the API, a webhook to Jenkins, statuses back. What changes is the plugin and the webhook endpoint:' },
  { t: 'table', head: ['Forge', 'Plugin', 'Webhook URL on Jenkins', 'Credential'], rows: [
    ['GitHub / GitHub Enterprise', '**GitHub Branch Source** (with the GitHub plugin)', '`https://<jenkins>/github-webhook/`', 'A **GitHub App** (recommended: higher API limits, fine-grained rights) or a token'],
    ['GitLab', '**GitLab Branch Source** (multibranch) — or the GitLab plugin for single jobs', '`https://<jenkins>/gitlab-webhook/post` (Branch Source) · `https://<jenkins>/project/<job>` (GitLab plugin)', 'A GitLab personal or group access token'],
    ['Bitbucket Cloud / Data Center', '**Bitbucket Branch Source**', 'Created by the plugin itself when *Manage hooks* is enabled', 'App password / HTTP access token'],
    ['Gitea / Forgejo (this lab)', '**Gitea**', '`http://<jenkins>/gitea-webhook/post`', 'Username + access token'],
  ] },
  { t: 'callout', kind: 'info', title: 'Why no GitHub screenshots?', text: 'Showing GitHub, GitLab or Bitbucket would require an account on these services and a Jenkins reachable from the internet; our lab is local. The URLs above come from the documentation of each plugin on plugins.jenkins.io; the procedure is the one you follow below with Gitea. *Add Credentials* in your Jenkins already offers the **GitHub App** kind (Module 3).' },
  { t: 'callout', kind: 'enterprise', text: 'GitHub and GitLab must be able to reach Jenkins for webhooks: either Jenkins has a public HTTPS URL (behind a reverse proxy, Module 2), or you use a relay. If the forge cannot reach Jenkins at all, fall back to periodic scans (*Scan Multibranch Pipeline Triggers*), which cost API calls and add delay.' },

  { t: 'h', id: 'm5-5', text: '5.5 Webhooks: builds triggered by a push' },
  { t: 'p', text: '**Polling** (`pollSCM`) asks the server every N minutes whether something changed: slow and costly. A **webhook** is the opposite: the forge calls Jenkins the moment something happens. Install the Gitea plugin first:' },
  { t: 'shot', id: 'm5-01-plugin-gitea', titre: 'Available plugins: Gitea', ce: 'The Gitea plugin adds a branch source, the webhook endpoint and the status notifier.', éléments: ['Search *Gitea*.', 'Tick **Gitea** (version 286.v0740a_413c1eb_).', 'Health score.', '**Install** — it also installs *Authentication Tokens API* and *Handy Uri Templates 2.x API*; no restart needed.'], actions: ['Install the plugin.'], résultat: 'Gitea appears in **Manage Jenkins → System** and in the branch sources.' },
  { t: 'shot', id: 'm5-03-gitea-server', titre: 'Manage Jenkins → System → Gitea Servers', ce: 'Declare the server once for every job.', éléments: ['**Display name**: `Lab Gitea`.', '**Server URL**: `http://gitea:3000`, as Jenkins reaches it.', '**Manage hooks**: let Jenkins create the webhooks…', '…with these credentials.'], actions: ['**Add → Gitea Server**, fill, **Save**.'], résultat: 'Jenkins can query Gitea and report statuses.' },
  { t: 'callout', kind: 'warning', title: 'Manage hooks needs a reachable Jenkins URL', text: 'In our lab, *Manage hooks* created **no** webhook: the Jenkins URL is `http://localhost:8080/`, an address Gitea cannot call (inside the Gitea container, `localhost` is Gitea itself). In production the Jenkins URL is a real name (`https://jenkins.example.com/`) and the hook is created automatically. In the lab, create it by hand in Gitea:' },
  { t: 'shot', id: 'm5-09-gitea-webhook-form', titre: 'Gitea: repository → Settings → Webhooks → Add Webhook → Gitea', ce: 'The webhook that calls Jenkins.', éléments: ['**Target URL**: `http://jenkins:8080/gitea-webhook/post`.', '**Name**: `Jenkins`.', '**Secret**: optional shared secret.', '**Branch filter**: `*` (all branches). Trigger on **All Events**.'], actions: ['Fill, choose *All Events*, **Add Webhook**, then open it and click **Test Push Event**.'], résultat: 'A first delivery is attempted.' },
  { t: 'shot', id: 'm5-10-gitea-delivery-error', titre: 'Gitea: the test delivery failed', ce: 'Gitea 28 has an **egress policy**: by default it refuses to call private addresses, such as the Jenkins container.', éléments: ['The delivery (red triangle).', '**Response** tab.', '*Delivery: Post "http://jenkins:8080/gitea-webhook/post": dial tcp 172.18.0.2:8080: denied by egress policy*.'], actions: ['Read the response of every failed delivery: it says why.'], résultat: 'The cause is on the Gitea side, not in Jenkins.' },
  { t: 'cmd', where: 'docker compose logs gitea (real excerpts, while fixing)', cmd: '', out: `Unable to deliver webhook task[1]: … Post "http://jenkins:8080/gitea-webhook/post": dial tcp 172.18.0.2:8080: denied by egress policy: jenkins(172.18.0.2) needs an explicit IP allow entry (non-public address)
Deprecation: config option \`[webhook].ALLOWED_HOST_LIST\` present, please use \`[security].ALLOWED_HOST_LIST\` instead because this fallback will be/has been removed in v28.0.0
[security] ALLOWED_HOST_LIST only restricts private hosts in the default lax mode, set EGRESS_MODE = strict to allow only the listed hosts, or lax to keep this`, note: 'Our attempts, in order: `GITEA__webhook__ALLOWED_HOST_LIST: jenkins` (old section, deprecated, still denied), `GITEA__security__ALLOWED_HOST_LIST: jenkins` (a host name is not an *IP allow entry*, still denied), then `GITEA__security__ALLOWED_HOST_LIST: private` (allowed). In production, list the exact address range of Jenkins rather than every private address.' },
  { t: 'shot', id: 'm5-11-gitea-delivery-ok', titre: 'Gitea: the delivery succeeded', ce: 'After `docker compose up -d --force-recreate gitea`, the test push reaches Jenkins.', éléments: ['The latest delivery.', '**Response** tab.', 'Status **200** from Jenkins.'], actions: ['Click **Test Push Event** again.'], résultat: 'Gitea can call Jenkins.' },
  { t: 'p', text: 'Now a real push. Alice commits on `develop` and pushes; Jenkins builds `develop` within seconds, without any scan or schedule:' },
  { t: 'shot', id: 'm5-12-push-cause', titre: 'develop #2: started by the webhook', ce: 'The build page says why the build started.', éléments: ['*Push event to branch develop* — the cause, sent by the webhook.', 'The revision built.'], actions: ['Compare with build #1, started by *Branch indexing*.'], résultat: 'Every push builds automatically.' },
  { t: 'cmd', where: 'inventory » develop #2 → Console Output (real text, excerpt)', cmd: '', out: `Push event to branch develop
Current revision of branch develop is 4f3b27ed467647e932a3992de819a32bc718be4f
[Gitea] Notifying branch build status: PENDING Build started...
[Gitea] Notified
[2026-11-17T13:40:07.723Z] Deploying develop to staging
Stage "Release candidate" skipped due to when conditional
Stage "Deploy to production" skipped due to when conditional
Stage "Pull request checks" skipped due to when conditional
[Gitea] Notifying branch build status: SUCCESS This commit looks good
[Gitea] Notified
Finished: SUCCESS` },

  { t: 'h', id: 'm5-6', text: '5.6 Multibranch Pipelines' },
  { t: 'p', text: 'A **Multibranch Pipeline** is a folder of pipelines created automatically: Jenkins **scans** the repository and creates one job per branch and per pull request that contains a Jenkinsfile; it deletes them when the branch disappears. `BRANCH_NAME`, `CHANGE_ID`, `CHANGE_TARGET`… are set, so the same Jenkinsfile can behave differently per branch.' },
  { t: 'p', text: '**New Item → `inventory` → Multibranch Pipeline**, then **Add source → Gitea**:' },
  { t: 'shot', id: 'm5-05-multibranch-source', titre: 'Multibranch → Branch Sources → Gitea', ce: 'Where the branches come from.', éléments: ['**Server**: `Lab Gitea`.', '**Credentials**: `jenkins-bot`.', '**Owner**: `lab` (user or organization).', '**Repository**: `inventory`, listed through the API.', '**Behaviours**: discover branches, pull requests from origin and from forks, each with a strategy.'], actions: ['Fill, keep *Build Configuration: by Jenkinsfile*, **Save**.'], résultat: 'Jenkins scans the repository immediately.' },
  { t: 'table', head: ['Behaviour (default strategy)', 'Effect'], rows: [
    ['Discover branches — *Only branches that are not also filed as PRs*', 'A branch with an open PR is built once, as the PR (here `feature/stock-alerts` → PR-1)'],
    ['Discover pull requests from origin — *Merging the pull request with the current target branch revision*', 'Builds the result of the merge, i.e. what `develop` will contain'],
    ['Discover pull requests from forks — trust *Contributors*', 'A fork cannot change the Jenkinsfile used: protection against malicious pull requests'],
  ] },
  { t: 'cmd', where: 'inventory → Scan Multibranch Pipeline Log (real text)', cmd: '', out: `Started by user Lab Admin
[Tue Nov 17 13:32:33 UTC 2026] Starting branch indexing...
Looking up repository lab/inventory
Looking up repository lab/inventory

  Checking branches...

    Checking branch feature/stock-alerts

    Checking branch release/1.1
      ‘Jenkinsfile’ found
    Met criteria
Scheduled build for branch: release/1.1

    Checking branch develop
      ‘Jenkinsfile’ found
    Met criteria
Scheduled build for branch: develop

    Checking branch main
      ‘Jenkinsfile’ found
    Met criteria
Scheduled build for branch: main

  4 branches were processed

  Checking pull requests...

  Checking pull request #1
      ‘Jenkinsfile’ found
    Met criteria
Scheduled build for branch: PR-1

  1 pull requests were processed
[Tue Nov 17 13:32:34 UTC 2026] Finished branch indexing. Indexing took 0.34 sec
Finished: SUCCESS`, note: '`feature/stock-alerts` is checked but not built as a branch: it is filed as PR #1. `PR-1` is the job of the pull request.' },
  { t: 'shot', id: 'm5-06-branches', titre: 'The multibranch job: one job per branch', ce: 'Jenkins created the jobs from the scan.', éléments: ['**Branches (3)**: main, develop, release/1.1.', '**Pull Requests (1)**.', '`develop`: its own history (#2 by the webhook).', '**Scan Multibranch Pipeline Now**: scan again by hand.'], actions: ['Open each branch job.'], résultat: 'Branches appear and disappear with the repository.' },
  { t: 'shot', id: 'm5-07-prs', titre: 'Pull Requests tab', ce: 'One job per open pull request, named `PR-<number>`.', éléments: ['**PR-1**: *Stock alerts*, from `feature/stock-alerts` into `develop`.'], actions: ['Open PR-1 and its console.'], résultat: 'The pull request is built before it is merged.' },

  { t: 'h', id: 'm5-7', text: '5.7 A GitFlow strategy in one Jenkinsfile' },
  { t: 'diagram', id: 'm5-gitflow', caption: 'GitFlow: features merge into develop through pull requests, releases are stabilized on release/*, main is production. On the right, the stage each branch runs.' },
  { t: 'code', lang: 'groovy', file: 'lab/inventory — Jenkinsfile', code: JF_INVENTORY, lignes: [
    [3, 'Every branch builds on agent-1.'],
    [12, 'Show which commit is built.'],
    [13, '`BRANCH_NAME` is the branch (or `PR-1`); `CHANGE_ID` the pull request number, empty for branches — `?:` gives a default.'],
    [17, 'Build and Test run on every branch and pull request.'],
    [23, '`when { branch \'develop\' }`: only on develop.'],
    [27, 'A pattern: every `release/…` branch.'],
    [31, 'Only on main: production.'],
    [35, '`changeRequest()`: only when building a pull request.'],
    [36, '`CHANGE_BRANCH` → `CHANGE_TARGET`: source and target of the pull request.'],
    [41, 'Keep the deliverable of every build; `allowEmptyArchive` avoids failing when there is none.'],
  ] },
  { t: 'shot', id: 'm5-13-main-graph', titre: 'main #1 → Stages', ce: 'On main, only the production stage of the GitFlow stages runs.', éléments: ['*Deploy to staging*: skipped.', '*Release candidate*: skipped.', '*Deploy to production*: runs.', '*Pull request checks*: skipped.'], actions: ['Open the same view for develop, release/1.1 and PR-1.'], résultat: 'One Jenkinsfile, four behaviours.' },
  { t: 'cmd', where: 'inventory » release/1.1 #1 (real text, excerpt)', cmd: '', out: `[2026-11-17T13:32:42.509Z] Built dist/inventory-1.1.0.txt
[2026-11-17T13:32:42.811Z] Tests passed for version 1.1.0
Stage "Deploy to staging" skipped due to when conditional
[2026-11-17T13:32:42.892Z] Building a release candidate from release/1.1
Stage "Deploy to production" skipped due to when conditional
Stage "Pull request checks" skipped due to when conditional
Finished: SUCCESS`, note: 'The release branch builds version **1.1.0** (its `VERSION` file) and runs only the release-candidate stage.' },

  { t: 'h', id: 'm5-8', text: '5.8 Pipelines on pull requests and commit statuses' },
  { t: 'cmd', where: 'inventory » PR-1 #1 → Console Output (real text, excerpt)', cmd: '', out: `Querying the current revision of pull request #1...
Obtained Jenkinsfile from c788b2c32095714e15a3e7ee921de6e646b03a28+ffed01fc011c53c8bd983d8525aaf995bd5d1da5
Merging remotes/origin/develop commit c788b2c32095714e15a3e7ee921de6e646b03a28 into PR head commit ffed01fc011c53c8bd983d8525aaf995bd5d1da5
Merge succeeded, producing ffed01fc011c53c8bd983d8525aaf995bd5d1da5
[Gitea] Notifying pull request build status: PENDING Build started...
[2026-11-17T13:32:43.717Z] Branch: PR-1, pull request: 1
[2026-11-17T13:32:44.514Z] PR-1: feature/stock-alerts -> develop, by null
[Gitea] Notifying pull request build status: SUCCESS This commit looks good
Finished: SUCCESS`, note: 'Jenkins merged `develop` into the pull request before building, as the strategy asked, and notified Gitea twice (PENDING, then SUCCESS). `by null`: the Gitea source does not set `CHANGE_AUTHOR` — check which variables your branch source provides before using them.' },
  { t: 'shot', id: 'm5-14-gitea-pr', titre: 'Gitea: the pull request and its check', ce: 'The reviewers see the result of Jenkins in the pull request.', éléments: ['*alice wants to merge 1 commits from feature/stock-alerts into develop*.', '**All checks were successful**.', 'The status context `inventory/pipeline/pr-develop`, set by Jenkins.', '*This commit looks good*.'], actions: ['In Gitea, make this check **required** in the branch protection of `develop`: a red build then blocks the merge.'], résultat: 'Nothing is merged into develop without a green build.' },
  { t: 'shot', id: 'm5-15-gitea-commits', titre: 'Gitea: commit statuses on develop', ce: 'Each commit built by Jenkins carries its status.', éléments: ['The status of the latest commit (green).', 'The commit pushed by alice: *Document the branching model*.'], actions: ['Click the status icon: it links to the build in Jenkins.'], résultat: 'From Git to the build in one click.' },

  { t: 'h', id: 'm5-9', text: '5.9 Common errors and fixes' },
  { t: 'errors', rows: [
    ['Gitea delivery: `dial tcp 172.18.0.2:8080: denied by egress policy: jenkins(172.18.0.2) needs an explicit IP allow entry (non-public address)`', 'Gitea 28 blocks webhooks to private addresses by default.', 'Set `GITEA__security__ALLOWED_HOST_LIST` with an IP range or `private`, recreate the container.'],
    ['`Deprecation: config option [webhook].ALLOWED_HOST_LIST present, please use [security].ALLOWED_HOST_LIST`', 'Old setting name (it was under `[webhook]`).', 'Use `[security].ALLOWED_HOST_LIST` (`GITEA__security__ALLOWED_HOST_LIST`); remove the old key from `app.ini`.'],
    ['*Manage hooks* is ticked but no webhook appears on the repository', 'The Jenkins URL is `localhost`: the forge could not call it anyway.', 'Give Jenkins a reachable URL (Manage Jenkins → System → Jenkins URL) or create the webhook by hand.'],
    ['`Branch: null` and every `when { branch … }` stage skipped', 'A single-branch Pipeline job does not set `BRANCH_NAME`.', 'Use a Multibranch Pipeline for branch logic.'],
    ['A branch has no job after a scan', 'No `Jenkinsfile` on that branch, or the branch is also filed as a pull request.', 'Read the scan log: `‘Jenkinsfile’ found` / `Met criteria` explain each decision.'],
    ['Clone fails with `Authentication failed` / HTTP 401', 'Wrong or expired token, or the bot has no access to the repository.', 'Regenerate the token, update the credential, add the bot as collaborator.'],
    ['A variable prints `null` in a PR build', 'This branch source does not provide it (`CHANGE_AUTHOR` with Gitea in our run).', 'Use `env.X ?: \'default\'` and check `/env-vars.html` of the PR job.'],
  ] },

  { t: 'h', id: 'm5-10', text: '5.10 Hands-on labs' },
  { t: 'lab', id: 'lab51', titre: 'Lab 5.1 — A Jenkinsfile read from Git', durée: '30 min', objectif: 'Run the lab Git server, push the inventory repository and build it with Pipeline script from SCM.', étapes: [
    { t: 'p', text: '**1.** Add the `gitea` service, start it, create `lab-admin`, `jenkins-bot`, the organization `lab` and the repository `lab/inventory`.' },
    { t: 'p', text: '**2.** Push the two scripts, `VERSION` (1.0.0) and the Jenkinsfile of section 5.7 on `main`.' },
    { t: 'p', text: '**3.** Create the credential `gitea-jenkins-bot` and the job `inventory-main` (Pipeline script from SCM, `*/main`).' },
    { t: 'p', text: '**4.** Build. Which commit was built? Why are the GitFlow stages skipped?' },
  ], solution: [
    { t: 'ul', items: ['The log shows `Checking out Revision c788b2c…` and `Commit message: "Initial version…"`.', '`Branch: null`: no branch name in a single-branch job, so `when { branch }` is false everywhere — Lab 5.2 fixes it with a multibranch job.'] },
  ] },
  { t: 'lab', id: 'lab52', titre: 'Lab 5.2 — A multibranch pipeline triggered by a webhook', durée: '45 min', objectif: 'Build every branch automatically after each push.', étapes: [
    { t: 'p', text: '**1.** Install the Gitea plugin and declare the server (Manage Jenkins → System).' },
    { t: 'p', text: '**2.** Create the multibranch job `inventory` with the Gitea source; read the scan log.' },
    { t: 'p', text: '**3.** Create the webhook in Gitea (section 5.5), test it, fix the egress policy, test again.' },
    { t: 'p', text: '**4.** Push a commit on `develop`. How long until the build starts? What is its cause?' },
    { t: 'p', text: '**5.** Create `release/1.1` with `VERSION` = 1.1.0 and push it: what happens without any click?' },
  ], solution: [
    { t: 'ul', items: ['The build starts a few seconds after the push, cause *Push event to branch develop*.', 'Pushing a new branch sends a *create* event: Jenkins creates the job `release/1.1` and builds it; the log shows *Building a release candidate from release/1.1* and version 1.1.0.'] },
  ] },
  { t: 'lab', id: 'lab53', titre: 'Lab 5.3 — Status checks on pull requests', durée: '30 min', objectif: 'Build a pull request, see its check in Gitea and block merges of red builds.', étapes: [
    { t: 'p', text: '**1.** As alice, create `feature/stock-alerts` from `develop`, commit, push, open a pull request into `develop`.' },
    { t: 'p', text: '**2.** Watch `PR-1` in Jenkins and the check in Gitea.' },
    { t: 'p', text: '**3.** Push a commit that breaks the build: remove the `VERSION` file (`git rm VERSION`). What do the PR job and the pull request show?' },
    { t: 'p', text: '**4.** Protect `develop` in Gitea so that the Jenkins check is required, then fix the branch (`git revert HEAD`) and push.' },
  ], solution: [
    { t: 'cmd', where: 'inventory » PR-1 #2 — after the breaking commit (real text, excerpt)', cmd: '', out: `Pull request #1 event
[Gitea] Notifying pull request build status: PENDING Build started...
[2026-11-17T13:44:27.521Z] cat: VERSION: No such file or directory
ERROR: script returned exit code 1
[Gitea] Notifying pull request build status: FAILURE There was a failure building this commit
Finished: FAILURE` },
    { t: 'shot', id: 'm5-16-gitea-pr-failed', titre: 'Gitea: the pull request with a failed check', ce: 'The webhook of the new commit (*Pull request #1 event*) started PR-1 #2, which failed; Jenkins reported it at once.', éléments: ['The new commit of alice.', '*Some required checks failed*.', '*There was a failure building this commit* — set by Jenkins.', '*This pull request can be merged automatically*: without branch protection, nothing stops a merge!'], actions: ['Add a protection rule on `develop` that requires the status `inventory/pipeline/pr-develop`.'], résultat: 'With the rule, the merge is blocked until a green build.' },
    { t: 'ul', items: ['`PR-1` builds the merge of the pull request into develop and reports *This commit looks good*.', 'After the breaking commit: `cat: VERSION: No such file or directory`, the build fails and the check turns red within seconds.', 'The revert makes PR-1 green again.'] },
    { t: 'callout', kind: 'tip', text: 'Branch protection lives in the forge (Gitea: Settings → Branches; GitHub: Rules; GitLab: Protected branches + "Pipelines must succeed"). Jenkins only reports the status; the forge enforces it.' },
  ] },
  { t: 'exercise', id: 'ex54', titre: 'Exercise 5.4 — Which trigger?', énoncé: [
    { t: 'p', text: 'Choose a trigger for each case: (1) a GitHub repository, Jenkins reachable on HTTPS; (2) a Git server in a network that cannot call Jenkins; (3) a nightly build of main, whatever the commits.' },
  ], solution: [
    { t: 'ol', items: ['A **webhook** (`/github-webhook/`), created by the branch source with *Manage hooks*.', 'Periodic **scans** of the multibranch job (or `pollSCM` for a single job), e.g. every 5 minutes — slower and costlier, but works without inbound connections.', '`triggers { cron(\'H 2 * * *\') }` in the Jenkinsfile (or *Build periodically*).'] },
  ] },
  { t: 'exercise', id: 'ex55', titre: 'Exercise 5.5 — Write the when conditions', énoncé: [
    { t: 'p', text: 'Add a stage *Hotfix checks* that runs only on branches `hotfix/…`, and change *Deploy to staging* so that it also runs for pull requests targeting `develop`.' },
  ], solution: [
    { t: 'code', lang: 'groovy', file: 'Jenkinsfile — new conditions', code: `stage('Hotfix checks') {
    when { branch pattern: 'hotfix/.*', comparator: 'REGEXP' }
    steps { echo "Hotfix checks for \${env.BRANCH_NAME}" }
}
stage('Deploy to staging') {
    when {
        anyOf {
            branch 'develop'
            changeRequest target: 'develop'
        }
    }
    steps { echo "Deploying \${env.BRANCH_NAME} to staging" }
}
`, lignes: [[2, 'A regular expression on the branch name.'], [7, '`anyOf`: one of the conditions is enough.'], [9, '`changeRequest target: \'develop\'`: a pull request into develop.']] },
  ] },

  { t: 'h', id: 'm5-11', text: '5.11 Recap, quiz and checklist' },
  { t: 'recap', items: [
    'Jenkins clones with a **credential** (a bot account and its token) and reads the **Jenkinsfile from SCM**.',
    'Each forge has its branch-source plugin and webhook endpoint: `/github-webhook/`, `/gitlab-webhook/post`, `/gitea-webhook/post`…',
    '**Webhooks** trigger builds within seconds; polling and scans are the fallback when the forge cannot reach Jenkins.',
    'A webhook that fails is debugged on the forge side first: its delivery shows the request and the response.',
    'A **Multibranch Pipeline** creates one job per branch and pull request, with `BRANCH_NAME`, `CHANGE_ID`, `CHANGE_TARGET`…',
    '**GitFlow** fits in one Jenkinsfile with `when { branch … }` and `changeRequest()`.',
    'Pull requests are built merged with their target; Jenkins reports **statuses** that the forge can require before merging.',
  ] },
  { t: 'quiz', id: 'quiz5', questions: [
    { q: 'Which account should Jenkins use to read the repositories?', choix: ['The administrator of the forge', 'A dedicated bot account with a token and minimum rights', 'The developer who created the job', 'An anonymous access'], bonne: 1, pourquoi: 'A bot token can be revoked alone and limited to what Jenkins needs.' },
    { q: 'In a single-branch Pipeline job, `when { branch \'main\' }` is…', choix: ['always true', 'always false, because BRANCH_NAME is not set', 'true only on Mondays', 'a syntax error'], bonne: 1, pourquoi: 'Our real log printed `Branch: null` and skipped every branch stage.' },
    { q: 'Webhook URL of the GitHub plugin?', choix: ['/github-webhook/', '/gitlab-webhook/post', '/project/<job>', '/git/notifyCommit'], bonne: 0, pourquoi: 'GitHub: `$JENKINS_URL/github-webhook/`.' },
    { q: 'Why did *Manage hooks* create no webhook in the lab?', choix: ['The plugin is broken', 'The Jenkins URL was localhost, unreachable from Gitea', 'Gitea does not support webhooks', 'The token was wrong'], bonne: 1, pourquoi: 'In production the Jenkins URL is a reachable name and the hook is created automatically.' },
    { q: 'Gitea answers "denied by egress policy". Where is the fix?', choix: ['In the Jenkinsfile', 'In the Gitea configuration: [security] ALLOWED_HOST_LIST', 'In the agent', 'In the credentials'], bonne: 1, pourquoi: 'Gitea 28 refuses private destinations unless allowed.' },
    { q: 'What does a Multibranch Pipeline create?', choix: ['One job for the whole repository', 'One job per branch and pull request containing a Jenkinsfile', 'One job per commit', 'One job per developer'], bonne: 1, pourquoi: 'Created and removed automatically by the scan.' },
    { q: 'With the default strategy, why was feature/stock-alerts not built as a branch?', choix: ['It had no Jenkinsfile', 'It was also filed as a pull request, built as PR-1', 'It was too old', 'Feature branches are never built'], bonne: 1, pourquoi: '*Only branches that are not also filed as PRs*.' },
    { q: 'What does PR-1 build with the default strategy?', choix: ['Only the commits of the PR', 'The pull request merged with the current target branch', 'The target branch only', 'Nothing until it is merged'], bonne: 1, pourquoi: 'The log: *Merging remotes/origin/develop … into PR head commit*.' },
    { q: 'Which condition runs a stage only for pull requests?', choix: ['when { branch \'PR\' }', 'when { changeRequest() }', 'when { pullRequest true }', 'when { expression { env.PR } }'], bonne: 1, pourquoi: '`changeRequest()` (optionally `target:`, `branch:`…).' },
    { q: 'Who prevents merging a pull request with a red build?', choix: ['Jenkins', 'The forge, with a required status check / branch protection', 'The agent', 'Git itself'], bonne: 1, pourquoi: 'Jenkins reports the status; the forge enforces the rule.' },
  ] },
  { t: 'checklist', id: 'm5', items: [
    'The lab Git server runs and `lab/inventory` has main, develop, release/1.1 and a pull request.',
    'Jenkins clones with the `gitea-jenkins-bot` credential (Lab 5.1).',
    'I know the plugin and webhook URL for GitHub, GitLab and Bitbucket.',
    'My webhook delivers (200) and a push builds within seconds (Lab 5.2).',
    'The multibranch job lists branches and pull requests; I can read its scan log.',
    'My Jenkinsfile behaves differently on main, develop, release/* and pull requests.',
    'The pull request shows the Jenkins check and develop requires it (Lab 5.3).',
  ] },
]

export default MODULE5
