import type { Request, Response, NextFunction } from 'express';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

const registry = new Registry();
collectDefaultMetrics({ register: registry });

const httpRequestDurationSeconds = new Histogram({
  name: 'platform_gateway_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = httpRequestDurationSeconds.startTimer({
    method: req.method,
    route: req.route?.path ?? req.path,
  });

  res.on('finish', () => {
    end({ status_code: String(res.statusCode) });
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.set('Content-Type', registry.contentType);
  res.send(await registry.metrics());
}
