// Module 10 — Jenkins and DevOps tools. Six real tools connected to the same lab controller: Ansible
// (SSH to app-1/app-2), Terraform (plan/approve/apply against the Kubernetes cluster, state locked there),
// SonarQube (a real quality gate, including a genuine failure and fix), Nexus (a least-privilege publish
// account), Prometheus and Grafana (the controller's own metrics). Artifactory is explained, not run: it
// needs a JFrog account this lab does not have. Every console output, error and screenshot below is real
// (Jenkins 2.580.2 LTS, 2026-11-17); diagrams are illustrations, clearly labelled.
import { LAB } from './plan.js'

export const COMPOSE_ANSIBLE_NODES = `  app-1:
    build: ./managed-node                     # Module 10: a server managed by Ansible, like a fresh VM (SSH, Python 3, sudo)
    image: lab/managed-node:1
    container_name: app-1
    restart: unless-stopped
    environment:
      DEPLOY_PUBKEY: \${ANSIBLE_PUBKEY}        # public key of the Ansible credential, for the user "deploy" (read from .env)
    ports:
      - "8091:80"                             # the site Ansible deploys on app-1 -> http://localhost:8091

  app-2:
    image: lab/managed-node:1                 # same template, its own host keys (created at its first start)
    container_name: app-2
    restart: unless-stopped
    environment:
      DEPLOY_PUBKEY: \${ANSIBLE_PUBKEY}
    ports:
      - "8092:80"                             # -> http://localhost:8092
`

export const ENTRYPOINT_MANAGED_NODE = `#!/bin/sh
set -e
# Host keys are created at the first start of each server, never baked into the image.
ssh-keygen -A
# The public key allowed to log in as deploy (given by docker-compose.yml).
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
printf '%s\\n' "$DEPLOY_PUBKEY" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
# Like a VM booting: start the services installed and enabled by Ansible (none on the first start).
for s in /etc/rc2.d/S*; do
  case "$s" in *ssh) continue ;; esac        # sshd runs in the foreground, below
  [ -x "$s" ] && "$s" start || true
done
mkdir -p /run/sshd
exec /usr/sbin/sshd -D -e
`

export const ANSIBLE_CFG = `# Settings read by ansible-playbook when it runs from this folder (the Jenkins workspace)
[defaults]
inventory = inventories/staging/hosts.ini
interpreter_python = /usr/bin/python3
stdout_callback = default
result_format = yaml

[ssh_connection]
# Trust only the host keys pinned in this repository (checked against the fingerprints of the servers)
ssh_common_args = -o UserKnownHostsFile=./known_hosts -o StrictHostKeyChecking=yes
`

export const HOSTS_INI = `# Staging: the web servers of the lab
[web]
app-1
app-2
`

export const SITE_YML = `---
- name: Deploy the stock web page on the web servers
  hosts: web
  become: true                      # installing packages and writing /etc needs root: sudo, as "deploy"
  vars:
    app_version: "0.0.0"            # Jenkins passes the real one: -e app_version=…
  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true
        cache_valid_time: 3600

    - name: Create the folder of this release
      ansible.builtin.file:
        path: "{{ site_root }}/releases/{{ app_version }}"
        state: directory
        mode: "0755"

    - name: Write the page of this release
      ansible.builtin.template:
        src: templates/index.html.j2
        dest: "{{ site_root }}/releases/{{ app_version }}/index.html"
        mode: "0644"

    - name: Make this release the current one
      ansible.builtin.file:
        src: "{{ site_root }}/releases/{{ app_version }}"
        dest: "{{ site_root }}/current"
        state: link
        force: true                   # the folder may not exist yet: in check mode nothing is created

    - name: Configure the nginx site
      ansible.builtin.template:
        src: templates/stock-web.conf.j2
        dest: /etc/nginx/sites-available/default
        mode: "0644"
      notify: Reload nginx

    - name: Start nginx, and at every boot
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
`

export const JENKINSFILE_ANSIBLE = `pipeline {
    agent { label 'linux' }
    options { disableConcurrentBuilds() }
    parameters {
        string(name: 'VERSION', defaultValue: '', description: 'Version to deploy, e.g. 1.0.7')
        booleanParam(name: 'DRY_RUN', defaultValue: false, description: 'Check mode: show what would change, change nothing')
    }
    stages {
        stage('Check') {
            steps {
                sh '[ -n "$VERSION" ] || { echo "VERSION is empty"; exit 1; }'
                sh 'ansible-playbook --version | head -1'
                sh 'ansible-inventory --graph'
                sh 'ansible-playbook site.yml --syntax-check'
            }
        }
        stage('Deploy') {
            steps {
                ansiblePlaybook(
                    installation: 'ansible-2.22',
                    playbook: 'site.yml',
                    inventory: 'inventories/staging/hosts.ini',
                    credentialsId: 'ansible-ssh-key',
                    extraVars: [app_version: params.VERSION],
                    checkMode: params.DRY_RUN,
                    extras: '--diff')
            }
        }
        stage('Smoke test') {
            when { expression { !params.DRY_RUN } }
            steps {
                sh '''
                    for h in app-1 app-2; do
                        curl -fsS "http://$h/" | grep -q "Stock web $VERSION" || { echo "$h does not serve $VERSION"; exit 1; }
                        echo "$h serves $VERSION"
                    done
                '''
            }
        }
    }
}
`

export const ANSIBLE_ADHOC = `pipeline {
    agent { label 'linux' }
    parameters {
        string(name: 'PATTERN', defaultValue: 'web', description: 'Hosts or group of the inventory')
        string(name: 'COMMAND', defaultValue: 'uptime', description: 'Command to run on each host')
    }
    stages {
        stage('Ad-hoc') {
            steps {
                git url: 'http://gitea:3000/lab/stock-ansible.git', branch: 'main', credentialsId: 'gitea-jenkins-bot'
                withCredentials([sshUserPrivateKey(credentialsId: 'ansible-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh 'ansible "$PATTERN" -u "$SSH_USER" --private-key "$SSH_KEY" -m ansible.builtin.ping'
                    sh 'ansible "$PATTERN" -u "$SSH_USER" --private-key "$SSH_KEY" -m ansible.builtin.command -a "$COMMAND"'
                }
            }
        }
    }
}
`

export const TF_VERSIONS = `terraform {
  required_version = ">= 1.17.0, < 2.0.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 3.5"
    }
  }

  # The state lives in the cluster: Secret tfstate-default-platform, locked by a Lease
  backend "kubernetes" {
    secret_suffix = "platform"
    namespace     = "platform"
  }
}

# Both the provider and the backend read the kubeconfig from KUBE_CONFIG_PATH (given by Jenkins)
provider "kubernetes" {}
`

export const TF_MAIN = `# One namespace per team, with a quota, default limits for containers, and the right to deploy
resource "kubernetes_namespace_v1" "team" {
  for_each = var.teams

  metadata {
    name = "team-\${each.key}"
    labels = {
      team         = each.key
      "managed-by" = "terraform"
    }
  }
}

resource "kubernetes_resource_quota_v1" "team" {
  for_each = var.teams

  metadata {
    name      = "quota"
    namespace = kubernetes_namespace_v1.team[each.key].metadata[0].name
  }
  spec {
    hard = {
      "requests.cpu"    = each.value.cpu
      "requests.memory" = each.value.memory
      pods              = each.value.pods
    }
  }
}

resource "kubernetes_limit_range_v1" "team" {
  for_each = var.teams

  metadata {
    name      = "defaults"
    namespace = kubernetes_namespace_v1.team[each.key].metadata[0].name
  }
  spec {
    limit {
      type            = "Container"
      default_request = { cpu = "100m", memory = "128Mi" }
      default         = { cpu = "500m", memory = "256Mi" }
    }
  }
}

resource "kubernetes_role_binding_v1" "team_edit" {
  for_each = var.teams

  metadata {
    name      = "team-edit"
    namespace = kubernetes_namespace_v1.team[each.key].metadata[0].name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "edit"
  }
  subject {
    kind      = "Group"
    name      = each.value.group
    api_group = "rbac.authorization.k8s.io"
  }
}
`

export const TF_VARIABLES = `variable "teams" {
  description = "Teams that get a namespace: the group allowed to deploy there, and its quota"
  type = map(object({
    group  = string
    cpu    = string
    memory = string
    pods   = number
  }))
}
`

export const TF_OUTPUTS = `output "namespaces" {
  description = "Namespaces created for the teams"
  value       = [for ns in kubernetes_namespace_v1.team : ns.metadata[0].name]
}
`

export const TF_TFVARS = `# The teams: changed through pull requests, applied by Jenkins after approval
teams = {
  stock = {
    group  = "stock-developers"
    cpu    = "2"
    memory = "2Gi"
    pods   = 20
  }
  billing = {
    group  = "billing-developers"
    cpu    = "1"
    memory = "1Gi"
    pods   = 5
  }
}
`

export const JENKINSFILE_TERRAFORM = `pipeline {
    agent { label 'linux' }
    options {
        disableConcurrentBuilds()                   // one plan or apply at a time on this state
    }
    environment {
        TF_IN_AUTOMATION = 'true'                   // shorter messages, written for logs
        TF_INPUT = 'false'                          // never wait for an answer at a keyboard
        TF_CLI_ARGS = '-no-color'                   // plain text in the console: no ANSI colour codes
        TF_PLUGIN_CACHE_DIR = '/home/jenkins/agent/tf-plugin-cache'   // providers downloaded once per agent
    }
    stages {
        stage('Format') {
            steps {
                sh 'terraform fmt -check -diff'
            }
        }
        stage('Plan') {
            steps {
                sh 'mkdir -p "$TF_PLUGIN_CACHE_DIR"'
                withCredentials([file(credentialsId: 'tf-kubeconfig', variable: 'KUBE_CONFIG_PATH')]) {
                    sh 'terraform init'
                    sh 'terraform validate'
                    script {
                        def rc = sh(script: 'terraform plan -out=tfplan -detailed-exitcode', returnStatus: true)
                        if (rc == 1) { error('terraform plan failed') }
                        env.PLAN_CHANGES = (rc == 2) ? 'yes' : 'no'
                    }
                }
                sh 'terraform show tfplan > plan.txt'
                archiveArtifacts artifacts: 'plan.txt'
            }
        }
        stage('Approve') {
            when { environment name: 'PLAN_CHANGES', value: 'yes' }
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    input id: 'apply', message: 'Apply this plan to the cluster lab?', ok: 'Apply', submitter: 'admin'
                }
            }
        }
        stage('Apply') {
            when { environment name: 'PLAN_CHANGES', value: 'yes' }
            steps {
                withCredentials([file(credentialsId: 'tf-kubeconfig', variable: 'KUBE_CONFIG_PATH')]) {
                    sh 'terraform apply tfplan'
                }
            }
        }
    }
}
`

