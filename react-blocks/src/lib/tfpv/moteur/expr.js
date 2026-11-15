// Analyse et évaluation *partielle* des expressions Terraform. Seul ce qui est
// connu avant `plan` est calculé (littéraux, var.*, local.*, attributs écrits
// sur d'autres ressources du module, quelques fonctions pures). Le reste vaut
// INCONNU : les règles qui en dépendent sont « non évaluables », jamais en
// échec — c'est ce qui évite les faux positifs.
import { ErreurLecture, découper, sauterGabarit } from './hcl.js'

export const INCONNU = Object.freeze({ toString: () => '(unknown)' })
export class RéfRessource { constructor(address, attr) { this.address = address; this.attr = attr } }
export class DocJson { constructor(value) { this.value = value } }

export function connu(v) {
  if (v === INCONNU || v instanceof RéfRessource) return false
  if (v instanceof DocJson) return connu(v.value)
  if (Array.isArray(v)) return v.every(connu)
  if (v && typeof v === 'object') return Object.values(v).every(connu)
  return true
}

class ErreurExpr extends Error {}
const OPAQUE = Object.freeze({ k: 'opaque' })
const PREC = [['||'], ['&&'], ['==', '!='], ['<', '>', '<=', '>='], ['+', '-'], ['*', '/', '%']]

class Analyseur {
  constructor(toks) {
    this.t = toks.filter(x => x.kind !== 'nl')
    if (!this.t.length || this.t[this.t.length - 1].kind !== 'eof') this.t.push({ kind: 'eof', value: '' })
    this.i = 0
  }
  voir(k = 0) { return this.t[Math.min(this.i + k, this.t.length - 1)] }
  suivant() { return this.t[this.i++] }
  accepter(v) { const t = this.voir(); if (t.kind === 'op' && t.value === v) { this.i++; return true } return false }
  attendre(v) { if (!this.accepter(v)) throw new ErreurExpr(`expected ${v}`) }
  analyser() { const n = this.expr(); if (this.voir().kind !== 'eof') throw new ErreurExpr('trailing tokens'); return n }
  expr() {
    const c = this.binaire(0)
    if (this.accepter('?')) { const a = this.expr(); this.attendre(':'); const b = this.expr(); return { k: 'cond', c, a, b } }
    return c
  }
  binaire(niv) {
    if (niv === PREC.length) return this.unaire()
    let g = this.binaire(niv + 1)
    for (;;) {
      const t = this.voir()
      if (t.kind === 'op' && PREC[niv].includes(t.value)) { this.i++; g = { k: 'bin', op: t.value, g, d: this.binaire(niv + 1) } } else return g
    }
  }
  unaire() {
    const t = this.voir()
    if (t.kind === 'op' && (t.value === '!' || t.value === '-')) { this.i++; return { k: 'un', op: t.value, e: this.unaire() } }
    return this.postfixe(this.primaire())
  }
  parcours() {
    const chemin = []
    for (;;) {
      const t = this.voir()
      if (t.kind === 'op' && t.value === '.') {
        const n = this.voir(1)
        if (n.kind === 'op' && n.value === '*') { this.i += 2; chemin.push(['splat']) } else if (n.kind === 'ident' || n.kind === 'number') {
          this.i += 2
          chemin.push(n.kind === 'ident' ? ['attr', n.value] : ['index', { k: 'lit', v: Math.trunc(Number(n.value)) }])
        } else throw new ErreurExpr('bad attribute access')
      } else if (t.kind === 'op' && t.value === '[') {
        if (this.voir(1).value === '*' && this.voir(2).value === ']') { this.i += 3; chemin.push(['splat']) } else {
          this.i++
          const idx = this.expr()
          this.attendre(']')
          chemin.push(['index', idx])
        }
      } else return chemin
    }
  }
  postfixe(n) {
    const chemin = this.parcours()
    if (!chemin.length) return n
    if (n.k === 'ref') { n.path.push(...chemin); return n }
    return { k: 'post', base: n, path: chemin }
  }
  primaire() {
    const t = this.suivant()
    if (t.kind === 'number') return { k: 'lit', v: Number(t.value) }
    if (t.kind === 'string') return gabarit(t.value, false)
    if (t.kind === 'heredoc') return gabarit(t.strip ? désindenter(t.value) : t.value, true)
    if (t.kind === 'ident') {
      if (t.value === 'true') return { k: 'lit', v: true }
      if (t.value === 'false') return { k: 'lit', v: false }
      if (t.value === 'null') return { k: 'lit', v: null }
      let nom = t.value
      let n = this.voir()
      if (n.kind === 'op' && n.value === '::') { while (this.accepter('::')) nom += '::' + this.suivant().value; n = this.voir() }
      if (n.kind === 'op' && n.value === '(') {
        this.i++
        const args = []
        let étendre = false
        while (!this.accepter(')')) {
          args.push(this.expr())
          if (this.accepter('...')) étendre = true
          if (!this.accepter(',')) { this.attendre(')'); break }
        }
        return { k: 'call', name: nom, args, étendre }
      }
      return { k: 'ref', root: nom, path: [] }
    }
    if (t.kind === 'op' && t.value === '(') { const e = this.expr(); this.attendre(')'); return e }
    if (t.kind === 'op' && t.value === '[') {
      if (this.voir().kind === 'ident' && this.voir().value === 'for') { this.sauterJusquà(']'); return OPAQUE }
      const items = []
      while (!this.accepter(']')) { items.push(this.expr()); if (!this.accepter(',')) { this.attendre(']'); break } }
      return { k: 'list', items }
    }
    if (t.kind === 'op' && t.value === '{') {
      if (this.voir().kind === 'ident' && this.voir().value === 'for') { this.sauterJusquà('}'); return OPAQUE }
      const items = []
      while (!this.accepter('}')) {
        const clé = this.expr()
        if (!(this.accepter('=') || this.accepter(':'))) throw new ErreurExpr('expected = in object')
        items.push([clé, this.expr()])
        this.accepter(',')
      }
      return { k: 'obj', items }
    }
    throw new ErreurExpr(`unexpected token ${t.value}`)
  }
  sauterJusquà(fermante) {
    let prof = 1
    for (;;) {
      const t = this.suivant()
      if (!t || t.kind === 'eof') throw new ErreurExpr('unterminated for expression')
      if (t.kind === 'op' && '([{'.includes(t.value)) prof++
      else if (t.kind === 'op' && ')]}'.includes(t.value)) { prof--; if (prof === 0) { if (t.value !== fermante) throw new ErreurExpr('mismatched'); return } }
    }
  }
}

