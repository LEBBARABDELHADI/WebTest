// Son du court-métrage, SANS intelligence artificielle :
// - ambiances et bruitages synthétisés en direct (bruit filtré, cloches…),
// - musique jouée note par note avec un toucher « humain » (petits décalages
//   de tempo et de vélocité, comme un pianiste),
// - voix : de vraies voix enregistrées au micro (studio), gardées sur
//   l'appareil (IndexedDB), avec le niveau sonore pour animer les lèvres.

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12)
const hasard = (a, b) => a + Math.random() * (b - a)

// Progressions (notes MIDI), jouées en arpèges avec une main gauche.
const MUSIQUES = {
  chaleureux: { tempo: 72, accords: [[48, 55, 64, 67, 71], [45, 52, 60, 64, 67], [41, 48, 57, 60, 64], [43, 50, 59, 62, 67]] },
  réflexion: { tempo: 60, accords: [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [41, 48, 57, 60, 65], [48, 55, 60, 64, 67]] },
  élévation: { tempo: 66, accords: [[41, 48, 57, 60, 65], [40, 48, 55, 60, 64], [38, 50, 57, 62, 65], [46, 53, 58, 62, 65]] },
  tension: { tempo: 58, accords: [[45, 52, 57, 60, 64], [44, 52, 56, 59, 64], [43, 52, 55, 60, 64], [42, 50, 57, 62, 66]] },
  tendre: { tempo: 56, accords: [[53, 60, 64, 69, 72], [52, 59, 62, 67, 71], [50, 57, 60, 65, 69], [48, 55, 59, 64, 67]] },
  final: { tempo: 70, accords: [[48, 55, 64, 67, 72], [47, 55, 62, 67, 71], [45, 52, 60, 64, 69], [41, 48, 57, 60, 65], [43, 50, 59, 62, 67]] },
}

