import { Router } from 'express';

import { authRouter } from './auth';
import { tenantsRouter } from './tenants';
import { claimsRouter } from './claims';
import { analyticsRouter } from './analytics';
import { nphiesRouter } from './nphies';
import { healthRouter } from './health';

export function buildApiRouter(): Router {
  const router: Router = Router();

  router.use('/health', healthRouter);
  router.use('/auth', authRouter);
  router.use('/tenants', tenantsRouter);
  router.use('/claims', claimsRouter);
  router.use('/analytics', analyticsRouter);
  router.use('/nphies', nphiesRouter);

  return router;
}
