// Catalogue IAM : services, actions, niveaux d'accès, types de ressources et clés de condition.
// Les données (public/iam, extraites de @cloud-copilot/iam-data, licence MIT) sont chargées par
// service, à la demande : `charger(chemin)` renvoie la promesse du JSON (fetch dans le navigateur,
// lecture de fichier sous Node). Après chargement, tout l'accès est synchrone.

export const NIVEAUX = ['List', 'Read', 'Write', 'Permissions management', 'Tagging']
export const NIVEAUX_FR = {
  List: 'Liste',
  Read: 'Lecture',
  Write: 'Écriture',
  'Permissions management': 'Gestion des permissions',
  Tagging: 'Étiquettes (tags)',
}

const échapper = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Clé de condition à gabarit (« aws:RequestTag/${TagKey} ») → expression qui reconnaît les clés réelles.
const PLACEHOLDER = /\$\{[^}]*\}|<[^>]+>/
const regexClé = clé => new RegExp(`^${clé.split(new RegExp(PLACEHOLDER.source, 'g')).map(échapper).join('.+')}$`, 'i')

// Types de ressources d'une action du plus « naturel » au moins naturel : requis d'abord, puis ceux de son propre
// service (ec2:StartInstances → instance, pas resource-groups), puis les moins paramétrés.
export function gabaritsOrdonnés(action) {
  const propre = rt => rt.modèle.startsWith(`arn:\${Partition}:${action.service}:`)
  const paramètres = rt => (rt.modèle.match(/\$\{/g) ?? []).length
  return action.ressources.filter(r => r.modèle).sort((a, b) => Number(b.requis) - Number(a.requis) || Number(propre(b)) - Number(propre(a)) || paramètres(a) - paramètres(b))
}

function normaliserService(brut) {
  const clés = new Map()
  const tableClés = brut.cles.map(([clé, type, desc]) => {
    const k = { clé, type, desc, gabarit: PLACEHOLDER.test(clé) ? regexClé(clé) : null }
    clés.set(clé.toLowerCase(), k)
    return k
  })
  const actions = brut.act.map(([nom, niveau, desc, rts, idxClés]) => ({
    id: `${brut.p}:${nom}`,
    service: brut.p,
    nom,
    niveau,
    niveauNom: NIVEAUX[niveau],
    desc,
    ressources: rts.map(r => {
      const requis = r.endsWith('*')
      const nomR = requis ? r.slice(0, -1) : r
      return { nom: nomR, requis, modèle: brut.res[nomR] ?? null }
    }),
    clés: idxClés.map(i => tableClés[i]),
  }))
  const parNom = new Map(actions.map(a => [a.nom.toLowerCase(), a]))
  return { p: brut.p, nom: brut.nom, catégorie: brut.cat, actions, parNom, ressources: brut.res, clés }
}

export function créerCatalogue(charger) {
  let index = null
  let globales = null
  let parPréfixe = new Map()
  let globalesParClé = new Map()
  const services = new Map()
  const enCours = new Map()

  const cat = {
    // Charge l'index (liste des services) et les clés globales.
    async prêt() {
      if (index) return cat
      const [i, g] = await Promise.all([charger('index.json'), charger('globales.json')])
      index = i
      globales = g
      parPréfixe = new Map(i.services.map(s => [s.p.toLowerCase(), s]))
      globalesParClé = new Map(g.map(k => [k.k.toLowerCase(), k]))
      return cat
    },
    get source() { return index?.source },
    get catégories() { return index?.catégories ?? {} },
    préfixes: () => index?.services ?? [],
    globales: () => globales ?? [],
    existe: p => parPréfixe.has(String(p).toLowerCase()),
    infoService: p => parPréfixe.get(String(p).toLowerCase()) ?? null,
    nombreActionsTotal: () => (index?.services ?? []).reduce((s, x) => s + x.a, 0),
    // Charge les services demandés (préfixes, insensibles à la casse) ; ignore les inconnus.
    async charger(préfixes) {
      await cat.prêt()
      const demandés = [...new Set(préfixes.map(p => String(p).toLowerCase()))].filter(p => parPréfixe.has(p) && !services.has(p))
      await Promise.all(demandés.map(p => {
        if (!enCours.has(p)) {
          enCours.set(p, charger(`services/${parPréfixe.get(p).p}.json`).then(brut => { services.set(p, normaliserService(brut)); enCours.delete(p) }))
        }
        return enCours.get(p)
      }))
      return cat
    },
    service: p => services.get(String(p).toLowerCase()) ?? null,
    chargé: p => services.has(String(p).toLowerCase()),
    action: (p, nom) => services.get(String(p).toLowerCase())?.parNom.get(String(nom).toLowerCase()) ?? null,
    // Clé de condition : service, ou globale.
    trouverClé(clé, service) {
      const k = clé.toLowerCase()
      const s = service ? services.get(service.toLowerCase()) : null
      const exacte = s?.clés.get(k)
      if (exacte) return exacte
      if (s) for (const c of s.clés.values()) if (c.gabarit?.test(clé)) return c
      return cat.clécGlobale(clé)
    },
    clécGlobale(clé) {
      const k = clé.toLowerCase()
      const g = globalesParClé.get(k)
      if (g) return { clé: g.k, type: g.t, desc: '', catégorie: g.c, globale: true }
      // aws:PrincipalTag/Équipe → aws:PrincipalTag/tag-key
      const m = /^([^/]+)\/.+$/.exec(clé)
      if (m) {
        for (const gl of globales ?? []) if (gl.k.toLowerCase().startsWith(`${m[1].toLowerCase()}/`)) return { clé: gl.k, type: gl.t, desc: '', catégorie: gl.c, globale: true, gabarit: true }
      }
      return null
    },
  }
  return cat
}
