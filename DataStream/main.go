package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode/utf8"
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
	fmt.Println("🔥 Starting FUD-Fader Data Firehose...")
	fmt.Println("📡 Connecting to FastAPI at http://localhost:8000/analyze")
	postChannel := make(chan SocialPost, 100)
	apiURL := "http://localhost:8000/analyze"
	go igniteFirehose("data/dataset.csv", postChannel)
	startBridge(postChannel, apiURL)
}

func igniteFirehose(filepath string, ch chan<- SocialPost) {
	file, err := os.Open(filepath)
	if err != nil {
		log.Fatalf(" Failed to open dataset: %v. Did you put it in the /data folder?", err)
	}
	defer file.Close()

	// Read entire file to strip BOM
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		log.Fatalf("❌ Failed to read file: %v", err)
	}

	// Strip UTF-8 BOM if present
	if len(fileBytes) >= 3 && fileBytes[0] == 0xEF && fileBytes[1] == 0xBB && fileBytes[2] == 0xBF {
		fileBytes = fileBytes[3:]
		log.Println("📝 Stripped UTF-8 BOM from CSV file")
	}

	reader := csv.NewReader(bytes.NewReader(fileBytes))
	reader.LazyQuotes = true
	reader.TrimLeadingSpace = true
	reader.FieldsPerRecord = -1 // Allow variable number of fields per record
	
	headers, err := reader.Read()
	if err != nil {
		log.Fatalf("❌ Failed to read header: %v", err)
	}
	
	// Clean headers: remove BOM and trim whitespace
	for i, header := range headers {
		// Remove any BOM characters
		header = strings.TrimLeft(header, "\ufeff")
		// Remove any non-printable characters
		cleaned := strings.Builder{}
		for _, r := range header {
			if utf8.ValidRune(r) && (r > 31 || r == 9) { // Keep printable chars and tabs
				cleaned.WriteRune(r)
			}
		}
		headers[i] = strings.TrimSpace(cleaned.String())
	}
	
	log.Printf("📊 CSV Headers: %v", headers)

	colMap := make(map[string]int)
	for i, headerName := range headers {
		colMap[strings.TrimSpace(headerName)] = i
	}

	rowCount := 0
	skippedCount := 0
	errorCount := 0
	for {
		record, err := reader.Read()
		if err != nil {
			if err == io.EOF {
				log.Printf("🏁 Reached end of dataset. Processed %d rows, skipped %d empty rows, %d errors.", rowCount, skippedCount, errorCount)
			} else {
				errorCount++
				// Log error but continue processing
				log.Printf("⚠️ Read error on line: %v (processed %d rows, skipped %d, errors %d)", err, rowCount, skippedCount, errorCount)
				// Continue instead of breaking to process remaining rows
				if errorCount > 100 {
					log.Printf("❌ Too many errors (%d), stopping processing", errorCount)
					break
				}
				continue
			}
			close(ch) // Close channel when done so the Bridge knows to stop
			break
		}
		
		// Skip empty rows
		if len(record) == 0 {
			skippedCount++
			continue
		}
		
		// Check if row is effectively empty
		allEmpty := true
		for _, field := range record {
			if strings.TrimSpace(field) != "" {
				allEmpty = false
				break
			}
		}
		if allEmpty {
			skippedCount++
			continue
		}
		
		rowCount++
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
			postText = strings.TrimSpace(record[idx])
		} else if idx, ok := colMap["text"]; ok && idx < len(record) {
			postText = strings.TrimSpace(record[idx])
		}
		
		// Skip if no text found
		if postText == "" {
			skippedCount++
			continue
		}

		post := SocialPost{
			Username:  username,
			Text:      postText,
			Timestamp: timestamp,
		}

		// Push to the channel (non-blocking check)
		select {
		case ch <- post:
			// Successfully sent
		default:
			// Channel full, log warning but continue
			log.Printf("⚠️ Channel full, dropping post from @%s", username)
		}

		delay := time.Duration(rand.Intn(50)+5) * time.Millisecond
		time.Sleep(delay)
	}
}

func startBridge(ch <-chan SocialPost, targetURL string) {
	// Create a reusable HTTP client with a strict timeout so hanging requests don't crash us
	client := &http.Client{
		Timeout: 10 * time.Second,
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
			log.Printf("⚠️ JSON Marshal error: %v", err)
			continue
		}

		// 3. Build the HTTP Request
		req, err := http.NewRequest("POST", targetURL, bytes.NewBuffer(jsonData))
		if err != nil {
			log.Printf("⚠️ Request creation error: %v", err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		// 4. Fire the Request with Error Handling & Resilience
		resp, err := client.Do(req)
		if err != nil {
			// If Flask is down, we log it and keep going. WE DO NOT CRASH.
			log.Printf("FastAPI unreachable (Owner B, wake up!): %v", err)
			
			// Tune the Flow Rate (Backoff if server is struggling)
			time.Sleep(500 * time.Millisecond) 
			continue
		}
		
		// Optional: Truncate text for cleaner console logs
		previewText := cleanedText
		if len(previewText) > 20 {
			previewText = previewText[:20] + "..."
		}
		
		fmt.Printf("✅ [@%s] %s | Status: %s | Score: Processing...\n", payload.Username, previewText, resp.Status)
		resp.Body.Close()
	}
	
	fmt.Println("Firehose shutdown complete.")
}