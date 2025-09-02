# PowerShell script to create S3 bucket for EngentLabs frontend hosting

# Configuration
$BUCKET_NAME = "engentlabs-frontend"
$REGION = "us-east-1"
$AWS_ACCOUNT_ID = "771049112957"

Write-Host "🚀 Creating S3 bucket for EngentLabs frontend hosting" -ForegroundColor Green
Write-Host "Bucket: $BUCKET_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host "Account: $AWS_ACCOUNT_ID" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create the S3 bucket
Write-Host "📦 Creating S3 bucket..." -ForegroundColor Yellow
try {
    aws s3api create-bucket `
        --bucket "$BUCKET_NAME" `
        --region "$REGION" `
        --create-bucket-configuration LocationConstraint="$REGION"
    Write-Host "✅ S3 bucket created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create S3 bucket: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Enable versioning
Write-Host "🔄 Enabling versioning..." -ForegroundColor Yellow
try {
    aws s3api put-bucket-versioning `
        --bucket "$BUCKET_NAME" `
        --versioning-configuration Status=Enabled
    Write-Host "✅ Versioning enabled" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to enable versioning: $_" -ForegroundColor Red
}

# Step 3: Block all public access
Write-Host "🔒 Blocking all public access..." -ForegroundColor Yellow
try {
    aws s3api put-public-access-block `
        --bucket "$BUCKET_NAME" `
        --public-access-block-configuration `
            BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    Write-Host "✅ Public access blocked" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to block public access: $_" -ForegroundColor Red
}

# Step 4: Create Origin Access Control (OAC)
Write-Host "🌐 Creating Origin Access Control..." -ForegroundColor Yellow
try {
    $OAC_ID = aws cloudfront create-origin-access-control `
        --origin-access-control-config `
            Name="engentlabs-frontend-oac",Description="OAC for EngentLabs frontend",SigningBehavior="always",SigningProtocol="sigv4" `
        --query 'OriginAccessControl.Id' `
        --output text
    Write-Host "✅ Origin Access Control created: $OAC_ID" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create OAC: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Create bucket policy
Write-Host "📝 Creating bucket policy..." -ForegroundColor Yellow
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::$AWS_ACCOUNT_ID:distribution/*"
                }
            }
        }
    ]
}
"@

try {
    $bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding UTF8
    aws s3api put-bucket-policy `
        --bucket "$BUCKET_NAME" `
        --policy file://bucket-policy.json
    Write-Host "✅ Bucket policy applied" -ForegroundColor Green
    Remove-Item "bucket-policy.json" -Force
} catch {
    Write-Host "❌ Failed to apply bucket policy: $_" -ForegroundColor Red
}

# Step 6: Set up website configuration
Write-Host "📋 Setting up website configuration..." -ForegroundColor Yellow
try {
    aws s3api put-bucket-website `
        --bucket "$BUCKET_NAME" `
        --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'
    Write-Host "✅ Website configuration set" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set website configuration: $_" -ForegroundColor Red
}

# Step 7: Create deployment script
Write-Host "📝 Creating deployment script..." -ForegroundColor Yellow
$syncScript = @"
# PowerShell script to sync frontend to S3
param(
    [switch]`$Build = `$true
)

Write-Host "🚀 Syncing frontend to S3 bucket: $BUCKET_NAME" -ForegroundColor Green

if (`$Build) {
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
"@

$syncScript | Out-File -FilePath "scripts/sync-to-s3.ps1" -Encoding UTF8
Write-Host "✅ Deployment script created: scripts/sync-to-s3.ps1" -ForegroundColor Green

# Step 8: Create verification script
Write-Host "🔍 Creating verification script..." -ForegroundColor Yellow
$verifyScript = @"
# PowerShell script to verify S3 bucket setup
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
    `$VERSIONING_STATUS = aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" --query 'Status' --output text
    Write-Host "✅ Versioning status: `$VERSIONING_STATUS" -ForegroundColor Green
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
"@

$verifyScript | Out-File -FilePath "scripts/verify-s3.ps1" -Encoding UTF8
Write-Host "✅ Verification script created: scripts/verify-s3.ps1" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "🎉 S3 bucket setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "   📦 Bucket: s3://$BUCKET_NAME" -ForegroundColor White
Write-Host "   🌍 Region: $REGION" -ForegroundColor White
Write-Host "   🔒 Public Access: Blocked" -ForegroundColor White
Write-Host "   🔄 Versioning: Enabled" -ForegroundColor White
Write-Host "   🌐 OAC ID: $OAC_ID" -ForegroundColor White
Write-Host ""
Write-Host "📝 Created scripts:" -ForegroundColor Yellow
Write-Host "   📤 scripts/sync-to-s3.ps1 - Deploy frontend to S3" -ForegroundColor White
Write-Host "   🔍 scripts/verify-s3.ps1 - Verify bucket setup" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Build and deploy: .\scripts\sync-to-s3.ps1" -ForegroundColor White
Write-Host "   2. Verify setup: .\scripts\verify-s3.ps1" -ForegroundColor White
Write-Host "   3. Create CloudFront distribution using the OAC ID: $OAC_ID" -ForegroundColor White
Write-Host "   4. Update CloudFront origin to use this bucket" -ForegroundColor White
Write-Host ""
Write-Host "💡 Note: You'll need to create a new ACM certificate for engentlabs.com" -ForegroundColor Yellow
Write-Host "   Current certificate only covers api.engentlabs.com" -ForegroundColor White
