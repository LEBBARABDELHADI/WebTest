// Modèles prêts à l'emploi du « Graphe amélioré » (tableau blanc). Chaque
// modèle fabrique ses éléments autour de (0, 0) ; la page les recopie avec de
// nouveaux identifiants, au centre de l'écran.

const J = '#fff59d', O = '#ffcc80', R = '#f8bbd0', B = '#b3e5fc', V = '#c8e6c9', M = '#e1bee7', BL = '#ffffff', G = '#cfd8dc'

function fabrique() {
  let n = 0
  const els = []
  const id = () => `m${++n}`
  const f = {
    note: (x, y, texte, couleur = J, l = 180, h = 140) => { const e = { id: id(), type: 'note', x, y, l, h, texte, couleur, taille: 'auto' }; els.push(e); return e },
    forme: (x, y, l, h, forme, texte, couleur = BL, gras = false) => { const e = { id: id(), type: 'forme', forme, x, y, l, h, texte, couleur, bord: '#1b1b1b', taille: 'auto', ...(gras ? { gras } : {}) }; els.push(e); return e },
    cadre: (x, y, l, h, texte, couleur = BL) => { const e = { id: id(), type: 'cadre', x, y, l, h, texte, couleur }; els.push(e); return e },
    texte: (x, y, texte, taille = 28, gras = true, l = 600, h = 50) => { const e = { id: id(), type: 'texte', x, y, l, h, texte, couleur: '#1b1b1b', taille, gras }; els.push(e); return e },
    lier: (a, b, texte = '', flèche = 'fin', style = 'plein') => { const e = { id: id(), type: 'ligne', x1: 0, y1: 0, x2: 0, y2: 0, de: a.id, vers: b.id, couleur: '#1b1b1b', épaisseur: 2, flèche, style, ...(texte ? { texte } : {}) }; els.push(e); return e },
    trait: (x1, y1, x2, y2, épaisseur = 3, flèche = 'fin') => { const e = { id: id(), type: 'ligne', x1, y1, x2, y2, couleur: '#1b1b1b', épaisseur, flèche, style: 'plein' }; els.push(e); return e },
  }
  return [f, els]
}
// Plusieurs cadres côte à côte avec un titre et des pense-bêtes d'exemple.
function colonnes(titre, cols, { l = 340, h = 520, couleursNotes = [J, O, V, B, R, M] } = {}) {
  const [f, els] = fabrique()
  f.texte(0, -190, titre, 34)
  cols.forEach(([nom, notes, fond], i) => {
    const x = i * (l + 40)
    f.cadre(x, 0, l, h, nom, fond || BL)
    ;(notes || []).forEach((t, k) => f.note(x + 30 + (k % 2) * 145, 30 + Math.floor(k / 2) * 150, t, couleursNotes[i % couleursNotes.length], 130, 130))
  })
  return els
}

