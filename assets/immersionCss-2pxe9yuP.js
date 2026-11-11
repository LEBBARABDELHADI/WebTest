var e=`#ffd166`,t=`#f5f1e6`,n=`Georgia, "Times New Roman", serif`,r=`
.im-ecran { position: fixed; inset: 0; z-index: 1000; background: #07090f; color: ${t}; display: flex; flex-direction: column; overflow: hidden; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent }
.im-ecran button { font-family: inherit }
.im-defile { flex: 1; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch }
.im-bouton { min-height: 44px; padding: 0 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,.24); background: rgba(255,255,255,.06); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-align: center; line-height: 1.2 }
.im-bouton:hover { background: rgba(255,255,255,.12) }
.im-bouton:focus-visible, .im-ecran [tabindex]:focus-visible { outline: 3px solid ${e}; outline-offset: 2px }
.im-bouton.im-plein, .im-bouton[aria-pressed="true"] { background: ${e}; color: #15110a; border-color: ${e} }
.im-bouton.im-plein:hover { background: #ffdd8a }
.im-bouton:disabled { opacity: .45; cursor: not-allowed }
.im-rond { min-width: 44px; padding: 0; border-radius: 22px }
.im-carte { background: rgba(14,18,30,.88); border: 1px solid rgba(255,255,255,.12); border-radius: 18px; padding: clamp(12px, 2.2vw, 18px); box-shadow: 0 18px 40px rgba(0,0,0,.45) }
.im-etiquette { font-size: 11.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase }
.im-page { display: inline-flex; align-items: center; min-height: 0; min-width: 0; padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(255,209,102,.45); color: ${e}; background: transparent; font-size: 11.5px; font-weight: 700; cursor: pointer; white-space: nowrap; vertical-align: middle }
.im-page:hover { background: rgba(255,209,102,.12) }
.im-ligne { transition: opacity .5s ease, transform .5s ease, color .5s ease }
.im-ligne-future { opacity: .28 }
.im-ligne-passee { opacity: .72 }
.im-ligne-actuelle { opacity: 1 }
.im-ligne-cachee { opacity: 0; transform: translateY(10px) }
.im-fondu { animation: im-fondu .8s ease both }
.im-monte { animation: im-monte .7s cubic-bezier(.2,.9,.3,1) both }
.im-titre-film { font-family: ${n}; font-weight: 700; line-height: 1.04; letter-spacing: .01em; text-shadow: 0 6px 30px rgba(0,0,0,.65); animation: im-titre 1.2s cubic-bezier(.2,.9,.3,1) .25s both }
.im-annee { font-family: ${n}; font-weight: 700; line-height: 1; animation: im-annee 1.1s cubic-bezier(.2,1.1,.3,1) both; text-shadow: 0 8px 40px rgba(0,0,0,.7) }
.im-lent { animation: im-lent 16s ease-in-out both }
.im-trace { stroke-dasharray: 1; stroke-dashoffset: 1; animation: im-trace 3.6s ease-in-out .5s forwards }
.im-trace-court { stroke-dasharray: 1; stroke-dashoffset: 1; animation: im-trace 1.6s ease-in-out .8s forwards }
.im-pouls { transform-box: fill-box; transform-origin: center; animation: im-pouls 1.8s ease-out infinite }
.im-apparait { animation: im-fondu .9s ease .35s both }
.im-lettrage { position: absolute; left: 0; right: 0; height: clamp(10px, 4vh, 44px); background: #000; z-index: 6; pointer-events: none }
.im-grain { position: absolute; inset: 0; pointer-events: none; z-index: 5; opacity: .06; background-image: radial-gradient(rgba(255,255,255,.7) 1px, transparent 1px); background-size: 3px 3px; mix-blend-mode: overlay }
.im-vignette { position: absolute; inset: 0; pointer-events: none; z-index: 4; background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.6) 100%) }
.im-lueur { animation: im-lueur 2.4s ease-in-out infinite }
.im-segment { flex: 1; height: 5px; min-width: 0; min-height: 0; padding: 0; border: none; border-radius: 3px; cursor: pointer }
.im-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }
.im-puce { flex-shrink: 0; min-height: 36px; min-width: 0; padding: 0 12px; border-radius: 18px; border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.05); color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; white-space: nowrap }
.im-puce[aria-pressed="true"] { background: ${e}; color: #15110a; border-color: ${e} }
.im-option { width: 100%; text-align: left; min-height: 48px; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.05); color: #fff; font-size: 15.5px; cursor: pointer; line-height: 1.35 }
.im-option:hover:not(:disabled) { background: rgba(255,255,255,.1) }
.im-option:disabled { cursor: default }
.im-saisie { width: 100%; min-height: 70px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.35); color: #fff; font-size: 15.5px; font-family: inherit; resize: vertical; box-sizing: border-box }
.im-saisie:focus { outline: 2px solid ${e}; border-color: transparent }
.im-episode { position: relative; text-align: left; border-radius: 16px; padding: 14px; min-height: 118px; border: 1px solid rgba(255,255,255,.14); color: #fff; cursor: pointer; overflow: hidden; display: flex; flex-direction: column; gap: 4px; width: 100% }
.im-episode:disabled { cursor: not-allowed }
.im-episode:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0,0,0,.5) }
.im-episode { transition: transform .2s ease, box-shadow .2s ease }
.im-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 10px }
@keyframes im-fondu { from { opacity: 0 } to { opacity: 1 } }
@keyframes im-monte { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
@keyframes im-titre { from { opacity: 0; letter-spacing: .25em; filter: blur(6px) } to { opacity: 1; letter-spacing: .01em; filter: none } }
@keyframes im-annee { 0% { opacity: 0; transform: scale(1.5) } 60% { opacity: 1; transform: scale(.97) } 100% { transform: none } }
@keyframes im-lent { from { transform: scale(1.08) } to { transform: scale(1) } }
@keyframes im-trace { to { stroke-dashoffset: 0 } }
@keyframes im-pouls { 0% { opacity: .85; transform: scale(1) } 100% { opacity: 0; transform: scale(3.2) } }
@keyframes im-lueur { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,209,102,.0) } 50% { box-shadow: 0 0 0 6px rgba(255,209,102,.18) } }
@keyframes im-defile-frise { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@media (prefers-reduced-motion: reduce) {
  .im-ecran *, .im-ecran *::before, .im-ecran *::after { animation-duration: .01s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; transition-duration: .01s !important }
  .im-trace, .im-trace-court { stroke-dashoffset: 0 }
}
`;export{n as i,r as n,e as r,t};