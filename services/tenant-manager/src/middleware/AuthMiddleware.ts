import express from 'express';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware with RBAC support
 * BrainSAIT Security Framework compliant
 */

interface User {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export class AuthMiddleware {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'brainsait-dev-secret';

  /**
   * Authentication middleware
   */
  static authenticate(req: express.Request, res: express.Response, next: express.NextFunction): void {
    // Skip authentication for health checks and public endpoints
    if (req.path === '/health' || req.path.startsWith('/public/')) {
      return next();
    }

    const token = AuthMiddleware.extractToken(req);
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const decoded = jwt.verify(token, AuthMiddleware.JWT_SECRET) as User;
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  /**
   * Role-based authorization middleware
   */
  static authorize(requiredRoles: string[]) {
    return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
      
      if (!hasRequiredRole) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredRoles,
          current: user.roles 
        });
        return;
      }

      next();
    };
  }

  /**
   * Permission-based authorization middleware
   */
  static requirePermission(permission: string) {
    return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!user.permissions.includes(permission)) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission 
        });
        return;
      }

      next();
    };
  }

  /**
   * Tenant isolation middleware
   */
  static ensureTenantAccess(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const user = req.user;
    const tenantId = req.params.id || req.body.tenantId;
    
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Super admin can access all tenants
    if (user.roles.includes('super_admin')) {
      return next();
    }

    // Check if user belongs to the requested tenant
    if (user.tenantId !== tenantId) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    next();
  }

  /**
   * Extract JWT token from request
   */
  private static extractToken(req: express.Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check for token in cookies (for web sessions)
    if (req.cookies && req.cookies.auth_token) {
      return req.cookies.auth_token;
    }
    
    return null;
  }

  /**
   * Generate JWT token for user
   */
  static generateToken(user: Omit<User, 'id'> & { id: string }): string {
    return jwt.sign(
      {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions
      },
      AuthMiddleware.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'brainsait-digital-insurance',
        audience: 'nphies-pro-platform'
      }
    );
  }

  /**
   * Audit log for authentication events
   */
  static logAuthEvent(event: string, user: User | null, req: express.Request): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: user?.id,
      tenantId: user?.tenantId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    };
    
    // In production, this would go to a secure audit log service
    console.log('🔐 AUTH EVENT:', JSON.stringify(logEntry));
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}