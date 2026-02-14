
from fastapi import FastAPI
from pydantic import BaseModel
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline
import numpy as np

# ----------------------------
# Initialize Sentiment Models
# ----------------------------

vader = SentimentIntensityAnalyzer()
hf_pipeline = pipeline("sentiment-analysis")

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

    return {
        "username": data.username,
        "text_preview": data.text[:40],
        "vader_score": result["vader_score"],
        "huggingface_score": result["huggingface_score"],
        "community_vibe_score": final_score,
        "oracle_score": oracle_score
    }
