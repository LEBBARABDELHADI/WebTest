// Lecture du JSON saisi : validation avec message précis (ligne, colonne,
// cause probable en français), documents multiples (flux JSON), mise en forme
// qui conserve l'écriture exacte des nombres et des chaînes, coloration.

const ESPACES = new Set([' ', '\t', '\n', '\r'])

// Ligne et colonne (à partir de 1) d'une position dans le texte.
export function positionTexte(texte, pos) {
  let ligne = 1, début = 0
  for (let i = 0; i < pos && i < texte.length; i++) if (texte[i] === '\n') { ligne++; début = i + 1 }
  return { ligne, colonne: pos - début + 1 }
}

class ErreurJson extends Error {
  constructor(message, position) { super(message); this.position = position }
}

const nomCaractère = c => (c === undefined ? 'la fin du texte' : c === '\n' ? 'un retour à la ligne' : c === '\t' ? 'une tabulation' : `« ${c} »`)

// Analyseur exact (même grammaire que JSON.parse) qui produit les valeurs et
// des erreurs explicites. Accepte plusieurs documents à la suite (flux).
function analyseur(texte) {
  let i = 0
  const n = texte.length
  const blancs = () => {
    while (i < n) {
      const c = texte[i]
      if (ESPACES.has(c)) { i++; continue }
      if (c === '/' && (texte[i + 1] === '/' || texte[i + 1] === '*')) throw new ErreurJson('Les commentaires ne sont pas autorisés en JSON : supprimez « // » ou « /* … */ ».', i)
      if (c === '#') throw new ErreurJson('Les commentaires « # » ne sont pas autorisés en JSON.', i)
      break
    }
  }
  const attendu = (quoi, fermant) => {
    const c = texte[i]
    if (c === undefined) throw new ErreurJson(`Fin du texte inattendue : ${quoi}${fermant ? ` (il manque probablement « ${fermant} »)` : ''}.`, i)
    if (c === "'") throw new ErreurJson('Les chaînes JSON s\'écrivent entre guillemets doubles " ", pas entre apostrophes.', i)
    throw new ErreurJson(`${quoi[0].toUpperCase()}${quoi.slice(1)}, mais ${nomCaractère(c)} trouvé.`, i)
  }
  const chaîne = () => {
    const début = i
    i++
    let morceaux = '', depuis = i
    while (true) {
      if (i >= n) throw new ErreurJson('Chaîne non terminée : il manque le guillemet " de fin.', début)
      const c = texte[i]
      if (c === '"') { morceaux += texte.slice(depuis, i); i++; return morceaux }
      if (c === '\\') {
        morceaux += texte.slice(depuis, i)
        const e = texte[i + 1]
        const simples = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }
        if (e in simples) { morceaux += simples[e]; i += 2 } else if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(texte.slice(i + 2, i + 6))) {
          morceaux += String.fromCharCode(parseInt(texte.slice(i + 2, i + 6), 16)); i += 6
        } else throw new ErreurJson(`Séquence d'échappement invalide « \\${e ?? ''} » dans une chaîne (permises : \\" \\\\ \\/ \\b \\f \\n \\r \\t \\uXXXX).`, i)
        depuis = i
        continue
      }
      if (c < ' ') throw new ErreurJson(c === '\n' ? 'Retour à la ligne dans une chaîne : il manque sans doute le guillemet " de fin (ou écrivez \\n).' : 'Caractère de contrôle non échappé dans une chaîne.', i)
      i++
    }
  }
  const nombre = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(texte.slice(i, i + 400))
    if (!m || !m[0] || m[0] === '-') throw new ErreurJson('Nombre invalide.', i)
    const suivant = texte[i + m[0].length]
    if (suivant !== undefined && /[0-9.eE+\-xXa-zA-Z]/.test(suivant)) {
      if (m[1] === '0' && /\d/.test(suivant)) throw new ErreurJson('Les nombres JSON ne commencent pas par 0 (ex. 07 → 7, ou "07" en chaîne).', i)
      throw new ErreurJson('Nombre invalide.', i)
    }
    i += m[0].length
    return Number(m[0])
  }
  const valeur = profondeur => {
    if (profondeur > 2000) throw new ErreurJson('Imbrication trop profonde.', i)
    blancs()
    const c = texte[i]
    if (c === '{') {
      const ouverture = i
      i++
      const obj = {}
      blancs()
      if (texte[i] === '}') { i++; return obj }
      while (true) {
        blancs()
        if (texte[i] === '}') throw new ErreurJson('Virgule en trop avant « } ».', i - 1)
        if (texte[i] !== '"') {
          if (texte[i] !== undefined && /[A-Za-z_$]/.test(texte[i])) throw new ErreurJson('Les clés doivent être entre guillemets doubles : "clé": valeur.', i)
          attendu('clé entre guillemets doubles attendue', i >= n ? '}' : null)
        }
        const k = chaîne()
        blancs()
        if (texte[i] !== ':') attendu('deux-points « : » attendus après la clé')
        i++
        const v = valeur(profondeur + 1)
        if (k === '__proto__') Object.defineProperty(obj, k, { value: v, enumerable: true, writable: true, configurable: true })
        else obj[k] = v
        blancs()
        if (texte[i] === ',') { i++; continue }
        if (texte[i] === '}') { i++; return obj }
        if (texte[i] === '"') throw new ErreurJson('Virgule manquante entre deux propriétés.', i)
        if (texte[i] === undefined) throw new ErreurJson(`Fin du texte inattendue : il manque « } » pour fermer l'objet ouvert ligne ${positionTexte(texte, ouverture).ligne}.`, i)
        attendu('virgule ou « } » attendue après la valeur')
      }
    }
    if (c === '[') {
      const ouverture = i
      i++
      const tab = []
      blancs()
      if (texte[i] === ']') { i++; return tab }
      while (true) {
        blancs()
        if (texte[i] === ']') throw new ErreurJson('Virgule en trop avant « ] ».', i - 1)
        tab.push(valeur(profondeur + 1))
        blancs()
        if (texte[i] === ',') { i++; continue }
        if (texte[i] === ']') { i++; return tab }
        if (texte[i] === undefined) throw new ErreurJson(`Fin du texte inattendue : il manque « ] » pour fermer le tableau ouvert ligne ${positionTexte(texte, ouverture).ligne}.`, i)
        if ('"{[-0123456789tfn'.includes(texte[i])) throw new ErreurJson('Virgule manquante entre deux éléments du tableau.', i)
        attendu('virgule ou « ] » attendue après l\'élément')
      }
    }
    if (c === '"') return chaîne()
    if (c === '-' || (c >= '0' && c <= '9')) return nombre()
    for (const [mot, v] of [['true', true], ['false', false], ['null', null]]) {
      if (texte.startsWith(mot, i)) { i += mot.length; return v }
    }
    if (c !== undefined) {
      const mot = /^[A-Za-z_]+/.exec(texte.slice(i, i + 20))?.[0]
      if (mot && ['NaN', 'Infinity', 'undefined'].includes(mot)) throw new ErreurJson(`${mot} n'est pas une valeur JSON (utilisez null ou un nombre).`, i)
      if (mot && ['True', 'False', 'None', 'TRUE', 'FALSE', 'NULL', 'Null'].includes(mot)) throw new ErreurJson(`« ${mot} » n'est pas une valeur JSON : écrivez true, false ou null en minuscules.`, i)
      if (mot) throw new ErreurJson(`Valeur inattendue « ${mot} » : les chaînes s'écrivent entre guillemets doubles.`, i)
    }
    if (c === '}' || c === ']') throw new ErreurJson(`${nomCaractère(c)} inattendu : valeur manquante.`, i)
    return attendu('valeur attendue')
  }
  return {
    flux() {
      const valeurs = []
      blancs()
      if (i >= n) throw new ErreurJson('Le texte est vide.', 0)
      while (i < n) {
        valeurs.push(valeur(0))
        blancs()
        if (texte[i] === ',') {
          // « {…}, {…} » : éléments sans tableau englobant.
          throw new ErreurJson('Plusieurs valeurs séparées par des virgules : entourez-les de [ ] pour former un tableau.', i)
        }
      }
      return valeurs
    },
  }
}

