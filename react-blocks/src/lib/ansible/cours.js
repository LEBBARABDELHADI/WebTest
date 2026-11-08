// Formation « Learning Ansible » : définitions, bases, exemples, simulateur,
// quiz et fiche à retenir. Contenu court et concret, exemples testables.

// 1. Définitions — chaque terme avec une analogie pour le retenir.
export const DÉFINITIONS = [
  { terme: 'Ansible', emoji: '🤖', déf: 'Outil open source d\'automatisation : il configure des serveurs, installe des logiciels et déploie des applications à partir de fichiers YAML.', analogie: 'Un chef d\'orchestre : il donne la même partition à tous les musiciens en même temps.', code: 'ansible --version' },
  { terme: 'Sans agent (agentless)', emoji: '🔌', déf: 'Rien à installer sur les serveurs gérés : Ansible s\'y connecte en SSH (WinRM pour Windows). Il faut juste Python sur la cible.', analogie: 'Un technicien qui vient avec sa caisse à outils : rien à installer chez toi.', code: 'ssh ubuntu@10.0.0.11   # si ça marche, Ansible peut y aller' },
  { terme: 'Nœud de contrôle', emoji: '🖥️', déf: 'La machine où Ansible est installé et d\'où tu lances les commandes (Linux, macOS ou WSL).', analogie: 'La tour de contrôle de l\'aéroport.', code: 'python3 -m pip install --user ansible' },
  { terme: 'Nœuds gérés', emoji: '🗄️', déf: 'Les serveurs (ou équipements) qu\'Ansible configure.', analogie: 'Les avions guidés par la tour.', code: 'web1, web2, db1…' },
  { terme: 'Inventaire', emoji: '📒', déf: 'La liste des serveurs, rangés en groupes (web, db…), au format INI ou YAML.', analogie: 'Le carnet d\'adresses.', code: '[web]\nweb1 ansible_host=10.0.0.11' },
  { terme: 'Module', emoji: '🧰', déf: 'Une unité de travail prête à l\'emploi : installer un paquet, copier un fichier, gérer un service…', analogie: 'Un outil de la caisse : tournevis, marteau, perceuse.', code: 'ansible.builtin.copy' },
  { terme: 'Tâche (task)', emoji: '✅', déf: 'Un appel à un module, avec un nom et des paramètres.', analogie: 'Une étape de la recette : « faire bouillir l\'eau ».', code: '- name: Installer nginx\n  ansible.builtin.apt:\n    name: nginx' },
  { terme: 'Play', emoji: '🎬', déf: 'Associe des hôtes (hosts) à une liste de tâches.', analogie: 'Un acte de la pièce : qui joue, et quoi.', code: '- hosts: web\n  tasks: [...]' },
  { terme: 'Playbook', emoji: '📜', déf: 'Fichier YAML qui contient un ou plusieurs plays. On le lance avec ansible-playbook.', analogie: 'La recette complète, rejouable à volonté.', code: 'ansible-playbook -i inventory.ini site.yml' },
  { terme: 'Commande ad hoc', emoji: '⚡', déf: 'Une action ponctuelle en une ligne, sans playbook.', analogie: 'Un SMS rapide plutôt qu\'une lettre.', code: 'ansible all -i inventory.ini -m ansible.builtin.ping' },
  { terme: 'Variable', emoji: '🏷️', déf: 'Une valeur nommée, réutilisable avec {{ nom }}. Définie dans le playbook, l\'inventaire, group_vars/host_vars ou avec -e.', analogie: 'Une case à remplir dans un formulaire.', code: 'vars:\n  port: 8080' },
  { terme: 'Facts', emoji: '🔎', déf: 'Informations collectées automatiquement sur chaque hôte au début du play : OS, IP, mémoire…', analogie: 'La fiche d\'identité du serveur.', code: "{{ ansible_facts['os_family'] }}" },
  { terme: 'Handler', emoji: '🔔', déf: 'Tâche lancée seulement si une autre tâche la « notifie » ET a changé quelque chose. Elle tourne une seule fois, à la fin du play.', analogie: 'Une sonnette : elle ne sonne que si quelqu\'un appuie.', code: 'notify: Redémarrer nginx' },
  { terme: 'Template (Jinja2)', emoji: '🧩', déf: 'Fichier modèle .j2 avec des variables, transformé en vrai fichier sur la cible par le module template.', analogie: 'Une lettre type où l\'on remplace « Madame, Monsieur [NOM] ».', code: 'listen {{ port }};' },
  { terme: 'Rôle', emoji: '📦', déf: 'Façon standard de ranger tâches, handlers, templates et variables dans des dossiers pour réutiliser une configuration.', analogie: 'Un kit tout prêt : « kit nginx », « kit base de données ».', code: 'ansible-galaxy init roles/nginx' },
  { terme: 'Collection', emoji: '🗂️', déf: 'Paquet de modules, rôles et plugins (ex. community.general). Le nom complet d\'un module (FQCN) est collection.module.', analogie: 'Une boîte à outils spécialisée qu\'on ajoute à son atelier.', code: 'ansible-galaxy collection install community.general' },
  { terme: 'Idempotence', emoji: '♻️', déf: 'Relancer le même playbook donne le même résultat : la 2e fois, rien ne change (changed=0).', analogie: 'Appuyer sur « allumer » quand la lampe est déjà allumée : rien ne se passe.', code: 'web1 : ok=4  changed=0  failed=0' },
  { terme: 'Become', emoji: '🔑', déf: 'Exécuter une tâche avec des privilèges (sudo par défaut).', analogie: 'Prendre le badge « administrateur ».', code: 'become: true' },
  { terme: 'Vault', emoji: '🔐', déf: 'Chiffre les secrets (mots de passe, clés API) dans les fichiers du projet.', analogie: 'Un coffre-fort dans le dépôt Git.', code: 'ansible-vault encrypt group_vars/all/secrets.yml' },
  { terme: 'Mode check', emoji: '🧪', déf: '--check simule le playbook sans rien modifier ; --diff montre ce qui changerait.', analogie: 'La répétition générale avant le spectacle.', code: 'ansible-playbook site.yml --check --diff' },
]

