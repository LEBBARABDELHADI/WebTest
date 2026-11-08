// Mode film pour toutes les pages : l'épisode est construit à partir du
// contenu déjà découpé de la page (lib/livret2026/partie*.js). Tout ce qui est
// dit vient de la page ; seules les phrases d'accroche et de fin sont des
// répliques de la série. Fonction pure : utilisée par l'appli et par le script
// qui génère les voix (outils/voix/extraire-film.mjs).
import { CASTING } from './casting.js'
import { découper } from '../filmTemps.js'

const SÉRIE = ['lina', 'samir', 'odette', 'diallo', 'yanis']
const DUOS = [['yanis', 'lina'], ['samir', 'diallo'], ['yanis', 'odette'], ['lina', 'samir'], ['odette', 'diallo']]
const COULEURS = ['#fb923c', '#22d3ee', '#a3e635', '#e879f9', '#fb7185', '#fbbf24', '#93c5fd']

// Décor d'une scène d'après ses emojis (sinon celui de la partie du livret).
const DÉCORS = [
  [/🗳/, 'bureau-vote'], [/⚖|🧑‍⚖|👩‍⚖|👨‍⚖/, 'tribunal'], [/🏫|🎒|🖼|✏/, 'classe'],
  [/💼|🏢|🏭|✍|📅/, 'bureau'], [/🔑|🏘/, 'agence'], [/🏠|🏡|🛋|☕|🍽|🧸|📱|🪑|❄/, 'cuisine'],
  [/🌙|📻|🌃/, 'nuit-ville'], [/🎆|🎉|🇫🇷|🎶|🎤|🎼/, 'fete-jour'], [/🏛|📋|💐/, 'salle-mairie'],
  [/🏰|🌾|🌴|🦅|🕯|📜/, 'parchemin'], [/🌳|🛝|🌼|🗼|⛰|🏔|🌊|🏝/, 'paysage'],
]
const décorDe = (emojis, page) => DÉCORS.find(([r]) => r.test(emojis || ''))?.[1]
  || (page.partie === 4 ? 'paysage' : page.partie === 5 ? 'ville-jour' : 'rue-mairie')
const emojisDe = t => [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(t || '')].map(x => x.segment).filter(x => /\p{Extended_Pictographic}/u.test(x))

