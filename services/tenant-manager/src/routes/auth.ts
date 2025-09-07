import { Router } from 'express';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    // Simple auth for demo
    const { email, password } = req.body;
    
    if (email && password) {
      res.json({
        success: true,
        token: 'demo-jwt-token',
        user: { email, role: 'admin' }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export { router as authRouter };
