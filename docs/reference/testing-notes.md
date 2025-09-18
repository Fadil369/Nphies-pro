# Testing Notes

Backend
- Start API: uvicorn services.api.main:app --reload
- Health: GET http://localhost:8000/health
- Upload: POST /ingestion/files (multipart) with file + meta.locale
- KPIs: GET /claims/kpis
- Eligibility: POST /nphies/eligibility with { "patient": { "nationalId": "1234567890" } }

Frontend
- Start web: pnpm dev
- Open http://localhost:3000
- Toggle language to validate RTL/LTR

Compliance
- Ensure PHI_AES256_KEY_HEX is a real random 32-byte hex in production.
- Route access guarded by scopes; replace stub auth with OIDC.
- Audit logs emitted to stdout; wire to audit-service in production.