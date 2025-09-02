param(
  [string]$AthenaDb = "engentlabs_analytics",
  [string]$AthenaResults = "s3://engentlabs-frontend/athena-results/",
  [string]$WorkGroup = "primary"
)

$sql = Get-Content "./scripts/aws_analytics/athena_sample_queries.sql" -Raw
$sql = $sql.Replace('${ATHENA_DB}',$AthenaDb)

$tmp = New-TemporaryFile
Set-Content -Path $tmp -Value $sql

aws athena start-query-execution `
  --query-string file://$tmp `
  --work-group $WorkGroup `
  --query-execution-context Database=$AthenaDb `
  --result-configuration OutputLocation=$AthenaResults | Out-Null

Write-Host "Submitted sample queries (check Athena history/results)."

