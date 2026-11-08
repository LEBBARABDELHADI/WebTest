// Index de l'agenda : tout ce qui a une date dans un foyer. Partagé par
// l'Agenda et « Ma journée ».
import { analyserAujourdhui } from './aujourdhui'
import { prévue, faite, actives, dateDe } from './habitudes'

// Tout ce qui a une date dans le foyer (perso + pro) : échéances, dates de
// livraison et tâches planifiées du Programme, tâches quotidiennes du jour,
// révisions de Mémoriser, habitudes du jour.
export function construireIndex(lire, foyer, auj) {
  const parJour = new Map()
  const ajouter = (jour, e) => { if (!parJour.has(jour)) parJour.set(jour, []); parJour.get(jour).push(e) }
  ;['perso', 'pro'].forEach(type => {
    const espace = `${foyer.préfixe}${type}`
    const étiquette = type === 'pro' ? 'Pro' : 'Perso'
    const t = lire('taches', espace)
    const { colonneTerminée } = analyserAujourdhui(t, auj)
    ;(t.cartes || []).filter(c => !c.archivé && c.échéance).forEach(c => {
      const finie = c.fait || c.colonneId === colonneTerminée?.id
      const e = { type: 'tâche', espace: étiquette, titre: c.texte.split('\n')[0], fait: finie, retard: !finie && c.échéance < auj, lien: `/taches/${espace}?carte=${c.id}` }
      ajouter(c.échéance, e)
      // Une tâche en retard réapparaît aussi aujourd'hui.
      if (e.retard) ajouter(auj, { ...e, détail: `prévue le ${dateDe(c.échéance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` })
    })
    ;(t.cartes || []).filter(c => !c.archivé && c.livraison).forEach(c => {
      const finie = c.fait || c.colonneId === colonneTerminée?.id
      ajouter(c.livraison, { type: 'livraison', espace: étiquette, titre: `📦 ${c.texte.split('\n')[0]}`, fait: finie, lien: `/taches/${espace}?carte=${c.id}` })
    })
    // Une tâche récurrente se valide jour par jour (case des « Tâches
    // quotidiennes ») : faite ce jour-là si ce jour est dans ses validations.
    const faiteLe = (c, jour) => (c?.récurrence ? (c.validées || []).includes(jour) : !!c?.fait || c?.colonneId === colonneTerminée?.id)
    const quotidiennesDuJour = new Set()
    ;(t.timeline || []).forEach(ev => {
      const c = (t.cartes || []).find(x => x.id === ev.carteId)
      if (c?.archivé) return
      if (c?.récurrence && ev.date === auj) quotidiennesDuJour.add(c.id)
      ajouter(ev.date, { type: c?.récurrence ? 'quotidienne' : 'planifiée', espace: étiquette, titre: ev.texte || c?.texte || 'Tâche', fait: faiteLe(c, ev.date), lien: `/taches/${espace}${ev.carteId ? `?carte=${ev.carteId}` : ''}` })
    })
    // Tâches quotidiennes (et hebdomadaires du jour) pas encore recopiées
    // dans la timeline : elles comptent aussi pour aujourd'hui.
    const jourSemaine = dateDe(auj).getDay()
    ;(t.cartes || []).filter(c => !c.archivé && !quotidiennesDuJour.has(c.id)
      && (c.récurrence === 'quotidienne' || (c.récurrence === 'hebdomadaire' && c.récurrenceJour === jourSemaine))).forEach(c => {
      ajouter(auj, { type: 'quotidienne', espace: étiquette, titre: c.texte.split('\n')[0], fait: faiteLe(c, auj), lien: `/taches/${espace}?carte=${c.id}` })
    })
    const m = lire('memoriser', espace)
    const révisions = new Map()
    ;(m.cartes || []).forEach(c => {
      const jour = !c.prochaineRevision || c.prochaineRevision < auj ? auj : c.prochaineRevision
      const k = `${jour}|${c.paquetId}`
      const r = révisions.get(k) || { jour, paquet: (m.paquets || []).find(p => p.id === c.paquetId), n: 0, retard: 0 }
      r.n += 1
      if (c.prochaineRevision && c.prochaineRevision < auj) r.retard += 1
      révisions.set(k, r)
    })
    révisions.forEach(r => ajouter(r.jour, {
      type: 'révision', espace: étiquette, couleur: r.paquet?.couleur, lien: `/memoriser/${espace}`,
      titre: `${r.paquet?.nom || 'Cartes'} · ${r.n} à réviser`, détail: r.retard ? `dont ${r.retard} en retard` : '',
    }))
  })
  return parJour
}

export function habitudesDuJour(lire, foyer, jour) {
  return ['perso', 'pro'].flatMap(type => {
    const espace = `${foyer.préfixe}${type}`
    const d = lire('habitudes', espace)
    return actives(d).filter(h => prévue(h, jour)).map(h => ({
      type: 'habitude', espace: type === 'pro' ? 'Pro' : 'Perso', titre: `${h.emoji || ''} ${h.nom}`, fait: faite(d.coches, h, jour), lien: `/habitudes/${espace}`, couleur: h.couleur,
    }))
  })
}
