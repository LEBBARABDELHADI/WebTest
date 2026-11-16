// Exécution réelle des requêtes : jq 1.8 (WebAssembly, jq-wasm) et JMESPath
// (jmespath.js, implémentation de référence). Tout reste local.
import jmespath from 'jmespath'

const maintenant = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
const LIMITE_SORTIE = 8 * 1024 * 1024

// Messages d'erreur jq : on retire le préfixe technique, on garde le reste.
function erreurJq(stderr, code) {
  const texte = (stderr || '').trim()
  const lignes = texte.split('\n').filter(l => !/^jq: \d+ compile errors?$/.test(l))
  let message = lignes.join('\n').replace(/^jq: error(?: \(at [^)]*\))?: /, '').replace(/^jq: /, '')
  if (!message) message = `jq s'est arrêté avec le code ${code}`
  const syntaxe = /syntax error|compile error|unexpected/i.test(texte)
  return { message, type: syntaxe ? 'syntaxe' : 'exécution', code }
}

// jq : texteEntrée = JSON tel que saisi (nombres exacts conservés).
export function exécuterJq(jq, texteEntrée, requête) {
  const t0 = maintenant()
  if (!requête || !requête.trim()) return { ok: false, erreur: { message: 'Requête vide.', type: 'syntaxe' }, durée: 0 }
  let r
  try {
    r = jq.raw(texteEntrée, requête, ['-c'])
  } catch (e) {
    return { ok: false, erreur: { message: `Échec de l'exécution de jq : ${e.message}`, type: 'interne' }, durée: maintenant() - t0 }
  }
  const durée = maintenant() - t0
  if (r.exitCode !== 0 && r.stderr) return { ok: false, erreur: erreurJq(r.stderr, r.exitCode), durée }
  const texte = r.stdout || ''
  if (texte.length > LIMITE_SORTIE) return { ok: false, erreur: { message: `Résultat trop volumineux (${Math.round(texte.length / 1048576)} Mo).`, type: 'exécution' }, durée }
  const lignes = texte.split('\n').filter(l => l.length)
  const sorties = []
  try {
    for (const l of lignes) sorties.push(JSON.parse(l))
  } catch (e) {
    return { ok: false, erreur: { message: `Sortie jq illisible : ${e.message}`, type: 'interne' }, durée }
  }
  return { ok: true, sorties, textes: lignes, avertissement: r.stderr ? r.stderr.trim() : null, durée }
}

function erreurJmes(e) {
  const m = String(e?.message || e)
  if (e?.name === 'ParserError' || /Invalid token|Expected|Unexpected token|Unknown token|Unclosed/i.test(m)) return { message: `Syntaxe JMESPath invalide : ${m}`, type: 'syntaxe' }
  if (/Unknown function/i.test(m)) return { message: `Fonction inconnue : ${m.replace(/^Unknown function:\s*/i, '')} (JMESPath standard)`, type: 'syntaxe' }
  if (/TypeError/i.test(m)) return { message: `Type invalide : ${m.replace(/^TypeError:\s*/i, '')}`, type: 'exécution' }
  if (/ArgumentError|expected at least|takes \d+ arguments/i.test(m)) return { message: `Arguments invalides : ${m}`, type: 'syntaxe' }
  return { message: m, type: 'exécution' }
}

export function compilerJmes(requête) {
  try { return { ok: true, ast: jmespath.compile(requête) } } catch (e) { return { ok: false, erreur: erreurJmes(e) } }
}

// JMESPath : valeur = JSON déjà lu.
export function exécuterJmes(valeur, requête) {
  const t0 = maintenant()
  if (!requête || !requête.trim()) return { ok: false, erreur: { message: 'Requête vide.', type: 'syntaxe' }, durée: 0 }
  try {
    const résultat = jmespath.search(valeur, requête)
    return { ok: true, valeur: résultat === undefined ? null : résultat, durée: maintenant() - t0 }
  } catch (e) {
    return { ok: false, erreur: erreurJmes(e), durée: maintenant() - t0 }
  }
}

export const tokeniserJmes = requête => jmespath.tokenize(requête)
