// Objectifs d'examen (certifications, examen civique) : domaines pondérés,
// plan de révision jusqu'à la date, maîtrise et estimation « prêt vers le… ».
// Pourcentages des guides officiels au moment de l'écriture : ils changent,
// d'où la mention « à vérifier » dans l'interface.

export const PRÉSETS = [
  {
    id: 'civique', nom: '🇫🇷 Examen civique (naturalisation)', questions: 40, minutes: 45, seuil: 0.8,
    note: 'Format annoncé : 40 questions en 45 min, 80 % pour réussir. Répartition des thèmes approximative. À vérifier sur le site officiel.',
    domaines: [
      { nom: 'Principes et valeurs', poids: 16, modèles: ['nat-valeurs'] },
      { nom: 'Institutions', poids: 14, modèles: ['nat-institutions'] },
      { nom: 'Droits et devoirs', poids: 14, modèles: ['nat-droits'] },
      { nom: 'Histoire, géographie, culture', poids: 26, modèles: ['nat-histoire', 'nat-geo'] },
      { nom: 'Mises en situation', poids: 30, modèles: ['nat-situations'] },
    ],
  },
  {
    id: 'cka', nom: '☸️ CKA (Kubernetes Administrator)', questions: 20, minutes: 40, seuil: 0.66,
    note: 'Le vrai CKA est pratique (tâches en ligne de commande, 2 h, 66 %) : entraîne-toi aussi avec 🧪 Labo chrono.',
    domaines: [
      { nom: 'Dépannage', poids: 30, modèles: ['pannes-k8s'] },
      { nom: 'Architecture, installation, configuration', poids: 25, modèles: ['labos-cka'] },
      { nom: 'Services et réseau', poids: 20, modèles: [] },
      { nom: 'Workloads et planification', poids: 15, modèles: ['kubectl'] },
      { nom: 'Stockage', poids: 10, modèles: [] },
    ],
  },
  {
    id: 'ckad', nom: '☸️ CKAD (Kubernetes Developer)', questions: 20, minutes: 40, seuil: 0.66,
    note: 'Examen pratique (2 h, 66 %) : combine QCM et 🧪 Labo chrono.',
    domaines: [
      { nom: 'Conception et build', poids: 20, modèles: ['docker'] },
      { nom: 'Déploiement', poids: 20, modèles: ['kubectl', 'helm'] },
      { nom: 'Observabilité et maintenance', poids: 15, modèles: ['pannes-k8s'] },
      { nom: 'Environnement, configuration, sécurité', poids: 25, modèles: ['labos-cka'] },
      { nom: 'Services et réseau', poids: 20, modèles: [] },
    ],
  },
  {
    id: 'aws-saa', nom: '☁️ AWS Solutions Architect Associate', questions: 65, minutes: 130, seuil: 0.72,
    note: '65 questions, 130 min, score de 720/1000.',
    domaines: [
      { nom: 'Architectures sécurisées', poids: 30, modèles: [] },
      { nom: 'Architectures résilientes', poids: 26, modèles: [] },
      { nom: 'Architectures performantes', poids: 24, modèles: [] },
      { nom: 'Architectures optimisées en coûts', poids: 20, modèles: [] },
    ],
  },
  {
    id: 'terraform', nom: '🏗️ Terraform Associate', questions: 57, minutes: 60, seuil: 0.7,
    note: 'Environ 57 questions en 1 h ; le seuil n\'est pas publié (70 % ici).',
    domaines: [
      { nom: 'Concepts IaC et Terraform', poids: 20, modèles: [] },
      { nom: 'Workflow (init, plan, apply)', poids: 25, modèles: ['terraform'] },
      { nom: 'State', poids: 20, modèles: [] },
      { nom: 'Modules et configuration', poids: 20, modèles: [] },
      { nom: 'HCP Terraform', poids: 15, modèles: [] },
    ],
  },
  {
    id: 'az-104', nom: '🔷 Azure Administrator (AZ-104)', questions: 50, minutes: 100, seuil: 0.7,
    note: 'Environ 40 à 60 questions, score de 700/1000.',
    domaines: [
      { nom: 'Identités et gouvernance', poids: 22, modèles: [] },
      { nom: 'Stockage', poids: 18, modèles: [] },
      { nom: 'Calcul', poids: 23, modèles: ['docker'] },
      { nom: 'Réseau virtuel', poids: 18, modèles: [] },
      { nom: 'Supervision et maintenance', poids: 13, modèles: [] },
    ],
  },
  { id: 'libre', nom: '✏️ Autre examen (mes domaines)', questions: 20, minutes: 30, seuil: 0.7, note: '', domaines: [] },
]

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const aujourdhui = () => iso(new Date())
const jour = s => new Date(`${s}T12:00:00`)
export const joursAvant = (date, depuis = aujourdhui()) => Math.round((jour(date) - jour(depuis)) / 86400000)
export const compteÀRebours = date => { const j = joursAvant(date); return j > 1 ? `J-${j}` : j === 1 ? 'demain' : j === 0 ? 'aujourd\'hui' : 'passé' }
const plus = (s, n) => { const d = jour(s); d.setDate(d.getDate() + n); return iso(d) }

