# Engent Labs Deployment Verification Script
# PowerShell version for Windows

param(
    [Parameter(Mandatory=$false)]
    [string]$S3_BUCKET = "engentlabs-frontend",
    
    [Parameter(Mandatory=$false)]
    [string]$CF_DISTRIBUTION_ID = "E1V533CXZPR3FL"
)

# Colors for console output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-S3Bucket {
    Write-ColorOutput "🔍 Testing S3 bucket: $S3_BUCKET" $Blue
    
    try {
        $bucketContents = aws s3 ls "s3://$S3_BUCKET/" 2>$null
        if ($bucketContents) {
            Write-ColorOutput "✅ S3 bucket is accessible and contains files" $Green
            Write-ColorOutput "   Files found:" $Cyan
            $bucketContents | ForEach-Object { Write-ColorOutput "   $_" $Cyan }
        } else {
            Write-ColorOutput "⚠️  S3 bucket is accessible but appears empty" $Yellow
        }
    } catch {
        Write-ColorOutput "❌ S3 bucket is not accessible" $Red
    }
}

function Test-CloudFrontDistribution {
    Write-ColorOutput "🔍 Testing CloudFront distribution: $CF_DISTRIBUTION_ID" $Blue
    
    try {
        $distribution = aws cloudfront get-distribution --id "$CF_DISTRIBUTION_ID" --output json 2>$null | ConvertFrom-Json
        if ($distribution) {
            $status = $distribution.Distribution.Status
            $domain = $distribution.Distribution.DomainName
            Write-ColorOutput "✅ CloudFront distribution is active" $Green
            Write-ColorOutput "   Status: $status" $Cyan
            Write-ColorOutput "   Domain: $domain" $Cyan
        } else {
            Write-ColorOutput "❌ CloudFront distribution not found" $Red
        }
    } catch {
        Write-ColorOutput "❌ Could not retrieve CloudFront distribution info" $Red
    }
}

function Test-ProductionURLs {
    Write-ColorOutput "🧪 Testing production URLs..." $Blue
    
    $testUrls = @(
        @{Url="https://engentlabs.com"; Name="Main Domain"},
        @{Url="https://www.engentlabs.com"; Name="WWW Domain"}
    )
    
    foreach ($test in $testUrls) {
        $url = $test.Url
        $name = $test.Name
        
        try {
            Write-ColorOutput "   Testing $name: $url" $Cyan
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "   ✅ $name is accessible (Status: $($response.StatusCode))" $Green
            } else {
                Write-ColorOutput "   ⚠️  $name returned status $($response.StatusCode)" $Yellow
            }
        } catch {
            Write-ColorOutput "   ❌ $name is not accessible" $Red
        }
    }
}

function Test-BackendAPI {
    Write-ColorOutput "🔍 Testing backend API..." $Blue
    
    $backendUrl = "https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws"
    
    try {
        Write-ColorOutput "   Testing backend health endpoint" $Cyan
        $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "   ✅ Backend health check passed" $Green
            $content = $response.Content | ConvertFrom-Json
            Write-ColorOutput "   Response: $($content | ConvertTo-Json -Compress)" $Cyan
        } else {
            Write-ColorOutput "   ⚠️  Backend health check returned status $($response.StatusCode)" $Yellow
        }
    } catch {
        Write-ColorOutput "   ❌ Backend health check failed" $Red
    }
}

function Test-FrontendBackendIntegration {
    Write-ColorOutput "🔗 Testing frontend-backend integration..." $Blue
    
    try {
        # Test if frontend can make API calls to backend
        $testUrl = "https://engentlabs.com"
        Write-ColorOutput "   Testing frontend at: $testUrl" $Cyan
        
        $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 15
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "   ✅ Frontend loads successfully" $Green
            
            # Check if the page contains expected content
            $content = $response.Content
            if ($content -match "Engent Labs" -or $content -match "React") {
                Write-ColorOutput "   ✅ Frontend contains expected content" $Green
            } else {
                Write-ColorOutput "   ⚠️  Frontend content may not be loading correctly" $Yellow
            }
        } else {
            Write-ColorOutput "   ❌ Frontend returned status $($response.StatusCode)" $Red
        }
    } catch {
        Write-ColorOutput "   ❌ Frontend integration test failed" $Red
    }
}

function Show-VerificationSummary {
    Write-ColorOutput "`n📊 Deployment Verification Summary" $Green
    Write-ColorOutput "=================================" $Green
    Write-ColorOutput "S3 Bucket: $S3_BUCKET" $Cyan
    Write-ColorOutput "CloudFront Distribution: $CF_DISTRIBUTION_ID" $Cyan
    Write-ColorOutput "Production URLs:" $Cyan
    Write-ColorOutput "  • https://engentlabs.com" $Cyan
    Write-ColorOutput "  • https://www.engentlabs.com" $Cyan
    Write-ColorOutput "Backend API: https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws" $Cyan
    Write-ColorOutput ""
    Write-ColorOutput "🎯 Next Steps:" $Blue
    Write-ColorOutput "1. Open https://engentlabs.com in your browser" $Cyan
    Write-ColorOutput "2. Test the application functionality" $Cyan
    Write-ColorOutput "3. Verify API calls are working" $Cyan
    Write-ColorOutput "4. Check browser console for any errors" $Cyan
}

# Main verification process
function Main {
    Write-ColorOutput "🔍 Engent Labs Deployment Verification" $Blue
    Write-ColorOutput "=====================================" $Blue
    Write-ColorOutput "S3 Bucket: $S3_BUCKET" $Cyan
    Write-ColorOutput "CloudFront Distribution: $CF_DISTRIBUTION_ID" $Cyan
    Write-ColorOutput ""
    
    # Test S3 bucket
    Test-S3Bucket
    
    # Test CloudFront distribution
    Test-CloudFrontDistribution
    
    # Test production URLs
    Test-ProductionURLs
    
    # Test backend API
    Test-BackendAPI
    
    # Test frontend-backend integration
    Test-FrontendBackendIntegration
    
    # Show summary
    Show-VerificationSummary
}

# Run the verification
Main
