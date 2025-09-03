# Backend Connectivity & CORS Validation Script
# Run this before testing the quality management system

param(
    [string]$LambdaUrl = "https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws/",
    [string]$TestOrigin = "https://www.engentlabs.com"
)

Write-Host "Backend Connectivity & CORS Validation" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic connectivity - try different endpoints
Write-Host "Test 1: Basic Connectivity" -ForegroundColor Yellow

# Try the root endpoint first
try {
    $response = Invoke-WebRequest -Uri $LambdaUrl -Method GET -TimeoutSec 30
    Write-Host "Lambda endpoint is reachable (root)" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response Time: $($response.BaseResponse.ResponseTime)ms" -ForegroundColor Gray
} catch {
    Write-Host "Root endpoint not accessible (expected for Lambda Function URLs)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Try common API endpoints
$apiEndpoints = @(
    "/health",
    "/api/health", 
    "/api/course/decision",
    "/query"
)

$endpointFound = $false
foreach ($endpoint in $apiEndpoints) {
    try {
        $testUrl = $LambdaUrl.TrimEnd('/') + $endpoint
        Write-Host "   Testing endpoint: $endpoint" -ForegroundColor Gray
        
        $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 30
        Write-Host "   Endpoint $endpoint is accessible" -ForegroundColor Green
        Write-Host "      Status: $($response.StatusCode)" -ForegroundColor Gray
        $endpointFound = $true
        break
    } catch {
        Write-Host "   Endpoint $endpoint not accessible" -ForegroundColor Gray
    }
}

if (-not $endpointFound) {
    Write-Host "   No accessible GET endpoints found - this is normal for Lambda Function URLs" -ForegroundColor Yellow
    Write-Host "   Proceeding to test POST endpoints..." -ForegroundColor Yellow
}

# Test 2: CORS preflight (OPTIONS request)
Write-Host ""
Write-Host "Test 2: CORS Preflight (OPTIONS)" -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $TestOrigin
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    
    $response = Invoke-WebRequest -Uri $LambdaUrl -Method OPTIONS -Headers $headers -TimeoutSec 30
    
    Write-Host "CORS preflight successful" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    
    # Check CORS headers
    $corsHeaders = @(
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods", 
        "Access-Control-Allow-Headers",
        "Access-Control-Max-Age"
    )
    
    foreach ($header in $corsHeaders) {
        if ($response.Headers[$header]) {
            Write-Host "   $header`: $($response.Headers[$header])" -ForegroundColor Gray
        } else {
            Write-Host "   Missing: $header" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "CORS preflight failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: POST request with CORS (this is the main test)
Write-Host ""
Write-Host "Test 3: POST Request with CORS" -ForegroundColor Yellow
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
    
    Write-Host "   Sending POST request to Lambda endpoint..." -ForegroundColor Gray
    # Use the correct /query endpoint for POST requests
    $queryUrl = $LambdaUrl.TrimEnd('/') + "/query"
    $response = Invoke-WebRequest -Uri $queryUrl -Method POST -Body $testPayload -Headers $headers -TimeoutSec 60
    
    Write-Host "POST request successful" -ForegroundColor Green
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
        }
        
    } catch {
        Write-Host "   Could not parse response as JSON" -ForegroundColor Yellow
        Write-Host "   Raw response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))..." -ForegroundColor Gray
    }
    
} catch {
    Write-Host "POST request failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details about the error
    if ($_.Exception.Response) {
        Write-Host "   Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray
        Write-Host "   Response Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Gray
    }
}

# Test 4: Performance baseline (only if POST worked)
Write-Host ""
Write-Host "Test 4: Performance Baseline" -ForegroundColor Yellow
$responseTimes = @()

