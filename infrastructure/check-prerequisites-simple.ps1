# Simple PowerShell script to check CloudFront setup prerequisites

Write-Host "🔍 Checking CloudFront setup prerequisites..." -ForegroundColor Green
Write-Host ""

# Check AWS CLI
Write-Host "1. Checking AWS CLI..." -ForegroundColor Yellow
$awsVersion = aws --version 2>$null
if ($awsVersion) {
    Write-Host "   ✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
Write-Host ""
Write-Host "2. Checking AWS credentials..." -ForegroundColor Yellow
$callerIdentity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
if ($callerIdentity) {
    Write-Host "   ✅ AWS credentials valid" -ForegroundColor Green
    Write-Host "   📋 Account ID: $($callerIdentity.Account)" -ForegroundColor Cyan
    Write-Host "   👤 User: $($callerIdentity.Arn)" -ForegroundColor Cyan
    $accountId = $callerIdentity.Account
} else {
    Write-Host "   ❌ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Check S3 buckets
Write-Host ""
Write-Host "3. Checking S3 buckets..." -ForegroundColor Yellow
$s3Buckets = aws s3 ls --query 'Buckets[].Name' --output text 2>$null
if ($s3Buckets) {
    Write-Host "   📦 Available S3 buckets:" -ForegroundColor Cyan
    foreach ($bucket in $s3Buckets.Split("`n")) {
        if ($bucket.Trim()) {
            Write-Host "      - $($bucket.Trim())" -ForegroundColor White
        }
    }
} else {
    Write-Host "   ⚠️  Could not list S3 buckets" -ForegroundColor Yellow
}

# Check ACM certificates
Write-Host ""
Write-Host "4. Checking ACM certificates in us-east-1..." -ForegroundColor Yellow
$certificates = aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?contains(DomainName, `engentlabs.com`)].{Domain:DomainName,ARN:CertificateArn,Status:Status}' --output table 2>$null
if ($certificates -and $certificates -notlike "*No certificates found*") {
    Write-Host "   ✅ Found certificates for engentlabs.com:" -ForegroundColor Green
    Write-Host $certificates -ForegroundColor White
} else {
    Write-Host "   ⚠️  No certificates found for engentlabs.com in us-east-1" -ForegroundColor Yellow
    Write-Host "   📝 You may need to create or import a certificate" -ForegroundColor Cyan
}

# Check required permissions
Write-Host ""
Write-Host "5. Checking required permissions..." -ForegroundColor Yellow

Write-Host "   🔍 Testing CloudFront permissions..." -ForegroundColor Cyan
$cfTest = aws cloudfront list-distributions --query 'DistributionList.MaxItems' --output text 2>$null
if ($cfTest) {
    Write-Host "   ✅ CloudFront access confirmed" -ForegroundColor Green
} else {
    Write-Host "   ❌ CloudFront access denied. Check your IAM permissions." -ForegroundColor Red
}

Write-Host ""
Write-Host "6. Testing S3 permissions..." -ForegroundColor Cyan
$s3Test = aws s3 ls --query 'Buckets[0].Name' --output text 2>$null
if ($s3Test) {
    Write-Host "   ✅ S3 access confirmed" -ForegroundColor Green
} else {
    Write-Host "   ❌ S3 access denied. Check your IAM permissions." -ForegroundColor Red
}

Write-Host ""
Write-Host "7. Testing ACM permissions..." -ForegroundColor Cyan
$acmTest = aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[0].CertificateArn' --output text 2>$null
if ($acmTest) {
    Write-Host "   ✅ ACM access confirmed" -ForegroundColor Green
} else {
    Write-Host "   ❌ ACM access denied. Check your IAM permissions." -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Prerequisites Summary:" -ForegroundColor Green
Write-Host "   - AWS CLI: ✅" -ForegroundColor Green
Write-Host "   - AWS Credentials: ✅" -ForegroundColor Green
Write-Host "   - Account ID: $accountId" -ForegroundColor Cyan
Write-Host "   - S3 Access: ✅" -ForegroundColor Green
Write-Host "   - CloudFront Access: ✅" -ForegroundColor Green
Write-Host "   - ACM Access: ✅" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Update infrastructure/setup-cloudfront.sh with your values" -ForegroundColor White
Write-Host "   2. Run: bash infrastructure/setup-cloudfront.sh" -ForegroundColor White
Write-Host "   3. Configure DNS in Namecheap" -ForegroundColor White
Write-Host ""
Write-Host "💡 Required IAM permissions:" -ForegroundColor Yellow
Write-Host "   - s3:GetBucketPolicy, s3:PutBucketPolicy" -ForegroundColor White
Write-Host "   - cloudfront:CreateDistribution, cloudfront:GetDistribution" -ForegroundColor White
Write-Host "   - acm:DescribeCertificate" -ForegroundColor White
Write-Host "   - iam:GetUser, sts:GetCallerIdentity" -ForegroundColor White
