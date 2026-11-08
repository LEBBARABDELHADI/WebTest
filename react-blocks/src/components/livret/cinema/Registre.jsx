// Aiguillage des décors et visuels : chaque page pilote apporte les siens,
// le moteur du court-métrage reste commun.
import DecorCinema from './Decors10'
import Visuel from './Visuels10'
import Decors6 from './Decors6'
import Visuels6 from './Visuels6'
import Decors7 from './Decors7'
import Visuels7 from './Visuels7'

const DÉCORS_6 = new Set(['place-mairie', 'place-mairie-soir', 'parc', 'agence', 'immeubles-nuit'])
const DÉCORS_7 = new Set(['mur-quartier', 'bureau', 'place-collecte'])
const VISUELS_6 = new Set(['devise', 'libres', 'nuisance', 'tableau', 'memes', 'balance', 'femmes-hommes', 'definition', 'loi'])
const VISUELS_7 = new Set(['haines', 'pro-perso', 'mains', 'formes', 'collective', 'generations', 'inegalites', 'collecte', 'trois-mots'])

export function Décor(props) {
  if (DÉCORS_7.has(props.nom)) return <Decors7 {...props} />
  if (DÉCORS_6.has(props.nom)) return <Decors6 {...props} />
  return <DecorCinema {...props} />
}

export function VisuelScène(props) {
  if (VISUELS_7.has(props.nom)) return <Visuels7 {...props} />
  if (VISUELS_6.has(props.nom)) return <Visuels6 {...props} />
  return <Visuel {...props} />
}
