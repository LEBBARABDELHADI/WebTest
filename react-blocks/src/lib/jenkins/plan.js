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
    id: 'm3', num: 'Module 3', titre: 'Mastering the Jenkins UI', niveau: 'débutant', durée: '3 h',
    résumé: 'Dashboard, jobs, builds, logs, parameters, environment variables and credentials — with annotated screenshots for every important action.',
    objectifs: ['Navigate the dashboard and views', 'Create and configure a Freestyle project', 'Manage builds, history and console output', 'Use parameters and environment variables', 'Store and use credentials'],
    sujets: ['Dashboard and views', 'New Item', 'Freestyle configuration', 'Builds and history', 'Console output', 'Parameters', 'Environment variables', 'Credentials'],
    tp: ['A parameterized Freestyle job', 'Use a secret text credential without leaking it'],
  },
  {
    id: 'm4', num: 'Module 4', titre: 'Jenkins Pipeline', niveau: 'intermédiaire', durée: '5 h',
    résumé: 'Pipeline as code: Declarative vs Scripted, the Jenkinsfile structure, variables, when, parameters, error handling and artifacts — with commented Jenkinsfiles.',
    objectifs: ['Write Declarative pipelines from scratch', 'Read and adapt Scripted pipelines', 'Use variables, parameters and when conditions', 'Handle errors with post and try/catch', 'Archive and reuse artifacts'],
    sujets: ['What is a Pipeline?', 'Scripted vs Declarative', 'Jenkinsfile structure', 'pipeline, agent, stages, stage, steps', 'Variables', 'when', 'Parameters', 'post, try/catch', 'Artifacts'],
    tp: ['Five commented Jenkinsfiles of growing complexity', 'Fix a broken pipeline'],
  },
  {
    id: 'm5', num: 'Module 5', titre: 'Git integration', niveau: 'intermédiaire', durée: '4 h',
    résumé: 'Connect Jenkins to Git, GitHub, GitLab and Bitbucket, trigger builds with webhooks and build branches and pull requests.',
    objectifs: ['Connect Jenkins to a Git repository with credentials', 'Configure webhooks for GitHub, GitLab and Bitbucket', 'Use Multibranch Pipelines', 'Apply a GitFlow branching strategy', 'Build every commit and pull request'],
    sujets: ['Git connection', 'GitHub, GitLab, Bitbucket', 'Webhooks', 'Automatic triggers', 'Branches', 'GitFlow', 'Pull/merge request pipelines'],
    tp: ['Multibranch pipeline triggered by a webhook', 'Status checks on pull requests'],
  },
  {
    id: 'm6', num: 'Module 6', titre: 'Continuous Integration (CI)', niveau: 'intermédiaire', durée: '5 h',
    résumé: 'Complete CI pipelines for Java/Maven, Node.js and Python: checkout, build, unit tests, code quality, security analysis, artifacts and published results.',
    objectifs: ['Build and test Java/Maven, Node.js and Python projects', 'Publish test reports and coverage', 'Add code quality and security analysis', 'Produce versioned artifacts'],
    sujets: ['Checkout', 'Compilation', 'Unit tests (JUnit reports)', 'Code quality', 'Security analysis', 'Artifacts', 'Publishing results'],
    tp: ['CI for a Maven app', 'CI for a Node.js app', 'CI for a Python app'],
  },
  {
    id: 'm7', num: 'Module 7', titre: 'Jenkins and Docker', niveau: 'intermédiaire', durée: '4 h',
    résumé: 'Build, tag, publish and run Docker images from Jenkins, and keep the hosts clean.',
    objectifs: ['Give Jenkins access to Docker safely', 'Build images and tag them properly', 'Push to Docker Hub or a private registry', 'Deploy and clean up containers'],
    sujets: ['Docker setup', 'Docker in Jenkins (agents, docker CLI, Docker Pipeline)', 'Building images', 'Tags', 'Publishing', 'Deploying containers', 'Cleanup'],
    tp: ['Pipeline: build and publish a Docker image'],
  },
  {
    id: 'm8', num: 'Module 8', titre: 'Jenkins and Kubernetes', niveau: 'avancé', durée: '5 h',
    résumé: 'Kubernetes agents, automatic deployments with manifests and Helm, and deployment strategies.',
    objectifs: ['Connect Jenkins to a cluster', 'Run builds in ephemeral pod agents', 'Deploy with manifests and Helm', 'Choose a deployment strategy'],
    sujets: ['Jenkins/Kubernetes integration', 'Cluster setup (kind/minikube)', 'Connecting Jenkins', 'Kubernetes agents', 'Automatic deployment', 'YAML manifests', 'Helm', 'Rolling, blue/green, canary'],
    tp: ['Pod agents + deployment to a local cluster'],
  },
  {
    id: 'm9', num: 'Module 9', titre: 'Credentials and security', niveau: 'avancé', durée: '4 h',
    résumé: 'Secrets, SSH keys, tokens, permissions, authentication and authorization — and how to never leak a secret in a log.',
    objectifs: ['Choose the right credential type and scope', 'Use SSH keys and tokens in pipelines', 'Configure authentication and authorization', 'Prevent secrets from reaching the logs'],
    sujets: ['Secrets management', 'Jenkins credentials', 'SSH keys', 'Access tokens', 'Sensitive variables', 'Permissions', 'Authentication and authorization', 'Hardening best practices', 'Masking secrets in logs'],
    tp: ['Deploy over SSH with a key credential', 'Audit a pipeline that leaks a secret'],
  },
  {
    id: 'm10', num: 'Module 10', titre: 'Jenkins and DevOps tools', niveau: 'avancé', durée: '6 h',
    résumé: 'Architecture, configuration and a working example for Ansible, Terraform, SonarQube, Nexus, Artifactory, Docker, Kubernetes, GitLab/GitHub, Prometheus and Grafana.',
    objectifs: ['Integrate each tool with the right plugin or mechanism', 'Understand the architecture of each integration', 'Run a working example for each'],
    sujets: ['Ansible', 'Terraform', 'SonarQube', 'Nexus', 'JFrog Artifactory', 'Docker', 'Kubernetes', 'GitLab/GitHub', 'Prometheus and Grafana'],
    tp: ['One working pipeline per tool'],
  },
  {
    id: 'm11', num: 'Module 11', titre: 'End-to-end CI/CD case studies', niveau: 'avancé', durée: '8 h',
    résumé: 'Five complete projects, from Git to production.',
    objectifs: ['Chain all the previous modules into real pipelines'],
    sujets: ['Java: Git → Jenkins → Maven → tests → SonarQube', 'Docker: Git → Jenkins → build → Docker Hub', 'Kubernetes: Git → Jenkins → image → registry → cluster', 'Ansible: playbooks, inventories and variables on several servers', 'DevSecOps: tests, SonarQube, dependency scan, image scan, security gates'],
    tp: ['Lab 11.1 to 11.5'],
  },
  {
    id: 'm12', num: 'Module 12', titre: 'Administration and operations', niveau: 'expert', durée: '5 h',
    résumé: 'Agents and nodes, resources, backup and restore, logs, maintenance, upgrades, plugins, performance and troubleshooting.',
    objectifs: ['Run builds on agents only', 'Back up and restore JENKINS_HOME', 'Upgrade Jenkins and plugins safely', 'Diagnose and fix production issues'],
    sujets: ['Agents', 'Nodes', 'Resources', 'Backup and restore', 'Logs', 'Maintenance', 'Upgrades', 'Plugins', 'Performance', 'Troubleshooting'],
    tp: ['Add an SSH agent with labels and take a node offline for maintenance', 'Restore a backup on a fresh instance'],
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
