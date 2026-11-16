// Apparence partagée des éditeurs du Query Generator.
import { PALETTES } from './coloration.js'

export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

// Police identique pour les deux couches de l'éditeur ; 16 px sur téléphone (pas de zoom iOS).
export const STYLE_CODE = `.qg-code{font-family:${MONO};font-size:13.5px;line-height:21px;tab-size:2;letter-spacing:0;word-spacing:0;font-variant-ligatures:none}
@media (max-width:640px){.qg-code{font-size:16px;line-height:24px}}
.qg-code::placeholder{opacity:.55}`

export const paletteDe = T => (/^#[0-3]/.test(T.bg) ? PALETTES.sombre : PALETTES.clair)

export const STATUTS = {
  vérifiée: { icône: '✅', nom: 'Vérifiée', couleur: '#2e9e6b', texte: 'Exécutée : résultat identique au résultat attendu.' },
  conforme: { icône: '✅', nom: 'Exécutée', couleur: '#2e9e6b', texte: 'Exécutée : résultat conforme à l\'interprétation (aucun résultat attendu fourni).' },
  exécutée: { icône: '✅', nom: 'Exécutée', couleur: '#2e9e6b', texte: 'Exécutée sans erreur.' },
  différente: { icône: '⚠️', nom: 'Résultat différent', couleur: '#d97706', texte: 'Exécutée, mais le résultat diffère.' },
  erreur: { icône: '❌', nom: 'Erreur', couleur: '#dc2626', texte: 'L\'exécution a échoué.' },
  impossible: { icône: '🚫', nom: 'Non exprimable', couleur: '#8b8b8b', texte: '' },
  modifiée: { icône: '⏳', nom: 'Modifiée · non exécutée', couleur: '#8b8b8b', texte: 'Requête modifiée : cliquez sur ▶ Exécuter pour la vérifier.' },
  enCours: { icône: '⏳', nom: 'Exécution…', couleur: '#8b8b8b', texte: '' },
}
