const OWNER = 'LEBBARABDELHADI'
const REPO = 'WebTest'
const BRANCHE = 'claude/react-blocks-simulation-FxGEl'
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`

export const TOKEN_KEY = 'react-blocs-github-token'

function encoderBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

function décoderBase64Utf8(b64) {
  return decodeURIComponent(escape(atob(b64)))
}

// Lecture publique : fonctionne même sans token (dépôt public), avec un
// meilleur quota de requêtes si un token est fourni. `chemin` est le chemin
// du fichier dans le dépôt (un par espace : perso, pro, ...).
export async function lireDepuisGitHub(token, chemin) {
  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${API_BASE}/${chemin}?ref=${BRANCHE}`, { headers, cache: 'no-store' })
  } catch {
    throw new Error('Connexion à GitHub impossible (hors ligne ?)')
  }
  if (!res.ok) {
    if (res.status === 403) throw new Error('Limite de requêtes GitHub atteinte, réessaie plus tard')
    throw new Error(`Lecture impossible (${res.status})`)
  }
  const json = await res.json()
  const contenu = décoderBase64Utf8(json.content.replace(/\n/g, ''))
  return { data: JSON.parse(contenu), sha: json.sha }
}

// Écriture : nécessite un token avec la permission Contents (lecture/écriture)
// sur ce dépôt (token fin, "Fine-grained personal access token").
export async function écrireVersGitHub(data, token, shaConnu, chemin) {
  if (!token) throw new Error('Token manquant')
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  let sha = shaConnu
  if (!sha) {
    const actuel = await lireDepuisGitHub(token, chemin)
    sha = actuel.sha
  }
  const contenu = encoderBase64Utf8(JSON.stringify(data, null, 2))
  let res
  try {
    res = await fetch(`${API_BASE}/${chemin}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `chore: sync tâches ${new Date().toISOString()}`,
        content: contenu,
        sha,
        branch: BRANCHE,
      }),
    })
  } catch {
    throw new Error('Connexion à GitHub impossible (hors ligne ?)')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('Token invalide ou expiré')
    if (res.status === 409) throw new Error('Conflit : le fichier a changé ailleurs, réessaie')
    throw new Error(err.message || `Écriture impossible (${res.status})`)
  }
  const json = await res.json()
  return { sha: json.content.sha }
}

// Envoie un fichier binaire déjà encodé en base64 (image de carte) comme
// nouveau fichier du dépôt. Nécessite le token en écriture.
export async function envoyerFichier(chemin, base64, token, message) {
  if (!token) throw new Error('Token manquant')
  let res
  try {
    res = await fetch(`${API_BASE}/${chemin}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, content: base64, branch: BRANCHE }),
    })
  } catch {
    throw new Error('Connexion à GitHub impossible (hors ligne ?)')
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Token invalide ou expiré')
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Envoi impossible (${res.status})`)
  }
}

// Adresse publique d'un fichier du dépôt (les images des cartes).
export function adresseBrute(chemin) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/refs/heads/${BRANCHE}/${chemin}`
}

// Historique d'un fichier : les derniers commits qui l'ont modifié.
export async function listerVersions(token, chemin) {
  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/commits?path=${encodeURIComponent(chemin)}&sha=${encodeURIComponent(BRANCHE)}&per_page=60`, { headers, cache: 'no-store' })
  } catch {
    throw new Error('Connexion à GitHub impossible (hors ligne ?)')
  }
  if (!res.ok) {
    if (res.status === 403) throw new Error('Limite de requêtes GitHub atteinte, réessaie plus tard')
    throw new Error(`Historique indisponible (${res.status})`)
  }
  const commits = await res.json()
  return commits.map(c => ({ sha: c.sha, date: c.commit.committer?.date || c.commit.author?.date, message: c.commit.message }))
}

// Contenu d'un fichier JSON tel qu'il était à un commit donné.
export async function lireVersion(token, chemin, sha) {
  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${API_BASE}/${chemin}?ref=${sha}`, { headers })
  } catch {
    throw new Error('Connexion à GitHub impossible (hors ligne ?)')
  }
  if (!res.ok) throw new Error(`Version illisible (${res.status})`)
  const json = await res.json()
  return JSON.parse(décoderBase64Utf8(json.content.replace(/\n/g, '')))
}
