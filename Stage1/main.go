package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"
)
type SocialPost struct {
	Username  string
	Text      string
	Timestamp string
}

type SentimentPayload struct {
	Username string `json:"username"`
	Text     string `json:"text"`
}

func main() {
	fmt.Println(" Starting FUD-Fader Data Firehose...")
	postChannel := make(chan SocialPost, 100)
	flaskURL := "http://localhost:5000/analyze"
	//flaskURL := "https://webhook.site/ad61d224-ef32-457e-ade5-cef5bcf730ac"
	go igniteFirehose("data/dataset.csv", postChannel)
	startBridge(postChannel, flaskURL)
}

func igniteFirehose(filepath string, ch chan<- SocialPost) {
	file, err := os.Open(filepath)
	if err != nil {
		log.Fatalf(" Failed to open dataset: %v. Did you put it in the /data folder?", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		log.Fatalf("❌ Failed to read header: %v", err)
	}

	colMap := make(map[string]int)
	for i, headerName := range headers {
		colMap[headerName] = i
	}

	for {
		record, err := reader.Read()
		if err != nil {
			log.Println(" Reached end of dataset or read error.")
			close(ch) // Close channel when done so the Bridge knows to stop
			break
		}
		username := ""
		if idx, ok := colMap["user_name"]; ok && idx < len(record) {
			username = record[idx]
		}

		timestamp := ""
		if idx, ok := colMap["date"]; ok && idx < len(record) {
			timestamp = record[idx]
		}
		postText := ""
		if idx, ok := colMap["cleanText"]; ok && idx < len(record) {
			postText = record[idx]
		} else if idx, ok := colMap["text"]; ok && idx < len(record) {
			postText = record[idx]
		}

		post := SocialPost{
			Username:  username,
			Text:      postText,
			Timestamp: timestamp,
		}

		// Push to the channel
		ch <- post

		delay := time.Duration(rand.Intn(100)+10) * time.Millisecond
		time.Sleep(delay)
	}
}

func startBridge(ch <-chan SocialPost, targetURL string) {
	// Create a reusable HTTP client with a strict timeout so hanging requests don't crash us
	client := &http.Client{
		Timeout: 2 * time.Second,
	}

	for post := range ch {
		// 1. Noise Reduction (Filtering)
		cleanedText := strings.TrimSpace(post.Text)
		if len(cleanedText) < 10 {
			// Skip garbage data (too short to have sentiment), save Owner B's compute power
			continue
		}

		// 2. Construct the Payload
		payload := SentimentPayload{
			Username: post.Username,
			Text:     cleanedText,
		}

		jsonData, err := json.Marshal(payload)
		if err != nil {
			log.Printf("JSON Marshal error: %v", err)
			continue
		}

		// 3. Build the HTTP Request
		req, err := http.NewRequest("POST", targetURL, bytes.NewBuffer(jsonData))
		if err != nil {
			log.Printf("Request creation error: %v", err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		// 4. Fire the Request with Error Handling & Resilience
		resp, err := client.Do(req)
		if err != nil {
			// If Flask is down, we log it and keep going. WE DO NOT CRASH.
			log.Printf("Flask API unreachable (Owner B, wake up!): %v", err)
			
			// Tune the Flow Rate (Backoff if server is struggling)
			time.Sleep(500 * time.Millisecond) 
			continue
		}
		
		// Optional: Truncate text for cleaner console logs
		previewText := cleanedText
		if len(previewText) > 20 {
			previewText = previewText[:20] + "..."
		}
		
		fmt.Printf("Sent POST to Flask: [@%s] %s | Status: %s\n", payload.Username, previewText, resp.Status)
		resp.Body.Close()
	}
	
	fmt.Println("Firehose shutdown complete.")
}