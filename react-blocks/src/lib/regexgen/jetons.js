// Découpage d'une description en jetons : mots (normalisés sans accents ni
// majuscules), citations (« … », "…", '…', `…`) conservées telles quelles,
// ponctuation. Les élisions (l'email, d'une) sont séparées.

export const normaliser = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function singulier(m) {
  if (m.length > 3 && /ies$/.test(m)) return `${m.slice(0, -3)}y`
  if (m.length > 4 && /(ches|shes|sses|xes)$/.test(m)) return m.slice(0, -2)
  if (m.length > 3 && /aux$/.test(m)) return `${m.slice(0, -3)}al`
  if (m.length > 2 && /[sx]$/.test(m) && !/(ss|us|is)$/.test(m)) return m.slice(0, -1)
  return m
}

const RE_JETON = /«([^»]*)»|“([^”]*)”|"([^"]*)"|`([^`]*)`|(?<![\p{L}\p{N}])'([^']*)'(?![\p{L}\p{N}])|([\p{L}\p{N}_]+(?:[-.'’/:][\p{L}\p{N}_]+)*)|(\S)/gu
const ÉLISION = /^(l|d|j|m|n|s|t|c|qu)['’](.+)$/i

export function découper(description) {
  const texte = String(description ?? '').normalize('NFC')
  const jetons = []
  const ajouter = (brut, cité = false, ponct = false, debut = 0, fin = 0) => {
    const norm = normaliser(brut)
    jetons.push({ brut, norm, sing: singulier(norm), cité, ponct, i: jetons.length, debut, fin })
  }
  for (const m of texte.matchAll(RE_JETON)) {
    const cité = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5]
    const debut = m.index, fin = m.index + m[0].length
    if (cité !== undefined) { ajouter(cité, true, false, debut, fin); continue }
    if (m[6]) {
      const é = ÉLISION.exec(m[6])
      if (é) { ajouter(é[1], false, false, debut, debut + é[1].length + 1); ajouter(é[2], false, false, debut + é[1].length + 1, fin) } else ajouter(m[6], false, false, debut, fin)
      continue
    }
    if (m[7]) ajouter(m[7], false, true, debut, fin)
  }
  return jetons
}

// Détection FR / EN d'après des mots fréquents.
const MOTS_FR = new Set('le la les des du de un une et ou avec pour dans sur est sont qui que par suivi suivie suivis puis commence finit contient chiffre chiffres lettre lettres je veux regex valide adresse ligne lignes mot entre moins plus caractere caracteres majuscule minuscule'.split(' '))
const MOTS_EN = new Set('the a an and or with for in on is are that which by followed then starts ends contains digit digits letter letters want regex valid line lines word between least most character characters uppercase lowercase number phone email numbers capital without but not only extract find'.split(' '))

export function détecterLangue(jetons) {
  let fr = 0, en = 0
  for (const j of jetons) {
    if (j.cité) continue
    if (MOTS_FR.has(j.norm)) fr++
    if (MOTS_EN.has(j.norm)) en++
  }
  if (jetons.some(j => !j.cité && /[éèêàùçôî]/i.test(j.brut))) fr += 2
  return fr >= en ? 'fr' : 'en'
}

// Une expression (suite de mots normalisés) commence-t-elle au jeton k ?
export function expressionÀ(jetons, k, expressions) {
  let meilleur = 0
  for (const e of expressions) {
    const mots = e.split(' ')
    if (mots.length > meilleur && mots.every((mot, a) => jetons[k + a] && !jetons[k + a].cité && (jetons[k + a].norm === mot || (a === mots.length - 1 && jetons[k + a].sing === mot)))) meilleur = mots.length
  }
  return meilleur
}

export const estNombre = j => !!j && !j.cité && /^\d+$/.test(j.norm)

const NOMBRES = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100, one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, sixteen: 16, twenty: 20, thirty: 30 }

// Valeur numérique d'un jeton (chiffres ou nombre écrit en toutes lettres), ou null.
export function valeurNombre(j) {
  if (!j || j.cité) return null
  if (/^\d+$/.test(j.norm)) return Number(j.norm)
  if (j.norm !== 'un' && j.norm !== 'une' && j.norm in NOMBRES) return NOMBRES[j.norm]
  return null
}

// Texte d'une suite de jetons : espaces entre les mots, pas avant « , ; : . ! ? ) » ni après « ( ».
export function texteDesJetons(jetons) {
  let t = ''
  jetons.forEach((j, i) => {
    if (i === 0) t = j.brut
    else if (j.ponct && /^[,;:.!?)]$/.test(j.brut)) t += j.brut
    else if (jetons[i - 1].ponct && jetons[i - 1].brut === '(') t += j.brut
    else t += ` ${j.brut}`
  })
  return t
}
