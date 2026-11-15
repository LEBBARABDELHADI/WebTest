terraform {
  required_version = ">= 1.6"
}

resource "aws_instance" "web" {
  ami           = "ami-0123456789abcdef0"
  instance_type =
}
