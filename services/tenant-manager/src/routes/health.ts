import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      service: 'tenant-manager',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'tenant-manager',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

export { router as healthRouter };
