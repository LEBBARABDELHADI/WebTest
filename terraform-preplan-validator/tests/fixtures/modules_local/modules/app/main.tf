terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "name" {
  description = "Application name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

resource "aws_iam_role" "this" {
  name = var.name
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { AWS = "12345678901" }
    }]
  })
}

output "role_name" {
  description = "Role name"
  value       = aws_iam_role.this.name
}