// Valide un texte JSON. Résultat : { ok, valeur } ; { ok:false, multiple:true,
// valeurs } pour plusieurs documents (JSON Lines) ; { ok:false, erreur }.
export function analyserJson(texte) {
  const brut = texte ?? ''
  if (!brut.trim()) return { ok: false, vide: true, erreur: { message: 'Le texte est vide.', position: 0, ligne: 1, colonne: 1 } }
  try {
    return { ok: true, valeur: JSON.parse(brut) }
  } catch {
    try {
      const valeurs = analyseur(brut).flux()
      if (valeurs.length === 1) return { ok: true, valeur: valeurs[0] }
      return { ok: false, multiple: true, valeurs, erreur: { message: `${valeurs.length} documents JSON à la suite (format JSON Lines) : un seul document est attendu. Vous pouvez les réunir dans un tableau (comme jq -s).`, position: 0, ligne: 1, colonne: 1 } }
    } catch (e) {
      if (!(e instanceof ErreurJson)) throw e
      const p = positionTexte(brut, e.position)
      return { ok: false, erreur: { message: e.message, position: e.position, ...p } }
    }
  }
}

// Plusieurs documents JSON (sortie de jq sans -s, sortie attendue « flux »).
export function analyserFlux(texte) {
  try {
    return { ok: true, valeurs: analyseur(texte ?? '').flux() }
  } catch (e) {
    if (!(e instanceof ErreurJson)) throw e
    return { ok: false, erreur: { message: e.message, position: e.position, ...positionTexte(texte, e.position) } }
  }
}

// ---- Découpage en jetons (coloration, mise en forme) ---------------------

