import { useState, useEffect, useRef } from 'react'
import { useTheme, grotesk, serif } from '../lib/theme'
import { TexteFormaté, texteBrut, direTexte, déverrouillerAudio, bip } from '../lib/texteFormate'
import { écouter, autoriserMicro, dictéeDisponible, useÉcranAllumé } from '../lib/ecoute'
import { vérifierMotsClés, normaliser } from '../lib/motsCles'
import Icon from './Icon'

function mélanger(tableau) {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

const SEUIL_RÉUSSIE = 0.7
const SEUIL_PARTIELLE = 0.4

// Commandes vocales reconnues à la place d'une réponse (phrases courtes).
export function détecterCommande(réponse) {
  const n = normaliser(réponse || '')
  if (!n) return 'vide'
  const court = n.split(' ').length <= 6
  if (/^(stop|arrete|arreter|arretez|fin|termine|fin de l entretien)$/.test(n)) return 'stop'
  if (court && /(repete|repeter|repetez|repetes|encore une fois|pardon|pas compris)/.test(n)) return 'répéter'
  if (court && /(je ne sais pas|je sais pas|j en sais rien|aucune idee|passe|passer|suivante)/.test(n)) return 'passer'
  return null
}

// Note une réponse orale à partir des mots-clés de la réponse attendue.
export function évaluerRéponse(verso, réponse) {
  const vérification = vérifierMotsClés(verso, réponse)
  if (vérification.length === 0) return { statut: 'àVérifier', ratio: null, vérification }
  const ratio = vérification.filter(v => v.trouvé).length / vérification.length
  const statut = ratio >= SEUIL_RÉUSSIE ? 'réussie' : ratio >= SEUIL_PARTIELLE ? 'partielle' : 'ratée'
  return { statut, ratio, vérification }
}

function correctionÀDire(carte, résultat) {
  const manquants = résultat.vérification.filter(v => !v.trouvé).map(v => texteBrut(v.motClé))
  const réponseComplète = `La réponse attendue : ${texteBrut(carte.verso)}`
  const listeManquants = manquants.slice(0, 6).join(', ')
  switch (résultat.statut) {
    case 'réussie': return manquants.length ? `Très bien. Il manquait seulement : ${listeManquants}.` : 'Très bien.'
    case 'partielle': return `Réponse incomplète. Il manquait : ${listeManquants}.`
    case 'ratée': return manquants.length ? `Ce n'est pas tout à fait ça. Il fallait dire : ${listeManquants}.` : réponseComplète
    case 'passée': return manquants.length ? `Question passée. Il fallait dire : ${listeManquants}.` : `Question passée. ${réponseComplète}`
    default: return réponseComplète
  }
}

const STATUTS = {
  réussie: { libellé: 'Réussie', emoji: '✓' },
  partielle: { libellé: 'Incomplète', emoji: '½' },
  ratée: { libellé: 'Ratée', emoji: '✗' },
  passée: { libellé: 'Passée', emoji: '⏭' },
  àVérifier: { libellé: 'À comparer', emoji: '?' },
}

export default function EntretienSimule({ cartes, titre, onFermer, onRetravailler }) {
  const T = useTheme()
  const couleurStatut = { réussie: '#7fb069', partielle: T.accent, ratée: T.danger, passée: T.textMuted, àVérifier: '#5b8dc9' }
  const [nombre, setNombre] = useState(Math.min(10, cartes.length))
  const [questionÉcrite, setQuestionÉcrite] = useState(true)
  const [phase, setPhase] = useState('réglages') // réglages | en cours | bilan
  const [liste, setListe] = useState([])
  const [index, setIndex] = useState(0)
  const [état, setÉtat] = useState('question') // question | écoute | saisie | correction
  const [transcription, setTranscription] = useState('')
  const [saisie, setSaisie] = useState('')
  const [dernierRésultat, setDernierRésultat] = useState(null)
  const [résultats, setRésultats] = useState([])

  const sessionRef = useRef(0)
  const écouteRef = useRef(null)
  const passerRef = useRef(false)
  const saisieRef = useRef(null)
  const résultatsRef = useRef([])

  useÉcranAllumé(phase === 'en cours')

  const tout_arrêter = () => {
    sessionRef.current += 1
    écouteRef.current?.arrêter()
    saisieRef.current?.('')
    window.speechSynthesis?.cancel()
  }
  useEffect(() => () => tout_arrêter(), [])

  const attendreSaisie = () => new Promise(resolve => { saisieRef.current = resolve })

  const dérouler = async questions => {
    const id = ++sessionRef.current
    const vivant = () => sessionRef.current === id
    résultatsRef.current = []
    setRésultats([])
    await direTexte(`Bonjour. Je vais vous poser ${questions.length} question${questions.length > 1 ? 's' : ''}. Répondez après le bip. Vous pouvez dire : répétez, je ne sais pas, ou stop.`)
    for (let i = 0; i < questions.length; i++) {
      if (!vivant()) return
      const carte = questions[i]
      setIndex(i)
      let résultat = null
      let répétitions = 0
      while (!résultat) {
        setÉtat('question')
        setTranscription('')
        setDernierRésultat(null)
        await direTexte(`Question ${i + 1}. ${texteBrut(carte.recto)}`)
        if (!vivant()) return
        passerRef.current = false
        let réponse = ''
        let manuel = !dictéeDisponible
        if (!manuel) {
          setÉtat('écoute')
          bip()
          try {
            const écoute = écouter({ surTexte: setTranscription })
            écouteRef.current = écoute
            réponse = await écoute.promesse
          } catch {
            manuel = true
          }
        }
        if (manuel) {
          setÉtat('saisie')
          setSaisie('')
          réponse = await attendreSaisie()
        }
        if (!vivant()) return
        const commande = passerRef.current ? 'passer' : détecterCommande(réponse)
        if (commande === 'stop') { terminer(id); return }
        if (commande === 'répéter' && répétitions < 3) { répétitions += 1; continue }
        résultat = commande === 'passer' || commande === 'vide'
          ? { ...évaluerRéponse(carte.verso, ''), statut: 'passée' }
          : évaluerRéponse(carte.verso, réponse)
        résultat = { ...résultat, carte, réponse: commande ? '' : réponse }
      }
      résultatsRef.current = [...résultatsRef.current, résultat]
      setRésultats(résultatsRef.current)
      setDernierRésultat(résultat)
      setÉtat('correction')
      await direTexte(correctionÀDire(carte, résultat))
      if (!vivant()) return
      await new Promise(r => setTimeout(r, 700))
    }
    if (vivant()) terminer(id)
  }

  const terminer = id => {
    if (id !== undefined && sessionRef.current !== id) return
    sessionRef.current += 1
    écouteRef.current?.arrêter()
    setPhase('bilan')
    const r = résultatsRef.current
    const réussies = r.filter(x => x.statut === 'réussie').length
    direTexte(r.length ? `Entretien terminé. ${réussies} réponse${réussies > 1 ? 's' : ''} réussie${réussies > 1 ? 's' : ''} sur ${r.length}.` : 'Entretien terminé.')
  }

  const commencer = async () => {
    déverrouillerAudio()
    const questions = mélanger(cartes).slice(0, nombre)
    setListe(questions)
    setPhase('en cours')
    setIndex(0)
    if (dictéeDisponible) await autoriserMicro()
    dérouler(questions)
  }

  const arrêterMaintenant = () => {
    window.speechSynthesis?.cancel()
    saisieRef.current?.('stop')
    terminer()
  }

  const bouton = (plein = false) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 14px',
    borderRadius: '12px', cursor: 'pointer', fontFamily: grotesk, fontSize: '13px', fontWeight: 600,
    background: plein ? T.accent : T.surface2, color: plein ? T.accentText : T.text,
    border: `1px solid ${plein ? T.accent : T.border}`,
  })

  const carte = liste[index]
  const àRevoir = résultats.filter(r => r.statut !== 'réussie')
  const réussies = résultats.filter(r => r.statut === 'réussie').length

  return (
    <div role="dialog" aria-label="Entretien simulé" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: T.bg, overflowY: 'auto', padding: '20px 16px 40px' }}>
      <style>{'@keyframes micPulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.12); opacity: .75 } } @media (prefers-reduced-motion: reduce) { .mic-anim { animation: none !important } }'}</style>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: T.accent, fontFamily: grotesk, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>🎙️ Entretien simulé</p>
            <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '20px', color: T.text }}>{titre}</strong>
          </div>
          <button onClick={() => { tout_arrêter(); onFermer() }} aria-label="Fermer" title="Fermer" style={{
            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer',
          }}><Icon nom="x" taille={14} /></button>
        </div>

        {phase === 'réglages' && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: T.textMuted, lineHeight: 1.6 }}>
              L'examinateur pose les questions à voix haute. Après le bip, réponds à voix haute ; il vérifie les mots-clés, te corrige et enchaîne. Tu peux dire <strong style={{ color: T.text }}>« répétez »</strong>, <strong style={{ color: T.text }}>« je ne sais pas »</strong> ou <strong style={{ color: T.text }}>« stop »</strong>.
            </p>
            <div>
              <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontFamily: grotesk }}>Nombre de questions</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[...new Set([5, 10, 20, cartes.length])].filter(n => n <= cartes.length && n > 0).map(n => (
                  <button key={n} onClick={() => setNombre(n)} style={{ ...bouton(nombre === n), flex: 1, padding: '10px 6px' }}>
                    {n === cartes.length ? `Toutes (${n})` : n}
                  </button>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: T.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={questionÉcrite} onChange={e => setQuestionÉcrite(e.target.checked)} style={{ accentColor: T.accent, width: '18px', height: '18px' }} />
              Afficher aussi la question à l'écran
            </label>
            {!dictéeDisponible && (
              <p style={{ margin: 0, fontSize: '12px', color: T.danger, lineHeight: 1.5 }}>
                La reconnaissance vocale n'est pas disponible sur ce navigateur : tu répondras en tapant ta réponse.
              </p>
            )}
            <button onClick={commencer} style={{ ...bouton(true), padding: '14px', fontSize: '15px' }}>🎙️ Commencer l'entretien</button>
            <p style={{ margin: 0, fontSize: '11.5px', color: T.textMuted, lineHeight: 1.5 }}>
              La correction se base sur les mots-clés : mets en <strong>gras</strong> l'essentiel de tes réponses pour une note plus juste. Garde l'app ouverte à l'écran pendant l'entretien.
            </p>
          </div>
        )}

        {phase === 'en cours' && carte && (
          <>
            <p style={{ textAlign: 'center', fontSize: '12px', color: T.textMuted, fontFamily: grotesk, margin: '0 0 10px' }}>
              Question {index + 1}/{liste.length} · {résultats.filter(r => r.statut === 'réussie').length} réussie{résultats.filter(r => r.statut === 'réussie').length > 1 ? 's' : ''}
            </p>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '24px 18px', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '18px' }}>
              <p style={{ fontFamily: serif, fontSize: '19px', lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>
                {questionÉcrite ? <TexteFormaté texte={carte.recto} couleurDéfaut={T.text} /> : <span style={{ color: T.textMuted }}>Écoute la question…</span>}
              </p>

              {état === 'question' && <p style={{ margin: 0, fontSize: '13px', color: T.textMuted }}>🗣️ L'examinateur parle…</p>}

              {état === 'écoute' && (
                <div aria-live="polite">
                  <div className="mic-anim" style={{
                    width: '72px', height: '72px', margin: '0 auto 10px', borderRadius: '50%', background: T.dangerSoft,
                    border: `2px solid ${T.danger}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px',
                    animation: 'micPulse 1.4s ease-in-out infinite',
                  }}>🎤</div>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', color: T.danger, fontWeight: 600, fontFamily: grotesk }}>À toi, je t'écoute…</p>
                  <p style={{ margin: 0, fontSize: '14px', color: T.text, minHeight: '20px', fontStyle: transcription ? 'normal' : 'italic' }}>
                    {transcription || '…'}
                  </p>
                </div>
              )}

              {état === 'saisie' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    autoFocus value={saisie} onChange={e => setSaisie(e.target.value)} rows={3}
                    placeholder="Tape ta réponse…"
                    style={{ width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px', fontSize: '14px', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => saisieRef.current?.('je ne sais pas')} style={{ ...bouton(), flex: 1 }}>Je ne sais pas</button>
                    <button onClick={() => saisieRef.current?.(saisie)} style={{ ...bouton(true), flex: 1 }}>Valider</button>
                  </div>
                </div>
              )}

              {état === 'correction' && dernierRésultat && (
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, fontFamily: grotesk, color: couleurStatut[dernierRésultat.statut] }}>
                    {STATUTS[dernierRésultat.statut].emoji} {STATUTS[dernierRésultat.statut].libellé}
                    {dernierRésultat.ratio !== null && dernierRésultat.statut !== 'passée' ? ` · ${Math.round(dernierRésultat.ratio * 100)} %` : ''}
                  </p>
                  {dernierRésultat.vérification.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                      {dernierRésultat.vérification.map(({ motClé, trouvé }) => (
                        <span key={motClé} style={{
                          fontSize: '11.5px', padding: '3px 9px', borderRadius: '20px', fontFamily: grotesk,
                          background: trouvé ? T.accentSoft : T.dangerSoft, color: trouvé ? T.accent : T.danger,
                          border: `1px solid ${trouvé ? T.accent : T.danger}55`,
                        }}>{trouvé ? '✓' : '✗'} {texteBrut(motClé)}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              {état === 'écoute' && (
                <>
                  <button onClick={() => { passerRef.current = true; écouteRef.current?.arrêter() }} style={{ ...bouton(), flex: 1 }}>Je ne sais pas</button>
                  <button onClick={() => écouteRef.current?.arrêter()} style={{ ...bouton(true), flex: 1 }}>J'ai fini</button>
                </>
              )}
              <button onClick={arrêterMaintenant} style={{ ...bouton(), flex: état === 'écoute' ? '0 0 auto' : 1, color: T.danger }}>⏹ Stop</button>
            </div>
          </>
        )}

        {phase === 'bilan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '38px', margin: '0 0 6px' }}>{résultats.length && réussies / résultats.length >= SEUIL_RÉUSSIE ? '🎉' : '📋'}</p>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '22px', color: T.text, margin: '0 0 4px' }}>Bilan de l'entretien</p>
              <p style={{ margin: 0, fontSize: '14px', color: T.textMuted }}>
                {réussies}/{résultats.length} réponse{résultats.length > 1 ? 's' : ''} réussie{réussies > 1 ? 's' : ''}
              </p>
            </div>

            {résultats.map((r, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${couleurStatut[r.statut]}`, borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <p style={{ flex: 1, margin: 0, fontSize: '13.5px', fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{texteBrut(r.carte.recto)}</p>
                  <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, fontFamily: grotesk, color: couleurStatut[r.statut] }}>
                    {STATUTS[r.statut].emoji} {STATUTS[r.statut].libellé}
                  </span>
                </div>
                {r.réponse && <p style={{ margin: '6px 0 0', fontSize: '12px', color: T.textMuted, fontStyle: 'italic' }}>Tu as dit : « {r.réponse} »</p>}
                {r.vérification.some(v => !v.trouvé) && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: T.danger }}>
                    Manquait : {r.vérification.filter(v => !v.trouvé).map(v => texteBrut(v.motClé)).join(', ')}
                  </p>
                )}
                {r.statut === 'àVérifier' && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: T.text }}>Réponse attendue : {texteBrut(r.carte.verso)}</p>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {àRevoir.length > 0 && (
                <button onClick={() => onRetravailler(àRevoir.map(r => r.carte.id))} style={bouton(true)}>
                  Retravailler les {àRevoir.length} question{àRevoir.length > 1 ? 's' : ''} à revoir
                </button>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setPhase('réglages')} style={{ ...bouton(), flex: 1 }}>↻ Nouvel entretien</button>
                <button onClick={onFermer} style={{ ...bouton(), flex: 1 }}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
