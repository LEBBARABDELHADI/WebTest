// Mode film : un épisode par page (films/p14.js…), chargé seulement à l'ouverture.
const modules = import.meta.glob('./p*.js')
export const PAGES_FILM = new Set(Object.keys(modules).map(k => Number(k.match(/p(\d+)\.js$/)[1])))
export const chargerFilm = async n => (await modules[`./p${n}.js`]?.())?.FILM || null
