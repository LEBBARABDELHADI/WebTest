// Testeur d'analyse de logs : expression régulière (groupes nommés) ou règles
// grok au format Datadog, appliquées ligne par ligne.

const échapper = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

// Format de date Java (Datadog) → regex approximative.
function dateVersRegex(format) {
  const jetons = [['yyyy', '\\d{4}'], ['yy', '\\d{2}'], ['MMMM', '[A-Za-zéû]+'], ['MMM', '[A-Za-z]{3}'], ['MM', '\\d{2}'], ['M', '\\d{1,2}'], ['dd', '\\d{2}'], ['d', '\\d{1,2}'], ['HH', '\\d{2}'], ['H', '\\d{1,2}'], ['hh', '\\d{2}'], ['h', '\\d{1,2}'], ['mm', '\\d{2}'], ['ss', '\\d{2}'], ['SSSSSS', '\\d{6}'], ['SSS', '\\d{3}'], ['SS', '\\d{2}'], ['S', '\\d'], ['EEEE', '[A-Za-z]+'], ['EEE', '[A-Za-z]{3}'], ['a', '(?:AM|PM)'], ['XXX', '(?:Z|[+-]\\d{2}:\\d{2})'], ['Z', '(?:Z|[+-]\\d{4})'], ['z', '[A-Z]{2,5}']]
  let r = '', i = 0
  while (i < format.length) {
    if (format[i] === '\'') { const fin = format.indexOf('\'', i + 1); r += échapper(format.slice(i + 1, fin < 0 ? undefined : fin)); i = fin < 0 ? format.length : fin + 1; continue }
    const j = jetons.find(([t]) => format.startsWith(t, i))
    if (j) { r += j[1]; i += j[0].length } else { r += échapper(format[i]); i++ }
  }
  return r
}

const MATCHERS = {
  word: '\\b\\w+\\b', notSpace: '\\S+', data: '.*?', integer: '[+-]?\\d+', integerStr: '[+-]?\\d+', integerExt: '[+-]?\\d+(?:[eE][+-]?\\d+)?',
  number: '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)', numberStr: '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)', numberExt: '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?',
  boolean: '(?:true|false)', doubleQuotedString: '"(?:[^"\\\\]|\\\\.)*"', singleQuotedString: '\'(?:[^\'\\\\]|\\\\.)*\'', quotedString: '(?:"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')',
  uuid: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', mac: '(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}',
  ipv4: '(?:\\d{1,3}\\.){3}\\d{1,3}', ipv6: '[0-9a-fA-F:]*:[0-9a-fA-F:.]+', ip: '(?:(?:\\d{1,3}\\.){3}\\d{1,3}|[0-9a-fA-F:]*:[0-9a-fA-F:.]+)',
  hostname: '[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*', ipOrHost: '(?:(?:\\d{1,3}\\.){3}\\d{1,3}|[A-Za-z0-9.-]+)', port: '\\d{1,5}',
}
const NUMÉRIQUES = new Set(['integer', 'integerExt', 'number', 'numberExt'])

