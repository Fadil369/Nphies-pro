import { Router } from 'express';

import { auditLog } from '../brainsait/auditLogger';
import { requireScope } from '../brainsait/rbac';
import { prisma } from '../db/client';

const router: Router = Router();

router.get('/dashboard', requireScope(['analytics.read']), async (req, res) => {
  const { from, to, plan } = req.query as {
    from?: string;
    to?: string;
    plan?: string;
  };

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const planFilter = plan && plan !== 'all' ? plan : undefined;

  const claims = await prisma.claim.findMany({
    orderBy: { submittedAt: 'asc' },
    include: {
      tenant: { select: { id: true, name: true, plan: true } },
    },
  });

  const filteredClaims = claims.filter((claim) => {
    const submitted = claim.submittedAt ?? claim.createdAt ?? new Date();
    const afterFrom = !fromDate || submitted >= fromDate;
    const beforeTo = !toDate || submitted <= toDate;
    const matchesPlan = !planFilter || claim.tenant?.plan === planFilter;
    return afterFrom && beforeTo && matchesPlan;
  });

  const totalClaims = filteredClaims.length;
  const autoApproved = filteredClaims.filter((claim) => claim.status === 'approved').length;
  const activePatients = new Set(filteredClaims.map((claim) => claim.patientId)).size;
  const avgProcessingTime = (() => {
    const durations = filteredClaims
      .filter((claim) => claim.processedAt)
      .map((claim) => (claim.processedAt!.getTime() - claim.submittedAt.getTime()) / 1000);
    if (durations.length === 0) return '0s';
    const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    return `${Math.round(avg)}s`;
  })();

 const approvalRate = totalClaims === 0 ? 0 : Number(((autoApproved / totalClaims) * 100).toFixed(1));

  const trendBuckets = new Map<
    string,
    { name: string; monthIndex: number; approved: number; pending: number; rejected: number }
  >();
  filteredClaims.forEach((claim) => {
    const submitted = claim.submittedAt ?? new Date();
    const key = submitted.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const index = submitted.getFullYear() * 12 + submitted.getMonth();

    if (!trendBuckets.has(key)) {
      trendBuckets.set(key, { name: key, monthIndex: index, approved: 0, pending: 0, rejected: 0 });
    }

    const bucket = trendBuckets.get(key)!;
    if (claim.status === 'approved') bucket.approved += 1;
    else if (claim.status === 'pending') bucket.pending += 1;
    else if (claim.status === 'rejected') bucket.rejected += 1;
  });

  const statusTrends = Array.from(trendBuckets.values())
    .sort((a, b) => a.monthIndex - b.monthIndex)
    .map(({ monthIndex, ...rest }) => rest)
    .slice(-6);

  const tenantBuckets = new Map<
    string,
    {
      id: string;
      name: string;
      plan: string;
      total: number;
      approved: number;
      rejected: number;
      pending: number;
    }
  >();

  filteredClaims.forEach((claim) => {
    const tenantId = claim.tenantId;
    if (!tenantBuckets.has(tenantId)) {
      tenantBuckets.set(tenantId, {
        id: tenantId,
        name: claim.tenant?.name ?? 'Unknown tenant',
        plan: claim.tenant?.plan ?? 'unknown',
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      });
    }

    const bucket = tenantBuckets.get(tenantId)!;
    bucket.total += 1;
    if (claim.status === 'approved') bucket.approved += 1;
    else if (claim.status === 'rejected') bucket.rejected += 1;
    else if (claim.status === 'pending') bucket.pending += 1;
  });

 const tenantLeaderboard = Array.from(tenantBuckets.values())
   .map((tenant) => ({
     ...tenant,
     approvalRate: tenant.total === 0 ? 0 : (tenant.approved / tenant.total) * 100,
   }))
   .sort((a, b) => b.total - a.total)
   .slice(0, 5);

  const insights: string[] = [];
  if (tenantLeaderboard.length > 0) {
    const lowestApproval = tenantLeaderboard
      .filter((entry) => entry.total >= 10)
      .sort((a, b) => a.approvalRate - b.approvalRate)[0];
    if (lowestApproval && lowestApproval.approvalRate < 70) {
      insights.push(
        `Tenant ${lowestApproval.name} has a low approval rate (${lowestApproval.approvalRate.toFixed(1)}%) — consider reviewing rejection reasons.`,
      );
    }
    const highestPending = tenantLeaderboard
      .filter((entry) => entry.pending > 0)
      .sort((a, b) => b.pending - a.pending)[0];
    if (highestPending) {
      insights.push(
        `Tenant ${highestPending.name} has ${highestPending.pending} pending claims awaiting action.`,
      );
    }
  }
  if (statusTrends.length >= 2) {
    const trendDelta = statusTrends[statusTrends.length - 1].rejected - statusTrends[statusTrends.length - 2].rejected;
    if (trendDelta > 5) {
      insights.push('Rejected claims increased week-over-week — investigate policy or data changes.');
    }
  }

  void auditLog({
    action: 'analytics:dashboard',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'analytics',
    resourceId: 'dashboard',
    phi_involved: false,
  });

  res.json({
    success: true,
    data: {
      totalClaims,
      activePatients,
      autoApproved,
      avgProcessingTime,
      monthlyGrowth: 12,
      approvalRate,
      statusTrends,
      tenantLeaderboard,
      insights,
    },
  });
});

export { router as analyticsRouter };
