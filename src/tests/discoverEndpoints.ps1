# Discover Lambda Function Endpoints
# This script tests various common API patterns to find working endpoints

param(
    [string]$BaseUrl = "https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws",
    [string]$TestOrigin = "https://www.engentlabs.com"
)

Write-Host "Discovering Lambda Function Endpoints" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Common API endpoint patterns to test
$endpointsToTest = @(
    @{ path = "/"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/health"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/api"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/api/health"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/api/query"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/query"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/api/course"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/api/course/decision"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/course"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/course/decision"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/v1"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/v1/query"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/lambda"; methods = @("GET", "POST", "OPTIONS") },
    @{ path = "/lambda/query"; methods = @("GET", "POST", "OPTIONS") }
)

$workingEndpoints = @()

foreach ($endpoint in $endpointsToTest) {
    $path = $endpoint.path
    $methods = $endpoint.methods
    
    Write-Host "Testing endpoint: $path" -ForegroundColor Yellow
    
    foreach ($method in $methods) {
        try {
            $testUrl = $BaseUrl.TrimEnd('/') + $path
            Write-Host "   $method`: " -NoNewline -ForegroundColor Gray
            
            if ($method -eq "OPTIONS") {
                # Test CORS preflight
                $headers = @{
                    "Origin" = $TestOrigin
                    "Access-Control-Request-Method" = "POST"
                    "Access-Control-Request-Headers" = "Content-Type"
                }
                $response = Invoke-WebRequest -Uri $testUrl -Method OPTIONS -Headers $headers -TimeoutSec 10
                Write-Host "✅ $($response.StatusCode)" -ForegroundColor Green
                
                if ($response.Headers["Access-Control-Allow-Origin"]) {
                    Write-Host "      CORS: $($response.Headers["Access-Control-Allow-Origin"])" -ForegroundColor Gray
                }
                
            } elseif ($method -eq "POST") {
                # Test POST with query payload
                $testPayload = @{
                    query = "What is strategic planning?"
                    course_id = "decision"
                    user_id = "test-discovery"
                } | ConvertTo-Json
                
                $headers = @{
                    "Content-Type" = "application/json"
                    "Origin" = $TestOrigin
                }
                
                $response = Invoke-WebRequest -Uri $testUrl -Method POST -Body $testPayload -Headers $headers -TimeoutSec 30
                Write-Host "✅ $($response.StatusCode)" -ForegroundColor Green
                
                # Check if response looks like a query response
                try {
                    $responseData = $response.Content | ConvertFrom-Json
                    if ($responseData.data -and $responseData.data.answer) {
                        $answerLength = $responseData.data.answer.Length
                        Write-Host "      Query Response: $answerLength chars" -ForegroundColor Green
                        $workingEndpoints += @{ path = $path; method = $method; status = "Query Endpoint"; responseLength = $answerLength }
                    } else {
                        Write-Host "      Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
                        $workingEndpoints += @{ path = $path; method = $method; status = "Working"; responseLength = $response.Content.Length }
                    }
                } catch {
                    Write-Host "      Raw Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
                    $workingEndpoints += @{ path = $path; method = $method; status = "Working"; responseLength = $response.Content.Length }
                }
                
            } else {
                # Test GET
                $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 10
                Write-Host "✅ $($response.StatusCode)" -ForegroundColor Green
                
                if ($response.Content.Length -lt 200) {
                    Write-Host "      Content: $($response.Content)" -ForegroundColor Gray
                } else {
                    Write-Host "      Content: $($response.Content.Substring(0, 200))..." -ForegroundColor Gray
                }
                
                $workingEndpoints += @{ path = $path; method = $method; status = "Working"; responseLength = $response.Content.Length }
            }
            
        } catch {
            $errorMsg = $_.Exception.Message
            if ($errorMsg -like "*404*") {
                Write-Host "❌ 404 Not Found" -ForegroundColor Red
            } elseif ($errorMsg -like "*405*") {
                Write-Host "❌ 405 Method Not Allowed" -ForegroundColor Red
            } elseif ($errorMsg -like "*timeout*") {
                Write-Host "⏰ Timeout" -ForegroundColor Yellow
            } else {
                Write-Host "❌ $($errorMsg.Substring(0, [Math]::Min(50, $errorMsg.Length)))..." -ForegroundColor Red
            }
        }
    }
    Write-Host ""
}

# Summary
Write-Host "Discovery Summary" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($workingEndpoints.Count -gt 0) {
    Write-Host "Working endpoints found:" -ForegroundColor Green
    
    foreach ($endpoint in $workingEndpoints) {
        $statusColor = if ($endpoint.status -eq "Query Endpoint") { "Green" } else { "Gray" }
        Write-Host "   $($endpoint.method) $($endpoint.path) - $($endpoint.status)" -ForegroundColor $statusColor
        if ($endpoint.responseLength) {
            Write-Host "      Response length: $($endpoint.responseLength) chars" -ForegroundColor Gray
        }
    }
    
    # Find the best query endpoint
    $queryEndpoints = $workingEndpoints | Where-Object { $_.status -eq "Query Endpoint" }
    if ($queryEndpoints.Count -gt 0) {
        Write-Host ""
        Write-Host "🎯 Recommended Query Endpoint:" -ForegroundColor Green
        $bestEndpoint = $queryEndpoints | Sort-Object responseLength -Descending | Select-Object -First 1
        Write-Host "   $($bestEndpoint.method) $($bestEndpoint.path)" -ForegroundColor Green
        Write-Host "   Update QueryService.makeQuery() to use this endpoint" -ForegroundColor Gray
    }
    
} else {
    Write-Host "No working endpoints found" -ForegroundColor Red
    Write-Host "Check Lambda function configuration and routing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update QueryService with the working endpoint" -ForegroundColor Gray
Write-Host "   2. Test the quality management system" -ForegroundColor Gray
Write-Host "   3. Run validation tests" -ForegroundColor Gray
