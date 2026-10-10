import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import donnéesPerso from '../data/memoriser-perso.json'
import donnéesPro from '../data/memoriser-pro.json'
import donnéesIdrissiPerso from '../data/memoriser-idrissi-perso.json'
import donnéesIdrissiPro from '../data/memoriser-idrissi-pro.json'
import { TOKEN_KEY, lireDepuisGitHub, écrireVersGitHub } from '../lib/githubSync'
import { useRelectureAuRetour } from '../lib/synchro'
import { fusionner, réconcilier, lireBase, écrireBase, annoncer } from '../lib/fusion'
import Icon from '../components/Icon'
import { BoutonIcone, Repli } from '../components/UI'
import { grotesk, serif, PALETTE, useTheme, useThemeMode } from '../lib/theme'
import OutilsTexte from '../components/OutilsTexte'
import { pageMémo } from '../lib/exportMemo'
import { adresseImage } from '../components/ImageCarte'
import {
  analyserTexte, TexteFormaté, texteBrut, lireTexte,
  lirePréférencesVoix, enregistrerPréférencesVoix, useVoix, STYLES_VOIX, nomDeLangue, qualitéVoix,
} from '../lib/texteFormate'
import { FOYERS, espacesPourTousLesFoyers } from '../lib/foyers'
import CarteBulles, { aDesPuces } from '../components/CarteBulles'
import DecoupeCarte from '../components/DecoupeCarte'
import CopiePaquet from '../components/CopiePaquet'
import { ImageCarte, ChampImage } from '../components/ImageCarte'
import ModePodcast from '../components/ModePodcast'
import ModeLecture from '../components/ModeLecture'
import EntretienSimule from '../components/EntretienSimule'
import { vérifierMotsClés } from '../lib/motsCles'

const EXTRAIT_VOIX = 'Liberté, égalité, fraternité.'

// « Audrey ★ Premium · français (France) » ; les voix déjà nommées avec leur
// langue (« Google français ») ne la répètent pas.
const LIBELLÉS_QUALITÉ = ['', ' ✦ Améliorée', ' ★ Premium']

function libelléVoix(v) {
  const langue = nomDeLangue(v.lang)
  const nom = v.name.replace(/\s*\((premium|enhanced|améliorée)\)\s*/i, '') + LIBELLÉS_QUALITÉ[qualitéVoix(v)]
  return v.name.toLowerCase().includes(langue.split(' ')[0]) ? nom : `${nom} · ${langue}`
}

const DONNÉES = {
  perso: donnéesPerso,
  pro: donnéesPro,
  'idrissi-perso': donnéesIdrissiPerso,
  'idrissi-pro': donnéesIdrissiPro,
}

const ESPACES = espacesPourTousLesFoyers((foyer, type, id) => ({
  titre: `Mémoriser ${type}`,
  eyebrow: `${foyer.nom} · Flashcards ${type}`,
  chemin: `react-blocks/src/data/memoriser-${id}.json`,
  stockage: `react-blocs-memoriser-${id}`,
  données: DONNÉES[id],
}))

// Répétition espacée façon Leitner : chaque carte a un niveau (index dans
// INTERVALLES) qui fixe dans combien de jours elle revient. Une bonne
// réponse fait monter d'un niveau (intervalle plus long), une mauvaise
// renvoie direct au niveau 0 (revue dès aujourd'hui).
const INTERVALLES = [0, 1, 3, 7, 14, 30, 90]

// Une carte ratée ce nombre de fois d'affilée (ou plus) rejoint le carnet
// des points faibles, indépendamment de son planning de révision Leitner.
const SEUIL_POINT_FAIBLE = 2

// Mode examen : temps alloué par carte avant révélation/correction forcée.
const DURÉE_EXAMEN = 20

function complète(objet) {
  return {
    paquets: Array.isArray(objet.paquets) ? objet.paquets : [],
    cartes: Array.isArray(objet.cartes) ? objet.cartes : [],
  }
}

function chargerDonnées(config) {
  try {
    const raw = localStorage.getItem(config.stockage)
    if (raw) return complète(JSON.parse(raw))
  } catch { /* ignore */ }
  return complète(config.données)
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10)
}

