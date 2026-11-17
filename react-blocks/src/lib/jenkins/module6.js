// Module 6 — Continuous Integration. Three projects (Java/Maven, Node.js, Python) built by multibranch
// pipelines on agent-1; every screenshot, console output and error comes from the lab (Jenkins 2.580.2 LTS,
// Gitea 28.4.0, 2026-11-17). The code constants are generated from the files that ran.

export const AGENT_DOCKERFILE = `# ~/jenkins-lab/agent/Dockerfile — the build agent of the lab, with the CI tools of Module 6
FROM jenkins/inbound-agent:3395.v6e5377b_0fb_3c-5-jdk21

USER root
# Java 21 is already in the base image; add Maven, Python 3, utilities and libatomic1 (needed by Node.js 26)
RUN apt-get update \\
 && apt-get install -y --no-install-recommends maven python3 python3-venv python3-pip curl xz-utils libatomic1 \\
 && rm -rf /var/lib/apt/lists/*

# Node.js 26 LTS, official binaries (checksum verified)
ARG NODE_VERSION=26.13.1
ARG NODE_SHA256=5c063e46bab0fbc1c17cc445d7ff129cbdcd0471be6ed83b6ab864f8143bc864
RUN curl -fsSLo /tmp/node.tar.xz https://nodejs.org/dist/v\${NODE_VERSION}/node-v\${NODE_VERSION}-linux-x64.tar.xz \\
 && echo "\${NODE_SHA256}  /tmp/node.tar.xz" | sha256sum -c - \\
 && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 && rm /tmp/node.tar.xz

# OSV-Scanner: finds known vulnerabilities in dependencies (Maven, npm, PyPI…)
ARG OSV_VERSION=2.7.1
RUN curl -fsSLo /usr/local/bin/osv-scanner \\
      https://github.com/google/osv-scanner/releases/download/v\${OSV_VERSION}/osv-scanner_linux_amd64 \\
 && chmod +x /usr/local/bin/osv-scanner

USER jenkins
`

export const COMPOSE_AGENT_BUILD = `  agent-1:
    build: ./agent                            # Module 6: official inbound agent + CI tools (agent/Dockerfile)
    image: lab/build-agent:1                  # name of the image built from agent/Dockerfile
`

export const POM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!-- lab/stock-api — pom.xml: a small Java 21 library built by Jenkins (Module 6) -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>stock-api</artifactId>
  <version>\${revision}</version>

  <properties>
    <revision>1.0.0-SNAPSHOT</revision>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>6.1.3</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <!-- where "mvn deploy" publishes: the Maven registry of the Gitea organization "lab" -->
  <distributionManagement>
    <repository>
      <id>gitea</id>
      <url>http://gitea:3000/api/packages/lab/maven</url>
    </repository>
  </distributionManagement>

  <build>
    <plugins>
      <plugin>
        <!-- writes the real version (not \${revision}) into the published POM -->
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>flatten-maven-plugin</artifactId>
        <version>1.9.0</version>
        <configuration>
          <updatePomFile>true</updatePomFile>
          <flattenMode>resolveCiFriendliesOnly</flattenMode>
        </configuration>
        <executions>
          <execution>
            <id>flatten</id>
            <phase>process-resources</phase>
            <goals><goal>flatten</goal></goals>
          </execution>
          <execution>
            <id>flatten-clean</id>
            <phase>clean</phase>
            <goals><goal>clean</goal></goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.16.0</version>
      </plugin>
      <plugin>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.6.1</version>
      </plugin>
      <plugin>
        <artifactId>maven-jar-plugin</artifactId>
        <version>3.5.1</version>
      </plugin>
      <plugin>
        <artifactId>maven-install-plugin</artifactId>
        <version>3.2.0</version>
      </plugin>
      <plugin>
        <artifactId>maven-deploy-plugin</artifactId>
        <version>3.2.0</version>
      </plugin>
      <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.16</version>
        <executions>
          <execution>
            <goals><goal>prepare-agent</goal></goals>
          </execution>
          <execution>
            <id>report</id>
            <phase>test</phase>
            <goals><goal>report</goal></goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <artifactId>maven-checkstyle-plugin</artifactId>
        <version>3.6.0</version>
        <configuration>
          <configLocation>checkstyle.xml</configLocation>
          <consoleOutput>true</consoleOutput>
          <failsOnError>false</failsOnError>
        </configuration>
        <dependencies>
          <dependency>
            <groupId>com.puppycrawl.tools</groupId>
            <artifactId>checkstyle</artifactId>
            <version>14.4.0</version>
          </dependency>
        </dependencies>
      </plugin>
    </plugins>
  </build>
</project>
`

export const CHECKSTYLE_XML = `<?xml version="1.0"?>
<!DOCTYPE module PUBLIC "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN" "https://checkstyle.org/dtds/configuration_1_3.dtd">
<!-- lab/stock-api — checkstyle.xml: a few rules the team agreed on -->
<module name="Checker">
  <module name="LineLength"><property name="max" value="120"/></module>
  <module name="TreeWalker">
    <module name="NeedBraces"/>
    <module name="UnusedImports"/>
    <module name="MagicNumber"/>
    <module name="EmptyBlock"/>
  </module>
</module>
`

export const STOCK_JAVA_V1 = `package com.example.stock;

import java.util.HashMap;
import java.util.Map;

/** Quantities in stock, per item, with a minimum level that raises an alert. */
public class Stock {
    private final Map<String, Integer> quantities = new HashMap<>();
    private final int minimum;

    public Stock(int minimum) {
        this.minimum = minimum;
    }

    public void add(String item, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive");
        quantities.merge(item, quantity, Integer::sum);
    }

    public void remove(String item, int quantity) {
        int available = available(item);
        if (quantity > available) {
            throw new IllegalArgumentException("only " + available + " " + item + " in stock");
        }
        quantities.put(item, available - quantity);
    }

    public int available(String item) {
        return quantities.getOrDefault(item, 0);
    }

