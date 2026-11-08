// Son du mode film : une voix par personnage (synthèse vocale du navigateur,
// hauteur et vitesse propres) et une petite musique d'ambiance générée.
import { lirePréférencesVoix, texteBrut } from '../texteFormate'

// Promesse résolue à la fin de la réplique (ou après la durée estimée).
export function direRéplique(texte, { pitch = 1, rate = 1 } = {}) {
  return new Promise(resolve => {
    const synthèse = window.speechSynthesis
    if (!texte || !synthèse) { resolve(); return }
    synthèse.cancel()
    const préf = lirePréférencesVoix()
    const u = new SpeechSynthesisUtterance(texteBrut(texte))
    const voix = synthèse.getVoices().find(v => v.voiceURI === préf.voix) || synthèse.getVoices().find(v => /^fr/i.test(v.lang))
    if (voix) u.voice = voix
    u.lang = voix?.lang || 'fr-FR'
    u.rate = Math.max(0.5, Math.min(2, (préf.vitesse || 1) * rate))
    u.pitch = Math.max(0, Math.min(2, pitch))
    let fini = false
    const terminer = () => { if (!fini) { fini = true; clearTimeout(filet); resolve() } }
    const filet = setTimeout(terminer, 2500 + (texte.length * 85) / u.rate)
    u.onend = terminer
    u.onerror = terminer
    synthèse.speak(u)
  })
}

// Musique : accords tenus (nappes) + quelques notes, selon l'ambiance du plan.
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12)
const AMBIANCES = {
  mystère: { accords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], arpège: false, durée: 4 },
  joyeux: { accords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], arpège: true, durée: 2.4 },
  tendre: { accords: [[53, 57, 60], [60, 64, 67], [57, 60, 64], [55, 59, 62]], arpège: false, durée: 3.4 },
  épique: { accords: [[50, 57, 62], [46, 53, 58], [48, 55, 60], [45, 52, 57]], arpège: true, durée: 2.2 },
}

export function créerMusique() {
  const C = window.AudioContext || window.webkitAudioContext
  if (!C) return null
  const ctx = new C()
  const maître = ctx.createGain()
  maître.gain.value = 0
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'; filtre.frequency.value = 1400
  maître.connect(filtre); filtre.connect(ctx.destination)
  let ambiance = null, minuteur = null, i = 0, actif = false
  const jouer = () => {
    const a = AMBIANCES[ambiance]
    if (!a || !actif) return
    const t = ctx.currentTime
    const accord = a.accords[i % a.accords.length]
    accord.forEach((n, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = k === 0 ? 'triangle' : 'sine'
      o.frequency.value = NOTE(n - (k === 0 ? 12 : 0))
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.16, t + 0.6)
      g.gain.linearRampToValueAtTime(0, t + a.durée + 0.4)
      o.connect(g); g.connect(maître); o.start(t); o.stop(t + a.durée + 0.5)
    })
    if (a.arpège) {
      ;[0, 1, 2, 1].forEach((k, j) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        const tn = t + (j * a.durée) / 4
        o.type = 'sine'; o.frequency.value = NOTE(accord[k] + 12)
        g.gain.setValueAtTime(0, tn); g.gain.linearRampToValueAtTime(0.09, tn + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, tn + 0.5)
        o.connect(g); g.connect(maître); o.start(tn); o.stop(tn + 0.6)
      })
    }
    i++
    minuteur = setTimeout(jouer, a.durée * 1000)
  }
  return {
    ambiance(nom) { if (!nom || nom === ambiance) return; ambiance = nom; i = 0; clearTimeout(minuteur); if (actif) jouer() },
    démarrer() { if (actif) return; actif = true; ctx.resume?.(); maître.gain.setTargetAtTime(0.22, ctx.currentTime, 0.4); clearTimeout(minuteur); jouer() },
    arrêter() { actif = false; clearTimeout(minuteur); maître.gain.setTargetAtTime(0, ctx.currentTime, 0.2) },
    fermer() { actif = false; clearTimeout(minuteur); try { ctx.close() } catch { /* ignore */ } },
  }
}
