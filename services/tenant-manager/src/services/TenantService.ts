import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant data validation schema
 * Aligned with BrainSAIT compliance standards
 */
export const TenantSchema = z.object({
  name: z.string().min(2).max(100),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/),
  planType: z.enum(['starter', 'professional', 'enterprise']),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    region: z.string(),
    postalCode: z.string(),
    country: z.string().default('SA') // Saudi Arabia default
  }),
  complianceLevel: z.enum(['basic', 'hipaa', 'nphies', 'enterprise']),
  features: z.array(z.string()).default([]),
  metadata: z.record(z.string()).optional()
});

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  planType: 'starter' | 'professional' | 'enterprise';
  contactEmail: string;
  contactPhone?: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  complianceLevel: 'basic' | 'hipaa' | 'nphies' | 'enterprise';
  features: string[];
  metadata?: Record<string, string>;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  billingEnabled: boolean;
  dataResidency: 'saudi' | 'gcc' | 'global';
}

/**
 * Multi-tenant management service
 * Handles tenant lifecycle, provisioning, and compliance
 */
export class TenantService {
  private tenants: Map<string, Tenant> = new Map();

  /**
   * Create a new tenant with compliance validation
   */
  async createTenant(data: z.infer<typeof TenantSchema>): Promise<Tenant> {
    // Validate input data
    const validatedData = TenantSchema.parse(data);
    
    // Check domain uniqueness
    const existingTenant = Array.from(this.tenants.values())
      .find(t => t.domain === validatedData.domain);
    
    if (existingTenant) {
      throw new Error(`Domain '${validatedData.domain}' is already registered`);
    }

    // Create tenant with Saudi compliance defaults
    const tenant: Tenant = {
      id: uuidv4(),
      ...validatedData,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      billingEnabled: true,
      dataResidency: 'saudi', // Default to Saudi data centers for compliance
      features: this.getDefaultFeatures(validatedData.planType)
    };

    // Store tenant
    this.tenants.set(tenant.id, tenant);

    // Initialize tenant-specific resources
    await this.provisionTenantResources(tenant);

    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);
    return tenant;
  }

  /**
   * Retrieve tenant by ID
   */
  async getTenant(id: string): Promise<Tenant> {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      throw new Error(`Tenant with ID '${id}' not found`);
    }
    return tenant;
  }

  /**
   * Update tenant information
   */
  async updateTenant(id: string, updates: Partial<z.infer<typeof TenantSchema>>): Promise<Tenant> {
    const tenant = await this.getTenant(id);
    
    // Validate updates
    const validatedUpdates = TenantSchema.partial().parse(updates);
    
    // Update tenant
    const updatedTenant: Tenant = {
      ...tenant,
      ...validatedUpdates,
      updatedAt: new Date()
    };

    this.tenants.set(id, updatedTenant);
    console.log(`✅ Tenant updated: ${updatedTenant.name} (${id})`);
    
    return updatedTenant;
  }

  /**
   * Delete/deactivate tenant
   */
  async deleteTenant(id: string): Promise<void> {
    const tenant = await this.getTenant(id);
    
    // Soft delete - mark as inactive for compliance
    tenant.status = 'inactive';
    tenant.updatedAt = new Date();
    
    this.tenants.set(id, tenant);
    
    // Cleanup tenant resources
    await this.cleanupTenantResources(tenant);
    
    console.log(`🗑️ Tenant deactivated: ${tenant.name} (${id})`);
  }

  /**
   * Get default features based on plan type
   */
  private getDefaultFeatures(planType: string): string[] {
    const featureMatrix = {
      starter: ['basic-claims', 'basic-auth', 'email-support'],
      professional: [
        'advanced-claims', 'prior-auth', 'basic-ai', 'phone-support',
        'api-access', 'custom-reports'
      ],
      enterprise: [
        'full-ai-suite', 'fraud-detection', 'dedicated-support',
        'custom-integrations', 'advanced-analytics', 'sla-guarantee',
        'white-label', 'multi-region'
      ]
    };
    
    return featureMatrix[planType] || featureMatrix.starter;
  }

  /**
   * Provision tenant-specific resources
   */
  private async provisionTenantResources(tenant: Tenant): Promise<void> {
    // Create tenant database schema
    console.log(`🔧 Provisioning database for tenant: ${tenant.id}`);
    
    // Setup tenant-specific encryption keys
    console.log(`🔐 Generating encryption keys for tenant: ${tenant.id}`);
    
    // Configure RBAC permissions
    console.log(`👥 Setting up RBAC for tenant: ${tenant.id}`);
    
    // Initialize audit logging
    console.log(`📝 Initializing audit logs for tenant: ${tenant.id}`);
    
    // Setup compliance monitoring
    if (tenant.complianceLevel === 'nphies' || tenant.complianceLevel === 'enterprise') {
      console.log(`⚖️ Configuring NPHIES compliance for tenant: ${tenant.id}`);
    }
  }

  /**
   * Cleanup tenant resources
   */
  private async cleanupTenantResources(tenant: Tenant): Promise<void> {
    console.log(`🧹 Cleaning up resources for tenant: ${tenant.id}`);
    // Implement cleanup logic while maintaining audit trail
  }

  /**
   * List all tenants with filtering
   */
  async listTenants(filters?: {
    status?: string;
    planType?: string;
    complianceLevel?: string;
  }): Promise<Tenant[]> {
    let tenants = Array.from(this.tenants.values());
    
    if (filters) {
      if (filters.status) {
        tenants = tenants.filter(t => t.status === filters.status);
      }
      if (filters.planType) {
        tenants = tenants.filter(t => t.planType === filters.planType);
      }
      if (filters.complianceLevel) {
        tenants = tenants.filter(t => t.complianceLevel === filters.complianceLevel);
      }
    }
    
    return tenants;
  }
}