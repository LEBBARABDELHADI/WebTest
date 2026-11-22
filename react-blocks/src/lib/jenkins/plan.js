// Learning Jenkins — course plan (English content). Each module lists its objectives, topics and labs.
// Modules marked `disponible: true` are fully written; the others are announced with their outline and
// are developed one by one, in order.

export const LAB = {
  jenkins: '2.580.2',
  ligne: 'LTS',
  image: 'jenkins/jenkins:2.580.2-lts-jdk21',
  java: 'Eclipse Temurin 21.0.13',
  os: 'Debian GNU/Linux 13 (trixie) inside the container',
  compose: 'Docker Compose v5.6.1',
  docker: 'Docker Engine 29.9.2',
  date: '2026-11-17',
}

export const NIVEAUX = {
  débutant: { nom: 'Beginner', couleur: '#2e9e6b' },
  intermédiaire: { nom: 'Intermediate', couleur: '#2563eb' },
  avancé: { nom: 'Advanced', couleur: '#d97706' },
  expert: { nom: 'Expert', couleur: '#c2410c' },
}

export const PLAN = [
  {
    id: 'lab0', num: 'Lab 0', titre: 'Run Jenkins locally', niveau: 'débutant', durée: '45 min', disponible: true,
    résumé: 'Start a real Jenkins LTS on your machine with Docker Compose, unlock it, install the suggested plugins and run a first job.',
    objectifs: ['Start Jenkins 2.580.2 LTS with Docker Compose', 'Unlock it and complete the setup wizard', 'Run and read a first build', 'Stop, start, back up and reset the lab'],
    sujets: ['Prerequisites', 'docker-compose.yml explained line by line', 'Initial admin password', 'Suggested plugins', 'First admin user', 'Sanity-check job', 'Day-2 operations', 'Troubleshooting'],
    tp: ['Lab 0 — your local Jenkins, verified by a first build'],
  },
  {
    id: 'm1', num: 'Module 1', titre: 'Introduction to Jenkins', niveau: 'débutant', durée: '2 h', disponible: true,
    résumé: 'What Jenkins is, why DevOps teams use it, CI vs continuous delivery vs continuous deployment, how it compares with GitLab CI/CD, GitHub Actions and Azure DevOps, and how the controller and agents work.',
    objectifs: ['Explain what Jenkins is and the problems it solves', 'Tell CI, continuous delivery and continuous deployment apart', 'Compare Jenkins with GitLab CI/CD, GitHub Actions and Azure DevOps', 'Describe the controller/agent architecture and the life of a build', 'Explain how Jenkins and Ansible work together'],
    sujets: ['What is Jenkins?', 'Why Jenkins in DevOps', 'CI and CD', 'CI vs delivery vs deployment', 'Tool comparison', 'Architecture', 'Controller and agents', 'Jenkins and Ansible', 'Glossary'],
    tp: ['Lab 1.1 — Explore the architecture of your Jenkins', 'Lab 1.2 — Your first pipeline as code (preview)', 'Exercises: classify pipelines, choose a CI tool'],
  },
  {
    id: 'm2', num: 'Module 2', titre: 'Installation and configuration', niveau: 'débutant', durée: '3 h', disponible: true,
    résumé: 'Every supported way to install Jenkins — apt and systemd, a reproducible VM, Docker Compose with a build agent, a controller rebuilt from code — then plugins, users, rights and the first security measures.',
    objectifs: ['Install Jenkins on Ubuntu/Debian with the official apt repository and systemd', 'Install it reproducibly on a virtual machine (Vagrant)', 'Add a WebSocket build agent and stop building on the controller', 'Build a production-like controller with plugins.txt, Configuration as Code and Docker secrets', 'Manage plugins, users and permissions', 'Apply the first security measures (HTTPS reverse proxy, CSP)'],
    sujets: ['Technical prerequisites (Java 21/25, RAM, disk, ports)', 'Choosing an installation method', 'Ubuntu/Debian (apt, systemd override)', 'Virtual machine (Vagrant, provisioning script)', 'Plugin management', 'Docker Compose build agent (WebSocket)', 'plugins.txt and Configuration as Code (JCasC)', 'Users and rights (Matrix authorization)', 'Securing the instance (Nginx HTTPS, CSP)', 'Real errors and fixes'],
    tp: ['Lab 2.1 — Ubuntu VM with apt and systemd', 'Lab 2.2 — A build agent, 0 executors on the controller', 'Lab 2.3 — Users and a role matrix', 'Lab 2.4 — Jenkins behind Nginx with HTTPS', 'Lab 2.5 — A controller rebuilt from code'],
  },
  {
    id: 'm3', num: 'Module 3', titre: 'Mastering the Jenkins UI', niveau: 'débutant', durée: '3 h', disponible: true,
    résumé: 'Dashboard, jobs, builds, logs, parameters, environment variables and credentials — with annotated screenshots for every important action.',
    objectifs: ['Navigate the dashboard and views', 'Create and configure a Freestyle project', 'Manage builds, history and console output', 'Use parameters and environment variables', 'Store and use credentials'],
    sujets: ['Dashboard and views', 'New Item', 'Freestyle configuration', 'Builds and history', 'Console output', 'Parameters', 'Environment variables', 'Credentials'],
    tp: ['Lab 3.1 — A parameterized Freestyle job', 'Lab 3.2 — Use a secret text credential without leaking it', 'Lab 3.3 — Trigger and follow a build from the command line'],
  },
  {
    id: 'm4', num: 'Module 4', titre: 'Jenkins Pipeline', niveau: 'intermédiaire', durée: '5 h', disponible: true,
    résumé: 'Pipeline as code: Declarative vs Scripted, the Jenkinsfile structure, variables, when, parameters, error handling and artifacts — with commented Jenkinsfiles.',
    objectifs: ['Write Declarative pipelines from scratch', 'Read and adapt Scripted pipelines', 'Use variables, parameters and when conditions', 'Handle errors with post and try/catch', 'Archive and reuse artifacts'],
    sujets: ['What is a Pipeline?', 'Scripted vs Declarative', 'Jenkinsfile structure', 'pipeline, agent, stages, stage, steps', 'Variables', 'when', 'Parameters', 'post, try/catch', 'Artifacts'],
    tp: ['Lab 4.1 — Five Jenkinsfiles of growing complexity', 'Lab 4.2 — Fix a broken pipeline'],
  },
  {
    id: 'm5', num: 'Module 5', titre: 'Git integration', niveau: 'intermédiaire', durée: '4 h', disponible: true,
    résumé: 'Connect Jenkins to Git with a bot token, read the Jenkinsfile from SCM, trigger builds with webhooks, build every branch and pull request (GitFlow) and report statuses — on a real Gitea server, with the GitHub, GitLab and Bitbucket equivalents.',
    objectifs: ['Connect Jenkins to a Git repository with credentials', 'Configure webhooks for GitHub, GitLab and Bitbucket', 'Use Multibranch Pipelines', 'Apply a GitFlow branching strategy', 'Build every commit and pull request'],
    sujets: ['Git connection', 'GitHub, GitLab, Bitbucket', 'Webhooks', 'Automatic triggers', 'Branches', 'GitFlow', 'Pull/merge request pipelines'],
    tp: ['Lab 5.1 — A Jenkinsfile read from Git', 'Lab 5.2 — A multibranch pipeline triggered by a webhook', 'Lab 5.3 — Status checks on pull requests'],
  },
  {
    id: 'm6', num: 'Module 6', titre: 'Continuous Integration (CI)', niveau: 'intermédiaire', durée: '5 h', disponible: true,
    résumé: 'Three real projects — Java/Maven, Node.js, Python — built by multibranch pipelines: checkout, build, unit tests, coverage, code quality, security scan, versioned artifacts and publication to a package registry, with the real failures and their fixes.',
    objectifs: ['Build and test Java/Maven, Node.js and Python projects', 'Publish test reports and coverage', 'Turn code quality, coverage and vulnerabilities into quality gates', 'Produce versioned artifacts and publish them'],
    sujets: ['CI build agent', 'Checkout', 'Compilation', 'Unit tests (JUnit reports)', 'Coverage', 'Code quality (Checkstyle, ESLint, flake8)', 'Security analysis (OSV-Scanner)', 'Artifacts and fingerprints', 'Publishing to a registry'],
    tp: ['Lab 6.1: CI for a Maven project', 'Lab 6.2: quality gates for Node.js and Python', 'Lab 6.3: FAILURE or UNSTABLE when a test fails', 'Lab 6.4: publish to a package registry'],
  },
  {
    id: 'm7', num: 'Module 7', titre: 'Jenkins and Docker', niveau: 'intermédiaire', durée: '4 h', disponible: true,
    résumé: 'A Docker daemon over mutual TLS in the lab, and a real service built, tested in a container, tagged, published to a registry and deployed by its pipeline — with the real mistakes: bash-only syntax, tokens left on the agent, colliding container names, a broken image stopped by its health check.',
    objectifs: ['Give Jenkins access to Docker safely', 'Build images and tag them properly', 'Push to a private registry or Docker Hub without leaking the token', 'Deploy and clean up containers'],
    sujets: ['Docker set-ups (socket, Docker-in-Docker over TLS, rootless)', 'Docker in Jenkins (agents, docker CLI, Docker Pipeline)', 'A Dockerfile for CI', 'Building images', 'Container tests', 'Tags', 'Publishing', 'Deploying containers', 'Cleanup'],
    tp: ['Lab 7.1: give Jenkins a Docker daemon', 'Lab 7.2: build, publish and deploy an image', 'Lab 7.3: break the image, read the diagnosis', 'Lab 7.4: the cleanup job'],
  },
  {
    id: 'm8', num: 'Module 8', titre: 'Jenkins and Kubernetes', niveau: 'avancé', durée: '5 h', disponible: true,
    résumé: 'A real Kubernetes 1.37 cluster (kind) in the lab: least-privilege service accounts, builds in ephemeral pods, a deployment pipeline with manifests then Helm 4, zero downtime measured and fixed, automatic rollbacks, and a real canary.',
    objectifs: ['Connect Jenkins to a cluster with least privilege', 'Run builds in ephemeral pod agents', 'Deploy with manifests and Helm, roll back automatically', 'Measure and choose a deployment strategy'],
    sujets: ['Jenkins/Kubernetes integration', 'Cluster setup (kind)', 'RBAC for Jenkins', 'Kubernetes cloud and pod agents', 'Automatic deployment', 'YAML manifests', 'Zero-downtime rolling updates', 'Helm charts and releases', 'Rolling, blue/green, canary'],
    tp: ['Lab 8.1: a cluster that Jenkins can use', 'Lab 8.2: your first pod agent', 'Lab 8.3: deploy, measure, fail safely', 'Lab 8.4: Helm and a canary'],
  },
  {
    id: 'm9', num: 'Module 9', titre: 'Credentials and security', niveau: 'avancé', durée: '4 h', disponible: true,
    résumé: 'Credentials kinds, scopes and stores, an SSH deployment with a pinned host key, bot tokens, the real limits of log masking (a pipeline that leaks a fake secret five ways), folder-scoped credentials, authorization, the Groovy sandbox and a hardening checklist.',
    objectifs: ['Choose the right credential type, scope and store', 'Use SSH keys and tokens in pipelines', 'Configure authentication and authorization', 'Prevent secrets from reaching logs and artifacts'],
    sujets: ['Secrets management', 'Jenkins credentials', 'SSH keys and host keys', 'Access tokens', 'Masking and its limits', 'Folder-scoped credentials', 'Authentication and authorization', 'Script security and the sandbox', 'Hardening best practices'],
    tp: ['Lab 9.1: deploy over SSH with a key credential', 'Lab 9.2: audit a pipeline that leaks a secret', 'Lab 9.3: credentials and scripts under control'],
  },
  {
    id: 'm10', num: 'Module 10', titre: 'Jenkins and DevOps tools', niveau: 'avancé', durée: '6 h', disponible: true,
    résumé: 'Six real tools connected to the lab controller — Ansible, Terraform, SonarQube, Nexus, Prometheus and Grafana — with a genuine quality-gate failure and fix; Artifactory explained; what changes for GitHub/GitLab.',
    objectifs: ['Run Ansible and Terraform from a pipeline, with a real human approval gate', 'Make a SonarQube quality gate genuinely block a build, then fix it with a test, not a threshold', 'Publish to Nexus with a least-privilege account', 'Scrape Jenkins\' own metrics with Prometheus and read them in Grafana'],
    sujets: ['Ansible', 'Terraform', 'SonarQube', 'Nexus', 'JFrog Artifactory', 'Docker and Kubernetes (cross-reference)', 'GitHub/GitLab (cross-reference)', 'Prometheus and Grafana'],
    tp: ['Lab 10.1: deploy over SSH with Ansible, break it, fix it', 'Lab 10.2: Terraform with a human gate and a locked state', 'Lab 10.3: make a quality gate fail, then fix it with a test'],
  },
  {
    id: 'm11', num: 'Module 11', titre: 'End-to-end CI/CD case studies', niveau: 'avancé', durée: '5 h', disponible: true,
    résumé: 'Five real pipelines that chain Modules 6 to 10 end to end — no new tool: a quality gate that genuinely blocks a release, a CI job that triggers its own CD job, and a dependency scan plus an image scan feeding one real security gate.',
    objectifs: ['Chain build, test and a real quality gate into one Java pipeline, Git to published artifact', 'Chain test, a dependency scan, an image scan and a registry push into one Docker pipeline', 'Make a CI pipeline trigger its own CD pipeline, with no person clicking between the two', 'Give an Ansible inventory per-host variables, not just per-group ones'],
    sujets: ['Java: Git → Maven → tests → SonarQube → Nexus', 'Docker: Git → build → image scan → a registry (Docker Hub documented, not run)', 'Kubernetes: one pipeline triggering another, automatically', 'Ansible: host_vars overriding group_vars on one server only', 'DevSecOps: dependency scan + image scan feeding one real error()-based gate'],
    tp: ['Lab 11.1: Java build, test, quality gate, publish — in one pipeline', 'Lab 11.2: Docker build and registry push, a second registry documented', 'Lab 11.3: one pipeline triggers a Kubernetes deployment automatically', 'Lab 11.4: Ansible host_vars, a real per-server difference', 'Lab 11.5: dependency scan + image scan + a security gate that can really stop a release'],
  },
  {
    id: 'm12', num: 'Module 12', titre: 'Administration and operations', niveau: 'expert', durée: '5 h', disponible: true,
    résumé: 'The same controller and agents, operated for real: a new agent node taken offline for maintenance with a real queue reacting to it, a scoped backup proven by restoring it on a disposable instance, real logs, a real plugin update with a real Safe Restart, real Prometheus numbers under load, and a real disk-space admin warning, deliberately provoked and reverted.',
    objectifs: ['Add a node with labels and take it offline for maintenance without failing a single build', 'Back up JENKINS_HOME on purpose, scoped, and prove the restore on a disposable instance', 'Read real logs with a targeted recorder, and know what a support bundle needs', 'Update a plugin for real and understand what Safe Restart actually waits for', 'Read real executor and queue metrics under real load'],
    sujets: ['Agents and nodes', 'Resources', 'Backup and restore', 'Logs', 'Maintenance', 'Upgrades', 'Plugins', 'Performance', 'Troubleshooting'],
    tp: ['Lab 12.1: a new agent with labels, taken offline for maintenance', 'Lab 12.2: a backup proven by a real restore on a disposable instance', 'Exercise: logs, plugins, performance, disk space'],
  },
  {
    id: 'm13', num: 'Module 13', titre: 'Final professional project', niveau: 'expert', durée: '10 h',
    résumé: 'An enterprise DevOps chain: GitLab/GitHub → Jenkins → Maven → SonarQube → Docker → Nexus/Registry → Kubernetes → Ansible.',
    objectifs: ['Design, build, validate and troubleshoot a complete enterprise pipeline'],
    sujets: ['Architecture and diagram', 'Prerequisites', 'Configurations', 'Jenkinsfiles', 'Scripts', 'Dockerfiles', 'Kubernetes manifests', 'Ansible playbooks', 'Execution steps', 'Validation tests', 'Troubleshooting procedures'],
    tp: ['The final project, with validation checklist'],
  },
]

// Ce que contient chaque module (rappel de la structure pédagogique).
export const STRUCTURE = ['Learning objectives', 'Introduction and core concepts', 'Detailed explanations', 'Architecture diagrams', 'Real-world examples', 'Commands explained step by step', 'Real screenshots of Jenkins', 'Hands-on labs with solutions', 'Common errors and fixes', 'Recap, quiz and validation checklist']
