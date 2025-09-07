"""
FHIR R4 converter and validation utilities
BrainSAIT Digital Insurance Platform
"""

from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from pydantic import ValidationError
import logging

from ..models.claim import Claim, Patient, Provider, ClaimItem, DiagnosisCode, ProcedureCode

logger = logging.getLogger(__name__)


class FHIRConverter:
    """
    FHIR R4 converter for healthcare data interoperability
    Handles conversion between various formats and FHIR resources
    """

    def __init__(self):
        self.fhir_version = "4.0.1"
        self.supported_resources = [
            "Patient", "Practitioner", "Organization", "Claim", 
            "Coverage", "CoverageEligibilityRequest", "CoverageEligibilityResponse"
        ]

    async def validate_claim(self, claim_data: Dict[str, Any]) -> Claim:
        """
        Validate incoming claim data and convert to FHIR-compliant format
        """
        try:
            # Check if already in FHIR format
            if self._is_fhir_format(claim_data):
                return await self._convert_fhir_to_claim(claim_data)
            
            # Check if HL7 v2 format
            elif self._is_hl7v2_format(claim_data):
                return await self._convert_hl7v2_to_claim(claim_data)
            
            # Check if SBS (Saudi Billing Standard) format
            elif self._is_sbs_format(claim_data):
                return await self._convert_sbs_to_claim(claim_data)
            
            # Assume custom format and try direct conversion
            else:
                return await self._convert_custom_to_claim(claim_data)
                
        except ValidationError as e:
            logger.error(f"Claim validation failed: {e}")
            raise ValueError(f"Invalid claim data: {e}")
        except Exception as e:
            logger.error(f"Claim conversion failed: {e}")
            raise ValueError(f"Claim conversion error: {e}")

    def _is_fhir_format(self, data: Dict[str, Any]) -> bool:
        """Check if data is in FHIR R4 format"""
        return (
            isinstance(data, dict) and 
            data.get("resourceType") == "Claim" and
            data.get("meta", {}).get("versionId") is not None
        )

    def _is_hl7v2_format(self, data: Dict[str, Any]) -> bool:
        """Check if data is in HL7 v2 format"""
        return (
            isinstance(data, dict) and
            "MSH" in data and
            "PID" in data and
            "DG1" in data
        )

    def _is_sbs_format(self, data: Dict[str, Any]) -> bool:
        """Check if data is in Saudi Billing Standard format"""
        return (
            isinstance(data, dict) and
            data.get("billing_standard") == "SBS" and
            "patient_info" in data and
            "provider_info" in data
        )

    async def _convert_fhir_to_claim(self, fhir_data: Dict[str, Any]) -> Claim:
        """Convert FHIR R4 Claim resource to internal Claim model"""
        
        # Extract patient information
        patient_reference = fhir_data.get("patient", {}).get("reference", "")
        patient_data = await self._resolve_patient_reference(patient_reference)
        
        patient = Patient(
            id=patient_data.get("id", ""),
            national_id=self._extract_national_id(patient_data),
            name=self._extract_patient_name(patient_data),
            arabic_name=self._extract_patient_name(patient_data, language="ar"),
            date_of_birth=datetime.fromisoformat(patient_data.get("birthDate", "1970-01-01")),
            gender=patient_data.get("gender", "unknown"),
            insurance_id=self._extract_insurance_id(patient_data)
        )

        # Extract provider information
        provider_reference = fhir_data.get("provider", {}).get("reference", "")
        provider_data = await self._resolve_provider_reference(provider_reference)
        
        provider = Provider(
            id=provider_data.get("id", ""),
            name=self._extract_provider_name(provider_data),
            arabic_name=self._extract_provider_name(provider_data, language="ar"),
            license_number=self._extract_license_number(provider_data),
            specialty=self._extract_specialty(provider_data),
            nphies_provider_id=self._extract_nphies_id(provider_data)
        )

        # Extract claim items
        items = []
        for i, item in enumerate(fhir_data.get("item", [])):
            claim_item = ClaimItem(
                sequence=item.get("sequence", i + 1),
                procedure_code=self._extract_procedure_code(item),
                diagnosis_codes=self._extract_diagnosis_codes(item),
                quantity=item.get("quantity", {}).get("value", 1),
                unit_price=float(item.get("unitPrice", {}).get("value", 0)),
                total_amount=float(item.get("net", {}).get("value", 0)),
                service_date=datetime.fromisoformat(
                    item.get("servicedDate", datetime.now().isoformat())
                )
            )
            items.append(claim_item)

        # Extract diagnoses
        primary_diagnosis = self._extract_primary_diagnosis(fhir_data)
        secondary_diagnoses = self._extract_secondary_diagnoses(fhir_data)

        # Create claim object
        claim = Claim(
            id=fhir_data.get("id", ""),
            tenant_id=self._extract_tenant_id(fhir_data),
            claim_number=fhir_data.get("identifier", [{}])[0].get("value", ""),
            patient=patient,
            provider=provider,
            total_amount=float(fhir_data.get("total", {}).get("value", 0)),
            items=items,
            primary_diagnosis=primary_diagnosis,
            secondary_diagnoses=secondary_diagnoses,
            service_period=self._extract_service_period(fhir_data),
            insurance_plan=self._extract_insurance_plan(fhir_data),
            policy_number=self._extract_policy_number(fhir_data),
            nphies_claim_id=fhir_data.get("id")
        )

        return claim

    async def _convert_hl7v2_to_claim(self, hl7_data: Dict[str, Any]) -> Claim:
        """Convert HL7 v2 message to internal Claim model"""
        
        # Extract patient from PID segment
        pid_segment = hl7_data.get("PID", {})
        patient = Patient(
            id=pid_segment.get("patient_id", ""),
            national_id=pid_segment.get("patient_identifier_list", [{}])[0].get("id", ""),
            name=self._format_hl7_name(pid_segment.get("patient_name", [])),
            date_of_birth=self._parse_hl7_date(pid_segment.get("date_time_of_birth")),
            gender=pid_segment.get("administrative_sex", "unknown").lower(),
            insurance_id=pid_segment.get("patient_account_number", "")
        )

        # Extract provider from PV1 segment
        pv1_segment = hl7_data.get("PV1", {})
        provider = Provider(
            id=pv1_segment.get("attending_doctor", [{}])[0].get("id_number", ""),
            name=self._format_hl7_name(pv1_segment.get("attending_doctor", [])),
            license_number="",  # Not typically in HL7 v2
            specialty="",
            nphies_provider_id=""
        )

        # Extract diagnoses from DG1 segments
        diagnoses = []
        for dg1 in hl7_data.get("DG1", []):
            diagnosis = DiagnosisCode(
                code=dg1.get("diagnosis_code_dg1", {}).get("identifier", ""),
                system="ICD-10",  # Assume ICD-10
                display=dg1.get("diagnosis_description", "")
            )
            diagnoses.append(diagnosis)

        primary_diagnosis = diagnoses[0] if diagnoses else DiagnosisCode(
            code="Z00.00", system="ICD-10", display="Encounter for general examination"
        )
        
        # Create basic claim structure
        claim = Claim(
            id=hl7_data.get("MSH", {}).get("message_control_id", ""),
            tenant_id="default",  # Will be set by calling service
            claim_number=f"HL7-{hl7_data.get('MSH', {}).get('message_control_id', '')}",
            patient=patient,
            provider=provider,
            total_amount=0.0,  # Will be calculated from items
            items=[],  # Will be populated from procedure codes
            primary_diagnosis=primary_diagnosis,
            secondary_diagnoses=diagnoses[1:],
            service_period={
                "start": datetime.now(),
                "end": datetime.now()
            },
            insurance_plan="default",
            policy_number=""
        )

        return claim

    async def _convert_sbs_to_claim(self, sbs_data: Dict[str, Any]) -> Claim:
        """Convert Saudi Billing Standard format to internal Claim model"""
        
        patient_info = sbs_data.get("patient_info", {})
        patient = Patient(
            id=patient_info.get("patient_id", ""),
            national_id=patient_info.get("national_id", ""),
            name=patient_info.get("name_en", ""),
            arabic_name=patient_info.get("name_ar", ""),
            date_of_birth=datetime.fromisoformat(patient_info.get("date_of_birth", "1970-01-01")),
            gender=patient_info.get("gender", "unknown"),
            insurance_id=patient_info.get("insurance_number", "")
        )

        provider_info = sbs_data.get("provider_info", {})
        provider = Provider(
            id=provider_info.get("provider_id", ""),
            name=provider_info.get("name_en", ""),
            arabic_name=provider_info.get("name_ar", ""),
            license_number=provider_info.get("license_number", ""),
            specialty=provider_info.get("specialty", ""),
            nphies_provider_id=provider_info.get("nphies_id", "")
        )

        # Convert SBS items to claim items
        items = []
        for sbs_item in sbs_data.get("billing_items", []):
            item = ClaimItem(
                sequence=sbs_item.get("line_number", 1),
                procedure_code=ProcedureCode(
                    code=sbs_item.get("procedure_code", ""),
                    system="SBS",
                    display=sbs_item.get("procedure_description", ""),
                    arabic_display=sbs_item.get("procedure_description_ar", ""),
                    cost=float(sbs_item.get("unit_price", 0))
                ),
                diagnosis_codes=[],  # Will be populated from diagnosis section
                quantity=int(sbs_item.get("quantity", 1)),
                unit_price=float(sbs_item.get("unit_price", 0)),
                total_amount=float(sbs_item.get("total_amount", 0)),
                service_date=datetime.fromisoformat(sbs_item.get("service_date", datetime.now().isoformat()))
            )
            items.append(item)

        # Extract diagnoses
        primary_diagnosis = DiagnosisCode(
            code=sbs_data.get("primary_diagnosis", {}).get("code", ""),
            system="ICD-10",
            display=sbs_data.get("primary_diagnosis", {}).get("description", ""),
            arabic_display=sbs_data.get("primary_diagnosis", {}).get("description_ar", "")
        )

        claim = Claim(
            id=sbs_data.get("claim_id", ""),
            tenant_id="default",
            claim_number=sbs_data.get("claim_number", ""),
            patient=patient,
            provider=provider,
            total_amount=float(sbs_data.get("total_amount", 0)),
            items=items,
            primary_diagnosis=primary_diagnosis,
            secondary_diagnoses=[],
            service_period={
                "start": datetime.fromisoformat(sbs_data.get("service_start_date", datetime.now().isoformat())),
                "end": datetime.fromisoformat(sbs_data.get("service_end_date", datetime.now().isoformat()))
            },
            insurance_plan=sbs_data.get("insurance_plan", ""),
            policy_number=sbs_data.get("policy_number", "")
        )

        return claim

    async def _convert_custom_to_claim(self, custom_data: Dict[str, Any]) -> Claim:
        """Convert custom format to internal Claim model"""
        # This would handle any custom format specific to the implementation
        # For now, assume a simplified structure similar to our internal model
        
        patient = Patient(
            id=custom_data.get("patient", {}).get("id", ""),
            national_id=custom_data.get("patient", {}).get("national_id", ""),
            name=custom_data.get("patient", {}).get("name", ""),
            date_of_birth=datetime.fromisoformat(
                custom_data.get("patient", {}).get("date_of_birth", "1970-01-01")
            ),
            gender=custom_data.get("patient", {}).get("gender", "unknown"),
            insurance_id=custom_data.get("patient", {}).get("insurance_id", "")
        )

        provider = Provider(
            id=custom_data.get("provider", {}).get("id", ""),
            name=custom_data.get("provider", {}).get("name", ""),
            license_number=custom_data.get("provider", {}).get("license", ""),
            specialty=custom_data.get("provider", {}).get("specialty", ""),
            nphies_provider_id=custom_data.get("provider", {}).get("nphies_id", "")
        )

        # Create a basic claim
        claim = Claim(
            id=custom_data.get("id", ""),
            tenant_id=custom_data.get("tenant_id", "default"),
            claim_number=custom_data.get("claim_number", ""),
            patient=patient,
            provider=provider,
            total_amount=float(custom_data.get("total_amount", 0)),
            items=[],  # Simplified for demo
            primary_diagnosis=DiagnosisCode(
                code="Z00.00",
                system="ICD-10", 
                display="General examination"
            ),
            secondary_diagnoses=[],
            service_period={
                "start": datetime.now(),
                "end": datetime.now()
            },
            insurance_plan=custom_data.get("insurance_plan", ""),
            policy_number=custom_data.get("policy_number", "")
        )

        return claim

    # Helper methods for data extraction
    async def _resolve_patient_reference(self, reference: str) -> Dict[str, Any]:
        """Resolve patient reference to patient data"""
        # In production, this would fetch from FHIR server
        return {"id": reference.split("/")[-1], "birthDate": "1990-01-01", "gender": "male"}

    async def _resolve_provider_reference(self, reference: str) -> Dict[str, Any]:
        """Resolve provider reference to provider data"""
        # In production, this would fetch from FHIR server
        return {"id": reference.split("/")[-1]}

    def _extract_national_id(self, patient_data: Dict[str, Any]) -> str:
        """Extract Saudi national ID from patient identifiers"""
        for identifier in patient_data.get("identifier", []):
            if identifier.get("system") == "http://nphies.sa/identifier/national-id":
                return identifier.get("value", "")
        return ""

    def _extract_patient_name(self, patient_data: Dict[str, Any], language: str = "en") -> str:
        """Extract patient name in specified language"""
        for name in patient_data.get("name", []):
            if language == "ar" and name.get("extension"):
                # Look for Arabic name extension
                for ext in name.get("extension", []):
                    if "arabic" in ext.get("url", "").lower():
                        return ext.get("valueString", "")
            elif language == "en":
                return " ".join([
                    " ".join(name.get("given", [])),
                    " ".join(name.get("family", []))
                ]).strip()
        return ""

    def _extract_insurance_id(self, patient_data: Dict[str, Any]) -> str:
        """Extract insurance member ID"""
        for identifier in patient_data.get("identifier", []):
            if "insurance" in identifier.get("system", "").lower():
                return identifier.get("value", "")
        return ""

    def _extract_provider_name(self, provider_data: Dict[str, Any], language: str = "en") -> str:
        """Extract provider name"""
        # Similar to patient name extraction
        return provider_data.get("name", [{}])[0].get("text", "")

    def _extract_license_number(self, provider_data: Dict[str, Any]) -> str:
        """Extract medical license number"""
        for identifier in provider_data.get("identifier", []):
            if "license" in identifier.get("system", "").lower():
                return identifier.get("value", "")
        return ""

    def _extract_specialty(self, provider_data: Dict[str, Any]) -> str:
        """Extract provider specialty"""
        qualifications = provider_data.get("qualification", [])
        if qualifications:
            return qualifications[0].get("code", {}).get("text", "")
        return ""

    def _extract_nphies_id(self, provider_data: Dict[str, Any]) -> str:
        """Extract NPHIES provider ID"""
        for identifier in provider_data.get("identifier", []):
            if "nphies" in identifier.get("system", "").lower():
                return identifier.get("value", "")
        return ""

    def _extract_procedure_code(self, item: Dict[str, Any]) -> ProcedureCode:
        """Extract procedure code from claim item"""
        product_or_service = item.get("productOrService", {})
        return ProcedureCode(
            code=product_or_service.get("coding", [{}])[0].get("code", ""),
            system=product_or_service.get("coding", [{}])[0].get("system", ""),
            display=product_or_service.get("coding", [{}])[0].get("display", "")
        )

    def _extract_diagnosis_codes(self, item: Dict[str, Any]) -> List[DiagnosisCode]:
        """Extract diagnosis codes from claim item"""
        diagnoses = []
        for diagnosis_ref in item.get("diagnosisSequence", []):
            # In production, resolve diagnosis reference
            diagnoses.append(DiagnosisCode(
                code="Z00.00",
                system="ICD-10",
                display="General examination"
            ))
        return diagnoses

    def _extract_primary_diagnosis(self, fhir_data: Dict[str, Any]) -> DiagnosisCode:
        """Extract primary diagnosis from FHIR claim"""
        diagnoses = fhir_data.get("diagnosis", [])
        for diagnosis in diagnoses:
            if diagnosis.get("type", [{}])[0].get("coding", [{}])[0].get("code") == "principal":
                diagnosis_code = diagnosis.get("diagnosisCodeableConcept", {})
                return DiagnosisCode(
                    code=diagnosis_code.get("coding", [{}])[0].get("code", ""),
                    system=diagnosis_code.get("coding", [{}])[0].get("system", ""),
                    display=diagnosis_code.get("coding", [{}])[0].get("display", "")
                )
        
        # Default if no primary diagnosis found
        return DiagnosisCode(code="Z00.00", system="ICD-10", display="General examination")

    def _extract_secondary_diagnoses(self, fhir_data: Dict[str, Any]) -> List[DiagnosisCode]:
        """Extract secondary diagnoses from FHIR claim"""
        secondary_diagnoses = []
        diagnoses = fhir_data.get("diagnosis", [])
        
        for diagnosis in diagnoses:
            if diagnosis.get("type", [{}])[0].get("coding", [{}])[0].get("code") != "principal":
                diagnosis_code = diagnosis.get("diagnosisCodeableConcept", {})
                secondary_diagnoses.append(DiagnosisCode(
                    code=diagnosis_code.get("coding", [{}])[0].get("code", ""),
                    system=diagnosis_code.get("coding", [{}])[0].get("system", ""),
                    display=diagnosis_code.get("coding", [{}])[0].get("display", "")
                ))
        
        return secondary_diagnoses

    def _extract_service_period(self, fhir_data: Dict[str, Any]) -> Dict[str, datetime]:
        """Extract service period from FHIR claim"""
        billable_period = fhir_data.get("billablePeriod", {})
        return {
            "start": datetime.fromisoformat(billable_period.get("start", datetime.now().isoformat())),
            "end": datetime.fromisoformat(billable_period.get("end", datetime.now().isoformat()))
        }

    def _extract_insurance_plan(self, fhir_data: Dict[str, Any]) -> str:
        """Extract insurance plan from FHIR claim"""
        insurance = fhir_data.get("insurance", [{}])[0]
        coverage_ref = insurance.get("coverage", {}).get("reference", "")
        return coverage_ref.split("/")[-1] if coverage_ref else ""

    def _extract_policy_number(self, fhir_data: Dict[str, Any]) -> str:
        """Extract policy number from FHIR claim"""
        # This would typically be in the Coverage resource
        return fhir_data.get("identifier", [{}])[0].get("value", "")

    def _extract_tenant_id(self, fhir_data: Dict[str, Any]) -> str:
        """Extract tenant ID from FHIR data"""
        # Look for tenant identifier in meta or identifier
        meta = fhir_data.get("meta", {})
        for tag in meta.get("tag", []):
            if tag.get("system") == "http://brainsait.com/tenant-id":
                return tag.get("code", "")
        return "default"

    def _format_hl7_name(self, name_components: List[Dict[str, Any]]) -> str:
        """Format HL7 v2 name components"""
        if not name_components:
            return ""
        
        name = name_components[0]
        return f"{name.get('given_name', '')} {name.get('family_name', '')}".strip()

    def _parse_hl7_date(self, date_string: Optional[str]) -> datetime:
        """Parse HL7 v2 date format"""
        if not date_string:
            return datetime(1970, 1, 1)
        
        try:
            # HL7 date format: YYYYMMDD or YYYYMMDDHHMMSS
            if len(date_string) >= 8:
                return datetime.strptime(date_string[:8], "%Y%m%d")
        except ValueError:
            pass
        
        return datetime(1970, 1, 1)