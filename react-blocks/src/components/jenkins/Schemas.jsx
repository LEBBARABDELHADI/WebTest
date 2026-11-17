// Schémas de la formation Jenkins (SVG). Ce sont des ILLUSTRATIONS : jamais présentées comme des
// captures de Jenkins (la légende le dit). Largeur minimale 600 px : sur téléphone, le schéma défile
// horizontalement dans son cadre au lieu de devenir illisible.
import { grotesk } from '../../lib/theme'

const ROUGE = '#d24939'
const BLEU = '#335061'
const VERT = '#2e9e6b'
const AMBRE = '#d97706'

function Boite({ x, y, l, h, titre, lignes = [], couleur = BLEU, T, plein = false, taille = 15 }) {
  return (
    <g>
      <rect x={x} y={y} width={l} height={h} rx={10} fill={plein ? couleur : T.surface} stroke={couleur} strokeWidth={2} />
      <text x={x + l / 2} y={y + (lignes.length ? 24 : h / 2 + 5)} textAnchor="middle" fontFamily={grotesk} fontWeight={800} fontSize={taille} fill={plein ? '#fff' : T.text}>{titre}</text>
      {lignes.map((t, i) => <text key={t} x={x + l / 2} y={y + 44 + i * 18} textAnchor="middle" fontFamily={grotesk} fontSize={13} fill={plein ? '#fff' : T.textMuted}>{t}</text>)}
    </g>
  )
}

function Flèche({ d, T, libellé, lx, ly, couleur, tirets = false }) {
  return (
    <g>
      <path d={d} fill="none" stroke={couleur ?? T.textMuted} strokeWidth={2} markerEnd="url(#jk-pointe)" strokeDasharray={tirets ? '6 5' : undefined} />
      {libellé && <text x={lx} y={ly} textAnchor="middle" fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>{libellé}</text>}
    </g>
  )
}

const Défs = ({ T }) => (
  <defs>
    <marker id="jk-pointe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={T.textMuted} /></marker>
  </defs>
)

function Lab0({ T }) {
  return (
    <svg viewBox="0 0 760 330" role="img" aria-label="Lab 0: a browser and a terminal on your computer, the Docker engine running the jenkins container, the jenkins_home volume, and the update center on the internet">
      <Défs T={T} />
      <rect x={10} y={10} width={560} height={310} rx={14} fill="none" stroke={T.border} strokeWidth={2} strokeDasharray="8 6" />
      <text x={24} y={34} fontFamily={grotesk} fontWeight={800} fontSize={14} fill={T.textMuted}>YOUR COMPUTER</text>
      <Boite x={30} y={52} l={170} h={70} titre="Browser" lignes={['http://localhost:8080']} T={T} />
      <Boite x={30} y={206} l={170} h={70} titre="Terminal" lignes={['docker compose …']} T={T} />
      <rect x={240} y={52} width={310} height={250} rx={12} fill="none" stroke={BLEU} strokeWidth={2} />
      <text x={395} y={74} textAnchor="middle" fontFamily={grotesk} fontWeight={800} fontSize={14} fill={BLEU}>Docker Engine</text>
      <Boite x={262} y={88} l={266} h={104} titre="container « jenkins »" lignes={['Jenkins 2.580.2 LTS · Java 21', 'user jenkins (uid 1000)', 'ports 8080 (web) · 50000 (agents)']} couleur={ROUGE} T={T} />
      <g>
        <ellipse cx={395} cy={230} rx={110} ry={12} fill={T.surface} stroke={BLEU} strokeWidth={2} />
        <path d="M285,230 L285,272 A110,12 0 0 0 505,272 L505,230" fill={T.surface} stroke={BLEU} strokeWidth={2} />
        <text x={395} y={258} textAnchor="middle" fontFamily={grotesk} fontWeight={800} fontSize={14} fill={T.text}>volume jenkins_home</text>
        <text x={395} y={276} textAnchor="middle" fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>→ /var/jenkins_home</text>
      </g>
      <Flèche d="M200,87 L258,120" T={T} libellé="port 8080" lx={232} ly={92} />
      <Flèche d="M200,241 L240,241" T={T} />
      <Flèche d="M395,192 L395,214" T={T} />
      <Boite x={600} y={100} l={150} h={92} titre="Internet" lignes={['updates.jenkins.io', '(plugins)']} couleur={VERT} T={T} />
      <Flèche d="M528,140 L596,140" T={T} libellé="HTTPS" lx={562} ly={132} />
    </svg>
  )
}

