import { useState, useEffect, useRef } from 'react'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from './githubSync'
import { fusionner, réconcilier, lireBase, écrireBase, annoncer } from './fusion'

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
  // Copie locale écrite un court instant après la dernière modification
  // (pas à chaque mouvement), et tout de suite si on quitte la page.
  useEffect(() => {
    const écrire = () => { try { localStorage.setItem(config.stockage, JSON.stringify(dataRef.current)) } catch { /* ignore */ } }
    const minuteur = setTimeout(écrire, 300)
    window.addEventListener('pagehide', écrire)
    return () => { clearTimeout(minuteur); window.removeEventListener('pagehide', écrire) }
  }, [data, config.stockage])

  useEffect(() => {
    let annulé = false
    setStatut(s => (s === 'erreur' ? s : token ? 'chargement' : 'lecture'))
    lireDepuisGitHub(token, config.chemin)
      .then(({ data: distant, sha, périmé }) => {
        if (annulé) return
        // Ancienne version servie en retard par GitHub (juste après un de
        // nos enregistrements) : on garde ce qu'on a.
        if (périmé && shaRef.current) { setStatut(token ? 'connecté' : 'lecture-seule'); return }
        shaRef.current = sha
        const distantComplet = compléter(distant)
        // Modifications pas encore envoyées : fusionnées, pas écrasées.
        const { données, àEnvoyer } = réconcilier({ distant: distantComplet, local: dataRef.current, base: lireBase(config.stockage) })
        dernierEnvoiRef.current = JSON.stringify(distantComplet)
        écrireBase(config.stockage, dernierEnvoiRef.current)
        if (!àEnvoyer) ignorerÉcritureRef.current = true
        setData(données)
        if (àEnvoyer) annoncer('Modifications faites hors ligne ajoutées à la version en ligne')
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

  // Envoi vers GitHub (utilisé par le minuteur et en quittant la page).
  const tokenRef = useRef(token)
  tokenRef.current = token
  const montéRef = useRef(true)
  const enCoursRef = useRef(null)
  const envoyerRef = useRef(null)
  envoyerRef.current = () => {
    clearTimeout(délaiRef.current)
    const t = tokenRef.current
    if (!t || !prêtRef.current) return
    const données = dataRef.current
    const contenu = JSON.stringify(données)
    if (contenu === dernierEnvoiRef.current || contenu === enCoursRef.current) return
    enCoursRef.current = contenu
    if (montéRef.current) setStatut('synchronisation')
    const base = dernierEnvoiRef.current ? JSON.parse(dernierEnvoiRef.current) : undefined
    écrireVersGitHub(données, t, shaRef.current, config.chemin, base)
      .then(({ sha, données: écrites, fusionné }) => {
        shaRef.current = sha
        dernierEnvoiRef.current = fusionné ? JSON.stringify(écrites) : contenu
        écrireBase(config.stockage, dernierEnvoiRef.current)
        if (!montéRef.current) return
        if (fusionné) {
          setData(courant => fusionner(données, courant, écrites))
          annoncer('Mis à jour avec les changements d\'un autre appareil')
        }
        setStatut('connecté')
      })
      .catch(err => {
        if (!montéRef.current) return
        setStatut('erreur')
        setErreur(err.passagère ? `${err.message} Nouvel essai automatique dans 10 s.` : err.message)
        if (err.passagère) setTimeout(() => setRelance(r => r + 1), 10000)
      })
      .finally(() => { if (enCoursRef.current === contenu) enCoursRef.current = null })
  }

  useEffect(() => {
    if (!token || !prêtRef.current) return
    if (ignorerÉcritureRef.current) { ignorerÉcritureRef.current = false; return }
    if (JSON.stringify(data) === dernierEnvoiRef.current) return
    clearTimeout(délaiRef.current)
    délaiRef.current = setTimeout(() => envoyerRef.current(), 1500)
    return () => clearTimeout(délaiRef.current)
  }, [data, token, config.chemin, relance])

  // En quittant (autre page de l'app, onglet caché, fermeture) : copie
  // locale et envoi tout de suite, sans attendre le minuteur.
  useEffect(() => {
    montéRef.current = true
    const partir = () => {
      try { localStorage.setItem(config.stockage, JSON.stringify(dataRef.current)) } catch { /* ignore */ }
      envoyerRef.current()
    }
    const caché = () => { if (document.visibilityState === 'hidden') partir() }
    document.addEventListener('visibilitychange', caché)
    window.addEventListener('pagehide', partir)
    return () => {
      document.removeEventListener('visibilitychange', caché)
      window.removeEventListener('pagehide', partir)
      montéRef.current = false
      partir()
    }
  }, [config.stockage, config.chemin])

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

// Pour les pages qui gèrent leur synchro elles-mêmes (Programme, Notes,
// Mémoriser) : en quittant la page, l'onglet ou l'appli, la copie locale et
// l'envoi vers GitHub partent tout de suite au lieu d'attendre le minuteur
// (qui serait annulé). Tous les champs sont des refs, sauf token/chemin/stockage.
export function useEnvoiEnPartant(options) {
  const optionsRef = useRef(options)
  optionsRef.current = options
  useEffect(() => {
    let enCours = null
    const partir = () => {
      const { donnéesRef, token, prêtRef, shaRef, dernierEnvoiRef, minuteurRef, chemin, stockage } = optionsRef.current
      const données = donnéesRef.current
      const contenu = JSON.stringify(données)
      try { localStorage.setItem(stockage, contenu) } catch { /* ignore */ }
      if (!token || !prêtRef.current || contenu === dernierEnvoiRef.current || contenu === enCours) return
      clearTimeout(minuteurRef.current)
      enCours = contenu
      const base = dernierEnvoiRef.current ? JSON.parse(dernierEnvoiRef.current) : undefined
      écrireVersGitHub(données, token, shaRef.current, chemin, base)
        .then(({ sha, données: écrites, fusionné }) => {
          shaRef.current = sha
          dernierEnvoiRef.current = fusionné ? JSON.stringify(écrites) : contenu
          écrireBase(stockage, dernierEnvoiRef.current)
        })
        .catch(() => { /* la copie locale sera réconciliée à la prochaine ouverture */ })
        .finally(() => { if (enCours === contenu) enCours = null })
    }
    const caché = () => { if (document.visibilityState === 'hidden') partir() }
    document.addEventListener('visibilitychange', caché)
    window.addEventListener('pagehide', partir)
    return () => {
      document.removeEventListener('visibilitychange', caché)
      window.removeEventListener('pagehide', partir)
      partir()
    }
  }, [])
}
