// Aiguillage des décors et visuels : chaque page pilote apporte les siens,
// le moteur du court-métrage reste commun.
import DecorCinema from './Decors10'
import Visuel from './Visuels10'
import Decors6 from './Decors6'
import Visuels6 from './Visuels6'

const DÉCORS_6 = new Set(['place-mairie', 'place-mairie-soir', 'parc', 'agence', 'immeubles-nuit'])
const VISUELS_6 = new Set(['devise', 'libres', 'nuisance', 'tableau', 'memes', 'balance', 'femmes-hommes', 'definition', 'loi'])

export function Décor(props) {
  return DÉCORS_6.has(props.nom) ? <Decors6 {...props} /> : <DecorCinema {...props} />
}

export function VisuelScène(props) {
  return VISUELS_6.has(props.nom) ? <Visuels6 {...props} /> : <Visuel {...props} />
}
