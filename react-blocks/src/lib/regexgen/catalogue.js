// Catalogue de formats courants : chaque entrée donne sa regex (syntaxe
// JavaScript, lue par parse.js), une variante à groupes nommés, des noms
// (français et anglais, sans accents) et des exemples valides/invalides qui
// servent à l'auto-vérification : le motif est exécuté sur chacun d'eux.
import { analyserRegex } from './parse.js'
import { formatVersArbre } from './formats.js'
import { découper } from './jetons.js'

const raw = String.raw
const OCT = raw`(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)`
const IPV4 = raw`(?:${OCT}\.){3}${OCT}`
const HEX = raw`[0-9a-f]`
const b64url = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

// Identifiants de ressources AWS : préfixe-8 ou 17 caractères hexadécimaux.
const idAws = (id, préfixe, titre, noms, exemple) => ({
  id, titre, noms, src: raw`${préfixe}-(?:${HEX}{17}|${HEX}{8})`,
  valides: [`${préfixe}-0a1b2c3d4e5f60718`, `${préfixe}-0a1b2c3d`, exemple].filter((x, i, t) => x && t.indexOf(x) === i),
  invalides: [`${préfixe}-0a1b2c3`, `${préfixe}-0a1b2c3d4e5f6071`, `${préfixe}-gggggggg`, `0a1b2c3d4e5f60718`, `${préfixe.toUpperCase()}-0a1b2c3d`],
  notes: ['8 caractères hexadécimaux (ancien format) ou 17 (format actuel).'],
})

