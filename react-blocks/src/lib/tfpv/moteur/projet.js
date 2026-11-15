// Modèle du projet Terraform (fichiers, modules, variables, ressources) et
// contrôles du « scanner » : variables sans valeur, tfvars mal typés,
// références non déclarées, modules locaux, déclarations en double, etc.
import { adresse, enfants, lireHcl } from './hcl.js'
import { Évaluateur, INCONNU, RéfRessource, analyserJetons, littéral, parcourir, références } from './expr.js'
import { INDÉTERMINÉ, texteType, typeDepuisAst, vérifierValeur } from './types.js'

export const DOSSIERS_IGNORÉS = new Set(['.terraform', '.git', 'node_modules', '.terragrunt-cache', '__pycache__', '.venv', 'venv', '.idea', '.vscode', '.tfpv'])
const PROVIDERS_COURANTS = ['aws', 'azurerm', 'azuread', 'google', 'kubernetes', 'helm', 'random', 'null', 'tls', 'local', 'archive', 'time', 'http', 'external', 'template', 'cloudinit', 'tfe', 'github', 'gitlab', 'datadog', 'vault', 'consul']
const TYPES_HAUT = new Set(['terraform', 'provider', 'variable', 'locals', 'output', 'module', 'resource', 'data', 'moved', 'import', 'removed', 'check', 'ephemeral'])
export const TAILLE_MAX = 5 * 1024 * 1024

const dossier = p => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.')
const nomFichier = p => p.slice(p.lastIndexOf('/') + 1)
export function normaliserChemin(base, rel) {
  const parts = base === '.' ? [] : base.split('/')
  for (const seg of rel.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') { if (!parts.length || parts[parts.length - 1] === '..') parts.push('..'); else parts.pop() } else parts.push(seg)
  }
  return parts.length ? parts.join('/') : '.'
}

export function trou(type, message) {
  return { type, message }
}

