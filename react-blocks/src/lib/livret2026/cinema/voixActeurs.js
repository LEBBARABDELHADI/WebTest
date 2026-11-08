// Voix de synthèse « jouées » (mode mixte) : quand une réplique n'a pas été
// enregistrée par une vraie personne, on prend la voix la plus naturelle de
// l'appareil (voix « Natural », « Neural », « Premium », « améliorée »,
// Google…), une voix différente par personnage si possible, et on la fait
// « jouer » : phrase par phrase, avec des respirations aux virgules et aux
// points, et de petites variations de rythme, comme un comédien.
import { qualitéVoix, texteBrut } from '../../texteFormate'

const FÉMININES = /(amélie|audrey|aurélie|aurelie|marie|julie|hortense|denise|eloise|éloise|céline|celine|virginie|léa|lea|chantal|sylvie|caroline|claire|brigitte|juliette|vivienne|yvette|charline|coralie|ariane|elsa|female|femme|fr-fr-x-frc|fr-fr-x-frd)/i
const MASCULINES = /(thomas|henri|paul|rémy|remy|daniel|nicolas|antoine|jacques|guillaume|claude|jean|alain|mathieu|gérard|gerard|maurice|male|homme|fr-fr-x-frb|fr-fr-x-vlf)/i
const score = v => qualitéVoix(v) * 10 + (/google|online|natural|neural/i.test(`${v.name} ${v.voiceURI}`) ? 5 : 0) + (v.localService === false ? 1 : 0) + (/fr-fr/i.test(v.lang) ? 2 : 0)

export function voixDisponibles() {
  const toutes = window.speechSynthesis?.getVoices?.() || []
  return toutes.filter(v => /^fr/i.test(v.lang)).sort((a, b) => score(b) - score(a))
}

// Attribue une voix à chaque personnage (genre souhaité, puis la meilleure qualité).
export function distribuerVoix(personnages) {
  const fr = voixDisponibles()
  if (!fr.length) return null
  const f = fr.filter(v => FÉMININES.test(`${v.name} ${v.voiceURI}`))
  const m = fr.filter(v => MASCULINES.test(`${v.name} ${v.voiceURI}`))
  const prises = new Map()
  const choisir = (liste, k) => liste.length ? liste[k % liste.length] : fr[k % fr.length]
  let nf = 0, nm = 0
  Object.entries(personnages).forEach(([id, p]) => {
    const g = p.voix?.genre
    if (id === 'narrateur') prises.set(id, fr[0])
    else if (g === 'm') prises.set(id, choisir(m, nm++))
    else prises.set(id, choisir(f, nf++))
  })
  return prises
}

// Découpe en groupes de souffle : phrases, puis virgules / deux-points.
const morceaux = texte => texteBrut(texte).replace(/\s+/g, ' ').match(/[^,;:.!?…]+[,;:.!?…]*\s*/g)?.map(x => x.trim()).filter(Boolean) || [texte]
const pauseAprès = m => (/…$/.test(m) ? 520 : /[.!?]$/.test(m) ? 380 : /[;:]$/.test(m) ? 260 : /,$/.test(m) ? 170 : 120)

// Joue une réplique. `surParole(vrai/faux)` indique quand la bouche bouge.
export function jouerRéplique(texte, voix, profil = {}, surParole) {
  const synthèse = window.speechSynthesis
  let arrêté = false, minuteur = null
  const promesse = new Promise(ok => {
    if (!synthèse || !voix) { ok(); return }
    synthèse.cancel()
    const liste = morceaux(texte)
    const suivant = i => {
      if (arrêté) { ok(); return }
      if (i >= liste.length) { surParole?.(false); ok(); return }
      const m = liste[i]
      const u = new SpeechSynthesisUtterance(m)
      u.voice = voix; u.lang = voix.lang
      const varie = 1 + (Math.random() * 0.06 - 0.03)
      u.rate = Math.max(0.6, Math.min(1.4, (profil.rate || 1) * varie * (/[?]$/.test(m) ? 1.03 : 1)))
      u.pitch = Math.max(0.5, Math.min(1.6, (profil.pitch || 1) * (/[?!]$/.test(m) ? 1.04 : 1)))
      let fini = false
      const fin = () => { if (fini) return; fini = true; clearTimeout(filet); surParole?.(false); minuteur = setTimeout(() => suivant(i + 1), pauseAprès(m)) }
      const filet = setTimeout(fin, 1800 + m.length * 95 / u.rate)
      u.onstart = () => surParole?.(true)
      u.onend = fin; u.onerror = fin
      synthèse.speak(u)
    }
    suivant(0)
  })
  return { promesse, arrêter: () => { arrêté = true; clearTimeout(minuteur); synthèse?.cancel(); surParole?.(false) } }
}
