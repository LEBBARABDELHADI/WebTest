import { useState, useEffect } from 'react'
import { grotesk } from '../lib/theme'
import { lireOutil, ajouterCartes } from '../lib/donneesFoyer'
import { listerVersions, lireVersion } from '../lib/githubSync'
import { colonnesDe } from './SectionsGraphe'
import { texteBrut } from '../lib/texteFormate'
import { ICÔNES, grapheVersÉléments, blocsVersÉléments } from '../lib/tableauOutils'
import { bip } from '../lib/texteFormate'

// Fenêtres du « Graphe amélioré » (tableau blanc), en bas d'écran sur
// téléphone, centrées sur ordinateur.
export function Fenêtre({ titre, onFermer, children, UI, large = false }) {
  useEffect(() => {
    const f = e => { if (e.key === 'Escape') { e.stopPropagation(); onFermer() } }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [onFermer])
  return (
    <div role="dialog" aria-label={titre} onPointerDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) onFermer() }}
      style={{ position: 'absolute', inset: 0, zIndex: 47, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: large ? 860 : 520, maxHeight: '86dvh', overflowY: 'auto', background: UI.barre, color: UI.texte, borderRadius: '22px 22px 0 0', padding: '14px 16px max(20px, env(safe-area-inset-bottom))', fontFamily: grotesk }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <strong style={{ flex: 1, fontSize: 19 }}>{titre}</strong>
          <button onClick={onFermer} aria-label="Fermer" style={{ width: 40, height: 40, border: 'none', borderRadius: 12, background: 'transparent', color: UI.texte, fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
const bouton = (UI, principal = false) => ({
  padding: '10px 14px', borderRadius: 10, border: principal ? 'none' : `1px solid ${UI.bord}`, background: principal ? UI.accent : 'transparent',
  color: principal ? '#fff' : UI.texte, fontWeight: 700, fontFamily: grotesk, fontSize: 14, cursor: 'pointer',
})
const ligneListe = UI => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 12px', border: `1px solid ${UI.bord}`, borderRadius: 12, background: 'transparent', color: UI.texte, cursor: 'pointer', fontFamily: grotesk, fontSize: 15 })

// Coller une liste : chaque ligne devient un pense-bête.
export function DialogueListe({ UI, onValider, onFermer }) {
  const [texte, setTexte] = useState('')
  return (
    <Fenêtre titre="📋 Coller une liste" onFermer={onFermer} UI={UI}>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: UI.doux }}>Une ligne = un pense-bête (les tirets et numéros sont retirés).</p>
      <textarea autoFocus value={texte} onChange={e => setTexte(e.target.value)} rows={8} aria-label="Liste à coller" placeholder={'Idée 1\nIdée 2\nIdée 3'}
        style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${UI.bord}`, borderRadius: 12, padding: 12, fontSize: 15, fontFamily: grotesk, background: UI.fond, color: UI.texte }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <button onClick={onFermer} style={bouton(UI)}>Annuler</button>
        <button onClick={() => onValider(texte)} disabled={!texte.trim()} style={bouton(UI, true)}>Créer les pense-bêtes</button>
      </div>
    </Fenêtre>
  )
}

export function DialogueIcônes({ UI, onChoisir, onFermer }) {
  return (
    <Fenêtre titre="🧩 Icônes techniques" onFermer={onFermer} UI={UI}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8 }}>
        {ICÔNES.map(([e, n]) => (
          <button key={n} onClick={() => onChoisir(e, n)} style={{ ...ligneListe(UI), flexDirection: 'column', gap: 4, padding: '12px 6px', fontSize: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{e}</span>{n}
          </button>
        ))}
      </div>
    </Fenêtre>
  )
}

// Pense-bête → carte Mémoriser (question / réponse, paquet).
export function DialogueCarte({ UI, espace, texte, onFait, onFermer }) {
  const [recto, verso] = (() => {
    const t = texte || ''
    const parts = t.split(/\s*(?:::|=>|→)\s*/)
    if (parts.length > 1) return [parts[0], parts.slice(1).join(' ')]
    const [premier, ...reste] = t.split('\n')
    return [premier, reste.join('\n')]
  })()
  const [r, setR] = useState(recto), [v, setV] = useState(verso)
  const [paquets, setPaquets] = useState(null)
  const [paquetId, setPaquetId] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [erreur, setErreur] = useState('')
  useEffect(() => { lireOutil('memoriser', espace).then(d => { setPaquets(d.paquets || []); setPaquetId(d.paquets?.[0]?.id || '__nouveau') }) }, [espace])
  const valider = async () => {
    try { await ajouterCartes({ espace, paquetId: paquetId === '__nouveau' ? null : paquetId, nouveauPaquet: nouveau || 'Graphe amélioré', cartes: [{ recto: r, verso: v }] }); onFait() }
    catch (e) { setErreur(e.message) }
  }
  const champ = { width: '100%', boxSizing: 'border-box', border: `1px solid ${UI.bord}`, borderRadius: 10, padding: 10, fontSize: 15, fontFamily: grotesk, background: UI.fond, color: UI.texte, marginTop: 4 }
  return (
    <Fenêtre titre="🧠 Créer une carte Mémoriser" onFermer={onFermer} UI={UI}>
      <label style={{ fontSize: 13, color: UI.doux }}>Question (recto)<textarea value={r} onChange={e => setR(e.target.value)} rows={2} style={champ} /></label>
      <label style={{ fontSize: 13, color: UI.doux, display: 'block', marginTop: 8 }}>Réponse (verso)<textarea value={v} onChange={e => setV(e.target.value)} rows={3} style={champ} /></label>
      <label style={{ fontSize: 13, color: UI.doux, display: 'block', marginTop: 8 }}>Paquet
        <select value={paquetId} onChange={e => setPaquetId(e.target.value)} style={champ}>
          {(paquets || []).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          <option value="__nouveau">＋ Nouveau paquet…</option>
        </select>
      </label>
      {paquetId === '__nouveau' && <input value={nouveau} onChange={e => setNouveau(e.target.value)} placeholder="Nom du nouveau paquet" style={champ} />}
      {erreur && <p style={{ color: '#d33', fontSize: 13 }}>{erreur}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button onClick={onFermer} style={bouton(UI)}>Annuler</button>
        <button onClick={valider} disabled={!r.trim() || !v.trim() || !paquets} style={bouton(UI, true)}>Créer la carte</button>
      </div>
    </Fenêtre>
  )
}

// Importer un graphe, ou insérer une note / une sous-section du graphe.
export function DialogueImport({ UI, espace, mode, onInsérer, onFermer }) {
  const [graphes, setGraphes] = useState(null)
  const [notes, setNotes] = useState(null)
  useEffect(() => {
    lireOutil('graph', espace).then(d => setGraphes(d.graphes || []))
    if (mode === 'insérer') lireOutil('notes', espace).then(d => setNotes((d.notes || []).filter(n => !n.archivée)))
  }, [espace, mode])
  if (mode === 'graphe') {
    return (
      <Fenêtre titre="⬇️ Importer un graphe" onFermer={onFermer} UI={UI}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: UI.doux }}>Les bulles deviennent des pense-bêtes et des formes, les branches des lignes courbes, le code des blocs de code.</p>
        {!graphes && <p style={{ color: UI.doux }}>Chargement…</p>}
        {graphes?.length === 0 && <p style={{ color: UI.doux }}>Aucun graphe dans cet espace.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(graphes || []).map(g => (
            <button key={g.id} onClick={() => onInsérer(grapheVersÉléments(g), `Graphe « ${g.nom} » importé`)} style={ligneListe(UI)}>
              <span style={{ fontSize: 22 }}>🕸️</span><span style={{ flex: 1 }}>{g.nom}</span><span style={{ fontSize: 12, color: UI.doux }}>{(g.noeuds || []).length} bulles</span>
            </button>
          ))}
        </div>
      </Fenêtre>
    )
  }
  const sousSections = (graphes || []).flatMap(g => colonnesDe(g).flatMap(c => c.sousSections.map(ss => ({ ss, g, c }))))
  return (
    <Fenêtre titre="📥 Insérer une note ou une fiche" onFermer={onFermer} UI={UI} large>
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: UI.doux }}>Notes</p>
      {!notes && <p style={{ color: UI.doux }}>Chargement…</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 14 }}>
        {(notes || []).map(n => (
          <button key={n.id} onClick={() => onInsérer(blocsVersÉléments(n.titre || 'Note', n.blocs || []), `Note « ${n.titre} » insérée`)} style={ligneListe(UI)}>
            <span>📝</span><span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.titre || 'Sans titre'}</span>
          </button>
        ))}
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: UI.doux }}>Fiches du graphe (sous-sections)</p>
      {graphes && !sousSections.length && <p style={{ color: UI.doux }}>Aucune sous-section.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {sousSections.map(({ ss, g, c }) => (
          <button key={ss.id} onClick={() => onInsérer(blocsVersÉléments(ss.titre, ss.blocs || []), `Fiche « ${ss.titre} » insérée`)} style={ligneListe(UI)}>
            <span>📑</span><span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ss.titre}</span><span style={{ fontSize: 12, color: UI.doux }}>{g.nom} › {c.titre}</span></span>
          </button>
        ))}
      </div>
    </Fenêtre>
  )
}

// Historique : versions précédentes du fichier, restauration du tableau.
export function DialogueVersions({ UI, token, chemin, tableauId, onRestaurer, onFermer }) {
  const [versions, setVersions] = useState(null)
  const [erreur, setErreur] = useState('')
  const [choisie, setChoisie] = useState(null)
  useEffect(() => { listerVersions(token, chemin).then(setVersions).catch(e => setErreur(e.message)) }, [token, chemin])
  const date = d => new Date(d).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const ouvrir = async v => {
    setChoisie({ ...v, chargement: true })
    try {
      const contenu = await lireVersion(token, chemin, v.sha)
      setChoisie({ ...v, tableau: (contenu?.tableaux || []).find(t => t.id === tableauId) || null })
    } catch (e) { setErreur(e.message); setChoisie(null) }
  }
  return (
    <Fenêtre titre="🕓 Versions précédentes" onFermer={onFermer} UI={UI}>
      {erreur && <p style={{ color: '#d33', fontSize: 13 }}>{erreur}</p>}
      {!versions && !erreur && <p style={{ color: UI.doux }}>Chargement…</p>}
      {choisie && (
        <div style={{ border: `1px solid ${UI.accent}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <strong>{date(choisie.date)}</strong>
          <p style={{ margin: '6px 0', fontSize: 14 }}>{choisie.chargement ? 'Lecture…' : choisie.tableau ? `${choisie.tableau.éléments?.length || 0} éléments dans ce tableau` : 'Ce tableau n\'existait pas encore.'}</p>
          {choisie.tableau && <button onClick={() => onRestaurer(choisie.tableau.éléments || [])} style={bouton(UI, true)}>Restaurer cette version</button>}
          <p style={{ margin: '6px 0 0', fontSize: 12, color: UI.doux }}>Restaurer remplace le contenu actuel du tableau (↶ Annuler permet de revenir).</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(versions || []).map(v => (
          <button key={v.sha} onClick={() => ouvrir(v)} style={{ ...ligneListe(UI), ...(choisie?.sha === v.sha ? { borderColor: UI.accent } : {}) }}>🕓 {date(v.date)}</button>
        ))}
      </div>
    </Fenêtre>
  )
}

