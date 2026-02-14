# FUD-Fader Oracle 🚀

A real-time sentiment analysis oracle that autonomously executes "buy the dip" trades when FUD (Fear, Uncertainty, Doubt) reaches extreme levels.
We used the following dataset:
```
```
```
```
https://www.kaggle.com/datasets/gautamchettiar/bitcoin-sentiment-analysis-twitter-data
```
```
```
```
## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  DataStream │────▶│  FastAPI     │────▶│  Relayer    │────▶│  Blockchain  │
│   (Go)      │     │  (Python)    │     │   (Go)      │     │  (Hardhat)   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Frontend   │
                    │  (React/TS)  │
                    └──────────────┘
```

## Components

### 1. **DataStream** (Go)
- Streams CSV dataset to Python API
- High-concurrency data firehose
- Location: `DataStream/`

### 2. **ThePythonPart** (FastAPI)
- Sentiment analysis using VADER + HuggingFace
- REST API on port 8000
- CORS enabled for frontend
- Location: `ThePythonPart/`

### 3. **WalletConnect** (Hardhat)
- Solidity smart contract: `VibeOracle.sol`
- Deploy scripts and tests
- Location: `WalletConnect/`

### 4. **Relayer** (Go)
- Fetches sentiment from Python API
- Submits to blockchain contract
- Location: `relayer/`

### 5. **Frontend** (React + TypeScript)
- Real-time sentiment dashboard
- CSV failsafe mode
- Blockchain integration
- Location: Root directory (`src/`)

## Quick Start

### Prerequisites
- Python 3.8+ with `fastapi`, `uvicorn`, `vaderSentiment`, `transformers`
- Go 1.21+
- Node.js 18+ (for frontend)
- Hardhat (for contract deployment)

### Installation

1. **Install Python dependencies:**
```bash
cd ThePythonPart
pip install fastapi uvicorn vaderSentiment transformers torch
```

2. **Install Go dependencies:**
```bash
cd DataStream
go mod download

cd ../relayer
go mod download
```

3. **Install Frontend dependencies:**
```bash
npm install
```

4. **Install Hardhat dependencies:**
```bash
cd WalletConnect
npm install
```

### Running the System

#### Option 1: Start All Services (Windows)
```powershell
.\scripts\start-all.ps1
```

#### Option 2: Start Individually

**1. Start Python FastAPI:**
```bash
cd ThePythonPart
python -m uvicorn main:app --reload --port 8000
```

**2. Start Go DataStream:**
```bash
cd DataStream
go run main.go
```

**3. Start Frontend:**
```bash
npm run dev
```

**4. Start Relayer (requires env vars):**
```powershell
$env:CONTRACT_ADDRESS="0xYourDeployedContractAddress"
$env:PRIVATE_KEY="0xYourPrivateKey"
$env:RPC_URL="http://localhost:8545"  # or Sepolia RPC
.\scripts\start-relayer.ps1
```

### Deploy Contract

```bash
cd WalletConnect

# Local network
npm run deploy

# Sepolia testnet
npm run deploy:sepolia
```

## API Endpoints

### FastAPI (Port 8000)

- `GET /` - Health check
- `POST /analyze` - Analyze sentiment
  ```json
  {
    "username": "user123",
    "text": "Bitcoin is going to the moon!"
  }
  ```
- `GET /current` - Get latest sentiment score
- `GET /latest?limit=10` - Get latest N scores

## Smart Contract

### VibeOracle Contract

**Functions:**
- `submitSentiment(string username, string text, int256 sentimentScore)` - Submit sentiment (-100 to 100)
- `updateVibeScore(uint8 newScore)` - Update vibe score (0-100) for frontend
- `getSentiment(uint256 id)` - Get sentiment by ID
- `getSentimentCount()` - Get total sentiment count
- `vibeScore()` - Get current vibe score (0-100)

**Events:**
- `SentimentSubmitted` - Emitted when sentiment is submitted
- `AutomatedBuyExecuted` - Emitted when FUD threshold is reached (score ≤ 20)

## Environment Variables

### Relayer
- `CONTRACT_ADDRESS` - Deployed contract address (required)
- `PRIVATE_KEY` - Private key for transactions (required)
- `RPC_URL` - Ethereum RPC URL (default: `http://localhost:8545`)
- `API_URL` - Python API URL (default: `http://localhost:8000/current`)
- `RELAY_INTERVAL` - Relay interval in seconds (default: `30`)

### Hardhat
- `SEPOLIA_URL` - Sepolia RPC URL
- `PRIVATE_KEY` - Deployer private key

## Project Structure

```
TechX/
├── DataStream/          # Go data firehose
│   ├── main.go
│   ├── go.mod
│   └── data/
│       └── dataset.csv
├── ThePythonPart/       # FastAPI sentiment service
│   └── main.py
├── WalletConnect/       # Hardhat contracts
│   ├── contracts/
│   │   └── VibeOracle.sol
│   ├── scripts/
│   │   └── deploy_hackathon.js
│   └── test/
├── relayer/             # Go blockchain relayer
│   ├── main.go
│   └── go.mod
├── scripts/             # Startup scripts
│   ├── start-all.ps1
│   ├── start-backend.ps1
│   └── start-relayer.ps1
├── src/                 # React frontend
│   ├── App.tsx
│   └── contractInteraction.ts
└── README.md
```

## Development

### Testing

**Contract Tests:**
```bash
cd WalletConnect
npm test
```

**Compile Contract:**
```bash
cd WalletConnect
npm run compile
```

## Troubleshooting

1. **Python API not starting:**
   - Check if port 8000 is available
   - Verify Python dependencies are installed

2. **Go DataStream errors:**
   - Ensure `data/dataset.csv` exists
   - Check Python API is running on port 8000

3. **Relayer not working:**
   - Verify contract is deployed
   - Check RPC URL is correct
   - Ensure private key has funds

4. **Frontend not connecting:**
   - Check browser console for errors
   - Verify contract address in `contractInteraction.ts`
   - Ensure MetaMask is connected

## License

ISC