function Boucle({ T }) {
  const étapes = [['Plan', 'Jira, issues'], ['Code', 'Git'], ['Build', 'Maven, npm'], ['Test', 'JUnit, SonarQube'], ['Release', 'Nexus, registry'], ['Deploy', 'Ansible, Kubernetes'], ['Operate', 'servers, clusters'], ['Monitor', 'Prometheus, Grafana']]
  return (
    <svg viewBox="0 0 760 290" role="img" aria-label="The DevOps loop from Plan to Monitor; Jenkins automates Build, Test, Release and Deploy">
      <Défs T={T} />
      <rect x={196} y={20} width={368} height={34} rx={8} fill={ROUGE} />
      <text x={380} y={43} textAnchor="middle" fontFamily={grotesk} fontWeight={800} fontSize={15} fill="#fff">Jenkins pipeline: automated, repeatable, traced</text>
      {étapes.slice(0, 4).map(([n, o], i) => <Boite key={n} x={20 + i * 186} y={80} l={164} h={70} titre={n} lignes={[o]} couleur={i >= 2 ? ROUGE : BLEU} T={T} />)}
      {étapes.slice(4).map(([n, o], i) => <Boite key={n} x={578 - i * 186} y={190} l={164} h={70} titre={n} lignes={[o]} couleur={i <= 1 ? ROUGE : BLEU} T={T} />)}
      {[0, 1, 2].map(i => <Flèche key={i} d={`M${184 + i * 186},115 L${202 + i * 186},115`} T={T} />)}
      <Flèche d="M680,150 L680,186" T={T} />
      {[0, 1, 2].map(i => <Flèche key={`b${i}`} d={`M${578 - i * 186},225 L${560 - i * 186},225`} T={T} />)}
      <Flèche d="M100,190 L100,154" T={T} libellé="feedback" lx={140} ly={176} />
    </svg>
  )
}

function CiCd({ T }) {
  const étapes = ['Commit', 'Build', 'Test', 'Package', 'Staging', 'Approval', 'Production']
  const lignes = [
    ['Continuous integration', [1, 1, 1, 0, 0, 0, 0]],
    ['Continuous delivery', [1, 1, 1, 1, 1, 2, 3]],
    ['Continuous deployment', [1, 1, 1, 1, 1, 4, 1]],
  ]
  const couleur = v => (v === 1 ? VERT : v === 2 ? AMBRE : v === 3 ? '#8b8b8b' : 'transparent')
  return (
    <svg viewBox="0 0 760 250" role="img" aria-label="Continuous integration automates build and test; continuous delivery automates up to staging and requires an approval for production; continuous deployment automates everything up to production">
      {étapes.map((e, i) => <text key={e} x={210 + i * 78} y={30} textAnchor="middle" fontFamily={grotesk} fontWeight={700} fontSize={13} fill={T.textMuted}>{e}</text>)}
      {lignes.map(([nom, v], r) => (
        <g key={nom}>
          <text x={14} y={74 + r * 62} fontFamily={grotesk} fontWeight={800} fontSize={14} fill={T.text}>{nom}</text>
          {v.map((x, i) => x === 4 ? <text key={i} x={210 + i * 78} y={78 + r * 62} textAnchor="middle" fontFamily={grotesk} fontSize={12} fill={T.textMuted}>none</text> : (
            <g key={i}>
              <rect x={176 + i * 78} y={56 + r * 62} width={68} height={32} rx={8} fill={x ? couleur(x) : T.surface} stroke={x ? couleur(x) : T.border} strokeWidth={2} opacity={x === 3 ? 0.55 : 1} />
              <text x={210 + i * 78} y={77 + r * 62} textAnchor="middle" fontFamily={grotesk} fontSize={12} fontWeight={700} fill={x ? '#fff' : T.textMuted}>{x === 1 ? 'auto' : x === 2 ? 'human' : x === 3 ? 'click' : '—'}</text>
            </g>
          ))}
        </g>
      ))}
      <rect x={176} y={226} width={14} height={14} rx={3} fill={VERT} /><text x={196} y={238} fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>automated</text>
      <rect x={290} y={226} width={14} height={14} rx={3} fill={AMBRE} /><text x={310} y={238} fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>human decision</text>
      <rect x={430} y={226} width={14} height={14} rx={3} fill="#8b8b8b" opacity={0.55} /><text x={450} y={238} fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>one-click release after approval</text>
    </svg>
  )
}

