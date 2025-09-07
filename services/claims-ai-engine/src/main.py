"""
BrainSAIT Digital Insurance Platform - Claims AI Engine

AI-powered claims processing engine providing:
- Automated claims adjudication
- Prior authorization processing  
- Fraud detection and prevention
- Clinical decision support
- FHIR R4 integration with NPHIES standards

Compliance: HIPAA, NPHIES, PDPL, CCHI aligned
Standards: BrainSAIT Enterprise Architecture Framework
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import uvicorn
from datetime import datetime
import asyncio

from .services.claims_processor import ClaimsProcessor
from .services.fraud_detector import FraudDetector
from .services.prior_auth_engine import PriorAuthEngine
from .models.claim import Claim, ClaimStatus, ClaimDecision
from .utils.fhir_converter import FHIRConverter
from .utils.arabic_processor import ArabicProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NPHIES Pro Claims AI Engine",
    description="BrainSAIT Digital Insurance Platform - AI-powered claims processing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for multi-tenant access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize AI services
claims_processor = ClaimsProcessor()
fraud_detector = FraudDetector()
prior_auth_engine = PriorAuthEngine()
fhir_converter = FHIRConverter()
arabic_processor = ArabicProcessor()


class ClaimRequest(BaseModel):
    """Claims processing request model"""
    tenant_id: str = Field(..., description="Tenant identifier")
    claim_data: Dict[str, Any] = Field(..., description="FHIR-compliant claim data")
    patient_data: Optional[Dict[str, Any]] = None
    provider_data: Optional[Dict[str, Any]] = None
    priority: str = Field(default="normal", description="Processing priority: low, normal, high, urgent")
    language: str = Field(default="en", description="Processing language: en, ar")


class ClaimResponse(BaseModel):
    """Claims processing response model"""
    claim_id: str
    tenant_id: str
    status: ClaimStatus
    decision: ClaimDecision
    confidence_score: float
    processing_time_ms: int
    fraud_risk_score: float
    recommended_actions: List[str]
    arabic_summary: Optional[str] = None
    compliance_flags: List[str]


class PriorAuthRequest(BaseModel):
    """Prior authorization request model"""
    tenant_id: str
    procedure_codes: List[str]
    diagnosis_codes: List[str]
    patient_id: str
    provider_id: str
    urgency: str = Field(default="routine", description="routine, urgent, emergency")


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and extract tenant ID"""
    # In production, this would validate JWT and extract tenant
    # For now, return a mock tenant ID
    return "tenant_123"


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "claims-ai-engine",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "ai_models_loaded": claims_processor.is_ready()
    }


@app.post("/api/v1/claims/process", response_model=ClaimResponse)
async def process_claim(
    request: ClaimRequest,
    background_tasks: BackgroundTasks,
    tenant_id: str = Depends(verify_token)
):
    """
    Process insurance claim with AI-powered adjudication
    
    Features:
    - Automated decision making
    - Fraud detection
    - Compliance validation
    - Bilingual support (Arabic/English)
    """
    try:
        start_time = datetime.utcnow()
        
        # Validate and convert claim data to FHIR format
        fhir_claim = await fhir_converter.validate_claim(request.claim_data)
        
        # Process claim through AI engine
        result = await claims_processor.process_claim(
            fhir_claim, 
            tenant_id=tenant_id,
            priority=request.priority
        )
        
        # Run fraud detection
        fraud_score = await fraud_detector.analyze_claim(fhir_claim, tenant_id)
        
        # Generate Arabic summary if requested
        arabic_summary = None
        if request.language == "ar":
            arabic_summary = await arabic_processor.generate_summary(result)
        
        # Calculate processing time
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Background tasks for analytics and notifications
        background_tasks.add_task(
            log_claim_processing, 
            tenant_id, 
            result.claim_id, 
            processing_time
        )
        
        response = ClaimResponse(
            claim_id=result.claim_id,
            tenant_id=tenant_id,
            status=result.status,
            decision=result.decision,
            confidence_score=result.confidence_score,
            processing_time_ms=processing_time,
            fraud_risk_score=fraud_score,
            recommended_actions=result.recommended_actions,
            arabic_summary=arabic_summary,
            compliance_flags=result.compliance_flags
        )
        
        logger.info(f"✅ Claim processed: {result.claim_id} for tenant {tenant_id}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error processing claim: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Claim processing failed: {str(e)}")


@app.post("/api/v1/prior-auth/request")
async def request_prior_auth(
    request: PriorAuthRequest,
    tenant_id: str = Depends(verify_token)
):
    """
    Process prior authorization request with AI decision support
    """
    try:
        result = await prior_auth_engine.process_request(
            tenant_id=tenant_id,
            procedure_codes=request.procedure_codes,
            diagnosis_codes=request.diagnosis_codes,
            patient_id=request.patient_id,
            provider_id=request.provider_id,
            urgency=request.urgency
        )
        
        return {
            "request_id": result.request_id,
            "status": result.status,
            "decision": result.decision,
            "validity_period": result.validity_period,
            "conditions": result.conditions,
            "estimated_cost": result.estimated_cost
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing prior auth: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prior auth processing failed: {str(e)}")


@app.get("/api/v1/analytics/tenant/{tenant_id}/metrics")
async def get_tenant_metrics(tenant_id: str = Depends(verify_token)):
    """
    Get AI processing metrics for tenant dashboard
    """
    try:
        metrics = await claims_processor.get_metrics(tenant_id)
        fraud_metrics = await fraud_detector.get_metrics(tenant_id)
        
        return {
            "claims_processed_today": metrics.claims_today,
            "average_processing_time": metrics.avg_processing_time,
            "auto_approval_rate": metrics.auto_approval_rate,
            "fraud_detection_rate": fraud_metrics.detection_rate,
            "cost_savings": metrics.cost_savings,
            "ai_accuracy": metrics.accuracy_score
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Metrics retrieval failed: {str(e)}")


@app.post("/api/v1/ai/retrain")
async def retrain_models(
    background_tasks: BackgroundTasks,
    tenant_id: str = Depends(verify_token)
):
    """
    Trigger AI model retraining with tenant-specific data
    """
    try:
        # Start retraining in background
        background_tasks.add_task(claims_processor.retrain_models, tenant_id)
        
        return {
            "status": "retraining_started",
            "estimated_completion": "2-4 hours",
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        logger.error(f"❌ Error starting retraining: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


async def log_claim_processing(tenant_id: str, claim_id: str, processing_time: int):
    """Background task for logging and analytics"""
    logger.info(f"📊 Analytics: Claim {claim_id} processed in {processing_time}ms for tenant {tenant_id}")
    # In production, this would send to analytics pipeline


class ClaimsAIEngine:
    """Main application class for the Claims AI Engine"""
    
    def __init__(self):
        self.app = app
        self.host = "0.0.0.0"
        self.port = 8000
    
    def start(self, host: Optional[str] = None, port: Optional[int] = None):
        """Start the Claims AI Engine service"""
        host = host or self.host
        port = port or self.port
        
        logger.info(f"🚀 Starting Claims AI Engine on {host}:{port}")
        logger.info("🧠 BrainSAIT Digital Insurance Platform - AI Claims Processing")
        
        uvicorn.run(
            "src.main:app",
            host=host,
            port=port,
            reload=True,
            log_level="info"
        )


# Create application instance
engine = ClaimsAIEngine()

if __name__ == "__main__":
    engine.start()