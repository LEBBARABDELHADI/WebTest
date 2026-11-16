// Tests du moteur Query Generator : génération (exemple, description FR/EN,
// guidée), exécution réelle par jq 1.8 (WebAssembly) et jmespath.js,
// vérification, différences et corrections.
//   npm run test:querygen
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadJq } from 'jq-wasm'
import { créerMoteur, lireAttendu } from '../../src/lib/querygen/moteur.js'
import { analyserJson, formaterJson } from '../../src/lib/querygen/json.js'
import { EC2, PODS, EBS, UTILISATEURS, FORMULAIRE } from '../../src/lib/querygen/exemples.js'

const jq = await loadJq()
const moteur = créerMoteur(jq)
const texte = v => JSON.stringify(v, null, 2)
const exemple = (entrée, attendu, comparaison = 'exact') => moteur.générer({ texteEntrée: texte(entrée), mode: 'exemple', texteAttendu: typeof attendu === 'string' ? attendu : JSON.stringify(attendu), comparaison })
const décrire = (entrée, description) => moteur.générer({ texteEntrée: texte(entrée), mode: 'description', description })
const premier = r => { assert.ok(r.ok, r.erreur); assert.ok(r.candidats.length, `aucun candidat : ${(r.raisons || []).join(' / ')}`); return r.candidats[0] }

// Exemple EC2 du cahier des charges : requêtes attendues mot pour mot.
const EC2_SPEC = { Reservations: [{ Instances: [{ InstanceId: 'i-123', InstanceType: 't3.medium', State: { Name: 'running' } }, { InstanceId: 'i-456', InstanceType: 't3.micro', State: { Name: 'stopped' } }] }] }
const JQ_EC2 = '[.Reservations[].Instances[] | select(.State.Name == "running") | {id: .InstanceId, type: .InstanceType}]'
const JMES_EC2 = "Reservations[].Instances[?State.Name=='running'].{id: InstanceId, type: InstanceType}[]"

test('EC2 par l\'exemple : les deux requêtes du cahier des charges, exécutées et vérifiées', () => {
  const c = premier(exemple(EC2_SPEC, [{ id: 'i-123', type: 't3.medium' }]))
  assert.equal(c.jq.requête, JQ_EC2)
  assert.equal(c.jmespath.requête, JMES_EC2)
  assert.equal(c.jq.statut, 'vérifiée')
  assert.equal(c.jmespath.statut, 'vérifiée')
  assert.equal(c.concordance, true)
})

test('EC2 décrit en français et en anglais : mêmes requêtes, résultat cohérent', () => {
  for (const d of ['Retourner les instances EC2 en état running avec leur ID et leur type', 'Get running EC2 instances with their ID and type']) {
    const r = décrire(EC2_SPEC, d)
    const c = premier(r)
    assert.equal(c.jq.requête, JQ_EC2, d)
    assert.equal(c.jmespath.requête, JMES_EC2, d)
    assert.equal(c.jq.statut, 'conforme')
    assert.equal(c.jmespath.statut, 'conforme')
    assert.deepEqual(JSON.parse(c.jq.texte), [{ id: 'i-123', type: 't3.medium' }])
  }
  assert.equal(décrire(EC2_SPEC, 'Retourner les instances EC2 en état running').langue, 'fr')
  assert.equal(décrire(EC2_SPEC, 'Get running EC2 instances with their ID and type').langue, 'en')
})

test('Pods kubectl Running avec nom, namespace et IP (tableaux et objets imbriqués)', () => {
  const c = premier(décrire(PODS, 'Récupérer les noms, namespaces et IP des pods Running'))
  assert.equal(c.jq.requête, '[.items[] | select(.status.phase == "Running") | {name: .metadata.name, namespace: .metadata.namespace, ip: .status.podIP}]')
  assert.equal(c.jmespath.requête, "items[?status.phase=='Running'].{name: metadata.name, namespace: metadata.namespace, ip: status.podIP}")
  assert.equal(c.jq.statut, 'conforme')
  assert.equal(c.jmespath.statut, 'conforme')
  assert.equal(JSON.parse(c.jq.texte).length, 3)
  const ids = premier(décrire(PODS, 'Récupérer les noms et identifiants des pods'))
  assert.equal(ids.jq.requête, '[.items[] | {name: .metadata.name, id: .metadata.uid}]')
})

