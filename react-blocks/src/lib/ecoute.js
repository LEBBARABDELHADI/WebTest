import { useEffect } from 'react'

const Reconnaissance = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

export const dictéeDisponible = !!Reconnaissance

// Écoute une réponse orale et la renvoie quand la personne a fini de parler.
// - `attente` : délai max avant le premier mot (sinon réponse vide)
// - `silence` : pause après la parole qui marque la fin de la réponse
// - `maximum` : durée max d'une réponse
// L'iPhone coupe parfois l'écoute après chaque phrase : on la relance
// tant que la personne n'a pas fini.
export function écouter({ attente = 9000, silence = 2600, maximum = 75000, surTexte } = {}) {
  let arrêterÉcoute = () => {}
  const promesse = new Promise((resolve, reject) => {
    if (!Reconnaissance) { reject(new Error('indisponible')); return }
    const r = new Reconnaissance()
    r.lang = 'fr-FR'
    r.continuous = true
    r.interimResults = true

    let final = ''
    let provisoire = ''
    let fini = false
    let relances = 0
    let minuteur = null
    const début = Date.now()

    const texte = () => `${final} ${provisoire}`.replace(/\s+/g, ' ').trim()
    const terminer = () => {
      if (fini) return
      fini = true
      clearTimeout(minuteur)
      clearTimeout(limite)
      try { r.stop() } catch { /* déjà arrêtée */ }
      resolve(texte())
    }
    const armer = ms => { clearTimeout(minuteur); minuteur = setTimeout(terminer, ms) }
    const limite = setTimeout(terminer, maximum)
    arrêterÉcoute = terminer

    r.onresult = e => {
      provisoire = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const morceau = e.results[i][0].transcript
        if (e.results[i].isFinal) final += ` ${morceau}`
        else provisoire += morceau
      }
      surTexte?.(texte())
      armer(silence)
    }
    r.onerror = e => {
      if (fini) return
      if (e.error === 'no-speech' || e.error === 'aborted') return
      fini = true
      clearTimeout(minuteur)
      clearTimeout(limite)
      reject(new Error(e.error || 'erreur'))
    }
    r.onend = () => {
      if (fini) return
      // Arrêt prématuré du navigateur : on relance, sauf si le temps est écoulé.
      if (relances < 8 && Date.now() - début < maximum) {
        relances += 1
        try { r.start(); return } catch { /* impossible de relancer */ }
      }
      terminer()
    }

    armer(attente)
    try {
      r.start()
    } catch (err) {
      fini = true
      clearTimeout(minuteur)
      clearTimeout(limite)
      reject(err)
    }
  })
  return { promesse, arrêter: () => arrêterÉcoute() }
}

// Demande l'accès au micro tout de suite (dans le geste qui lance le mode),
// pour que l'autorisation ne bloque pas l'écoute automatique plus tard.
export async function autoriserMicro() {
  try {
    const flux = await navigator.mediaDevices?.getUserMedia?.({ audio: true })
    flux?.getTracks().forEach(t => t.stop())
    return true
  } catch {
    return false
  }
}

// Garde l'écran allumé pendant un mode vocal (sinon le téléphone se met en
// veille et la lecture s'arrête). Sans effet si le navigateur ne le permet pas.
export function useÉcranAllumé(actif) {
  useEffect(() => {
    if (!actif || !navigator.wakeLock) return
    let verrou = null
    let annulé = false
    const demander = () => {
      navigator.wakeLock.request('screen').then(v => {
        if (annulé) v.release()
        else verrou = v
      }).catch(() => {})
    }
    const auRetour = () => { if (document.visibilityState === 'visible') demander() }
    demander()
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      annulé = true
      document.removeEventListener('visibilitychange', auRetour)
      verrou?.release().catch(() => {})
    }
  }, [actif])
}
