"""Knowledge base: canonical rules and how engine rules map onto them.

Every finding, whatever engine produced it, is attached to a canonical rule
that carries the explanation, probable cause, severity, recommendation and
documentation. Engine-specific names (TFLint rule, Checkov ID, Terraform
diagnostic summary) are kept on the finding for traceability.

Severity notes:
* Checkov OSS does not return severities without a Prisma Cloud API key, so
  tfpv assigns them here (overridable in .tfpv.toml).
* `blocking` means "terraform plan or apply will fail"; `fails_at` says when.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

TF_DOCS = "https://developer.hashicorp.com/terraform"
TFLINT_AWS_DOCS = "https://github.com/terraform-linters/tflint-ruleset-aws/blob/master/docs/rules"
CHECKOV_INDEX = "https://www.checkov.io/5.Policy%20Index/terraform.html"


@dataclass(frozen=True)
class Rule:
    id: str
    title: str
    severity: str
    category: str
    blocking: bool
    fails_at: str
    description: str
    cause: str
    recommendation: str
    fix: str | None = None
    references: tuple[str, ...] = ()
    confidence: str = "high"
    tier: str = "static"


RULES: dict[str, Rule] = {}


def _r(*args, **kwargs) -> Rule:
    rule = Rule(*args, **kwargs)
    RULES[rule.id] = rule
    return rule


# --------------------------------------------------------------------------
# Terraform core (scanner + terraform fmt/init/validate)
# --------------------------------------------------------------------------
_r("TF_SYNTAX_ERROR", "Invalid HCL syntax", "CRITICAL", "SYNTAX", True, "init",
   "The file cannot be parsed; Terraform stops before evaluating anything.",
   "Missing or extra brace, unterminated string or heredoc, missing value after '=', invalid character.",
   "Fix the syntax at the reported line. `terraform fmt` and `terraform validate` print the exact location.",
   references=(f"{TF_DOCS}/language/syntax/configuration",))
_r("TF_FORMAT", "File not in canonical format", "LOW", "STYLE", False, "none",
   "`terraform fmt -check` reports that the file does not follow the canonical style.",
   "Manual edits not formatted (indentation, alignment of '=').",
   "Run `terraform fmt` (tfpv never rewrites files) and add `terraform fmt -check` to your CI.",
   fix="terraform fmt -recursive", references=(f"{TF_DOCS}/cli/commands/fmt",))
_r("TF_MISSING_VARIABLE_VALUE", "Required variable has no value", "HIGH", "VARIABLES", True, "plan",
   "The variable has no default and no value was found in terraform.tfvars, *.auto.tfvars, the --var-file/--var options or TF_VAR_ environment variables.",
   "The value is expected from the command line or the CI and is not provided to this run.",
   "Provide the value (tfvars file, `-var-file`, or `TF_VAR_<name>` in CI) or add a default. With `-input=false`, plan fails with \"No value for required variable\". If the value is passed at runtime, give the same file to tfpv with --var-file.",
   references=(f"{TF_DOCS}/language/values/variables#assigning-values-to-root-module-variables",), confidence="medium")
_r("TF_VARIABLE_TYPE_MISMATCH", "Variable value does not match its type", "HIGH", "VARIABLES", True, "plan",
   "The value assigned to the variable cannot be converted to the declared type constraint; `terraform validate` does not check variable values.",
   "Wrong value type in a tfvars file (e.g. a word instead of a number) or an object missing a required attribute.",
   "Assign a value of the declared type, or change the type constraint if the value is the intended one.",
   references=(f"{TF_DOCS}/language/values/variables#type-constraints",))
_r("TF_UNDECLARED_VARIABLE_VALUE", "Value set for an undeclared variable", "LOW", "VARIABLES", False, "none",
   "A variable definitions file sets a variable that the root module does not declare; Terraform only warns.",
   "Typo in the variable name, or a variable removed from the configuration.",
   "Rename or remove the value, or declare the variable.",
   references=(f"{TF_DOCS}/language/values/variables#variable-definitions-tfvars-files",))
_r("TF_LOCAL_MODULE_NOT_FOUND", "Local module directory not found", "HIGH", "MODULES_PROVIDERS", True, "init",
   "The module source points to a local directory that does not exist or contains no .tf file.",
   "Wrong relative path, directory renamed, or module not committed.",
   "Fix the `source` path (relative to the calling module) and make sure the directory contains .tf files.",
   references=(f"{TF_DOCS}/language/modules/sources#local-paths",))
_r("TF_MODULE_MISSING_ARGUMENT", "Module call misses a required input", "HIGH", "MODULES_PROVIDERS", True, "validate",
   "The child module declares a variable without default that the module block does not set.",
   "New required variable in the module, or typo in the argument name.",
   "Set the argument in the module block or give the variable a default in the module.",
   references=(f"{TF_DOCS}/language/modules/syntax#calling-a-child-module",))
_r("TF_UNDECLARED_REFERENCE", "Reference to an undeclared object", "HIGH", "CONFIGURATION", True, "validate",
   "An expression references a resource, data source, variable, local or module that is not declared in this module.",
   "Typo in the name, object removed or renamed, or reference to an object of another module.",
   "Fix the name or declare the object. Objects of other modules are only reachable through their outputs (module.<name>.<output>).",
   references=(f"{TF_DOCS}/language/expressions/references",))
_r("TF_UNSUPPORTED_ARGUMENT", "Argument not supported by the provider schema", "HIGH", "CONFIGURATION", True, "validate",
   "The argument does not exist for this resource type in the installed provider version.",
   "Typo, argument removed or moved to a separate resource in a newer provider major version, or wrong provider version.",
   "Check the resource documentation for the provider version selected in .terraform.lock.hcl.",
   references=("https://registry.terraform.io/providers/hashicorp/aws/latest/docs",))
_r("TF_MISSING_REQUIRED_ARGUMENT", "Required argument missing", "HIGH", "CONFIGURATION", True, "validate",
   "A required argument of the resource or module is not set.",
   "Argument forgotten or renamed.",
   "Add the argument; the provider documentation lists required arguments.",
   references=("https://registry.terraform.io/providers/hashicorp/aws/latest/docs",))
_r("TF_UNSUPPORTED_BLOCK", "Block type not supported", "HIGH", "CONFIGURATION", True, "validate",
   "A nested block is not part of the schema of this resource type.",
   "Typo, or block removed in a newer provider major version.",
   "Check the resource documentation for the selected provider version.")
_r("TF_UNSUPPORTED_ATTRIBUTE", "Reference to an attribute that does not exist", "HIGH", "CONFIGURATION", True, "validate",
   "An expression reads an attribute that the referenced resource type does not export.",
   "Typo or attribute that belongs to another resource type.",
   "Check the 'Attributes Reference' section of the resource documentation.")
_r("TF_INVALID_RESOURCE_TYPE", "Resource or data source type does not exist", "HIGH", "AWS_VALIDITY", True, "validate",
   "The provider does not implement this resource or data source type.",
   "Typo in the type, resource removed from the provider, or wrong provider prefix.",
   "Use a type listed in the provider documentation for the selected version.",
   references=("https://registry.terraform.io/providers/hashicorp/aws/latest/docs",))
_r("TF_INVALID_ARGUMENT_VALUE", "Argument value rejected by the provider", "HIGH", "CONFIGURATION", True, "validate",
   "The provider schema validation rejects the value (wrong type, format or allowed value).",
   "Value outside the allowed set, wrong format (CIDR, ARN...), or wrong type.",
   "Use a value accepted by the provider; the diagnostic detail lists the expected format.")
_r("TF_DUPLICATE_DECLARATION", "Duplicate declaration", "HIGH", "CONFIGURATION", True, "validate",
   "Two objects of the same kind share the same name in the module.",
   "Copy/paste or the same resource defined in two files.",
   "Rename or remove one of the declarations.")
_r("TF_PROVIDER_RESOLUTION", "Provider cannot be installed", "HIGH", "MODULES_PROVIDERS", True, "init",
   "`terraform init` cannot find or install a provider version matching the constraints and the lock file.",
   "Conflicting version constraints between modules, wrong provider source address, lock file out of date, or registry unreachable.",
   "Align `required_providers` constraints across modules, run `terraform init -upgrade` locally, and commit .terraform.lock.hcl.",
   references=(f"{TF_DOCS}/language/files/dependency-lock",), tier="providers")
_r("TF_MODULE_INSTALL", "Module cannot be installed", "HIGH", "MODULES_PROVIDERS", True, "init",
   "`terraform init` cannot download or read a module.",
   "Wrong source address or version, private registry/Git credentials missing, or network access missing.",
   "Check the module `source`/`version`; for private sources configure credentials (CLI config file, Git SSH key).",
   references=(f"{TF_DOCS}/language/modules/sources",), tier="providers")
_r("TF_CORE_VERSION", "Terraform version not allowed by required_version", "HIGH", "MODULES_PROVIDERS", True, "init",
   "The running Terraform version does not satisfy `required_version`.",
   "Local or CI Terraform version differs from the version the configuration expects.",
   "Pin the same Terraform version locally and in CI (tfenv, mise, asdf, or a container image).",
   references=(f"{TF_DOCS}/language/terraform#required_version",))
_r("TF_DEPRECATED", "Deprecated argument or attribute", "LOW", "CONFIGURATION", False, "none",
   "The provider marks an argument, attribute or resource as deprecated.",
   "Provider evolution; the deprecated item will be removed in a future major version.",
   "Migrate to the replacement named in the diagnostic before the next provider major upgrade.")
_r("TF_VALIDATE_ERROR", "Terraform validation error", "HIGH", "CONFIGURATION", True, "validate",
   "`terraform validate` reports an error.", "See the Terraform message.", "Fix the error reported by Terraform at this location.")
_r("TF_VALIDATE_WARNING", "Terraform validation warning", "LOW", "CONFIGURATION", False, "none",
   "`terraform validate` reports a warning.", "See the Terraform message.", "Review the warning.")
_r("TF_INIT_ERROR", "Terraform init error", "HIGH", "MODULES_PROVIDERS", True, "init",
   "`terraform init -backend=false` failed.", "See the Terraform message.", "Fix the error reported by Terraform.", tier="providers")

_r("TF_UNCONFIGURABLE_ATTRIBUTE", "Attribute cannot be set", "HIGH", "CONFIGURATION", True, "validate",
   "The attribute is computed by the provider (read-only); Terraform rejects a value for it (\"Value for unconfigurable attribute\").",
   "Copy of an attribute from the documentation's 'Attributes Reference' (e.g. arn, id) into the arguments.",
   "Remove the argument; read the value with a reference instead (e.g. aws_vpc.main.arn).")
_r("TF_BLOCK_COUNT", "Wrong number of nested blocks", "HIGH", "CONFIGURATION", True, "validate",
   "The nested block appears more often than the provider schema allows, or a required block is missing (\"Too many ... blocks\" / \"Insufficient ... blocks\").",
   "Block duplicated, or required block forgotten.", "Keep the number of blocks allowed by the resource documentation.")
_r("TF_COUNT_AND_FOR_EACH", "count and for_each together", "HIGH", "CONFIGURATION", True, "validate",
   "A resource, data source or module cannot use both count and for_each.", "Refactoring left both meta-arguments.",
   "Keep only one of them (for_each is usually preferred for stable addresses).")
_r("TF_INVALID_DEFAULT", "Variable default does not match its type", "HIGH", "VARIABLES", True, "validate",
   "The default value cannot be converted to the declared type constraint (\"Invalid default value for variable\").",
   "Type changed without updating the default, or wrong literal.", "Make the default match the type, or fix the type constraint.",
   references=(f"{TF_DOCS}/language/values/variables#type-constraints",))
_r("TF_SENSITIVE_OUTPUT", "Output exposes a sensitive value", "HIGH", "VARIABLES", True, "validate",
   "The output refers to a sensitive variable but is not marked sensitive; Terraform refuses it (\"Output refers to sensitive values\").",
   "sensitive = true forgotten on the output.", "Add sensitive = true to the output (or stop exposing the value).",
   fix="sensitive = true", references=(f"{TF_DOCS}/language/values/outputs#sensitive-suppressing-values-in-cli-output",))
_r("TF_UNDECLARED_PROVIDER", "Reference to an undeclared provider configuration", "HIGH", "MODULES_PROVIDERS", True, "validate",
   "The provider meta-argument points to an alias that no provider block declares.", "Alias renamed or provider block missing.",
   "Declare provider \"<name>\" { alias = \"<alias>\" } or fix the reference.",
   references=(f"{TF_DOCS}/language/providers/configuration#alias-multiple-provider-configurations",))

# TFLint terraform ruleset
_r("TF_MISSING_REQUIRED_VERSION", "No required_version", "LOW", "MODULES_PROVIDERS", False, "none",
   "The configuration does not constrain the Terraform version.", "`required_version` missing in the terraform block.",
   "Add `required_version` so that every environment uses a compatible Terraform.", fix='terraform {\n  required_version = ">= 1.6"\n}')
_r("TF_MISSING_PROVIDER_CONSTRAINT", "Provider without source or version constraint", "MEDIUM", "MODULES_PROVIDERS", False, "none",
   "A provider is used without `required_providers` source/version constraints.",
   "Constraint forgotten; a new provider major version can be selected silently and break the plan.",
   "Declare the provider in `required_providers` with a version constraint and commit .terraform.lock.hcl.",
   fix='terraform {\n  required_providers {\n    aws = {\n      source  = "hashicorp/aws"\n      version = "~> 6.0"\n    }\n  }\n}')
_r("TF_UNTYPED_VARIABLE", "Variable without type", "LOW", "VARIABLES", False, "none",
   "The variable has no type constraint, so wrong values are only detected late.", "`type` omitted.",
   "Add a `type` (string, number, list(...), object({...})).")
_r("TF_UNUSED_DECLARATION", "Unused declaration", "LOW", "STYLE", False, "none",
   "A variable, local, data source or provider requirement is declared but never used.", "Leftover after refactoring.",
   "Remove it, or use it if it was meant to be referenced.")
_r("TF_DEPRECATED_SYNTAX", "Deprecated Terraform syntax", "LOW", "STYLE", False, "none",
   "Legacy syntax (interpolation-only strings, .0 index, lookup with 2 arguments).", "Configuration written for Terraform 0.11.",
   "Use the modern syntax shown in the TFLint rule documentation.")
_r("TF_UNPINNED_MODULE", "Module source not pinned", "MEDIUM", "MODULES_PROVIDERS", False, "none",
   "A module is referenced without a fixed version or ref; a new release can change the plan unexpectedly.",
   "Registry module without `version`, or Git source without `?ref=`.",
   "Pin a version (`version = \"x.y.z\"`) or a Git tag/commit (`?ref=v1.2.3`).")
_r("TF_LINT", "TFLint Terraform rule", "LOW", "STYLE", False, "none",
   "A Terraform best-practice rule of TFLint reports an issue.", "See the TFLint message.", "Follow the TFLint rule documentation.")

# --------------------------------------------------------------------------
# AWS validity (TFLint AWS ruleset + tfpv AWS validator)
# --------------------------------------------------------------------------
_r("AWS_INVALID_INSTANCE_TYPE", "Invalid AWS instance type", "HIGH", "AWS_VALIDITY", True, "apply",
   "The specified EC2 instance type is not recognized.",
   "Typo or non-existent size. A type released after the TFLint AWS ruleset version can also be unknown to it.",
   "Verify that the instance type exists in the selected AWS region and is supported by the selected architecture and AMI: "
   "`aws ec2 describe-instance-type-offerings --location-type region --filters Name=instance-type,Values=<type> --region <region>` "
   "(or run tfpv with --aws-checks). `terraform plan` does not catch this: the error appears at apply.",
   references=("https://aws.amazon.com/ec2/instance-types/", f"{TFLINT_AWS_DOCS}/aws_instance_invalid_type.md"))
_r("AWS_PREVIOUS_GENERATION_TYPE", "Previous-generation instance type", "LOW", "AWS_VALIDITY", False, "none",
   "The instance or database class belongs to a previous generation (obsolete).",
   "Old configuration copied over; newer generations are usually cheaper and faster.",
   "Move to a current generation (e.g. t2 → t3/t4g, m4 → m7i/m7g) after checking AMI/engine compatibility.",
   references=("https://aws.amazon.com/ec2/previous-generation/",))
_r("AWS_INVALID_DB_INSTANCE_CLASS", "Invalid RDS instance class", "HIGH", "DATABASE", True, "apply",
   "The DB instance class is not recognized.", "Typo, or class not available for the engine.",
   "Check the supported classes: `aws rds describe-orderable-db-instance-options --engine <engine> --region <region>`.",
   references=("https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html",))
_r("AWS_INVALID_DB_ENGINE", "Invalid RDS engine", "HIGH", "DATABASE", True, "apply",
   "The database engine name is not recognized.", "Typo (e.g. 'postgresql' instead of 'postgres').",
   "Use an engine name from `aws rds describe-db-engine-versions --query 'DBEngineVersions[].Engine'`.",
   references=("https://docs.aws.amazon.com/AmazonRDS/latest/APIReference/API_CreateDBInstance.html",))
_r("AWS_DB_DEFAULT_PARAMETER_GROUP", "Default DB parameter group", "LOW", "DATABASE", False, "none",
   "The instance uses a default parameter group, which cannot be modified.", "No custom parameter group.",
   "Create an aws_db_parameter_group so that parameters can be tuned without recreating the instance.")
_r("AWS_DEPRECATED", "Deprecated AWS runtime or feature", "MEDIUM", "AWS_VALIDITY", False, "apply",
   "The resource uses a deprecated runtime or feature (e.g. Lambda runtime past end of support).",
   "Configuration not updated after an AWS deprecation.",
   "Upgrade to a supported runtime; AWS blocks the creation/update of functions using deprecated runtimes after the block date.",
   references=("https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html",))
_r("AWS_ROUTE_WITHOUT_TARGET", "Route without target", "HIGH", "NETWORK", True, "apply",
   "The route does not specify any target (gateway, NAT gateway, instance, interface, peering...).", "Target argument missing.",
   "Set exactly one target argument on the route.")
_r("AWS_ROUTE_MULTIPLE_TARGETS", "Route with several targets", "HIGH", "NETWORK", True, "apply",
   "The route specifies more than one target; AWS accepts exactly one.", "Several target arguments set.",
   "Keep exactly one target argument.")
_r("AWS_INVALID_ATTRIBUTE_VALUE", "Value not accepted by the AWS API", "HIGH", "AWS_VALIDITY", True, "apply",
   "The value does not match the constraints of the AWS API for this attribute (rules generated from the AWS SDK models by the TFLint AWS ruleset).",
   "Typo, unsupported enum value, or value outside the allowed length/pattern.",
   "Check the allowed values for this attribute in the AWS API reference and the provider documentation.",
   references=(f"{TFLINT_AWS_DOCS}/README.md",))
_r("AWS_INVALID_REFERENCE_DEEP", "Referenced AWS object not found (deep check)", "HIGH", "AWS_VALIDITY", True, "apply",
   "TFLint deep checking could not find the referenced AWS object (AMI, subnet, security group, IAM profile...) in the account.",
   "The object does not exist in this account/region, or credentials point to another account.",
   "Check the identifier, the region and the AWS profile used.", tier="aws",
   references=("https://github.com/terraform-linters/tflint-ruleset-aws/blob/master/docs/deep_checking.md",))
_r("AWS_S3_BUCKET_NAME", "Invalid S3 bucket name", "HIGH", "STORAGE", True, "apply",
   "The bucket name does not follow the S3 naming rules.", "Upper case, underscore, invalid length or format.",
   "Use 3-63 lowercase letters, digits, dots or hyphens, starting and ending with a letter or digit.",
   references=("https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html",))
_r("AWS_IAM_POLICY_TOO_LONG", "IAM policy too long", "HIGH", "IAM", True, "apply",
   "The policy document exceeds the IAM size quota.", "Policy listing many resources/actions.",
   "Split the policy, use wildcards on resource name prefixes carefully, or use managed policies.",
   references=("https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html",))
_r("AWS_TAGS", "Tagging rule", "LOW", "STYLE", False, "none",
   "A tagging convention rule reports a missing tag.", "Tags not set.", "Add the required tags (or provider default_tags).")

# tfpv AWS validator (cross-attribute / cross-resource coherence not covered by TFLint/Checkov)
_r("NET_INVALID_CIDR", "Invalid CIDR block", "HIGH", "NETWORK", True, "plan",
   "The value is not a valid IPv4 network in CIDR notation (malformed, or host bits set).",
   "Typo, prefix length > 32, or an address with host bits instead of the network address (10.0.1.5/24 instead of 10.0.1.0/24).",
   "Use the network address with the intended prefix, e.g. 10.0.1.0/24. `cidrsubnet()` avoids manual mistakes.",
   fix='cidr_block = cidrsubnet(var.vpc_cidr, 8, 1)',
   references=("https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html",))
_r("NET_VPC_CIDR_SIZE", "VPC CIDR size not allowed", "HIGH", "NETWORK", True, "apply",
   "An IPv4 VPC CIDR block must have a prefix between /16 and /28.", "Prefix too large (/8, /12) or too small (/29+).",
   "Use a prefix between /16 and /28 (add secondary CIDR blocks if you need more addresses).",
   references=("https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html",))
_r("NET_SUBNET_CIDR_SIZE", "Subnet CIDR size not allowed", "HIGH", "NETWORK", True, "apply",
   "An IPv4 subnet CIDR block must have a prefix between /16 and /28.", "Prefix outside the allowed range.",
   "Use a prefix between /16 and /28.", references=("https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html",))
_r("NET_SUBNET_OUTSIDE_VPC", "Subnet outside the VPC CIDR", "HIGH", "NETWORK", True, "apply",
   "The subnet CIDR is not contained in any CIDR block of its VPC; AWS rejects it (InvalidSubnet.Range). `terraform plan` does not detect it.",
   "Wrong base address, VPC CIDR changed, or secondary CIDR association missing.",
   "Derive subnets from the VPC CIDR (`cidrsubnet(aws_vpc.main.cidr_block, 8, n)`) or associate a secondary CIDR (aws_vpc_ipv4_cidr_block_association).",
   fix='cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, 1)',
   references=("https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html",))
_r("NET_SUBNET_OVERLAP", "Overlapping subnets", "HIGH", "NETWORK", True, "apply",
   "Two subnets of the same VPC have overlapping CIDR blocks; AWS rejects the second one (InvalidSubnet.Conflict).",
   "Copy/paste of a CIDR, or inconsistent netnum values in cidrsubnet().",
   "Give each subnet a distinct, non-overlapping CIDR (e.g. cidrsubnet with distinct netnum values).",
   references=("https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html",))
_r("SG_PORT_RANGE_INVALID", "Invalid security group port range", "HIGH", "NETWORK", True, "apply",
   "from_port is greater than to_port, or a port is outside 0-65535.", "Ports inverted or typo.",
   "Use from_port <= to_port within 0-65535 (for a single port, set both to the same value).",
   references=("https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html",))
_r("SG_ALL_PROTOCOL_WITH_PORTS", "Ports set with protocol -1 (all)", "MEDIUM", "NETWORK", True, "apply",
   "With protocol \"-1\" (all traffic), from_port and to_port must both be 0; the rule otherwise does not do what it says (all ports are opened) and the AWS provider rejects it.",
   "Intent was a single port but the protocol was set to all.",
   "Set protocol to \"tcp\"/\"udp\" for a port range, or set from_port = 0 and to_port = 0 with protocol \"-1\".",
   references=("https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group",), confidence="medium")
_r("EBS_IOPS_NOT_SUPPORTED", "iops set on a volume type that does not support it", "HIGH", "STORAGE", True, "plan",
   "Provisioned IOPS can only be set for io1, io2 and gp3 volumes; for this type the AWS provider fails the plan (\"'iops' must not be set when 'type' is ...\").",
   "Volume type changed without removing iops, or iops copied from an io1/gp3 example.",
   "Remove `iops`, or switch the volume to gp3/io1/io2.", fix='type = "gp3"\niops = 3000',
   references=("https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html",))
_r("EBS_IOPS_REQUIRED", "Provisioned IOPS volume without iops", "HIGH", "STORAGE", True, "plan",
   "io1 and io2 volumes require `iops`; the AWS provider fails the plan (\"'iops' must be set when 'type' is ...\").",
   "iops forgotten.", "Set `iops` for io1/io2 volumes.",
   references=("https://docs.aws.amazon.com/ebs/latest/userguide/provisioned-iops.html",))
_r("EBS_THROUGHPUT_NOT_SUPPORTED", "throughput set on a non-gp3 volume", "HIGH", "STORAGE", True, "plan",
   "Throughput can only be configured on gp3 volumes; the AWS provider fails the plan for other types.",
   "Volume type is not gp3.", "Remove `throughput` or use type = \"gp3\".",
   references=("https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html",))
_r("EBS_SIZE_BELOW_MINIMUM", "Volume smaller than the minimum size", "HIGH", "STORAGE", True, "apply",
   "The volume size is below the minimum for its type (st1/sc1: 125 GiB, io1/io2: 4 GiB, gp2/gp3/standard: 1 GiB).",
   "Size copied from another volume type.", "Increase the size to at least the minimum for the type, or change the type.",
   references=("https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html",))
_r("RDS_MAX_STORAGE_BELOW_ALLOCATED", "max_allocated_storage lower than allocated_storage", "HIGH", "DATABASE", True, "apply",
   "Storage autoscaling requires max_allocated_storage to be greater than allocated_storage; AWS rejects the value.",
   "Values inverted or allocated_storage increased without updating the maximum.",
   "Set max_allocated_storage above allocated_storage, or to 0 to disable autoscaling.",
   references=("https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIOPS.StorageTypes.html#USER_PIOPS.Autoscaling",))
_r("RDS_IOPS_STORAGE_TYPE_CONFLICT", "iops incompatible with the storage type", "HIGH", "DATABASE", True, "apply",
   "Provisioned IOPS are not supported with gp2/standard storage, and are required for io1/io2.",
   "storage_type and iops not aligned.", "Use storage_type io1/io2/gp3 with iops, or remove iops for gp2/standard.",
   references=("https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html",))
_r("RDS_MULTI_AZ_WITH_AZ", "multi_az combined with availability_zone", "HIGH", "DATABASE", True, "apply",
   "A specific availability zone cannot be requested for a Multi-AZ instance (InvalidParameterCombination).",
   "availability_zone kept after enabling multi_az.", "Remove availability_zone when multi_az = true.",
   references=("https://docs.aws.amazon.com/AmazonRDS/latest/APIReference/API_CreateDBInstance.html",))
_r("RDS_AURORA_ENGINE_ON_INSTANCE", "Aurora engine on a standalone DB instance", "HIGH", "DATABASE", True, "apply",
   "Aurora engines need an aws_rds_cluster; an aws_db_instance with an Aurora engine must reference it with cluster_identifier.",
   "aws_db_instance used instead of aws_rds_cluster + aws_rds_cluster_instance.",
   "Create an aws_rds_cluster and aws_rds_cluster_instance resources, or use a non-Aurora engine.",
   references=("https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/rds_cluster",))
_r("RDS_STORAGE_BELOW_MINIMUM", "Allocated storage below the engine minimum", "MEDIUM", "DATABASE", True, "apply",
   "allocated_storage is below the usual minimum (20 GiB for gp2/gp3, 100 GiB for io1/io2 on most engines).",
   "Value copied from another engine or storage type.",
   "Increase allocated_storage; check the minimum for your engine and storage type.",
   references=("https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html",), confidence="medium")
_r("IAM_POLICY_INVALID_JSON", "Policy document is not valid JSON", "HIGH", "IAM", True, "plan",
   "The policy string cannot be parsed as JSON; the provider/IAM rejects it (MalformedPolicyDocument).",
   "Trailing comma, missing quote, or hand-written heredoc.",
   "Build policies with jsonencode() or the aws_iam_policy_document data source instead of raw strings.",
   fix='policy = jsonencode({\n  Version   = "2012-10-17"\n  Statement = [...]\n})',
   references=("https://developer.hashicorp.com/terraform/tutorials/aws/aws-iam-policy",))
_r("IAM_INVALID_PRINCIPAL", "Invalid principal in policy", "HIGH", "IAM", True, "apply",
   "A principal does not have a valid format; IAM rejects the policy (MalformedPolicyDocument: Invalid principal in policy).",
   "Typo in a service principal (amazon.com instead of amazonaws.com), account ID that is not 12 digits, or malformed ARN.",
   "Use service principals like \"ec2.amazonaws.com\", 12-digit account IDs or full ARNs (arn:aws:iam::123456789012:role/name).",
   references=("https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html",))
_r("EC2_AMI_ID_MALFORMED", "Malformed AMI ID", "HIGH", "AWS_VALIDITY", True, "apply",
   "The AMI ID does not match the format ami-xxxxxxxx (8 or 17 hexadecimal characters); AWS returns InvalidAMIID.Malformed.",
   "Typo, placeholder value, or AMI name used instead of the ID.",
   "Use a real AMI ID, or resolve it with the aws_ami data source (most_recent + filters).",
   fix='data "aws_ami" "al2023" {\n  most_recent = true\n  owners      = ["amazon"]\n  filter {\n    name   = "name"\n    values = ["al2023-ami-*-x86_64"]\n  }\n}',
   references=("https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html",))
_r("EC2_AMI_NOT_FOUND", "AMI not found in the region", "HIGH", "AWS_VALIDITY", True, "apply",
   "DescribeImages does not return this AMI in the target region/account (AMIs are regional).",
   "AMI from another region, deregistered AMI, or private AMI not shared with this account.",
   "Use an AMI available in the region (aws_ami data source) or copy/share it.", tier="aws",
   references=("https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/CopyingAMIs.html",))
_r("EC2_INSTANCE_TYPE_NOT_OFFERED", "Instance type not offered in the region", "HIGH", "AWS_VALIDITY", True, "apply",
   "DescribeInstanceTypeOfferings does not list this instance type in the target region.",
   "Type not available in this region (or misspelled).", "Choose a type offered in the region.", tier="aws",
   references=("https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-discovery.html",))
_r("RDS_ENGINE_VERSION_NOT_FOUND", "RDS engine version not available", "HIGH", "DATABASE", True, "apply",
   "DescribeDBEngineVersions does not return this engine version in the target region.",
   "Version retired, not yet available, or typo.",
   "Use a version listed by `aws rds describe-db-engine-versions --engine <engine>`.", tier="aws",
   references=("https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.VersionMgmt.html",))

# --------------------------------------------------------------------------
# Security (Checkov)
# --------------------------------------------------------------------------
def _sec(rule_id, title, sev, category, desc, cause, rec, fix=None, refs=()):
    return _r(rule_id, title, sev, category, False, "none", desc, cause, rec, fix=fix, references=refs)


_sec("S3_BUCKET_ENCRYPTION", "S3 bucket without explicit encryption configuration", "MEDIUM", "STORAGE",
     "The bucket does not have an explicit encryption configuration.",
     "No aws_s3_bucket_server_side_encryption_configuration for the bucket. Since January 2023 S3 applies SSE-S3 by default, but the intent is not explicit nor auditable.",
     "Configure server-side encryption using SSE-S3 or SSE-KMS.",
     fix='resource "aws_s3_bucket_server_side_encryption_configuration" "this" {\n  bucket = aws_s3_bucket.data.id\n  rule {\n    apply_server_side_encryption_by_default {\n      sse_algorithm = "aws:kms"\n    }\n  }\n}',
     refs=("https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-bucket-encryption.html",))
_sec("S3_BUCKET_KMS_ENCRYPTION", "S3 bucket not encrypted with KMS", "LOW", "STORAGE",
     "The bucket is not configured to use SSE-KMS by default (S3 still applies SSE-S3 since 2023).",
     "No KMS default encryption configured.", "Use SSE-KMS when you need key-level access control and audit (CloudTrail).",
     refs=("https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html",))
_sec("S3_BUCKET_VERSIONING", "S3 bucket versioning disabled", "MEDIUM", "STORAGE",
     "Versioning is not enabled: deleted or overwritten objects cannot be recovered.", "No aws_s3_bucket_versioning resource.",
     "Enable versioning with aws_s3_bucket_versioning (status = \"Enabled\").",
     fix='resource "aws_s3_bucket_versioning" "this" {\n  bucket = aws_s3_bucket.data.id\n  versioning_configuration {\n    status = "Enabled"\n  }\n}')
_sec("S3_PUBLIC_ACCESS_BLOCK", "S3 bucket without Public Access Block", "HIGH", "STORAGE",
     "Public access is not explicitly blocked at bucket level; an ACL or policy change can expose data.",
     "No aws_s3_bucket_public_access_block, or one of its four settings disabled.",
     "Add aws_s3_bucket_public_access_block with the four settings set to true (unless the bucket must be public).",
     fix='resource "aws_s3_bucket_public_access_block" "this" {\n  bucket                  = aws_s3_bucket.data.id\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}')
_sec("S3_PUBLIC_ACL", "S3 bucket publicly readable or writable", "CRITICAL", "STORAGE",
     "The bucket ACL grants access to everyone.", "public-read/public-read-write ACL.",
     "Remove the public ACL; serve public content through CloudFront with Origin Access Control.")
_sec("S3_BUCKET_POLICY_PUBLIC", "S3 bucket policy allows any principal", "HIGH", "STORAGE",
     "The bucket policy grants access to Principal \"*\" without restrictive conditions.", "Overly broad policy.",
     "Restrict the principal or add conditions (aws:SourceVpce, aws:PrincipalOrgID...).")
_sec("S3_ACCESS_LOGGING", "S3 access logging disabled", "LOW", "STORAGE",
     "Server access logging is not configured.", "No aws_s3_bucket_logging.", "Enable access logging if you need an audit trail of requests.")
_sec("S3_OPTIONAL_HARDENING", "Optional S3 hardening", "LOW", "STORAGE",
     "Best practice not applied (cross-region replication, event notifications or lifecycle configuration).",
     "Feature not configured.", "Apply it when your data protection or cost policy requires it; otherwise ignore the rule in .tfpv.toml.")
_sec("SG_SSH_OPEN_TO_INTERNET", "SSH open to the Internet", "HIGH", "SECURITY",
     "A security group allows ingress on port 22 from 0.0.0.0/0.", "Rule opened for debugging or convenience.",
     "Restrict the source to known CIDRs, or use SSM Session Manager instead of SSH.",
     refs=("https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html",))
_sec("SG_RDP_OPEN_TO_INTERNET", "RDP open to the Internet", "HIGH", "SECURITY",
     "A security group allows ingress on port 3389 from 0.0.0.0/0.", "Rule opened for debugging or convenience.",
     "Restrict the source to known CIDRs or use Fleet Manager / a bastion.")
_sec("SG_ALL_PORTS_OPEN_TO_INTERNET", "All ports open to the Internet", "CRITICAL", "SECURITY",
     "A security group allows ingress on all ports from 0.0.0.0/0.", "Protocol -1 or full port range open to the world.",
     "Open only the required ports to the required sources.")
_sec("SG_SENSITIVE_PORT_OPEN", "Sensitive port open to the Internet", "HIGH", "SECURITY",
     "A security group exposes a sensitive port (database, admin interface) to 0.0.0.0/0.", "Overly broad ingress rule.",
     "Restrict the source to application security groups or private CIDRs.")
_sec("SG_HTTP_OPEN_TO_INTERNET", "HTTP port 80 open to the Internet", "MEDIUM", "SECURITY",
     "Port 80 is reachable from 0.0.0.0/0.", "Public web service without TLS redirection at the edge.",
     "Prefer HTTPS behind a load balancer/CloudFront; keep port 80 only for redirection.")
_sec("SG_HYGIENE", "Security group hygiene", "LOW", "SECURITY",
     "Best practice not applied (rule description, unattached group, unrestricted egress, default security group).",
     "Missing description or unused group.", "Add descriptions, remove unused groups, restrict egress where possible.")
_sec("VPC_FLOW_LOGS", "VPC flow logs disabled", "LOW", "NETWORK",
     "VPC flow logs are not enabled.", "No aws_flow_log for the VPC.", "Enable flow logs to CloudWatch or S3 for network forensics.")
_sec("SUBNET_PUBLIC_IP_ON_LAUNCH", "Subnet assigns public IPs automatically", "MEDIUM", "NETWORK",
     "map_public_ip_on_launch is true: every instance launched gets a public IP.", "Subnet intended for public load balancers reused for instances.",
     "Disable it and use public IPs only where needed (load balancers, NAT).")
_sec("IAM_FULL_ADMIN", "IAM policy grants full administrator privileges", "CRITICAL", "IAM",
     "The policy allows Action \"*\" on Resource \"*\" (or full IAM privileges).", "Policy written for convenience during development.",
     "Grant only the actions needed on the resources needed; start from AWS managed job-function policies or IAM Access Analyzer policy generation.",
     refs=("https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege",))
_sec("IAM_WILDCARD_ACTION", "IAM policy uses wildcard actions", "HIGH", "IAM",
     "A statement allows \"*\" (or service:*) actions.", "Broad action list.", "List explicit actions.")
_sec("IAM_WILDCARD_RESOURCE", "IAM policy uses wildcard resources", "MEDIUM", "IAM",
     "A statement allows actions on Resource \"*\" for actions that support resource-level permissions.", "Resources not scoped.",
     "Scope resources with ARNs (or ARN prefixes) wherever the action supports it.")
_sec("IAM_EXCESSIVE_PERMISSIONS", "IAM policy allows sensitive permissions without constraints", "HIGH", "IAM",
     "The policy allows privilege escalation, credentials exposure, data exfiltration or permissions management without constraints.",
     "Wildcards on sensitive services (iam, sts, kms, s3, secretsmanager).", "Remove sensitive actions or constrain them with resources and conditions.")
_sec("IAM_UNCONSTRAINED_WRITE", "IAM policy allows write access without constraints", "MEDIUM", "IAM",
     "Write actions are allowed on all resources.", "Resource \"*\" on write actions.", "Scope write actions to specific resources.")
_sec("IAM_HYGIENE", "IAM hygiene", "LOW", "IAM",
     "Best practice not applied (policy attached directly to a user, instance without IAM role).", "IAM design shortcut.",
     "Attach policies to groups/roles and give instances an instance profile.")
_sec("EC2_IMDSV1_ENABLED", "IMDSv1 enabled", "MEDIUM", "SECURITY",
     "The instance metadata service accepts IMDSv1 requests (SSRF risk).", "metadata_options.http_tokens not set to \"required\".",
     "Set metadata_options { http_tokens = \"required\" }.", fix='metadata_options {\n  http_tokens = "required"\n}')
_sec("EBS_UNENCRYPTED", "EBS volume not encrypted", "MEDIUM", "STORAGE",
     "The volume (or instance root/EBS block device) is not encrypted.", "encrypted not set and no account-level default encryption assumed.",
     "Set encrypted = true (and kms_key_id if required), or enable EBS encryption by default in the account.")
_sec("EC2_PUBLIC_IP", "EC2 instance with a public IP", "MEDIUM", "SECURITY",
     "The instance gets a public IP address.", "associate_public_ip_address = true or public subnet.",
     "Keep instances private behind a load balancer or use SSM for access.")
_sec("EC2_SECRETS_IN_USER_DATA", "Secrets in EC2 user data", "CRITICAL", "SECURITY",
     "User data contains what looks like credentials; user data is readable from the instance and the API.", "Hard-coded secret.",
     "Fetch secrets at boot from Secrets Manager or SSM Parameter Store.")
_sec("EC2_HARDENING", "Optional EC2 hardening", "LOW", "SECURITY",
     "Best practice not applied (detailed monitoring, EBS optimization).", "Option not set.",
     "Enable the options when your monitoring or performance policy requires them.")
_sec("AWS_HYGIENE", "Unused or unattached resource", "LOW", "NETWORK",
     "A resource is allocated but not attached (e.g. an Elastic IP without instance), which costs money.", "Leftover resource.",
     "Attach it or remove it.")
_sec("RDS_UNENCRYPTED", "RDS storage not encrypted", "HIGH", "DATABASE",
     "storage_encrypted is not enabled; encryption cannot be enabled later without recreating the instance.", "storage_encrypted omitted.",
     "Set storage_encrypted = true (and kms_key_id if required) before the first apply.")
_sec("RDS_PUBLICLY_ACCESSIBLE", "RDS instance publicly accessible", "HIGH", "DATABASE",
     "publicly_accessible = true gives the database a public endpoint.", "Set for debugging.", "Set publicly_accessible = false and connect through a bastion/SSM or VPN.")
_sec("RDS_HARDENING", "Optional RDS hardening", "LOW", "DATABASE",
     "Best practice not applied (deletion protection, Multi-AZ, monitoring, logs, IAM auth, minor upgrades, copy tags).", "Option not set.",
     "Enable the options required by your availability and audit policy.")
_sec("PROVIDER_HARDCODED_CREDENTIALS", "Hard-coded AWS credentials", "CRITICAL", "SECURITY",
     "The provider block contains access keys.", "Credentials pasted in the configuration.",
     "Remove the keys, rotate them, and use profiles, SSO or OIDC federation in CI.")
_sec("KMS_KEY_ROTATION", "KMS key rotation disabled", "MEDIUM", "SECURITY",
     "Automatic rotation is not enabled on the customer managed key.", "enable_key_rotation omitted.", "Set enable_key_rotation = true.")
_sec("CLOUDTRAIL_HARDENING", "CloudTrail not fully hardened", "MEDIUM", "SECURITY",
     "The trail is not multi-region, or log file validation / KMS encryption is not enabled.", "Options left at their defaults.",
     "Set is_multi_region_trail = true, enable_log_file_validation = true and kms_key_id.")
_sec("ALB_HTTP_LISTENER", "Load balancer listener in plain HTTP", "MEDIUM", "SECURITY",
     "The listener uses HTTP without redirecting to HTTPS: traffic is not encrypted.", "HTTPS listener and redirection missing.",
     "Use an HTTPS listener with a TLS 1.2+ policy and redirect HTTP to HTTPS.",
     fix='default_action {\n  type = "redirect"\n  redirect {\n    port        = "443"\n    protocol    = "HTTPS"\n    status_code = "HTTP_301"\n  }\n}')
_sec("MESSAGING_UNENCRYPTED", "Queue or topic not encrypted", "MEDIUM", "SECURITY",
     "The SQS queue or SNS topic has no server-side encryption configured.", "Encryption option not set.",
     "SQS: sqs_managed_sse_enabled = true or kms_master_key_id; SNS: kms_master_key_id.")
_sec("DYNAMODB_HARDENING", "DynamoDB backup/encryption options", "LOW", "DATABASE",
     "Point-in-time recovery is not enabled (or no customer managed key).", "Option not set.",
     "Add point_in_time_recovery { enabled = true }.")
_sec("ECR_HARDENING", "ECR repository hardening", "LOW", "SECURITY",
     "Image tags are mutable or scan on push is disabled.", "Defaults kept.",
     "Set image_tag_mutability = \"IMMUTABLE\" and image_scanning_configuration { scan_on_push = true }.")
_sec("EKS_PUBLIC_ENDPOINT", "EKS API endpoint public to the Internet", "HIGH", "SECURITY",
     "The Kubernetes API endpoint is public and not restricted to known CIDRs (the provider default is public, 0.0.0.0/0).",
     "vpc_config left at its defaults.", "Set endpoint_public_access = false (private endpoint) or restrict public_access_cidrs.")
_sec("EKS_SECRETS_ENCRYPTION", "EKS secrets not encrypted with KMS", "MEDIUM", "SECURITY",
     "Kubernetes secrets are not envelope-encrypted with a KMS key.", "No encryption_config block.",
     "Add encryption_config { resources = [\"secrets\"] provider { key_arn = ... } }.")
_sec("ELASTICACHE_UNENCRYPTED", "ElastiCache not encrypted", "MEDIUM", "DATABASE",
     "At-rest or in-transit encryption is disabled on the replication group.", "Options not set.",
     "Set at_rest_encryption_enabled = true and transit_encryption_enabled = true.")
_sec("SECRET_HARDCODED", "Secret written in the configuration", "HIGH", "SECURITY",
     "A password, token or key is written as a literal value; it ends up in Git history and in the state file.",
     "Value pasted directly instead of being read from a secret store.",
     "Use a sensitive variable, aws_secretsmanager_secret_version / SSM data sources, or manage_master_user_password for RDS; rotate the exposed secret.")
_sec("IAM_TRUST_ANY_PRINCIPAL", "Role can be assumed by anyone", "HIGH", "IAM",
     "The trust policy allows Principal \"*\" (any AWS account) without restrictive conditions.", "Overly broad trust policy.",
     "Restrict the principal to specific accounts, roles or services, or add conditions (aws:PrincipalOrgID, sts:ExternalId).")
_sec("IAM_NOTACTION_ALLOW", "Allow with NotAction", "HIGH", "IAM",
     "Allow combined with NotAction grants every action except the listed ones, including future ones.", "Shortcut to grant broad access.",
     "List the allowed actions explicitly with Action.")
_sec("SECURITY_GENERIC", "Security best practice (Checkov)", "MEDIUM", "SECURITY",
     "Checkov reports a security or compliance issue.", "See the Checkov check name.",
     "Follow the Checkov policy documentation for this check ID.", refs=(CHECKOV_INDEX,))

# --------------------------------------------------------------------------
# Engine → canonical mappings
# --------------------------------------------------------------------------
TFLINT_MAP = {
    "aws_instance_invalid_type": "AWS_INVALID_INSTANCE_TYPE",
    "aws_launch_template_invalid_instance_type": "AWS_INVALID_INSTANCE_TYPE",
    "aws_db_instance_invalid_type": "AWS_INVALID_DB_INSTANCE_CLASS",
    "aws_db_instance_invalid_engine": "AWS_INVALID_DB_ENGINE",
    "aws_db_instance_default_parameter_group": "AWS_DB_DEFAULT_PARAMETER_GROUP",
    "aws_route_not_specified_target": "AWS_ROUTE_WITHOUT_TARGET",
    "aws_route_specified_multiple_targets": "AWS_ROUTE_MULTIPLE_TARGETS",
    "aws_s3_bucket_name": "AWS_S3_BUCKET_NAME",
    "aws_iam_policy_too_long_policy": "AWS_IAM_POLICY_TOO_LONG",
    "aws_iam_role_policy_too_long_policy": "AWS_IAM_POLICY_TOO_LONG",
    "aws_resource_missing_tags": "AWS_TAGS",
    "aws_provider_missing_default_tags": "AWS_TAGS",
    "terraform_required_version": "TF_MISSING_REQUIRED_VERSION",
    "terraform_required_providers": "TF_MISSING_PROVIDER_CONSTRAINT",
    "terraform_typed_variables": "TF_UNTYPED_VARIABLE",
    "terraform_unused_declarations": "TF_UNUSED_DECLARATION",
    "terraform_unused_required_providers": "TF_UNUSED_DECLARATION",
    "terraform_deprecated_interpolation": "TF_DEPRECATED_SYNTAX",
    "terraform_deprecated_index": "TF_DEPRECATED_SYNTAX",
    "terraform_deprecated_lookup": "TF_DEPRECATED_SYNTAX",
    "terraform_module_pinned_source": "TF_UNPINNED_MODULE",
    "terraform_module_version": "TF_UNPINNED_MODULE",
}
_TFLINT_DEEP = re.compile(r"^aws_\w+_invalid_(ami|iam_profile|key_name|subnet|vpc_security_group|security_group|db_subnet_group|option_group|parameter_group|image_id|route_table|gateway|nat_gateway|instance|network_interface|vpc_peering_connection|egress_only_gateway|security_groups|subnets)$")


def map_tflint(rule: str, severity: str | None, deep_check: bool) -> str:
    if rule in TFLINT_MAP:
        return TFLINT_MAP[rule]
    if deep_check and _TFLINT_DEEP.match(rule):
        return "AWS_INVALID_REFERENCE_DEEP"
    if rule.startswith("aws_") and rule.endswith("_previous_type"):
        return "AWS_PREVIOUS_GENERATION_TYPE"
    if rule.startswith("aws_") and "_deprecated_" in rule:
        return "AWS_DEPRECATED"
    if rule.startswith("aws_") and "_invalid_" in rule:
        return "AWS_INVALID_ATTRIBUTE_VALUE"
    if rule.startswith("terraform_"):
        return "TF_LINT"
    return "TF_LINT" if (severity or "").lower() != "error" else "AWS_INVALID_ATTRIBUTE_VALUE"


def tflint_link(rule: str, link: str | None, aws_version: str) -> str | None:
    if link:
        return link
    if rule.startswith("aws_"):
        named = {"aws_instance_invalid_type", "aws_instance_previous_type", "aws_db_instance_invalid_type", "aws_db_instance_invalid_engine",
                 "aws_db_instance_previous_type", "aws_db_instance_default_parameter_group", "aws_route_not_specified_target",
                 "aws_route_specified_multiple_targets", "aws_s3_bucket_name", "aws_lambda_function_deprecated_runtime"}
        base = f"https://github.com/terraform-linters/tflint-ruleset-aws/blob/v{aws_version}/docs/rules"
        return f"{base}/{rule}.md" if rule in named else f"{base}/README.md"
    return None


CHECKOV_MAP = {
    "CKV_AWS_19": "S3_BUCKET_ENCRYPTION", "CKV_AWS_145": "S3_BUCKET_KMS_ENCRYPTION", "CKV_AWS_21": "S3_BUCKET_VERSIONING",
    "CKV2_AWS_6": "S3_PUBLIC_ACCESS_BLOCK", "CKV_AWS_53": "S3_PUBLIC_ACCESS_BLOCK", "CKV_AWS_54": "S3_PUBLIC_ACCESS_BLOCK",
    "CKV_AWS_55": "S3_PUBLIC_ACCESS_BLOCK", "CKV_AWS_56": "S3_PUBLIC_ACCESS_BLOCK", "CKV_AWS_20": "S3_PUBLIC_ACL", "CKV_AWS_57": "S3_PUBLIC_ACL",
    "CKV_AWS_70": "S3_BUCKET_POLICY_PUBLIC", "CKV_AWS_18": "S3_ACCESS_LOGGING", "CKV_AWS_144": "S3_OPTIONAL_HARDENING",
    "CKV2_AWS_62": "S3_OPTIONAL_HARDENING", "CKV2_AWS_61": "S3_OPTIONAL_HARDENING",
    "CKV_AWS_24": "SG_SSH_OPEN_TO_INTERNET", "CKV_AWS_25": "SG_RDP_OPEN_TO_INTERNET", "CKV_AWS_277": "SG_ALL_PORTS_OPEN_TO_INTERNET",
    "CKV_AWS_260": "SG_HTTP_OPEN_TO_INTERNET", "CKV_AWS_23": "SG_HYGIENE", "CKV2_AWS_5": "SG_HYGIENE", "CKV_AWS_382": "SG_HYGIENE",
    "CKV2_AWS_12": "SG_HYGIENE", "CKV2_AWS_11": "VPC_FLOW_LOGS", "CKV_AWS_130": "SUBNET_PUBLIC_IP_ON_LAUNCH", "CKV2_AWS_19": "AWS_HYGIENE",
    "CKV_AWS_1": "IAM_FULL_ADMIN", "CKV_AWS_62": "IAM_FULL_ADMIN", "CKV2_AWS_40": "IAM_FULL_ADMIN", "CKV_AWS_274": "IAM_FULL_ADMIN",
    "CKV_AWS_63": "IAM_WILDCARD_ACTION", "CKV_AWS_49": "IAM_WILDCARD_ACTION", "CKV_AWS_355": "IAM_WILDCARD_RESOURCE",
    "CKV_AWS_286": "IAM_EXCESSIVE_PERMISSIONS", "CKV_AWS_287": "IAM_EXCESSIVE_PERMISSIONS", "CKV_AWS_288": "IAM_EXCESSIVE_PERMISSIONS",
    "CKV_AWS_289": "IAM_EXCESSIVE_PERMISSIONS", "CKV_AWS_290": "IAM_UNCONSTRAINED_WRITE", "CKV_AWS_40": "IAM_HYGIENE", "CKV2_AWS_41": "IAM_HYGIENE",
    "CKV_AWS_79": "EC2_IMDSV1_ENABLED", "CKV_AWS_8": "EBS_UNENCRYPTED", "CKV_AWS_3": "EBS_UNENCRYPTED", "CKV_AWS_189": "EBS_UNENCRYPTED",
    "CKV_AWS_88": "EC2_PUBLIC_IP", "CKV_AWS_46": "EC2_SECRETS_IN_USER_DATA", "CKV_AWS_126": "EC2_HARDENING", "CKV_AWS_135": "EC2_HARDENING",
    "CKV_AWS_16": "RDS_UNENCRYPTED", "CKV_AWS_17": "RDS_PUBLICLY_ACCESSIBLE", "CKV_AWS_293": "RDS_HARDENING", "CKV_AWS_157": "RDS_HARDENING",
    "CKV_AWS_118": "RDS_HARDENING", "CKV_AWS_353": "RDS_HARDENING", "CKV_AWS_226": "RDS_HARDENING", "CKV_AWS_129": "RDS_HARDENING",
    "CKV_AWS_161": "RDS_HARDENING", "CKV2_AWS_60": "RDS_HARDENING", "CKV2_AWS_30": "RDS_HARDENING",
    "CKV_AWS_41": "PROVIDER_HARDCODED_CREDENTIALS", "CKV_AWS_7": "KMS_KEY_ROTATION",
    "CKV_AWS_67": "CLOUDTRAIL_HARDENING", "CKV_AWS_36": "CLOUDTRAIL_HARDENING", "CKV_AWS_35": "CLOUDTRAIL_HARDENING",
    "CKV_AWS_2": "ALB_HTTP_LISTENER", "CKV_AWS_27": "MESSAGING_UNENCRYPTED", "CKV_AWS_26": "MESSAGING_UNENCRYPTED",
    "CKV_AWS_28": "DYNAMODB_HARDENING", "CKV_AWS_119": "DYNAMODB_HARDENING", "CKV_AWS_51": "ECR_HARDENING", "CKV_AWS_163": "ECR_HARDENING",
    "CKV_AWS_39": "EKS_PUBLIC_ENDPOINT", "CKV_AWS_38": "EKS_PUBLIC_ENDPOINT", "CKV_AWS_58": "EKS_SECRETS_ENCRYPTION",
    "CKV_AWS_29": "ELASTICACHE_UNENCRYPTED", "CKV_AWS_30": "ELASTICACHE_UNENCRYPTED", "CKV_AWS_31": "ELASTICACHE_UNENCRYPTED",
    "CKV_AWS_60": "IAM_TRUST_ANY_PRINCIPAL", "CKV_AWS_61": "IAM_TRUST_ANY_PRINCIPAL", "CKV_AWS_133": "RDS_HARDENING",
}


def map_checkov(check_id: str, check_name: str) -> tuple[str, str | None]:
    """Return (canonical rule id, severity override or None)."""
    if check_id in CHECKOV_MAP:
        return CHECKOV_MAP[check_id], None
    name = check_name.lower()
    if any(k in name for k in ("0.0.0.0", "public", "anonymous", "privilege", "admin", "wildcard", "hardcoded", "secret")):
        return "SECURITY_GENERIC", "HIGH"
    if "encrypt" in name or "kms" in name:
        return "SECURITY_GENERIC", "MEDIUM"
    if any(k in name for k in ("logging", "logs", "monitoring", "tag", "description", "backup", "replication", "notification",
                               "lifecycle", "insights", "deletion protection", "multi-az", "minor", "x-ray", "tracing", "retention")):
        return "SECURITY_GENERIC", "LOW"
    return "SECURITY_GENERIC", None


_TF_DIAG = [
    (r"^Reference to undeclared", "TF_UNDECLARED_REFERENCE"),
    (r"^Unsupported argument", "TF_UNSUPPORTED_ARGUMENT"),
    (r"^Missing required argument", "TF_MISSING_REQUIRED_ARGUMENT"),
    (r"^Unsupported block type", "TF_UNSUPPORTED_BLOCK"),
    (r"^Unsupported attribute", "TF_UNSUPPORTED_ATTRIBUTE"),
    (r"^Invalid (resource|data source) type", "TF_INVALID_RESOURCE_TYPE"),
    (r"^(Invalid value for|Incorrect attribute value type|Invalid function argument|Invalid reference|expected .* to be|invalid value|Invalid Value|Invalid Attribute Value)", "TF_INVALID_ARGUMENT_VALUE"),
    (r"^(Argument or block definition required|Invalid expression|Unclosed configuration block|Invalid block definition|Missing newline after argument|Invalid character|Unterminated template string|Invalid multi-line string|Missing item separator|Extra characters after|Invalid argument name|Unsupported operator|Missing key/value separator|Missing name for|Invalid single-argument block definition)", "TF_SYNTAX_ERROR"),
    (r"^Duplicate ", "TF_DUPLICATE_DECLARATION"),
    (r"^(Failed to query available provider packages|Failed to resolve provider packages|Incompatible provider version|Inconsistent dependency lock file|Failed to install provider|Invalid provider registry host|Provider registry is not reachable|Required plugins are not installed)", "TF_PROVIDER_RESOLUTION"),
    (r"^(Failed to download module|Module not found|Unreadable module directory|Failed to install module|Module source has changed|Module not installed|Invalid module source address|Module version requirements have changed|Error accessing remote module registry)", "TF_MODULE_INSTALL"),
    (r"^Unsupported Terraform Core version", "TF_CORE_VERSION"),
    (r"^Value for undeclared variable", "TF_UNDECLARED_VARIABLE_VALUE"),
    (r"(?i)deprecat", "TF_DEPRECATED"),
]


def map_terraform(summary: str, severity: str, step: str) -> str:
    for pat, rule in _TF_DIAG:
        if re.search(pat, summary):
            return rule
    if severity == "warning":
        return "TF_VALIDATE_WARNING"
    return "TF_INIT_ERROR" if step == "terraform_init" else "TF_VALIDATE_ERROR"


def rule(rule_id: str) -> Rule:
    return RULES[rule_id]


def catalog() -> list[Rule]:
    return sorted(RULES.values(), key=lambda r: (r.category, r.id))
