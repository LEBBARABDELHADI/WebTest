variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-3"
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "private_subnet_count" {
  description = "Number of private subnets"
  type        = number
  default     = 2
}
