// Banc de comparaison avec les vrais moteurs d'expressions régulières : pour un
// motif écrit dans un dialecte, on interroge le moteur réel (grep -E, grep -P,
// Python re, Go regexp/RE2) sur une liste de chaînes et on rapporte ses verdicts.
// Les outils absents sont simplement signalés comme indisponibles.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const env = { ...process.env, LC_ALL: 'C', LANG: 'C' }
let dossier = null
const tmp = () => (dossier ??= mkdtempSync(join(tmpdir(), 'regexgen-')))

const dispo = {}
function existe(cmd, args = ['--version']) {
  if (cmd in dispo) return dispo[cmd]
  const r = spawnSync(cmd, args, { env, encoding: 'utf8' })
  return (dispo[cmd] = !r.error && r.status === 0)
}

export const outilsDisponibles = () => ({
  grepE: existe('grep'),
  grepP: existe('grep') && spawnSync('grep', ['-P', 'a', '/dev/null'], { env }).status !== 2,
  python: existe('python3'),
  go: existe('go', ['version']),
})

// Verdicts de grep : un booléen par chaîne (grep travaille ligne par ligne : pas de saut de ligne dans les chaînes).
function grep(mode, pattern, insensible, chaînes) {
  const fichier = join(tmp(), `g-${mode}.txt`)
  writeFileSync(fichier, `${chaînes.join('\n')}\n`)
  const r = spawnSync('grep', [`-${mode}`, '-n', ...(insensible ? ['-i'] : []), '-e', pattern, fichier], { env, encoding: 'utf8' })
  if (r.status === 2) return { erreur: r.stderr.trim() }
  const trouvées = new Set(r.stdout.split('\n').filter(Boolean).map(l => Number(l.slice(0, l.indexOf(':')))))
  return { verdicts: chaînes.map((_, i) => trouvées.has(i + 1)) }
}

const PYTHON = `
import json, re, sys
cas = json.load(open(sys.argv[1]))
sortie = {}
for c in cas:
    f = 0
    if 'i' in c['flags']: f |= re.IGNORECASE
    if 'm' in c['flags']: f |= re.MULTILINE
    if 's' in c['flags']: f |= re.DOTALL
    try:
        r = re.compile(c['pattern'], f)
        sortie[c['id']] = [r.search(s) is not None for s in c['chaines']]
    except Exception as e:
        sortie[c['id']] = 'ERR: ' + str(e)
print(json.dumps(sortie))
`

const GO = `package main

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
)

type Cas struct {
	Id      string   \`json:"id"\`
	Pattern string   \`json:"pattern"\`
	Chaines []string \`json:"chaines"\`
}

func main() {
	data, _ := os.ReadFile(os.Args[1])
	var cas []Cas
	json.Unmarshal(data, &cas)
	sortie := map[string]any{}
	for _, c := range cas {
		re, err := regexp.Compile(c.Pattern)
		if err != nil {
			sortie[c.Id] = "ERR: " + err.Error()
			continue
		}
		res := make([]bool, len(c.Chaines))
		for i, s := range c.Chaines {
			res[i] = re.MatchString(s)
		}
		sortie[c.Id] = res
	}
	b, _ := json.Marshal(sortie)
	fmt.Println(string(b))
}
`

function exécuterLot(moteur, cas) {
  const dir = tmp()
  const fichier = join(dir, `${moteur}-cas.json`)
  writeFileSync(fichier, JSON.stringify(cas))
  let r
  if (moteur === 'python') {
    const script = join(dir, 'h.py')
    writeFileSync(script, PYTHON)
    r = spawnSync('python3', ['-I', script, fichier], { env, encoding: 'utf8', maxBuffer: 1 << 28 })
  } else {
    const src = join(dir, 'h.go')
    writeFileSync(src, GO)
    r = spawnSync('go', ['run', src, fichier], { env: { ...env, GOCACHE: join(dir, 'gocache'), GOPATH: join(dir, 'gopath'), GO111MODULE: 'off' }, encoding: 'utf8', maxBuffer: 1 << 28 })
  }
  if (r.status !== 0) throw new Error(`${moteur} : ${r.stderr}`)
  return JSON.parse(r.stdout)
}

// cas : [{ id, dialecte, pattern, flags, chaines }] → { id: { verdicts } | { erreur } }
export function interroger(cas) {
  const sortie = {}
  const parMoteur = { python: [], go: [] }
  for (const c of cas) {
    const insensible = c.flags.includes('i')
    if (c.dialecte === 'ere') sortie[c.id] = grep('E', c.pattern, insensible, c.chaines)
    else if (c.dialecte === 'pcre') sortie[c.id] = grep('P', c.pattern, insensible, c.chaines)
    else if (c.dialecte === 'python') parMoteur.python.push({ id: c.id, pattern: c.pattern, flags: c.flags, chaines: c.chaines })
    else if (c.dialecte === 'go') parMoteur.go.push({ id: c.id, pattern: `${c.flags.includes('i') || c.flags.includes('s') || c.flags.includes('m') ? `(?${[...c.flags].filter(f => 'ims'.includes(f)).join('')})` : ''}${c.pattern}`, flags: c.flags, chaines: c.chaines })
  }
  for (const [moteur, lot] of Object.entries(parMoteur)) {
    if (!lot.length) continue
    const r = exécuterLot(moteur, lot)
    for (const c of lot) sortie[c.id] = typeof r[c.id] === 'string' ? { erreur: r[c.id] } : { verdicts: r[c.id] }
  }
  return sortie
}