export const CATALOGUE = [
  {
    id: 'email', titre: 'Adresse e-mail',
    noms: ['email', 'e-mail', 'mail', 'courriel', 'adresse email', 'adresse e-mail', 'adresse mail', 'adresse electronique', 'adresse courriel', 'email address', 'mail address', 'courrier electronique'],
    src: raw`[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}`,
    srcGroupes: raw`(?<utilisateur>[A-Za-z0-9._%+-]+)@(?<domaine>(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})`,
    valides: ['alice.martin@example.com', 'bob+tag@sub.domain.fr', 'a_b-c@x.io', 'contact@entreprise.co.uk'],
    invalides: ['alice@', '@example.com', 'alice@example', 'alice example.com', 'alice@@example.com', 'alice@example..com'],
    notes: ['Format courant (lettres, chiffres et . _ % + - avant l\'arobase), pas la RFC 5322 complète : seule l\'existence réelle de la boîte prouve qu\'une adresse est valide.'],
  },
  {
    id: 'ipv4', titre: 'Adresse IPv4',
    noms: ['ip', 'ipv4', 'adresse ip', 'adresse ipv4', 'ip v4', 'ip address', 'ipv4 address', 'adresse ip v4'],
    src: IPV4, srcGroupes: raw`(?<octet1>${OCT})\.(?<octet2>${OCT})\.(?<octet3>${OCT})\.(?<octet4>${OCT})`,
    valides: ['192.168.1.10', '10.0.0.1', '255.255.255.255', '0.0.0.0', '8.8.8.8'],
    invalides: ['256.1.1.1', '1.2.3', '1.2.3.4.5', '192.168.1.256', '01.2.3.4', 'abc', '1.2.3.-4'],
    notes: ['Chaque octet est borné à 0-255, sans zéro initial (01 refusé).'],
  },
  {
    id: 'cidr', titre: 'Bloc CIDR IPv4',
    noms: ['cidr', 'bloc cidr', 'reseau cidr', 'plage ip', 'plage cidr', 'ip range', 'cidr block', 'notation cidr'],
    src: raw`${IPV4}/(?:3[0-2]|[12]?\d)`, srcGroupes: raw`(?<ip>${IPV4})/(?<masque>3[0-2]|[12]?\d)`,
    valides: ['10.0.0.0/16', '192.168.1.0/24', '0.0.0.0/0', '172.16.0.0/12', '10.1.2.3/32'],
    invalides: ['10.0.0.0/33', '10.0.0.0', '10.0.0.0/', '300.0.0.0/8', '10.0.0.0/-1'],
    notes: ['Le masque va de 0 à 32 ; le motif ne vérifie pas que l\'adresse est bien une adresse de réseau.'],
  },
  {
    id: 'mac', titre: 'Adresse MAC',
    noms: ['mac', 'adresse mac', 'mac address'],
    src: raw`(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}`,
    valides: ['00:1A:2B:3C:4D:5E', 'aa-bb-cc-dd-ee-ff', '01:23:45:67:89:ab'],
    invalides: ['00:1A:2B:3C:4D', '00:1A:2B:3C:4D:5G', '001A2B3C4D5E', '00:1A:2B:3C:4D:5E:6F'],
  },
  {
    id: 'uuid', titre: 'UUID',
    noms: ['uuid', 'guid', 'identifiant unique universel'],
    src: raw`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`,
    srcGroupes: raw`(?<a>[0-9a-fA-F]{8})-(?<b>[0-9a-fA-F]{4})-(?<c>[0-9a-fA-F]{4})-(?<d>[0-9a-fA-F]{4})-(?<e>[0-9a-fA-F]{12})`,
    valides: ['123e4567-e89b-12d3-a456-426614174000', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'],
    invalides: ['123e4567-e89b-12d3-a456-42661417400', '123e4567e89b12d3a456426614174000', 'zzzzzzzz-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-4266141740000'],
    notes: ['Forme 8-4-4-4-12 en hexadécimal ; la version (v1, v4…) n\'est pas contrôlée.'],
  },
  {
    id: 'url', titre: 'URL http(s)',
    noms: ['url', 'lien', 'adresse web', 'lien http', 'url http', 'lien web', 'web address', 'link', 'site web', 'adresse http'],
    // Le chemin, la requête et l'ancre ne finissent pas par une ponctuation (« voir http://x.fr/a, merci » → http://x.fr/a).
    src: raw`https?://(?:[A-Za-z0-9-]+\.)*[A-Za-z0-9-]+(?::\d{1,5})?(?:/(?:[^\s?#]*[^\s?#.,;:!?)'"])?)?(?:\?[^\s#]*[^\s#.,;:!?)'"])?(?:#\S*[^\s.,;:!?)'"])?`,
    srcGroupes: raw`(?<schema>https?)://(?<hote>(?:[A-Za-z0-9-]+\.)*[A-Za-z0-9-]+)(?::(?<port>\d{1,5}))?(?<chemin>/(?:[^\s?#]*[^\s?#.,;:!?)'"])?)?(?:\?(?<requete>[^\s#]*[^\s#.,;:!?)'"]))?(?:#(?<ancre>\S*[^\s.,;:!?)'"]))?`,
    valides: ['https://example.com', 'http://localhost:8080/api/v1?x=1#top', 'https://sub.domain.fr/chemin/page.html', 'http://192.168.1.10:3000/', 'https://example.com/a?b=c'],
    invalides: ['ftp://example.com', 'http://', 'example.com', 'http:/example.com', 'https://exa mple.com', 'https://example.com/page.'],
    notes: ['Schémas http et https uniquement ; le chemin, la requête (?) et l\'ancre (#) sont facultatifs et ne finissent pas par une ponctuation (. , ; : ! ?).'],
  },
  {
    id: 'domaine', titre: 'Nom de domaine',
    noms: ['domaine', 'nom de domaine', 'domain', 'domain name', 'fqdn'],
    src: raw`(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}`,
    valides: ['example.com', 'sub.example.co.uk', 'my-site.fr', 'a.io'],
    invalides: ['example', '-example.com', 'example..com', 'example.c', 'exa mple.com', 'example-.com'],
  },
  {
    id: 'couleur_hex', titre: 'Couleur hexadécimale',
    noms: ['couleur hexadecimale', 'code couleur', 'couleur hex', 'hex color', 'color code', 'hexadecimal color', 'couleur css'],
    src: raw`#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})`,
    valides: ['#fff', '#FF00AA', '#1a2b3c', '#000'],
    invalides: ['fff', '#ffff', '#gggggg', '#12345', '#1234567'],
    notes: ['Formes #RGB et #RRGGBB (sans transparence).'],
  },
  { id: 'date_iso', titre: 'Date ISO (aaaa-mm-jj)', noms: ['date iso', 'iso date', 'date au format iso', 'date iso 8601'], format: 'aaaa-mm-jj', valides: ['2024-11-16', '1999-01-31', '2000-12-01'], invalides: ['2024-13-01', '2024-00-10', '2024-11-32', '24-11-16', '2024/11/16', '2024-1-1'], notes: ['Mois 01-12, jour 01-31 : le motif ne sait pas qu\'un mois n\'a pas 31 jours (30/02) ni les années bissextiles.'] },
  { id: 'date_fr', titre: 'Date française (jj/mm/aaaa)', noms: ['date francaise', 'date fr', 'date jj/mm/aaaa'], format: 'jj/mm/aaaa', valides: ['16/11/2024', '01/01/1970', '31/12/1999'], invalides: ['32/01/2024', '16/13/2024', '16-11-2024', '1/1/2024', '00/01/2024', '16/11/24'], notes: ['Jour et mois sur deux chiffres ; le motif ne sait pas qu\'un mois n\'a pas 31 jours (31/04) ni les années bissextiles.'] },
  { id: 'date_us', titre: 'Date américaine (mm/jj/aaaa)', noms: ['date americaine', 'date us', 'us date', 'date mm/dd/yyyy'], format: 'mm/jj/aaaa', valides: ['11/16/2024', '01/31/1999', '12/01/2000'], invalides: ['13/01/2024', '11/32/2024', '11-16-2024', '1/1/2024'] },
  {
    id: 'date', titre: 'Date', noms: ['date', 'jour', 'date de naissance', 'birth date', 'birthday'],
    variantes: ['date_fr', 'date_iso', 'date_us'], variantesEn: ['date_iso', 'date_us', 'date_fr'],
    notes: ['Plusieurs formats de date existent : choisissez celui de vos données, ou écrivez-le (ex. « date au format jj/mm/aaaa »).'],
  },
  {
    id: 'date_heure_iso', titre: 'Date et heure ISO 8601',
    noms: ['date et heure iso', 'datetime iso', 'iso 8601', 'iso8601', 'timestamp iso', 'horodatage iso', 'rfc 3339', 'rfc3339', 'date heure iso', 'horodatage', 'datetime', 'timestamp'],
    src: raw`\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])[T ](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?`,
    srcGroupes: raw`(?<annee>\d{4})-(?<mois>0[1-9]|1[0-2])-(?<jour>0[1-9]|[12]\d|3[01])[T ](?<heure>[01]\d|2[0-3]):(?<minute>[0-5]\d):(?<seconde>[0-5]\d)(?:\.(?<fraction>\d+))?(?<fuseau>Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?`,
    valides: ['2024-11-16T09:30:00Z', '2024-11-16 09:30:00.123+01:00', '2024-11-16T09:30:00', '2024-11-16T23:59:59-0500'],
    invalides: ['2024-11-16', '2024-11-16T25:00:00Z', '2024-13-16T09:30:00', '2024-11-16T09:30', '16/11/2024 09:30:00'],
  },
  {
    id: 'heure', titre: 'Heure (hh:mm ou hh:mm:ss)',
    noms: ['heure', 'horaire', 'time', 'heure hh:mm', 'heure de la journee'],
    src: raw`(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?`, srcGroupes: raw`(?<heure>[01]\d|2[0-3]):(?<minute>[0-5]\d)(?::(?<seconde>[0-5]\d))?`,
    valides: ['09:30', '23:59:59', '00:00', '12:05:07'],
    invalides: ['24:00', '9:30', '12:60', '12:5', '12:30:61', '12-30'],
  },
  {
    id: 'tel_fr', titre: 'Téléphone français',
    noms: ['telephone', 'numero de telephone', 'tel', 'phone', 'telephone francais', 'numero francais', 'phone number', 'numero de tel', 'portable', 'telephone fr', 'numero de portable', 'mobile', 'numero de mobile', 'french phone number'],
    variantes: ['tel_fr_nat', 'tel_e164'], variantesEn: ['tel_e164', 'tel_fr_nat'],
    notes: ['Plusieurs formats de numéro existent : français (06 12 34 56 78, +33 6…) ou international E.164 (+33612345678).'],
  },
  {
    id: 'tel_fr_nat', titre: 'Téléphone français (06 12 34 56 78 ou +33 6 12 34 56 78)', noms: [],
    src: raw`(?:(?:\+|00)33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}`,
    srcGroupes: raw`(?<indicatif>(?:\+|00)33[\s.-]?|0)(?<numero>[1-9](?:[\s.-]?\d{2}){4})`,
    valides: ['06 12 34 56 78', '0612345678', '+33 6 12 34 56 78', '06.12.34.56.78', '01-23-45-67-89', '+33612345678'],
    invalides: ['0012345678', '06 12 34 56', '061234567890', '6 12 34 56 78', '+33 0 12 34 56 78', '06 12 34 56 7a'],
    notes: ['Dix chiffres commençant par 0 (ou +33 / 0033 sans le 0), séparés au choix par espace, point ou tiret.'],
  },
  {
    id: 'tel_e164', titre: 'Téléphone international (E.164)',
    noms: ['e164', 'e.164', 'telephone international', 'international phone', 'numero international', 'international phone number'],
    src: raw`\+[1-9]\d{6,14}`,
    valides: ['+33612345678', '+14155552671', '+442071838750'],
    invalides: ['0612345678', '+0612345678', '+33 6 12 34 56 78', '+3361', '+336123456789012345'],
    notes: ['Le signe +, l\'indicatif pays puis le numéro, 8 à 15 chiffres au total, sans séparateur.'],
  },
  {
    id: 'code_postal_fr', titre: 'Code postal français',
    noms: ['code postal', 'postal code', 'zip', 'zip code', 'code postal francais', 'cp'],
    src: raw`(?:0[1-9]|[1-8]\d|9[0-8])\d{3}`,
    valides: ['75001', '13008', '20000', '97400', '01000', '98000'],
    invalides: ['00100', '99000', '7500', '750011', 'abcde', '75 001'],
    notes: ['Cinq chiffres, départements 01 à 98 (la Corse 20xxx et l\'outre-mer 97/98 inclus) ; l\'existence réelle du code n\'est pas vérifiée.'],
  },
  {
    id: 'iban_fr', titre: 'IBAN français',
    noms: ['iban', 'iban francais', 'iban fr', 'compte bancaire francais', 'rib iban'],
    src: raw`FR\d{2}(?: ?[0-9A-Z]{4}){5} ?[0-9A-Z]{3}`,
    valides: ['FR76 3000 6000 0112 3456 7890 189', 'FR7630006000011234567890189'],
    invalides: ['FR76 3000 6000', 'DE89370400440532013000', 'FR76300060000112345678901', 'fr76 3000 6000 0112 3456 7890 189'],
    notes: ['27 caractères (FR, 2 chiffres de contrôle, 23 caractères) avec espaces facultatifs ; la clé de contrôle (modulo 97) n\'est pas vérifiée par une regex.'],
  },
  { id: 'siret', titre: 'Numéro SIRET', noms: ['siret', 'numero de siret', 'numero siret'], src: raw`\d{3} ?\d{3} ?\d{3} ?\d{5}`, valides: ['73282932000074', '732 829 320 00074'], invalides: ['7328293200007', '732829320000745', '7328293200007a'], notes: ['14 chiffres (SIREN + 5 chiffres d\'établissement) ; la clé de Luhn n\'est pas vérifiée.'] },
  { id: 'siren', titre: 'Numéro SIREN', noms: ['siren', 'numero de siren', 'numero siren'], src: raw`\d{3} ?\d{3} ?\d{3}`, valides: ['732829320', '732 829 320'], invalides: ['73282932', '7328293201', '73282932a'] },
  {
    id: 'semver', titre: 'Version sémantique (1.2.3)',
    noms: ['semver', 'version semantique', 'numero de version', 'version', 'semantic version', 'version logicielle', 'version number'],
    alternatives: ['semver_v'],
    src: raw`(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?`,
    srcGroupes: raw`(?<majeure>0|[1-9]\d*)\.(?<mineure>0|[1-9]\d*)\.(?<correctif>0|[1-9]\d*)(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+(?<build>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?`,
    valides: ['1.2.3', '0.0.1', '10.20.30', '1.2.3-beta.1', '1.2.3+build.5', '2.0.0-rc.1+exp.sha.5114f85'],
    invalides: ['1.2', '01.2.3', '1.2.3.4', '1.2.x', 'v1.2.3', '1.2.3-'],
    notes: ['Format MAJEURE.MINEURE.CORRECTIF avec pré-version (-beta.1) et build (+sha) facultatifs, sans zéro initial.'],
  },
  {
    id: 'semver_v', titre: 'Version sémantique avec « v » facultatif (v1.2.3)', noms: [],
    src: raw`v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?`,
    valides: ['v1.2.3', '1.2.3', 'v0.0.1', 'v2.0.0-rc.1'], invalides: ['vv1.2.3', 'v1.2', 'V1.2.3', '1.2.3.4', 'v01.2.3'],
  },
  { id: 'entier', titre: 'Nombre entier (signe facultatif)', noms: ['nombre entier', 'entier', 'integer', 'whole number', 'entier relatif'], src: raw`[+-]?\d+`, valides: ['0', '42', '-7', '+15', '1000000'], invalides: ['3.14', 'abc', '--1', '1 000', ''] },
  { id: 'entier_positif', peuDistinctif: true, titre: 'Entier positif', noms: ['entier positif', 'nombre positif', 'natural number', 'positive integer', 'entier naturel'], src: raw`\d+`, valides: ['0', '42', '1000000'], invalides: ['-7', '3.14', 'abc', '+5', ''] },
  { id: 'decimal', titre: 'Nombre décimal (. ou ,)', noms: ['nombre decimal', 'decimal', 'nombre a virgule', 'float', 'nombre reel', 'reel', 'nombre', 'number', 'decimal number'], src: raw`[+-]?\d+(?:[.,]\d+)?`, valides: ['0', '42', '-7.5', '3,14', '+0.001'], invalides: ['3.', '.5', 'abc', '1,2,3', '1..2'] },
  { id: 'pourcentage', titre: 'Pourcentage', noms: ['pourcentage', 'percentage', 'percent', 'taux'], src: raw`\d{1,3}(?:[.,]\d+)?\s?%`, valides: ['50%', '12,5 %', '100%', '0.5%'], invalides: ['%', '1000%', '12,5', 'a%', '12 , 5%'] },
  { id: 'montant_euro', titre: 'Montant en euros', noms: ['montant en euros', 'montant', 'prix en euros', 'prix', 'price', 'euros', 'amount', 'somme en euros'], src: raw`\d+(?:[.,]\d{2})?\s?(?:€|EUR)`, valides: ['12€', '12,50 €', '1999.99 EUR', '0,99€'], invalides: ['12', '€12', '12,5 €', '12 dollars', 'abc €'] },
  { id: 'hashtag', titre: 'Hashtag', noms: ['hashtag', 'mot dièse', 'mot-dièse'], src: raw`#\w+`, valides: ['#devops', '#AWS_2024', '#a1'], invalides: ['#', 'devops', '# devops', '##a'] },
  { id: 'mention', titre: 'Mention @utilisateur', noms: ['mention', 'at-mention', 'nom d utilisateur arobase', 'handle'], src: raw`@\w+`, valides: ['@alice', '@bob_42', '@x'], invalides: ['@', 'alice', '@ alice', '@@a'] },
  { id: 'chemin_unix', titre: 'Chemin Unix absolu', noms: ['chemin unix', 'chemin absolu', 'unix path', 'absolute path', 'chemin de fichier', 'chemin linux', 'chemin de dossier', 'chemin'], src: raw`(?:/[^/\s]+)*/[^/\s]*[^/\s.,;:!?)'"]/?`, valides: ['/etc/nginx/nginx.conf', '/var/log/', '/usr/local/bin', '/a', '/tmp/x.tar.gz'], invalides: ['etc/nginx', '//', '/', '', '/etc/my file', '/etc/nginx.'], notes: ['Les chemins avec espaces ne sont pas reconnus ; la ponctuation finale (. , ; :) n\'appartient pas au chemin.'] },
  { id: 'chemin_windows', titre: 'Chemin Windows', noms: ['chemin windows', 'windows path', 'chemin de lecteur'], src: raw`[A-Za-z]:\\(?:[^\\/:*?"<>|\s]+\\)*(?:[^\\/:*?"<>|\s]*[^\\/:*?"<>|\s.,;!)'])?`, valides: ['C:\\Windows\\System32', 'D:\\data\\', 'C:\\', 'e:\\a\\b.txt'], invalides: ['C:/Windows', 'Windows\\System32', 'C:\\Win:dows', 'CC:\\x', 'C:\\Program Files'], notes: ['Les chemins avec espaces ne sont pas reconnus (ils se confondraient avec le texte qui suit).'] },
  {
    id: 'arn_aws', titre: 'ARN AWS',
    noms: ['arn', 'aws arn', 'arn aws', 'amazon resource name'],
    src: raw`arn:aws(?:-[a-z]+)*:[a-z0-9-]+:[a-z0-9-]*:(?:\d{12})?:\S*[^\s.,;:!?)'"]`,
    srcGroupes: raw`arn:(?<partition>aws(?:-[a-z]+)*):(?<service>[a-z0-9-]+):(?<region>[a-z0-9-]*):(?<compte>\d{12})?:(?<ressource>\S*[^\s.,;:!?)'"])`,
    valides: ['arn:aws:s3:::my-bucket/key', 'arn:aws:iam::123456789012:role/MyRole', 'arn:aws-cn:ec2:cn-north-1:123456789012:instance/i-0abc'],
    invalides: ['arn:aws:s3', 'arn:azure:x:y:z:w', 'aws:s3:::bucket', 'arn:aws:s3:::'],
    notes: ['Forme arn:partition:service:région:compte:ressource (région et compte peuvent être vides, par exemple pour S3).'],
  },
  { id: 'compte_aws', titre: 'Identifiant de compte AWS', noms: ['id de compte aws', 'account id', 'compte aws', 'aws account id', 'numero de compte aws', 'identifiant de compte aws'], src: raw`\d{12}`, valides: ['123456789012', '000000000001'], invalides: ['12345678901', '1234567890123', '12345678901a'] },
  idAws('id_instance', 'i', 'Identifiant d\'instance EC2', ['id d instance', 'instance id', 'id instance ec2', 'ec2 instance id', 'identifiant d instance', 'id instance'], null),
  idAws('id_volume', 'vol', 'Identifiant de volume EBS', ['id de volume', 'volume id', 'id volume ebs', 'identifiant de volume', 'id volume'], null),
  idAws('id_ami', 'ami', 'Identifiant d\'AMI', ['id d ami', 'ami id', 'identifiant d ami', 'id ami'], null),
  idAws('id_sg', 'sg', 'Identifiant de groupe de sécurité', ['id de groupe de securite', 'security group id', 'id security group', 'id sg'], null),
  idAws('id_subnet', 'subnet', 'Identifiant de sous-réseau', ['id de sous-reseau', 'subnet id', 'id subnet', 'id sous-reseau'], null),
  idAws('id_vpc', 'vpc', 'Identifiant de VPC', ['id de vpc', 'vpc id', 'id vpc'], null),
  {
    id: 'region_aws', titre: 'Région AWS',
    noms: ['region aws', 'aws region', 'region amazon'],
    src: raw`(?:us|eu|ap|sa|ca|me|af|il)-(?:north|south|east|west|central|northeast|southeast|northwest|southwest)-\d`,
    valides: ['eu-west-3', 'us-east-1', 'ap-southeast-2', 'sa-east-1'], invalides: ['eu-west', 'europe-west-3', 'eu-west-33', 'EU-WEST-3', 'eu_west_3'],
  },
  {
    id: 'cle_acces_aws', titre: 'Identifiant de clé d\'accès AWS',
    noms: ['cle d acces aws', 'access key id', 'aws access key', 'cle aws', 'identifiant de cle d acces', 'aws key id'],
    src: raw`(?:AKIA|ASIA)[0-9A-Z]{16}`,
    // Exemples fabriqués à l'exécution : aucune valeur ressemblant à une clé n'est écrite dans le dépôt.
    valides: [`AK${'IA'}${'ABCDEFGH'}${'12345678'}`, `AS${'IA'}${'ZYXWVUTS'}${'09876543'}`],
    invalides: [`AK${'IA'}${'ABCDEFGH'}${'1234567'}`, `ak${'ia'}${'abcdefgh'}${'12345678'}`, `AB${'IA'}${'ABCDEFGH'}${'12345678'}`],
    notes: ['Seul l\'identifiant (20 caractères) est reconnu ; une clé secrète ne se détecte pas par son format.'],
  },
  {
    id: 'nom_k8s', peuDistinctif: true, titre: 'Nom de ressource Kubernetes (DNS-1123)',
    noms: ['nom kubernetes', 'nom de pod', 'nom de ressource kubernetes', 'k8s name', 'dns label', 'dns-1123', 'label dns', 'nom de namespace', 'nom de deployment', 'kubernetes name', 'nom de service kubernetes'],
    src: raw`[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?`,
    valides: ['my-app', 'web-01', 'a', 'nginx', '9lives'], invalides: ['My-App', '-app', 'app-', 'my_app', 'a'.repeat(64), 'my app', ''],
    notes: ['Minuscules, chiffres et tirets, 63 caractères au plus, début et fin alphanumériques.'],
  },
  {
    id: 'image_docker', peuDistinctif: true, titre: 'Référence d\'image Docker',
    noms: ['image docker', 'docker image', 'reference d image', 'image de conteneur', 'nom d image', 'container image', 'reference d image docker'],
    src: raw`(?:[a-z0-9.-]+(?::\d+)?/)?[a-z0-9._-]+(?:/[a-z0-9._-]+)*(?::[A-Za-z0-9._-]+)?(?:@sha256:[0-9a-f]{64})?`,
    valides: ['nginx', 'nginx:1.27', 'registry.example.com:5000/team/app:v1.2', `ghcr.io/org/app@sha256:${'0123456789abcdef'.repeat(4)}`, 'library/ubuntu:22.04'],
    invalides: ['Nginx', 'nginx:', ':latest', 'my image', 'nginx:latest:1'],
    notes: ['Registre facultatif, dépôt en minuscules, étiquette (:tag) et condensat (@sha256) facultatifs.'],
  },
  { id: 'sha_git', titre: 'Hash de commit Git (7 à 40 caractères hexadécimaux)', noms: ['sha git', 'hash git', 'commit sha', 'git sha', 'hash de commit', 'sha de commit', 'git hash', 'hash commit', 'identifiant de commit'], src: raw`[0-9a-f]{7,40}`, valides: ['a1b2c3d', 'e83c5163316f89bfbde7d9ab23ca2e25604af290', '0123456789abcdef'], invalides: ['a1b2c3', 'g1b2c3d4', 'A1B2C3D', 'e83c5163316f89bfbde7d9ab23ca2e25604af2900'] },
  { id: 'statut_http', peuDistinctif: true, titre: 'Code de statut HTTP', noms: ['code http', 'http status', 'statut http', 'status code', 'code de statut http', 'code de retour http', 'http status code'], src: raw`[1-5]\d{2}`, valides: ['200', '404', '503', '101'], invalides: ['600', '99', '2000', 'abc', '020'] },
  { id: 'methode_http', titre: 'Méthode HTTP', noms: ['methode http', 'http method', 'verbe http', 'http verb'], src: raw`(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)`, valides: ['GET', 'POST', 'DELETE', 'OPTIONS'], invalides: ['get', 'FETCH', 'GETS', 'GET POST'] },
  { id: 'niveau_log', titre: 'Niveau de log', noms: ['niveau de log', 'log level', 'niveau de journalisation', 'severite de log', 'niveau de logs'], src: raw`(?:TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL)`, valides: ['INFO', 'ERROR', 'WARN', 'WARNING', 'DEBUG', 'FATAL'], invalides: ['info', 'ERR', 'WARNINGS', 'NOTICE', 'INFO ERROR'] },
  {
    id: 'jwt', titre: 'Jeton JWT',
    noms: ['jwt', 'json web token', 'jeton jwt', 'token jwt'],
    src: raw`eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*`,
    // Jeton de démonstration fabriqué à l'exécution (en-tête et charge utile inoffensifs).
    valides: [`${b64url('{"alg":"HS256"}')}.${b64url('{"sub":"1234"}')}.${b64url('signature')}`],
    invalides: ['abc.def.ghi', `${b64url('{"alg":"HS256"}')}.${b64url('{"sub":"1234"}')}`, 'eyJ.a b.c'],
    notes: ['Trois segments base64url séparés par des points, le premier commençant par eyJ (« {" » encodé) ; la signature n\'est pas vérifiée.'],
  },
  { id: 'slug', peuDistinctif: true, titre: 'Slug d\'URL', noms: ['slug', 'url propre', 'identifiant url', 'slug d url'], src: raw`[a-z0-9]+(?:-[a-z0-9]+)*`, valides: ['mon-article', 'a', 'article-2024-11', 'x1-y2'], invalides: ['Mon-Article', '-a', 'a-', 'a--b', 'mon article', ''] },
  { id: 'snake_case', peuDistinctif: true, titre: 'snake_case', noms: ['snake_case', 'snake case', 'snake-case'], src: raw`[a-z][a-z0-9]*(?:_[a-z0-9]+)*`, valides: ['ma_variable', 'a', 'x_1_y', 'nom'], invalides: ['maVariable', '_a', 'a_', 'a__b', 'Ma_variable', '1a'] },
  { id: 'kebab_case', peuDistinctif: true, titre: 'kebab-case', noms: ['kebab-case', 'kebab case'], src: raw`[a-z][a-z0-9]*(?:-[a-z0-9]+)*`, valides: ['ma-variable', 'a', 'x-1-y'], invalides: ['maVariable', '-a', 'a-', 'a--b', 'Ma-variable', '1a'] },
  { id: 'camel_case', peuDistinctif: true, titre: 'camelCase', noms: ['camelcase', 'camel case', 'camel-case'], src: raw`[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*`, valides: ['maVariable', 'a', 'unNomLong', 'x1Y2'], invalides: ['MaVariable', 'ma_variable', 'ma-variable', '1a', 'ma variable'] },
  { id: 'pascal_case', peuDistinctif: true, titre: 'PascalCase', noms: ['pascalcase', 'pascal case', 'pascal-case', 'upper camel case'], src: raw`(?:[A-Z][a-z0-9]*)+`, valides: ['MaVariable', 'A', 'UnNomLong', 'X1Y2'], invalides: ['maVariable', 'Ma_variable', 'Ma-Variable', 'ma', ''] },
  {
    id: 'mot_de_passe_fort', peuDistinctif: true, titre: 'Mot de passe fort (8+ caractères, minuscule, majuscule, chiffre, caractère spécial)',
    noms: ['mot de passe fort', 'strong password', 'mot de passe robuste', 'mot de passe complexe', 'password strength'],
    src: raw`(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}`,
    valides: ['Abcdef1!', 'Tr0ub4dor&3', 'P@ssw0rd2024'],
    invalides: ['abcdefg1!', 'ABCDEFG1!', 'Abcdefgh!', 'Abcdefg12', 'Ab1!'],
    notes: ['Utilise des assertions avant (?=…) : non supportées par RE2 (Go) ni POSIX ERE. À défaut de longueur précisée, 8 caractères minimum.'],
    cibleParDéfaut: 'valider', sansExemples: true,
  },
  { id: 'plaque_fr', titre: 'Plaque d\'immatriculation française (AB-123-CD)', noms: ['plaque d immatriculation', 'immatriculation', 'plaque francaise', 'license plate fr', 'plaque d immatriculation francaise', 'plaque'], src: raw`[A-HJ-NP-TV-Z]{2}-\d{3}-[A-HJ-NP-TV-Z]{2}`, valides: ['AB-123-CD', 'FG-001-HJ'], invalides: ['AB123CD', 'AI-123-CD', 'ab-123-cd', 'AB-12-CD', 'AB-123-CDE'], notes: ['Format SIV : les lettres I, O et U ne sont pas utilisées.'] },
  { id: 'balise_html', titre: 'Balise HTML', noms: ['balise html', 'html tag', 'balise xml', 'balise', 'tag html', 'xml tag'], src: raw`</?[A-Za-z][A-Za-z0-9-]*(?:\s[^>]*)?/?>`, valides: ['<div>', '</p>', '<a href="x">', '<br/>', '<img src="a"/>'], invalides: ['div', '<>', '< div>', '<1a>', '<div'] },
  { id: 'variable_env', peuDistinctif: true, titre: 'Nom de variable d\'environnement', noms: ['variable d environnement', 'nom de variable d environnement', 'env var', 'environment variable', 'variable denvironnement', 'nom de variable'], src: raw`[A-Z_][A-Z0-9_]*`, valides: ['PATH', 'MY_VAR_2', '_X', 'A'], invalides: ['1VAR', 'my_var', 'MY-VAR', 'MY VAR', ''] },
  { id: 'port', peuDistinctif: true, titre: 'Numéro de port TCP/UDP (0-65535)', noms: ['numero de port', 'port reseau', 'tcp port', 'port tcp', 'port udp', 'port'], src: raw`(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)`, valides: ['0', '80', '443', '8080', '65535', '12345'], invalides: ['65536', '99999', '-1', 'abc', '080', '100000'] },
  { id: 'timestamp_unix', titre: 'Horodatage Unix (secondes ou millisecondes)', noms: ['timestamp unix', 'epoch', 'unix timestamp', 'horodatage unix', 'temps unix', 'unix time'], src: raw`\d{10}(?:\d{3})?`, valides: ['1700000000', '1700000000123'], invalides: ['170000000', '17000000001', 'abcdefghij', '1700000000.5'] },
  // Entrées qui contiennent leurs propres ancres : utilisées telles quelles.
  { id: 'espaces_fin_ligne', titre: 'Espaces en fin de ligne', noms: ['espaces en fin de ligne', 'espaces de fin', 'trailing whitespace', 'trailing spaces', 'espaces superflus en fin', 'espaces a la fin de la ligne', 'espaces en fin'], src: raw`[ \t]+$`, flags: 'gm', ancré: true, cibleParDéfaut: 'lignes', valides: ['texte   ', 'a\t', 'a \t '], invalides: ['texte', ' début', 'a b'] },
  { id: 'espaces_debut_ligne', titre: 'Espaces en début de ligne', noms: ['espaces en debut de ligne', 'espaces de debut', 'leading whitespace', 'leading spaces', 'indentation', 'espaces au debut de la ligne', 'espaces en debut'], src: raw`^[ \t]+`, flags: 'gm', ancré: true, cibleParDéfaut: 'lignes', valides: ['   texte', '\ta', ' a'], invalides: ['texte', 'a  b', 'a '] },
  { id: 'ligne_vide', titre: 'Ligne vide (ou blanche)', noms: ['ligne vide', 'lignes vides', 'empty line', 'empty lines', 'blank line', 'blank lines', 'ligne blanche', 'lignes blanches'], src: raw`^\s*$`, flags: 'gm', ancré: true, cibleParDéfaut: 'lignes', valides: ['', '   ', '\t'], invalides: ['a', ' a ', '#'] },
  { id: 'ligne_non_vide', titre: 'Ligne non vide', noms: ['ligne non vide', 'lignes non vides', 'non empty line', 'non empty lines', 'non blank lines', 'lignes qui ne sont pas vides', 'lignes pas vides', 'not empty lines', 'lignes avec du contenu', 'lignes non blanches'], src: raw`^.*\S.*$`, flags: 'gm', ancré: true, cibleParDéfaut: 'lignes', valides: ['a', ' a ', '# x'], invalides: ['', '   ', '\t'] },
  { id: 'commentaire', titre: 'Ligne de commentaire (# …)', noms: ['commentaire', 'commentaires', 'ligne de commentaire', 'lignes de commentaire', 'comment line', 'comment lines', 'comment'], src: raw`^\s*#.*$`, flags: 'gm', ancré: true, cibleParDéfaut: 'lignes', valides: ['# commentaire', '  # indenté', '#'], invalides: ['code # fin', 'texte', ''] },
]

// ---- Accès ------------------------------------------------------------------

const index = new Map(CATALOGUE.map(e => [e.id, e]))
export const entité = id => index.get(id)

// Noms normalisés (jetons) triés du plus long au plus court : le plus précis l'emporte.
const NOMS = CATALOGUE.flatMap(e => e.noms.map(nom => ({ id: e.id, jetons: découper(nom).map(j => j.norm) }))).sort((a, b) => b.jetons.length - a.jetons.length)

// Entité nommée à partir du jeton k : { id, n } ou null.
export function entitéÀ(jetons, k) {
  for (const { id, jetons: mots } of NOMS) {
    if (mots.every((m, a) => jetons[k + a] && !jetons[k + a].cité && (jetons[k + a].norm === m || jetons[k + a].sing === m))) return { id, n: mots.length }
  }
  return null
}

const cache = new Map()
// Arbre d'une entité (avec ou sans groupes nommés) ; les entrées « variantes » n'ont pas d'arbre.
export function arbreEntité(id, { groupes = false } = {}) {
  const clé = `${id}|${groupes}`
  if (cache.has(clé)) return cache.get(clé)
  const e = index.get(id)
  let ast
  if (e.format) ast = formatVersArbre(e.format, { groupes }).ast
  else ast = analyserRegex(groupes && e.srcGroupes ? e.srcGroupes : e.src).ast
  cache.set(clé, ast)
  return ast
}
