// Mode guidé : sans IA, la requête se construit à partir des collections,
// champs et valeurs détectés dans le JSON (filtres, projection, tri, limite,
// agrégat, regroupement). Chaque choix produit un plan exécuté par jq et JMESPath.
import { useEffect, useMemo, useState } from 'react'
import { grotesk } from '../../../lib/theme'

const OPÉRATIONS = [
  ['liste', 'Lister'], ['premier', 'Premier élément'], ['nombre', 'Compter'], ['somme', 'Somme'], ['moyenne', 'Moyenne'],
  ['min', 'Minimum'], ['max', 'Maximum'], ['maxPar', 'Élément au maximum'], ['minPar', 'Élément au minimum'], ['distinct', 'Valeurs distinctes'], ['groupe', 'Regrouper et compter'],
]
const OPS = [['==', '='], ['!=', '≠'], ['>', '>'], ['>=', '≥'], ['<', '<'], ['<=', '≤'], ['contient', 'contient'], ['commence', 'commence par'], ['finit', 'finit par'], ['existe', 'renseigné'], ['absent', 'absent / null']]
const cléChamp = c => JSON.stringify(c.tag ? { tag: c.tag.clé, chemin: c.tag.chemin } : c.chemin)
const refChamp = c => (c.tag ? { tag: c.tag } : { chemin: c.chemin })
const nomSortie = c => (c.tag ? c.tag.clé : c.nom || 'valeur')

