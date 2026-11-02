// Boîte à outils DevOps : calculs purs (testables sans interface).

// ---------- CIDR ----------
const ipVersNombre = ip => ip.split('.').reduce((n, o) => n * 256 + Number(o), 0)
const nombreVersIp = n => [24, 16, 8, 0].map(d => Math.floor(n / 2 ** d) % 256).join('.')
export function analyserCidr(texte) {
  const m = (texte || '').trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/)
  if (!m) return { erreur: 'Format attendu : 10.0.0.0/24' }
  const octets = m[1].split('.').map(Number)
  if (octets.some(o => o > 255)) return { erreur: 'Chaque nombre doit être entre 0 et 255' }
  const préfixe = m[2] === undefined ? 32 : Number(m[2])
  if (préfixe > 32) return { erreur: 'Le préfixe va de /0 à /32' }
  const taille = 2 ** (32 - préfixe)
  const ip = ipVersNombre(m[1])
  const réseau = Math.floor(ip / taille) * taille
  const fin = réseau + taille - 1
  const masque = nombreVersIp(2 ** 32 - taille)
  return {
    entrée: `${m[1]}/${préfixe}`, préfixe, taille, réseau: nombreVersIp(réseau), diffusion: nombreVersIp(fin),
    masque, joker: nombreVersIp(taille - 1), aligné: ip === réseau,
    premièreUtilisable: taille > 2 ? nombreVersIp(réseau + 1) : nombreVersIp(réseau),
    dernièreUtilisable: taille > 2 ? nombreVersIp(fin - 1) : nombreVersIp(fin),
    utilisables: taille > 2 ? taille - 2 : taille,
    // AWS réserve 5 adresses par sous-réseau : réseau, +1 routeur, +2 DNS, +3 réservée, dernière.
    aws: taille >= 16 ? { utilisables: taille - 5, réservées: [[réseau, 'adresse réseau'], [réseau + 1, 'routeur du VPC'], [réseau + 2, 'serveur DNS'], [réseau + 3, 'réservée par AWS'], [fin, 'diffusion (non prise en charge)']].map(([n, r]) => [nombreVersIp(n), r]), premièreUtilisable: nombreVersIp(réseau + 4), dernièreUtilisable: nombreVersIp(fin - 1), valideVpc: préfixe >= 16 && préfixe <= 28 } : null,
    privée: (octets[0] === 10) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168),
  }
}
export function découperCidr(texte, nouveauPréfixe, max = 64) {
  const a = analyserCidr(texte)
  if (a.erreur) return a
  if (nouveauPréfixe < a.préfixe || nouveauPréfixe > 32) return { erreur: `Choisis un préfixe entre /${a.préfixe} et /32` }
  const pas = 2 ** (32 - nouveauPréfixe), nb = 2 ** (nouveauPréfixe - a.préfixe), base = ipVersNombre(a.réseau)
  return { total: nb, sousRéseaux: Array.from({ length: Math.min(nb, max) }, (_, i) => `${nombreVersIp(base + i * pas)}/${nouveauPréfixe}`) }
}

