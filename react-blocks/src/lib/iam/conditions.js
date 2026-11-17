// Opérateurs de condition IAM et leur évaluation (sémantique documentée par AWS) :
//  · plusieurs opérateurs ou plusieurs clés → ET ; plusieurs valeurs pour une clé → OU
//    (ET des négations pour les opérateurs négatifs : « aucune des valeurs ») ;
//  · clé absente de la requête → faux, sauf opérateur négatif ou suffixe IfExists → vrai ;
//  · ForAnyValue : au moins une valeur de la requête convient (faux si la clé est absente) ;
//    ForAllValues : toutes conviennent (vrai si la clé est absente ou vide) ;
//  · variables de politique ${aws:username}, ${*} ${?} ${$} et valeurs par défaut ${clé, 'défaut'}.
import { compiler, compilerParties, reconnaît } from './glob.js'
import { découperArn } from './arn.js'

export const FAMILLES = {
  string: { nom: 'Texte', types: ['String'] },
  numeric: { nom: 'Nombre', types: ['Numeric'] },
  date: { nom: 'Date', types: ['Date'] },
  bool: { nom: 'Booléen', types: ['Bool'] },
  binary: { nom: 'Binaire (base64)', types: [] },
  ip: { nom: 'Adresse IP', types: ['IPAddress'] },
  arn: { nom: 'ARN', types: ['ARN'] },
  null: { nom: 'Présence', types: [] },
}

// nég : opérateur négatif (« aucune des valeurs ») ; cmp : comparaison d'UNE valeur de requête à UNE valeur de politique.
const T = (famille, nég, extra = {}) => ({ famille, nég, ...extra })
export const OPÉRATEURS = {
  StringEquals: T('string', false, { cmp: 'eq' }),
  StringNotEquals: T('string', true, { cmp: 'eq' }),
  StringEqualsIgnoreCase: T('string', false, { cmp: 'eqi' }),
  StringNotEqualsIgnoreCase: T('string', true, { cmp: 'eqi' }),
  StringLike: T('string', false, { cmp: 'like' }),
  StringNotLike: T('string', true, { cmp: 'like' }),
  NumericEquals: T('numeric', false, { cmp: '=' }),
  NumericNotEquals: T('numeric', true, { cmp: '=' }),
  NumericLessThan: T('numeric', false, { cmp: '<' }),
  NumericLessThanEquals: T('numeric', false, { cmp: '<=' }),
  NumericGreaterThan: T('numeric', false, { cmp: '>' }),
  NumericGreaterThanEquals: T('numeric', false, { cmp: '>=' }),
  DateEquals: T('date', false, { cmp: '=' }),
  DateNotEquals: T('date', true, { cmp: '=' }),
  DateLessThan: T('date', false, { cmp: '<' }),
  DateLessThanEquals: T('date', false, { cmp: '<=' }),
  DateGreaterThan: T('date', false, { cmp: '>' }),
  DateGreaterThanEquals: T('date', false, { cmp: '>=' }),
  Bool: T('bool', false, { cmp: 'bool' }),
  BinaryEquals: T('binary', false, { cmp: 'eq' }),
  IpAddress: T('ip', false, { cmp: 'ip' }),
  NotIpAddress: T('ip', true, { cmp: 'ip' }),
  ArnEquals: T('arn', false, { cmp: 'arn' }),
  ArnNotEquals: T('arn', true, { cmp: 'arn' }),
  ArnLike: T('arn', false, { cmp: 'arn' }),
  ArnNotLike: T('arn', true, { cmp: 'arn' }),
  Null: T('null', false, { cmp: 'null' }),
}
const PAR_MINUSCULE = new Map(Object.keys(OPÉRATEURS).map(k => [k.toLowerCase(), k]))

// « ForAllValues:StringLikeIfExists » → { base, info, ensemble, siExiste, canonique, casseCanonique }
export function analyserOpérateur(nom) {
  if (typeof nom !== 'string') return null
  let reste = nom
  let ensemble = null
  const m = /^(ForAllValues|ForAnyValue):(.*)$/i.exec(reste)
  if (m) {
    ensemble = /^forall/i.test(m[1]) ? 'ForAllValues' : 'ForAnyValue'
    reste = m[2]
  }
  let siExiste = false
  if (/ifexists$/i.test(reste)) { siExiste = true; reste = reste.slice(0, -'IfExists'.length) }
  const base = PAR_MINUSCULE.get(reste.toLowerCase())
  if (!base) return null
  const canonique = `${ensemble ? `${ensemble}:` : ''}${base}${siExiste ? 'IfExists' : ''}`
  return { base, info: OPÉRATEURS[base], ensemble, siExiste, canonique, casseCanonique: canonique === nom }
}

export const listeOpérateurs = () => Object.keys(OPÉRATEURS)

// ---- Adresses IP ---------------------------------------------------------------------------------------

