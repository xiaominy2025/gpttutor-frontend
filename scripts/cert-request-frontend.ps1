$ErrorActionPreference = "Stop"

# Check for watch parameter
$Watch = $false
if ($args -contains "-Watch") {
    $Watch = $true
}

$Region = "us-east-1"
$Domain = "engentlabs.com"
$SANs   = @("www.engentlabs.com","*.engentlabs.com")
$ArnFile = "./.acm_frontend_arn"

Write-Host "== Requesting ACM cert in $Region for $Domain, SANs: $($SANs -join ', ') =="

$req = aws acm request-certificate `
  --region $Region `
  --domain-name $Domain `
  --subject-alternative-names $SANs `
  --validation-method DNS | ConvertFrom-Json

$arn = $req.CertificateArn
$arn | Out-File -FilePath $ArnFile -Encoding ascii -NoNewline
Write-Host "CertificateArn: $arn"
Write-Host "Saved to $ArnFile`n"

Write-Host "== DNS validation records =="
aws acm describe-certificate `
  --region $Region `
  --certificate-arn $arn `
  --query "Certificate.DomainValidationOptions[].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value}" `
  --output table

if ($Watch) {
  Write-Host "`n== Watching for ISSUED status (Ctrl-C to stop) =="
  while ($true) {
    $status = aws acm describe-certificate --region $Region --certificate-arn $arn --query "Certificate.Status" --output text
    Write-Host "$(Get-Date -Format HH:mm:ss) Status: $status"
    if ($status -eq "ISSUED") { break }
    Start-Sleep -Seconds 15
  }
}

Write-Host "`nTip: Reprint CNAMEs later:"
Write-Host "aws acm describe-certificate --region $Region --certificate-arn $(Get-Content $ArnFile) --query `"Certificate.DomainValidationOptions[].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value}`" --output table"