test('Nombre de volumes EBS disponibles (agrégat), par description et par l\'exemple', () => {
  const c = premier(décrire(EBS, 'Combien de volumes EBS sont disponibles ?'))
  assert.equal(c.jq.requête, '[.Volumes[] | select(.State == "available")] | length')
  assert.equal(c.jmespath.requête, "length(Volumes[?State=='available'])")
  assert.equal(c.jq.texte, '3')
  assert.equal(c.jmespath.texte, '3')
  // « 3 » seul est ambigu (3 volumes available, 3 in-use) : c'est signalé.
  const r = exemple(EBS, 3)
  assert.ok(r.ambigu)
  assert.ok(r.messages.some(m => /Plusieurs interprétations/.test(m.texte)))
  assert.ok(r.candidats.every(x => x.jq.statut === 'vérifiée'))
})

test('« Je souhaite avoir la valeur de la clé champs » : chemin exact + variante récursive jq', () => {
  const c = premier(décrire(FORMULAIRE, 'Je souhaite avoir la valeur de la clé champs'))
  assert.equal(c.jq.requête, '.formulaire.champs')
  assert.equal(c.jmespath.requête, 'formulaire.champs')
  assert.equal(c.jq.statut, 'conforme')
  assert.equal(c.alternatives[0].requête, 'first(.. | objects | select(has("champs")) | .champs)')
  assert.equal(c.alternatives[0].statut, 'conforme')
  // Clé absente : explication, pas de requête inventée.
  const r = décrire(FORMULAIRE, 'valeur de la clé couleur')
  assert.equal(r.candidats.length, 0)
  assert.match(r.raisons[0], /Aucune clé « couleur »/)
})

test('Objets imbriqués : projection personnalisée imbriquée retrouvée par l\'exemple', () => {
  const attendu = [{ id: 'i-0a1b2c3d4e5f60003', details: { type: 'm5.large', zone: 'eu-west-3b' } }]
  const c = premier(exemple(EC2, attendu))
  assert.match(c.jq.requête, /details: \{type: \.InstanceType, zone: \.Placement\.AvailabilityZone\}/)
  assert.equal(c.jq.statut, 'vérifiée')
  assert.equal(c.jmespath.statut, 'vérifiée')
})

test('Plusieurs filtres (conjonction) : description et exemple', () => {
  const c = premier(décrire(EC2, 'instances running de type t3.medium'))
  assert.match(c.jq.requête, /select\((\.State\.Name == "running" and \.InstanceType == "t3\.medium"|\.InstanceType == "t3\.medium" and \.State\.Name == "running")\)/)
  assert.match(c.jmespath.requête, /State\.Name=='running' && InstanceType=='t3\.medium'|InstanceType=='t3\.medium' && State\.Name=='running'/)
  assert.equal(c.jq.statut, 'conforme')
  // Jeu où une seule condition ne suffit pas : couleur ET taille.
  const articles = { articles: [{ n: 'a', couleur: 'rouge', taille: 'L' }, { n: 'b', couleur: 'rouge', taille: 'M' }, { n: 'c', couleur: 'bleu', taille: 'L' }, { n: 'd', couleur: 'rouge', taille: 'L' }, { n: 'e', couleur: 'vert', taille: 'S' }] }
  const r = premier(exemple(articles, ['a', 'd']))
  assert.equal(r.plan.filtre.type, 'et')
  assert.equal(r.jq.statut, 'vérifiée')
  assert.equal(r.jmespath.statut, 'vérifiée')
  assert.match(r.jmespath.requête, /&&/)
})

