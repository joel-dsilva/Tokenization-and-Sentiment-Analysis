# Start All Services
Write-Host "🚀 FUD-Fader Oracle - Starting All Services" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Go is available
try {
    $goVersion = go version 2>&1
    Write-Host "✅ Go: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Go not found. Please install Go 1.21+" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Starting services in separate windows...`n" -ForegroundColor Yellow

# Start Python FastAPI
Write-Host "1️⃣  Starting Python FastAPI..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\ThePythonPart'; python -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 2

# Start Go DataStream
Write-Host "2️⃣  Starting Go DataStream..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\DataStream'; go run main.go"

Start-Sleep -Seconds 2

# Start Frontend (if npm is available)
Write-Host "3️⃣  Starting Frontend..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version 2>&1
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..'; npm run dev"
    Write-Host "   Frontend will be available at http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  npm not found. Frontend not started." -ForegroundColor Yellow
}

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "`n📝 To start the relayer separately, run:" -ForegroundColor Yellow
Write-Host "   .\scripts\start-relayer.ps1" -ForegroundColor White
Write-Host "`n   (Make sure to set CONTRACT_ADDRESS and PRIVATE_KEY env vars)" -ForegroundColor Gray
