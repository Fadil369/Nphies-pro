/**
 * Usage tracking service for SaaS billing and analytics
 * BrainSAIT Digital Insurance Platform
 */

export interface UsageEvent {
  tenantId: string;
  eventType: string;
  resourceType: string;
  quantity: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface UsageMetrics {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    claimsProcessed: number;
    apiCalls: number;
    storageUsed: number; // in GB
    usersActive: number;
    transactionsProcessed: number;
    aiPredictions: number;
  };
  costs: {
    basePlan: number;
    overageCharges: number;
    total: number;
  };
}

export class UsageTracker {
  private usageEvents: Map<string, UsageEvent[]> = new Map();

  /**
   * Track a usage event for billing and analytics
   */
  async trackUsage(tenantId: string, event: Omit<UsageEvent, 'tenantId'>): Promise<void> {
    const usageEvent: UsageEvent = {
      ...event,
      tenantId,
      timestamp: new Date()
    };

    // Store event
    const tenantEvents = this.usageEvents.get(tenantId) || [];
    tenantEvents.push(usageEvent);
    this.usageEvents.set(tenantId, tenantEvents);

    // Log for real-time monitoring
    console.log(`📊 Usage tracked: ${tenantId} - ${event.eventType} (${event.quantity}x ${event.resourceType})`);

    // In production, this would:
    // 1. Send to analytics pipeline
    // 2. Update real-time billing meters
    // 3. Trigger alerts if usage limits exceeded
    // 4. Update compliance monitoring dashboards
  }

  /**
   * Get usage metrics for a tenant within a time period
   */
  async getUsage(tenantId: string, startDate?: Date, endDate?: Date): Promise<UsageMetrics> {
    const events = this.usageEvents.get(tenantId) || [];
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    // Filter events by date range
    const filteredEvents = events.filter(event => 
      event.timestamp >= start && event.timestamp <= end
    );

    // Aggregate metrics
    const metrics = this.aggregateMetrics(filteredEvents);
    const costs = this.calculateCosts(tenantId, metrics);

    return {
      tenantId,
      period: { start, end },
      metrics,
      costs
    };
  }

  /**
   * Get real-time usage for dashboard
   */
  async getRealtimeUsage(tenantId: string): Promise<{
    claimsToday: number;
    apiCallsToday: number;
    activeUsersToday: number;
    lastActivity: Date | null;
  }> {
    const events = this.usageEvents.get(tenantId) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = events.filter(event => event.timestamp >= today);

    return {
      claimsToday: todayEvents
        .filter(e => e.eventType === 'claim_processed')
        .reduce((sum, e) => sum + e.quantity, 0),
      
      apiCallsToday: todayEvents
        .filter(e => e.eventType === 'api_call')
        .reduce((sum, e) => sum + e.quantity, 0),
      
      activeUsersToday: new Set(
        todayEvents
          .filter(e => e.userId)
          .map(e => e.userId)
      ).size,
      
      lastActivity: events.length > 0 
        ? events[events.length - 1].timestamp 
        : null
    };
  }

  /**
   * Check if tenant has exceeded usage limits
   */
  async checkUsageLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    warnings: string[];
    limits: Record<string, { current: number; limit: number; percentage: number }>;
  }> {
    const usage = await this.getUsage(tenantId);
    const limits = this.getTenantLimits(tenantId);
    
    const warnings: string[] = [];
    const limitStatus: Record<string, { current: number; limit: number; percentage: number }> = {};

    // Check each metric against limits
    Object.entries(limits).forEach(([metric, limit]) => {
      const current = usage.metrics[metric as keyof typeof usage.metrics] || 0;
      const percentage = (current / limit) * 100;
      
      limitStatus[metric] = { current, limit, percentage };
      
      if (percentage >= 90) {
        warnings.push(`${metric} usage at ${percentage.toFixed(1)}% of limit`);
      }
    });

    return {
      withinLimits: warnings.length === 0,
      warnings,
      limits: limitStatus
    };
  }

  /**
   * Aggregate usage metrics from events
   */
  private aggregateMetrics(events: UsageEvent[]): UsageMetrics['metrics'] {
    return {
      claimsProcessed: events
        .filter(e => e.eventType === 'claim_processed')
        .reduce((sum, e) => sum + e.quantity, 0),
      
      apiCalls: events
        .filter(e => e.eventType === 'api_call')
        .reduce((sum, e) => sum + e.quantity, 0),
      
      storageUsed: events
        .filter(e => e.eventType === 'storage_used')
        .reduce((max, e) => Math.max(max, e.quantity), 0),
      
      usersActive: new Set(
        events
          .filter(e => e.userId)
          .map(e => e.userId)
      ).size,
      
      transactionsProcessed: events
        .filter(e => e.eventType === 'transaction_processed')
        .reduce((sum, e) => sum + e.quantity, 0),
      
      aiPredictions: events
        .filter(e => e.eventType === 'ai_prediction')
        .reduce((sum, e) => sum + e.quantity, 0)
    };
  }

  /**
   * Calculate costs based on usage
   */
  private calculateCosts(tenantId: string, metrics: UsageMetrics['metrics']): UsageMetrics['costs'] {
    // Get tenant's plan pricing
    const pricing = this.getTenantPricing(tenantId);
    
    let basePlan = pricing.basePlan;
    let overageCharges = 0;

    // Calculate overage charges
    if (metrics.claimsProcessed > pricing.includedClaims) {
      overageCharges += (metrics.claimsProcessed - pricing.includedClaims) * pricing.perClaim;
    }
    
    if (metrics.apiCalls > pricing.includedApiCalls) {
      overageCharges += (metrics.apiCalls - pricing.includedApiCalls) * pricing.perApiCall;
    }
    
    if (metrics.storageUsed > pricing.includedStorage) {
      overageCharges += (metrics.storageUsed - pricing.includedStorage) * pricing.perGB;
    }

    return {
      basePlan,
      overageCharges,
      total: basePlan + overageCharges
    };
  }

  /**
   * Get tenant usage limits based on plan
   */
  private getTenantLimits(tenantId: string): Record<string, number> {
    // In production, this would fetch from tenant configuration
    return {
      claimsProcessed: 10000,
      apiCalls: 50000,
      storageUsed: 100, // GB
      usersActive: 50,
      transactionsProcessed: 5000,
      aiPredictions: 1000
    };
  }

  /**
   * Get tenant pricing configuration
   */
  private getTenantPricing(tenantId: string): {
    basePlan: number;
    includedClaims: number;
    includedApiCalls: number;
    includedStorage: number;
    perClaim: number;
    perApiCall: number;
    perGB: number;
  } {
    // In production, this would fetch from tenant configuration
    return {
      basePlan: 999, // SAR per month
      includedClaims: 5000,
      includedApiCalls: 25000,
      includedStorage: 50, // GB
      perClaim: 0.50, // SAR per additional claim
      perApiCall: 0.02, // SAR per additional API call
      perGB: 10 // SAR per additional GB
    };
  }
}