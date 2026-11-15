var e=[{path:`exemple-aws/iam.tf`,content:`resource "aws_iam_policy" "admin" {
  name = "too-broad"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "*"
      Resource = "*"
    }]
  })
}

resource "aws_iam_role" "app" {
  name = "app"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ec2.amazon.com" }
    }]
  })
}
`},{path:`exemple-aws/main.tf`,content:`resource "aws_instance" "example" {
  ami           = "ami-12345678"
  instance_type = "t3.invalid"
  subnet_id     = aws_subnet.public_a.id

  root_block_device {
    volume_type = "gp2"
    iops        = 3000
  }
}

resource "aws_instance" "bad_ami" {
  ami           = "ami-xyz"
  instance_type = "t3.micro"
}
`},{path:`exemple-aws/network.tf`,content:`resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
}

resource "aws_subnet" "public_a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet(var.vpc_cidr, 8, 1)
}

resource "aws_subnet" "public_b" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.128/25"
}

resource "aws_subnet" "outside" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.1.0.0/24"
}

resource "aws_security_group" "web" {
  name   = "web"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 22
    to_port     = 22
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_route_table" "rt" {
  vpc_id = aws_vpc.mian.id
}
`},{path:`exemple-aws/storage.tf`,content:`resource "aws_s3_bucket" "data" {
  bucket = "my-company-data-\${var.environment}"
}

resource "aws_ebs_volume" "logs" {
  availability_zone = "eu-west-3a"
  size              = 50
  type              = "st1"
  iops              = 500
}

resource "aws_db_instance" "db" {
  identifier            = "app-db"
  engine                = "postgres"
  engine_version        = "16.4"
  instance_class        = "db.t3.micro"
  allocated_storage     = 100
  max_allocated_storage = 50
  storage_type          = "gp2"
  iops                  = 1000
  multi_az              = true
  availability_zone     = "eu-west-3a"
  username              = "app"
  password              = var.db_password
  skip_final_snapshot   = true
}
`},{path:`exemple-aws/terraform.tfvars`,content:`instance_count = "three"
db_password    = "Sup3rS3cretPassw0rd!"
unknown_var    = "x"
`},{path:`exemple-aws/unformatted.tf`,content:`resource "aws_eip" "ip" {
    domain="vpc"
}
`},{path:`exemple-aws/variables.tf`,content:`variable "region" {
  type    = string
  default = "eu-west-3"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "instance_count" {
  type = number
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "environment" {
  type = string
}
`},{path:`exemple-aws/versions.tf`,content:`terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region
}
`}];export{e as default};