// 2. Les bases — une leçon courte par notion.
export const BASES = [
  {
    id: 'archi', emoji: '🏗️', titre: 'Comment ça marche', schéma: true,
    bref: 'Depuis le nœud de contrôle, Ansible se connecte en SSH à chaque serveur, y envoie un petit programme (le module), l\'exécute, récupère le résultat en JSON, puis le supprime.',
    points: ['Modèle « push » : c\'est toi qui lances, depuis ta machine.', 'Sans agent : SSH + Python sur la cible.', 'Les serveurs sont traités en parallèle (5 à la fois par défaut).'],
    code: 'python3 -m pip install --user ansible\nansible --version', langage: 'bash',
    piège: 'Sans clé SSH qui fonctionne, rien ne marche : teste d\'abord « ssh utilisateur@serveur ».',
  },
  {
    id: 'inventaire', emoji: '📒', titre: 'L\'inventaire',
    bref: 'Il liste tes serveurs et les range en groupes. Deux groupes existent toujours : all (tous) et ungrouped.',
    points: ['Format INI (simple) ou YAML.', 'Variables par hôte (ansible_host, ansible_user) ou par groupe ([web:vars]).', 'Vérifie-le avec ansible-inventory --graph.'],
    code: '# inventory.ini\n[web]\nweb1 ansible_host=10.0.0.11\nweb2 ansible_host=10.0.0.12\n\n[db]\ndb1 ansible_host=10.0.0.21\n\n[all:vars]\nansible_user=ubuntu', langage: 'ini',
    code2: 'ansible-inventory -i inventory.ini --graph', langage2: 'bash',
    piège: 'Un nom d\'hôte n\'est pas une adresse : sans ansible_host, Ansible essaie de résoudre « web1 » par DNS.',
  },
  {
    id: 'adhoc', emoji: '⚡', titre: 'Les commandes ad hoc',
    bref: 'Pour une action rapide, sans playbook : ansible <hôtes> -m <module> -a "<arguments>".',
    points: ['-m : le module, -a : ses arguments.', '-b (become) pour sudo.', 'Parfait pour vérifier ou dépanner ; pour ce qui se répète, écris un playbook.'],
    code: 'ansible all -i inventory.ini -m ansible.builtin.ping\nansible web -i inventory.ini -m ansible.builtin.command -a "uptime"\nansible web -i inventory.ini -b -m ansible.builtin.apt -a "name=htop state=present"', langage: 'bash',
    piège: 'ping d\'Ansible n\'est pas un ping réseau : il teste la connexion SSH et Python.',
  },
  {
    id: 'playbook', emoji: '📜', titre: 'La structure d\'un playbook',
    bref: 'Un playbook est une liste de plays. Chaque play dit sur quels hôtes travailler et quelles tâches exécuter, dans l\'ordre.',
    points: ['YAML : indentation de 2 espaces, jamais de tabulation.', 'Chaque tâche a un name clair : il s\'affiche pendant l\'exécution.', 'Les tâches s\'exécutent de haut en bas, sur tous les hôtes avant de passer à la suivante.'],
    code: '# site.yml\n- name: Préparer les serveurs web\n  hosts: web\n  become: true\n  tasks:\n    - name: Installer nginx\n      ansible.builtin.apt:\n        name: nginx\n        state: present\n        update_cache: true\n\n    - name: Démarrer nginx au boot\n      ansible.builtin.service:\n        name: nginx\n        state: started\n        enabled: true', langage: 'yaml',
    code2: 'ansible-playbook -i inventory.ini site.yml', langage2: 'bash',
    piège: 'Une erreur d\'indentation casse tout : lance ansible-playbook site.yml --syntax-check.',
  },
  {
    id: 'modules', emoji: '🧰', titre: 'Les modules à connaître',
    bref: 'Il existe des milliers de modules. Une dizaine suffit pour commencer.',
    tableau: [
      ['package / apt / dnf', 'Installer ou supprimer un paquet'],
      ['copy', 'Copier un fichier tel quel'],
      ['template', 'Générer un fichier à partir d\'un modèle .j2'],
      ['file', 'Créer un dossier, un lien, changer des droits'],
      ['service / systemd', 'Démarrer, arrêter, activer un service'],
      ['user / group', 'Gérer les comptes'],
      ['lineinfile', 'Ajouter ou modifier une ligne dans un fichier'],
      ['get_url', 'Télécharger un fichier'],
      ['command / shell', 'Lancer une commande (en dernier recours)'],
      ['debug', 'Afficher un message ou une variable'],
    ],
    code: '- name: Créer le dossier du site\n  ansible.builtin.file:\n    path: /var/www/monsite\n    state: directory\n    owner: www-data\n    mode: "0755"', langage: 'yaml',
    piège: 'Préfère toujours un module dédié à shell : shell n\'est pas idempotent (il « change » à chaque fois).',
  },
  {
    id: 'variables', emoji: '🏷️', titre: 'Variables et facts',
    bref: 'Une variable s\'écrit {{ nom }}. Les facts sont des variables collectées automatiquement sur chaque hôte. register garde le résultat d\'une tâche.',
    points: ['Où les mettre : vars du play, group_vars/<groupe>.yml, host_vars/<hôte>.yml, ou -e en ligne de commande (prioritaire).', 'Facts utiles : ansible_facts[\'os_family\'], ansible_facts[\'distribution\'], ansible_facts[\'default_ipv4\'][\'address\'].', 'Entoure de guillemets une valeur qui commence par {{ .'],
    code: '- hosts: web\n  vars:\n    port: 8080\n  tasks:\n    - name: Afficher l\'OS et le port\n      ansible.builtin.debug:\n        msg: "{{ inventory_hostname }} tourne sous {{ ansible_facts[\'distribution\'] }}, port {{ port }}"\n\n    - name: Lire la date\n      ansible.builtin.command: date\n      register: resultat\n      changed_when: false\n\n    - ansible.builtin.debug:\n        var: resultat.stdout', langage: 'yaml',
    code2: 'ansible-playbook -i inventory.ini site.yml -e "port=9090"', langage2: 'bash',
    piège: 'msg: {{ port }} sans guillemets = erreur YAML. Écris msg: "{{ port }}".',
  },
  {
    id: 'conditions', emoji: '🔀', titre: 'Conditions et boucles',
    bref: 'when exécute une tâche seulement si une condition est vraie. loop répète une tâche pour chaque élément d\'une liste.',
    points: ['when s\'écrit sans {{ }}.', 'Dans une boucle, l\'élément courant s\'appelle item.', 'Une tâche non exécutée s\'affiche « skipping ».'],
    code: '- name: Installer Apache (Debian/Ubuntu)\n  ansible.builtin.apt:\n    name: apache2\n  when: ansible_facts[\'os_family\'] == "Debian"\n\n- name: Installer Apache (Red Hat)\n  ansible.builtin.dnf:\n    name: httpd\n  when: ansible_facts[\'os_family\'] == "RedHat"\n\n- name: Installer des outils\n  ansible.builtin.package:\n    name: "{{ item }}"\n    state: present\n  loop:\n    - git\n    - curl\n    - htop', langage: 'yaml',
    piège: 'when: "{{ x }}" est une erreur classique : écris simplement when: x.',
  },
  {
    id: 'handlers', emoji: '🔔', titre: 'Les handlers',
    bref: 'Un handler réagit à un changement : on redémarre un service seulement si sa configuration a vraiment été modifiée.',
    points: ['notify: <nom du handler> dans la tâche.', 'Exécuté une seule fois, à la fin du play, même s\'il est notifié plusieurs fois.', 'Si rien n\'a changé, il ne tourne pas.'],
    code: '- hosts: web\n  become: true\n  tasks:\n    - name: Copier la configuration\n      ansible.builtin.copy:\n        src: nginx.conf\n        dest: /etc/nginx/nginx.conf\n      notify: Redémarrer nginx\n\n  handlers:\n    - name: Redémarrer nginx\n      ansible.builtin.service:\n        name: nginx\n        state: restarted', langage: 'yaml',
    piège: 'Le nom dans notify doit être exactement celui du handler (majuscules comprises).',
  },
  {
    id: 'templates', emoji: '🧩', titre: 'Les templates Jinja2',
    bref: 'Un template est un fichier .j2 avec des variables {{ }} et de la logique {% %}. Le module template le remplit et le dépose sur chaque serveur.',
    points: ['{{ variable }} pour insérer une valeur.', '{% for %} … {% endfor %} et {% if %} … {% endif %} pour la logique.', 'Rangés dans templates/ à côté du playbook (ou du rôle).'],
    code: '# templates/index.html.j2\n<h1>Bienvenue sur {{ inventory_hostname }}</h1>\n<p>Système : {{ ansible_facts[\'distribution\'] }}</p>\n<ul>\n{% for outil in outils %}\n  <li>{{ outil }}</li>\n{% endfor %}\n</ul>', langage: 'html',
    code2: '- name: Page d\'accueil\n  ansible.builtin.template:\n    src: index.html.j2\n    dest: /var/www/html/index.html', langage2: 'yaml',
    piège: 'copy dépose le fichier tel quel : pour remplacer des variables, il faut template.',
  },
  {
    id: 'roles', emoji: '📦', titre: 'Les rôles',
    bref: 'Quand un playbook grossit, on le découpe en rôles : chaque dossier a sa place et Ansible les charge automatiquement.',
    points: ['tasks/main.yml : les tâches.', 'handlers/, templates/, files/, defaults/ (variables par défaut, faciles à surcharger), vars/.', 'On les partage sur Ansible Galaxy.'],
    code: 'roles/nginx/\n├── defaults/main.yml\n├── handlers/main.yml\n├── tasks/main.yml\n├── templates/nginx.conf.j2\n└── files/', langage: 'texte',
    code2: '# site.yml\n- hosts: web\n  become: true\n  roles:\n    - nginx', langage2: 'yaml',
    piège: 'defaults/ = faible priorité (pensé pour être surchargé) ; vars/ = forte priorité.',
  },
  {
    id: 'vault', emoji: '🔐', titre: 'Les secrets avec Vault',
    bref: 'Ne mets jamais un mot de passe en clair dans Git : chiffre-le avec ansible-vault.',
    points: ['encrypt / decrypt / edit / view un fichier.', 'encrypt_string chiffre une seule valeur.', 'À l\'exécution : --ask-vault-pass ou --vault-password-file.'],
    code: 'ansible-vault create group_vars/all/secrets.yml\nansible-vault edit group_vars/all/secrets.yml\nansible-playbook -i inventory.ini site.yml --ask-vault-pass', langage: 'bash',
    piège: 'Ne commite jamais le fichier de mot de passe du vault : ajoute-le au .gitignore.',
  },
  {
    id: 'tester', emoji: '🧪', titre: 'Tester sans risque',
    bref: 'Avant de toucher la production : vérifie la syntaxe, simule, limite la cible.',
    points: ['--syntax-check : la syntaxe.', '--check --diff : simulation et différences.', '--limit web1 : un seul serveur ; --tags : certaines tâches ; -v à -vvv : plus de détails.', 'ansible-lint : les bonnes pratiques.'],
    code: 'ansible-playbook site.yml --syntax-check\nansible-playbook -i inventory.ini site.yml --check --diff\nansible-playbook -i inventory.ini site.yml --limit web1 -v\nansible-lint site.yml', langage: 'bash',
    piège: 'En mode check, les tâches command/shell ne sont pas exécutées : la simulation peut être incomplète.',
  },
]