export const TERRAFORM_RBAC = `# ~/jenkins-lab/k8s/terraform-rbac.yaml — what the Terraform pipeline may do in the cluster (Module 10)
apiVersion: v1
kind: Namespace
metadata:
  name: platform                      # the Terraform state (a Secret) and its lock (a Lease) live here
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: terraform
  namespace: platform
---
# 1) The state backend: secrets and leases of the namespace platform, nothing else
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: terraform-state
  namespace: platform
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "create", "update", "delete"]
  - apiGroups: ["coordination.k8s.io"]
    resources: ["leases"]
    verbs: ["get", "list", "create", "update", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: terraform-state
  namespace: platform
subjects:
  - kind: ServiceAccount
    name: terraform
    namespace: platform
roleRef:
  kind: Role
  name: terraform-state
  apiGroup: rbac.authorization.k8s.io
---
# 2) What Terraform manages: namespaces of the teams, their quotas, default limits and access
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: terraform-team-namespaces
rules:
  - apiGroups: [""]
    resources: ["namespaces", "resourcequotas", "limitranges"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["rolebindings"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterroles"]
    resourceNames: ["edit"]
    verbs: ["bind"]                   # may grant the built-in role "edit" in a RoleBinding, and no other role
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: terraform-team-namespaces
subjects:
  - kind: ServiceAccount
    name: terraform
    namespace: platform
roleRef:
  kind: ClusterRole
  name: terraform-team-namespaces
  apiGroup: rbac.authorization.k8s.io
---
# A long-lived token for the ServiceAccount, read once to build the kubeconfig stored in Jenkins
apiVersion: v1
kind: Secret
metadata:
  name: terraform-token
  namespace: platform
  annotations:
    kubernetes.io/service-account.name: terraform
type: kubernetes.io/service-account-token
`

export const COMPOSE_SONARQUBE = `  sonarqube-db:
    image: postgres:17.12-alpine              # Module 10: the database of SonarQube
    container_name: sonarqube-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: \${SONAR_DB_PASSWORD} # read from .env
      POSTGRES_DB: sonarqube
    volumes:
      - sonarqube_db:/var/lib/postgresql/data

  sonarqube:
    image: sonarqube:26.11.0.134175-community # Module 10: SonarQube Community Build, pinned
    container_name: sonarqube
    restart: unless-stopped
    depends_on:
      - sonarqube-db
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://sonarqube-db:5432/sonarqube
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: \${SONAR_DB_PASSWORD}
      SONAR_VALIDATEWEBHOOKS: "false"        # allow webhooks to private addresses (Jenkins on the internal network)
    ulimits:                                  # its Elasticsearch needs many open files and threads
      nofile:
        soft: 131072
        hard: 131072
      nproc: 8192
    ports:
      - "9000:9000"                           # http://localhost:9000
    volumes:
      - sonarqube_data:/opt/sonarqube/data    # Elasticsearch indexes
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs

  nexus:
    image: sonatype/nexus3:3.98.1          # Module 10: a Maven/npm/Docker repository manager
    container_name: nexus
    restart: unless-stopped
    environment:
      INSTALL4J_ADD_VM_PARAMS: "-Xms512m -Xmx768m -XX:MaxDirectMemorySize=768m"   # modest lab footprint
    ports:
      - "8093:8081"                        # Nexus UI and the hosted Maven repository -> http://localhost:8093
    volumes:
      - nexus_data:/nexus-data

  prometheus:
    image: prom/prometheus:v3.16.0           # Module 10: scrapes /prometheus/ on the Jenkins controller
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"                          # http://localhost:9090

  grafana:
    image: grafana/grafana:13.3.1            # Module 10: dashboards over the metrics Prometheus collected
    container_name: grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: \${GRAFANA_ADMIN_PASSWORD}   # read from .env
      GF_USERS_ALLOW_SIGN_UP: "false"
    depends_on:
      - prometheus
    ports:
      - "3001:3000"                          # http://localhost:3001 (3000 is used by other labs on this host)
    volumes:
      - grafana_data:/var/lib/grafana
`

export const JENKINSFILE_SONAR = `// lab/stock-api — Jenkinsfile.sonar: a SonarQube analysis added to an existing Maven project, no change
// to the project's own Jenkinsfile (Module 6). Needs the "SonarQube Scanner" plugin and a server named
// "sonarqube-lab" (Manage Jenkins -> System), and the quality gate webhook configured on that server.
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
                always { junit 'target/surefire-reports/*.xml' }
            }
        }
        stage('SonarQube analysis') {
            steps {
                withSonarQubeEnv('sonarqube-lab') {
                    sh '''
                        mvn -B -ntp -Drevision=$VERSION org.sonarsource.scanner.maven:sonar-maven-plugin:5.9.0.7382:sonar \\
                          -Dsonar.projectKey=stock-api \\
                          -Dsonar.projectName="Stock API" \\
                          -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                    '''
                }
            }
        }
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
`

export const COMPOSE_NEXUS = `  nexus:
    image: sonatype/nexus3:3.98.1          # Module 10: a Maven/npm/Docker repository manager
    container_name: nexus
    restart: unless-stopped
    environment:
      INSTALL4J_ADD_VM_PARAMS: "-Xms512m -Xmx768m -XX:MaxDirectMemorySize=768m"   # modest lab footprint
    ports:
      - "8093:8081"                        # Nexus UI and the hosted Maven repository -> http://localhost:8093
    volumes:
      - nexus_data:/nexus-data
`

export const JENKINSFILE_NEXUS = `// lab/stock-api — Jenkinsfile.nexus: publish the same jar to a Nexus hosted Maven repository, with a
// dedicated, least-privilege account (jenkins-deployer, role deployer-maven-releases). No change to the
// project's own Jenkinsfile (Module 6) or to pom.xml: the target repository is given on the command line.
pipeline {
    agent { label 'linux' }
    environment {
        VERSION = "1.0.\${env.BUILD_NUMBER}"
    }
    stages {
        stage('Build and test') {
            steps {
                sh 'mvn -B -ntp -Drevision=$VERSION clean test package'
            }
            post {
                always { junit 'target/surefire-reports/*.xml' }
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
}
`

export const CI_SETTINGS = `<?xml version="1.0" encoding="UTF-8"?>
<!-- lab/stock-api — ci-settings.xml: Maven settings for Jenkins. No secret here: the credentials are read
     from environment variables that withCredentials sets during the Publish stage only. -->
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 https://maven.apache.org/xsd/settings-1.2.0.xsd">
  <servers>
    <server>
      <id>gitea</id>                              <!-- same id as in <distributionManagement> of pom.xml -->
      <username>\${env.REPO_USER}</username>
      <password>\${env.REPO_TOKEN}</password>
    </server>
    <server>
      <id>nexus</id>                               <!-- matched by -DaltDeploymentRepository=nexus::... (Module 10) -->
      <username>\${env.NEXUS_USER}</username>
      <password>\${env.NEXUS_TOKEN}</password>
    </server>
  </servers>
</settings>
`

export const COMPOSE_PROM_GRAFANA = `  prometheus:
    image: prom/prometheus:v3.16.0           # Module 10: scrapes /prometheus/ on the Jenkins controller
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"                          # http://localhost:9090

  grafana:
    image: grafana/grafana:13.3.1            # Module 10: dashboards over the metrics Prometheus collected
    container_name: grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: \${GRAFANA_ADMIN_PASSWORD}   # read from .env
      GF_USERS_ALLOW_SIGN_UP: "false"
    depends_on:
      - prometheus
    ports:
      - "3001:3000"                          # http://localhost:3001 (3000 is used by other labs on this host)
    volumes:
      - grafana_data:/var/lib/grafana
`

export const PROMETHEUS_YML = `# ~/jenkins-lab/prometheus/prometheus.yml — scrape Jenkins' own /prometheus endpoint (Module 10)
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: jenkins
    metrics_path: /prometheus/
    static_configs:
      - targets: ["jenkins:8080"]
`

