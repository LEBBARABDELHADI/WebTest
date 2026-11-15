resource "aws_vpc" "main" {
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