function ipv4(s) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s)
  if (!m) return null
  let n = 0n
  for (let i = 1; i <= 4; i++) {
    const o = Number(m[i])
    if (o > 255) return null
    n = (n << 8n) | BigInt(o)
  }
  return { v: 4, n }
}
function ipv6(s) {
  if (!/^[0-9a-fA-F:.]+$/.test(s) || !s.includes(':')) return null
  let t = s
  const fin = /(\d+\.\d+\.\d+\.\d+)$/.exec(t)
  if (fin) {
    const v = ipv4(fin[1])
    if (!v) return null
    t = `${t.slice(0, -fin[1].length)}${((v.n >> 16n) & 0xffffn).toString(16)}:${(v.n & 0xffffn).toString(16)}`
  }
  const doubles = t.split('::')
  if (doubles.length > 2) return null
  const lire = x => (x === '' ? [] : x.split(':'))
  const g = lire(doubles[0])
  const d = doubles.length === 2 ? lire(doubles[1]) : []
  if (doubles.length === 1 && g.length !== 8) return null
  if (doubles.length === 2 && g.length + d.length > 7) return null
  const groupes = doubles.length === 2 ? [...g, ...Array(8 - g.length - d.length).fill('0'), ...d] : g
  let n = 0n
  for (const x of groupes) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(x)) return null
    n = (n << 16n) | BigInt(`0x${x}`)
  }
  return { v: 6, n }
}
export const lireIp = s => ipv4(s) ?? ipv6(s)

// « 10.0.0.0/8 » ou « 203.0.113.5 » → { v, n, bits, longueur }
export function lireCidr(s) {
  const [adr, masque, ...autres] = String(s).split('/')
  if (autres.length) return null
  const ip = lireIp(adr)
  if (!ip) return null
  const total = ip.v === 4 ? 32 : 128
  let bits = total
  if (masque !== undefined) {
    if (!/^\d{1,3}$/.test(masque)) return null
    bits = Number(masque)
    if (bits > total) return null
  }
  return { ...ip, bits, total }
}

export function ipDansCidr(ipTexte, cidrTexte) {
  const ip = lireIp(ipTexte)
  const c = lireCidr(cidrTexte)
  if (!ip || !c || ip.v !== c.v) return false
  const décalage = BigInt(c.total - c.bits)
  return (ip.n >> décalage) === (c.n >> décalage)
}

// Bits d'hôte non nuls dans un CIDR (10.0.0.1/8) : IAM les interprète, mais c'est souvent une erreur.
export function bitsHôteNonNuls(cidrTexte) {
  const c = lireCidr(cidrTexte)
  if (!c || c.bits === c.total) return false
  const décalage = BigInt(c.total - c.bits)
  return ((c.n >> décalage) << décalage) !== c.n
}

// ---- Dates ----------------------------------------------------------------------------------------------