// Minuteur d'atelier : choix de la durée puis compte à rebours visible.
export function useMinuteur(onFin) {
  const [fin, setFin] = useState(null)
  const [maintenant, setMaintenant] = useState(Date.now())
  useEffect(() => {
    if (!fin) return
    const id = setInterval(() => {
      const n = Date.now(); setMaintenant(n)
      if (n >= fin) { setFin(null); bip(988, 0.2); setTimeout(() => bip(988, 0.2), 300); setTimeout(() => bip(1320, 0.3), 600); navigator.vibrate?.([300, 150, 300]); onFin?.() }
    }, 250)
    return () => clearInterval(id)
  }, [fin]) // eslint-disable-line react-hooks/exhaustive-deps
  const reste = fin ? Math.max(0, Math.ceil((fin - maintenant) / 1000)) : 0
  return { actif: !!fin, reste, lancer: minutes => { setMaintenant(Date.now()); setFin(Date.now() + minutes * 60000) }, arrêter: () => setFin(null) }
}
export function ChoixMinuteur({ UI, onChoisir, onFermer }) {
  return (
    <Fenêtre titre="⏱️ Minuteur" onFermer={onFermer} UI={UI}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[1, 3, 5, 10, 15, 25].map(m => <button key={m} onClick={() => onChoisir(m)} style={{ ...ligneListe(UI), justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>{m} min</button>)}
      </div>
    </Fenêtre>
  )
}

// Mini-carte : tous les éléments en petit, le cadre de l'écran ; toucher
// pour y aller.
export function MiniCarte({ UI, boîtes, vue, taille, onAller }) {
  if (!boîtes.length) return null
  const x0 = Math.min(...boîtes.map(b => b.x), -vue.x / vue.z), y0 = Math.min(...boîtes.map(b => b.y), -vue.y / vue.z)
  const x1 = Math.max(...boîtes.map(b => b.x + b.l), (taille.l - vue.x) / vue.z), y1 = Math.max(...boîtes.map(b => b.y + b.h), (taille.h - vue.y) / vue.z)
  const L = 150, H = 100
  const k = Math.min(L / Math.max(1, x1 - x0), H / Math.max(1, y1 - y0))
  const versÉcran = (x, y) => [(x - x0) * k, (y - y0) * k]
  const aller = e => {
    const r = e.currentTarget.getBoundingClientRect()
    onAller(x0 + (e.clientX - r.left) / k, y0 + (e.clientY - r.top) / k)
  }
  const [vx, vy] = versÉcran(-vue.x / vue.z, -vue.y / vue.z)
  return (
    <div data-chrome onPointerDown={e => { e.stopPropagation(); aller(e) }} role="img" aria-label="Mini-carte : toucher pour s'y déplacer"
      style={{ position: 'absolute', right: 12, bottom: 'calc(84px + env(safe-area-inset-bottom))', width: L, height: H, background: UI.barre, borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,.16)', overflow: 'hidden', zIndex: 18, cursor: 'pointer', touchAction: 'none' }}>
      <svg width={L} height={H} style={{ display: 'block' }}>
        {boîtes.map((b, i) => { const [x, y] = versÉcran(b.x, b.y); return <rect key={i} x={x} y={y} width={Math.max(1.5, b.l * k)} height={Math.max(1.5, b.h * k)} fill={b.couleur || '#c9c9c9'} opacity={0.85} /> })}
        <rect x={vx} y={vy} width={(taille.l / vue.z) * k} height={(taille.h / vue.z) * k} fill="none" stroke={UI.accent} strokeWidth={2} />
      </svg>
    </div>
  )
}

export { texteBrut }
