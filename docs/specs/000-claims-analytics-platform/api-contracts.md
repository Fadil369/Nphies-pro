# API Contracts (Draft)

Security
- OAuth 2.0 (Auth Code + PKCE), OIDC; JWT with RBAC scopes
- Scopes: claims.read, claims.write, analytics.read, exports.write, audit.read, admin.manage
- All PHI endpoints wrapped with @hipaa_compliant(audit_phi=True)
- Mask PHI for roles without explicit need-to-know

Endpoints
1) POST /ingestion/files
   - Upload Excel/PDF
   - Request: multipart/form-data (file), metadata { locale, payerId, providerId }
   - Response: { fileId, status }
   - RBAC: provider_biller|insurer_analyst|admin
   - Audit: upload_file

2) POST /ingestion/parse
   - Body: { fileId }
   - Response: { jobId }
   - RBAC: provider_biller|insurer_analyst|admin
   - Audit: start_parse

3) POST /claims/normalize
   - Body: { fileId, options: { validateTerminology: true, mapToFHIR: true } }
   - Response: { jobId }
   - RBAC: insurer_analyst|admin
   - Audit: start_normalization

4) GET /claims/kpis
   - Query: { from, to, payerId?, providerId? }
   - Response: { rejectionCount, rejectionAmount, topCategories[], fpar, adr, ... }
   - RBAC: insurer_analyst|provider_biller|admin
   - Audit: view_kpis (phi_involved=false unless drilling to PHI)

5) GET /claims/denials
   - Query: { from, to, groupBy: payer|provider|code|category, top: 10 }
   - Response: array of { key, count, amount, trend[] }
   - RBAC: insurer_analyst|provider_biller|admin
   - Audit: view_denials

6) GET /claims/trends
   - Query: { metric: rejectionCount|rejectionAmount|fpar|adr, from, to, by: day|week|month }
   - Response: { series: [{ t, v }] }
   - RBAC: insurer_analyst|provider_biller|admin
   - Audit: view_trends

7) POST /nphies/eligibility
   - Body: { patient: { nationalId }, coverageId, serviceDate }
   - Response: { eligible: boolean, reasons[], coverageSummary }
   - RBAC: provider_biller|insurer_analyst|admin
   - Audit: eligibility_check (phi_involved=true)

8) POST /exports/report
   - Body: { type: csv|pdf, locale: ar|en, filters: {...}, maskPHI?: boolean }
   - Response: { exportId, downloadUrl (when ready) }
   - RBAC: insurer_analyst|admin|auditor
   - Audit: export_report (phi_involved=depends on mask)

Errors
- 400 validation_error (FHIR/terminology/NPHIES)
- 401/403 authz errors (RBAC scope mismatch)
- 422 domain_rule_violation (adjudication pre-check)
- 500 internal_error (never leak PHI/details)