function Architecture({ T }) {
  return (
    <svg viewBox="0 0 760 400" role="img" aria-label="Jenkins architecture: users and the Git server talk to the controller; the controller holds JENKINS_HOME, plugins and credentials and schedules builds on agents; agents publish artifacts and deploy">
      <Défs T={T} />
      <Boite x={14} y={40} l={150} h={64} titre="Users" lignes={['web UI, CLI, API']} T={T} />
      <Boite x={14} y={150} l={150} h={64} titre="Git server" lignes={['GitHub, GitLab…']} T={T} />
      <rect x={210} y={20} width={260} height={360} rx={14} fill={T.surface} stroke={ROUGE} strokeWidth={2.5} />
      <text x={340} y={46} textAnchor="middle" fontFamily={grotesk} fontWeight={800} fontSize={16} fill={ROUGE}>CONTROLLER</text>
      {[['Web UI · REST API · CLI', 64], ['Scheduler + build queue', 112], ['Plugins (update center)', 160], ['Credentials (encrypted)', 208], ['Build records, artifacts', 256]].map(([t, y]) => (
        <g key={t}><rect x={228} y={y} width={224} height={38} rx={8} fill={T.bg} stroke={T.border} /><text x={340} y={y + 24} textAnchor="middle" fontFamily={grotesk} fontSize={13.5} fill={T.text}>{t}</text></g>
      ))}
      <g>
        <ellipse cx={340} cy={316} rx={96} ry={10} fill={T.bg} stroke={BLEU} strokeWidth={2} />
        <path d="M244,316 L244,352 A96,10 0 0 0 436,352 L436,316" fill={T.bg} stroke={BLEU} strokeWidth={2} />
        <text x={340} y={344} textAnchor="middle" fontFamily={grotesk} fontWeight={800} fontSize={13.5} fill={T.text}>JENKINS_HOME</text>
      </g>
      <Flèche d="M164,72 L206,82" T={T} />
      <Flèche d="M164,182 L206,140" T={T} libellé="webhook" lx={150} ly={140} />
      <Boite x={530} y={30} l={216} h={82} titre="Linux agent (SSH)" lignes={['labels: linux docker', '2 executors']} T={T} />
      <Boite x={530} y={130} l={216} h={82} titre="Windows agent" lignes={['inbound: WebSocket / 50000', 'label: windows']} T={T} />
      <Boite x={530} y={230} l={216} h={82} titre="Kubernetes pods" lignes={['ephemeral agents', 'one pod per build']} T={T} />
      {[70, 170, 270].map(y => <Flèche key={y} d={`M470,${y + 2} L526,${y + 2}`} T={T} />)}
      <text x={498} y={64} textAnchor="middle" fontFamily={grotesk} fontSize={11.5} fill={T.textMuted}>builds</text>
      <Boite x={530} y={330} l={216} h={56} titre="Artifacts · deployments" lignes={[]} couleur={VERT} T={T} taille={14} />
      <Flèche d="M638,312 L638,326" T={T} />
    </svg>
  )
}

function VieBuild({ T }) {
  const étapes = [['1 Trigger', 'webhook, cron, click'], ['2 Queue', 'Build Queue'], ['3 Scheduling', 'label + free executor'], ['4 Workspace', 'checkout on the node'], ['5 Steps', 'run on the agent, log streamed'], ['6 Records', 'artifacts, test reports'], ['7 Result', 'status, notifications']]
  return (
    <svg viewBox="0 0 760 250" role="img" aria-label="The seven steps of the life of a build: trigger, queue, scheduling, workspace, steps, records, result">
      <Défs T={T} />
      {étapes.map(([n, s], i) => {
        const ligne = i < 4 ? 0 : 1
        const col = i < 4 ? i : 6 - i
        const x = 20 + col * 185
        const y = 30 + ligne * 120
        return <Boite key={n} x={x} y={y} l={160} h={74} titre={n} lignes={[s]} couleur={i === 4 ? ROUGE : BLEU} T={T} taille={14.5} />
      })}
      {[0, 1, 2].map(i => <Flèche key={i} d={`M${180 + i * 185},67 L${201 + i * 185},67`} T={T} />)}
      <Flèche d="M655,104 L655,146" T={T} />
      {[0, 1].map(i => <Flèche key={`r${i}`} d={`M${575 - i * 185},187 L${554 - i * 185},187`} T={T} />)}
      <text x={380} y={238} textAnchor="middle" fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>controller: 1, 2, 3, 6, 7 · agent: 4, 5</text>
    </svg>
  )
}

