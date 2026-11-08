// Styles du mode film (bandes noires, caméra, personnages, bulles manga, effets).
export const CSS_FILM = `
.f-ecran { position: fixed; inset: 0; z-index: 1000; background: #000; color: #fff; display: flex; flex-direction: column; overflow: hidden; font-family: system-ui, -apple-system, "Segoe UI", sans-serif }
.f-bande { flex: 0 0 auto; background: #000; position: relative; z-index: 5 }
.f-haut { height: clamp(44px, 8vh, 70px); display: flex; align-items: center; gap: 10px; padding: 0 12px }
.f-bas { min-height: clamp(96px, 17vh, 150px); display: flex; flex-direction: column; justify-content: flex-end; padding: 6px 12px max(10px, env(safe-area-inset-bottom)) }
.f-scene { position: relative; flex: 1; overflow: hidden; background: #111 }
.f-plan { position: absolute; inset: 0; animation: f-ouvre .7s ease-out both }
.f-camera { position: absolute; inset: -4%; }
.f-cam-zoom { animation: f-zoom 10s ease-out both }
.f-cam-travelling { animation: f-travelling 12s ease-in-out both }
.f-cam-tremble { animation: f-tremble .5s ease-in-out 2 }
.f-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%); z-index: 3 }
.f-acteur { position: absolute; bottom: 16%; transform: translateX(-50%); z-index: 2; text-align: center; line-height: 1 }
.f-corps { font-size: clamp(76px, 19vh, 170px); display: inline-block; filter: drop-shadow(0 10px 12px rgba(0,0,0,.35)); animation: f-respire 2.6s ease-in-out infinite }
.f-parle .f-corps { animation: f-parle .45s ease-in-out infinite }
.f-ombre { width: 70%; height: 12px; margin: -6px auto 0; border-radius: 50%; background: rgba(0,0,0,.28); filter: blur(2px) }
.f-nom { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; margin-top: 6px; text-shadow: 0 1px 4px rgba(0,0,0,.7) }
.f-emotion { position: absolute; top: -8%; right: -6%; font-size: clamp(28px, 6vh, 50px); animation: f-pop .45s cubic-bezier(.2,1.6,.4,1) both }
.f-entree-gauche { animation: f-gauche .9s cubic-bezier(.2,.8,.25,1) both }
.f-entree-droite { animation: f-droite .9s cubic-bezier(.2,.8,.25,1) both }
.f-entree-course { animation: f-course .7s cubic-bezier(.3,.9,.3,1) both }
.f-entree-saut { animation: f-saut 1s cubic-bezier(.3,1.4,.5,1) both }
.f-entree-fondu { animation: f-fondu 1s ease-out both }
.f-bulle { position: absolute; z-index: 4; top: 7%; width: min(300px, 78vw); background: #fff; color: #111; border: 3px solid #111; border-radius: 22px; padding: 12px 14px; font-size: clamp(15px, 2.4vh, 19px); line-height: 1.4; font-weight: 600; box-shadow: 4px 5px 0 rgba(0,0,0,.35); animation: f-bulle .35s cubic-bezier(.2,1.5,.4,1) both }
.f-bulle::after { content: ''; position: absolute; bottom: -16px; left: var(--queue, 50%); width: 22px; height: 22px; background: #fff; border-right: 3px solid #111; border-bottom: 3px solid #111; transform: translateX(-50%) rotate(45deg) skew(10deg, 10deg) }
.f-bulle-nom { display: block; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 3px }
.f-sous-titre { text-align: center; font-size: clamp(15px, 2.3vh, 19px); line-height: 1.45; color: #fff; text-shadow: 0 1px 2px #000; max-width: 760px; margin: 0 auto 8px; animation: f-fondu .4s both }
.f-sous-titre em { color: #ffd166; font-style: normal; font-weight: 700 }
.f-vitesse { position: absolute; inset: -30%; z-index: 1; background: repeating-conic-gradient(from 0deg, rgba(255,255,255,0) 0deg 5deg, rgba(255,255,255,.75) 5deg 5.6deg); -webkit-mask: radial-gradient(circle, transparent 22%, #000 62%); mask: radial-gradient(circle, transparent 22%, #000 62%); animation: f-tourne 6s linear infinite, f-fondu .3s both }
.f-flash { position: absolute; inset: 0; background: #fff; z-index: 6; pointer-events: none; animation: f-flash .9s ease-out both }
.f-etoile { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #fff; animation: f-scintille 2.4s ease-in-out infinite }
.f-confetti { position: absolute; top: -8%; z-index: 4; animation: f-tombe 3.4s linear both }
.f-accessoire { position: absolute; z-index: 1; transform: translate(-50%, -50%); font-size: clamp(34px, 7vh, 64px); animation: f-flotte 3.2s ease-in-out infinite }
.f-impact { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 6% }
.f-impact-texte { font-size: clamp(30px, 8.5vw, 74px); font-weight: 900; line-height: 1.05; letter-spacing: .02em; color: #fff; -webkit-text-stroke: 2px #111; text-shadow: 5px 6px 0 #ef476f, 10px 12px 0 rgba(0,0,0,.4); animation: f-coup .6s cubic-bezier(.2,1.6,.4,1) both, f-tremble .35s ease-in-out .6s 2 }
.f-titre-ep { font-size: clamp(13px, 2vh, 16px); letter-spacing: .4em; text-transform: uppercase; color: #ffd166; animation: f-fondu 1s .3s both }
.f-titre { font-size: clamp(34px, 9vw, 80px); font-weight: 900; line-height: 1.02; margin: 10px 0; background: linear-gradient(180deg, #fff, #ffd166); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 6px 18px rgba(255,209,102,.35)); animation: f-coup 1s cubic-bezier(.2,1.2,.4,1) .6s both }
.f-manga { position: absolute; inset: 4% 4% 4%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; z-index: 2 }
.f-case { position: relative; background: #fff; color: #111; border: 4px solid #111; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; box-shadow: 4px 4px 0 rgba(0,0,0,.4); animation: f-case .55s cubic-bezier(.2,1.3,.4,1) both }
.f-case:nth-child(2) { transform: rotate(1deg) } .f-case:nth-child(3) { transform: rotate(-1deg) }
.f-case-fond { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: clamp(60px, 14vh, 120px); opacity: .18 }
.f-case-legende { position: absolute; top: 0; left: 0; right: 0; background: #ffd166; font-size: clamp(11px, 1.6vh, 13px); font-weight: 800; padding: 4px 6px; border-bottom: 3px solid #111; line-height: 1.25 }
.f-case-bulle { position: relative; background: #fff; border: 2px solid #111; border-radius: 14px; padding: 6px 9px; font-size: clamp(12px, 1.8vh, 15px); font-weight: 700; line-height: 1.3; margin-top: 6px; max-width: 95% }
.f-split { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; z-index: 2 }
.f-split > div { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 10px; text-align: center }
.f-split > div:first-child { background: linear-gradient(135deg, #1d4ed8, #0b1d4a); clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%); animation: f-gauche .8s cubic-bezier(.2,.8,.25,1) both }
.f-split > div:last-child { background: linear-gradient(135deg, #b91c1c, #3f0d0d); clip-path: polygon(12% 0, 100% 0, 100% 100%, 0 100%); animation: f-droite .8s cubic-bezier(.2,.8,.25,1) both }
.f-chaine { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 2px; font-size: clamp(28px, 6vh, 50px); margin: 14px 0 }
.f-chaine span { animation: f-pop .45s cubic-bezier(.2,1.6,.4,1) both }
.f-parchemin { position: absolute; inset: 9% 7%; z-index: 2; background: radial-gradient(ellipse at center, #fbf0d0, #e2c48a); color: #3b2a12; border-radius: 10px; box-shadow: 0 20px 50px rgba(0,0,0,.5), inset 0 0 50px rgba(120,80,20,.35); display: flex; flex-direction: column; justify-content: center; padding: 6% 7%; font-family: Georgia, serif; animation: f-deroule 1.1s cubic-bezier(.2,.8,.25,1) both }
.f-chapitre { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: #050505; z-index: 2 }
.f-fin { position: absolute; inset: 0; overflow-y: auto; z-index: 2; padding: 4% 5%; background: radial-gradient(120% 90% at 50% 0%, #3b2f6b, #0b0b16) }
.f-controle { min-width: 44px; min-height: 40px; border-radius: 10px; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.06); color: #fff; font-size: 16px; cursor: pointer; font-family: inherit }
.f-controle[aria-pressed="true"], .f-controle.f-plein { background: #ffd166; color: #111; border-color: #ffd166; font-weight: 800 }
@keyframes f-ouvre { from { opacity: 0 } to { opacity: 1 } }
@keyframes f-zoom { from { transform: scale(1) } to { transform: scale(1.1) } }
@keyframes f-travelling { from { transform: translateX(2.5%) } to { transform: translateX(-2.5%) } }
@keyframes f-tremble { 0%, 100% { transform: none } 25% { transform: translate(-6px, 3px) } 50% { transform: translate(5px, -4px) } 75% { transform: translate(-3px, -2px) } }
@keyframes f-respire { 0%, 100% { transform: translateY(0) scaleY(1) } 50% { transform: translateY(-4px) scaleY(1.02) } }
@keyframes f-parle { 0%, 100% { transform: translateY(0) rotate(0) } 30% { transform: translateY(-7px) rotate(-3deg) } 70% { transform: translateY(-3px) rotate(3deg) } }
@keyframes f-pop { from { opacity: 0; transform: scale(0) } to { opacity: 1; transform: scale(1) } }
@keyframes f-gauche { from { opacity: 0; transform: translateX(-60vw) } to { opacity: 1; transform: translateX(0) } }
@keyframes f-droite { from { opacity: 0; transform: translateX(60vw) } to { opacity: 1; transform: translateX(0) } }
@keyframes f-course { 0% { opacity: 0; transform: translateX(-70vw) skewX(-18deg) } 80% { transform: translateX(3vw) skewX(8deg) } 100% { opacity: 1; transform: none } }
@keyframes f-saut { 0% { opacity: 0; transform: translateY(40vh) } 60% { opacity: 1; transform: translateY(-6vh) } 100% { transform: none } }
@keyframes f-fondu { from { opacity: 0 } to { opacity: 1 } }
@keyframes f-bulle { from { opacity: 0; transform: scale(.4) translateY(20px) } to { opacity: 1; transform: none } }
@keyframes f-tourne { to { transform: rotate(360deg) } }
@keyframes f-flash { 0% { opacity: 0 } 12% { opacity: .95 } 100% { opacity: 0 } }
@keyframes f-scintille { 0%, 100% { opacity: .2 } 50% { opacity: 1 } }
@keyframes f-tombe { from { transform: translateY(0) rotate(0) } to { transform: translateY(115vh) rotate(600deg) } }
@keyframes f-flotte { 0%, 100% { transform: translate(-50%, -50%) } 50% { transform: translate(-50%, calc(-50% - 8px)) } }
@keyframes f-coup { 0% { opacity: 0; transform: scale(2.4) } 60% { opacity: 1; transform: scale(.94) } 100% { transform: scale(1) } }
@keyframes f-case { from { opacity: 0; transform: scale(.6) rotate(-6deg) } to { opacity: 1 } }
@keyframes f-deroule { from { opacity: 0; clip-path: inset(0 0 100% 0) } to { opacity: 1; clip-path: inset(0 0 0 0) } }
@keyframes f-nuage { from { transform: translateX(-20vw) } to { transform: translateX(120vw) } }
@keyframes f-soleil { from { transform: translateY(30px) } to { transform: translateY(0) } }
@keyframes f-kenburns { 0% { transform: scale(1.35) translate(0, 14%) } 50% { transform: scale(1.5) translate(-4%, -10%) } 100% { transform: scale(1) translate(0, 0) } }
@keyframes f-drapeau { 0%, 100% { transform: skewY(0) } 50% { transform: skewY(-6deg) } }
@media (prefers-reduced-motion: reduce) { .f-ecran *, .f-ecran *::after { animation-duration: .01s !important; animation-iteration-count: 1 !important } }
.f-feu { animation: f-feu 3.4s ease-out infinite both; opacity: 0 }
@keyframes f-feu { 0% { opacity: 0; scale: .1 } 8% { opacity: 1 } 45% { opacity: .9; scale: 1 } 70%, 100% { opacity: 0; scale: 1.1 } }
`
