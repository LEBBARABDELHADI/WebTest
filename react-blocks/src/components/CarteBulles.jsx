import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { useTheme, grotesk, serif, PALETTE } from '../lib/theme'
import { analyserTexte, texteBrut, TexteFormaté, lireTexte } from '../lib/texteFormate'
import Icon from './Icon'

function nettoyerMorceau(morceau) {
  let t = morceau.trim().replace(/^[-•–:,;\s]+/, '').replace(/[\s:;,]+$/, '')
  // Un passage en gras coupé en deux laisserait des ** orphelins.
  if ((t.match(/\*\*/g) || []).length % 2) t = t.replace(/\*\*/g, '')
  return t.trim()
}

// Découpe une réponse en bulles, du découpage le plus explicite au plus
// approximatif : puces/retours à la ligne, phrases, virgules, passages en
// gras, puis mots pour une réponse très courte (« Liberté égalité
// Fraternité »). Une réponse indécoupable reste une seule bulle.
export function découperRéponse(verso) {
  const brut = verso || ''
  const essais = [
    () => brut.split(/\n+|(?:^|\s)[-•–](?!>)\s*|;/),
    () => brut.replace(/([.!?])\s+/g, '$1\u0000').split('\u0000'),
    () => brut.split(/,\s*/),
    () => analyserTexte(brut).filter(s => s.gras).map(s => s.texte),
  ]
  for (const essai of essais) {
    const morceaux = essai().map(nettoyerMorceau).filter(m => texteBrut(m).trim())
    if (morceaux.length >= 2) return morceaux
  }
  const mots = texteBrut(brut).trim().split(/\s+/).filter(Boolean)
  if (mots.length >= 2 && mots.length <= 4) return mots
  return [brut.trim()]
}

const ANIMATIONS = `
@keyframes bulleApparait { from { opacity: 0; transform: scale(.3) } 70% { transform: scale(1.08) } to { opacity: 1; transform: scale(1) } }
@keyframes bulleFlotte { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes traitSeDessine { from { stroke-dasharray: 1; stroke-dashoffset: 1 } to { stroke-dasharray: 1; stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .bulle-anim, .trait-anim { animation: none !important } }
`

const DÉLAI_TRAIT = 0.35
const DÉLAI_BULLE = 0.75
const PAS = 0.14

function animationBulle(i) {
  const d = DÉLAI_BULLE + i * PAS
  return `bulleApparait .5s cubic-bezier(.2,.8,.3,1.2) ${d}s both, bulleFlotte ${3 + (i % 3) * 0.4}s ease-in-out ${d + 0.6}s infinite`
}

export default function CarteBulles({ carte, onFermer }) {
  const T = useTheme()
  const morceaux = découperRéponse(carte.verso)
  const radial = morceaux.length >= 2 && morceaux.length <= 6 && morceaux.every(m => texteBrut(m).length <= 45)
  const [lecture, setLecture] = useState(0) // change pour rejouer l'animation
  const [choisi, setChoisi] = useState(null) // -1 = question, sinon index de bulle

  useEffect(() => {
    const surTouche = e => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  const couleur = i => PALETTE[(i + 2) % PALETTE.length]
  const texteChoisi = choisi === -1 ? carte.recto : choisi !== null ? morceaux[choisi] : null

  return (
    <div
      role="dialog"
      aria-label="Carte en bulles"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: T.bg, overflowY: 'auto', padding: '20px 16px 40px' }}
    >
      <style>{ANIMATIONS}</style>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '20px', color: T.text }}>
            Carte en bulles
          </strong>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { setLecture(l => l + 1); setChoisi(null) }} style={{
              display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontFamily: grotesk, fontWeight: 600,
              background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '20px', padding: '6px 12px', cursor: 'pointer',
            }}><Icon nom="repeter" taille={12} /> Rejouer</button>
            <button onClick={onFermer} aria-label="Fermer" title="Fermer" style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer',
            }}><Icon nom="x" taille={14} /></button>
          </div>
        </div>

        {radial
          ? <GrapheRadial key={lecture} T={T} carte={carte} morceaux={morceaux} couleur={couleur} choisi={choisi} setChoisi={setChoisi} />
          : <GrapheArbre key={lecture} T={T} carte={carte} morceaux={morceaux} couleur={couleur} choisi={choisi} setChoisi={setChoisi} />}

        <div style={{
          marginTop: '18px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px',
          minHeight: '54px',
        }}>
          {texteChoisi ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <p style={{ flex: 1, margin: 0, fontSize: '14px', lineHeight: '1.55', wordBreak: 'break-word' }}>
                <TexteFormaté texte={texteChoisi} couleurDéfaut={T.text} />
              </p>
              <button
                onClick={() => lireTexte(texteChoisi, { réponse: choisi !== -1 })}
                title="Écouter"
                style={{
                  width: '30px', height: '30px', flexShrink: 0, background: 'transparent', color: T.text,
                  border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
                }}
              >🔊</button>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: T.textMuted, textAlign: 'center' }}>
              {morceaux.length} bulle{morceaux.length > 1 ? 's' : ''} de réponse — touche une bulle pour lire son texte en entier.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function BulleQuestion({ T, carte, choisi, setChoisi, compacte }) {
  return (
    <button
      className="bulle-anim"
      onClick={() => setChoisi(-1)}
      style={{
        animation: 'bulleApparait .5s cubic-bezier(.2,.8,.3,1.2) 0s both',
        display: 'block', width: '100%', padding: compacte ? '12px 10px' : '16px 14px', borderRadius: '22px',
        background: T.accent, color: T.accentText, border: `2px solid ${choisi === -1 ? T.text : T.accent}`,
        boxShadow: `0 6px 22px ${T.accent}55`, cursor: 'pointer', fontFamily: serif,
        fontSize: compacte ? '14px' : '16px', fontWeight: 600, lineHeight: 1.3, textAlign: 'center',
      }}
    >
      <span style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {texteBrut(carte.recto)}
      </span>
    </button>
  )
}

