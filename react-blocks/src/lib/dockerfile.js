// Relecture d'un Dockerfile : chaque instruction expliquée en français et
// contrôle des bonnes pratiques (sécurité, taille d'image, cache de build).

const INSTRUCTIONS = {
  FROM: 'Image de base. Chaque FROM commence une nouvelle étape (multi-stage) ; « AS nom » la nomme.',
  RUN: 'Exécute une commande pendant le build et enregistre le résultat dans une nouvelle couche.',
  CMD: 'Commande lancée par défaut au démarrage du conteneur (remplaçable par docker run … commande).',
  ENTRYPOINT: 'Programme principal du conteneur ; CMD lui fournit alors les arguments par défaut.',
  COPY: 'Copie des fichiers du contexte de build (ou d\'une autre étape avec --from) dans l\'image.',
  ADD: 'Comme COPY, mais sait aussi télécharger une URL et décompresser une archive. Préfère COPY.',
  ENV: 'Variable d\'environnement présente au build ET dans le conteneur final.',
  ARG: 'Variable disponible seulement pendant le build (docker build --build-arg). Reste visible dans l\'historique de l\'image.',
  EXPOSE: 'Documente le port écouté. N\'ouvre rien : la publication se fait avec -p ou dans Kubernetes.',
  WORKDIR: 'Dossier de travail des instructions suivantes (créé s\'il n\'existe pas).',
  USER: 'Utilisateur qui exécute les instructions suivantes et le conteneur.',
  HEALTHCHECK: 'Commande que Docker lance régulièrement pour savoir si le conteneur est en bonne santé.',
  LABEL: 'Métadonnées de l\'image (version, auteur, source…).',
  VOLUME: 'Déclare un dossier dont les données vivent hors de l\'image.',
  SHELL: 'Change le shell utilisé par les instructions RUN en forme shell.',
  STOPSIGNAL: 'Signal envoyé pour arrêter le conteneur (SIGTERM par défaut).',
  ONBUILD: 'Instruction différée, exécutée quand une autre image part de celle-ci.',
  MAINTAINER: 'Ancienne façon d\'indiquer l\'auteur (obsolète : utilise LABEL).',
}

// Lignes logiques : continuations « \ » recollées, commentaires retirés.
export function lireDockerfile(texte) {
  const lignes = []
  let courante = null
  ;(texte || '').split('\n').forEach((brute, i) => {
    const t = brute.trim()
    if (!courante && (!t || t.startsWith('#'))) return
    if (courante && t.startsWith('#')) return
    const suite = /\\\s*$/.test(brute)
    const morceau = t.replace(/\\\s*$/, '').trim()
    if (courante) courante.texte += ` ${morceau}`
    else courante = { ligne: i + 1, texte: morceau }
    if (!suite) { lignes.push(courante); courante = null }
  })
  if (courante) lignes.push(courante)
  return lignes.map(l => {
    const m = l.texte.match(/^(\w+)\s*(.*)$/)
    return { ligne: l.ligne, instruction: m ? m[1].toUpperCase() : '?', arguments: m ? m[2] : l.texte }
  })
}

const secret = /(pass(word)?|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|credentials?)/i

