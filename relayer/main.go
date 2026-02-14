package main

import (
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Contract ABI (minimal - just what we need)
const contractABI = `[
	{
		"inputs": [
			{"internalType": "string", "name": "_username", "type": "string"},
			{"internalType": "string", "name": "_text", "type": "string"},
			{"internalType": "int256", "name": "_sentimentScore", "type": "int256"}
		],
		"name": "submitSentiment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]`

type SentimentResponse struct {
	OracleScore        int   `json:"oracle_score"`
	CommunityVibeScore float64 `json:"community_vibe_score"`
	Username           string `json:"username"`
	TextPreview        string `json:"text_preview"`
	Timestamp          string `json:"timestamp"`
}

func main() {
	fmt.Println("🚀 FUD-Fader Relayer Starting...")

	// Configuration from environment variables
	apiURL := getEnv("API_URL", "http://localhost:8000/current")
	rpcURL := getEnv("RPC_URL", "http://localhost:8545")
	contractAddress := getEnv("CONTRACT_ADDRESS", "")
	privateKeyHex := getEnv("PRIVATE_KEY", "")
	relayInterval := getEnv("RELAY_INTERVAL", "30") // seconds

	if contractAddress == "" {
		log.Fatal("❌ CONTRACT_ADDRESS environment variable is required")
	}
	if privateKeyHex == "" {
		log.Fatal("❌ PRIVATE_KEY environment variable is required")
	}

	// Parse private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		log.Fatalf("❌ Invalid private key: %v", err)
	}

	// Get public key and address
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("❌ Error casting public key to ECDSA")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	fmt.Printf("📝 Relayer Address: %s\n", fromAddress.Hex())

	// Connect to Ethereum node
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Ethereum node: %v", err)
	}
	defer client.Close()

	// Get chain ID
	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		log.Fatalf("❌ Failed to get chain ID: %v", err)
	}
	fmt.Printf("⛓️  Chain ID: %s\n", chainID.String())

	// Parse contract address
	contractAddr := common.HexToAddress(contractAddress)
	fmt.Printf("📄 Contract Address: %s\n", contractAddr.Hex())

	// Verify we can create a transactor (for future use)
	_, err = bind.NewKeyedTransactorWithChainID(privateKey, chainID)
	if err != nil {
		log.Fatalf("❌ Failed to create transactor: %v", err)
	}

	// Parse interval
	interval, err := time.ParseDuration(relayInterval + "s")
	if err != nil {
		log.Fatalf("❌ Invalid RELAY_INTERVAL: %v", err)
	}
	fmt.Printf("⏱️  Relay Interval: %v\n", interval)
	fmt.Println("✅ Relayer initialized. Starting relay loop...\n")

	// Main relay loop
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		// Fetch latest sentiment from API
		sentiment, err := fetchSentiment(apiURL)
		if err != nil {
			log.Printf("⚠️  Failed to fetch sentiment: %v", err)
			<-ticker.C
			continue
		}

		// Convert oracle_score (0-100) to sentimentScore (-100 to 100)
		sentimentScore := (sentiment.OracleScore * 2) - 100

		fmt.Printf("📊 Fetched Sentiment: Oracle Score=%d, Vibe=%.4f\n", sentiment.OracleScore, sentiment.CommunityVibeScore)
		fmt.Printf("🔄 Converting to on-chain format: %d (range: -100 to 100)\n", sentimentScore)

		// Submit to contract
		fmt.Printf("📤 Submitting to contract...\n")

		// Parse ABI
		parsedABI, err := abi.JSON(strings.NewReader(contractABI))
		if err != nil {
			log.Printf("⚠️  Failed to parse ABI: %v", err)
			<-ticker.C
			continue
		}

		// Encode function call
		data, err := parsedABI.Pack("submitSentiment", "relayer", sentiment.TextPreview, big.NewInt(int64(sentimentScore)))
		if err != nil {
			log.Printf("⚠️  Failed to encode function call: %v", err)
			<-ticker.C
			continue
		}

		// Get nonce
		nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
		if err != nil {
			log.Printf("⚠️  Failed to get nonce: %v", err)
			<-ticker.C
			continue
		}

		// Get gas price
		gasPrice, err := client.SuggestGasPrice(context.Background())
		if err != nil {
			log.Printf("⚠️  Failed to get gas price: %v", err)
			<-ticker.C
			continue
		}

		// Estimate gas
		gasLimit := uint64(200000) // Safe estimate for submitSentiment

		// Create transaction
		tx := types.NewTransaction(nonce, contractAddr, big.NewInt(0), gasLimit, gasPrice, data)

		// Sign transaction
		signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
		if err != nil {
			log.Printf("⚠️  Failed to sign transaction: %v", err)
			<-ticker.C
			continue
		}

		// Send transaction
		err = client.SendTransaction(context.Background(), signedTx)
		if err != nil {
			log.Printf("⚠️  Failed to send transaction: %v", err)
			<-ticker.C
			continue
		}

		fmt.Printf("✅ Transaction sent: %s\n", signedTx.Hash().Hex())
		fmt.Printf("   Username: 'relayer', Text: '%s', Score: %d\n", sentiment.TextPreview, sentimentScore)

		<-ticker.C
	}
}

func fetchSentiment(url string) (*SentimentResponse, error) {
	client := &http.Client{Timeout: 5 * time.Second}
	
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var sentiment SentimentResponse
	if err := json.NewDecoder(resp.Body).Decode(&sentiment); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &sentiment, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