// Nouvel objectif : les domaines sont reliés aux paquets prêts déjà ajoutés.
export function créerObjectif(préset, date, paquets) {
  return {
    id: uid(), préset: préset.id, nom: préset.nom.replace(/^\S+\s/, ''), date,
    questions: préset.questions, minutes: préset.minutes, seuil: préset.seuil,
    domaines: préset.domaines.map(d => ({ nom: d.nom, poids: d.poids, paquetIds: paquets.filter(p => d.modèles.includes(p.modèle)).map(p => p.id) })),
  }
}

// Plan semaine par semaine : les domaines les plus lourds d'abord, la
// dernière semaine pour les examens blancs et le carnet d'erreurs.
export function planDeRévision(obj, depuis = aujourdhui()) {
  const jours = Math.max(1, joursAvant(obj.date, depuis))
  const semaines = Math.max(1, Math.ceil(jours / 7))
  const doms = [...obj.domaines].sort((a, b) => b.poids - a.poids)
  const nom = obj.nom
  const tâches = []
  const échéance = k => { const e = plus(depuis, Math.min(jours, 7 * k) - 1); return e > obj.date ? obj.date : e }
  const étude = semaines >= 2 ? semaines - 1 : semaines
  if (doms.length) {
    // Semaines par domaine selon le poids (au moins une si possible).
    const total = doms.reduce((t, d) => t + d.poids, 0) || 1
    let parts = doms.map(d => ({ d, n: (étude * d.poids) / total }))
    let attribuées = parts.map(p => ({ d: p.d, n: Math.floor(p.n), reste: p.n - Math.floor(p.n) }))
    let libres = étude - attribuées.reduce((t, p) => t + p.n, 0)
    attribuées.sort((a, b) => b.reste - a.reste).forEach(p => { if (libres > 0) { p.n += 1; libres -= 1 } })
    attribuées = doms.map(d => attribuées.find(p => p.d === d))
    if (étude >= doms.length) attribuées.forEach(p => { if (p.n === 0) { const plusGros = attribuées.reduce((a, b) => (b.n > a.n ? b : a)); plusGros.n -= 1; p.n = 1 } })
    // Domaines entrelacés (on revient régulièrement sur chacun), en
    // commençant par les plus lourds.
    let ordre = null
    if (étude >= doms.length) {
      ordre = []
      const crédit = attribuées.map(() => 0), reste = attribuées.map(p => p.n)
      for (let k = 0; k < étude; k++) {
        attribuées.forEach((p, i) => { if (reste[i] > 0) crédit[i] += p.n })
        let i = -1
        crédit.forEach((c, j) => { if (reste[j] > 0 && (i < 0 || c > crédit[i])) i = j })
        crédit[i] -= étude; reste[i] -= 1; ordre.push(attribuées[i].d.nom)
      }
    }
    for (let k = 1; k <= étude; k++) {
      const sujets = ordre ? [ordre[k - 1]] : doms.filter((_, i) => i % étude === k - 1).map(d => d.nom)
      tâches.push({ texte: `🎯 ${nom} · semaine ${k} : ${sujets.join(' + ')}`, échéance: échéance(k) })
    }
  } else {
    for (let k = 1; k <= étude; k++) tâches.push({ texte: `🎯 ${nom} · semaine ${k} : révision`, échéance: échéance(k) })
  }
  if (semaines >= 2) tâches.push({ texte: `🎯 ${nom} · dernière semaine : examens blancs + carnet d'erreurs`, échéance: plus(obj.date, -1) < depuis ? obj.date : plus(obj.date, -1) })
  tâches.push({ texte: `🎯 ${nom} : jour de l'examen`, échéance: obj.date })
  return tâches
}

