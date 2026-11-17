// Module 8 — Jenkins and Kubernetes. A kind cluster (Kubernetes 1.37) in the lab, the Kubernetes plugin with
// pod agents, a deployment repository deployed with manifests then with Helm 4; every screenshot, console
// output, measure and error comes from the lab (Jenkins 2.580.2 LTS, 2026-11-17). Code constants are
// generated from the files that ran.

export const KIND_CLUSTER = `# ~/jenkins-lab/kind/cluster.yaml — a one-node Kubernetes cluster for the labs (Module 8)
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: lab
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080          # NodePort of the stock-service Service
        hostPort: 30080               # -> http://localhost:30080 on your machine
containerdConfigPatches:
  - |-
    [plugins."io.containerd.grpc.v1.cri".registry]
      config_path = "/etc/containerd/certs.d"
`

export const RBAC_YAML = `# ~/jenkins-lab/k8s/jenkins-rbac.yaml — what Jenkins may do in the cluster (Module 8)
apiVersion: v1
kind: Namespace
metadata:
  name: jenkins-agents                # the pods of the builds run here
---
apiVersion: v1
kind: Namespace
metadata:
  name: stock                         # the application is deployed here
---
# 1) The Kubernetes plugin (on the controller) creates and deletes agent pods, nothing else
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jenkins
  namespace: jenkins-agents
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-agents
  namespace: jenkins-agents
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/exec"]
    verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
  - apiGroups: [""]
    resources: ["pods/log", "events"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: jenkins-pod-agents
  namespace: jenkins-agents
subjects:
  - kind: ServiceAccount
    name: jenkins
    namespace: jenkins-agents
roleRef:
  kind: Role
  name: pod-agents
  apiGroup: rbac.authorization.k8s.io
---
# A long-lived token for the ServiceAccount jenkins, read once and stored as a Jenkins credential
apiVersion: v1
kind: Secret
metadata:
  name: jenkins-token
  namespace: jenkins-agents
  annotations:
    kubernetes.io/service-account.name: jenkins
type: kubernetes.io/service-account-token
---
# 2) Agent pods that deploy run as "deployer": they may change the namespace stock only
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployer
  namespace: jenkins-agents
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployer-edit
  namespace: stock
subjects:
  - kind: ServiceAccount
    name: deployer
    namespace: jenkins-agents
roleRef:
  kind: ClusterRole
  name: edit                          # built-in role: workloads, services, config maps… no RBAC changes
  apiGroup: rbac.authorization.k8s.io
`

export const JF_K8S_HELLO = `// k8s-hello — the first build in a Kubernetes pod (Pipeline job, Module 8)
pipeline {
    agent {
        kubernetes {                                   // a new pod for this build, deleted at the end
            yaml '''
                apiVersion: v1
                kind: Pod
                spec:
                  containers:
                    - name: node                       # a tool container, next to the jnlp agent container
                      image: node:26.13.1-alpine3.24
                      command: ["sleep"]
                      args: ["infinity"]               # stays up; steps are run inside it with container('node')
            '''
        }
    }
    options { timestamps() }
    stages {
        stage('Hello from a pod') {
            steps {
                sh 'echo "agent: $NODE_NAME" && hostname'                    // in the jnlp container
                container('node') {
                    sh 'node --version && cat /etc/alpine-release'          // in the node container
                }
            }
        }
    }
}
`

export const DEPLOYMENT_YAML = `# lab/stock-deploy — k8s/deployment.yaml: three replicas of stock-service in the namespace stock
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stock-service
  namespace: stock
  labels:
    app: stock-service
spec:
  replicas: 3
  revisionHistoryLimit: 5                     # keep 5 old ReplicaSets for rollbacks
  selector:
    matchLabels:
      app: stock-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                             # one extra pod while updating
      maxUnavailable: 0                       # never fewer ready pods than replicas
  template:
    metadata:
      labels:
        app: stock-service
    spec:
      containers:
        - name: app
          image: gitea:3000/lab/stock-service:\${VERSION}   # filled in by the pipeline (envsubst)
          ports:
            - containerPort: 8080
          readinessProbe:                     # receives traffic only once /health answers
            httpGet: { path: /health, port: 8080 }
            periodSeconds: 3
          livenessProbe:                      # restarted if /health stops answering
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 5
            periodSeconds: 10
          lifecycle:
            preStop:
              sleep:
                seconds: 5                    # keep answering while the Service stops sending traffic here
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits: { memory: 128Mi }
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000                   # the user "node" of the image, as a number: Kubernetes can check it
            allowPrivilegeEscalation: false
`

export const SERVICE_YAML = `# lab/stock-deploy — k8s/service.yaml: one stable address for the pods of stock-service
apiVersion: v1
kind: Service
metadata:
  name: stock-service
  namespace: stock
spec:
  type: NodePort
  selector:
    app: stock-service                        # every ready pod with this label receives traffic
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080                         # http://localhost:30080 (mapped by the kind cluster)
`

export const JF_DEPLOY_MANIFESTS = `// lab/stock-deploy — Jenkinsfile: deploy a version of stock-service to Kubernetes
pipeline {
    agent {
        kubernetes {
            yaml '''
                apiVersion: v1
                kind: Pod
                spec:
                  serviceAccountName: deployer            # may change the namespace stock, nothing else
                  securityContext:
                    runAsUser: 1000
                    runAsNonRoot: true
                  containers:
                    - name: k8s
                      image: alpine/k8s:1.37.2            # kubectl 1.37, Helm 4, curl, envsubst
                      command: ["sleep"]
                      args: ["infinity"]
                      env:
                        - name: HOME
                          value: /home/jenkins/agent      # writable home: caches of kubectl and Helm
            '''
            defaultContainer 'k8s'                        // steps run in this container (a Groovy comment: // not #)
        }
    }
    parameters {
        string(name: 'VERSION', defaultValue: '1.0.7', description: 'Tag of gitea:3000/lab/stock-service to deploy')
    }
    options {
        timestamps()
        disableConcurrentBuilds()                         // one deployment at a time
        timeout(time: 15, unit: 'MINUTES')
    }
    stages {
        stage('Check') {
            steps {
                sh '''
                    [ -n "$VERSION" ] || { echo "VERSION is empty: use Build with Parameters"; exit 1; }
                    kubectl version
                    kubectl auth can-i create deployments -n stock
                '''
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    kubectl apply -f k8s/service.yaml
                    envsubst '$VERSION' < k8s/deployment.yaml | kubectl apply -f -
                    kubectl -n stock rollout status deployment/stock-service --timeout=90s
                '''
            }
            post {
                failure {                                 // the new version never became ready: go back
                    sh '''
                        kubectl -n stock rollout undo deployment/stock-service
                        kubectl -n stock rollout status deployment/stock-service --timeout=90s
                    '''
                }
            }
        }
        stage('Smoke test') {
            steps {
                sh 'curl -fsS http://stock-service.stock.svc/health'   // from inside the cluster
            }
        }
    }
    post {
        always {
            sh 'kubectl -n stock get deployment,pods -l app=stock-service -o wide || true'
        }
    }
}
`

