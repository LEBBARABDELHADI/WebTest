// Données de tous les outils d'un foyer (perso + pro), pour l'accueil :
// lecture (copie locale, site, puis GitHub), recherche globale et ajout rapide.
import { useState, useEffect, useRef, useCallback } from 'react'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from './githubSync'
import { normaliser } from './motsCles'
import { texteBrut } from './texteFormate'
import { videsParEspace } from './donneesVides'

export const OUTILS = ['taches', 'notes', 'memoriser', 'graph', 'habitudes']

const LIVRÉES = Object.fromEntries(OUTILS.map(o => [o, videsParEspace(o)]))

const chemin = (outil, espace) => `react-blocks/src/data/${outil}-${espace}.json`
const clé = (outil, espace) => `react-blocs-${outil}-${espace}`
export const aujourdhui = () => new Date().toISOString().slice(0, 10)
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// La copie la plus récente sur l'appareil (chaque page la garde à jour),
// sinon un contenu vide (les données ne sont plus livrées avec le site).
export function lireLocal(outil, espace) {
  try {
    const brut = localStorage.getItem(clé(outil, espace))
    if (brut) return JSON.parse(brut)
  } catch { /* ignore */ }
  return LIVRÉES[outil][espace] || {}
}

const espacesDu = foyer => ['perso', 'pro'].map(t => `${foyer.préfixe}${t}`)

// Données du foyer, relues sur GitHub à l'ouverture et chaque fois qu'on
// revient sur l'app (onglet ou appli remis au premier plan).
export function useDonnéesFoyer(foyer) {
  const lireTout = () => Object.fromEntries(espacesDu(foyer).flatMap(e => OUTILS.map(o => [`${o}:${e}`, lireLocal(o, e)])))
  const [données, setDonnées] = useState(lireTout)
  const [àJourÀ, setÀJourÀ] = useState(null)
  const dernierRef = useRef(0)

  const rafraîchir = useCallback(async (forcer = false) => {
    if (!forcer && Date.now() - dernierRef.current < 20000) return
    dernierRef.current = Date.now()
    const token = localStorage.getItem(TOKEN_KEY) || ''
    const paires = espacesDu(foyer).flatMap(e => OUTILS.map(o => [o, e]))
    const lus = await Promise.allSettled(paires.map(([o, e]) => lireDepuisGitHub(token, chemin(o, e))))
    setDonnées(avant => {
      const après = { ...avant }
      lus.forEach((r, i) => { if (r.status === 'fulfilled' && !r.value.périmé) après[`${paires[i][0]}:${paires[i][1]}`] = r.value.data })
      return après
    })
    if (lus.some(r => r.status === 'fulfilled')) setÀJourÀ(new Date())
  }, [foyer])

  useEffect(() => {
    rafraîchir(true)
    const auRetour = () => { if (document.visibilityState === 'visible') rafraîchir() }
    document.addEventListener('visibilitychange', auRetour)
    window.addEventListener('focus', auRetour)
    return () => {
      document.removeEventListener('visibilitychange', auRetour)
      window.removeEventListener('focus', auRetour)
    }
  }, [rafraîchir])

  const lire = (outil, espace) => données[`${outil}:${espace}`] || {}
  return { lire, rafraîchir, àJourÀ, remplacer: (outil, espace, data) => setDonnées(d => ({ ...d, [`${outil}:${espace}`]: data })) }
}

// ---------- Recherche globale ----------

function extrait(texte, q) {
  const brut = texte.replace(/\s+/g, ' ').trim()
  const i = normaliser(brut).indexOf(q)
  if (i < 0) return brut.slice(0, 90)
  const début = Math.max(0, i - 30)
  return `${début > 0 ? '…' : ''}${brut.slice(début, début + 90)}${début + 90 < brut.length ? '…' : ''}`
}

function texteBlocNote(b) {
  if (b.type === 'texte') return b.contenu || ''
  if (b.type === 'tache') return b.texte || ''
  return [b.question, ...(b.options || []).map(o => o.texte)].filter(Boolean).join(' ')
}
function texteBlocSection(b) {
  if (b.type === 'liste') return (b.éléments || []).map(e => e.texte).join(' ')
  if (b.type === 'tableau') return (b.lignes || []).map(l => l.join(' ')).join(' ')
  return texteBrut(b.texte || '')
}

