from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BrainSAIT Claims AI Engine",
    description="AI-powered claims processing for digital insurance platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ClaimRequest(BaseModel):
    claim_id: str
    patient_id: str
    provider_id: str
    diagnosis_codes: list[str]
    procedure_codes: list[str]
    amount: float
    claim_data: Dict[str, Any]

class ClaimResponse(BaseModel):
    claim_id: str
    decision: str  # "approved", "denied", "review"
    confidence: float
    reason: str
    processing_time_ms: int

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "claims-ai-engine",
        "version": "1.0.0",
        "ml_models_loaded": True,
        "gpu_available": False  # Free tier doesn't have GPU
    }

# Claims processing endpoint
@app.post("/process-claim", response_model=ClaimResponse)
async def process_claim(claim: ClaimRequest):
    try:
        import time
        start_time = time.time()
        
        # Simulate AI processing (replace with actual ML model)
        confidence = 0.85
        decision = "approved" if confidence > 0.8 else "review"
        reason = "Automated approval based on standard criteria"
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Processed claim {claim.claim_id} with decision: {decision}")
        
        return ClaimResponse(
            claim_id=claim.claim_id,
            decision=decision,
            confidence=confidence,
            reason=reason,
            processing_time_ms=processing_time
        )
    
    except Exception as e:
        logger.error(f"Error processing claim {claim.claim_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Fraud detection endpoint
@app.post("/detect-fraud")
async def detect_fraud(claim: ClaimRequest):
    try:
        # Simulate fraud detection
        fraud_score = 0.1  # Low fraud risk
        is_fraudulent = fraud_score > 0.7
        
        return {
            "claim_id": claim.claim_id,
            "fraud_score": fraud_score,
            "is_fraudulent": is_fraudulent,
            "risk_factors": []
        }
    
    except Exception as e:
        logger.error(f"Error in fraud detection for claim {claim.claim_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
