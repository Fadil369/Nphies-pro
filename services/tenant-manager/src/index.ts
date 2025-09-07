import express from 'express';
import { TenantService } from './services/TenantService';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { BillingService } from './services/BillingService';
import { UsageTracker } from './services/UsageTracker';

/**
 * BrainSAIT Digital Insurance Platform - Tenant Manager Service
 * 
 * Multi-tenant SaaS management service providing:
 * - Tenant provisioning and management
 * - Usage tracking and billing
 * - Role-based access control (RBAC)
 * - Compliance monitoring
 * 
 * Compliance: HIPAA, NPHIES, PDPL, CCHI aligned
 * Standards: BrainSAIT Enterprise Architecture Framework
 */

export class TenantManagerService {
  private app: express.Application;
  private tenantService: TenantService;
  private billingService: BillingService;
  private usageTracker: UsageTracker;

  constructor() {
    this.app = express();
    this.tenantService = new TenantService();
    this.billingService = new BillingService();
    this.usageTracker = new UsageTracker();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(AuthMiddleware.authenticate);
  }

  private setupRoutes(): void {
    // Tenant management endpoints
    this.app.post('/api/tenants', this.createTenant.bind(this));
    this.app.get('/api/tenants/:id', this.getTenant.bind(this));
    this.app.put('/api/tenants/:id', this.updateTenant.bind(this));
    this.app.delete('/api/tenants/:id', this.deleteTenant.bind(this));

    // Usage tracking endpoints
    this.app.get('/api/tenants/:id/usage', this.getUsage.bind(this));
    this.app.post('/api/tenants/:id/usage/track', this.trackUsage.bind(this));

    // Billing endpoints
    this.app.get('/api/tenants/:id/billing', this.getBilling.bind(this));
    this.app.post('/api/tenants/:id/billing/invoice', this.generateInvoice.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'tenant-manager', timestamp: new Date().toISOString() });
    });
  }

  private async createTenant(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tenant = await this.tenantService.createTenant(req.body);
      res.status(201).json(tenant);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getTenant(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tenant = await this.tenantService.getTenant(req.params.id);
      res.json(tenant);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  private async updateTenant(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tenant = await this.tenantService.updateTenant(req.params.id, req.body);
      res.json(tenant);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async deleteTenant(req: express.Request, res: express.Response): Promise<void> {
    try {
      await this.tenantService.deleteTenant(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getUsage(req: express.Request, res: express.Response): Promise<void> {
    try {
      const usage = await this.usageTracker.getUsage(req.params.id);
      res.json(usage);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async trackUsage(req: express.Request, res: express.Response): Promise<void> {
    try {
      await this.usageTracker.trackUsage(req.params.id, req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getBilling(req: express.Request, res: express.Response): Promise<void> {
    try {
      const billing = await this.billingService.getBilling(req.params.id);
      res.json(billing);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async generateInvoice(req: express.Request, res: express.Response): Promise<void> {
    try {
      const invoice = await this.billingService.generateInvoice(req.params.id);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  public start(port: number = 3001): void {
    this.app.listen(port, () => {
      console.log(`🚀 TenantManager Service running on port ${port}`);
      console.log(`📊 BrainSAIT Digital Insurance Platform - Multi-tenant SaaS`);
    });
  }
}

// Export service instance
export const tenantManager = new TenantManagerService();

// Start service if this file is run directly
if (require.main === module) {
  tenantManager.start();
}