function dateDans(jours) {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

function mélanger(tableau) {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

// Indice progressif : 1 = initiales de chaque mot, puis on dévoile un
// tiers des mots à chaque palier, jusqu'à la réponse complète.
const NIVEAU_INDICE_MAX = 4

function construireIndice(verso, niveau) {
  const morceaux = texteBrut(verso).split(/(\s+)/)
  const nbMots = morceaux.filter(m => m.trim()).length
  const révélés = niveau <= 1 ? 0 : Math.ceil((nbMots * (niveau - 1)) / (NIVEAU_INDICE_MAX - 1))
  let rang = 0
  return morceaux.map(m => {
    if (!m.trim()) return m
    rang += 1
    if (rang <= révélés) return m
    return m.replace(/[\p{L}\p{N}]/gu, (c, i) => (i === m.search(/[\p{L}\p{N}]/u) ? c : '_'))
  }).join('')
}

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

export default function Memoriser() {
  const { espace: espaceParam } = useParams()
  const config = ESPACES[espaceParam] || ESPACES.perso
  const T = useTheme()
  const { mode, basculer } = useThemeMode()

  const [data, setData] = useState(() => chargerDonnées(config))
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [tokenSaisi, setTokenSaisi] = useState('')
  const [statutSync, setStatutSync] = useState(token ? 'chargement' : 'lecture')
  const [erreurSync, setErreurSync] = useState('')
  const [syncOuvert, setSyncOuvert] = useState(false)

  const [nouveauPaquetNom, setNouveauPaquetNom] = useState('')
  const [couleurPaquet, setCouleurPaquet] = useState(PALETTE[0])
  const [paquetOuvertId, setPaquetOuvertId] = useState(null)
  const [paquetÉditionId, setPaquetÉditionId] = useState(null)
  const [nomÉditionPaquet, setNomÉditionPaquet] = useState('')
  const [rechercheCarte, setRechercheCarte] = useState('')
  const [pdfPaquet, setPdfPaquet] = useState(null) // id du paquet à imprimer
  // Lien venant de la recherche de l'accueil : ?carte=… ouvre son paquet
  // filtré sur cette carte.
  const [paramètres, setParamètres] = useSearchParams()
  useEffect(() => {
    const id = paramètres.get('carte')
    if (!id) return
    const carte = data.cartes.find(c => c.id === id)
    if (!carte && ['chargement', 'lecture'].includes(statutSync)) return // attendre GitHub
    setParamètres({}, { replace: true })
    if (!carte) return
    setPaquetOuvertId(carte.paquetId)
    setRechercheCarte(texteBrut(carte.recto || '').slice(0, 40))
  }, [paramètres, data, statutSync]) // eslint-disable-line react-hooks/exhaustive-deps
  const [nouvelleCarte, setNouvelleCarte] = useState({})
  const [éditionCarteId, setÉditionCarteId] = useState(null)
  const [éditionRecto, setÉditionRecto] = useState('')
  const [éditionVerso, setÉditionVerso] = useState('')
  const [éditionImageRecto, setÉditionImageRecto] = useState(null)
  const [éditionImageVerso, setÉditionImageVerso] = useState(null)
  const [découpeCarteId, setDécoupeCarteId] = useState(null)
  const [copiePaquetId, setCopiePaquetId] = useState(null)

  const [vue, setVue] = useState('liste') // 'liste' | 'revision'
  const [paquetRévisionId, setPaquetRévisionId] = useState(null) // null = tous les paquets
  const [titreRévisionPersonnalisé, setTitreRévisionPersonnalisé] = useState(null)
  const [fileRévision, setFileRévision] = useState([])
  const [indexRévision, setIndexRévision] = useState(0)
  const [estRetournée, setEstRetournée] = useState(false)
  const [sues, setSues] = useState(0)
  const [estExamen, setEstExamen] = useState(false)
  const [estQCM, setEstQCM] = useState(false)
  const [tempsRestant, setTempsRestant] = useState(DURÉE_EXAMEN)
  const [réponseQCM, setRéponseQCM] = useState(null)
  const [lectureAuto, setLectureAuto] = useState(false)
  const [niveauIndice, setNiveauIndice] = useState(0)
  const [réponseSaisie, setRéponseSaisie] = useState('')
  const [écoute, setÉcoute] = useState(false)
  const [préférencesVoix, setPréférencesVoix] = useState(lirePréférencesVoix)
  const [réglagesVoixOuverts, setRéglagesVoixOuverts] = useState(false)
  const [carteBullesId, setCarteBullesId] = useState(null)
  const [modeVocal, setModeVocal] = useState(null) // { type: 'podcast' | 'entretien', paquetId }
  const { françaises: voixFrançaises, autres: voixAutres, total: totalVoix, actualiser: actualiserVoix } = useVoix()
  const voixDisponibles = préférencesVoix.autresLangues ? [...voixFrançaises, ...voixAutres] : voixFrançaises

  const majPréférencesVoix = changement => {
    const nouvelles = { ...préférencesVoix, ...changement }
    setPréférencesVoix(nouvelles)
    enregistrerPréférencesVoix(nouvelles)
    return nouvelles
  }

  const shaRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const ignoreProchaineÉcritureRef = useRef(false)
  const prêtPourSyncRef = useRef(false)
  const dernierEnvoiRef = useRef(null)
  const refsNouvelleCarte = useRef({})
  const refÉditionRecto = useRef(null)
  const refÉditionVerso = useRef(null)
  const examenIntervalRef = useRef(null)
  const reconnaissanceRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(config.stockage, JSON.stringify(data))
  }, [data, config.stockage])

  // Lecture depuis le fichier data/memoriser-{espace}.json du dépôt GitHub
  // (fonctionne sans token car le dépôt est public).
  // Relecture de GitHub au retour sur l'app, seulement si tout est envoyé.
  const [relecture, setRelecture] = useState(0)
  const donnéesActuellesRef = useRef(data)
  donnéesActuellesRef.current = data
  useRelectureAuRetour(() => {
    if (prêtPourSyncRef.current && JSON.stringify(donnéesActuellesRef.current) === dernierEnvoiRef.current) setRelecture(r => r + 1)
  })

  useEffect(() => {
    let annulé = false
    setStatutSync(s => (s === 'erreur' ? s : token ? 'chargement' : 'lecture'))
    lireDepuisGitHub(token, config.chemin)
      .then(({ data: distant, sha }) => {
        if (annulé) return
        shaRef.current = sha
        const distantComplet = complète(distant)
        // Modifications pas encore envoyées (hors ligne, erreur…) : fusionnées
        // avec la version en ligne au lieu d'être écrasées.
        const { données, àEnvoyer } = réconcilier({ distant: distantComplet, local: donnéesActuellesRef.current, base: lireBase(config.stockage) })
        dernierEnvoiRef.current = JSON.stringify(distantComplet)
        écrireBase(config.stockage, dernierEnvoiRef.current)
        if (!àEnvoyer) ignoreProchaineÉcritureRef.current = true
        setData(données)
        if (àEnvoyer) annoncer('Modifications faites hors ligne ajoutées à la version en ligne')
        setStatutSync(token ? 'connecté' : 'lecture-seule')
      })
      .catch(err => {
        if (annulé) return
        setStatutSync('erreur')
        setErreurSync(err.message)
      })
      .finally(() => { prêtPourSyncRef.current = true })
    return () => { annulé = true }
  }, [token, config.chemin, relecture])

  // Écriture différée vers GitHub après chaque modification, si un token
  // est configuré (le même que pour Programme/Notes).
  useEffect(() => {
    if (!token) return
    if (!prêtPourSyncRef.current) return
    if (ignoreProchaineÉcritureRef.current) { ignoreProchaineÉcritureRef.current = false; return }
    const contenu = JSON.stringify(data)
    if (contenu === dernierEnvoiRef.current) return
    clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      setStatutSync('synchronisation')
      const base = dernierEnvoiRef.current ? JSON.parse(dernierEnvoiRef.current) : undefined
      écrireVersGitHub(data, token, shaRef.current, config.chemin, base)
        .then(({ sha, données: écrites, fusionné }) => {
          shaRef.current = sha
          dernierEnvoiRef.current = fusionné ? JSON.stringify(écrites) : contenu
          écrireBase(config.stockage, dernierEnvoiRef.current)
          if (fusionné) {
            // Un autre appareil avait changé le fichier : on affiche la
            // fusion, sans perdre ce qui a été tapé depuis l'envoi.
            setData(courant => fusionner(data, courant, écrites))
            annoncer('Mis à jour avec les changements d\'un autre appareil')
          }
          setStatutSync('connecté')
        })
        .catch(err => {
          setStatutSync('erreur')
          setErreurSync(err.message)
        })
    }, 1500)
    return () => clearTimeout(syncTimeoutRef.current)
  }, [data, token, config.chemin])

  const connecterToken = () => {
    const t = tokenSaisi.trim()
    if (!t) return
    localStorage.setItem(TOKEN_KEY, t)
    setTokenSaisi('')
    setToken(t)
  }

  const déconnecterToken = () => {
    localStorage.removeItem(TOKEN_KEY)
    shaRef.current = null
    setToken('')
  }

  const ajouterPaquet = () => {
    const nom = nouveauPaquetNom.trim()
    if (!nom) return
    setData(d => ({ ...d, paquets: [...d.paquets, { id: uid(), nom, couleur: couleurPaquet }] }))
    setNouveauPaquetNom('')
  }

  const supprimerPaquet = (id, nom) => {
    const nb = data.cartes.filter(c => c.paquetId === id).length
    const message = nb > 0
      ? `Supprimer le paquet « ${nom} » et ${nb > 1 ? 'ses' : 'sa'} ${nb} carte${nb > 1 ? 's' : ''} ?`
      : `Supprimer le paquet « ${nom} » ?`
    if (!window.confirm(message)) return
    setData(d => ({
      ...d,
      paquets: d.paquets.filter(p => p.id !== id),
      cartes: d.cartes.filter(c => c.paquetId !== id),
    }))
    if (paquetOuvertId === id) setPaquetOuvertId(null)
  }

  const dupliquerPaquet = paquet => {
    const nouveauId = uid()
    const copiesCartes = data.cartes
      .filter(c => c.paquetId === paquet.id)
      .map(c => ({
        ...c, id: uid(), paquetId: nouveauId, niveau: 0, prochaineRevision: aujourdhuiISO(), fautesConsécutives: 0,
      }))
    setData(d => ({
      ...d,
      paquets: [...d.paquets, { id: nouveauId, nom: `${paquet.nom} (copie)`, couleur: paquet.couleur }],
      cartes: [...d.cartes, ...copiesCartes],
    }))
  }

  const exporterPourInterroger = paquet => {
    const cartes = data.cartes.filter(c => c.paquetId === paquet.id)
    if (cartes.length === 0) return
    const lignes = cartes.map((c, i) => `${i + 1}. ${texteBrut(c.recto)}\n   Réponse : ${texteBrut(c.verso)}`)
    const contenu = `${paquet.nom}\n${'='.repeat(paquet.nom.length)}\n\n${lignes.join('\n\n')}\n`
    const blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${paquet.nom.replace(/[^\w\-]+/g, '_') || 'paquet'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const basculerPaquetOuvert = id => {
    setPaquetOuvertId(p => (p === id ? null : id))
    setRechercheCarte('')
  }

  const démarrerÉditionPaquet = paquet => {
    setPaquetÉditionId(paquet.id)
    setNomÉditionPaquet(paquet.nom)
  }

  const validerÉditionPaquet = id => {
    const nom = nomÉditionPaquet.trim()
    setPaquetÉditionId(null)
    if (!nom) return
    setData(d => ({ ...d, paquets: d.paquets.map(p => p.id === id ? { ...p, nom } : p) }))
  }

  const ajouterCarte = paquetId => {
    const saisie = nouvelleCarte[paquetId] || {}
    const recto = (saisie.recto || '').trim()
    const verso = (saisie.verso || '').trim()
    if (!recto || !verso) return
    setData(d => ({
      ...d,
      cartes: [...d.cartes, { id: uid(), paquetId, recto, verso, niveau: 0, prochaineRevision: aujourdhuiISO() }],
    }))
    setNouvelleCarte(n => ({ ...n, [paquetId]: { recto: '', verso: '' } }))
  }

  const supprimerCarte = id => {
    setData(d => ({ ...d, cartes: d.cartes.filter(c => c.id !== id) }))
  }

  const dupliquerCarte = carte => {
    setData(d => ({
      ...d,
      cartes: [...d.cartes, { ...carte, id: uid(), niveau: 0, prochaineRevision: aujourdhuiISO(), fautesConsécutives: 0 }],
    }))
  }

  const démarrerÉditionCarte = carte => {
    setÉditionCarteId(carte.id)
    setÉditionRecto(carte.recto)
    setÉditionVerso(carte.verso)
    setÉditionImageRecto(carte.imageRecto || null)
    setÉditionImageVerso(carte.imageVerso || null)
  }

  const validerÉditionCarte = id => {
    const recto = éditionRecto.trim()
    const verso = éditionVerso.trim()
    setÉditionCarteId(null)
    if (!recto || !verso) return
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => {
        if (c.id !== id) return c
        const maj = { ...c, recto, verso, imageRecto: éditionImageRecto, imageVerso: éditionImageVerso }
        if (!maj.imageRecto) delete maj.imageRecto
        if (!maj.imageVerso) delete maj.imageVerso
        return maj
      }),
    }))
  }

  // Remplace une longue carte par plusieurs petites (placées juste après elle),
  // chacune repartant de zéro dans la répétition espacée.
  const découperCarte = (origine, morceaux, supprimerOrigine) => {
    const aujourd = aujourdhuiISO()
    const nouvelles = morceaux.map(m => ({
      id: uid(), paquetId: origine.paquetId, recto: m.recto.trim(), verso: m.verso.trim(),
      niveau: 0, prochaineRevision: aujourd,
      ...(origine.imageRecto ? { imageRecto: origine.imageRecto } : {}),
    }))
    setData(d => {
      const cartes = [...d.cartes]
      cartes.splice(cartes.findIndex(c => c.id === origine.id) + 1, 0, ...nouvelles)
      return { ...d, cartes: supprimerOrigine ? cartes.filter(c => c.id !== origine.id) : cartes }
    })
    setDécoupeCarteId(null)
  }

  // Copie un paquet dans le fichier d'un autre espace (autre foyer, ou
  // perso ↔ pro) : lecture de sa version GitHub, ajout, écriture.
  const copierPaquetVers = async (paquet, espaceId) => {
    const destination = ESPACES[espaceId]
    const { data: distant, sha } = await lireDepuisGitHub(token, destination.chemin)
    const base = complète(distant)
    const nomsPris = new Set(base.paquets.map(p => p.nom))
    let nom = paquet.nom
    for (let n = 2; nomsPris.has(nom); n++) nom = `${paquet.nom} (${n})`
    const nouveauId = uid()
    const cartes = data.cartes
      .filter(c => c.paquetId === paquet.id)
      .map(c => ({ ...c, id: uid(), paquetId: nouveauId, niveau: 0, prochaineRevision: aujourdhuiISO(), fautesConsécutives: 0 }))
    const fusion = { ...base, paquets: [...base.paquets, { id: nouveauId, nom, couleur: paquet.couleur }], cartes: [...base.cartes, ...cartes] }
    await écrireVersGitHub(fusion, token, sha, destination.chemin)
    try { localStorage.setItem(destination.stockage, JSON.stringify(fusion)) } catch { /* ignore */ }
    return { nom }
  }

  const cartesDues = paquetId => {
    const auj = aujourdhuiISO()
    return data.cartes.filter(c => (!paquetId || c.paquetId === paquetId) && (!c.prochaineRevision || c.prochaineRevision <= auj))
  }

  const démarrerRévision = (paquetId, { tout = false, cartesIds = null, titre = null, examen = false, qcm = false } = {}) => {
    const source = cartesIds
      ? data.cartes.filter(c => cartesIds.includes(c.id))
      : tout
        ? data.cartes.filter(c => !paquetId || c.paquetId === paquetId)
        : cartesDues(paquetId)
    const file = mélanger(source.map(c => c.id))
    if (file.length === 0) return
    setPaquetRévisionId(paquetId)
    setTitreRévisionPersonnalisé(titre)
    setFileRévision(file)
    setIndexRévision(0)
    setEstRetournée(false)
    setSues(0)
    setEstExamen(examen)
    setEstQCM(qcm)
    setVue('revision')
    if (lectureAuto) {
      const première = data.cartes.find(c => c.id === file[0])
      if (première) lireTexte(première.recto)
    }
  }

  const répondre = su => {
    const carteId = fileRévision[indexRévision]
    const indexSuivant = indexRévision + 1
    setData(d => ({
      ...d,
      cartes: d.cartes.map(c => {
        if (c.id !== carteId) return c
        const niveau = su ? Math.min((c.niveau || 0) + 1, INTERVALLES.length - 1) : 0
        const fautesConsécutives = su ? 0 : (c.fautesConsécutives || 0) + 1
        return { ...c, niveau, prochaineRevision: dateDans(INTERVALLES[niveau]), fautesConsécutives }
      }),
    }))
    if (su) setSues(s => s + 1)
    setEstRetournée(false)
    setIndexRévision(indexSuivant)
    if (lectureAuto && indexSuivant < fileRévision.length) {
      const prochaine = data.cartes.find(c => c.id === fileRévision[indexSuivant])
      if (prochaine) lireTexte(prochaine.recto)
    }
  }

  const choisirQCM = option => {
    if (réponseQCM) return
    clearInterval(examenIntervalRef.current)
    setRéponseQCM(option.id)
    const correct = option.id === carteActuelle?.id
    setTimeout(() => répondre(correct), 900)
  }

  const arrêterDictée = () => {
    reconnaissanceRef.current?.stop()
    reconnaissanceRef.current = null
    setÉcoute(false)
  }

  const basculerDictée = () => {
    if (!SpeechRecognitionAPI) return
    if (écoute) { arrêterDictée(); return }
    window.speechSynthesis?.cancel()
    const r = new SpeechRecognitionAPI()
    r.lang = 'fr-FR'
    r.continuous = true
    r.interimResults = false
    r.onresult = e => {
      let texte = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) texte += e.results[i][0].transcript
      }
      if (texte.trim()) setRéponseSaisie(s => (s ? `${s} ` : '') + texte.trim())
    }
    r.onend = () => setÉcoute(false)
    r.onerror = () => setÉcoute(false)
    reconnaissanceRef.current = r
    r.start()
    setÉcoute(true)
  }

  const retournerCarte = () => {
    clearInterval(examenIntervalRef.current)
    arrêterDictée()
    const nouvel = !estRetournée
    setEstRetournée(nouvel)
    if (lectureAuto) lireTexte(nouvel ? carteActuelle?.verso : carteActuelle?.recto, { réponse: nouvel })
  }

  const quitterRévision = () => {
    clearInterval(examenIntervalRef.current)
    arrêterDictée()
    setVue('liste')
    setFileRévision([])
  }

  const statutCouleur = {
    lecture: T.textMuted, 'lecture-seule': T.textMuted, chargement: T.accent,
    synchronisation: T.accent, connecté: '#7fb069', erreur: T.danger,
  }[statutSync]

  const statutLabel = {
    lecture: 'Lecture depuis le dépôt…',
    'lecture-seule': 'Lecture seule — pas de token connecté',
    chargement: 'Lecture depuis GitHub…',
    synchronisation: 'Synchronisation en cours…',
    connecté: 'Synchronisé avec GitHub',
    erreur: erreurSync || 'Erreur de synchronisation',
  }[statutSync]

  const totalDû = cartesDues(null).length
  const pointsFaibles = data.cartes.filter(c => (c.fautesConsécutives || 0) >= SEUIL_POINT_FAIBLE)
  const carteActuelle = data.cartes.find(c => c.id === fileRévision[indexRévision])
  const nomPaquetRévision = paquetRévisionId ? data.paquets.find(p => p.id === paquetRévisionId)?.nom : null
  const titreRévision = titreRévisionPersonnalisé || nomPaquetRévision || 'Tous les paquets'

  // Options du QCM pour la carte en cours : la bonne réponse + jusqu'à 3
  // réponses piquées au hasard dans d'autres cartes du même périmètre
  // (paquet, ou tous les paquets en mode « tous »).
  const optionsQCM = useMemo(() => {
    if (!estQCM || !carteActuelle) return []
    const périmètre = data.cartes.filter(c => !paquetRévisionId || c.paquetId === paquetRévisionId)
    const autres = mélanger(périmètre.filter(c => c.id !== carteActuelle.id)).slice(0, 3)
    return mélanger([carteActuelle, ...autres])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estQCM, carteActuelle?.id, paquetRévisionId])

  // Remet à zéro tout ce qui est propre à une carte (QCM, indice,
  // réponse saisie, dictée) à chaque nouvelle carte.
  useEffect(() => {
    setRéponseQCM(null)
    setNiveauIndice(0)
    setRéponseSaisie('')
    reconnaissanceRef.current?.stop()
    reconnaissanceRef.current = null
    setÉcoute(false)
  }, [indexRévision])

  useEffect(() => () => reconnaissanceRef.current?.stop(), [])

  const vérification = estRetournée && réponseSaisie.trim() && carteActuelle
    ? vérifierMotsClés(carteActuelle.verso, réponseSaisie)
    : null
  const nbTrouvés = vérification ? vérification.filter(v => v.trouvé).length : 0

  // Minuteur du mode examen : revient à DURÉE_EXAMEN à chaque nouvelle
  // carte, et force la révélation (ou une réponse « ratée ») à zéro.
  useEffect(() => {
    clearInterval(examenIntervalRef.current)
    if (!estExamen || vue !== 'revision' || indexRévision >= fileRévision.length) return
    setTempsRestant(DURÉE_EXAMEN)
    let restant = DURÉE_EXAMEN
    examenIntervalRef.current = setInterval(() => {
      restant -= 1
      setTempsRestant(restant)
      if (restant <= 0) {
        clearInterval(examenIntervalRef.current)
        if (estQCM) {
          setRéponseQCM(id => id ?? '__temps_écoulé__')
          setTimeout(() => répondre(false), 900)
        } else {
          setEstRetournée(true)
        }
      }
    }, 1000)
    return () => clearInterval(examenIntervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estExamen, estQCM, vue, indexRévision])

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '40px 16px 60px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link to={FOYERS[config.foyer].accueil} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.textMuted, fontSize: '13px', fontFamily: grotesk }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <div style={{ display: 'flex', gap: '2px' }}>
            <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
            <Link to={`/taches/${config.id}`} title="Tâches" aria-label="Tâches" style={{
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '7px', color: T.textMuted,
            }}><Icon nom="checklist" taille={15} /></Link>
            <Link to={`/notes/${config.id}`} title="Notes" aria-label="Notes" style={{
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '7px', color: T.textMuted,
            }}><Icon nom="note" taille={15} /></Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginBottom: '22px' }}>
          <div>
            <p style={{
              fontFamily: grotesk, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: T.accent, margin: '0 0 4px', fontWeight: 600,
            }}>{config.eyebrow}</p>
            <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '34px', color: T.text, margin: 0, lineHeight: 1.1 }}>
              {config.titre}
            </h1>
          </div>
          <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '3px', flexShrink: 0 }}>
            {Object.values(ESPACES).filter(e => e.foyer === config.foyer).map(e => (
              <Link
                key={e.id}
                to={`/memoriser/${e.id}`}
                style={{
                  fontSize: '11px', fontFamily: grotesk, fontWeight: 600, padding: '6px 10px', borderRadius: '6px',
                  background: e.id === config.id ? T.accent : 'transparent',
                  color: e.id === config.id ? T.accentText : T.textMuted,
                }}
              >{e.type === 'perso' ? 'Perso' : 'Pro'}</Link>
            ))}
          </div>
        </div>

        <Repli
          icon={<span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statutCouleur, flexShrink: 0 }} />}
          texte={statutLabel}
          ouvert={syncOuvert}
          onToggle={() => setSyncOuvert(o => !o)}
          marginBottom={syncOuvert ? '8px' : '22px'}
        />

        {syncOuvert && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', marginBottom: '22px' }}>
            {token ? (
              <button onClick={déconnecterToken} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: T.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}><Icon nom="x" taille={13} /> Déconnecter le token</button>
            ) : (
              <div>
                <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 10px', lineHeight: '1.6' }}>
                  Colle un token GitHub (le même que pour Programme et Notes) pour synchroniser <code style={{ background: T.bg, padding: '1px 5px', borderRadius: '4px' }}>memoriser-{config.id}.json</code> sur tous tes appareils.
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="password"
                    value={tokenSaisi}
                    onChange={e => setTokenSaisi(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') connecterToken() }}
                    placeholder="github_pat_…"
                    style={{
                      flex: 1, background: T.bg, color: T.text,
                      border: `1px solid ${T.border}`, borderRadius: '7px',
                      padding: '9px 10px', fontSize: '13px', outline: 'none',
                    }}
                  />
                  <button onClick={connecterToken} style={{
                    background: T.accent, color: T.accentText, border: 'none', fontWeight: 600,
                    borderRadius: '7px', padding: '0 16px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                  }}>Connecter</button>
                </div>
              </div>
            )}
          </div>
        )}

        {vue === 'liste' ? (
          <>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: totalDû > 0 ? '12px' : '0' }}>
                <Icon nom="repeter" taille={16} style={{ color: T.accent }} />
                <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '16px', color: T.text }}>
                  {totalDû > 0 ? `${totalDû} carte${totalDû > 1 ? 's' : ''} à réviser aujourd'hui` : "Rien à réviser aujourd'hui"}
                </strong>
              </div>
              {totalDû > 0 && (
                <button onClick={() => démarrerRévision(null)} style={{
                  background: T.accent, color: T.accentText, border: 'none', fontWeight: 600,
                  borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}><Icon nom="repeter" taille={14} /> Réviser tout</button>
              )}
            </div>

            {pointsFaibles.length > 0 && (
              <div style={{ background: T.dangerSoft, border: `1px solid ${T.danger}55`, borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px' }}>⚠️</span>
                  <strong style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '16px', color: T.text }}>
                    {pointsFaibles.length} point{pointsFaibles.length > 1 ? 's' : ''} faible{pointsFaibles.length > 1 ? 's' : ''}
                  </strong>
                </div>
                <p style={{ fontSize: '11.5px', color: T.textMuted, margin: '0 0 12px', lineHeight: '1.5' }}>
                  Cartes ratées {SEUIL_POINT_FAIBLE} fois ou plus d'affilée, tous paquets confondus.
                </p>
                <button onClick={() => démarrerRévision(null, { cartesIds: pointsFaibles.map(c => c.id), titre: 'Points faibles' })} style={{
                  background: T.danger, color: '#fff', border: 'none', fontWeight: 600,
                  borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}><Icon nom="repeter" taille={14} /> Réviser les points faibles</button>
              </div>
            )}

            {data.paquets.length === 0 && (
              <p style={{ fontSize: '13px', color: T.textMuted, textAlign: 'center', margin: '0 0 22px', lineHeight: '1.6' }}>
                Aucun paquet pour l'instant. Crée-en un ci-dessous pour commencer à ajouter des cartes.
              </p>
            )}

            {data.paquets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                {data.paquets.map(paquet => {
                  const cartesPaquet = data.cartes.filter(c => c.paquetId === paquet.id)
                  const dues = cartesDues(paquet.id).length
                  const ouvert = paquetOuvertId === paquet.id
                  return (
                    <div key={paquet.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: paquet.couleur, flexShrink: 0 }} />
                        {paquetÉditionId === paquet.id ? (
                          <input
                            autoFocus
                            value={nomÉditionPaquet}
                            onChange={e => setNomÉditionPaquet(e.target.value)}
                            onBlur={() => validerÉditionPaquet(paquet.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); validerÉditionPaquet(paquet.id) }
                              if (e.key === 'Escape') setPaquetÉditionId(null)
                            }}
                            style={{
                              flex: 1, minWidth: 0, background: T.bg, color: T.text,
                              border: `1px solid ${T.accent}`, borderRadius: '6px',
                              padding: '3px 7px', fontSize: '14px', fontWeight: 600, outline: 'none', fontFamily: grotesk,
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => basculerPaquetOuvert(paquet.id)}
                            style={{
                              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                              background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <strong style={{ fontFamily: grotesk, fontSize: '14px', color: T.text, fontWeight: 600 }}>{paquet.nom}</strong>
                            <span style={{ fontSize: '11px', color: T.textMuted }}>
                              {cartesPaquet.length} carte{cartesPaquet.length > 1 ? 's' : ''}{dues > 0 ? ` · ${dues} à réviser` : ''}
                            </span>
                          </button>
                        )}
                        <BoutonIcone icon="crayon" title="Renommer ce paquet" taille={13} onClick={() => démarrerÉditionPaquet(paquet)} />
                        <BoutonIcone icon="telecharger" title="Exporter en .txt pour se faire interroger" taille={13} onClick={() => exporterPourInterroger(paquet)} />
                        <BoutonIcone icon="dupliquer" title="Dupliquer ou copier vers un autre espace" taille={13} onClick={() => setCopiePaquetId(paquet.id)} />
                        <BoutonIcone icon="corbeille" title="Supprimer ce paquet" couleur={T.danger} taille={13} onClick={() => supprimerPaquet(paquet.id, paquet.nom)} />
                        <BoutonIcone icon={ouvert ? 'chevronHaut' : 'chevronBas'} title={ouvert ? 'Replier' : 'Voir les cartes'} taille={13} onClick={() => basculerPaquetOuvert(paquet.id)} />
                      </div>

                      {cartesPaquet.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                          <button onClick={() => setModeVocal({ type: 'lecture', paquetId: paquet.id })} style={{
                            display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                            border: `1px solid ${T.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                          }}>📖 Lecture</button>
                          {dues > 0 && (
                            <button onClick={() => démarrerRévision(paquet.id)} style={{
                              display: 'flex', alignItems: 'center', gap: '5px', background: T.accentSoft, color: T.accent,
                              border: `1px solid ${T.accent}55`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                              fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                            }}><Icon nom="repeter" taille={12} /> Réviser les {dues} due{dues > 1 ? 's' : ''}</button>
                          )}
                          <button onClick={() => démarrerRévision(paquet.id, { tout: true })} style={{
                            display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                            border: `1px solid ${T.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                          }}><Icon nom="checklist" taille={12} /> Réviser tout le paquet ({cartesPaquet.length})</button>
                          <button onClick={() => démarrerRévision(paquet.id, { tout: true, examen: true })} style={{
                            display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                            border: `1px solid ${T.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                          }}><Icon nom="horloge" taille={12} /> Mode examen</button>
                          {cartesPaquet.length >= 2 && (
                            <button onClick={() => démarrerRévision(paquet.id, { tout: true, qcm: true })} style={{
                              display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                              border: `1px solid ${T.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                              fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                            }}><Icon nom="radio" taille={12} /> QCM</button>
                          )}
                          <button onClick={() => setModeVocal({ type: 'podcast', paquetId: paquet.id })} style={{
                            display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                            border: `1px solid ${T.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                          }}>🎧 Podcast</button>
                          <button onClick={() => setModeVocal({ type: 'entretien', paquetId: paquet.id })} style={{
                            display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                            border: `1px solid ${T.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                          }}>🎙️ Entretien</button>
                          <button onClick={() => setPdfPaquet(paquet.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                            border: `1px solid ${T.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11.5px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                          }}>🖨️ PDF</button>
                        </div>
                      )}

                      {ouvert && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {cartesPaquet.length > 0 && (
                            <div style={{ position: 'relative' }}>
                              <input
                                value={rechercheCarte}
                                onChange={e => setRechercheCarte(e.target.value)}
                                placeholder="Rechercher une carte…"
                                style={{
                                  width: '100%', background: T.bg, color: T.text, border: `1px solid ${T.border}`,
                                  borderRadius: '7px', padding: '7px 9px', fontSize: '12.5px', boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          )}
                          {(() => {
                            const q = rechercheCarte.trim().toLowerCase()
                            const cartesAffichées = q
                              ? cartesPaquet.filter(c => c.recto.toLowerCase().includes(q) || c.verso.toLowerCase().includes(q))
                              : cartesPaquet
                            if (q && cartesAffichées.length === 0) {
                              return <p style={{ fontSize: '12px', color: T.textMuted, margin: '2px 0' }}>Aucune carte ne correspond à « {rechercheCarte.trim()} ».</p>
                            }
                            return cartesAffichées.map(carte => (
                            <div key={carte.id} style={{ background: T.surface2, borderRadius: '8px', padding: '8px 10px', border: `1px solid ${T.border}` }}>
                              {éditionCarteId === carte.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <div>
                                    <input
                                      autoFocus
                                      ref={refÉditionRecto}
                                      value={éditionRecto}
                                      onChange={e => setÉditionRecto(e.target.value)}
                                      placeholder="Recto"
                                      style={{
                                        width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text,
                                        border: `1px solid ${T.accent}`, borderRadius: '6px', padding: '6px 8px', fontSize: '12.5px',
                                      }}
                                    />
                                    <OutilsTexte T={T} obtenirInput={() => refÉditionRecto.current} valeur={éditionRecto} setValeur={setÉditionRecto} />
                                    <ChampImage image={éditionImageRecto} onChange={setÉditionImageRecto} token={token} libellé="Image côté question" />
                                  </div>
                                  <div>
                                    <input
                                      ref={refÉditionVerso}
                                      value={éditionVerso}
                                      onChange={e => setÉditionVerso(e.target.value)}
                                      placeholder="Verso"
                                      onKeyDown={e => { if (e.key === 'Enter') validerÉditionCarte(carte.id) }}
                                      style={{
                                        width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text,
                                        border: `1px solid ${T.accent}`, borderRadius: '6px', padding: '6px 8px', fontSize: '12.5px',
                                      }}
                                    />
                                    <OutilsTexte T={T} obtenirInput={() => refÉditionVerso.current} valeur={éditionVerso} setValeur={setÉditionVerso} />
                                    <ChampImage image={éditionImageVerso} onChange={setÉditionImageVerso} token={token} libellé="Image côté réponse" />
                                  </div>
                                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setÉditionCarteId(null)} style={{ fontSize: '12px', color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Annuler</button>
                                    <button onClick={() => validerÉditionCarte(carte.id)} style={{ fontSize: '12px', color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Valider</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    {(carte.imageRecto || carte.imageVerso) && (
                                      <ImageCarte image={carte.imageRecto || carte.imageVerso} hauteurMax={56} style={{ margin: '0 0 6px', maxWidth: '96px' }} />
                                    )}
                                    <p style={{ margin: 0, fontSize: '12.5px', wordBreak: 'break-word' }}>
                                      {(carte.fautesConsécutives || 0) >= SEUIL_POINT_FAIBLE && <span title="Point faible" style={{ marginRight: '4px' }}>⚠️</span>}
                                      <TexteFormaté texte={carte.recto} couleurDéfaut={T.text} />
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', wordBreak: 'break-word' }}><TexteFormaté texte={carte.verso} couleurDéfaut={T.textMuted} /></p>
                                  </div>
                                  <BoutonIcone icon="bulles" title="Voir en bulles" taille={13} onClick={() => setCarteBullesId(carte.id)} />
                                  {aDesPuces(carte.verso) && (
                                    <BoutonIcone icon="ciseaux" title="Découper en petites cartes" taille={13} onClick={() => setDécoupeCarteId(carte.id)} />
                                  )}
                                  <BoutonIcone icon="crayon" title="Modifier" taille={13} onClick={() => démarrerÉditionCarte(carte)} />
                                  <BoutonIcone icon="dupliquer" title="Dupliquer" taille={13} onClick={() => dupliquerCarte(carte)} />
                                  <BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} taille={13} onClick={() => supprimerCarte(carte.id)} />
                                </div>
                              )}
                            </div>
                            ))
                          })()}

                          <form onSubmit={e => { e.preventDefault(); ajouterCarte(paquet.id) }} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                            <div>
                              <input
                                ref={el => {
                                  if (!refsNouvelleCarte.current[paquet.id]) refsNouvelleCarte.current[paquet.id] = {}
                                  refsNouvelleCarte.current[paquet.id].recto = el
                                }}
                                value={(nouvelleCarte[paquet.id] || {}).recto || ''}
                                onChange={e => setNouvelleCarte(n => ({ ...n, [paquet.id]: { ...(n[paquet.id] || {}), recto: e.target.value } }))}
                                placeholder="Recto (question)"
                                style={{
                                  width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text,
                                  border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 9px', fontSize: '12.5px',
                                }}
                              />
                              <OutilsTexte
                                T={T}
                                obtenirInput={() => refsNouvelleCarte.current[paquet.id]?.recto}
                                valeur={(nouvelleCarte[paquet.id] || {}).recto || ''}
                                setValeur={v => setNouvelleCarte(n => ({ ...n, [paquet.id]: { ...(n[paquet.id] || {}), recto: v } }))}
                              />
                            </div>
                            <div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                  ref={el => {
                                    if (!refsNouvelleCarte.current[paquet.id]) refsNouvelleCarte.current[paquet.id] = {}
                                    refsNouvelleCarte.current[paquet.id].verso = el
                                  }}
                                  value={(nouvelleCarte[paquet.id] || {}).verso || ''}
                                  onChange={e => setNouvelleCarte(n => ({ ...n, [paquet.id]: { ...(n[paquet.id] || {}), verso: e.target.value } }))}
                                  placeholder="Verso (réponse)"
                                  style={{
                                    flex: 1, minWidth: 0, background: T.bg, color: T.text,
                                    border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 9px', fontSize: '12.5px',
                                  }}
                                />
                                <button type="submit" style={{
                                  background: T.accent, color: T.accentText, border: 'none', borderRadius: '6px', width: '32px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                                }}><Icon nom="plus" taille={14} /></button>
                              </div>
                              <OutilsTexte
                                T={T}
                                obtenirInput={() => refsNouvelleCarte.current[paquet.id]?.verso}
                                valeur={(nouvelleCarte[paquet.id] || {}).verso || ''}
                                setValeur={v => setNouvelleCarte(n => ({ ...n, [paquet.id]: { ...(n[paquet.id] || {}), verso: v } }))}
                              />
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontFamily: grotesk }}>Nouveau paquet</p>
              <form onSubmit={e => { e.preventDefault(); ajouterPaquet() }} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={nouveauPaquetNom}
                  onChange={e => setNouveauPaquetNom(e.target.value)}
                  placeholder="Nom du paquet…"
                  style={{ flex: 1, minWidth: '120px', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '8px 10px', fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  {PALETTE.map(couleur => (
                    <button key={couleur} type="button" onClick={() => setCouleurPaquet(couleur)} style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: couleur, cursor: 'pointer',
                      border: couleurPaquet === couleur ? `2px solid ${T.text}` : '2px solid transparent',
                    }} />
                  ))}
                </div>
                <button type="submit" style={{
                  background: T.accent, color: T.accentText, border: 'none', borderRadius: '7px',
                  padding: '0 14px', height: '34px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk, fontWeight: 600,
                }}>Créer</button>
              </form>
            </div>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <button onClick={quitterRévision} style={{
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: T.textMuted,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: grotesk,
              }}><Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Quitter</button>
              <span style={{ fontSize: '12px', color: T.textMuted, fontFamily: grotesk }}>
                {titreRévision} · {Math.min(indexRévision + 1, fileRévision.length)}/{fileRévision.length}
              </span>
            </div>

            {indexRévision < fileRévision.length && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                {estExamen ? (
                  <span style={{ fontSize: '12px', fontFamily: grotesk, fontWeight: 700, color: tempsRestant <= 5 ? T.danger : T.textMuted }}>
                    ⏱ {tempsRestant}s
                  </span>
                ) : <span />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => setLectureAuto(a => !a)} title="Lecture automatique à voix haute" style={{
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: grotesk,
                    background: lectureAuto ? T.accentSoft : 'transparent', color: lectureAuto ? T.accent : T.textMuted,
                    border: `1px solid ${lectureAuto ? T.accent : T.border}`, borderRadius: '20px', padding: '4px 10px', cursor: 'pointer',
                  }}>{lectureAuto ? '🔊' : '🔈'} Auto</button>
                  <button
                    onClick={() => (!estQCM && estRetournée
                      ? lireTexte(carteActuelle?.verso, { réponse: true })
                      : lireTexte(carteActuelle?.recto))}
                    title="Écouter"
                    style={{
                      width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
                    }}
                  >🔊</button>
                  {estRetournée && !estQCM && (
                    <button
                      onClick={() => setCarteBullesId(carteActuelle?.id)}
                      title="Voir la réponse en bulles"
                      style={{
                        height: '26px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: grotesk,
                        background: 'transparent', color: T.textMuted, border: `1px solid ${T.border}`,
                        borderRadius: '20px', padding: '0 10px', cursor: 'pointer',
                      }}
                    ><Icon nom="bulles" taille={12} /> Bulles</button>
                  )}
                  <button
                    onClick={() => setRéglagesVoixOuverts(o => !o)}
                    title="Choisir la voix"
                    style={{
                      height: '26px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: grotesk,
                      background: réglagesVoixOuverts ? T.accentSoft : 'transparent', color: réglagesVoixOuverts ? T.accent : T.textMuted,
                      border: `1px solid ${réglagesVoixOuverts ? T.accent : T.border}`, borderRadius: '20px', padding: '0 10px', cursor: 'pointer',
                    }}
                  >🗣️ Voix</button>
                </div>
              </div>
            )}

            {réglagesVoixOuverts && indexRévision < fileRévision.length && (
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px',
                padding: '14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '16px',
              }}>
                <div>
                  <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontFamily: grotesk }}>
                    Style
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '6px' }}>
                    {STYLES_VOIX.map(st => {
                      const actif = préférencesVoix.style === st.id
                      return (
                        <button
                          key={st.id}
                          onClick={() => {
                            const nouvelles = majPréférencesVoix({ style: st.id, vitesse: st.vitesse, hauteur: st.hauteur })
                            lireTexte(EXTRAIT_VOIX, { préférences: nouvelles })
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 8px', borderRadius: '8px',
                            fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            background: actif ? T.accentSoft : T.surface2, color: actif ? T.accent : T.text,
                            border: `1px solid ${actif ? T.accent : T.border}`, fontWeight: actif ? 700 : 400,
                          }}
                        ><span>{st.emoji}</span>{st.nom}</button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontFamily: grotesk }}>
                    Voix des questions
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ flex: 1, fontSize: '11.5px', color: T.textMuted, lineHeight: 1.4 }}>
                      Le navigateur voit {totalVoix} voix sur cet appareil, dont {voixFrançaises.length} en français.
                      Les voix « Siri » n'en font jamais partie (Apple les réserve à l'iPhone).
                    </span>
                    <button onClick={actualiserVoix} style={{
                      flexShrink: 0, fontSize: '11.5px', fontFamily: grotesk, fontWeight: 600, padding: '5px 10px', borderRadius: '20px',
                      background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer',
                    }}>🔄 Actualiser</button>
                  </div>
                  {voixDisponibles.length === 0 ? (
                    <p style={{ fontSize: '12px', color: T.textMuted, margin: 0, lineHeight: '1.5' }}>
                      Aucune voix détectée : la voix par défaut du navigateur est utilisée.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                      {[{ voiceURI: '', name: 'Par défaut', lang: 'fr' }, ...voixDisponibles].map(v => {
                        const choisie = préférencesVoix.voix === v.voiceURI
                        return (
                          <div key={v.voiceURI || 'défaut'} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 6px 6px 10px', borderRadius: '8px',
                            background: choisie ? T.accentSoft : T.surface2, border: `1px solid ${choisie ? T.accent : T.border}`,
                          }}>
                            <button
                              onClick={() => majPréférencesVoix({ voix: v.voiceURI })}
                              style={{
                                flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: '2px 0',
                                cursor: 'pointer', fontSize: '12.5px', color: choisie ? T.accent : T.text,
                                fontWeight: choisie ? 700 : 400, fontFamily: 'inherit',
                              }}
                            >{choisie ? '● ' : ''}{v.voiceURI ? libelléVoix(v) : 'Par défaut'}</button>
                            <button
                              onClick={() => lireTexte(EXTRAIT_VOIX, { voix: v.voiceURI })}
                              title="Écouter un extrait"
                              style={{
                                width: '28px', height: '28px', flexShrink: 0, background: 'transparent',
                                border: `1px solid ${T.border}`, borderRadius: '50%', cursor: 'pointer', fontSize: '12px', color: T.text,
                              }}
                            >▶︎</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {voixAutres.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px', fontSize: '12px', color: T.textMuted, cursor: 'pointer', lineHeight: '1.4' }}>
                      <input
                        type="checkbox"
                        checked={préférencesVoix.autresLangues}
                        onChange={e => majPréférencesVoix({ autresLangues: e.target.checked })}
                        style={{ accentColor: T.accent, marginTop: '2px' }}
                      />
                      <span>Ajouter les {voixAutres.length} voix d'autres langues (elles lisent le français avec leur accent)</span>
                    </label>
                  )}
                </div>

                {voixDisponibles.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontFamily: grotesk }}>
                      Voix des réponses
                    </p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        value={préférencesVoix.voixRéponse}
                        onChange={e => majPréférencesVoix({ voixRéponse: e.target.value })}
                        style={{
                          flex: 1, minWidth: 0, fontSize: '12.5px', color: T.text, background: T.bg,
                          border: `1px solid ${T.border}`, borderRadius: '8px', padding: '7px 8px',
                        }}
                      >
                        <option value="">Même voix que les questions</option>
                        {voixDisponibles.map(v => <option key={v.voiceURI} value={v.voiceURI}>{libelléVoix(v)}</option>)}
                      </select>
                      <button
                        onClick={() => lireTexte(EXTRAIT_VOIX, { réponse: true })}
                        title="Écouter la voix des réponses"
                        style={{
                          width: '32px', flexShrink: 0, background: 'transparent', border: `1px solid ${T.border}`,
                          borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: T.text,
                        }}
                      >▶︎</button>
                    </div>
                  </div>
                )}

                {[
                  { clé: 'vitesse', libellé: 'Vitesse', min: 0.5, max: 2, valeurs: ['Lente', 'Rapide'] },
                  { clé: 'hauteur', libellé: 'Hauteur', min: 0, max: 2, valeurs: ['Grave', 'Aiguë'] },
                ].map(({ clé, libellé, min, max, valeurs }) => (
                  <div key={clé}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>{libellé}</span>
                      <span style={{ fontSize: '11px', color: T.text, fontFamily: grotesk }}>× {préférencesVoix[clé].toFixed(1)}</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step="0.1"
                      value={préférencesVoix[clé]}
                      onChange={e => majPréférencesVoix({ [clé]: parseFloat(e.target.value), style: '' })}
                      onPointerUp={() => lireTexte(EXTRAIT_VOIX)}
                      style={{ width: '100%', accentColor: T.accent }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: T.textMuted }}>
                      <span>{valeurs[0]}</span><span>{valeurs[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {indexRévision >= fileRévision.length ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🎉</p>
                <h2 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '22px', color: T.text, margin: '0 0 8px' }}>
                  Session terminée
                </h2>
                <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 20px' }}>
                  {sues}/{fileRévision.length} carte{fileRévision.length > 1 ? 's' : ''} sue{sues > 1 ? 's' : ''} du premier coup
                </p>
                <button onClick={quitterRévision} style={{
                  background: T.accent, color: T.accentText, border: 'none', fontWeight: 600,
                  borderRadius: '8px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: grotesk,
                }}>Retour aux paquets</button>
              </div>
            ) : estQCM ? (
              <>
                <div style={{
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px',
                  padding: '28px 22px', textAlign: 'center', marginBottom: '14px',
                }}>
                  <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px', fontFamily: grotesk }}>
                    Question
                  </p>
                  <p style={{ fontSize: '17px', lineHeight: '1.5', margin: 0, fontFamily: serif, wordBreak: 'break-word' }}>
                    <TexteFormaté texte={carteActuelle?.recto} couleurDéfaut={T.text} />
                    {carteActuelle?.imageRecto && <ImageCarte image={carteActuelle.imageRecto} hauteurMax={180} style={{ marginTop: '12px' }} />}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {optionsQCM.map(option => {
                    const estCorrecte = option.id === carteActuelle?.id
                    const estChoisie = réponseQCM === option.id
                    const révélé = réponseQCM !== null
                    let bg = T.surface, bordure = T.border, couleur = T.text
                    if (révélé && estCorrecte) { bg = T.accentSoft; bordure = T.accent; couleur = T.accent }
                    else if (révélé && estChoisie) { bg = T.dangerSoft; bordure = T.danger; couleur = T.danger }
                    return (
                      <button
                        key={option.id} disabled={révélé} onClick={() => choisirQCM(option)}
                        style={{
                          textAlign: 'left', padding: '12px 14px', borderRadius: '10px', fontSize: '13.5px',
                          background: bg, border: `1px solid ${bordure}`, color: couleur,
                          cursor: révélé ? 'default' : 'pointer', fontFamily: 'inherit',
                        }}
                      ><TexteFormaté texte={option.verso} couleurDéfaut={couleur} /></button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div
                  onClick={retournerCarte}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px',
                    padding: '40px 24px', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', cursor: 'pointer', marginBottom: '16px',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '10px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px', fontFamily: grotesk }}>
                      {estRetournée ? 'Réponse' : 'Question'}
                    </p>
                    <p style={{ fontSize: '19px', lineHeight: '1.5', margin: 0, fontFamily: serif, wordBreak: 'break-word' }}>
                      <TexteFormaté texte={estRetournée ? carteActuelle?.verso : carteActuelle?.recto} couleurDéfaut={T.text} />
                    </p>
                    {(estRetournée ? carteActuelle?.imageVerso : carteActuelle?.imageRecto) && (
                      <ImageCarte image={estRetournée ? carteActuelle.imageVerso : carteActuelle.imageRecto} hauteurMax={220} style={{ marginTop: '14px' }} />
                    )}
                    {!estRetournée && (
                      <p style={{ fontSize: '11px', color: T.textMuted, margin: '18px 0 0' }}>Touche la carte pour voir la réponse</p>
                    )}
                  </div>
                </div>

                {!estRetournée && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {niveauIndice > 0 && (
                      <div style={{
                        background: T.accentSoft, border: `1px dashed ${T.accent}`, borderRadius: '10px',
                        padding: '10px 12px', fontSize: '14px', color: T.text, lineHeight: '1.6',
                        letterSpacing: '0.04em', wordBreak: 'break-word',
                      }}>
                        <span style={{ fontSize: '10px', color: T.accent, fontFamily: grotesk, fontWeight: 700, display: 'block', marginBottom: '4px', letterSpacing: '0.08em' }}>
                          INDICE {niveauIndice}/{NIVEAU_INDICE_MAX}
                        </span>
                        {construireIndice(carteActuelle?.verso, niveauIndice)}
                      </div>
                    )}
                    <textarea
                      value={réponseSaisie}
                      onChange={e => setRéponseSaisie(e.target.value)}
                      placeholder={SpeechRecognitionAPI ? 'Tape ou dicte ta réponse (facultatif)…' : 'Tape ta réponse (facultatif)…'}
                      rows={2}
                      style={{
                        width: '100%', boxSizing: 'border-box', background: T.bg, color: T.text, resize: 'vertical',
                        border: `1px solid ${écoute ? T.danger : T.border}`, borderRadius: '10px', padding: '10px 12px',
                        fontSize: '13.5px', fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setNiveauIndice(n => Math.min(n + 1, NIVEAU_INDICE_MAX))}
                        disabled={niveauIndice >= NIVEAU_INDICE_MAX}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px', background: T.surface2, color: T.text,
                          border: `1px solid ${T.border}`, borderRadius: '20px', padding: '7px 14px', fontSize: '12px',
                          fontWeight: 600, fontFamily: grotesk,
                          cursor: niveauIndice >= NIVEAU_INDICE_MAX ? 'default' : 'pointer',
                          opacity: niveauIndice >= NIVEAU_INDICE_MAX ? 0.5 : 1,
                        }}
                      >💡 {niveauIndice === 0 ? 'Indice' : 'Indice suivant'}</button>
                      {SpeechRecognitionAPI && (
                        <button onClick={basculerDictée} style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          background: écoute ? T.dangerSoft : T.surface2, color: écoute ? T.danger : T.text,
                          border: `1px solid ${écoute ? T.danger : T.border}`, borderRadius: '20px', padding: '7px 14px',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                        }}>🎤 {écoute ? 'Arrêter' : 'Dicter'}</button>
                      )}
                      {réponseSaisie.trim() && (
                        <button onClick={retournerCarte} style={{
                          marginLeft: 'auto', background: T.accent, color: T.accentText, border: 'none',
                          borderRadius: '20px', padding: '7px 16px', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', fontFamily: grotesk,
                        }}>Vérifier</button>
                      )}
                    </div>
                  </div>
                )}

                {vérification && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: T.textMuted, margin: '0 0 4px', fontFamily: grotesk }}>Ta réponse</p>
                    <p style={{ fontSize: '13px', color: T.text, margin: '0 0 12px', lineHeight: '1.5', wordBreak: 'break-word' }}>{réponseSaisie}</p>
                    {vérification.length > 0 ? (
                      <>
                        <p style={{
                          fontSize: '12.5px', fontWeight: 700, fontFamily: grotesk, margin: '0 0 8px',
                          color: nbTrouvés / vérification.length >= 0.7 ? T.accent : T.danger,
                        }}>
                          {nbTrouvés}/{vérification.length} mot{vérification.length > 1 ? 's' : ''}-clé{vérification.length > 1 ? 's' : ''} retrouvé{nbTrouvés > 1 ? 's' : ''}
                          {' · '}{nbTrouvés / vérification.length >= 0.7 ? 'tu peux compter « Je savais »' : 'plutôt à revoir'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {vérification.map(({ motClé, trouvé }) => (
                            <span key={motClé} style={{
                              fontSize: '11.5px', padding: '3px 9px', borderRadius: '20px', fontFamily: grotesk,
                              background: trouvé ? T.accentSoft : T.dangerSoft,
                              color: trouvé ? T.accent : T.danger,
                              border: `1px solid ${trouvé ? T.accent : T.danger}55`,
                              textDecoration: trouvé ? 'none' : 'line-through',
                            }}>{trouvé ? '✓' : '✗'} {motClé}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>Pas de mot-clé détectable dans la réponse attendue — compare à l'œil.</p>
                    )}
                  </div>
                )}

                {estRetournée && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => répondre(false)} style={{
                      flex: 1, background: T.dangerSoft, color: T.danger, border: `1px solid ${T.danger}55`,
                      borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                    }}>Je ne savais pas</button>
                    <button onClick={() => répondre(true)} style={{
                      flex: 1, background: T.accentSoft, color: T.accent, border: `1px solid ${T.accent}55`,
                      borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: grotesk,
                    }}>Je savais</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {découpeCarteId && data.cartes.find(c => c.id === découpeCarteId) && (
        <DecoupeCarte
          carte={data.cartes.find(c => c.id === découpeCarteId)}
          onValider={(morceaux, supprimer) => découperCarte(data.cartes.find(c => c.id === découpeCarteId), morceaux, supprimer)}
          onFermer={() => setDécoupeCarteId(null)}
        />
      )}
      {copiePaquetId && data.paquets.find(p => p.id === copiePaquetId) && (
        <CopiePaquet
          paquet={data.paquets.find(p => p.id === copiePaquetId)}
          nbCartes={data.cartes.filter(c => c.paquetId === copiePaquetId).length}
          destinations={Object.values(ESPACES).filter(e => e.id !== config.id).map(e => ({
            id: e.id, libellé: `${FOYERS[e.foyer].nom} · ${e.type === 'perso' ? 'Perso' : 'Pro'}`,
          }))}
          peutCopier={!!token}
          onDupliquerIci={() => dupliquerPaquet(data.paquets.find(p => p.id === copiePaquetId))}
          onCopier={espaceId => copierPaquetVers(data.paquets.find(p => p.id === copiePaquetId), espaceId)}
          onFermer={() => setCopiePaquetId(null)}
        />
      )}
      {modeVocal?.type === 'lecture' && (
        <ModeLecture
          cartes={data.cartes.filter(c => c.paquetId === modeVocal.paquetId)}
          titre={data.paquets.find(p => p.id === modeVocal.paquetId)?.nom || ''}
          couleur={data.paquets.find(p => p.id === modeVocal.paquetId)?.couleur || T.accent}
          onFermer={() => setModeVocal(null)}
          onBulles={setCarteBullesId}
        />
      )}
      {pdfPaquet && (
        <DialoguePdfMémo T={T} paquet={data.paquets.find(p => p.id === pdfPaquet)} nbPaquets={data.paquets.length}
          onChoisir={(mode, tous) => {
            const paquets = tous ? data.paquets : data.paquets.filter(p => p.id === pdfPaquet)
            const groupes = paquets.map(p => ({ paquet: p, cartes: data.cartes.filter(c => c.paquetId === p.id) })).filter(g => g.cartes.length)
            const fenêtre = window.open('', '_blank')
            if (!fenêtre) { window.alert('Autorise les fenêtres pour ce site pour imprimer.'); return }
            const html = pageMémo({ titre: tous ? config.titre : paquets[0].nom, groupes, mode, imageDe: image => adresseImage(image) })
              .replace('</body>', '<script>window.onload = () => setTimeout(() => window.print(), 300)</script></body>')
            fenêtre.document.write(html)
            fenêtre.document.close()
            setPdfPaquet(null)
          }}
          onFermer={() => setPdfPaquet(null)} />
      )}
      {modeVocal?.type === 'podcast' && (
        <ModePodcast
          cartes={data.cartes.filter(c => c.paquetId === modeVocal.paquetId)}
          titre={data.paquets.find(p => p.id === modeVocal.paquetId)?.nom || ''}
          onFermer={() => setModeVocal(null)}
        />
      )}
      {modeVocal?.type === 'entretien' && (
        <EntretienSimule
          cartes={data.cartes.filter(c => c.paquetId === modeVocal.paquetId)}
          titre={data.paquets.find(p => p.id === modeVocal.paquetId)?.nom || ''}
          onFermer={() => setModeVocal(null)}
          onRetravailler={ids => {
            const paquetId = modeVocal.paquetId
            setModeVocal(null)
            démarrerRévision(paquetId, { cartesIds: ids, titre: 'À retravailler' })
          }}
        />
      )}
      {carteBullesId && data.cartes.find(c => c.id === carteBullesId) && (
        <CarteBulles carte={data.cartes.find(c => c.id === carteBullesId)} onFermer={() => setCarteBullesId(null)} />
      )}
    </div>
  )
}

// Choix de la mise en page PDF d'un paquet.
function DialoguePdfMémo({ T, paquet, nbPaquets, onChoisir, onFermer }) {
  const [tous, setTous] = useState(false)
  const choix = [
    ['fiche', '📄 Fiche de révision', 'Questions et réponses dans un tableau'],
    ['quiz', '✍️ Interrogation', 'Questions avec la place pour écrire les réponses'],
    ['decouper', '✂️ Cartes à découper', '8 cartes par page, recto verso (bord long)'],
  ]
  return (
    <div role="dialog" aria-label="Imprimer en PDF" onClick={onFermer} onKeyDown={e => { if (e.key === 'Escape') onFermer() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '16px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '11px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: grotesk }}>🖨️ PDF de « {paquet?.nom} »</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {choix.map(([id, titre, desc]) => (
            <button key={id} onClick={() => onChoisir(id, tous)} style={{ textAlign: 'left', padding: '12px', borderRadius: '12px', border: `1px solid ${T.border}`, background: T.surface2, color: T.text, cursor: 'pointer', fontFamily: 'inherit' }}>
              <strong style={{ display: 'block', fontSize: '14px', fontFamily: grotesk }}>{titre}</strong>
              <span style={{ fontSize: '12px', color: T.textMuted }}>{desc}</span>
            </button>
          ))}
        </div>
        {nbPaquets > 1 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px', color: T.text, cursor: 'pointer' }}>
            <input type="checkbox" checked={tous} onChange={e => setTous(e.target.checked)} style={{ accentColor: T.accent }} /> Tous les paquets ({nbPaquets})
          </label>
        )}
        <p style={{ margin: '12px 0 0', fontSize: '11.5px', color: T.textMuted, lineHeight: 1.5 }}>Dans la fenêtre d'impression, choisis « Enregistrer en PDF ».</p>
      </div>
    </div>
  )
}