function désindenter(corps) {
  const lignes = corps.split('\n')
  const retraits = lignes.filter(l => l.trim()).map(l => l.length - l.replace(/^[ \t]+/, '').length)
  const coupe = retraits.length ? Math.min(...retraits) : 0
  return lignes.map(l => l.slice(coupe)).join('\n')
}

const ÉCH = { n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\' }

export function gabarit(brut, heredoc) {
  const parts = []
  let buf = ''
  let i = 0
  const n = brut.length
  while (i < n) {
    const ch = brut[i]
    if (ch === '\\' && !heredoc && i + 1 < n) {
      const nx = brut[i + 1]
      if (ÉCH[nx] !== undefined) { buf += ÉCH[nx]; i += 2; continue }
      if (nx === 'u' || nx === 'U') {
        const w = nx === 'u' ? 4 : 8
        const code = parseInt(brut.slice(i + 2, i + 2 + w), 16)
        if (!Number.isNaN(code)) { buf += String.fromCodePoint(code); i += 2 + w; continue }
      }
      buf += ch
      i++
      continue
    }
    if ((ch === '$' || ch === '%') && brut.startsWith(ch + ch + '{', i)) { buf += ch + '{'; i += 3; continue }
    if ((ch === '$' || ch === '%') && brut.startsWith(ch + '{', i)) {
      let fin
      try { fin = sauterGabarit(brut, i + 2) } catch { return OPAQUE }
      if (buf) { parts.push(buf); buf = '' }
      if (ch === '%') parts.push(null) // directive %{ if }/%{ for } : non évaluée
      else {
        const dedans = brut.slice(i + 2, fin - 1).trim().replace(/^~/, '').replace(/~$/, '').trim()
        try { parts.push(new Analyseur(découper(dedans)).analyser()) } catch { parts.push(OPAQUE) }
      }
      i = fin
      continue
    }
    buf += ch
    i++
  }
  if (buf) parts.push(buf)
  if (!parts.length) return { k: 'lit', v: '' }
  if (parts.length === 1 && typeof parts[0] === 'string') return { k: 'lit', v: parts[0] }
  return { k: 'tmpl', parts }
}

export function analyserJetons(toks) {
  try { return new Analyseur(toks).analyser() } catch (e) {
    if (e instanceof ErreurExpr || e instanceof ErreurLecture || e instanceof RangeError || e instanceof TypeError) return OPAQUE
    throw e
  }
}

// ---------------------------------------------------------------- évaluation
const estNombre = v => typeof v === 'number' && Number.isFinite(v)
export function enTexte(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (estNombre(v)) return String(v)
  if (typeof v === 'string') return v
  return INCONNU
}
export function enNombre(v) {
  if (typeof v === 'boolean') return INCONNU
  if (estNombre(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return INCONNU
}

function ipv4(s) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s)
  if (!m) return null
  const o = m.slice(1).map(Number)
  if (o.some(x => x > 255)) return null
  return ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3]
}
const ipTexte = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')

