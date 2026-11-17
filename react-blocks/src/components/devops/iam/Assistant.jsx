// Section « Décrire » : type de politique, description en français ou en anglais, exemples, résultat de l'interprétation.
import { grotesk } from '../../../lib/theme'
import { TYPES } from '../../../lib/iam/politique'
import { EXEMPLES } from '../../../lib/iam/exemples'
import { Pastille, Segments } from './ui'

export default function Assistant({ description, onDescription, type, auto, onType, onGénérer, occupé, génération, résumeTests, peutAnnuler, onAnnuler, T, S }) {
  const options = [['auto', 'Automatique', 'Le type est déduit de la description (approbation, ressource, SCP…)'], ...Object.entries(TYPES).map(([id, t]) => [id, t.court, t.aide])]
  return (
    <section aria-labelledby="iam-décrire" style={S.carte}>
      <h3 id="iam-décrire" style={{ margin: '0 0 8px', fontFamily: grotesk, fontSize: 17 }}>1 · Décrivez la règle voulue</h3>
      <p style={S.étiquette}>Type de politique</p>
      <Segments aria="Type de politique" S={S} valeur={auto ? 'auto' : type} onChange={onType} options={options} />
      <p style={{ margin: '6px 0 8px', fontSize: 12.5, color: T.textMuted }}>{auto ? `Type courant : ${TYPES[type].nom}. ` : ''}{TYPES[type].aide}</p>
      <textarea
        value={description}
        onChange={e => onDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onGénérer() }}
        rows={3}
        aria-label="Description de la règle IAM"
        placeholder="Ex. : lecture seule sur le bucket S3 mon-bucket · rôle assumable par GitHub Actions pour le dépôt org/repo · interdire en dehors de eu-west-3 · ou collez un message AccessDenied"
        style={{ ...S.champ, fontFamily: grotesk, fontSize: 16, resize: 'vertical', lineHeight: 1.5 }}
      />
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: 'pointer', fontSize: 14, fontFamily: grotesk, fontWeight: 700 }}>💡 Exemples de phrases</summary>
        {EXEMPLES.map(([titre, phrases]) => (
          <div key={titre} style={{ marginTop: 8 }}>
            <p style={S.étiquette}>{titre}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {phrases.map(p => <button key={p} type="button" onClick={() => onDescription(p)} style={{ ...S.puce(description === p), minHeight: 34, fontSize: 12.5, fontWeight: 600, whiteSpace: 'normal', textAlign: 'left' }}>{p.length > 70 ? `${p.slice(0, 68)}…` : p}</button>)}
            </div>
          </div>
        ))}
      </details>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" onClick={onGénérer} disabled={occupé || !description.trim()} style={{ ...S.puce(true), minHeight: 46, fontSize: 16, padding: '0 22px', opacity: !description.trim() ? 0.55 : 1 }}>{occupé ? 'Génération…' : '⚡ Générer la politique'}</button>
        {peutAnnuler && <button type="button" onClick={onAnnuler} style={{ ...S.puce(false), minHeight: 40 }}>↩ Revenir à la politique précédente</button>}
      </div>

      {génération && (
        <div style={{ marginTop: 12 }} aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontFamily: grotesk, fontSize: 14.5 }}>Interprétation</strong>
            {génération.typeDétecté && <Pastille couleur="#2563eb">Type détecté : {TYPES[génération.type].court}</Pastille>}
            {résumeTests && <Pastille couleur={résumeTests.tous ? '#2e9e6b' : '#dc2626'} titre="Requêtes simulées sur la politique générée">{résumeTests.tous ? '✅' : '❌'} Vérifiée par exécution · {résumeTests.ok}/{résumeTests.total} tests</Pastille>}
          </div>
          {génération.hypothèses.length > 0 && (
            <>
              <p style={{ ...S.étiquette, marginTop: 8 }}>Hypothèses faites</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55 }}>{génération.hypothèses.map(h => <li key={h}>{h}</li>)}</ul>
            </>
          )}
          {génération.avertissements.length > 0 && (
            <ul role="alert" style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55, color: '#d97706' }}>{génération.avertissements.map(h => <li key={h}>⚠️ {h}</li>)}</ul>
          )}
          {génération.nonCompris.length > 0 && (
            <div role="alert" style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, border: '1px dashed #d97706', fontSize: 13.5, lineHeight: 1.55 }}>
              <strong>Non compris :</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{génération.nonCompris.map(h => <li key={h}>{h}</li>)}</ul>
            </div>
          )}
          {génération.motsInutilisés?.length > 0 && <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.textMuted }}>Mots non utilisés : {génération.motsInutilisés.join(', ')}</p>}
        </div>
      )}
      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13.5, color: T.textMuted }}>Ce que l'assistant comprend</summary>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: T.textMuted }}>
          <li><strong style={{ color: T.text }}>Des services</strong> (S3, EC2, Lambda, DynamoDB, SQS, SNS, KMS, Secrets Manager, SSM, CloudWatch Logs, ECR, EKS, RDS, IAM, STS…) et des ressources nommées (« bucket mon-bucket », « table users »).</li>
          <li><strong style={{ color: T.text }}>Des intentions</strong> : lecture seule, écriture, suppression, accès complet, ou des verbes précis (invoquer, publier, envoyer, recevoir, démarrer, arrêter, chiffrer, pousser…).</li>
          <li><strong style={{ color: T.text }}>Des conditions</strong> : MFA, adresse IP, région, HTTPS, étiquettes, organisation, VPC, dates.</li>
          <li><strong style={{ color: T.text }}>Des relations d'approbation</strong> : service AWS, compte (avec ExternalId ou MFA), GitHub Actions, GitLab CI, EKS (IRSA), SAML.</li>
          <li><strong style={{ color: T.text }}>Un message AccessDenied</strong> collé tel quel : la règle manquante exacte est produite.</li>
        </ul>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: T.textMuted }}>Interprétation locale par règles (pas de modèle de langage). Chaque choix est affiché comme hypothèse, et la politique produite est <strong>vérifiée par exécution</strong> : des requêtes de part et d'autre des frontières (action voisine, autre ressource, condition non remplie) sont simulées.</p>
      </details>
    </section>
  )
}
