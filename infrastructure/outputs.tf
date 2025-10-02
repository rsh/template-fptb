output "db_host" {
  description = "Database host address"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "flask_secret_key_arn" {
  description = "ARN of the Secrets Manager secret containing Flask secret key"
  value       = aws_secretsmanager_secret.flask_secret_key.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "backend_security_group_id" {
  description = "Security group ID for backend"
  value       = aws_security_group.backend.id
}

output "cloudwatch_log_group_backend" {
  description = "CloudWatch log group name for backend"
  value       = aws_cloudwatch_log_group.backend.name
}

output "s3_logs_bucket" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.logs.bucket
}

output "sns_alerts_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}
