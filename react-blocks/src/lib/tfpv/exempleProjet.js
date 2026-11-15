// Projet d'exemple (configuration volontairement fautive) pour essayer l'outil.
// Copie de terraform-preplan-validator/tests/fixtures/invalid_aws.
export default [
 {
  "path": "exemple-aws/iam.tf",
  "content": "resource \"aws_iam_policy\" \"admin\" {\n  name = \"too-broad\"\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect   = \"Allow\"\n      Action   = \"*\"\n      Resource = \"*\"\n    }]\n  })\n}\n\nresource \"aws_iam_role\" \"app\" {\n  name = \"app\"\n  assume_role_policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect    = \"Allow\"\n      Action    = \"sts:AssumeRole\"\n      Principal = { Service = \"ec2.amazon.com\" }\n    }]\n  })\n}\n"
 },
 {
  "path": "exemple-aws/main.tf",
  "content": "resource \"aws_instance\" \"example\" {\n  ami           = \"ami-12345678\"\n  instance_type = \"t3.invalid\"\n  subnet_id     = aws_subnet.public_a.id\n\n  root_block_device {\n    volume_type = \"gp2\"\n    iops        = 3000\n  }\n}\n\nresource \"aws_instance\" \"bad_ami\" {\n  ami           = \"ami-xyz\"\n  instance_type = \"t3.micro\"\n}\n"
 },
 {
  "path": "exemple-aws/network.tf",
  "content": "resource \"aws_vpc\" \"main\" {\n  cidr_block = var.vpc_cidr\n}\n\nresource \"aws_subnet\" \"public_a\" {\n  vpc_id     = aws_vpc.main.id\n  cidr_block = cidrsubnet(var.vpc_cidr, 8, 1)\n}\n\nresource \"aws_subnet\" \"public_b\" {\n  vpc_id     = aws_vpc.main.id\n  cidr_block = \"10.0.1.128/25\"\n}\n\nresource \"aws_subnet\" \"outside\" {\n  vpc_id     = aws_vpc.main.id\n  cidr_block = \"10.1.0.0/24\"\n}\n\nresource \"aws_security_group\" \"web\" {\n  name   = \"web\"\n  vpc_id = aws_vpc.main.id\n\n  ingress {\n    from_port   = 22\n    to_port     = 22\n    protocol    = \"tcp\"\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n\n  ingress {\n    from_port   = 443\n    to_port     = 80\n    protocol    = \"tcp\"\n    cidr_blocks = [\"10.0.0.0/8\"]\n  }\n\n  egress {\n    from_port   = 22\n    to_port     = 22\n    protocol    = \"-1\"\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n}\n\nresource \"aws_route_table\" \"rt\" {\n  vpc_id = aws_vpc.mian.id\n}\n"
 },
 {
  "path": "exemple-aws/storage.tf",
  "content": "resource \"aws_s3_bucket\" \"data\" {\n  bucket = \"my-company-data-${var.environment}\"\n}\n\nresource \"aws_ebs_volume\" \"logs\" {\n  availability_zone = \"eu-west-3a\"\n  size              = 50\n  type              = \"st1\"\n  iops              = 500\n}\n\nresource \"aws_db_instance\" \"db\" {\n  identifier            = \"app-db\"\n  engine                = \"postgres\"\n  engine_version        = \"16.4\"\n  instance_class        = \"db.t3.micro\"\n  allocated_storage     = 100\n  max_allocated_storage = 50\n  storage_type          = \"gp2\"\n  iops                  = 1000\n  multi_az              = true\n  availability_zone     = \"eu-west-3a\"\n  username              = \"app\"\n  password              = var.db_password\n  skip_final_snapshot   = true\n}\n"
 },
 {
  "path": "exemple-aws/terraform.tfvars",
  "content": "instance_count = \"three\"\ndb_password    = \"Sup3rS3cretPassw0rd!\"\nunknown_var    = \"x\"\n"
 },
 {
  "path": "exemple-aws/unformatted.tf",
  "content": "resource \"aws_eip\" \"ip\" {\n    domain=\"vpc\"\n}\n"
 },
 {
  "path": "exemple-aws/variables.tf",
  "content": "variable \"region\" {\n  type    = string\n  default = \"eu-west-3\"\n}\n\nvariable \"vpc_cidr\" {\n  type    = string\n  default = \"10.0.0.0/16\"\n}\n\nvariable \"instance_count\" {\n  type = number\n}\n\nvariable \"db_password\" {\n  type      = string\n  sensitive = true\n}\n\nvariable \"environment\" {\n  type = string\n}\n"
 },
 {
  "path": "exemple-aws/versions.tf",
  "content": "terraform {\n  required_version = \">= 1.6\"\n  required_providers {\n    aws = {\n      source  = \"hashicorp/aws\"\n      version = \"~> 6.0\"\n    }\n  }\n}\n\nprovider \"aws\" {\n  region = var.region\n}\n"
 }
]
