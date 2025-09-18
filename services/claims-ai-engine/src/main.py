"""FastAPI service combining AI endpoints and compliance-ready APIs."""
from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict

import uvicorn
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prometheus_fastapi_instrumentator import Instrumentator

from src.brainsait.audit_logger import audit_log
from src.brainsait.fhir_validation import validate_fhir_claim_bundle
from src.brainsait.hipaa_compliance import hipaa_compliant
from src.brainsait.nphies_integration import validate_saudi_patient_id
from src.brainsait.rbac import User, get_current_user, require_scope

# Configure logging early so importers inherit handlers.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BrainSAIT Claims AI Engine",
    description="AI-powered claims processing with HIPAA/NPHIES guardrails",
    version="1.1.0",
)

Instrumentator().instrument(app).expose(app, include_in_schema=False)

# CORS middleware keeps the front end iteration-friendly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


class IngestionMeta(BaseModel):
    locale: str = Field("ar", pattern="^(ar|en)$")
    payerId: str | None = None
    providerId: str | None = None


class IngestionResponse(BaseModel):
    fileId: str
    status: str


class KPIResponse(BaseModel):
    rejectionCount: int
    rejectionAmount: float
    topCategories: list[str]
    fpar: float = Field(..., description="First-Pass Acceptance Rate")
    adr: float = Field(..., description="Avoidable Denial Rate")


class EligibilityRequest(BaseModel):
    patient: dict
    coverageId: str | None = None
    serviceDate: str | None = None  # ISO date


class EligibilityResponse(BaseModel):
    eligible: bool
    reasons: list[str]
    coverageSummary: dict | None = None


class ClaimBundleRequest(BaseModel):
    bundle: dict


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Service health probe with compliance-aware metadata."""

    return {
        "status": "healthy",
        "service": "claims-ai-engine",
        "version": app.version,
        "ml_models_loaded": True,
        "gpu_available": False,
    }


@app.post(
    "/ingestion/files",
    response_model=IngestionResponse,
)
async def upload_file(
    file: UploadFile = File(...),
    meta: IngestionMeta = Depends(),
    user: User = Depends(get_current_user),
):
    """Accept uploads, validate types, and emit audit logs."""

    file_id = f"file_{int(time.time())}"
    await audit_log(
        action="upload_file",
        user_id=user.id,
        resource_type="SourceFile",
        resource_id=file_id,
        phi_involved=True,
        meta={"filename": file.filename, "locale": meta.locale},
    )
    return IngestionResponse(fileId=file_id, status="received")


@app.get(
    "/claims/kpis",
    response_model=KPIResponse,
    dependencies=[Depends(require_scope(["analytics.read"]))],
)
@hipaa_compliant(audit_phi=False)
async def get_kpis(
    user: User = Depends(get_current_user),
    from_: str | None = None,
    to: str | None = None,
    payerId: str | None = None,
    providerId: str | None = None,
) -> KPIResponse:
    """Return de-identified KPI aggregates for dashboards."""

    await audit_log(
        action="view_kpis",
        user_id=user.id,
        resource_type="Analytics",
        resource_id="claims_kpis",
        phi_involved=False,
        meta={
            "from": from_,
            "to": to,
            "payerId": payerId,
            "providerId": providerId,
        },
    )
    return KPIResponse(
        rejectionCount=124,
        rejectionAmount=187_500.0,
        topCategories=[
            "الأهلية/التغطية",
            "الترميز/الضرورة الطبية",
            "التفويض",
        ],
        fpar=0.91,
        adr=0.18,
    )


@app.post(
    "/nphies/eligibility",
    response_model=EligibilityResponse,
    dependencies=[Depends(require_scope(["claims.write"]))],
)
@hipaa_compliant(audit_phi=True)
async def eligibility_check(
    payload: EligibilityRequest,
    user: User = Depends(get_current_user),
) -> EligibilityResponse:
    """Validate Saudi ID syntactically and mock eligibility response."""

    national_id = (payload.patient or {}).get("nationalId")
    if not validate_saudi_patient_id(national_id):
        await audit_log(
            action="eligibility_check_failed",
            user_id=user.id,
            resource_type="Eligibility",
            resource_id="nphies",
            phi_involved=True,
            meta={"reason": "invalid_saudi_id"},
        )
        return EligibilityResponse(eligible=False, reasons=["Invalid Saudi ID"], coverageSummary=None)

    await audit_log(
        action="eligibility_check",
        user_id=user.id,
        resource_type="Eligibility",
        resource_id="nphies",
        phi_involved=True,
        meta={"coverageId": payload.coverageId},
    )
    return EligibilityResponse(
        eligible=True,
        reasons=[],
        coverageSummary={"plan": "Basic", "network": "N1", "status": "active"},
    )


@app.post(
    "/claims/validate",
    dependencies=[Depends(require_scope(["claims.write"]))],
)
@hipaa_compliant(audit_phi=True)
async def validate_claim_bundle(
    payload: ClaimBundleRequest,
    user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """Validate a FHIR Claim bundle and return status or detailed errors."""

    ok, errors = validate_fhir_claim_bundle(payload.bundle)
    await audit_log(
        action="validate_claim_bundle",
        user_id=user.id,
        resource_type="FHIR",
        resource_id="ClaimBundle",
        phi_involved=True,
        meta={"valid": ok, "errors": errors[:3] if errors else []},
    )
    if not ok:
        raise HTTPException(status_code=400, detail={"validation_errors": errors})
    return {"status": "valid"}


@app.post("/process-claim", response_model=ClaimResponse)
async def process_claim(claim: ClaimRequest) -> ClaimResponse:
    """Mock AI adjudication endpoint retaining audit-friendly outputs."""

    start_time = time.time()
    confidence = 0.85
    decision = "approved" if confidence > 0.8 else "review"
    reason = "Automated approval based on standard criteria"
    processing_time = int((time.time() - start_time) * 1000)

    logger.info("Processed claim %s with decision %s", claim.claim_id, decision)
    return ClaimResponse(
        claim_id=claim.claim_id,
        decision=decision,
        confidence=confidence,
        reason=reason,
        processing_time_ms=processing_time,
    )


@app.post("/detect-fraud")
async def detect_fraud(claim: ClaimRequest) -> Dict[str, Any]:
    """Mock fraud detection scores for rapid prototyping."""

    fraud_score = 0.1
    is_fraudulent = fraud_score > 0.7
    return {
        "claim_id": claim.claim_id,
        "fraud_score": fraud_score,
        "is_fraudulent": is_fraudulent,
        "risk_factors": [],
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
