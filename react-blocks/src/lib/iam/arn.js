// ARN : découpage, analyse, gabarits des types de ressources (arn:${Partition}:s3:::${BucketName}/${ObjectName}),
// compatibilité d'un motif d'ARN saisi avec un gabarit, instanciation d'exemples.
import { compiler, intersecte } from './glob.js'

export const PARTITIONS = ['aws', 'aws-cn', 'aws-us-gov', 'aws-iso', 'aws-iso-b', 'aws-iso-e', 'aws-iso-f', 'aws-eusc']
export const RÉGION = /^[a-z]{2}(-[a-z]+)+-\d+$/
export const RÉGIONS_COURANTES = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1', 'eu-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1', 'ca-central-1', 'sa-east-1']

// « arn:aws:s3:::bucket/clé » → 6 composantes (la dernière garde ses « : »).
export function découperArn(s) {
  if (typeof s !== 'string') return { ok: false }
  const morceaux = s.split(':')
  if (morceaux.length < 6 || morceaux[0] !== 'arn') return { ok: false }
  const [arn, partition, service, région, compte] = morceaux
  return { ok: true, composantes: [arn, partition, service, région, compte, morceaux.slice(5).join(':')], partition, service, région, compte, ressource: morceaux.slice(5).join(':') }
}

// Vérifie la forme d'un ARN (avec ou sans jokers) et renvoie des problèmes lisibles.
export function analyserArn(s) {
  const problèmes = []
  if (s === '*') return { ok: true, joker: true, problèmes }
  if (typeof s !== 'string' || !s.startsWith('arn:')) return { ok: false, problèmes: [{ niveau: 'erreur', code: 'ARN_FORMAT', message: `« ${String(s).slice(0, 60)} » n'est pas un ARN : il doit commencer par « arn: » (ou valoir « * »).` }] }
  const d = découperArn(s)
  if (!d.ok) return { ok: false, problèmes: [{ niveau: 'erreur', code: 'ARN_FORMAT', message: `« ${s.slice(0, 80)} » n'a pas la forme arn:partition:service:région:compte:ressource (6 parties séparées par « : »).` }] }
  const { partition, service, région, compte, ressource } = d
  const joker = /[*?]/
  if (!joker.test(partition) && !PARTITIONS.includes(partition)) problèmes.push({ niveau: 'avertissement', code: 'ARN_PARTITION', message: `Partition « ${partition} » inconnue (attendu : ${PARTITIONS.slice(0, 3).join(', ')}…).` })
  if (!service) problèmes.push({ niveau: 'erreur', code: 'ARN_SERVICE', message: 'Le service est vide dans l\'ARN.' })
  if (région && !joker.test(région) && !RÉGION.test(région)) problèmes.push({ niveau: 'avertissement', code: 'ARN_RÉGION', message: `Région « ${région} » inhabituelle (exemple : eu-west-3).` })
  if (compte && !joker.test(compte) && !/^\d{12}$/.test(compte) && compte !== 'aws') problèmes.push({ niveau: 'erreur', code: 'ARN_COMPTE', message: `L'identifiant de compte « ${compte} » doit comporter 12 chiffres.` })
  if (!ressource) problèmes.push({ niveau: 'erreur', code: 'ARN_RESSOURCE', message: 'La partie « ressource » de l\'ARN est vide.' })
  return { ok: !problèmes.some(p => p.niveau === 'erreur'), ...d, problèmes }
}

// ---- Gabarits ----------------------------------------------------------------------------------

// Noms de paramètres qui ne contiennent jamais « / » (un nom de bucket, de table, de file…).
const NOMS_SIMPLES = /^(BucketName|TableName|QueueName|TopicName|FunctionName|Partition|Region|Account)$/

export const champsDuGabarit = modèle => [...modèle.matchAll(/\$\{([^}]+)\}/g)].map(m => m[1])

