-- BrainSAIT Digital Insurance Platform - Database Initialization
-- This script sets up the initial database schema for development

-- Create main application database
CREATE DATABASE nphies_pro_dev;
CREATE DATABASE nphies_pro_test;

-- Connect to the main database
\c nphies_pro_dev;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas for different domains
CREATE SCHEMA IF NOT EXISTS tenants;
CREATE SCHEMA IF NOT EXISTS claims;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS fhir;

-- Tenants schema tables
CREATE TABLE IF NOT EXISTS tenants.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address JSONB,
    compliance_level VARCHAR(50) NOT NULL CHECK (compliance_level IN ('basic', 'hipaa', 'nphies', 'enterprise')),
    features TEXT[],
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    billing_enabled BOOLEAN DEFAULT true,
    data_residency VARCHAR(50) DEFAULT 'saudi' CHECK (data_residency IN ('saudi', 'gcc', 'global')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[],
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Claims schema tables
CREATE TABLE IF NOT EXISTS claims.claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    nphies_claim_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    priority VARCHAR(50) NOT NULL DEFAULT 'normal',
    patient_data JSONB NOT NULL,
    provider_data JSONB NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    primary_diagnosis JSONB NOT NULL,
    secondary_diagnoses JSONB DEFAULT '[]',
    service_period JSONB NOT NULL,
    insurance_plan VARCHAR(100) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    eligibility_verified BOOLEAN DEFAULT false,
    ai_processed BOOLEAN DEFAULT false,
    confidence_score DECIMAL(3,2),
    fraud_risk_score DECIMAL(3,2),
    compliance_flags TEXT[],
    audit_trail JSONB DEFAULT '[]',
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing schema tables
CREATE TABLE IF NOT EXISTS billing.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    line_items JSONB NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing.usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit schema tables
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FHIR schema tables for healthcare data
CREATE TABLE IF NOT EXISTS fhir.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    fhir_id VARCHAR(100) NOT NULL,
    national_id VARCHAR(20),
    name_en VARCHAR(255),
    name_ar VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(50),
    address JSONB,
    insurance_id VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, fhir_id)
);

CREATE TABLE IF NOT EXISTS fhir.providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    fhir_id VARCHAR(100) NOT NULL,
    name_en VARCHAR(255),
    name_ar VARCHAR(255),
    license_number VARCHAR(100),
    specialty VARCHAR(100),
    facility_id UUID,
    nphies_provider_id VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, fhir_id)
);

-- Create indexes for performance
CREATE INDEX idx_tenants_domain ON tenants.tenants(domain);
CREATE INDEX idx_tenants_status ON tenants.tenants(status);
CREATE INDEX idx_users_tenant_id ON tenants.users(tenant_id);
CREATE INDEX idx_users_email ON tenants.users(email);

CREATE INDEX idx_claims_tenant_id ON claims.claims(tenant_id);
CREATE INDEX idx_claims_status ON claims.claims(status);
CREATE INDEX idx_claims_submission_date ON claims.claims(submission_date);
CREATE INDEX idx_claims_nphies_id ON claims.claims(nphies_claim_id);

CREATE INDEX idx_invoices_tenant_id ON billing.invoices(tenant_id);
CREATE INDEX idx_invoices_status ON billing.invoices(status);
CREATE INDEX idx_usage_events_tenant_id ON billing.usage_events(tenant_id);
CREATE INDEX idx_usage_events_timestamp ON billing.usage_events(timestamp);

CREATE INDEX idx_audit_logs_tenant_id ON audit.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_timestamp ON audit.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);

CREATE INDEX idx_patients_tenant_id ON fhir.patients(tenant_id);
CREATE INDEX idx_patients_national_id ON fhir.patients(national_id);
CREATE INDEX idx_providers_tenant_id ON fhir.providers(tenant_id);
CREATE INDEX idx_providers_license ON fhir.providers(license_number);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON tenants.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims.claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON billing.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON fhir.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON fhir.providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO tenants.tenants (name, domain, plan_type, contact_email, compliance_level, features) VALUES
('Demo Healthcare Provider', 'demo-provider', 'professional', 'admin@demo-provider.sa', 'nphies', 
 ARRAY['advanced-claims', 'prior-auth', 'basic-ai', 'phone-support', 'api-access']),
('Test Insurance Company', 'test-insurance', 'enterprise', 'admin@test-insurance.sa', 'enterprise',
 ARRAY['full-ai-suite', 'fraud-detection', 'dedicated-support', 'custom-integrations']),
('Saudi Medical Center', 'saudi-medical', 'starter', 'admin@saudi-medical.sa', 'basic',
 ARRAY['basic-claims', 'basic-auth', 'email-support']);

-- Log completion
INSERT INTO audit.audit_logs (action, resource_type, details) VALUES
('database_initialization', 'system', '{"message": "Database initialized successfully", "version": "1.0.0"}');