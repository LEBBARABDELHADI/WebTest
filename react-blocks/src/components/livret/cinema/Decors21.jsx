// Décor du court-métrage de la page 21 : la carte administrative, accrochée
// comme une grande feuille ; « admin-france » ou « admin-<code de région> ».
// La carte (contours et préfectures) n'est chargée qu'à l'ouverture.
import { lazy, Suspense } from 'react'

const CarteAdmin = lazy(() => import('./CarteAdmin'))

// La couche de décor déborde de 5 % de chaque côté (mouvements de caméra) :
// 5 / 110 = 4,545 % ramène la carte exactement aux bords de la scène.
export default function Decors21({ nom, couche, étape }) {
  if (couche !== 'fond' || !nom?.startsWith('admin-')) return null
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f8f5ec' }}>
      <div style={{ position: 'absolute', inset: '4.545%' }}>
        <Suspense fallback={null}><CarteAdmin focus={nom.slice(6)} étape={étape} /></Suspense>
      </div>
    </div>
  )
}