// Résultats : { type, titre, extrait, espace, lien }
export function rechercherPartout(lire, foyer, requête) {
  const q = normaliser(requête.trim())
  if (q.length < 2) return []
  const résultats = []
  const ok = t => normaliser(t || '').includes(q)
  espacesDu(foyer).forEach(espace => {
    const type = espace.endsWith('pro') ? 'Pro' : 'Perso'
    const tâches = lire('taches', espace)
    ;(tâches.cartes || []).forEach(c => {
      const texte = [c.texte, ...(c.checklist || []).map(x => x.texte)].join(' ')
      if (ok(texte)) résultats.push({ type: 'tâche', espace: type, titre: c.texte.split('\n')[0], extrait: c.archivé ? 'Archivée' : (tâches.colonnes || []).find(col => col.id === c.colonneId)?.titre || '', lien: `/taches/${espace}?carte=${c.id}` })
    })
    ;(lire('notes', espace).notes || []).forEach(n => {
      const corps = (n.blocs || []).map(texteBlocNote).join(' ')
      if (ok(n.titre) || ok(corps)) résultats.push({ type: 'note', espace: type, titre: n.titre || 'Note', extrait: extrait(ok(corps) ? corps : n.titre, q), lien: `/notes/${espace}?note=${n.id}` })
    })
    const mémo = lire('memoriser', espace)
    ;(mémo.cartes || []).forEach(c => {
      const recto = texteBrut(c.recto || '')
      const verso = texteBrut(c.verso || '')
      if (ok(recto) || ok(verso)) résultats.push({ type: 'carte', espace: type, titre: recto.slice(0, 80), extrait: `${(mémo.paquets || []).find(p => p.id === c.paquetId)?.nom || ''} · ${extrait(verso, q)}`, lien: `/memoriser/${espace}?carte=${c.id}` })
    })
    ;(lire('graph', espace).graphes || []).forEach(g => {
      if (ok(g.nom)) résultats.push({ type: 'graphe', espace: type, titre: g.nom, extrait: `${(g.noeuds || []).length} bulles`, lien: `/graph/${espace}?graphe=${g.id}` })
      ;(g.noeuds || []).forEach(n => {
        const texte = `${texteBrut(n.texte || '')} ${n.code || ''}`
        if (ok(texte)) résultats.push({ type: 'bulle', espace: type, titre: texteBrut(n.texte || '').split('\n')[0], extrait: `Graph « ${g.nom} »`, lien: `/graph/${espace}?graphe=${g.id}&bulle=${n.id}` })
      })
      ;(g.colonnes || []).forEach(col => (col.sousSections || []).forEach(ss => {
        if (ok(ss.titre)) résultats.push({ type: 'section', espace: type, titre: ss.titre, extrait: `${g.nom} · ${col.titre}`, lien: `/graph/${espace}?graphe=${g.id}&section=${ss.id}` })
        ;(ss.blocs || []).forEach(b => {
          const t = texteBlocSection(b)
          if (ok(t)) résultats.push({ type: 'section', espace: type, titre: `${ss.titre}`, extrait: extrait(t, q), lien: `/graph/${espace}?graphe=${g.id}&section=${b.id}&sous=${ss.id}` })
        })
      }))
    })
  })
  return résultats.slice(0, 60)
}

// ---------- Ajout rapide ----------

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const isoLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

