// Ambiance sonore de Super Plombier : 100 % synthèse WebAudio, style console portable 8 bits, compositions originales.
// Canaux : 2 ondes à impulsions (12,5 / 25 / 50 %), 1 triangle (basse), 1 bruit (percussions). Aucun fichier requis.
// Facultatif : des fichiers perso listés dans public/jeux/sons/sons.json remplacent la synthèse (voir LISEZMOI.txt).
const CLÉ_MUET = 'react-blocs-jeux-muet', CLÉ_VOL = { musique: 'react-blocs-jeux-vol-musique', effets: 'react-blocs-jeux-vol-effets' }
const MAX_VOIX = 12, HORIZON = 0.18, PÉRIODE = 25

let ctx = null, G = null, muet = false, tentéPerso = false, lecteur = null, jingleSortie = null, souhait = null, suspendu = null, minuteursActifs = 0
const vols = { musique: 0.6, effets: 0.8 }
const perso = {}
try {
  muet = localStorage.getItem(CLÉ_MUET) === '1'
  for (const k of ['musique', 'effets']) { const v = parseFloat(localStorage.getItem(CLÉ_VOL[k])); if (Number.isFinite(v)) vols[k] = Math.min(1, Math.max(0, v)) }
} catch { /* stockage indisponible : valeurs par défaut */ }

const hz = m => 440 * Math.pow(2, (m - 69) / 12)
const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
function midi(tok) {
  const m = /^([a-g])(#|b)?(\d)$/.exec(tok)
  return m ? 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null
}
const hzN = nom => hz(midi(nom))

// ───────────────────────── Graphe audio (réutilisable en direct et hors ligne) ─────────────────────────
function créerGraphe(c, { musique = vols.musique, effets = vols.effets, muetInit = false, hors = false } = {}) {
  const maître = c.createGain(), comp = c.createDynamicsCompressor(), busM = c.createGain(), busE = c.createGain()
  comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.15
  maître.gain.value = muetInit ? 0 : 1; busM.gain.value = musique; busE.gain.value = effets
  busM.connect(maître); busE.connect(maître); maître.connect(comp); comp.connect(c.destination)
  const bruit = c.createBuffer(1, c.sampleRate, c.sampleRate), d = bruit.getChannelData(0)
  let s = 123456789
  for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = s / 2147483648 - 1 } // graine fixe : rendu reproductible
  return { c, maître, busM, busE, bruit, ondes: {}, hors, voixE: 0 }
}

// Onde à impulsions de rapport cyclique D : série de Fourier (cos : sin(2πkD)/πk, sin : (1-cos(2πkD))/πk).
function impulsion(g, D) {
  if (g.ondes[D]) return g.ondes[D]
  const n = 48, re = new Float32Array(n), im = new Float32Array(n)
  for (let k = 1; k < n; k++) { re[k] = Math.sin(2 * Math.PI * k * D) / (Math.PI * k); im[k] = (1 - Math.cos(2 * Math.PI * k * D)) / (Math.PI * k) }
  return (g.ondes[D] = g.c.createPeriodicWave(re, im))
}

// Une note : duty = 0.125 | 0.25 | 0.5 (impulsions) ou 'tri'. Enveloppe attaque 4 ms, tenue (sus), chute exponentielle.
function note(g, bus, f1, f2, t, d, duty, vol, { vib = 0, sus = 0.55 } = {}) {
  const compté = bus === g.busE && !g.hors
  if (compté) { if (g.voixE >= MAX_VOIX) return; g.voixE++ }
  d = Math.max(0.025, d)
  const c = g.c, o = c.createOscillator(), e = c.createGain()
  if (duty === 'tri') o.type = 'triangle'; else o.setPeriodicWave(impulsion(g, duty))
  o.frequency.setValueAtTime(f1, t)
  if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d * 0.9)
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = vib; l.connect(lg).connect(o.detune); l.start(t); l.stop(t + d + 0.02) }
  e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(vol, t + 0.004); e.gain.setValueAtTime(vol, t + Math.max(0.005, d * sus)); e.gain.exponentialRampToValueAtTime(0.0001, t + d)
  o.connect(e).connect(bus); o.start(t); o.stop(t + d + 0.02)
  if (compté) o.onended = () => { g.voixE-- }
}
function souffle(g, bus, t, d, vol, type = 'highpass', freq = 6000, q = 0.7, off = 0) {
  const compté = bus === g.busE && !g.hors
  if (compté) { if (g.voixE >= MAX_VOIX) return; g.voixE++ }
  const c = g.c, s = c.createBufferSource(), f = c.createBiquadFilter(), e = c.createGain()
  s.buffer = g.bruit; f.type = type; f.frequency.value = freq; f.Q.value = q
  e.gain.setValueAtTime(vol, t); e.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.02, d))
  s.connect(f).connect(e).connect(bus); s.start(t, off % 0.5); s.stop(t + d + 0.02)
  if (compté) s.onended = () => { g.voixE-- }
}

