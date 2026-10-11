import { useState } from 'react'
import { videsParEspace } from '../lib/donneesVides'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { BoutonIcone } from '../components/UI'
import PanneauSync from '../components/PanneauSync'
import { grotesk, serif, useTheme, useThemeMode } from '../lib/theme'
import { FOYERS, espacesPourTousLesFoyers } from '../lib/foyers'
import { useDonnéesSynchronisées } from '../lib/synchro'
import {
  JOURS_COURTS, TOUS_LES_JOURS, compléterHabitudes, prévue, faite, actives, série, meilleureSérie, bilanJour,
  aujourdhuiLocal, décaler, dateDe,
} from '../lib/habitudes'

const DONNÉES = videsParEspace('habitudes')
const ESPACES = espacesPourTousLesFoyers((foyer, type, id) => ({
  titre: `Habitudes ${type}`,
  eyebrow: `${foyer.nom} · Habitudes ${type}`,
  chemin: `react-blocks/src/data/habitudes-${id}.json`,
  stockage: `react-blocs-habitudes-${id}`,
  données: DONNÉES[id],
}))
const EMOJIS = ['💧', '🏃', '📚', '🧘', '🛏️', '🥗', '💪', '🧠', '✍️', '🚭', '🦷', '🌿', '🎸', '☀️', '📵', '🙏']
const COULEURS = ['#f0a839', '#4a9d94', '#5b8dc9', '#e2574c', '#8b7ab8', '#d97aa6']
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export default function Habitudes() {
  const { espace: espaceParam } = useParams()
  const config = ESPACES[espaceParam] || ESPACES.perso
  const T = useTheme()
  const { mode, basculer } = useThemeMode()
  const { data, setData, token, statut, erreur, connecter, déconnecter } = useDonnéesSynchronisées(config, compléterHabitudes)
  const [formulaire, setFormulaire] = useState(null) // null | { id?, nom, emoji, couleur, jours }
  const [annéeOuverte, setAnnéeOuverte] = useState(null)
  const auj = aujourdhuiLocal()
  const liste = actives(data)
  const { prévues, faites } = bilanJour(data, auj)

  const cocher = (h, jour) => setData(d => {
    const duJour = { ...(d.coches[jour] || {}) }
    if (duJour[h.id]) delete duJour[h.id]; else duJour[h.id] = true
    const coches = { ...d.coches }
    if (Object.keys(duJour).length) coches[jour] = duJour; else delete coches[jour]
    return { ...d, coches }
  })
  const enregistrer = f => {
    const nom = f.nom.trim()
    if (!nom) return
    const h = { id: f.id || uid(), nom, emoji: f.emoji, couleur: f.couleur, jours: f.jours.length === 7 ? [] : f.jours, ...(f.id ? {} : { créée: aujourdhuiLocal() }) }
    setData(d => ({ ...d, habitudes: f.id ? d.habitudes.map(x => (x.id === f.id ? { ...x, ...h } : x)) : [...d.habitudes, h] }))
    setFormulaire(null)
  }
  const supprimer = h => {
    if (!window.confirm(`Supprimer l'habitude « ${h.nom} » et son historique ?`)) return
    setData(d => ({
      ...d,
      habitudes: d.habitudes.filter(x => x.id !== h.id),
      coches: Object.fromEntries(Object.entries(d.coches).map(([j, o]) => { const c = { ...o }; delete c[h.id]; return [j, c] }).filter(([, o]) => Object.keys(o).length)),
    }))
  }

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <Link to={FOYERS[config.foyer].accueil} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.textMuted, fontSize: '13px', fontFamily: grotesk }}>
            <Icon nom="fleche" taille={13} style={{ transform: 'rotate(180deg)' }} /> Accueil
          </Link>
          <BoutonIcone icon={mode === 'sombre' ? 'soleil' : 'lune'} title={mode === 'sombre' ? 'Thème clair' : 'Thème sombre'} onClick={basculer} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
          <div>
            <p style={{ fontFamily: grotesk, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent, margin: '0 0 4px', fontWeight: 600 }}>{config.eyebrow}</p>
            <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: '30px', color: T.text, margin: 0, lineHeight: 1.1 }}>{config.titre}</h1>
          </div>
          <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '9px', padding: '3px', flexShrink: 0 }}>
            {Object.values(ESPACES).filter(e => e.foyer === config.foyer).map(e => (
              <Link key={e.id} to={`/habitudes/${e.id}`} style={{
                fontSize: '11px', fontFamily: grotesk, fontWeight: 600, padding: '6px 10px', borderRadius: '6px',
                background: e.id === config.id ? T.accent : 'transparent', color: e.id === config.id ? T.accentText : T.textMuted,
              }}>{e.type === 'perso' ? 'Perso' : 'Pro'}</Link>
            ))}
          </div>
        </div>
        <PanneauSync statut={statut} erreur={erreur} token={token} connecter={connecter} déconnecter={déconnecter} nomFichier={`habitudes-${config.id}.json`} marginBottom="16px" />

        {/* Bilan du jour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px' }}>
          <Anneau T={T} valeur={prévues.length ? faites.length / prévues.length : 0} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', fontSize: '19px', color: T.text }}>
              {prévues.length === 0 ? 'Rien de prévu aujourd\'hui' : faites.length === prévues.length ? 'Tout est fait aujourd\'hui 🎉' : `${faites.length} sur ${prévues.length} aujourd'hui`}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: T.textMuted }}>
              {dateDe(auj).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={() => setFormulaire({ nom: '', emoji: EMOJIS[liste.length % EMOJIS.length], couleur: COULEURS[liste.length % COULEURS.length], jours: [...TOUS_LES_JOURS] })} style={{
            background: T.accent, color: T.accentText, border: 'none', borderRadius: '10px', padding: '9px 13px', fontWeight: 700, fontFamily: grotesk, cursor: 'pointer', flexShrink: 0,
          }}>＋ Habitude</button>
        </div>

        {formulaire && <FormulaireHabitude T={T} initial={formulaire} onValider={enregistrer} onAnnuler={() => setFormulaire(null)} />}

        {liste.length === 0 && !formulaire && (
          <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '14px', padding: '30px 10px', lineHeight: 1.6 }}>
            Ajoute une habitude (boire de l'eau, lire 10 minutes, sport…) et coche-la chaque jour pour garder ta série 🔥.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {liste.map(h => (
            <CarteHabitude key={h.id} T={T} h={h} coches={data.coches} auj={auj} cocher={cocher}
              ouvrirAnnée={() => setAnnéeOuverte(a => (a === h.id ? null : h.id))} annéeOuverte={annéeOuverte === h.id}
              modifier={() => setFormulaire({ id: h.id, nom: h.nom, emoji: h.emoji, couleur: h.couleur, jours: h.jours?.length ? [...h.jours] : [...TOUS_LES_JOURS] })}
              supprimer={() => supprimer(h)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Anneau({ T, valeur }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke={T.surface2} strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={valeur >= 1 ? '#4a9d94' : T.accent} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${c * valeur} ${c}`} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dasharray .3s' }} />
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill={T.text} fontFamily="system-ui">{Math.round(valeur * 100)}%</text>
    </svg>
  )
}

function CarteHabitude({ T, h, coches, auj, cocher, ouvrirAnnée, annéeOuverte, modifier, supprimer }) {
  const prévueAuj = prévue(h, auj)
  const faiteAuj = faite(coches, h, auj)
  const s = série(h, coches, auj)
  const meilleure = meilleureSérie(h, coches)
  const semaine = Array.from({ length: 7 }, (_, i) => décaler(auj, i - 6))
  return (
    <div style={{ background: T.surface, border: `1px solid ${faiteAuj ? h.couleur : T.border}`, borderRadius: '16px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => prévueAuj && cocher(h, auj)} disabled={!prévueAuj} aria-pressed={faiteAuj} aria-label={`${faiteAuj ? 'Décocher' : 'Cocher'} ${h.nom} aujourd'hui`}
          style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, cursor: prévueAuj ? 'pointer' : 'default', fontSize: '22px',
            border: `3px solid ${h.couleur}`, background: faiteAuj ? h.couleur : 'transparent', opacity: prévueAuj ? 1 : 0.35,
            transition: 'background .15s, transform .1s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{faiteAuj ? '✓' : h.emoji}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T.text, fontFamily: grotesk }}>{h.emoji} {h.nom}</p>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: T.textMuted }}>
            {s > 0 ? <span style={{ color: T.accent, fontWeight: 700 }}>🔥 {s} jour{s > 1 ? 's' : ''}</span> : 'Pas encore de série'}
            {meilleure > s ? ` · record ${meilleure}` : ''}
            {h.jours?.length ? ` · ${h.jours.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(j => JOURS_COURTS[j]).join(' ')}` : ''}
            {!prévueAuj ? ' · pas prévue aujourd\'hui' : ''}
          </p>
        </div>
        <BoutonIcone icon="calendrier" title="Année" onClick={ouvrirAnnée} />
        <BoutonIcone icon="crayon" title="Modifier" onClick={modifier} />
        <BoutonIcone icon="corbeille" title="Supprimer" couleur={T.danger} onClick={supprimer} />
      </div>
      {/* 7 derniers jours, cochables */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingLeft: '60px' }}>
        {semaine.map(j => {
          const p = prévue(h, j)
          const f = faite(coches, h, j)
          return (
            <button key={j} onClick={() => p && cocher(h, j)} disabled={!p} title={dateDe(j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
              aria-label={`${h.nom} le ${j} : ${f ? 'fait' : 'pas fait'}`} style={{
                flex: '1 1 0', maxWidth: '44px', padding: '4px 0', borderRadius: '8px', cursor: p ? 'pointer' : 'default',
                border: `1.5px solid ${j === auj ? T.text : 'transparent'}`, background: f ? h.couleur : p ? T.surface2 : 'transparent',
                color: f ? '#fff' : T.textMuted, fontSize: '10.5px', fontWeight: 700, fontFamily: grotesk, opacity: p ? 1 : 0.35,
              }}>{JOURS_COURTS[dateDe(j).getDay()]}<br />{dateDe(j).getDate()}</button>
          )
        })}
      </div>
      {annéeOuverte && <GrilleAnnée T={T} h={h} coches={coches} auj={auj} />}
    </div>
  )
}

