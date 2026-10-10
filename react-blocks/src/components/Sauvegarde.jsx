import { useRef, useState } from 'react'
import { grotesk } from '../lib/theme'
import { créerSauvegarde, résumerSauvegarde, restaurerSauvegarde } from '../lib/donneesFoyer'

// Sauvegarde complète d'un foyer : télécharger un fichier, ou restaurer.
export default function Sauvegarde({ T, foyer, onFermer, onRestauré }) {
  const [état, setÉtat] = useState(null) // { travail } | { erreur } | { ok }
  const [àRestaurer, setÀRestaurer] = useState(null)
  const entrée = useRef(null)

  const télécharger = async () => {
    setÉtat({ travail: 'Lecture de toutes tes données…' })
    try {
      const s = await créerSauvegarde(foyer)
      const url = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `sauvegarde-${foyer.id}-${s.date.slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      setÉtat({ ok: `Sauvegarde téléchargée (${Object.keys(s.fichiers).length} fichiers)${s.depuisAppareil.length ? ` — ${s.depuisAppareil.length} pris sur l'appareil, GitHub injoignable` : ''}.` })
    } catch (err) { setÉtat({ erreur: err.message }) }
  }
  const lireFichier = async e => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const s = JSON.parse(await f.text())
      if (s?.app !== 'react-blocs') throw new Error('Ce fichier n\'est pas une sauvegarde React Blocs.')
      setÀRestaurer(s)
      setÉtat(null)
    } catch (err) { setÉtat({ erreur: err.message.startsWith('Ce fichier') ? err.message : 'Fichier illisible.' }) }
  }
  const restaurer = async () => {
    if (!window.confirm('Remplacer les données en ligne par celles de cette sauvegarde ? (Les modifications faites depuis seront perdues.)')) return
    try {
      const n = await restaurerSauvegarde(àRestaurer, foyer, (i, total) => setÉtat({ travail: `Restauration… ${i + 1}/${total}` }))
      setÀRestaurer(null)
      setÉtat({ ok: `✓ ${n} fichiers restaurés.` })
      onRestauré?.()
    } catch (err) { setÉtat({ erreur: err.message }) }
  }
  const bouton = principal => ({
    width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, fontSize: '14px', textAlign: 'left',
    background: principal ? T.accent : T.surface2, color: principal ? T.accentText : T.text, border: principal ? 'none' : `1px solid ${T.border}`,
  })
  return (
    <div role="dialog" aria-label="Sauvegarde" onClick={onFermer} onKeyDown={e => { if (e.key === 'Escape') onFermer() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p style={{ flex: 1, margin: 0, fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>💾 Sauvegarde · {foyer.nom}</p>
          <button onClick={onFermer} aria-label="Fermer" style={{ background: 'transparent', border: 'none', color: T.textMuted, fontSize: '17px', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: T.textMuted, lineHeight: 1.5 }}>
          Tout ce qui est dans {foyer.nom} (Programme, Notes, Mémoriser, Graph, Habitudes — perso et pro) dans un seul fichier, à garder où tu veux. Les images ne sont pas incluses.
        </p>
        <button onClick={télécharger} disabled={!!état?.travail} style={bouton(true)}>⬇️ Télécharger la sauvegarde</button>
        <button onClick={() => entrée.current?.click()} disabled={!!état?.travail} style={bouton(false)}>⬆️ Restaurer depuis un fichier…</button>
        <input ref={entrée} type="file" accept="application/json,.json" onChange={lireFichier} style={{ display: 'none' }} />
        {àRestaurer && (
          <div style={{ background: T.surface2, border: `1px solid ${T.accent}`, borderRadius: '12px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: T.text, fontWeight: 700 }}>
              Sauvegarde du {new Date(àRestaurer.date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {àRestaurer.foyer !== foyer.id && <span style={{ color: T.danger }}> (autre Home)</span>}
            </p>
            <ul style={{ margin: '0 0 10px', paddingLeft: '18px', fontSize: '12.5px', color: T.textMuted, lineHeight: 1.6 }}>
              {résumerSauvegarde(àRestaurer).map(r => <li key={r.nom}>{r.nom.replace('.json', '')} : {r.texte}</li>)}
            </ul>
            <button onClick={restaurer} style={{ ...bouton(false), background: T.danger, color: '#fff', border: 'none', textAlign: 'center' }}>Restaurer (remplace les données en ligne)</button>
          </div>
        )}
        {état?.travail && <p style={{ margin: 0, fontSize: '13px', color: T.textMuted }}>⏳ {état.travail}</p>}
        {état?.erreur && <p style={{ margin: 0, fontSize: '13px', color: T.danger }}>{état.erreur}</p>}
        {état?.ok && <p style={{ margin: 0, fontSize: '13px', color: '#4a9d94' }}>{état.ok}</p>}
      </div>
    </div>
  )
}
