import { useState } from 'react'
import { Link } from 'react-router-dom'
import { grotesk } from '../lib/theme'
import { lireLocal, ajouterCartes } from '../lib/donneesFoyer'
import { VARIANTES } from './SectionsGraphe'

// Propose des cartes Mémoriser à partir de blocs (sous-section du graphe ou
// note). Règles :
//  - une ligne « question :: réponse » donne une carte ;
//  - un texte, un encadré ou un bloc de code : titre → contenu ;
//  - une liste (ou des tâches) : « titre : quels éléments ? » → la liste ;
//  - un tableau : une carte par rangée (1re case → les autres, avec en-têtes).
export function proposerCartes(titre, blocs) {
  const cartes = []
  const tâches = []
  const viderTâches = () => {
    if (tâches.length) cartes.push({ recto: `${titre} : quels éléments ?`, verso: tâches.map(t => `• ${t}`).join('\n') })
    tâches.length = 0
  }
  blocs.forEach(b => {
    if (b.type === 'tache') { if (b.texte?.trim()) tâches.push(b.texte.trim()); return }
    viderTâches()
    const texte = (b.texte ?? b.contenu ?? '').trim()
    if (b.type === 'liste') {
      const é = (b.éléments || []).map(x => x.texte).filter(Boolean)
      if (é.length) cartes.push({ recto: `${titre} : quels éléments ?`, verso: é.map(t => `• ${t}`).join('\n') })
    } else if (b.type === 'tableau') {
      const [entête = [], ...lignes] = b.lignes || []
      lignes.forEach(l => {
        if (!l[0]) return
        cartes.push({ recto: `${titre} — ${l[0]}`, verso: l.slice(1).map((v, j) => `${entête[j + 1] ? `**${entête[j + 1]}** : ` : ''}${v}`).join('\n') })
      })
    } else if (b.type === 'code') {
      if (texte) cartes.push({ recto: `${titre}${b.langage ? ` (${b.langage})` : ''}`, verso: texte })
    } else if (b.type === 'encadré') {
      if (texte) cartes.push({ recto: `${titre} — ${(VARIANTES[b.variante] || VARIANTES.astuce).nom} ?`, verso: texte })
    } else if (texte) {
      const paires = texte.split('\n').map(l => l.split(/\s*::\s*/)).filter(p => p.length >= 2 && p[0].trim() && p[1].trim())
      if (paires.length) paires.forEach(([q, ...r]) => cartes.push({ recto: q.trim(), verso: r.join(' :: ').trim() }))
      else cartes.push({ recto: titre, verso: texte })
    }
  })
  viderTâches()
  return cartes
}

export default function VersCartes({ T, titre, blocs, foyer, espaceParDéfaut, onFermer }) {
  const propositions = proposerCartes(titre, blocs)
  const [choisies, setChoisies] = useState(() => new Set(propositions.map((_, i) => i)))
  const [espace, setEspace] = useState(espaceParDéfaut)
  const paquets = lireLocal('memoriser', espace).paquets || []
  const [paquetId, setPaquetId] = useState('nouveau')
  const [nom, setNom] = useState(titre)
  const [état, setÉtat] = useState(null) // { envoi } | { ok, paquet, nombre } | { erreur }
  const basculer = i => setChoisies(s => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })
  const créer = async () => {
    setÉtat({ envoi: true })
    try {
      const r = await ajouterCartes({ espace, paquetId: paquetId === 'nouveau' ? null : paquetId, nouveauPaquet: nom, cartes: propositions.filter((_, i) => choisies.has(i)) })
      setÉtat({ ok: true, ...r })
    } catch (err) { setÉtat({ erreur: err.message }) }
  }
  const champ = { fontSize: '13px', fontFamily: grotesk, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '6px 8px' }
  return (
    <div role="dialog" aria-label="Créer des cartes Mémoriser" onKeyDown={e => { if (e.key === 'Escape') onFermer() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '560px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px', marginTop: 'max(10px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{ flex: 1, margin: 0, fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>🧠 Cartes depuis « {titre} »</p>
          <button onClick={onFermer} aria-label="Fermer" style={{ background: 'transparent', border: 'none', color: T.textMuted, fontSize: '17px', cursor: 'pointer' }}>✕</button>
        </div>
        {état?.ok ? (
          <div style={{ padding: '10px 0' }}>
            <p style={{ margin: '0 0 12px', fontSize: '15px', color: T.text }}>✓ {état.nombre} carte{état.nombre > 1 ? 's' : ''} ajoutée{état.nombre > 1 ? 's' : ''} au paquet <strong>{état.paquet.nom}</strong>, à réviser dès aujourd'hui.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to={`/memoriser/${espace}`} style={{ padding: '10px 14px', borderRadius: '10px', background: T.accent, color: T.accentText, fontWeight: 700, fontFamily: grotesk, textDecoration: 'none' }}>Ouvrir Mémoriser</Link>
              <button onClick={onFermer} style={{ padding: '10px 14px', borderRadius: '10px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: grotesk, fontWeight: 600 }}>Fermer</button>
            </div>
          </div>
        ) : propositions.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: '13.5px' }}>Aucun contenu à transformer en cartes. Astuce : écris des lignes « question :: réponse ».</p>
        ) : (
          <>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: T.textMuted, lineHeight: 1.5 }}>Décoche celles que tu ne veux pas. Astuce : une ligne « question :: réponse » donne une carte.</p>
            <div style={{ maxHeight: '42dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {propositions.map((c, i) => (
                <label key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 10px', borderRadius: '10px', background: T.surface2, cursor: 'pointer', opacity: choisies.has(i) ? 1 : 0.5 }}>
                  <input type="checkbox" checked={choisies.has(i)} onChange={() => basculer(i)} style={{ marginTop: '3px', accentColor: T.accent }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: T.text }}>{c.recto}</span>
                    <span style={{ display: 'block', fontSize: '12.5px', color: T.textMuted, whiteSpace: 'pre-wrap', maxHeight: '4.2em', overflow: 'hidden' }}>{c.verso.replace(/\*\*/g, '')}</span>
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
              <select value={espace} onChange={e => { setEspace(e.target.value); setPaquetId('nouveau') }} aria-label="Espace" style={champ}>
                <option value={`${foyer.préfixe}perso`}>Mémoriser perso</option>
                <option value={`${foyer.préfixe}pro`}>Mémoriser pro</option>
              </select>
              <select value={paquetId} onChange={e => setPaquetId(e.target.value)} aria-label="Paquet" style={champ}>
                <option value="nouveau">＋ Nouveau paquet</option>
                {paquets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
              {paquetId === 'nouveau' && <input value={nom} onChange={e => setNom(e.target.value)} aria-label="Nom du nouveau paquet" style={{ ...champ, flex: 1, minWidth: '140px' }} />}
            </div>
            {état?.erreur && <p style={{ color: T.danger, fontSize: '13px', margin: '0 0 8px' }}>{état.erreur}</p>}
            <button onClick={créer} disabled={!choisies.size || état?.envoi} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: '14px',
              background: choisies.size ? T.accent : T.surface2, color: choisies.size ? T.accentText : T.textMuted,
            }}>{état?.envoi ? 'Création…' : `Créer ${choisies.size} carte${choisies.size > 1 ? 's' : ''}`}</button>
          </>
        )}
      </div>
    </div>
  )
}