// 53 semaines × 7 jours, façon calendrier GitHub.
function GrilleAnnée({ T, h, coches, auj }) {
  const fin = dateDe(auj)
  const début = new Date(fin)
  début.setDate(début.getDate() - 364 - ((fin.getDay() + 6) % 7))
  const semaines = []
  for (let d = new Date(début); d <= fin;) {
    const sem = []
    for (let i = 0; i < 7 && d <= fin; i++) { sem.push(new Date(d)); d.setDate(d.getDate() + 1) }
    semaines.push(sem)
  }
  const isoLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  const total = Object.keys(coches).filter(j => coches[j]?.[h.id]).length
  return (
    <div style={{ marginTop: '12px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>
        {semaines.map((sem, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {sem.map(d => {
              const j = isoLocal(d)
              const f = faite(coches, h, j)
              return <span key={j} title={`${d.toLocaleDateString('fr-FR')}${f ? ' ✓' : ''}`} style={{ width: '10px', height: '10px', borderRadius: '2px', background: f ? h.couleur : prévue(h, j) ? T.surface2 : 'transparent', border: `1px solid ${T.border}55` }} />
            })}
          </div>
        ))}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: T.textMuted }}>{total} jour{total > 1 ? 's' : ''} cochés sur l'année</p>
    </div>
  )
}