export const MODÈLES_TABLEAU = [
  // ---------- Réfléchir et organiser ----------
  {
    id: 'carte-mentale', catégorie: 'Réfléchir et organiser', emoji: '🧠', nom: 'Carte mentale', description: 'Une idée centrale et six branches',
    créer: () => {
      const [f, els] = fabrique()
      const c = f.forme(-130, -80, 260, 160, 'rond', 'Idée centrale', J, true)
      const branches = [['Pourquoi ?', O], ['Pour qui ?', R], ['Comment ?', B], ['Quand ?', V], ['Ressources', M], ['Risques', G]]
      branches.forEach(([t, coul], i) => {
        const a = (i / branches.length) * Math.PI * 2 - Math.PI / 2
        const n = f.note(Math.cos(a) * 420 - 90, Math.sin(a) * 300 - 70, t, coul)
        f.lier(c, n, '', 'aucune')
      })
      return els
    },
  },
  {
    id: 'kanban', catégorie: 'Réfléchir et organiser', emoji: '🗂️', nom: 'Kanban', description: 'À faire · En cours · Fait',
    créer: () => colonnes('Kanban', [['À faire', ['Tâche 1', 'Tâche 2', 'Tâche 3'], '#fff8e1'], ['En cours', ['Tâche 4'], '#e3f2fd'], ['Fait', ['Tâche 5'], '#e8f5e9']], { couleursNotes: [J, B, V] }),
  },
  {
    id: 'eisenhower', catégorie: 'Réfléchir et organiser', emoji: '🎯', nom: 'Matrice d\'Eisenhower', description: 'Urgent / important',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Matrice d\'Eisenhower', 34)
      const cases = [['🔥 Urgent et important — À faire tout de suite', '#fde2e1', 0, 0], ['📅 Important, pas urgent — À planifier', '#e3f2fd', 1, 0], ['🤝 Urgent, pas important — À déléguer', '#fff8e1', 0, 1], ['🗑️ Ni urgent ni important — À abandonner', '#eeeeee', 1, 1]]
      cases.forEach(([t, c, i, j]) => f.cadre(i * 460, j * 360, 440, 340, t, c))
      f.note(30, 40, 'Exemple', R, 130, 130)
      return els
    },
  },
  {
    id: 'swot', catégorie: 'Réfléchir et organiser', emoji: '🧭', nom: 'SWOT', description: 'Forces, faiblesses, opportunités, menaces',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Analyse SWOT', 34)
      ;[['💪 Forces', '#e8f5e9', 0, 0], ['⚠️ Faiblesses', '#fde2e1', 1, 0], ['🚀 Opportunités', '#e3f2fd', 0, 1], ['🌩️ Menaces', '#fff8e1', 1, 1]].forEach(([t, c, i, j]) => f.cadre(i * 460, j * 360, 440, 340, t, c))
      return els
    },
  },
  {
    id: 'retro', catégorie: 'Réfléchir et organiser', emoji: '🔁', nom: 'Rétrospective', description: 'Ce qui a marché · À améliorer · Actions',
    créer: () => colonnes('Rétrospective', [['😊 Ce qui a marché', ['…'], '#e8f5e9'], ['🤔 À améliorer', ['…'], '#fff8e1'], ['✅ Actions', ['Qui ? Quoi ? Quand ?'], '#e3f2fd']], { couleursNotes: [V, O, B] }),
  },
  // ---------- Technique ----------
  {
    id: 'architecture', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '🏗️', nom: 'Schéma d\'architecture', description: 'Utilisateur → CDN → répartiteur → serveurs → base',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Architecture', 34)
      const u = f.forme(0, 120, 160, 100, 'rond', '👤 Utilisateur', '#e3f2fd')
      const cdn = f.forme(240, 120, 170, 100, 'rect', '🌐 CDN / Akamai (WAF)', '#fff8e1')
      const lb = f.forme(490, 120, 170, 100, 'rect', '⚖️ Load balancer', '#f3e5f5')
      const s1 = f.forme(740, 20, 170, 90, 'rect', '🖥️ Serveur app 1', '#e8f5e9')
      const s2 = f.forme(740, 230, 170, 90, 'rect', '🖥️ Serveur app 2', '#e8f5e9')
      const db = f.forme(990, 120, 170, 110, 'rond', '🗄️ Base de données', '#fde2e1')
      const cache = f.forme(990, 300, 170, 80, 'rect', '⚡ Cache', '#eeeeee')
      f.lier(u, cdn, 'HTTPS'); f.lier(cdn, lb); f.lier(lb, s1); f.lier(lb, s2); f.lier(s1, db); f.lier(s2, db); f.lier(s2, cache, '', 'fin', 'tirets')
      f.cadre(700, -20, 500, 440, 'VPC / réseau privé', '#fafafa')
      return els
    },
  },
  {
    id: 'cicd', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '🚀', nom: 'Pipeline CI/CD', description: 'Code → build → tests → analyse → artefact → déploiement',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Pipeline CI/CD', 34)
      const étapes = [['📝 Code\n(git push)', B], ['🔨 Build\nmvn package', O], ['🧪 Tests\nSurefire / Failsafe', V], ['📊 Analyse\nJaCoCo / Sonar', M], ['📦 Artefact\nNexus', J], ['🚀 Déploiement\nrecette → prod', R]]
      let avant = null
      étapes.forEach(([t, c], i) => {
        const n = f.forme(i * 230, 0, 190, 120, 'rect', t, c)
        if (avant) f.lier(avant, n)
        avant = n
      })
      f.note(460, 190, 'Si échec : notifier l\'équipe', R, 190, 110)
      return els
    },
  },
  {
    id: 'maven', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '☕', nom: 'Cycle de vie Maven', description: 'validate → compile → test → package → verify → install → deploy',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Cycle de vie Maven (default)', 34)
      const phases = [['validate', 'Vérifie que le projet est cohérent'], ['compile', 'Compile le code source'], ['test', 'Exécute les tests unitaires'], ['package', 'Crée le JAR / WAR'], ['verify', 'Contrôles et tests d\'intégration'], ['install', 'Place le JAR dans le dépôt local ~/.m2'], ['deploy', 'Envoie dans le dépôt distant (Nexus)']]
      let avant = null
      phases.forEach(([p, d], i) => {
        const n = f.forme(i * 200, 0, 160, 80, 'rect', p, J, true)
        f.note(i * 200 + 5, 120, d, BL, 150, 120)
        if (avant) f.lier(avant, n)
        avant = n
      })
      return els
    },
  },
  {
    id: 'decision', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '🔀', nom: 'Organigramme de décision', description: 'Début → question → oui / non → actions',
    créer: () => {
      const [f, els] = fabrique()
      const début = f.forme(160, 0, 180, 70, 'rond', 'Incident signalé', V)
      const q1 = f.forme(140, 140, 220, 140, 'losange', 'Le service répond ?', J)
      const oui = f.forme(-160, 340, 200, 90, 'rect', 'Vérifier les logs applicatifs', BL)
      const q2 = f.forme(440, 320, 220, 140, 'losange', 'Le serveur est joignable ?', J)
      const red = f.forme(380, 530, 160, 80, 'rect', 'Redémarrer le service', BL)
      const esc = f.forme(600, 530, 160, 80, 'rect', 'Escalader au réseau', R)
      const fin = f.forme(140, 700, 200, 70, 'rond', 'Clôturer + post-mortem', V)
      f.lier(début, q1); f.lier(q1, oui, 'Oui'); f.lier(q1, q2, 'Non'); f.lier(q2, red, 'Oui'); f.lier(q2, esc, 'Non'); f.lier(oui, fin); f.lier(red, fin); f.lier(esc, fin)
      return els
    },
  },
  {
    id: 'incident', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '🚨', nom: 'Fiche incident', description: 'Symptôme, cause, impact, correctif, prévention',
    créer: () => colonnes('Fiche incident', [['🩺 Symptôme', ['Ce qu\'on observe'], '#fde2e1'], ['🔍 Cause', ['Cause racine'], '#fff8e1'], ['💥 Impact', ['Qui / combien de temps'], '#f3e5f5'], ['🛠️ Correctif', ['Ce qui a été fait'], '#e3f2fd'], ['🛡️ Prévention', ['Pour que ça ne revienne pas'], '#e8f5e9']], { l: 280, h: 420, couleursNotes: [R, O, M, B, V] }),
  },
  {
    id: 'k8s', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '☸️', nom: 'Cluster Kubernetes', description: 'Control plane, Ingress → Service → Pods, config, base',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Cluster Kubernetes', 34)
      f.cadre(-40, -40, 1300, 640, '☸️ Cluster', '#fafafa')
      const cp = f.forme(0, 0, 320, 120, 'rect', '🧠 Control plane\nAPI server · etcd · scheduler · controllers', '#e3f2fd', true)
      const dev = f.forme(-330, 10, 180, 100, 'rond', '👤 kubectl', '#eeeeee')
      f.lier(dev, cp, 'API')
      const web = f.forme(-330, 300, 180, 100, 'rond', '🌐 Utilisateurs', '#eeeeee')
      const ing = f.forme(0, 300, 200, 100, 'rect', '🚪 Ingress\n(HTTPS, routes)', '#fff8e1')
      const svc = f.forme(270, 300, 200, 100, 'rect', '⚙️ Service\nClusterIP', '#f3e5f5')
      const dep = f.cadre(540, 220, 400, 250, 'Deployment web · 3 réplicas', '#e8f5e9')
      const pods = [0, 1, 2].map(i => f.forme(560 + i * 125, 300, 110, 90, 'rect', `📦 Pod ${i + 1}`, '#ffffff'))
      const db = f.forme(1010, 290, 210, 120, 'cylindre', '🗄️ PostgreSQL\nStatefulSet + PVC', '#fde2e1')
      const cfg = f.note(560, 490, '🔧 ConfigMap + 🔑 Secret\n(variables, mots de passe)', O, 380, 80)
      f.lier(web, ing, 'HTTPS'); f.lier(ing, svc); pods.forEach(p => f.lier(svc, p))
      f.lier(dep, db, 'SQL'); f.lier(cfg, dep, '', 'fin', 'tirets'); f.lier(cp, dep, 'planifie', 'fin', 'tirets')
      f.note(0, 450, 'HPA : ajoute des pods quand le CPU monte', V, 300, 90)
      return els
    },
  },
  {
    id: 'gitops', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '🔄', nom: 'Flux GitOps', description: 'Code → CI → registre ; dépôt de config ← Argo CD → cluster',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Flux GitOps', 34)
      const dev = f.forme(0, 0, 180, 100, 'rond', '👩‍💻 Développeur', '#eeeeee')
      const code = f.forme(250, 0, 200, 100, 'rect', '🔀 Dépôt de code', B)
      const ci = f.forme(520, 0, 220, 100, 'rect', '🚀 CI\nbuild · tests · image', O)
      const reg = f.forme(810, 0, 210, 100, 'cylindre', '📦 Registre d\'images', '#eeeeee')
      const conf = f.forme(520, 230, 220, 110, 'rect', '🗂️ Dépôt de config\nmanifests / Helm', J)
      f.cadre(780, 190, 480, 300, '☸️ Cluster', '#fafafa')
      const argo = f.forme(810, 230, 200, 100, 'rect', '🔄 Argo CD / Flux', M, true)
      const app = f.forme(1040, 370, 190, 90, 'rect', '⚙️ Application', V)
      f.lier(dev, code, 'git push'); f.lier(code, ci, 'déclenche'); f.lier(ci, reg, 'push image'); f.lier(ci, conf, 'nouveau tag')
      f.lier(argo, conf, 'surveille (pull)', 'fin', 'tirets'); f.lier(argo, app, 'synchronise'); f.lier(app, reg, 'pull image', 'fin', 'tirets')
      f.note(0, 230, 'Git = source de vérité.\nLa CI n\'a pas d\'accès au cluster : c\'est lui qui tire les changements.', R, 380, 130)
      return els
    },
  },
  {
    id: 'trois-tiers', catégorie: 'Technique (DevOps, AWS, Maven)', emoji: '🧱', nom: 'Architecture 3 tiers', description: 'Présentation · application · données',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Architecture 3 tiers', 34)
      f.cadre(0, 0, 320, 460, '1 · Présentation', '#e3f2fd')
      f.cadre(380, 0, 360, 460, '2 · Application', '#e8f5e9')
      f.cadre(800, 0, 340, 460, '3 · Données', '#fde2e1')
      const nav = f.forme(60, 40, 200, 90, 'rond', '👤 Navigateur / mobile', BL)
      const cdn = f.forme(60, 190, 200, 90, 'rect', '🌐 CDN + fichiers statiques', BL)
      const lb = f.forme(460, 40, 200, 90, 'rect', '⚖️ Load balancer', BL)
      const a1 = f.forme(410, 200, 140, 90, 'rect', '⚙️ API 1', BL)
      const a2 = f.forme(570, 200, 140, 90, 'rect', '⚙️ API 2', BL)
      const cache = f.forme(860, 40, 220, 80, 'rect', '⚡ Cache (Redis)', BL)
      const bdd = f.forme(860, 170, 220, 110, 'cylindre', '🗄️ Base principale', BL)
      const rep = f.forme(860, 330, 220, 100, 'cylindre', '🗄️ Réplique (lecture)', BL)
      f.lier(nav, cdn); f.lier(nav, lb, 'HTTPS'); f.lier(lb, a1); f.lier(lb, a2)
      f.lier(a1, bdd); f.lier(a2, bdd); f.lier(a2, cache, '', 'fin', 'tirets'); f.lier(bdd, rep, 'réplication', 'fin', 'tirets')
      f.note(410, 330, 'Sans état : on peut ajouter des API à volonté', V, 300, 100)
      return els
    },
  },
  {
    id: 'parcours-devops', catégorie: 'Apprendre et mémoriser', emoji: '🗺️', nom: 'Parcours DevOps', description: '8 étapes avec cases à cocher et barre de progression',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Mon parcours DevOps', 34)
      const étapes = [
        ['1 · 🐧 Linux et réseau', ['Commandes de base et droits', 'Processus et systemd', 'Réseau : IP, DNS, ports', 'SSH et clés', 'Un script bash utile']],
        ['2 · 🔀 Git', ['Branches et merge', 'Rebase et conflits', 'Pull requests et revue', 'Stratégie de branches']],
        ['3 · 🐳 Docker', ['Images et conteneurs', 'Dockerfile multi-étapes', 'Volumes et réseaux', 'Docker Compose']],
        ['4 · 🚀 CI/CD', ['Pipeline build + tests', 'Artefacts et registre', 'Déploiement automatique', 'Secrets dans la CI']],
        ['5 · ☸️ Kubernetes', ['Pods, Deployments, Services', 'ConfigMaps et Secrets', 'Ingress', 'Probes et ressources', 'Helm']],
        ['6 · 🏗️ Terraform', ['Providers et ressources', 'Variables et outputs', 'State distant', 'Modules']],
        ['7 · 📊 Observabilité', ['Métriques (Prometheus)', 'Tableaux (Grafana)', 'Logs centralisés', 'Alertes']],
        ['8 · ☁️ Cloud et sécurité', ['Réseau (VPC)', 'IAM, moindre privilège', 'Stockage objet', 'Certification visée']],
      ]
      let avant = null
      étapes.forEach(([titre, points], i) => {
        // En serpentin : la 2e rangée va de droite à gauche (5 sous 4).
        const x = (i < 4 ? i : 7 - i) * 380, y = Math.floor(i / 4) * 400
        const c = f.cadre(x, y, 330, 320, titre, BL)
        f.note(x + 20, y + 20, points.map(p => `[ ] ${p}`).join('\n'), [B, O, V, M][i % 4], 290, 280)
        if (avant) f.lier(avant, c)
        avant = c
      })
      f.note(1540, 0, 'Coche les cases : la barre de chaque étape avance.\n\nChoisis une note puis « ✓ Tâche » pour l\'envoyer dans le Programme : quand la tâche est faite, elle compte aussi.', J, 260, 260)
      return els
    },
  },
  // ---------- Apprendre ----------
  {
    id: 'naturalisation', catégorie: 'Apprendre et mémoriser', emoji: '🇫🇷', nom: 'Révision naturalisation', description: 'Valeurs, symboles, institutions, dates',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'Naturalisation — l\'essentiel', 34)
      const blocs = [
        ['🕊️ Valeurs', ['Liberté', 'Égalité', 'Fraternité', 'Laïcité'], '#e3f2fd', B],
        ['🇫🇷 Symboles', ['Marianne', 'Drapeau tricolore', 'La Marseillaise (1792, Rouget de Lisle)', 'Le coq', '14 juillet'], '#fff8e1', J],
        ['🏛️ Institutions', ['Président de la République', 'Gouvernement', 'Parlement : Assemblée + Sénat', 'Conseil constitutionnel'], '#f3e5f5', M],
        ['📅 Dates clés', ['1789 : prise de la Bastille + DDHC', '1790 : fête de la Fédération', '1905 : laïcité', '1944 : vote des femmes', '1958 : Ve République'], '#e8f5e9', V],
      ]
      blocs.forEach(([t, notes, fond, coul], i) => {
        const x = i * 420
        f.cadre(x, 0, 390, 640, t, fond)
        notes.forEach((n, k) => f.note(x + 25, 25 + k * 120, n, coul, 340, 105))
      })
      f.note(0, 680, 'Devise : « Liberté, Égalité, Fraternité »', R, 380, 110)
      return els
    },
  },
  {
    id: 'frise', catégorie: 'Apprendre et mémoriser', emoji: '📜', nom: 'Frise chronologique', description: 'Une ligne de temps avec des événements',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -260, 'Frise chronologique', 34)
      const dates = [['1789', 'Révolution'], ['1792', 'Ire République'], ['1848', 'Suffrage universel masculin'], ['1905', 'Laïcité'], ['1944', 'Vote des femmes'], ['1958', 'Ve République']]
      f.trait(-40, 0, dates.length * 230 + 20, 0, 4)
      dates.forEach(([d, t], i) => {
        f.forme(i * 230, -30, 120, 60, 'rond', d, O, true)
        f.note(i * 230 - 25, i % 2 ? -210 : 60, t, i % 2 ? B : J, 170, 130)
      })
      return els
    },
  },
  {
    id: 'comparaison', catégorie: 'Apprendre et mémoriser', emoji: '⚖️', nom: 'Comparaison A / B', description: 'Deux colonnes et des critères',
    créer: () => {
      const [f, els] = fabrique()
      f.texte(0, -190, 'A vs B', 34)
      f.cadre(220, 0, 380, 560, 'A', '#e3f2fd'); f.cadre(620, 0, 380, 560, 'B', '#fff8e1')
      ;['Définition', 'Avantages', 'Limites', 'Quand l\'utiliser'].forEach((c, k) => {
        f.forme(0, 20 + k * 135, 200, 110, 'rect', c, G, true)
        f.note(240, 20 + k * 135, '…', B, 340, 110); f.note(640, 20 + k * 135, '…', J, 340, 110)
      })
      return els
    },
  },
  // ---------- Organisation ----------
  {
    id: 'semaine', catégorie: 'Organisation personnelle', emoji: '🗓️', nom: 'Semaine', description: 'Lundi → dimanche',
    créer: () => colonnes('Ma semaine', ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((j, i) => [j, i === 0 ? ['…'] : [], i > 4 ? '#f3e5f5' : '#ffffff']), { l: 300, h: 560 }),
  },
  {
    id: 'objectifs', catégorie: 'Organisation personnelle', emoji: '🏁', nom: 'Objectifs', description: 'Objectif → étapes → prochaines actions',
    créer: () => {
      const [f, els] = fabrique()
      const o = f.forme(0, 180, 240, 140, 'rect', '🏁 Mon objectif', J, true)
      ;['Étape 1 — échéance …', 'Étape 2 — échéance …', 'Étape 3 — échéance …'].forEach((t, i) => {
        const e = f.note(340, i * 190, t, B, 220, 150)
        f.lier(o, e)
        const a = f.note(640, i * 190, 'Prochaine action…', V, 200, 150)
        f.lier(e, a, '', 'fin', 'tirets')
      })
      return els
    },
  },
  {
    id: 'projet', catégorie: 'Organisation personnelle', emoji: '📋', nom: 'Plan de projet', description: 'Objectif, livrables, risques, planning, responsables',
    créer: () => colonnes('Plan de projet', [['🎯 Objectif', ['…'], '#fff8e1'], ['📦 Livrables', ['…'], '#e3f2fd'], ['⚠️ Risques', ['…'], '#fde2e1'], ['🗓️ Planning', ['…'], '#e8f5e9'], ['👥 Responsables', ['…'], '#f3e5f5']], { l: 300, h: 460, couleursNotes: [J, B, R, V, M] }),
  },
]

