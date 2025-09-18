import { RequestHandler } from 'express';

export const ROLES_TO_SCOPES: Record<string, string[]> = {
  doctor: ['claims.read', 'claims.write', 'analytics.read'],
  nurse: ['claims.read', 'analytics.read'],
  provider_biller: ['claims.read', 'claims.write', 'analytics.read', 'exports.write'],
  insurer_analyst: ['claims.read', 'analytics.read', 'exports.write'],
  analytics_viewer: ['analytics.read'],
  admin: [
    'claims.read',
    'claims.write',
    'analytics.read',
    'exports.write',
    'audit.read',
    'admin.manage',
  ],
  auditor: ['claims.read', 'analytics.read', 'audit.read'],
  claim_adjuster: ['claims.read', 'claims.write', 'analytics.read'],
  patient: ['claims.read'],
};

export interface RequestUser {
  id: string;
  role: keyof typeof ROLES_TO_SCOPES;
  scopes: string[];
}

export const mockUserMiddleware: RequestHandler = (req, _res, next) => {
  const headerRole = req.header('x-mock-role');
  const cookieRole = req.cookies?.mock_role;
  const requestedRole = (headerRole || cookieRole || 'provider_biller') as keyof typeof ROLES_TO_SCOPES;
  const role = ROLES_TO_SCOPES[requestedRole] ? requestedRole : 'provider_biller';
  req.user = {
    id: 'user-001',
    role,
    scopes: ROLES_TO_SCOPES[role],
  };
  next();
};

export function requireScope(requiredScopes: string[]): RequestHandler {
  return (req, res, next) => {
    const scopes = req.user?.scopes ?? [];
    if (!requiredScopes.some((scope) => scopes.includes(scope))) {
      return res.status(403).json({ error: 'Insufficient scope', requiredScopes });
    }
    return next();
  };
}
