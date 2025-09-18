import { Router } from 'express';

import { prisma } from '../db/client';
import { auditLog } from '../brainsait/auditLogger';
import { requireScope } from '../brainsait/rbac';

const router: Router = Router();

router.get('/', requireScope(['claims.read']), async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
  });

  void auditLog({
    action: 'tenants:list',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'tenant',
    resourceId: 'list',
    phiInvolved: false,
  });

  res.json({ success: true, data: tenants });
});

router.post('/', requireScope(['claims.write']), async (req, res) => {
  const { name, plan } = req.body as { name?: string; plan?: string };

  if (!name || !plan) {
    return res.status(400).json({ error: 'Missing tenant fields' });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      plan,
    },
  });

  void auditLog({
    action: 'tenants:create',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'tenant',
    resourceId: tenant.id,
    phiInvolved: false,
  });

  return res.json({ success: true, data: tenant });
});

router.get('/:id', requireScope(['claims.read']), async (req, res) => {
  const { id } = req.params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      claims: {
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }

  const totalClaims = tenant.claims.length;
  const approvedClaims = tenant.claims.filter((claim) => claim.status === 'approved').length;
  const rejectedClaims = tenant.claims.filter((claim) => claim.status === 'rejected').length;
  const pendingClaims = tenant.claims.filter((claim) => claim.status === 'pending').length;

  const avgProcessingSeconds = (() => {
    const durations = tenant.claims
      .filter((claim) => claim.processedAt)
      .map((claim) =>
        (claim.processedAt!.getTime() - claim.submittedAt.getTime()) / 1000,
      );
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
  })();

  const activities = await prisma.claimActivity.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      claim: {
        select: {
          id: true,
          patientName: true,
        },
      },
    },
  });

  const payload = {
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    claimsProcessed: tenant.claimsProcessed,
    lastActivity: tenant.lastActivity,
    metrics: {
      totalClaims,
      approvedClaims,
      rejectedClaims,
      pendingClaims,
      approvalRate: totalClaims === 0 ? 0 : (approvedClaims / totalClaims) * 100,
      avgProcessingSeconds,
    },
    recentClaims: tenant.claims.slice(0, 20),
    recentActivities: activities.map((entry) => ({
      id: entry.id,
      claimId: entry.claimId,
      patientName: entry.claim?.patientName ?? '',
      type: entry.type,
      message: entry.message,
      createdAt: entry.createdAt,
    })),
  };

  void auditLog({
    action: 'tenants:get-detail',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'tenant',
    resourceId: tenant.id,
    phiInvolved: false,
  });

  return res.json({ success: true, data: payload });
});

export { router as tenantsRouter };
