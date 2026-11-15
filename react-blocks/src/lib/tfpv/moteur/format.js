// Formatage : approximation prudente de `terraform fmt -check` (indentation de
// 2 espaces par niveau, tabulations, espaces en fin de ligne, espaces autour de
// « = », alignement des « = » d'attributs consécutifs). Un constat par fichier.
import { constat } from './projet.js'

export function vérifierFormat(p) {
  const constats = []
  let réussis = 0
  for (const [rel, hf] of Object.entries(p.analysés).sort()) {
    if (hf.error || !rel.endsWith('.tf')) continue
    const lignes = hf.text.split('\n')
    const pbs = []
    lignes.forEach((l, i) => {
      if (/^\t+/.test(l)) pbs.push([i + 1, 'tab indentation'])
      else if (/[ \t]+\r?$/.test(l) && l.trim()) pbs.push([i + 1, 'trailing whitespace'])
    })
    const parcourir = (b, profAttendue) => {
      const attrs = Object.values(b.attributes).sort((a, c) => a.line - c.line)
      for (const a of attrs) {
        if (a.col !== profAttendue * 2 + 1) pbs.push([a.line, `indentation ${a.col - 1} instead of ${profAttendue * 2}`])
        const après = (lignes[a.line - 1] || '')[a.eqCol] // caractère après « = »
        if (a.eqCol === a.col + a.name.length) pbs.push([a.line, `missing space before "=" (${a.name}=)`])
        else if (après !== undefined && après !== ' ' && après !== '\r') pbs.push([a.line, 'missing space after "="'])
      }
      // Alignement : attributs d'une ligne, sur des lignes consécutives
      let groupe = []
      const fermer = () => {
        if (groupe.length > 1) {
          const attendu = Math.max(...groupe.map(a => a.col + a.name.length)) + 1
          const mal = groupe.find(a => a.eqCol !== attendu)
          if (mal) pbs.push([mal.line, '"=" not aligned with the neighbouring arguments'])
        }
        groupe = []
      }
      for (const a of attrs) {
        if (a.line !== a.endLine) { fermer(); continue }
        if (groupe.length && a.line !== groupe[groupe.length - 1].line + 1) fermer()
        groupe.push(a)
      }
      fermer()
      for (const c of b.blocks) {
        if (c.col !== profAttendue * 2 + 1) pbs.push([c.line, `indentation ${c.col - 1} instead of ${profAttendue * 2}`])
        parcourir(c, profAttendue + 1)
      }
    }
    for (const b of hf.blocks) {
      if (b.col !== 1) pbs.push([b.line, `indentation ${b.col - 1} instead of 0`])
      parcourir(b, 1)
    }
    if (!pbs.length) { réussis++; continue }
    pbs.sort((a, c) => a[0] - c[0])
    const exemples = pbs.slice(0, 3).map(([l, m]) => `line ${l}: ${m}`).join('; ')
    constats.push(constat({ engine: 'format', engineRule: 'fmt', ruleId: 'TF_FORMAT', message: `File is not in canonical format (${pbs.length} place(s)): ${exemples}${pbs.length > 3 ? '…' : ''}.`, file: rel, line: pbs[0][0], extra: { confidence: 'medium' } }))
  }
  return { constats, réussis }
}
