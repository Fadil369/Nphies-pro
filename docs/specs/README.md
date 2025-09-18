# BrainSAIT System Specs Index

This directory contains healthcare-first, compliance-ready specifications generated using the BrainSAIT Spec Kit.

Conventions
- Arabic-first, English-secondary (RTL by default)
- FHIR R4 mappings included for all medical data
- HIPAA/NPHIES compliance checkpoints embedded
- Audit logging requirements captured for each flow
- Performance targets included (<2.5s, 1000+ concurrent users)

Available Specifications
1) 000-claims-analytics-platform
   - Title: Insurance Claims Analytics, Adjudication, and Rejection Intelligence (Saudi NPHIES)
   - Scope: End-to-end payer/provider claims analytics with ingestion (Excel/PDF), FHIR normalization, NPHIES validation, denial trend analysis, bilingual dashboards, and audit-grade exports.

How to use with BrainSAIT Agents
- Specification: /specify "Create [FEATURE_NAME] with FHIR compliance, bilingual Arabic/English UI, HIPAA audit logging, and NPHIES integration."
- Planning: /plan "Implement using FastAPI backend, PostgreSQL encrypted DB, React frontend with RTL/LTR support, FHIR validation, AES-256 PHI encryption, OAuth2.0 RBAC, full audit logging, and NPHIES integration."
- Tasks: /tasks "Break down [FEATURE_NAME] into modular tasks: FHIR validation, security, bilingual UI, audit logging, compliance testing, performance benchmarks."