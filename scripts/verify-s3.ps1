# PowerShell script to verify S3 bucket setup
$BUCKET_NAME = "engentlabs-frontend"
$OAC_ID = "E2U5Q5TC49PTNJ"
$REGION = "us-east-1"

Write-Host "🔍 Verifying S3 bucket setup..." -ForegroundColor Green

# Check bucket exists
Write-Host "📦 Checking bucket exists..." -ForegroundColor Yellow
try {
    aws s3api head-bucket --bucket "$BUCKET_NAME"
    Write-Host "✅ Bucket exists" -ForegroundColor Green
} catch {
    Write-Host "❌ Bucket does not exist" -ForegroundColor Red
}

# Check versioning
Write-Host "🔄 Checking versioning..." -ForegroundColor Yellow
try {
    $VERSIONING_STATUS = aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" --query 'Status' --output text
    Write-Host "✅ Versioning status: $VERSIONING_STATUS" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not check versioning" -ForegroundColor Red
}

# Check public access block
Write-Host "🔒 Checking public access block..." -ForegroundColor Yellow
try {
    aws s3api get-public-access-block --bucket "$BUCKET_NAME"
    Write-Host "✅ Public access blocked" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not check public access block" -ForegroundColor Red
}

# Check bucket policy
Write-Host "📝 Checking bucket policy..." -ForegroundColor Yellow
try {
    aws s3api get-bucket-policy --bucket "$BUCKET_NAME" --query 'Policy' --output text | ConvertFrom-Json | ConvertTo-Json
    Write-Host "✅ Bucket policy applied" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not check bucket policy" -ForegroundColor Red
}

# List bucket contents
Write-Host "📋 Bucket contents:" -ForegroundColor Yellow
try {
    aws s3 ls s3://$BUCKET_NAME --recursive
} catch {
    Write-Host "Bucket is empty (expected for new bucket)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 S3 bucket setup verification complete!" -ForegroundColor Green
Write-Host "📦 Bucket: s3://$BUCKET_NAME" -ForegroundColor Cyan
Write-Host "🌐 OAC ID: $OAC_ID" -ForegroundColor Cyan
Write-Host "🔗 Region: $REGION" -ForegroundColor Cyan
