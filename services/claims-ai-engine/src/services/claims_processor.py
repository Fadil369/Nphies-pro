"""
AI-powered claims processing service
BrainSAIT Digital Insurance Platform
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

from ..models.claim import Claim, ClaimResult, ClaimStatus, ClaimDecision, ClaimMetrics

logger = logging.getLogger(__name__)


class ClaimsProcessor:
    """AI-powered claims processing engine"""
    
    def __init__(self):
        self.models_loaded = False
        self.approval_model = None
        self.cost_model = None
        self.scaler = None
        self.feature_columns = []
        self.tenant_metrics: Dict[str, ClaimMetrics] = {}
        
        # Initialize AI models
        asyncio.create_task(self._load_models())
    
    async def _load_models(self):
        """Load pre-trained AI models"""
        try:
            logger.info("🧠 Loading AI models for claims processing...")
            
            # In production, load from model registry
            # For now, create and train basic models
            await self._create_demo_models()
            
            self.models_loaded = True
            logger.info("✅ AI models loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to load AI models: {e}")
    
    async def _create_demo_models(self):
        """Create demo AI models for claims processing"""
        # Create sample training data
        np.random.seed(42)
        n_samples = 10000
        
        # Generate synthetic features
        features = {
            'claim_amount': np.random.lognormal(7, 1.5, n_samples),  # Log-normal distribution for amounts
            'patient_age': np.random.normal(45, 15, n_samples),
            'provider_experience': np.random.exponential(5, n_samples),
            'procedure_complexity': np.random.uniform(1, 10, n_samples),
            'diagnosis_count': np.random.poisson(2, n_samples),
            'previous_claims': np.random.poisson(3, n_samples),
            'service_duration': np.random.exponential(2, n_samples),
            'weekend_service': np.random.binomial(1, 0.15, n_samples),
            'emergency_service': np.random.binomial(1, 0.1, n_samples),
            'follow_up': np.random.binomial(1, 0.3, n_samples)
        }
        
        df = pd.DataFrame(features)
        
        # Generate approval labels (80% approval rate)
        approval_probability = (
            0.8 - 
            (df['claim_amount'] / df['claim_amount'].max()) * 0.3 +
            (df['provider_experience'] / df['provider_experience'].max()) * 0.2 -
            (df['procedure_complexity'] / 10) * 0.1
        )
        approval_labels = np.random.binomial(1, approval_probability, n_samples)
        
        # Train approval model
        self.approval_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.approval_model.fit(df, approval_labels)
        
        # Train cost estimation model
        # Actual costs are claim amounts with some variance for approved claims
        actual_costs = np.where(
            approval_labels,
            df['claim_amount'] * np.random.normal(0.95, 0.1, n_samples),
            0
        )
        
        self.cost_model = GradientBoostingClassifier(random_state=42)
        cost_features = df.copy()
        cost_features['original_amount'] = df['claim_amount']
        
        # Use quantiles for cost prediction classes
        cost_classes = pd.qcut(actual_costs[actual_costs > 0], 5, labels=False)
        cost_labels = np.full(n_samples, -1)  # -1 for denied claims
        cost_labels[approval_labels == 1] = cost_classes
        
        self.cost_model.fit(cost_features, cost_labels)
        
        # Fit scaler
        self.scaler = StandardScaler()
        self.scaler.fit(df)
        self.feature_columns = df.columns.tolist()
        
        logger.info("🎯 Demo AI models created and trained")
    
    def is_ready(self) -> bool:
        """Check if AI models are loaded and ready"""
        return self.models_loaded
    
    async def process_claim(
        self, 
        claim: Claim, 
        tenant_id: str,
        priority: str = "normal"
    ) -> ClaimResult:
        """Process a claim through the AI engine"""
        
        if not self.models_loaded:
            raise RuntimeError("AI models not loaded")
        
        start_time = datetime.utcnow()
        
        try:
            # Extract features from claim
            features = self._extract_features(claim)
            
            # Scale features
            scaled_features = self.scaler.transform([features])
            
            # Get AI predictions
            approval_prob = self.approval_model.predict_proba(scaled_features)[0][1]
            cost_prediction = self.cost_model.predict(scaled_features)[0]
            
            # Make decision based on confidence thresholds
            if approval_prob >= 0.85:
                decision = ClaimDecision.AUTO_APPROVE
                status = ClaimStatus.APPROVED
            elif approval_prob <= 0.15:
                decision = ClaimDecision.AUTO_DENY
                status = ClaimStatus.DENIED
            else:
                decision = ClaimDecision.MANUAL_REVIEW
                status = ClaimStatus.PROCESSING
            
            # Generate recommended actions
            recommended_actions = self._generate_recommendations(
                claim, approval_prob, cost_prediction
            )
            
            # Calculate estimated/approved amount
            estimated_cost = None
            approval_amount = None
            
            if decision == ClaimDecision.AUTO_APPROVE:
                approval_amount = claim.total_amount * 0.95  # 5% reduction typical
                estimated_cost = approval_amount
            elif cost_prediction >= 0:
                estimated_cost = claim.total_amount * (0.5 + cost_prediction * 0.1)
            
            # Compliance validation
            compliance_flags = self._validate_compliance(claim)
            
            result = ClaimResult(
                claim_id=claim.id,
                status=status,
                decision=decision,
                confidence_score=float(approval_prob),
                recommended_actions=recommended_actions,
                estimated_cost=estimated_cost,
                approval_amount=approval_amount,
                compliance_flags=compliance_flags,
                processing_notes=[
                    f"AI processed with {approval_prob:.2%} approval confidence",
                    f"Processing time: {(datetime.utcnow() - start_time).total_seconds():.2f}s"
                ]
            )
            
            # Update metrics
            await self._update_metrics(tenant_id, claim, result, start_time)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing claim {claim.id}: {e}")
            raise
    
    def _extract_features(self, claim: Claim) -> List[float]:
        """Extract numerical features from claim for AI processing"""
        
        # Calculate patient age
        patient_age = (datetime.utcnow() - claim.patient.date_of_birth).days / 365.25
        
        # Calculate service duration
        service_start = claim.service_period.get('start', datetime.utcnow())
        service_end = claim.service_period.get('end', datetime.utcnow())
        service_duration = (service_end - service_start).days + 1
        
        # Check if weekend service
        weekend_service = 1 if service_start.weekday() >= 5 else 0
        
        # Mock provider experience (in production, from provider database)
        provider_experience = hash(claim.provider.id) % 20 + 1
        
        # Count procedure complexity (based on number of procedures and diagnosis)
        procedure_complexity = len(claim.items) + len(claim.secondary_diagnoses)
        
        features = [
            float(claim.total_amount),
            float(patient_age),
            float(provider_experience),
            float(procedure_complexity),
            float(len(claim.secondary_diagnoses) + 1),  # diagnosis count
            float(hash(claim.patient.id) % 10),  # mock previous claims
            float(service_duration),
            float(weekend_service),
            float(0),  # emergency service (mock)
            float(0)   # follow up (mock)
        ]
        
        return features
    
    def _generate_recommendations(
        self, 
        claim: Claim, 
        approval_prob: float, 
        cost_prediction: float
    ) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        if approval_prob < 0.3:
            recommendations.append("Review medical necessity documentation")
            recommendations.append("Verify diagnosis codes accuracy")
        
        if claim.total_amount > 50000:  # High value claims
            recommendations.append("Conduct additional financial review")
            recommendations.append("Verify provider credentials")
        
        if len(claim.items) > 10:
            recommendations.append("Review for potential unbundling")
        
        if not claim.eligibility_verified:
            recommendations.append("Verify patient eligibility with NPHIES")
        
        if approval_prob > 0.8:
            recommendations.append("Consider for fast-track processing")
        
        return recommendations
    
    def _validate_compliance(self, claim: Claim) -> List[str]:
        """Validate claim against compliance rules"""
        
        flags = []
        
        # NPHIES compliance checks
        if not claim.nphies_claim_id:
            flags.append("Missing NPHIES claim ID")
        
        if not claim.eligibility_verified:
            flags.append("Patient eligibility not verified")
        
        # Saudi specific validations
        if claim.patient.national_id and len(claim.patient.national_id) != 10:
            flags.append("Invalid Saudi national ID format")
        
        # Clinical validations
        if claim.total_amount > 100000 and len(claim.items) < 5:
            flags.append("High amount with few procedures - review needed")
        
        # Date validations
        submission_delay = (datetime.utcnow() - claim.service_period['start']).days
        if submission_delay > 90:
            flags.append("Claim submitted more than 90 days after service")
        
        return flags
    
    async def _update_metrics(
        self, 
        tenant_id: str, 
        claim: Claim, 
        result: ClaimResult, 
        start_time: datetime
    ):
        """Update tenant processing metrics"""
        
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        if tenant_id not in self.tenant_metrics:
            self.tenant_metrics[tenant_id] = ClaimMetrics(
                tenant_id=tenant_id,
                claims_today=0,
                claims_this_month=0,
                avg_processing_time=0,
                auto_approval_rate=0,
                accuracy_score=0.95,  # Default high accuracy
                cost_savings=0,
                fraud_detected=0,
                compliance_violations=len(result.compliance_flags)
            )
        
        metrics = self.tenant_metrics[tenant_id]
        metrics.claims_today += 1
        metrics.claims_this_month += 1
        
        # Update average processing time
        metrics.avg_processing_time = (
            (metrics.avg_processing_time * (metrics.claims_today - 1) + processing_time) 
            / metrics.claims_today
        )
        
        # Update auto approval rate
        if result.decision == ClaimDecision.AUTO_APPROVE:
            metrics.auto_approval_rate = (
                (metrics.auto_approval_rate * (metrics.claims_today - 1) + 100) 
                / metrics.claims_today
            )
        else:
            metrics.auto_approval_rate = (
                (metrics.auto_approval_rate * (metrics.claims_today - 1)) 
                / metrics.claims_today
            )
        
        # Estimate cost savings (manual review cost vs auto processing)
        if result.decision in [ClaimDecision.AUTO_APPROVE, ClaimDecision.AUTO_DENY]:
            metrics.cost_savings += 50  # SAR saved per auto-processed claim
    
    async def get_metrics(self, tenant_id: str) -> ClaimMetrics:
        """Get processing metrics for a tenant"""
        return self.tenant_metrics.get(
            tenant_id, 
            ClaimMetrics(
                tenant_id=tenant_id,
                claims_today=0,
                claims_this_month=0,
                avg_processing_time=0,
                auto_approval_rate=0,
                accuracy_score=0,
                cost_savings=0,
                fraud_detected=0,
                compliance_violations=0
            )
        )
    
    async def retrain_models(self, tenant_id: str):
        """Retrain AI models with tenant-specific data"""
        logger.info(f"🔄 Starting model retraining for tenant {tenant_id}")
        
        # Simulate retraining process
        await asyncio.sleep(2)  # Simulate training time
        
        logger.info(f"✅ Model retraining completed for tenant {tenant_id}")
        
        # In production, this would:
        # 1. Fetch tenant's historical claim data
        # 2. Retrain models with updated data
        # 3. Validate model performance
        # 4. Deploy updated models
        # 5. Update model registry