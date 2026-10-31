import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { grotesk } from '../lib/theme'
import { rechercherPartout } from '../lib/donneesFoyer'

const ICÔNES_RÉSULTAT = { tâche: 'checklist', note: 'note', carte: 'cartes', graphe: 'reseau', bulle: 'reseau', section: 'texte', tableau: 'reseau' }
const NOMS_RÉSULTAT = { tâche: 'Tâches', note: 'Notes', carte: 'Cartes', graphe: 'Graphes', bulle: 'Bulles', section: 'Sections de graphe', tableau: 'Graphe amélioré' }

// Palette de recherche : un champ, des résultats groupés, ↑ ↓ Entrée.
export default function RechercheGlobale({ T, lire, foyer, onFermer, onChoisir, titre }) {
  const [q, setQ] = useState('')
  const [actif, setActif] = useState(0)
  const [copié, setCopié] = useState(null)
  const copier = (e, r, i) => { e.stopPropagation(); navigator.clipboard?.writeText(r.code).catch(() => {}); setCopié(i); setTimeout(() => setCopié(c => (c === i ? null : c)), 1500) }
  const naviguer = useNavigate()
  const listeRef = useRef(null)
  const résultats = rechercherPartout(lire, foyer, q)
  // Mode « choisir » (pour lier un élément) : on renvoie le résultat.
  const ouvrir = r => { onFermer(); if (onChoisir) onChoisir(r); else naviguer(r.lien) }
  useEffect(() => { setActif(0) }, [q])
  useEffect(() => { listeRef.current?.querySelector('[data-actif="oui"]')?.scrollIntoView({ block: 'nearest' }) }, [actif])
  const surTouche = e => {
    if (e.key === 'Escape') { e.preventDefault(); onFermer() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActif(a => Math.min(résultats.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActif(a => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && résultats[actif]) { e.preventDefault(); ouvrir(résultats[actif]) }
  }
  let groupePrécédent = null
  return (
    <div role="dialog" aria-label="Recherche globale" onClick={onFermer} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'max(12px, env(safe-area-inset-top)) 12px 12px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '640px', marginTop: 'min(10vh, 80px)', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.45)' }}>
        {titre && <p style={{ margin: 0, padding: '10px 14px 0', fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>{titre}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={surTouche} placeholder="Tâches, notes, cartes, commandes, graphes…" aria-label="Rechercher partout"
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: '16px' }} />
          <button onClick={onFermer} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '6px', color: T.textMuted, fontSize: '11px', padding: '2px 6px', cursor: 'pointer', fontFamily: grotesk }}>Échap</button>
        </div>
        <div ref={listeRef} style={{ maxHeight: '60dvh', overflowY: 'auto', padding: '6px' }}>
          {q.trim().length < 2 && <p style={{ margin: 0, padding: '14px', fontSize: '13px', color: T.textMuted }}>Tape au moins 2 lettres. La recherche couvre Perso et Pro de {foyer.nom}.</p>}
          {q.trim().length >= 2 && résultats.length === 0 && <p style={{ margin: 0, padding: '14px', fontSize: '13px', color: T.textMuted }}>Aucun résultat pour « {q} ».</p>}
          {résultats.map((r, i) => {
            const nouveauGroupe = r.type !== groupePrécédent
            groupePrécédent = r.type
            return (
              <div key={`${r.lien}-${i}`}>
                {nouveauGroupe && <p style={{ margin: '8px 10px 4px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, fontFamily: grotesk }}>{NOMS_RÉSULTAT[r.type]}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '10px', background: i === actif ? T.surface2 : 'transparent' }}>
                <button data-actif={i === actif ? 'oui' : 'non'} onMouseEnter={() => setActif(i)} onClick={() => ouvrir(r)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  flex: 1, minWidth: 0, background: 'transparent', color: T.text,
                }}>
                  <span style={{ color: i === actif ? T.accent : T.textMuted }}><Icon nom={ICÔNES_RÉSULTAT[r.type]} taille={16} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titre || '(sans titre)'}</span>
                    {r.extrait && <span style={{ display: 'block', fontSize: '12px', color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.extrait}</span>}
                  </span>
                  <span style={{ fontSize: '11px', color: T.textMuted, flexShrink: 0, fontFamily: grotesk }}>{r.espace}</span>
                </button>
                {r.code && (
                  <button title={`Copier : ${r.code.split('\n')[0].slice(0, 60)}`} aria-label="Copier le code" onClick={e => copier(e, r, i)}
                    style={{ flexShrink: 0, minWidth: 40, height: 36, marginRight: 6, padding: '0 8px', borderRadius: '8px', fontSize: '13px', fontFamily: grotesk, fontWeight: 600, cursor: 'pointer', background: copié === i ? '#2e9e6b22' : T.bg, color: copié === i ? '#2e9e6b' : T.text, border: `1px solid ${copié === i ? '#2e9e6b' : T.border}` }}>
                    {copié === i ? '✓' : '📋'}
                  </button>
                )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