// ───────────────────────── Bruitages (créations originales) ─────────────────────────
const SFX = {
  saut: (g, t) => { note(g, g.busE, 240, 640, t, 0.15, 0.25, 0.09) },
  piece: (g, t) => { note(g, g.busE, 1047, 1047, t, 0.05, 0.5, 0.06); note(g, g.busE, 1760, 1760, t + 0.05, 0.24, 0.5, 0.06); note(g, g.busE, 2349, 2349, t + 0.09, 0.14, 0.125, 0.025) },
  bloc: (g, t) => { note(g, g.busE, 200, 105, t, 0.1, 'tri', 0.16); note(g, g.busE, 330, 330, t, 0.05, 0.5, 0.05); souffle(g, g.busE, t, 0.04, 0.03, 'lowpass', 1200) },
  brique: (g, t) => { souffle(g, g.busE, t, 0.2, 0.09, 'bandpass', 1500, 0.8); note(g, g.busE, 160, 50, t, 0.14, 'tri', 0.14); [900, 700, 520].forEach((f, i) => note(g, g.busE, f, f * 0.8, t + 0.04 + i * 0.035, 0.05, 0.125, 0.03)) },
  ecrase: (g, t) => { note(g, g.busE, 420, 110, t, 0.12, 0.5, 0.09); souffle(g, g.busE, t, 0.05, 0.05, 'bandpass', 900); note(g, g.busE, 180, 320, t + 0.11, 0.07, 0.25, 0.05) },
  degat: (g, t) => { [660, 520, 390, 290].forEach((f, i) => note(g, g.busE, f, f * 0.85, t + i * 0.07, 0.09, 0.125, 0.08, { vib: 25 })); souffle(g, g.busE, t, 0.12, 0.03, 'highpass', 3000) },
  mort: (g, t) => { [440, 415, 370, 330, 294, 247].forEach((f, i) => note(g, g.busE, f, f * 0.97, t + i * 0.09, 0.1, 0.25, 0.08)); note(g, g.busE, 200, 55, t + 0.58, 0.5, 'tri', 0.18); note(g, g.busE, 330, 82, t + 0.58, 0.5, 0.125, 0.04) },
  agrandir: (g, t) => { [392, 494, 587, 740, 988, 1175, 1480].forEach((f, i) => note(g, g.busE, f, f, t + i * 0.06, 0.07, 0.25, 0.07)); note(g, g.busE, 1976, 1976, t + 0.42, 0.28, 0.25, 0.06, { vib: 20 }) },
  point: (g, t) => { [659, 988, 1319].forEach((f, i) => { note(g, g.busE, f, f, t + i * 0.1, i === 2 ? 0.28 : 0.1, 0.5, 0.06); note(g, g.busE, f / 2, f / 2, t + i * 0.1, i === 2 ? 0.28 : 0.1, 'tri', 0.1) }) },
  vie: (g, t) => { [880, 1109, 1319, 1760, 1480, 1976, 2349].forEach((f, i) => note(g, g.busE, f, f, t + i * 0.075, i === 6 ? 0.3 : 0.08, 0.25, 0.06)) },
  secret: (g, t) => { [440, 523, 659, 831, 1047, 1319].forEach((f, i) => { note(g, g.busE, f, f, t + i * 0.09, 0.14, 0.125, 0.06, { vib: 12 }); note(g, g.busE, f / 2, f / 2, t + i * 0.09 + 0.12, 0.12, 'tri', 0.05) }); note(g, g.busE, 1760, 1760, t + 0.56, 0.35, 0.125, 0.04, { vib: 30 }) },
  pause: (g, t) => { note(g, g.busE, 880, 880, t, 0.05, 0.5, 0.06); note(g, g.busE, 660, 660, t + 0.06, 0.07, 0.5, 0.06) },
  reprise: (g, t) => { note(g, g.busE, 660, 660, t, 0.05, 0.5, 0.06); note(g, g.busE, 880, 880, t + 0.06, 0.07, 0.5, 0.06) },
  atterrit: (g, t) => { souffle(g, g.busE, t, 0.03, 0.04, 'lowpass', 900); note(g, g.busE, 120, 80, t, 0.04, 'tri', 0.07) },
  coup: (g, t) => { note(g, g.busE, 150, 330, t, 0.08, 0.5, 0.08) },
  victoire_mat: (g, t) => { for (let i = 0; i < 12; i++) note(g, g.busE, 1568 * Math.pow(2, -i / 6), 1568 * Math.pow(2, -(i + 1) / 6), t + i * 0.07, 0.08, 0.25, 0.06); note(g, g.busE, 110, 70, t + 0.86, 0.1, 'tri', 0.14) },
}
const ALIAS = { rapetisse: 'degat' }
const FICHIER_DE = { rapetisse: 'degat' } // noms de fichiers anciens → nouveaux
const NOMS_SFX = Object.keys(SFX)

