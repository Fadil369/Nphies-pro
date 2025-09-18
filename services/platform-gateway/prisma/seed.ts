import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  if (tenants.length > 0) {
    return;
  }

  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'King Fahd Medical City',
      plan: 'enterprise',
      claimsProcessed: 15420,
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Saudi German Hospital',
      plan: 'professional',
      claimsProcessed: 8930,
    },
  });

  await prisma.claim.createMany({
    data: [
      {
        tenantId: tenant1.id,
        patientName: 'Ahmed Al-Rashid',
        patientId: 'PAT-2024-001',
        nationalId: '1234567890',
        amount: 2500,
        status: 'approved',
        submittedAt: new Date(Date.now() - 86_400_000),
        processedAt: new Date(Date.now() - 43_200_000),
        diagnosis: 'Hypertension follow-up',
        procedures: JSON.stringify(['Blood pressure monitoring', 'ECG', 'Blood tests']),
        provider: 'King Fahd Medical City',
        insurancePolicy: 'POL-KF-2024-001',
        nphiesStatus: 'verified',
        preAuthRequired: false,
      },
      {
        tenantId: tenant2.id,
        patientName: 'Fatima Al-Zahra',
        patientId: 'PAT-2024-002',
        nationalId: '0987654321',
        amount: 1800,
        status: 'pending',
        submittedAt: new Date(Date.now() - 3_600_000),
        processedAt: null,
        diagnosis: 'Diabetes Type 2 management',
        procedures: JSON.stringify(['HbA1c test', 'Consultation', 'Medication review']),
        provider: 'Saudi German Hospital',
        insurancePolicy: 'POL-SG-2024-002',
        nphiesStatus: 'pending_verification',
        preAuthRequired: true,
      },
    ],
  });

  const claims = await prisma.claim.findMany();
  await prisma.claimActivity.createMany({
    data: claims.flatMap((claim) => [
      {
        claimId: claim.id,
        tenantId: claim.tenantId,
        type: 'created',
        message: 'Claim created',
      },
      {
        claimId: claim.id,
        tenantId: claim.tenantId,
        type: 'status',
        message: `Status set to ${claim.status}`,
      },
      {
        claimId: claim.id,
        tenantId: claim.tenantId,
        type: 'ai_decision',
        message: 'AI engine evaluated the claim',
      },
      {
        claimId: claim.id,
        tenantId: claim.tenantId,
        type: 'note',
        message: 'Manual note: verify supporting documents',
      },
    ]),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
