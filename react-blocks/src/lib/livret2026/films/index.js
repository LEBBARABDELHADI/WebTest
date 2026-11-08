// Mode film : un épisode par page de contenu. Certains sont écrits à la main
// (films/p6.js, p7.js…) ; les autres sont construits à partir du contenu de la
// page (films/auto.js). Tout est chargé seulement à l'ouverture.
import { PAGES_CONTENU, PAGE } from '../index'

const écrits = import.meta.glob('./p*.js')
const voix = import.meta.glob('./voixFilm*.js')
const PAGES_ÉCRITES = new Set(Object.keys(écrits).map(k => Number(k.match(/p(\d+)\.js$/)[1])))
export const PAGES_FILM = new Set([...PAGES_ÉCRITES, ...PAGES_CONTENU.map(p => p.page)])
export const suivanteDe = n => PAGES_CONTENU.find(p => p.page > n)?.page || null

export async function chargerFilm(n) {
  if (PAGES_ÉCRITES.has(n)) return (await écrits[`./p${n}.js`]())?.FILM || null
  const page = PAGE.get(n)
  if (page?.type !== 'contenu') return null
  const [{ construireFilm }, v] = await Promise.all([import('./auto.js'), voix[`./voixFilm${n}.js`]?.()])
  return construireFilm(page, { voix: v?.[`VOIX_FILM${n}`] || null, suivante: suivanteDe(n) })
}
