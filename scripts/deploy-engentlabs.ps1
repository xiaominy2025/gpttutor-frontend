# Engent Labs Frontend Deployment Script
# This script builds and deploys the frontend to www.engentlabs.com/labs/

param(
    [string]$Environment = "production",
    [string]$DistributionId = "E1V533CXZPR3FL",
    [string]$S3Bucket = "engentlabs-frontend",
    [string]$S3Path = "labs"
)

# Set error action to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Engent Labs Frontend Deployment..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "S3 Bucket: $S3Bucket/$S3Path" -ForegroundColor Cyan
Write-Host "CloudFront Distribution: $DistributionId" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean and build the project
Write-Host "📦 Step 1: Building production bundle..." -ForegroundColor Yellow
try {
    # Remove existing dist folder
    if (Test-Path "dist") {
        Write-Host "  Cleaning existing dist folder..." -ForegroundColor Gray
        Remove-Item -Path "dist" -Recurse -Force
    }
    
    # Run npm build
    Write-Host "  Running npm run build..." -ForegroundColor Gray
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  ✅ Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Verify build output
Write-Host ""
Write-Host "🔍 Step 2: Verifying build output..." -ForegroundColor Yellow
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
    
    # Check for updated CSS
    $cssFiles = Get-ChildItem "dist/assets" -Filter "*.css"
    if ($cssFiles.Count -eq 0) {
        throw "No CSS files found in dist/assets"
    }
    
    # Check for updated JS
    $jsFiles = Get-ChildItem "dist/assets" -Filter "*.js"
    if ($jsFiles.Count -eq 0) {
        throw "No JS files found in dist/assets"
    }
    
    Write-Host "  ✅ Build verification passed" -ForegroundColor Green
    Write-Host "  CSS files: $($cssFiles.Count)" -ForegroundColor Gray
    Write-Host "  JS files: $($jsFiles.Count)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Build verification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy to S3
Write-Host ""
Write-Host "☁️ Step 3: Deploying to S3..." -ForegroundColor Yellow
try {
    $s3Uri = "s3://$S3Bucket/$S3Path"
    Write-Host "  Syncing to: $s3Uri" -ForegroundColor Gray
    
    # Sync with delete flag to remove old assets
    aws s3 sync dist/ $s3Uri --delete
    
    if ($LASTEXITCODE -ne 0) {
        throw "S3 sync failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  ✅ S3 deployment completed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ S3 deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Invalidate CloudFront cache
Write-Host ""
Write-Host "🔄 Step 4: Invalidating CloudFront cache..." -ForegroundColor Yellow
try {
    Write-Host "  Creating invalidation for all paths..." -ForegroundColor Gray
    
    # Create invalidation for all paths
    $invalidation = aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*" | ConvertFrom-Json
    
    if ($LASTEXITCODE -ne 0) {
        throw "CloudFront invalidation failed"
    }
    
    $invalidationId = $invalidation.Invalidation.Id
    Write-Host "  ✅ Invalidation created: $invalidationId" -ForegroundColor Green
    
    # Wait for invalidation to complete
    Write-Host "  Waiting for invalidation to complete..." -ForegroundColor Gray
    do {
        Start-Sleep -Seconds 10
        $status = aws cloudfront get-invalidation --distribution-id $DistributionId --id $invalidationId | ConvertFrom-Json
        $invalidationStatus = $status.Invalidation.Status
        Write-Host "  Status: $invalidationStatus" -ForegroundColor Gray
    } while ($invalidationStatus -eq "InProgress")
    
    if ($invalidationStatus -eq "Completed") {
        Write-Host "  ✅ CloudFront invalidation completed successfully" -ForegroundColor Green
    } else {
        throw "CloudFront invalidation failed with status: $invalidationStatus"
    }
} catch {
    Write-Host "  ❌ CloudFront invalidation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Verification
Write-Host ""
Write-Host "✅ Step 5: Deployment Summary..." -ForegroundColor Green
Write-Host "  🎯 Target URL: https://www.engentlabs.com/labs/" -ForegroundColor Cyan
Write-Host "  📦 Build: dist/ folder deployed" -ForegroundColor Gray
Write-Host "  ☁️ S3: $S3Bucket/$S3Path" -ForegroundColor Gray
Write-Host "  🔄 CloudFront: Invalidated (ID: $invalidationId)" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 2-3 minutes for CloudFront to propagate changes" -ForegroundColor Gray
Write-Host "  2. Test in incognito/private browser window" -ForegroundColor Gray
Write-Host "  3. Hard refresh (Ctrl+F5) if changes not visible" -ForegroundColor Gray
Write-Host "  4. Clear browser cache if needed" -ForegroundColor Gray
