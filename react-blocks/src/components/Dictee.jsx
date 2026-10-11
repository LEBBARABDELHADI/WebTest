import { useState, useRef, useEffect } from 'react'
import { grotesk } from '../lib/theme'

const Reconnaissance = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

const CLÉ_LANGUE = 'react-blocs-dictee-langue'
const LANGUES = { 'fr-FR': 'FR', 'en-US': 'EN' }
const lireLangue = () => {
  try { const l = localStorage.getItem(CLÉ_LANGUE); if (LANGUES[l]) return l } catch { /* ignore */ }
  return 'fr-FR'
}

// Bouton 🎤 : dicte du texte (français ou anglais) et l'insère à l'endroit du
// curseur dans le champ. On relit la valeur du champ dans le DOM à chaque
// phrase, pour ne jamais écraser ce qui a été tapé entre-temps.
export default function Dictée({ T, obtenirInput, setValeur, grand = false }) {
  const [langue, setLangue] = useState(lireLangue)
  const [actif, setActif] = useState(false)
  const [provisoire, setProvisoire] = useState('')
  const [erreur, setErreur] = useState('')
  const reco = useRef(null)
  const continuer = useRef(false)

  useEffect(() => () => { continuer.current = false; try { reco.current?.abort() } catch { /* ignore */ } }, [])

  if (!Reconnaissance) return null

  const insérer = morceau => {
    const el = obtenirInput()
    if (!el) return
    const valeur = el.value
    const début = el.selectionStart ?? valeur.length
    const fin = el.selectionEnd ?? valeur.length
    const avant = valeur.slice(0, début)
    const après = valeur.slice(fin)
    let texte = morceau.trim()
    if (!texte) return
    // Majuscule en début de champ ou après une fin de phrase.
    if (!avant.trim() || /[.!?\n]\s*$/.test(avant)) texte = texte[0].toUpperCase() + texte.slice(1)
    if (avant && !/\s$/.test(avant)) texte = ` ${texte}`
    if (après && !/^\s/.test(après)) texte = `${texte} `
    setValeur(avant + texte + après)
    const pos = avant.length + texte.length
    requestAnimationFrame(() => {
      const champ = obtenirInput()
      if (!champ) return
      champ.focus()
      champ.setSelectionRange(pos, pos)
    })
  }

  const arrêter = () => {
    continuer.current = false
    try { reco.current?.stop() } catch { /* ignore */ }
    setActif(false)
    setProvisoire('')
  }

  const démarrer = (l = langue) => {
    const r = new Reconnaissance()
    r.lang = l
    r.continuous = true
    r.interimResults = true
    r.onresult = e => {
      let prov = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const morceau = e.results[i][0].transcript
        if (e.results[i].isFinal) insérer(morceau)
        else prov += morceau
      }
      setProvisoire(prov)
    }
    r.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      continuer.current = false
      setErreur(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'Micro refusé : autorise-le dans les réglages du navigateur'
        : 'Dictée interrompue, réessaie')
    }
    // Certains navigateurs (iPhone) coupent après chaque phrase : on relance.
    r.onend = () => {
      if (continuer.current && reco.current === r) {
        try { r.start(); return } catch { /* impossible de relancer */ }
      }
      if (reco.current === r) { setActif(false); setProvisoire('') }
    }
    try { reco.current?.abort() } catch { /* ignore */ }
    reco.current = r
    continuer.current = true
    setErreur('')
    try { r.start(); setActif(true) } catch { setErreur('Dictée impossible pour le moment'); continuer.current = false }
  }

  const changerLangue = () => {
    const l = langue === 'fr-FR' ? 'en-US' : 'fr-FR'
    setLangue(l)
    try { localStorage.setItem(CLÉ_LANGUE, l) } catch { /* ignore */ }
    if (actif) démarrer(l)
  }

  const côté = grand ? 30 : 24
  const base = {
    height: `${côté}px`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    borderRadius: '7px', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, flexShrink: 0,
    fontSize: grand ? '13px' : '11px', border: `1px solid ${T.border}`,
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', minWidth: 0 }}>
      <button
        type="button" onMouseDown={e => e.preventDefault()} onClick={() => (actif ? arrêter() : démarrer())}
        aria-pressed={actif} aria-label={actif ? 'Arrêter la dictée' : 'Dicter (voix → texte)'}
        title={actif ? 'Arrêter la dictée' : `Dicter : la voix est transformée en texte (${LANGUES[langue]})`}
        style={{ ...base, padding: '0 8px', background: actif ? '#e2574c' : 'transparent', color: actif ? '#fff' : T.textMuted, borderColor: actif ? '#e2574c' : T.border }}
      >🎤{actif && <span>Stop</span>}</button>
      <button
        type="button" onMouseDown={e => e.preventDefault()} onClick={changerLangue}
        aria-label={`Langue de la dictée : ${langue === 'fr-FR' ? 'français' : 'anglais'} (toucher pour changer)`}
        title="Langue de la dictée : toucher pour passer du français à l'anglais"
        style={{ ...base, padding: '0 6px', background: 'transparent', color: T.text }}
      >{LANGUES[langue]}</button>
      {actif && (
        <span aria-live="polite" style={{ fontSize: '12px', color: T.textMuted, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
          {provisoire || (langue === 'fr-FR' ? 'Je t\'écoute…' : 'Listening…')}
        </span>
      )}
      {erreur && !actif && <span role="alert" style={{ fontSize: '12px', color: T.danger || '#e2574c' }}>{erreur}</span>}
    </span>
  )
}
