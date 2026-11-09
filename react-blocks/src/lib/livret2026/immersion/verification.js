// Vérification des réponses écrites (questions de compréhension) : on cherche
// les mots-clés de la réponse du livret, sans tenir compte des accents, des
// majuscules, ni de l'écriture des siècles (« XVe », « 15e », « 15ème »).
export const SEUIL = 4 // bonnes réponses sur 5 au quiz pour valider un épisode

const ROMAINS = { i: 1, v: 5, x: 10 }
const romain = r => { const v = [...r].map(c => ROMAINS[c]); return v.reduce((s, x, i) => s + (i + 1 < v.length && x < v[i + 1] ? -x : x), 0) }

const ORDINAUX = ['premier', 'deuxieme', 'troisieme', 'quatrieme', 'cinquieme', 'sixieme', 'septieme', 'huitieme', 'neuvieme', 'dixieme', 'onzieme', 'douzieme', 'treizieme', 'quatorzieme', 'quinzieme', 'seizieme', 'dix-septieme', 'dix-huitieme', 'dix-neuvieme', 'vingtieme', 'vingt-et-unieme']
const EN_LETTRES = new RegExp(`\\b(${[...ORDINAUX].sort((a, b) => b.length - a.length).join('|')}|premiere|seconde?)\\b`, 'g')

export const normaliser = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(EN_LETTRES, m => `${m.startsWith('premi') ? 1 : m.startsWith('second') ? 2 : ORDINAUX.indexOf(m) + 1}e`)
  .replace(/(\d)[\s\u202f\u00a0]+(?=\d{3}\b)/g, '$1')
  .replace(/(\d+)\s*(?:eme|e)\b/g, '$1e')
  .replace(/\b([ivx]+)(?:e|er|re)\b/g, (_, r) => `${romain(r)}e`)
  .replace(/[^a-z0-9]+/g, ' ').trim()

// Pour chaque mot-clé : trouvé ou non (radical pour les mots longs, mot entier sinon).
export function motsTrouvés(réponse, clés) {
  const r = ` ${normaliser(réponse)} `
  return clés.map(c => {
    const k = normaliser(c)
    if (k.length <= 3 || /\d/.test(k)) return r.includes(` ${k} `)
    return r.includes(k.slice(0, Math.max(4, Math.ceil(k.length * 0.6))))
  })
}

export const verdictDe = (réponse, clés) => { const t = motsTrouvés(réponse, clés); return t.every(Boolean) ? 'bien' : t.some(Boolean) ? 'presque' : 'non' }
