# PowerShell deployment script for Windows
param(
    [Parameter(Mandatory=$true)]
    [string]$S3_BUCKET,
    
    [Parameter(Mandatory=$true)]
    [string]$CF_DISTRIBUTION_ID
)

# Exit on any error
$ErrorActionPreference = "Stop"

Write-Host "== Build frontend ==" -ForegroundColor Green
npm run build

# Vite uses dist/, CRA uses build/
$OUTDIR = "dist"
if (Test-Path "build") {
    $OUTDIR = "build"
}

Write-Host "== Upload to S3 bucket: $S3_BUCKET ==" -ForegroundColor Green
aws s3 sync "${OUTDIR}/" "s3://${S3_BUCKET}/" --delete

Write-Host "== Invalidate CloudFront distribution: $CF_DISTRIBUTION_ID ==" -ForegroundColor Green
aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" --paths "/*"

Write-Host "✅ Deployment complete" -ForegroundColor Green