// Valeur saisie → valeur typée selon le champ.
function typer(texte, champ) {
  const t = texte.trim()
  if (t === 'null') return null
  if (champ?.types.includes('boolean') && (t === 'true' || t === 'false')) return t === 'true'
  if (champ?.types.includes('number') && /^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  return texte
}

export default function ModeGuide({ structure, T, S, onPlan }) {
  const collections = useMemo(() => (structure?.collections || []).filter(c => c.typeÉléments === 'objet' || c.typeÉléments === 'scalaire'), [structure])
  const [idCollection, setIdCollection] = useState('')
  const col = collections.find(c => c.id === idCollection) || collections[0]
  const champs = col?.champs || []
  const [opération, setOpération] = useState('liste')
  const [sélection, setSélection] = useState([])  // [{ clé, nom }]
  const [filtres, setFiltres] = useState([])      // [{ clé, op, valeur }]
  const [liaison, setLiaison] = useState('et')
  const [tri, setTri] = useState({ clé: '', desc: false })
  const [limite, setLimite] = useState('')
  const [champCalcul, setChampCalcul] = useState('')
  const [champGroupe, setChampGroupe] = useState('')
  const [ignorerNull, setIgnorerNull] = useState(false)

  const trouver = clé => champs.find(c => cléChamp(c) === clé)
  const numériques = champs.filter(c => c.types.includes('number') && !c.multi)
  const simples = champs.filter(c => !c.multi)

  const plan = useMemo(() => {
    if (!col) return null
    const trouver = clé => col.champs.find(c => cléChamp(c) === clé)
    const p = { type: 'collection', source: col.chemin }
    const conds = filtres.map(f => {
      const c = trouver(f.clé)
      if (!c) return null
      if (f.op === 'existe' || f.op === 'absent') return { type: f.op, champ: refChamp(c) }
      if (f.valeur === '') return null
      if (['contient', 'commence', 'finit'].includes(f.op)) return { type: f.op, champ: refChamp(c), valeur: f.valeur }
      return { type: 'cmp', champ: refChamp(c), op: f.op, valeur: typer(f.valeur, c) }
    }).filter(Boolean)
    if (conds.length === 1) p.filtre = conds[0]
    else if (conds.length > 1) p.filtre = { type: liaison, conds }
    const projetés = sélection.map(s => ({ c: trouver(s.clé), nom: s.nom })).filter(x => x.c)
    const projection = projetés.length === 1
      ? (projetés[0].c.tag ? { type: 'tag', tag: projetés[0].c.tag } : { type: 'champ', chemin: projetés[0].c.chemin })
      : projetés.length > 1 ? { type: 'objet', champs: projetés.map(x => ({ nom: x.nom || nomSortie(x.c), valeur: x.c.tag ? { type: 'tag', tag: x.c.tag } : { type: 'champ', chemin: x.c.chemin } })) } : null
    const calcul = trouver(champCalcul)
    if (['somme', 'moyenne', 'min', 'max', 'maxPar', 'minPar'].includes(opération)) {
      if (!calcul) return null
      p.agrégat = { op: opération, champ: refChamp(calcul) }
      if ((opération === 'maxPar' || opération === 'minPar') && projection) p.projection = projection
      return p
    }
    if (opération === 'nombre') { p.agrégat = { op: 'nombre' }; return p }
    if (opération === 'groupe') {
      const g = trouver(champGroupe)
      if (!g) return null
      p.groupe = { champ: refChamp(g), mesure: calcul ? { op: 'somme', champ: refChamp(calcul) } : { op: 'nombre' }, forme: 'objet' }
      return p
    }
    if (opération === 'distinct') {
      if (projetés.length !== 1) return null
      p.projection = projection
      p.unique = true
      return p
    }
    if (projection) p.projection = projection
    const t = trouver(tri.clé)
    if (t && opération === 'liste') p.tri = { champ: refChamp(t), desc: tri.desc }
    if (opération === 'premier') p.premier = true
    if (opération === 'liste' && Number(limite) > 0) p.tranche = { début: 0, fin: Number(limite) }
    if (ignorerNull && projetés.length === 1) p.ignorerNull = true
    return p
  }, [col, filtres, liaison, sélection, opération, champCalcul, champGroupe, tri, limite, ignorerNull])

  useEffect(() => { onPlan(plan) }, [plan, onPlan])

  if (!collections.length) return <p style={{ color: T.textMuted, fontSize: 14 }}>Aucun tableau détecté dans ce JSON : le mode guidé parcourt des collections (tableaux d'objets ou de valeurs).</p>

  const étiquette = { ...S.étiquette, margin: '12px 0 6px' }
  const sélectStyle = { ...S.champ, fontFamily: grotesk, minHeight: 40, padding: '6px 10px', fontSize: 14 }
  const listeChamps = (liste, valeur, onChange, aria, vide = '— choisir —') => (
    <select value={valeur} onChange={e => onChange(e.target.value)} aria-label={aria} style={sélectStyle}>
      <option value="">{vide}</option>
      {liste.map(c => <option key={cléChamp(c)} value={cléChamp(c)}>{c.texte}{c.multi ? ' (liste)' : ''}</option>)}
    </select>
  )
  const basculer = c => {
    const k = cléChamp(c)
    setSélection(s => (s.some(x => x.clé === k) ? s.filter(x => x.clé !== k) : [...s, { clé: k, nom: nomSortie(c) }]))
  }

  return (
    <div>
      <p style={{ ...étiquette, marginTop: 4 }}>Collection</p>
      <select value={col?.id || ''} onChange={e => { setIdCollection(e.target.value); setSélection([]); setFiltres([]); setTri({ clé: '', desc: false }); setChampCalcul(''); setChampGroupe('') }} aria-label="Collection" style={sélectStyle}>
        {collections.map(c => <option key={c.id} value={c.id}>{c.chemin.length === 1 ? '(tableau racine)' : c.id} · {c.nombre} élément{c.nombre > 1 ? 's' : ''}</option>)}
      </select>

      <p style={étiquette}>Opération</p>
      <div role="radiogroup" aria-label="Opération" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {OPÉRATIONS.map(([id, nom]) => <button key={id} role="radio" aria-checked={opération === id} onClick={() => setOpération(id)} style={{ ...S.puce(opération === id), minHeight: 34, fontSize: 13 }}>{nom}</button>)}
      </div>

      {['somme', 'moyenne', 'min', 'max', 'maxPar', 'minPar'].includes(opération) && (<><p style={étiquette}>Champ calculé</p>{listeChamps(opération === 'maxPar' || opération === 'minPar' ? simples : numériques, champCalcul, setChampCalcul, 'Champ calculé')}</>)}
      {opération === 'groupe' && (
        <>
          <p style={étiquette}>Regrouper par</p>
          {listeChamps(simples, champGroupe, setChampGroupe, 'Regrouper par')}
          <p style={étiquette}>Mesure</p>
          {listeChamps(numériques, champCalcul, setChampCalcul, 'Somme de (facultatif)', 'nombre d\'éléments')}
        </>
      )}

      <p style={étiquette}>Filtres</p>
      {filtres.map((f, i) => {
        const c = trouver(f.clé)
        const sansValeur = f.op === 'existe' || f.op === 'absent'
        const liste = `qg-valeurs-${i}`
        return (
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: `1px dashed ${T.border}` }}>
            <div style={{ flex: '2 1 180px', minWidth: 0 }}>{listeChamps(champs, f.clé, v => setFiltres(l => l.map((x, j) => (j === i ? { ...x, clé: v } : x))), `Champ du filtre ${i + 1}`)}</div>
            <select value={f.op} onChange={e => setFiltres(l => l.map((x, j) => (j === i ? { ...x, op: e.target.value } : x)))} aria-label={`Opérateur du filtre ${i + 1}`} style={{ ...sélectStyle, flex: '0 1 130px', width: 'auto' }}>
              {OPS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
            {!sansValeur && (
              <>
                <input value={f.valeur} list={liste} onChange={e => setFiltres(l => l.map((x, j) => (j === i ? { ...x, valeur: e.target.value } : x)))} aria-label={`Valeur du filtre ${i + 1}`} placeholder="valeur" style={{ ...S.champ, flex: '2 1 160px', width: 'auto', minWidth: 0, minHeight: 40, fontSize: 14 }} />
                <datalist id={liste}>{(c?.exemples || []).map(v => <option key={String(v)} value={String(v)} />)}</datalist>
              </>
            )}
            <button onClick={() => setFiltres(l => l.filter((_, j) => j !== i))} aria-label={`Supprimer le filtre ${i + 1}`} style={{ ...S.puce(false), minHeight: 40, padding: '0 12px' }}>✕</button>
          </div>
        )
      })}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <button onClick={() => setFiltres(l => [...l, { clé: '', op: '==', valeur: '' }])} style={{ ...S.puce(false), minHeight: 34, fontSize: 13 }}>+ Ajouter un filtre</button>
        {filtres.length > 1 && (
          <select value={liaison} onChange={e => setLiaison(e.target.value)} aria-label="Combinaison des filtres" style={{ ...sélectStyle, width: 'auto' }}>
            <option value="et">toutes les conditions (et)</option>
            <option value="ou">au moins une (ou)</option>
          </select>
        )}
      </div>

      {['liste', 'premier', 'distinct', 'maxPar', 'minPar'].includes(opération) && (
        <>
          <p style={étiquette}>{opération === 'distinct' ? 'Champ (un seul)' : 'Champs du résultat'} <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>· aucun = éléments complets</span></p>
          <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10, padding: '4px 8px' }}>
            {champs.map(c => {
              const k = cléChamp(c)
              const choisi = sélection.find(s => s.clé === k)
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={!!choisi} onChange={() => basculer(c)} />
                    <code style={{ wordBreak: 'break-all' }}>{c.texte}</code>
                    <span style={{ color: T.textMuted, fontSize: 12 }}>{c.types.join('/')}{c.nuls ? ` · ${c.nuls} absent(s)` : ''}</span>
                  </label>
                  {choisi && sélection.length > 1 && <input value={choisi.nom} onChange={e => setSélection(s => s.map(x => (x.clé === k ? { ...x, nom: e.target.value } : x)))} aria-label={`Nom de sortie pour ${c.texte}`} style={{ ...S.champ, width: 110, minHeight: 32, padding: '2px 8px', fontSize: 13 }} />}
                </div>
              )
            })}
          </div>
          {sélection.length === 1 && opération === 'liste' && <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginTop: 6 }}><input type="checkbox" checked={ignorerNull} onChange={e => setIgnorerNull(e.target.checked)} /> Ignorer les valeurs absentes ou null</label>}
        </>
      )}

      {opération === 'liste' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 6, marginTop: 10 }}>
          <div><p style={{ ...étiquette, marginTop: 0 }}>Trier par</p>{listeChamps(simples, tri.clé, v => setTri(t => ({ ...t, clé: v })), 'Trier par', 'sans tri')}</div>
          <div><p style={{ ...étiquette, marginTop: 0 }}>Ordre</p><select value={tri.desc ? 'desc' : 'asc'} onChange={e => setTri(t => ({ ...t, desc: e.target.value === 'desc' }))} aria-label="Ordre du tri" style={sélectStyle}><option value="asc">croissant</option><option value="desc">décroissant</option></select></div>
          <div><p style={{ ...étiquette, marginTop: 0 }}>Limite</p><input type="number" min="1" value={limite} onChange={e => setLimite(e.target.value)} aria-label="Nombre maximal d'éléments" placeholder="toutes" style={{ ...S.champ, minHeight: 40, fontSize: 14 }} /></div>
        </div>
      )}
      {!plan && <p style={{ color: T.textMuted, fontSize: 13.5, marginTop: 10 }}>Complétez le choix (champ calculé, champ de regroupement ou champ unique) pour obtenir les requêtes.</p>}
    </div>
  )
}