test('Champs absents ou null : jq et JMESPath alignés (values, map(&…), objets avec null)', () => {
  // Objets : null conservé des deux côtés.
  const a = premier(décrire(UTILISATEURS, 'Afficher les utilisateurs actifs et leurs adresses email'))
  assert.equal(a.jq.requête, '[.[] | select(.active) | {name, email}]')
  assert.equal(a.jmespath.requête, '[?active].{name: name, email: email}')
  assert.deepEqual(JSON.parse(a.jmespath.texte).map(u => u.email), ['alice.martin@example.com', null, null])
  assert.equal(a.concordance, true)
  // Liste simple : null écartés (values en jq ; la projection JMESPath les écarte d'elle-même).
  const b = premier(décrire(EC2, 'IP publiques des instances'))
  assert.equal(b.jq.requête, '[.Reservations[].Instances[].PublicIpAddress | values]')
  assert.equal(b.jmespath.requête, 'Reservations[].Instances[].PublicIpAddress')
  assert.equal(b.concordance, true)
  // Attendu avec null : JMESPath doit utiliser map(&…) pour les garder.
  const c = premier(exemple(EC2, ['203.0.113.10', null, '198.51.100.8', null]))
  assert.equal(c.jmespath.requête, 'map(&PublicIpAddress, Reservations[].Instances[])')
  assert.equal(c.jmespath.statut, 'vérifiée')
  assert.equal(c.jq.statut, 'vérifiée')
})

test('Résultat vide : exécuté, conforme, et expliqué (pas une erreur)', () => {
  const r = décrire(EC2, 'instances terminated')
  const c = premier(r)
  assert.equal(c.jq.texte, '[]')
  assert.equal(c.jmespath.texte, '[]')
  assert.equal(c.jq.statut, 'conforme')
  assert.ok(c.hypothèses.some(h => /résultat sera vide|Résultat vide/.test(h)))
  // Attendu vide seul : ambigu, pas de requête devinée.
  const v = exemple(EBS, [])
  assert.equal(v.candidats.length, 0)
  assert.match(v.raisons[0], /tableau vide/)
})

test('Agrégations : somme, moyenne, maximum, regroupements (objet et liste)', () => {
  const s = premier(décrire(EBS, 'Total size of unencrypted volumes'))
  assert.equal(s.jq.requête, '[.Volumes[] | select(.Encrypted == false) | .Size] | add')
  assert.equal(s.jmespath.requête, 'sum(Volumes[?Encrypted==`false`].Size)')
  assert.equal(s.jq.texte, '120')
  const m = premier(décrire(EBS, 'taille moyenne des volumes gp3'))
  assert.equal(m.jq.texte, '46')
  assert.equal(m.jmespath.texte, '46')
  const g = premier(décrire(PODS, 'Nombre de pods par phase'))
  assert.equal(g.jq.requête, '.items | group_by(.status.phase) | map({key: .[0].status.phase, value: length}) | from_entries')
  assert.deepEqual(JSON.parse(g.jq.texte), { Pending: 1, Running: 3, Succeeded: 1 })
  assert.equal(g.jmespath.statut, 'conforme')
  assert.equal(g.jmespath.dépendDesDonnées, true)
  const l = premier(exemple(PODS, [{ phase: 'Pending', count: 1 }, { phase: 'Running', count: 3 }, { phase: 'Succeeded', count: 1 }]))
  assert.equal(l.jq.requête, '.items | group_by(.status.phase) | map({phase: .[0].status.phase, count: length})')
  assert.equal(l.jq.statut, 'vérifiée')
  assert.equal(l.jmespath.statut, 'vérifiée')
  const t = premier(décrire(EBS, 'les 3 plus gros volumes'))
  assert.equal(t.jq.requête, '.Volumes | sort_by(.Size) | reverse | .[:3]')
  assert.equal(t.jmespath.requête, 'reverse(sort_by(Volumes, &Size))[:3]')
  const d = premier(décrire(EC2, "l'instance la plus récente"))
  assert.equal(d.jmespath.requête, 'sort_by(Reservations[].Instances[], &LaunchTime)[-1]')
  assert.equal(d.concordance, true)
})

test('Limites de JMESPath expliquées au lieu d\'inventer (unique)', () => {
  const c = premier(décrire(EBS, 'types de volumes distincts'))
  assert.equal(c.jq.requête, '[.Volumes[].VolumeType] | unique')
  assert.equal(c.jq.statut, 'conforme')
  assert.equal(c.jmespath.statut, 'impossible')
  assert.match(c.jmespath.raison, /doublons/)
})

test('Champ demandé introuvable : explication, aucune requête', () => {
  const r = décrire(UTILISATEURS, 'utilisateurs avec leur téléphone')
  assert.equal(r.candidats.length, 0)
  assert.match(r.raisons[0], /Aucun champ ne correspond à « téléphone »/)
})

