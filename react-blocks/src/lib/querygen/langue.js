// Interprétation locale d'une description en français ou en anglais (sans IA
// externe) : repère la collection, les filtres (valeurs, comparaisons, texte,
// existence, négation), les champs à projeter, le tri, la limite, les agrégats
// et les regroupements, en s'appuyant sur les noms et valeurs réellement
// présents dans le JSON. Chaque choix est noté comme hypothèse ; ce qui ne peut
// pas être rattaché au JSON est signalé au lieu d'être inventé.
import { ITER, compact, contientIteration, dernierNom, lire, normaliser, texteChemin, typeJson } from './chemins.js'
import { évaluer } from './plan.js'

// ---- Lexique ---------------------------------------------------------------

const VIDES = new Set(`le la les l un une des du de d au aux et ou avec leur leurs son sa ses ce cet cette ces qui que qu dont pour sur dans en est sont a ont je j me moi m souhaite souhaiterais veux voudrais aimerais avoir obtenir donne donner donnez retourner retourne renvoyer renvoie recuperer recupere lister liste listez afficher affiche affichez montrer montre extraire extrais sortir trouver trouve chercher selectionner selectionne tous toutes tout chaque il y quel quels quelle quelles valeur valeurs svp stp merci bien aussi seulement uniquement juste ainsi correspondant correspondants correspondantes
the a an and or with their its of for on in is are i want would like to get return returns list show display give me fetch find extract select all each every which that whose please also only just value values be has have those these this there what me my`.split(/\s+/))

const FR = new Set('le la les des du de avec leur leurs et ou dont qui est sont je souhaite veux avoir valeur cle clé nombre combien par pour dans en une un trier trie tries afficher lister recuperer retourner donne moi chaque toutes tous'.split(' '))
const EN = new Set('the with their and or of which whose is are get list show return count how many number by for in sorted sort value key give me each all'.split(' '))

// Concepts de champs : mot (normalisé, singulier) → concept.
const CONCEPTS = {
  id: 'id', ids: 'id', identifiant: 'id', identifiants: 'id', identifier: 'id', uid: 'id', ident: 'id',
  nom: 'name', noms: 'name', name: 'name', names: 'name', libelle: 'name', intitule: 'name', titre: 'name', title: 'name', appellation: 'name',
  type: 'type', types: 'type', sorte: 'type', kind: 'type', categorie: 'type', category: 'type',
  taille: 'size', tailles: 'size', size: 'size', sizes: 'size', capacite: 'size', capacity: 'size', volume_taille: 'size',
  etat: 'state', etats: 'state', statut: 'state', statuts: 'state', status: 'state', state: 'state', states: 'state', phase: 'state', phases: 'state',
  ip: 'ip', ips: 'ip', adresse_ip: 'ip', ipaddress: 'ip',
  email: 'email', emails: 'email', mail: 'email', mails: 'email', courriel: 'email', courriels: 'email', 'e-mail': 'email', adresse_email: 'email', adresse_mail: 'email',
  namespace: 'namespace', namespaces: 'namespace', ns: 'namespace', espace_de_noms: 'namespace',
  zone: 'zone', zones: 'zone', az: 'zone', availabilityzone: 'zone',
  region: 'region', regions: 'region',
  date: 'date', dates: 'date', creation: 'date', cree: 'date', created: 'date', lancement: 'date', launch: 'date', heure: 'date', time: 'date', timestamp: 'date', horodatage: 'date', demarrage: 'date',
  age: 'age', ages: 'age',
  role: 'role', roles: 'role',
  image: 'image', images: 'image', ami: 'image',
  noeud: 'node', noeuds: 'node', node: 'node', nodes: 'node', hote: 'node', host: 'node',
  port: 'port', ports: 'port',
  prix: 'price', price: 'price', cout: 'price', cost: 'price', montant: 'price', amount: 'price', tarif: 'price',
  quantite: 'quantity', quantity: 'quantity', qty: 'quantity', stock: 'quantity',
  version: 'version', versions: 'version',
  ville: 'city', villes: 'city', city: 'city', cities: 'city',
  pays: 'country', country: 'country', countries: 'country',
  telephone: 'phone', phone: 'phone', tel: 'phone',
  proprietaire: 'owner', owner: 'owner', auteur: 'owner', author: 'owner',
  chiffre: 'encrypted', chiffres: 'encrypted', chiffrement: 'encrypted', encrypted: 'encrypted', encryption: 'encrypted', crypte: 'encrypted', cryptes: 'encrypted',
  actif: 'active', actifs: 'active', active: 'active', actives: 'active', enabled: 'active', active_flag: 'active', activé: 'active', active2: 'active',
  pret: 'ready', prets: 'ready', ready: 'ready',
  conteneur: 'container', conteneurs: 'container', container: 'container', containers: 'container',
  label: 'labels', labels: 'labels', etiquette: 'tags', etiquettes: 'tags', tag: 'tags', tags: 'tags',
  redemarrage: 'restarts', redemarrages: 'restarts', restart: 'restarts', restarts: 'restarts',
  replicas: 'replicas', replica: 'replicas',
  salaire: 'salary', salary: 'salary', departement: 'department', department: 'department',
  description: 'description', iops: 'iops', arn: 'arn', vpc: 'vpc', 'sous-reseau': 'subnet', subnet: 'subnet', dns: 'dns', cle: 'key', key: 'key', valeur_champ: 'value',
}
// Noms de champs reconnus pour un concept (mots en fin de nom de champ).
const MOTS_CONCEPT = {
  id: ['id', 'uid', 'identifier'], name: ['name', 'nom', 'title', 'titre', 'label'], type: ['type', 'kind'], size: ['size', 'taille', 'capacity', 'sizegb', 'storage'],
  state: ['state', 'status', 'phase', 'etat', 'statut'], ip: ['ip', 'ipaddress', 'address'], email: ['email', 'mail'], namespace: ['namespace'],
  zone: ['zone', 'availabilityzone'], region: ['region'], date: ['time', 'date', 'timestamp', 'created', 'createdat', 'creationtimestamp', 'launchtime', 'createtime', 'updated'],
  age: ['age'], role: ['role', 'roles'], image: ['image', 'imageid'], node: ['nodename', 'node', 'host', 'hostname'], port: ['port', 'containerport'],
  price: ['price', 'prix', 'cost', 'amount'], quantity: ['quantity', 'qty', 'stock'], version: ['version'], city: ['city', 'ville'], country: ['country', 'pays'],
  phone: ['phone', 'telephone'], owner: ['owner', 'ownerid', 'author'], encrypted: ['encrypted'], active: ['active', 'enabled', 'isactive', 'actif'], ready: ['ready'],
  container: ['containers', 'container'], labels: ['labels'], tags: ['tags'], restarts: ['restartcount', 'restarts'], replicas: ['replicas'], salary: ['salary'],
  department: ['department'], description: ['description'], iops: ['iops'], arn: ['arn'], vpc: ['vpcid', 'vpc'], subnet: ['subnetid', 'subnet'], dns: ['dnsname', 'dns'], key: ['key'], value: ['value'],
}
// Clé de sortie d'un concept.
const CLÉ_SORTIE = { id: 'id', name: 'name', type: 'type', size: 'size', state: 'state', ip: 'ip', email: 'email', namespace: 'namespace', zone: 'zone', region: 'region', date: 'date', age: 'age', role: 'role', image: 'image', node: 'node', port: 'port', price: 'price', quantity: 'quantity', version: 'version', city: 'city', country: 'country', phone: 'phone', owner: 'owner', encrypted: 'encrypted', active: 'active', ready: 'ready', container: 'containers', labels: 'labels', tags: 'tags', restarts: 'restarts', replicas: 'replicas', salary: 'salary', department: 'department', description: 'description', iops: 'iops', arn: 'arn', vpc: 'vpc', subnet: 'subnet', dns: 'dns', key: 'key', value: 'value' }

