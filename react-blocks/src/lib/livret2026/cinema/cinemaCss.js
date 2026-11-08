// Styles du court-métrage (prototypes pages 6, 7, 8, 10 et 11).
export const CSS_CINÉMA = `
.c-ecran { position: fixed; inset: 0; z-index: 1000; background: #000; color: #fff; display: flex; flex-direction: column; overflow: hidden; font-family: system-ui, -apple-system, "Segoe UI", sans-serif }
.c-scene { position: relative; flex: 1; overflow: hidden; background: #05050a }
.c-couche { position: absolute; inset: -5%; will-change: transform, filter; transition: transform 2.2s cubic-bezier(.45,.05,.25,1), filter 1.4s ease }
.c-perso-boite { position: absolute; bottom: 0; transform: translateX(-50%); transition: transform 1.4s cubic-bezier(.3,.8,.3,1), filter .6s; }
.c-perso-boite.c-entre { animation: c-entre 1.1s cubic-bezier(.2,.8,.25,1) both }
.c-perso-boite.c-silence { filter: brightness(.86) saturate(.92) }
.c-respire { animation: c-respire 3.6s ease-in-out infinite; transform-origin: 120px 320px }
.c-parle .c-tete { animation: c-hoche 1.6s ease-in-out infinite; transform-origin: 120px 180px }
.c-tete { animation: c-tete 7s ease-in-out infinite; transform-origin: 120px 180px }
.c-yeux { animation: c-cligne 4.8s infinite; transform-origin: 120px 126px }
.c-geste { animation: c-geste .7s cubic-bezier(.2,1.3,.4,1) both; transform-origin: 170px 320px }
.c-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.62) 100%) }
.c-grain { position: absolute; inset: -50%; pointer-events: none; opacity: .07; background-image: radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px); background-size: 3px 3px; animation: c-grain 1.2s steps(6) infinite }
.c-fuite { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; background: radial-gradient(circle at 12% 18%, rgba(255,170,90,.28), transparent 45%), radial-gradient(circle at 92% 8%, rgba(255,230,180,.16), transparent 40%); animation: c-fuite 9s ease-in-out infinite alternate }
.c-bande { position: absolute; left: 0; right: 0; height: clamp(18px, 5.5vh, 60px); background: #000; z-index: 8; pointer-events: none }
.c-sous-titre { max-width: 900px; margin: 0 auto; text-align: center; font-size: var(--c-taille, clamp(16px, 2.3vw, 22px)); line-height: 1.45; text-shadow: 0 2px 3px #000, 0 0 12px rgba(0,0,0,.9); animation: c-fondu .35s both }
.c-officiel { position: absolute; z-index: 9; left: 50%; bottom: clamp(16px, 4vh, 44px); transform: translateX(-50%); width: min(92%, 760px); background: #fbf7ee; color: #1b1b2a; border-radius: 12px; padding: clamp(12px, 2vw, 18px) clamp(14px, 2.4vw, 22px) clamp(12px, 2vw, 18px) clamp(18px, 3vw, 28px); box-shadow: 0 22px 60px rgba(0,0,0,.6); animation: c-carte .6s cubic-bezier(.2,.9,.25,1) both; overflow: hidden }
.c-officiel::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 8px; background: linear-gradient(#2563eb 33%, #fff 33% 66%, #dc2626 66%) }
.c-btn { min-width: 44px; min-height: 42px; padding: 0 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.07); color: #fff; font-size: 15px; cursor: pointer; font-family: inherit }
.c-btn[aria-pressed="true"], .c-btn.c-plein { background: #ffd166; color: #111; border-color: #ffd166; font-weight: 800 }
.c-btn:focus-visible { outline: 3px solid #fff; outline-offset: 2px }
.c-transition { position: absolute; inset: 0; z-index: 20; pointer-events: none }
.c-tr-fondu { background: #000; animation: c-tr-fondu 1.2s ease-in-out both }
.c-tr-lumiere { background: radial-gradient(circle, #fff7e0, #ffd59a 40%, rgba(255,213,154,0) 75%); animation: c-tr-lumiere 1.2s ease-in-out both }
.c-tr-iris { background: #000; animation: c-tr-iris 1.2s ease-in-out both }
.c-tr-volet { background: linear-gradient(90deg, #000 45%, rgba(0,0,0,.6) 55%, transparent 65%); background-size: 260% 100%; animation: c-tr-volet 1.2s ease-in-out both }
.c-tr-flou { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); background: rgba(0,0,0,.35); animation: c-tr-fondu 1.2s ease-in-out both }
.c-poussiere { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: rgba(255,236,190,.75); box-shadow: 0 0 6px rgba(255,236,190,.9); animation: c-flotte linear infinite }
.c-feuille { position: absolute; top: -6%; width: 14px; height: 8px; border-radius: 8px 0; animation: c-feuille linear infinite }
.c-goutte { position: absolute; top: -10%; width: 2px; height: 22px; background: linear-gradient(transparent, rgba(190,215,255,.75)); animation: c-pluie linear infinite }
.c-scintille { animation: c-scintille 2.6s ease-in-out infinite }
.c-nuage { animation: c-nuage linear infinite alternate }
.c-fenetre { animation: c-fenetre 5s ease-in-out infinite }
.c-rayons { animation: c-rayons 7s ease-in-out infinite; transform-origin: 800px 200px }
.c-livre-brille { filter: drop-shadow(0 0 18px rgba(255,209,102,.95)); animation: c-brille 2.4s ease-in-out infinite }
.c-vague { animation: c-vague 4s ease-in-out infinite }
.c-palmier { animation: c-palmier 5s ease-in-out infinite; transform-origin: 0 260px }
.c-flamme { animation: c-flamme .9s ease-in-out infinite alternate; transform-origin: 0 -90px }
.c-bougie-lum { animation: c-bougie 2.6s ease-in-out infinite }
.c-neutre { animation: c-tourne 18s linear infinite; transform-origin: 0 560px }
.c-trace { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: c-trace 1.6s ease-out forwards }
.c-apparait { animation: c-fondu-monte .8s ease-out both }
.c-bloc { animation: c-bloc .6s cubic-bezier(.2,1.4,.4,1) both }
.c-sommet { animation: c-sommet 1.2s cubic-bezier(.2,1.2,.3,1) both; transform-origin: 450px 250px }
.c-monte { animation: c-monte .9s cubic-bezier(.2,1.1,.3,1) both }
.c-cadre { stroke-dasharray: 2800; stroke-dashoffset: 2800; animation: c-trace 2s ease-out forwards }
.c-titre-carton { animation: c-titre-carton 1.4s cubic-bezier(.2,.9,.25,1) both }
.c-calendrier { animation: c-calendrier 1s cubic-bezier(.2,1.3,.4,1) both }
.c-journal { animation: c-journal 1s cubic-bezier(.2,1,.3,1) both }
.c-bulletin { display: inline-block; animation: c-bulletin 1.6s ease-in-out infinite }
.c-lanterne { animation: c-balance 4s ease-in-out infinite; transform-origin: 50% 0 }
.c-deroule { animation: c-deroule 1.2s cubic-bezier(.2,.8,.25,1) both }
.c-plume { animation: c-plume 3.2s steps(40) both }
.c-mot-pilule { text-align: center; padding: clamp(6px, 1.2vw, 12px) 8px; border-radius: 40px; background: rgba(18,14,36,.78); border: 2px solid rgba(255,255,255,.25); color: #fff3c4; animation: c-mot .8s cubic-bezier(.2,1.3,.4,1) both; backdrop-filter: blur(4px) }
.c-drapeau-6 { animation: c-drapeau 2.4s ease-in-out infinite; transform-origin: 803px 32px }
.c-jet { animation: c-jet 1.8s ease-in-out infinite }
.c-livre { animation: c-livre 3s ease-in-out infinite; transform-origin: 0 -26px }
.c-note { animation: c-note 2.6s ease-in-out infinite }
.c-onde-son { animation: c-onde 1.1s ease-out infinite }
.c-zzz { animation: c-zzz 3s ease-in-out infinite }
.c-fleau-6 { animation: c-fleau 2.2s cubic-bezier(.3,1.4,.5,1) both }
.c-fete-6 { animation: c-fete 1.2s steps(3) infinite }
.c-drapeau-8 { animation: c-drapeau-8 2.8s ease-in-out infinite; transform-origin: 0 0 }
.c-feu { animation: c-feu 3.2s ease-out infinite both; transform-box: fill-box; transform-origin: center; opacity: 0 }
.c-impact-6 { animation: c-impact .7s cubic-bezier(.2,1.6,.4,1) both }
@keyframes c-drapeau { 0%, 100% { transform: skewY(0) scaleX(1) } 50% { transform: skewY(-4deg) scaleX(.94) } }
@keyframes c-jet { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes c-livre { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(-4deg) } }
@keyframes c-note { 0% { opacity: 0; transform: translate(0, 10px) } 30% { opacity: 1 } 100% { opacity: 0; transform: translate(22px, -46px) } }
@keyframes c-onde { 0% { opacity: 0; transform: translateX(-10px) } 40% { opacity: 1 } 100% { opacity: 0; transform: translateX(30px) } }
@keyframes c-zzz { 0%, 100% { opacity: .35; transform: translateY(0) } 50% { opacity: .9; transform: translateY(-8px) } }
@keyframes c-fleau { 0% { transform: rotate(-9deg) } 55% { transform: rotate(3deg) } 80% { transform: rotate(-1deg) } 100% { transform: rotate(0) } }
@keyframes c-impact { 0% { opacity: 0; transform: scale(2.4); filter: blur(6px) } 100% { opacity: 1; transform: none; filter: none } }
@keyframes c-fete { 0% { fill: #ff5fa2 } 33% { fill: #7c5cff } 66% { fill: #2ee6c8 } 100% { fill: #ff5fa2 } }
@keyframes c-drapeau-8 { 0%, 100% { transform: skewY(0) scaleX(1) } 30% { transform: skewY(3deg) scaleX(.96) } 65% { transform: skewY(-2.5deg) scaleX(.93) } }
@keyframes c-feu { 0% { opacity: 0; transform: scale(.1) } 8% { opacity: 1 } 45% { opacity: .9; transform: scale(1) } 70%, 100% { opacity: 0; transform: scale(1.12) } }
@keyframes c-kenburns { from { transform: scale(1.02) translateY(0) } to { transform: scale(1.12) translateY(-3%) } }
@keyframes c-entre { from { opacity: 0; transform: translateX(-50%) translateY(30px) scale(.96) } to { opacity: 1 } }
@keyframes c-respire { 0%, 100% { transform: translateY(0) scaleY(1) } 50% { transform: translateY(-2px) scaleY(1.008) } }
@keyframes c-tete { 0%, 100% { transform: rotate(0) } 30% { transform: rotate(1.4deg) } 70% { transform: rotate(-1deg) } }
@keyframes c-hoche { 0%, 100% { transform: rotate(0) translateY(0) } 25% { transform: rotate(-1.5deg) translateY(1px) } 60% { transform: rotate(1.6deg) translateY(-1px) } }
@keyframes c-cligne { 0%, 92%, 100% { transform: scaleY(1) } 94% { transform: scaleY(.08) } 96% { transform: scaleY(1) } }
@keyframes c-geste { from { opacity: 0; transform: translateY(60px) rotate(8deg) } to { opacity: 1; transform: none } }
@keyframes c-grain { 0% { transform: translate(0, 0) } 20% { transform: translate(-3%, 2%) } 40% { transform: translate(2%, -3%) } 60% { transform: translate(-1%, 3%) } 80% { transform: translate(3%, 1%) } 100% { transform: translate(0, 0) } }
@keyframes c-fuite { from { opacity: .6 } to { opacity: 1 } }
@keyframes c-fondu { from { opacity: 0 } to { opacity: 1 } }
@keyframes c-fondu-monte { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes c-carte { from { opacity: 0; transform: translateX(-50%) translateY(30px) rotate(-1.5deg) } to { opacity: 1; transform: translateX(-50%) } }
@keyframes c-tr-fondu { 0% { opacity: 0 } 45%, 55% { opacity: 1 } 100% { opacity: 0 } }
@keyframes c-tr-lumiere { 0% { opacity: 0; transform: scale(.4) } 45%, 55% { opacity: 1; transform: scale(2.6) } 100% { opacity: 0; transform: scale(3) } }
@keyframes c-tr-iris { 0% { clip-path: circle(0% at 50% 50%) } 45%, 55% { clip-path: circle(80% at 50% 50%); opacity: 1 } 100% { clip-path: circle(80% at 50% 50%); opacity: 0 } }
@keyframes c-tr-volet { 0% { background-position: 100% 0 } 50% { background-position: 0 0 } 100% { background-position: -100% 0; opacity: 0 } }
@keyframes c-flotte { 0% { transform: translate(0, 0); opacity: 0 } 15% { opacity: .9 } 85% { opacity: .7 } 100% { transform: translate(40px, -120px); opacity: 0 } }
@keyframes c-feuille { 0% { transform: translate(0, 0) rotate(0) } 100% { transform: translate(-120px, 115vh) rotate(720deg) } }
@keyframes c-pluie { from { transform: translate(0, 0) } to { transform: translate(-30px, 120vh) } }
@keyframes c-scintille { 0%, 100% { opacity: .25 } 50% { opacity: 1 } }
@keyframes c-nuage { from { transform: translateX(-60px) } to { transform: translateX(60px) } }
@keyframes c-fenetre { 0%, 100% { opacity: 1 } 50% { opacity: .82 } }
@keyframes c-rayons { 0%, 100% { opacity: .65; transform: skewX(0) } 50% { opacity: 1; transform: skewX(-3deg) } }
@keyframes c-brille { 0%, 100% { filter: drop-shadow(0 0 10px rgba(255,209,102,.6)) } 50% { filter: drop-shadow(0 0 26px rgba(255,209,102,1)) } }
@keyframes c-vague { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(-24px) } }
@keyframes c-palmier { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(-2.2deg) } }
@keyframes c-flamme { from { transform: scaleY(1) skewX(0) } to { transform: scaleY(1.12) skewX(4deg) } }
@keyframes c-bougie { 0%, 100% { opacity: .85 } 40% { opacity: 1 } 60% { opacity: .75 } }
@keyframes c-tourne { to { transform: rotate(360deg) } }
@keyframes c-trace { to { stroke-dashoffset: 0 } }
@keyframes c-bloc { from { opacity: 0; transform: translateY(-80px) } to { opacity: 1; transform: none } }
@keyframes c-sommet { 0% { opacity: 0; transform: translateY(-120px) scale(.8) } 70% { opacity: 1; transform: translateY(6px) scale(1.03) } 100% { transform: none } }
@keyframes c-monte { from { opacity: 0; transform: translateY(80px) } to { opacity: 1; transform: none } }
@keyframes c-titre-carton { from { opacity: 0; letter-spacing: .3em; filter: blur(8px) } to { opacity: 1; letter-spacing: 0; filter: none } }
@keyframes c-calendrier { from { opacity: 0; transform: rotateX(80deg) } to { opacity: 1; transform: none } }
@keyframes c-journal { 0% { opacity: 0; transform: rotate(-200deg) scale(.1) } 100% { opacity: 1; transform: rotate(-3deg) scale(1) } }
@keyframes c-bulletin { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes c-balance { 0%, 100% { transform: rotate(-2deg) } 50% { transform: rotate(2deg) } }
@keyframes c-deroule { from { opacity: 0; clip-path: inset(0 0 100% 0) } to { opacity: 1; clip-path: inset(0 0 0 0) } }
@keyframes c-plume { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes c-mot { from { opacity: 0; transform: translateY(40px) scale(.7) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .c-ecran *, .c-ecran *::before { animation-duration: .01s !important; animation-iteration-count: 1 !important; transition-duration: .01s !important } }
`
