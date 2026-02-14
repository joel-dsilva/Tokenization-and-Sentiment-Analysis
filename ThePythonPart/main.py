
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline
import numpy as np
from typing import List, Optional
from datetime import datetime

# ----------------------------
# Initialize Sentiment Models
# ----------------------------

print("🔄 Initializing VADER sentiment analyzer...")
vader = SentimentIntensityAnalyzer()
print("✅ VADER initialized!")

print("🔄 Loading HuggingFace sentiment model (this may take 30-60 seconds)...")
print("   This is a one-time load. Please wait...")
hf_pipeline = pipeline("sentiment-analysis")
print("✅ HuggingFace model loaded and ready!")

# ----------------------------
# Sentiment Logic
# ----------------------------

def vader_score(text):
    score = vader.polarity_scores(text)
    return score["compound"]  # -1 to 1

def hf_score(text):
    result = hf_pipeline(text[:512])[0]
    label = result["label"]
    confidence = result["score"]

    if label == "POSITIVE":
        return confidence
    else:
        return -confidence

def combined_sentiment(text):
    v_score = vader_score(text)
    h_score = hf_score(text)

    final_score = (0.4 * v_score) + (0.6 * h_score)

    return {
        "vader_score": round(v_score, 4),
        "huggingface_score": round(h_score, 4),
        "community_vibe_score": round(final_score, 4)
    }

# ----------------------------
# FastAPI App
# ----------------------------

app = FastAPI(title="Tokenized Sentiment Oracle")

@app.on_event("startup")
async def startup_event():
    """Called when the application starts"""
    print("✅ FastAPI application started!")
    print("✅ All models are loaded and ready to analyze sentiment!")
    print("📡 API is available at http://localhost:8000")

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store latest scores for frontend
latest_scores: List[dict] = []
MAX_HISTORY = 100

class TextInput(BaseModel):
    username: str
    text: str

@app.get("/")
def home():
    return {"message": "Sentiment Oracle Backend Running 🚀"}

@app.post("/analyze")
def analyze_sentiment(data: TextInput):
    result = combined_sentiment(data.text)

    final_score = result["community_vibe_score"]
    oracle_score = int(((final_score + 1) / 2) * 100)

    response_data = {
        "username": data.username,
        "text_preview": data.text[:40],
        "vader_score": result["vader_score"],
        "huggingface_score": result["huggingface_score"],
        "community_vibe_score": final_score,
        "oracle_score": oracle_score,
        "timestamp": datetime.now().isoformat()
    }
    
    # Store in history
    latest_scores.append(response_data)
    if len(latest_scores) > MAX_HISTORY:
        latest_scores.pop(0)
    
    return response_data

@app.get("/latest")
def get_latest_scores(limit: Optional[int] = 10):
    """Get latest sentiment scores for frontend"""
    return {
        "scores": latest_scores[-limit:] if limit else latest_scores,
        "count": len(latest_scores),
        "latest_oracle_score": latest_scores[-1]["oracle_score"] if latest_scores else 50
    }

@app.get("/current")
def get_current_score():
    """Get the most recent oracle score (0-100)"""
    if not latest_scores:
        return {"oracle_score": 50, "status": "no_data"}
    return {
        "oracle_score": latest_scores[-1]["oracle_score"],
        "community_vibe_score": latest_scores[-1]["community_vibe_score"],
        "timestamp": latest_scores[-1]["timestamp"]
    }
