// Outils communs du Livret 2026 animé : thèmes par partie, texte lu à voix
// haute pour chaque scène, adresse des images des pages, variantes d'entrée.

export const PARTIES = {
  0: { nom: 'Avant-propos', emoji: '📖', a: '#4c6ef5', b: '#141a3a' },
  1: { nom: 'Principes et valeurs', emoji: '🇫🇷', a: '#2563eb', b: '#7f1d1d' },
  2: { nom: 'Institutions', emoji: '🏛️', a: '#7c3aed', b: '#1e1b4b' },
  3: { nom: 'Droits et devoirs', emoji: '⚖️', a: '#0f9f6e', b: '#073b2c' },
  4: { nom: 'Histoire, géographie, culture', emoji: '🗺️', a: '#c2741a', b: '#3b1d06' },
  5: { nom: 'Vivre en France', emoji: '🏡', a: '#ea580c', b: '#3a1405' },
  6: { nom: 'Annexes', emoji: '📜', a: '#a8873a', b: '#26221c' },
}

export const imagePage = n => `${import.meta.env.BASE_URL}livret2026/p-${String(n).padStart(2, '0')}.webp`

export const hash = s => { let h = 0; const t = String(s); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h }

// Entrées possibles d'une scène : choisies selon la page et la scène, pour que
// chaque page ait sa propre mise en scène.
export const ENTRÉES = ['l26-monte', 'l26-zoom', 'l26-glisse', 'l26-bascule', 'l26-spirale', 'l26-rideau']
export const entréeDe = (page, i) => ENTRÉES[hash(`${page}-${i}`) % ENTRÉES.length]

export function texteScène(s) {
  if (s.narration) return s.narration
  switch (s.type) {
    case 'titre': return `${s.titre}. ${s.texte}`
    case 'points': return `${s.titre}. ${s.points.map(p => p[1]).join('. ')}`
    case 'chiffres': return `${s.titre}. ${s.chiffres.map(c => `${c[0]}${c[1]} : ${c[2]}`).join('. ')}`
    case 'frise': return `${s.titre}. ${s.étapes.map(e => `${e[0]} : ${e[1]}`).join('. ')}`
    case 'duo': return `${s.titre}. ${s.gauche.titre} : ${s.gauche.texte} ${s.droite.titre} : ${s.droite.texte}`
    case 'balance': return `${s.titre}. ${s.gauche.titre} : ${s.gauche.items.join(', ')}. ${s.droite.titre} : ${s.droite.items.join(', ')}.`
    case 'citation': return `${s.texte} ${s.source}.`
    case 'scène': return s.acteurs.map(a => `${a.nom} : ${a.dit}`).join(' ')
    case 'flux': return `${s.titre}. ${s.étapes.map(e => e[1]).join(', puis ')}.`
    case 'zoom': return `${s.titre}. ${s.centre.texte} : ${s.autour.map(a => a[1]).join(', ')}.`
    case 'carte': return `${s.titre} : ${s.lieux.map(l => l[0]).join(', ')}.`
    case 'nuage': return `${s.titre} : ${s.mots.join(', ')}.`
    case 'devinette': return s.question
    case 'vraiFaux': return 'Vrai ou faux ?'
    default: return ''
  }
}

// Durée d'affichage sans voix : assez pour lire tranquillement.
export const duréeLecture = s => Math.min(16000, 3200 + texteScène(s).length * 48)
export const interactive = s => s.type === 'vraiFaux' || s.type === 'devinette'

export const COULEURS_NIVEAU = ['#9ca3af', '#ef4444', '#f59e0b', '#22a55e']
export const NOMS_NIVEAU = ['Pas encore vue', 'Vue', 'Apprise', 'Maîtrisée']