// 3. Exemples simples, de bout en bout.
export const EXEMPLES = [
  {
    id: 'ping', emoji: '📡', titre: 'Vérifier que tous mes serveurs répondent', niveau: 1,
    objectif: 'Tester la connexion SSH et Python sur chaque serveur de l\'inventaire.',
    fichiers: [['inventory.ini', 'ini', '[web]\nweb1 ansible_host=10.0.0.11\nweb2 ansible_host=10.0.0.12\n\n[all:vars]\nansible_user=ubuntu']],
    commande: 'ansible all -i inventory.ini -m ansible.builtin.ping',
    résultat: 'web1 | SUCCESS => {\n    "changed": false,\n    "ping": "pong"\n}\nweb2 | SUCCESS => {\n    "changed": false,\n    "ping": "pong"\n}',
    explication: '« pong » = Ansible peut se connecter et exécuter des modules. UNREACHABLE = problème SSH (adresse, clé, utilisateur).',
  },
  {
    id: 'nginx', emoji: '🌐', titre: 'Installer Nginx et publier une page', niveau: 2,
    objectif: 'Installer Nginx, déposer une page d\'accueil, et redémarrer seulement si la page change.',
    fichiers: [
      ['site.yml', 'yaml', '- name: Serveurs web\n  hosts: web\n  become: true\n  tasks:\n    - name: Installer nginx\n      ansible.builtin.apt:\n        name: nginx\n        state: present\n        update_cache: true\n\n    - name: Copier la page d\'accueil\n      ansible.builtin.copy:\n        src: index.html\n        dest: /var/www/html/index.html\n      notify: Recharger nginx\n\n    - name: Nginx démarré et activé\n      ansible.builtin.service:\n        name: nginx\n        state: started\n        enabled: true\n\n  handlers:\n    - name: Recharger nginx\n      ansible.builtin.service:\n        name: nginx\n        state: reloaded'],
      ['files/index.html', 'html', '<h1>Déployé avec Ansible 🚀</h1>'],
    ],
    commande: 'ansible-playbook -i inventory.ini site.yml',
    résultat: 'PLAY RECAP *********************************************\nweb1 : ok=5  changed=3  unreachable=0  failed=0  skipped=0\nweb2 : ok=5  changed=3  unreachable=0  failed=0  skipped=0',
    explication: '1er lancement : 3 changements (paquet, page, rechargement). Relance-le : changed=0, c\'est l\'idempotence.',
  },
  {
    id: 'users', emoji: '👥', titre: 'Créer des comptes pour l\'équipe', niveau: 2,
    objectif: 'Créer plusieurs utilisateurs dans le groupe devops avec une seule tâche.',
    fichiers: [['users.yml', 'yaml', '- name: Comptes de l\'équipe\n  hosts: all\n  become: true\n  vars:\n    equipe: [alice, bob, karim]\n  tasks:\n    - name: Groupe devops\n      ansible.builtin.group:\n        name: devops\n\n    - name: Créer les comptes\n      ansible.builtin.user:\n        name: "{{ item }}"\n        groups: devops\n        append: true\n        shell: /bin/bash\n      loop: "{{ equipe }}"']],
    commande: 'ansible-playbook -i inventory.ini users.yml',
    résultat: 'TASK [Créer les comptes] *******************************\nchanged: [web1] => (item=alice)\nchanged: [web1] => (item=bob)\nchanged: [web1] => (item=karim)',
    explication: 'loop répète la tâche pour chaque prénom ; {{ item }} prend chaque valeur à tour de rôle.',
  },
  {
    id: 'template', emoji: '🧩', titre: 'Une page différente sur chaque serveur', niveau: 3,
    objectif: 'Générer une page qui affiche le nom et le système de chaque serveur grâce aux facts.',
    fichiers: [
      ['templates/index.html.j2', 'html', '<h1>{{ inventory_hostname }}</h1>\n<p>{{ ansible_facts[\'distribution\'] }} {{ ansible_facts[\'distribution_version\'] }}</p>\n<p>IP : {{ ansible_facts[\'default_ipv4\'][\'address\'] }}</p>'],
      ['page.yml', 'yaml', '- hosts: web\n  become: true\n  tasks:\n    - name: Page personnalisée\n      ansible.builtin.template:\n        src: index.html.j2\n        dest: /var/www/html/index.html\n        mode: "0644"'],
    ],
    commande: 'ansible-playbook -i inventory.ini page.yml --diff',
    résultat: '--- before: /var/www/html/index.html\n+++ after: /var/www/html/index.html\n-<h1>Déployé avec Ansible 🚀</h1>\n+<h1>web1</h1>\n+<p>Ubuntu 24.04</p>\n+<p>IP : 10.0.0.11</p>',
    explication: '--diff montre exactement ce qui change. Chaque serveur reçoit sa propre page.',
  },
  {
    id: 'os', emoji: '🔀', titre: 'S\'adapter au système (Ubuntu ou Red Hat)', niveau: 3,
    objectif: 'Un seul playbook qui installe le bon paquet selon la famille d\'OS.',
    fichiers: [['os.yml', 'yaml', '- hosts: all\n  become: true\n  tasks:\n    - name: Apache sur Debian/Ubuntu\n      ansible.builtin.apt:\n        name: apache2\n      when: ansible_facts[\'os_family\'] == "Debian"\n\n    - name: Apache sur Red Hat\n      ansible.builtin.dnf:\n        name: httpd\n      when: ansible_facts[\'os_family\'] == "RedHat"']],
    commande: 'ansible-playbook -i inventory.ini os.yml',
    résultat: 'TASK [Apache sur Debian/Ubuntu] ************************\nchanged: [web1]\nskipping: [rhel1]\n\nTASK [Apache sur Red Hat] ******************************\nskipping: [web1]\nchanged: [rhel1]',
    explication: 'Chaque serveur n\'exécute que la tâche qui le concerne ; les autres sont « skipping ».',
  },
]

