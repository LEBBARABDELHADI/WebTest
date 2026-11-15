locals {
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_vpc" "main" {
  #checkov:skip=CKV2_AWS_11:Flow logs are enabled centrally by the platform account
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  tags                 = local.tags
}

resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone = "${var.region}a"
  tags              = local.tags
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 2)
  availability_zone = "${var.region}b"
  tags              = local.tags
}

resource "aws_security_group" "app" {
  name        = "app-${var.environment}"
  description = "Application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from the VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    description = "HTTPS to the VPC endpoints"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = local.tags
}

resource "aws_network_interface" "app" {
  subnet_id       = aws_subnet.private_a.id
  security_groups = [aws_security_group.app.id]
  tags            = local.tags
}