// ───────────────────────── Jingles ─────────────────────────
function mélodie(g, bus, t, suite, duty, vol, opts) { // suite : [nom, durée]
  let x = t
  for (const [n, d] of suite) { if (n) note(g, bus, hzN(n), hzN(n), x, d * 0.95, duty, vol, opts); x += d }
  return x - t
}
const JINGLES = {
  niveau: (g, b, t) => {
    mélodie(g, b, t, [['c5', 0.12], ['e5', 0.12], ['g5', 0.12], ['c6', 0.24], ['g5', 0.12], ['c6', 0.12], ['e6', 1.1]], 0.25, 0.07, { sus: 0.85, vib: 6 })
    mélodie(g, b, t, [['e5', 0.12], ['g5', 0.12], ['c6', 0.12], ['e6', 0.24], ['c6', 0.12], ['e6', 0.12], ['g6', 1.1]], 0.125, 0.025, { sus: 0.85 })
    mélodie(g, b, t, [['c3', 0.36], ['g3', 0.24], ['c3', 0.12], ['c3', 1.2]], 'tri', 0.14, { sus: 0.9 })
    return 2.2
  },
  final: (g, b, t) => {
    const arp = ['c5 e5 g5 c6', 'g5 b5 d6 g6', 'a5 c6 e6 a6', 'f5 a5 c6 f6'].flatMap(s => s.split(' ').map(n => [n, 0.1]))
    mélodie(g, b, t, arp, 0.25, 0.07, { sus: 0.7 })
    mélodie(g, b, t, [['c3', 0.8], ['g2', 0.4], ['a2', 0.4], ['f2', 0.0001]], 'tri', 0.13, { sus: 0.9 })
    const f = t + 1.6
    for (const n of ['c6', 'e6', 'g6']) note(g, b, hzN(n), hzN(n), f, 2.2, 0.25, 0.05, { vib: 8, sus: 0.85 })
    note(g, b, hzN('c7'), hzN('c7'), f + 0.3, 1.9, 0.125, 0.03, { vib: 10, sus: 0.85 })
    note(g, b, hzN('c3'), hzN('c3'), f, 2.2, 'tri', 0.14, { sus: 0.9 })
    souffle(g, b, f, 0.5, 0.05, 'highpass', 4500)
    return 3.9
  },
  perdu: (g, b, t) => {
    mélodie(g, b, t, [['a4', 0.2], ['g4', 0.2], ['f4', 0.2], ['e4', 0.2], ['d4', 0.3]], 0.25, 0.07, { sus: 0.7, vib: 6 })
    mélodie(g, b, t, [['a2', 0.4], ['f2', 0.4], ['d2', 0.3]], 'tri', 0.14, { sus: 0.9 })
    note(g, b, hzN('a3'), hzN('a3') / 4, t + 1.3, 0.7, 'tri', 0.14)
    return 2.0
  },
}

