import { useState } from 'react'
import { grotesk } from '../lib/theme'
import { FenêtreMémo } from './PaquetsPrets'

// Découpe une ligne CSV (guillemets « "" » gérés).
function cellules(ligne, sép) {
  const r = []; let cur = ''; let guill = false
  for (let i = 0; i < ligne.length; i++) {
    const ch = ligne[i]
    if (guill) {
      if (ch === '"' && ligne[i + 1] === '"') { cur += '"'; i++ } else if (ch === '"') guill = false; else cur += ch
    } else if (ch === '"' && !cur) guill = true
    else if (ch === sép) { r.push(cur); cur = '' } else cur += ch
  }
  r.push(cur)
  return r.map(c => c.trim())
}

// Reconnaît plusieurs formats :
//  - « question :: réponse » (une carte par ligne) ;
//  - blocs « Q: … / R: … » (ou Question / Réponse), réponse sur plusieurs lignes ;
//  - tableau CSV / TSV (tabulation, point-virgule ou virgule ; 1re colonne
//    = question, 2e = réponse ; en-tête ignoré).
export function analyserImport(texte) {
  const t = (texte || '').replace(/\r\n?/g, '\n').trim()
  if (!t) return { cartes: [], format: '' }
  const lignes = t.split('\n')
  if (lignes.some(l => l.includes('::'))) {
    return { format: 'question :: réponse', cartes: lignes.map(l => l.split(/\s*::\s*/)).filter(p => p.length >= 2 && p[0].trim() && p[1].trim()).map(([q, ...r]) => ({ recto: q.trim(), verso: r.join(' :: ').trim() })) }
  }
  const Q = /^\s*(?:Q|Question)\s*[:.)-]\s*/i, R = /^\s*(?:R|A|Réponse|Reponse|Answer)\s*[:.)-]\s*/i
  if (lignes.some(l => Q.test(l)) && lignes.some(l => R.test(l))) {
    const cartes = []; let cur = null; let zone = null
    lignes.forEach(l => {
      if (Q.test(l)) { if (cur?.recto && cur.verso) cartes.push(cur); cur = { recto: l.replace(Q, ''), verso: '' }; zone = 'q' }
      else if (R.test(l) && cur) { cur.verso = l.replace(R, ''); zone = 'r' }
      else if (cur && l.trim()) { if (zone === 'r') cur.verso += `\n${l}`; else cur.recto += `\n${l}` }
    })
    if (cur?.recto && cur.verso) cartes.push(cur)
    return { format: 'blocs Q: / R:', cartes: cartes.map(c => ({ recto: c.recto.trim(), verso: c.verso.trim() })) }
  }
  const sép = ['\t', ';', ','].find(s => lignes.filter(l => l.includes(s)).length >= Math.max(1, Math.ceil(lignes.length * 0.8)))
  if (sép) {
    let rangées = lignes.map(l => cellules(l, sép)).filter(r => r.length >= 2 && r[0] && r[1])
    if (rangées.length && /^(question|recto|front|q)$/i.test(rangées[0][0]) && /^(r[ée]ponse|verso|back|answer|r|a)$/i.test(rangées[0][1])) rangées = rangées.slice(1)
    return { format: sép === '\t' ? 'tableau (tabulations)' : `tableau CSV (« ${sép} »)`, cartes: rangées.map(r => ({ recto: r[0], verso: r[1] })) }
  }
  return { format: '', cartes: [] }
}

export default function ImportCartes({ T, data, paquetParDéfaut, onImporter, onFermer }) {
  const [texte, setTexte] = useState('')
  const [cible, setCible] = useState(paquetParDéfaut || data.paquets[0]?.id || '__nouveau')
  const [nom, setNom] = useState('')
  const [message, setMessage] = useState('')
  const { cartes, format } = analyserImport(texte)
  const lireFichier = e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    const r = new FileReader()
    r.onload = () => { setTexte(String(r.result || '')); if (!nom) setNom(f.name.replace(/\.[^.]+$/, '')) }
    r.readAsText(f)
  }
  const importer = () => {
    if (!cartes.length) return
    onImporter({ paquetId: cible === '__nouveau' ? null : cible, nom: nom.trim() || 'Cartes importées', cartes })
    setMessage(`✓ ${cartes.length} carte${cartes.length > 1 ? 's' : ''} importée${cartes.length > 1 ? 's' : ''}`); setTexte('')
  }
  const champ = { width: '100%', boxSizing: 'border-box', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: '13.5px' }
  return (
    <FenêtreMémo T={T} titre="📥 Importer des cartes" onFermer={onFermer}>
      <p style={{ fontSize: '12.5px', color: T.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
        Colle tes questions ou choisis un fichier (.txt, .csv, .tsv, .md). Formats reconnus : une ligne <code>question :: réponse</code>, des blocs <code>Q:</code> / <code>R:</code>, ou un tableau (1re colonne = question, 2e = réponse).
      </p>
      <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={7} aria-label="Texte à importer"
        placeholder={'Que fait kubectl drain ? :: Vide un nœud de ses pods\nQ: Qui vote les lois ?\nR: Le Parlement'} style={{ ...champ, padding: 10, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', resize: 'vertical' }} />
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '8px 0 12px', minHeight: 36, padding: '0 12px', borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: grotesk, fontSize: '13px', cursor: 'pointer' }}>
        📄 Choisir un fichier
        <input type="file" accept=".txt,.csv,.tsv,.md,text/plain,text/csv" onChange={lireFichier} style={{ display: 'none' }} />
      </label>
      {texte.trim() && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: grotesk, fontSize: '13px', fontWeight: 700, color: cartes.length ? '#2e9e6b' : T.danger, margin: '0 0 6px' }}>
            {cartes.length ? `${cartes.length} carte${cartes.length > 1 ? 's' : ''} reconnue${cartes.length > 1 ? 's' : ''} · ${format}` : 'Aucune carte reconnue : vérifie le format.'}
          </p>
          {cartes.slice(0, 4).map((c, i) => (
            <div key={i} style={{ fontSize: '12.5px', padding: '6px 10px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 4, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <strong>{c.recto}</strong><br /><span style={{ color: T.textMuted }}>{c.verso}</span>
            </div>
          ))}
          {cartes.length > 4 && <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>… et {cartes.length - 4} autre(s)</p>}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: '13px', color: T.text, display: 'flex', gap: 6, alignItems: 'center' }}>Dans
          <select value={cible} onChange={e => setCible(e.target.value)} aria-label="Paquet de destination" style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
            {data.paquets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            <option value="__nouveau">＋ Nouveau paquet…</option>
          </select>
        </label>
        {cible === '__nouveau' && <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du paquet" aria-label="Nom du nouveau paquet" style={{ ...champ, width: 'auto', flex: '1 1 140px', minHeight: 36, padding: '0 10px' }} />}
      </div>
      <button onClick={importer} disabled={!cartes.length} style={{ width: '100%', minHeight: 46, borderRadius: 12, border: 'none', background: T.accent, color: T.accentText, fontFamily: grotesk, fontWeight: 700, fontSize: '15px', cursor: cartes.length ? 'pointer' : 'default', opacity: cartes.length ? 1 : 0.5 }}>
        Importer {cartes.length || ''} carte{cartes.length > 1 ? 's' : ''}
      </button>
      {message && <p style={{ color: '#2e9e6b', fontFamily: grotesk, fontWeight: 700, margin: '10px 0 0' }}>{message}</p>}
    </FenêtreMémo>
  )
}