export function analyserDockerfile(texte) {
  const ins = lireDockerfile(texte)
  if (!ins.length) return null
  const alertes = []
  const a = (niveau, texte, ligne) => alertes.push({ niveau, texte, ligne })
  const étapes = []
  ins.forEach(x => {
    if (x.instruction === 'FROM') étapes.push({ ligne: x.ligne, image: x.arguments.split(/\s+/).filter(m => !m.startsWith('--'))[0] || '', nom: (x.arguments.match(/\bAS\s+(\S+)/i) || [])[1] || '', instructions: [] })
    if (étapes.length) étapes.at(-1).instructions.push(x)
  })
  if (!étapes.length) a('erreur', 'Pas d\'instruction FROM : un Dockerfile commence par FROM (après d\'éventuels ARG).')
  const nomsÉtapes = new Set(étapes.map(e => e.nom.toLowerCase()).filter(Boolean))
  for (const e of étapes) {
    const img = e.image
    if (img === 'scratch' || nomsÉtapes.has(img.toLowerCase()) || /^\$/.test(img)) continue
    if (img.includes('@sha256:')) continue
    const tag = img.split('/').pop().split(':')[1]
    if (!tag) a('alerte', `${img} sans tag : c'est « latest », qui change sans prévenir. Fixe une version (ex. ${img}:<version>).`, e.ligne)
    else if (tag === 'latest') a('alerte', `${img} : le tag « latest » rend le build non reproductible. Fixe une version.`, e.ligne)
  }
  const finale = étapes.at(-1)
  if (finale) {
    const users = finale.instructions.filter(x => x.instruction === 'USER')
    const dernier = users.at(-1)?.arguments.trim()
    if (!dernier) a('alerte', 'Aucun USER dans l\'étape finale : le conteneur tourne en root. Crée un utilisateur et ajoute « USER appuser ».', finale.ligne)
    else if (/^(root|0)(:|$)/.test(dernier)) a('alerte', 'L\'étape finale se termine en USER root.', users.at(-1).ligne)
    if (!ins.some(x => x.instruction === 'HEALTHCHECK')) a('info', 'Pas de HEALTHCHECK. (Sur Kubernetes ou ECS, on utilise plutôt les probes / health checks de l\'orchestrateur.)')
    if (!finale.instructions.some(x => ['CMD', 'ENTRYPOINT'].includes(x.instruction))) a('info', 'L\'étape finale n\'a ni CMD ni ENTRYPOINT : elle reprend ceux de l\'image de base.')
  }
  const construit = /\b(mvn|gradle|npm run build|yarn build|go build|cargo build|gcc|make|dotnet publish|pip wheel)\b/
  if (étapes.length === 1 && ins.some(x => x.instruction === 'RUN' && construit.test(x.arguments))) a('info', 'L\'image compile le code et le garde avec ses outils de build : un build multi-étapes (FROM … AS build, puis COPY --from=build) donnerait une image bien plus petite.')
  let copieTout = null
  ins.forEach((x, i) => {
    const arg = x.arguments
    if (x.instruction === 'RUN') {
      if (/apt-get\s+update/.test(arg) && !/apt-get\s+(-\S+\s+)*install/.test(arg)) a('alerte', '« apt-get update » seul dans un RUN : la couche est mise en cache et l\'install suivant utilisera une liste de paquets périmée. Mets update et install dans le même RUN.', x.ligne)
      if (/apt-get\s+(-\S+\s+)*install/.test(arg)) {
        if (!/(-y\b|--yes|--assume-yes)/.test(arg)) a('erreur', 'apt-get install sans -y : le build attend une confirmation et échoue.', x.ligne)
        if (!/--no-install-recommends/.test(arg)) a('info', 'Ajoute --no-install-recommends pour éviter les paquets inutiles.', x.ligne)
        if (!/rm\s+-rf\s+\/var\/lib\/apt\/lists/.test(arg)) a('alerte', 'Nettoie le cache apt dans le même RUN : « && rm -rf /var/lib/apt/lists/* ».', x.ligne)
      }
      if (/apk\s+add/.test(arg) && !/--no-cache/.test(arg)) a('info', 'apk add sans --no-cache : l\'index des paquets reste dans l\'image.', x.ligne)
      if (/pip3?\s+install/.test(arg) && !/--no-cache-dir/.test(arg)) a('info', 'pip install sans --no-cache-dir : le cache pip alourdit l\'image.', x.ligne)
      if (/\bnpm\s+install\b/.test(arg) && !/-g\b/.test(arg)) a('info', 'Préfère « npm ci » (installation exacte depuis package-lock.json) à « npm install ».', x.ligne)
      if (/\b(curl|wget)\b[^|]*\|\s*(ba|z)?sh\b/.test(arg)) a('alerte', 'Script téléchargé puis exécuté directement (curl | sh) : risque si la source est compromise. Télécharge, vérifie la somme de contrôle, puis exécute.', x.ligne)
      if (/\bsudo\b/.test(arg)) a('alerte', 'sudo est inutile dans un Dockerfile (le build tourne en root jusqu\'au USER) et ajoute une dépendance.', x.ligne)
      if (/chmod\s+(-R\s+)?777/.test(arg)) a('alerte', 'chmod 777 : tout le monde peut écrire. Donne seulement les droits nécessaires (ex. 755, chown appuser).', x.ligne)
      if (/^\s*cd\s|&&\s*cd\s/.test(arg)) a('info', 'cd dans un RUN ne dure que pour ce RUN : utilise WORKDIR.', x.ligne)
      if (copieTout && /\b(npm (ci|install)|yarn install|pip3? install -r|mvn (dependency|package|install)|go mod download|bundle install|composer install)\b/.test(arg)) a('alerte', `Les dépendances sont installées après « COPY . . » (ligne ${copieTout}) : la moindre modification du code relance toute l'installation. Copie d'abord le fichier de dépendances (package.json, requirements.txt, pom.xml…), installe, puis copie le reste.`, x.ligne)
    }
    if ((x.instruction === 'COPY' || x.instruction === 'ADD') && /(^|\s)\.\s+\S+\s*$/.test(arg) && !/--from/.test(arg)) copieTout = copieTout || x.ligne
    if (x.instruction === 'ADD') {
      if (/https?:\/\//.test(arg)) a('alerte', 'ADD d\'une URL : pas de vérification, pas de cache fiable. Utilise curl/wget dans un RUN avec vérification de la somme de contrôle.', x.ligne)
      else if (!/\.(tar|tgz|tar\.gz|tar\.bz2|tar\.xz|txz)(\s|$)/.test(arg)) a('info', 'ADD pour de simples fichiers : utilise COPY, plus explicite.', x.ligne)
    }
    if (x.instruction === 'ENV' || x.instruction === 'ARG') {
      for (const m of arg.matchAll(/([A-Za-z_][\w]*)\s*[= ]\s*("[^"]*"|'[^']*'|\S+)/g)) if (secret.test(m[1]) && m[2] && !/^\$/.test(m[2])) a('erreur', `${x.instruction} ${m[1]} contient un secret écrit en clair : il reste dans l'image et son historique. Utilise un secret de build (RUN --mount=type=secret) ou une variable fournie à l'exécution.`, x.ligne)
    }
    if ((x.instruction === 'CMD' || x.instruction === 'ENTRYPOINT') && !arg.trim().startsWith('[')) a('info', `${x.instruction} en forme shell : le processus ne reçoit pas directement les signaux (arrêt propre). Préfère la forme JSON : ${x.instruction} ["exécutable", "arg"].`, x.ligne)
    if (x.instruction === 'MAINTAINER') a('info', 'MAINTAINER est obsolète : utilise LABEL org.opencontainers.image.authors="…".', x.ligne)
    if (!INSTRUCTIONS[x.instruction]) a('erreur', `Instruction inconnue : ${x.instruction}.`, x.ligne)
    void i
  })
  const runs = ins.filter(x => x.instruction === 'RUN').length
  return {
    étapes: étapes.map(e => ({ nom: e.nom, image: e.image, ligne: e.ligne })),
    instructions: ins.map(x => ({ ...x, explication: INSTRUCTIONS[x.instruction] || '' })),
    alertes: alertes.sort((p, q) => ['erreur', 'alerte', 'info'].indexOf(p.niveau) - ['erreur', 'alerte', 'info'].indexOf(q.niveau) || (p.ligne || 0) - (q.ligne || 0)),
    stats: { instructions: ins.length, étapes: étapes.length, runs },
  }
}
