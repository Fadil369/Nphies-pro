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
      patientId: 'PAT-2024-001',
      nationalId: '1234567890',
      amount: 2500.00,
      status: 'approved',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      processedAt: new Date(Date.now() - 43200000).toISOString(),
      diagnosis: 'Hypertension follow-up',
      procedures: ['Blood pressure monitoring', 'ECG', 'Blood tests'],
      provider: 'King Fahd Medical City',
      insurancePolicy: 'POL-KF-2024-001',
      nphiesStatus: 'verified',
      preAuthRequired: false
    },
    {
      id: 'CLM-002',
      patientName: 'Fatima Al-Zahra',
      patientId: 'PAT-2024-002', 
      nationalId: '0987654321',
      amount: 1800.00,
      status: 'pending',
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      processedAt: null,
      diagnosis: 'Diabetes Type 2 management',
      procedures: ['HbA1c test', 'Consultation', 'Medication review'],
      provider: 'Saudi German Hospital',
      insurancePolicy: 'POL-SG-2024-002',
      nphiesStatus: 'pending_verification',
      preAuthRequired: true
    },
    {
      id: 'CLM-003',
      patientName: 'Mohammed Al-Saud',
      patientId: 'PAT-2024-003',
      nationalId: '1122334455',
      amount: 3200.00,
      status: 'approved',
      submittedAt: new Date(Date.now() - 172800000).toISOString(),
      processedAt: new Date(Date.now() - 86400000).toISOString(),
      diagnosis: 'Cardiac catheterization',
      procedures: ['Cardiac catheterization', 'Angiography', 'Post-procedure monitoring'],
      provider: 'National Guard Hospital',
      insurancePolicy: 'POL-NG-2024-003',
      nphiesStatus: 'verified',
      preAuthRequired: true
    }
  ];
  res.json({ success: true, data: claims });
});

app.get('/claims/:id', (req, res) => {
  const { id } = req.params;
  const claims = [
    {
      id: 'CLM-001',
      patientName: 'Ahmed Al-Rashid',
      patientId: 'PAT-2024-001',
      nationalId: '1234567890',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      phone: '+966501234567',
      email: 'ahmed.rashid@email.com',
      amount: 2500.00,
      status: 'approved',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      processedAt: new Date(Date.now() - 43200000).toISOString(),
      diagnosis: 'Essential hypertension (I10)',
      procedures: [
        { code: '99213', description: 'Office visit - established patient', amount: 800.00 },
        { code: '93000', description: 'Electrocardiogram', amount: 300.00 },
        { code: '80053', description: 'Comprehensive metabolic panel', amount: 400.00 },
        { code: '85025', description: 'Complete blood count', amount: 200.00 }
      ],
      provider: {
        name: 'King Fahd Medical City',
        id: 'PROV-KFMC-001',
        department: 'Cardiology',
        physician: 'Dr. Khalid Al-Mansouri'
      },
      insurance: {
        policyNumber: 'POL-KF-2024-001',
        company: 'Bupa Arabia',
        coverage: 'Comprehensive',
        copay: 250.00,
        deductible: 500.00,
        remainingBenefit: 45000.00
      },
      nphies: {
        status: 'verified',
        eligibilityId: 'ELG-2024-001',
        verificationDate: new Date(Date.now() - 86400000).toISOString(),
        coverageDetails: 'Full coverage approved'
      },
      processingHistory: [
        { date: new Date(Date.now() - 86400000).toISOString(), action: 'Claim submitted', user: 'System' },
        { date: new Date(Date.now() - 82800000).toISOString(), action: 'NPHIES verification initiated', user: 'Auto' },
        { date: new Date(Date.now() - 79200000).toISOString(), action: 'Eligibility verified', user: 'NPHIES' },
        { date: new Date(Date.now() - 75600000).toISOString(), action: 'Medical review completed', user: 'Dr. Sarah Al-Zahra' },
        { date: new Date(Date.now() - 43200000).toISOString(), action: 'Claim approved', user: 'AI Engine' }
      ]
    },
    {
      id: 'CLM-002',
      patientName: 'Fatima Al-Zahra',
      patientId: 'PAT-2024-002',
      nationalId: '0987654321',
      dateOfBirth: '1978-07-22',
      gender: 'Female',
      phone: '+966502345678',
      email: 'fatima.zahra@email.com',
      amount: 1800.00,
      status: 'pending',
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      processedAt: null,
      diagnosis: 'Type 2 diabetes mellitus (E11.9)',
      procedures: [
        { code: '99214', description: 'Office visit - detailed', amount: 1000.00 },
        { code: '83036', description: 'Hemoglobin A1c', amount: 300.00 },
        { code: '80053', description: 'Comprehensive metabolic panel', amount: 400.00 },
        { code: '99401', description: 'Preventive counseling', amount: 100.00 }
      ],
      provider: {
        name: 'Saudi German Hospital',
        id: 'PROV-SGH-002',
        department: 'Endocrinology',
        physician: 'Dr. Amira Hassan'
      },
      insurance: {
        policyNumber: 'POL-SG-2024-002',
        company: 'Tawuniya',
        coverage: 'Standard',
        copay: 180.00,
        deductible: 1000.00,
        remainingBenefit: 28000.00
      },
      nphies: {
        status: 'pending_verification',
        eligibilityId: 'ELG-2024-002',
        verificationDate: null,
        coverageDetails: 'Awaiting pre-authorization'
      },
      processingHistory: [
        { date: new Date(Date.now() - 3600000).toISOString(), action: 'Claim submitted', user: 'System' },
        { date: new Date(Date.now() - 3300000).toISOString(), action: 'Pre-authorization required', user: 'Auto' },
        { date: new Date(Date.now() - 1800000).toISOString(), action: 'NPHIES verification initiated', user: 'Auto' }
      ]
    }
  ];
  
  const claim = claims.find(c => c.id === id);
  if (claim) {
    res.json({ success: true, data: claim });
  } else {
    res.status(404).json({ success: false, error: 'Claim not found' });
  }
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
