// Module 12 — Administration and operations. No new tool: the same controller, the same agents, the
// same registry and cluster as every module before it, operated rather than built. Two real labs — a node
// taken offline for maintenance with a real queue reacting to it, a real backup restored on a disposable
// second instance — plus real logs, a real plugin update with a real Safe Restart, real Prometheus numbers
// under load, and a real disk-space admin warning, deliberately triggered and then reverted.
import { LAB } from './plan.js'

export const JENKINSFILE_MAINTENANCE = `// lab/ops-maintenance-demo — Module 12, Lab 12.1: restricted to the real maintenance-pool label (ops-1).
pipeline {
    agent { label 'maintenance-pool' }
    stages {
        stage('Routine maintenance task') {
            steps {
                sh 'hostname && uptime && echo "ops-1 handled this build"'
            }
        }
    }
}
`

export const JENKINSFILE_BACKUP = `// lab/jenkins-backup — Module 12, Lab 12.2: a real backup of this controller's own JENKINS_HOME, taken
// from the controller itself (the built-in node temporarily has 1 executor for this one job, see the
// course text). Scoped on purpose: configuration, jobs, build history, users, credentials, nodes and the
// plugin list — never workspaces, archived artifacts or caches, which are reproducible and large.
pipeline {
    agent { label 'built-in' }
    stages {
        stage('Archive JENKINS_HOME (scoped)') {
            steps {
                sh '''
                    set -e
                    STAMP=$(date +%Y%m%d-%H%M%S)
                    mkdir -p "$JENKINS_HOME/backups"
                    tar czf "$JENKINS_HOME/backups/backup-$STAMP.tar.gz" -C "$JENKINS_HOME" \\
                        --exclude='backups' \\
                        --exclude='workspace' \\
                        --exclude='caches' \\
                        --exclude='war' \\
                        --exclude='*/builds/*/archive' \\
                        --exclude='plugins/*.jpi.disabled' \\
                        config.xml jobs users credentials.xml secrets nodes plugins identity.key.enc 2>/dev/null || true
                    echo "BACKUP_FILE=backups/backup-$STAMP.tar.gz"
                    ls -la "$JENKINS_HOME/backups/"
                    du -sh "$JENKINS_HOME/backups/backup-$STAMP.tar.gz"
                '''
            }
        }
    }
}
`

export const COMPOSE_OPS1 = `  ops-1:
    image: jenkins/ssh-agent:9.5.0-jdk21      # Module 12: its own SSH host for the maintenance-pool agent
    container_name: ops-1
    restart: unless-stopped
    environment:
      JENKINS_AGENT_SSH_PUBKEY: \${OPS_AGENT_PUBKEY}     # dedicated key, never web-1's (read from .env)
    volumes:
      - ops1_hostkeys:/etc/ssh                          # host keys persist across restarts: a stable fingerprint to pin

`

