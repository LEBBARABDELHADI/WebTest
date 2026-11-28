// Sons et musique du jeu. Par défaut : synthèse WebAudio originale, style console 8 bits (aucun fichier).
// Facultatif : si tu poses tes propres fichiers audio dans public/jeux/sons/ (voir LISEZMOI.txt), ils remplacent
// automatiquement les sons synthétisés. Je ne fournis pas les enregistrements de Nintendo (droits d'auteur).
let ctx = null, sortie = null, muet = false, minuteur = null, suivant = 0, étape = 0, thème = 0, bruit = null
const perso = {}, ondes = {}
let sourceMusique = null, tentéPerso = false
try { muet = localStorage.getItem('react-blocs-jeux-muet') === '1' } catch { /* ignore */ }
const FICHIERS = ['musique', 'saut', 'piece', 'ecrase', 'mort', 'victoire', 'agrandir', 'rapetisse', 'point', 'bloc', 'brique']
const CLÉ_SON = { pièce: 'piece', écrase: 'ecrase' }

async function chargerPerso() {
  if (tentéPerso || !ctx) return
  tentéPerso = true
  const base = import.meta.env.BASE_URL || '/'
  for (const nom of FICHIERS) {
    for (const ext of ['mp3', 'ogg', 'wav']) {
      try {
        const r = await fetch(`${base}jeux/sons/${nom}.${ext}`)
        if (!r.ok || !(r.headers.get('content-type') || '').startsWith('audio')) continue
        perso[nom] = await ctx.decodeAudioData(await r.arrayBuffer()); break
      } catch { /* fichier absent ou illisible : on garde la synthèse */ }
    }
  }
}

export function activer() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)(); sortie = ctx.createGain(); sortie.gain.value = muet ? 0 : 1; sortie.connect(ctx.destination)
      const tampon = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = tampon.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      bruit = tampon
      chargerPerso()
    } catch { ctx = null }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume()
}
export const estMuet = () => muet
export function régler(v) {
  muet = v
  try { localStorage.setItem('react-blocs-jeux-muet', v ? '1' : '0') } catch { /* ignore */ }
  if (sortie) sortie.gain.value = v ? 0 : 1
}

// Onde à impulsions (rapport cyclique 12,5 / 25 / 50 %) : le timbre « nasillard » des consoles 8 bits.
function impulsion(duty) {
  if (ondes[duty]) return ondes[duty]
  const n = 32, re = new Float32Array(n), im = new Float32Array(n)
  for (let k = 1; k < n; k++) { re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); im[k] = (2 / (k * Math.PI)) * (1 - Math.cos(k * Math.PI * duty)) }
  return (ondes[duty] = ctx.createPeriodicWave(re, im))
}
function note(f1, f2, début, d, duty = 0.5, vol = 0.06) {
  if (!ctx) return
  const o = ctx.createOscillator(), g = ctx.createGain()
  if (duty === 'tri') o.type = 'triangle'; else o.setPeriodicWave(impulsion(duty))
  o.frequency.setValueAtTime(f1, début); if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, début + d)
  g.gain.setValueAtTime(vol, début); g.gain.setValueAtTime(vol, début + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, début + d)
  o.connect(g).connect(sortie); o.start(début); o.stop(début + d + 0.02)
}
function souffle(début, d, vol = 0.05, haut = 6000) {
  if (!ctx || !bruit) return
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
  s.buffer = bruit; f.type = 'highpass'; f.frequency.value = haut
  g.gain.setValueAtTime(vol, début); g.gain.exponentialRampToValueAtTime(0.0001, début + d)
  s.connect(f).connect(g).connect(sortie); s.start(début); s.stop(début + d)
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12)

export function sfx(nom) {
  if (!ctx) return
  const clé = CLÉ_SON[nom] || nom
  if (perso[clé]) { const s = ctx.createBufferSource(); s.buffer = perso[clé]; s.connect(sortie); s.start(); return }
  const t = ctx.currentTime
  if (nom === 'saut') { note(180, 760, t, 0.17, 0.25, 0.07) }
  else if (nom === 'pièce') { note(988, 988, t, 0.06, 0.5, 0.06); note(1319, 1319, t + 0.06, 0.24, 0.5, 0.06) }
  else if (nom === 'écrase') { note(240, 60, t, 0.16, 0.5, 0.08); souffle(t, 0.08, 0.03, 2500) }
  else if (nom === 'mort') { [494, 466, 440, 415, 392, 370, 349, 330].forEach((f, i) => note(f, f * 0.96, t + i * 0.07, 0.09, 0.25, 0.06)); note(300, 50, t + 0.6, 0.5, 0.5, 0.07) }
  else if (nom === 'bloc') { note(150, 100, t, 0.1, 0.5, 0.09); souffle(t, 0.05, 0.03, 1500) }
  else if (nom === 'brique') { souffle(t, 0.18, 0.08, 1200); note(120, 50, t, 0.14, 0.5, 0.07) }
  else if (nom === 'agrandir') { [392, 494, 587, 784, 988, 1175, 1568].forEach((f, i) => note(f, f, t + i * 0.055, 0.1, 0.25, 0.06)) }
  else if (nom === 'rapetisse') { [1175, 988, 784, 587, 494, 392].forEach((f, i) => note(f, f, t + i * 0.06, 0.1, 0.25, 0.06)) }
  else if (nom === 'point') { [659, 784, 1047].forEach((f, i) => note(f, f, t + i * 0.08, 0.16, 'tri', 0.1)) }
  else if (nom === 'victoire') { [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => note(f, f, t + i * 0.12, 0.2, 0.5, 0.06)) }
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
    const l = LEAD[thème][i]; if (l) note(hz(l), hz(l), suivant, pas * 1.7, 0.25, 0.03)
    if (i % 2 === 0) { const b = BASSE[thème][(i / 8) | 0]; note(hz(b + (i % 8 === 4 ? 7 : 0)), hz(b + (i % 8 === 4 ? 7 : 0)), suivant, pas * 1.6, 'tri', 0.06) }
    if (i % 4 === 2) souffle(suivant, 0.04, 0.012, 7000)
    suivant += pas; étape++
  }
}
export function musique(marche, t = 0) {
  if (minuteur) { clearInterval(minuteur); minuteur = null }
  if (sourceMusique) { try { sourceMusique.stop() } catch { /* déjà arrêtée */ } sourceMusique = null }
  if (!marche || !ctx) return
  if (perso.musique) { const s = ctx.createBufferSource(); s.buffer = perso.musique; s.loop = true; s.connect(sortie); s.start(); sourceMusique = s; return }
  thème = t; étape = 0; suivant = ctx.currentTime + 0.05
  programmer(); minuteur = setInterval(programmer, 90)
}
