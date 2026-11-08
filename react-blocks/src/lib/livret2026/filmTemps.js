// Mode film : les « temps » d'un plan (ce qui est dit, dans l'ordre). Partagé
// entre le lecteur (Film.jsx) et le script qui génère les voix (outils/voix).

// Une narration longue est découpée en sous-titres courts (phrase par phrase,
// puis aux tirets ou aux virgules), pour garder l'image grande.
export function découper(texte, max = 150) {
  const phrases = texte.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g)?.map(x => x.trim()).filter(Boolean) || [texte]
  return phrases.flatMap(ph => {
    if (ph.length <= max) return [ph]
    const morceaux = ph.split(/\s—\s|,\s(?=[a-zà-ü])/i)
    const l = []
    let cour = ''
    morceaux.forEach((m, i) => {
      const sep = i === 0 ? '' : ph.includes(' — ') && cour && ph.indexOf(m) > 2 && ph[ph.indexOf(m) - 2] === '—' ? ' — ' : ', '
      if ((cour + sep + m).length > max && cour) { l.push(cour + (/[,—]$/.test(cour) ? '' : '…')); cour = m } else cour = cour ? cour + sep + m : m
    })
    if (cour) l.push(cour)
    return l
  })
}

// Les « temps » d'un plan : ce qui est dit, dans l'ordre.
export function tempsDu(plan) {
  const n = plan.narration ? découper(plan.narration).map(texte => ({ qui: 'narrateur', texte })) : []
  switch (plan.type) {
    case 'citation': return [...n, { qui: 'narrateur', texte: plan.texte, citation: true }]
    case 'split': return [...n, { qui: 'narrateur', texte: `${plan.gauche.titre.toLowerCase()} : ${plan.gauche.texte}`, côté: 'gauche' }, { qui: 'narrateur', texte: `${plan.droite.titre.toLowerCase()} : ${plan.droite.texte}`, côté: 'droite' }]
    case 'manga': return [...n, ...plan.cases.flatMap((c, k) => [{ qui: 'narrateur', texte: c.légende, case: k }, { qui: c.qui, texte: c.texte, case: k }])]
    case 'fin': return []
    // Une réplique peut aussi être un temps musical sans parole : { pause, son, légende }.
    default: return [...n, ...(plan.répliques || [])]
  }
}
