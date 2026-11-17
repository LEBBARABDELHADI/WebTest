// Lab 0 — Run Jenkins locally. Every command output below was produced on a real machine
// (Docker Engine 29.9.2, Docker Compose v5.6.1) with the official image jenkins/jenkins:2.580.2-lts-jdk21,
// on 2026-11-17. Passwords, IDs and timings will differ on your machine.

export const COMPOSE = `# ~/jenkins-lab/docker-compose.yml — Lab 0: run Jenkins locally
services:
  jenkins:
    image: jenkins/jenkins:2.580.2-lts-jdk21   # official image, pinned LTS release (reproducible lab)
    container_name: jenkins                   # fixed name: easier "docker exec jenkins ..."
    restart: unless-stopped                   # comes back after a reboot, unless you stopped it
    ports:
      - "8080:8080"                           # web UI  -> http://localhost:8080
      - "50000:50000"                         # inbound agents (used in Module 12)
    volumes:
      - jenkins_home:/var/jenkins_home        # ALL Jenkins state lives here (jobs, plugins, secrets)

volumes:
  jenkins_home:                               # named volume managed by Docker
`

export const SCRIPT_SHELL = `echo "Hello from Jenkins!"
echo "Job: $JOB_NAME - build #$BUILD_NUMBER"
echo "Node: $NODE_NAME - workspace: $WORKSPACE"
java -version
date -u +"%Y-%m-%dT%H:%M:%SZ" > build-info.txt
echo "Build $BUILD_NUMBER of $JOB_NAME" >> build-info.txt`

