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

// Titre d'un côté de « split » lu à voix haute : « DEPUIS 1946 » → « depuis 1946 »,
// mais « L'État ne peut pas » reste tel quel.
const lu = t => (t === t.toUpperCase() && /[A-ZÀ-Ý]{4,}/.test(t) ? t.toLowerCase() : t) // « CDD » reste « CDD »
const narrer = t => (t ? découper(t).map(texte => ({ qui: 'narrateur', texte })) : [])

// Plan « cartes » : à quel temps chaque carte apparaît (une carte sans texte à
// dire apparaît avec la précédente).
export function apparitionCartes(plan) {
  const d = narrer(plan.narration).length
  let i = 0, préc = d
  return plan.items.map(it => { if (it.dire) { préc = d + i; i++ } return préc })
}

// Les « temps » d'un plan : ce qui est dit, dans l'ordre. « après » : narration
// lue à la fin du plan (conclusion).
export function tempsDu(plan) {
  if (plan.type === 'fin') return []
  const n = narrer(plan.narration)
  const après = narrer(plan.après)
  switch (plan.type) {
    case 'citation': return [...n, { qui: 'narrateur', texte: plan.texte, citation: true }, ...après]
    case 'split': return [...n, { qui: 'narrateur', texte: `${lu(plan.gauche.titre)} : ${plan.gauche.texte}`, côté: 'gauche' }, { qui: 'narrateur', texte: `${lu(plan.droite.titre)} : ${plan.droite.texte}`, côté: 'droite' }, ...après]
    case 'manga': return [...n, ...plan.cases.flatMap((c, k) => [{ qui: 'narrateur', texte: c.légende, case: k }, { qui: c.qui, texte: c.texte, case: k }]), ...après]
    case 'cartes': return [...n, ...plan.items.flatMap((it, k) => (it.dire ? [{ qui: it.qui || 'narrateur', texte: it.dire, carte: k }] : [])), ...après]
    // Une réplique peut aussi être un temps musical sans parole : { pause, son, légende }.
    default: return [...n, ...(plan.répliques || []), ...après]
  }
}
