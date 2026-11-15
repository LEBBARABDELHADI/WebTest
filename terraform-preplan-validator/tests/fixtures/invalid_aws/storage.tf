resource "aws_s3_bucket" "data" {
  bucket = "my-company-data-${var.environment}"
}

resource "aws_ebs_volume" "logs" {
  availability_zone = "eu-west-3a"
  size              = 50
  type              = "st1"
  iops              = 500
}

resource "aws_db_instance" "db" {
  identifier            = "app-db"
  engine                = "postgres"
  engine_version        = "16.4"
  instance_class        = "db.t3.micro"
  allocated_storage     = 100
  max_allocated_storage = 50
  storage_type          = "gp2"
  iops                  = 1000
  multi_az              = true
  availability_zone     = "eu-west-3a"
  username              = "app"
  password              = var.db_password
  skip_final_snapshot   = true
}
