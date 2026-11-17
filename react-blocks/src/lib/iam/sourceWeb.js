// Catalogue IAM du navigateur : les JSON de public/iam sont servis par le site lui-même (même origine,
// aucune requête externe) et chargés service par service, à la demande.
import { créerCatalogue } from './donnees.js'

const base = () => `${import.meta.env.BASE_URL}iam/`

const charger = async chemin => {
  const réponse = await fetch(`${base()}${chemin}`)
  if (!réponse.ok) throw new Error(`Données IAM introuvables (${chemin} : ${réponse.status})`)
  return réponse.json()
}

export const catalogueWeb = créerCatalogue(charger)
