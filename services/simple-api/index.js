const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'brainsait-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Auth endpoints
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({
      success: true,
      token: 'demo-jwt-token',
      user: { email, role: 'admin', name: 'BrainSAIT User' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Tenants endpoints
app.get('/tenants', (req, res) => {
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
    },
    {
      id: '3',
      name: 'National Guard Hospital',
      plan: 'starter',
      status: 'active', 
      claimsProcessed: 3250,
      lastActivity: new Date().toISOString()
    }
  ];
  res.json({ success: true, data: tenants });
});

// Claims endpoints
app.get('/claims', (req, res) => {
  const claims = [
    {
      id: 'CLM-001',
      patientName: 'Ahmed Al-Rashid',
      amount: 2500.00,
      status: 'approved',
      submittedAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    },
    {
      id: 'CLM-002', 
      patientName: 'Fatima Al-Zahra',
      amount: 1800.00,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      processedAt: null
    },
    {
      id: 'CLM-003',
      patientName: 'Mohammed Al-Saud',
      amount: 3200.00,
      status: 'approved',
      submittedAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    }
  ];
  res.json({ success: true, data: claims });
});

app.post('/claims', (req, res) => {
  const { patientName, amount, diagnosis } = req.body;
  const newClaim = {
    id: `CLM-${Date.now()}`,
    patientName,
    amount,
    diagnosis,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    processedAt: null
  };
  res.json({ success: true, data: newClaim });
});

// Analytics endpoints
app.get('/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalClaims: 12345,
      activePatients: 8921,
      autoApproved: 9876,
      avgProcessingTime: '24s',
      monthlyGrowth: 12,
      approvalRate: 89.5
    }
  });
});

// NPHIES integration mock
app.get('/nphies/eligibility/:patientId', (req, res) => {
  const { patientId } = req.params;
  res.json({
    success: true,
    data: {
      patientId,
      eligible: true,
      coverage: 'Full Coverage',
      policyNumber: 'POL-' + patientId,
      expiryDate: '2025-12-31'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 BrainSAIT API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