export const MODULE10 = [
  { t: 'objectives', items: [
    'Run Ansible from a pipeline to deploy over SSH, with a dedicated key credential.',
    'Run Terraform from a pipeline with a real human approval gate, and understand state locking.',
    'Wire SonarQube to Jenkins so a pipeline waits for a quality gate — and genuinely fails when code ships without tests.',
    'Publish a Maven artifact to Nexus with a least-privilege account.',
    'Explain what JFrog Artifactory adds over Nexus, without needing an account to say it honestly.',
    'Scrape Jenkins\' own metrics with Prometheus and read them in a Grafana dashboard.',
    'Know, for GitHub and GitLab, what changes compared to the Gitea used since Module 5.',
  ] },
  { t: 'p', text: `Prerequisite: Modules 2 (lab), 6 (Maven CI), 8 (Kubernetes). Six more services join the lab in this module: two servers for Ansible, SonarQube and its database, Nexus, Prometheus and Grafana. Every command, error and screenshot below happened for real, on Jenkins ${LAB.jenkins} ${LAB.ligne}, ${LAB.date}. "One working pipeline per tool" is the rule of this module — Artifactory is the one exception, explained below.` },

  { t: 'h', id: 'm10-1', text: '10.1 Why connect Jenkins to other tools' },
  { t: 'p', text: 'Jenkins orchestrates; it rarely does the work itself. A pipeline is a conductor: it calls Ansible to configure servers, Terraform to provision infrastructure, SonarQube to judge code quality, Nexus or Artifactory to store artifacts, Prometheus to be watched. Module 1.8 already compared Jenkins and Ansible; this module makes six of these connections real, one Jenkinsfile at a time.' },
  { t: 'diagram', id: 'm10-outils', caption: 'Six tools, one controller. Each arrow below is a real Jenkinsfile stage or a real webhook call from this lab.' },

  { t: 'h', id: 'm10-2', text: '10.2 Ansible: deploy to servers over SSH' },
  { t: 'p', text: 'Two servers join the lab, built from the same small image — SSH, Python 3 (Ansible\'s modules run through it), sudo for the user `deploy`:' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/docker-compose.yml — services to add', code: COMPOSE_ANSIBLE_NODES, lignes: [
    [6, 'The public key of the Ansible credential, written by the entrypoint below.'],
    [8, 'The page Ansible will deploy, served on your machine for a quick check.'],
  ] },
  { t: 'code', lang: 'bash', file: 'managed-node/entrypoint.sh — like a VM booting', code: ENTRYPOINT_MANAGED_NODE, lignes: [
    [3, 'Host keys are generated at the first start, never baked into the image — each server gets its own.'],
    [6, 'The public key given by `docker-compose.yml`, installed for the user `deploy`.'],
    [9, 'Services Ansible later installs and enables come back after a restart, like a real VM.'],
  ] },
  { t: 'p', text: 'Add Ansible to the agent image (a virtual environment, pinned) and Terraform while at it — section 10.3 needs it:' },
  { t: 'cmd', where: 'agent/Dockerfile — lines added', cmd: '', out: `# Ansible (ansible-core, in its own virtual environment) and Terraform, checksum verified (Module 10)
ARG ANSIBLE_CORE_VERSION=2.22.0
RUN python3 -m venv /opt/ansible \\
 && /opt/ansible/bin/pip install --no-cache-dir ansible-core==\${ANSIBLE_CORE_VERSION} \\
 && ln -s /opt/ansible/bin/ansible /opt/ansible/bin/ansible-playbook /opt/ansible/bin/ansible-galaxy /opt/ansible/bin/ansible-inventory /usr/local/bin/
ARG TERRAFORM_VERSION=1.17.2
RUN curl -fsSLo /tmp/tf.zip https://releases.hashicorp.com/terraform/\${TERRAFORM_VERSION}/terraform_\${TERRAFORM_VERSION}_linux_amd64.zip \\
 && curl -fsSL https://releases.hashicorp.com/terraform/\${TERRAFORM_VERSION}/terraform_\${TERRAFORM_VERSION}_SHA256SUMS \\
      | grep linux_amd64.zip | sed 's| terraform_.*zip| /tmp/tf.zip|' | sha256sum -c - \\
 && unzip -o /tmp/tf.zip terraform -d /usr/local/bin && rm /tmp/tf.zip`, note: 'Checksums verified for Terraform; `pip install` pins the exact version for Ansible.' },
  { t: 'cmd', where: 'Your terminal, after docker compose build agent-1', cmd: 'docker compose exec agent-1 ansible --version', out: 'ansible [core 2.22.0]' },
  { t: 'h3', text: 'Declare the tool, add the key' },
  { t: 'shot', id: 'm10-03-tool-ansible', titre: 'Manage Jenkins → Tools → Ansible installations', ce: 'The Ansible plugin adds its own tool type, like Maven or the JDK.', éléments: ['**Ansible installations**: the section the plugin added.', '**Name**: `ansible-2.22` — used by `installation:` in the pipeline.', '**Path to ansible executables directory**: where the Dockerfile installed the virtualenv\'s symlinks.'], actions: ['Click **Add Ansible**, fill the name and path, **Save**.'], résultat: 'The name `ansible-2.22` can now be used by `ansiblePlaybook()`.' },
  { t: 'cmd', where: 'Your terminal, in a throwaway container', cmd: 'ssh-keygen -t ed25519 -N "" -C "ansible@jenkins-lab" -f ansible_key', out: `The key fingerprint is:
SHA256:sueNQDD/8MVl2RtnMT27oGdjbzraATaUPAmuybJ81Ik ansible@jenkins-lab
+----[SHA256]-----+`, note: 'No passphrase: Jenkins stores the private key encrypted (Module 9). The host has no `ssh-keygen`, which is itself a reminder that the build agent — not your laptop — is where these tools actually run.' },
  { t: 'shot', id: 'm10-08-secret-file', titre: 'Add Credentials → Secret file (reused here for a kubeconfig, same idea for the SSH key)', ce: 'A whole file stored as a credential — the pattern reused for Terraform\'s kubeconfig in 10.3.', éléments: ['**Choose File**: the file to upload.', '**ID**: used by `credentialsId:` in the pipeline.', '**Description**: which account it is.'], actions: ['For the SSH key, use **SSH Username with private key** instead (Module 9): username `deploy`, key pasted directly, ID `ansible-ssh-key`.'], résultat: 'Jenkins never writes the key to a file you have to clean up by hand.' },
  { t: 'h3', text: 'Pin the host keys, like Module 9' },
  { t: 'cmd', where: 'From agent-1 (reaches app-1 and app-2 by their Compose service names)', cmd: '', out: `$ ssh-keyscan -t ed25519 app-1 app-2 > known_hosts
$ ssh-keygen -lf known_hosts
256 SHA256:ff9ueIBHGxuwGxAevTsQah0ppxP7EZu9CIvTRI+VU90 app-1 (ED25519)
256 SHA256:m5pBg/0tYDBPCxHEP4dw9+e+0Caa1rxRta1MKuJMPBM app-2 (ED25519)

# on each server, given by its administrator:
$ ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
256 SHA256:ff9ueIBHGxuwGxAevTsQah0ppxP7EZu9CIvTRI+VU90 root@2c463cfda610 (ED25519)
256 SHA256:m5pBg/0tYDBPCxHEP4dw9+e+0Caa1rxRta1MKuJMPBM root@241e5011c2e4 (ED25519)`, note: 'Same fingerprints on both sides: the `known_hosts` file goes into the Git repository, read by every run — never `StrictHostKeyChecking=no` (Module 9).' },
  { t: 'code', lang: 'ini', file: 'stock-ansible/ansible.cfg', code: ANSIBLE_CFG, lignes: [
    [8, 'Trust only the host keys pinned in this repository — the ones just verified above.'],
  ] },
  { t: 'code', lang: 'ini', file: 'stock-ansible/inventories/staging/hosts.ini', code: HOSTS_INI },
  { t: 'code', lang: 'yaml', file: 'stock-ansible/site.yml — deploy a release, the classic symlink pattern', code: SITE_YML, lignes: [
    [3, '`become: true`: installing a package and writing `/etc` needs root — `sudo` as `deploy`.'],
    [10, 'A fresh folder for this exact version.'],
    [26, '`force: true`: in check mode the release folder does not exist yet — without it, `--check` itself fails (see the lab).'],
  ] },
  { t: 'code', lang: 'groovy', file: 'stock-ansible/Jenkinsfile', code: JENKINSFILE_ANSIBLE, lignes: [
    [14, 'The plugin\'s step: `installation:` names the tool of 10.2, `credentialsId:` the SSH key.'],
    [15, '`extraVars`: `-e app_version=…`, exactly like the hand-typed `ansible-playbook` command.'],
    [16, '`checkMode`: the equivalent of `ansible-playbook --check`, a real dry run.'],
  ] },
  { t: 'p', text: 'First run, no parameters yet — the guard refuses an empty version, the same pattern as Module 9\'s SSH deployment:' },
  { t: 'cmd', where: 'stock-ansible #1 → Console Output (real text, excerpt)', cmd: '', out: `+ [ -n  ]
+ echo VERSION is empty
VERSION is empty
+ exit 1
Finished: FAILURE` },
  { t: 'p', text: 'Second run, with `VERSION=1.0.6`, but `become` not written yet — Ansible connects fine (the key works), and then fails for a very ordinary Linux reason:' },
  { t: 'cmd', where: 'stock-ansible #2 → Console Output (real text, excerpt)', cmd: '', out: `TASK [Install nginx] ***********************************************************
[ERROR]: Task failed: Module failed: Failed to lock apt for exclusive operation: Failed to lock directory /var/lib/apt/lists/: E:Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)
fatal: [app-1]: FAILED! => {"changed": false, "msg": "Failed to lock apt for exclusive operation: Failed to lock directory /var/lib/apt/lists/: E:Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)"}
fatal: [app-2]: FAILED! => {"changed": false, "msg": "Failed to lock apt for exclusive operation: Failed to lock directory /var/lib/apt/lists/: E:Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)"}
PLAY RECAP *********************************************************************
app-1                      : ok=1    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0   
app-2                      : ok=1    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0   
Finished: FAILURE`, note: '`deploy` has `sudo`, but the playbook never asked for it. The fix is the one line already in `site.yml` above.' },
  { t: 'cmd', where: 'stock-ansible #3 → Console Output (real text, excerpt, after adding become: true)', cmd: '', out: `TASK [Install nginx] ***********************************************************
changed: [app-1]
changed: [app-2]
changed: [app-1]
changed: [app-2]
changed: [app-1]
changed: [app-2]
changed: [app-1]
changed: [app-2]
changed: [app-2]
changed: [app-1]
changed: [app-2]
changed: [app-1]
changed: [app-2]
changed: [app-1]
PLAY RECAP *********************************************************************
app-1                      : ok=8    changed=7    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
app-2                      : ok=8    changed=7    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
+ echo app-1 serves 1.0.7
app-1 serves 1.0.7
Finished: SUCCESS`, note: '`sudo apt-get install nginx` runs for real on both servers.' },
  { t: 'p', text: 'Deploy again with the same version: Ansible is **idempotent** — it reports what changed, and nothing does:' },
  { t: 'cmd', where: 'stock-ansible #4 → Console Output (real text, excerpt, VERSION=1.0.7 then run again)', cmd: '', out: `PLAY RECAP *********************************************************************
app-1                      : ok=7    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
app-2                      : ok=7    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
+ echo app-1 serves 1.0.7
app-1 serves 1.0.7
+ echo app-2 serves 1.0.7
app-2 serves 1.0.7` },
  { t: 'p', text: 'A dry run (`DRY_RUN=true`, Ansible `--check`) of the next version finds a real limit of check mode: a resource that does not exist yet cannot be linked to, even hypothetically:' },
  { t: 'cmd', where: 'stock-ansible #5 → Console Output (real text, excerpt)', cmd: '', out: `[ERROR]: Task failed: Module failed: src file does not exist, use 'force=yes' if you really want to create the link: /var/www/stock-web/releases/1.0.8
fatal: [app-2]: FAILED! => {"changed": false, "gid": 0, "group": "root", "mode": "0777", "msg": "src file does not exist, use 'force=yes' if you really want to create the link: /var/www/stock-web/releases/1.0.8", "owner": "root", "path": "/var/www/stock-web/current", "size": 33, "src": "/var/www/stock-web/releases/1.0.8", "state": "link", "uid": 0}
fatal: [app-1]: FAILED! => {"changed": false, "gid": 0, "group": "root", "mode": "0777", "msg": "src file does not exist, use 'force=yes' if you really want to create the link: /var/www/stock-web/releases/1.0.8", "owner": "root", "path": "/var/www/stock-web/current", "size": 33, "src": "/var/www/stock-web/releases/1.0.8", "state": "link", "uid": 0}
PLAY RECAP *********************************************************************
app-1                      : ok=4    changed=2    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0   
app-2                      : ok=4    changed=2    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0   
Finished: FAILURE` },
  { t: 'cmd', where: 'stock-ansible #6 → Console Output (after force: true, real text, excerpt)', cmd: '', out: `changed: [app-1]
changed: [app-2]
changed: [app-2]
changed: [app-1]
TASK [Make this release the current one] ***************************************
changed: [app-2]
changed: [app-1]
PLAY RECAP *********************************************************************
app-1                      : ok=7    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
app-2                      : ok=7    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
Finished: SUCCESS`, note: '`--check --diff` now shows exactly what 1.0.8 would change, with nothing actually touched — the whole point of a dry run.' },
  { t: 'cmd', where: 'stock-ansible #7 → Console Output (real text, excerpt — the real deployment)', cmd: '', out: `PLAY RECAP *********************************************************************
app-1                      : ok=7    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
app-2                      : ok=7    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
+ echo app-1 serves 1.0.8
app-1 serves 1.0.8
+ echo app-2 serves 1.0.8
app-2 serves 1.0.8` },
  { t: 'shot', id: 'm10-04-ansible-console', titre: 'The ansiblePlaybook step\'s command, in the real console', ce: 'What the plugin actually runs — the same `ansible-playbook` you would type by hand.', éléments: ['The command: playbook, inventory, `--private-key`, the user, extra vars.', 'The temporary key file from the credential.', 'Extra vars, masked.', 'A task that was already satisfied: `ok`, not `changed`.'], actions: ['Compare with the command of section 10.2 — identical, minus the typing.'], résultat: 'Same tool, same behavior, called by a machine instead of a keyboard.' },
  { t: 'shot', id: 'm10-05-ansible-recap', titre: 'PLAY RECAP and the smoke test, in the same console', ce: 'Ansible\'s own summary, then the pipeline\'s own check.', éléments: ['One line per server: `ok`, `changed`, `failed`.', 'Three real changes: the release folder, the page, the `current` link.', 'The pipeline\'s `curl` confirms what the page now serves.'], actions: ['Compare the recap with what you changed: three files, three changes.'], résultat: 'A deployment you can trust because two layers agree.' },
  { t: 'shot', id: 'm10-06-ansible-builds', titre: 'stock-ansible → build history', ce: 'Every run of this section, in order.', éléments: ['#7: the real 1.0.8 deployment.', '#6: a dry run, nothing changed.', '#5: check mode failed on the force/link issue.', '#2: no `become`, refused by the OS.'], actions: ['Open #2 and #5 yourself to re-read each failure in its own console.'], résultat: 'A pipeline\'s history is also the history of what was learned fixing it.' },
  { t: 'shot', id: 'm10-07-stock-web-app-1', titre: 'The page Ansible deployed, on app-1', ce: 'nginx, configured by the template of section 10.2, serving the version Ansible wrote.', éléments: ['The version in the title and the heading.', 'The inventory variables (environment, host) in the paragraph.'], actions: ['Open `http://localhost:8091/` (app-1) and `:8092` (app-2) yourself.'], résultat: 'A real page, on a real (small) server, deployed by a real playbook.' },
  { t: 'p', text: 'An **ad-hoc** command — no playbook, for a quick check — reuses the same key and inventory:' },
  { t: 'code', lang: 'groovy', file: 'ansible-adhoc → Configure → Pipeline script', code: ANSIBLE_ADHOC, lignes: [
    [8, '`ansible.builtin.ping`: not ICMP — it checks Python and the connection.'],
    [9, 'Any ad-hoc module, e.g. `command`, with `-a` for its arguments.'],
  ] },
  { t: 'cmd', where: 'ansible-adhoc #2 → Console Output (real text, excerpt)', cmd: '', out: `+ ansible web -u deploy --private-key **** -m ansible.builtin.ping
    "ping": "pong"
    "ping": "pong"
+ ansible web -u deploy --private-key **** -m ansible.builtin.command -a readlink /var/www/stock-web/current
app-2 | CHANGED | rc=0 >>
/var/www/stock-web/releases/1.0.8
app-1 | CHANGED | rc=0 >>
/var/www/stock-web/releases/1.0.8` },
  { t: 'callout', kind: 'tip', text: 'Module 1.8 showed a Jenkinsfile calling `ansible-playbook` directly with `sh`. The `ansiblePlaybook()` step used here is the plugin\'s equivalent — it builds the same command line, just with structured arguments and automatic masking of `extraVars`. Either works; pick the one your team already has muscle memory for.' },

  { t: 'h', id: 'm10-3', text: '10.3 Terraform: infrastructure, with a human gate' },
  { t: 'p', text: 'Terraform manages the shape of the cluster — team namespaces, quotas, who may deploy where — the same cluster Module 8 deploys *applications* into with Helm. The project `platform-terraform` is new; it never touches the `stock` namespace.' },
  { t: 'code', lang: 'hcl', file: 'platform-terraform/versions.tf', code: TF_VERSIONS, lignes: [
    [8, 'The state lives in the cluster itself — a Secret, locked by a Lease — not on the agent\'s disk.'],
  ] },
  { t: 'code', lang: 'hcl', file: 'platform-terraform/main.tf — one namespace per team, with a quota and the right to deploy', code: TF_MAIN, lignes: [
    [46, 'Grants the built-in role `edit` to a **group**, not a person: real access comes from your identity provider\'s groups.'],
  ] },
  { t: 'code', lang: 'hcl', file: 'platform-terraform/teams.auto.tfvars', code: TF_TFVARS },
  { t: 'h3', text: 'A service account that may only do this' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/k8s/terraform-rbac.yaml — applied once, by an administrator', code: TERRAFORM_RBAC, lignes: [
    [13, 'Only `secrets` and `leases` in `platform`: the state backend, nothing else.'],
    [36, 'Namespaces and quotas anywhere — this is what Terraform is meant to manage.'],
    [44, '`bind` on the ClusterRole `edit` by name: Terraform may hand out exactly that role, and no other.'],
  ] },
  { t: 'p', text: 'The plan looks entirely reasonable — eight resources, two per team: a namespace, a quota, default limits, and a RoleBinding. The apply that follows it does not finish:' },
  { t: 'cmd', where: 'platform-terraform #1 → Console Output (real text, excerpt)', cmd: '', out: `Plan: 8 to add, 0 to change, 0 to destroy.
│ Error: error creating RoleBinding
│ "system:authenticated"]) is attempting to grant RBAC permissions not
│ Error: error creating RoleBinding
│ "system:authenticated"]) is attempting to grant RBAC permissions not`, note: 'Kubernetes refuses to let an account grant a permission it does not itself hold — `terraform` could create the RoleBinding object, but not **bind** the role `edit` through it, until the RBAC file above added that one exact `bind` privilege.' },
  { t: 'cmd', where: 'Your terminal — the fix applied', cmd: '', out: `namespace/platform unchanged
serviceaccount/terraform unchanged
role.rbac.authorization.k8s.io/terraform-state unchanged
rolebinding.rbac.authorization.k8s.io/terraform-state unchanged
clusterrole.rbac.authorization.k8s.io/terraform-team-namespaces configured
clusterrolebinding.rbac.authorization.k8s.io/terraform-team-namespaces unchanged
secret/terraform-token unchanged` },
  { t: 'code', lang: 'groovy', file: 'platform-terraform/Jenkinsfile', code: JENKINSFILE_TERRAFORM, lignes: [
    [8, '`-no-color`: plain text in the Jenkins console.'],
    [22, '`-detailed-exitcode`: 0 no changes, 1 error, 2 changes — the three-way branch Terraform was designed for.'],
    [38, 'A real `input` step (Module 4): the pipeline stops until a person clicks.'],
  ] },
  { t: 'callout', kind: 'warning', title: 'A second real bug', text: '`terraform init -backend=false` silently reuses the backend configuration of the **previous** run on the same workspace — the Format stage first wrote this pipeline with `init -backend=false` then `validate`, and it failed with "no configuration has been provided" on the second build. The fix: validate only after the real `init` (see the Jenkinsfile above) — initializing twice with different flags on the same `.terraform/` directory is not supported.' },
  { t: 'callout', kind: 'why', text: 'Terraform applies resource by resource, not all-or-nothing: the failed run above still created both namespaces, both quotas and both default limits before erroring on the RoleBindings — the one kind of resource that needed the still-missing `bind` privilege. The next successful plan therefore has only **2** resources left to add, not 8.' },
  { t: 'p', text: 'With the RBAC fixed and `validate` moved after the real `init`, the next apply finishes the job — the two RoleBindings that grant `edit` to each team\'s group:' },
  { t: 'cmd', where: 'platform-terraform #3 → Console Output (real text, excerpt)', cmd: '', out: `Plan: 2 to add, 0 to change, 0 to destroy.
Apply complete! Resources: 2 added, 0 changed, 0 destroyed.
namespaces = [` },
  { t: 'h3', text: 'A plan a person reads, and approves' },
  { t: 'p', text: 'A pull request later raises `team-stock`\'s pod quota from 10 to 20. The pipeline shows the exact diff and waits:' },
  { t: 'shot', id: 'm10-09-tf-plan', titre: 'platform-terraform console — the plan, before anyone approves', ce: 'Terraform\'s own diff: one field of one resource, nothing else.', éléments: ['`~ resource` — an update in place, not a replace.', 'The one value that changes: `"pods" = "10" -> "20"`.', 'The one-line summary to actually read.'], actions: ['This is the moment to say no, if the number looks wrong.'], résultat: 'A plan is a question. `input` makes the pipeline wait for the answer.' },
  { t: 'cmd', where: 'platform-terraform #4 → Console Output (real text, excerpt)', cmd: '', out: `Plan: 0 to add, 1 to change, 0 to destroy.
Apply this plan to the cluster lab?
Approved by Lab Admin
Apply complete! Resources: 0 added, 1 changed, 0 destroyed.` },
  { t: 'h3', text: 'Drift: someone changes it by hand' },
  { t: 'cmd', where: 'An administrator, directly on the cluster (not through Terraform)', cmd: '', out: `$ kubectl -n team-billing patch resourcequota quota --type merge -p '{"spec":{"hard":{"pods":"50"}}}'
resourcequota/quota patched
$ kubectl -n team-billing get resourcequota quota
NAME    REQUEST                                                 LIMIT   AGE
quota   pods: 0/50, requests.cpu: 0/1, requests.memory: 0/1Gi           3m15s` },
  { t: 'shot', id: 'm10-10-tf-approve', titre: 'The next plan: Terraform notices, and proposes to undo the manual change', ce: 'A real refresh found a value Terraform does not own having changed.', éléments: ['The same field, now drifted: `"pods" = "50" -> "5"`.', 'The one-line summary.', 'The same question as before.', '**Apply**: only the person named `submitter` may click it.', '**Abort**: nothing is touched.'], actions: ['Apply, to put the cluster back in line with the code — or change the code, if the manual value was actually right.'], résultat: 'Terraform does not silently accept drift: it tells you, and lets a person decide.' },
  { t: 'cmd', where: 'platform-terraform #5 → Console Output (real text, excerpt)', cmd: '', out: `Plan: 0 to add, 1 to change, 0 to destroy.
Apply complete! Resources: 0 added, 1 changed, 0 destroyed.` },
  { t: 'h3', text: 'State locking, for real' },
  { t: 'p', text: 'A colleague starts `terraform apply` from their own laptop at the same time. Terraform refuses to let two writers touch the same state:' },
  { t: 'cmd', where: 'A second terraform client, run on purpose to hold the lock', cmd: '', out: `kubernetes_namespace_v1.team["billing"]: Refreshing state... [id=team-billing]
kubernetes_namespace_v1.team["stock"]: Refreshing state... [id=team-stock]
kubernetes_resource_quota_v1.team["stock"]: Refreshing state... [id=team-stock/quota]` },
  { t: 'cmd', where: 'platform-terraform #6 → Console Output (real text, excerpt)', cmd: '', out: `Error: Error acquiring the state lock
  Who:       root@laptop-alice
  Version:   1.17.2
ERROR: terraform plan failed
Finished: FAILURE`, note: 'The `Who:` field is literally whoever is logged into that machine — a good reason never to run Terraform as `root` on a shared workstation.' },
  { t: 'p', text: 'Run again once the lock is free: nothing left to do.' },
  { t: 'cmd', where: 'platform-terraform #7 → Console Output (real text, excerpt)', cmd: '', out: `No changes. Your infrastructure matches the configuration.
Stage "Approve" skipped due to when conditional` },
  { t: 'cmd', where: 'Your terminal, the final state', cmd: '', out: `$ kubectl get namespaces -l managed-by=terraform
NAME           STATUS   AGE
team-billing   Active   5m58s
team-stock     Active   5m58s

$ kubectl -n team-stock get resourcequota,limitrange,rolebinding
NAME                  REQUEST                                                 LIMIT   AGE
resourcequota/quota   pods: 0/20, requests.cpu: 0/2, requests.memory: 0/2Gi           5m58s

NAME                  CREATED AT
limitrange/defaults   2026-11-17T22:02:08Z

NAME                                              ROLE               AGE
rolebinding.rbac.authorization.k8s.io/team-edit   ClusterRole/edit   4m29s

$ kubectl -n platform get secrets,leases
NAME                              TYPE                                  DATA   AGE
secret/terraform-token            kubernetes.io/service-account-token   3      7m30s
secret/tfstate-default-platform   Opaque                                1      6m

NAME                                                      HOLDER   AGE
lease.coordination.k8s.io/lock-tfstate-default-platform            6m` },

  { t: 'h', id: 'm10-4', text: '10.4 SonarQube: a quality gate that actually gates' },
  { t: 'p', text: 'SonarQube analyzes code and decides, by rule, whether a build is good enough — a **quality gate**. Connected properly, a pipeline does not just run the scan: it **waits** for the verdict and stops if it fails.' },
  { t: 'h3', text: 'Plugins for this whole module, in one batch: Ansible, SonarQube Scanner, Prometheus, Config File Provider, JFrog' },
  { t: 'p', text: 'All five tools of this module need a plugin first. Install them together, the same way Modules 2–9 installed theirs:' },
  { t: 'shot', id: 'm10-01-plugin-ansible', titre: 'Available plugins: search, tick, read the health score', ce: 'The first of five — the same flow for each.', éléments: ['Search: *Ansible*.', 'Tick the plugin itself.', 'Health score — how the community rates it.', '**Install**.'], actions: ['Repeat the search for *SonarQube Scanner*, *Prometheus metrics*, *Config File Provider* and *JFrog*, ticking each before the final Install.'], résultat: 'All five queued for install in a single batch — the next screenshot shows the result.' },
  { t: 'shot', id: 'm10-02-plugins-installes', titre: 'Plugins installed for this module, in one batch', ce: 'Five plugins for five tools — Ansible, SonarQube, Prometheus, Config File Provider (10.9), JFrog (10.6).', éléments: ['Four install without a restart.', 'Prometheus **metrics** cannot be loaded live — Jenkins asks for a restart.', 'A **safe restart** waits for running builds before restarting.'], actions: ['Tick all five, Install, then check "Restart Jenkins when installation is complete and no jobs are running".'], résultat: 'Five new capabilities, one at the cost of a two-line downtime.' },
  { t: 'p', text: 'SonarQube Community Build also needs a real database, and its search index needs many open files:' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/docker-compose.yml — services to add', code: COMPOSE_SONARQUBE, lignes: [
    [20, 'Allows webhooks to a private address — `jenkins` resolves inside this lab\'s own network, which SonarQube refuses by default (see the callout below).'],
    [21, 'Elasticsearch, inside SonarQube, needs far more open files than a default container gets.'],
  ] },
  { t: 'h3', text: 'The server connection: a token, not a password' },
  { t: 'shot', id: 'm10-11-sonar-token', titre: 'SonarQube → My Account → Security → Generate Tokens', ce: 'A token scoped to analyses only, expiring in 90 days.', éléments: ['**Name**: `jenkins` — who uses it.', '**Type**: *Global Analysis Token* — can run analyses, nothing else (not even browse issues as a user would).', 'Shown once, in full.'], actions: ['Copy it immediately into a Jenkins Secret text credential: it cannot be retrieved again.'], résultat: 'A revocable, narrowly-scoped credential — the same idea as Module 9\'s bot tokens.' },
  { t: 'p', text: 'A webhook lets SonarQube tell Jenkins the result the moment analysis finishes, instead of Jenkins polling:' },
  { t: 'shot', id: 'm10-12-sonar-webhook', titre: 'SonarQube → Administration → Webhooks → Create', ce: 'A callback, with a secret Jenkins verifies.', éléments: ['**URL**: the plugin\'s fixed endpoint, `/sonarqube-webhook/`.', '**Secret**: matched against the same value configured on the Jenkins side.'], actions: ['Create.'], résultat: 'Should work — but the next screenshot shows what actually happened first.' },
  { t: 'shot', id: 'm10-13-sonar-webhook-refused', titre: 'The real first attempt: refused', ce: 'SonarQube validates webhook URLs against SSRF-style targets by default — and `jenkins` resolves to a private address inside this lab\'s own Docker network.', éléments: ['The exact refusal: loopback, link-local, site-local and a few other address classes are blocked.'], actions: ['In a real company, the fix is usually nothing — your Jenkins is not on a private/link-local range relative to SonarQube. In this lab, both services share one private Docker network on purpose, so the check has to be relaxed: `SONAR_VALIDATEWEBHOOKS=false` (see the Compose file above).'], résultat: 'A genuine safety feature, and a genuine reason a lab is not production.' },
  { t: 'shot', id: 'm10-14-sonar-server', titre: 'Manage Jenkins → System → SonarQube servers', ce: 'Everything a pipeline needs to call `withSonarQubeEnv()`.', éléments: ['**Name**: `sonarqube-lab`, used by `withSonarQubeEnv()`.', '**Server URL**: reached over the lab\'s own network.', '**Server authentication token**: the Secret text credential from the token above.', '**Webhook Secret** (under *Advanced*): the matching secret.'], actions: ['Save.'], résultat: 'The pipeline can now authenticate to SonarQube and trust its callback.' },
  { t: 'code', lang: 'groovy', file: 'stock-api/Jenkinsfile.sonar — added next to the project\'s own Jenkinsfile (Module 6), unchanged', code: JENKINSFILE_SONAR, lignes: [
    [16, '`withSonarQubeEnv`: injects `SONAR_HOST_URL` and the token as environment variables — nothing hardcoded.'],
    [17, 'The scanner for Maven, called as a plugin goal: no change to `pom.xml`.'],
    [29, '`waitForQualityGate`: the pipeline genuinely blocks here, waiting for the webhook.'],
    [30, '`abortPipeline: true`: a failed gate stops the build — not a warning, a real abort.'],
  ] },
  { t: 'p', text: 'First analysis: it runs, and the gate passes — with nothing yet to compare against.' },
  { t: 'cmd', where: 'stock-api-sonar #1 → Console Output (real text, excerpt)', cmd: '', out: `[INFO] ANALYSIS SUCCESSFUL, you can find the results at: http://sonarqube:9000/dashboard?id=stock-api
Checking status of SonarQube task '05b8b129-790c-447a-a675-4f6e02c77f25' on server 'sonarqube-lab'
The incoming webhook matched the configured webhook secret
SonarQube task '05b8b129-790c-447a-a675-4f6e02c77f25' completed. Quality gate is 'OK'` },
  { t: 'callout', kind: 'info', title: 'A small-change exemption', text: 'A later change adding one small, untested method (8 new lines) still passed, with the API reporting `"ignoredConditions": true` and `new_coverage` shown as `0.0` yet `"status": "OK"`. SonarQube skips new-code coverage and duplication conditions when there is not enough new code to measure meaningfully — real behavior, not a bug in this lab.' },
  { t: 'h3', text: 'A real failure' },
  { t: 'p', text: 'A bigger, genuinely untested feature — a new class, 66 lines, zero tests — crosses that threshold for real:' },
  { t: 'cmd', where: 'stock-api-sonar #5 → Console Output (real text, excerpt)', cmd: '', out: `Checking status of SonarQube task '2fe98e0c-aafc-4d1a-8e4a-db59cbd7e378' on server 'sonarqube-lab'
The incoming webhook matched the configured webhook secret
SonarQube task '2fe98e0c-aafc-4d1a-8e4a-db59cbd7e378' completed. Quality gate is 'ERROR'
ERROR: Pipeline aborted due to quality gate failure: ERROR
Finished: FAILURE` },
  { t: 'shot', id: 'm10-15-sonar-gate-fail', titre: 'stock-api-sonar #5 → Console Output', ce: 'The scan succeeds; the *gate* does not.', éléments: ['`ANALYSIS SUCCESSFUL`: SonarQube accepted and processed the report.', '`Quality gate is \'ERROR\'`: the verdict, delivered by the webhook.', '`Pipeline aborted due to quality gate failure`: `abortPipeline: true` doing its job.'], actions: ['Open the SonarQube dashboard for this analysis and read which condition failed.'], résultat: 'The build is red — correctly: the new code shipped with 0% coverage.' },
  { t: 'cmd', where: 'SonarQube API — the failing condition, read right after', cmd: 'curl -u admin:*** "http://sonarqube:9000/api/qualitygates/project_status?projectKey=stock-api"', out: `{
  "projectStatus": {
    "status": "ERROR",
    "conditions": [
      {
        "status": "ERROR",
        "metricKey": "new_coverage",
        "comparator": "LT",
        "errorThreshold": "80",
        "actualValue": "0.0"
      },
      {
        "status": "OK",
        "metricKey": "new_duplicated_lines_density",
        "comparator": "GT",
        "errorThreshold": "3",
        "actualValue": "0.0"
      },
      {
        "status": "OK",
        "metricKey": "new_violations",
        "comparator": "GT",
        "errorThreshold": "0",
        "actualValue": "0"
      }
    ],
    "ignoredConditions": false,
    "period": {
      "mode": "PREVIOUS_VERSION",
      "date": "2026-11-17T23:02:41+0000",
      "parameter": "1.0.4"
    },
    "caycStatus": "compliant"
  }
}` },
  { t: 'p', text: 'The fix is not a configuration change — it is writing the missing tests:' },
  { t: 'cmd', where: 'stock-api-sonar #6 → Console Output (real text, excerpt, after adding tests)', cmd: '', out: `Checking status of SonarQube task '56178ed0-52be-488b-bfe6-751a47f10013' on server 'sonarqube-lab'
The incoming webhook matched the configured webhook secret
SonarQube task '56178ed0-52be-488b-bfe6-751a47f10013' completed. Quality gate is 'OK'
Finished: SUCCESS` },
  { t: 'shot', id: 'm10-16-sonar-gate-pass', titre: 'stock-api-sonar #6 → Console Output, after adding tests', ce: 'Same pipeline, same gate, a different result.', éléments: ['`Quality gate is \'OK\'`.', '`Finished: SUCCESS`.'], actions: ['Compare with the previous console: same pipeline, only the test files changed.'], résultat: 'Tests added, not thresholds lowered.' },
  { t: 'callout', kind: 'why', text: 'This fix added **only** test files — no new line of `src/main/java`. The dashboard then reads "There are not enough lines to compute coverage": there is nothing new in production code to cover, so the condition trivially holds. Coverage conditions are about code that runs in production, never about the tests themselves.' },
  { t: 'shot', id: 'm10-17-sonar-dashboard', titre: 'SonarQube — project dashboard, after the fix', ce: 'The quality gate badge a team actually looks at day to day.', éléments: ['**Passed**, in green.', 'Coverage of the whole project (not just new code).'], actions: ['Switch to the *Overall Code* tab to see the whole project, not just this change.'], résultat: 'What anyone opening the project sees first.' },
  { t: 'shot', id: 'm10-18-sonar-activity', titre: 'SonarQube — project Activity, the history that matters', ce: 'Every analysis, with its own gate result — the "break it, fix it" of this section, in SonarQube\'s own words.', éléments: ['1.0.5: **Quality gate Failed** — the untested feature.', '1.0.6: **Quality gate Passed** — the same feature, tested.'], actions: ['Hover each point on the graph below to see its own gate result.'], résultat: 'A quality gate is only useful if its history is kept and read.' },

  { t: 'h', id: 'm10-5', text: '10.5 Nexus: a private Maven repository' },
  { t: 'p', text: 'Module 6 published to Gitea\'s own Maven registry. Nexus (and Artifactory, 10.6) are the dedicated tools for this job — one place for every format a company builds: Maven, npm, Docker images, and more.' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/docker-compose.yml — service to add', code: COMPOSE_NEXUS },
  { t: 'shot', id: 'm10-19-nexus-login', titre: 'Nexus — first login, with the generated password', ce: 'The same pattern as Jenkins\' own setup wizard (Module 2): a password written to a file inside the container, used exactly once.', éléments: ['Where the file lives.', '`admin`.', 'The generated password — changed immediately after, via *Security → Users* or the REST API below.'], actions: ['Log in once with this password, then change it immediately (Security → Users, or the API below).'], résultat: 'Logged in — but not yet able to publish anything, as the next finding shows.' },
  { t: 'h3', text: 'A real wall: the EULA, not a permission' },
  { t: 'p', text: 'A least-privilege role and user, created through the REST API — the UI equivalent is *Security → Roles / Users*:' },
  { t: 'cmd', where: 'Your terminal', cmd: '', out: `$ curl -s -u admin:*** -X POST http://nexus:8081/service/rest/v1/security/roles -d '{...}'
{
  "id": "deployer-maven-releases",
  "source": "default",
  "name": "deployer-maven-releases",
  "description": "Publish (including new versions of an existing artifact) and browse maven-releases only",
  "readOnly": false,
  "privileges": [
    "nx-repository-view-maven2-maven-releases-browse",
    "nx-repository-view-maven2-maven-releases-edit",
    "nx-repository-view-maven2-maven-releases-add",
    "nx-repository-view-maven2-maven-releases-read"
  ],
  "roles": []
}

$ curl -s -u admin:*** 'http://nexus:8081/service/rest/v1/security/users?userId=jenkins-deployer'
[
  {
    "userId": "jenkins-deployer",
    "firstName": "Jenkins",
    "lastName": "Deployer",
    "emailAddress": "jenkins-deployer@example.com",
    "source": "default",
    "status": "active",
    "readOnly": false,
    "roles": [
      "deployer-maven-releases"
    ],
    "externalRoles": []
  }
]` },
  { t: 'callout', kind: 'why', title: 'A second real wall: add alone was not enough', text: 'The first publish of a brand-new artifact only writes new files — `add` is enough. The next version of the **same** artifact also rewrites `com/example/stock-api/maven-metadata.xml`, a file that already exists: that is an **edit**, not an add. A role with only `add`, `read` and `browse` publishes version 1 fine, then gets a 403 on version 2 — found here by publishing the same version twice, on purpose.' },
  { t: 'cmd', where: 'Your terminal — the real 403, then the fix', cmd: '', out: `$ curl -u jenkins-deployer:*** -X PUT --data-binary @stock-api-1.0.3.pom \\
    http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.3/stock-api-1.0.3.pom

< HTTP/1.1 403 Forbidden    (role: add, read, browse only — stock-api already has published versions)

$ # add alone creates a brand-new artifact fine, but a second version of the same artifact also writes
$ # com/example/stock-api/maven-metadata.xml, an EXISTING file — that is an edit, not an add.
$ curl -u admin:*** -X PUT ... -d '{"privileges":[".../add",".../edit",".../read",".../browse"]}' \\
    http://nexus:8081/service/rest/v1/security/roles/deployer-maven-releases

< 204 No Content

$ curl -u jenkins-deployer:*** -X PUT --data-binary @stock-api-1.0.3.pom \\
    http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.3/stock-api-1.0.3.pom

< HTTP/1.1 201 Created` },
  { t: 'p', text: 'Yet the very first deploy — even as **admin** — was refused:' },
  { t: 'cmd', where: 'A direct PUT to the repository, admin account', cmd: '', out: `$ curl -v -u admin:*** -X PUT --data-binary @test.pom \\
    http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.1/stock-api-1.0.1.pom

> PUT /repository/maven-releases/com/example/stock-api/1.0.1/stock-api-1.0.1.pom HTTP/1.1
> Authorization: Basic ***
< HTTP/1.1 403 Forbidden
< Server: Nexus/3.98.1-01 (COMMUNITY)
< Content-Type: text/plain

You must accept the End User License Agreement (EULA) through the onboarding wizard or REST API before proceeding. See https://links.sonatype.com/products/nxrm3/docs/ce-onboarding for details.`, note: 'Not a permissions problem at all: this Community Build version refuses any write until the EULA is accepted, through the onboarding wizard **or** this exact endpoint.' },
  { t: 'cmd', where: 'Your terminal — accepted once, for the whole instance', cmd: '', out: `$ curl -s -u admin:*** http://nexus:8081/service/rest/v1/system/eula
{
  "accepted": false,
  "disclaimer": "Use of Sonatype Nexus Repository - Community Edition is governed by the End User License Agreement at https://links.sonatype.com/products/nxrm/ce-eula. By returning the value from 'accepted:false' to 'accepted:true', you acknowledge that you have read and agree to the End User License Agreement at https://links.sonatype.com/products/nxrm/ce-eula."
}

$ curl -s -u admin:*** -X POST -H 'Content-Type: application/json' \\
    --data '{"accepted": true, "disclaimer": "<the exact text above>"}' \\
    http://nexus:8081/service/rest/v1/system/eula -w '\\n%{http_code}\\n'

204

$ curl -s -u admin:*** http://nexus:8081/service/rest/v1/system/eula
{
  "accepted": true,
  "disclaimer": "Use of Sonatype Nexus Repository - Community Edition is governed by the End User License Agreement at https://links.sonatype.com/products/nxrm/ce-eula. By returning the value from 'accepted:false' to 'accepted:true', you acknowledge that you have read and agree to the End User License Agreement at https://links.sonatype.com/products/nxrm/ce-eula."
}` },
  { t: 'code', lang: 'xml', file: 'stock-api/ci-settings.xml — one more <server>, next to Module 6\'s `gitea`', code: CI_SETTINGS, lignes: [
    [14, 'Read at runtime from `$NEXUS_USER` / `$NEXUS_TOKEN` — no secret in the file itself (same idea as `gitea` above it, Module 6).'],
  ] },
  { t: 'code', lang: 'groovy', file: 'stock-api/Jenkinsfile.nexus — added next to the project\'s own Jenkinsfile (Module 6), unchanged', code: JENKINSFILE_NEXUS, lignes: [
    [21, '`nexus-deployer`: the least-privilege account above, not `admin`.'],
    [24, '`-DaltDeploymentRepository`: the target repository on the command line — `pom.xml` is not touched.'],
  ] },
  { t: 'cmd', where: 'stock-api-nexus #2 → Console Output (real text, excerpt)', cmd: '', out: `[INFO] BUILD SUCCESS
[INFO] Uploading to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.2/stock-api-1.0.2.pom
[INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.2/stock-api-1.0.2.pom (3.6 kB at 18 kB/s)
[INFO] Uploading to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.2/stock-api-1.0.2.jar
[INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.2/stock-api-1.0.2.jar (6.1 kB at 114 kB/s)
[INFO] Uploading to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/maven-metadata.xml
[INFO] Uploaded to nexus: http://nexus:8081/repository/maven-releases/com/example/stock-api/maven-metadata.xml (300 B at 8.3 kB/s)
[INFO] BUILD SUCCESS` },
  { t: 'shot', id: 'm10-22-nexus-browse', titre: 'Nexus — Browse → maven-releases → com/example/stock-api/1.0.2', ce: 'What actually landed, with its checksums and generated metadata.', éléments: ['The jar Jenkins built.', 'Its POM, written by the `flatten` plugin (Module 6).'], actions: ['Open the .sha1 file next to the jar: Maven checks it on every download.'], résultat: 'Anyone with read access can now depend on `com.example:stock-api:1.0.2`.' },
  { t: 'cmd', where: 'Checking the least-privilege account actually is least-privilege', cmd: '', out: `$ curl -u jenkins-deployer:*** -X DELETE http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.2/stock-api-1.0.2.jar
< HTTP/1.1 403 Forbidden   (the role grants add, edit, browse and read — never delete)

$ curl -u jenkins-deployer:*** http://nexus:8081/repository/maven-releases/com/example/stock-api/1.0.2/stock-api-1.0.2.jar
< HTTP/1.1 200 OK`, note: 'The role grants `add`, `edit`, `browse` and `read` — no `delete`. Delete is refused; read still works.' },

  { t: 'h', id: 'm10-6', text: '10.6 JFrog Artifactory — explained, not run' },
  { t: 'callout', kind: 'warning', title: 'Not run in this lab', text: 'Artifactory\'s free tier (JFrog Platform, Cloud) requires creating a real account on JFrog\'s own service — something this offline lab cannot do honestly. Everything below is accurate documentation of the product and its Jenkins plugin (installed in this lab, section 10.4\'s plugin batch), not a captured run.' },
  { t: 'table', head: ['', 'Nexus (this lab, 10.5)', 'JFrog Artifactory'], rows: [
    ['Formats', 'Maven, npm, Docker, and more, one server each', 'The same formats, plus **Xray**-style scanning tightly integrated (paid) and native build-info'],
    ['Jenkins integration', 'Plain HTTP(S): `mvn deploy`, `docker push`, no plugin required', '**Artifactory plugin** (`rtServer`, `rtUpload`, `rtPublishBuildInfo`): richer, Jenkins-specific metadata per build'],
    ['Build metadata', 'None beyond the artifact itself', '"Build Info": records exactly which Jenkins build, commit and dependencies produced an artifact — strong traceability'],
    ['License', 'OSS Community edition free; EULA required for write access (10.5)', 'Free tier (JFrog Platform) with usage limits; self-hosted Enterprise is commercial'],
    ['Typical choice', 'Teams that want one simple, self-hosted artifact store', 'Teams that already use JFrog Xray/Artifactory for security scanning across many registries'],
  ] },
  { t: 'code', lang: 'groovy', file: 'A real-looking Jenkinsfile stage (documentation only — not executed)', code: `stage('Publish to Artifactory') {
    steps {
        rtServer(id: 'artifactory-lab', url: 'https://mycompany.jfrog.io/artifactory', credentialsId: 'artifactory-deployer')
        rtMavenDeployer(id: 'deployer', serverId: 'artifactory-lab', releaseRepo: 'libs-release', snapshotRepo: 'libs-snapshot')
        rtMavenRun(tool: 'maven-3.9', pom: 'pom.xml', goals: 'clean install', deployerId: 'deployer')
        rtPublishBuildInfo(serverId: 'artifactory-lab')
    }
}`, lignes: [
    [2, 'Declares the server once; reused by every `rt*` step below.'],
    [5, 'The step that sets up Artifactory as this Maven run\'s deployment target.'],
    [7, 'Sends the Jenkins build number, commit and dependency graph alongside the artifact — the feature Nexus does not have out of the box.'],
  ] },
  { t: 'p', text: 'If you want to run this for real: create a free JFrog Platform instance, generate an access token, store it as a Secret text credential, and replace the server URL and credential ID above. The mechanics (a repository, a least-privilege token, a Jenkinsfile stage) are exactly the ones just built for Nexus in 10.5.' },

  { t: 'h', id: 'm10-7', text: '10.7 Docker and Kubernetes: already yours' },
  { t: 'p', text: 'This module\'s plan lists Docker and Kubernetes among the tools to connect — Modules 7 and 8 already built both for real, with their own labs, errors and fixes: building and pushing an image with a daemon reached over TLS (Module 7), and deploying with Helm into a `kind` cluster with probes, rolling updates and a canary (Module 8). Nothing here repeats that; Terraform in 10.3 manages the **shape** of that same cluster — namespaces, quotas, who may deploy — a layer above the applications Module 8 deploys into it.' },

  { t: 'h', id: 'm10-8', text: '10.8 GitHub and GitLab: what changes from Gitea' },
  { t: 'p', text: 'Module 5 built a Git flow — webhook-triggered multibranch pipelines, status checks — against a self-hosted Gitea, standing in for any Git server. `github.com` and `gitlab.com` are themselves unreachable from this offline lab, so this section documents the real differences rather than faking a connection.' },
  { t: 'table', head: ['', 'Gitea (Module 5, this lab)', 'GitHub', 'GitLab'], rows: [
    ['Branch discovery', '**Gitea Branch Source** plugin', '**GitHub Branch Source** plugin, OAuth App or a fine-grained PAT', '**GitLab Branch Source** / **GitLab** plugin, a Project/Personal Access Token'],
    ['Webhook payload', 'Gitea\'s own JSON, compatible with the generic webhook trigger', 'GitHub\'s event payload (`push`, `pull_request`…), signed with a shared secret (`X-Hub-Signature-256`)', 'GitLab\'s event payload, with its own secret token header (`X-Gitlab-Token`)'],
    ['Status back to the PR/MR', 'Commit status API, same shape as GitHub\'s', 'Checks API or Commit Status API — shown directly in the PR\'s "Checks" tab', 'Commit Status API — shown in the MR\'s pipeline widget'],
    ['What stays identical', 'Everything else: a `Jenkinsfile` in the repo, one pipeline per branch, a webhook that triggers a scan', 'same', 'same'],
  ] },
  { t: 'callout', kind: 'info', text: 'Swapping Gitea for GitHub or GitLab in a real job means: install the matching Branch Source plugin, create a credential of the right kind (a GitHub App or PAT; a GitLab token), and point the multibranch job at the new server. The `Jenkinsfile` itself — stages, steps, `when { branch }` — does not change at all.' },

  { t: 'h', id: 'm10-9', text: '10.9 Prometheus and Grafana: the controller\'s own health' },
  { t: 'p', text: 'The Prometheus metrics plugin (installed in section 10.4\'s batch) turns the Jenkins controller itself into something Prometheus can scrape — executors, queue, JVM memory, per-job history.' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/docker-compose.yml — services to add', code: COMPOSE_PROM_GRAFANA },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/prometheus/prometheus.yml', code: PROMETHEUS_YML, lignes: [
    [8, 'The plugin\'s endpoint — plain text, no authentication by default in this lab.'],
  ] },
  { t: 'cmd', where: 'Your terminal', cmd: 'curl -s http://localhost:8080/prometheus/ | head -3', out: `$ curl -s http://localhost:8080/prometheus/ | head -3
# HELP default_jenkins_executors_available Executors Available
# TYPE default_jenkins_executors_available gauge
default_jenkins_executors_available{label="docker",} 2.0` },
  { t: 'cmd', where: 'Prometheus — its own API, confirming the scrape worked', cmd: 'curl -s http://localhost:9090/api/v1/query?query=default_jenkins_up', out: `$ curl -s "http://localhost:9090/api/v1/query?query=default_jenkins_up"
{
    "status": "success",
    "data": {
        "resultType": "vector",
        "result": [
            {
                "metric": {
                    "__name__": "default_jenkins_up",
                    "instance": "jenkins:8080",
                    "job": "jenkins"
                },
                "value": [
                    1794975678.013,
                    "1"
                ]
            }
        ]
    }
}` },
  { t: 'h3', text: 'Grafana: a data source, then a dashboard' },
  { t: 'shot', id: 'm10-23-grafana-login', titre: 'Grafana — first login', ce: 'The admin password set by `GF_SECURITY_ADMIN_PASSWORD` in the Compose file.', éléments: ['`admin`.', 'The password from `.env` — change it in a real deployment.'], actions: ['Log in, then go straight to Connections → Data sources (next screenshot).'], résultat: 'Into an empty Grafana, with nothing configured yet.' },
  { t: 'shot', id: 'm10-24-grafana-datasource', titre: 'Connections → Data sources → Prometheus', ce: 'Grafana does not store metrics itself — it queries a source.', éléments: ['The data source type.', 'The URL, reached on the lab\'s own network.'], actions: ['Save & test.'], résultat: 'Confirmed on the next screenshot.' },
  { t: 'shot', id: 'm10-25-grafana-datasource-ok', titre: 'The result of Save & test', ce: 'A real query against Prometheus, not just a saved form.', éléments: ['"Successfully queried the Prometheus API."'], actions: ['If this fails instead, re-check the URL: it must be the Compose service name, not localhost.'], résultat: 'The dashboard below can now draw real data.' },
  { t: 'p', text: 'A small dashboard, provisioned through Grafana\'s own API — "dashboard as code", the same spirit as a Jenkinsfile:' },
  { t: 'cmd', where: 'Your terminal — the dashboard JSON, posted once', cmd: 'curl -u admin:*** -X POST -H "Content-Type: application/json" --data @dashboard.json http://localhost:3001/api/dashboards/db', out: `$ curl -u admin:*** -X POST -H "Content-Type: application/json" --data @dashboard.json \\
    http://localhost:3001/api/dashboards/db
{
  "folderUid": "",
  "id": 1636359877931008,
  "slug": "jenkins-lab",
  "status": "success",
  "uid": "jenkins-lab",
  "url": "/d/jenkins-lab/jenkins-lab",
  "version": 1
}` },
  { t: 'shot', id: 'm10-26-grafana-dashboard', titre: 'Grafana — dashboard "Jenkins (lab)"', ce: 'Six panels, all reading `default_jenkins_*` and JVM metrics.', éléments: ['**Controller up**: `default_jenkins_up`, mapped to UP/DOWN.', '**Executors busy, by node label**: mostly flat — a quiet lab is a correct reading, not a bug.', '**JVM heap used**: a metric that always moves, useful to confirm the whole pipeline (scrape → store → query → draw) actually works.'], actions: ['Trigger a few builds, then watch the busy-executors panel move.'], résultat: 'The same controller Modules 2–9 built, now observed instead of only operated.' },
  { t: 'callout', kind: 'enterprise', text: 'In a real company this dashboard is usually one of many: build duration trends, queue time per team, agent utilization across a fleet, SLOs on pipeline success rate. The mechanics shown here — scrape, data source, provisioned dashboard — are exactly how those bigger dashboards are built.' },

  { t: 'h', id: 'm10-10', text: '10.10 Common errors and fixes' },
  { t: 'errors', rows: [
    ['Ansible: `VERSION is empty`, exit 1', 'First run of a parameterized job has no parameters yet.', 'Run it once (it fails on purpose), then run again with real parameters — or set a sane default.'],
    ['Ansible: `Failed to lock apt for exclusive operation … Permission denied`', 'The playbook installs a package without `become: true`.', 'Add `become: true` at the play level; the target user needs passwordless `sudo`.'],
    ['Ansible `--check`: `src file does not exist, use \'force=yes\'`', 'A `file: state=link` task points at a path only a *later* task would create — check mode never runs that later task.', 'Add `force: true` to the link task, or restructure so check mode has nothing to dereference early.'],
    ['Terraform: `is attempting to grant RBAC permissions not currently held`', 'A ServiceAccount tried to bind a ClusterRole it cannot itself use.', 'Add an explicit `bind` privilege on exactly that role (`resourceNames: ["edit"]`) — never broader.'],
    ['Terraform: `no configuration has been provided, try setting KUBERNETES_MASTER`', '`init -backend=false` silently reused a previous run\'s backend state on the same `.terraform/` directory.', 'Validate after the real `init` with credentials, not before it with `-backend=false`.'],
    ['Terraform: `Error acquiring the state lock`', 'Another `apply`/`plan` is running against the same state right now.', 'Wait for it to finish; never `-lock=false` on shared state. `disableConcurrentBuilds()` prevents this from two Jenkins builds at once.'],
    ['SonarQube: webhook creation refused, `loopback… not allowed`', 'The target host resolves to a private/internal address.', 'In production this almost never triggers; in a lab sharing one private network, set `SONAR_VALIDATEWEBHOOKS=false` deliberately, with that trade-off understood.'],
    ['SonarQube: `waitForQualityGate` times out, never `OK` or `ERROR`', 'The webhook never reached Jenkins (wrong URL, firewall, secret mismatch).', 'Check *Administration → Webhooks* delivery history on the SonarQube side; confirm the secret matches both sides exactly.'],
    ['Nexus: `403` on every write, even as `admin`', 'The End User License Agreement has not been accepted for this Community Build instance.', 'Accept it once: the onboarding wizard, or `POST /service/rest/v1/system/eula` with the exact disclaimer text echoed back.'],
    ['Nexus: `403` only for one account, on `delete`', 'Correct, least-privilege behavior — not a bug to fix.', 'Grant `delete` only if that account genuinely needs it.'],
  ] },

  { t: 'h', id: 'm10-11', text: '10.11 Hands-on labs' },
  { t: 'lab', id: 'lab101', titre: 'Lab 10.1 — Deploy over SSH with Ansible, break it, fix it', durée: '40 min', objectif: 'Run a real Ansible deployment from Jenkins, and recover from two real failures.', étapes: [
    { t: 'p', text: '**1.** Add `app-1` to the lab (section 10.2), pin its host key, create the `ansible-ssh-key` credential.' },
    { t: 'p', text: '**2.** Create `stock-ansible` **without** `become: true`. Run it with `VERSION=1.0.0`.' },
    { t: 'p', text: '**3.** Add `become: true`. Deploy 1.0.0, then 1.0.1 with `DRY_RUN=true` **before** adding `force: true` on the link task.' },
    { t: 'p', text: '**4.** Add `force: true`. Deploy 1.0.1 for real.' },
  ], solution: [
    { t: 'ul', items: ['Step 2: `Failed to lock apt for exclusive operation … Permission denied`.', 'Step 3: `src file does not exist, use \'force=yes\'`.', 'Step 4: `PLAY RECAP` shows `changed`, and `curl http://app-1/` serves 1.0.1.'] },
  ] },
  { t: 'lab', id: 'lab102', titre: 'Lab 10.2 — Terraform with a human gate and a locked state', durée: '35 min', objectif: 'Plan, approve, hit a real RBAC wall, and understand state locking.', étapes: [
    { t: 'p', text: '**1.** Apply the RBAC of section 10.3 **without** the `bind` privilege on `edit`. Run `platform-terraform`.' },
    { t: 'p', text: '**2.** Add the missing privilege, re-apply RBAC, run again: the first real `apply`.' },
    { t: 'p', text: '**3.** Change a quota in `teams.auto.tfvars`, open a plan, and **abort** it instead of approving. Check the cluster did not change.' },
    { t: 'p', text: '**4.** Start a second `terraform apply` in another terminal against the same state while a pipeline run is mid-approval. What happens to the second one?' },
  ], solution: [
    { t: 'ul', items: ['Step 1: `is attempting to grant RBAC permissions not currently held`.', 'Step 3: `kubectl get resourcequota` on the team\'s namespace still shows the old value.', 'Step 4: `Error acquiring the state lock`, naming the first client\'s `Who:`.'] },
  ] },
  { t: 'lab', id: 'lab103', titre: 'Lab 10.3 — Make a quality gate fail, then fix it with a test', durée: '35 min', objectif: 'Connect SonarQube for real, and watch the gate do its job.', étapes: [
    { t: 'p', text: '**1.** Generate a token (*Global Analysis Token*) and a webhook secret; configure the `sonarqube-lab` server in Jenkins.' },
    { t: 'p', text: '**2.** Create `stock-api-sonar` and run it once: note the quality gate result.' },
    { t: 'p', text: '**3.** Add a new public method of at least 20 lines, with branches, and **no test**. Run again.' },
    { t: 'p', text: '**4.** Write a test that exercises every branch of that method. Run a third time.' },
  ], solution: [
    { t: 'ul', items: ['Step 2: `Quality gate is \'OK\'` — nothing to compare against yet.', 'Step 3: `Quality gate is \'ERROR\'`, pipeline aborted; `new_coverage` near 0% on the SonarQube dashboard.', 'Step 4: `Quality gate is \'OK\'` again, this time for a real reason.'] },
  ] },
  { t: 'exercise', id: 'ex104', titre: 'Exercise 10.4 — Choose the Nexus privilege', énoncé: [
    { t: 'p', text: 'For each account, name the exact privileges (among `add`, `browse`, `read`, `edit`, `delete`) its role should hold on `maven-releases`: (a) the Jenkins account that publishes releases; (b) a developer who only needs to resolve dependencies from Nexus in their local Maven; (c) a release manager who must be able to remove a badly published artifact.' },
  ], solution: [
    { t: 'ul', items: ['(a) `add`, `edit`, `browse`, `read` — exactly `nexus-deployer`\'s role in this module (`edit` because a second version rewrites `maven-metadata.xml`). No `delete`: a CI account should not be able to erase history.', '(b) `browse`, `read` only.', '(c) `browse`, `read`, `delete` — and ideally a separate, personal account, audited, not shared.'] },
  ] },

  { t: 'recap', items: [
    'Ansible: `ansiblePlaybook()`, the same key credential and pinned host keys as Module 9; `become` for `sudo`; `force: true` for a link to a not-yet-created target in check mode.',
    'Terraform: state locked in the cluster itself; a real `input` step for human approval; least-privilege RBAC must grant `bind` explicitly, not just CRUD verbs.',
    'SonarQube: `withSonarQubeEnv()` + `waitForQualityGate()` genuinely blocks and can abort — verified here with a real failure and a real fix, not a staged one.',
    'A quality gate exempts small changes from new-code coverage checks, and trivially passes test-only changes — know both before trusting a green gate blindly.',
    'Nexus: a least-privilege account needs `add` **and** `edit` to publish more than one version (`edit` updates the shared `maven-metadata.xml`), plus `read`/`browse`, never `delete`; this Community Build also requires accepting its EULA before any write, independent of permissions.',
    'Artifactory adds Jenkins-native build metadata over what Nexus offers; otherwise the same mechanics (server, least-privilege token, Jenkinsfile stage).',
    'GitHub and GitLab replace Gitea\'s branch-source plugin and webhook signing, but change nothing in the Jenkinsfile itself.',
    'Prometheus scrapes Jenkins\' own `/prometheus/` endpoint; Grafana queries Prometheus — dashboards can be provisioned as code, the same spirit as a Jenkinsfile.',
  ] },
  { t: 'quiz', id: 'quiz10', questions: [
    { q: 'An Ansible task installs a package and fails with "Permission denied" on an apt lock file. The fix?', choix: ['Run the whole playbook as root', 'Add become: true to the play', 'Disable the firewall', 'Retry the build'], bonne: 1, pourquoi: '`deploy` has sudo; the play simply never asked to use it.' },
    { q: 'Ansible check mode fails on a file:state=link task with "src file does not exist". Why does only check mode fail?', choix: ['Ansible bug, ignore it', 'The link\'s target is created by a later task, which check mode never runs', 'The key is wrong', 'The inventory is wrong'], bonne: 1, pourquoi: '`force: true` tells the link task to proceed even without the target existing yet.' },
    { q: 'Terraform state for this module lives…', choix: ['On the Jenkins agent\'s disk', 'In a Secret inside the Kubernetes cluster itself, locked by a Lease', 'In Git', 'In SonarQube'], bonne: 1, pourquoi: 'The `kubernetes` backend in versions.tf, locked so two writers cannot collide.' },
    { q: 'A ServiceAccount can create RoleBinding objects but Kubernetes still refuses one granting the role "edit". Why?', choix: ['Syntax error', 'It cannot bind a role it has no explicit bind privilege for, even one it could otherwise create', 'Out of memory', 'The namespace does not exist'], bonne: 1, pourquoi: 'Creating the object and binding the role are two different RBAC checks.' },
    { q: 'withSonarQubeEnv() + waitForQualityGate(): the pipeline…', choix: ['Only records the result for later', 'Blocks until the webhook reports the result, and can abort the build', 'Skips the quality gate entirely', 'Needs no webhook'], bonne: 1, pourquoi: 'Confirmed in this module with a real failing gate that aborted the build.' },
    { q: 'A pipeline adds one small untested method; the quality gate still reports OK with ignoredConditions:true. Why?', choix: ['SonarQube is broken', 'A small-change exemption skips new-code coverage/duplication checks below a certain size', 'The webhook failed', 'Tests were actually added'], bonne: 1, pourquoi: 'Real, documented SonarQube behavior — not something to rely on for larger changes.' },
    { q: 'A commit adds only new test files, no production code. The coverage condition then…', choix: ['Fails, since nothing is covered', 'Passes trivially: there is no new production code to cover', 'Needs a manual override', 'Is skipped only for Java'], bonne: 1, pourquoi: 'Coverage is measured on src/main code; tests themselves are not counted as code to cover.' },
    { q: 'Even as admin, every write to this lab\'s Nexus returned 403 at first. The real cause was…', choix: ['A wrong password', 'The EULA not yet accepted for this instance', 'A missing role', 'A network firewall'], bonne: 1, pourquoi: 'Resolved by accepting the EULA via the onboarding wizard or the REST API — unrelated to any specific user\'s permissions.' },
    { q: 'The jenkins-deployer account on Nexus can add and read artifacts, but a DELETE is refused with 403. This is…', choix: ['A bug to fix immediately', 'Correct: its role was never granted the delete privilege', 'Impossible: admin accounts bypass this', 'Caused by the EULA again'], bonne: 1, pourquoi: 'Least privilege, verified directly in this module.' },
    { q: 'Moving a Jenkinsfile from a Gitea server to GitHub mainly requires…', choix: ['Rewriting every stage', 'A different branch-source plugin and credential kind; the Jenkinsfile itself barely changes', 'Switching to GitHub Actions', 'Nothing at all, not even a credential'], bonne: 1, pourquoi: 'The Jenkinsfile\'s stages and steps are Git-server-agnostic; only the connection layer changes.' },
  ] },
  { t: 'checklist', id: 'm10', items: [
    'I deployed over SSH with Ansible from a pipeline, using a pinned host key and a key credential.',
    'I ran a real Terraform apply with a human approval step, and saw drift and a state lock happen for real.',
    'I connected SonarQube so waitForQualityGate() genuinely blocks — and I made a gate fail, then fixed it with a test.',
    'I published an artifact to Nexus with a least-privilege account, and know why even admin was refused at first (the EULA).',
    'I can explain, without an account, what Artifactory adds over Nexus.',
    'I know exactly what changes — and what does not — moving from Gitea to GitHub or GitLab.',
    'I scraped Jenkins\' own metrics with Prometheus and read them in a Grafana dashboard.',
  ] },
]

export default MODULE10
