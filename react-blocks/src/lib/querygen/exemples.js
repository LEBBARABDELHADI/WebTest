// Jeux de données d'exemple (sorties typiques de l'AWS CLI, de kubectl…) pour
// essayer l'outil. La génération ne dépend pas de ces exemples : tout JSON
// collé ou importé est analysé de la même façon.

export const EC2 = {
  Reservations: [
    {
      ReservationId: 'r-0a51c1f2e7b3d4001',
      OwnerId: '123456789012',
      Instances: [
        { InstanceId: 'i-0a1b2c3d4e5f60001', InstanceType: 't3.medium', ImageId: 'ami-0c1d2e3f4a5b6c7d8', State: { Code: 16, Name: 'running' }, PrivateIpAddress: '10.0.1.15', PublicIpAddress: '203.0.113.10', LaunchTime: '2026-10-02T08:15:00+00:00', Placement: { AvailabilityZone: 'eu-west-3a' }, Tags: [{ Key: 'Name', Value: 'web-01' }, { Key: 'env', Value: 'prod' }] },
        { InstanceId: 'i-0a1b2c3d4e5f60002', InstanceType: 't3.micro', ImageId: 'ami-0c1d2e3f4a5b6c7d8', State: { Code: 80, Name: 'stopped' }, PrivateIpAddress: '10.0.1.16', LaunchTime: '2026-09-12T10:00:00+00:00', Placement: { AvailabilityZone: 'eu-west-3a' }, Tags: [{ Key: 'Name', Value: 'batch-01' }, { Key: 'env', Value: 'dev' }] },
      ],
    },
    {
      ReservationId: 'r-0a51c1f2e7b3d4002',
      OwnerId: '123456789012',
      Instances: [
        { InstanceId: 'i-0a1b2c3d4e5f60003', InstanceType: 'm5.large', ImageId: 'ami-0f9e8d7c6b5a4f3e2', State: { Code: 16, Name: 'running' }, PrivateIpAddress: '10.0.2.21', PublicIpAddress: '198.51.100.8', LaunchTime: '2026-11-01T07:30:00+00:00', Placement: { AvailabilityZone: 'eu-west-3b' }, Tags: [{ Key: 'Name', Value: 'api-01' }, { Key: 'env', Value: 'prod' }] },
        { InstanceId: 'i-0a1b2c3d4e5f60004', InstanceType: 't3.medium', ImageId: 'ami-0f9e8d7c6b5a4f3e2', State: { Code: 0, Name: 'pending' }, PrivateIpAddress: '10.0.2.22', LaunchTime: '2026-11-16T09:00:00+00:00', Placement: { AvailabilityZone: 'eu-west-3b' }, Tags: [{ Key: 'Name', Value: 'api-02' }] },
      ],
    },
  ],
}

export const PODS = {
  apiVersion: 'v1',
  kind: 'List',
  items: [
    { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'web-7d9f8b6c5-x2k4p', namespace: 'default', uid: '6f1c2b8e-1a2b-4c3d-8e9f-0a1b2c3d4e01', labels: { app: 'web' }, creationTimestamp: '2026-11-10T08:00:00Z' }, spec: { nodeName: 'node-1', containers: [{ name: 'nginx', image: 'nginx:1.27' }] }, status: { phase: 'Running', hostIP: '192.168.10.11', podIP: '10.244.1.12', containerStatuses: [{ name: 'nginx', ready: true, restartCount: 0 }] } },
    { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'api-5c8d7f9b4-m7q2z', namespace: 'default', uid: '6f1c2b8e-1a2b-4c3d-8e9f-0a1b2c3d4e02', labels: { app: 'api' }, creationTimestamp: '2026-11-12T09:30:00Z' }, spec: { nodeName: 'node-2', containers: [{ name: 'api', image: 'registry.example.com/api:2.4.1' }, { name: 'envoy', image: 'envoyproxy/envoy:v1.31' }] }, status: { phase: 'Running', hostIP: '192.168.10.12', podIP: '10.244.2.7', containerStatuses: [{ name: 'api', ready: true, restartCount: 2 }, { name: 'envoy', ready: true, restartCount: 0 }] } },
    { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'coredns-6d4b75cb6d-8xk2v', namespace: 'kube-system', uid: '6f1c2b8e-1a2b-4c3d-8e9f-0a1b2c3d4e03', labels: { 'k8s-app': 'kube-dns' }, creationTimestamp: '2026-10-01T00:00:00Z' }, spec: { nodeName: 'node-1', containers: [{ name: 'coredns', image: 'registry.k8s.io/coredns/coredns:v1.11.3' }] }, status: { phase: 'Running', hostIP: '192.168.10.11', podIP: '10.244.1.2', containerStatuses: [{ name: 'coredns', ready: true, restartCount: 0 }] } },
    { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'migrate-db-28511040-q9w8e', namespace: 'default', uid: '6f1c2b8e-1a2b-4c3d-8e9f-0a1b2c3d4e04', labels: { job: 'migrate-db' }, creationTimestamp: '2026-11-16T02:00:00Z' }, spec: { nodeName: 'node-2', containers: [{ name: 'migrate', image: 'registry.example.com/migrate:1.0' }] }, status: { phase: 'Succeeded', hostIP: '192.168.10.12', podIP: '10.244.2.9', containerStatuses: [{ name: 'migrate', ready: false, restartCount: 0 }] } },
    { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'worker-0', namespace: 'batch', uid: '6f1c2b8e-1a2b-4c3d-8e9f-0a1b2c3d4e05', labels: { app: 'worker' }, creationTimestamp: '2026-11-16T09:55:00Z' }, spec: { containers: [{ name: 'worker', image: 'registry.example.com/worker:3.2' }] }, status: { phase: 'Pending' } },
  ],
  metadata: { resourceVersion: '' },
}