if ($response -and $response.StatusCode -eq 200) {
    for ($i = 1; $i -le 3; $i++) {
        try {
            $startTime = Get-Date
            $response = Invoke-WebRequest -Uri $queryUrl -Method POST -Body $testPayload -Headers $headers -TimeoutSec 60
            $endTime = Get-Date
            $duration = ($endTime - $startTime).TotalMilliseconds
            
            $responseTimes += $duration
            Write-Host "   Request $i`: ${duration}ms" -ForegroundColor Gray
            
            Start-Sleep -Seconds 2  # Wait between requests
            
        } catch {
            Write-Host "   Request $i`: Failed" -ForegroundColor Red
        }
    }

    if ($responseTimes.Count -gt 0) {
        $avgResponseTime = ($responseTimes | Measure-Object -Average).Average
        $minResponseTime = ($responseTimes | Measure-Object -Minimum).Minimum
        $maxResponseTime = ($responseTimes | Measure-Object -Maximum).Maximum
        
        Write-Host "   Performance Summary:" -ForegroundColor Cyan
        Write-Host "      Average: ${avgResponseTime}ms" -ForegroundColor Gray
        Write-Host "      Min: ${minResponseTime}ms" -ForegroundColor Gray
        Write-Host "      Max: ${maxResponseTime}ms" -ForegroundColor Gray
        
        # Performance assessment
        if ($avgResponseTime -lt 5000) {
            Write-Host "      Performance is excellent" -ForegroundColor Green
        } elseif ($avgResponseTime -lt 10000) {
            Write-Host "      Performance is good" -ForegroundColor Green
        } elseif ($avgResponseTime -lt 15000) {
            Write-Host "      Performance is acceptable" -ForegroundColor Yellow
        } else {
            Write-Host "      Performance needs improvement" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   Skipping performance test - POST request did not succeed" -ForegroundColor Yellow
}

# Test 5: CORS validation for both domains
Write-Host ""
Write-Host "Test 5: CORS Domain Validation" -ForegroundColor Yellow
$domains = @("https://www.engentlabs.com", "https://engentlabs.com")

foreach ($domain in $domains) {
    try {
        $headers = @{
            "Origin" = $domain
            "Access-Control-Request-Method" = "POST"
        }
        
        $response = Invoke-WebRequest -Uri $LambdaUrl -Method OPTIONS -Headers $headers -TimeoutSec 30
        
        if ($response.Headers["Access-Control-Allow-Origin"] -eq $domain) {
            Write-Host "   $domain`: CORS allowed" -ForegroundColor Green
        } else {
            Write-Host "   $domain`: CORS response unexpected" -ForegroundColor Yellow
            Write-Host "      Expected: $domain" -ForegroundColor Gray
            Write-Host "      Got: $($response.Headers["Access-Control-Allow-Origin"])" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "   $domain`: CORS test failed" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "Validation Summary" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$allTestsPassed = $true

# Check if we have a successful POST response
if ($response -and $response.StatusCode -eq 200) {
    Write-Host "Backend connectivity: PASSED" -ForegroundColor Green
} else {
    Write-Host "Backend connectivity: NEEDS INVESTIGATION" -ForegroundColor Yellow
    $allTestsPassed = $false
}

if ($response -and $response.Headers["Access-Control-Allow-Origin"]) {
    Write-Host "CORS configuration: PASSED" -ForegroundColor Green
} else {
    Write-Host "CORS configuration: NEEDS INVESTIGATION" -ForegroundColor Yellow
    $allTestsPassed = $false
}

if ($responseTimes.Count -gt 0 -and ($responseTimes | Measure-Object -Average).Average -lt 15000) {
    Write-Host "Performance baseline: PASSED" -ForegroundColor Green
} else {
    Write-Host "Performance baseline: NEEDS ATTENTION" -ForegroundColor Yellow
}

Write-Host ""
if ($allTestsPassed) {
    Write-Host "Backend is ready for quality system testing!" -ForegroundColor Green
    Write-Host "   You can now run the quality management system validation." -ForegroundColor Gray
} else {
    Write-Host "Backend has issues that need to be resolved before testing." -ForegroundColor Yellow
    Write-Host "   Please check the Lambda function configuration and CORS setup." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. If all tests passed, proceed to quality system validation" -ForegroundColor Gray
Write-Host "   2. If tests failed, check Lambda function and CORS configuration" -ForegroundColor Gray
Write-Host "   3. Verify Lambda function URL and permissions" -ForegroundColor Gray
Write-Host "   4. Run this script again after fixing any issues" -ForegroundColor Gray