// Jetons : { t, d, f } avec t ∈ ouvrant, fermant, virgule, deuxpoints, clé,
// chaîne, nombre, littéral, espace, erreur. Tolérant : continue après une erreur.
export function jetonsJson(texte) {
  const jetons = []
  const n = texte.length
  let i = 0
  while (i < n) {
    const c = texte[i]
    const d = i
    if (ESPACES.has(c)) {
      while (i < n && ESPACES.has(texte[i])) i++
      jetons.push({ t: 'espace', d, f: i })
    } else if (c === '{' || c === '[') { i++; jetons.push({ t: 'ouvrant', d, f: i }) } else if (c === '}' || c === ']') { i++; jetons.push({ t: 'fermant', d, f: i }) } else if (c === ',') { i++; jetons.push({ t: 'virgule', d, f: i }) } else if (c === ':') { i++; jetons.push({ t: 'deuxpoints', d, f: i }) } else if (c === '"') {
      i++
      while (i < n && texte[i] !== '"' && texte[i] !== '\n') i += texte[i] === '\\' ? 2 : 1
      const fermé = texte[i] === '"'
      if (fermé) i++
      jetons.push({ t: fermé ? 'chaîne' : 'erreur', d, f: Math.min(i, n) })
    } else if (c === '-' || (c >= '0' && c <= '9')) {
      const m = /^-?\d*(\.\d*)?([eE][+-]?\d*)?/.exec(texte.slice(i, i + 400))
      i += Math.max(1, m[0].length)
      jetons.push({ t: 'nombre', d, f: i })
    } else if (/[A-Za-z_]/.test(c)) {
      while (i < n && /[A-Za-z0-9_]/.test(texte[i])) i++
      const mot = texte.slice(d, i)
      jetons.push({ t: mot === 'true' || mot === 'false' || mot === 'null' ? 'littéral' : 'erreur', d, f: i })
    } else { i++; jetons.push({ t: 'erreur', d, f: i }) }
  }
  // Une chaîne suivie de « : » est une clé.
  for (let k = 0; k < jetons.length; k++) {
    if (jetons[k].t !== 'chaîne') continue
    let s = k + 1
    while (s < jetons.length && jetons[s].t === 'espace') s++
    if (jetons[s]?.t === 'deuxpoints') jetons[k].t = 'clé'
  }
  return jetons
}

// Segments colorés { t, texte } couvrant tout le texte.
export function colorerJson(texte) {
  return jetonsJson(texte).map(j => ({ t: j.t, texte: texte.slice(j.d, j.f) }))
}

// Mise en forme à partir des jetons : conserve exactement nombres et chaînes.
// Renvoie null si le texte n'est pas du JSON valide (ou plusieurs documents).
export function formaterJson(texte, indentation = 2) {
  const a = analyserJson(texte)
  if (!a.ok && !a.multiple) return null
  const jetons = jetonsJson(texte).filter(j => j.t !== 'espace')
  const pas = typeof indentation === 'number' ? ' '.repeat(indentation) : indentation
  let sortie = '', niveau = 0
  const saut = () => (pas ? `\n${pas.repeat(niveau)}` : '')
  for (let k = 0; k < jetons.length; k++) {
    const j = jetons[k]
    const t = texte.slice(j.d, j.f)
    // Documents successifs (flux) : un par ligne.
    if (niveau === 0 && sortie && j.t !== 'fermant' && j.t !== 'virgule' && j.t !== 'deuxpoints') sortie += '\n'
    if (j.t === 'ouvrant') {
      const suivant = jetons[k + 1]
      if (suivant?.t === 'fermant') { sortie += t + texte.slice(suivant.d, suivant.f); k++; continue }
      niveau++
      sortie += t + saut()
    } else if (j.t === 'fermant') {
      niveau--
      sortie += saut() + t
    } else if (j.t === 'virgule') sortie += t + saut()
    else if (j.t === 'deuxpoints') sortie += pas ? ': ' : ':'
    else sortie += t
  }
  return sortie
}

export const minifierJson = texte => formaterJson(texte, '')

// Taille lisible d'un texte.
export function tailleTexte(texte) {
  const o = new Blob([texte ?? '']).size
  return o < 1024 ? `${o} o` : o < 1024 * 1024 ? `${(o / 1024).toFixed(o < 10240 ? 1 : 0)} Ko` : `${(o / 1048576).toFixed(1)} Mo`
}

// Résultat attendu : JSON, plusieurs documents (flux), ou lignes de texte brut (jq -r).
export function lireAttendu(texte) {
  const t = (texte ?? '').trim()
  if (!t) return { ok: false, vide: true, erreur: { message: 'Aucun résultat attendu.' } }
  const a = analyserJson(t)
  if (a.ok) return { ok: true, valeur: a.valeur, flux: false, brut: false }
  if (a.multiple) return { ok: true, valeur: { __flux: true, valeurs: a.valeurs }, flux: true, brut: false }
  if (!/^[[{"\d-]|^(true|false|null)\b/.test(t)) {
    const lignes = t.split('\n').map(l => l.trim()).filter(Boolean)
    return { ok: true, valeur: lignes.length === 1 ? lignes[0] : { __flux: true, valeurs: lignes }, flux: lignes.length > 1, brut: true }
  }
  return { ok: false, erreur: a.erreur }
}
