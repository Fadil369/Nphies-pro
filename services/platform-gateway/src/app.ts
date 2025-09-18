import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import helmet from 'helmet';

import { mockUserMiddleware } from './brainsait/rbac';
import { metricsHandler, metricsMiddleware } from './metrics';
import { buildApiRouter } from './routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(metricsMiddleware);

  // TODO: replace with real JWT/OIDC middleware once available.
  app.use(mockUserMiddleware);

  app.use('/api', buildApiRouter());
  app.get('/metrics', metricsHandler);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('API error', err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
