resource "aws_instance" "example" {
  ami           = "ami-12345678"
  instance_type = "t3.invalid"
  subnet_id     = aws_subnet.public_a.id

  root_block_device {
    volume_type = "gp2"
    iops        = 3000
  }
}

resource "aws_instance" "bad_ami" {
  ami           = "ami-xyz"
  instance_type = "t3.micro"
}
