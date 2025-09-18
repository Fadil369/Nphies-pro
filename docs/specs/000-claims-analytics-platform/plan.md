# Technical Implementation Plan: Claims Analytics, Adjudication, and Rejection Intelligence

Architecture Overview
- Backend: FastAPI (Python) with FHIR validation (fhir.resources), async workers for ingestion and OCR
- Frontend: Next.js/React (TypeScript) with RTL/LTR support, Tailwind, mesh gradient branding
- Storage: PostgreSQL (encrypted), S3-compatible object storage for source Excel/PDF, Redis cache
- Messaging/Workers: Celery/RQ for ETL and FHIR validation pipelines
- Auth: OAuth 2.0/OpenID Connect, RBAC scopes aligned to healthcare roles
- Compliance: audit-service microservice, centralized PHI encryption/decryption utilities

Domain-Driven Folders
- apps/: web-frontend (RTL/LTR), admin-console, provider-dashboard
- services/: ingestion-service, fhir-normalizer, analytics-service, audit-service, nphies-adapter
- packages/: fhir-validation, hipaa-compliance, nphies-integration, bilingual-ui
- workers/: ocr-processor, fhir-validator, analytics-compute, audit-processor
- infrastructure/: postgres (TDE/pgcrypto), redis, monitoring

Data Flow
1) Upload Excel/PDF → ingestion-service stores file (object storage), logs audit
2) OCR (if PDF scanned) → extract tables → normalization
3) fhir-normalizer maps rows to FHIR resources (Claim, Coverage, Patient, etc.)
4) Validation: FHIR schema + terminology + NPHIES rules (Saudi ID, plan eligibility)
5) Persist resources (PostgreSQL) + line-level provenance to source files
6) analytics-service computes KPIs, trends; caches pre-aggregations
7) web-frontend renders bilingual dashboards; export services produce bilingual CSV/PDF

Security and Compliance
- Decorators: @hipaa_compliant(audit_phi=True) on API endpoints handling PHI
- Encryption: AES-256 for PHI fields; TLS 1.2+ in transit; encrypted backups
- RBAC: doctor, nurse (view-limited), provider_biller, insurer_analyst, admin, auditor, patient (self-only)
- Audit: Every access and export recorded with user, action, resource, IP, timestamp, phi_involved
- Secrets: Vault/KMS managed keys; environment variables for tokens, DB URLs, compliance endpoints

API Contracts (high level)
- POST /ingestion/files: upload Excel/PDF (role: provider_biller|insurer_analyst|admin)
- POST /ingestion/parse: start OCR/parse job → job_id
- POST /claims/normalize: start FHIR normalization job for file_id
- GET /claims/kpis: KPIs (role varies), scoped and masked by RBAC
- GET /claims/trends: time-series trends; filters: payer, provider, ICD, CPT
- GET /claims/denials: top rejections with counts/amounts; drill-down
- POST /nphies/eligibility: check eligibility; logs audit
- POST /exports/report: generate bilingual CSV/PDF; watermarking and PHI masking for non-privileged roles

Frontend Plan (Bilingual + Branding)
- Global RTL default with language toggle; react-i18next for translations
- BrainSAIT mesh gradient (primary speed 0.3; wireframe speed 0.2; 60% overlay)
- KPI tiles, line/area charts (time-series), bar charts (top denials), pivot tables
- Accessibility: WCAG 2.1 AA, keyboard navigation, high-contrast option

Performance
- Pre-aggregations for heavy KPIs; windowed lookups
- Async ingestion; backpressure via queues
- Target <2.5s P95 for KPI pages with 1000 concurrent users
- Memory <100MB per user session; streaming responses for exports

Observability
- Metrics: ingestion throughput, validation error rates, PHI access rate
- Logs: structured JSON with request IDs; no raw PHI in logs
- Alerts: spikes in denial rate, eligibility failure surges, export spikes

Compliance Checkpoints (in CI/CD and runtime)
- FHIR schema validation tests on sample datasets
- HIPAA checks: encryption on/off gates, RBAC scope tests
- NPHIES rules: Saudi ID validator, eligibility schemas, claim pre-submit checks
- Audit integrity: tamper-evident logs and retention verification

Rollout
- Phase 1: Ingestion + FHIR normalization + basic KPIs
- Phase 2: NPHIES eligibility + denial intelligence + exports
- Phase 3: Adjudication rule library + resubmission guidance + benchmarking