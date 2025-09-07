/**
 * Billing service for SaaS platform
 * BrainSAIT Digital Insurance Platform
 */

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  period: {
    start: Date;
    end: Date;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: 'SAR';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'subscription' | 'usage' | 'addon' | 'support';
}

export interface BillingInfo {
  tenantId: string;
  currentPlan: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
  currentUsage: {
    claims: number;
    apiCalls: number;
    storage: number;
  };
  estimatedBill: number;
  paymentMethod?: {
    type: 'card' | 'bank_transfer';
    last4?: string;
    expiryDate?: string;
  };
}

export class BillingService {
  private invoices: Map<string, Invoice[]> = new Map();
  private billingInfo: Map<string, BillingInfo> = new Map();

  /**
   * Get billing information for a tenant
   */
  async getBilling(tenantId: string): Promise<BillingInfo> {
    let billing = this.billingInfo.get(tenantId);
    
    if (!billing) {
      // Initialize default billing for new tenant
      billing = {
        tenantId,
        currentPlan: 'starter',
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        currentUsage: {
          claims: 0,
          apiCalls: 0,
          storage: 0
        },
        estimatedBill: this.getPlanPrice('starter', 'monthly')
      };
      
      this.billingInfo.set(tenantId, billing);
    }
    
    return billing;
  }

  /**
   * Generate invoice for a tenant
   */
  async generateInvoice(tenantId: string, period?: {
    start: Date;
    end: Date;
  }): Promise<Invoice> {
    const billing = await this.getBilling(tenantId);
    
    // Default to current month if no period specified
    const now = new Date();
    const defaultPeriod = {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
    
    const invoicePeriod = period || defaultPeriod;
    
    // Generate line items
    const lineItems = await this.generateLineItems(tenantId, invoicePeriod);
    
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.15; // 15% VAT in Saudi Arabia
    const total = subtotal + tax;
    
    const invoice: Invoice = {
      id: this.generateInvoiceId(),
      tenantId,
      invoiceNumber: this.generateInvoiceNumber(tenantId),
      period: invoicePeriod,
      lineItems,
      subtotal,
      tax,
      total,
      currency: 'SAR',
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date()
    };
    
    // Store invoice
    const tenantInvoices = this.invoices.get(tenantId) || [];
    tenantInvoices.push(invoice);
    this.invoices.set(tenantId, tenantInvoices);
    
    console.log(`💰 Invoice generated: ${invoice.invoiceNumber} for ${tenantId} - ${total} SAR`);
    
    return invoice;
  }

  /**
   * Get invoices for a tenant
   */
  async getInvoices(tenantId: string, limit: number = 10): Promise<Invoice[]> {
    const tenantInvoices = this.invoices.get(tenantId) || [];
    return tenantInvoices
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Update payment method for a tenant
   */
  async updatePaymentMethod(tenantId: string, paymentMethod: BillingInfo['paymentMethod']): Promise<void> {
    const billing = await this.getBilling(tenantId);
    billing.paymentMethod = paymentMethod;
    this.billingInfo.set(tenantId, billing);
    
    console.log(`💳 Payment method updated for tenant: ${tenantId}`);
  }

  /**
   * Process payment for an invoice
   */
  async processPayment(invoiceId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Find invoice
    let invoice: Invoice | undefined;
    let tenantId: string | undefined;
    
    for (const [tid, invoices] of this.invoices.entries()) {
      const found = invoices.find(inv => inv.id === invoiceId);
      if (found) {
        invoice = found;
        tenantId = tid;
        break;
      }
    }
    
    if (!invoice || !tenantId) {
      return { success: false, error: 'Invoice not found' };
    }
    
    if (invoice.status === 'paid') {
      return { success: false, error: 'Invoice already paid' };
    }
    
    // Simulate payment processing
    // In production, this would integrate with payment gateway
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update invoice status
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    
    console.log(`✅ Payment processed: ${invoice.invoiceNumber} - ${transactionId}`);
    
    return { success: true, transactionId };
  }

  /**
   * Generate line items for an invoice
   */
  private async generateLineItems(tenantId: string, period: { start: Date; end: Date }): Promise<InvoiceLineItem[]> {
    const billing = await this.getBilling(tenantId);
    const lineItems: InvoiceLineItem[] = [];
    
    // Base subscription
    const planPrice = this.getPlanPrice(billing.currentPlan, billing.billingCycle);
    lineItems.push({
      description: `${billing.currentPlan.charAt(0).toUpperCase() + billing.currentPlan.slice(1)} Plan - ${billing.billingCycle}`,
      quantity: 1,
      unitPrice: planPrice,
      total: planPrice,
      type: 'subscription'
    });
    
    // Usage overages (simulated)
    const usageOverages = this.calculateUsageOverages(tenantId, billing.currentPlan);
    lineItems.push(...usageOverages);
    
    return lineItems;
  }

  /**
   * Calculate usage overage charges
   */
  private calculateUsageOverages(tenantId: string, planType: string): InvoiceLineItem[] {
    const overages: InvoiceLineItem[] = [];
    
    // Get plan limits
    const limits = this.getPlanLimits(planType);
    
    // Simulate current usage (in production, this would come from UsageTracker)
    const currentUsage = {
      claims: Math.floor(Math.random() * 15000), // Random for demo
      apiCalls: Math.floor(Math.random() * 75000),
      storage: Math.floor(Math.random() * 150)
    };
    
    // Calculate overages
    if (currentUsage.claims > limits.claims) {
      const overage = currentUsage.claims - limits.claims;
      overages.push({
        description: `Claims processing overage (${overage} claims)`,
        quantity: overage,
        unitPrice: 0.50,
        total: overage * 0.50,
        type: 'usage'
      });
    }
    
    if (currentUsage.apiCalls > limits.apiCalls) {
      const overage = currentUsage.apiCalls - limits.apiCalls;
      overages.push({
        description: `API calls overage (${overage} calls)`,
        quantity: overage,
        unitPrice: 0.02,
        total: overage * 0.02,
        type: 'usage'
      });
    }
    
    if (currentUsage.storage > limits.storage) {
      const overage = currentUsage.storage - limits.storage;
      overages.push({
        description: `Storage overage (${overage} GB)`,
        quantity: overage,
        unitPrice: 10,
        total: overage * 10,
        type: 'usage'
      });
    }
    
    return overages;
  }

  /**
   * Get plan pricing
   */
  private getPlanPrice(planType: string, billingCycle: string): number {
    const pricing = {
      starter: { monthly: 999, yearly: 9990 },
      professional: { monthly: 2999, yearly: 29990 },
      enterprise: { monthly: 9999, yearly: 99990 }
    };
    
    return pricing[planType]?.[billingCycle] || pricing.starter.monthly;
  }

  /**
   * Get plan limits
   */
  private getPlanLimits(planType: string): { claims: number; apiCalls: number; storage: number } {
    const limits = {
      starter: { claims: 5000, apiCalls: 25000, storage: 50 },
      professional: { claims: 15000, apiCalls: 75000, storage: 150 },
      enterprise: { claims: 50000, apiCalls: 250000, storage: 500 }
    };
    
    return limits[planType] || limits.starter;
  }

  /**
   * Generate unique invoice ID
   */
  private generateInvoiceId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(tenantId: string): string {
    const tenantInvoices = this.invoices.get(tenantId) || [];
    const count = tenantInvoices.length + 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    return `INV-${year}${month}-${tenantId.substr(-4).toUpperCase()}-${String(count).padStart(4, '0')}`;
  }
}