// Sons et musique synthétisés avec WebAudio : aucun fichier externe.
let ctx = null, sortie = null, muet = false, minuteur = null, suivant = 0, étape = 0, thème = 0
try { muet = localStorage.getItem('react-blocs-jeux-muet') === '1' } catch { /* ignore */ }

export function activer() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); sortie = ctx.createGain(); sortie.gain.value = muet ? 0 : 1; sortie.connect(ctx.destination) } catch { ctx = null }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume()
}
export const estMuet = () => muet
export function régler(v) {
  muet = v
  try { localStorage.setItem('react-blocs-jeux-muet', v ? '1' : '0') } catch { /* ignore */ }
  if (sortie) sortie.gain.value = v ? 0 : 1
}

function note(f1, f2, début, d, type = 'square', vol = 0.06) {
  if (!ctx) return
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type; o.frequency.setValueAtTime(f1, début); if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, début + d)
  g.gain.setValueAtTime(vol, début); g.gain.exponentialRampToValueAtTime(0.0001, début + d)
  o.connect(g).connect(sortie); o.start(début); o.stop(début + d + 0.02)
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12)

export function sfx(nom) {
  if (!ctx) return
  const t = ctx.currentTime
  if (nom === 'saut') note(300, 720, t, 0.16)
  else if (nom === 'pièce') { note(988, 988, t, 0.07); note(1319, 1319, t + 0.07, 0.2) }
  else if (nom === 'écrase') note(260, 90, t, 0.15, 'sawtooth')
  else if (nom === 'mort') { note(520, 70, t, 0.8, 'sawtooth', 0.08) }
  else if (nom === 'bloc') note(180, 120, t, 0.1, 'square', 0.08)
  else if (nom === 'brique') note(150, 60, t, 0.15, 'sawtooth', 0.07)
  else if (nom === 'agrandir') [392, 523, 659, 784, 1047].forEach((f, i) => note(f, f, t + i * 0.07, 0.12, 'square', 0.06))
  else if (nom === 'rapetisse') [784, 523, 392].forEach((f, i) => note(f, f, t + i * 0.08, 0.14, 'square', 0.06))
  else if (nom === 'point') [659, 988].forEach((f, i) => note(f, f, t + i * 0.1, 0.18, 'triangle', 0.08))
  else if (nom === 'victoire') [523, 659, 784, 1047, 784, 1047].forEach((f, i) => note(f, f, t + i * 0.13, 0.22, 'square', 0.06))
}

const LEAD = [
  [72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 81, 0, 79, 0, 76, 0, 74, 0, 77, 0, 79, 0, 77, 0, 76, 0, 72, 0, 67, 0, 0, 0],
  [69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 77, 0, 76, 0, 72, 0, 71, 0, 74, 0, 76, 0, 74, 0, 72, 0, 69, 0, 64, 0, 0, 0],
  [64, 0, 67, 0, 71, 0, 67, 0, 66, 0, 69, 0, 71, 0, 67, 0, 64, 0, 62, 0, 59, 0, 62, 0, 64, 0, 0, 0, 0, 0, 0, 0],
]
const BASSE = [[48, 53, 55, 48], [45, 50, 52, 45], [40, 45, 47, 40]]

function programmer() {
  if (!ctx) return
  const pas = [0.15, 0.17, 0.2][thème] || 0.16
  while (suivant < ctx.currentTime + 0.35) {
    const i = étape % 32
    const l = LEAD[thème][i]; if (l) note(hz(l), hz(l), suivant, pas * 1.6, 'square', 0.022)
    if (i % 8 === 0) { const b = BASSE[thème][(i / 8) | 0]; note(hz(b), hz(b), suivant, pas * 6, 'triangle', 0.05) }
    suivant += pas; étape++
  }
}
export function musique(marche, t = 0) {
  if (minuteur) { clearInterval(minuteur); minuteur = null }
  if (!marche || !ctx) return
  thème = t; étape = 0; suivant = ctx.currentTime + 0.05
  programmer(); minuteur = setInterval(programmer, 90)
}
