import{MODULE2 as e}from"./module2-CmZ33_GC.js";var t=(e,t)=>{let n=e.find(e=>e.t===`shot`&&e.id===t);if(!n)throw Error(`Module 9: screenshot block not found in its module (${t})`);return n},n=`  web-1:
    image: jenkins/ssh-agent:9.5.0-jdk21      # an SSH server with a "jenkins" user: deploy target (Module 9), agent (Module 12)
    container_name: web-1
    restart: unless-stopped
    environment:
      JENKINS_AGENT_SSH_PUBKEY: \${WEB1_DEPLOY_PUBKEY}   # the public key allowed to log in (read from .env)
`,r=`// deploy-web-1 — deploy a release to a server over SSH (Pipeline job, Module 9)
pipeline {
    agent { label 'linux' }
    parameters {
        string(name: 'VERSION', defaultValue: '1.0.7', description: 'Version to deploy')
    }
    options { timestamps(); disableConcurrentBuilds() }
    environment {
        TARGET = 'jenkins@web-1'
        // The host key of web-1, compared once with the fingerprint given by its administrator
        WEB1_HOST_KEY = 'web-1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIN7YJqje5vUNzjb47GEytBkfE+aKES9t+m1eUcTMeh0X'
    }
    stages {
        stage('Deploy over SSH') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'web-1-deploy', keyFileVariable: 'SSH_KEY')]) {
                    sh '''
                        [ -n "$VERSION" ] || { echo "VERSION is empty: use Build with Parameters"; exit 1; }
                        echo "$WEB1_HOST_KEY" > known_hosts
                        ssh -i "$SSH_KEY" -o UserKnownHostsFile=known_hosts "$TARGET" "
                          mkdir -p releases/$VERSION &&
                          echo $VERSION > releases/$VERSION/VERSION &&
                          ln -sfn releases/$VERSION current &&
                          cat current/VERSION"
                    '''
                }
            }
        }
    }
}
`,i=`// safe-pipeline — the same need, done right: the token is used, never printed, never stored (Module 9)
pipeline {
    agent { label 'linux' }
    options { timestamps() }
    stages {
        stage('Call the Gitea API') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'gitea-jenkins-bot',
                                                  usernameVariable: 'BOT', passwordVariable: 'TOKEN')]) {
                    sh '''
                        curl -fsS -H "Authorization: token $TOKEN" http://gitea:3000/api/v1/user \\
                          | python3 -c 'import json, sys; print("authenticated as", json.load(sys.stdin)["login"])'
                    '''
                }
            }
        }
    }
}
`,a=`// leaky-pipeline — five ways to leak a secret although Jenkins masks it (Module 9: audit it, never copy it)
pipeline {
    agent { label 'linux' }
    options { timestamps() }
    stages {
        stage('Leaks') {
            steps {
                withCredentials([string(credentialsId: 'leak-demo-token', variable: 'TOKEN')]) {
                    sh "echo Calling the API with \${TOKEN}"                   // 1. Groovy pastes the secret into the command
                    sh 'echo "$TOKEN" | base64'                               // 2. base64: Jenkins masks this encoding too
                    sh 'echo "$TOKEN" | rev'                                  // 3. reversed: not masked
                    sh 'echo "\${TOKEN%????}"'                                 // 4. a part of it: all but the last 4 characters
                    sh 'echo "token=$TOKEN" > settings.properties'            // 5. written to a file…
                    archiveArtifacts artifacts: 'settings.properties'          //    …and archived with the build
                }
            }
        }
    }
}
`,o=`// use-team-token — a credential stored in the folder team-stock (Module 9)
pipeline {
    agent { label 'linux' }
    stages {
        stage('Use the team token') {
            steps {
                withCredentials([string(credentialsId: 'team-stock-token', variable: 'TEAM_TOKEN')]) {
                    sh 'test -n "$TEAM_TOKEN" && echo "team token available"'
                }
            }
        }
    }
}
`,s=`// sandbox-demo — what the Groovy sandbox refuses (Module 9)
pipeline {
    agent none
    stages {
        stage('Read a file of the controller') {
            steps {
                script {
                    echo new File('/var/jenkins_home/secrets/master.key').text   // the key that decrypts every credential
                }
            }
        }
    }
}
`,c=[{t:`objectives`,items:[`Choose the right kind, scope and store for each credential.`,`Deploy to a server over SSH with a key credential and a pinned host key.`,`Use access tokens of bot accounts with the least privilege.`,`Know exactly what log masking hides — and the leaks it does not catch.`,`Limit who can use a credential with folder-scoped stores, and who can do what with the authorization matrix.`,`Understand the Groovy sandbox and refuse dangerous script approvals.`,`Apply a hardening checklist to a Jenkins controller.`]},{t:`p`,text:"Prerequisite: the lab of Module 8. This module adds a server, `web-1`, reached over SSH. Every leak shown below happened for real in the lab — with **fake** secrets created for the occasion."},{t:`h`,id:`m9-1`,text:`9.1 Where secrets live in Jenkins`},{t:`table`,head:[`Credential kind`,`Holds`,`Typical use`,`Binding in a pipeline`],rows:[[`**Secret text**`,`One string`,`API token, webhook secret`,"`string(credentialsId: …, variable: …)`"],[`**Username with password**`,`A pair`,`Git over HTTPS, registries, a bot account and its token`,"`usernamePassword(…, usernameVariable: …, passwordVariable: …)`"],[`**SSH Username with private key**`,`A user and a private key`,`Deployments over SSH, Git over SSH, SSH agents`,"`sshUserPrivateKey(…, keyFileVariable: …)` or `sshagent([…])`"],[`**Secret file**`,`A whole file`,`kubeconfig, a service-account key in JSON`,"`file(credentialsId: …, variable: …)`"],[`**Certificate**`,`PKCS#12 or PEM certificate and key`,`Client certificates (mutual TLS)`,"`certificate(…)`"]]},{t:`table`,head:[``,`Choices`,`Rule`],rows:[[`**Scope**`,`*Global*: usable by jobs and agents · *System*: only by Jenkins itself (to connect agents, to talk to a cloud)`,`System whenever no job needs it`],[`**Store**`,`The System store (whole controller) · a **folder** store (jobs of that folder only, section 9.5) · a user store`,`Put a team's secrets in the team's folder`]]},{t:`p`,text:"On disk, credentials are **encrypted**: each value in `credentials.xml` is a blob that only this controller can decrypt, with the keys of `secrets/`:"},{t:`cmd`,where:`Your terminal, in ~/jenkins-lab`,cmd:``,out:`$ docker compose exec jenkins sh -c "grep -o '<secret>{[^}]\\{0,24\\}' /var/jenkins_home/credentials.xml | head -3"
<secret>{AQAAABAAAAAwsPoNIWr0EOvA
<secret>{AQAAABAAAAOQGFLRmo9ybZZv
<secret>{AQAAABAAAAAgFr7coxBdagLA
$ docker compose exec jenkins ls -l /var/jenkins_home/secrets/master.key /var/jenkins_home/secrets/hudson.util.Secret
-rw-r--r-- 1 jenkins jenkins 272 Nov 17 10:13 /var/jenkins_home/secrets/hudson.util.Secret
-rw-r--r-- 1 jenkins jenkins 256 Nov 17 09:47 /var/jenkins_home/secrets/master.key`,note:"Whoever holds `credentials.xml` **and** `secrets/master.key` + `secrets/hudson.util.Secret` can decrypt every credential. A backup of JENKINS_HOME is therefore as sensitive as all your secrets together: encrypt it and restrict it (Module 12)."},{t:`callout`,kind:`enterprise`,text:`Many companies keep secrets outside Jenkins, in a vault — HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, Google Secret Manager, CyberArk — with plugins that fetch them at build time. Jenkins then stores only the credential that lets it talk to the vault, and the vault keeps the audit log and the rotation.`},{t:`h`,id:`m9-2`,text:`9.2 Deploy over SSH with a key`},{t:`p`,text:"Add a server to the lab: the official image `jenkins/ssh-agent` runs an SSH server with a `jenkins` user (it is also the SSH agent of Module 12). Create a key pair dedicated to deployments, with no passphrase (Jenkins stores the private key encrypted):"},{t:`cmd`,where:`Your terminal, in ~/jenkins-lab`,cmd:``,out:`$ ssh-keygen -t ed25519 -N "" -C jenkins-deploy@lab -f deploy_key
$ cat deploy_key.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBHiX9EVVga+s+B+84MEQxd4/KcpgvZYoI+NTNfhTVnf jenkins-deploy@lab`,note:`The public key may be shown anywhere; the private key goes into Jenkins only, then delete the file.`},{t:`code`,lang:`yaml`,file:`~/jenkins-lab/docker-compose.yml — service to add`,code:n,lignes:[[2,`The official image, pinned (OpenSSH 10.0, Debian 13).`],[6,'The image writes this public key to `~jenkins/.ssh/authorized_keys`. Put the line `WEB1_DEPLOY_PUBKEY="ssh-ed25519 …"` in `.env`.']]},{t:`shot`,id:`m9-01-ssh-credential`,titre:`Add Credentials → SSH Username with private key`,ce:`The private key, stored encrypted; the screenshot hides it.`,éléments:["**ID**: `web-1-deploy`.","**Username**: `jenkins`, the account on the target.",`**Private Key**: *Enter directly*.`,`The key itself, pasted with its BEGIN/END lines (hidden by the course).`],actions:["Paste the content of `deploy_key`, **Create**, then delete the file from your disk."],résultat:`Pipelines can use the key without ever seeing it in clear.`},{t:`code`,lang:`groovy`,file:`deploy-web-1 → Configure → Pipeline script`,code:r,lignes:[[11,`The **host key** of web-1: SSH checks it is talking to the right server — section below.`],[16,"`sshUserPrivateKey`: the key is written to a temporary file whose path is in `$SSH_KEY`, deleted after the block."],[18,"The first run of a parameterized job has no parameters: refuse an empty version (the command would run `ln -sfn releases/ current`)."],[19,"A `known_hosts` file with only this host key."],[20,"`-o UserKnownHostsFile=known_hosts`: trust this key, nothing else."],[23,"A classic atomic switch: each release in its folder, `current` points to the active one — a rollback is one `ln`."]]},{t:`p`,text:"The very first version had no `known_hosts`:"},{t:`cmd`,where:`deploy-web-1 #1 → Console Output (real text, excerpt)`,cmd:``,out:`[2026-11-17T21:31:51.148Z] Masking supported pattern matches of $SSH_KEY
[2026-11-17T21:31:53.422Z] + ssh -i **** jenkins@web-1 
[2026-11-17T21:31:53.422Z]                           mkdir -p releases/ &&
[2026-11-17T21:31:54.363Z] Host key verification failed.
Finished: FAILURE`,note:"Two lessons in one run: SSH refused an unknown server, and `$VERSION` was empty (first run without parameters). Notice `ssh -i ****`: even the path of the key file is masked."},{t:`p`,text:"Do **not** fix it with `-o StrictHostKeyChecking=no`: that accepts any server, including one placed in the middle by an attacker. Get the host key once, and compare its fingerprint with the one given by the server's administrator:"},{t:`cmd`,where:`Your terminal`,cmd:``,out:`$ docker compose exec web-1 ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub    # on the server (or from its administrator)
256 SHA256:b3qzbhyze2vI+Szw5d6OoS4UDGqTPNsl4hpa2v0187k root@4ae8d96af529 (ED25519)
$ ssh-keyscan -t ed25519 web-1 > web-1.known_hosts    # from agent-1
$ ssh-keygen -lf web-1.known_hosts
256 SHA256:b3qzbhyze2vI+Szw5d6OoS4UDGqTPNsl4hpa2v0187k web-1 (ED25519)
$ cat web-1.known_hosts
# web-1:22 SSH-2.0-OpenSSH_10.0p2 Debian-7+deb13u4
web-1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIN7YJqje5vUNzjb47GEytBkfE+aKES9t+m1eUcTMeh0X`,note:"Same fingerprint `SHA256:b3qz…` on both sides: the key line (without the `#` comment) goes into the pipeline (line 11). If the server is rebuilt, its key changes and SSH refuses again — on purpose."},{t:`cmd`,where:`deploy-web-1 #4 (VERSION=1.0.7) → Console Output (real text, excerpt)`,cmd:``,out:`[2026-11-17T21:32:48.943Z] Masking supported pattern matches of $SSH_KEY
[2026-11-17T21:32:49.228Z] + [ -n 1.0.7 ]
[2026-11-17T21:32:49.228Z] + ssh -i **** -o UserKnownHostsFile=known_hosts jenkins@web-1 
[2026-11-17T21:32:49.228Z]                           mkdir -p releases/1.0.7 &&
[2026-11-17T21:32:49.228Z]                           echo 1.0.7 > releases/1.0.7/VERSION &&
[2026-11-17T21:32:49.228Z]                           ln -sfn releases/1.0.7 current &&
[2026-11-17T21:32:49.228Z]                           cat current/VERSION
[2026-11-17T21:32:49.228Z] 1.0.7
Finished: SUCCESS`},{t:`cmd`,where:`Your terminal`,cmd:``,out:`$ docker compose exec web-1 ls -l /home/jenkins/current /home/jenkins/releases
lrwxrwxrwx 1 jenkins jenkins   14 Nov 17 21:32 /home/jenkins/current -> releases/1.0.7

/home/jenkins/releases:
total 8
drwxrwxr-x 2 jenkins jenkins 4096 Nov 17 21:32 1.0.6
drwxrwxr-x 2 jenkins jenkins 4096 Nov 17 21:32 1.0.7`},{t:`callout`,kind:`tip`,text:"The **SSH Agent** plugin offers `sshagent(['web-1-deploy']) { sh 'ssh …' }`: the key is loaded in an ssh-agent instead of a file — useful when a script calls `ssh` or `git` several times. Both ways keep the key out of the log."},{t:`h`,id:`m9-3`,text:`9.3 Access tokens`},{t:`p`,text:"A token is a password that can be **limited** (scopes), **named** (one per use) and **revoked** alone. Rules already applied in this course: a bot account per tool (`jenkins-bot`), one token per purpose (`gitea-jenkins-bot` for Git, `gitea-packages` for publishing, with *write:package* only — Module 6), never a person's password. Use them through the environment, never through the command line:"},{t:`code`,lang:`groovy`,file:`safe-pipeline → Configure → Pipeline script`,code:i,lignes:[[8,"`usernamePassword`: the bot account and its token, as two masked variables."],[11,"Single quotes: the shell reads `$TOKEN` from its environment; the header is built by curl."],[12,`Print what you need from the answer — never the token.`]]},{t:`cmd`,where:`safe-pipeline #2 → Console Output (real text, excerpt)`,cmd:``,out:`[2026-11-17T21:34:13.899Z] Masking supported pattern matches of $TOKEN
[2026-11-17T21:34:14.184Z] + curl -fsS -H Authorization: token **** http://gitea:3000/api/v1/user
[2026-11-17T21:34:14.184Z] + python3 -c import json, sys; print("authenticated as", json.load(sys.stdin)["login"])
[2026-11-17T21:34:15.554Z] authenticated as jenkins-bot
Finished: SUCCESS`},{t:`callout`,kind:`warning`,title:`Rotation`,text:`Plan the rotation of every token: create the new token, update the credential, run the jobs that use it, then revoke the old one. Tokens without an expiry date are convenient — and forgotten for years.`},{t:`h`,id:`m9-4`,text:`9.4 What masking hides — and what it does not`},{t:`p`,text:"Inside `withCredentials`, Jenkins replaces the value of the secret by `****` in the log. Here is a pipeline to **audit**, not to copy — five ways to handle a (fake) token:"},{t:`code`,lang:`groovy`,file:`leaky-pipeline → Configure → Pipeline script`,code:a,lignes:[[9,`Double quotes: Groovy pastes the secret into the command line.`],[10,`base64 of the secret.`],[11,`The secret reversed.`],[12,`The secret without its last four characters.`],[13,`The secret written into a file of the workspace…`],[14,`…archived with the build.`]]},{t:`cmd`,where:`leaky-pipeline #2 → Console Output (real text, excerpt)`,cmd:``,out:`[2026-11-17T21:34:03.832Z] Masking supported pattern matches of $TOKEN
[2026-11-17T21:34:03.841Z] Warning: A secret was passed to "sh" using Groovy String interpolation, which is insecure.
[2026-11-17T21:34:03.841Z] 		 Affected argument(s) used the following variable(s): [TOKEN]
[2026-11-17T21:34:03.841Z] 		 See https://jenkins.io/redirect/groovy-string-interpolation for details.
[2026-11-17T21:34:04.161Z] + echo Calling the API with ****
[2026-11-17T21:34:04.161Z] Calling the API with ****
[2026-11-17T21:34:04.444Z] + echo ****
[2026-11-17T21:34:04.444Z] + base64
[2026-11-17T21:34:04.444Z] ****Qo=
[2026-11-17T21:34:04.724Z] + rev
[2026-11-17T21:34:04.724Z] + echo ****
[2026-11-17T21:34:04.724Z] 18b5e2c9a3f7-kael-omed
[2026-11-17T21:34:05.013Z] + echo demo-leak-7f3a9c2e
[2026-11-17T21:34:05.013Z] demo-leak-7f3a9c2e
[2026-11-17T21:34:05.300Z] + echo token=****
[2026-11-17T21:34:05.332Z] Archiving artifacts`},{t:`cmd`,where:`Anyone who can read the job`,cmd:``,out:`$ curl -s -u "admin:$JENKINS_TOKEN" http://localhost:8080/job/leaky-pipeline/2/artifact/settings.properties
token=demo-leak-7f3a9c2e5b81`},{t:`table`,head:[`Line`,`In the log`,`Verdict`],rows:[[`9 — Groovy interpolation`,"`****`, plus a warning",`**Unsafe**: the clear secret was on the command line of the process`],[`10 — base64`,"`****Qo=`: Jenkins also masks the base64 form",`Masked here — do not rely on it for other encodings`],[`11 — reversed`,"`18b5e2c9a3f7-kael-omed`",`**Leaked**`],[`12 — partial`,"`demo-leak-7f3a9c2e`",`**Leaked** (all but 4 characters)`],[`13–14 — file archived`,"`echo token=****` — looks safe",`**Leaked** in the artifact, to everyone with read access`]]},{t:`ul`,items:[`Masking replaces **exact** values (and a few encodings): any transformation, part or file escapes it. It is a safety net, not a protection.`,`Never print a secret, never write it into a file you archive or stash, never pass it through Groovy interpolation.`,"Keep `withCredentials` blocks short; give secrets to tools through their environment or stdin (`--password-stdin`, Module 7).","Review Jenkinsfiles like code: a pull request that touches `withCredentials` deserves a careful reader."]},{t:`h`,id:`m9-5`,text:`9.5 Who may use a credential: folder stores`},{t:`p`,text:"A credential of the System store is usable by **every** job of the controller. Put a team's credentials in the team's **folder**: only the jobs of that folder can use them. We created the folder `team-stock`, a Secret text `team-stock-token` in its store, and the same Jenkinsfile in two jobs — one inside, one outside:"},{t:`code`,lang:`groovy`,file:`team-stock/use-team-token and outside-folder → Pipeline script`,code:o,lignes:[[7,`The ID is looked up in the stores of the job's folders, then in the System store.`]]},{t:`cmd`,where:`team-stock » use-team-token #1 (real text, excerpt)`,cmd:``,out:`Running on agent-1 in /home/jenkins/agent/workspace/team-stock/use-team-token
Masking supported pattern matches of $TEAM_TOKEN
+ test -n ****
+ echo team token available
team token available
Finished: SUCCESS`},{t:`cmd`,where:`outside-folder #1 (real text, excerpt)`,cmd:``,out:`Running on agent-1 in /home/jenkins/agent/workspace/outside-folder
ERROR: Could not find credentials entry with ID 'team-stock-token'
Finished: FAILURE`},{t:`shot`,id:`m9-03-folder-credentials`,titre:`team-stock → Credentials`,ce:`The credentials a job of this folder can use.`,éléments:["`team-stock-token`, in the store of the folder.",`**Stores scoped to** team-stock.`,`**Stores from parent**: the global credentials, still visible.`],actions:[`Folder → **Credentials** → the folder store → Global → **Add Credentials**.`],résultat:`The team's secret is out of reach of the other jobs.`},{t:`h`,id:`m9-6`,text:`9.6 Authentication and authorization`},{t:`p`,text:`**Authentication** answers *who are you?* (Jenkins user database, LDAP/Active Directory, SAML or OpenID Connect single sign-on through plugins). **Authorization** answers *what may you do?* The matrix of Module 2 gives each user or group a set of permissions:`},t(e,`m2-17-matrix-summary`),t(e,`m2-19-access-denied`),{t:`table`,head:[`Principle`,`In practice`],rows:[[`Least privilege`,`Developers: Job/Build and Read on their folders; very few administrators`],[`Groups, not people`,`Give rights to LDAP/SSO groups; joining or leaving a team changes the group, not Jenkins`],[`Per team`,`*Project-based Matrix Authorization*: permissions on each folder, combined with folder credentials`],[`No anonymous access`,`Anonymous: nothing (or Overall/Read on purpose)`],[`Dangerous permissions`,`Overall/Administer, Job/Configure (can change what a job runs), Credentials/View, Run/Replay`]]},{t:`callout`,kind:`warning`,title:`Job/Configure is powerful`,text:`Whoever can configure a job — or push a Jenkinsfile to a branch that Jenkins builds — can run any command on the agents and use the credentials that job may use. Protect the branches that build with secrets, and keep deployment credentials in folders that only reviewed code reaches.`},{t:`h`,id:`m9-7`,text:`9.7 Script security: the Groovy sandbox`},{t:`p`,text:`Pipelines run in a **sandbox**: only approved Groovy methods are allowed. Here is a pipeline that tries to read the key that decrypts every credential:`},{t:`code`,lang:`groovy`,file:`sandbox-demo → Configure → Pipeline script`,code:s,lignes:[[8,"`new File(…)` runs **on the controller**, not on an agent: it could read any file of JENKINS_HOME."]]},{t:`cmd`,where:`sandbox-demo #1 → Console Output (real text, excerpt)`,cmd:``,out:`Scripts not permitted to use new java.io.File java.lang.String. Administrators can decide whether to approve or reject this signature.
org.jenkinsci.plugins.scriptsecurity.sandbox.RejectedAccessException: Scripts not permitted to use new java.io.File java.lang.String
Finished: FAILURE`},{t:`shot`,id:`m9-02-script-approval`,titre:`Manage Jenkins → In-process Script Approval`,ce:`The refused signature waits for an administrator.`,éléments:["The signature: `new java.io.File java.lang.String`.",`**Approve**: Jenkins itself warns *Approving this signature may introduce a security vulnerability! You are advised to deny it.*`,`**Deny**.`],actions:[`Click **Deny**.`],résultat:`The pipeline stays unable to read the controller's files.`},{t:`ul`,items:[`Approve a signature only if you understand what it allows **for every pipeline**: approvals are global.`,`Keep *Use Groovy Sandbox* ticked; logic that needs more belongs in a **Shared Library** maintained by administrators (Module 12) or in a shell script run on an agent.`,`The **Script Console** (Manage Jenkins) runs Groovy without any sandbox, as Jenkins itself: reserve it to administrators, and treat its use as a privileged action.`]},{t:`h`,id:`m9-8`,text:`9.8 Hardening checklist`},{t:`table`,head:[`Area`,`Do`,`Where in this course`],rows:[[`Updates`,`Follow jenkins.io/security; update the LTS and the plugins; remove unused plugins`,`Modules 1, 12`],[`Builds`,`No executors on the built-in node; builds on agents, ideally ephemeral`,`Modules 2, 8`],[`Network`,`HTTPS in front of Jenkins; agents over WebSocket or SSH; nothing exposed that is not needed`,`Module 2`],[`Accounts`,`No sign-up, no anonymous access, matrix or project-based authorization, SSO for people`,`Modules 2, 9`],[`Secrets`,`Credentials with the narrowest scope and store; bot tokens with minimal rights; rotation`,`Modules 3, 5, 6, 9`],[`Pipelines`,`Sandbox on; review Jenkinsfiles; protect branches that use deployment credentials`,`Modules 4, 9`],[`Data`,`Encrypted, restricted backups of JENKINS_HOME; restore tested`,`Module 12`],[`Audit`,`Logs of who did what (Audit Trail plugin), alerts on configuration changes`,`Module 12`]]},{t:`callout`,kind:`info`,title:`Jenkins and Ansible`,text:"Ansible Vault encrypts secrets *inside* a Git repository, decrypted with one vault password. With Jenkins, store that vault password as a Secret file or Secret text credential and pass it to `ansible-playbook --vault-password-file` inside `withCredentials` — the same rules apply (Module 10)."},{t:`h`,id:`m9-9`,text:`9.9 Common errors and fixes`},{t:`errors`,rows:[["`Host key verification failed.`",`SSH does not know the server.`,"Pin its host key (`known_hosts`), checked against the administrator's fingerprint — never `StrictHostKeyChecking=no`."],['`Warning: A secret was passed to "sh" using Groovy String interpolation, which is insecure.`',`Double quotes around a command with a secret.`,`Single quotes: the shell reads the variable.`],[`The secret appears reversed, cut or in an artifact`,`Masking only replaces exact values.`,`Never print or store secrets; review the Jenkinsfile.`],["`ERROR: Could not find credentials entry with ID 'team-stock-token'`",`The credential is in a folder store the job cannot see (or the ID is misspelled).`,`Move the job into the folder, or the credential to the right store.`],["`Scripts not permitted to use new java.io.File java.lang.String`",`The sandbox refused a method.`,`Do it in a shell step on an agent, or in a reviewed Shared Library — not by approving it.`],["`jq: not found` in a step",`The tool is not on the agent.`,"Install it in the agent image, or use a tool that is there (here `python3`)."],["A deployment runs with an empty `$VERSION`",`First run of a parameterized job.`,'A guard: `[ -n "$VERSION" ] || exit 1`.']]},{t:`h`,id:`m9-10`,text:`9.10 Hands-on labs`},{t:`lab`,id:`lab91`,titre:`Lab 9.1 — Deploy over SSH with a key credential`,durée:`40 min`,objectif:`A key-based deployment with a pinned host key.`,étapes:[{t:`p`,text:"**1.** Generate the key pair, add `web-1` to the lab, create the credential `web-1-deploy`."},{t:`p`,text:"**2.** Create `deploy-web-1` without lines 11 and 19, and without `-o UserKnownHostsFile`. Run it."},{t:`p`,text:`**3.** Compare the fingerprints, pin the host key, deploy 1.0.6 then 1.0.7. Roll back by hand to 1.0.6.`}],solution:[{t:`ul`,items:[`Step 2: *Host key verification failed.*`,"Step 3: `current -> releases/1.0.7`; the rollback is `ln -sfn releases/1.0.6 current` on web-1 (or a deployment with VERSION=1.0.6)."]}]},{t:`lab`,id:`lab92`,titre:`Lab 9.2 — Audit a pipeline that leaks a secret`,durée:`30 min`,objectif:`Find every leak, then rewrite the pipeline.`,étapes:[{t:`p`,text:"**1.** Create a fake Secret text `leak-demo-token` and the job `leaky-pipeline`. Run it."},{t:`p`,text:`**2.** For each of lines 9 to 14, decide: safe, masked but unsafe, or leaked. Check the archived file.`},{t:`p`,text:"**3.** Rewrite the pipeline so that it uses a token without any leak (model: `safe-pipeline`)."}],solution:[{t:`ul`,items:[`Line 9: masked but unsafe (warning). Line 10: masked by Jenkins (base64). Lines 11, 12: leaked in the log. Lines 13–14: leaked in the artifact.`,`Step 3: single quotes, the secret passed to the tool through the environment, nothing printed, nothing archived.`]}]},{t:`lab`,id:`lab93`,titre:`Lab 9.3 — Credentials and scripts under control`,durée:`25 min`,objectif:`Limit a credential to a folder and see the sandbox at work.`,étapes:[{t:`p`,text:"**1.** Create the folder `team-stock` with its credential; run the same Jenkinsfile inside and outside the folder."},{t:`p`,text:"**2.** Run `sandbox-demo`; open *In-process Script Approval*."},{t:`p`,text:`**3.** What would approving the signature allow, and to whom?`}],solution:[{t:`ul`,items:[`Step 1: inside, *team token available*; outside, *Could not find credentials entry*.`,"Step 3: every pipeline of the controller could read any file of JENKINS_HOME — `master.key` included, hence decrypt all credentials. Deny it."]}]},{t:`exercise`,id:`ex94`,titre:`Exercise 9.4 — Choose the credential`,énoncé:[{t:`p`,text:`Kind, scope and store for: (a) the token Jenkins uses to create pods in a cluster; (b) the token of the payment team to publish to its registry; (c) a kubeconfig used by one deployment job; (d) the password of an SSH agent connected by Jenkins itself.`}],solution:[{t:`ul`,items:[`(a) Secret text, scope **System** (only the cloud uses it), System store.`,`(b) Username with password (bot + token), Global, in the **folder** of the payment team.`,`(c) Secret file, Global, in the folder of that job — better: a dedicated ServiceAccount token with rights on one namespace (Module 8).`,`(d) SSH Username with private key, scope **System** — agents are connected by Jenkins, not by jobs.`]}]},{t:`recap`,items:[`Five kinds of credentials; scope **System** when no job needs it; the narrowest **store** (folder) for team secrets.`,`Credentials are encrypted with keys of JENKINS_HOME: protect backups like secrets.`,"SSH: a key credential, a pinned host key, never `StrictHostKeyChecking=no`.",`Tokens of bot accounts, minimal scopes, one per purpose, rotated.`,`Masking hides exact values (and base64): transformations, parts and files leak — never print or store secrets.`,`Authorization: least privilege, groups, per-folder rights; Job/Configure is a powerful permission.`,`The sandbox protects the controller: deny dangerous signatures; the Script Console is for administrators only.`]},{t:`quiz`,id:`quiz9`,questions:[{q:`Which scope for the token Jenkins uses to talk to a Kubernetes cloud?`,choix:[`Global`,`System`,`User`,`Any`],bonne:1,pourquoi:`No job needs it: System keeps it out of pipelines.`},{q:`What decrypts credentials.xml?`,choix:[`Nothing, it is clear text`,`The keys of JENKINS_HOME/secrets`,`The admin password`,`The browser`],bonne:1,pourquoi:`Hence: protect backups of JENKINS_HOME.`},{q:`SSH says Host key verification failed. The right fix?`,choix:[`StrictHostKeyChecking=no`,`Pin the host key after checking its fingerprint`,`Restart Jenkins`,`Use a password`],bonne:1,pourquoi:`Accepting any key opens the door to a man in the middle.`},{q:`sshUserPrivateKey gives the step…`,choix:[`the key in clear in the log`,`the path of a temporary key file`,`the public key only`,`nothing`],bonne:1,pourquoi:"`keyFileVariable`; even the path is masked in the log."},{q:`echo "$TOKEN" | rev in a pipeline prints…`,choix:[`****`,`the secret reversed, in clear`,`nothing`,`an error`],bonne:1,pourquoi:`Masking replaces exact values only.`},{q:`What happened to base64 of the secret in our lab?`,choix:[`Printed in clear`,`Masked by Jenkins (****Qo=)`,`Refused`,`Encrypted`],bonne:1,pourquoi:`Jenkins also masks the base64 form — a bonus, not a rule to rely on.`},{q:`A secret written to a file and archived is…`,choix:[`masked`,`readable by everyone who can read the job`,`deleted`,`encrypted`],bonne:1,pourquoi:"Our artifact contained `token=demo-leak-…`."},{q:`A job outside the folder team-stock asks for team-stock-token. Result?`,choix:[`It works`,`Could not find credentials entry`,`Access denied page`,`An empty variable`],bonne:1,pourquoi:`Folder stores are visible only to their jobs.`},{q:`A pipeline needs new java.io.File and is refused. Best answer?`,choix:[`Approve the signature`,`Do it in a shell step on an agent or a reviewed Shared Library`,`Disable the sandbox`,`Run it as admin`],bonne:1,pourquoi:`Approvals are global and would let every pipeline read the controller.`},{q:`Which permission lets someone run arbitrary commands with a job's credentials?`,choix:[`Overall/Read`,`Job/Configure`,`View/Read`,`Job/Discover`],bonne:1,pourquoi:`Configure changes what the job runs.`}]},{t:`checklist`,id:`m9`,items:[`I can choose kind, scope and store for a credential.`,`My SSH deployment uses a key credential and a pinned, verified host key.`,`My tokens belong to bot accounts with minimal scopes, and I know how to rotate them.`,`I found the leaks of leaky-pipeline and know why masking did not stop them.`,`Team credentials live in the team folder.`,`I denied the dangerous script approval and know who may use the Script Console.`,`I went through the hardening checklist for my controller.`]}];export{n as COMPOSE_WEB1,r as DEPLOY_WEB1,a as LEAKY_PIPELINE,c as MODULE9,c as default,i as SAFE_PIPELINE,s as SANDBOX_DEMO,o as USE_TEAM_TOKEN};