// Valeurs : mot français → valeurs anglaises usuelles.
const VALEURS_FR = {
  disponible: ['available'], disponibles: ['available'], libre: ['available'], libres: ['available'],
  'en-cours': ['running', 'in-progress'], demarre: ['running', 'started'], demarree: ['running', 'started'], demarres: ['running'], demarrees: ['running'], 'en-marche': ['running'], 'en-execution': ['running'], execution: ['running'], lance: ['running'], lancee: ['running'], lances: ['running'],
  arrete: ['stopped'], arretee: ['stopped'], arretes: ['stopped'], arretees: ['stopped'], stoppe: ['stopped'], stoppee: ['stopped'], stoppes: ['stopped'], stoppees: ['stopped'], 'a-l-arret': ['stopped'],
  'en-attente': ['pending'], attente: ['pending'],
  termine: ['terminated', 'succeeded', 'completed'], terminee: ['terminated', 'succeeded', 'completed'], termines: ['terminated', 'succeeded', 'completed'], terminees: ['terminated', 'succeeded', 'completed'], resilie: ['terminated'], resilies: ['terminated'], supprime: ['deleted', 'terminated'], supprimes: ['deleted', 'terminated'],
  utilise: ['in-use'], utilises: ['in-use'], utilisee: ['in-use'], utilisees: ['in-use'], attache: ['in-use', 'attached'], attaches: ['in-use', 'attached'], attachee: ['in-use', 'attached'], attachees: ['in-use', 'attached'], 'en-utilisation': ['in-use'],
  echoue: ['failed'], echoues: ['failed'], echouee: ['failed'], echouees: ['failed'], 'en-echec': ['failed'], echec: ['failed'], erreur: ['error', 'failed'], erreurs: ['error'],
  reussi: ['succeeded', 'success'], reussis: ['succeeded', 'success'], reussie: ['succeeded'], reussies: ['succeeded'], succes: ['succeeded', 'success'],
  actif: ['active'], actifs: ['active'], active: ['active'], actives: ['active'], inactif: ['inactive'], inactifs: ['inactive'], inactive: ['inactive'], inactives: ['inactive'],
  pret: ['ready'], prets: ['ready'], prete: ['ready'], pretes: ['ready'],
  public: ['public'], publics: ['public'], publique: ['public'], publiques: ['public'], prive: ['private'], prives: ['private'], privee: ['private'], privees: ['private'],
  'en-creation': ['creating'], creation: ['creating'], 'en-suppression': ['deleting'],
}
const MOTS_ÉTAT = new Set(['running', 'stopped', 'pending', 'terminated', 'stopping', 'shutting-down', 'available', 'in-use', 'creating', 'deleting', 'deleted', 'error', 'failed', 'succeeded', 'unknown', 'active', 'inactive', 'ready', 'completed', 'crashloopbackoff', 'enabled', 'disabled', 'healthy', 'unhealthy'])

// Collections : mot de la description → noms de tableaux possibles.
const COLLECTIONS = {
  instance: ['instances', 'instance'], ec2: ['instances', 'instance', 'reservations'], volume: ['volumes', 'volume'], ebs: ['volumes', 'volume'], disque: ['volumes', 'disks'], disk: ['volumes', 'disks'],
  pod: ['pod', 'pods'], noeud: ['node', 'nodes'], node: ['node', 'nodes'], service: ['service', 'services'], deploiement: ['deployment', 'deployments'], deployment: ['deployment', 'deployments'],
  conteneur: ['containers', 'container'], container: ['containers', 'container'], utilisateur: ['users', 'user', 'members', 'accounts', 'utilisateurs'], user: ['users', 'user', 'members', 'accounts'], membre: ['members', 'users'], compte: ['accounts', 'users'], account: ['accounts'],
  groupe: ['groups', 'group'], group: ['groups', 'group'], bucket: ['buckets'], compartiment: ['buckets'], snapshot: ['snapshots'], instantane: ['snapshots'], 'sous-reseau': ['subnets'], subnet: ['subnets'], vpc: ['vpcs'],
  fonction: ['functions'], function: ['functions'], lambda: ['functions'], role: ['roles'], politique: ['policies'], policy: ['policies'], commande: ['orders', 'commandes'], order: ['orders'], produit: ['products', 'produits'], product: ['products'],
  article: ['articles', 'items', 'products'], employe: ['employees', 'employes'], employee: ['employees'], client: ['customers', 'clients'], customer: ['customers'], tache: ['tasks', 'taches'], task: ['tasks'], projet: ['projects', 'projets'], project: ['projects'],
  evenement: ['events'], event: ['events'], regle: ['rules'], rule: ['rules'], champ: ['champs', 'fields'], field: ['fields', 'champs'], element: ['items', 'elements'], item: ['items'], entree: ['entries', 'items'], entry: ['entries'], ligne: ['rows', 'lines', 'items'], row: ['rows'], enregistrement: ['records'], record: ['records'],
  image: ['images'], alarme: ['alarms', 'metricalarms'], alarm: ['alarms', 'metricalarms'], table: ['tables'], cluster: ['clusters'], reservation: ['reservations'], tag: ['tags'], etiquette: ['tags'], attachement: ['attachments'], attachment: ['attachments'],
}

const NOMBRES = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six_en: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const UNITÉS = { go: 'size', gb: 'size', gib: 'size', gio: 'size', to: 'size', tb: 'size', mo: 'size', mb: 'size', mib: 'size', ans: 'age', an: 'age', years: 'age', year: 'age', yo: 'age', euros: 'price', euro: 'price', eur: 'price', '€': 'price', dollars: 'price', usd: 'price', '$': 'price', iops: 'iops', jours: 'age', days: 'age', redemarrages: 'restarts', restarts: 'restarts', replicas: 'replicas', ports: 'port' }

// ---- Préparation ------------------------------------------------------------

const singulier = m => (m.length > 3 && /ies$/.test(m) ? `${m.slice(0, -3)}y` : m.length > 3 && /aux$/.test(m) ? `${m.slice(0, -3)}al` : m.length > 2 && /[sx]$/.test(m) && !/(ss|us|is)$/.test(m) ? m.slice(0, -1) : m)

