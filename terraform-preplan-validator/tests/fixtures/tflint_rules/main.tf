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

resource "aws_ebs_volume" "v" {
  availability_zone = "eu-west-3a"
  size              = 10
  type              = "gp9"
}

resource "aws_db_instance" "db" {
  identifier        = "demo"
  engine            = "postgresql"
  instance_class    = "db.t3.huge"
  allocated_storage = 20
  username          = "app"
  password          = var.db_password
}

resource "aws_instance" "old" {
  ami           = "ami-0123456789abcdef0"
  instance_type = "m3.medium"
}

resource "aws_lambda_function" "f" {
  function_name = "demo"
  role          = "arn:aws:iam::123456789012:role/demo"
  handler       = "index.handler"
  runtime       = "nodejs12.x"
  filename      = "demo.zip"
}

resource "aws_s3_bucket" "b" {
  bucket = "My_Bucket"
}

resource "aws_route" "r" {
  route_table_id         = "rtb-12345678"
  destination_cidr_block = "0.0.0.0/0"
}

resource "aws_cloudwatch_log_group" "g" {
  name              = "demo"
  retention_in_days = 42
}

resource "aws_iam_role" "r" {
  name               = "this-role-name-is-way-too-long-for-iam-because-it-exceeds-the-sixty-four-character-limit"
  assume_role_policy = "{}"
}

variable "db_password" {
  type      = string
  sensitive = true
}