// fichiers : [{ path, content }] (dossier envoyé, zip, ou code collé)
export function chargerProjet(fichiers, { fichiersVariables = [] } = {}) {
  let liste = fichiers
    .map(f => ({ path: String(f.path || f.name || 'main.tf').replace(/\\/g, '/').replace(/^\.?\/+/, ''), content: f.content ?? '' }))
    .filter(f => !f.path.split('/').some(seg => DOSSIERS_IGNORÉS.has(seg) || seg.startsWith('.terraform')))
  // Dossier choisi : on retire son nom commun (« infra/main.tf » → « main.tf »).
  let racineNom = null
  const premiers = new Set(liste.map(f => (f.path.includes('/') ? f.path.split('/')[0] : null)))
  if (liste.length && premiers.size === 1 && !premiers.has(null)) {
    racineNom = [...premiers][0]
    liste = liste.map(f => ({ ...f, path: f.path.slice(racineNom.length + 1) }))
  }
  const p = { racineNom, fichiers: {}, modules: {}, analysés: {}, tfvars: {}, json: [], ignorés: [], tropGros: [], trous: [], racines: [] }
  for (const f of liste) {
    p.fichiers[f.path] = f.content
    const nom = nomFichier(f.path)
    if (f.content.length > TAILLE_MAX) { p.tropGros.push(f.path); continue }
    if (nom.endsWith('.tf')) {
      const hf = lireHcl(f.content, f.path)
      p.analysés[f.path] = hf
      const d = dossier(f.path)
      const m = (p.modules[d] ||= nouveauModule(d))
      m.files[f.path] = hf
      for (const b of hf.blocks) ajouterBloc(m, b, f.path)
    } else if (nom.endsWith('.tf.json')) {
      const d = dossier(f.path)
      ;(p.modules[d] ||= nouveauModule(d)).jsonFiles.push(f.path)
      p.json.push(f.path)
    } else if (nom.endsWith('.tfvars')) {
      const hf = lireHcl(f.content, f.path, true)
      p.analysés[f.path] = hf
      p.tfvars[f.path] = hf.error ? {} : Object.fromEntries(Object.entries(hf.attributes).map(([k, a]) => [k, [littéral(a.tokens), a.line]]))
    } else if (nom.endsWith('.tfvars.json')) {
      try {
        const d = JSON.parse(f.content)
        p.tfvars[f.path] = d && typeof d === 'object' && !Array.isArray(d) ? Object.fromEntries(Object.entries(d).map(([k, v]) => [k, [v, 1]])) : {}
      } catch { p.tfvars[f.path] = {} }
    } else p.ignorés.push(f.path)
  }
  // Modules racines : dossiers avec des .tf qu'aucun autre module n'appelle.
  const appelés = new Set()
  for (const m of Object.values(p.modules)) {
    for (const [, [b]] of Object.entries(m.moduleCalls)) {
      const src = b.attributes.source ? littéral(b.attributes.source.tokens) : null
      if (typeof src === 'string' && /^\.\.?\//.test(src)) appelés.add(normaliserChemin(m.dir, src))
    }
  }
  p.racines = Object.keys(p.modules).filter(d => !appelés.has(d) && Object.keys(p.modules[d].files).length).sort((a, b) => (a === '.' ? -1 : b === '.' ? 1 : a.localeCompare(b)))
  // Les fichiers de variables choisis arrivent avec le nom du dossier choisi.
  p.fichiersVariables = fichiersVariables.map(f => String(f).replace(/\\/g, '/')).map(f => (racineNom && f.startsWith(`${racineNom}/`) ? f.slice(racineNom.length + 1) : f))
  return p
}

function nouveauModule(dir) {
  return { dir, files: {}, variables: {}, locals: {}, resources: {}, data: {}, moduleCalls: {}, providers: [], outputs: {}, terraformBlocks: [], autres: [], jsonFiles: [], doublons: [] }
}

function ajouterBloc(m, b, rel) {
  const garder = (table, clé) => { if (table[clé]) m.doublons.push([b, rel, table[clé][1]]); else table[clé] = [b, rel] }
  if (b.type === 'variable' && b.labels.length) garder(m.variables, b.labels[0])
  else if (b.type === 'locals') for (const [n, a] of Object.entries(b.attributes)) { if (m.locals[n]) m.doublons.push([{ ...b, line: a.line, type: 'local', labels: [n] }, rel, m.locals[n][1]]); else m.locals[n] = [a, rel] }
  else if (b.type === 'resource' && b.labels.length === 2) garder(m.resources, `${b.labels[0]}.${b.labels[1]}`)
  else if (b.type === 'data' && b.labels.length === 2) garder(m.data, `${b.labels[0]}.${b.labels[1]}`)
  else if (b.type === 'module' && b.labels.length) garder(m.moduleCalls, b.labels[0])
  else if (b.type === 'provider') m.providers.push([b, rel])
  else if (b.type === 'output' && b.labels.length) garder(m.outputs, b.labels[0])
  else if (b.type === 'terraform') m.terraformBlocks.push([b, rel])
  else m.autres.push([b, rel])
}

export function nomsProviders(m) {
  const noms = new Set(PROVIDERS_COURANTS)
  for (const [b] of m.providers) if (b.labels[0]) noms.add(b.labels[0])
  for (const [b] of m.terraformBlocks) for (const rp of enfants(b, 'required_providers')) Object.keys(rp.attributes).forEach(n => noms.add(n))
  return noms
}

export function texteFichier(p, rel) {
  return p.fichiers[rel] ?? null
}

export function localiser(p, rel, line) {
  if (!rel || !line) return null
  const hf = p.analysés[rel]
  const b = hf?.blocks.find(x => x.line <= line && line <= x.endLine)
  if (!b || !['resource', 'data', 'module', 'variable', 'output', 'provider', 'locals'].includes(b.type)) return null
  return b.type === 'locals' ? 'locals' : adresse(b)
}

// ---------------------------------------------------------------- portées
export class PortéeModule {
  constructor(module, valeurs, préfixe = '') {
    this.module = module
    this.valeurs = valeurs
    this.préfixe = préfixe
    this.cacheLocals = new Map()
    this.enCours = new Set()
  }
  éval(attr) { return attr ? new Évaluateur(this).éval(analyserJetons(attr.tokens)) : null }
  var(nom) { return Object.prototype.hasOwnProperty.call(this.valeurs, nom) ? this.valeurs[nom] : INCONNU }
  local(nom) {
    if (this.cacheLocals.has(nom)) return this.cacheLocals.get(nom)
    if (this.enCours.has(nom) || !this.module.locals[nom]) return INCONNU
    this.enCours.add(nom)
    let v
    try { v = this.éval(this.module.locals[nom][0]) } finally { this.enCours.delete(nom) }
    this.cacheLocals.set(nom, v)
    return v
  }
  ressource(type, nom, chemin, data) {
    const clé = `${type}.${nom}`
    const table = data ? this.module.data : this.module.resources
    if (!table[clé] || !chemin.length || chemin[0][0] !== 'attr') return INCONNU
    const b = table[clé][0]
    if (b.attributes.count || b.attributes.for_each) return INCONNU
    const attr = chemin[0][1]
    const adr = `${this.préfixe}${data ? 'data.' : ''}${clé}`
    if (b.attributes[attr] && attr !== 'id' && attr !== 'arn') {
      const marque = `${adr}.${attr}`
      if (this.enCours.has(marque)) return INCONNU
      this.enCours.add(marque)
      let v
      try { v = this.éval(b.attributes[attr]) } finally { this.enCours.delete(marque) }
      return parcourir(v, chemin.slice(1), new Évaluateur(this))
    }
    return chemin.length === 1 ? new RéfRessource(adr, attr) : INCONNU
  }
}

const valeurDéfaut = b => (b.attributes.default ? littéral(b.attributes.default.tokens) : INCONNU)

export function fichiersAuto(p, racine) {
  const auto = Object.keys(p.tfvars).filter(r => dossier(r) === racine && (/^terraform\.tfvars(\.json)?$/.test(nomFichier(r)) || /\.auto\.tfvars(\.json)?$/.test(r)))
  return auto.sort((a, b) => (nomFichier(a).startsWith('terraform.tfvars') ? 0 : 1) - (nomFichier(b).startsWith('terraform.tfvars') ? 0 : 1) || a.localeCompare(b))
}

// Fichiers de variables choisis par l'utilisateur, rattachés au module racine
// le plus proche (env/prod.tfvars → racine « . »).
export function fichiersChoisis(p, racine) {
  return (p.fichiersVariables || []).filter(f => p.tfvars[f] && racineDe(p, f) === racine)
}
function racineDe(p, rel) {
  let d = dossier(rel)
  for (;;) {
    if (p.racines.includes(d)) return d
    if (d === '.') return p.racines[0] ?? null
    d = dossier(d)
  }
}

export function valeursRacine(p, racine, { externes = [] } = {}) {
  const m = p.modules[racine]
  const valeurs = {}
  const sources = {}
  if (!m) return { valeurs, sources }
  for (const [nom, [b]] of Object.entries(m.variables)) {
    if (b.attributes.default) { valeurs[nom] = valeurDéfaut(b); sources[nom] = 'default' }
    if (externes.includes(nom)) { valeurs[nom] = INCONNU; sources[nom] = 'CI (TF_VAR_)' }
  }
  for (const rel of [...fichiersAuto(p, racine), ...fichiersChoisis(p, racine)]) {
    for (const [nom, [v]] of Object.entries(p.tfvars[rel] || {})) if (m.variables[nom]) { valeurs[nom] = v; sources[nom] = rel }
  }
  return { valeurs, sources }
}

export function instances(p, valeursParRacine, profMax = 6) {
  const out = []
  const visités = new Set()
  const visiter = (m, valeurs, préfixe, appelant, prof) => {
    const portée = new PortéeModule(m, valeurs, préfixe)
    out.push({ module: m, portée, préfixe, appelant })
    visités.add(m.dir)
    if (prof >= profMax) return
    for (const [nom, [b]] of Object.entries(m.moduleCalls)) {
      const src = b.attributes.source ? littéral(b.attributes.source.tokens) : null
      if (typeof src !== 'string' || !/^\.\.?\//.test(src)) continue
      const enfant = p.modules[normaliserChemin(m.dir, src)]
      if (!enfant) continue
      const vals = {}
      for (const [vn, [vb]] of Object.entries(enfant.variables)) {
        if (b.attributes[vn]) vals[vn] = portée.éval(b.attributes[vn])
        else if (vb.attributes.default) vals[vn] = valeurDéfaut(vb)
      }
      const multi = b.attributes.count || b.attributes.for_each
      visiter(enfant, multi ? Object.fromEntries(Object.keys(vals).map(k => [k, INCONNU])) : vals, `${préfixe}module.${nom}.`, `${préfixe}module.${nom}`, prof + 1)
    }
  }
  for (const r of p.racines) if (p.modules[r]) visiter(p.modules[r], valeursParRacine[r]?.valeurs || {}, '', null, 0)
  for (const [d, m] of Object.entries(p.modules).sort()) {
    if (visités.has(d)) continue
    const vals = Object.fromEntries(Object.entries(m.variables).map(([n, [b]]) => [n, b.attributes.default ? valeurDéfaut(b) : INCONNU]))
    out.push({ module: m, portée: new PortéeModule(m, vals, ''), préfixe: '', appelant: null })
  }
  return out
}

// ---------------------------------------------------------------- contrôles
export function constat(o) {
  return { engine: 'tfpv', tier: 'static', extra: {}, ...o }
}

function ligneRéf(hf, attr, aiguille) {
  const lignes = hf?.text.split('\n') || []
  for (let l = attr.line; l <= Math.min(attr.endLine, lignes.length); l++) if (lignes[l - 1].includes(aiguille)) return l
  return attr.line
}

function* attributs(b, itérateurs = new Set()) {
  for (const a of Object.values(b.attributes)) yield [a, itérateurs]
  for (const c of b.blocks) {
    const plus = new Set(itérateurs)
    if (c.type === 'dynamic' && c.labels[0]) {
      plus.add(c.labels[0])
      const it = c.attributes.iterator
      if (it) { const v = littéral(it.tokens); if (typeof v === 'string') plus.add(v); else if (it.tokens[0]?.kind === 'ident') plus.add(it.tokens[0].value) }
    }
    yield* attributs(c, plus)
  }
}

const estSensible = b => b.attributes.sensitive && littéral(b.attributes.sensitive.tokens) === true

function nonDéclaré(réf, m, provs, itérateurs) {
  const { root, path } = réf
  const premier = path[0]?.[0] === 'attr' ? path[0][1] : null
  if (itérateurs.has(root) || premier === null) return null
  if (root === 'var') return m.variables[premier] ? null : [`Reference to undeclared input variable "var.${premier}".`, `var.${premier}`]
  if (root === 'local') return m.locals[premier] ? null : [`Reference to undeclared local value "local.${premier}".`, `local.${premier}`]
  if (root === 'module') return m.moduleCalls[premier] ? null : [`Reference to undeclared module "module.${premier}".`, `module.${premier}`]
  if (root === 'data') {
    const second = path[1]?.[0] === 'attr' ? path[1][1] : null
    return second && !m.data[`${premier}.${second}`] ? [`Reference to undeclared data source "data.${premier}.${second}".`, `data.${premier}.${second}`] : null
  }
  if (root.includes('_') && provs.has(root.split('_')[0]) && !m.resources[`${root}.${premier}`]) return [`Reference to undeclared resource "${root}.${premier}".`, `${root}.${premier}`]
  return null
}

export function vérifierProjet(p, valeursParRacine, { externes = [] } = {}) {
  const f = []
  let réussis = 0
  // Syntaxe
  for (const [rel, hf] of Object.entries(p.analysés).sort()) {
    if (hf.error) f.push(constat({ engineRule: 'hcl_parse', ruleId: 'TF_SYNTAX_ERROR', message: hf.error.msg || String(hf.error.message), file: rel, line: hf.error.line, extra: { confidence: 'medium' } }))
    else réussis++
  }
  for (const [, m] of Object.entries(p.modules).sort()) {
    // Blocs de haut niveau inconnus, attributs et déclarations en double
    for (const hf of Object.values(m.files)) {
      for (const b of hf.blocks) {
        if (!TYPES_HAUT.has(b.type)) f.push(constat({ engineRule: 'top_level_block', ruleId: 'TF_UNSUPPORTED_BLOCK', message: `Blocks of type "${b.type}" are not expected here.`, file: hf.path, line: b.line, value: b.type }))
        const pile = [b]
        while (pile.length) {
          const x = pile.pop()
          for (const a of x.duplicates) f.push(constat({ engineRule: 'attribute_redefined', ruleId: 'TF_DUPLICATE_DECLARATION', message: `Attribute redefined: the argument "${a.name}" was already set in this block.`, file: hf.path, line: a.line, attribute: a.name }))
          pile.push(...x.blocks)
        }
        if (['resource', 'data', 'module'].includes(b.type) && b.attributes.count && b.attributes.for_each) {
          f.push(constat({ engineRule: 'count_for_each', ruleId: 'TF_COUNT_AND_FOR_EACH', message: 'The "count" and "for_each" meta-arguments are mutually exclusive, only one should be used.', file: hf.path, line: b.attributes.for_each.line, resource: adresse(b) }))
        }
      }
    }
    for (const [b, rel, autre] of m.doublons) {
      f.push(constat({ engineRule: 'duplicate', ruleId: 'TF_DUPLICATE_DECLARATION', message: `Duplicate ${b.type} "${b.labels.join('.')}" configuration (also declared in ${autre}).`, file: rel, line: b.line, resource: adresse(b) }))
    }
    // Valeur par défaut des variables vs type
    for (const [nom, [b, rel]] of Object.entries(m.variables)) {
      if (!b.attributes.type || !b.attributes.default) continue
      const t = typeDepuisAst(analyserJetons(b.attributes.type.tokens))
      const raison = vérifierValeur(littéral(b.attributes.default.tokens), t)
      if (raison) f.push(constat({ engineRule: 'variable_default', ruleId: 'TF_INVALID_DEFAULT', message: `Invalid default value for variable "${nom}": ${raison} (type: ${texteType(t)}).`, file: rel, line: b.attributes.default.line, resource: `var.${nom}`, attribute: 'default' }))
      else réussis++
    }
    // Sorties qui exposent une variable sensible
    for (const [nom, [b, rel]] of Object.entries(m.outputs)) {
      if (!b.attributes.value || (b.attributes.sensitive && littéral(b.attributes.sensitive.tokens) === true)) continue
      const sensibles = références(analyserJetons(b.attributes.value.tokens)).filter(r => r.root === 'var' && r.path[0]?.[0] === 'attr' && m.variables[r.path[0][1]] && estSensible(m.variables[r.path[0][1]][0]))
      if (sensibles.length) f.push(constat({ engineRule: 'sensitive_output', ruleId: 'TF_SENSITIVE_OUTPUT', message: `Output "${nom}" refers to sensitive values (var.${sensibles[0].path[0][1]}) but is not marked sensitive = true.`, file: rel, line: b.attributes.value.line, resource: `output.${nom}`, attribute: 'value' }))
    }
    // Alias de providers
    const alias = new Set()
    for (const [b] of m.providers) { const a = b.attributes.alias ? littéral(b.attributes.alias.tokens) : null; if (typeof a === 'string') alias.add(`${b.labels[0]}.${a}`) }
    for (const [b] of m.terraformBlocks) for (const rp of enfants(b, 'required_providers')) for (const [pn, a] of Object.entries(rp.attributes)) {
      const n = analyserJetons(a.tokens)
      const ca = n.k === 'obj' ? n.items.find(([k]) => k.k === 'ref' && k.root === 'configuration_aliases') : null
      if (ca?.[1]?.k === 'list') ca[1].items.forEach(it => it.k === 'ref' && it.path[0]?.[0] === 'attr' && alias.add(`${pn}.${it.path[0][1]}`))
    }
    for (const [, [b, rel]] of [...Object.entries(m.resources), ...Object.entries(m.data)]) {
      const pa = b.attributes.provider
      if (!pa) continue
      const toks = pa.tokens.map(t => t.value)
      if (toks.length === 3 && toks[1] === '.' && !alias.has(`${toks[0]}.${toks[2]}`)) {
        f.push(constat({ engineRule: 'provider_alias', ruleId: 'TF_UNDECLARED_PROVIDER', message: `There is no provider configuration "${toks[0]}.${toks[2]}" in this module.`, file: rel, line: pa.line, resource: adresse(b), attribute: 'provider', value: `${toks[0]}.${toks[2]}` }))
      }
    }
  }
  // Variables requises sans valeur et valeurs de tfvars
  for (const racine of p.racines) {
    const m = p.modules[racine]
    const { sources } = valeursRacine(p, racine, { externes })
    const ailleurs = {}
    const utilisés = new Set([...fichiersAuto(p, racine), ...fichiersChoisis(p, racine)])
    for (const [rel, vals] of Object.entries(p.tfvars)) if (!utilisés.has(rel)) for (const nom of Object.keys(vals)) (ailleurs[nom] ||= []).push(rel)
    for (const [nom, [b, rel]] of Object.entries(m.variables).sort()) {
      if (sources[nom]) { réussis++; continue }
      const indice = ailleurs[nom] ? ` A value exists in ${ailleurs[nom].join(', ')}, which Terraform does not load automatically: tick it in « Fichiers de variables » (= -var-file).` : ''
      f.push(constat({ engineRule: 'required_variable', ruleId: 'TF_MISSING_VARIABLE_VALUE', message: `Variable "${nom}" has no default and no value is provided (tfvars, -var-file, TF_VAR_${nom}).${indice}`, file: rel, line: b.line, resource: `var.${nom}`, attribute: nom }))
    }
    for (const [rel, vals] of Object.entries(p.tfvars).sort()) {
      if (racineDe(p, rel) !== racine) continue
      const actif = utilisés.has(rel)
      for (const [nom, [v, line]] of Object.entries(vals)) {
        if (!m.variables[nom]) {
          if (actif) f.push(constat({ engineRule: 'undeclared_variable_value', ruleId: 'TF_UNDECLARED_VARIABLE_VALUE', message: `"${rel}" sets "${nom}", which is not declared by the root module.`, file: rel, line, attribute: nom }))
          continue
        }
        const [vb, vrel] = m.variables[nom]
        const t = vb.attributes.type ? typeDepuisAst(analyserJetons(vb.attributes.type.tokens)) : INDÉTERMINÉ
        const raison = vérifierValeur(v, t)
        if (raison) f.push(constat({ engineRule: 'variable_type', ruleId: 'TF_VARIABLE_TYPE_MISMATCH', message: `Invalid value for variable "${nom}" in ${rel}: ${raison} (declared type: ${texteType(t)}, in ${vrel}:${vb.line}).`, file: rel, line, resource: `var.${nom}`, attribute: nom, value: v, extra: { sensitive: estSensible(vb) } }))
        else réussis++
      }
    }
  }
  // Modules : chemins locaux, entrées requises, sorties référencées
  for (const [d, m] of Object.entries(p.modules).sort()) {
    for (const [nom, [b, rel]] of Object.entries(m.moduleCalls).sort()) {
      const sa = b.attributes.source
      const src = sa ? littéral(sa.tokens) : null
      if (typeof src !== 'string') continue
      if (!/^\.\.?\//.test(src)) { p.trous.push(trou('module_distant', `module.${nom} (${src}) : module distant non téléchargé, son contenu n'est pas analysé`)); continue }
      const cible = normaliserChemin(d, src)
      if (cible.startsWith('..')) { p.trous.push(trou('module_hors_dossier', `module.${nom} (${src}) : hors du dossier analysé`)); continue }
      const enfant = p.modules[cible]
      if (!enfant || (!Object.keys(enfant.files).length && !enfant.jsonFiles.length)) {
        f.push(constat({ engineRule: 'local_module_path', ruleId: 'TF_LOCAL_MODULE_NOT_FOUND', message: `Module "${nom}": source "${src}" does not point to a directory containing .tf files.`, file: rel, line: sa.line, resource: `module.${nom}`, attribute: 'source', value: src }))
        continue
      }
      réussis++
      for (const [vn, [vb]] of Object.entries(enfant.variables).sort()) {
        if (vb.attributes.default || b.attributes[vn]) continue
        f.push(constat({ engineRule: 'module_input', ruleId: 'TF_MISSING_REQUIRED_ARGUMENT', message: `The argument "${vn}" is required by module "${nom}" (${src}), but no definition was found.`, file: rel, line: b.line, resource: `module.${nom}`, attribute: vn }))
      }
      for (const an of Object.keys(b.attributes)) {
        if (['source', 'version', 'count', 'for_each', 'providers', 'depends_on'].includes(an) || enfant.variables[an]) continue
        f.push(constat({ engineRule: 'module_argument', ruleId: 'TF_UNSUPPORTED_ARGUMENT', message: `An argument named "${an}" is not expected here: module "${nom}" (${src}) declares no variable "${an}".`, file: rel, line: b.attributes[an].line, resource: `module.${nom}`, attribute: an }))
      }
    }
  }
  // Références non déclarées (et sorties de modules locaux inexistantes)
  for (const [, m] of Object.entries(p.modules).sort()) {
    const provs = nomsProviders(m)
    const vus = new Set()
    const blocs = [...Object.values(m.resources), ...Object.values(m.data), ...Object.values(m.moduleCalls), ...Object.values(m.outputs), ...m.providers]
    const examiner = (attr, rel, its, ressource) => {
      if (attr.name === 'ignore_changes') return
      for (const réf of références(analyserJetons(attr.tokens))) {
        let pb = nonDéclaré(réf, m, provs, its)
        if (!pb && réf.root === 'module' && réf.path.length >= 2 && réf.path[1][0] === 'attr') {
          const [mb] = m.moduleCalls[réf.path[0][1]] || []
          const src = mb?.attributes.source ? littéral(mb.attributes.source.tokens) : null
          const enfant = typeof src === 'string' && /^\.\.?\//.test(src) ? p.modules[normaliserChemin(m.dir, src)] : null
          const sortie = réf.path[1][1]
          if (enfant && !enfant.outputs[sortie] && !mb.attributes.count && !mb.attributes.for_each) pb = [`Unsupported attribute: module "${réf.path[0][1]}" has no output named "${sortie}".`, `module.${réf.path[0][1]}.${sortie}`, 'TF_UNSUPPORTED_ATTRIBUTE']
        }
        if (!pb) continue
        const hf = m.files[rel]
        const line = ligneRéf(hf, attr, pb[1].split('.').slice(0, 2).join('.'))
        const clé = `${rel}|${line}|${pb[1]}`
        if (vus.has(clé)) continue
        vus.add(clé)
        f.push(constat({ engineRule: 'undeclared_reference', ruleId: pb[2] || 'TF_UNDECLARED_REFERENCE', message: pb[0], file: rel, line, resource: ressource, attribute: attr.name, value: pb[1] }))
      }
    }
    for (const [b, rel] of blocs) for (const [a, its] of attributs(b)) examiner(a, rel, its, adresse(b))
    for (const [a, rel] of Object.values(m.locals)) examiner(a, rel, new Set(), 'locals')
  }
  return { constats: f, réussis }
}

// ---------------------------------------------------------------- inventaire
export function inventaire(p, valeursParRacine) {
  const parType = {}
  const providers = {}
  const modules = []
  let requiredVersion = null
  let backend = null
  for (const [d, m] of Object.entries(p.modules).sort()) {
    for (const k of Object.keys(m.resources)) { const t = k.split('.')[0]; parType[t] = (parType[t] || 0) + 1 }
    const appels = Object.entries(m.moduleCalls).sort().map(([nom, [b]]) => {
      const src = b.attributes.source ? littéral(b.attributes.source.tokens) : null
      const ver = b.attributes.version ? littéral(b.attributes.version.tokens) : null
      return { name: nom, source: typeof src === 'string' ? src : null, version: typeof ver === 'string' ? ver : null }
    })
    for (const [b] of m.terraformBlocks) {
      if (p.racines.includes(d)) {
        const rv = b.attributes.required_version ? littéral(b.attributes.required_version.tokens) : null
        if (typeof rv === 'string') requiredVersion = rv
        for (const be of enfants(b, 'backend')) backend = be.labels[0] || backend
        if (enfants(b, 'cloud').length) backend = 'cloud'
      }
      for (const rp of enfants(b, 'required_providers')) for (const [pn, a] of Object.entries(rp.attributes)) {
        const v = littéral(a.tokens)
        const e = (providers[pn] ||= { name: pn, source: null, versions: [] })
        if (v && typeof v === 'object' && !Array.isArray(v)) { e.source ||= typeof v.source === 'string' ? v.source : null; if (typeof v.version === 'string' && !e.versions.includes(v.version)) e.versions.push(v.version) } else if (typeof v === 'string' && !e.versions.includes(v)) e.versions.push(v)
      }
    }
    modules.push({ dir: d, root: p.racines.includes(d), files: Object.keys(m.files).length + m.jsonFiles.length, resources: Object.keys(m.resources).length, data_sources: Object.keys(m.data).length, variables: Object.keys(m.variables).length, outputs: Object.keys(m.outputs).length, module_calls: appels })
  }
  const variables = []
  for (const racine of p.racines) {
    const m = p.modules[racine]
    const src = valeursParRacine[racine]?.sources || {}
    for (const [nom, [b, rel]] of Object.entries(m.variables).sort()) {
      const t = b.attributes.type ? texteType(typeDepuisAst(analyserJetons(b.attributes.type.tokens))) : null
      variables.push({ name: nom, root: racine, type: t, required: !b.attributes.default, sensitive: estSensible(b), value_source: src[nom] || null, file: rel, line: b.line })
    }
  }
  const nb = ext => Object.keys(p.fichiers).filter(r => r.endsWith(ext)).length
  return {
    files: { tf: nb('.tf'), tf_json: p.json.length, tfvars: Object.keys(p.tfvars).length, ignored: p.ignorés.length, too_large: p.tropGros },
    roots: p.racines, auto_loaded_var_files: p.racines.flatMap(r => fichiersAuto(p, r)), extra_var_files: p.fichiersVariables || [],
    required_version: requiredVersion, backend, providers: Object.values(providers).sort((a, b) => a.name.localeCompare(b.name)),
    modules, resources_by_type: Object.fromEntries(Object.entries(parType).sort()), variables,
  }
}

export function valeursSecrètes(p, valeursParRacine) {
  const out = []
  const nomSecret = n => /(pass(word|wd|phrase)?|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|credential)/i.test(n || '')
  for (const racine of p.racines) {
    const m = p.modules[racine]
    for (const [nom, [b]] of Object.entries(m.variables)) {
      if (!(estSensible(b) || nomSecret(nom))) continue
      const v = valeursParRacine[racine]?.valeurs?.[nom]
      if (typeof v === 'string') out.push(v)
      for (const vals of Object.values(p.tfvars)) if (vals[nom] && typeof vals[nom][0] === 'string') out.push(vals[nom][0])
    }
  }
  for (const m of Object.values(p.modules)) {
    for (const [b] of [...Object.values(m.resources), ...Object.values(m.data), ...m.providers]) {
      for (const [a] of attributs(b)) if (nomSecret(a.name)) { const v = littéral(a.tokens); if (typeof v === 'string') out.push(v) }
    }
  }
  return out
}

export { attributs, estSensible }
