import { Router } from 'express';

import { auditLog } from '../brainsait/auditLogger';
import { ROLES_TO_SCOPES } from '../brainsait/rbac';

const router: Router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await auditLog({
    action: 'login',
    userId: email,
    resourceType: 'auth',
    resourceId: 'login',
    phiInvolved: false,
  });

  return res.json({
    success: true,
    token: 'demo-jwt-token',
    user: { email, role: 'admin' },
  });
});

router.post('/logout', async (req, res) => {
  await auditLog({
    action: 'logout',
    userId: req.user?.id ?? 'anonymous',
    resourceType: 'auth',
    resourceId: 'logout',
    phiInvolved: false,
  });

  return res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/session', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthenticated' });
  }

  return res.json({ success: true, data: req.user });
});

router.post('/mock-role', (req, res) => {
  const { role } = req.body as { role?: string };
  if (!role || !ROLES_TO_SCOPES[role]) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }

  res.cookie('mock_role', role, { httpOnly: false });
  return res.json({ success: true, message: `Role set to ${role}` });
});

export { router as authRouter };
