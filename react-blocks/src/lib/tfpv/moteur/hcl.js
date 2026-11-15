// Lecteur HCL2 / Terraform : découpage en jetons et structure (blocs,
// attributs, lignes exactes). Portage du lecteur Python de tfpv. Les
// expressions ne sont pas interprétées ici : chaque attribut garde ses jetons,
// évalués à la demande par expr.js.

const IDENT = /[A-Za-z_][A-Za-z0-9_-]*/y
const NOMBRE = /\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const HEREDOC = /<<(-?)([A-Za-z_][A-Za-z0-9_-]*)[ \t]*\r?\n/y
const OPS3 = ['...']
const OPS2 = ['==', '!=', '<=', '>=', '&&', '||', '=>', '::']
const OPS1 = '{}[]()=,.:?!+-*/%<>'

export class ErreurLecture extends Error {
  constructor(message, line, col = 1) {
    super(`${message} (line ${line})`)
    this.msg = message
    this.line = line
    this.col = col
  }
}

const position = (text, idx) => {
  let line = 1
  for (let i = 0; i < idx; i++) if (text.charCodeAt(i) === 10) line++
  return [line, idx - text.lastIndexOf('\n', idx - 1)]
}
const nbLignes = (text, a, b) => {
  let n = 0
  for (let i = a; i < b; i++) if (text.charCodeAt(i) === 10) n++
  return n
}

export function sauterChaîne(text, j) {
  // j : guillemet ouvrant ; renvoie l'indice après le guillemet fermant
  const n = text.length
  j++
  while (j < n) {
    const ch = text[j]
    if (ch === '\\') { j += 2; continue }
    if ((ch === '$' || ch === '%') && text.startsWith(ch + ch + '{', j)) { j += 3; continue }
    if ((ch === '$' || ch === '%') && text.startsWith(ch + '{', j)) { j = sauterGabarit(text, j + 2); continue }
    if (ch === '"') return j + 1
    if (ch === '\n') throw new ErreurLecture('unterminated string', ...position(text, j))
    j++
  }
  throw new ErreurLecture('unterminated string', ...position(text, j))
}

export function sauterGabarit(text, j) {
  // j : juste après « ${ » ou « %{ » ; renvoie l'indice après l'accolade fermante
  let prof = 1
  const n = text.length
  while (j < n) {
    const ch = text[j]
    if (ch === '"') { j = sauterChaîne(text, j); continue }
    if (ch === '{') prof++
    else if (ch === '}') { prof--; if (prof === 0) return j + 1 }
    j++
  }
  throw new ErreurLecture('unterminated template interpolation', ...position(text, j))
}

export function découper(text) {
  const toks = []
  const n = text.length
  let i = 0
  let line = 1
  let début = 0
  const ajouter = (kind, value, a, b, strip = false) => {
    const l0 = line
    const col = a - début + 1
    const nl = nbLignes(text, a, b)
    if (nl) { line += nl; début = text.lastIndexOf('\n', b - 1) + 1 }
    toks.push({ kind, value, line: l0, col, endLine: line, strip })
  }
  while (i < n) {
    const c = text[i]
    if (c === '\n') { toks.push({ kind: 'nl', value: '\n', line, col: i - début + 1, endLine: line }); i++; line++; début = i; continue }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\ufeff') { i++; continue }
    if (c === '#' || text.startsWith('//', i)) { const j = text.indexOf('\n', i); i = j < 0 ? n : j; continue }
    if (text.startsWith('/*', i)) {
      const j = text.indexOf('*/', i + 2)
      if (j < 0) throw new ErreurLecture('unterminated comment', line, i - début + 1)
      const nl = nbLignes(text, i, j)
      if (nl) { line += nl; début = text.lastIndexOf('\n', j - 1) + 1 }
      i = j + 2
      continue
    }
    if (c === '"') { const j = sauterChaîne(text, i); ajouter('string', text.slice(i + 1, j - 1), i, j); i = j; continue }
    if (c === '<' && text.startsWith('<<', i)) {
      HEREDOC.lastIndex = i
      const m = HEREDOC.exec(text)
      if (m) {
        const marqueur = m[2]
        const corps = HEREDOC.lastIndex
        const fin = new RegExp(`^[ \\t]*${marqueur.replace(/[-]/g, '\\-')}[ \\t]*\\r?$`, 'm')
        const reste = text.slice(corps)
        const em = fin.exec(reste)
        if (!em) throw new ErreurLecture(`unterminated heredoc ${marqueur}`, line, i - début + 1)
        const finIdx = corps + em.index + em[0].length
        ajouter('heredoc', text.slice(corps, corps + em.index), i, finIdx, m[1] === '-')
        i = finIdx
        continue
      }
    }
    if (c >= '0' && c <= '9') { NOMBRE.lastIndex = i; const m = NOMBRE.exec(text); ajouter('number', m[0], i, i + m[0].length); i += m[0].length; continue }
    if (/[A-Za-z_]/.test(c)) { IDENT.lastIndex = i; const m = IDENT.exec(text); ajouter('ident', m[0], i, i + m[0].length); i += m[0].length; continue }
    const op = [...OPS3, ...OPS2].find(o => text.startsWith(o, i))
    if (op) { ajouter('op', op, i, i + op.length); i += op.length; continue }
    if (OPS1.includes(c)) { ajouter('op', c, i, i + 1); i++; continue }
    throw new ErreurLecture(`unexpected character ${JSON.stringify(c)}`, line, i - début + 1)
  }
  toks.push({ kind: 'eof', value: '', line, col: i - début + 1, endLine: line })
  return toks
}