export function lireCidr(s, strict = true) {
  if (typeof s !== 'string') return { erreur: 'not a string' }
  const m = /^([^/]+)\/(\d{1,2})$/.exec(s.trim())
  if (!m) return { erreur: 'expected address/prefix' }
  const ip = ipv4(m[1])
  const p = Number(m[2])
  if (ip === null) return { v6: m[1].includes(':'), erreur: m[1].includes(':') ? null : 'invalid IPv4 address' }
  if (p > 32) return { erreur: `prefix length ${p} > 32` }
  const masque = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0
  const réseau = (ip & masque) >>> 0
  if (strict && réseau !== ip) return { erreur: 'host bits set', suggestion: `${ipTexte(réseau)}/${p}` }
  return { base: réseau, prefix: p, taille: 2 ** (32 - p), texte: `${ipTexte(réseau)}/${p}` }
}

export function lireCidr6(s) {
  if (typeof s !== 'string') return { erreur: 'not a string' }
  const m = /^([0-9A-Fa-f:.]+)\/(\d{1,3})$/.exec(s.trim())
  if (!m || !m[1].includes(':')) return { erreur: 'expected IPv6 address/prefix' }
  if (Number(m[2]) > 128) return { erreur: `prefix length ${m[2]} > 128` }
  if ((m[1].match(/::/g) || []).length > 1) return { erreur: 'invalid IPv6 address' }
  return { texte: s.trim() }
}

function cidrsubnet(préfixe, nb, num) {
  const c = lireCidr(préfixe, false)
  const b = enNombre(nb)
  const n = enNombre(num)
  if (c.erreur || b === INCONNU || n === INCONNU) return INCONNU
  const nouveau = c.prefix + b
  if (b < 0 || nouveau > 32 || n < 0 || n >= 2 ** b) return INCONNU
  const taille = 2 ** (32 - nouveau)
  return `${ipTexte(c.base + n * taille)}/${nouveau}`
}
function cidrhost(préfixe, h) {
  const c = lireCidr(préfixe, false)
  const n = enNombre(h)
  if (c.erreur || n === INCONNU) return INCONNU
  return ipTexte(n < 0 ? c.base + c.taille + n : c.base + n)
}
function format(fmt, ...args) {
  if (typeof fmt !== 'string' || !args.every(connu)) return INCONNU
  let k = 0
  let ok = true
  const out = fmt.replace(/%([%sdvq])/g, (_, s) => {
    if (s === '%') return '%'
    if (k >= args.length) { ok = false; return '' }
    const v = s === 'q' ? JSON.stringify(args[k]) : enTexte(args[k])
    k++
    if (v === INCONNU) { ok = false; return '' }
    return v
  })
  return ok ? out : INCONNU
}
const tableau = Array.isArray
const objet = v => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof DocJson) && !(v instanceof RéfRessource)

