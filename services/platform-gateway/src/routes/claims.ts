import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { auditLog } from '../brainsait/auditLogger';
import { requireScope } from '../brainsait/rbac';
import { prisma } from '../db/client';

const router: Router = Router();

router.get('/', requireScope(['claims.read']), async (req, res) => {
  const tenantId = req.query.tenantId as string | undefined;

  const claims = await prisma.claim.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { submittedAt: 'desc' },
  });

  void auditLog({
    action: 'claims:list',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'claim',
    resourceId: 'list',
    phiInvolved: true,
  });

  res.json({ success: true, data: claims });
});

router.get('/:id', requireScope(['claims.read']), async (req, res) => {
  const claim = await prisma.claim.findUnique({ where: { id: req.params.id } });
  if (!claim) {
    return res.status(404).json({ success: false, error: 'Claim not found' });
  }

  void auditLog({
    action: 'claims:get',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'claim',
    resourceId: claim.id,
    phiInvolved: true,
  });

  return res.json({ success: true, data: claim });
});

router.post('/', requireScope(['claims.write']), async (req, res) => {
  const {
    tenantId,
    patientName,
    patientId,
    nationalId,
    amount,
    diagnosis,
    procedures,
    provider,
    insurancePolicy,
    preAuthRequired,
  } = req.body as Record<string, unknown>;

  if (!tenantId || !patientName || !patientId || !nationalId || !amount || !diagnosis) {
    return res.status(400).json({ success: false, error: 'Missing claim fields' });
  }

  const claim = await prisma.claim.create({
    data: {
      tenantId: tenantId as string,
      patientName: patientName as string,
      patientId: patientId as string,
      nationalId: nationalId as string,
      amount: Number(amount),
      diagnosis: diagnosis as string,
      status: 'pending',
      submittedAt: new Date(),
      processedAt: null,
      procedures: JSON.stringify(procedures ?? []),
      provider: (provider as string) ?? 'Unknown',
      insurancePolicy: (insurancePolicy as string) ?? 'Unknown',
      nphiesStatus: 'pending_verification',
      preAuthRequired: Boolean(preAuthRequired),
    },
  });

  void auditLog({
    action: 'claims:create',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'claim',
    resourceId: claim.id,
    phiInvolved: true,
  });

  await prisma.claimActivity.create({
    data: {
      claimId: claim.id,
      tenantId: claim.tenantId,
      type: 'created',
      message: 'Claim created',
    },
  });

  return res.json({ success: true, data: claim });
});

router.patch('/:id/status', requireScope(['claims.write']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  const claim = await prisma.claim.findUnique({ where: { id } });
  if (!claim) {
    return res.status(404).json({ success: false, error: 'Claim not found' });
  }

  const updated = await prisma.claim.update({
    where: { id },
    data: {
      status,
      processedAt: status === 'approved' || status === 'rejected' ? new Date() : null,
      updatedAt: new Date(),
    },
  });

  void auditLog({
    action: 'claims:update-status',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'claim',
    resourceId: id,
    phiInvolved: true,
    meta: { status },
  });

  await prisma.claimActivity.create({
    data: {
      claimId: updated.id,
      tenantId: updated.tenantId,
      type: 'status',
      message: `Status updated to ${status}`,
    },
  });

  return res.json({ success: true, data: updated });
});

router.get('/:id/activity', requireScope(['claims.read']), async (req, res) => {
  const { id } = req.params;

  const claim = await prisma.claim.findUnique({ where: { id } });
  if (!claim) {
    return res.status(404).json({ success: false, error: 'Claim not found' });
  }

  const activities = await prisma.claimActivity.findMany({
    where: { claimId: id },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ success: true, data: activities });
});

router.post('/:id/activity', requireScope(['claims.write']), async (req, res) => {
  const { id } = req.params;
  const { message } = req.body as { message?: string };

  if (!message || message.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const claim = await prisma.claim.findUnique({ where: { id } });
  if (!claim) {
    return res.status(404).json({ success: false, error: 'Claim not found' });
  }

  const activity = await prisma.claimActivity.create({
    data: {
      claimId: claim.id,
      tenantId: claim.tenantId,
      type: 'note',
      message: message.trim(),
    },
  });

  void auditLog({
    action: 'claims:add-note',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'claim',
    resourceId: claim.id,
    phiInvolved: true,
    meta: { message: message.trim().slice(0, 80) },
  });

  return res.status(201).json({ success: true, data: activity });
});

export { router as claimsRouter };
