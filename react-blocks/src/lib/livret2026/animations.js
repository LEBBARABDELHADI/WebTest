// Feuille de style des animations du Livret 2026 (injectée une fois).
export const CSS_LIVRET = `
@keyframes l26-monte { from { opacity: 0; transform: translateY(34px) } to { opacity: 1; transform: none } }
@keyframes l26-zoom { from { opacity: 0; transform: scale(.6) } 70% { transform: scale(1.04) } to { opacity: 1; transform: none } }
@keyframes l26-glisse { from { opacity: 0; transform: translateX(60px) } to { opacity: 1; transform: none } }
@keyframes l26-bascule { from { opacity: 0; transform: perspective(900px) rotateX(55deg) } to { opacity: 1; transform: none } }
@keyframes l26-spirale { from { opacity: 0; transform: rotate(-12deg) scale(.7) } to { opacity: 1; transform: none } }
@keyframes l26-rideau { from { opacity: 0; clip-path: inset(0 50% 0 50%) } to { opacity: 1; clip-path: inset(0 0 0 0) } }
@keyframes l26-apparait { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes l26-pop { 0% { opacity: 0; transform: scale(0) } 70% { opacity: 1; transform: scale(1.25) } 100% { opacity: 1; transform: scale(1) } }
@keyframes l26-rebond { 0% { opacity: 0; transform: translateY(-80px) scale(.6) } 55% { opacity: 1; transform: translateY(0) scale(1.1) } 75% { transform: translateY(-14px) } 100% { opacity: 1; transform: none } }
@keyframes l26-glisse-g { from { opacity: 0; transform: translateX(-50px) } to { opacity: 1; transform: none } }
@keyframes l26-glisse-d { from { opacity: 0; transform: translateX(50px) } to { opacity: 1; transform: none } }
@keyframes l26-entre-g { from { opacity: 0; transform: translateX(-110%) } to { opacity: 1; transform: none } }
@keyframes l26-entre-d { from { opacity: 0; transform: translateX(110%) } to { opacity: 1; transform: none } }
@keyframes l26-bulle { from { opacity: 0; transform: scale(.3) } 70% { transform: scale(1.05) } to { opacity: 1; transform: none } }
@keyframes l26-parle { 0%, 100% { transform: none } 25% { transform: rotate(-8deg) } 75% { transform: rotate(8deg) } }
@keyframes l26-trace-v { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes l26-tombe { 0% { opacity: 0; transform: translateY(-60px) } 70% { opacity: 1; transform: translateY(4px) } 100% { opacity: 1; transform: none } }
@keyframes l26-fleau { 0% { transform: rotate(-14deg) } 40% { transform: rotate(10deg) } 70% { transform: rotate(-4deg) } 100% { transform: rotate(0) } }
@keyframes l26-orbite { from { opacity: 0; transform: rotate(-40deg) translateY(-50px) scale(.5) } to { opacity: 1; transform: none } }
@keyframes l26-halo { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,209,102,.45) } 50% { box-shadow: 0 0 0 18px rgba(255,209,102,0) } }
@keyframes l26-onde { 0% { transform: scale(.4); opacity: .6 } 100% { transform: scale(1.8); opacity: 0 } }
@keyframes l26-flotte { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
@keyframes l26-retourne { from { opacity: 0; transform: perspective(700px) rotateY(90deg) } to { opacity: 1; transform: none } }
@keyframes l26-secoue { 0%, 100% { transform: none } 20%, 60% { transform: translateX(-7px) } 40%, 80% { transform: translateX(7px) } }
@keyframes l26-juste { 0% { transform: scale(1) } 50% { transform: scale(1.03) } 100% { transform: scale(1) } }
@keyframes l26-curseur { 50% { opacity: 0 } }
@keyframes l26-trace { to { stroke-dashoffset: 0 } }
@keyframes l26-particule { from { transform: translateY(0) rotate(0) } to { transform: translateY(-120vh) rotate(360deg) } }
@keyframes l26-confetti { from { transform: translateY(-10vh) rotate(0) } to { transform: translateY(110vh) rotate(540deg) } }
@keyframes l26-ouvre-g { from { transform: none } to { transform: translateX(-102%) } }
@keyframes l26-ouvre-d { from { transform: none } to { transform: translateX(102%) } }
@keyframes l26-kenburns { 0% { transform: scale(1) translateY(0); opacity: 1 } 75% { transform: scale(1.5) translateY(14%); opacity: 1 } 100% { transform: scale(1.7) translateY(16%); opacity: 0 } }
@keyframes l26-allume { 0% { box-shadow: inset 0 0 0 0 rgba(255,209,102,0) } 50% { box-shadow: inset 0 0 40px 6px rgba(255,209,102,.35) } 100% { box-shadow: inset 0 0 0 0 rgba(255,209,102,0) } }
@keyframes l26-voyage { from { opacity: 0; transform: translateY(30px) scale(.9) } to { opacity: 1; transform: none } }
.l26-monte, .l26-zoom, .l26-glisse, .l26-bascule, .l26-spirale, .l26-rideau, .l26-apparait, .l26-pop, .l26-rebond, .l26-glisse-g, .l26-glisse-d, .l26-entre-g, .l26-entre-d, .l26-bulle, .l26-tombe, .l26-orbite, .l26-retourne, .l26-voyage { animation-duration: .75s; animation-fill-mode: both; animation-timing-function: cubic-bezier(.2,.8,.25,1) }
.l26-monte { animation-name: l26-monte } .l26-zoom { animation-name: l26-zoom } .l26-glisse { animation-name: l26-glisse } .l26-bascule { animation-name: l26-bascule }
.l26-spirale { animation-name: l26-spirale } .l26-rideau { animation-name: l26-rideau; animation-duration: 1s } .l26-apparait { animation-name: l26-apparait }
.l26-pop { animation-name: l26-pop; animation-duration: .55s } .l26-rebond { animation-name: l26-rebond; animation-duration: 1.1s }
.l26-glisse-g { animation-name: l26-glisse-g } .l26-glisse-d { animation-name: l26-glisse-d } .l26-entre-g { animation-name: l26-entre-g } .l26-entre-d { animation-name: l26-entre-d }
.l26-bulle { animation-name: l26-bulle; animation-duration: .5s; transform-origin: bottom left } .l26-tombe { animation-name: l26-tombe } .l26-orbite { animation-name: l26-orbite; animation-duration: .9s }
.l26-retourne { animation-name: l26-retourne } .l26-voyage { animation-name: l26-voyage; animation-duration: .6s }
.l26-parle { animation: l26-parle .5s ease-in-out 3 both }
.l26-trace-v { animation: l26-trace-v 1.6s ease-out both }
.l26-fleau { animation: l26-fleau 2.2s ease-in-out .3s both }
.l26-halo { animation: l26-zoom .75s both, l26-halo 2.4s ease-in-out .8s infinite }
.l26-onde { animation: l26-onde 1.8s ease-out infinite }
.l26-flotte { animation: l26-pop .55s both, l26-flotte var(--l26-flotte, 4s) ease-in-out 1s infinite }
.l26-curseur { animation: l26-curseur .8s step-end infinite }
.l26-trace-carte { stroke-dasharray: 2400; stroke-dashoffset: 2400; animation: l26-trace 2s ease-out forwards }
.l26-faux { animation: l26-secoue .5s }
.l26-juste { animation: l26-juste .5s }
.l26-decor { animation: l26-apparait 1.5s both }
.l26-masque-lecteur { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0) }
.l26-flux { display: flex; flex-direction: column; align-items: stretch; gap: 6px }
.l26-flux > .l26-fleche { text-align: center; font-size: 22px; color: #ffd166; transform: rotate(90deg) }
.l26-fleche { animation: l26-pop .5s both }
@media (min-width: 760px) {
  .l26-flux { flex-direction: row; align-items: center; flex-wrap: nowrap }
  .l26-flux > div:not(.l26-fleche) { flex: 1 1 0; min-width: 0 }
  .l26-flux > .l26-fleche { transform: none; flex: 0 0 auto }
}
.l26-bouton { min-height: 46px; padding: 0 18px; border-radius: 12px; border: none; background: #ffd166; color: #1b1b1b; font-weight: 800; font-size: 15.5px; cursor: pointer; font-family: inherit }
.l26-bouton-clair { min-height: 40px; padding: 0 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff; font-weight: 700; font-size: 14.5px; cursor: pointer; font-family: inherit }
.l26-bouton:focus-visible, .l26-bouton-clair:focus-visible { outline: 3px solid #fff; outline-offset: 2px }
@media (prefers-reduced-motion: reduce) {
  [class*="l26-"] { animation-duration: .01s !important; animation-iteration-count: 1 !important; animation-delay: 0s !important }
  .l26-trace-carte { stroke-dashoffset: 0 }
}
`