export const FONCTIONS = {
  cidrsubnet, cidrhost, format,
  lower: s => (typeof s === 'string' ? s.toLowerCase() : INCONNU),
  upper: s => (typeof s === 'string' ? s.toUpperCase() : INCONNU),
  trimspace: s => (typeof s === 'string' ? s.trim() : INCONNU),
  tostring: v => (v === null ? null : enTexte(v)),
  tonumber: enNombre,
  tobool: v => (typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : INCONNU),
  tolist: v => (tableau(v) ? v : INCONNU),
  toset: v => (tableau(v) ? v : INCONNU),
  tomap: v => (objet(v) ? v : INCONNU),
  length: v => ((tableau(v) || typeof v === 'string') && connu(v) ? v.length : objet(v) && connu(v) ? Object.keys(v).length : INCONNU),
  join: (sep, l) => (typeof sep === 'string' && tableau(l) && l.every(x => typeof x === 'string') ? l.join(sep) : INCONNU),
  concat: (...ls) => (ls.every(tableau) ? ls.flat() : INCONNU),
  merge: (...ms) => (ms.every(objet) ? Object.assign({}, ...ms) : INCONNU),
  lookup: (m, k, ...d) => (objet(m) && typeof k === 'string' ? (k in m ? m[k] : d.length ? d[0] : INCONNU) : INCONNU),
  element: (l, i) => (tableau(l) && l.length && estNombre(i) ? l[Math.trunc(i) % l.length] : INCONNU),
  coalesce: (...xs) => (xs.every(x => x !== INCONNU) ? (xs.find(x => x !== null && x !== '') ?? INCONNU) : INCONNU),
  min: (...xs) => (xs.length && xs.every(estNombre) ? Math.min(...xs) : INCONNU),
  max: (...xs) => (xs.length && xs.every(estNombre) ? Math.max(...xs) : INCONNU),
  abs: x => (estNombre(x) ? Math.abs(x) : INCONNU),
  floor: x => (estNombre(x) ? Math.floor(x) : INCONNU),
  ceil: x => (estNombre(x) ? Math.ceil(x) : INCONNU),
  split: (sep, s) => (typeof sep === 'string' && typeof s === 'string' && sep ? s.split(sep) : INCONNU),
  replace: (s, a, b) => ([s, a, b].every(x => typeof x === 'string') && !(a.startsWith('/') && a.endsWith('/')) ? s.split(a).join(b) : INCONNU),
  jsondecode: s => { if (typeof s !== 'string') return INCONNU; try { return JSON.parse(s) } catch { return INCONNU } },
}
const TOLÉRANTES = new Set(['coalesce', 'concat', 'merge', 'length'])
const RACINES_SPÉCIALES = new Set(['count', 'each', 'self', 'path', 'terraform', 'module'])

export function parcourir(v, chemin, ev) {
  for (const pas of chemin) {
    if (v === INCONNU || v instanceof RéfRessource) return INCONNU
    if (pas[0] === 'splat') return INCONNU
    if (pas[0] === 'attr') {
      if (objet(v) && Object.prototype.hasOwnProperty.call(v, pas[1])) v = v[pas[1]]
      else return INCONNU
    } else {
      const idx = ev.éval(pas[1])
      if (tableau(v) && estNombre(idx)) { const k = Math.trunc(idx); v = k >= 0 && k < v.length ? v[k] : INCONNU } else if (objet(v) && typeof idx === 'string') v = Object.prototype.hasOwnProperty.call(v, idx) ? v[idx] : INCONNU
      else return INCONNU
    }
  }
  return v
}