function FormulaireHabitude({ T, initial, onValider, onAnnuler }) {
  const [f, setF] = useState(initial)
  const basculerJour = j => setF(x => ({ ...x, jours: x.jours.includes(j) ? x.jours.filter(y => y !== j) : [...x.jours, j] }))
  const lundiDabord = [1, 2, 3, 4, 5, 6, 0]
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.accent}`, borderRadius: '16px', padding: '14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input autoFocus value={f.nom} onChange={e => setF(x => ({ ...x, nom: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') onValider(f); if (e.key === 'Escape') onAnnuler() }}
        placeholder="Nom de l'habitude (ex. Boire 2 L d'eau)" aria-label="Nom de l'habitude"
        style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px', fontSize: '15px' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setF(x => ({ ...x, emoji: e }))} aria-pressed={f.emoji === e} style={{
            width: '36px', height: '36px', borderRadius: '10px', fontSize: '18px', cursor: 'pointer',
            background: f.emoji === e ? `${T.accent}33` : 'transparent', border: `1.5px solid ${f.emoji === e ? T.accent : 'transparent'}`,
          }}>{e}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {COULEURS.map(c => (
          <button key={c} onClick={() => setF(x => ({ ...x, couleur: c }))} aria-label={`Couleur ${c}`} style={{ width: '26px', height: '26px', borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${f.couleur === c ? T.text : 'transparent'}` }} />
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }} role="group" aria-label="Jours">
          {lundiDabord.map(j => (
            <button key={j} onClick={() => basculerJour(j)} aria-pressed={f.jours.includes(j)} style={{
              width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', fontFamily: grotesk,
              background: f.jours.includes(j) ? f.couleur : T.surface2, color: f.jours.includes(j) ? '#fff' : T.textMuted, border: 'none',
            }}>{JOURS_COURTS[j]}</button>
          ))}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onAnnuler} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: T.surface2, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: grotesk, fontWeight: 600 }}>Annuler</button>
        <button onClick={() => onValider(f)} disabled={!f.nom.trim() || !f.jours.length} style={{ flex: 2, padding: '10px', borderRadius: '10px', background: T.accent, color: T.accentText, border: 'none', cursor: 'pointer', fontFamily: grotesk, fontWeight: 700, opacity: f.nom.trim() && f.jours.length ? 1 : 0.5 }}>
          {initial.id ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}
