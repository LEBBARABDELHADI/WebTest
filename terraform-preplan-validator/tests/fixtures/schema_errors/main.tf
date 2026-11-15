terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "eu-west-3"
}

resource "aws_instancee" "a" {
  ami = "ami-0123456789abcdef0"
}

resource "aws_instance" "b" {
  ami           = "ami-0123456789abcdef0"
  instance_typ  = "t3.micro"
  arn           = "arn:aws:ec2:eu-west-3:123456789012:instance/i-1"
  ebs_optimized = "yes"

  root_block_device {
    volume_size = 10
  }

  root_block_device {
    volume_size = 20
  }

  foo {
    bar = 1
  }
}

resource "aws_subnet" "c" {
  cidr_block = "10.0.1.0/24"
}

resource "aws_s3_bucket" "d" {
  bucket = "schema-errors-demo"
  tags {
    Name = "demo"
  }
}

output "subnet" {
  value = aws_subnet.c.cidr_bloc
}