export const JF_DEPLOY_HELM = `// lab/stock-deploy — Jenkinsfile: deploy a version of stock-service to Kubernetes
pipeline {
    agent {
        kubernetes {
            yaml '''
                apiVersion: v1
                kind: Pod
                spec:
                  serviceAccountName: deployer            # may change the namespace stock, nothing else
                  securityContext:
                    runAsUser: 1000
                    runAsNonRoot: true
                  containers:
                    - name: k8s
                      image: alpine/k8s:1.37.2            # kubectl 1.37, Helm 4, curl, envsubst
                      command: ["sleep"]
                      args: ["infinity"]
                      env:
                        - name: HOME
                          value: /home/jenkins/agent      # writable home: caches of kubectl and Helm
            '''
            defaultContainer 'k8s'                        // steps run in this container (a Groovy comment: // not #)
        }
    }
    parameters {
        string(name: 'VERSION', defaultValue: '1.0.7', description: 'Tag of gitea:3000/lab/stock-service to deploy')
    }
    options {
        timestamps()
        disableConcurrentBuilds()                         // one deployment at a time
        timeout(time: 15, unit: 'MINUTES')
    }
    stages {
        stage('Check') {
            steps {
                sh '''
                    [ -n "$VERSION" ] || { echo "VERSION is empty: use Build with Parameters"; exit 1; }
                    kubectl version
                    kubectl auth can-i create deployments -n stock
                '''
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    helm upgrade --install stock-service charts/stock-service \\
                      --namespace stock \\
                      --set image.tag=$VERSION \\
                      --rollback-on-failure --timeout 2m
                    helm history stock-service --namespace stock --max 5
                '''
            }
        }
        stage('Smoke test') {
            steps {
                sh 'curl -fsS http://stock-service.stock.svc/health'   // from inside the cluster
            }
        }
    }
    post {
        always {
            sh 'kubectl -n stock get deployment,pods -l app=stock-service -o wide || true'
        }
    }
}
`

export const JF_DEPLOY_HELM_STAGE = `        stage('Deploy') {
            steps {
                sh '''
                    helm upgrade --install stock-service charts/stock-service \\
                      --namespace stock \\
                      --set image.tag=$VERSION \\
                      --rollback-on-failure --timeout 2m
                    helm history stock-service --namespace stock --max 5
                '''
            }
        }
`

export const CHART_YAML = `# lab/stock-deploy — charts/stock-service/Chart.yaml: the identity of the chart
apiVersion: v2
name: stock-service
description: The stock API of the lab (Learning Jenkins, Module 8)
type: application
version: 0.1.0                  # version of the chart itself
appVersion: "1.0.7"             # default version of the application (image tag)
`

export const VALUES_YAML = `# lab/stock-deploy — charts/stock-service/values.yaml: defaults, overridden with --set or -f
replicaCount: 3
image:
  repository: gitea:3000/lab/stock-service
  tag: ""                       # empty: the appVersion of Chart.yaml
track: stable                   # a label of the pods: stable, canary…
service:
  enabled: true                 # false for a canary release: it shares the Service of the stable one
  nodePort: 30080               # http://localhost:30080 (mapped by the kind cluster)
preStopSeconds: 5               # keep answering while the Service stops sending traffic
resources:
  requests: { cpu: 50m, memory: 64Mi }
  limits: { memory: 128Mi }
`

export const TPL_DEPLOYMENT = `# lab/stock-deploy — charts/stock-service/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app: stock-service
    track: {{ .Values.track }}
    app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
    helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
spec:
  replicas: {{ .Values.replicaCount }}
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: stock-service
      track: {{ .Values.track }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: stock-service
        track: {{ .Values.track }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet: { path: /health, port: 8080 }
            periodSeconds: 3
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 5
            periodSeconds: 10
          lifecycle:
            preStop:
              sleep:
                seconds: {{ .Values.preStopSeconds }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            allowPrivilegeEscalation: false
`

export const TPL_SERVICE = `# lab/stock-deploy — charts/stock-service/templates/service.yaml
{{- if .Values.service.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: stock-service
spec:
  type: NodePort
  selector:
    app: stock-service            # every track (stable and canary) receives traffic
  ports:
    - port: 80
      targetPort: 8080
      nodePort: {{ .Values.service.nodePort }}
{{- end }}
`

