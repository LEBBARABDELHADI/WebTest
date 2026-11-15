data "aws_iam_policy_document" "assume_ec2" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "app-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.assume_ec2.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "read_config" {
  name = "read-config"
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter"]
      Resource = "arn:aws:ssm:${var.region}:123456789012:parameter/app/${var.environment}/*"
    }]
  })
}
