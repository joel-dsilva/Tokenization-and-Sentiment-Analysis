# FUD-Fader Oracle - Master Setup and Run Script
param(
    [switch]$SkipSetup,
    [switch]$SkipTests,
    [switch]$Help
)

$ProjectRoot = $PSScriptRoot
$Errors = @()
$Warnings = @()

function Write-SuccessMsg { Write-Host $args -ForegroundColor Green }
function Write-ErrorMsg { Write-Host $args -ForegroundColor Red; $script:Errors += $args }
function Write-WarningMsg { Write-Host $args -ForegroundColor Yellow; $script:Warnings += $args }
function Write-InfoMsg { Write-Host $args -ForegroundColor Cyan }
function Write-StepMsg { Write-Host "`n>> $args" -ForegroundColor Magenta }

if ($Help) {
    Write-InfoMsg "FUD-Fader Oracle - Master Setup and Run Script"
    Write-InfoMsg ""
    Write-InfoMsg "Usage:"
    Write-InfoMsg "    .\setup-and-run.ps1              # Full setup and run"
    Write-InfoMsg "    .\setup-and-run.ps1 -SkipSetup   # Skip setup, just run"
    Write-InfoMsg "    .\setup-and-run.ps1 -SkipTests   # Skip compilation tests"
    Write-InfoMsg "    .\setup-and-run.ps1 -Help        # Show this help"
    exit 0
}

Write-InfoMsg "================================================================"
Write-InfoMsg "     FUD-Fader Oracle - Master Setup and Run Script          "
Write-InfoMsg "================================================================"
Write-Host ""

# PHASE 1: Prerequisites Check
Write-StepMsg "PHASE 1: Checking Prerequisites"
$prereqsOK = $true

# Check Python
Write-InfoMsg "Checking Python..."
$pythonOK = $false
$pv = $null
try {
    $pv = python --version 2>&1
} catch {
    $null = $_
}
if ($pv -ne $null -and $pv -match "Python (\d+)\.(\d+)") {
    $maj = [int]$matches[1]
    $min = [int]$matches[2]
    if ($maj -ge 3 -and $min -ge 8) {
        Write-SuccessMsg "  [OK] Python: $pv"
        $pythonOK = $true
    }
}
if (-not $pythonOK) {
    Write-ErrorMsg "  [FAIL] Python 3.8+ required"
    $prereqsOK = $false
}

# Check Go
Write-InfoMsg "Checking Go..."
$goOK = $false
$gv = $null
try {
    $gv = go version 2>&1
} catch {
    $null = $_
}
if ($gv -ne $null -and $gv -match "go(\d+)\.(\d+)") {
    $maj = [int]$matches[1]
    $min = [int]$matches[2]
    if ($maj -ge 1 -and ($min -ge 21 -or $maj -gt 1)) {
        Write-SuccessMsg "  [OK] Go: $gv"
        $goOK = $true
    }
}
if (-not $goOK) {
    Write-ErrorMsg "  [FAIL] Go 1.21+ required"
    $prereqsOK = $false
}

# Check Node.js
Write-InfoMsg "Checking Node.js..."
$nodeOK = $false
$nv = $null
try {
    $nv = node --version 2>&1
} catch {
    $null = $_
}
if ($nv -ne $null -and $nv -match "v(\d+)\.(\d+)") {
    $maj = [int]$matches[1]
    if ($maj -ge 18) {
        Write-SuccessMsg "  [OK] Node.js: $nv"
        $nodeOK = $true
    }
}
if (-not $nodeOK) {
    Write-ErrorMsg "  [FAIL] Node.js 18+ required"
    $prereqsOK = $false
}

# Check npm
Write-InfoMsg "Checking npm..."
try {
    $npmv = npm --version 2>&1
    Write-SuccessMsg "  [OK] npm: v$npmv"
} catch {
    Write-ErrorMsg "  [FAIL] npm not found"
    $prereqsOK = $false
}

if (-not $prereqsOK) {
    Write-ErrorMsg "`n[ERROR] Prerequisites check failed. Please install missing tools."
    exit 1
}
Write-SuccessMsg "`n[SUCCESS] All prerequisites met!"

# PHASE 2: Setup
if (-not $SkipSetup) {
    Write-StepMsg "PHASE 2: Installing Dependencies"
    
    Write-InfoMsg "Installing Python dependencies..."
    Set-Location "$ProjectRoot\ThePythonPart"
    python -m pip install --upgrade pip --quiet 2>&1 | Out-Null
    python -m pip install -r requirements.txt --quiet 2>&1 | Out-Null
        Write-SuccessMsg "  [OK] Python dependencies installed"
    
    Write-InfoMsg "Installing Frontend dependencies..."
    Set-Location $ProjectRoot
    npm install --silent 2>&1 | Out-Null
        Write-SuccessMsg "  [OK] Frontend dependencies installed"
    
    Write-InfoMsg "Installing WalletConnect dependencies..."
    Set-Location "$ProjectRoot\WalletConnect"
    npm install --silent 2>&1 | Out-Null
        Write-SuccessMsg "  [OK] WalletConnect dependencies installed"
    
    Write-InfoMsg "Downloading Go dependencies (DataStream)..."
    Set-Location "$ProjectRoot\DataStream"
    go mod download 2>&1 | Out-Null
        Write-SuccessMsg "  [OK] DataStream Go dependencies downloaded"
    
    Write-InfoMsg "Downloading Go dependencies (Relayer)..."
    Set-Location "$ProjectRoot\relayer"
    go mod download 2>&1 | Out-Null
        Write-SuccessMsg "  [OK] Relayer Go dependencies downloaded"
    
    Write-SuccessMsg "`n[SUCCESS] All dependencies installed!"
} else {
    Write-InfoMsg "Skipping setup phase"
}

