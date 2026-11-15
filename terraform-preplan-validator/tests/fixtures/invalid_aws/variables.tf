variable "region" {
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
