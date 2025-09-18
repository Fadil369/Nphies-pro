import { RequestHandler } from 'express';
import { auditLog } from './auditLogger';

export function hipaaCompliant({ auditPhi }: { auditPhi: boolean }): RequestHandler {
  return (req, res, next) => {
    const finish = res.json.bind(res);
    res.json = (body: unknown) => {
      void auditLog({
        action: `response:${req.method}:${req.path}`,
        userId: req.user?.id ?? 'anonymous',
        resourceType: 'API',
        resourceId: req.path,
        phiInvolved: auditPhi,
      });
      return finish(body);
    };

    next();
  };
}