// Voix d'un personnage de la page : d'après son emoji, puis son nom.
const F = /^(amina|hélène|léa|giulia|inès|aïcha|sofia|nadia|jeanne|simone|joséphine|dalida|miriam|edith|awa|odile|julie|yasmine|fatou|elena|claire|salma|maman|mamie|mme|madame|lina)\b/i
const M = /^(karim|paul|marc|hugo|samir|tom|clovis|la fayette|napoléon|schoelcher|de gaulle|jean moulin|moustaki|léo|rouget|claude|son père|sami|noé|thomas|m\.|ibrahim|grand-père|papa|adam|moussa|monsieur)\b/i
function genreDe(emoji, nom, k) {
  if (/👧|👦|🧒|👶/u.test(emoji) || /\b1[0-4] ans\b/.test(nom)) return 'enfant'
  if (/👵/u.test(emoji) || /^(mamie|grand-mère)/i.test(nom)) return 'âgée'
  if (/👴/u.test(emoji) || /^grand-père/i.test(nom)) return 'âgé'
  if (F.test(nom)) return /🧓/u.test(emoji) ? 'âgée' : 'f'
  if (M.test(nom)) return 'm'
  if (/👩|♀|🧕|👰|💃|🤰/u.test(emoji)) return 'f'
  if (/👨|♂|🧔|🤵|👳|🧓/u.test(emoji)) return 'm'
  if (/^(la |une |l'agente|l'avocate)/i.test(nom)) return 'f'
  if (/^(le |un |l'agent\b)/i.test(nom)) return 'm'
  return k % 2 ? 'f' : 'm'
}
const VOIX_NAVIGATEUR = { f: { pitch: 1.1, rate: 1 }, m: { pitch: 0.85, rate: 1 }, enfant: { pitch: 1.45, rate: 1.08 }, 'âgée': { pitch: 0.85, rate: 0.9 }, 'âgé': { pitch: 0.7, rate: 0.9 } }
const ident = nom => `p-${nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

// « Oui : … » / « Non : … » → le texte seul, qui commence par une majuscule.
const sansOuiNon = t => { const x = t.replace(/^(oui|non|vrai|faux)\s*[:,!.]\s*/i, ''); return x.charAt(0).toUpperCase() + x.slice(1) }
const point = t => (/[.!?…»]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`)

export function construireFilm(page, { voix = null, suivante = null } = {}) {
  const personnages = { ...CASTING }
  const rangs = {}
  const acteur = (emoji, nom) => {
    const id = ident(nom.split(',')[0])
    if (!personnages[id]) {
      const genre = genreDe(emoji, nom, Object.keys(personnages).length)
      rangs[genre] = (rangs[genre] || 0)
      personnages[id] = { nom: nom.split(',')[0], emoji, couleur: COULEURS[Object.keys(personnages).length % COULEURS.length], genre, rang: rangs[genre]++, voix: VOIX_NAVIGATEUR[genre] }
    }
    return id
  }
  const [a, b] = DUOS[page.page % DUOS.length]
  const tour = k => SÉRIE[(page.page + k) % SÉRIE.length]
  let chapitre = 0, rq = 0
  const plans = [
    { type: 'titre', décor: décorDe(emojisDe(page.emoji).join(''), page), musique: 'mystère', narration: `Épisode ${page.page} : ${page.titre}.` },
    {
      décor: décorDe(page.emoji, page), caméra: 'zoom', musique: 'joyeux', accessoires: emojisDe(page.emoji).slice(0, 1).map(e => [e, 50, 26]),
      acteurs: [{ id: a, pos: 28, entrée: 'course', émotion: 'idée' }, { id: b, pos: 72, entrée: 'droite' }],
      répliques: [
        { qui: a, texte: `${personnages[b].nom}, on regarde l'épisode ensemble ?` },
        { qui: b, texte: `Oui ! Aujourd'hui : « ${page.titre.replace(/\s*;\s*/g, ', ')} ».`, émotion: 'joie' },
      ],
    },
  ]
  for (const s of page.scènes || []) {
    const musique = ['tendre', 'joyeux', 'mystère', 'épique'][plans.length % 4]
    switch (s.type) {
      case 'titre':
        chapitre++
        plans.push({ type: 'chapitre', numéro: `${s.emoji || ''} Chapitre ${chapitre}`.trim(), titre: s.titre, musique: 'épique', narration: [s.texte, s.narration].filter(Boolean).join(' ') })
        break
      case 'points': case 'flux':
        plans.push({
          type: 'cartes', variante: s.type === 'flux' ? 'flux' : 'liste', titre: s.titre, musique, narration: point(s.titre), après: s.narration,
          items: (s.points || s.étapes).map(([emoji, texte], k) => ({ emoji, texte, dire: point(texte), qui: tour(k) })),
        })
        break
      case 'zoom':
        plans.push({
          type: 'cartes', variante: 'liste', titre: s.titre, centre: s.centre, musique, narration: point(s.centre.texte), après: s.narration,
          items: s.autour.map(([emoji, texte], k) => ({ emoji, texte, dire: point(texte), qui: tour(k) })),
        })
        break
      case 'frise':
        plans.push({
          type: 'cartes', variante: 'frise', titre: s.titre, musique: 'épique', narration: point(s.titre), après: s.narration,
          items: s.étapes.map(([date, texte, emoji]) => ({ haut: date, emoji, texte, dire: `${date} : ${point(texte)}` })),
        })
        break
      case 'chiffres':
        plans.push({
          type: 'cartes', variante: 'chiffres', titre: s.titre, musique, narration: point(s.titre), après: s.narration,
          items: s.chiffres.map(([n, unité, texte]) => ({ haut: `${n}${unité || ''}`, texte, dire: `${n}${unité || ''} : ${point(texte)}` })),
        })
        break
      case 'nuage':
        plans.push({ type: 'cartes', variante: 'nuage', titre: s.titre, musique, après: s.narration, items: s.mots.map((m, k) => ({ texte: m, dire: k ? null : `${s.titre} : ${s.mots.join(', ')}.` })) })
        break
      case 'carte':
        plans.push({ type: 'cartes', variante: 'nuage', titre: s.titre, musique, après: s.narration, items: s.lieux.map(([nom, , , emoji], k) => ({ emoji: emoji || '📍', texte: nom, dire: k ? null : `${s.titre} : ${s.lieux.map(l => l[0]).join(', ')}.` })) })
        break
      case 'duo':
        plans.push({ type: 'split', titre: s.titre, musique: 'épique', après: s.narration, gauche: { titre: s.gauche.titre, chaîne: [s.gauche.emoji], texte: s.gauche.texte }, droite: { titre: s.droite.titre, chaîne: [s.droite.emoji], texte: s.droite.texte } })
        break
      case 'balance':
        plans.push({ type: 'split', titre: s.titre, musique: 'épique', après: s.narration, gauche: { titre: s.gauche.titre, chaîne: ['⛔'], texte: s.gauche.items.join(' ; ') + '.' }, droite: { titre: s.droite.titre, chaîne: ['✅'], texte: s.droite.items.join(' ; ') + '.' } })
        break
      case 'citation':
        plans.push({ type: 'citation', décor: 'parchemin', texte: s.texte, source: s.source, après: s.narration })
        break
      case 'scène': {
        const ids = [...new Set((s.acteurs || []).map(x => acteur(x.emoji, x.nom)))]
        const pos = ids.length === 1 ? [50] : ids.length === 2 ? [28, 72] : ids.map((_, k) => 14 + (k * 72) / (ids.length - 1))
        plans.push({
          décor: décorDe(s.décor, page), caméra: ['zoom', 'travelling'][plans.length % 2], musique,
          accessoires: emojisDe(s.décor).slice(0, 2).map((e, k) => [e, k ? 82 : 18, 18]),
          narration: s.titre ? point(s.titre.replace(/^\s*\d+[.)]\s*/, '')) : null, après: s.narration, // « 2. Le prosélytisme » → « Le prosélytisme. »
          acteurs: ids.map((id, k) => ({ id, pos: pos[k], entrée: ['gauche', 'droite', 'fondu'][k % 3] })),
          répliques: s.acteurs.map(x => ({ qui: acteur(x.emoji, x.nom), texte: x.dit })),
        })
        break
      }
      case 'devinette': {
        const [q, r] = DUOS[(page.page + 2) % DUOS.length]
        plans.push({
          décor: 'chambre-matin', caméra: 'zoom', musique: 'mystère', accessoires: [['❓', 50, 20]],
          acteurs: [{ id: q, pos: 28, entrée: 'gauche', émotion: 'idée' }, { id: r, pos: 72, entrée: 'droite' }],
          répliques: [
            { qui: q, texte: s.question },
            ...(s.indice ? [{ qui: r, texte: `Un indice : ${s.indice}` }] : []),
            { qui: r, texte: s.réponse, émotion: 'joie' },
          ],
          après: s.narration,
        })
        break
      }
      case 'vraiFaux': {
        const [q, r] = [tour(rq), tour(rq + 2)]
        rq++
        plans.push({
          décor: 'classe', caméra: 'travelling', musique: 'joyeux', accessoires: [['✅', 16, 16], ['❌', 84, 16]],
          narration: 'Vrai ou faux ?',
          acteurs: [{ id: q, pos: 28, entrée: 'gauche' }, { id: r, pos: 72, entrée: 'droite' }],
          répliques: s.affirmations.flatMap(([texte, vrai, explication]) => [
            { qui: q, texte: point(texte) },
            { qui: r, texte: `${vrai ? 'Vrai' : 'Faux'} ! ${point(sansOuiNon(explication))}`, émotion: vrai ? 'joie' : 'surprise' },
          ]),
        })
        break
      }
      default: break
    }
  }
  plans.push({
    type: 'final', décor: 'coucher-soleil', effet: 'étoiles', musique: 'tendre', texte: suivante ? `À SUIVRE : ÉPISODE ${suivante}` : 'FIN DE LA SÉRIE',
    acteurs: SÉRIE.map((id, k) => ({ id, pos: 12 + k * 19, entrée: 'saut' })),
    répliques: [
      { qui: b, texte: 'Voilà, tu sais tout sur cette page !', émotion: 'joie' },
      { qui: a, texte: 'Je file revoir ce qu\'il faut retenir.', émotion: 'idée' },
    ],
  })
  const repères = ['📌', '✅', '💡', '🏛️', '📖', '🇫🇷']
  plans.push({ type: 'fin', retenir: découper(page.résumé || page.titre, 240).map((t, k) => [k === 0 ? page.emoji || '📌' : repères[k % repères.length], t]) })
  return {
    page: page.page,
    épisode: `Épisode ${page.page}`,
    titre: page.titre,
    sousTitre: page.section || '',
    voix,
    personnages,
    plans,
  }
}
