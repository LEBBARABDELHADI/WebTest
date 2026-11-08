// Pilotage d'un foyer : priorités du jour, revues de la semaine, objectifs de
// l'année et dates importantes. Un fichier par foyer : pilotage-<foyer>.json.
//
// { jours: { 'AAAA-MM-JJ': { priorités: [{ id, texte, fait, tâche? }] } },
//   semaines: { '<lundi>': { priorités, bien, coincé, changer, humeur, terminée } },
//   objectifs: [{ id, année, emoji, titre, pourquoi, source, étapes: [{ id, trimestre, texte, fait, faitLe }] }],
//   échéances: [{ id, titre, date, type }] }
import { useMemo } from 'react'
import { useDonnéesSynchronisées } from './synchro'
import { aujourdhuiLocal, décaler, dateDe } from './habitudes'
import { préparation, maîtrise } from './certifications'
import { analyserAujourdhui } from './aujourdhui'

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const objet = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : {})
const liste = l => (Array.isArray(l) ? l : [])

export function compléterPilotage(o) {
  const d = objet(o)
  return { ...d, jours: objet(d.jours), semaines: objet(d.semaines), objectifs: liste(d.objectifs), échéances: liste(d.échéances) }
}

export function usePilotage(foyer) {
  const config = useMemo(() => ({ id: foyer.id, stockage: `react-blocs-pilotage-${foyer.id}`, chemin: `react-blocks/src/data/pilotage-${foyer.id}.json`, données: {} }), [foyer.id])
  return useDonnéesSynchronisées(config, compléterPilotage)
}

// Les jours de plus de 60 jours sont retirés (seules les semaines restent).
export function nettoyerJours(jours, auj = aujourdhuiLocal()) {
  const limite = décaler(auj, -60)
  return Object.fromEntries(Object.entries(jours).filter(([j]) => j >= limite))
}

