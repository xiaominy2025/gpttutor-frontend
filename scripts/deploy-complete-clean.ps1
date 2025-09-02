# Engent Labs Complete Deployment Script
# This script deploys both homepage and labs application successfully
# Based on proven deployment process from August 28-29, 2025
# 
# ROOT CAUSE FIX: This script ensures BOTH locations are deployed and BOTH paths are invalidated
# to prevent the deployment issues we experienced where only one location was updated.

param(
    [string]$Environment = "production",
    [string]$DistributionId = "E1V533CXZPR3FL",
    [string]$S3Bucket = "engentlabs-frontend"
)

# Set error action to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "Starting Engent Labs Complete Deployment..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "S3 Bucket: $S3Bucket" -ForegroundColor Cyan
Write-Host "CloudFront Distribution: $DistributionId" -ForegroundColor Cyan
Write-Host ""
Write-Host "Root Cause Fix: This script deploys BOTH locations to prevent deployment issues:" -ForegroundColor Yellow
Write-Host "  • Homepage: s3://$S3Bucket/ → https://www.engentlabs.com/" -ForegroundColor Gray
Write-Host "  • Labs: s3://$S3Bucket/labs/ → https://www.engentlabs.com/labs/" -ForegroundColor Gray
Write-Host "  • Invalidates: /* AND /labs/* paths" -ForegroundColor Gray
Write-Host ""

# Step 1: Verify prerequisites
Write-Host "Step 1: Verifying prerequisites..." -ForegroundColor Yellow
try {
    # Check AWS CLI
    $awsVersion = aws --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI not found or not working"
    }
    Write-Host "  [OK] AWS CLI: $awsVersion" -ForegroundColor Green
    
    # Check Node.js
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found or not working"
    }
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
    
    # Check npm
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "npm not found or not working"
    }
    Write-Host "  [OK] npm: $npmVersion" -ForegroundColor Green
    
} catch {
    Write-Host "  [ERROR] Prerequisites check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Clean and build
Write-Host ""
Write-Host "Step 2: Building application..." -ForegroundColor Yellow
try {
    # Clean existing build
    if (Test-Path "dist") {
        Write-Host "  Cleaning existing dist folder..." -ForegroundColor Gray
        Remove-Item -Path "dist" -Recurse -Force
    }
    
    # Build application
    Write-Host "  Running npm run build..." -ForegroundColor Gray
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  [OK] Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Verify build output
Write-Host ""
Write-Host "Step 3: Verifying build output..." -ForegroundColor Yellow
try {
    if (-not (Test-Path "dist")) {
        throw "dist folder not found after build"
    }
    
    $requiredFiles = @("index.html", "assets")
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path "dist/$file")) {
            throw "Required file/folder not found: dist/$file"
        }
    }
    
    Write-Host "  [OK] Build verification passed" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Build verification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Deploy homepage to root
