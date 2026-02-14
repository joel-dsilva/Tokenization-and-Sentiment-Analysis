# Start Backend Services (Go DataStream + Python FastAPI)
Write-Host "🚀 Starting Backend Services..." -ForegroundColor Cyan

# Start Python FastAPI in background
Write-Host "📦 Starting Python FastAPI on port 8000..." -ForegroundColor Yellow
$pythonProcess = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--reload", "--port", "8000" -WorkingDirectory "$PSScriptRoot\..\ThePythonPart" -PassThru -NoNewWindow

# Wait a bit for Python to start
Start-Sleep -Seconds 3

# Start Go DataStream
Write-Host "🔥 Starting Go DataStream..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\DataStream"
go run main.go

# Cleanup on exit
Write-Host "`n🛑 Stopping services..." -ForegroundColor Red
Stop-Process -Id $pythonProcess.Id -ErrorAction SilentlyContinue
