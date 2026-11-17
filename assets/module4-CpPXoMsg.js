var e=`// Jenkinsfile 1 — the skeleton of every Declarative pipeline
pipeline {
    agent { label 'linux' }                        // run on a node labelled "linux" (agent-1)

    options {
        timestamps()                               // time of each log line (Timestamper plugin)
        timeout(time: 10, unit: 'MINUTES')         // abort the whole run after 10 minutes
        buildDiscarder(logRotator(numToKeepStr: '10'))  // keep the last 10 builds
    }

    stages {
        stage('Build') {
            steps {
                echo "Building \${env.JOB_NAME} #\${env.BUILD_NUMBER} on \${env.NODE_NAME}"
                sh '''
                    mkdir -p dist
                    echo "app version 1.0.\${BUILD_NUMBER}" > dist/app.txt
                '''
            }
        }
        stage('Test') {
            steps {
                sh 'grep -q "app version" dist/app.txt && echo "test passed"'
            }
        }
        stage('Package') {
            steps {
                sh 'tar -czf app-1.0.\${BUILD_NUMBER}.tar.gz -C dist .'
                archiveArtifacts artifacts: '*.tar.gz', fingerprint: true
            }
        }
    }

    post {
        always  { echo "Result: \${currentBuild.currentResult}" }
        success { echo 'Package archived.' }
        failure { echo 'Something failed: read the first red stage.' }
        cleanup { cleanWs() }                      // empty the workspace at the very end
    }
}
`,t=`// Jenkinsfile 2 — variables: environment, credentials, Groovy and shell
pipeline {
    agent { label 'linux' }
    options { timestamps() }

    environment {
        APP_NAME  = 'inventory'                              // every stage: env.APP_NAME in Groovy, $APP_NAME in sh
        RUN_TAG   = "\${env.JOB_NAME}-\${env.BUILD_NUMBER}"    // computed once, when the pipeline starts
        API_TOKEN = credentials('report-api-token')          // a secret text credential, masked in the log
    }

    stages {
        stage('Groovy vs shell') {
            steps {
                echo "Groovy interpolation (double quotes): \${APP_NAME}, run \${RUN_TAG}"
                sh 'echo "Shell expansion (single quotes): $APP_NAME on $NODE_NAME"'
            }
        }
        stage('Compute a value') {
            steps {
                script {
                    def day = sh(script: 'date -u +%Y.%m.%d', returnStdout: true).trim()   // capture a command output
                    env.APP_VERSION = "\${day}-\${env.BUILD_NUMBER}"                       // visible in the next stages
                }
                echo "Version computed: \${env.APP_VERSION}"
            }
        }
        stage('Stage variables') {
            environment {
                TARGET = 'staging'                                // only inside this stage
            }
            steps {
                sh 'echo "Deploying $APP_NAME $APP_VERSION to $TARGET"'
            }
        }
        stage('Use the secret') {
            steps {
                sh 'echo "The token has \${#API_TOKEN} characters"'   // safe: the shell reads the secret
                sh "echo Token: \${API_TOKEN}"                         // unsafe: Groovy writes the secret into the command
            }
        }
    }
}
`,n=`// Jenkinsfile 3 — parameters, conditions (when) and a manual approval (input)
pipeline {
    agent { label 'linux' }
    options { timestamps() }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Where to deploy')
        string(name: 'VERSION', defaultValue: '1.0.0', trim: true, description: 'Version to deploy (x.y.z)')
        booleanParam(name: 'RUN_SMOKE_TESTS', defaultValue: true, description: 'Run the smoke tests after deploying')
    }

    stages {
        stage('Validate') {
            steps {
                script {
                    if (!params.VERSION.matches(/\\d+\\.\\d+\\.\\d+/)) {
                        error "VERSION must look like 1.2.3, got '\${params.VERSION}'"   // stops the build, red
                    }
                }
                echo "Request: deploy \${params.VERSION} to \${params.ENVIRONMENT}"
            }
        }
        stage('Approval') {
            when { expression { params.ENVIRONMENT == 'prod' } }                     // production only
            steps {
                input message: "Deploy \${params.VERSION} to production?", ok: 'Deploy', submitter: 'admin'
            }
        }
        stage('Deploy') {
            steps {
                sh 'echo "Deploying $VERSION to $ENVIRONMENT"'    // parameters are environment variables too
            }
        }
        stage('Smoke tests') {
            when { expression { params.RUN_SMOKE_TESTS } }
            steps {
                sh 'echo "Smoke tests against $ENVIRONMENT: OK"'
            }
        }
    }
}
`,r=`// Jenkinsfile 4 — parallel stages, retries, timeouts and error handling
pipeline {
    agent { label 'linux' }
    options { timestamps() }

    stages {
        stage('Checks') {
            parallel {                                             // the three stages run at the same time
                stage('Unit tests') {
                    steps { sh 'sleep 3; echo "unit tests: 42 passed"' }
                }
                stage('Lint') {
                    steps {
                        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {   // report, do not stop
                            sh 'echo "lint: 1 warning in src/app.js"; exit 1'
                        }
                    }
                }
                stage('Flaky service') {
                    steps {
                        retry(3) {                                 // up to 3 attempts
                            sh '''
                                count=$(cat .attempts 2>/dev/null || echo 0)
                                count=$((count + 1)); echo "$count" > .attempts
                                echo "attempt $count"
                                [ "$count" -ge 2 ]
                            '''
                        }
                    }
                }
            }
        }
        stage('Slow step') {
            steps {
                script {
                    try {
                        timeout(time: 5, unit: 'SECONDS') {        // abort the step after 5 seconds
                            sh 'sleep 30'
                        }
                    } catch (err) {
                        echo "Timeout reached: \${err}"
                        echo 'Continuing with a cached result instead.'
                    }
                }
            }
        }
        stage('Report') {
            steps {
                script {
                    try {
                        sh 'test -f report.txt'
                    } catch (err) {
                        echo "No report yet (\${err.getMessage()}): writing an empty one."
                        writeFile file: 'report.txt', text: 'empty\\n'
                    } finally {
                        echo 'finally: this always runs.'
                    }
                }
            }
        }
    }
    post {
        unstable { echo 'UNSTABLE: the Lint stage reported a problem.' }
        failure  { echo 'FAILURE.' }
        always   { echo "Final result: \${currentBuild.currentResult}"; cleanWs() }
    }
}
`,i=`// Jenkinsfile 5 — artifacts, stash/unstash and test reports
pipeline {
    agent none                                                     // each stage chooses its node
    options { timestamps() }

    stages {
        stage('Build') {
            agent { label 'linux' }
            steps {
                sh '''
                    mkdir -p build
                    echo "inventory 2.0.\${BUILD_NUMBER}" > build/app.txt
                    sha256sum build/app.txt > build/app.txt.sha256
                '''
                stash name: 'app', includes: 'build/**'            // keep these files for later stages
            }
        }
        stage('Test') {
            agent { label 'linux' }
            steps {
                unstash 'app'                                      // the files of the Build stage
                sh 'sha256sum -c build/app.txt.sha256'
                sh '''
                    mkdir -p test-results
                    cat > test-results/TEST-inventory.xml <<'XML'
<testsuite name="inventory.StockTest" tests="3" failures="1" errors="0" skipped="0" time="0.12">
  <testcase classname="inventory.StockTest" name="adds_items" time="0.03"/>
  <testcase classname="inventory.StockTest" name="removes_items" time="0.04"/>
  <testcase classname="inventory.StockTest" name="rejects_negative_stock" time="0.05">
    <failure message="expected IllegalArgumentException">java.lang.AssertionError: expected IllegalArgumentException</failure>
  </testcase>
</testsuite>
XML
                '''
            }
            post {
                always { junit 'test-results/*.xml' }              // publish the report: 1 failure = UNSTABLE
            }
        }
        stage('Publish') {
            agent { label 'linux' }
            steps {
                unstash 'app'
                archiveArtifacts artifacts: 'build/**', fingerprint: true
            }
        }
    }
}
`,a=`// Scripted pipeline — Jenkinsfile 1 written as Groovy code
node('linux') {                                        // take an executor on a "linux" node
    try {
        stage('Build') {
            echo "Building \${env.JOB_NAME} #\${env.BUILD_NUMBER} on \${env.NODE_NAME}"
            sh 'mkdir -p dist && echo "app version 1.0.\${BUILD_NUMBER}" > dist/app.txt'
        }
        stage('Test') {
            sh 'grep -q "app version" dist/app.txt && echo "test passed"'
        }
        stage('Package') {
            sh 'tar -czf app-1.0.\${BUILD_NUMBER}.tar.gz -C dist .'
            archiveArtifacts artifacts: '*.tar.gz', fingerprint: true
        }
        echo 'Package archived.'
    } catch (err) {
        echo "Something failed: \${err}"
        throw err                                      // rethrow: the build must stay red
    } finally {
        echo "Result: \${currentBuild.currentResult}"
        cleanWs()
    }
}
`,o=`pipeline {
    agent { label 'linux' }
    stages {
        stage('Build') {
            sh 'echo building'
        }
        stage('Test') {
            steps {
                echo 'testing'
            }
        }
    }
}
`,s=`pipeline {
    agent { label 'linux' }
    stages {
        stage('Build') {
            steps {
                echo "Building version \${params.VERSION"
            }
        }
    }
}
`,c=`pipeline {
    agent { label 'linux' }
    parameters {
        string(name: 'VERSION', defaultValue: '1.0.0', description: 'Version to build')
    }
    stages {
        stage('Build') {
            steps {
                sh 'echo building'
                echo "Building version \${params.VERSION}"
            }
        }
        stage('Test') {
            steps {
                echo 'testing'
            }
        }
    }
}
`,l=[{t:`objectives`,items:[`Explain what a **Pipeline** is and why "pipeline as code" replaced Freestyle jobs.`,`Tell **Declarative** and **Scripted** pipelines apart and read both.`,"Write a `Jenkinsfile` with **pipeline, agent, stages, stage, steps, post** and the main **options**.","Use **variables**: `env`, `environment {}`, `params`, Groovy variables, command outputs — and quote them correctly.",`Make stages conditional with **when**, ask for **parameters** and for a manual **input**.`,`Handle errors with **post**, **try/catch/finally**, **catchError**, **retry** and **timeout**.`,`Archive **artifacts**, pass files between stages with **stash**, publish **test reports**.`,`Use the tools around pipelines: Snippet Generator, Directive Generator, Replay, Restart from Stage.`]},{t:`p`,text:"Prerequisite: the lab of Module 3 (agent-1 with the label `linux`, the credential `report-api-token`). In this module the Jenkinsfiles are pasted in the job (*Pipeline script*); Module 5 reads them from Git. Each of the five Jenkinsfiles below was run on the lab controller and every output shown is the real one."},{t:`h`,id:`m4-1`,text:`4.1 What is a Pipeline?`},{t:`p`,text:"A **Pipeline** is a job whose whole process — checkout, build, test, deliver, deploy — is described **as code** in a file named `Jenkinsfile`. Compared with a Freestyle job configured with forms, a pipeline is versioned with the application, reviewed in pull requests, reusable and able to express what forms cannot: stages, parallel work, conditions, approvals, retries, several agents."},{t:`table`,head:[``,`Freestyle job (Module 3)`,`Pipeline job`],rows:[[`Definition`,"Web forms, stored in `config.xml`","`Jenkinsfile` (code), ideally in Git"],[`Review and history`,`Hard (Job Config History plugin at best)`,"Pull requests, `git log`, blame"],[`Stages and graph`,`No`,`Yes: stages, parallel branches, durations`],[`Survives a controller restart`,`No: the build is lost`,`Yes: pipelines are *durable* and resume`],[`Logic (conditions, loops, approvals)`,`Limited, through plugins`,"Built in: `when`, `input`, `retry`, `parallel`…"]]},{t:`callout`,kind:`info`,title:`Where the pipeline code runs`,text:'The Groovy logic of a pipeline runs **on the controller**, in a lightweight executor — that is why the stage graph says "*Took 9.9 sec on built-in*" even with 0 executors on the built-in node. The **steps** that do the work (`sh`, `archiveArtifacts`…) run on the **agent** chosen by `agent`/`node`. Keep heavy work in `sh` steps, not in Groovy.'},{t:`h`,id:`m4-2`,text:`4.2 Declarative or Scripted?`},{t:`table`,head:[``,`Declarative`,`Scripted`],rows:[[`Starts with`,"`pipeline { … }`","`node { … }`"],[`Style`,`A fixed structure of sections and directives`,`Groovy code with steps inside`],[`Validation`,`Checked before running: clear errors (section 4.9)`,`Errors appear while running`],[`Error handling`,"`post { }`, `catchError`, `when`","`try / catch / finally`"],[`Tooling`,`Directive Generator, Restart from Stage, graph`,`Snippet Generator`],[`Use it for`,`**New pipelines** — the recommended default`,`Complex logic, shared libraries, legacy jobs`]]},{t:`p`,text:`The same pipeline, written both ways. First the **Declarative** Jenkinsfile 1 (section 4.3); here its **Scripted** equivalent, run on the lab:`},{t:`code`,lang:`groovy`,file:`pipeline-scripted → Configure → Pipeline script`,code:a,lignes:[[2,"`node('linux')`: take an executor on a node labelled `linux` — the Scripted form of `agent`."],[3,"No `post` section: errors are handled with Groovy `try/catch/finally`."],[4,"`stage` only names a part of the run (for the graph); there is no `steps {}` block."],[16,"`catch`: runs when a step fails."],[18,"`throw err`: rethrow, otherwise the build would be green although a step failed."],[19,"`finally`: runs in every case — the equivalent of `post { always }`."]]},{t:`cmd`,where:`pipeline-scripted #1 → Console Output (real text, [Pipeline] lines removed)`,cmd:``,out:`Started by user Lab Admin
Running on agent-1 in /home/jenkins/agent/workspace/pipeline-scripted
Building pipeline-scripted #1 on agent-1
+ mkdir -p dist
+ echo app version 1.0.1
+ grep -q app version dist/app.txt
+ echo test passed
test passed
+ tar -czf app-1.0.1.tar.gz -C dist .
Archiving artifacts
Recording fingerprints
Package archived.
Result: SUCCESS
[WS-CLEANUP] Deleting project workspace...
[WS-CLEANUP] Deferred wipeout is used...
[WS-CLEANUP] done
Finished: SUCCESS`},{t:`h`,id:`m4-3`,text:`4.3 The structure of a Jenkinsfile`},{t:`diagram`,id:`m4-anatomie`,caption:`The sections of a Declarative pipeline and where they go. Only pipeline, agent, stages, stage and steps are mandatory.`},{t:`table`,head:[`Directive`,`Role`,`Mandatory?`],rows:[["`pipeline { }`",`The whole Declarative pipeline`,`Yes`],["`agent`","Where to run: `any`, `none`, `{ label 'linux' }`, `{ docker { … } }` (Module 7), `{ kubernetes { … } }` (Module 8)",`Yes (at the top or per stage)`],["`stages { }`",`The ordered list of stages`,`Yes`],["`stage('Name') { }`",`One phase, shown in the graph`,`At least one`],["`steps { }`","The steps of a stage: `sh`, `echo`, `archiveArtifacts`…","Yes, in each stage (or `parallel` / `stages`)"],["`post { }`",`Actions after the run or a stage, depending on the result`,`No`],["`options { }`","`timestamps()`, `timeout`, `buildDiscarder`, `retry`, `disableConcurrentBuilds()`…",`No`],["`environment { }`",`Environment variables (and credentials) for the pipeline or a stage`,`No`],["`parameters { }`",`Inputs of the build`,`No`],["`when { }`",`Condition to run a stage`,`No`],["`triggers { }`","`cron`, `pollSCM`, `upstream`",`No`]]},{t:`h3`,text:`Jenkinsfile 1 — the skeleton`},{t:`code`,lang:`groovy`,file:`pipeline-basics → Configure → Pipeline script`,code:e,lignes:[[2,"`pipeline { }`: a Declarative pipeline; everything is inside."],[3,"`agent { label 'linux' }`: run every stage on a node labelled `linux` — agent-1. (`agent any` would accept any node.)"],[6,"`timestamps()`: the time of each log line (Timestamper plugin)."],[7,"`timeout`: abort the whole run if it lasts more than 10 minutes — always set one, a stuck build blocks an executor."],[8,"`buildDiscarder`: keep the last 10 builds, like *Discard old builds* in Module 3."],[11,"`stages`: the ordered list of the phases."],[12,"`stage('Build')`: its name appears in the graph and the log."],[14,"`echo` with double quotes: Groovy replaces `${env.JOB_NAME}`… before printing."],[15,"`sh ''' … '''`: a multi-line shell script; single quotes, so **the shell** expands `${BUILD_NUMBER}` (line 17)."],[23,"A test: `grep -q` fails if the text is missing, which fails the stage and the build."],[29,"`archiveArtifacts`: copy the file to the controller and record its fingerprint."],[34,"`post`: runs after the stages, depending on the result."],[35,"`always`: in every case."],[36,"`success` / `failure` (next line): only for that result."],[38,"`cleanup`: the very last action, after all the others — here, empty the workspace with `cleanWs()`."]]},{t:`p`,text:"Create it: **New Item → `pipeline-basics` → Pipeline**, paste the script in the **Pipeline** section, **Save**, **Build Now**."},{t:`shot`,id:`m4-02-pipeline-config`,titre:`Pipeline job → Configure → Pipeline`,ce:`For a Pipeline job, the configuration is mostly the script.`,éléments:[`**Definition**: *Pipeline script* (typed here) or *Pipeline script from SCM* (read from Git, Module 5).`,`The editor, with syntax highlighting and checks.`,`**Use Groovy Sandbox**: keep it ticked — the script runs with restricted rights (Module 9).`,`**Pipeline Syntax**: the generators of section 4.8.`],actions:[`Paste Jenkinsfile 1, **Save**.`],résultat:`The job page opens.`},{t:`cmd`,where:`pipeline-basics #2 → Console Output (real text)`,cmd:``,out:`Started by user Lab Admin
[Pipeline] Start of Pipeline
[Pipeline] node
Running on agent-1 in /home/jenkins/agent/workspace/pipeline-basics
[Pipeline] {
[Pipeline] timestamps
[Pipeline] {
[Pipeline] timeout
[2026-11-17T13:14:36.503Z] Timeout set to expire in 10 min
[Pipeline] {
[Pipeline] stage
[Pipeline] { (Build)
[Pipeline] echo
[2026-11-17T13:14:36.562Z] Building pipeline-basics #2 on agent-1
[Pipeline] sh
[2026-11-17T13:14:36.872Z] + mkdir -p dist
[2026-11-17T13:14:36.872Z] + echo app version 1.0.2
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Test)
[Pipeline] sh
[2026-11-17T13:14:37.219Z] + grep -q app version dist/app.txt
[2026-11-17T13:14:37.219Z] + echo test passed
[2026-11-17T13:14:37.219Z] test passed
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Package)
[Pipeline] sh
[2026-11-17T13:14:37.562Z] + tar -czf app-1.0.2.tar.gz -C dist .
[Pipeline] archiveArtifacts
[2026-11-17T13:14:37.588Z] Archiving artifacts
[2026-11-17T13:14:37.595Z] Recording fingerprints
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Declarative: Post Actions)
[Pipeline] echo
[2026-11-17T13:14:37.642Z] Result: SUCCESS
[Pipeline] echo
[2026-11-17T13:14:37.657Z] Package archived.
[Pipeline] cleanWs
[2026-11-17T13:14:37.685Z] [WS-CLEANUP] Deleting project workspace...
[2026-11-17T13:14:37.685Z] [WS-CLEANUP] Deferred wipeout is used...
[2026-11-17T13:14:37.690Z] [WS-CLEANUP] done
[Pipeline] }
[Pipeline] // stage
[Pipeline] }
[Pipeline] // timeout
[Pipeline] }
[Pipeline] // timestamps
[Pipeline] }
[Pipeline] // node
[Pipeline] End of Pipeline
Finished: SUCCESS`,note:"`[Pipeline] …` lines are written by Jenkins for each step; `{ (Build)` opens a stage. `post` runs as a last stage named *Declarative: Post Actions*."},{t:`shot`,id:`m4-03-graph`,titre:`Build #2 → Stages`,ce:`The Pipeline Graph View plugin draws the stages with their result and duration; click one to see its steps and log.`,éléments:[`**Build** (0.35 s).`,`**Test**.`,`**Package**.`,"**Post Actions**: the `post { }` section."],actions:[`Open the build, click **Stages** (or *Pipeline Overview*), click each stage.`],résultat:`Four green stages.`},{t:`h`,id:`m4-4`,text:`4.4 Variables`},{t:`p`,text:"Pipelines mix two languages: **Groovy** (the Jenkinsfile) and the **shell** (inside `sh`). The quotes decide which one replaces `$VARIABLE`:"},{t:`table`,head:[`Written in the Jenkinsfile`,`Who expands the variable`,`Use it for`],rows:[['`"Hello ${env.APP_NAME}"` (double quotes)',`**Groovy**, before the step runs`,`Messages, step arguments built from Groovy values`],["`'echo $APP_NAME'` (single quotes)",`**The shell**, on the agent`,`Shell commands — and always for **secrets**`],[`\`'''…'''\` / \`"""…"""\``,`Same rule, on several lines`,`Multi-line scripts`]]},{t:`code`,lang:`groovy`,file:`pipeline-variables → Configure → Pipeline script`,code:t,lignes:[[6,"`environment { }` at the top: variables for every stage."],[7,"A constant: `env.APP_NAME` in Groovy, `$APP_NAME` in the shell."],[8,`Built from other variables; evaluated **once** when the pipeline starts.`],[9,"`credentials('report-api-token')`: the secret text of Module 3, injected and **masked**."],[15,`Groovy interpolation (double quotes).`],[16,"Shell expansion (single quotes): `$NODE_NAME` is set by Jenkins on the agent."],[21,"`script { }`: a block of Groovy code inside a Declarative stage."],[22,"`returnStdout: true`: get the output of the command as a string; `.trim()` removes the final newline."],[23,"Assign `env.X` to share a value with the next stages."],[29,"A stage-level `environment`: `TARGET` exists only in this stage."],[38,`**Right**: single quotes, the shell reads the secret from its environment.`],[39,`**Wrong**: double quotes, Groovy pastes the secret into the command line — Jenkins warns (screenshot below).`]]},{t:`cmd`,where:`pipeline-variables #1 → Console Output (real text, [Pipeline] lines removed)`,cmd:``,out:`Started by user Lab Admin
Running on agent-1 in /home/jenkins/agent/workspace/pipeline-variables
Masking supported pattern matches of $API_TOKEN
[2026-11-17T13:14:51.733Z] Groovy interpolation (double quotes): inventory, run pipeline-variables-1
[2026-11-17T13:14:52.333Z] + echo Shell expansion (single quotes): inventory on agent-1
[2026-11-17T13:14:52.333Z] Shell expansion (single quotes): inventory on agent-1
[2026-11-17T13:14:52.698Z] + date -u +%Y.%m.%d
[2026-11-17T13:14:52.762Z] Version computed: 2026.11.17-1
[2026-11-17T13:14:53.092Z] + echo Deploying inventory 2026.11.17-1 to staging
[2026-11-17T13:14:53.093Z] Deploying inventory 2026.11.17-1 to staging
[2026-11-17T13:14:53.429Z] + echo The token has 32 characters
[2026-11-17T13:14:53.429Z] The token has 32 characters
[2026-11-17T13:14:53.446Z] Warning: A secret was passed to "sh" using Groovy String interpolation, which is insecure.
[2026-11-17T13:14:53.446Z] 		 Affected argument(s) used the following variable(s): [API_TOKEN]
[2026-11-17T13:14:53.446Z] 		 See https://jenkins.io/redirect/groovy-string-interpolation for details.
[2026-11-17T13:14:53.722Z] + echo Token: ****
[2026-11-17T13:14:53.722Z] Token: ****
Finished: SUCCESS`},{t:`shot`,id:`m4-16-groovy-warning`,titre:`The warning about Groovy interpolation of a secret`,ce:`The log is masked in both cases, but the second command carried the secret in clear in its command line: other processes of the agent could read it.`,éléments:[`Single quotes: the shell reads the secret — **safe**.`,`*Warning: A secret was passed to "sh" using Groovy String interpolation, which is insecure.*`,`Masked in the log anyway — masking does not make line 39 safe.`],actions:["Change line 39 to single quotes: `sh 'echo Token: $API_TOKEN'` — the warning disappears."],résultat:`You know the most common secret mistake in Jenkinsfiles.`},{t:`shot`,id:`m4-06-globals`,titre:`Pipeline Syntax → Global Variables Reference`,ce:`The documentation of the variables available in every pipeline, generated by your own controller (it depends on your plugins).`,éléments:["**env**: environment variables (`env.BUILD_NUMBER`, `env.NODE_NAME`…). The page also documents **params** (the parameters) and **currentBuild** (`currentBuild.result`, `currentBuild.currentResult`, `currentBuild.number`…)."],actions:[`Open **Pipeline Syntax → Global Variables Reference** from any pipeline job.`],résultat:`You can check a variable without searching the web.`},{t:`h`,id:`m4-5`,text:`4.5 Parameters, when and input`},{t:`code`,lang:`groovy`,file:`pipeline-parameters → Configure → Pipeline script`,code:n,lignes:[[6,"`parameters { }`: declared in the code, not in the job form."],[7,`A choice; the first value is the default.`],[8,"A string with a default value; `trim: true` removes spaces."],[9,`A boolean.`],[16,"Validate early: `matches` checks the whole string against a regular expression."],[17,"`error`: stop the build, red, with this message."],[20,"In Groovy, parameters are read with `params.NAME`."],[24,"`when { expression { … } }`: the stage runs only if the expression is true; otherwise it is **skipped**."],[26,"`input`: pause and wait for a human. `ok` is the label of the button, `submitter` who may click it."],[31,`In the shell, parameters are environment variables.`],[35,`A boolean parameter used directly as the condition.`]]},{t:`callout`,kind:`warning`,title:`The first build of a parameterized pipeline`,text:"Parameters declared in a Jenkinsfile are registered by Jenkins **when the pipeline runs**. Our first build therefore started without parameters: `params.*` returned the defaults, but the **environment variables were empty** — the real log of build #1 says `Request: deploy 1.0.0 to dev` (Groovy, from `params`) followed by `Deploying  to` (shell, empty `$VERSION` and `$ENVIRONMENT`). From build #2 on, **Build with Parameters** appears and everything is set. Run a new parameterized pipeline once before relying on it."},{t:`cmd`,where:`pipeline-parameters #1, first run (real text, excerpt)`,cmd:``,out:`[2026-11-17T13:15:11.722Z] Request: deploy 1.0.0 to dev
Stage "Approval" skipped due to when conditional
[2026-11-17T13:15:12.201Z] + echo Deploying  to 
[2026-11-17T13:15:12.201Z] Deploying  to 
[2026-11-17T13:15:12.547Z] + echo Smoke tests against : OK
[2026-11-17T13:15:12.547Z] Smoke tests against : OK`},{t:`cmd`,where:`pipeline-parameters #2 — ENVIRONMENT=staging, RUN_SMOKE_TESTS=false (real text, excerpt)`,cmd:``,out:`[2026-11-17T13:15:21.521Z] Request: deploy 1.1.0 to staging
Stage "Approval" skipped due to when conditional
[2026-11-17T13:15:21.864Z] + echo Deploying 1.1.0 to staging
[2026-11-17T13:15:21.864Z] Deploying 1.1.0 to staging
Stage "Smoke tests" skipped due to when conditional
Finished: SUCCESS`},{t:`shot`,id:`m4-09-when-skipped`,titre:`Build #2 → Stages: skipped stages`,ce:"Stages whose `when` condition is false are drawn as **skipped**, not as failures.",éléments:[`**Validate**: ran.`,`**Approval**: skipped (not prod).`,`**Deploy**: ran.`,"**Smoke tests**: skipped (`RUN_SMOKE_TESTS` = false)."],actions:[`Compare with the log: *Stage "Approval" skipped due to when conditional*.`],résultat:`The graph shows the real path of the build.`},{t:`shot`,id:`m4-07-build-with-params`,titre:`Build with Parameters (generated from the Jenkinsfile)`,ce:"After the first run, the job offers the form of the `parameters { }` block.",éléments:["`ENVIRONMENT` = prod.","`VERSION` = 1.2.0.","`RUN_SMOKE_TESTS`.",`**Build**.`],actions:["Choose `prod`, type `1.2.0`, click **Build**."],résultat:`The build stops at the Approval stage.`},{t:`shot`,id:`m4-08-input`,titre:`The build waits for an approval (input)`,ce:"The build is paused — it holds no executor while waiting. Only `admin` (the `submitter`) may answer.",éléments:[`The question: *Deploy 1.2.0 to production?*`,"**Deploy** (the `ok` label).",`**Abort**: stops the build (result ABORTED).`],actions:[`Click **Deploy**. (The sidebar also shows **Paused for Input**.)`],résultat:`The log shows *Approved by Lab Admin* and the deployment runs.`},{t:`cmd`,where:`pipeline-parameters #3 — prod, approved (real text, excerpt)`,cmd:``,out:`[2026-11-17T13:15:39.586Z] Request: deploy 1.2.0 to prod
[2026-11-17T13:15:39.641Z] Deploy 1.2.0 to production?
[2026-11-17T13:15:39.642Z] Deploy or Abort
[2026-11-17T13:15:43.684Z] Approved by Lab Admin
[2026-11-17T13:15:44.003Z] + echo Deploying 1.2.0 to prod
[2026-11-17T13:15:44.003Z] Deploying 1.2.0 to prod
[2026-11-17T13:15:44.377Z] + echo Smoke tests against prod: OK
[2026-11-17T13:15:44.377Z] Smoke tests against prod: OK
Finished: SUCCESS`},{t:`cmd`,where:`pipeline-parameters #4 — VERSION=1.x (real text, excerpt)`,cmd:``,out:`ERROR: VERSION must look like 1.2.3, got '1.x'
Finished: FAILURE`,note:"`error` stops the build at the Validate stage: nothing is deployed with a bad version."},{t:`table`,head:[`when condition`,`Runs the stage when…`],rows:[["`expression { params.DEPLOY }`",`the Groovy expression is true`],["`environment name: 'ENVIRONMENT', value: 'prod'`",`a variable has this value`],["`branch 'main'`","the branch being built is `main` (multibranch, Module 5)"],["`changeset 'src/**'`",`the commits changed matching files`],["`anyOf { … }` / `allOf { … }` / `not { … }`",`combinations`],["`beforeAgent true`",`evaluate the condition before allocating an agent (saves executors)`]]},{t:`h`,id:`m4-6`,text:`4.6 Handling errors: post, try/catch, catchError, retry, timeout`},{t:`code`,lang:`groovy`,file:`pipeline-parallel → Configure → Pipeline script`,code:r,lignes:[[8,"`parallel { }`: the stages inside run at the same time (here on the 2 executors of agent-1 and in the same workspace)."],[14,"`catchError`: if the block fails, mark the stage and the build **UNSTABLE** instead of FAILURE, and continue."],[15,`A lint step that finds a problem (exit code 1).`],[21,"`retry(3)`: run the block again if it fails, up to 3 times."],[23,`The script counts its attempts in a file, to fail the first time and succeed the second — like a flaky service.`],[36,"`try { }` in a `script` block: Groovy error handling."],[37,"`timeout`: interrupt the block after 5 seconds."],[40,"`catch (err)`: the timeout arrives as an exception; catching it lets the pipeline continue."],[52,"A failing `sh` throws an exception…"],[53,"…that we catch: `err.getMessage()` says *script returned exit code 1*."],[55,"`finally`: always runs."],[62,"`post` conditions run in a fixed order: `always`, then the matching result (`unstable` here), `cleanup` last — whatever their order in the file."]]},{t:`cmd`,where:`pipeline-parallel #1 → Console Output (real text, [Pipeline] lines removed)`,cmd:``,out:`Started by user Lab Admin
Running on agent-1 in /home/jenkins/agent/workspace/pipeline-parallel
[2026-11-17T13:16:16.838Z] + sleep 3
[2026-11-17T13:16:16.873Z] + echo lint: 1 warning in src/app.js
[2026-11-17T13:16:16.873Z] lint: 1 warning in src/app.js
[2026-11-17T13:16:16.873Z] + exit 1
[2026-11-17T13:16:16.886Z] + cat .attempts
[2026-11-17T13:16:16.886Z] + echo 0
[2026-11-17T13:16:16.886Z] + count=0
[2026-11-17T13:16:16.886Z] + count=1
[2026-11-17T13:16:16.886Z] + echo 1
[2026-11-17T13:16:16.886Z] + echo attempt 1
[2026-11-17T13:16:16.886Z] attempt 1
[2026-11-17T13:16:16.886Z] + [ 1 -ge 2 ]
[2026-11-17T13:16:16.887Z] ERROR: script returned exit code 1
[2026-11-17T13:16:16.887Z] Setting overall build result to UNSTABLE
[2026-11-17T13:16:16.919Z] ERROR: script returned exit code 1
[2026-11-17T13:16:16.920Z] Retrying
[2026-11-17T13:16:17.214Z] + cat .attempts
[2026-11-17T13:16:17.214Z] + count=1
[2026-11-17T13:16:17.214Z] + count=2
[2026-11-17T13:16:17.214Z] + echo 2
[2026-11-17T13:16:17.214Z] + echo attempt 2
[2026-11-17T13:16:17.214Z] attempt 2
[2026-11-17T13:16:17.214Z] + [ 2 -ge 2 ]
[2026-11-17T13:16:20.114Z] + echo unit tests: 42 passed
[2026-11-17T13:16:20.114Z] unit tests: 42 passed
[2026-11-17T13:16:20.211Z] Timeout set to expire in 5 sec
[2026-11-17T13:16:20.495Z] + sleep 30
[2026-11-17T13:16:25.212Z] Cancelling nested steps due to timeout
[2026-11-17T13:16:25.218Z] Sending interrupt signal to process
[2026-11-17T13:16:25.748Z] Terminated
[2026-11-17T13:16:25.785Z] Timeout reached: org.jenkinsci.plugins.workflow.steps.FlowInterruptedException: Timeout has been exceeded
[2026-11-17T13:16:25.789Z] Continuing with a cached result instead.
[2026-11-17T13:16:26.119Z] + test -f report.txt
[2026-11-17T13:16:26.151Z] No report yet (script returned exit code 1): writing an empty one.
[2026-11-17T13:16:26.169Z] finally: this always runs.
[2026-11-17T13:16:26.218Z] Final result: UNSTABLE
[2026-11-17T13:16:26.229Z] [WS-CLEANUP] Deleting project workspace...
[2026-11-17T13:16:26.229Z] [WS-CLEANUP] Deferred wipeout is used...
[2026-11-17T13:16:26.234Z] [WS-CLEANUP] done
[2026-11-17T13:16:26.244Z] UNSTABLE: the Lint stage reported a problem.
Finished: UNSTABLE`,note:`The three parallel stages interleave their lines. Read the result lines: *Setting overall build result to UNSTABLE* (catchError), *Retrying* (retry), *Cancelling nested steps due to timeout* (timeout), then the caught exception.`},{t:`shot`,id:`m4-10-parallel-graph`,titre:`Build #1 → Stages: parallel branches, one unstable`,ce:`Parallel stages are drawn as branches; the result of each stage is kept.`,éléments:[`**Checks (3)**: the parallel block.`,`**Unit tests**: green.`,"**Lint**: orange — unstable through `catchError`; its log is shown on the right.",`**Flaky service**: green after a retry.`,`**Slow step**: green — the timeout was caught.`],actions:[`Click **Lint** and read *script returned exit code 1*.`],résultat:`The build is **UNSTABLE**: something must be looked at, but nothing is broken.`},{t:`table`,head:[`Tool`,`Scope`,`Effect on the result`],rows:[["`post { failure { } }`",`After the run or a stage`,`None: reacts to the result (notify, clean)`],["`catchError(buildResult, stageResult) { }`",`A block`,`Sets the results you choose and continues`],["`try { } catch { } finally { }`","Groovy, in `script` or Scripted","None unless you rethrow or call `error`"],["`retry(n) { }`",`A block`,`Fails only after n failed attempts`],["`timeout(time, unit) { }`",`A block or the whole run (options)`,`ABORTED, unless the exception is caught`],["`error 'message'`",`A step`,`FAILURE with a message`],["`unstable 'message'`",`A step`,`UNSTABLE with a message`]]},{t:`h`,id:`m4-7`,text:`4.7 Artifacts, stash and test reports`},{t:`code`,lang:`groovy`,file:`pipeline-artifacts → Configure → Pipeline script`,code:i,lignes:[[3,"`agent none`: no global agent; each stage declares its own (they could be different machines)."],[13,`A checksum, to verify the file later.`],[15,"`stash`: save files on the controller under a name, for later stages of **this** build."],[21,"`unstash`: restore them in the workspace of the current stage."],[22,`Verify the file with its checksum.`],[25,`Our "tests" write a JUnit XML report — real test tools do this for you (Module 6).`],[29,`One failing test case.`],[37,"`junit`: read the report, show the results and trends; a failed test makes the build **UNSTABLE**. In `post { always }`, so that the report is published even when tests fail."],[44,"`archiveArtifacts`: keep the files with the build, downloadable from its page."]]},{t:`cmd`,where:`pipeline-artifacts #2 → Console Output (real text, [Pipeline] lines removed)`,cmd:``,out:`Started by user Lab Admin
[2026-11-17T13:16:51.431Z] Running on agent-1 in /home/jenkins/agent/workspace/pipeline-artifacts
[2026-11-17T13:16:51.715Z] + mkdir -p build
[2026-11-17T13:16:51.715Z] + echo inventory 2.0.2
[2026-11-17T13:16:51.715Z] + sha256sum build/app.txt
[2026-11-17T13:16:51.727Z] Stashed 2 file(s)
[2026-11-17T13:16:51.767Z] Running on agent-1 in /home/jenkins/agent/workspace/pipeline-artifacts
[2026-11-17T13:16:52.049Z] + sha256sum -c build/app.txt.sha256
[2026-11-17T13:16:52.049Z] build/app.txt: OK
[2026-11-17T13:16:52.331Z] + mkdir -p test-results
[2026-11-17T13:16:52.331Z] + cat
Post stage
[2026-11-17T13:16:52.344Z] Recording test results
[2026-11-17T13:16:52.351Z] [Checks API] No suitable checks publisher found.
[2026-11-17T13:16:52.398Z] Running on agent-1 in /home/jenkins/agent/workspace/pipeline-artifacts
[2026-11-17T13:16:52.421Z] Archiving artifacts
[2026-11-17T13:16:52.427Z] Recording fingerprints
Finished: UNSTABLE`,note:"Here the three stages ran one after the other on agent-1, in the same workspace. With several agents, only `stash`/`unstash` (or archived artifacts) carry files from one stage to the next."},{t:`shot`,id:`m4-11-tests`,titre:`Build #2 → Tests`,ce:`The JUnit report, parsed by Jenkins.`,éléments:[`**All Failed Tests**.`,"`rejects_negative_stock`, failing for 2 builds (column *Age*).",`**All Tests**: per package, failed / skipped / passed.`],actions:[`Click the failed test to read its message and stack trace.`],résultat:`You see which test fails and since when.`},{t:`shot`,id:`m4-12-test-trend`,titre:`The job page: test trend and artifacts`,ce:`After two builds, the job shows the trend of the test results.`,éléments:[`**Test Result Trend**: passed/failed per build.`,"**Last Successful Artifacts**: `app.txt` and its checksum."],actions:[`Download an artifact from the job page.`],résultat:`Results and deliverables are one click away.`},{t:`table`,head:[`Mechanism`,`Kept`,`Use it for`],rows:[["`stash` / `unstash`",`During the build only`,`Passing files between stages and agents`],["`archiveArtifacts`",`With the build (until it is discarded)`,`Deliverables to download, reports`],[`An artifact repository (Nexus, Artifactory, registry)`,`Independent of Jenkins`,`Real releases (Modules 7, 10)`]]},{t:`h`,id:`m4-8`,text:`4.8 Tools: Snippet Generator, Directive Generator, Replay, Restart from Stage`},{t:`shot`,id:`m4-04-snippet`,titre:`Pipeline Syntax → Snippet Generator`,ce:`Choose a step, fill its form, and Jenkins writes the line of code — with the exact parameter names of your plugin versions.`,éléments:["**Files to archive**: `*.tar.gz` (the step *archiveArtifacts* is chosen in the list above).",`**Generate Pipeline Script**.`,`The generated line.`],actions:[`Pick a step, fill it, generate, copy the line into your Jenkinsfile.`],résultat:"`archiveArtifacts artifacts: '*.tar.gz', fingerprint: true, followSymlinks: false`"},{t:`shot`,id:`m4-05-directive`,titre:`Pipeline Syntax → Declarative Directive Generator`,ce:`The same idea for Declarative sections and directives (agent, options, when, parameters…).`,éléments:[`Directive: **agent**.`,`**label**: run on an agent matching a label.`,"Label: `linux`.",`The generated directive.`],actions:["Generate an `options` block with a timeout, then a `when` condition."],résultat:"A ready-to-paste `agent { label 'linux' }`."},{t:`shot`,id:`m4-13-replay`,titre:`Build → Replay`,ce:`Run the build again with a **modified** script, without changing the job — ideal to try a fix.`,éléments:[`**Main Script**: the Jenkinsfile of build #2, editable.`,`**Run**: starts a new build with this version.`],actions:[`Change a message, **Run**, check the new build. Then copy the fix into the real Jenkinsfile.`],résultat:`A new build ran with the modified script; the job configuration is unchanged.`},{t:`shot`,id:`m4-14-restart`,titre:`Build → Restart from Stage`,ce:`Run a Declarative build again from a given stage, reusing its parameters — useful when only a late stage failed.`,éléments:[`**Stage Name**: Checks, Slow step or Report (top-level stages only).`,`**Run**.`],actions:[`Restart pipeline-parallel #1 from **Report**.`],résultat:`A new build that skips the stages before Report.`},{t:`callout`,kind:`tip`,text:`**Replay** is for testing code changes; **Restart from Stage** is for re-running part of the same code. Both create a new build, so the history stays complete.`},{t:`h`,id:`m4-9`,text:`4.9 Common errors and fixes`},{t:`p`,text:`Declarative pipelines are validated before running: syntax errors fail the build in a second, with the line and the column.`},{t:`shot`,id:`m4-15-syntax-error`,titre:`A pipeline that does not compile`,ce:"Build #1 of `pipeline-broken` failed before running any step.",éléments:[`*WorkflowScript: 4: Unknown stage section "sh". Starting with version 0.5, steps in a stage must be in a ‘steps’ block.*`,`*Expected one of "steps", "stages", or "parallel" for stage "Build"*.`],actions:[`Read the line number (4) and the message; fix the Jenkinsfile.`],résultat:`You know where to look: the first lines of the console.`},{t:`errors`,rows:[['`Unknown stage section "sh". Starting with version 0.5, steps in a stage must be in a ‘steps’ block.`',"A step written directly inside `stage { }`.","Wrap the steps in `steps { }`."],["`expecting anything but ''\\n''; got it anyway @ line 6, column 57.`",'An unclosed string or `${` — here `"${params.VERSION"` (missing `}`).','Close the expression: `"${params.VERSION}"`. The column points just after the problem.'],['`Warning: A secret was passed to "sh" using Groovy String interpolation, which is insecure.`',`A credential variable inside a double-quoted Groovy string.`,"Use single quotes and let the shell read the variable: `sh '… $API_TOKEN'`."],["`Deploying  to` — empty variables in the first build",`Parameters declared in the Jenkinsfile are registered only by the first run.`,"Run the pipeline once; use `params.X` in Groovy, which falls back to the default."],["`ERROR: script returned exit code 1`","A shell command of a `sh` step failed.",`Read the lines just above it; run the command by hand on the agent if needed.`],[`The build is UNSTABLE, not FAILURE`,"`catchError(…UNSTABLE…)`, `unstable` or failed tests recorded by `junit`.",`Open the orange stage or the Tests page.`],[`A stage you expected was *skipped due to when conditional*`,"Its `when` condition was false (check the parameter values).",`Look at the Parameters page of the build.`]]},{t:`h`,id:`m4-10`,text:`4.10 Hands-on labs`},{t:`lab`,id:`lab41`,titre:`Lab 4.1 — Five Jenkinsfiles of growing complexity`,durée:`1 h 30`,objectif:`Create one Pipeline job per Jenkinsfile of this module, run each one and explain every line of its log.`,étapes:[{t:`p`,text:"**1.** Create `pipeline-basics` with Jenkinsfile 1, build twice, open the Stages view and the artifact."},{t:`p`,text:"**2.** Create `pipeline-variables` (Jenkinsfile 2). Find the warning, fix line 39, run again."},{t:`p`,text:"**3.** Create `pipeline-parameters` (Jenkinsfile 3). Run it once, then with staging, then with prod (approve), then with `VERSION=1.x`."},{t:`p`,text:"**4.** Create `pipeline-parallel` (Jenkinsfile 4) and `pipeline-artifacts` (Jenkinsfile 5); explain why each build is UNSTABLE."},{t:`p`,text:`**5.** Write the Scripted version of Jenkinsfile 1 and compare the logs.`}],solution:[{t:`ul`,items:["`pipeline-basics`: SUCCESS, artifact `app-1.0.N.tar.gz`, workspace emptied by `cleanWs()`.","`pipeline-variables`: SUCCESS; after the fix (`sh 'echo Token: $API_TOKEN'`), no more warning, still `Token: ****`.","`pipeline-parameters`: #1 SUCCESS with empty shell variables (first run), #2 SUCCESS with two skipped stages, #3 paused then *Approved by Lab Admin*, #4 FAILURE (`VERSION must look like 1.2.3, got '1.x'`).","`pipeline-parallel`: UNSTABLE because of `catchError` in Lint; `pipeline-artifacts`: UNSTABLE because one test fails in the JUnit report.","Scripted: same steps, no *Declarative: Post Actions* stage; the `finally` block prints the result."]}]},{t:`lab`,id:`lab42`,titre:`Lab 4.2 — Fix a broken pipeline`,durée:`20 min`,objectif:`Read the compilation errors of Jenkins and fix two broken Jenkinsfiles.`,étapes:[{t:`p`,text:"**1.** Create `pipeline-broken` with this script and build it. Read the error."},{t:`code`,lang:`groovy`,file:`pipeline-broken → Pipeline script (version A)`,code:o,lignes:[[4,`Look at what this stage contains.`]]},{t:`p`,text:`**2.** Replace it with version B and build again.`},{t:`code`,lang:`groovy`,file:`pipeline-broken → Pipeline script (version B)`,code:s,lignes:[[6,`Look closely at the braces.`]]},{t:`p`,text:`**3.** Write a version that compiles and prints the version given as a parameter.`}],solution:[{t:`cmd`,where:`pipeline-broken #1 (version A) — real text`,cmd:``,out:`Started by user Lab Admin
org.codehaus.groovy.control.MultipleCompilationErrorsException: startup failed:
WorkflowScript: 4: Unknown stage section "sh". Starting with version 0.5, steps in a stage must be in a ‘steps’ block. @ line 4, column 9.
           stage('Build') {
           ^

WorkflowScript: 4: Expected one of "steps", "stages", or "parallel" for stage "Build" @ line 4, column 9.
           stage('Build') {
           ^

2 errors
`},{t:`cmd`,where:`pipeline-broken #2 (version B) — real text`,cmd:``,out:`Started by user Lab Admin
org.codehaus.groovy.control.MultipleCompilationErrorsException: startup failed:
WorkflowScript: 6: expecting anything but ''\\n''; got it anyway @ line 6, column 57.
   ding version \${params.VERSION"
                                 ^

1 error`},{t:`code`,lang:`groovy`,file:`pipeline-fixed → Pipeline script`,code:c,lignes:[[3,"Declare the parameter, so that `params.VERSION` has a value."],[8,"Steps inside `steps { }`."],[10,"`${…}` closed."]]},{t:`cmd`,where:`pipeline-fixed #1 → Console Output (real text, [Pipeline] lines removed)`,cmd:``,out:`Started by user Lab Admin
Running on agent-1 in /home/jenkins/agent/workspace/pipeline-fixed
+ echo building
building
Building version 1.0.0
testing
Finished: SUCCESS`}]},{t:`exercise`,id:`ex43`,titre:`Exercise 4.3 — Single or double quotes?`,énoncé:[{t:`p`,text:"For each line, say who expands the variable and whether it is acceptable: (a) `echo \"Build ${env.BUILD_NUMBER}\"` (b) `sh 'echo $BUILD_NUMBER'` (c) `sh \"curl -H 'Authorization: Bearer ${API_TOKEN}' …\"` (d) `sh 'curl -H \"Authorization: Bearer $API_TOKEN\" …'`."}],solution:[{t:`ul`,items:[`(a) Groovy — fine, nothing secret.`,`(b) The shell — fine.`,`(c) Groovy pastes the token into the command line — **insecure**, Jenkins warns.`,`(d) The shell reads the token from its environment — **the right way**.`]}]},{t:`exercise`,id:`ex44`,titre:`Exercise 4.4 — Choose the error handling`,énoncé:[{t:`p`,text:`Choose the construct for each need: (1) a code-quality scan must report problems without stopping the delivery; (2) a download from a sometimes-slow mirror; (3) a deployment step must never hang more than 10 minutes; (4) send a message to the team whenever the build fails.`}],solution:[{t:`ol`,items:["`catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') { … }`.","`retry(3) { … }` (combined with a `timeout` per attempt).","`timeout(time: 10, unit: 'MINUTES') { … }`.","`post { failure { … } }` at the pipeline level."]}]},{t:`h`,id:`m4-11`,text:`4.11 Recap, quiz and checklist`},{t:`recap`,items:["A Pipeline is a job described as code in a `Jenkinsfile`; it is durable, reviewable and shows stages.","**Declarative** (`pipeline { }`) is the default; **Scripted** (`node { }`) is plain Groovy with `try/catch`.","Mandatory: `pipeline`, `agent`, `stages`, `stage`, `steps`. Useful: `options`, `environment`, `parameters`, `when`, `post`.",`Double quotes = Groovy expands; single quotes = the shell expands. Secrets always in single quotes.`,"`when` skips stages; `input` waits for an approval; parameters are registered by the first run.","`post`, `try/catch/finally`, `catchError`, `retry`, `timeout`, `error` and `unstable` control the result.","`stash` moves files inside a build; `archiveArtifacts` keeps them with the build; `junit` publishes test results.",`Snippet/Directive Generators write correct code for your plugin versions; Replay and Restart from Stage re-run builds.`]},{t:`quiz`,id:`quiz4`,questions:[{q:`Which block is NOT mandatory in a Declarative pipeline?`,choix:[`agent`,`stages`,`steps`,`post`],bonne:3,pourquoi:"`post` is optional; `agent`, `stages`, `stage` and `steps` are required."},{q:"What does `sh \"echo ${APP_NAME}\"` do compared with `sh 'echo $APP_NAME'`?",choix:[`Nothing different, ever`,`Groovy replaces the variable before the shell runs, instead of the shell`,`The first one fails`,`The second one is not allowed`],bonne:1,pourquoi:`Double quotes = Groovy interpolation; single quotes = shell expansion on the agent.`},{q:'Why does Jenkins warn about `sh "echo Token: ${API_TOKEN}"`?',choix:[`The variable does not exist`,`The secret is pasted into the command line by Groovy`,`Echo is forbidden`,`Tokens must be in uppercase`],bonne:1,pourquoi:`The log is masked but the command line carried the secret; use single quotes.`},{q:"A stage has `when { expression { params.ENVIRONMENT == 'prod' } }` and the build runs for staging. Result of the stage?",choix:[`FAILURE`,`Skipped`,`UNSTABLE`,`It waits`],bonne:1,pourquoi:`Stage "Approval" skipped due to when conditional.`},{q:`In the first build of a pipeline declaring parameters, what can be empty?`,choix:[`params.* in Groovy`,`The environment variables of the parameters in sh`,`BUILD_NUMBER`,`The workspace`],bonne:1,pourquoi:"Our real build #1 printed `Deploying  to`: the parameters were not registered yet."},{q:"What does `catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE')` do when its block fails?",choix:[`Stops the build`,`Marks stage and build UNSTABLE and continues`,`Retries the block`,`Hides the error`],bonne:1,pourquoi:`*Setting overall build result to UNSTABLE*, then the next stages run.`},{q:`In which order do these post conditions run: cleanup, always, unstable?`,choix:[`As written in the file`,`always, unstable, cleanup`,`cleanup, always, unstable`,`unstable, always, cleanup`],bonne:1,pourquoi:`Fixed order: always, then the result conditions, cleanup last — our log printed "Final result" before "UNSTABLE".`},{q:`How do you pass files from a stage on one agent to a stage on another agent of the same build?`,choix:[`archiveArtifacts`,`stash / unstash`,`env variables`,`It is impossible`],bonne:1,pourquoi:"`stash` stores them on the controller for the duration of the build."},{q:"What makes a build UNSTABLE after `junit`?",choix:[`A slow test`,`At least one failed test in the report`,`A missing report`,`Too many tests`],bonne:1,pourquoi:`Failed tests mark the build UNSTABLE; errors running the tests would fail it.`},{q:`You want to test a small change of the Jenkinsfile on an old build without editing the job. Which feature?`,choix:[`Restart from Stage`,`Replay`,`Rebuild`,`Snippet Generator`],bonne:1,pourquoi:`Replay runs a new build with a modified script; the job stays unchanged.`}]},{t:`checklist`,id:`m4`,items:[`I can explain each directive of Jenkinsfile 1 and its log.`,`I can read a Scripted pipeline and convert a simple one to Declarative.`,`I quote variables correctly and never interpolate secrets with Groovy.`,`I declared parameters in a Jenkinsfile and know the first-build trap.`,`I used when, input, parallel, catchError, retry, timeout and try/catch on the lab.`,`I archived artifacts, used stash/unstash and published a JUnit report.`,`I generated code with the Snippet and Directive Generators.`,`I fixed the two broken pipelines from their error messages (Lab 4.2).`]}];export{e as JF1,t as JF2,n as JF3,r as JF4,i as JF5,o as JF_BROKEN_A,s as JF_BROKEN_B,c as JF_FIXED,a as JF_SCRIPTED,l as MODULE4,l as default};