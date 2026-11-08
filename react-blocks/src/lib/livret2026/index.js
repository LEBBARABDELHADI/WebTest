// Livret du citoyen, édition mai 2026 : tout le contenu animé, réuni depuis
// les fichiers de chaque partie (partie1.js … partie5.js, annexes.js).
const modules = import.meta.glob(['./partie*.js', './annexes.js'], { eager: true })
const parties = Object.values(modules).map(m => m.PARTIE).filter(Boolean)

// Périodes de la frise : celles du chapitre d'histoire (p. 37–48) font foi ;
// les dates des autres parties sont rangées dans la même période par année.
const PÉRIODES = [
  [475, 'Préhistoire et Antiquité'], [1491, 'Moyen Âge'], [1788, 'Ancien Régime'], [1791, 'Révolution française'],
  [1803, 'Première République'], [1814, 'Premier Empire'], [1847, 'Restauration et Monarchie de Juillet'], [1851, 'Deuxième République'],
  [1869, 'Second Empire'], [1939, 'Troisième République'], [1943, 'Régime de Vichy'], [1945, 'Gouvernement provisoire (GRPF)'],
  [1957, 'Quatrième République'], [Infinity, 'Cinquième République'],
]
const périodeDe = année => PÉRIODES.find(([fin]) => année <= fin)[1]
const histoire = new Set(PÉRIODES.map(p => p[1]))
const friseDe = p => (p.frise || []).map(f => (f.page >= 37 && f.page <= 48 && histoire.has(f.période) ? f : { ...f, période: périodeDe(f.année) }))

export const PAGES = parties.flatMap(p => p.pages || []).sort((a, b) => a.page - b.page)
export const PAGE = new Map(PAGES.map(p => [p.page, p]))
export const LEÇONS = parties.flatMap(p => p.leçons || []).sort((a, b) => a.pages[0] - b.pages[0])
export const MAISON = parties.flatMap(p => p.maison || [])
const vues = new Set()
export const FRISE = parties.flatMap(friseDe).sort((a, b) => a.année - b.année || a.page - b.page)
  .filter(f => { const k = `${f.année}|${f.titre.toLowerCase()}`; if (vues.has(k)) return false; vues.add(k); return true })
export const SITUATIONS = parties.flatMap(p => p.situations || [])
export const INSTITUTIONS = parties.find(p => p.institutions)?.institutions || null
export const PAGES_CONTENU = PAGES.filter(p => p.type === 'contenu')
export const NB_PAGES = 83

// Cartes Mémoriser d'une page : identifiants fixes (jamais de doublon).
export const PAQUET_ID = 'l26-paquet'
export const PAQUET_NOM = '🇫🇷 Livret du citoyen 2026'
export const cartesDePage = p => (p.questions || []).map((q, i) => ({ id: `l26-p${p.page}-q${i}`, recto: q.q, verso: `${q.r}\n\n📖 Livret du citoyen, page ${p.page}`, page: p.page }))
export const leçonDePage = n => LEÇONS.find(l => l.pages.includes(n))