export function créerSonCinéma() {
  const C = window.AudioContext || window.webkitAudioContext
  if (!C) return null
  const ctx = new C()
  const sortie = ctx.createDynamicsCompressor()
  sortie.connect(ctx.destination)
  const bus = () => { const g = ctx.createGain(); g.connect(sortie); g.gain.value = 0; return g }
  const busMusique = bus(), busAmbiance = bus(), busEffets = bus(), busVoix = bus()
  busEffets.gain.value = 0.7; busVoix.gain.value = 1
  // Réverbération légère (salle) pour le piano et les bruitages.
  const réverb = ctx.createConvolver()
  const ir = ctx.createBuffer(2, ctx.sampleRate * 2.2, ctx.sampleRate)
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) }
  réverb.buffer = ir
  const retourRéverb = ctx.createGain(); retourRéverb.gain.value = 0.22
  réverb.connect(retourRéverb); retourRéverb.connect(sortie)

  const bruit = (() => { const b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); const d = b.getChannelData(0); let br = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; br = (br + 0.02 * w) / 1.02; d[i] = i % 2 ? w : br * 3.5 } return b })()
  const sourceBruit = (filtreType, fréq, q = 0.7) => {
    const s = ctx.createBufferSource(); s.buffer = bruit; s.loop = true
    const f = ctx.createBiquadFilter(); f.type = filtreType; f.frequency.value = fréq; f.Q.value = q
    s.connect(f); return { s, f }
  }

  // ---------- Piano « humain » ----------
  const piano = (note, t, vélocité = 0.7, durée = 2.6, vers = busMusique) => {
    const f = NOTE(note)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22 * vélocité, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.06 * vélocité, t + 0.35)
    g.gain.exponentialRampToValueAtTime(0.0001, t + durée)
    const filtre = ctx.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 900 + vélocité * 2600
    g.connect(filtre); filtre.connect(vers); filtre.connect(réverb)
    ;[[1, 1], [2, 0.42], [3, 0.18], [4.02, 0.08]].forEach(([h, a]) => {
      const o = ctx.createOscillator(); o.type = 'sine'
      o.frequency.value = f * h * (1 + hasard(-0.0012, 0.0012))
      const ga = ctx.createGain(); ga.gain.value = a
      o.connect(ga); ga.connect(g); o.start(t); o.stop(t + durée + 0.1)
    })
  }
  // Nappe de cordes, très douce, pour lier les accords.
  const nappe = (notes, t, durée) => {
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 1.2); g.gain.linearRampToValueAtTime(0, t + durée)
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100
    g.connect(f); f.connect(busMusique); f.connect(réverb)
    notes.forEach(n => [-4, 4].forEach(dét => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = dét; o.connect(g); o.start(t); o.stop(t + durée + 0.1) }))
  }
  let musique = null, minuteurMusique = null, mesure = 0
  const jouerMesure = () => {
    const m = MUSIQUES[musique]
    if (!m) return
    const noire = 60 / m.tempo
    const accord = m.accords[mesure % m.accords.length]
    const t0 = ctx.currentTime + 0.05
    piano(accord[0] - 12, t0 + hasard(0, 0.02), hasard(0.55, 0.7), noire * 6)
    nappe(accord.slice(1, 4), t0, noire * 4.2)
    // Arpège avec rubato : chaque note un peu en avance ou en retard.
    const motif = [1, 2, 3, 4, 3, 2, 3, 4]
    motif.forEach((k, i) => piano(accord[k], t0 + i * (noire / 2) + hasard(-0.025, 0.03) + (i === 7 ? hasard(0.02, 0.06) : 0), hasard(0.35, 0.62) * (i % 4 === 0 ? 1.15 : 1), noire * 2.4))
    mesure++
    minuteurMusique = setTimeout(jouerMesure, noire * 4 * 1000 * hasard(0.99, 1.02))
  }

  // ---------- Ambiances ----------
  let ambiance = null, nœudsAmbiance = [], minuteursAmbiance = []
  const arrêterAmbiance = () => {
    nœudsAmbiance.forEach(n => { try { n.stop() } catch { /* ignore */ } })
    minuteursAmbiance.forEach(clearTimeout)
    nœudsAmbiance = []; minuteursAmbiance = []
  }
  const boucle = (nom, fn, min, max) => { const t = () => { if (ambiance !== nom) return; fn(); minuteursAmbiance.push(setTimeout(t, hasard(min, max))) }; minuteursAmbiance.push(setTimeout(t, hasard(min, max) / 2)) }
  const lancerAmbiance = nom => {
    arrêterAmbiance()
    ambiance = nom
    const tenue = (type, fréq, gain, q) => { const { s, f } = sourceBruit(type, fréq, q); const g = ctx.createGain(); g.gain.value = gain; f.connect(g); g.connect(busAmbiance); s.start(); nœudsAmbiance.push(s); return g }
    if (nom === 'rue') { tenue('lowpass', 380, 0.5); boucle(nom, () => effet('voiture'), 5000, 11000); boucle(nom, () => effet('oiseau'), 3000, 7000) }
    if (nom === 'salle') { tenue('lowpass', 220, 0.35); boucle(nom, () => effet('feuillette'), 7000, 14000) }
    if (nom === 'souffle') { const g = tenue('bandpass', 700, 0.18, 0.4); const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.1; lfo.connect(lg); lg.connect(g.gain); lfo.start(); nœudsAmbiance.push(lfo) }
    if (nom === 'visio') { tenue('highpass', 1400, 0.22); tenue('lowpass', 300, 0.25); boucle(nom, () => effet('goutte'), 120, 420) }
    if (nom === 'bougie') { tenue('lowpass', 200, 0.3); boucle(nom, () => effet('crépite'), 300, 1400) }
    if (nom === 'soir') { tenue('bandpass', 500, 0.12, 0.5); boucle(nom, () => effet('oiseau'), 4000, 9000) }
    if (nom === 'nuit') { tenue('lowpass', 260, 0.2); boucle(nom, () => effet('grillon'), 700, 1600) }
  }

  // ---------- Bruitages ----------
  const effet = nom => {
    const t = ctx.currentTime + 0.01
    const env = (g, a, d, v = 1) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d) }
    const rafale = (type, f1, f2, a, d, v, q = 1, vers = busEffets) => {
      const { s, f } = sourceBruit(type, f1, q); const g = ctx.createGain(); env(g, a, d, v)
      if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + a + d)
      f.connect(g); g.connect(vers); g.connect(réverb); s.start(t, hasard(0, 2)); s.stop(t + a + d + 0.05)
    }
    const cloche = (f, v, d) => [[1, 1], [2.76, 0.35], [5.4, 0.14]].forEach(([h, a]) => { const o = ctx.createOscillator(); o.frequency.value = f * h; const g = ctx.createGain(); env(g, 0.004, d / h, v * a); o.connect(g); g.connect(busEffets); g.connect(réverb); o.start(t); o.stop(t + d + 0.1) })
    switch (nom) {
      case 'page': rafale('bandpass', 1800, 5200, 0.02, 0.28, 0.5, 0.8); setTimeout(() => rafale('bandpass', 3000, 1500, 0.01, 0.12, 0.25, 1), 160); break
      case 'feuillette': rafale('bandpass', 2400, 4200, 0.03, 0.22, 0.12, 0.9); break
      case 'carillon': cloche(hasard(1040, 1060), 0.18, 2.4); setTimeout(() => cloche(1560, 0.1, 2), 140); break
      case 'lanterne': cloche(hasard(780, 800), 0.12, 1.6); break
      case 'whoosh': rafale('bandpass', 300, 3200, 0.35, 0.5, 0.35, 0.6); break
      case 'bloc': { const o = ctx.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.25); const g = ctx.createGain(); env(g, 0.005, 0.35, 0.5); o.connect(g); g.connect(busEffets); o.start(t); o.stop(t + 0.45); rafale('lowpass', 600, null, 0.005, 0.12, 0.25); break }
      case 'crayon': for (let i = 0; i < 6; i++) setTimeout(() => rafale('bandpass', 3600, 2600, 0.01, hasard(0.05, 0.12), 0.18, 2), i * hasard(110, 170)); break
      case 'plume': for (let i = 0; i < 8; i++) setTimeout(() => rafale('bandpass', 4200, 3000, 0.01, hasard(0.04, 0.1), 0.12, 2.5), i * hasard(140, 220)); break
      case 'pas': for (let i = 0; i < 5; i++) setTimeout(() => { const g = ctx.createGain(); const { s, f } = sourceBruit('lowpass', 420); const tt = ctx.currentTime; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.35, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.16); f.connect(g); g.connect(busEffets); s.start(tt, hasard(0, 2)); s.stop(tt + 0.2) }, i * hasard(440, 520)); break
      case 'appel': [0, 1].forEach(k => setTimeout(() => { [440, 554].forEach(fr => { const o = ctx.createOscillator(); o.frequency.value = fr; const g = ctx.createGain(); const tt = ctx.currentTime; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.06, tt + 0.02); g.gain.setValueAtTime(0.06, tt + 0.35); g.gain.linearRampToValueAtTime(0, tt + 0.42); o.connect(g); g.connect(busEffets); o.start(tt); o.stop(tt + 0.5) }) }, k * 700)); break
      case 'voiture': rafale('lowpass', 200, 900, 1.4, 1.6, 0.18, 0.5, busAmbiance); break
      case 'oiseau': { const o = ctx.createOscillator(); const base = hasard(2600, 3600); o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.08); o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.16); const g = ctx.createGain(); env(g, 0.01, 0.16, 0.025); o.connect(g); g.connect(busAmbiance); o.start(t); o.stop(t + 0.25); break }
      case 'goutte': { const o = ctx.createOscillator(); o.frequency.setValueAtTime(hasard(1800, 3200), t); o.frequency.exponentialRampToValueAtTime(600, t + 0.03); const g = ctx.createGain(); env(g, 0.001, 0.04, hasard(0.01, 0.03)); o.connect(g); g.connect(busAmbiance); o.start(t); o.stop(t + 0.06); break }
      case 'crépite': rafale('highpass', 2500, null, 0.001, 0.02, hasard(0.05, 0.15), 1, busAmbiance); break
      case 'grillon': for (let i = 0; i < 3; i++) setTimeout(() => { const o = ctx.createOscillator(); o.frequency.value = 4600; const g = ctx.createGain(); const tt = ctx.currentTime; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.012, tt + 0.01); g.gain.linearRampToValueAtTime(0, tt + 0.05); o.connect(g); g.connect(busAmbiance); o.start(tt); o.stop(tt + 0.06) }, i * 70); break
      // Premières mesures de La Marseillaise (Rouget de Lisle, 1792 :
      // domaine public), jouées au piano avec un toucher « humain ».
      case 'marseillaise': {
        const noire = 0.56
        let tt = t + 0.05
        ;[[62, 0.75], [62, 0.25], [67, 1], [67, 1], [69, 1], [69, 1], [74, 1.5], [71, 0.5], [67, 0.75], [67, 0.25], [71, 0.75], [67, 0.25], [64, 1], [72, 2], [69, 0.75], [66, 0.25], [67, 2]].forEach(([n, d]) => {
          piano(n, tt + hasard(-0.015, 0.02), hasard(0.72, 0.85), Math.max(0.9, d * noire * 1.6), busEffets)
          piano(n - 12, tt, 0.35, d * noire * 1.4, busEffets)
          tt += d * noire
        })
        break
      }
      // Feu d'artifice : sifflement qui monte, explosion, crépitements.
      case 'artifice': {
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(hasard(600, 800), t); o.frequency.exponentialRampToValueAtTime(hasard(2200, 2800), t + 0.9)
        const g = ctx.createGain(); env(g, 0.05, 0.85, 0.02); o.connect(g); g.connect(busEffets); o.start(t); o.stop(t + 1)
        setTimeout(() => effet('éclat'), 950)
        setTimeout(() => effet('éclat'), 2300)
        break
      }
      case 'éclat': {
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.5)
        const g = ctx.createGain(); env(g, 0.004, 0.7, 0.6); o.connect(g); g.connect(busEffets); g.connect(réverb); o.start(t); o.stop(t + 0.8)
        rafale('bandpass', 900, 260, 0.004, 0.7, 0.45, 0.6)
        for (let i = 0; i < 9; i++) setTimeout(() => effet('grésil'), 160 + i * hasard(50, 110))
        break
      }
      case 'grésil': rafale('highpass', hasard(2800, 4200), null, 0.001, 0.03, hasard(0.06, 0.18), 1); break
      default: break
    }
  }

  const réglerBus = (b, v) => b.gain.setTargetAtTime(v, ctx.currentTime, 0.5)
  let niveaux = { musique: 0.55, ambiance: 0.7 }, actif = false, atténué = false
  const appliquer = () => {
    réglerBus(busMusique, actif ? niveaux.musique * (atténué ? 0.35 : 1) : 0)
    réglerBus(busAmbiance, actif ? niveaux.ambiance * (atténué ? 0.6 : 1) : 0)
  }
  return {
    ctx,
    démarrer() { actif = true; ctx.resume?.(); appliquer() },
    pause() { actif = false; appliquer() },
    réglages(n) { niveaux = { ...niveaux, ...n }; appliquer() },
    atténuer(v) { atténué = v; appliquer() },
    musique(nom) { if (nom === musique) return; musique = nom; clearTimeout(minuteurMusique); mesure = 0; if (nom) jouerMesure() },
    ambiance(nom) { if (nom !== ambiance) lancerAmbiance(nom) },
    effet,
    busVoix,
    fermer() { clearTimeout(minuteurMusique); arrêterAmbiance(); try { ctx.close() } catch { /* ignore */ } },
  }
}

