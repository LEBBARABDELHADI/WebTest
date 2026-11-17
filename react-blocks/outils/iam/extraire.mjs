// Extraction des données IAM : convertit le paquet @cloud-copilot/iam-data (licence MIT, installé
// HORS du dépôt) en JSON compacts par service, servis tels quels par l'application (public/iam).
//
//   node outils/iam/extraire.mjs <dossier du paquet @cloud-copilot/iam-data>
//
// Rien n'est importé depuis ce paquet à l'exécution : l'application ne contient que les JSON
// produits ici (données de référence, publiées sous licence MIT ; voir public/iam/LICENCE-iam-data.txt).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ici = dirname(fileURLToPath(import.meta.url))
const sortie = join(ici, '..', '..', 'public', 'iam')
const paquet = process.argv[2]
if (!paquet || !existsSync(join(paquet, 'package.json'))) {
  console.error('Usage : node outils/iam/extraire.mjs <dossier du paquet @cloud-copilot/iam-data>')
  process.exit(2)
}
const lire = f => JSON.parse(readFileSync(join(paquet, f), 'utf8'))
const pkg = lire('package.json')
const NIVEAUX = ['List', 'Read', 'Write', 'Permissions management', 'Tagging']
// Dans la source, « Tagging, Write » et « Permissions management, Write » désignent respectivement
// les niveaux Tagging et Permissions management d'AWS (un seul niveau par action).
const niveau = s => {
  if (s.startsWith('Permissions management')) return 3
  if (s.startsWith('Tagging')) return 4
  const i = NIVEAUX.indexOf(s)
  if (i < 0) throw new Error(`Niveau d'accès inconnu : ${s}`)
  return i
}

const noms = lire('data/serviceNames.json')
const catégorieDe = lire('data/serviceCategories.json')
const nomsCatégories = lire('data/categoryNames.json')
const services = lire('data/services.json')

// Clés de condition globales (aws:…) : la liste est dans le code du paquet, pas dans data/.
const globales = await (async () => {
  const mod = await import(new URL(`file://${join(paquet, 'dist/esm/globalConditionKeys.js')}`))
  return mod.globalConditionKeys.map(k => ({ k: k.key, t: k.type, c: k.category }))
})()
const typeGlobal = new Map(globales.map(g => [g.k.toLowerCase(), g.t]))

rmSync(join(sortie, 'services'), { recursive: true, force: true })
mkdirSync(join(sortie, 'services'), { recursive: true })

const index = []
let nbActions = 0
let octets = 0
for (const p of services) {
  const actions = lire(`data/actions/${p}.json`)
  const typesRes = existsSync(join(paquet, `data/resourceTypes/${p}.json`)) ? lire(`data/resourceTypes/${p}.json`) : {}
  const clésSvc = existsSync(join(paquet, `data/conditionKeys/${p}.json`)) ? lire(`data/conditionKeys/${p}.json`) : {}

  const tableClés = [] // [clé, type, description]
  const posClé = new Map()
  const clé = nom => {
    const k = nom.toLowerCase()
    if (!posClé.has(k)) {
      const d = clésSvc[k]
      posClé.set(k, tableClés.length)
      tableClés.push([d?.key ?? nom, d?.type ?? typeGlobal.get(k) ?? 'String', d?.description ?? ''])
    }
    return posClé.get(k)
  }
  const res = {}
  for (const [k, r] of Object.entries(typesRes)) res[r.key ?? k] = r.arn
  const liste = Object.values(actions).map(a => {
    const rts = a.resourceTypes.map(r => (r.required ? `${r.name}*` : r.name))
    const clés = new Set(a.conditionKeys)
    for (const r of a.resourceTypes) for (const c of r.conditionKeys) clés.add(c)
    return [a.name, niveau(a.accessLevel), a.description, rts, [...clés].map(clé)]
  })
  liste.sort((x, y) => x[0].localeCompare(y[0], 'en'))
  const doc = { p, nom: noms[p] ?? p, cat: catégorieDe[p] ?? '', cles: tableClés, res, act: liste }
  const texte = JSON.stringify(doc)
  writeFileSync(join(sortie, 'services', `${p}.json`), texte)
  octets += texte.length
  nbActions += liste.length
  index.push({ p, n: noms[p] ?? p, c: catégorieDe[p] ?? '', a: liste.length })
}

writeFileSync(join(sortie, 'index.json'), JSON.stringify({
  source: { nom: pkg.name, licence: pkg.license, version: pkg.version, miseÀJour: pkg.updatedAt, dépôt: 'https://github.com/cloud-copilot/iam-data' },
  niveaux: NIVEAUX,
  catégories: nomsCatégories,
  services: index,
}))
writeFileSync(join(sortie, 'globales.json'), JSON.stringify(globales))
writeFileSync(join(sortie, 'LICENCE-iam-data.txt'), `Données IAM d'AWS (actions, types de ressources, clés de condition) extraites du paquet
${pkg.name} ${pkg.version} (${pkg.updatedAt}), licence MIT :

${readFileSync(join(paquet, 'LICENSE.txt'), 'utf8')}
`)
const taille = readdirSync(join(sortie, 'services')).reduce((s, f) => s + statSync(join(sortie, 'services', f)).size, 0)
console.log(`${index.length} services, ${nbActions} actions, ${globales.length} clés globales ; services/ = ${(taille / 1e6).toFixed(2)} Mo (${(octets / 1e6).toFixed(2)} Mo de JSON)`)
