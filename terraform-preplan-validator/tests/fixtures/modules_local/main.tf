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
  region = "eu-west-3"
}

module "network" {
  source        = "./modules/net"
  vpc_cidr      = "10.30.0.0/16"
  subnet_a_cidr = "10.30.1.0/24"
  subnet_b_cidr = "10.31.0.0/24"
}

module "app" {
  source = "./modules/app"
  vpc_id = module.network.vpc_id
}

output "app_role" {
  description = "Role name"
  value       = module.app.role_name
}
