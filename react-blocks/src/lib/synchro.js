import { useState, useEffect, useRef } from 'react'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from './githubSync'

// Données d'un espace, enregistrées sur l'appareil et synchronisées avec
// leur fichier JSON du dépôt GitHub : lecture à l'ouverture (sans token,
// le dépôt est public), écriture différée après chaque modification si un
// token est connecté. Même fonctionnement que Programme, Notes, Mémoriser.
// Quand on revient sur l'app (onglet ou appli remis au premier plan),
// appelle `relire` — au plus une fois toutes les 20 s.
export function useRelectureAuRetour(relire, délai = 20000) {
  const dernierRef = useRef(Date.now())
  const fonctionRef = useRef(relire)
  fonctionRef.current = relire
  useEffect(() => {
    const auRetour = () => {
      if (document.visibilityState !== 'visible' || Date.now() - dernierRef.current < délai) return
      dernierRef.current = Date.now()
      fonctionRef.current()
    }
    document.addEventListener('visibilitychange', auRetour)
    window.addEventListener('focus', auRetour)
    return () => {
      document.removeEventListener('visibilitychange', auRetour)
      window.removeEventListener('focus', auRetour)
    }
  }, [délai])
}

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
  // Après une erreur passagère, nouvel essai automatique (sans attendre une
  // autre modification).
  const [relance, setRelance] = useState(0)
  // Relecture de GitHub au retour sur l'app, seulement si tout est envoyé
  // (pour ne jamais écraser une modification pas encore partie).
  const [relecture, setRelecture] = useState(0)
  const dataRef = useRef(null)
  useRelectureAuRetour(() => {
    if (prêtRef.current && JSON.stringify(dataRef.current) === dernierEnvoiRef.current) setRelecture(r => r + 1)
  })

  dataRef.current = data
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
  }, [token, config.chemin, relecture])

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
          setErreur(err.passagère ? `${err.message} Nouvel essai automatique dans 10 s.` : err.message)
          if (err.passagère) setTimeout(() => setRelance(r => r + 1), 10000)
        })
    }, 1500)
    return () => clearTimeout(délaiRef.current)
  }, [data, token, config.chemin, relance])

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