// 4. Simulateur : sorties de terminal rejouées ligne par ligne.
const sep = t => `${t} ${'*'.repeat(Math.max(4, 48 - t.length))}`
export const SIMULATIONS = [
  {
    id: 'nginx', titre: 'Installer Nginx (site.yml)', exemple: 'nginx',
    runs: {
      premier: { libellé: '1er lancement', commande: 'ansible-playbook -i inventory.ini site.yml', lignes: [
        ['titre', sep('PLAY [Serveurs web]')], ['titre', sep('TASK [Gathering Facts]')], ['ok', 'ok: [web1]'], ['ok', 'ok: [web2]'],
        ['titre', sep('TASK [Installer nginx]')], ['changed', 'changed: [web1]'], ['changed', 'changed: [web2]'],
        ['titre', sep('TASK [Copier la page d\'accueil]')], ['changed', 'changed: [web1]'], ['changed', 'changed: [web2]'],
        ['titre', sep('TASK [Nginx démarré et activé]')], ['ok', 'ok: [web1]'], ['ok', 'ok: [web2]'],
        ['titre', sep('RUNNING HANDLER [Recharger nginx]')], ['changed', 'changed: [web1]'], ['changed', 'changed: [web2]'],
        ['titre', sep('PLAY RECAP')], ['recap', 'web1 : ok=5  changed=3  unreachable=0  failed=0  skipped=0'], ['recap', 'web2 : ok=5  changed=3  unreachable=0  failed=0  skipped=0'],
      ], leçon: 'Jaune = « changed » : Ansible a modifié le serveur. Le handler a tourné car la page a changé.' },
      second: { libellé: '2e lancement', commande: 'ansible-playbook -i inventory.ini site.yml', lignes: [
        ['titre', sep('PLAY [Serveurs web]')], ['titre', sep('TASK [Gathering Facts]')], ['ok', 'ok: [web1]'], ['ok', 'ok: [web2]'],
        ['titre', sep('TASK [Installer nginx]')], ['ok', 'ok: [web1]'], ['ok', 'ok: [web2]'],
        ['titre', sep('TASK [Copier la page d\'accueil]')], ['ok', 'ok: [web1]'], ['ok', 'ok: [web2]'],
        ['titre', sep('TASK [Nginx démarré et activé]')], ['ok', 'ok: [web1]'], ['ok', 'ok: [web2]'],
        ['titre', sep('PLAY RECAP')], ['recap', 'web1 : ok=4  changed=0  unreachable=0  failed=0  skipped=0'], ['recap', 'web2 : ok=4  changed=0  unreachable=0  failed=0  skipped=0'],
      ], leçon: 'Tout est vert : l\'état voulu est déjà là, rien ne change (changed=0). Le handler ne tourne pas. C\'est l\'idempotence.' },
      check: { libellé: '--check --diff', commande: 'ansible-playbook -i inventory.ini site.yml --check --diff', lignes: [
        ['titre', sep('PLAY [Serveurs web]')], ['titre', sep('TASK [Gathering Facts]')], ['ok', 'ok: [web1]'],
        ['titre', sep('TASK [Installer nginx]')], ['ok', 'ok: [web1]'],
        ['titre', sep('TASK [Copier la page d\'accueil]')], ['diff', '--- before: /var/www/html/index.html'], ['diff', '+++ after: index.html'], ['diff', '-<h1>Ancienne page</h1>'], ['diff', '+<h1>Déployé avec Ansible 🚀</h1>'], ['changed', 'changed: [web1]'],
        ['titre', sep('TASK [Nginx démarré et activé]')], ['ok', 'ok: [web1]'],
        ['titre', sep('RUNNING HANDLER [Recharger nginx]')], ['changed', 'changed: [web1]'],
        ['titre', sep('PLAY RECAP')], ['recap', 'web1 : ok=5  changed=2  unreachable=0  failed=0  skipped=0'],
      ], leçon: 'Simulation sur un serveur où nginx est déjà là : Ansible montre la page qui changerait (--diff) sans rien modifier. Sur un serveur vierge, une tâche qui dépend d\'une précédente (le service d\'un paquet pas encore installé) peut échouer en mode check.' },
    },
  },
  {
    id: 'erreurs', titre: 'Les erreurs fréquentes', exemple: null,
    runs: {
      ssh: { libellé: 'Serveur injoignable', commande: 'ansible all -i inventory.ini -m ansible.builtin.ping', lignes: [
        ['ok', 'web1 | SUCCESS => {"changed": false, "ping": "pong"}'],
        ['failed', 'db1 | UNREACHABLE! => {"msg": "Failed to connect to the host via ssh: Permission denied (publickey)."}'],
      ], leçon: 'UNREACHABLE = problème de connexion : mauvaise IP, mauvais utilisateur (ansible_user) ou clé SSH absente.' },
      module: { libellé: 'Faute de frappe', commande: 'ansible-playbook -i inventory.ini site.yml', lignes: [
        ['failed', 'ERROR! couldn\'t resolve module/action \'ansible.builtin.coppy\'.'],
        ['failed', 'The error appears to be in \'site.yml\': line 12, column 7'],
      ], leçon: 'Le module n\'existe pas : vérifie son nom avec ansible-doc -l | grep copy.' },
      sudo: { libellé: 'Oubli de become', commande: 'ansible-playbook -i inventory.ini site.yml', lignes: [
        ['titre', sep('TASK [Installer nginx]')],
        ['failed', 'fatal: [web1]: FAILED! => {"msg": "Failed to lock apt for exclusive operation"}'],
        ['titre', sep('PLAY RECAP')], ['recap', 'web1 : ok=1  changed=0  unreachable=0  failed=1  skipped=0'],
      ], leçon: 'Installer un paquet demande les droits root : ajoute become: true au play (et -K si sudo demande un mot de passe).' },
    },
  },
]