// « Appeler Karim demain #urgent » → texte, date (AAAA-MM-JJ), étiquettes.
export function analyserSaisie(saisie) {
  let texte = ` ${saisie} `
  let date = null
  const base = new Date()
  const plus = n => { const d = new Date(base); d.setDate(d.getDate() + n); return isoLocal(d) }
  const règles = [
    [/\s(aujourd'hui|aujourdhui|auj)(?=\s)/i, () => plus(0)],
    [/\s(après-demain|apres-demain)(?=\s)/i, () => plus(2)],
    [/\s(demain)(?=\s)/i, () => plus(1)],
    [new RegExp(`\\s(?:ce |le )?(${JOURS.join('|')})(?=\\s)`, 'i'), m => {
      const cible = JOURS.indexOf(m[1].toLowerCase())
      const écart = ((cible - base.getDay()) + 7) % 7 || 7
      return plus(écart)
    }],
    [/\s(?:le )?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/, m => {
      const an = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : base.getFullYear()
      const d = new Date(an, Number(m[2]) - 1, Number(m[1]))
      if (!m[3] && d < new Date(base.getFullYear(), base.getMonth(), base.getDate())) d.setFullYear(an + 1)
      return isNaN(d) ? null : isoLocal(d)
    }],
  ]
  for (const [regex, calcul] of règles) {
    const m = texte.match(regex)
    if (m) { date = calcul(m); texte = texte.replace(m[0], ' '); break }
  }
  const étiquettes = []
  texte = texte.replace(/\s#([\p{L}\d_-]+)/gu, (_, mot) => { étiquettes.push(mot); return ' ' })
  return { texte: texte.replace(/\s+/g, ' ').trim(), date, étiquettes }
}

// Ajoute directement dans le fichier GitHub de l'outil (lu juste avant pour
// ne rien écraser), puis met à jour la copie locale de l'appareil.
export async function ajouterRapidement({ type, espace, saisie }) {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (!token) throw new Error('Connecte le token GitHub (dans une page, menu Synchronisation) pour ajouter depuis l\'accueil.')
  const { texte, date, étiquettes } = analyserSaisie(saisie)
  if (!texte) throw new Error('Écris quelque chose à ajouter.')
  const outil = { tâche: 'taches', note: 'notes', carte: 'memoriser' }[type]
  const { data, sha } = await lireDepuisGitHub(token, chemin(outil, espace))
  let nouveau
  let résumé
  if (type === 'tâche') {
    const colonnes = data.colonnes || []
    const colAuj = colonnes.find(c => normaliser(c.titre).includes('aujourd'))
    const colonne = (date === aujourdhui() && colAuj) || colonnes.find(c => /faire|venir|todo|backlog/.test(normaliser(c.titre))) || colonnes[0]
    if (!colonne) throw new Error('Le programme n\'a aucune colonne.')
    const ids = étiquettes.map(e => (data.étiquettes || []).find(x => normaliser(x.nom) === normaliser(e))?.id).filter(Boolean)
    const carte = { id: uid(), colonneId: colonne.id, texte, ...(ids.length ? { étiquettes: ids } : {}), ...(date ? { échéance: date } : {}) }
    nouveau = { ...data, cartes: [...(data.cartes || []), carte] }
    résumé = `Tâche ajoutée dans « ${colonne.titre} »${date ? ` pour le ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}`
  } else if (type === 'note') {
    const [titre, ...reste] = texte.split(/\s*\/\/\s*/)
    const note = { id: uid(), titre: titre.slice(0, 80), couleur: '#f0a839', catégorie: 'autres', blocs: [{ id: uid(), type: 'texte', contenu: reste.join('\n') || (titre.length > 80 ? titre : '') }] }
    nouveau = { ...data, notes: [note, ...(data.notes || [])] }
    résumé = `Note « ${note.titre} » ajoutée`
  } else {
    const [recto, verso] = texte.split(/\s*(?:::|=>|→)\s*/)
    if (!verso) throw new Error('Pour une carte, écris « question :: réponse ».')
    let paquets = data.paquets || []
    let paquet = étiquettes.length ? paquets.find(p => normaliser(p.nom).includes(normaliser(étiquettes[0]))) : null
    paquet = paquet || paquets[0]
    if (!paquet) { paquet = { id: uid(), nom: 'Ajout rapide', couleur: '#f0a839' }; paquets = [...paquets, paquet] }
    const carte = { id: uid(), paquetId: paquet.id, recto, verso, niveau: 0, prochaineRevision: aujourdhui() }
    nouveau = { ...data, paquets, cartes: [...(data.cartes || []), carte] }
    résumé = `Carte ajoutée au paquet « ${paquet.nom} »`
  }
  // base = la version lue : si le fichier change entre-temps, fusion.
  const écrit = await écrireVersGitHub(nouveau, token, sha, chemin(outil, espace), data)
  try { localStorage.setItem(clé(outil, espace), JSON.stringify(écrit.données)) } catch { /* ignore */ }
  return { outil, données: écrit.données, résumé }
}

// Ajoute plusieurs cartes dans un paquet (existant ou nouveau) de Mémoriser,
// directement dans le fichier GitHub (fusion si le fichier a changé).
export async function ajouterCartes({ espace, paquetId, nouveauPaquet, cartes }) {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (!token) throw new Error('Connecte le token GitHub pour créer des cartes.')
  const { data, sha } = await lireDepuisGitHub(token, chemin('memoriser', espace))
  let paquets = data.paquets || []
  let paquet = paquets.find(p => p.id === paquetId)
  if (!paquet) {
    paquet = { id: uid(), nom: (nouveauPaquet || 'Nouveau paquet').trim(), couleur: '#f0a839' }
    paquets = [...paquets, paquet]
  }
  const neuves = cartes.map(c => ({ id: uid(), paquetId: paquet.id, recto: c.recto, verso: c.verso, niveau: 0, prochaineRevision: aujourdhui() }))
  const nouveau = { ...data, paquets, cartes: [...(data.cartes || []), ...neuves] }
  const écrit = await écrireVersGitHub(nouveau, token, sha, chemin('memoriser', espace), data)
  try { localStorage.setItem(clé('memoriser', espace), JSON.stringify(écrit.données)) } catch { /* ignore */ }
  return { paquet, nombre: neuves.length }
}

// ---------- Sauvegarde complète ----------

// Toutes les données d'un foyer (perso + pro, tous les outils) en un objet,
// relues sur GitHub (ou, à défaut, la copie de l'appareil).
export async function créerSauvegarde(foyer) {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  const paires = espacesDu(foyer).flatMap(e => OUTILS.map(o => [o, e]))
  const lus = await Promise.allSettled(paires.map(([o, e]) => lireDepuisGitHub(token, chemin(o, e))))
  const fichiers = {}
  const depuisAppareil = []
  lus.forEach((r, i) => {
    const [o, e] = paires[i]
    if (r.status === 'fulfilled' && !r.value.périmé) fichiers[`${o}-${e}.json`] = r.value.data
    else { fichiers[`${o}-${e}.json`] = lireLocal(o, e); depuisAppareil.push(`${o}-${e}.json`) }
  })
  return { app: 'react-blocs', version: 1, foyer: foyer.id, date: new Date().toISOString(), fichiers, depuisAppareil }
}

// Résumé lisible d'une sauvegarde (pour l'aperçu avant restauration).
export function résumerSauvegarde(s) {
  return Object.entries(s.fichiers || {}).map(([nom, d]) => {
    const n = d?.cartes?.length ?? d?.notes?.length ?? d?.graphes?.length ?? d?.habitudes?.length ?? 0
    const unité = nom.startsWith('taches') ? 'tâches' : nom.startsWith('notes') ? 'notes' : nom.startsWith('memoriser') ? 'cartes' : nom.startsWith('graph') ? 'graphes' : 'habitudes'
    return { nom, texte: `${n} ${unité}` }
  })
}

// Réécrit chaque fichier sur GitHub avec le contenu de la sauvegarde
// (remplace la version en ligne) et met à jour les copies de l'appareil.
export async function restaurerSauvegarde(s, foyer, progression = () => {}) {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (!token) throw new Error('Connecte le token GitHub pour restaurer.')
  if (s?.app !== 'react-blocs' || !s.fichiers) throw new Error('Ce fichier n\'est pas une sauvegarde React Blocs.')
  const autorisés = new Set(espacesDu(foyer).flatMap(e => OUTILS.map(o => `${o}-${e}.json`)))
  const noms = Object.keys(s.fichiers).filter(n => autorisés.has(n))
  if (!noms.length) throw new Error(`Cette sauvegarde ne contient rien pour ${foyer.nom}.`)
  for (const [i, nom] of noms.entries()) {
    progression(i, noms.length, nom)
    const [, o, e] = nom.match(/^([a-z]+)-(.+)\.json$/)
    const données = s.fichiers[nom]
    await écrireVersGitHub(données, token, undefined, chemin(o, e))
    try {
      localStorage.setItem(clé(o, e), JSON.stringify(données))
      // Base = version restaurée : à la prochaine ouverture, rien à fusionner.
      localStorage.setItem(`${clé(o, e)}:base`, JSON.stringify(données))
    } catch { /* ignore */ }
  }
  return noms.length
}
