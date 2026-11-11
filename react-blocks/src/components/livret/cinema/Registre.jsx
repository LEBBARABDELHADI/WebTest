// Aiguillage des décors et visuels : chaque page pilote apporte les siens,
// le moteur du court-métrage reste commun.
import DecorCinema from './Decors10'
import Visuel from './Visuels10'
import Decors6 from './Decors6'
import Visuels6 from './Visuels6'
import Decors7 from './Decors7'
import Visuels7 from './Visuels7'
import Decors8 from './Decors8'
import Visuels8 from './Visuels8'
import Decors11 from './Decors11'
import Visuels11 from './Visuels11'
import Decors12 from './Decors12'
import Visuels12 from './Visuels12'
import Decors13 from './Decors13'
import Visuels13 from './Visuels13'
import Decors14 from './Decors14'
import Visuels14 from './Visuels14'
import Visuels15 from './Visuels15'
import Decors16 from './Decors16'
import Visuels16 from './Visuels16'

const DÉCORS_6 = new Set(['place-mairie', 'place-mairie-soir', 'parc', 'agence', 'immeubles-nuit'])
const DÉCORS_7 = new Set(['mur-quartier', 'bureau', 'place-collecte'])
const DÉCORS_8 = new Set(['place-14-juillet', 'place-14-juillet-soir', 'bastille', 'salle-mairie'])
const VISUELS_8 = new Set(['frise-14', 'marseillaise', 'langue', 'marianne', 'drapeau', 'coq', 'partout', 'six-symboles'])
const DÉCORS_11 = new Set(['guichet-mairie', 'monument'])
const VISUELS_11 = new Set(['separation', 'regles-etat', 'carte-alsace', 'patrimoine', 'neutres', 'proselytisme', 'sans-pression', 'interdit-sp', 'blaspheme', 'expression', 'trois-points'])
const DÉCORS_12 = new Set(['marche'])
const VISUELS_12 = new Set(['limites', 'espace-public', 'ordre-public', 'loi-2010', 'agents-neutres', 'murs-neutres', 'usagers', 'adaptation', 'lieux-recap'])
const DÉCORS_13 = new Set(['atelier', 'salle-classe'])
const VISUELS_13 = new Set(['public-prive', 'agent-public', 'salaries', 'reglement', 'absence', 'ecole-neutre', 'charte', 'loi-2004', 'programme', 'travail-ecole'])
const DÉCORS_14 = new Set(['ecole-vote', 'bureau-vote', 'residence', 'emploi', 'sante'])
const VISUELS_14 = new Set(['souverainete', 'article-3', 'elus', 'direct-indirect', 'majorite', 'ddhc-1', 'egalite-reelle', 'domaine-education', 'domaine-logement', 'domaine-emploi', 'domaine-sante', 'recap-14'])
const VISUELS_15 = new Set(['partie-2', 'chapitre-1', 'chapitre-2', 'chapitre-3', 'carte-partie-2'])
const DÉCORS_16 = new Set(['palais', 'hemicycle'])
const VISUELS_16 = new Set(['etat-droit', 'article-2', 'constitution', 'modifier', 'preambule', 'principes', 'trois-pouvoirs', 'partis', 'administration', 'president', 'parrainages', 'gouvernement', 'parlement', 'deputes-senateurs', 'recap-16'])
const VISUELS_6 = new Set(['devise', 'libres', 'nuisance', 'tableau', 'memes', 'balance', 'femmes-hommes', 'definition', 'loi'])
const VISUELS_7 = new Set(['haines', 'pro-perso', 'mains', 'formes', 'collective', 'generations', 'inegalites', 'collecte', 'trois-mots'])

export function Décor(props) {
  if (DÉCORS_16.has(props.nom)) return <Decors16 {...props} />
  if (DÉCORS_14.has(props.nom)) return <Decors14 {...props} />
  if (DÉCORS_13.has(props.nom)) return <Decors13 {...props} />
  if (DÉCORS_12.has(props.nom)) return <Decors12 {...props} />
  if (DÉCORS_11.has(props.nom)) return <Decors11 {...props} />
  if (DÉCORS_8.has(props.nom)) return <Decors8 {...props} />
  if (DÉCORS_7.has(props.nom)) return <Decors7 {...props} />
  if (DÉCORS_6.has(props.nom)) return <Decors6 {...props} />
  return <DecorCinema {...props} />
}

export function VisuelScène(props) {
  if (VISUELS_16.has(props.nom)) return <Visuels16 {...props} />
  if (VISUELS_15.has(props.nom)) return <Visuels15 {...props} />
  if (VISUELS_14.has(props.nom)) return <Visuels14 {...props} />
  if (VISUELS_13.has(props.nom)) return <Visuels13 {...props} />
  if (VISUELS_12.has(props.nom)) return <Visuels12 {...props} />
  if (VISUELS_11.has(props.nom)) return <Visuels11 {...props} />
  if (VISUELS_8.has(props.nom)) return <Visuels8 {...props} />
  if (VISUELS_7.has(props.nom)) return <Visuels7 {...props} />
  if (VISUELS_6.has(props.nom)) return <Visuels6 {...props} />
  return <Visuel {...props} />
}
