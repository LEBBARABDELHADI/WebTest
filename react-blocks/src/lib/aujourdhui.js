// Ce qui est « pour aujourd'hui » dans un Programme — une seule définition,
// utilisée par le bloc « Aujourd'hui » du Programme ET par l'accueil :
//   - en retard : échéance passée,
//   - échéance aujourd'hui,
//   - cartes de la colonne « Aujourd'hui »,
//   - planifiées aujourd'hui dans la timeline.
// Chaque tâche n'est comptée qu'une fois ; les cartes archivées ou dans la
// colonne « Terminé » sont ignorées, comme celles cochées (barrées) et les
// tâches récurrentes déjà validées aujourd'hui. `sansRécurrentes` : le
// Programme les montre à part (« Tâches quotidiennes »).
import { normaliser } from './motsCles'

export const dateDuJour = () => new Date().toISOString().slice(0, 10)

const jourLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function analyserAujourdhui(data, auj = dateDuJour(), { sansRécurrentes = false } = {}) {
  const jour = jourLocal()
  const colonnes = data.colonnes || []
  const colonneAujourdhui = colonnes.find(c => normaliser(c.titre).includes('aujourd'))
  const colonneTerminée = colonnes.find(c => /termin|fini|fait$/.test(normaliser(c.titre)))
  const actives = (data.cartes || []).filter(c => !c.archivé && !c.fait && c.colonneId !== colonneTerminée?.id
    && !(c.récurrence && (sansRécurrentes || (c.validées || []).includes(jour))))
  const vues = new Set()
  const prendre = liste => liste.filter(c => (vues.has(c.id) ? false : (vues.add(c.id), true)))
  const enRetard = prendre(actives.filter(c => c.échéance && c.échéance < auj))
  const échéance = prendre(actives.filter(c => c.échéance === auj))
  const colonne = prendre(actives.filter(c => colonneAujourdhui && c.colonneId === colonneAujourdhui.id))
  const idsActives = new Set(actives.map(c => c.id))
  const planifiées = (data.timeline || []).filter(ev => ev.date === auj && !vues.has(ev.carteId) && (!ev.carteId || idsActives.has(ev.carteId)))
  return {
    enRetard, échéance, colonne, planifiées, colonneAujourdhui, colonneTerminée,
    duJour: échéance.length + colonne.length + planifiées.length,
    total: enRetard.length + échéance.length + colonne.length + planifiées.length,
  }
}
