// Images « mémoire visuelle » d'une carte : photos trouvées sur Wikipédia /
// Wikimedia Commons d'après le contenu de la carte, ou pictogramme généré
// sur place (émojis + mots-clés + dates), sans réseau.
import { texteBrut } from './texteFormate'
import { normaliser } from './motsCles'

const MOTS_VIDES = new Set(('le la les l un une des de du d au aux a à et ou en dans sur par pour avec sans ce cet cette ces qui que quoi qu est '
  + 'c ça sont se sa son ses leur leurs il elle ils elles on nous vous je tu y ne pas plus comment pourquoi quand quel quelle quels '
  + 'quelles combien est-ce estce donc alors aussi tout tous toute toutes chaque the of and to in is what how').split(/\s+/))

// Requête de recherche tirée de la question (sans les tournures « Qu'est-ce que… »).
export function requêteDeCarte(carte) {
  const recto = texteBrut(carte.recto || '')
    .replace(/qu['’]?est[- ]ce (que|qui)( l['’]| la| le| les)?/gi, ' ')
    .replace(/c['’]est quoi( la| le| les| l['’])?/gi, ' ')
    .replace(/\b(comment|pourquoi|quel(le)?s?|quand)\b/gi, ' ')
    .replace(/[?!.:;«»"]/g, ' ')
    .replace(/\s+/g, ' ').trim()
  return recto.split(' ').slice(0, 10).join(' ')
}

const API_WIKI = 'https://fr.wikipedia.org/w/api.php'
const API_COMMONS = 'https://commons.wikimedia.org/w/api.php'

async function appeler(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(r.status === 429 ? 'Wikipédia est surchargé, réessaie dans un instant' : `Recherche impossible (${r.status})`)
  return r.json()
}

// Jusqu'à ~16 images : d'abord celles des articles Wikipédia (les plus
// parlantes), puis des fichiers de Commons.
export async function chercherImages(requête) {
  const q = requête.trim()
  if (!q) return []
  const [wiki, commons] = await Promise.allSettled([
    appeler(API_WIKI, { action: 'query', generator: 'search', gsrsearch: q, gsrlimit: '12', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '640' }),
    appeler(API_COMMONS, { action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '640' }),
  ])
  const résultats = []
  if (wiki.status === 'fulfilled') {
    Object.values(wiki.value.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0)).forEach(p => {
      if (p.thumbnail?.source) résultats.push({ type: 'web', url: p.thumbnail.source, titre: p.title, page: `https://fr.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, source: 'Wikipédia' })
    })
  }
  if (commons.status === 'fulfilled') {
    Object.values(commons.value.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0)).forEach(p => {
      const info = p.imageinfo?.[0]
      if (info?.thumburl) résultats.push({ type: 'web', url: info.thumburl, titre: p.title.replace(/^Fichier:|^File:/, '').replace(/\.[a-z]+$/i, ''), page: info.descriptionurl, source: 'Wikimedia Commons' })
    })
  }
  if (!résultats.length && wiki.status === 'rejected' && commons.status === 'rejected') throw wiki.reason
  const vus = new Set()
  return résultats.filter(r => (vus.has(r.url) ? false : (vus.add(r.url), true))).slice(0, 16)
}

// ---------- Pictogramme généré ----------
// Mots (sans accents, début de mot) → émoji. Thèmes courants : citoyenneté,
// histoire, institutions, valeurs, et quelques sujets généraux.
const ÉMOJIS = [
  ['france', '🇫🇷'], ['drapeau', '🇫🇷'], ['tricolore', '🇫🇷'], ['republique', '🏛️'], ['constitution', '📜'], ['declaration', '📜'],
  ['article', '📄'], ['loi', '⚖️'], ['droit', '⚖️'], ['justice', '⚖️'], ['tribunal', '⚖️'], ['egalite', '⚖️'], ['liberte', '🕊️'],
  ['fraternite', '🤝'], ['solidarite', '🤝'], ['devise', '🏷️'], ['marianne', '👩'], ['mariane', '👩'], ['femme', '👩'], ['homme', '👨'],
  ['marseillaise', '🎶'], ['hymne', '🎶'], ['chant', '🎶'], ['coq', '🐓'], ['bastille', '🏰'], ['revolution', '⚔️'], ['guerre', '⚔️'],
  ['armes', '⚔️'], ['soldat', '💂'], ['federation', '🎆'], ['fete', '🎆'], ['14 juillet', '🎆'], ['laicite', '☯️'], ['laique', '☯️'],
  ['religion', '🛐'], ['culte', '🛐'], ['croyance', '🙏'], ['athee', '🚫'], ['agnostique', '🤔'], ['conscience', '🧠'], ['vote', '🗳️'],
  ['elu', '🗳️'], ['election', '🗳️'], ['referendum', '🗳️'], ['democrat', '🗳️'], ['peuple', '👥'], ['citoyen', '🧑‍🤝‍🧑'], ['nation', '🗺️'],
  ['indivisible', '🔗'], ['unite', '🔗'], ['outre-mer', '🏝️'], ['metropole', '🗺️'], ['parlement', '🏛️'], ['assemblee', '🏛️'], ['senat', '🏛️'],
  ['gouvernement', '🏢'], ['president', '🎖️'], ['ministre', '💼'], ['europe', '🇪🇺'], ['social', '🫶'], ['securite sociale', '🏥'],
  ['retraite', '👴'], ['generation', '👨‍👩‍👧'], ['ecole', '🏫'], ['education', '🎓'], ['impot', '💶'], ['travail', '💼'], ['sante', '🏥'],
  ['langue', '🗣️'], ['francais', '🗣️'], ['ordre public', '🚓'], ['police', '🚓'], ['neutralite', '⚪'], ['respect', '🫡'], ['patrie', '🇫🇷'],
  ['gloire', '🌟'], ['sang', '🩸'], ['tyrannie', '👑'], ['roi', '👑'], ['restauration', '👑'], ['napoleon', '🎩'], ['paris', '🗼'],
  ['code', '💻'], ['serveur', '🖥️'], ['donnee', '🗄️'], ['securite', '🔒'], ['reseau', '🌐'], ['cloud', '☁️'], ['test', '🧪'],
]

export function pictogrammeDeCarte(carte) {
  const recto = texteBrut(carte.recto || '')
  const verso = texteBrut(carte.verso || '')
  const tout = ` ${normaliser(`${recto} ${verso}`)} `
  const émojis = []
  ÉMOJIS.forEach(([mot, é]) => {
    if (émojis.length >= 4 || émojis.includes(é)) return
    if (new RegExp(`[^a-z0-9]${mot.replace(/[-]/g, '.')}`).test(tout)) émojis.push(é)
  })
  if (!émojis.length) émojis.push('💡')
  const dates = [...new Set((`${recto} ${verso}`.match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || []))].slice(0, 3)
  const mots = [...new Set(recto.split(/[^\p{L}\p{N}'’-]+/u)
    .filter(m => m.length > 2 && !MOTS_VIDES.has(normaliser(m)) && !/^\d+$/.test(m)))]
    .sort((a, b) => b.length - a.length).slice(0, 3)
  return { type: 'picto', émojis, dates, mots }
}
