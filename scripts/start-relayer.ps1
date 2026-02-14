# Start Blockchain Relayer
Write-Host "🔗 Starting Blockchain Relayer..." -ForegroundColor Cyan

# Check for required environment variables
if (-not $env:CONTRACT_ADDRESS) {
    Write-Host "❌ CONTRACT_ADDRESS environment variable is required" -ForegroundColor Red
    Write-Host "   Example: `$env:CONTRACT_ADDRESS='0x...'" -ForegroundColor Yellow
    exit 1
}

if (-not $env:PRIVATE_KEY) {
    Write-Host "❌ PRIVATE_KEY environment variable is required" -ForegroundColor Red
    Write-Host "   Example: `$env:PRIVATE_KEY='0x...'" -ForegroundColor Yellow
    exit 1
}

# Set defaults if not provided
if (-not $env:API_URL) { $env:API_URL = "http://localhost:8000/current" }
if (-not $env:RPC_URL) { $env:RPC_URL = "http://localhost:8545" }
if (-not $env:RELAY_INTERVAL) { $env:RELAY_INTERVAL = "30" }

Write-Host "📝 Configuration:" -ForegroundColor Green
Write-Host "   API URL: $env:API_URL"
Write-Host "   RPC URL: $env:RPC_URL"
Write-Host "   Contract: $env:CONTRACT_ADDRESS"
Write-Host "   Interval: $env:RELAY_INTERVAL seconds"
Write-Host ""

Set-Location "$PSScriptRoot\..\relayer"
go run main.go
