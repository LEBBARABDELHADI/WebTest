// Entrées unifiées : clavier, boutons tactiles et manette (API Gamepad). Aucune allocation par image.
const CLAVIER = { ArrowLeft: 'gauche', KeyA: 'gauche', KeyQ: 'gauche', ArrowRight: 'droite', KeyD: 'droite', Space: 'saut', ArrowUp: 'saut', KeyW: 'saut', KeyZ: 'saut', ShiftLeft: 'course', ShiftRight: 'course', KeyB: 'course', KeyX: 'course' }
const ZONE_MORTE = 0.35

export function créerEntrées(rappels = {}) {
  const clavier = { gauche: false, droite: false, saut: false, course: false }
  const tactile = { gauche: false, droite: false, saut: false, course: false }
  const manette = { gauche: false, droite: false, saut: false, course: false }
  const sortie = { gauche: false, droite: false, saut: false, course: false, appareil: 'clavier', manette: null }
  let startAvant = false, actif = false

  const touche = (v, e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (v && !e.repeat) rappels.pause?.(); e.preventDefault(); return }
    if (e.code === 'KeyF') { if (v && !e.repeat) rappels.plein?.(); e.preventDefault(); return }
    if (e.code === 'KeyM') { if (v && !e.repeat) rappels.muet?.(); e.preventDefault(); return }
    if (rappels.bloqué?.()) return
    const k = CLAVIER[e.code]; if (!k) return
    clavier[k] = v; sortie.appareil = 'clavier'; e.preventDefault()
    if (v) rappels.geste?.()
  }
  const kd = e => touche(true, e), ku = e => touche(false, e)
  const vider = () => { for (const o of [clavier, tactile, manette]) for (const k in o) o[k] = false }
  const flou = () => vider()
  const visible = () => { if (document.hidden) { vider(); rappels.caché?.() } }
  const connexion = e => { sortie.manette = e.gamepad.id; rappels.manette?.(true, e.gamepad.id) }
  const déconnexion = e => { vider(); sortie.manette = null; rappels.manette?.(false, e.gamepad.id) }

  function sonder() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []
    let gp = null
    for (const p of pads) { if (p && p.connected) { if (!gp || (p.mapping === 'standard' && gp.mapping !== 'standard')) gp = p } }
    if (!gp) { manette.gauche = manette.droite = manette.saut = manette.course = false; return }
    sortie.manette = gp.id
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed)
    const ax = gp.axes[0] || 0
    manette.gauche = ax < -ZONE_MORTE || b(14)
    manette.droite = ax > ZONE_MORTE || b(15)
    manette.saut = b(0) || b(3) || b(12) || (gp.axes[1] || 0) < -0.7
    manette.course = b(1) || b(2) || b(7) || b(5)
    const start = b(9) || b(8)
    if (start && !startAvant) rappels.pause?.()
    startAvant = start
    if (manette.gauche || manette.droite || manette.saut || manette.course) { sortie.appareil = 'manette'; rappels.geste?.() }
  }

  return {
    clavier, tactile, manette,
    attacher() {
      if (actif) return; actif = true
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', flou)
      document.addEventListener('visibilitychange', visible)
      window.addEventListener('gamepadconnected', connexion); window.addEventListener('gamepaddisconnected', déconnexion)
    },
    détacher() {
      if (!actif) return; actif = false
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', flou)
      document.removeEventListener('visibilitychange', visible)
      window.removeEventListener('gamepadconnected', connexion); window.removeEventListener('gamepaddisconnected', déconnexion)
      vider()
    },
    vider,
    sonder,
    lire() {
      sonder()
      sortie.gauche = clavier.gauche || tactile.gauche || manette.gauche
      sortie.droite = clavier.droite || tactile.droite || manette.droite
      sortie.saut = clavier.saut || tactile.saut || manette.saut
      sortie.course = clavier.course || tactile.course || manette.course
      return sortie
    },
    toucherTactile(k, v) { tactile[k] = v; if (v) { sortie.appareil = 'tactile'; rappels.geste?.() } },
  }
}