// Une règle Datadog : « nom motif » ; le motif doit couvrir toute la ligne.
export function grokVersRegex(motif) {
  const champs = []
  let erreur = ''
  const source = motif.replace(/%\{(\w+)(?:\(("(?:[^"\\]|\\.)*")\))?(?::([\w.@-]+))?(?::([\w]+(?:\([^)]*\))?))?\}/g, (m, matcher, param, nom, filtre) => {
    let r
    if (matcher === 'date') r = dateVersRegex(param ? JSON.parse(param) : 'yyyy-MM-dd HH:mm:ss')
    else if (matcher === 'regex') r = param ? JSON.parse(param) : '.*?'
    else if (MATCHERS[matcher]) r = MATCHERS[matcher]
    else { erreur = erreur || `Matcher inconnu ou règle d'aide non prise en charge : %{${matcher}}`; r = '.*?' }
    if (!nom) return `(?:${r})`
    const groupe = `g${champs.length}`
    champs.push({ groupe, nom, matcher, filtre: filtre || '' })
    return `(?<${groupe}>${r})`
  })
  return { source: `^${source}$`, champs, erreur }
}

const affecter = (obj, chemin, valeur) => { const p = chemin.split('.'); let o = obj; p.slice(0, -1).forEach(k => { o = o[k] = o[k] && typeof o[k] === 'object' ? o[k] : {} }); o[p.at(-1)] = valeur }
function convertir(valeur, c) {
  if (NUMÉRIQUES.has(c.matcher) || /^(integer|number)$/.test(c.filtre)) { const n = Number(valeur); return Number.isNaN(n) ? valeur : n }
  if (c.matcher === 'boolean' || c.filtre === 'boolean') return valeur === 'true'
  if (/Quoted|quoted/.test(c.matcher)) return valeur.slice(1, -1)
  if (c.filtre === 'json') { try { return JSON.parse(valeur) } catch { return valeur } }
  if (c.filtre === 'keyvalue') return Object.fromEntries([...valeur.matchAll(/([\w.-]+)=("[^"]*"|\S+)/g)].map(m => [m[1], m[2].replace(/^"|"$/g, '')]))
  if (c.filtre === 'lowercase') return valeur.toLowerCase()
  if (c.filtre === 'uppercase') return valeur.toUpperCase()
  return valeur
}

export function testerLogs({ mode, motif, drapeaux = '', logs }) {
  const lignes = (logs || '').split('\n').filter(l => l.trim())
  if (!motif.trim() || !lignes.length) return null
  let règles
  try {
    if (mode === 'regex') règles = [{ nom: 'regex', re: new RegExp(motif, drapeaux.replace(/[^imsu]/g, '')), champs: null }]
    else {
      règles = motif.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => {
        const m = l.match(/^(\S+)\s+(.+)$/)
        if (!m) throw new Error(`Règle sans nom : « ${l} » (format : nom_regle motif)`)
        const g = grokVersRegex(m[2])
        if (g.erreur) throw new Error(g.erreur)
        return { nom: m[1], re: new RegExp(g.source), champs: g.champs }
      })
    }
  } catch (e) { return { erreur: e.message } }
  const résultats = lignes.map(ligne => {
    for (const r of règles) {
      const m = ligne.match(r.re)
      if (!m) continue
      let champs = {}
      if (r.champs) r.champs.forEach(c => { const v = m.groups?.[c.groupe]; if (v !== undefined) affecter(champs, c.nom, convertir(v, c)) })
      else champs = m.groups ? { ...m.groups } : Object.fromEntries(m.slice(1).map((v, i) => [`groupe ${i + 1}`, v]))
      return { ligne, ok: true, règle: r.nom, champs }
    }
    return { ligne, ok: false }
  })
  // Valeurs les plus fréquentes par champ (champs de premier niveau, texte court).
  const fréquences = {}
  résultats.filter(r => r.ok).forEach(r => Object.entries(r.champs).forEach(([k, v]) => { if (typeof v === 'object' || String(v).length > 40) return; (fréquences[k] ||= {})[v] = (fréquences[k][v] || 0) + 1 }))
  const tops = Object.entries(fréquences).map(([k, vs]) => ({ champ: k, distincts: Object.keys(vs).length, valeurs: Object.entries(vs).sort((p, q) => q[1] - p[1]).slice(0, 5) })).filter(x => x.distincts <= 10 && (x.distincts < x.valeurs.reduce((t, v) => t + v[1], 0) || x.distincts === 1))
  return { résultats, reconnues: résultats.filter(r => r.ok).length, total: résultats.length, tops }
}

export const EXEMPLES_LOGS = {
  logs: `2026-11-02 08:15:02 INFO  api 200 GET /health 3ms user=alice
2026-11-02 08:15:07 ERROR api 500 POST /orders 812ms user=bob
2026-11-02 08:15:09 WARN  worker 429 GET /quota 15ms user=alice
2026-11-02 08:16:00 INFO  api 201 POST /orders 45ms user=carol
ligne inattendue sans format`,
  grok: `ma_regle %{date("yyyy-MM-dd HH:mm:ss"):timestamp} %{word:level}\\s+%{word:service} %{integer:http.status_code} %{word:http.method} %{notSpace:http.url} %{integer:duration}ms %{data:attrs:keyvalue}`,
  regex: '^(?<date>\\S+ \\S+) (?<niveau>\\w+)\\s+(?<service>\\w+) (?<statut>\\d{3})',
}
