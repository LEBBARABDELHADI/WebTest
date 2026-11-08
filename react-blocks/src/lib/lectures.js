// « À lire » : articles, vidéos, pages de documentation… avec ce qu'on en
// retient, transformé en cartes Mémoriser. Un fichier par espace :
// lectures-<espace>.json = { éléments: [{ id, url, titre, type, étiquettes,
// statut: 'àlire' | 'encours' | 'lu', ajouté, luLe, note, cartes: [ids] }] }
import { useMemo } from 'react'
import { useDonnéesSynchronisées } from './synchro'

export const TYPES = {
  article: { emoji: '📰', nom: 'Article' },
  vidéo: { emoji: '🎬', nom: 'Vidéo' },
  doc: { emoji: '📘', nom: 'Documentation' },
  podcast: { emoji: '🎧', nom: 'Podcast' },
  livre: { emoji: '📖', nom: 'Livre' },
  cours: { emoji: '🎓', nom: 'Cours' },
}
export const STATUTS = { àlire: 'À lire', encours: 'En cours', lu: 'Lu' }

export function compléterLectures(o) {
  const d = o && typeof o === 'object' && !Array.isArray(o) ? o : {}
  return { ...d, éléments: Array.isArray(d.éléments) ? d.éléments : [] }
}
export function useLectures(espace) {
  const config = useMemo(() => ({ id: espace, stockage: `react-blocs-lectures-${espace}`, chemin: `react-blocks/src/data/lectures-${espace}.json`, données: {} }), [espace])
  return useDonnéesSynchronisées(config, compléterLectures)
}

export function domaine(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}
export function typeDepuisUrl(url) {
  const d = domaine(url)
  if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion|twitch\.tv/.test(d)) return 'vidéo'
  if (/spotify\.com|podcasts\.apple|deezer|soundcloud|podcast/.test(d)) return 'podcast'
  if (/^docs\.|\.readthedocs\.|kubernetes\.io|developer\.|learn\.microsoft|terraform\.io|registry\.terraform|docs\.gitlab|docs\.docker|docs\.datadoghq|docs\.dynatrace|techdocs\.akamai/.test(d) || /\/docs?\//.test(url)) return 'doc'
  if (/udemy|coursera|skillbuilder|cloudacademy|acloudguru|pluralsight|openclassrooms|edx\.org/.test(d)) return 'cours'
  if (/amazon\.|fnac\.|goodreads|books\.google|oreilly\.com\/library/.test(d)) return 'livre'
  return 'article'
}
// Titre lisible déduit de l'adresse (le site ne peut pas lire la page).
export function titreDepuisUrl(url) {
  try {
    const u = new URL(url)
    const morceaux = u.pathname.split('/').filter(Boolean).filter(m => !/^(index\.html?|[a-z]{2}(-[a-z]{2})?|latest|docs?|watch|v)$/i.test(m))
    const dernier = decodeURIComponent(morceaux.at(-1) || '').replace(/\.(html?|php|aspx?)$/i, '').replace(/[-_+]+/g, ' ').trim()
    if (dernier && !/^[\w-]{11}$/.test(dernier) && /[a-z]/i.test(dernier)) return `${dernier.charAt(0).toUpperCase()}${dernier.slice(1)}`
    return u.hostname.replace(/^www\./, '')
  } catch { return url.slice(0, 80) }
}
// Partage depuis le téléphone : l'adresse arrive souvent dans le texte.
export function lirePartage(params) {
  let url = (params.get('url') || '').trim()
  let texte = (params.get('texte') || params.get('text') || '').trim()
  let titre = (params.get('titre') || params.get('title') || '').trim()
  if (!url) { const m = texte.match(/https?:\/\/\S+/); if (m) { url = m[0]; texte = texte.replace(m[0], '').trim() } }
  if (!titre && texte) titre = texte.slice(0, 140)
  return { url, titre }
}

// Cartes tirées de la note : chaque ligne « question :: réponse » devient une
// carte ; sinon une seule carte « Ce que je retiens de … » avec toute la note.
export function cartesDepuisNote(é) {
  const note = (é.note || '').trim()
  if (!note) return []
  const lignes = note.split('\n').map(l => l.trim()).filter(Boolean)
  const paires = lignes.filter(l => /\s(::|→|=>)\s/.test(l)).map(l => { const [recto, ...v] = l.split(/\s(?:::|→|=>)\s/); return { recto: recto.replace(/^[-•*]\s*/, ''), verso: v.join(' ') } }).filter(c => c.recto && c.verso)
  const source = é.url ? `\n\n🔗 ${é.titre} — ${é.url}` : ''
  if (paires.length) return paires.map(c => ({ ...c, verso: `${c.verso}${source}` }))
  return [{ recto: `Ce que je retiens de « ${é.titre} »`, verso: `${note}${source}` }]
}
