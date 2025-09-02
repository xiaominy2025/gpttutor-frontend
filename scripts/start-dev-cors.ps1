# PowerShell script to start Chrome with disabled web security for local development
# This allows the frontend to work with Lambda URLs that have CORS restrictions

Write-Host "🚀 Starting Chrome with disabled web security for local development..." -ForegroundColor Green
Write-Host "📋 This will allow localhost:5173 to access Lambda URLs without CORS issues" -ForegroundColor Yellow
Write-Host "⚠️  Only use this for development - never for production browsing!" -ForegroundColor Red

# Check if Chrome is installed
$chromePath = ""
$possiblePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        break
    }
}

if (-not $chromePath) {
    Write-Host "❌ Chrome not found in standard locations. Please install Chrome or update the path." -ForegroundColor Red
    exit 1
}

# Create a temporary user data directory
$tempDir = Join-Path $env:TEMP "chrome_dev_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "📁 Using temporary Chrome profile: $tempDir" -ForegroundColor Cyan

# Start Chrome with disabled web security
$arguments = @(
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor",
    "--user-data-dir=`"$tempDir`"",
    "--disable-site-isolation-trials",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection",
    "http://localhost:5173"
)

Write-Host "🔧 Starting Chrome with arguments: $($arguments -join ' ')" -ForegroundColor Cyan

try {
    Start-Process -FilePath $chromePath -ArgumentList $arguments
    Write-Host "✅ Chrome started successfully!" -ForegroundColor Green
    Write-Host "🌐 Navigate to http://localhost:5173 to test the application" -ForegroundColor Yellow
    Write-Host "💡 Remember to close this Chrome instance when done developing" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Failed to start Chrome: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
