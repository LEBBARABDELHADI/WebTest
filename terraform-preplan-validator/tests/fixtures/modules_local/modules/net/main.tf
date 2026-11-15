terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
}

variable "subnet_a_cidr" {
  description = "First subnet"
  type        = string
}

variable "subnet_b_cidr" {
  description = "Second subnet"
  type        = string
}

resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr
}

resource "aws_subnet" "a" {
  vpc_id     = aws_vpc.this.id
  cidr_block = var.subnet_a_cidr
}

resource "aws_subnet" "b" {
  vpc_id     = aws_vpc.this.id
  cidr_block = var.subnet_b_cidr
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.this.id
}