const est = (t, v) => t.kind === 'op' && t.value === v

function sauterExpression(toks, i) {
  let prof = 0
  for (;;) {
    const t = toks[i]
    if (t.kind === 'eof') return i
    if (t.kind === 'nl' && prof === 0) return i
    if (t.kind === 'op') {
      if ('([{'.includes(t.value)) prof++
      else if (')]}'.includes(t.value)) { if (prof === 0) return i; prof-- }
    }
    i++
  }
}

export function nouveauBloc(type, labels, line, col, depth) {
  return { type, labels, line, col, depth, endLine: 0, attributes: {}, blocks: [], duplicates: [] }
}

function lireCorps(toks, i, owner, top, depth) {
  for (;;) {
    const t = toks[i]
    if (t.kind === 'nl') { i++; continue }
    if (t.kind === 'eof') {
      if (owner) throw new ErreurLecture(`unclosed block "${owner.type}" opened at line ${owner.line}`, t.line)
      return i
    }
    if (est(t, '}')) {
      if (!owner) throw new ErreurLecture('unexpected closing brace', t.line, t.col)
      owner.endLine = t.line
      return i + 1
    }
    if (t.kind !== 'ident') throw new ErreurLecture(`unexpected token ${JSON.stringify(t.value)}: expected an argument or a block`, t.line, t.col)
    const suiv = toks[i + 1]
    if (est(suiv, '=')) {
      const fin = sauterExpression(toks, i + 2)
      const expr = toks.slice(i + 2, fin).filter(x => x.kind !== 'nl')
      if (!expr.length) throw new ErreurLecture(`missing value for argument "${t.value}"`, t.line, t.col)
      if (!owner) throw new ErreurLecture('argument outside of a block', t.line, t.col)
      const attr = { name: t.value, line: t.line, col: t.col, depth, endLine: expr[expr.length - 1].endLine, tokens: expr, eqCol: suiv.col }
      if (owner.attributes[t.value]) owner.duplicates.push(attr)
      else owner.attributes[t.value] = attr
      i = fin
      continue
    }
    let j = i + 1
    const labels = []
    while (toks[j].kind === 'string' || toks[j].kind === 'ident') { labels.push(toks[j].value); j++ }
    if (!est(toks[j], '{')) throw new ErreurLecture(`expected "=" or "{" after "${t.value}"`, toks[j].line, toks[j].col)
    const b = nouveauBloc(t.value, labels, t.line, t.col, depth)
    ;(owner ? owner.blocks : top).push(b)
    i = lireCorps(toks, j + 1, b, top, depth + 1)
  }
}

// Lit un fichier HCL ; ne lève jamais d'exception (l'erreur est dans .error).
export function lireHcl(text, path = '<memory>', tfvars = false) {
  const hf = { path, text, blocks: [], attributes: {}, error: null }
  let toks
  try {
    toks = découper(text)
  } catch (e) {
    hf.error = e instanceof ErreurLecture ? e : new ErreurLecture(String(e.message || e), 1)
    return hf
  }
  if (tfvars) {
    const racine = nouveauBloc('__tfvars__', [], 1, 1, 0)
    try {
      let i = 0
      while (toks[i].kind !== 'eof') {
        const t = toks[i]
        if (t.kind === 'nl') { i++; continue }
        if (t.kind !== 'ident' || !est(toks[i + 1], '=')) throw new ErreurLecture(`unexpected token ${JSON.stringify(t.value)} in variable definitions file`, t.line, t.col)
        const fin = sauterExpression(toks, i + 2)
        const expr = toks.slice(i + 2, fin).filter(x => x.kind !== 'nl')
        racine.attributes[t.value] = { name: t.value, line: t.line, col: t.col, depth: 0, endLine: expr.length ? expr[expr.length - 1].endLine : t.line, tokens: expr, eqCol: toks[i + 1].col }
        i = fin
        if (toks[i].kind === 'op') throw new ErreurLecture(`unexpected ${JSON.stringify(toks[i].value)}`, toks[i].line, toks[i].col)
      }
    } catch (e) {
      hf.error = e
    }
    hf.attributes = racine.attributes
    return hf
  }
  try {
    lireCorps(toks, 0, null, hf.blocks, 0)
  } catch (e) {
    hf.error = e instanceof ErreurLecture ? e : new ErreurLecture(String(e.message || e), 1)
  }
  return hf
}

export const enfants = (b, type) => b.blocks.filter(c => c.type === type)

export function blocÀ(hf, line) {
  return hf?.blocks.find(b => b.line <= line && line <= b.endLine) || null
}

export function adresse(b) {
  if (b.type === 'resource' && b.labels.length === 2) return `${b.labels[0]}.${b.labels[1]}`
  if (b.type === 'data' && b.labels.length === 2) return `data.${b.labels[0]}.${b.labels[1]}`
  if (b.type === 'module' && b.labels.length) return `module.${b.labels[0]}`
  if (b.type === 'variable' && b.labels.length) return `var.${b.labels[0]}`
  if (b.type === 'output' && b.labels.length) return `output.${b.labels[0]}`
  if (b.type === 'provider' && b.labels.length) return `provider.${b.labels[0]}`
  return [b.type, ...b.labels].join(' ')
}