// ---------- Voix enregistrées (IndexedDB, sur l'appareil) ----------
const BASE = 'react-blocs-voix', TABLE = 'voix'
const ouvrir = () => new Promise((ok, ko) => { const r = indexedDB.open(BASE, 1); r.onupgradeneeded = () => r.result.createObjectStore(TABLE); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error) })
const opération = async (mode, fn) => { const db = await ouvrir(); return new Promise((ok, ko) => { const tx = db.transaction(TABLE, mode); const r = fn(tx.objectStore(TABLE)); tx.oncomplete = () => ok(r?.result); tx.onerror = () => ko(tx.error) }) }
export const garderVoix = (clé, blob) => opération('readwrite', s => s.put(blob, clé))
export const lireVoix = clé => opération('readonly', s => s.get(clé))
export const effacerVoix = clé => opération('readwrite', s => s.delete(clé))
export const clésVoix = () => opération('readonly', s => s.getAllKeys())

export async function enregistreur() {
  const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
  const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
  const type = types.find(t => window.MediaRecorder?.isTypeSupported?.(t))
  const rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined)
  const morceaux = []
  rec.ondataavailable = e => { if (e.data.size) morceaux.push(e.data) }
  rec.start()
  return {
    arrêter: () => new Promise(ok => { rec.onstop = () => { flux.getTracks().forEach(t => t.stop()); ok(new Blob(morceaux, { type: rec.mimeType || 'audio/webm' })) }; rec.stop() }),
  }
}

