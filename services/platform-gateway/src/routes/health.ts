import { Router } from 'express';

const router: Router = Router();

router.get('/', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      service: 'platform-gateway',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'platform-gateway',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

export { router as healthRouter };
