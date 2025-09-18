# Task Breakdown and Roadmap

Owners (Agents)
- MASTERLINC: orchestration
- COMPLIANCELINC: HIPAA/NPHIES compliance
- HEALTHCARELINC: clinical/terminology validation
- TTLINC: bilingual content and RTL/LTR
- CLINICALLINC: coding and medical necessity checks

Epic A: Ingestion and Parsing
- A1: File upload API with @hipaa_compliant and audit logging
  - DoD: Upload Excel/PDF to object storage; audit entry created; RBAC enforced
- A2: PDF OCR pipeline with table extraction
  - DoD: 95%+ accurate table extraction on sample PDFs; lineage tracked
- A3: Excel schema detection (Arabic/English headers)
  - DoD: Automatic mapping to canonical fields with locale detection
- A4: Provenance tracking
  - DoD: Every FHIR resource references source_file_id and row number

Epic B: FHIR Normalization and Validation
- B1: Map claim rows → FHIR Claim/ClaimLine
- B2: Create Coverage, Patient, Organization from master data
- B3: Validate ICD-10/CPT/LOINC; Saudi ID validation
- B4: Persist resources; handle duplicates and idempotency
- DoD: 95%+ valid FHIR on clean datasets; error reports for reprocessing

Epic C: NPHIES Integration
- C1: Eligibility check endpoint + adapter
- C2: Claim pre-validation against NPHIES rules
- C3: Saudi ID/Iqama validator integration
- DoD: Sample eligibility and pre-validation pass; audit and masking enforced

Epic D: Analytics and KPIs
- D1: Aggregations: rejectionCount, rejectionAmount, FPAR, ADR, topCategories
- D2: Trend engine with time-bucketing
- D3: Drill-down with RBAC masking
- DoD: <2.5s P95 for KPI and trends at target load

Epic E: Bilingual UI and Exports
- E1: RTL-first layout with mesh gradient branding
- E2: KPI dashboard (Arabic default), English toggle
- E3: Bilingual CSV/PDF exports with watermarking, PHI masking option
- DoD: WCAG 2.1 AA; correct RTL rendering; localized numerals/dates

Epic F: Security, Compliance, and Audit
- F1: OAuth2.0/OIDC integration with RBAC scopes
- F2: @hipaa_compliant wrappers; AES-256 field encryption
- F3: audit-service with tamper-evident logs and retention configs
- DoD: Pen tests pass; compliance checklist green; no PHI in logs

Epic G: Testing and Validation
- G1: Unit tests for FHIR mapping/validation
- G2: Integration tests for ingestion → analytics flow
- G3: Compliance tests (HIPAA/NPHIES gates)
- G4: Performance tests (load, concurrency)
- DoD: >90% critical path coverage; CI gates block on failures

Milestones
- M1 (Week 3): Ingestion + basic normalization
- M2 (Week 6): NPHIES eligibility + core KPIs/trends
- M3 (Week 9): Adjudication checks + exports + full compliance