// Lit une voix enregistrée ; `surNiveau` reçoit le volume (0 à 1) pour les lèvres.
export function jouerVoix(son, blob, surNiveau) {
  let fini = false, raf = 0
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  const promesse = new Promise(ok => {
    const terminer = () => { if (fini) return; fini = true; cancelAnimationFrame(raf); surNiveau?.(0); URL.revokeObjectURL(url); ok() }
    audio.onended = terminer; audio.onerror = terminer
    try {
      const src = son.ctx.createMediaElementSource(audio)
      const an = son.ctx.createAnalyser(); an.fftSize = 512
      src.connect(an); an.connect(son.busVoix)
      const d = new Uint8Array(an.fftSize)
      const mesurer = () => { an.getByteTimeDomainData(d); let s = 0; for (let i = 0; i < d.length; i++) { const v = (d[i] - 128) / 128; s += v * v } surNiveau?.(Math.sqrt(s / d.length)); raf = requestAnimationFrame(mesurer) }
      mesurer()
    } catch { /* lecture simple */ }
    audio.play().catch(terminer)
  })
  return { promesse, pause: () => audio.pause(), reprendre: () => audio.play().catch(() => {}), arrêter: () => { audio.pause(); audio.onended?.() } }
}

// ---------- Voix générées à l'avance (fichiers du site) ----------
// Décodées une fois (cache), jouées par Web Audio : fiable sur téléphone après
// le toucher « Lancer », et le volume anime les lèvres.
const tampons = new Map()
export function précharger(son, url) {
  if (!son || tampons.has(url)) return tampons.get(url)
  const p = fetch(url).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer() }).then(a => son.ctx.decodeAudioData(a)).catch(() => null)
  tampons.set(url, p)
  return p
}
export function jouerFichier(son, url, surNiveau) {
  let source = null, raf = 0, fini = false, terminer = () => {}
  const promesse = new Promise(ok => {
    terminer = () => { if (fini) return; fini = true; cancelAnimationFrame(raf); surNiveau?.(0); try { source?.stop() } catch { /* ignore */ } ok() }
    précharger(son, url).then(tampon => {
      if (fini) return
      if (!tampon) { terminer(); return }
      source = son.ctx.createBufferSource(); source.buffer = tampon
      const an = son.ctx.createAnalyser(); an.fftSize = 512
      source.connect(an); an.connect(son.busVoix)
      source.onended = terminer
      const d = new Uint8Array(an.fftSize)
      const mesurer = () => { an.getByteTimeDomainData(d); let s = 0; for (let i = 0; i < d.length; i++) { const v = (d[i] - 128) / 128; s += v * v } surNiveau?.(Math.sqrt(s / d.length)); raf = requestAnimationFrame(mesurer) }
      source.start(); mesurer()
    })
  })
  return { promesse, arrêter: () => terminer() }
}
