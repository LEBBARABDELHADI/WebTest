from tfpv.engines.aws import static
from tfpv.scanner import instances, load_project, root_var_values


def rules(root):
    p = load_project(root)
    values, _ = root_var_values(p, {}, {})
    tally = static.run(p, instances(p, values))
    return tally, sorted((f.rule_id, f.resource, f.line) for f in tally.findings)


def test_network_rules(make_project):
    root = make_project({"n.tf": '''
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}
resource "aws_vpc" "main" { cidr_block = var.vpc_cidr }
resource "aws_vpc" "huge" { cidr_block = "10.0.0.0/8" }
resource "aws_subnet" "a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet(var.vpc_cidr, 8, 1)
}
resource "aws_subnet" "overlap" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.128/25"
}
resource "aws_subnet" "outside" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.1.0.0/24"
}
resource "aws_subnet" "hostbits" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.9.5/24"
}
'''})
    tally, found = rules(root)
    ids = [f[0] for f in found]
    assert ("NET_SUBNET_OVERLAP", "aws_subnet.overlap", 14) in found
    assert ("NET_SUBNET_OUTSIDE_VPC", "aws_subnet.outside", 18) in found
    assert ("NET_VPC_CIDR_SIZE", "aws_vpc.huge", 7) in found
    assert ("NET_INVALID_CIDR", "aws_subnet.hostbits", 22) in found
    assert "10.0.9.0/24" in next(f.message for f in tally.findings if f.rule_id == "NET_INVALID_CIDR")
    assert ids.count("NET_SUBNET_OUTSIDE_VPC") == 1


def test_unknown_values_are_not_failures(make_project):
    root = make_project({"n.tf": '''
variable "vpc_cidr" { type = string }
resource "aws_vpc" "main" { cidr_block = var.vpc_cidr }
resource "aws_subnet" "a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.9.0.0/24"
}
resource "aws_subnet" "b" {
  count      = 2
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)
}
resource "aws_subnet" "c" {
  vpc_id     = data.aws_vpc.shared.id
  cidr_block = "192.168.0.0/24"
}
'''})
    tally, found = rules(root)
    assert found == []
    assert tally.not_evaluated >= 2


def test_security_group_rules(make_project):
    root = make_project({"sg.tf": '''
resource "aws_security_group" "web" {
  ingress {
    from_port   = 443
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }
  ingress {
    from_port   = 8
    to_port     = 0
    protocol    = "icmp"
    cidr_blocks = ["10.0.0.0/8"]
  }
  egress {
    from_port   = 22
    to_port     = 22
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0", "10.0.0.300/8"]
  }
}
'''})
    _, found = rules(root)
    assert sorted(f[0] for f in found) == ["NET_INVALID_CIDR", "SG_ALL_PROTOCOL_WITH_PORTS", "SG_PORT_RANGE_INVALID"]
    assert [f[2] for f in found if f[0] == "SG_PORT_RANGE_INVALID"] == [4]  # the from_port line, not the ICMP rule


def test_ebs_rules(make_project):
    root = make_project({"ebs.tf": '''
resource "aws_ebs_volume" "st1" {
  availability_zone = "eu-west-3a"
  type = "st1"
  size = 50
  iops = 500
}
resource "aws_ebs_volume" "io1" {
  availability_zone = "eu-west-3a"
  type = "io1"
  size = 10
}
resource "aws_ebs_volume" "gp2" {
  availability_zone = "eu-west-3a"
  type       = "gp2"
  size       = 10
  throughput = 200
}
resource "aws_ebs_volume" "ok" {
  availability_zone = "eu-west-3a"
  type       = "gp3"
  size       = 10
  iops       = 3000
  throughput = 125
}
resource "aws_instance" "i" {
  ami           = "ami-0123456789abcdef0"
  instance_type = "t3.micro"
  root_block_device {
    volume_type = "gp2"
    iops        = 3000
  }
}
'''})
    tally, found = rules(root)
    assert [(f[0], f[1]) for f in found] == [
        ("EBS_IOPS_NOT_SUPPORTED", "aws_ebs_volume.st1"), ("EBS_IOPS_NOT_SUPPORTED", "aws_instance.i"),
        ("EBS_IOPS_REQUIRED", "aws_ebs_volume.io1"), ("EBS_SIZE_BELOW_MINIMUM", "aws_ebs_volume.st1"),
        ("EBS_THROUGHPUT_NOT_SUPPORTED", "aws_ebs_volume.gp2")]
    inst = next(f for f in tally.findings if f.resource == "aws_instance.i")
    assert inst.extra["severity"] == "MEDIUM" and inst.extra["fails_at"] == "apply"


def test_rds_rules(make_project):
    root = make_project({"db.tf": '''
resource "aws_db_instance" "bad" {
  engine                = "postgres"
  instance_class        = "db.t3.micro"
  allocated_storage     = 100
  max_allocated_storage = 50
  storage_type          = "gp2"
  iops                  = 1000
  multi_az              = true
  availability_zone     = "eu-west-3a"
}
resource "aws_db_instance" "aurora" {
  engine         = "aurora-mysql"
  instance_class = "db.r6g.large"
}
resource "aws_db_instance" "small" {
  engine            = "mysql"
  instance_class    = "db.t3.micro"
  allocated_storage = 10
}
resource "aws_db_instance" "replica" {
  replicate_source_db = "x"
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  allocated_storage   = 10
}
'''})
    _, found = rules(root)
    assert [(f[0], f[1]) for f in found] == [
        ("RDS_AURORA_ENGINE_ON_INSTANCE", "aws_db_instance.aurora"), ("RDS_IOPS_STORAGE_TYPE_CONFLICT", "aws_db_instance.bad"),
        ("RDS_MAX_STORAGE_BELOW_ALLOCATED", "aws_db_instance.bad"), ("RDS_MULTI_AZ_WITH_AZ", "aws_db_instance.bad"),
        ("RDS_STORAGE_BELOW_MINIMUM", "aws_db_instance.small")]


def test_iam_and_ami_rules(make_project):
    root = make_project({"iam.tf": '''
resource "aws_iam_role" "svc" {
  assume_role_policy = jsonencode({
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ec2.amazon.com" } }]
  })
}
resource "aws_iam_role" "acct" {
  assume_role_policy = jsonencode({
    Statement = [{ Effect = "Allow", Principal = { AWS = ["123456789012", "12345678901", "arn:aws:iam::123456789012:role/x"] } }]
  })
}
resource "aws_iam_policy" "broken" {
  policy = <<EOT
{"Version": "2012-10-17", "Statement": [}
EOT
}
data "aws_iam_policy_document" "d" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com", "lamda.amazon.com"]
    }
  }
}
resource "aws_instance" "a" { ami = "ami-xyz" }
resource "aws_instance" "b" { ami = "ami-12345678" }
resource "aws_launch_template" "c" { image_id = "resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64" }
'''})
    tally, found = rules(root)
    assert [f[0] for f in found].count("IAM_INVALID_PRINCIPAL") == 3
    assert ("EC2_AMI_ID_MALFORMED", "aws_instance.a", 25) in found
    assert any(f[0] == "IAM_POLICY_INVALID_JSON" for f in found)
    svc = next(f for f in tally.findings if f.value == "ec2.amazon.com")
    assert "ec2.amazonaws.com" in svc.message
    assert [c["ami"] for c in tally.external["ami"]] == ["ami-12345678"]