export const LAB0 = [
  { t: 'objectives', items: [
    'Start a real Jenkins **2.580.2 LTS** on your machine with Docker Compose.',
    'Understand every line of the `docker-compose.yml` file.',
    'Unlock Jenkins, install the suggested plugins and create your administrator account.',
    'Run a first job and read its console output to prove that everything works.',
    'Stop, start, back up and reset the lab without losing data by mistake.',
  ] },
  { t: 'p', text: 'This lab gives you the Jenkins instance used in **every module** of the course. We run it with **Docker Compose** because it is the fastest way to get the official, identical Jenkins on Linux, macOS and Windows, and because you can delete everything and start again in one command. Native installations (apt, systemd, virtual machine) are covered in Module 2.' },
  { t: 'diagram', id: 'lab0', caption: 'What you are going to build: one container, one volume, two published ports.' },
  { t: 'callout', kind: 'why', title: 'Why Docker Compose and not "docker run"?', text: 'Both work. A Compose file **documents** the configuration (image, ports, volume, restart policy) in a file you can version in Git, review and reuse. In a team, "it runs with this file" is much easier to support than "it runs with this command I typed once".' },

  { t: 'h', id: 'l0-1', text: '0.1 Prerequisites' },
  { t: 'table', head: ['Item', 'Minimum for this lab', 'Why'], rows: [
    ['Docker', 'Docker Desktop (Windows/macOS) or Docker Engine 24+ (Linux) with **Compose v2** (`docker compose`)', 'Runs the official Jenkins image; Compose reads the YAML file.'],
    ['CPU / RAM', '2 CPU, **4 GB RAM** available for Docker', 'Jenkins is a Java application: 1–2 GB for Jenkins itself plus room for builds.'],
    ['Disk', '10 GB free', 'The image (~700 MB), the plugins (~200 MB here) and your builds.'],
    ['Free ports', '**8080** (web) and **50000** (agents)', 'Published on your machine by the container.'],
    ['Internet access', 'To `updates.jenkins.io` and `get.jenkins.io`', 'The setup wizard downloads the plugins.'],
    ['Browser', 'Any recent browser', 'Jenkins is administered from its web UI.'],
  ] },
  { t: 'p', text: 'Check Docker and Compose. Any recent version works; these are the versions used to write the lab:' },
  { t: 'cmd', where: 'Your terminal', cmd: 'docker --version\ndocker compose version', out: 'Docker version 29.9.2\nDocker Compose version v5.6.1', note: 'If `docker compose` is not found but `docker-compose` is, you have the old Compose v1: install the Compose plugin (v2) — v1 is no longer maintained.' },
  { t: 'p', text: 'Check that port 8080 is free (nothing should answer):' },
  { t: 'cmd', where: 'Your terminal (Linux/macOS)', cmd: 'curl -s -o /dev/null -w "%{http_code}\\n" http://localhost:8080', out: '000', note: '`000` means "no answer": the port is free. On Windows PowerShell: `Test-NetConnection localhost -Port 8080` must show `TcpTestSucceeded : False`.' },

  { t: 'h', id: 'l0-2', text: '0.2 Create the lab folder and the Compose file' },
  { t: 'cmd', where: 'Your terminal', cmd: 'mkdir -p ~/jenkins-lab\ncd ~/jenkins-lab', out: '', note: 'All the following commands are run from `~/jenkins-lab`: Compose looks for `docker-compose.yml` in the current folder.' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/docker-compose.yml', code: COMPOSE, lignes: [
    [2, '`services:` lists the containers of the project. Here, a single one.'],
    [3, '`jenkins:` is the **service name**, used by Compose commands: `docker compose logs jenkins`, `docker compose exec jenkins …`.'],
    [4, 'The **official** image from Docker Hub, **pinned** to the 2.580.2 LTS release with Java 21. Pinning gives everyone the same Jenkins; `lts-jdk21` would silently move to the next LTS.'],
    [5, 'A fixed container name instead of the generated `jenkins-lab-jenkins-1`.'],
    [6, 'Restart policy: Docker restarts Jenkins after a crash or a reboot, except if you stopped it yourself.'],
    [8, 'Host port 8080 → container port 8080: the web UI at http://localhost:8080. If 8080 is taken on your machine, write `"8081:8080"` and use http://localhost:8081.'],
    [9, 'Port 50000: used by **inbound agents** that connect over TCP to the controller (Module 12). Harmless to publish now.'],
    [11, 'A **named volume** mounted on `/var/jenkins_home`, the **JENKINS_HOME** directory: configuration, jobs, build history, plugins and encrypted secrets. Deleting the container does not delete this volume.'],
    [13, 'Declares the named volume. Docker creates it on the first `up`; its real name is `jenkins-lab_jenkins_home` (project folder + volume name).'],
  ] },
  { t: 'callout', kind: 'warning', title: 'Named volume, not a folder of your machine', text: 'The official image runs Jenkins as the user `jenkins` (uid **1000**). Mounting a folder of your machine (bind mount) often fails with `Permission denied` because that folder belongs to another uid. The image documentation recommends a **named volume**: treat JENKINS_HOME like a database.' },

  { t: 'h', id: 'l0-3', text: '0.3 Start Jenkins' },
  { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'docker compose up -d', out: '[+] up 3/3\n ✔ Network jenkins-lab_default     Created   0.0s\n ✔ Volume jenkins-lab_jenkins_home Created   0.0s\n ✔ Container jenkins               Started   0.2s', note: '`up` creates what is missing (network, volume, container) and starts it; `-d` (detached) gives you the prompt back. The first time, Docker first downloads the image (≈ 250 MB compressed). Older Compose versions print `[+] Running 3/3` instead of `[+] up 3/3`.' },
  { t: 'cmd', where: 'Your terminal', cmd: "docker compose ps --format 'table {{.Name}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}'", out: 'NAME      IMAGE                               STATUS          PORTS\njenkins   jenkins/jenkins:2.580.2-lts-jdk21   Up 33 seconds   0.0.0.0:8080->8080/tcp, 0.0.0.0:50000->50000/tcp', note: '**Up** means the container is running. A plain `docker compose ps` shows the same information with more columns.' },

  { t: 'h', id: 'l0-4', text: '0.4 Watch the startup and get the initial password' },
  { t: 'p', text: 'At the very first start, Jenkins creates an administrator account and prints a random password in its log. Follow the log until you see **Jenkins is fully up and running** (`Ctrl+C` stops following, not Jenkins):' },
  { t: 'cmd', where: 'Your terminal', cmd: 'docker compose logs -f jenkins', out: `jenkins  | 2026-11-17 09:47:52.517+0000 [id=47]\tINFO\tjenkins.install.SetupWizard#init:
jenkins  | [LF]>
jenkins  | [LF]> *************************************************************
jenkins  | [LF]> *************************************************************
jenkins  | [LF]> *************************************************************
jenkins  | [LF]>
jenkins  | [LF]> Jenkins initial setup is required. An admin user has been created and a password generated.
jenkins  | [LF]> Please use the following password to proceed to installation:
jenkins  | [LF]>
jenkins  | [LF]> 858c5f7b0369476184253f9bd2c7700a
jenkins  | [LF]>
jenkins  | [LF]> This may also be found at: /var/jenkins_home/secrets/initialAdminPassword
jenkins  | [LF]>
jenkins  | [LF]> *************************************************************
jenkins  | 2026-11-17 09:47:54.771+0000 [id=41]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Completed initialization
jenkins  | 2026-11-17 09:47:54.781+0000 [id=33]\tINFO\thudson.lifecycle.Lifecycle#onReady: Jenkins is fully up and running`, note: 'Excerpt. `[LF]>` marks the lines of one multi-line log message. **Your password is different**: it is generated for each new instance.' },
  { t: 'p', text: 'The same password is in a file of JENKINS_HOME. Reading it from the container is more reliable than scrolling the log:' },
  { t: 'cmd', where: 'Your terminal', cmd: 'docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword', out: '858c5f7b0369476184253f9bd2c7700a', note: '`exec` runs a command **inside** the running container. The file disappears once the setup wizard is completed.' },

  { t: 'h', id: 'l0-5', text: '0.5 Unlock Jenkins' },
  { t: 'p', text: 'Open **http://localhost:8080** in your browser.' },
  { t: 'shot', id: '01-unlock', titre: 'Unlock Jenkins', ce: 'The first page of the setup wizard. Jenkins refuses any configuration until you prove you have access to the server, by typing the password it wrote on its disk.', éléments: ['The file that contains the password (inside the container).', 'The field where you paste the password.', 'Continue validates the password.'], actions: ['Paste the password printed by `cat …/initialAdminPassword`.', 'Click **Continue**.'], résultat: 'The "Customize Jenkins" page opens.' },
  { t: 'callout', kind: 'why', title: 'Why this unlock step?', text: 'Between the first start and the end of the wizard, Jenkins is reachable on the network without a real account. The random password, readable only by someone who can access the server, prevents anyone else on the network from taking over a fresh instance.' },

  { t: 'h', id: 'l0-6', text: '0.6 Install the suggested plugins' },
  { t: 'shot', id: '02-customize', titre: 'Customize Jenkins', ce: 'Jenkins itself is small: almost every feature (Git, pipelines, credentials…) comes from plugins. The wizard proposes a curated set.', éléments: ['**Install suggested plugins**: the set chosen by the Jenkins community — the right choice for this course.', '**Select plugins to install**: pick the plugins one by one (for experienced admins).'], actions: ['Click **Install suggested plugins**.'], résultat: 'The installation starts and shows its progress.' },
  { t: 'shot', id: '03-installing', titre: 'Getting Started: plugin installation', ce: 'Each tile is a suggested plugin: green with a check mark when installed, with a spinning icon while it downloads. On the right, the log lists every plugin installed, including the dependencies marked `**`.', éléments: ['The suggested plugins and their status.', 'The installation log (`**` = dependency pulled automatically).'], actions: ['Wait: nothing to click. Allow one to a few minutes depending on your connection.'], résultat: 'When everything is installed, the "Create First Admin User" form appears. In this lab, 92 plugins were installed (suggested plugins + dependencies).' },
  { t: 'table', head: ['Suggested plugin', 'What it brings (used in module…)'], rows: [
    ['Pipeline', 'Pipelines as code: `Jenkinsfile`, stages, steps (Module 4)'],
    ['Pipeline Graph View', 'The graphical view of the stages of a pipeline (Lab 1.2)'],
    ['Git, GitHub Branch Source', 'Check out Git repositories, multibranch pipelines from GitHub (Module 5)'],
    ['Credentials Binding', 'Inject secrets into builds without writing them in the code (Modules 3 and 9)'],
    ['SSH Build Agents', 'Connect agents over SSH (Module 12)'],
    ['Matrix Authorization Strategy, LDAP', 'Fine-grained permissions, company directory (Modules 2 and 9)'],
    ['Folders', 'Organize jobs in folders with their own permissions'],
    ['Timestamper, Workspace Cleanup, Build Timeout', 'Timestamps in logs, clean workspaces, stop builds that hang'],
    ['Email Extension, Mailer', 'E-mail notifications'],
    ['Ant, Gradle', 'Build tools for Java projects'],
    ['OWASP Markup Formatter', 'Safe HTML in descriptions (protects against XSS)'],
    ['Pipeline: GitHub Groovy Libraries', 'Shared pipeline libraries loaded from GitHub'],
    ['Dark Theme', 'A dark UI theme'],
  ] },

  { t: 'h', id: 'l0-7', text: '0.7 Create the first administrator' },
  { t: 'shot', id: '04-admin', titre: 'Create First Admin User', ce: 'This account replaces the temporary "admin + initial password". It is the account you will use from now on.', éléments: ['Username: the login (here `admin`).', 'Password, typed twice.', 'Full name: shown in the UI and in the logs ("Started by user Lab Admin").', 'E-mail address (here `admin@example.com`, a reserved example domain).', '**Save and Continue** creates the account.'], actions: ['Fill in the five fields with **your own** values.', 'Click **Save and Continue**.'], résultat: 'The "Instance Configuration" page opens.' },
  { t: 'callout', kind: 'enterprise', title: 'In a company', text: 'Use a strong password stored in a password manager, and do not share this account: each person gets their own account (Module 2), ideally from the company directory (LDAP/SSO). "Skip and continue as admin" keeps the random initial password: avoid it.' },

  { t: 'h', id: 'l0-8', text: '0.8 Instance configuration' },
  { t: 'shot', id: '05-instance', titre: 'Instance Configuration', ce: 'The **Jenkins URL** is the address at which users and tools reach this Jenkins.', éléments: ['Jenkins URL: `http://localhost:8080/` for this lab.', '**Save and Finish** saves it.'], actions: ['Keep `http://localhost:8080/` (or the port you chose).', 'Click **Save and Finish**.'], résultat: 'The page "Jenkins is ready!" is displayed.' },
  { t: 'callout', kind: 'why', title: 'Why the URL matters', text: 'Jenkins writes this URL in the links it generates: e-mail notifications, build status sent to GitHub/GitLab, webhooks, agent connection commands. A wrong URL gives broken links. In production it is the public HTTPS name, e.g. `https://jenkins.example.com/`. You can change it later in **Manage Jenkins → System**.' },

  { t: 'h', id: 'l0-9', text: '0.9 Jenkins is ready: tour of the dashboard' },
  { t: 'shot', id: '06-ready', titre: 'Jenkins is ready!', ce: 'The setup wizard is complete.', éléments: ['Confirmation that the setup is complete.', '**Start using Jenkins** opens the dashboard.'], actions: ['Click **Start using Jenkins**.'], résultat: 'You are logged in and see the dashboard.' },
  { t: 'shot', id: '07-dashboard', titre: 'The dashboard (empty)', ce: 'The home page of Jenkins. It will list your jobs; for now it suggests creating one or setting up distributed builds.', éléments: ['**New Item**: create a job (Freestyle, Pipeline, Folder…).', '**Build Queue**: builds waiting for a free executor.', '**Build Executor Status** `0/2`: 0 executors busy out of 2 — the 2 executors of the built-in node (Module 1).', '**Manage Jenkins** (gear icon): administration. The red dot signals warnings to read.', '**Create a job**: same as New Item.', 'The exact version of Jenkins.'], actions: ['Hover over each element; do not change anything yet.'], résultat: 'You can locate New Item, the queue, the executors and Manage Jenkins.' },

  { t: 'h', id: 'l0-10', text: '0.10 Sanity check: a first job' },
  { t: 'p', text: 'A setup is only proven when a build runs. We create a minimal **Freestyle** job: it prints a few variables provided by Jenkins, the Java version, and writes a file in its workspace.' },
  { t: 'shot', id: '08-new-item', titre: 'New Item: choose the name and the type', ce: 'The page for creating a job (Jenkins says "item"). The type cannot be changed afterwards.', éléments: ['Item name: `hello-jenkins` (no spaces: the name becomes a folder and a URL).', '**Freestyle project**: a job configured with forms — selected here.', '**Pipeline**: a job described by code (Lab 1.2, Module 4).', '**Multibranch Pipeline**: one pipeline per Git branch (Module 5).', '**OK** creates the job and opens its configuration.'], actions: ['Type `hello-jenkins`.', 'Select **Freestyle project**.', 'Click **OK**.'], résultat: 'The configuration page of the job opens.' },
  { t: 'shot', id: '09-build-step', titre: 'Configure: an "Execute shell" build step', ce: 'The configuration page has one section per stage of a Freestyle job: General, Source Code Management, Triggers, Environment, Build Steps, Post-build Actions.', éléments: ['**Build Steps** in the section menu.', 'The command of the "Execute shell" step: the script below.', '**Add build step** adds another step.', '**Save** saves the job.'], actions: ['Scroll to **Build Steps**, click **Add build step → Execute shell**.', 'Paste the script below in **Command**.', 'Click **Save**.'], résultat: 'The page of the job `hello-jenkins` opens.' },
  { t: 'code', lang: 'bash', file: 'hello-jenkins → Configure → Build Steps → Execute shell → Command', code: SCRIPT_SHELL, lignes: [
    [1, 'A message: proves the step runs.'],
    [2, '`$JOB_NAME` and `$BUILD_NUMBER` are **environment variables provided by Jenkins** to every build.'],
    [3, '`$NODE_NAME`: the node (machine) that runs the build; `$WORKSPACE`: the folder where the build works.'],
    [4, 'The Java of the machine that runs the build (here the container). `java -version` writes to stderr: still shown in the log.'],
    [5, 'Writes the date (UTC) in `build-info.txt`, in the **workspace**.'],
    [6, 'Appends a line with the build number and the job name.'],
  ] },
  { t: 'shot', id: '10-job', titre: 'The job page after "Build Now"', ce: 'The page of the job. After clicking **Build Now**, build #1 appears in the history with a green check mark (success).', éléments: ['**Build Now** starts a build.', '**Configure** reopens the configuration.', '**Workspace** shows the files of the last build.', 'Build **#1**: click it to open the build.'], actions: ['Click **Build Now**, wait a few seconds, then click **#1**.'], résultat: 'Build #1 is green (SUCCESS).' },
  { t: 'shot', id: '11-console', titre: 'Console Output of build #1', ce: 'The full log of the build: it is the first place to look when something fails.', éléments: ['Who started the build (your full name).', 'The workspace on the node: `/var/jenkins_home/workspace/hello-jenkins`.', 'Each command, prefixed by `+` because Jenkins runs the script with `sh -xe` (`-x` prints, `-e` stops at the first error).', 'The result: **Finished: SUCCESS**.'], actions: ['Open **#1 → Console Output** and read it from top to bottom.'], résultat: 'You can explain every line (see the text version below).' },
  { t: 'cmd', where: 'hello-jenkins #1 → Console Output (real text)', cmd: '', out: `Started by user Lab Admin
Running as SYSTEM
Building in workspace /var/jenkins_home/workspace/hello-jenkins
[hello-jenkins] $ /bin/sh -xe /tmp/jenkins9533770793498756700.sh
+ echo Hello from Jenkins!
Hello from Jenkins!
+ echo Job: hello-jenkins - build #1
Job: hello-jenkins - build #1
+ echo Node: built-in - workspace: /var/jenkins_home/workspace/hello-jenkins
Node: built-in - workspace: /var/jenkins_home/workspace/hello-jenkins
+ java -version
openjdk version "21.0.13" 2026-10-20 LTS
OpenJDK Runtime Environment Temurin-21.0.13+9 (build 21.0.13+9-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.13+9 (build 21.0.13+9-LTS, mixed mode)
+ date -u +%Y-%m-%dT%H:%M:%SZ
+ echo Build 1 of hello-jenkins
Finished: SUCCESS`, note: '`Node: built-in`: the build ran on the **built-in node**, inside the controller. Fine for a lab; Module 1 explains why it is avoided in production.' },
  { t: 'shot', id: '12-workspace', titre: 'The workspace of the job', ce: 'The files left by the last build in its workspace.', éléments: ['`build-info.txt`, created by the script.'], actions: ['Open **Workspace** on the job page, then click the file.'], résultat: 'The file contains the date and "Build 1 of hello-jenkins".' },
  { t: 'cmd', where: 'Your terminal', cmd: 'docker compose exec jenkins cat /var/jenkins_home/workspace/hello-jenkins/build-info.txt', out: '2026-11-17T10:05:30Z\nBuild 1 of hello-jenkins', note: 'Same file, read from the container: the workspace is a real folder of JENKINS_HOME.' },

  { t: 'h', id: 'l0-11', text: '0.11 Day-2 operations: stop, start, back up, upgrade, reset' },
  { t: 'table', head: ['Goal', 'Command (in ~/jenkins-lab)', 'Data kept?'], rows: [
    ['Stop Jenkins', '`docker compose stop`', 'Yes'],
    ['Start it again', '`docker compose start`', 'Yes'],
    ['Restart', '`docker compose restart`', 'Yes'],
    ['Follow the log', '`docker compose logs -f jenkins`', '—'],
    ['Remove the container (and network)', '`docker compose down`', '**Yes**: the volume is kept'],
    ['Remove everything, including JENKINS_HOME', '`docker compose down -v`', '**No**: jobs, history, plugins, users are deleted'],
  ] },
  { t: 'cmd', where: 'Your terminal', cmd: 'docker compose stop\ndocker compose start', out: '[+] stop 1/1\n ✔ Container jenkins Stopped   0.3s\n[+] start 1/1\n ✔ Container jenkins Started   0.1s', note: 'After `start`, wait for "Jenkins is fully up and running" in the log, then log in again with your admin account.' },
  { t: 'p', text: '**Back up** JENKINS_HOME while Jenkins is stopped (a copy taken while builds run can be inconsistent). The command starts a throw-away container from the same image, mounts the volume and your current folder, and creates a compressed archive:' },
  { t: 'cmd', where: 'Your terminal (Linux/macOS)', cmd: 'docker compose stop\ndocker run --rm --user root -v jenkins-lab_jenkins_home:/var/jenkins_home -v "$PWD":/backup --entrypoint tar \\\n  jenkins/jenkins:2.580.2-lts-jdk21 czf /backup/jenkins_home-backup.tgz -C /var/jenkins_home .\ndocker compose start\nls -lh jenkins_home-backup.tgz', out: '-rw-r--r-- 1 root root 193M Nov 17 10:13 jenkins_home-backup.tgz', note: 'No output from `tar` means success; the archive belongs to root because the container ran as root (`sudo chown $USER jenkins_home-backup.tgz` if needed). 193 MB here, mostly plugins. Module 12 covers restore, incremental backups and what to exclude (workspaces, caches).' },
  { t: 'p', text: '**Upgrade** to a newer LTS: change the tag in `docker-compose.yml` (e.g. a future `2.580.3-lts-jdk21`), then:' },
  { t: 'cmd', where: 'Your terminal', cmd: 'docker compose pull\ndocker compose up -d', out: '', note: 'Back up first. Read the LTS upgrade guide of the target version on jenkins.io, then update the plugins in **Manage Jenkins → Plugins → Updates**.' },

  { t: 'h', id: 'l0-12', text: '0.12 Other ways to run Jenkins' },
  { t: 'table', head: ['Method', 'When to use it', 'In this course'], rows: [
    ['Docker / Docker Compose (this lab)', 'Labs, quick tests, containerized production', 'Lab 0, Modules 2 and 7'],
    ['Linux package (apt on Ubuntu/Debian, dnf on RHEL)', 'Classic production server managed with systemd', 'Module 2'],
    ['Virtual machine (Vagrant/VirtualBox, cloud VM)', 'Isolated, realistic server', 'Module 2'],
    ['WAR file: `java -jar jenkins.war`', 'Quick test with a local Java 21 or 25', 'Module 2'],
    ['Kubernetes (Helm chart)', 'Production on Kubernetes', 'Module 8'],
  ] },
  { t: 'callout', kind: 'info', title: 'Java versions', text: 'Recent Jenkins releases run on **Java 21 or Java 25** (Java 17 support ended with the 2.541.x LTS line). The `-jdk21` image already contains the right Java; on a native install you install it yourself (Module 2). Jenkins also warns, in Manage Jenkins, when the end of support of your Java version approaches.' },

  { t: 'h', id: 'l0-13', text: '0.13 Troubleshooting' },
  { t: 'errors', rows: [
    ['`Bind for 0.0.0.0:8080 failed: port is already allocated` (real message when port 8080 is taken)', 'Another program (or another Jenkins) already uses port 8080.', 'Stop that program, or publish another port: `"8081:8080"` in `ports:`, then `docker compose up -d` and use http://localhost:8081.'],
    ['http://localhost:8080 does not answer', 'The container is not running, or Jenkins is still starting.', '`docker compose ps` (must show **Up**), then `docker compose logs -f jenkins` until "Jenkins is fully up and running".'],
    ['The setup wizard cannot install plugins; the log shows `PKIX path building failed: … unable to find valid certification path` (real message, met while writing this lab behind a TLS-inspecting proxy)', 'A company proxy re-signs HTTPS traffic with its own certificate authority, which Java inside the container does not trust.', 'Ask for the proxy CA certificate, add it to a copy of the Java truststore (`keytool -importcert -keystore cacerts -file proxy-ca.crt -alias corp-proxy`), mount that file on `/opt/java/openjdk/lib/security/cacerts`, and set the proxy in **Manage Jenkins → Plugins → Advanced settings**. Never disable certificate checks.'],
    ['`Permission denied` on /var/jenkins_home', 'A folder of your machine is mounted (bind mount) and does not belong to uid 1000.', 'Use the named volume of the lab, or run `sudo chown -R 1000:1000 <folder>`.'],
    ['`cat: …/initialAdminPassword: No such file or directory`', 'The setup wizard is already completed: the file was removed.', 'Log in with the admin account you created. Lost it? For this lab, `docker compose down -v` then `up -d` restarts from zero; Module 2 shows how to recover an account without losing data.'],
    ['The container restarts in a loop, or the log shows `OutOfMemoryError`', 'Not enough memory given to Docker.', 'Give Docker at least 4 GB (Docker Desktop → Settings → Resources), then `docker compose up -d`.'],
    ['Apple Silicon (M1–M4) or ARM Linux', '—', 'Nothing to do: the official image is multi-architecture (amd64 and arm64).'],
  ] },

  { t: 'h', id: 'l0-14', text: '0.14 Validation checklist' },
  { t: 'checklist', id: 'lab0', items: [
    '`docker compose ps` shows the container **Up** with ports 8080 and 50000.',
    'http://localhost:8080 shows the login page or the dashboard.',
    'I know where the initial admin password comes from (log and file).',
    'The suggested plugins are installed.',
    'I log in with my own administrator account.',
    'Build #1 of `hello-jenkins` is **SUCCESS** and I can explain its console output.',
    'I can stop and start the lab, and I know that `down -v` deletes everything.',
  ] },
  { t: 'recap', items: [
    'Jenkins runs here from the **official image**, pinned to **2.580.2 LTS** with **Java 21**.',
    'All the state of Jenkins is in **JENKINS_HOME** (`/var/jenkins_home`), kept in the named volume `jenkins-lab_jenkins_home`.',
    'Port **8080** = web UI; port **50000** = inbound agents.',
    'The setup wizard: unlock → plugins → admin user → URL.',
    'A build runs **steps** in a **workspace** on a **node**; its **console output** tells you everything.',
  ] },
]

export default LAB0
