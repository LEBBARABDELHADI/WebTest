terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region     = "eu-west-3"
  access_key = "__FAKE_ACCESS_KEY__"
  secret_key = "__FAKE_SECRET_KEY__"
}

variable "db_password" {
  description = "Database password"
  type        = number
  sensitive   = true
}

resource "aws_db_instance" "db" {
  identifier          = "secrets-db"
  engine              = "postgres"
  instance_class      = "db.t3.micro"
  allocated_storage   = 10
  username            = "app"
  password            = var.db_password
  skip_final_snapshot = true
}
