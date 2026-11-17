// Chargeur des données IAM sous Node (tests) : lit public/iam sur le disque.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { créerCatalogue } from '../../src/lib/iam/donnees.js'

export const DOSSIER_DONNEES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'iam')

export const chargerFichier = chemin => Promise.resolve(JSON.parse(readFileSync(join(DOSSIER_DONNEES, chemin), 'utf8')))

export async function catalogueTest() {
  const cat = créerCatalogue(chargerFichier)
  await cat.prêt()
  return cat
}