export const MODULE12 = [
  { t: 'objectives', items: [
    'Add a new agent node with labels, take it offline for maintenance, and read why a job queues instead of failing.',
    'Back up a controller\'s own state, scoped on purpose, and prove the restore on a disposable second instance — not just trust the backup job\'s exit code.',
    'Read the real Jenkins System Log, add a targeted log recorder, and know what a support bundle gives you when one is available.',
    'Update a plugin for real and understand what a Safe Restart actually waits for.',
    'Read real executor and queue metrics under real load, and tell a gauge from a histogram.',
    'Recognize a real disk-space admin warning for what it is, and revert it responsibly.',
  ] },
  { t: 'p', text: 'Prerequisite: Modules 2 (install), 8 (Kubernetes agents) and 10 (Prometheus/Grafana). This module adds exactly one new container — a second SSH agent — and otherwise operates the controller and agents already built, the way a real administrator would: nodes, backups, logs, plugins, performance, and the one admin warning every real instance eventually shows.' },

  { t: 'h', id: 'm12-1', text: '12.1 Operating Jenkins, not just building it' },
  { t: 'p', text: 'Every module so far added something: a tool, a pipeline, a connection. This one adds almost nothing and instead asks what happens to what already exists — when a node needs maintenance, when the controller itself needs restoring, when a plugin needs updating, when the disk starts running out. These are the questions that separate "it works today" from "it is operated".' },
  { t: 'diagram', id: 'm12-admin', caption: 'Two independent exercises on the same controller: a node toggled offline and back online while a label-restricted job queues then runs, and a backup tarball extracted into a fresh, empty instance before its first boot — verified through its real API, then torn down.' },

  { t: 'h', id: 'm12-2', text: '12.2 Lab 12.1 — a new agent, labels, and a real maintenance window' },
  { t: 'p', text: 'A second SSH agent, `ops-1`, joins the lab — its own container, its own dedicated credential, and critically its own named volume for `/etc/ssh`. That last detail matters: a plain SSH-agent container with no volume regenerates a brand-new host key on every restart, which silently breaks Jenkins\' pinned verification of it. Give it a volume and the host key — and therefore Jenkins\' trust in it — survives a restart.' },
  { t: 'code', lang: 'yaml', file: 'jenkins-lab/docker-compose.yml — the new service', code: COMPOSE_OPS1, lignes: [
    [5, 'A dedicated public key, read from `.env` — never the one Module 9 gave `web-1`.'],
    [7, 'The one line that makes the difference: without it, a restart gives `ops-1` a new identity and breaks the pin below.'],
  ] },
  { t: 'p', text: 'Registering it is exactly Module 9\'s process, repeated for a second host: a dedicated credential (`ops-agent`, a private key never shared with `web-1`\'s), a node with label `maintenance-pool` and `linux`, and the real host key fingerprint compared before it is pinned — never accepted blindly.' },
  { t: 'cmd', where: 'Host key, fetched and fingerprinted before Jenkins ever uses it', cmd: '', out: `$ docker exec agent-1 ssh-keyscan -t ed25519 ops-1
# ops-1:22 SSH-2.0-OpenSSH_10.0p2 Debian-7+deb13u4
ops-1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPGjHYG8UUtawRnGPJT8EbEoMiWh4hFz+cS59COjk7ZS

$ docker exec agent-1 ssh-keyscan -t ed25519 ops-1 | ssh-keygen -lf -
256 SHA256:53gl1ldC3Js+TEh1Tj+9nBT7zwR6PQlGftT5ehvB6dY ops-1 (ED25519)` },
  { t: 'shot', id: 'm12-01-ssh-credential-ops', titre: 'A second credential, never reused from Module 9', ce: 'A dedicated identity for ops-1, not a copy of web-1\'s.', éléments: ['ID: ops-agent (not web-1-deploy)', 'Username on the target: jenkins', 'Private key: entered directly', 'The private key (hidden by the course)'], actions: ['Compare the ID here with the Jenkinsfile below: `agent { label \'maintenance-pool\' }` never names a credential directly — the node configuration does that.'], résultat: 'Two agents, two independent keys: revoking one never touches the other.' },
  { t: 'cmd', where: 'Agent log → ops-1 connects for the first time (real text, excerpt)', cmd: '', out: `[11/22/26 18:53:28] [SSH] Opening SSH connection to ops-1:22.
[11/22/26 18:53:28] [SSH] SSH host key matched the key required for this connection. Connection will be allowed.
[11/22/26 18:53:28] [SSH] Authentication successful.
Agent successfully connected and online` },
  { t: 'p', text: 'A small Pipeline restricted to the new label is the whole point of having it:' },
  { t: 'code', lang: 'groovy', file: 'ops-maintenance-demo/Jenkinsfile', code: JENKINSFILE_MAINTENANCE, lignes: [
    [3, 'No node name anywhere — only the label. Jenkins decides which real agent matches.'],
  ] },
  { t: 'p', text: 'With `ops-1` marked **temporarily offline** (a real reason, not a blank field) and the job triggered again, Jenkins does not fail the build — it queues it, and says exactly why:' },
  { t: 'cmd', where: 'Queue API, while ops-1 is offline (real JSON)', cmd: '', out: `{
  "_class" : "hudson.model.Queue",
  "discoverableItems" : [
    
  ],
  "items" : [
    {
      "_class" : "hudson.model.Queue$BuildableItem",
      "actions" : [
        
      ],
      "blocked" : false,
      "buildable" : true,
      "id" : 409,
      "inQueueSince" : 1794980442838,
      "params" : "",
      "stuck" : true,
      "task" : {
        "_class" : "org.jenkinsci.plugins.workflow.support.steps.ExecutorStepExecution$PlaceholderTask"
      },
      "url" : "queue/item/409/",
      "why" : "‘ops-1’ is offline",
      "buildableStartMilliseconds" : 1794980442839,
      "pending" : false
    }
  ]
}` },
  { t: 'shot', id: 'm12-01-ops1-offline', titre: 'ops-1, taken offline on purpose', ce: 'A real reason a real administrator would actually write.', éléments: ['ops-1 is offline', 'The real reason given when taking it offline', 'The same action, now offered in reverse'], actions: ['Hover the icon to read the reason without opening the node page.'], résultat: 'Anyone checking this node later sees why it was taken down, not just that it was.' },
  { t: 'p', text: 'Bringing it back online lets the same queued build run — the console shows both moments in the one history entry: the wait, and then the real work.' },
  { t: 'cmd', where: 'ops-maintenance-demo #2 → Console Output (real text, excerpt)', cmd: '', out: `Started by user Lab Admin
Still waiting to schedule task
‘ops-1’ is offline
Running on ops-1 in /home/jenkins/workspace/ops-maintenance-demo
+ hostname
4ae8d96af529
+ uptime
 05:41:36 up  1:26,  0 users,  load average: 0.66, 0.71, 0.62
+ echo ops-1 handled this build
ops-1 handled this build
[Gitea] do not publish assets due to source being no GiteaSCMSource
Finished: SUCCESS` },
  { t: 'shot', id: 'm12-02-build-after-online', titre: 'The queued build, once ops-1 is back', ce: 'Nothing was lost by taking the node offline — the build waited, it did not fail.', éléments: ['Build #2 — the one that was queued while ops-1 was offline', 'It completed successfully, once ops-1 came back'], actions: ['Open the build\'s console: the two real lines above are right there, in order.'], résultat: 'A maintenance window with zero failed builds — only one that waited.' },
  { t: 'callout', kind: 'why', text: 'A later rebuild of this exact lab environment restarted every container. `ops-1` came back as a genuinely new container — a different hostname in its own console output, `5ae3930b5a84` instead of the original `4ae8d96af529` — yet Jenkins still trusted it immediately, with no re-pinning needed, and the next build (#5) ran exactly like the first. That is the entire reason for giving it its own volume: the container is disposable, the host key underneath it is not.' },

  { t: 'h', id: 'm12-3', text: '12.3 Lab 12.2 — back it up, then prove the restore' },
  { t: 'p', text: 'A backup job that only checks its own exit code proves nothing. The real test is whether the tarball it produces can rebuild a working Jenkins somewhere else — so this lab does exactly that, on a disposable second instance, every time.' },
  { t: 'code', lang: 'groovy', file: 'jenkins-backup/Jenkinsfile', code: JENKINSFILE_BACKUP, lignes: [
    [6, 'Runs on the controller itself — `JENKINS_HOME` is a path on this machine, not something an SSH agent can reach.'],
    [14, 'Scoped on purpose: config, jobs, build history, users, credentials, nodes, the plugin list. Never `workspace`, `caches` or `war` — reproducible, and often the biggest part of `JENKINS_HOME` by far.'],
  ] },
  { t: 'cmd', where: 'jenkins-backup #1 → Console Output (real text, excerpt)', cmd: '', out: `Started by user Lab Admin
Running on Jenkins in /var/jenkins_home/workspace/jenkins-backup
+ set -e
+ date +%Y%m%d-%H%M%S
+ STAMP=20261118-054407
+ mkdir -p /var/jenkins_home/backups
+ tar czf /var/jenkins_home/backups/backup-20261118-054407.tar.gz -C /var/jenkins_home --exclude=backups --exclude=workspace --exclude=caches --exclude=war --exclude=*/builds/*/archive --exclude=plugins/*.jpi.disabled config.xml jobs users credentials.xml secrets nodes plugins identity.key.enc
+ echo BACKUP_FILE=backups/backup-20261118-054407.tar.gz
BACKUP_FILE=backups/backup-20261118-054407.tar.gz
+ ls -la /var/jenkins_home/backups/
total 302664
drwxr-xr-x  2 jenkins jenkins      4096 Nov 18 05:44 .
drwxr-xr-x 19 jenkins jenkins     12288 Nov 18 05:44 ..
-rw-r--r--  1 jenkins jenkins 309910671 Nov 18 05:44 backup-20261118-054407.tar.gz
+ du -sh /var/jenkins_home/backups/backup-20261118-054407.tar.gz
296M	/var/jenkins_home/backups/backup-20261118-054407.tar.gz
[Gitea] do not publish assets due to source being no GiteaSCMSource
Finished: SUCCESS`, note: 'The real scoped tarball: 296 MB — config, jobs and build history for every module\'s lab, without a single workspace or build cache.' },
  { t: 'p', text: 'The restore itself is a real, disposable Jenkins: a fresh named volume, the same already-cached image, the backup extracted into that volume **before** the container\'s first boot — the standard order for a real disaster-recovery drill — then started and checked through its own API, not just eyeballed.' },
  { t: 'cmd', where: 'A second, throwaway instance on :8082 (real commands and results)', cmd: '', out: `$ docker volume create jenkins_restore_home
jenkins_restore_home

$ docker run --rm -v jenkins_restore_home:/var/jenkins_home -v $(pwd)/m12:/backup:ro \\
    jenkins/jenkins:2.580.2-lts-jdk21 bash -c "tar xzf /backup/backup-jenkins.tar.gz -C /var/jenkins_home && chown -R 1000:1000 /var/jenkins_home"
EXTRACTION_OK

$ docker run -d --name jenkins-restore -p 8082:8080 -v jenkins_restore_home:/var/jenkins_home jenkins/jenkins:2.580.2-lts-jdk21
(container starts; "Jenkins is fully up and running" within ~10s, same image already cached — no pull)

$ curl -u admin:$TOKEN http://localhost:8082/api/json   (same admin token as the primary instance — the restored credentials.xml/secrets decrypt it)
jobs: 38 real jobs present, identical names/colors to the primary instance (ansible-adhoc, build-report, stock-api, stock-service, team-stock folder, jenkins-backup, ops-maintenance-demo, ...)

$ curl -u admin:$TOKEN http://localhost:8082/computer/api/json | ... displayName of each
['Built-In Node', 'agent-1', 'ops-1']

$ curl -u admin:$TOKEN http://localhost:8082/job/stock-api-e2e/lastBuild/api/json
number: 3  result: SUCCESS

$ curl -u admin:$TOKEN http://localhost:8082/job/stock-api-e2e/3/consoleText | tail -5
[Pipeline] }
[Pipeline] // node
[Pipeline] End of Pipeline
[Gitea] do not publish assets due to source being no GiteaSCMSource
Finished: SUCCESS

$ curl -u admin:$TOKEN "http://localhost:8082/pluginManager/api/json?depth=1"   -> 113 plugins restored` },
  { t: 'shot', id: 'm12-03-restore-dashboard', titre: 'localhost:8082 — restored, not rebuilt', ce: 'Every job, every node, every plugin — read back from the tarball, not retyped.', éléments: ['A real job, restored — same name, same build history as the primary Jenkins', 'ops-1 trying to reconnect here too — both instances share the same lab network, a side-effect of testing in place, not a restore flaw'], actions: ['Open any restored job\'s last build and read its console: Module 11\'s real history is all still there.'], résultat: '38 jobs, 3 nodes, 113 plugins, and at least one build\'s full console text — all confirmed through the restored instance\'s own REST API.' },
  { t: 'callout', kind: 'tip', text: 'The restored instance tried to reconnect to `ops-1` and `agent-1` the moment it booted — because its restored `nodes/` configuration points at the same hostnames, which really are reachable on the same Docker network as the primary Jenkins. On an isolated recovery host this would simply not happen; here, it is a visible reminder that a config-level restore brings back *intent* ("connect to ops-1"), not a guarantee that the thing it names still means the same thing. The throwaway instance was torn down once every check above passed — `docker rm -f jenkins-restore && docker volume rm jenkins_restore_home` — exactly so this lab is left as it was found.' },

  { t: 'h', id: 'm12-4', text: '12.4 Reading what Jenkins already logs' },
  { t: 'p', text: 'The default System Log is too coarse to catch most things. A log recorder narrows the real Jenkins logging framework to one class, at one level, without restarting anything.' },
  { t: 'cmd', where: 'Log recorder "run-lifecycle", logger hudson.model.Queue at FINE (real text, excerpt)', cmd: '', out: `Nov 18, 2026 5:56:26 AM FINE hudson.model.Queueorg.jenkinsci.plugins.workflow.job.WorkflowJob@1ec6a097[log-demo] added to queue
Nov 18, 2026 5:56:32 AM FINE hudson.model.QueueExecutorStepExecution.PlaceholderTask{label=ops-1,context=CpsStepContext[3:node]:log-demo#1} added to queue` },
  { t: 'shot', id: 'm12-04-log-recorder', titre: 'A log recorder scoped to one real question', ce: 'When exactly does a build enter the queue — not everything Jenkins ever logs.', éléments: ['Real FINE-level entries — never shown in the default Jenkins log', 'The exact moment a real job entered the queue'], actions: ['Trigger any build while this page is open: a new line appears within the same second.'], résultat: 'A precise, disposable lens on one real class — removed again once the question is answered.' },
  { t: 'p', text: 'A real support bundle (System Information → Support Bundle) packages far more: thread dumps, the plugin list, node configurations, recent logs, all in one zip a vendor or a teammate can read without this exact instance. It needs the `support-core` plugin, which is not installed in this lab and cannot be, offline. The System Information page alone still gives real, useful facts:' },
  { t: 'cmd', where: 'Manage Jenkins → System Information (real values, excerpt)', cmd: '', out: `$ Manage Jenkins -> System Information -> Show values (support-core plugin not installed in this lab, no internet to add it)

JENKINS_HOME=/var/jenkins_home
JAVA_HOME=/opt/java/openjdk
java.vm.name = OpenJDK 64-Bit Server VM
java.vm.vendor = Eclipse Adoptium
java.vm.version = 21.0.13+9-LTS` },
  { t: 'shot', id: 'm12-05-system-info', titre: 'System Information, the fallback this lab actually has', ce: 'JENKINS_HOME, the JVM, the OS — read from the real running controller.', éléments: ['The real JENKINS_HOME path'], actions: ['Compare it with the backup Jenkinsfile above: it tars exactly this path.'], résultat: 'Not a support bundle — but still real facts about this real instance, with no plugin required.' },
  { t: 'callout', kind: 'warning', title: 'Not run in this lab', text: 'Generating an actual support bundle needs the support-core plugin, which this offline lab cannot install (no reachable internet beyond the pinned update center already in use). The mechanism is otherwise simple: install the plugin, then Manage Jenkins → System Information → Generate Bundle — a zip appears, no restart required.' },

  { t: 'h', id: 'm12-5', text: '12.5 A real plugin update, and a real Safe Restart' },
  { t: 'p', text: 'The real Update Center for this instance reported an update for the Coverage plugin — the exact plugin Module 6\'s JaCoCo reports already depend on.' },
  { t: 'cmd', where: 'Plugin Manager, before and after (real text)', cmd: '', out: `$ curl -u admin:$TOKEN "http://localhost:8080/pluginManager/api/json?depth=1" | jq .plugins[]|select(.shortName=="coverage")
BEFORE: version 4.3583.v1a_a_ee48b_1b_dd, hasUpdate: true

$ (checked "Coverage", clicked Update -> real download)
docker logs jenkins: "Starting the installation of coverage on behalf of admin" / "Downloading coverage"
Coverage.jpi on disk: 600082 bytes, mtime refreshed; coverage.bak = the previous .jpi, kept automatically
UI: "Coverage  Downloaded Successfully. Will be activated during the next boot"

$ (clicked "Restart Jenkins when installation is complete and no jobs are running")
UI: "Jenkins is restarting ... Safe Restart. Builds on agents can usually continue."
(5 x 503 while restarting, then 200 on /login — ~15s)

$ curl -u admin:$TOKEN "http://localhost:8080/pluginManager/api/json?depth=1" (after restart)
AFTER: version 4.3620.v407ef5b_88f0d, hasUpdate: false

$ curl -u admin:$TOKEN http://localhost:8080/computer/api/json (after restart)
[('Built-In Node', offline=False), ('agent-1', offline=False), ('ops-1', offline=False)]` },
  { t: 'shot', id: 'm12-06-plugin-update-available', titre: 'A real update, not a staged one', ce: 'The Update Center genuinely reported a newer Coverage plugin for this exact instance.', éléments: ['A real available update: the Coverage plugin (JaCoCo reports, Module 6)', 'Installed version', 'The newer version the real Update Center just reported'], actions: ['Check the box, click Download now and restart.'], résultat: 'A plugin this course already depends on, kept current.' },
  { t: 'shot', id: 'm12-07-plugin-installed-restart', titre: 'Safe Restart, mid-flight', ce: 'What "safe" means here, not just the label.', éléments: ['The download is complete', 'Safe Restart: waits for the installation and any running job before restarting'], actions: ['Tick "Restart Jenkins when installation is complete and no jobs are running" instead of restarting by hand.'], résultat: 'The real version changed from 4.3583.v1a_a_ee48b_1b_dd to 4.3620.v407ef5b_88f0d, and every node — Built-In Node, agent-1 and ops-1 — reconnected on its own once Jenkins was back.' },
  { t: 'callout', kind: 'why', text: 'Safe Restart is not "restart carefully" — it is "wait for a real condition, then restart". Agents disconnect only once the current queue is clear, and reconnect automatically afterward: nothing here needed a manual click to come back online.' },

  { t: 'h', id: 'm12-6', text: '12.6 Performance: real numbers, not a guess' },
  { t: 'p', text: 'Module 10 already wired Prometheus to this controller. Reusing it under a deliberate, real load answers a question no dashboard answers by itself: is this instance actually saturated right now, or was it a moment ago?' },
  { t: 'cmd', where: 'agent-1 reduced to 1 executor, 3 builds triggered at once (real text)', cmd: '', out: `$ curl -u admin:$TOKEN http://localhost:8080/queue/api/json   (2 extra builds triggered while agent-1 has 1 executor)
items: 2, each why: "Waiting for next available executor on \\x27agent-1\\x27"

$ curl http://localhost:8080/prometheus/ | grep default_jenkins_executors_busy
default_jenkins_executors_busy{label="agent-1"} 1.0     <- the one executor, genuinely saturated

$ curl http://localhost:8080/prometheus/ | grep jenkins_queue_size_history
jenkins_queue_size_history{quantile="0.95"} 1.0
jenkins_queue_size_history{quantile="0.98"} 1.0
(the instantaneous jenkins_queue_size_value gauge had already drained back to 0 by the time this was polled;
 the histogram still remembers the real spike — a gauge only tells you "now", a histogram remembers recent peaks)` },
  { t: 'callout', kind: 'why', text: 'A gauge like `jenkins_queue_size_value` only ever answers "how many right now" — poll it a few seconds after the spike has drained and it genuinely says zero, correctly. `jenkins_queue_size_history`\'s quantiles are a short rolling window of recent samples, so they still showed `1.0` after the same drain — real proof that two very different-looking real numbers were never in conflict, just answering different questions.' },

  { t: 'h', id: 'm12-7', text: '12.7 Troubleshooting: a real disk-space warning, deliberately provoked' },
  { t: 'p', text: 'Jenkins\' own disk-space monitor does not wait for the disk to actually fill up — it compares real free space against a configurable threshold, and acts the moment the threshold is wrong for the machine it is on.' },
  { t: 'cmd', where: 'Built-In Node → Disk Space Monitoring, threshold raised past real free space', cmd: '', out: `$ Manage Jenkins -> Nodes -> Built-In Node -> Configure -> Disk Space Monitoring -> Free Space Threshold: 1GiB -> 10GiB (real free space: 7.23 GiB)

$ curl -u admin:$TOKEN "http://localhost:8080/computer/(built-in)/api/json"
offline: true
offlineCauseReason: "Disk space is below threshold of 10.00 GiB. Only 7.23 GiB out of 251.97 GiB left on /var/jenkins_home."

(the built-in node already ran 0 executors in this lab, so this had zero effect on real builds — agent-1 and ops-1 were untouched)` },
  { t: 'shot', id: 'm12-09-disk-space-offline', titre: 'A genuine admin warning, not a mock-up', ce: 'Jenkins comparing a real number against a configured one, and acting on it.', éléments: ['The real, exact reason Jenkins itself took this node offline'], actions: ['Read the two numbers in the message: 10.00 GiB required, 7.23 GiB actually free.'], résultat: 'Proof the monitor reads real disk state, not a cached guess — reverted immediately after, back to a threshold the real machine can satisfy.' },
  { t: 'errors', rows: [
    ['An SSH agent reconnects fine today, then fails host-key verification after the next restart', 'Its container has no persistent volume for `/etc/ssh`: a restart regenerates a brand-new host key, which no longer matches the one Jenkins pinned.', 'Mount a named volume at `/etc/ssh` for that container, the way `ops-1` does, so the host key — and Jenkins\' trust in it — survives a restart.'],
    ['A restored instance tries to connect to agents it should not know about yet', 'The restored `nodes/` configuration names real hosts that happen to still be reachable on the same network as the test.', 'Expected on a shared lab network, not a restore bug; on an isolated recovery host the same nodes would simply stay offline until reconnected on purpose.'],
    ['"Generate Support Bundle" is missing from System Information', 'The `support-core` plugin is not installed, and this instance has no path to install it.', 'Install `support-core` from a reachable update center; until then, System Information alone still gives JENKINS_HOME, JVM and OS facts.'],
    ['A Safe Restart seems to hang', 'It is genuinely waiting — for the current plugin installation and for any running build to finish — not stuck.', 'Check the queue and running builds before assuming a problem; a busy controller can make "no jobs are running" take a while to become true.'],
    ['A node goes offline right after changing its disk-space threshold, with no disk activity at all', 'The new threshold is simply higher than this real machine\'s real free space — the monitor is working correctly.', 'Set the threshold to a value the real disk can actually satisfy, or free real space; do not disable the monitor just to silence it.'],
  ] },

  { t: 'h', id: 'm12-8', text: '12.8 Hands-on labs' },
  { t: 'lab', id: 'lab121', titre: 'Lab 12.1 — a new agent, labels, and a real maintenance window', durée: '30 min', objectif: 'Add a genuinely new SSH agent with its own volume, and watch a build queue — not fail — while it is offline.', étapes: [
    { t: 'p', text: '**1.** Add a new SSH-agent service to the compose file, with its own dedicated public key and its own named volume mounted at `/etc/ssh`.' },
    { t: 'p', text: '**2.** Register it as a node with a real label (not `linux` alone), using a brand-new credential — never an existing one.' },
    { t: 'p', text: '**3.** Compare its real host-key fingerprint before pinning it; create a small Pipeline restricted to the new label.' },
    { t: 'p', text: '**4.** Mark the node temporarily offline with a real reason; trigger the job and read why it queues; bring the node back online.' },
  ], solution: [
    { t: 'ul', items: ['Step 1: no volume means a fresh host key on every restart — the exact bug this lab builds around.', 'Step 4: the queue\'s own `why` field names the node directly ("‘ops-1’ is offline") — never a generic failure.'] },
  ] },
  { t: 'lab', id: 'lab122', titre: 'Lab 12.2 — back it up, then prove the restore', durée: '35 min', objectif: 'A backup that is only trusted once a second, disposable instance has actually booted from it.', étapes: [
    { t: 'p', text: '**1.** Write a Pipeline, run on the controller itself, that tars a deliberately scoped subset of `JENKINS_HOME` (not everything).' },
    { t: 'p', text: '**2.** Create a fresh named volume and extract that tarball into it **before** starting a new container on it.' },
    { t: 'p', text: '**3.** Start the new instance on a different port, using the same already-cached image.' },
    { t: 'p', text: '**4.** Verify the restore through its REST API — job list, node list, at least one build\'s console text, plugin count — not just that it booted.' },
    { t: 'p', text: '**5.** Tear the throwaway instance and its volume down once every check passes.' },
  ], solution: [
    { t: 'ul', items: ['Step 1: excluding workspaces, caches and war keeps a real backup two orders of magnitude smaller than a blind `tar` of the whole directory.', 'Step 4: "it started" proves nothing by itself — the job/node/plugin counts and a real console readback are the actual proof.'] },
  ] },
  { t: 'exercise', id: 'ex121', titre: 'Exercise — four short administrative checks', énoncé: [
    { t: 'p', text: 'On your own instance, do each of the following and write down the one real line of evidence that proves it:' },
    { t: 'ul', items: [
      'Logs: add a log recorder for a class relevant to something you want to observe, trigger it, and capture the real line it produces.',
      'Plugins: find one real plugin with an available update, update it, and confirm through the API that the version actually changed.',
      'Performance: drop one agent to 1 executor, queue up more builds than it can run at once, and read the real reason on the queued items.',
      'Disk space: read your node\'s real free space, set its threshold just above that number, and capture the real warning it produces.',
    ] },
  ], solution: [
    { t: 'ul', items: [
      'Logs: add a log recorder for a class relevant to something you want to observe, trigger the action, read the real FINE-level line it produces, then delete the recorder again.',
      'Plugins: find one real plugin with an available update in your own instance, update it, and confirm through the API that its version actually changed before trusting the UI alone.',
      'Performance: drop one agent to 1 executor, queue up more builds than it can run at once, and read the real `why` on the queued items before raising the executor count back.',
      'Disk space: read your own node\'s current free space first, then set its threshold a little above that real number on purpose, confirm the real warning, and revert the threshold immediately.',
    ] },
  ] },

  { t: 'recap', items: [
    'An SSH agent with no persistent volume for `/etc/ssh` gets a new host key on every restart — pin the key to a container, give the key itself a volume.',
    'A job restricted to a label that is temporarily offline queues, with a real, readable reason — it does not fail.',
    'A backup is only as good as a restore that was actually tried: a disposable second instance, started from the tarball, checked through its real API.',
    'A restored instance can try to reach real hosts its config still names — a property of restoring configuration, not a flaw in the restore.',
    'A log recorder narrows real, already-running logging to one class at one level, with no restart — a support bundle needs its own plugin, and this lab shows the honest fallback when that plugin is not installed.',
    'Safe Restart waits for a real condition — the current install, and any running build — before it actually restarts; agents reconnect on their own afterward.',
    'A metrics gauge answers "right now"; a histogram\'s quantiles remember a recent window — the same real spike can look different in each, correctly.',
    'Jenkins\' disk-space monitor compares real free space against a configured threshold and acts immediately when the threshold stops fitting the machine — reverting a bad threshold is as real an admin action as setting one.',
  ] },
  { t: 'quiz', id: 'quiz12', questions: [
    { q: 'ops-1 connects fine today but fails host-key verification after a restart. Most likely cause?', choix: ['Jenkins forgot the pin', 'The container has no volume for /etc/ssh, so it generated a new host key', 'The network changed', 'The credential expired'], bonne: 1, pourquoi: 'No persisted host key means a fresh one every restart — the exact mechanism this module builds ops-1 around.' },
    { q: 'A job restricted to a label whose only node is temporarily offline. What happens when it is triggered?', choix: ['It fails immediately', 'It queues, with a reason naming the offline node', 'It silently runs somewhere else', 'Jenkins refuses to accept the trigger'], bonne: 1, pourquoi: 'The real queue API showed exactly this — "why" naming the node, not a generic failure.' },
    { q: 'Why does the backup Jenkinsfile run on the controller itself rather than an agent?', choix: ['Controllers are faster', 'JENKINS_HOME is a path on the controller\'s own filesystem, not something a remote agent can read', 'Style preference', 'Agents cannot run sh steps'], bonne: 1, pourquoi: 'The thing being backed up only exists on the controller.' },
    { q: 'What makes a backup "proven" rather than merely "taken"?', choix: ['The tarball exists and the job exited 0', 'A separate instance was actually started from it and checked through its real API', 'The file is large', 'A person eyeballed the file list'], bonne: 1, pourquoi: 'This lab\'s whole second half is exactly that proof.' },
    { q: 'The restored instance tries to reconnect to agents it was not told to use yet. Why?', choix: ['The restore is broken', 'Its restored node configuration names real hosts still reachable on the same network', 'Jenkins always does this on any boot', 'A plugin bug'], bonne: 1, pourquoi: 'A config-level restore brings back intent, which can point at things still real and reachable in a shared lab network.' },
    { q: 'A log recorder set to FINE on hudson.model.Queue shows a line the default System Log never would. Why use a recorder instead of just raising the global log level?', choix: ['Recorders are faster', 'A recorder narrows the extra verbosity to one class, instead of flooding every log with FINE output', 'The global level cannot be changed', 'Recorders do not require a restart, global levels do'], bonne: 1, pourquoi: 'Scoping to one class is the whole value of a recorder.' },
    { q: 'Why could this lab not generate a real support bundle?', choix: ['Jenkins does not support them', 'The support-core plugin is not installed and cannot be reached offline', 'Support bundles need a restart', 'They are deprecated'], bonne: 1, pourquoi: 'Documented honestly rather than faked — same rule as every other module.' },
    { q: '"Safe Restart" is selected after a plugin install. What does it actually wait for?', choix: ['Nothing, it restarts immediately', 'The installation to finish and any currently running job to complete', 'A fixed 5-minute timer', 'Manual confirmation from every connected agent'], bonne: 1, pourquoi: 'Confirmed by the real log: "Builds on agents can usually continue."' },
    { q: 'jenkins_queue_size_value reads 0 right after a real queue spike that just drained. Is the metric lying?', choix: ['Yes, it is broken', 'No — a gauge only ever reports the current instant; the histogram\'s quantiles are what remember the recent spike', 'Yes, Prometheus caches stale zeros', 'No, but only agent-1 is affected'], bonne: 1, pourquoi: 'Two metric types answering two different questions, both correctly.' },
    { q: 'Raising a node\'s disk-space threshold above its real free space does what?', choix: ['Nothing until the disk actually fills up', 'Jenkins immediately takes the node offline with the real numbers in the reason', 'It only logs a warning, node stays online', 'It deletes old builds automatically'], bonne: 1, pourquoi: 'Real evidence in this module: offline: true the moment the threshold stopped fitting the real free space.' },
  ] },
  { t: 'checklist', id: 'm12', items: [
    'I added a real second agent with its own volume, and can explain why that volume specifically matters.',
    'I took a node offline with a real reason and watched a restricted job queue instead of fail.',
    'I wrote a deliberately scoped backup, and proved it by actually restoring it on a disposable instance.',
    'I know why a restored instance can try to reach hosts it was not explicitly told about.',
    'I added and removed a real log recorder, and know when a support bundle needs a plugin I might not have.',
    'I updated a real plugin and watched a Safe Restart wait for the right condition before acting.',
    'I can read a Prometheus gauge and a histogram\'s quantiles without assuming they contradict each other.',
  ] },
]

export default MODULE12
