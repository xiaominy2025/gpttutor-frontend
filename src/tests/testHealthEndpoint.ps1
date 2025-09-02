# Test Health Endpoint POST Functionality
# This tests if the /health endpoint can handle POST requests with query data

param(
    [string]$LambdaUrl = "https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/health",
    [string]$TestOrigin = "https://www.engentlabs.com"
)

Write-Host "Testing Health Endpoint POST Functionality" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test POST to /health endpoint
Write-Host "Test: POST Request to /health endpoint" -ForegroundColor Yellow

try {
    $testPayload = @{
        query = "What is strategic planning?"
        course_id = "decision"
        user_id = "test-validation"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
        "Origin" = $TestOrigin
    }
    
    Write-Host "   Sending POST request to: $LambdaUrl" -ForegroundColor Gray
    Write-Host "   Payload: $testPayload" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri $LambdaUrl -Method POST -Body $testPayload -Headers $headers -TimeoutSec 60
    
    Write-Host "POST request successful!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response Time: $($response.BaseResponse.ResponseTime)ms" -ForegroundColor Gray
    
    # Check response headers
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "   CORS Origin: $($response.Headers["Access-Control-Allow-Origin"])" -ForegroundColor Gray
    }
    
    # Try to parse response
    try {
        $responseData = $response.Content | ConvertFrom-Json
        Write-Host "   Response parsed successfully" -ForegroundColor Green
        
        # Check response structure
        if ($responseData.data -and $responseData.data.answer) {
            $answerLength = $responseData.data.answer.Length
            Write-Host "   Answer length: $answerLength characters" -ForegroundColor Gray
            
            if ($answerLength -gt 1000) {
                Write-Host "   Response quality appears good" -ForegroundColor Green
            } elseif ($answerLength -gt 500) {
                Write-Host "   Response quality is moderate" -ForegroundColor Yellow
            } else {
                Write-Host "   Response quality appears low" -ForegroundColor Red
            }
        } else {
            Write-Host "   Response structure unexpected" -ForegroundColor Yellow
            Write-Host "   Response keys: $($responseData.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
            Write-Host "   Raw response preview: $($response.Content.Substring(0, [Math]::Min(500, $response.Content.Length)))..." -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "   Could not parse response as JSON" -ForegroundColor Yellow
        Write-Host "   Raw response: $($response.Content.Substring(0, [Math]::Min(500, $response.Content.Length)))..." -ForegroundColor Gray
    }
    
} catch {
    Write-Host "POST request failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details about the error
    if ($_.Exception.Response) {
        Write-Host "   Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray
        Write-Host "   Response Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if /health endpoint accepts POST requests" -ForegroundColor Gray
    Write-Host "   2. Verify Lambda function routing configuration" -ForegroundColor Gray
    Write-Host "   3. Check Lambda function logs for errors" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Cyan
