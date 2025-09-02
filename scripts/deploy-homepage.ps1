# Engent Labs Homepage Deployment Script
# This script deploys the homepage to www.engentlabs.com (root)

param(
    [string]$Environment = "production",
    [string]$DistributionId = "E1V533CXZPR3FL",
    [string]$S3Bucket = "engentlabs-frontend",
    [string]$S3Path = ""
)

# Set error action to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Engent Labs Homepage Deployment..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "S3 Bucket: $S3Bucket/$S3Path" -ForegroundColor Cyan
Write-Host "CloudFront Distribution: $DistributionId" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify build exists
Write-Host "📦 Step 1: Verifying build exists..." -ForegroundColor Yellow
try {
    if (-not (Test-Path "dist")) {
        throw "dist folder not found. Please run 'npm run build' first."
    }
    
    $requiredFiles = @("index.html", "assets")
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path "dist/$file")) {
            throw "Required file/folder not found: dist/$file"
        }
    }
    
    Write-Host "  ✅ Build verification passed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Build verification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy to S3 root
Write-Host ""
Write-Host "☁️ Step 2: Deploying homepage to S3 root..." -ForegroundColor Yellow
try {
    $s3Uri = "s3://$S3Bucket/"
    Write-Host "  Syncing to: $s3Uri" -ForegroundColor Gray
    
    # Sync with delete flag to remove old assets
    aws s3 sync dist/ $s3Uri --delete
    
    if ($LASTEXITCODE -ne 0) {
        throw "S3 sync failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  ✅ Homepage deployment completed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Homepage deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Invalidate CloudFront cache
Write-Host ""
Write-Host "🔄 Step 3: Invalidating CloudFront cache..." -ForegroundColor Yellow
try {
    Write-Host "  Creating invalidation for all paths..." -ForegroundColor Gray
    
    # Create invalidation for all paths
    $invalidationResult = aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
    
    if ($LASTEXITCODE -ne 0) {
        throw "CloudFront invalidation failed"
    }
    
    # Extract invalidation ID
    $invalidationId = ($invalidationResult | ConvertFrom-Json).Invalidation.Id
    
    Write-Host "  ✅ Invalidation created: $invalidationId" -ForegroundColor Green
    
    # Wait for invalidation to complete
    Write-Host "  Waiting for invalidation to complete..." -ForegroundColor Gray
    do {
        Start-Sleep -Seconds 5
        $status = aws cloudfront get-invalidation --distribution-id $DistributionId --id $invalidationId | ConvertFrom-Json
        $invalidationStatus = $status.Invalidation.Status
        Write-Host "  Status: $invalidationStatus" -ForegroundColor Gray
    } while ($invalidationStatus -eq "InProgress")
    
    Write-Host "  ✅ CloudFront invalidation completed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ CloudFront invalidation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Deployment Summary
Write-Host ""
Write-Host "🎉 Step 4: Deployment Summary..." -ForegroundColor Yellow
Write-Host "  🏠 Homepage URL: https://www.engentlabs.com/" -ForegroundColor Green
Write-Host "  🔬 Labs URL: https://www.engentlabs.com/labs/" -ForegroundColor Green
Write-Host "  ☁️ S3 Bucket: $S3Bucket" -ForegroundColor Cyan
Write-Host "  🔄 CloudFront: Invalidated (ID: $invalidationId)" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Homepage deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your updated homepage is now live at https://www.engentlabs.com/" -ForegroundColor Yellow