function Entreprise({ T }) {
  return (
    <svg viewBox="0 0 760 360" role="img" aria-label="Enterprise topology: developers push to Git, webhooks reach the controller behind an HTTPS reverse proxy; the controller has zero executors and schedules builds on static agents and Kubernetes pod agents, which use SonarQube, Nexus, the registry, Kubernetes and Ansible">
      <Défs T={T} />
      <Boite x={14} y={30} l={140} h={60} titre="Developers" lignes={['push, pull requests']} T={T} />
      <Boite x={14} y={130} l={140} h={60} titre="GitHub / GitLab" lignes={['repositories']} T={T} />
      <Boite x={200} y={70} l={150} h={60} titre="Reverse proxy" lignes={['HTTPS, SSO']} T={T} />
      <Boite x={390} y={40} l={170} h={120} titre="Controller" lignes={['0 executors', 'backed up daily', 'plugins pinned']} couleur={ROUGE} T={T} />
      <Flèche d="M154,60 L196,90" T={T} />
      <Flèche d="M154,160 L196,116" T={T} libellé="webhooks" lx={170} ly={150} />
      <Flèche d="M350,100 L386,100" T={T} />
      <Boite x={600} y={20} l={146} h={60} titre="Static agents" lignes={['Linux, Windows']} T={T} />
      <Boite x={600} y={110} l={146} h={60} titre="Kubernetes cloud" lignes={['pod agents']} T={T} />
      <Flèche d="M560,80 L596,56" T={T} />
      <Flèche d="M560,120 L596,138" T={T} />
      {[['SonarQube', 'quality gate'], ['Nexus / registry', 'artifacts, images'], ['Kubernetes', 'deployments'], ['Ansible', 'servers']].map(([n, s], i) => <Boite key={n} x={20 + i * 186} y={250} l={164} h={64} titre={n} lignes={[s]} couleur={VERT} T={T} />)}
      <Flèche d="M672,170 L672,214 L102,214 L102,246" T={T} tirets />
      {[1, 2, 3].map(i => <Flèche key={i} d={`M${102 + i * 186},214 L${102 + i * 186},246`} T={T} tirets />)}
      <text x={380} y={208} textAnchor="middle" fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>agents call the tools</text>
    </svg>
  )
}

function JenkinsAnsible({ T }) {
  const étapes = ['Checkout', 'Build', 'Test', 'Package', 'Deploy']
  return (
    <svg viewBox="0 0 760 330" role="img" aria-label="A Jenkins pipeline with Checkout, Build, Test, Package and Deploy stages; the Deploy stage runs ansible-playbook which connects over SSH to the servers of the inventory">
      <Défs T={T} />
      <text x={20} y={30} fontFamily={grotesk} fontWeight={800} fontSize={14} fill={ROUGE}>JENKINS: WHEN AND IN WHICH ORDER</text>
      {étapes.map((e, i) => <Boite key={e} x={20 + i * 148} y={44} l={128} h={50} titre={e} couleur={i === 4 ? ROUGE : BLEU} plein={i === 4} T={T} taille={14.5} />)}
      {[0, 1, 2, 3].map(i => <Flèche key={i} d={`M${148 + i * 148},69 L${164 + i * 148},69`} T={T} />)}
      <Flèche d="M676,94 L676,140" T={T} libellé="ansible-playbook site.yml" lx={560} ly={124} />
      <text x={20} y={140} fontFamily={grotesk} fontWeight={800} fontSize={14} fill={VERT}>ANSIBLE: HOW THE SERVERS MUST BE CONFIGURED</text>
      <Boite x={560} y={150} l={186} h={70} titre="Agent with Ansible" lignes={['inventory + SSH key']} couleur={VERT} T={T} />
      {[['web1', 'role: nginx, app'], ['web2', 'role: nginx, app'], ['db1', 'role: postgresql']].map(([n, r], i) => <Boite key={n} x={20 + i * 176} y={250} l={156} h={64} titre={n} lignes={[r]} T={T} />)}
      {[0, 1, 2].map(i => <Flèche key={`s${i}`} d={`M600,220 L${98 + i * 176},246`} T={T} tirets />)}
      <text x={430} y={244} fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>SSH (idempotent tasks)</text>
    </svg>
  )
}

