output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "role_name" {
  description = "IAM role of the application"
  value       = aws_iam_role.app.name
}

output "private_subnet_count" {
  description = "Number of private subnets"
  value       = var.private_subnet_count
}