export class Évaluateur {
  constructor(portée) { this.portée = portée; this.prof = 0 }
  éval(n) {
    if (this.prof > 40) return INCONNU
    this.prof++
    try { return this.évalNœud(n) } catch { return INCONNU } finally { this.prof-- }
  }
  évalNœud(n) {
    switch (n?.k) {
      case 'lit': return n.v
      case 'tmpl': {
        let out = ''
        for (const p of n.parts) {
          if (typeof p === 'string') { out += p; continue }
          if (p === null || p === OPAQUE) return INCONNU
          const v = enTexte(this.éval(p))
          if (v === INCONNU) return INCONNU
          out += v
        }
        return out
      }
      case 'ref': return this.réf(n)
      case 'list': return n.items.map(x => this.éval(x))
      case 'obj': {
        const out = {}
        for (const [k, v] of n.items) {
          let clé = k.k === 'ref' && !k.path.length ? k.root : this.éval(k)
          if (typeof clé !== 'string') { clé = enTexte(clé); if (clé === INCONNU) return INCONNU }
          out[clé] = this.éval(v)
        }
        return out
      }
      case 'call': {
        if (n.name === 'jsonencode' && n.args.length === 1) return new DocJson(this.éval(n.args[0]))
        const f = FONCTIONS[n.name]
        if (!f || n.étendre) return INCONNU
        const args = n.args.map(a => this.éval(a))
        if (!TOLÉRANTES.has(n.name) && args.some(a => a === INCONNU)) return INCONNU
        return f(...args)
      }
      case 'cond': {
        const c = this.éval(n.c)
        return c === true ? this.éval(n.a) : c === false ? this.éval(n.b) : INCONNU
      }
      case 'un': {
        const v = this.éval(n.e)
        if (n.op === '!' && typeof v === 'boolean') return !v
        if (n.op === '-' && estNombre(v)) return -v
        return INCONNU
      }
      case 'bin': return this.binaire(n)
      case 'post': return parcourir(this.éval(n.base), n.path, this)
      default: return INCONNU
    }
  }
  binaire(n) {
    const a = this.éval(n.g)
    const b = this.éval(n.d)
    if (n.op === '&&' || n.op === '||') return typeof a === 'boolean' && typeof b === 'boolean' ? (n.op === '&&' ? a && b : a || b) : INCONNU
    if (!connu(a) || !connu(b)) return INCONNU
    if (n.op === '==') return JSON.stringify(a) === JSON.stringify(b)
    if (n.op === '!=') return JSON.stringify(a) !== JSON.stringify(b)
    const x = enNombre(a)
    const y = enNombre(b)
    if (x === INCONNU || y === INCONNU) return INCONNU
    switch (n.op) {
      case '+': return x + y
      case '-': return x - y
      case '*': return x * y
      case '/': return y === 0 ? INCONNU : x / y
      case '%': return y === 0 ? INCONNU : x % y
      case '<': return x < y
      case '>': return x > y
      case '<=': return x <= y
      case '>=': return x >= y
      default: return INCONNU
    }
  }
  réf(n) {
    const { root, path } = n
    const premier = path[0]?.[0] === 'attr' ? path[0][1] : null
    if (root === 'var') return premier === null ? INCONNU : parcourir(this.portée.var(premier), path.slice(1), this)
    if (root === 'local') return premier === null ? INCONNU : parcourir(this.portée.local(premier), path.slice(1), this)
    if (root === 'data') {
      if (path.length < 2 || path[0][0] !== 'attr' || path[1][0] !== 'attr') return INCONNU
      return this.portée.ressource(path[0][1], path[1][1], path.slice(2), true)
    }
    if (RACINES_SPÉCIALES.has(root)) return INCONNU
    if (root.includes('_') && premier !== null) return this.portée.ressource(root, premier, path.slice(1), false)
    return INCONNU
  }
}

export const PORTÉE_VIDE = { var: () => INCONNU, local: () => INCONNU, ressource: () => INCONNU }
export const littéral = toks => new Évaluateur(PORTÉE_VIDE).éval(analyserJetons(toks))

// Toutes les références (var.x, local.y, aws_vpc.main…) d'une expression.
export function références(n) {
  const out = []
  const visiter = x => {
    if (!x || typeof x !== 'object') return
    switch (x.k) {
      case 'ref': out.push(x); x.path.forEach(p => p[0] === 'index' && visiter(p[1])); break
      case 'tmpl': x.parts.forEach(p => p && typeof p === 'object' && visiter(p)); break
      case 'list': x.items.forEach(visiter); break
      case 'obj': x.items.forEach(([k, v]) => { if (!(k.k === 'ref' && !k.path.length)) visiter(k); visiter(v) }); break
      case 'call': x.args.forEach(visiter); break
      case 'cond': visiter(x.c); visiter(x.a); visiter(x.b); break
      case 'bin': visiter(x.g); visiter(x.d); break
      case 'un': visiter(x.e); break
      case 'post': visiter(x.base); x.path.forEach(p => p[0] === 'index' && visiter(p[1])); break
      default:
    }
  }
  visiter(n)
  return out
}

// Représentation JSON d'une valeur évaluée (inconnu → null).
export function brut(v) {
  if (v === INCONNU) return null
  if (v instanceof RéfRessource) return `\${${v.address}.${v.attr}}`
  if (v instanceof DocJson) return brut(v.value)
  if (Array.isArray(v)) return v.map(brut)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, brut(x)]))
  return v
}