// Recopie des éléments avec de nouveaux identifiants (liens mis à jour),
// décalés pour que leur centre tombe sur (cx, cy).
export function instancierÉléments(éléments, cx, cy, nouvelId, boîte) {
  // Les lignes reliées n'ont pas de vraie position : on ne les compte pas.
  const placés = éléments.filter(e => !(e.type === 'ligne' && (e.de || e.vers)))
  const bs = (placés.length ? placés : éléments).map(boîte)
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y))
  const x1 = Math.max(...bs.map(b => b.x + b.l)), y1 = Math.max(...bs.map(b => b.y + b.h))
  const dx = cx - (x0 + x1) / 2, dy = cy - (y0 + y1) / 2
  const ids = new Map(éléments.map(e => [e.id, nouvelId()]))
  return éléments.map(e => {
    const c = { ...e, id: ids.get(e.id) }
    if (e.type === 'ligne') {
      Object.assign(c, { x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy })
      if (e.de) { if (ids.has(e.de)) c.de = ids.get(e.de); else delete c.de }
      if (e.vers) { if (ids.has(e.vers)) c.vers = ids.get(e.vers); else delete c.vers }
    } else if (e.type === 'trait') c.points = e.points.map(([x, y]) => [x + dx, y + dy])
    else { c.x = e.x + dx; c.y = e.y + dy }
    return c
  })
}
