// Validation du schéma des providers : ce que fait `terraform validate` pour
// les ressources, à partir du schéma officiel du provider
// (`terraform providers schema -json`, embarqué) : type de ressource inconnu,
// argument inattendu, argument requis absent, attribut calculé renseigné,
// bloc inattendu ou trop nombreux, type de valeur, attribut référencé inexistant.
import { adresse } from './hcl.js'
import { DocJson, analyserJetons, connu, littéral, références } from './expr.js'
import { typeDepuisSchéma, vérifierValeur } from './types.js'
import { attributs, constat } from './projet.js'

const MÉTA = new Set(['count', 'for_each', 'provider', 'depends_on'])
const BLOCS_MÉTA = new Set(['lifecycle', 'provisioner', 'connection'])
const INTÉGRÉS = new Set(['terraform_data', 'terraform_remote_state'])

export function distance(a, b) {
  const m = a.length
  const n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 1; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[m][n]
}
export function suggestion(nom, candidats) {
  let meilleur = null
  let dist = Math.max(2, Math.floor(nom.length / 4))
  for (const c of candidats) {
    if (Math.abs(c.length - nom.length) > dist) continue
    const x = distance(nom, c)
    if (x <= dist && (!meilleur || x < dist)) { meilleur = c; dist = x }
  }
  return meilleur
}
const proposer = (nom, cands) => { const s = suggestion(nom, cands); return s ? ` Did you mean "${s}"?` : '' }