// ───────────────────────── Musiques : écriture compacte, compilation en pas de croche ─────────────────────────
// Chaque section = 8 mesures de 8 croches. Mélodie : notes (c5, f#4, bb5), « - » = tenue, « . » = silence.
const ACC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
function accord(s) {
  const m = /^([A-G])(#|b)?(m|7)?$/.exec(s)
  if (!m) throw new Error(`accord invalide : ${s}`)
  const pc = (ACC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12, q = m[3] || 'M'
  return { pc, iv: q === 'm' ? [0, 3, 7, 12, 15] : q === '7' ? [0, 4, 7, 12, 10] : [0, 4, 7, 12, 16] }
}
const DÉFS = {
  0: { nom: 'Prairie', bpm: 140, arpPas: 2, arp: '0123212101232123', basse: 'r - R - 5 - R -', perc: ['kh', 'h', 'sh', 'h', 'kh', 'h', 'sh', 'h'], vol: { lead: 0.05, arp: 0.02, basse: 0.09, perc: 0.045 }, duty: 0.25,
    ordre: [{ m: 'A', arp: 0, perc: 0.5, fill: true }, { m: 'B', arp: 1, perc: 1, fill: true }, { m: 'A', arp: 1, perc: 1, fill: true }, { m: 'C', arp: 1, perc: 1, fill: true, crash: true }],
    accords: { A: 'C C G G Am F G C', B: 'F G Em Am F G C G7', C: 'C Am F G C Em F G' },
    mélodies: {
      A: 'e5 . g5 e5 c5 . e5 g5 | a5 . g5 . e5 - - . | d5 . g5 d5 b4 . d5 g5 | f5 . e5 . d5 - - . | c5 e5 a5 e5 c5 e5 a5 - | c5 f5 a5 f5 c6 - a5 f5 | d5 g5 b5 g5 d6 b5 g5 d5 | c5 - e5 - g5 - - .',
      B: 'a5 - f5 a5 c6 - a5 - | b5 - g5 b5 d6 - b5 - | g5 - e5 g5 b5 - g5 e5 | e5 a5 c6 a5 e6 - c6 - | f5 a5 c6 a5 f5 a5 c6 a5 | g5 b5 d6 b5 g5 b5 d6 b5 | e6 d6 c6 b5 c6 - g5 - | d5 f5 g5 b5 d6 - . .',
      C: 'g5 e5 g5 c6 - g5 e5 c5 | e5 a5 c6 e6 - c6 a5 - | f5 a5 c6 f6 - c6 a5 f5 | g5 b5 d6 g6 - d6 b5 g5 | c6 . c6 e6 g6 - e6 c6 | b5 . b5 e6 g6 - e6 b5 | a5 c6 f6 - e6 d6 c6 a5 | g5 . g5 . b5 d6 g6 .' } },
  1: { nom: 'Crépuscule', bpm: 120, arpPas: 1, arp: '01232121', basse: 'r - - - R - 5 -', perc: ['k', '', 'h', '', 's', '', 'h', 'h'], vol: { lead: 0.045, arp: 0.02, basse: 0.085, perc: 0.035 }, duty: 0.25,
    ordre: [{ m: 'A', arp: 0, perc: 0.5, vib: true }, { m: 'B', arp: 1, perc: 1, vib: true }, { m: 'A', arp: 1, perc: 1, vib: true }, { m: 'C', arp: 1, perc: 1, vib: true, crash: true }],
    accords: { A: 'Am F C G Am F Dm E', B: 'Dm Am Bb F Dm Am E Am', C: 'C G Am Em F C Dm E' },
    mélodies: {
      A: 'e5 - - a5 c6 - b5 - | a5 - - f5 c6 - a5 - | g5 - e5 - c5 - e5 g5 | b5 - - a5 g5 - - . | a5 - c6 - e6 - c6 a5 | f5 - a5 - c6 - a5 f5 | d5 - f5 a5 d6 - - a5 | g#5 - b5 - e6 - - .',
      B: 'f5 - a5 - d6 - c6 - | e5 - a5 - c6 - b5 a5 | d6 - c6 - bb5 - a5 f5 | a5 - c6 - f6 - - . | d6 - - a5 f5 - a5 d6 | c6 - - e5 a5 - c6 e6 | d6 - b5 - g#5 - b5 d6 | c6 - a5 - - - . .',
      C: 'c6 - e6 - g6 - e6 c6 | b5 - d6 - g6 - d6 b5 | a5 - c6 - e6 - c6 a5 | g5 - b5 - e6 - b5 g5 | a5 - c6 - f6 - e6 d6 | c6 - g5 - e5 - g5 c6 | d6 - a5 - f5 - a5 d6 | b5 - g#5 - e5 - . .' } },
  2: { nom: 'Nuit étoilée', bpm: 150, arpPas: 2, arp: '0232023212321232', basse: 'r r R r r R r 5', perc: ['kh', 'h', 's', 'kh', 'kh', 'h', 's', 'kh'], vol: { lead: 0.05, arp: 0.02, basse: 0.11, perc: 0.05 }, duty: 0.25,
    ordre: [{ m: 'A', arp: 1, perc: 0.5, fill: true }, { m: 'B', arp: 1, perc: 1, fill: true }, { m: 'A', arp: 1, perc: 1, fill: true }, { m: 'C', arp: 1, perc: 1, fill: true, crash: true }],
    accords: { A: 'Em Em C D Em Em C B7', B: 'Am Em C B7 Am Em F B7', C: 'Em C D B7 Em C D B7' },
    mélodies: {
      A: 'e5 . e5 g5 . b5 . g5 | e5 . e5 g5 . b5 a5 g5 | c5 . e5 g5 . c6 . g5 | d5 . f#5 a5 . d6 . a5 | e5 . e5 g5 . b5 . e6 | d6 . b5 . g5 . e5 . | c6 . g5 . e5 g5 c6 . | d#6 . b5 . f#5 . d#5 .',
      B: 'a5 - c6 - e6 - c6 a5 | g5 - b5 - e6 - b5 g5 | e5 g5 c6 e6 c6 g5 e5 g5 | f#5 - b5 - d#6 - . . | a5 c6 e6 a6 e6 c6 a5 e5 | g5 b5 e6 g6 e6 b5 g5 e5 | f5 a5 c6 f6 - e6 c6 a5 | f#5 . f#5 . d#5 f#5 b5 .',
      C: 'b5 e6 g6 e6 b5 g5 b5 e6 | c6 e6 g6 e6 c6 g5 c6 e6 | d6 f#6 a6 f#6 d6 a5 d6 f#6 | d#6 f#6 b6 - f#6 d#6 b5 - | e6 - b5 e6 g6 - e6 b5 | e6 - g5 c6 e6 - c6 g5 | f#6 - a5 d6 f#6 - d6 a5 | d#6 . d#6 . f#6 . b6 .' } },
  menu: { nom: 'Menu', bpm: 88, arpPas: 1, arp: '01232321', basse: 'r - - - 5 - - -', perc: [], vol: { lead: 0.04, arp: 0.016, basse: 0.075, perc: 0 }, duty: 0.5,
    ordre: [{ m: 'A', arp: 1, perc: 0 }],
    accords: { A: 'C Am F G C Am F G' },
    mélodies: { A: 'e5 - g5 - a5 - g5 - | e5 - a5 - c6 - a5 - | f5 - a5 - c6 - a5 f5 | d5 - g5 - b5 - g5 - | g5 - e5 - c5 - e5 - | a5 - e5 - c5 - e5 a5 | a5 - f5 - c5 - f5 - | d5 - b4 - g4 - . .' } },
}

function compiler(def) {
  const N = def.ordre.length * 64
  const lead = new Array(N).fill(null), basse = new Array(N).fill(null), arp = new Array(N).fill(null), perc = new Array(N).fill(null)
  def.ordre.forEach((sec, si) => {
    const barres = def.mélodies[sec.m].split('|').map(b => b.trim().split(/\s+/))
    const accs = def.accords[sec.m].split(/\s+/).map(accord)
    if (barres.length !== 8 || accs.length !== 8 || barres.some(b => b.length !== 8)) throw new Error(`section ${def.nom}/${sec.m} : 8 mesures de 8 croches attendues`)
    let cur = null
    for (let b = 0; b < 8; b++) {
      const base = si * 64 + b * 8, ac = accs[b]
      for (let k = 0; k < 8; k++) {
        const tok = barres[b][k]
        if (tok === '-') { if (cur) cur.len++; continue }
        cur = null
        if (tok === '.') continue
        const m = midi(tok)
        if (m === null) throw new Error(`note invalide : ${tok}`)
        cur = { m, len: 1, vib: !!sec.vib }; lead[base + k] = cur
      }
      let racine = 36 + ac.pc; if (racine < 40) racine += 12
      let bc = null
      const pb = def.basse.split(' ')
      for (let k = 0; k < 8; k++) {
        const t = pb[k]
        if (t === '-') { if (bc) bc.len++; continue }
        bc = null
        if (t === '.') continue
        bc = { m: racine + (t === 'R' ? 12 : t === '5' ? 7 : 0), len: 1 }; basse[base + k] = bc
      }
      if (sec.arp) {
        for (let k = 0; k < 8; k++) {
          arp[base + k] = def.arpPas === 2 ? [60 + ac.pc + ac.iv[+def.arp[2 * k]], 60 + ac.pc + ac.iv[+def.arp[2 * k + 1]]] : [60 + ac.pc + ac.iv[+def.arp[k]]]
        }
      }
      if (sec.perc > 0 && def.perc.length) {
        for (let k = 0; k < 8; k++) {
          let p = def.perc[k] || ''
          if (sec.fill && b === 7 && k >= 5) p = 's'
          if (sec.perc < 1) p = p.replace('s', '')
          if (sec.crash && b === 0 && k === 0) p += 'c'
          perc[base + k] = p || null
        }
      }
    }
  })
  return { nom: def.nom, N, pas: 30 / def.bpm, bpm: def.bpm, lead, basse, arp, perc, vol: def.vol, duty: def.duty }
}
const cacheChansons = {}
const chanson = id => cacheChansons[id] || (cacheChansons[id] = compiler(DÉFS[id]))

function programmerÉtape(g, S, i, t, sortie) {
  const dur = S.pas, v = S.vol, pc = v.perc / 0.045
  const L = S.lead[i % S.N]
  if (L) note(g, sortie, hz(L.m), hz(L.m), t, L.len * dur * 0.95, S.duty, v.lead, { vib: L.len >= 3 || L.vib ? 7 : 0, sus: 0.8 })
  const B = S.basse[i % S.N]
  if (B) note(g, sortie, hz(B.m), hz(B.m), t, B.len * dur * 0.9, 'tri', v.basse, { sus: 0.8 })
  const A = S.arp[i % S.N]
  if (A) A.forEach((m, k) => note(g, sortie, hz(m), hz(m), t + k * dur / A.length, dur / A.length * 0.9, 0.125, v.arp, { sus: 0.5 }))
  const P = S.perc[i % S.N]
  if (P) {
    const off = (i % S.N) * 0.0137
    if (P.includes('k')) { note(g, sortie, 165, 46, t, 0.1, 'tri', 0.12 * pc); souffle(g, sortie, t, 0.03, 0.02 * pc, 'lowpass', 600, 0.7, off) }
    if (P.includes('s')) { souffle(g, sortie, t, 0.11, 0.05 * pc, 'bandpass', 1800, 0.9, off); note(g, sortie, 220, 130, t, 0.06, 'tri', 0.04 * pc) }
    if (P.includes('h')) souffle(g, sortie, t, 0.035, 0.022 * pc, 'highpass', 7500, 0.7, off)
    if (P.includes('c')) souffle(g, sortie, t, 0.4, 0.035 * pc, 'highpass', 4500, 0.7, off)
  }
}

// ───────────────────────── Lecteur de musique en direct (planification par anticipation) ─────────────────────────
function arrêterLecteur(l, rapide = false) {
  if (!l || l.arrêté) return
  l.arrêté = true
  if (l.minuteur) { clearInterval(l.minuteur); minuteursActifs-- }
  try { l.perso?.stop() } catch { /* déjà arrêtée */ }
  const now = ctx.currentTime
  l.sortie.gain.cancelScheduledValues(now); l.sortie.gain.setTargetAtTime(0, now, rapide ? 0.01 : 0.04)
  setTimeout(() => { try { l.sortie.disconnect() } catch { /* déjà déconnectée */ } }, 600)
}
function lancerLecteur(id, étape = 0) {
  const S = chanson(id), sortie = ctx.createGain()
  sortie.connect(G.busM)
  const l = { id, S, étape, suivant: ctx.currentTime + 0.06, sortie, jalons: [], minuteur: null }
  const tic = () => {
    const now = ctx.currentTime
    if (l.suivant < now) l.suivant = now + 0.02 // retard (onglet ralenti) : on se recale sans rafale de notes
    while (l.suivant < now + HORIZON) {
      programmerÉtape(G, S, l.étape, l.suivant, sortie)
      l.jalons.push({ t: l.suivant, i: l.étape }); if (l.jalons.length > 24) l.jalons.shift()
      l.suivant += S.pas; l.étape++
      if (l.étape >= S.N) l.étape = 0
    }
  }
  tic(); l.minuteur = setInterval(tic, PÉRIODE); minuteursActifs++
  return l
}
function démarrer(id, étape) {
  if (perso.musique && id !== 'menu') {
    const s = ctx.createBufferSource(), sortie = ctx.createGain()
    s.buffer = perso.musique; s.loop = true; s.connect(sortie); sortie.connect(G.busM); s.start()
    return { id, sortie, minuteur: null, perso: s, étape: 0 }
  }
  return lancerLecteur(id, étape)
}
function couperJingle() { if (jingleSortie && ctx) { const o = jingleSortie; jingleSortie = null; const now = ctx.currentTime; o.gain.cancelScheduledValues(now); o.gain.setTargetAtTime(0, now, 0.02); setTimeout(() => { try { o.disconnect() } catch { /* ok */ } }, 400) } }

const clé = niveau => (niveau === 'menu' ? 'menu' : String(Math.min(2, Math.max(0, Math.floor(+niveau) || 0))))

// ───────────────────────── API publique ─────────────────────────
export function activer() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      ctx = new AC()
      G = créerGraphe(ctx, { muetInit: muet })
      ctx.addEventListener?.('statechange', () => { if (ctx.state === 'interrupted') ctx.resume().catch(() => {}) })
      chargerPerso()
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
    if (souhait && !lecteur && !suspendu) musique(souhait.marche, souhait.niveau)
  } catch { ctx = null; G = null }
}

