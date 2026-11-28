// Effets visuels sans allocation par image : particules, textes flottants, secousse d'écran (pools préalloués).
const NP = 320, NT = 24

export function créerEffets() {
  const parts = Array.from({ length: NP }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, vie: 0, max: 1, type: 0, f: 0, g: 0.05 }))
  const textes = Array.from({ length: NT }, () => ({ on: false, x: 0, y: 0, txt: '', vie: 0, coul: 0 }))
  let ip = 0, it = 0
  const E = {
    secousse: 0, flash: 0, réduit: false,
    particule(type, x, y, vx, vy, vie, g = 0.05) { const p = parts[ip]; ip = (ip + 1) % NP; p.on = true; p.type = type; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.vie = p.max = vie; p.f = (Math.random() * 4) | 0; p.g = g },
    texte(x, y, txt, coul = 0) { const t = textes[it]; it = (it + 1) % NT; t.on = true; t.x = x; t.y = y; t.txt = txt; t.vie = 56; t.coul = coul },
    gerbe(type, x, y, n, vit, vie, g) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = Math.random() * vit; E.particule(type, x, y, Math.cos(a) * v, Math.sin(a) * v - vit * 0.4, vie, g) } },
    // type : 0 poussière · 1 étincelle · 2 débris · 3 confetti
    sur(ev) {
      switch (ev.t) {
        case 'saut': for (let i = 0; i < 3; i++) E.particule(0, ev.x, ev.y, (Math.random() - 0.5) * 1.2, -Math.random() * 0.4, 16, 0.01); break
        case 'atterrit': for (let i = 0; i < 4; i++) E.particule(0, ev.x + (i - 1.5) * 2, ev.y, (i - 1.5) * 0.5, -Math.random() * 0.3, 16, 0.01); break
        case 'pièce': E.gerbe(1, ev.x, ev.y, 5, 1.4, 22, 0.04); if (ev.pts) E.texte(ev.x, ev.y - 6, '+' + ev.pts); break
        case 'secret': E.gerbe(1, ev.x, ev.y, 10, 1.8, 30, 0.02); E.texte(ev.x, ev.y - 12, 'SECRET !', 2); E.flash = 6; break
        case 'brique': for (let i = 0; i < 4; i++) E.particule(2, ev.x, ev.y, (i < 2 ? -1 : 1) * (0.6 + Math.random() * 0.8), -2.4 - Math.random() * 1.2, 50, 0.16); E.secousse = E.réduit ? 0 : 2; break
        case 'écrase': E.gerbe(1, ev.x, ev.y + 6, 6, 1.5, 18, 0.05); if (ev.pts) E.texte(ev.x, ev.y - 6, '+' + ev.pts); E.secousse = E.réduit ? 0 : 2; break
        case 'agrandir': E.gerbe(1, ev.x, ev.y, 12, 2, 28, 0.02); E.texte(ev.x, ev.y - 12, 'GRAND !', 1); break
        case 'rapetisse': E.gerbe(1, ev.x, ev.y, 8, 1.6, 22, 0.03); E.secousse = E.réduit ? 0 : 4; E.flash = 4; break
        case 'mort': E.secousse = E.réduit ? 0 : 5; E.gerbe(1, ev.x, ev.y, 10, 2, 30, 0.04); break
        case 'point': E.texte(ev.x, ev.y - 6, 'POINT !', 1); E.gerbe(1, ev.x, ev.y, 6, 1.2, 26, 0.02); break
        case 'vie': E.texte(ev.x, ev.y - 6, '1-UP !', 1); E.gerbe(1, ev.x, ev.y, 12, 2, 30, 0.02); break
        case 'bonus': E.texte(ev.x, ev.y - 6, '+' + ev.pts); break
        case 'victoire_mat': E.flash = 5; break
        case 'résultats': for (let i = 0; i < 40; i++) E.particule(3, 128 + (Math.random() - 0.5) * 200, -4 - Math.random() * 20, (Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.8, 110, 0.01); break
      }
    },
    maj() {
      for (let i = 0; i < NP; i++) { const p = parts[i]; if (!p.on) continue; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.985; if (--p.vie <= 0) p.on = false }
      for (let i = 0; i < NT; i++) { const t = textes[i]; if (!t.on) continue; t.y -= 0.45; if (--t.vie <= 0) t.on = false }
      if (E.secousse > 0) E.secousse = Math.max(0, E.secousse - 0.35)
      if (E.flash > 0) E.flash--
    },
    vider() { for (const p of parts) p.on = false; for (const t of textes) t.on = false; E.secousse = 0; E.flash = 0 },
    parts, textes,
  }
  return E
}