function Volume({ cx, cy, titre, sous, T }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={92} ry={11} fill={T.surface} stroke={BLEU} strokeWidth={2} />
      <path d={`M${cx - 92},${cy} L${cx - 92},${cy + 40} A92,11 0 0 0 ${cx + 92},${cy + 40} L${cx + 92},${cy}`} fill={T.surface} stroke={BLEU} strokeWidth={2} />
      <text x={cx} y={cy + 26} textAnchor="middle" fontFamily={grotesk} fontWeight={800} fontSize={13.5} fill={T.text}>{titre}</text>
      <text x={cx} y={cy + 43} textAnchor="middle" fontFamily={grotesk} fontSize={12} fill={T.textMuted}>{sous}</text>
    </g>
  )
}

// Module 2 : le labo après l'ajout de l'agent et du proxy HTTPS.
function M2Lab({ T }) {
  return (
    <svg viewBox="0 0 760 350" role="img" aria-label="The lab after Module 2: the browser reaches the Nginx proxy over HTTPS on port 8443, Nginx forwards to the jenkins controller on port 8080, the agent-1 container connects to the controller over WebSocket, and each container keeps its data in a named volume">
      <Défs T={T} />
      <rect x={10} y={10} width={740} height={330} rx={14} fill="none" stroke={T.border} strokeWidth={2} strokeDasharray="8 6" />
      <text x={24} y={34} fontFamily={grotesk} fontWeight={800} fontSize={14} fill={T.textMuted}>DOCKER COMPOSE PROJECT « jenkins-lab »</text>
      <Boite x={24} y={58} l={160} h={70} titre="Browser" lignes={['https://localhost:8443']} T={T} />
      <Boite x={224} y={52} l={170} h={82} titre="proxy (nginx)" lignes={['TLS, port 443 → 8443', 'X-Forwarded-Proto']} couleur={VERT} T={T} />
      <Boite x={440} y={46} l={292} h={110} titre="jenkins (controller)" lignes={['Jenkins 2.580.2 LTS · Java 21', 'built-in node: 0 executors', 'UI · queue · plugins · API']} couleur={ROUGE} T={T} />
      <Boite x={440} y={214} l={292} h={92} titre="agent-1 (inbound agent)" lignes={['label linux · 2 executors', 'runs every build']} couleur={BLEU} T={T} />
      <Volume cx={130} cy={214} titre="jenkins_home" sous="→ /var/jenkins_home" T={T} />
      <Volume cx={318} cy={244} titre="agent1_work" sous="→ /home/jenkins/agent" T={T} />
      <Flèche d="M184,93 L220,93" T={T} libellé="HTTPS" lx={202} ly={84} />
      <Flèche d="M394,93 L436,93" T={T} libellé=":8080" lx={415} ly={84} />
      <Flèche d="M586,210 L586,160" T={T} libellé="WebSocket (agent → controller)" lx={640} ly={190} couleur={BLEU} />
      <Flèche d="M222,226 L436,140" T={T} tirets />
      <Flèche d="M410,272 L436,262" T={T} tirets />
      <text x={150} y={300} fontFamily={grotesk} fontSize={12.5} fill={T.textMuted}>dashed: data persisted in volumes</text>
    </svg>
  )
}