function BulleRéponse({ T, texte, i, couleur, choisi, setChoisi, lignes, gauche = false }) {
  const c = couleur(i)
  return (
    <button
      className="bulle-anim"
      onClick={() => setChoisi(i)}
      style={{
        animation: animationBulle(i),
        display: 'block', width: '100%', padding: '10px 12px', borderRadius: '18px',
        background: `linear-gradient(${c}26, ${c}26), ${T.surface}`, color: T.text, border: `2px solid ${choisi === i ? T.text : c}`,
        boxShadow: `0 4px 14px ${c}33`, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', lineHeight: 1.35, textAlign: gauche ? 'left' : 'center',
      }}
    >
      <span style={{ display: '-webkit-box', WebkitLineClamp: lignes, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
        <TexteFormaté texte={texte} couleurDéfaut={T.text} />
      </span>
    </button>
  )
}

// Réponses courtes : bulles en cercle autour de la question.
function GrapheRadial({ T, carte, morceaux, couleur, choisi, setChoisi }) {
  const n = morceaux.length
  const positions = morceaux.map((_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
    return { x: 50 + 34 * Math.cos(angle), y: 50 + 37 * Math.sin(angle) }
  })
  return (
    <div style={{ position: 'relative', height: '360px' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        {positions.map((p, i) => (
          <line
            key={i} x1="50" y1="50" x2={p.x} y2={p.y} pathLength="1"
            className="trait-anim"
            stroke={couleur(i)} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke"
            style={{ animation: `traitSeDessine .5s ease-out ${DÉLAI_TRAIT + i * PAS}s both`, opacity: 0.7 }}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: '34%', transform: 'translate(-50%, -50%)' }}>
        <BulleQuestion T={T} carte={carte} choisi={choisi} setChoisi={setChoisi} compacte />
      </div>
      {positions.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: '30%', transform: 'translate(-50%, -50%)' }}>
          <BulleRéponse T={T} texte={morceaux[i]} i={i} couleur={couleur} choisi={choisi} setChoisi={setChoisi} lignes={3} />
        </div>
      ))}
    </div>
  )
}

// Réponses longues ou nombreuses : la question en haut, puis les bulles en
// colonne, chacune reliée par une branche à un tronc vertical (aucun trait
// ne croise une bulle). Les positions sont mesurées à l'écran, puisque la
// hauteur des bulles dépend de la longueur des textes.
const X_TRONC = 26
const RETRAIT = 48

function GrapheArbre({ T, carte, morceaux, couleur, choisi, setChoisi }) {
  const conteneurRef = useRef(null)
  const questionRef = useRef(null)
  const bullesRef = useRef([])
  const [tracé, setTracé] = useState({ largeur: 0, hauteur: 0, tronc: '', branches: [] })

  useLayoutEffect(() => {
    const calculer = () => {
      const conteneur = conteneurRef.current
      const question = questionRef.current
      if (!conteneur || !question) return
      const base = conteneur.getBoundingClientRect()
      const qy = question.getBoundingClientRect().bottom - base.top
      const points = bullesRef.current.slice(0, morceaux.length).filter(Boolean).map(el => {
        const b = el.getBoundingClientRect()
        return { x: b.left - base.left, y: b.top + b.height / 2 - base.top }
      })
      if (points.length === 0) return
      const branches = points.map(({ x, y }) =>
        `M ${X_TRONC} ${y - 14} Q ${X_TRONC} ${y} ${X_TRONC + 14} ${y} L ${x} ${y}`)
      setTracé({
        largeur: base.width,
        hauteur: base.height,
        tronc: `M ${X_TRONC} ${qy} L ${X_TRONC} ${points.at(-1).y - 14}`,
        branches,
      })
    }
    calculer()
    const observateur = new ResizeObserver(calculer)
    observateur.observe(conteneurRef.current)
    return () => observateur.disconnect()
  }, [morceaux.length])

  return (
    <div ref={conteneurRef} style={{ position: 'relative' }}>
      <svg
        width={tracé.largeur} height={tracé.hauteur}
        style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
      >
        {tracé.tronc && (
          <path
            d={tracé.tronc} pathLength="1" fill="none" className="trait-anim"
            stroke={T.textMuted} strokeWidth="2.5" strokeLinecap="round"
            style={{ animation: `traitSeDessine .6s ease-out ${DÉLAI_TRAIT}s both`, opacity: 0.6 }}
          />
        )}
        {tracé.branches.map((d, i) => (
          <path
            key={i} d={d} pathLength="1" fill="none" className="trait-anim"
            stroke={couleur(i)} strokeWidth="2.5" strokeLinecap="round"
            style={{ animation: `traitSeDessine .4s ease-out ${DÉLAI_TRAIT + 0.3 + i * PAS}s both`, opacity: 0.85 }}
          />
        ))}
      </svg>
      <div ref={questionRef} style={{ position: 'relative', marginBottom: '26px' }}>
        <BulleQuestion T={T} carte={carte} choisi={choisi} setChoisi={setChoisi} />
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px', marginLeft: `${RETRAIT}px` }}>
        {morceaux.map((m, i) => (
          <div key={i} ref={el => { bullesRef.current[i] = el }}>
            <BulleRéponse T={T} texte={m} i={i} couleur={couleur} choisi={choisi} setChoisi={setChoisi} lignes={3} gauche />
          </div>
        ))}
      </div>
    </div>
  )
}
