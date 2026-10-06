import { useState, useEffect, useRef } from 'react'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from './githubSync'

// Données d'un espace, enregistrées sur l'appareil et synchronisées avec
// leur fichier JSON du dépôt GitHub : lecture à l'ouverture (sans token,
// le dépôt est public), écriture différée après chaque modification si un
// token est connecté. Même fonctionnement que Programme, Notes, Mémoriser.
export function useDonnéesSynchronisées(config, compléter) {
  const [data, setData] = useState(() => {
    try {
      const brut = localStorage.getItem(config.stockage)
      if (brut) return compléter(JSON.parse(brut))
    } catch { /* ignore */ }
    return compléter(config.données)
  })
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [statut, setStatut] = useState(token ? 'chargement' : 'lecture')
  const [erreur, setErreur] = useState('')
  const shaRef = useRef(null)
  const délaiRef = useRef(null)
  const ignorerÉcritureRef = useRef(false)
  const prêtRef = useRef(false)
  const dernierEnvoiRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(config.stockage, JSON.stringify(data)) } catch { /* ignore */ }
  }, [data, config.stockage])

  useEffect(() => {
    let annulé = false
    setStatut(s => (s === 'erreur' ? s : token ? 'chargement' : 'lecture'))
    lireDepuisGitHub(token, config.chemin)
      .then(({ data: distant, sha }) => {
        if (annulé) return
        shaRef.current = sha
        dernierEnvoiRef.current = JSON.stringify(distant)
        ignorerÉcritureRef.current = true
        setData(compléter(distant))
        setStatut(token ? 'connecté' : 'lecture-seule')
      })
      .catch(err => {
        if (annulé) return
        setStatut('erreur')
        setErreur(err.message)
      })
      .finally(() => { prêtRef.current = true })
    return () => { annulé = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, config.chemin])

  useEffect(() => {
    if (!token || !prêtRef.current) return
    if (ignorerÉcritureRef.current) { ignorerÉcritureRef.current = false; return }
    const contenu = JSON.stringify(data)
    if (contenu === dernierEnvoiRef.current) return
    clearTimeout(délaiRef.current)
    délaiRef.current = setTimeout(() => {
      setStatut('synchronisation')
      écrireVersGitHub(data, token, shaRef.current, config.chemin)
        .then(({ sha }) => {
          shaRef.current = sha
          dernierEnvoiRef.current = contenu
          setStatut('connecté')
        })
        .catch(err => {
          setStatut('erreur')
          setErreur(err.message)
        })
    }, 1500)
    return () => clearTimeout(délaiRef.current)
  }, [data, token, config.chemin])

  const connecter = t => {
    const propre = t.trim()
    if (!propre) return
    localStorage.setItem(TOKEN_KEY, propre)
    setToken(propre)
  }
  const déconnecter = () => {
    localStorage.removeItem(TOKEN_KEY)
    shaRef.current = null
    setToken('')
  }

  return { data, setData, token, statut, erreur, connecter, déconnecter }
}