// Module 2 : de la configuration versionnée à un contrôleur prêt, sans assistant.
function M2Casc({ T }) {
  return (
    <svg viewBox="0 0 760 300" role="img" aria-label="Configuration as code: a Git repository holds the Dockerfile, plugins.txt and casc.yaml; docker build installs the pinned plugins into an image; the container starts with casc.yaml and a Docker secret mounted and comes up fully configured without the setup wizard">
      <Défs T={T} />
      <Boite x={20} y={24} l={210} h={110} titre="Git repository" lignes={['Dockerfile', 'plugins.txt (pinned)', 'casc.yaml']} T={T} />
      <Boite x={280} y={24} l={200} h={110} titre="docker build" lignes={['FROM jenkins/jenkins:', '2.580.2-lts-jdk21', 'jenkins-plugin-cli']} couleur={AMBRE} T={T} />
      <Boite x={530} y={24} l={210} h={110} titre="image" lignes={['lab/jenkins-casc:2.580.2', '74 plugins inside', 'no state, rebuildable']} couleur={BLEU} T={T} />
      <Flèche d="M230,79 L276,79" T={T} />
      <Flèche d="M480,79 L526,79" T={T} />
      <Boite x={280} y={178} l={200} h={100} titre="container" lignes={['CASC_JENKINS_CONFIG', 'secret admin_password', 'volume casc_home']} couleur={ROUGE} T={T} />
      <Boite x={530} y={178} l={210} h={100} titre="Jenkins ready" lignes={['no setup wizard', 'users, matrix, agent node', 'CSP enforced']} couleur={VERT} plein T={T} />
      <Boite x={20} y={178} l={210} h={100} titre="secrets/ (never in Git)" lignes={['admin_password', 'owner uid 1000, mode 400']} couleur={ROUGE} T={T} />
      <Flèche d="M635,134 L420,174" T={T} libellé="docker compose up" lx={560} ly={162} />
      <Flèche d="M230,228 L276,228" T={T} />
      <Flèche d="M480,228 L526,228" T={T} />
    </svg>
  )
}

// Module 3 : l'anatomie d'un job Freestyle, de son déclenchement à ses résultats.
function M3Freestyle({ T }) {
  const étapes = [['General', ['description, parameters', 'label, discard old builds'], BLEU], ['Source Code', ['None or Git', '(Module 5)'], BLEU], ['Triggers', ['manual, remote, cron,', 'after other jobs, SCM'], BLEU], ['Environment', ['clean workspace, secrets,', 'timestamps, timeouts'], AMBRE], ['Build Steps', ['shell commands,', 'in order'], ROUGE], ['Post-build', ['archive, reports,', 'notify, chain'], VERT]]
  return (
    <svg viewBox="0 0 760 300" role="img" aria-label="The six sections of a Freestyle job in execution order: General, Source Code Management, Triggers, Build Environment, Build Steps and Post-build Actions; the build runs on an agent and leaves a console log, artifacts and a result">
      <Défs T={T} />
      {étapes.map(([n, l, c], i) => <Boite key={n} x={10 + (i % 3) * 252} y={i < 3 ? 20 : 150} l={232} h={96} titre={n} lignes={l} couleur={c} T={T} />)}
      {[0, 1].map(i => <Flèche key={i} d={`M${242 + i * 252},68 L${258 + i * 252},68`} T={T} />)}
      <Flèche d="M620,116 L620,128 L126,128 L126,146" T={T} />
      {[0, 1].map(i => <Flèche key={`b${i}`} d={`M${242 + i * 252},198 L${258 + i * 252},198`} T={T} />)}
      <text x={380} y={276} textAnchor="middle" fontFamily={grotesk} fontSize={13} fill={T.textMuted}>Result: SUCCESS · UNSTABLE · FAILURE · ABORTED — kept with its console log, parameters and artifacts</text>
    </svg>
  )
}

// Liste tenue à jour avec src/lib/jenkins/schemas.js (vérifié par les tests).
const SCHÉMAS = { lab0: Lab0, boucle: Boucle, cicd: CiCd, architecture: Architecture, 'vie-build': VieBuild, entreprise: Entreprise, 'jenkins-ansible': JenkinsAnsible, 'm2-lab': M2Lab, 'm2-casc': M2Casc, 'm3-freestyle': M3Freestyle }

export default function Schema({ id, légende, T }) {
  const Dessin = SCHÉMAS[id]
  if (!Dessin) return null
  return (
    <figure style={{ margin: '14px 0', border: `1px solid ${T.border}`, borderRadius: 14, background: T.bg, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 600, padding: 10 }}><Dessin T={T} /></div>
      </div>
      <figcaption style={{ padding: '8px 12px', borderTop: `1px solid ${T.border}`, fontSize: 13, color: T.textMuted, lineHeight: 1.45 }}>
        <strong style={{ color: T.text }}>🖊️ Diagram</strong> — an illustration drawn for this course, not a Jenkins screenshot. {légende}
      </figcaption>
    </figure>
  )
}