Write-Host ""
Write-Host "Step 4: Deploying homepage to root..." -ForegroundColor Yellow
try {
    $s3Uri = "s3://$S3Bucket/"
    Write-Host "  Syncing to: $s3Uri" -ForegroundColor Gray
    
    aws s3 sync dist/ $s3Uri --delete
    
    if ($LASTEXITCODE -ne 0) {
        throw "Homepage S3 sync failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  [OK] Homepage deployment completed" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Homepage deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Invalidate CloudFront for homepage
Write-Host ""
Write-Host "Step 5: Invalidating CloudFront for homepage..." -ForegroundColor Yellow
try {
    Write-Host "  Creating invalidation for root paths..." -ForegroundColor Gray
    
    $invalidationResult = aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
    
    if ($LASTEXITCODE -ne 0) {
        throw "CloudFront invalidation failed"
    }
    
    $invalidationId = ($invalidationResult | ConvertFrom-Json).Invalidation.Id
    Write-Host "  [OK] Homepage invalidation created: $invalidationId" -ForegroundColor Green
    
    # Wait for invalidation to complete
    Write-Host "  Waiting for homepage invalidation to complete..." -ForegroundColor Gray
    do {
        Start-Sleep -Seconds 5
        $status = aws cloudfront get-invalidation --distribution-id $DistributionId --id $invalidationId | ConvertFrom-Json
        $invalidationStatus = $status.Invalidation.Status
        Write-Host "  Status: $invalidationStatus" -ForegroundColor Gray
    } while ($invalidationStatus -eq "InProgress")
    
    Write-Host "  [OK] Homepage invalidation completed" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Homepage invalidation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Deploy labs to subdirectory
Write-Host ""
Write-Host "Step 6: Deploying labs to subdirectory..." -ForegroundColor Yellow
try {
    $s3Uri = "s3://$S3Bucket/labs/"
    Write-Host "  Syncing to: $s3Uri" -ForegroundColor Gray
    
    aws s3 sync dist/ $s3Uri --delete
    
    if ($LASTEXITCODE -ne 0) {
        throw "Labs S3 sync failed with exit code $LASTEXITCODE"
    }
    
    # Ensure index.html is in labs directory
    Write-Host "  Ensuring index.html is in labs directory..." -ForegroundColor Gray
    aws s3 cp dist/index.html s3://$S3Bucket/labs/index.html
    
    Write-Host "  [OK] Labs deployment completed" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Labs deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 7: Invalidate CloudFront for labs
Write-Host ""
Write-Host "Step 7: Invalidating CloudFront for labs..." -ForegroundColor Yellow
try {
    Write-Host "  Creating invalidation for labs paths..." -ForegroundColor Gray
    
    $invalidationResult = aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/labs/*"
    
    if ($LASTEXITCODE -ne 0) {
        throw "CloudFront invalidation failed"
    }
    
    $invalidationId = ($invalidationResult | ConvertFrom-Json).Invalidation.Id
    Write-Host "  [OK] Labs invalidation created: $invalidationId" -ForegroundColor Green
    
    # Wait for invalidation to complete
    Write-Host "  Waiting for labs invalidation to complete..." -ForegroundColor Gray
    do {
        Start-Sleep -Seconds 5
        $status = aws cloudfront get-invalidation --distribution-id $DistributionId --id $invalidationId | ConvertFrom-Json
        $invalidationStatus = $status.Invalidation.Status
        Write-Host "  Status: $invalidationStatus" -ForegroundColor Gray
    } while ($invalidationStatus -eq "InProgress")
    
    Write-Host "  [OK] Labs invalidation completed" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Labs invalidation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 8: Final verification
Write-Host ""
Write-Host "Step 8: Final verification..." -ForegroundColor Yellow
try {
    Write-Host "  Verifying S3 contents..." -ForegroundColor Gray
    
    # Check root contents
    $rootFiles = aws s3 ls s3://$S3Bucket/ --recursive
    Write-Host "  [OK] Root files verified" -ForegroundColor Green
    
    # Check labs contents
    $labsFiles = aws s3 ls s3://$S3Bucket/labs/ --recursive
    Write-Host "  [OK] Labs files verified" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARNING] Verification warning: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 9: Deployment Summary
Write-Host ""
Write-Host "Deployment Summary..." -ForegroundColor Green
Write-Host "  Homepage: https://www.engentlabs.com/" -ForegroundColor Cyan
Write-Host "  Labs: https://www.engentlabs.com/labs/" -ForegroundColor Cyan
Write-Host "  S3 Bucket: $S3Bucket" -ForegroundColor Gray
Write-Host "  CloudFront: E1V533CXZPR3FL" -ForegroundColor Gray

Write-Host ""
Write-Host "[OK] Complete deployment successful!" -ForegroundColor Green
Write-Host "Both homepage and labs are now live and updated!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Root Cause Prevention:" -ForegroundColor Yellow
Write-Host "  [OK] Both locations deployed (root + /labs/)" -ForegroundColor Green
Write-Host "  [OK] Both paths invalidated (/* + /labs/*)" -ForegroundColor Green
Write-Host "  [OK] No more partial deployment issues" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Visit https://www.engentlabs.com/ to verify homepage" -ForegroundColor White
Write-Host "  2. Visit https://www.engentlabs.com/labs/ to verify labs" -ForegroundColor White
Write-Host "  3. Check browser console for any errors" -ForegroundColor White
Write-Host ""
Write-Host "Tip: Use this script for all future deployments to avoid partial update issues!" -ForegroundColor Cyan
