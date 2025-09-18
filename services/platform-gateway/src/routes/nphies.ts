import { Router } from 'express';

import { auditLog } from '../brainsait/auditLogger';
import { requireScope } from '../brainsait/rbac';
import { validateSaudiId } from '../brainsait/nphies';

const router: Router = Router();

router.get('/eligibility/:patientId', requireScope(['claims.write']), (req, res) => {
  const { patientId } = req.params;
  const nationalId = req.query.nationalId as string | undefined;

  if (!validateSaudiId(nationalId)) {
    void auditLog({
      action: 'nphies:eligibility:failed',
      userId: req.user?.id ?? 'anonymous',
      resourceType: 'nphies',
      resourceId: patientId,
      phiInvolved: true,
      meta: { reason: 'invalid_saudi_id' },
    });

    return res.status(400).json({ success: false, error: 'Invalid Saudi ID/Iqama' });
  }

  void auditLog({
    action: 'nphies:eligibility',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'nphies',
    resourceId: patientId,
    phiInvolved: true,
  });

  return res.json({
    success: true,
    data: {
      patientId,
      eligible: true,
      coverage: 'Full Coverage',
      policyNumber: `POL-${patientId}`,
      expiryDate: '2025-12-31',
    },
  });
});

export { router as nphiesRouter };
