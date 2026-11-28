// Caméra : zone morte horizontale, avance dans le sens du déplacement, stabilité verticale (pas d'oscillation en sautant).
import { VUE_L, VUE_H, HAUTEUR, TUILE, CAMÉRA, JOUEUR } from './config.js'

export function créerCaméra(s) {
  const c = { x: 0, y: 0, look: 0, cibleY: 0 }
  recaler(c, s)
  return c
}
const borne = (v, a, b) => Math.max(a, Math.min(b, v))

export function recaler(c, s) {
  const h = s.grand ? JOUEUR.hGrand : JOUEUR.hPetit
  c.look = 0
  c.x = borne(s.x + JOUEUR.w / 2 - VUE_L / 2, 0, s.largeur * TUILE - VUE_L)
  c.cibleY = s.y + h - CAMÉRA.basY
  c.y = borne(c.cibleY, 0, HAUTEUR * TUILE - VUE_H)
}

export function majCaméra(c, s) {
  if (s.statut === 'mort') return c
  const h = s.grand ? JOUEUR.hGrand : JOUEUR.hPetit
  const maxX = s.largeur * TUILE - VUE_L, maxY = HAUTEUR * TUILE - VUE_H
  // avance : la caméra regarde un peu devant le joueur, sans à-coup
  const visée = Math.abs(s.vx) > 0.4 ? s.dir * CAMÉRA.avance : 0
  c.look += (visée - c.look) * 0.04
  const cible = s.x + JOUEUR.w / 2 - VUE_L / 2 + c.look
  const écart = cible - c.x
  if (Math.abs(écart) > CAMÉRA.zoneMorte) c.x += (écart - Math.sign(écart) * CAMÉRA.zoneMorte) * CAMÉRA.lissageX
  c.x = borne(c.x, 0, maxX)
  // verticale : on ne suit que lorsque le joueur se pose, ou s'il approche des bords de l'écran
  const pieds = s.y + h
  if (s.sol || s.statut === 'arrivée') c.cibleY = pieds - CAMÉRA.basY
  else if (pieds - c.y < 28) c.cibleY = pieds - 28
  else if (pieds - c.y > VUE_H - 10) c.cibleY = pieds - (VUE_H - 10)
  c.y += (borne(c.cibleY, 0, maxY) - c.y) * CAMÉRA.lissageY
  c.y = borne(c.y, 0, maxY)
  return c
}