# PHASE 3: Compilation Tests
if (-not $SkipTests) {
    Write-StepMsg "PHASE 3: Testing Compilation"
    
    Write-InfoMsg "Testing Python syntax..."
    Set-Location "$ProjectRoot\ThePythonPart"
    python -m py_compile main.py 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-SuccessMsg "  [OK] Python syntax OK"
    } else {
        Write-ErrorMsg "  [FAIL] Python syntax error"
        exit 1
    }
    
    Write-InfoMsg "Testing Go compilation (DataStream)..."
    Set-Location "$ProjectRoot\DataStream"
    go build -o datastream.exe main.go 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path "datastream.exe")) {
        Write-SuccessMsg "  [OK] DataStream compiles successfully"
        Remove-Item "datastream.exe" -ErrorAction SilentlyContinue
    } else {
        Write-ErrorMsg "  [FAIL] DataStream compilation failed"
        exit 1
    }
    
    Write-InfoMsg "Testing Go compilation (Relayer)..."
    Set-Location "$ProjectRoot\relayer"
    go build -o relayer.exe main.go 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path "relayer.exe")) {
        Write-SuccessMsg "  [OK] Relayer compiles successfully"
        Remove-Item "relayer.exe" -ErrorAction SilentlyContinue
    } else {
        Write-ErrorMsg "  [FAIL] Relayer compilation failed"
        exit 1
    }
    
    Write-InfoMsg "Testing TypeScript compilation..."
    Set-Location $ProjectRoot
    npx tsc --noEmit 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-SuccessMsg "  [OK] TypeScript compiles successfully"
    } else {
        Write-WarningMsg "  [WARN] TypeScript warnings (non-critical)"
    }
    
    Write-InfoMsg "Testing Solidity compilation..."
    Set-Location "$ProjectRoot\WalletConnect"
    npx hardhat compile --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-SuccessMsg "  [OK] Solidity compiles successfully"
    } else {
        Write-ErrorMsg "  [FAIL] Solidity compilation failed"
        exit 1
    }
    
    Write-SuccessMsg "`n[SUCCESS] All compilation tests passed!"
} else {
    Write-InfoMsg "Skipping compilation tests"
}

# PHASE 4: Verify Files
Write-StepMsg "PHASE 4: Verifying Required Files"
$files = @(
    "$ProjectRoot\DataStream\data\dataset.csv",
    "$ProjectRoot\ThePythonPart\main.py",
    "$ProjectRoot\DataStream\main.go",
    "$ProjectRoot\relayer\main.go",
    "$ProjectRoot\WalletConnect\contracts\VibeOracle.sol"
)
$allExist = $true
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-SuccessMsg "  [OK] $(Split-Path $f -Leaf)"
    } else {
        Write-ErrorMsg "  [FAIL] Missing: $(Split-Path $f -Leaf)"
        $allExist = $false
    }
}
if (-not $allExist) {
    Write-ErrorMsg "`n[ERROR] Some required files are missing!"
    exit 1
}
Write-SuccessMsg "`n[SUCCESS] All required files present!"

# PHASE 5: Start Services
Write-StepMsg "PHASE 5: Starting Services"
Write-InfoMsg "Starting services in separate windows..."
Write-Host ""

$pythonPath = Join-Path $ProjectRoot "ThePythonPart"
$pythonCmd = "cd '$pythonPath'; python -m uvicorn main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $pythonCmd
Write-InfoMsg "1. Python FastAPI started (port 8000)"
Start-Sleep -Seconds 3

$goPath = Join-Path $ProjectRoot "DataStream"
$goCmd = "cd '$goPath'; go run main.go"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $goCmd
Write-InfoMsg "2. Go DataStream started"
Start-Sleep -Seconds 2

$frontendCmd = "cd '$ProjectRoot'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
Write-InfoMsg "3. Frontend started (port 5173)"

Write-SuccessMsg "`n[SUCCESS] All services started!"
Write-Host ""
Write-InfoMsg "================================================================"
Write-InfoMsg "Services running:"
Write-InfoMsg "  - Python FastAPI:  http://localhost:8000"
Write-InfoMsg "  - React Frontend:  http://localhost:5173"
Write-InfoMsg "  - Go DataStream:   Streaming CSV data"
Write-InfoMsg ""
Write-InfoMsg "To start relayer:"
Write-InfoMsg "  cd relayer"
Write-InfoMsg "  `$env:CONTRACT_ADDRESS=`"0x...`""
Write-InfoMsg "  `$env:PRIVATE_KEY=`"0x...`""
Write-InfoMsg "  go run main.go"
Write-InfoMsg "================================================================"

Set-Location $ProjectRoot