async function chargerPerso() {
  if (tentéPerso || !ctx) return
  tentéPerso = true
  try {
    const base = import.meta.env.BASE_URL || '/'
    const r = await fetch(`${base}jeux/sons/sons.json`)
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return
    const liste = await r.json()
    const fichiers = Array.isArray(liste) ? liste : Object.values(liste || {})
    for (const f of fichiers) {
      const nom = String(f).replace(/\.(mp3|ogg|wav)$/i, '')
      if (!nom || nom.includes('/')) continue
      try {
        const rf = await fetch(`${base}jeux/sons/${f}`)
        if (!rf.ok || !(rf.headers.get('content-type') || '').startsWith('audio')) continue
        perso[FICHIER_DE[nom] || nom] = await ctx.decodeAudioData(await rf.arrayBuffer())
      } catch { /* fichier illisible : on garde la synthèse */ }
    }
  } catch { /* pas de sons personnalisés */ }
}

export function sfx(nom) {
  try {
    if (!ctx || !G) return
    const n = ALIAS[nom] || nom
    if (nom === 'victoire') { jingle('niveau'); return }
    if (perso[n]) { const s = ctx.createBufferSource(); s.buffer = perso[n]; s.connect(G.busE); s.start(); return }
    if (SFX[n]) SFX[n](G, ctx.currentTime + 0.005)
  } catch { /* un bruitage raté ne doit jamais casser le jeu */ }
}