const RE_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/
export function lireDate(v) {
  const s = String(v).trim()
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s) * 1000
  const m = RE_DATE.exec(s)
  if (!m) return null
  const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4] ?? '00'}:${m[5] ?? '00'}:${m[6] ?? '00'}${m[7] ? (m[7].length === 5 && !m[7].includes(':') && m[7] !== 'Z' ? `${m[7].slice(0, 3)}:${m[7].slice(3)}` : m[7]) : 'Z'}`)
  return Number.isNaN(t) ? null : t
}

// ---- Valeurs et contexte ---------------------------------------------------------------------------------

export const enTexte = v => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v))

// Contexte de requête : { clé: valeur | [valeurs] } → Map(clé minuscule → [chaînes]).
export function normaliserContexte(contexte = {}) {
  const m = new Map()
  for (const [k, v] of Object.entries(contexte)) {
    const liste = (Array.isArray(v) ? v : [v]).filter(x => x !== undefined && x !== null).map(enTexte)
    m.set(k.toLowerCase(), liste)
  }
  return m
}

// Variables de politique. Renvoie { parties:[{v, littéral}], manquantes:[clés] }.
export function résoudreVariables(texte, ctx) {
  const parties = []
  const manquantes = []
  let i = 0
  let courant = ''
  const vider = () => { if (courant) { parties.push({ v: courant, littéral: false }); courant = '' } }
  while (i < texte.length) {
    if (texte[i] === '$' && texte[i + 1] === '{') {
      const fin = texte.indexOf('}', i + 2)
      if (fin > 0) {
        const corps = texte.slice(i + 2, fin)
        if (corps === '*' || corps === '?' || corps === '$') { vider(); parties.push({ v: corps, littéral: true }) } else {
          const m = /^\s*([^,\s]+)\s*(?:,\s*'([^']*)')?\s*$/.exec(corps)
          if (m) {
            vider()
            const valeurs = ctx?.get(m[1].toLowerCase())
            if (valeurs && valeurs.length === 1) parties.push({ v: valeurs[0], littéral: true })
            else if (m[2] !== undefined) parties.push({ v: m[2], littéral: true })
            else manquantes.push(m[1])
          } else courant += texte.slice(i, fin + 1)
        }
        i = fin + 1
        continue
      }
    }
    courant += texte[i]
    i++
  }
  vider()
  return { parties, manquantes }
}

export const contientVariable = texte => /\$\{[^}]+\}/.test(texte)

// Comparaison d'une valeur de requête (rv) à une valeur de politique déjà résolue (parties).
function comparer(cmp, famille, rv, parties) {
  const pv = parties.map(p => p.v).join('')
  switch (cmp) {
    case 'eq': return rv === pv
    case 'eqi': return rv.toLowerCase() === pv.toLowerCase()
    case 'like': return reconnaît(compilerParties(parties), rv)
    case 'bool': return rv.toLowerCase() === pv.toLowerCase()
    case '=': case '<': case '<=': case '>': case '>=': {
      const a = cmpValeur(famille, rv, pv)
      if (a === null) return false
      return cmp === '=' ? a === 0 : cmp === '<' ? a < 0 : cmp === '<=' ? a <= 0 : cmp === '>' ? a > 0 : a >= 0
    }
    case 'ip': return ipDansCidr(rv, pv)
    case 'arn': {
      const r = découperArn(rv)
      const p = découperArn(pv)
      if (!r.ok || !p.ok) return false
      // ArnLike : chaque partie est comparée séparément (jokers permis dans le motif).
      for (let k = 0; k < 6; k++) if (!reconnaît(compiler(p.composantes[k]), r.composantes[k])) return false
      return true
    }
    default: return false
  }
}

// Numérique ou date : renvoie -1/0/1 ou null si l'une des valeurs n'est pas lisible.
function cmpValeur(famille, a, b) {
  const lire = famille === 'date' ? lireDate : v => (/^-?\d+(\.\d+)?$/.test(String(v).trim()) ? Number(v) : null)
  const x = lire(a)
  const y = lire(b)
  if (x === null || y === null) return null
  return x < y ? -1 : x > y ? 1 : 0
}

// ---- Évaluation d'une condition -----------------------------------------------------------------------------

// cond : { opérateur, clé, valeurs } ; ctx : Map (voir normaliserContexte).
// Résultat : { vrai, détail }
export function évaluerCondition(cond, ctx) {
  const op = analyserOpérateur(cond.opérateur)
  if (!op) return { vrai: false, détail: `Opérateur « ${cond.opérateur} » inconnu : la condition ne peut pas être vraie.` }
  const { info, ensemble, siExiste } = op
  const requête = ctx.get(cond.clé.toLowerCase())
  const présente = !!requête && requête.length > 0
  const attendu = cond.valeurs.map(enTexte)
  const montrer = () => (présente ? requête.join(', ') : 'absente')
  const résumé = `${cond.clé} = ${montrer()} · ${cond.opérateur} ${attendu.join(' | ')}`

  if (info.famille === 'null') {
    const veutAbsente = attendu.some(v => v.toLowerCase() === 'true') && !attendu.some(v => v.toLowerCase() === 'false')
    const vrai = veutAbsente ? !présente : présente
    return { vrai, détail: `${résumé} → ${vrai ? 'vrai' : 'faux'}` }
  }

  // Valeurs de politique, variables résolues (une variable non résolue ne correspond à rien).
  const résolues = attendu.map(v => résoudreVariables(v, ctx)).filter(r => r.manquantes.length === 0).map(r => r.parties)
  const test = rv => {
    if (info.nég) return résolues.every(p => !comparer(info.cmp, info.famille, rv, p))
    return résolues.some(p => comparer(info.cmp, info.famille, rv, p))
  }
  let vrai
  let motif = ''
  if (!présente) {
    if (siExiste) { vrai = true; motif = 'clé absente, IfExists → vrai' } else if (ensemble === 'ForAllValues') { vrai = true; motif = 'ForAllValues sur une clé absente → vrai (piège connu)' } else if (ensemble === 'ForAnyValue') { vrai = false; motif = 'clé absente → faux' } else if (info.nég) { vrai = true; motif = 'opérateur négatif sur une clé absente → vrai' } else { vrai = false; motif = 'clé absente de la requête → faux' }
  } else if (ensemble === 'ForAllValues') { vrai = requête.every(test); motif = 'toutes les valeurs doivent convenir' } else if (ensemble === 'ForAnyValue') { vrai = requête.some(test); motif = 'au moins une valeur doit convenir' } else if (info.nég) { vrai = requête.every(test) } else { vrai = requête.some(test) }
  return { vrai, détail: `${résumé} → ${vrai ? 'vrai' : 'faux'}${motif ? ` (${motif})` : ''}` }
}

// Toutes les conditions d'une déclaration (ET).
export function évaluerConditions(conditions, contexte) {
  const ctx = contexte instanceof Map ? contexte : normaliserContexte(contexte)
  const détails = []
  let ok = true
  for (const c of conditions) {
    const r = évaluerCondition(c, ctx)
    détails.push({ ...r, opérateur: c.opérateur, clé: c.clé })
    if (!r.vrai) ok = false
  }
  return { vrai: ok, détails }
}