test('Attendu ≠ obtenu : différences détaillées et correction exécutée avant d\'être proposée', () => {
  const entrée = texte(EBS)
  const attendu = JSON.stringify([{ id: 'vol-0a1b2c3d4e5f00002', size: 100 }, { id: 'vol-0a1b2c3d4e5f00003', size: 500 }, { id: 'vol-0a1b2c3d4e5f00005', size: 250 }])
  // Filtre oublié.
  const r = moteur.exécuterRequête({ langage: 'jq', requête: '[.Volumes[] | {id: .VolumeId, size: .Size}]', texteEntrée: entrée, texteAttendu: attendu })
  assert.equal(r.exécution.statut, 'différente')
  assert.ok(r.exécution.comparaison.différences.length > 0)
  assert.ok(r.exécution.corrections.vérifiées.some(c => c.requête === '[.Volumes[] | select(.State == "available") | {id: .VolumeId, size: .Size}]'))
  // Clés mal nommées en JMESPath.
  const j = moteur.exécuterRequête({ langage: 'jmespath', requête: "Volumes[?State=='available'].{VolumeId: VolumeId, size: Size}", texteEntrée: entrée, texteAttendu: attendu })
  assert.equal(j.exécution.statut, 'différente')
  assert.ok(j.exécution.comparaison.différences.some(d => d.type === 'manquant' || d.type === 'enTrop'))
  assert.ok(j.exécution.corrections.vérifiées.length > 0)
  // Résultats séparés au lieu d'un tableau (jq).
  const f = moteur.exécuterRequête({ langage: 'jq', requête: '.Volumes[] | select(.State == "available") | {id: .VolumeId, size: .Size}', texteEntrée: entrée, texteAttendu: attendu })
  assert.equal(f.exécution.statut, 'différente')
  assert.ok(f.exécution.comparaison.remarques.some(x => /entourez-la de \[/.test(x)))
  assert.equal(f.exécution.corrections.vérifiées[0].requête, '[.Volumes[] | select(.State == "available") | {id: .VolumeId, size: .Size}]')
})

test('Erreurs de syntaxe : statut « erreur », jamais « vérifiée »', () => {
  const entrée = texte(EBS)
  const r = moteur.exécuterRequête({ langage: 'jq', requête: '[.Volumes[] | select(.State == "available"', texteEntrée: entrée, texteAttendu: '3' })
  assert.equal(r.exécution.statut, 'erreur')
  assert.match(r.exécution.erreur.message, /syntax error/)
  const j = moteur.exécuterRequête({ langage: 'jmespath', requête: "length(Volumes[?State=='available']", texteEntrée: entrée })
  assert.equal(j.exécution.statut, 'erreur')
  assert.match(j.exécution.erreur.message, /Syntaxe JMESPath invalide/)
  const ok = moteur.exécuterRequête({ langage: 'jmespath', requête: "length(Volumes[?State=='available'])", texteEntrée: entrée, texteAttendu: '3' })
  assert.equal(ok.exécution.statut, 'vérifiée')
})

test('Comparaison sans ordre et partielle', () => {
  const desordre = [{ id: 'vol-0a1b2c3d4e5f00005', size: 250 }, { id: 'vol-0a1b2c3d4e5f00002', size: 100 }, { id: 'vol-0a1b2c3d4e5f00003', size: 500 }]
  const r = moteur.exécuterRequête({ langage: 'jq', requête: '[.Volumes[] | select(.State == "available") | {id: .VolumeId, size: .Size}]', texteEntrée: texte(EBS), texteAttendu: JSON.stringify(desordre), comparaison: 'sansOrdre' })
  assert.equal(r.exécution.statut, 'vérifiée')
  const exact = moteur.exécuterRequête({ langage: 'jq', requête: '[.Volumes[] | select(.State == "available") | {id: .VolumeId, size: .Size}]', texteEntrée: texte(EBS), texteAttendu: JSON.stringify(desordre) })
  assert.equal(exact.exécution.statut, 'différente')
  assert.ok(exact.exécution.comparaison.différences.some(d => d.type === 'ordre'))
  const partiel = moteur.exécuterRequête({ langage: 'jmespath', requête: "Volumes[?State=='available']", texteEntrée: texte(EBS), texteAttendu: JSON.stringify([{ VolumeId: 'vol-0a1b2c3d4e5f00003' }]), comparaison: 'partiel' })
  assert.equal(partiel.exécution.statut, 'vérifiée')
})

test('Description en anglais : tri, comparaison et projection', () => {
  const c = premier(décrire(UTILISATEURS, 'Users older than 30 sorted by age'))
  assert.equal(c.jq.requête, '[.[] | select(.age > 30)] | sort_by(.age)')
  assert.equal(c.jmespath.requête, 'sort_by([?age>`30`], &age)')
  assert.equal(c.concordance, true)
  const n = premier(décrire(PODS, 'Get pod names in namespace kube-system'))
  assert.equal(n.jq.requête, '[.items[] | select(.metadata.namespace == "kube-system") | .metadata.name]')
  assert.deepEqual(JSON.parse(n.jmespath.texte), ['coredns-6d4b75cb6d-8xk2v'])
})

test('Sortie brute (jq -r) et flux de documents attendus', () => {
  const a = lireAttendu('vol-0a1b2c3d4e5f00002\nvol-0a1b2c3d4e5f00003\nvol-0a1b2c3d4e5f00005')
  assert.ok(a.ok && a.brut && a.flux)
  const r = exemple(EBS, 'vol-0a1b2c3d4e5f00002\nvol-0a1b2c3d4e5f00003\nvol-0a1b2c3d4e5f00005')
  const c = premier(r)
  assert.equal(c.jq.requête, '.Volumes[] | select(.State == "available") | .VolumeId')
  assert.equal(c.jq.statut, 'vérifiée')
  assert.equal(c.jmespath.statut, 'vérifiée')
})

test('Mode guidé : plan construit par l\'utilisateur, exécuté par les deux moteurs', () => {
  const plan = { type: 'collection', source: ['Volumes', null], filtre: { type: 'cmp', champ: { chemin: ['Size'] }, op: '>=', valeur: 100 }, tri: { champ: { chemin: ['Size'] }, desc: false }, projection: { type: 'champ', chemin: ['VolumeId'] } }
  const r = moteur.générer({ texteEntrée: texte(EBS), mode: 'guidé', plan })
  const c = premier(r)
  assert.equal(c.jq.requête, '[.Volumes[] | select(.Size >= 100)] | sort_by(.Size) | map(.VolumeId)')
  assert.equal(c.jmespath.requête, 'sort_by(Volumes[?Size>=`100`], &Size)[].VolumeId')
  assert.equal(c.jq.statut, 'conforme')
  assert.equal(c.jmespath.statut, 'conforme')
})

test('Explications pas à pas', () => {
  const j = moteur.expliquer({ langage: 'jq', requête: JQ_EC2 })
  assert.ok(j.ok)
  assert.ok(j.étapes.some(e => /Garde l'élément si : \.State\.Name vaut "running"/.test(e.texte)))
  const m = moteur.expliquer({ langage: 'jmespath', requête: JMES_EC2 })
  assert.ok(m.ok)
  assert.ok(m.étapes.some(e => /Filtre : garde les éléments où State\.Name vaut "running"/.test(e.texte)))
  assert.ok(m.étapes.some(e => /Aplatit/.test(e.texte)))
  assert.equal(moteur.expliquer({ langage: 'jmespath', requête: 'a[?' }).ok, false)
})

test('JSON d\'entrée : erreurs localisées, mise en forme fidèle', () => {
  const e = analyserJson('{\n  "a": 1,\n  "b": [1, 2,]\n}')
  assert.equal(e.ok, false)
  assert.equal(e.erreur.ligne, 3)
  assert.match(e.erreur.message, /Virgule en trop/)
  assert.equal(formaterJson('{"n":12345678901234567890,"x":[]}'), '{\n  "n": 12345678901234567890,\n  "x": []\n}')
  const r = moteur.générer({ texteEntrée: '{"a": }', mode: 'description', description: 'a' })
  assert.equal(r.ok, false)
  assert.match(r.erreur, /JSON d'entrée invalide/)
})
