// Décors du court-métrage de la page 20 : la carte du monde de l'Immersion
// (frontières actuelles), cadrée sur les territoires d'outre-mer de la scène.
// La carte est chargée à la demande. Le bas de l'écran reste libre pour les
// visuels de la page 20.
import { lazy, Suspense } from 'react'
import { CSS_IMMERSION } from '../../../lib/livret2026/immersion/immersionCss'

const Carte = lazy(() => import('../immersion/Carte'))

const DROM = ['guadeloupe', 'martinique', 'mayotte', 'guyane', 'reunion']
const COM = ['nouvelle-caledonie', 'polynesie', 'saint-martin', 'saint-barthelemy', 'saint-pierre-et-miquelon', 'taaf', 'wallis-et-futuna']
const ANTILLES = ['martinique', 'guadeloupe', 'saint-martin', 'saint-barthelemy']
const numéroter = ids => Object.fromEntries(ids.map((id, k) => [id, k + 1]))
const VUES = {
  'outremer-monde': { lieux: [...DROM, ...COM], focus: [...DROM, ...COM], numéros: numéroter([...DROM, ...COM]) },
  'outremer-drom': { lieux: DROM, focus: DROM, actifs: DROM },
  'outremer-com': { lieux: COM, focus: COM, actifs: COM, numéros: numéroter(COM) },
  antilles: { lieux: ANTILLES, focus: ANTILLES, actifs: ANTILLES, zoomMax: 40 },
  // Page 21 : les numéros de la carte administrative.
  'outremer-codes-drom': { lieux: DROM, focus: DROM, numéros: { guadeloupe: 971, martinique: 972, guyane: 973, reunion: 974, mayotte: 976 } },
  'outremer-codes-com': { lieux: COM, focus: COM, numéros: { 'saint-pierre-et-miquelon': 975, 'saint-barthelemy': 977, 'saint-martin': 978, taaf: 984, 'wallis-et-futuna': 986, polynesie: 987, 'nouvelle-caledonie': 988 } },
}

export default function Decors20({ nom, couche }) {
  const v = VUES[nom]
  if (!v || couche !== 'fond') return null
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#05070d' }}>
      <style>{CSS_IMMERSION}</style>
      <Suspense fallback={null}>
        <Carte vue="monde" pays={['France']} lieux={v.lieux} actifs={v.actifs || []} focus={v.focus} zoomMax={v.zoomMax || null} numéros={v.numéros || null}
          couleur="#ffd166" marges={{ bas: 0.36 }} légende={false} étiquette="territoires d'outre-mer" />
      </Suspense>
      <div style={{ position: 'absolute', left: 'calc(4.545% + 10px)', bottom: 'calc(36% + 4px)', fontSize: 10.5, color: 'rgba(226,232,240,.62)', textShadow: '0 1px 2px #000', pointerEvents: 'none' }}>Frontières actuelles, pour se repérer</div>
    </div>
  )
}