    public boolean needsRestock(String item) {
        return available(item) < minimum;
    }
}
`

export const STOCK_TEST_JAVA = `package com.example.stock;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class StockTest {
    @Test
    void addsItems() {
        Stock stock = new Stock(5);
        stock.add("bolt", 10);
        stock.add("bolt", 2);
        assertEquals(12, stock.available("bolt"));
    }

    @Test
    void removesItems() {
        Stock stock = new Stock(5);
        stock.add("nut", 8);
        stock.remove("nut", 3);
        assertEquals(5, stock.available("nut"));
    }

    @Test
    void refusesToRemoveMoreThanAvailable() {
        Stock stock = new Stock(5);
        stock.add("washer", 1);
        assertThrows(IllegalArgumentException.class, () -> stock.remove("washer", 2));
    }

    @Test
    void raisesRestockAlertsBelowTheMinimum() {
        Stock stock = new Stock(5);
        stock.add("screw", 4);
        assertTrue(stock.needsRestock("screw"));
        stock.add("screw", 1);
        assertFalse(stock.needsRestock("screw"));
    }
}
`

export const GITIGNORE_API = `target/
.m2/
.flattened-pom.xml
`

export const JF_API = `// lab/stock-api — Jenkinsfile: continuous integration of a Java 21 / Maven project
pipeline {
    agent { label 'linux' }
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
    }
    environment {
        VERSION = "1.0.\${env.BUILD_NUMBER}"                    // one version per build
        MAVEN_OPTS = '-Dmaven.repo.local=.m2/repository'        // dependency cache inside the workspace
    }

    stages {
        stage('Build') {
            steps {
                sh 'mvn -B -ntp -Drevision=$VERSION compile'
            }
        }
        stage('Unit tests') {
            steps {
                sh 'mvn -B -ntp -Drevision=$VERSION test'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'                         // test results and trend
                    recordCoverage(tools: [[parser: 'JACOCO', pattern: 'target/site/jacoco/jacoco.xml']],
                                   sourceDirectories: [[path: 'src/main/java']])   // coverage report
                }
            }
        }
        stage('Code quality') {
            steps {
                sh 'mvn -B -ntp checkstyle:check -Dcheckstyle.failOnViolation=false'   // XML report, no site rendering
                recordIssues(tools: [checkStyle(pattern: 'target/checkstyle-result.xml')],
                             qualityGates: [[threshold: 1, type: 'TOTAL', criticality: 'UNSTABLE']])
            }
        }
        stage('Security') {
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {   // vulnerabilities: report, do not stop
                    sh 'osv-scanner scan source --lockfile pom.xml'
                }
            }
        }
        stage('Package') {
            steps {
                sh 'mvn -B -ntp -Drevision=$VERSION -DskipTests package'
                archiveArtifacts artifacts: "target/stock-api-\${VERSION}.jar", fingerprint: true
            }
        }
        stage('Publish') {
            when { branch 'main' }                                          // only main publishes versions
            steps {
                withCredentials([usernamePassword(credentialsId: 'gitea-packages',
                                                  usernameVariable: 'REPO_USER', passwordVariable: 'REPO_TOKEN')]) {
                    sh 'mvn -B -s ci-settings.xml -Drevision=$VERSION -DskipTests deploy'   // no -ntp: show the uploads
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
  </servers>
</settings>
`

export const PACKAGE_JSON = `{
  "name": "stock-web",
  "version": "1.0.0",
  "description": "Stock helpers of the web front-end (Learning Jenkins, Module 6)",
  "type": "module",
  "private": false,
  "files": [
    "src/"
  ],
  "scripts": {
    "lint": "eslint .",
    "test": "mkdir -p test-results && c8 --reporter=cobertura --reporter=text --report-dir=coverage node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=test-results/junit.xml"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "c8": "12.0.0",
    "eslint": "10.15.0",
    "eslint-formatter-checkstyle": "9.0.1"
  }
}
`

export const ESLINT_CONFIG = `// lab/stock-web — eslint.config.js: the recommended rules of ESLint
import js from '@eslint/js'

export default [
  { ignores: ['coverage/', 'node_modules/', 'test-results/'] },
  js.configs.recommended,
  { languageOptions: { ecmaVersion: 2025, sourceType: 'module' } },
]
`

export const STOCK_JS_V1 = `// Stock helpers used by the web front-end

export function formatQuantity(item, quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError('quantity must be a non-negative integer')
  }
  return \`\${quantity} x \${item}\`
}

export function lowStock(items, minimum) {
  const threshold = minimum
  return Object.entries(items)
    .filter(([, quantity]) => quantity < minimum)
    .map(([name]) => name)
    .sort()
}

export function totalUnits(items) {
  return Object.values(items).reduce((sum, quantity) => sum + quantity, 0)
}
`

export const STOCK_TEST_JS = `import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatQuantity, lowStock } from '../src/stock.js'

test('formats a quantity', () => {
  assert.equal(formatQuantity('bolt', 12), '12 x bolt')
})

test('rejects a negative quantity', () => {
  assert.throws(() => formatQuantity('bolt', -1), RangeError)
})

test('lists the items below the minimum, sorted', () => {
  assert.deepEqual(lowStock({ screw: 4, bolt: 12, nut: 1 }, 5), ['nut', 'screw'])
})
`

export const GITIGNORE_WEB = `node_modules/
coverage/
test-results/
*.tgz
eslint-checkstyle.xml
`

export const JF_WEB = `// lab/stock-web — Jenkinsfile: continuous integration of a Node.js project
pipeline {
    agent { label 'linux' }
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
    }
    environment {
        VERSION = "1.0.\${env.BUILD_NUMBER}"
    }

    stages {
        stage('Install') {
            steps {
                sh 'node --version && npm ci'                     // exact versions of package-lock.json
            }
        }
        stage('Unit tests') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    junit 'test-results/junit.xml'
                    recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'coverage/cobertura-coverage.xml']])
                }
            }
        }
        stage('Code quality') {
            steps {
                sh 'npx eslint . --format checkstyle --output-file eslint-checkstyle.xml || true'
                recordIssues(tools: [esLint(pattern: 'eslint-checkstyle.xml')],
                             qualityGates: [[threshold: 1, type: 'TOTAL', criticality: 'UNSTABLE']])
            }
        }
        stage('Security') {
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh 'osv-scanner scan source --lockfile package-lock.json'
                }
            }
        }
        stage('Package') {
            steps {
                sh 'npm version --no-git-tag-version "$VERSION" && npm pack'
                archiveArtifacts artifacts: "stock-web-\${VERSION}.tgz", fingerprint: true
            }
        }
    }
}
`

export const OSV_TOML = `# lab/stock-web — osv-scanner.toml: vulnerabilities accepted on purpose, with a reason and an end date
[[IgnoredVulns]]
id = "GHSA-3g3m-2fjr-6pw4"
effectiveUntil = 2027-01-31
reason = "glob is only used by the test tooling (devDependency of c8); no fix without a breaking change yet"

[[IgnoredVulns]]
id = "GHSA-g3hv-75wg-m249"
effectiveUntil = 2027-01-31
reason = "minimatch is only used by the test tooling (devDependency); no fix without a breaking change yet"
`

export const GATE_EXTRAIT = `            post {
                always {
                    junit 'test-results/junit.xml'
                    recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'coverage/cobertura-coverage.xml']],
                                   qualityGates: [[threshold: 95.0, metric: 'LINE', baseline: 'PROJECT', criticality: 'UNSTABLE']])
                }
            }
`

export const REQUIREMENTS_V1 = `requests==2.31.0
`

export const REQUIREMENTS_DEV = `pytest==9.2.0
pytest-cov==7.1.0
flake8==7.5.0
build==1.6.1
`

export const PYPROJECT = `# lab/stock-py — pyproject.toml: packaging metadata of the project
[build-system]
requires = ["setuptools>=80"]
build-backend = "setuptools.build_meta"

[project]
name = "stock-py"
version = "1.0.0"
description = "Stock rules shared by the back-office scripts (Learning Jenkins, Module 6)"
requires-python = ">=3.12"
dependencies = ["requests==2.34.2"]

[tool.setuptools]
packages = ["stock"]
`

export const RULES_PY_V1 = `"""Reorder rules: how many units to order for an item."""
import os


def reorder_quantity(available, minimum, batch):
    """Units to order so that the stock gets back above the minimum, in whole batches."""
    if batch <= 0:
        raise ValueError("batch must be positive")
    missing = minimum - available
    if missing <= 0:
        return 0
    batches = -(-missing // batch)  # ceiling division
    return batches * batch


def is_critical(available, minimum):
    """An item is critical when less than half of the minimum is left."""
    return available * 2 < minimum
`

export const INIT_PY = `"""Stock rules shared by the back-office scripts."""
`

export const TEST_RULES_PY = `import pytest

from stock.rules import is_critical, reorder_quantity


def test_no_order_when_stock_is_enough():
    assert reorder_quantity(available=12, minimum=10, batch=5) == 0


def test_orders_whole_batches():
    assert reorder_quantity(available=3, minimum=10, batch=5) == 10


def test_rejects_an_empty_batch():
    with pytest.raises(ValueError):
        reorder_quantity(available=3, minimum=10, batch=0)


def test_critical_below_half_of_the_minimum():
    assert is_critical(available=4, minimum=10)
    assert not is_critical(available=5, minimum=10)
`

export const GITIGNORE_PY = `.venv/
__pycache__/
*.egg-info/
build/
dist/
test-results/
coverage.xml
.coverage
flake8.txt
`

export const JF_PY = `// lab/stock-py — Jenkinsfile: continuous integration of a Python project
pipeline {
    agent { label 'linux' }
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
    }
    environment {
        VERSION = "1.0.\${env.BUILD_NUMBER}"
    }

    stages {
        stage('Install') {
            steps {
                sh '''
                    python3 -m venv .venv
                    . .venv/bin/activate
                    pip install --quiet -r requirements.txt -r requirements-dev.txt
                    python --version
                '''
            }
        }
        stage('Unit tests') {
            steps {
                sh '. .venv/bin/activate && python -m pytest --junitxml=test-results/junit.xml --cov=stock --cov-report=xml:coverage.xml'
            }
            post {
                always {
                    junit 'test-results/junit.xml'
                    recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'coverage.xml']])
                }
            }
        }
        stage('Code quality') {
            steps {
                sh '. .venv/bin/activate && rm -f flake8.txt && flake8 stock tests --output-file flake8.txt || true'   // flake8 does not empty an old report
                recordIssues(tools: [flake8(pattern: 'flake8.txt')],
                             qualityGates: [[threshold: 1, type: 'TOTAL', criticality: 'UNSTABLE']])
            }
        }
        stage('Security') {
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh 'osv-scanner scan source --lockfile requirements.txt'
                }
            }
        }
        stage('Package') {
            steps {
                sh '''
                    . .venv/bin/activate
                    sed -i "s/^version = .*/version = \\\\"$VERSION\\\\"/" pyproject.toml
                    python -m build --wheel
                '''
                archiveArtifacts artifacts: 'dist/*.whl', fingerprint: true
            }
        }
    }
}
`

export const REQUIREMENTS = `# Runtime dependencies, all pinned (direct and transitive): pip freeze of a clean virtual environment
certifi==2026.10.23
charset-normalizer==3.5.2
idna==3.20
requests==2.34.2
urllib3==2.8.0
`

export const MODULE6 = [
  { t: 'objectives', items: [
    'Explain what a continuous integration pipeline checks, stage by stage, and what SUCCESS, UNSTABLE and FAILURE mean.',
    'Prepare a build agent with the tools of three stacks: Java 21 + Maven, Node.js 26, Python 3.13.',
    'Write complete Jenkinsfiles for **Java/Maven**, **Node.js** and **Python** projects: checkout, build, unit tests, code quality, security analysis, package, publish.',
    'Publish **test reports** and **coverage** in Jenkins and read their trends.',
    'Turn linter findings, coverage and known vulnerabilities into **quality gates**.',
    'Produce **versioned artifacts**, archive them with fingerprints and **publish** a Maven package to a registry with a credential.',
    'Diagnose the real errors met in this module: missing library, missing report folder, stale report, unpinned dependencies, 409 Conflict.',
  ] },
  { t: 'p', text: 'Prerequisite: the lab of Module 5 (Jenkins, agent-1, Gitea with the organization `lab`). This module adds three small projects to Gitea — `lab/stock-api` (Java), `lab/stock-web` (Node.js) and `lab/stock-py` (Python) — each built by a Multibranch Pipeline. Every console excerpt and screenshot below comes from these builds, including the ones that went wrong: they are the best lessons.' },

  { t: 'h', id: 'm6-1', text: '6.1 What a CI pipeline checks' },
  { t: 'p', text: 'Continuous integration means: **every push is built and verified automatically**, and the verdict comes back to the developer within minutes. The same stages appear in almost every company, whatever the language:' },
  { t: 'table', head: ['Stage', 'Question it answers', 'Java (Maven)', 'Node.js (npm)', 'Python (pip)', 'Jenkins step'], rows: [
    ['Checkout', 'Which exact commit do we verify?', 'git', 'git', 'git', 'automatic in a multibranch job (*Checkout SCM*)'],
    ['Build', 'Does it compile / install?', '`mvn compile`', '`npm ci`', '`pip install` in a venv', '`sh`'],
    ['Unit tests', 'Does the code do what its tests say?', 'JUnit 6 + Surefire, JaCoCo', '`node --test` + c8', 'pytest + pytest-cov', '`junit`, `recordCoverage`'],
    ['Code quality', 'Does the code follow the agreed rules?', 'Checkstyle', 'ESLint', 'flake8', '`recordIssues` (Warnings NG)'],
    ['Security', 'Do the dependencies have known vulnerabilities?', 'OSV-Scanner on `pom.xml`', 'OSV-Scanner on `package-lock.json`', 'OSV-Scanner on `requirements.txt`', '`catchError` around `sh`'],
    ['Package', 'Can we produce the deliverable?', 'jar', '`npm pack` (.tgz)', 'wheel (.whl)', '`archiveArtifacts`'],
    ['Publish', 'Can other teams use this version?', '`mvn deploy`', '`npm publish`', '`twine upload`', '`withCredentials` + `sh`'],
  ] },
  { t: 'diagram', id: 'm6-ci', caption: 'The seven stages of this module and what each one produces. A step that fails (compile, tests) makes the build FAILURE; a missed quality gate makes it UNSTABLE.' },
  { t: 'callout', kind: 'why', title: 'Why UNSTABLE and not FAILURE for quality and security?', text: 'A compile error or a failed test means the code is broken: stop everything (FAILURE, red). A style warning or a vulnerable library does not stop the code from working, but it must be visible: the build turns yellow (UNSTABLE), the commit shows a failed status in Gitea, and the team decides. Each company draws the line differently: the same steps can also fail the build (see the criticality values of quality gates in the Warnings NG and Coverage documentation).' },
  { t: 'callout', kind: 'info', title: 'Jenkins and Ansible', text: 'Building, testing, scanning and packaging is the job of Jenkins: test reports, coverage, quality gates and artifacts are Jenkins features. Ansible has none of them — it enters at deployment time, to configure servers and install the artifact (Module 10). Ansible playbooks are themselves code: in a company they are checked in CI too, with `ansible-lint`.' },

  { t: 'h', id: 'm6-2', text: '6.2 A build agent with the CI tools' },
  { t: 'p', text: 'The stages run on `agent-1` (label `linux`). Its base image, `jenkins/inbound-agent`, only contains Java and Git: extend it with Maven, Python, Node.js and OSV-Scanner. Create `~/jenkins-lab/agent/Dockerfile`:' },
  { t: 'code', lang: 'dockerfile', file: '~/jenkins-lab/agent/Dockerfile', code: AGENT_DOCKERFILE, lignes: [
    [2, 'The official inbound agent image (WebSocket connection, Module 2), with its exact version and JDK 21. It runs Debian 13 (trixie).'],
    [4, 'Installing packages needs root; line 23 switches back to the unprivileged `jenkins` user.'],
    [7, 'Maven 3.9.9 and Python 3.13 from Debian; `python3-venv` for virtual environments; `libatomic1` is required by Node.js 26 (section 6.9).'],
    [8, 'Delete the package lists: a smaller image.'],
    [11, 'Node.js 26 LTS, pinned: change the version in one place.'],
    [14, 'Check the download against the SHA-256 published in `SHASUMS256.txt` on nodejs.org: a corrupted or tampered file stops the image build.'],
    [15, 'Unpack into `/usr/local`: `node`, `npm` and `npx` are in the PATH.'],
    [18, 'OSV-Scanner 2.7.1, a single binary: it compares your lockfiles with the OSV database of known vulnerabilities. Each release also publishes a checksums file: verify it the same way as Node.js.'],
    [23, 'Builds never run as root.'],
  ] },
  { t: 'p', text: 'In `~/jenkins-lab/docker-compose.yml`, the service `agent-1` now builds this image instead of pulling the plain one (the rest of the service is unchanged, Module 2):' },
  { t: 'code', lang: 'yaml', file: '~/jenkins-lab/docker-compose.yml — beginning of the service agent-1', code: COMPOSE_AGENT_BUILD, lignes: [
    [2, '`build`: the folder that contains the Dockerfile.'],
    [3, '`image`: the name given to the built image.'],
  ] },
  { t: 'cmd', where: 'Your terminal, in ~/jenkins-lab', cmd: "docker compose build agent-1\ndocker compose up -d agent-1\ndocker compose exec -T agent-1 bash -c 'java -version 2>&1 | head -1; mvn -v | head -1; node --version; npm --version; python3 --version; osv-scanner --version | head -1; git --version'", out: `openjdk version "21.0.13" 2026-10-20 LTS
Apache Maven 3.9.9
v26.13.1
11.20.0
Python 3.13.5
osv-scanner version: 2.7.1
git version 2.47.3`, note: '`up -d` recreates the container, which reconnects to Jenkins by itself (its secret is in `.env`). The image weighs 1.36 GB: one image for three stacks is convenient in a lab; companies usually prefer one small image per stack, or a container per build (Modules 7 and 8).' },
  { t: 'table', head: ['Where the build tools come from', 'How', 'When to choose it'], rows: [
    ['Baked into the agent image (this lab)', 'A Dockerfile like the one above', 'Few stacks, stable versions, fast builds'],
    ['Jenkins tool installers', 'Manage Jenkins → **Tools** (JDK, Maven…; Node.js with the NodeJS plugin), then `tools { maven \'…\' }` in the Jenkinsfile', 'Static agents that need several versions side by side'],
    ['A container per build or stage', '`agent { docker { image \'…\' } }`, or Kubernetes pods', 'Many stacks and versions, a clean environment every time (Modules 7 and 8)'],
  ] },

  { t: 'h', id: 'm6-3', text: '6.3 Java and Maven: lab/stock-api' },
  { t: 'p', text: 'Three plugins turn report files into Jenkins pages. JUnit and Credentials Binding come with the suggested plugins; install **Coverage** and **Warnings** from *Manage Jenkins → Plugins → Available plugins* (Module 2):' },
  { t: 'table', head: ['Plugin', 'Version in the lab', 'What it gives'], rows: [
    ['JUnit', '1458.1460.vd53b_087eeb_2c', '`junit`: test results, history of each test, trend chart'],
    ['Coverage', '4.3583.v1a_a_ee48b_1b_dd', '`recordCoverage`: JaCoCo, Cobertura… reports, coverage per file and line, quality gates'],
    ['Warnings (Warnings NG)', '13.10365.v85cd7a_c8110b_', '`recordIssues`: more than 100 report formats (Checkstyle, ESLint, flake8, SpotBugs…), quality gates'],
    ['Credentials Binding', '728.v902a_273b_8947', '`withCredentials`: a secret as a masked environment variable (section 6.8)'],
  ] },
  { t: 'p', text: 'In Gitea, create the repository `lab/stock-api` and add `jenkins-bot` as collaborator (Write), as in Module 5. The project is a small Java 21 library. Its build file:' },
  { t: 'code', lang: 'xml', file: 'lab/stock-api — pom.xml', code: POM_XML, lignes: [
    [9, 'The version is a property (Maven *CI-friendly versions*): Jenkins passes `-Drevision=1.0.<build>`.'],
    [12, 'Default value when you build on your laptop: `1.0.0-SNAPSHOT`.'],
    [13, 'Compile for Java 21.'],
    [21, 'JUnit 6 (Jupiter API), for the tests only.'],
    [27, 'Where `mvn deploy` sends the package (section 6.8). The `id` links to the credentials of `ci-settings.xml`.'],
    [39, 'flatten-maven-plugin writes the real version into the published POM; without it, consumers would receive `${revision}` and could not resolve the package.'],
    [60, 'Every plugin version is pinned: the same build today and in a year.'],
    [81, 'JaCoCo 0.8.16 measures coverage while the tests run (`prepare-agent`) and writes `target/site/jacoco/jacoco.xml` in the `test` phase (`report`).'],
    [95, 'Checkstyle plugin 3.6.0, with the rules of `checkstyle.xml` and the Checkstyle engine 14.4.0 (line 105).'],
    [99, 'Rule violations do not stop Maven: Jenkins decides, with its quality gate.'],
  ] },
  { t: 'code', lang: 'xml', file: 'lab/stock-api — checkstyle.xml', code: CHECKSTYLE_XML, lignes: [
    [5, 'Lines of 120 characters at most.'],
    [7, 'The body of `if`, `for`, `while` must be in braces — the rule our first version breaks.'],
    [9, 'No unexplained numbers in the code.'],
  ] },
  { t: 'code', lang: 'java', file: 'lab/stock-api — src/main/java/com/example/stock/Stock.java (first version)', code: STOCK_JAVA_V1, lignes: [
    [16, 'An `if` without braces: valid Java, but against the team rules (NeedBraces).'],
    [22, 'Removing more than available is refused.'],
    [33, 'Restock alert below the minimum.'],
  ] },
  { t: 'code', lang: 'java', file: 'lab/stock-api — src/test/java/com/example/stock/StockTest.java', code: STOCK_TEST_JAVA, lignes: [
    [11, 'One method per behaviour; JUnit runs every `@Test` method.'],
    [31, '`assertThrows`: the call must throw this exception.'],
  ] },
  { t: 'code', lang: 'text', file: 'lab/stock-api — .gitignore', code: GITIGNORE_API },
  { t: 'p', text: 'And the Jenkinsfile, at the root of the repository:' },
  { t: 'code', lang: 'groovy', file: 'lab/stock-api — Jenkinsfile', code: JF_API, lignes: [
    [3, 'Every stage runs on an agent labelled `linux` (agent-1). The checkout happens automatically before the first stage (*Checkout SCM*).'],
    [7, 'A stuck build is aborted after 20 minutes.'],
    [10, 'Version `1.0.<build number>`: unique, and traceable back to its build.'],
    [11, 'Maven keeps its downloads in the workspace: one cache per branch, kept between builds, nothing shared that could be corrupted.'],
    [17, '`-B` batch mode (no colours, no prompts), `-ntp` no download progress. Single quotes: the shell expands `$VERSION` (Module 4).'],
    [24, '`post { always }` of the stage: the reports are recorded even when tests fail.'],
    [26, 'JUnit reads the Surefire XML reports: *Tests* page, trend chart, history of each test.'],
    [27, 'Coverage reads the JaCoCo report; `sourceDirectories` lets Jenkins show the source with covered and missed lines.'],
    [34, '`checkstyle:check` writes `target/checkstyle-result.xml`; `failOnViolation=false`: Jenkins decides, not Maven.'],
    [35, 'Warnings NG parses the report: *CheckStyle Warnings* page.'],
    [36, 'Quality gate: 1 warning or more (TOTAL ≥ 1) → UNSTABLE.'],
    [41, '`catchError`: if the scan fails (vulnerabilities found), the stage and the build become UNSTABLE and the pipeline goes on.'],
    [42, 'OSV-Scanner reads the dependencies declared in `pom.xml` and resolves the transitive ones.'],
    [48, 'Build the jar without running the tests again.'],
    [49, 'Keep the jar with the build; the fingerprint tracks this exact file across jobs.'],
    [53, 'Only builds of `main` publish; branches and pull requests stop at Package.'],
    [55, 'The token exists only inside this block, as two environment variables, and is masked in the log (section 6.8).'],
  ] },
  { t: 'callout', kind: 'warning', title: 'Publish needs a credential', text: 'Lines 52–60 use the credential `gitea-packages`, created in section 6.8. Until it exists, leave these lines out: a missing credential fails the build.' },
  { t: 'p', text: 'Create a Multibranch Pipeline `stock-api` exactly like `inventory` in Module 5 (Gitea source, owner `lab`, repository `stock-api`, credential `gitea-jenkins-bot`). A webhook on the **organization** (Gitea → `lab` → Settings → Webhooks, the same URL as in Module 5) triggers the builds of every repository of `lab`, present and future.' },
  { t: 'p', text: 'Our very first build used the reporting goal `checkstyle:checkstyle`, and failed:' },
  { t: 'cmd', where: 'stock-api » main #1 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T14:55:35.399Z] + mvn -B -ntp checkstyle:checkstyle
[2026-11-17T14:55:49.872Z] [INFO] BUILD FAILURE
[2026-11-17T14:55:49.872Z] [ERROR] Failed to execute goal org.apache.maven.plugins:maven-checkstyle-plugin:3.6.0:checkstyle (default-cli) on project stock-api: An error has occurred in Checkstyle report generation. Failed to retrieve skin artifact: Unable to find skin: The following artifacts could not be resolved: org.apache.maven.skins:maven-fluido-skin:jar:2.0.0-M9 (absent): Could not transfer artifact org.apache.maven.skins:maven-fluido-skin:jar:2.0.0-M9 from/to central (https://repo.maven.apache.org/maven2): class org.apache.commons.logging.impl.LogFactoryImpl cannot be cast to class org.apache.commons.logging.LogFactory (org.apache.commons.logging.impl.LogFactoryImpl is in unnamed module of loader org.codehaus.plexus.classworlds.realm.ClassRealm @6b4fc2d1; org.apache.commons.logging.LogFactory is in unnamed module of loader org.codehaus.plexus.classworlds.realm.ClassRealm @f5f2bb7) -> [Help 1]
Stage "Security" skipped due to earlier failure(s)
Stage "Package" skipped due to earlier failure(s)
Finished: FAILURE`, note: 'The reporting goal renders an HTML page and needs a *site skin* downloaded from Maven Central; with the Debian package of Maven in the agent, the download failed with a class-loading error. CI only needs the XML report: `checkstyle:check` writes it without any page rendering. Commit 7fccfb2 switched to it (line 34).' },
  { t: 'p', text: 'Build #2 then ran every stage. Result: **UNSTABLE**.' },
  { t: 'shot', id: 'm6-01-build-summary', titre: 'stock-api » main #2: the build page', ce: 'The summary of a CI build: what was produced and what was found.', éléments: ['**Build Artifacts**: `stock-api-1.0.2.jar`, its size and fingerprint.', '**Push event to branch main**: started by the webhook.', '**Tests (no failures)**.', '**Coverage**: lines 100%, branches 83.33%.', '**CheckStyle: One warning**.', '**Quality gate: Unstable** — the reason for the yellow status.'], actions: ['Click **CheckStyle Warnings** (left menu) to see the warning.'], résultat: 'You know in one screen what this commit changed for the quality of the project.' },
  { t: 'cmd', where: 'stock-api » main #2 → Console Output (real text, excerpt)', cmd: '', out: `[Gitea] Notifying branch build status: PENDING Build started...
[2026-11-17T14:56:32.298Z] + mvn -B -ntp checkstyle:check -Dcheckstyle.failOnViolation=false
[2026-11-17T14:56:34.168Z] [ERROR] /home/jenkins/agent/workspace/stock-api_main/src/main/java/com/example/stock/Stock.java:16:9: 'if' construct must use '{}'s. [NeedBraces]
[2026-11-17T14:56:34.168Z] [INFO] There is 1 error reported by Checkstyle 14.4.0 with checkstyle.xml ruleset.
[2026-11-17T14:56:34.210Z] [CheckStyle] -> found 1 file
[2026-11-17T14:56:34.210Z] [CheckStyle] -> found 1 issue (skipped 0 duplicates)
[2026-11-17T14:56:34.353Z] [CheckStyle] Evaluating quality gates
[2026-11-17T14:56:34.353Z] [CheckStyle] -> Some quality gates have been missed: overall result is UNSTABLE
[2026-11-17T14:56:34.353Z] [CheckStyle]    - [Total (any severity)]: ≪Unstable≫ - (Actual value: 1, Quality gate: 1.00)
[2026-11-17T14:56:34.676Z] Scanned /home/jenkins/agent/workspace/stock-api_main/pom.xml file and found 1 package
[2026-11-17T14:56:35.604Z] No issues found
[2026-11-17T14:56:40.745Z] [INFO] Building jar: /home/jenkins/agent/workspace/stock-api_main/target/stock-api-1.0.2.jar
[Gitea] Notifying branch build status: FAILURE This commit is unstable
Finished: UNSTABLE` },
  { t: 'shot', id: 'm6-03-checkstyle', titre: 'CheckStyle Warnings: the issues of the build', ce: 'Warnings NG lists every finding with charts (by severity, by type, by package, new or outstanding).', éléments: ['File and line: `Stock.java:16`.', 'The rule: `NeedBracesCheck`.', 'Severity: Error.'], actions: ['Click the file name to open the source at the right line.'], résultat: 'The finding, its location and its rule.' },
  { t: 'shot', id: 'm6-04-issue-source', titre: 'The finding on its source line', ce: 'Warnings NG copied the affected file into the build: the message is shown on the line, even after the workspace has changed.', éléments: ['The message `\'if\' construct must use \'{}\'s` on line 16.'], actions: ['Fix the code in Git, push.'], résultat: 'You see exactly what to change.' },
  { t: 'code', lang: 'java', file: 'Commit abd6aa3 — Stock.java, lines 15–20 after the fix', code: `    public void add(String item, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        quantities.merge(item, quantity, Integer::sum);
    }
` },
  { t: 'p', text: 'Build #3 was **SUCCESS** — and its coverage dropped:' },
  { t: 'cmd', where: 'stock-api » main #3 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T14:57:17.683Z] [Coverage] Line Coverage: 93.33% (14/15)
[2026-11-17T14:57:17.683Z] [Coverage] Branch Coverage: 83.33% (5/6)
Finished: SUCCESS`, note: 'Line coverage counts lines executed by the tests. On one line, `if (…) throw …` was "covered" as soon as the `if` ran; on its own line, the `throw` is never executed: no test adds a quantity ≤ 0. The branch coverage (5/6) had already shown it. Lab 6.1 adds the missing test.' },
  { t: 'shot', id: 'm6-02-trends', titre: 'stock-api » main: the trends', ce: 'The job page of a branch charts every recorded report, build after build.', éléments: ['Tests per build.', 'Coverage per build.', 'Warnings per build: 1 in #2, 0 in #3.', 'The jar of the last build.'], actions: ['Hover a chart for the values; click it for the history.'], résultat: 'A quality drift is visible at a glance.' },

  { t: 'h', id: 'm6-4', text: '6.4 When tests fail' },
  { t: 'p', text: 'On a branch `feature/restock-rule`, a developer changes a test before the code (the new rule: alert *at* the minimum too). The multibranch job builds the branch:' },
  { t: 'cmd', where: 'stock-api » feature/restock-rule #1 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T15:16:46.610Z] [ERROR] Tests run: 4, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.089 s <<< FAILURE! -- in com.example.stock.StockTest
[2026-11-17T15:16:46.610Z] [ERROR] com.example.stock.StockTest.raisesRestockAlertsBelowTheMinimum -- Time elapsed: 0.010 s <<< FAILURE!
[2026-11-17T15:16:46.610Z] org.opentest4j.AssertionFailedError: expected: <true> but was: <false>
[2026-11-17T15:16:46.610Z] 	at com.example.stock.StockTest.raisesRestockAlertsBelowTheMinimum(StockTest.java:40)
[2026-11-17T15:16:46.610Z] [ERROR]   StockTest.raisesRestockAlertsBelowTheMinimum:40 expected: <true> but was: <false>
[2026-11-17T15:16:46.610Z] [ERROR] Tests run: 4, Failures: 1, Errors: 0, Skipped: 0
[2026-11-17T15:16:46.610Z] [INFO] BUILD FAILURE
[2026-11-17T15:16:46.610Z] [ERROR] Failed to execute goal org.apache.maven.plugins:maven-surefire-plugin:3.6.1:test (default-test) on project stock-api: There are test failures.
[2026-11-17T15:16:46.623Z] Recording test results
[2026-11-17T15:16:46.639Z] [Coverage] Skipping execution of coverage recorder since overall result is 'FAILURE'
Stage "Code quality" skipped due to earlier failure(s)
Stage "Security" skipped due to earlier failure(s)
Stage "Package" skipped due to earlier failure(s)
Stage "Publish" skipped due to earlier failure(s)
Finished: FAILURE`, note: 'Maven exits with an error, so the `sh` step fails: FAILURE, and the next stages are skipped. The `post { always }` of the stage still recorded the test results; the coverage recorder skips failed builds.' },
  { t: 'shot', id: 'm6-12-test-report', titre: 'Tests: the test report of the build', ce: 'The JUnit plugin shows the failed tests first.', éléments: ['**All Failed Tests**.', 'The failed test, with its age (how many builds it has been failing).', '**All Tests**, per package: 1 failed, 0 skipped, 3 passed.'], actions: ['Click the failed test.'], résultat: 'The list of what broke.' },
  { t: 'shot', id: 'm6-13-test-failure', titre: 'A failed test: message and stack trace', ce: 'The details of one failed test, read from the XML report.', éléments: ['**Error Details**: `expected: <true> but was: <false>`.', '**Stack Trace**: `StockTest.java:40`, the failing assertion.'], actions: ['Fix the code (or the test), push again.'], résultat: 'You debug from Jenkins without running the build again.' },
  { t: 'p', text: 'Some teams prefer a yellow build when tests fail, to still get the quality and security reports. Maven offers it:' },
  { t: 'code', lang: 'groovy', file: 'feature/restock-rule — Jenkinsfile, stage Unit tests', code: `sh 'mvn -B -ntp -Drevision=$VERSION -Dmaven.test.failure.ignore=true test'   // failed tests: UNSTABLE, not FAILURE
` },
  { t: 'cmd', where: 'stock-api » feature/restock-rule #2 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T15:17:31.753Z] [ERROR] Tests run: 4, Failures: 1, Errors: 0, Skipped: 0
[2026-11-17T15:17:32.021Z] Recording test results
[2026-11-17T15:17:32.040Z] [Coverage] Line Coverage: 93.33% (14/15)
[2026-11-17T15:18:03.007Z] [INFO] Building jar: /home/jenkins/agent/workspace/stock-api_feature_restock-rule/target/stock-api-1.0.2.jar
[2026-11-17T15:18:03.020Z] Archiving artifacts
Stage "Publish" skipped due to when conditional
Finished: UNSTABLE`, note: 'Maven succeeds, the `junit` step sees the failure and marks the build UNSTABLE; every stage runs, and the jar is archived. The flip side: a version with a failing test exists. Keep FAILURE on the branches that publish (our `main`), or make sure an UNSTABLE build never publishes.' },

  { t: 'h', id: 'm6-5', text: '6.5 Node.js: lab/stock-web' },
  { t: 'p', text: 'Create `lab/stock-web` in Gitea and a Multibranch Pipeline `stock-web`. Run `npm install` once on your machine to generate `package-lock.json`, and commit it: it pins the whole dependency tree, for the build and for the security scan.' },
  { t: 'code', lang: 'json', file: 'lab/stock-web — package.json', code: PACKAGE_JSON, lignes: [
    [5, 'ES modules (`import` / `export`).'],
    [7, 'Only `src/` goes into the package.'],
    [12, '`npm test`: c8 measures coverage (Cobertura XML for Jenkins, a text table in the log) around the test runner built into Node.js, with two reporters: `spec` in the console, `junit` into `test-results/junit.xml`. `mkdir -p` first: the junit reporter does not create the folder (section 6.9).'],
    [14, 'Exact versions of the tools; the committed lockfile pins their own dependencies.'],
  ] },
  { t: 'code', lang: 'javascript', file: 'lab/stock-web — eslint.config.js', code: ESLINT_CONFIG, lignes: [[5, 'Folders produced by the build are not linted.'], [6, 'The rules recommended by ESLint, such as `no-unused-vars`.']] },
  { t: 'code', lang: 'javascript', file: 'lab/stock-web — src/stock.js (first version)', code: STOCK_JS_V1, lignes: [[11, 'A variable that is never used: ESLint will report it.']] },
  { t: 'code', lang: 'javascript', file: 'lab/stock-web — test/stock.test.js', code: STOCK_TEST_JS, lignes: [[1, 'The test runner of Node.js itself: no test framework to install.']] },
  { t: 'code', lang: 'text', file: 'lab/stock-web — .gitignore', code: GITIGNORE_WEB },
  { t: 'code', lang: 'groovy', file: 'lab/stock-web — Jenkinsfile (stages; the header is the same as stock-api without MAVEN_OPTS)', code: JF_WEB, lignes: [
    [16, '`npm ci` installs exactly the lockfile and fails if it does not match `package.json`: never `npm install` in CI.'],
    [25, 'The same `junit` step as for Java: JUnit XML is a common format.'],
    [26, 'Coverage again, Cobertura format this time.'],
    [32, 'ESLint writes a report in Checkstyle format; `|| true`: findings must not stop the step, the quality gate decides.'],
    [33, 'Warnings NG, ESLint parser.'],
    [40, 'OSV-Scanner on the lockfile: every package, direct and transitive.'],
    [46, 'Set the version of this build in `package.json` (no Git tag), then `npm pack` creates `stock-web-<version>.tgz`.'],
  ] },
  { t: 'cmd', where: 'stock-web » main #1 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T14:55:15.773Z] v26.13.1
[2026-11-17T14:55:18.296Z] added 122 packages, and audited 123 packages in 2s
[2026-11-17T14:55:18.296Z] 4 moderate severity vulnerabilities
[2026-11-17T14:55:18.296Z]   npm audit fix --force
[2026-11-17T14:55:18.868Z] ✔ formats a quantity (0.797697ms)
[2026-11-17T14:55:18.868Z] ✔ rejects a negative quantity (0.324119ms)
[2026-11-17T14:55:18.868Z] ✔ lists the items below the minimum, sorted (0.650147ms)
[2026-11-17T14:55:18.868Z] ℹ tests 3
[2026-11-17T14:55:18.868Z] ℹ pass 3
[2026-11-17T14:55:18.868Z] ℹ fail 0
[2026-11-17T14:55:18.868Z] ----------|---------|----------|---------|---------|-------------------
[2026-11-17T14:55:18.868Z] File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
[2026-11-17T14:55:18.868Z] ----------|---------|----------|---------|---------|-------------------
[2026-11-17T14:55:18.868Z] All files |      90 |      100 |   66.66 |      90 |                   
[2026-11-17T14:55:18.868Z]  stock.js |      90 |      100 |   66.66 |      90 | 19-20             
[2026-11-17T14:55:18.868Z] ----------|---------|----------|---------|---------|-------------------
[2026-11-17T14:55:23.183Z] [ESLint] -> found 1 file
[2026-11-17T14:55:23.183Z] [ESLint] -> found 1 issue (skipped 0 duplicates)
[2026-11-17T14:55:23.577Z] [ESLint] -> Some quality gates have been missed: overall result is UNSTABLE`, note: '3 tests passed; 90% of the lines are covered (lines 19–20, `totalUnits`, are never called by a test). ESLint found 1 issue: `\'threshold\' is assigned a value but never used. (no-unused-vars)` at `src/stock.js:11`, so the quality gate made the build UNSTABLE. Commit 93c9820 deleted the line.' },
  { t: 'shot', id: 'm6-05-coverage', titre: 'Coverage report of stock-web', ce: 'The Coverage plugin shows the same pages whatever the source format (JaCoCo or Cobertura).', éléments: ['**Overview**.', 'Lines 90% (18 covered, 2 missed), methods 66.67%, branches 100%.', 'Trend over the builds.', '**Files**: coverage per file, with the source.'], actions: ['Open the *Files* tab, then `stock.js`: missed lines are red.'], résultat: 'You know which code no test runs.' },
  { t: 'p', text: 'The security stage also failed. `npm ci` itself warned (*4 moderate severity vulnerabilities*); OSV-Scanner gives the details:' },
  { t: 'cmd', where: 'stock-web » main #1 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T14:55:23.977Z] + osv-scanner scan source --lockfile package-lock.json
[2026-11-17T14:55:23.977Z] Scanned /home/jenkins/agent/workspace/stock-web_main/package-lock.json file and found 120 packages
[2026-11-17T14:55:24.233Z] Total 2 packages affected by 2 known vulnerabilities (0 Critical, 0 High, 2 Medium, 0 Low, 0 Unknown) from 1 ecosystem.
[2026-11-17T14:55:24.233Z] 2 vulnerabilities can be fixed.
[2026-11-17T14:55:24.233Z] +-------------------------------------+------+-----------+-----------------+---------+---------------+-------------------+
[2026-11-17T14:55:24.233Z] | OSV URL                             | CVSS | ECOSYSTEM | PACKAGE         | VERSION | FIXED VERSION | SOURCE            |
[2026-11-17T14:55:24.233Z] +-------------------------------------+------+-----------+-----------------+---------+---------------+-------------------+
[2026-11-17T14:55:24.233Z] | https://osv.dev/GHSA-3g3m-2fjr-6pw4 | 6.3  | npm       | glob (dev)      | 13.0.7  | 14.0.2        | package-lock.json |
[2026-11-17T14:55:24.233Z] | https://osv.dev/GHSA-g3hv-75wg-m249 | 6.9  | npm       | minimatch (dev) | 10.2.6  | 11.0.1        | package-lock.json |
[2026-11-17T14:55:24.233Z] +-------------------------------------+------+-----------+-----------------+---------+---------------+-------------------+
[2026-11-17T14:55:24.243Z] ERROR: script returned exit code 1`, note: 'Two medium vulnerabilities in `glob` and `minimatch`, used only by the test tooling (`dev`). npm counts every package of the vulnerable chain (4), OSV counts the vulnerable packages (2). The fixed versions are new major versions that our tools do not accept yet: `npm audit fix --force` would install breaking upgrades.' },
  { t: 'p', text: 'When a vulnerability cannot be fixed now, do not hide it: record a **documented, time-limited exception**, reviewed like code:' },
  { t: 'code', lang: 'toml', file: 'lab/stock-web — osv-scanner.toml', code: OSV_TOML, lignes: [
    [3, 'The advisory ID, as printed by the scanner.'],
    [4, 'The exception expires: after this date the build turns UNSTABLE again and the team must decide again. (`ignoreUntil`, the former name, is deprecated.)'],
    [5, 'Why it is accepted — printed in the log of every build.'],
  ] },
  { t: 'cmd', where: 'stock-web » main #3 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T15:06:35.162Z] Scanned /home/jenkins/agent/workspace/stock-web_main/package-lock.json file and found 120 packages
[2026-11-17T15:06:35.418Z] GHSA-3g3m-2fjr-6pw4 and 1 alias have been filtered out because: glob is only used by the test tooling (devDependency of c8); no fix without a breaking change yet
[2026-11-17T15:06:35.418Z] GHSA-g3hv-75wg-m249 and 1 alias have been filtered out because: minimatch is only used by the test tooling (devDependency); no fix without a breaking change yet
[2026-11-17T15:06:35.418Z] Filtered 2 vulnerabilities from output
[2026-11-17T15:06:35.418Z] No issues found
[2026-11-17T15:06:35.987Z] npm notice filename: stock-web-1.0.3.tgz
[2026-11-17T15:06:35.987Z] stock-web-1.0.3.tgz
Finished: SUCCESS` },
  { t: 'p', text: 'Coverage can be a quality gate too. On a branch `feature/coverage-gate`, we required 95% of the lines:' },
  { t: 'code', lang: 'groovy', file: 'lab/stock-web, branch feature/coverage-gate — Jenkinsfile, stage Unit tests', code: GATE_EXTRAIT, lignes: [[5, 'Whole project (`PROJECT`), line coverage, at least 95.0%, else UNSTABLE.']] },
  { t: 'cmd', where: 'stock-web » feature/coverage-gate #1 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T15:13:23.872Z] [Coverage] Line Coverage: 89.47% (17/19)
[2026-11-17T15:13:23.889Z] [Coverage] Evaluating quality gates
[2026-11-17T15:13:23.889Z] [Coverage] -> Some quality gates have been missed: overall result is UNSTABLE
[2026-11-17T15:13:23.889Z] [Coverage]    - [Whole project - Line Coverage]: ≪Unstable≫ - (Actual value: 89.47%, Quality gate: 95.00)
Finished: UNSTABLE` },
  { t: 'p', text: 'Lab 6.2 makes this gate pass by testing `totalUnits`.' },

  { t: 'h', id: 'm6-6', text: '6.6 Python: lab/stock-py' },
  { t: 'p', text: 'Create `lab/stock-py` and a Multibranch Pipeline `stock-py`. The first version declares only its direct dependency, and an old one:' },
  { t: 'code', lang: 'text', file: 'lab/stock-py — requirements.txt (first version)', code: REQUIREMENTS_V1 },
  { t: 'code', lang: 'text', file: 'lab/stock-py — requirements-dev.txt', code: REQUIREMENTS_DEV, lignes: [[1, 'Test runner.'], [2, 'Coverage for pytest (Cobertura XML).'], [3, 'Linter.'], [4, 'Builds the wheel.']] },
  { t: 'code', lang: 'toml', file: 'lab/stock-py — pyproject.toml (after commit b79b056; the first version had requests==2.31.0)', code: PYPROJECT, lignes: [[3, 'The build backend.'], [8, 'Replaced by the build version in the Package stage.'], [14, 'The package to put in the wheel.']] },
  { t: 'code', lang: 'python', file: 'lab/stock-py — stock/rules.py (first version)', code: RULES_PY_V1, lignes: [[2, 'An unused import (flake8 F401).'], [6, 'An 89-character line (flake8 E501, the default limit is 79).']] },
  { t: 'code', lang: 'python', file: 'lab/stock-py — stock/__init__.py', code: INIT_PY },
  { t: 'code', lang: 'python', file: 'lab/stock-py — tests/test_rules.py', code: TEST_RULES_PY, lignes: [[15, '`pytest.raises`: the call must raise this exception.']] },
  { t: 'code', lang: 'text', file: 'lab/stock-py — .gitignore', code: GITIGNORE_PY },
  { t: 'code', lang: 'groovy', file: 'lab/stock-py — Jenkinsfile (stages)', code: JF_PY, lignes: [
    [17, 'A virtual environment in the workspace: the packages of this build only, never the system Python.'],
    [18, 'Every `sh` step is a new shell: activate the venv in each step that needs it (lines 26, 37, 52).'],
    [19, 'Runtime and development dependencies, exact versions.'],
    [26, 'pytest writes JUnit XML; pytest-cov writes Cobertura XML: the same Jenkins steps as for Java and Node.js.'],
    [37, 'Delete the old report first: flake8 does not empty an existing output file when it finds nothing (section 6.9). This line was added in build #3.'],
    [38, 'Warnings NG, flake8 parser.'],
    [45, 'OSV-Scanner on `requirements.txt`.'],
    [53, 'Write the version of this build into `pyproject.toml`.'],
    [54, 'Build `dist/stock_py-<version>-py3-none-any.whl`.'],
  ] },
  { t: 'shot', id: 'm6-08-py-stages', titre: 'stock-py » main #1: the stages', ce: 'The *Stages* view of build #1: two stages are UNSTABLE, the others passed.', éléments: ['Unit tests: passed (4 tests).', 'Code quality: unstable (quality gate).', 'Security: unstable (vulnerabilities).', 'Package: the wheel is still built — UNSTABLE does not stop the pipeline.'], actions: ['Click a stage to read its steps and log.'], résultat: 'You see which check complained.' },
  { t: 'shot', id: 'm6-06-flake8', titre: 'Flake8 Warnings of build #1', ce: 'The flake8 findings, parsed by Warnings NG.', éléments: ['E501: line too long.', 'F401: unused import.'], actions: ['Click a finding to open the source line.'], résultat: 'Two findings: the quality gate (≥ 1) makes the build UNSTABLE.' },
  { t: 'shot', id: 'm6-07-osv', titre: 'The OSV-Scanner report in the console of build #1', ce: 'The scan of `requirements.txt` in the console log.', éléments: ['The scan of the dependencies.', 'The summary: 5 known vulnerabilities in 3 packages, 1 critical.', 'For each one, the version that fixes it.'], actions: ['Open an OSV URL for the advisory.'], résultat: 'You know what to upgrade, and to which version.' },
  { t: 'p', text: 'Commit b79b056 upgraded `requests` to 2.34.2, removed the import and shortened the line. Build #2 was **still UNSTABLE**, for two instructive reasons:' },
  { t: 'cmd', where: 'stock-py » main #2 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T15:01:04.775Z] [Flake8] -> found 1 file
[2026-11-17T15:01:04.775Z] [Flake8] -> found 2 issues (skipped 0 duplicates)
[2026-11-17T15:01:04.903Z] [Flake8]    - [Total (any severity)]: ≪Unstable≫ - (Actual value: 2, Quality gate: 1.00)
[2026-11-17T15:01:05.306Z] Scanned /home/jenkins/agent/workspace/stock-py_main/requirements.txt file and found 1 package
[2026-11-17T15:01:05.867Z] Total 2 packages affected by 2 known vulnerabilities (1 Critical, 0 High, 1 Medium, 0 Low, 0 Unknown) from 1 ecosystem.
[2026-11-17T15:01:05.867Z] | https://osv.dev/PYSEC-2026-4320     | 9.1  | PyPI      | certifi | 2026.7.22 | 2026.10.18    | requirements.txt |
[2026-11-17T15:01:05.867Z] | https://osv.dev/PYSEC-2026-215      | 6.9  | PyPI      | idna    | 3.9.0     | 3.15          | requirements.txt |
Finished: UNSTABLE` },
  { t: 'ul', items: [
    '**Flake8 still found 2 issues** — the ones of build #1. flake8 found nothing this time, and in that case it does not rewrite its output file: the workspace kept the report of build #1 (reproduced in section 6.9). Fix: `rm -f flake8.txt` before running it (line 37).',
    '**OSV reported certifi 2026.7.22 and idna 3.9.0**, while pip had installed newer versions. Our file only pinned `requests`; to know the transitive dependencies, the scanner resolves them by itself — and may choose other versions than pip. Fix: pin the **whole tree**, so that the scanned versions are the installed versions.',
  ] },
  { t: 'cmd', where: 'agent-1 (or your machine): the full tree of requests 2.34.2', cmd: 'python3 -m venv /tmp/v && /tmp/v/bin/pip install --quiet requests==2.34.2 && /tmp/v/bin/pip freeze', out: `certifi==2026.10.23
charset-normalizer==3.5.2
idna==3.20
requests==2.34.2
urllib3==2.8.0` },
  { t: 'code', lang: 'text', file: 'lab/stock-py — requirements.txt (commit 8f736dd)', code: REQUIREMENTS, lignes: [[1, 'Every runtime package, direct and transitive, with its exact version. Tools such as pip-tools or uv generate this file for you.']] },
  { t: 'cmd', where: 'stock-py » main #3 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T15:02:29.857Z] [Flake8] -> All quality gates have been passed
[2026-11-17T15:02:29.857Z] [Flake8]    - [Total (any severity)]: ≪Success≫ - (Actual value: 0, Quality gate: 1.00)
[2026-11-17T15:02:30.181Z] Scanned /home/jenkins/agent/workspace/stock-py_main/requirements.txt file and found 5 packages
[2026-11-17T15:02:30.744Z] No issues found
[2026-11-17T15:02:32.463Z] Successfully built stock_py-1.0.3-py3-none-any.whl
Finished: SUCCESS` },
  { t: 'shot', id: 'm6-09-py-green', titre: 'stock-py » main #3: every stage passed', ce: 'The same pipeline after the two fixes.', éléments: ['Code quality: passed (the old report is deleted first).', 'Security: passed (the whole tree is pinned).', 'Package: the wheel of version 1.0.3.'], actions: ['Compare with build #1 (*Previous Build*).'], résultat: 'SUCCESS: green in Jenkins and in Gitea.' },

  { t: 'h', id: 'm6-7', text: '6.7 Security analysis in CI' },
  { t: 'p', text: 'OSV-Scanner covers one family of checks. A complete CI chain usually combines several:' },
  { t: 'table', head: ['Check', 'Finds', 'Tools (examples)', 'In this course'], rows: [
    ['Dependency scanning (SCA)', 'Known vulnerabilities in libraries', 'OSV-Scanner, OWASP Dependency-Check, npm audit, pip-audit, Trivy', 'This module'],
    ['Static analysis (SAST)', 'Bugs and vulnerabilities in your own code', 'SonarQube, Semgrep, SpotBugs', 'Module 10 (SonarQube)'],
    ['Secret scanning', 'Passwords and tokens committed by mistake', 'gitleaks, trufflehog', 'Module 9'],
    ['Image scanning', 'Vulnerable packages in container images', 'Trivy, Grype', 'Modules 7 and 11'],
    ['Infrastructure as code', 'Insecure Terraform, Kubernetes, Dockerfiles', 'Checkov, Trivy config', 'Module 10'],
  ] },
  { t: 'ul', items: [
    '**Scan lockfiles**, not loose version ranges: what you scan must be what you ship (section 6.6).',
    '**Decide the policy**: report (UNSTABLE, as here) or block (FAILURE). Many teams block on *critical* and report the rest.',
    '**Exceptions are code**: an ID, a reason, an expiry date, reviewed in a pull request (`osv-scanner.toml`).',
    '**Run scans on code you trust.** The Java scan printed: *enricher transitivedependency/pomxml may be risky when run on untrusted artifacts* — to resolve transitive Maven dependencies it reads POM files, so do not point it at code of unknown origin.',
  ] },

  { t: 'h', id: 'm6-8', text: '6.8 Artifacts, versions and publishing' },
  { t: 'p', text: 'Each build produces one versioned file: `stock-api-1.0.<n>.jar`, `stock-web-1.0.<n>.tgz`, `stock_py-1.0.<n>-py3-none-any.whl`. `archiveArtifacts` copies it to the controller, attached to the build, and `fingerprint: true` records its MD5 so that Jenkins can tell which builds produced or used this exact file (*See Fingerprints*). Archived artifacts are deleted with their build (`buildDiscarder`): Jenkins is not a package repository. To share a version with other teams, **publish** it to a registry — here the package registry built into Gitea; Nexus and Artifactory in Module 10.' },
  { t: 'p', text: 'Prepare Gitea (as `lab-admin`, then as `jenkins-bot`), then Jenkins:' },
  { t: 'ol', items: [
    'Organization `lab` → **Teams** → *New Team* `ci-bots`: unit **Packages** = *Write*, everything else *No access*; add the member `jenkins-bot`. A bot gets only the right it needs.',
    'As `jenkins-bot`: **Settings → Applications** → *Generate Token* `jenkins-packages`, permission **package: Read and write** only.',
    'In Jenkins: *Manage Jenkins → Credentials → System → Global → Add Credentials* → **Username with password**: username `jenkins-bot`, password = the token, ID `gitea-packages`.',
  ] },
  { t: 'p', text: 'Maven reads repository passwords from a *settings* file. Commit one for CI, without any secret:' },
  { t: 'code', lang: 'xml', file: 'lab/stock-api — ci-settings.xml', code: CI_SETTINGS, lignes: [
    [9, 'Same `id` as the `<repository>` of `<distributionManagement>` in pom.xml.'],
    [10, 'Maven reads the environment variables set by `withCredentials` (Jenkinsfile lines 55–56): nothing secret is committed.'],
  ] },
  { t: 'p', text: 'With the Publish stage of the Jenkinsfile (lines 52–60), build #5 of `main` published version 1.0.5:' },
  { t: 'cmd', where: 'stock-api » main #5 → Console Output (real text, Publish stage)', cmd: '', out: `[2026-11-17T15:10:33.277Z] Masking supported pattern matches of $REPO_TOKEN
[2026-11-17T15:10:33.552Z] + mvn -B -s ci-settings.xml -Drevision=1.0.5 -DskipTests deploy
[2026-11-17T15:10:34.489Z] [INFO] Building stock-api 1.0.5
[2026-11-17T15:10:34.748Z] [INFO] Generating flattened POM of project com.example:stock-api:jar:1.0.5...
[2026-11-17T15:10:35.519Z] [INFO] Uploading to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/1.0.5/stock-api-1.0.5.pom
[2026-11-17T15:10:35.519Z] [INFO] Uploaded to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/1.0.5/stock-api-1.0.5.pom (3.6 kB at 33 kB/s)
[2026-11-17T15:10:35.519Z] [INFO] Uploading to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/1.0.5/stock-api-1.0.5.jar
[2026-11-17T15:10:35.519Z] [INFO] Uploaded to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/1.0.5/stock-api-1.0.5.jar (3.7 kB at 170 kB/s)
[2026-11-17T15:10:35.519Z] [INFO] Uploading to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/maven-metadata.xml
[2026-11-17T15:10:35.519Z] [INFO] Uploaded to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/maven-metadata.xml (0 B at 0 B/s)
[2026-11-17T15:10:35.519Z] [INFO] Skipping already-deployed com.example:stock-api:1.0.5
[2026-11-17T15:10:35.519Z] [INFO] BUILD SUCCESS
Finished: SUCCESS`, note: '`Masking supported pattern matches of $REPO_TOKEN`: the token would appear as `****` if a command printed it. The flattened POM carries the real version 1.0.5. The last line from maven-deploy-plugin 3.2.0, *Skipping already-deployed*, refers to the project it has just uploaded: the `Uploaded to gitea` lines and the registry are the proof.' },
  { t: 'shot', id: 'm6-11-publish-stage', titre: 'stock-api » main #5: the Publish stage', ce: 'The stage view of a build of `main`: Publish ran after Package.', éléments: ['**Publish**: runs only on `main` (`when { branch \'main\' }`).', 'The `mvn deploy` step, with the CI settings file.', 'Version 1.0.5 = build #5.'], actions: ['On a feature branch, the same stage shows as skipped.'], résultat: 'Every green build of main publishes one version.' },
  { t: 'shot', id: 'm6-10-gitea-package', titre: 'Gitea: the published package', ce: 'The Maven registry of the organization `lab`, in Gitea (Packages tab).', éléments: ['The package `com.example:stock-api` and its version.', 'Published by `jenkins-bot`: the bot of Jenkins.', '**Installation**: the snippet other projects add to use it.', '**Assets**: the jar and the POM.', '**Versions**: one per build of main.'], actions: ['Open http://localhost:3000/lab/-/packages.'], résultat: 'Other teams can depend on `com.example:stock-api:1.0.5`.' },
  { t: 'p', text: 'What if the same version is published twice? We ran the deploy of 1.0.4 again by hand:' },
  { t: 'cmd', where: 'agent-1, workspace stock-api_main (token in REPO_TOKEN)', cmd: 'mvn -B -s ci-settings.xml -Drevision=1.0.4 -DskipTests deploy', out: `[INFO] --- deploy:3.2.0:deploy (default-deploy) @ stock-api ---
[INFO] Uploading to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/1.0.4/stock-api-1.0.4.pom
[INFO] Uploading to gitea: http://gitea:3000/api/packages/lab/maven/com/example/stock-api/1.0.4/stock-api-1.0.4.jar
[INFO] BUILD FAILURE
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-deploy-plugin:3.2.0:deploy (default-deploy) on project stock-api: Failed to deploy artifacts: Could not transfer artifact com.example:stock-api:pom:1.0.4 from/to gitea (http://gitea:3000/api/packages/lab/maven): transfer failed for http://gitea:3000/api/packages/lab/maven/com/example/stock-api/1.0.4/stock-api-1.0.4.pom, status: 409 Conflict -> [Help 1]`, note: 'The registry refuses with **409 Conflict**: a release version is immutable — what was published as 1.0.4 stays 1.0.4 forever. This is why each build gets its own version. (SNAPSHOT versions are the exception: they are made to be republished.)' },
  { t: 'callout', kind: 'enterprise', text: 'In a company, CI publishes to a central repository manager (Nexus, Artifactory) with one repository per format and per maturity (snapshots, releases), retention rules, and promotion of a tested version from *staging* to *release* instead of rebuilding it. The Jenkinsfile stays the same: a settings file, a credential, `mvn deploy` (or `npm publish`, `twine upload`).' },

  { t: 'h', id: 'm6-9', text: '6.9 Common errors and fixes' },
  { t: 'p', text: 'All met while preparing this module:' },
  { t: 'errors', rows: [
    ['`node: error while loading shared libraries: libatomic.so.1: cannot open shared object file`', 'The official Node.js 26 binaries need libatomic, absent from the agent image.', 'Add `libatomic1` to the `apt-get install` of the agent image.'],
    ['`Error: ENOENT: no such file or directory, open \'test-results/junit.xml\'` (exit 7)', 'The junit reporter of `node --test` does not create the folder.', '`mkdir -p test-results` before the tests (package.json, line 12).'],
    ['`Failed to retrieve skin artifact … maven-fluido-skin`', '`checkstyle:checkstyle` renders an HTML report page and downloads a site skin.', 'Use `checkstyle:check` (XML report only) in CI.'],
    ['A linter report still lists issues you already fixed', 'flake8 does not rewrite `--output-file` when it finds nothing; the old file stays in the workspace.', '`rm -f flake8.txt` before the run, or start from a clean workspace.'],
    ['The scanner reports versions you did not install', 'Unpinned transitive dependencies, resolved differently by the scanner and by pip.', 'Pin the whole tree (pip freeze, pip-tools, uv); scan lockfiles.'],
    ['`status: 409 Conflict` during `mvn deploy`', 'This release version already exists in the registry.', 'One version per build (`1.0.${BUILD_NUMBER}`); never republish a release.'],
    ['`osv-scanner.toml has at least one ignore entry using \'ignoreUntil\' which has been deprecated`', 'Old name of the expiry key.', 'Rename it `effectiveUntil`.'],
    ['`npm audit fix --force` suggested by `npm ci`', 'The fix needs new major versions.', 'Upgrade deliberately in a branch, or record a time-limited exception.'],
    ['Gitea shows a failed status for a yellow build (*This commit is unstable*)', 'The Gitea plugin reports UNSTABLE as a failure.', 'Expected: fix the findings, or change the quality gate if the rule is wrong.'],
    ['`[Coverage] Skipping execution of coverage recorder since overall result is \'FAILURE\'`', 'The build already failed (compile or tests).', 'Fix the failure; coverage comes back with the next build.'],
  ] },
  { t: 'p', text: 'Two of these errors, reproduced in agent-1:' },
  { t: 'cmd', where: 'agent-1: node --test with a junit destination in a missing folder', cmd: 'node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=test-results/junit.xml; echo "exit $?"', out: `node:internal/test_runner/harness:131
      throw err;
      ^

Error: ENOENT: no such file or directory, open 'test-results/junit.xml'
Emitted 'error' event on WriteStream instance at:
    at WriteStream.onerror (node:internal/streams/readable:1116:14)
    at WriteStream.emit (node:events:514:20)
    at emitErrorNT (node:internal/streams/destroy:170:8)
    at emitErrorCloseNT (node:internal/streams/destroy:129:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: 'test-results/junit.xml'
}

Node.js v26.13.1
exit 7` },
  { t: 'cmd', where: 'agent-1: flake8 on a clean file, with an old flake8.txt present', cmd: 'flake8 clean.py --output-file flake8.txt; echo "exit code: $?"; echo "--- flake8.txt after a clean run:"; cat flake8.txt', out: `exit code: 0
--- flake8.txt after a clean run:
stock/rules.py:2:1: F401 'os' imported but unused`, note: 'Exit code 0 (no finding), and the file still holds a finding of the past.' },

  { t: 'h', id: 'm6-10', text: '6.10 Hands-on labs' },
  { t: 'lab', id: 'lab61', titre: 'Lab 6.1 — CI for a Maven project', durée: '60 min', objectif: 'Build, test, analyse and package lab/stock-api, then make the build green and fully covered.', étapes: [
    { t: 'p', text: '**1.** Build the agent image of section 6.2 and check the tool versions.' },
    { t: 'p', text: '**2.** Install the Coverage and Warnings plugins.' },
    { t: 'p', text: '**3.** Create `lab/stock-api` with the files of section 6.3 (first version of `Stock.java`, Jenkinsfile without the Publish stage) and the multibranch job `stock-api`.' },
    { t: 'p', text: '**4.** Push. Read the build page: tests, coverage, warnings. Why is it UNSTABLE?' },
    { t: 'p', text: '**5.** Fix the warning. Then add the test that brings line and branch coverage to 100%.' },
  ], solution: [
    { t: 'ul', items: ['Step 4: one Checkstyle warning (NeedBraces, `Stock.java:16`) against a gate of 1 → UNSTABLE.', 'Step 5: add braces (commit abd6aa3), then the test below. Our build #6: `Tests run: 5`, `Line Coverage: 100.00% (15/15)`, `Branch Coverage: 100.00% (6/6)`.'] },
    { t: 'code', lang: 'java', file: 'StockTest.java — test added', code: `    @Test
    void refusesANonPositiveQuantity() {
        Stock stock = new Stock(5);
        assertThrows(IllegalArgumentException.class, () -> stock.add("bolt", 0));
    }
` },
  ] },
  { t: 'lab', id: 'lab62', titre: 'Lab 6.2 — Quality gates for Node.js and Python', durée: '45 min', objectif: 'Reproduce the UNSTABLE builds of stock-web and stock-py and make them green, the right way.', étapes: [
    { t: 'p', text: '**1.** Create `lab/stock-web` and `lab/stock-py` with their first versions; push; note why each build is UNSTABLE.' },
    { t: 'p', text: '**2.** Fix the ESLint and flake8 findings. Upgrade `requests`. Push again: is everything green? Explain.' },
    { t: 'p', text: '**3.** Handle the two dev-only vulnerabilities of stock-web without hiding them.' },
    { t: 'p', text: '**4.** On a branch of stock-web, add a coverage gate of 95% (section 6.5), push, then make it pass.' },
  ], solution: [
    { t: 'ul', items: ['Step 2: stock-py stays UNSTABLE — stale `flake8.txt` and unpinned transitive dependencies (section 6.6). Delete the report before linting and pin the whole tree.', 'Step 3: `osv-scanner.toml` with the two IDs, a reason and `effectiveUntil`; the log then says *filtered out because…* and *No issues found*.', 'Step 4: 89.47% → UNSTABLE; add a test of `totalUnits` → 100%, gate passed (real log below).'] },
    { t: 'code', lang: 'javascript', file: 'test/stock.test.js — test added (import totalUnits too)', code: `test('adds up all the units', () => {
  assert.equal(totalUnits({ screw: 4, bolt: 12 }), 16)
})
` },
    { t: 'cmd', where: 'stock-web » feature/coverage-gate #2 → Console Output (real text, excerpt)', cmd: '', out: `[2026-11-17T15:14:13.888Z] ✔ formats a quantity (0.790855ms)
[2026-11-17T15:14:13.888Z] ✔ rejects a negative quantity (0.418796ms)
[2026-11-17T15:14:13.888Z] ✔ lists the items below the minimum, sorted (0.612211ms)
[2026-11-17T15:14:13.888Z] ✔ adds up all the units (0.174565ms)
[2026-11-17T15:14:13.918Z] [Coverage] Line Coverage: 100.00% (19/19)
[2026-11-17T15:14:13.933Z] [Coverage] -> All quality gates have been passed
[2026-11-17T15:14:13.933Z] [Coverage]    - [Whole project - Line Coverage]: ≪Success≫ - (Actual value: 100.00%, Quality gate: 95.00)
Finished: SUCCESS` },
  ] },
  { t: 'lab', id: 'lab63', titre: 'Lab 6.3 — FAILURE or UNSTABLE when a test fails', durée: '20 min', objectif: 'See both behaviours on a branch.', étapes: [
    { t: 'p', text: '**1.** On a branch of stock-api, change the last assertion of `raisesRestockAlertsBelowTheMinimum` to `assertTrue`. Push. Which stages ran? Is the coverage recorded?' },
    { t: 'p', text: '**2.** Add `-Dmaven.test.failure.ignore=true` to the test command. Push. What changes? Why is Publish skipped?' },
    { t: 'p', text: '**3.** Delete the branch in Gitea, then click *Scan Multibranch Pipeline Now* on `stock-api`. What happens to the job of the branch?' },
  ], solution: [
    { t: 'ul', items: ['Step 1: FAILURE; Code quality, Security, Package and Publish are skipped *due to earlier failure(s)*; test results are recorded, coverage is not.', 'Step 2: UNSTABLE; every stage runs and the jar is archived; Publish is skipped *due to when conditional* (not `main`).', 'Step 3: the scan finds only `main` and removes the job of the deleted branch, with its builds (orphaned item strategy of the multibranch job).'] },
    { t: 'cmd', where: 'stock-api → Scan Multibranch Pipeline Log (real text, excerpt)', cmd: '', out: `  Checking branches...
    Checking branch main
    Met criteria
  1 branches were processed
Evaluating orphaned items in stock-api
Will remove feature/restock-rule
Finished: SUCCESS` },
  ] },
  { t: 'lab', id: 'lab64', titre: 'Lab 6.4 — Publish to a package registry', durée: '30 min', objectif: 'Publish every build of main to the Maven registry of Gitea with a least-privilege token.', étapes: [
    { t: 'p', text: '**1.** Create the team `ci-bots`, the token and the credential `gitea-packages` (section 6.8).' },
    { t: 'p', text: '**2.** Add `ci-settings.xml`, the `<distributionManagement>` and flatten plugin of pom.xml, and the Publish stage. Push on `main`.' },
    { t: 'p', text: '**3.** Find the package in Gitea. Which user published it?' },
    { t: 'p', text: '**4.** Try to publish the same version again. What happens, and why is it good?' },
  ], solution: [
    { t: 'ul', items: ['Step 3: *Published by jenkins-bot*, with the jar and the POM as assets.', 'Step 4: `409 Conflict`: releases are immutable, so a version number always designates the same binary.'] },
  ] },
  { t: 'exercise', id: 'ex65', titre: 'Exercise 6.5 — Which result?', énoncé: [
    { t: 'p', text: 'With the Jenkinsfiles of this module, what is the result of the build of `main`, and does it publish? (a) a test fails; (b) ESLint finds 3 issues; (c) OSV-Scanner finds a critical vulnerability; (d) everything passes but the registry answers 401; (e) the code does not compile.' },
  ], solution: [
    { t: 'ul', items: ['(a) FAILURE, later stages skipped, no publication.', '(b) UNSTABLE (gate ≥ 1), the stages go on.', '(c) UNSTABLE through `catchError`, the stages go on — for stock-api, Publish would still run: decide whether a critical vulnerability must block (raise `buildResult` to `FAILURE` or stop before Publish).', '(d) FAILURE in Publish: `mvn deploy` exits with an error; fix the token or its rights.', '(e) FAILURE in Build.'] },
  ] },

  { t: 'recap', items: [
    'CI = every push is built and verified: checkout, build, unit tests, code quality, security, package, publish.',
    'Steps that fail make the build **FAILURE**; missed **quality gates** make it **UNSTABLE** — and the forge shows it.',
    'The same Jenkins steps serve every stack: `junit` (JUnit XML), `recordCoverage` (JaCoCo, Cobertura), `recordIssues` (Checkstyle, ESLint, flake8…).',
    'Record reports in `post { always }`, so that they exist even when the stage fails.',
    'Scan **lockfiles** with pinned versions; document exceptions with a reason and an expiry date.',
    'One version per build (`1.0.${BUILD_NUMBER}`); `archiveArtifacts` keeps it with the build, a registry shares it.',
    'Publish with a least-privilege token through `withCredentials`, only from `main`; releases are immutable (409 Conflict).',
  ] },
  { t: 'quiz', id: 'quiz6', questions: [
    { q: 'A unit test fails in `sh \'mvn test\'`. Result of the build?', choix: ['SUCCESS', 'UNSTABLE', 'FAILURE, later stages skipped', 'ABORTED'], bonne: 2, pourquoi: 'Maven exits with an error; with `-Dmaven.test.failure.ignore=true` it would be UNSTABLE.' },
    { q: 'Why record the test results in `post { always }`?', choix: ['It is faster', 'So that they are recorded even when the tests fail', 'Because `junit` cannot run in `steps`', 'To hide failures'], bonne: 1, pourquoi: 'When the tests fail, the steps stop; `post { always }` still runs.' },
    { q: 'Which step turns a Checkstyle, ESLint or flake8 report into a Jenkins page with a quality gate?', choix: ['junit', 'recordCoverage', 'recordIssues', 'archiveArtifacts'], bonne: 2, pourquoi: 'Warnings NG: `recordIssues(tools: [...], qualityGates: [...])`.' },
    { q: 'Why `npm ci` and not `npm install` in CI?', choix: ['It is the same', 'It installs exactly the lockfile and fails if it does not match package.json', 'It installs the latest versions', 'It skips the dev dependencies'], bonne: 1, pourquoi: 'Reproducible installs.' },
    { q: 'Line coverage dropped from 100% to 93.33% after adding braces. Why?', choix: ['A test was deleted', 'The throw is now on its own line, and no test executes it', 'JaCoCo is broken', 'Braces are not covered'], bonne: 1, pourquoi: 'The branch coverage (5/6) had already revealed the untested case.' },
    { q: 'Our stock-py build #2 still showed 2 flake8 issues after the fix. Why?', choix: ['flake8 ignores fixes', 'The report of build #1 was still in the workspace: flake8 does not rewrite it when it finds nothing', 'Jenkins caches reports', 'The commit was not pushed'], bonne: 1, pourquoi: 'Delete the report before running the linter.' },
    { q: 'How do you make the security scan see the versions you really install?', choix: ['Scan more often', 'Pin the whole dependency tree (lockfile)', 'Use npm audit', 'Ignore transitive dependencies'], bonne: 1, pourquoi: 'Otherwise the scanner resolves unpinned versions on its own.' },
    { q: 'A vulnerability cannot be fixed this week. Best practice?', choix: ['Remove the scan', 'A documented exception with a reason and an expiry date, reviewed like code', '`|| true` on the scan', 'Wait for the next audit'], bonne: 1, pourquoi: '`osv-scanner.toml` with `effectiveUntil` and `reason`.' },
    { q: 'What does `withCredentials([usernamePassword(...)])` give to the steps inside its block?', choix: ['A file on the controller', 'Environment variables holding the username and token, masked in the log', 'The Jenkins admin password', 'Nothing outside the controller'], bonne: 1, pourquoi: 'The log printed `Masking supported pattern matches of $REPO_TOKEN`.' },
    { q: 'The registry answers 409 Conflict to `mvn deploy`. Meaning?', choix: ['Wrong token', 'This release version already exists and cannot be overwritten', 'The registry is down', 'The POM is invalid'], bonne: 1, pourquoi: 'Releases are immutable: one version per build.' },
  ] },
  { t: 'checklist', id: 'm6', items: [
    'agent-1 runs my CI image: Java 21, Maven, Node.js 26, Python 3.13, OSV-Scanner.',
    'stock-api, stock-web and stock-py have multibranch jobs triggered by the organization webhook.',
    'I can read a test report, a coverage report and a warnings report, and their trends.',
    'My quality gates turn the build UNSTABLE, and I know how to make one block instead.',
    'My security scans read pinned lockfiles; my exceptions have a reason and an expiry date.',
    'Every build produces a versioned, fingerprinted artifact.',
    'main publishes to a registry with a least-privilege token, and I know why a release cannot be republished.',
  ] },
]

export default MODULE6
