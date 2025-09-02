# Engent Labs Frontend Deployment Script for AWS S3 + CloudFront
# Final working PowerShell version for Windows

param(
    [string]$S3_BUCKET = "engentlabs-frontend",
    [string]$CF_DISTRIBUTION_ID = "E1V533CXZPR3FL",
    [switch]$SkipBuild,
    [switch]$SkipInvalidation,
    [switch]$DryRun
)

# Exit on any error
$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Check prerequisites
Write-Status "🔍 Checking prerequisites..." "Blue"

# Check AWS CLI
try {
    $awsVersion = aws --version 2>$null
    Write-Status "✅ AWS CLI is installed: $awsVersion" "Green"
}
catch {
    Write-Status "❌ AWS CLI is not installed. Please install it first." "Red"
    Write-Status "   Download from: https://aws.amazon.com/cli/" "Yellow"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Status "✅ Node.js is installed: $nodeVersion" "Green"
}
catch {
    Write-Status "❌ Node.js is not installed. Please install it first." "Red"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Status "✅ npm is installed: v$npmVersion" "Green"
}
catch {
    Write-Status "❌ npm is not installed. Please install it first." "Red"
    exit 1
}

# Check package.json
if (-not (Test-Path "package.json")) {
    Write-Status "❌ package.json not found. Please run this script from the project root." "Red"
    exit 1
}

Write-Status "✅ All prerequisites met" "Green"

# Check AWS configuration
Write-Status "🔧 Checking AWS configuration..." "Blue"

try {
    $awsIdentity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    Write-Status "✅ AWS credentials configured" "Green"
    Write-Status "   Account: $($awsIdentity.Account)" "Cyan"
}
catch {
    Write-Status "❌ AWS credentials not configured. Please run 'aws configure' first." "Red"
    exit 1
}

# Build project
if (-not $SkipBuild) {
    Write-Status "🔨 Building React app..." "Blue"
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Status "📦 Installing dependencies..." "Cyan"
        npm install
    }
    
    # Build the project
    Write-Status "🏗️  Running build..." "Cyan"
    npm run build
    Write-Status "✅ Build completed successfully" "Green"
}
else {
    Write-Status "⏭️  Skipping build (SkipBuild flag set)" "Yellow"
}

# Deploy to S3
Write-Status "🚀 Deploying to S3 bucket: $S3_BUCKET" "Blue"

# Determine output directory
$OUTDIR = "dist"
if (Test-Path "build") {
    $OUTDIR = "build"
}

if (-not (Test-Path $OUTDIR)) {
    Write-Status "❌ Build output directory '$OUTDIR' not found" "Red"
    Write-Status "   Please run the build first or check your build configuration" "Yellow"
    exit 1
}

if ($DryRun) {
    Write-Status "🔍 DRY RUN: Would sync $OUTDIR/ to s3://$S3_BUCKET/" "Yellow"
    aws s3 sync "${OUTDIR}/" "s3://${S3_BUCKET}/" --delete --dryrun
}
else {
    Write-Status "📤 Syncing files to S3..." "Cyan"
    aws s3 sync "${OUTDIR}/" "s3://${S3_BUCKET}/" --delete
    Write-Status "✅ S3 deployment completed" "Green"
}

# Invalidate CloudFront cache
if (-not $SkipInvalidation) {
    Write-Status "🔄 Invalidating CloudFront distribution: $CF_DISTRIBUTION_ID" "Blue"
    
    if ($DryRun) {
        Write-Status "🔍 DRY RUN: Would invalidate CloudFront distribution" "Yellow"
    }
    else {
        $invalidation = aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" --paths "/*" | ConvertFrom-Json
        Write-Status "✅ CloudFront invalidation initiated" "Green"
        Write-Status "   Invalidation ID: $($invalidation.Invalidation.Id)" "Cyan"
    }
}
else {
    Write-Status "⏭️  Skipping CloudFront invalidation (SkipInvalidation flag set)" "Yellow"
}

# Test deployment
Write-Status "🧪 Testing deployment..." "Blue"

$testUrls = @("https://engentlabs.com", "https://www.engentlabs.com")

foreach ($url in $testUrls) {
    try {
        Write-Status "   Testing: $url" "Cyan"
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "   ✅ $url is accessible" "Green"
        } else {
            Write-Status "   ⚠️  $url returned status $($response.StatusCode)" "Yellow"
        }
    }
    catch {
        Write-Status "   ❌ $url is not accessible" "Red"
    }
}

# Show summary
Write-Status "`n🎉 Deployment Summary" "Green"
Write-Status "==================" "Green"
Write-Status "Frontend deployed to: s3://$S3_BUCKET" "Cyan"
Write-Status "CloudFront distribution: $CF_DISTRIBUTION_ID" "Cyan"
Write-Status "Production URLs:" "Cyan"
Write-Status "  • https://engentlabs.com" "Cyan"
Write-Status "  • https://www.engentlabs.com" "Cyan"
Write-Status "Backend API: https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws" "Cyan"

if (-not $DryRun) {
    Write-Status "`n✅ Deployment completed successfully!" "Green"
    Write-Status "🌐 Your React app is now live on AWS S3 + CloudFront" "Blue"
}
else {
    Write-Status "`n🔍 Dry run completed - no actual changes were made" "Yellow"
}