// 5. Quiz.
export const QUEL_MODULE = [
  ['Installer un paquet sur Ubuntu', 'ansible.builtin.apt', ['ansible.builtin.copy', 'ansible.builtin.command']],
  ['Déposer un fichier tel quel', 'ansible.builtin.copy', ['ansible.builtin.template', 'ansible.builtin.file']],
  ['Générer une configuration avec des variables', 'ansible.builtin.template', ['ansible.builtin.copy', 'ansible.builtin.lineinfile']],
  ['Démarrer et activer un service', 'ansible.builtin.service', ['ansible.builtin.shell', 'ansible.builtin.package']],
  ['Créer un compte utilisateur', 'ansible.builtin.user', ['ansible.builtin.group', 'ansible.builtin.command']],
  ['Modifier une seule ligne d\'un fichier', 'ansible.builtin.lineinfile', ['ansible.builtin.template', 'ansible.builtin.copy']],
  ['Créer un dossier avec des droits', 'ansible.builtin.file', ['ansible.builtin.copy', 'ansible.builtin.user']],
  ['Afficher la valeur d\'une variable', 'ansible.builtin.debug', ['ansible.builtin.ping', 'ansible.builtin.setup']],
  ['Télécharger une archive depuis une URL', 'ansible.builtin.get_url', ['ansible.builtin.copy', 'ansible.builtin.uri']],
  ['Tester la connexion aux serveurs', 'ansible.builtin.ping', ['ansible.builtin.command', 'ansible.builtin.debug']],
]
export const QCM = [
  { q: 'Que faut-il installer sur les serveurs gérés ?', r: 'Rien de spécial : un accès SSH et Python', f: ['Un agent Ansible qui tourne en permanence', 'Docker'] },
  { q: 'Quel fichier liste les serveurs et leurs groupes ?', r: 'L\'inventaire', f: ['Le playbook', 'ansible.cfg'] },
  { q: 'Quand un handler s\'exécute-t-il ?', r: 'À la fin du play, si une tâche qui le notifie a changé quelque chose', f: ['Après chaque tâche', 'À chaque lancement, toujours'] },
  { q: 'Au 2e lancement d\'un playbook, « changed=0 » veut dire…', r: 'Que l\'état voulu est déjà atteint (idempotence)', f: ['Que le playbook a échoué', 'Que les serveurs sont injoignables'] },
  { q: 'Quelle option simule un playbook sans rien modifier ?', r: '--check', f: ['--limit', '--syntax-check'] },
  { q: 'Comment protéger un mot de passe dans le dépôt ?', r: 'ansible-vault encrypt', f: ['Le mettre dans un commentaire', 'L\'écrire dans l\'inventaire'] },
  { q: 'Où ranger des variables communes au groupe web ?', r: 'group_vars/web.yml', f: ['host_vars/web.yml', 'roles/web/tasks/main.yml'] },
  { q: 'Pourquoi éviter shell quand un module existe ?', r: 'shell n\'est pas idempotent et contourne les vérifications du module', f: ['shell est plus lent à écrire', 'shell ne marche pas sous Linux'] },
  { q: 'Dans ansible.builtin.copy, que désigne ansible.builtin ?', r: 'La collection qui contient le module (FQCN)', f: ['Le nom du serveur', 'La version d\'Ansible'] },
  { q: 'Quelle commande crée le squelette d\'un rôle ?', r: 'ansible-galaxy init', f: ['ansible-vault create', 'ansible-doc init'] },
]