// Jetons d'un gabarit : les paramètres deviennent des étoiles qui ne franchissent pas « : » (ni « / »
// pour les noms simples ni le séparateur qui les suit dans le gabarit).
function jetonsGabarit(texte) {
  const jetons = []
  let i = 0
  while (i < texte.length) {
    const m = /^\$\{([^}]+)\}/.exec(texte.slice(i))
    if (m) {
      const suivant = texte[i + m[0].length]
      const interdits = new Set([':'])
      if (suivant === '/' || NOMS_SIMPLES.test(m[1])) interdits.add('/')
      jetons.push({ t: '*', x: interdits })
      i += m[0].length
    } else {
      jetons.push({ t: 'c', c: texte[i] })
      i++
    }
  }
  return jetons
}

// Expression régulière qui lit un ARN concret selon un gabarit : { regex, champs }.
// Les noms simples (bucket, table…) n'ont ni « : » ni « / » ; les autres paramètres ne franchissent pas « : ».
export function regexGabarit(modèle) {
  const champs = champsDuGabarit(modèle)
  const morceaux = modèle.split(/\$\{[^}]+\}/)
  let source = ''
  morceaux.forEach((m, i) => {
    source += m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (i < champs.length) {
      const dernier = i === champs.length - 1 && morceaux[i + 1] === ''
      const suivant = morceaux[i + 1]?.[0]
      const simple = NOMS_SIMPLES.test(champs[i]) || suivant === '/'
      source += dernier && !simple ? '(.+)' : simple ? '([^:/]*)' : '([^:]*)'
    }
  })
  return { regex: new RegExp(`^${source}$`), champs }
}

// Le motif d'ARN saisi (avec jokers) peut-il désigner une ressource de ce gabarit ?
export function arnCompatible(motif, gabarit) {
  if (motif === '*') return true
  const m = découperArn(motif)
  const g = découperArn(gabarit)
  if (!m.ok || !g.ok) return intersecte(compiler(motif), jetonsGabarit(gabarit))
  for (let i = 0; i < 6; i++) {
    const a = compiler(m.composantes[i])
    const b = jetonsGabarit(g.composantes[i])
    if (!intersecte(a, b)) return false
  }
  return true
}

// Valeurs d'exemple pour instancier un gabarit (tests générés, aperçus).
const EXEMPLES = {
  Partition: 'aws', Region: 'eu-west-3', Account: '123456789012', BucketName: 'mon-bucket', ObjectName: 'dossier/fichier.txt',
  TableName: 'ma-table', IndexName: 'mon-index', FunctionName: 'ma-fonction', QueueName: 'ma-file', TopicName: 'mon-topic',
  RoleNameWithPath: 'mon-role', UserNameWithPath: 'mon-utilisateur', GroupNameWithPath: 'mon-groupe', PolicyNameWithPath: 'ma-politique',
  KeyId: '1234abcd-12ab-34cd-56ef-1234567890ab', SecretId: 'mon-secret-AbCdEf', ParameterNameWithoutLeadingSlash: 'app/config', LogGroupName: 'mon-groupe-de-logs',
  RepositoryName: 'mon-depot', ClusterName: 'mon-cluster', InstanceId: 'i-0123456789abcdef0', VolumeId: 'vol-0123456789abcdef0', StreamName: 'mon-flux',
}
export const exempleParamètre = nom => EXEMPLES[nom] ?? `${nom.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}-exemple`

// Remplace les paramètres d'un gabarit : valeurs[nom] si fournie, sinon `défaut` (« * » par défaut).
export function instancier(modèle, valeurs = {}, défaut = '*') {
  return modèle.replace(/\$\{([^}]+)\}/g, (_, nom) => valeurs[nom] ?? (typeof défaut === 'function' ? défaut(nom) : défaut))
}

// Texte du gabarit pour l'affichage : arn:aws:s3:::${BucketName}/${ObjectName} (partition aws par défaut).
export const gabaritAffichable = modèle => modèle.replace('${Partition}', 'aws')

// Le compte d'un ARN d'identité : arn:aws:iam::123456789012:user/x → 123456789012.
export const compteDe = arn => {
  const d = découperArn(arn)
  return d.ok && /^\d{12}$/.test(d.compte) ? d.compte : null
}
