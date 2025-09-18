# Data Model and FHIR Mapping

Core Entities
- SourceFile (id, filename, mime, checksum, uploader_id, uploaded_at, storage_url)
- ClaimHeader (id, claim_id_ext, patient_id, provider_id, payer_id, coverage_id, service_period_start/end, total_billed_amount, currency, source_file_id)
- ClaimLine (id, claim_header_id, line_no, icd10_code, cpt_code, units, unit_price, modifiers, billed_amount, revenue_code, place_of_service)
- Denial (id, claim_header_id, claim_line_id, denial_code, denial_category, denial_reason_text_ar/en, amount_denied, payer_response_ref, occurred_at)
- Coverage (id, beneficiary_patient_id, plan_id, payor_org_id, network, period_start/end, status)
- Patient (id, identifiers [national_id/iqama], name_ar/en, birth_date, gender)
- Organization (id, name_ar/en, type [payer/provider], identifiers)
- Practitioner (id, name_ar/en, identifiers, specialty)
- EOB (id, claim_header_id, total_allowed, total_paid, patient_responsibility, breakdown_json)
- AuditLog (id, user_id, action, resource_type, resource_id, phi_involved, ip, timestamp, meta)

FHIR Resource Mapping
- ClaimHeader → Claim
  - Claim.identifier.value ← claim_id_ext
  - Claim.patient ← Patient.reference
  - Claim.provider ← Organization/Practitioner
  - Claim.insurer ← Organization (payer)
  - Claim.item[] ← ClaimLine (diagnosis, procedure, unitPrice, quantity, net)
  - Claim.total ← total_billed_amount
- ClaimLine → Claim.item
  - diagnosisSequence ← icd10_code
  - productOrService ← CPT code
  - quantity/value ← units
  - unitPrice/value ← unit_price
  - net/value ← billed_amount
- Coverage → Coverage
  - beneficiary ← Patient
  - payor ← Organization
  - status, period, network
- EOB → ExplanationOfBenefit
  - payment, adjudication line items, totals
- Denial → ClaimResponse.item.adjudication and error
  - reason.code/category mapped to payer-specific → standardized denial categories

Terminology and Validation
- ICD-10: validate code exists and applicable
- CPT/HCPCS: validate allowed with plan and POS
- LOINC: for lab items present in claims
- Saudi ID/Iqama: NPHIESIntegration.validate_saudi_patient_id()

Example: FHIR Claim (abbrev)
```json
{
  "resourceType": "Claim",
  "identifier": [{ "system": "https://brainsait.example/claims", "value": "CLM-2025-000123" }],
  "status": "active",
  "type": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional" }] },
  "patient": { "reference": "Patient/12345" },
  "provider": { "reference": "Organization/PRV-001" },
  "insurer": { "reference": "Organization/PYR-001" },
  "item": [{
    "sequence": 1,
    "diagnosisSequence": [1],
    "productOrService": { "coding": [{ "system": "http://www.ama-assn.org/go/cpt", "code": "93000" }] },
    "quantity": { "value": 1 },
    "unitPrice": { "value": 150, "currency": "SAR" },
    "net": { "value": 150, "currency": "SAR" }
  }],
  "total": { "value": 150, "currency": "SAR" }
}
```

Standardized Denial Categories (examples)
- Eligibility/Coverage (Arabic: الأهلية/التغطية)
- Authorization Missing/Invalid (التفويض مفقود/غير صالح)
- Coding/Medical Necessity (الترميز/الضرورة الطبية)
- Documentation/Attachments (الوثائق/المرفقات)
- Benefit Limits/Exclusions (حدود المنافع/الاستثناءات)
- Duplicate/Timely Filing (مكرر/مهلة التقديم)

Provenance
- Every Claim/EOB/ClaimResponse stores source_file_id and row lineage
- Audit trail for transformations and validations

Data Retention
- Configurable retention with legal/compliance constraints, secure deletion workflows