// 6. À retenir.
export const RETENIR = [
  ['🔌', 'Sans agent : SSH + Python sur la cible, rien d\'autre.'],
  ['📒', 'Inventaire = qui ; playbook = quoi ; module = comment.'],
  ['📜', 'Un playbook = des plays (hosts + tasks), en YAML indenté par 2 espaces.'],
  ['🧰', 'Toujours un module dédié plutôt que shell, avec son nom complet (ansible.builtin.copy).'],
  ['♻️', 'Idempotence : relancer ne casse rien, la 2e fois changed=0.'],
  ['🔔', 'Handler : ne réagit qu\'à un changement, une fois, à la fin du play.'],
  ['🏷️', 'Variables {{ }} ; facts sur l\'hôte ; -e l\'emporte sur tout.'],
  ['🔀', 'when pour une condition (sans {{ }}), loop pour répéter.'],
  ['📦', 'Un playbook qui grossit → des rôles (tasks, handlers, templates, defaults).'],
  ['🔐', 'Secrets → ansible-vault ; jamais de mot de passe en clair dans Git.'],
  ['🧪', 'Avant la prod : --syntax-check, --check --diff, --limit.'],
]
export const AIDE_MÉMOIRE = [
  ['ansible all -i inventory.ini -m ansible.builtin.ping', 'Tester la connexion'],
  ['ansible-inventory -i inventory.ini --graph', 'Voir l\'inventaire'],
  ['ansible-playbook -i inventory.ini site.yml', 'Lancer un playbook'],
  ['ansible-playbook site.yml --check --diff', 'Simuler et voir les différences'],
  ['ansible-playbook site.yml --limit web1 --tags nginx', 'Cibler un hôte, des tâches'],
  ['ansible-playbook site.yml -e "port=9090"', 'Passer une variable'],
  ['ansible-doc ansible.builtin.copy', 'Documentation d\'un module'],
  ['ansible-galaxy init roles/nginx', 'Créer un rôle'],
  ['ansible-galaxy collection install community.general', 'Installer une collection'],
  ['ansible-vault encrypt secrets.yml', 'Chiffrer un fichier'],
  ['ansible-lint site.yml', 'Vérifier les bonnes pratiques'],
]
export const STRUCTURE = 'mon-projet/\n├── ansible.cfg\n├── inventory.ini\n├── site.yml\n├── group_vars/\n│   ├── all.yml\n│   └── web.yml\n├── host_vars/\n│   └── web1.yml\n└── roles/\n    └── nginx/\n        ├── defaults/main.yml\n        ├── handlers/main.yml\n        ├── tasks/main.yml\n        └── templates/nginx.conf.j2'