export const EBS = {
  Volumes: [
    { VolumeId: 'vol-0a1b2c3d4e5f00001', Size: 8, VolumeType: 'gp3', State: 'in-use', Encrypted: true, AvailabilityZone: 'eu-west-3a', CreateTime: '2026-10-02T08:15:01.000Z', Iops: 3000, Attachments: [{ InstanceId: 'i-0a1b2c3d4e5f60001', Device: '/dev/xvda', State: 'attached' }], Tags: [{ Key: 'Name', Value: 'web-01-root' }] },
    { VolumeId: 'vol-0a1b2c3d4e5f00002', Size: 100, VolumeType: 'gp3', State: 'available', Encrypted: false, AvailabilityZone: 'eu-west-3a', CreateTime: '2026-08-20T14:00:00.000Z', Iops: 3000, Attachments: [], Tags: [{ Key: 'Name', Value: 'old-data' }] },
    { VolumeId: 'vol-0a1b2c3d4e5f00003', Size: 500, VolumeType: 'st1', State: 'available', Encrypted: true, AvailabilityZone: 'eu-west-3b', CreateTime: '2026-07-01T09:00:00.000Z', Attachments: [] },
    { VolumeId: 'vol-0a1b2c3d4e5f00004', Size: 20, VolumeType: 'gp2', State: 'in-use', Encrypted: false, AvailabilityZone: 'eu-west-3b', CreateTime: '2026-11-01T07:30:02.000Z', Iops: 100, Attachments: [{ InstanceId: 'i-0a1b2c3d4e5f60003', Device: '/dev/xvda', State: 'attached' }], Tags: [{ Key: 'Name', Value: 'api-01-root' }] },
    { VolumeId: 'vol-0a1b2c3d4e5f00005', Size: 250, VolumeType: 'io2', State: 'available', Encrypted: true, AvailabilityZone: 'eu-west-3a', CreateTime: '2026-09-15T11:20:00.000Z', Iops: 4000, Attachments: [] },
    { VolumeId: 'vol-0a1b2c3d4e5f00006', Size: 30, VolumeType: 'gp3', State: 'in-use', Encrypted: true, AvailabilityZone: 'eu-west-3b', CreateTime: '2026-11-16T09:00:03.000Z', Iops: 3000, Attachments: [{ InstanceId: 'i-0a1b2c3d4e5f60004', Device: '/dev/xvdf', State: 'attached' }] },
  ],
}

export const UTILISATEURS = [
  { id: 1, name: 'Alice Martin', email: 'alice.martin@example.com', active: true, age: 34, roles: ['admin', 'dev'], address: { city: 'Paris' } },
  { id: 2, name: 'Bruno Petit', email: 'bruno.petit@example.com', active: false, age: 28, roles: ['dev'], address: { city: 'Lyon' } },
  { id: 3, name: 'Chloé Durand', email: null, active: true, age: 41, roles: ['ops'], address: { city: 'Paris' } },
  { id: 4, name: 'David Leroy', active: true, age: 25, roles: [], address: { city: 'Nantes' } },
]

export const FORMULAIRE = {
  formulaire: {
    id: 'inscription',
    version: 3,
    champs: [
      { nom: 'email', type: 'email', obligatoire: true },
      { nom: 'age', type: 'number', obligatoire: false },
      { nom: 'pays', type: 'select', obligatoire: true, options: ['FR', 'BE', 'CH'] },
    ],
    options: { langue: 'fr', captcha: true },
  },
}

export const EXEMPLES = [
  { id: 'ec2', nom: 'AWS EC2 · describe-instances', données: EC2, descriptions: ['Retourner les instances EC2 en état running avec leur ID et leur type', 'Count running instances by instance type', 'Nom (tag Name) et IP privée des instances de prod'] },
  { id: 'pods', nom: 'Kubernetes · kubectl get pods -o json', données: PODS, descriptions: ['Récupérer les noms, namespaces et IP des pods Running', 'Get pod names in namespace kube-system', 'Nombre de pods par phase'] },
  { id: 'ebs', nom: 'AWS EBS · describe-volumes', données: EBS, descriptions: ['Lister les volumes EBS disponibles avec leur ID et leur taille', 'Combien de volumes EBS sont disponibles ?', 'Total size of unencrypted volumes'] },
  { id: 'users', nom: 'Utilisateurs (tableau)', données: UTILISATEURS, descriptions: ['Afficher les utilisateurs actifs et leurs adresses email', 'Users older than 30 sorted by age', 'Compter le nombre total d\'utilisateurs'] },
  { id: 'formulaire', nom: 'Objets imbriqués', données: FORMULAIRE, descriptions: ['Je souhaite avoir la valeur de la clé champs', 'Noms des champs obligatoires', 'Value of key langue'] },
]
