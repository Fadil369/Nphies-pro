# BrainSAIT Healthcare Starter (Specs-Compliant)

This starter implements the BrainSAIT Spec Kit conventions for a HIPAA/NPHIES-compliant healthcare analytics platform with FHIR validation and bilingual Arabic/English UX.

What’s included
- Backend (FastAPI): RBAC, HIPAA wrappers, audit logging hooks, NPHIES validator, FHIR validator
- Frontend (Next.js/React): Arabic-first RTL layout, language toggle, BrainSAIT mesh gradient, KPI tile stub
- Shared packages: hipaa_compliance, audit_logger, rbac, fhir_validation, nphies_integration
- Env + requirements: minimal to run and extend

Quick start
1) Backend
   - cp infrastructure/.env.example infrastructure/.env
   - python -m venv .venv && source .venv/bin/activate
   - pip install -r infrastructure/requirements.txt
   - uvicorn services.api.main:app --reload

2) Frontend
   - cd apps/web-frontend
   - pnpm install (or npm i / yarn)
   - pnpm dev (or npm run dev / yarn dev)

Security & Compliance
- All PHI routes use @hipaa_compliant decorator and audit logging
- Role checks via RBAC dependency
- AES-256 encryption utilities for PHI fields
- Saudi ID/Iqama validation via NPHIESIntegration.validate_saudi_patient_id()

Branding & Bilingual
- Arabic RTL by default with English toggle
- Mesh gradient with BrainSAIT colors