export function validerSchémas(p, schémas) {
  const constats = []
  let réussis = 0
  const sansSchéma = {}
  const ajouter = c => constats.push(constat({ engine: 'schema', tier: 'static', ...c }))

  const valider = (b, s, ctx, niveauRessource) => {
    let ok = true
    const attrs = s.a || {}
    const blocs = s.b || {}
    for (const [n, a] of Object.entries(b.attributes)) {
      if (niveauRessource && MÉTA.has(n)) continue
      const déf = attrs[n]
      if (déf) {
        const [drapeau, type, plus] = déf
        if (drapeau === 'c') { ok = false; ajouter({ engineRule: 'unconfigurable_attribute', ruleId: 'TF_UNCONFIGURABLE_ATTRIBUTE', message: `Can't configure a value for "${n}": its value will be decided automatically based on the result of applying this configuration.`, file: ctx.rel, line: a.line, resource: ctx.adr, attribute: n }); continue }
        if (plus & 1) ajouter({ engineRule: 'deprecated_attribute', ruleId: 'TF_DEPRECATED', message: `The attribute "${n}" is deprecated in ${ctx.source}.`, file: ctx.rel, line: a.line, resource: ctx.adr, attribute: n, engineSeverity: 'warning' })
        const v = littéral(a.tokens)
        if (connu(v) && v !== null && !(v instanceof DocJson)) { // jsonencode() produit une chaîne
          const raison = vérifierValeur(v, typeDepuisSchéma(type))
          if (raison) { ok = false; ajouter({ engineRule: 'attribute_type', ruleId: 'TF_INVALID_ARGUMENT_VALUE', message: `Inappropriate value for attribute "${n}": ${raison}.`, file: ctx.rel, line: a.line, resource: ctx.adr, attribute: n, value: v }) }
        }
      } else if (!blocs[n]) {
        ok = false
        const cands = [...Object.entries(attrs).filter(([, d]) => d[0] !== 'c').map(([k]) => k), ...Object.keys(blocs)]
        ajouter({ engineRule: 'unsupported_argument', ruleId: 'TF_UNSUPPORTED_ARGUMENT', message: `An argument named "${n}" is not expected here.${proposer(n, cands)}`, file: ctx.rel, line: a.line, resource: ctx.adr, attribute: n })
      }
    }
    for (const [n, [drapeau]] of Object.entries(attrs)) {
      if (drapeau === 'r' && !b.attributes[n]) { ok = false; ajouter({ engineRule: 'missing_argument', ruleId: 'TF_MISSING_REQUIRED_ARGUMENT', message: `The argument "${n}" is required, but no definition was found.`, file: ctx.rel, line: b.line, resource: ctx.adr, attribute: n }) }
    }
    const statiques = {}
    const dynamiques = {}
    for (const c of b.blocks) {
      if (c.type === 'dynamic' && c.labels[0]) (dynamiques[c.labels[0]] ||= []).push(c)
      else (statiques[c.type] ||= []).push(c)
    }
    for (const [t, liste] of Object.entries(statiques)) {
      if (niveauRessource && BLOCS_MÉTA.has(t)) continue
      let bs = blocs[t]
      // « Attributs en tant que blocs » : un attribut liste/ensemble d'objets
      // (ex. ingress/egress de aws_security_group) accepte la syntaxe de bloc.
      const tAttr = attrs[t]?.[1]
      if (!bs && Array.isArray(tAttr) && (tAttr[0] === 'l' || tAttr[0] === 's') && Array.isArray(tAttr[1]) && tAttr[1][0] === 'o') {
        bs = { m: tAttr[0], a: Object.fromEntries(Object.entries(tAttr[1][1]).map(([k, x]) => [k, ['o', x]])) }
      }
      if (!bs) {
        ok = false
        const indice = attrs[t] ? ` Did you mean to define argument "${t}"? If so, use the equals sign to assign it a value.` : proposer(t, Object.keys(blocs))
        ajouter({ engineRule: 'unsupported_block', ruleId: 'TF_UNSUPPORTED_BLOCK', message: `Blocks of type "${t}" are not expected here.${indice}`, file: ctx.rel, line: liste[0].line, resource: ctx.adr, attribute: t })
        continue
      }
      if (bs.x && liste.length > bs.x && !dynamiques[t]) {
        ok = false
        ajouter({ engineRule: 'too_many_blocks', ruleId: 'TF_BLOCK_COUNT', message: `Too many "${t}" blocks: no more than ${bs.x} "${t}" block(s) allowed.`, file: ctx.rel, line: liste[bs.x].line, resource: ctx.adr, attribute: t })
      }
      for (const c of liste) if (!valider(c, bs, ctx, false)) ok = false
    }
    for (const [t, liste] of Object.entries(dynamiques)) {
      const bs = blocs[t]
      if (!bs) { ok = false; ajouter({ engineRule: 'unsupported_block', ruleId: 'TF_UNSUPPORTED_BLOCK', message: `Blocks of type "${t}" are not expected here (dynamic "${t}").${proposer(t, Object.keys(blocs))}`, file: ctx.rel, line: liste[0].line, resource: ctx.adr, attribute: t }); continue }
      for (const d of liste) for (const c of d.blocks.filter(x => x.type === 'content')) if (!valider(c, bs, ctx, false)) ok = false
    }
    for (const [t, bs] of Object.entries(blocs)) {
      if (bs.n >= 1 && !statiques[t] && !dynamiques[t] && !b.attributes[t]) {
        ok = false
        ajouter({ engineRule: 'insufficient_blocks', ruleId: 'TF_BLOCK_COUNT', message: `Insufficient "${t}" blocks: at least ${bs.n} "${t}" block(s) required.`, file: ctx.rel, line: b.line, resource: ctx.adr, attribute: t })
      }
    }
    return ok
  }

  for (const m of Object.values(p.modules)) {
    const tables = [['resource', m.resources], ['data', m.data]]
    for (const [genre, table] of tables) {
      for (const [, [b, rel]] of Object.entries(table).sort()) {
        const type = b.labels[0]
        if (INTÉGRÉS.has(type)) continue
        const préfixe = type.split('_')[0]
        const sp = schémas[préfixe]
        if (!sp) { (sansSchéma[préfixe] ||= new Set()).add(type); continue }
        const s = (genre === 'data' ? sp.d : sp.r)[type]
        if (!s) {
          ajouter({ engineRule: 'invalid_resource_type', ruleId: 'TF_INVALID_RESOURCE_TYPE', message: `The provider ${sp.source} does not support ${genre === 'data' ? 'data source' : 'resource type'} "${type}".${proposer(type, Object.keys(genre === 'data' ? sp.d : sp.r))}`, file: rel, line: b.line, resource: adresse(b), value: type })
          continue
        }
        if (valider(b, s, { rel, adr: adresse(b), source: `${sp.source} ${sp.version || ''}`.trim() }, true)) réussis++
      }
    }
    // Attributs référencés : aws_vpc.main.cidr_bloc → n'existe pas
    const vus = new Set()
    const blocs = [...Object.values(m.resources), ...Object.values(m.data), ...Object.values(m.moduleCalls), ...Object.values(m.outputs), ...m.providers]
    const examiner = (attr, rel) => {
      for (const r of références(analyserJetons(attr.tokens))) {
        let type, nom, reste, genre
        if (r.root === 'data') {
          if (r.path.length < 3 || r.path[0][0] !== 'attr' || r.path[1][0] !== 'attr') continue
          ;[type, nom, reste, genre] = [r.path[0][1], r.path[1][1], r.path.slice(2), 'data']
        } else if (r.root.includes('_') && r.path[0]?.[0] === 'attr') {
          ;[type, nom, reste, genre] = [r.root, r.path[0][1], r.path.slice(1), 'resource']
        } else continue
        const décl = (genre === 'data' ? m.data : m.resources)[`${type}.${nom}`]
        if (!décl || INTÉGRÉS.has(type)) continue
        const sp = schémas[type.split('_')[0]]
        const s = sp && (genre === 'data' ? sp.d : sp.r)[type]
        if (!s) continue
        const multi = décl[0].attributes.count || décl[0].attributes.for_each
        let i = 0
        if (multi) { if (!reste[0] || reste[0][0] === 'attr') continue; i = 1 }
        const pas = reste[i]
        if (!pas || pas[0] !== 'attr') continue
        const a = pas[1]
        if ((s.a && s.a[a]) || (s.b && s.b[a])) { réussis++; continue }
        const clé = `${rel}|${attr.line}|${type}.${nom}.${a}`
        if (vus.has(clé)) continue
        vus.add(clé)
        ajouter({ engineRule: 'unsupported_attribute', ruleId: 'TF_UNSUPPORTED_ATTRIBUTE', message: `Unsupported attribute: ${genre === 'data' ? 'data.' : ''}${type}.${nom} has no argument, nested block, or exported attribute named "${a}".${proposer(a, [...Object.keys(s.a || {}), ...Object.keys(s.b || {})])}`, file: rel, line: attr.line, attribute: attr.name, value: `${type}.${nom}.${a}` })
      }
    }
    for (const [b, rel] of blocs) for (const [a] of attributs(b)) examiner(a, rel)
    for (const [a, rel] of Object.values(m.locals)) examiner(a, rel)
  }
  return { constats, réussis, sansSchéma }
}
