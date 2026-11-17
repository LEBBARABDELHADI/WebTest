var e=`# ~/jenkins-lab/docker-compose.yml — Module 2: the controller + one build agent
services:
  jenkins:
    image: jenkins/jenkins:2.580.2-lts-jdk21   # official image, pinned LTS release (reproducible lab)
    container_name: jenkins
    restart: unless-stopped
    ports:
      - "8080:8080"                           # web UI (and WebSocket agents) -> http://localhost:8080
      - "50000:50000"                         # inbound agents over TCP (not needed with WebSocket)
    volumes:
      - jenkins_home:/var/jenkins_home        # ALL Jenkins state lives here (jobs, plugins, secrets)

  agent-1:
    image: jenkins/inbound-agent:3395.v6e5377b_0fb_3c-5-jdk21   # official inbound agent, Java 21
    container_name: agent-1
    restart: unless-stopped
    environment:
      JENKINS_URL: http://jenkins:8080        # the controller, reached by its service name
      JENKINS_AGENT_NAME: agent-1             # must match the node name created in Jenkins
      JENKINS_SECRET: \${AGENT_1_SECRET}       # read from the .env file next to this one (never commit it)
      JENKINS_WEB_SOCKET: "true"              # connect over HTTP WebSocket: no extra port to open
      JENKINS_AGENT_WORKDIR: /home/jenkins/agent
    volumes:
      - agent1_work:/home/jenkins/agent       # workspaces survive a restart of the agent container
    depends_on:
      - jenkins

volumes:
  jenkins_home:
  agent1_work:
`,t=`  proxy:
    image: nginx:1.30.6                       # stable branch of nginx
    container_name: jenkins-proxy
    restart: unless-stopped
    ports:
      - "8443:443"                            # https://localhost:8443
    volumes:
      - ./nginx/jenkins.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - jenkins
`,n=`# ~/jenkins-lab/nginx/jenkins.conf — HTTPS reverse proxy in front of Jenkins
# (adapted from the official example on jenkins.io for a proxy running in its own container)
upstream jenkins {
  keepalive 32;                       # reuse connections to Jenkins
  server jenkins:8080;                # Compose service name + Jenkins port
}

map $http_upgrade $connection_upgrade {   # WebSocket agents need "Connection: upgrade"
  default upgrade;
  ''      '';
}

server {
  listen 443 ssl;
  http2 on;
  server_name localhost;

  ssl_certificate     /etc/nginx/certs/jenkins.crt;
  ssl_certificate_key /etc/nginx/certs/jenkins.key;
  ssl_protocols       TLSv1.2 TLSv1.3;

  ignore_invalid_headers off;         # let Jenkins headers through

  location / {
    proxy_pass         http://jenkins;   # no trailing slash!
    proxy_redirect     default;
    proxy_http_version 1.1;
    proxy_set_header   Connection        $connection_upgrade;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Host              $http_host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_max_temp_file_size 0;
    client_max_body_size       10m;
    client_body_buffer_size    128k;
    proxy_connect_timeout      90;
    proxy_send_timeout         90;
    proxy_read_timeout         90;
    proxy_request_buffering    off;      # required for HTTP CLI commands
  }
}
`,r=`# ~/jenkins-casc/Dockerfile — production-like controller image: pinned Jenkins + pinned plugins
FROM jenkins/jenkins:2.580.2-lts-jdk21

# No setup wizard: the whole configuration comes from casc.yaml
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
# Where the Configuration as Code plugin reads its YAML (mounted by docker-compose.yml)
ENV CASC_JENKINS_CONFIG=/var/jenkins_conf/casc.yaml

# Install the plugins listed in plugins.txt (and their dependencies) at build time
COPY --chown=jenkins:jenkins plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
`,i=`# ~/jenkins-casc/plugins.txt — the plugins of the controller, with pinned versions
configuration-as-code:2147.v8a_8d38668c72
matrix-auth:3.3
git:5.11.0
workflow-aggregator:608.v67378e9d3db_1
pipeline-graph-view:1053.v9df19e6ceed2
credentials-binding:728.v902a_273b_8947
timestamper:1.30
ws-cleanup:0.49
`,a=`# ~/jenkins-casc/casc.yaml — the configuration of the controller, as code (JCasC)
jenkins:
  systemMessage: "Production-like controller: configured as code. Manual changes are overwritten at the next reload."
  numExecutors: 0                      # never build on the controller
  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: "admin"
          name: "Lab Admin"
          password: "\${admin_password}"  # read from the Docker secret /run/secrets/admin_password
  authorizationStrategy:
    globalMatrix:
      entries:
        - user:
            name: "admin"
            permissions:
              - "Overall/Administer"
        - group:
            name: "authenticated"
            permissions:
              - "Overall/Read"
              - "View/Read"
  nodes:
    - permanent:
        name: "agent-1"
        labelString: "linux"
        remoteFS: "/home/jenkins/agent"
        numExecutors: 2
        launcher: "inbound"
        retentionStrategy: "always"
unclassified:
  location:
    url: "http://localhost:8081/"
    adminAddress: "Jenkins Lab <jenkins@example.com>"
security:
  contentSecurityPolicy:
    enforce: true                      # Content-Security-Policy header on every page
`,o=`# ~/jenkins-casc/docker-compose.yml — the production-like controller, on port 8081
services:
  jenkins:
    build: .                                  # image built from the Dockerfile next to this file
    image: lab/jenkins-casc:2.580.2           # name and tag of the built image
    container_name: jenkins-casc
    restart: unless-stopped
    ports:
      - "8081:8080"
    volumes:
      - casc_home:/var/jenkins_home
      - ./casc.yaml:/var/jenkins_conf/casc.yaml:ro
    secrets:
      - admin_password                        # mounted as /run/secrets/admin_password
    deploy:
      resources:
        limits:
          memory: 2g                          # hard memory limit for the container
    environment:
      JAVA_OPTS: >-
        -Djenkins.install.runSetupWizard=false
        -XX:MaxRAMPercentage=75.0
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/login"]
      interval: 30s
      timeout: 5s
      start_period: 90s
      retries: 3

secrets:
  admin_password:
    file: ./secrets/admin_password            # owner uid 1000, mode 400; never commit it

volumes:
  casc_home:
`,s=`# ~/jenkins-vm/Vagrantfile — an Ubuntu 24.04 VM with Jenkins LTS
Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-24.04"          # Ubuntu 24.04 LTS box (VirtualBox, VMware, Parallels, UTM)
  config.vm.hostname = "jenkins-vm"
  config.vm.network "forwarded_port", guest: 8080, host: 8180   # http://localhost:8180 on your computer
  config.vm.provider "virtualbox" do |vb|
    vb.memory = 4096                            # 4 GB: the recommended minimum for a small team
    vb.cpus = 2
  end
  config.vm.provision "shell", path: "install-jenkins.sh", privileged: false   # the script of section 2.3
end
`,c=`#!/usr/bin/env bash
# install-jenkins.sh — install Jenkins LTS on Ubuntu/Debian (the commands of section 2.3)
set -euo pipefail

sudo apt-get update
sudo apt-get install -y fontconfig openjdk-21-jre wget        # Java first, then Jenkins

sudo wget -q -O /etc/apt/keyrings/jenkins-keyring.asc \\
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key      # signing key of the LTS repository
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \\
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt-get update
sudo apt-get install -y jenkins                                 # installs, enables and starts the service
sudo systemctl enable --now jenkins                             # idempotent: safe to run again

echo "Jenkins $(curl -sI http://localhost:8080/login | grep -i '^x-jenkins:' | tr -d '\\r' | cut -d' ' -f2) is running"
echo "Initial admin password: $(sudo cat /var/lib/jenkins/secrets/initialAdminPassword)"
`,l=`[Service]
Environment="JENKINS_PORT=8081"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Xmx1g"
`,u=[{t:`objectives`,items:[`Check the **prerequisites** of a Jenkins controller: Java version, memory, disk, network ports.`,`Choose an **installation method** (Linux package, Docker, WAR, Kubernetes) and justify it.`,`Install Jenkins LTS on **Ubuntu/Debian** from the official apt repository and manage it with **systemd**.`,`Install Jenkins on a **virtual machine**, reproducibly, with Vagrant and a provisioning script.`,`Run Jenkins with **Docker Compose** in a production-like layout: build agent, pinned plugins, **Configuration as Code**, secrets.`,`Install, update, pin and remove **plugins** safely.`,`Create **users** and grant **rights** with matrix-based security, then check them as another user.`,`Apply the first **security measures**: HTTPS reverse proxy, no builds on the controller, Content Security Policy, no self sign-up.`]},{t:`p`,text:"Prerequisite: the Jenkins of **Lab 0** is running in `~/jenkins-lab` and you can log in as `admin`. This module changes it step by step; at the end, it has a build agent, two more users, a permission matrix and an optional HTTPS entrance. Two extra environments are used for comparison: an **Ubuntu 24.04 machine** (section 2.3) and a **configuration-as-code controller** on port 8081 (section 2.7)."},{t:`h`,id:`m2-1`,text:`2.1 Technical prerequisites`},{t:`p`,text:`Jenkins is a Java web application. Before installing it, check four things: the **Java** version, the **memory**, the **disk** and the **network ports**. The figures below come from the official installation guide ([jenkins.io/doc/book/installing](https://www.jenkins.io/doc/book/installing/)) and from the controller itself.`},{t:`table`,head:[`Resource`,`Minimum`,`Small team (recommended)`,`Why it matters`],rows:[[`Java`,`Java 21 or 25`,`Java 21 or 25 (LTS releases of Java)`,`Jenkins 2.580.2 refuses to start on Java 17 (real error in section 2.10). Java 21 support ends on or after 30 September 2027: plan Java 25.`],[`Memory (RAM)`,`256 MB`,`4 GB or more`,`The controller keeps the build queue, the UI and the plugins in memory; agents need their own memory for the builds.`],[`Disk`,`1 GB (10 GB with Docker)`,`50 GB or more`,"`JENKINS_HOME` grows with jobs, build logs and artifacts. Put it on a reliable, backed-up disk."],[`CPU`,`1 core`,`2–4 cores for the controller`,`With builds on agents, the controller mostly serves the UI and orchestrates.`]]},{t:`table`,head:[`Port`,`Protocol`,`Used by`,`Open it?`],rows:[[`8080`,`HTTP`,`Web UI, REST API, CLI, webhooks, **WebSocket agents**`,`In a lab, yes. In production, only to the reverse proxy.`],[`443`,`HTTPS`,`The reverse proxy (Nginx, Apache, a load balancer) in front of Jenkins`,`Yes, it is the only public entrance in production.`],[`50000`,`TCP`,`Inbound agents that connect over the **TCP** protocol`,`Only if you use TCP agents. WebSocket agents use 8080/443 instead.`],[`22`,`SSH`,`Outbound, from the controller to **SSH agents** (Module 12)`,`On the agents, not on the controller.`]]},{t:`callout`,kind:`enterprise`,text:"Size the controller for **orchestration**, not for builds: builds run on agents (section 2.6). A typical starting point is 2 vCPU, 4–8 GB RAM and a 50–100 GB data disk for `JENKINS_HOME`, monitored and backed up daily."},{t:`h`,id:`m2-2`,text:`2.2 Choosing an installation method`},{t:`table`,head:[`Method`,`Typical use`,`Strengths`,`Watch out`],rows:[[`**Linux package** (apt, dnf)`,`A VM or a physical server managed by an operations team`,`systemd service, logs in journald, upgrades with apt`,`You manage Java, the OS and the backups; one controller per machine`],["**Docker image** (`jenkins/jenkins`)",`Labs, container platforms, most new installations`,`Pinned version, plugins baked into a custom image, rebuilt in minutes`,`Volumes and permissions (uid 1000), Docker skills needed`],["**WAR file** (`java -jar jenkins.war`)",`Quick tests, unusual platforms`,`Nothing to install except Java`,`No service management: you write it yourself`],[`**Kubernetes** (Helm chart, operator)`,`Teams already running Kubernetes`,`Agents created on demand as pods (Module 8)`,`Most complex option: storage, ingress, upgrades`],[`Windows (MSI), macOS (Homebrew)`,`Windows-only shops, a developer laptop`,`Native installers`,`Less common for servers; same Jenkins inside`]]},{t:`p`,text:`This course uses **Docker** for its main lab (Lab 0) because it gives everybody the same environment in minutes. Section 2.3 also installs the **Linux package**, because many companies run Jenkins on VMs managed with systemd — you will meet both.`},{t:`h`,id:`m2-3`,text:`2.3 Install on Ubuntu/Debian with apt and systemd`},{t:`p`,text:"The official procedure ([jenkins.io/doc/book/installing/linux](https://www.jenkins.io/doc/book/installing/linux/)) has three steps: install Java, add the Jenkins apt repository with its signing key, install the `jenkins` package. We executed every command below on an **Ubuntu 24.04.5 LTS** machine, logged in as the sudo user `ubuntu`."},{t:`callout`,kind:`info`,title:`How we recorded these outputs`,text:"Our recording machine is an Ubuntu 24.04.5 system running **systemd inside a container** (we have no hypervisor in the recording environment). The commands and their results are the ones you get on a VM; only the `CGroup:` line of `systemctl status` differs (`/docker/…/system.slice/…` instead of `/system.slice/…`). Long outputs are abridged with `…`."},{t:`h3`,text:`Step 1 — Install Java 21 first`},{t:`cmd`,where:`Ubuntu 24.04 machine, user ubuntu`,cmd:`sudo apt update
sudo apt install -y fontconfig openjdk-21-jre
java -version`,out:`…
0 upgraded, 145 newly installed, 0 to remove and 3 not upgraded.
Need to get 143 MB of archives.
After this operation, 650 MB of additional disk space will be used.
…
Setting up openjdk-21-jre:amd64 (21.0.13.0.3+1-1~24.04.1) ...
openjdk version "21.0.13.0.3" 2026-10-24
OpenJDK Runtime Environment (build 21.0.13.0.3+1-1-24.04.1-Ubuntu)
OpenJDK 64-Bit Server VM (build 21.0.13.0.3+1-1-24.04.1-Ubuntu, mixed mode, sharing)`,note:"The official guide insists: **Java before Jenkins**. If Jenkins is installed first, its service can fail with `jenkins: failed to find a valid Java installation`. `fontconfig` provides the fonts Jenkins uses to draw graphs."},{t:`h3`,text:`Step 2 — Add the Jenkins LTS repository`},{t:`cmd`,where:`Ubuntu 24.04 machine, user ubuntu`,cmd:`sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \\
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \\
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update`,out:`HTTP request sent, awaiting response... 200 OK
Length: 1680 (1.6K) [application/octet-stream]
Saving to: ‘/etc/apt/keyrings/jenkins-keyring.asc’
…
Ign:3 https://pkg.jenkins.io/debian-stable binary/ InRelease
Get:4 https://pkg.jenkins.io/debian-stable binary/ Release [2044 B]
Get:6 https://pkg.jenkins.io/debian-stable binary/ Release.gpg [833 B]
Get:7 https://pkg.jenkins.io/debian-stable binary/ Packages [36.7 kB]
…
Reading package lists...`,note:"`debian-stable` = the **LTS** line (`debian` without `-stable` = weekly releases). The key file name carries a year (`jenkins.io-2026.key`): the project rotates its signing key, so always copy the current command from the official page. `Ign: … InRelease` is normal: this repository publishes `Release` + `Release.gpg`."},{t:`h3`,text:`Step 3 — Install Jenkins and check the service`},{t:`cmd`,where:`Ubuntu 24.04 machine, user ubuntu`,cmd:`sudo apt install -y jenkins`,out:`The following NEW packages will be installed:
  jenkins
0 upgraded, 1 newly installed, 0 to remove and 3 not upgraded.
Need to get 53.8 MB of archives.
Get:1 https://pkg.jenkins.io/debian-stable binary/ jenkins 2.580.2 [53.8 MB]
…
Unpacking jenkins (2.580.2) ...
Setting up jenkins (2.580.2) ...
Created symlink /etc/systemd/system/multi-user.target.wants/jenkins.service → /usr/lib/systemd/system/jenkins.service.`},{t:`cmd`,where:`Ubuntu 24.04 machine, user ubuntu`,cmd:`curl -sI http://localhost:8080/login | grep -i x-jenkins
sudo ss -ltnp | grep 8080
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
sudo journalctl -u jenkins --no-pager | grep -A5 "Please use the following password"`,out:`X-Jenkins: 2.580.2
X-Jenkins-Session: 776afb3a
LISTEN 0      50           0.0.0.0:8080      0.0.0.0:*    users:(("java",pid=3014,fd=9))
6d915db58a104fc0b25bcc138f82c58c
Nov 17 12:24:07 jenkins-vm jenkins[3014]: [LF]> Please use the following password to proceed to installation:
Nov 17 12:24:07 jenkins-vm jenkins[3014]: [LF]>
Nov 17 12:24:07 jenkins-vm jenkins[3014]: [LF]> 6d915db58a104fc0b25bcc138f82c58c
Nov 17 12:24:07 jenkins-vm jenkins[3014]: [LF]>
Nov 17 12:24:07 jenkins-vm jenkins[3014]: [LF]> This may also be found at: /var/lib/jenkins/secrets/initialAdminPassword`,note:"The package **installs, enables and starts** the service. The unlock procedure in the browser (`http://<vm-address>:8080`) is then exactly the one of Lab 0. With the package, `JENKINS_HOME` is `/var/lib/jenkins` — not `/var/jenkins_home` as in Docker."},{t:`table`,head:[`Path`,`Content`],rows:[["`/var/lib/jenkins`","`JENKINS_HOME`: configuration, jobs, builds, plugins, secrets — **back it up**."],["`/usr/share/java/jenkins.war`","The application; replaced by `apt upgrade`."],["`/usr/lib/systemd/system/jenkins.service`",`The unit file provided by the package — **do not edit it**.`],["`/etc/systemd/system/jenkins.service.d/override.conf`",`Your changes (port, Java options), kept across upgrades.`],["`journalctl -u jenkins`","The logs of the service (there is no `jenkins.log` file anymore)."],["`/var/cache/jenkins/war`",`The unpacked web application (cache, rebuilt at start).`]]},{t:`h3`,text:`Step 4 — Change the port and the memory with a systemd override`},{t:`p`,text:"The unit file defines its settings as environment variables. Never edit it: create an **override** (drop-in) that systemd merges on top of it. `sudo systemctl edit jenkins` opens an editor for this file; below we write the same file with `tee` so that the command can be copied."},{t:`cmd`,where:`Ubuntu 24.04 machine, user ubuntu`,cmd:`grep -E "^(User|Group|Environment|ExecStart|Type)" /usr/lib/systemd/system/jenkins.service`,out:`Type=notify
ExecStart=/usr/bin/jenkins
User=jenkins
Group=jenkins
Environment="JENKINS_HOME=/var/lib/jenkins"
Environment="JENKINS_WEBROOT=%C/jenkins/war"
Environment="JAVA_OPTS=-Djava.awt.headless=true"
Environment="JENKINS_PORT=8080"`},{t:`code`,lang:`ini`,file:`/etc/systemd/system/jenkins.service.d/override.conf`,code:l,lignes:[[1,"`[Service]`: the section of the unit we override."],[2,`Listen on **8081** instead of 8080.`],[3,"Java options: keep `-Djava.awt.headless=true` (no display on a server) and cap the heap at **1 GB** with `-Xmx1g`. An `Environment=` line replaces the variable of the same name."]]},{t:`cmd`,where:`Ubuntu 24.04 machine, user ubuntu`,cmd:`sudo mkdir -p /etc/systemd/system/jenkins.service.d
printf "[Service]\\nEnvironment=\\"JENKINS_PORT=8081\\"\\nEnvironment=\\"JAVA_OPTS=-Djava.awt.headless=true -Xmx1g\\"\\n" | sudo tee /etc/systemd/system/jenkins.service.d/override.conf
sudo systemctl daemon-reload && sudo systemctl restart jenkins
sudo ss -ltnp | grep java
systemctl status jenkins --no-pager`,out:`[Service]
Environment="JENKINS_PORT=8081"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Xmx1g"
LISTEN 0      50           0.0.0.0:8081      0.0.0.0:*    users:(("java",pid=4008,fd=9))
● jenkins.service - Jenkins Continuous Integration Server
     Loaded: loaded (/usr/lib/systemd/system/jenkins.service; enabled; preset: enabled)
    Drop-In: /etc/systemd/system/jenkins.service.d
             └─override.conf
     Active: active (running) since Tue 2026-11-17 12:24:51 UTC; 3s ago
   Main PID: 5819 (java)
      Tasks: 48 (limit: 19281)
     Memory: 555.3M ()
     CGroup: /docker/4c242e0863b0…/system.slice/jenkins.service
             └─5819 /usr/bin/java -Djava.awt.headless=true -Xmx1g -jar /usr/share/java/jenkins.war --webroot=/var/cache/jenkins/war --httpPort=8081
…
Nov 17 12:24:51 jenkins-vm jenkins[5819]: … INFO        hudson.lifecycle.Lifecycle#onReady: Jenkins is fully up and running
Nov 17 12:24:51 jenkins-vm systemd[1]: Started jenkins.service - Jenkins Continuous Integration Server.`,note:"`Drop-In: … override.conf` proves systemd took your file into account; the Java command line now shows `-Xmx1g` and `--httpPort=8081`. `daemon-reload` is mandatory after any change to unit files."},{t:`callout`,kind:`warning`,title:`Firewall`,text:"On a real VM with a firewall, open only what is needed, for example `sudo ufw allow 8080/tcp` in a lab, or only 443 when a reverse proxy is in front. (Our recording machine has no firewall, so this command is not shown with an output.)"},{t:`h`,id:`m2-4`,text:`2.4 Install on a virtual machine (Vagrant)`},{t:`p`,text:"A VM installation must be **reproducible**: if the VM is lost, a script rebuilds it identically. Vagrant describes the VM in a `Vagrantfile`; a provisioning script installs Jenkins with the commands of section 2.3. The same script works as *user data* (cloud-init) on a cloud VM (AWS, Azure, GCP, Proxmox…)."},{t:`code`,lang:`bash`,file:`~/jenkins-vm/install-jenkins.sh`,code:c,lignes:[[3,"`set -euo pipefail`: stop at the first error, on an undefined variable or a failing pipe — essential in an unattended script."],[6,"Java first (section 2.3, step 1). `apt-get` is the scripting-friendly version of `apt`."],[8,"Signing key of the LTS repository (`-q`: quiet)."],[10,`The repository, signed by that key.`],[14,`Install, enable and start the service.`],[15,"`enable --now` is idempotent: running the script twice is harmless."],[17,"Prints the running version, read from the `X-Jenkins` header."],[18,`Prints the initial admin password, needed to unlock Jenkins.`]]},{t:`cmd`,where:`Fresh Ubuntu 24.04 machine, user ubuntu (our test run of the script)`,cmd:`./install-jenkins.sh`,out:`…
Created symlink /etc/systemd/system/multi-user.target.wants/jenkins.service → /usr/lib/systemd/system/jenkins.service.
Synchronizing state of jenkins.service with SysV service script with /usr/lib/systemd/systemd-sysv-install.
Executing: /usr/lib/systemd/systemd-sysv-install enable jenkins
Jenkins 2.580.2 is running
Initial admin password: dff1e3e4cb2f46acaec2fc16846cc00a`,note:`We ran the script, unchanged, on a fresh Ubuntu 24.04 machine before publishing it: it ends with exit code 0.`},{t:`code`,lang:`ruby`,file:`~/jenkins-vm/Vagrantfile`,code:s,lignes:[[3,"`bento/ubuntu-24.04`: a widely used Ubuntu 24.04 LTS box, published for VirtualBox, VMware, Parallels and UTM."],[5,`Port forwarding: Jenkins (8080 in the VM) answers on **http://localhost:8180** on your computer — 8080 stays free for the Docker lab.`],[7,`4 GB of RAM: the recommendation for a small team.`],[10,"Provisioning: runs `install-jenkins.sh` as the `vagrant` user, which has passwordless `sudo`."]]},{t:`cmd`,where:`Your computer, in ~/jenkins-vm (requires Vagrant and VirtualBox)`,cmd:`vagrant up
vagrant ssh -c "systemctl is-active jenkins"`,note:"Expected: the provisioning prints the same two last lines as above, then `active`. Open http://localhost:8180 and unlock Jenkins with the printed password. **No screenshot here:** booting a VM needs hardware virtualization, which our recording environment does not provide — the provisioning script itself was tested above. Destroy the VM with `vagrant destroy -f`."},{t:`h`,id:`m2-5`,text:`2.5 Installing and managing plugins`},{t:`p`,text:"Almost every feature of Jenkins comes from a **plugin**: Git, Pipeline, credentials, Docker, Kubernetes… Plugins come from the **update center** (`updates.jenkins.io`), which knows their versions, their **dependencies** and their **security warnings**. Each plugin is a `.jpi` file in `$JENKINS_HOME/plugins`."},{t:`shot`,id:`m2-01-plugins-available`,titre:`Manage Jenkins → Plugins → Available plugins`,ce:`Search the update center and tick the plugins to install.`,éléments:[`Search box: type part of the name.`,`The checkbox of **Configuration as Code** (version 2147.v8a_8d38668c72).`,`**Health score** (100): computed by the Jenkins project from maintenance, security and adoption — prefer plugins in the green.`,`**Install**.`],actions:[`Search *Configuration as Code*, tick it, click **Install**.`],résultat:`The download progress page opens.`},{t:`shot`,id:`m2-02-plugins-progress`,titre:`Download progress`,ce:`Jenkins checks the network, downloads the plugin and its dependencies, then loads them.`,éléments:[`The plugin being installed.`,`**Success**: downloaded and loaded.`,`**Go back to the top page**: most plugins work immediately (*"you can start using the installed plugins right away"*).`,`**Restart Jenkins when installation is complete and no jobs are running**: needed for some plugins or for updates.`],actions:[`Wait for **Success** on every line.`],résultat:`The plugin is active without a restart.`},{t:`shot`,id:`m2-03-plugins-installed`,titre:`Installed plugins`,ce:`Everything installed, with versions — and the switches to disable or remove a plugin.`,éléments:[`Name and **version** — the first thing to give when you report a problem.`,`Health score.`,`**Enabled** switch: disable a plugin without removing it (takes effect after a restart).`,`**Uninstall**: removes it (after a restart). Impossible while other plugins depend on it.`],actions:[`Filter on *Configuration as Code* and check the version.`],résultat:`You know exactly what runs in your controller.`},{t:`shot`,id:`m2-04-plugins-advanced`,titre:`Plugins → Advanced settings`,ce:`For controllers without direct internet access.`,éléments:["**Deploy Plugin**: upload a `.hpi`/`.jpi` file…",`…or give its URL.`,`**Deploy**.`,`**Update Site**: the URL of the update center — replace it with an internal mirror if your company has one.`],actions:[`Just look: nothing to change in the lab.`],résultat:`You know the offline options. (The HTTP proxy settings are in **Manage Jenkins → System → HTTP Proxy Configuration**.)`},{t:`table`,head:[`Good practice`,`Why`],rows:[[`Install **few** plugins, each with a clear purpose`,`Every plugin adds code that runs with full rights in the controller, and must be updated.`],[`Check the **health score** and the last release date`,`An abandoned plugin will not get security fixes.`],["**Pin** versions in `plugins.txt` and update them on purpose",`Reproducible controllers; updates tested before production.`],[`Update on a **test controller** first, after a backup`,`A plugin update can change behavior or break a pipeline.`],[`Read the **security warnings** shown in Manage Jenkins`,`Jenkins lists the installed plugins with known vulnerabilities.`]]},{t:`h`,id:`m2-6`,text:`2.6 Docker Compose: add a build agent`},{t:`p`,text:"Lab 0 runs every build **on the controller** (the built-in node) — Jenkins itself warns that it is a security issue (Module 1, section 1.11). The first production habit is to give builds to an **agent**. The simplest agent for a Docker lab is the official `jenkins/inbound-agent` image: it starts, opens a **WebSocket** connection to the controller and waits for work. No SSH, no extra port."},{t:`diagram`,id:`m2-lab`,caption:`The lab at the end of this module: Nginx (optional, section 2.9) in front of the controller, the controller with 0 executors, and agent-1 running the builds.`},{t:`h3`,text:`Step 1 — Declare the node in Jenkins`},{t:`shot`,id:`m2-05-node-new`,titre:`Manage Jenkins → Nodes → New Node`,ce:`A node is declared in Jenkins **before** the agent process connects to it.`,éléments:["**Node name**: `agent-1` — the agent will introduce itself with this exact name.",`**Permanent Agent**: a node that exists until you delete it (clouds create temporary ones, Module 8).`,`**Create**.`],actions:["Type `agent-1`, select **Permanent Agent**, click **Create**."],résultat:`The configuration form of the new node opens.`},{t:`shot`,id:`m2-06-node-config`,titre:`New node: description, executors, directory, labels`,ce:`The first half of the node form.`,éléments:[`**Description**: free text, shown on the node page.`,"**Number of executors**: `2` builds at the same time on this agent.","**Remote root directory**: `/home/jenkins/agent`, where the agent keeps its workspaces — it must match `JENKINS_AGENT_WORKDIR` in Compose.","**Labels**: `linux`. Pipelines select agents by label (`agent { label 'linux' }`).",`**Usage**: *Use this node as much as possible*.`],actions:[`Fill the fields exactly as shown.`],résultat:`The node is described; the launch method is next.`},{t:`shot`,id:`m2-07-node-launch`,titre:`New node: launch method and availability`,ce:`How the agent process reaches the controller, and when the node is used.`,éléments:[`**Launch method**: *Launch agent by connecting it to the controller* — an **inbound** agent: the agent opens the connection, so the controller does not need to reach it.`,`**Availability**: *Keep this agent online as much as possible*.`,`**Node Properties**: environment variables, tool locations, disk thresholds — optional.`,`**Save**.`],actions:[`Keep the defaults and click **Save**.`],résultat:`The node exists but is **offline**: no agent process has connected yet.`},{t:`shot`,id:`m2-08-node-connect`,titre:`The node page: how to connect the agent`,ce:"Jenkins shows the commands to start the agent, including its **secret**. In Jenkins 2.580.2, WebSocket is the default (`-webSocket`).",éléments:[`Commands for Unix (and below, for Windows).`,`The **secret** of this node (hidden by the course): a 64-character key that proves the agent is allowed to take this node. Treat it as a password.`,"`-webSocket`: connect through the HTTP port (8080/443). Remove it to use the TCP port 50000 instead.",`**Mark this node temporarily offline**: stop sending builds to it.`],actions:[`Copy the secret (from your own page, not from this screenshot).`],résultat:`You have the node name, the URL and the secret: everything the agent container needs.`},{t:`h3`,text:`Step 2 — Start the agent container`},{t:`p`,text:"Put the secret in a file named `.env` **next to** `docker-compose.yml`. Docker Compose reads it automatically and replaces `${AGENT_1_SECRET}`. Never commit `.env` (add it to `.gitignore`)."},{t:`code`,lang:`bash`,file:`~/jenkins-lab/.env`,code:`AGENT_1_SECRET=<the 64-character secret shown on the page of agent-1>
`,lignes:[[1,"One `NAME=value` per line, no quotes, no spaces around `=`."]]},{t:`code`,lang:`yaml`,file:`~/jenkins-lab/docker-compose.yml`,code:e,lignes:[[4,`The controller is unchanged since Lab 0.`],[9,`Port 50000 is only for TCP agents; our agent uses WebSocket through 8080. You may remove this line.`],[13,"New service `agent-1`."],[14,`Official inbound agent image, **pinned** like the controller: Java 21, Debian 13, git included.`],[16,`Restarted with Docker, like the controller.`],[18,"`http://jenkins:8080`: inside the Compose network, the controller is reachable by its **service name**."],[19,`Must be the node name created in step 1.`],[20,"The secret, read from `.env` — it never appears in the file you commit."],[21,`WebSocket: the agent tunnels its connection through the HTTP port.`],[22,`Working directory = the *Remote root directory* of the node.`],[24,`Workspaces in a named volume: a restarted agent keeps its caches and checkouts.`],[25,"`depends_on`: Compose starts the controller first (it does not wait until it is ready; the agent simply retries)."],[30,`Declare the new volume.`]]},{t:`cmd`,where:`Your terminal, in ~/jenkins-lab`,cmd:`docker compose up -d agent-1
docker compose logs agent-1`,out:` Container agent-1 Created
 Container agent-1 Starting
 Container agent-1 Started
…
INFO: Setting up agent: agent-1
INFO: Using Remoting version: 3395.v6e5377b_0fb_3c
INFO: Using /home/jenkins/agent/remoting as a remoting work directory
INFO: WebSocket connection open
INFO: Connected`,note:`**Connected** is the line to look for. *Remoting* is the library that carries the commands between the controller and its agents.`},{t:`shot`,id:`m2-09-nodes`,titre:`Manage Jenkins → Nodes: agent-1 is online`,ce:`Both nodes are online and monitored: architecture, clock, disk, swap, temporary space, response time.`,éléments:[`**agent-1**: Linux (amd64), in sync, 79 ms response time.`,`**Built-In Node**: the controller itself.`,`**New Node**: add more agents the same way.`],actions:[`Check that agent-1 has no red cross.`],résultat:`agent-1 is online.`},{t:`h3`,text:`Step 3 — Stop building on the controller`},{t:`shot`,id:`m2-10-builtin-zero`,titre:`Built-In Node → Configure: 0 executors`,ce:`With **0 executors**, the controller can no longer run builds: every job goes to an agent.`,éléments:["**Number of executors**: `0`.",`**Usage**: irrelevant with 0 executors.`,`**Save**.`],actions:[`Open **Manage Jenkins → Nodes → Built-In Node → Configure**, set 0, **Save**.`],résultat:`The built-in node disappears from the *Build Executor Status* panel of the dashboard.`},{t:`cmd`,where:`hello-jenkins → Build Now → #2 → Console Output (real text)`,cmd:``,out:`Started by user Lab Admin
Running as SYSTEM
Building remotely on agent-1 (linux) in workspace /home/jenkins/agent/workspace/hello-jenkins
[hello-jenkins] $ /bin/sh -xe /tmp/jenkins3329179554739777831.sh
+ echo Hello from Jenkins!
Hello from Jenkins!
+ echo Job: hello-jenkins - build #2
Job: hello-jenkins - build #2
+ echo Node: agent-1 - workspace: /home/jenkins/agent/workspace/hello-jenkins
Node: agent-1 - workspace: /home/jenkins/agent/workspace/hello-jenkins
+ java -version
openjdk version "21.0.13" 2026-10-20 LTS
…
Finished: SUCCESS`,note:`Same job as in Lab 0, unchanged: it now runs **remotely on agent-1** and its workspace lives in the agent container. Compare with build #1 ("Building in workspace /var/jenkins_home/workspace/…", on the controller).`},{t:`shot`,id:`m2-11-manage-after`,titre:`Manage Jenkins: the built-in node warning is gone`,ce:`Compare with the screenshot of Module 1 (section 1.11): the warning *"Building on the built-in node can be a security issue"* has disappeared. Two notices remain.`,éléments:[`**Content Security Policy** is not enforced yet — section 2.9.`,`**Java 21** support ends on or after 30 September 2027 — plan Java 25.`,`**Configuration as Code**: new entry, from the plugin installed in section 2.5.`],actions:[`Read the remaining notices; we handle CSP in section 2.9.`],résultat:`The controller only orchestrates; agents do the work.`},{t:`h`,id:`m2-7`,text:`2.7 A production-like controller: plugins.txt and Configuration as Code`},{t:`p`,text:`Clicking through the setup wizard and the forms is fine to learn, but it does not scale: nobody can review it, repeat it or roll it back. In production, the controller is described **as code**: a **Dockerfile** pins Jenkins, a **plugins.txt** pins the plugins, and the **Configuration as Code** plugin (JCasC) applies a **YAML** file at every start. To rebuild the controller, you rebuild the image and restart it.`},{t:`diagram`,id:`m2-casc`,caption:`From versioned files to a configured controller. Only the secrets stay out of Git.`},{t:`p`,text:"This section builds a **second, separate** controller in `~/jenkins-casc`, on port **8081**, so that your Lab 0 Jenkins is not affected."},{t:`code`,lang:`text`,file:`~/jenkins-casc/plugins.txt`,code:i,lignes:[[2,"`id:version`. The id is the short name shown on plugins.jenkins.io and in **Installed plugins**."],[3,`Matrix authorization (section 2.8).`],[5,'`workflow-aggregator` = the "Pipeline" plugin suite.'],[9,"Dependencies are **not** listed: `jenkins-plugin-cli` resolves them."]]},{t:`code`,lang:`dockerfile`,file:`~/jenkins-casc/Dockerfile`,code:r,lignes:[[2,`Same pinned LTS image as the lab.`],[5,"`runSetupWizard=false`: no unlock screen, no wizard — the YAML configures everything."],[7,"`CASC_JENKINS_CONFIG`: path of the YAML file (or folder) read by JCasC."],[10,`Copy the plugin list into the image.`],[11,"`jenkins-plugin-cli` (shipped in the image) downloads the plugins **and their dependencies** at build time: the image is complete and works offline."]]},{t:`code`,lang:`yaml`,file:`~/jenkins-casc/casc.yaml`,code:a,lignes:[[3,`A message shown at the top of the dashboard.`],[4,`0 executors on the built-in node, from the first start.`],[6,"`local`: Jenkins' own user database."],[7,`Nobody can create an account by themselves.`],[11,"`${admin_password}`: JCasC replaces it with the content of the Docker secret file `/run/secrets/admin_password`. The password is never written in the YAML."],[13,"`globalMatrix`: matrix-based security (section 2.8). Exactly the syntax that **Export configuration** produces."],[24,"Nodes as code: `agent-1` exists at start, waiting for its agent."],[30,'`launcher: "inbound"`: the agent connects to the controller.'],[34,`The Jenkins URL (section 2.9).`],[38,`Turn on the Content-Security-Policy header (section 2.9).`]]},{t:`code`,lang:`yaml`,file:`~/jenkins-casc/docker-compose.yml`,code:o,lignes:[[4,"`build: .`: Compose builds the image from the Dockerfile…"],[5,"…and tags it `lab/jenkins-casc:2.580.2`."],[9,`Port 8081 on your computer: the Lab 0 controller keeps 8080.`],[12,`The YAML is mounted **read-only**: edit it on the host, then apply it again.`],[14,"The secret is mounted as the file `/run/secrets/admin_password`."],[18,`A hard memory limit for the container…`],[22,`…and a JVM heap sized relative to it (75 % of the limit).`],[24,"Health check: the container is *healthy* when `/login` answers."],[32,`The secret file lives next to the Compose file, **outside Git**, readable by uid 1000.`]]},{t:`cmd`,where:`Your terminal, in ~/jenkins-casc`,cmd:`mkdir -p secrets
printf '%s' 'Choose-A-Strong-Password' > secrets/admin_password
sudo chown 1000:1000 secrets/admin_password && sudo chmod 400 secrets/admin_password
docker compose build
docker run --rm --entrypoint sh lab/jenkins-casc:2.580.2 -c "ls /usr/share/jenkins/ref/plugins | wc -l"
docker compose up -d
docker compose ps`,out:`…
#9 [4/4] RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
#9 6.027 Done
…
 Image lab/jenkins-casc:2.580.2 Built
74
…
NAME           IMAGE                      COMMAND                  SERVICE   CREATED         STATUS                            PORTS
jenkins-casc   lab/jenkins-casc:2.580.2   "/usr/bin/tini -- /u…"   jenkins   9 seconds ago   Up 9 seconds (health: starting)   50000/tcp, 0.0.0.0:8081->8080/tcp`,note:"8 plugins listed, **74** installed: the 66 others are dependencies. After about a minute, `docker compose ps` shows **(healthy)**. Why `chown 1000`? See the first error of section 2.10 — we hit it."},{t:`shot`,id:`m2-22-casc-dashboard`,titre:`The configuration-as-code controller (port 8081)`,ce:"No unlock screen, no wizard: you log in directly as `admin` with the password of the secret file, and everything in `casc.yaml` is already there.",éléments:["The **system message** from `casc.yaml`.",`**agent-1**, declared as code — offline because no agent container runs in this demo.`,"The `admin` user (*Lab Admin*), created by JCasC."],actions:["Log in at http://localhost:8081 as `admin`."],résultat:`A complete controller, rebuilt from three files and a secret.`},{t:`shot`,id:`m2-23-casc-loaded`,titre:`Manage Jenkins → Configuration as Code`,ce:`The plugin shows which file it applied and when.`,éléments:["The YAML in use: `/var/jenkins_conf/casc.yaml`.",`**Last time applied**: at start.`,`**Apply configuration**: applies the file again after you edit it — no restart needed.`,`**Export configuration**: the current configuration as YAML.`],actions:["Change the system message in `casc.yaml`, click **Apply configuration**, reload the dashboard."],résultat:`The new message appears.`},{t:`shot`,id:`m2-24-casc-manage`,titre:`Manage Jenkins on the configuration-as-code controller`,ce:"Compare with the Lab 0 controller: the CSP notice and the built-in node warning are absent, because `casc.yaml` handled them from the first start.",éléments:[`Only the Java 21 notice remains.`,`**Configuration as Code**.`],actions:[`Compare with the screenshot of section 2.6.`],résultat:`Secure defaults from the start, without a single click.`},{t:`cmd`,where:`Your terminal`,cmd:`curl -sI http://localhost:8081/login | grep -iE "^HTTP|^X-Jenkins:|^Content-Security-Policy"`,out:`HTTP/1.1 200 OK
Content-Security-Policy: base-uri 'none'; default-src 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; script-src 'report-sample' 'self' usage.jenkins.io; style-src 'report-sample' 'self' 'unsafe-inline'; report-to content-security-policy; report-uri http://localhost:8081/content-security-policy-reporting-endpoint/…
X-Jenkins: 2.580.2`,note:`The **Content-Security-Policy** header tells the browser to run only scripts served by Jenkins itself: an injected script (XSS) is blocked.`},{t:`callout`,kind:`tip`,title:`Do not write the YAML from scratch`,text:`Configure a test controller with the UI, then use **Manage Jenkins → Configuration as Code → Export configuration** and keep only the sections you need. The export is long (270 lines on our lab controller) and not directly reusable as a whole — the plugin itself says so.`},{t:`shot`,id:`m2-12-casc`,titre:`On the Lab 0 controller: Configuration as Code, before any file`,ce:`After installing the plugin (section 2.5) on the Lab 0 controller, the page offers to export the configuration that you built with the UI.`,éléments:[`*Controller has no configuration as code file set*: this controller is configured by hand.`,`**Export configuration**: see your clicks as YAML.`,`**Setup configuration**: point the plugin to a YAML file.`],actions:["Click **Export configuration** and find the `nodes:` section with `agent-1`."],résultat:"You can see the UI configuration as code, and copy the parts you need into `casc.yaml`."},{t:`h`,id:`m2-8`,text:`2.8 Users and rights`},{t:`p`,text:`Two separate questions: **who are you?** (authentication, the *security realm*) and **what may you do?** (authorization). Lab 0 uses Jenkins' own user database and *Logged-in users can do anything*: fine for one person, not for a team.`},{t:`table`,head:[`Authorization strategy`,`What it does`,`When`],rows:[[`Anyone can do anything`,`No security at all, even for anonymous visitors`,`Never`],[`Legacy mode`,`Old behavior: admins vs everybody else`,`Never for new instances`],[`Logged-in users can do anything`,`Every account is an administrator`,`Alone in a lab`],[`**Matrix-based security**`,`A grid of permissions per user and group`,`Teams; the default choice`],[`Project-based Matrix Authorization`,`Matrix + extra permissions per job or folder`,`Several teams on one controller`],[`Role-Based Strategy (plugin)`,`Roles (developer, viewer…) assigned to users, with job patterns`,`Larger organizations (Module 9)`]]},{t:`p`,text:`In companies, authentication is usually delegated to the corporate directory: **LDAP**/Active Directory (plugin installed with the suggested plugins), or **SAML**/**OpenID Connect** through dedicated plugins. Authorization stays in Jenkins, often with directory **groups** in the matrix.`},{t:`h3`,text:`Create two users`},{t:`shot`,id:`m2-13-user-create`,titre:`Manage Jenkins → Users → Create User`,ce:`The form of Jenkins' own user database.`,éléments:["**Username**: the login (`alice`).",`**Password**, typed twice (hidden by the course).`,`**Full name**: shown in the UI and in build logs ("Started by user Alice Martin").`,`**E-mail address**: used by notifications.`,`**Create User**.`],actions:["Create `alice` (Alice Martin, a developer) and `bob` (Bob Durand, read-only)."],résultat:`Both accounts exist.`},{t:`shot`,id:`m2-14-users`,titre:`Manage Jenkins → Users`,ce:`The three accounts of the lab.`,éléments:["`admin` — Lab Admin.","`alice` — Alice Martin.","`bob` — Bob Durand."],actions:[`Check the three logins.`],résultat:`Three users; for now, all three are administrators (*Logged-in users can do anything*).`},{t:`h3`,text:`Grant rights with the matrix`},{t:`shot`,id:`m2-15-security`,titre:`Manage Jenkins → Security`,ce:`Authentication at the top, authorization below.`,éléments:[`**Security Realm**: *Jenkins' own user database*.`,`**Allow users to sign up**: unchecked — keep it so.`,`**Password Complexity Rule**: *None* or *Basic password complexity*.`,`**Authorization**: currently *Logged-in users can do anything* — change it to **Matrix-based security**.`],actions:[`Select **Matrix-based security** in the Authorization list.`],résultat:`An (empty) matrix appears, with *Anonymous* and *Authenticated Users*.`},{t:`callout`,kind:`warning`,title:`Do not lock yourself out`,text:'Add **your own account with Overall/Administer before saving**. If you save a matrix where nobody is an administrator, you lose access to Manage Jenkins. Recovery: stop Jenkins, set `<authorizationStrategy class="hudson.security.FullControlOnceLoggedInAuthorizationStrategy">` in `$JENKINS_HOME/config.xml` (or fix the YAML if you use JCasC), start Jenkins again — then repair the matrix.'},{t:`p`,text:"Click **Add user** for `admin`, `alice` and `bob`; open each card and tick the permissions below. A ticked permission can **imply** others: Overall/Administer implies everything; Job/Configure implies Run/Replay."},{t:`table`,head:[`Who`,`Permissions`,`Can`],rows:[[`Authenticated Users (group)`,`Overall/Read, View/Read`,`See Jenkins once logged in`],[`admin`,`Overall/Administer`,`Everything`],[`alice (developer)`,`Job/Build, Cancel, Configure, Read, Workspace (+ Run/Replay implied, Job/Discover implied)`,`Run, configure and debug jobs`],[`bob (viewer)`,`Job/Read`,`See jobs and their results, nothing else`]]},{t:`shot`,id:`m2-16-matrix`,titre:`The permissions of alice`,ce:`Each user is a card; permissions are grouped: Overall, Credentials, Agent, Job, Run, View, SCM.`,éléments:[`The card of **Alice Martin**, with the summary of her permissions.`,`**Job/Build**.`,`**Job/Configure**.`,`**Job/Read**.`,`**Run/Replay** *(implied)* by Job/Configure: greyed, cannot be unticked alone.`],actions:[`Tick Build, Cancel, Configure, Read and Workspace in the **Job** group.`],résultat:`The card summary reads *Job: Build, Cancel, Configure, Read, Workspace*.`},{t:`shot`,id:`m2-17-matrix-summary`,titre:`The matrix, cards folded`,ce:`The summaries give the whole policy at a glance.`,éléments:[`**Add user** / Add group.`,`**Authenticated Users**: Overall: Read · View: Read.`,`**Lab Admin**: Overall: Administer.`,`**Alice Martin**: Job: Build, Cancel, Configure, Read, Workspace.`,`**Bob Durand**: Job: Read.`],actions:[`Check, then **Save**.`],résultat:`The new rights apply immediately.`},{t:`h3`,text:`Check the rights as bob`},{t:`shot`,id:`m2-18-viewer-dashboard`,titre:`The dashboard of bob`,ce:`Logged in as bob, in another browser (or a private window).`,éléments:[`Logged in as **Bob Durand**.`,`The jobs are visible (Job/Read).`,`No **New Item**, no gear icon (Manage Jenkins), no **Build Now** on the jobs.`],actions:["Log in as `bob`, open `hello-jenkins`."],résultat:`bob can read, not act.`},{t:`shot`,id:`m2-19-access-denied`,titre:`bob opens the configuration of a job`,ce:`Jenkins refuses, and says exactly which permission is missing.`,éléments:[`*bob is missing the Job/Configure permission*.`],actions:[`As bob, open http://localhost:8080/job/hello-jenkins/configure.`],résultat:`**Access Denied** — the matrix works.`},{t:`p`,text:"The same matrix, as code (from **Export configuration** on our lab controller) — paste it into `casc.yaml` to apply it to another controller:"},{t:`code`,lang:`yaml`,file:`Excerpt of Export configuration (Lab 0 controller)`,code:`jenkins:
  authorizationStrategy:
    globalMatrix:
      entries:
      - group:
          name: "authenticated"
          permissions:
          - "Overall/Read"
          - "View/Read"
      - user:
          name: "admin"
          permissions:
          - "Overall/Administer"
      - user:
          name: "alice"
          permissions:
          - "Job/Build"
          - "Job/Cancel"
          - "Job/Configure"
          - "Job/Read"
          - "Job/Workspace"
      - user:
          name: "bob"
          permissions:
          - "Job/Read"
`,lignes:[[3,"`globalMatrix`: matrix-based security."],[5,`A **group** entry (here, the built-in group of logged-in users).`],[10,`A **user** entry, by login.`],[17,"Permissions are written `Group/Permission`; implied permissions are not listed."]]},{t:`h`,id:`m2-9`,text:`2.9 Securing the instance`},{t:`p`,text:`Jenkins holds the keys of your infrastructure (credentials, SSH keys, cloud tokens) and can run code on many machines: an attacker who controls it controls everything it deploys to. Apply these measures from the first day.`},{t:`table`,head:[`Measure`,`How`,`Done in this lab?`],rows:[[`**HTTPS** only`,`A reverse proxy (Nginx) terminates TLS; Jenkins is not exposed directly`,`Lab 2.4 below`],[`**No builds on the controller**`,`Built-in node: 0 executors; builds on agents`,`Yes (section 2.6)`],[`**Authentication + matrix**`,`No sign-up, no anonymous access, least privilege`,`Yes (section 2.8)`],[`**Content Security Policy**`,"Manage Jenkins → CSP notice → **Learn more** → **Go to configuration**, then enforce it; or JCasC `security.contentSecurityPolicy.enforce: true`. If a plugin breaks, start Jenkins with `-Djenkins.security.csp.CspHeader.headerName=Content-Security-Policy-Report-Only`",`On the 8081 controller (section 2.7)`],[`**Agent port**`,`With WebSocket agents only, set *TCP port for inbound agents* to **Disable** (Security page)`,`Optional`],[`**Updates**`,`Follow the LTS line; apply security updates of Jenkins and plugins quickly`,`Module 12`],["**Backups** of `JENKINS_HOME`",`Daily, tested by restoring`,`Module 12`],[`**Secrets** in credentials, never in jobs or logs`,`Credentials store, masking, least privilege`,`Modules 3 and 9`]]},{t:`h3`,text:`Put Jenkins behind Nginx with HTTPS`},{t:`p`,text:`A **reverse proxy** receives the HTTPS requests of the browsers, decrypts them and forwards them to Jenkins in plain HTTP on the internal network. It is also where you add rate limits, IP filtering or single sign-on. The configuration below is adapted from the official Nginx example ([jenkins.io](https://www.jenkins.io/doc/book/system-administration/reverse-proxy-configuration-with-jenkins/reverse-proxy-configuration-nginx/)) for a proxy running in its own container: the official example also serves static files from the Jenkins web root, which our proxy container cannot see.`},{t:`code`,lang:`nginx`,file:`~/jenkins-lab/nginx/jenkins.conf`,code:n,lignes:[[3,"`upstream jenkins`: the backend server(s)."],[5,"`jenkins:8080`: the controller by its Compose service name."],[8,"For **WebSocket** agents: forward `Connection: upgrade` when the client asks for it, and keep normal keepalive otherwise."],[14,`HTTPS on port 443 inside the container (8443 on your computer).`],[18,`Certificate and private key (self-signed in the lab; from your PKI or Let's Encrypt in production).`],[20,`Only modern TLS versions.`],[22,`Jenkins sends headers that Nginx would otherwise drop.`],[25,"**No trailing slash** after `http://jenkins`: with a slash, Nginx rewrites the paths and Jenkins breaks."],[28,`WebSocket upgrade headers.`],[30,"`Host` with the port: Jenkins builds its links and redirects from it."],[33,"`X-Forwarded-Proto https`: Jenkins knows the browser uses HTTPS."],[35,`Maximum upload size (plugins, files) — raise it if needed.`],[40,`Do not buffer request bodies: needed by the Jenkins CLI over HTTP.`]]},{t:`code`,lang:`yaml`,file:`~/jenkins-lab/docker-compose.yml — service to add before "volumes:"`,code:t,lignes:[[2,`nginx **1.30.6**, the current stable branch.`],[6,`https://localhost:8443 on your computer.`],[8,`Our configuration replaces the default site, read-only.`],[9,`The certificate folder, read-only.`]]},{t:`cmd`,where:`Your terminal, in ~/jenkins-lab`,cmd:`mkdir -p nginx/certs
openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout nginx/certs/jenkins.key -out nginx/certs/jenkins.crt -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost"
docker compose up -d proxy
curl -skI https://localhost:8443/login | grep -iE "^HTTP|^x-jenkins:"
echo | openssl s_client -connect localhost:8443 -servername localhost 2>/dev/null | grep -E "^subject=|^issuer=|New, "`,out:`…
-----
 Container jenkins Running
 Container jenkins-proxy Creating
 Container jenkins-proxy Created
 Container jenkins-proxy Starting
 Container jenkins-proxy Started
HTTP/2 200
x-jenkins: 2.580.2
subject=CN = localhost
issuer=CN = localhost
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384`,note:"Jenkins answers through Nginx in **HTTP/2 over TLS 1.3**. The certificate is self-signed (subject = issuer): your browser warns once; accept it for the lab only. `-k` tells curl to accept it too."},{t:`shot`,id:`m2-20-proxy-broken`,titre:`Through the proxy: "reverse proxy set up is broken"`,ce:`Opened through https://localhost:8443, Manage Jenkins shows a warning: the URL used by the browser does not match the **Jenkins URL** configured (http://localhost:8080/).`,éléments:[`*It appears that your reverse proxy set up is broken.*`],actions:[`Open **Manage Jenkins → System → Jenkins Location**.`],résultat:`You know why: the Jenkins URL is wrong for this entrance.`},{t:`shot`,id:`m2-21-jenkins-url`,titre:`Manage Jenkins → System → Jenkins Location`,ce:`The **Jenkins URL** is the public address of the controller: Jenkins uses it in e-mails, in webhook links, in agent instructions and for redirects.`,éléments:["**Jenkins URL**: `https://localhost:8443/`.",`**System Admin e-mail address**: the sender of notifications.`,`**Resource Root URL**: an optional separate domain to serve user-generated files (archived artifacts, workspace files) more safely.`],actions:["Set the Jenkins URL to `https://localhost:8443/`, **Save**, reopen Manage Jenkins through the proxy."],résultat:`The warning disappears.`},{t:`callout`,kind:`info`,title:`In the rest of this course`,text:"To keep the labs simple, go back to http://localhost:8080: set the Jenkins URL back to `http://localhost:8080/` and run `docker compose stop proxy`. In production you do the opposite: keep the proxy and **remove** the `8080:8080` port mapping, so that the only way in is HTTPS."},{t:`h`,id:`m2-10`,text:`2.10 Common errors and fixes`},{t:`p`,text:`Every message below was produced for real on the lab machines, except the last one, quoted from the official installation guide.`},{t:`errors`,rows:[["`java.nio.file.AccessDeniedException: /run/secrets/admin_password`, then `Failed ConfigurationAsCode.init` — the container restarts in a loop",`The secret file was created by root with mode 600; Jenkins runs as **uid 1000** and cannot read it.`,"`sudo chown 1000:1000 secrets/admin_password && sudo chmod 400 secrets/admin_password`, then `docker compose up -d --force-recreate`."],["`UnknownAttributesException: jenkins: Invalid configuration elements for type: class jenkins.model.Jenkins : systemMesage.` followed by `Available attributes : …`","A typo in `casc.yaml` (`systemMesage`). JCasC refuses unknown keys and Jenkins does not start.",`Fix the key using the list of *Available attributes* in the message, or the **Reference** page of the plugin.`],["`Bind for 0.0.0.0:8080 failed: port is already allocated`",`Another process (often another Jenkins) already listens on 8080.`,'Stop it, or map another port: `"8081:8080"`. Find it with `sudo ss -ltnp | grep 8080` or `docker ps`.'],["`touch: cannot touch '/var/jenkins_home/copy_reference_file.log': Permission denied` — *Wrong volume permissions?*","A **bind mount** (`./jenkins_home:/var/jenkins_home`) owned by root.","`sudo chown -R 1000:1000 jenkins_home`, or use a **named volume** as in Lab 0."],["`Running with Java 17 …, which is older than the minimum required version (Java 21). Supported Java versions are: [21, 25]`",`Jenkins 2.580.x needs Java 21 or 25.`,"Install Java 21 (`openjdk-21-jre`) and make it the default (`sudo update-alternatives --config java`)."],["Agent log: `Did not receive X-Remoting-Capability header` then `Failed to connect: Handshake error.` in a loop",`Wrong secret, or wrong node name, in the agent configuration.`,"Copy the secret again from the node page into `.env`, check `JENKINS_AGENT_NAME`, then `docker compose up -d agent-1`."],[`Manage Jenkins: *It appears that your reverse proxy set up is broken*`,"The Jenkins URL does not match the URL of the browser, or the proxy drops `Host`/`X-Forwarded-Proto`.","Set the Jenkins URL to the public HTTPS address; keep the `proxy_set_header` lines of the configuration."],["Jenkins log: `PKIX path building failed … unable to find valid certification path to requested target` when checking the update center",`A company proxy inspects TLS with its own certificate authority, unknown to Java. (We met it on our recording network.)`,`Import the company CA into the Java trust store used by Jenkins (or the image), or configure an internal update-center mirror.`],["`jenkins: failed to find a valid Java installation` (from the official guide)",`Jenkins installed before Java, or Java not in the expected place.`,"Install Java 21, then `sudo systemctl restart jenkins`."]]},{t:`h`,id:`m2-11`,text:`2.11 Hands-on labs`},{t:`lab`,id:`lab21`,titre:`Lab 2.1 — Install Jenkins on an Ubuntu VM with apt and systemd`,durée:`45 min`,objectif:`Install Jenkins LTS on an Ubuntu 24.04 VM with the official repository, then move it to port 8081 with 1 GB of heap, without editing the unit file.`,étapes:[{t:`p`,text:"**1.** Create an Ubuntu 24.04 VM (Vagrant with the `Vagrantfile` of section 2.4, any hypervisor, or a cloud VM) with 4 GB of RAM."},{t:`p`,text:"**2.** Run the commands of section 2.3, steps 1 to 3 (or `install-jenkins.sh`)."},{t:`p`,text:`**3.** Unlock Jenkins in the browser and create the admin user (as in Lab 0).`},{t:`p`,text:`**4.** Create the systemd override of step 4, reload, restart.`},{t:`p`,text:"**5.** Answer: which command proves the override is used? Where are the logs? What is `JENKINS_HOME`?"}],solution:[{t:`cmd`,where:`Ubuntu VM`,cmd:`systemctl status jenkins --no-pager | grep -A1 Drop-In
sudo ss -ltnp | grep java
systemctl show jenkins -p Environment --no-pager`,out:`    Drop-In: /etc/systemd/system/jenkins.service.d
             └─override.conf
LISTEN 0      50           0.0.0.0:8081      0.0.0.0:*    users:(("java",pid=4008,fd=9))
Environment=JENKINS_HOME=/var/lib/jenkins JENKINS_WEBROOT=/var/cache/jenkins/war "JAVA_OPTS=-Djava.awt.headless=true -Xmx1g" JENKINS_PORT=8081`},{t:`ul`,items:["The **Drop-In** line of `systemctl status` and the `--httpPort=8081`/`-Xmx1g` arguments of the Java process prove the override is applied.","Logs: `journalctl -u jenkins` (add `-f` to follow them).","`JENKINS_HOME` = `/var/lib/jenkins` (see `systemctl show`)."]}]},{t:`lab`,id:`lab22`,titre:`Lab 2.2 — Add a build agent and stop building on the controller`,durée:`30 min`,objectif:`Run every build of the Lab 0 controller on a WebSocket agent started by Docker Compose.`,étapes:[{t:`p`,text:"**1.** Create the permanent node `agent-1` (2 executors, root `/home/jenkins/agent`, label `linux`, launched by connecting to the controller)."},{t:`p`,text:"**2.** Write its secret in `~/jenkins-lab/.env`, add the `agent-1` service to `docker-compose.yml`, start it."},{t:`p`,text:`**3.** Set the built-in node to 0 executors.`},{t:`p`,text:"**4.** Build `hello-jenkins` and `hello-pipeline` again. On which node do they run? Where is the workspace now?"}],solution:[{t:`p`,text:"The logs of `agent-1` end with **Connected**, the Nodes page shows it online, and the console of each build shows `Building remotely on agent-1 (linux) in workspace /home/jenkins/agent/workspace/<job>` (Freestyle) or `Running on agent-1 in /home/jenkins/agent/workspace/<job>` (Pipeline). The workspace is in the `agent1_work` volume, inside the agent container:"},{t:`cmd`,where:`Your terminal, in ~/jenkins-lab`,cmd:`docker compose exec agent-1 ls /home/jenkins/agent/workspace`,out:`hello-jenkins`},{t:`p`,text:`If the agent stays offline, read its logs: *Handshake error* means a wrong secret or name (section 2.10).`}]},{t:`lab`,id:`lab23`,titre:`Lab 2.3 — Users and a role matrix`,durée:`30 min`,objectif:`Give alice the rights of a developer and bob read-only access, and prove it.`,étapes:[{t:`p`,text:"**1.** Create `alice` and `bob` (Manage Jenkins → Users)."},{t:`p`,text:"**2.** Switch to **Matrix-based security**; add `admin` with Overall/Administer **first**."},{t:`p`,text:`**3.** Grant the permissions of the table of section 2.8; save.`},{t:`p`,text:"**4.** In a private window, log in as bob and try to build and to configure `hello-jenkins`. Then as alice."},{t:`p`,text:`**5.** Export the configuration and find your matrix in the YAML.`}],solution:[{t:`ul`,items:["bob sees the jobs but has no **Build Now** and gets *bob is missing the Job/Configure permission* on `/configure`.",`alice can build, configure, cancel and replay, but has no access to **Manage Jenkins** (no Overall/Administer).`,"The export contains the `globalMatrix` block shown in section 2.8."]},{t:`callout`,kind:`tip`,text:`Test permissions with a **real login** of the user, in a private window: it is the only reliable check.`}]},{t:`lab`,id:`lab24`,titre:`Lab 2.4 — Jenkins behind Nginx with HTTPS`,durée:`30 min`,objectif:`Serve Jenkins over HTTPS through an Nginx reverse proxy and fix the reverse-proxy warning.`,étapes:[{t:`p`,text:"**1.** Create `nginx/jenkins.conf` and the self-signed certificate (section 2.9)."},{t:`p`,text:"**2.** Add the `proxy` service to `docker-compose.yml`; `docker compose up -d proxy`."},{t:`p`,text:`**3.** Open https://localhost:8443, accept the certificate, log in, open Manage Jenkins. What do you see?`},{t:`p`,text:`**4.** Fix it, check again, then return to http://localhost:8080 for the next modules.`},{t:`p`,text:"**5.** Bonus: remove the line `proxy_set_header X-Forwarded-Proto $scheme;`, restart the proxy and observe the links of the dashboard."}],solution:[{t:`ul`,items:["Step 3: *It appears that your reverse proxy set up is broken*, because the Jenkins URL is still `http://localhost:8080/`.","Step 4: set the Jenkins URL to `https://localhost:8443/` → the warning disappears. Then set it back to `http://localhost:8080/` and `docker compose stop proxy`.","Bonus: without `X-Forwarded-Proto`, Jenkins believes the request is plain HTTP and generates `http://` links and redirects, which break behind an HTTPS-only proxy. Put the line back."]}]},{t:`lab`,id:`lab25`,titre:`Lab 2.5 (advanced) — A controller rebuilt from code`,durée:`45 min`,objectif:"Build the 8081 controller from `Dockerfile`, `plugins.txt`, `casc.yaml` and a Docker secret; change its configuration without clicking.",étapes:[{t:`p`,text:`**1.** Create the four files of section 2.7 and the secret file (owner 1000, mode 400).`},{t:`p`,text:"**2.** `docker compose build && docker compose up -d`; wait for **(healthy)**; log in at http://localhost:8081."},{t:`p`,text:"**3.** Add the user `alice` to `casc.yaml` (password from a second secret `alice_password`), with Job/Read and Job/Build. Apply the configuration again."},{t:`p`,text:"**4.** Delete the container and its volume (`docker compose down -v`), start again: what is lost, what is kept?"}],solution:[{t:`code`,lang:`yaml`,file:`~/jenkins-casc/casc.yaml — additions`,code:`        - id: "alice"
          name: "Alice Martin"
          password: "\${alice_password}"
# …and in authorizationStrategy.globalMatrix.entries:
        - user:
            name: "alice"
            permissions:
              - "Job/Build"
              - "Job/Read"
`,lignes:[[3,"A second secret, declared in `docker-compose.yml` under `secrets:` like `admin_password`, and listed in the `secrets:` of the service."],[5,`A new entry in the matrix.`]]},{t:`ul`,items:[`Apply with **Manage Jenkins → Configuration as Code → Apply configuration** (or restart the container).`,"After `docker compose down -v`, the **configuration comes back identical** at the next start (it is in the image and the YAML); the **jobs and builds are lost** (they lived in the volume). Configuration as code does not replace backups of job data (Module 12)."]}]},{t:`exercise`,id:`ex26`,titre:`Exercise 2.6 — Choose the installation method`,énoncé:[{t:`p`,text:`For each situation, choose a method (Linux package, Docker, WAR, Kubernetes) and give one reason.`},{t:`ol`,items:[`A bank: RHEL VMs managed by an operations team with Ansible, no container platform.`,`A start-up already running all its services on Kubernetes.`,`A trainer who needs 15 identical Jenkins in a classroom tomorrow.`,`You want to test a weekly release for one hour on your laptop.`]}],solution:[{t:`ol`,items:[`**Linux package** (dnf/apt) installed by Ansible: fits the existing VM operations, systemd and monitoring.`,`**Kubernetes** (Helm chart + Kubernetes agents): reuses the platform and creates build pods on demand (Module 8).`,`**Docker Compose** with a custom image (plugins.txt + JCasC): identical, rebuilt in minutes.`,"**WAR** (`java -jar jenkins.war`) or the Docker image of that weekly release: nothing to install, removed after the test."]}]},{t:`exercise`,id:`ex27`,titre:`Exercise 2.7 — Read the error`,énoncé:[{t:`p`,text:"A colleague starts a new controller and `docker compose ps` shows `Restarting (5) 19 seconds ago`. The log contains:"},{t:`cmd`,where:`docker compose logs jenkins (real excerpt)`,cmd:``,out:`SEVERE	jenkins.InitReactorRunner$1#onTaskFailed: Failed ConfigurationAsCode.init
java.nio.file.AccessDeniedException: /run/secrets/admin_password
Caused: io.jenkins.plugins.casc.ConfiguratorException: securityRealm: Failed to configure 'securityRealm': Failed to set attribute 'users'`},{t:`p`,text:`Explain the cause and the fix. Why is the container *restarting* rather than *exited*?`}],solution:[{t:`p`,text:"JCasC needs the value of `${admin_password}` to create the `admin` user, and the process (uid 1000) cannot read the secret file, mounted with the permissions of the host file (root, 600). Fix: `sudo chown 1000:1000 secrets/admin_password && sudo chmod 400 secrets/admin_password`, then recreate the container. It is *restarting* because of `restart: unless-stopped`: Docker restarts the failed process again and again."}]},{t:`exercise`,id:`ex28`,titre:`Exercise 2.8 — From a matrix to YAML`,énoncé:[{t:`p`,text:"Write the `globalMatrix` entries for: the group `devops` (LDAP) with Overall/Administer; the group `developers` with Overall/Read, Job/Build, Job/Read; anonymous users with nothing."}],solution:[{t:`code`,lang:`yaml`,file:`casc.yaml — authorizationStrategy`,code:`jenkins:
  authorizationStrategy:
    globalMatrix:
      entries:
        - group:
            name: "devops"
            permissions:
              - "Overall/Administer"
        - group:
            name: "developers"
            permissions:
              - "Overall/Read"
              - "Job/Build"
              - "Job/Read"
`,lignes:[[5,"Directory groups appear as `group` entries; `devops` gets everything."],[9,"`developers`: read and build. Anonymous users get nothing: they are simply not listed."]]}]},{t:`h`,id:`m2-12`,text:`2.12 Recap, quiz and checklist`},{t:`recap`,items:[`Jenkins 2.580.x needs **Java 21 or 25**; size the controller for orchestration and keep builds on agents.`,"On Ubuntu/Debian: Java first, the signed **debian-stable** repository, `apt install jenkins`; `JENKINS_HOME` = `/var/lib/jenkins`; logs in `journalctl -u jenkins`; changes in a **systemd override**.",`A VM is reproducible with a **Vagrantfile** + a provisioning script (or cloud-init).`,`An **inbound agent** connects to the controller over **WebSocket** with its node name and secret; the built-in node gets **0 executors**.`,"Production-like controllers are code: **Dockerfile** + **plugins.txt** (`jenkins-plugin-cli`) + **casc.yaml** (JCasC) + **Docker secrets**.",`Plugins: few, healthy, pinned, updated on purpose after a backup.`,`Users: **Matrix-based security**, administrator added first, rights checked with a real login.`,`Security: HTTPS through a **reverse proxy** with a correct **Jenkins URL**, CSP enforced, no sign-up, updates and backups.`]},{t:`quiz`,id:`quiz2`,questions:[{q:`Jenkins 2.580.2 is started with Java 17. What happens?`,choix:[`It starts with a warning`,`It refuses to start: Java 21 or 25 is required`,`It starts in read-only mode`,`It downloads Java 21 by itself`],bonne:1,pourquoi:`Real message: *"Running with Java 17 …, which is older than the minimum required version (Java 21). Supported Java versions are: [21, 25]"*.`},{q:"With the Debian package, where is `JENKINS_HOME`?",choix:[`/var/jenkins_home`,`/opt/jenkins`,`/var/lib/jenkins`,`/etc/jenkins`],bonne:2,pourquoi:"`/var/jenkins_home` is the path inside the Docker image; the package uses `/var/lib/jenkins`."},{q:`How do you change the port of a Jenkins installed with apt?`,choix:[`Edit /usr/lib/systemd/system/jenkins.service`,`Edit /etc/default/jenkins`,`Create a systemd override with Environment="JENKINS_PORT=…", then daemon-reload and restart`,`Change it in Manage Jenkins → System`],bonne:2,pourquoi:`The unit file belongs to the package and is replaced by upgrades; an override (drop-in) survives them.`},{q:`Why does the inbound agent of the lab need no extra open port?`,choix:[`It uses SSH`,`It connects over WebSocket through the HTTP port of the controller`,`It runs inside the controller`,`Docker opens the port automatically`],bonne:1,pourquoi:"`JENKINS_WEB_SOCKET=true`: the agent opens the connection through 8080 (or 443 behind the proxy). Port 50000 is only for TCP agents."},{q:`What does setting the built-in node to 0 executors achieve?`,choix:[`Jenkins stops`,`No build can run on the controller any more; agents run them`,`Builds are queued forever`,`Plugins are disabled`],bonne:1,pourquoi:"It is the first hardening step: build code never runs with access to `JENKINS_HOME` and its secrets."},{q:"In `plugins.txt`, why are dependencies not listed?",choix:[`They are not needed`,"`jenkins-plugin-cli` resolves and downloads them",`Jenkins downloads them at first login`,`They are in the base image`],bonne:1,pourquoi:`8 plugins listed, 74 installed: the others are resolved dependencies.`},{q:"In `casc.yaml`, how should the admin password be provided?",choix:[`In clear text in the YAML`,"As `${admin_password}`, read from a Docker secret or an environment variable",`In plugins.txt`,`It cannot be set by JCasC`],bonne:1,pourquoi:"JCasC resolves `${…}` variables from secrets (`/run/secrets/<name>`) or the environment: the file stays shareable."},{q:`You switch to Matrix-based security. What must you do before saving?`,choix:[`Restart Jenkins`,`Add your own account with Overall/Administer`,`Disable all plugins`,`Delete the other users`],bonne:1,pourquoi:"Otherwise nobody can administer Jenkins any more and you must repair `config.xml` on disk."},{q:`Manage Jenkins shows "It appears that your reverse proxy set up is broken". First thing to check?`,choix:[`The Java version`,`That the Jenkins URL matches the address used in the browser and that the proxy passes Host and X-Forwarded-Proto`,`The number of executors`,`The plugin health scores`],bonne:1,pourquoi:`In our lab, the warning came from the Jenkins URL still set to http://localhost:8080/ while browsing https://localhost:8443/.`},{q:`What does an enforced Content Security Policy protect against?`,choix:[`Brute-force logins`,`Scripts injected into Jenkins pages (XSS)`,`Disk full`,`Plugin dependency conflicts`],bonne:1,pourquoi:`The header tells the browser to run only scripts served by Jenkins itself.`}]},{t:`checklist`,id:`m2`,items:[`I can list the prerequisites of a controller (Java 21/25, RAM, disk, ports).`,`I installed Jenkins with apt on Ubuntu and changed its port with a systemd override (Lab 2.1).`,`I know how to rebuild a Jenkins VM with Vagrant and a provisioning script.`,`agent-1 is online and the built-in node has 0 executors (Lab 2.2).`,`I installed a plugin and know where to see versions, health and security warnings.`,`alice and bob have the rights of the matrix, checked with their own login (Lab 2.3).`,`I served Jenkins over HTTPS through Nginx and fixed the Jenkins URL (Lab 2.4).`,`I can explain plugins.txt, casc.yaml and Docker secrets, and rebuild a controller from them (Lab 2.5).`]}];export{a as CASC_YAML,e as COMPOSE_AGENT,o as COMPOSE_CASC,r as DOCKERFILE_CASC,c as INSTALL_SH,u as MODULE2,u as default,n as NGINX_CONF,l as OVERRIDE_CONF,i as PLUGINS_TXT,t as PROXY_SERVICE,s as VAGRANTFILE};