export const MODULE8 = [
  { t: 'objectives', items: [
    'Explain the three ways Jenkins and Kubernetes work together.',
    'Create a local Kubernetes cluster with kind and give Jenkins least-privilege access to it.',
    'Configure the Kubernetes plugin and run builds in **ephemeral pod agents**.',
    'Deploy an application with YAML manifests from a pipeline, check the rollout and **roll back automatically**.',
    'Measure availability during a rolling update and make it zero-downtime (probes, `maxUnavailable: 0`, `preStop`).',
    'Package the application as a **Helm chart** and deploy it with `helm upgrade --install --rollback-on-failure`.',
    'Choose a deployment strategy — rolling, blue/green, canary — and run a real canary.',
  ] },
  { t: 'p', text: 'Prerequisite: the lab of Module 7 (the image `gitea:3000/lab/stock-service` is in the registry of Gitea). This module adds a real Kubernetes 1.37 cluster to the lab. Every command, log and screenshot below comes from it — including the failed deployments, which teach the most.' },

  { t: 'h', id: 'm8-1', text: '8.1 Jenkins and Kubernetes: three relationships' },
  { t: 'table', head: ['Relationship', 'What happens', 'In this module'], rows: [
    ['Jenkins **deploys to** Kubernetes', 'A pipeline applies manifests or a Helm chart to a cluster', 'Sections 8.5 to 8.9'],
    ['Jenkins **runs its agents in** Kubernetes', 'Each build gets a fresh pod, deleted at the end (Kubernetes plugin)', 'Section 8.4'],
    ['Jenkins **itself runs in** Kubernetes', 'The controller is a StatefulSet, usually installed with the official Helm chart `jenkins/jenkins`', 'Not covered: the controller stays in Docker Compose here'],
  ] },
  { t: 'diagram', id: 'm8-k8s', caption: 'The lab of this module: (1) Jenkins asks the API server to create an agent pod; (2) the pod connects back to Jenkins; (3) it upgrades the Helm release in the namespace stock. The node pulls images from Gitea; you reach the Service on localhost:30080.' },

  { t: 'h', id: 'm8-2', text: '8.2 A local cluster with kind' },
  { t: 'p', text: '**kind** (Kubernetes IN Docker) runs a whole cluster as Docker containers — one container per node. It needs only Docker, starts in about a minute and is used by Kubernetes itself for its tests. Install the three command-line tools, each checked against its published checksum:' },
  { t: 'cmd', where: 'Your terminal (Linux, amd64)', cmd: `go install sigs.k8s.io/kind@v0.33.0        # or the binary: https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64
curl -LO https://dl.k8s.io/release/v1.37.2/bin/linux/amd64/kubectl
curl -LO https://dl.k8s.io/release/v1.37.2/bin/linux/amd64/kubectl.sha256
echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c - && sudo install -m 0755 kubectl /usr/local/bin/kubectl
curl -LO https://get.helm.sh/helm-v4.3.2-linux-amd64.tar.gz
curl -LO https://get.helm.sh/helm-v4.3.2-linux-amd64.tar.gz.sha256sum
sha256sum -c helm-v4.3.2-linux-amd64.tar.gz.sha256sum && tar -xzf helm-v4.3.2-linux-amd64.tar.gz && sudo install -m 0755 linux-amd64/helm /usr/local/bin/helm
kubectl version --client; helm version --short; kind version`, out: `Client Version: v1.37.2
Kustomize Version: v5.8.1
v4.3.2+g8346aaa
kind v0.33.0 go1.24.7 linux/amd64`, note: 'Our lab installed kind with `go install`; both ways give the same binary. On macOS or Windows, use the packages of each project (Homebrew, winget…).' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/kind/cluster.yaml', code: KIND_CLUSTER, lignes: [
    [4, 'The cluster name: the node container will be `lab-control-plane`, the kubectl context `kind-lab`.'],
    [6, 'One node, control plane and worker at once: enough for the labs.'],
    [8, 'A NodePort of the cluster…'],
    [9, '…published on your machine: http://localhost:30080 reaches the application.'],
    [13, 'containerd reads one folder per registry in `/etc/containerd/certs.d`: we use it for the registry of Gitea, which speaks plain HTTP.'],
  ] },
  { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'kind create cluster --config kind/cluster.yaml', out: `Creating cluster "lab" ...
 ✓ Ensuring node image (kindest/node:v1.37.0) 🖼️
 ✓ Preparing nodes 📦 
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-lab"` },
  { t: 'p', text: 'Two more things: the node must reach the containers of the lab (Jenkins, Gitea), and containerd must accept the HTTP registry of Gitea:' },
  { t: 'cmd', where: 'Your terminal', cmd: `docker network connect jenkins-lab_default lab-control-plane
docker exec lab-control-plane mkdir -p "/etc/containerd/certs.d/gitea:3000"
printf '[host."http://gitea:3000"]\\n  capabilities = ["pull", "resolve"]\\n' | docker exec -i lab-control-plane cp /dev/stdin "/etc/containerd/certs.d/gitea:3000/hosts.toml"
docker exec lab-control-plane getent hosts gitea jenkins
docker exec lab-control-plane crictl pull gitea:3000/lab/stock-service:1.0.7`, out: `172.18.0.4      gitea
172.18.0.2      jenkins
Image is up to date for sha256:13cabab0dccbc1984c00aa05e65b983e700ac33661b31cec0bc977f57f04da41`, note: 'The node resolves `gitea` and `jenkins` through the Docker network, and pulls from Gitea without TLS. In production the registry has HTTPS and this file is not needed.' },
  { t: 'cmd', where: 'Your terminal', cmd: 'kubectl get nodes -o wide', out: `NAME                STATUS   ROLES           AGE   VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                       KERNEL-VERSION            CONTAINER-RUNTIME
lab-control-plane   Ready    control-plane   72m   v1.37.0   172.20.0.2    <none>        Debian GNU/Linux 13 (trixie)   6.18.44-fc-v553 (amd64)   containerd://2.3.4` },

  { t: 'h', id: 'm8-3', text: '8.3 Connect Jenkins to the cluster' },
  { t: 'p', text: 'Jenkins needs an identity in the cluster. Give it **two** service accounts with the least privileges: `jenkins`, used by the controller to create and delete agent pods, and `deployer`, used by the pods that deploy — limited to the namespace `stock`.' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/k8s/jenkins-rbac.yaml', code: RBAC_YAML, lignes: [
    [5, 'Agent pods live in their own namespace…'],
    [10, '…and the application in another one.'],
    [26, 'Pods and `pods/exec`: the plugin creates the pod and runs the steps in its containers.'],
    [29, 'Logs and events: Jenkins shows why a pod does not start.'],
    [33, 'The RoleBinding gives the Role to the ServiceAccount `jenkins`, in `jenkins-agents` only.'],
    [48, 'A Secret of type `service-account-token`: Kubernetes fills it with a long-lived token of `jenkins`.'],
    [64, 'The RoleBinding lives in `stock`: `deployer` gets rights there and nowhere else.'],
    [74, '`edit`, a built-in ClusterRole: create and change workloads, services, secrets… but not roles: `deployer` cannot give itself more rights.'],
  ] },
  { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: 'kubectl apply -f k8s/jenkins-rbac.yaml', out: `namespace/jenkins-agents created
namespace/stock created
serviceaccount/jenkins created
role.rbac.authorization.k8s.io/pod-agents created
rolebinding.rbac.authorization.k8s.io/jenkins-pod-agents created
secret/jenkins-token created
serviceaccount/deployer created
rolebinding.rbac.authorization.k8s.io/deployer-edit created` },
  { t: 'cmd', where: 'Your terminal: check the rights before Jenkins uses them', cmd: '', out: `$ kubectl auth can-i create pods -n jenkins-agents --as=system:serviceaccount:jenkins-agents:jenkins
yes
$ kubectl auth can-i create deployments -n stock --as=system:serviceaccount:jenkins-agents:jenkins
no
$ kubectl auth can-i create deployments -n stock --as=system:serviceaccount:jenkins-agents:deployer
yes
$ kubectl auth can-i create deployments -n default --as=system:serviceaccount:jenkins-agents:deployer
no
$ kubectl auth can-i create rolebindings -n stock --as=system:serviceaccount:jenkins-agents:deployer
no` },
  { t: 'p', text: 'Read the three values the cloud configuration needs: the token (store it as a **Secret text** credential, ID `k8s-jenkins-token`, Module 3 — never print it in a shared terminal), the internal address of the API server, and its certificate authority:' },
  { t: 'cmd', where: 'Your terminal', cmd: `kubectl -n jenkins-agents get secret jenkins-token -o jsonpath='{.data.token}' | base64 -d    # → the credential
kind get kubeconfig --name lab --internal | grep server
kind get kubeconfig --name lab --internal | grep certificate-authority-data | awk '{print $2}' | base64 -d    # → the CA`, out: `    server: https://lab-control-plane:6443`, note: 'Only the second command is shown: the first prints a secret, the third a long certificate. `--internal` gives the address seen from the Docker network (`lab-control-plane:6443`), not from your machine.' },
  { t: 'shot', id: 'm8-01-plugin-kubernetes', titre: 'Available plugins: Kubernetes', ce: 'The plugin that turns a cluster into a source of agents.', éléments: ['Search *Kubernetes*.', 'Tick **Kubernetes** (version 4560.vc25b_83890c34) — not the many other plugins with Kubernetes in their name.', 'Health score.', '**Install**: it brings *Kubernetes Client API* and *Kubernetes Credentials*.'], actions: ['Install, no restart needed.'], résultat: '**Manage Jenkins → Clouds** offers the Kubernetes type.' },
  { t: 'shot', id: 'm8-02-new-cloud', titre: 'Manage Jenkins → Clouds → New cloud', ce: 'A cloud is a source of agents created on demand.', éléments: ['**Cloud name**: `kind-lab`.', '**Type**: Kubernetes.', '**Create**.'], actions: ['Fill in, click **Create**.'], résultat: 'The configuration form opens.' },
  { t: 'shot', id: 'm8-03-cloud-config', titre: 'The Kubernetes cloud: connection', ce: 'Where the API server is, how to trust it, who Jenkins is.', éléments: ['**Kubernetes URL**: `https://lab-control-plane:6443`.', '**Kubernetes server certificate key**: the CA printed above (a public certificate, not a secret) — never tick *Disable https certificate check*.', '**Kubernetes Namespace**: `jenkins-agents`.', '**Credentials**: the token of the ServiceAccount `jenkins`.', '**Test Connection**: *Connected to Kubernetes v1.37.0*.'], actions: ['Fill in, click **Test Connection**.'], résultat: 'Jenkins talks to the cluster.' },
  { t: 'shot', id: 'm8-04-cloud-jenkins-url', titre: 'The Kubernetes cloud: how the pods reach Jenkins', ce: 'The lower part of the form, after the fix of section 8.10.', éléments: ['The credential.', 'Test Connection.', '**WebSocket**: agents connect over HTTP, no port 50000 to open.', '**Jenkins URL**: `http://jenkins:8080` — the address as seen **from the pods**, not `localhost`.'], actions: ['Tick WebSocket, set the Jenkins URL, **Save**.'], résultat: 'Pods can connect back to Jenkins.' },

  { t: 'h', id: 'm8-4', text: '8.4 Builds in ephemeral pods' },
  { t: 'p', text: 'With `agent { kubernetes { … } }`, every build gets a **new pod**: a `jnlp` container (the Jenkins agent, added automatically) plus the tool containers you list. No tool to install on a machine, no leftovers from the previous build, as many builds in parallel as the cluster can run.' },
  { t: 'code', lang: 'groovy', file: 'k8s-hello → Configure → Pipeline script', code: JF_K8S_HELLO, lignes: [
    [4, 'The pod template, in plain Kubernetes YAML.'],
    [10, 'A tool container; the plugin adds the `jnlp` container itself.'],
    [12, '`sleep infinity`: the container stays up, Jenkins runs commands in it.'],
    [21, 'Without `container()`, steps run in `jnlp`.'],
    [22, '`container(\'node\')`: these steps run in the `node` container, sharing the same workspace.'],
  ] },
  { t: 'cmd', where: 'k8s-hello #2 → Console Output (real text, excerpt)', cmd: '', out: `Created Pod: kind-lab jenkins-agents/k8s-hello-2-705kh-w7gsx-gn1hv
Agent k8s-hello-2-705kh-w7gsx-gn1hv is provisioned from template k8s-hello_2-705kh-w7gsx
      value: "http://jenkins:8080/"
    image: "jenkins/inbound-agent:3391.va_37fa_a_305d6d-1-jdk25"
Running on k8s-hello-2-705kh-w7gsx-gn1hv in /home/jenkins/agent/workspace/k8s-hello
[2026-11-17T16:04:07.769Z] agent: k8s-hello-2-705kh-w7gsx-gn1hv
[2026-11-17T16:04:08.310Z] v26.13.1
[2026-11-17T16:04:08.310Z] 3.24.4
Finished: SUCCESS`, note: 'Jenkins logs the full pod YAML: the `jnlp` image chosen by the plugin, the Jenkins URL given to the agent, the shared workspace volume. When the build ends, the pod is deleted (`kubectl -n jenkins-agents get pods` shows it *Terminating*).' },
  { t: 'callout', kind: 'warning', title: 'A tool container needs a shell', text: 'Steps inside `container()` are run through `sh`. Distroless images — such as the official `registry.k8s.io/kubectl` — contain no shell, and fail (section 8.10). Choose an image with a shell; we use `alpine/k8s:1.37.2` (kubectl 1.37, Helm 4, curl, envsubst).' },

  { t: 'h', id: 'm8-5', text: '8.5 Deploy with YAML manifests' },
  { t: 'p', text: 'Deployment files live in their own repository, `lab/stock-deploy`: the build of the image (Module 7) and its deployment are separate pipelines. A Deployment describes the pods; a Service gives them one stable address.' },
  { t: 'code', lang: 'yaml', file: 'lab/stock-deploy — k8s/deployment.yaml', code: DEPLOYMENT_YAML, lignes: [
    [10, 'Three replicas of the application.'],
    [11, 'Old ReplicaSets kept for `rollout undo`.'],
    [18, '`maxSurge: 1`: one extra pod during an update…'],
    [19, '…`maxUnavailable: 0`: never fewer ready pods than replicas (section 8.6).'],
    [27, '`${VERSION}`: replaced by the pipeline with `envsubst` — the file itself stays generic.'],
    [30, 'Readiness: a pod receives traffic only when `/health` answers.'],
    [33, 'Liveness: a pod that stops answering is restarted.'],
    [37, '`preStop`: 5 seconds of grace before a pod stops (section 8.6).'],
    [41, 'Requests (for scheduling) and a memory limit.'],
    [46, 'Kubernetes refuses `runAsNonRoot` with a named user: give the number (section 8.10).'],
  ] },
  { t: 'code', lang: 'yaml', file: 'lab/stock-deploy — k8s/service.yaml', code: SERVICE_YAML, lignes: [[10, 'The Service sends traffic to every **ready** pod with this label.'], [14, 'The NodePort mapped to your machine by kind.']] },
  { t: 'code', lang: 'groovy', file: 'lab/stock-deploy — Jenkinsfile (version with manifests)', code: JF_DEPLOY_MANIFESTS, lignes: [
    [9, 'The pod runs as `deployer`: the pipeline can change `stock`, nothing else, and no kubeconfig is stored in Jenkins.'],
    [10, 'The whole pod runs as an unprivileged user.'],
    [20, 'kubectl and Helm need a writable home for their caches.'],
    [22, '`defaultContainer`: every step runs in `k8s` without `container()`.'],
    [26, 'The version to deploy, chosen at each run (*Build with Parameters*).'],
    [30, 'Two deployments of the same environment never run at the same time.'],
    [37, 'The first run of a parameterized pipeline has no parameters yet: refuse an empty version instead of deploying `stock-service:`.'],
    [39, 'Check the rights before changing anything.'],
    [47, '`envsubst \'$VERSION\'` replaces only that variable, then the manifest is applied.'],
    [48, 'Wait until the new pods are ready — or fail after 90 seconds.'],
    [51, 'If the rollout failed, go back to the previous version.'],
    [62, 'Smoke test **from inside the cluster**, through the DNS name of the Service.'],
  ] },
  { t: 'p', text: 'Create a Pipeline job `stock-deploy`, *Pipeline script from SCM* on `lab/stock-deploy` (Module 5). Its first runs taught three lessons: the guard of line 37 stopped the run without parameters, a Groovy comment written `#` did not compile (section 8.10), and the first real deployment never became ready:' },
  { t: 'cmd', where: 'stock-deploy #3 (VERSION=1.0.6, first version of deployment.yaml) → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T16:08:05.599Z] + kubectl apply -f k8s/service.yaml
[2026-11-17T16:08:05.599Z] service/stock-service created
[2026-11-17T16:08:05.599Z] + kubectl apply -f -+ 
[2026-11-17T16:08:05.599Z] deployment.apps/stock-service created
[2026-11-17T16:08:05.599Z] + kubectl -n stock rollout status deployment/stock-service '--timeout=90s'
[2026-11-17T16:08:05.859Z] Waiting for deployment "stock-service" rollout to finish: 0 of 3 updated replicas are available...
[2026-11-17T16:09:42.240Z] error: timed out waiting for the condition
[2026-11-17T16:09:42.856Z] pod/stock-service-68994bdbd5-hspw8   0/1     CreateContainerConfigError   0          97s   10.244.0.11   lab-control-plane   <none>           <none>
[2026-11-17T16:09:42.856Z] pod/stock-service-68994bdbd5-whhzd   0/1     CreateContainerConfigError   0          97s   10.244.0.10   lab-control-plane   <none>           <none>
[2026-11-17T16:09:42.856Z] pod/stock-service-68994bdbd5-zdcrn   0/1     CreateContainerConfigError   0          97s   10.244.0.12   lab-control-plane   <none>           <none>
Finished: FAILURE` },
  { t: 'cmd', where: 'Your terminal: why are the pods not starting?', cmd: '', out: `$ kubectl -n stock get pods
NAME                             READY   STATUS                       RESTARTS   AGE
stock-service-68994bdbd5-hspw8   0/1     CreateContainerConfigError   0          47m
stock-service-68994bdbd5-whhzd   0/1     CreateContainerConfigError   0          47m
stock-service-68994bdbd5-zdcrn   0/1     CreateContainerConfigError   0          47m

$ kubectl -n stock describe pod/stock-service-68994bdbd5-hspw8 | tail -6
  ----     ------     ----                  ----               -------
  Normal   Scheduled  47m                   default-scheduler  Successfully assigned stock/stock-service-68994bdbd5-hspw8 to lab-control-plane
  Normal   Pulling    47m                   kubelet            spec.containers{app}: Pulling image "gitea:3000/lab/stock-service:1.0.6"
  Normal   Pulled     47m                   kubelet            spec.containers{app}: Successfully pulled image "gitea:3000/lab/stock-service:1.0.6" in 14ms (53ms including waiting). Image size: 62964946 bytes.
  Warning  Failed     2m3s (x211 over 47m)  kubelet            spec.containers{app}: Error: container has runAsNonRoot and image has non-numeric user (node), cannot verify user is non-root (pod: "stock-service-68994bdbd5-hspw8_stock(de7a817d-a51a-4553-b6e2-55c9ec0ead9c)", container: app)
  Normal   Pulled     2m3s (x210 over 47m)  kubelet            spec.containers{app}: Container image "gitea:3000/lab/stock-service:1.0.6" already present on machine and can be accessed by the pod`, note: 'The image declares `USER node` — a name. With `runAsNonRoot: true`, the kubelet must prove the user is not root and cannot with a name: *non-numeric user (node), cannot verify user is non-root*. Fix: `runAsUser: 1000` (line 46).' },
  { t: 'cmd', where: 'stock-deploy #4 (VERSION=1.0.6) → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T16:55:32.947Z] + kubectl -n stock rollout status deployment/stock-service '--timeout=90s'
[2026-11-17T16:55:36.181Z] deployment "stock-service" successfully rolled out
[2026-11-17T16:55:36.709Z] {"status":"UP","version":"1.0.6"}
[2026-11-17T16:55:37.251Z] deployment.apps/stock-service   3/3     3            3           47m   app          gitea:3000/lab/stock-service:1.0.6   app=stock-service
[2026-11-17T16:55:37.251Z] pod/stock-service-77c85986f5-lt7v8   1/1     Running   0          3s    10.244.0.15   lab-control-plane   <none>           <none>
[2026-11-17T16:55:37.251Z] pod/stock-service-77c85986f5-pf56t   1/1     Running   0          2s    10.244.0.16   lab-control-plane   <none>           <none>
[2026-11-17T16:55:37.251Z] pod/stock-service-77c85986f5-qnjbh   1/1     Running   0          5s    10.244.0.14   lab-control-plane   <none>           <none>
Finished: SUCCESS` },
  { t: 'cmd', where: 'Your terminal', cmd: 'curl -s http://localhost:30080/health', out: `{"status":"UP","version":"1.0.6"}` },

  { t: 'h', id: 'm8-6', text: '8.6 Rolling updates without downtime' },
  { t: 'p', text: 'A rolling update replaces pods one by one. Is it really invisible to users? Measure it: call the service every 0.2 s during a deployment, in a second terminal:' },
  { t: 'cmd', where: 'A second terminal, during the deployment', cmd: `end=$((SECONDS+80)); while [ $SECONDS -lt $end ]; do
  r=$(curl -s -m 2 -w ' %{http_code}' http://localhost:30080/health); echo "$(date +%T.%N | cut -c1-12) $r" >> sonde-rolling.txt; sleep 0.2
done`, out: '', note: 'Each line: the time, the answer, the HTTP code (`000` = no answer at all).' },
  { t: 'cmd', where: 'Your terminal, after deploying 1.0.7 over 1.0.6 (first version: no preStop)', cmd: '', out: `$ awk '{print $NF}' sonde-rolling.txt | sort | uniq -c
      5 000
    371 200
$ grep -o '"version":"[0-9.]*"' sonde-rolling.txt | uniq -c
     94 "version":"1.0.6"
      3 "version":"1.0.7"
     13 "version":"1.0.6"
    261 "version":"1.0.7"`, note: '**5 requests out of 376 failed**, although `maxUnavailable: 0` kept three ready pods. The failures happened exactly when old pods stopped: a stopping pod closes its connections immediately, while the Service — updated asynchronously — still sends it traffic for a moment.' },
  { t: 'p', text: 'The fix is the `preStop` hook of the manifest (lines 37–40): Kubernetes removes the pod from the Service, waits 5 seconds, and only then stops it. Same measure, next deployment (1.0.7 → 1.0.6):' },
  { t: 'cmd', where: 'Your terminal, after deploying 1.0.6 over 1.0.7 (with preStop)', cmd: '', out: `$ awk '{print $NF}' sonde-prestop.txt | sort | uniq -c
    422 200
$ grep -o '"version":"[0-9.]*"' sonde-prestop.txt | uniq -c
    116 "version":"1.0.7"
    306 "version":"1.0.6"`, note: '**422 requests out of 422 answered.** Zero downtime needs all three: readiness probes, `maxUnavailable: 0` and a short `preStop` delay.' },

  { t: 'h', id: 'm8-7', text: '8.7 When a deployment fails' },
  { t: 'p', text: 'Version `9.9.9` does not exist in the registry. We deployed it on purpose, still measuring:' },
  { t: 'cmd', where: 'Your terminal, 45 s after the start of stock-deploy #8 (VERSION=9.9.9)', cmd: 'kubectl -n stock get pods', out: `NAME                             READY   STATUS         RESTARTS   AGE
stock-service-595895494b-ln2gb   1/1     Running        0          2m9s
stock-service-595895494b-wlm7j   1/1     Running        0          2m8s
stock-service-595895494b-zj7cz   1/1     Running        0          2m7s
stock-service-86c5987f4d-69wfm   0/1     ErrImagePull   0          31s`, note: 'The new pod cannot pull its image; the three old pods keep serving: `maxUnavailable: 0` never removes a ready pod before its replacement is ready. The probe recorded **482 successful answers out of 482**, all from 1.0.6.' },
  { t: 'cmd', where: 'stock-deploy #8 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T17:02:57.187Z] error: timed out waiting for the condition
[2026-11-17T17:02:57.745Z] + kubectl -n stock rollout undo deployment/stock-service
[2026-11-17T17:02:57.745Z] Warning: resource deployments/stock-service was previously managed with 'kubectl apply'. Rolling back will not update the kubectl.kubernetes.io/last-applied-configuration annotation, which may cause unexpected behavior on future 'kubectl apply' operations. Consider using 'kubectl apply' with your previous configuration file instead.
[2026-11-17T17:02:57.745Z] deployment.apps/stock-service rolled back
[2026-11-17T17:02:57.745Z] deployment "stock-service" successfully rolled out
Finished: FAILURE`, note: 'The `post { failure }` of the Deploy stage rolled back automatically. kubectl warns that `rollout undo` does not update the annotation used by `kubectl apply`: the cluster and the files in Git now disagree until the next apply. Helm solves this.' },

  { t: 'h', id: 'm8-8', text: '8.8 Helm: one package, versioned releases' },
  { t: 'p', text: '**Helm** packages manifests as a **chart**: templates plus default values. Each `helm upgrade` creates a numbered **revision** of the **release**, stored in the cluster, so that `helm rollback` returns exactly to a previous state.' },
  { t: 'code', lang: 'yaml', file: 'lab/stock-deploy — charts/stock-service/Chart.yaml', code: CHART_YAML, lignes: [[5, 'A chart for an application (the other type, `library`, only shares templates).'], [6, 'The version of the chart itself, bumped when the templates change.'], [7, 'The default version of the application.']] },
  { t: 'code', lang: 'yaml', file: 'lab/stock-deploy — charts/stock-service/values.yaml', code: VALUES_YAML, lignes: [
    [5, 'Empty: the template uses `appVersion`; the pipeline passes `--set image.tag=<version>`.'],
    [6, 'A label that distinguishes a canary from the stable release (section 8.9).'],
    [8, 'A canary release reuses the Service of the stable one.'],
  ] },
  { t: 'code', lang: 'yaml', file: 'lab/stock-deploy — charts/stock-service/templates/deployment.yaml', code: TPL_DEPLOYMENT, lignes: [
    [5, '`{{ .Release.Name }}`: the Deployment is named after the release — two releases of one chart can coexist.'],
    [17, 'The selector includes the track: the stable and the canary Deployments never claim each other\'s pods.'],
    [31, 'The image: the tag given at install time, or the `appVersion` of the chart.'],
    [44, 'Values are injected where the manifest had fixed numbers.'],
    [46, '`toYaml … | nindent 12`: copy a whole block of values, indented.'],
  ] },
  { t: 'code', lang: 'yaml', file: 'lab/stock-deploy — charts/stock-service/templates/service.yaml', code: TPL_SERVICE, lignes: [[2, 'The Service exists only in releases that ask for it.'], [10, 'Every track receives traffic, in proportion to its number of pods.']] },
  { t: 'p', text: 'The Deploy stage of the Jenkinsfile becomes one Helm command (the rest of the file is unchanged):' },
  { t: 'code', lang: 'groovy', file: 'lab/stock-deploy — Jenkinsfile, Deploy stage (Helm version)', code: JF_DEPLOY_HELM_STAGE, lignes: [
    [4, '`upgrade --install`: installs the release the first time, upgrades it afterwards — the same command every time.'],
    [6, 'The version to deploy.'],
    [7, '`--rollback-on-failure` (Helm 4; `--atomic` in Helm 3): wait until every resource is ready, and roll back if it does not happen within 2 minutes.'],
    [8, 'The last revisions, in the log of every deployment.'],
  ] },
  { t: 'p', text: 'The first Helm run failed — and that is a safety feature:' },
  { t: 'cmd', where: 'stock-deploy #9 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T17:05:00.813Z] + helm upgrade --install stock-service charts/stock-service --namespace stock --set 'image.tag=1.0.7' --rollback-on-failure --timeout 2m
[2026-11-17T17:05:00.813Z] Release "stock-service" does not exist. Installing it now.
[2026-11-17T17:05:00.813Z] Error: unable to continue with install: Service "stock-service" in namespace "stock" exists and cannot be imported into the current release: invalid ownership metadata; label validation error: missing key "app.kubernetes.io/managed-by": must be set to "Helm"; annotation validation error: missing key "meta.helm.sh/release-name": must be set to "stock-service"; annotation validation error: missing key "meta.helm.sh/release-namespace": must be set to "stock"
Finished: FAILURE`, note: 'Helm refuses to take over objects created by `kubectl apply`. Here the migration was done once, by hand — a few seconds without the service in our lab; in production, migrate during a maintenance window or under new names.' },
  { t: 'cmd', where: 'Your terminal (cluster administrator), once', cmd: '', out: `$ kubectl -n stock delete deployment/stock-service service/stock-service
deployment.apps "stock-service" deleted from stock namespace
service "stock-service" deleted from stock namespace` },
  { t: 'cmd', where: 'stock-deploy #10 (VERSION=1.0.7) → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T17:05:32.654Z] + helm upgrade --install stock-service charts/stock-service --namespace stock --set 'image.tag=1.0.7' --rollback-on-failure --timeout 2m
[2026-11-17T17:05:32.654Z] Release "stock-service" does not exist. Installing it now.
[2026-11-17T17:05:34.031Z] STATUS: deployed
[2026-11-17T17:05:34.031Z] REVISION: 1
[2026-11-17T17:05:34.031Z] DESCRIPTION: Install complete
[2026-11-17T17:05:34.031Z] 1       	Tue Nov 17 17:05:32 2026	deployed	stock-service-0.1.0	1.0.7      	Install complete
[2026-11-17T17:05:34.541Z] {"status":"UP","version":"1.0.7"}
Finished: SUCCESS` },
  { t: 'p', text: 'Then the failing version again, `9.9.9`, this time with Helm:' },
  { t: 'cmd', where: 'stock-deploy #11 (VERSION=9.9.9) → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T17:06:01.062Z] + helm upgrade --install stock-service charts/stock-service --namespace stock --set 'image.tag=9.9.9' --rollback-on-failure --timeout 2m
[2026-11-17T17:08:07.468Z] level=WARN msg="upgrade failed" name=stock-service error="resource Deployment/stock/stock-service not ready. status: InProgress, message: Updated: 1/3\\ncontext deadline exceeded"
[2026-11-17T17:08:07.468Z] Error: UPGRADE FAILED: release stock-service failed, and has been rolled back due to rollback-on-failure being set: resource Deployment/stock/stock-service not ready. status: InProgress, message: Updated: 1/3
[2026-11-17T17:08:07.468Z] context deadline exceeded
Finished: FAILURE` },
  { t: 'cmd', where: 'Your terminal', cmd: 'helm history stock-service -n stock', out: `REVISION	UPDATED                 	STATUS    	CHART              	APP VERSION	DESCRIPTION                                                                                                                 
1       	Tue Nov 17 17:05:32 2026	superseded	stock-service-0.1.0	1.0.7      	Install complete                                                                                                            
2       	Tue Nov 17 17:06:00 2026	failed    	stock-service-0.1.0	1.0.7      	Upgrade "stock-service" failed: resource Deployment/stock/stock-service not ready. status: InProgress, message: Updated: ...
3       	Tue Nov 17 17:08:01 2026	deployed  	stock-service-0.1.0	1.0.7      	Rollback to 1                                                                                                               `, note: 'Revision 2 failed; Helm created revision 3, *Rollback to 1*, by itself. The cluster, the release history and the chart stay consistent. The probe: 544 answers out of 544 during the incident.' },
  { t: 'shot', id: 'm8-05-deploy-params', titre: 'stock-deploy → Build with Parameters', ce: 'The parameter of the Jenkinsfile, as a form.', éléments: ['**VERSION**: the image tag to deploy.', '**Build**.'], actions: ['Type a version, click **Build**.'], résultat: 'A deployment of exactly that version.' },
  { t: 'shot', id: 'm8-06-deploy-stages', titre: 'stock-deploy #13: the stages', ce: 'A Helm deployment, run in a pod of the cluster.', éléments: ['**Deploy**: `helm upgrade --install`.', '**Smoke test**: from inside the cluster.', 'The agent: a pod `stock-deploy-13-…`, deleted after the build.', 'The `post` section: the state of the Deployment.'], actions: ['Click a stage to read its log.'], résultat: 'Every deployment leaves a readable trace.' },
  { t: 'shot', id: 'm8-07-deploy-history', titre: 'stock-deploy: the job page', ce: 'The history of the deployments of one environment.', éléments: ['**Build with Parameters**.', 'The builds, failed and successful: who deployed what, when.'], actions: ['Open a failed build: its console explains the failure.'], résultat: 'The deployment journal of `stock`.' },

  { t: 'h', id: 'm8-9', text: '8.9 Deployment strategies' },
  { t: 'table', head: ['Strategy', 'How', 'Pros', 'Cons'], rows: [
    ['**Recreate**', '`strategy: Recreate`: stop all old pods, start the new ones', 'Simple; never two versions at once', 'Downtime'],
    ['**Rolling update**', 'The default: replace pods progressively (`maxSurge`, `maxUnavailable`)', 'No downtime (section 8.6); no extra capacity', 'Two versions serve together for a while'],
    ['**Blue/green**', 'Two complete Deployments; the Service selector switches from one to the other', 'Instant switch and instant way back', 'Twice the capacity during the release'],
    ['**Canary**', 'A few pods of the new version behind the same Service, then promotion', 'Real traffic on a small share first', 'Needs monitoring to decide; two versions together'],
  ] },
  { t: 'p', text: 'A real canary with the chart: a second release with one pod of 1.0.7, `track=canary`, no Service of its own — next to the stable release in 1.0.6 with three pods:' },
  { t: 'cmd', where: 'Your terminal, in lab/stock-deploy', cmd: '', out: `$ helm install stock-service-canary charts/stock-service --namespace stock --set track=canary --set replicaCount=1 --set service.enabled=false --set image.tag=1.0.7 --wait
NAME: stock-service-canary
LAST DEPLOYED: Tue Nov 17 17:09:06 2026
NAMESPACE: stock
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
TEST SUITE: None

$ kubectl -n stock get pods -L track
NAME                                    READY   STATUS    RESTARTS   AGE   TRACK
stock-service-5cdf5f444b-dhfn4          1/1     Running   0          7s    stable
stock-service-5cdf5f444b-nz662          1/1     Running   0          8s    stable
stock-service-5cdf5f444b-sczch          1/1     Running   0          10s   stable
stock-service-canary-78784b9556-rgqsr   1/1     Running   0          4s    canary

$ for i in $(seq 1 200); do curl -s http://localhost:30080/health; echo; done | sort | uniq -c
    151 {"status":"UP","version":"1.0.6"}
     49 {"status":"UP","version":"1.0.7"}`, note: '**49 answers out of 200 (24.5 %)** came from the canary: one pod out of four. Watch its errors and latency (Module 10: Prometheus), then promote — or uninstall it, and nobody else noticed.' },
  { t: 'cmd', where: 'Promotion: stock-deploy #13 with VERSION=1.0.7, then', cmd: '', out: `$ helm uninstall stock-service-canary --namespace stock
release "stock-service-canary" uninstalled

$ helm list --namespace stock
NAME         	NAMESPACE	REVISION	UPDATED                                	STATUS  	CHART              	APP VERSION
stock-service	stock    	5       	2026-11-17 17:09:35.660965232 +0000 UTC	deployed	stock-service-0.1.0	1.0.7      

$ for i in $(seq 1 100); do curl -s http://localhost:30080/health; echo; done | sort | uniq -c
    100 {"status":"UP","version":"1.0.7"}` },
  { t: 'callout', kind: 'enterprise', text: 'In production, strategies are often automated by tools that read metrics and decide: Argo Rollouts or Flagger (progressive delivery), a service mesh or an ingress controller for precise traffic weights (5 %, 25 %, 50 %). Many companies also move the last step to **GitOps**: Jenkins builds, tests and updates the version in a Git repository; Argo CD or Flux applies it to the cluster.' },
  { t: 'callout', kind: 'info', title: 'Jenkins and Ansible', text: 'For Kubernetes, the deployment tool is kubectl or Helm, called by Jenkins. Ansible has modules for both (`kubernetes.core.k8s`, `kubernetes.core.helm`) and is useful when one release must change a cluster **and** classic servers (DNS, load balancers, databases) in one playbook — Module 10.' },

  { t: 'h', id: 'm8-10', text: '8.10 Common errors and fixes' },
  { t: 'errors', rows: [
    ['Build waits forever: *Still waiting to schedule task*, the agent pod is Running, its log says `http://localhost:8080/login is not ready … Connection refused`', 'The cloud has no Jenkins URL: pods use the URL of the controller, `localhost`, which is themselves.', '**Jenkins URL** of the cloud: an address reachable from the pods (`http://jenkins:8080` here); WebSocket ticked.'],
    ['`CreateContainerConfigError` — *container has runAsNonRoot and image has non-numeric user (node), cannot verify user is non-root*', 'The image declares its user by name.', '`runAsUser: <uid>` in the securityContext (1000 for `node`).'],
    ['`ErrImagePull` / `ImagePullBackOff`, *rollout status* times out', 'Wrong tag, private registry without credentials, or a registry the node cannot reach.', '`kubectl describe pod` gives the exact reason; fix the tag, the pull secret or the registry configuration.'],
    ['`Error: unable to continue with install: Service "stock-service" … exists and cannot be imported into the current release: invalid ownership metadata`', 'The objects were created by `kubectl apply`, not by Helm.', 'Migrate once: delete and reinstall, or install under new names.'],
    ['`Warning: … was previously managed with \'kubectl apply\'. Rolling back will not update the kubectl.kubernetes.io/last-applied-configuration annotation`', '`rollout undo` changes the cluster, not the files.', 'Re-apply the previous files, or use Helm rollbacks.'],
    ['`deployments.apps is forbidden: User "system:serviceaccount:jenkins-agents:deployer" cannot create resource "deployments" … in the namespace "default"`', 'RBAC works: `deployer` has rights in `stock` only.', 'Deploy to the right namespace — do not widen the role.'],
    ['`exec: "sh": executable file not found in $PATH` in a tool container', 'A distroless image (no shell).', 'An image with a shell for `container()` steps.'],
    ['`WorkflowScript: 22: unexpected char: \'#\'`', 'A YAML comment (`#`) written in the Groovy part of the Jenkinsfile.', '`//` in Groovy; `#` only inside the YAML string.'],
    ['A few failed requests during every deployment', 'Pods stop before the Service forgets them.', 'Readiness probes, `maxUnavailable: 0`, `preStop` delay (section 8.6).'],
  ] },
  { t: 'p', text: 'Four of them, as they appeared:' },
  { t: 'cmd', where: 'k8s-hello #1 → logs of the jnlp container (real text, excerpt)', cmd: 'kubectl -n jenkins-agents logs <pod> -c jnlp', out: `INFO: Using Remoting version: 3391.va_37fa_a_305d6d
INFO: http://localhost:8080/login is not ready
java.net.ConnectException: Connection refused
INFO: Waiting 1 second before retry
INFO: http://localhost:8080/login is not ready
java.net.ConnectException: Connection refused
INFO: http://localhost:8080/login is not ready
java.net.ConnectException: Connection refused` },
  { t: 'cmd', where: 'Your terminal', cmd: 'kubectl --as=system:serviceaccount:jenkins-agents:deployer -n default create deployment essai --image=busybox:1.37', out: `error: failed to create deployment: deployments.apps is forbidden: User "system:serviceaccount:jenkins-agents:deployer" cannot create resource "deployments" in API group "apps" in the namespace "default"` },
  { t: 'cmd', where: 'Your terminal', cmd: "docker run --rm --entrypoint sh registry.k8s.io/kubectl:v1.37.2 -c 'echo hello'", out: `docker: Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: exec: "sh": executable file not found in $PATH

Run 'docker run --help' for more information` },
  { t: 'cmd', where: 'stock-deploy #1 → Console Output (real text, excerpt)', cmd: '', out: `WorkflowScript: 22: unexpected char: '#' @ line 22, column 59.
    'k8s'                        # steps ru
                                 ^` },

  { t: 'h', id: 'm8-11', text: '8.11 Hands-on labs' },
  { t: 'lab', id: 'lab81', titre: 'Lab 8.1 — A cluster that Jenkins can use', durée: '45 min', objectif: 'kind cluster, least-privilege accounts, Kubernetes cloud connected.', étapes: [
    { t: 'p', text: '**1.** Install kind, kubectl and Helm; create the cluster of section 8.2; connect it to the lab network and to the registry of Gitea.' },
    { t: 'p', text: '**2.** Apply `jenkins-rbac.yaml`; check the five `kubectl auth can-i` of section 8.3.' },
    { t: 'p', text: '**3.** Install the Kubernetes plugin, store the token as a credential, create the cloud `kind-lab`, **Test Connection**.' },
  ], solution: [
    { t: 'ul', items: ['Step 2: `yes, no, yes, no, no` — `jenkins` manages pods only; `deployer` changes `stock` only and cannot grant roles.', 'Step 3: *Connected to Kubernetes v1.37.0*. Do not forget the Jenkins URL (Lab 8.2).'] },
  ] },
  { t: 'lab', id: 'lab82', titre: 'Lab 8.2 — Your first pod agent', durée: '20 min', objectif: 'Run a build in a pod and watch the pod live and die.', étapes: [
    { t: 'p', text: '**1.** Create the job `k8s-hello` with the Jenkinsfile of section 8.4. Leave the Jenkins URL of the cloud empty and build. What happens?' },
    { t: 'p', text: '**2.** Read the log of the `jnlp` container; set the Jenkins URL; build again.' },
    { t: 'p', text: '**3.** During the build, run `kubectl -n jenkins-agents get pods -w` in a terminal.' },
  ], solution: [
    { t: 'ul', items: ['Step 1: the pod runs but the build waits (*Still waiting to schedule task*): the agent tries `http://localhost:8080`.', 'Step 2: *v26.13.1*, *3.24.4*, SUCCESS.', 'Step 3: the pod goes Pending → Running → Terminating in a few seconds.'] },
  ] },
  { t: 'lab', id: 'lab83', titre: 'Lab 8.3 — Deploy, measure, fail safely', durée: '45 min', objectif: 'Deploy with manifests, prove zero downtime, survive a bad version.', étapes: [
    { t: 'p', text: '**1.** Create `lab/stock-deploy` with the manifests and the Jenkinsfile of section 8.5 — but without `runAsUser` and without `preStop`. Deploy 1.0.6. Diagnose and fix.' },
    { t: 'p', text: '**2.** Run the probe of section 8.6 and deploy 1.0.7. Count the failures. Add the `preStop` hook, apply it, then measure the next deployment.' },
    { t: 'p', text: '**3.** Deploy `9.9.9`. Is the service available? What does the pipeline do?' },
  ], solution: [
    { t: 'ul', items: ['Step 1: `CreateContainerConfigError`, *non-numeric user (node)* → `runAsUser: 1000`.', 'Step 2: a few `000` without preStop (5 in our run); none with it (422/422).', 'Step 3: yes — old pods keep serving (482/482); the rollout times out and `post { failure }` runs `rollout undo`.'] },
  ] },
  { t: 'lab', id: 'lab84', titre: 'Lab 8.4 — Helm and a canary', durée: '40 min', objectif: 'Move to Helm, see an automatic rollback, run a canary.', étapes: [
    { t: 'p', text: '**1.** Add the chart of section 8.8 and the Helm Deploy stage. Deploy 1.0.7: what does Helm say? Migrate, deploy again.' },
    { t: 'p', text: '**2.** Deploy `9.9.9`, then read `helm history`.' },
    { t: 'p', text: '**3.** Deploy 1.0.6, install the canary release in 1.0.7, send 200 requests and count the versions. Promote, then uninstall the canary.' },
  ], solution: [
    { t: 'ul', items: ['Step 1: *invalid ownership metadata*; after the migration, revision 1, *Install complete*.', 'Step 2: *UPGRADE FAILED … has been rolled back*; history: failed, then *Rollback to 1*.', 'Step 3: about one answer in four from 1.0.7 (49/200 in our run); after promotion, 100/100 from 1.0.7.'] },
  ] },
  { t: 'exercise', id: 'ex85', titre: 'Exercise 8.5 — Choose the strategy', énoncé: [
    { t: 'p', text: 'Which strategy for: (a) an internal tool used by 10 people, upgraded on Sunday; (b) a payment API whose new version changes the fraud rules; (c) a version that must be switched at a precise time, with an immediate way back; (d) a stateless web front-end deployed 20 times a day?' },
  ], solution: [
    { t: 'ul', items: ['(a) Recreate is acceptable: simple, the downtime is harmless.', '(b) Canary: a small share of real traffic first, watched closely.', '(c) Blue/green: switch the Service selector at the chosen time, switch back if needed.', '(d) Rolling update with probes and preStop: zero downtime, no extra capacity.'] },
  ] },

  { t: 'recap', items: [
    'Jenkins can deploy to Kubernetes, run its agents in Kubernetes, or run in Kubernetes itself.',
    'kind gives a real cluster in Docker; Jenkins gets least-privilege service accounts: one to create agent pods, one to deploy to one namespace.',
    'The Kubernetes plugin creates a fresh pod per build; the cloud needs the API URL, its CA, a token, and a Jenkins URL reachable from the pods.',
    'A deployment pipeline: check, deploy, wait for the rollout, smoke test, roll back on failure.',
    'Zero downtime needs readiness probes, `maxUnavailable: 0` and a `preStop` delay — measured, not assumed.',
    'Helm releases are versioned: `upgrade --install --rollback-on-failure` and `helm history` keep cluster and history consistent.',
    'Rolling, blue/green and canary trade simplicity, capacity and risk.',
  ] },
  { t: 'quiz', id: 'quiz8', questions: [
    { q: 'What does kind run?', choix: ['Virtual machines', 'Kubernetes nodes as Docker containers', 'A cloud cluster', 'Only kubectl'], bonne: 1, pourquoi: 'One container per node: `lab-control-plane`.' },
    { q: 'Why two service accounts, jenkins and deployer?', choix: ['Kubernetes requires two', 'Least privilege: one only manages agent pods, the other only changes the namespace stock', 'For speed', 'One per plugin'], bonne: 1, pourquoi: '`kubectl auth can-i` proved each limit.' },
    { q: 'Agent pods run but builds wait forever. First suspect?', choix: ['The token', 'The Jenkins URL of the cloud (localhost)', 'The namespace', 'The plugin version'], bonne: 1, pourquoi: 'The jnlp log: *http://localhost:8080/login is not ready*.' },
    { q: 'What runs in the jnlp container?', choix: ['The application', 'The Jenkins agent, added by the plugin', 'Docker', 'Helm'], bonne: 1, pourquoi: 'Tool containers are the ones you declare.' },
    { q: '`runAsNonRoot: true` and `CreateContainerConfigError`. Why?', choix: ['The image is root', 'The image user is a name, the kubelet cannot verify it', 'The registry is HTTP', 'Too little memory'], bonne: 1, pourquoi: 'Give `runAsUser: 1000`.' },
    { q: 'With maxUnavailable: 0 and readiness probes, our rolling update still lost 5 requests. The fix?', choix: ['More replicas', 'A preStop delay', 'Recreate', 'A bigger timeout'], bonne: 1, pourquoi: 'Then 422/422.' },
    { q: 'Version 9.9.9 does not exist. During the failed rollout, users…', choix: ['get errors', 'keep being served by the old pods', 'see 9.9.9', 'are disconnected'], bonne: 1, pourquoi: '482/482: no ready pod is removed before its replacement is ready.' },
    { q: 'What does `helm upgrade --install --rollback-on-failure` add over kubectl apply?', choix: ['Nothing', 'A versioned release, waiting for readiness, and an automatic rollback', 'Faster pulls', 'Encryption'], bonne: 1, pourquoi: 'Revision 3: *Rollback to 1*.' },
    { q: 'Why did the first Helm install fail?', choix: ['Bad chart', 'The objects existed and were not managed by Helm', 'No rights', 'Wrong version'], bonne: 1, pourquoi: '*invalid ownership metadata*.' },
    { q: 'One canary pod next to three stable pods behind one Service. Share of traffic to the canary?', choix: ['0 %', 'About 25 %', '50 %', '100 %'], bonne: 1, pourquoi: '49 answers out of 200 in our run.' },
  ] },
  { t: 'checklist', id: 'm8', items: [
    'My kind cluster runs, reaches Jenkins and Gitea, and pulls from the registry of Gitea.',
    'jenkins and deployer have only the rights I checked with kubectl auth can-i.',
    'The cloud kind-lab passes Test Connection and builds run in pods.',
    'My deployment pipeline waits for the rollout, runs a smoke test and rolls back on failure.',
    'I measured a rolling update without failed requests.',
    'My Helm release has a history, and a failed upgrade rolled back by itself.',
    'I ran a canary and can explain when to prefer blue/green.',
  ] },
]

export default MODULE8
