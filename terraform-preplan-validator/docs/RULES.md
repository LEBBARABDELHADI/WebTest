# Catalogue des règles tfpv

Généré par `tfpv rules --format markdown`. Les mêmes règles servent au moteur intégré à React Blocs (`react-blocks/src/lib/tfpv/donnees/connaissances.js`, généré par `outils/donnees_navigateur.py`) et au moteur CLI. L'identifiant d'origine (règle TFLint, politique Checkov, diagnostic Terraform) reste visible dans chaque constat (`engine_rules`).

*Bloquant* : `terraform plan` ou `apply` échouera ; *échoue à* : l'étape où l'erreur apparaît.

| Rule | Severity | Category | Blocking (fails at) | Title |
|---|---|---|---|---|
| `AWS_DEPRECATED` | MEDIUM | AWS_VALIDITY | no | Deprecated AWS runtime or feature |
| `AWS_INVALID_ATTRIBUTE_VALUE` | HIGH | AWS_VALIDITY | yes (apply) | Value not accepted by the AWS API |
| `AWS_INVALID_INSTANCE_TYPE` | HIGH | AWS_VALIDITY | yes (apply) | Invalid AWS instance type |
| `AWS_INVALID_REFERENCE_DEEP` | HIGH | AWS_VALIDITY | yes (apply) | Referenced AWS object not found (deep check) |
| `AWS_PREVIOUS_GENERATION_TYPE` | LOW | AWS_VALIDITY | no | Previous-generation instance type |
| `EC2_AMI_ID_MALFORMED` | HIGH | AWS_VALIDITY | yes (apply) | Malformed AMI ID |
| `EC2_AMI_NOT_FOUND` | HIGH | AWS_VALIDITY | yes (apply) | AMI not found in the region |
| `EC2_INSTANCE_TYPE_NOT_OFFERED` | HIGH | AWS_VALIDITY | yes (apply) | Instance type not offered in the region |
| `TF_INVALID_RESOURCE_TYPE` | HIGH | AWS_VALIDITY | yes (validate) | Resource or data source type does not exist |
| `TF_BLOCK_COUNT` | HIGH | CONFIGURATION | yes (validate) | Wrong number of nested blocks |
| `TF_COUNT_AND_FOR_EACH` | HIGH | CONFIGURATION | yes (validate) | count and for_each together |
| `TF_DEPRECATED` | LOW | CONFIGURATION | no | Deprecated argument or attribute |
| `TF_DUPLICATE_DECLARATION` | HIGH | CONFIGURATION | yes (validate) | Duplicate declaration |
| `TF_INVALID_ARGUMENT_VALUE` | HIGH | CONFIGURATION | yes (validate) | Argument value rejected by the provider |
| `TF_MISSING_REQUIRED_ARGUMENT` | HIGH | CONFIGURATION | yes (validate) | Required argument missing |
| `TF_UNCONFIGURABLE_ATTRIBUTE` | HIGH | CONFIGURATION | yes (validate) | Attribute cannot be set |
| `TF_UNDECLARED_REFERENCE` | HIGH | CONFIGURATION | yes (validate) | Reference to an undeclared object |
| `TF_UNSUPPORTED_ARGUMENT` | HIGH | CONFIGURATION | yes (validate) | Argument not supported by the provider schema |
| `TF_UNSUPPORTED_ATTRIBUTE` | HIGH | CONFIGURATION | yes (validate) | Reference to an attribute that does not exist |
| `TF_UNSUPPORTED_BLOCK` | HIGH | CONFIGURATION | yes (validate) | Block type not supported |
| `TF_VALIDATE_ERROR` | HIGH | CONFIGURATION | yes (validate) | Terraform validation error |
| `TF_VALIDATE_WARNING` | LOW | CONFIGURATION | no | Terraform validation warning |
| `AWS_DB_DEFAULT_PARAMETER_GROUP` | LOW | DATABASE | no | Default DB parameter group |
| `AWS_INVALID_DB_ENGINE` | HIGH | DATABASE | yes (apply) | Invalid RDS engine |
| `AWS_INVALID_DB_INSTANCE_CLASS` | HIGH | DATABASE | yes (apply) | Invalid RDS instance class |
| `DYNAMODB_HARDENING` | LOW | DATABASE | no | DynamoDB backup/encryption options |
| `ELASTICACHE_UNENCRYPTED` | MEDIUM | DATABASE | no | ElastiCache not encrypted |
| `RDS_AURORA_ENGINE_ON_INSTANCE` | HIGH | DATABASE | yes (apply) | Aurora engine on a standalone DB instance |
| `RDS_ENGINE_VERSION_NOT_FOUND` | HIGH | DATABASE | yes (apply) | RDS engine version not available |
| `RDS_HARDENING` | LOW | DATABASE | no | Optional RDS hardening |
| `RDS_IOPS_STORAGE_TYPE_CONFLICT` | HIGH | DATABASE | yes (apply) | iops incompatible with the storage type |
| `RDS_MAX_STORAGE_BELOW_ALLOCATED` | HIGH | DATABASE | yes (apply) | max_allocated_storage lower than allocated_storage |
| `RDS_MULTI_AZ_WITH_AZ` | HIGH | DATABASE | yes (apply) | multi_az combined with availability_zone |
| `RDS_PUBLICLY_ACCESSIBLE` | HIGH | DATABASE | no | RDS instance publicly accessible |
| `RDS_STORAGE_BELOW_MINIMUM` | MEDIUM | DATABASE | yes (apply) | Allocated storage below the engine minimum |
| `RDS_UNENCRYPTED` | HIGH | DATABASE | no | RDS storage not encrypted |
| `AWS_IAM_POLICY_TOO_LONG` | HIGH | IAM | yes (apply) | IAM policy too long |
| `IAM_EXCESSIVE_PERMISSIONS` | HIGH | IAM | no | IAM policy allows sensitive permissions without constraints |
| `IAM_FULL_ADMIN` | CRITICAL | IAM | no | IAM policy grants full administrator privileges |
| `IAM_HYGIENE` | LOW | IAM | no | IAM hygiene |
| `IAM_INVALID_PRINCIPAL` | HIGH | IAM | yes (apply) | Invalid principal in policy |
| `IAM_NOTACTION_ALLOW` | HIGH | IAM | no | Allow with NotAction |
| `IAM_POLICY_INVALID_JSON` | HIGH | IAM | yes (plan) | Policy document is not valid JSON |
| `IAM_TRUST_ANY_PRINCIPAL` | HIGH | IAM | no | Role can be assumed by anyone |
| `IAM_UNCONSTRAINED_WRITE` | MEDIUM | IAM | no | IAM policy allows write access without constraints |
| `IAM_WILDCARD_ACTION` | HIGH | IAM | no | IAM policy uses wildcard actions |
| `IAM_WILDCARD_RESOURCE` | MEDIUM | IAM | no | IAM policy uses wildcard resources |
| `TF_CORE_VERSION` | HIGH | MODULES_PROVIDERS | yes (init) | Terraform version not allowed by required_version |
| `TF_INIT_ERROR` | HIGH | MODULES_PROVIDERS | yes (init) | Terraform init error |
| `TF_LOCAL_MODULE_NOT_FOUND` | HIGH | MODULES_PROVIDERS | yes (init) | Local module directory not found |
| `TF_MISSING_PROVIDER_CONSTRAINT` | MEDIUM | MODULES_PROVIDERS | no | Provider without source or version constraint |
| `TF_MISSING_REQUIRED_VERSION` | LOW | MODULES_PROVIDERS | no | No required_version |
| `TF_MODULE_INSTALL` | HIGH | MODULES_PROVIDERS | yes (init) | Module cannot be installed |
| `TF_MODULE_MISSING_ARGUMENT` | HIGH | MODULES_PROVIDERS | yes (validate) | Module call misses a required input |
| `TF_PROVIDER_RESOLUTION` | HIGH | MODULES_PROVIDERS | yes (init) | Provider cannot be installed |
| `TF_UNDECLARED_PROVIDER` | HIGH | MODULES_PROVIDERS | yes (validate) | Reference to an undeclared provider configuration |
| `TF_UNPINNED_MODULE` | MEDIUM | MODULES_PROVIDERS | no | Module source not pinned |
| `AWS_HYGIENE` | LOW | NETWORK | no | Unused or unattached resource |
| `AWS_ROUTE_MULTIPLE_TARGETS` | HIGH | NETWORK | yes (apply) | Route with several targets |
| `AWS_ROUTE_WITHOUT_TARGET` | HIGH | NETWORK | yes (apply) | Route without target |
| `NET_INVALID_CIDR` | HIGH | NETWORK | yes (plan) | Invalid CIDR block |
| `NET_SUBNET_CIDR_SIZE` | HIGH | NETWORK | yes (apply) | Subnet CIDR size not allowed |
| `NET_SUBNET_OUTSIDE_VPC` | HIGH | NETWORK | yes (apply) | Subnet outside the VPC CIDR |
| `NET_SUBNET_OVERLAP` | HIGH | NETWORK | yes (apply) | Overlapping subnets |
| `NET_VPC_CIDR_SIZE` | HIGH | NETWORK | yes (apply) | VPC CIDR size not allowed |
| `SG_ALL_PROTOCOL_WITH_PORTS` | MEDIUM | NETWORK | yes (apply) | Ports set with protocol -1 (all) |
| `SG_PORT_RANGE_INVALID` | HIGH | NETWORK | yes (apply) | Invalid security group port range |
| `SUBNET_PUBLIC_IP_ON_LAUNCH` | MEDIUM | NETWORK | no | Subnet assigns public IPs automatically |
| `VPC_FLOW_LOGS` | LOW | NETWORK | no | VPC flow logs disabled |
| `ALB_HTTP_LISTENER` | MEDIUM | SECURITY | no | Load balancer listener in plain HTTP |
| `CLOUDTRAIL_HARDENING` | MEDIUM | SECURITY | no | CloudTrail not fully hardened |
| `EC2_HARDENING` | LOW | SECURITY | no | Optional EC2 hardening |
| `EC2_IMDSV1_ENABLED` | MEDIUM | SECURITY | no | IMDSv1 enabled |
| `EC2_PUBLIC_IP` | MEDIUM | SECURITY | no | EC2 instance with a public IP |
| `EC2_SECRETS_IN_USER_DATA` | CRITICAL | SECURITY | no | Secrets in EC2 user data |
| `ECR_HARDENING` | LOW | SECURITY | no | ECR repository hardening |
| `EKS_PUBLIC_ENDPOINT` | HIGH | SECURITY | no | EKS API endpoint public to the Internet |
| `EKS_SECRETS_ENCRYPTION` | MEDIUM | SECURITY | no | EKS secrets not encrypted with KMS |
| `KMS_KEY_ROTATION` | MEDIUM | SECURITY | no | KMS key rotation disabled |
| `MESSAGING_UNENCRYPTED` | MEDIUM | SECURITY | no | Queue or topic not encrypted |
| `PROVIDER_HARDCODED_CREDENTIALS` | CRITICAL | SECURITY | no | Hard-coded AWS credentials |
| `SECRET_HARDCODED` | HIGH | SECURITY | no | Secret written in the configuration |
| `SECURITY_GENERIC` | MEDIUM | SECURITY | no | Security best practice (Checkov) |
| `SG_ALL_PORTS_OPEN_TO_INTERNET` | CRITICAL | SECURITY | no | All ports open to the Internet |
| `SG_HTTP_OPEN_TO_INTERNET` | MEDIUM | SECURITY | no | HTTP port 80 open to the Internet |
| `SG_HYGIENE` | LOW | SECURITY | no | Security group hygiene |
| `SG_RDP_OPEN_TO_INTERNET` | HIGH | SECURITY | no | RDP open to the Internet |
| `SG_SENSITIVE_PORT_OPEN` | HIGH | SECURITY | no | Sensitive port open to the Internet |
| `SG_SSH_OPEN_TO_INTERNET` | HIGH | SECURITY | no | SSH open to the Internet |
| `AWS_S3_BUCKET_NAME` | HIGH | STORAGE | yes (apply) | Invalid S3 bucket name |
| `EBS_IOPS_NOT_SUPPORTED` | HIGH | STORAGE | yes (plan) | iops set on a volume type that does not support it |
| `EBS_IOPS_REQUIRED` | HIGH | STORAGE | yes (plan) | Provisioned IOPS volume without iops |
| `EBS_SIZE_BELOW_MINIMUM` | HIGH | STORAGE | yes (apply) | Volume smaller than the minimum size |
| `EBS_THROUGHPUT_NOT_SUPPORTED` | HIGH | STORAGE | yes (plan) | throughput set on a non-gp3 volume |
| `EBS_UNENCRYPTED` | MEDIUM | STORAGE | no | EBS volume not encrypted |
| `S3_ACCESS_LOGGING` | LOW | STORAGE | no | S3 access logging disabled |
| `S3_BUCKET_ENCRYPTION` | MEDIUM | STORAGE | no | S3 bucket without explicit encryption configuration |
| `S3_BUCKET_KMS_ENCRYPTION` | LOW | STORAGE | no | S3 bucket not encrypted with KMS |
| `S3_BUCKET_POLICY_PUBLIC` | HIGH | STORAGE | no | S3 bucket policy allows any principal |
| `S3_BUCKET_VERSIONING` | MEDIUM | STORAGE | no | S3 bucket versioning disabled |
| `S3_OPTIONAL_HARDENING` | LOW | STORAGE | no | Optional S3 hardening |
| `S3_PUBLIC_ACCESS_BLOCK` | HIGH | STORAGE | no | S3 bucket without Public Access Block |
| `S3_PUBLIC_ACL` | CRITICAL | STORAGE | no | S3 bucket publicly readable or writable |
| `AWS_TAGS` | LOW | STYLE | no | Tagging rule |
| `TF_DEPRECATED_SYNTAX` | LOW | STYLE | no | Deprecated Terraform syntax |
| `TF_FORMAT` | LOW | STYLE | no | File not in canonical format |
| `TF_LINT` | LOW | STYLE | no | TFLint Terraform rule |
| `TF_UNUSED_DECLARATION` | LOW | STYLE | no | Unused declaration |
| `TF_SYNTAX_ERROR` | CRITICAL | SYNTAX | yes (init) | Invalid HCL syntax |
| `TF_INVALID_DEFAULT` | HIGH | VARIABLES | yes (validate) | Variable default does not match its type |
| `TF_MISSING_VARIABLE_VALUE` | HIGH | VARIABLES | yes (plan) | Required variable has no value |
| `TF_SENSITIVE_OUTPUT` | HIGH | VARIABLES | yes (validate) | Output exposes a sensitive value |
| `TF_UNDECLARED_VARIABLE_VALUE` | LOW | VARIABLES | no | Value set for an undeclared variable |
| `TF_UNTYPED_VARIABLE` | LOW | VARIABLES | no | Variable without type |
| `TF_VARIABLE_TYPE_MISMATCH` | HIGH | VARIABLES | yes (plan) | Variable value does not match its type |