export function musique(marche, niveau = 0) {
  try {
    souhait = { marche, niveau }
    if (!ctx || !G) return
    const id = clé(niveau)
    if (!marche) { arrêterLecteur(lecteur); lecteur = null; suspendu = null; return }
    couperJingle()
    if (lecteur && lecteur.id === id) { if (suspendu) reprendre(); return }
    arrêterLecteur(lecteur, true); lecteur = null; suspendu = null
    lecteur = démarrer(id, 0)
  } catch { /* ignore */ }
}

export function jingle(nom) {
  try {
    if (!ctx || !G || !JINGLES[nom]) return 0
    arrêterLecteur(lecteur, true); lecteur = null; suspendu = null; couperJingle()
    const sortie = ctx.createGain(); sortie.connect(G.busM); jingleSortie = sortie
    if (nom === 'niveau' && perso.victoire) { const s = ctx.createBufferSource(); s.buffer = perso.victoire; s.connect(sortie); s.start(); return s.buffer.duration }
    return JINGLES[nom](G, sortie, ctx.currentTime + 0.01)
  } catch { return 0 }
}

export function suspendre() {
  try {
    if (!ctx || !lecteur || suspendu) return
    const now = ctx.currentTime
    const prochain = lecteur.jalons ? (lecteur.jalons.find(j => j.t > now + 0.005) || { i: lecteur.étape }) : { i: 0 }
    suspendu = { id: lecteur.id, étape: prochain.i }
    arrêterLecteur(lecteur, true); lecteur = null
  } catch { /* ignore */ }
}
export function reprendre() {
  try {
    if (!ctx || !suspendu) return
    const s = suspendu; suspendu = null
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
    lecteur = démarrer(s.id, s.étape)
  } catch { /* ignore */ }
}