function préparer(description) {
  const guillemets = []
  let texte = description.replace(/[«“"]([^»”"]+)[»”"]|`([^`]+)`/g, (_, a, b) => { guillemets.push((a ?? b).trim()); return ` __Q${guillemets.length - 1}__ ` })
  texte = texte.replace(/(^|\s)'([^']+)'(?=\s|[.,;!?]|$)/g, (_, avant, a) => { guillemets.push(a.trim()); return `${avant} __Q${guillemets.length - 1}__ ` })
  // Élisions françaises : l'instance, d'état, qu'il.
  texte = texte.replace(/\b([ldjmnstc]|qu)['’]/gi, '$1 ')
  // Opérateurs collés : >=100, <30.
  texte = texte.replace(/(>=|<=|!=|==|≥|≤|>|<|=)/g, ' $1 ')
  const bruts = texte.split(/\s+/).map(t => t.replace(/^[([{]+|[)\]},;!?.:]+$/g, '')).filter(Boolean)
  const jetons = bruts.map((brut, i) => {
    const q = /^__Q(\d+)__$/.exec(brut)
    if (q) return { brut: guillemets[Number(q[1])], norm: normaliser(guillemets[Number(q[1])]), cité: true, i }
    const norm = normaliser(brut)
    return { brut, norm, sing: singulier(norm), i }
  })
  // Langue
  let fr = 0, en = 0
  for (const j of jetons) { if (FR.has(j.norm)) fr++; if (EN.has(j.norm)) en++ }
  if (/[éèêàùçôî]/i.test(description)) fr += 2
  return { jetons, langue: fr >= en ? 'fr' : 'en' }
}

// ---- Champs : correspondance mot → champ ------------------------------------

function conceptDe(jetons, k) {
  const j = jetons[k]
  if (!j || j.cité) return null
  const s1 = jetons[k + 1], s2 = jetons[k + 2]
  const formes = x => (x ? [x.norm, x.sing] : [])
  if (s1 && s2) for (const a of formes(j)) for (const b of formes(s1)) for (const c of formes(s2)) if (CONCEPTS[`${a}_${b}_${c}`]) return { concept: CONCEPTS[`${a}_${b}_${c}`], longueur: 3 }
  if (s1 && !s1.cité) for (const a of formes(j)) for (const b of formes(s1)) if (CONCEPTS[`${a}_${b}`]) return { concept: CONCEPTS[`${a}_${b}`], longueur: 2 }
  if (CONCEPTS[j.norm]) return { concept: CONCEPTS[j.norm], longueur: 1 }
  if (CONCEPTS[j.sing]) return { concept: CONCEPTS[j.sing], longueur: 1 }
  return null
}

// Score d'un champ pour un mot (nom exact) ou un concept.
function scoreChamp(champ, { mot, concept, singulierCollection, adjectifs = [] }) {
  const nom = champ.tag ? champ.tag.clé : dernierNom(champ.chemin)
  const c = compact(nom)
  const segments = champ.tag ? [] : champ.chemin.filter(x => typeof x === 'string').map(compact)
  let s = 0
  if (mot && (c === compact(mot) || c === singulier(compact(mot)))) s = 1
  else if (concept) {
    const mots = MOTS_CONCEPT[concept] || [concept]
    if (mots.includes(c)) s = 0.95
    else if (mots.some(m => c.endsWith(m) && c.length > m.length)) s = 0.8 + (singulierCollection && c === `${singulierCollection}${mots.find(m => c.endsWith(m))}` ? 0.15 : 0)
    else if (mots.some(m => c.includes(m))) s = 0.5
    else if (concept === 'name' && champ.tag && compact(champ.tag.clé) === 'name') s = 0.97
    if (concept === 'state' && segments.slice(0, -1).some(x => MOTS_CONCEPT.state.includes(x))) s = Math.max(s, 0.9) + (champ.types?.string ? 0.04 : 0)
    if (concept === 'name' && segments.slice(0, -1).some(x => MOTS_CONCEPT.state.includes(x))) s *= 0.3
    if (concept === 'ip') {
      if (adjectifs.includes('public') && /public/.test(c)) s += 0.12
      if (adjectifs.includes('private') && /private/.test(c)) s += 0.12
      if (!adjectifs.length && /private|pod/.test(c)) s += 0.05
      if (singulierCollection && c.startsWith(singulierCollection)) s += 0.06
    }
    if (concept === 'id' && champ.tag) s = 0
  }
  if (!s) return 0
  s -= (champ.tag ? 0 : Math.max(0, champ.chemin.length - 1) * 0.02)
  if (champ.présents !== undefined && champ.présents + (champ.nuls || 0) + (champ.absents || 0) > 0) s += 0.05 * (champ.présents / (champ.présents + champ.nuls + champ.absents))
  if (champ.multi) s -= 0.1
  return s
}

function meilleurChamp(collection, critère) {
  let meilleur = null, score = 0
  const sing = singulier(compact(dernierNom(collection.chemin)))
  const alternatives = []
  for (const champ of collection.champs) {
    if (!champ.feuille && !champ.tag && !(critère.concept === 'container' || critère.concept === 'labels' || critère.concept === 'tags')) continue
    const s = scoreChamp(champ, { ...critère, singulierCollection: sing })
    if (s > 0) alternatives.push({ champ, s })
    if (s > score) { score = s; meilleur = champ }
  }
  alternatives.sort((a, b) => b.s - a.s)
  return meilleur ? { champ: meilleur, score, alternatives: alternatives.slice(1, 4).filter(a => a.s > score - 0.12).map(a => a.champ) } : null
}

const refChamp = champ => (champ.tag ? { tag: champ.tag } : { chemin: champ.chemin })
const nomCollection = c => (c.chemin.length === 1 ? 'le tableau racine' : c.id)
const texteRef = champ => (champ.tag ? `étiquette ${champ.tag.clé}` : texteChemin(champ.chemin))

// ---- Valeurs : mot → (champ, valeur) -----------------------------------------

function indexValeurs(collection) {
  const index = new Map()
  for (const champ of collection.champs) {
    if (!champ.valeurs) continue
    // Clés/valeurs brutes des étiquettes : les pseudo-champs « étiquette X » suffisent.
    if (!champ.tag && champ.chemin.some((x, i) => x === ITER && /^tags?$/i.test(String(champ.chemin[i - 1])))) continue
    for (const { valeur, n } of champ.valeurs.values()) {
      if (typeof valeur !== 'string' || valeur.length > 80) continue
      const k = normaliser(valeur)
      if (!index.has(k)) index.set(k, [])
      index.get(k).push({ champ, valeur, n })
    }
  }
  return index
}

function choisirValeur(occurrences, conceptProche) {
  return [...occurrences].sort((a, b) => {
    const sa = (conceptProche && scoreChamp(a.champ, { concept: conceptProche }) > 0 ? 1 : 0) + (MOTS_ÉTAT.has(normaliser(a.valeur)) && /state|status|phase|etat/.test(compact(a.champ.texte)) ? 0.5 : 0) + (a.champ.multi ? -0.3 : 0) + (a.champ.tag ? -0.1 : 0) + a.n * 0.001 - a.champ.chemin.length * 0.01
    const sb = (conceptProche && scoreChamp(b.champ, { concept: conceptProche }) > 0 ? 1 : 0) + (MOTS_ÉTAT.has(normaliser(b.valeur)) && /state|status|phase|etat/.test(compact(b.champ.texte)) ? 0.5 : 0) + (b.champ.multi ? -0.3 : 0) + (b.champ.tag ? -0.1 : 0) + b.n * 0.001 - b.champ.chemin.length * 0.01
    return sb - sa
  })[0]
}

// ---- Collection ----------------------------------------------------------------

function choisirCollection(analyse, jetons, racine) {
  const candidates = analyse.collections.filter(c => c.typeÉléments === 'objet' || c.typeÉléments === 'scalaire')
  if (!candidates.length) return null
  const scores = candidates.map(c => {
    const nom = singulier(compact(dernierNom(c.chemin)))
    const noms = new Set([nom, ...(c.alias || []).map(a => singulier(compact(a)))])
    let s = 0
    const raisons = []
    const index = indexValeurs(c)
    for (const j of jetons) {
      if (j.cité) { if (index.has(j.norm)) { s += 1.5; raisons.push(j.brut) } continue }
      const cibles = COLLECTIONS[j.sing] || COLLECTIONS[j.norm] || []
      if (noms.has(j.sing) || noms.has(compact(j.norm)) || cibles.some(x => noms.has(singulier(x)))) { s += 3; raisons.push(j.brut) }
      if (index.has(j.norm) || (VALEURS_FR[j.norm] || []).some(v => index.has(v))) s += 1.2
      const concept = CONCEPTS[j.norm] || CONCEPTS[j.sing]
      if (concept && c.champs.some(ch => scoreChamp(ch, { concept }) >= 0.8)) s += 0.5
      if (c.champs.some(ch => ch.feuille && compact(ch.nom) === compact(j.norm) && j.norm.length > 2)) s += 0.8
    }
    const niveaux = c.chemin.filter(x => x === ITER).length
    s += Math.log10(c.nombre + 1) * 0.3 - (niveaux - 1) * 0.4
    // Sous-collections techniques (Tags, Attachments…) : moins probables par défaut.
    if (/^(tags|attachments|labels|annotations|conditions|containerstatuses)$/i.test(dernierNom(c.chemin))) s -= 1
    return { c, s, raisons }
  })
  // Deux collections nommées dont l'une est dans l'autre (« images des conteneurs des pods ») :
  // la plus précise l'emporte si elle est nommée la première.
  for (const x of scores) {
    if (!x.raisons.length) continue
    for (const y of scores) {
      if (x === y || !y.raisons.length || !(y.c.chemin.length < x.c.chemin.length && y.c.chemin.every((v, i) => v === x.c.chemin[i]))) continue
      const px = jetons.findIndex(j => j.brut === x.raisons[0]), py = jetons.findIndex(j => j.brut === y.raisons[0])
      if (px >= 0 && py >= 0 && px < py) x.s += 1
    }
  }
  scores.sort((a, b) => b.s - a.s)
  void racine
  return scores[0]
}

// ---- Interprétation ------------------------------------------------------------

const OPS_TEXTE = [
  { mots: ['superieur ou egal a', 'superieure ou egale a', 'superieurs ou egaux a', 'au moins', 'at least', 'greater than or equal to', 'no less than', 'minimum', '>=', '≥'], op: '>=' },
  { mots: ['inferieur ou egal a', 'inferieure ou egale a', 'au plus', 'au maximum', 'at most', 'less than or equal to', 'no more than', 'maximum', '<=', '≤'], op: '<=' },
  { mots: ['superieur a', 'superieure a', 'superieurs a', 'superieures a', 'plus de', 'plus grand que', 'plus grande que', 'au-dessus de', 'au dessus de', 'depassant', 'greater than', 'more than', 'larger than', 'bigger than', 'higher than', 'over', 'above', 'older than', '>'], op: '>' },
  { mots: ['inferieur a', 'inferieure a', 'inferieurs a', 'inferieures a', 'moins de', 'plus petit que', 'plus petite que', 'en dessous de', 'en-dessous de', 'less than', 'fewer than', 'smaller than', 'lower than', 'under', 'below', 'younger than', '<'], op: '<' },
  { mots: ['egal a', 'egale a', 'egaux a', 'vaut', 'valant', 'equal to', 'equals', 'equal', '==', '='], op: '==' },
  { mots: ['different de', 'differente de', 'not equal to', '!='], op: '!=' },
]
const OPS_DATE = [{ mots: ['apres le', 'apres', 'depuis le', 'depuis', 'after', 'since'], op: '>' }, { mots: ['avant le', 'avant', 'before'], op: '<' }]
const TEXTE_OPS = [
  { mots: ['commencant par', 'commence par', 'commencent par', 'debutant par', 'debute par', 'starting with', 'starts with', 'start with', 'begins with', 'beginning with', 'prefixe par', 'prefixed with'], type: 'commence' },
  { mots: ['finissant par', 'finit par', 'finissent par', 'se terminant par', 'se termine par', 'terminant par', 'ending with', 'ends with', 'end with', 'suffixe par'], type: 'finit' },
  { mots: ['contenant', 'contient', 'contiennent', 'qui contient', 'containing', 'contains', 'contain', 'including', 'includes', 'avec le mot', 'with the word', 'like'], type: 'contient' },
]
const NÉGATIONS = new Set(['non', 'pas', 'sauf', 'excepte', 'hors', 'not', 'except', 'excluding', 'aucun', 'aucune', 'jamais', 'no', 'without', 'sans', 'ni'])
const MOTS_COMPTER = ['combien', 'compter', 'compte', 'comptez', 'nombre', 'count', 'how many', 'number of', 'nombre total', 'total count', 'total number']
const MOTS_SOMME = ['somme', 'total', 'totale', 'totaux', 'cumul', 'cumule', 'cumulee', 'sum', 'additionner']
const MOTS_MOYENNE = ['moyenne', 'moyen', 'moyens', 'moyennes', 'average', 'mean', 'avg']
const MOTS_MAX = ['maximum', 'max', 'maximal', 'maximale', 'plus grand', 'plus grande', 'plus gros', 'plus grosse', 'plus eleve', 'plus elevee', 'plus haut', 'plus haute', 'largest', 'biggest', 'highest', 'greatest', 'most', 'plus recent', 'plus recente', 'plus recents', 'plus recentes', 'latest', 'newest', 'most recent', 'derniere creee', 'dernier cree', 'plus vieux', 'plus vieille', 'oldest_age', 'plus cher', 'plus chere', 'most expensive']
const MOTS_MIN = ['minimum', 'min', 'minimal', 'minimale', 'plus petit', 'plus petite', 'plus faible', 'plus bas', 'plus basse', 'smallest', 'lowest', 'least', 'plus ancien', 'plus ancienne', 'plus anciens', 'oldest', 'earliest', 'plus jeune', 'youngest', 'moins cher', 'moins chere', 'cheapest']
const MOTS_DISTINCT = ['distinct', 'distincts', 'distincte', 'distinctes', 'unique', 'uniques', 'differents', 'differentes', 'sans doublon', 'sans doublons', 'dedoublonne', 'dedoublonnes', 'deduplicated']
const MOTS_TRI = ['trie par', 'tries par', 'triee par', 'triees par', 'trier par', 'tri par', 'ordonne par', 'ordonnes par', 'classe par', 'classes par', 'classees par', 'sorted by', 'sort by', 'order by', 'ordered by', 'par ordre de', 'en ordre de']
const MOTS_DESC = ['decroissant', 'decroissante', 'decroissants', 'descendant', 'desc', 'descending', 'du plus grand au plus petit', 'du plus recent au plus ancien', 'largest first', 'biggest first', 'newest first', 'les plus recents d abord', 'highest first', 'reverse']
const MOTS_ASC = ['croissant', 'croissante', 'ascendant', 'asc', 'ascending', 'alphabetique', 'alphabetical', 'du plus petit au plus grand', 'smallest first', 'oldest first']
const MOTS_GROUPE = ['par', 'by', 'per', 'pour chaque', 'for each', 'regroupe par', 'regroupes par', 'regroupees par', 'groupe par', 'groupes par', 'grouper par', 'regrouper par', 'group by', 'grouped by']
const MOTS_JOINDRE = ['separes par des virgules', 'separees par des virgules', 'separes par une virgule', 'comma separated', 'comma-separated', 'joined', 'joindre', 'concatener', 'concatenes', 'en une ligne', 'on one line']
const MOTS_CLÉ = ['cle', 'cles', 'key', 'keys', 'champ', 'champs', 'field', 'fields', 'attribut', 'attributs', 'attribute', 'propriete', 'proprietes', 'property', 'properties']
const ADJ_TAILLE = { gros: 'size', grosse: 'size', grand: 'size', grande: 'size', large: 'size', big: 'size', biggest: 'size', largest: 'size', recent: 'date', recente: 'date', latest: 'date', newest: 'date', ancien: 'date', ancienne: 'date', oldest: 'date', earliest: 'date', vieux: 'age', vieille: 'age', jeune: 'age', youngest: 'age', cher: 'price', chere: 'price', expensive: 'price', cheapest: 'price' }

// Recherche d'une expression (suite de mots normalisés) à partir de la position k.
function expressionÀ(jetons, k, liste) {
  for (const e of [...liste].sort((a, b) => b.length - a.length)) {
    const mots = e.split(' ')
    if (mots.every((m, i) => jetons[k + i] && !jetons[k + i].cité && (jetons[k + i].norm === m || jetons[k + i].brut === m))) return mots.length
  }
  return 0
}
function chercherExpression(jetons, liste) {
  for (let k = 0; k < jetons.length; k++) { const n = expressionÀ(jetons, k, liste); if (n) return { k, n } }
  return null
}

const nombreDe = j => {
  if (!j || j.cité) return null
  const t = j.norm.replace(',', '.').replace(/(go|gb|gib|gio|mo|mb|to|tb|ans|€|\$|%)$/, '')
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  if (NOMBRES[j.norm] !== undefined) return NOMBRES[j.norm]
  return null
}
const unitéCollée = j => { const m = /^\d+(?:[.,]\d+)?(go|gb|gib|gio|mo|mb|to|tb|ans|€|\$)$/.exec(j?.norm || ''); return m ? UNITÉS[m[1]] : null }

export function interpréter(description, racine, analyse) {
  const { jetons, langue } = préparer(description || '')
  const hypothèses = []
  const raisons = []
  const utilisés = new Set()
  const marquer = (k, n = 1) => { for (let i = 0; i < n; i++) utilisés.add(k + i) }
  const indices = { champs: [], valeurs: [], opération: null, limite: false }
  if (!jetons.length) return { langue, plans: [], raisons: ['Description vide.'], hypothèses, indices, nonInterprétés: [] }

  // 1. « valeur de la clé X » : clé désignée par son nom.
  for (let k = 0; k < jetons.length - 1; k++) {
    if (!MOTS_CLÉ.includes(jetons[k].norm)) continue
    // « la clé X », « key X », « le champ X »
    const suivant = jetons[k + 1].norm === 'nommee' || jetons[k + 1].norm === 'named' || jetons[k + 1].norm === 'appelee' ? jetons[k + 2] : jetons[k + 1]
    if (!suivant) continue
    const nom = suivant.brut
    const exacte = analyse.clés.has(nom) ? nom : [...analyse.clés.keys()].find(c => normaliser(c) === normaliser(nom))
    if (!exacte) continue
    const occurrences = analyse.clés.get(exacte)
    marquer(k, suivant === jetons[k + 1] ? 2 : 3)
    hypothèses.push(`« ${nom} » est le nom d'une clé du JSON (${occurrences.length} emplacement${occurrences.length > 1 ? 's' : ''} : ${occurrences.slice(0, 4).map(o => texteChemin(o.chemin)).join(', ')}).`)
    const sansIteration = occurrences.filter(o => !contientIteration(o.chemin))
    const plans = []
    if (occurrences.length === 1) plans.push({ type: 'valeur', chemin: occurrences[0].chemin })
    else if (sansIteration.length === occurrences.length) plans.push({ type: 'valeurs', chemins: occurrences.map(o => o.chemin) })
    else for (const o of occurrences.slice(0, 4)) plans.push({ type: 'valeur', chemin: o.chemin })
    if (occurrences.length > 1) hypothèses.push(`La clé apparaît à plusieurs endroits : ${plans.length > 1 ? 'chaque emplacement est proposé séparément' : 'toutes les valeurs sont renvoyées dans une liste'}.`)
    return { langue, plans: plans.map((plan, i) => ({ plan, score: i, hypothèses: [...hypothèses] })), raisons, hypothèses, indices: { ...indices, clé: exacte }, nonInterprétés: [], recherche: exacte }
  }
  // Clé demandée mais absente.
  for (let k = 0; k < jetons.length - 1; k++) {
    if (!['cle', 'key'].includes(jetons[k].norm)) continue
    const nom = jetons[k + 1].brut
    if (VIDES.has(jetons[k + 1].norm)) continue
    const proches = [...analyse.clés.keys()].filter(c => distance(normaliser(c), normaliser(nom)) <= 2).slice(0, 5)
    raisons.push(`Aucune clé « ${nom} » dans ce JSON.${proches.length ? ` Clés proches : ${proches.join(', ')}.` : ''}`)
    return { langue, plans: [], raisons, hypothèses, indices, nonInterprétés: [] }
  }

  // 2. Clés d'un objet.
  if (chercherExpression(jetons, ['liste des cles', 'les cles', 'list of keys', 'the keys', 'keys of', 'cles de', 'cles du'])) {
    const cible = analyse.objetsRacine.find(ch => jetons.some(j => compact(dernierNom(ch)) === compact(j.norm) && j.norm.length > 2))
    const chemin = cible || []
    if (typeJson(lire(racine, chemin)) === 'object') {
      hypothèses.push(`Clés de ${chemin.length ? texteChemin(chemin) : 'l\'objet racine'}, dans l'ordre du JSON.`)
      return { langue, plans: [{ plan: { type: 'clés', chemin }, score: 0, hypothèses }], raisons, hypothèses, indices, nonInterprétés: [] }
    }
  }

  // 3. Collection
  const choix = choisirCollection(analyse, jetons, racine)
  const opCompter = chercherExpression(jetons, MOTS_COMPTER)
  if (!choix) {
    raisons.push('Le JSON ne contient pas de tableau à parcourir ; précisez un chemin ou une clé (ex. « valeur de la clé version »).')
    return { langue, plans: [], raisons, hypothèses, indices, nonInterprétés: [] }
  }
  const col = choix.c

  // Valeur d'un champ racine (« la version du formulaire ») si aucun mot ne désigne une collection.
  if (!choix.raisons.length) {
    const racineChamps = []
    for (let k = 0; k < jetons.length; k++) {
      const j = jetons[k]
      if (VIDES.has(j.norm) || j.cité) continue
      const cand = analyse.objetsRacine.concat([[]]).flatMap(ch => {
        const o = lire(racine, ch)
        if (typeJson(o) !== 'object') return []
        return Object.keys(o).filter(c => (compact(c) === compact(j.norm) || compact(c) === compact(j.sing)) && typeJson(o[c]) !== 'object').map(c => [...ch, c])
      })
      if (cand.length) racineChamps.push({ k, chemin: cand.sort((a, b) => a.length - b.length)[0] })
    }
    if (racineChamps.length && !opCompter && !col.champs.some(ch => racineChamps.some(r => compact(ch.nom || '') === compact(dernierNom(r.chemin))))) {
      if (racineChamps.length === 1) return { langue, plans: [{ plan: { type: 'valeur', chemin: racineChamps[0].chemin }, score: 0, hypothèses: [`« ${jetons[racineChamps[0].k].brut} » → ${texteChemin(racineChamps[0].chemin)}.`] }], raisons, hypothèses, indices, nonInterprétés: [] }
      return { langue, plans: [{ plan: { type: 'objet', champs: racineChamps.map(r => ({ nom: dernierNom(r.chemin), chemin: r.chemin })) }, score: 0, hypothèses: racineChamps.map(r => `« ${jetons[r.k].brut} » → ${texteChemin(r.chemin)}.`) }], raisons, hypothèses, indices, nonInterprétés: [] }
    }
  }

  hypothèses.push(choix.raisons.length ? `Collection : ${nomCollection(col)} (« ${choix.raisons[0]} », ${col.nombre} élément${col.nombre > 1 ? 's' : ''}).` : `Collection : ${nomCollection(col)} (${col.nombre} éléments), la plus probable.`)
  const nomCol = singulier(compact(dernierNom(col.chemin)))
  for (let k = 0; k < jetons.length; k++) {
    const cibles = COLLECTIONS[jetons[k].sing] || COLLECTIONS[jetons[k].norm] || []
    if (jetons[k].sing === nomCol || cibles.some(x => singulier(x) === nomCol) || (col.alias || []).some(a => singulier(compact(a)) === jetons[k].sing)) marquer(k)
    // Tableau racine : le nom commun désigne les éléments (« les utilisateurs »).
    else if (col.chemin.length === 1 && cibles.length && !choix.raisons.length) marquer(k)
    if (['ec2', 'ebs', 'kubernetes', 'k8s', 'aws', 'kubectl'].includes(jetons[k].norm)) marquer(k)
  }

  const index = indexValeurs(col)
  const conds = []
  const projections = []
  let tri = null, tranche = null, premier = false, agrégat = null, groupe = null

  // 4a. Comparaisons numériques / dates
  for (let k = 0; k < jetons.length; k++) {
    if (utilisés.has(k)) continue
    let op = null, n = 0
    for (const o of OPS_TEXTE) { n = expressionÀ(jetons, k, o.mots); if (n) { op = o.op; break } }
    let date = false
    if (!op) for (const o of OPS_DATE) { n = expressionÀ(jetons, k, o.mots); if (n && /^\d{4}-\d{2}(-\d{2})?/.test(jetons[k + n]?.brut || '')) { op = o.op; date = true; break } n = 0 }
    if (!op) continue
    const jv = jetons[k + n]
    const v = date ? jv.brut : nombreDe(jv)
    if (v === null || v === undefined) continue
    // Champ : mot avant l'opérateur, unité après le nombre, ou adjectif (« older than »).
    let champ = null
    let concept = unitéCollée(jv) || UNITÉS[jetons[k + n + 1]?.norm] || (jetons[k].norm === 'older' || jetons[k].norm === 'younger' ? 'age' : null) || (date ? 'date' : null)
    for (let b = k - 1; b >= Math.max(0, k - 4) && !concept; b--) {
      const c = conceptDe(jetons, b)
      if (c) { concept = c.concept; marquer(b, c.longueur); break }
      const exact = col.champs.find(ch => ch.feuille && compact(ch.nom || '') === compact(jetons[b].norm) && jetons[b].norm.length > 1)
      if (exact) { champ = exact; marquer(b); break }
    }
    if (!champ && concept) champ = meilleurChamp(col, { concept })?.champ
    if (!champ) {
      const numériques = col.champs.filter(ch => ch.feuille && !ch.multi && ch.types?.number && !/id$/i.test(ch.nom || ''))
      if (numériques.length === 1 && !date) { champ = numériques[0]; hypothèses.push(`Comparaison sans champ précisé : ${texteRef(champ)} est le seul champ numérique.`) }
      else { raisons.push(`« ${jetons.slice(k, k + n + 1).map(j => j.brut).join(' ')} » : je ne sais pas sur quel champ comparer (${numériques.length} champs numériques). Précisez-le (ex. « taille supérieure à 100 »).`); marquer(k, n + 1); continue }
    }
    if (jetons[k + n + 1] && UNITÉS[jetons[k + n + 1].norm]) marquer(k + n + 1)
    marquer(k, n + 1)
    conds.push({ type: 'cmp', champ: refChamp(champ), op, valeur: v })
    indices.champs.push(champ.nom)
    hypothèses.push(`« ${jetons.slice(k, k + n + 1).map(j => j.brut).join(' ')} » → ${texteRef(champ)} ${op} ${JSON.stringify(v)}.`)
  }

  // 4b. Opérations sur le texte (contient, commence par, finit par)
  for (let k = 0; k < jetons.length; k++) {
    if (utilisés.has(k)) continue
    let type = null, n = 0
    for (const o of TEXTE_OPS) { n = expressionÀ(jetons, k, o.mots); if (n) { type = o.type; break } }
    if (!type || !jetons[k + n]) continue
    const jv = jetons[k + n]
    let champ = null
    for (let b = k - 1; b >= Math.max(0, k - 4); b--) {
      const c = conceptDe(jetons, b)
      if (c) { champ = meilleurChamp(col, { concept: c.concept })?.champ; marquer(b, c.longueur); break }
      const exact = col.champs.find(ch => ch.feuille && compact(ch.nom || '') === compact(jetons[b].norm))
      if (exact) { champ = exact; marquer(b); break }
    }
    if (!champ) { champ = meilleurChamp(col, { concept: 'name' })?.champ; if (champ) hypothèses.push(`Texte recherché dans ${texteRef(champ)} (champ « nom » par défaut).`) }
    if (!champ) continue
    marquer(k, n + 1)
    conds.push({ type, champ: refChamp(champ), valeur: jv.brut })
    hypothèses.push(`« ${jetons.slice(k, k + n + 1).map(j => j.brut).join(' ')} » → ${texteRef(champ)} ${type === 'contient' ? 'contient' : type === 'commence' ? 'commence par' : 'finit par'} ${JSON.stringify(jv.brut)} (sensible à la casse).`)
  }

  // 4c. Tri, limite, regroupement, agrégats (repérage des mots)
  const tTri = chercherExpression(jetons.map((j, i) => (utilisés.has(i) ? { ...j, norm: '\u0000' } : j)), MOTS_TRI)
  const desc = !!chercherExpression(jetons, MOTS_DESC)
  if (tTri) {
    marquer(tTri.k, tTri.n)
    const c = conceptDe(jetons, tTri.k + tTri.n)
    let champ
    if (c) { champ = meilleurChamp(col, { concept: c.concept })?.champ; marquer(tTri.k + tTri.n, c.longueur) } else {
      const j = jetons[tTri.k + tTri.n]
      champ = j && col.champs.find(ch => ch.feuille && compact(ch.nom || '') === compact(j.norm))
      if (champ) marquer(tTri.k + tTri.n)
      else if (j && ['alphabetique', 'alphabetical'].includes(j.norm)) { champ = meilleurChamp(col, { concept: 'name' })?.champ; marquer(tTri.k + tTri.n) }
    }
    if (champ) { tri = { champ: refChamp(champ), desc }; hypothèses.push(`Tri par ${texteRef(champ)}${desc ? ' (décroissant)' : ''}.`) } else raisons.push('Tri demandé, mais le champ de tri n\'a pas été reconnu.')
  }
  const exprDesc = chercherExpression(jetons, MOTS_DESC)
  if (exprDesc) marquer(exprDesc.k, exprDesc.n)
  const exprAsc = chercherExpression(jetons, MOTS_ASC)
  if (exprAsc) { marquer(exprAsc.k, exprAsc.n); if (!tri && ['alphabetique', 'alphabetical'].includes(jetons[exprAsc.k].norm)) { const ch = meilleurChamp(col, { concept: 'name' })?.champ; if (ch) { tri = { champ: refChamp(ch), desc: false }; hypothèses.push(`Ordre alphabétique : tri par ${texteRef(ch)}.`) } } }

  // Limite : « les 3 premiers », « top 5 », « first 10 », « le premier ».
  for (let k = 0; k < jetons.length; k++) {
    const j = jetons[k], s = jetons[k + 1]
    const premiers = ['premier', 'premiers', 'premiere', 'premieres', 'first']
    if (nombreDe(j) && s && !utilisés.has(k) && (expressionÀ(jetons, k + 1, MOTS_MAX) || expressionÀ(jetons, k + 1, MOTS_MIN))) { tranche = { début: 0, fin: nombreDe(j) }; marquer(k) } else if (j.norm === 'top' && nombreDe(s)) { tranche = { début: 0, fin: nombreDe(s) }; marquer(k, 2) } else if (nombreDe(j) && s && premiers.includes(s.norm)) { tranche = { début: 0, fin: nombreDe(j) }; marquer(k, 2) } else if (premiers.includes(j.norm) && nombreDe(s) && !utilisés.has(k + 1)) { tranche = { début: 0, fin: nombreDe(s) }; marquer(k, 2) } else if (nombreDe(j) && s && ['derniers', 'dernieres', 'last'].includes(s.norm)) { tranche = { début: -nombreDe(j) }; marquer(k, 2) } else if (premiers.includes(j.norm) && !utilisés.has(k)) { premier = true; marquer(k) }
  }
  if (tranche) { indices.limite = true; hypothèses.push(tranche.début < 0 ? `Les ${-tranche.début} derniers éléments.` : `Les ${tranche.fin} premiers éléments${tri ? ' après le tri' : ' dans l\'ordre du JSON'}.`) }

  // Agrégats
  const tSomme = chercherExpression(jetons, MOTS_SOMME)
  const tMoy = chercherExpression(jetons, MOTS_MOYENNE)
  const tMax = chercherExpression(jetons.map((j, i) => (utilisés.has(i) ? { ...j, norm: '\u0000' } : j)), MOTS_MAX)
  const tMin = chercherExpression(jetons.map((j, i) => (utilisés.has(i) ? { ...j, norm: '\u0000' } : j)), MOTS_MIN)
  const tDistinct = chercherExpression(jetons, MOTS_DISTINCT)
  const tJoindre = chercherExpression(jetons, MOTS_JOINDRE)
  const nombreTotal = chercherExpression(jetons, ['nombre total', 'total number', 'total count', 'nombre', 'number of', 'how many', 'combien', 'count', 'compter', 'compte'])
  if (tJoindre) marquer(tJoindre.k, tJoindre.n)
  if (tDistinct) marquer(tDistinct.k, tDistinct.n)

  // Champ associé à un mot d'agrégat : concept juste avant ou juste après.
  const champPrès = (t, adj = false) => {
    for (const d of [t.n, t.n + 1, t.n + 2, -1, -2]) {
      const k = d > 0 ? t.k + d - (d > t.n ? 0 : 0) : t.k + d
      const c = conceptDe(jetons, k)
      if (c && !utilisés.has(k)) { const ch = meilleurChamp(col, { concept: c.concept })?.champ; if (ch) { marquer(k, c.longueur); return ch } }
      const j = jetons[k]
      if (j && !utilisés.has(k)) { const ex = col.champs.find(ch => ch.feuille && compact(ch.nom || '') === compact(j.norm) && j.norm.length > 1); if (ex) { marquer(k); return ex } }
      if (adj && j && ADJ_TAILLE[j.norm]) { const ch = meilleurChamp(col, { concept: ADJ_TAILLE[j.norm] })?.champ; if (ch) return ch }
    }
    return null
  }

  // Regroupement « par X » / « by X » avec un comptage ou un agrégat.
  const aAgrégat = opCompter || tSomme || tMoy
  if (aAgrégat) {
    for (let k = 0; k < jetons.length; k++) {
      const n = expressionÀ(jetons, k, MOTS_GROUPE)
      if (!n || utilisés.has(k)) continue
      const c = conceptDe(jetons, k + n)
      let champ = c ? meilleurChamp(col, { concept: c.concept })?.champ : null
      const j = jetons[k + n]
      if (!champ && j) champ = col.champs.find(ch => ch.feuille && compact(ch.nom || '') === compact(j.norm) && j.norm.length > 1)
      if (!champ && j && jetons[k + n + 1]) { const c2 = conceptDe(jetons, k + n + 1); if (c2 && ['instance', 'volume'].includes(j.sing)) champ = meilleurChamp(col, { concept: c2.concept })?.champ }
      if (!champ) continue
      marquer(k, n + (c ? c.longueur : 1))
      if (jetons[k + n + 1] && conceptDe(jetons, k + n + 1) && !c) marquer(k + n + 1)
      groupe = { champ: refChamp(champ), mesure: { op: 'nombre' }, forme: 'objet' }
      hypothèses.push(`Regroupement par ${texteRef(champ)} : un objet { valeur: mesure }.`)
      break
    }
  }

  if (tSomme && !(nombreTotal && jetons[nombreTotal.k].norm === 'nombre' && tSomme.k === nombreTotal.k + 1)) {
    marquer(tSomme.k, tSomme.n)
    const ch = champPrès(tSomme)
    if (ch) agrégat = { op: 'somme', champ: refChamp(ch) }
    else if (!opCompter) raisons.push('Somme demandée, mais le champ à additionner n\'a pas été reconnu.')
  }
  if (tMoy) {
    marquer(tMoy.k, tMoy.n)
    const ch = champPrès(tMoy)
    if (ch) agrégat = { op: 'moyenne', champ: refChamp(ch) }
    else raisons.push('Moyenne demandée, mais le champ n\'a pas été reconnu.')
  }
  for (const [t, op] of [[tMax, 'max'], [tMin, 'min']]) {
    if (!t || agrégat || tri || utilisés.has(t.k)) continue
    // « le plus gros volume » (élément) ou « la taille maximale » (valeur).
    const mot = jetons[t.k + t.n - 1]?.norm
    const ch = champPrès(t, true) || (ADJ_TAILLE[mot] ? meilleurChamp(col, { concept: ADJ_TAILLE[mot] })?.champ : null)
    if (!ch) continue
    marquer(t.k, t.n)
    const élément = jetons.slice(t.k, t.k + t.n + 3).some(j => utilisés.has(j.i) && (COLLECTIONS[j.sing] || singulier(compact(dernierNom(col.chemin))) === j.sing)) || ADJ_TAILLE[mot]
    const versDate = ADJ_TAILLE[mot] === 'date'
    const opFinal = versDate ? (/(ancien|oldest|earliest)/.test(mot) ? 'min' : 'max') : op
    if (élément || tranche) {
      if (tranche) tri = { champ: refChamp(ch), desc: opFinal === 'max' }
      else agrégat = { op: opFinal === 'max' ? 'maxPar' : 'minPar', champ: refChamp(ch) }
    } else agrégat = { op: opFinal, champ: refChamp(ch) }
    hypothèses.push(élément || tranche ? `${opFinal === 'max' ? 'Plus grande' : 'Plus petite'} valeur de ${texteRef(ch)} : ${tranche ? 'tri puis limite' : 'élément correspondant'}.` : `${opFinal === 'max' ? 'Maximum' : 'Minimum'} de ${texteRef(ch)}.`)
  }
  if (groupe && agrégat && ['somme', 'moyenne', 'min', 'max'].includes(agrégat.op)) { groupe.mesure = { op: agrégat.op, champ: agrégat.champ }; agrégat = null }
  if (opCompter && !groupe && !agrégat) { agrégat = { op: 'nombre' }; indices.opération = 'nombre' }
  if (opCompter) for (let k = 0; k < jetons.length; k++) { const n = expressionÀ(jetons, k, MOTS_COMPTER); if (n) marquer(k, n) }
  if (agrégat) indices.opération = agrégat.op

  // 4d. Valeurs nommées (filtres d'égalité), négations, booléens, existence.
  const parChamp = new Map()
  for (let k = 0; k < jetons.length; k++) {
    if (utilisés.has(k)) continue
    const j = jetons[k]
    const négation = k > 0 && (NÉGATIONS.has(jetons[k - 1].norm) || (jetons[k - 1].norm === 'que' && ['autre', 'autres'].includes(jetons[k - 2]?.norm)) || (jetons[k - 1].norm === 'than' && jetons[k - 2]?.norm === 'other'))
    if (!j.cité && VIDES.has(j.norm)) continue
    // Valeur telle quelle, ou traduite du français.
    let occ = index.get(j.norm)
    let traduction = null
    if (!occ && !j.cité) {
      for (const v of VALEURS_FR[j.norm] || VALEURS_FR[`${j.norm}-${jetons[k + 1]?.norm}`] || []) { if (index.has(v)) { occ = index.get(v); traduction = v; break } }
      if (!occ && jetons[k + 1]) {
        const composé = `${j.norm}-${jetons[k + 1].norm}`
        if (index.has(composé)) { occ = index.get(composé); marquer(k + 1) }
        const fr = VALEURS_FR[`${j.norm}-${jetons[k + 1].norm}`] || VALEURS_FR[`${j.norm}-${jetons[k + 1].norm}-${jetons[k + 2]?.norm}`]
        if (!occ && fr) for (const v of fr) if (index.has(v)) { occ = index.get(v); traduction = v; marquer(k + 1); break }
      }
    }
    if (occ) {
      const conceptProche = conceptDe(jetons, k - 1)?.concept || conceptDe(jetons, k - 2)?.concept || conceptDe(jetons, k + 1)?.concept
      const o = choisirValeur(occ, conceptProche)
      marquer(k)
      if (négation) marquer(k - 1)
      // « en état running », « namespace kube-system », « running state » : le nom du champ fait partie du filtre.
      for (const b of [k - 1, k - 2, k + 1]) {
        const c = conceptDe(jetons, b)
        const exact = jetons[b] && !jetons[b].cité && compact(o.champ.nom || '') === compact(jetons[b].norm)
        if ((c && scoreChamp(o.champ, { concept: c.concept }) > 0) || exact) { if (!utilisés.has(b)) marquer(b, c ? c.longueur : 1); break }
        if (jetons[b] && !VIDES.has(jetons[b].norm)) break
      }
      const clé = JSON.stringify(refChamp(o.champ))
      if (!parChamp.has(clé)) parChamp.set(clé, { champ: o.champ, valeurs: [], négation })
      parChamp.get(clé).valeurs.push(o.valeur)
      indices.valeurs.push(o.valeur)
      hypothèses.push(`« ${j.brut} »${traduction ? ` (${traduction})` : ''} → ${texteRef(o.champ)} ${négation ? '≠' : '='} ${JSON.stringify(o.valeur)} (${o.n} élément${o.n > 1 ? 's' : ''}).`)
      continue
    }
    // Mot d'état connu mais absent des données : filtre sur le champ d'état (résultat vide).
    const étatConnu = MOTS_ÉTAT.has(j.norm) ? j.norm : (VALEURS_FR[j.norm] || []).find(v => MOTS_ÉTAT.has(v))
    if (étatConnu && !j.cité) {
      const champÉtat = meilleurChamp(col, { concept: 'state' })
      const champ = champÉtat?.champ
      if (champ && champ.types?.string && [...(champ.valeurs?.values() || [])].some(x => MOTS_ÉTAT.has(normaliser(x.valeur)))) {
        const exemple = [...champ.valeurs.values()][0].valeur
        const valeur = /^[A-Z]/.test(exemple) ? étatConnu[0].toUpperCase() + étatConnu.slice(1) : étatConnu
        marquer(k)
        if (négation) marquer(k - 1)
        const clé = JSON.stringify(refChamp(champ))
        if (!parChamp.has(clé)) parChamp.set(clé, { champ, valeurs: [], négation })
        parChamp.get(clé).valeurs.push(valeur)
        hypothèses.push(`« ${j.brut} » → ${texteRef(champ)} ${négation ? '≠' : '='} ${JSON.stringify(valeur)} : aucune valeur de ce JSON ne correspond, le résultat sera vide.`)
        continue
      }
    }
    // Champ booléen nommé comme adjectif : « actifs », « chiffrés », « encrypted », « unencrypted ».
    let mot = j.norm, inverse = false
    if (/^(un|non-|in|dis)/.test(mot) && !CONCEPTS[mot]) { const base = mot.replace(/^(un|non-|dis)/, '').replace(/^in(?=act)/, ''); if (CONCEPTS[base] && ['encrypted', 'active', 'ready'].includes(CONCEPTS[base])) { mot = base; inverse = true } }
    const concept = CONCEPTS[mot] || CONCEPTS[singulier(mot)]
    // Champ booléen désigné par son nom : « obligatoires » → obligatoire == true.
    const booléenNommé = !concept && col.champs.find(ch => ch.feuille && ch.types?.boolean && !ch.types.string && [compact(j.norm), compact(j.sing)].includes(compact(ch.nom || '')))
    if (booléenNommé) {
      marquer(k)
      if (négation) marquer(k - 1)
      conds.push({ type: 'cmp', champ: refChamp(booléenNommé), op: '==', valeur: !négation })
      hypothèses.push(`« ${négation ? `${jetons[k - 1].brut} ` : ''}${j.brut} » → ${texteRef(booléenNommé)} = ${!négation}.`)
      continue
    }
    if (concept && ['encrypted', 'active', 'ready'].includes(concept)) {
      const champ = col.champs.find(ch => ch.feuille && ch.types?.boolean && scoreChamp(ch, { concept }) >= 0.8)
      if (champ) {
        marquer(k)
        if (négation) marquer(k - 1)
        const v = !(négation !== inverse)
        conds.push({ type: 'cmp', champ: refChamp(champ), op: '==', valeur: v })
        hypothèses.push(`« ${négation ? `${jetons[k - 1].brut} ` : ''}${j.brut} » → ${texteRef(champ)} = ${v}.`)
        continue
      }
    }
  }
  for (const { champ, valeurs, négation } of parChamp.values()) {
    const ref = refChamp(champ)
    if (valeurs.length === 1) conds.push(négation ? { type: 'cmp', champ: ref, op: '!=', valeur: valeurs[0] } : { type: 'cmp', champ: ref, op: '==', valeur: valeurs[0] })
    else conds.push(négation ? { type: 'et', conds: valeurs.map(v => ({ type: 'cmp', champ: ref, op: '!=', valeur: v })) } : { type: 'dans', champ: ref, valeurs })
  }

  // Existence : « avec une IP publique », « sans email », « with a public IP ».
  for (let k = 0; k < jetons.length - 1; k++) {
    const j = jetons[k], s = jetons[k + 1]
    const avec = ['avec', 'ayant', 'with', 'having'].includes(j.norm) && ['un', 'une', 'a', 'an', 'des'].includes(s.norm)
    const sans = ['sans', 'without'].includes(j.norm)
    if (!avec && !sans) continue
    const pos = avec ? k + 2 : k + 1
    const c = conceptDe(jetons, pos)
    if (!c) continue
    const adjectifs = jetons.slice(pos, pos + c.longueur + 2).map(x => (VALEURS_FR[x.norm] || [x.norm])[0]).filter(x => x === 'public' || x === 'private')
    const m = meilleurChamp(col, { concept: c.concept, adjectifs })
    if (!m) continue
    marquer(k, pos - k + c.longueur)
    for (let a = pos + c.longueur; a < pos + c.longueur + 2; a++) if (jetons[a] && adjectifs.includes((VALEURS_FR[jetons[a].norm] || [jetons[a].norm])[0])) marquer(a)
    conds.push({ type: sans ? 'absent' : 'existe', champ: refChamp(m.champ) })
    hypothèses.push(`« ${jetons.slice(k, pos + c.longueur).map(x => x.brut).join(' ')} » → ${texteRef(m.champ)} ${sans ? 'absent ou null' : 'renseigné'}.`)
  }

  // 4e. Champs à projeter : « tag Name », concepts restants et noms de champs exacts.
  for (let k = 0; k < jetons.length - 1; k++) {
    if (utilisés.has(k) || !['tag', 'tags', 'etiquette', 'label'].includes(jetons[k].norm)) continue
    const champTag = col.champs.find(ch => ch.tag && normaliser(ch.tag.clé) === jetons[k + 1].norm)
    if (!champTag) continue
    marquer(k, 2)
    if (!projections.some(p => p.champ === champTag)) projections.push({ champ: champTag, nom: champTag.tag.clé.toLowerCase() === 'name' ? 'name' : champTag.tag.clé, mot: `tag ${champTag.tag.clé}` })
    hypothèses.push(`« ${jetons[k].brut} ${jetons[k + 1].brut} » → étiquette ${champTag.tag.clé}.`)
  }
  for (let k = 0; k < jetons.length; k++) {
    if (utilisés.has(k)) continue
    const j = jetons[k]
    if (VIDES.has(j.norm) && !CONCEPTS[j.norm]) continue
    const exact = !j.cité && col.champs.find(ch => (ch.feuille || ch.multi) && (compact(ch.nom || '') === compact(j.brut) || (ch.texte && compact(ch.texte) === compact(j.brut))) && j.norm.length > 1)
    const c = conceptDe(jetons, k)
    if (!exact && !c) continue
    const adjectifs = jetons.slice(k, k + 3).map(x => (VALEURS_FR[x.norm] || [x.norm])[0]).filter(x => x === 'public' || x === 'private')
    const m = exact ? { champ: exact, alternatives: [] } : meilleurChamp(col, { concept: c.concept, adjectifs })
    if (!m) {
      raisons.push(`Aucun champ ne correspond à « ${j.brut} » dans ${nomCollection(col)}. Champs disponibles : ${col.champs.filter(ch => ch.feuille).slice(0, 12).map(ch => ch.texte).join(', ')}.`)
      marquer(k, c?.longueur || 1)
      continue
    }
    marquer(k, exact ? 1 : c.longueur)
    for (let a = k + (exact ? 1 : c.longueur); a < k + 3; a++) if (jetons[a] && adjectifs.includes((VALEURS_FR[jetons[a].norm] || [jetons[a].norm])[0])) marquer(a)
    if (projections.some(p => JSON.stringify(refChamp(p.champ)) === JSON.stringify(refChamp(m.champ)))) continue
    const nom = exact ? (exact.tag ? exact.tag.clé : exact.nom) : CLÉ_SORTIE[c.concept] || c.concept
    projections.push({ champ: m.champ, nom, mot: j.brut })
    indices.champs.push(m.champ.nom || nom)
    hypothèses.push(`« ${j.brut} » → ${texteRef(m.champ)}${m.alternatives?.length ? ` (autres possibles : ${m.alternatives.map(texteRef).join(', ')})` : ''}.`)
  }

  // Un champ conteneur (spec.containers) suivi d'un champ qu'il contient : seul le second compte.
  for (let i = projections.length - 1; i >= 0; i--) {
    const a = projections[i].champ
    if (a.tag) continue
    if (projections.some((p, j) => j !== i && !p.champ.tag && p.champ.chemin.length > a.chemin.length && a.chemin.every((x, n) => x === p.champ.chemin[n]))) projections.splice(i, 1)
  }
  // « les utilisateurs actifs et leurs emails » : on garde aussi de quoi les reconnaître.
  const possessif = jetons.some(j => ['leur', 'leurs', 'their', 'its', 'ses', 'son', 'sa'].includes(j.norm))
  if (possessif && projections.length && !agrégat && !groupe && !projections.some(p => ['id', 'name'].includes(p.nom))) {
    const ident = meilleurChamp(col, { concept: 'name' }) || meilleurChamp(col, { concept: 'id' })
    if (ident && ident.score >= 0.8 && !projections.some(p => p.champ === ident.champ)) {
      projections.unshift({ champ: ident.champ, nom: scoreChamp(ident.champ, { concept: 'name' }) >= 0.8 ? 'name' : 'id', mot: '(identification)' })
      hypothèses.push(`« leur(s) » : ${texteRef(ident.champ)} est ajouté pour reconnaître chaque élément.`)
    }
  }

  // Mots non interprétés (transparence).
  const nonInterprétés = jetons.filter((j, k) => !utilisés.has(k) && !VIDES.has(j.norm) && !NÉGATIONS.has(j.norm) && !/^\d+$/.test(j.norm) && !MOTS_GROUPE.includes(j.norm) && j.norm.length > 1 && !['ou', 'et', 'or', 'and', 'puis', 'then', 'leur', 'their', 'etat', 'en'].includes(j.norm)).map(j => j.brut)

  // 5. Plan
  const plan = { type: 'collection', source: col.chemin }
  if (conds.length === 1) plan.filtre = conds[0]
  else if (conds.length > 1) plan.filtre = { type: 'et', conds }
  if (groupe) {
    plan.groupe = groupe
    if (groupe.mesure.op === 'nombre' && projections.length) {
      // « nombre de pods par phase » : le champ de projection éventuel est ignoré.
    }
  } else if (agrégat) {
    plan.agrégat = agrégat
    if ((agrégat.op === 'maxPar' || agrégat.op === 'minPar') && projections.length) plan.projection = projectionDe(projections)
    if (agrégat.op === 'nombre' && projections.length) hypothèses.push(`Comptage : les champs ${projections.map(p => p.mot).join(', ')} ne changent pas le nombre.`)
  } else {
    if (tJoindre) {
      const p = projections[0] || { champ: meilleurChamp(col, { concept: 'name' })?.champ }
      if (p.champ) { plan.agrégat = { op: 'joindre', champ: refChamp(p.champ), séparateur: ', ' }; hypothèses.push('Valeurs jointes par « , ».') }
    } else {
      if (projections.length) plan.projection = projectionDe(projections)
      if (projections.length === 1 && plan.projection.type !== 'objet') {
        const nuls = col.éléments.some(e => { const v = lire(e, projections[0].champ.chemin || []); return v === null || v === undefined })
        if (nuls && !projections[0].champ.tag) { plan.ignorerNull = true; hypothèses.push(`Les éléments sans ${texteRef(projections[0].champ)} sont ignorés.`) }
        if (projections[0].champ.tag) plan.ignorerNull = true
      }
      if (tri) plan.tri = tri
      if (tranche) plan.tranche = tranche
      if (premier && !tranche) plan.premier = true
      if (tDistinct) {
        if (plan.projection && plan.projection.type !== 'objet') { plan.unique = true; hypothèses.push('Valeurs distinctes, triées (comme unique de jq).') } else raisons.push('« distinct » demande un seul champ à dédoublonner.')
      }
      if (!projections.length && !plan.filtre && !tri && !tranche && !premier) hypothèses.push('Aucun champ précis demandé : éléments complets.')
    }
  }

  // Champ demandé introuvable : on ne propose pas de requête approximative.
  if (raisons.some(r => r.startsWith('Aucun champ')) && !projections.length) return { langue, plans: [], raisons, hypothèses, indices, nonInterprétés }
  if (raisons.length && !conds.length && !projections.length && !agrégat && !groupe) return { langue, plans: [], raisons, hypothèses, indices, nonInterprétés }

  try {
    const r = évaluer(plan, racine)
    if (Array.isArray(r) && !r.length) hypothèses.push('Résultat vide : aucun élément ne vérifie ces conditions dans ce JSON.')
  } catch (e) {
    raisons.push(`Interprétation impossible à évaluer : ${e.message}`)
    return { langue, plans: [], raisons, hypothèses, indices, nonInterprétés }
  }
  if (nonInterprétés.length) hypothèses.push(`Mots non utilisés : ${nonInterprétés.join(', ')}.`)
  return { langue, plans: [{ plan, score: 0, hypothèses }], raisons, hypothèses, indices, nonInterprétés }
}

function projectionDe(projections) {
  const valeur = p => (p.champ.tag ? { type: 'tag', tag: p.champ.tag } : { type: 'champ', chemin: p.champ.chemin })
  if (projections.length === 1) return valeur(projections[0])
  const noms = new Set()
  return {
    type: 'objet',
    champs: projections.map(p => {
      let nom = p.nom
      let i = 2
      while (noms.has(nom)) nom = `${p.nom}${i++}`
      noms.add(nom)
      return { nom, valeur: valeur(p) }
    }),
  }
}

// Distance d'édition (suggestions de clés proches).
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

export const détecterLangue = description => préparer(description || '').langue
