# PowerShell script to sync frontend to S3
param(
    [switch]$Build = $true
)

$BUCKET_NAME = "engentlabs-frontend"
$OAC_ID = "E2U5Q5TC49PTNJ"

Write-Host "🚀 Syncing frontend to S3 bucket: $BUCKET_NAME" -ForegroundColor Green

if ($Build) {
    Write-Host "📦 Building frontend..." -ForegroundColor Yellow
    npm run build
}

Write-Host "📤 Syncing to S3..." -ForegroundColor Yellow

# Sync with proper content types
aws s3 sync dist/ s3://$BUCKET_NAME/ `
    --delete `
    --cache-control "max-age=31536000,public" `
    --exclude "*.html" `
    --exclude "*.json" `
    --exclude "*.xml"

# Sync HTML files with shorter cache
Write-Host "📄 Syncing HTML files..." -ForegroundColor Yellow
aws s3 sync dist/ s3://$BUCKET_NAME/ `
    --delete `
    --cache-control "max-age=0,no-cache,no-store,must-revalidate" `
    --include "*.html" `
    --include "*.json" `
    --include "*.xml"

Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Bucket: s3://$BUCKET_NAME" -ForegroundColor Cyan
Write-Host "🔗 OAC ID: $OAC_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Create CloudFront distribution using OAC ID: $OAC_ID" -ForegroundColor White
Write-Host "   2. Update CloudFront origin to use this bucket" -ForegroundColor White
Write-Host "   3. Configure DNS in Namecheap" -ForegroundColor White
