# PowerShell script to fix backend CORS configuration for deployment
# This ensures the deployed frontend at https://www.engentlabs.com works without CORS issues

Write-Host "🔧 Fixing Backend CORS Configuration for Deployment..." -ForegroundColor Green
Write-Host "📋 This will update the Lambda Function URL CORS settings" -ForegroundColor Yellow

# Lambda function details
$functionName = "engent-v1666-img"
$region = "us-east-2"

# CORS configuration for production deployment
$corsConfig = @{
    AllowOrigins = @("https://www.engentlabs.com", "https://engentlabs.com")
    AllowMethods = @("GET", "POST", "OPTIONS")
    AllowHeaders = @("Content-Type", "Authorization")
    ExposeHeaders = @("*")
    MaxAge = 86400
    AllowCredentials = $false
}

# Convert to JSON (single line for AWS CLI)
$corsJson = $corsConfig | ConvertTo-Json -Compress

Write-Host "🔧 Updating Lambda Function URL CORS configuration..." -ForegroundColor Cyan
Write-Host "📋 Function: $functionName" -ForegroundColor Yellow
Write-Host "🌐 Region: $region" -ForegroundColor Yellow
Write-Host "🔗 Allowed Origins: $($corsConfig.AllowOrigins -join ', ')" -ForegroundColor Yellow

try {
    # Update the Lambda Function URL CORS configuration
    $result = aws lambda update-function-url-config `
        --function-name $functionName `
        --region $region `
        --cors $corsJson

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CORS configuration updated successfully!" -ForegroundColor Green
        
        # Test the configuration
        Write-Host "🧪 Testing CORS configuration..." -ForegroundColor Cyan
        
        # Get the function URL
        $functionUrl = aws lambda get-function-url-config --function-name $functionName --region $region --query 'FunctionUrl' --output text
        
        if ($functionUrl) {
            Write-Host "🔗 Function URL: $functionUrl" -ForegroundColor Yellow
            
            # Test GET /health
            Write-Host "📋 Testing GET /health..." -ForegroundColor Cyan
            try {
                $healthResponse = Invoke-WebRequest -Uri "$functionUrl/health" -Headers @{"Origin" = "https://www.engentlabs.com"} -UseBasicParsing
                Write-Host "✅ GET /health: $($healthResponse.StatusCode)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  GET /health test failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            
            # Test OPTIONS /health
            Write-Host "📋 Testing OPTIONS /health..." -ForegroundColor Cyan
            try {
                $optionsResponse = Invoke-WebRequest -Uri "$functionUrl/health" -Method OPTIONS -Headers @{
                    "Origin" = "https://www.engentlabs.com"
                    "Access-Control-Request-Method" = "GET"
                } -UseBasicParsing
                Write-Host "✅ OPTIONS /health: $($optionsResponse.StatusCode)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  OPTIONS /health test failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            
            Write-Host "🎉 Backend CORS configuration is ready for deployment!" -ForegroundColor Green
            Write-Host "🌐 Deployed frontend at https://www.engentlabs.com should work without CORS issues" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Could not retrieve function URL for testing" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to update CORS configuration" -ForegroundColor Red
        Write-Host "🔍 Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error updating CORS configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Deploy the frontend to AWS" -ForegroundColor White
Write-Host "   2. Test the deployed application at https://www.engentlabs.com" -ForegroundColor White
Write-Host "   3. Verify no CORS errors in browser console" -ForegroundColor White