// ---------- Dates ----------
export const lundiDe = jour => décaler(jour, -((dateDe(jour).getDay() + 6) % 7))
export const joursDeLaSemaine = lundi => Array.from({ length: 7 }, (_, i) => décaler(lundi, i))
export const trimestreDe = jour => Math.floor((dateDe(jour).getMonth()) / 3) + 1
export const joursRestants = (date, auj = aujourdhuiLocal()) => Math.round((dateDe(date) - dateDe(auj)) / 86400000)
export function compte(date, auj) {
  const j = joursRestants(date, auj)
  return j > 1 ? `J-${j}` : j === 1 ? 'demain' : j === 0 ? 'aujourd\'hui' : `il y a ${-j} j`
}
export const dateCourte = jour => dateDe(jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
export const dateLongue = jour => dateDe(jour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
// Part de l'année déjà écoulée (0 à 1).
export function partÉcoulée(année, auj = aujourdhuiLocal()) {
  const début = dateDe(`${année}-01-01`), fin = dateDe(`${année + 1}-01-01`)
  return Math.min(1, Math.max(0, (dateDe(auj) - début) / (fin - début)))
}

// ---------- Échéances ----------
export const TYPES_ÉCHÉANCE = {
  document: { emoji: '🪪', nom: 'Document qui expire' },
  rdv: { emoji: '🏛️', nom: 'Rendez-vous' },
  examen: { emoji: '🎯', nom: 'Examen' },
  autre: { emoji: '📌', nom: 'Autre' },
}
// Échéances à venir : celles du pilotage + les examens de Mémoriser (perso + pro).
export function prochainesÉchéances(pilotage, lire, foyer, auj = aujourdhuiLocal()) {
  const examens = ['perso', 'pro'].flatMap(t => {
    const espace = `${foyer.préfixe}${t}`
    return liste(lire('memoriser', espace).objectifs).filter(o => o.date).map(o => ({ id: `exam-${o.id}`, titre: o.nom, date: o.date, type: 'examen', lien: `/memoriser/${espace}` }))
  })
  return [...pilotage.échéances, ...examens].filter(e => e.date >= auj).sort((a, b) => a.date.localeCompare(b.date))
}
export const urgence = (date, auj) => { const j = joursRestants(date, auj); return j <= 7 ? 'forte' : j <= 30 ? 'moyenne' : 'faible' }

// ---------- Activité d'une semaine (lue dans les autres outils) ----------
const espaces = foyer => ['perso', 'pro'].map(t => ({ espace: `${foyer.préfixe}${t}`, nom: t === 'pro' ? 'Pro' : 'Perso' }))

export function bilanSemaine(lire, lireLectures, foyer, lundi) {
  const jours = joursDeLaSemaine(lundi)
  const dans = j => j && j >= jours[0] && j <= jours[6]
  const tâches = [], habitudes = [], examens = []
  const révisions = Object.fromEntries(jours.map(j => [j, { vues: 0, sues: 0 }]))
  let minutes = 0, récurrentes = 0
  const lectures = []
  espaces(foyer).forEach(({ espace, nom }) => {
    const t = lire('taches', espace)
    const fin = analyserAujourdhui(t).colonneTerminée
    liste(t.cartes).forEach(c => {
      if (c.récurrence) { récurrentes += liste(c.validées).filter(dans).length; return }
      const le = (c.fait && c.faitLe) || (c.colonneId === fin?.id && c.terminéeLe) || null
      if (dans(le)) tâches.push({ id: c.id, texte: (c.texte || '').split('\n')[0], espace: nom, le, lien: `/taches/${espace}?carte=${c.id}` })
    })
    const h = lire('habitudes', espace)
    liste(h.habitudes).filter(x => !x.archivée).forEach(x => {
      const prévus = jours.filter(j => (!x.créée || j >= x.créée) && (x.jours?.length ? x.jours : [0, 1, 2, 3, 4, 5, 6]).includes(dateDe(j).getDay()))
      if (!prévus.length) return
      habitudes.push({ id: x.id, nom: `${x.emoji || ''} ${x.nom}`.trim(), espace: nom, couleur: x.couleur, jours: jours.map(j => ({ jour: j, prévu: prévus.includes(j), fait: !!h.coches?.[j]?.[x.id] })), faits: prévus.filter(j => h.coches?.[j]?.[x.id]).length, prévus: prévus.length })
    })
    jours.forEach(j => Object.values(objet(h.temps?.[j])).forEach(m => { minutes += Number(m) || 0 }))
    const m = lire('memoriser', espace)
    jours.forEach(j => { const a = m.activité?.[j]; if (a) { révisions[j].vues += a.vues || 0; révisions[j].sues += a.sues || 0 } })
    liste(m.examens).filter(e => dans((e.date || '').slice(0, 10))).forEach(e => examens.push({ ...e, espace: nom }))
    liste(lireLectures(espace).éléments).filter(l => l.statut === 'lu' && dans(l.luLe)).forEach(l => lectures.push({ ...l, espace: nom }))
  })
  const vues = Object.values(révisions).reduce((n, r) => n + r.vues, 0)
  const sues = Object.values(révisions).reduce((n, r) => n + r.sues, 0)
  const prévus = habitudes.reduce((n, h) => n + h.prévus, 0)
  const faits = habitudes.reduce((n, h) => n + h.faits, 0)
  return { jours, tâches: tâches.sort((a, b) => a.le.localeCompare(b.le)), récurrentes, habitudes, tauxHabitudes: prévus ? faits / prévus : null, révisions, vues, sues, examens, minutes, lectures }
}

// ---------- Objectifs de l'année ----------
export const SOURCES = {
  étapes: 'Étapes cochées',
  examen: 'Préparation d\'un examen (Mémoriser)',
  paquet: 'Cartes maîtrisées d\'un paquet',
  habitude: 'Nombre de fois qu\'une habitude est cochée',
  lectures: 'Nombre de contenus lus (À lire)',
  étiquette: 'Tâches terminées avec une étiquette',
  compteur: 'Compteur à mettre à jour (km, kg, €…)',
}

// Avancement d'un objectif : { taux (0-1), texte, lien }.
export function avancement(o, lire, lireLectures) {
  const étapes = liste(o.étapes)
  const faites = étapes.filter(e => e.fait).length
  const parÉtapes = { taux: étapes.length ? faites / étapes.length : 0, texte: `${faites}/${étapes.length} étape${étapes.length > 1 ? 's' : ''}` }
  const s = o.source || { type: 'étapes' }
  const cible = Math.max(1, Number(s.cible) || 1)
  const début = `${o.année}-01-01`, fin = `${o.année}-12-31`
  const dansAnnée = j => j && j >= début && j <= fin
  if (s.type === 'examen') {
    const m = lire('memoriser', s.espace)
    const obj = liste(m.objectifs).find(x => x.id === s.id)
    if (!obj) return { ...parÉtapes, manquant: 'Examen introuvable dans Mémoriser' }
    const p = préparation(obj, liste(m.cartes))
    return { taux: p.taux, texte: `${Math.round(p.taux * 100)} % préparé · examen le ${dateCourte(obj.date)}`, lien: `/memoriser/${s.espace}` }
  }
  if (s.type === 'paquet') {
    const m = lire('memoriser', s.espace)
    const p = liste(m.paquets).find(x => x.id === s.id)
    if (!p) return { ...parÉtapes, manquant: 'Paquet introuvable' }
    const r = maîtrise(liste(m.cartes), [s.id])
    return { taux: r.total ? r.maîtrisées / r.total : 0, texte: `${r.maîtrisées}/${r.total} cartes maîtrisées · ${p.nom}`, lien: `/memoriser/${s.espace}` }
  }
  if (s.type === 'habitude') {
    const h = lire('habitudes', s.espace)
    const x = liste(h.habitudes).find(y => y.id === s.id)
    if (!x) return { ...parÉtapes, manquant: 'Habitude introuvable' }
    const n = Object.entries(objet(h.coches)).filter(([j, c]) => dansAnnée(j) && c?.[s.id]).length
    return { taux: Math.min(1, n / cible), texte: `${n}/${cible} fois · ${x.emoji || ''} ${x.nom}`.replace(/\s+/g, ' '), lien: `/habitudes/${s.espace}` }
  }
  if (s.type === 'lectures') {
    const n = liste(lireLectures(s.espace).éléments).filter(l => l.statut === 'lu' && dansAnnée(l.luLe)).length
    return { taux: Math.min(1, n / cible), texte: `${n}/${cible} lu${n > 1 ? 's' : ''}`, lien: `/lire/${s.espace}` }
  }
  if (s.type === 'étiquette') {
    const t = lire('taches', s.espace)
    const fin2 = analyserAujourdhui(t).colonneTerminée
    const l = liste(t.cartes).filter(c => liste(c.étiquettes).includes(s.id))
    const finies = l.filter(c => c.fait || c.colonneId === fin2?.id).length
    const nom = liste(t.étiquettes).find(e => e.id === s.id)?.nom || 'étiquette'
    return { taux: l.length ? finies / l.length : 0, texte: `${finies}/${l.length} tâches #${nom}`, lien: `/taches/${s.espace}` }
  }
  if (s.type === 'compteur') {
    const v = Number(s.valeur) || 0
    return { taux: Math.min(1, Math.max(0, v / cible)), texte: `${v}/${cible} ${s.unité || ''}`.trim() }
  }
  return parÉtapes
}

export function rythme(taux, année, auj = aujourdhuiLocal()) {
  const attendu = partÉcoulée(année, auj)
  if (Number(auj.slice(0, 4)) < année) return { nom: 'Pas commencé', couleur: '#6b7280', attendu }
  if (taux >= 1) return { nom: 'Atteint 🎉', couleur: '#2e9e6b', attendu }
  if (taux >= attendu + 0.1) return { nom: 'En avance', couleur: '#2e9e6b', attendu }
  if (taux >= attendu - 0.08) return { nom: 'Dans les temps', couleur: '#3b6fd8', attendu }
  return { nom: 'En retard', couleur: '#e8590c', attendu }
}

// Modèles : étapes par trimestre, à adapter.
export const MODÈLES = [
  { id: 'aws', emoji: '☁️', titre: 'Obtenir la certification AWS CloudOps Engineer – Associate', pourquoi: 'Valider mes compétences AWS au travail', source: { type: 'examen' }, étapes: [
    [1, 'Finir le cours et les labos des domaines 1 et 2'], [1, 'Paquet SOA-C03 : 50 % des cartes maîtrisées'],
    [2, 'Domaines 3 à 5 + 2 examens blancs au-dessus de 72 %'], [2, 'Passer l\'examen'],
    [3, 'Ajouter la certification au CV et sur LinkedIn'], [4, 'Choisir la certification suivante'],
  ] },
  { id: 'natu', emoji: '🇫🇷', titre: 'Obtenir la nationalité française', pourquoi: 'Devenir citoyen français', source: { type: 'étapes' }, étapes: [
    [1, 'Rassembler les pièces du dossier'], [1, 'Obtenir l\'attestation de français (niveau B2)'],
    [2, 'Déposer le dossier en ligne'], [2, 'Réviser le Livret du citoyen (cours + quiz)'],
    [3, 'Préparer et passer l\'entretien d\'assimilation'], [4, 'Suivre la décision et préparer la cérémonie'],
  ] },
  { id: 'sport', emoji: '🏃', titre: 'Faire du sport régulièrement', pourquoi: 'Garder la forme et l\'énergie', source: { type: 'habitude', cible: 150 }, étapes: [
    [1, 'Trouver un rythme de 3 séances par semaine'], [2, 'Courir 10 km'], [3, 'Tenir l\'été sans pause de plus de 2 semaines'], [4, 'Bilan et objectif de l\'an prochain'],
  ] },
  { id: 'lire', emoji: '📚', titre: 'Lire 24 livres ou contenus techniques', pourquoi: 'Rester à jour en DevOps', source: { type: 'lectures', cible: 24 }, étapes: [
    [1, '6 lectures + une carte Mémoriser par lecture'], [2, '12 lectures'], [3, '18 lectures'], [4, '24 lectures'],
  ] },
  { id: 'k8s', emoji: '☸️', titre: 'Devenir à l\'aise avec Kubernetes', pourquoi: 'Passer de « à évaluer » à « Confirmé » sur ma grille', source: { type: 'étapes' }, étapes: [
    [1, 'Monter un cluster local (kind ou minikube)'], [2, 'Déployer une appli avec Helm et des probes'],
    [3, 'Mettre en place la supervision (Datadog ou Prometheus)'], [4, 'Préparer la CKA ou la CKAD'],
  ] },
]
export function depuisModèle(m, année) {
  return { id: uid(), année, emoji: m.emoji, titre: m.titre, pourquoi: m.pourquoi, source: { ...m.source }, étapes: m.étapes.map(([trimestre, texte]) => ({ id: uid(), trimestre, texte, fait: false })) }
}
