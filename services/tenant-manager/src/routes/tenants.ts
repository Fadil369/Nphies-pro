import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Demo tenant data
    const tenants = [
      {
        id: '1',
        name: 'King Fahd Medical City',
        plan: 'enterprise',
        status: 'active',
        claimsProcessed: 15420,
        lastActivity: new Date().toISOString()
      },
      {
        id: '2', 
        name: 'Saudi German Hospital',
        plan: 'professional',
        status: 'active',
        claimsProcessed: 8930,
        lastActivity: new Date().toISOString()
      }
    ];
    
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, plan } = req.body;
    
    const newTenant = {
      id: Date.now().toString(),
      name,
      plan,
      status: 'active',
      claimsProcessed: 0,
      lastActivity: new Date().toISOString()
    };
    
    res.json({ success: true, data: newTenant });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

export { router as tenantsRouter };