export const estMuet = () => muet
export function régler(v) {
  muet = !!v
  try { localStorage.setItem(CLÉ_MUET, muet ? '1' : '0') } catch { /* ignore */ }
  if (G) G.maître.gain.setTargetAtTime(muet ? 0 : 1, ctx.currentTime, 0.01)
}
export function volume(type) { return vols[type === 'effets' ? 'effets' : 'musique'] }
export function régler_volume(type, v) {
  const k = type === 'effets' ? 'effets' : 'musique'
  const x = Math.min(1, Math.max(0, Number.isFinite(+v) ? +v : vols[k]))
  vols[k] = x
  try { localStorage.setItem(CLÉ_VOL[k], String(x)) } catch { /* ignore */ }
  if (G) (k === 'musique' ? G.busM : G.busE).gain.setTargetAtTime(x, ctx.currentTime, 0.02)
}

// ───────────────────────── Rendu hors ligne (tests objectifs) ─────────────────────────
// nom : 'sfx:saut' | 'jingle:final' | 'musique:0' | 'musique:menu'. Volumes à 1 (pire cas). Renvoie les échantillons mono.
export async function __rendreHorsLigne(nom, { boucles = 2, sampleRate = 44100, durée } = {}) {
  const [type, id] = nom.split(':')
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext
  let dur, boucle = 0, S = null
  if (type === 'musique') { S = chanson(id); boucle = S.N * S.pas; dur = boucle * boucles + 0.4 } else dur = durée ?? (type === 'jingle' ? 6 : 2.5)
  const c = new OC(1, Math.ceil(dur * sampleRate), sampleRate)
  const g = créerGraphe(c, { musique: 1, effets: 1, hors: true })
  let cue = 0
  if (type === 'sfx') SFX[ALIAS[id] || id](g, 0.01)
  else if (type === 'jingle') cue = JINGLES[id](g, g.busM, 0.01)
  else for (let i = 0; i < S.N * boucles; i++) programmerÉtape(g, S, i, 0.01 + i * S.pas, g.busM)
  const buf = await c.startRendering()
  return { data: buf.getChannelData(0), sr: sampleRate, durée: dur, boucle, cue, bpm: S ? S.bpm : 0 }
}
export const __etat = () => ({ contexte: ctx ? ctx.state : null, lecteur: lecteur ? lecteur.id : null, suspendu: suspendu ? suspendu.id : null, minuteurs: minuteursActifs, voixE: G ? G.voixE : 0, muet, vols: { ...vols }, perso: Object.keys(perso), jingle: !!jingleSortie })
export const __noms = { sfx: NOMS_SFX, jingles: Object.keys(JINGLES), musiques: ['0', '1', '2', 'menu'] }
