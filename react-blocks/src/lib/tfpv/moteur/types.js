// Contraintes de type Terraform (variable « type = … » et schémas de
// providers) et contrôle des valeurs, avec les conversions de Terraform
// (« 3 » est un nombre valide, « three » non).
import { INCONNU, connu } from './expr.js'

export const TOUT = { kind: 'any' }
export const INDÉTERMINÉ = { kind: 'unknown' }

export function texteType(t) {
  if (['list', 'set', 'map'].includes(t.kind)) return `${t.kind}(${texteType(t.elem)})`
  if (t.kind === 'object') return `object({${Object.entries(t.attrs).map(([k, [at, opt]]) => `${k}=${opt ? `optional(${texteType(at)})` : texteType(at)}`).join(', ')}})`
  if (t.kind === 'tuple') return `tuple([${t.items.map(texteType).join(', ')}])`
  return t.kind
}

// Expression de type (AST de expr.js) → type
export function typeDepuisAst(n) {
  if (n?.k === 'ref' && !n.path.length) return ['string', 'number', 'bool', 'any'].includes(n.root) ? { kind: n.root } : INDÉTERMINÉ
  if (n?.k === 'call') {
    if (['list', 'set', 'map'].includes(n.name) && n.args.length === 1) return { kind: n.name, elem: typeDepuisAst(n.args[0]) }
    if (n.name === 'tuple' && n.args.length === 1 && n.args[0].k === 'list') return { kind: 'tuple', items: n.args[0].items.map(typeDepuisAst) }
    if (n.name === 'object' && n.args.length === 1 && n.args[0].k === 'obj') {
      const attrs = {}
      for (const [k, v] of n.args[0].items) {
        if (!(k.k === 'ref' && !k.path.length)) return INDÉTERMINÉ
        const opt = v.k === 'call' && v.name === 'optional'
        attrs[k.root] = [opt ? typeDepuisAst(v.args[0]) : typeDepuisAst(v), opt]
      }
      return { kind: 'object', attrs }
    }
  }
  return INDÉTERMINÉ
}

// Type compact d'un schéma de provider (« s », ["l","s"], ["o",{…}]) → type.
// Les attributs d'objets sont traités comme facultatifs (pas de faux positif).
export function typeDepuisSchéma(t) {
  if (t === 's') return { kind: 'string' }
  if (t === 'n') return { kind: 'number' }
  if (t === 'b') return { kind: 'bool' }
  if (!Array.isArray(t)) return TOUT
  const [k, inner] = t
  if (k === 'l') return { kind: 'list', elem: typeDepuisSchéma(inner) }
  if (k === 's') return { kind: 'set', elem: typeDepuisSchéma(inner) }
  if (k === 'm') return { kind: 'map', elem: typeDepuisSchéma(inner) }
  if (k === 'o') return { kind: 'object', attrs: Object.fromEntries(Object.entries(inner).map(([a, x]) => [a, [typeDepuisSchéma(x), true]])) }
  if (k === 't') return { kind: 'tuple', items: inner.map(typeDepuisSchéma) }
  return TOUT
}

const décrire = v => (typeof v === 'boolean' ? 'bool' : typeof v === 'number' ? 'number' : typeof v === 'string' ? 'string' : Array.isArray(v) ? 'list/tuple' : v && typeof v === 'object' ? 'object/map' : 'null')

// null si Terraform sait convertir la valeur, sinon la raison.
export function vérifierValeur(v, t, chemin = '') {
  const où = chemin ? ` at ${chemin}` : ''
  if (v === null || v === undefined || v === INCONNU || t.kind === 'any' || t.kind === 'unknown' || !connu(v)) return null
  switch (t.kind) {
    case 'string':
      return ['string', 'number', 'boolean'].includes(typeof v) ? null : `string required${où}, got ${décrire(v)}`
    case 'number':
      if (typeof v === 'boolean') return `number required${où}, got bool`
      if (typeof v === 'number') return null
      if (typeof v === 'string') return v.trim() !== '' && !Number.isNaN(Number(v)) ? null : `a number is required${où}, got string ${JSON.stringify(v)}`
      return `number required${où}, got ${décrire(v)}`
    case 'bool':
      return typeof v === 'boolean' || v === 'true' || v === 'false' ? null : `bool required${où}, got ${décrire(v)}`
    case 'list':
    case 'set': {
      if (!Array.isArray(v)) return `${texteType(t)} required${où}, got ${décrire(v)}`
      for (let i = 0; i < v.length; i++) { const r = vérifierValeur(v[i], t.elem || TOUT, `${chemin}[${i}]`); if (r) return r }
      return null
    }
    case 'tuple': {
      if (!Array.isArray(v)) return `${texteType(t)} required${où}, got ${décrire(v)}`
      if (v.length !== t.items.length) return `tuple of ${t.items.length} elements required${où}, got ${v.length}`
      for (let i = 0; i < v.length; i++) { const r = vérifierValeur(v[i], t.items[i], `${chemin}[${i}]`); if (r) return r }
      return null
    }
    case 'map': {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return `${texteType(t)} required${où}, got ${décrire(v)}`
      for (const [k, x] of Object.entries(v)) { const r = vérifierValeur(x, t.elem || TOUT, `${chemin}[${JSON.stringify(k)}]`); if (r) return r }
      return null
    }
    case 'object': {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return `object required${où}, got ${décrire(v)}`
      for (const [nom, [at, opt]] of Object.entries(t.attrs)) {
        if (!(nom in v)) { if (!opt) return `attribute "${nom}" is required${où}`; continue }
        const r = vérifierValeur(v[nom], at, chemin ? `${chemin}.${nom}` : nom)
        if (r) return r
      }
      return null
    }
    default: return null
  }
}
