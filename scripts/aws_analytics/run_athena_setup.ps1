param(
  [string]$Region = "us-east-1",
  [string]$AccountId = "7710-4911-2957",
  [string]$AthenaDb = "engentlabs_analytics",
  [string]$AthenaTable = "cloudfront_logs_json",
  [string]$AthenaResults = "s3://engentlabs-frontend/athena-results/",
  [string]$CfLogS3 = "s3://engentlabs-frontend/AWSLogs/7710-4911-2957/CloudFront/cloudfront-logs/",
  [string]$WorkGroup = "primary"
)

# Ensure results bucket/prefix exists
aws s3api head-bucket --bucket engentlabs-frontend 2>$null
aws s3api put-object --bucket engentlabs-frontend --key "athena-results/" | Out-Null

# Replace vars in SQL on the fly
$sql = Get-Content "./scripts/aws_analytics/athena_create_db_and_table.sql" -Raw
$sql = $sql.Replace('${ATHENA_DB}',$AthenaDb).Replace('${ATHENA_TABLE}',$AthenaTable).Replace('${CF_LOG_S3}',$CfLogS3)

# Write a temp file and execute
$tmp = New-TemporaryFile
Set-Content -Path $tmp -Value $sql

aws athena start-query-execution `
  --query-string file://$tmp `
  --work-group $WorkGroup `
  --query-execution-context Database=$AthenaDb `
  --result-configuration OutputLocation=$AthenaResults | Out-Null

Write-Host "Submitted Athena setup. Check the Athena console for completion."