// ---------- Cron (Unix 5 champs, ou AWS EventBridge 6 champs) ----------
const MOIS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const JOURS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const NOMS_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const NOMS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
function champ(texte, min, max, noms, décalageNoms = 0) {
  const valeurs = new Set()
  for (const morceau of texte.split(',')) {
    let [plage, pas] = morceau.split('/')
    pas = pas === undefined ? 1 : Number(pas)
    if (!Number.isInteger(pas) || pas < 1) throw new Error(`Pas invalide : ${morceau}`)
    const val = v => { const i = noms ? noms.indexOf(v.toUpperCase()) : -1; const n = i >= 0 ? i + décalageNoms : Number(v); if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Valeur hors limites : ${v} (${min}-${max})`); return n }
    let a, b
    if (plage === '*' || plage === '?') { a = min; b = max } else if (plage.includes('-')) { [a, b] = plage.split('-').map(val) } else { a = val(plage); b = pas > 1 ? max : a }
    for (let v = a; v <= b; v += pas) valeurs.add(v)
  }
  return valeurs
}
export function analyserCron(expression, maintenant = new Date()) {
  const parts = (expression || '').trim().replace(/^cron\((.*)\)$/i, '$1').split(/\s+/).filter(Boolean)
  if (parts.length !== 5 && parts.length !== 6) return { erreur: '5 champs (Unix : minute heure jour mois jour-semaine) ou 6 champs (AWS : … année)' }
  const aws = parts.length === 6
  try {
    const minutes = champ(parts[0], 0, 59), heures = champ(parts[1], 0, 23)
    const dernierJour = parts[2] === 'L'
    const jours = dernierJour ? new Set() : champ(parts[2], 1, 31), mois = champ(parts[3], 1, 12, MOIS, 1)
    // AWS : jour de semaine 1-7 = dimanche-samedi ; Unix : 0-7 (0 et 7 = dimanche).
    let joursSemaine = aws ? new Set([...champ(parts[4], 1, 7, JOURS, 1)].map(v => v - 1)) : new Set([...champ(parts[4], 0, 7, JOURS)].map(v => v % 7))
    const années = aws ? champ(parts[5], 1970, 2199) : null
    if (aws && parts[2] !== '?' && parts[4] !== '?') return { erreur: 'AWS : le jour du mois OU le jour de la semaine doit être « ? »' }
    const jourLibre = parts[2] === '*' || parts[2] === '?', semaineLibre = parts[4] === '*' || parts[4] === '?'
    if (semaineLibre) joursSemaine = new Set([0, 1, 2, 3, 4, 5, 6])
    const jourOk = d => (dernierJour ? new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() === d.getDate() : jours.has(d.getDate()))
    const correspond = d => mois.has(d.getMonth() + 1) && (!années || années.has(d.getFullYear())) && (
      jourLibre && semaineLibre ? true : jourLibre ? joursSemaine.has(d.getDay()) : semaineLibre ? jourOk(d) : (jourOk(d) || joursSemaine.has(d.getDay())))
    const prochaines = []
    const d = new Date(maintenant); d.setSeconds(0, 0)
    for (let j = 0; j < 800 && prochaines.length < 5; j++) {
      const jour = new Date(d.getFullYear(), d.getMonth(), d.getDate() + j)
      if (!correspond(jour)) continue
      for (const h of [...heures].sort((a, b) => a - b)) for (const m of [...minutes].sort((a, b) => a - b)) {
        const t = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate(), h, m)
        if (t > maintenant && prochaines.length < 5) prochaines.push(t)
      }
    }
    const tri = set => [...set].sort((a, b) => a - b)
    const deux = n => String(n).padStart(2, '0')
    const fixe = x => /^[\d,]+$/.test(x)
    let quand
    if (fixe(parts[0]) && fixe(parts[1]) && minutes.size * heures.size <= 6) quand = `à ${tri(heures).flatMap(h => tri(minutes).map(m => `${deux(h)}:${deux(m)}`)).join(', ')}`
    else {
      const m = parts[0] === '*' ? 'chaque minute' : parts[0].startsWith('*/') ? `toutes les ${parts[0].slice(2)} minutes` : `à la minute ${tri(minutes).join(', ')}`
      const h = parts[1] === '*' ? '' : parts[1].startsWith('*/') ? `toutes les ${parts[1].slice(2)} heures` : `entre ${tri(heures).map(x => `${x} h`).join(', ')}`
      quand = [m, h].filter(Boolean).join(', ')
    }
    const desc = [
      quand,
      dernierJour ? 'le dernier jour du mois' : !jourLibre ? `le ${tri(jours).join(', ')} du mois` : '',
      !semaineLibre ? `le ${tri(joursSemaine).map(j => NOMS_JOURS[j]).join(', ')}` : '',
      mois.size < 12 ? `en ${tri(mois).map(m => NOMS_MOIS[m - 1]).join(', ')}` : '',
      années && parts[5] !== '*' ? `en ${tri(années).join(', ')}` : '',
    ].filter(Boolean).join(', ')
    return { aws, description: desc.charAt(0).toUpperCase() + desc.slice(1), prochaines, fuseau: aws ? 'AWS EventBridge utilise l\'heure UTC (sauf EventBridge Scheduler avec un fuseau).' : 'Heure du serveur qui exécute le cron.' }
  } catch (e) { return { erreur: e.message } }
}

// ---------- chmod ----------
export function chmodDepuisOctal(octal) {
  const m = (octal || '').trim().match(/^[0-7]{3,4}$/)
  if (!m) return null
  const c = octal.trim().slice(-3).split('').map(Number)
  return c.map(n => [!!(n & 4), !!(n & 2), !!(n & 1)])
}
export function chmodDepuisSymbolique(s) {
  const t = (s || '').trim().replace(/^[-dl]/, x => (s.trim().length === 10 ? '' : x))
  if (!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(t)) return null
  return [0, 1, 2].map(i => [t[i * 3] === 'r', t[i * 3 + 1] === 'w', !['-', 'S', 'T'].includes(t[i * 3 + 2])])
}
export const chmodOctal = droits => droits.map(([r, w, x]) => (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0)).join('')
export const chmodSymbolique = droits => droits.map(([r, w, x]) => `${r ? 'r' : '-'}${w ? 'w' : '-'}${x ? 'x' : '-'}`).join('')

// ---------- Base64 (UTF-8, variante URL) ----------
export function base64Encoder(texte, url = false) {
  const b = btoa(String.fromCharCode(...new TextEncoder().encode(texte)))
  return url ? b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b
}
export function base64Décoder(texte) {
  let t = (texte || '').trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '')
  while (t.length % 4) t += '='
  const bin = atob(t)
  return new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(bin, c => c.charCodeAt(0)))
}

// ---------- JWT (décodage seul, sans vérification de signature) ----------
export function décoderJwt(jeton) {
  const parts = (jeton || '').trim().replace(/^Bearer\s+/i, '').split('.')
  if (parts.length < 2) return { erreur: 'Un JWT a 3 parties séparées par des points' }
  try {
    const entête = JSON.parse(base64Décoder(parts[0])), contenu = JSON.parse(base64Décoder(parts[1]))
    const dates = ['iat', 'nbf', 'exp'].filter(k => typeof contenu[k] === 'number').map(k => [k, new Date(contenu[k] * 1000)])
    const exp = typeof contenu.exp === 'number' ? new Date(contenu.exp * 1000) : null
    return { entête, contenu, dates, expiré: exp ? exp < new Date() : null, signée: !!parts[2] }
  } catch { return { erreur: 'Impossible de décoder : ce n\'est pas un JWT valide' } }
}

// ---------- Horodatage ----------
export function analyserHorodatage(texte, maintenant = new Date()) {
  const t = (texte || '').trim()
  if (!t) return null
  let d
  if (/^-?\d+(\.\d+)?$/.test(t)) { const n = Number(t); d = new Date(Math.abs(n) >= 1e11 ? n : n * 1000) } else d = new Date(t)
  if (Number.isNaN(d.getTime())) return { erreur: 'Date ou nombre non reconnu' }
  const écart = Math.round((d - maintenant) / 1000)
  const abs = Math.abs(écart)
  const relatif = abs < 60 ? `${abs} s` : abs < 3600 ? `${Math.round(abs / 60)} min` : abs < 86400 ? `${Math.round(abs / 3600)} h` : `${Math.round(abs / 86400)} j`
  return { iso: d.toISOString(), local: d.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' }), secondes: Math.floor(d / 1000), millisecondes: d.getTime(), relatif: écart >= 0 ? `dans ${relatif}` : `il y a ${relatif}` }
}

// ---------- Coffre de commandes ----------
export const VARIABLES = /<([A-Za-z0-9_.-]+)>/g
export const variablesDe = commande => [...new Set([...(commande || '').matchAll(VARIABLES)].map(m => m[1]))]
export const remplir = (commande, valeurs) => (commande || '').replace(VARIABLES, (m, v) => (valeurs[v] ? valeurs[v] : m))

export const EXEMPLES_COMMANDES = [
  ['Session SSM sur une instance', 'aws ssm start-session --target <instance-id> --region <region> --profile <aws-profile>', ['aws', 'ssm']],
  ['Logs Lambda en direct', 'aws logs tail /aws/lambda/<function> --follow --region <region> --profile <aws-profile>', ['aws', 'logs']],
  ['Qui suis-je ?', 'aws sts get-caller-identity --profile <aws-profile>', ['aws']],
  ['Instances EC2 en cours', 'aws ec2 describe-instances --filters Name=instance-state-name,Values=running --query "Reservations[].Instances[].[InstanceId,Tags[?Key==\'Name\']|[0].Value]" --output table --region <region> --profile <aws-profile>', ['aws', 'ec2']],
  ['Forcer un nouveau déploiement ECS', 'aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment --region <region> --profile <aws-profile>', ['aws', 'ecs']],
  ['Lire un paramètre SSM', 'aws ssm get-parameter --name <parameter> --with-decryption --query Parameter.Value --output text --region <region> --profile <aws-profile>', ['aws', 'ssm']],
  ['Changer de contexte Kubernetes', 'kubectl config use-context <kube-context>', ['kubernetes']],
  ['Logs d\'un déploiement', 'kubectl logs deploy/<deployment> -n <namespace> --since=15m -f', ['kubernetes']],
  ['Redémarrer un déploiement', 'kubectl rollout restart deployment/<deployment> -n <namespace>', ['kubernetes']],
  ['Terraform plan dans un workspace', 'terraform workspace select <workspace> && terraform plan -var-file=<env>.tfvars', ['terraform']],
  ['Connexion Docker à ECR', 'aws ecr get-login-password --region <region> --profile <aws-profile> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com', ['docker', 'aws']],
  ['Tester un port depuis une machine', 'nc -zv <host> <port>', ['réseau']],
  ['Résolution DNS', 'dig +short <host>', ['réseau']],
  ['Certificat d\'un site', 'echo | openssl s_client -connect <host>:443 -servername <host> 2>/dev/null | openssl x509 -noout -dates -subject', ['réseau']],
]
