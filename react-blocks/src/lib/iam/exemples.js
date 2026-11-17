// Phrases d'exemple de l'assistant (toutes testées par npm run test:iam : elles produisent une politique valide
// dont les tests automatiques réussissent).
export const EXEMPLES = [
  ['Identité', [
    'Lecture seule sur le bucket S3 mon-bucket',
    'Démarrer et arrêter les instances EC2 taguées Environment=dev depuis 203.0.113.0/24 avec MFA',
    'Autoriser une fonction Lambda à écrire dans la table DynamoDB users et à envoyer des logs dans CloudWatch',
    'Envoyer des messages dans la file SQS jobs et recevoir les messages de la file SQS resultats',
    'Pousser et tirer des images du dépôt ECR mon-app',
    'Lire le secret prod/db et le déchiffrer avec la clé KMS alias/app',
    'Autoriser la lecture et l\'écriture sur le bucket S3 docs mais pas la suppression',
    'Read-only access to the S3 bucket reports',
  ]],
  ['Garde-fous', [
    'Interdire en dehors de eu-west-3 et eu-west-1',
    'Bloquer toutes les actions sans MFA',
    'Interdire la suppression des buckets S3',
    'Accès à S3 pour le bucket data dans la région eu-west-3 avec HTTPS obligatoire',
  ]],
  ['Approbation de rôle', [
    'Rôle assumable par le service Lambda',
    'Rôle assumable par GitHub Actions pour le dépôt monorg/monrepo sur la branche main',
    'Rôle assumable par le compte 111122223333 avec MFA',
    'Rôle pour le compte de service Kubernetes web du namespace app sur EKS oidc.eks.eu-west-3.amazonaws.com/id/ABCDEF0123456789ABCDEF0123456789',
  ]],
  ['Politique de ressource', [
    'Autoriser le compte 123456789012 à lire le bucket S3 partage et exiger HTTPS',
    'Permettre à l\'organisation o-abc1234567 de lire le bucket S3 donnees',
    'Permettre au service CloudFront de lire le bucket S3 site-web',
  ]],
  ['Message d\'erreur', [
    'User: arn:aws:iam::123456789012:user/bob is not authorized to perform: s3:GetObject on resource: "arn:aws:s3:::rapports/q1/x.csv" because no identity-based policy allows the s3:GetObject action',
  ]],
]