// Maîtrise : cartes au niveau 3 ou plus (révisées avec succès plusieurs fois).
export const MAÎTRISE = 3
export function maîtrise(cartes, paquetIds) {
  const l = cartes.filter(c => paquetIds.includes(c.paquetId))
  return { total: l.length, maîtrisées: l.filter(c => (c.niveau || 0) >= MAÎTRISE).length, enCours: l.filter(c => (c.niveau || 0) > 0 && (c.niveau || 0) < MAÎTRISE).length }
}
export function préparation(obj, cartes) {
  let p = 0, poids = 0
  const détail = obj.domaines.map(d => {
    const m = maîtrise(cartes, d.paquetIds)
    if (m.total) { p += d.poids * (m.maîtrisées / m.total); poids += d.poids }
    return { ...d, ...m }
  })
  return { taux: poids ? p / poids : 0, couvert: poids / (obj.domaines.reduce((t, d) => t + d.poids, 0) || 1), détail }
}

// Estimation par la tendance des examens blancs de l'objectif.
export function estimation(obj, examens) {
  const l = (examens || []).filter(e => e.objectifId === obj.id && e.total).map(e => ({ x: joursAvant(e.date.slice(0, 10), '2000-01-01'), y: e.bonnes / e.total }))
  if (!l.length) return { texte: 'Passe un examen blanc pour avoir une estimation.' }
  const dernier = l[l.length - 1].y
  if (dernier >= obj.seuil) return { texte: 'Niveau atteint au dernier examen blanc 🎉', prêt: true }
  if (l.length < 2) return { texte: 'Passe un 2ᵉ examen blanc pour voir ta progression.' }
  const n = l.length, mx = l.reduce((t, p) => t + p.x, 0) / n, my = l.reduce((t, p) => t + p.y, 0) / n
  const den = l.reduce((t, p) => t + (p.x - mx) ** 2, 0)
  const pente = den ? l.reduce((t, p) => t + (p.x - mx) * (p.y - my), 0) / den : 0
  if (pente <= 0.0005) return { texte: 'Pas encore de progression nette : insiste sur le carnet d\'erreurs.' }
  const x = mx + (obj.seuil - my) / pente
  const date = plus('2000-01-01', Math.ceil(x))
  if (date <= aujourdhui()) return { texte: 'Tu progresses vite : repasse un examen blanc, tu es peut-être déjà prêt(e).' }
  const avant = date <= obj.date
  return { texte: `Au rythme actuel : prêt vers le ${jour(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}${avant ? ' ✓ avant l\'examen' : ' ⚠️ après la date de l\'examen'}`, date, avant }
}

// Questions d'un examen pondéré : nombre par domaine selon son poids.
export function répartition(obj, cartes, nombre) {
  const doms = obj.domaines.map(d => ({ ...d, pool: cartes.filter(c => d.paquetIds.includes(c.paquetId)) })).filter(d => d.pool.length)
  const total = doms.reduce((t, d) => t + d.poids, 0) || 1
  const voulu = Math.min(nombre, doms.reduce((t, d) => t + d.pool.length, 0))
  const parts = doms.map(d => ({ d, n: Math.min(d.pool.length, Math.round((voulu * d.poids) / total)) }))
  let manque = voulu - parts.reduce((t, p) => t + p.n, 0)
  while (manque !== 0) {
    const cand = parts.filter(p => (manque > 0 ? p.n < p.d.pool.length : p.n > 0)).sort((a, b) => (manque > 0 ? b.d.poids - a.d.poids : a.d.poids - b.d.poids))[0]
    if (!cand) break
    cand.n += manque > 0 ? 1 : -1; manque += manque > 0 ? -1 : 1
  }
  return parts.map(p => ({ domaine: p.d.nom, pool: p.d.pool, n: p.n }))
}

// Carnet d'erreurs : une erreur revient à J+1, puis J+3, puis J+7.
export const ÉTAPES_CARNET = [1, 3, 7]
export const entrerAuCarnet = c => ({ ...c, carnet: { étape: 0, prochaine: plus(aujourdhui(), 1) } })
export function avancerCarnet(c, su) {
  if (!c.carnet || c.carnet.prochaine > aujourdhui()) return c
  if (su === true) {
    const étape = c.carnet.étape + 1
    if (étape >= ÉTAPES_CARNET.length) { const { carnet, ...reste } = c; return { ...reste, carnetFini: aujourdhui() } }
    return { ...c, carnet: { étape, prochaine: plus(aujourdhui(), ÉTAPES_CARNET[étape]) } }
  }
  if (su === 'hésité') return { ...c, carnet: { ...c.carnet, prochaine: plus(aujourdhui(), 1) } }
  return entrerAuCarnet(c)
}
